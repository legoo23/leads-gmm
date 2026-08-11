"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { Phone, Clock, AlertCircle, Inbox, RefreshCw } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ETAPAS_PIPELINE } from "@/constants/lead-etapas"
import { formatDate } from "@/lib/utils"

interface Lead {
  id: number; folio: string; nombre: string; apellido_paterno: string | null
  etapa: string; procedimiento: string | null
  fuente: string | null; fecha_captura: string; en_cola_revision: boolean
}

export default function CallCenterPage() {
  const [cola, setCola] = useState<Lead[]>([])
  const [sinAsignar, setSinAsignar] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    const [colaRes, sinAsignarRes] = await Promise.all([
      fetch("/api/leads?etapa=nuevo&limit=50").then((r) => r.json()),
      fetch("/api/leads?limit=50").then((r) => r.json()),
    ])
    const todos: Lead[] = colaRes.data ?? []
    setCola(todos.filter((l) => l.en_cola_revision))
    setSinAsignar((sinAsignarRes.data ?? []).filter((l: Lead) => l.etapa === "nuevo" && !l.en_cola_revision))
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function aprobarLead(id: number) {
    await fetch(`/api/leads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ en_cola_revision: false }),
    })
    await load()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold" style={{ color: "var(--text)" }}>Call Center</h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--subtle)" }}>Cola de leads y seguimiento</p>
        </div>
        <button onClick={load}
          className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors hover:bg-[var(--surface-2)]"
          style={{ color: "var(--muted)" }}>
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Cola de revisión WhatsApp */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <AlertCircle size={14} color="#D97706" />
          <h2 className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--muted)" }}>
            Cola de revisión WhatsApp ({cola.length})
          </h2>
        </div>
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: "#FCD34D" }}>
          {loading && <div className="text-center py-8 text-xs" style={{ color: "var(--subtle)" }}>Cargando...</div>}
          {!loading && cola.length === 0 && (
            <div className="flex flex-col items-center py-10 gap-2">
              <Inbox size={24} style={{ color: "var(--border)" }} />
              <p className="text-xs" style={{ color: "var(--subtle)" }}>Sin leads en cola</p>
            </div>
          )}
          {cola.map((lead) => (
            <div key={lead.id}
              className="flex items-center gap-4 px-4 py-3 border-b last:border-b-0"
              style={{ background: "#FFFBEB", borderColor: "#FCD34D" }}>
              <Clock size={14} color="#D97706" className="flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-semibold" style={{ color: "var(--accent)" }}>{lead.folio}</span>
                  <span className="text-xs font-medium" style={{ color: "var(--text)" }}>
                    {lead.nombre} {lead.apellido_paterno ?? ""}
                  </span>
                </div>
                <p className="text-xs" style={{ color: "var(--subtle)" }}>
                  WhatsApp · {formatDate(lead.fecha_captura)}
                  {lead.procedimiento ? ` · ${lead.procedimiento}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={() => aprobarLead(lead.id)}>
                  <Phone size={11} />
                  Confirmar lead
                </Button>
                <Link href={`/leads/${lead.id}`}>
                  <Button size="sm" variant="secondary">Ver</Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Leads nuevos sin asignar */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Inbox size={14} style={{ color: "var(--muted)" }} />
          <h2 className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--muted)" }}>
            Nuevos sin asignar ({sinAsignar.length})
          </h2>
        </div>
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "var(--surface-2)", borderBottom: "1px solid var(--border)" }}>
                {["Folio","Paciente","Procedimiento","Fecha",""].map((h) => (
                  <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wide"
                    style={{ color: "var(--subtle)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {!loading && sinAsignar.length === 0 && (
                <tr><td colSpan={6} className="text-center py-10 text-xs" style={{ color: "var(--subtle)" }}>Sin leads</td></tr>
              )}
              {sinAsignar.map((lead) => (
                <tr key={lead.id} className="border-t hover:bg-[var(--surface-2)] transition-colors"
                  style={{ borderColor: "var(--border)" }}>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs font-semibold" style={{ color: "var(--accent)" }}>{lead.folio}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-medium" style={{ color: "var(--text)" }}>
                      {lead.nombre} {lead.apellido_paterno ?? ""}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs" style={{ color: "var(--muted)" }}>{lead.procedimiento ?? "—"}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs tabular-nums" style={{ color: "var(--subtle)" }}>{formatDate(lead.fecha_captura)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/leads/${lead.id}`}>
                      <button className="text-xs font-medium" style={{ color: "var(--accent)" }}>Atender</button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
