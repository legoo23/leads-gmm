import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { createServiceClient } from "@/lib/supabase/server"
import CaptureClient from "./CaptureClient"

export const metadata: Metadata = {
  title: "iHelp Médica — Contacto con especialistas",
  description: "Completa tus datos y te canalizamos con médicos y hospitales de la red de iHelp Médica.",
}

export default async function CapturaPublicaPage({
  params,
}: {
  params: Promise<{ codigo: string }>
}) {
  const { codigo } = await params
  const svc = createServiceClient()

  const [{ data: vendedor }, { data: aseguradoras }] = await Promise.all([
    svc.from("vendedores").select("id, nombre, activo").eq("codigo_unico", codigo.toUpperCase()).single(),
    svc.from("aseguradoras").select("id, nombre").eq("activo", true).order("nombre", { ascending: true }),
  ])

  if (!vendedor || !vendedor.activo) notFound()

  return (
    <CaptureClient
      codigo={codigo.toUpperCase()}
      vendedorNombre={vendedor.nombre}
      aseguradoras={aseguradoras ?? []}
    />
  )
}
