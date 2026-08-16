import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { createServiceClient } from "@/lib/supabase/server"
import { assertLicense } from "@/lib/license"
import { logAudit, extractIP } from "@/lib/audit"
import type { Database } from "@/types/supabase"

async function getUser() {
  const cookieStore = await cookies()
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  assertLicense()
  const user = await getUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { id } = await params
  let body: Record<string, unknown>
  try { body = await req.json() }
  catch { return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 }) }

  const patch: Record<string, unknown> = {}
  if (body.nombre !== undefined)
    patch.nombre = String(body.nombre).trim().toUpperCase()
  if (body.nombre_corto !== undefined)
    patch.nombre_corto = body.nombre_corto ? String(body.nombre_corto).trim().toUpperCase() : null
  if (body.activo !== undefined)
    patch.activo = Boolean(body.activo)

  const svc = createServiceClient()
  const { data, error } = await svc
    .from("aseguradoras")
    .update(patch)
    .eq("id", parseInt(id))
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // T-01: auditar edición de aseguradora
  await logAudit({
    accion: "update_aseguradora",
    tabla: "aseguradoras",
    id_registro: id,
    id_usuario: user?.id ?? "desconocido",
    ip: extractIP(req),
    metadata: { campos: Object.keys(patch) },
  })
  return NextResponse.json({ data })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  assertLicense()
  const user = await getUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { id } = await params
  const svc = createServiceClient()

  // Soft delete — desactivar, no borrar (puede haber leads vinculados)
  const { data, error } = await svc
    .from("aseguradoras")
    .update({ activo: false })
    .eq("id", parseInt(id))
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // T-01: auditar desactivación de aseguradora
  await logAudit({
    accion: "delete_aseguradora",
    tabla: "aseguradoras",
    id_registro: id,
    id_usuario: user?.id ?? "desconocido",
    ip: extractIP(req),
  })
  return NextResponse.json({ data })
}
