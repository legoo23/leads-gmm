import { createClient, createServiceClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { LayoutDashboard, LogOut } from "lucide-react"

export default async function VendedorLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/portal/login")

  const svc = createServiceClient()
  let nombreVendedor = user.email ?? ""

  // Buscar el perfil del usuario
  const { data: profile } = await svc
    .from("user_profiles")
    .select("rol, nombre")
    .eq("id", user.id)
    .single()

  if (profile) {
    if (profile.rol !== "vendedor") redirect("/leads")
    nombreVendedor = profile.nombre ?? nombreVendedor
  } else {
    // Primer login OTP — crear user_profiles si el email está en la tabla vendedores
    const email = (user.email ?? "").toLowerCase()
    const { data: vendedor } = await svc
      .from("vendedores")
      .select("nombre, activo")
      .ilike("email", email)
      .maybeSingle()

    if (vendedor?.activo) {
      await svc.from("user_profiles").insert({
        id:     user.id,
        rol:    "vendedor",
        nombre: vendedor.nombre,
      })
      nombreVendedor = vendedor.nombre
    } else {
      redirect(
        "/portal/login?error=" +
        encodeURIComponent("Tu correo no está registrado como asesor. Contacta al administrador.")
      )
    }
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <header className="h-14 px-6 flex items-center justify-between border-b"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "var(--accent)" }}>
            <LayoutDashboard size={14} color="white" />
          </div>
          <span className="font-bold text-sm" style={{ color: "var(--text)" }}>iHelp Medica</span>
          <span className="text-xs ml-2 px-2 py-0.5 rounded-full" style={{ background: "var(--accent-bg)", color: "var(--accent)" }}>
            Portal asesor
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium" style={{ color: "var(--muted)" }}>
            {nombreVendedor}
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
