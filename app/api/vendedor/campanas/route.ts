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
    .select("id, nombre, procedimiento_target, descripcion, vigencia_inicio, vigencia_fin, codigo_unico")
    .eq("activa", true)
    .eq("visible_vendedores", true)
    .or(`vigencia_fin.is.null,vigencia_fin.gte.${today}`)
    .order("fecha_creacion", { ascending: false })
    .limit(20)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data: data ?? [] })
}
