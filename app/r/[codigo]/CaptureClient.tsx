"use client"
import { useState, useEffect } from "react"
import { CheckCircle, Phone, User, Stethoscope, Shield, ChevronDown, MessageCircle } from "lucide-react"
import { CaptchaCanvas } from "@/components/ui/captcha-canvas"
import { PROCEDIMIENTOS } from "@/constants/procedimientos"
import { GEO_ESTADOS } from "@/constants/geo-mx"

// ── Helpers ───────────────────────────────────────────────────────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function Field({ label, required, error, children }: {
  label: string; required?: boolean; error?: string; children: React.ReactNode
}) {
  return (
    <div className="space-y-1">
      <label className="block text-xs font-semibold" style={{ color: "var(--muted)" }}>
        {label}{required && <span className="ml-0.5" style={{ color: "var(--negative)" }}>*</span>}
      </label>
      {children}
      {error && <p className="text-xs" style={{ color: "var(--negative)" }}>{error}</p>}
    </div>
  )
}

const inputBase: React.CSSProperties = {
  width: "100%",
  height: 44,
  padding: "0 12px",
  border: "1px solid var(--border)",
  borderRadius: 10,
  background: "var(--surface)",
  color: "var(--text)",
  fontSize: 14,
  outline: "none",
  textTransform: "uppercase",
}

const inputBaseNoUpper: React.CSSProperties = {
  ...inputBase,
  textTransform: "none",
}

const selectBase: React.CSSProperties = {
  ...inputBase,
  appearance: "none",
  WebkitAppearance: "none",
  cursor: "pointer",
  paddingRight: 36,
  textTransform: "none",
}

// ── Grupos de procedimientos para el select ───────────────────────────────────

type Proc = { codigo: string; nombre: string; categoria: string }
const GRUPOS: Record<string, Proc[]> = {}
for (const p of PROCEDIMIENTOS) {
  ;(GRUPOS[p.categoria] ??= []).push({ ...p })
}

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface Aseguradora { id: number; nombre: string }

// ── Main Component ────────────────────────────────────────────────────────────

export default function CaptureClient({
  codigo, vendedorNombre, aseguradoras,
}: { codigo: string; vendedorNombre: string; aseguradoras: Aseguradora[] }) {
  const [done, setDone]           = useState<string | null>(null)
  const [saving, setSaving]       = useState(false)
  const [errors, setErrors]       = useState<Record<string, string>>({})
  const [privacidad, setPrivacidad] = useState(false)
  const [captchaOk, setCaptchaOk] = useState(false)

  const [form, setForm] = useState({
    nombre: "", apellido_paterno: "", apellido_materno: "",
    telefono: "", email: "",
    estado_ciudad: "", procedimiento: "", id_aseguradora: "", notas: "",
  })

  const setUpper = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((f) => ({ ...f, [k]: e.target.value.toUpperCase() }))
      setErrors((prev) => { const n = { ...prev }; delete n[k]; return n })
    }

  const setRaw = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      setForm((f) => ({ ...f, [k]: e.target.value }))
      setErrors((prev) => { const n = { ...prev }; delete n[k]; return n })
    }

  function validate() {
    const e: Record<string, string> = {}
    if (!form.nombre.trim())          e.nombre = "El nombre es requerido"
    if (!form.apellido_paterno.trim()) e.apellido_paterno = "El apellido paterno es requerido"
    const digits = form.telefono.replace(/\D/g, "")
    if (digits.length !== 10)         e.telefono = "Debe tener exactamente 10 dígitos"
    if (form.email && !EMAIL_RE.test(form.email.trim()))
                                      e.email = "Ingresa un correo electrónico válido"
    if (!privacidad)                  e.privacidad = "Debes aceptar el Aviso de Privacidad"
    if (!captchaOk)                   e.captcha = "Completa la verificación de seguridad"
    return e
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }

    setSaving(true)
    setErrors({})

    const res = await fetch(`/api/r/${codigo}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        email: form.email.trim().toLowerCase() || null,
        id_aseguradora: form.id_aseguradora ? parseInt(form.id_aseguradora) : null,
        acepta_privacidad: true,
        _gotcha: "",
      }),
    })

    if (res.ok) {
      const { folio } = await res.json()
      setDone(folio)
    } else {
      const j = await res.json()
      setErrors({ _global: j.error ?? "Error al enviar. Intenta de nuevo." })
      setSaving(false)
    }
  }

  // ── Pantalla de éxito ──────────────────────────────────────────────────────
  if (done) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center px-4 py-12"
        style={{ background: "var(--bg)" }}>
        <div className="w-full max-w-sm space-y-5">
          <div className="text-center space-y-4">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto"
              style={{ background: "#ECFDF5", border: "3px solid #A7F3D0" }}>
              <CheckCircle size={36} style={{ color: "#059669" }} />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>
                ¡Gestión iniciada con éxito!
              </h1>
              <div className="rounded-2xl border p-4 text-left space-y-2"
                style={{ background: "#F0FDF4", borderColor: "#A7F3D0" }}>
                <div className="flex items-start gap-2.5">
                  <MessageCircle size={16} style={{ color: "#059669", flexShrink: 0, marginTop: 1 }} />
                  <p className="text-sm leading-relaxed" style={{ color: "#065F46" }}>
                    Un asesor médico certificado te contactará por <strong>WhatsApp</strong>.
                  </p>
                </div>
              </div>
              <p className="text-sm leading-relaxed px-2" style={{ color: "var(--muted)" }}>
                Al contactarte, solicitaremos tu póliza de Gastos Médicos Mayores
                para mayor análisis.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border p-4 space-y-1"
            style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--subtle)" }}>
              Folio de seguimiento
            </p>
            <p className="text-lg font-mono font-bold" style={{ color: "var(--accent)" }}>{done}</p>
            <p className="text-xs" style={{ color: "var(--subtle)" }}>
              Guarda este número para dar seguimiento a tu caso.
            </p>
          </div>

          <div className="flex items-center justify-center gap-2 text-xs" style={{ color: "var(--subtle)" }}>
            <Shield size={12} />
            Tu información está protegida con cifrado AES-256
          </div>
        </div>
      </div>
    )
  }

  // ── Formulario ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-dvh" style={{ background: "var(--bg)" }}>
      {/* Header */}
      <div className="sticky top-0 z-10 px-4 py-4 flex items-center gap-3"
        style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)" }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: "var(--accent)" }}>
          <Stethoscope size={18} color="white" />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-bold truncate" style={{ color: "var(--text)" }}>
            Cirugía con seguro GMM
          </div>
          <div className="text-xs truncate" style={{ color: "var(--muted)" }}>
            Asesor: {vendedorNombre}
          </div>
        </div>
      </div>

      <div className="px-4 py-5 max-w-lg mx-auto space-y-5 pb-10">
        {/* Intro */}
        <div className="rounded-2xl p-4 space-y-3"
          style={{ background: "#EFF6FF", border: "1px solid #BFDBFE" }}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: "#2563EB" }}>
              <Shield size={15} color="white" />
            </div>
            <p className="text-sm font-bold" style={{ color: "#1D4ED8" }}>
              Verificar mi cobertura gratis
            </p>
          </div>
          <div className="space-y-1 text-xs" style={{ color: "#3B82F6" }}>
            <p>✓ No vendemos seguros. Validamos el que ya tienes pagado.</p>
            <p>✓ Cero spam.</p>
            <p>✓ Tu información está protegida con cifrado AES-256.</p>
          </div>
        </div>

        {errors._global && (
          <div className="p-3 rounded-xl text-xs font-medium"
            style={{ background: "var(--negative-bg)", color: "var(--negative)", border: "1px solid #FECACA" }}>
            {errors._global}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          {/* ── Datos personales ── */}
          <section className="rounded-2xl border p-4 space-y-4"
            style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <div className="flex items-center gap-2 pb-1 border-b" style={{ borderColor: "var(--border)" }}>
              <User size={14} style={{ color: "var(--accent)" }} />
              <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--muted)" }}>
                Datos personales
              </span>
            </div>

            <Field label="Nombre(s)" required error={errors.nombre}>
              <input
                value={form.nombre} onChange={setUpper("nombre")}
                placeholder="TU NOMBRE"
                autoCapitalize="characters"
                style={{ ...inputBase, borderColor: errors.nombre ? "var(--negative)" : "var(--border)" }}
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Apellido paterno" required error={errors.apellido_paterno}>
                <input value={form.apellido_paterno} onChange={setUpper("apellido_paterno")}
                  placeholder="GARCÍA" autoCapitalize="characters"
                  style={{ ...inputBase, borderColor: errors.apellido_paterno ? "var(--negative)" : "var(--border)" }} />
              </Field>
              <Field label="Apellido materno">
                <input value={form.apellido_materno} onChange={setUpper("apellido_materno")}
                  placeholder="LÓPEZ" autoCapitalize="characters"
                  style={inputBase} />
              </Field>
            </div>
          </section>

          {/* ── Contacto ── */}
          <section className="rounded-2xl border p-4 space-y-4"
            style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <div className="flex items-center gap-2 pb-1 border-b" style={{ borderColor: "var(--border)" }}>
              <Phone size={14} style={{ color: "var(--accent)" }} />
              <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--muted)" }}>
                Contacto
              </span>
            </div>

            <Field label="Teléfono celular" required error={errors.telefono}>
              <input
                value={form.telefono} onChange={setRaw("telefono")}
                placeholder="5512345678" inputMode="numeric" maxLength={10}
                style={{ ...inputBaseNoUpper, borderColor: errors.telefono ? "var(--negative)" : "var(--border)" }}
              />
            </Field>

            <Field label="Correo electrónico" error={errors.email}>
              <input type="email" value={form.email} onChange={setRaw("email")}
                placeholder="tucorreo@email.com"
                style={{ ...inputBaseNoUpper, borderColor: errors.email ? "var(--negative)" : "var(--border)" }} />
            </Field>

            <Field label="Estado / Ciudad">
              <div className="relative">
                <select value={form.estado_ciudad} onChange={setRaw("estado_ciudad")} style={selectBase}>
                  <option value="">— ¿Dónde vives? —</option>
                  {GEO_ESTADOS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: "var(--muted)" }} />
              </div>
            </Field>
          </section>

          {/* ── Procedimiento y seguro ── */}
          <section className="rounded-2xl border p-4 space-y-4"
            style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <div className="flex items-center gap-2 pb-1 border-b" style={{ borderColor: "var(--border)" }}>
              <Stethoscope size={14} style={{ color: "var(--accent)" }} />
              <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--muted)" }}>
                Procedimiento y seguro
              </span>
            </div>

            <Field label="¿Qué cirugía o procedimiento necesitas?">
              <div className="relative">
                <select value={form.procedimiento} onChange={setRaw("procedimiento")} style={selectBase}>
                  <option value="">— Selecciona una opción —</option>
                  {Object.entries(GRUPOS).map(([cat, procs]) => (
                    <optgroup key={cat} label={cat}>
                      {procs.map((p) => (
                        <option key={p.codigo} value={p.nombre}>{p.nombre}</option>
                      ))}
                    </optgroup>
                  ))}
                  <option value="Otro">Otro (lo indicaré en notas)</option>
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: "var(--muted)" }} />
              </div>
            </Field>

            <Field label="Aseguradora GMM">
              <div className="relative">
                <select value={form.id_aseguradora} onChange={setRaw("id_aseguradora")} style={selectBase}>
                  <option value="">— Selecciona tu aseguradora —</option>
                  {aseguradoras.map((a) => (
                    <option key={a.id} value={a.id}>{a.nombre}</option>
                  ))}
                  <option value="0">Otra / No la encuentro</option>
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: "var(--muted)" }} />
              </div>
            </Field>

            <Field label="Comentarios adicionales (opcional)">
              <textarea value={form.notas} onChange={setUpper("notas")} rows={2}
                autoCapitalize="characters"
                placeholder="¿Tiene médico tratante? ¿Cuándo requiere la cirugía? Cualquier dato adicional..."
                style={{
                  ...inputBase, height: "auto", padding: "10px 12px",
                  resize: "none", lineHeight: "1.5",
                }} />
            </Field>
          </section>

          {/* ── Aviso de privacidad ── */}
          <div className="rounded-2xl border p-4"
            style={{
              background: errors.privacidad ? "var(--negative-bg)" : "var(--surface)",
              borderColor: errors.privacidad ? "var(--negative)" : "var(--border)",
            }}>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={privacidad}
                onChange={(e) => {
                  setPrivacidad(e.target.checked)
                  if (e.target.checked) setErrors((p) => { const n = { ...p }; delete n.privacidad; return n })
                }}
                className="mt-0.5 flex-shrink-0"
                style={{ width: 16, height: 16, accentColor: "var(--accent)", cursor: "pointer" }}
              />
              <span className="text-xs leading-relaxed" style={{ color: errors.privacidad ? "var(--negative)" : "var(--muted)" }}>
                He leído y acepto el{" "}
                <a href="/privacidad" target="_blank" rel="noopener noreferrer"
                  className="underline font-semibold" style={{ color: "var(--accent)" }}>
                  Aviso de Privacidad
                </a>{" "}
                y autorizo expresamente el tratamiento de mis datos personales y de salud
                (datos sensibles) para los fines descritos en el mismo.
                <span className="ml-0.5" style={{ color: "var(--negative)" }}>*</span>
              </span>
            </label>
            {errors.privacidad && (
              <p className="text-xs mt-2 ml-7" style={{ color: "var(--negative)" }}>{errors.privacidad}</p>
            )}
          </div>

          {/* Honeypot — campo oculto; usuarios reales lo dejan vacío */}
          <input
            type="text" name="_gotcha" tabIndex={-1} autoComplete="off"
            style={{ position: "absolute", left: "-9999px", width: 1, height: 1, opacity: 0 }}
            aria-hidden="true"
          />

          {/* CAPTCHA */}
          <CaptchaCanvas onVerified={setCaptchaOk} />
          {errors.captcha && (
            <p className="text-xs -mt-2" style={{ color: "var(--negative)" }}>{errors.captcha}</p>
          )}

          {/* Submit */}
          <button type="submit" disabled={saving}
            className="w-full py-4 rounded-2xl text-sm font-bold transition-opacity"
            style={{
              background: "var(--accent)", color: "white",
              opacity: saving ? 0.7 : 1,
              boxShadow: "0 4px 14px rgba(37,99,235,0.35)",
            }}>
            {saving ? "Enviando..." : "Verificar mi cobertura gratis →"}
          </button>

          {/* Trust */}
          <div className="rounded-xl p-3 space-y-1.5 text-xs text-center"
            style={{ background: "var(--surface-2)", color: "var(--muted)" }}>
            <p>🔒 No vendemos seguros. Validamos el que ya tienes pagado.</p>
            <p>📵 Cero spam · Tu información está protegida con cifrado AES-256.</p>
          </div>

          {/* Links legales */}
          <div className="flex items-center justify-center gap-4 text-xs" style={{ color: "var(--subtle)" }}>
            <a href="/privacidad" target="_blank" rel="noopener noreferrer"
              className="underline hover:opacity-70 transition-opacity">
              Aviso de privacidad
            </a>
            <span>·</span>
            <a href="/terminos" target="_blank" rel="noopener noreferrer"
              className="underline hover:opacity-70 transition-opacity">
              Términos y condiciones
            </a>
          </div>
        </form>
      </div>
    </div>
  )
}
