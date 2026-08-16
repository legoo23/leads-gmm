import { NextRequest, NextResponse } from "next/server"
import { createServiceClient, createClient } from "@/lib/supabase/server"
import { assertLicense } from "@/lib/license"
import { logAudit, extractIP } from "@/lib/audit"

type Params = { params: Promise<{ id: string }> }

// T-05: Genera una URL firmada de 1 hora para la carta de autorización.
// Registra en audit_log quién accedió y cuándo — nunca expone el path directo al cliente.
export async function GET(req: NextRequest, { params }: Params) {
  assertLicense()
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const svc = await createServiceClient()

  const { data: lead, error } = await svc
    .from("leads")
    .select("carta_autorizacion_path, carta_autorizacion_url")
    .eq("id", id)
    .single()

  if (error || !lead) return NextResponse.json({ error: "Lead no encontrado" }, { status: 404 })

  const path = lead.carta_autorizacion_path

  // Compatibilidad con registros anteriores que usan URL larga (sin path)
  if (!path) {
    if (lead.carta_autorizacion_url) {
      await logAudit({
        accion: "view_carta_legacy",
        tabla: "leads",
        id_registro: id,
        id_usuario: user.id,
        ip: extractIP(req),
      })
      return NextResponse.json({ url: lead.carta_autorizacion_url, legacy: true })
    }
    return NextResponse.json({ error: "Sin carta de autorización" }, { status: 404 })
  }

  // URL firmada de corta duración: 1 hora
  const { data: signed, error: signErr } = await svc.storage
    .from("lead-docs")
    .createSignedUrl(path, 60 * 60)

  if (signErr || !signed) {
    return NextResponse.json({ error: "Error al generar enlace temporal" }, { status: 500 })
  }

  await logAudit({
    accion: "view_carta_autorizacion",
    tabla: "leads",
    id_registro: id,
    id_usuario: user.id,
    ip: extractIP(req),
    metadata: { path },
  })

  return NextResponse.json({ url: signed.signedUrl, expiresIn: 3600 })
}
