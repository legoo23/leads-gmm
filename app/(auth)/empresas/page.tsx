"use client"
import { useState, useEffect, useCallback } from "react"
import { Plus, Building2, Shield, Users, Phone, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ASEGURADORAS } from "@/constants/aseguradoras"
import { formatDate } from "@/lib/utils"

const ESTADOS_PROSPECTO: { key: string; label: string; color: string; bg: string }[] = [
  { key: "prospecto",        label: "Prospecto",         color: "#6B7280", bg: "#F9FAFB" },
  { key: "contactado",       label: "Contactado",        color: "#2563EB", bg: "#EFF6FF" },
  { key: "cita_agendada",    label: "Cita agendada",     color: "#D97706", bg: "#FEF3C7" },
  { key: "campana_realizada",label: "Campaña realizada", color: "#7C3AED", bg: "#EDE9FE" },
  { key: "convertido",       label: "Convertido",        color: "#059669", bg: "#ECFDF5" },
]

const FUENTE_LABELS: Record<string, string> = {
  whatsapp_bot: "WhatsApp Bot",
  llamada: "Llamada",
  visita: "Visita",
  referido: "Referido",
  otro: "Otro",
}

interface EmpresaProspecto {
  id: number
  nombre_empresa: string
  nombre_contacto: string | null
  cargo: string | null
  telefono: string | null
  num_colaboradores: number | null
  aseguradora: string | null
  fuente: string | null
  estado: string
  notas: string | null
  created_at: string
}

function EstadoSelect({ prospecto, onUpdate }: { prospecto: EmpresaProspecto; onUpdate: (id: number, estado: string) => void }) {
  const [open, setOpen] = useState(false)
  const current = ESTADOS_PROSPECTO.find((e) => e.key === prospecto.estado) ?? ESTADOS_PROSPECTO[0]

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium transition-opacity hover:opacity-80"
        style={{ color: current.color, background: current.bg }}>
        {current.label}
        <ChevronDown size={10} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full z-20 mt-1 w-44 rounded-xl border shadow-lg overflow-hidden"
            style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            {ESTADOS_PROSPECTO.map((e) => (
              <button key={e.key}
                onClick={() => { onUpdate(prospecto.id, e.key); setOpen(false) }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-left transition-colors hover:bg-[var(--surface-2)]"
                style={{ fontWeight: e.key === prospecto.estado ? 600 : 400, color: "var(--text)" }}>
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: e.color }} />
                {e.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default function EmpresasPage() {
  const [tab, setTab] = useState<"aseguradoras" | "prospectos" | "convenios">("prospectos")
  const [prospectos, setProspectos] = useState<EmpresaProspecto[]>([])
  const [loading, setLoading] = useState(false)

  const loadProspectos = useCallback(async () => {
    setLoading(true)
    const res = await fetch("/api/empresas-prospectos")
    if (res.ok) { const j = await res.json(); setProspectos(j.data ?? []) }
    setLoading(false)
  }, [])

  useEffect(() => {
    if (tab === "prospectos") loadProspectos()
  }, [tab, loadProspectos])

  async function updateEstado(id: number, estado: string) {
    setProspectos((ps) => ps.map((p) => p.id === id ? { ...p, estado } : p))
    await fetch("/api/empresas-prospectos", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, estado }),
    })
  }

  const TABS = [
    { key: "prospectos",   label: "Empresas prospectos" },
    { key: "aseguradoras", label: "Aseguradoras" },
    { key: "convenios",    label: "Con convenio" },
  ] as const

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold" style={{ color: "var(--text)" }}>Empresas</h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--subtle)" }}>
            Prospectos B2B, aseguradoras y convenios
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b" style={{ borderColor: "var(--border)" }}>
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className="px-4 py-2.5 text-xs font-medium transition-colors border-b-2"
            style={{
              borderColor: tab === t.key ? "var(--accent)" : "transparent",
              color: tab === t.key ? "var(--accent)" : "var(--muted)",
            }}>
            {t.label}
            {t.key === "prospectos" && prospectos.length > 0 && (
              <span className="ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
                style={{ background: "var(--accent-bg)", color: "var(--accent)" }}>
                {prospectos.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Prospectos tab */}
      {tab === "prospectos" && (
        <div className="space-y-3">
          {loading && (
            <div className="text-center py-12 text-xs" style={{ color: "var(--subtle)" }}>Cargando...</div>
          )}
          {!loading && prospectos.length === 0 && (
            <div className="flex flex-col items-center py-16 gap-2">
              <Building2 size={28} style={{ color: "var(--border)" }} />
              <p className="text-xs" style={{ color: "var(--subtle)" }}>
                Sin empresas prospectos. Llegarán desde el bot de WhatsApp cuando alguien use un código de campaña.
              </p>
            </div>
          )}
          {prospectos.map((p) => (
            <div key={p.id} className="rounded-xl border p-4"
              style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "var(--accent-bg)" }}>
                    <Building2 size={15} style={{ color: "var(--accent)" }} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                        {p.nombre_empresa}
                      </span>
                      {p.fuente && (
                        <Badge
                          label={FUENTE_LABELS[p.fuente] ?? p.fuente}
                          color="#6B7280" bg="#F3F4F6" size="sm" />
                      )}
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1">
                      {p.nombre_contacto && (
                        <span className="text-xs" style={{ color: "var(--muted)" }}>
                          {p.nombre_contacto}{p.cargo ? ` · ${p.cargo}` : ""}
                        </span>
                      )}
                      {p.telefono && (
                        <span className="flex items-center gap-1 text-xs" style={{ color: "var(--muted)" }}>
                          <Phone size={10} />
                          {p.telefono}
                        </span>
                      )}
                      {p.num_colaboradores != null && (
                        <span className="flex items-center gap-1 text-xs" style={{ color: "var(--muted)" }}>
                          <Users size={10} />
                          {p.num_colaboradores} colaboradores
                        </span>
                      )}
                      {p.aseguradora && (
                        <span className="text-xs" style={{ color: "var(--muted)" }}>
                          Seguro: {p.aseguradora}
                        </span>
                      )}
                    </div>
                    {p.notas && (
                      <p className="text-xs mt-1 line-clamp-1" style={{ color: "var(--subtle)" }}>{p.notas}</p>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <EstadoSelect prospecto={p} onUpdate={updateEstado} />
                  <span className="text-[10px]" style={{ color: "var(--subtle)" }}>
                    {formatDate(p.created_at)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Aseguradoras tab */}
      {tab === "aseguradoras" && (
        <div className="grid grid-cols-3 gap-3">
          {ASEGURADORAS.map((a) => (
            <div key={a.id} className="rounded-xl border p-4 flex items-center gap-3"
              style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: "var(--accent-bg)" }}>
                <Shield size={14} style={{ color: "var(--accent)" }} />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold truncate" style={{ color: "var(--text)" }}>{a.nombre}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Convenios tab */}
      {tab === "convenios" && (
        <div className="flex flex-col items-center py-16 gap-2">
          <Building2 size={28} style={{ color: "var(--border)" }} />
          <p className="text-xs" style={{ color: "var(--subtle)" }}>Sin empresas con convenio registradas</p>
          <Button size="sm">
            <Plus size={12} />
            Agregar empresa
          </Button>
        </div>
      )}
    </div>
  )
}
