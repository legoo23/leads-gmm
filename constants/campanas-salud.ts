export const TEMAS_SALUD: { categoria: string; temas: string[] }[] = [
  {
    categoria: "Salud Mental",
    temas: [
      "Empoderamiento Femenino",
      "Soy mamá y trabajo",
      "Inteligencia Emocional",
      "Risoterapia",
      "Sinergia organizacional",
      "Pausas Activas",
      "Estrés laboral",
    ],
  },
  {
    categoria: "Prevención",
    temas: [
      "Nutrición",
      "Salud Sexual",
      "Enfermedades Cardiovasculares",
      "Obesidad",
      "Tiroides",
      "Ginecología",
      "Higiene de columna",
      "Cáncer de mama",
      "Varices",
      "Cáncer de próstata",
      "Diabetes",
      "Nutrición en el Trabajo",
    ],
  },
]

export const TODAS_LAS_TEMAS: string[] = TEMAS_SALUD.flatMap((c) => c.temas)
