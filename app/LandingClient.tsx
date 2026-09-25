"use client"
import { useState } from "react"
import Link from "next/link"
import { Inter } from "next/font/google"
import {
  Activity, FileCheck2, Handshake, Route as RouteIcon,
  Building2, ShieldCheck, Briefcase, Stethoscope,
  CheckCircle2, ArrowRight, ChevronDown, Mail, Phone, Globe, Lock, Send, Info, Menu, X,
  FileText, Landmark, ClipboardList, Scale,
} from "lucide-react"
import type { Testimonio } from "./page"
import { BRAND, Logo, Sello, Wordmark } from "@/components/brand/Logo"

const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "700"] })

const { verde: VERDE, verdeClaro: VERDE_CLARO, gris: GRIS, neutro: NEUTRO, grisMedio: GRIS_MEDIO } = BRAND

// ── Contenido ───────────────────────────────────────────────────────────────

const NAV = [
  { href: "#servicios",    label: "Servicios" },
  { href: "#hospitales",   label: "Hospitales" },
  { href: "#aseguradoras", label: "Aseguradoras" },
  { href: "#empresas",     label: "Empresas" },
  { href: "#pacientes",    label: "Pacientes" },
]

const AUDIENCIAS = [
  { icon: Building2,   titulo: "Hospitales y prestadores", texto: "Convenios abiertos con las redes correctas y facturación que sí se cobra." },
  { icon: ShieldCheck, titulo: "Aseguradoras",             texto: "Un operador ordenado del otro lado: expedientes completos y costos contenidos." },
  { icon: Briefcase,   titulo: "Empresas y RH",            texto: "La salud de su plantilla gestionada con cumplimiento y sin carga administrativa." },
  { icon: Stethoscope, titulo: "Pacientes",                texto: "Alguien contesta del otro lado y te canaliza con el especialista adecuado." },
]

const SERVICIOS = [
  {
    icon: RouteIcon,
    titulo: "Gestión de convenios",
    sub: "Consultoría estratégica para entrar a redes de aseguradoras.",
    puntos: [
      "Diagnóstico de mercado y ruta de entrada escalonada.",
      "Integración del expediente de alta ante cada red.",
      "Estructuración de tabuladores y paquetes quirúrgicos.",
    ],
  },
  {
    icon: Activity,
    titulo: "Administración de casos",
    sub: "Case management hospitalario: control del costo por episodio.",
    puntos: [
      "Evaluación diaria de consumos hospitalarios.",
      "Control del costo promedio dentro de tabuladores.",
      "Validación de honorarios médicos e insumos.",
    ],
  },
  {
    icon: FileCheck2,
    titulo: "Dictamen central",
    sub: "Auditoría de cuenta y gestión del pago al prestador.",
    puntos: [
      "Auditoría de cuenta final antes de su envío.",
      "Carga y validación en portales de aseguradoras.",
      "Cobranza al prestador hasta la recepción del pago.",
    ],
  },
  {
    icon: Handshake,
    titulo: "Desarrollo comercial",
    sub: "Generación de volumen y referenciación dirigida.",
    puntos: [
      "Estrategia comercial B2B y B2C.",
      "Negociación de tarifarios con el sector asegurador.",
      "Canalización de pacientes hacia la red de prestadores.",
    ],
  },
]

const FASES = [
  { n: "01", titulo: "Diagnóstico",                  texto: "Leemos los requisitos de cada aseguradora y la oferta actual del hospital para definir en qué orden conviene abrir convenios." },
  { n: "02", titulo: "Optimización de la oferta",    texto: "Ajustamos precios, márgenes y paquetes a los estándares que evalúan los dictaminadores de las aseguradoras." },
  { n: "03", titulo: "Entrada rápida",               texto: "Alta con aseguradoras medianas y de alta receptividad para generar volumen e historial de siniestralidad." },
  { n: "04", titulo: "Consolidación",                texto: "Con un año de operación y métricas propias, se negocia con las redes nacionales desde una posición de solvencia." },
]

const EXPEDIENTE = [
  { icon: Scale,         titulo: "Corporativa y legal",        texto: "Acta constitutiva, poderes, identificación del representante y beneficiario controlador." },
  { icon: ClipboardList, titulo: "Sanitaria y operativa",      texto: "Avisos y licencias COFEPRIS, responsabilidad civil y documentación del cuerpo médico." },
  { icon: Landmark,      titulo: "Fiscal y bancaria",          texto: "Constancia fiscal, opinión de cumplimiento del SAT y cuenta CLABE para dispersión." },
  { icon: FileText,      titulo: "Comercial y cumplimiento",   texto: "Tabulador, currículo institucional y carta de condiciones comerciales, revisados antes del envío." },
]

const SECTORES = [
  {
    id: "hospitales",
    etiqueta: "Para hospitales y médicos",
    titulo: "Su equipo deja de perseguir convenios y cobranza",
    texto: "Acompañamos a la institución en la apertura escalonada de convenios con aseguradoras, estructuramos su oferta tarifaria y auditamos cada cuenta antes de enviarla para que la facturación se cobre.",
    cta: "Solicitar consultoría estratégica",
    items: [
      { icon: RouteIcon,  titulo: "Entrada escalonada a redes",  texto: "Primero aseguradoras receptivas; después las redes nacionales con historial propio." },
      { icon: FileText,   titulo: "Oferta tarifaria defendible", texto: "Tabuladores y paquetes alineados a valores de referencia de mercado." },
      { icon: FileCheck2, titulo: "Cuentas sin devoluciones",    texto: "Cotejo de documentación clínica y administrativa antes de radicar." },
    ],
  },
  {
    id: "aseguradoras",
    etiqueta: "Para aseguradoras",
    titulo: "Costos contenidos y una red de prestadores trazable",
    texto: "Operamos como administrador tercero (TPA): vigilamos que el costo de cada episodio se mantenga dentro de los rangos acordados y sumamos prestadores con expedientes completos a su red.",
    cta: "Solicitar información de TPA",
    items: [
      { icon: Activity,  titulo: "Contención de costos",    texto: "Control del precio promedio por episodio y monitoreo de consumos en tiempo real." },
      { icon: Handshake, titulo: "Construcción de red",     texto: "Negociación de tarifarios y alta de prestadores con documentación verificada." },
      { icon: ClipboardList, titulo: "Expedientes completos", texto: "Información clínica y administrativa ordenada para dictaminar sin reprocesos." },
    ],
  },
  {
    id: "empresas",
    etiqueta: "Para empresas y RH",
    titulo: "Salud de la plantilla con cumplimiento y sin carga administrativa",
    texto: "Llevamos campañas de salud preventiva a su centro de trabajo y ponemos a disposición de sus colaboradores nuestra red de médicos y hospitales, sin sumar trabajo a su área de recursos humanos.",
    cta: "Agendar presentación ejecutiva",
    items: [
      { icon: Activity,    titulo: "Campañas NOM-035",        texto: "Salud mental, estrés laboral y prevención en el centro de trabajo." },
      { icon: Stethoscope, titulo: "Red médica y hospitalaria", texto: "Canalización de colaboradores con especialistas de la red." },
      { icon: Briefcase,   titulo: "Convenios corporativos",  texto: "Condiciones y portal propio para los colaboradores de la empresa." },
    ],
  },
]

const ESTADOS = [
  "Tamaulipas", "Ciudad de México", "Estado de México", "Nuevo León", "Jalisco",
  "Puebla", "Querétaro", "Otra ciudad",
]

const SEGURO_OPCIONES = [
  "GNP Seguros", "AXA", "Mapfre", "MetLife", "Seguros Monterrey", "Atlas", "Sura",
  "Zurich", "Inbursa", "Allianz", "BUPA México", "Otra aseguradora", "No cuento con seguro",
]

const FAQS = [
  { q: "¿iHelp Médica es una aseguradora o un agente de seguros?",
    a: "No. iHelp Médica no vende seguros ni actúa como agente. Somos un administrador tercero (TPA) que trabaja con hospitales, médicos, aseguradoras y empresas." },
  { q: "¿Me asesoran con mi póliza, deducible o coaseguro?",
    a: "No. No brindamos asesoría sobre pólizas ni damos seguimiento a trámites con tu aseguradora, y no ofrecemos descuentos, apoyos en deducible o coaseguro, ni exención de depósitos en garantía. Todas las condiciones de tu póliza las determina exclusivamente tu aseguradora." },
  { q: "¿Qué pasa después de enviar mis datos?",
    a: "Un ejecutivo te contacta para conocer qué especialidad o procedimiento buscas y canalizarte con médicos y hospitales de nuestra red." },
]

// ── Componentes auxiliares ──────────────────────────────────────────────────

function Campo({ label, required, error, children }: {
  label: string; required?: boolean; error?: string; children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5" style={{ color: GRIS }}>
        {label}{required && <span className="text-red-600 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-red-600 text-xs mt-1">{error}</p>}
    </div>
  )
}

const inputCls =
  "w-full px-4 py-3 border border-[#D5DDE3] rounded-lg bg-white text-sm text-[#334155] placeholder:text-[#8A97A8] " +
  "focus:outline-none focus:ring-2 focus:ring-[#0F6E56] focus:border-transparent transition"

function Etiqueta({ children, light = false }: { children: React.ReactNode; light?: boolean }) {
  return (
    <span className="inline-block text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full"
      style={light ? { background: "rgba(255,255,255,.1)", color: "#9FE0CB" } : { background: VERDE_CLARO, color: VERDE }}>
      {children}
    </span>
  )
}

function Exito({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <div className="text-center py-6">
      <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: VERDE_CLARO }}>
        <CheckCircle2 size={32} style={{ color: VERDE }} />
      </div>
      <h3 className="text-xl font-bold mb-2" style={{ color: VERDE }}>{titulo}</h3>
      <p className="text-sm" style={{ color: GRIS }}>{texto}</p>
    </div>
  )
}

function Consentimiento({ id, checked, onChange, error }: {
  id: string; checked: boolean; onChange: (v: boolean) => void; error?: string
}) {
  return (
    <div>
      <div className="flex items-start gap-2.5">
        <input type="checkbox" id={id} checked={checked} onChange={(e) => onChange(e.target.checked)}
          className="mt-0.5 w-4 h-4 rounded cursor-pointer shrink-0" style={{ accentColor: VERDE }} />
        <label htmlFor={id} className="text-xs leading-relaxed" style={{ color: GRIS }}>
          He leído y acepto el{" "}
          <Link href="/privacidad" className="underline font-medium" style={{ color: VERDE }} target="_blank">
            Aviso de Privacidad
          </Link>{" "}
          y autorizo el tratamiento de mis datos personales para los fines descritos en el mismo.
        </label>
      </div>
      {error && <p className="text-red-600 text-xs mt-1">{error}</p>}
    </div>
  )
}

// ── Formulario corporativo ──────────────────────────────────────────────────

function FormCorporativo() {
  const [f, setF] = useState({ nombre_contacto: "", nombre_empresa: "", email: "", telefono: "", sector: "", mensaje: "", _gotcha: "" })
  const [ok, setOk] = useState(false)
  const [acepto, setAcepto] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const set = (k: keyof typeof f) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      let v = e.target.value
      if (k === "telefono") v = v.replace(/\D/g, "").slice(0, 10)
      setF((p) => ({ ...p, [k]: v }))
      setErrors((p) => { const n = { ...p }; delete n[k]; return n })
    }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const errs: Record<string, string> = {}
    if (!f.nombre_contacto.trim()) errs.nombre_contacto = "Requerido"
    if (!f.nombre_empresa.trim())  errs.nombre_empresa = "Requerido"
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) errs.email = "Ingresa un correo válido"
    if (f.telefono.length !== 10)  errs.telefono = "10 dígitos"
    if (!f.sector)                 errs.sector = "Selecciona una opción"
    if (!acepto)                   errs.acepto = "Debes aceptar el aviso de privacidad"
    if (Object.keys(errs).length) { setErrors(errs); return }

    setLoading(true)
    const res = await fetch("/api/contacto/corporativo", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f),
    })
    if (res.ok) setOk(true)
    else {
      const j = await res.json().catch(() => ({}))
      setErrors({ _global: j.error ?? "Error al enviar. Intenta de nuevo." })
    }
    setLoading(false)
  }

  if (ok) return <Exito titulo="Solicitud recibida" texto="Gracias por contactar a iHelp Médica. Un ejecutivo se pondrá en contacto para agendar una sesión diagnóstica." />

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      {errors._global && <div className="p-3 rounded-lg text-xs text-red-700 bg-red-50 border border-red-200">{errors._global}</div>}
      <input type="text" name="_gotcha" value={f._gotcha} onChange={set("_gotcha")} tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Campo label="Nombre del contacto" required error={errors.nombre_contacto}>
          <input className={inputCls} value={f.nombre_contacto} onChange={set("nombre_contacto")} placeholder="Nombre completo" />
        </Campo>
        <Campo label="Empresa o institución" required error={errors.nombre_empresa}>
          <input className={inputCls} value={f.nombre_empresa} onChange={set("nombre_empresa")} placeholder="Hospital, aseguradora o empresa" />
        </Campo>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Campo label="Correo corporativo" required error={errors.email}>
          <input type="email" className={inputCls} value={f.email} onChange={set("email")} placeholder="nombre@empresa.com" />
        </Campo>
        <Campo label="Teléfono (10 dígitos)" required error={errors.telefono}>
          <input inputMode="numeric" className={inputCls} value={f.telefono} onChange={set("telefono")} placeholder="8341234567" maxLength={10} />
        </Campo>
      </div>
      <Campo label="¿Qué sector representa?" required error={errors.sector}>
        <select className={inputCls} value={f.sector} onChange={set("sector")}>
          <option value="">Selecciona una opción…</option>
          <option value="HOSPITAL / CLÍNICA">Hospital / Clínica</option>
          <option value="ASEGURADORA">Aseguradora</option>
          <option value="EMPRESA / RECURSOS HUMANOS">Empresa / Recursos Humanos</option>
          <option value="MÉDICO ESPECIALISTA">Médico especialista</option>
          <option value="OTRO">Otro</option>
        </select>
      </Campo>
      <Campo label="Mensaje (opcional)">
        <textarea rows={4} className={`${inputCls} resize-none`} value={f.mensaje} onChange={set("mensaje")}
          placeholder="Describa brevemente qué necesita resolver…" />
      </Campo>
      <Consentimiento id="acepto-b2b" checked={acepto} error={errors.acepto}
        onChange={(v) => { setAcepto(v); setErrors((p) => { const n = { ...p }; delete n.acepto; return n }) }} />
      <button type="submit" disabled={loading}
        className="w-full text-white font-bold py-4 rounded-lg transition-colors flex justify-center items-center gap-2 bg-[#0F6E56] hover:bg-[#0C5A47] disabled:opacity-60">
        <Send size={16} /> {loading ? "Enviando…" : "Enviar solicitud de información"}
      </button>
    </form>
  )
}

// ── Formulario de pacientes ─────────────────────────────────────────────────

function FormPaciente({ codigoRef }: { codigoRef: string | null }) {
  const [form, setForm] = useState({
    nombre: "", apellido_paterno: "", telefono: "",
    email: "", procedimiento: "", aseguradora: "", estado_ciudad: "", _gotcha: "",
  })
  const [consentimiento, setConsentimiento] = useState(false)
  const [errors, setErrors]   = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  function setF(k: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      let v = e.target.value
      if (k === "nombre" || k === "apellido_paterno" || k === "procedimiento") v = v.toUpperCase()
      if (k === "telefono") v = v.replace(/\D/g, "").slice(0, 10)
      setForm((f) => ({ ...f, [k]: v }))
      setErrors((p) => { const n = { ...p }; delete n[k]; return n })
    }
  }

  function validate() {
    const e: Record<string, string> = {}
    if (!form.nombre.trim())           e.nombre           = "Requerido"
    if (!form.apellido_paterno.trim()) e.apellido_paterno = "Requerido"
    if (form.telefono.length !== 10)   e.telefono         = "El teléfono debe tener exactamente 10 dígitos"
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
                                       e.email            = "Ingresa un correo electrónico válido"
    if (!form.procedimiento.trim())    e.procedimiento    = "Requerido"
    if (!form.estado_ciudad)           e.estado_ciudad    = "Requerido"
    if (!consentimiento)               e.consentimiento   = "Debes aceptar el aviso de privacidad"
    return e
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    setLoading(true)
    const aseguradora = form.aseguradora === "No cuento con seguro" ? "" : form.aseguradora
    const payload = { ...form, aseguradora }
    const body = codigoRef ? { ...payload, codigo_referido: codigoRef } : payload
    const res = await fetch("/api/contacto", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    if (res.ok) {
      setSubmitted(true)
    } else {
      const j = await res.json().catch(() => ({}))
      setErrors({ _global: j.error ?? "Error al enviar. Intenta de nuevo." })
      setLoading(false)
    }
  }

  if (submitted) {
    return <Exito titulo="¡Recibimos tus datos!" texto="Un ejecutivo de iHelp Médica te contactará para canalizarte con un especialista de nuestra red." />
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {errors._global && (
        <div className="p-3 rounded-lg text-xs text-red-700 bg-red-50 border border-red-200">{errors._global}</div>
      )}
      <input type="text" name="_gotcha" value={form._gotcha} onChange={setF("_gotcha")} tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Campo label="Nombre" required error={errors.nombre}>
          <input className={inputCls} value={form.nombre} onChange={setF("nombre")} placeholder="Tu nombre" />
        </Campo>
        <Campo label="Apellido paterno" required error={errors.apellido_paterno}>
          <input className={inputCls} value={form.apellido_paterno} onChange={setF("apellido_paterno")} placeholder="Tu apellido" />
        </Campo>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Campo label="Teléfono (10 dígitos)" required error={errors.telefono}>
          <input className={inputCls} inputMode="numeric" value={form.telefono} onChange={setF("telefono")} placeholder="8341234567" maxLength={10} />
        </Campo>
        <Campo label="Correo electrónico" required error={errors.email}>
          <input type="email" className={inputCls} value={form.email} onChange={setF("email")} placeholder="tucorreo@ejemplo.com" />
        </Campo>
      </div>

      <Campo label="¿Qué especialidad o procedimiento buscas?" required error={errors.procedimiento}>
        <textarea className={`${inputCls} resize-none`} rows={3} value={form.procedimiento} onChange={setF("procedimiento")}
          placeholder="Ej. Colecistectomía, hernia inguinal, valoración de columna…" />
      </Campo>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Campo label="Estado / Ciudad" required error={errors.estado_ciudad}>
          <select className={inputCls} value={form.estado_ciudad} onChange={setF("estado_ciudad")}>
            <option value="">Selecciona…</option>
            {ESTADOS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </Campo>
        <Campo label="Seguro de gastos médicos (opcional)">
          <select className={inputCls} value={form.aseguradora} onChange={setF("aseguradora")}>
            <option value="">Selecciona…</option>
            {SEGURO_OPCIONES.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </Campo>
      </div>

      <Consentimiento id="acepto-paciente" checked={consentimiento} error={errors.consentimiento}
        onChange={(v) => { setConsentimiento(v); setErrors((p) => { const n = { ...p }; delete n.consentimiento; return n }) }} />

      <button type="submit" disabled={loading}
        className="w-full text-white font-bold py-3.5 rounded-lg transition-colors flex justify-center items-center gap-2 bg-[#0F6E56] hover:bg-[#0C5A47] disabled:opacity-60">
        {loading ? "Enviando…" : "Quiero que me contacten"}
      </button>

      <p className="text-xs text-center flex items-center justify-center gap-1.5" style={{ color: GRIS_MEDIO }}>
        <Lock size={12} /> Tus datos se almacenan cifrados. Cero spam.
      </p>
    </form>
  )
}

// ── Página ──────────────────────────────────────────────────────────────────

export default function LandingClient({
  testimonios,
  codigoRef,
}: {
  testimonios: Testimonio[]
  codigoRef: string | null
}) {
  const [menu, setMenu] = useState(false)

  return (
    <div className={`${inter.className} flex flex-col min-h-screen`} style={{ background: NEUTRO, color: GRIS }}>

      {/* ── NAVBAR ── */}
      <nav className="sticky top-0 z-50 bg-white border-b border-[#E5EAEE]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex justify-between items-center gap-4">
          <a href="#inicio" aria-label="iHelp Médica — inicio"><Logo size={36} textClass="text-lg sm:text-xl" /></a>
          <div className="hidden lg:flex items-center gap-8 text-sm font-medium">
            {NAV.map((n) => (
              <a key={n.href} href={n.href} className="hover:text-[#0F6E56] transition-colors">{n.label}</a>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <a href="#contacto"
              className="hidden sm:inline-block text-white text-sm font-bold px-5 py-2.5 rounded-lg bg-[#0F6E56] hover:bg-[#0C5A47] transition-colors">
              Solicitar información
            </a>
            <button className="lg:hidden p-2 rounded-lg hover:bg-[#F8FAF9]" onClick={() => setMenu((m) => !m)}
              aria-label={menu ? "Cerrar menú" : "Abrir menú"} aria-expanded={menu}>
              {menu ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
        {menu && (
          <div className="lg:hidden border-t border-[#E5EAEE] bg-white px-4 py-3 space-y-1">
            {NAV.map((n) => (
              <a key={n.href} href={n.href} onClick={() => setMenu(false)}
                className="block px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-[#E1F5EE] hover:text-[#0F6E56]">{n.label}</a>
            ))}
            <a href="#contacto" onClick={() => setMenu(false)}
              className="sm:hidden block text-center text-white text-sm font-bold px-5 py-3 mt-2 rounded-lg bg-[#0F6E56]">
              Solicitar información
            </a>
          </div>
        )}
      </nav>

      {/* ── HERO ── */}
      <header id="inicio" className="bg-white border-b border-[#E5EAEE]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20 md:py-28 text-center">
          <Etiqueta>Administrador tercero (TPA) · Gestión de riesgo · Red médica</Etiqueta>
          <h1 className="mt-6 text-4xl md:text-6xl font-bold leading-tight tracking-tight">
            Que el trámite no detenga{" "}<br className="hidden md:block" />
            <span style={{ color: VERDE }}>la atención.</span>
          </h1>
          <p className="mt-6 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed text-[#334155]/80">
            Somos el nexo institucional entre hospitales, cuerpo médico, aseguradoras y empresas.
            Ordenamos convenios, expedientes, auditoría de cuentas y cobranza para que cada parte opere con certeza.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
            <a href="#contacto"
              className="text-white font-bold px-8 py-4 rounded-lg bg-[#0F6E56] hover:bg-[#0C5A47] transition-colors text-base md:text-lg">
              Solicitar información corporativa
            </a>
            <a href="#pacientes"
              className="font-bold px-8 py-4 rounded-lg border-2 border-[#0F6E56] text-[#0F6E56] bg-white hover:bg-[#E1F5EE] transition-colors text-base md:text-lg">
              Soy paciente
            </a>
          </div>
        </div>

        {/* Audiencias */}
        <div className="border-t border-[#E5EAEE]" style={{ background: NEUTRO }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {AUDIENCIAS.map(({ icon: Icon, titulo, texto }) => (
              <div key={titulo} className="flex gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: VERDE_CLARO, color: VERDE }}>
                  <Icon size={18} />
                </div>
                <div>
                  <p className="font-bold text-sm">{titulo}</p>
                  <p className="text-sm mt-0.5 text-[#334155]/75">{texto}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* ── SERVICIOS ── */}
      <section id="servicios" className="py-20 md:py-24 scroll-mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <Etiqueta>Nuestro ecosistema</Etiqueta>
            <h2 className="text-3xl md:text-4xl font-bold mt-4 mb-4">Servicios de gestión integral</h2>
            <p className="max-w-2xl mx-auto text-[#334155]/80">
              Alineamos la calidad de la atención médica con el control financiero para dar certeza de pago y rentabilidad a todas las partes.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {SERVICIOS.map(({ icon: Icon, titulo, sub, puntos }) => (
              <div key={titulo}
                className="bg-white p-8 rounded-2xl border border-[#E5EAEE] transition-all duration-300 hover:-translate-y-1 hover:border-[#0F6E56]/40 hover:shadow-lg">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5" style={{ background: VERDE_CLARO, color: VERDE }}>
                  <Icon size={22} />
                </div>
                <h3 className="text-lg font-bold mb-2">{titulo}</h3>
                <p className="text-sm mb-5 text-[#334155]/75">{sub}</p>
                <ul className="space-y-2.5 text-sm">
                  {puntos.map((p) => (
                    <li key={p} className="flex gap-2.5">
                      <CheckCircle2 size={15} className="shrink-0 mt-0.5" style={{ color: VERDE }} />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── RUTA DE CONVENIOS ── */}
      <section className="py-20 md:py-24" style={{ background: GRIS }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
            <div className="lg:col-span-2">
              <Etiqueta light>Metodología</Etiqueta>
              <h2 className="text-3xl md:text-4xl font-bold mt-4 mb-5 text-white">Entrada escalonada a redes de aseguradoras</h2>
              <p className="text-white/75 leading-relaxed">
                Las redes nacionales piden historial operativo comprobable. Por eso no se empieza por ellas: se construye
                volumen con aseguradoras receptivas y se regresa con datos duros.
              </p>
              <a href="#contacto" className="inline-flex items-center gap-2 mt-8 font-bold text-[#9FE0CB] hover:text-white transition-colors">
                Conversemos sobre su institución <ArrowRight size={16} />
              </a>
            </div>
            <ol className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {FASES.map(({ n, titulo, texto }) => (
                <li key={n} className="rounded-2xl p-6 border border-white/10 bg-white/5">
                  <span className="text-sm font-bold text-[#9FE0CB]">{n}</span>
                  <h3 className="text-lg font-bold text-white mt-2 mb-2">{titulo}</h3>
                  <p className="text-sm text-white/70 leading-relaxed">{texto}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* ── SOLUCIONES POR SECTOR ── */}
      <section className="py-20 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <Etiqueta>Soluciones específicas</Etiqueta>
            <h2 className="text-3xl md:text-4xl font-bold mt-4">Adaptados a su sector</h2>
          </div>

          {SECTORES.map((s, i) => (
            <div key={s.id} id={s.id}
              className={`scroll-mt-20 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center ${i < SECTORES.length - 1 ? "mb-20 pb-20 border-b border-[#E5EAEE]" : ""}`}>
              <div className={i % 2 === 1 ? "lg:order-2" : ""}>
                <span className="inline-block text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-4"
                  style={{ background: NEUTRO, color: GRIS, border: "1px solid #E5EAEE" }}>{s.etiqueta}</span>
                <h3 className="text-2xl md:text-3xl font-bold mb-5">{s.titulo}</h3>
                <p className="leading-relaxed mb-7 text-[#334155]/80">{s.texto}</p>
                <a href="#contacto" className="inline-flex items-center gap-2 font-bold hover:underline" style={{ color: VERDE }}>
                  {s.cta} <ArrowRight size={16} />
                </a>
              </div>
              <div className={`p-6 sm:p-8 rounded-2xl border border-[#E5EAEE] ${i % 2 === 1 ? "lg:order-1" : ""}`} style={{ background: NEUTRO }}>
                <ul className="space-y-6">
                  {s.items.map(({ icon: Icon, titulo, texto }) => (
                    <li key={titulo} className="flex gap-4 items-start">
                      <div className="w-11 h-11 bg-white border border-[#E5EAEE] rounded-lg flex items-center justify-center shrink-0" style={{ color: VERDE }}>
                        <Icon size={19} />
                      </div>
                      <div>
                        <h4 className="font-bold">{titulo}</h4>
                        <p className="text-sm mt-0.5 text-[#334155]/75">{texto}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── EXPEDIENTE DE ALTA ── */}
      <section className="py-20 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="max-w-3xl mb-12">
            <Etiqueta>Expediente de alta</Etiqueta>
            <h2 className="text-3xl md:text-4xl font-bold mt-4 mb-4">Un expediente completo desde el primer envío</h2>
            <p className="text-[#334155]/80 leading-relaxed">
              Cada aseguradora revisa el paquete documental antes de cualquier evaluación técnica. Lo integramos y revisamos
              completo desde el inicio para no rehacer trámites al abrir cada red.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {EXPEDIENTE.map(({ icon: Icon, titulo, texto }) => (
              <div key={titulo} className="bg-white rounded-2xl p-6 border border-[#E5EAEE]">
                <Icon size={22} style={{ color: VERDE }} />
                <h3 className="font-bold mt-4 mb-2">{titulo}</h3>
                <p className="text-sm text-[#334155]/75 leading-relaxed">{texto}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CONTACTO CORPORATIVO ── */}
      <section id="contacto" className="py-20 md:py-24 scroll-mt-16" style={{ background: GRIS }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <Etiqueta light>Contacto corporativo</Etiqueta>
            <h2 className="text-3xl md:text-4xl font-bold text-white mt-4 mb-4">Solicite una propuesta estratégica</h2>
            <p className="text-white/75 max-w-2xl mx-auto">
              Cuéntenos sobre su institución. Un ejecutivo se pondrá en contacto para agendar una sesión diagnóstica.
            </p>
          </div>
          <div className="bg-white p-6 sm:p-10 rounded-2xl">
            <FormCorporativo />
          </div>
        </div>
      </section>

      {/* ── PACIENTES ── */}
      <section id="pacientes" className="py-20 md:py-24 scroll-mt-16" style={{ background: VERDE_CLARO }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <span className="inline-block bg-white text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full" style={{ color: VERDE }}>
              Pacientes
            </span>
            <h2 className="text-3xl md:text-4xl font-bold mt-4 mb-4">¿Buscas un especialista o una cirugía?</h2>
            <p className="max-w-2xl mx-auto text-[#334155]/80">
              Déjanos tus datos y te canalizamos con médicos y hospitales de nuestra red. Salud sin trámites para ti.
            </p>
          </div>

          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#0F6E56]/15">
            <FormPaciente codigoRef={codigoRef} />
          </div>

          <div className="mt-6 flex gap-3 p-4 rounded-xl bg-white/70 border border-[#0F6E56]/15 text-xs leading-relaxed">
            <Info size={16} className="shrink-0 mt-0.5" style={{ color: VERDE }} />
            <p>
              <strong>Importante:</strong> iHelp Médica no es una aseguradora ni un agente de seguros. No brindamos asesoría
              ni seguimiento sobre pólizas, y no ofrecemos descuentos, apoyos en deducible o coaseguro, ni exención de depósitos
              en garantía. Las condiciones de tu póliza las determina exclusivamente tu aseguradora.
            </p>
          </div>

          {testimonios.length > 0 && (
            <div className="mt-14">
              <h3 className="text-lg font-bold text-center mb-6">Lo que dicen de nosotros</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {testimonios.map(({ id, nombre, detalle, texto, estrellas }) => (
                  <figure key={id} className="bg-white p-5 rounded-xl border border-[#E5EAEE] flex flex-col">
                    <div className="mb-3 text-base" style={{ color: VERDE }} aria-label={`${estrellas} de 5`}>
                      {"★".repeat(estrellas)}{"☆".repeat(5 - estrellas)}
                    </div>
                    <blockquote className="text-sm italic flex-grow">&ldquo;{texto}&rdquo;</blockquote>
                    <figcaption className="border-t border-[#E5EAEE] pt-3 mt-4">
                      <p className="font-bold text-sm">{nombre}</p>
                      {detalle && <p className="text-xs" style={{ color: GRIS_MEDIO }}>{detalle}</p>}
                    </figcaption>
                  </figure>
                ))}
              </div>
            </div>
          )}

          <div className="mt-14 space-y-3">
            <h3 className="text-lg font-bold text-center mb-5">Preguntas frecuentes</h3>
            {FAQS.map(({ q, a }) => (
              <details key={q} className="bg-white p-4 rounded-xl border border-[#E5EAEE] group">
                <summary className="flex justify-between items-center cursor-pointer font-medium list-none">
                  <span>{q}</span>
                  <ChevronDown size={16} style={{ color: VERDE }} className="transition-transform group-open:rotate-180 shrink-0 ml-2" />
                </summary>
                <p className="mt-3 text-sm text-[#334155]/80 leading-relaxed">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="mt-auto" style={{ background: GRIS }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2.5 mb-4">
                <Sello size={34} />
                <Wordmark dark className="text-lg" />
              </div>
              <p className="text-sm italic text-white/80 border-l-2 pl-3 mb-4" style={{ borderColor: VERDE }}>
                Que el trámite no detenga la atención.
              </p>
              <p className="text-sm max-w-md text-white/60">
                Administrador tercero (TPA) para hospitales, aseguradoras y empresas: gestión de convenios,
                administración de casos, dictamen central y desarrollo comercial.
              </p>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4 text-xs uppercase tracking-wider">Navegación</h4>
              <ul className="space-y-2 text-sm text-white/60">
                {NAV.map((n) => <li key={n.href}><a href={n.href} className="hover:text-white">{n.label}</a></li>)}
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4 text-xs uppercase tracking-wider">Contacto</h4>
              <ul className="space-y-2.5 text-sm text-white/60">
                <li className="flex items-center gap-2"><Mail size={14} style={{ color: "#5FC3A5" }} />
                  <a href="mailto:anarvaez@ihelpmedica.mx" className="hover:text-white break-all">anarvaez@ihelpmedica.mx</a></li>
                <li className="flex items-center gap-2"><Phone size={14} style={{ color: "#5FC3A5" }} />
                  <a href="tel:+528341262456" className="hover:text-white">(834) 126-2456</a></li>
                <li className="flex items-center gap-2"><Globe size={14} style={{ color: "#5FC3A5" }} /> ihelpmedica.mx</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 text-xs text-white/50 flex flex-col md:flex-row md:justify-between gap-3">
            <p>© {new Date().getFullYear()} iHelp Médica. Todos los derechos reservados.</p>
            <p>iHelp Médica no es una aseguradora ni un agente de seguros.</p>
            <div className="flex gap-4">
              <Link href="/privacidad" className="hover:text-white">Aviso de Privacidad</Link>
              <Link href="/terminos" className="hover:text-white">Términos y Condiciones</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
