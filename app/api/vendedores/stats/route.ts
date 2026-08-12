import { NextRequest, NextResponse } from "next/server"
import { createServiceClient, createClient } from "@/lib/supabase/server"
import { assertLicense } from "@/lib/license"

export async function GET(req: NextRequest) {
  assertLicense()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const sp = req.nextUrl.searchParams
  const rawDesde = sp.get("fecha_desde")
  const rawHasta = sp.get("fecha_hasta")

  const fechaDesde = rawDesde ? new Date(rawDesde + "T00:00:00").toISOString() : null
  const fechaHasta = rawHasta ? new Date(rawHasta + "T00:00:00").toISOString() : null

  const svc = await createServiceClient()
  const { data, error } = await svc.rpc("get_vendedor_stats", {
    p_fecha_desde: fechaDesde,
    p_fecha_hasta: fechaHasta,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data: data ?? [] })
}
