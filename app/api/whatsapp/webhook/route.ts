import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"
import { encryptField, hashField } from "@/lib/crypto"
import { normalizePhone, generateFolio } from "@/lib/utils"
import { logAudit } from "@/lib/audit"
import crypto from "crypto"

// ── Meta webhook verification ─────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const mode  = req.nextUrl.searchParams.get("hub.mode")
  const token = req.nextUrl.searchParams.get("hub.verify_token")
  const challenge = req.nextUrl.searchParams.get("hub.challenge")
  if (mode === "subscribe" && token === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 })
  }
  return NextResponse.json({ error: "Forbidden" }, { status: 403 })
}

// ── Incoming messages ─────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const rawBody = await req.text()

  const sig = req.headers.get("x-hub-signature-256")
  if (!sig) return NextResponse.json({}, { status: 403 })
  const hash = crypto
    .createHmac("sha256", process.env.WHATSAPP_APP_SECRET!)
    .update(rawBody)
    .digest("hex")
  if (`sha256=${hash}` !== sig) return NextResponse.json({ error: "Invalid signature" }, { status: 403 })

  let payload: Record<string, unknown>
  try { payload = JSON.parse(rawBody) } catch {
    return NextResponse.json({ error: "Bad JSON" }, { status: 400 })
  }

  const entry   = (payload.entry as unknown[])?.[0] as Record<string, unknown>
  const changes = (entry?.changes as unknown[])?.[0] as Record<string, unknown>
  const value   = changes?.value as Record<string, unknown>
  const messages = value?.messages as Record<string, unknown>[]
  const contact  = (value?.contacts as Record<string, unknown>[])?.[0]

  if (!messages?.length) return NextResponse.json({ ok: true })

  const msg         = messages[0]
  const waId        = String(msg.from ?? "")
  const msgType     = String(msg.type ?? "")
  const bodyText    = msgType === "text"
    ? String((msg.text as Record<string, unknown>)?.body ?? "").trim()
    : ""
  const hasMedia    = ["image", "document"].includes(msgType)
  const displayName = String((contact?.profile as Record<string, unknown>)?.name ?? "")

  const telefono     = normalizePhone(waId.replace(/^521?/, "").slice(-10))
  const telefonoHash = hashField(telefono)

  const svc = createServiceClient()

  try {
    const { data: session } = await svc
      .from("whatsapp_sessions")
      .select("*")
      .eq("telefono_hash", telefonoHash)
      .single()

    // Stale = no activity in 30 min
    const STALE_MS = 30 * 60 * 1000
    const isStale = session && (Date.now() - new Date(session.updated_at).getTime() > STALE_MS)

    // Restart stale sessions (but keep completed ones until they write again intentionally)
    if (isStale) {
      await svc.from("whatsapp_sessions").delete().eq("telefono_hash", telefonoHash)
    }

    const activeSession  = isStale ? null : session
    const estado         = activeSession?.estado ?? "inicio"
    const datos          = (activeSession?.datos ?? {}) as BotData

    const result = await runStateMachine({
      estado, bodyText, hasMedia, datos, displayName, waId,
      codigoReferido: activeSession?.codigo_referido ?? null,
      idVendedor:     activeSession?.id_vendedor ?? null,
      idCampana:      activeSession?.id_campana ?? null,
      svc,
    })

    // Upsert session with new state
    await svc.from("whatsapp_sessions").upsert({
      telefono_hash:   telefonoHash,
      wa_id:           waId,
      estado:          result.nextEstado,
      tipo_flujo:      result.nextTipoFlujo,
      datos:           result.nextDatos,
      codigo_referido: result.codigoReferido,
      id_vendedor:     result.idVendedor,
      id_campana:      result.idCampana,
      updated_at:      new Date().toISOString(),
    }, { onConflict: "telefono_hash" })

    // Create lead if bot completed the patient flow
    if (result.createLead) {
      const d = result.nextDatos
      const folio = generateFolio()
      const nombreCompleto = d.nombre ?? (displayName || "Desde WhatsApp")
      const { data: lead } = await svc.from("leads").insert({
        folio,
        nombre:                  nombreCompleto,
        nombre_enc:              encryptField(nombreCompleto),
        telefono_enc:            encryptField(telefono),
        telefono_hash:           telefonoHash,
        fuente:                  "whatsapp_bot",
        en_cola_revision:        true,
        etapa:                   "nuevo",
        estado:                  "activo",
        prioridad:               "media",
        id_aseguradora:          d.id_aseguradora ?? null,
        numero_poliza_enc:       d.numero_poliza ? encryptField(String(d.numero_poliza)) : null,
        diagnostico_principal:   d.sintomas ?? null,
        fecha_inicio_sintomas:   d.fecha_inicio_sintomas ?? null,
        valorado_medico_previo:  d.valorado_medico_previo ?? null,
        antecedentes_enfermedad: d.antecedentes ?? null,
        atenciones_previas_sgmm: d.sgmm_previo ?? null,
        codigo_referido:         result.codigoReferido,
        id_vendedor:             result.idVendedor,
        id_campana:              result.idCampana,
        notas: [
          d.aseguradora_texto && `Aseguradora: ${d.aseguradora_texto}`,
          d.fecha_nacimiento_texto && `Fecha nacimiento: ${d.fecha_nacimiento_texto}`,
        ].filter(Boolean).join(" · ") || null,
      }).select("id").single()

      if (lead) {
        await svc.from("whatsapp_sessions").update({ id_lead: lead.id }).eq("telefono_hash", telefonoHash)
        await logAudit({ accion: "whatsapp_lead_created", tabla: "leads", id_registro: lead.id, id_usuario: "bot" })
      }
    }

    // Create empresa prospecto if company flow completed
    if (result.createEmpresa) {
      const d = result.nextDatos
      await svc.from("empresas_prospectos").insert({
        nombre_empresa:   d.nombre_empresa ?? "Sin nombre",
        nombre_contacto:  d.nombre_contacto ?? null,
        cargo:            d.cargo ?? null,
        telefono:         telefono || null,
        num_colaboradores: d.num_colaboradores ?? null,
        aseguradora:      d.aseguradora ?? null,
        fuente:           "whatsapp_bot",
        codigo_referido:  result.codigoReferido,
        id_campana:       result.idCampana,
      })
    }

    if (result.respuesta) {
      await sendWA(waId, result.respuesta)
    }
  } catch (err) {
    console.error("[WA webhook error]", err)
  }

  return NextResponse.json({ ok: true })
}

// ── Types ─────────────────────────────────────────────────────────────────

interface BotData {
  nombre?: string
  fecha_nacimiento_texto?: string
  id_aseguradora?: number
  aseguradora_texto?: string
  numero_poliza?: string
  sintomas?: string
  fecha_inicio_sintomas?: string
  valorado_medico_previo?: boolean
  antecedentes?: string
  sgmm_previo?: boolean
  nombre_empresa?: string
  nombre_contacto?: string
  cargo?: string
  num_colaboradores?: number
  aseguradora?: string
  [key: string]: unknown
}

interface BotResult {
  respuesta: string | null
  nextEstado: string
  nextDatos: BotData
  nextTipoFlujo: string | null
  codigoReferido: string | null
  idVendedor: number | null
  idCampana: number | null
  createLead: boolean
  createEmpresa: boolean
}

// ── State machine ─────────────────────────────────────────────────────────

async function runStateMachine(ctx: {
  estado: string
  bodyText: string
  hasMedia: boolean
  datos: BotData
  displayName: string
  waId: string
  codigoReferido: string | null
  idVendedor: number | null
  idCampana: number | null
  svc: ReturnType<typeof createServiceClient>
}): Promise<BotResult> {
  const { estado, bodyText, hasMedia, datos, displayName, svc } = ctx
  const lower  = bodyText.toLowerCase()
  const isYes  = /^(si|sí|s|1\b|yes|ok)/.test(lower)
  const isNo   = /^(no|n|2\b|nope)/.test(lower)
  const firstName = datos.nombre?.split(" ")[0] ?? displayName?.split(" ")[0] ?? ""

  function base(overrides: Partial<BotResult>): BotResult {
    return {
      respuesta:      null,
      nextEstado:     estado,
      nextDatos:      datos,
      nextTipoFlujo:  ctx.idVendedor ? "asesor" : ctx.idCampana ? "empresa" : "sin_codigo",
      codigoReferido: ctx.codigoReferido,
      idVendedor:     ctx.idVendedor,
      idCampana:      ctx.idCampana,
      createLead:     false,
      createEmpresa:  false,
      ...overrides,
    }
  }

  // ── Completed sessions — handle re-engagement ──────────────────────────
  if (estado === "a_completado") {
    return base({
      respuesta: "Tu solicitud ya está registrada 📋 Un asesor te contactará pronto. Si es una urgencia llama directamente al número de atención.",
    })
  }
  if (estado === "e_completado") {
    return base({
      respuesta: "Ya tenemos tu información. Un ejecutivo de nuestro equipo te contactará en breve. ¡Gracias! 🙏",
    })
  }

  // ── INICIO: detect context from code or first message ─────────────────
  if (estado === "inicio") {
    const codigoMatch = bodyText.match(/\b([A-Z0-9]{2,6}-[A-Z0-9]{4,10})\b/i)
    const codigo = codigoMatch?.[1]?.toUpperCase() ?? null

    if (codigo) {
      const { data: vend } = await svc.from("vendedores")
        .select("id").eq("codigo_unico", codigo).eq("activo", true).single()
      if (vend) {
        return base({
          respuesta: greeting(displayName) + " Tu asesor ya me compartió tu caso. Para ayudarte necesito algunos datos.\n\n¿Cuál es tu *nombre completo*?",
          nextEstado: "a_nombre",
          nextTipoFlujo: "asesor",
          codigoReferido: codigo,
          idVendedor: vend.id,
        })
      }
      const { data: camp } = await svc.from("campanas")
        .select("id").eq("codigo_unico", codigo).eq("activa", true).single()
      if (camp) {
        return base({
          respuesta: greeting(displayName) + " Llegaste desde una campaña de salud. ¿Cómo puedo ayudarte?\n\n1️⃣ Soy colaborador con seguro de gastos médicos\n2️⃣ Soy del área de RH de la empresa",
          nextEstado: "e_tipo_usuario",
          nextTipoFlujo: "empresa",
          codigoReferido: codigo,
          idCampana: camp.id,
        })
      }
    }

    // No code found — ask
    return base({
      respuesta: greeting(displayName) + " ¿Cómo puedo ayudarte?\n\n1️⃣ Soy paciente con seguro de gastos médicos\n2️⃣ Represento a una empresa (área de RH o Beneficios)",
      nextEstado: "sin_codigo_tipo",
      nextTipoFlujo: "sin_codigo",
    })
  }

  // ── SIN CÓDIGO: detect type ───────────────────────────────────────────
  if (estado === "sin_codigo_tipo") {
    if (/^(1\b|paciente|colaborador|seguro|salud|medic|atencion|atención|enferm)/i.test(bodyText)) {
      return base({ respuesta: "¡Con gusto te ayudo! 😊 ¿Cuál es tu *nombre completo*?", nextEstado: "a_nombre", nextTipoFlujo: "asesor" })
    }
    if (/^(2\b|rh|empresa|recursos|hr|beneficio|representante)/i.test(bodyText)) {
      return base({ respuesta: "¡Perfecto! ¿Cuál es el *nombre de tu empresa*?", nextEstado: "e_nombre_empresa", nextTipoFlujo: "empresa" })
    }
    return base({ respuesta: "Por favor elige una opción:\n\n1️⃣ Soy paciente con seguro de gastos médicos\n2️⃣ Represento a una empresa" })
  }

  // ── EMPRESA: tipo de usuario (desde campaña) ──────────────────────────
  if (estado === "e_tipo_usuario") {
    if (/^(1\b|paciente|colaborador|salud|seguro|medic|atencion|atención)/i.test(bodyText)) {
      return base({ respuesta: "Entendido 😊 ¿Cuál es tu *nombre completo*?", nextEstado: "a_nombre", nextTipoFlujo: "asesor" })
    }
    if (/^(2\b|rh|empresa|recursos|hr|beneficio|representante)/i.test(bodyText)) {
      return base({ respuesta: "¡Perfecto! ¿Cuál es el *nombre de tu empresa*?", nextEstado: "e_nombre_empresa", nextTipoFlujo: "empresa" })
    }
    return base({ respuesta: "Por favor elige:\n\n1️⃣ Soy colaborador / paciente\n2️⃣ Soy de RH o represento a la empresa" })
  }

  // ── EMPRESA FLOW ──────────────────────────────────────────────────────
  if (estado === "e_nombre_empresa") {
    if (!bodyText) return base({ respuesta: "¿Cuál es el nombre de tu empresa?" })
    return base({
      respuesta: "Gracias. ¿Cuál es tu *nombre completo* y tu *cargo*?\n(ej: \"María García, Jefa de RH\")",
      nextEstado: "e_nombre_contacto",
      nextDatos: { ...datos, nombre_empresa: bodyText },
    })
  }
  if (estado === "e_nombre_contacto") {
    return base({
      respuesta: "¿Aproximadamente cuántos colaboradores tienen *seguro de gastos médicos mayores*?",
      nextEstado: "e_colaboradores",
      nextDatos: { ...datos, nombre_contacto: bodyText },
    })
  }
  if (estado === "e_colaboradores") {
    const numColabs = parseInt(bodyText.replace(/\D/g, "")) || undefined
    return base({
      respuesta: "¿Con qué *aseguradora* cuentan? (GNP, AXA, MAPFRE, MetLife, Cigna, SURA, Inbursa, u otra)",
      nextEstado: "e_aseguradora",
      nextDatos: { ...datos, num_colaboradores: numColabs },
    })
  }
  if (estado === "e_aseguradora") {
    return base({
      respuesta: `✅ ¡Listo! Registramos la información de *${datos.nombre_empresa}*.\n\nUn ejecutivo de nuestro equipo se comunicará con ustedes para presentarles nuestras *campañas de salud gratuitas* y beneficios de asesoría SGMM.\n\n¡Muchas gracias! 🙏`,
      nextEstado: "e_completado",
      nextDatos: { ...datos, aseguradora: bodyText },
      createEmpresa: true,
    })
  }

  // ── PATIENT/ASESOR FLOW ───────────────────────────────────────────────
  if (estado === "a_nombre") {
    if (!bodyText || bodyText.length < 2) return base({ respuesta: "Por favor escribe tu nombre completo." })
    return base({
      respuesta: `Gracias, ${bodyText.split(" ")[0]} 😊 ¿Cuál es tu *fecha de nacimiento*? (dd/mm/aaaa)`,
      nextEstado: "a_dob",
      nextDatos: { ...datos, nombre: bodyText },
    })
  }
  if (estado === "a_dob") {
    return base({
      respuesta: "¿Con cuál *aseguradora* cuentas?\n\n1️⃣ GNP  2️⃣ AXA  3️⃣ MAPFRE  4️⃣ MetLife  5️⃣ Zurich\n6️⃣ Atlas  7️⃣ Bancomer/BX+  8️⃣ Cigna  9️⃣ SURA\n🔟 Inbursa  0️⃣ Otra (escribe el nombre)",
      nextEstado: "a_aseguradora",
      nextDatos: { ...datos, fecha_nacimiento_texto: bodyText },
    })
  }
  if (estado === "a_aseguradora") {
    const asegMap: Record<string, number> = {
      "1": 1, "gnp": 1,
      "2": 2, "axa": 2,
      "3": 3, "mapfre": 3,
      "4": 4, "metlife": 4,
      "5": 5, "zurich": 5,
      "6": 6, "atlas": 6,
      "7": 7, "bx": 7, "bancomer": 7,
      "8": 8, "cigna": 8,
      "9": 9, "sura": 9,
      "10": 13, "inbursa": 13,
    }
    const asegKey = bodyText.replace(/^[0-9️⃣]+/, "").trim().toLowerCase() || lower.replace(/\s/g,"")
    const asegId  = asegMap[lower.trim()] ?? asegMap[asegKey] ?? null
    return base({
      respuesta: "¿Cuál es tu *número de póliza*? (puedes enviar una foto si la tienes a la mano 📸)",
      nextEstado: "a_poliza",
      nextDatos: { ...datos, id_aseguradora: asegId, aseguradora_texto: bodyText },
    })
  }
  if (estado === "a_poliza") {
    const poliza = hasMedia ? "[foto recibida — procesada por asesor]" : bodyText
    return base({
      respuesta: "¿Cuáles son tus *síntomas principales* o cuál es el *procedimiento* que necesitas?",
      nextEstado: "a_sintomas",
      nextDatos: { ...datos, numero_poliza: poliza },
    })
  }
  if (estado === "a_sintomas") {
    return base({
      respuesta: "¿*Desde cuándo* tienes estos síntomas? (ej: \"hace 3 días\", \"desde el lunes\")",
      nextEstado: "a_desde_cuando",
      nextDatos: { ...datos, sintomas: bodyText },
    })
  }
  if (estado === "a_desde_cuando") {
    return base({
      respuesta: "¿Has sido valorado por un médico por este padecimiento?\n\n1️⃣ Sí  2️⃣ No",
      nextEstado: "a_valorado",
      nextDatos: { ...datos, fecha_inicio_sintomas: bodyText },
    })
  }
  if (estado === "a_valorado") {
    if (!isYes && !isNo) return base({ respuesta: "Por favor responde *1 Sí* o *2 No*: ¿Has sido valorado por un médico?" })
    return base({
      respuesta: "¿Tienes alguna *enfermedad crónica* (diabetes, hipertensión...), *cirugía previa importante* o *alergia*?\n\nSi no tienes, escribe \"No\".",
      nextEstado: "a_antecedentes",
      nextDatos: { ...datos, valorado_medico_previo: isYes },
    })
  }
  if (estado === "a_antecedentes") {
    return base({
      respuesta: "¿Has utilizado tu seguro de gastos médicos anteriormente?\n\n1️⃣ Sí  2️⃣ No",
      nextEstado: "a_sgmm_previo",
      nextDatos: { ...datos, antecedentes: isNo ? "Sin antecedentes relevantes" : bodyText },
    })
  }
  if (estado === "a_sgmm_previo") {
    if (!isYes && !isNo) return base({ respuesta: "Por favor responde *1 Sí* o *2 No*: ¿Has usado tu seguro antes?" })
    return base({
      respuesta: `✅ ¡Gracias${firstName ? `, ${firstName}` : ""}! Recibimos tu información completa.\n\nUn *asesor especializado* en seguros de gastos médicos te contactará a la brevedad.\n\nNuestro servicio incluye:\n• Sin depósito hospitalario 🏥\n• Apoyo en deducible hasta $10,000\n• Coaseguro topado a $30,000\n• Asesoría 24/7`,
      nextEstado: "a_completado",
      nextDatos: { ...datos, sgmm_previo: isYes },
      createLead: true,
    })
  }

  // Fallback — restart conversation
  return base({
    respuesta: "Hola 👋 Escribe *hola* para iniciar o cuéntame en qué te puedo ayudar.",
    nextEstado: "inicio",
    nextDatos: {},
    nextTipoFlujo: null,
  })
}

function greeting(displayName: string): string {
  const first = displayName?.split(" ")[0]
  return `¡Hola${first ? ` ${first}` : ""}! 👋`
}

async function sendWA(to: string, text: string) {
  const token   = process.env.WHATSAPP_TOKEN
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID
  if (!token || !phoneId) return
  try {
    await fetch(`https://graph.facebook.com/v19.0/${phoneId}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ messaging_product: "whatsapp", to, type: "text", text: { body: text } }),
    })
  } catch (e) {
    console.error("[WA send error]", e)
  }
}
