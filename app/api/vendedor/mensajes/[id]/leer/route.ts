import { NextResponse } from "next/server"
import { assertLicense } from "@/lib/license"
import { createServiceClient } from "@/lib/supabase/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  assertLicense()

  const { id } = await params
  const idMensaje = parseInt(id)
  if (isNaN(idMensaje)) return NextResponse.json({ error: "ID inválido" }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const svc = createServiceClient()

  // Resolver vendedor
  let idVendedor: number | null = null
  const { data: v1 } = await svc
    .from("vendedores")
    .select("id")
    .eq("email", user.email ?? "")
    .eq("activo", true)
    .single()

  if (v1) {
    idVendedor = v1.id
  } else {
    const phone = user.phone?.replace(/^\+52/, "") ?? ""
    const { data: v2 } = await svc
      .from("vendedores")
      .select("id")
      .eq("telefono", phone)
      .eq("activo", true)
      .single()
    if (v2) idVendedor = v2.id
  }

  if (!idVendedor) return NextResponse.json({ error: "Vendedor no encontrado" }, { status: 403 })

  // Insertar lectura (upsert — composite PK evita duplicados)
  const { error } = await svc
    .from("mensajes_lecturas")
    .upsert({ id_mensaje: idMensaje, id_vendedor: idVendedor }, { onConflict: "id_mensaje,id_vendedor" })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
