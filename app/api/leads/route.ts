import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"
import { encryptField, hashField } from "@/lib/crypto"
import { logAudit, sanitizeLimit, API_MAX_RECORDS } from "@/lib/audit"
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
  const prioridad = sp.get("prioridad")
  const search = sp.get("q")

  const svc = await createServiceClient()
  let query = svc.from("leads")
    .select(`
      id, folio, nombre, apellido_paterno, apellido_paterno,
      etapa, prioridad, procedimiento, fuente,
      fecha_captura, fecha_contacto, en_cola_revision,
      id_agente, id_vendedor,
      nombre_enc, telefono_hash,
      vendedores:id_vendedor(nombre, codigo_unico),
      aseguradoras:id_aseguradora(nombre)
    `, { count: "exact" })
    .order("fecha_captura", { ascending: false })
    .range(offset, offset + limit - 1)

  if (etapa) query = query.eq("etapa", etapa)
  if (prioridad) query = query.eq("prioridad", prioridad)
  if (rol === "agente") query = query.eq("id_agente", user.id)

  const { data, error, count } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await logAudit({ accion: "list_leads", tabla: "leads", id_usuario: user.id, metadata: { etapa, prioridad, count } })
  return NextResponse.json({ data, total: count, limit, offset })
}

export async function POST(req: NextRequest) {
  assertLicense()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const body = await req.json()
  const svc = await createServiceClient()

  const telefono = normalizePhone(body.telefono)
  const email = normalizeEmail(body.email)
  const curp = normalizeCurp(body.curp)
  const folio = generateFolio()

  const row = {
    folio,
    nombre: body.nombre,
    apellido_paterno: body.apellido_paterno ?? null,
    apellido_materno: body.apellido_materno ?? null,
    nombre_enc: encryptField(body.nombre),
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
    fuente: body.fuente ?? "formulario",
    en_cola_revision: body.en_cola_revision ?? false,
    etapa: "nuevo",
    estado: "activo",
    notas: body.notas ?? null,
  }

  const { data, error } = await svc.from("leads").insert(row).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await logAudit({ accion: "create_lead", tabla: "leads", id_registro: data.id, id_usuario: user.id })
  return NextResponse.json({ data }, { status: 201 })
}
