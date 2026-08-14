"use client"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export default function UpdatePasswordPage() {
  const [password, setPassword]   = useState("")
  const [confirm, setConfirm]     = useState("")
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState("")
  const [success, setSuccess]     = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    if (password.length < 8) { setError("La contraseña debe tener al menos 8 caracteres."); return }
    if (password !== confirm) { setError("Las contraseñas no coinciden."); return }
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setError(error.message.includes("expired") || error.message.includes("invalid")
        ? "Tu enlace expiró. Solicita uno nuevo desde la pantalla de acceso."
        : "Ocurrió un error al guardar la contraseña. Intenta de nuevo.")
      setLoading(false)
      return
    }
    setSuccess(true)
    // Detectar rol para redirigir al destino correcto
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    let destination = "/leads"
    if (currentUser) {
      const { data: profile } = await supabase
        .from("user_profiles").select("rol").eq("id", currentUser.id).single()
      if (profile?.rol === "vendedor") destination = "/mi-panel"
    }
    setTimeout(() => router.push(destination), 2000)
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
          {success ? (
            <div className="text-center space-y-3 py-2">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto"
                style={{ background: "#ECFDF5" }}>
                <svg width="24" height="24" fill="none" stroke="#059669" strokeWidth="2" viewBox="0 0 24 24">
                  <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h2 className="text-base font-semibold" style={{ color: "var(--text)" }}>Contraseña establecida</h2>
              <p className="text-xs" style={{ color: "var(--muted)" }}>Redirigiendo al sistema...</p>
            </div>
          ) : (
            <>
              <h2 className="text-base font-semibold mb-1" style={{ color: "var(--text)" }}>
                Establece tu contraseña
              </h2>
              <p className="text-xs mb-6" style={{ color: "var(--muted)" }}>
                Crea una contraseña segura para acceder al sistema.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide"
                    style={{ color: "var(--muted)" }}>
                    Nueva contraseña
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
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
                    Confirmar contraseña
                  </label>
                  <input
                    type="password"
                    required
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Repite tu contraseña"
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
                  {loading ? "Guardando..." : "Guardar contraseña"}
                </button>
              </form>
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
