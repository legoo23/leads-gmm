import { NextRequest, NextResponse } from "next/server"
import { createServiceClient, createClient } from "@/lib/supabase/server"
import { assertLicense } from "@/lib/license"
import { generateVendorCode } from "@/lib/utils"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  assertLicense()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const svc = await createServiceClient()

  const prefix = process.env.NEXT_PUBLIC_VENDOR_CODE_PREFIX ?? "GMM"
  const codigo_qr = generateVendorCode(`${prefix}EV`, 5)

  const { data, error } = await svc.from("empresa_eventos").insert({
    id_empresa:  parseInt(id),
    nombre:      String(body.nombre ?? "").trim(),
    descripcion: body.descripcion  || null,
    fecha_evento: body.fecha_evento || null,
    lugar:       body.lugar        || null,
    codigo_qr,
    activo:      true,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data }, { status: 201 })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  assertLicense()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const { evento_id, ...fields } = body
  if (!evento_id) return NextResponse.json({ error: "evento_id requerido" }, { status: 400 })

  const ALLOWED = ["nombre","descripcion","fecha_evento","lugar","activo"]
  const update: Record<string, unknown> = {}
  for (const key of ALLOWED) {
    if (key in fields) update[key] = fields[key] === "" ? null : fields[key]
  }

  const svc = await createServiceClient()
  const { data, error } = await svc.from("empresa_eventos")
    .update(update)
    .eq("id", evento_id)
    .eq("id_empresa", id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
