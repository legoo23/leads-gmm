"use client"
import { Suspense, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"

function PortalLoginForm() {
  const [email, setEmail]       = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState("")
  const router  = useRouter()
  const params  = useSearchParams()
  const callbackError = params.get("error")
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError("Credenciales incorrectas. Verifica tu correo y contraseña.")
      setLoading(false)
      return
    }
    router.push("/mi-panel")
    router.refresh()
  }

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
        Ingresa con el correo y contraseña que creaste al activar tu cuenta.
      </p>

      <form onSubmit={handleLogin} className="space-y-4">
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

        <div>
          <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide"
            style={{ color: "var(--muted)" }}>
            Contraseña
          </label>
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
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
          {loading ? "Ingresando..." : "Entrar a mi panel"}
        </button>

        <div className="text-center">
          <Link href="/auth/forgot-password"
            className="text-xs transition-colors"
            style={{ color: "var(--muted)" }}>
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
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
