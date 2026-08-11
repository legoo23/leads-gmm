"use client"
import { useState, useEffect } from "react"
import { Plus, Building2, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Modal } from "@/components/ui/modal"
import { Input, Textarea } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ASEGURADORAS } from "@/constants/aseguradoras"

export default function EmpresasPage() {
  const [tab, setTab] = useState<"aseguradoras" | "convenios">("aseguradoras")
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ nombre: "", contacto: "", telefono: "", email: "", notas: "" })
  const [saving, setSaving] = useState(false)

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold" style={{ color: "var(--text)" }}>Empresas</h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--subtle)" }}>Aseguradoras y empresas con convenio</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b" style={{ borderColor: "var(--border)" }}>
        {(["aseguradoras", "convenios"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className="px-4 py-2.5 text-xs font-medium capitalize transition-colors border-b-2"
            style={{
              borderColor: tab === t ? "var(--accent)" : "transparent",
              color: tab === t ? "var(--accent)" : "var(--muted)",
            }}>
            {t === "aseguradoras" ? "Aseguradoras" : "Empresas con convenio"}
          </button>
        ))}
      </div>

      {tab === "aseguradoras" && (
        <div className="grid grid-cols-3 gap-3">
          {ASEGURADORAS.map((a) => (
            <div key={a.id} className="rounded-xl border p-4 flex items-center gap-3"
              style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: "var(--accent-bg)" }}>
                <Shield size={14} style={{ color: "var(--accent)" }} />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold truncate" style={{ color: "var(--text)" }}>{a.nombre}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "convenios" && (
        <div className="flex flex-col items-center py-16 gap-2">
          <Building2 size={28} style={{ color: "var(--border)" }} />
          <p className="text-xs" style={{ color: "var(--subtle)" }}>Sin empresas con convenio registradas</p>
          <Button size="sm" onClick={() => setModalOpen(true)}>
            <Plus size={12} />
            Agregar empresa
          </Button>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Agregar empresa con convenio">
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setModalOpen(false) }}>
          <Input label="Nombre de la empresa *" value={form.nombre} onChange={set("nombre")} required />
          <Input label="Contacto" value={form.contacto} onChange={set("contacto")} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Teléfono" value={form.telefono} onChange={set("telefono")} />
            <Input label="Email" type="email" value={form.email} onChange={set("email")} />
          </div>
          <Textarea label="Notas" value={form.notas} onChange={set("notas")} />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit">Guardar</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
