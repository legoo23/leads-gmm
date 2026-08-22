/*
 * leads-gmm — Middleware Next.js
 * Copyright © 2026 Alejandro Legorreta Barrera. Todos los derechos reservados.
 *
 * 1. Verifica licencia del software en el arranque del servidor
 * 2. Refresca sesión de Supabase Auth en cada request
 * 3. Protege rutas autenticadas — redirige a /login si no hay sesión
 */

import { type NextRequest, NextResponse } from "next/server"
import { updateSession } from "@/lib/supabase/middleware"

const MANTENIMIENTO_HTML = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>iHelp Médica — En mantenimiento</title><style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:system-ui,sans-serif;background:#F0F4F8;color:#0F1929;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:24px}div{text-align:center;max-width:420px}h1{font-size:1.5rem;font-weight:700;margin-bottom:12px}p{color:#5E7490;line-height:1.6}</style></head><body><div><h1>Sitio en mantenimiento</h1><p>Estamos realizando mejoras. Regresamos muy pronto.<br>Gracias por su paciencia.</p></div></body></html>`

// Rutas públicas que se ocultan durante mantenimiento
const PUBLIC_SITE_PATHS = ["/", "/r/", "/c/", "/privacidad", "/terminos", "/bienvenida/", "/docs/", "/api/contacto", "/api/testimonios", "/api/r/", "/api/c/"]

export async function middleware(request: NextRequest) {
  // Modo mantenimiento — solo afecta el sitio público, no el portal interno
  if (process.env.MANTENIMIENTO === "true") {
    const { pathname } = request.nextUrl
    const isPublicSite = pathname === "/" || PUBLIC_SITE_PATHS.some((p) => p !== "/" && pathname.startsWith(p))
    if (isPublicSite) {
      return new NextResponse(MANTENIMIENTO_HTML, {
        status: 503,
        headers: { "Content-Type": "text/html; charset=utf-8", "Retry-After": "3600" },
      })
    }
  }

  // Security headers en todas las respuestas
  const response = await updateSession(request)

  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set("X-Frame-Options", "DENY")
  response.headers.set("X-XSS-Protection", "1; mode=block")
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
  response.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://*.supabase.co",
      `connect-src 'self' https://*.supabase.co wss://*.supabase.co`,
      "font-src 'self' data:",
      "object-src 'none'",
      "frame-ancestors 'none'",
    ].join("; ")
  )

  return response
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
