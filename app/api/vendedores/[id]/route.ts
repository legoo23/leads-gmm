import { NextRequest, NextResponse } from "next/server"
import { createServiceClient, createClient } from "@/lib/supabase/server"
import { logAudit } from "@/lib/audit"
import { normalizePhone, normalizeEmail } from "@/lib/utils"
import { assertLicense } from "@/lib/license"

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  assertLicense()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { id } = await params
  const svc = await createServiceClient()
  const { data, error } = await svc
    .from("vendedores")
    .select("*, niveles_comision(*)")
    .eq("id", id)
    .single()

  if (error) return NextResponse.json({ error: "No encontrado" }, { status: 404 })
  return NextResponse.json({ data })
}

export async function PATCH(req: NextRequest, { params }: Params) {
  assertLicense()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { data: profile } = await supabase.from("user_profiles").select("rol").eq("id", user.id).single()
  if (!["admin", "supervisor"].includes(profile?.rol ?? "")) {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 })
  }

  const { id } = await params
  const body = await req.json()
  const svc  = await createServiceClient()

  const UP = (v: unknown) => v ? String(v).trim().toUpperCase() : null

  const updates: Record<string, unknown> = {}

  if (body.nombre           !== undefined) updates.nombre           = UP(body.nombre)
  if (body.apellido_paterno !== undefined) updates.apellido_paterno = UP(body.apellido_paterno)
  if (body.apellido_materno !== undefined) updates.apellido_materno = UP(body.apellido_materno)
  if (body.telefono         !== undefined) updates.telefono         = normalizePhone(body.telefono) || body.telefono || null
  if (body.telefono_alternativo !== undefined) updates.telefono_alternativo = body.telefono_alternativo || null
  if (body.email            !== undefined) updates.email            = normalizeEmail(body.email) || null
  if (body.id_nivel         !== undefined) updates.id_nivel         = body.id_nivel ? parseInt(body.id_nivel) : null
  if (body.activo           !== undefined) updates.activo           = body.activo
  if (body.rfc              !== undefined) updates.rfc              = UP(body.rfc)
  if (body.curp             !== undefined) updates.curp             = UP(body.curp)
  if (body.fecha_nacimiento !== undefined) updates.fecha_nacimiento = body.fecha_nacimiento || null
  if (body.calle            !== undefined) updates.calle            = UP(body.calle)
  if (body.numero_exterior  !== undefined) updates.numero_exterior  = UP(body.numero_exterior)
  if (body.colonia          !== undefined) updates.colonia          = UP(body.colonia)
  if (body.ciudad           !== undefined) updates.ciudad           = UP(body.ciudad)
  if (body.estado           !== undefined) updates.estado           = UP(body.estado)
  if (body.codigo_postal    !== undefined) updates.codigo_postal    = body.codigo_postal || null
  if (body.banco            !== undefined) updates.banco            = UP(body.banco)
  if (body.titular_cuenta   !== undefined) updates.titular_cuenta   = UP(body.titular_cuenta)
  if (body.numero_cuenta    !== undefined) updates.numero_cuenta    = body.numero_cuenta || null
  if (body.clabe            !== undefined) updates.clabe            = body.clabe || null
  if (body.referencia_pago  !== undefined) updates.referencia_pago  = body.referencia_pago || null
  if (body.notas            !== undefined) updates.notas            = UP(body.notas)

  const { data, error } = await svc
    .from("vendedores")
    .update(updates)
    .eq("id", id)
    .select("*, niveles_comision(*)")
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await logAudit({ accion: "update_vendedor", tabla: "vendedores", id_registro: id, id_usuario: user.id })
  return NextResponse.json({ data })
}
