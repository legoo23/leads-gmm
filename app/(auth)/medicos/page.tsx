"use client"
import { useState, useEffect } from "react"
import { Plus, Stethoscope } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Modal } from "@/components/ui/modal"
import { Input, Select, Textarea } from "@/components/ui/input"

interface Medico {
  id: number; nombre: string; especialidad: string | null
  hospital: string | null; telefono: string | null; email: string | null
  aseguradoras_aceptadas: string | null; notas: string | null; activo: boolean
}

export default function MedicosPage() {
  const [medicos, setMedicos] = useState<Medico[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ nombre: "", especialidad: "", hospital: "", telefono: "", email: "", aseguradoras_aceptadas: "", notas: "" })

  async function load() {
    setLoading(true)
    const res = await fetch("/api/medicos")
    if (res.ok) { const j = await res.json(); setMedicos(j.data ?? []) }
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
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
      setModalOpen(false)
      setForm({ nombre: "", especialidad: "", hospital: "", telefono: "", email: "", aseguradoras_aceptadas: "", notas: "" })
    }
    setSaving(false)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold" style={{ color: "var(--text)" }}>Médicos</h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--subtle)" }}>Catálogo interno · los médicos no tienen acceso al sistema</p>
        </div>
        <Button size="sm" onClick={() => setModalOpen(true)}>
          <Plus size={13} />
          Registrar médico
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {loading && <div className="col-span-2 text-center py-10 text-xs" style={{ color: "var(--subtle)" }}>Cargando...</div>}
        {!loading && medicos.length === 0 && (
          <div className="col-span-2 flex flex-col items-center py-16 gap-2">
            <Stethoscope size={28} style={{ color: "var(--border)" }} />
            <p className="text-xs" style={{ color: "var(--subtle)" }}>Sin médicos registrados</p>
          </div>
        )}
        {medicos.map((m) => (
          <div key={m.id} className="rounded-xl border p-4 space-y-2"
            style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                style={{ background: "var(--accent)" }}>
                {m.nombre[0].toUpperCase()}
              </div>
              <div>
                <div className="text-sm font-semibold" style={{ color: "var(--text)" }}>{m.nombre}</div>
                <div className="text-xs" style={{ color: "var(--muted)" }}>
                  {m.especialidad ?? "Sin especialidad"}{m.hospital ? ` · ${m.hospital}` : ""}
                </div>
              </div>
            </div>
            {(m.telefono || m.email) && (
              <div className="text-xs" style={{ color: "var(--subtle)" }}>
                {m.telefono && <span>{m.telefono}</span>}
                {m.telefono && m.email && " · "}
                {m.email && <span>{m.email}</span>}
              </div>
            )}
            {m.aseguradoras_aceptadas && (
              <div className="text-xs" style={{ color: "var(--subtle)" }}>
                Aseguradoras: {m.aseguradoras_aceptadas}
              </div>
            )}
          </div>
        ))}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Registrar médico">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input label="Nombre completo *" value={form.nombre} onChange={set("nombre")} required />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Especialidad" value={form.especialidad} onChange={set("especialidad")} />
            <Input label="Hospital" value={form.hospital} onChange={set("hospital")} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Teléfono" value={form.telefono} onChange={set("telefono")} />
            <Input label="Email" type="email" value={form.email} onChange={set("email")} />
          </div>
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
