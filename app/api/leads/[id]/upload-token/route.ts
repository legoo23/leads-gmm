import { NextRequest, NextResponse } from "next/server"
import { createServiceClient, createClient } from "@/lib/supabase/server"
import { logAudit } from "@/lib/audit"

type Params = { params: Promise<{ id: string }> }

// GET — obtener token activo del lead (si existe)
export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const svc = createServiceClient()
  const { data } = await svc
    .from("upload_tokens")
    .select("id, token, expires_at, activo, docs_requeridos, created_at")
    .eq("id_lead", id)
    .eq("activo", true)
    .gte("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .single()

  return NextResponse.json({ data })
}

// POST — generar un nuevo token de carga para este lead
export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const docs = Array.isArray(body.docs_requeridos)
    ? body.docs_requeridos
    : ["poliza", "ine"]

  const svc = createServiceClient()

  // Desactivar tokens previos del lead
  await svc.from("upload_tokens")
    .update({ activo: false })
    .eq("id_lead", id)

  // Crear token nuevo (válido 48 horas)
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
  const { data, error } = await svc.from("upload_tokens").insert({
    id_lead:         Number(id),
    creado_por:      user.id,
    expires_at:      expiresAt,
    docs_requeridos: docs,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://leads-gmm.vercel.app"
  const link = `${appUrl}/docs/${data.token}`

  await logAudit({
    accion: "generate_upload_token",
    tabla: "upload_tokens",
    id_registro: id,
    id_usuario: user.id,
    metadata: { docs_requeridos: docs, expires_at: expiresAt },
  })

  return NextResponse.json({ data: { ...data, link } })
}
