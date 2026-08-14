import { NextResponse } from "next/server"
import { assertLicense } from "@/lib/license"
import { createServiceClient } from "@/lib/supabase/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  assertLicense()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const svc = createServiceClient()

  const { data, error } = await svc
    .from("noticias_vendedores")
    .select("id, titulo, cuerpo, tipo, orden, created_at")
    .eq("activo", true)
    .order("orden", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(30)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ noticias: data ?? [] })
}
