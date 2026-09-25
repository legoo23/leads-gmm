import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"
import { assertLicense } from "@/lib/license"
import { normalizePhone, normalizeEmail } from "@/lib/utils"
import { extractIP } from "@/lib/audit"

// Formulario corporativo de la landing (hospitales, aseguradoras, empresas, médicos)
// → se registra como prospecto en empresas_prospectos.

// Rate limiting en memoria — máx 5 envíos por IP cada 10 min
const RL_MAP = new Map<string, { n: number; reset: number }>()
function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = RL_MAP.get(ip)
  if (entry && now < entry.reset) {
    if (entry.n >= 5) return false
    entry.n++
    return true
  }
  RL_MAP.set(ip, { n: 1, reset: now + 10 * 60 * 1000 })
  return true
}

const SECTORES = ["HOSPITAL / CLÍNICA", "ASEGURADORA", "EMPRESA / RECURSOS HUMANOS", "MÉDICO ESPECIALISTA", "OTRO"]

export async function POST(req: NextRequest) {
  assertLicense()

  const ip = extractIP(req) ?? "unknown"
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: "Demasiados envíos. Intenta en unos minutos." }, { status: 429 })
  }

  let body: Record<string, unknown>
  try { body = await req.json() }
  catch { return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 }) }

  // Honeypot
  if (String(body._gotcha ?? "").trim()) return NextResponse.json({ ok: true }, { status: 201 })

  const nombreContacto = String(body.nombre_contacto ?? "").trim().toUpperCase().slice(0, 120)
  const nombreEmpresa  = String(body.nombre_empresa ?? "").trim().toUpperCase().slice(0, 160)
  if (!nombreContacto || !nombreEmpresa) {
    return NextResponse.json({ error: "Nombre y empresa son requeridos" }, { status: 400 })
  }

  const telefono = normalizePhone(body.telefono)
  if (!telefono) {
    return NextResponse.json({ error: "Teléfono debe tener exactamente 10 dígitos" }, { status: 400 })
  }

  const email = normalizeEmail(body.email)
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Correo electrónico inválido" }, { status: 400 })
  }

  const sector = String(body.sector ?? "").trim().toUpperCase()
  if (!SECTORES.includes(sector)) {
    return NextResponse.json({ error: "Selecciona un sector" }, { status: 400 })
  }

  const mensaje = String(body.mensaje ?? "").trim().toUpperCase().slice(0, 2000)
  const notas = [
    "ORIGEN: FORMULARIO CORPORATIVO DEL SITIO WEB",
    `SECTOR: ${sector}`,
    mensaje ? `MENSAJE: ${mensaje}` : "",
  ].filter(Boolean).join("\n")

  const svc = createServiceClient()
  const { error } = await svc.from("empresas_prospectos").insert({
    nombre_empresa:  nombreEmpresa,
    nombre_contacto: nombreContacto,
    telefono,
    email,
    fuente:          "otro",
    notas,
  })

  if (error) return NextResponse.json({ error: "No se pudo registrar la solicitud" }, { status: 500 })
  return NextResponse.json({ ok: true }, { status: 201 })
}
