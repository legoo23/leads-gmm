/*
 * leads-gmm — Catálogo de aseguradoras GMM México
 * Copyright © 2026 Alejandro Legorreta Barrera. Todos los derechos reservados.
 */

export interface Aseguradora {
  id: string
  nombre: string
  nombreCorto: string
}

export const ASEGURADORAS: Aseguradora[] = [
  { id: "gnp",        nombre: "GNP Seguros",                     nombreCorto: "GNP" },
  { id: "axa",        nombre: "AXA Seguros",                     nombreCorto: "AXA" },
  { id: "mapfre",     nombre: "MAPFRE Seguros",                  nombreCorto: "MAPFRE" },
  { id: "metlife",    nombre: "MetLife México",                   nombreCorto: "MetLife" },
  { id: "qualitas",   nombre: "Quálitas Compañía de Seguros",    nombreCorto: "Quálitas" },
  { id: "zurich",     nombre: "Zurich Seguros",                  nombreCorto: "Zurich" },
  { id: "atlas",      nombre: "Seguros Atlas",                   nombreCorto: "Atlas" },
  { id: "bx",         nombre: "Seguros BX+",                    nombreCorto: "BX+" },
  { id: "cigna",      nombre: "Cigna",                          nombreCorto: "Cigna" },
  { id: "sura",       nombre: "SURA Seguros",                    nombreCorto: "SURA" },
  { id: "bbva",       nombre: "BBVA Seguros",                    nombreCorto: "BBVA Seguros" },
  { id: "allianz",    nombre: "Allianz México",                  nombreCorto: "Allianz" },
  { id: "monterrey",  nombre: "Monterrey New York Life",         nombreCorto: "Monterrey NYL" },
  { id: "inbursa",    nombre: "Seguros Inbursa",                 nombreCorto: "Inbursa" },
  { id: "chubb",      nombre: "Chubb Seguros México",            nombreCorto: "Chubb" },
  { id: "otro",       nombre: "Otro",                            nombreCorto: "Otro" },
]

export const ASEGURADORA_MAP = Object.fromEntries(
  ASEGURADORAS.map((a) => [a.id, a])
) as Record<string, Aseguradora>
