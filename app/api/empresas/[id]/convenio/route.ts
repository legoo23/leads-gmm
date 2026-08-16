import { NextRequest, NextResponse } from "next/server"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import { assertLicense } from "@/lib/license"
import { logAudit, extractIP } from "@/lib/audit"

// ── GET — datos de landing del convenio ───────────────────────────────────────

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  assertLicense()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

  const { id } = await params
  const svc = createServiceClient()

  const { data, error } = await svc
    .from("empresas")
    .select("id, slug, logo_path, descripcion_landing, vigencia_inicio, vigencia_fin, campos_formulario")
    .eq("id", id)
    .single()

  if (error || !data) return NextResponse.json({ error: "Empresa no encontrada" }, { status: 404 })

  const logoUrl = data.logo_path
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/logos-convenio/${data.logo_path}`
    : null

  return NextResponse.json({
    data: { ...data, logo_url: logoUrl }
  })
}

// ── PATCH — actualizar datos de landing del convenio ─────────────────────────

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  assertLicense()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

  const { id } = await params
  const svc = createServiceClient()

  let body: Record<string, unknown>
  try { body = await req.json() }
  catch { return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 }) }

  // Solo estos campos son actualizables aquí
  const allowed: Record<string, unknown> = {}

  if (body.slug !== undefined) {
    const slug = String(body.slug).toLowerCase().trim()
      .normalize("NFD").replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "")
      .substring(0, 60)
    if (!slug) return NextResponse.json({ error: "Slug inválido" }, { status: 400 })
    // Verificar unicidad (excluyendo la misma empresa)
    const { data: existing } = await svc.from("empresas").select("id").eq("slug", slug).neq("id", id).single()
    if (existing) return NextResponse.json({ error: "Ese slug ya está en uso" }, { status: 409 })
    allowed.slug = slug
  }
  if (body.descripcion_landing !== undefined) allowed.descripcion_landing = body.descripcion_landing || null
  if (body.vigencia_inicio     !== undefined) allowed.vigencia_inicio     = body.vigencia_inicio     || null
  if (body.vigencia_fin        !== undefined) allowed.vigencia_fin        = body.vigencia_fin        || null
  if (body.campos_formulario   !== undefined) {
    if (!Array.isArray(body.campos_formulario)) {
      return NextResponse.json({ error: "campos_formulario debe ser un array" }, { status: 400 })
    }
    allowed.campos_formulario = body.campos_formulario
  }

  const { data, error } = await svc
    .from("empresas")
    .update(allowed)
    .eq("id", id)
    .select("id, slug, logo_path, descripcion_landing, vigencia_inicio, vigencia_fin, campos_formulario")
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await logAudit({
    accion:     "convenio_actualizado",
    tabla:      "empresas",
    id_registro: id,
    id_usuario: user.id,
    ip:         extractIP(req),
    metadata:   { campos: Object.keys(allowed) },
  })

  const logoUrl = data.logo_path
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/logos-convenio/${data.logo_path}`
    : null

  return NextResponse.json({ data: { ...data, logo_url: logoUrl } })
}
