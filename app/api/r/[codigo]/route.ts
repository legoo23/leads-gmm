import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"
import { assertLicense } from "@/lib/license"
import { encryptField, hashField } from "@/lib/crypto"
import { normalizePhone, normalizeEmail, generateFolio } from "@/lib/utils"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ codigo: string }> }
) {
  assertLicense()

  const { codigo } = await params
  const svc = createServiceClient()

  const { data: vendedor, error: vError } = await svc
    .from("vendedores")
    .select("id, nombre, activo")
    .eq("codigo_unico", codigo.toUpperCase())
    .single()

  if (vError || !vendedor || !vendedor.activo) {
    return NextResponse.json({ error: "Código de referido no válido" }, { status: 400 })
  }

  let body: Record<string, unknown>
  try { body = await req.json() }
  catch { return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 }) }

  const nombre = String(body.nombre ?? "").trim().toUpperCase()
  if (!nombre) return NextResponse.json({ error: "El nombre es requerido" }, { status: 400 })

  const apellidoPaterno = String(body.apellido_paterno ?? "").trim().toUpperCase()
  if (!apellidoPaterno) return NextResponse.json({ error: "El apellido paterno es requerido" }, { status: 400 })

  const telefono = normalizePhone(body.telefono)
  if (!telefono) {
    return NextResponse.json({ error: "El teléfono debe tener exactamente 10 dígitos" }, { status: 400 })
  }

  const emailRaw = normalizeEmail(body.email)
  if (emailRaw && !EMAIL_RE.test(emailRaw)) {
    return NextResponse.json({ error: "El correo electrónico no es válido" }, { status: 400 })
  }

  if (!body.acepta_privacidad) {
    return NextResponse.json({ error: "Debes aceptar el Aviso de Privacidad para continuar" }, { status: 400 })
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
    estado_ciudad:     body.estado_ciudad  || null,
    procedimiento:     body.procedimiento  || null,
    id_aseguradora:    body.id_aseguradora ? parseInt(String(body.id_aseguradora)) : null,
    notas:             body.notas          || null,
    codigo_referido:   codigo.toUpperCase(),
    id_vendedor:       vendedor.id,
    fuente:            "qr",
    prioridad:         "media",
    etapa:             "nuevo",
    estado:            "activo",
    en_cola_revision:  false,
  }).select("folio").single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ folio: data.folio }, { status: 201 })
}
