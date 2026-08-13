import { NextRequest, NextResponse } from "next/server"
import { createServiceClient, createClient } from "@/lib/supabase/server"
import { assertLicense } from "@/lib/license"

type Params = { params: Promise<{ id: string; eid: string }> }

export async function PATCH(req: NextRequest, { params }: Params) {
  assertLicense()
  const { id, eid } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const body = await req.json()
  const svc = await createServiceClient()

  const { data, error } = await svc
    .from("estudios_preop")
    .update({
      nombre: String(body.nombre ?? "").trim().toUpperCase(),
      tiene_fisico: body.tiene_fisico ?? "pendiente",
    })
    .eq("id", eid)
    .eq("id_lead", id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  assertLicense()
  const { id, eid } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const svc = await createServiceClient()
  const { error } = await svc
    .from("estudios_preop")
    .delete()
    .eq("id", eid)
    .eq("id_lead", id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
