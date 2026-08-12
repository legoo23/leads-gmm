import { NextRequest, NextResponse } from "next/server"
import { createServiceClient, createClient } from "@/lib/supabase/server"
import { logAudit } from "@/lib/audit"
import { assertLicense } from "@/lib/license"

const ETAPAS_VALIDAS = [
  "nuevo", "contactado", "necesidad_identificada", "seguro_identificado",
  "viable", "programado", "ganado", "no_viable", "perdido",
]

// Etapas activas (no cierre) desde las que se puede avanzar manualmente
const ETAPAS_ACTIVAS = [
  "nuevo", "contactado", "necesidad_identificada", "seguro_identificado", "viable", "programado",
]

type Params = { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, { params }: Params) {
  assertLicense()
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const body = await req.json()
  const { etapa, notas } = body

  if (!ETAPAS_VALIDAS.includes(etapa)) {
    return NextResponse.json({ error: "Etapa inválida" }, { status: 400 })
  }

  const svc = await createServiceClient()

  // Obtener estado actual del lead
  const { data: lead } = await svc
    .from("leads")
    .select("etapa, estado, carta_autorizacion_url, numero_autorizacion, fecha_tentativa")
    .eq("id", id)
    .single()
  if (!lead) return NextResponse.json({ error: "Lead no encontrado" }, { status: 404 })

  // Validación especial para "programado": requiere carta o número de autorización
  if (etapa === "programado") {
    const tieneCarta = !!lead.carta_autorizacion_url
    const tieneNumeroAuth = !!lead.numero_autorizacion
    if (!tieneCarta && !tieneNumeroAuth) {
      return NextResponse.json({
        error: "Para marcar como Programado se requiere la carta de autorización (subida en pestaña Seguro) o el número de autorización capturado.",
        code: "REQUIERE_CARTA",
      }, { status: 422 })
    }
  }

  // Validación: viable y programado solo desde etapas activas
  if (["viable", "programado"].includes(etapa) && !ETAPAS_ACTIVAS.includes(lead.etapa)) {
    return NextResponse.json({
      error: "No se puede cambiar a esta etapa desde el estado actual del lead.",
    }, { status: 422 })
  }

  const updates: Record<string, unknown> = { etapa }

  if (["ganado", "perdido", "no_viable"].includes(etapa)) {
    updates.estado = etapa === "ganado" ? "convertido" : "perdido"
    if (etapa === "ganado") updates.fecha_conversion = new Date().toISOString()
  }
  if (etapa === "contactado" && lead.etapa === "nuevo") {
    updates.fecha_contacto = new Date().toISOString()
  }
  if (notas) updates.notas = notas

  const { data, error } = await svc.from("leads").update(updates).eq("id", id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await logAudit({
    accion: "cambio_etapa",
    tabla: "leads",
    id_registro: id,
    id_usuario: user.id,
    metadata: { etapa_anterior: lead.etapa, etapa_nueva: etapa },
  })

  return NextResponse.json({ data })
}
