"use client"
import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import {
  Plus, Search, RefreshCw, AlertCircle, Inbox, Clock,
  TrendingUp, TrendingDown, Minus, Users, CheckCircle2,
  Stethoscope, X, CalendarRange,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ETAPAS_PIPELINE } from "@/constants/lead-etapas"
import { formatDate } from "@/lib/utils"

// ─── Types ───────────────────────────────────────────────────────────────────

interface Lead {
  id: number
  folio: string
  nombre: string
  apellido_paterno: string | null
  apellido_materno: string | null
  etapa: string
  procedimiento: string | null
  fuente: string | null
  fecha_captura: string
  fecha_contacto: string | null
  en_cola_revision: boolean
  vendedores: { nombre: string; codigo_unico: string } | null
  aseguradoras: { nombre: string } | null
}

interface Stats {
  total: number
  ganados: number
  cerrados: number
  activos: number
  esta_semana: number
  semana_pasada: number
  por_etapa: Record<string, number>
  por_fuente: Record<string, number>
}

// ─── Constants ───────────────────────────────────────────────────────────────

const ETAPA_OPTIONS = [
  { key: "", label: "Todas las etapas" },
  ...Object.values(ETAPAS_PIPELINE),
]

const FUENTES: Record<string, string> = {
  formulario:   "Formulario",
  whatsapp_bot: "WhatsApp",
  qr:           "QR",
  llamada:      "Llamada",
  referido:     "Referido",
}

const FUENTE_OPTIONS = [
  { key: "", label: "Todos los canales" },
  { key: "whatsapp_bot", label: "WhatsApp Bot" },
  { key: "qr",          label: "QR" },
  { key: "formulario",  label: "Formulario" },
  { key: "llamada",     label: "Llamada" },
  { key: "referido",    label: "Referido" },
]

// ─── Analytics Panel ─────────────────────────────────────────────────────────

function StatsPanel({ stats, loading }: { stats: Stats | null; loading: boolean }) {
  if (loading) {
    return (
      <div className="rounded-xl border p-4 animate-pulse" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
        <div className="h-3 w-32 rounded mb-4" style={{ background: "var(--surface-2)" }} />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[0,1,2,3].map(i => (
            <div key={i} className="h-16 rounded-lg" style={{ background: "var(--surface-2)" }} />
          ))}
        </div>
      </div>
    )
  }

  if (!stats) return null

  const conversion = stats.cerrados > 0
    ? Math.round((stats.ganados / stats.cerrados) * 100)
    : 0

  const deltaSemana = stats.semana_pasada > 0
    ? Math.round(((stats.esta_semana - stats.semana_pasada) / stats.semana_pasada) * 100)
    : null

  const etapaOrden = ["nuevo","contactado","necesidad_identificada","seguro_identificado","viable","programado","ganado","no_viable","perdido"]
  const etapasConDatos = etapaOrden.filter(k => (stats.por_etapa[k] ?? 0) > 0)

  const fuentesConDatos = Object.entries(stats.por_fuente)
    .filter(([, n]) => n > 0)
    .sort(([, a], [, b]) => b - a)

  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
      {/* KPI tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0"
        style={{ borderColor: "var(--border)" }}>
        {/* Total */}
        <div className="p-4">
          <div className="flex items-center gap-1.5 mb-1">
            <Users size={12} style={{ color: "var(--subtle)" }} />
            <span className="text-xs uppercase tracking-wide font-medium" style={{ color: "var(--subtle)" }}>Total leads</span>
          </div>
          <p className="text-2xl font-bold tabular-nums" style={{ color: "var(--text)" }}>{stats.total.toLocaleString()}</p>
          <p className="text-xs mt-0.5" style={{ color: "var(--subtle)" }}>{stats.activos} activos · {stats.cerrados} cerrados</p>
        </div>

        {/* Esta semana */}
        <div className="p-4">
          <div className="flex items-center gap-1.5 mb-1">
            <CalendarRange size={12} style={{ color: "var(--subtle)" }} />
            <span className="text-xs uppercase tracking-wide font-medium" style={{ color: "var(--subtle)" }}>Esta semana</span>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-bold tabular-nums" style={{ color: "var(--text)" }}>{stats.esta_semana}</p>
            {deltaSemana !== null && (
              <span className="flex items-center gap-0.5 text-xs font-semibold"
                style={{ color: deltaSemana > 0 ? "#059669" : deltaSemana < 0 ? "#DC2626" : "var(--subtle)" }}>
                {deltaSemana > 0
                  ? <TrendingUp size={11} />
                  : deltaSemana < 0
                  ? <TrendingDown size={11} />
                  : <Minus size={11} />}
                {deltaSemana > 0 ? "+" : ""}{deltaSemana}%
              </span>
            )}
          </div>
          <p className="text-xs mt-0.5" style={{ color: "var(--subtle)" }}>
            {stats.semana_pasada} semana anterior
          </p>
        </div>

        {/* En proceso */}
        <div className="p-4">
          <div className="flex items-center gap-1.5 mb-1">
            <Clock size={12} style={{ color: "var(--subtle)" }} />
            <span className="text-xs uppercase tracking-wide font-medium" style={{ color: "var(--subtle)" }}>En proceso</span>
          </div>
          <p className="text-2xl font-bold tabular-nums" style={{ color: "var(--text)" }}>{stats.activos}</p>
          <p className="text-xs mt-0.5" style={{ color: "var(--subtle)" }}>
            {stats.total > 0 ? Math.round((stats.activos / stats.total) * 100) : 0}% del total
          </p>
        </div>

        {/* Conversión */}
        <div className="p-4">
          <div className="flex items-center gap-1.5 mb-1">
            <CheckCircle2 size={12} style={{ color: "var(--subtle)" }} />
            <span className="text-xs uppercase tracking-wide font-medium" style={{ color: "var(--subtle)" }}>Conversión</span>
          </div>
          <p className="text-2xl font-bold tabular-nums" style={{ color: conversion >= 30 ? "#059669" : conversion >= 15 ? "#D97706" : "var(--text)" }}>
            {conversion}%
          </p>
          <p className="text-xs mt-0.5" style={{ color: "var(--subtle)" }}>
            {stats.ganados} ganados de {stats.cerrados} cerrados
          </p>
        </div>
      </div>

      {/* Etapa + Canal breakdown */}
      <div className="border-t px-4 py-3 space-y-2.5" style={{ borderColor: "var(--border)" }}>
        {/* Por etapa */}
        {etapasConDatos.length > 0 && (
          <div className="flex items-start gap-3">
            <span className="text-xs font-semibold pt-0.5 shrink-0 w-16" style={{ color: "var(--subtle)" }}>ETAPAS</span>
            <div className="flex flex-wrap gap-1.5">
              {etapasConDatos.map(k => {
                const info = ETAPAS_PIPELINE[k as keyof typeof ETAPAS_PIPELINE]
                const cnt  = stats.por_etapa[k] ?? 0
                const pct  = stats.total > 0 ? Math.round((cnt / stats.total) * 100) : 0
                return (
                  <span key={k} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                    style={{ background: info?.bg ?? "#F3F4F6", color: info?.color ?? "#374151" }}>
                    {info?.label ?? k}
                    <span className="font-bold">{cnt}</span>
                    <span className="opacity-60">·{pct}%</span>
                  </span>
                )
              })}
            </div>
          </div>
        )}

        {/* Por canal */}
        {fuentesConDatos.length > 0 && (
          <div className="flex items-start gap-3">
            <span className="text-xs font-semibold pt-0.5 shrink-0 w-16" style={{ color: "var(--subtle)" }}>CANAL</span>
            <div className="flex flex-wrap gap-1.5">
              {fuentesConDatos.map(([f, cnt]) => {
                const pct = stats.total > 0 ? Math.round((cnt / stats.total) * 100) : 0
                return (
                  <span key={f} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                    style={{ background: "var(--surface-2)", color: "var(--muted)" }}>
                    {FUENTES[f] ?? f}
                    <span className="font-bold" style={{ color: "var(--text)" }}>{cnt}</span>
                    <span className="opacity-60">·{pct}%</span>
                  </span>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function LeadsClientPage({ rol, userId }: { rol: string; userId: string }) {
  const [leads, setLeads] = useState<Lead[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<Stats | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const [filtersOpen, setFiltersOpen] = useState(false)

  // Filters
  const [q, setQ] = useState("")
  const [debouncedQ, setDebouncedQ] = useState("")
  const [etapa, setEtapa] = useState("")
  const [fuente, setFuente] = useState("")
  const [fechaDesde, setFechaDesde] = useState("")
  const [fechaHasta, setFechaHasta] = useState("")
  const [conMedicoRed, setConMedicoRed] = useState(false)

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 300)
    return () => clearTimeout(t)
  }, [q])

  const buildParams = useCallback(() => {
    const params = new URLSearchParams()
    if (etapa)       params.set("etapa",          etapa)
    if (fuente)      params.set("fuente",         fuente)
    if (debouncedQ)  params.set("q",              debouncedQ)
    if (fechaDesde)  params.set("fecha_desde",    fechaDesde)
    if (fechaHasta)  params.set("fecha_hasta",    fechaHasta)
    if (conMedicoRed) params.set("con_medico_red", "true")
    return params
  }, [etapa, fuente, debouncedQ, fechaDesde, fechaHasta, conMedicoRed])

  const fetchAll = useCallback(async () => {
    setLoading(true)
    setStatsLoading(true)

    const params = buildParams()
    params.set("limit", "50")

    const [leadsRes, statsRes] = await Promise.all([
      fetch(`/api/leads?${params}`),
      fetch(`/api/leads/stats?${params}`),
    ])

    if (leadsRes.ok) {
      const j = await leadsRes.json()
      setLeads(j.data ?? [])
      setTotal(j.total ?? 0)
    }
    if (statsRes.ok) {
      const j = await statsRes.json()
      setStats(j)
    }
    setLoading(false)
    setStatsLoading(false)
  }, [buildParams])

  useEffect(() => { fetchAll() }, [fetchAll])

  const colaRevision = leads.filter((l) => l.en_cola_revision)

  const hasFilters = !!(etapa || fuente || debouncedQ || fechaDesde || fechaHasta || conMedicoRed)

  function clearFilters() {
    setEtapa(""); setFuente(""); setQ(""); setDebouncedQ("")
    setFechaDesde(""); setFechaHasta(""); setConMedicoRed(false)
  }

  const selectCls = "h-8 px-3 rounded-lg text-xs border outline-none"
  const selectStyle = { background: "var(--surface)", borderColor: "var(--border)", color: "var(--text)" }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h1 className="text-base sm:text-lg font-semibold" style={{ color: "var(--text)" }}>Pipeline GMM</h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--subtle)" }}>
            {total.toLocaleString()} leads
            {hasFilters && <span className="ml-1 font-medium" style={{ color: "var(--accent)" }}>· filtros activos</span>}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Filter toggle — mobile only */}
          <button
            onClick={() => setFiltersOpen(v => !v)}
            className="sm:hidden flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs border transition-colors"
            style={{
              background: hasFilters ? "var(--accent-bg)" : "var(--surface)",
              borderColor: hasFilters ? "var(--accent)" : "var(--border)",
              color: hasFilters ? "var(--accent)" : "var(--muted)",
            }}
          >
            <Search size={12} />
            Filtros{hasFilters ? " ●" : ""}
          </button>
          <button
            onClick={fetchAll}
            className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors hover:bg-[var(--surface-2)]"
            style={{ color: "var(--muted)" }}
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
          <Link href="/leads/nuevo">
            <Button size="sm"><Plus size={13} /><span className="hidden sm:inline">Nuevo lead</span><span className="sm:hidden">Nuevo</span></Button>
          </Link>
        </div>
      </div>

      {/* Analytics panel */}
      <StatsPanel stats={stats} loading={statsLoading} />

      {/* Cola de revisión */}
      {colaRevision.length > 0 && (
        <div className="flex items-center gap-3 p-3 rounded-xl border"
          style={{ background: "#FFFBEB", borderColor: "#FCD34D" }}>
          <AlertCircle size={15} color="#D97706" className="shrink-0" />
          <span className="text-xs font-medium" style={{ color: "#92400E" }}>
            {colaRevision.length} lead{colaRevision.length > 1 ? "s" : ""} de WhatsApp esperando revisión
          </span>
          <button className="ml-auto text-xs font-semibold underline shrink-0" style={{ color: "#92400E" }}
            onClick={() => setEtapa("nuevo")}>
            Ver cola
          </button>
        </div>
      )}

      {/* Filtros — siempre visibles en sm+, colapsables en móvil */}
      <div className={`space-y-2 ${filtersOpen ? "block" : "hidden sm:block"}`}>
        {/* Fila 1: búsqueda + etapa + canal */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-40">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--subtle)" }} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar nombre, folio..."
              className="w-full h-8 pl-8 pr-3 rounded-lg text-xs border outline-none"
              style={selectStyle}
            />
          </div>

          <select value={etapa} onChange={(e) => setEtapa(e.target.value)} className={selectCls} style={selectStyle}>
            {ETAPA_OPTIONS.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
          </select>

          <select value={fuente} onChange={(e) => setFuente(e.target.value)} className={selectCls} style={selectStyle}>
            {FUENTE_OPTIONS.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
          </select>
        </div>

        {/* Fila 2: fechas + médico red + limpiar */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-xs" style={{ color: "var(--subtle)" }}>Del</span>
            <input type="date" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)}
              className={selectCls} style={selectStyle} />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs" style={{ color: "var(--subtle)" }}>al</span>
            <input type="date" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)}
              className={selectCls} style={selectStyle} />
          </div>

          <button
            onClick={() => setConMedicoRed(!conMedicoRed)}
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs border transition-colors"
            style={{
              background:  conMedicoRed ? "#ECFDF5" : "var(--surface)",
              borderColor: conMedicoRed ? "#059669" : "var(--border)",
              color:       conMedicoRed ? "#065F46" : "var(--muted)",
              fontWeight:  conMedicoRed ? 600 : 400,
            }}
          >
            <Stethoscope size={12} />
            Médico red
          </button>

          {hasFilters && (
            <button
              onClick={() => { clearFilters(); setFiltersOpen(false) }}
              className="flex items-center gap-1 h-8 px-3 rounded-lg text-xs border transition-colors hover:bg-[var(--surface-2)]"
              style={{ borderColor: "var(--border)", color: "var(--subtle)" }}
            >
              <X size={11} />
              Limpiar
            </button>
          )}
        </div>
      </div>

      {/* ── Vista móvil: tarjetas ── */}
      <div className="sm:hidden space-y-2">
        {loading && (
          <div className="text-center py-10 text-xs" style={{ color: "var(--subtle)" }}>Cargando...</div>
        )}
        {!loading && leads.length === 0 && (
          <div className="flex flex-col items-center py-14 gap-2">
            <Inbox size={28} style={{ color: "var(--border)" }} />
            <p className="text-xs" style={{ color: "var(--subtle)" }}>
              {hasFilters ? "Sin resultados con los filtros actuales" : "Sin leads"}
            </p>
          </div>
        )}
        {leads.map((lead) => {
          const etapaInfo = ETAPAS_PIPELINE[lead.etapa as keyof typeof ETAPAS_PIPELINE]
          return (
            <Link key={lead.id} href={`/leads/${lead.id}`}
              className="block p-4 rounded-xl border transition-colors active:opacity-80"
              style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-1.5">
                  {lead.en_cola_revision && <Clock size={11} color="#D97706" />}
                  <span className="font-mono text-xs font-semibold" style={{ color: "var(--accent)" }}>{lead.folio}</span>
                </div>
                {etapaInfo && <Badge label={etapaInfo.label} color={etapaInfo.color} bg={etapaInfo.bg} size="sm" />}
              </div>
              <p className="text-sm font-semibold leading-snug" style={{ color: "var(--text)" }}>
                {lead.nombre} {lead.apellido_paterno ?? ""} {lead.apellido_materno ?? ""}
              </p>
              {lead.procedimiento && (
                <p className="text-xs mt-0.5 line-clamp-1" style={{ color: "var(--muted)" }}>{lead.procedimiento}</p>
              )}
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {lead.aseguradoras && (
                  <span className="text-xs font-medium" style={{ color: "var(--muted)" }}>{lead.aseguradoras.nombre}</span>
                )}
                {lead.aseguradoras && <span style={{ color: "var(--border)" }}>·</span>}
                <span className="text-xs" style={{ color: "var(--subtle)" }}>
                  {FUENTES[lead.fuente ?? ""] ?? lead.fuente ?? "—"}
                </span>
                <span style={{ color: "var(--border)" }}>·</span>
                <span className="text-xs tabular-nums" style={{ color: "var(--subtle)" }}>
                  {formatDate(lead.fecha_captura)}
                </span>
              </div>
            </Link>
          )
        })}
        {!loading && leads.length > 0 && (
          <p className="text-center text-xs py-2" style={{ color: "var(--subtle)" }}>
            {leads.length} de {total.toLocaleString()} leads
          </p>
        )}
      </div>

      {/* ── Vista tablet/desktop: tabla ── */}
      <div className="hidden sm:block rounded-xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "var(--surface-2)", borderBottom: "1px solid var(--border)" }}>
                {["Folio", "Paciente", "Procedimiento", "Seguro", "Etapa", "Canal", "Fecha", ""].map((h) => (
                  <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wide"
                    style={{ color: "var(--subtle)" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-xs" style={{ color: "var(--subtle)" }}>Cargando...</td>
                </tr>
              )}
              {!loading && leads.length === 0 && (
                <tr>
                  <td colSpan={8}>
                    <div className="flex flex-col items-center py-16 gap-2">
                      <Inbox size={28} style={{ color: "var(--border)" }} />
                      <p className="text-xs" style={{ color: "var(--subtle)" }}>
                        {hasFilters ? "Sin resultados con los filtros actuales" : "Sin leads"}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
              {leads.map((lead) => {
                const etapaInfo = ETAPAS_PIPELINE[lead.etapa as keyof typeof ETAPAS_PIPELINE]
                return (
                  <tr key={lead.id}
                    className="border-t hover:bg-[var(--surface-2)] transition-colors"
                    style={{ borderColor: "var(--border)" }}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {lead.en_cola_revision && <Clock size={11} color="#D97706" />}
                        <span className="font-mono text-xs font-semibold" style={{ color: "var(--accent)" }}>{lead.folio}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-xs" style={{ color: "var(--text)" }}>
                        {lead.nombre} {lead.apellido_paterno ?? ""} {lead.apellido_materno ?? ""}
                      </span>
                      {lead.vendedores && (
                        <div className="text-xs mt-0.5" style={{ color: "var(--subtle)" }}>Ref: {lead.vendedores.codigo_unico}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 max-w-[160px]">
                      <span className="text-xs line-clamp-2" style={{ color: "var(--muted)" }}>
                        {lead.procedimiento ?? <em style={{ color: "var(--subtle)" }}>Sin especificar</em>}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {lead.aseguradoras
                        ? <span className="text-xs font-medium" style={{ color: "var(--text)" }}>{lead.aseguradoras.nombre}</span>
                        : <span className="text-xs" style={{ color: "var(--subtle)" }}>—</span>}
                    </td>
                    <td className="px-4 py-3">
                      {etapaInfo && <Badge label={etapaInfo.label} color={etapaInfo.color} bg={etapaInfo.bg} size="sm" />}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs" style={{ color: "var(--subtle)" }}>
                        {FUENTES[lead.fuente ?? ""] ?? lead.fuente ?? "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs tabular-nums" style={{ color: "var(--subtle)" }}>
                        {formatDate(lead.fecha_captura)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/leads/${lead.id}`}>
                        <button className="text-xs font-medium transition-colors hover:underline" style={{ color: "var(--accent)" }}>
                          Ver
                        </button>
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {!loading && leads.length > 0 && (
          <div className="px-4 py-2.5 border-t text-xs" style={{ borderColor: "var(--border)", color: "var(--subtle)", background: "var(--surface-2)" }}>
            Mostrando {leads.length} de {total.toLocaleString()} leads
          </div>
        )}
      </div>
    </div>
  )
}
