export type MissionEnvironmentId = "iss" | "nave" | "luna" | "marte";

export type HealthStatus = "optimal" | "warning" | "critical";

export type TrendDirection = "up" | "stable" | "down";

export type SystemZoneId =
  | "cerebro"
  | "rostro"
  | "corazon"
  | "endocrino"
  | "abdomen"
  | "musculo";

export interface EnvironmentAlert {
  id: string;
  title: string;
  severity: HealthStatus;
  detail: string;
}

export interface MissionEnvironment {
  id: MissionEnvironmentId;
  name: string;
  shortName: string;
  agencyProgram: string;
  gravityG: number;
  gravityLabel: string;
  dailyRadiationMsv: number;
  radiationFactorLabel: string;
  commLatencySeconds: number;
  commLatencyLabel: string;
  commProtocol: string;
  cabinPressureKpa: number;
  co2MmHg: number;
  description: string;
  boneLoadFactor: number;
  isolationRiskBonus: number;
  alerts: EnvironmentAlert[];
}

export interface FiveHazardsImpact {
  radiation: string;
  isolation: string;
  distance: string;
  gravity: string;
  closedEnvironment: string;
}

export interface SystemDiagnosticGuide {
  id: SystemZoneId;
  name: string;
  shortTitle: string;
  subtitle: string;
  monitoredVariables: string[];
  howToPerform: string[];
  whyNecessary: string;
  fiveHazardsImpact: FiveHazardsImpact;
  attentionThreshold: {
    optimal: string;
    warning: string;
    critical: string;
    flightSurgeonNote: string;
  };
  preventiveCountermeasures: string[];
}

export interface BiomarkerData {
  bpm: number;
  systolicBP: number;
  diastolicBP: number;
  bloodGlucoseMgDl: number;
  bodyTempC: number;
  hydrationPercent: number;
  cortisolIndex: number;
  melatoninIndex: number;
  physicalFatigue: number;
  boneDensityIndex: number;
  dailyRadiationMsv: number;
  cumulativeRadiationMsv: number;
  mentalFatigue: number;
  reactionTimeMs: number;
  stressLevel: number;
  depressionRisk: number;
  lonelinessLevel: number;
  boredomLevel: number;
  stimulationIndex: number;
  sleepHours: number;
  moodScore: number;
  postureScore: number;
  facialTension: number;
  spo2Percent: number;
  respiratoryRateRpm: number;
  minuteVentilationLpm: number;
  hrvRmssdMs: number;
  pttMs: number;
  perfusionIndex: number;
  skinTempC: number;
  lastOscillometricCalHours: number;
  pttCalibrationRequired: boolean;
}

export interface HemodynamicIndices {
  mapMmHg: number;
  pulsePressureMmHg: number;
  shockIndex: number;
  thermalGradientC: number;
  orthostaticAlert: boolean;
  mapStatus: HealthStatus;
  pulsePressureStatus: HealthStatus;
  shockStatus: HealthStatus;
  thermalGradientStatus: HealthStatus;
}

export interface RoutineTracking {
  sleepStartTime: string;
  baselineSleepStartTime: string;
  sleepDeviationMin: number;
  exerciseMinutes: number;
  baselineExerciseMinutes: number;
  mealsCompleted: number;
  baselineMeals: number;
  mealDeviationMin: number;
  hydrationLiters: number;
  baselineHydrationLiters: number;
}

export interface RoutineDeviationItem {
  id: string;
  label: string;
  currentText: string;
  baselineText: string;
  deviationText: string;
  status: HealthStatus;
}

export interface TelemetryPoint {
  label: string;
  bpm: number;
  glucose: number;
  hydration: number;
  physicalFatigue: number;
  mentalFatigue: number;
  cortisol: number;
  melatonin: number;
  stress: number;
  loneliness: number;
  boredom: number;
  routineStability: number;
}

export interface MissionQuest {
  id: string;
  title: string;
  category: "fisico" | "hidratacion" | "mental" | "circadiano";
  xpReward?: number;
  durationLabel: string;
  description: string;
  impactDescription: string;
  nasaStandard?: string;
  nasaSource?: string;
  previousComparison?: string;
  completed: boolean;
}

export type RecommendedHabit = MissionQuest;

export interface EmergencyProtocolStep {
  id: string;
  stepNumber: number;
  title: string;
  instruction: string;
  completed: boolean;
}

export interface ScanLogEntry {
  id: string;
  timestamp: string;
  modality: "camara" | "ultrasonido" | "manual" | "emergencia" | "wearable";
  summary: string;
}

export interface AstronautDashboardState {
  environmentId: MissionEnvironmentId;
  telemedicineEnabled: boolean;
  missionDay: number;
  astronautName: string;
  crewRole: string;
  biomarkers: BiomarkerData;
  previousBiomarkers: BiomarkerData;
  routine: RoutineTracking;
  history: TelemetryPoint[];
  quests: MissionQuest[];
  xp?: number;
  streakDays?: number;
  emergencyMode: boolean;
  emergencyChecklist: EmergencyProtocolStep[];
  lastUltrasoundFinding: string;
  lastCameraFinding: string;
  scanLogs: ScanLogEntry[];
}
