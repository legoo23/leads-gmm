"use client"
import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Plus, Search, Filter, RefreshCw, AlertCircle, Inbox, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ETAPAS_PIPELINE } from "@/constants/lead-etapas"
import { formatDate } from "@/lib/utils"

interface Lead {
  id: number
  folio: string
  nombre: string
  apellido_paterno: string | null
  etapa: string
  procedimiento: string | null
  fuente: string | null
  fecha_captura: string
  fecha_contacto: string | null
  en_cola_revision: boolean
  vendedores: { nombre: string; codigo_unico: string } | null
  aseguradoras: { nombre: string } | null
}

const ETAPA_OPTIONS = [
  { key: "", label: "Todas las etapas" },
  ...Object.values(ETAPAS_PIPELINE),
]

const FUENTES: Record<string, string> = {
  formulario: "Formulario",
  whatsapp_bot: "WhatsApp Bot",
  qr: "QR",
  llamada: "Llamada",
  referido: "Referido",
}

export default function LeadsClientPage({ rol, userId }: { rol: string; userId: string }) {
  const [leads, setLeads] = useState<Lead[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [etapa, setEtapa] = useState("")
  const [q, setQ] = useState("")
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list")

  const fetchLeads = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (etapa) params.set("etapa", etapa)
    if (q) params.set("q", q)
    params.set("limit", "50")

    const res = await fetch(`/api/leads?${params}`)
    if (res.ok) {
      const json = await res.json()
      setLeads(json.data ?? [])
      setTotal(json.total ?? 0)
    }
    setLoading(false)
  }, [etapa, q])

  useEffect(() => { fetchLeads() }, [fetchLeads])

  const colaRevision = leads.filter((l) => l.en_cola_revision)

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold" style={{ color: "var(--text)" }}>Pipeline GMM</h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--subtle)" }}>
            {total} leads totales
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchLeads}
            className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors hover:bg-[var(--surface-2)]"
            style={{ color: "var(--muted)" }}
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
          <Link href="/leads/nuevo">
            <Button size="sm">
              <Plus size={13} />
              Nuevo lead
            </Button>
          </Link>
        </div>
      </div>

      {/* Cola de revisión alerta */}
      {colaRevision.length > 0 && (
        <div className="flex items-center gap-3 p-3 rounded-xl border"
          style={{ background: "#FFFBEB", borderColor: "#FCD34D" }}>
          <AlertCircle size={15} color="#D97706" />
          <span className="text-xs font-medium" style={{ color: "#92400E" }}>
            {colaRevision.length} lead{colaRevision.length > 1 ? "s" : ""} de WhatsApp esperando revisión
          </span>
          <button
            className="ml-auto text-xs font-semibold underline"
            style={{ color: "#92400E" }}
            onClick={() => setEtapa("nuevo")}
          >
            Ver cola
          </button>
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--subtle)" }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nombre, folio..."
            className="w-full h-8 pl-8 pr-3 rounded-lg text-xs border outline-none"
            style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text)" }}
          />
        </div>

        <select
          value={etapa}
          onChange={(e) => setEtapa(e.target.value)}
          className="h-8 px-3 rounded-lg text-xs border outline-none"
          style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text)" }}
        >
          {ETAPA_OPTIONS.map((o) => (
            <option key={o.key} value={o.key}>{o.label}</option>
          ))}
        </select>

      </div>

      {/* Tabla */}
      <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "var(--surface-2)", borderBottom: "1px solid var(--border)" }}>
                {["Folio", "Paciente", "Procedimiento", "Etapa", "Fuente", "Fecha", ""].map((h) => (
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
                  <td colSpan={8} className="text-center py-12 text-xs" style={{ color: "var(--subtle)" }}>
                    Cargando...
                  </td>
                </tr>
              )}
              {!loading && leads.length === 0 && (
                <tr>
                  <td colSpan={8}>
                    <div className="flex flex-col items-center py-16 gap-2">
                      <Inbox size={28} style={{ color: "var(--border)" }} />
                      <p className="text-xs" style={{ color: "var(--subtle)" }}>Sin leads</p>
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
                      <div className="flex items-center gap-2">
                        {lead.en_cola_revision && <Clock size={11} color="#D97706" />}
                        <span className="font-mono text-xs font-semibold" style={{ color: "var(--accent)" }}>
                          {lead.folio}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-xs" style={{ color: "var(--text)" }}>
                        {lead.nombre} {lead.apellido_paterno ?? ""}
                      </span>
                      {lead.vendedores && (
                        <div className="text-xs mt-0.5" style={{ color: "var(--subtle)" }}>
                          Ref: {lead.vendedores.codigo_unico}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs" style={{ color: "var(--muted)" }}>
                        {lead.procedimiento ?? <em style={{ color: "var(--subtle)" }}>Sin especificar</em>}
                      </span>
                      {lead.aseguradoras && (
                        <div className="text-xs" style={{ color: "var(--subtle)" }}>{lead.aseguradoras.nombre}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {etapaInfo && (
                        <Badge label={etapaInfo.label} color={etapaInfo.color} bg={etapaInfo.bg} size="sm" />
                      )}
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
                        <button className="text-xs font-medium transition-colors hover:underline"
                          style={{ color: "var(--accent)" }}>
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
      </div>
    </div>
  )
}
