import { NextRequest, NextResponse } from "next/server"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import { assertLicense } from "@/lib/license"

export async function GET(_req: NextRequest) {
  assertLicense()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const svc = await createServiceClient()

  const { data, error } = await svc
    .from("medicos")
    .select("cobertura, especialidad, en_red, activo")

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const all = data ?? []
  const activos = all.filter((m) => m.activo)

  const porEstado = new Map<string, number>()
  const porEspecialidad = new Map<string, number>()
  const enRedPorEstado = new Map<string, number>()

  for (const m of activos) {
    const est = m.cobertura?.trim()
    const esp = m.especialidad?.trim()
    if (est) {
      porEstado.set(est, (porEstado.get(est) ?? 0) + 1)
      if (m.en_red) enRedPorEstado.set(est, (enRedPorEstado.get(est) ?? 0) + 1)
    }
    if (esp) porEspecialidad.set(esp, (porEspecialidad.get(esp) ?? 0) + 1)
  }

  return NextResponse.json({
    total:                all.length,
    total_activos:        activos.length,
    en_red:               activos.filter((m) => m.en_red).length,
    fuera_de_red:         activos.filter((m) => !m.en_red).length,
    inactivos:            all.length - activos.length,
    especialidades_unicas: porEspecialidad.size,
    estados_cubiertos:    porEstado.size,
    por_estado: Array.from(porEstado.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 25)
      .map(([estado, total]) => ({
        estado,
        total,
        en_red: enRedPorEstado.get(estado) ?? 0,
      })),
    por_especialidad: Array.from(porEspecialidad.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 25)
      .map(([especialidad, total]) => ({ especialidad, total })),
  })
}
