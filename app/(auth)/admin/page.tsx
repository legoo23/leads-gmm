"use client"
import { useState, useEffect } from "react"
import { Settings, Users, DollarSign, Plus, Pencil, Trash2, UserX, UserCheck, BarChart2, Star, Eye, EyeOff, Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Modal } from "@/components/ui/modal"
import { Input, Select } from "@/components/ui/input"
import { formatMXN } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"

interface Nivel { id: number; nombre: string; monto: number; descripcion: string | null; activo: boolean; orden: number }
interface UserProfile { id: string; nombre: string; email: string; rol: string; activo: boolean }
interface Aseguradora { id: number; nombre: string; nombre_corto: string | null; activo: boolean }

const TABS = [
  { key: "usuarios",      label: "Usuarios",             icon: Users },
  { key: "niveles",       label: "Niveles de comisión",  icon: DollarSign },
  { key: "aseguradoras",  label: "Aseguradoras",         icon: Building2 },
  { key: "reportes",      label: "Reportes",             icon: BarChart2 },
  { key: "testimonios",   label: "Testimonios",          icon: Star },
  { key: "sistema",       label: "Sistema",              icon: Settings },
]

const ETAPA_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  nuevo:                  { label: "Nuevo",               color: "#2563EB", bg: "#DBEAFE" },
  contactado:             { label: "Contactado",           color: "#7C3AED", bg: "#EDE9FE" },
  necesidad_identificada: { label: "Necesidad ID",         color: "#D97706", bg: "#FEF3C7" },
  seguro_identificado:    { label: "Seguro ID",            color: "#0891B2", bg: "#CFFAFE" },
  en_validacion:          { label: "En validación",        color: "#EA580C", bg: "#FFEDD5" },
  viable:                 { label: "Viable",               color: "#16A34A", bg: "#DCFCE7" },
  programado:             { label: "Programado",           color: "#0D9488", bg: "#CCFBF1" },
  ganado:                 { label: "Ganado ✅",            color: "#059669", bg: "#ECFDF5" },
  no_viable:              { label: "No viable",            color: "#DC2626", bg: "#FEE2E2" },
  perdido:                { label: "Perdido",              color: "#6B7280", bg: "#F3F4F6" },
}

const PIPELINE_ORDER = [
  "nuevo","contactado","necesidad_identificada","seguro_identificado",
  "en_validacion","viable","programado","ganado","no_viable","perdido",
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
  const [togglingUsuario, setTogglingUsuario] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  /* ── Reportes ─────────────────────────────── */
  interface LeadStats {
    total: number; ganados: number; cerrados: number; activos: number
    esta_semana: number; semana_pasada: number
    por_etapa: Record<string, number>; por_fuente: Record<string, number>
  }
  interface ComisionItem { id: number; monto: number; estado: string }
  const [rptLeads, setRptLeads]         = useState<LeadStats | null>(null)
  const [rptComisiones, setRptComisiones] = useState<ComisionItem[]>([])
  const [loadingRpt, setLoadingRpt]     = useState(false)
  const [rptLoaded, setRptLoaded]       = useState(false)

  /* ── Testimonios ───────────────────────────── */
  interface Testimonio { id: number; nombre: string; detalle: string | null; texto: string; estrellas: number; activo: boolean; orden: number }
  const [testimonios,    setTestimonios]    = useState<Testimonio[]>([])
  const [tstLoaded,      setTstLoaded]      = useState(false)
  const [tstLoading,     setTstLoading]     = useState(false)
  const [tstModal,       setTstModal]       = useState<"nuevo" | Testimonio | null>(null)
  const [tstForm,        setTstForm]        = useState({ nombre: "", detalle: "", texto: "", estrellas: "5", orden: "0", activo: true })
  const [tstTogglingId,  setTstTogglingId]  = useState<number | null>(null)
  const [tstDeletingId,  setTstDeletingId]  = useState<number | null>(null)

  /* ── Aseguradoras ─────────────────────────── */
  const [aseguradoras,      setAseguradoras]      = useState<Aseguradora[]>([])
  const [asgLoaded,         setAsgLoaded]         = useState(false)
  const [asgLoading,        setAsgLoading]        = useState(false)
  const [asgModal,          setAsgModal]          = useState<"nuevo" | Aseguradora | null>(null)
  const [asgForm,           setAsgForm]           = useState({ nombre: "", nombre_corto: "" })
  const [asgTogglingId,     setAsgTogglingId]     = useState<number | null>(null)

  /* ── Modales ───────────────────────────────── */
  const [modalNuevoUsuario, setModalNuevoUsuario] = useState(false)
  const [modalEditRol,      setModalEditRol]      = useState<UserProfile | null>(null)
  const [modalNuevoNivel,   setModalNuevoNivel]   = useState(false)
  const [modalEditNivel,    setModalEditNivel]    = useState<Nivel | null>(null)

  /* ── Formularios ───────────────────────────── */
  const [usuarioForm, setUsuarioForm]     = useState({ nombre: "", email: "", rol: "ejecutivo" })
  const [rolEdit,     setRolEdit]         = useState("")
  const [nivelForm,   setNivelForm]       = useState({ nombre: "", monto: "", descripcion: "" })
  const [nivelEditForm, setNivelEditForm] = useState({ nombre: "", monto: "", descripcion: "", activo: true })

  useEffect(() => {
    load()
    createClient().auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id ?? null))
  }, [])

  useEffect(() => {
    if (tab === "reportes"      && !rptLoaded) loadReportes()
    if (tab === "testimonios"   && !tstLoaded) loadTestimonios()
    if (tab === "aseguradoras"  && !asgLoaded) loadAseguradoras()
  }, [tab]) // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Aseguradoras ──────────────────────────── */
  async function loadAseguradoras() {
    setAsgLoading(true)
    const r = await fetch("/api/admin/aseguradoras").then((x) => x.json()).catch(() => ({ data: [] }))
    setAseguradoras(r.data ?? [])
    setAsgLoaded(true)
    setAsgLoading(false)
  }

  function openNuevaAsg() {
    setAsgForm({ nombre: "", nombre_corto: "" })
    setError(""); setAsgModal("nuevo")
  }

  function openEditAsg(a: Aseguradora) {
    setAsgForm({ nombre: a.nombre, nombre_corto: a.nombre_corto ?? "" })
    setError(""); setAsgModal(a)
  }

  async function guardarAsg(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError("")
    const nombre = asgForm.nombre.trim().toUpperCase()
    if (!nombre) { setError("El nombre es requerido"); setSaving(false); return }

    const esNueva = asgModal === "nuevo"
    const url     = esNueva ? "/api/admin/aseguradoras" : `/api/admin/aseguradoras/${(asgModal as Aseguradora).id}`
    const method  = esNueva ? "POST" : "PATCH"

    const res = await fetch(url, {
      method, headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre, nombre_corto: asgForm.nombre_corto.trim().toUpperCase() || null }),
    })
    const json = await res.json()
    if (res.ok) {
      if (esNueva) setAseguradoras((p) => [...p, json.data].sort((a, b) => a.nombre.localeCompare(b.nombre)))
      else         setAseguradoras((p) => p.map((x) => x.id === (asgModal as Aseguradora).id ? json.data : x))
      setAsgModal(null)
    } else { setError(json.error ?? "Error al guardar") }
    setSaving(false)
  }

  async function toggleAsgActivo(a: Aseguradora) {
    setAsgTogglingId(a.id)
    const res = await fetch(`/api/admin/aseguradoras/${a.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activo: !a.activo }),
    })
    if (res.ok) setAseguradoras((p) => p.map((x) => x.id === a.id ? { ...x, activo: !a.activo } : x))
    setAsgTogglingId(null)
  }

  async function loadReportes() {
    setLoadingRpt(true)
    const [lr, cr] = await Promise.all([
      fetch("/api/leads/stats").then((r) => r.json()).catch(() => null),
      fetch("/api/comisiones?limit=1000").then((r) => r.json()).catch(() => ({ data: [] })),
    ])
    setRptLeads(lr ?? null)
    setRptComisiones(cr.data ?? [])
    setRptLoaded(true)
    setLoadingRpt(false)
  }

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

  /* ── Testimonios ──────────────────────────── */
  async function loadTestimonios() {
    setTstLoading(true)
    const r = await fetch("/api/admin/testimonios").then((x) => x.json()).catch(() => ({ data: [] }))
    setTestimonios(r.data ?? [])
    setTstLoaded(true)
    setTstLoading(false)
  }

  function openNuevoTst() {
    setTstForm({ nombre: "", detalle: "", texto: "", estrellas: "5", orden: "0", activo: true })
    setError(""); setTstModal("nuevo")
  }

  function openEditTst(t: Testimonio) {
    setTstForm({ nombre: t.nombre, detalle: t.detalle ?? "", texto: t.texto, estrellas: String(t.estrellas), orden: String(t.orden), activo: t.activo })
    setError(""); setTstModal(t)
  }

  async function guardarTst(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError("")
    const payload = {
      nombre:    tstForm.nombre.trim(),
      detalle:   tstForm.detalle.trim() || null,
      texto:     tstForm.texto.trim(),
      estrellas: Number(tstForm.estrellas),
      orden:     Number(tstForm.orden),
      activo:    tstForm.activo,
    }
    if (!payload.nombre || !payload.texto) { setError("Nombre y texto son requeridos"); setSaving(false); return }

    const esNuevo = tstModal === "nuevo"
    const url     = esNuevo ? "/api/admin/testimonios" : `/api/admin/testimonios/${(tstModal as Testimonio).id}`
    const method  = esNuevo ? "POST" : "PATCH"

    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
    const json = await res.json()
    if (res.ok) {
      if (esNuevo) setTestimonios((p) => [...p, json.data].sort((a, b) => a.orden - b.orden || a.id - b.id))
      else         setTestimonios((p) => p.map((x) => x.id === (tstModal as Testimonio).id ? json.data : x))
      setTstModal(null)
    } else { setError(json.error ?? "Error al guardar") }
    setSaving(false)
  }

  async function toggleTstActivo(t: Testimonio) {
    setTstTogglingId(t.id)
    const res = await fetch(`/api/admin/testimonios/${t.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activo: !t.activo }),
    })
    if (res.ok) setTestimonios((p) => p.map((x) => x.id === t.id ? { ...x, activo: !t.activo } : x))
    setTstTogglingId(null)
  }

  async function eliminarTst(t: Testimonio) {
    if (!window.confirm(`¿Eliminar el testimonio de "${t.nombre}"?`)) return
    setTstDeletingId(t.id)
    const res = await fetch(`/api/admin/testimonios/${t.id}`, { method: "DELETE" })
    if (res.ok) setTestimonios((p) => p.filter((x) => x.id !== t.id))
    else { const j = await res.json(); setError(j.error ?? "Error al eliminar"); setTimeout(() => setError(""), 5000) }
    setTstDeletingId(null)
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
      setUsuarioForm({ nombre: "", email: "", rol: "ejecutivo" })
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

  async function toggleActivo(u: UserProfile) {
    const accion = u.activo ? "dar de baja" : "reactivar"
    if (!window.confirm(`¿Seguro que deseas ${accion} a ${u.nombre}?`)) return
    setTogglingUsuario(u.id)
    const res = await fetch(`/api/admin/usuarios/${u.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activo: !u.activo }),
    })
    if (res.ok) {
      setUsuarios((p) => p.map((x) => x.id === u.id ? { ...x, activo: !u.activo } : x))
    } else {
      const json = await res.json()
      setError(json.error ?? "Error al cambiar estado")
      setTimeout(() => setError(""), 5000)
    }
    setTogglingUsuario(null)
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
                  {["Nombre", "Correo electrónico", "Rol", "Estado", ""].map((h, i) => (
                    <th key={i} className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wide"
                      style={{ color: "var(--subtle)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr><td colSpan={5} className="text-center py-10 text-xs" style={{ color: "var(--subtle)" }}>Cargando...</td></tr>
                )}
                {!loading && usuarios.length === 0 && (
                  <tr><td colSpan={5} className="text-center py-12 text-xs" style={{ color: "var(--subtle)" }}>Sin usuarios registrados</td></tr>
                )}
                {usuarios.map((u) => {
                  const s = ROL_STYLE[u.rol] ?? ROL_STYLE.visualizador
                  const esSelf = u.id === currentUserId
                  return (
                    <tr key={u.id} className="border-t transition-colors"
                      style={{
                        borderColor: "var(--border)",
                        background: u.activo ? undefined : "rgba(220,38,38,.03)",
                        opacity: u.activo ? 1 : 0.7,
                      }}>
                      <td className="px-4 py-3 text-xs font-medium" style={{ color: "var(--text)" }}>{u.nombre}</td>
                      <td className="px-4 py-3 text-xs font-mono" style={{ color: "var(--muted)" }}>{u.email}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                          style={{ background: s.bg, color: s.color }}>
                          {ROL_LABEL[u.rol] ?? u.rol}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                          style={{
                            background: u.activo ? "#ECFDF5" : "#FEF2F2",
                            color:      u.activo ? "#059669" : "#DC2626",
                          }}>
                          {u.activo ? "Activo" : "De baja"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => { setRolEdit(u.rol); setError(""); setModalEditRol(u) }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs transition-colors hover:bg-[var(--surface-2)]"
                            style={{ color: "var(--muted)" }}>
                            <Pencil size={11} />Editar rol
                          </button>
                          {!esSelf && (
                            <button
                              onClick={() => toggleActivo(u)}
                              disabled={togglingUsuario === u.id}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs transition-colors hover:bg-[var(--surface-2)] disabled:opacity-40"
                              style={{ color: u.activo ? "#DC2626" : "#059669" }}>
                              {u.activo
                                ? <><UserX size={11} />Dar de baja</>
                                : <><UserCheck size={11} />Reactivar</>}
                            </button>
                          )}
                        </div>
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

      {/* ── ASEGURADORAS ─────────────────────────── */}
      {tab === "aseguradoras" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs" style={{ color: "var(--subtle)" }}>
              {aseguradoras.filter((a) => a.activo).length} activas · {aseguradoras.length} total
            </p>
            <Button size="sm" onClick={openNuevaAsg}>
              <Plus size={12} />Nueva aseguradora
            </Button>
          </div>

          {asgLoading && <div className="text-center py-10 text-xs" style={{ color: "var(--subtle)" }}>Cargando...</div>}

          {!asgLoading && aseguradoras.length === 0 && (
            <div className="rounded-xl border border-dashed p-10 text-center" style={{ borderColor: "var(--border)" }}>
              <p className="text-sm font-medium" style={{ color: "var(--muted)" }}>Sin aseguradoras registradas</p>
              <p className="text-xs mt-1" style={{ color: "var(--subtle)" }}>Agrega las aseguradoras GMM que manejará el sistema</p>
            </div>
          )}

          {aseguradoras.length > 0 && (
            <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: "var(--surface-2)", borderBottom: "1px solid var(--border)" }}>
                    {["Nombre", "Nombre corto", "Estado", ""].map((h, i) => (
                      <th key={i} className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wide"
                        style={{ color: "var(--subtle)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {aseguradoras.map((a) => (
                    <tr key={a.id} className="border-t transition-colors"
                      style={{ borderColor: "var(--border)", opacity: a.activo ? 1 : 0.55 }}>
                      <td className="px-4 py-3 text-xs font-medium" style={{ color: "var(--text)" }}>{a.nombre}</td>
                      <td className="px-4 py-3 text-xs" style={{ color: "var(--muted)" }}>{a.nombre_corto ?? "—"}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                          style={{ background: a.activo ? "#ECFDF5" : "#F3F4F6", color: a.activo ? "#059669" : "#6B7280" }}>
                          {a.activo ? "Activa" : "Inactiva"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openEditAsg(a)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs transition-colors hover:bg-[var(--surface-2)]"
                            style={{ color: "var(--muted)" }}>
                            <Pencil size={11} />Editar
                          </button>
                          <button
                            onClick={() => toggleAsgActivo(a)}
                            disabled={asgTogglingId === a.id}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs transition-colors hover:bg-[var(--surface-2)] disabled:opacity-40"
                            style={{ color: a.activo ? "#D97706" : "#059669" }}>
                            {a.activo ? <><EyeOff size={11} />Desactivar</> : <><Eye size={11} />Activar</>}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="rounded-lg p-3 text-xs" style={{ background: "#EFF6FF", color: "#1D4ED8", border: "1px solid #BFDBFE" }}>
            Las aseguradoras activas aparecen en el formulario de captura del QR.
            Las inactivas se conservan en el historial de leads pero no se muestran a nuevos prospectos.
          </div>
        </div>
      )}

      {/* ── REPORTES ─────────────────────────────── */}
      {tab === "reportes" && (
        <div className="space-y-6">
          {loadingRpt && (
            <div className="text-center py-12 text-xs" style={{ color: "var(--subtle)" }}>Cargando reportes...</div>
          )}

          {!loadingRpt && rptLeads && (() => {
            const tasa = rptLeads.cerrados > 0
              ? ((rptLeads.ganados / rptLeads.cerrados) * 100).toFixed(1)
              : "0.0"

            const comPor = rptComisiones.reduce<Record<string, number>>((acc, c) => {
              acc[c.estado] = (acc[c.estado] ?? 0) + Number(c.monto)
              return acc
            }, {})

            const etapas = PIPELINE_ORDER.map((k) => ({ key: k, count: rptLeads.por_etapa[k] ?? 0 }))
            const maxEtapa = Math.max(...etapas.map((e) => e.count), 1)

            const fuentes = Object.entries(rptLeads.por_fuente)
              .sort(([, a], [, b]) => b - a)
              .map(([fuente, count]) => ({ fuente, count }))

            return (
              <>
                {/* KPI tiles */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: "Total leads",    value: rptLeads.total,       color: "#2563EB", bg: "#EFF6FF" },
                    { label: "Leads activos",  value: rptLeads.activos,     color: "#D97706", bg: "#FFFBEB" },
                    { label: "Convertidos",    value: rptLeads.ganados,     color: "#059669", bg: "#ECFDF5" },
                    { label: "Tasa de conv.",  value: `${tasa}%`,           color: "#7C3AED", bg: "#F5F3FF" },
                  ].map(({ label, value, color, bg }) => (
                    <div key={label} className="rounded-xl border p-4"
                      style={{ background: bg, borderColor: "var(--border)" }}>
                      <div className="text-2xl font-bold tabular-nums" style={{ color }}>{value}</div>
                      <div className="text-xs mt-0.5" style={{ color }}>{label}</div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* Embudo por etapa */}
                  <div className="rounded-xl border p-4 space-y-3"
                    style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
                    <h3 className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--subtle)" }}>
                      Embudo por etapa
                    </h3>
                    <div className="space-y-2">
                      {etapas.map(({ key, count }) => {
                        const meta = ETAPA_LABELS[key]
                        const pct  = (count / maxEtapa) * 100
                        return (
                          <div key={key} className="space-y-0.5">
                            <div className="flex items-center justify-between">
                              <span className="text-xs" style={{ color: "var(--text)" }}>
                                {meta?.label ?? key}
                              </span>
                              <span className="text-xs font-semibold tabular-nums"
                                style={{ color: meta?.color ?? "var(--muted)" }}>
                                {count}
                              </span>
                            </div>
                            <div className="h-1.5 rounded-full" style={{ background: "var(--surface-2)" }}>
                              <div className="h-1.5 rounded-full transition-all duration-500"
                                style={{
                                  width: `${pct}%`,
                                  background: meta?.color ?? "var(--accent)",
                                  minWidth: count > 0 ? 4 : 0,
                                }} />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Panel derecho: por fuente + comisiones */}
                  <div className="space-y-4">
                    {/* Por fuente */}
                    <div className="rounded-xl border p-4 space-y-3"
                      style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
                      <h3 className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--subtle)" }}>
                        Leads por fuente
                      </h3>
                      {fuentes.length === 0 ? (
                        <p className="text-xs" style={{ color: "var(--subtle)" }}>Sin datos</p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {fuentes.map(({ fuente, count }) => (
                            <span key={fuente}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                              style={{ background: "var(--surface-2)", color: "var(--muted)" }}>
                              <span className="font-semibold" style={{ color: "var(--text)" }}>{count}</span>
                              {fuente}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Comisiones resumen */}
                    <div className="rounded-xl border p-4 space-y-3"
                      style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
                      <h3 className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--subtle)" }}>
                        Comisiones ({rptComisiones.length} registros)
                      </h3>
                      <div className="space-y-2">
                        {[
                          { estado: "pendiente", label: "Pendientes",  color: "#D97706", bg: "#FFFBEB" },
                          { estado: "aprobada",  label: "Aprobadas",   color: "#2563EB", bg: "#EFF6FF" },
                          { estado: "pagada",    label: "Pagadas",     color: "#059669", bg: "#ECFDF5" },
                          { estado: "cancelada", label: "Canceladas",  color: "#6B7280", bg: "#F3F4F6" },
                        ].map(({ estado, label, color, bg }) => {
                          const total = comPor[estado] ?? 0
                          if (total === 0 && !rptComisiones.some((c) => c.estado === estado)) return null
                          return (
                            <div key={estado} className="flex items-center justify-between px-3 py-2 rounded-lg"
                              style={{ background: bg }}>
                              <span className="text-xs font-medium" style={{ color }}>{label}</span>
                              <span className="text-xs font-bold tabular-nums" style={{ color }}>
                                {total.toLocaleString("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 0 })}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Semana vs semana */}
                <div className="rounded-xl border p-4"
                  style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
                  <div className="flex items-center gap-6">
                    <div>
                      <div className="text-xs" style={{ color: "var(--subtle)" }}>Esta semana</div>
                      <div className="text-xl font-bold tabular-nums" style={{ color: "var(--text)" }}>
                        {rptLeads.esta_semana}
                      </div>
                    </div>
                    <div className="text-xl" style={{ color: "var(--border)" }}>vs</div>
                    <div>
                      <div className="text-xs" style={{ color: "var(--subtle)" }}>Semana pasada</div>
                      <div className="text-xl font-bold tabular-nums" style={{ color: "var(--muted)" }}>
                        {rptLeads.semana_pasada}
                      </div>
                    </div>
                    {rptLeads.semana_pasada > 0 && (() => {
                      const delta = rptLeads.esta_semana - rptLeads.semana_pasada
                      const pct   = ((delta / rptLeads.semana_pasada) * 100).toFixed(0)
                      const pos   = delta >= 0
                      return (
                        <div className="ml-auto px-3 py-1.5 rounded-lg text-sm font-bold"
                          style={{ background: pos ? "#ECFDF5" : "#FEF2F2", color: pos ? "#059669" : "#DC2626" }}>
                          {pos ? "+" : ""}{pct}%
                        </div>
                      )
                    })()}
                  </div>
                </div>

                <div className="flex justify-end">
                  <button onClick={loadReportes} className="text-xs" style={{ color: "var(--accent)" }}>
                    Actualizar datos
                  </button>
                </div>
              </>
            )
          })()}
        </div>
      )}

      {/* ── TESTIMONIOS ──────────────────────────── */}
      {tab === "testimonios" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs" style={{ color: "var(--subtle)" }}>
                Testimonios visibles en la página principal · {testimonios.filter((t) => t.activo).length} activos
              </p>
            </div>
            <Button size="sm" onClick={openNuevoTst}>
              <Plus size={12} />Nuevo testimonio
            </Button>
          </div>

          {tstLoading && <div className="text-center py-10 text-xs" style={{ color: "var(--subtle)" }}>Cargando...</div>}

          {!tstLoading && testimonios.length === 0 && (
            <div className="rounded-xl border border-dashed p-10 text-center" style={{ borderColor: "var(--border)" }}>
              <p className="text-sm font-medium" style={{ color: "var(--muted)" }}>Sin testimonios</p>
              <p className="text-xs mt-1" style={{ color: "var(--subtle)" }}>Agrega el primero para que aparezca en la landing page</p>
            </div>
          )}

          {testimonios.length > 0 && (
            <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: "var(--surface-2)", borderBottom: "1px solid var(--border)" }}>
                    {["Orden", "Nombre", "Detalle", "Calificación", "Estado", ""].map((h, i) => (
                      <th key={i} className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wide"
                        style={{ color: "var(--subtle)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {testimonios.map((t) => (
                    <tr key={t.id} className="border-t transition-colors"
                      style={{ borderColor: "var(--border)", opacity: t.activo ? 1 : 0.55 }}>
                      <td className="px-4 py-3 text-xs font-mono tabular-nums w-12" style={{ color: "var(--muted)" }}>{t.orden}</td>
                      <td className="px-4 py-3">
                        <div className="text-xs font-medium" style={{ color: "var(--text)" }}>{t.nombre}</div>
                        <div className="text-xs mt-0.5 line-clamp-2 max-w-xs" style={{ color: "var(--subtle)" }}>{t.texto}</div>
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: "var(--muted)" }}>{t.detalle ?? "—"}</td>
                      <td className="px-4 py-3 text-sm" style={{ color: "#F59E0B" }}>
                        {"★".repeat(t.estrellas)}{"☆".repeat(5 - t.estrellas)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                          style={{ background: t.activo ? "#ECFDF5" : "#F3F4F6", color: t.activo ? "#059669" : "#6B7280" }}>
                          {t.activo ? "Visible" : "Oculto"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openEditTst(t)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs transition-colors hover:bg-[var(--surface-2)]"
                            style={{ color: "var(--muted)" }}>
                            <Pencil size={11} />Editar
                          </button>
                          <button
                            onClick={() => toggleTstActivo(t)}
                            disabled={tstTogglingId === t.id}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs transition-colors hover:bg-[var(--surface-2)] disabled:opacity-40"
                            style={{ color: t.activo ? "#D97706" : "#059669" }}>
                            {t.activo ? <><EyeOff size={11} />Ocultar</> : <><Eye size={11} />Mostrar</>}
                          </button>
                          <button
                            onClick={() => eliminarTst(t)}
                            disabled={tstDeletingId === t.id}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs transition-colors disabled:opacity-40"
                            style={{ color: "#DC2626" }}>
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="rounded-lg p-3 text-xs" style={{ background: "#EFF6FF", color: "#1D4ED8", border: "1px solid #BFDBFE" }}>
            <strong>Orden:</strong> número más bajo aparece primero en la landing.
            Los testimonios <strong>ocultos</strong> no aparecen en la página pública pero se conservan en la base de datos.
          </div>
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
          <Select label="Rol *" value={usuarioForm.rol} onChange={setU("rol")}>
            <option value="ejecutivo">Ejecutivo</option>
            <option value="gerente">Gerente</option>
            <option value="visualizador">Visualizador</option>
            <option value="admin">Administrador</option>
          </Select>
          <div className="p-3 rounded-lg text-xs leading-relaxed" style={{ background: "#EFF6FF", color: "#1D4ED8" }}>
            El usuario recibirá un correo con un enlace para establecer su propia contraseña.
            El enlace es válido por 24 horas.
          </div>
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

      {/* ── Modal: Nueva / Editar aseguradora ───── */}
      <Modal
        open={asgModal !== null}
        onClose={() => setAsgModal(null)}
        title={asgModal === "nuevo" ? "Nueva aseguradora" : "Editar aseguradora"}
        size="sm">
        <form onSubmit={guardarAsg} className="space-y-4">
          {error && (
            <div className="p-2 rounded-lg text-xs" style={{ background: "#FEF2F2", color: "#DC2626" }}>{error}</div>
          )}
          <Input
            label="Nombre completo *"
            value={asgForm.nombre}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAsgForm((f) => ({ ...f, nombre: e.target.value.toUpperCase() }))}
            placeholder="Ej: GNP SEGUROS"
            required />
          <Input
            label="Nombre corto (opcional)"
            value={asgForm.nombre_corto}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAsgForm((f) => ({ ...f, nombre_corto: e.target.value.toUpperCase() }))}
            placeholder="Ej: GNP" />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setAsgModal(null)}>Cancelar</Button>
            <Button type="submit" loading={saving}>
              {asgModal === "nuevo" ? "Crear aseguradora" : "Guardar cambios"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── Modal: Nuevo / Editar testimonio ─────── */}
      <Modal
        open={tstModal !== null}
        onClose={() => setTstModal(null)}
        title={tstModal === "nuevo" ? "Nuevo testimonio" : "Editar testimonio"}
        size="sm">
        <form onSubmit={guardarTst} className="space-y-4">
          {error && (
            <div className="p-2 rounded-lg text-xs" style={{ background: "#FEF2F2", color: "#DC2626" }}>{error}</div>
          )}
          <Input
            label="Nombre del paciente *"
            value={tstForm.nombre}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTstForm((f) => ({ ...f, nombre: e.target.value }))}
            placeholder="Ej: María González"
            required />
          <Input
            label="Detalle (procedimiento · aseguradora)"
            value={tstForm.detalle}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTstForm((f) => ({ ...f, detalle: e.target.value }))}
            placeholder="Ej: Colecistectomía • GNP Seguros" />

          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--muted)" }}>
              Texto del testimonio *
            </label>
            <textarea
              value={tstForm.texto}
              onChange={(e) => setTstForm((f) => ({ ...f, texto: e.target.value }))}
              rows={4}
              required
              placeholder="Escribe aquí el testimonio del paciente..."
              className="w-full px-3 py-2 text-xs rounded-lg border resize-none focus:outline-none focus:ring-2"
              style={{
                background: "var(--surface)",
                borderColor: "var(--border)",
                color: "var(--text)",
              }} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--muted)" }}>Calificación</label>
              <Select
                value={tstForm.estrellas}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setTstForm((f) => ({ ...f, estrellas: e.target.value }))}>
                {[5,4,3,2,1].map((n) => (
                  <option key={n} value={n}>{"★".repeat(n)} ({n})</option>
                ))}
              </Select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--muted)" }}>Orden</label>
              <Input
                type="number"
                min="0"
                value={tstForm.orden}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTstForm((f) => ({ ...f, orden: e.target.value }))} />
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none" style={{ color: "var(--muted)" }}>
            <input
              type="checkbox"
              checked={tstForm.activo}
              onChange={(e) => setTstForm((f) => ({ ...f, activo: e.target.checked }))}
            />
            <span className="text-xs">Visible en la landing page</span>
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setTstModal(null)}>Cancelar</Button>
            <Button type="submit" loading={saving}>
              {tstModal === "nuevo" ? "Crear testimonio" : "Guardar cambios"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
