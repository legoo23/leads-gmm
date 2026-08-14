import { NextResponse } from "next/server"
import { assertLicense } from "@/lib/license"
import { createServiceClient } from "@/lib/supabase/server"
import { createClient } from "@/lib/supabase/server"

async function getUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function GET() {
  assertLicense()
  const user = await getUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const svc = createServiceClient()

  const { data, error } = await svc
    .from("noticias_vendedores")
    .select("id, titulo, cuerpo, tipo, activo, orden, created_at")
    .order("orden", { ascending: true })
    .order("created_at", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ noticias: data ?? [] })
}

export async function POST(req: Request) {
  assertLicense()
  const user = await getUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const body = await req.json()
  const titulo = String(body.titulo ?? "").trim()
  const cuerpo = String(body.cuerpo ?? "").trim()
  const tipo = ["novedad", "aviso", "ayuda"].includes(body.tipo) ? body.tipo : "novedad"
  const orden = typeof body.orden === "number" ? body.orden : 0

  if (!titulo) return NextResponse.json({ error: "El título es requerido" }, { status: 400 })
  if (!cuerpo) return NextResponse.json({ error: "El contenido es requerido" }, { status: 400 })

  const svc = createServiceClient()
  const { data, error } = await svc
    .from("noticias_vendedores")
    .insert({ titulo, cuerpo, tipo, orden, activo: true })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ noticia: data }, { status: 201 })
}
