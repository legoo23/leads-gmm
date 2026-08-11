import { NextRequest, NextResponse } from "next/server"
import { createServiceClient, createClient } from "@/lib/supabase/server"
import { assertLicense } from "@/lib/license"

const ROLES_INTERNOS = ["admin", "gerente", "ejecutivo", "visualizador"]

export async function GET(_req: NextRequest) {
  assertLicense()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { data: profile } = await supabase.from("user_profiles").select("rol").eq("id", user.id).single()
  if (!["admin", "gerente"].includes(profile?.rol ?? "")) {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 })
  }

  const svc = await createServiceClient()
  const { data, error } = await svc.from("user_profiles").select("id, nombre, rol, activo")
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: authData } = await svc.auth.admin.listUsers()
  const emailMap: Record<string, string> = {}
  for (const u of authData?.users ?? []) emailMap[u.id] = u.email ?? ""

  const result = (data ?? []).map((p) => ({ ...p, email: emailMap[p.id] ?? "" }))
  return NextResponse.json({ data: result })
}

export async function POST(req: NextRequest) {
  assertLicense()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { data: profile } = await supabase.from("user_profiles").select("rol").eq("id", user.id).single()
  if (profile?.rol !== "admin") return NextResponse.json({ error: "Solo admin" }, { status: 403 })

  const body = await req.json()
  const { nombre, email, rol } = body

  if (!nombre?.trim() || !email?.trim() || !rol) {
    return NextResponse.json({ error: "Nombre, correo y rol son requeridos" }, { status: 400 })
  }
  if (!ROLES_INTERNOS.includes(rol)) {
    return NextResponse.json({ error: "Rol inválido" }, { status: 400 })
  }

  const svc = await createServiceClient()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ""
  const redirectTo = `${appUrl}/auth/callback?next=/auth/update-password`

  const { data: authData, error: authError } = await svc.auth.admin.inviteUserByEmail(
    email.trim().toLowerCase(),
    { redirectTo }
  )
  if (authError) return NextResponse.json({ error: authError.message }, { status: 500 })

  const { data, error } = await svc.from("user_profiles").insert({
    id: authData.user.id,
    nombre: nombre.trim(),
    rol,
  }).select().single()

  if (error) {
    await svc.auth.admin.deleteUser(authData.user.id)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data: { ...data, email: email.trim().toLowerCase() } }, { status: 201 })
}
