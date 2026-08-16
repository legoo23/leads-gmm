import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"
import { assertLicense } from "@/lib/license"
import { encryptField, hashField } from "@/lib/crypto"
import { normalizePhone, normalizeEmail, normalizeCurp, generateFolio } from "@/lib/utils"
import { extractIP, logAudit } from "@/lib/audit"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Rate limiting: máx 5 envíos por IP cada 10 min
const RL_MAP = new Map<string, { n: number; reset: number }>()
function checkRateLimit(ip: string): boolean {
  const now = Date.now(); const WINDOW = 10 * 60 * 1000; const MAX = 5
  const entry = RL_MAP.get(ip)
  if (entry) {
    if (now < entry.reset) { if (entry.n >= MAX) return false; entry.n++; return true }
  }
  RL_MAP.set(ip, { n: 1, reset: now + WINDOW }); return true
}

// ── GET — datos públicos del convenio ─────────────────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  assertLicense()
  const { slug } = await params
  const svc = createServiceClient()

  const { data: empresa, error } = await svc
    .from("empresas")
    .select("id, nombre, descripcion_landing, logo_path, vigencia_inicio, vigencia_fin, campos_formulario, activa")
    .eq("slug", slug.toLowerCase())
    .single()

  if (error || !empresa || !empresa.activa) {
    return NextResponse.json({ error: "Convenio no encontrado" }, { status: 404 })
  }

  // Verificar vigencia
  const now = new Date()
  if (empresa.vigencia_fin && new Date(empresa.vigencia_fin) < now) {
    return NextResponse.json({ error: "Este convenio ha vencido" }, { status: 410 })
  }

  const { data: servicios } = await svc
    .from("servicios_convenio")
    .select("id, nombre, descripcion, icono, precio_regular, precio_convenio, pct_descuento, tipo")
    .eq("id_empresa", empresa.id)
    .eq("activo", true)
    .order("orden")

  const logoUrl = empresa.logo_path
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/logos-convenio/${empresa.logo_path}`
    : null

  return NextResponse.json({
    empresa: {
      id:                  empresa.id,
      nombre:              empresa.nombre,
      descripcion_landing: empresa.descripcion_landing,
      logo_url:            logoUrl,
      vigencia_inicio:     empresa.vigencia_inicio,
      vigencia_fin:        empresa.vigencia_fin,
      campos_formulario:   empresa.campos_formulario ?? [],
    },
    servicios: servicios ?? [],
  })
}

// ── POST — crear lead desde formulario del convenio ───────────────────────────

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  assertLicense()

  const ip = extractIP(req) ?? "unknown"
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: "Demasiados envíos. Intenta en unos minutos." }, { status: 429 })
  }

  const { slug } = await params
  const svc = createServiceClient()

  // Verificar que el convenio existe y está activo
  const { data: empresa, error: eError } = await svc
    .from("empresas")
    .select("id, nombre, activa, campos_formulario, vigencia_fin")
    .eq("slug", slug.toLowerCase())
    .single()

  if (eError || !empresa || !empresa.activa) {
    return NextResponse.json({ error: "Convenio no válido" }, { status: 400 })
  }

  if (empresa.vigencia_fin && new Date(empresa.vigencia_fin) < new Date()) {
    return NextResponse.json({ error: "Este convenio ha vencido" }, { status: 410 })
  }

  let body: Record<string, unknown>
  try { body = await req.json() }
  catch { return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 }) }

  // Honeypot — bots llenan este campo; usuarios reales lo dejan vacío
  if (String(body._gotcha ?? "").trim()) {
    return NextResponse.json({ folio: generateFolio() }, { status: 201 })
  }

  // Campos requeridos según configuración del convenio
  const campos: Array<{ campo: string; etiqueta: string; tipo: string; requerido: boolean }> =
    Array.isArray(empresa.campos_formulario) ? empresa.campos_formulario : []

  // Validar campos requeridos
  const camposEstandar = new Set(["nombre", "apellido_paterno", "apellido_materno", "telefono", "email",
    "fecha_nacimiento", "curp", "estado_ciudad"])

  for (const campo of campos) {
    if (!campo.requerido) continue
    const val = String(body[campo.campo] ?? "").trim()
    if (!val) return NextResponse.json({ error: `El campo "${campo.etiqueta}" es requerido` }, { status: 400 })
  }

  const nombre = String(body.nombre ?? "").trim().toUpperCase()
  if (!nombre) return NextResponse.json({ error: "El nombre es requerido" }, { status: 400 })

  const apellidoPaterno = String(body.apellido_paterno ?? "").trim().toUpperCase()
  if (!apellidoPaterno) return NextResponse.json({ error: "El apellido paterno es requerido" }, { status: 400 })

  const telefono = normalizePhone(body.telefono)
  if (!telefono) return NextResponse.json({ error: "El teléfono debe tener exactamente 10 dígitos" }, { status: 400 })

  const emailRaw = normalizeEmail(body.email)
  if (emailRaw && !EMAIL_RE.test(emailRaw)) {
    return NextResponse.json({ error: "El correo electrónico no es válido" }, { status: 400 })
  }

  if (!body.acepta_privacidad) {
    return NextResponse.json({ error: "Debes aceptar el Aviso de Privacidad para continuar" }, { status: 400 })
  }

  // Separar campos adicionales (no estándar) para datos_adicionales
  const datosAdicionales: Record<string, string> = {}
  for (const campo of campos) {
    if (!camposEstandar.has(campo.campo) && body[campo.campo] != null) {
      datosAdicionales[campo.campo] = String(body[campo.campo]).trim()
    }
  }

  const folio = generateFolio()

  const { data, error } = await svc.from("leads").insert({
    folio,
    nombre,
    apellido_paterno:  apellidoPaterno,
    apellido_materno:  String(body.apellido_materno ?? "").trim().toUpperCase() || null,
    telefono_enc:      encryptField(telefono),
    telefono_hash:     hashField(telefono),
    ...(emailRaw ? { email_enc: encryptField(emailRaw), email_hash: hashField(emailRaw) } : {}),
    fecha_nacimiento:  body.fecha_nacimiento || null,
    estado_ciudad:     body.estado_ciudad    || null,
    ...(body.curp ? (() => { const c = normalizeCurp(body.curp); return c ? { curp_enc: encryptField(c), curp_hash: hashField(c) } : {} })() : {}),
    notas:             body.notas            || null,
    id_empresa:        empresa.id,
    fuente:            "convenio",
    prioridad:         "media",
    etapa:             "nuevo",
    estado:            "activo",
    en_cola_revision:  false,
    datos_adicionales: Object.keys(datosAdicionales).length > 0 ? datosAdicionales : null,
  }).select("folio").single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await logAudit({
    accion: "lead_convenio_creado",
    tabla:  "leads",
    id_registro: data.folio,
    ip,
    metadata: { empresa_id: empresa.id, empresa: empresa.nombre, slug },
  })

  return NextResponse.json({ folio: data.folio }, { status: 201 })
}
