import { NextRequest, NextResponse } from "next/server"
import { createServiceClient, createClient } from "@/lib/supabase/server"
import { logAudit } from "@/lib/audit"
import { generateVendorCode, normalizePhone, normalizeEmail } from "@/lib/utils"
import { assertLicense } from "@/lib/license"
import { sendWelcomeVendedor } from "@/lib/email"

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
  const svc  = await createServiceClient()
  const codigo_unico = generateVendorCode(PREFIX)

  const row = {
    nombre:              String(body.nombre ?? "").trim().toUpperCase(),
    apellido_paterno:    body.apellido_paterno ? String(body.apellido_paterno).trim().toUpperCase() : null,
    apellido_materno:    body.apellido_materno ? String(body.apellido_materno).trim().toUpperCase() : null,
    telefono:            normalizePhone(body.telefono) || body.telefono || null,
    telefono_alternativo: body.telefono_alternativo || null,
    email:               normalizeEmail(body.email) || null,
    id_nivel:            body.id_nivel ? parseInt(body.id_nivel) : null,
    codigo_unico,
    activo:              true,
    rfc:                 body.rfc   ? String(body.rfc).trim().toUpperCase()  : null,
    curp:                body.curp  ? String(body.curp).trim().toUpperCase() : null,
    fecha_nacimiento:    body.fecha_nacimiento || null,
    // Dirección
    calle:               body.calle           ? String(body.calle).toUpperCase()           : null,
    numero_exterior:     body.numero_exterior ? String(body.numero_exterior).toUpperCase() : null,
    colonia:             body.colonia         ? String(body.colonia).toUpperCase()         : null,
    ciudad:              body.ciudad          ? String(body.ciudad).toUpperCase()          : null,
    estado:              body.estado          ? String(body.estado).toUpperCase()          : null,
    codigo_postal:       body.codigo_postal   || null,
    // Datos bancarios
    banco:               body.banco           ? String(body.banco).toUpperCase()           : null,
    titular_cuenta:      body.titular_cuenta  ? String(body.titular_cuenta).toUpperCase() : null,
    numero_cuenta:       body.numero_cuenta   || null,
    clabe:               body.clabe           || null,
    referencia_pago:     body.referencia_pago || null,
    notas:               body.notas           ? String(body.notas).toUpperCase()           : null,
  }

  const { data, error } = await svc.from("vendedores").insert(row).select("*, niveles_comision(*)").single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await logAudit({ accion: "create_vendedor", tabla: "vendedores", id_registro: data.id, id_usuario: user.id })

  if (data.email) {
    // Invitar al vendedor vía Supabase Auth para que cree su contraseña
    const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://ihelpmedica.mx"
    const { data: authUser, error: inviteError } = await svc.auth.admin.inviteUserByEmail(
      data.email,
      {
        data:       { nombre: data.nombre, rol: "vendedor" },
        redirectTo: `${APP_URL}/auth/callback?next=/auth/update-password`,
      }
    )
    if (inviteError) {
      console.error("[invite vendedor]", inviteError.message)
    } else if (authUser?.user) {
      await svc.from("user_profiles").upsert(
        { id: authUser.user.id, rol: "vendedor", nombre: data.nombre },
        { onConflict: "id" }
      )
    }

    // Email de bienvenida con QR — falla silenciosamente
    const nivel = data.niveles_comision as { nombre: string; monto: number } | null
    sendWelcomeVendedor({
      nombre:           data.nombre,
      apellido_paterno: data.apellido_paterno,
      email:            data.email,
      codigo_unico:     data.codigo_unico,
      nivel_nombre:     nivel?.nombre ?? null,
      nivel_monto:      nivel?.monto  ?? null,
    }).catch((e) => console.error("[email bienvenida]", e.message))
  }

  return NextResponse.json({ data }, { status: 201 })
}
