import { NextRequest, NextResponse } from "next/server"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import { assertLicense } from "@/lib/license"
import { normalizePhone } from "@/lib/utils"

export async function GET(_req: NextRequest) {
  assertLicense()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const svc = await createServiceClient()

  const parts: string[] = []
  if (user.email) parts.push(`email.eq.${user.email}`)
  const phone = normalizePhone(user.phone ?? "")
  if (phone) parts.push(`telefono.eq.${phone}`)
  if (!parts.length) return NextResponse.json({ error: "Sin identificador de vendedor" }, { status: 404 })

  const { data: vendedor, error } = await svc
    .from("vendedores")
    .select("id, nombre, apellido_paterno, codigo_unico, activo, id_nivel, niveles_comision(id, nombre, monto)")
    .or(parts.join(","))
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!vendedor) return NextResponse.json({ error: "Vendedor no encontrado" }, { status: 404 })

  return NextResponse.json({ data: vendedor })
}
