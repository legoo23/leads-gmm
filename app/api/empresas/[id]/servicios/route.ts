import { NextRequest, NextResponse } from "next/server"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import { assertLicense } from "@/lib/license"
import { logAudit, extractIP } from "@/lib/audit"

// ── GET — listar servicios del convenio ───────────────────────────────────────

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  assertLicense()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

  const { id } = await params
  const svc = createServiceClient()

  const { data, error } = await svc
    .from("servicios_convenio")
    .select("id, nombre, descripcion, icono, precio_regular, precio_convenio, pct_descuento, tipo, activo, orden")
    .eq("id_empresa", id)
    .order("orden")

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data: data ?? [] })
}

// ── POST — crear servicio ─────────────────────────────────────────────────────

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  assertLicense()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

  const { id } = await params
  const svc = createServiceClient()

  let body: Record<string, unknown>
  try { body = await req.json() }
  catch { return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 }) }

  const nombre = String(body.nombre ?? "").trim()
  if (!nombre) return NextResponse.json({ error: "El nombre del servicio es requerido" }, { status: 400 })

  // Calcular orden (último + 1)
  const { data: last } = await svc
    .from("servicios_convenio")
    .select("orden")
    .eq("id_empresa", id)
    .order("orden", { ascending: false })
    .limit(1)
    .single()

  const orden = last ? last.orden + 1 : 0

  const precioRegular  = body.precio_regular  != null ? parseFloat(String(body.precio_regular))  : null
  const precioConvenio = body.precio_convenio != null ? parseFloat(String(body.precio_convenio)) : null

  const { data, error } = await svc
    .from("servicios_convenio")
    .insert({
      id_empresa:      parseInt(id),
      nombre:          nombre.toUpperCase(),
      descripcion:     body.descripcion  || null,
      icono:           body.icono        || null,
      precio_regular:  isNaN(precioRegular  as number) ? null : precioRegular,
      precio_convenio: isNaN(precioConvenio as number) ? null : precioConvenio,
      tipo:            ["general","particular"].includes(String(body.tipo)) ? String(body.tipo) : "general",
      activo:          true,
      orden,
    })
    .select("id, nombre, descripcion, icono, precio_regular, precio_convenio, pct_descuento, tipo, activo, orden")
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await logAudit({
    accion:     "servicio_convenio_creado",
    tabla:      "servicios_convenio",
    id_registro: data.id,
    id_usuario: user.id,
    ip:         extractIP(req),
    metadata:   { empresa_id: id, nombre },
  })

  return NextResponse.json({ data }, { status: 201 })
}
