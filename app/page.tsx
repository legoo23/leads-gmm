import type { Metadata } from "next"
import { createServiceClient } from "@/lib/supabase/server"
import LandingClient from "./LandingClient"

export const metadata: Metadata = {
  title: "iHelp Médica — Que el trámite no detenga la atención",
  description:
    "Administrador tercero (TPA) para hospitales, aseguradoras y empresas: gestión de convenios, administración de casos, dictamen central y desarrollo comercial.",
}

export interface Testimonio {
  id: number
  nombre: string
  detalle: string | null
  texto: string
  estrellas: number
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>
}) {
  const { ref } = await searchParams
  const svc = createServiceClient()
  const { data } = await svc
    .from("testimonios")
    .select("id, nombre, detalle, texto, estrellas")
    .eq("activo", true)
    .order("orden", { ascending: true })
    .order("id",    { ascending: true })

  return (
    <LandingClient
      testimonios={(data ?? []) as Testimonio[]}
      codigoRef={ref ? ref.toUpperCase() : null}
    />
  )
}
