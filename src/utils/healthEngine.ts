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
  warning: "CAUTION",
  critical: "CRITICAL",
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
      b.reactionTimeMs > 380
        ? "critical"
        : b.reactionTimeMs >= 285
        ? "warning"
        : "optimal",
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
      label: "Sleep Schedule",
      currentText: `${routine.sleepStartTime} UTC`,
      baselineText: `${routine.baselineSleepStartTime} UTC`,
      deviationText:
        routine.sleepDeviationMin === 0
          ? "On baseline"
          : `Drift of ${routine.sleepDeviationMin} min`,
      status: sleepStatus,
    },
    {
      id: "routine-exercise",
      label: "Daily Exercise",
      currentText: `${routine.exerciseMinutes} min`,
      baselineText: `${routine.baselineExerciseMinutes} min`,
      deviationText:
        routine.exerciseMinutes >= routine.baselineExerciseMinutes
          ? "Target met"
          : `-${routine.baselineExerciseMinutes - routine.exerciseMinutes} min vs. target`,
      status: exerciseStatus,
    },
    {
      id: "routine-meals",
      label: "Nutrition & Rations",
      currentText: `${routine.mealsCompleted}/${routine.baselineMeals} rations`,
      baselineText: `${routine.baselineMeals} rations`,
      deviationText:
        mealMissing <= 0 && routine.mealDeviationMin <= 20
          ? "Schedule stable"
          : `${mealMissing > 0 ? `-${mealMissing} ration(s)` : ""} ${
              routine.mealDeviationMin > 20
                ? `(drift ${routine.mealDeviationMin}m)`
                : ""
            }`.trim(),
      status: mealStatus,
    },
    {
      id: "routine-hydration",
      label: "Fluid Intake",
      currentText: `${routine.hydrationLiters.toFixed(1)} L`,
      baselineText: `${routine.baselineHydrationLiters.toFixed(1)} L`,
      deviationText:
        routine.hydrationLiters >= routine.baselineHydrationLiters
          ? "Hydration target met"
          : `Deficit of ${(
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
        summary: `CSA BP Reg oscillometric calibration complete (30 s): PTT synced to ${calibratedPtt} ms in ${env.shortName}.`,
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
    label: "EMERGENCY",
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

  const filteredHistory = state.history.filter((p) => p.label !== "EMERGENCY");

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
      "ALERT: Severe shoulder slump (posture 38/100), extreme ocular tension (84/100), and facial exhaustion markers.",
    scanLogs: [
      {
        id: `log-em-${Date.now()}`,
        timestamp: "NOW (DEMO)",
        modality: "emergencia",
        summary:
          "Emergency simulation triggered: SpO₂ 90%, tachypnea 27 rpm, hypoglycemia (58 mg/dL), dehydration (61%), and hypoperfusion (PI 0.4%).",
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
    history: state.history.filter((p) => p.label !== "EMERGENCY"),
    emergencyChecklist: DEFAULT_EMERGENCY_CHECKLIST.map((s) => ({
      ...s,
      completed: false,
    })),
    lastCameraFinding:
      "Upright posture (85/100) and calm micro-expression with zero exhaustion markers.",
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

export interface VitalSignRecommendation {
  id: string;
  vitalName: string;
  zone: SystemZoneId;
  currentReading: string;
  status: HealthStatus;
  problemLabel: string;
  recommendation: string;
}

const SEVERITY_PRIORITY: Record<HealthStatus, number> = {
  critical: 0,
  warning: 1,
  optimal: 2,
};

function evaluateNeuroRec(b: BiomarkerData): VitalSignRecommendation {
  const pvtStatus: HealthStatus =
    b.reactionTimeMs > 380
      ? "critical"
      : b.reactionTimeMs >= 285
      ? "warning"
      : "optimal";
  const status = worstStatus([
    evaluateSleepStatus(b.sleepHours),
    evaluateStressStatus(b.stressLevel),
    pvtStatus,
  ]);
  const issues: string[] = [];
  if (b.sleepHours < 6.8) issues.push(`sleep deficit (${b.sleepHours.toFixed(1)} h)`);
  if (b.reactionTimeMs >= 285) issues.push(`delayed PVT (${b.reactionTimeMs} ms)`);
  if (b.stressLevel >= 48) issues.push(`vocal/mental strain (${b.stressLevel}%)`);

  if (status === "critical") {
    return {
      id: "neuro",
      vitalName: "Neurocognitive, Sleep & PVT",
      zone: "cerebro",
      currentReading: `${b.reactionTimeMs} ms · ${b.sleepHours.toFixed(1)}h · Stress ${b.stressLevel}%`,
      status,
      problemLabel: `Severe Cognitive Exhaustion${issues.length ? ` (${issues.join(", ")})` : ""}`,
      recommendation:
        "Mandatory stand-down from safety-critical EVA, robotics, or docking ops; schedule a 90-minute protected sleep block and run Node 3 acoustic decompression.",
    };
  }
  if (status === "warning") {
    return {
      id: "neuro",
      vitalName: "Neurocognitive, Sleep & PVT",
      zone: "cerebro",
      currentReading: `${b.reactionTimeMs} ms · ${b.sleepHours.toFixed(1)}h · Stress ${b.stressLevel}%`,
      status,
      problemLabel: `Moderate Fatigue & Strain${issues.length ? ` (${issues.join(", ")})` : ""}`,
      recommendation:
        "Dim cabin blue lighting 60 minutes prior to sleep, take a 15-minute cognitive reset, and use Node 3 BLE earpiece guided breathing.",
    };
  }
  return {
    id: "neuro",
    vitalName: "Neurocognitive, Sleep & PVT",
    zone: "cerebro",
    currentReading: `${b.reactionTimeMs} ms · ${b.sleepHours.toFixed(1)}h · Stress ${b.stressLevel}%`,
    status,
    problemLabel: "Cognitive Vigilance & Sleep Nominal",
    recommendation:
      "Cognitive vigilance (PVT), sleep architecture, and vocal stress within nominal bounds.",
  };
}

export function getActiveVitalRecommendations(
  b: BiomarkerData,
  environmentId: MissionEnvironmentId = "iss"
): VitalSignRecommendation[] {
  const env = MISSION_ENVIRONMENTS[environmentId];
  const isPartialG = env.gravityG > 0;
  const hypercapniaNote =
    env.co2MmHg > 3.0 ? ` Cabin CO₂ is ${env.co2MmHg.toFixed(1)} mmHg (> 3.0 scrubber limit).` : "";

  const items: VitalSignRecommendation[] = [];

  // 1. Heart Rate (BPM)
  if (b.bpm > 115) {
    items.push({
      id: "bpm",
      vitalName: "Heart Rate (ECG)",
      zone: "corazon",
      currentReading: `${b.bpm} bpm`,
      status: "critical",
      problemLabel: "Severe Tachycardia",
      recommendation:
        "Immediate rest in neutral 0g posture; perform vagal breathing (4 s inhale, 8 s exhale), drink 300 mL cool electrolyte water, and lock 3-lead thoracic ECG for Flight Surgeon review.",
    });
  } else if (b.bpm < 44) {
    items.push({
      id: "bpm",
      vitalName: "Heart Rate (ECG)",
      zone: "corazon",
      currentReading: `${b.bpm} bpm`,
      status: "critical",
      problemLabel: "Severe Bradycardia",
      recommendation:
        "Suspend physical exertion immediately, verify thoracic vest electrode contact, assess for dizziness/syncope, and alert Flight Surgeon.",
    });
  } else if (b.bpm > 92) {
    items.push({
      id: "bpm",
      vitalName: "Heart Rate (ECG)",
      zone: "corazon",
      currentReading: `${b.bpm} bpm`,
      status: "warning",
      problemLabel: "Moderate Tachycardia",
      recommendation:
        "Pause heavy tasks for 15 minutes, sip 250 mL water, and perform 5 minutes of slow paced nasal breathing (4 s in, 6 s out).",
    });
  } else if (b.bpm < 52) {
    items.push({
      id: "bpm",
      vitalName: "Heart Rate (ECG)",
      zone: "corazon",
      currentReading: `${b.bpm} bpm`,
      status: "warning",
      problemLabel: "Mild Bradycardia",
      recommendation:
        "Monitor orthostatic tolerance during posture changes and verify electrolyte hydration.",
    });
  } else {
    items.push({
      id: "bpm",
      vitalName: "Heart Rate (ECG)",
      zone: "corazon",
      currentReading: `${b.bpm} bpm`,
      status: "optimal",
      problemLabel: "Sinus Rhythm Nominal",
      recommendation:
        "Maintain daily 30-minute CEVIS/T2 aerobic countermeasure and avoid stimulants before sleep.",
    });
  }

  // 2. Arterial Blood Pressure (PTT)
  if (b.systolicBP >= 150 || b.diastolicBP >= 95) {
    items.push({
      id: "bp",
      vitalName: "Arterial Blood Pressure (PTT)",
      zone: "corazon",
      currentReading: `${b.systolicBP}/${b.diastolicBP} mmHg`,
      status: "critical",
      problemLabel: "Hypertensive Surge",
      recommendation:
        "Halt ARED resistive loading immediately; adopt head-elevated posture, run a 30 s cuff recalibration on Node 3, and initiate Flight Surgeon antihypertensive protocol.",
    });
  } else if (b.systolicBP < 86 || b.diastolicBP < 55) {
    items.push({
      id: "bp",
      vitalName: "Arterial Blood Pressure (PTT)",
      zone: "corazon",
      currentReading: `${b.systolicBP}/${b.diastolicBP} mmHg`,
      status: "critical",
      problemLabel: "Acute Hypotension / Syncope Risk",
      recommendation: `Ingest 500 mL oral rehydration solution immediately, engage lower-body compression garment, and avoid rapid standing transitions${
        isPartialG ? ` in ${env.gravityLabel}` : ""
      }.`,
    });
  } else if (b.systolicBP >= 134 || b.diastolicBP >= 86) {
    items.push({
      id: "bp",
      vitalName: "Arterial Blood Pressure (PTT)",
      zone: "corazon",
      currentReading: `${b.systolicBP}/${b.diastolicBP} mmHg`,
      status: "warning",
      problemLabel: "Elevated Blood Pressure",
      recommendation:
        "Rest 10 minutes in neutral posture, restrict dietary sodium in today's ration, and re-zero optical PTT against the arm cuff.",
    });
  } else if (b.systolicBP < 95 || b.diastolicBP < 62) {
    items.push({
      id: "bp",
      vitalName: "Arterial Blood Pressure (PTT)",
      zone: "corazon",
      currentReading: `${b.systolicBP}/${b.diastolicBP} mmHg`,
      status: "warning",
      problemLabel: "Borderline Hypotension",
      recommendation:
        "Increase fluid intake by 350 mL with electrolytes to buffer microgravity plasma volume loss.",
    });
  } else {
    items.push({
      id: "bp",
      vitalName: "Arterial Blood Pressure (PTT)",
      zone: "corazon",
      currentReading: `${b.systolicBP}/${b.diastolicBP} mmHg`,
      status: "optimal",
      problemLabel: "Arterial Pressure Balanced",
      recommendation:
        "Systemic blood pressure balanced; continue steady hydration and low-sodium rations.",
    });
  }

  // 3. Oxygen Saturation (SpO2)
  if (b.spo2Percent < 92) {
    items.push({
      id: "spo2",
      vitalName: "Oxygen Saturation (SpO₂)",
      zone: "corazon",
      currentReading: `${b.spo2Percent}%`,
      status: "critical",
      problemLabel: "Acute Hypoxemia",
      recommendation: `Don portable emergency O₂ mask (2–4 L/min), inspect cabin ECLSS O₂ supply and CO₂ scrubbers immediately, and cease all physical activity.${hypercapniaNote}`,
    });
  } else if (b.spo2Percent < 95) {
    items.push({
      id: "spo2",
      vitalName: "Oxygen Saturation (SpO₂)",
      zone: "corazon",
      currentReading: `${b.spo2Percent}%`,
      status: "warning",
      problemLabel: "Mild Desaturation",
      recommendation: `Take 10 slow deep diaphragmatic breaths, verify frontal headband optical seating, and check module air circulation.${hypercapniaNote}`,
    });
  } else {
    items.push({
      id: "spo2",
      vitalName: "Oxygen Saturation (SpO₂)",
      zone: "corazon",
      currentReading: `${b.spo2Percent}%`,
      status: "optimal",
      problemLabel: "Arterial Oxygenation Optimal",
      recommendation:
        "Cranial SpO₂ optimal; keep frontal optical sensor band clean.",
    });
  }

  // 4. Respiratory Rate (RIP)
  if (b.respiratoryRateRpm > 24) {
    items.push({
      id: "resp",
      vitalName: "Respiratory Rate (RIP)",
      zone: "corazon",
      currentReading: `${b.respiratoryRateRpm} rpm`,
      status: "critical",
      problemLabel: "Severe Tachypnea / Hypercapnia Check",
      recommendation: `Stop exertion, inspect cabin CO₂ partial pressure (> 3.0 mmHg scrubber threshold), and perform guided 4–6 s slow breathing.${hypercapniaNote}`,
    });
  } else if (b.respiratoryRateRpm < 9) {
    items.push({
      id: "resp",
      vitalName: "Respiratory Rate (RIP)",
      zone: "corazon",
      currentReading: `${b.respiratoryRateRpm} rpm`,
      status: "critical",
      problemLabel: "Bradypnea Alert",
      recommendation:
        "Trigger acoustic alert via Node 3 BLE earpiece, verify airway patency, and contact Flight Surgeon immediately.",
    });
  } else if (b.respiratoryRateRpm > 20 || b.respiratoryRateRpm < 12) {
    items.push({
      id: "resp",
      vitalName: "Respiratory Rate (RIP)",
      zone: "corazon",
      currentReading: `${b.respiratoryRateRpm} rpm`,
      status: "warning",
      problemLabel: "Altered Respiratory Cadence",
      recommendation:
        "Practice 3 minutes of 4-second box breathing and verify thoracic RIP vest fit.",
    });
  } else {
    items.push({
      id: "resp",
      vitalName: "Respiratory Rate (RIP)",
      zone: "corazon",
      currentReading: `${b.respiratoryRateRpm} rpm`,
      status: "optimal",
      problemLabel: "Ventilation Calm & Unlabored",
      recommendation: "Respiratory cadence calm and unlabored.",
    });
  }

  // 5. Cardiac Recovery (HRV)
  if (b.hrvRmssdMs < 14) {
    items.push({
      id: "hrv",
      vitalName: "Cardiac Recovery (HRV rMSSD)",
      zone: "corazon",
      currentReading: `${b.hrvRmssdMs} ms`,
      status: "critical",
      problemLabel: "Severe Autonomic Exhaustion",
      recommendation:
        "Cancel high-load EVA or robotics operations and enforce a 20-minute supine vagal recovery block.",
    });
  } else if (b.hrvRmssdMs <= 25) {
    items.push({
      id: "hrv",
      vitalName: "Cardiac Recovery (HRV rMSSD)",
      zone: "corazon",
      currentReading: `${b.hrvRmssdMs} ms`,
      status: "warning",
      problemLabel: "Sympathetic Strain / Low HRV",
      recommendation:
        "Take a 10-minute recovery pause before the next operational block and avoid caffeine.",
    });
  }

  // 6. Blood Glucose (PoC)
  if (b.bloodGlucoseMgDl < 65) {
    items.push({
      id: "glucose",
      vitalName: "Blood Glucose (PoC)",
      zone: "abdomen",
      currentReading: `${b.bloodGlucoseMgDl} mg/dL`,
      status: "critical",
      problemLabel: "Acute Hypoglycemia",
      recommendation:
        "Ingest 15–20 g fast-acting oral glucose gel immediately and repeat Point-of-Care glucose check in 15 minutes.",
    });
  } else if (b.bloodGlucoseMgDl > 180) {
    items.push({
      id: "glucose",
      vitalName: "Blood Glucose (PoC)",
      zone: "abdomen",
      currentReading: `${b.bloodGlucoseMgDl} mg/dL`,
      status: "critical",
      problemLabel: "Marked Hyperglycemia",
      recommendation:
        "Drink 500 mL plain water, withhold simple carbohydrates, and perform 15 minutes of light cycle ergometry.",
    });
  } else if (b.bloodGlucoseMgDl < 74) {
    items.push({
      id: "glucose",
      vitalName: "Blood Glucose (PoC)",
      zone: "abdomen",
      currentReading: `${b.bloodGlucoseMgDl} mg/dL`,
      status: "warning",
      problemLabel: "Borderline Low Glucose",
      recommendation:
        "Consume a complex-carbohydrate ration bar now to stabilize glycemic reserve.",
    });
  } else if (b.bloodGlucoseMgDl > 125) {
    items.push({
      id: "glucose",
      vitalName: "Blood Glucose (PoC)",
      zone: "abdomen",
      currentReading: `${b.bloodGlucoseMgDl} mg/dL`,
      status: "warning",
      problemLabel: "Elevated Glucose",
      recommendation:
        "Replace simple sugars with high-fiber rations and drink 300 mL water.",
    });
  } else {
    items.push({
      id: "glucose",
      vitalName: "Blood Glucose (PoC)",
      zone: "abdomen",
      currentReading: `${b.bloodGlucoseMgDl} mg/dL`,
      status: "optimal",
      problemLabel: "Glycemic Reserve Stable",
      recommendation:
        "Glycemic energy reserve stable; maintain scheduled balanced rations.",
    });
  }

  // 7. Body Hydration
  if (b.hydrationPercent < 68) {
    items.push({
      id: "hydration",
      vitalName: "Body Hydration",
      zone: "abdomen",
      currentReading: `${b.hydrationPercent}%`,
      status: "critical",
      problemLabel: "Severe Dehydration / Renal Stone Risk",
      recommendation:
        "Initiate structured oral rehydration (600 mL electrolyte solution over 45 minutes) to prevent renal calculi and orthostatic collapse.",
    });
  } else if (b.hydrationPercent < 80) {
    items.push({
      id: "hydration",
      vitalName: "Body Hydration",
      zone: "abdomen",
      currentReading: `${b.hydrationPercent}%`,
      status: "warning",
      problemLabel: "Mild Hypohydration",
      recommendation:
        "Drink 350 mL electrolyte water now and set hourly 150 mL sip reminders.",
    });
  } else {
    items.push({
      id: "hydration",
      vitalName: "Body Hydration",
      zone: "abdomen",
      currentReading: `${b.hydrationPercent}%`,
      status: "optimal",
      problemLabel: "Hydration Reserve Optimal",
      recommendation: "Intravascular and cellular hydration optimal.",
    });
  }

  // 8. Core Body Temperature (ZHF)
  if (b.bodyTempC >= 38.0) {
    items.push({
      id: "temp",
      vitalName: "Core Body Temperature (ZHF)",
      zone: "abdomen",
      currentReading: `${b.bodyTempC.toFixed(1)} °C`,
      status: "critical",
      problemLabel: "Febrile / Hyperthermia Alert",
      recommendation:
        "Administer onboard antipyretic per medical kit protocol, maximize suit/cabin cooling airflow, and drink 500 mL cool electrolyte water.",
    });
  } else if (b.bodyTempC <= 35.4) {
    items.push({
      id: "temp",
      vitalName: "Core Body Temperature (ZHF)",
      zone: "abdomen",
      currentReading: `${b.bodyTempC.toFixed(1)} °C`,
      status: "critical",
      problemLabel: "Hypothermia Alert",
      recommendation:
        "Don thermal insulation garment, ingest warm fluids, and verify frontal ZHF thermistor contact.",
    });
  } else if (b.bodyTempC >= 37.3 || b.bodyTempC <= 36.0) {
    items.push({
      id: "temp",
      vitalName: "Core Body Temperature (ZHF)",
      zone: "abdomen",
      currentReading: `${b.bodyTempC.toFixed(1)} °C`,
      status: "warning",
      problemLabel: "Thermal Drift Detected",
      recommendation:
        "Suspend physical exercise for 20 minutes, drink 350 mL cool water, and monitor core-to-skin thermal gradient.",
    });
  } else {
    items.push({
      id: "temp",
      vitalName: "Core Body Temperature (ZHF)",
      zone: "abdomen",
      currentReading: `${b.bodyTempC.toFixed(1)} °C`,
      status: "optimal",
      problemLabel: "Core Thermoregulation Nominal",
      recommendation: "Core thermoregulation balanced in afebrile range.",
    });
  }

  // 9. Neurocognitive, Sleep & Stress
  items.push(evaluateNeuroRec(b));

  // 10. Radiation Exposure (Node 3 Dosimetry)
  if (b.dailyRadiationMsv >= CSA_RADIATION_LIMITS.dailyAlertMsv) {
    items.push({
      id: "radiation",
      vitalName: "Radiation Dosimetry (Node 3)",
      zone: "endocrino",
      currentReading: `${b.dailyRadiationMsv.toFixed(2)} mSv/d`,
      status: "critical",
      problemLabel: "High Radiation Flux",
      recommendation:
        "Relocate immediately to polyethylene / water-wall shielded sector, suspend EVA tasks, and log thoracic dosimeter reading.",
    });
  } else if (b.dailyRadiationMsv >= CSA_RADIATION_LIMITS.dailyNominalMsv + 0.15) {
    items.push({
      id: "radiation",
      vitalName: "Radiation Dosimetry (Node 3)",
      zone: "endocrino",
      currentReading: `${b.dailyRadiationMsv.toFixed(2)} mSv/d`,
      status: "warning",
      problemLabel: "Elevated Radiation Drift",
      recommendation:
        "Limit time in lightly shielded modules and take antioxidant ration supplement.",
    });
  } else {
    items.push({
      id: "radiation",
      vitalName: "Radiation Dosimetry (Node 3)",
      zone: "endocrino",
      currentReading: `${b.dailyRadiationMsv.toFixed(2)} mSv/d`,
      status: "optimal",
      problemLabel: "Radiation Shielding Nominal",
      recommendation:
        "Habitat shielding holds exposure within ALARA limits; keep dosimeter active.",
    });
  }

  // 11. Cortisol / Endocrine Load
  if (b.cortisolIndex > 74) {
    items.push({
      id: "cortisol",
      vitalName: "Endocrine Cortisol Index",
      zone: "endocrino",
      currentReading: `${b.cortisolIndex}/100`,
      status: "critical",
      problemLabel: "Acute Hormonal Stress Surge",
      recommendation:
        "Execute 15 minutes of slow vagal breathing, reduce schedule density, and protect 8-hour circadian dark window.",
    });
  } else if (b.cortisolIndex > 50) {
    items.push({
      id: "cortisol",
      vitalName: "Endocrine Cortisol Index",
      zone: "endocrino",
      currentReading: `${b.cortisolIndex}/100`,
      status: "warning",
      problemLabel: "Moderate Cortisol Elevation",
      recommendation:
        "Insert a 10-minute workload buffer and synchronize SSLA lighting to circadian phase.",
    });
  } else {
    items.push({
      id: "cortisol",
      vitalName: "Endocrine Cortisol Index",
      zone: "endocrino",
      currentReading: `${b.cortisolIndex}/100`,
      status: "optimal",
      problemLabel: "Cortisol & Circadian Rhythm Nominal",
      recommendation:
        "Endocrine cortisol/melatonin rhythm and radiation dosimetry within nominal limits.",
    });
  }

  // 12. Musculoskeletal Fatigue & Bone Mineral Density
  const musculoStatus = worstStatus([
    evaluatePhysicalFatigueStatus(b.physicalFatigue),
    evaluateBoneDensityStatus(b.boneDensityIndex),
  ]);
  if (musculoStatus === "critical") {
    items.push({
      id: "musculo",
      vitalName: "Musculoskeletal & Bone Load",
      zone: "musculo",
      currentReading: `Fatigue ${b.physicalFatigue}/100 · Bone ${b.boneDensityIndex}%`,
      status: "critical",
      problemLabel: "Severe Muscular Exhaustion / Bone Unloading Risk",
      recommendation:
        "Suspend heavy resistance sessions for 24 h; prioritize protein + vitamin D/calcium ration and verify neuromuscular recovery.",
    });
  } else if (musculoStatus === "warning") {
    items.push({
      id: "musculo",
      vitalName: "Musculoskeletal & Bone Load",
      zone: "musculo",
      currentReading: `Fatigue ${b.physicalFatigue}/100 · Bone ${b.boneDensityIndex}%`,
      status: "warning",
      problemLabel: "Moderate Muscular Fatigue / Microgravity Unloading",
      recommendation:
        "Perform gentle thoracic/lumbar unloading stretches and adjust ARED load to 70% intensity today.",
    });
  } else {
    items.push({
      id: "musculo",
      vitalName: "Musculoskeletal & Bone Load",
      zone: "musculo",
      currentReading: `Fatigue ${b.physicalFatigue}/100 · Bone ${b.boneDensityIndex}%`,
      status: "optimal",
      problemLabel: "Musculoskeletal & Bone Strength Nominal",
      recommendation:
        "Maintain scheduled 90-minute ARED resistive protocol and vitamin D supplementation.",
    });
  }

  // 13. Posture & Ocular/Vocal Strain
  const rostroStatus = worstStatus([
    evaluatePostureStatus(b.postureScore),
    evaluateFacialTensionStatus(b.facialTension),
  ]);
  if (rostroStatus === "critical") {
    items.push({
      id: "rostro",
      vitalName: "Posture & Laryngeal/Facial Tension",
      zone: "rostro",
      currentReading: `Posture ${b.postureScore}% · Tension ${b.facialTension}/100`,
      status: "critical",
      problemLabel: "Severe Slump / High Ocular-Vocal Tension",
      recommendation:
        "Step away from workstation immediately; perform 10 minutes of cervical decompression stretches and artificial tears instillation.",
    });
  } else if (rostroStatus === "warning") {
    items.push({
      id: "rostro",
      vitalName: "Posture & Laryngeal/Facial Tension",
      zone: "rostro",
      currentReading: `Posture ${b.postureScore}% · Tension ${b.facialTension}/100`,
      status: "warning",
      problemLabel: "Moderate Cervical Slump / Screen Strain",
      recommendation:
        "Perform 5 minutes of cervical/dorsal stretching and apply 20-20-20 distant visual focus breaks.",
    });
  } else {
    items.push({
      id: "rostro",
      vitalName: "Posture & Laryngeal/Facial Tension",
      zone: "rostro",
      currentReading: `Posture ${b.postureScore}% · Tension ${b.facialTension}/100`,
      status: "optimal",
      problemLabel: "Posture & Cranio-Vocal Comfort Nominal",
      recommendation:
        "Keep ergonomic neutral spinal restraint and 2-hour visual break intervals.",
    });
  }

  return items.sort(
    (a, z) => SEVERITY_PRIORITY[a.status] - SEVERITY_PRIORITY[z.status]
  );
}

export function getZoneTargetedRecommendations(
  zone: SystemZoneId,
  b: BiomarkerData,
  environmentId: MissionEnvironmentId = "iss"
): VitalSignRecommendation[] {
  return getActiveVitalRecommendations(b, environmentId).filter(
    (item) => item.zone === zone
  );
}
