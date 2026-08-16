import { NextRequest, NextResponse } from "next/server"
import { createServiceClient, createClient } from "@/lib/supabase/server"
import { assertLicense } from "@/lib/license"

export async function GET(_req: NextRequest) {
  assertLicense()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const svc = await createServiceClient()
  const { data, error } = await svc.from("niveles_comision").select("*").order("orden").order("id")
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  // R-04: niveles de comisión cambian raramente — cacheable 5 min
  return NextResponse.json({ data }, {
    headers: { "Cache-Control": "private, max-age=300, stale-while-revalidate=600" },
  })
}

export async function POST(req: NextRequest) {
  assertLicense()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { data: profile } = await supabase.from("user_profiles").select("rol").eq("id", user.id).single()
  if (profile?.rol !== "admin") return NextResponse.json({ error: "Solo admin" }, { status: 403 })

  const body = await req.json()
  const svc = await createServiceClient()

  const { count } = await svc.from("niveles_comision").select("id", { count: "exact", head: true })

  const { data, error } = await svc.from("niveles_comision").insert({
    nombre: body.nombre,
    monto: body.monto,
    descripcion: body.descripcion || null,
    activo: true,
    orden: (count ?? 0) + 1,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data }, { status: 201 })
}
