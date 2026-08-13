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

type Params = { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, { params }: Params) {
  assertLicense()
  const user = await getUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { id } = await params
  const numId = Number(id)
  if (!numId) return NextResponse.json({ error: "ID inválido" }, { status: 400 })

  let body: Record<string, unknown>
  try { body = await req.json() }
  catch { return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 }) }

  const patch: Record<string, unknown> = {}
  if (body.nombre    !== undefined) patch.nombre    = String(body.nombre).trim()
  if (body.detalle   !== undefined) patch.detalle   = String(body.detalle).trim() || null
  if (body.texto     !== undefined) patch.texto     = String(body.texto).trim()
  if (body.estrellas !== undefined) patch.estrellas = Number(body.estrellas)
  if (body.activo    !== undefined) patch.activo    = Boolean(body.activo)
  if (body.orden     !== undefined) patch.orden     = Number(body.orden)

  if (Object.keys(patch).length === 0)
    return NextResponse.json({ error: "Sin cambios" }, { status: 400 })

  const svc = createServiceClient()
  const { data, error } = await svc.from("testimonios")
    .update(patch).eq("id", numId).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  assertLicense()
  const user = await getUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { id } = await params
  const numId = Number(id)
  if (!numId) return NextResponse.json({ error: "ID inválido" }, { status: 400 })

  const svc = createServiceClient()
  const { error } = await svc.from("testimonios").delete().eq("id", numId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
