"use client"
import { useState, use } from "react"
import { CheckCircle, Send, Stethoscope } from "lucide-react"
import { Input, Select, Textarea } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ASEGURADORAS } from "@/constants/aseguradoras"
import { PROCEDIMIENTOS } from "@/constants/procedimientos"
import { GEO_ESTADOS } from "@/constants/geo-mx"

export default function CapturaPubicaPage({ params }: { params: Promise<{ codigo: string }> }) {
  const { codigo } = use(params)
  const [step, setStep] = useState<"form" | "success">("form")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const [form, setForm] = useState({
    nombre: "", apellido_paterno: "", apellido_materno: "",
    telefono: "", email: "", estado_ciudad: "",
    procedimiento: "", id_aseguradora: "", notas: "",
  })

  const set = (k: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nombre.trim() || !form.telefono.trim()) {
      setError("Nombre y teléfono son requeridos")
      return
    }
    setSaving(true)
    setError("")

    const res = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        id_aseguradora: form.id_aseguradora ? parseInt(form.id_aseguradora) : null,
        codigo_referido: codigo,
        fuente: "qr",
        prioridad: "media",
      }),
    })

    if (res.ok) {
      setStep("success")
    } else {
      const j = await res.json()
      setError(j.error ?? "Error al enviar. Intenta de nuevo.")
      setSaving(false)
    }
  }

  if (step === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4"
        style={{ background: "var(--bg)" }}>
        <div className="max-w-sm w-full text-center space-y-4">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
            style={{ background: "#ECFDF5" }}>
            <CheckCircle size={32} color="#059669" />
          </div>
          <h1 className="text-xl font-bold" style={{ color: "var(--text)" }}>¡Solicitud recibida!</h1>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            Un asesor especializado en procedimientos quirúrgicos con seguro GMM se pondrá en contacto contigo
            en las próximas 2 horas.
          </p>
          <p className="text-xs" style={{ color: "var(--subtle)" }}>
            Código de seguimiento: <span className="font-mono font-semibold">{codigo}</span>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 flex flex-col items-center justify-start pt-10"
      style={{ background: "var(--bg)" }}>
      <div className="w-full max-w-lg space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto"
            style={{ background: "var(--accent)" }}>
            <Stethoscope size={22} color="white" />
          </div>
          <h1 className="text-xl font-bold" style={{ color: "var(--text)" }}>
            Cirugía cubierta por tu seguro
          </h1>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            Completa tus datos y un especialista te contactará para verificar tu cobertura GMM sin costo.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-lg text-xs font-medium"
            style={{ background: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}
          className="rounded-2xl border p-6 space-y-4"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Input label="Nombre *" value={form.nombre} onChange={set("nombre")} placeholder="Tu nombre" required />
            </div>
            <Input label="Apellido paterno" value={form.apellido_paterno} onChange={set("apellido_paterno")} />
            <Input label="Apellido materno" value={form.apellido_materno} onChange={set("apellido_materno")} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label="Teléfono (10 dígitos) *" value={form.telefono} onChange={set("telefono")}
              placeholder="5512345678" maxLength={10} required />
            <Input label="Email" type="email" value={form.email} onChange={set("email")} />
          </div>

          <Select label="Estado / Ciudad" value={form.estado_ciudad} onChange={set("estado_ciudad")}>
            <option value="">— Selecciona tu estado —</option>
            {GEO_ESTADOS.map((s) => <option key={s} value={s}>{s}</option>)}
          </Select>

          <Select label="¿Qué procedimiento necesitas?" value={form.procedimiento} onChange={set("procedimiento")}>
            <option value="">— Seleccionar —</option>
            {PROCEDIMIENTOS.map((p) => <option key={p.codigo} value={p.nombre}>{p.nombre}</option>)}
          </Select>

          <Select label="¿Con qué aseguradora tienes tu seguro GMM?" value={form.id_aseguradora} onChange={set("id_aseguradora")}>
            <option value="">— Selecciona tu aseguradora —</option>
            {ASEGURADORAS.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}
          </Select>

          <Textarea label="¿Algo más que quieras comentar? (opcional)" value={form.notas} onChange={set("notas")} rows={2} />

          {/* Hidden code field */}
          <input type="hidden" value={codigo} />

          <Button type="submit" className="w-full" loading={saving} size="lg">
            <Send size={14} />
            Solicitar información gratuita
          </Button>

          <p className="text-xs text-center" style={{ color: "var(--subtle)" }}>
            Al enviar, aceptas que un asesor te contacte para verificar tu cobertura.
            Tus datos están protegidos con cifrado AES-256.
          </p>
        </form>
      </div>
    </div>
  )
}
