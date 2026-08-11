"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { Search, Users } from "lucide-react"
import { formatDate } from "@/lib/utils"

interface Persona {
  id: number; nombre: string; apellido_paterno: string | null
  telefono: string | null; email: string | null; curp: string | null
  leads_count: number; fecha_primer_lead: string
}

export default function PersonasPage() {
  const [personas, setPersonas] = useState<Persona[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState("")

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams({ limit: "100" })
    if (q) params.set("q", q)
    fetch(`/api/personas?${params}`)
      .then((r) => r.json())
      .then(({ data }) => setPersonas(data ?? []))
      .finally(() => setLoading(false))
  }, [q])

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-semibold" style={{ color: "var(--text)" }}>Personas</h1>
        <p className="text-xs mt-0.5" style={{ color: "var(--subtle)" }}>Expediente unificado de pacientes</p>
      </div>

      <div className="relative max-w-sm">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--subtle)" }} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por nombre, teléfono, CURP..."
          className="w-full h-8 pl-8 pr-3 rounded-lg text-xs border outline-none"
          style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text)" }}
        />
      </div>

      <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "var(--surface-2)", borderBottom: "1px solid var(--border)" }}>
              {["Paciente","Teléfono","Email","CURP","Leads","Primer contacto"].map((h) => (
                <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wide"
                  style={{ color: "var(--subtle)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={6} className="text-center py-10 text-xs" style={{ color: "var(--subtle)" }}>Cargando...</td></tr>}
            {!loading && personas.length === 0 && (
              <tr>
                <td colSpan={6}>
                  <div className="flex flex-col items-center py-16 gap-2">
                    <Users size={28} style={{ color: "var(--border)" }} />
                    <p className="text-xs" style={{ color: "var(--subtle)" }}>Sin personas registradas</p>
                  </div>
                </td>
              </tr>
            )}
            {personas.map((p) => (
              <tr key={p.id} className="border-t hover:bg-[var(--surface-2)] transition-colors"
                style={{ borderColor: "var(--border)" }}>
                <td className="px-4 py-3">
                  <span className="text-xs font-medium" style={{ color: "var(--text)" }}>
                    {p.nombre} {p.apellido_paterno ?? ""}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs tabular-nums" style={{ color: "var(--muted)" }}>{p.telefono ?? "—"}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs" style={{ color: "var(--muted)" }}>{p.email ?? "—"}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="font-mono text-xs" style={{ color: "var(--subtle)" }}>{p.curp ?? "—"}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs font-semibold" style={{ color: "var(--accent)" }}>{p.leads_count}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs tabular-nums" style={{ color: "var(--subtle)" }}>
                    {formatDate(p.fecha_primer_lead)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
