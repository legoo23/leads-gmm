import { NextRequest, NextResponse } from "next/server"
import { createServiceClient, createClient } from "@/lib/supabase/server"
import { decryptField } from "@/lib/crypto"
import { assertLicense } from "@/lib/license"

export async function GET(req: NextRequest) {
  assertLicense()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const sp = req.nextUrl.searchParams
  const q     = sp.get("q")?.trim() || null
  const limit = Math.min(parseInt(sp.get("limit") ?? "50"), 200)

  const svc = await createServiceClient()
  const { data, error } = await svc.rpc("get_personas_list", {
    p_q:     q,
    p_limit: limit,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const personas = (Array.isArray(data) ? data : []).map((row: Record<string, unknown>) => ({
    ref_lead_id:       row.ref_lead_id,
    nombre:            row.nombre,
    apellido_paterno:  row.apellido_paterno,
    apellido_materno:  row.apellido_materno,
    telefono:          decryptField(row.telefono_enc as string | null),
    email:             decryptField(row.email_enc    as string | null),
    curp:              decryptField(row.curp_enc     as string | null),
    telefono_hash:     row.telefono_hash,
    estado_ciudad:     row.estado_ciudad,
    leads_count:       row.leads_count,
    ultima_etapa:      row.ultima_etapa,
    fecha_primer_lead: row.fecha_primer_lead,
    fecha_ultimo_lead: row.fecha_ultimo_lead,
  }))

  return NextResponse.json({ data: personas })
}
