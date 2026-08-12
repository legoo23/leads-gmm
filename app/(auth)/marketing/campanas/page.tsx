"use client"
import { useState, useEffect } from "react"
import {
  Plus, Megaphone, Calendar, Copy, Check, QrCode,
  Eye, EyeOff, Power, PowerOff, Edit2, X, Users,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Modal } from "@/components/ui/modal"
import { Input, Select, Textarea } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/utils"
import { TEMAS_SALUD } from "@/constants/campanas-salud"

// ── Types ─────────────────────────────────────────────────────────────────────

interface Campana {
  id: number
  nombre: string
  procedimiento_target: string | null
  descripcion: string | null
  vigencia_inicio: string | null
  vigencia_fin: string | null
  activa: boolean
  visible_vendedores: boolean
  fecha_creacion: string
  codigo_unico: string | null
}

const EMPTY_FORM = {
  nombre: "", categoria: "", subtema: "", descripcion: "",
  vigencia_inicio: "", vigencia_fin: "", visible_vendedores: false,
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function isVigente(c: Campana) {
  if (!c.activa) return false
  const fin = c.vigencia_fin ? new Date(c.vigencia_fin) : null
  return !fin || fin >= new Date()
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

// Toggle pill inline — used for visible_vendedores and activa
function Toggle({
  value, onChange, loading = false,
}: { value: boolean; onChange: () => void; loading?: boolean }) {
  return (
    <button
      type="button"
      onClick={onChange}
      disabled={loading}
      className="w-9 h-5 rounded-full flex-shrink-0 relative transition-colors disabled:opacity-50"
      style={{ background: value ? "#059669" : "var(--border)" }}
    >
      <span
        className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all"
        style={{ left: value ? "calc(100% - 18px)" : "2px" }}
      />
    </button>
  )
}

// ── Edit Modal ────────────────────────────────────────────────────────────────

function EditModal({
  campana, onClose, onSaved,
}: { campana: Campana; onClose: () => void; onSaved: (c: Campana) => void }) {
  const [form, setForm] = useState({
    nombre:               campana.nombre,
    descripcion:          campana.descripcion ?? "",
    vigencia_inicio:      campana.vigencia_inicio?.split("T")[0] ?? "",
    vigencia_fin:         campana.vigencia_fin?.split("T")[0] ?? "",
    visible_vendedores:   campana.visible_vendedores,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState("")

  const set = (k: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }))

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError("")
    const res = await fetch("/api/campanas", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: campana.id, ...form }),
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
    <Modal open onClose={onClose} title={`Editar: ${campana.nombre}`}>
      <form onSubmit={handleSave} className="space-y-4">
        <Input label="Nombre *" value={form.nombre} onChange={set("nombre")} required />
        <Textarea label="Descripción" value={form.descripcion}
          onChange={set("descripcion")} rows={2} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Vigencia inicio" type="date" value={form.vigencia_inicio}
            onChange={set("vigencia_inicio")} />
          <Input label="Vigencia fin" type="date" value={form.vigencia_fin}
            onChange={set("vigencia_fin")} />
        </div>

        <div className="flex items-center justify-between p-3 rounded-lg border"
          style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}>
          <div>
            <div className="text-sm font-medium flex items-center gap-1.5"
              style={{ color: "var(--text)" }}>
              <Users size={13} style={{ color: "var(--muted)" }} />
              Visible a vendedores
            </div>
            <div className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
              Aparece en el portal del vendedor como material de apoyo
            </div>
          </div>
          <Toggle
            value={form.visible_vendedores}
            onChange={() => setForm((f) => ({ ...f, visible_vendedores: !f.visible_vendedores }))}
          />
        </div>

        {error && (
          <p className="text-xs p-2 rounded-lg" style={{ background: "#FEF2F2", color: "#DC2626" }}>
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit" loading={saving}>Guardar</Button>
        </div>
      </form>
    </Modal>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function CampanasPage() {
  const [campanas, setCampanas]   = useState<Campana[]>([])
  const [loading, setLoading]     = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Campana | null>(null)
  const [saving, setSaving]       = useState(false)
  const [toggling, setToggling]   = useState<number | null>(null)
  const [filterActiva, setFilterActiva] = useState<"todas" | "activas" | "inactivas">("todas")

  const [form, setForm] = useState(EMPTY_FORM)

  async function load() {
    setLoading(true)
    const res = await fetch("/api/campanas")
    if (res.ok) { const j = await res.json(); setCampanas(j.data ?? []) }
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const set = (k: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      setForm((f) => {
        const next = { ...f, [k]: e.target.value }
        if (k === "categoria") next.subtema = ""
        return next
      })
    }

  const temasDisponibles = form.categoria
    ? TEMAS_SALUD.find((c) => c.categoria === form.categoria)?.temas ?? []
    : []

  // ── Create ────────────────────────────────────────────────────────────────

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch("/api/campanas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombre:               form.nombre,
        procedimiento_target: form.subtema || form.categoria || null,
        descripcion:          form.descripcion || null,
        vigencia_inicio:      form.vigencia_inicio || null,
        vigencia_fin:         form.vigencia_fin || null,
        visible_vendedores:   form.visible_vendedores,
      }),
    })
    if (res.ok) {
      const { data } = await res.json()
      setCampanas((p) => [data, ...p])
      setCreateOpen(false)
      setForm(EMPTY_FORM)
    }
    setSaving(false)
  }

  // ── Inline toggle (activa / visible_vendedores) ────────────────────────────

  async function toggle(id: number, field: "activa" | "visible_vendedores", current: boolean) {
    setToggling(id)
    const res = await fetch("/api/campanas", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, [field]: !current }),
    })
    if (res.ok) {
      const { data } = await res.json()
      setCampanas((prev) => prev.map((c) => (c.id === data.id ? data : c)))
    }
    setToggling(null)
  }

  // ── Filter ────────────────────────────────────────────────────────────────

  const visible = campanas.filter((c) => {
    if (filterActiva === "activas")   return isVigente(c)
    if (filterActiva === "inactivas") return !isVigente(c)
    return true
  })

  const countActivas   = campanas.filter(isVigente).length
  const countVendedor  = campanas.filter((c) => c.visible_vendedores && isVigente(c)).length

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold" style={{ color: "var(--text)" }}>Campañas</h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--subtle)" }}>
            {campanas.length} total · {countActivas} activas · {countVendedor} visibles a vendedores
          </p>
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus size={13} /> Nueva campaña
        </Button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 border-b" style={{ borderColor: "var(--border)" }}>
        {([
          { key: "todas",     label: `Todas (${campanas.length})` },
          { key: "activas",   label: `Activas (${countActivas})` },
          { key: "inactivas", label: `Inactivas (${campanas.length - countActivas})` },
        ] as const).map(({ key, label }) => (
          <button key={key} onClick={() => setFilterActiva(key)}
            className="px-3 py-2 text-xs font-medium border-b-2 -mb-px transition-colors"
            style={{
              borderBottomColor: filterActiva === key ? "var(--accent)" : "transparent",
              color: filterActiva === key ? "var(--accent)" : "var(--muted)",
            }}>
            {label}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="text-center py-12 text-xs" style={{ color: "var(--subtle)" }}>Cargando...</div>
      ) : visible.length === 0 ? (
        <div className="flex flex-col items-center py-16 gap-2">
          <Megaphone size={28} style={{ color: "var(--border)" }} />
          <p className="text-xs" style={{ color: "var(--subtle)" }}>Sin campañas</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visible.map((c) => {
            const vigente = isVigente(c)
            const isToggling = toggling === c.id

            return (
              <div key={c.id}
                className="rounded-xl border p-4 space-y-3 flex flex-col"
                style={{
                  background: "var(--surface)",
                  borderColor: "var(--border)",
                  opacity: vigente ? 1 : 0.6,
                }}>

                {/* Top row */}
                <div className="flex items-start gap-2">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: vigente ? "#ECFDF5" : "var(--surface-2)" }}>
                    <Megaphone size={15} style={{ color: vigente ? "#059669" : "var(--muted)" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-sm font-semibold leading-tight truncate"
                      style={{ color: "var(--text)" }}>{c.nombre}</h2>
                    {c.procedimiento_target && (
                      <p className="text-xs truncate" style={{ color: "var(--muted)" }}>
                        {c.procedimiento_target}
                      </p>
                    )}
                  </div>
                  <Badge
                    label={vigente ? "Activa" : "Inactiva"}
                    color={vigente ? "#059669" : "#6B7280"}
                    bg={vigente ? "#ECFDF5" : "#F3F4F6"}
                    size="sm"
                  />
                </div>

                {/* Description */}
                {c.descripcion && (
                  <p className="text-xs line-clamp-2 flex-1" style={{ color: "var(--subtle)" }}>
                    {c.descripcion}
                  </p>
                )}

                {/* Vigencia */}
                {(c.vigencia_inicio || c.vigencia_fin) && (
                  <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--subtle)" }}>
                    <Calendar size={11} />
                    {c.vigencia_inicio ? formatDate(c.vigencia_inicio) : "—"}
                    {" → "}
                    {c.vigencia_fin ? formatDate(c.vigencia_fin) : "Sin fecha fin"}
                  </div>
                )}

                {/* Código */}
                {c.codigo_unico && (
                  <div className="border-t pt-2" style={{ borderColor: "var(--border)" }}>
                    <CodigoChip codigo={c.codigo_unico} />
                  </div>
                )}

                {/* Toggles + acciones */}
                <div className="border-t pt-3 space-y-2" style={{ borderColor: "var(--border)" }}>

                  {/* Visible vendedores */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      {c.visible_vendedores
                        ? <Eye size={12} color="#059669" />
                        : <EyeOff size={12} style={{ color: "var(--muted)" }} />
                      }
                      <span className="text-xs" style={{ color: c.visible_vendedores ? "#059669" : "var(--muted)" }}>
                        {c.visible_vendedores ? "Visible a vendedores" : "Oculto a vendedores"}
                      </span>
                    </div>
                    <Toggle
                      value={c.visible_vendedores}
                      loading={isToggling}
                      onChange={() => toggle(c.id, "visible_vendedores", c.visible_vendedores)}
                    />
                  </div>

                  {/* Activa */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      {c.activa
                        ? <Power size={12} color="var(--accent)" />
                        : <PowerOff size={12} style={{ color: "var(--muted)" }} />
                      }
                      <span className="text-xs" style={{ color: c.activa ? "var(--accent)" : "var(--muted)" }}>
                        {c.activa ? "Campaña activa" : "Campaña pausada"}
                      </span>
                    </div>
                    <Toggle
                      value={c.activa}
                      loading={isToggling}
                      onChange={() => toggle(c.id, "activa", c.activa)}
                    />
                  </div>

                  {/* Edit button */}
                  <button
                    onClick={() => setEditTarget(c)}
                    className="flex items-center gap-1.5 text-xs w-full justify-center py-1.5 rounded-lg border transition-colors hover:bg-[var(--surface-2)]"
                    style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
                    <Edit2 size={11} /> Editar campaña
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Edit modal */}
      {editTarget && (
        <EditModal
          campana={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={(updated) => {
            setCampanas((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
            setEditTarget(null)
          }}
        />
      )}

      {/* Create modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Nueva campaña">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input label="Nombre de la campaña *" value={form.nombre}
            onChange={set("nombre")} required />

          <Select label="Categoría" value={form.categoria} onChange={set("categoria")}>
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

          <Textarea label="Descripción" value={form.descripcion}
            onChange={set("descripcion")} rows={2} />

          <div className="grid grid-cols-2 gap-3">
            <Input label="Vigencia inicio" type="date" value={form.vigencia_inicio}
              onChange={set("vigencia_inicio")} />
            <Input label="Vigencia fin" type="date" value={form.vigencia_fin}
              onChange={set("vigencia_fin")} />
          </div>

          {/* visible_vendedores toggle */}
          <div className="flex items-center justify-between p-3 rounded-lg border"
            style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}>
            <div>
              <div className="text-sm font-medium flex items-center gap-1.5"
                style={{ color: "var(--text)" }}>
                <Users size={13} style={{ color: "var(--muted)" }} />
                Visible a vendedores
              </div>
              <div className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                El vendedor la verá en su portal como material de apoyo
              </div>
            </div>
            <Toggle
              value={form.visible_vendedores}
              onChange={() => setForm((f) => ({ ...f, visible_vendedores: !f.visible_vendedores }))}
            />
          </div>

          <p className="text-xs" style={{ color: "var(--subtle)" }}>
            Se generará un código QR único para esta campaña al crearla.
          </p>

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="secondary" onClick={() => setCreateOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" loading={saving}>Crear campaña</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
