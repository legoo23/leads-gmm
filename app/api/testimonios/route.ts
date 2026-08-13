import { NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"
import { assertLicense } from "@/lib/license"

// Endpoint público — landing page obtiene testimonios activos
export async function GET() {
  assertLicense()
  const svc = createServiceClient()
  const { data, error } = await svc
    .from("testimonios")
    .select("id, nombre, detalle, texto, estrellas")
    .eq("activo", true)
    .order("orden", { ascending: true })
    .order("id",    { ascending: true })

  if (error) return NextResponse.json({ data: [] })
  return NextResponse.json({ data })
}
