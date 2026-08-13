"use client"
import { useRef } from "react"
import QRCode from "react-qr-code"
import Link from "next/link"

const VERDE      = "#0F6E56"
const VERDE_LIGHT = "#E1F5EE"
const APP_URL    = process.env.NEXT_PUBLIC_APP_URL ?? "https://ihelpmedica.mx"

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

  function handlePrint() {
    window.print()
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
