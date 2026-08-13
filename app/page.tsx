import type { Metadata } from "next"
import LandingClient from "./LandingClient"

export const metadata: Metadata = {
  title: "TuCobertura — Gestión de Cirugías con tu Seguro GMM",
  description:
    "Gestiona tu cirugía sin depósito hospitalario. Tramitamos la autorización con tu aseguradora de gastos médicos mayores. Asesoría 100% gratuita.",
}

export default function Home() {
  return <LandingClient />
}
