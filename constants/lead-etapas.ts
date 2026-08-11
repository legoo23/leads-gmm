/*
 * leads-gmm — Pipeline GMM Cirugía con Seguro
 * Copyright © 2026 Alejandro Legorreta Barrera. Todos los derechos reservados.
 *
 * Decisión de arquitectura: la etapa activa se almacena en la columna SQL `etapa`
 * del lead (no en el campo notas como workarounds de sistemas anteriores).
 * Esto permite filtrar directamente por etapa en queries de Supabase.
 */

export interface EtapaConfig {
  key: string
  label: string
  color: string
  bg: string
  sla?: string
  descripcion?: string
  final?: boolean
  positivo?: boolean
  // false = etapa de cierre negativo disponible desde cualquier etapa activa
  manualSelect?: boolean
}

export const ETAPAS_PIPELINE_GMM: EtapaConfig[] = [
  {
    key: "nuevo",
    label: "Nuevo",
    color: "#6C63D4",
    bg: "#F0EEFF",
    sla: "Contactar en < 2 h",
    descripcion: "Solicitud recibida. Puede venir de QR, formulario web, llamada o bot de WhatsApp.",
  },
  {
    key: "contactado",
    label: "Contactado",
    color: "#0891B2",
    bg: "#ECFEFF",
    descripcion: "Primer contacto real confirmado con el paciente o su representante.",
  },
  {
    key: "necesidad_identificada",
    label: "Necesidad Identificada",
    color: "#D97706",
    bg: "#FFFBEB",
    descripcion: "Procedimiento quirúrgico, diagnóstico y padecimientos capturados.",
  },
  {
    key: "seguro_identificado",
    label: "Seguro Identificado",
    color: "#7C3AED",
    bg: "#F5F3FF",
    descripcion: "Aseguradora, póliza, vigencia, deducible y coaseguro registrados.",
  },
  {
    key: "en_validacion",
    label: "En Validación",
    color: "#DC6026",
    bg: "#FFF4ED",
    sla: "48–72 h hábiles",
    descripcion: "Verificando cobertura con la aseguradora. Pendiente carta de autorización.",
  },
  {
    key: "viable",
    label: "Viable",
    color: "#0369A1",
    bg: "#EFF6FF",
    descripcion: "Aseguradora confirmó cobertura. Paciente acepta proceder.",
  },
  {
    key: "programado",
    label: "Programado",
    color: "#0EA5E9",
    bg: "#F0F9FF",
    descripcion: "Fecha, médico y hospital asignados. Carta de autorización subida.",
  },
  {
    key: "ganado",
    label: "Ganado",
    color: "#059669",
    bg: "#ECFDF5",
    descripcion: "Procedimiento confirmado. Se activa comisión del vendedor referidor.",
    final: true,
    positivo: true,
  },
  {
    key: "no_viable",
    label: "No Viable",
    color: "#DC2626",
    bg: "#FEF2F2",
    descripcion: "Seguro rechazó: preexistencia, exclusión, período de espera activo o suma insuficiente.",
    final: true,
    positivo: false,
  },
  {
    key: "perdido",
    label: "Perdido",
    color: "#64748B",
    bg: "#F8FAFC",
    descripcion: "Sin interés, sin respuesta tras 3 intentos, o fuera de alcance del servicio.",
    final: true,
    positivo: false,
  },
]

export const ETAPAS_MAP = Object.fromEntries(
  ETAPAS_PIPELINE_GMM.map((e) => [e.key, e])
) as Record<string, EtapaConfig>

export function getEtapa(key: string): EtapaConfig {
  return ETAPAS_MAP[key] ?? ETAPAS_PIPELINE_GMM[0]
}

export function estadoFromEtapa(etapa: EtapaConfig): "activo" | "convertido" | "perdido" {
  if (!etapa.final) return "activo"
  return etapa.positivo ? "convertido" : "perdido"
}

// Etapas disponibles como opciones activas (no finales negativas — se muestran
// como acciones de cierre en un panel separado para evitar cierres accidentales)
export const ETAPAS_ACTIVAS = ETAPAS_PIPELINE_GMM.filter(
  (e) => !e.final || e.positivo
)

export const ETAPAS_CIERRE_NEGATIVO = ETAPAS_PIPELINE_GMM.filter(
  (e) => e.final && !e.positivo
)
