import {
  AstronautDashboardState,
  BiomarkerData,
  EmergencyProtocolStep,
  MissionEnvironment,
  MissionEnvironmentId,
  MissionQuest,
  RoutineTracking,
  SystemDiagnosticGuide,
  SystemZoneId,
  TelemetryPoint,
} from "@/types/astronaut";

export const MISSION_ENVIRONMENTS: Record<
  MissionEnvironmentId,
  MissionEnvironment
> = {
  iss: {
    id: "iss",
    name: "Estación Espacial (ISS)",
    shortName: "ISS (Órbita Baja)",
    agencyProgram: "Órbita Terrestre Baja · 408 km",
    gravityG: 0.0,
    gravityLabel: "0.00g (Microgravedad)",
    dailyRadiationMsv: 0.45,
    radiationFactorLabel: "0.45 mSv/día (Protección parcial magnetosfera)",
    commLatencySeconds: 0.4,
    commLatencyLabel: "< 0.5 seg (Enlace casi real)",
    commProtocol: "Enlace Directo TDRS S/Ku-Band",
    cabinPressureKpa: 101.3,
    co2MmHg: 2.3,
    description:
      "Laboratorio orbital con soporte rápido desde Tierra, ciclos de 16 amaneceres cada 24 h y ejercicio resistivo diario obligatorio (ARED).",
    boneLoadFactor: 1.0,
    isolationRiskBonus: 0,
    alerts: [
      {
        id: "iss-co2",
        title: "Acumulación localizada de CO₂",
        severity: "optimal",
        detail:
          "Ventilación nominal (2.3 mmHg). En microgravedad el aire no circula solo; mantener ventiladores activos cerca del rostro.",
      },
      {
        id: "iss-circadian",
        title: "16 ciclos día/noche orbitales",
        severity: "warning",
        detail:
          "Luz solar externa cambia cada 45 min. Usar iluminación LED programada de cabina para proteger la melatonina.",
      },
    ],
  },
  nave: {
    id: "nave",
    name: "Nave Espacial (Tránsito)",
    shortName: "Nave Espacial",
    agencyProgram: "Tránsito Cislunar / Espacio Profundo · Orion",
    gravityG: 0.0,
    gravityLabel: "0.00g (Microgravedad)",
    dailyRadiationMsv: 1.25,
    radiationFactorLabel: "1.25 mSv/día (Fuera de magnetosfera protectora)",
    commLatencySeconds: 110,
    commLatencyLabel: "1 min 50 seg (Ida y vuelta ~3.6 min)",
    commProtocol: "Red de Espacio Profundo (DSN)",
    cabinPressureKpa: 70.3,
    co2MmHg: 3.1,
    description:
      "Cabina compacta de tránsito fuera de la protección magnética terrestre. Mayor exposición a partículas solares y espacio habitable reducido.",
    boneLoadFactor: 1.15,
    isolationRiskBonus: 10,
    alerts: [
      {
        id: "nave-rad",
        title: "Exposición elevada fuera de órbita baja",
        severity: "warning",
        detail:
          "La radiación cósmica galáctica sube a ~1.25 mSv/día. Vigilar dosímetro CSA y preparar refugio ante tormentas solares.",
      },
      {
        id: "nave-space",
        title: "Confinamiento en volumen reducido",
        severity: "warning",
        detail:
          "Menor espacio físico aumenta el estrés interpersonal y fatiga postural. Priorizar pausas cognitivas y estiramientos.",
      },
    ],
  },
  luna: {
    id: "luna",
    name: "Base Lunar (Programa Artemis)",
    shortName: "Base Lunar Artemis",
    agencyProgram: "Polo Sur Lunar · Programa Artemis",
    gravityG: 0.16,
    gravityLabel: "0.16g (1/6 Gravedad Terrestre)",
    dailyRadiationMsv: 0.95,
    radiationFactorLabel: "0.95 mSv/día (Sin atmósfera ni campo magnético)",
    commLatencySeconds: 2.6,
    commLatencyLabel: "2.6 seg (Ida y vuelta)",
    commProtocol: "Relé Lunar Gateway / Banda Ka",
    cabinPressureKpa: 56.5,
    co2MmHg: 2.8,
    description:
      "Hábitat presurizado en superficie lunar. Gravedad parcial ayuda levemente al equilibrio, pero persiste pérdida ósea y riesgo por polvo lunar.",
    boneLoadFactor: 0.85,
    isolationRiskBonus: 8,
    alerts: [
      {
        id: "luna-dust",
        title: "Control de polvo lunar abrasivo",
        severity: "warning",
        detail:
          "Tras caminatas lunares (EVA), verificar sellos y filtración de aire para evitar irritación respiratoria o cutánea.",
      },
      {
        id: "luna-rad",
        title: "Radiación superficial y eyección secundaria",
        severity: "warning",
        detail:
          "Sin atmósfera protectora, el blindaje de regolito reduce exposición dentro del hábitat a 0.95 mSv/día.",
      },
    ],
  },
  marte: {
    id: "marte",
    name: "Rover en Marte",
    shortName: "Rover en Marte",
    agencyProgram: "Exploración Superficial Marciana · Sol 142",
    gravityG: 0.38,
    gravityLabel: "0.38g (Gravedad Marciana)",
    dailyRadiationMsv: 1.65,
    radiationFactorLabel: "1.65 mSv/día (Atmósfera muy tenue, alto GCR)",
    commLatencySeconds: 860,
    commLatencyLabel: "14 min 20 seg (Solo ida · 28m 40s RTT)",
    commProtocol: "Autonomía Médica + Almacenar y Reenviar",
    cabinPressureKpa: 58.0,
    co2MmHg: 3.4,
    description:
      "Exploración móvil autónoma a millones de kilómetros de la Tierra. Imposibilidad de conversaciones en vivo con médicos y alto aislamiento visual.",
    boneLoadFactor: 0.65,
    isolationRiskBonus: 18,
    alerts: [
      {
        id: "marte-comms",
        title: "Latencia extrema con cirujanos de vuelo (14m 20s)",
        severity: "critical",
        detail:
          "No hay consultas médicas en tiempo real. La tripulación debe ejecutar primeros auxilios y protocolos autónomos de inmediato.",
      },
      {
        id: "marte-iso",
        title: "Efecto 'Tierra como punto pálido' y Sol de 24h39m",
        severity: "warning",
        detail:
          "Mayor riesgo de soledad, aburrimiento y desajuste del sueño por día marciano más largo. Cumplir tareas diarias.",
      },
    ],
  },
};

export const SYSTEM_DIAGNOSTIC_GUIDES: Record<SystemZoneId, SystemDiagnosticGuide> = {
  cerebro: {
    id: "cerebro",
    name: "Cerebro / Mente",
    shortTitle: "Cerebro y Salud Mental",
    subtitle:
      "Cansancio mental, estrés, tristeza/depresión, soledad, aburrimiento y sueño",
    monitoredVariables: [
      "Cansancio mental y tiempo de reacción",
      "Nivel de estrés y riesgo de depresión",
      "Sensación de soledad y aburrimiento",
      "Horas y regularidad del sueño",
    ],
    howToPerform: [
      "Siéntate tranquilo durante 2 minutos frente a la consola sin usar luces brillantes.",
      "Completa el cuestionario rápido de 30 segundos sobre ánimo, energía y ganas de socializar.",
      "Realiza la prueba de toque rápido en pantalla (evalúa cuánto tardas en reaccionar).",
      "Verifica en tu reloj de misión cuántas horas dormiste sin interrupciones la noche anterior.",
    ],
    whyNecessary:
      "En el espacio tu cerebro trabaja sin referencias naturales de día y noche, lejos de tu familia y con tareas muy repetitivas. Si el cansancio mental o la tristeza crecen sin avisar, puedes cometer errores peligrosos al operar la nave o desconectarte de tus compañeros.",
    fiveHazardsImpact: {
      radiation:
        "Las partículas cósmicas atraviesan el casco y pueden inflamar suavemente las neuronas, provocando lentitud mental o cambios de ánimo.",
      isolation:
        "Estar meses con el mismo grupo pequeño en un lugar cerrado aumenta la sensación de soledad, irritabilidad y aburrimiento.",
      distance:
        "Cuando la Tierra se ve diminuta o las llamadas tardan minutos en llegar, el astronauta siente que está completamente solo ante problemas.",
      gravity:
        "Al flotar, sube más sangre hacia la cabeza y aumenta la presión dentro del cráneo, causando dolor de cabeza y sueño fragmentado.",
      closedEnvironment:
        "El ruido constante de ventiladores, olores reciclados y niveles altos de CO₂ provocan pesadez mental y dificultad para concentrarse.",
    },
    attentionThreshold: {
      optimal: "Sueño ≥ 7 h, reacción < 320 ms, estrés y tristeza < 40/100.",
      warning:
        "Dormir menos de 6 horas por 2 días seguidos, reacción > 370 ms, o aburrimiento/soledad > 60/100.",
      critical:
        "Sueño < 4.5 horas, reacción > 470 ms, o signos claros de agotamiento mental, tristeza profunda (> 75) o confusión.",
      flightSurgeonNote:
        "Si pasa a Amarillo por 48h o Rojo una sola vez, enviar resumen al psicólogo de vuelo en Tierra y reasignar tareas críticas.",
    },
    preventiveCountermeasures: [
      "Tomar una pausa de 15 minutos con luz cálida y música o un videomensaje grabado de familiares.",
      "Mantener horario fijo para dormir usando antifaz y tapones auditivos.",
      "Cambiar de actividad durante 20 minutos (juegos de agilidad mental o charla con un compañero) para cortar la monotonía.",
    ],
  },
  rostro: {
    id: "rostro",
    name: "Rostro / Postura",
    shortTitle: "Expresión y Lenguaje Corporal",
    subtitle:
      "Expresiones faciales, tensión ocular y postura corporal detectadas por cámara",
    monitoredVariables: [
      "Postura de hombros y cuello (encorvamiento)",
      "Tensión facial y frecuencia de parpadeo",
      "Señales visuales de cansancio o apatía",
    ],
    howToPerform: [
      "Abre la pestaña 'Cámara: Lenguaje Corporal y Expresiones' dentro de Nueva Evaluación.",
      "Colócate a unos 50 cm de la cámara de la consola con iluminación frontal pareja.",
      "Mira hacia la cámara durante 5 segundos de forma natural sin forzar una sonrisa.",
      "El sistema medirá automáticamente la caída de hombros, la apertura de ojos y la rigidez del rostro.",
    ],
    whyNecessary:
      "Muchas veces los astronautas dicen 'estoy bien' por orgullo profesional, aunque estén agotados o deprimidos. La cámara detecta señales silenciosas en el cuerpo y la cara antes de que la persona admita que necesita descanso.",
    fiveHazardsImpact: {
      radiation:
        "La fatiga biológica provocada por dosis acumuladas de radiación se refleja rápido como párpados pesados y menor expresividad.",
      isolation:
        "Pasar semanas aislado reduce la expresión emocional del rostro ('rostro plano') y hace que la persona adopte posturas cerradas.",
      distance:
        "Con comunicación diferida, los psicólogos en Tierra no pueden verte en vivo todo el tiempo; la cámara local llena ese vacío.",
      gravity:
        "Sin gravedad, los líquidos suben a la cara ('cara hinchada espacial') y la columna se estira; si no hay ejercicio, aparece postura encorvada al trabajar en consolas.",
      closedEnvironment:
        "El aire seco y las partículas flotantes irritan los ojos, aumentando el parpadeo tenso y la fatiga visual frente a pantallas.",
    },
    attentionThreshold: {
      optimal: "Postura erguida ≥ 75/100 y tensión facial < 35/100.",
      warning:
        "Hombros caídos repetidos (postura < 65) o tensión ocular/facial entre 45 y 70.",
      critical:
        "Postura de agotamiento severo (< 45/100), mirada perdida o tensión > 75/100 acompañada de micro-siestas involuntarias.",
      flightSurgeonNote:
        "Adjuntar captura de métricas faciales al reporte diario y suspender caminatas espaciales o manejo de brazo robótico hasta descansar.",
    },
    preventiveCountermeasures: [
      "Hacer 5 minutos de estiramientos de cuello, espalda y pecho cada 2 horas de trabajo en pantalla.",
      "Aplicar gotas lubricantes oculares y apartar la vista de monitores mirando a otro módulo.",
      "Conversar cara a cara con un compañero de tripulación durante la comida.",
    ],
  },
  corazon: {
    id: "corazon",
    name: "Corazón / Tórax",
    shortTitle: "Corazón y Circulación",
    subtitle:
      "Pulsaciones por minuto (BPM), presión arterial y capacidad cardiovascular",
    monitoredVariables: [
      "Pulsaciones por minuto (BPM) en reposo",
      "Presión arterial (mmHg)",
      "Adaptación de flujo sanguíneo en microgravedad",
    ],
    howToPerform: [
      "Coloca el sensor óptico en tu dedo o la banda pectoral de telemetría tras 5 minutos sentado/quieto.",
      "Ponte el brazalete automático de presión arterial en el brazo izquierdo a la altura del corazón.",
      "Presiona 'Medir' y no hables ni muevas el brazo durante 40 segundos.",
      "Anota o sincroniza las pulsaciones (BPM) y los dos números de la presión arterial.",
    ],
    whyNecessary:
      "En la Tierra, tu corazón trabaja duro cada segundo para subir la sangre desde los pies contra la gravedad. En el espacio no tiene que hacer ese esfuerzo y puede volverse más débil y pequeño si no se vigila, causando mareos peligrosos al aterrizar o en una emergencia.",
    fiveHazardsImpact: {
      radiation:
        "La radiación espacial prolongada puede endurecer poco a poco las arterias y aumentar el riesgo cardiovascular a largo plazo.",
      isolation:
        "El estrés emocional por encierro dispara adrenalina, acelerando el pulso en reposo y subiendo la presión arterial.",
      distance:
        "Si ocurre un problema cardíaco lejos de la Tierra no hay ambulancia posible; detectar cambios de ritmo temprano salva vidas.",
      gravity:
        "En microgravedad, unos 2 litros de sangre suben de las piernas al pecho y cabeza; el corazón cambia de forma y reduce su volumen.",
      closedEnvironment:
        "Si sube el CO₂ o el calor en la cabina, el corazón debe latir más rápido para repartir oxígeno suficiente.",
    },
    attentionThreshold: {
      optimal: "Pulso en reposo 55–85 BPM y presión cercana a 110–125 / 70–82 mmHg.",
      warning:
        "Pulso en reposo > 95 BPM o < 48 BPM, o presión > 135/88 o < 95/60 mmHg.",
      critical:
        "Pulso > 115 BPM en reposo, presión < 85/55 o > 155/95 mmHg, o sensación de mareo/palpitaciones en el pecho.",
      flightSurgeonNote:
        "Alerta prioritaria a los médicos de vuelo en Tierra. Enviar trazo de pulso y detener ejercicio intenso hasta valoración.",
    },
    preventiveCountermeasures: [
      "Cumplir 30–45 minutos de bicicleta fija o cinta de correr con arnés todos los días.",
      "Beber líquidos con electrolitos antes de levantarse o entrar a zonas de mayor gravedad (Luna/Marte).",
      "Practicar respiración lenta (inhala 4 seg, exhala 6 seg) si el pulso sube por estrés.",
    ],
  },
  endocrino: {
    id: "endocrino",
    name: "Sistema Endocrino / Inmunológico",
    shortTitle: "Hormonas y Defensas",
    subtitle:
      "Equilibrio hormonal (cortisol de estrés vs. melatonina del sueño) y defensas del cuerpo",
    monitoredVariables: [
      "Índice de Cortisol (hormona del estrés)",
      "Índice de Melatonina (hormona del sueño)",
      "Dosis de radiación acumulada (CSA mSv)",
    ],
    howToPerform: [
      "Al despertar y antes de dormir, toma una muestra rápida de saliva con la tira reactiva del kit médico.",
      "Inserta la tira en el lector portátil de la cabina durante 60 segundos para leer cortisol y melatonina.",
      "Revisa tu dosímetro personal de radiación (inspirado en el sistema canadiense CSA) y registra los mSv del día.",
    ],
    whyNecessary:
      "Las hormonas son los mensajeros que le dicen a tu cuerpo cuándo estar alerta, cuándo dormir y cómo defenderse de infecciones. En el espacio el reloj interno se desordena y las defensas bajan, haciendo que virus dormidos (como un herpes simple) o alergias puedan reactivarse.",
    fiveHazardsImpact: {
      radiation:
        "La radiación daña células de defensa en la sangre y altera glándulas que regulan hormonas y defensas.",
      isolation:
        "La tensión psicológica continua mantiene elevado el cortisol, lo cual frena el sistema inmune y dificulta cicatrizar.",
      distance:
        "A millones de kilómetros los medicamentos caducan o son limitados; mantener defensas fuertes evita enfermarse sin hospital.",
      gravity:
        "La falta de gravedad altera cómo se comunican las células de defensa, reduciendo su capacidad de responder rápido a bacterias.",
      closedEnvironment:
        "En una cabina cerrada compartes aire y agua reciclada con los mismos microbios; si tus defensas bajan, los contagios son inmediatos.",
    },
    attentionThreshold: {
      optimal: "Cortisol < 48/100, Melatonina entre 55–85/100 y radiación diaria estable.",
      warning:
        "Cortisol entre 55–72/100 o Melatonina < 45/100 por desajuste de horario.",
      critical:
        "Cortisol > 75/100 (estrés agudo sostenido), Melatonina < 30/100, o radiación diaria superior al límite de alerta.",
      flightSurgeonNote:
        "Reportar al equipo médico de Tierra para ajustar ciclos de luz azul/roja, suplemento de melatonina y revisar refugio radiológico.",
    },
    preventiveCountermeasures: [
      "Usar luz azul intensa durante las primeras horas de trabajo y luz tenue sin pantallas 1 hora antes de dormir.",
      "Respetar pausas de descanso para bajar el cortisol tras actividades extravehiculares.",
      "Mantener limpieza estricta de manos y filtros de cabina.",
    ],
  },
  abdomen: {
    id: "abdomen",
    name: "Abdomen / Metabolismo",
    shortTitle: "Energía, Azúcar e Hidratación",
    subtitle:
      "Azúcar en la sangre (mg/dL), balance de agua en el cuerpo y nutrición",
    monitoredVariables: [
      "Azúcar en la sangre (mg/dL)",
      "Hidratación (% de balance hídrico)",
      "Temperatura corporal (°C) y comidas cumplidas",
    ],
    howToPerform: [
      "Usa el sensor cutáneo continuo en el brazo (o punción capilar rápida) para leer tu glucosa en mg/dL.",
      "Revisa tu botella dosificadora para confirmar cuántos litros de agua has bebido hoy (meta: 2.5 L).",
      "Si sientes hinchazón o pesadez digestiva, aplica el cabezal de ultrasonido portátil con gel sobre el abdomen siguiendo las marcas guía.",
    ],
    whyNecessary:
      "En el espacio cambia la sensación de sed y el sabor de la comida, por lo que muchos astronautas comen o beben menos sin darse cuenta. Si baja el azúcar te mareas y pierdes fuerza; si te deshidratas, pueden formarse cálculos en los riñones.",
    fiveHazardsImpact: {
      radiation:
        "Puede alterar la flora intestinal normal y dificultar que el cuerpo aproveche vitaminas y antioxidantes.",
      isolation:
        "El estrés o aburrimiento cambia el apetito: hace que saltes comidas o pierdas el gusto por las raciones espaciales.",
      distance:
        "No llegan alimentos frescos de reabastecimiento en misiones a Marte; cada caloría y litro de agua reciclada cuenta.",
      gravity:
        "Al flotar, los líquidos se distribuyen distinto y engañan al cerebro haciéndole creer que ya tiene suficiente agua, provocando deshidratación silenciosa.",
      closedEnvironment:
        "La comida deshidratada o enlatada y el agua reciclada requieren vigilar sales minerales y digestión lenta por falta de gravedad.",
    },
    attentionThreshold: {
      optimal: "Azúcar 75–115 mg/dL, hidratación ≥ 80%, temperatura 36.2–37.2 °C.",
      warning:
        "Azúcar 65–74 o 125–155 mg/dL, hidratación entre 68–79%, o saltarse una comida principal.",
      critical:
        "Azúcar < 65 mg/dL (riesgo de desmayo) o > 180 mg/dL, hidratación < 68%, o temperatura > 38.0 °C.",
      flightSurgeonNote:
        "Si la glucosa cae de 65 mg/dL o la hidratación baja de 68%, tratar como prioridad inmediata antes de notificar al cirujano de vuelo.",
    },
    preventiveCountermeasures: [
      "Beber un sobre de gel de glucosa o jugo espacial de inmediato si el azúcar baja de 70 mg/dL.",
      "Programar alarmas cada 90 minutos para tomar 250 ml de agua con sales minerales.",
      "Completar las 3 raciones diarias aunque no sientas hambre.",
    ],
  },
  musculo: {
    id: "musculo",
    name: "Sistema Musculoesquelético",
    shortTitle: "Huesos y Músculos",
    subtitle:
      "Cansancio físico, fuerza muscular y pérdida de densidad de los huesos",
    monitoredVariables: [
      "Cansancio físico acumulado (0–100)",
      "Índice de densidad ósea (%)",
      "Minutos diarios de ejercicio resistivo (ARED)",
    ],
    howToPerform: [
      "Después del ejercicio diario, evalúa del 1 al 10 qué tan fatigadas sientes piernas y espalda baja.",
      "Una vez por semana, usa el escáner portátil de ultrasonido sobre el talón o fémur para medir la densidad del hueso.",
      "Comprueba en el registro de ejercicio que completaste los minutos diarios de levantamiento de resistencia.",
    ],
    whyNecessary:
      "Sin el peso de la gravedad, los huesos liberan calcio y se vuelven frágiles muy rápido (hasta 1–1.5% por mes), y los músculos de las piernas se encogen. Si llegas a la Luna o Marte con huesos débiles, una simple caída puede causar una fractura grave.",
    fiveHazardsImpact: {
      radiation:
        "La radiación cósmica acelera la destrucción del hueso sano y retrasa la reparación de fibras musculares fatigadas.",
      isolation:
        "La falta de motivación por aburrimiento o tristeza suele hacer que el astronauta se salte sus rutinas de pesas.",
      distance:
        "En Marte no hay rescate inmediato ni cirugía ortopédica avanzada ante una fractura o lesión lumbar.",
      gravity:
        "Es el peligro número uno para este sistema: en 0g (y parcialmente en 0.16g/0.38g) el esqueleto no recibe impacto y pierde calcio rápidamente.",
      closedEnvironment:
        "Los módulos pequeños limitan el movimiento natural de caminar; todo esfuerzo físico debe hacerse en máquinas compactas.",
    },
    attentionThreshold: {
      optimal: "Cansancio físico < 45/100, densidad ósea ≥ 94% y ≥ 90 min de ejercicio.",
      warning:
        "Cansancio físico 50–74/100, densidad ósea 89–93% o dolor muscular persistente por más de 2 días.",
      critical:
        "Cansancio físico ≥ 75/100, densidad ósea < 89% o dolor articular agudo que impida usar el traje espacial.",
      flightSurgeonNote:
        "Reducir carga de pesas por 48 h, revisar vitamina D/calcio con el médico de vuelo y programar revisión por ultrasonido.",
    },
    preventiveCountermeasures: [
      "Realizar 60 min de ejercicio de resistencia (ARED o bandas de alta carga) + 30 min de ejercicio aeróbico.",
      "Tomar el suplemento diario de Vitamina D y mantener buena hidratación para evitar cálculos por exceso de calcio en orina.",
      "Realizar estiramientos suaves de espalda baja antes de dormir.",
    ],
  },
};

export const DEFAULT_BIOMARKERS: BiomarkerData = {
  bpm: 68,
  systolicBP: 118,
  diastolicBP: 76,
  bloodGlucoseMgDl: 94,
  bodyTempC: 36.6,
  hydrationPercent: 86,
  cortisolIndex: 34,
  melatoninIndex: 72,
  physicalFatigue: 28,
  boneDensityIndex: 96,
  dailyRadiationMsv: 0.45,
  cumulativeRadiationMsv: 42.8,
  mentalFatigue: 26,
  reactionTimeMs: 255,
  stressLevel: 29,
  depressionRisk: 16,
  lonelinessLevel: 24,
  boredomLevel: 28,
  stimulationIndex: 72,
  sleepHours: 7.4,
  moodScore: 84,
  postureScore: 85,
  facialTension: 22,
  spo2Percent: 98,
  respiratoryRateRpm: 15,
  minuteVentilationLpm: 6.4,
  hrvRmssdMs: 42,
  pttMs: 194,
  perfusionIndex: 3.8,
  skinTempC: 33.8,
  lastOscillometricCalHours: 4,
  pttCalibrationRequired: false,
};

export const DEFAULT_ROUTINE: RoutineTracking = {
  sleepStartTime: "22:35",
  baselineSleepStartTime: "22:30",
  sleepDeviationMin: 5,
  exerciseMinutes: 115,
  baselineExerciseMinutes: 120,
  mealsCompleted: 3,
  baselineMeals: 3,
  mealDeviationMin: 10,
  hydrationLiters: 2.4,
  baselineHydrationLiters: 2.5,
};

export const DEFAULT_HISTORY: TelemetryPoint[] = [
  {
    label: "Día 133",
    bpm: 66,
    glucose: 96,
    hydration: 88,
    physicalFatigue: 25,
    mentalFatigue: 22,
    cortisol: 30,
    melatonin: 76,
    stress: 24,
    loneliness: 19,
    boredom: 22,
    routineStability: 94,
  },
  {
    label: "Día 134",
    bpm: 70,
    glucose: 93,
    hydration: 85,
    physicalFatigue: 32,
    mentalFatigue: 28,
    cortisol: 36,
    melatonin: 72,
    stress: 31,
    loneliness: 22,
    boredom: 26,
    routineStability: 91,
  },
  {
    label: "Día 135",
    bpm: 74,
    glucose: 89,
    hydration: 81,
    physicalFatigue: 38,
    mentalFatigue: 35,
    cortisol: 41,
    melatonin: 67,
    stress: 37,
    loneliness: 27,
    boredom: 33,
    routineStability: 86,
  },
  {
    label: "Día 136",
    bpm: 72,
    glucose: 91,
    hydration: 83,
    physicalFatigue: 35,
    mentalFatigue: 31,
    cortisol: 38,
    melatonin: 70,
    stress: 34,
    loneliness: 26,
    boredom: 31,
    routineStability: 88,
  },
  {
    label: "Día 137",
    bpm: 69,
    glucose: 95,
    hydration: 85,
    physicalFatigue: 30,
    mentalFatigue: 27,
    cortisol: 35,
    melatonin: 74,
    stress: 28,
    loneliness: 24,
    boredom: 27,
    routineStability: 92,
  },
  {
    label: "Día 138",
    bpm: 68,
    glucose: 94,
    hydration: 86,
    physicalFatigue: 28,
    mentalFatigue: 26,
    cortisol: 34,
    melatonin: 72,
    stress: 29,
    loneliness: 24,
    boredom: 28,
    routineStability: 93,
  },
];

export const DEFAULT_QUESTS: MissionQuest[] = [
  {
    id: "quest-ared",
    title: "120–150 min ejercicio combinado (ARED + CEVIS/T2)",
    category: "fisico",
    durationLabel: "120–150 min/día",
    description:
      "Protocolo diario en órbita: ~60 min de entrenamiento resistivo ARED (sentadillas, peso muerto, tracción) + ~60–90 min aeróbico en cicloergómetro CEVIS o cinta T2/COLBERT.",
    impactDescription:
      "Mitiga pérdida ósea (1–1.5%/mes en 0g), atrofia muscular y desacondicionamiento cardiovascular",
    nasaStandard: "NASA HRP ISS: 2 a 2.5 h/día (resistencia + cardio)",
    nasaSource: "NASA HRP · Countermeasures for Bone & Muscle Loss",
    previousComparison:
      "Ajustado al alza frente al borrador previo (antes 60 min solo ARED) para igualar la pauta oficial ISS.",
    completed: false,
  },
  {
    id: "quest-hydration",
    title: "Hidratación ≥ 2.5 L/día (NASA-STD-3001)",
    category: "hidratacion",
    durationLabel: "≥ 32 mL/kg",
    description:
      "Distribuir ≥ 2.5 L/día en hombres (≥ 2.1 L en mujeres) más reposición post-ARED para compensar la redistribución de líquidos en microgravedad y proteger la filtración renal.",
    impactDescription:
      "Mantiene balance hídrico y reduce riesgo de cálculos renales (2.ª causa potencial de evacuación médica)",
    nasaStandard: "NASA-STD-3001: ≥ 32 mL/kg/día (~2.1–2.5 L base)",
    nasaSource: "NASA-STD-3001 · HRP Risk of Renal Stone Formation",
    previousComparison:
      "Validado contra NASA-STD-3001; incorpora diferenciación clínica base y prevención renal.",
    completed: false,
  },
  {
    id: "quest-family",
    title: "Pausa psicosocial / Enlace familiar (Protocolo BHP)",
    category: "mental",
    durationLabel: "20–30 min/día",
    description:
      "Tiempo protegido de desconexión fuera de consola: videomensaje asíncrono o contacto con casa, ocio grupal y seguimiento para conferencias psicológicas privadas (PPC).",
    impactDescription:
      "Previene fatiga conductual, aislamiento prolongado, deterioro anímico y conflictos de equipo",
    nasaStandard: "NASA BHP: Ocio protegido, soporte familiar y PPC",
    nasaSource: "NASA HRP · Behavioral Health & Performance (BHP)",
    previousComparison:
      "Validado con prácticas oficiales BHP en ISS/CHAPEA; añade respaldo explícito para enlaces asíncronos.",
    completed: false,
  },
  {
    id: "quest-circadian",
    title: "Iluminación circadiana SSLA y sueño protegido (8–8.5 h)",
    category: "circadiano",
    durationLabel: "8–8.5 h + SSLA",
    description:
      "Emplear luminarias LED SSLA de espectro azul en fase activa y luz cálida tenue 60–90 min antes de dormir, protegiendo 8–8.5 h de sueño con antifaz ante los 16 amaneceres/día.",
    impactDescription:
      "Estabiliza melatonina y cortisol; evita el déficit orbital típico (~6 h reales vs. 8.5 h meta)",
    nasaStandard: "NASA SSLA + NASA-STD-3001: 8–8.5 h oportunidad de sueño",
    nasaSource: "NASA HRP · ISS Solid State Lighting Assemblies (SSLA)",
    previousComparison:
      "Ampliado vs. versión previa: incorpora la meta oficial de 8–8.5 h de descanso junto a SSLA.",
    completed: false,
  },
  {
    id: "quest-csa-check",
    title: "Vitamina D (800 UI), nutrición y dosimetría CSA",
    category: "fisico",
    durationLabel: "800 UI + 3 tomas",
    description:
      "Ingerir suplemento diario de 800 UI de Vitamina D (sin radiación UV en cabina), completar raciones calóricas con antioxidantes y registrar la dosis diaria del dosímetro CSA Radi-N2.",
    impactDescription:
      "Respalda absorción cálcica/ósea en conjunto con ARED y vigilancia de exposición en mSv",
    nasaStandard: "NASA Nutrition: 800 UI/día Vit. D + dosímetro Radi-N2",
    nasaSource: "NASA HRP Space Nutrition · CSA Radi-N2 Dosimetry",
    previousComparison:
      "Actualizado: incorpora la dosis oficial diaria de 800 UI de Vitamina D ausente anteriormente.",
    completed: false,
  },
];

export const NASA_DEFAULT_HABITS_BY_ID: Record<string, MissionQuest> =
  Object.fromEntries(DEFAULT_QUESTS.map((habit) => [habit.id, habit]));

export function hydrateRecommendedHabits(
  stored?: MissionQuest[]
): MissionQuest[] {
  if (!Array.isArray(stored) || stored.length === 0) {
    return DEFAULT_QUESTS;
  }

  const storedById = new Map(stored.map((item) => [item.id, item]));
  const updatedBuiltIns = DEFAULT_QUESTS.map((def) => {
    const existing = storedById.get(def.id);
    return existing ? { ...def, completed: Boolean(existing.completed) } : def;
  });

  const customHabits = stored.filter(
    (item) => !(item.id in NASA_DEFAULT_HABITS_BY_ID)
  );

  return [...updatedBuiltIns, ...customHabits];
}

export const DEFAULT_EMERGENCY_CHECKLIST: EmergencyProtocolStep[] = [
  {
    id: "em-1",
    stepNumber: 1,
    title: "Estabilización Física Inmediata (Primeros 2 min)",
    instruction:
      "Detener toda operación crítica o EVA. Sentar/sujetar al astronauta, administrar 300 ml de solución electrolítica y gel de glucosa oral (15 g) por caída de azúcar en sangre.",
    completed: false,
  },
  {
    id: "em-2",
    stepNumber: 2,
    title: "Verificación de Cabina y Oxígeno",
    instruction:
      "Confirmar en panel ambiental que el CO₂ esté bajo control (< 4.0 mmHg) y encender ventilación dirigida para descartar hipoxia o estrés térmico.",
    completed: false,
  },
  {
    id: "em-3",
    stepNumber: 3,
    title: "Empaquetado Automático de Telemetría Médica",
    instruction:
      "Adjuntar en el canal prioritario: pulso (BPM), glucosa (mg/dL), presión arterial, lectura de estrés/cortisol y captura de lenguaje corporal de cámara.",
    completed: false,
  },
  {
    id: "em-4",
    stepNumber: 4,
    title: "Enlace con Cirujanos de Vuelo en Tierra (Houston / CSA)",
    instruction:
      "Transmitir alerta médica código Ámbar/Rojo usando el protocolo activo del entorno. Si existe latencia alta (Nave o Marte), ejecutar guía autónoma sin esperar respuesta.",
    completed: false,
  },
  {
    id: "em-5",
    stepNumber: 5,
    title: "Reevaluación en 15 Minutos y Reposo Asistido",
    instruction:
      "Repetir lectura de glucosa y frecuencia cardíaca a los 15 minutos, asignar relevo de guardia a un compañero y activar luz suave de recuperación.",
    completed: false,
  },
];

export const CSA_RADIATION_LIMITS = {
  dailyNominalMsv: 0.65,
  dailyAlertMsv: 1.45,
  annualLimitMsv: 200,
  careerLimitMsv: 600,
  instrumentName: "Dosímetro CSA Radi-N2 / EVARM",
};

export const INITIAL_DASHBOARD_STATE: AstronautDashboardState = {
  environmentId: "iss",
  telemedicineEnabled: true,
  missionDay: 138,
  astronautName: "Cmdte. Elena Vance",
  crewRole: "Especialista de Misión · Biología & Operaciones",
  biomarkers: DEFAULT_BIOMARKERS,
  previousBiomarkers: {
    ...DEFAULT_BIOMARKERS,
    bpm: 69,
    hydrationPercent: 85,
    stressLevel: 31,
    mentalFatigue: 28,
  },
  routine: DEFAULT_ROUTINE,
  history: DEFAULT_HISTORY,
  quests: DEFAULT_QUESTS,
  emergencyMode: false,
  emergencyChecklist: DEFAULT_EMERGENCY_CHECKLIST,
  lastUltrasoundFinding:
    "Densidad ósea femoral y flujo hídrico dentro de parámetros nominales.",
  lastCameraFinding:
    "Postura erguida (85/100) y microexpresión serena sin signos de agotamiento.",
  scanLogs: [
    {
      id: "log-1",
      timestamp: "07:15 UTC",
      modality: "manual",
      summary: "Chequeo matutino nominal tras 7.4h de sueño.",
    },
    {
      id: "log-2",
      timestamp: "10:30 UTC",
      modality: "camara",
      summary: "Evaluación facial: tensión ocular baja (22/100), buen enfoque.",
    },
  ],
};

export interface ScientificReferenceSection {
  id: string;
  agency: string;
  badge: string;
  title: string;
  description: string;
  items: { name: string; detail: string; appMapping: string }[];
}

export const SCIENTIFIC_REFERENCES: ScientificReferenceSection[] = [
  {
    id: "nasa-hrp",
    agency: "NASA Human Research Program (HRP)",
    badge: "5 Peligros de los Vuelos Espaciales",
    title: "Los 5 Riesgos Fundamentales de la Exploración Espacial Humana",
    description:
      "Marco científico oficial de la NASA utilizado para diseñar las evaluaciones anatómicas, biomarcadores conductuales y contramedidas preventivas de este software.",
    items: [
      {
        name: "1. Radiación Espacial",
        detail:
          "Fuera del escudo magnético terrestre los astronautas reciben radiación cósmica galáctica (GCR) y eventos de partículas solares, elevando riesgos neurológicos, cardiovasculares y de cáncer.",
        appMapping:
          "Monitoreado en mSv/día y acumulados según el entorno de misión (ISS, Nave, Luna, Marte).",
      },
      {
        name: "2. Aislamiento y Confinamiento",
        detail:
          "Convivir meses en espacios pequeños con tripulaciones reducidas provoca declive del ánimo, trastornos de sueño, aburrimiento crónico, soledad y conflictos.",
        appMapping:
          "Evaluado con índices de Soledad, Aburrimiento, Estrés, Depresión, Detector de Rutina y Cámara de Lenguaje Corporal.",
      },
      {
        name: "3. Distancia de la Tierra",
        detail:
          "En tránsito espacial o en Marte la latencia alcanza hasta 20+ minutos por sentido, impidiendo asistencia médica en tiempo real o evacuación de emergencia.",
        appMapping:
          "Protocolo autónomo paso a paso para contacto con cirujanos de vuelo y guías sin jerga médica para tripulantes no médicos.",
      },
      {
        name: "4. Campos de Gravedad Alterados",
        detail:
          "Pasar de 1g terrestre a 0g, 0.16g (Luna) o 0.38g (Marte) causa desplazamiento cefálico de fluidos, desacondicionamiento cardiovascular y pérdida acelerada de hueso y músculo.",
        appMapping:
          "Recálculo automático de gravedad y riesgos musculoesqueléticos, cardiovasculares e hídricos + hábitos NASA (ARED + aeróbico CEVIS/T2).",
      },
      {
        name: "5. Ambientes Cerrados Hostiles",
        detail:
          "Cabinas recicladas enfrentan acumulación localizada de CO₂, microbios resistentes, ruido continuo, polvo lunar abrasivo y ciclos de iluminación artificiales.",
        appMapping:
          "Telemetría ambiental de cabina, calibración circadiana de melatonina/cortisol y alertas por entorno.",
      },
    ],
  },
  {
    id: "csa-radiation",
    agency: "Agencia Espacial Canadiense (CSA / ASC)",
    badge: "Monitoreo Radiológico & Salud en Órbita",
    title: "Programa de Dosimetría de Radiación y Contramedidas Médicas CSA",
    description:
      "Inspirado en los instrumentos canadienses a bordo de la Estación Espacial Internacional (como Radi-N2 y EVARM) y la iniciativa Deep Space Healthcare Challenge de la CSA y NASA.",
    items: [
      {
        name: "Detección de Neutrones y Dosimetría Activa (Radi-N2 / EVARM)",
        detail:
          "La CSA desarrolla detectores de burbujas y dosímetros personales que distinguen la dosis real absorbida por órganos y tejidos ante radiación secundaria dentro de las naves y durante caminatas espaciales.",
        appMapping:
          "Tarjeta dedicada de Exposición a Radiación (mSv/día y dosis acumulada) integrada con cada escenario espacial.",
      },
      {
        name: "Detección Temprana de Cambios Fisiológicos y Autonomía",
        detail:
          "Los programas biomédicos canadienses enfatizan monitoreo no invasivo (ultrasonido guiado, análisis óptico/salival y sensores portátiles) operable por astronautas sin formación médica clínica.",
        appMapping:
          "Red vestible modular (Pecho · Cabeza · Dedo), cámara de expresiones/postura y guías paso a paso redactadas en lenguaje simple.",
      },
    ],
  },
];
