"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input, Select, Textarea } from "@/components/ui/input"
import { ASEGURADORAS } from "@/constants/aseguradoras"
import { PROCEDIMIENTOS } from "@/constants/procedimientos"
import { GEO_ESTADOS } from "@/constants/geo-mx"

/* ------------------------------------------------------------------ */
/* Componente de teléfono con selector de país                         */
/* ------------------------------------------------------------------ */
function PhoneField({
  label, value, pais, onValueChange, onPaisChange, required,
}: {
  label: string; value: string; pais: string
  onValueChange: (v: string) => void
  onPaisChange: (v: string) => void
  required?: boolean
}) {
  const isMX = pais === "MX"
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium" style={{ color: "var(--muted)" }}>{label}</label>
      <div className="flex gap-1">
        {/* Selector de país */}
        <select
          value={pais}
          onChange={(e) => { onPaisChange(e.target.value); onValueChange("") }}
          className="h-9 rounded-lg border px-2 text-xs outline-none flex-shrink-0"
          style={{
            backgroundColor: "var(--surface)",
            borderColor: "var(--border)",
            color: "var(--text)",
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right 6px center",
            backgroundSize: "10px",
            paddingRight: "22px",
          }}
        >
          <option value="MX">🇲🇽 +52</option>
          <option value="INT">🌐 Otro</option>
        </select>
        {/* Input de número */}
        <input
          type="tel"
          required={required}
          value={value}
          maxLength={isMX ? 10 : 20}
          placeholder={isMX ? "5512345678" : "Cód. país + número"}
          onChange={(e) => onValueChange(e.target.value.replace(/\D/g, ""))}
          className="flex-1 h-9 rounded-lg border px-3 text-sm outline-none"
          style={{
            background: "var(--surface)",
            borderColor: "var(--border)",
            color: "var(--text)",
          }}
        />
      </div>
      {required && isMX && value.length > 0 && value.length !== 10 && (
        <p className="text-xs" style={{ color: "var(--negative)" }}>Debe tener 10 dígitos</p>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Página principal                                                     */
/* ------------------------------------------------------------------ */
export default function NuevoLeadPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const [form, setForm] = useState({
    nombre: "",
    apellido_paterno: "",
    apellido_materno: "",
    telefono: "",
    telefono_alternativo: "",
    telefono_alternativo_2: "",
    email: "",
    email_alternativo: "",
    fecha_nacimiento: "",
    estado_ciudad: "",
    curp: "",
    prioridad: "media",
    procedimiento: "",
    urgencia: "electiva",
    id_aseguradora: "",
    aseguradora_otro: "",
    numero_poliza: "",
    fuente: "formulario",
    fuente_especifica: "",
    notas: "",
  })

  const [paises, setPaises] = useState({ telefono: "MX", alt1: "MX" })

  const set = (k: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }))

  function buildPhoneValue(rawValue: string, pais: string) {
    if (pais === "MX") return rawValue
    return rawValue ? `+${rawValue}` : ""
  }

  function validate(): string | null {
    if (!form.nombre.trim()) return "El nombre es requerido"
    if (!form.apellido_paterno.trim()) return "El apellido paterno es requerido"
    if (!form.email.trim()) return "El email es requerido"
    if (!form.id_aseguradora) return "La aseguradora es requerida"
    if (form.id_aseguradora === "otro" && !form.aseguradora_otro.trim())
      return "Indica el nombre de la aseguradora"
    if (!form.telefono) return "El teléfono es requerido"
    if (paises.telefono === "MX" && form.telefono.length !== 10)
      return "El teléfono debe tener 10 dígitos"
    if (paises.alt1 === "MX" && form.telefono_alternativo && form.telefono_alternativo.length !== 10)
      return "El teléfono alternativo debe tener 10 dígitos"
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const err = validate()
    if (err) { setError(err); return }
    setSaving(true)
    setError("")

    const esOtroSeguro = form.id_aseguradora === "otro"
    const notasFinales = esOtroSeguro && form.aseguradora_otro
      ? `Aseguradora (pendiente de alta): ${form.aseguradora_otro.trim().toUpperCase()}${form.notas ? "\n" + form.notas : ""}`
      : form.notas || null

    const { aseguradora_otro: _ign, ...restForm } = form
    const payload = {
      ...restForm,
      telefono:               buildPhoneValue(form.telefono, paises.telefono),
      telefono_alternativo:   buildPhoneValue(form.telefono_alternativo, paises.alt1) || null,
      telefono_alternativo_2: null,
      id_aseguradora: esOtroSeguro ? null : parseInt(form.id_aseguradora),
      notas: notasFinales,
    }

    const res = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    if (res.ok) {
      const json = await res.json()
      router.push(`/leads/${json.data.id}`)
    } else {
      const json = await res.json()
      setError(json.error ?? "Error al crear el lead")
      setSaving(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/leads">
          <button className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors hover:bg-[var(--surface-2)]"
            style={{ color: "var(--muted)" }}>
            <ArrowLeft size={15} />
          </button>
        </Link>
        <div>
          <h1 className="text-lg font-semibold" style={{ color: "var(--text)" }}>Nuevo Lead</h1>
          <p className="text-xs" style={{ color: "var(--subtle)" }}>Los campos marcados con * son obligatorios</p>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg text-xs font-medium"
          style={{ background: "#FEF2F2", color: "var(--negative)", border: "1px solid #FECACA" }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* ── DATOS DE CONTACTO ──────────────────────────────────── */}
        <section className="rounded-xl border p-5 space-y-4"
          style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
          <h2 className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--subtle)" }}>
            Datos de contacto
          </h2>

          {/* Nombre */}
          <div className="grid grid-cols-3 gap-4">
            <Input label="Nombre *" value={form.nombre} onChange={set("nombre")} placeholder="Nombre" required style={{ textTransform: "uppercase" }} />
            <Input label="Apellido paterno *" value={form.apellido_paterno} onChange={set("apellido_paterno")} required style={{ textTransform: "uppercase" }} />
            <Input label="Apellido materno (Opcional)" value={form.apellido_materno} onChange={set("apellido_materno")} style={{ textTransform: "uppercase" }} />
          </div>

          {/* Teléfonos */}
          <div className="grid grid-cols-2 gap-4">
            <PhoneField
              label="Teléfono *"
              value={form.telefono}
              pais={paises.telefono}
              onValueChange={(v) => setForm((f) => ({ ...f, telefono: v }))}
              onPaisChange={(v) => setPaises((p) => ({ ...p, telefono: v }))}
              required
            />
            <PhoneField
              label="Tel. alternativo (Opcional)"
              value={form.telefono_alternativo}
              pais={paises.alt1}
              onValueChange={(v) => setForm((f) => ({ ...f, telefono_alternativo: v }))}
              onPaisChange={(v) => setPaises((p) => ({ ...p, alt1: v }))}
            />
          </div>

          {/* Emails */}
          <div className="grid grid-cols-2 gap-4">
            <Input label="Email *" type="email" value={form.email} onChange={set("email")} required />
            <Input label="Email alternativo (Opcional)" type="email" value={form.email_alternativo} onChange={set("email_alternativo")} />
          </div>

          {/* Resto de datos personales */}
          <div className="grid grid-cols-3 gap-4">
            <Input label="Fecha de nacimiento (Opcional)" type="date" value={form.fecha_nacimiento} onChange={set("fecha_nacimiento")} />
            <Select label="Estado / Ciudad (Opcional)" value={form.estado_ciudad} onChange={set("estado_ciudad")}>
              <option value="">Seleccionar estado</option>
              {GEO_ESTADOS.map((s) => <option key={s} value={s}>{s}</option>)}
            </Select>
            <Input label="CURP (Opcional)" value={form.curp} onChange={set("curp")}
              maxLength={18} placeholder="ABCD010101HDFXXX01"
              style={{ textTransform: "uppercase" }} />
          </div>

          <Select label="Prioridad" value={form.prioridad} onChange={set("prioridad")}>
            <option value="baja">Baja</option>
            <option value="media">Media</option>
            <option value="alta">Alta</option>
            <option value="urgente">Urgente</option>
          </Select>
        </section>

        {/* ── PROCEDIMIENTO ──────────────────────────────────────── */}
        <section className="rounded-xl border p-5 space-y-4"
          style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
          <h2 className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--subtle)" }}>
            Procedimiento quirúrgico
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <Select label="Procedimiento (Opcional)" value={form.procedimiento} onChange={set("procedimiento")}>
              <option value="">Seleccionar procedimiento</option>
              {PROCEDIMIENTOS.map((p) => <option key={p.codigo} value={p.nombre}>{p.nombre}</option>)}
            </Select>
            <Select label="Urgencia" value={form.urgencia} onChange={set("urgencia")}>
              <option value="electiva">Electiva</option>
              <option value="programada">Programada</option>
              <option value="urgente">Urgente</option>
            </Select>
          </div>
        </section>

        {/* ── PÓLIZA GMM ─────────────────────────────────────────── */}
        <section className="rounded-xl border p-5 space-y-4"
          style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
          <h2 className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--subtle)" }}>
            Póliza GMM
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <Select label="Aseguradora *" value={form.id_aseguradora} onChange={set("id_aseguradora")} required>
              <option value="">Seleccionar aseguradora</option>
              {ASEGURADORAS.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}
              <option value="otro">Otra (no está en la lista)</option>
            </Select>
            <Input label="Número de póliza (Opcional)" value={form.numero_poliza} onChange={set("numero_poliza")} />
          </div>
          {form.id_aseguradora === "otro" && (
            <Input
              label="Nombre de la aseguradora *"
              value={form.aseguradora_otro}
              onChange={set("aseguradora_otro")}
              placeholder="Nombre exacto de la aseguradora"
              style={{ textTransform: "uppercase" }}
              required
            />
          )}
        </section>

        {/* ── CANAL Y NOTAS ──────────────────────────────────────── */}
        <section className="rounded-xl border p-5 space-y-4"
          style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
          <h2 className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--subtle)" }}>
            Canal de adquisición
          </h2>
          <p className="text-xs" style={{ color: "var(--subtle)" }}>
            Esta información no podrá modificarse después. Captura el origen exacto del lead.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <Select label="Canal principal" value={form.fuente} onChange={set("fuente")}>
              <option value="formulario">Formulario web</option>
              <option value="llamada">Llamada entrante</option>
              <option value="qr">QR / Link de vendedor</option>
              <option value="referido">Referido directo</option>
              <option value="redes_sociales">Redes sociales</option>
              <option value="whatsapp_bot">WhatsApp Bot (automático)</option>
            </Select>

            {/* Fuente específica — condicional según canal */}
            {form.fuente === "redes_sociales" && (
              <Select label="Red social específica" value={form.fuente_especifica} onChange={set("fuente_especifica")}>
                <option value="">Seleccionar</option>
                <option value="Instagram">Instagram</option>
                <option value="Facebook">Facebook</option>
                <option value="TikTok">TikTok</option>
                <option value="YouTube">YouTube</option>
                <option value="LinkedIn">LinkedIn</option>
                <option value="Twitter/X">Twitter / X</option>
                <option value="Google Ads">Google Ads</option>
                <option value="Otro">Otro</option>
              </Select>
            )}
            {form.fuente === "referido" && (
              <Input label="¿Quién o qué lo refirió?" value={form.fuente_especifica} onChange={set("fuente_especifica")} placeholder="Nombre, médico, institución..." />
            )}
            {form.fuente === "llamada" && (
              <Input label="Origen de la llamada" value={form.fuente_especifica} onChange={set("fuente_especifica")} placeholder="Ej: base de datos, contacto previo..." />
            )}
            {form.fuente === "formulario" && (
              <Input label="Página / campaña de origen (Opcional)" value={form.fuente_especifica} onChange={set("fuente_especifica")} placeholder="Ej: landing verano, Google Ads..." />
            )}
          </div>
        </section>

        {/* ── NOTAS ──────────────────────────────────────────────── */}
        <section className="rounded-xl border p-5 space-y-4"
          style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
          <h2 className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--subtle)" }}>
            Notas iniciales
          </h2>
          <Textarea label="" value={form.notas} onChange={set("notas")} rows={3} placeholder="Contexto adicional, observaciones..." style={{ textTransform: "uppercase" }} />
        </section>

        <div className="flex justify-end gap-3">
          <Link href="/leads"><Button variant="secondary" type="button">Cancelar</Button></Link>
          <Button type="submit" loading={saving}>
            <Save size={13} />
            Guardar lead
          </Button>
        </div>
      </form>
    </div>
  )
}
