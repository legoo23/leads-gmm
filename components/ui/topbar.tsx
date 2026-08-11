"use client"
import { useState } from "react"
import { LogOut, ChevronDown } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface TopbarProps {
  user: { email: string; nombre: string; rol: string }
}

export default function Topbar({ user }: TopbarProps) {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  const initials = user.nombre
    ? user.nombre.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : user.email[0].toUpperCase()

  return (
    <header className="flex items-center justify-end h-14 px-6 border-b flex-shrink-0"
      style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
      <div className="relative">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors hover:bg-[var(--surface-2)]"
        >
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
            style={{ background: "var(--accent)" }}>
            {initials}
          </div>
          <span className="text-sm font-medium" style={{ color: "var(--text)" }}>
            {user.nombre || user.email}
          </span>
          <ChevronDown size={13} style={{ color: "var(--muted)" }} />
        </button>

        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <div className="absolute right-0 top-full mt-1.5 w-52 rounded-xl z-20 overflow-hidden"
              style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow)" }}>
              <div className="px-4 py-3 border-b" style={{ borderColor: "var(--border)" }}>
                <div className="text-xs font-semibold" style={{ color: "var(--text)" }}>
                  {user.nombre || user.email}
                </div>
                <div className="text-xs mt-0.5 uppercase tracking-wide" style={{ color: "var(--subtle)" }}>
                  {user.rol}
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 w-full px-4 py-2.5 text-sm transition-colors hover:bg-[var(--surface-2)]"
                style={{ color: "var(--negative)" }}
              >
                <LogOut size={14} />
                Cerrar sesión
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  )
}
