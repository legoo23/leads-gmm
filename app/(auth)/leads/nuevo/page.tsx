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

export default function NuevoLeadPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const [form, setForm] = useState({
    nombre: "",
    apellido_paterno: "",
    apellido_materno: "",
    telefono: "",
    email: "",
    fecha_nacimiento: "",
    estado_ciudad: "",
    prioridad: "media",
    procedimiento: "",
    urgencia: "electiva",
    id_aseguradora: "",
    numero_poliza: "",
    fuente: "formulario",
    notas: "",
  })

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nombre.trim()) { setError("El nombre es requerido"); return }
    setSaving(true)
    setError("")

    const res = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        id_aseguradora: form.id_aseguradora ? parseInt(form.id_aseguradora) : null,
      }),
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
        <h1 className="text-lg font-semibold" style={{ color: "var(--text)" }}>Nuevo Lead</h1>
      </div>

      {error && (
        <div className="p-3 rounded-lg text-xs font-medium"
          style={{ background: "#FEF2F2", color: "var(--negative)", border: "1px solid #FECACA" }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Datos de contacto */}
        <section className="rounded-xl border p-5 space-y-4" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
          <h2 className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--subtle)" }}>
            Datos de contacto
          </h2>
          <div className="grid grid-cols-3 gap-4">
            <Input label="Nombre *" value={form.nombre} onChange={set("nombre")} placeholder="Nombre" required />
            <Input label="Apellido paterno" value={form.apellido_paterno} onChange={set("apellido_paterno")} />
            <Input label="Apellido materno" value={form.apellido_materno} onChange={set("apellido_materno")} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Teléfono (10 dígitos)" value={form.telefono} onChange={set("telefono")} placeholder="5512345678" maxLength={10} />
            <Input label="Email" type="email" value={form.email} onChange={set("email")} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Fecha de nacimiento" type="date" value={form.fecha_nacimiento} onChange={set("fecha_nacimiento")} />
            <Select label="Estado / Ciudad" value={form.estado_ciudad} onChange={set("estado_ciudad")}>
              <option value="">Seleccionar estado</option>
              {GEO_ESTADOS.map((s) => <option key={s} value={s}>{s}</option>)}
            </Select>
          </div>
          <Select label="Prioridad" value={form.prioridad} onChange={set("prioridad")}>
            <option value="baja">Baja</option>
            <option value="media">Media</option>
            <option value="alta">Alta</option>
            <option value="urgente">Urgente</option>
          </Select>
        </section>

        {/* Procedimiento */}
        <section className="rounded-xl border p-5 space-y-4" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
          <h2 className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--subtle)" }}>
            Procedimiento quirúrgico
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <Select label="Procedimiento" value={form.procedimiento} onChange={set("procedimiento")}>
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

        {/* Seguro GMM */}
        <section className="rounded-xl border p-5 space-y-4" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
          <h2 className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--subtle)" }}>
            Póliza GMM (opcional)
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <Select label="Aseguradora" value={form.id_aseguradora} onChange={set("id_aseguradora")}>
              <option value="">Seleccionar aseguradora</option>
              {ASEGURADORAS.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}
            </Select>
            <Input label="Número de póliza" value={form.numero_poliza} onChange={set("numero_poliza")} />
          </div>
        </section>

        {/* Canal */}
        <section className="rounded-xl border p-5 space-y-4" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
          <h2 className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--subtle)" }}>
            Canal y notas
          </h2>
          <Select label="Fuente" value={form.fuente} onChange={set("fuente")}>
            <option value="formulario">Formulario web</option>
            <option value="llamada">Llamada</option>
            <option value="qr">QR / Vendedor</option>
            <option value="referido">Referido</option>
            <option value="whatsapp_bot">WhatsApp Bot</option>
          </Select>
          <Textarea label="Notas iniciales" value={form.notas} onChange={set("notas")} rows={3} />
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
