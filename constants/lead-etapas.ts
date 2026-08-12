export const ETAPAS_PIPELINE = {
  nuevo: {
    key: "nuevo",
    label: "Nuevo",
    color: "#2563EB",
    bg: "#EFF6FF",
    orden: 1,
  },
  contactado: {
    key: "contactado",
    label: "Contactado",
    color: "#7C3AED",
    bg: "#F5F3FF",
    orden: 2,
  },
  necesidad_identificada: {
    key: "necesidad_identificada",
    label: "Necesidad",
    color: "#0891B2",
    bg: "#ECFEFF",
    orden: 3,
  },
  seguro_identificado: {
    key: "seguro_identificado",
    label: "Seguro GMM",
    color: "#0369A1",
    bg: "#E0F2FE",
    orden: 4,
  },
  viable: {
    key: "viable",
    label: "Viable · Gestoría",
    color: "#059669",
    bg: "#ECFDF5",
    orden: 5,
  },
  programado: {
    key: "programado",
    label: "Programado",
    color: "#065F46",
    bg: "#D1FAE5",
    orden: 6,
  },
  ganado: {
    key: "ganado",
    label: "Ganado ✓",
    color: "#059669",
    bg: "#ECFDF5",
    orden: 7,
    closure: true,
  },
  no_viable: {
    key: "no_viable",
    label: "No Viable",
    color: "#DC2626",
    bg: "#FEF2F2",
    orden: 8,
    closure: true,
  },
  perdido: {
    key: "perdido",
    label: "Perdido",
    color: "#6B7280",
    bg: "#F9FAFB",
    orden: 9,
    closure: true,
  },
} as const

export type EtapaKey = keyof typeof ETAPAS_PIPELINE

export const ETAPAS_ACTIVAS: EtapaKey[] = [
  "nuevo", "contactado", "necesidad_identificada", "seguro_identificado", "viable", "programado",
]

export const ETAPAS_CIERRE: EtapaKey[] = ["ganado", "no_viable", "perdido"]
