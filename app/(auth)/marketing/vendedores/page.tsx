"use client"
import { useState, useEffect } from "react"
import { Plus, QrCode, Copy, Check, UserCheck, UserX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Modal } from "@/components/ui/modal"
import { Input, Select } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import QRCode from "react-qr-code"

interface Vendedor {
  id: number; nombre: string; telefono: string; email: string
  codigo_unico: string; activo: boolean; fecha_registro: string
  id_nivel: number | null
  niveles_comision: { nombre: string; monto: number } | null
}

interface Nivel { id: number; nombre: string; monto: number }

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? ""

export default function VendedoresPage() {
  const [vendedores, setVendedores] = useState<Vendedor[]>([])
  const [niveles, setNiveles] = useState<Nivel[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [qrVendedor, setQrVendedor] = useState<Vendedor | null>(null)
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState<number | null>(null)
  const [form, setForm] = useState({ nombre: "", telefono: "", email: "", id_nivel: "" })

  useEffect(() => {
    Promise.all([
      fetch("/api/vendedores").then((r) => r.json()),
      fetch("/api/admin/niveles").then((r) => r.json()).catch(() => ({ data: [] })),
    ]).then(([v, n]) => {
      setVendedores(v.data ?? [])
      setNiveles(n.data ?? [])
      setLoading(false)
    })
  }, [])

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch("/api/vendedores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, id_nivel: form.id_nivel ? parseInt(form.id_nivel) : null }),
    })
    if (res.ok) {
      const { data } = await res.json()
      setVendedores((prev) => [data, ...prev])
      setModalOpen(false)
      setForm({ nombre: "", telefono: "", email: "", id_nivel: "" })
    }
    setSaving(false)
  }

  function copyLink(v: Vendedor) {
    navigator.clipboard.writeText(`${APP_URL}/r/${v.codigo_unico}`)
    setCopied(v.id)
    setTimeout(() => setCopied(null), 1500)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold" style={{ color: "var(--text)" }}>Vendedores</h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--subtle)" }}>{vendedores.length} vendedores registrados</p>
        </div>
        <Button size="sm" onClick={() => setModalOpen(true)}>
          <Plus size={13} />
          Nuevo vendedor
        </Button>
      </div>

      <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "var(--surface-2)", borderBottom: "1px solid var(--border)" }}>
              {["Vendedor","Código","Nivel","Estado","Acciones"].map((h) => (
                <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wide"
                  style={{ color: "var(--subtle)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={5} className="text-center py-10 text-xs" style={{ color: "var(--subtle)" }}>Cargando...</td></tr>
            )}
            {!loading && vendedores.length === 0 && (
              <tr><td colSpan={5} className="text-center py-12 text-xs" style={{ color: "var(--subtle)" }}>Sin vendedores</td></tr>
            )}
            {vendedores.map((v) => (
              <tr key={v.id} className="border-t hover:bg-[var(--surface-2)] transition-colors"
                style={{ borderColor: "var(--border)" }}>
                <td className="px-4 py-3">
                  <div className="font-medium text-xs" style={{ color: "var(--text)" }}>{v.nombre}</div>
                  <div className="text-xs" style={{ color: "var(--subtle)" }}>{v.email}</div>
                </td>
                <td className="px-4 py-3">
                  <span className="font-mono text-xs font-semibold" style={{ color: "var(--accent)" }}>
                    {v.codigo_unico}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {v.niveles_comision
                    ? <Badge label={`${v.niveles_comision.nombre} — $${v.niveles_comision.monto.toLocaleString("es-MX")}`}
                        color="#059669" bg="#ECFDF5" size="sm" />
                    : <span className="text-xs" style={{ color: "var(--subtle)" }}>Sin nivel</span>
                  }
                </td>
                <td className="px-4 py-3">
                  {v.activo
                    ? <Badge label="Activo" color="#059669" bg="#ECFDF5" size="sm" />
                    : <Badge label="Inactivo" color="#6B7280" bg="#F9FAFB" size="sm" />
                  }
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button onClick={() => copyLink(v)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors hover:bg-[var(--surface-2)]"
                      style={{ color: copied === v.id ? "var(--positive)" : "var(--muted)" }}
                      title="Copiar enlace">
                      {copied === v.id ? <Check size={13} /> : <Copy size={13} />}
                    </button>
                    <button onClick={() => setQrVendedor(v)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors hover:bg-[var(--surface-2)]"
                      style={{ color: "var(--muted)" }} title="Ver QR">
                      <QrCode size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal crear vendedor */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nuevo vendedor">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input label="Nombre completo *" value={form.nombre} onChange={set("nombre")} required />
          <Input label="Teléfono (10 dígitos)" value={form.telefono} onChange={set("telefono")} maxLength={10} />
          <Input label="Email" type="email" value={form.email} onChange={set("email")} />
          <Select label="Nivel de comisión" value={form.id_nivel} onChange={set("id_nivel")}>
            <option value="">Sin nivel</option>
            {niveles.map((n) => (
              <option key={n.id} value={n.id}>{n.nombre} — ${n.monto.toLocaleString("es-MX")} MXN</option>
            ))}
          </Select>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit" loading={saving}>Crear vendedor</Button>
          </div>
        </form>
      </Modal>

      {/* Modal QR */}
      <Modal open={!!qrVendedor} onClose={() => setQrVendedor(null)} title={`QR — ${qrVendedor?.nombre ?? ""}`} size="sm">
        {qrVendedor && (
          <div className="flex flex-col items-center gap-4">
            <div className="p-4 rounded-xl bg-white">
              <QRCode value={`${APP_URL}/r/${qrVendedor.codigo_unico}`} size={200} />
            </div>
            <p className="text-xs font-mono text-center" style={{ color: "var(--muted)" }}>
              {APP_URL}/r/{qrVendedor.codigo_unico}
            </p>
            <Button size="sm" variant="secondary" onClick={() => copyLink(qrVendedor)}>
              <Copy size={12} />
              Copiar enlace
            </Button>
          </div>
        )}
      </Modal>
    </div>
  )
}
