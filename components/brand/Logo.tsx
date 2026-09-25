// Identidad iHelp Médica — Manual de Marca v2.0
// Marca madre: monograma iH en sello sólido; el punto de la "i" es una cruz médica.

export const BRAND = {
  verde: "#0F6E56",
  verdeClaro: "#E1F5EE",
  gris: "#334155",
  neutro: "#F8FAF9",
  grisMedio: "#8A97A8",
} as const

type SelloVariant = "positiva" | "blanco"

/** Sello iH. "positiva" = verde con letras blancas; "blanco" = sello blanco para fondos verdes u oscuros. */
export function Sello({ size = 40, variant = "positiva", className }: {
  size?: number; variant?: SelloVariant; className?: string
}) {
  const bg = variant === "positiva" ? BRAND.verde : "#FFFFFF"
  const fg = variant === "positiva" ? "#FFFFFF" : BRAND.verde
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className}
      role="img" aria-label="iHelp Médica" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" rx="20" fill={bg} />
      {/* cruz médica (punto de la i) */}
      <rect x="32" y="28.5" width="13" height="5" rx="1" fill={fg} />
      <rect x="36" y="24.5" width="5" height="13" rx="1" fill={fg} />
      {/* i */}
      <rect x="33" y="41" width="10" height="30.5" rx="2.5" fill={fg} />
      {/* H */}
      <rect x="52" y="28" width="10" height="43.5" fill={fg} />
      <rect x="81" y="28" width="10" height="43.5" fill={fg} />
      <rect x="52" y="45.5" width="39" height="9" fill={fg} />
    </svg>
  )
}

/** Wordmark: "iHelp" 700 en gris + "Médica" 400 en verde. Nunca en dos líneas. */
export function Wordmark({ dark = false, className = "" }: { dark?: boolean; className?: string }) {
  return (
    <span className={`whitespace-nowrap ${className}`}>
      <span className="font-bold" style={{ color: dark ? "#FFFFFF" : BRAND.gris }}>iHelp</span>{" "}
      <span className="font-normal" style={{ color: dark ? "#5FC3A5" : BRAND.verde }}>Médica</span>
    </span>
  )
}

export function Logo({ size = 36, dark = false, textClass = "text-xl" }: {
  size?: number; dark?: boolean; textClass?: string
}) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <Sello size={size} />
      <Wordmark dark={dark} className={textClass} />
    </span>
  )
}
