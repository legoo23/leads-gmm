import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"
import { assertLicense } from "@/lib/license"
import { encryptField, hashField } from "@/lib/crypto"
import { normalizePhone, normalizeEmail, generateFolio } from "@/lib/utils"
import { extractIP } from "@/lib/audit"

// S-02: Rate limiting en memoria — máx 5 envíos por IP cada 10 min
// Fluid Compute reutiliza instancias, por lo que el Map sobrevive entre requests
const RL_MAP = new Map<string, { n: number; reset: number }>()
function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const WINDOW = 10 * 60 * 1000
  const MAX = 5
  const entry = RL_MAP.get(ip)
  if (entry) {
    if (now < entry.reset) {
      if (entry.n >= MAX) return false
      entry.n++
      return true
    }
  }
  RL_MAP.set(ip, { n: 1, reset: now + WINDOW })
  return true
}

// Mapeo flexible de nombre de aseguradora → id en catálogo
const ASEG_MAP: [string, number][] = [
  ["gnp", 1], ["axa", 2], ["mapfre", 3], ["metlife", 4],
  ["zurich", 5], ["atlas", 6], ["bx", 7], ["cigna", 8],
  ["sura", 9], ["bbva", 10], ["allianz", 11], ["monterrey", 12],
  ["inbursa", 13], ["chubb", 14], ["bupa", 15], ["hdi", 16],
  ["qualitas", 17],
]

function matchAseguradora(nombre: string): number | null {
  const lower = nombre.toLowerCase()
  for (const [key, id] of ASEG_MAP) {
    if (lower.includes(key)) return id
  }
  return null
}

export async function POST(req: NextRequest) {
  assertLicense()

  // S-02: Rate limiting por IP
  const ip = extractIP(req) ?? "unknown"
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: "Demasiados envíos. Intenta en unos minutos." }, { status: 429 })
  }

  let body: Record<string, unknown>
  try { body = await req.json() }
  catch { return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 }) }

  // S-02: Honeypot — bots llenan campos ocultos; usuarios reales los dejan vacíos
  if (String(body._gotcha ?? "").trim()) {
    return NextResponse.json({ folio: generateFolio() }, { status: 201 })
  }

  const nombre = String(body.nombre ?? "").trim().toUpperCase()
  if (!nombre) return NextResponse.json({ error: "Nombre requerido" }, { status: 400 })

  const telefono = normalizePhone(body.telefono)
  if (!telefono) {
    return NextResponse.json({ error: "Teléfono debe tener exactamente 10 dígitos" }, { status: 400 })
  }

  const email = normalizeEmail(body.email)
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Correo electrónico inválido" }, { status: 400 })
  }

  const aseguradoraStr = String(body.aseguradora ?? "").trim()
  const idAseguradora  = matchAseguradora(aseguradoraStr)

  const notasLineas = [
    body.procedimiento ? `Padecimiento/procedimiento: ${body.procedimiento}` : "",
    !idAseguradora && aseguradoraStr ? `Aseguradora indicada: ${aseguradoraStr}` : "",
  ].filter(Boolean)

  const svc = createServiceClient()
  const folio = generateFolio()

  // Resolver vendedor si viene código de referido
  const codigoRef = String(body.codigo_referido ?? "").trim().toUpperCase() || null
  let idVendedor: number | null = null
  if (codigoRef) {
    const { data: v } = await svc
      .from("vendedores")
      .select("id")
      .eq("codigo_unico", codigoRef)
      .eq("activo", true)
      .single()
    if (v) idVendedor = v.id
  }

  const { data, error } = await svc.from("leads").insert({
    folio,
    nombre,
    apellido_paterno:  String(body.apellido_paterno ?? "").trim().toUpperCase() || null,
    telefono_enc:      encryptField(telefono),
    telefono_hash:     hashField(telefono),
    email_enc:         encryptField(email),
    email_hash:        hashField(email),
    estado_ciudad:     body.estado_ciudad  || null,
    procedimiento:     body.procedimiento  || null,
    id_aseguradora:    idAseguradora,
    notas:             notasLineas.length ? notasLineas.join("\n") : null,
    fuente:            idVendedor ? "qr" : "formulario",
    codigo_referido:   codigoRef,
    id_vendedor:       idVendedor,
    prioridad:         "media",
    etapa:             "nuevo",
    estado:            "activo",
    en_cola_revision:  false,
  }).select("folio").single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ folio: data.folio }, { status: 201 })
}
