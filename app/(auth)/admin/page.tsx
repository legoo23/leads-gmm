"use client"
import { useState, useEffect } from "react"
import { Settings, Users, DollarSign, Plus, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Modal } from "@/components/ui/modal"
import { Input, Select } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { formatMXN } from "@/lib/utils"

interface Nivel { id: number; nombre: string; monto: number; activo: boolean; orden: number }
interface UserProfile { id: string; nombre: string; email: string; rol: string }

const TABS = [
  { key: "usuarios", label: "Usuarios", icon: Users },
  { key: "niveles",  label: "Niveles de comisión", icon: DollarSign },
  { key: "sistema",  label: "Sistema", icon: Settings },
]

export default function AdminPage() {
  const [tab, setTab] = useState("usuarios")
  const [niveles, setNiveles] = useState<Nivel[]>([])
  const [usuarios, setUsuarios] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [modalNivel, setModalNivel] = useState(false)
  const [saving, setSaving] = useState(false)
  const [nivelForm, setNivelForm] = useState({ nombre: "", monto: "", descripcion: "" })

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/niveles").then((r) => r.json()).catch(() => ({ data: [] })),
      fetch("/api/admin/usuarios").then((r) => r.json()).catch(() => ({ data: [] })),
    ]).then(([n, u]) => {
      setNiveles(n.data ?? [])
      setUsuarios(u.data ?? [])
      setLoading(false)
    })
  }, [])

  async function createNivel(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch("/api/admin/niveles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre: nivelForm.nombre, monto: parseFloat(nivelForm.monto), descripcion: nivelForm.descripcion }),
    })
    if (res.ok) {
      const { data } = await res.json()
      setNiveles((p) => [...p, data])
      setModalNivel(false)
      setNivelForm({ nombre: "", monto: "", descripcion: "" })
    }
    setSaving(false)
  }

  const setN = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setNivelForm((f) => ({ ...f, [k]: e.target.value }))

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-semibold" style={{ color: "var(--text)" }}>Administrador</h1>
        <p className="text-xs mt-0.5" style={{ color: "var(--subtle)" }}>Configuración global del sistema</p>
      </div>

      <div className="flex border-b" style={{ borderColor: "var(--border)" }}>
        {TABS.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium transition-colors border-b-2"
            style={{
              borderColor: tab === key ? "var(--accent)" : "transparent",
              color: tab === key ? "var(--accent)" : "var(--muted)",
            }}>
            <Icon size={12} />{label}
          </button>
        ))}
      </div>

      {/* Usuarios */}
      {tab === "usuarios" && (
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "var(--surface-2)", borderBottom: "1px solid var(--border)" }}>
                {["Usuario","Email","Rol"].map((h) => (
                  <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wide"
                    style={{ color: "var(--subtle)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={3} className="text-center py-10 text-xs" style={{ color: "var(--subtle)" }}>Cargando...</td></tr>}
              {!loading && usuarios.length === 0 && (
                <tr><td colSpan={3} className="text-center py-12 text-xs" style={{ color: "var(--subtle)" }}>Sin usuarios</td></tr>
              )}
              {usuarios.map((u) => (
                <tr key={u.id} className="border-t hover:bg-[var(--surface-2)] transition-colors"
                  style={{ borderColor: "var(--border)" }}>
                  <td className="px-4 py-3 text-xs font-medium" style={{ color: "var(--text)" }}>{u.nombre}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: "var(--muted)" }}>{u.email}</td>
                  <td className="px-4 py-3">
                    <Badge label={u.rol} color="#2563EB" bg="#EFF6FF" size="sm" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Niveles de comisión */}
      {tab === "niveles" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => setModalNivel(true)}>
              <Plus size={12} />
              Nuevo nivel
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {loading && <div className="col-span-3 text-center py-10 text-xs" style={{ color: "var(--subtle)" }}>Cargando...</div>}
            {niveles.map((n) => (
              <div key={n.id} className="rounded-xl border p-4 space-y-2"
                style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>{n.nombre}</span>
                  <Badge label={n.activo ? "Activo" : "Inactivo"} color={n.activo ? "#059669" : "#6B7280"} bg={n.activo ? "#ECFDF5" : "#F9FAFB"} size="sm" />
                </div>
                <div className="text-xl font-bold tabular-nums" style={{ color: "var(--accent)" }}>
                  {formatMXN(n.monto)}
                </div>
                <div className="text-xs" style={{ color: "var(--subtle)" }}>por conversión exitosa</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sistema */}
      {tab === "sistema" && (
        <div className="rounded-xl border p-6 space-y-3" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <h2 className="text-sm font-semibold" style={{ color: "var(--text)" }}>Información del sistema</h2>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <p className="font-medium" style={{ color: "var(--muted)" }}>Versión</p>
              <p style={{ color: "var(--text)" }}>Leads GMM v1.0</p>
            </div>
            <div>
              <p className="font-medium" style={{ color: "var(--muted)" }}>Propietario</p>
              <p style={{ color: "var(--text)" }}>Alejandro Legorreta Barrera</p>
            </div>
            <div>
              <p className="font-medium" style={{ color: "var(--muted)" }}>Licencia</p>
              <p className="font-mono" style={{ color: "var(--positive)" }}>Activa</p>
            </div>
            <div>
              <p className="font-medium" style={{ color: "var(--muted)" }}>Prefijo de códigos</p>
              <p className="font-mono" style={{ color: "var(--text)" }}>{process.env.NEXT_PUBLIC_VENDOR_CODE_PREFIX ?? "GMM"}</p>
            </div>
          </div>
          <div className="mt-4 p-3 rounded-lg text-xs" style={{ background: "var(--surface-2)", color: "var(--subtle)" }}>
            Este software es propiedad exclusiva de Alejandro Legorreta Barrera. No puede ser comercializado,
            trasladado, replicado ni vendido sin acuerdo legal firmado por el propietario.
          </div>
        </div>
      )}

      <Modal open={modalNivel} onClose={() => setModalNivel(false)} title="Nuevo nivel de comisión" size="sm">
        <form onSubmit={createNivel} className="space-y-4">
          <Input label="Nombre del nivel *" value={nivelForm.nombre} onChange={setN("nombre")} placeholder="Ej: Estándar" required />
          <Input label="Monto fijo (MXN) *" type="number" min="0" step="0.01" value={nivelForm.monto} onChange={setN("monto")} required />
          <Input label="Descripción" value={nivelForm.descripcion} onChange={setN("descripcion")} />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalNivel(false)}>Cancelar</Button>
            <Button type="submit" loading={saving}>Crear nivel</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
