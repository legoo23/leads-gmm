// 12 semanas de estrategias de contenido para redes sociales
// Se muestran según la semana del año, rotando cíclicamente

export interface EstrategiaRed {
  titulo: string
  descripcion: string
  mensaje: string      // Texto listo para copiar/compartir
  hashtags: string[]
}

export interface EstrategiaSemana {
  semana: number       // 1-12
  tema: string
  objetivo: string
  facebook: EstrategiaRed
  instagram: EstrategiaRed
  linkedin: EstrategiaRed
  x: EstrategiaRed
}

export const ESTRATEGIAS_SEMANALES: EstrategiaSemana[] = [
  {
    semana: 1,
    tema: "Presentación — ¿Qué hago como asesor?",
    objetivo: "Hacer saber a tu red que puedes ayudarles con su seguro GMM",
    facebook: {
      titulo: "Foto personal + texto de presentación",
      descripcion: "Publica una foto tuya con un texto corto explicando a qué te dedicas. La gente confía en personas, no en logos.",
      mensaje: `¡Hola a todos! 👋 Quiero contarles algo que puede ayudarles mucho.\n\nSoy asesor de cobertura médica y ayudo a personas con Seguro de Gastos Médicos Mayores a validar si su póliza cubre la cirugía que necesitan.\n\n✅ Sin costo\n✅ Sin cambiar tu seguro\n✅ Sin venderle nada nuevo a nadie\n\nSi tú o alguien que conozcas tiene GMM y necesita una cirugía, escríbeme o usa mi enlace para registrarte. 👇`,
      hashtags: ["#SeguroGMM", "#CirugíaConSeguro", "#CoberturaMédica", "#iHelpMedica"],
    },
    instagram: {
      titulo: "Story + carrusel de 3 slides",
      descripcion: "Slide 1: ¿Tienes seguro GMM? Slide 2: Te ayudo a saber si cubre tu cirugía. Slide 3: Regístrate gratis. Usa tu foto en la portada.",
      mensaje: `¿Tienes Seguro de Gastos Médicos Mayores? 🏥\n\nMuchas personas tienen su seguro activo pero no saben exactamente qué cubre.\n\nYo te ayudo a validarlo GRATIS antes de que necesites una cirugía. Entra al link de mi bio y regístrate. 👆\n\n¡Sin costo, sin compromiso, sin cambiar tu póliza! 💚`,
      hashtags: ["#GMM", "#SeguroMédico", "#CirugíaConSeguro", "#CoberturaSalud", "#MéxicoSalud"],
    },
    linkedin: {
      titulo: "Publicación profesional de presentación",
      descripcion: "LinkedIn es ideal para llegar a personas con empleos formales que tienen GMM colectivo de su empresa. Usa tono profesional.",
      mensaje: `Me dedico a algo que pocos conocen pero que puede ser muy valioso: ayudar a personas a entender si su Seguro de Gastos Médicos Mayores cubre el procedimiento quirúrgico que necesitan.\n\nEl proceso es gratuito, sin cambios en su póliza y sin intermediarios.\n\nSi tienes GMM y necesitas una cirugía (o conoces a alguien en esa situación), con gusto puedo orientarte. Comparte este mensaje si crees que puede ayudar a alguien. 🙏`,
      hashtags: ["#SaludFinanciera", "#BeneficiosLaborales", "#SeguroMédico", "#GMM"],
    },
    x: {
      titulo: "Tweet de presentación directo",
      descripcion: "Corto, directo, con pregunta. En X funciona mejor el formato conversacional.",
      mensaje: `¿Tienes Seguro de Gastos Médicos Mayores y necesitas una cirugía?\n\nPuedo ayudarte a saber si tu póliza la cubre — gratis, sin trámites raros.\n\nUsa mi enlace y en 24h te contactamos. 👇`,
      hashtags: ["#SeguroGMM", "#Salud", "#Cirugía"],
    },
  },
  {
    semana: 2,
    tema: "Educación — ¿Qué cubre realmente el seguro GMM?",
    objetivo: "Generar curiosidad y conciencia sobre los beneficios del GMM",
    facebook: {
      titulo: "Post informativo con lista de coberturas",
      descripcion: "A la gente le encanta aprender algo útil. Un post tipo 'sabías que…' genera muchos comentarios y se comparte mucho.",
      mensaje: `💡 ¿Sabías que tu Seguro de Gastos Médicos Mayores puede cubrir esto?\n\n✅ Cirugías mayores y menores\n✅ Honorarios del médico y anestesiólogo\n✅ Estudios preoperatorios\n✅ Hospitalización\n✅ Medicamentos durante la internación\n\nEl problema: mucha gente no revisa su póliza hasta que ya necesita la cirugía, y a veces es demasiado tarde para activar coberturas.\n\n¿Ya revisaste la tuya? Puedo ayudarte. 👇`,
      hashtags: ["#SeguroGMM", "#CoberturaMédica", "#TipsFinanciasSalud", "#iHelpMedica"],
    },
    instagram: {
      titulo: "Infografía o carrusel: 5 cosas que cubre tu GMM",
      descripcion: "Crea un carrusel de 5 slides. Cada slide = una cobertura. El último slide = tu enlace de registro.",
      mensaje: `5 cosas que probablemente no sabías que cubre tu GMM 👀\n\n1️⃣ Cirugías programadas\n2️⃣ Estudios preoperatorios\n3️⃣ Honorarios médicos\n4️⃣ Medicamentos (durante internación)\n5️⃣ Anestesia\n\nPero ojo: cada póliza es diferente. Yo te ayudo a verificar qué cubre la TUYA. Gratis. Link en bio 👆`,
      hashtags: ["#SaludMéxico", "#GMM", "#SeguroMédico", "#TipsSalud", "#CoberturaMédica"],
    },
    linkedin: {
      titulo: "Artículo corto sobre beneficios GMM que pocos conocen",
      descripcion: "Este tipo de contenido educativo es muy valioso en LinkedIn, especialmente para RH o empleados con plan colectivo.",
      mensaje: `Un dato que me sorprende cada semana: la mayoría de personas con GMM colectivo no saben exactamente qué cubre su póliza.\n\nLos beneficios más usados (y menos conocidos):\n→ Cirugías programadas con cobertura hasta 100%\n→ Deducible único por evento (no por procedimiento)\n→ Coaseguro topado — hay un máximo que pagas\n→ Cobertura de honorarios médicos especializados\n\nRevisar tu cobertura antes de necesitarla puede ahorrarte decenas de miles de pesos. Si quieres hacerlo, con gusto te oriento. Sin costo.`,
      hashtags: ["#RecursosHumanos", "#BeneficiosEmpleados", "#SeguroGMM", "#PlaneaciónFinanciera"],
    },
    x: {
      titulo: "Hilo educativo corto",
      descripcion: "Un hilo de 3-4 tweets sobre algo que la gente no sabe de su GMM.",
      mensaje: `Hilo: Lo que tu seguro GMM cubre y nadie te explicó 🧵\n\n1/ Tu deducible es POR EVENTO, no por procedimiento. Si necesitas 2 cirugías en un año, puedes pagar solo un deducible.\n\n2/ El coaseguro tiene un TOPE. Pagas el % hasta cierto monto, después el seguro paga el 100%.\n\n3/ Los estudios preoperatorios (análisis, rx, eco) generalmente están cubiertos. Pídele a tu médico que los pida como parte del protocolo quirúrgico.`,
      hashtags: ["#SeguroGMM", "#FinanzasPersonales", "#Salud"],
    },
  },
  {
    semana: 3,
    tema: "Testimonios — Historias de personas que sí usaron su GMM",
    objetivo: "Generar confianza con casos reales",
    facebook: {
      titulo: "Historia de éxito (anónima o con permiso)",
      descripcion: "Las historias reales generan mucho alcance. Cuenta el proceso (sin datos personales) de alguien que validó su cobertura y pudo operarse.",
      mensaje: `Historia real de esta semana 💚\n\nUna persona con su seguro GMM necesitaba una cirugía de vesícula. No sabía si su póliza la cubría y estaba cotizando hospitales privados: $80,000 pesos.\n\nValidamos su cobertura en 48 horas. El seguro cubrió el 90%. Solo pagó su deducible.\n\n¿Cuánto se ahorró? Más de $70,000 pesos.\n\nEso es exactamente lo que hacemos. ¿Conoces a alguien en una situación similar? Comparte este post. 🙏`,
      hashtags: ["#HistoriaReal", "#SeguroGMM", "#AhorroEnSalud", "#iHelpMedica"],
    },
    instagram: {
      titulo: "Reels o historia animada: Antes vs Después",
      descripcion: "Formato 'antes: preocupación, después: tranquilidad'. Muy efectivo en Reels. Puedes grabarlo tú mismo con texto en pantalla.",
      mensaje: `ANTES de conocernos 😰\n"Necesito una cirugía y no sé si mi seguro la cubre. Cotizando hospitales: $80,000 pesos"\n\nDESPUÉS de validar su cobertura ✅\n"El seguro cubre el 90%. Pagué solo el deducible"\n\nAsí trabaja iHelp Medica. Sin costo. Sin cambios en tu póliza. Solo resultados. 💚 Link en bio 👆`,
      hashtags: ["#AntesDespués", "#SeguroGMM", "#TesTimonio", "#SaludMéxico", "#CirugíaConSeguro"],
    },
    linkedin: {
      titulo: "Caso de estudio profesional",
      descripcion: "En LinkedIn puedes ser más detallado. Cuenta el proceso completo como un mini caso de estudio.",
      mensaje: `Caso de la semana: cómo una familia evitó un gasto de $120,000 pesos.\n\nSituación: paciente con diagnóstico de hernia inguinal, necesitaba cirugía. GMM activo pero sin haber revisado coberturas.\n\nProceso:\n1. Validación de la póliza con la aseguradora: 48 horas\n2. Autorización del procedimiento: 3 días\n3. Programación con médico de red: 1 semana\n\nResultado: Cirugía cubierta al 90%. Copago de $18,000 vs $120,000 de costo real.\n\nEso es lo que hacemos. Si conoces a alguien que lo necesite, comparte.`,
      hashtags: ["#CasoDeEstudio", "#SeguroMédico", "#GestoríaMédica", "#GMM"],
    },
    x: {
      titulo: "Tweet corto de testimonio",
      descripcion: "Directo y con número concreto — los números generan más impacto que los adjetivos.",
      mensaje: `Alguien me escribió la semana pasada:\n"Necesito una cirugía y no sé si mi GMM la cubre"\n\nHoy me escribió:\n"¡Gracias! El seguro lo cubrió casi todo"\n\nEso es lo que hacemos. ¿Conoces a alguien que lo necesite? 👇`,
      hashtags: ["#SeguroGMM", "#Testimonio"],
    },
  },
  {
    semana: 4,
    tema: "Urgencia — El costo de no revisar antes de necesitarlo",
    objetivo: "Activar a personas que ya tienen un diagnóstico pendiente",
    facebook: {
      titulo: "Post de alerta: cuánto cuesta una cirugía sin seguro",
      descripcion: "Publica precios reales de cirugías comunes en hospitales privados. El contraste con el costo con GMM es muy impactante.",
      mensaje: `💰 ¿Sabes cuánto cuesta una cirugía en hospital privado SIN usar el seguro?\n\n• Colecistectomía (vesícula): $60,000 - $90,000\n• Apendicectomía: $50,000 - $80,000\n• Reemplazo de rodilla: $150,000 - $250,000\n• Histerectomía: $80,000 - $120,000\n\nCON Seguro GMM bien validado:\n✅ El seguro puede cubrir el 80-100%\n✅ Solo pagas deducible y coaseguro\n✅ Proceso gestionado por nosotros\n\nNo esperes a estar en urgencias para revisar tu cobertura. Hazlo HOY. 👇`,
      hashtags: ["#CostosCirugía", "#SeguroGMM", "#PrevenciónFinanciera", "#iHelpMedica"],
    },
    instagram: {
      titulo: "Gráfico de comparación de precios",
      descripcion: "Diseña o crea un slide simple: columna izquierda 'Sin GMM', columna derecha 'Con GMM validado'. Los números solos hacen el trabajo.",
      mensaje: `¿Te imaginas necesitar una cirugía y no saber si tu seguro la cubre? 😰\n\nEso le pasa al 70% de personas con GMM activo.\n\nLa diferencia entre validarlo HOY vs cuando ya urge puede ser de meses de proceso y miles de pesos.\n\nYo te ayudo a revisarlo ANTES de que lo necesites. Gratis. Link en bio 👆\n\n(Comparte esto con alguien que tenga GMM y lo necesite)`,
      hashtags: ["#PrevenciónSalud", "#SeguroGMM", "#FinanzasPersonales", "#CirugíaMéxico"],
    },
    linkedin: {
      titulo: "Reflexión sobre planificación médica preventiva",
      descripcion: "Enfócate en el ángulo de planificación financiera. LinkedIn tiene audiencia que valora este tipo de contenido.",
      mensaje: `Hay un tipo de revisión financiera que muy pocos hacen: verificar exactamente qué cubre su seguro médico ANTES de necesitarlo.\n\nLa mayoría descubre los límites de su GMM cuando ya está en medio de una cirugía urgente. Ese es el peor momento para negociar o entender los términos.\n\nValidar tu cobertura lleva 48 horas. El proceso es gratuito. Y puede significar la diferencia entre pagar $20,000 o $200,000 pesos.\n\n¿Lo tienes revisado? Si no, puedo ayudarte.`,
      hashtags: ["#PlanificaciónFinanciera", "#SeguroMédico", "#GMM", "#SaludFinanciera"],
    },
    x: {
      titulo: "Tweet de impacto con precio concreto",
      descripcion: "Los números específicos funcionan muy bien en X. Sé directo.",
      mensaje: `Una cirugía de rodilla sin usar tu seguro: $200,000 pesos.\n\nUsando tu GMM bien gestionado: $20,000 - $30,000.\n\nLa diferencia: saber que está cubierta ANTES de entrar al quirófano.\n\nYo te ayudo a verificarlo gratis 👇`,
      hashtags: ["#SeguroGMM", "#SaludFinanciera", "#Cirugía"],
    },
  },
  {
    semana: 5,
    tema: "FAQ — Las preguntas más frecuentes sobre GMM",
    objetivo: "Resolver dudas y generar conversación",
    facebook: {
      titulo: "Post de preguntas y respuestas",
      descripcion: "Los posts de Q&A generan mucha interacción. Pide a tus seguidores que comenten sus dudas.",
      mensaje: `Las preguntas que más me hacen sobre el Seguro GMM 👇\n\n❓ ¿Cuánto tiempo tarda la autorización?\nGeneralmente 24-72 horas hábiles.\n\n❓ ¿Cualquier médico puede atenderme?\nDepende. Con médicos de la red del seguro, el proceso es más ágil y el copago menor.\n\n❓ ¿Qué pasa si ya tengo el diagnóstico?\nPuede haber período de espera si es una condición preexistente. Por eso es importante revisar antes.\n\n❓ ¿Qué necesito para iniciar?\nSolo nombre, aseguradora y el procedimiento que necesitas. Nosotros hacemos el resto.\n\n¿Tienes otra pregunta? La respondo en los comentarios 👇`,
      hashtags: ["#FAQ", "#SeguroGMM", "#DudasSalud", "#iHelpMedica"],
    },
    instagram: {
      titulo: "Story de preguntas — usa la función de pregunta de IG",
      descripcion: "En Stories, usa el sticker de pregunta. Recibe preguntas reales de tu audiencia y respóndelas. Genera muchísimo engagement.",
      mensaje: `Las 3 dudas más comunes que me llegan sobre GMM 👀\n\n1️⃣ "¿Mi cirugía está cubierta?"\n→ Depende de tu póliza. Te ayudo a verificarlo en 48h.\n\n2️⃣ "¿Qué pasa si cambiaron los términos?"\n→ Es más común de lo que crees. Por eso hay que revisar antes.\n\n3️⃣ "¿Tienen costo?"\n→ Para ti, CERO. Nuestro servicio de validación es completamente gratuito.\n\n¿Tu pregunta no está aquí? Escríbeme o entra al link de mi bio 👆`,
      hashtags: ["#PreguntasYRespuestas", "#SeguroGMM", "#SaludMéxico", "#GMM", "#CoberturaMédica"],
    },
    linkedin: {
      titulo: "Post de FAQ profesional",
      descripcion: "Oriéntalo a decisores en empresas: gerentes de RH que manejan planes colectivos.",
      mensaje: `Preguntas frecuentes que recibo de áreas de RRHH sobre Seguro GMM colectivo:\n\n¿Cómo saben los empleados qué está cubierto?\n→ En la mayoría de casos, no lo saben. Pocos leen su póliza completa.\n\n¿Qué pasa cuando un empleado necesita cirugía?\n→ Si no tienen orientación previa, el proceso se vuelve lento y estresante.\n\n¿Pueden hacer una validación preventiva?\n→ Sí, y es gratuita. Con solo el nombre de la aseguradora y el procedimiento que necesita, podemos orientar.\n\nSi tu empresa tiene plan GMM colectivo y quieres orientar mejor a tus empleados, con gusto platicamos.`,
      hashtags: ["#RRHH", "#BeneficiosEmpleados", "#SeguroColectivo", "#GMM", "#BienEstar"],
    },
    x: {
      titulo: "Hilo de FAQ corto",
      descripcion: "Responde 3 preguntas concretas. El formato Q&A funciona muy bien en X.",
      mensaje: `3 preguntas que me hacen cada semana sobre GMM:\n\n"¿Tienen costo?" → No, cero.\n"¿Cuánto tarda?" → 24-72 horas para validar cobertura.\n"¿Qué necesito?" → Solo tu aseguradora y el procedimiento.\n\nEso es todo. Link abajo 👇`,
      hashtags: ["#SeguroGMM", "#FAQ", "#Salud"],
    },
  },
  {
    semana: 6,
    tema: "Mitos — Falsas creencias sobre el seguro GMM",
    objetivo: "Romper objeciones comunes antes de que las expresen",
    facebook: {
      titulo: "Post de mitos vs realidad",
      descripcion: "El formato Mito / Realidad genera muchísimo engagement. La gente comparte para 'corregir' a otros.",
      mensaje: `🚫 MITOS sobre el Seguro GMM que le cuestan caro a mucha gente:\n\n❌ Mito: "El seguro no cubre cirugías programadas"\n✅ Realidad: Sí las cubre. El período de espera aplica para condiciones preexistentes, no para todo.\n\n❌ Mito: "Tengo que ir con el médico que me asigne el seguro"\n✅ Realidad: Puedes elegir médico fuera de red, aunque el copago puede ser mayor.\n\n❌ Mito: "El trámite es muy tardado y complicado"\n✅ Realidad: Con orientación correcta, la autorización puede tomar 24-72 horas.\n\n❌ Mito: "Si ya tengo el diagnóstico, ya no sirve"\n✅ Realidad: Depende del tipo de condición y de cuándo iniciaste la póliza.\n\n¿Cuál de estos creías tú? Cuéntame en los comentarios 👇`,
      hashtags: ["#MitoVsRealidad", "#SeguroGMM", "#CoberturaMédica", "#iHelpMedica"],
    },
    instagram: {
      titulo: "Carrusel: Mito vs Realidad (un slide por mito)",
      descripcion: "4 slides. Slide verde/rojo alternados. Muy visual, fácil de compartir en Stories. Incluye tu código QR al final.",
      mensaje: `Mitos sobre el GMM que debes conocer 👀\n\n🚫 "El seguro no cubre cirugías"\n✅ Sí cubre — depende de tu póliza\n\n🚫 "Solo sirve para urgencias"\n✅ Cubre procedimientos programados también\n\n🚫 "El trámite tarda meses"\n✅ Con orientación, se puede autorizar en 48h\n\nGuarda este post y mándalo a quien lo necesite 💚`,
      hashtags: ["#MitosGMM", "#SeguroMédico", "#CoberturaSalud", "#iHelpMedica", "#SaludMéxico"],
    },
    linkedin: {
      titulo: "Artículo sobre malentendidos en seguros GMM",
      descripcion: "Tono más analítico. Ideal para audiencia que toma decisiones sobre planes de beneficios.",
      mensaje: `Tres malentendidos sobre los seguros GMM que generan pérdidas financieras innecesarias:\n\n1. Confundir el período de espera con la cobertura total. El período de espera aplica para condiciones preexistentes declaradas — no para accidentes ni enfermedades nuevas.\n\n2. Creer que el deducible se paga por procedimiento. En GMM es por evento, lo que puede significar una diferencia enorme en intervenciones múltiples.\n\n3. No conocer el tope de coaseguro. Hay un máximo que el asegurado paga — el seguro cubre el 100% a partir de ahí.\n\nConocer estos detalles puede significar decenas de miles de pesos. Si quieres revisarlo, con gusto te oriento.`,
      hashtags: ["#SeguroGMM", "#Finanzas", "#PlaneaciónMédica", "#Previsión"],
    },
    x: {
      titulo: "Tweet provocador sobre mitos",
      descripcion: "Empieza con el mito más común para generar reacciones.",
      mensaje: `El mito más caro del seguro GMM:\n\n"Si ya tengo el diagnóstico, ya no sirve registrarme"\n\nFALSO.\n\nEn muchos casos sí aplica la cobertura. Depende del tipo de condición, la vigencia y la aseguradora.\n\nNo des por perdido tu seguro antes de revisarlo 👇`,
      hashtags: ["#SeguroGMM", "#MitoVsRealidad", "#Salud"],
    },
  },
  {
    semana: 7,
    tema: "Datos y estadísticas — La realidad de la salud en México",
    objetivo: "Generar conciencia con datos concretos y compartibles",
    facebook: {
      titulo: "Post de dato duro + llamada a acción",
      descripcion: "Los datos estadísticos son muy compartidos. Usa números concretos y fuente si la tienes.",
      mensaje: `📊 Dato que te va a sorprender:\n\nEn México, el 30% de las personas con seguro GMM nunca ha revisado qué incluye exactamente su póliza.\n\nY el 60% de los gastos médicos mayores en familias mexicanas podrían haberse cubierto (total o parcialmente) con el GMM que ya tienen.\n\nLa falta de información es la mayor pérdida.\n\nSi tienes GMM activo y nunca has verificado tu cobertura, hoy es un buen día para hacerlo. Gratis. Sin compromiso. 👇`,
      hashtags: ["#DatosSalud", "#SeguroGMM", "#MéxicoSalud", "#iHelpMedica"],
    },
    instagram: {
      titulo: "Infografía de estadísticas",
      descripcion: "Una sola imagen con 2-3 estadísticas bien presentadas. Fácil de guardar y repostear. Incluye tu nombre/código al pie.",
      mensaje: `Datos sobre salud en México que deberías conocer 📊\n\n→ 1 de cada 3 cirugías programadas en hospitales privados podría cubrirse con GMM\n→ El costo promedio de una cirugía sin seguro: $80,000 MXN\n→ El costo promedio pagando solo deducible: $15,000 MXN\n\n¿La diferencia? Saber que tu póliza lo cubre ANTES de entrar al quirófano.\n\nYo te ayudo. Link en bio 👆`,
      hashtags: ["#EstadísticasSalud", "#SeguroGMM", "#SaludMéxico", "#CoberturaMédica", "#Data"],
    },
    linkedin: {
      titulo: "Reflexión sobre el costo real de la salud en México",
      descripcion: "LinkedIn valora el análisis. Añade contexto económico al dato.",
      mensaje: `El costo promedio de hospitalización en un hospital privado de nivel medio en México superó los $85,000 pesos en 2024.\n\nEl porcentaje de esa cifra que cubre un GMM bien gestionado: entre el 70% y el 100%, dependiendo de la póliza.\n\nEl porcentaje de titulares de GMM que revisaron su cobertura antes de necesitarla: una minoría.\n\nLa diferencia entre saber y no saber puede ser de $60,000 a $80,000 pesos de tu bolsillo. No es un dato menor.\n\nSi tienes GMM (individual o colectivo) y quieres saber exactamente qué cubre, con gusto te oriento. Sin costo.`,
      hashtags: ["#SaludFinanciera", "#CostoSalud", "#SeguroMédico", "#México", "#GMM"],
    },
    x: {
      titulo: "Tweet de dato + comparación de costo",
      descripcion: "Contraste fuerte entre dos números. Muy retuiteable.",
      mensaje: `Cirugía de vesícula en hospital privado:\nSIN seguro: $70,000\nCON GMM validado: $10,000-$15,000\n\nLa diferencia no es el seguro. Es saber usarlo.\n\n¿Ya revisaste el tuyo? 👇`,
      hashtags: ["#SeguroGMM", "#SaludFinanciera", "#México"],
    },
  },
  {
    semana: 8,
    tema: "Procedimientos más comunes — ¿El mío está cubierto?",
    objetivo: "Hablarle directamente a personas con diagnóstico específico",
    facebook: {
      titulo: "Lista de procedimientos frecuentes cubiertos por GMM",
      descripcion: "La gente que ya tiene un diagnóstico busca información específica. Este post les habla directo.",
      mensaje: `¿Tienes alguno de estos diagnósticos o procedimientos pendientes? 👇\n\n🫀 Cardiovasculares: bypass, válvulas, marcapasos\n🦴 Ortopédicos: rodilla, cadera, columna\n🔵 Digestivos: vesícula, hernia, colon\n🧠 Neurológicos: túnel carpiano, hernias de disco\n🏥 Oncológicos: cirugías de tumor\n👁️ Oftalmológicos: cataratas, glaucoma\n\nSi tienes GMM activo y alguno de estos en tu radar, podemos validar si tu póliza lo cubre antes de que lo necesites.\n\nComparte este post con quien lo necesite. 🙏`,
      hashtags: ["#ProcedimientosMédicos", "#SeguroGMM", "#CoberturaCirugía", "#iHelpMedica"],
    },
    instagram: {
      titulo: "Carrusel: procedimiento por slide con info de cobertura",
      descripcion: "Cada slide = una especialidad con el procedimiento más común y si suele estar cubierto. Muy informativo y guardable.",
      mensaje: `Los procedimientos más frecuentes con GMM en México 🏥\n\n¿El tuyo está en la lista?\n\n✅ Cirugía de rodilla\n✅ Colecistectomía (vesícula)\n✅ Hernia (varios tipos)\n✅ Histerectomía\n✅ Apendicitis\n✅ Cataratas\n\nTodos pueden estar cubiertos por tu póliza. Yo valido cuál es tu caso. Gratis. Link en bio 👆`,
      hashtags: ["#CirugíaConSeguro", "#GMM", "#ProcedimientosMédicos", "#CoberturaSalud", "#SaludMéxico"],
    },
    linkedin: {
      titulo: "Post sobre procedimientos comunes con alto costo sin seguro",
      descripcion: "Enfócate en el ROI de tener GMM bien gestionado para procedimientos frecuentes en empleados de mediana edad.",
      mensaje: `Los tres procedimientos más comunes en personas entre 35-55 años con GMM:\n\n1. Cirugía de columna/hernia de disco — costo estimado sin seguro: $150,000-$300,000\n2. Reemplazo de rodilla — costo estimado sin seguro: $200,000-$350,000\n3. Cirugía oncológica (varios tipos) — variable, frecuentemente > $200,000\n\nCon un GMM activo y la gestión correcta, el copago puede reducirse entre el 80-100%.\n\nSi en tu organización hay personas con estos diagnósticos o historial familiar, revisar sus coberturas preventivamente puede ser uno de los mayores beneficios que puedes ofrecerles.`,
      hashtags: ["#BeneficiosLaborales", "#SeguroMédico", "#GMM", "#RRHH", "#BienEstarEmpleados"],
    },
    x: {
      titulo: "Tweet directo mencionando procedimientos",
      descripcion: "Directo. Si alguien tiene ese diagnóstico, hace clic.",
      mensaje: `¿Te dijeron que necesitas:\n- Cirugía de rodilla\n- Cirugía de vesícula\n- Hernia\n- Columna\n\nY tienes GMM activo?\n\nAntes de pagar $100,000+ de tu bolsillo, valida tu cobertura. Es gratis y tarda 48h. 👇`,
      hashtags: ["#CirugíaGMM", "#SeguroMédico", "#Salud"],
    },
  },
  {
    semana: 9,
    tema: "Cómo funciona el proceso — Paso a paso",
    objetivo: "Reducir la barrera de entrada mostrando lo simple que es",
    facebook: {
      titulo: "Post de proceso en 4 pasos",
      descripcion: "La gente no actúa si no sabe qué va a pasar. Muéstrales exactamente el proceso.",
      mensaje: `¿Cómo funciona exactamente nuestro proceso? Te explico en 4 pasos 👇\n\n1️⃣ Registro gratis\nLlenas un formulario básico: nombre, procedimiento que necesitas y tu aseguradora.\n\n2️⃣ Análisis de cobertura\nUn asesor médico certificado revisa tu póliza con la aseguradora. Tiempo: 24-72h.\n\n3️⃣ Resultado claro\nTe decimos exactamente qué cubre tu seguro, cuánto pagarías de deducible y los pasos a seguir.\n\n4️⃣ Acompañamiento\nSi decides proceder, te apoyamos en la autorización, médico y coordinación con el hospital.\n\nTodo sin costo para ti. ¿Empezamos? 👇`,
      hashtags: ["#PasoAPaso", "#SeguroGMM", "#ProcesoClaroMéxico", "#iHelpMedica"],
    },
    instagram: {
      titulo: "Reels de 30 segundos: el proceso en pasos",
      descripcion: "Grábate explicando el proceso. O usa slides animadas. El formato Reels tiene alcance orgánico mucho mayor que posts normales.",
      mensaje: `El proceso es más simple de lo que crees ✅\n\nPaso 1: Regístrate (2 minutos)\nPaso 2: Nosotros validamos con tu aseguradora (48h)\nPaso 3: Recibes respuesta clara de qué cubre tu GMM\nPaso 4: Si procede, coordinamos todo\n\nCero papeleo de tu parte. Cero costo. Solo resultados.\n\nLink en bio para empezar 👆`,
      hashtags: ["#PasoAPaso", "#SeguroGMM", "#SimpleYRápido", "#CoberturaMédica", "#iHelpMedica"],
    },
    linkedin: {
      titulo: "Post de proceso con contexto profesional",
      descripcion: "Explica el proceso con lenguaje más técnico/formal. Aplica para RH y líderes.",
      mensaje: `El proceso de validación de cobertura GMM, paso a paso:\n\n1. Solicitud inicial — datos básicos del paciente, procedimiento requerido y aseguradora. Tiempo: 5 minutos.\n\n2. Revisión técnica — verificación de la póliza con el área de autorizaciones de la aseguradora. Tiempo: 24-72 horas hábiles.\n\n3. Reporte de cobertura — informe claro de qué está cubierto, importes estimados y condiciones aplicables.\n\n4. Gestión de autorización — si el paciente decide proceder, apoyamos en la carta de autorización y coordinación médica.\n\nSin costo para el asegurado. Si quieres saber si aplica para tu caso, escríbeme.`,
      hashtags: ["#GestoríaMédica", "#SeguroGMM", "#ProcesoMédico", "#CoberturaSalud"],
    },
    x: {
      titulo: "Tweet de proceso ultra simplificado",
      descripcion: "3 líneas. Máxima claridad.",
      mensaje: `Validar tu cobertura GMM:\n\n✅ Registro: 2 min\n✅ Análisis: 48h\n✅ Resultado claro: incluye qué cubre y cuánto pagas\n\nGratis. Sin sorpresas. Sin letras chicas. 👇`,
      hashtags: ["#SeguroGMM", "#Proceso", "#GestoríaMédica"],
    },
  },
  {
    semana: 10,
    tema: "Comparativa de aseguradoras — ¿Cuál es mejor?",
    objetivo: "Posicionarse como experto, generar conversación",
    facebook: {
      titulo: "Post educativo sobre diferencias entre aseguradoras",
      descripcion: "No hables mal de ninguna. Habla de las diferencias en proceso y cobertura de manera objetiva. Genera debate.",
      mensaje: `Pregunta frecuente: ¿cuál es la mejor aseguradora GMM?\n\nLa verdad: depende de lo que necesitas.\n\n🔵 GNP — Red médica muy amplia, proceso de autorización ágil\n🟠 AXA — Buen servicio en procedimientos de alta especialidad\n🟢 MetLife — Excelente para planes colectivos empresariales\n🔴 Allianz — Buena cobertura internacional\n🟡 MAPFRE — Sumas aseguradas altas, buen perfil de riesgo\n\nPero la aseguradora importa menos de lo que crees. Lo que importa es conocer EXACTAMENTE lo que cubre la TUYA.\n\n¿Tienes una de estas? Te ayudo a revisarla. 👇`,
      hashtags: ["#AseguradorasGMM", "#ComparativaSeguro", "#SeguroMédico", "#iHelpMedica"],
    },
    instagram: {
      titulo: "Carrusel: aseguradoras top GMM con características clave",
      descripcion: "Un slide por aseguradora con 2-3 características. No pongas una como 'la mejor'. Cierra con tu código QR.",
      mensaje: `¿Cuál aseguradora GMM tienes? 👀\n\nCada una tiene sus fortalezas. Lo que más importa no es la marca sino conocer tu cobertura específica.\n\nDime en comentarios cuál tienes y te cuento qué suele cubrir bien ⬇️\n\n(Recuerda que yo valido tu cobertura GRATIS — link en bio 👆)`,
      hashtags: ["#AseguradorasMéxico", "#GMM", "#SeguroMédico", "#CoberturaSalud", "#SaludMéxico"],
    },
    linkedin: {
      titulo: "Análisis breve de las principales aseguradoras GMM en México",
      descripcion: "Más técnico y objetivo. Muy útil para áreas de RH que están renovando o comparando planes.",
      mensaje: `Las cinco aseguradoras GMM con mayor participación en México tienen diferencias importantes en tres aspectos clave:\n\n• Amplitud de red médica — impacta el acceso a especialistas y hospitales\n• Velocidad de autorización — crucial en procedimientos no urgentes\n• Topes de coaseguro — define el gasto máximo del asegurado\n\nNo hay una "mejor" de forma universal. La mejor para cada persona o empresa es la que mejor se alinea con su perfil de riesgo, presupuesto y necesidades de atención.\n\nSi estás evaluando opciones o renovando un plan colectivo, con gusto hablo contigo.`,
      hashtags: ["#SeguroColectivo", "#RRHH", "#BeneficiosEmpresariales", "#GMM", "#PlaneaciónMédica"],
    },
    x: {
      titulo: "Tweet de pregunta + respuesta sobre aseguradoras",
      descripcion: "Pregunta a tu audiencia cuál tiene. Genera conversación.",
      mensaje: `¿Con qué aseguradora GMM tienes tu póliza?\n\nPregunto porque cada una tiene un proceso diferente para autorizar cirugías. Conocerlo puede ahorrarte semanas.\n\nDime en los comentarios cuál es la tuya 👇`,
      hashtags: ["#SeguroGMM", "#Aseguradoras", "#PóliaMédica"],
    },
  },
  {
    semana: 11,
    tema: "Consejos para maximizar tu seguro GMM",
    objetivo: "Dar valor real y posicionarte como referente de confianza",
    facebook: {
      titulo: "Post de consejos prácticos accionables",
      descripcion: "Tips prácticos = mucho valor percibido = shares. La gente guarda y comparte contenido útil.",
      mensaje: `7 cosas que debes hacer si tienes un Seguro GMM activo 📋\n\n1. Lee la sección de exclusiones — no la cobertura, las exclusiones primero\n2. Revisa las fechas de vigencia — ¿cuándo vence tu póliza actual?\n3. Guarda el número de atención a asegurados de tu póliza en tu celular\n4. Conoce tu número de póliza y certificado — los necesitarás en urgencias\n5. Pregunta si tienes deducible por evento o por año — hacen una diferencia enorme\n6. Identifica si hay red médica preferente — ahorras mucho usando médicos en red\n7. Valida coberturas ANTES de necesitarlas — no al momento de la urgencia\n\nGuarda este post. Puede ser muy útil. 🙏`,
      hashtags: ["#TipsSeguroGMM", "#ConsejosSalud", "#MaximizaTuSeguro", "#iHelpMedica"],
    },
    instagram: {
      titulo: "Carrusel: 1 tip por slide (7 slides)",
      descripcion: "Carrusel de tips. El último slide siempre debe ser tu llamada a acción. Muy guardable = buen alcance orgánico.",
      mensaje: `7 cosas que debes saber si tienes GMM 👀\n\n(Guarda este post — puede ser muy útil)\n\n💡 Tip 1: Conoce tu número de póliza de memoria o en tu celular\n💡 Tip 2: Revisa las exclusiones — son igual de importantes que las coberturas\n💡 Tip 3: Valida ANTES de necesitarlo, no durante la urgencia\n\n→ Desliza para ver todos los tips ➡️`,
      hashtags: ["#TipsSalud", "#SeguroGMM", "#ConsejosFinancieros", "#CoberturaMédica", "#SaludMéxico"],
    },
    linkedin: {
      titulo: "Guía breve: cómo aprovechar mejor tu GMM",
      descripcion: "Tono de consejero experto. Agrega valor real. Puede llegar a tomadores de decisión.",
      mensaje: `Cuatro acciones que recomiendo a cualquier titular de GMM, sin importar su aseguradora:\n\n1. Digitaliza tu póliza — foto en galería y PDF en correo. En urgencias no se busca el papel.\n\n2. Identifica si tienes período de espera cumplido — si llevas más de 2 años con la póliza, la mayoría de períodos de espera ya están cubiertos.\n\n3. Pregunta a tu médico si está en red — un médico fuera de red no invalida tu cobertura, pero puede aumentar tu copago.\n\n4. Solicita preautorización para procedimientos programados — reduce el riesgo de que el seguro lo dispute después.\n\nSi tienes dudas sobre alguno de estos puntos, con gusto te oriento. Sin costo.`,
      hashtags: ["#GMM", "#PlaneaciónFinanciera", "#SeguroMédico", "#SaludFinanciera"],
    },
    x: {
      titulo: "Hilo de tips cortos",
      descripcion: "4 tweets. Uno por tip clave. Fácil de leer y muy retuiteable.",
      mensaje: `Tips para aprovechar tu GMM al máximo 🧵\n\n1/ Ten tu número de póliza en tu celular. En urgencias no hay tiempo de buscar papeles.\n\n2/ El deducible es por evento, no por año. Si te operan 2 veces el mismo año por la misma causa, puedes pagar un solo deducible.\n\n3/ El coaseguro tiene un tope. Después de ese tope, el seguro paga el 100%. Conoce el tuyo.\n\n4/ Valida tu cobertura ANTES de necesitarla. Hacerlo en urgencias siempre es más lento.`,
      hashtags: ["#SeguroGMM", "#Tips", "#SaludFinanciera"],
    },
  },
  {
    semana: 12,
    tema: "Referidos — El poder de compartir tu enlace",
    objetivo: "Activar a vendedores para que compartan más activamente",
    facebook: {
      titulo: "Post motivacional de cierre + llamada a compartir",
      descripcion: "Semana de cierre. Post motivacional que invite a compartir el enlace con toda la red.",
      mensaje: `Una reflexión de esta semana:\n\nMuchas personas en México tienen Seguro GMM activo y cuando necesitan una cirugía, pagan de su bolsillo porque no saben que pueden usarlo.\n\nEs un problema de información. No de dinero.\n\nCada vez que compartes tu enlace, estás dándole a alguien la posibilidad de saber si puede ahorrar $50,000, $100,000 o más en su próxima cirugía.\n\nNo sé quién de tu red lo necesita hoy. Pero compartir solo te toma 10 segundos y puede cambiarle la vida a alguien.\n\n¿Me ayudas a llegar a más personas? Comparte este post. 🙏👇`,
      hashtags: ["#ComparteYAyuda", "#SeguroGMM", "#RedSolidaria", "#iHelpMedica"],
    },
    instagram: {
      titulo: "Post emotivo de llamada a la acción compartida",
      descripcion: "Formato carrusel o imagen + texto. Tono más emotivo. Las personas comparten contenido que las hace sentir bien al compartirlo.",
      mensaje: `¿Conoces a alguien que:\n→ Tiene seguro GMM\n→ Necesita o puede necesitar una cirugía\n→ No sabe exactamente qué cubre su póliza?\n\nMándales este post o tu enlace directo.\n\nNo les estás vendiendo nada. Les estás dando acceso a información que puede ahorrarles mucho dinero. 💚\n\nLink en bio para compartir 👆`,
      hashtags: ["#Referido", "#SeguroGMM", "#AyudaCompartiendo", "#SaludParaTodos", "#iHelpMedica"],
    },
    linkedin: {
      titulo: "Post de cierre: el impacto de informar",
      descripcion: "Reflexión sobre el impacto real de llevar información correcta a personas que la necesitan.",
      mensaje: `Una de las realidades de trabajar en gestión médica: la mayoría de las personas que ayudamos llegaron a nosotros porque alguien de su confianza les compartió la información.\n\nNo fue publicidad. No fue una búsqueda en internet. Fue alguien que pensó en ellos y les dijo "creo que esto te puede servir".\n\nSi conoces a alguien con GMM activo que esté enfrentando una cirugía o diagnóstico, considera compartir esta información. Puede marcar una diferencia real.\n\nGracias por seguir este contenido y compartirlo cuando crees que puede ayudar. 🙏`,
      hashtags: ["#ImpactoSocial", "#SeguroMédico", "#InformaciónEsPoder", "#GMM", "#SaludMéxico"],
    },
    x: {
      titulo: "Tweet de cierre con llamada a retweet",
      descripcion: "Pide directamente el RT para ampliar el alcance. Funciona cuando el contenido es genuinamente útil.",
      mensaje: `Si conoces a alguien con Seguro GMM que necesita una cirugía y no sabe si está cubierta:\n\nMándales este tweet.\n\nEs gratis. Tarda 2 minutos registrarse. Y puede ahorrarles $50,000-$200,000 pesos.\n\nRT si crees que alguien lo necesita 🙏`,
      hashtags: ["#SeguroGMM", "#Salud", "#Compartir"],
    },
  },
]

/** Obtiene la estrategia de la semana actual (rota cíclicamente entre las 12 semanas) */
export function getEstrategiaActual(): EstrategiaSemana {
  const inicio = new Date(2026, 0, 1) // 1 enero 2026
  const hoy = new Date()
  const diffMs = hoy.getTime() - inicio.getTime()
  const semanaAbsoluta = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000))
  const idx = ((semanaAbsoluta % 12) + 12) % 12
  return ESTRATEGIAS_SEMANALES[idx]
}
