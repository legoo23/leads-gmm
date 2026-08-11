import { cn } from "@/lib/utils"
import { InputHTMLAttributes, TextareaHTMLAttributes, forwardRef } from "react"

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "_")
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={inputId} className="text-xs font-medium" style={{ color: "var(--muted)" }}>
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "w-full rounded-lg border px-3 h-9 text-sm transition-colors outline-none",
            "focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed",
            className
          )}
          style={{
            background: "var(--surface)",
            borderColor: error ? "var(--negative)" : "var(--border)",
            color: "var(--text)",
          }}
          {...props}
        />
        {error && <p className="text-xs" style={{ color: "var(--negative)" }}>{error}</p>}
      </div>
    )
  }
)
Input.displayName = "Input"

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, className, id, children, ...props }, ref) => {
    const selectId = id ?? label?.toLowerCase().replace(/\s+/g, "_")
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={selectId} className="text-xs font-medium" style={{ color: "var(--muted)" }}>
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={cn(
            "w-full rounded-lg border px-3 h-9 text-sm transition-colors outline-none appearance-none bg-no-repeat",
            "focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed",
            className
          )}
          style={{
            background: "var(--surface)",
            borderColor: error ? "var(--negative)" : "var(--border)",
            color: "var(--text)",
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
            backgroundPosition: "right 10px center",
            backgroundSize: "14px",
            paddingRight: "32px",
          }}
          {...props}
        >
          {children}
        </select>
        {error && <p className="text-xs" style={{ color: "var(--negative)" }}>{error}</p>}
      </div>
    )
  }
)
Select.displayName = "Select"

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const taId = id ?? label?.toLowerCase().replace(/\s+/g, "_")
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={taId} className="text-xs font-medium" style={{ color: "var(--muted)" }}>
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={taId}
          className={cn(
            "w-full rounded-lg border px-3 py-2 text-sm transition-colors outline-none resize-none",
            "focus:ring-2 disabled:opacity-50",
            className
          )}
          style={{
            background: "var(--surface)",
            borderColor: error ? "var(--negative)" : "var(--border)",
            color: "var(--text)",
          }}
          rows={3}
          {...props}
        />
        {error && <p className="text-xs" style={{ color: "var(--negative)" }}>{error}</p>}
      </div>
    )
  }
)
Textarea.displayName = "Textarea"
