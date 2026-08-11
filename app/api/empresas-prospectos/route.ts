import { NextRequest, NextResponse } from "next/server"
import { createServiceClient, createClient } from "@/lib/supabase/server"
import { assertLicense } from "@/lib/license"

export async function GET(req: NextRequest) {
  assertLicense()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const estado = searchParams.get("estado")

  const svc = await createServiceClient()
  let q = svc
    .from("empresas_prospectos")
    .select("*")
    .order("created_at", { ascending: false })

  if (estado) q = q.eq("estado", estado) as typeof q

  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function PATCH(req: NextRequest) {
  assertLicense()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const body = await req.json()
  const { id, estado, notas, id_agente } = body
  if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 })

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (estado !== undefined) update.estado = estado
  if (notas !== undefined) update.notas = notas
  if (id_agente !== undefined) update.id_agente = id_agente

  const svc = await createServiceClient()
  const { data, error } = await svc
    .from("empresas_prospectos")
    .update(update)
    .eq("id", id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
