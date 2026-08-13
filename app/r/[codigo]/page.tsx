import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { createServiceClient } from "@/lib/supabase/server"
import CaptureClient from "./CaptureClient"

export const metadata: Metadata = {
  title: "Verificación de cobertura GMM",
  description: "Completa tus datos y verifica si tu seguro GMM cubre el procedimiento que necesitas.",
}

export default async function CapturaPublicaPage({
  params,
}: {
  params: Promise<{ codigo: string }>
}) {
  const { codigo } = await params
  const svc = createServiceClient()

  const { data: vendedor } = await svc
    .from("vendedores")
    .select("id, nombre, activo")
    .eq("codigo_unico", codigo.toUpperCase())
    .single()

  if (!vendedor || !vendedor.activo) notFound()

  return <CaptureClient codigo={codigo.toUpperCase()} vendedorNombre={vendedor.nombre} />
}
