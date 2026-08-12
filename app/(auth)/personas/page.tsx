"use client"
import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Search, Users, X, ChevronRight, CalendarRange, MapPin, Phone, Mail, CreditCard, Inbox } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { ETAPAS_PIPELINE } from "@/constants/lead-etapas"
import { formatDate } from "@/lib/utils"

// ─── Types ────────────────────────────────────────────────────────────────────

interface Persona {
  ref_lead_id:       number
  nombre:            string
  apellido_paterno:  string | null
  apellido_materno:  string | null
  telefono:          string | null
  email:             string | null
  curp:              string | null
  telefono_hash:     string | null
  estado_ciudad:     string | null
  leads_count:       number
  ultima_etapa:      string | null
  fecha_primer_lead: string
  fecha_ultimo_lead: string
}

interface PersonaDetail {
  profile: {
    ref_lead_id:      number
    nombre:           string
    apellido_paterno: string | null
    apellido_materno: string | null
    telefono:         string | null
    email:            string | null
    curp:             string | null
    estado_ciudad:    string | null
    fecha_nacimiento: string | null
  }
  leads: Array<{
    id:                     number
    folio:                  string
    etapa:                  string
    procedimiento:          string | null
    fuente:                 string | null
    fecha_captura:          string
    fecha_contacto:         string | null
    numero_autorizacion:    string | null
    carta_autorizacion_url: string | null
    aseguradoras:           { nombre: string } | null
    notas:                  string | null
  }>
}

const FUENTES: Record<string, string> = {
  formulario: "Formulario", whatsapp_bot: "WhatsApp", qr: "QR",
  llamada: "Llamada", referido: "Referido",
}

// ─── Persona Card (slide panel) ───────────────────────────────────────────────

function PersonaCard({ id, onClose }: { id: number; onClose: () => void }) {
  const [detail, setDetail] = useState<PersonaDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/personas/${id}`)
      .then(r => r.json())
      .then(j => setDetail(j))
      .finally(() => setLoading(false))
  }, [id])

  const p = detail?.profile

  return (
    <div className="fixed inset-0 z-40 flex justify-end" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.35)" }} />

      {/* Panel */}
      <div
        className="relative z-50 flex flex-col h-full overflow-y-auto w-full max-w-lg shadow-2xl"
        style={{ background: "var(--surface)" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b sticky top-0"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <div>
            {loading
              ? <div className="h-5 w-48 rounded animate-pulse" style={{ background: "var(--surface-2)" }} />
              : <>
                  <h2 className="text-base font-semibold" style={{ color: "var(--text)" }}>
                    {p?.nombre} {p?.apellido_paterno ?? ""} {p?.apellido_materno ?? ""}
                  </h2>
                  <p className="text-xs mt-0.5" style={{ color: "var(--subtle)" }}>
                    {detail?.leads.length ?? 0} lead{(detail?.leads.length ?? 0) !== 1 ? "s" : ""} registrados
                  </p>
                </>
            }
          </div>
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--surface-2)] transition-colors"
            style={{ color: "var(--muted)" }}>
            <X size={16} />
          </button>
        </div>

        {loading && (
          <div className="p-5 space-y-4">
            {[1,2,3].map(i => (
              <div key={i} className="h-10 rounded animate-pulse" style={{ background: "var(--surface-2)" }} />
            ))}
          </div>
        )}

        {!loading && p && (
          <>
            {/* Datos personales */}
            <div className="p-5 space-y-3 border-b" style={{ borderColor: "var(--border)" }}>
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--subtle)" }}>
                Datos personales
              </p>
              <div className="grid grid-cols-1 gap-2">
                {p.telefono && (
                  <InfoRow icon={<Phone size={13} />} label="Teléfono" value={p.telefono} mono />
                )}
                {p.email && (
                  <InfoRow icon={<Mail size={13} />} label="Email" value={p.email} />
                )}
                {p.curp && (
                  <InfoRow icon={<CreditCard size={13} />} label="CURP" value={p.curp} mono />
                )}
                {p.estado_ciudad && (
                  <InfoRow icon={<MapPin size={13} />} label="Estado / Ciudad" value={p.estado_ciudad} />
                )}
                {p.fecha_nacimiento && (
                  <InfoRow icon={<CalendarRange size={13} />} label="Nacimiento"
                    value={new Date(p.fecha_nacimiento + "T12:00:00").toLocaleDateString("es-MX")} />
                )}
              </div>
            </div>

            {/* Historial de leads */}
            <div className="p-5 space-y-3 flex-1">
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--subtle)" }}>
                Historial de leads
              </p>
              {detail!.leads.length === 0 && (
                <div className="flex flex-col items-center py-8 gap-2">
                  <Inbox size={24} style={{ color: "var(--border)" }} />
                  <p className="text-xs" style={{ color: "var(--subtle)" }}>Sin leads</p>
                </div>
              )}
              <div className="space-y-2">
                {detail!.leads.map(lead => {
                  const etapaInfo = ETAPAS_PIPELINE[lead.etapa as keyof typeof ETAPAS_PIPELINE]
                  return (
                    <Link key={lead.id} href={`/leads/${lead.id}`}
                      className="flex items-start gap-3 p-3 rounded-xl border transition-colors hover:bg-[var(--surface-2)] group"
                      style={{ borderColor: "var(--border)" }}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-semibold" style={{ color: "var(--accent)" }}>
                            {lead.folio}
                          </span>
                          {etapaInfo && (
                            <Badge label={etapaInfo.label} color={etapaInfo.color} bg={etapaInfo.bg} size="sm" />
                          )}
                        </div>
                        <p className="text-xs mt-1 truncate" style={{ color: "var(--muted)" }}>
                          {lead.procedimiento ?? <em style={{ color: "var(--subtle)" }}>Sin procedimiento</em>}
                          {lead.aseguradoras && (
                            <span style={{ color: "var(--subtle)" }}> · {lead.aseguradoras.nombre}</span>
                          )}
                        </p>
                        <p className="text-xs mt-0.5 tabular-nums" style={{ color: "var(--subtle)" }}>
                          {formatDate(lead.fecha_captura)}
                          {lead.fuente && <span> · {FUENTES[lead.fuente] ?? lead.fuente}</span>}
                        </p>
                      </div>
                      <ChevronRight size={14} className="shrink-0 opacity-0 group-hover:opacity-60 transition-opacity mt-1"
                        style={{ color: "var(--muted)" }} />
                    </Link>
                  )
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function InfoRow({ icon, label, value, mono }: { icon: React.ReactNode; label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 shrink-0" style={{ color: "var(--subtle)" }}>{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs" style={{ color: "var(--subtle)" }}>{label}</p>
        <p className={`text-xs font-medium truncate ${mono ? "font-mono" : ""}`} style={{ color: "var(--text)" }}>
          {value}
        </p>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PersonasPage() {
  const [personas, setPersonas] = useState<Persona[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState("")
  const [debouncedQ, setDebouncedQ] = useState("")
  const [selectedId, setSelectedId] = useState<number | null>(null)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 300)
    return () => clearTimeout(t)
  }, [q])

  const fetchPersonas = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ limit: "100" })
    if (debouncedQ) params.set("q", debouncedQ)
    const r = await fetch(`/api/personas?${params}`)
    if (r.ok) { const j = await r.json(); setPersonas(j.data ?? []) }
    setLoading(false)
  }, [debouncedQ])

  useEffect(() => { fetchPersonas() }, [fetchPersonas])

  const selectCls = "h-8 px-3 rounded-lg text-xs border outline-none"
  const inputStyle = { background: "var(--surface)", borderColor: "var(--border)", color: "var(--text)" }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-base sm:text-lg font-semibold" style={{ color: "var(--text)" }}>Personas</h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--subtle)" }}>
            Expediente unificado
            {!loading && <span className="ml-1">· {personas.length}</span>}
          </p>
        </div>
      </div>

      {/* Búsqueda */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-40">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--subtle)" }} />
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Buscar por nombre, apellido..."
            className={`w-full ${selectCls} pl-8`}
            style={inputStyle}
          />
        </div>
        {q && (
          <button onClick={() => setQ("")}
            className="flex items-center gap-1 h-8 px-3 rounded-lg text-xs border"
            style={{ borderColor: "var(--border)", color: "var(--subtle)" }}>
            <X size={11} /> Limpiar
          </button>
        )}
      </div>

      {/* ── Vista móvil: tarjetas ── */}
      <div className="sm:hidden space-y-2">
        {loading && (
          <div className="text-center py-10 text-xs" style={{ color: "var(--subtle)" }}>Cargando...</div>
        )}
        {!loading && personas.length === 0 && (
          <div className="flex flex-col items-center py-14 gap-2">
            <Users size={28} style={{ color: "var(--border)" }} />
            <p className="text-xs" style={{ color: "var(--subtle)" }}>
              {debouncedQ ? "Sin resultados" : "Sin personas registradas"}
            </p>
          </div>
        )}
        {personas.map(p => {
          const etapaInfo = p.ultima_etapa
            ? ETAPAS_PIPELINE[p.ultima_etapa as keyof typeof ETAPAS_PIPELINE]
            : null
          return (
            <button key={p.ref_lead_id}
              className="w-full text-left p-4 rounded-xl border transition-colors active:opacity-80"
              style={{ borderColor: "var(--border)", background: "var(--surface)" }}
              onClick={() => setSelectedId(p.ref_lead_id)}>
              <div className="flex items-start justify-between gap-2 mb-1">
                <p className="text-sm font-semibold leading-snug" style={{ color: "var(--text)" }}>
                  {p.nombre} {p.apellido_paterno ?? ""} {p.apellido_materno ?? ""}
                </p>
                <span className="text-xs font-bold shrink-0 px-2 py-0.5 rounded-full"
                  style={{ background: "var(--accent-bg)", color: "var(--accent)" }}>
                  {p.leads_count} lead{p.leads_count !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                {p.telefono && <span className="text-xs font-mono" style={{ color: "var(--muted)" }}>{p.telefono}</span>}
                {p.estado_ciudad && <span className="text-xs" style={{ color: "var(--subtle)" }}>{p.estado_ciudad}</span>}
              </div>
              <div className="flex items-center justify-between mt-2">
                {etapaInfo
                  ? <Badge label={etapaInfo.label} color={etapaInfo.color} bg={etapaInfo.bg} size="sm" />
                  : <span />}
                <span className="text-xs tabular-nums" style={{ color: "var(--subtle)" }}>
                  {formatDate(p.fecha_ultimo_lead)}
                </span>
              </div>
            </button>
          )
        })}
      </div>

      {/* ── Vista tablet/desktop: tabla ── */}
      <div className="hidden sm:block rounded-xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "var(--surface-2)", borderBottom: "1px solid var(--border)" }}>
                {["Paciente", "Teléfono", "Email", "CURP", "Estado / Ciudad", "Última etapa", "Leads", "Último contacto"].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wide"
                    style={{ color: "var(--subtle)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={8} className="text-center py-12 text-xs" style={{ color: "var(--subtle)" }}>Cargando...</td></tr>
              )}
              {!loading && personas.length === 0 && (
                <tr>
                  <td colSpan={8}>
                    <div className="flex flex-col items-center py-16 gap-2">
                      <Users size={28} style={{ color: "var(--border)" }} />
                      <p className="text-xs" style={{ color: "var(--subtle)" }}>
                        {debouncedQ ? "Sin resultados para esa búsqueda" : "Sin personas registradas"}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
              {personas.map(p => {
                const etapaInfo = p.ultima_etapa
                  ? ETAPAS_PIPELINE[p.ultima_etapa as keyof typeof ETAPAS_PIPELINE]
                  : null
                return (
                  <tr key={p.ref_lead_id}
                    className="border-t hover:bg-[var(--surface-2)] transition-colors cursor-pointer"
                    style={{ borderColor: "var(--border)" }}
                    onClick={() => setSelectedId(p.ref_lead_id)}>
                    <td className="px-4 py-3">
                      <span className="font-medium text-xs" style={{ color: "var(--text)" }}>
                        {p.nombre} {p.apellido_paterno ?? ""} {p.apellido_materno ?? ""}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs tabular-nums font-mono" style={{ color: "var(--muted)" }}>{p.telefono ?? "—"}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs" style={{ color: "var(--muted)" }}>{p.email ?? "—"}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs" style={{ color: "var(--subtle)" }}>{p.curp ?? "—"}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs" style={{ color: "var(--subtle)" }}>{p.estado_ciudad ?? "—"}</span>
                    </td>
                    <td className="px-4 py-3">
                      {etapaInfo
                        ? <Badge label={etapaInfo.label} color={etapaInfo.color} bg={etapaInfo.bg} size="sm" />
                        : <span className="text-xs" style={{ color: "var(--subtle)" }}>—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-bold tabular-nums" style={{ color: "var(--accent)" }}>{p.leads_count}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs tabular-nums" style={{ color: "var(--subtle)" }}>{formatDate(p.fecha_ultimo_lead)}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide panel de detalle */}
      {selectedId !== null && (
        <PersonaCard id={selectedId} onClose={() => setSelectedId(null)} />
      )}
    </div>
  )
}
