import { NextRequest, NextResponse } from "next/server"
import { createServiceClient, createClient } from "@/lib/supabase/server"
import { assertLicense } from "@/lib/license"

export async function GET(req: NextRequest) {
  assertLicense()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { data: profile } = await supabase.from("user_profiles").select("rol").eq("id", user.id).single()
  const rol = profile?.rol ?? "agente"

  const sp = req.nextUrl.searchParams
  const etapa        = sp.get("etapa")       || null
  const fuente       = sp.get("fuente")      || null
  const rawDesde     = sp.get("fecha_desde") || null
  const rawHasta     = sp.get("fecha_hasta") || null
  const conMedicoRed = sp.get("con_medico_red") === "true"
  const idAgente     = rol === "agente" ? user.id : null

  const fechaDesde = rawDesde ? new Date(rawDesde + "T00:00:00").toISOString() : null
  const fechaHasta = rawHasta ? new Date(rawHasta + "T00:00:00").toISOString() : null

  const svc = await createServiceClient()
  const { data, error } = await svc.rpc("get_lead_stats", {
    p_fecha_desde:    fechaDesde,
    p_fecha_hasta:    fechaHasta,
    p_etapa:          etapa,
    p_fuente:         fuente,
    p_con_medico_red: conMedicoRed,
    p_id_agente:      idAgente,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // rpc returns the jsonb scalar directly
  return NextResponse.json(data ?? {})
}
