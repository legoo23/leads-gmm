"use client"
import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import {
  ArrowLeft, Save, ChevronRight, User, Activity,
  Stethoscope, Shield, CheckCircle, Tag, Link2, Copy, Check, Hospital
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input, Select, Textarea } from "@/components/ui/input"
import { Badge, PrioridadBadge } from "@/components/ui/badge"
import { ETAPAS_PIPELINE, ETAPAS_ACTIVAS, ETAPAS_CIERRE } from "@/constants/lead-etapas"
import { ASEGURADORAS } from "@/constants/aseguradoras"
import { PROCEDIMIENTOS } from "@/constants/procedimientos"
import { GEO_ESTADOS } from "@/constants/geo-mx"
import { formatDate, formatMXN } from "@/lib/utils"
import { PageLoader } from "@/components/ui/spinner"

interface Lead {
  id: number; folio: string; nombre: string; apellido_paterno: string | null
  apellido_materno: string | null; telefono: string | null; telefono_alternativo: string | null
  telefono_alternativo_2: string | null; email: string | null; email_alternativo: string | null
  curp: string | null; fecha_nacimiento: string | null; estado_ciudad: string | null
  prioridad: string; etapa: string; estado: string; procedimiento: string | null
  categoria_quirurgica: string | null; codigo_procedimiento: string | null
  urgencia: string | null; costo_estimado: number | null; id_aseguradora: number | null
  numero_poliza: string | null; vigencia_inicio: string | null; vigencia_fin: string | null
  suma_asegurada: number | null; deducible: number | null; coaseguro_pct: number | null
  cobertura_confirmada: boolean | null; numero_autorizacion: string | null
  carta_autorizacion_url: string | null; fuente: string | null; codigo_referido: string | null
  en_cola_revision: boolean; notas: string | null; fecha_captura: string
  fecha_contacto: string | null; fecha_conversion: string | null
  vendedores: { nombre: string; codigo_unico: string } | null
  aseguradoras: { nombre: string } | null
  // Internamiento
  tipo_ingreso: string | null; es_accidente: boolean | null
  fecha_inicio_sintomas: string | null; mecanismo_ingreso: string | null
  familiar_nombre: string | null; familiar_telefono: string | null
  valorado_medico_previo: boolean | null; atenciones_previas_sgmm: boolean | null
  antecedentes_enfermedad: string | null; numero_episodio: string | null
  numero_siniestro: string | null; folio_programacion: string | null
}

const TABS = [
  { key: "contacto",      label: "Contacto",      icon: User },
  { key: "procedimiento", label: "Procedimiento",  icon: Stethoscope },
  { key: "seguro",        label: "Póliza GMM",     icon: Shield },
  { key: "cobertura",     label: "Cobertura",      icon: CheckCircle },
  { key: "internamiento", label: "Internamiento",  icon: Hospital },
  { key: "canal",         label: "Canal",          icon: Tag },
  { key: "notas",         label: "Notas",          icon: Activity },
]

export default function LeadDetailClient({ leadId, rol }: { leadId: number; rol: string }) {
  const [lead, setLead] = useState<Lead | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState("contacto")
  const [saving, setSaving] = useState(false)
  const [changingEtapa, setChangingEtapa] = useState(false)
  const [form, setForm] = useState<Partial<Lead>>({})
  // Upload link state
  const [uploadLink, setUploadLink] = useState<string | null>(null)
  const [uploadExpiry, setUploadExpiry] = useState<string | null>(null)
  const [generatingLink, setGeneratingLink] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)
  const [docsSeleccionados, setDocsSeleccionados] = useState<string[]>(["poliza", "ine"])

  useEffect(() => {
    fetch(`/api/leads/${leadId}`)
      .then((r) => r.json())
      .then(({ data }) => { setLead(data); setForm(data) })
      .finally(() => setLoading(false))
    // Load existing upload token
    fetch(`/api/leads/${leadId}/upload-token`)
      .then((r) => r.json())
      .then(({ data }) => {
        if (data) { setUploadLink(data.link ?? null); setUploadExpiry(data.expires_at ?? null) }
      })
      .catch(() => {})
  }, [leadId])

  const generateUploadLink = useCallback(async () => {
    setGeneratingLink(true)
    const res = await fetch(`/api/leads/${leadId}/upload-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ docs_requeridos: docsSeleccionados }),
    })
    const { data } = await res.json()
    if (data?.link) {
      setUploadLink(data.link)
      setUploadExpiry(data.expires_at)
    }
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

  async function save() {
    setSaving(true)
    await fetch(`/api/leads/${leadId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
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

  const etapaInfo = ETAPAS_PIPELINE[lead.etapa as keyof typeof ETAPAS_PIPELINE]
  const canEdit = ["admin", "supervisor"].includes(rol) || rol === "agente"

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Header */}
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
          </div>
          <h1 className="text-lg font-semibold mt-1" style={{ color: "var(--text)" }}>
            {lead.nombre} {lead.apellido_paterno ?? ""} {lead.apellido_materno ?? ""}
          </h1>
          <p className="text-xs" style={{ color: "var(--subtle)" }}>
            Capturado {formatDate(lead.fecha_captura)}
            {lead.fecha_conversion && ` · Convertido ${formatDate(lead.fecha_conversion)}`}
          </p>
        </div>
      </div>

      {/* Pipeline stepper */}
      <div className="rounded-xl border p-4" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="flex items-center gap-1 flex-wrap">
          {ETAPAS_ACTIVAS.map((key, i) => {
            const info = ETAPAS_PIPELINE[key]
            const isActive = lead.etapa === key
            const isPast = ETAPAS_ACTIVAS.indexOf(lead.etapa as typeof ETAPAS_ACTIVAS[number]) > i

            return (
              <div key={key} className="flex items-center gap-1">
                <button
                  onClick={() => !isActive && !changingEtapa && changeEtapa(key)}
                  disabled={changingEtapa}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all"
                  style={{
                    background: isActive ? info.bg : isPast ? "#F0FDF4" : "var(--surface-2)",
                    color: isActive ? info.color : isPast ? "#059669" : "var(--subtle)",
                    border: isActive ? `1.5px solid ${info.color}` : "1.5px solid transparent",
                    opacity: changingEtapa ? 0.6 : 1,
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
          {/* Cierre */}
          <div className="ml-2 flex gap-1">
            {ETAPAS_CIERRE.map((key) => {
              const info = ETAPAS_PIPELINE[key]
              const isActive = lead.etapa === key
              return (
                <button key={key}
                  onClick={() => !isActive && !changingEtapa && changeEtapa(key)}
                  disabled={changingEtapa}
                  className="px-2.5 py-1 rounded-full text-xs font-medium transition-all"
                  style={{
                    background: isActive ? info.bg : "var(--surface-2)",
                    color: isActive ? info.color : "var(--subtle)",
                    border: isActive ? `1.5px solid ${info.color}` : "1.5px solid transparent",
                  }}
                >
                  {info.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Tabs + Form */}
      <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
        <div className="flex border-b overflow-x-auto" style={{ borderColor: "var(--border)" }}>
          {TABS.map(({ key, label, icon: Icon }) => (
            <button key={key}
              onClick={() => setTab(key)}
              className="flex items-center gap-1.5 px-4 py-3 text-xs font-medium whitespace-nowrap transition-colors border-b-2"
              style={{
                borderColor: tab === key ? "var(--accent)" : "transparent",
                color: tab === key ? "var(--accent)" : "var(--muted)",
              }}
            >
              <Icon size={12} />
              {label}
            </button>
          ))}
        </div>

        <div className="p-5 space-y-4">
          {tab === "contacto" && (
            <>
              <div className="grid grid-cols-3 gap-4">
                <Input label="Nombre" value={form.nombre ?? ""} onChange={set("nombre")} />
                <Input label="Apellido paterno" value={form.apellido_paterno ?? ""} onChange={set("apellido_paterno")} />
                <Input label="Apellido materno" value={form.apellido_materno ?? ""} onChange={set("apellido_materno")} />
              </div>
              {/* Teléfonos */}
              <div className="grid grid-cols-3 gap-4">
                <Input label="Teléfono" value={form.telefono ?? ""} onChange={set("telefono")} maxLength={10} />
                <Input label="Tel. alternativo" value={form.telefono_alternativo ?? ""} onChange={set("telefono_alternativo")} maxLength={10} />
                <Input label="Tel. alternativo 2" value={form.telefono_alternativo_2 ?? ""} onChange={set("telefono_alternativo_2")} maxLength={10} />
              </div>
              {/* Emails */}
              <div className="grid grid-cols-2 gap-4">
                <Input label="Email" type="email" value={form.email ?? ""} onChange={set("email")} />
                <Input label="Email alternativo" type="email" value={form.email_alternativo ?? ""} onChange={set("email_alternativo")} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <Input label="Fecha de nacimiento" type="date" value={form.fecha_nacimiento ?? ""} onChange={set("fecha_nacimiento")} />
                <Input label="CURP" value={form.curp ?? ""} onChange={set("curp")} maxLength={18} className="uppercase" />
                <Select label="Estado / Ciudad" value={form.estado_ciudad ?? ""} onChange={set("estado_ciudad")}>
                  <option value="">— Estado —</option>
                  {GEO_ESTADOS.map((s) => <option key={s} value={s}>{s}</option>)}
                </Select>
              </div>
              <Select label="Prioridad" value={form.prioridad ?? "media"} onChange={set("prioridad")}>
                <option value="baja">Baja</option>
                <option value="media">Media</option>
                <option value="alta">Alta</option>
                <option value="urgente">Urgente</option>
              </Select>
            </>
          )}

          {tab === "procedimiento" && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <Select label="Procedimiento" value={form.procedimiento ?? ""} onChange={set("procedimiento")}>
                  <option value="">— Procedimiento —</option>
                  {PROCEDIMIENTOS.map((p) => <option key={p.codigo} value={p.nombre}>{p.nombre}</option>)}
                </Select>
                <Select label="Urgencia" value={form.urgencia ?? "electiva"} onChange={set("urgencia")}>
                  <option value="electiva">Electiva</option>
                  <option value="programada">Programada</option>
                  <option value="urgente">Urgente</option>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Código de procedimiento (CIE-9/CPT)" value={form.codigo_procedimiento ?? ""} onChange={set("codigo_procedimiento")} />
                <Input label="Costo estimado (MXN)" type="number" value={form.costo_estimado ?? ""} onChange={set("costo_estimado")} />
              </div>
            </>
          )}

          {tab === "seguro" && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <Select label="Aseguradora" value={form.id_aseguradora ?? ""} onChange={set("id_aseguradora")}>
                  <option value="">— Aseguradora —</option>
                  {ASEGURADORAS.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                </Select>
                <Input label="Número de póliza" value={form.numero_poliza ?? ""} onChange={set("numero_poliza")} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Vigencia inicio" type="date" value={form.vigencia_inicio ?? ""} onChange={set("vigencia_inicio")} />
                <Input label="Vigencia fin" type="date" value={form.vigencia_fin ?? ""} onChange={set("vigencia_fin")} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <Input label="Suma asegurada (MXN)" type="number" value={form.suma_asegurada ?? ""} onChange={set("suma_asegurada")} />
                <Input label="Deducible (MXN)" type="number" value={form.deducible ?? ""} onChange={set("deducible")} />
                <Input label="Coaseguro (%)" type="number" value={form.coaseguro_pct ?? ""} onChange={set("coaseguro_pct")} />
              </div>
            </>
          )}

          {tab === "cobertura" && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Número de autorización" value={form.numero_autorizacion ?? ""} onChange={set("numero_autorizacion")} />
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium" style={{ color: "var(--muted)" }}>Cobertura confirmada</label>
                  <select
                    value={form.cobertura_confirmada === true ? "si" : form.cobertura_confirmada === false ? "no" : ""}
                    onChange={(e) => setForm((f) => ({
                      ...f,
                      cobertura_confirmada: e.target.value === "si" ? true : e.target.value === "no" ? false : null
                    }))}
                    className="h-9 px-3 rounded-lg border text-sm outline-none"
                    style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text)" }}
                  >
                    <option value="">Sin definir</option>
                    <option value="si">Sí — Confirmada</option>
                    <option value="no">No — Rechazada</option>
                  </select>
                </div>
              </div>
              {lead.carta_autorizacion_url && (
                <div>
                  <p className="text-xs font-medium mb-1" style={{ color: "var(--muted)" }}>Carta de autorización</p>
                  <a href={lead.carta_autorizacion_url} target="_blank" rel="noopener noreferrer"
                    className="text-xs font-medium underline" style={{ color: "var(--accent)" }}>
                    Ver documento
                  </a>
                </div>
              )}
            </>
          )}

          {tab === "internamiento" && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <Select label="Tipo de ingreso" value={form.tipo_ingreso ?? ""} onChange={set("tipo_ingreso")}>
                  <option value="">— Sin definir —</option>
                  <option value="urgencias">Urgencias</option>
                  <option value="programado">Programado (con carta)</option>
                </Select>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium" style={{ color: "var(--muted)" }}>¿Es accidente?</label>
                  <select
                    value={form.es_accidente === true ? "si" : form.es_accidente === false ? "no" : ""}
                    onChange={(e) => setForm((f) => ({
                      ...f, es_accidente: e.target.value === "si" ? true : e.target.value === "no" ? false : null,
                    }))}
                    className="h-9 px-3 rounded-lg border text-sm outline-none"
                    style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text)" }}
                  >
                    <option value="">Sin definir</option>
                    <option value="si">Sí — Accidente</option>
                    <option value="no">No — Enfermedad</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Fecha / inicio de síntomas" value={form.fecha_inicio_sintomas ?? ""} onChange={set("fecha_inicio_sintomas")} placeholder="ej: hace 3 días, 15/07/2026" />
                <Input label="Número de episodio (brazalete)" value={form.numero_episodio ?? ""} onChange={set("numero_episodio")} />
              </div>
              <Input label="Mecanismo de ingreso" value={form.mecanismo_ingreso ?? ""} onChange={set("mecanismo_ingreso")} placeholder="Cómo y cuándo iniciaron los síntomas" />
              <div className="grid grid-cols-2 gap-4">
                <Input label="Familiar / acompañante" value={form.familiar_nombre ?? ""} onChange={set("familiar_nombre")} />
                <Input label="Teléfono del familiar" value={form.familiar_telefono ?? ""} onChange={set("familiar_telefono")} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Número de siniestro (aseguradora)" value={form.numero_siniestro ?? ""} onChange={set("numero_siniestro")} />
                <Input label="Folio de programación (vinculación)" value={form.folio_programacion ?? ""} onChange={set("folio_programacion")} />
              </div>
              <Input label="Antecedentes / historia clínica" value={form.antecedentes_enfermedad ?? ""} onChange={set("antecedentes_enfermedad")} placeholder="Enfermedades crónicas, cirugías previas, alergias" />
              <div className="flex gap-6 text-sm mt-1">
                {[
                  { key: "valorado_medico_previo", label: "¿Valorado por médico previo?" },
                  { key: "atenciones_previas_sgmm", label: "¿Atenciones previas con SGMM?" },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer" style={{ color: "var(--muted)" }}>
                    <input
                      type="checkbox"
                      checked={!!(form as Record<string, unknown>)[key]}
                      onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.checked }))}
                    />
                    <span className="text-xs">{label}</span>
                  </label>
                ))}
              </div>

              {/* Upload link panel */}
              {canEdit && (
                <div className="mt-4 p-4 rounded-xl border" style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}>
                  <div className="flex items-center gap-2 mb-3">
                    <Link2 size={13} style={{ color: "var(--accent)" }} />
                    <span className="text-xs font-semibold" style={{ color: "var(--text)" }}>Repositorio de documentos</span>
                  </div>
                  {uploadLink ? (
                    <div className="space-y-2">
                      <p className="text-xs" style={{ color: "var(--subtle)" }}>
                        Link activo — vence {uploadExpiry ? new Date(uploadExpiry).toLocaleString("es-MX", { dateStyle: "short", timeStyle: "short" }) : ""}
                      </p>
                      <div className="flex items-center gap-2">
                        <input
                          readOnly value={uploadLink}
                          className="flex-1 h-8 px-3 text-xs rounded-lg border font-mono outline-none truncate"
                          style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text)" }}
                        />
                        <button
                          onClick={copyLink}
                          className="h-8 px-3 flex items-center gap-1.5 rounded-lg text-xs font-medium transition-colors"
                          style={{ background: linkCopied ? "#ECFDF5" : "var(--surface)", border: "1px solid var(--border)", color: linkCopied ? "#059669" : "var(--accent)" }}
                        >
                          {linkCopied ? <Check size={12} /> : <Copy size={12} />}
                          {linkCopied ? "¡Copiado!" : "Copiar"}
                        </button>
                      </div>
                      <button
                        onClick={generateUploadLink}
                        disabled={generatingLink}
                        className="text-xs underline"
                        style={{ color: "var(--subtle)" }}
                      >
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
                            <input
                              type="checkbox"
                              checked={docsSeleccionados.includes(k)}
                              onChange={(e) => setDocsSeleccionados((prev) =>
                                e.target.checked ? [...prev, k] : prev.filter((d) => d !== k)
                              )}
                            />
                            {l}
                          </label>
                        ))}
                      </div>
                      <button
                        onClick={generateUploadLink}
                        disabled={generatingLink || docsSeleccionados.length === 0}
                        className="flex items-center gap-1.5 h-8 px-4 rounded-lg text-xs font-medium transition-all"
                        style={{
                          background: "var(--accent)", color: "#fff",
                          opacity: generatingLink || docsSeleccionados.length === 0 ? 0.6 : 1,
                        }}
                      >
                        <Link2 size={11} />
                        {generatingLink ? "Generando..." : "Generar link de documentos"}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {tab === "canal" && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <Select label="Fuente" value={form.fuente ?? "formulario"} onChange={set("fuente")}>
                  <option value="formulario">Formulario web</option>
                  <option value="llamada">Llamada</option>
                  <option value="qr">QR / Vendedor</option>
                  <option value="referido">Referido</option>
                  <option value="whatsapp_bot">WhatsApp Bot</option>
                </Select>
                <Input label="Código referido" value={form.codigo_referido ?? ""} readOnly
                  className="opacity-70" />
              </div>
              {lead.vendedores && (
                <div className="flex items-center gap-2 p-3 rounded-lg"
                  style={{ background: "var(--surface-2)" }}>
                  <Tag size={12} style={{ color: "var(--accent)" }} />
                  <span className="text-xs" style={{ color: "var(--muted)" }}>
                    Vendedor referidor: <strong style={{ color: "var(--text)" }}>{lead.vendedores.nombre}</strong>
                    {" "}({lead.vendedores.codigo_unico})
                  </span>
                </div>
              )}
            </>
          )}

          {tab === "notas" && (
            <Textarea label="Notas del expediente" value={form.notas ?? ""} onChange={set("notas")} rows={8} />
          )}

          {canEdit && (
            <div className="flex justify-end pt-2 border-t" style={{ borderColor: "var(--border)" }}>
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
