import { cn } from "@/lib/utils"

interface BadgeProps {
  label: string
  color?: string
  bg?: string
  size?: "sm" | "md"
}

export function Badge({ label, color = "#6C63D4", bg = "#F0EEFF", size = "md" }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center font-semibold rounded-full whitespace-nowrap",
        size === "sm" ? "text-[10px] px-2 py-0.5" : "text-xs px-2.5 py-1"
      )}
      style={{ background: bg, color }}
    >
      {label}
    </span>
  )
}

export function PrioridadBadge({ prioridad }: { prioridad: string }) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    urgente: { label: "Urgente",  color: "#DC2626", bg: "#FEF2F2" },
    alta:    { label: "Alta",     color: "#D97706", bg: "#FFFBEB" },
    media:   { label: "Media",    color: "#0891B2", bg: "#ECFEFF" },
    baja:    { label: "Baja",     color: "#64748B", bg: "#F8FAFC" },
  }
  const { label, color, bg } = map[prioridad] ?? map.media
  return <Badge label={label} color={color} bg={bg} size="sm" />
}
