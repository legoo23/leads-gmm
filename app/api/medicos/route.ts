import { NextRequest, NextResponse } from "next/server"
import { createServiceClient, createClient } from "@/lib/supabase/server"
import { assertLicense } from "@/lib/license"

export async function GET(req: NextRequest) {
  assertLicense()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const sp = req.nextUrl.searchParams
  const q = sp.get("q")?.trim() ?? ""
  const soloRed = sp.get("red") === "true"
  const limit = Math.min(parseInt(sp.get("limit") ?? "8"), 20)

  const svc = await createServiceClient()
  let query = svc
    .from("medicos")
    .select("id, nombre, especialidad, telefono, email, cedula, en_red, id_hospital, hospitales:id_hospital(nombre, ciudad)")
    .eq("activo", true)
    .order("nombre")
    .limit(limit)

  if (q.length >= 2) query = query.ilike("nombre", `%${q}%`)
  if (soloRed) query = query.eq("en_red", true)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data: data ?? [] })
}
