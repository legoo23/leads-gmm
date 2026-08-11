/*
 * leads-gmm — Cliente Supabase para Server Components y Route Handlers
 * Copyright © 2026 Alejandro Legorreta Barrera. Todos los derechos reservados.
 */

import { createServerClient } from "@supabase/ssr"
import { createClient as createSBClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"

export async function createClient() {
  const cookieStore = await cookies()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return createServerClient<any>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cs) =>
          cs.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          ),
      },
    }
  )
}

// Cliente con service_role — solo para Route Handlers del servidor
// NUNCA usar en Client Components
export function createServiceClient() {
  return createSBClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}
