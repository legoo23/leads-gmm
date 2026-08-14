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
    .from("mensajes_vendedores")
    .select(`
      id, asunto, cuerpo, destinatario, activo, created_at,
      id_vendedor,
      vendedores:id_vendedor ( nombre )
    `)
    .order("created_at", { ascending: false })
    .limit(100)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ mensajes: data ?? [] })
}

export async function POST(req: Request) {
  assertLicense()
  const user = await getUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const body = await req.json()
  const asunto = String(body.asunto ?? "").trim()
  const cuerpo = String(body.cuerpo ?? "").trim()
  const destinatario = body.destinatario === "individual" ? "individual" : "todos"
  const idVendedor = destinatario === "individual" ? (body.id_vendedor ?? null) : null

  if (!asunto) return NextResponse.json({ error: "El asunto es requerido" }, { status: 400 })
  if (!cuerpo) return NextResponse.json({ error: "El cuerpo es requerido" }, { status: 400 })
  if (destinatario === "individual" && !idVendedor)
    return NextResponse.json({ error: "Selecciona un vendedor" }, { status: 400 })

  const svc = createServiceClient()

  const { data, error } = await svc
    .from("mensajes_vendedores")
    .insert({ asunto, cuerpo, destinatario, id_vendedor: idVendedor, activo: true })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ mensaje: data }, { status: 201 })
}
