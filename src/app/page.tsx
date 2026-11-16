"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import { ClipboardList, ShieldCheck } from "lucide-react";
import AnatomicalScanner from "@/components/AnatomicalScanner";
import BiomarkersDashboard from "@/components/BiomarkersDashboard";
import EmergencyBannerModal from "@/components/EmergencyBannerModal";
import HabitsExplanationPanel from "@/components/HabitsExplanationPanel";
import LeftNavSidebar, { NavSectionId } from "@/components/LeftNavSidebar";
import MultimodalScanModal from "@/components/MultimodalScanModal";
import OverviewBentoGrid from "@/components/OverviewBentoGrid";
import PrimaryVitalsStrip from "@/components/PrimaryVitalsStrip";
import RecommendedHabitsPanel from "@/components/RecommendedHabitsPanel";
import ScientificFrameworkSection from "@/components/ScientificFrameworkSection";
import ScientificReferencesModal from "@/components/ScientificReferencesModal";
import TelemetryCharts from "@/components/TelemetryCharts";
import TopMissionBar from "@/components/TopMissionBar";
import WearableHarnessPanel from "@/components/WearableHarnessPanel";
import {
  INITIAL_DASHBOARD_STATE,
  hydrateRecommendedHabits,
} from "@/data/missionData";
import {
  AstronautDashboardState,
  BiomarkerData,
  MissionEnvironmentId,
  MissionQuest,
  RoutineTracking,
  SystemZoneId,
  TelemetryPoint,
} from "@/types/astronaut";
import {
  applyLivePhysioJitter,
  buildEmergencyState,
  calibrateOscillometricCuff,
  clamp,
  computeMissionReadiness,
  computeRoutineDeviations,
  evaluateAllZoneStatuses,
  getLiveEnvironmentTelemetry,
  hydrateBiomarkers,
  recalculateForEnvironment,
  restoreNominalFromEmergency,
} from "@/utils/healthEngine";

const STORAGE_KEY = "astro-med-hrp-state-v5";
const STORAGE_EVENT = "astro-med-storage-change";

const MODALITY_LABELS: Record<string, string> = {
  manual: "POC MANUAL",
  emergencia: "EMERGENCY",
  wearable: "WEARABLE 3N",
};

let cachedRaw: string | null = null;
let cachedParsed: AstronautDashboardState = INITIAL_DASHBOARD_STATE;

function subscribeDashboard(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = () => callback();
  window.addEventListener("storage", handler);
  window.addEventListener(STORAGE_EVENT, handler);
  return () => {
    window.removeEventListener("storage", handler);
    window.removeEventListener(STORAGE_EVENT, handler);
  };
}

function getDashboardSnapshot(): AstronautDashboardState {
  if (typeof window === "undefined") return INITIAL_DASHBOARD_STATE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      cachedRaw = null;
      cachedParsed = INITIAL_DASHBOARD_STATE;
      return cachedParsed;
    }
    if (raw === cachedRaw) return cachedParsed;
    const parsed = JSON.parse(raw) as Partial<AstronautDashboardState>;
    if (parsed && parsed.biomarkers && parsed.routine && parsed.environmentId) {
      cachedRaw = raw;
      cachedParsed = {
        ...INITIAL_DASHBOARD_STATE,
        ...parsed,
        biomarkers: hydrateBiomarkers(parsed.biomarkers),
        previousBiomarkers: hydrateBiomarkers(
          parsed.previousBiomarkers ?? parsed.biomarkers
        ),
        routine: {
          ...INITIAL_DASHBOARD_STATE.routine,
          ...parsed.routine,
        },
        quests: hydrateRecommendedHabits(parsed.quests),
      };
      return cachedParsed;
    }
  } catch {
    // Fallback cleanly
  }
  return INITIAL_DASHBOARD_STATE;
}

function getDashboardServerSnapshot(): AstronautDashboardState {
  return INITIAL_DASHBOARD_STATE;
}

function writeDashboardStorage(next: AstronautDashboardState): void {
  if (typeof window === "undefined") return;
  try {
    const raw = JSON.stringify(next);
    cachedRaw = raw;
    cachedParsed = next;
    window.localStorage.setItem(STORAGE_KEY, raw);
    window.dispatchEvent(new Event(STORAGE_EVENT));
  } catch {
    // Ignore storage quota issues
  }
}

function appendTelemetrySnapshot(
  history: TelemetryPoint[],
  label: string,
  b: BiomarkerData,
  routine: RoutineTracking
): TelemetryPoint[] {
  const { stabilityScore } = computeRoutineDeviations(routine);
  const newPoint: TelemetryPoint = {
    label,
    bpm: b.bpm,
    glucose: b.bloodGlucoseMgDl,
    hydration: b.hydrationPercent,
    physicalFatigue: b.physicalFatigue,
    mentalFatigue: b.mentalFatigue,
    cortisol: b.cortisolIndex,
    melatonin: b.melatoninIndex,
    stress: b.stressLevel,
    loneliness: b.lonelinessLevel,
    boredom: b.boredomLevel,
    routineStability: stabilityScore,
  };
  const trimmed = history.filter((p) => p.label !== "EMERGENCY").slice(-9);
  return [...trimmed, newPoint];
}

function getUtcStamp(): string {
  return `${new Date().toISOString().slice(11, 16)} UTC`;
}

export default function HomePage() {
  const state = useSyncExternalStore(
    subscribeDashboard,
    getDashboardSnapshot,
    getDashboardServerSnapshot
  );

  const setState = useCallback(
    (
      updater:
        | AstronautDashboardState
        | ((prev: AstronautDashboardState) => AstronautDashboardState)
    ) => {
      const current = getDashboardSnapshot();
      const next = typeof updater === "function" ? updater(current) : updater;
      writeDashboardStorage(next);
    },
    []
  );

  const [selectedZone, setSelectedZone] = useState<SystemZoneId>("cerebro");
  const [activeNavSection, setActiveNavSection] =
    useState<NavSectionId>("resumen");
  const [scanModalOpen, setScanModalOpen] = useState(false);
  const [referencesOpen, setReferencesOpen] = useState(false);
  const [highlightedHabitId, setHighlightedHabitId] = useState<string | null>(
    null
  );
  const [jitterTick, setJitterTick] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setJitterTick((prev) => (prev + 1) % 240);
    }, 2500);
    return () => window.clearInterval(timer);
  }, []);

  const liveBiomarkers = useMemo(
    () =>
      jitterTick === 0
        ? state.biomarkers
        : applyLivePhysioJitter(state.biomarkers, jitterTick),
    [state.biomarkers, jitterTick]
  );

  const liveCabinTelemetry = useMemo(
    () =>
      getLiveEnvironmentTelemetry(
        state.environmentId,
        state.biomarkers.dailyRadiationMsv,
        jitterTick
      ),
    [state.environmentId, state.biomarkers.dailyRadiationMsv, jitterTick]
  );

  const handleInspectHabit = (habitId: string) => {
    setHighlightedHabitId(habitId);
    setActiveNavSection("referencias");
    if (typeof window !== "undefined") {
      window.setTimeout(() => {
        document
          .getElementById("explicacion-habitos")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 80);
    }
  };

  const handleNavigateSection = (section: NavSectionId) => {
    setActiveNavSection(section);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleSelectZoneAndScroll = (zone: SystemZoneId) => {
    setSelectedZone(zone);
    handleNavigateSection("escaner");
  };

  const zoneStatuses = useMemo(
    () =>
      evaluateAllZoneStatuses(
        state.biomarkers,
        state.routine,
        state.environmentId
      ),
    [state.biomarkers, state.routine, state.environmentId]
  );

  const routineSummary = useMemo(
    () => computeRoutineDeviations(state.routine),
    [state.routine]
  );

  const readinessScore = useMemo(
    () => computeMissionReadiness(zoneStatuses, routineSummary.stabilityScore),
    [zoneStatuses, routineSummary.stabilityScore]
  );

  const handleSelectEnvironment = (envId: MissionEnvironmentId) => {
    setState((prev) => recalculateForEnvironment(prev, envId));
  };

  const handleCalibrateOscillometric = () => {
    setState((prev) => calibrateOscillometricCuff(prev));
  };

  const handleToggleTelemedicine = () => {
    setState((prev) => ({
      ...prev,
      telemedicineEnabled: !prev.telemedicineEnabled,
    }));
  };

  const handleToggleEmergency = () => {
    setState((prev) =>
      prev.emergencyMode
        ? restoreNominalFromEmergency(prev)
        : buildEmergencyState(prev)
    );
  };

  const handleToggleEmergencyStep = (stepId: string) => {
    setState((prev) => ({
      ...prev,
      emergencyChecklist: prev.emergencyChecklist.map((s) =>
        s.id === stepId ? { ...s, completed: !s.completed } : s
      ),
    }));
  };

  const handleOpenPocModal = () => {
    setScanModalOpen(true);
  };

  const handleApplyManualEntry = (
    nextBiomarkers: BiomarkerData,
    nextRoutine: RoutineTracking
  ) => {
    setState((prev) => ({
      ...prev,
      emergencyMode: false,
      previousBiomarkers: prev.biomarkers,
      biomarkers: nextBiomarkers,
      routine: nextRoutine,
      history: appendTelemetrySnapshot(
        prev.history,
        "Manual",
        nextBiomarkers,
        nextRoutine
      ),
      scanLogs: [
        {
          id: `log-man-${Date.now()}`,
          timestamp: getUtcStamp(),
          modality: "manual",
          summary: `Manual entry: ${nextBiomarkers.bpm} BPM, Glucose ${nextBiomarkers.bloodGlucoseMgDl} mg/dL, Hydration ${nextBiomarkers.hydrationPercent}%, Sleep ${nextBiomarkers.sleepHours.toFixed(1)}h.`,
        },
        ...prev.scanLogs.slice(0, 7),
      ],
    }));
  };

  const handleToggleHabit = (habitId: string) => {
    setState((prev) => {
      const target = prev.quests.find((q) => q.id === habitId);
      if (!target) return prev;

      const completing = !target.completed;
      const b = prev.biomarkers;
      const r = prev.routine;

      let nextBio = { ...b };
      let nextRoutine = { ...r };

      if (completing) {
        if (target.id === "quest-ared" || target.category === "fisico") {
          nextBio = {
            ...nextBio,
            physicalFatigue: clamp(nextBio.physicalFatigue - 6, 10, 95),
            boneDensityIndex: clamp(
              Number((nextBio.boneDensityIndex + 0.5).toFixed(1)),
              78,
              100
            ),
            stressLevel: clamp(nextBio.stressLevel - 4, 8, 95),
          };
          nextRoutine = {
            ...nextRoutine,
            exerciseMinutes: clamp(nextRoutine.exerciseMinutes + 35, 0, 180),
          };
        } else if (
          target.id === "quest-hydration" ||
          target.category === "hidratacion"
        ) {
          nextBio = {
            ...nextBio,
            hydrationPercent: clamp(nextBio.hydrationPercent + 6, 50, 100),
          };
          nextRoutine = {
            ...nextRoutine,
            hydrationLiters: clamp(
              Number((nextRoutine.hydrationLiters + 0.6).toFixed(1)),
              0.5,
              3.5
            ),
          };
        } else if (
          target.id === "quest-family" ||
          target.category === "mental"
        ) {
          const nextBoredom = clamp(nextBio.boredomLevel - 10, 8, 95);
          nextBio = {
            ...nextBio,
            lonelinessLevel: clamp(nextBio.lonelinessLevel - 9, 8, 95),
            boredomLevel: nextBoredom,
            stimulationIndex: 100 - nextBoredom,
            mentalFatigue: clamp(nextBio.mentalFatigue - 7, 8, 95),
            moodScore: clamp(nextBio.moodScore + 7, 15, 100),
          };
        } else if (
          target.id === "quest-circadian" ||
          target.category === "circadiano"
        ) {
          nextBio = {
            ...nextBio,
            melatoninIndex: clamp(nextBio.melatoninIndex + 8, 15, 95),
            cortisolIndex: clamp(nextBio.cortisolIndex - 6, 15, 95),
          };
          nextRoutine = {
            ...nextRoutine,
            sleepDeviationMin: Math.max(0, nextRoutine.sleepDeviationMin - 20),
          };
        }
      }

      const nextHabits = prev.quests.map((q) =>
        q.id === habitId ? { ...q, completed: completing } : q
      );

      return {
        ...prev,
        previousBiomarkers: prev.biomarkers,
        biomarkers: nextBio,
        routine: nextRoutine,
        quests: nextHabits,
      };
    });
  };

  const handleAddCustomHabit = (
    title: string,
    category: MissionQuest["category"]
  ) => {
    const customHabit: MissionQuest = {
      id: `quest-custom-${Date.now()}`,
      title,
      category,
      durationLabel: "15 min",
      description: "Custom preventive countermeasure added by crew member.",
      impactDescription:
        "Supports physical or behavioral wellbeing and daily schedule stability throughout the mission.",
      completed: false,
    };
    setState((prev) => ({
      ...prev,
      quests: [...prev.quests, customHabit],
    }));
  };

  const handleResetMission = () => {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore
    }
    setState(INITIAL_DASHBOARD_STATE);
    setSelectedZone("cerebro");
    handleNavigateSection("resumen");
  };

  return (
    <div className="crew-dragon-theme flex min-h-screen flex-col bg-[#070c17] text-slate-100 md:flex-row">
      {/* Barra Lateral Izquierda */}
      <LeftNavSidebar
        activeSection={activeNavSection}
        onNavigate={handleNavigateSection}
        onOpenScanModal={handleOpenPocModal}
      />

      {/* Right Main Scrollable Area */}
      <div className="min-w-0 flex-1 bg-telemetry-grid">
        {/* Cinta Superior Única de 1 Línea (Tipo Consola Aeroespacial) */}
        <TopMissionBar
          environmentId={state.environmentId}
          telemedicineEnabled={state.telemedicineEnabled}
          missionDay={state.missionDay}
          astronautName={state.astronautName}
          dailyRadiationMsv={state.biomarkers.dailyRadiationMsv}
          readinessScore={readinessScore}
          emergencyMode={state.emergencyMode}
          zoneStatuses={zoneStatuses}
          biomarkers={state.biomarkers}
          activeSection={activeNavSection}
          onNavigateSection={handleNavigateSection}
          onSelectEnvironment={handleSelectEnvironment}
          onToggleTelemedicine={handleToggleTelemedicine}
          onOpenScanModal={handleOpenPocModal}
          onInspectProtocol={handleSelectZoneAndScroll}
          onResetMission={handleResetMission}
        />

        {/* Main Workspace */}
        <main className="mx-auto max-w-[1600px] space-y-4 px-4 py-4 pb-12 sm:px-6">
          {/* Module 5: Live Emergency Alert & Flight Surgeon Contact Protocol */}
          <EmergencyBannerModal
            emergencyMode={state.emergencyMode}
            environmentId={state.environmentId}
            telemedicineEnabled={state.telemedicineEnabled}
            biomarkers={state.biomarkers}
            checklist={state.emergencyChecklist}
            onToggleStep={handleToggleEmergencyStep}
            onRestoreNominal={handleToggleEmergency}
          />

          {/* Franja Superior de Signos Vitales Primarios (Números Grandes + Ondas en Vivo) */}
          <PrimaryVitalsStrip
            biomarkers={liveBiomarkers}
            environmentId={state.environmentId}
            readinessScore={readinessScore}
            cabinCo2MmHg={liveCabinTelemetry.co2MmHg}
            onSelectZone={handleSelectZoneAndScroll}
            onOpenWearable={() => handleNavigateSection("wearable")}
          />

          {/* SECCIÓN 1: Monitor General */}
          {activeNavSection === "resumen" && (
            <>
              <OverviewBentoGrid
                environmentId={state.environmentId}
                biomarkers={liveBiomarkers}
                routine={state.routine}
                zoneStatuses={zoneStatuses}
                readinessScore={readinessScore}
                history={state.history}
                liveCabinPressureKpa={liveCabinTelemetry.cabinPressureKpa}
                liveCo2MmHg={liveCabinTelemetry.co2MmHg}
                onSelectZoneAndScroll={handleSelectZoneAndScroll}
                onNavigateWearable={() => handleNavigateSection("wearable")}
                onNavigateBiomarkers={() => handleNavigateSection("biomarcadores")}
                onOpenPocModal={handleOpenPocModal}
              />

              <section className="rounded-xl border border-[#1b2d4b] bg-[#0c1426] p-4">
                <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
                  <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-200">
                    <ClipboardList className="h-4 w-4 text-sky-400" />
                    Recent Clinical Log (Local Onboard Storage)
                  </h3>
                  <span className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-400">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Synced in local memory
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
                  {state.scanLogs.slice(0, 4).map((log) => (
                    <div
                      key={log.id}
                      className="rounded-lg border border-[#162642] bg-[#091120] p-3 text-xs"
                    >
                      <div className="flex items-center justify-between font-mono-hud text-[10px]">
                        <span className="font-semibold uppercase text-sky-400">
                          {MODALITY_LABELS[log.modality] ?? log.modality}
                        </span>
                        <span className="text-slate-400">{log.timestamp}</span>
                      </div>
                      <p className="mt-1 line-clamp-2 text-slate-300">
                        {log.summary}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}

          {/* SECCIÓN 2: Escáner Anatómico y Psicológico por Pestañas */}
          {activeNavSection === "escaner" && (
            <AnatomicalScanner
              selectedZone={selectedZone}
              onSelectZone={setSelectedZone}
              zoneStatuses={zoneStatuses}
              biomarkers={liveBiomarkers}
              environmentId={state.environmentId}
              onOpenPocModal={handleOpenPocModal}
            />
          )}

          {/* SECCIÓN 3: Arnés Vestible Bio-Monitor CSA (13 Signos Continuos) */}
          {activeNavSection === "wearable" && (
            <WearableHarnessPanel
              environmentId={state.environmentId}
              biomarkers={liveBiomarkers}
              cabinCo2MmHg={liveCabinTelemetry.co2MmHg}
              cabinPressureKpa={liveCabinTelemetry.cabinPressureKpa}
              onCalibrateOscillometric={handleCalibrateOscillometric}
              onSelectSystemZone={handleSelectZoneAndScroll}
            />
          )}

          {/* SECCIÓN 4: Signos Vitales Físicos, Salud Mental BHP y Detector de Rutina */}
          {activeNavSection === "biomarcadores" && (
            <BiomarkersDashboard
              environmentId={state.environmentId}
              biomarkers={liveBiomarkers}
              previousBiomarkers={state.previousBiomarkers}
              routine={state.routine}
              onSelectSystemZone={handleSelectZoneAndScroll}
              onOpenManualEdit={handleOpenPocModal}
              onJumpToWearable={() => handleNavigateSection("wearable")}
            />
          )}

          {/* SECCIÓN 5: Gráficas de Tendencia + Hábitos Recomendados */}
          {activeNavSection === "informes" && (
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
              <div className="xl:col-span-7">
                <TelemetryCharts history={state.history} />
              </div>
              <div className="xl:col-span-5">
                <RecommendedHabitsPanel
                  habits={state.quests}
                  biomarkers={state.biomarkers}
                  environmentId={state.environmentId}
                  onToggleHabit={handleToggleHabit}
                  onAddCustomHabit={handleAddCustomHabit}
                  onInspectHabit={handleInspectHabit}
                />
              </div>
            </div>
          )}

          {/* SECCIÓN 6: Manual Clínico y Técnico a Bordo · NASA-STD-3001 */}
          {activeNavSection === "referencias" && (
            <div className="space-y-5">
              <HabitsExplanationPanel
                habits={state.quests}
                highlightedHabitId={highlightedHabitId}
              />
              <ScientificFrameworkSection
                environmentId={state.environmentId}
                dailyRadiationMsv={state.biomarkers.dailyRadiationMsv}
                cumulativeRadiationMsv={state.biomarkers.cumulativeRadiationMsv}
              />
            </div>
          )}
        </main>
      </div>

      {/* Module 3: Point-of-Care Manual Entry & Clinical Profile Simulator */}
      {scanModalOpen && (
        <MultimodalScanModal
          isOpen={scanModalOpen}
          biomarkers={state.biomarkers}
          routine={state.routine}
          onClose={() => setScanModalOpen(false)}
          onApplyManualEntry={handleApplyManualEntry}
        />
      )}

      {/* Modal de Referencias Científicas NASA HRP & CSA */}
      <ScientificReferencesModal
        isOpen={referencesOpen}
        onClose={() => setReferencesOpen(false)}
      />
    </div>
  );
}