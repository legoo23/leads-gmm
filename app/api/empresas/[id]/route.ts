import { NextRequest, NextResponse } from "next/server"
import { createServiceClient, createClient } from "@/lib/supabase/server"
import { assertLicense } from "@/lib/license"

const ALLOWED = [
  "nombre","rfc","sector","ejecutivo_cuenta","telefono","email",
  "direccion","ciudad","servicios","notas","activa",
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

  const [empresa, contactos, eventos] = await Promise.all([
    svc.from("empresas").select("*").eq("id", id).single(),
    svc.from("empresa_contactos").select("*").eq("id_empresa", id).order("principal", { ascending: false }).order("fecha_creacion"),
    svc.from("empresa_eventos").select("*").eq("id_empresa", id).order("fecha_evento", { ascending: false }),
  ])

  if (empresa.error) return NextResponse.json({ error: empresa.error.message }, { status: 500 })
  return NextResponse.json({
    data: empresa.data,
    contactos: contactos.data ?? [],
    eventos: eventos.data ?? [],
  })
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
  for (const key of ALLOWED) {
    if (key in body) update[key] = body[key] === "" ? null : body[key]
  }
  if (Object.keys(update).length === 0)
    return NextResponse.json({ error: "Sin campos" }, { status: 400 })

  if (update.nombre) update.nombre = String(update.nombre).trim().toUpperCase()

  const { data, error } = await svc.from("empresas").update(update).eq("id", id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
