"use client"
import { useState, useEffect, useCallback, useRef } from "react"
import Link from "next/link"
import {
  ArrowLeft, Save, ChevronRight, User, Activity,
  Stethoscope, Shield, Tag, Link2, Copy, Check, Hospital, FileText, UserCheck, Search,
  Plus, Trash2, ChevronDown, ChevronUp,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input, Select, Textarea } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ETAPAS_PIPELINE, ETAPAS_ACTIVAS, ETAPAS_CIERRE } from "@/constants/lead-etapas"
import { ASEGURADORAS } from "@/constants/aseguradoras"
import { PROCEDIMIENTOS } from "@/constants/procedimientos"
import { ESPECIALIDADES_MEDICAS } from "@/constants/especialidades-medicas"
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
  fuente_especifica: string | null
  codigo_referido: string | null; en_cola_revision: boolean
  notas: string | null; fecha_captura: string
  fecha_contacto: string | null; fecha_conversion: string | null
  vendedores: { nombre: string; codigo_unico: string } | null
  aseguradoras: { nombre: string } | null
  campanas: { nombre: string; codigo_unico: string } | null
  empresas: { id: number; nombre: string } | null
  datos_adicionales: Record<string, string> | null
  // Padecimientos e Historia Clínica
  diagnostico_principal: string | null; diagnosticos_secundarios: string | null
  cirugias_previas: boolean | null; cirugias_previas_desc: string | null
  tiene_medico_tratante: boolean | null; medico_tratante_nombre: string | null
  notas_clinicas: string | null
  // Procedimiento
  procedimiento: string | null; categoria_quirurgica: string | null
  codigo_procedimiento: string | null; urgencia: string | null; costo_estimado: number | null
  fecha_tentativa: string | null; fecha_diagnostico: string | null; estancia_estimada_dias: number | null
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
  carta_autorizacion_path: string | null
  contacto_aseguradora_nombre: string | null; contacto_aseguradora_telefono: string | null
  notas_validacion: string | null
  // Médico asignado
  id_medico: number | null
  medico_asignado_nombre: string | null
  medico_telefono: string | null
  medico_email: string | null
  medico_especialidad: string | null
  medico_en_red: boolean | null
  medico_hospitales: string | null
  // Internamiento
  tipo_ingreso: string | null; es_accidente: boolean | null
  fecha_inicio_sintomas: string | null; mecanismo_ingreso: string | null
  familiar_nombre: string | null; familiar_telefono: string | null
  valorado_medico_previo: boolean | null; atenciones_previas_sgmm: boolean | null
  antecedentes_enfermedad: string | null; numero_episodio: string | null
  numero_siniestro: string | null; folio_programacion: string | null
}

/* ─── Constantes de canal ────────────────────────────────────────── */
const FUENTE_LABEL: Record<string, string> = {
  whatsapp_bot:   "WhatsApp Bot",
  formulario:     "Formulario web",
  convenio:       "Convenio empresarial",
  qr:             "QR / Vendedor",
  referido:       "Referido directo",
  llamada:        "Llamada entrante",
  redes_sociales: "Redes sociales",
}

const FUENTE_STYLE: Record<string, { background: string; color: string }> = {
  whatsapp_bot:   { background: "#ECFDF5", color: "#059669" },
  formulario:     { background: "#EFF6FF", color: "#2563EB" },
  qr:             { background: "#F5F3FF", color: "#7C3AED" },
  referido:       { background: "#FFFBEB", color: "#D97706" },
  llamada:        { background: "#FEF2F2", color: "#DC2626" },
  redes_sociales: { background: "#F0F9FF", color: "#0EA5E9" },
  convenio:       { background: "#FFF7ED", color: "#C2410C" },
}

/* ─── Constantes de pipeline ─────────────────────────────────────── */
const CLOSURE = ["ganado", "no_viable", "perdido"]

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

/* ─── Especialidad con dropdown + "Otro" libre ───────────────────── */
function EspecialidadSelect({ value, onChange, disabled }: {
  value: string; onChange: (v: string) => void; disabled?: boolean
}) {
  const known = ESPECIALIDADES_MEDICAS as readonly string[]
  const isCustom = value !== "" && !known.includes(value)
  const selectValue = isCustom ? "__otro__" : value

  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium" style={{ color: "var(--muted)" }}>Especialidad</label>
      <select
        disabled={disabled}
        value={selectValue}
        onChange={(e) => {
          if (e.target.value === "__otro__") onChange("")
          else onChange(e.target.value)
        }}
        className="w-full h-9 px-3 rounded-lg border text-sm outline-none appearance-none"
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
        <option value="">— Especialidad —</option>
        {ESPECIALIDADES_MEDICAS.map((e) => (
          <option key={e} value={e}>{e}</option>
        ))}
        <option value="__otro__">Otro</option>
      </select>
      {(selectValue === "__otro__" || isCustom) && (
        <input
          type="text"
          disabled={disabled}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Especificar especialidad"
          className="w-full h-9 px-3 rounded-lg border text-sm outline-none mt-1"
          style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text)", textTransform: "uppercase" }}
        />
      )}
    </div>
  )
}

/* ─── Póliza excedente ───────────────────────────────────────────── */
interface PolizaExcedente {
  id?: number
  aseguradora_nombre: string
  tipo_plan: string
  numero_poliza: string
  numero_certificado: string
  nombre_titular: string
  vigencia_inicio: string
  vigencia_fin: string
  suma_asegurada: string
  moneda: string
  deducible: string
  coaseguro_pct: string
  tope_coaseguro: string
  periodo_espera_activo: boolean | null
  notas: string
  _expanded: boolean
  _saving: boolean
}

function emptyPoliza(): PolizaExcedente {
  return {
    aseguradora_nombre: "", tipo_plan: "", numero_poliza: "", numero_certificado: "",
    nombre_titular: "", vigencia_inicio: "", vigencia_fin: "",
    suma_asegurada: "", moneda: "MXN", deducible: "", coaseguro_pct: "", tope_coaseguro: "",
    periodo_espera_activo: null, notas: "", _expanded: true, _saving: false,
  }
}

/* ─── Estudio preoperatorio ──────────────────────────────────────── */
interface EstudioPreop {
  id?: number
  nombre: string
  tiene_fisico: "pendiente" | "si" | "digital" | "no"
  _saving: boolean
  _dirty: boolean
}

const ESTUDIOS_CATALOGO = [
  "Biometría hemática completa (BHC)",
  "Química sanguínea (QS)",
  "Examen general de orina (EGO)",
  "Tiempos de coagulación",
  "Pruebas de función hepática",
  "Electrocardiograma (ECG)",
  "Radiografía de tórax",
  "Ecocardiograma",
  "Tomografía computada",
  "Resonancia magnética (RM)",
  "Ultrasonido abdominal",
  "Endoscopía",
  "Colonoscopía",
  "Espirometría",
  "Valoración preanestésica",
  "Otro",
]

const FISICO_LABEL: Record<string, string> = {
  pendiente: "Pendiente",
  si:        "✓ Tiene original",
  digital:   "Escaneado / digital",
  no:        "No disponible",
}

const FISICO_STYLE: Record<string, { background: string; color: string }> = {
  pendiente: { background: "#FEF9C3", color: "#92400E" },
  si:        { background: "#ECFDF5", color: "#059669" },
  digital:   { background: "#EFF6FF", color: "#2563EB" },
  no:        { background: "#FEF2F2", color: "#DC2626" },
}

/* ─── Tipo resultado búsqueda médicos ────────────────────────────── */
interface MedicoResult {
  id: number
  nombre: string
  especialidad: string | null
  telefono: string | null
  email: string | null
  cedula: string | null
  en_red: boolean | null
  hospitales: { nombre: string; ciudad: string | null } | null
}

/* ─── CartaButton — T-05: URL firmada de 1h, nunca expone path directo ── */
function CartaButton({ leadId }: { leadId: number }) {
  const [loading, setLoading] = useState(false)

  async function openCarta() {
    setLoading(true)
    try {
      const res = await fetch(`/api/leads/${leadId}/carta`)
      if (!res.ok) { alert("No se pudo generar el enlace. Intenta de nuevo."); return }
      const { url } = await res.json()
      window.open(url, "_blank", "noopener,noreferrer")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-2 p-3 rounded-lg" style={{ background: "var(--surface-2)" }}>
      <FileText size={13} style={{ color: "var(--accent)" }} />
      <button
        onClick={openCarta}
        disabled={loading}
        className="text-xs font-medium underline disabled:opacity-50"
        style={{ color: "var(--accent)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
      >
        {loading ? "Generando enlace..." : "Ver carta de autorización"}
      </button>
      <span className="text-xs" style={{ color: "var(--subtle)" }}>(enlace temporal 1h)</span>
    </div>
  )
}

/* ─── Componente principal ───────────────────────────────────────── */
export default function LeadDetailClient({ leadId, rol }: { leadId: number; rol: string }) {
  const [lead, setLead] = useState<Lead | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState("contacto")
  const [saving, setSaving] = useState(false)
  const [changingEtapa, setChangingEtapa] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [form, setForm] = useState<Partial<Lead>>({})
  const [saveMsg, setSaveMsg] = useState("")
  const [etapaError, setEtapaError] = useState("")
  // Upload link
  const [uploadLink, setUploadLink] = useState<string | null>(null)
  const [uploadExpiry, setUploadExpiry] = useState<string | null>(null)
  const [generatingLink, setGeneratingLink] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)
  const [docsSeleccionados, setDocsSeleccionados] = useState<string[]>(["poliza", "ine"])

  // Pólizas excedentes
  const [polizasExcedentes, setPolizasExcedentes] = useState<PolizaExcedente[]>([])

  // Estudios preoperatorios
  const [estudios, setEstudios] = useState<EstudioPreop[]>([])

  // Búsqueda de médicos
  const [medicoQuery, setMedicoQuery] = useState("")
  const [medicoFiltroEstado, setMedicoFiltroEstado] = useState("")
  const [medicoResults, setMedicoResults] = useState<MedicoResult[]>([])
  const [medicoSearching, setMedicoSearching] = useState(false)
  const [showManualEntry, setShowManualEntry] = useState(false)
  const medicoSearchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  const loadLead = useCallback(async () => {
    const { data } = await fetch(`/api/leads/${leadId}`).then((r) => r.json())
    if (data) { setLead(data); setForm(data) }
  }, [leadId])

  const loadPolizasExcedentes = useCallback(async () => {
    const res = await fetch(`/api/leads/${leadId}/polizas-excedentes`)
    const { data } = await res.json()
    if (Array.isArray(data)) {
      setPolizasExcedentes(data.map((p: Record<string, unknown>) => ({
        id: p.id as number,
        aseguradora_nombre: String(p.aseguradora_nombre ?? ""),
        tipo_plan: String(p.tipo_plan ?? ""),
        numero_poliza: String(p.numero_poliza ?? ""),
        numero_certificado: String(p.numero_certificado ?? ""),
        nombre_titular: String(p.nombre_titular ?? ""),
        vigencia_inicio: String(p.vigencia_inicio ?? ""),
        vigencia_fin: String(p.vigencia_fin ?? ""),
        suma_asegurada: p.suma_asegurada != null ? String(p.suma_asegurada) : "",
        moneda: String(p.moneda ?? "MXN"),
        deducible: p.deducible != null ? String(p.deducible) : "",
        coaseguro_pct: p.coaseguro_pct != null ? String(p.coaseguro_pct) : "",
        tope_coaseguro: p.tope_coaseguro != null ? String(p.tope_coaseguro) : "",
        periodo_espera_activo: (p.periodo_espera_activo as boolean | null) ?? null,
        notas: String(p.notas ?? ""),
        _expanded: false,
        _saving: false,
      })))
    }
  }, [leadId])

  const loadEstudios = useCallback(async () => {
    const res = await fetch(`/api/leads/${leadId}/estudios-preop`)
    const { data } = await res.json()
    if (Array.isArray(data)) {
      setEstudios(data.map((e: Record<string, unknown>) => ({
        id: e.id as number,
        nombre: String(e.nombre ?? ""),
        tiene_fisico: (e.tiene_fisico as EstudioPreop["tiene_fisico"]) ?? "pendiente",
        _saving: false,
        _dirty: false,
      })))
    }
  }, [leadId])

  useEffect(() => {
    Promise.all([loadLead(), loadPolizasExcedentes(), loadEstudios()]).finally(() => setLoading(false))
    fetch(`/api/leads/${leadId}/upload-token`)
      .then((r) => r.json())
      .then(({ data }) => {
        if (data) { setUploadLink(data.link ?? null); setUploadExpiry(data.expires_at ?? null) }
      })
      .catch(() => {})
  }, [leadId, loadLead, loadPolizasExcedentes, loadEstudios])

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

  const searchMedicos = useCallback((q: string, soloRed = false, estado = "") => {
    if (medicoSearchTimeout.current) clearTimeout(medicoSearchTimeout.current)
    if (q.length < 2 && !estado) { setMedicoResults([]); setMedicoSearching(false); return }
    setMedicoSearching(true)
    medicoSearchTimeout.current = setTimeout(async () => {
      const params = new URLSearchParams({ limit: "12" })
      if (q.length >= 2) params.set("q", q)
      if (soloRed) params.set("red", "true")
      if (estado) params.set("cobertura", estado)
      const res = await fetch(`/api/medicos?${params}`)
      const { data } = await res.json()
      setMedicoResults(data ?? [])
      setMedicoSearching(false)
    }, 280)
  }, [])

  const selectMedicoCatalog = useCallback((m: MedicoResult) => {
    const hospitalNombre = m.hospitales
      ? `${m.hospitales.nombre}${m.hospitales.ciudad ? `, ${m.hospitales.ciudad}` : ""}`
      : ""
    setForm((f) => ({
      ...f,
      id_medico: m.id,
      medico_asignado_nombre: m.nombre,
      medico_especialidad: m.especialidad ?? "",
      medico_telefono: m.telefono ?? "",
      medico_email: m.email ?? "",
      medico_en_red: m.en_red ?? false,
      medico_hospitales: hospitalNombre,
    }))
    setMedicoQuery("")
    setMedicoResults([])
    setShowManualEntry(false)
  }, [])

  function updateEstudio(idx: number, field: keyof EstudioPreop, value: unknown) {
    setEstudios((prev) => prev.map((e, i) => i === idx ? { ...e, [field]: value, _dirty: true } : e))
  }

  async function saveEstudio(idx: number) {
    const e = estudios[idx]
    if (!e.nombre.trim()) return
    setEstudios((prev) => prev.map((x, i) => i === idx ? { ...x, _saving: true } : x))
    const method = e.id ? "PATCH" : "POST"
    const url = e.id
      ? `/api/leads/${leadId}/estudios-preop/${e.id}`
      : `/api/leads/${leadId}/estudios-preop`
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre: e.nombre, tiene_fisico: e.tiene_fisico }),
    })
    const { data } = await res.json()
    if (data) {
      setEstudios((prev) => prev.map((x, i) =>
        i === idx ? { ...x, id: data.id, _saving: false, _dirty: false } : x
      ))
    } else {
      setEstudios((prev) => prev.map((x, i) => i === idx ? { ...x, _saving: false } : x))
    }
  }

  async function deleteEstudio(idx: number) {
    const e = estudios[idx]
    if (!e.id) { setEstudios((prev) => prev.filter((_, i) => i !== idx)); return }
    await fetch(`/api/leads/${leadId}/estudios-preop/${e.id}`, { method: "DELETE" })
    setEstudios((prev) => prev.filter((_, i) => i !== idx))
  }

  function updatePoliza(idx: number, field: keyof PolizaExcedente, value: unknown) {
    setPolizasExcedentes((prev) => prev.map((p, i) => i === idx ? { ...p, [field]: value } : p))
  }

  async function savePoliza(idx: number) {
    const p = polizasExcedentes[idx]
    setPolizasExcedentes((prev) => prev.map((x, i) => i === idx ? { ...x, _saving: true } : x))
    const method = p.id ? "PATCH" : "POST"
    const url = p.id
      ? `/api/leads/${leadId}/polizas-excedentes/${p.id}`
      : `/api/leads/${leadId}/polizas-excedentes`
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(p),
    })
    const { data } = await res.json()
    if (data) {
      setPolizasExcedentes((prev) => prev.map((x, i) =>
        i === idx ? { ...x, id: data.id, _saving: false, _expanded: false } : x
      ))
    } else {
      setPolizasExcedentes((prev) => prev.map((x, i) => i === idx ? { ...x, _saving: false } : x))
    }
  }

  async function deletePoliza(idx: number) {
    const p = polizasExcedentes[idx]
    if (!p.id) {
      setPolizasExcedentes((prev) => prev.filter((_, i) => i !== idx))
      return
    }
    if (!confirm("¿Eliminar esta póliza excedente?")) return
    await fetch(`/api/leads/${leadId}/polizas-excedentes/${p.id}`, { method: "DELETE" })
    setPolizasExcedentes((prev) => prev.filter((_, i) => i !== idx))
  }

  async function save() {
    setSaving(true)
    setSaveMsg("")
    // Strip joined relations, encrypted fields y etapa/estado
    // (etapa va por /etapa endpoint; excluirla aquí activa el auto-avance del API)
    const {
      vendedores: _v, aseguradoras: _a, campanas: _c, medicos: _m, hospitales: _h, empresas: _e,
      id: _id,
      etapa: _etapa, estado: _estado,
      telefono_enc: _te, telefono_hash: _th,
      email_enc: _ee, email_hash: _eh,
      curp_enc: _ce, curp_hash: _ch,
      nombre_enc: _ne,
      numero_poliza_enc: _pe,
      ...payload
    } = form as Record<string, unknown>
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

  async function deleteLead() {
    setDeleting(true)
    const res = await fetch(`/api/leads/${leadId}`, { method: "DELETE" })
    setDeleting(false)
    if (res.ok) {
      window.location.href = "/leads"
    } else {
      const j = await res.json()
      alert(j.error ?? "Error al eliminar el lead")
      setConfirmDelete(false)
    }
  }

  async function changeEtapa(etapa: string) {
    setChangingEtapa(true)
    setEtapaError("")
    const res = await fetch(`/api/leads/${leadId}/etapa`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ etapa }),
    })
    if (res.ok) {
      const { data } = await res.json()
      setLead(data)
      setForm((f) => ({ ...f, etapa: data.etapa, estado: data.estado }))
    } else {
      const json = await res.json()
      setEtapaError(json.error ?? "Error al cambiar la etapa")
      setTimeout(() => setEtapaError(""), 6000)
    }
    setChangingEtapa(false)
  }

  if (loading) return <PageLoader />
  if (!lead) return <div className="text-sm" style={{ color: "var(--muted)" }}>Lead no encontrado</div>

  /* ─── Permisos ───────────────────────────────────────────────── */
  const canEdit = ["admin", "gerente", "ejecutivo"].includes(rol)
  const ro = !canEdit

  const TABS = [
    { key: "contacto",      label: "Contacto",     icon: User },
    { key: "necesidad",     label: "Necesidad",     icon: Stethoscope },
    { key: "medico",        label: "Médico",        icon: UserCheck },
    { key: "seguro",        label: "Seguro GMM",    icon: Shield },
    { key: "internamiento", label: "Internamiento", icon: Hospital },
    { key: "canal",         label: "Canal",         icon: Tag },
    { key: "notas",         label: "Notas",         icon: Activity },
  ]

  const etapaInfo = ETAPAS_PIPELINE[lead.etapa as keyof typeof ETAPAS_PIPELINE]
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
        {rol === "admin" && (
          <button onClick={() => setConfirmDelete(true)}
            className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors hover:bg-red-50"
            style={{ color: "#DC2626" }} title="Eliminar lead">
            <Trash2 size={14} />
          </button>
        )}
      </div>

      {/* ── Confirmación de eliminación ─────────────────────────── */}
      {confirmDelete && (
        <div className="rounded-xl border p-4 flex flex-col gap-3" style={{ background: "#FEF2F2", borderColor: "#FECACA" }}>
          <p className="text-sm font-semibold" style={{ color: "#991B1B" }}>
            ¿Eliminar este lead permanentemente?
          </p>
          <p className="text-xs" style={{ color: "#DC2626" }}>
            Esta acción no se puede deshacer. Se eliminará el expediente completo de {lead.nombre} {lead.apellido_paterno ?? ""}.
          </p>
          <div className="flex items-center gap-2">
            <button onClick={deleteLead} disabled={deleting}
              className="px-4 h-8 rounded-lg text-xs font-semibold text-white transition-colors"
              style={{ background: "#DC2626" }}>
              {deleting ? "Eliminando..." : "Sí, eliminar"}
            </button>
            <button onClick={() => setConfirmDelete(false)} disabled={deleting}
              className="px-4 h-8 rounded-lg text-xs border transition-colors"
              style={{ borderColor: "#FECACA", color: "#DC2626" }}>
              Cancelar
            </button>
          </div>
        </div>
      )}

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
          {/* Indicador de decisión manual desde seguro_identificado */}
          {(lead.etapa === "seguro_identificado" || lead.etapa === "contactado" || lead.etapa === "necesidad_identificada") && canEdit && (
            <div className="ml-auto flex items-center gap-1.5 text-xs" style={{ color: "var(--subtle)" }}>
              <span>→ decide:</span>
            </div>
          )}

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
      </div>

      {/* ── Error de cambio de etapa ───────────────────────────── */}
      {etapaError && (
        <div className="px-4 py-3 rounded-xl text-xs font-medium"
          style={{ background: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA" }}>
          ⚠️ {etapaError}
        </div>
      )}

      {/* ── Panel de Gestoría (visible cuando etapa = viable) ──── */}
      {lead.etapa === "viable" && (
        <div className="rounded-xl border p-4 space-y-3"
          style={{ background: "#F0FDF4", borderColor: "#86EFAC" }}>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#065F46" }}>
              Gestoría en progreso
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full font-medium ml-auto"
              style={{ background: "#DCFCE7", color: "#15803D" }}>
              Viable ✓
            </span>
          </div>
          <p className="text-xs" style={{ color: "#166534" }}>
            Completa los siguientes requisitos para poder marcar el lead como <strong>Programado</strong>.
          </p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Carta de autorización subida",   ok: !!lead.carta_autorizacion_url,   tab: "seguro" },
              { label: "Número de autorización",         ok: !!lead.numero_autorizacion,       tab: "seguro" },
              { label: "Médico asignado",                ok: !!lead.medico_asignado_nombre,    tab: "medico" },
              { label: "Fecha tentativa de procedimiento", ok: !!lead.fecha_tentativa,          tab: "necesidad" },
            ].map(({ label, ok, tab: t }) => (
              <button key={label} onClick={() => !ok && setTab(t)}
                className="flex items-center gap-2 text-xs text-left px-3 py-2 rounded-lg transition-colors"
                style={{
                  background: ok ? "#DCFCE7" : "#fff",
                  border: `1px solid ${ok ? "#86EFAC" : "#D1FAE5"}`,
                  color: ok ? "#15803D" : "#166534",
                  cursor: ok ? "default" : "pointer",
                }}>
                <span className="text-sm flex-shrink-0">{ok ? "✓" : "○"}</span>
                <span>{label}</span>
              </button>
            ))}
          </div>
          {lead.carta_autorizacion_url || lead.numero_autorizacion ? (
            <p className="text-xs font-medium" style={{ color: "#059669" }}>
              ✓ Requisito mínimo cumplido — puedes marcar como Programado en el stepper de arriba.
            </p>
          ) : (
            <p className="text-xs" style={{ color: "#6B7280" }}>
              Se requiere al menos la carta de autorización o el número de autorización para programar.
            </p>
          )}
        </div>
      )}

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
                <Input label="Nombre *" value={form.nombre ?? ""} onChange={set("nombre")} readOnly={ro} style={{ textTransform: "uppercase" }} />
                <Input label="Apellido paterno *" value={form.apellido_paterno ?? ""} onChange={set("apellido_paterno")} readOnly={ro} style={{ textTransform: "uppercase" }} />
                <Input label="Apellido materno" value={form.apellido_materno ?? ""} onChange={set("apellido_materno")} readOnly={ro} style={{ textTransform: "uppercase" }} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Teléfono *" value={form.telefono ?? ""} onChange={set("telefono")} maxLength={20} readOnly={ro} />
                <Input label="Tel. alternativo" value={form.telefono_alternativo ?? ""} onChange={set("telefono_alternativo")} maxLength={20} readOnly={ro} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Email *" type="email" value={form.email ?? ""} onChange={set("email")} readOnly={ro} />
                <Input label="Email alternativo" type="email" value={form.email_alternativo ?? ""} onChange={set("email_alternativo")} readOnly={ro} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <Input label="Fecha de nacimiento" type="date" value={form.fecha_nacimiento ?? ""} onChange={set("fecha_nacimiento")} readOnly={ro} />
                <Input label="CURP" value={form.curp ?? ""} onChange={set("curp")} maxLength={18} readOnly={ro} style={{ textTransform: "uppercase" }} />
                <Select label="Estado / Ciudad" value={form.estado_ciudad ?? ""} onChange={set("estado_ciudad")} disabled={ro}>
                  <option value="">— Estado —</option>
                  {GEO_ESTADOS.map((s) => <option key={s} value={s}>{s}</option>)}
                </Select>
              </div>
            </>
          )}

          {/* ── NECESIDAD (Procedimiento + Historia Clínica) ──── */}
          {activeTab === "necesidad" && (
            <>
              <SectionTitle>Procedimiento Quirúrgico</SectionTitle>
              <div className="grid grid-cols-2 gap-4">
                <Select label="Procedimiento" value={form.procedimiento ?? ""} onChange={set("procedimiento")} disabled={ro}>
                  <option value="">— Procedimiento —</option>
                  {PROCEDIMIENTOS.map((p) => <option key={p.codigo} value={p.nombre}>{p.nombre}</option>)}
                </Select>
                <Input label="Categoría quirúrgica" value={form.categoria_quirurgica ?? ""} onChange={set("categoria_quirurgica")} readOnly={ro} style={{ textTransform: "uppercase" }} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Select label="Urgencia" value={form.urgencia ?? "electiva"} onChange={set("urgencia")} disabled={ro}>
                  <option value="electiva">Electiva</option>
                  <option value="programada">Programada</option>
                  <option value="urgente">Urgente</option>
                </Select>
                <Input label="Código CIE-9 / CPT" value={form.codigo_procedimiento ?? ""} onChange={set("codigo_procedimiento")} readOnly={ro} style={{ textTransform: "uppercase" }} />
              </div>
              <Input label="Fecha tentativa deseada" type="date" value={form.fecha_tentativa ?? ""} onChange={set("fecha_tentativa")} readOnly={ro} />
              <Textarea label="Notas del procedimiento" value={form.notas_procedimiento ?? ""} onChange={set("notas_procedimiento")} rows={3} readOnly={ro} style={{ textTransform: "uppercase" }} />

              <SectionTitle>Padecimientos e Historia Clínica</SectionTitle>
              <Input label="Fecha del diagnóstico" type="date" value={form.fecha_diagnostico ?? ""} onChange={set("fecha_diagnostico")} readOnly={ro} />
              <div className="grid grid-cols-2 gap-4">
                <Input label="Diagnóstico principal" value={form.diagnostico_principal ?? ""} onChange={set("diagnostico_principal")} placeholder="ej: Colelitiasis, Hernia inguinal" readOnly={ro} style={{ textTransform: "uppercase" }} />
                <Input label="Diagnósticos secundarios / comorbilidades" value={form.diagnosticos_secundarios ?? ""} onChange={set("diagnosticos_secundarios")} placeholder="Separados por coma" readOnly={ro} style={{ textTransform: "uppercase" }} />
              </div>
              <BoolField label="¿Cirugías previas?" value={form.cirugias_previas ?? null} onChange={setBool("cirugias_previas")} disabled={ro} />
              {form.cirugias_previas && (
                <Input label="Descripción de cirugías previas" value={form.cirugias_previas_desc ?? ""} onChange={set("cirugias_previas_desc")} placeholder="Año, tipo de cirugía, hospital" readOnly={ro} style={{ textTransform: "uppercase" }} />
              )}
              <Textarea label="Notas clínicas adicionales" value={form.notas_clinicas ?? ""} onChange={set("notas_clinicas")} rows={3} readOnly={ro} style={{ textTransform: "uppercase" }} />

              {/* ── ESTUDIOS PREOPERATORIOS ── */}
              <div className="flex items-center justify-between pt-1 pb-2 border-b"
                style={{ borderColor: "var(--border)" }}>
                <h3 className="text-xs font-semibold uppercase tracking-wide"
                  style={{ color: "var(--muted)" }}>
                  Estudios Preoperatorios
                </h3>
                {!ro && (
                  <button
                    onClick={() => setEstudios((prev) => [
                      ...prev,
                      { nombre: "", tiene_fisico: "pendiente", _saving: false, _dirty: true },
                    ])}
                    className="flex items-center gap-1 h-7 px-3 rounded-lg text-xs font-medium"
                    style={{ background: "var(--accent)", color: "#fff" }}
                  >
                    <Plus size={12} />
                    Agregar estudio
                  </button>
                )}
              </div>

              {estudios.length === 0 && (
                <p className="text-xs py-1" style={{ color: "var(--muted)" }}>
                  Sin estudios registrados.{!ro && " Usa el botón + para agregar."}
                </p>
              )}

              <div className="space-y-2">
                {estudios.map((e, idx) => (
                  <div key={e.id ?? `new-${idx}`}
                    className="flex items-center gap-2 p-3 rounded-xl border"
                    style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}>

                    {/* Nombre del estudio */}
                    {ro ? (
                      <span className="flex-1 text-sm font-medium truncate" style={{ color: "var(--text)" }}>
                        {e.nombre}
                      </span>
                    ) : (
                      <div className="flex-1 relative">
                        <input
                          list={`estudios-list-${idx}`}
                          value={e.nombre}
                          onChange={(ev) => updateEstudio(idx, "nombre", ev.target.value.toUpperCase())}
                          placeholder="Nombre del estudio..."
                          className="w-full h-8 px-3 rounded-lg border text-sm outline-none"
                          style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text)", textTransform: "uppercase" }}
                        />
                        <datalist id={`estudios-list-${idx}`}>
                          {ESTUDIOS_CATALOGO.map((s) => <option key={s} value={s.toUpperCase()} />)}
                        </datalist>
                      </div>
                    )}

                    {/* Badge / select de física */}
                    {ro ? (
                      <span className="flex-shrink-0 text-xs px-2.5 py-1 rounded-full font-medium"
                        style={FISICO_STYLE[e.tiene_fisico]}>
                        {FISICO_LABEL[e.tiene_fisico]}
                      </span>
                    ) : (
                      <select
                        value={e.tiene_fisico}
                        onChange={(ev) => updateEstudio(idx, "tiene_fisico", ev.target.value as EstudioPreop["tiene_fisico"])}
                        className="h-8 px-2 rounded-lg border text-xs outline-none appearance-none flex-shrink-0"
                        style={{
                          ...FISICO_STYLE[e.tiene_fisico],
                          borderColor: "var(--border)",
                          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                          backgroundRepeat: "no-repeat", backgroundPosition: "right 6px center",
                          backgroundSize: "12px", paddingRight: "24px", minWidth: "140px",
                        }}
                      >
                        <option value="pendiente">Pendiente</option>
                        <option value="si">✓ Tiene original</option>
                        <option value="digital">Escaneado / digital</option>
                        <option value="no">No disponible</option>
                      </select>
                    )}

                    {/* Botones de acción */}
                    {!ro && (
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {(e._dirty || !e.id) && (
                          <button onClick={() => saveEstudio(idx)} disabled={e._saving || !e.nombre.trim()}
                            className="h-8 px-2.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1"
                            style={{ background: "var(--accent)", color: "#fff", opacity: e._saving || !e.nombre.trim() ? 0.5 : 1 }}>
                            {e._saving ? "..." : <Check size={12} />}
                          </button>
                        )}
                        <button onClick={() => deleteEstudio(idx)}
                          className="h-8 px-2 rounded-lg transition-colors hover:bg-red-50"
                          style={{ color: "var(--muted)" }}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ── MÉDICO ───────────────────────────────────────── */}
          {activeTab === "medico" && (
            <>
              <SectionTitle>Médico Tratante</SectionTitle>

              <BoolField
                label="¿Tiene médico tratante?"
                value={form.tiene_medico_tratante ?? null}
                onChange={(v) => {
                  setBool("tiene_medico_tratante")(v)
                  setMedicoQuery("")
                  setMedicoFiltroEstado("")
                  setMedicoResults([])
                  setShowManualEntry(false)
                }}
                disabled={ro}
              />

              {/* ── SÍ tiene médico tratante → buscar en catálogo ── */}
              {form.tiene_medico_tratante === true && (
                <div className="space-y-4">
                  {!ro && (
                    <div className="space-y-2">
                      <label className="text-xs font-medium block" style={{ color: "var(--muted)" }}>
                        Buscar médico en catálogo
                      </label>
                      {/* Filtros: estado + nombre */}
                      <div className="grid grid-cols-2 gap-2">
                        <select
                          value={medicoFiltroEstado}
                          onChange={(e) => { setMedicoFiltroEstado(e.target.value); searchMedicos(medicoQuery, false, e.target.value) }}
                          className="h-9 px-3 rounded-lg border text-sm outline-none appearance-none"
                          style={{
                            background: "var(--surface)", borderColor: "var(--border)",
                            color: medicoFiltroEstado ? "var(--text)" : "var(--muted)",
                            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                            backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center",
                            backgroundSize: "14px", paddingRight: "32px",
                          }}
                        >
                          <option value="">— Estado —</option>
                          {GEO_ESTADOS.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <div className="relative">
                          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                            style={{ color: "var(--muted)" }} />
                          <input
                            type="text"
                            value={medicoQuery}
                            onChange={(e) => { setMedicoQuery(e.target.value); searchMedicos(e.target.value, false, medicoFiltroEstado) }}
                            placeholder="Nombre del médico..."
                            className="w-full h-9 pl-8 pr-3 rounded-lg border text-sm outline-none"
                            style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text)", textTransform: "uppercase" }}
                          />
                        </div>
                      </div>

                      {/* Resultados inline — scrollable, nunca se cortan */}
                      {medicoSearching && (
                        <div className="flex items-center gap-2 px-3 py-2 text-xs" style={{ color: "var(--muted)" }}>
                          <div className="w-3.5 h-3.5 border-2 rounded-full animate-spin"
                            style={{ borderColor: "var(--border)", borderTopColor: "var(--accent)" }} />
                          Buscando...
                        </div>
                      )}
                      {!medicoSearching && medicoResults.length > 0 && (
                        <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
                          <div className="overflow-y-auto divide-y" style={{ maxHeight: "240px", borderColor: "var(--border)" }}>
                            {medicoResults.map((m) => (
                              <button key={m.id}
                                onClick={() => { selectMedicoCatalog(m); setMedicoFiltroEstado("") }}
                                className="w-full text-left px-4 py-3 text-sm transition-colors hover:bg-[var(--surface-2)]"
                                style={{ color: "var(--text)" }}>
                                <div className="flex items-center justify-between">
                                  <span className="font-medium">{m.nombre}</span>
                                  {m.en_red && (
                                    <span className="text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ml-2"
                                      style={{ background: "#ECFDF5", color: "#059669" }}>En red</span>
                                  )}
                                </div>
                                <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                                  {m.especialidad ?? "Sin especialidad"}
                                  {m.hospitales ? ` · ${m.hospitales.nombre}` : ""}
                                </p>
                              </button>
                            ))}
                          </div>
                          <button
                            onClick={() => { setMedicoResults([]); setShowManualEntry(true) }}
                            className="w-full text-left px-4 py-2.5 text-xs border-t"
                            style={{ borderColor: "var(--border)", color: "var(--subtle)", background: "var(--surface-2)" }}>
                            No aparece en catálogo — capturar datos manualmente
                          </button>
                        </div>
                      )}
                      {!medicoSearching && (medicoQuery.length >= 2 || medicoFiltroEstado) && medicoResults.length === 0 && (
                        <div className="px-4 py-3 rounded-lg border text-xs"
                          style={{ borderColor: "var(--border)", color: "var(--subtle)" }}>
                          Sin resultados.{" "}
                          <button className="underline" style={{ color: "var(--accent)" }}
                            onClick={() => setShowManualEntry(true)}>
                            Capturar datos manualmente
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Campos del médico — visibles si ya hay nombre o si es entrada manual */}
                  {(form.medico_asignado_nombre || showManualEntry || ro) && (
                    <div className="space-y-4">
                      {form.medico_en_red && (
                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium"
                          style={{ background: "#ECFDF5", color: "#059669", border: "1px solid #A7F3D0" }}>
                          ✓ Médico registrado en nuestra red
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-4">
                        <Input label="Nombre completo" value={form.medico_asignado_nombre ?? ""} onChange={set("medico_asignado_nombre")} placeholder="Dr. / Dra." readOnly={ro} style={{ textTransform: "uppercase" }} />
                        <EspecialidadSelect
                          value={form.medico_especialidad ?? ""}
                          onChange={(v) => setForm((f) => ({ ...f, medico_especialidad: v }))}
                          disabled={ro}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <Input label="Teléfono" value={form.medico_telefono ?? ""} onChange={set("medico_telefono")} placeholder="10 dígitos" readOnly={ro} />
                        <Input label="Correo electrónico" type="email" value={form.medico_email ?? ""} onChange={set("medico_email")} readOnly={ro} />
                      </div>
                      <BoolField label="¿Es parte de nuestra red?" value={form.medico_en_red ?? null} onChange={setBool("medico_en_red")} disabled={ro} />
                      <Textarea
                        label="Hospitales donde trabaja"
                        value={form.medico_hospitales ?? ""}
                        onChange={set("medico_hospitales")}
                        rows={2}
                        readOnly={ro}
                        placeholder="Nombre del hospital, ciudad — separar por coma o salto de línea"
                        style={{ textTransform: "uppercase" }}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* ── NO tiene médico → ofrecer de nuestra red ────── */}
              {form.tiene_medico_tratante === false && (
                <div className="space-y-4">
                  <div className="rounded-xl border p-4 space-y-3"
                    style={{ background: "#F5F3FF", borderColor: "#DDD6FE" }}>
                    <div className="flex items-start gap-2">
                      <UserCheck size={15} style={{ color: "#7C3AED", flexShrink: 0, marginTop: 2 }} />
                      <div>
                        <p className="text-sm font-semibold" style={{ color: "#4C1D95" }}>
                          Conectar con un médico de nuestra red
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: "#6D28D9" }}>
                          Filtra por estado y nombre para encontrar al médico indicado
                        </p>
                      </div>
                    </div>

                    {!ro && (
                      <div className="space-y-2">
                        {/* Filtros: estado + nombre */}
                        <div className="grid grid-cols-2 gap-2">
                          <select
                            value={medicoFiltroEstado}
                            onChange={(e) => { setMedicoFiltroEstado(e.target.value); searchMedicos(medicoQuery, true, e.target.value) }}
                            className="h-9 px-3 rounded-lg border text-sm outline-none appearance-none"
                            style={{
                              background: "#fff", borderColor: "#C4B5FD",
                              color: medicoFiltroEstado ? "#4C1D95" : "#7C3AED",
                              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%237C3AED' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                              backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center",
                              backgroundSize: "14px", paddingRight: "32px",
                            }}
                          >
                            <option value="">— Estado —</option>
                            {GEO_ESTADOS.map((s) => <option key={s} value={s}>{s}</option>)}
                          </select>
                          <div className="relative">
                            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                              style={{ color: "#7C3AED" }} />
                            <input
                              type="text"
                              value={medicoQuery}
                              onChange={(e) => { setMedicoQuery(e.target.value); searchMedicos(e.target.value, true, medicoFiltroEstado) }}
                              placeholder="Nombre o especialidad..."
                              className="w-full h-9 pl-8 pr-3 rounded-lg border text-sm outline-none"
                              style={{ background: "#fff", borderColor: "#C4B5FD", color: "var(--text)", textTransform: "uppercase" }}
                            />
                          </div>
                        </div>

                        {/* Resultados inline scrollable */}
                        {medicoSearching && (
                          <div className="flex items-center gap-2 px-3 py-2 text-xs" style={{ color: "#7C3AED" }}>
                            <div className="w-3.5 h-3.5 border-2 rounded-full animate-spin"
                              style={{ borderColor: "#DDD6FE", borderTopColor: "#7C3AED" }} />
                            Buscando en red...
                          </div>
                        )}
                        {!medicoSearching && medicoResults.length > 0 && (
                          <div className="rounded-xl border overflow-hidden" style={{ borderColor: "#C4B5FD" }}>
                            <div className="overflow-y-auto divide-y" style={{ maxHeight: "240px", borderColor: "#DDD6FE" }}>
                              {medicoResults.map((m) => (
                                <button key={m.id}
                                  onClick={() => { selectMedicoCatalog(m); setMedicoFiltroEstado("") }}
                                  className="w-full text-left px-4 py-3 text-sm transition-colors"
                                  style={{ background: "#fff", color: "var(--text)" }}
                                  onMouseEnter={(e) => (e.currentTarget.style.background = "#EDE9FE")}
                                  onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}>
                                  <p className="font-medium">{m.nombre}</p>
                                  <p className="text-xs mt-0.5" style={{ color: "#7C3AED" }}>
                                    {m.especialidad ?? "Sin especialidad"}
                                    {m.hospitales ? ` · ${m.hospitales.nombre}` : ""}
                                  </p>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                        {!medicoSearching && (medicoQuery.length >= 2 || medicoFiltroEstado) && medicoResults.length === 0 && (
                          <p className="text-xs" style={{ color: "#7C3AED" }}>
                            Sin médicos en red con esa búsqueda. Agrega médicos desde el Hub de Médicos.
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Médico seleccionado de la red */}
                  {form.medico_asignado_nombre && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium"
                        style={{ background: "#EFF6FF", color: "#2563EB", border: "1px solid #BFDBFE" }}>
                        Médico de nuestra red asignado al lead
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <Input label="Nombre" value={form.medico_asignado_nombre ?? ""} onChange={set("medico_asignado_nombre")} readOnly={ro} style={{ textTransform: "uppercase" }} />
                        <EspecialidadSelect
                          value={form.medico_especialidad ?? ""}
                          onChange={(v) => setForm((f) => ({ ...f, medico_especialidad: v }))}
                          disabled={ro}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <Input label="Teléfono" value={form.medico_telefono ?? ""} onChange={set("medico_telefono")} readOnly={ro} />
                        <Input label="Correo electrónico" type="email" value={form.medico_email ?? ""} onChange={set("medico_email")} readOnly={ro} />
                      </div>
                      <Textarea label="Hospitales donde trabaja" value={form.medico_hospitales ?? ""} onChange={set("medico_hospitales")} rows={2} readOnly={ro} style={{ textTransform: "uppercase" }} />
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* ── SEGURO GMM (Póliza + Cobertura) ──────────────── */}
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
                <Input label="Número de póliza *" value={form.numero_poliza ?? ""} onChange={set("numero_poliza")} readOnly={ro} style={{ textTransform: "uppercase" }} />
                <Input label="Número de certificado" value={form.numero_certificado ?? ""} onChange={set("numero_certificado")} readOnly={ro} style={{ textTransform: "uppercase" }} />
              </div>
              <Input label="Nombre del titular de la póliza" value={form.nombre_titular_poliza ?? ""} onChange={set("nombre_titular_poliza")} readOnly={ro} style={{ textTransform: "uppercase" }} />

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

              <SectionTitle>Cobertura y Exclusiones</SectionTitle>
              <div className="grid grid-cols-2 gap-4">
                <BoolField label="¿Cobertura confirmada?" value={form.cobertura_confirmada ?? null} onChange={setBool("cobertura_confirmada")} disabled={ro} />
                <BoolField label="¿Requiere pre-autorización?" value={form.requiere_preautorizacion ?? null} onChange={setBool("requiere_preautorizacion")} disabled={ro} />
                <BoolField label="¿Cubre cirugías?" value={form.cubre_cirugia ?? null} onChange={setBool("cubre_cirugia")} disabled={ro} />
                <BoolField label="¿Cubre anestesiólogo?" value={form.cubre_anestesiologo ?? null} onChange={setBool("cubre_anestesiologo")} disabled={ro} />
                <BoolField label="¿Cubre estudios preoperatorios?" value={form.cubre_estudios_preop ?? null} onChange={setBool("cubre_estudios_preop")} disabled={ro} />
                <BoolField label="¿Cubre honorarios médicos?" value={form.cubre_honorarios ?? null} onChange={setBool("cubre_honorarios")} disabled={ro} />
                <BoolField label="¿Cubre hospitalización?" value={form.cubre_hospitalizacion ?? null} onChange={setBool("cubre_hospitalizacion")} disabled={ro} />
                <BoolField label="¿El procedimiento es preexistencia?" value={form.es_preexistencia ?? null} onChange={setBool("es_preexistencia")} disabled={ro} />
              </div>
              <Textarea label="Condiciones / diagnósticos excluidos" value={form.condiciones_excluidas ?? ""} onChange={set("condiciones_excluidas")} rows={2} readOnly={ro} placeholder="Separar por coma" style={{ textTransform: "uppercase" }} />

              <SectionTitle>Autorización</SectionTitle>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Número de autorización" value={form.numero_autorizacion ?? ""} onChange={set("numero_autorizacion")} readOnly={ro} style={{ textTransform: "uppercase" }} />
                <Input label="Fecha de autorización" type="date" value={form.fecha_autorizacion ?? ""} onChange={set("fecha_autorizacion")} readOnly={ro} />
              </div>
              {(lead.carta_autorizacion_path || lead.carta_autorizacion_url) && (
                <CartaButton leadId={lead.id} />
              )}

              <SectionTitle>Contacto en Aseguradora</SectionTitle>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Nombre del contacto" value={form.contacto_aseguradora_nombre ?? ""} onChange={set("contacto_aseguradora_nombre")} readOnly={ro} style={{ textTransform: "uppercase" }} />
                <Input label="Teléfono del contacto" value={form.contacto_aseguradora_telefono ?? ""} onChange={set("contacto_aseguradora_telefono")} readOnly={ro} />
              </div>
              <Textarea label="Notas de la validación" value={form.notas_validacion ?? ""} onChange={set("notas_validacion")} rows={3} readOnly={ro} style={{ textTransform: "uppercase" }} />

              {/* ── PÓLIZAS EXCEDENTES ── */}
              <div className="flex items-center justify-between pt-1 pb-2 border-b mt-2"
                style={{ borderColor: "var(--border)" }}>
                <h3 className="text-xs font-semibold uppercase tracking-wide"
                  style={{ color: "var(--muted)" }}>
                  Pólizas Excedentes
                </h3>
                {!ro && (
                  <button
                    onClick={() => setPolizasExcedentes((prev) => [...prev, emptyPoliza()])}
                    className="flex items-center gap-1 h-7 px-3 rounded-lg text-xs font-medium transition-colors"
                    style={{ background: "var(--accent)", color: "#fff" }}
                  >
                    <Plus size={12} />
                    Agregar póliza
                  </button>
                )}
              </div>

              {polizasExcedentes.length === 0 && (
                <p className="text-xs py-2" style={{ color: "var(--muted)" }}>
                  Sin pólizas excedentes registradas.{!ro && " Usa el botón + para agregar."}
                </p>
              )}

              {polizasExcedentes.map((p, idx) => (
                <div key={p.id ?? `new-${idx}`} className="rounded-xl border overflow-hidden"
                  style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}>
                  {/* Header */}
                  <div className="flex items-center justify-between px-4 py-3"
                    style={{ background: "var(--surface)" }}>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: "var(--text)" }}>
                        {p.aseguradora_nombre || (p.id ? `Póliza #${idx + 1}` : "Nueva póliza excedente")}
                      </p>
                      {p.numero_poliza && (
                        <p className="text-xs mt-0.5 font-mono" style={{ color: "var(--muted)" }}>
                          {p.numero_poliza}
                          {p.suma_asegurada ? ` · $${parseFloat(p.suma_asegurada).toLocaleString("es-MX")} ${p.moneda}` : ""}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                      {!ro && (
                        <button onClick={() => deletePoliza(idx)}
                          className="p-1.5 rounded-lg transition-colors hover:bg-red-50"
                          style={{ color: "var(--muted)" }} title="Eliminar">
                          <Trash2 size={13} />
                        </button>
                      )}
                      <button
                        onClick={() => updatePoliza(idx, "_expanded", !p._expanded)}
                        className="p-1.5 rounded-lg transition-colors"
                        style={{ color: "var(--muted)" }}>
                        {p._expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                    </div>
                  </div>

                  {/* Body — expandible */}
                  {p._expanded && (
                    <div className="p-4 space-y-3 border-t" style={{ borderColor: "var(--border)" }}>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-medium" style={{ color: "var(--muted)" }}>Aseguradora</label>
                          <input readOnly={ro} value={p.aseguradora_nombre}
                            onChange={(e) => updatePoliza(idx, "aseguradora_nombre", e.target.value)}
                            placeholder="Nombre de la aseguradora"
                            className="h-9 px-3 rounded-lg border text-sm outline-none"
                            style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text)", textTransform: "uppercase" }} />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-medium" style={{ color: "var(--muted)" }}>Tipo de plan</label>
                          <select disabled={ro} value={p.tipo_plan}
                            onChange={(e) => updatePoliza(idx, "tipo_plan", e.target.value)}
                            className="h-9 px-3 rounded-lg border text-sm outline-none appearance-none"
                            style={{
                              background: "var(--surface)", borderColor: "var(--border)", color: "var(--text)",
                              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                              backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center", backgroundSize: "14px", paddingRight: "32px",
                            }}>
                            <option value="">Sin definir</option>
                            <option value="individual">Individual</option>
                            <option value="familiar">Familiar</option>
                            <option value="colectivo">Colectivo</option>
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-medium" style={{ color: "var(--muted)" }}>Número de póliza</label>
                          <input readOnly={ro} value={p.numero_poliza}
                            onChange={(e) => updatePoliza(idx, "numero_poliza", e.target.value)}
                            className="h-9 px-3 rounded-lg border text-sm outline-none font-mono"
                            style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text)", textTransform: "uppercase" }} />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-medium" style={{ color: "var(--muted)" }}>Número de certificado</label>
                          <input readOnly={ro} value={p.numero_certificado}
                            onChange={(e) => updatePoliza(idx, "numero_certificado", e.target.value)}
                            className="h-9 px-3 rounded-lg border text-sm outline-none font-mono"
                            style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text)", textTransform: "uppercase" }} />
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium" style={{ color: "var(--muted)" }}>Nombre del titular</label>
                        <input readOnly={ro} value={p.nombre_titular}
                          onChange={(e) => updatePoliza(idx, "nombre_titular", e.target.value)}
                          className="h-9 px-3 rounded-lg border text-sm outline-none"
                          style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text)", textTransform: "uppercase" }} />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-medium" style={{ color: "var(--muted)" }}>Vigencia inicio</label>
                          <input type="date" readOnly={ro} value={p.vigencia_inicio}
                            onChange={(e) => updatePoliza(idx, "vigencia_inicio", e.target.value)}
                            className="h-9 px-3 rounded-lg border text-sm outline-none"
                            style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text)" }} />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-medium" style={{ color: "var(--muted)" }}>Vigencia fin</label>
                          <input type="date" readOnly={ro} value={p.vigencia_fin}
                            onChange={(e) => updatePoliza(idx, "vigencia_fin", e.target.value)}
                            className="h-9 px-3 rounded-lg border text-sm outline-none"
                            style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text)" }} />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-medium" style={{ color: "var(--muted)" }}>Suma asegurada</label>
                          <input type="number" readOnly={ro} value={p.suma_asegurada}
                            onChange={(e) => updatePoliza(idx, "suma_asegurada", e.target.value)}
                            className="h-9 px-3 rounded-lg border text-sm outline-none"
                            style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text)" }} />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-medium" style={{ color: "var(--muted)" }}>Moneda</label>
                          <select disabled={ro} value={p.moneda}
                            onChange={(e) => updatePoliza(idx, "moneda", e.target.value)}
                            className="h-9 px-3 rounded-lg border text-sm outline-none appearance-none"
                            style={{
                              background: "var(--surface)", borderColor: "var(--border)", color: "var(--text)",
                              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                              backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center", backgroundSize: "14px", paddingRight: "32px",
                            }}>
                            <option value="MXN">MXN</option>
                            <option value="USD">USD</option>
                          </select>
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-medium" style={{ color: "var(--muted)" }}>Deducible</label>
                          <input type="number" readOnly={ro} value={p.deducible}
                            onChange={(e) => updatePoliza(idx, "deducible", e.target.value)}
                            className="h-9 px-3 rounded-lg border text-sm outline-none"
                            style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text)" }} />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-medium" style={{ color: "var(--muted)" }}>Coaseguro (%)</label>
                          <input type="number" readOnly={ro} value={p.coaseguro_pct}
                            onChange={(e) => updatePoliza(idx, "coaseguro_pct", e.target.value)}
                            className="h-9 px-3 rounded-lg border text-sm outline-none"
                            style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text)" }} />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-medium" style={{ color: "var(--muted)" }}>Tope de coaseguro</label>
                          <input type="number" readOnly={ro} value={p.tope_coaseguro}
                            onChange={(e) => updatePoliza(idx, "tope_coaseguro", e.target.value)}
                            className="h-9 px-3 rounded-lg border text-sm outline-none"
                            style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text)" }} />
                        </div>
                      </div>
                      <BoolField label="¿Período de espera activo?"
                        value={p.periodo_espera_activo}
                        onChange={(v) => updatePoliza(idx, "periodo_espera_activo", v)}
                        disabled={ro} />
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium" style={{ color: "var(--muted)" }}>Notas / limitantes / exclusiones</label>
                        <textarea readOnly={ro} value={p.notas} rows={2}
                          onChange={(e) => updatePoliza(idx, "notas", e.target.value)}
                          placeholder="Limitantes, coberturas especiales, exclusiones..."
                          className="px-3 py-2 rounded-lg border text-sm outline-none resize-none"
                          style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text)", textTransform: "uppercase" }} />
                      </div>
                      {!ro && (
                        <button onClick={() => savePoliza(idx)} disabled={p._saving}
                          className="flex items-center gap-1.5 h-8 px-4 rounded-lg text-xs font-medium transition-all"
                          style={{ background: "var(--accent)", color: "#fff", opacity: p._saving ? 0.6 : 1 }}>
                          <Save size={11} />
                          {p._saving ? "Guardando..." : p.id ? "Actualizar póliza" : "Guardar póliza"}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
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

          {/* ── CANAL (solo lectura — trazabilidad) ──────────── */}
          {activeTab === "canal" && (
            <div className="space-y-4">
              {/* Badge solo lectura */}
              <div className="flex items-center gap-2">
                <Tag size={13} style={{ color: "var(--accent)" }} />
                <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--subtle)" }}>
                  Trazabilidad del lead
                </span>
                <span className="ml-auto text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ background: "#FEF9C3", color: "#92400E" }}>
                  🔒 Solo lectura
                </span>
              </div>

              {/* Tarjeta principal de origen */}
              <div className="rounded-xl border p-4 space-y-4" style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}>
                <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs" style={{ color: "var(--muted)" }}>Canal principal</span>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="text-sm font-semibold px-2.5 py-0.5 rounded-full"
                        style={FUENTE_STYLE[lead.fuente ?? ""] ?? FUENTE_STYLE.formulario}>
                        {FUENTE_LABEL[lead.fuente ?? ""] ?? lead.fuente ?? "—"}
                      </span>
                    </span>
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-xs" style={{ color: "var(--muted)" }}>Fuente específica</span>
                    <span className="text-sm font-medium" style={{ color: lead.fuente_especifica ? "var(--text)" : "var(--subtle)" }}>
                      {lead.fuente_especifica || "—"}
                    </span>
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-xs" style={{ color: "var(--muted)" }}>Código referido</span>
                    <span className="text-sm font-mono font-medium" style={{ color: lead.codigo_referido ? "var(--accent)" : "var(--subtle)" }}>
                      {lead.codigo_referido || "Sin código"}
                    </span>
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-xs" style={{ color: "var(--muted)" }}>Fecha de captura</span>
                    <span className="text-sm font-medium" style={{ color: "var(--text)" }}>
                      {new Date(lead.fecha_captura).toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" })}
                    </span>
                  </div>
                </div>

                {lead.en_cola_revision && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium"
                    style={{ background: "#FEF9C3", color: "#92400E", border: "1px solid #FDE68A" }}>
                    ⏳ Lead en cola de revisión — aún no confirmado por agente
                  </div>
                )}
              </div>

              {/* Empresa / Convenio */}
              {lead.empresas && (
                <div className="rounded-xl border p-4 space-y-3" style={{ borderColor: "var(--border)" }}>
                  <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--subtle)" }}>
                    Empresa del convenio
                  </p>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>{lead.empresas.nombre}</p>
                    <span className="text-xs px-2.5 py-1 rounded-full font-medium"
                      style={{ background: "#FFF7ED", color: "#C2410C" }}>
                      Convenio corporativo
                    </span>
                  </div>

                  {/* Datos adicionales del formulario del convenio */}
                  {lead.datos_adicionales && Object.keys(lead.datos_adicionales).length > 0 && (
                    <div className="rounded-lg p-3 space-y-2"
                      style={{ background: "var(--surface-2)", borderTop: "1px solid var(--border)" }}>
                      <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--subtle)" }}>
                        Datos del formulario
                      </p>
                      {Object.entries(lead.datos_adicionales).map(([k, v]) => (
                        <div key={k} className="flex justify-between gap-2 text-xs">
                          <span style={{ color: "var(--muted)" }}>{k.replace(/_/g, " ")}</span>
                          <span className="font-medium text-right" style={{ color: "var(--text)" }}>{v}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Vendedor referidor */}
              {lead.vendedores ? (
                <div className="rounded-xl border p-4" style={{ borderColor: "var(--border)" }}>
                  <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: "var(--subtle)" }}>
                    Vendedor referidor
                  </p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>{lead.vendedores.nombre}</p>
                      <p className="text-xs font-mono mt-0.5" style={{ color: "var(--accent)" }}>{lead.vendedores.codigo_unico}</p>
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded-full font-medium"
                      style={{ background: "#F5F3FF", color: "#7C3AED" }}>
                      Con comisión
                    </span>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed p-4 text-center" style={{ borderColor: "var(--border)" }}>
                  <p className="text-xs" style={{ color: "var(--subtle)" }}>Sin vendedor referidor — lead sin comisión asignada</p>
                </div>
              )}

              {/* Campaña vinculada */}
              {lead.campanas && (
                <div className="rounded-xl border p-4" style={{ borderColor: "var(--border)" }}>
                  <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: "var(--subtle)" }}>
                    Campaña vinculada
                  </p>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>{lead.campanas.nombre}</p>
                    <span className="text-xs font-mono px-2 py-0.5 rounded"
                      style={{ background: "var(--surface-2)", color: "var(--muted)" }}>
                      {lead.campanas.codigo_unico}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── NOTAS ────────────────────────────────────────── */}
          {activeTab === "notas" && (
            <Textarea label="Notas del expediente" value={form.notas ?? ""} onChange={set("notas")} rows={8} readOnly={ro} style={{ textTransform: "uppercase" }} />
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
