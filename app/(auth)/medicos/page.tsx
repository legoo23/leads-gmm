"use client"
import { useState, useEffect, useCallback, useRef } from "react"
import {
  Plus, Stethoscope, Search, X, ChevronLeft, ChevronRight,
  Edit2, Network, BarChart3, FileText, Check, AlertCircle,
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Modal } from "@/components/ui/modal"
import { Input, Select, Textarea } from "@/components/ui/input"
import { GEO_ESTADOS } from "@/constants/geo-mx"
import { ETAPAS_PIPELINE } from "@/constants/lead-etapas"

// ── Types ─────────────────────────────────────────────────────────────────────

interface Medico {
  id: number
  nombre: string
  especialidad: string | null
  sub_especialidad: string | null
  hospital: string | null
  telefono: string | null
  telefono_secundario: string | null
  email: string | null
  cedula: string | null
  cobertura: string | null
  consultorio: string | null
  aseguradoras_aceptadas: string | null
  notas: string | null
  en_red: boolean | null
  activo: boolean
}

interface Stats {
  total: number
  total_activos: number
  en_red: number
  fuera_de_red: number
  inactivos: number
  especialidades_unicas: number
  estados_cubiertos: number
  por_estado: { estado: string; total: number; en_red: number }[]
  por_especialidad: { especialidad: string; total: number }[]
}

interface RefLead {
  id: number
  folio: string | null
  nombre: string | null
  apellido_paterno: string | null
  procedimiento: string | null
  etapa: string | null
  fecha_captura: string | null
  medicos: { id: number; nombre: string; especialidad: string | null; cobertura: string | null } | null
}

type Tab = "lista" | "analitica" | "referenciados"

const PAGE_SIZES = [25, 50]
const EMPTY_FORM = {
  nombre: "", especialidad: "", sub_especialidad: "", hospital: "",
  telefono: "", telefono_secundario: "", email: "", cedula: "",
  cobertura: "", consultorio: "", aseguradoras_aceptadas: "", notas: "",
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(d: string | null) {
  if (!d) return "—"
  return new Date(d).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "2-digit" })
}

function EtapaBadge({ etapa }: { etapa: string | null }) {
  const e = etapa ? ETAPAS_PIPELINE[etapa as keyof typeof ETAPAS_PIPELINE] : null
  if (!e) return <span className="text-xs" style={{ color: "var(--muted)" }}>—</span>
  return (
    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full"
      style={{ background: e.bg, color: e.color }}>
      {e.label}
    </span>
  )
}

// ── Edit Panel ────────────────────────────────────────────────────────────────

function EditPanel({
  medico, onClose, onSaved,
}: {
  medico: Medico
  onClose: () => void
  onSaved: (m: Medico) => void
}) {
  const [form, setForm] = useState<Omit<typeof EMPTY_FORM, never> & { en_red: boolean; activo: boolean }>({
    nombre:               medico.nombre,
    especialidad:         medico.especialidad ?? "",
    sub_especialidad:     medico.sub_especialidad ?? "",
    hospital:             medico.hospital ?? "",
    telefono:             medico.telefono ?? "",
    telefono_secundario:  medico.telefono_secundario ?? "",
    email:                medico.email ?? "",
    cedula:               medico.cedula ?? "",
    cobertura:            medico.cobertura ?? "",
    consultorio:          medico.consultorio ?? "",
    aseguradoras_aceptadas: medico.aseguradoras_aceptadas ?? "",
    notas:                medico.notas ?? "",
    en_red:               medico.en_red ?? false,
    activo:               medico.activo,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState("")

  const set = (k: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }))

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError("")
    const res = await fetch(`/api/medicos/${medico.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      const { data } = await res.json()
      onSaved(data)
      onClose()
    } else {
      const j = await res.json()
      setError(j.error ?? "Error al guardar")
    }
    setSaving(false)
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />
      <aside className="fixed inset-y-0 right-0 z-50 flex flex-col w-full max-w-[500px] shadow-xl"
        style={{ background: "var(--surface)" }}>
        <div className="flex items-center justify-between px-5 py-4 border-b"
          style={{ borderColor: "var(--border)" }}>
          <div>
            <div className="text-sm font-semibold" style={{ color: "var(--text)" }}>
              {medico.nombre}
            </div>
            <div className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
              {medico.especialidad ?? "Sin especialidad"}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, activo: !f.activo }))}
              className="text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors"
              style={{
                borderColor: form.activo ? "var(--border)" : "#DC2626",
                color: form.activo ? "var(--muted)" : "#DC2626",
                background: form.activo ? "transparent" : "#FEF2F2",
              }}
            >
              {form.activo ? "Inhabilitar" : "Rehabilitar"}
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[var(--surface-2)]"
              style={{ color: "var(--muted)" }}>
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <form id="edit-form" onSubmit={handleSave} className="space-y-4">
            <Input label="Nombre completo *" value={form.nombre}
              onChange={set("nombre")} required />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Especialidad" value={form.especialidad}
                onChange={set("especialidad")} />
              <Input label="Sub-especialidad" value={form.sub_especialidad}
                onChange={set("sub_especialidad")} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Cédula" value={form.cedula} onChange={set("cedula")} />
              <Select label="Estado de cobertura" value={form.cobertura}
                onChange={set("cobertura")}>
                <option value="">Sin especificar</option>
                {GEO_ESTADOS.map((e) => <option key={e} value={e}>{e}</option>)}
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Teléfono" value={form.telefono} onChange={set("telefono")} />
              <Input label="Teléfono 2" value={form.telefono_secundario}
                onChange={set("telefono_secundario")} />
            </div>
            <Input label="Email" type="email" value={form.email} onChange={set("email")} />
            <Input label="Hospital / Institución" value={form.hospital}
              onChange={set("hospital")} />
            <Input label="Consultorio / Dirección" value={form.consultorio}
              onChange={set("consultorio")} />
            <Textarea label="Aseguradoras aceptadas" value={form.aseguradoras_aceptadas}
              onChange={set("aseguradoras_aceptadas")} rows={2} />
            <Textarea label="Notas" value={form.notas} onChange={set("notas")} rows={2} />

            <div className="flex items-center justify-between p-3 rounded-lg border"
              style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}>
              <div>
                <div className="text-sm font-medium" style={{ color: "var(--text)" }}>
                  Médico en red
                </div>
                <div className="text-xs" style={{ color: "var(--muted)" }}>
                  Aparece como opción prioritaria al asignar
                </div>
              </div>
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, en_red: !f.en_red }))}
                className="w-10 h-6 rounded-full transition-colors flex-shrink-0 relative"
                style={{ background: form.en_red ? "#059669" : "var(--border)" }}
              >
                <span className="absolute top-0.5 transition-all w-5 h-5 rounded-full bg-white shadow"
                  style={{ left: form.en_red ? "calc(100% - 22px)" : "2px" }} />
              </button>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-xs p-3 rounded-lg"
                style={{ background: "#FEF2F2", color: "#DC2626" }}>
                <AlertCircle size={13} />
                {error}
              </div>
            )}
          </form>
        </div>

        <div className="px-5 py-3 border-t flex justify-end gap-2"
          style={{ borderColor: "var(--border)" }}>
          <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit" form="edit-form" loading={saving}>
            <Check size={13} /> Guardar cambios
          </Button>
        </div>
      </aside>
    </>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function MedicosPage() {
  const [tab, setTab] = useState<Tab>("lista")

  // Lista
  const [medicos, setMedicos]   = useState<Medico[]>([])
  const [total, setTotal]       = useState(0)
  const [page, setPage]         = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState("")
  const [filterEsp, setFilterEsp] = useState("")
  const [filterEst, setFilterEst] = useState("")
  const [filterRed, setFilterRed] = useState(false)
  const [editMedico, setEditMedico] = useState<Medico | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [saving, setSaving]     = useState(false)
  const [createForm, setCreateForm] = useState(EMPTY_FORM)

  // Analítica
  const [stats, setStats]           = useState<Stats | null>(null)
  const [statsLoading, setStatsLoading] = useState(false)
  const [statsLoaded, setStatsLoaded]   = useState(false)

  // Referenciados
  const [refs, setRefs]             = useState<RefLead[]>([])
  const [refsTotal, setRefsTotal]   = useState(0)
  const [refsPage, setRefsPage]     = useState(1)
  const [refsLoading, setRefsLoading] = useState(false)
  const [refsLoaded, setRefsLoaded] = useState(false)
  const [refsSearch, setRefsSearch] = useState("")

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const totalPages = Math.ceil(total / pageSize)

  // ── Lista fetch ────────────────────────────────────────────────────────────

  const fetchMedicos = useCallback(async (
    q: string, esp: string, est: string, red: boolean, pg: number, ps: number
  ) => {
    setLoading(true)
    const params = new URLSearchParams({
      limit: String(ps),
      offset: String((pg - 1) * ps),
    })
    if (q.length >= 2)   params.set("q", q)
    if (esp.length >= 2) params.set("especialidad", esp)
    if (est)             params.set("cobertura", est)
    if (red)             params.set("red", "true")

    const res = await fetch(`/api/medicos?${params}`)
    if (res.ok) {
      const j = await res.json()
      setMedicos(j.data ?? [])
      setTotal(j.total ?? 0)
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchMedicos("", "", "", false, 1, 25) }, [fetchMedicos])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setPage(1)
      fetchMedicos(search, filterEsp, filterEst, filterRed, 1, pageSize)
    }, 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, filterEsp, filterEst, filterRed])

  function goToPage(p: number) {
    const next = Math.max(1, Math.min(p, totalPages))
    setPage(next)
    fetchMedicos(search, filterEsp, filterEst, filterRed, next, pageSize)
  }

  function changePageSize(ps: number) {
    setPageSize(ps)
    setPage(1)
    fetchMedicos(search, filterEsp, filterEst, filterRed, 1, ps)
  }

  // ── Analítica fetch ────────────────────────────────────────────────────────

  async function loadStats() {
    if (statsLoaded) return
    setStatsLoading(true)
    const res = await fetch("/api/medicos/stats")
    if (res.ok) { setStats(await res.json()); setStatsLoaded(true) }
    setStatsLoading(false)
  }

  // ── Referenciados fetch ────────────────────────────────────────────────────

  const fetchRefs = useCallback(async (pg: number) => {
    setRefsLoading(true)
    const params = new URLSearchParams({ limit: "50", offset: String((pg - 1) * 50) })
    const res = await fetch(`/api/medicos/referenciados?${params}`)
    if (res.ok) {
      const j = await res.json()
      setRefs(j.data ?? [])
      setRefsTotal(j.total ?? 0)
      setRefsLoaded(true)
    }
    setRefsLoading(false)
  }, [])

  // ── Tab switch ─────────────────────────────────────────────────────────────

  function switchTab(t: Tab) {
    setTab(t)
    if (t === "analitica" && !statsLoaded) loadStats()
    if (t === "referenciados" && !refsLoaded) fetchRefs(1)
  }

  // ── Create ─────────────────────────────────────────────────────────────────

  const setC = (k: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setCreateForm((f) => ({ ...f, [k]: e.target.value }))

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch("/api/medicos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(createForm),
    })
    if (res.ok) {
      const { data } = await res.json()
      setMedicos((p) => [data, ...p])
      setTotal((t) => t + 1)
      setCreateOpen(false)
      setCreateForm(EMPTY_FORM)
      setStatsLoaded(false)
    }
    setSaving(false)
  }

  // ── Edit saved ─────────────────────────────────────────────────────────────

  function handleSaved(updated: Medico) {
    setMedicos((prev) => prev.map((m) => (m.id === updated.id ? updated : m)))
    setStatsLoaded(false)
  }

  // ── Filter helpers ─────────────────────────────────────────────────────────

  const hasFilters = search || filterEsp || filterEst || filterRed

  function clearFilters() {
    setSearch(""); setFilterEsp(""); setFilterEst(""); setFilterRed(false)
  }

  const refsFiltered = refsSearch.length >= 2
    ? refs.filter((r) =>
        r.medicos?.nombre.toLowerCase().includes(refsSearch.toLowerCase()) ||
        (r.nombre ?? "").toLowerCase().includes(refsSearch.toLowerCase())
      )
    : refs

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold" style={{ color: "var(--text)" }}>Médicos</h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--subtle)" }}>
            Catálogo interno · los médicos no tienen acceso al sistema
          </p>
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus size={13} /> Registrar médico
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b" style={{ borderColor: "var(--border)" }}>
        {([
          { key: "lista",         label: "Lista",          icon: <Stethoscope size={13} /> },
          { key: "analitica",     label: "Analítica",      icon: <BarChart3 size={13} /> },
          { key: "referenciados", label: "Referenciados",  icon: <FileText size={13} /> },
        ] as const).map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => switchTab(key)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 -mb-px transition-colors"
            style={{
              borderBottomColor: tab === key ? "var(--accent)" : "transparent",
              color: tab === key ? "var(--accent)" : "var(--muted)",
            }}
          >
            {icon}{label}
          </button>
        ))}
      </div>

      {/* ── TAB: LISTA ── */}
      {tab === "lista" && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-2 items-center">
            <div className="relative flex-1 min-w-[180px] max-w-xs">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: "var(--muted)" }} />
              <input type="text" placeholder="Buscar por nombre..."
                value={search} onChange={(e) => setSearch(e.target.value)}
                className="w-full h-9 pl-8 pr-3 rounded-lg border text-sm outline-none"
                style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text)" }} />
              {search && (
                <button onClick={() => setSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                  style={{ color: "var(--muted)" }}>
                  <X size={12} />
                </button>
              )}
            </div>

            <input type="text" placeholder="Especialidad..."
              value={filterEsp} onChange={(e) => setFilterEsp(e.target.value)}
              className="h-9 px-3 rounded-lg border text-sm outline-none min-w-[150px]"
              style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text)" }} />

            <select value={filterEst} onChange={(e) => setFilterEst(e.target.value)}
              className="h-9 px-3 rounded-lg border text-sm outline-none min-w-[160px]"
              style={{
                background: "var(--surface)", borderColor: "var(--border)",
                color: filterEst ? "var(--text)" : "var(--muted)",
              }}>
              <option value="">Todos los estados</option>
              {GEO_ESTADOS.map((e) => <option key={e} value={e}>{e}</option>)}
            </select>

            <button
              onClick={() => setFilterRed((v) => !v)}
              className="h-9 px-3 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors"
              style={{
                borderColor: filterRed ? "#059669" : "var(--border)",
                background: filterRed ? "#ECFDF5" : "transparent",
                color: filterRed ? "#059669" : "var(--muted)",
              }}
            >
              <Network size={12} /> Solo red
            </button>

            {hasFilters && (
              <button onClick={clearFilters}
                className="h-9 px-3 rounded-lg border text-xs flex items-center gap-1"
                style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
                <X size={11} /> Limpiar
              </button>
            )}

            <span className="text-xs ml-auto" style={{ color: "var(--subtle)" }}>
              {loading ? "Cargando..." : `${total.toLocaleString()} médicos`}
            </span>
          </div>

          {/* Cards grid */}
          {loading ? (
            <div className="text-center py-12 text-xs" style={{ color: "var(--subtle)" }}>
              Cargando...
            </div>
          ) : medicos.length === 0 ? (
            <div className="flex flex-col items-center py-16 gap-2">
              <Stethoscope size={28} style={{ color: "var(--border)" }} />
              <p className="text-xs" style={{ color: "var(--subtle)" }}>
                {hasFilters ? "Sin resultados para esta búsqueda" : "Sin médicos registrados"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {medicos.map((m) => (
                <div key={m.id}
                  className="rounded-xl border p-4 space-y-2 cursor-pointer transition-colors hover:border-[var(--accent)]"
                  style={{ background: "var(--surface)", borderColor: "var(--border)", opacity: m.activo ? 1 : 0.55 }}
                  onClick={() => setEditMedico(m)}
                >
                  <div className="flex items-start gap-2">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                      style={{ background: m.en_red ? "#059669" : "var(--accent)" }}>
                      {m.nombre[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold leading-tight truncate"
                        style={{ color: "var(--text)" }}>{m.nombre}</div>
                      <div className="text-xs truncate" style={{ color: "var(--muted)" }}>
                        {[m.especialidad, m.sub_especialidad].filter(Boolean).join(" · ") || "Sin especialidad"}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      {m.en_red && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                          style={{ background: "#ECFDF5", color: "#059669" }}>
                          Red
                        </span>
                      )}
                      {!m.activo && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                          style={{ background: "#FEF2F2", color: "#DC2626" }}>
                          Inactivo
                        </span>
                      )}
                    </div>
                  </div>

                  {(m.cedula || m.cobertura) && (
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                      {m.cedula && <span className="text-xs" style={{ color: "var(--subtle)" }}>Céd. {m.cedula}</span>}
                      {m.cobertura && <span className="text-xs" style={{ color: "var(--subtle)" }}>{m.cobertura}</span>}
                    </div>
                  )}

                  {(m.telefono || m.email) && (
                    <div className="text-xs space-y-0.5" style={{ color: "var(--subtle)" }}>
                      {m.telefono && <div>{[m.telefono, m.telefono_secundario].filter(Boolean).join(" / ")}</div>}
                      {m.email && <div className="truncate">{m.email}</div>}
                    </div>
                  )}

                  <div className="flex items-center justify-end">
                    <Edit2 size={11} style={{ color: "var(--muted)" }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {!loading && total > 0 && (
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                <span className="text-xs" style={{ color: "var(--muted)" }}>Por página:</span>
                {PAGE_SIZES.map((ps) => (
                  <button key={ps}
                    onClick={() => changePageSize(ps)}
                    className="text-xs px-2 py-1 rounded border transition-colors"
                    style={{
                      borderColor: pageSize === ps ? "var(--accent)" : "var(--border)",
                      color: pageSize === ps ? "var(--accent)" : "var(--muted)",
                      background: pageSize === ps ? "color-mix(in srgb, var(--accent) 8%, transparent)" : "transparent",
                    }}
                  >
                    {ps}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs" style={{ color: "var(--muted)" }}>
                  Página {page} de {totalPages || 1}
                </span>
                <button
                  onClick={() => goToPage(page - 1)}
                  disabled={page <= 1}
                  className="p-1.5 rounded-lg border disabled:opacity-40"
                  style={{ borderColor: "var(--border)", color: "var(--muted)" }}
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  onClick={() => goToPage(page + 1)}
                  disabled={page >= totalPages}
                  className="p-1.5 rounded-lg border disabled:opacity-40"
                  style={{ borderColor: "var(--border)", color: "var(--muted)" }}
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB: ANALÍTICA ── */}
      {tab === "analitica" && (
        <div className="space-y-6">
          {statsLoading && (
            <div className="text-center py-12 text-xs" style={{ color: "var(--subtle)" }}>
              Calculando estadísticas...
            </div>
          )}

          {stats && (
            <>
              {/* KPI tiles */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Total médicos",       value: stats.total.toLocaleString(),               color: "var(--text)" },
                  { label: "En red",              value: stats.en_red.toLocaleString(),              color: "#059669" },
                  { label: "Fuera de red",        value: stats.fuera_de_red.toLocaleString(),        color: "var(--muted)" },
                  { label: "Inactivos",           value: stats.inactivos.toLocaleString(),           color: "#DC2626" },
                  { label: "Especialidades",      value: stats.especialidades_unicas.toLocaleString(), color: "var(--text)" },
                  { label: "Estados con cobertura", value: stats.estados_cubiertos.toLocaleString(), color: "var(--text)" },
                  { label: "% en red",
                    value: stats.total_activos > 0
                      ? `${Math.round((stats.en_red / stats.total_activos) * 100)}%`
                      : "0%",
                    color: "#059669" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="rounded-xl border p-4"
                    style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
                    <div className="text-xs mb-1" style={{ color: "var(--muted)" }}>{label}</div>
                    <div className="text-xl font-semibold" style={{ color }}>{value}</div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Por estado */}
                <div className="rounded-xl border overflow-hidden"
                  style={{ borderColor: "var(--border)" }}>
                  <div className="px-4 py-3 border-b text-sm font-medium"
                    style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text)" }}>
                    Médicos por estado
                  </div>
                  <div className="divide-y" style={{ borderColor: "var(--border)" }}>
                    {stats.por_estado.map(({ estado, total: cnt, en_red: red }) => (
                      <div key={estado}
                        className="flex items-center gap-3 px-4 py-2.5">
                        <span className="text-sm flex-1 truncate" style={{ color: "var(--text)" }}>{estado}</span>
                        <span className="text-xs px-1.5 py-0.5 rounded-full"
                          style={{ background: "#ECFDF5", color: "#059669" }}>
                          {red} red
                        </span>
                        <span className="text-sm font-medium tabular-nums w-10 text-right"
                          style={{ color: "var(--text)" }}>
                          {cnt}
                        </span>
                        <div className="w-16 h-1.5 rounded-full overflow-hidden"
                          style={{ background: "var(--border)" }}>
                          <div className="h-full rounded-full"
                            style={{
                              width: `${Math.round((cnt / (stats.por_estado[0]?.total || 1)) * 100)}%`,
                              background: "var(--accent)",
                            }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Por especialidad */}
                <div className="rounded-xl border overflow-hidden"
                  style={{ borderColor: "var(--border)" }}>
                  <div className="px-4 py-3 border-b text-sm font-medium"
                    style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text)" }}>
                    Médicos por especialidad
                  </div>
                  <div className="divide-y" style={{ borderColor: "var(--border)" }}>
                    {stats.por_especialidad.map(({ especialidad, total: cnt }) => (
                      <div key={especialidad}
                        className="flex items-center gap-3 px-4 py-2.5">
                        <span className="text-sm flex-1 truncate" style={{ color: "var(--text)" }}>{especialidad}</span>
                        <span className="text-sm font-medium tabular-nums w-10 text-right"
                          style={{ color: "var(--text)" }}>
                          {cnt}
                        </span>
                        <div className="w-16 h-1.5 rounded-full overflow-hidden"
                          style={{ background: "var(--border)" }}>
                          <div className="h-full rounded-full"
                            style={{
                              width: `${Math.round((cnt / (stats.por_especialidad[0]?.total || 1)) * 100)}%`,
                              background: "var(--accent)",
                            }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── TAB: REFERENCIADOS ── */}
      {tab === "referenciados" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-xs">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: "var(--muted)" }} />
              <input type="text" placeholder="Filtrar por médico o paciente..."
                value={refsSearch} onChange={(e) => setRefsSearch(e.target.value)}
                className="w-full h-9 pl-8 pr-3 rounded-lg border text-sm outline-none"
                style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text)" }} />
            </div>
            <span className="text-xs" style={{ color: "var(--subtle)" }}>
              {refsLoading ? "Cargando..." : `${refsTotal.toLocaleString()} leads referenciados`}
            </span>
          </div>

          {refsLoading ? (
            <div className="text-center py-12 text-xs" style={{ color: "var(--subtle)" }}>
              Cargando...
            </div>
          ) : refs.length === 0 ? (
            <div className="flex flex-col items-center py-16 gap-2">
              <FileText size={28} style={{ color: "var(--border)" }} />
              <p className="text-xs" style={{ color: "var(--subtle)" }}>
                Aún no hay leads con médico asignado
              </p>
            </div>
          ) : (
            <>
              {/* Mobile cards */}
              <div className="sm:hidden space-y-2">
                {refsFiltered.map((r) => (
                  <div key={r.id} className="rounded-xl border p-3 space-y-2"
                    style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-xs font-medium" style={{ color: "var(--text)" }}>
                          {r.medicos?.nombre ?? "—"}
                        </div>
                        <div className="text-[11px]" style={{ color: "var(--muted)" }}>
                          {r.medicos?.especialidad ?? "Sin especialidad"} · {r.medicos?.cobertura ?? ""}
                        </div>
                      </div>
                      <EtapaBadge etapa={r.etapa} />
                    </div>
                    <div className="text-xs" style={{ color: "var(--muted)" }}>
                      Paciente: <span style={{ color: "var(--text)" }}>
                        {[r.nombre, r.apellido_paterno].filter(Boolean).join(" ")}
                      </span>
                    </div>
                    {r.procedimiento && (
                      <div className="text-xs truncate" style={{ color: "var(--muted)" }}>
                        {r.procedimiento}
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-[11px]" style={{ color: "var(--subtle)" }}>{fmt(r.fecha_captura)}</span>
                      <Link href={`/leads/${r.id}`}
                        className="text-xs font-medium" style={{ color: "var(--accent)" }}>
                        Ver lead →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop table */}
              <div className="hidden sm:block rounded-xl border overflow-hidden"
                style={{ borderColor: "var(--border)" }}>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr style={{ background: "var(--surface-2)" }}>
                        {["Médico", "Especialidad / Estado", "Paciente", "Procedimiento", "Etapa", "Fecha", ""].map((h) => (
                          <th key={h} className="text-left px-4 py-2.5 text-xs font-medium border-b"
                            style={{ color: "var(--muted)", borderColor: "var(--border)" }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {refsFiltered.map((r) => (
                        <tr key={r.id} className="border-b transition-colors hover:bg-[var(--surface-2)]"
                          style={{ borderColor: "var(--border)" }}>
                          <td className="px-4 py-3">
                            <div className="text-sm font-medium" style={{ color: "var(--text)" }}>
                              {r.medicos?.nombre ?? "—"}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-xs" style={{ color: "var(--muted)" }}>
                              {r.medicos?.especialidad ?? "—"}
                            </div>
                            <div className="text-xs" style={{ color: "var(--subtle)" }}>
                              {r.medicos?.cobertura ?? ""}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm" style={{ color: "var(--text)" }}>
                              {[r.nombre, r.apellido_paterno].filter(Boolean).join(" ")}
                            </span>
                          </td>
                          <td className="px-4 py-3 max-w-[180px]">
                            <span className="text-xs truncate block" style={{ color: "var(--muted)" }}>
                              {r.procedimiento ?? "—"}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <EtapaBadge etapa={r.etapa} />
                          </td>
                          <td className="px-4 py-3 text-xs tabular-nums"
                            style={{ color: "var(--subtle)" }}>
                            {fmt(r.fecha_captura)}
                          </td>
                          <td className="px-4 py-3">
                            <Link href={`/leads/${r.id}`}
                              className="text-xs font-medium" style={{ color: "var(--accent)" }}>
                              Ver →
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {refsTotal > 50 && (
                <div className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: "var(--muted)" }}>
                    Mostrando {refs.length} de {refsTotal}
                  </span>
                  <div className="flex gap-2">
                    <Button variant="secondary" size="sm"
                      disabled={refsPage <= 1}
                      onClick={() => { const p = refsPage - 1; setRefsPage(p); fetchRefs(p) }}>
                      <ChevronLeft size={13} /> Anterior
                    </Button>
                    <Button variant="secondary" size="sm"
                      disabled={refsPage * 50 >= refsTotal}
                      onClick={() => { const p = refsPage + 1; setRefsPage(p); fetchRefs(p) }}>
                      Siguiente <ChevronRight size={13} />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Edit panel */}
      {editMedico && (
        <EditPanel
          medico={editMedico}
          onClose={() => setEditMedico(null)}
          onSaved={handleSaved}
        />
      )}

      {/* Modal: Registrar médico */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Registrar médico">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input label="Nombre completo *" value={createForm.nombre}
            onChange={setC("nombre")} required />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Especialidad" value={createForm.especialidad}
              onChange={setC("especialidad")} />
            <Input label="Sub-especialidad" value={createForm.sub_especialidad}
              onChange={setC("sub_especialidad")} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Cédula profesional" value={createForm.cedula}
              onChange={setC("cedula")} />
            <Select label="Estado de cobertura" value={createForm.cobertura}
              onChange={setC("cobertura")}>
              <option value="">Seleccionar estado</option>
              {GEO_ESTADOS.map((e) => <option key={e} value={e}>{e}</option>)}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Teléfono" value={createForm.telefono}
              onChange={setC("telefono")} />
            <Input label="Email" type="email" value={createForm.email}
              onChange={setC("email")} />
          </div>
          <Input label="Hospital / Institución" value={createForm.hospital}
            onChange={setC("hospital")} />
          <Textarea label="Aseguradoras aceptadas" value={createForm.aseguradoras_aceptadas}
            onChange={setC("aseguradoras_aceptadas")} rows={2} />
          <Textarea label="Notas" value={createForm.notas}
            onChange={setC("notas")} rows={2} />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setCreateOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" loading={saving}>Registrar</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
