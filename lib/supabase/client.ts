/*
 * leads-gmm — Cliente Supabase para Client Components
 * Copyright © 2026 Alejandro Legorreta Barrera. Todos los derechos reservados.
 */

import { createBrowserClient } from "@supabase/ssr"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const createClient = () =>
  createBrowserClient<any>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
