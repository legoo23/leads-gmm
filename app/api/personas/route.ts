import { NextRequest, NextResponse } from "next/server"
import { createServiceClient, createClient } from "@/lib/supabase/server"
import { decryptField } from "@/lib/crypto"
import { sanitizeLimit } from "@/lib/audit"
import { assertLicense } from "@/lib/license"

export async function GET(req: NextRequest) {
  assertLicense()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const sp = req.nextUrl.searchParams
  const limit = sanitizeLimit(sp.get("limit"), 50)

  const svc = await createServiceClient()

  // Aggregate unique patients from leads (deduped by telefono_hash)
  const { data: leads, error } = await svc.from("leads")
    .select("id, nombre, apellido_paterno, nombre_enc, telefono_enc, email_enc, curp_enc, telefono_hash, fecha_captura")
    .order("fecha_captura", { ascending: false })
    .limit(limit)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Group by telefono_hash for dedup
  const seen = new Set<string>()
  const personas = []
  for (const lead of (leads ?? [])) {
    const key = lead.telefono_hash ?? `id-${lead.id}`
    if (seen.has(key)) continue
    seen.add(key)

    const countRes = await svc.from("leads").select("id", { count: "exact" })
      .eq("telefono_hash", lead.telefono_hash)
    const count = countRes.count ?? 1

    personas.push({
      id: lead.id,
      nombre: lead.nombre,
      apellido_paterno: lead.apellido_paterno,
      telefono: decryptField(lead.telefono_enc),
      email: decryptField(lead.email_enc),
      curp: decryptField(lead.curp_enc),
      leads_count: count,
      fecha_primer_lead: lead.fecha_captura,
    })
  }

  return NextResponse.json({ data: personas })
}
