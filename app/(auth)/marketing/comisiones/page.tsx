"use client"
import { useState, useEffect, useCallback, useRef } from "react"
import {
  CheckCircle, DollarSign, Clock, XCircle, ChevronLeft, ChevronRight,
  ChevronsUpDown, Loader2, AlertTriangle, Filter,
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatDate, formatMXN } from "@/lib/utils"

// ── Types ─────────────────────────────────────────────────────────────────────

interface Comision {
  id: number
  monto: number
  estado: string
  fecha_conversion: string
  fecha_aprobacion: string | null
  fecha_pago: string | null
  notas: string | null
  vendedores: { id: number; nombre: string; codigo_unico: string } | null
  leads: { id: number; folio: string | null; nombre: string | null; apellido_paterno: string | null; procedimiento: string | null } | null
  niveles_comision: { nombre: string; monto: number } | null
}

interface Vendedor { id: number; nombre: string; codigo_unico: string }

// ── Constants ─────────────────────────────────────────────────────────────────

const ESTADOS: Record<string, { label: string; color: string; bg: string }> = {
  pendiente: { label: "Pendiente", color: "#D97706", bg: "#FFFBEB" },
  aprobada:  { label: "Aprobada",  color: "#059669", bg: "#ECFDF5" },
  pagada:    { label: "Pagada",    color: "#2563EB", bg: "#EFF6FF" },
  cancelada: { label: "Cancelada", color: "#6B7280", bg: "#F3F4F6" },
}

const MESES = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre",
]

// Build last 14 periods ending at current month
function buildPeriods() {
  const now = new Date()
  const periods: { mes: number; anio: number; label: string }[] = []
  for (let i = 0; i < 14; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    periods.push({ mes: d.getMonth() + 1, anio: d.getFullYear(), label: `${MESES[d.getMonth()]} ${d.getFullYear()}` })
  }
  return periods
}
const PERIODS = buildPeriods()

// ── Helpers ───────────────────────────────────────────────────────────────────

function periodLabel(iso: string | null): string {
  if (!iso) return "—"
  const d = new Date(iso)
  const day = d.getDate()
  const mes = day <= 23 ? d.getMonth() : (d.getMonth() + 1) % 12
  const anio = day <= 23 ? d.getFullYear() : (d.getMonth() === 11 ? d.getFullYear() + 1 : d.getFullYear())
  return `${MESES[mes]} ${anio}`
}

function sum(arr: Comision[], estado?: string) {
  return arr.filter((c) => !estado || c.estado === estado).reduce((a, c) => a + c.monto, 0)
}
function cnt(arr: Comision[], estado?: string) {
  return arr.filter((c) => !estado || c.estado === estado).length
}

// ── Confirm Modal ─────────────────────────────────────────────────────────────

function ConfirmModal({
  title, message, confirmLabel, confirmStyle = "primary", onConfirm, onClose,
  withNotes = false,
}: {
  title: string; message: string; confirmLabel: string
  confirmStyle?: "primary" | "danger"
  onConfirm: (notas?: string) => void
  onClose: () => void
  withNotes?: boolean
}) {
  const [notas, setNotas] = useState("")
  const [loading, setLoading] = useState(false)

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-t-2xl sm:rounded-2xl p-5 space-y-4"
        style={{ background: "var(--surface)" }}>
        <div className="flex items-start gap-3">
          <AlertTriangle size={18} color="#D97706" className="flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-sm font-semibold" style={{ color: "var(--text)" }}>{title}</div>
            <div className="text-xs mt-1" style={{ color: "var(--muted)" }}>{message}</div>
          </div>
        </div>
        {withNotes && (
          <textarea
            rows={2}
            placeholder="Notas opcionales..."
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm outline-none resize-none"
            style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text)" }}
          />
        )}
        <div className="flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={onClose}>Cancelar</Button>
          <Button
            size="sm"
            style={confirmStyle === "danger"
              ? { background: "#DC2626", color: "white", borderColor: "#DC2626" }
              : undefined}
            loading={loading}
            onClick={async () => {
              setLoading(true)
              await onConfirm(withNotes ? notas : undefined)
              setLoading(false)
            }}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ComisionesPage() {
  const [comisiones, setComisiones] = useState<Comision[]>([])
  const [total, setTotal]           = useState(0)
  const [page, setPage]             = useState(1)
  const PAGE_SIZE = 25
  const [loading, setLoading]       = useState(true)
  const [updating, setUpdating]     = useState<Set<number>>(new Set())

  // Filters
  const [estado, setEstado]         = useState("")
  const [periodo, setPeriodo]       = useState<{ mes: number; anio: number } | null>(null)
  const [vendedorId, setVendedorId] = useState("")
  const [vendedores, setVendedores] = useState<Vendedor[]>([])

  // Selection
  const [selected, setSelected]     = useState<Set<number>>(new Set())

  // Confirm modal
  type ConfirmState = {
    title: string; message: string; confirmLabel: string
    style?: "primary" | "danger"; withNotes?: boolean
    onConfirm: (notas?: string) => Promise<void>
  } | null
  const [confirm, setConfirm] = useState<ConfirmState>(null)

  const totalPages = Math.ceil(total / PAGE_SIZE)

  // Load vendedores for filter dropdown
  useEffect(() => {
    fetch("/api/vendedores?limit=200&activo=true")
      .then((r) => r.json())
      .then((j) => setVendedores(j.data ?? []))
      .catch(() => {})
  }, [])

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchComisiones = useCallback(async (
    pg: number, est: string, per: { mes: number; anio: number } | null, vid: string
  ) => {
    setLoading(true)
    setSelected(new Set())
    const p = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String((pg - 1) * PAGE_SIZE) })
    if (est) p.set("estado", est)
    if (vid) p.set("id_vendedor", vid)
    if (per) { p.set("mes", String(per.mes)); p.set("anio", String(per.anio)) }

    const res = await fetch(`/api/comisiones?${p}`)
    if (res.ok) {
      const j = await res.json()
      setComisiones(j.data ?? [])
      setTotal(j.total ?? 0)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    setPage(1)
    fetchComisiones(1, estado, periodo, vendedorId)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estado, periodo, vendedorId])

  function goToPage(p: number) {
    const next = Math.max(1, Math.min(p, totalPages))
    setPage(next)
    fetchComisiones(next, estado, periodo, vendedorId)
  }

  // ── Single update ──────────────────────────────────────────────────────────

  async function updateOne(id: number, newEstado: string, notas?: string) {
    setUpdating((s) => new Set(s).add(id))
    await fetch("/api/comisiones", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, estado: newEstado, notas }),
    })
    setUpdating((s) => { const n = new Set(s); n.delete(id); return n })
    await fetchComisiones(page, estado, periodo, vendedorId)
  }

  // ── Bulk update ────────────────────────────────────────────────────────────

  async function bulkUpdate(ids: number[], newEstado: string, notas?: string) {
    await fetch("/api/comisiones", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids, estado: newEstado, notas }),
    })
    await fetchComisiones(page, estado, periodo, vendedorId)
  }

  // ── Selection helpers ──────────────────────────────────────────────────────

  const actionable = (est: string) => comisiones.filter((c) => c.estado === est)
  const allSelected = comisiones.length > 0 && comisiones.every((c) => selected.has(c.id))

  function toggleAll() {
    if (allSelected) setSelected(new Set())
    else setSelected(new Set(comisiones.map((c) => c.id)))
  }

  function toggleOne(id: number) {
    setSelected((s) => {
      const n = new Set(s)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })
  }

  // Selected items breakdown
  const selectedItems = comisiones.filter((c) => selected.has(c.id))
  const selectedPendientes = selectedItems.filter((c) => c.estado === "pendiente").map((c) => c.id)
  const selectedAprobadas  = selectedItems.filter((c) => c.estado === "aprobada").map((c) => c.id)

  // ── KPIs from loaded data ──────────────────────────────────────────────────

  // These reflect the current filter (period, vendor, etc.) but across ALL pages
  // We'll show them based on what's visible (acceptable tradeoff — add a stats endpoint if needed)
  const kpiPendiente = { count: cnt(comisiones, "pendiente"), monto: sum(comisiones, "pendiente") }
  const kpiAprobada  = { count: cnt(comisiones, "aprobada"),  monto: sum(comisiones, "aprobada") }
  const kpiPagada    = { count: cnt(comisiones, "pagada"),    monto: sum(comisiones, "pagada") }
  const kpiTotal     = { count: comisiones.length,            monto: sum(comisiones) }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">

      {/* Header */}
      <div>
        <h1 className="text-lg font-semibold" style={{ color: "var(--text)" }}>Comisiones</h1>
        <p className="text-xs mt-0.5" style={{ color: "var(--subtle)" }}>
          Gestión y pago de comisiones por conversión de leads
        </p>
      </div>

      {/* KPI tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: "Pendientes",
            count: kpiPendiente.count,
            monto: kpiPendiente.monto,
            icon: <Clock size={16} color="#D97706" />,
            bg: "#FFFBEB", border: "#FCD34D", textColor: "#D97706", labelColor: "#92400E",
          },
          {
            label: "Aprobadas",
            count: kpiAprobada.count,
            monto: kpiAprobada.monto,
            icon: <CheckCircle size={16} color="#059669" />,
            bg: "#ECFDF5", border: "#6EE7B7", textColor: "#059669", labelColor: "#065F46",
          },
          {
            label: "Pagadas",
            count: kpiPagada.count,
            monto: kpiPagada.monto,
            icon: <DollarSign size={16} color="#2563EB" />,
            bg: "#EFF6FF", border: "#93C5FD", textColor: "#2563EB", labelColor: "#1E3A8A",
          },
          {
            label: "Total período",
            count: kpiTotal.count,
            monto: kpiTotal.monto,
            icon: <ChevronsUpDown size={16} color="var(--accent)" />,
            bg: "var(--surface-2)", border: "var(--border)", textColor: "var(--text)", labelColor: "var(--muted)",
          },
        ].map(({ label, count, monto, icon, bg, border, textColor, labelColor }) => (
          <div key={label} className="rounded-xl border p-3.5"
            style={{ background: bg, borderColor: border }}>
            <div className="flex items-center gap-1.5 mb-1.5">{icon}
              <span className="text-xs font-medium" style={{ color: labelColor }}>{label}</span>
            </div>
            <div className="text-lg font-bold tabular-nums" style={{ color: textColor }}>
              {formatMXN(monto)}
            </div>
            <div className="text-xs mt-0.5" style={{ color: labelColor }}>
              {count} comision{count !== 1 ? "es" : ""}
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <Filter size={13} style={{ color: "var(--muted)" }} className="flex-shrink-0" />

        {/* Estado */}
        <select value={estado} onChange={(e) => setEstado(e.target.value)}
          className="h-9 px-3 rounded-lg border text-sm outline-none"
          style={{
            background: "var(--surface)", borderColor: "var(--border)",
            color: estado ? "var(--text)" : "var(--muted)",
          }}>
          <option value="">Todos los estados</option>
          {Object.entries(ESTADOS).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>

        {/* Período */}
        <select
          value={periodo ? `${periodo.anio}-${periodo.mes}` : ""}
          onChange={(e) => {
            if (!e.target.value) { setPeriodo(null); return }
            const [a, m] = e.target.value.split("-")
            setPeriodo({ anio: parseInt(a), mes: parseInt(m) })
          }}
          className="h-9 px-3 rounded-lg border text-sm outline-none"
          style={{
            background: "var(--surface)", borderColor: "var(--border)",
            color: periodo ? "var(--text)" : "var(--muted)",
          }}>
          <option value="">Todos los períodos</option>
          {PERIODS.map(({ mes, anio, label }) => (
            <option key={`${anio}-${mes}`} value={`${anio}-${mes}`}>{label}</option>
          ))}
        </select>

        {/* Vendedor */}
        <select value={vendedorId} onChange={(e) => setVendedorId(e.target.value)}
          className="h-9 px-3 rounded-lg border text-sm outline-none min-w-[170px]"
          style={{
            background: "var(--surface)", borderColor: "var(--border)",
            color: vendedorId ? "var(--text)" : "var(--muted)",
          }}>
          <option value="">Todos los vendedores</option>
          {vendedores.map((v) => (
            <option key={v.id} value={String(v.id)}>{v.nombre}</option>
          ))}
        </select>

        {(estado || periodo || vendedorId) && (
          <button
            onClick={() => { setEstado(""); setPeriodo(null); setVendedorId("") }}
            className="h-9 px-3 text-xs rounded-lg border"
            style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
            Limpiar
          </button>
        )}

        <span className="text-xs ml-auto" style={{ color: "var(--subtle)" }}>
          {loading ? "Cargando..." : `${total.toLocaleString()} comisiones`}
        </span>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl border"
          style={{ background: "color-mix(in srgb, var(--accent) 6%, var(--surface))", borderColor: "var(--accent)" }}>
          <span className="text-xs font-medium" style={{ color: "var(--accent)" }}>
            {selected.size} seleccionada{selected.size !== 1 ? "s" : ""}
          </span>
          <div className="h-4 w-px" style={{ background: "var(--border)" }} />
          {selectedPendientes.length > 0 && (
            <Button size="sm" variant="secondary"
              onClick={() => setConfirm({
                title: `Aprobar ${selectedPendientes.length} comisión${selectedPendientes.length !== 1 ? "es" : ""}`,
                message: `Se marcarán como aprobadas. El vendedor podrá verlas como aprobadas en su portal.`,
                confirmLabel: "Aprobar todas",
                withNotes: true,
                onConfirm: async (notas) => {
                  await bulkUpdate(selectedPendientes, "aprobada", notas)
                  setConfirm(null)
                },
              })}>
              <CheckCircle size={11} /> Aprobar ({selectedPendientes.length})
            </Button>
          )}
          {selectedAprobadas.length > 0 && (
            <Button size="sm"
              onClick={() => setConfirm({
                title: `Marcar ${selectedAprobadas.length} como pagada${selectedAprobadas.length !== 1 ? "s" : ""}`,
                message: `Confirmar que el pago fue procesado fuera del sistema.`,
                confirmLabel: "Marcar pagadas",
                withNotes: true,
                onConfirm: async (notas) => {
                  await bulkUpdate(selectedAprobadas, "pagada", notas)
                  setConfirm(null)
                },
              })}>
              <DollarSign size={11} /> Pagar ({selectedAprobadas.length})
            </Button>
          )}
          <button onClick={() => setSelected(new Set())}
            className="ml-auto text-xs" style={{ color: "var(--muted)" }}>
            Deseleccionar
          </button>
        </div>
      )}

      {/* Mobile cards */}
      {!loading && (
        <div className="sm:hidden space-y-2">
          {comisiones.length === 0 ? (
            <div className="text-center py-12 text-xs" style={{ color: "var(--subtle)" }}>
              Sin comisiones para esta búsqueda
            </div>
          ) : comisiones.map((c) => {
            const est = ESTADOS[c.estado] ?? ESTADOS.pendiente
            const isUpdating = updating.has(c.id)
            return (
              <div key={c.id} className="rounded-xl border p-3.5 space-y-2.5"
                style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                      {c.vendedores?.nombre ?? "—"}
                    </div>
                    <div className="text-xs" style={{ color: "var(--muted)" }}>
                      {c.vendedores?.codigo_unico ?? ""}
                    </div>
                  </div>
                  <Badge label={est.label} color={est.color} bg={est.bg} size="sm" />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-mono text-xs font-semibold" style={{ color: "var(--accent)" }}>
                      {c.leads?.folio ?? "—"}
                    </div>
                    <div className="text-xs" style={{ color: "var(--subtle)" }}>
                      {[c.leads?.nombre, c.leads?.apellido_paterno].filter(Boolean).join(" ")}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-base font-bold tabular-nums" style={{ color: "var(--text)" }}>
                      {formatMXN(c.monto)}
                    </div>
                    <div className="text-xs" style={{ color: "var(--subtle)" }}>
                      {periodLabel(c.fecha_conversion)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-0.5">
                  {c.estado === "pendiente" && (
                    <Button size="sm" variant="secondary" loading={isUpdating}
                      onClick={() => setConfirm({
                        title: "Aprobar comisión",
                        message: `${formatMXN(c.monto)} para ${c.vendedores?.nombre ?? ""}`,
                        confirmLabel: "Aprobar",
                        withNotes: true,
                        onConfirm: async (notas) => { await updateOne(c.id, "aprobada", notas); setConfirm(null) },
                      })}>
                      <CheckCircle size={11} /> Aprobar
                    </Button>
                  )}
                  {c.estado === "aprobada" && (
                    <Button size="sm" loading={isUpdating}
                      onClick={() => setConfirm({
                        title: "Marcar como pagada",
                        message: `${formatMXN(c.monto)} para ${c.vendedores?.nombre ?? ""}`,
                        confirmLabel: "Marcar pagada",
                        withNotes: true,
                        onConfirm: async (notas) => { await updateOne(c.id, "pagada", notas); setConfirm(null) },
                      })}>
                      <DollarSign size={11} /> Pagar
                    </Button>
                  )}
                  {(c.estado === "pendiente" || c.estado === "aprobada") && (
                    <button
                      onClick={() => setConfirm({
                        title: "Cancelar comisión",
                        message: `¿Cancelar la comisión de ${formatMXN(c.monto)} para ${c.vendedores?.nombre ?? ""}? Esta acción no se puede deshacer fácilmente.`,
                        confirmLabel: "Cancelar comisión",
                        style: "danger",
                        withNotes: true,
                        onConfirm: async (notas) => { await updateOne(c.id, "cancelada", notas); setConfirm(null) },
                      })}
                      className="text-xs" style={{ color: "#DC2626" }}>
                      Cancelar
                    </button>
                  )}
                  {c.leads?.id && (
                    <Link href={`/leads/${c.leads.id}`}
                      className="text-xs ml-auto" style={{ color: "var(--accent)" }}>
                      Ver lead →
                    </Link>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Desktop table */}
      {!loading && (
        <div className="hidden sm:block rounded-xl border overflow-hidden"
          style={{ borderColor: "var(--border)" }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr style={{ background: "var(--surface-2)" }}>
                  <th className="px-4 py-2.5 w-8">
                    <input type="checkbox" checked={allSelected} onChange={toggleAll}
                      className="rounded" />
                  </th>
                  {["Lead","Vendedor","Nivel","Monto","Período","Estado","Acciones"].map((h) => (
                    <th key={h} className="text-left px-4 py-2.5 text-xs font-medium border-b"
                      style={{ color: "var(--muted)", borderColor: "var(--border)" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comisiones.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-xs"
                      style={{ color: "var(--subtle)" }}>
                      Sin comisiones para esta búsqueda
                    </td>
                  </tr>
                )}
                {comisiones.map((c) => {
                  const est = ESTADOS[c.estado] ?? ESTADOS.pendiente
                  const isUpdating = updating.has(c.id)
                  const isSelected = selected.has(c.id)
                  return (
                    <tr key={c.id}
                      className="border-b transition-colors"
                      style={{
                        borderColor: "var(--border)",
                        background: isSelected
                          ? "color-mix(in srgb, var(--accent) 5%, var(--surface))"
                          : "var(--surface)",
                      }}>
                      <td className="px-4 py-3">
                        <input type="checkbox" checked={isSelected} onChange={() => toggleOne(c.id)}
                          className="rounded" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-mono text-xs font-semibold" style={{ color: "var(--accent)" }}>
                          {c.leads?.folio ?? "—"}
                        </div>
                        <div className="text-xs max-w-[140px] truncate" style={{ color: "var(--subtle)" }}>
                          {[c.leads?.nombre, c.leads?.apellido_paterno].filter(Boolean).join(" ")}
                          {c.leads?.procedimiento ? ` · ${c.leads.procedimiento}` : ""}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium" style={{ color: "var(--text)" }}>
                          {c.vendedores?.nombre ?? "—"}
                        </div>
                        <div className="text-xs font-mono" style={{ color: "var(--subtle)" }}>
                          {c.vendedores?.codigo_unico ?? ""}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs" style={{ color: "var(--muted)" }}>
                          {c.niveles_comision?.nombre ?? "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-bold tabular-nums" style={{ color: "var(--text)" }}>
                          {formatMXN(c.monto)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-xs tabular-nums" style={{ color: "var(--text)" }}>
                          {periodLabel(c.fecha_conversion)}
                        </div>
                        <div className="text-[11px]" style={{ color: "var(--subtle)" }}>
                          Conv. {formatDate(c.fecha_conversion)}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge label={est.label} color={est.color} bg={est.bg} size="sm" />
                        {c.fecha_aprobacion && (
                          <div className="text-[10px] mt-0.5" style={{ color: "var(--subtle)" }}>
                            Apr. {formatDate(c.fecha_aprobacion)}
                          </div>
                        )}
                        {c.fecha_pago && (
                          <div className="text-[10px]" style={{ color: "var(--subtle)" }}>
                            Pago {formatDate(c.fecha_pago)}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {isUpdating && <Loader2 size={13} className="animate-spin" style={{ color: "var(--muted)" }} />}

                          {!isUpdating && c.estado === "pendiente" && (
                            <button
                              className="text-xs font-medium px-2 py-1 rounded-lg border transition-colors"
                              style={{ borderColor: "#059669", color: "#059669" }}
                              onClick={() => setConfirm({
                                title: "Aprobar comisión",
                                message: `${formatMXN(c.monto)} para ${c.vendedores?.nombre ?? ""}`,
                                confirmLabel: "Aprobar",
                                withNotes: true,
                                onConfirm: async (notas) => { await updateOne(c.id, "aprobada", notas); setConfirm(null) },
                              })}>
                              Aprobar
                            </button>
                          )}

                          {!isUpdating && c.estado === "aprobada" && (
                            <button
                              className="text-xs font-medium px-2 py-1 rounded-lg border transition-colors"
                              style={{ borderColor: "var(--accent)", color: "var(--accent)" }}
                              onClick={() => setConfirm({
                                title: "Marcar como pagada",
                                message: `Confirmar pago de ${formatMXN(c.monto)} a ${c.vendedores?.nombre ?? ""}.`,
                                confirmLabel: "Marcar pagada",
                                withNotes: true,
                                onConfirm: async (notas) => { await updateOne(c.id, "pagada", notas); setConfirm(null) },
                              })}>
                              Pagar
                            </button>
                          )}

                          {!isUpdating && (c.estado === "pendiente" || c.estado === "aprobada") && (
                            <button
                              className="text-xs px-2 py-1 rounded-lg border"
                              style={{ borderColor: "var(--border)", color: "var(--muted)" }}
                              onClick={() => setConfirm({
                                title: "Cancelar comisión",
                                message: `¿Cancelar ${formatMXN(c.monto)} de ${c.vendedores?.nombre ?? ""}?`,
                                confirmLabel: "Sí, cancelar",
                                style: "danger",
                                withNotes: true,
                                onConfirm: async (notas) => { await updateOne(c.id, "cancelada", notas); setConfirm(null) },
                              })}>
                              Cancelar
                            </button>
                          )}

                          {c.leads?.id && (
                            <Link href={`/leads/${c.leads.id}`}
                              className="text-xs" style={{ color: "var(--accent)" }}>
                              Lead →
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-16 gap-2 text-xs"
          style={{ color: "var(--subtle)" }}>
          <Loader2 size={14} className="animate-spin" /> Cargando comisiones...
        </div>
      )}

      {/* Pagination */}
      {!loading && total > PAGE_SIZE && (
        <div className="flex items-center justify-between">
          <span className="text-xs" style={{ color: "var(--muted)" }}>
            Página {page} de {totalPages} · {total.toLocaleString()} comisiones
          </span>
          <div className="flex items-center gap-2">
            <button onClick={() => goToPage(page - 1)} disabled={page <= 1}
              className="p-1.5 rounded-lg border disabled:opacity-40"
              style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
              <ChevronLeft size={14} />
            </button>
            <button onClick={() => goToPage(page + 1)} disabled={page >= totalPages}
              className="p-1.5 rounded-lg border disabled:opacity-40"
              style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Confirm modal */}
      {confirm && (
        <ConfirmModal
          title={confirm.title}
          message={confirm.message}
          confirmLabel={confirm.confirmLabel}
          confirmStyle={confirm.style}
          withNotes={confirm.withNotes}
          onConfirm={confirm.onConfirm}
          onClose={() => setConfirm(null)}
        />
      )}
    </div>
  )
}
