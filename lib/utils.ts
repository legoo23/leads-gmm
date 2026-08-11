/*
 * leads-gmm — Utilidades core del sistema
 * Copyright © 2026 Alejandro Legorreta Barrera. Todos los derechos reservados.
 */

// Normaliza a exactamente 10 dígitos o devuelve '' — nunca trunca
export const normalizePhone = (p: unknown): string => {
  const digits = String(p ?? "").replace(/\D/g, "")
  return digits.length === 10 ? digits : ""
}

export const normalizeEmail = (e: unknown): string =>
  String(e ?? "").trim().toLowerCase()

export const normalizeCurp = (c: unknown): string =>
  String(c ?? "").trim().toUpperCase().replace(/\s/g, "")

// Caracteres sin O/0/I/1 para evitar confusión visual en códigos impresos
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"

export function generateVendorCode(prefix: string, length = 6): string {
  const random = Array.from(
    { length },
    () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]
  ).join("")
  return `${prefix.toUpperCase()}-${random}`
}

export function generateFolio(): string {
  const prefix = process.env.NEXT_PUBLIC_VENDOR_CODE_PREFIX ?? "GMM"
  const date = new Date()
  const yy = String(date.getFullYear()).slice(2)
  const mm = String(date.getMonth() + 1).padStart(2, "0")
  const dd = String(date.getDate()).padStart(2, "0")
  const rand = Array.from({ length: 4 }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join("")
  return `${prefix}-${yy}${mm}${dd}-${rand}`
}

export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(" ")
}

// Formatea número como moneda MXN
export function formatMXN(amount: number | null | undefined): string {
  if (amount == null) return "—"
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}
