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

export async function middleware(request: NextRequest) {
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
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://s3.us-east-1.amazonaws.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://*.supabase.co https://s3.us-east-1.amazonaws.com",
      `connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.amazonaws.com wss://*.amazonaws.com`,
      "font-src 'self' data: https://s3.us-east-1.amazonaws.com",
      "frame-src https://s3.us-east-1.amazonaws.com https://*.amazonaws.com",
      "media-src 'self' https://*.amazonaws.com",
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
