/*
 * leads-gmm — Software propietario
 * Copyright © 2026 Alejandro Legorreta Barrera. Todos los derechos reservados.
 *
 * Este software es propiedad exclusiva de Alejandro Legorreta Barrera.
 * Queda estrictamente prohibido sin autorización escrita del titular:
 *   - Copiar, reproducir o distribuir este software o cualquiera de sus partes
 *   - Vender, sublicenciar o transferir el software a terceros
 *   - Modificar, adaptar o crear obras derivadas
 *   - Usar el software para fines comerciales fuera del alcance autorizado
 *   - Realizar ingeniería inversa o descompilar el código
 *
 * La base de datos, registros de pacientes, pólizas y cualquier información
 * almacenada en el sistema NO forman parte de ninguna cesión del software.
 * Los datos personales son propiedad de los titulares conforme a la LFPDPPP.
 *
 * Cualquier cesión o licenciamiento requiere acuerdo legal firmado por el titular.
 * El candado de licencia garantiza que el software no opera sin autorización.
 */

import crypto from "crypto"

// Llave pública RSA embebida — generada y retenida por Alejandro Legorreta Barrera
// La llave privada correspondiente nunca se incluye en este repositorio.
// Para generar nuevas licencias (ej. transferencia legal del software) se
// requiere la llave privada en poder exclusivo del titular del software.
const LICENSE_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA7tT8jvXMbI5WY6VRH0XL
Sko6Pr2urUwPtTHFOeYsNGlbI6eLuySp2CL3nB/TsulSqwGb5vvt/Rg0xsE1XzrH
7eaLhcHIbGx180Ap6wotsed7R9OYb30ixRSa9JeyqjHUd1dxN7t9jJV0eevb21Jw
LzBRyDjiDbVWjUGXvt8Yb5poebXVWWA/xNYeeXqKRDWMT5FRS0/QhlYdmnkDMGOk
zsjkyuvo4ZB9dVOHxZbHL9SNEFaapgr69tsHzqgmhY+XtzW3Mtd0CwzCppfOZgYm
RPxccf/wuwykEbN7r0Ci7oxQ08EHq5iMRZlDXJj7ajcbDlWPlTLgLlM+emPxVc/P
8QIDAQAB
-----END PUBLIC KEY-----`

export interface LicenseInfo {
  product: string
  owner: string
  licensee: string
  issued: string
  expires: string | null
}

export interface LicenseResult {
  valid: boolean
  info: LicenseInfo | null
  error?: string
}

export function verifyLicense(licenseKey: string | undefined): LicenseResult {
  if (!licenseKey) {
    return { valid: false, info: null, error: "LICENSE_KEY no configurada" }
  }

  const parts = licenseKey.split(".")
  if (parts.length < 2) {
    return { valid: false, info: null, error: "Formato de licencia inválido" }
  }

  const [payloadB64, sig] = [parts[0], parts.slice(1).join(".")]

  try {
    const verify = crypto.createVerify("RSA-SHA256")
    verify.update(payloadB64)
    const isValid = verify.verify(LICENSE_PUBLIC_KEY, sig, "base64")

    if (!isValid) {
      return { valid: false, info: null, error: "Firma de licencia inválida" }
    }

    const info: LicenseInfo = JSON.parse(
      Buffer.from(payloadB64, "base64").toString("utf8")
    )

    if (info.expires && new Date(info.expires) < new Date()) {
      return { valid: false, info, error: "Licencia expirada" }
    }

    return { valid: true, info }
  } catch {
    return { valid: false, info: null, error: "Error al verificar la licencia" }
  }
}

let _cachedResult: LicenseResult | null = null

export function checkLicense(): LicenseResult {
  if (_cachedResult) return _cachedResult
  _cachedResult = verifyLicense(process.env.LICENSE_KEY)
  return _cachedResult
}

export function assertLicense(): void {
  const result = checkLicense()
  if (!result.valid) {
    throw new Error(
      `[leads-gmm] Licencia inválida: ${result.error}. ` +
        "Contacte a Alejandro Legorreta Barrera para obtener una licencia válida."
    )
  }
}
