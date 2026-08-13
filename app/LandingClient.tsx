"use client"
import { useState } from "react"
import Link from "next/link"
import {
  ShieldCheck, CircleDollarSign, Stethoscope,
  MapPin, Phone, Mail, Lock, CheckCircle, ChevronDown, Shield,
} from "lucide-react"

// ── Constantes ─────────────────────────────────────────────────────────────

const VERDE = "#0F6E56"
const VERDE_LIGHT = "#E1F5EE"

const ASEGURADORAS = [
  "GNP Seguros", "AXA", "BUPA México", "Mapfre", "Metlife",
  "Allianz", "HDI Seguros", "Qualitas", "Zurich", "Chubb",
  "Otra aseguradora",
]

const ESTADOS = [
  "Ciudad de México", "Estado de México", "Jalisco", "Nuevo León",
  "Puebla", "Querétaro", "Quintana Roo", "Otra ciudad",
]

const ESPECIALIDADES = [
  "Traumatología y Ortopedia", "Cirugía General", "Gastroenterología",
  "Ginecología", "Neurología", "Otorrinolaringología", "Urología", "Angiología",
]

const BENEFICIOS = [
  {
    icon: ShieldCheck,
    titulo: "Cero Depósito Hospitalario",
    desc: "Evita dejar tarjetas o depósitos de $20,000 a $50,000. Nosotros garantizamos tu ingreso.",
  },
  {
    icon: CircleDollarSign,
    titulo: "Apoyo en tu Deducible",
    desc: "Te apoyamos con hasta $10,000 de tu deducible y $30,000 de coaseguro para que no des un peso de más.",
  },
  {
    icon: Stethoscope,
    titulo: "Médicos en Red",
    desc: "Te canalizamos con los mejores especialistas certificados, dentro de la red de tu aseguradora.",
  },
]

const PASOS = [
  { n: "1", titulo: "Validamos tu caso",          desc: "Llenas el formulario. Un asesor médico revisa tu póliza y padecimiento." },
  { n: "2", titulo: "Gestión de Autorización",    desc: "Tramitamos la carta de autorización directamente con tu aseguradora." },
  { n: "3", titulo: "Coordinación de Ingreso",    desc: "Agendamos tu cirugía con el médico y hospital en red, sin depósitos." },
  { n: "4", titulo: "Alta y Seguimiento",         desc: "Gestionamos el alta administrativa para que el seguro pague al hospital." },
]

const TESTIMONIOS = [
  { nombre: "María González", detalle: "Colecistectomía • GNP Seguros",
    texto: "Pensé que iba a pagar una fortuna por la cirugía. Gestionaron todo, no dejé depósito y el seguro pagó casi todo. ¡Súper recomendados!" },
  { nombre: "Carlos Mendoza", detalle: "Hernia Inguinal • AXA",
    texto: "Me querían cobrar coaseguro doble. TuCobertura revisó mi póliza, peleó con la aseguradora y me consiguieron el médico en red. Gracias totales." },
  { nombre: "Sofía Hernández", detalle: "Artroscopia • MetLife",
    texto: "La atención fue impecable. Me programaron la cirugía de rodilla en 3 días y el asesor me acompañó al hospital. No sentí el proceso administrativo." },
]

const FAQS = [
  { q: "¿Tiene algún costo la asesoría?",
    a: "No. Nuestra asesoría y gestión es 100% gratuita para el paciente. Nosotros nos encargamos de coordinar todo directamente con tu aseguradora y el hospital." },
  { q: "¿Tengo que cambiar de aseguradora?",
    a: "Para nada. Utilizamos el Seguro de Gastos Médicos Mayores (GMM) que ya tienes contratado. Solo facilitamos el proceso para que recibas la atención que mereces." },
  { q: "¿Por qué no tengo que pagar depósito hospitalario?",
    a: "Gracias a nuestros convenios de vinculación hospitalaria, garantizamos el pago directo de la aseguradora, eliminando la necesidad de que el paciente deje tarjetas o depósitos en garantía al ingresar." },
]

// ── WhatsApp SVG ────────────────────────────────────────────────────────────

function WhatsAppIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" viewBox="0 0 16 16">
      <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.929 4.66c-.004 3.626-2.96 6.584-6.586 6.584zm3.624-4.926c-.199-.1-1.176-.58-1.357-.646-.182-.066-.314-.1-.446.1-.132.199-.512.646-.627.778-.116.132-.231.149-.43.05-.199-.1-.838-.309-1.596-.989-.589-.525-.987-1.174-1.103-1.373-.116-.199-.012-.306.087-.405.09-.089.199-.231.298-.347.1-.116.132-.199.199-.331.066-.132.033-.248-.017-.347-.05-.1-.446-1.075-.611-1.472-.161-.388-.325-.335-.446-.341-.114-.005-.247-.005-.38-.005-.132 0-.347.05-.529.248-.182.199-.694.679-.694 1.654 0 .975.71 1.916.81 2.049.1.132 1.396 2.132 3.381 2.99.473.204.841.326 1.129.417.474.15.904.129 1.244.079.379-.057 1.176-.48 1.342-.943.166-.463.166-.86.116-.943-.05-.083-.182-.133-.38-.232z"/>
    </svg>
  )
}

// ── Componente de campo de formulario ───────────────────────────────────────

function Campo({ label, required, error, children }: {
  label: string; required?: boolean; error?: string; children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  )
}

const inputCls = "w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 transition text-sm"
const focusStyle = { "--tw-ring-color": VERDE } as React.CSSProperties

// ── Main Component ──────────────────────────────────────────────────────────

export default function LandingClient() {
  const [form, setForm] = useState({
    nombre: "", apellido_paterno: "", telefono: "",
    correo: "", procedimiento: "", aseguradora: "", estado_ciudad: "",
  })
  const [consentimiento, setConsentimiento] = useState(false)
  const [errors, setErrors]   = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  function setF(k: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      let v = e.target.value
      if (k === "nombre" || k === "apellido_paterno") v = v.toUpperCase()
      if (k === "telefono") v = v.replace(/\D/g, "").slice(0, 10)
      setForm((f) => ({ ...f, [k]: v }))
      setErrors((p) => { const n = { ...p }; delete n[k]; return n })
    }
  }

  function validate() {
    const e: Record<string, string> = {}
    if (!form.nombre.trim())        e.nombre          = "Requerido"
    if (!form.apellido_paterno.trim()) e.apellido_paterno = "Requerido"
    if (form.telefono.length !== 10) e.telefono        = "El teléfono debe tener exactamente 10 dígitos"
    if (!form.correo.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correo))
                                    e.correo          = "Ingresa un correo electrónico válido"
    if (!form.procedimiento.trim()) e.procedimiento   = "Requerido"
    if (!form.aseguradora)          e.aseguradora     = "Requerido"
    if (!form.estado_ciudad)        e.estado_ciudad   = "Requerido"
    if (!consentimiento)            e.consentimiento  = "Debes aceptar el aviso de privacidad"
    return e
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    setLoading(true)
    const res = await fetch("/api/contacto", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      setSubmitted(true)
    } else {
      const j = await res.json()
      setErrors({ _global: j.error ?? "Error al enviar. Intenta de nuevo." })
      setLoading(false)
    }
  }

  return (
    <div className="bg-white flex flex-col min-h-screen">

      {/* ── NAVBAR ── */}
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-xl"
              style={{ background: VERDE }}>+</div>
            <span className="font-bold text-gray-800 text-xl">TuCobertura</span>
          </div>
          <a href="#formulario"
            className="text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors shadow-sm hidden md:block"
            style={{ background: VERDE }}>
            Verificar cobertura
          </a>
        </div>
      </nav>

      {/* ── HERO ── */}
      <header className="py-16 md:py-24" style={{ background: `linear-gradient(to bottom, ${VERDE_LIGHT}, white)` }}>
        <div className="max-w-4xl mx-auto px-4 text-center">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full mb-5 border"
            style={{ background: VERDE_LIGHT, color: VERDE, borderColor: `${VERDE}33` }}>
            <MapPin size={12} /> Gestión Médica en CDMX y Área Metropolitana
          </span>
          <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-5 leading-tight">
            ¿Te van a operar? Tu seguro GMM puede cubrirlo
          </h1>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            No enfrentes solo a la aseguradora. Nosotros gestionamos tu autorización, eliminamos el depósito
            hospitalario y te apoyamos con tu deducible. Cero costo por la gestión.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
            <a href="#formulario"
              className="text-white font-semibold px-8 py-4 rounded-lg transition-colors shadow-md text-lg"
              style={{ background: VERDE }}>
              Verificar mi cobertura
            </a>
            <a href="#beneficios"
              className="font-semibold px-8 py-4 rounded-lg border-2 transition-colors text-lg"
              style={{ color: VERDE, borderColor: VERDE, background: "white" }}>
              ¿Por qué nosotros?
            </a>
          </div>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-3 text-sm font-medium text-gray-700">
            <span className="flex items-center gap-2"><Shield size={14} style={{ color: VERDE }} /> Cero depósito hospitalario</span>
            <span className="flex items-center gap-2"><CircleDollarSign size={14} style={{ color: VERDE }} /> Apoyo en deducible y coaseguro</span>
            <span className="flex items-center gap-2"><Stethoscope size={14} style={{ color: VERDE }} /> Red de médicos certificados</span>
          </div>
        </div>
      </header>

      {/* ── BENEFICIOS ── */}
      <section id="beneficios" className="py-16 md:py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-900 mb-12">
            El respaldo que necesitas al ingresar al hospital
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {BENEFICIOS.map(({ icon: Icon, titulo, desc }) => (
              <div key={titulo} className="text-center p-8 border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow bg-gray-50/50">
                <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5"
                  style={{ background: VERDE_LIGHT }}>
                  <Icon size={24} style={{ color: VERDE }} />
                </div>
                <h3 className="font-bold text-lg text-gray-900 mb-2">{titulo}</h3>
                <p className="text-sm text-gray-600">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CÓMO FUNCIONA ── */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-900 mb-12">
            Del diagnóstico al alta hospitalaria, te acompañamos
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {PASOS.map(({ n, titulo, desc }) => (
              <div key={n} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                <div className="w-10 h-10 text-white rounded-full flex items-center justify-center font-bold mb-4"
                  style={{ background: VERDE }}>{n}</div>
                <h3 className="font-bold text-gray-900 mb-2">{titulo}</h3>
                <p className="text-sm text-gray-600">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ESPECIALIDADES ── */}
      <section className="py-12 bg-white border-y border-gray-100">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Atendemos todas las especialidades quirúrgicas</h2>
          <div className="flex flex-wrap justify-center gap-2 text-sm font-medium text-gray-600">
            {ESPECIALIDADES.map((e) => (
              <span key={e} className="bg-gray-100 px-4 py-2 rounded-full">{e}</span>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-6">
            *Gestión de pacientes en hospitales de la CDMX y Área Metropolitana con pago directo de aseguradoras.
          </p>
        </div>
      </section>

      {/* ── TESTIMONIOS ── */}
      <section className="py-16 md:py-20 bg-gray-50 border-y border-gray-100">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-900 mb-12">
            Historias de pacientes que se olvidaron del estrés hospitalario
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {TESTIMONIOS.map(({ nombre, detalle, texto }) => (
              <div key={nombre} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col">
                <div className="flex gap-1 mb-4 text-lg" style={{ color: VERDE }}>★★★★★</div>
                <p className="text-gray-700 text-sm italic mb-6 flex-grow">&ldquo;{texto}&rdquo;</p>
                <div className="border-t pt-4 mt-auto">
                  <p className="font-bold text-gray-900 text-sm">{nombre}</p>
                  <p className="text-xs text-gray-500">{detalle}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FORMULARIO ── */}
      <section id="formulario" className="py-16 md:py-24 bg-white">
        <div className="max-w-xl mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Verifica tu cobertura hoy</h2>
            <p className="text-gray-600">
              Un asesor médico certificado revisa tu caso.{" "}
              <span className="font-bold" style={{ color: VERDE }}>100% gratis.</span>
            </p>
          </div>

          <div className="bg-gray-50 p-6 md:p-8 rounded-2xl border border-gray-100 shadow-lg">
            {submitted ? (
              <div className="text-center py-4">
                <div className="w-16 h-16 rounded-full flex items-center justify-center text-white mx-auto mb-4"
                  style={{ background: VERDE }}>
                  <CheckCircle size={32} />
                </div>
                <h3 className="text-xl font-bold mb-2" style={{ color: VERDE }}>¡Gestión iniciada con éxito!</h3>
                <p className="text-gray-700 mb-2">Un asesor médico certificado te contactará por WhatsApp.</p>
                <p className="text-gray-600 text-sm font-medium">
                  Al contactarte, solicitaremos tu póliza de Gastos Médicos Mayores para mayor análisis.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                {errors._global && (
                  <div className="p-3 rounded-lg text-xs text-red-600 bg-red-50 border border-red-200">
                    {errors._global}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Campo label="Nombre" required error={errors.nombre}>
                    <input className={inputCls} style={focusStyle}
                      value={form.nombre} onChange={setF("nombre")} placeholder="Tu nombre" />
                  </Campo>
                  <Campo label="Apellido Paterno" required error={errors.apellido_paterno}>
                    <input className={inputCls} style={focusStyle}
                      value={form.apellido_paterno} onChange={setF("apellido_paterno")} placeholder="Tu apellido" />
                  </Campo>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Campo label="Teléfono (10 dígitos)" required error={errors.telefono}>
                    <input className={inputCls} style={focusStyle} inputMode="numeric"
                      value={form.telefono} onChange={setF("telefono")} placeholder="5512345678" maxLength={10} />
                  </Campo>
                  <Campo label="Correo Electrónico" required error={errors.correo}>
                    <input type="email" className={inputCls} style={focusStyle}
                      value={form.correo} onChange={setF("correo")} placeholder="tucorreo@ejemplo.com" />
                  </Campo>
                </div>

                <Campo label="¿Qué procedimiento o síntomas tienes?" required error={errors.procedimiento}>
                  <textarea className={`${inputCls} resize-none`} style={focusStyle} rows={3}
                    value={form.procedimiento} onChange={setF("procedimiento")}
                    placeholder="Ej. Colecistectomía, hernia inguinal, dolor de columna..." />
                </Campo>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Campo label="Aseguradora GMM" required error={errors.aseguradora}>
                    <select className={`${inputCls} bg-white`} style={focusStyle}
                      value={form.aseguradora} onChange={setF("aseguradora")}>
                      <option value="">Selecciona...</option>
                      {ASEGURADORAS.map((a) => <option key={a} value={a}>{a}</option>)}
                    </select>
                  </Campo>
                  <Campo label="Estado / Ciudad" required error={errors.estado_ciudad}>
                    <select className={`${inputCls} bg-white`} style={focusStyle}
                      value={form.estado_ciudad} onChange={setF("estado_ciudad")}>
                      <option value="">Selecciona...</option>
                      {ESTADOS.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </Campo>
                </div>

                <div className="flex items-start gap-2 pt-2">
                  <input type="checkbox" id="consentimiento"
                    checked={consentimiento} onChange={(e) => {
                      setConsentimiento(e.target.checked)
                      setErrors((p) => { const n = { ...p }; delete n.consentimiento; return n })
                    }}
                    className="mt-1 w-5 h-5 rounded border-gray-300 cursor-pointer"
                    style={{ accentColor: VERDE }} />
                  <label htmlFor="consentimiento" className="text-xs text-gray-600">
                    He leído y acepto el{" "}
                    <Link href="/privacidad" className="underline" style={{ color: VERDE }} target="_blank">
                      Aviso de Privacidad
                    </Link>{" "}
                    y autorizo expresamente el tratamiento de mis datos personales y de salud (datos sensibles)
                    para los fines descritos en el mismo.
                  </label>
                </div>
                {errors.consentimiento && (
                  <p className="text-red-500 text-xs -mt-2">{errors.consentimiento}</p>
                )}

                <button type="submit" disabled={loading}
                  className="w-full text-white font-semibold py-3.5 rounded-lg transition-colors duration-200 shadow-sm flex justify-center items-center gap-2 text-sm"
                  style={{ background: loading ? "#6B9E8E" : VERDE }}>
                  <Shield size={16} />
                  {loading ? "Enviando..." : "Verificar mi cobertura gratis"}
                </button>

                <p className="text-xs text-gray-500 text-center flex items-center justify-center gap-2 pt-2">
                  <Lock size={12} className="text-green-500" />
                  No vendemos seguros. Validamos el que ya tienes pagado. Cero spam.
                </p>
              </form>
            )}
          </div>

          {/* ── FAQ ── */}
          <div className="mt-12 space-y-4">
            <h3 className="text-lg font-bold text-gray-900 text-center mb-6">Preguntas Frecuentes</h3>
            {FAQS.map(({ q, a }) => (
              <details key={q} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm group">
                <summary className="flex justify-between items-center cursor-pointer font-medium text-gray-700 list-none">
                  <span>{q}</span>
                  <ChevronDown size={16} style={{ color: VERDE }}
                    className="transition-transform group-open:rotate-180 shrink-0 ml-2" />
                </summary>
                <p className="mt-3 text-sm text-gray-600">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-gray-900 text-gray-400 mt-auto">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-md flex items-center justify-center text-white font-bold"
                  style={{ background: VERDE }}>+</div>
                <span className="font-bold text-white text-lg">TuCobertura</span>
              </div>
              <p className="text-sm max-w-xs">
                Defensor del paciente. Gestión de cirugías y trámites con Seguro de Gastos Médicos Mayores en México.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Enlaces Legales</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/privacidad" className="hover:text-white transition-colors" style={{ color: "inherit" }}>Aviso de Privacidad</Link></li>
                <li><Link href="/terminos"   className="hover:text-white transition-colors" style={{ color: "inherit" }}>Términos y Condiciones</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Contacto</h4>
              <ul className="space-y-2 text-sm mb-4">
                <li className="flex items-center gap-2"><Phone size={14} style={{ color: VERDE }} /> 55 1234 5678</li>
                <li className="flex items-center gap-2"><Mail size={14} style={{ color: VERDE }} /> hola@tucobertura.mx</li>
                <li className="flex items-center gap-2"><MapPin size={14} style={{ color: VERDE }} /> CDMX y Área Metropolitana</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-xs text-center md:flex md:justify-between md:text-left">
            <p>© 2026 TuCobertura. Todos los derechos reservados.</p>
            <p className="mt-2 md:mt-0">No somos una compañía de seguros. Somos asesores y gestores de servicios médicos.</p>
          </div>
        </div>
      </footer>

      {/* ── BOTÓN FLOTANTE WHATSAPP ── */}
      <a href="https://wa.me/5215512345678?text=Hola%2C%20necesito%20asesoría%20para%20gestionar%20mi%20cirugía"
        target="_blank" rel="noreferrer"
        className="fixed bottom-6 right-6 z-50 text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-transform duration-300"
        style={{ background: "#25D366" }}
        aria-label="WhatsApp">
        <WhatsAppIcon />
        <span className="absolute top-0 right-0 block h-3 w-3 rounded-full bg-red-500 ring-2 ring-white animate-ping" />
        <span className="absolute top-0 right-0 block h-3 w-3 rounded-full bg-red-500 ring-2 ring-white" />
      </a>

    </div>
  )
}
