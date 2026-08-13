import { NextRequest, NextResponse } from "next/server"
import { createServiceClient, createClient } from "@/lib/supabase/server"
import { sendWelcomeVendedor } from "@/lib/email"
import { assertLicense } from "@/lib/license"
import { logAudit } from "@/lib/audit"

type Params = { params: Promise<{ id: string }> }

export async function POST(_req: NextRequest, { params }: Params) {
  assertLicense()
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { data: profile } = await supabase
    .from("user_profiles").select("rol").eq("id", user.id).single()
  if (!["admin", "supervisor"].includes(profile?.rol ?? ""))
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 })

  const svc = await createServiceClient()
  const { data: v, error } = await svc
    .from("vendedores")
    .select("id, nombre, apellido_paterno, email, codigo_unico, niveles_comision(nombre, monto)")
    .eq("id", id)
    .single()

  if (error || !v) return NextResponse.json({ error: "Vendedor no encontrado" }, { status: 404 })
  if (!v.email)    return NextResponse.json({ error: "El vendedor no tiene email registrado" }, { status: 422 })

  const nivel = v.niveles_comision as { nombre: string; monto: number } | null

  await sendWelcomeVendedor({
    nombre:           v.nombre,
    apellido_paterno: v.apellido_paterno,
    email:            v.email,
    codigo_unico:     v.codigo_unico,
    nivel_nombre:     nivel?.nombre ?? null,
    nivel_monto:      nivel?.monto  ?? null,
  })

  await logAudit({
    accion:      "send_welcome_email",
    tabla:       "vendedores",
    id_registro: id,
    id_usuario:  user.id,
  })

  return NextResponse.json({ ok: true })
}
