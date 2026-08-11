import { NextRequest, NextResponse } from "next/server"
import { createServiceClient, createClient } from "@/lib/supabase/server"
import { assertLicense } from "@/lib/license"

type Params = { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, { params }: Params) {
  assertLicense()
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { data: profile } = await supabase.from("user_profiles").select("rol").eq("id", user.id).single()
  if (profile?.rol !== "admin") return NextResponse.json({ error: "Solo admin" }, { status: 403 })

  const body = await req.json()
  const updates: Record<string, unknown> = {}
  if (body.nombre !== undefined) updates.nombre = body.nombre
  if (body.monto !== undefined) updates.monto = body.monto
  if (body.descripcion !== undefined) updates.descripcion = body.descripcion || null
  if (body.activo !== undefined) updates.activo = body.activo

  const svc = await createServiceClient()
  const { data, error } = await svc.from("niveles_comision").update(updates).eq("id", id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data })
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  assertLicense()
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { data: profile } = await supabase.from("user_profiles").select("rol").eq("id", user.id).single()
  if (profile?.rol !== "admin") return NextResponse.json({ error: "Solo admin" }, { status: 403 })

  const svc = await createServiceClient()

  // No eliminar si hay vendedores asignados a este nivel
  const { count } = await svc.from("vendedores").select("id", { count: "exact", head: true }).eq("id_nivel", id)
  if ((count ?? 0) > 0) {
    return NextResponse.json(
      { error: `Este nivel tiene ${count} vendedor(es) asignado(s). Reasígnalos antes de eliminar.` },
      { status: 409 }
    )
  }

  const { error } = await svc.from("niveles_comision").delete().eq("id", id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
