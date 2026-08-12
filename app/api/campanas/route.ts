import { NextRequest, NextResponse } from "next/server"
import { createServiceClient, createClient } from "@/lib/supabase/server"
import { assertLicense } from "@/lib/license"
import { generateVendorCode } from "@/lib/utils"

const ALLOWED_PATCH = [
  "nombre", "procedimiento_target", "descripcion",
  "vigencia_inicio", "vigencia_fin", "activa", "visible_vendedores",
]

export async function GET(_req: NextRequest) {
  assertLicense()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const svc = await createServiceClient()
  const { data, error } = await svc
    .from("campanas")
    .select("*")
    .order("fecha_creacion", { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(req: NextRequest) {
  assertLicense()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const body = await req.json()
  const svc = await createServiceClient()
  const prefix = process.env.NEXT_PUBLIC_VENDOR_CODE_PREFIX ?? "GMM"
  const codigo_unico = generateVendorCode(`${prefix}C`, 5)

  const { data, error } = await svc.from("campanas").insert({
    nombre:               body.nombre,
    procedimiento_target: body.procedimiento_target || null,
    descripcion:          body.descripcion || null,
    vigencia_inicio:      body.vigencia_inicio || null,
    vigencia_fin:         body.vigencia_fin || null,
    visible_vendedores:   body.visible_vendedores === true,
    activa:               true,
    codigo_unico,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data }, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  assertLicense()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const body = await req.json()
  const { id } = body
  if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 })

  const update: Record<string, unknown> = {}
  for (const key of ALLOWED_PATCH) {
    if (key in body) update[key] = body[key] === "" ? null : body[key]
  }
  if (Object.keys(update).length === 0)
    return NextResponse.json({ error: "Sin campos para actualizar" }, { status: 400 })

  const svc = await createServiceClient()
  const { data, error } = await svc
    .from("campanas").update(update).eq("id", id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
