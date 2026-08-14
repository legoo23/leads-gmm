"use client"
import { useState, useEffect } from "react"
import QRCode from "react-qr-code"
import {
  Users, DollarSign, Calendar, TrendingUp,
  Copy, Check, Download, Share2, Filter,
  CheckCircle2, AlertCircle, Bell,
  Newspaper, MessageSquare, Trash2,
} from "lucide-react"

// Iconos de redes sociales (SVG inline — lucide-react no los incluye)
const IcoWhatsApp = () => (
  <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.122 1.532 5.847L0 24l6.335-1.518A11.937 11.937 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.006-1.373l-.36-.213-3.73.894.928-3.629-.234-.373A9.818 9.818 0 1112 21.818z"/>
  </svg>
)
const IcoFacebook = () => (
  <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
)
const IcoInstagram = () => (
  <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
)
const IcoLinkedIn = () => (
  <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
)
const IcoX = () => (
  <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
    <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"/>
  </svg>
)
import { getEstrategiaActual, type EstrategiaSemana } from "@/constants/social-estrategias"

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
type Campana = { id: number; nombre: string; procedimiento?: string; fecha_fin?: string }
type Mensaje = { id: number; asunto: string; cuerpo: string; created_at: string; leido: boolean }
type Noticia = { id: number; titulo: string; cuerpo: string; tipo: string; created_at: string }

type Tab = "leads" | "comisiones" | "codigo" | "noticias" | "mensajes"

// ─── helpers ─────────────────────────────────────────────────────────────────
function formatMXN(n: number | null | undefined) {
  if (n == null) return "$0"
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN",
    minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n)
}
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "2-digit" })
}
function formatDateLong(iso: string) {
  return new Date(iso).toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" })
}

const COMISION_ESTADO: Record<string, { label: string; color: string; bg: string }> = {
  pendiente: { label: "Pendiente", color: "#D97706", bg: "#FFFBEB" },
  aprobada:  { label: "Aprobada",  color: "#059669", bg: "#ECFDF5" },
  pagada:    { label: "Pagada",    color: "#2563EB", bg: "#DBEAFE" },
  cancelada: { label: "Cancelada", color: "#6B7280", bg: "#F3F4F6" },
}

const TIPO_NOTICIA: Record<string, { label: string; color: string; bg: string }> = {
  novedad: { label: "Novedad",  color: "#2563EB", bg: "#DBEAFE" },
  aviso:   { label: "Aviso",   color: "#D97706", bg: "#FFFBEB" },
  ayuda:   { label: "Tips",    color: "#059669", bg: "#ECFDF5" },
}

const ETAPA_FILTERS = [
  "Todos", "Nuevo", "Contactado", "En Revisión",
  "Gestoría Activa", "Programado", "Ganado", "No Procedió",
]

// ─── sub-componentes ──────────────────────────────────────────────────────────
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
  return <div className={`animate-pulse rounded-lg ${className}`} style={{ background: "var(--surface-2)" }} />
}

// ─── PÁGINA PRINCIPAL ─────────────────────────────────────────────────────────
export default function MiPanelPage() {
  const [tab, setTab] = useState<Tab>("leads")
  const [profile, setProfile] = useState<VendorProfile | null>(null)
  const [allLeads, setAllLeads] = useState<VendorLead[]>([])
  const [commissions, setCommissions] = useState<CommissionData | null>(null)
  const [campaigns, setCampaigns] = useState<Campana[]>([])
  const [mensajes, setMensajes] = useState<Mensaje[]>([])
  const [noticias, setNoticias] = useState<Noticia[]>([])
  const [noticiasLoaded, setNoticiasLoaded] = useState(false)
  const [loading, setLoading] = useState(true)
  const [mensajesLoading, setMensajesLoading] = useState(false)
  const [noticiasLoading, setNoticiasLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // filtros (client-side)
  const [etapaFilter, setEtapaFilter] = useState("Todos")
  const [comisionFilter, setComisionFilter] = useState("todas")

  // estrategia de la semana (calculada una sola vez)
  const [estrategia] = useState<EstrategiaSemana>(() => getEstrategiaActual())

  // ─── carga inicial ─────────────────────────────────────────────────────────
  useEffect(() => {
    Promise.all([
      fetch("/api/vendedor/me").then(r => r.json()),
      fetch("/api/vendedor/leads").then(r => r.json()),
      fetch("/api/vendedor/comisiones").then(r => r.json()),
      fetch("/api/vendedor/campanas").then(r => r.json()),
      fetch("/api/vendedor/mensajes").then(r => r.json()),
    ]).then(([me, leadsData, comisData, campanasData, mensajesData]) => {
      if (me.error) { setError(me.error); setLoading(false); return }
      setProfile(me.data ?? null)
      setAllLeads(leadsData.data ?? [])
      setCommissions(comisData.periodo_actual ? comisData : null)
      setCampaigns(campanasData.data ?? [])
      setMensajes(mensajesData.mensajes ?? [])
      setLoading(false)
    }).catch(() => { setError("Error de conexión"); setLoading(false) })
  }, [])

  // ─── carga lazy de noticias ────────────────────────────────────────────────
  useEffect(() => {
    if (tab !== "noticias" || noticiasLoaded) return
    setNoticiasLoading(true)
    fetch("/api/vendedor/noticias")
      .then(r => r.json())
      .then(d => { setNoticias(d.noticias ?? []); setNoticiasLoaded(true) })
      .finally(() => setNoticiasLoading(false))
  }, [tab, noticiasLoaded])

  // ─── marcar mensaje como leído ─────────────────────────────────────────────
  const markRead = async (id: number) => {
    setMensajes(prev => prev.map(m => m.id === id ? { ...m, leido: true } : m))
    await fetch(`/api/vendedor/mensajes/${id}/leer`, { method: "POST" }).catch(() => {})
  }

  // ─── filtrado local ────────────────────────────────────────────────────────
  const filteredLeads = allLeads.filter((l) => {
    const etapaOk = etapaFilter === "Todos" || l.etapa_label === etapaFilter
    const comisionOk =
      comisionFilter === "todas"        ? true :
      comisionFilter === "con_comision" ? l.comision !== null :
      comisionFilter === "sin_comision" ? l.comision === null :
      l.comision?.estado === comisionFilter
    return etapaOk && comisionOk
  })

  const unreadCount = mensajes.filter(m => !m.leido).length

  const referralUrl = profile
    ? `${process.env.NEXT_PUBLIC_APP_URL}/r/${profile.codigo_unico}`
    : ""

  // ─── días sin lead ─────────────────────────────────────────────────────────
  const diasSinLead = (() => {
    if (!profile || loading) return null
    if (allLeads.length === 0) return 999
    const sorted = [...allLeads].sort((a, b) =>
      new Date(b.fecha_captura).getTime() - new Date(a.fecha_captura).getTime()
    )
    const ultimo = new Date(sorted[0].fecha_captura)
    return Math.floor((Date.now() - ultimo.getTime()) / (1000 * 60 * 60 * 24))
  })()

  // ─── acciones de sharing ───────────────────────────────────────────────────
  const downloadQR = () => {
    const svgEl = document.querySelector("#vendor-qr svg") as SVGElement | null
    if (!svgEl) return
    const svgData = new XMLSerializer().serializeToString(svgEl)
    const canvas = document.createElement("canvas")
    canvas.width = 500; canvas.height = 500
    const img = new Image()
    img.onload = () => {
      const ctx = canvas.getContext("2d")!
      ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, 500, 500)
      ctx.drawImage(img, 30, 30, 440, 440)
      const a = document.createElement("a")
      a.download = `QR-${profile?.codigo_unico ?? "vendedor"}.png`
      a.href = canvas.toDataURL("image/png"); a.click()
    }
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)))
  }

  const shareWhatsApp = (texto: string) => {
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, "_blank")
  }
  const shareFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralUrl)}`, "_blank")
  }
  const shareLinkedIn = (titulo: string, texto: string) => {
    const url = `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(referralUrl)}&title=${encodeURIComponent(titulo)}&summary=${encodeURIComponent(texto.slice(0, 200))}`
    window.open(url, "_blank")
  }
  const shareX = (texto: string) => {
    const combined = `${texto.slice(0, 220)}\n${referralUrl}`
    window.open(`https://x.com/intent/tweet?text=${encodeURIComponent(combined)}`, "_blank")
  }
  const copyInstagram = (texto: string) => {
    navigator.clipboard.writeText(`${texto}\n\n${referralUrl}`)
  }

  const periodo = commissions?.periodo_actual

  // ─── Error ────────────────────────────────────────────────────────────────
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

      {/* ─── HEADER ───────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="space-y-2"><Skeleton className="h-6 w-48" /><Skeleton className="h-4 w-64" /></div>
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

      {/* ─── BANNER: DÍAS SIN LEAD ─────────────────────────────────────────── */}
      {!loading && diasSinLead !== null && diasSinLead >= 7 && (
        <div className="rounded-2xl px-4 py-3 flex items-start gap-3 border"
          style={{
            background: diasSinLead >= 14
              ? "linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%)"
              : "linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)",
            borderColor: diasSinLead >= 14 ? "#FECACA" : "#FDE68A",
          }}>
          <Bell size={16} className="shrink-0 mt-0.5"
            style={{ color: diasSinLead >= 14 ? "#DC2626" : "#D97706" }} />
          <div className="min-w-0">
            <p className="text-xs font-semibold"
              style={{ color: diasSinLead >= 14 ? "#991B1B" : "#92400E" }}>
              {diasSinLead >= 999
                ? "Aún no tienes leads — tu código está listo para compartir"
                : `Llevas ${diasSinLead} días sin un nuevo lead`}
            </p>
            <p className="text-xs mt-0.5 leading-relaxed"
              style={{ color: diasSinLead >= 14 ? "#B91C1C" : "#B45309" }}>
              Tu presencia en redes es tu motor. Revisa la pestaña <strong>Noticias & Tips</strong> para ver las estrategias de esta semana y comparte tu enlace hoy.
            </p>
          </div>
          <button
            onClick={() => setTab("noticias")}
            className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
            style={{
              background: diasSinLead >= 14 ? "#FCA5A5" : "#FDE68A",
              color: diasSinLead >= 14 ? "#7F1D1D" : "#78350F",
            }}>
            Ver tips
          </button>
        </div>
      )}

      {/* ─── BANNER PERÍODO DE COMISIÓN ───────────────────────────────────── */}
      {loading ? (
        <Skeleton className="h-24 w-full" />
      ) : periodo ? (
        <div className="rounded-2xl p-4 sm:p-5 border"
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
                <span>{periodo.count} {periodo.count === 1 ? "lead convertido" : "leads convertidos"}</span>
                <span>Pago programado para <strong>{periodo.pago_en}</strong></span>
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-xs font-medium"
                style={{ color: periodo.abierto ? "#047857" : "#1D4ED8" }}>
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
      <div className="flex gap-1 p-1 rounded-xl overflow-x-auto" style={{ background: "var(--surface-2)" }}>
        {(
          [
            { key: "leads",      label: "Mis Leads",  badge: undefined },
            { key: "comisiones", label: "Comisiones", badge: undefined },
            { key: "codigo",     label: "Mi Código",  badge: undefined },
            { key: "noticias",   label: "Tips",       badge: undefined },
            { key: "mensajes",   label: "Mensajes",   badge: unreadCount },
          ] as { key: Tab; label: string; badge: number | undefined }[]
        ).map(({ key, label, badge }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className="relative flex-1 py-1.5 px-2 sm:px-3 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap"
            style={{
              background: tab === key ? "var(--surface)" : "transparent",
              color:      tab === key ? "var(--text)"    : "var(--subtle)",
              boxShadow:  tab === key ? "var(--shadow)"  : "none",
            }}>
            {label}
            {badge != null && badge > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                style={{ background: "#DC2626" }}>
                {badge > 9 ? "9+" : badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          TAB: MIS LEADS
      ══════════════════════════════════════════════════════════════════════ */}
      {tab === "leads" && (
        <div className="space-y-3">
          {/* Filtros etapa */}
          <div className="space-y-2">
            <div className="flex flex-wrap gap-1.5">
              {ETAPA_FILTERS.map((etapa) => (
                <button key={etapa} onClick={() => setEtapaFilter(etapa)}
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
                <button key={value} onClick={() => setComisionFilter(value)}
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
                      <span className="text-xs font-semibold tabular-nums" style={{ color: com.color }}>
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
                      <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-5 w-full" />)}</div>
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
                          <span className="text-xs font-medium" style={{ color: "var(--text)" }}>{lead.nombre}</span>
                        </td>
                        <td className="px-4 py-3 max-w-[180px]">
                          <span className="text-xs line-clamp-1" style={{ color: "var(--muted)" }}>
                            {lead.procedimiento ?? "—"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                            style={{ background: lead.etapa_bg, color: lead.etapa_color }}>
                            {lead.etapa_label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs tabular-nums" style={{ color: "var(--subtle)" }}>
                            {formatDate(lead.fecha_captura)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {com && lead.comision ? (
                            <div>
                              <div className="text-xs font-semibold tabular-nums" style={{ color: com.color }}>
                                {formatMXN(lead.comision.monto)}
                              </div>
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
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { label: "Total cobrado",    value: formatMXN(commissions?.total_pagado), icon: DollarSign,   color: "#2563EB", bg: "#EFF6FF" },
              { label: "Este periodo",     value: formatMXN(commissions?.periodo_actual.acumulado), icon: TrendingUp, color: "#059669", bg: "#ECFDF5" },
              { label: "Leads convertidos", value: allLeads.filter(l => l.comision !== null).length, icon: CheckCircle2, color: "#7C3AED", bg: "#F5F3FF" },
            ].map(({ label, value, icon: Icon, color, bg }) => (
              <div key={label} className="rounded-xl border p-4"
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

          {commissions && commissions.historial.length > 0 ? (
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wide mb-2"
                style={{ color: "var(--muted)" }}>
                Historial de periodos anteriores
              </h2>
              <div className="sm:hidden space-y-2">
                {commissions.historial.map((h, i) => {
                  const s =
                    h.estado === "pagado"   ? { label: "Pagado",   color: "#2563EB", bg: "#DBEAFE" } :
                    h.estado === "aprobado" ? { label: "Aprobado", color: "#059669", bg: "#ECFDF5" } :
                                             { label: "Pendiente", color: "#D97706", bg: "#FFFBEB" }
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
                          style={{ background: s.bg, color: s.color }}>{s.label}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
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
                            <span className="text-xs tabular-nums" style={{ color: "var(--muted)" }}>{h.count}</span>
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

          <div className="rounded-xl p-4 border text-xs leading-relaxed space-y-1"
            style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--muted)" }}>
            <p className="font-semibold" style={{ color: "var(--text)" }}>¿Cómo funciona el pago?</p>
            <p>
              Las comisiones se acumulan del <strong>1 al 23 de cada mes</strong>.
              El monto acumulado en ese periodo se procesa y deposita durante el <strong>mes siguiente</strong>.
            </p>
            <p>
              Los leads convertidos después del día 23 se contabilizan en el siguiente periodo.
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
                  <QRCode value={referralUrl} size={200} level="M" style={{ display: "block" }} />
                </div>
              ) : (
                <Skeleton className="w-52 h-52 rounded-2xl" />
              )}
            </div>
            <div className="font-mono text-xl font-bold mb-1" style={{ color: "var(--accent)" }}>
              {profile?.codigo_unico ?? "—"}
            </div>
            <div className="flex items-center justify-center gap-2 mb-5">
              <span className="text-xs truncate max-w-[220px] sm:max-w-xs" style={{ color: "var(--subtle)" }}>
                {referralUrl || "—"}
              </span>
              {referralUrl && <CopyBtn text={referralUrl} />}
            </div>

            {/* Botones de descarga */}
            <div className="flex justify-center mb-4">
              <button onClick={downloadQR}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium border transition-colors"
                style={{ background: "var(--surface-2)", color: "var(--text)", borderColor: "var(--border)" }}>
                <Download size={15} />
                Descargar QR PNG
              </button>
            </div>
          </div>

          {/* ─── Estrategia de la semana ───────────────────────────────────── */}
          <div className="rounded-2xl border overflow-hidden"
            style={{ borderColor: "var(--border)" }}>
            <div className="px-4 py-3 flex items-center justify-between"
              style={{ background: "var(--surface-2)" }}>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--muted)" }}>
                  Estrategia de la semana
                </p>
                <p className="text-sm font-bold mt-0.5" style={{ color: "var(--text)" }}>
                  {estrategia.tema}
                </p>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ background: "var(--accent-bg)", color: "var(--accent)" }}>
                Semana {estrategia.semana}
              </span>
            </div>
            <p className="px-4 py-2 text-xs" style={{ color: "var(--muted)" }}>
              <strong>Objetivo:</strong> {estrategia.objetivo}
            </p>

            {/* Tarjetas por red social */}
            {[
              {
                red: "WhatsApp",
                IcoRed: IcoWhatsApp,
                color: "#25D366",
                data: estrategia.facebook,
                accion: () => shareWhatsApp(estrategia.facebook.mensaje + `\n\n${referralUrl}`),
                accionLabel: "Enviar",
              },
              {
                red: "Facebook",
                IcoRed: IcoFacebook,
                color: "#1877F2",
                data: estrategia.facebook,
                accion: shareFacebook,
                accionLabel: "Compartir",
              },
              {
                red: "Instagram",
                IcoRed: IcoInstagram,
                color: "#E1306C",
                data: estrategia.instagram,
                accion: () => copyInstagram(estrategia.instagram.mensaje),
                accionLabel: "Copiar",
              },
              {
                red: "LinkedIn",
                IcoRed: IcoLinkedIn,
                color: "#0A66C2",
                data: estrategia.linkedin,
                accion: () => shareLinkedIn(estrategia.linkedin.titulo, estrategia.linkedin.mensaje),
                accionLabel: "Publicar",
              },
              {
                red: "X",
                IcoRed: IcoX,
                color: "#000000",
                data: estrategia.x,
                accion: () => shareX(estrategia.x.mensaje),
                accionLabel: "Tuitear",
              },
            ].map(({ red, IcoRed, color, data, accion, accionLabel }) => (
              <div key={red} className="border-t px-4 py-3 space-y-2"
                style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-white"
                    style={{ background: color }}>
                    <IcoRed />
                  </div>
                  <span className="text-xs font-semibold" style={{ color: "var(--text)" }}>{red}</span>
                  <span className="text-xs" style={{ color: "var(--muted)" }}>— {data.titulo}</span>
                </div>
                <p className="text-xs leading-relaxed line-clamp-3" style={{ color: "var(--muted)" }}>
                  {data.descripcion}
                </p>
                <div className="flex flex-wrap gap-1.5 items-center justify-between">
                  <div className="flex flex-wrap gap-1">
                    {data.hashtags.slice(0, 3).map(h => (
                      <span key={h} className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                        style={{ background: "var(--accent-bg)", color: "var(--accent)" }}>
                        {h}
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-1.5">
                    <CopyBtn text={`${data.mensaje}\n\n${data.hashtags.join(" ")}\n\n${referralUrl}`}
                      label="Copiar" />
                    <button onClick={accion}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-white transition-colors"
                      style={{ background: color }}>
                      <IcoRed />
                      {accionLabel}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Instrucciones de uso */}
          <div className="rounded-xl border p-4 space-y-3"
            style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <h3 className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--muted)" }}>
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
                      <div className="text-sm font-medium" style={{ color: "var(--text)" }}>{camp.nombre}</div>
                      {camp.procedimiento && (
                        <div className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{camp.procedimiento}</div>
                      )}
                    </div>
                    {camp.fecha_fin && (
                      <span className="text-xs shrink-0 font-medium" style={{ color: "var(--subtle)" }}>
                        Hasta {formatDate(camp.fecha_fin)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Guía del asesor */}
          {profile && (
            <a href={`/bienvenida/${profile.codigo_unico}`} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-between px-4 py-3.5 rounded-xl border transition-colors hover:opacity-80"
              style={{ background: "var(--surface)", borderColor: "var(--border)", textDecoration: "none" }}>
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>Ver mi guía de asesor</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--subtle)" }}>
                  Descarga tu QR, imprime tu tarjeta y consulta el manual completo
                </p>
              </div>
              <span className="text-base" style={{ color: "var(--accent)" }}>→</span>
            </a>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB: NOTICIAS & TIPS
      ══════════════════════════════════════════════════════════════════════ */}
      {tab === "noticias" && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Newspaper size={15} style={{ color: "var(--accent)" }} />
            <h2 className="text-xs font-semibold uppercase tracking-wide"
              style={{ color: "var(--muted)" }}>
              Noticias y recursos de apoyo
            </h2>
          </div>

          {noticiasLoading && (
            <div className="space-y-3">
              {[1,2,3].map(i => <Skeleton key={i} className="h-24 w-full" />)}
            </div>
          )}

          {!noticiasLoading && noticias.length === 0 && (
            <div className="text-center py-12 rounded-xl border"
              style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
              <Newspaper size={28} className="mx-auto mb-2" style={{ color: "var(--border)" }} />
              <p className="text-xs" style={{ color: "var(--subtle)" }}>
                No hay noticias publicadas aún. Vuelve pronto.
              </p>
            </div>
          )}

          {noticias.map((n) => {
            const tipo = TIPO_NOTICIA[n.tipo] ?? TIPO_NOTICIA.novedad
            return (
              <div key={n.id} className="rounded-xl border p-4 space-y-2"
                style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-semibold leading-snug"
                    style={{ color: "var(--text)" }}>
                    {n.titulo}
                  </h3>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold shrink-0"
                    style={{ background: tipo.bg, color: tipo.color }}>
                    {tipo.label}
                  </span>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: "var(--muted)" }}>
                  {n.cuerpo}
                </p>
                <p className="text-[10px]" style={{ color: "var(--subtle)" }}>
                  {formatDateLong(n.created_at)}
                </p>
              </div>
            )
          })}

          {/* Tip de la semana — siempre visible */}
          <div className="rounded-2xl border p-4"
            style={{
              background: "linear-gradient(135deg, var(--accent-bg) 0%, var(--surface) 100%)",
              borderColor: "var(--border)",
            }}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-base">💡</span>
              <span className="text-xs font-semibold uppercase tracking-wide"
                style={{ color: "var(--accent)" }}>
                Tip de la semana — {estrategia.tema}
              </span>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: "var(--text)" }}>
              {estrategia.facebook.descripcion}
            </p>
            <button onClick={() => setTab("codigo")}
              className="mt-3 text-xs font-semibold"
              style={{ color: "var(--accent)" }}>
              Ver estrategias completas en Mi Código →
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB: MENSAJES
      ══════════════════════════════════════════════════════════════════════ */}
      {tab === "mensajes" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare size={15} style={{ color: "var(--accent)" }} />
              <h2 className="text-xs font-semibold uppercase tracking-wide"
                style={{ color: "var(--muted)" }}>
                Mensajes del equipo
              </h2>
            </div>
            {unreadCount > 0 && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ background: "#FEE2E2", color: "#DC2626" }}>
                {unreadCount} sin leer
              </span>
            )}
          </div>

          {loading && (
            <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-24 w-full" />)}</div>
          )}

          {!loading && mensajes.length === 0 && (
            <div className="text-center py-12 rounded-xl border"
              style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
              <MessageSquare size={28} className="mx-auto mb-2" style={{ color: "var(--border)" }} />
              <p className="text-xs" style={{ color: "var(--subtle)" }}>
                No tienes mensajes aún.
              </p>
            </div>
          )}

          {mensajes.map((m) => (
            <button key={m.id} onClick={() => markRead(m.id)}
              className="w-full text-left rounded-xl border p-4 space-y-2 transition-all"
              style={{
                background: m.leido ? "var(--surface)" : "linear-gradient(135deg, #EFF6FF 0%, var(--surface) 80%)",
                borderColor: m.leido ? "var(--border)" : "#BFDBFE",
              }}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 min-w-0">
                  {!m.leido && (
                    <span className="w-2 h-2 rounded-full shrink-0 mt-1"
                      style={{ background: "#2563EB" }} />
                  )}
                  <span className="text-sm font-semibold leading-snug"
                    style={{ color: "var(--text)" }}>
                    {m.asunto}
                  </span>
                </div>
                <span className="text-[10px] shrink-0 mt-0.5" style={{ color: "var(--subtle)" }}>
                  {formatDate(m.created_at)}
                </span>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: "var(--muted)" }}>
                {m.cuerpo}
              </p>
              {!m.leido && (
                <p className="text-[10px] font-medium" style={{ color: "#2563EB" }}>
                  Toca para marcar como leído
                </p>
              )}
            </button>
          ))}

          <div className="rounded-xl border p-4 text-xs"
            style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--subtle)" }}>
            Esta bandeja es de solo lectura. Los mensajes son enviados por el equipo de iHelp Medica para mantenerte informado y apoyarte en tu labor de asesor.
          </div>
        </div>
      )}
    </div>
  )
}
