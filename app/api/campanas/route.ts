import { NextRequest, NextResponse } from "next/server"
import { createServiceClient, createClient } from "@/lib/supabase/server"
import { assertLicense } from "@/lib/license"
import { generateVendorCode } from "@/lib/utils"

export async function GET(_req: NextRequest) {
  assertLicense()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const svc = await createServiceClient()
  const { data, error } = await svc.from("campanas").select("*").order("fecha_creacion", { ascending: false })
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
    nombre: body.nombre,
    procedimiento_target: body.procedimiento_target || null,
    descripcion: body.descripcion || null,
    vigencia_inicio: body.vigencia_inicio || null,
    vigencia_fin: body.vigencia_fin || null,
    activa: true,
    codigo_unico,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data }, { status: 201 })
}
