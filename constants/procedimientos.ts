export const PROCEDIMIENTOS = [
  // Cardiovascular
  { codigo: "36.0", nombre: "Cateterismo cardíaco", categoria: "Cardiovascular" },
  { codigo: "36.1", nombre: "Bypass coronario", categoria: "Cardiovascular" },
  { codigo: "35.2", nombre: "Reemplazo de válvula cardíaca", categoria: "Cardiovascular" },
  // Ortopedia
  { codigo: "81.54", nombre: "Artroplastia total de rodilla", categoria: "Ortopedia" },
  { codigo: "81.51", nombre: "Artroplastia total de cadera", categoria: "Ortopedia" },
  { codigo: "80.6",  nombre: "Meniscectomía / artroscopia rodilla", categoria: "Ortopedia" },
  { codigo: "79.3",  nombre: "Reducción de fractura", categoria: "Ortopedia" },
  // Digestivo
  { codigo: "51.23", nombre: "Colecistectomía laparoscópica", categoria: "Digestivo" },
  { codigo: "44.38", nombre: "Cirugía de hernia hiatal", categoria: "Digestivo" },
  { codigo: "53.0",  nombre: "Hernioplastia inguinal", categoria: "Digestivo" },
  { codigo: "48.5",  nombre: "Resección de colon", categoria: "Digestivo" },
  // Urología
  { codigo: "60.5",  nombre: "Prostatectomía", categoria: "Urología" },
  { codigo: "56.0",  nombre: "Litotricia / cálculos renales", categoria: "Urología" },
  { codigo: "55.0",  nombre: "Nefrectomía", categoria: "Urología" },
  // Ginecología
  { codigo: "68.4",  nombre: "Histerectomía laparoscópica", categoria: "Ginecología" },
  { codigo: "65.6",  nombre: "Quistectomía ovárica", categoria: "Ginecología" },
  { codigo: "54.3",  nombre: "Miomectomía", categoria: "Ginecología" },
  // Neurología
  { codigo: "01.5",  nombre: "Craneotomía", categoria: "Neurología" },
  { codigo: "03.0",  nombre: "Discectomía / hernia de disco", categoria: "Neurología" },
  { codigo: "81.0",  nombre: "Artrodesis de columna", categoria: "Neurología" },
  // Oftalmología
  { codigo: "13.7",  nombre: "Extracción de catarata", categoria: "Oftalmología" },
  { codigo: "14.4",  nombre: "Desprendimiento de retina", categoria: "Oftalmología" },
  // General
  { codigo: "85.3",  nombre: "Mastectomía", categoria: "General" },
  { codigo: "40.2",  nombre: "Biopsia quirúrgica", categoria: "General" },
  { codigo: "xx.0",  nombre: "Otro procedimiento", categoria: "General" },
] as const
