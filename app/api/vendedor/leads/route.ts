import { NextRequest, NextResponse } from "next/server"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import { assertLicense } from "@/lib/license"
import { normalizePhone } from "@/lib/utils"

// Etapas internas → etiqueta simplificada para el vendedor
const VENDOR_STAGE: Record<string, { label: string; color: string; bg: string }> = {
  nuevo:                   { label: "Recibido",      color: "#6B7280", bg: "#F3F4F6" },
  contactado:              { label: "Contactado",    color: "#2563EB", bg: "#DBEAFE" },
  necesidad_identificada:  { label: "En Proceso",    color: "#7C3AED", bg: "#EDE9FE" },
  seguro_identificado:     { label: "En Proceso",    color: "#7C3AED", bg: "#EDE9FE" },
  en_validacion:           { label: "En Validación", color: "#D97706", bg: "#FEF3C7" },
  viable:                  { label: "En Validación", color: "#D97706", bg: "#FEF3C7" },
  programado:              { label: "Programado",    color: "#059669", bg: "#ECFDF5" },
  ganado:                  { label: "Programado",    color: "#059669", bg: "#ECFDF5" },
  no_viable:               { label: "No Procedió",   color: "#DC2626", bg: "#FEF2F2" },
  perdido:                 { label: "No Procedió",   color: "#DC2626", bg: "#FEF2F2" },
}

export async function GET(req: NextRequest) {
  assertLicense()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const svc = await createServiceClient()

  const parts: string[] = []
  if (user.email) parts.push(`email.eq.${user.email}`)
  const phone = normalizePhone(user.phone ?? "")
  if (phone) parts.push(`telefono.eq.${phone}`)
  if (!parts.length) return NextResponse.json({ error: "Sin identificador" }, { status: 404 })

  const { data: vendedor } = await svc
    .from("vendedores")
    .select("id")
    .or(parts.join(","))
    .maybeSingle()
  if (!vendedor) return NextResponse.json({ error: "Vendedor no encontrado" }, { status: 404 })

  const { data: leads, error } = await svc
    .from("leads")
    .select(`
      id, folio, nombre, apellido_paterno, etapa, procedimiento, fecha_captura,
      comisiones(id, monto, estado, fecha_conversion)
    `)
    .eq("id_vendedor", vendedor.id)
    .order("fecha_captura", { ascending: false })
    .limit(200)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Mapear etapas internas a etiquetas simplificadas
  const result = (leads ?? []).map((lead) => {
    const stage = VENDOR_STAGE[lead.etapa] ?? VENDOR_STAGE.nuevo
    const comisionRecord = Array.isArray(lead.comisiones) ? lead.comisiones[0] : null
    return {
      folio: lead.folio,
      nombre: `${lead.nombre ?? ""} ${lead.apellido_paterno ?? ""}`.trim(),
      procedimiento: lead.procedimiento ?? null,
      fecha_captura: lead.fecha_captura,
      etapa_label: stage.label,
      etapa_color: stage.color,
      etapa_bg: stage.bg,
      comision: comisionRecord
        ? { monto: comisionRecord.monto, estado: comisionRecord.estado, fecha: comisionRecord.fecha_conversion }
        : null,
    }
  })

  return NextResponse.json({ data: result, total: result.length })
}
