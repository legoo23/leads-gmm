import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Sidebar from "@/components/ui/sidebar"
import Topbar from "@/components/ui/topbar"

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("rol, nombre")
    .eq("id", user.id)
    .single()

  return (
    <div className="flex h-full">
      <Sidebar rol={profile?.rol ?? "agente"} />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar user={{ email: user.email ?? "", nombre: profile?.nombre ?? "", rol: profile?.rol ?? "agente" }} />
        <main className="flex-1 overflow-y-auto p-6" style={{ background: "var(--bg)" }}>
          {children}
        </main>
      </div>
    </div>
  )
}
