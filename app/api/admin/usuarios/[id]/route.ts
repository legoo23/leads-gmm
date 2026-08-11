import { NextRequest, NextResponse } from "next/server"
import { createServiceClient, createClient } from "@/lib/supabase/server"
import { assertLicense } from "@/lib/license"

type Params = { params: Promise<{ id: string }> }

const ROLES_INTERNOS = ["admin", "gerente", "ejecutivo", "visualizador"]

export async function PATCH(req: NextRequest, { params }: Params) {
  assertLicense()
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { data: profile } = await supabase.from("user_profiles").select("rol").eq("id", user.id).single()
  if (profile?.rol !== "admin") return NextResponse.json({ error: "Solo admin" }, { status: 403 })

  const body = await req.json()
  if (body.rol && !ROLES_INTERNOS.includes(body.rol)) {
    return NextResponse.json({ error: "Rol inválido" }, { status: 400 })
  }

  const updates: Record<string, unknown> = {}
  if (body.rol) updates.rol = body.rol
  if (body.nombre) updates.nombre = body.nombre.trim()

  const svc = await createServiceClient()
  const { data, error } = await svc.from("user_profiles").update(updates).eq("id", id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data })
}
