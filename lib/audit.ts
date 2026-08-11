/*
 * leads-gmm — Log de auditoría para acceso a datos personales
 * Copyright © 2026 Alejandro Legorreta Barrera. Todos los derechos reservados.
 *
 * Registra quién accedió a qué datos, cuándo y desde dónde.
 * Protección contra exfiltración masiva de datos.
 */

import { createClient } from "@/lib/supabase/server"

export type AuditAction =
  | "leads:list"
  | "leads:view"
  | "leads:export"
  | "personas:list"
  | "personas:view"
  | "comisiones:export"
  | "auth:login"
  | "auth:logout"

interface AuditEntry {
  action: AuditAction
  userId?: string
  resourceId?: string | number
  meta?: Record<string, unknown>
  ip?: string
}

export async function logAudit(entry: AuditEntry): Promise<void> {
  try {
    const supabase = await createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from("audit_log") as any).insert({
      accion: entry.action,
      id_usuario: entry.userId ?? null,
      id_recurso: entry.resourceId ? String(entry.resourceId) : null,
      meta: entry.meta ?? null,
      ip: entry.ip ?? null,
      timestamp: new Date().toISOString(),
    })
  } catch {
    // Audit logging nunca debe interrumpir el flujo principal
  }
}

// Límite de registros por respuesta de API — anti-exfiltración
export const API_MAX_RECORDS = 50

// Valida que el parámetro limit no exceda el máximo permitido
export function sanitizeLimit(raw: string | null | undefined, defaultVal = 25): number {
  const n = parseInt(raw ?? String(defaultVal), 10)
  if (isNaN(n) || n < 1) return defaultVal
  return Math.min(n, API_MAX_RECORDS)
}
