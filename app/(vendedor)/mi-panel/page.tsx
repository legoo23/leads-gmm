import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { ETAPAS_PIPELINE } from "@/constants/lead-etapas"
import { formatDate, formatMXN } from "@/lib/utils"
import { DollarSign, Users, TrendingUp, CheckCircle } from "lucide-react"

export const metadata = { title: "Mi Panel — Leads GMM" }

export default async function MiPanelPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const svc = await createServiceClient()

  // Get vendor record linked to auth user
  const { data: vendedor } = await svc.from("vendedores")
    .select("*, niveles_comision(*)")
    .filter("email", "eq", user.email)
    .maybeSingle()

  // Get leads for this vendor
  const { data: leads } = await svc.from("leads")
    .select("id, folio, nombre, apellido_paterno, etapa, procedimiento, fecha_captura")
    .eq("id_vendedor", vendedor?.id ?? 0)
    .order("fecha_captura", { ascending: false })
    .limit(50)

  // Get commissions
  const { data: comisiones } = await svc.from("comisiones")
    .select("monto, estado, fecha_conversion")
    .eq("id_vendedor", vendedor?.id ?? 0)
    .order("fecha_conversion", { ascending: false })

  const totalLeads = leads?.length ?? 0
  const leadsGanados = leads?.filter((l) => l.etapa === "ganado").length ?? 0
  const comisionesPendientes = comisiones?.filter((c) => c.estado === "pendiente").reduce((a, c) => a + c.monto, 0) ?? 0
  const comisionesAprobadas = comisiones?.filter((c) => c.estado === "aprobada").reduce((a, c) => a + c.monto, 0) ?? 0
  const comisionesPagadas = comisiones?.filter((c) => c.estado === "pagada").reduce((a, c) => a + c.monto, 0) ?? 0

  if (!vendedor) {
    return (
      <div className="flex flex-col items-center py-20 gap-3">
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          No se encontró tu cuenta de vendedor. Contacta al administrador.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-lg font-semibold" style={{ color: "var(--text)" }}>
          Hola, {vendedor.nombre}
        </h1>
        <p className="text-xs mt-0.5" style={{ color: "var(--subtle)" }}>
          Código: <span className="font-mono font-semibold" style={{ color: "var(--accent)" }}>{vendedor.codigo_unico}</span>
          {vendedor.niveles_comision && (
            <> · Nivel: {vendedor.niveles_comision.nombre} ({formatMXN(vendedor.niveles_comision.monto)} por conversión)</>
          )}
        </p>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Leads traídos", value: totalLeads, icon: Users, color: "#2563EB", bg: "#EFF6FF" },
          { label: "Convertidos", value: leadsGanados, icon: CheckCircle, color: "#059669", bg: "#ECFDF5" },
          { label: "Comisiones aprobadas", value: formatMXN(comisionesAprobadas), icon: TrendingUp, color: "#D97706", bg: "#FFFBEB" },
          { label: "Total pagado", value: formatMXN(comisionesPagadas), icon: DollarSign, color: "#7C3AED", bg: "#F5F3FF" },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="rounded-xl border p-4 space-y-2"
            style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: bg }}>
              <Icon size={15} style={{ color }} />
            </div>
            <div className="text-xl font-bold tabular-nums" style={{ color }}>{value}</div>
            <div className="text-xs" style={{ color: "var(--subtle)" }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Leads */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: "var(--muted)" }}>
          Mis leads
        </h2>
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "var(--surface-2)", borderBottom: "1px solid var(--border)" }}>
                {["Folio","Paciente","Procedimiento","Etapa","Fecha"].map((h) => (
                  <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wide"
                    style={{ color: "var(--subtle)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(leads ?? []).length === 0 && (
                <tr><td colSpan={5} className="text-center py-12 text-xs" style={{ color: "var(--subtle)" }}>
                  Aún no tienes leads. Comparte tu código QR para empezar.
                </td></tr>
              )}
              {(leads ?? []).map((lead) => {
                const etapaInfo = ETAPAS_PIPELINE[lead.etapa as keyof typeof ETAPAS_PIPELINE]
                return (
                  <tr key={lead.id} className="border-t hover:bg-[var(--surface-2)] transition-colors"
                    style={{ borderColor: "var(--border)" }}>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs font-semibold" style={{ color: "var(--accent)" }}>{lead.folio}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-medium" style={{ color: "var(--text)" }}>
                        {lead.nombre} {lead.apellido_paterno ?? ""}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs" style={{ color: "var(--muted)" }}>{lead.procedimiento ?? "—"}</span>
                    </td>
                    <td className="px-4 py-3">
                      {etapaInfo && <Badge label={etapaInfo.label} color={etapaInfo.color} bg={etapaInfo.bg} size="sm" />}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs tabular-nums" style={{ color: "var(--subtle)" }}>
                        {formatDate(lead.fecha_captura)}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Comisiones */}
      {(comisiones ?? []).length > 0 && (
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: "var(--muted)" }}>
            Mis comisiones
          </h2>
          <div className="space-y-2">
            {(comisiones ?? []).map((c, i) => {
              const estadoMap: Record<string, { label: string; color: string; bg: string }> = {
                pendiente: { label: "Pendiente", color: "#D97706", bg: "#FFFBEB" },
                aprobada:  { label: "Aprobada",  color: "#059669", bg: "#ECFDF5" },
                pagada:    { label: "Pagada",    color: "#2563EB", bg: "#EFF6FF" },
                cancelada: { label: "Cancelada", color: "#6B7280", bg: "#F9FAFB" },
              }
              const e = estadoMap[c.estado] ?? estadoMap.pendiente
              return (
                <div key={i} className="flex items-center justify-between px-4 py-3 rounded-xl border"
                  style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
                  <div>
                    <span className="text-sm font-semibold tabular-nums" style={{ color: "var(--text)" }}>
                      {formatMXN(c.monto)}
                    </span>
                    <span className="text-xs ml-2" style={{ color: "var(--subtle)" }}>
                      {formatDate(c.fecha_conversion)}
                    </span>
                  </div>
                  <Badge label={e.label} color={e.color} bg={e.bg} size="sm" />
                </div>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}
