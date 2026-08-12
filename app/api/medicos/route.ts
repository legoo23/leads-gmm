import { NextRequest, NextResponse } from "next/server"
import { createServiceClient, createClient } from "@/lib/supabase/server"
import { assertLicense } from "@/lib/license"

export async function GET(req: NextRequest) {
  assertLicense()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const sp = req.nextUrl.searchParams
  const q           = sp.get("q")?.trim() ?? ""
  const especialidad = sp.get("especialidad")?.trim() ?? ""
  const cobertura   = sp.get("cobertura")?.trim() ?? ""
  const soloRed     = sp.get("red") === "true"
  const limit       = Math.min(parseInt(sp.get("limit") ?? "50"), 100)
  const offset      = parseInt(sp.get("offset") ?? "0")

  const svc = await createServiceClient()
  let query = svc
    .from("medicos")
    .select(
      "id, nombre, especialidad, sub_especialidad, hospital, telefono, telefono_secundario, email, cedula, cobertura, consultorio, aseguradoras_aceptadas, notas, en_red, activo",
      { count: "exact" }
    )
    .eq("activo", true)
    .order("nombre")
    .range(offset, offset + limit - 1)

  if (q.length >= 2)           query = query.ilike("nombre", `%${q}%`)
  if (especialidad.length >= 2) query = query.ilike("especialidad", `%${especialidad}%`)
  if (cobertura.length >= 2)   query = query.ilike("cobertura", `%${cobertura}%`)
  if (soloRed)                  query = query.eq("en_red", true)

  const { data, error, count } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data: data ?? [], total: count ?? 0, limit, offset })
}

export async function POST(req: NextRequest) {
  assertLicense()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const body = await req.json()
  const svc = await createServiceClient()

  const { data, error } = await svc
    .from("medicos")
    .insert({
      nombre:                  body.nombre,
      especialidad:            body.especialidad || null,
      sub_especialidad:        body.sub_especialidad || null,
      hospital:                body.hospital || null,
      telefono:                body.telefono || null,
      telefono_secundario:     body.telefono_secundario || null,
      email:                   body.email || null,
      cedula:                  body.cedula || null,
      cobertura:               body.cobertura || null,
      consultorio:             body.consultorio || null,
      aseguradoras_aceptadas:  body.aseguradoras_aceptadas || null,
      notas:                   body.notas || null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data }, { status: 201 })
}
