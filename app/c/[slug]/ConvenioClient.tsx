"use client"
import { useState, useCallback } from "react"
import { CheckCircle, Building2, Calendar, ChevronRight } from "lucide-react"
import { CaptchaCanvas } from "@/components/ui/captcha-canvas"

// ── Types ─────────────────────────────────────────────────────────────────────

interface CampoForm {
  campo: string; etiqueta: string; tipo: string; requerido: boolean; opciones?: string[]
}
interface Servicio {
  id: number; nombre: string; descripcion: string | null; icono: string | null
  precio_regular: number | null; precio_convenio: number | null; pct_descuento: number | null; tipo: string
}
interface EmpresaInfo {
  nombre: string; descripcion_landing: string | null; logo_url: string | null
  vigencia_inicio: string | null; vigencia_fin: string | null
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: "100%", height: 44, padding: "0 12px",
  border: "1px solid var(--border)", borderRadius: 10,
  background: "var(--surface)", color: "var(--text)",
  fontSize: 14, outline: "none",
}
const inputUpperStyle: React.CSSProperties = { ...inputStyle, textTransform: "uppercase" }

function formatMXN(v: number | null) {
  if (v == null) return null
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 0 }).format(v)
}
function formatDate(d: string | null) {
  if (!d) return ""
  return new Date(d + "T12:00:00").toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" })
}

// ── Service card ──────────────────────────────────────────────────────────────

function ServicioCard({ servicio }: { servicio: Servicio }) {
  const { nombre, descripcion, precio_regular, precio_convenio, pct_descuento } = servicio
  const hasPrecio = precio_convenio != null
  const descPct   = pct_descuento != null ? Math.round(pct_descuento) : null

  return (
    <div className="rounded-2xl border p-4 flex flex-col gap-2"
      style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
      <div className="text-sm font-bold" style={{ color: "var(--text)" }}>{nombre}</div>
      {descripcion && (
        <p className="text-xs leading-relaxed" style={{ color: "var(--muted)" }}>{descripcion}</p>
      )}
      {hasPrecio && (
        <div className="mt-auto pt-2 border-t" style={{ borderColor: "var(--border)" }}>
          {precio_regular && (
            <div className="text-xs line-through" style={{ color: "var(--subtle)" }}>
              {formatMXN(precio_regular)}
            </div>
          )}
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold" style={{ color: "var(--accent)" }}>
              {formatMXN(precio_convenio)}
            </span>
            {descPct != null && descPct > 0 && (
              <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full"
                style={{ background: "#ECFDF5", color: "#059669" }}>
                -{descPct}%
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Campo dinámico del formulario ─────────────────────────────────────────────

function FormField({
  campo, value, onChange, error,
}: {
  campo: CampoForm; value: string; onChange: (v: string) => void; error?: string
}) {
  const { etiqueta, tipo, requerido, opciones } = campo
  const baseStyle = tipo === "email" ? inputStyle : inputUpperStyle
  const borderStyle = { ...baseStyle, borderColor: error ? "var(--negative)" : "var(--border)" }

  return (
    <div className="space-y-1">
      <label className="block text-xs font-semibold" style={{ color: "var(--muted)" }}>
        {etiqueta}{requerido && <span className="ml-0.5" style={{ color: "var(--negative)" }}>*</span>}
      </label>
      {tipo === "lista" && opciones?.length ? (
        <select value={value} onChange={(e) => onChange(e.target.value)}
          style={{ ...borderStyle, appearance: "none", WebkitAppearance: "none", cursor: "pointer" }}>
          <option value="">Selecciona...</option>
          {opciones.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : tipo === "fecha" ? (
        <input type="date" value={value} onChange={(e) => onChange(e.target.value)} style={borderStyle} />
      ) : tipo === "numero" ? (
        <input type="number" value={value} onChange={(e) => onChange(e.target.value)} style={borderStyle} />
      ) : tipo === "telefono" ? (
        <input type="tel" inputMode="numeric" maxLength={10} value={value}
          onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 10))}
          placeholder="10 dígitos" style={borderStyle} />
      ) : tipo === "email" ? (
        <input type="email" value={value} onChange={(e) => onChange(e.target.value.trim().toLowerCase())}
          placeholder="correo@ejemplo.com" style={borderStyle} />
      ) : (
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)}
          style={borderStyle} />
      )}
      {error && <p className="text-xs" style={{ color: "var(--negative)" }}>{error}</p>}
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function ConvenioClient({
  slug, empresa, servicios, campos,
}: {
  slug: string
  empresa: EmpresaInfo
  servicios: Servicio[]
  campos: CampoForm[]
}) {
  const [formData, setFormData]   = useState<Record<string, string>>({})
  const [errors, setErrors]       = useState<Record<string, string>>({})
  const [captchaOk, setCaptchaOk] = useState(false)
  const [privacidad, setPrivacidad] = useState(false)
  const [loading, setLoading]     = useState(false)
  const [folio, setFolio]         = useState<string | null>(null)
  const [apiErr, setApiErr]       = useState<string | null>(null)

  const setField = useCallback((campo: string) => (v: string) =>
    setFormData((f) => ({ ...f, [campo]: v })), [])

  function validate(): boolean {
    const e: Record<string, string> = {}
    for (const c of campos) {
      const val = (formData[c.campo] ?? "").trim()
      if (c.requerido && !val) e[c.campo] = "Campo requerido"
      if (c.tipo === "telefono" && val && val.replace(/\D/g,"").length !== 10)
        e[c.campo] = "Debe tener 10 dígitos"
    }
    if (!captchaOk)   e._captcha   = "Completa la verificación de seguridad"
    if (!privacidad)  e._privacidad = "Debes aceptar el Aviso de Privacidad"
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault()
    if (!validate()) return
    setLoading(true); setApiErr(null)

    const res = await fetch(`/api/c/${slug}`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...formData, _gotcha: "", acepta_privacidad: true }),
    })
    const json = await res.json()
    if (res.ok) {
      setFolio(json.folio)
    } else {
      setApiErr(json.error ?? "Error al enviar. Intenta de nuevo.")
    }
    setLoading(false)
  }

  // ── Pantalla de éxito ─────────────────────────────────────────────────────

  if (folio) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4"
        style={{ background: "var(--bg)" }}>
        <div className="w-full max-w-sm space-y-5 py-12">
          <div className="text-center space-y-4">
            <div className="mx-auto w-20 h-20 rounded-full flex items-center justify-center"
              style={{ background: "#ECFDF5", border: "3px solid #A7F3D0" }}>
              <CheckCircle size={40} color="#059669" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>
                ¡Registro completado!
              </h1>
              <div className="rounded-2xl border p-4 text-left space-y-2"
                style={{ background: "#F0FDF4", borderColor: "#A7F3D0" }}>
                <p className="text-sm leading-relaxed" style={{ color: "#065F46" }}>
                  Un asesor de <strong>iHelp Médica</strong> se comunicará contigo en breve
                  para coordinar tu atención dentro del convenio de <strong>{empresa.nombre}</strong>.
                </p>
              </div>
              <p className="text-sm leading-relaxed px-2" style={{ color: "var(--muted)" }}>
                Ten a la mano tu credencial de trabajo o número de empleado
                al momento de la llamada.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border p-4 space-y-1"
            style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--subtle)" }}>
              Folio de seguimiento
            </p>
            <p className="text-lg font-mono font-bold" style={{ color: "var(--accent)" }}>{folio}</p>
            <p className="text-xs" style={{ color: "var(--subtle)" }}>
              Guarda este número para dar seguimiento a tu solicitud.
            </p>
          </div>

          <p className="text-center text-xs" style={{ color: "var(--subtle)" }}>
            Tu información está protegida con cifrado AES-256.
          </p>
        </div>
      </div>
    )
  }

  // ── Landing ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      {/* Header de empresa */}
      <header className="w-full border-b" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="max-w-2xl mx-auto px-5 py-5 flex items-center gap-4">
          {empresa.logo_url ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={empresa.logo_url} alt={`Logo ${empresa.nombre}`}
              className="h-12 w-12 rounded-xl object-contain flex-shrink-0"
              style={{ background: "var(--surface-2)", padding: 4 }} />
          ) : (
            <div className="h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "var(--accent-bg)" }}>
              <Building2 size={22} style={{ color: "var(--accent)" }} />
            </div>
          )}
          <div className="min-w-0">
            <div className="text-lg font-bold truncate" style={{ color: "var(--text)" }}>
              {empresa.nombre}
            </div>
            <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--accent)" }}>
              Convenio corporativo
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-5 py-8 space-y-8">

        {/* Descripción + vigencia */}
        {(empresa.descripcion_landing || empresa.vigencia_fin) && (
          <section className="space-y-3">
            {empresa.descripcion_landing && (
              <p className="text-base leading-relaxed" style={{ color: "var(--text)" }}>
                {empresa.descripcion_landing}
              </p>
            )}
            {empresa.vigencia_fin && (
              <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--muted)" }}>
                <Calendar size={12} />
                <span>Vigente hasta {formatDate(empresa.vigencia_fin)}</span>
              </div>
            )}
          </section>
        )}

        {/* Servicios del convenio */}
        {servicios.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wide" style={{ color: "var(--subtle)" }}>
              Servicios incluidos en tu convenio
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {servicios.map((s) => <ServicioCard key={s.id} servicio={s} />)}
            </div>
          </section>
        )}

        {/* Formulario de solicitud */}
        <section className="rounded-2xl border p-5 space-y-4"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <div>
            <h2 className="text-base font-bold" style={{ color: "var(--text)" }}>
              Solicita tu consulta
            </h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
              Completa los datos y un asesor te contactará a la brevedad.
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* Honeypot */}
            <input name="_gotcha" style={{ position: "absolute", left: -9999, width: 1, height: 1, opacity: 0 }}
              aria-hidden="true" tabIndex={-1} autoComplete="off" />

            {/* Nombre completo en grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {campos.filter((c) => ["nombre","apellido_paterno"].includes(c.campo)).map((c) => (
                <FormField key={c.campo} campo={c}
                  value={formData[c.campo] ?? ""}
                  onChange={setField(c.campo)}
                  error={errors[c.campo]}
                />
              ))}
            </div>
            {campos.filter((c) => c.campo === "apellido_materno").map((c) => (
              <FormField key={c.campo} campo={c}
                value={formData[c.campo] ?? ""}
                onChange={setField(c.campo)}
                error={errors[c.campo]}
              />
            ))}

            {/* Teléfono + email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {campos.filter((c) => ["telefono","email"].includes(c.campo)).map((c) => (
                <FormField key={c.campo} campo={c}
                  value={formData[c.campo] ?? ""}
                  onChange={setField(c.campo)}
                  error={errors[c.campo]}
                />
              ))}
            </div>

            {/* Campos adicionales */}
            {campos.filter((c) => !["nombre","apellido_paterno","apellido_materno","telefono","email"].includes(c.campo))
              .map((c) => (
                <FormField key={c.campo} campo={c}
                  value={formData[c.campo] ?? ""}
                  onChange={setField(c.campo)}
                  error={errors[c.campo]}
                />
              ))}

            {/* CAPTCHA */}
            <CaptchaCanvas onVerified={setCaptchaOk} />
            {errors._captcha && (
              <p className="text-xs" style={{ color: "var(--negative)" }}>{errors._captcha}</p>
            )}

            {/* Privacidad */}
            <div className="space-y-1">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input type="checkbox" checked={privacidad} onChange={(e) => setPrivacidad(e.target.checked)}
                  className="mt-0.5 flex-shrink-0" />
                <span className="text-xs" style={{ color: "var(--muted)" }}>
                  Acepto el{" "}
                  <a href="/privacidad" target="_blank" rel="noopener noreferrer"
                    style={{ color: "var(--accent)", textDecoration: "underline" }}>
                    Aviso de Privacidad
                  </a>
                  {" "}y los{" "}
                  <a href="/terminos" target="_blank" rel="noopener noreferrer"
                    style={{ color: "var(--accent)", textDecoration: "underline" }}>
                    Términos y Condiciones
                  </a>
                  {" "}del servicio
                </span>
              </label>
              {errors._privacidad && (
                <p className="text-xs" style={{ color: "var(--negative)" }}>{errors._privacidad}</p>
              )}
            </div>

            {apiErr && (
              <div className="rounded-xl px-4 py-3 text-sm" style={{ background: "#FEF2F2", color: "#DC2626" }}>
                {apiErr}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2"
              style={{
                height: 48, borderRadius: 12, border: "none", cursor: loading ? "not-allowed" : "pointer",
                background: "var(--accent)", color: "white", fontSize: 15, fontWeight: 700,
                opacity: loading ? 0.7 : 1,
              }}>
              {loading ? "Enviando..." : (
                <>Enviar solicitud <ChevronRight size={16} /></>
              )}
            </button>
          </form>
        </section>

        <div className="text-center text-xs pb-6 space-y-1" style={{ color: "var(--subtle)" }}>
          <div className="flex items-center justify-center gap-3">
            <a href="/privacidad" target="_blank" rel="noopener noreferrer"
              style={{ color: "var(--muted)", textDecoration: "underline" }}>
              Aviso de Privacidad
            </a>
            <span>·</span>
            <a href="/terminos" target="_blank" rel="noopener noreferrer"
              style={{ color: "var(--muted)", textDecoration: "underline" }}>
              Términos y Condiciones
            </a>
          </div>
          <p>
            Powered by{" "}
            <span className="font-semibold" style={{ color: "var(--accent)" }}>iHelp Médica</span>
          </p>
        </div>
      </main>
    </div>
  )
}
