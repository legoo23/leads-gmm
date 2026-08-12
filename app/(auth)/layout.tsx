import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import ShellClient from "@/components/ui/shell-client"

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
    <ShellClient
      user={{ email: user.email ?? "", nombre: profile?.nombre ?? "", rol: profile?.rol ?? "agente" }}
      rol={profile?.rol ?? "agente"}
    >
      {children}
    </ShellClient>
  )
}
