/*
 * leads-gmm — Cifrado de datos personales (PII)
 * Copyright © 2026 Alejandro Legorreta Barrera. Todos los derechos reservados.
 *
 * Implementa cifrado AES-256-GCM para campos sensibles antes de escribir en BD.
 * La clave de cifrado (DATA_ENCRYPTION_KEY) vive en Vercel Secrets y nunca
 * se almacena en la base de datos ni en el código fuente.
 *
 * Campos cifrados: CURP, teléfono, email, número de póliza, número de certificado.
 * Además se almacena un hash SHA-256 de cada campo para permitir búsquedas
 * y deduplicación sin exponer el dato real.
 *
 * Sin DATA_ENCRYPTION_KEY los datos cifrados en Supabase son ilegibles,
 * lo que protege la información incluso ante acceso no autorizado a la BD.
 */

import crypto from "crypto"

const ALGORITHM = "aes-256-gcm"
const IV_LENGTH = 12   // bytes — GCM standard
const TAG_LENGTH = 16  // bytes — auth tag

function getKey(): Buffer {
  const keyHex = process.env.DATA_ENCRYPTION_KEY
  if (!keyHex) throw new Error("[leads-gmm] DATA_ENCRYPTION_KEY no configurada")
  const key = Buffer.from(keyHex, "hex")
  if (key.length !== 32) throw new Error("[leads-gmm] DATA_ENCRYPTION_KEY debe ser 64 hex chars (32 bytes)")
  return key
}

// Cifra un string; devuelve "iv:tag:ciphertext" en base64 separados por ":"
export function encryptField(plaintext: string | null | undefined): string | null {
  if (plaintext == null || plaintext === "") return null
  const key = getKey()
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, { authTagLength: TAG_LENGTH })
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()])
  const tag = cipher.getAuthTag()
  return `${iv.toString("base64")}:${tag.toString("base64")}:${encrypted.toString("base64")}`
}

// Descifra un valor generado por encryptField
export function decryptField(ciphertext: string | null | undefined): string | null {
  if (ciphertext == null || ciphertext === "") return null
  const key = getKey()
  const parts = ciphertext.split(":")
  if (parts.length !== 3) throw new Error("Formato de cifrado inválido")
  const [ivB64, tagB64, dataB64] = parts
  const iv = Buffer.from(ivB64, "base64")
  const tag = Buffer.from(tagB64, "base64")
  const data = Buffer.from(dataB64, "base64")
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, { authTagLength: TAG_LENGTH })
  decipher.setAuthTag(tag)
  return decipher.update(data).toString("utf8") + decipher.final("utf8")
}

// Hash determinístico SHA-256 para búsquedas y deduplicación
// No es reversible — solo sirve para comparar, no para mostrar
export function hashField(value: string | null | undefined): string | null {
  if (value == null || value === "") return null
  const key = process.env.DATA_ENCRYPTION_KEY
  if (!key) throw new Error("[leads-gmm] DATA_ENCRYPTION_KEY no configurada")
  return crypto
    .createHmac("sha256", key)
    .update(value.toLowerCase().trim())
    .digest("hex")
}

// Genera una clave de cifrado aleatoria (uso único en setup)
export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString("hex")
}

// Mascara para display en UI (muestra solo los últimos N caracteres)
export function maskField(value: string | null | undefined, visibleChars = 4): string {
  if (!value) return "—"
  if (value.length <= visibleChars) return "*".repeat(value.length)
  return "*".repeat(value.length - visibleChars) + value.slice(-visibleChars)
}
