import type { Metadata } from "next"
import { createServiceClient } from "@/lib/supabase/server"
import LandingClient from "./LandingClient"

export const metadata: Metadata = {
  title: "TuCobertura — Gestión de Cirugías con tu Seguro GMM",
  description:
    "Gestiona tu cirugía sin depósito hospitalario. Tramitamos la autorización con tu aseguradora de gastos médicos mayores. Asesoría 100% gratuita.",
}

export interface Testimonio {
  id: number
  nombre: string
  detalle: string | null
  texto: string
  estrellas: number
}

export default async function Home() {
  const svc = createServiceClient()
  const { data } = await svc
    .from("testimonios")
    .select("id, nombre, detalle, texto, estrellas")
    .eq("activo", true)
    .order("orden", { ascending: true })
    .order("id",    { ascending: true })

  return <LandingClient testimonios={(data ?? []) as Testimonio[]} />
}
