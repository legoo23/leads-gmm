"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  FileText, Users, Megaphone, Stethoscope,
  Building2, Headphones, Settings, LayoutDashboard, X
} from "lucide-react"

const HUBS = [
  { href: "/leads",      icon: FileText,    label: "Leads",       roles: ["admin","supervisor","agente"] },
  { href: "/personas",   icon: Users,       label: "Personas",    roles: ["admin","supervisor","agente"] },
  { href: "/marketing",  icon: Megaphone,   label: "Marketing",   roles: ["admin","supervisor"] },
  { href: "/medicos",    icon: Stethoscope, label: "Médicos",     roles: ["admin","supervisor"] },
  { href: "/empresas",   icon: Building2,   label: "Empresas",    roles: ["admin","supervisor"] },
  { href: "/callcenter", icon: Headphones,  label: "Call Center", roles: ["admin","supervisor","agente"] },
  { href: "/admin",      icon: Settings,    label: "Admin",       roles: ["admin"] },
]

interface SidebarProps {
  rol: string
  open?: boolean
  onClose?: () => void
}

export default function Sidebar({ rol, open = false, onClose }: SidebarProps) {
  const pathname = usePathname()
  const items = HUBS.filter((h) => h.roles.includes(rol))

  const content = (
    <>
      {/* Logo */}
      <div className="flex items-center justify-between px-4 h-14 border-b flex-shrink-0"
        style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: "var(--accent)" }}>
            <LayoutDashboard size={14} color="white" />
          </div>
          <span className="font-bold text-sm tracking-tight" style={{ color: "var(--text)" }}>
            Leads GMM
          </span>
        </div>
        {/* Close button — mobile only */}
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--surface-2)] transition-colors"
            style={{ color: "var(--muted)" }}
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        <div className="space-y-0.5">
          {items.map(({ href, icon: Icon, label }) => {
            const active = pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
                style={{
                  background: active ? "var(--accent-bg)" : "transparent",
                  color: active ? "var(--accent)" : "var(--muted)",
                }}
              >
                <Icon size={16} />
                {label}
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t text-xs" style={{ borderColor: "var(--border)", color: "var(--subtle)" }}>
        <span className="uppercase tracking-wider font-semibold">{rol}</span>
      </div>
    </>
  )

  return (
    <>
      {/* Desktop — always visible fixed sidebar */}
      <aside
        className="hidden lg:flex flex-col w-56 flex-shrink-0 h-full border-r"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
      >
        {content}
      </aside>

      {/* Mobile/tablet — overlay drawer */}
      <aside
        className={`
          lg:hidden fixed inset-y-0 left-0 z-50 flex flex-col w-72 border-r
          transition-transform duration-300 ease-in-out
          ${open ? "translate-x-0" : "-translate-x-full"}
        `}
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
      >
        {content}
      </aside>
    </>
  )
}
