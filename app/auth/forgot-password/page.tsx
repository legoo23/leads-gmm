"use client"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"

export default function ForgotPasswordPage() {
  const [email, setEmail]     = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent]       = useState(false)
  const [error, setError]     = useState("")
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    const redirectTo = `${window.location.origin}/auth/callback?next=/auth/update-password`
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), { redirectTo })
    if (error) {
      setError("Ocurrió un error al enviar el correo. Verifica la dirección e intenta de nuevo.")
      setLoading(false)
      return
    }
    setSent(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
      <div className="w-full max-w-sm">
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

        <div className="rounded-2xl p-8" style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          boxShadow: "var(--shadow)"
        }}>
          {sent ? (
            <div className="text-center space-y-3 py-2">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto"
                style={{ background: "#EFF6FF" }}>
                <svg width="22" height="22" fill="none" stroke="#2563EB" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-base font-semibold" style={{ color: "var(--text)" }}>Correo enviado</h2>
              <p className="text-xs leading-relaxed" style={{ color: "var(--muted)" }}>
                Revisa tu bandeja de entrada (y la carpeta de spam). El enlace para restablecer tu contraseña
                es válido por 24 horas.
              </p>
              <Link href="/login"
                className="inline-flex text-xs font-semibold mt-2"
                style={{ color: "var(--accent)" }}>
                Volver al inicio de sesión →
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-base font-semibold mb-1" style={{ color: "var(--text)" }}>
                Restablecer contraseña
              </h2>
              <p className="text-xs mb-6" style={{ color: "var(--muted)" }}>
                Ingresa tu correo y te enviaremos un enlace para crear una nueva contraseña.
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

                {error && (
                  <div className="rounded-lg px-3 py-2.5 text-sm" style={{
                    background: "var(--negative-bg)",
                    border: "1px solid rgba(220,38,38,.2)",
                    color: "var(--negative)"
                  }}>
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-lg py-2.5 text-sm font-semibold text-white transition-opacity disabled:opacity-60"
                  style={{ background: "var(--accent)" }}
                >
                  {loading ? "Enviando..." : "Enviar enlace"}
                </button>
              </form>

              <div className="mt-4 text-center">
                <Link href="/login" className="text-xs" style={{ color: "var(--muted)" }}>
                  ← Volver al inicio de sesión
                </Link>
              </div>
            </>
          )}
        </div>

        <p className="text-center text-xs mt-6" style={{ color: "var(--subtle)" }}>
          © 2026 Alejandro Legorreta Barrera
        </p>
      </div>
    </div>
  )
}
