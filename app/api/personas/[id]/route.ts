import { NextRequest, NextResponse } from "next/server"
import { createServiceClient, createClient } from "@/lib/supabase/server"
import { decryptField } from "@/lib/crypto"
import { assertLicense } from "@/lib/license"

type Params = { params: Promise<{ id: string }> }

// GET /api/personas/[lead_id] — profile + all leads for the same persona (by telefono_hash)
export async function GET(_req: NextRequest, { params }: Params) {
  assertLicense()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { id } = await params
  const svc = await createServiceClient()

  // 1. Get the reference lead to extract telefono_hash
  const { data: refLead, error: refErr } = await svc
    .from("leads")
    .select("id, nombre, apellido_paterno, apellido_materno, telefono_enc, email_enc, curp_enc, telefono_hash, estado_ciudad, fecha_nacimiento")
    .eq("id", id)
    .single()

  if (refErr || !refLead) return NextResponse.json({ error: "Persona no encontrada" }, { status: 404 })

  // 2. Get all leads for this persona (same telefono_hash, or just this lead if no hash)
  let leadsQuery = svc.from("leads")
    .select(`
      id, folio, etapa, procedimiento, fuente, fecha_captura, fecha_contacto,
      id_aseguradora, numero_autorizacion, carta_autorizacion_url,
      aseguradoras:id_aseguradora(nombre),
      id_agente, notas
    `)
    .order("fecha_captura", { ascending: false })
    .limit(50)

  if (refLead.telefono_hash) {
    leadsQuery = leadsQuery.eq("telefono_hash", refLead.telefono_hash)
  } else {
    leadsQuery = leadsQuery.eq("id", id)
  }

  const { data: leads, error: leadsErr } = await leadsQuery
  if (leadsErr) return NextResponse.json({ error: leadsErr.message }, { status: 500 })

  const profile = {
    ref_lead_id:      refLead.id,
    nombre:           refLead.nombre,
    apellido_paterno: refLead.apellido_paterno,
    apellido_materno: refLead.apellido_materno,
    telefono:         decryptField(refLead.telefono_enc),
    email:            decryptField(refLead.email_enc),
    curp:             decryptField(refLead.curp_enc),
    telefono_hash:    refLead.telefono_hash,
    estado_ciudad:    refLead.estado_ciudad,
    fecha_nacimiento: refLead.fecha_nacimiento,
  }

  return NextResponse.json({ profile, leads: leads ?? [] })
}
