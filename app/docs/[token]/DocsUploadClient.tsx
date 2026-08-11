"use client"
import { useState, useCallback } from "react"
import { Upload, CheckCircle, AlertCircle, FileText, CreditCard, Stethoscope, Home, Loader } from "lucide-react"

const DOC_CONFIG: Record<string, { label: string; desc: string; icon: React.FC<{ size?: number; className?: string; color?: string }> }> = {
  poliza:    { label: "Póliza / Carátula de seguro", desc: "PDF, foto de la carátula o tarjeta de la póliza", icon: CreditCard },
  ine:       { label: "INE o Pasaporte", desc: "Ambos lados legibles y vigentes", icon: FileText },
  estudios:  { label: "Estudios e interpretaciones", desc: "Radiografías, laboratorios, resonancias (máx. 3 meses)", icon: Stethoscope },
  domicilio: { label: "Comprobante de domicilio", desc: "Luz, agua, gas o teléfono (máx. 3 meses)", icon: Home },
}

type DocStatus = "pending" | "uploading" | "done" | "error"

export default function DocsUploadClient({
  token, primerNombre, folio, docsRequeridos, expiresAt,
}: {
  token: string
  primerNombre: string
  folio: string
  docsRequeridos: string[]
  expiresAt: string
}) {
  const [statuses, setStatuses] = useState<Record<string, DocStatus>>({})
  const [errors, setErrors]     = useState<Record<string, string>>({})
  const [allDone, setAllDone]   = useState(false)

  const hoursLeft = Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 3600000))

  const setStatus = (tipo: string, status: DocStatus) =>
    setStatuses((s) => ({ ...s, [tipo]: status }))
  const setError = (tipo: string, msg: string) =>
    setErrors((e) => ({ ...e, [tipo]: msg }))

  const upload = useCallback(async (tipo: string, file: File) => {
    setStatus(tipo, "uploading")
    setError(tipo, "")

    const fd = new FormData()
    fd.append("file", file)
    fd.append("tipo", tipo)

    try {
      const res = await fetch(`/api/docs/${token}/upload`, { method: "POST", body: fd })
      const json = await res.json()
      if (!res.ok) {
        setStatus(tipo, "error")
        setError(tipo, json.error ?? "Error al subir")
        return
      }
      setStatus(tipo, "done")
      // Check if all required docs are done
      const newStatuses = { ...statuses, [tipo]: "done" as DocStatus }
      const allCompleted = docsRequeridos.every((d) => newStatuses[d] === "done")
      if (allCompleted) setAllDone(true)
    } catch {
      setStatus(tipo, "error")
      setError(tipo, "Error de conexión. Intenta de nuevo.")
    }
  }, [token, statuses, docsRequeridos])

  if (allDone) {
    return (
      <main style={{ minHeight: "100svh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F0F4F8", padding: "1.5rem" }}>
        <div style={{ maxWidth: 480, width: "100%", textAlign: "center", padding: "2.5rem 2rem", background: "#fff", borderRadius: 20, boxShadow: "0 4px 24px rgba(0,0,0,.08)" }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#ECFDF5", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.25rem" }}>
            <CheckCircle size={32} color="#059669" />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: "#111827", marginBottom: 8 }}>¡Documentos enviados!</h1>
          <p style={{ fontSize: 15, color: "#6B7280", lineHeight: 1.6 }}>
            Tu asesor revisará la documentación y te contactará a la brevedad para confirmar los detalles de tu atención médica.
          </p>
          <p style={{ fontSize: 13, color: "#9CA3AF", marginTop: 24 }}>Puedes cerrar esta ventana.</p>
        </div>
      </main>
    )
  }

  return (
    <main style={{ minHeight: "100svh", background: "#F0F4F8", padding: "1.5rem 1rem 3rem" }}>
      <div style={{ maxWidth: 520, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: "1.75rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Upload size={18} color="#2563EB" />
            </div>
            <div>
              <p style={{ fontSize: 11, color: "#6B7280", margin: 0, letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 500 }}>Repositorio de documentos</p>
              {folio && <p style={{ fontSize: 12, color: "#9CA3AF", margin: 0, fontFamily: "monospace" }}>{folio}</p>}
            </div>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: "#111827", margin: "0 0 4px" }}>
            Hola, {primerNombre} 👋
          </h1>
          <p style={{ fontSize: 14, color: "#6B7280", margin: 0, lineHeight: 1.6 }}>
            Tu asesor necesita los siguientes documentos para gestionar tu atención médica con el seguro.
          </p>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 5, marginTop: 8, background: "#FEF3C7", borderRadius: 8, padding: "4px 10px" }}>
            <AlertCircle size={12} color="#D97706" />
            <span style={{ fontSize: 12, color: "#92400E", fontWeight: 500 }}>
              Link válido por {hoursLeft} hora{hoursLeft !== 1 ? "s" : ""} más
            </span>
          </div>
        </div>

        {/* Document cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {docsRequeridos.map((tipo) => {
            const config = DOC_CONFIG[tipo] ?? { label: tipo, desc: "Sube el documento requerido", icon: FileText }
            const Icon    = config.icon
            const status  = statuses[tipo] ?? "pending"
            const err     = errors[tipo]

            return (
              <div key={tipo} style={{
                background: "#fff",
                borderRadius: 16,
                padding: "1.25rem",
                border: status === "done" ? "1.5px solid #059669"
                       : status === "error" ? "1.5px solid #DC2626"
                       : "1px solid #E5E7EB",
              }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                    background: status === "done" ? "#ECFDF5" : status === "error" ? "#FEF2F2" : "#EFF6FF",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {status === "done" ? <CheckCircle size={18} color="#059669" />
                    : status === "uploading" ? <Loader size={18} color="#2563EB" className="spin" />
                    : status === "error" ? <AlertCircle size={18} color="#DC2626" />
                    : <Icon size={18} color="#2563EB" />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: "#111827", margin: "0 0 2px" }}>{config.label}</p>
                    <p style={{ fontSize: 12, color: "#6B7280", margin: "0 0 10px" }}>{config.desc}</p>
                    {err && (
                      <p style={{ fontSize: 12, color: "#DC2626", margin: "0 0 8px" }}>{err}</p>
                    )}
                    {status === "done" ? (
                      <p style={{ fontSize: 13, color: "#059669", fontWeight: 500, margin: 0 }}>✓ Enviado correctamente</p>
                    ) : status === "uploading" ? (
                      <p style={{ fontSize: 13, color: "#2563EB", margin: 0 }}>Subiendo...</p>
                    ) : (
                      <label style={{
                        display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer",
                        fontSize: 13, fontWeight: 500, color: "#2563EB",
                        padding: "6px 14px", borderRadius: 8,
                        border: "1px solid #BFDBFE", background: "#EFF6FF",
                      }}>
                        <Upload size={13} />
                        {status === "error" ? "Reintentar" : "Seleccionar archivo"}
                        <input
                          type="file"
                          accept=".jpg,.jpeg,.png,.webp,.pdf"
                          style={{ display: "none" }}
                          onChange={(e) => {
                            const f = e.target.files?.[0]
                            if (f) upload(tipo, f)
                            e.target.value = ""
                          }}
                        />
                      </label>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <p style={{ fontSize: 12, color: "#9CA3AF", textAlign: "center", marginTop: "2rem", lineHeight: 1.6 }}>
          Tus documentos se transmiten de forma segura y solo son visibles para tu asesor.<br />
          Formatos aceptados: JPG, PNG, PDF · Máx. 10 MB por archivo.
        </p>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
        input[type="file"]:focus + label { outline: 2px solid #2563EB; }
      `}</style>
    </main>
  )
}
