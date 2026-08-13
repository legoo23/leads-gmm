import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"
import { assertLicense } from "@/lib/license"
import { encryptField, hashField } from "@/lib/crypto"
import { normalizePhone, normalizeEmail, generateFolio } from "@/lib/utils"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ codigo: string }> }
) {
  assertLicense()

  const { codigo } = await params
  const svc = createServiceClient()

  // Validar que el código de vendedor exista y esté activo
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

  // Validaciones de campos obligatorios
  const nombre = String(body.nombre ?? "").trim().toUpperCase()
  if (!nombre) {
    return NextResponse.json({ error: "El nombre es requerido" }, { status: 400 })
  }

  const telefono = normalizePhone(body.telefono)
  if (!telefono) {
    return NextResponse.json(
      { error: "El teléfono debe tener exactamente 10 dígitos" },
      { status: 400 }
    )
  }

  const folio = generateFolio()

  const emailNorm = normalizeEmail(body.email)
  const { data, error } = await svc.from("leads").insert({
    folio,
    nombre,
    apellido_paterno: String(body.apellido_paterno ?? "").trim().toUpperCase() || null,
    apellido_materno: String(body.apellido_materno ?? "").trim().toUpperCase() || null,
    telefono_enc:    encryptField(telefono),
    telefono_hash:   hashField(telefono),
    ...(emailNorm ? { email_enc: encryptField(emailNorm), email_hash: hashField(emailNorm) } : {}),
    estado_ciudad:   body.estado_ciudad  || null,
    procedimiento:   body.procedimiento  || null,
    id_aseguradora:  body.id_aseguradora ? parseInt(String(body.id_aseguradora)) : null,
    notas:           body.notas          || null,
    codigo_referido: codigo.toUpperCase(),
    id_vendedor:     vendedor.id,
    fuente:          "qr",
    prioridad:       "media",
    etapa:           "nuevo",
    estado:          "activo",
    en_cola_revision: false,
  }).select("folio").single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ folio: data.folio }, { status: 201 })
}
