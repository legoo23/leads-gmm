import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { createServiceClient } from "@/lib/supabase/server"
import { assertLicense } from "@/lib/license"
import type { Database } from "@/types/supabase"

async function getUser() {
  const cookieStore = await cookies()
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function GET() {
  assertLicense()
  const user = await getUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const svc = createServiceClient()
  const { data, error } = await svc
    .from("testimonios")
    .select("*")
    .order("orden", { ascending: true })
    .order("id", { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(req: NextRequest) {
  assertLicense()
  const user = await getUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  let body: Record<string, unknown>
  try { body = await req.json() }
  catch { return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 }) }

  const nombre = String(body.nombre ?? "").trim()
  const texto  = String(body.texto  ?? "").trim()
  if (!nombre || !texto)
    return NextResponse.json({ error: "nombre y texto son requeridos" }, { status: 400 })

  const svc = createServiceClient()
  const { data, error } = await svc.from("testimonios").insert({
    nombre,
    detalle:   String(body.detalle ?? "").trim() || null,
    texto,
    estrellas: Number(body.estrellas ?? 5),
    activo:    body.activo !== false,
    orden:     Number(body.orden ?? 0),
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data }, { status: 201 })
}
