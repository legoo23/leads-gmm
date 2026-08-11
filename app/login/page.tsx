"use client"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const params = useSearchParams()
  const callbackError = params.get("error")
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError("Credenciales incorrectas. Verifica tu email y contraseña.")
      setLoading(false)
      return
    }
    router.push("/leads")
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
      <div className="w-full max-w-sm">
        {/* Logo / identidad */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-4"
            style={{ background: "var(--accent)", boxShadow: "0 4px 14px rgba(37,99,235,.35)" }}>
            <svg width="24" height="24" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold" style={{ color: "var(--text)" }}>Leads GMM</h1>
          <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>Gestión de procedimientos quirúrgicos</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-8" style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          boxShadow: "var(--shadow)"
        }}>
          <h2 className="text-base font-semibold mb-6" style={{ color: "var(--text)" }}>Iniciar sesión</h2>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide"
                style={{ color: "var(--muted)" }}>
                Correo electrónico
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@correo.com"
                className="w-full rounded-lg px-3 py-2.5 text-sm transition-colors"
                style={{
                  background: "var(--surface-2)",
                  border: "1px solid var(--border)",
                  color: "var(--text)",
                  outline: "none"
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg px-3 py-2.5 text-sm transition-colors"
                style={{
                  background: "var(--surface-2)",
                  border: "1px solid var(--border)",
                  color: "var(--text)",
                  outline: "none"
                }}
              />
            </div>

            {(error || callbackError) && (
              <div className="rounded-lg px-3 py-2.5 text-sm" style={{
                background: "var(--negative-bg)",
                border: "1px solid rgba(220,38,38,.2)",
                color: "var(--negative)"
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
              {loading ? "Ingresando..." : "Entrar"}
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

        <p className="text-center text-xs mt-6" style={{ color: "var(--subtle)" }}>
          © 2026 Alejandro Legorreta Barrera
        </p>
      </div>
    </div>
  )
}
