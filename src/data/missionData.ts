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
    name: "International Space Station (ISS)",
    shortName: "ISS (Low Earth Orbit)",
    agencyProgram: "Low Earth Orbit · 408 km",
    gravityG: 0.0,
    gravityLabel: "0.00g (Microgravity)",
    dailyRadiationMsv: 0.45,
    radiationFactorLabel: "0.45 mSv/day (Partial magnetosphere shielding)",
    commLatencySeconds: 0.4,
    commLatencyLabel: "< 0.5 sec (Near real-time link)",
    commProtocol: "TDRS Direct Link S/Ku-Band",
    cabinPressureKpa: 101.3,
    co2MmHg: 2.3,
    description:
      "Orbital laboratory with rapid Earth Flight Surgeon support, 16 orbital sunrise cycles per 24 h, and mandatory daily resistive exercise (ARED).",
    boneLoadFactor: 1.0,
    isolationRiskBonus: 0,
    alerts: [
      {
        id: "iss-co2",
        title: "Localized CO₂ Accumulation",
        severity: "optimal",
        detail:
          "Nominal ventilation (2.3 mmHg). In microgravity, air does not circulate naturally; keep personal airflow fans active near the face.",
      },
      {
        id: "iss-circadian",
        title: "16 Orbital Day/Night Cycles",
        severity: "warning",
        detail:
          "External sunlight shifts every 45 min. Use scheduled cabin LED lighting (SSLA) to protect melatonin synthesis.",
      },
    ],
  },
  nave: {
    id: "nave",
    name: "Spacecraft (Transit)",
    shortName: "Spacecraft",
    agencyProgram: "Cislunar / Deep Space Transit · Orion",
    gravityG: 0.0,
    gravityLabel: "0.00g (Microgravity)",
    dailyRadiationMsv: 1.25,
    radiationFactorLabel: "1.25 mSv/day (Outside protective magnetosphere)",
    commLatencySeconds: 110,
    commLatencyLabel: "1 min 50 sec (Round trip ~3.6 min)",
    commProtocol: "Deep Space Network (DSN)",
    cabinPressureKpa: 70.3,
    co2MmHg: 3.1,
    description:
      "Compact transit cabin beyond Earth's magnetic shielding. Elevated exposure to solar particles and reduced habitable volume.",
    boneLoadFactor: 1.15,
    isolationRiskBonus: 10,
    alerts: [
      {
        id: "nave-rad",
        title: "Elevated Exposure Beyond LEO",
        severity: "warning",
        detail:
          "Galactic cosmic radiation increases to ~1.25 mSv/day. Monitor CSA dosimeter and prepare storm shelter protocols.",
      },
      {
        id: "nave-space",
        title: "Confinement in Reduced Volume",
        severity: "warning",
        detail:
          "Smaller habitable volume elevates interpersonal stress and postural fatigue. Prioritize cognitive breaks and stretching.",
      },
    ],
  },
  luna: {
    id: "luna",
    name: "Lunar Base (Artemis Program)",
    shortName: "Artemis Lunar Base",
    agencyProgram: "Lunar South Pole · Artemis Program",
    gravityG: 0.16,
    gravityLabel: "0.16g (1/6 Earth Gravity)",
    dailyRadiationMsv: 0.95,
    radiationFactorLabel: "0.95 mSv/day (No atmosphere or magnetic field)",
    commLatencySeconds: 2.6,
    commLatencyLabel: "2.6 sec (Round trip)",
    commProtocol: "Lunar Gateway Relay / Ka-Band",
    cabinPressureKpa: 56.5,
    co2MmHg: 2.8,
    description:
      "Pressurized lunar surface habitat. Partial gravity slightly aids balance, though bone density loss and abrasive lunar dust risks persist.",
    boneLoadFactor: 0.85,
    isolationRiskBonus: 8,
    alerts: [
      {
        id: "luna-dust",
        title: "Abrasive Lunar Dust Mitigation",
        severity: "warning",
        detail:
          "After lunar EVAs, inspect suit seals and air filtration to prevent respiratory or dermal irritation.",
      },
      {
        id: "luna-rad",
        title: "Surface Radiation & Secondary Ejecta",
        severity: "warning",
        detail:
          "Without atmospheric protection, regolith shielding reduces internal habitat exposure to 0.95 mSv/day.",
      },
    ],
  },
  marte: {
    id: "marte",
    name: "Mars Surface Rover",
    shortName: "Mars Rover",
    agencyProgram: "Martian Surface Exploration · Sol 142",
    gravityG: 0.38,
    gravityLabel: "0.38g (Martian Gravity)",
    dailyRadiationMsv: 1.65,
    radiationFactorLabel: "1.65 mSv/day (Thin atmosphere, high GCR)",
    commLatencySeconds: 860,
    commLatencyLabel: "14 min 20 sec (One-way · 28m 40s RTT)",
    commProtocol: "Medical Autonomy + Store & Forward",
    cabinPressureKpa: 58.0,
    co2MmHg: 3.4,
    description:
      "Autonomous mobile exploration millions of kilometers from Earth. Real-time consultation with flight surgeons is impossible; extreme visual isolation.",
    boneLoadFactor: 0.65,
    isolationRiskBonus: 18,
    alerts: [
      {
        id: "marte-comms",
        title: "Extreme Latency to Flight Surgeons (14m 20s)",
        severity: "critical",
        detail:
          "No real-time medical consultation available. Crew must execute autonomous first-aid and clinical protocols immediately.",
      },
      {
        id: "marte-iso",
        title: "'Earth-out-of-View' Effect & 24h39m Sol",
        severity: "warning",
        detail:
          "Increased risk of loneliness, monotony, and circadian drift caused by the longer Martian Sol. Maintain daily countermeasures.",
      },
    ],
  },
};

export const SYSTEM_DIAGNOSTIC_GUIDES: Record<SystemZoneId, SystemDiagnosticGuide> = {
  cerebro: {
    id: "cerebro",
    name: "Brain / Behavioral",
    shortTitle: "Neurocognitive & Behavioral Health",
    subtitle:
      "Mental fatigue, stress, depressive mood, loneliness, monotony, and sleep architecture",
    monitoredVariables: [
      "Mental fatigue and reaction time",
      "Stress index and depressive mood risk",
      "Perceived loneliness and boredom",
      "Sleep duration and circadian regularity",
    ],
    howToPerform: [
      "Sit quietly for 2 minutes in front of the console away from glare or bright lights.",
      "Complete the 30-second self-report check on mood, energy, and social motivation.",
      "Perform the on-screen reaction-time tap test to measure psychomotor speed.",
      "Verify uninterrupted sleep hours from the previous night on your mission wrist log.",
    ],
    whyNecessary:
      "In space your brain operates without natural sunrise/sunset cues, far from family, under repetitive workloads. Unnoticed mental fatigue or depressive drift increases human error during critical spacecraft operations and degrades crew cohesion.",
    fiveHazardsImpact: {
      radiation:
        "Cosmic particles penetrate spacecraft hull shielding and can induce low-grade neuroinflammation, slowing cognition or altering mood.",
      isolation:
        "Spending months with a small crew in a confined module increases loneliness, irritability, and chronic monotony.",
      distance:
        "When Earth shrinks out of view and communication delays reach minutes, crew members experience acute psychological autonomy pressure.",
      gravity:
        "Cephalad fluid shift raises intracranial pressure in microgravity, contributing to headaches and fragmented sleep.",
      closedEnvironment:
        "Continuous fan noise, recycled cabin odors, and elevated CO₂ cause cognitive heaviness and difficulty concentrating.",
    },
    attentionThreshold: {
      optimal: "Sleep ≥ 7 h, reaction < 320 ms, stress and depression risk < 40/100.",
      warning:
        "Sleep < 6 hours for 2 consecutive nights, reaction > 370 ms, or boredom/loneliness > 60/100.",
      critical:
        "Sleep < 4.5 hours, reaction > 470 ms, or clear signs of exhaustion, deep sadness (> 75), or disorientation.",
      flightSurgeonNote:
        "If Caution persists for 48h or any Critical trigger occurs, transmit summary to Ground Flight Psychologist and reassign critical ops.",
    },
    preventiveCountermeasures: [
      "Take a 15-minute break under warm lighting with music or a pre-recorded family video message.",
      "Maintain a fixed sleep schedule using sleep mask and acoustic ear protection.",
      "Switch activities for 20 minutes (cognitive agility exercises or peer conversation) to break monotony.",
    ],
  },
  rostro: {
    id: "rostro",
    name: "Face / Posture",
    shortTitle: "Facial & Postural Telemetry",
    subtitle:
      "Facial micro-expressions, ocular tension, and upper-body posture tracked via camera",
    monitoredVariables: [
      "Shoulder and cervical posture (slump angle)",
      "Facial tension and blink rate",
      "Visual markers of exhaustion or flat affect",
    ],
    howToPerform: [
      "Open the 'Computer Vision (Face & Posture)' tab inside New Clinical Assessment.",
      "Position yourself ~50 cm from the console camera under even frontal lighting.",
      "Look steadily toward the camera for 5 seconds with a relaxed expression.",
      "The system automatically quantifies shoulder droop, eye aperture, and facial muscle stiffness.",
    ],
    whyNecessary:
      "Crew members frequently report feeling 'nominal' out of mission duty even while fatigued or depressed. Optical computer vision detects silent neuromuscular cues before subjective distress is acknowledged.",
    fiveHazardsImpact: {
      radiation:
        "Cumulative radiation-related biological fatigue manifests early as heavy eyelids and reduced facial expressiveness.",
      isolation:
        "Weeks of confinement flatten emotional expressiveness ('flat affect') and encourage closed, hunched postures.",
      distance:
        "With delayed communications, ground psychologists cannot observe crew continuously; onboard vision fills this monitoring gap.",
      gravity:
        "Without gravity, fluids pool in the face ('puffy-face syndrome') and spinal elongation causes forward slouching over consoles.",
      closedEnvironment:
        "Dry recycled cabin air and particulates irritate the eyes, increasing strained blinking and visual screen fatigue.",
    },
    attentionThreshold: {
      optimal: "Upright posture ≥ 75/100 and facial tension < 35/100.",
      warning:
        "Repeated shoulder slump (posture < 65) or facial/ocular tension between 45 and 70.",
      critical:
        "Severe exhaustion posture (< 45/100), vacant gaze, or tension > 75/100 with involuntary micro-sleeps.",
      flightSurgeonNote:
        "Attach camera biometric capture to daily medical log and suspend EVAs or robotics ops pending recovery.",
    },
    preventiveCountermeasures: [
      "Perform 5 minutes of neck, dorsal, and chest stretches every 2 hours of console work.",
      "Apply lubricating eye drops and shift gaze away from displays toward a distant module bulkhead.",
      "Engage in face-to-face conversation with a crewmate during meal periods.",
    ],
  },
  corazon: {
    id: "corazon",
    name: "Heart / Thorax",
    shortTitle: "Cardiovascular & Pulmonary",
    subtitle:
      "Heart rate (BPM), arterial blood pressure, and autonomic vascular adaptation",
    monitoredVariables: [
      "Resting heart rate (BPM)",
      "Arterial blood pressure (mmHg)",
      "Microgravity hemodynamic fluid shift",
    ],
    howToPerform: [
      "Ensure the Bio-Monitor 3N chest harness or finger SpO₂ optical clip is seated after 5 min at rest.",
      "Place the automated BP cuff on the left arm aligned at heart level.",
      "Initiate measurement and remain silent and still for 40 seconds.",
      "Confirm synchronized BPM and systolic/diastolic pressure readings on the console.",
    ],
    whyNecessary:
      "On Earth, the heart works continuously against gravity to pump blood upward from the legs. In space, reduced workload causes myocardial atrophy and orthostatic intolerance, creating syncope risk during landing or planetary EVAs.",
    fiveHazardsImpact: {
      radiation:
        "Prolonged space radiation accelerates arterial stiffness and long-term cardiovascular disease risk.",
      isolation:
        "Chronic confinement elevates sympathetic adrenaline, raising resting heart rate and arterial pressure.",
      distance:
        "Deep-space crews have no emergency medevac option; early arrhythmia or hypotension detection is life-critical.",
      gravity:
        "In microgravity, ~2 liters of fluid shift from legs to thorax and head, remodeling cardiac chamber volume.",
      closedEnvironment:
        "Elevated cabin CO₂ or thermal load forces cardiac output upward to sustain oxygen delivery.",
    },
    attentionThreshold: {
      optimal: "Resting HR 55–85 BPM and BP around 110–125 / 70–82 mmHg.",
      warning:
        "Resting HR > 95 or < 48 BPM, or BP > 135/88 or < 95/60 mmHg.",
      critical:
        "Resting HR > 115 BPM, BP < 85/55 or > 155/95 mmHg, or presyncope/palpitations.",
      flightSurgeonNote:
        "Issue priority alert to Ground Flight Surgeons. Downlink ECG strip and halt strenuous exercise pending evaluation.",
    },
    preventiveCountermeasures: [
      "Complete 30–45 minutes of daily aerobic cycling (CEVIS) or harnessed treadmill running (T2).",
      "Consume electrolyte fluids prior to re-entry or transitions into partial gravity (Moon/Mars).",
      "Practice paced breathing (4 sec inhale, 6 sec exhale) when stress spikes heart rate.",
    ],
  },
  endocrino: {
    id: "endocrino",
    name: "Endocrine / Immune",
    shortTitle: "Hormones & Immune Defense",
    subtitle:
      "Hormonal equilibrium (stress cortisol vs. sleep melatonin) and radiation immunity",
    monitoredVariables: [
      "Cortisol index (stress biomarker)",
      "Melatonin index (circadian hormone)",
      "Cumulative radiation dose (CSA mSv)",
    ],
    howToPerform: [
      "Upon waking and prior to sleep, collect a rapid salivary sample using the medical kit swab.",
      "Insert test strip into the portable cabin reader for 60 seconds to quantify cortisol and melatonin.",
      "Verify your personal radiation dosimeter (CSA Radi-N2 architecture) and log daily mSv.",
    ],
    whyNecessary:
      "Hormones coordinate alertness, sleep cycles, and immune pathogen defense. In orbit, disrupted circadian cues and immune dysregulation can trigger viral reactivation (e.g., herpesviruses) or hypersensitivity reactions.",
    fiveHazardsImpact: {
      radiation:
        "Ionizing radiation damages circulating lymphocytes and disrupts neuroendocrine regulatory glands.",
      isolation:
        "Sustained psychological strain elevates baseline cortisol, suppressing immune recovery and tissue healing.",
      distance:
        "Millions of kilometers from Earth, onboard pharmacy shelf-life is finite; maintaining innate immunity is essential.",
      gravity:
        "Microgravity alters leukocyte signaling pathways, slowing immune activation against bacterial pathogens.",
      closedEnvironment:
        "Recycled cabin air and water circulate shared crew microbiomes; depressed immunity raises cross-infection risk.",
    },
    attentionThreshold: {
      optimal: "Cortisol < 48/100, Melatonin 55–85/100, daily radiation within nominal range.",
      warning:
        "Cortisol 55–72/100 or Melatonin < 45/100 from circadian schedule misalignment.",
      critical:
        "Cortisol > 75/100 (sustained acute stress), Melatonin < 30/100, or daily radiation above alert threshold.",
      flightSurgeonNote:
        "Report to Ground Medical Team to recalibrate SSLA blue/red lighting, administer melatonin protocol, and verify storm shelter.",
    },
    preventiveCountermeasures: [
      "Expose eyes to bright blue-enriched lighting early in wake cycle and dim red-shifted light 1 h before sleep.",
      "Enforce structured recovery pauses to lower cortisol after EVA or emergency drills.",
      "Maintain strict hand hygiene and HEPA/charcoal cabin filter inspection.",
    ],
  },
  abdomen: {
    id: "abdomen",
    name: "Abdomen / Metabolism",
    shortTitle: "Glycemia, Hydration & Nutrition",
    subtitle:
      "Blood glucose (mg/dL), total body hydration balance, core temperature, and nutrition",
    monitoredVariables: [
      "Blood glucose (mg/dL)",
      "Hydration status (% fluid balance)",
      "Core body temperature (°C) and ration compliance",
    ],
    howToPerform: [
      "Scan your continuous dermal glucose patch (or capillary strip) to obtain mg/dL.",
      "Check metered hydration pouch consumption to verify daily intake (target: 2.5 L).",
      "If experiencing bloating or GI discomfort, perform guided portable ultrasound over abdominal landmarks.",
    ],
    whyNecessary:
      "Altered thirst signaling and blunted taste buds in microgravity frequently lead crew to undereat and underhydrate silently. Hypoglycemia causes rapid cognitive decline, while dehydration precipitates renal stones.",
    fiveHazardsImpact: {
      radiation:
        "Space radiation disrupts intestinal microbiota and impairs micronutrient/antioxidant absorption.",
      isolation:
        "Monotony and stress reduce appetite, leading to skipped meals or menu fatigue.",
      distance:
        "Deep-space transit and Mars missions lack fresh resupply; every calorie and liter of reclaimed water matters.",
      gravity:
        "Central blood volume redistribution blunts thirst baroreceptors, masking progressive dehydration.",
      closedEnvironment:
        "Thermostabilized rations and reclaimed water require strict mineral monitoring alongside slower GI transit.",
    },
    attentionThreshold: {
      optimal: "Glucose 75–115 mg/dL, hydration ≥ 80%, core temp 36.2–37.2 °C.",
      warning:
        "Glucose 65–74 or 125–155 mg/dL, hydration 68–79%, or missed primary ration.",
      critical:
        "Glucose < 65 mg/dL (syncope risk) or > 180 mg/dL, hydration < 68%, or core temp > 38.0 °C.",
      flightSurgeonNote:
        "If glucose drops below 65 mg/dL or hydration < 68%, treat immediately aboard prior to Flight Surgeon notification.",
    },
    preventiveCountermeasures: [
      "Ingest a glucose gel packet or carbohydrate drink immediately if glucose falls below 70 mg/dL.",
      "Schedule 90-minute hydration timers to drink 250 mL electrolyte solution.",
      "Complete all 3 daily food rations even if subjective hunger is low.",
    ],
  },
  musculo: {
    id: "musculo",
    name: "Musculoskeletal",
    shortTitle: "Bone Density & Muscle",
    subtitle:
      "Physical fatigue, muscular strength, and skeletal mineral density loss",
    monitoredVariables: [
      "Cumulative physical fatigue (0–100)",
      "Bone mineral density index (%)",
      "Daily resistive exercise minutes (ARED)",
    ],
    howToPerform: [
      "After daily exercise, rate perceived lower-limb and lumbar fatigue on a 1–10 scale.",
      "Once weekly, scan calcaneus or proximal femur with portable ultrasound densitometry.",
      "Confirm total resistive load minutes logged in your daily ARED training schedule.",
    ],
    whyNecessary:
      "Without gravitational loading, bones release calcium at 1–1.5% per month while postural leg muscles atrophy rapidly. Arriving on the Moon or Mars with fragile bones turns minor falls into mission-ending fractures.",
    fiveHazardsImpact: {
      radiation:
        "Cosmic ionizing radiation accelerates osteoclast bone resorption and impairs muscle fiber repair.",
      isolation:
        "Low motivation from mood decline can cause missed ARED heavy-load sessions.",
      distance:
        "No medevac or advanced orthopedic surgery exists on Mars for long-bone or lumbar injuries.",
      gravity:
        "Primary hazard for this system: in 0g (and partially 0.16g/0.38g), skeletal mechanoreceptors lack impact loading.",
      closedEnvironment:
        "Compact habitats restrict natural ambulation; all mechanical stimulus must come from compact resistance hardware.",
    },
    attentionThreshold: {
      optimal: "Physical fatigue < 45/100, bone density ≥ 94%, ≥ 90 min daily exercise.",
      warning:
        "Physical fatigue 50–74/100, bone density 89–93%, or persistent soreness > 48 h.",
      critical:
        "Physical fatigue ≥ 75/100, bone density < 89%, or acute joint pain precluding EVA suit donning.",
      flightSurgeonNote:
        "Reduce resistive load for 48 h, review Vitamin D/calcium status with Flight Surgeon, and schedule ultrasound check.",
    },
    preventiveCountermeasures: [
      "Complete 60 min resistive training (ARED or high-load bands) + 30 min aerobic conditioning daily.",
      "Take daily 800 IU Vitamin D supplement and sustain high hydration to reduce renal stone risk from calcium loss.",
      "Perform gentle lumbar decompression stretches before sleep.",
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
    label: "Day 133",
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
    label: "Day 134",
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
    label: "Day 135",
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
    label: "Day 136",
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
    label: "Day 137",
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
    label: "Day 138",
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
    title: "120–150 min combined exercise (ARED + CEVIS/T2)",
    category: "fisico",
    durationLabel: "120–150 min/day",
    description:
      "Daily two-block training protocol: ~60 min of resistive strength loading on ARED (squats, deadlifts, heel raises) plus 60 to 90 min aerobic conditioning on cycle ergometer (CEVIS) or treadmill (T2).",
    impactDescription:
      "Without gravity, bone and skeletal muscle lose mechanical loading: without this daily countermeasure, bone mineral density declines 1% to 1.5% per month alongside muscle atrophy and aerobic deconditioning.",
    nasaStandard: "NASA HRP ISS: 2 to 2.5 h/day (resistive + aerobic)",
    nasaSource: "NASA HRP · Countermeasures for Bone & Muscle Loss",
    previousComparison:
      "Upgraded from prior 60-min ARED draft to match official ISS operational guidelines.",
    completed: false,
  },
  {
    id: "quest-hydration",
    title: "Hydration ≥ 2.5 L/day (NASA-STD-3001)",
    category: "hidratacion",
    durationLabel: "≥ 32 mL/kg",
    description:
      "Distribute steady fluid intake throughout the wake cycle to meet ≥ 2.5 L (men) or ≥ 2.1 L (women) (~32 mL/kg body mass), adding extra electrolytes after exercise.",
    impactDescription:
      "In microgravity, fluids shift toward the thorax and head, lowering total plasma volume while mobilized bone calcium enters the urine. High fluid intake dilutes urine and prevents renal stones—a leading cause of orbital medical evacuation risk.",
    nasaStandard: "NASA-STD-3001: ≥ 32 mL/kg/day (~2.1–2.5 L baseline)",
    nasaSource: "NASA-STD-3001 · HRP Risk of Renal Stone Formation",
    previousComparison:
      "Validated against NASA-STD-3001 with renal stone prophylaxis.",
    completed: false,
  },
  {
    id: "quest-family",
    title: "Psychosocial Break / Family Link (BHP Protocol)",
    category: "mental",
    durationLabel: "20–30 min/day",
    description:
      "Step away from technical consoles to connect with Earth/family (real-time call or asynchronous video messages under latency), share crew recreation, or prepare private psychological conferences (PPC).",
    impactDescription:
      "Prolonged confinement in small crews far from Earth erodes mood, increases isolation and monotony, and raises the risk of cognitive fatigue or team friction.",
    nasaStandard: "NASA BHP: Protected leisure, family link & PPC",
    nasaSource: "NASA HRP · Behavioral Health & Performance (BHP)",
    previousComparison:
      "Aligned with official ISS/CHAPEA BHP standards; adds asynchronous deep-space messaging.",
    completed: false,
  },
  {
    id: "quest-circadian",
    title: "SSLA Circadian Lighting & Protected Sleep (8–8.5 h)",
    category: "circadiano",
    durationLabel: "8–8.5 h + SSLA",
    description:
      "Tune cabin Solid State Lighting Assemblies (SSLA) to blue-enriched daytime spectrum and dim warm lighting 60–90 min before sleep, securing 8 to 8.5 h uninterrupted rest with sleep mask and earplugs.",
    impactDescription:
      "Earth orbit produces 16 sunrises/sunsets every 24 h alongside continuous ventilation noise, limiting typical crew sleep to ~6 h; circadian misalignment dysregulates melatonin/cortisol and degrades vigilance.",
    nasaStandard: "NASA SSLA + NASA-STD-3001: 8–8.5 h sleep opportunity",
    nasaSource: "NASA HRP · ISS Solid State Lighting Assemblies (SSLA)",
    previousComparison:
      "Expanded to pair SSLA spectral tuning with the official 8–8.5 h sleep window.",
    completed: false,
  },
  {
    id: "quest-csa-check",
    title: "Vitamin D (800 IU), Nutrition & CSA Dosimetry",
    category: "fisico",
    durationLabel: "800 IU + 3 rations",
    description:
      "Take the daily 800 IU Vitamin D supplement alongside 3 calcium- and antioxidant-rich meals, and log the daily CSA Radi-N2 personal dosimeter reading in mSv.",
    impactDescription:
      "Spacecraft hull shielding blocks solar UV needed for endogenous Vitamin D synthesis; without it, dietary calcium cannot stabilize bone mass, while antioxidants and mSv tracking mitigate cosmic radiation effects.",
    nasaStandard: "NASA Nutrition: 800 IU/day Vit. D + Radi-N2 dosimeter",
    nasaSource: "NASA HRP Space Nutrition · CSA Radi-N2 Dosimetry",
    previousComparison:
      "Updated to include the mandatory 800 IU daily Vitamin D protocol.",
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
    title: "Immediate Physical Stabilization (First 2 min)",
    instruction:
      "Halt all critical operations or EVAs. Secure crew member in restraint seat, administer 300 mL electrolyte solution and oral glucose gel (15 g) for acute glycemic drop.",
    completed: false,
  },
  {
    id: "em-2",
    stepNumber: 2,
    title: "Cabin Atmosphere & O₂ Verification",
    instruction:
      "Confirm environmental console shows CO₂ within safe threshold (< 4.0 mmHg) and activate directed airflow fans to rule out hypoxia or hypercapnia.",
    completed: false,
  },
  {
    id: "em-3",
    stepNumber: 3,
    title: "Automated Medical Telemetry Packaging",
    instruction:
      "Bundle priority telemetry packet: heart rate (BPM), glucose (mg/dL), arterial BP, stress/cortisol index, and camera posture/facial capture.",
    completed: false,
  },
  {
    id: "em-4",
    stepNumber: 4,
    title: "Ground Flight Surgeon Uplink (Houston / CSA)",
    instruction:
      "Transmit Code Amber/Red medical alert via active mission protocol. Under high comm latency (Spacecraft or Mars), execute autonomous onboard protocol without waiting.",
    completed: false,
  },
  {
    id: "em-5",
    stepNumber: 5,
    title: "15-Minute Re-Evaluation & Assisted Rest",
    instruction:
      "Repeat blood glucose and heart rate checks at T+15 min, transfer watch duty to a crewmate, and enable low-glare recovery lighting.",
    completed: false,
  },
];

export const CSA_RADIATION_LIMITS = {
  dailyNominalMsv: 0.65,
  dailyAlertMsv: 1.45,
  annualLimitMsv: 200,
  careerLimitMsv: 600,
  instrumentName: "CSA Radi-N2 / EVARM Dosimeter",
};

export const INITIAL_DASHBOARD_STATE: AstronautDashboardState = {
  environmentId: "iss",
  telemedicineEnabled: true,
  missionDay: 138,
  astronautName: "Cmdr. Elena Vance",
  crewRole: "Mission Specialist · Biology & Operations",
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
    "Femoral bone mineral density and fluid distribution within nominal baseline.",
  lastCameraFinding:
    "Upright posture (85/100) and calm micro-expression with zero exhaustion markers.",
  scanLogs: [
    {
      id: "log-1",
      timestamp: "07:15 UTC",
      modality: "manual",
      summary: "Nominal morning check following 7.4 h sleep.",
    },
    {
      id: "log-2",
      timestamp: "10:30 UTC",
      modality: "camara",
      summary: "Facial assessment: low ocular tension (22/100), clear focus.",
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
    badge: "5 Hazards of Human Spaceflight",
    title: "The 5 Fundamental Hazards of Human Space Exploration",
    description:
      "Official NASA biomedical framework used to architect the anatomical diagnostics, behavioral biomarkers, and preventive countermeasures in this platform.",
    items: [
      {
        name: "1. Space Radiation",
        detail:
          "Beyond Earth's magnetosphere, astronauts receive galactic cosmic radiation (GCR) and solar particle events, elevating neurological, cardiovascular, and carcinogenesis risks.",
        appMapping:
          "Monitored in mSv/day and cumulative mission dose calibrated per mission environment (ISS, Spacecraft, Moon, Mars).",
      },
      {
        name: "2. Isolation & Confinement",
        detail:
          "Months inside confined modules with small crews lead to mood degradation, sleep disruption, chronic monotony, loneliness, and team friction.",
        appMapping:
          "Tracked via Loneliness, Boredom, Stress, Depression indices, Routine Change Detector, and Camera Posture Telemetry.",
      },
      {
        name: "3. Distance from Earth",
        detail:
          "In deep-space transit or on Mars, one-way signal latency reaches 20+ minutes, precluding live flight surgeon intervention or medical evacuation.",
        appMapping:
          "Step-by-step autonomous clinical action plans paired with Ground Surgeon uplink checklists written for non-physician crew.",
      },
      {
        name: "4. Altered Gravity Fields",
        detail:
          "Transitioning from 1g to 0g, 0.16g (Moon), or 0.38g (Mars) induces cephalad fluid shift, cardiovascular deconditioning, and rapid bone/muscle loss.",
        appMapping:
          "Dynamic gravity-weighted bone/cardio/hydration modeling plus NASA exercise countermeasures (ARED + CEVIS/T2).",
      },
      {
        name: "5. Hostile / Closed Environments",
        detail:
          "Closed life-support habitats face localized CO₂ buildup, microbial persistence, acoustic noise, abrasive lunar dust, and non-24h solar illumination.",
        appMapping:
          "Cabin environmental telemetry, SSLA circadian melatonin/cortisol tracking, and environment-specific hazard alerts.",
      },
    ],
  },
  {
    id: "csa-radiation",
    agency: "Canadian Space Agency (CSA / ASC)",
    badge: "Radiological & Orbital Health Monitoring",
    title: "CSA Radiation Dosimetry & Autonomous Health Countermeasures",
    description:
      "Inspired by Canadian instrumentation aboard the International Space Station (Radi-N2 and EVARM) and the CSA/NASA Deep Space Healthcare Challenge.",
    items: [
      {
        name: "Neutron Detection & Active Dosimetry (Radi-N2 / EVARM)",
        detail:
          "CSA develops bubble detectors and personal skin/organ dosimeters that measure absorbed secondary radiation inside spacecraft hulls and during EVAs.",
        appMapping:
          "Dedicated Radiation Exposure card (daily mSv and cumulative mission dose) integrated across every mission profile.",
      },
      {
        name: "Early Physiological Detection & Crew Autonomy",
        detail:
          "Canadian biomedical programs prioritize non-invasive sensors (guided ultrasound, optical/salivary assays, wearable Bio-Monitor) operable by non-physician crew.",
        appMapping:
          "Modular Bio-Monitor 3N wearable network (Thoracic Vest · Frontal Headband · Node 3 Wristband, Laryngeal Collar & BLE Bone-Conduction Earpiece), facial/posture CV scanner, and plain-language clinical guides.",
      },
    ],
  },
];
