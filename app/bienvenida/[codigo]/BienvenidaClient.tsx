"use client"
import { useRef, useState } from "react"
import QRCode from "react-qr-code"
import Link from "next/link"

const VERDE       = "#0F6E56"
const VERDE_LIGHT = "#E1F5EE"
const APP_URL     = process.env.NEXT_PUBLIC_APP_URL ?? "https://ihelpmedica.mx"

const SHARE_MSG = (link: string) =>
  `¿Tienes seguro de Gastos Médicos Mayores y necesitas una cirugía? Con iHelp Medica verificamos tu cobertura sin costo y coordinamos todo con tu aseguradora. Sin depósito para el paciente. Regístrate gratis aquí: ${link}`

type Social = { name: string; color: string; href: (link: string) => string; copyText?: boolean }

const SOCIALS: Social[] = [
  {
    name: "WhatsApp",
    color: "#25D366",
    href: (link) => `https://wa.me/?text=${encodeURIComponent(SHARE_MSG(link))}`,
  },
  {
    name: "Facebook",
    color: "#1877F2",
    href: (link) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`,
  },
  {
    name: "LinkedIn",
    color: "#0A66C2",
    href: (link) =>
      `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(link)}&summary=${encodeURIComponent(SHARE_MSG(link))}`,
  },
  {
    name: "X / Twitter",
    color: "#000000",
    href: (link) =>
      `https://x.com/intent/tweet?text=${encodeURIComponent("¿Tienes seguro GMM y necesitas una cirugía? Verifica tu cobertura gratis con iHelp Medica 👇")}&url=${encodeURIComponent(link)}`,
  },
  {
    name: "Instagram",
    color: "#E1306C",
    href: () => "",
    copyText: true,
  },
]

// Iconos SVG de redes sociales
function SocialIcon({ name }: { name: string }) {
  if (name === "WhatsApp") return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.524 3.655 1.435 5.16L2 22l4.978-1.31A9.963 9.963 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm4.93 13.438c-.21.588-1.218 1.126-1.686 1.18-.44.053-.994.075-1.604-.104-.369-.11-.842-.257-1.444-.504-2.532-1.082-4.19-3.63-4.315-3.8-.123-.168-1.006-1.34-1.006-2.558 0-1.218.639-1.818.866-2.07.228-.25.495-.312.66-.312l.474.009c.152.007.356-.058.557.425l.77 1.924c.065.161.108.352.01.555-.097.203-.145.33-.29.506-.145.177-.304.393-.433.529-.144.15-.295.313-.127.612.168.299.752 1.238 1.61 2.004.878.783 1.62 1.027 1.848 1.146.228.118.36.097.49-.058.13-.157.552-.644.7-.865.147-.222.295-.185.497-.111.201.074 1.278.603 1.497.713.22.11.365.167.418.26.053.092.053.54-.157 1.064z"/>
    </svg>
  )
  if (name === "Facebook") return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073C24 5.404 18.627 0 12 0S0 5.404 0 12.073c0 6.025 4.388 11.016 10.125 11.927v-8.437H7.078v-3.49h3.047V9.43c0-3.007 1.792-4.668 4.533-4.668 1.312 0 2.686.234 2.686.234v2.953H15.83c-1.491 0-1.956.926-1.956 1.874v2.25h3.328l-.532 3.49h-2.796v8.437C19.612 23.09 24 18.098 24 12.073z"/>
    </svg>
  )
  if (name === "LinkedIn") return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  )
  if (name === "X / Twitter") return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  )
  if (name === "Instagram") return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
    </svg>
  )
  return null
}

const PASOS = [
  {
    n: "1",
    titulo: "Comparte tu link o QR",
    desc: "Mándalo por WhatsApp, ponlo en tus historias de Instagram o imprime el QR para consultorios, farmacias y centros de diagnóstico.",
  },
  {
    n: "2",
    titulo: "El paciente llena el formulario",
    desc: "En menos de 2 minutos captura su nombre, teléfono, aseguradora y el procedimiento que necesita. Sin complicaciones.",
  },
  {
    n: "3",
    titulo: "Nuestro equipo gestiona todo",
    desc: "Verificamos su póliza GMM, conseguimos la carta de autorización con la aseguradora y coordinamos el ingreso hospitalario sin depósito.",
  },
  {
    n: "4",
    titulo: "Procedimiento confirmado = comisión tuya",
    desc: "Una vez que el caso se confirma, se registra tu comisión. Te avisamos y recibirás tu pago. Sin intermediarios.",
  },
]

const TIPS = [
  { emoji: "💬", titulo: "WhatsApp / Grupos",    desc: "Comparte el link en chats personales y grupos de amigos, familia, compañeros de trabajo o comunidades de salud." },
  { emoji: "📱", titulo: "Historias / Reels",     desc: "Sube tu QR como imagen en Instagram, Facebook o TikTok. Agrega el link en tu bio para que lleguen directamente." },
  { emoji: "🖨️", titulo: "QR físico",              desc: "Imprime tu tarjeta y déjala en consultorios, laboratorios, ópticas, farmacias y hospitales." },
  { emoji: "🔁", titulo: "Referidos directos",    desc: "Cuando alguien te cuente que tiene seguro y necesita cirugía, mándale tu link de inmediato." },
]

const PREGUNTAS = [
  {
    q: "¿Cuándo me pagan la comisión?",
    a: "Cuando el procedimiento se confirma (etapa 'Ganado' en el sistema). El equipo de iHelp Medica aprueba la comisión y te notifica para coordinarte.",
  },
  {
    q: "¿Hay límite de cuántos pacientes puedo referir?",
    a: "No. Puedes referir a todas las personas que quieras. Cada conversión genera una comisión independiente.",
  },
  {
    q: "¿Qué hago si alguien me dice que no tiene seguro?",
    a: "No te preocupes. iHelp Medica trabaja con pacientes que ya tienen Seguro de Gastos Médicos Mayores (GMM). Si no tienen, simplemente no aplica por ahora.",
  },
  {
    q: "¿Cómo sé si alguien usó mi link?",
    a: "Cada lead que llega con tu código queda registrado en el sistema. Tu coordinador de iHelp Medica puede informarte el estado de tus referidos.",
  },
]

export default function BienvenidaClient({
  nombre, apellido, codigo, nivelNombre, nivelMonto,
}: {
  nombre: string; apellido: string; codigo: string
  nivelNombre: string | null; nivelMonto: number | null
}) {
  const link       = `${APP_URL}/r/${codigo}`
  const qrDownload = `${APP_URL}/api/qr/${codigo}?download=1`
  const cardRef    = useRef<HTMLDivElement>(null)
  const [copied, setCopied] = useState(false)

  function handlePrint() { window.print() }

  function copyInstagram() {
    navigator.clipboard.writeText(SHARE_MSG(link))
    setCopied(true)
    setTimeout(() => setCopied(false), 3000)
  }

  return (
    <div className="min-h-screen" style={{ background: "#F0F4F8", fontFamily: "Arial, sans-serif" }}>

      {/* ── PRINT STYLES (solo visible al imprimir) ── */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-card {
            width: 85mm !important; height: 54mm !important;
            page-break-after: always;
            box-shadow: none !important;
            border: 1px solid #ccc !important;
          }
          body { background: white !important; }
          .print-manual { page-break-before: always; }
        }
        @media screen {
          .print-card { max-width: 420px; }
        }
      `}</style>

      {/* ── NAVBAR ── */}
      <nav className="no-print sticky top-0 z-50 bg-white border-b shadow-sm" style={{ borderColor: "#E5E7EB" }}>
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold"
              style={{ background: VERDE }}>+</div>
            <span className="font-bold" style={{ color: "#111827" }}>iHelp Medica</span>
          </Link>
          <span className="text-xs font-semibold px-3 py-1 rounded-full"
            style={{ background: VERDE_LIGHT, color: VERDE }}>
            Kit de Asesor
          </span>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-10 space-y-12">

        {/* ── BIENVENIDA ── */}
        <div className="no-print text-center">
          <h1 className="text-2xl font-bold mb-2" style={{ color: "#111827" }}>
            ¡Hola, {nombre} {apellido}!
          </h1>
          <p className="text-base" style={{ color: "#6B7280" }}>
            Aquí tienes tu kit completo de asesor iHelp Medica.
          </p>
          {nivelNombre && nivelMonto && (
            <div className="inline-flex items-center gap-2 mt-3 px-4 py-2 rounded-full text-sm font-semibold"
              style={{ background: VERDE_LIGHT, color: VERDE }}>
              Nivel {nivelNombre} · ${nivelMonto.toLocaleString("es-MX")} MXN por conversión
            </div>
          )}
        </div>

        {/* ── ACCESO AL PORTAL ── */}
        <div className="no-print rounded-2xl border-2 p-6" style={{ borderColor: VERDE, background: VERDE_LIGHT }}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: VERDE }}>
                Tu portal de seguimiento
              </p>
              <p className="text-lg font-bold" style={{ color: "#111827" }}>
                ihelpmedica.mx/portal/login
              </p>
              <p className="text-sm mt-1" style={{ color: "#374151" }}>
                Ve tus leads, el estado de cada caso y tus comisiones en tiempo real.
              </p>
            </div>
            <a href="/portal/login"
              className="shrink-0 inline-flex items-center justify-center px-6 py-3 rounded-xl text-sm font-bold text-white shadow-md"
              style={{ background: VERDE, minWidth: 160 }}>
              Entrar a mi panel →
            </a>
          </div>
        </div>

        {/* ── TARJETA (imprimible) ── */}
        <section>
          <h2 className="no-print text-base font-bold mb-4" style={{ color: "#374151" }}>
            Tu tarjeta de asesor
          </h2>

          <div ref={cardRef} className="print-card mx-auto rounded-2xl overflow-hidden shadow-lg"
            style={{ background: "white", border: `1px solid ${VERDE}22` }}>
            {/* Card header */}
            <div className="px-6 pt-6 pb-4 flex items-center justify-between"
              style={{ background: VERDE }}>
              <div>
                <p className="text-xs font-semibold mb-0.5" style={{ color: "rgba(255,255,255,.7)" }}>
                  Asesor certificado
                </p>
                <p className="text-white font-bold text-lg leading-tight">
                  {nombre} {apellido}
                </p>
                {nivelNombre && (
                  <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,.8)" }}>
                    Nivel {nivelNombre}
                  </p>
                )}
              </div>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xl"
                style={{ background: "rgba(255,255,255,.2)", color: "white" }}>+</div>
            </div>

            {/* Card body */}
            <div className="px-6 py-4 flex items-center gap-6">
              {/* QR */}
              <div className="p-2 rounded-xl border flex-shrink-0"
                style={{ borderColor: `${VERDE}22`, background: "white" }}>
                <QRCode value={link} size={88} fgColor={VERDE} bgColor="white" />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-xs mb-1" style={{ color: "#9CA3AF" }}>Código único</p>
                <p className="font-mono font-bold text-lg mb-3" style={{ color: VERDE }}>
                  {codigo}
                </p>
                <p className="text-xs mb-1" style={{ color: "#9CA3AF" }}>Tu link personal</p>
                <p className="text-xs font-medium break-all" style={{ color: "#374151" }}>
                  {link}
                </p>
              </div>
            </div>

            {/* Card footer */}
            <div className="px-6 py-3 border-t" style={{ borderColor: "#F3F4F6" }}>
              <p className="text-xs text-center" style={{ color: "#9CA3AF" }}>
                ihelpmedica.mx · Gestión de cirugías con seguro GMM · Sin costo para el paciente
              </p>
            </div>
          </div>

          {/* Botones de descarga */}
          <div className="no-print flex flex-wrap justify-center gap-3 mt-5">
            <a href={qrDownload}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white shadow-sm"
              style={{ background: VERDE }}>
              ↓ Descargar QR (PNG)
            </a>
            <button onClick={handlePrint}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border"
              style={{ color: VERDE, borderColor: VERDE, background: "white" }}>
              🖨️ Imprimir tarjeta
            </button>
          </div>
        </section>

        {/* ── COMPARTIR EN REDES ── */}
        <section className="no-print">
          <h2 className="text-base font-bold mb-4" style={{ color: "#374151" }}>
            Comparte en redes sociales
          </h2>
          <p className="text-sm mb-4" style={{ color: "#6B7280" }}>
            Haz clic en la red que quieras — el texto y tu link ya van incluidos.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {SOCIALS.map(({ name, color, href, copyText }) =>
              copyText ? (
                <button
                  key={name}
                  onClick={copyInstagram}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 active:opacity-75"
                  style={{ background: color }}>
                  <SocialIcon name={name} />
                  {copied ? "¡Copiado!" : name}
                </button>
              ) : (
                <a
                  key={name}
                  href={href(link)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
                  style={{ background: color }}>
                  <SocialIcon name={name} />
                  {name}
                </a>
              )
            )}
          </div>

          <p className="text-xs mt-3" style={{ color: "#9CA3AF" }}>
            Instagram: el botón copia el texto listo para pegar en tu publicación o historia.
            Para compartir también el QR, descárgalo arriba y adjúntalo a tu post.
          </p>
        </section>

        {/* ── CÓMO FUNCIONA ── */}
        <section className="print-manual">
          <h2 className="text-xl font-bold mb-6" style={{ color: "#111827" }}>
            ¿Cómo funciona?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {PASOS.map(({ n, titulo, desc }) => (
              <div key={n} className="p-5 rounded-xl border bg-white"
                style={{ borderColor: "#E5E7EB" }}>
                <div className="w-9 h-9 rounded-full text-white font-bold text-sm flex items-center justify-center mb-3"
                  style={{ background: VERDE }}>{n}</div>
                <p className="font-bold text-sm mb-1" style={{ color: "#111827" }}>{titulo}</p>
                <p className="text-sm" style={{ color: "#6B7280", lineHeight: 1.6 }}>{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── TIPS DE DISTRIBUCIÓN ── */}
        <section>
          <h2 className="text-xl font-bold mb-6" style={{ color: "#111827" }}>
            Cómo distribuir tu link
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {TIPS.map(({ emoji, titulo, desc }) => (
              <div key={titulo} className="p-5 rounded-xl border bg-white flex gap-4"
                style={{ borderColor: "#E5E7EB" }}>
                <span className="text-2xl flex-shrink-0">{emoji}</span>
                <div>
                  <p className="font-bold text-sm mb-1" style={{ color: "#111827" }}>{titulo}</p>
                  <p className="text-sm" style={{ color: "#6B7280", lineHeight: 1.6 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Ejemplo de mensaje */}
          <div className="mt-4 p-5 rounded-xl border" style={{ background: "#FFFBEB", borderColor: "#FDE68A" }}>
            <p className="text-sm font-bold mb-2" style={{ color: "#92400E" }}>
              💬 Mensaje sugerido para WhatsApp:
            </p>
            <p className="text-sm italic" style={{ color: "#78350F", lineHeight: 1.6 }}>
              "¿Tienes seguro de gastos médicos y necesitas una cirugía? Con iHelp Medica puedes
              entrar al hospital sin dejar depósito y que tu seguro pague directo. Sin costo para ti.
              Llena el formulario aquí: <strong>{link}</strong>"
            </p>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section>
          <h2 className="text-xl font-bold mb-6" style={{ color: "#111827" }}>
            Preguntas frecuentes
          </h2>
          <div className="space-y-3">
            {PREGUNTAS.map(({ q, a }) => (
              <details key={q} className="bg-white p-5 rounded-xl border group"
                style={{ borderColor: "#E5E7EB" }}>
                <summary className="font-semibold text-sm cursor-pointer list-none flex justify-between items-center"
                  style={{ color: "#111827" }}>
                  {q}
                  <span className="ml-2 flex-shrink-0 text-lg transition-transform group-open:rotate-45"
                    style={{ color: VERDE }}>+</span>
                </summary>
                <p className="mt-3 text-sm" style={{ color: "#6B7280", lineHeight: 1.6 }}>{a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* ── CTA FINAL ── */}
        <div className="no-print rounded-2xl p-6 text-center"
          style={{ background: VERDE }}>
          <p className="text-lg font-bold text-white mb-1">¿Listo para empezar?</p>
          <p className="text-sm mb-4" style={{ color: "rgba(255,255,255,.8)" }}>
            Entra a tu panel, copia tu link y empieza a compartirlo.
          </p>
          <a href="/portal/login"
            className="inline-flex items-center justify-center px-8 py-3 rounded-xl text-sm font-bold"
            style={{ background: "white", color: VERDE }}>
            Entrar a mi panel →
          </a>
        </div>

        {/* ── CONTACTO ── */}
        <section className="text-center pb-8">
          <div className="inline-block p-6 rounded-2xl border bg-white"
            style={{ borderColor: "#E5E7EB" }}>
            <p className="font-bold text-sm mb-1" style={{ color: "#111827" }}>¿Tienes dudas?</p>
            <p className="text-sm" style={{ color: "#6B7280" }}>
              Escríbenos a{" "}
              <a href="mailto:hola@ihelpmedica.mx" style={{ color: VERDE, fontWeight: 600 }}>
                hola@ihelpmedica.mx
              </a>
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}
