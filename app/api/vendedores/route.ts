import { NextRequest, NextResponse } from "next/server"
import { createServiceClient, createClient } from "@/lib/supabase/server"
import { logAudit } from "@/lib/audit"
import { generateVendorCode, normalizePhone, normalizeEmail } from "@/lib/utils"
import { assertLicense } from "@/lib/license"

const PREFIX = process.env.NEXT_PUBLIC_VENDOR_CODE_PREFIX ?? "GMM"

export async function GET(_req: NextRequest) {
  assertLicense()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const svc = await createServiceClient()
  const { data, error } = await svc
    .from("vendedores")
    .select("*, niveles_comision(*)")
    .order("fecha_registro", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(req: NextRequest) {
  assertLicense()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { data: profile } = await supabase.from("user_profiles").select("rol").eq("id", user.id).single()
  if (profile?.rol !== "admin") return NextResponse.json({ error: "Solo admin puede crear vendedores" }, { status: 403 })

  const body = await req.json()
  const svc = await createServiceClient()
  const codigo_unico = generateVendorCode(PREFIX)

  const row = {
    nombre: body.nombre,
    telefono: normalizePhone(body.telefono),
    email: normalizeEmail(body.email),
    id_nivel: body.id_nivel,
    codigo_unico,
    activo: true,
  }

  const { data, error } = await svc.from("vendedores").insert(row).select("*, niveles_comision(*)").single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await logAudit({ accion: "create_vendedor", tabla: "vendedores", id_registro: data.id, id_usuario: user.id })
  return NextResponse.json({ data }, { status: 201 })
}
