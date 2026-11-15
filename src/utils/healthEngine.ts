import {
  CSA_RADIATION_LIMITS,
  DEFAULT_BIOMARKERS,
  DEFAULT_EMERGENCY_CHECKLIST,
  DEFAULT_ROUTINE,
  MISSION_ENVIRONMENTS,
} from "@/data/missionData";
import {
  AstronautDashboardState,
  BiomarkerData,
  HealthStatus,
  HemodynamicIndices,
  MissionEnvironmentId,
  RoutineDeviationItem,
  RoutineTracking,
  SystemZoneId,
  TelemetryPoint,
  TrendDirection,
} from "@/types/astronaut";

export const STATUS_HEX: Record<HealthStatus, string> = {
  optimal: "#10b981",
  warning: "#f59e0b",
  critical: "#ef4444",
};

export const STATUS_LABELS: Record<HealthStatus, string> = {
  optimal: "NOMINAL",
  warning: "PRECAUCIÓN",
  critical: "CRÍTICO",
};

export function worstStatus(statuses: HealthStatus[]): HealthStatus {
  if (statuses.includes("critical")) return "critical";
  if (statuses.includes("warning")) return "warning";
  return "optimal";
}

export function getTrend(
  current: number,
  previous: number,
  tolerance = 0.5
): TrendDirection {
  const diff = current - previous;
  if (Math.abs(diff) <= tolerance) return "stable";
  return diff > 0 ? "up" : "down";
}

export function evaluateBpmStatus(bpm: number): HealthStatus {
  if (bpm > 115 || bpm < 44) return "critical";
  if (bpm > 92 || bpm < 52) return "warning";
  return "optimal";
}

export function evaluateBpStatus(sys: number, dia: number): HealthStatus {
  if (sys >= 150 || dia >= 95 || sys < 86 || dia < 55) return "critical";
  if (sys >= 134 || dia >= 86 || sys < 95 || dia < 62) return "warning";
  return "optimal";
}

export function evaluateGlucoseStatus(glucose: number): HealthStatus {
  if (glucose < 65 || glucose > 180) return "critical";
  if (glucose < 74 || glucose > 125) return "warning";
  return "optimal";
}

export function evaluateTempStatus(temp: number): HealthStatus {
  if (temp >= 38.0 || temp <= 35.4) return "critical";
  if (temp >= 37.3 || temp <= 36.0) return "warning";
  return "optimal";
}

export function evaluateHydrationStatus(hydration: number): HealthStatus {
  if (hydration < 68) return "critical";
  if (hydration < 80) return "warning";
  return "optimal";
}

export function evaluateCortisolStatus(cortisol: number): HealthStatus {
  if (cortisol > 74) return "critical";
  if (cortisol > 50) return "warning";
  return "optimal";
}

export function evaluateMelatoninStatus(melatonin: number): HealthStatus {
  if (melatonin < 32) return "critical";
  if (melatonin < 52) return "warning";
  return "optimal";
}

export function evaluatePhysicalFatigueStatus(fatigue: number): HealthStatus {
  if (fatigue >= 75) return "critical";
  if (fatigue >= 48) return "warning";
  return "optimal";
}

export function evaluateBoneDensityStatus(bone: number): HealthStatus {
  if (bone < 89) return "critical";
  if (bone < 94) return "warning";
  return "optimal";
}

export function evaluateRadiationStatus(dailyMsv: number): HealthStatus {
  if (dailyMsv >= CSA_RADIATION_LIMITS.dailyAlertMsv) return "critical";
  if (dailyMsv >= CSA_RADIATION_LIMITS.dailyNominalMsv + 0.15) return "warning";
  return "optimal";
}

export function getCareerRadiationPct(cumulativeMsv: number): number {
  return Math.min(
    100,
    Math.round((cumulativeMsv / CSA_RADIATION_LIMITS.careerLimitMsv) * 1000) / 10
  );
}

export function evaluateMentalFatigueStatus(val: number): HealthStatus {
  if (val >= 72) return "critical";
  if (val >= 46) return "warning";
  return "optimal";
}

export function evaluateStressStatus(val: number): HealthStatus {
  if (val >= 74) return "critical";
  if (val >= 48) return "warning";
  return "optimal";
}

export function evaluateDepressionStatus(val: number): HealthStatus {
  if (val >= 65) return "critical";
  if (val >= 38) return "warning";
  return "optimal";
}

export function evaluateLonelinessStatus(val: number): HealthStatus {
  if (val >= 70) return "critical";
  if (val >= 44) return "warning";
  return "optimal";
}

export function evaluateBoredomStatus(val: number): HealthStatus {
  if (val >= 72) return "critical";
  if (val >= 48) return "warning";
  return "optimal";
}

export function evaluateSleepStatus(hours: number): HealthStatus {
  if (hours < 5.3) return "critical";
  if (hours < 6.8) return "warning";
  return "optimal";
}

export function evaluateMoodStatus(mood: number): HealthStatus {
  if (mood < 46) return "critical";
  if (mood < 68) return "warning";
  return "optimal";
}

export function evaluatePostureStatus(posture: number): HealthStatus {
  if (posture < 48) return "critical";
  if (posture < 70) return "warning";
  return "optimal";
}

export function evaluateFacialTensionStatus(tension: number): HealthStatus {
  if (tension > 72) return "critical";
  if (tension > 44) return "warning";
  return "optimal";
}

export function evaluateSpo2Status(spo2: number): HealthStatus {
  if (spo2 < 92) return "critical";
  if (spo2 < 95) return "warning";
  return "optimal";
}

export function evaluateRespiratoryRateStatus(rpm: number): HealthStatus {
  if (rpm > 24 || rpm < 9) return "critical";
  if (rpm > 20 || rpm < 12) return "warning";
  return "optimal";
}

export function evaluateMinuteVentilationStatus(lpm: number): HealthStatus {
  if (lpm > 12.0 || lpm < 3.8) return "critical";
  if (lpm > 8.0 || lpm < 5.0) return "warning";
  return "optimal";
}

export function evaluateHrvStatus(rmssd: number): HealthStatus {
  if (rmssd < 14) return "critical";
  if (rmssd <= 20) return "warning";
  return "optimal";
}

export function evaluatePttStatus(pttMs: number): HealthStatus {
  if (pttMs < 130 || pttMs > 280) return "critical";
  if (pttMs < 150 || pttMs > 250) return "warning";
  return "optimal";
}

export function evaluatePerfusionIndexStatus(pi: number): HealthStatus {
  if (pi < 0.5) return "critical";
  if (pi < 1.0 || pi > 10.0) return "warning";
  return "optimal";
}

export function evaluateSkinTempStatus(temp: number): HealthStatus {
  if (temp < 30.5 || temp > 37.0) return "critical";
  if (temp < 32.0 || temp > 35.5) return "warning";
  return "optimal";
}

export function computeHemodynamicIndices(
  b: BiomarkerData,
  environmentId: MissionEnvironmentId = "iss"
): HemodynamicIndices {
  const mapMmHg = Math.round(b.diastolicBP + (b.systolicBP - b.diastolicBP) / 3);
  const pulsePressureMmHg = b.systolicBP - b.diastolicBP;
  const shockIndex = Number((b.bpm / Math.max(b.systolicBP, 1)).toFixed(2));
  const isPartialGravity = environmentId === "luna" || environmentId === "marte";
  const orthostaticAlert =
    isPartialGravity &&
    (b.systolicBP < 95 || shockIndex >= 0.85 || b.pttCalibrationRequired);

  const mapStatus: HealthStatus =
    mapMmHg < 65 || mapMmHg > 115
      ? "critical"
      : mapMmHg < 70 || mapMmHg > 100
      ? "warning"
      : "optimal";

  const pulsePressureStatus: HealthStatus =
    pulsePressureMmHg < 20
      ? "critical"
      : pulsePressureMmHg < 25 || pulsePressureMmHg < 30 || pulsePressureMmHg > 50
      ? "warning"
      : "optimal";

  const shockStatus: HealthStatus =
    shockIndex >= 0.9
      ? "critical"
      : shockIndex > 0.7 || shockIndex < 0.45
      ? "warning"
      : "optimal";

  const thermalGradientC = Number((b.bodyTempC - b.skinTempC).toFixed(1));
  const thermalGradientStatus: HealthStatus =
    thermalGradientC >= 5.8 || thermalGradientC < 0
      ? "critical"
      : thermalGradientC > 4.2 || thermalGradientC < 1.0
      ? "warning"
      : "optimal";

  return {
    mapMmHg,
    pulsePressureMmHg,
    shockIndex,
    thermalGradientC,
    orthostaticAlert,
    mapStatus,
    pulsePressureStatus,
    shockStatus,
    thermalGradientStatus,
  };
}

export function evaluateAllZoneStatuses(
  b: BiomarkerData,
  routine: RoutineTracking,
  environmentId: MissionEnvironmentId = "iss"
): Record<SystemZoneId, HealthStatus> {
  const routineAnalysis = computeRoutineDeviations(routine);
  const hemo = computeHemodynamicIndices(b, environmentId);
  const brainOrthostaticStatus: HealthStatus = hemo.orthostaticAlert
    ? b.systolicBP < 95 || hemo.shockIndex >= 0.9
      ? "critical"
      : b.pttCalibrationRequired
      ? "warning"
      : "optimal"
    : "optimal";

  return {
    cerebro: worstStatus([
      evaluateMentalFatigueStatus(b.mentalFatigue),
      evaluateStressStatus(b.stressLevel),
      evaluateDepressionStatus(b.depressionRisk),
      evaluateLonelinessStatus(b.lonelinessLevel),
      evaluateBoredomStatus(b.boredomLevel),
      evaluateSleepStatus(b.sleepHours),
      evaluateMoodStatus(b.moodScore),
      routineAnalysis.overallStatus === "critical" ? "warning" : "optimal",
      brainOrthostaticStatus,
    ]),
    rostro: worstStatus([
      evaluatePostureStatus(b.postureScore),
      evaluateFacialTensionStatus(b.facialTension),
    ]),
    corazon: worstStatus([
      evaluateBpmStatus(b.bpm),
      evaluateBpStatus(b.systolicBP, b.diastolicBP),
      evaluateSpo2Status(b.spo2Percent),
      evaluateRespiratoryRateStatus(b.respiratoryRateRpm),
      evaluateHrvStatus(b.hrvRmssdMs),
      evaluatePerfusionIndexStatus(b.perfusionIndex),
    ]),
    endocrino: worstStatus([
      evaluateCortisolStatus(b.cortisolIndex),
      evaluateMelatoninStatus(b.melatoninIndex),
      evaluateRadiationStatus(b.dailyRadiationMsv),
    ]),
    abdomen: worstStatus([
      evaluateGlucoseStatus(b.bloodGlucoseMgDl),
      evaluateHydrationStatus(b.hydrationPercent),
      evaluateTempStatus(b.bodyTempC),
    ]),
    musculo: worstStatus([
      evaluatePhysicalFatigueStatus(b.physicalFatigue),
      evaluateBoneDensityStatus(b.boneDensityIndex),
    ]),
  };
}

export function computeRoutineDeviations(routine: RoutineTracking): {
  items: RoutineDeviationItem[];
  stabilityScore: number;
  overallStatus: HealthStatus;
} {
  const sleepStatus: HealthStatus =
    routine.sleepDeviationMin >= 90
      ? "critical"
      : routine.sleepDeviationMin >= 35
      ? "warning"
      : "optimal";

  const exerciseRatio = routine.exerciseMinutes / routine.baselineExerciseMinutes;
  const exerciseStatus: HealthStatus =
    exerciseRatio < 0.45 ? "critical" : exerciseRatio < 0.78 ? "warning" : "optimal";

  const mealMissing = routine.baselineMeals - routine.mealsCompleted;
  const mealStatus: HealthStatus =
    mealMissing >= 2 || routine.mealDeviationMin >= 120
      ? "critical"
      : mealMissing >= 1 || routine.mealDeviationMin >= 45
      ? "warning"
      : "optimal";

  const hydrationRatio =
    routine.hydrationLiters / routine.baselineHydrationLiters;
  const hydrationStatus: HealthStatus =
    hydrationRatio < 0.62 ? "critical" : hydrationRatio < 0.84 ? "warning" : "optimal";

  const items: RoutineDeviationItem[] = [
    {
      id: "routine-sleep",
      label: "Horario de Sueño",
      currentText: `${routine.sleepStartTime} UTC`,
      baselineText: `${routine.baselineSleepStartTime} UTC`,
      deviationText:
        routine.sleepDeviationMin === 0
          ? "En línea base"
          : `Desfase de ${routine.sleepDeviationMin} min`,
      status: sleepStatus,
    },
    {
      id: "routine-exercise",
      label: "Ejercicio Diario",
      currentText: `${routine.exerciseMinutes} min`,
      baselineText: `${routine.baselineExerciseMinutes} min`,
      deviationText:
        routine.exerciseMinutes >= routine.baselineExerciseMinutes
          ? "Meta cumplida"
          : `-${routine.baselineExerciseMinutes - routine.exerciseMinutes} min respecto a meta`,
      status: exerciseStatus,
    },
    {
      id: "routine-meals",
      label: "Alimentación",
      currentText: `${routine.mealsCompleted}/${routine.baselineMeals} raciones`,
      baselineText: `${routine.baselineMeals} raciones`,
      deviationText:
        mealMissing <= 0 && routine.mealDeviationMin <= 20
          ? "Horario estable"
          : `${mealMissing > 0 ? `-${mealMissing} comida(s)` : ""} ${
              routine.mealDeviationMin > 20
                ? `(desfase ${routine.mealDeviationMin}m)`
                : ""
            }`.trim(),
      status: mealStatus,
    },
    {
      id: "routine-hydration",
      label: "Ingesta de Agua",
      currentText: `${routine.hydrationLiters.toFixed(1)} L`,
      baselineText: `${routine.baselineHydrationLiters.toFixed(1)} L`,
      deviationText:
        routine.hydrationLiters >= routine.baselineHydrationLiters
          ? "Meta hídrica lograda"
          : `Déficit de ${(
              routine.baselineHydrationLiters - routine.hydrationLiters
            ).toFixed(1)} L`,
      status: hydrationStatus,
    },
  ];

  // Calculate overall routine stability score (0-100)
  const sleepPenalty = Math.min(30, routine.sleepDeviationMin * 0.22);
  const exercisePenalty = Math.max(0, (1 - exerciseRatio) * 28);
  const mealPenalty = Math.max(0, mealMissing * 14) + Math.min(12, routine.mealDeviationMin * 0.08);
  const hydrationPenalty = Math.max(0, (1 - hydrationRatio) * 26);

  const stabilityScore = Math.max(
    12,
    Math.min(100, Math.round(100 - (sleepPenalty + exercisePenalty + mealPenalty + hydrationPenalty)))
  );

  const overallStatus = worstStatus(items.map((item) => item.status));

  return { items, stabilityScore, overallStatus };
}

export function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

export function hydrateBiomarkers(
  raw?: Partial<BiomarkerData> | null
): BiomarkerData {
  return {
    bpm: raw?.bpm ?? DEFAULT_BIOMARKERS.bpm,
    systolicBP: raw?.systolicBP ?? DEFAULT_BIOMARKERS.systolicBP,
    diastolicBP: raw?.diastolicBP ?? DEFAULT_BIOMARKERS.diastolicBP,
    bloodGlucoseMgDl: raw?.bloodGlucoseMgDl ?? DEFAULT_BIOMARKERS.bloodGlucoseMgDl,
    bodyTempC: raw?.bodyTempC ?? DEFAULT_BIOMARKERS.bodyTempC,
    hydrationPercent: raw?.hydrationPercent ?? DEFAULT_BIOMARKERS.hydrationPercent,
    cortisolIndex: raw?.cortisolIndex ?? DEFAULT_BIOMARKERS.cortisolIndex,
    melatoninIndex: raw?.melatoninIndex ?? DEFAULT_BIOMARKERS.melatoninIndex,
    physicalFatigue: raw?.physicalFatigue ?? DEFAULT_BIOMARKERS.physicalFatigue,
    boneDensityIndex: raw?.boneDensityIndex ?? DEFAULT_BIOMARKERS.boneDensityIndex,
    dailyRadiationMsv: raw?.dailyRadiationMsv ?? DEFAULT_BIOMARKERS.dailyRadiationMsv,
    cumulativeRadiationMsv:
      raw?.cumulativeRadiationMsv ?? DEFAULT_BIOMARKERS.cumulativeRadiationMsv,
    mentalFatigue: raw?.mentalFatigue ?? DEFAULT_BIOMARKERS.mentalFatigue,
    reactionTimeMs: raw?.reactionTimeMs ?? DEFAULT_BIOMARKERS.reactionTimeMs,
    stressLevel: raw?.stressLevel ?? DEFAULT_BIOMARKERS.stressLevel,
    depressionRisk: raw?.depressionRisk ?? DEFAULT_BIOMARKERS.depressionRisk,
    lonelinessLevel: raw?.lonelinessLevel ?? DEFAULT_BIOMARKERS.lonelinessLevel,
    boredomLevel: raw?.boredomLevel ?? DEFAULT_BIOMARKERS.boredomLevel,
    stimulationIndex: raw?.stimulationIndex ?? DEFAULT_BIOMARKERS.stimulationIndex,
    sleepHours: raw?.sleepHours ?? DEFAULT_BIOMARKERS.sleepHours,
    moodScore: raw?.moodScore ?? DEFAULT_BIOMARKERS.moodScore,
    postureScore: raw?.postureScore ?? DEFAULT_BIOMARKERS.postureScore,
    facialTension: raw?.facialTension ?? DEFAULT_BIOMARKERS.facialTension,
    spo2Percent: raw?.spo2Percent ?? DEFAULT_BIOMARKERS.spo2Percent,
    respiratoryRateRpm:
      raw?.respiratoryRateRpm ?? DEFAULT_BIOMARKERS.respiratoryRateRpm,
    minuteVentilationLpm:
      raw?.minuteVentilationLpm ?? DEFAULT_BIOMARKERS.minuteVentilationLpm,
    hrvRmssdMs: raw?.hrvRmssdMs ?? DEFAULT_BIOMARKERS.hrvRmssdMs,
    pttMs: raw?.pttMs ?? DEFAULT_BIOMARKERS.pttMs,
    perfusionIndex: raw?.perfusionIndex ?? DEFAULT_BIOMARKERS.perfusionIndex,
    skinTempC: raw?.skinTempC ?? DEFAULT_BIOMARKERS.skinTempC,
    lastOscillometricCalHours:
      raw?.lastOscillometricCalHours ?? DEFAULT_BIOMARKERS.lastOscillometricCalHours,
    pttCalibrationRequired:
      raw?.pttCalibrationRequired ?? DEFAULT_BIOMARKERS.pttCalibrationRequired,
  };
}

export function recalculateForEnvironment(
  state: AstronautDashboardState,
  newEnvId: MissionEnvironmentId
): AstronautDashboardState {
  if (state.environmentId === newEnvId) return state;

  const prevEnv = MISSION_ENVIRONMENTS[state.environmentId];
  const nextEnv = MISSION_ENVIRONMENTS[newEnvId];

  const isolationDelta = nextEnv.isolationRiskBonus - prevEnv.isolationRiskBonus;
  const boneDelta = (prevEnv.boneLoadFactor - nextEnv.boneLoadFactor) * 4;
  const prevCumulFactor = 0.65 + prevEnv.dailyRadiationMsv * 0.35;
  const nextCumulFactor = 0.65 + nextEnv.dailyRadiationMsv * 0.35;
  const ratio = nextCumulFactor / prevCumulFactor;
  const co2Delta = nextEnv.co2MmHg - prevEnv.co2MmHg;
  const gravityDelta = nextEnv.gravityG - prevEnv.gravityG;

  const b = state.biomarkers;
  const updatedBiomarkers: BiomarkerData = {
    ...b,
    dailyRadiationMsv: Number(
      (nextEnv.dailyRadiationMsv + (state.emergencyMode ? 0.35 : 0)).toFixed(2)
    ),
    cumulativeRadiationMsv: Number((b.cumulativeRadiationMsv * ratio).toFixed(1)),
    lonelinessLevel: clamp(Math.round(b.lonelinessLevel + isolationDelta * 0.85), 5, 99),
    boredomLevel: clamp(Math.round(b.boredomLevel + isolationDelta * 0.65), 5, 99),
    stimulationIndex: clamp(Math.round(100 - (b.boredomLevel + isolationDelta * 0.65)), 5, 99),
    stressLevel: clamp(Math.round(b.stressLevel + isolationDelta * 0.45), 5, 99),
    boneDensityIndex: clamp(Math.round((b.boneDensityIndex + boneDelta) * 10) / 10, 78, 100),
    physicalFatigue: clamp(
      Math.round(b.physicalFatigue + gravityDelta * 14),
      10,
      98
    ),
    spo2Percent: clamp(
      Math.round(b.spo2Percent - (prevEnv.cabinPressureKpa - nextEnv.cabinPressureKpa) * 0.025),
      88,
      99
    ),
    respiratoryRateRpm: clamp(
      Math.round(b.respiratoryRateRpm + co2Delta * 1.4),
      10,
      30
    ),
    minuteVentilationLpm: clamp(
      Number((b.minuteVentilationLpm + co2Delta * 0.65).toFixed(1)),
      4.2,
      14.0
    ),
    hrvRmssdMs: clamp(Math.round(b.hrvRmssdMs - isolationDelta * 0.45), 12, 85),
    pttMs: clamp(Math.round(b.pttMs - gravityDelta * 26), 135, 260),
    perfusionIndex: clamp(
      Number((b.perfusionIndex - isolationDelta * 0.03 + gravityDelta * 0.5).toFixed(1)),
      0.4,
      10.0
    ),
    skinTempC: clamp(Number((b.skinTempC + co2Delta * 0.15).toFixed(1)), 30.5, 37.5),
    pttCalibrationRequired:
      newEnvId === "luna" ||
      newEnvId === "marte" ||
      b.lastOscillometricCalHours >= 24,
  };

  return {
    ...state,
    environmentId: newEnvId,
    previousBiomarkers: state.biomarkers,
    biomarkers: updatedBiomarkers,
  };
}

export function calibrateOscillometricCuff(
  state: AstronautDashboardState
): AstronautDashboardState {
  const env = MISSION_ENVIRONMENTS[state.environmentId];
  const calibratedPtt = Math.round(194 - env.gravityG * 22);
  const utc = new Date().toISOString().slice(11, 16);

  const nextBiomarkers: BiomarkerData = {
    ...state.biomarkers,
    lastOscillometricCalHours: 0,
    pttCalibrationRequired: false,
    pttMs: calibratedPtt,
  };

  return {
    ...state,
    previousBiomarkers: state.biomarkers,
    biomarkers: nextBiomarkers,
    scanLogs: [
      {
        id: `log-cal-${Date.now()}`,
        timestamp: `${utc} UTC`,
        modality: "wearable",
        summary: `Calibración oscilométrica CSA BP Reg completada (30 s): PTT sincronizado a ${calibratedPtt} ms en ${env.shortName}.`,
      },
      ...state.scanLogs.slice(0, 7),
    ],
  };
}

export function buildEmergencyState(
  state: AstronautDashboardState
): AstronautDashboardState {
  const env = MISSION_ENVIRONMENTS[state.environmentId];

  const emergencyBiomarkers: BiomarkerData = {
    bpm: 132,
    systolicBP: 148,
    diastolicBP: 94,
    bloodGlucoseMgDl: 58,
    bodyTempC: 37.8,
    hydrationPercent: 61,
    cortisolIndex: 88,
    melatoninIndex: 24,
    physicalFatigue: 82,
    boneDensityIndex: 88,
    dailyRadiationMsv: Number((env.dailyRadiationMsv + 0.35).toFixed(2)),
    cumulativeRadiationMsv: Number((state.biomarkers.cumulativeRadiationMsv + 2.4).toFixed(1)),
    mentalFatigue: 86,
    reactionTimeMs: 510,
    stressLevel: 89,
    depressionRisk: 68,
    lonelinessLevel: 79,
    boredomLevel: 76,
    stimulationIndex: 24,
    sleepHours: 4.1,
    moodScore: 32,
    postureScore: 38,
    facialTension: 84,
    spo2Percent: 90,
    respiratoryRateRpm: 27,
    minuteVentilationLpm: 11.4,
    hrvRmssdMs: 13,
    pttMs: 142,
    perfusionIndex: 0.4,
    skinTempC: 31.4,
    lastOscillometricCalHours: 28,
    pttCalibrationRequired: true,
  };

  const emergencyRoutine: RoutineTracking = {
    sleepStartTime: "01:15",
    baselineSleepStartTime: "22:30",
    sleepDeviationMin: 165,
    exerciseMinutes: 20,
    baselineExerciseMinutes: 120,
    mealsCompleted: 1,
    baselineMeals: 3,
    mealDeviationMin: 190,
    hydrationLiters: 1.1,
    baselineHydrationLiters: 2.5,
  };

  const newPoint: TelemetryPoint = {
    label: "EMERGENCIA",
    bpm: emergencyBiomarkers.bpm,
    glucose: emergencyBiomarkers.bloodGlucoseMgDl,
    hydration: emergencyBiomarkers.hydrationPercent,
    physicalFatigue: emergencyBiomarkers.physicalFatigue,
    mentalFatigue: emergencyBiomarkers.mentalFatigue,
    cortisol: emergencyBiomarkers.cortisolIndex,
    melatonin: emergencyBiomarkers.melatoninIndex,
    stress: emergencyBiomarkers.stressLevel,
    loneliness: emergencyBiomarkers.lonelinessLevel,
    boredom: emergencyBiomarkers.boredomLevel,
    routineStability: 26,
  };

  const filteredHistory = state.history.filter((p) => p.label !== "EMERGENCIA");

  return {
    ...state,
    emergencyMode: true,
    previousBiomarkers: state.biomarkers,
    biomarkers: emergencyBiomarkers,
    routine: emergencyRoutine,
    history: [...filteredHistory, newPoint],
    emergencyChecklist: DEFAULT_EMERGENCY_CHECKLIST.map((s) => ({
      ...s,
      completed: false,
    })),
    lastCameraFinding:
      "ALERTA: Encorvamiento severo (postura 38/100), tensión ocular extrema (84/100) y señales faciales de agotamiento.",
    scanLogs: [
      {
        id: `log-em-${Date.now()}`,
        timestamp: "AHORA (DEMO)",
        modality: "emergencia",
        summary:
          "Simulación de emergencia activada: SpO₂ 90%, taquipnea 27 rpm, hipoglucemia (58 mg/dL), deshidratación (61%) e hipoperfusión (PI 0.4%).",
      },
      ...state.scanLogs.slice(0, 6),
    ],
  };
}

export function restoreNominalFromEmergency(
  state: AstronautDashboardState
): AstronautDashboardState {
  const env = MISSION_ENVIRONMENTS[state.environmentId];
  const isPartialGravity =
    state.environmentId === "luna" || state.environmentId === "marte";
  const nominalBiomarkers: BiomarkerData = {
    ...DEFAULT_BIOMARKERS,
    dailyRadiationMsv: env.dailyRadiationMsv,
    lonelinessLevel: clamp(DEFAULT_BIOMARKERS.lonelinessLevel + env.isolationRiskBonus, 10, 80),
    boredomLevel: clamp(DEFAULT_BIOMARKERS.boredomLevel + Math.round(env.isolationRiskBonus * 0.7), 10, 80),
    stimulationIndex: clamp(100 - (DEFAULT_BIOMARKERS.boredomLevel + Math.round(env.isolationRiskBonus * 0.7)), 20, 95),
    stressLevel: clamp(DEFAULT_BIOMARKERS.stressLevel + Math.round(env.isolationRiskBonus * 0.5), 10, 80),
    pttMs: Math.round(194 - env.gravityG * 22),
    pttCalibrationRequired: isPartialGravity,
  };

  return {
    ...state,
    emergencyMode: false,
    previousBiomarkers: state.biomarkers,
    biomarkers: nominalBiomarkers,
    routine: { ...DEFAULT_ROUTINE },
    history: state.history.filter((p) => p.label !== "EMERGENCIA"),
    emergencyChecklist: DEFAULT_EMERGENCY_CHECKLIST.map((s) => ({
      ...s,
      completed: false,
    })),
    lastCameraFinding:
      "Postura erguida (85/100) y microexpresión serena sin signos de agotamiento.",
  };
}

export function computeMissionReadiness(
  zoneStatuses: Record<SystemZoneId, HealthStatus>,
  routineStability: number
): number {
  const weights: Record<HealthStatus, number> = {
    optimal: 100,
    warning: 68,
    critical: 28,
  };
  const values = Object.values(zoneStatuses).map((s) => weights[s]);
  const avgZones = values.reduce((acc, v) => acc + v, 0) / values.length;
  return Math.round(avgZones * 0.75 + routineStability * 0.25);
}
