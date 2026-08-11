import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import LeadsClientPage from "./LeadsClientPage"

export const metadata = { title: "Leads — Pipeline GMM" }

export default async function LeadsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase.from("user_profiles").select("rol").eq("id", user.id).single()
  const rol = profile?.rol ?? "agente"

  return <LeadsClientPage rol={rol} userId={user.id} />
}
