import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"
import { logAudit } from "@/lib/audit"

type Params = { params: Promise<{ token: string }> }

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"]
const MAX_SIZE_BYTES = 10 * 1024 * 1024 // 10 MB por archivo

export async function POST(req: NextRequest, { params }: Params) {
  const { token } = await params
  const svc = createServiceClient()

  // Validate token
  const { data: uploadToken, error: tErr } = await svc
    .from("upload_tokens")
    .select("id, id_lead, expires_at, activo, docs_requeridos")
    .eq("token", token)
    .single()

  if (tErr || !uploadToken) {
    return NextResponse.json({ error: "Link inválido o expirado" }, { status: 404 })
  }
  if (!uploadToken.activo || new Date(uploadToken.expires_at) < new Date()) {
    return NextResponse.json({ error: "Este link ha expirado. Solicita uno nuevo a tu asesor." }, { status: 410 })
  }

  const formData = await req.formData()
  const file     = formData.get("file") as File | null
  const docTipo  = formData.get("tipo") as string | null

  if (!file || !docTipo) {
    return NextResponse.json({ error: "Archivo y tipo son requeridos" }, { status: 400 })
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Formato no permitido. Usa JPG, PNG o PDF." }, { status: 400 })
  }
  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: "El archivo supera 10 MB." }, { status: 400 })
  }

  const ext       = file.name.split(".").pop() ?? "bin"
  const filename  = `${docTipo}-${Date.now()}.${ext}`
  const storagePath = `leads/${uploadToken.id_lead}/${filename}`

  const arrayBuf = await file.arrayBuffer()
  const { error: upErr } = await svc.storage
    .from("lead-docs")
    .upload(storagePath, arrayBuf, {
      contentType: file.type,
      upsert: false,
    })

  if (upErr) {
    console.error("[upload error]", upErr.message)
    return NextResponse.json({ error: "Error al subir el archivo. Intenta de nuevo." }, { status: 500 })
  }

  // T-05: para la respuesta inmediata al portal generamos URL firmada de 1h (no 10 años)
  const { data: signed } = await svc.storage
    .from("lead-docs")
    .createSignedUrl(storagePath, 60 * 60)

  const fileUrl = signed?.signedUrl ?? storagePath

  if (docTipo === "poliza") {
    // T-05: guardar el path interno (no la URL firmada) — el asesor genera URLs frescas vía /api/leads/[id]/carta
    await svc.from("leads").update({ carta_autorizacion_path: storagePath }).eq("id", uploadToken.id_lead)
  } else {
    // Otros documentos: appended en notas para que el asesor los vea
    const { data: lead } = await svc.from("leads").select("notas").eq("id", uploadToken.id_lead).single()
    const notasActual = lead?.notas ?? ""
    const notasNuevas = `${notasActual}\n[DOC:${docTipo}] ${storagePath}`.trim()
    await svc.from("leads").update({ notas: notasNuevas }).eq("id", uploadToken.id_lead)
  }

  await logAudit({
    accion:     "patient_doc_uploaded",
    tabla:      "leads",
    id_registro: String(uploadToken.id_lead),
    id_usuario: "patient_portal",
    metadata:   { tipo: docTipo, path: storagePath },
  })

  return NextResponse.json({ ok: true, url: fileUrl })
}
