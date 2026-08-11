import { cn } from "@/lib/utils"
import { Spinner } from "./spinner"
import { ButtonHTMLAttributes, forwardRef } from "react"

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger"
  size?: "sm" | "md" | "lg"
  loading?: boolean
}

const variants: Record<string, string> = {
  primary:   "text-white",
  secondary: "border",
  ghost:     "border border-transparent",
  danger:    "text-white",
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", loading, disabled, className, children, style, ...props }, ref) => {
    const sizes: Record<string, string> = {
      sm: "text-xs px-3 h-7",
      md: "text-sm px-4 h-9",
      lg: "text-sm px-5 h-10",
    }

    const colorStyle: Record<string, React.CSSProperties> = {
      primary:   { background: "var(--accent)", color: "#fff" },
      secondary: { background: "var(--surface)", color: "var(--text)", borderColor: "var(--border)" },
      ghost:     { background: "transparent", color: "var(--muted)" },
      danger:    { background: "var(--negative)", color: "#fff" },
    }

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed",
          variants[variant],
          sizes[size],
          className
        )}
        style={{ ...colorStyle[variant], ...style }}
        {...props}
      >
        {loading && <Spinner size={14} />}
        {children}
      </button>
    )
  }
)
Button.displayName = "Button"
