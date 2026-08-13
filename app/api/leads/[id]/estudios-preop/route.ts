import { NextRequest, NextResponse } from "next/server"
import { createServiceClient, createClient } from "@/lib/supabase/server"
import { assertLicense } from "@/lib/license"

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  assertLicense()
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const svc = await createServiceClient()
  const { data, error } = await svc
    .from("estudios_preop")
    .select("*")
    .eq("id_lead", id)
    .order("id", { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(req: NextRequest, { params }: Params) {
  assertLicense()
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const body = await req.json()
  const nombre = String(body.nombre ?? "").trim().toUpperCase()
  if (!nombre) return NextResponse.json({ error: "El nombre es requerido" }, { status: 400 })

  const svc = await createServiceClient()
  const { data, error } = await svc
    .from("estudios_preop")
    .insert({
      id_lead: parseInt(id),
      nombre,
      tiene_fisico: body.tiene_fisico ?? "pendiente",
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data }, { status: 201 })
}
