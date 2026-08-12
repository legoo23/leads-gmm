import { NextRequest, NextResponse } from "next/server"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import { assertLicense } from "@/lib/license"

export async function GET(_req: NextRequest) {
  assertLicense()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const svc = await createServiceClient()
  const today = new Date().toISOString().split("T")[0]

  const { data, error } = await svc
    .from("campanas")
    .select("id, nombre, procedimiento, fecha_inicio, fecha_fin, activa")
    .eq("activa", true)
    .or(`fecha_fin.is.null,fecha_fin.gte.${today}`)
    .order("created_at", { ascending: false })
    .limit(20)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data: data ?? [] })
}
