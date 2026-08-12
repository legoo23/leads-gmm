import { NextRequest, NextResponse } from "next/server"
import { createServiceClient, createClient } from "@/lib/supabase/server"
import { logAudit, sanitizeLimit } from "@/lib/audit"
import { assertLicense } from "@/lib/license"

// Compute date range for a billing period (day 24 of prev month → day 23 of given month)
function periodRange(mes: number, anio: number) {
  const prevMes = mes === 1 ? 12 : mes - 1
  const prevAnio = mes === 1 ? anio - 1 : anio
  const start = new Date(prevAnio, prevMes - 1, 24, 0, 0, 0)
  const end   = new Date(anio, mes - 1, 23, 23, 59, 59)
  return { start: start.toISOString(), end: end.toISOString() }
}

export async function GET(req: NextRequest) {
  assertLicense()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const sp = req.nextUrl.searchParams
  const limit      = sanitizeLimit(sp.get("limit"), 25)
  const offset     = parseInt(sp.get("offset") ?? "0")
  const estado     = sp.get("estado") ?? ""
  const vendedorId = sp.get("id_vendedor") ?? ""
  const mes        = parseInt(sp.get("mes") ?? "0")
  const anio       = parseInt(sp.get("anio") ?? "0")

  const svc = await createServiceClient()
  let query = svc.from("comisiones")
    .select(`
      id, monto, estado,
      fecha_conversion, fecha_aprobacion, fecha_pago, notas,
      vendedores(id, nombre, codigo_unico),
      leads(id, folio, nombre, apellido_paterno, procedimiento),
      niveles_comision:id_nivel_snapshot(nombre, monto)
    `, { count: "exact" })
    .order("fecha_conversion", { ascending: false })
    .range(offset, offset + limit - 1)

  if (estado)     query = query.eq("estado", estado)
  if (vendedorId) query = query.eq("id_vendedor", vendedorId)

  if (mes > 0 && anio > 0) {
    const { start, end } = periodRange(mes, anio)
    query = query.gte("fecha_conversion", start).lte("fecha_conversion", end)
  }

  const { data, error, count } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await logAudit({ accion: "list_comisiones", tabla: "comisiones", id_usuario: user.id })
  return NextResponse.json({ data: data ?? [], total: count ?? 0, limit, offset })
}

export async function PATCH(req: NextRequest) {
  assertLicense()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { data: profile } = await supabase
    .from("user_profiles").select("rol").eq("id", user.id).single()
  if (!["admin", "supervisor"].includes(profile?.rol ?? ""))
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 })

  const body = await req.json()

  // Bulk update: { ids: number[], estado, notas? }
  if (Array.isArray(body.ids)) {
    const { ids, estado, notas } = body
    const updates: Record<string, unknown> = { estado }
    if (notas)                  updates.notas = notas
    if (estado === "aprobada")  updates.fecha_aprobacion = new Date().toISOString()
    if (estado === "pagada")    updates.fecha_pago = new Date().toISOString()

    const svc = await createServiceClient()
    const { error } = await svc.from("comisiones").update(updates).in("id", ids)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    await logAudit({
      accion: "bulk_update_comisiones", tabla: "comisiones",
      id_usuario: user.id, metadata: { ids, estado },
    })
    return NextResponse.json({ ok: true, count: ids.length })
  }

  // Single update: { id, estado, notas? }
  const { id, estado, notas } = body
  const updates: Record<string, unknown> = { estado }
  if (notas !== undefined)     updates.notas = notas
  if (estado === "aprobada")   updates.fecha_aprobacion = new Date().toISOString()
  if (estado === "pagada")     updates.fecha_pago = new Date().toISOString()

  const svc = await createServiceClient()
  const { data, error } = await svc
    .from("comisiones").update(updates).eq("id", id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await logAudit({
    accion: "update_comision", tabla: "comisiones",
    id_registro: id, id_usuario: user.id, metadata: { estado },
  })
  return NextResponse.json({ data })
}
