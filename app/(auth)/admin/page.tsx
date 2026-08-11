"use client"
import { useState, useEffect } from "react"
import { Settings, Users, DollarSign, Plus, Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Modal } from "@/components/ui/modal"
import { Input, Select } from "@/components/ui/input"
import { formatMXN } from "@/lib/utils"

interface Nivel { id: number; nombre: string; monto: number; descripcion: string | null; activo: boolean; orden: number }
interface UserProfile { id: string; nombre: string; email: string; rol: string }

const TABS = [
  { key: "usuarios", label: "Usuarios",             icon: Users },
  { key: "niveles",  label: "Niveles de comisión",  icon: DollarSign },
  { key: "sistema",  label: "Sistema",              icon: Settings },
]

const ROL_LABEL: Record<string, string> = {
  admin:        "Administrador",
  gerente:      "Gerente",
  ejecutivo:    "Ejecutivo",
  visualizador: "Visualizador",
}

const ROL_STYLE: Record<string, { color: string; bg: string }> = {
  admin:        { color: "#7C3AED", bg: "#F5F3FF" },
  gerente:      { color: "#2563EB", bg: "#EFF6FF" },
  ejecutivo:    { color: "#0D9488", bg: "#F0FDFA" },
  visualizador: { color: "#6B7280", bg: "#F9FAFB" },
}

export default function AdminPage() {
  const [tab, setTab] = useState("usuarios")
  const [niveles, setNiveles]   = useState<Nivel[]>([])
  const [usuarios, setUsuarios] = useState<UserProfile[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState("")
  const [saving, setSaving]     = useState(false)
  const [deletingNivel, setDeletingNivel] = useState<number | null>(null)

  /* ── Modales ───────────────────────────────── */
  const [modalNuevoUsuario, setModalNuevoUsuario] = useState(false)
  const [modalEditRol,      setModalEditRol]      = useState<UserProfile | null>(null)
  const [modalNuevoNivel,   setModalNuevoNivel]   = useState(false)
  const [modalEditNivel,    setModalEditNivel]    = useState<Nivel | null>(null)

  /* ── Formularios ───────────────────────────── */
  const [usuarioForm, setUsuarioForm]     = useState({ nombre: "", email: "", password: "", rol: "ejecutivo" })
  const [rolEdit,     setRolEdit]         = useState("")
  const [nivelForm,   setNivelForm]       = useState({ nombre: "", monto: "", descripcion: "" })
  const [nivelEditForm, setNivelEditForm] = useState({ nombre: "", monto: "", descripcion: "", activo: true })

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const [n, u] = await Promise.all([
      fetch("/api/admin/niveles").then((r) => r.json()).catch(() => ({ data: [] })),
      fetch("/api/admin/usuarios").then((r) => r.json()).catch(() => ({ data: [] })),
    ])
    setNiveles(n.data ?? [])
    setUsuarios(u.data ?? [])
    setLoading(false)
  }

  /* ── Usuarios ──────────────────────────────── */
  async function crearUsuario(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError("")
    const res = await fetch("/api/admin/usuarios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(usuarioForm),
    })
    const json = await res.json()
    if (res.ok) {
      setUsuarios((p) => [...p, json.data])
      setModalNuevoUsuario(false)
      setUsuarioForm({ nombre: "", email: "", password: "", rol: "ejecutivo" })
    } else { setError(json.error ?? "Error al crear usuario") }
    setSaving(false)
  }

  async function cambiarRol() {
    if (!modalEditRol) return
    setSaving(true); setError("")
    const res = await fetch(`/api/admin/usuarios/${modalEditRol.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rol: rolEdit }),
    })
    if (res.ok) {
      setUsuarios((p) => p.map((u) => u.id === modalEditRol.id ? { ...u, rol: rolEdit } : u))
      setModalEditRol(null)
    } else {
      const json = await res.json(); setError(json.error ?? "Error")
    }
    setSaving(false)
  }

  /* ── Niveles ───────────────────────────────── */
  async function crearNivel(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError("")
    const res = await fetch("/api/admin/niveles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre: nivelForm.nombre, monto: parseFloat(nivelForm.monto), descripcion: nivelForm.descripcion }),
    })
    if (res.ok) {
      const { data } = await res.json()
      setNiveles((p) => [...p, data])
      setModalNuevoNivel(false)
      setNivelForm({ nombre: "", monto: "", descripcion: "" })
    } else { const json = await res.json(); setError(json.error ?? "Error") }
    setSaving(false)
  }

  async function editarNivel(e: React.FormEvent) {
    e.preventDefault()
    if (!modalEditNivel) return
    setSaving(true); setError("")
    const res = await fetch(`/api/admin/niveles/${modalEditNivel.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombre:      nivelEditForm.nombre,
        monto:       parseFloat(nivelEditForm.monto),
        descripcion: nivelEditForm.descripcion || null,
        activo:      nivelEditForm.activo,
      }),
    })
    if (res.ok) {
      const { data } = await res.json()
      setNiveles((p) => p.map((n) => n.id === modalEditNivel.id ? data : n))
      setModalEditNivel(null)
    } else { const json = await res.json(); setError(json.error ?? "Error") }
    setSaving(false)
  }

  async function eliminarNivel(n: Nivel) {
    if (!window.confirm(`¿Eliminar el nivel "${n.nombre}"? Esta acción no se puede deshacer.`)) return
    setDeletingNivel(n.id)
    const res = await fetch(`/api/admin/niveles/${n.id}`, { method: "DELETE" })
    if (res.ok) {
      setNiveles((p) => p.filter((x) => x.id !== n.id))
    } else {
      const json = await res.json()
      setError(json.error ?? "Error al eliminar")
      setTimeout(() => setError(""), 5000)
    }
    setDeletingNivel(null)
  }

  const setU  = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setUsuarioForm((f) => ({ ...f, [k]: e.target.value }))
  const setNF = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setNivelForm((f) => ({ ...f, [k]: e.target.value }))
  const setNE = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setNivelEditForm((f) => ({ ...f, [k]: e.target.value }))

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-semibold" style={{ color: "var(--text)" }}>Administrador</h1>
        <p className="text-xs mt-0.5" style={{ color: "var(--subtle)" }}>Configuración global del sistema</p>
      </div>

      {/* Error global (ej. eliminar nivel con vendedores) */}
      {error && !modalNuevoUsuario && !modalEditRol && !modalNuevoNivel && !modalEditNivel && (
        <div className="p-3 rounded-lg text-xs font-medium"
          style={{ background: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA" }}>
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b" style={{ borderColor: "var(--border)" }}>
        {TABS.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium transition-colors border-b-2"
            style={{
              borderColor: tab === key ? "var(--accent)" : "transparent",
              color:       tab === key ? "var(--accent)" : "var(--muted)",
            }}>
            <Icon size={12} />{label}
          </button>
        ))}
      </div>

      {/* ── USUARIOS ─────────────────────────────── */}
      {tab === "usuarios" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs" style={{ color: "var(--subtle)" }}>
              {usuarios.length} usuario{usuarios.length !== 1 ? "s" : ""} en el sistema
            </p>
            <Button size="sm" onClick={() => { setError(""); setModalNuevoUsuario(true) }}>
              <Plus size={12} />Nuevo usuario
            </Button>
          </div>

          <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: "var(--surface-2)", borderBottom: "1px solid var(--border)" }}>
                  {["Nombre", "Correo electrónico", "Rol", ""].map((h, i) => (
                    <th key={i} className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wide"
                      style={{ color: "var(--subtle)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr><td colSpan={4} className="text-center py-10 text-xs" style={{ color: "var(--subtle)" }}>Cargando...</td></tr>
                )}
                {!loading && usuarios.length === 0 && (
                  <tr><td colSpan={4} className="text-center py-12 text-xs" style={{ color: "var(--subtle)" }}>Sin usuarios registrados</td></tr>
                )}
                {usuarios.map((u) => {
                  const s = ROL_STYLE[u.rol] ?? ROL_STYLE.visualizador
                  return (
                    <tr key={u.id} className="border-t hover:bg-[var(--surface-2)] transition-colors"
                      style={{ borderColor: "var(--border)" }}>
                      <td className="px-4 py-3 text-xs font-medium" style={{ color: "var(--text)" }}>{u.nombre}</td>
                      <td className="px-4 py-3 text-xs font-mono" style={{ color: "var(--muted)" }}>{u.email}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                          style={{ background: s.bg, color: s.color }}>
                          {ROL_LABEL[u.rol] ?? u.rol}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => { setRolEdit(u.rol); setError(""); setModalEditRol(u) }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs transition-colors hover:bg-[var(--surface-2)]"
                          style={{ color: "var(--muted)" }}>
                          <Pencil size={11} />Editar rol
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Guía de roles */}
          <div className="rounded-xl border p-4 space-y-3" style={{ background: "#FFFBEB", borderColor: "#FDE68A" }}>
            <p className="text-xs font-semibold" style={{ color: "#92400E" }}>Roles del sistema</p>
            <div className="grid grid-cols-2 gap-y-2 gap-x-6">
              {[
                { rol: "admin",        desc: "Acceso total — sin restricciones" },
                { rol: "gerente",      desc: "Lee y escribe todos los leads; no configura sistema" },
                { rol: "ejecutivo",    desc: "Solo ve/edita sus leads asignados + nuevos sin asignar" },
                { rol: "visualizador", desc: "Solo lectura en toda la plataforma" },
              ].map(({ rol, desc }) => {
                const s = ROL_STYLE[rol]
                return (
                  <div key={rol} className="flex items-start gap-2">
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium shrink-0 mt-0.5"
                      style={{ background: s.bg, color: s.color }}>{ROL_LABEL[rol]}</span>
                    <span className="text-xs leading-relaxed" style={{ color: "#78350F" }}>{desc}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── NIVELES ──────────────────────────────── */}
      {tab === "niveles" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs" style={{ color: "var(--subtle)" }}>
              {niveles.length} nivel{niveles.length !== 1 ? "es" : ""} configurado{niveles.length !== 1 ? "s" : ""}
            </p>
            <Button size="sm" onClick={() => { setError(""); setModalNuevoNivel(true) }}>
              <Plus size={12} />Nuevo nivel
            </Button>
          </div>

          {loading && <div className="text-center py-10 text-xs" style={{ color: "var(--subtle)" }}>Cargando...</div>}

          <div className="grid grid-cols-3 gap-4">
            {niveles.map((n) => (
              <div key={n.id} className="rounded-xl border p-4 space-y-3 transition-opacity"
                style={{ background: "var(--surface)", borderColor: "var(--border)", opacity: n.activo ? 1 : 0.55 }}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>{n.nombre}</p>
                    <span className="inline-flex text-xs px-2 py-0.5 rounded-full font-medium mt-1"
                      style={{ background: n.activo ? "#ECFDF5" : "#F9FAFB", color: n.activo ? "#059669" : "#6B7280" }}>
                      {n.activo ? "Activo" : "Inactivo"}
                    </span>
                  </div>
                  <div className="flex items-center gap-0.5 shrink-0">
                    <button
                      onClick={() => {
                        setNivelEditForm({ nombre: n.nombre, monto: String(n.monto), descripcion: n.descripcion ?? "", activo: n.activo })
                        setError(""); setModalEditNivel(n)
                      }}
                      className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors hover:bg-[var(--surface-2)]"
                      style={{ color: "var(--muted)" }}
                      title="Editar">
                      <Pencil size={12} />
                    </button>
                    <button
                      onClick={() => eliminarNivel(n)}
                      disabled={deletingNivel === n.id}
                      className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors"
                      style={{
                        color: deletingNivel === n.id ? "var(--subtle)" : "#DC2626",
                        background: "transparent",
                      }}
                      title="Eliminar">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>

                <div>
                  <div className="text-2xl font-bold tabular-nums" style={{ color: "var(--accent)" }}>
                    {formatMXN(n.monto)}
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: "var(--subtle)" }}>por conversión exitosa</p>
                </div>

                {n.descripcion && (
                  <p className="text-xs" style={{ color: "var(--muted)" }}>{n.descripcion}</p>
                )}
              </div>
            ))}
          </div>

          {!loading && niveles.length === 0 && (
            <div className="rounded-xl border border-dashed p-10 text-center" style={{ borderColor: "var(--border)" }}>
              <p className="text-sm font-medium" style={{ color: "var(--muted)" }}>Sin niveles de comisión</p>
              <p className="text-xs mt-1" style={{ color: "var(--subtle)" }}>Crea el primer nivel para comenzar a asignarlo a vendedores</p>
            </div>
          )}
        </div>
      )}

      {/* ── SISTEMA ──────────────────────────────── */}
      {tab === "sistema" && (
        <div className="rounded-xl border p-6 space-y-4" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <h2 className="text-sm font-semibold" style={{ color: "var(--text)" }}>Información del sistema</h2>
          <div className="grid grid-cols-2 gap-4 text-xs">
            {[
              { label: "Versión",           value: "Leads GMM v1.0" },
              { label: "Propietario",       value: "Alejandro Legorreta Barrera" },
              { label: "Licencia",          value: "Activa", mono: true, positive: true },
              { label: "Prefijo de códigos", value: process.env.NEXT_PUBLIC_VENDOR_CODE_PREFIX ?? "GMM", mono: true },
            ].map(({ label, value, mono, positive }) => (
              <div key={label}>
                <p className="font-medium mb-0.5" style={{ color: "var(--muted)" }}>{label}</p>
                <p className={mono ? "font-mono" : ""} style={{ color: positive ? "#059669" : "var(--text)" }}>{value}</p>
              </div>
            ))}
          </div>
          <div className="p-3 rounded-lg text-xs leading-relaxed" style={{ background: "var(--surface-2)", color: "var(--subtle)" }}>
            Este software es propiedad exclusiva de Alejandro Legorreta Barrera. No puede ser comercializado,
            trasladado, replicado ni vendido sin acuerdo legal firmado por el propietario.
          </div>
        </div>
      )}

      {/* ── Modal: Nuevo usuario ─────────────────── */}
      <Modal open={modalNuevoUsuario} onClose={() => setModalNuevoUsuario(false)} title="Nuevo usuario" size="sm">
        <form onSubmit={crearUsuario} className="space-y-4">
          {error && (
            <div className="p-2 rounded-lg text-xs" style={{ background: "#FEF2F2", color: "#DC2626" }}>{error}</div>
          )}
          <Input label="Nombre completo *" value={usuarioForm.nombre} onChange={setU("nombre")} required />
          <Input label="Correo electrónico *" type="email" value={usuarioForm.email} onChange={setU("email")} required />
          <Input label="Contraseña temporal *" type="password" value={usuarioForm.password}
            onChange={setU("password")} placeholder="Mínimo 8 caracteres" required />
          <Select label="Rol *" value={usuarioForm.rol} onChange={setU("rol")}>
            <option value="ejecutivo">Ejecutivo</option>
            <option value="gerente">Gerente</option>
            <option value="visualizador">Visualizador</option>
            <option value="admin">Administrador</option>
          </Select>
          <p className="text-xs" style={{ color: "var(--subtle)" }}>
            El usuario puede cambiar su contraseña desde su perfil en el primer inicio de sesión.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalNuevoUsuario(false)}>Cancelar</Button>
            <Button type="submit" loading={saving}>Crear usuario</Button>
          </div>
        </form>
      </Modal>

      {/* ── Modal: Editar rol ─────────────────────── */}
      <Modal open={!!modalEditRol} onClose={() => setModalEditRol(null)} title="Cambiar rol" size="sm">
        {modalEditRol && (
          <div className="space-y-4">
            {error && (
              <div className="p-2 rounded-lg text-xs" style={{ background: "#FEF2F2", color: "#DC2626" }}>{error}</div>
            )}
            <div className="p-3 rounded-lg" style={{ background: "var(--surface-2)" }}>
              <p className="text-sm font-medium" style={{ color: "var(--text)" }}>{modalEditRol.nombre}</p>
              <p className="text-xs font-mono mt-0.5" style={{ color: "var(--muted)" }}>{modalEditRol.email}</p>
            </div>
            <Select label="Nuevo rol" value={rolEdit}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setRolEdit(e.target.value)}>
              <option value="ejecutivo">Ejecutivo</option>
              <option value="gerente">Gerente</option>
              <option value="visualizador">Visualizador</option>
              <option value="admin">Administrador</option>
            </Select>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setModalEditRol(null)}>Cancelar</Button>
              <Button onClick={cambiarRol} loading={saving}>Guardar</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Modal: Nuevo nivel ───────────────────── */}
      <Modal open={modalNuevoNivel} onClose={() => setModalNuevoNivel(false)} title="Nuevo nivel de comisión" size="sm">
        <form onSubmit={crearNivel} className="space-y-4">
          {error && (
            <div className="p-2 rounded-lg text-xs" style={{ background: "#FEF2F2", color: "#DC2626" }}>{error}</div>
          )}
          <Input label="Nombre del nivel *" value={nivelForm.nombre} onChange={setNF("nombre")}
            placeholder="Ej: Estándar, Premium, Elite" required />
          <Input label="Monto fijo (MXN) *" type="number" min="0" step="0.01" value={nivelForm.monto}
            onChange={setNF("monto")} placeholder="500.00" required />
          <Input label="Descripción (opcional)" value={nivelForm.descripcion} onChange={setNF("descripcion")} />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalNuevoNivel(false)}>Cancelar</Button>
            <Button type="submit" loading={saving}>Crear nivel</Button>
          </div>
        </form>
      </Modal>

      {/* ── Modal: Editar nivel ──────────────────── */}
      <Modal open={!!modalEditNivel} onClose={() => setModalEditNivel(null)} title="Editar nivel de comisión" size="sm">
        <form onSubmit={editarNivel} className="space-y-4">
          {error && (
            <div className="p-2 rounded-lg text-xs" style={{ background: "#FEF2F2", color: "#DC2626" }}>{error}</div>
          )}
          <Input label="Nombre del nivel *" value={nivelEditForm.nombre} onChange={setNE("nombre")} required />
          <Input label="Monto fijo (MXN) *" type="number" min="0" step="0.01" value={nivelEditForm.monto}
            onChange={setNE("monto")} required />
          <Input label="Descripción (opcional)" value={nivelEditForm.descripcion} onChange={setNE("descripcion")} />
          <label className="flex items-center gap-2 cursor-pointer select-none" style={{ color: "var(--muted)" }}>
            <input
              type="checkbox"
              checked={nivelEditForm.activo}
              onChange={(e) => setNivelEditForm((f) => ({ ...f, activo: e.target.checked }))}
            />
            <span className="text-xs">Nivel activo (visible para asignación a vendedores)</span>
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalEditNivel(null)}>Cancelar</Button>
            <Button type="submit" loading={saving}>Guardar cambios</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
