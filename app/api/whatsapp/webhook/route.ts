import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"
import { encryptField, hashField } from "@/lib/crypto"
import { normalizePhone, generateFolio } from "@/lib/utils"
import { logAudit } from "@/lib/audit"
import crypto from "crypto"

// Webhook verification (GET) — Meta handshake
export async function GET(req: NextRequest) {
  const mode = req.nextUrl.searchParams.get("hub.mode")
  const token = req.nextUrl.searchParams.get("hub.verify_token")
  const challenge = req.nextUrl.searchParams.get("hub.challenge")

  if (mode === "subscribe" && token === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 })
  }
  return NextResponse.json({ error: "Forbidden" }, { status: 403 })
}

// Incoming messages (POST)
export async function POST(req: NextRequest) {
  const rawBody = await req.text()

  // HMAC-SHA256 signature validation
  const sig = req.headers.get("x-hub-signature-256")
  if (!sig) return NextResponse.json({}, { status: 403 })

  const hash = crypto
    .createHmac("sha256", process.env.WHATSAPP_APP_SECRET!)
    .update(rawBody)
    .digest("hex")

  if (`sha256=${hash}` !== sig) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 403 })
  }

  let payload: Record<string, unknown>
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: "Bad JSON" }, { status: 400 })
  }

  // Parse WhatsApp Cloud API message structure
  const entry = (payload.entry as unknown[])?.[0] as Record<string, unknown>
  const changes = (entry?.changes as unknown[])?.[0] as Record<string, unknown>
  const value = changes?.value as Record<string, unknown>
  const messages = value?.messages as Record<string, unknown>[]
  const contact = (value?.contacts as Record<string, unknown>[])?.[0]

  if (!messages?.length) {
    // Delivery receipts, read receipts — just acknowledge
    return NextResponse.json({ ok: true })
  }

  const msg = messages[0]
  const waId = String(msg.from ?? "")
  const msgType = String(msg.type ?? "")
  const bodyText = msgType === "text"
    ? String((msg.text as Record<string, unknown>)?.body ?? "")
    : ""
  const displayName = String((contact?.profile as Record<string, unknown>)?.name ?? "")

  const telefono = normalizePhone(waId.replace(/^521?/, "").slice(-10))
  const folio = generateFolio()

  const svc = await createServiceClient()

  // Check for existing open lead from this number
  const telefonoHash = hashField(telefono)
  const { data: existing } = await svc
    .from("leads")
    .select("id")
    .eq("telefono_hash", telefonoHash)
    .eq("estado", "activo")
    .limit(1)
    .single()

  if (existing) {
    // Append message to existing lead notes instead of creating duplicate
    await svc.from("leads").update({
      notas: `[WA] ${bodyText}`,
    }).eq("id", existing.id)
    await sendWhatsAppMessage(waId, "Hola, ya tenemos tu solicitud en proceso. Pronto te contactará uno de nuestros asesores.")
    return NextResponse.json({ ok: true })
  }

  // Create new lead in review queue
  const row = {
    folio,
    nombre: displayName || "Desde WhatsApp",
    nombre_enc: encryptField(displayName || "Desde WhatsApp"),
    telefono_enc: encryptField(telefono),
    telefono_hash: telefonoHash,
    fuente: "whatsapp_bot",
    en_cola_revision: true,
    etapa: "nuevo",
    estado: "activo",
    prioridad: "media",
    notas: bodyText ? `[WA] ${bodyText}` : null,
  }

  const { data: lead, error } = await svc.from("leads").insert(row).select().single()
  if (error) {
    console.error("WA lead creation error:", error.message)
    return NextResponse.json({ ok: true }) // Always 200 to Meta
  }

  await logAudit({ accion: "whatsapp_lead_created", tabla: "leads", id_registro: lead.id, id_usuario: "bot" })

  // Acknowledge to patient
  await sendWhatsAppMessage(
    waId,
    "¡Hola! Gracias por contactarnos. Uno de nuestros asesores especializados en cirugía con seguro GMM te contactará en breve. 🏥"
  )

  return NextResponse.json({ ok: true })
}

async function sendWhatsAppMessage(to: string, text: string) {
  const token = process.env.WHATSAPP_TOKEN
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID
  if (!token || !phoneId) return

  try {
    await fetch(`https://graph.facebook.com/v19.0/${phoneId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: text },
      }),
    })
  } catch (e) {
    console.error("WA send error:", e)
  }
}
