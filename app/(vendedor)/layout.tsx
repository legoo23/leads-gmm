import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { LayoutDashboard, LogOut } from "lucide-react"

export default async function VendedorLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/portal/login")

  // Verify this user is a vendor
  const { data: profile } = await supabase.from("user_profiles").select("rol, nombre").eq("id", user.id).single()
  if (profile?.rol !== "vendedor") redirect("/leads")

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <header className="h-14 px-6 flex items-center justify-between border-b"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "var(--accent)" }}>
            <LayoutDashboard size={14} color="white" />
          </div>
          <span className="font-bold text-sm" style={{ color: "var(--text)" }}>Leads GMM</span>
          <span className="text-xs ml-2 px-2 py-0.5 rounded-full" style={{ background: "var(--accent-bg)", color: "var(--accent)" }}>
            Portal vendedor
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium" style={{ color: "var(--muted)" }}>
            {profile?.nombre ?? user.email}
          </span>
          <form action="/api/auth/signout" method="POST">
            <button className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors hover:bg-[var(--surface-2)]"
              style={{ color: "var(--muted)" }}>
              <LogOut size={13} />
            </button>
          </form>
        </div>
      </header>
      <main className="max-w-5xl mx-auto p-6">
        {children}
      </main>
    </div>
  )
}
