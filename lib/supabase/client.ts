/*
 * leads-gmm — Cliente Supabase para Client Components
 * Copyright © 2026 Alejandro Legorreta Barrera. Todos los derechos reservados.
 */

import { createBrowserClient } from "@supabase/ssr"
import type { Database } from "@/types/supabase"

export const createClient = () =>
  createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
