import { NextResponse } from "next/server"
import { assertLicense } from "@/lib/license"
import { createServiceClient } from "@/lib/supabase/server"
import { createClient } from "@/lib/supabase/server"

async function getUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  assertLicense()
  const user = await getUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const updates: Record<string, unknown> = {}

  if (body.asunto !== undefined) updates.asunto = String(body.asunto).trim()
  if (body.cuerpo !== undefined) updates.cuerpo = String(body.cuerpo).trim()
  if (body.activo !== undefined) updates.activo = Boolean(body.activo)

  const svc = createServiceClient()
  const { data, error } = await svc
    .from("mensajes_vendedores")
    .update(updates)
    .eq("id", parseInt(id))
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ mensaje: data })
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  assertLicense()
  const user = await getUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { id } = await params
  const svc = createServiceClient()

  // Soft delete
  const { data, error } = await svc
    .from("mensajes_vendedores")
    .update({ activo: false })
    .eq("id", parseInt(id))
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ mensaje: data })
}
