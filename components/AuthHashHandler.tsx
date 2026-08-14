"use client"
import { useEffect } from "react"
import { useRouter } from "next/navigation"

// Lee el hash #error=... que Supabase inyecta en la URL cuando falla un enlace
// de auth (invite expirado, link ya usado, etc.) y redirige con un mensaje legible.
export default function AuthHashHandler() {
  const router = useRouter()

  useEffect(() => {
    const hash = window.location.hash
    if (!hash || !hash.includes("error=")) return

    const params = new URLSearchParams(hash.slice(1))
    const errorCode = params.get("error_code")

    window.history.replaceState(null, "", window.location.pathname + window.location.search)

    const msg =
      errorCode === "otp_expired"
        ? "El enlace de activación expiró. Pide al administrador que reenvíe la invitación."
        : errorCode === "access_denied"
        ? "El enlace ya fue usado o no es válido. Solicita uno nuevo."
        : "Enlace inválido. Contacta al administrador."

    router.replace(`/portal/login?error=${encodeURIComponent(msg)}`)
  }, [router])

  return null
}
