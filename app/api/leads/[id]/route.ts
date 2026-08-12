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
    .select(`*, vendedores(*), aseguradoras(*), medicos(*), hospitales:id_hospital(*), campanas:id_campana(nombre, codigo_unico)`)
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
    const polizaUpper = body.numero_poliza ? String(body.numero_poliza).toUpperCase() : ""
    updates.numero_poliza_enc = encryptField(polizaUpper)
    delete updates.numero_poliza
  }
  if (body.nombre !== undefined) {
    const n = String(body.nombre ?? "").trim().toUpperCase()
    updates.nombre = n
    updates.nombre_enc = encryptField(n)
  }
  if (body.apellido_paterno !== undefined)
    updates.apellido_paterno = body.apellido_paterno ? String(body.apellido_paterno).trim().toUpperCase() : null
  if (body.apellido_materno !== undefined)
    updates.apellido_materno = body.apellido_materno ? String(body.apellido_materno).trim().toUpperCase() : null
  if (body.notas !== undefined)
    updates.notas = body.notas ? String(body.notas).toUpperCase() : null

  const UP = (v: unknown) => v ? String(v).toUpperCase() : null
  if (body.diagnostico_principal  !== undefined) updates.diagnostico_principal  = UP(body.diagnostico_principal)
  if (body.diagnosticos_secundarios !== undefined) updates.diagnosticos_secundarios = UP(body.diagnosticos_secundarios)
  if (body.cirugias_previas_desc  !== undefined) updates.cirugias_previas_desc  = UP(body.cirugias_previas_desc)
  if (body.notas_clinicas         !== undefined) updates.notas_clinicas         = UP(body.notas_clinicas)
  if (body.categoria_quirurgica   !== undefined) updates.categoria_quirurgica   = UP(body.categoria_quirurgica)
  if (body.codigo_procedimiento   !== undefined) updates.codigo_procedimiento   = UP(body.codigo_procedimiento)
  if (body.notas_procedimiento    !== undefined) updates.notas_procedimiento    = UP(body.notas_procedimiento)
  if (body.medico_asignado_nombre !== undefined) updates.medico_asignado_nombre = UP(body.medico_asignado_nombre)
  if (body.medico_especialidad    !== undefined) updates.medico_especialidad    = UP(body.medico_especialidad)
  if (body.medico_hospitales      !== undefined) updates.medico_hospitales      = UP(body.medico_hospitales)
  if (body.nombre_titular_poliza  !== undefined) updates.nombre_titular_poliza  = UP(body.nombre_titular_poliza)
  if (body.numero_certificado     !== undefined) updates.numero_certificado     = UP(body.numero_certificado)
  if (body.numero_autorizacion    !== undefined) updates.numero_autorizacion    = UP(body.numero_autorizacion)
  if (body.condiciones_excluidas  !== undefined) updates.condiciones_excluidas  = UP(body.condiciones_excluidas)
  if (body.contacto_aseguradora_nombre !== undefined) updates.contacto_aseguradora_nombre = UP(body.contacto_aseguradora_nombre)
  if (body.notas_validacion       !== undefined) updates.notas_validacion       = UP(body.notas_validacion)

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
