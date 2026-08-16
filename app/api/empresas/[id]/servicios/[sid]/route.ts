import { NextRequest, NextResponse } from "next/server"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import { assertLicense } from "@/lib/license"
import { logAudit, extractIP } from "@/lib/audit"

// ── PATCH — actualizar servicio ───────────────────────────────────────────────

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; sid: string }> }
) {
  assertLicense()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

  const { id, sid } = await params
  const svc = createServiceClient()

  let body: Record<string, unknown>
  try { body = await req.json() }
  catch { return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 }) }

  const updates: Record<string, unknown> = {}
  if (body.nombre      !== undefined) updates.nombre      = String(body.nombre).trim().toUpperCase() || undefined
  if (body.descripcion !== undefined) updates.descripcion = body.descripcion || null
  if (body.icono       !== undefined) updates.icono       = body.icono       || null
  if (body.tipo        !== undefined && ["general","particular"].includes(String(body.tipo)))
    updates.tipo = body.tipo
  if (body.activo  !== undefined) updates.activo  = Boolean(body.activo)
  if (body.orden   !== undefined) updates.orden   = parseInt(String(body.orden))
  if (body.precio_regular  != null) { const pr = parseFloat(String(body.precio_regular));  updates.precio_regular  = isNaN(pr) ? null : pr }
  if (body.precio_convenio != null) { const pc = parseFloat(String(body.precio_convenio)); updates.precio_convenio = isNaN(pc) ? null : pc }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Sin campos para actualizar" }, { status: 400 })
  }

  const { data, error } = await svc
    .from("servicios_convenio")
    .update(updates)
    .eq("id", sid)
    .eq("id_empresa", id)
    .select("id, nombre, descripcion, icono, precio_regular, precio_convenio, pct_descuento, tipo, activo, orden")
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await logAudit({
    accion:     "servicio_convenio_actualizado",
    tabla:      "servicios_convenio",
    id_registro: sid,
    id_usuario: user.id,
    ip:         extractIP(req),
  })

  return NextResponse.json({ data })
}

// ── DELETE — eliminar servicio ────────────────────────────────────────────────

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; sid: string }> }
) {
  assertLicense()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

  const { id, sid } = await params
  const svc = createServiceClient()

  const { error } = await svc
    .from("servicios_convenio")
    .delete()
    .eq("id", sid)
    .eq("id_empresa", id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await logAudit({
    accion:     "servicio_convenio_eliminado",
    tabla:      "servicios_convenio",
    id_registro: sid,
    id_usuario: user.id,
    ip:         extractIP(req),
  })

  return NextResponse.json({ ok: true })
}
