"use client"
import { useState, useEffect, useCallback } from "react"
import {
  Plus, QrCode, Copy, Check, ChevronDown, ChevronUp,
  TrendingUp, Users, DollarSign, Award, RefreshCw,
  Phone, Mail, MapPin, Building2, CreditCard, X, Send,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Modal } from "@/components/ui/modal"
import { Input, Select } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import QRCode from "react-qr-code"
import { GEO_ESTADOS } from "@/constants/geo-mx"

// ─── Types ────────────────────────────────────────────────────────────────────

interface Vendedor {
  id: number; nombre: string; apellido_paterno: string | null; apellido_materno: string | null
  telefono: string | null; telefono_alternativo: string | null; email: string | null
  codigo_unico: string; activo: boolean; fecha_registro: string; id_nivel: number | null
  rfc: string | null; curp: string | null; fecha_nacimiento: string | null
  calle: string | null; numero_exterior: string | null; colonia: string | null
  ciudad: string | null; estado: string | null; codigo_postal: string | null
  banco: string | null; titular_cuenta: string | null; numero_cuenta: string | null
  clabe: string | null; referencia_pago: string | null; notas: string | null
  niveles_comision: { nombre: string; monto: number } | null
}

interface VendedorStats {
  id_vendedor: number; nombre_vendedor: string; apellidos_vendedor: string
  codigo_unico: string; activo: boolean; nivel_nombre: string | null; nivel_monto: number | null
  total_leads: number; leads_activos: number; leads_ganados: number; leads_cerrados: number
  conversion_pct: number; monto_estimado: number; monto_ganado: number
  comisiones_total: number; comisiones_pagadas: number; comisiones_pendientes: number
  fuente_qr: number; fuente_formulario: number; fuente_whatsapp: number
  fuente_referido: number; fuente_llamada: number
  fecha_primer_lead: string | null; fecha_ultimo_lead: string | null
}

interface Nivel { id: number; nombre: string; monto: number }

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? ""

const EMPTY_FORM = {
  // Personales
  nombre: "", apellido_paterno: "", apellido_materno: "",
  telefono: "", telefono_alternativo: "", email: "",
  rfc: "", curp: "", fecha_nacimiento: "", id_nivel: "",
  // Dirección
  calle: "", numero_exterior: "", colonia: "", ciudad: "", estado: "", codigo_postal: "",
  // Datos bancarios
  banco: "", titular_cuenta: "", numero_cuenta: "", clabe: "", referencia_pago: "",
  notas: "",
}

// ─── Vendedor Form ────────────────────────────────────────────────────────────

function VendedorForm({
  initial, niveles, onSave, onCancel, saving,
}: {
  initial?: Partial<typeof EMPTY_FORM>
  niveles: Nivel[]
  onSave: (data: typeof EMPTY_FORM) => Promise<void>
  onCancel: () => void
  saving: boolean
}) {
  const [form, setForm] = useState({ ...EMPTY_FORM, ...initial })
  const [section, setSection] = useState<"personal"|"dir"|"banco">("personal")

  const set = (k: keyof typeof EMPTY_FORM) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }))

  const tabCls = (s: typeof section) =>
    `px-4 py-1.5 text-xs font-medium rounded-lg transition-colors ${section === s
      ? "text-white"
      : "hover:bg-[var(--surface-2)]"}`
  const tabStyle = (s: typeof section) => section === s
    ? { background: "var(--accent)" }
    : { color: "var(--muted)" }

  return (
    <form onSubmit={async e => { e.preventDefault(); await onSave(form) }} className="space-y-4">
      {/* Section tabs */}
      <div className="flex gap-1 p-1 rounded-xl border" style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}>
        <button type="button" className={tabCls("personal")} style={tabStyle("personal")} onClick={() => setSection("personal")}>
          Datos personales
        </button>
        <button type="button" className={tabCls("dir")} style={tabStyle("dir")} onClick={() => setSection("dir")}>
          Dirección
        </button>
        <button type="button" className={tabCls("banco")} style={tabStyle("banco")} onClick={() => setSection("banco")}>
          Datos bancarios
        </button>
      </div>

      {section === "personal" && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-3">
            <Input label="Nombre(s) *" value={form.nombre} onChange={set("nombre")} required
              style={{ textTransform: "uppercase" }} />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Apellido paterno" value={form.apellido_paterno} onChange={set("apellido_paterno")}
                style={{ textTransform: "uppercase" }} />
              <Input label="Apellido materno" value={form.apellido_materno} onChange={set("apellido_materno")}
                style={{ textTransform: "uppercase" }} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Teléfono *" value={form.telefono} onChange={set("telefono")} maxLength={10} required />
              <Input label="Teléfono alternativo" value={form.telefono_alternativo} onChange={set("telefono_alternativo")} maxLength={10} />
            </div>
            <Input label="Email" type="email" value={form.email} onChange={set("email")} />
            <div className="grid grid-cols-2 gap-3">
              <Input label="RFC" value={form.rfc} onChange={set("rfc")} maxLength={13}
                style={{ textTransform: "uppercase" }} />
              <Input label="CURP" value={form.curp} onChange={set("curp")} maxLength={18}
                style={{ textTransform: "uppercase" }} />
            </div>
            <Input label="Fecha de nacimiento" type="date" value={form.fecha_nacimiento} onChange={set("fecha_nacimiento")} />
            <Select label="Nivel de comisión" value={form.id_nivel} onChange={set("id_nivel")}>
              <option value="">Sin nivel</option>
              {niveles.map(n => (
                <option key={n.id} value={n.id}>{n.nombre} — ${n.monto.toLocaleString("es-MX")} MXN</option>
              ))}
            </Select>
          </div>
        </div>
      )}

      {section === "dir" && (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <Input label="Calle" value={form.calle} onChange={set("calle")}
                style={{ textTransform: "uppercase" }} />
            </div>
            <Input label="Número ext." value={form.numero_exterior} onChange={set("numero_exterior")}
              style={{ textTransform: "uppercase" }} />
          </div>
          <Input label="Colonia" value={form.colonia} onChange={set("colonia")}
            style={{ textTransform: "uppercase" }} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Ciudad / Municipio" value={form.ciudad} onChange={set("ciudad")}
              style={{ textTransform: "uppercase" }} />
            <Input label="C.P." value={form.codigo_postal} onChange={set("codigo_postal")} maxLength={5} />
          </div>
          <Select label="Estado" value={form.estado} onChange={set("estado")}>
            <option value="">Seleccionar...</option>
            {GEO_ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
          </Select>
        </div>
      )}

      {section === "banco" && (
        <div className="space-y-3">
          <p className="text-xs" style={{ color: "var(--subtle)" }}>
            Esta información se usa exclusivamente para el pago de comisiones.
          </p>
          <Input label="Banco" value={form.banco} onChange={set("banco")}
            placeholder="BBVA, BANAMEX, SANTANDER..." style={{ textTransform: "uppercase" }} />
          <Input label="Titular de la cuenta" value={form.titular_cuenta} onChange={set("titular_cuenta")}
            style={{ textTransform: "uppercase" }} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Número de cuenta" value={form.numero_cuenta} onChange={set("numero_cuenta")} maxLength={20} />
            <Input label="Referencia de pago" value={form.referencia_pago} onChange={set("referencia_pago")} />
          </div>
          <div>
            <Input label="CLABE interbancaria (18 dígitos)" value={form.clabe} onChange={set("clabe")}
              maxLength={18} placeholder="000000000000000000" />
            {form.clabe && form.clabe.length > 0 && form.clabe.length !== 18 && (
              <p className="text-xs mt-1" style={{ color: "#DC2626" }}>La CLABE debe tener exactamente 18 dígitos</p>
            )}
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: "var(--muted)" }}>Notas</label>
            <textarea rows={2} value={form.notas} onChange={set("notas")}
              className="w-full px-3 py-2 rounded-lg text-xs border outline-none resize-none"
              style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text)", textTransform: "uppercase" }} />
          </div>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2 border-t" style={{ borderColor: "var(--border)" }}>
        <Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" loading={saving}>Guardar vendedor</Button>
      </div>
    </form>
  )
}

// ─── Analytics table row ──────────────────────────────────────────────────────

function StatsRow({ s }: { s: VendedorStats }) {
  const [expanded, setExpanded] = useState(false)
  const fmtMXN = (n: number) => n > 0 ? `$${n.toLocaleString("es-MX", { minimumFractionDigits: 0 })}` : "—"
  const canales = [
    { label: "QR", n: s.fuente_qr },
    { label: "Formulario", n: s.fuente_formulario },
    { label: "WhatsApp", n: s.fuente_whatsapp },
    { label: "Referido", n: s.fuente_referido },
    { label: "Llamada", n: s.fuente_llamada },
  ].filter(c => c.n > 0)

  return (
    <>
      <tr className="border-t hover:bg-[var(--surface-2)] transition-colors cursor-pointer"
        style={{ borderColor: "var(--border)" }}
        onClick={() => setExpanded(v => !v)}>
        <td className="px-4 py-3">
          <div className="font-medium text-xs" style={{ color: "var(--text)" }}>
            {s.nombre_vendedor} {s.apellidos_vendedor}
          </div>
          <div className="font-mono text-xs" style={{ color: "var(--subtle)" }}>{s.codigo_unico}</div>
        </td>
        <td className="px-4 py-3">
          {s.nivel_nombre
            ? <Badge label={s.nivel_nombre} color="#059669" bg="#ECFDF5" size="sm" />
            : <span className="text-xs" style={{ color: "var(--subtle)" }}>—</span>}
        </td>
        <td className="px-4 py-3 text-center">
          <span className="text-sm font-bold tabular-nums" style={{ color: "var(--text)" }}>{s.total_leads}</span>
          <div className="text-xs" style={{ color: "var(--subtle)" }}>{s.leads_activos} activos</div>
        </td>
        <td className="px-4 py-3 text-center">
          <span className="text-sm font-bold tabular-nums"
            style={{ color: s.conversion_pct >= 30 ? "#059669" : s.conversion_pct >= 15 ? "#D97706" : "var(--text)" }}>
            {s.conversion_pct}%
          </span>
          <div className="text-xs" style={{ color: "var(--subtle)" }}>{s.leads_ganados} ganados</div>
        </td>
        <td className="px-4 py-3 text-right">
          <span className="text-xs font-semibold tabular-nums" style={{ color: "var(--text)" }}>
            {fmtMXN(s.monto_ganado)}
          </span>
          <div className="text-xs" style={{ color: "var(--subtle)" }}>{fmtMXN(s.monto_estimado)} pipeline</div>
        </td>
        <td className="px-4 py-3 text-right">
          <span className="text-xs font-bold tabular-nums" style={{ color: s.comisiones_pendientes > 0 ? "#D97706" : "var(--text)" }}>
            {fmtMXN(s.comisiones_pendientes)}
          </span>
          <div className="text-xs" style={{ color: "var(--subtle)" }}>{fmtMXN(s.comisiones_pagadas)} pagado</div>
        </td>
        <td className="px-4 py-3 text-center">
          {expanded ? <ChevronUp size={14} style={{ color: "var(--subtle)" }} /> : <ChevronDown size={14} style={{ color: "var(--subtle)" }} />}
        </td>
      </tr>
      {expanded && (
        <tr className="border-t" style={{ borderColor: "var(--border)" }}>
          <td colSpan={7} className="px-4 py-3" style={{ background: "var(--surface-2)" }}>
            <div className="flex flex-wrap gap-6 text-xs">
              <div>
                <p className="font-semibold mb-1" style={{ color: "var(--subtle)" }}>Canales</p>
                <div className="flex flex-wrap gap-2">
                  {canales.length > 0
                    ? canales.map(c => (
                        <span key={c.label} className="px-2 py-0.5 rounded-full font-medium"
                          style={{ background: "var(--surface)", color: "var(--text)" }}>
                          {c.label}: <strong>{c.n}</strong>
                        </span>
                      ))
                    : <span style={{ color: "var(--subtle)" }}>Sin datos</span>}
                </div>
              </div>
              <div>
                <p className="font-semibold mb-1" style={{ color: "var(--subtle)" }}>Comisiones</p>
                <p style={{ color: "var(--muted)" }}>
                  Total generadas: <strong>{fmtMXN(s.comisiones_total)}</strong>
                  {" · "} Pendientes: <strong style={{ color: "#D97706" }}>{fmtMXN(s.comisiones_pendientes)}</strong>
                  {" · "} Pagadas: <strong style={{ color: "#059669" }}>{fmtMXN(s.comisiones_pagadas)}</strong>
                </p>
              </div>
              {s.fecha_primer_lead && (
                <div>
                  <p className="font-semibold mb-1" style={{ color: "var(--subtle)" }}>Actividad</p>
                  <p style={{ color: "var(--muted)" }}>
                    Primer lead: {new Date(s.fecha_primer_lead).toLocaleDateString("es-MX")}
                    {s.fecha_ultimo_lead && <> · Último: {new Date(s.fecha_ultimo_lead).toLocaleDateString("es-MX")}</>}
                  </p>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function VendedoresPage() {
  const [tab, setTab] = useState<"lista"|"analitica">("lista")
  const [vendedores, setVendedores] = useState<Vendedor[]>([])
  const [niveles, setNiveles] = useState<Nivel[]>([])
  const [stats, setStats] = useState<VendedorStats[]>([])
  const [statsLoading, setStatsLoading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editVendedor, setEditVendedor] = useState<Vendedor | null>(null)
  const [qrVendedor, setQrVendedor] = useState<Vendedor | null>(null)
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState<number | null>(null)
  const [sending, setSending] = useState<number | null>(null)
  const [sent, setSent] = useState<number | null>(null)
  const [fechaDesde, setFechaDesde] = useState("")
  const [fechaHasta, setFechaHasta] = useState("")

  useEffect(() => {
    Promise.all([
      fetch("/api/vendedores").then(r => r.json()),
      fetch("/api/admin/niveles").then(r => r.json()).catch(() => ({ data: [] })),
    ]).then(([v, n]) => {
      setVendedores(v.data ?? [])
      setNiveles(n.data ?? [])
      setLoading(false)
    })
  }, [])

  const fetchStats = useCallback(async () => {
    setStatsLoading(true)
    const params = new URLSearchParams()
    if (fechaDesde) params.set("fecha_desde", fechaDesde)
    if (fechaHasta) params.set("fecha_hasta", fechaHasta)
    const r = await fetch(`/api/vendedores/stats?${params}`)
    if (r.ok) { const j = await r.json(); setStats(j.data ?? []) }
    setStatsLoading(false)
  }, [fechaDesde, fechaHasta])

  useEffect(() => { if (tab === "analitica") fetchStats() }, [tab, fetchStats])

  async function handleCreate(data: typeof EMPTY_FORM) {
    setSaving(true)
    const res = await fetch("/api/vendedores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (res.ok) {
      const { data: v } = await res.json()
      setVendedores(prev => [v, ...prev])
      setModalOpen(false)
    }
    setSaving(false)
  }

  async function handleEdit(data: typeof EMPTY_FORM) {
    if (!editVendedor) return
    setSaving(true)
    const res = await fetch(`/api/vendedores/${editVendedor.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (res.ok) {
      const { data: v } = await res.json()
      setVendedores(prev => prev.map(vv => vv.id === v.id ? v : vv))
      setEditVendedor(null)
    }
    setSaving(false)
  }

  function copyLink(v: Vendedor) {
    navigator.clipboard.writeText(`${APP_URL}/r/${v.codigo_unico}`)
    setCopied(v.id); setTimeout(() => setCopied(null), 1500)
  }

  async function sendWelcome(v: Vendedor) {
    if (!v.email) { alert("Este vendedor no tiene email registrado."); return }
    setSending(v.id)
    const res = await fetch(`/api/vendedores/${v.id}/enviar-bienvenida`, { method: "POST" })
    setSending(null)
    if (res.ok) { setSent(v.id); setTimeout(() => setSent(null), 3000) }
    else { const j = await res.json(); alert(j.error ?? "Error al enviar") }
  }

  const tabCls = (t: typeof tab) =>
    `px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === t ? "border-[var(--accent)]" : "border-transparent hover:border-[var(--border)]"}`
  const tabStyle = (t: typeof tab) => ({ color: tab === t ? "var(--accent)" : "var(--muted)" })

  const totalComisionesPendientes = stats.reduce((s, v) => s + (v.comisiones_pendientes ?? 0), 0)
  const totalLeads = stats.reduce((s, v) => s + (v.total_leads ?? 0), 0)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-base sm:text-lg font-semibold" style={{ color: "var(--text)" }}>Vendedores</h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--subtle)" }}>
            {vendedores.length} registrados · GMM
          </p>
        </div>
        <Button size="sm" onClick={() => setModalOpen(true)}>
          <Plus size={13} /><span className="hidden sm:inline">Nuevo vendedor</span><span className="sm:hidden">Nuevo</span>
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex border-b" style={{ borderColor: "var(--border)" }}>
        <button className={tabCls("lista")} style={tabStyle("lista")} onClick={() => setTab("lista")}>
          Lista de vendedores
        </button>
        <button className={tabCls("analitica")} style={tabStyle("analitica")} onClick={() => setTab("analitica")}>
          Analítica de rendimiento
        </button>
      </div>

      {/* ── LISTA ── */}
      {tab === "lista" && (
        <>
          {/* Móvil: tarjetas */}
          <div className="sm:hidden space-y-2">
            {loading && <div className="text-center py-10 text-xs" style={{ color: "var(--subtle)" }}>Cargando...</div>}
            {!loading && vendedores.length === 0 && (
              <div className="text-center py-12 text-xs" style={{ color: "var(--subtle)" }}>Sin vendedores</div>
            )}
            {vendedores.map(v => (
              <div key={v.id} className="p-4 rounded-xl border" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                      {v.nombre} {v.apellido_paterno ?? ""} {v.apellido_materno ?? ""}
                    </p>
                    <p className="font-mono text-xs mt-0.5 font-semibold" style={{ color: "var(--accent)" }}>{v.codigo_unico}</p>
                  </div>
                  <Badge label={v.activo ? "Activo" : "Inactivo"} color={v.activo ? "#059669" : "#6B7280"} bg={v.activo ? "#ECFDF5" : "#F9FAFB"} size="sm" />
                </div>
                {v.telefono && <p className="text-xs" style={{ color: "var(--muted)" }}>{v.telefono}</p>}
                {v.niveles_comision && (
                  <p className="text-xs mt-1" style={{ color: "var(--subtle)" }}>
                    {v.niveles_comision.nombre} · ${v.niveles_comision.monto.toLocaleString("es-MX")} MXN
                  </p>
                )}
                <div className="flex items-center gap-2 mt-3 pt-3 border-t" style={{ borderColor: "var(--border)" }}>
                  <button onClick={() => copyLink(v)} className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-lg text-xs border transition-colors"
                    style={{ borderColor: "var(--border)", color: copied === v.id ? "#059669" : "var(--muted)" }}>
                    {copied === v.id ? <Check size={12} /> : <Copy size={12} />} Copiar link
                  </button>
                  <button onClick={() => setQrVendedor(v)} className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-lg text-xs border transition-colors"
                    style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
                    <QrCode size={12} /> QR
                  </button>
                  <button onClick={() => sendWelcome(v)} disabled={sending === v.id}
                    className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-lg text-xs border transition-colors"
                    style={{ borderColor: "var(--border)", color: sent === v.id ? "#059669" : "var(--muted)" }}>
                    {sent === v.id ? <Check size={12} /> : <Send size={12} className={sending === v.id ? "animate-pulse" : ""} />}
                    {sent === v.id ? "Enviado" : "Email"}
                  </button>
                  <button onClick={() => setEditVendedor(v)} className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-lg text-xs border transition-colors"
                    style={{ borderColor: "var(--border)", color: "var(--accent)" }}>
                    ✎ Editar
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Tablet/Desktop: tabla */}
          <div className="hidden sm:block rounded-xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: "var(--surface-2)", borderBottom: "1px solid var(--border)" }}>
                  {["Vendedor", "Contacto", "Código", "Nivel", "Estado", "Acciones"].map(h => (
                    <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wide"
                      style={{ color: "var(--subtle)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading && <tr><td colSpan={6} className="text-center py-10 text-xs" style={{ color: "var(--subtle)" }}>Cargando...</td></tr>}
                {!loading && vendedores.length === 0 && (
                  <tr><td colSpan={6} className="text-center py-12 text-xs" style={{ color: "var(--subtle)" }}>Sin vendedores</td></tr>
                )}
                {vendedores.map(v => (
                  <tr key={v.id} className="border-t hover:bg-[var(--surface-2)] transition-colors"
                    style={{ borderColor: "var(--border)" }}>
                    <td className="px-4 py-3">
                      <div className="font-medium text-xs" style={{ color: "var(--text)" }}>
                        {v.nombre} {v.apellido_paterno ?? ""} {v.apellido_materno ?? ""}
                      </div>
                      {v.banco && (
                        <div className="text-xs flex items-center gap-1 mt-0.5" style={{ color: "var(--subtle)" }}>
                          <CreditCard size={10} /> {v.banco} {v.clabe ? `··· ${v.clabe.slice(-4)}` : ""}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs" style={{ color: "var(--muted)" }}>{v.telefono ?? "—"}</div>
                      <div className="text-xs" style={{ color: "var(--subtle)" }}>{v.email ?? "—"}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs font-semibold" style={{ color: "var(--accent)" }}>{v.codigo_unico}</span>
                    </td>
                    <td className="px-4 py-3">
                      {v.niveles_comision
                        ? <Badge label={`${v.niveles_comision.nombre} — $${v.niveles_comision.monto.toLocaleString("es-MX")}`} color="#059669" bg="#ECFDF5" size="sm" />
                        : <span className="text-xs" style={{ color: "var(--subtle)" }}>Sin nivel</span>}
                    </td>
                    <td className="px-4 py-3">
                      <Badge label={v.activo ? "Activo" : "Inactivo"} color={v.activo ? "#059669" : "#6B7280"} bg={v.activo ? "#ECFDF5" : "#F9FAFB"} size="sm" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => copyLink(v)} className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors hover:bg-[var(--surface-2)]"
                          style={{ color: copied === v.id ? "var(--positive)" : "var(--muted)" }} title="Copiar enlace">
                          {copied === v.id ? <Check size={12} /> : <Copy size={12} />}
                        </button>
                        <button onClick={() => setQrVendedor(v)} className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors hover:bg-[var(--surface-2)]"
                          style={{ color: "var(--muted)" }} title="Ver QR"><QrCode size={12} /></button>
                        <button onClick={() => sendWelcome(v)} disabled={sending === v.id}
                          className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors hover:bg-[var(--surface-2)]"
                          style={{ color: sent === v.id ? "var(--positive)" : "var(--muted)" }}
                          title={v.email ? "Enviar email de bienvenida" : "Sin email registrado"}>
                          {sent === v.id ? <Check size={12} /> : <Send size={12} className={sending === v.id ? "animate-pulse" : ""} />}
                        </button>
                        <button onClick={() => setEditVendedor(v)} className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors hover:bg-[var(--surface-2)] text-xs font-medium"
                          style={{ color: "var(--accent)" }} title="Editar">✎</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── ANALÍTICA ── */}
      {tab === "analitica" && (
        <div className="space-y-4">
          {/* Filtros de fecha */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-xs" style={{ color: "var(--subtle)" }}>Del</span>
              <input type="date" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)}
                className="h-8 px-3 rounded-lg text-xs border outline-none"
                style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text)" }} />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs" style={{ color: "var(--subtle)" }}>al</span>
              <input type="date" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)}
                className="h-8 px-3 rounded-lg text-xs border outline-none"
                style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text)" }} />
            </div>
            <button onClick={fetchStats}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--surface-2)] transition-colors"
              style={{ color: "var(--muted)" }}>
              <RefreshCw size={13} className={statsLoading ? "animate-spin" : ""} />
            </button>
          </div>

          {/* KPI Summary */}
          {stats.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { icon: <Users size={14}/>, label: "Total leads", val: totalLeads.toLocaleString(), sub: `${vendedores.length} vendedores` },
                { icon: <Award size={14}/>, label: "Mejor conversión",
                  val: stats[0]?.conversion_pct + "%",
                  sub: stats[0]?.nombre_vendedor },
                { icon: <DollarSign size={14}/>, label: "Comisiones pendientes",
                  val: `$${totalComisionesPendientes.toLocaleString("es-MX")}`,
                  sub: "por aprobar / pagar" },
                { icon: <TrendingUp size={14}/>, label: "Comisión más alta",
                  val: `$${Math.max(...stats.map(s => s.nivel_monto ?? 0)).toLocaleString("es-MX")}`,
                  sub: "monto por conversión" },
              ].map(({ icon, label, val, sub }) => (
                <div key={label} className="p-4 rounded-xl border" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
                  <div className="flex items-center gap-1.5 mb-2">
                    <span style={{ color: "var(--subtle)" }}>{icon}</span>
                    <span className="text-xs uppercase tracking-wide font-medium" style={{ color: "var(--subtle)" }}>{label}</span>
                  </div>
                  <p className="text-xl font-bold" style={{ color: "var(--text)" }}>{val}</p>
                  <p className="text-xs mt-0.5 truncate" style={{ color: "var(--subtle)" }}>{sub}</p>
                </div>
              ))}
            </div>
          )}

          {/* Tabla de rendimiento */}
          <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: "var(--surface-2)", borderBottom: "1px solid var(--border)" }}>
                    {["Vendedor", "Nivel", "Leads", "Conversión", "Monto ganado", "Comisión pendiente", ""].map(h => (
                      <th key={h} className={`text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wide ${["Conversión","Leads"].includes(h) ? "text-center" : ["Monto ganado","Comisión pendiente"].includes(h) ? "text-right" : ""}`}
                        style={{ color: "var(--subtle)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {statsLoading && (
                    <tr><td colSpan={7} className="text-center py-10 text-xs" style={{ color: "var(--subtle)" }}>Cargando analítica...</td></tr>
                  )}
                  {!statsLoading && stats.length === 0 && (
                    <tr><td colSpan={7} className="text-center py-12 text-xs" style={{ color: "var(--subtle)" }}>Sin datos</td></tr>
                  )}
                  {stats.map(s => <StatsRow key={s.id_vendedor} s={s} />)}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal crear vendedor */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nuevo vendedor" size="lg">
        <VendedorForm niveles={niveles} onSave={handleCreate} onCancel={() => setModalOpen(false)} saving={saving} />
      </Modal>

      {/* Modal editar vendedor */}
      <Modal open={!!editVendedor} onClose={() => setEditVendedor(null)} title="Editar vendedor" size="lg">
        {editVendedor && (
          <VendedorForm
            initial={{
              nombre: editVendedor.nombre, apellido_paterno: editVendedor.apellido_paterno ?? "",
              apellido_materno: editVendedor.apellido_materno ?? "",
              telefono: editVendedor.telefono ?? "", telefono_alternativo: editVendedor.telefono_alternativo ?? "",
              email: editVendedor.email ?? "", rfc: editVendedor.rfc ?? "", curp: editVendedor.curp ?? "",
              fecha_nacimiento: editVendedor.fecha_nacimiento ?? "",
              id_nivel: editVendedor.id_nivel?.toString() ?? "",
              calle: editVendedor.calle ?? "", numero_exterior: editVendedor.numero_exterior ?? "",
              colonia: editVendedor.colonia ?? "", ciudad: editVendedor.ciudad ?? "",
              estado: editVendedor.estado ?? "", codigo_postal: editVendedor.codigo_postal ?? "",
              banco: editVendedor.banco ?? "", titular_cuenta: editVendedor.titular_cuenta ?? "",
              numero_cuenta: editVendedor.numero_cuenta ?? "", clabe: editVendedor.clabe ?? "",
              referencia_pago: editVendedor.referencia_pago ?? "", notas: editVendedor.notas ?? "",
            }}
            niveles={niveles}
            onSave={handleEdit}
            onCancel={() => setEditVendedor(null)}
            saving={saving}
          />
        )}
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
              <Copy size={12} /> Copiar enlace
            </Button>
          </div>
        )}
      </Modal>
    </div>
  )
}
