import { NextRequest, NextResponse } from "next/server"
import { createServiceClient, createClient } from "@/lib/supabase/server"
import { assertLicense } from "@/lib/license"

export async function GET(req: NextRequest) {
  assertLicense()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const sp = req.nextUrl.searchParams
  const q      = sp.get("q")?.trim() ?? ""
  const sector = sp.get("sector")?.trim() ?? ""

  const svc = await createServiceClient()
  let query = svc
    .from("empresas")
    .select("id, nombre, rfc, sector, ejecutivo_cuenta, telefono, email, ciudad, activa, fecha_registro", { count: "exact" })
    .order("nombre")

  if (q.length >= 2)     query = query.ilike("nombre", `%${q}%`)
  if (sector.length >= 2) query = query.ilike("sector", `%${sector}%`)

  const { data, error, count } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data: data ?? [], total: count ?? 0 })
}

export async function POST(req: NextRequest) {
  assertLicense()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const body = await req.json()
  const svc = await createServiceClient()

  const { data, error } = await svc.from("empresas").insert({
    nombre:           String(body.nombre ?? "").trim().toUpperCase(),
    rfc:              body.rfc              || null,
    sector:           body.sector           || null,
    ejecutivo_cuenta: body.ejecutivo_cuenta || null,
    telefono:         body.telefono         || null,
    email:            body.email            || null,
    direccion:        body.direccion        || null,
    ciudad:           body.ciudad           || null,
    servicios:        body.servicios        || null,
    notas:            body.notas            || null,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data }, { status: 201 })
}
