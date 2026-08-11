/*
 * leads-gmm — Catálogo de procedimientos quirúrgicos
 * Copyright © 2026 Alejandro Legorreta Barrera. Todos los derechos reservados.
 */

export interface Procedimiento {
  id: string
  nombre: string
  categoria: string
  codigoCie9?: string
  codigoCpt?: string
}

export const PROCEDIMIENTOS: Procedimiento[] = [
  // Cirugía General
  { id: "colecistectomia",        nombre: "Colecistectomía laparoscópica",          categoria: "Cirugía General",    codigoCie9: "51.23" },
  { id: "apendicectomia",         nombre: "Apendicectomía",                          categoria: "Cirugía General",    codigoCie9: "47.09" },
  { id: "hernia_inguinal",        nombre: "Hernioplastía inguinal",                  categoria: "Cirugía General",    codigoCie9: "53.04" },
  { id: "hernia_umbilical",       nombre: "Hernioplastía umbilical",                 categoria: "Cirugía General",    codigoCie9: "53.49" },
  { id: "colostomia",             nombre: "Colostomía",                              categoria: "Cirugía General",    codigoCie9: "46.10" },
  // Ortopedia y Traumatología
  { id: "artroscopia_rodilla",    nombre: "Artroscopía de rodilla",                  categoria: "Ortopedia",          codigoCpt: "29881" },
  { id: "protesis_cadera",        nombre: "Artroplastía total de cadera",            categoria: "Ortopedia",          codigoCpt: "27130" },
  { id: "protesis_rodilla",       nombre: "Artroplastía total de rodilla",           categoria: "Ortopedia",          codigoCpt: "27447" },
  { id: "fractura_reduccion",     nombre: "Reducción y fijación de fractura",        categoria: "Ortopedia",          codigoCie9: "79.39" },
  // Columna
  { id: "discectomia",            nombre: "Discectomía lumbar",                      categoria: "Columna",            codigoCpt: "63030" },
  { id: "fusion_vertebral",       nombre: "Fusión vertebral (artrodesis)",           categoria: "Columna",            codigoCpt: "22612" },
  // Ginecología
  { id: "histerectomia",          nombre: "Histerectomía total abdominal",           categoria: "Ginecología",        codigoCie9: "68.49" },
  { id: "miomectomia",            nombre: "Miomectomía laparoscópica",               categoria: "Ginecología",        codigoCie9: "68.29" },
  { id: "ooforectomia",           nombre: "Ooforectomía",                            categoria: "Ginecología",        codigoCie9: "65.39" },
  // Urología
  { id: "prostatectomia",         nombre: "Prostatectomía radical",                  categoria: "Urología",           codigoCpt: "55840" },
  { id: "nefrectomia",            nombre: "Nefrectomía",                             categoria: "Urología",           codigoCie9: "55.51" },
  { id: "cistoscopia",            nombre: "Cistoscopía diagnóstica",                 categoria: "Urología",           codigoCpt: "52000" },
  // Cardiovascular
  { id: "bypass_coronario",       nombre: "Bypass coronario (CRM)",                 categoria: "Cardiovascular",     codigoCpt: "33533" },
  { id: "valvuloplastia",         nombre: "Valvuloplastía",                          categoria: "Cardiovascular",     codigoCpt: "33420" },
  { id: "cateterismo",            nombre: "Cateterismo cardíaco diagnóstico",        categoria: "Cardiovascular",     codigoCpt: "93460" },
  // Neurología
  { id: "craniotomia",            nombre: "Craneotomía",                             categoria: "Neurocirugía",       codigoCie9: "01.39" },
  { id: "descompresion_nervio",   nombre: "Descompresión de nervio periférico",      categoria: "Neurocirugía",       codigoCpt: "64721" },
  // Oftalmología
  { id: "catarata",               nombre: "Facoemulsificación (catarata)",            categoria: "Oftalmología",       codigoCpt: "66984" },
  { id: "glaucoma",               nombre: "Trabeculectomía (glaucoma)",              categoria: "Oftalmología",       codigoCpt: "66170" },
  // Otro
  { id: "otro",                   nombre: "Otro procedimiento",                       categoria: "Otro" },
]

export const CATEGORIAS_QUIRURGICAS = [
  ...new Set(PROCEDIMIENTOS.map((p) => p.categoria)),
]

export function getProcedimientosByCategoria(
  categoria: string
): Procedimiento[] {
  return PROCEDIMIENTOS.filter((p) => p.categoria === categoria)
}
