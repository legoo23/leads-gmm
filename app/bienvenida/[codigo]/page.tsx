import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { createServiceClient } from "@/lib/supabase/server"
import BienvenidaClient from "./BienvenidaClient"

export const metadata: Metadata = {
  title: "Tu kit de asesor — iHelp Medica",
  description: "Descarga tu QR, imprime tu tarjeta y consulta tu guía de asesor iHelp Medica.",
}

export default async function BienvenidaPage({
  params,
}: {
  params: Promise<{ codigo: string }>
}) {
  const { codigo } = await params
  const svc = createServiceClient()

  const { data: v } = await svc
    .from("vendedores")
    .select("nombre, apellido_paterno, codigo_unico, activo, niveles_comision(nombre, monto)")
    .eq("codigo_unico", codigo.toUpperCase())
    .single()

  if (!v || !v.activo) notFound()

  const nivel = (v.niveles_comision as unknown) as { nombre: string; monto: number } | null

  return (
    <BienvenidaClient
      nombre={v.nombre}
      apellido={v.apellido_paterno ?? ""}
      codigo={v.codigo_unico}
      nivelNombre={nivel?.nombre ?? null}
      nivelMonto={nivel?.monto ?? null}
    />
  )
}
