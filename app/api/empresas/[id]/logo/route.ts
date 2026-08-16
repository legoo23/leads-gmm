import { NextRequest, NextResponse } from "next/server"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import { assertLicense } from "@/lib/license"
import { logAudit, extractIP } from "@/lib/audit"

const MAX_SIZE   = 2 * 1024 * 1024 // 2 MB
const VALID_MIME = new Set(["image/jpeg","image/png","image/webp","image/gif","image/svg+xml"])

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  assertLicense()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

  const { id } = await params
  const svc = createServiceClient()

  let form: FormData
  try { form = await req.formData() }
  catch { return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 }) }

  const file = form.get("logo")
  if (!(file instanceof File)) return NextResponse.json({ error: "Campo 'logo' requerido" }, { status: 400 })
  if (!VALID_MIME.has(file.type)) return NextResponse.json({ error: "Tipo de archivo no permitido" }, { status: 400 })
  if (file.size > MAX_SIZE) return NextResponse.json({ error: "Archivo demasiado grande (máx 2 MB)" }, { status: 400 })

  const ext       = file.name.split(".").pop() ?? "jpg"
  const path      = `empresa-${id}/${Date.now()}.${ext}`
  const buffer    = Buffer.from(await file.arrayBuffer())

  const { error: uploadError } = await svc.storage
    .from("logos-convenio")
    .upload(path, buffer, { contentType: file.type, upsert: true })

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

  // Guardar path en la empresa
  await svc.from("empresas").update({ logo_path: path }).eq("id", id)

  await logAudit({
    accion:     "logo_convenio_subido",
    tabla:      "empresas",
    id_registro: id,
    id_usuario: user.id,
    ip:         extractIP(req),
    metadata:   { path },
  })

  const logoUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/logos-convenio/${path}`
  return NextResponse.json({ url: logoUrl, path }, { status: 201 })
}
