import { Resend } from "resend"
import QRCode from "qrcode"

const resend = new Resend(process.env.RESEND_API_KEY)

const APP_URL   = process.env.NEXT_PUBLIC_APP_URL ?? "https://ihelpmedica.mx"
const FROM_NAME = "iHelp Medica"
const FROM_ADDR = process.env.RESEND_FROM ?? "bienvenida@ihelpmedica.mx"

interface VendedorEmailData {
  nombre:           string
  apellido_paterno: string | null
  email:            string
  codigo_unico:     string
  nivel_nombre?:    string | null
  nivel_monto?:     number | null
}

function buildWelcomeHtml(v: VendedorEmailData): string {
  const nombreCompleto = [v.nombre, v.apellido_paterno].filter(Boolean).join(" ")
  const link           = `${APP_URL}/r/${v.codigo_unico}`
  const bienvenidaUrl  = `${APP_URL}/portal/login`
  const verde          = "#0F6E56"
  const verdeClaro     = "#E1F5EE"

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Bienvenido a iHelp Medica</title>
</head>
<body style="margin:0;padding:0;background:#F0F4F8;font-family:Arial,Helvetica,sans-serif;-webkit-font-smoothing:antialiased;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F0F4F8;padding:40px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

  <!-- HEADER -->
  <tr><td style="background:${verde};padding:36px 40px;border-radius:14px 14px 0 0;text-align:center;">
    <div style="display:inline-block;width:48px;height:48px;background:rgba(255,255,255,.18);border-radius:12px;font-size:28px;font-weight:700;color:white;line-height:48px;text-align:center;margin-bottom:14px;">+</div>
    <h1 style="color:white;margin:0;font-size:26px;font-weight:700;letter-spacing:-0.5px;">iHelp Medica</h1>
    <p style="color:rgba(255,255,255,.75);margin:6px 0 0;font-size:13px;">Red de Asesores de Salud</p>
  </td></tr>

  <!-- BODY -->
  <tr><td style="background:#ffffff;padding:40px 40px 32px;">

    <h2 style="margin:0 0 10px;font-size:22px;color:#0F1929;">¡Bienvenido, ${nombreCompleto}!</h2>
    <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.6;">
      Ya formas parte de nuestra red de asesores. Cuando alguien use tu link o QR y se convierta en paciente,
      <strong>tú ganas una comisión${v.nivel_nombre ? ` de <strong style="color:${verde}">$${v.nivel_monto?.toLocaleString("es-MX")} MXN</strong>` : ""}</strong>
      por cada procedimiento confirmado. Cero inversión de tu parte.
    </p>

    <!-- Código único -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#F0F4F8;border-radius:12px;margin-bottom:24px;">
    <tr><td style="padding:20px;text-align:center;">
      <p style="margin:0 0 6px;font-size:11px;color:#6B7280;text-transform:uppercase;letter-spacing:1.5px;font-weight:600;">Tu código único de asesor</p>
      <p style="margin:0;font-size:34px;font-weight:700;color:${verde};letter-spacing:6px;font-family:'Courier New',monospace;">${v.codigo_unico}</p>
    </td></tr>
    </table>

    <!-- Link personal -->
    <p style="margin:0 0 6px;font-size:12px;color:#6B7280;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Tu link personal</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:${verdeClaro};border:1px solid ${verde}33;border-radius:10px;margin-bottom:28px;">
    <tr><td style="padding:14px 18px;">
      <a href="${link}" style="color:${verde};font-weight:700;font-size:14px;text-decoration:none;word-break:break-all;">${link}</a>
    </td></tr>
    </table>

    <!-- QR -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
    <tr><td style="text-align:center;">
      <p style="margin:0 0 14px;font-size:14px;font-weight:600;color:#374151;">Tu código QR</p>
      <img src="cid:qr-code" alt="Código QR ${v.codigo_unico}" width="180" height="180"
        style="border-radius:12px;border:1px solid #E5E7EB;display:block;margin:0 auto;" />
      <p style="margin:10px 0 0;font-size:12px;color:#9CA3AF;">Descárgalo, imprímelo o compártelo en tus redes</p>
    </td></tr>
    </table>

    <!-- Divider -->
    <hr style="border:none;border-top:1px solid #F3F4F6;margin:0 0 28px;" />

    <!-- Cómo funciona -->
    <h3 style="margin:0 0 16px;font-size:16px;color:#0F1929;">¿Cómo funciona?</h3>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
      ${[
        ["1", "Comparte tu link o QR", "Mándalo por WhatsApp, ponlo en tus historias o imprime el QR para consultorios y farmacias."],
        ["2", "El paciente llena el formulario", "En menos de 2 minutos captura sus datos y nos dice qué procedimiento necesita."],
        ["3", "Nuestro equipo gestiona todo", "Verificamos su póliza GMM, conseguimos la autorización y coordinamos el ingreso. Sin costo para el paciente."],
        ["4", "Procedimiento confirmado = comisión tuya", "Cuando el caso se cierra, recibirás tu pago. Sin complicaciones."],
      ].map(([n, titulo, desc]) => `
      <tr><td style="padding:0 0 16px;">
        <table cellpadding="0" cellspacing="0">
        <tr>
          <td style="vertical-align:top;padding-right:14px;">
            <div style="width:32px;height:32px;background:${verde};border-radius:50%;color:white;font-size:14px;font-weight:700;text-align:center;line-height:32px;">${n}</div>
          </td>
          <td style="vertical-align:top;">
            <p style="margin:0 0 3px;font-size:14px;font-weight:700;color:#0F1929;">${titulo}</p>
            <p style="margin:0;font-size:13px;color:#6B7280;line-height:1.5;">${desc}</p>
          </td>
        </tr>
        </table>
      </td></tr>`).join("")}
    </table>

    <!-- Qué decirle al paciente -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#FFFBEB;border:1px solid #FDE68A;border-radius:10px;margin-bottom:28px;">
    <tr><td style="padding:16px 18px;">
      <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#92400E;">💬 Sugerencia de mensaje para WhatsApp</p>
      <p style="margin:0;font-size:13px;color:#78350F;line-height:1.6;font-style:italic;">
        "¿Tienes seguro de gastos médicos y necesitas una cirugía? Con iHelp Medica puedes entrar al hospital sin dejar depósito y que tu seguro pague directo. Sin costo para ti. Llena el formulario aquí: ${link}"
      </p>
    </td></tr>
    </table>

    <!-- CTA -->
    <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td style="text-align:center;">
      <a href="${bienvenidaUrl}"
        style="display:inline-block;background:${verde};color:white;padding:14px 32px;border-radius:10px;text-decoration:none;font-size:15px;font-weight:700;letter-spacing:0.3px;">
        Entrar a mi panel →
      </a>
      <p style="margin:12px 0 0;font-size:12px;color:#9CA3AF;">Recibirás un correo aparte para activar tu contraseña de acceso.</p>
    </td></tr>
    </table>

  </td></tr>

  <!-- FOOTER -->
  <tr><td style="background:#111827;padding:24px 40px;border-radius:0 0 14px 14px;text-align:center;">
    <p style="margin:0 0 6px;color:#9CA3AF;font-size:12px;">© 2026 iHelp Medica · Todos los derechos reservados</p>
    <p style="margin:0;color:#6B7280;font-size:11px;">
      <a href="mailto:hola@ihelpmedica.mx" style="color:#6B7280;">hola@ihelpmedica.mx</a>
      &nbsp;·&nbsp; CDMX y Área Metropolitana
    </p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`
}

export async function sendWelcomeVendedor(v: VendedorEmailData): Promise<void> {
  if (!v.email) throw new Error("El vendedor no tiene email registrado")

  const html = buildWelcomeHtml(v)

  const qrBuffer = await QRCode.toBuffer(`${APP_URL}/r/${v.codigo_unico}`, {
    type:   "png",
    width:  360,
    margin: 2,
    color:  { dark: "#0F6E56", light: "#FFFFFF" },
  })

  const { error } = await resend.emails.send({
    from:    `${FROM_NAME} <${FROM_ADDR}>`,
    to:      [v.email],
    subject: `Bienvenido a iHelp Medica — Tu código: ${v.codigo_unico}`,
    html,
    attachments: [
      {
        filename:   `QR-${v.codigo_unico}.png`,
        content:    qrBuffer.toString("base64"),
        contentId: "qr-code",
      },
    ],
  })

  if (error) throw new Error(error.message)
}
