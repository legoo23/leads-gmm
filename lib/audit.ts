/*
 * leads-gmm — Log de auditoría para acceso a datos personales
 * Copyright © 2026 Alejandro Legorreta Barrera. Todos los derechos reservados.
 */

import { createServiceClient } from "@/lib/supabase/server"

interface AuditEntry {
  accion: string
  tabla?: string
  id_registro?: string | number
  id_usuario?: string
  metadata?: Record<string, unknown>
  ip?: string
}

export async function logAudit(entry: AuditEntry): Promise<void> {
  try {
    const svc = await createServiceClient()
    await svc.from("audit_log").insert({
      accion: entry.accion,
      tabla: entry.tabla ?? null,
      id_usuario: entry.id_usuario ?? null,
      id_recurso: entry.id_registro ? String(entry.id_registro) : null,
      meta: entry.metadata ?? null,
      ip: entry.ip ?? null,
    })
  } catch {
    // Never interrupt main flow
  }
}

export const API_MAX_RECORDS = 50

export function sanitizeLimit(raw: string | null | undefined, defaultVal = 25): number {
  const n = parseInt(raw ?? String(defaultVal), 10)
  if (isNaN(n) || n < 1) return defaultVal
  return Math.min(n, API_MAX_RECORDS)
}
