import Link from "next/link"
import { Users, DollarSign, Megaphone, QrCode } from "lucide-react"

const CARDS = [
  { href: "/marketing/vendedores", icon: Users,      label: "Vendedores",  desc: "Gestionar vendedores y códigos QR" },
  { href: "/marketing/comisiones", icon: DollarSign, label: "Comisiones",  desc: "Aprobar y liquidar comisiones" },
  { href: "/marketing/campanas",   icon: Megaphone,  label: "Campañas",    desc: "Crear y gestionar campañas activas" },
]

export const metadata = { title: "Marketing Hub" }

export default function MarketingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold" style={{ color: "var(--text)" }}>Marketing Hub</h1>
        <p className="text-xs mt-0.5" style={{ color: "var(--subtle)" }}>Vendedores, comisiones y campañas</p>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {CARDS.map(({ href, icon: Icon, label, desc }) => (
          <Link key={href} href={href}>
            <div className="rounded-xl border p-5 hover:shadow-sm transition-all cursor-pointer group"
              style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                style={{ background: "var(--accent-bg)" }}>
                <Icon size={18} style={{ color: "var(--accent)" }} />
              </div>
              <h2 className="text-sm font-semibold" style={{ color: "var(--text)" }}>{label}</h2>
              <p className="text-xs mt-1" style={{ color: "var(--subtle)" }}>{desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
