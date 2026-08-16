import { notFound } from "next/navigation"
import { createServiceClient } from "@/lib/supabase/server"
import ConvenioClient from "./ConvenioClient"

export const dynamic = "force-dynamic"

interface CampoForm {
  campo: string; etiqueta: string; tipo: string; requerido: boolean; opciones?: string[]
}

interface Servicio {
  id: number; nombre: string; descripcion: string | null; icono: string | null
  precio_regular: number | null; precio_convenio: number | null; pct_descuento: number | null; tipo: string
}

export default async function ConvenioPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const svc = createServiceClient()

  const { data: empresa } = await svc
    .from("empresas")
    .select("id, nombre, descripcion_landing, logo_path, vigencia_inicio, vigencia_fin, campos_formulario, activa")
    .eq("slug", slug.toLowerCase())
    .single()

  if (!empresa || !empresa.activa) notFound()

  const now = new Date()
  if (empresa.vigencia_fin && new Date(empresa.vigencia_fin) < now) notFound()

  const { data: servicios } = await svc
    .from("servicios_convenio")
    .select("id, nombre, descripcion, icono, precio_regular, precio_convenio, pct_descuento, tipo")
    .eq("id_empresa", empresa.id)
    .eq("activo", true)
    .order("orden")

  const logoUrl = empresa.logo_path
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/logos-convenio/${empresa.logo_path}`
    : null

  const campos: CampoForm[] = Array.isArray(empresa.campos_formulario)
    ? empresa.campos_formulario
    : [
        { campo: "nombre",           etiqueta: "Nombre",           tipo: "texto",    requerido: true },
        { campo: "apellido_paterno", etiqueta: "Apellido paterno", tipo: "texto",    requerido: true },
        { campo: "apellido_materno", etiqueta: "Apellido materno", tipo: "texto",    requerido: false },
        { campo: "telefono",         etiqueta: "Celular",          tipo: "telefono", requerido: true },
        { campo: "email",            etiqueta: "Correo electrónico",tipo: "email",   requerido: false },
      ]

  return (
    <ConvenioClient
      slug={slug}
      empresa={{
        nombre:              empresa.nombre,
        descripcion_landing: empresa.descripcion_landing ?? null,
        logo_url:            logoUrl,
        vigencia_inicio:     empresa.vigencia_inicio ?? null,
        vigencia_fin:        empresa.vigencia_fin    ?? null,
      }}
      servicios={(servicios ?? []) as Servicio[]}
      campos={campos}
    />
  )
}
