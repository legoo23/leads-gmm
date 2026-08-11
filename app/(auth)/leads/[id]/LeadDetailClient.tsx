"use client"
import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import {
  ArrowLeft, Save, ChevronRight, User, Activity,
  Stethoscope, Shield, CheckCircle, Tag, Link2, Copy, Check, Hospital, FileText,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input, Select, Textarea } from "@/components/ui/input"
import { Badge, PrioridadBadge } from "@/components/ui/badge"
import { ETAPAS_PIPELINE, ETAPAS_ACTIVAS, ETAPAS_CIERRE } from "@/constants/lead-etapas"
import { ASEGURADORAS } from "@/constants/aseguradoras"
import { PROCEDIMIENTOS } from "@/constants/procedimientos"
import { GEO_ESTADOS } from "@/constants/geo-mx"
import { formatDate } from "@/lib/utils"
import { PageLoader } from "@/components/ui/spinner"

/* ─── Tipos ─────────────────────────────────────────────────────── */
interface Lead {
  id: number; folio: string; nombre: string; apellido_paterno: string | null
  apellido_materno: string | null; telefono: string | null; telefono_alternativo: string | null
  telefono_alternativo_2: string | null; email: string | null; email_alternativo: string | null
  curp: string | null; fecha_nacimiento: string | null; estado_ciudad: string | null
  prioridad: string; etapa: string; estado: string; fuente: string | null
  codigo_referido: string | null; en_cola_revision: boolean
  notas: string | null; fecha_captura: string
  fecha_contacto: string | null; fecha_conversion: string | null
  vendedores: { nombre: string; codigo_unico: string } | null
  aseguradoras: { nombre: string } | null
  // Padecimientos e Historia Clínica
  diagnostico_principal: string | null; diagnosticos_secundarios: string | null
  cirugias_previas: boolean | null; cirugias_previas_desc: string | null
  tiene_medico_tratante: boolean | null; medico_tratante_nombre: string | null
  notas_clinicas: string | null
  // Procedimiento
  procedimiento: string | null; categoria_quirurgica: string | null
  codigo_procedimiento: string | null; urgencia: string | null; costo_estimado: number | null
  fecha_tentativa: string | null; hospital_sugerido: string | null
  medico_asignado_nombre: string | null; estancia_estimada_dias: number | null
  notas_procedimiento: string | null
  // Póliza GMM
  id_aseguradora: number | null; tipo_plan: string | null; numero_poliza: string | null
  numero_certificado: string | null; vigencia_inicio: string | null; vigencia_fin: string | null
  vigencia_original_inicio: string | null; suma_asegurada: number | null; moneda: string | null
  deducible: number | null; coaseguro_pct: number | null; tope_coaseguro: number | null
  periodo_espera_activo: boolean | null; nombre_titular_poliza: string | null
  // Cobertura y Exclusiones
  cobertura_confirmada: boolean | null; cubre_cirugia: boolean | null
  requiere_preautorizacion: boolean | null; cubre_anestesiologo: boolean | null
  cubre_estudios_preop: boolean | null; cubre_honorarios: boolean | null
  cubre_hospitalizacion: boolean | null; condiciones_excluidas: string | null
  es_preexistencia: boolean | null; numero_autorizacion: string | null
  fecha_autorizacion: string | null; carta_autorizacion_url: string | null
  contacto_aseguradora_nombre: string | null; contacto_aseguradora_telefono: string | null
  notas_validacion: string | null
  // Internamiento
  tipo_ingreso: string | null; es_accidente: boolean | null
  fecha_inicio_sintomas: string | null; mecanismo_ingreso: string | null
  familiar_nombre: string | null; familiar_telefono: string | null
  valorado_medico_previo: boolean | null; atenciones_previas_sgmm: boolean | null
  antecedentes_enfermedad: string | null; numero_episodio: string | null
  numero_siniestro: string | null; folio_programacion: string | null
}

/* ─── Constantes de pipeline ─────────────────────────────────────── */
const ETAPA_ORDER = [
  "nuevo", "contactado", "necesidad_identificada", "seguro_identificado",
  "en_validacion", "viable", "programado",
]
const CLOSURE = ["ganado", "no_viable", "perdido"]

function etapaIndex(etapa: string) {
  if (CLOSURE.includes(etapa)) return ETAPA_ORDER.length
  return ETAPA_ORDER.indexOf(etapa)
}

/* ─── Componentes auxiliares ─────────────────────────────────────── */
function BoolField({ label, value, onChange, disabled }: {
  label: string; value: boolean | null
  onChange: (v: boolean | null) => void; disabled?: boolean
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium" style={{ color: "var(--muted)" }}>{label}</label>
      <select
        disabled={disabled}
        value={value === true ? "si" : value === false ? "no" : ""}
        onChange={(e) => onChange(e.target.value === "si" ? true : e.target.value === "no" ? false : null)}
        className="w-full h-9 px-3 rounded-lg border text-sm outline-none appearance-none bg-no-repeat"
        style={{
          backgroundColor: "var(--surface)",
          borderColor: "var(--border)",
          color: "var(--text)",
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 10px center",
          backgroundSize: "14px",
          paddingRight: "32px",
        }}
      >
        <option value="">Sin definir</option>
        <option value="si">Sí</option>
        <option value="no">No</option>
      </select>
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-semibold uppercase tracking-wide pt-1 pb-2 border-b"
      style={{ color: "var(--subtle)", borderColor: "var(--border)" }}>
      {children}
    </h3>
  )
}

/* ─── Componente principal ───────────────────────────────────────── */
export default function LeadDetailClient({ leadId, rol }: { leadId: number; rol: string }) {
  const [lead, setLead] = useState<Lead | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState("contacto")
  const [saving, setSaving] = useState(false)
  const [changingEtapa, setChangingEtapa] = useState(false)
  const [form, setForm] = useState<Partial<Lead>>({})
  const [saveMsg, setSaveMsg] = useState("")
  // Upload link
  const [uploadLink, setUploadLink] = useState<string | null>(null)
  const [uploadExpiry, setUploadExpiry] = useState<string | null>(null)
  const [generatingLink, setGeneratingLink] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)
  const [docsSeleccionados, setDocsSeleccionados] = useState<string[]>(["poliza", "ine"])

  const loadLead = useCallback(async () => {
    const { data } = await fetch(`/api/leads/${leadId}`).then((r) => r.json())
    if (data) { setLead(data); setForm(data) }
  }, [leadId])

  useEffect(() => {
    loadLead().finally(() => setLoading(false))
    fetch(`/api/leads/${leadId}/upload-token`)
      .then((r) => r.json())
      .then(({ data }) => {
        if (data) { setUploadLink(data.link ?? null); setUploadExpiry(data.expires_at ?? null) }
      })
      .catch(() => {})
  }, [leadId, loadLead])

  const generateUploadLink = useCallback(async () => {
    setGeneratingLink(true)
    const res = await fetch(`/api/leads/${leadId}/upload-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ docs_requeridos: docsSeleccionados }),
    })
    const { data } = await res.json()
    if (data?.link) { setUploadLink(data.link); setUploadExpiry(data.expires_at) }
    setGeneratingLink(false)
  }, [leadId, docsSeleccionados])

  const copyLink = useCallback(() => {
    if (uploadLink) {
      navigator.clipboard.writeText(uploadLink)
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2000)
    }
  }, [uploadLink])

  const set = (k: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }))

  const setBool = (k: string) => (v: boolean | null) =>
    setForm((f) => ({ ...f, [k]: v }))

  async function save() {
    setSaving(true)
    setSaveMsg("")
    // Strip joined relations and primary key before sending
    const { vendedores: _v, aseguradoras: _a, id: _id, ...payload } = form as Record<string, unknown>
    const res = await fetch(`/api/leads/${leadId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    if (res.ok) {
      await loadLead()
      setSaveMsg("Guardado")
      setTimeout(() => setSaveMsg(""), 2500)
    }
    setSaving(false)
  }

  async function changeEtapa(etapa: string) {
    setChangingEtapa(true)
    const res = await fetch(`/api/leads/${leadId}/etapa`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ etapa }),
    })
    if (res.ok) {
      const { data } = await res.json()
      setLead(data)
      setForm((f) => ({ ...f, etapa: data.etapa, estado: data.estado }))
    }
    setChangingEtapa(false)
  }

  if (loading) return <PageLoader />
  if (!lead) return <div className="text-sm" style={{ color: "var(--muted)" }}>Lead no encontrado</div>

  /* ─── Permisos y visibilidad ─────────────────────────────────── */
  const canEdit = ["admin", "gerente", "ejecutivo"].includes(rol)
  const ro = !canEdit

  const eIdx = etapaIndex(lead.etapa)
  const showPadecimientos = eIdx >= etapaIndex("contactado")
  const showSeguro        = eIdx >= etapaIndex("necesidad_identificada")
  const showCobertura     = eIdx >= etapaIndex("seguro_identificado")
  const showInternamiento = eIdx >= etapaIndex("viable") || lead.cobertura_confirmada === true

  const TABS = [
    { key: "contacto",      label: "Contacto",         icon: User,        show: true },
    { key: "padecimientos", label: "Padec. y Proced.",  icon: Stethoscope, show: showPadecimientos },
    { key: "seguro",        label: "Póliza GMM",         icon: Shield,      show: showSeguro },
    { key: "cobertura",     label: "Cobertura",          icon: CheckCircle, show: showCobertura },
    { key: "internamiento", label: "Internamiento",       icon: Hospital,    show: showInternamiento },
    { key: "canal",         label: "Canal",               icon: Tag,         show: true },
    { key: "notas",         label: "Notas",               icon: Activity,    show: true },
  ].filter((t) => t.show)

  const etapaInfo = ETAPAS_PIPELINE[lead.etapa as keyof typeof ETAPAS_PIPELINE]
  // If current tab became hidden (e.g. after etapa reset), fallback to contacto
  const activeTab = TABS.find((t) => t.key === tab) ? tab : "contacto"

  /* ─── Render ─────────────────────────────────────────────────── */
  return (
    <div className="max-w-4xl mx-auto space-y-5">

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex items-start gap-3">
        <Link href="/leads">
          <button className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors hover:bg-[var(--surface-2)]"
            style={{ color: "var(--muted)" }}>
            <ArrowLeft size={15} />
          </button>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-xs font-bold" style={{ color: "var(--accent)" }}>{lead.folio}</span>
            {etapaInfo && <Badge label={etapaInfo.label} color={etapaInfo.color} bg={etapaInfo.bg} size="sm" />}
            <PrioridadBadge prioridad={lead.prioridad} />
            {!canEdit && (
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--surface-2)", color: "var(--muted)" }}>
                Solo lectura
              </span>
            )}
          </div>
          <h1 className="text-lg font-semibold mt-1" style={{ color: "var(--text)" }}>
            {lead.nombre} {lead.apellido_paterno ?? ""} {lead.apellido_materno ?? ""}
          </h1>
          <p className="text-xs" style={{ color: "var(--subtle)" }}>
            Capturado {formatDate(lead.fecha_captura)}
            {lead.fecha_contacto && ` · Contactado ${formatDate(lead.fecha_contacto)}`}
            {lead.fecha_conversion && ` · Convertido ${formatDate(lead.fecha_conversion)}`}
          </p>
        </div>
      </div>

      {/* ── Pipeline stepper ───────────────────────────────────── */}
      <div className="rounded-xl border p-4" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="flex items-center gap-1 flex-wrap">
          {ETAPAS_ACTIVAS.map((key, i) => {
            const info = ETAPAS_PIPELINE[key]
            const isActive = lead.etapa === key
            const isPast = ETAPAS_ACTIVAS.indexOf(lead.etapa as typeof ETAPAS_ACTIVAS[number]) > i
            return (
              <div key={key} className="flex items-center gap-1">
                <button
                  onClick={() => !isActive && !changingEtapa && canEdit && changeEtapa(key)}
                  disabled={changingEtapa || !canEdit}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all"
                  style={{
                    background: isActive ? info.bg : isPast ? "#F0FDF4" : "var(--surface-2)",
                    color: isActive ? info.color : isPast ? "#059669" : "var(--subtle)",
                    border: isActive ? `1.5px solid ${info.color}` : "1.5px solid transparent",
                    opacity: changingEtapa ? 0.6 : 1,
                    cursor: canEdit && !isActive ? "pointer" : "default",
                  }}
                >
                  {info.label}
                </button>
                {i < ETAPAS_ACTIVAS.length - 1 && (
                  <ChevronRight size={11} style={{ color: "var(--border)", flexShrink: 0 }} />
                )}
              </div>
            )
          })}
          <div className="ml-2 flex gap-1">
            {ETAPAS_CIERRE.map((key) => {
              const info = ETAPAS_PIPELINE[key]
              const isActive = lead.etapa === key
              return (
                <button key={key}
                  onClick={() => !isActive && !changingEtapa && canEdit && changeEtapa(key)}
                  disabled={changingEtapa || !canEdit}
                  className="px-2.5 py-1 rounded-full text-xs font-medium transition-all"
                  style={{
                    background: isActive ? info.bg : "var(--surface-2)",
                    color: isActive ? info.color : "var(--subtle)",
                    border: isActive ? `1.5px solid ${info.color}` : "1.5px solid transparent",
                    cursor: canEdit && !isActive ? "pointer" : "default",
                  }}
                >
                  {info.label}
                </button>
              )
            })}
          </div>
        </div>
        {!showPadecimientos && (
          <p className="mt-2 text-xs" style={{ color: "var(--subtle)" }}>
            Guarda cambios en Contacto para avanzar a <strong>Contactado</strong> y desbloquear el expediente completo.
          </p>
        )}
      </div>

      {/* ── Tabs + formulario ──────────────────────────────────── */}
      <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
        {/* Tab bar */}
        <div className="flex border-b overflow-x-auto" style={{ borderColor: "var(--border)" }}>
          {TABS.map(({ key, label, icon: Icon }) => (
            <button key={key}
              onClick={() => setTab(key)}
              className="flex items-center gap-1.5 px-4 py-3 text-xs font-medium whitespace-nowrap transition-colors border-b-2"
              style={{
                borderColor: activeTab === key ? "var(--accent)" : "transparent",
                color: activeTab === key ? "var(--accent)" : "var(--muted)",
              }}
            >
              <Icon size={12} />
              {label}
            </button>
          ))}
        </div>

        <div className="p-5 space-y-5">

          {/* ── CONTACTO ─────────────────────────────────────── */}
          {activeTab === "contacto" && (
            <>
              <div className="grid grid-cols-3 gap-4">
                <Input label="Nombre *" value={form.nombre ?? ""} onChange={set("nombre")} readOnly={ro} />
                <Input label="Apellido paterno *" value={form.apellido_paterno ?? ""} onChange={set("apellido_paterno")} readOnly={ro} />
                <Input label="Apellido materno" value={form.apellido_materno ?? ""} onChange={set("apellido_materno")} readOnly={ro} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <Input label="Teléfono *" value={form.telefono ?? ""} onChange={set("telefono")} maxLength={20} readOnly={ro} />
                <Input label="Tel. alternativo" value={form.telefono_alternativo ?? ""} onChange={set("telefono_alternativo")} maxLength={20} readOnly={ro} />
                <Input label="Tel. alternativo 2" value={form.telefono_alternativo_2 ?? ""} onChange={set("telefono_alternativo_2")} maxLength={20} readOnly={ro} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Email *" type="email" value={form.email ?? ""} onChange={set("email")} readOnly={ro} />
                <Input label="Email alternativo" type="email" value={form.email_alternativo ?? ""} onChange={set("email_alternativo")} readOnly={ro} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <Input label="Fecha de nacimiento" type="date" value={form.fecha_nacimiento ?? ""} onChange={set("fecha_nacimiento")} readOnly={ro} />
                <Input label="CURP" value={form.curp ?? ""} onChange={set("curp")} maxLength={18} className="uppercase" readOnly={ro} />
                <Select label="Estado / Ciudad" value={form.estado_ciudad ?? ""} onChange={set("estado_ciudad")} disabled={ro}>
                  <option value="">— Estado —</option>
                  {GEO_ESTADOS.map((s) => <option key={s} value={s}>{s}</option>)}
                </Select>
              </div>
              <Select label="Prioridad" value={form.prioridad ?? "media"} onChange={set("prioridad")} disabled={ro}>
                <option value="baja">Baja</option>
                <option value="media">Media</option>
                <option value="alta">Alta</option>
                <option value="urgente">Urgente</option>
              </Select>
            </>
          )}

          {/* ── PADECIMIENTOS Y PROCEDIMIENTO ────────────────── */}
          {activeTab === "padecimientos" && (
            <>
              <SectionTitle>Padecimientos e Historia Clínica</SectionTitle>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Diagnóstico principal" value={form.diagnostico_principal ?? ""} onChange={set("diagnostico_principal")} placeholder="ej: Colelitiasis, Hernia inguinal" readOnly={ro} />
                <Input label="Diagnósticos secundarios" value={form.diagnosticos_secundarios ?? ""} onChange={set("diagnosticos_secundarios")} placeholder="Comorbilidades separadas por coma" readOnly={ro} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <BoolField label="¿Cirugías previas?" value={form.cirugias_previas ?? null} onChange={setBool("cirugias_previas")} disabled={ro} />
                <BoolField label="¿Tiene médico tratante?" value={form.tiene_medico_tratante ?? null} onChange={setBool("tiene_medico_tratante")} disabled={ro} />
              </div>
              {form.cirugias_previas && (
                <Input label="Descripción de cirugías previas" value={form.cirugias_previas_desc ?? ""} onChange={set("cirugias_previas_desc")} placeholder="Año, tipo de cirugía, hospital" readOnly={ro} />
              )}
              {form.tiene_medico_tratante && (
                <Input label="Nombre del médico tratante" value={form.medico_tratante_nombre ?? ""} onChange={set("medico_tratante_nombre")} readOnly={ro} />
              )}
              <Textarea label="Notas clínicas" value={form.notas_clinicas ?? ""} onChange={set("notas_clinicas")} rows={3} readOnly={ro} />

              <SectionTitle>Procedimiento Quirúrgico</SectionTitle>
              <div className="grid grid-cols-2 gap-4">
                <Select label="Procedimiento" value={form.procedimiento ?? ""} onChange={set("procedimiento")} disabled={ro}>
                  <option value="">— Procedimiento —</option>
                  {PROCEDIMIENTOS.map((p) => <option key={p.codigo} value={p.nombre}>{p.nombre}</option>)}
                </Select>
                <Input label="Categoría quirúrgica" value={form.categoria_quirurgica ?? ""} onChange={set("categoria_quirurgica")} readOnly={ro} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <Select label="Urgencia" value={form.urgencia ?? "electiva"} onChange={set("urgencia")} disabled={ro}>
                  <option value="electiva">Electiva</option>
                  <option value="programada">Programada</option>
                  <option value="urgente">Urgente</option>
                </Select>
                <Input label="Código CIE-9 / CPT" value={form.codigo_procedimiento ?? ""} onChange={set("codigo_procedimiento")} readOnly={ro} />
                <Input label="Costo estimado (MXN)" type="number" value={form.costo_estimado ?? ""} onChange={set("costo_estimado")} readOnly={ro} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <Input label="Fecha tentativa deseada" type="date" value={form.fecha_tentativa ?? ""} onChange={set("fecha_tentativa")} readOnly={ro} />
                <Input label="Hospital sugerido" value={form.hospital_sugerido ?? ""} onChange={set("hospital_sugerido")} readOnly={ro} />
                <Input label="Médico asignado" value={form.medico_asignado_nombre ?? ""} onChange={set("medico_asignado_nombre")} readOnly={ro} />
              </div>
              <Input label="Estancia estimada (días)" type="number" value={form.estancia_estimada_dias ?? ""} onChange={set("estancia_estimada_dias")} readOnly={ro} />
              <Textarea label="Notas del procedimiento" value={form.notas_procedimiento ?? ""} onChange={set("notas_procedimiento")} rows={3} readOnly={ro} />
            </>
          )}

          {/* ── PÓLIZA GMM ───────────────────────────────────── */}
          {activeTab === "seguro" && (
            <>
              <SectionTitle>Datos de la Póliza</SectionTitle>
              <div className="grid grid-cols-2 gap-4">
                <Select label="Aseguradora *" value={form.id_aseguradora ?? ""} onChange={set("id_aseguradora")} disabled={ro}>
                  <option value="">— Aseguradora —</option>
                  {ASEGURADORAS.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                </Select>
                <Select label="Tipo de plan" value={form.tipo_plan ?? ""} onChange={set("tipo_plan")} disabled={ro}>
                  <option value="">Sin definir</option>
                  <option value="individual">Individual</option>
                  <option value="familiar">Familiar</option>
                  <option value="colectivo">Colectivo</option>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Número de póliza *" value={form.numero_poliza ?? ""} onChange={set("numero_poliza")} readOnly={ro} />
                <Input label="Número de certificado" value={form.numero_certificado ?? ""} onChange={set("numero_certificado")} readOnly={ro} />
              </div>
              <Input label="Nombre del titular de la póliza" value={form.nombre_titular_poliza ?? ""} onChange={set("nombre_titular_poliza")} readOnly={ro} />

              <SectionTitle>Vigencia</SectionTitle>
              <div className="grid grid-cols-3 gap-4">
                <Input label="Vigencia inicio" type="date" value={form.vigencia_inicio ?? ""} onChange={set("vigencia_inicio")} readOnly={ro} />
                <Input label="Vigencia fin" type="date" value={form.vigencia_fin ?? ""} onChange={set("vigencia_fin")} readOnly={ro} />
                <Input label="Inicio vigencia original" type="date" value={form.vigencia_original_inicio ?? ""} onChange={set("vigencia_original_inicio")} readOnly={ro} />
              </div>
              <BoolField label="¿Período de espera activo?" value={form.periodo_espera_activo ?? null} onChange={setBool("periodo_espera_activo")} disabled={ro} />

              <SectionTitle>Montos</SectionTitle>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Suma asegurada" type="number" value={form.suma_asegurada ?? ""} onChange={set("suma_asegurada")} readOnly={ro} />
                <Select label="Moneda" value={form.moneda ?? "MXN"} onChange={set("moneda")} disabled={ro}>
                  <option value="MXN">MXN — Peso mexicano</option>
                  <option value="USD">USD — Dólar</option>
                </Select>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <Input label="Deducible" type="number" value={form.deducible ?? ""} onChange={set("deducible")} readOnly={ro} />
                <Input label="Coaseguro (%)" type="number" value={form.coaseguro_pct ?? ""} onChange={set("coaseguro_pct")} readOnly={ro} />
                <Input label="Tope de coaseguro" type="number" value={form.tope_coaseguro ?? ""} onChange={set("tope_coaseguro")} readOnly={ro} />
              </div>
            </>
          )}

          {/* ── COBERTURA Y EXCLUSIONES ──────────────────────── */}
          {activeTab === "cobertura" && (
            <>
              <SectionTitle>Estado de la Validación</SectionTitle>
              <div className="grid grid-cols-2 gap-4">
                <BoolField label="¿Cobertura confirmada?" value={form.cobertura_confirmada ?? null} onChange={setBool("cobertura_confirmada")} disabled={ro} />
                <BoolField label="¿Requiere pre-autorización?" value={form.requiere_preautorizacion ?? null} onChange={setBool("requiere_preautorizacion")} disabled={ro} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Número de autorización" value={form.numero_autorizacion ?? ""} onChange={set("numero_autorizacion")} readOnly={ro} />
                <Input label="Fecha de autorización" type="date" value={form.fecha_autorizacion ?? ""} onChange={set("fecha_autorizacion")} readOnly={ro} />
              </div>
              {lead.carta_autorizacion_url && (
                <div className="flex items-center gap-2 p-3 rounded-lg" style={{ background: "var(--surface-2)" }}>
                  <FileText size={13} style={{ color: "var(--accent)" }} />
                  <a href={lead.carta_autorizacion_url} target="_blank" rel="noopener noreferrer"
                    className="text-xs font-medium underline" style={{ color: "var(--accent)" }}>
                    Ver carta de autorización
                  </a>
                </div>
              )}

              <SectionTitle>Coberturas Incluidas</SectionTitle>
              <div className="grid grid-cols-2 gap-4">
                <BoolField label="¿Cubre cirugías?" value={form.cubre_cirugia ?? null} onChange={setBool("cubre_cirugia")} disabled={ro} />
                <BoolField label="¿Cubre anestesiólogo?" value={form.cubre_anestesiologo ?? null} onChange={setBool("cubre_anestesiologo")} disabled={ro} />
                <BoolField label="¿Cubre estudios preoperatorios?" value={form.cubre_estudios_preop ?? null} onChange={setBool("cubre_estudios_preop")} disabled={ro} />
                <BoolField label="¿Cubre honorarios médicos?" value={form.cubre_honorarios ?? null} onChange={setBool("cubre_honorarios")} disabled={ro} />
                <BoolField label="¿Cubre hospitalización?" value={form.cubre_hospitalizacion ?? null} onChange={setBool("cubre_hospitalizacion")} disabled={ro} />
                <BoolField label="¿El procedimiento es preexistencia?" value={form.es_preexistencia ?? null} onChange={setBool("es_preexistencia")} disabled={ro} />
              </div>
              <Textarea label="Condiciones / diagnósticos excluidos" value={form.condiciones_excluidas ?? ""} onChange={set("condiciones_excluidas")} rows={2} readOnly={ro} placeholder="Separar por coma" />

              <SectionTitle>Contacto en Aseguradora</SectionTitle>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Nombre del contacto" value={form.contacto_aseguradora_nombre ?? ""} onChange={set("contacto_aseguradora_nombre")} readOnly={ro} />
                <Input label="Teléfono del contacto" value={form.contacto_aseguradora_telefono ?? ""} onChange={set("contacto_aseguradora_telefono")} readOnly={ro} />
              </div>
              <Textarea label="Notas de la validación" value={form.notas_validacion ?? ""} onChange={set("notas_validacion")} rows={3} readOnly={ro} />
            </>
          )}

          {/* ── INTERNAMIENTO ────────────────────────────────── */}
          {activeTab === "internamiento" && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <Select label="Tipo de ingreso" value={form.tipo_ingreso ?? ""} onChange={set("tipo_ingreso")} disabled={ro}>
                  <option value="">— Sin definir —</option>
                  <option value="urgencias">Urgencias</option>
                  <option value="programado">Programado (con carta)</option>
                </Select>
                <BoolField label="¿Es accidente?" value={form.es_accidente ?? null} onChange={setBool("es_accidente")} disabled={ro} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Fecha / inicio de síntomas" value={form.fecha_inicio_sintomas ?? ""} onChange={set("fecha_inicio_sintomas")} placeholder="ej: 15/07/2026" readOnly={ro} />
                <Input label="Número de episodio (brazalete)" value={form.numero_episodio ?? ""} onChange={set("numero_episodio")} readOnly={ro} />
              </div>
              <Input label="Mecanismo de ingreso" value={form.mecanismo_ingreso ?? ""} onChange={set("mecanismo_ingreso")} placeholder="Cómo y cuándo iniciaron los síntomas" readOnly={ro} />
              <div className="grid grid-cols-2 gap-4">
                <Input label="Familiar / acompañante" value={form.familiar_nombre ?? ""} onChange={set("familiar_nombre")} readOnly={ro} />
                <Input label="Teléfono del familiar" value={form.familiar_telefono ?? ""} onChange={set("familiar_telefono")} readOnly={ro} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Número de siniestro (aseguradora)" value={form.numero_siniestro ?? ""} onChange={set("numero_siniestro")} readOnly={ro} />
                <Input label="Folio de programación (vinculación)" value={form.folio_programacion ?? ""} onChange={set("folio_programacion")} readOnly={ro} />
              </div>
              <Input label="Antecedentes / historia clínica" value={form.antecedentes_enfermedad ?? ""} onChange={set("antecedentes_enfermedad")} placeholder="Enfermedades crónicas, cirugías previas, alergias" readOnly={ro} />
              <div className="flex gap-6 mt-1">
                {[
                  { key: "valorado_medico_previo", label: "¿Valorado por médico previo?" },
                  { key: "atenciones_previas_sgmm", label: "¿Atenciones previas con SGMM?" },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer" style={{ color: "var(--muted)" }}>
                    <input
                      type="checkbox"
                      disabled={ro}
                      checked={!!(form as Record<string, unknown>)[key]}
                      onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.checked }))}
                    />
                    <span className="text-xs">{label}</span>
                  </label>
                ))}
              </div>

              {/* Panel de documentos */}
              {canEdit && (
                <div className="mt-2 p-4 rounded-xl border" style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}>
                  <div className="flex items-center gap-2 mb-3">
                    <Link2 size={13} style={{ color: "var(--accent)" }} />
                    <span className="text-xs font-semibold" style={{ color: "var(--text)" }}>Repositorio de documentos</span>
                  </div>
                  {uploadLink ? (
                    <div className="space-y-2">
                      <p className="text-xs" style={{ color: "var(--subtle)" }}>
                        Link activo — vence {uploadExpiry
                          ? new Date(uploadExpiry).toLocaleString("es-MX", { dateStyle: "short", timeStyle: "short" })
                          : ""}
                      </p>
                      <div className="flex items-center gap-2">
                        <input readOnly value={uploadLink}
                          className="flex-1 h-8 px-3 text-xs rounded-lg border font-mono outline-none truncate"
                          style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text)" }} />
                        <button onClick={copyLink}
                          className="h-8 px-3 flex items-center gap-1.5 rounded-lg text-xs font-medium transition-colors"
                          style={{ background: linkCopied ? "#ECFDF5" : "var(--surface)", border: "1px solid var(--border)", color: linkCopied ? "#059669" : "var(--accent)" }}>
                          {linkCopied ? <Check size={12} /> : <Copy size={12} />}
                          {linkCopied ? "¡Copiado!" : "Copiar"}
                        </button>
                      </div>
                      <button onClick={generateUploadLink} disabled={generatingLink} className="text-xs underline" style={{ color: "var(--subtle)" }}>
                        Generar nuevo link
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-xs" style={{ color: "var(--subtle)" }}>Selecciona los documentos a solicitar y genera un link seguro de 48h para que el paciente los suba.</p>
                      <div className="flex flex-wrap gap-3">
                        {[
                          { k: "poliza", l: "Póliza" }, { k: "ine", l: "INE" },
                          { k: "estudios", l: "Estudios" }, { k: "domicilio", l: "Comprobante domicilio" },
                        ].map(({ k, l }) => (
                          <label key={k} className="flex items-center gap-1.5 text-xs cursor-pointer" style={{ color: "var(--muted)" }}>
                            <input type="checkbox" checked={docsSeleccionados.includes(k)}
                              onChange={(e) => setDocsSeleccionados((prev) =>
                                e.target.checked ? [...prev, k] : prev.filter((d) => d !== k))} />
                            {l}
                          </label>
                        ))}
                      </div>
                      <button onClick={generateUploadLink} disabled={generatingLink || docsSeleccionados.length === 0}
                        className="flex items-center gap-1.5 h-8 px-4 rounded-lg text-xs font-medium transition-all"
                        style={{ background: "var(--accent)", color: "#fff", opacity: generatingLink || docsSeleccionados.length === 0 ? 0.6 : 1 }}>
                        <Link2 size={11} />
                        {generatingLink ? "Generando..." : "Generar link de documentos"}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* ── CANAL ────────────────────────────────────────── */}
          {activeTab === "canal" && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <Select label="Fuente" value={form.fuente ?? "formulario"} onChange={set("fuente")} disabled={ro}>
                  <option value="formulario">Formulario web</option>
                  <option value="llamada">Llamada</option>
                  <option value="qr">QR / Vendedor</option>
                  <option value="referido">Referido</option>
                  <option value="whatsapp_bot">WhatsApp Bot</option>
                </Select>
                <Input label="Código referido" value={form.codigo_referido ?? ""} readOnly className="opacity-70" />
              </div>
              {lead.vendedores && (
                <div className="flex items-center gap-2 p-3 rounded-lg" style={{ background: "var(--surface-2)" }}>
                  <Tag size={12} style={{ color: "var(--accent)" }} />
                  <span className="text-xs" style={{ color: "var(--muted)" }}>
                    Vendedor referidor: <strong style={{ color: "var(--text)" }}>{lead.vendedores.nombre}</strong>
                    {" "}({lead.vendedores.codigo_unico})
                  </span>
                </div>
              )}
            </>
          )}

          {/* ── NOTAS ────────────────────────────────────────── */}
          {activeTab === "notas" && (
            <Textarea label="Notas del expediente" value={form.notas ?? ""} onChange={set("notas")} rows={8} readOnly={ro} />
          )}

          {/* Botón guardar */}
          {canEdit && (
            <div className="flex items-center justify-end gap-3 pt-2 border-t" style={{ borderColor: "var(--border)" }}>
              {saveMsg && (
                <span className="text-xs font-medium" style={{ color: "#059669" }}>{saveMsg}</span>
              )}
              <Button onClick={save} loading={saving} size="sm">
                <Save size={12} />
                Guardar cambios
              </Button>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
