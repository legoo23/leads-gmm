/*
 * leads-gmm — Cliente Supabase para Server Components y Route Handlers
 * Copyright © 2026 Alejandro Legorreta Barrera. Todos los derechos reservados.
 */

import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import type { Database } from "@/types/supabase"

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
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
// NUNCA exponer en Client Components
export function createServiceClient() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { createClient: sc } = require("@supabase/supabase-js")
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return sc(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  ) as ReturnType<typeof import("@supabase/supabase-js").createClient>
}
