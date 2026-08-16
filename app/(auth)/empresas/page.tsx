"use client"
import { useState, useEffect, useCallback, useRef } from "react"
import {
  Plus, Building2, Shield, Users, Phone, Mail, MapPin,
  Calendar, QrCode, Copy, Check, Star, Trash2, X, Edit2,
  Search, ChevronRight, Power, PowerOff, Link2, Upload,
} from "lucide-react"
import QRCode from "react-qr-code"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Modal } from "@/components/ui/modal"
import { Input, Textarea } from "@/components/ui/input"
import { ASEGURADORAS } from "@/constants/aseguradoras"
import { formatDate } from "@/lib/utils"

// ── Types ─────────────────────────────────────────────────────────────────────

interface Empresa {
  id: number; nombre: string; rfc: string | null; sector: string | null
  ejecutivo_cuenta: string | null; telefono: string | null; email: string | null
  direccion: string | null; ciudad: string | null; servicios: string | null
  notas: string | null; activa: boolean; fecha_registro: string
}

interface Contacto {
  id: number; id_empresa: number; nombre: string; cargo: string | null
  telefono: string | null; email: string | null; whatsapp: string | null
  principal: boolean; notas: string | null; fecha_creacion: string
}

interface Evento {
  id: number; id_empresa: number; nombre: string; descripcion: string | null
  fecha_evento: string | null; lugar: string | null; codigo_qr: string
  activo: boolean; fecha_creacion: string
}

interface EmpresaProspecto {
  id: number; nombre_empresa: string; nombre_contacto: string | null
  cargo: string | null; telefono: string | null; num_colaboradores: number | null
  aseguradora: string | null; estado: string; notas: string | null; created_at: string
}

interface CampoForm {
  campo: string; etiqueta: string; tipo: string; requerido: boolean; opciones?: string[]
}

interface ServicioConvenio {
  id: number; nombre: string; descripcion: string | null; icono: string | null
  precio_regular: number | null; precio_convenio: number | null; pct_descuento: number | null
  tipo: string; activo: boolean; orden: number
}

interface ConvenioForm {
  slug: string; logo_url: string | null; descripcion_landing: string
  vigencia_inicio: string; vigencia_fin: string; campos_formulario: CampoForm[]
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://ihelpmedica.mx"

const CAMPOS_PREDEFINIDOS: CampoForm[] = [
  { campo: "nombre",           etiqueta: "Nombre",               tipo: "texto",    requerido: true },
  { campo: "apellido_paterno", etiqueta: "Apellido paterno",     tipo: "texto",    requerido: true },
  { campo: "apellido_materno", etiqueta: "Apellido materno",     tipo: "texto",    requerido: false },
  { campo: "telefono",         etiqueta: "Celular",              tipo: "telefono", requerido: true },
  { campo: "email",            etiqueta: "Correo electrónico",   tipo: "email",    requerido: false },
  { campo: "fecha_nacimiento", etiqueta: "Fecha de nacimiento",  tipo: "fecha",    requerido: false },
  { campo: "num_empleado",     etiqueta: "No. de empleado",      tipo: "texto",    requerido: false },
  { campo: "departamento",     etiqueta: "Departamento",         tipo: "texto",    requerido: false },
]

function slugify(s: string): string {
  return s.toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "").trim()
    .replace(/\s+/g, "-").replace(/-+/g, "-").slice(0, 60)
}

function fmtMXN(v: number | null) {
  if (v == null) return "—"
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 0 }).format(v)
}

type Tab = "empresas" | "aseguradoras" | "prospectos"

const ESTADOS_PROSPECTO = [
  { key: "prospecto",         label: "Prospecto",          color: "#6B7280", bg: "#F3F4F6" },
  { key: "contactado",        label: "Contactado",         color: "#2563EB", bg: "#EFF6FF" },
  { key: "cita_agendada",     label: "Cita agendada",      color: "#D97706", bg: "#FEF3C7" },
  { key: "campana_realizada", label: "Campaña realizada",  color: "#7C3AED", bg: "#EDE9FE" },
  { key: "convertido",        label: "Convertido",         color: "#059669", bg: "#ECFDF5" },
]

const EMPTY_EMP = {
  nombre: "", rfc: "", sector: "", ejecutivo_cuenta: "",
  telefono: "", email: "", direccion: "", ciudad: "", servicios: "", notas: "",
}

const EMPTY_CONTACTO = { nombre: "", cargo: "", telefono: "", email: "", whatsapp: "", principal: false, notas: "" }
const EMPTY_EVENTO   = { nombre: "", descripcion: "", fecha_evento: "", lugar: "" }

// ── Helpers ───────────────────────────────────────────────────────────────────

function CodeChip({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button onClick={() => { navigator.clipboard.writeText(code).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 1800) }}
      className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-mono font-medium"
      style={{ background: "var(--surface-2)", color: "var(--muted)" }}>
      <QrCode size={11} />{code}
      {copied ? <Check size={10} color="#059669" /> : <Copy size={10} />}
    </button>
  )
}

// ── Detail Panel ──────────────────────────────────────────────────────────────

function DetailPanel({
  empresa, onClose, onUpdated,
}: { empresa: Empresa; onClose: () => void; onUpdated: (e: Empresa) => void }) {
  const [contactos, setContactos] = useState<Contacto[]>([])
  const [eventos, setEventos]     = useState<Evento[]>([])
  const [loadingDetail, setLoadingDetail] = useState(true)
  const [subTab, setSubTab] = useState<"info" | "contactos" | "eventos" | "landing">("info")

  // Edit
  const [editMode, setEditMode]   = useState(false)
  const [editForm, setEditForm]   = useState({
    nombre: empresa.nombre, rfc: empresa.rfc ?? "", sector: empresa.sector ?? "",
    ejecutivo_cuenta: empresa.ejecutivo_cuenta ?? "", telefono: empresa.telefono ?? "",
    email: empresa.email ?? "", direccion: empresa.direccion ?? "",
    ciudad: empresa.ciudad ?? "", servicios: empresa.servicios ?? "", notas: empresa.notas ?? "",
  })
  const [saving, setSaving] = useState(false)

  // Contacto form
  const [addContacto, setAddContacto] = useState(false)
  const [cForm, setCForm] = useState(EMPTY_CONTACTO)
  const [savingC, setSavingC] = useState(false)

  // Evento form
  const [addEvento, setAddEvento] = useState(false)
  const [eForm, setEForm] = useState(EMPTY_EVENTO)
  const [savingE, setSavingE] = useState(false)

  // Landing / Convenio
  const EMPTY_CONVENIO: ConvenioForm = {
    slug: "", logo_url: null, descripcion_landing: "", vigencia_inicio: "", vigencia_fin: "",
    campos_formulario: [],
  }
  const [convenioForm, setConvenioForm] = useState<ConvenioForm>(EMPTY_CONVENIO)
  const [servicios, setServicios]           = useState<ServicioConvenio[]>([])
  const [landingLoaded, setLandingLoaded]   = useState(false)
  const [savingLanding, setSavingLanding]   = useState(false)
  const [landingMsg, setLandingMsg]         = useState<string | null>(null)
  const [uploadingLogo, setUploadingLogo]   = useState(false)
  const [addServicio, setAddServicio]       = useState(false)
  const [sForm, setSForm]                   = useState({ nombre: "", descripcion: "", precio_regular: "", precio_convenio: "", tipo: "general" })
  const [savingS, setSavingS]               = useState(false)
  const [linkCopied, setLinkCopied]         = useState(false)
  const logoInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch(`/api/empresas/${empresa.id}`)
      .then((r) => r.json())
      .then((j) => { setContactos(j.contactos ?? []); setEventos(j.eventos ?? []) })
      .finally(() => setLoadingDetail(false))
  }, [empresa.id])

  useEffect(() => {
    if (subTab !== "landing" || landingLoaded) return
    Promise.all([
      fetch(`/api/empresas/${empresa.id}/convenio`).then((r) => r.json()),
      fetch(`/api/empresas/${empresa.id}/servicios`).then((r) => r.json()),
    ]).then(([conv, servs]) => {
      if (conv.data) {
        setConvenioForm({
          slug:                conv.data.slug                ?? "",
          logo_url:            conv.data.logo_url            ?? null,
          descripcion_landing: conv.data.descripcion_landing ?? "",
          vigencia_inicio:     conv.data.vigencia_inicio     ?? "",
          vigencia_fin:        conv.data.vigencia_fin        ?? "",
          campos_formulario:   Array.isArray(conv.data.campos_formulario) ? conv.data.campos_formulario : [],
        })
      }
      setServicios(servs.data ?? [])
      setLandingLoaded(true)
    })
  }, [subTab, landingLoaded, empresa.id])

  const setE = (k: string) =>
    (ev: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setEditForm((f) => ({ ...f, [k]: ev.target.value }))

  async function saveEdit(ev: React.FormEvent) {
    ev.preventDefault(); setSaving(true)
    const res = await fetch(`/api/empresas/${empresa.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    })
    if (res.ok) { const { data } = await res.json(); onUpdated(data); setEditMode(false) }
    setSaving(false)
  }

  async function toggleActiva() {
    const res = await fetch(`/api/empresas/${empresa.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activa: !empresa.activa }),
    })
    if (res.ok) { const { data } = await res.json(); onUpdated(data) }
  }

  async function addContactoFn(ev: React.FormEvent) {
    ev.preventDefault(); setSavingC(true)
    const res = await fetch(`/api/empresas/${empresa.id}/contactos`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cForm),
    })
    if (res.ok) {
      const { data } = await res.json()
      setContactos((p) => cForm.principal ? [data, ...p.map((c) => ({ ...c, principal: false }))] : [...p, data])
      setAddContacto(false); setCForm(EMPTY_CONTACTO)
    }
    setSavingC(false)
  }

  async function deleteContacto(cid: number) {
    await fetch(`/api/empresas/${empresa.id}/contactos`, {
      method: "DELETE", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contacto_id: cid }),
    })
    setContactos((p) => p.filter((c) => c.id !== cid))
  }

  async function addEventoFn(ev: React.FormEvent) {
    ev.preventDefault(); setSavingE(true)
    const res = await fetch(`/api/empresas/${empresa.id}/eventos`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(eForm),
    })
    if (res.ok) {
      const { data } = await res.json()
      setEventos((p) => [data, ...p])
      setAddEvento(false); setEForm(EMPTY_EVENTO)
    }
    setSavingE(false)
  }

  async function toggleEvento(ev: Evento) {
    const res = await fetch(`/api/empresas/${empresa.id}/eventos`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ evento_id: ev.id, activo: !ev.activo }),
    })
    if (res.ok) { const { data } = await res.json(); setEventos((p) => p.map((e) => e.id === data.id ? data : e)) }
  }

  // ── Landing helpers ──────────────────────────────────────────────────────────

  const setConv = (k: keyof ConvenioForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setConvenioForm((f) => ({ ...f, [k]: e.target.value }))

  function autoSlug() {
    setConvenioForm((f) => ({ ...f, slug: slugify(empresa.nombre) }))
  }

  function toggleCampo(c: CampoForm, enabled: boolean) {
    setConvenioForm((f) => ({
      ...f,
      campos_formulario: enabled
        ? [...f.campos_formulario, { ...c }]
        : f.campos_formulario.filter((cf) => cf.campo !== c.campo),
    }))
  }

  function toggleRequerido(campo: string, requerido: boolean) {
    setConvenioForm((f) => ({
      ...f,
      campos_formulario: f.campos_formulario.map((cf) =>
        cf.campo === campo ? { ...cf, requerido } : cf
      ),
    }))
  }

  async function saveLanding() {
    setSavingLanding(true); setLandingMsg(null)
    const res = await fetch(`/api/empresas/${empresa.id}/convenio`, {
      method:  "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug:                convenioForm.slug                || null,
        descripcion_landing: convenioForm.descripcion_landing || null,
        vigencia_inicio:     convenioForm.vigencia_inicio     || null,
        vigencia_fin:        convenioForm.vigencia_fin        || null,
        campos_formulario:   convenioForm.campos_formulario,
      }),
    })
    if (res.ok) {
      const { data } = await res.json()
      setConvenioForm((f) => ({
        ...f, slug: data.slug ?? "", logo_url: data.logo_url ?? null,
      }))
      setLandingMsg("¡Guardado!")
      setTimeout(() => setLandingMsg(null), 2000)
    } else {
      const { error } = await res.json()
      setLandingMsg(error ?? "Error al guardar")
      setTimeout(() => setLandingMsg(null), 3000)
    }
    setSavingLanding(false)
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingLogo(true)
    const form = new FormData(); form.append("logo", file)
    const res = await fetch(`/api/empresas/${empresa.id}/logo`, { method: "POST", body: form })
    if (res.ok) { const { url } = await res.json(); setConvenioForm((f) => ({ ...f, logo_url: url })) }
    setUploadingLogo(false)
    if (logoInputRef.current) logoInputRef.current.value = ""
  }

  async function addServicioFn(ev: React.FormEvent) {
    ev.preventDefault(); setSavingS(true)
    const res = await fetch(`/api/empresas/${empresa.id}/servicios`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sForm),
    })
    if (res.ok) {
      const { data } = await res.json()
      setServicios((p) => [...p, data])
      setAddServicio(false)
      setSForm({ nombre: "", descripcion: "", precio_regular: "", precio_convenio: "", tipo: "general" })
    }
    setSavingS(false)
  }

  async function deleteServicio(sid: number) {
    await fetch(`/api/empresas/${empresa.id}/servicios/${sid}`, { method: "DELETE" })
    setServicios((p) => p.filter((s) => s.id !== sid))
  }

  async function toggleServicioActivo(s: ServicioConvenio) {
    const res = await fetch(`/api/empresas/${empresa.id}/servicios/${s.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activo: !s.activo }),
    })
    if (res.ok) {
      const { data } = await res.json()
      setServicios((p) => p.map((sv) => sv.id === data.id ? data : sv))
    }
  }

  function copyLink() {
    const url = `${APP_URL}/c/${convenioForm.slug}`
    navigator.clipboard.writeText(url).catch(() => {})
    setLinkCopied(true); setTimeout(() => setLinkCopied(false), 2000)
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />
      <aside className="fixed inset-y-0 right-0 z-50 flex flex-col w-full max-w-[540px] shadow-xl"
        style={{ background: "var(--surface)" }}>

        {/* Header */}
        <div className="px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: empresa.activa ? "var(--accent-bg)" : "var(--surface-2)" }}>
                <Building2 size={16} style={{ color: empresa.activa ? "var(--accent)" : "var(--muted)" }} />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold truncate" style={{ color: "var(--text)" }}>
                  {empresa.nombre}
                </div>
                <div className="text-xs" style={{ color: "var(--muted)" }}>
                  {[empresa.sector, empresa.ciudad].filter(Boolean).join(" · ") || "Sin sector"}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button onClick={toggleActiva}
                className="text-xs px-2.5 py-1.5 rounded-lg border font-medium"
                style={{
                  borderColor: empresa.activa ? "var(--border)" : "#DC2626",
                  color: empresa.activa ? "var(--muted)" : "#DC2626",
                  background: empresa.activa ? "transparent" : "#FEF2F2",
                }}>
                {empresa.activa ? "Desactivar" : "Activar"}
              </button>
              <button onClick={() => setEditMode((v) => !v)}
                className="p-1.5 rounded-lg hover:bg-[var(--surface-2)]"
                style={{ color: editMode ? "var(--accent)" : "var(--muted)" }}>
                <Edit2 size={15} />
              </button>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[var(--surface-2)]"
                style={{ color: "var(--muted)" }}>
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Sub-tabs */}
          <div className="flex gap-1 mt-4 flex-wrap">
            {([
              { key: "info",      label: "Información" },
              { key: "contactos", label: `Contactos (${contactos.length})` },
              { key: "eventos",   label: `Eventos (${eventos.length})` },
              { key: "landing",   label: "Landing QR" },
            ] as const).map(({ key, label }) => (
              <button key={key} onClick={() => setSubTab(key)}
                className="px-3 py-1.5 text-xs font-medium rounded-lg transition-colors"
                style={{
                  background: subTab === key ? "var(--accent-bg)" : "transparent",
                  color: subTab === key ? "var(--accent)" : "var(--muted)",
                }}>
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">

          {/* ── Info / Edit ── */}
          {subTab === "info" && (
            editMode ? (
              <form onSubmit={saveEdit} id="edit-empresa" className="space-y-3">
                <Input label="Nombre *" value={editForm.nombre} onChange={setE("nombre")} required />
                <div className="grid grid-cols-2 gap-3">
                  <Input label="RFC" value={editForm.rfc} onChange={setE("rfc")} />
                  <Input label="Sector" value={editForm.sector} onChange={setE("sector")} />
                </div>
                <Input label="Ejecutivo de cuenta" value={editForm.ejecutivo_cuenta} onChange={setE("ejecutivo_cuenta")} />
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Teléfono" value={editForm.telefono} onChange={setE("telefono")} />
                  <Input label="Email" type="email" value={editForm.email} onChange={setE("email")} />
                </div>
                <Input label="Ciudad" value={editForm.ciudad} onChange={setE("ciudad")} />
                <Textarea label="Dirección" value={editForm.direccion} onChange={setE("direccion")} rows={2} />
                <Textarea label="Servicios / coberturas contratadas" value={editForm.servicios}
                  onChange={setE("servicios")} rows={3} />
                <Textarea label="Notas" value={editForm.notas} onChange={setE("notas")} rows={2} />
              </form>
            ) : (
              <div className="space-y-4">
                {[
                  { icon: <Building2 size={13} />, label: "RFC", value: empresa.rfc },
                  { icon: <Users size={13} />,    label: "Ejecutivo de cuenta", value: empresa.ejecutivo_cuenta },
                  { icon: <Phone size={13} />,    label: "Teléfono", value: empresa.telefono },
                  { icon: <Mail size={13} />,     label: "Email", value: empresa.email },
                  { icon: <MapPin size={13} />,   label: "Ciudad", value: empresa.ciudad },
                ].filter((f) => f.value).map(({ icon, label, value }) => (
                  <div key={label} className="flex items-start gap-2">
                    <span className="mt-0.5 flex-shrink-0" style={{ color: "var(--muted)" }}>{icon}</span>
                    <div>
                      <div className="text-[10px] uppercase tracking-wide font-medium mb-0.5"
                        style={{ color: "var(--subtle)" }}>{label}</div>
                      <div className="text-sm" style={{ color: "var(--text)" }}>{value}</div>
                    </div>
                  </div>
                ))}
                {empresa.direccion && (
                  <div className="flex items-start gap-2">
                    <MapPin size={13} className="mt-0.5 flex-shrink-0" style={{ color: "var(--muted)" }} />
                    <div>
                      <div className="text-[10px] uppercase tracking-wide font-medium mb-0.5"
                        style={{ color: "var(--subtle)" }}>Dirección</div>
                      <div className="text-sm" style={{ color: "var(--text)" }}>{empresa.direccion}</div>
                    </div>
                  </div>
                )}
                {empresa.servicios && (
                  <div className="rounded-xl p-3 border" style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}>
                    <div className="text-[10px] uppercase tracking-wide font-medium mb-1" style={{ color: "var(--subtle)" }}>
                      Servicios / coberturas
                    </div>
                    <p className="text-xs whitespace-pre-wrap" style={{ color: "var(--text)" }}>{empresa.servicios}</p>
                  </div>
                )}
                {empresa.notas && (
                  <div>
                    <div className="text-[10px] uppercase tracking-wide font-medium mb-1" style={{ color: "var(--subtle)" }}>Notas</div>
                    <p className="text-xs whitespace-pre-wrap" style={{ color: "var(--text)" }}>{empresa.notas}</p>
                  </div>
                )}
                <div className="text-xs pt-2" style={{ color: "var(--subtle)" }}>
                  Registrada {formatDate(empresa.fecha_registro)}
                </div>
              </div>
            )
          )}

          {/* ── Contactos ── */}
          {subTab === "contactos" && (
            <div className="space-y-3">
              <Button size="sm" variant="secondary" onClick={() => setAddContacto(true)}>
                <Plus size={12} /> Agregar contacto
              </Button>

              {addContacto && (
                <form onSubmit={addContactoFn} className="rounded-xl border p-4 space-y-3"
                  style={{ borderColor: "var(--accent)", background: "var(--surface-2)" }}>
                  <div className="text-xs font-semibold" style={{ color: "var(--accent)" }}>Nuevo contacto</div>
                  <Input label="Nombre *" value={cForm.nombre}
                    onChange={(e) => setCForm((f) => ({ ...f, nombre: e.target.value }))} required />
                  <div className="grid grid-cols-2 gap-2">
                    <Input label="Cargo" value={cForm.cargo}
                      onChange={(e) => setCForm((f) => ({ ...f, cargo: e.target.value }))} />
                    <Input label="Teléfono" value={cForm.telefono}
                      onChange={(e) => setCForm((f) => ({ ...f, telefono: e.target.value }))} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input label="Email" type="email" value={cForm.email}
                      onChange={(e) => setCForm((f) => ({ ...f, email: e.target.value }))} />
                    <Input label="WhatsApp" value={cForm.whatsapp}
                      onChange={(e) => setCForm((f) => ({ ...f, whatsapp: e.target.value }))} />
                  </div>
                  <label className="flex items-center gap-2 text-xs cursor-pointer" style={{ color: "var(--text)" }}>
                    <input type="checkbox" checked={cForm.principal}
                      onChange={(e) => setCForm((f) => ({ ...f, principal: e.target.checked }))} />
                    Contacto principal
                  </label>
                  <div className="flex gap-2 justify-end">
                    <Button type="button" size="sm" variant="secondary" onClick={() => setAddContacto(false)}>Cancelar</Button>
                    <Button type="submit" size="sm" loading={savingC}>Agregar</Button>
                  </div>
                </form>
              )}

              {loadingDetail && <div className="text-xs text-center py-6" style={{ color: "var(--subtle)" }}>Cargando...</div>}

              {!loadingDetail && contactos.length === 0 && !addContacto && (
                <div className="text-center py-10 text-xs" style={{ color: "var(--subtle)" }}>
                  Sin contactos registrados
                </div>
              )}

              {contactos.map((c) => (
                <div key={c.id} className="rounded-xl border p-3.5 space-y-1"
                  style={{ background: "var(--surface)", borderColor: c.principal ? "var(--accent)" : "var(--border)" }}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        {c.principal && <Star size={11} color="var(--accent)" fill="var(--accent)" />}
                        <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>{c.nombre}</span>
                      </div>
                      {c.cargo && <div className="text-xs" style={{ color: "var(--muted)" }}>{c.cargo}</div>}
                    </div>
                    <button onClick={() => deleteContacto(c.id)}
                      className="p-1 rounded hover:bg-[var(--surface-2)]" style={{ color: "var(--muted)" }}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs" style={{ color: "var(--muted)" }}>
                    {c.telefono && <span className="flex items-center gap-1"><Phone size={10} />{c.telefono}</span>}
                    {c.email    && <span className="flex items-center gap-1"><Mail size={10} />{c.email}</span>}
                    {c.whatsapp && <span>WA: {c.whatsapp}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Landing QR ── */}
          {subTab === "landing" && (
            <div className="space-y-5">
              {!landingLoaded ? (
                <div className="text-center py-10 text-xs" style={{ color: "var(--subtle)" }}>Cargando...</div>
              ) : (
                <>
                  {/* URL y QR */}
                  <div className="rounded-xl border p-4 space-y-3" style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}>
                    <div className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--subtle)" }}>
                      URL del convenio
                    </div>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs pointer-events-none"
                          style={{ color: "var(--subtle)" }}>/c/</span>
                        <input value={convenioForm.slug}
                          onChange={(e) => setConvenioForm((f) => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-") }))}
                          placeholder="nombre-empresa"
                          className="w-full h-9 rounded-lg border pl-8 pr-3 text-sm outline-none font-mono"
                          style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text)" }} />
                      </div>
                      <button onClick={autoSlug}
                        className="text-xs px-3 rounded-lg border font-medium h-9"
                        style={{ borderColor: "var(--border)", color: "var(--muted)", background: "var(--surface)" }}>
                        Auto
                      </button>
                    </div>
                    {convenioForm.slug && (
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 p-2 rounded-xl border" style={{ background: "white", borderColor: "var(--border)" }}>
                          <QRCode value={`${APP_URL}/c/${convenioForm.slug}`} size={100} />
                        </div>
                        <div className="space-y-2 min-w-0">
                          <p className="text-[11px] font-mono break-all" style={{ color: "var(--muted)" }}>
                            {APP_URL}/c/{convenioForm.slug}
                          </p>
                          <div className="flex gap-2">
                            <button onClick={copyLink}
                              className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border font-medium"
                              style={{ borderColor: "var(--border)", color: linkCopied ? "#059669" : "var(--muted)", background: "var(--surface)" }}>
                              {linkCopied ? <Check size={11} /> : <Link2 size={11} />}
                              {linkCopied ? "Copiado" : "Copiar link"}
                            </button>
                            <a href={`${APP_URL}/c/${convenioForm.slug}`} target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border font-medium"
                              style={{ borderColor: "var(--border)", color: "var(--muted)", background: "var(--surface)" }}>
                              Vista previa
                            </a>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Logo */}
                  <div className="space-y-2">
                    <div className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--subtle)" }}>
                      Logo de la empresa
                    </div>
                    <div className="flex items-center gap-3">
                      {convenioForm.logo_url && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={convenioForm.logo_url} alt="Logo"
                          className="h-14 w-14 rounded-xl object-contain border"
                          style={{ background: "var(--surface-2)", borderColor: "var(--border)", padding: 4 }} />
                      )}
                      <button onClick={() => logoInputRef.current?.click()} disabled={uploadingLogo}
                        className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border font-medium"
                        style={{ borderColor: "var(--border)", color: "var(--muted)", background: "var(--surface)" }}>
                        <Upload size={12} />
                        {uploadingLogo ? "Subiendo..." : convenioForm.logo_url ? "Cambiar logo" : "Subir logo"}
                      </button>
                      <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                    </div>
                  </div>

                  {/* Descripción */}
                  <div className="space-y-2">
                    <div className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--subtle)" }}>
                      Descripción de la landing
                    </div>
                    <textarea value={convenioForm.descripcion_landing}
                      onChange={setConv("descripcion_landing")} rows={3}
                      placeholder="Describe el convenio y sus beneficios..."
                      className="w-full rounded-lg border px-3 py-2 text-sm outline-none resize-none"
                      style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text)" }} />
                  </div>

                  {/* Vigencia */}
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { key: "vigencia_inicio", label: "Vigencia inicio" },
                      { key: "vigencia_fin",    label: "Vigencia fin" },
                    ].map(({ key, label }) => (
                      <div key={key} className="space-y-1">
                        <div className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--subtle)" }}>
                          {label}
                        </div>
                        <input type="date"
                          value={convenioForm[key as keyof ConvenioForm] as string}
                          onChange={setConv(key as keyof ConvenioForm)}
                          className="w-full h-9 rounded-lg border px-3 text-sm outline-none"
                          style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text)" }} />
                      </div>
                    ))}
                  </div>

                  {/* Campos del formulario */}
                  <div className="space-y-2">
                    <div className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--subtle)" }}>
                      Campos del formulario público
                    </div>
                    <div className="rounded-xl border divide-y" style={{ borderColor: "var(--border)" }}>
                      {CAMPOS_PREDEFINIDOS.map((c) => {
                        const active = convenioForm.campos_formulario.find((cf) => cf.campo === c.campo)
                        const enabled = !!active
                        return (
                          <div key={c.campo} className="flex items-center gap-3 px-3 py-2.5">
                            <input type="checkbox" checked={enabled}
                              onChange={(e) => toggleCampo(c, e.target.checked)} />
                            <span className="text-sm flex-1" style={{ color: enabled ? "var(--text)" : "var(--subtle)" }}>
                              {c.etiqueta}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                              style={{ background: "var(--surface-2)", color: "var(--subtle)" }}>
                              {c.tipo}
                            </span>
                            {enabled && (
                              <label className="flex items-center gap-1.5 text-xs cursor-pointer" style={{ color: "var(--muted)" }}>
                                <input type="checkbox" checked={active?.requerido ?? false}
                                  onChange={(e) => toggleRequerido(c.campo, e.target.checked)} />
                                Requerido
                              </label>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Servicios */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--subtle)" }}>
                        Servicios del convenio ({servicios.length})
                      </div>
                      <Button size="sm" variant="secondary" onClick={() => setAddServicio(true)}>
                        <Plus size={12} /> Agregar
                      </Button>
                    </div>

                    {addServicio && (
                      <form onSubmit={addServicioFn} className="rounded-xl border p-4 space-y-3"
                        style={{ borderColor: "var(--accent)", background: "var(--surface-2)" }}>
                        <div className="text-xs font-semibold" style={{ color: "var(--accent)" }}>Nuevo servicio</div>
                        <input required value={sForm.nombre}
                          onChange={(e) => setSForm((f) => ({ ...f, nombre: e.target.value }))}
                          placeholder="Nombre del servicio *"
                          className="w-full h-9 rounded-lg border px-3 text-sm outline-none"
                          style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text)" }} />
                        <textarea value={sForm.descripcion}
                          onChange={(e) => setSForm((f) => ({ ...f, descripcion: e.target.value }))}
                          placeholder="Descripción (opcional)" rows={2}
                          className="w-full rounded-lg border px-3 py-2 text-sm outline-none resize-none"
                          style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text)" }} />
                        <div className="grid grid-cols-2 gap-2">
                          <input type="number" step="0.01" value={sForm.precio_regular}
                            onChange={(e) => setSForm((f) => ({ ...f, precio_regular: e.target.value }))}
                            placeholder="Precio regular"
                            className="h-9 rounded-lg border px-3 text-sm outline-none"
                            style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text)" }} />
                          <input type="number" step="0.01" value={sForm.precio_convenio}
                            onChange={(e) => setSForm((f) => ({ ...f, precio_convenio: e.target.value }))}
                            placeholder="Precio convenio"
                            className="h-9 rounded-lg border px-3 text-sm outline-none"
                            style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text)" }} />
                        </div>
                        <div className="flex gap-2 justify-end">
                          <Button type="button" size="sm" variant="secondary" onClick={() => setAddServicio(false)}>Cancelar</Button>
                          <Button type="submit" size="sm" loading={savingS}>Crear servicio</Button>
                        </div>
                      </form>
                    )}

                    {servicios.map((s) => (
                      <div key={s.id} className="rounded-xl border p-3.5"
                        style={{ background: "var(--surface)", borderColor: "var(--border)", opacity: s.activo ? 1 : 0.5 }}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-semibold" style={{ color: "var(--text)" }}>{s.nombre}</div>
                            {s.descripcion && (
                              <div className="text-xs mt-0.5 line-clamp-1" style={{ color: "var(--muted)" }}>{s.descripcion}</div>
                            )}
                            {(s.precio_convenio != null) && (
                              <div className="flex items-baseline gap-2 mt-1">
                                {s.precio_regular != null && (
                                  <span className="text-xs line-through" style={{ color: "var(--subtle)" }}>{fmtMXN(s.precio_regular)}</span>
                                )}
                                <span className="text-sm font-bold" style={{ color: "var(--accent)" }}>{fmtMXN(s.precio_convenio)}</span>
                                {s.pct_descuento != null && s.pct_descuento > 0 && (
                                  <span className="text-[10px] font-semibold px-1.5 rounded-full"
                                    style={{ background: "#ECFDF5", color: "#059669" }}>
                                    -{Math.round(s.pct_descuento)}%
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <button onClick={() => toggleServicioActivo(s)}
                              className="p-1.5 rounded-lg border"
                              style={{ borderColor: "var(--border)", color: s.activo ? "#059669" : "var(--muted)" }}
                              title={s.activo ? "Desactivar" : "Activar"}>
                              {s.activo ? <Power size={12} /> : <PowerOff size={12} />}
                            </button>
                            <button onClick={() => deleteServicio(s.id)}
                              className="p-1.5 rounded-lg border"
                              style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}

                    {servicios.length === 0 && !addServicio && (
                      <div className="text-center py-6 text-xs" style={{ color: "var(--subtle)" }}>
                        Sin servicios registrados
                      </div>
                    )}
                  </div>

                  {/* Save + status */}
                  <div className="flex items-center gap-3 pt-1">
                    <Button onClick={saveLanding} loading={savingLanding}>
                      <Check size={13} /> Guardar landing
                    </Button>
                    {landingMsg && (
                      <span className="text-xs font-medium"
                        style={{ color: landingMsg.includes("Error") || landingMsg.includes("uso") ? "#DC2626" : "#059669" }}>
                        {landingMsg}
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── Eventos ── */}
          {subTab === "eventos" && (
            <div className="space-y-3">
              <Button size="sm" variant="secondary" onClick={() => setAddEvento(true)}>
                <Plus size={12} /> Nuevo evento
              </Button>

              {addEvento && (
                <form onSubmit={addEventoFn} className="rounded-xl border p-4 space-y-3"
                  style={{ borderColor: "var(--accent)", background: "var(--surface-2)" }}>
                  <div className="text-xs font-semibold" style={{ color: "var(--accent)" }}>Nuevo evento</div>
                  <Input label="Nombre del evento *" value={eForm.nombre}
                    onChange={(e) => setEForm((f) => ({ ...f, nombre: e.target.value }))} required />
                  <div className="grid grid-cols-2 gap-2">
                    <Input label="Fecha" type="date" value={eForm.fecha_evento}
                      onChange={(e) => setEForm((f) => ({ ...f, fecha_evento: e.target.value }))} />
                    <Input label="Lugar" value={eForm.lugar}
                      onChange={(e) => setEForm((f) => ({ ...f, lugar: e.target.value }))} />
                  </div>
                  <Textarea label="Descripción" value={eForm.descripcion}
                    onChange={(e) => setEForm((f) => ({ ...f, descripcion: e.target.value }))} rows={2} />
                  <p className="text-xs" style={{ color: "var(--subtle)" }}>
                    Se generará un código QR único para este evento al crearlo.
                  </p>
                  <div className="flex gap-2 justify-end">
                    <Button type="button" size="sm" variant="secondary" onClick={() => setAddEvento(false)}>Cancelar</Button>
                    <Button type="submit" size="sm" loading={savingE}>Crear evento</Button>
                  </div>
                </form>
              )}

              {loadingDetail && <div className="text-xs text-center py-6" style={{ color: "var(--subtle)" }}>Cargando...</div>}

              {!loadingDetail && eventos.length === 0 && !addEvento && (
                <div className="text-center py-10 text-xs" style={{ color: "var(--subtle)" }}>
                  Sin eventos creados
                </div>
              )}

              {eventos.map((ev) => (
                <div key={ev.id} className="rounded-xl border p-3.5 space-y-2"
                  style={{ background: "var(--surface)", borderColor: "var(--border)", opacity: ev.activo ? 1 : 0.55 }}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-sm font-semibold" style={{ color: "var(--text)" }}>{ev.nombre}</div>
                      {ev.descripcion && (
                        <div className="text-xs mt-0.5 line-clamp-2" style={{ color: "var(--muted)" }}>{ev.descripcion}</div>
                      )}
                    </div>
                    <button onClick={() => toggleEvento(ev)}
                      className="p-1.5 rounded-lg border flex-shrink-0"
                      style={{ borderColor: "var(--border)", color: ev.activo ? "#059669" : "var(--muted)" }}
                      title={ev.activo ? "Desactivar" : "Activar"}>
                      {ev.activo ? <Power size={12} /> : <PowerOff size={12} />}
                    </button>
                  </div>
                  {(ev.fecha_evento || ev.lugar) && (
                    <div className="flex flex-wrap gap-3 text-xs" style={{ color: "var(--muted)" }}>
                      {ev.fecha_evento && (
                        <span className="flex items-center gap-1"><Calendar size={10} />{formatDate(ev.fecha_evento)}</span>
                      )}
                      {ev.lugar && (
                        <span className="flex items-center gap-1"><MapPin size={10} />{ev.lugar}</span>
                      )}
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-1 border-t"
                    style={{ borderColor: "var(--border)" }}>
                    <CodeChip code={ev.codigo_qr} />
                    <Badge label={ev.activo ? "Activo" : "Inactivo"}
                      color={ev.activo ? "#059669" : "#6B7280"}
                      bg={ev.activo ? "#ECFDF5" : "#F3F4F6"} size="sm" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer — save edit */}
        {editMode && subTab === "info" && (
          <div className="px-5 py-3 border-t flex justify-end gap-2" style={{ borderColor: "var(--border)" }}>
            <Button type="button" variant="secondary" size="sm" onClick={() => setEditMode(false)}>Cancelar</Button>
            <Button type="submit" form="edit-empresa" size="sm" loading={saving}>
              <Check size={12} /> Guardar
            </Button>
          </div>
        )}
      </aside>
    </>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function EmpresasPage() {
  const [tab, setTab] = useState<Tab>("empresas")

  // Empresas
  const [empresas, setEmpresas]     = useState<Empresa[]>([])
  const [loadingEmp, setLoadingEmp] = useState(true)
  const [search, setSearch]         = useState("")
  const [selected, setSelected]     = useState<Empresa | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [creating, setCreating]     = useState(false)
  const [newForm, setNewForm]       = useState(EMPTY_EMP)

  // Prospectos
  const [prospectos, setProspectos]     = useState<EmpresaProspecto[]>([])
  const [loadingPros, setLoadingPros]   = useState(false)
  const [prospectoLoaded, setProspectoLoaded] = useState(false)

  // ── Fetch empresas ────────────────────────────────────────────────────────

  const loadEmpresas = useCallback(async (q = "") => {
    setLoadingEmp(true)
    const p = new URLSearchParams()
    if (q.length >= 2) p.set("q", q)
    const res = await fetch(`/api/empresas?${p}`)
    if (res.ok) { const j = await res.json(); setEmpresas(j.data ?? []) }
    setLoadingEmp(false)
  }, [])

  useEffect(() => { loadEmpresas() }, [loadEmpresas])

  useEffect(() => {
    if (tab === "prospectos" && !prospectoLoaded) {
      setLoadingPros(true)
      fetch("/api/empresas-prospectos")
        .then((r) => r.json())
        .then((j) => { setProspectos(j.data ?? []); setProspectoLoaded(true) })
        .finally(() => setLoadingPros(false))
    }
  }, [tab, prospectoLoaded])

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => loadEmpresas(search), 300)
    return () => clearTimeout(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  // ── Create empresa ────────────────────────────────────────────────────────

  const setN = (k: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setNewForm((f) => ({ ...f, [k]: e.target.value }))

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault(); setCreating(true)
    const res = await fetch("/api/empresas", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newForm),
    })
    if (res.ok) {
      const { data } = await res.json()
      setEmpresas((p) => [data, ...p])
      setCreateOpen(false); setNewForm(EMPTY_EMP)
    }
    setCreating(false)
  }

  // ── Prospecto estado ──────────────────────────────────────────────────────

  async function updateProspectoEstado(id: number, estado: string) {
    setProspectos((ps) => ps.map((p) => p.id === id ? { ...p, estado } : p))
    await fetch("/api/empresas-prospectos", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, estado }),
    })
  }

  // ── Filter ────────────────────────────────────────────────────────────────

  const activas   = empresas.filter((e) => e.activa).length
  const inactivas = empresas.length - activas

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold" style={{ color: "var(--text)" }}>Empresas</h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--subtle)" }}>
            Convenios B2B · aseguradoras · prospectos
          </p>
        </div>
        {tab === "empresas" && (
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus size={13} /> Nueva empresa
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b" style={{ borderColor: "var(--border)" }}>
        {([
          { key: "empresas",     label: `Convenios (${empresas.length})` },
          { key: "aseguradoras", label: "Aseguradoras" },
          { key: "prospectos",   label: `Prospectos (${prospectos.length})` },
        ] as const).map(({ key, label }) => (
          <button key={key} onClick={() => setTab(key)}
            className="px-3 py-2 text-xs font-medium border-b-2 -mb-px transition-colors"
            style={{
              borderBottomColor: tab === key ? "var(--accent)" : "transparent",
              color: tab === key ? "var(--accent)" : "var(--muted)",
            }}>
            {label}
          </button>
        ))}
      </div>

      {/* ── TAB: EMPRESAS ── */}
      {tab === "empresas" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: "var(--muted)" }} />
              <input value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar empresa..."
                className="w-full h-9 pl-8 pr-3 rounded-lg border text-sm outline-none"
                style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text)" }} />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2"
                  style={{ color: "var(--muted)" }}>
                  <X size={12} />
                </button>
              )}
            </div>
            <span className="text-xs" style={{ color: "var(--subtle)" }}>
              {activas} activas · {inactivas} inactivas
            </span>
          </div>

          {loadingEmp ? (
            <div className="text-center py-12 text-xs" style={{ color: "var(--subtle)" }}>Cargando...</div>
          ) : empresas.length === 0 ? (
            <div className="flex flex-col items-center py-16 gap-2">
              <Building2 size={28} style={{ color: "var(--border)" }} />
              <p className="text-xs" style={{ color: "var(--subtle)" }}>
                {search ? "Sin resultados" : "Sin empresas registradas"}
              </p>
            </div>
          ) : (
            <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
              <div className="divide-y" style={{ borderColor: "var(--border)" }}>
                {empresas.map((emp) => (
                  <button key={emp.id} onClick={() => setSelected(emp)}
                    className="w-full flex items-center gap-4 px-4 py-3.5 text-left transition-colors hover:bg-[var(--surface-2)]"
                    style={{ background: "var(--surface)" }}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: emp.activa ? "var(--accent-bg)" : "var(--surface-2)" }}>
                      <Building2 size={14} style={{ color: emp.activa ? "var(--accent)" : "var(--muted)" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold truncate" style={{ color: "var(--text)" }}>
                        {emp.nombre}
                      </div>
                      <div className="text-xs truncate" style={{ color: "var(--muted)" }}>
                        {[emp.sector, emp.ciudad, emp.ejecutivo_cuenta].filter(Boolean).join(" · ") || "—"}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {!emp.activa && (
                        <Badge label="Inactiva" color="#6B7280" bg="#F3F4F6" size="sm" />
                      )}
                      <ChevronRight size={14} style={{ color: "var(--muted)" }} />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB: ASEGURADORAS ── */}
      {tab === "aseguradoras" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {ASEGURADORAS.map((a) => (
            <div key={a.id} className="rounded-xl border p-4 flex items-center gap-3"
              style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "var(--surface-2)" }}>
                <Shield size={15} style={{ color: "var(--accent)" }} />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold truncate" style={{ color: "var(--text)" }}>{a.nombre}</div>
                <div className="text-xs" style={{ color: "var(--muted)" }}>Aseguradora</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── TAB: PROSPECTOS ── */}
      {tab === "prospectos" && (
        <div className="space-y-3">
          {loadingPros ? (
            <div className="text-center py-12 text-xs" style={{ color: "var(--subtle)" }}>Cargando...</div>
          ) : prospectos.length === 0 ? (
            <div className="flex flex-col items-center py-16 gap-2">
              <Building2 size={28} style={{ color: "var(--border)" }} />
              <p className="text-xs text-center max-w-xs" style={{ color: "var(--subtle)" }}>
                Los prospectos llegan desde el bot de WhatsApp cuando alguien usa un código de campaña.
              </p>
            </div>
          ) : prospectos.map((p) => {
            const est = ESTADOS_PROSPECTO.find((e) => e.key === p.estado) ?? ESTADOS_PROSPECTO[0]
            return (
              <div key={p.id} className="rounded-xl border p-4"
                style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: "var(--surface-2)" }}>
                      <Building2 size={14} style={{ color: "var(--muted)" }} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold truncate" style={{ color: "var(--text)" }}>
                        {p.nombre_empresa}
                      </div>
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                        {p.nombre_contacto && (
                          <span className="text-xs" style={{ color: "var(--muted)" }}>
                            {p.nombre_contacto}{p.cargo ? ` · ${p.cargo}` : ""}
                          </span>
                        )}
                        {p.telefono && (
                          <span className="flex items-center gap-1 text-xs" style={{ color: "var(--muted)" }}>
                            <Phone size={10} />{p.telefono}
                          </span>
                        )}
                        {p.num_colaboradores != null && (
                          <span className="flex items-center gap-1 text-xs" style={{ color: "var(--muted)" }}>
                            <Users size={10} />{p.num_colaboradores} colaboradores
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    {/* Estado dropdown */}
                    <div className="relative">
                      <select
                        value={p.estado}
                        onChange={(e) => updateProspectoEstado(p.id, e.target.value)}
                        className="text-xs font-medium rounded-full px-2.5 py-1 border-0 outline-none appearance-none cursor-pointer pr-5"
                        style={{ background: est.bg, color: est.color }}>
                        {ESTADOS_PROSPECTO.map((e) => (
                          <option key={e.key} value={e.key}>{e.label}</option>
                        ))}
                      </select>
                    </div>
                    <span className="text-[10px]" style={{ color: "var(--subtle)" }}>
                      {formatDate(p.created_at)}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Detail panel */}
      {selected && (
        <DetailPanel
          empresa={selected}
          onClose={() => setSelected(null)}
          onUpdated={(updated) => {
            setEmpresas((prev) => prev.map((e) => e.id === updated.id ? updated : e))
            setSelected(updated)
          }}
        />
      )}

      {/* Create modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Nueva empresa">
        <form onSubmit={handleCreate} className="space-y-3">
          <Input label="Nombre *" value={newForm.nombre} onChange={setN("nombre")} required />
          <div className="grid grid-cols-2 gap-3">
            <Input label="RFC" value={newForm.rfc} onChange={setN("rfc")} />
            <Input label="Sector" value={newForm.sector} onChange={setN("sector")} />
          </div>
          <Input label="Ejecutivo de cuenta" value={newForm.ejecutivo_cuenta} onChange={setN("ejecutivo_cuenta")} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Teléfono" value={newForm.telefono} onChange={setN("telefono")} />
            <Input label="Email" type="email" value={newForm.email} onChange={setN("email")} />
          </div>
          <Input label="Ciudad" value={newForm.ciudad} onChange={setN("ciudad")} />
          <Textarea label="Servicios / coberturas" value={newForm.servicios} onChange={setN("servicios")} rows={2} />
          <Textarea label="Notas" value={newForm.notas} onChange={setN("notas")} rows={2} />
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="secondary" onClick={() => setCreateOpen(false)}>Cancelar</Button>
            <Button type="submit" loading={creating}>Crear empresa</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
