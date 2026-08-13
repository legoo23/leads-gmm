"use client"
import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import {
  Phone, Clock, AlertCircle, Inbox, RefreshCw, ChevronDown,
  UserCheck, MessageSquare, PhoneOff, PhoneMissed, Check, X,
  BookOpen, ChevronRight, Users,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ETAPAS_PIPELINE } from "@/constants/lead-etapas"
import { formatDate } from "@/lib/utils"

// ── Types ─────────────────────────────────────────────────────────────────────

interface Lead {
  id: number; folio: string; nombre: string; apellido_paterno: string | null
  etapa: string; procedimiento: string | null; fuente: string | null
  telefono: string | null; fecha_captura: string; en_cola_revision: boolean
  id_agente: number | null; prioridad: string | null; notas: string | null
}

interface Agente { id: string; nombre: string; email: string }

// ── Guión de calificación por etapa ───────────────────────────────────────────

const GUION: Record<string, { titulo: string; preguntas: string[] }> = {
  nuevo: {
    titulo: "Primera llamada — Calificación inicial",
    preguntas: [
      "Presentarse con nombre y empresa.",
      "Confirmar nombre completo del paciente.",
      "¿Cuál es el padecimiento o procedimiento que requiere?",
      "¿Tiene seguro de Gastos Médicos Mayores (GMM)?",
      "¿Cuál aseguradora? ¿Tiene el número de póliza a la mano?",
      "¿El procedimiento es urgente o puede ser electivo/programado?",
      "¿Tiene médico tratante asignado?",
      "Registrar datos de contacto completos.",
    ],
  },
  contactado: {
    titulo: "Identificación de necesidad",
    preguntas: [
      "Confirmar el tipo de procedimiento quirúrgico exacto.",
      "¿Cuál es el diagnóstico principal del médico?",
      "¿Tiene diagnóstico por escrito o estudios previos?",
      "¿Tiene médico especialista que ya lo está atendiendo?",
      "¿Qué tan urgente es la cirugía? ¿Hay una fecha límite?",
      "Completar sección de padecimientos e historia clínica.",
    ],
  },
  necesidad_identificada: {
    titulo: "Captura de póliza GMM",
    preguntas: [
      "¿Con qué aseguradora tiene el seguro?",
      "Número de póliza y número de certificado.",
      "Fecha de inicio de vigencia y fecha de vencimiento.",
      "¿El seguro es individual, familiar o colectivo?",
      "¿Ha usado el seguro antes para procedimientos? ¿Fue aprobado?",
      "Suma asegurada y deducible por evento.",
      "Solicitar envío de carátula de póliza por WhatsApp.",
    ],
  },
  seguro_identificado: {
    titulo: "Seguimiento — En validación",
    preguntas: [
      "Explicar que se está verificando la cobertura con la aseguradora.",
      "Tiempo estimado de respuesta: 48–72 horas hábiles.",
      "Documentos que se están enviando a la aseguradora.",
      "Dar número de caso o referencia para seguimiento.",
      "Confirmar correo del paciente para enviar actualizaciones.",
      "¿Tiene alguna pregunta sobre el proceso?",
    ],
  },
  en_validacion: {
    titulo: "Validación en curso",
    preguntas: [
      "Informar el estado actual de la autorización.",
      "¿La aseguradora ha solicitado documentos adicionales?",
      "Confirmar que los estudios preoperatorios están en proceso.",
      "Fecha tentativa de resolución por parte de la aseguradora.",
    ],
  },
  viable: {
    titulo: "Cobertura confirmada — Programar",
    preguntas: [
      "¡Felicitarle! La cobertura fue aprobada.",
      "Comunicar el número de autorización.",
      "Asignar médico y hospital disponibles.",
      "Coordinar fecha de procedimiento según disponibilidad.",
      "Explicar siguiente paso: ingreso hospitalario y preparación.",
    ],
  },
}

// ── Etapas siguientes para avanzar en el modal ────────────────────────────────

const ETAPAS_AVANCE: Record<string, string[]> = {
  nuevo:                  ["contactado"],
  contactado:             ["necesidad_identificada", "perdido"],
  necesidad_identificada: ["seguro_identificado", "perdido"],
  seguro_identificado:    ["en_validacion", "no_viable", "perdido"],
  en_validacion:          ["viable", "no_viable", "perdido"],
  viable:                 ["programado"],
  programado:             ["ganado", "perdido"],
}

// ── Registro de llamada modal ─────────────────────────────────────────────────

function RegistrarLlamadaModal({
  lead, onClose, onSaved,
}: { lead: Lead; onClose: () => void; onSaved: () => void }) {
  const [contesto, setContesto]   = useState("si")
  const [resultado, setResultado] = useState("interesado")
  const [notas, setNotas]         = useState("")
  const [nuevaEtapa, setNuevaEtapa] = useState("")
  const [saving, setSaving]       = useState(false)

  const avances = ETAPAS_AVANCE[lead.etapa] ?? []

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    const timestamp = new Date().toLocaleString("es-MX", { dateStyle: "short", timeStyle: "short" })
    const resultadoLabel = {
      interesado: "Interesado",
      no_interesado: "No interesado",
      seguimiento: "Requiere seguimiento",
      sin_respuesta: "Sin respuesta",
    }[resultado] ?? resultado

    const entrada = `[${timestamp}] Llamada — ${contesto === "si" ? "Contestó" : "No contestó"} · ${resultadoLabel}${notas ? `\n${notas}` : ""}`

    const notasActuales = lead.notas ? `${lead.notas}\n\n${entrada}` : entrada
    const body: Record<string, unknown> = { notas: notasActuales }
    if (nuevaEtapa) body.etapa = nuevaEtapa
    if (lead.etapa === "nuevo" && contesto === "si") body.fecha_contacto = new Date().toISOString()

    await fetch(`/api/leads/${lead.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })

    setSaving(false)
    onSaved()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-t-2xl sm:rounded-2xl p-5 space-y-4"
        style={{ background: "var(--surface)" }}>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold" style={{ color: "var(--text)" }}>
              Registrar llamada
            </div>
            <div className="text-xs" style={{ color: "var(--muted)" }}>
              {lead.nombre} {lead.apellido_paterno ?? ""} · {lead.folio}
            </div>
          </div>
          <button onClick={onClose} className="p-1" style={{ color: "var(--muted)" }}>
            <X size={15} />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-3">
          {/* ¿Contestó? */}
          <div>
            <div className="text-xs font-medium mb-1.5" style={{ color: "var(--muted)" }}>
              ¿El paciente contestó?
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { v: "si",  label: "Sí, contestó",    icon: <Phone size={12} /> },
                { v: "no",  label: "No contestó",      icon: <PhoneMissed size={12} /> },
                { v: "wa",  label: "WhatsApp",          icon: <MessageSquare size={12} /> },
                { v: "vm",  label: "Buzón de voz",      icon: <PhoneOff size={12} /> },
              ].map(({ v, label, icon }) => (
                <button key={v} type="button"
                  onClick={() => setContesto(v)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition-colors"
                  style={{
                    borderColor: contesto === v ? "var(--accent)" : "var(--border)",
                    background:  contesto === v ? "var(--accent-bg)" : "transparent",
                    color:       contesto === v ? "var(--accent)" : "var(--muted)",
                  }}>
                  {icon}{label}
                </button>
              ))}
            </div>
          </div>

          {/* Resultado */}
          {contesto === "si" && (
            <div>
              <div className="text-xs font-medium mb-1.5" style={{ color: "var(--muted)" }}>
                Resultado de la llamada
              </div>
              <select value={resultado} onChange={(e) => setResultado(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border text-sm outline-none"
                style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text)" }}>
                <option value="interesado">Interesado — continúa el proceso</option>
                <option value="no_interesado">No interesado — cerrar lead</option>
                <option value="seguimiento">Requiere más información — dar seguimiento</option>
              </select>
            </div>
          )}

          {/* Notas */}
          <div>
            <div className="text-xs font-medium mb-1.5" style={{ color: "var(--muted)" }}>
              Notas de la llamada
            </div>
            <textarea rows={2} value={notas} onChange={(e) => setNotas(e.target.value)}
              placeholder="Observaciones relevantes..."
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none resize-none"
              style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text)" }} />
          </div>

          {/* Avanzar etapa */}
          {avances.length > 0 && (
            <div>
              <div className="text-xs font-medium mb-1.5" style={{ color: "var(--muted)" }}>
                Avanzar etapa (opcional)
              </div>
              <select value={nuevaEtapa} onChange={(e) => setNuevaEtapa(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border text-sm outline-none"
                style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text)" }}>
                <option value="">— Mantener etapa actual —</option>
                {avances.map((k) => {
                  const e = ETAPAS_PIPELINE[k as keyof typeof ETAPAS_PIPELINE]
                  return <option key={k} value={k}>{e?.label ?? k}</option>
                })}
              </select>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="secondary" size="sm" onClick={onClose}>Cancelar</Button>
            <Button type="submit" size="sm" loading={saving}>
              <Check size={12} /> Guardar
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Lead Row / Card ───────────────────────────────────────────────────────────

function LeadRow({ lead, agentes, onRefresh }: {
  lead: Lead; agentes: Agente[]; onRefresh: () => void
}) {
  const [modal, setModal]     = useState(false)
  const [assigning, setAssigning] = useState(false)
  const etapa = ETAPAS_PIPELINE[lead.etapa as keyof typeof ETAPAS_PIPELINE]

  async function assign(userId: string) {
    setAssigning(true)
    await fetch(`/api/leads/${lead.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id_agente: userId || null }),
    })
    setAssigning(false)
    onRefresh()
  }

  async function confirmarLead() {
    await fetch(`/api/leads/${lead.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ en_cola_revision: false }),
    })
    onRefresh()
  }

  return (
    <>
      <div className="flex items-center gap-3 px-4 py-3 border-b last:border-b-0"
        style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-xs font-semibold" style={{ color: "var(--accent)" }}>
              {lead.folio}
            </span>
            <span className="text-xs font-medium" style={{ color: "var(--text)" }}>
              {lead.nombre} {lead.apellido_paterno ?? ""}
            </span>
            {etapa && (
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                style={{ background: etapa.bg, color: etapa.color }}>
                {etapa.label}
              </span>
            )}
          </div>
          <div className="text-xs mt-0.5" style={{ color: "var(--subtle)" }}>
            {[lead.procedimiento, lead.telefono, formatDate(lead.fecha_captura)].filter(Boolean).join(" · ")}
          </div>
        </div>

        {/* Assign agent */}
        <select
          defaultValue={lead.id_agente ?? ""}
          onChange={(e) => assign(e.target.value)}
          disabled={assigning}
          className="h-8 px-2 rounded-lg border text-xs outline-none hidden sm:block"
          style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--muted)", minWidth: 120 }}>
          <option value="">Sin asignar</option>
          {agentes.map((a) => (
            <option key={a.id} value={a.id}>{a.nombre}</option>
          ))}
        </select>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {lead.en_cola_revision && (
            <Button size="sm" onClick={confirmarLead}>
              <UserCheck size={11} /> Confirmar
            </Button>
          )}
          <button onClick={() => setModal(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-medium"
            style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
            <Phone size={11} /> Llamada
          </button>
          <Link href={`/leads/${lead.id}`}
            className="text-xs font-medium" style={{ color: "var(--accent)" }}>
            Ver
          </Link>
        </div>
      </div>

      {modal && (
        <RegistrarLlamadaModal lead={lead} onClose={() => setModal(false)} onSaved={onRefresh} />
      )}
    </>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function CallCenterPage() {
  const [tab, setTab] = useState<"cola" | "sin_asignar" | "seguimiento" | "guion">("cola")
  const [cola, setCola]           = useState<Lead[]>([])
  const [sinAsignar, setSinAsignar] = useState<Lead[]>([])
  const [seguimiento, setSeguimiento] = useState<Lead[]>([])
  const [agentes, setAgentes]     = useState<Agente[]>([])
  const [loading, setLoading]     = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const [r1, r2, r3, r4] = await Promise.all([
      fetch("/api/leads?etapa=nuevo&limit=100").then((r) => r.json()),
      fetch("/api/leads?etapa=contactado&limit=100").then((r) => r.json()),
      fetch("/api/leads?etapa=necesidad_identificada&limit=100").then((r) => r.json()),
      fetch("/api/admin/usuarios").then((r) => r.json()),
    ])

    const nuevos: Lead[]    = r1.data ?? []
    const contactados: Lead[] = r2.data ?? []
    const necesidad: Lead[] = r3.data ?? []

    setCola(nuevos.filter((l) => l.en_cola_revision))
    setSinAsignar(nuevos.filter((l) => !l.en_cola_revision))
    setSeguimiento([...contactados, ...necesidad])
    setAgentes(r4.data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const kpis = [
    { label: "En cola WA",       value: cola.length,         color: "#D97706", bg: "#FFFBEB" },
    { label: "Sin asignar",      value: sinAsignar.length,   color: "#2563EB", bg: "#EFF6FF" },
    { label: "En seguimiento",   value: seguimiento.length,  color: "#059669", bg: "#ECFDF5" },
    { label: "Total agentes",    value: agentes.length,      color: "var(--accent)", bg: "var(--surface-2)" },
  ]

  return (
    <div className="space-y-5">
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

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {kpis.map(({ label, value, color, bg }) => (
          <div key={label} className="rounded-xl border p-3"
            style={{ background: bg, borderColor: "var(--border)" }}>
            <div className="text-2xl font-bold tabular-nums" style={{ color }}>{value}</div>
            <div className="text-xs mt-0.5" style={{ color }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b" style={{ borderColor: "var(--border)" }}>
        {([
          { key: "cola",        label: `Cola WA (${cola.length})`,              icon: <AlertCircle size={12} /> },
          { key: "sin_asignar", label: `Sin asignar (${sinAsignar.length})`,    icon: <Inbox size={12} /> },
          { key: "seguimiento", label: `Seguimiento (${seguimiento.length})`,   icon: <Clock size={12} /> },
          { key: "guion",       label: "Guión",                                  icon: <BookOpen size={12} /> },
        ] as const).map(({ key, label, icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 -mb-px transition-colors"
            style={{
              borderBottomColor: tab === key ? "var(--accent)" : "transparent",
              color: tab === key ? "var(--accent)" : "var(--muted)",
            }}>
            {icon}{label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-12 text-xs" style={{ color: "var(--subtle)" }}>Cargando...</div>
      )}

      {/* ── TAB: COLA WA ── */}
      {!loading && tab === "cola" && (
        <div className="rounded-xl border overflow-hidden"
          style={{ borderColor: cola.length > 0 ? "#FCD34D" : "var(--border)" }}>
          {cola.length === 0 ? (
            <div className="flex flex-col items-center py-12 gap-2">
              <Inbox size={24} style={{ color: "var(--border)" }} />
              <p className="text-xs" style={{ color: "var(--subtle)" }}>Sin leads en cola — ¡todo revisado!</p>
            </div>
          ) : cola.map((lead) => (
            <LeadRow key={lead.id} lead={lead} agentes={agentes} onRefresh={load} />
          ))}
        </div>
      )}

      {/* ── TAB: SIN ASIGNAR ── */}
      {!loading && tab === "sin_asignar" && (
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
          {sinAsignar.length === 0 ? (
            <div className="flex flex-col items-center py-12 gap-2">
              <Users size={24} style={{ color: "var(--border)" }} />
              <p className="text-xs" style={{ color: "var(--subtle)" }}>Sin leads nuevos sin asignar</p>
            </div>
          ) : sinAsignar.map((lead) => (
            <LeadRow key={lead.id} lead={lead} agentes={agentes} onRefresh={load} />
          ))}
        </div>
      )}

      {/* ── TAB: SEGUIMIENTO ── */}
      {!loading && tab === "seguimiento" && (
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
          {seguimiento.length === 0 ? (
            <div className="flex flex-col items-center py-12 gap-2">
              <Clock size={24} style={{ color: "var(--border)" }} />
              <p className="text-xs" style={{ color: "var(--subtle)" }}>Sin leads en seguimiento activo</p>
            </div>
          ) : seguimiento.map((lead) => (
            <LeadRow key={lead.id} lead={lead} agentes={agentes} onRefresh={load} />
          ))}
        </div>
      )}

      {/* ── TAB: GUIÓN ── */}
      {tab === "guion" && (
        <div className="space-y-3">
          {Object.entries(GUION).map(([etapaKey, { titulo, preguntas }]) => {
            const etapa = ETAPAS_PIPELINE[etapaKey as keyof typeof ETAPAS_PIPELINE]
            return (
              <details key={etapaKey} className="rounded-xl border overflow-hidden group"
                style={{ borderColor: "var(--border)" }}>
                <summary className="flex items-center gap-3 px-4 py-3 cursor-pointer list-none"
                  style={{ background: "var(--surface-2)" }}>
                  {etapa && (
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0"
                      style={{ background: etapa.bg, color: etapa.color }}>
                      {etapa.label}
                    </span>
                  )}
                  <span className="text-sm font-medium flex-1" style={{ color: "var(--text)" }}>{titulo}</span>
                  <ChevronRight size={14} className="group-open:rotate-90 transition-transform flex-shrink-0"
                    style={{ color: "var(--muted)" }} />
                </summary>
                <div className="px-4 py-3" style={{ background: "var(--surface)" }}>
                  <ol className="space-y-1.5 list-none">
                    {preguntas.map((p, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm" style={{ color: "var(--text)" }}>
                        <span className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5"
                          style={{ background: etapa?.bg ?? "var(--surface-2)", color: etapa?.color ?? "var(--muted)" }}>
                          {i + 1}
                        </span>
                        {p}
                      </li>
                    ))}
                  </ol>
                </div>
              </details>
            )
          })}
        </div>
      )}
    </div>
  )
}
