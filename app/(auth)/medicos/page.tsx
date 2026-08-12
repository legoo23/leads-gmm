"use client"
import { useState, useEffect, useCallback, useRef } from "react"
import { Plus, Stethoscope, Search, X, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Modal } from "@/components/ui/modal"
import { Input, Select, Textarea } from "@/components/ui/input"
import { GEO_ESTADOS } from "@/constants/geo-mx"

interface Medico {
  id: number
  nombre: string
  especialidad: string | null
  sub_especialidad: string | null
  telefono: string | null
  telefono_secundario: string | null
  email: string | null
  cedula: string | null
  cobertura: string | null
  consultorio: string | null
  en_red: boolean | null
  activo: boolean
}

const LIMIT = 50

export default function MedicosPage() {
  const [medicos, setMedicos]     = useState<Medico[]>([])
  const [total, setTotal]         = useState(0)
  const [loading, setLoading]     = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [offset, setOffset]       = useState(0)

  const [search, setSearch]           = useState("")
  const [filterEsp, setFilterEsp]     = useState("")
  const [filterCob, setFilterCob]     = useState("")

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving]       = useState(false)
  const [form, setForm]           = useState({
    nombre: "", especialidad: "", sub_especialidad: "", hospital: "",
    telefono: "", email: "", cedula: "", cobertura: "",
    aseguradoras_aceptadas: "", notas: "",
  })

  // ── Fetch with current filters ────────────────────────────────────────
  const fetchMedicos = useCallback(async (
    q: string, esp: string, cob: string, off: number, append: boolean
  ) => {
    if (!append) setLoading(true)
    else setLoadingMore(true)

    const params = new URLSearchParams({ limit: String(LIMIT), offset: String(off) })
    if (q.length >= 2)   params.set("q", q)
    if (esp.length >= 2) params.set("especialidad", esp)
    if (cob.length >= 2) params.set("cobertura", cob)

    const res = await fetch(`/api/medicos?${params}`)
    if (res.ok) {
      const j = await res.json()
      if (append) setMedicos((prev) => [...prev, ...(j.data ?? [])])
      else        setMedicos(j.data ?? [])
      setTotal(j.total ?? 0)
      setOffset(off + (j.data?.length ?? 0))
    }
    setLoading(false)
    setLoadingMore(false)
  }, [])

  // Initial load
  useEffect(() => { fetchMedicos("", "", "", 0, false) }, [fetchMedicos])

  // Debounced filter changes
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setOffset(0)
      fetchMedicos(search, filterEsp, filterCob, 0, false)
    }, 350)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, filterEsp, filterCob])

  function clearFilters() {
    setSearch("")
    setFilterEsp("")
    setFilterCob("")
  }

  const hasFilters = search || filterEsp || filterCob
  const canLoadMore = medicos.length < total

  const set = (k: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }))

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch("/api/medicos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      const { data } = await res.json()
      setMedicos((p) => [data, ...p])
      setTotal((t) => t + 1)
      setModalOpen(false)
      setForm({
        nombre: "", especialidad: "", sub_especialidad: "", hospital: "",
        telefono: "", email: "", cedula: "", cobertura: "",
        aseguradoras_aceptadas: "", notas: "",
      })
    }
    setSaving(false)
  }

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
        <Button size="sm" onClick={() => setModalOpen(true)}>
          <Plus size={13} />
          Registrar médico
        </Button>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        {/* Search by name */}
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: "var(--muted)" }} />
          <input
            type="text"
            placeholder="Buscar por nombre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-8 pr-3 rounded-lg border text-sm outline-none"
            style={{
              background: "var(--surface)", borderColor: "var(--border)", color: "var(--text)",
            }}
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2"
              style={{ color: "var(--muted)" }}>
              <X size={12} />
            </button>
          )}
        </div>

        {/* Especialidad filter */}
        <div className="relative min-w-[180px]">
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: "var(--muted)" }} />
          <input
            type="text"
            placeholder="Especialidad..."
            value={filterEsp}
            onChange={(e) => setFilterEsp(e.target.value)}
            className="w-full h-9 pl-8 pr-3 rounded-lg border text-sm outline-none"
            style={{
              background: "var(--surface)", borderColor: "var(--border)", color: "var(--text)",
            }}
          />
          {filterEsp && (
            <button onClick={() => setFilterEsp("")} className="absolute right-2 top-1/2 -translate-y-1/2"
              style={{ color: "var(--muted)" }}>
              <X size={12} />
            </button>
          )}
        </div>

        {/* Estado filter */}
        <div className="relative min-w-[180px]">
          <select
            value={filterCob}
            onChange={(e) => setFilterCob(e.target.value)}
            className="w-full h-9 pl-3 pr-8 rounded-lg border text-sm outline-none appearance-none"
            style={{
              background: "var(--surface)", borderColor: "var(--border)", color: filterCob ? "var(--text)" : "var(--muted)",
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
              backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center", backgroundSize: "14px",
            }}
          >
            <option value="">Todos los estados</option>
            {GEO_ESTADOS.map((e) => <option key={e} value={e}>{e}</option>)}
          </select>
        </div>

        {/* Clear filters */}
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="h-9 px-3 rounded-lg border text-xs flex items-center gap-1 transition-colors hover:bg-[var(--surface-2)]"
            style={{ borderColor: "var(--border)", color: "var(--muted)" }}
          >
            <X size={11} />
            Limpiar
          </button>
        )}

        {/* Count */}
        <span className="text-xs ml-auto" style={{ color: "var(--subtle)" }}>
          {loading ? "Cargando..." : `${medicos.length.toLocaleString()} de ${total.toLocaleString()} médicos`}
        </span>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-2 gap-4">
        {loading && (
          <div className="col-span-2 text-center py-10 text-xs" style={{ color: "var(--subtle)" }}>
            Cargando...
          </div>
        )}
        {!loading && medicos.length === 0 && (
          <div className="col-span-2 flex flex-col items-center py-16 gap-2">
            <Stethoscope size={28} style={{ color: "var(--border)" }} />
            <p className="text-xs" style={{ color: "var(--subtle)" }}>
              {hasFilters ? "Sin resultados para esta búsqueda" : "Sin médicos registrados"}
            </p>
            {hasFilters && (
              <button onClick={clearFilters} className="text-xs underline mt-1"
                style={{ color: "var(--accent)" }}>
                Limpiar filtros
              </button>
            )}
          </div>
        )}

        {medicos.map((m) => (
          <div key={m.id} className="rounded-xl border p-4 space-y-2"
            style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <div className="flex items-start gap-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 mt-0.5"
                style={{ background: "var(--accent)" }}>
                {m.nombre[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold leading-tight" style={{ color: "var(--text)" }}>{m.nombre}</div>
                <div className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                  {[m.especialidad, m.sub_especialidad].filter(Boolean).join(" · ") || "Sin especialidad"}
                </div>
              </div>
              {m.en_red && (
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full flex-shrink-0"
                  style={{ background: "#ECFDF5", color: "#059669" }}>
                  Red
                </span>
              )}
            </div>

            {(m.cedula || m.cobertura) && (
              <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                {m.cedula && (
                  <span className="text-xs" style={{ color: "var(--subtle)" }}>Cédula: {m.cedula}</span>
                )}
                {m.cobertura && (
                  <span className="text-xs" style={{ color: "var(--subtle)" }}>Estado: {m.cobertura}</span>
                )}
              </div>
            )}

            {(m.telefono || m.telefono_secundario || m.email) && (
              <div className="text-xs space-y-0.5" style={{ color: "var(--subtle)" }}>
                {(m.telefono || m.telefono_secundario) && (
                  <div>
                    {[m.telefono, m.telefono_secundario].filter(Boolean).join(" / ")}
                  </div>
                )}
                {m.email && <div>{m.email}</div>}
              </div>
            )}

            {m.consultorio && (
              <div className="text-xs" style={{ color: "var(--subtle)" }}>
                Consultorio: {m.consultorio}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Load more */}
      {!loading && canLoadMore && (
        <div className="flex justify-center pt-2">
          <Button
            variant="secondary"
            size="sm"
            loading={loadingMore}
            onClick={() => fetchMedicos(search, filterEsp, filterCob, offset, true)}
          >
            <ChevronDown size={13} />
            Cargar {Math.min(LIMIT, total - medicos.length).toLocaleString()} más
          </Button>
        </div>
      )}

      {/* Modal: Registrar médico */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Registrar médico">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input label="Nombre completo *" value={form.nombre} onChange={set("nombre")} required />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Especialidad" value={form.especialidad} onChange={set("especialidad")} />
            <Input label="Sub-especialidad" value={form.sub_especialidad} onChange={set("sub_especialidad")} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Cédula profesional" value={form.cedula} onChange={set("cedula")} />
            <Select label="Estado de cobertura" value={form.cobertura} onChange={set("cobertura")}>
              <option value="">Seleccionar estado</option>
              {GEO_ESTADOS.map((e) => <option key={e} value={e}>{e}</option>)}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Teléfono" value={form.telefono} onChange={set("telefono")} />
            <Input label="Email" type="email" value={form.email} onChange={set("email")} />
          </div>
          <Input label="Hospital / Consultorio" value={form.hospital} onChange={set("hospital")} />
          <Textarea label="Aseguradoras aceptadas" value={form.aseguradoras_aceptadas} onChange={set("aseguradoras_aceptadas")} rows={2} />
          <Textarea label="Notas" value={form.notas} onChange={set("notas")} rows={2} />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit" loading={saving}>Registrar</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
