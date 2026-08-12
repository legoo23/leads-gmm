"use client"
import { useState, useEffect } from "react"
import QRCode from "react-qr-code"
import {
  Users, DollarSign, Calendar, TrendingUp,
  Copy, Check, Download, Share2, Filter,
  Clock, CheckCircle2, XCircle, AlertCircle,
} from "lucide-react"

// ─── tipos ───────────────────────────────────────────────────────────────────
type NivelComision = { id: number; nombre: string; monto: number }
type VendorProfile = {
  id: number
  nombre: string
  apellido_paterno?: string
  codigo_unico: string
  activo: boolean
  niveles_comision?: NivelComision
}
type VendorLead = {
  folio: string
  nombre: string
  procedimiento: string | null
  fecha_captura: string
  etapa_label: string
  etapa_color: string
  etapa_bg: string
  comision: { monto: number; estado: string; fecha: string } | null
}
type PeriodoActual = {
  label: string
  acumulado: number
  count: number
  abierto: boolean
  corte_dia: number
  dias_restantes: number
  pago_en: string
}
type HistorialItem = {
  periodo_label: string
  monto_total: number
  monto_pagado: number
  monto_pendiente: number
  count: number
  estado: string
}
type CommissionData = {
  periodo_actual: PeriodoActual
  total_pagado: number
  historial: HistorialItem[]
}
type Campana = {
  id: number
  nombre: string
  procedimiento?: string
  fecha_fin?: string
}

// ─── helpers ─────────────────────────────────────────────────────────────────
function formatMXN(n: number | null | undefined) {
  if (n == null) return "$0"
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n)
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
  })
}

const COMISION_ESTADO: Record<string, { label: string; color: string; bg: string }> = {
  pendiente: { label: "Pendiente", color: "#D97706", bg: "#FFFBEB" },
  aprobada:  { label: "Aprobada",  color: "#059669", bg: "#ECFDF5" },
  pagada:    { label: "Pagada",    color: "#2563EB", bg: "#DBEAFE" },
  cancelada: { label: "Cancelada", color: "#6B7280", bg: "#F3F4F6" },
}

const ETAPA_FILTERS = ["Todos", "Recibido", "Contactado", "En Proceso", "En Validación", "Programado", "No Procedió"]

// ─── sub-componentes simples ──────────────────────────────────────────────────
function CopyBtn({ text, label = "Copiar" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false)
  const handle = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button onClick={handle}
      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0"
      style={{ background: "var(--surface-2)", color: "var(--text)" }}>
      {copied ? <Check size={11} /> : <Copy size={11} />}
      {copied ? "Copiado" : label}
    </button>
  )
}

function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-lg ${className}`}
      style={{ background: "var(--surface-2)" }} />
  )
}

// ─── PÁGINA PRINCIPAL ─────────────────────────────────────────────────────────
export default function MiPanelPage() {
  const [tab, setTab] = useState<"leads" | "comisiones" | "codigo">("leads")
  const [profile, setProfile] = useState<VendorProfile | null>(null)
  const [allLeads, setAllLeads] = useState<VendorLead[]>([])
  const [commissions, setCommissions] = useState<CommissionData | null>(null)
  const [campaigns, setCampaigns] = useState<Campana[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // filtros (client-side)
  const [etapaFilter, setEtapaFilter] = useState("Todos")
  const [comisionFilter, setComisionFilter] = useState("todas")

  useEffect(() => {
    Promise.all([
      fetch("/api/vendedor/me").then(r => r.json()),
      fetch("/api/vendedor/leads").then(r => r.json()),
      fetch("/api/vendedor/comisiones").then(r => r.json()),
      fetch("/api/vendedor/campanas").then(r => r.json()),
    ]).then(([me, leadsData, comisData, campanasData]) => {
      if (me.error) { setError(me.error); setLoading(false); return }
      setProfile(me.data ?? null)
      setAllLeads(leadsData.data ?? [])
      setCommissions(comisData.periodo_actual ? comisData : null)
      setCampaigns(campanasData.data ?? [])
      setLoading(false)
    }).catch(() => { setError("Error de conexión"); setLoading(false) })
  }, [])

  // filtrado local
  const filteredLeads = allLeads.filter((l) => {
    const etapaOk = etapaFilter === "Todos" || l.etapa_label === etapaFilter
    const comisionOk =
      comisionFilter === "todas"        ? true :
      comisionFilter === "con_comision" ? l.comision !== null :
      comisionFilter === "sin_comision" ? l.comision === null :
      l.comision?.estado === comisionFilter
    return etapaOk && comisionOk
  })

  const referralUrl = profile
    ? `${process.env.NEXT_PUBLIC_APP_URL}/r/${profile.codigo_unico}`
    : ""

  const downloadQR = () => {
    const svgEl = document.querySelector("#vendor-qr svg") as SVGElement | null
    if (!svgEl) return
    const svgData = new XMLSerializer().serializeToString(svgEl)
    const canvas = document.createElement("canvas")
    canvas.width = 500; canvas.height = 500
    const img = new Image()
    img.onload = () => {
      const ctx = canvas.getContext("2d")!
      ctx.fillStyle = "#ffffff"
      ctx.fillRect(0, 0, 500, 500)
      ctx.drawImage(img, 30, 30, 440, 440)
      const a = document.createElement("a")
      a.download = `QR-${profile?.codigo_unico ?? "vendedor"}.png`
      a.href = canvas.toDataURL("image/png")
      a.click()
    }
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)))
  }

  const shareWhatsApp = () => {
    const msg = encodeURIComponent(
      `¡Hola! ¿Tienes Seguro de Gastos Médicos Mayores y necesitas una cirugía?\n` +
      `Podemos ayudarte a validar tu cobertura y coordinar todo el proceso. 🏥\n\n` +
      `Regístrate aquí 👇\n${referralUrl}`
    )
    window.open(`https://wa.me/?text=${msg}`, "_blank")
  }

  const periodo = commissions?.periodo_actual

  // ─── Error / Not Found ────────────────────────────────────────────────────
  if (!loading && error) {
    return (
      <div className="flex flex-col items-center py-20 gap-3">
        <AlertCircle size={32} style={{ color: "var(--negative)" }} />
        <p className="text-sm" style={{ color: "var(--muted)" }}>{error}</p>
        <p className="text-xs" style={{ color: "var(--subtle)" }}>
          Contacta al administrador si el problema persiste.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">

      {/* ─── HEADER ─────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
      ) : profile ? (
        <div>
          <h1 className="text-base sm:text-lg font-semibold" style={{ color: "var(--text)" }}>
            Hola, {profile.nombre}{profile.apellido_paterno ? ` ${profile.apellido_paterno}` : ""} 👋
          </h1>
          <div className="flex flex-wrap items-center gap-1.5 mt-1">
            <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-full"
              style={{ background: "var(--accent-bg)", color: "var(--accent)" }}>
              {profile.codigo_unico}
            </span>
            {profile.niveles_comision && (
              <span className="text-xs px-2 py-0.5 rounded-full"
                style={{ background: "var(--surface-2)", color: "var(--muted)" }}>
                {profile.niveles_comision.nombre} · {formatMXN(profile.niveles_comision.monto)} por conversión
              </span>
            )}
          </div>
        </div>
      ) : null}

      {/* ─── BANNER PERÍODO DE COMISIÓN ──────────────────────────────────── */}
      {loading ? (
        <Skeleton className="h-24 w-full" />
      ) : periodo ? (
        <div
          className="rounded-2xl p-4 sm:p-5 border"
          style={{
            background: periodo.abierto
              ? "linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)"
              : "linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)",
            borderColor: periodo.abierto ? "#A7F3D0" : "#BFDBFE",
          }}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-1.5 mb-1">
                <Calendar size={12} style={{ color: periodo.abierto ? "#059669" : "#2563EB" }} />
                <span className="text-xs font-semibold uppercase tracking-wide"
                  style={{ color: periodo.abierto ? "#047857" : "#1D4ED8" }}>
                  Del 1 al 23 de {periodo.label}
                </span>
                <span className="text-xs px-1.5 py-0.5 rounded-full font-semibold"
                  style={{
                    background: periodo.abierto ? "#A7F3D0" : "#BFDBFE",
                    color: periodo.abierto ? "#065F46" : "#1E40AF",
                  }}>
                  {periodo.abierto ? `Abierto · ${periodo.dias_restantes} días` : "Cerrado"}
                </span>
              </div>

              <div className="text-3xl sm:text-4xl font-bold tabular-nums"
                style={{ color: periodo.abierto ? "#059669" : "#2563EB" }}>
                {formatMXN(periodo.acumulado)}
              </div>

              <div className="text-xs mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5"
                style={{ color: periodo.abierto ? "#065F46" : "#1E40AF" }}>
                <span>
                  {periodo.count} {periodo.count === 1 ? "lead convertido" : "leads convertidos"}
                </span>
                <span>
                  Pago programado para <strong>{periodo.pago_en}</strong>
                </span>
              </div>
            </div>

            <div className="text-right shrink-0">
              <div className="text-xs font-medium" style={{ color: periodo.abierto ? "#047857" : "#1D4ED8" }}>
                {periodo.abierto ? "Sigue sumando" : "Pendiente de pago"}
              </div>
              {commissions && commissions.total_pagado > 0 && (
                <div className="text-xs mt-1" style={{ color: periodo.abierto ? "#065F46" : "#1E40AF" }}>
                  Total histórico pagado<br />
                  <strong className="text-sm tabular-nums">{formatMXN(commissions.total_pagado)}</strong>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {/* ─── TABS ─────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: "var(--surface-2)" }}>
        {([
          { key: "leads",     label: "Mis Leads" },
          { key: "comisiones", label: "Comisiones" },
          { key: "codigo",    label: "Mi Código" },
        ] as const).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className="flex-1 py-1.5 px-2 sm:px-4 rounded-lg text-xs sm:text-sm font-medium transition-all"
            style={{
              background: tab === key ? "var(--surface)" : "transparent",
              color:      tab === key ? "var(--text)" : "var(--subtle)",
              boxShadow:  tab === key ? "var(--shadow)" : "none",
            }}>
            {label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          TAB: MIS LEADS
      ══════════════════════════════════════════════════════════════════════ */}
      {tab === "leads" && (
        <div className="space-y-3">

          {/* Filtros */}
          <div className="space-y-2">
            <div className="flex flex-wrap gap-1.5">
              {ETAPA_FILTERS.map((etapa) => (
                <button
                  key={etapa}
                  onClick={() => setEtapaFilter(etapa)}
                  className="px-3 py-1 rounded-full text-xs font-medium transition-all border"
                  style={{
                    background:  etapaFilter === etapa ? "var(--accent)" : "var(--surface)",
                    color:       etapaFilter === etapa ? "white" : "var(--muted)",
                    borderColor: etapaFilter === etapa ? "var(--accent)" : "var(--border)",
                  }}>
                  {etapa}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Filter size={11} style={{ color: "var(--subtle)" }} />
              <span className="text-xs" style={{ color: "var(--subtle)" }}>Comisión:</span>
              {[
                { value: "todas",        label: "Todas" },
                { value: "con_comision", label: "Con comisión" },
                { value: "pagada",       label: "Pagadas" },
                { value: "pendiente",    label: "Pendientes" },
                { value: "sin_comision", label: "Sin comisión" },
              ].map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setComisionFilter(value)}
                  className="px-2.5 py-0.5 rounded-full text-xs transition-all border"
                  style={{
                    background:  comisionFilter === value ? "var(--surface-2)" : "transparent",
                    color:       comisionFilter === value ? "var(--text)" : "var(--subtle)",
                    borderColor: comisionFilter === value ? "var(--border)" : "transparent",
                    fontWeight:  comisionFilter === value ? 600 : 400,
                  }}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          <p className="text-xs" style={{ color: "var(--subtle)" }}>
            {filteredLeads.length} {filteredLeads.length === 1 ? "lead" : "leads"}
            {filteredLeads.length !== allLeads.length && ` de ${allLeads.length} totales`}
          </p>

          {/* Vista móvil: tarjetas */}
          <div className="sm:hidden space-y-2">
            {loading && [1,2,3].map(i => <Skeleton key={i} className="h-20 w-full" />)}
            {!loading && filteredLeads.length === 0 && (
              <div className="text-center py-12">
                <Users size={28} className="mx-auto mb-2" style={{ color: "var(--border)" }} />
                <p className="text-xs" style={{ color: "var(--subtle)" }}>
                  {allLeads.length === 0
                    ? "Aún no tienes leads. Comparte tu código para empezar."
                    : "Sin resultados para los filtros seleccionados."}
                </p>
              </div>
            )}
            {filteredLeads.map((lead, i) => {
              const com = lead.comision
                ? (COMISION_ESTADO[lead.comision.estado] ?? COMISION_ESTADO.pendiente)
                : null
              return (
                <div key={i} className="p-3.5 rounded-xl border space-y-2.5"
                  style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold truncate" style={{ color: "var(--text)" }}>
                        {lead.nombre}
                      </div>
                      <div className="text-xs mt-0.5 truncate" style={{ color: "var(--muted)" }}>
                        {lead.procedimiento ?? "Sin procedimiento especificado"}
                      </div>
                    </div>
                    <span className="text-xs font-mono font-semibold shrink-0"
                      style={{ color: "var(--accent)" }}>
                      {lead.folio}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ background: lead.etapa_bg, color: lead.etapa_color }}>
                      {lead.etapa_label}
                    </span>
                    {com && lead.comision ? (
                      <span className="text-xs font-semibold tabular-nums"
                        style={{ color: com.color }}>
                        {formatMXN(lead.comision.monto)} · {com.label}
                      </span>
                    ) : (
                      <span className="text-xs" style={{ color: "var(--subtle)" }}>
                        {formatDate(lead.fecha_captura)}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Vista tablet/desktop: tabla */}
          <div className="hidden sm:block rounded-xl border overflow-hidden"
            style={{ borderColor: "var(--border)" }}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: "var(--surface-2)", borderBottom: "1px solid var(--border)" }}>
                    {["Folio", "Paciente", "Procedimiento", "Estado", "Fecha", "Comisión"].map(h => (
                      <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wide"
                        style={{ color: "var(--subtle)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading && (
                    <tr><td colSpan={6} className="px-4 py-8">
                      <div className="space-y-2">
                        {[1,2,3].map(i => <Skeleton key={i} className="h-5 w-full" />)}
                      </div>
                    </td></tr>
                  )}
                  {!loading && filteredLeads.length === 0 && (
                    <tr><td colSpan={6} className="text-center py-12">
                      <Users size={28} className="mx-auto mb-2" style={{ color: "var(--border)" }} />
                      <p className="text-xs" style={{ color: "var(--subtle)" }}>
                        {allLeads.length === 0
                          ? "Aún no tienes leads. Comparte tu código para empezar."
                          : "Sin resultados para los filtros seleccionados."}
                      </p>
                    </td></tr>
                  )}
                  {filteredLeads.map((lead, i) => {
                    const com = lead.comision
                      ? (COMISION_ESTADO[lead.comision.estado] ?? COMISION_ESTADO.pendiente)
                      : null
                    return (
                      <tr key={i} className="border-t transition-colors hover:bg-[var(--surface-2)]"
                        style={{ borderColor: "var(--border)" }}>
                        <td className="px-4 py-3">
                          <span className="font-mono text-xs font-semibold"
                            style={{ color: "var(--accent)" }}>{lead.folio}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs font-medium"
                            style={{ color: "var(--text)" }}>{lead.nombre}</span>
                        </td>
                        <td className="px-4 py-3 max-w-[180px]">
                          <span className="text-xs line-clamp-1"
                            style={{ color: "var(--muted)" }}>{lead.procedimiento ?? "—"}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                            style={{ background: lead.etapa_bg, color: lead.etapa_color }}>
                            {lead.etapa_label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs tabular-nums"
                            style={{ color: "var(--subtle)" }}>{formatDate(lead.fecha_captura)}</span>
                        </td>
                        <td className="px-4 py-3">
                          {com && lead.comision ? (
                            <div>
                              <div className="text-xs font-semibold tabular-nums"
                                style={{ color: com.color }}>{formatMXN(lead.comision.monto)}</div>
                              <div className="text-xs" style={{ color: com.color }}>{com.label}</div>
                            </div>
                          ) : (
                            <span className="text-xs" style={{ color: "var(--subtle)" }}>—</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB: COMISIONES
      ══════════════════════════════════════════════════════════════════════ */}
      {tab === "comisiones" && (
        <div className="space-y-4">

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              {
                label: "Total cobrado",
                value: formatMXN(commissions?.total_pagado),
                icon: DollarSign,
                color: "#2563EB",
                bg: "#EFF6FF",
              },
              {
                label: "Este periodo",
                value: formatMXN(commissions?.periodo_actual.acumulado),
                icon: TrendingUp,
                color: "#059669",
                bg: "#ECFDF5",
              },
              {
                label: "Leads convertidos",
                value: allLeads.filter(l => l.comision !== null).length,
                icon: CheckCircle2,
                color: "#7C3AED",
                bg: "#F5F3FF",
              },
            ].map(({ label, value, icon: Icon, color, bg }) => (
              <div key={label} className="rounded-xl border p-4 col-span-1"
                style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center mb-2"
                  style={{ background: bg }}>
                  <Icon size={14} style={{ color }} />
                </div>
                <div className="text-lg sm:text-xl font-bold tabular-nums" style={{ color }}>
                  {value}
                </div>
                <div className="text-xs mt-0.5" style={{ color: "var(--subtle)" }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Historial de periodos */}
          {commissions && commissions.historial.length > 0 ? (
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wide mb-2"
                style={{ color: "var(--muted)" }}>
                Historial de periodos anteriores
              </h2>

              {/* Mobile: tarjetas */}
              <div className="sm:hidden space-y-2">
                {commissions.historial.map((h, i) => {
                  const s =
                    h.estado === "pagado"   ? { label: "Pagado",   color: "#2563EB", bg: "#DBEAFE", Icon: CheckCircle2 } :
                    h.estado === "aprobado" ? { label: "Aprobado", color: "#059669", bg: "#ECFDF5", Icon: CheckCircle2 } :
                                             { label: "Pendiente", color: "#D97706", bg: "#FFFBEB", Icon: Clock }
                  return (
                    <div key={i} className="flex items-center justify-between px-4 py-3 rounded-xl border"
                      style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
                      <div>
                        <div className="text-sm font-medium capitalize" style={{ color: "var(--text)" }}>
                          {h.periodo_label}
                        </div>
                        <div className="text-xs" style={{ color: "var(--muted)" }}>
                          {h.count} {h.count === 1 ? "lead" : "leads"}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold tabular-nums" style={{ color: "var(--text)" }}>
                          {formatMXN(h.monto_total)}
                        </div>
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{ background: s.bg, color: s.color }}>
                          {s.label}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Desktop: tabla */}
              <div className="hidden sm:block rounded-xl border overflow-hidden"
                style={{ borderColor: "var(--border)" }}>
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ background: "var(--surface-2)", borderBottom: "1px solid var(--border)" }}>
                      {["Periodo", "Leads", "Acumulado", "Pagado", "Pendiente", "Estado"].map(h => (
                        <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wide"
                          style={{ color: "var(--subtle)" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {commissions.historial.map((h, i) => {
                      const s =
                        h.estado === "pagado"   ? { label: "Pagado",   color: "#2563EB", bg: "#DBEAFE" } :
                        h.estado === "aprobado" ? { label: "Aprobado", color: "#059669", bg: "#ECFDF5" } :
                                                 { label: "Pendiente", color: "#D97706", bg: "#FFFBEB" }
                      return (
                        <tr key={i} className="border-t" style={{ borderColor: "var(--border)" }}>
                          <td className="px-4 py-3">
                            <span className="text-xs font-medium capitalize"
                              style={{ color: "var(--text)" }}>{h.periodo_label}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs tabular-nums"
                              style={{ color: "var(--muted)" }}>{h.count}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm font-semibold tabular-nums"
                              style={{ color: "var(--text)" }}>{formatMXN(h.monto_total)}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs tabular-nums font-medium"
                              style={{ color: "#2563EB" }}>{formatMXN(h.monto_pagado)}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs tabular-nums"
                              style={{ color: h.monto_pendiente > 0 ? "#D97706" : "var(--subtle)" }}>
                              {formatMXN(h.monto_pendiente)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                              style={{ background: s.bg, color: s.color }}>{s.label}</span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : !loading ? (
            <div className="text-center py-10">
              <DollarSign size={28} className="mx-auto mb-2" style={{ color: "var(--border)" }} />
              <p className="text-xs" style={{ color: "var(--subtle)" }}>
                Aún no tienes historial de comisiones.
              </p>
            </div>
          ) : null}

          {/* Explicación del sistema */}
          <div className="rounded-xl p-4 border text-xs leading-relaxed space-y-1"
            style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--muted)" }}>
            <p className="font-semibold" style={{ color: "var(--text)" }}>¿Cómo funciona el pago?</p>
            <p>
              Las comisiones se acumulan del <strong>1 al 23 de cada mes</strong>.
              El monto acumulado en ese periodo se procesa y deposita durante el <strong>mes siguiente</strong>.
            </p>
            <p>
              Los leads convertidos después del día 23 se contabilizan en el siguiente periodo mensual.
              Siempre podrás ver el estado de cada comisión en la pestaña <em>Mis Leads</em>.
            </p>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB: MI CÓDIGO
      ══════════════════════════════════════════════════════════════════════ */}
      {tab === "codigo" && (
        <div className="space-y-4">

          {/* QR Card */}
          <div className="rounded-2xl border p-6 text-center"
            style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <p className="text-xs font-semibold uppercase tracking-wide mb-4"
              style={{ color: "var(--muted)" }}>
              Tu código QR personal
            </p>

            <div id="vendor-qr" className="flex justify-center mb-4">
              {profile?.codigo_unico && referralUrl ? (
                <div className="p-4 rounded-2xl bg-white shadow-md inline-block">
                  <QRCode
                    value={referralUrl}
                    size={200}
                    level="M"
                    style={{ display: "block" }}
                  />
                </div>
              ) : (
                <Skeleton className="w-52 h-52 rounded-2xl" />
              )}
            </div>

            <div className="font-mono text-xl font-bold mb-1" style={{ color: "var(--accent)" }}>
              {profile?.codigo_unico ?? "—"}
            </div>

            <div className="flex items-center justify-center gap-2 mb-5">
              <span className="text-xs truncate max-w-[220px] sm:max-w-xs"
                style={{ color: "var(--subtle)" }}>
                {referralUrl || "—"}
              </span>
              {referralUrl && <CopyBtn text={referralUrl} />}
            </div>

            <div className="flex flex-col sm:flex-row justify-center gap-2">
              <button onClick={downloadQR}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium border transition-colors"
                style={{ background: "var(--surface-2)", color: "var(--text)", borderColor: "var(--border)" }}>
                <Download size={15} />
                Descargar PNG
              </button>
              <button onClick={shareWhatsApp}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white transition-colors"
                style={{ background: "#25D366" }}>
                <Share2 size={15} />
                Compartir en WhatsApp
              </button>
            </div>
          </div>

          {/* Instrucciones de uso */}
          <div className="rounded-xl border p-4 space-y-3"
            style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <h3 className="text-xs font-semibold uppercase tracking-wide"
              style={{ color: "var(--muted)" }}>
              ¿Cómo usar tu enlace?
            </h3>
            <div className="space-y-2.5 text-xs" style={{ color: "var(--muted)" }}>
              {[
                "Comparte tu QR o enlace con personas que tengan Seguro de Gastos Médicos Mayores y necesiten una cirugía.",
                "Cuando alguien use tu enlace y registre su interés, el lead quedará vinculado a tu código automáticamente.",
                "Si el procedimiento se confirma, recibirás tu comisión en el mes siguiente al corte del periodo (día 23).",
              ].map((text, i) => (
                <div key={i} className="flex gap-2.5">
                  <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                    style={{ background: "var(--accent-bg)", color: "var(--accent)" }}>
                    {i + 1}
                  </span>
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Campañas activas */}
          {campaigns.length > 0 && (
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wide mb-2"
                style={{ color: "var(--muted)" }}>
                Campañas activas
              </h2>
              <div className="space-y-2">
                {campaigns.map((camp) => (
                  <div key={camp.id}
                    className="flex items-start sm:items-center justify-between gap-3 px-4 py-3 rounded-xl border"
                    style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
                    <div className="min-w-0">
                      <div className="text-sm font-medium" style={{ color: "var(--text)" }}>
                        {camp.nombre}
                      </div>
                      {camp.procedimiento && (
                        <div className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                          {camp.procedimiento}
                        </div>
                      )}
                    </div>
                    {camp.fecha_fin && (
                      <span className="text-xs shrink-0 font-medium"
                        style={{ color: "var(--subtle)" }}>
                        Hasta {formatDate(camp.fecha_fin)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {campaigns.length === 0 && !loading && (
            <div className="rounded-xl border p-4 text-center"
              style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
              <p className="text-xs" style={{ color: "var(--subtle)" }}>
                No hay campañas activas en este momento. El administrador publicará materiales aquí cuando estén disponibles.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
