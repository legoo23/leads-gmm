import { NextRequest, NextResponse } from "next/server"
import { createServiceClient, createClient } from "@/lib/supabase/server"
import { assertLicense } from "@/lib/license"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  assertLicense()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const svc = await createServiceClient()

  // Si se marca como principal, quitar el flag de los demás
  if (body.principal) {
    await svc.from("empresa_contactos")
      .update({ principal: false })
      .eq("id_empresa", id)
  }

  const { data, error } = await svc.from("empresa_contactos").insert({
    id_empresa: parseInt(id),
    nombre:    String(body.nombre ?? "").trim(),
    cargo:     body.cargo     || null,
    telefono:  body.telefono  || null,
    email:     body.email     || null,
    whatsapp:  body.whatsapp  || null,
    principal: body.principal === true,
    notas:     body.notas     || null,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data }, { status: 201 })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  assertLicense()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { id } = await params
  const { contacto_id } = await req.json()
  if (!contacto_id) return NextResponse.json({ error: "contacto_id requerido" }, { status: 400 })

  const svc = await createServiceClient()
  const { error } = await svc.from("empresa_contactos")
    .delete()
    .eq("id", contacto_id)
    .eq("id_empresa", id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
