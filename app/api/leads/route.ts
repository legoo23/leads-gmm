import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"
import { encryptField, hashField } from "@/lib/crypto"
import { logAudit, sanitizeLimit } from "@/lib/audit"
import { normalizePhone, normalizeEmail, normalizeCurp, generateFolio } from "@/lib/utils"
import { assertLicense } from "@/lib/license"
import { createClient } from "@/lib/supabase/server"

export async function GET(req: NextRequest) {
  assertLicense()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { data: profile } = await supabase.from("user_profiles").select("rol").eq("id", user.id).single()
  const rol = profile?.rol ?? "agente"

  const sp = req.nextUrl.searchParams
  const limit = sanitizeLimit(sp.get("limit"), 25)
  const offset = parseInt(sp.get("offset") ?? "0")
  const etapa = sp.get("etapa")
  const rawSearch = sp.get("q")
  const search = rawSearch ? rawSearch.replace(/,/g, "").trim() : null

  const svc = await createServiceClient()

  // Main data query — no count here (joins make count slow)
  let dataQuery = svc.from("leads")
    .select(`
      id, folio, nombre, apellido_paterno, apellido_materno,
      etapa, procedimiento, fuente,
      fecha_captura, fecha_contacto, en_cola_revision,
      id_agente, id_vendedor,
      vendedores:id_vendedor(nombre, codigo_unico),
      aseguradoras:id_aseguradora(nombre)
    `)
    .order("fecha_captura", { ascending: false })
    .range(offset, offset + limit - 1)

  // Count query — lightweight (no joins) runs in parallel
  let countQuery = svc.from("leads").select("id", { count: "exact", head: true })

  // Apply shared filters to both queries
  if (etapa) {
    dataQuery = dataQuery.eq("etapa", etapa)
    countQuery = countQuery.eq("etapa", etapa)
  }
  if (rol === "agente") {
    dataQuery = dataQuery.eq("id_agente", user.id)
    countQuery = countQuery.eq("id_agente", user.id)
  }
  if (search) {
    const filter = `nombre.ilike.*${search}*,apellido_paterno.ilike.*${search}*,folio.ilike.*${search}*`
    dataQuery = dataQuery.or(filter)
    countQuery = countQuery.or(filter)
  }

  const [{ data, error }, { count }] = await Promise.all([dataQuery, countQuery])
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data, total: count, limit, offset })
}

export async function POST(req: NextRequest) {
  assertLicense()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const body = await req.json()
  const svc = await createServiceClient()

  // Para MX se normalizan 10 dígitos; para internacional se guarda el valor crudo
  const rawTel = String(body.telefono ?? "").trim()
  const telefono = normalizePhone(rawTel) || rawTel
  const email = normalizeEmail(body.email)
  const curp = normalizeCurp(body.curp)
  const folio = generateFolio()

  const nombre = String(body.nombre ?? "").trim().toUpperCase()
  const apellido_paterno = body.apellido_paterno ? String(body.apellido_paterno).trim().toUpperCase() : null
  const apellido_materno = body.apellido_materno ? String(body.apellido_materno).trim().toUpperCase() : null
  const notas = body.notas ? String(body.notas).toUpperCase() : null

  const row = {
    folio,
    nombre,
    apellido_paterno,
    apellido_materno,
    nombre_enc: encryptField(nombre),
    telefono_enc: encryptField(telefono),
    telefono_hash: hashField(telefono),
    email_enc: encryptField(email),
    email_hash: hashField(email),
    curp_enc: encryptField(curp),
    curp_hash: hashField(curp),
    numero_poliza_enc: encryptField(body.numero_poliza),
    fecha_nacimiento: body.fecha_nacimiento ?? null,
    estado_ciudad: body.estado_ciudad ?? null,
    prioridad: body.prioridad ?? "media",
    procedimiento: body.procedimiento ?? null,
    categoria_quirurgica: body.categoria_quirurgica ?? null,
    codigo_procedimiento: body.codigo_procedimiento ?? null,
    urgencia: body.urgencia ?? "electiva",
    costo_estimado: body.costo_estimado ?? null,
    id_aseguradora: body.id_aseguradora ?? null,
    vigencia_inicio: body.vigencia_inicio ?? null,
    vigencia_fin: body.vigencia_fin ?? null,
    suma_asegurada: body.suma_asegurada ?? null,
    deducible: body.deducible ?? null,
    coaseguro_pct: body.coaseguro_pct ?? null,
    id_agente: body.id_agente ?? user.id,
    id_vendedor: body.id_vendedor ?? null,
    id_campana: body.id_campana ?? null,
    codigo_referido: body.codigo_referido ?? null,
    telefono_alternativo:   body.telefono_alternativo   || null,
    telefono_alternativo_2: body.telefono_alternativo_2 || null,
    email_alternativo:      body.email_alternativo       || null,
    fuente: body.fuente ?? "formulario",
    fuente_especifica: body.fuente_especifica ?? null,
    en_cola_revision: body.en_cola_revision ?? false,
    etapa: "nuevo",
    estado: "activo",
    notas,
  }

  const { data, error } = await svc.from("leads").insert(row).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await logAudit({ accion: "create_lead", tabla: "leads", id_registro: data.id, id_usuario: user.id })
  return NextResponse.json({ data }, { status: 201 })
}
