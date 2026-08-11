"use client"
import { useState, useEffect } from "react"
import { Plus, Megaphone, Calendar, Copy, Check, QrCode } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Modal } from "@/components/ui/modal"
import { Input, Select, Textarea } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/utils"
import { TEMAS_SALUD } from "@/constants/campanas-salud"

interface Campana {
  id: number
  nombre: string
  procedimiento_target: string | null
  descripcion: string | null
  vigencia_inicio: string | null
  vigencia_fin: string | null
  activa: boolean
  fecha_creacion: string
  codigo_unico: string | null
}

function CodigoChip({ codigo }: { codigo: string }) {
  const [copied, setCopied] = useState(false)
  function copy() {
    navigator.clipboard.writeText(codigo).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }
  return (
    <button onClick={copy}
      className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-mono font-medium transition-colors"
      style={{ background: "var(--surface-2)", color: "var(--muted)" }}
      title="Copiar código">
      <QrCode size={11} />
      {codigo}
      {copied ? <Check size={10} color="#059669" /> : <Copy size={10} />}
    </button>
  )
}

export default function CampanasPage() {
  const [campanas, setCampanas] = useState<Campana[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    nombre: "", categoria: "", subtema: "", descripcion: "",
    vigencia_inicio: "", vigencia_fin: "",
  })

  async function load() {
    setLoading(true)
    const res = await fetch("/api/campanas")
    if (res.ok) { const j = await res.json(); setCampanas(j.data ?? []) }
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((f) => {
      const next = { ...f, [k]: e.target.value }
      if (k === "categoria") next.subtema = ""
      return next
    })
  }

  const temasDisponibles = form.categoria
    ? TEMAS_SALUD.find((c) => c.categoria === form.categoria)?.temas ?? []
    : []

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    const procedimiento_target = form.subtema || form.categoria || null
    const res = await fetch("/api/campanas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombre: form.nombre,
        procedimiento_target,
        descripcion: form.descripcion || null,
        vigencia_inicio: form.vigencia_inicio || null,
        vigencia_fin: form.vigencia_fin || null,
      }),
    })
    if (res.ok) {
      const { data } = await res.json()
      setCampanas((p) => [data, ...p])
      setModalOpen(false)
      setForm({ nombre: "", categoria: "", subtema: "", descripcion: "", vigencia_inicio: "", vigencia_fin: "" })
    }
    setSaving(false)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold" style={{ color: "var(--text)" }}>Campañas</h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--subtle)" }}>{campanas.length} campañas</p>
        </div>
        <Button size="sm" onClick={() => setModalOpen(true)}>
          <Plus size={13} />
          Nueva campaña
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {loading && (
          <div className="col-span-2 text-center py-12 text-xs" style={{ color: "var(--subtle)" }}>Cargando...</div>
        )}
        {!loading && campanas.length === 0 && (
          <div className="col-span-2 text-center py-16 text-xs" style={{ color: "var(--subtle)" }}>
            Sin campañas creadas
          </div>
        )}
        {campanas.map((c) => {
          const hoy = new Date()
          const fin = c.vigencia_fin ? new Date(c.vigencia_fin) : null
          const vigente = c.activa && (!fin || fin >= hoy)

          return (
            <div key={c.id} className="rounded-xl border p-5 space-y-3"
              style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
              <div className="flex items-start justify-between gap-2">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: vigente ? "#ECFDF5" : "var(--surface-2)" }}>
                  <Megaphone size={15} style={{ color: vigente ? "#059669" : "var(--muted)" }} />
                </div>
                <Badge
                  label={vigente ? "Activa" : "Inactiva"}
                  color={vigente ? "#059669" : "#6B7280"}
                  bg={vigente ? "#ECFDF5" : "#F9FAFB"}
                  size="sm"
                />
              </div>
              <div>
                <h2 className="text-sm font-semibold" style={{ color: "var(--text)" }}>{c.nombre}</h2>
                {c.procedimiento_target && (
                  <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{c.procedimiento_target}</p>
                )}
                {c.descripcion && (
                  <p className="text-xs mt-1 line-clamp-2" style={{ color: "var(--subtle)" }}>{c.descripcion}</p>
                )}
              </div>
              {(c.vigencia_inicio || c.vigencia_fin) && (
                <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--subtle)" }}>
                  <Calendar size={11} />
                  {c.vigencia_inicio ? formatDate(c.vigencia_inicio) : "—"}
                  {" → "}
                  {c.vigencia_fin ? formatDate(c.vigencia_fin) : "Sin fecha fin"}
                </div>
              )}
              {c.codigo_unico && (
                <div className="pt-1 border-t" style={{ borderColor: "var(--border)" }}>
                  <CodigoChip codigo={c.codigo_unico} />
                </div>
              )}
            </div>
          )
        })}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nueva campaña">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input label="Nombre de la campaña *" value={form.nombre} onChange={set("nombre")} required />

          {/* Tema de salud — dos selects en cascada */}
          <Select label="Categoría de campaña" value={form.categoria} onChange={set("categoria")}>
            <option value="">— General / Otra —</option>
            {TEMAS_SALUD.map((c) => (
              <option key={c.categoria} value={c.categoria}>{c.categoria}</option>
            ))}
          </Select>

          {form.categoria && (
            <Select label="Tema específico" value={form.subtema} onChange={set("subtema")}>
              <option value="">— Categoría completa —</option>
              {temasDisponibles.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </Select>
          )}

          <Textarea label="Descripción" value={form.descripcion} onChange={set("descripcion")} rows={2} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Vigencia inicio" type="date" value={form.vigencia_inicio} onChange={set("vigencia_inicio")} />
            <Input label="Vigencia fin" type="date" value={form.vigencia_fin} onChange={set("vigencia_fin")} />
          </div>
          <p className="text-xs" style={{ color: "var(--subtle)" }}>
            Se generará un código QR único para esta campaña al crearla.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit" loading={saving}>Crear campaña</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
