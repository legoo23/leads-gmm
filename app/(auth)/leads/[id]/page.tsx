import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import LeadDetailClient from "./LeadDetailClient"

type Params = { params: Promise<{ id: string }> }

export default async function LeadDetailPage({ params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase.from("user_profiles").select("rol").eq("id", user.id).single()
  const rol = profile?.rol ?? "agente"

  return <LeadDetailClient leadId={parseInt(id)} rol={rol} />
}
