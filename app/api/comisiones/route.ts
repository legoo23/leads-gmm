import { NextRequest, NextResponse } from "next/server"
import { createServiceClient, createClient } from "@/lib/supabase/server"
import { logAudit, sanitizeLimit } from "@/lib/audit"
import { assertLicense } from "@/lib/license"

export async function GET(req: NextRequest) {
  assertLicense()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const sp = req.nextUrl.searchParams
  const limit = sanitizeLimit(sp.get("limit"), 50)
  const offset = parseInt(sp.get("offset") ?? "0")
  const estado = sp.get("estado")
  const id_vendedor = sp.get("id_vendedor")

  const svc = await createServiceClient()
  let query = svc.from("comisiones")
    .select(`
      *,
      vendedores(nombre, codigo_unico),
      leads(folio, nombre, procedimiento),
      niveles_comision:id_nivel_snapshot(nombre, monto)
    `, { count: "exact" })
    .order("fecha_conversion", { ascending: false })
    .range(offset, offset + limit - 1)

  if (estado) query = query.eq("estado", estado)
  if (id_vendedor) query = query.eq("id_vendedor", id_vendedor)

  const { data, error, count } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await logAudit({ accion: "list_comisiones", tabla: "comisiones", id_usuario: user.id })
  return NextResponse.json({ data, total: count })
}

export async function PATCH(req: NextRequest) {
  assertLicense()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { data: profile } = await supabase.from("user_profiles").select("rol").eq("id", user.id).single()
  if (!["admin", "supervisor"].includes(profile?.rol ?? "")) {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 })
  }

  const body = await req.json()
  const { id, estado, notas } = body

  const updates: Record<string, unknown> = { estado }
  if (notas) updates.notas = notas
  if (estado === "aprobada") updates.fecha_aprobacion = new Date().toISOString()
  if (estado === "pagada") updates.fecha_pago = new Date().toISOString()

  const svc = await createServiceClient()
  const { data, error } = await svc.from("comisiones").update(updates).eq("id", id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await logAudit({ accion: "update_comision", tabla: "comisiones", id_registro: id, id_usuario: user.id, metadata: { estado } })
  return NextResponse.json({ data })
}
