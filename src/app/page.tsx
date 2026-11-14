"use client";

import React, { useCallback, useMemo, useState, useSyncExternalStore } from "react";
import { ClipboardList, ShieldCheck } from "lucide-react";
import AnatomicalScanner from "@/components/AnatomicalScanner";
import BiomarkersDashboard from "@/components/BiomarkersDashboard";
import EmergencyBannerModal from "@/components/EmergencyBannerModal";
import GamificationPanel from "@/components/GamificationPanel";
import MultimodalScanModal, {
  ScanModalTab,
} from "@/components/MultimodalScanModal";
import ScientificReferencesModal from "@/components/ScientificReferencesModal";
import TelemetryCharts from "@/components/TelemetryCharts";
import TopMissionBar from "@/components/TopMissionBar";
import { INITIAL_DASHBOARD_STATE } from "@/data/missionData";
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
  buildEmergencyState,
  clamp,
  computeMissionReadiness,
  computeRoutineDeviations,
  evaluateAllZoneStatuses,
  recalculateForEnvironment,
  restoreNominalFromEmergency,
} from "@/utils/healthEngine";

const STORAGE_KEY = "astro-med-hrp-state-v1";
const STORAGE_EVENT = "astro-med-storage-change";

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
        biomarkers: {
          ...INITIAL_DASHBOARD_STATE.biomarkers,
          ...parsed.biomarkers,
        },
        routine: {
          ...INITIAL_DASHBOARD_STATE.routine,
          ...parsed.routine,
        },
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
  const trimmed = history.filter((p) => p.label !== "EMERGENCIA").slice(-9);
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
  const [scanModalOpen, setScanModalOpen] = useState(false);
  const [scanInitialTab, setScanInitialTab] = useState<ScanModalTab>("camara");
  const [referencesOpen, setReferencesOpen] = useState(false);

  const zoneStatuses = useMemo(
    () => evaluateAllZoneStatuses(state.biomarkers, state.routine),
    [state.biomarkers, state.routine]
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

  const handleOpenScanTab = (tab: ScanModalTab) => {
    setScanInitialTab(tab);
    setScanModalOpen(true);
  };

  const handleApplyCameraResults = (
    updates: Partial<BiomarkerData>,
    summary: string
  ) => {
    setState((prev) => {
      const nextBio: BiomarkerData = { ...prev.biomarkers, ...updates };
      return {
        ...prev,
        emergencyMode: false,
        previousBiomarkers: prev.biomarkers,
        biomarkers: nextBio,
        lastCameraFinding: summary,
        history: appendTelemetrySnapshot(
          prev.history,
          "Cámara",
          nextBio,
          prev.routine
        ),
        scanLogs: [
          {
            id: `log-cam-${Date.now()}`,
            timestamp: getUtcStamp(),
            modality: "camara",
            summary,
          },
          ...prev.scanLogs.slice(0, 7),
        ],
      };
    });
    setSelectedZone("rostro");
  };

  const handleApplyUltrasoundResults = (
    updates: Partial<BiomarkerData>,
    finding: string
  ) => {
    setState((prev) => {
      const nextBio: BiomarkerData = { ...prev.biomarkers, ...updates };
      return {
        ...prev,
        emergencyMode: false,
        previousBiomarkers: prev.biomarkers,
        biomarkers: nextBio,
        lastUltrasoundFinding: finding,
        history: appendTelemetrySnapshot(
          prev.history,
          "Ultrasonido",
          nextBio,
          prev.routine
        ),
        scanLogs: [
          {
            id: `log-us-${Date.now()}`,
            timestamp: getUtcStamp(),
            modality: "ultrasonido",
            summary: finding,
          },
          ...prev.scanLogs.slice(0, 7),
        ],
      };
    });
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
          summary: `Registro manual: ${nextBiomarkers.bpm} BPM, Glucosa ${nextBiomarkers.bloodGlucoseMgDl} mg/dL, Hidratación ${nextBiomarkers.hydrationPercent}%, Sueño ${nextBiomarkers.sleepHours.toFixed(1)}h.`,
        },
        ...prev.scanLogs.slice(0, 7),
      ],
    }));
  };

  const handleToggleQuest = (questId: string) => {
    setState((prev) => {
      const target = prev.quests.find((q) => q.id === questId);
      if (!target) return prev;

      const completing = !target.completed;
      const xpDelta = completing ? target.xpReward : -target.xpReward;
      const b = prev.biomarkers;
      const r = prev.routine;

      let nextBio = { ...b };
      let nextRoutine = { ...r };

      // Apply realistic countermeasure effects when completing quests
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

      const nextQuests = prev.quests.map((q) =>
        q.id === questId ? { ...q, completed: completing } : q
      );

      const completedBefore = prev.quests.filter((q) => q.completed).length;
      const completedAfter = nextQuests.filter((q) => q.completed).length;
      const streakDelta =
        completedBefore === 0 && completedAfter > 0
          ? 1
          : completedBefore > 0 && completedAfter === 0
          ? -1
          : 0;

      return {
        ...prev,
        previousBiomarkers: prev.biomarkers,
        biomarkers: nextBio,
        routine: nextRoutine,
        quests: nextQuests,
        xp: Math.max(0, prev.xp + xpDelta),
        streakDays: Math.max(1, prev.streakDays + streakDelta),
      };
    });
  };

  const handleAddCustomQuest = (
    title: string,
    category: MissionQuest["category"]
  ) => {
    const customQuest: MissionQuest = {
      id: `quest-custom-${Date.now()}`,
      title,
      category,
      xpReward: 75,
      durationLabel: "15 min",
      description: "Contramedida personalizada añadida por el tripulante.",
      impactDescription: "Ayuda a mantener rutina activa y bienestar general",
      completed: false,
    };
    setState((prev) => ({
      ...prev,
      quests: [...prev.quests, customQuest],
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
  };

  return (
    <div className="min-h-screen bg-slate-950 bg-telemetry-grid text-slate-100">
      {/* Top Aerospace Mission Bar + Environment Selector + Telemedicine Switch */}
      <TopMissionBar
        environmentId={state.environmentId}
        telemedicineEnabled={state.telemedicineEnabled}
        missionDay={state.missionDay}
        astronautName={state.astronautName}
        crewRole={state.crewRole}
        dailyRadiationMsv={state.biomarkers.dailyRadiationMsv}
        cumulativeRadiationMsv={state.biomarkers.cumulativeRadiationMsv}
        readinessScore={readinessScore}
        emergencyMode={state.emergencyMode}
        zoneStatuses={zoneStatuses}
        onSelectEnvironment={handleSelectEnvironment}
        onToggleTelemedicine={handleToggleTelemedicine}
        onOpenScanModal={() => handleOpenScanTab("camara")}
        onToggleEmergency={handleToggleEmergency}
        onOpenReferences={() => setReferencesOpen(true)}
        onResetMission={handleResetMission}
      />

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

      {/* Main Workspace */}
      <main className="mx-auto max-w-[1600px] space-y-6 px-4 py-6 sm:px-6">
        {/* Module 1: Interactive Anatomical & Psychological SVG Scanner */}
        <AnatomicalScanner
          selectedZone={selectedZone}
          onSelectZone={setSelectedZone}
          zoneStatuses={zoneStatuses}
          biomarkers={state.biomarkers}
          environmentId={state.environmentId}
          onOpenScanTab={handleOpenScanTab}
        />

        {/* Module 2: Comprehensive Biomarkers, Mental/Behavioral Health & Routine Change Detector */}
        <BiomarkersDashboard
          biomarkers={state.biomarkers}
          previousBiomarkers={state.previousBiomarkers}
          routine={state.routine}
          lastCameraFinding={state.lastCameraFinding}
          lastUltrasoundFinding={state.lastUltrasoundFinding}
          onSelectSystemZone={setSelectedZone}
          onOpenManualEdit={() => handleOpenScanTab("manual")}
        />

        {/* Module 4: Dynamic Recharts Telemetry + Gamification Action Plan */}
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
          <div className="xl:col-span-7">
            <TelemetryCharts history={state.history} />
          </div>
          <div className="xl:col-span-5">
            <GamificationPanel
              quests={state.quests}
              xp={state.xp}
              streakDays={state.streakDays}
              onToggleQuest={handleToggleQuest}
              onAddCustomQuest={handleAddCustomQuest}
            />
          </div>
        </div>

        {/* Local Offline Activity Audit Log */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 sm:p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300">
              <ClipboardList className="h-4 w-4 text-cyan-400" />
              Bitácora Local de Autoevaluaciones (Persistencia Offline)
            </h3>
            <span className="flex items-center gap-1.5 text-[11px] text-emerald-400">
              <ShieldCheck className="h-3.5 w-3.5" />
              Guardado localmente en el dispositivo sin conexión externa
            </span>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {state.scanLogs.slice(0, 4).map((log) => (
              <div
                key={log.id}
                className="rounded-xl border border-slate-800 bg-slate-950/80 p-3 text-xs"
              >
                <div className="flex items-center justify-between font-mono-hud text-[10px]">
                  <span className="uppercase text-cyan-400">{log.modality}</span>
                  <span className="text-slate-500">{log.timestamp}</span>
                </div>
                <p className="mt-1 line-clamp-2 text-slate-300">{log.summary}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Module 3: Multimodal Scan Modal (Camera / Ultrasound / Manual) */}
      {scanModalOpen && (
        <MultimodalScanModal
          isOpen={scanModalOpen}
          initialTab={scanInitialTab}
          biomarkers={state.biomarkers}
          routine={state.routine}
          onClose={() => setScanModalOpen(false)}
          onApplyCameraResults={handleApplyCameraResults}
          onApplyUltrasoundResults={handleApplyUltrasoundResults}
          onApplyManualEntry={handleApplyManualEntry}
        />
      )}

      {/* Module 5: NASA HRP & CSA Scientific References Modal */}
      <ScientificReferencesModal
        isOpen={referencesOpen}
        onClose={() => setReferencesOpen(false)}
      />
    </div>
  );
}
