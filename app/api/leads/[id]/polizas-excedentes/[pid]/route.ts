import { NextRequest, NextResponse } from "next/server"
import { createServiceClient, createClient } from "@/lib/supabase/server"
import { assertLicense } from "@/lib/license"

type Params = { params: Promise<{ id: string; pid: string }> }

export async function PATCH(req: NextRequest, { params }: Params) {
  assertLicense()
  const { id, pid } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const body = await req.json()
  const svc = await createServiceClient()

  const clean: Record<string, unknown> = {
    aseguradora_nombre: body.aseguradora_nombre?.toString().toUpperCase() || null,
    tipo_plan: body.tipo_plan || null,
    numero_poliza: body.numero_poliza?.toString().toUpperCase() || null,
    numero_certificado: body.numero_certificado?.toString().toUpperCase() || null,
    nombre_titular: body.nombre_titular?.toString().toUpperCase() || null,
    vigencia_inicio: body.vigencia_inicio || null,
    vigencia_fin: body.vigencia_fin || null,
    suma_asegurada: body.suma_asegurada ? parseFloat(String(body.suma_asegurada)) : null,
    moneda: body.moneda || "MXN",
    deducible: body.deducible ? parseFloat(String(body.deducible)) : null,
    coaseguro_pct: body.coaseguro_pct ? parseFloat(String(body.coaseguro_pct)) : null,
    tope_coaseguro: body.tope_coaseguro ? parseFloat(String(body.tope_coaseguro)) : null,
    periodo_espera_activo: body.periodo_espera_activo ?? null,
    notas: body.notas?.toString().toUpperCase() || null,
  }

  const { data, error } = await svc
    .from("polizas_excedentes")
    .update(clean)
    .eq("id", pid)
    .eq("id_lead", id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  assertLicense()
  const { id, pid } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const svc = await createServiceClient()
  const { error } = await svc
    .from("polizas_excedentes")
    .delete()
    .eq("id", pid)
    .eq("id_lead", id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
