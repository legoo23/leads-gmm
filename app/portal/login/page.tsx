"use client"
import { Suspense, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useSearchParams } from "next/navigation"

function PortalLoginForm() {
  const [email, setEmail]     = useState("")
  const [sent, setSent]       = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState("")
  const params        = useSearchParams()
  const callbackError = params.get("error")
  const supabase      = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/mi-panel`,
        shouldCreateUser: true,
      },
    })
    if (error) {
      setError("No se pudo enviar el enlace. Verifica tu correo e intenta de nuevo.")
      setLoading(false)
      return
    }
    setSent(true)
    setLoading(false)
  }

  // ── Pantalla de confirmación ───────────────────────────────────────────────
  if (sent) {
    return (
      <div className="rounded-2xl p-8 text-center space-y-5" style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        boxShadow: "var(--shadow)",
      }}>
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
          style={{ background: "#ECFDF5", border: "2px solid #A7F3D0" }}>
          <svg width="28" height="28" fill="none" stroke="#059669" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>

        <div>
          <h2 className="text-base font-bold mb-1" style={{ color: "var(--text)" }}>
            Revisa tu correo
          </h2>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            Enviamos un enlace de acceso a
          </p>
          <p className="text-sm font-semibold mt-0.5" style={{ color: "var(--text)" }}>
            {email}
          </p>
        </div>

        <div className="rounded-xl p-3 text-xs leading-relaxed text-left"
          style={{ background: "var(--surface-2)", color: "var(--muted)" }}>
          <p className="font-semibold mb-1" style={{ color: "var(--text)" }}>Pasos:</p>
          <p>1. Abre el correo de <strong>iHelp Medica</strong></p>
          <p>2. Haz clic en <strong>"Entrar a mi panel"</strong></p>
          <p>3. Listo — acceso automático, sin contraseña</p>
          <p className="mt-2" style={{ color: "var(--subtle)" }}>¿No lo ves? Revisa la carpeta de spam o correo no deseado.</p>
        </div>

        <button
          onClick={() => { setSent(false); setError("") }}
          className="text-xs transition-colors"
          style={{ color: "var(--muted)" }}>
          Usar otro correo
        </button>
      </div>
    )
  }

  // ── Formulario ─────────────────────────────────────────────────────────────
  return (
    <div className="rounded-2xl p-8" style={{
      background: "var(--surface)",
      border: "1px solid var(--border)",
      boxShadow: "var(--shadow)",
    }}>
      <h2 className="text-base font-semibold mb-1" style={{ color: "var(--text)" }}>
        Acceso de asesores
      </h2>
      <p className="text-xs mb-6" style={{ color: "var(--muted)" }}>
        Ingresa tu correo y te enviaremos un enlace de acceso directo. Sin contraseña.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide"
            style={{ color: "var(--muted)" }}>
            Correo electrónico
          </label>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@correo.com"
            className="w-full rounded-lg px-3 py-2.5 text-sm transition-colors"
            style={{
              background: "var(--surface-2)",
              border: "1px solid var(--border)",
              color: "var(--text)",
              outline: "none",
            }}
          />
        </div>

        {(error || callbackError) && (
          <div className="rounded-lg px-3 py-2.5 text-sm" style={{
            background: "var(--negative-bg)",
            border: "1px solid rgba(220,38,38,.2)",
            color: "var(--negative)",
          }}>
            {error || callbackError}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg py-2.5 text-sm font-semibold text-white transition-opacity disabled:opacity-60"
          style={{ background: "var(--accent)" }}
        >
          {loading ? "Enviando enlace..." : "Enviar enlace de acceso →"}
        </button>
      </form>
    </div>
  )
}

export default function PortalLoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
      <div className="w-full max-w-sm px-4">

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-4"
            style={{ background: "#0F6E56", boxShadow: "0 4px 14px rgba(15,110,86,.35)" }}>
            <svg width="22" height="22" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold" style={{ color: "var(--text)" }}>iHelp Medica</h1>
          <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>Portal de Asesores</p>
        </div>

        <Suspense fallback={
          <div className="rounded-2xl p-8" style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            boxShadow: "var(--shadow)",
          }}>
            <div className="h-52 animate-pulse rounded-lg" style={{ background: "var(--surface-2)" }} />
          </div>
        }>
          <PortalLoginForm />
        </Suspense>

        <p className="text-center text-xs mt-6" style={{ color: "var(--subtle)" }}>
          © 2026 iHelp Medica · Todos los derechos reservados
        </p>
      </div>
    </div>
  )
}
