import { NextRequest, NextResponse } from "next/server"
import { createServiceClient, createClient } from "@/lib/supabase/server"
import { encryptField, hashField, decryptField } from "@/lib/crypto"
import { logAudit } from "@/lib/audit"
import { normalizePhone, normalizeEmail, normalizeCurp } from "@/lib/utils"
import { assertLicense } from "@/lib/license"

type Params = { params: Promise<{ id: string }> }

const CLOSURE_ETAPAS = ["ganado", "no_viable", "perdido"]

export async function GET(_req: NextRequest, { params }: Params) {
  assertLicense()
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const svc = await createServiceClient()
  const { data, error } = await svc.from("leads")
    .select(`*, vendedores(*), aseguradoras(*), medicos(*), hospitales:id_hospital(*)`)
    .eq("id", id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 404 })

  const decrypted = {
    ...data,
    telefono: decryptField(data.telefono_enc),
    email: decryptField(data.email_enc),
    curp: decryptField(data.curp_enc),
    numero_poliza: decryptField(data.numero_poliza_enc),
  }

  await logAudit({ accion: "view_lead", tabla: "leads", id_registro: id, id_usuario: user.id })
  return NextResponse.json({ data: decrypted })
}

export async function PATCH(req: NextRequest, { params }: Params) {
  assertLicense()
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const body = await req.json()
  const svc = await createServiceClient()

  const updates: Record<string, unknown> = { ...body }

  // Encrypt PII fields
  if (body.telefono !== undefined) {
    const rawTel = String(body.telefono ?? "").trim()
    const t = normalizePhone(rawTel) || rawTel
    updates.telefono_enc = encryptField(t)
    updates.telefono_hash = hashField(t)
    delete updates.telefono
  }
  if (body.email !== undefined) {
    const e = normalizeEmail(body.email)
    updates.email_enc = encryptField(e)
    updates.email_hash = hashField(e)
    delete updates.email
  }
  if (body.curp !== undefined) {
    const c = normalizeCurp(body.curp)
    updates.curp_enc = encryptField(c)
    updates.curp_hash = hashField(c)
    delete updates.curp
  }
  if (body.numero_poliza !== undefined) {
    updates.numero_poliza_enc = encryptField(body.numero_poliza)
    delete updates.numero_poliza
  }
  if (body.nombre !== undefined) {
    updates.nombre_enc = encryptField(body.nombre)
  }

  // Auto-advance etapa (skip if caller is explicitly setting it)
  if (!body.etapa) {
    const { data: current } = await svc.from("leads")
      .select("etapa, diagnostico_principal, id_aseguradora, numero_poliza_enc")
      .eq("id", id)
      .single()

    if (current && !CLOSURE_ETAPAS.includes(current.etapa)) {
      const mergedDiagnostico = body.diagnostico_principal || current.diagnostico_principal
      const mergedAseguradora = body.id_aseguradora || current.id_aseguradora
      const willHavePoliza = body.numero_poliza ? true : !!current.numero_poliza_enc

      if (current.etapa === "nuevo") {
        updates.etapa = "contactado"
        updates.fecha_contacto = new Date().toISOString()
      } else if (current.etapa === "contactado" && mergedDiagnostico) {
        updates.etapa = "necesidad_identificada"
      } else if (current.etapa === "necesidad_identificada" && mergedAseguradora && willHavePoliza) {
        updates.etapa = "seguro_identificado"
      }
    }
  }

  const { data, error } = await svc.from("leads").update(updates).eq("id", id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await logAudit({ accion: "update_lead", tabla: "leads", id_registro: id, id_usuario: user.id, metadata: { fields: Object.keys(body) } })
  return NextResponse.json({ data })
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  assertLicense()
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { data: profile } = await supabase.from("user_profiles").select("rol").eq("id", user.id).single()
  if (!["admin", "gerente"].includes(profile?.rol ?? "")) {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 })
  }

  const svc = await createServiceClient()
  const { error } = await svc.from("leads").delete().eq("id", id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await logAudit({ accion: "delete_lead", tabla: "leads", id_registro: id, id_usuario: user.id })
  return NextResponse.json({ ok: true })
}
