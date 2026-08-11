import { createServiceClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import DocsUploadClient from "./DocsUploadClient"

type Props = { params: Promise<{ token: string }> }

export default async function DocsPage({ params }: Props) {
  const { token } = await params
  const svc = createServiceClient()

  const { data: uploadToken } = await svc
    .from("upload_tokens")
    .select("id, id_lead, expires_at, activo, docs_requeridos")
    .eq("token", token)
    .single()

  if (!uploadToken || !uploadToken.activo || new Date(uploadToken.expires_at) < new Date()) {
    notFound()
  }

  // Get lead's first name only (minimal PII exposure)
  const { data: lead } = await svc
    .from("leads")
    .select("nombre, folio")
    .eq("id", uploadToken.id_lead)
    .single()

  const primerNombre = lead?.nombre?.split(" ")[0] ?? "Paciente"
  const docsRequeridos = (uploadToken.docs_requeridos as string[]) ?? ["poliza", "ine"]
  const expiresAt = uploadToken.expires_at as string

  return (
    <DocsUploadClient
      token={token}
      primerNombre={primerNombre}
      folio={lead?.folio ?? ""}
      docsRequeridos={docsRequeridos}
      expiresAt={expiresAt}
    />
  )
}
