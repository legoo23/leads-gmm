/*
 * leads-gmm — Tipos de base de datos Supabase
 * Copyright © 2026 Alejandro Legorreta Barrera. Todos los derechos reservados.
 *
 * Archivo generado y mantenido manualmente hasta que el esquema SQL
 * esté definido; después se puede regenerar con:
 *   npx supabase gen types typescript --project-id <id> > types/supabase.ts
 *
 * Campos con sufijo _hash → hash SHA-256 del valor real (para búsquedas)
 * Campos sin sufijo con datos sensibles → valor cifrado AES-256-GCM
 */

export type EtapaPipeline =
  | "nuevo"
  | "contactado"
  | "necesidad_identificada"
  | "seguro_identificado"
  | "en_validacion"
  | "viable"
  | "programado"
  | "ganado"
  | "no_viable"
  | "perdido"

export type EstadoLead = "activo" | "convertido" | "perdido"
export type PrioridadLead = "baja" | "media" | "alta" | "urgente"
export type FuenteLead = "whatsapp_bot" | "qr" | "formulario" | "llamada" | "referido"
export type UrgenciaQx = "electiva" | "programada" | "urgente"
export type EstadoComision = "pendiente" | "aprobada" | "pagada" | "cancelada"
export type RolUsuario = "admin" | "supervisor" | "agente" | "vendedor"

export interface Lead {
  id: number
  folio: string | null
  id_persona: string | null
  id_vendedor: number | null
  id_campana: number | null
  codigo_referido: string | null
  fuente: FuenteLead | null
  en_cola_revision: boolean

  // Datos de contacto (sensibles cifrados)
  nombre: string
  apellido_paterno: string | null
  apellido_materno: string | null
  telefono: string | null           // cifrado AES-256-GCM
  telefono_hash: string | null      // SHA-256 para deduplicación
  email: string | null              // cifrado AES-256-GCM
  email_hash: string | null         // SHA-256 para deduplicación
  fecha_nacimiento: string | null
  curp: string | null               // cifrado AES-256-GCM
  curp_hash: string | null          // SHA-256 para deduplicación
  estado_ciudad: string | null
  prioridad: PrioridadLead | null

  // Procedimiento
  procedimiento: string | null
  categoria_quirurgica: string | null
  codigo_procedimiento: string | null
  urgencia: UrgenciaQx | null
  fecha_tentativa: string | null
  costo_estimado: number | null
  estancia_estimada: string | null

  // Seguro
  id_aseguradora: number | null
  numero_poliza: string | null      // cifrado AES-256-GCM
  numero_certificado: string | null // cifrado AES-256-GCM
  vigencia_inicio: string | null
  vigencia_fin: string | null
  vigencia_original_inicio: string | null
  suma_asegurada: number | null
  deducible: number | null
  coaseguro_pct: number | null
  tope_coaseguro: number | null
  periodo_espera_cumplido: boolean | null
  titular_poliza: string | null

  // Cobertura
  cubre_cirugias: boolean | null
  requiere_preautorizacion: boolean | null
  cubre_anestesiologo: boolean | null
  cubre_estudios_preop: boolean | null
  cubre_honorarios: boolean | null
  aplica_preexistencia: boolean | null
  numero_autorizacion: string | null
  fecha_autorizacion: string | null
  carta_autorizacion_url: string | null
  contacto_aseguradora: string | null
  exclusiones: string[] | null

  // Asignación
  id_agente: number | null
  id_medico: number | null
  id_hospital: number | null

  // Pipeline
  etapa: EtapaPipeline
  estado: EstadoLead

  notas: string | null
  fecha_captura: string
  fecha_contacto: string | null
  fecha_conversion: string | null
}

export interface Vendedor {
  id: number
  nombre: string
  telefono: string | null
  email: string | null
  id_nivel: number | null
  codigo_unico: string
  activo: boolean
  fecha_registro: string
}

export interface NivelComision {
  id: number
  nombre: string
  monto: number
  descripcion: string | null
  activo: boolean
  orden: number | null
}

export interface Comision {
  id: number
  id_lead: number
  id_vendedor: number
  id_nivel_snapshot: number | null
  monto: number
  estado: EstadoComision
  fecha_conversion: string
  fecha_aprobacion: string | null
  fecha_pago: string | null
  notas: string | null
}

export interface AuditLog {
  id: number
  accion: string
  id_usuario: string | null
  id_recurso: string | null
  meta: Record<string, unknown> | null
  ip: string | null
  timestamp: string
}

// Placeholder para que createClient<Database> funcione
// Se reemplaza con los tipos generados por Supabase CLI
export interface Database {
  public: {
    Tables: {
      leads: { Row: Lead; Insert: Partial<Lead>; Update: Partial<Lead> }
      vendedores: { Row: Vendedor; Insert: Partial<Vendedor>; Update: Partial<Vendedor> }
      niveles_comision: { Row: NivelComision; Insert: Partial<NivelComision>; Update: Partial<NivelComision> }
      comisiones: { Row: Comision; Insert: Partial<Comision>; Update: Partial<Comision> }
      audit_log: { Row: AuditLog; Insert: Partial<AuditLog>; Update: Partial<AuditLog> }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
