import { NextRequest, NextResponse } from "next/server"
import { createServiceClient, createClient } from "@/lib/supabase/server"
import { assertLicense } from "@/lib/license"

export async function GET(_req: NextRequest) {
  assertLicense()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { data: profile } = await supabase.from("user_profiles").select("rol").eq("id", user.id).single()
  if (!["admin", "supervisor"].includes(profile?.rol ?? "")) {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 })
  }

  const svc = await createServiceClient()
  const { data, error } = await svc.from("user_profiles").select("id, nombre, rol")
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Get email from auth.users for display — service_role can access this
  const { data: authUsers } = await svc.auth.admin.listUsers()
  const emailMap: Record<string, string> = {}
  for (const u of authUsers?.users ?? []) emailMap[u.id] = u.email ?? ""

  const result = (data ?? []).map((p) => ({ ...p, email: emailMap[p.id] ?? "" }))
  return NextResponse.json({ data: result })
}
