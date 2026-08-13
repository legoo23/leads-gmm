"use client"
import { useState } from "react"
import { CheckCircle, Phone, User, Stethoscope, Shield, ChevronDown } from "lucide-react"
import { ASEGURADORAS } from "@/constants/aseguradoras"
import { PROCEDIMIENTOS } from "@/constants/procedimientos"
import { GEO_ESTADOS } from "@/constants/geo-mx"

// ── Helpers ───────────────────────────────────────────────────────────────────

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
}

const selectBase: React.CSSProperties = {
  ...inputBase,
  appearance: "none",
  WebkitAppearance: "none",
  cursor: "pointer",
  paddingRight: 36,
}

// ── Grupos de procedimientos para el select ───────────────────────────────────

type Proc = { codigo: string; nombre: string; categoria: string }
const GRUPOS: Record<string, Proc[]> = {}
for (const p of PROCEDIMIENTOS) {
  ;(GRUPOS[p.categoria] ??= []).push({ ...p })
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function CaptureClient({
  codigo, vendedorNombre,
}: { codigo: string; vendedorNombre: string }) {
  const [done, setDone]       = useState<string | null>(null)
  const [saving, setSaving]   = useState(false)
  const [errors, setErrors]   = useState<Record<string, string>>({})
  const [tieneSeguro, setTieneSeguro] = useState<boolean | null>(null)

  const [form, setForm] = useState({
    nombre: "", apellido_paterno: "", apellido_materno: "",
    telefono: "", email: "",
    estado_ciudad: "", procedimiento: "", id_aseguradora: "", notas: "",
  })

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      setForm((f) => ({ ...f, [k]: e.target.value }))
      setErrors((prev) => { const n = { ...prev }; delete n[k]; return n })
    }

  function validate() {
    const e: Record<string, string> = {}
    if (!form.nombre.trim()) e.nombre = "El nombre es requerido"
    const digits = form.telefono.replace(/\D/g, "")
    if (digits.length !== 10) e.telefono = "Debe tener exactamente 10 dígitos"
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
        id_aseguradora: form.id_aseguradora ? parseInt(form.id_aseguradora) : null,
        notas: [
          form.notas,
          tieneSeguro === false ? "Paciente indicó NO tener seguro GMM actualmente." : "",
        ].filter(Boolean).join("\n") || null,
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
        <div className="w-full max-w-sm text-center space-y-5">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto"
            style={{ background: "#ECFDF5", border: "3px solid #A7F3D0" }}>
            <CheckCircle size={36} style={{ color: "#059669" }} />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>
              ¡Solicitud enviada!
            </h1>
            <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
              Un asesor especializado en procedimientos quirúrgicos con seguro GMM
              te contactará en las próximas <strong>2 horas</strong>.
            </p>
          </div>
          <div className="rounded-2xl border p-4 text-left space-y-2"
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
            Tus datos están protegidos con cifrado AES-256
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
        <div className="rounded-2xl p-4 space-y-1"
          style={{ background: "#EFF6FF", border: "1px solid #BFDBFE" }}>
          <p className="text-sm font-semibold" style={{ color: "#1D4ED8" }}>
            Verifica tu cobertura sin costo
          </p>
          <p className="text-xs leading-relaxed" style={{ color: "#3B82F6" }}>
            Completa tus datos y te contactaremos para revisar si tu seguro GMM cubre
            el procedimiento que necesitas.
          </p>
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

            <Field label="Nombre" required error={errors.nombre}>
              <input
                value={form.nombre} onChange={set("nombre")}
                placeholder="Tu nombre completo"
                style={{ ...inputBase, borderColor: errors.nombre ? "var(--negative)" : "var(--border)" }}
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Apellido paterno">
                <input value={form.apellido_paterno} onChange={set("apellido_paterno")}
                  placeholder="García" style={inputBase} />
              </Field>
              <Field label="Apellido materno">
                <input value={form.apellido_materno} onChange={set("apellido_materno")}
                  placeholder="López" style={inputBase} />
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
                value={form.telefono} onChange={set("telefono")}
                placeholder="5512345678" inputMode="numeric" maxLength={10}
                style={{ ...inputBase, borderColor: errors.telefono ? "var(--negative)" : "var(--border)" }}
              />
            </Field>

            <Field label="Correo electrónico (opcional)">
              <input type="email" value={form.email} onChange={set("email")}
                placeholder="tucorreo@email.com" style={inputBase} />
            </Field>

            <Field label="Estado / Ciudad">
              <div className="relative">
                <select value={form.estado_ciudad} onChange={set("estado_ciudad")} style={selectBase}>
                  <option value="">— ¿Dónde vives? —</option>
                  {GEO_ESTADOS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: "var(--muted)" }} />
              </div>
            </Field>
          </section>

          {/* ── Procedimiento ── */}
          <section className="rounded-2xl border p-4 space-y-4"
            style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <div className="flex items-center gap-2 pb-1 border-b" style={{ borderColor: "var(--border)" }}>
              <Stethoscope size={14} style={{ color: "var(--accent)" }} />
              <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--muted)" }}>
                Procedimiento
              </span>
            </div>

            <Field label="¿Qué cirugía o procedimiento necesitas?">
              <div className="relative">
                <select value={form.procedimiento} onChange={set("procedimiento")} style={selectBase}>
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

            {/* ¿Tiene seguro GMM? */}
            <Field label="¿Tienes seguro de Gastos Médicos Mayores (GMM) vigente?">
              <div className="grid grid-cols-2 gap-2">
                {[
                  { v: true,  label: "Sí, tengo seguro",   color: "#059669", bg: tieneSeguro === true  ? "#ECFDF5" : "var(--surface-2)", border: tieneSeguro === true  ? "#A7F3D0" : "var(--border)" },
                  { v: false, label: "No tengo seguro",    color: "#DC2626", bg: tieneSeguro === false ? "#FEF2F2" : "var(--surface-2)", border: tieneSeguro === false ? "#FECACA" : "var(--border)" },
                ].map(({ v, label, color, bg, border }) => (
                  <button key={String(v)} type="button"
                    onClick={() => setTieneSeguro(v)}
                    className="py-3 px-4 rounded-xl border text-xs font-semibold transition-colors text-center"
                    style={{ background: bg, borderColor: border, color }}>
                    {label}
                  </button>
                ))}
              </div>
            </Field>

            {tieneSeguro && (
              <Field label="¿Con qué aseguradora?">
                <div className="relative">
                  <select value={form.id_aseguradora} onChange={set("id_aseguradora")} style={selectBase}>
                    <option value="">— Selecciona tu aseguradora —</option>
                    {ASEGURADORAS.map((a) => (
                      <option key={a.id} value={a.id}>{a.nombre}</option>
                    ))}
                    <option value="0">Otra aseguradora</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                    style={{ color: "var(--muted)" }} />
                </div>
              </Field>
            )}

            <Field label="Comentarios adicionales (opcional)">
              <textarea value={form.notas} onChange={set("notas")} rows={2}
                placeholder="¿Tiene médico tratante? ¿Cuándo requiere la cirugía? Cualquier dato adicional..."
                style={{
                  ...inputBase, height: "auto", padding: "10px 12px",
                  resize: "none", lineHeight: "1.5",
                }} />
            </Field>
          </section>

          {/* Submit */}
          <button type="submit" disabled={saving}
            className="w-full py-4 rounded-2xl text-sm font-bold transition-opacity"
            style={{
              background: "var(--accent)", color: "white",
              opacity: saving ? 0.7 : 1,
              boxShadow: "0 4px 14px rgba(37,99,235,0.35)",
            }}>
            {saving ? "Enviando..." : "Solicitar información gratuita →"}
          </button>

          <p className="text-xs text-center leading-relaxed" style={{ color: "var(--subtle)" }}>
            Al enviar autorizas que un asesor te contacte para verificar tu cobertura.
            <br />Tu información está protegida con cifrado AES-256.
          </p>
        </form>
      </div>
    </div>
  )
}
