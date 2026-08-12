import { NextRequest, NextResponse } from "next/server"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import { assertLicense } from "@/lib/license"
import { normalizePhone } from "@/lib/utils"

function periodoLabel(year: number, month: number): string {
  return new Date(year, month, 1).toLocaleDateString("es-MX", {
    month: "long",
    year: "numeric",
  })
}

type PeriodoData = {
  year: number
  month: number
  monto_pendiente: number
  monto_aprobado: number
  monto_pagado: number
  count: number
}

export async function GET(_req: NextRequest) {
  assertLicense()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const svc = await createServiceClient()

  const parts: string[] = []
  if (user.email) parts.push(`email.eq.${user.email}`)
  const phone = normalizePhone(user.phone ?? "")
  if (phone) parts.push(`telefono.eq.${phone}`)
  if (!parts.length) return NextResponse.json({ error: "Sin identificador" }, { status: 404 })

  const { data: vendedor } = await svc
    .from("vendedores")
    .select("id")
    .or(parts.join(","))
    .maybeSingle()
  if (!vendedor) return NextResponse.json({ error: "Vendedor no encontrado" }, { status: 404 })

  const { data: comisiones, error } = await svc
    .from("comisiones")
    .select("monto, estado, fecha_conversion")
    .eq("id_vendedor", vendedor.id)
    .order("fecha_conversion", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const now = new Date()
  const todayDay   = now.getDate()
  const todayMonth = now.getMonth()   // 0-indexed
  const todayYear  = now.getFullYear()

  // Agrupar comisiones por periodo de pago (1-23 de cada mes)
  // Comisiones ganadas días 1-23 → pertenecen al mes calendario
  // Comisiones ganadas días 24-31 → pertenecen al mes siguiente
  const periodMap = new Map<string, PeriodoData>()

  let totalPagado = 0

  for (const com of comisiones ?? []) {
    if (!com.fecha_conversion) continue
    const d     = new Date(com.fecha_conversion)
    const day   = d.getDate()
    const month = d.getMonth()
    const year  = d.getFullYear()

    let effectiveMonth: number
    let effectiveYear: number
    if (day <= 23) {
      effectiveMonth = month
      effectiveYear  = year
    } else {
      // Después del corte → cuenta en el siguiente mes
      if (month === 11) {
        effectiveMonth = 0
        effectiveYear  = year + 1
      } else {
        effectiveMonth = month + 1
        effectiveYear  = year
      }
    }

    const key = `${effectiveYear}-${String(effectiveMonth + 1).padStart(2, "0")}`
    const existing: PeriodoData = periodMap.get(key) ?? {
      year: effectiveYear, month: effectiveMonth,
      monto_pendiente: 0, monto_aprobado: 0, monto_pagado: 0, count: 0,
    }

    const monto = com.monto ?? 0
    if (com.estado === "pagada")    { existing.monto_pagado    += monto; totalPagado += monto }
    else if (com.estado === "aprobada") existing.monto_aprobado += monto
    else if (com.estado === "pendiente") existing.monto_pendiente += monto
    existing.count += 1
    periodMap.set(key, existing)
  }

  // Clave del periodo actual (mes calendario)
  const currentKey = `${todayYear}-${String(todayMonth + 1).padStart(2, "0")}`
  const currentPeriodo: PeriodoData = periodMap.get(currentKey) ?? {
    year: todayYear, month: todayMonth,
    monto_pendiente: 0, monto_aprobado: 0, monto_pagado: 0, count: 0,
  }

  const acumuladoActual =
    currentPeriodo.monto_pendiente + currentPeriodo.monto_aprobado + currentPeriodo.monto_pagado
  const isOpen = todayDay <= 23

  // Mes en que se pagará el periodo actual
  const pagoMonth = todayMonth === 11 ? 0 : todayMonth + 1
  const pagoYear  = todayMonth === 11 ? todayYear + 1 : todayYear

  // Historial: periodos anteriores al actual, ordenados desc
  const historial = Array.from(periodMap.entries())
    .filter(([key]) => key !== currentKey)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([, p]) => {
      const total = p.monto_pendiente + p.monto_aprobado + p.monto_pagado
      const estadoDominante =
        p.monto_pendiente === 0 && p.monto_aprobado === 0 && p.monto_pagado > 0 ? "pagado" :
        p.monto_aprobado > 0 ? "aprobado" : "pendiente"
      return {
        periodo_label: periodoLabel(p.year, p.month),
        monto_total:      total,
        monto_pagado:     p.monto_pagado,
        monto_pendiente:  p.monto_pendiente + p.monto_aprobado,
        count:            p.count,
        estado:           estadoDominante,
      }
    })

  return NextResponse.json({
    periodo_actual: {
      label:      periodoLabel(todayYear, todayMonth),
      acumulado:  acumuladoActual,
      count:      currentPeriodo.count,
      abierto:    isOpen,
      corte_dia:  23,
      dias_restantes: isOpen ? 23 - todayDay : 0,
      pago_en:    periodoLabel(pagoYear, pagoMonth),
    },
    total_pagado: totalPagado,
    historial,
  })
}
