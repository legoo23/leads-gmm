import { NextRequest, NextResponse } from "next/server"
import { createServiceClient, createClient } from "@/lib/supabase/server"
import { assertLicense } from "@/lib/license"
import { logAudit, extractIP } from "@/lib/audit"

type Params = { params: Promise<{ id: string }> }

// S-03: roles alineados con CHECK constraint de BD (020_security_performance.sql)
const ROLES_INTERNOS = ["admin", "supervisor", "agente", "gerente", "ejecutivo", "visualizador"]

export async function PATCH(req: NextRequest, { params }: Params) {
  assertLicense()
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { data: profile } = await supabase.from("user_profiles").select("rol").eq("id", user.id).single()
  if (profile?.rol !== "admin") return NextResponse.json({ error: "Solo admin" }, { status: 403 })

  const body = await req.json()
  if (body.rol && !ROLES_INTERNOS.includes(body.rol)) {
    return NextResponse.json({ error: "Rol inválido" }, { status: 400 })
  }
  // No permitir que el admin se dé de baja a sí mismo
  if (body.activo === false && id === user.id) {
    return NextResponse.json({ error: "No puedes darte de baja a ti mismo" }, { status: 400 })
  }

  const updates: Record<string, unknown> = {}
  if (body.rol) updates.rol = body.rol
  if (body.nombre) updates.nombre = body.nombre.trim()
  if (body.activo !== undefined) updates.activo = body.activo

  const svc = await createServiceClient()

  // Sincronizar ban en Supabase Auth cuando cambia activo
  if (body.activo !== undefined) {
    await svc.auth.admin.updateUserById(id, {
      ban_duration: body.activo ? "none" : "876000h",
    })
  }

  const { data, error } = await svc.from("user_profiles").update(updates).eq("id", id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // T-01: auditar cambios de usuario (incluyendo bajas)
  const accion = body.activo !== undefined
    ? (body.activo ? "reactivar_usuario" : "baja_usuario")
    : "update_usuario"
  await logAudit({
    accion,
    tabla: "user_profiles",
    id_registro: id,
    id_usuario: user.id,
    ip: extractIP(req),
    metadata: { campos: Object.keys(updates) },
  })

  return NextResponse.json({ data })
}
