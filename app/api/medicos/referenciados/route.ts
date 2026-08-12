import { NextRequest, NextResponse } from "next/server"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import { assertLicense } from "@/lib/license"

export async function GET(req: NextRequest) {
  assertLicense()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const sp = req.nextUrl.searchParams
  const medicoId = sp.get("medico_id")
  const limit    = Math.min(parseInt(sp.get("limit")  ?? "50"), 200)
  const offset   = parseInt(sp.get("offset") ?? "0")

  const svc = await createServiceClient()

  let query = svc
    .from("leads")
    .select(
      `id, folio, nombre, apellido_paterno, procedimiento, etapa, fecha_captura,
       medicos(id, nombre, especialidad, cobertura)`,
      { count: "exact" }
    )
    .not("id_medico", "is", null)
    .order("fecha_captura", { ascending: false })
    .range(offset, offset + limit - 1)

  if (medicoId) query = query.eq("id_medico", medicoId)

  const { data, error, count } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data: data ?? [], total: count ?? 0, limit, offset })
}
