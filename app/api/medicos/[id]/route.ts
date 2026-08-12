import { NextRequest, NextResponse } from "next/server"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import { assertLicense } from "@/lib/license"

const ALLOWED_FIELDS = [
  "nombre", "especialidad", "sub_especialidad", "hospital", "telefono",
  "telefono_secundario", "email", "cedula", "cobertura", "consultorio",
  "aseguradoras_aceptadas", "notas", "en_red", "activo",
]

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  assertLicense()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { id } = await params
  const svc = await createServiceClient()

  const { data, error } = await svc
    .from("medicos")
    .select("*")
    .eq("id", id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
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
  const svc = await createServiceClient()

  const update: Record<string, unknown> = {}
  for (const key of ALLOWED_FIELDS) {
    if (key in body) update[key] = body[key] === "" ? null : body[key]
  }
  if (Object.keys(update).length === 0)
    return NextResponse.json({ error: "Sin campos para actualizar" }, { status: 400 })

  const { data, error } = await svc
    .from("medicos")
    .update(update)
    .eq("id", id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
