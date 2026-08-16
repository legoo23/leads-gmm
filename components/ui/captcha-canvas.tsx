"use client"
import { useState, useRef, useEffect, useCallback } from "react"
import { RefreshCw, Shield } from "lucide-react"

type Challenge = { a: number; b: number; op: string; result: number }

const inputStyle: React.CSSProperties = {
  height: 44, padding: "0 12px", border: "1px solid var(--border)",
  borderRadius: 10, background: "var(--surface)", color: "var(--text)",
  fontSize: 14, outline: "none", flex: 1,
}

export function CaptchaCanvas({ onVerified }: { onVerified: (ok: boolean) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [answer, setAnswer] = useState("")
  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [captchaErr, setCaptchaErr] = useState<string | null>(null)

  const newChallenge = useCallback(() => {
    const r = Math.random()
    let a: number, b: number, op: string, result: number
    if (r < 0.45) {
      a = Math.floor(Math.random() * 15) + 2; b = Math.floor(Math.random() * 15) + 2
      op = "+"; result = a + b
    } else if (r < 0.75) {
      a = Math.floor(Math.random() * 10) + 6; b = Math.floor(Math.random() * (a - 1)) + 1
      op = "−"; result = a - b
    } else {
      a = Math.floor(Math.random() * 7) + 2; b = Math.floor(Math.random() * 4) + 2
      op = "×"; result = a * b
    }
    setChallenge({ a, b, op, result })
    setAnswer(""); onVerified(false); setCaptchaErr(null)
  }, [onVerified])

  useEffect(() => { newChallenge() }, [newChallenge])

  useEffect(() => {
    if (!challenge || !canvasRef.current) return
    const canvas = canvasRef.current
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const W = 240, H = 56
    canvas.width = W * dpr; canvas.height = H * dpr
    canvas.style.width = "100%"; canvas.style.height = H + "px"
    const ctx = canvas.getContext("2d")!
    ctx.scale(dpr, dpr)
    ctx.fillStyle = "#EEF2FF"; ctx.fillRect(0, 0, W, H)
    for (let i = 0; i < 55; i++) {
      ctx.fillStyle = `rgba(99,102,241,${0.04 + Math.random() * 0.09})`
      ctx.beginPath(); ctx.arc(Math.random() * W, Math.random() * H, Math.random() * 2.5, 0, Math.PI * 2); ctx.fill()
    }
    for (let l = 0; l < 3; l++) {
      ctx.beginPath(); ctx.strokeStyle = `rgba(99,102,241,${0.07 + Math.random() * 0.07})`
      ctx.lineWidth = 0.8; ctx.moveTo(0, 12 + Math.random() * 32)
      for (let x = 20; x <= W; x += 20) ctx.lineTo(x, 10 + Math.random() * 36)
      ctx.stroke()
    }
    const text = `${challenge.a}  ${challenge.op}  ${challenge.b}  =  ?`
    ctx.font = "bold 22px system-ui, -apple-system, sans-serif"; ctx.textBaseline = "middle"
    const totalW = Array.from(text).reduce((acc, c) => acc + ctx.measureText(c).width, 0)
    let curX = (W - totalW) / 2
    Array.from(text).forEach((char) => {
      const cw = ctx.measureText(char).width; const cx = curX + cw / 2
      const cy = H / 2 + (Math.random() * 5 - 2.5)
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(Math.random() * 0.26 - 0.13); ctx.textAlign = "center"
      if (char === "?") ctx.fillStyle = "#DC2626"
      else if (["+", "−", "×", "="].includes(char)) ctx.fillStyle = "#2563EB"
      else ctx.fillStyle = "#1e3a8a"
      ctx.fillText(char, 0, 0); ctx.restore(); curX += cw
    })
  }, [challenge])

  function verify() {
    if (!challenge || answer.trim() === "") return
    if (parseInt(answer.trim(), 10) === challenge.result) {
      onVerified(true); setCaptchaErr(null)
    } else {
      setCaptchaErr("Respuesta incorrecta, intenta de nuevo.")
      onVerified(false); newChallenge()
    }
  }

  return (
    <div className="rounded-2xl border p-4 space-y-3"
      style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
      <div className="flex items-center gap-2 pb-1 border-b" style={{ borderColor: "var(--border)" }}>
        <Shield size={14} style={{ color: "var(--accent)" }} />
        <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--muted)" }}>
          Verificación de seguridad
        </span>
      </div>
      <p className="text-xs" style={{ color: "var(--muted)" }}>
        Resuelve el cálculo para confirmar que eres una persona:
      </p>
      <div className="flex items-center gap-2">
        <canvas ref={canvasRef} style={{ borderRadius: 8, border: "1px solid #C7D2FE", flex: 1 }} />
        <button type="button" onClick={newChallenge} title="Nuevo cálculo"
          style={{ padding: 8, borderRadius: 8, border: "1px solid var(--border)",
            background: "var(--bg)", cursor: "pointer", flexShrink: 0 }}>
          <RefreshCw size={16} style={{ color: "var(--muted)" }} />
        </button>
      </div>
      <div className="flex gap-2">
        <input type="text" inputMode="numeric" pattern="[0-9-]*" value={answer}
          onChange={(e) => { setAnswer(e.target.value); setCaptchaErr(null); onVerified(false) }}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); verify() } }}
          placeholder="Tu respuesta..."
          style={{ ...inputStyle, borderColor: captchaErr ? "var(--negative)" : "var(--border)" }}
        />
        <button type="button" onClick={verify}
          style={{ height: 44, padding: "0 16px", borderRadius: 10, background: "var(--accent)",
            color: "white", fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer", flexShrink: 0 }}>
          OK
        </button>
      </div>
      {captchaErr && <p className="text-xs" style={{ color: "var(--negative)" }}>{captchaErr}</p>}
    </div>
  )
}
