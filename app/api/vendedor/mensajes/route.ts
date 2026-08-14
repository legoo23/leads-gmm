import { NextResponse } from "next/server"
import { assertLicense } from "@/lib/license"
import { createServiceClient } from "@/lib/supabase/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  assertLicense()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const svc = createServiceClient()

  // Verificar que el usuario es vendedor activo
  const { data: vendedor } = await svc
    .from("vendedores")
    .select("id")
    .eq("email", user.email ?? "")
    .eq("activo", true)
    .single()

  if (!vendedor) {
    // Intentar por teléfono (el email puede no estar en la tabla si se autenticó por phone)
    const phone = user.phone?.replace(/^\+52/, "") ?? ""
    const { data: vendedorTel } = await svc
      .from("vendedores")
      .select("id")
      .eq("telefono", phone)
      .eq("activo", true)
      .single()

    if (!vendedorTel) return NextResponse.json({ error: "Vendedor no encontrado" }, { status: 403 })

    return fetchMensajes(svc, vendedorTel.id)
  }

  return fetchMensajes(svc, vendedor.id)
}

async function fetchMensajes(svc: ReturnType<typeof createServiceClient>, idVendedor: number) {
  // Mensajes dirigidos a todos o específicamente a este vendedor
  const { data: mensajes, error } = await svc
    .from("mensajes_vendedores")
    .select("id, asunto, cuerpo, destinatario, created_at")
    .eq("activo", true)
    .or(`destinatario.eq.todos,and(destinatario.eq.individual,id_vendedor.eq.${idVendedor})`)
    .order("created_at", { ascending: false })
    .limit(50)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Obtener lecturas de este vendedor para marcar cuáles ya leyó
  const ids = (mensajes ?? []).map((m) => m.id)
  const { data: lecturas } = ids.length
    ? await svc
        .from("mensajes_lecturas")
        .select("id_mensaje")
        .eq("id_vendedor", idVendedor)
        .in("id_mensaje", ids)
    : { data: [] }

  const leidosSet = new Set((lecturas ?? []).map((l) => l.id_mensaje))

  const result = (mensajes ?? []).map((m) => ({
    ...m,
    leido: leidosSet.has(m.id),
  }))

  return NextResponse.json({ mensajes: result, id_vendedor: idVendedor })
}
