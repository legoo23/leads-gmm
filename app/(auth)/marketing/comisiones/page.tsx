"use client"
import { useState, useEffect } from "react"
import { CheckCircle, DollarSign, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatDate, formatMXN } from "@/lib/utils"

interface Comision {
  id: number; monto: number; estado: string
  fecha_conversion: string; fecha_aprobacion: string | null; fecha_pago: string | null
  notas: string | null
  vendedores: { nombre: string; codigo_unico: string } | null
  leads: { folio: string; nombre: string; procedimiento: string | null } | null
  niveles_comision: { nombre: string } | null
}

const ESTADOS: Record<string, { label: string; color: string; bg: string }> = {
  pendiente: { label: "Pendiente", color: "#D97706", bg: "#FFFBEB" },
  aprobada:  { label: "Aprobada",  color: "#059669", bg: "#ECFDF5" },
  pagada:    { label: "Pagada",    color: "#2563EB", bg: "#EFF6FF" },
  cancelada: { label: "Cancelada", color: "#6B7280", bg: "#F9FAFB" },
}

export default function ComisionesPage() {
  const [comisiones, setComisiones] = useState<Comision[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [estado, setEstado] = useState("")
  const [updating, setUpdating] = useState<number | null>(null)

  async function load() {
    setLoading(true)
    const p = new URLSearchParams({ limit: "100" })
    if (estado) p.set("estado", estado)
    const res = await fetch(`/api/comisiones?${p}`)
    if (res.ok) {
      const json = await res.json()
      setComisiones(json.data ?? [])
      setTotal(json.total ?? 0)
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [estado])

  async function updateEstado(id: number, newEstado: string) {
    setUpdating(id)
    await fetch("/api/comisiones", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, estado: newEstado }),
    })
    await load()
    setUpdating(null)
  }

  const totalPendiente = comisiones.filter((c) => c.estado === "pendiente").reduce((a, c) => a + c.monto, 0)
  const totalAprobada = comisiones.filter((c) => c.estado === "aprobada").reduce((a, c) => a + c.monto, 0)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold" style={{ color: "var(--text)" }}>Comisiones</h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--subtle)" }}>{total} comisiones</p>
        </div>
        <select value={estado} onChange={(e) => setEstado(e.target.value)}
          className="h-8 px-3 rounded-lg text-xs border outline-none"
          style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text)" }}>
          <option value="">Todos los estados</option>
          {Object.entries(ESTADOS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border p-4 flex items-center gap-3"
          style={{ background: "#FFFBEB", borderColor: "#FCD34D" }}>
          <Clock size={18} color="#D97706" />
          <div>
            <div className="text-xs font-medium" style={{ color: "#92400E" }}>Pendientes de aprobar</div>
            <div className="text-lg font-bold tabular-nums" style={{ color: "#D97706" }}>
              {formatMXN(totalPendiente)}
            </div>
          </div>
        </div>
        <div className="rounded-xl border p-4 flex items-center gap-3"
          style={{ background: "#ECFDF5", borderColor: "#6EE7B7" }}>
          <DollarSign size={18} color="#059669" />
          <div>
            <div className="text-xs font-medium" style={{ color: "#065F46" }}>Aprobadas por pagar</div>
            <div className="text-lg font-bold tabular-nums" style={{ color: "#059669" }}>
              {formatMXN(totalAprobada)}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "var(--surface-2)", borderBottom: "1px solid var(--border)" }}>
              {["Lead","Vendedor","Nivel","Monto","Estado","Fecha","Acción"].map((h) => (
                <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wide"
                  style={{ color: "var(--subtle)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={7} className="text-center py-10 text-xs" style={{ color: "var(--subtle)" }}>Cargando...</td></tr>}
            {!loading && comisiones.length === 0 && <tr><td colSpan={7} className="text-center py-12 text-xs" style={{ color: "var(--subtle)" }}>Sin comisiones</td></tr>}
            {comisiones.map((c) => {
              const est = ESTADOS[c.estado] ?? ESTADOS.pendiente
              return (
                <tr key={c.id} className="border-t hover:bg-[var(--surface-2)] transition-colors"
                  style={{ borderColor: "var(--border)" }}>
                  <td className="px-4 py-3">
                    <div className="font-mono text-xs font-semibold" style={{ color: "var(--accent)" }}>
                      {c.leads?.folio ?? "—"}
                    </div>
                    <div className="text-xs" style={{ color: "var(--subtle)" }}>
                      {c.leads?.nombre ?? ""}{c.leads?.procedimiento ? ` · ${c.leads.procedimiento}` : ""}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-medium" style={{ color: "var(--text)" }}>
                      {c.vendedores?.nombre ?? "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs" style={{ color: "var(--muted)" }}>
                      {c.niveles_comision?.nombre ?? "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-semibold tabular-nums" style={{ color: "var(--text)" }}>
                      {formatMXN(c.monto)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Badge label={est.label} color={est.color} bg={est.bg} size="sm" />
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs tabular-nums" style={{ color: "var(--subtle)" }}>
                      {formatDate(c.fecha_conversion)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {c.estado === "pendiente" && (
                      <Button size="sm" variant="secondary" loading={updating === c.id}
                        onClick={() => updateEstado(c.id, "aprobada")}>
                        <CheckCircle size={11} />
                        Aprobar
                      </Button>
                    )}
                    {c.estado === "aprobada" && (
                      <Button size="sm" loading={updating === c.id}
                        onClick={() => updateEstado(c.id, "pagada")}>
                        <DollarSign size={11} />
                        Marcar pagada
                      </Button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
