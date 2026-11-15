"use client";

import React, { useCallback, useMemo, useState, useSyncExternalStore } from "react";
import { ClipboardList, ShieldCheck } from "lucide-react";
import AnatomicalScanner from "@/components/AnatomicalScanner";
import BiomarkersDashboard from "@/components/BiomarkersDashboard";
import EmergencyBannerModal from "@/components/EmergencyBannerModal";
import GamificationPanel from "@/components/GamificationPanel";
import LeftNavSidebar, { NavSectionId } from "@/components/LeftNavSidebar";
import MissionTimeSyncBar from "@/components/MissionTimeSyncBar";
import MultimodalScanModal, {
  ScanModalTab,
} from "@/components/MultimodalScanModal";
import OverviewBentoGrid from "@/components/OverviewBentoGrid";
import ScientificReferencesModal from "@/components/ScientificReferencesModal";
import SectionPagerControls from "@/components/SectionPagerControls";
import TelemetryCharts from "@/components/TelemetryCharts";
import TopMissionBar from "@/components/TopMissionBar";
import WearableHarnessPanel from "@/components/WearableHarnessPanel";
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
  calibrateOscillometricCuff,
  clamp,
  computeMissionReadiness,
  computeRoutineDeviations,
  evaluateAllZoneStatuses,
  hydrateBiomarkers,
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
        biomarkers: hydrateBiomarkers(parsed.biomarkers),
        previousBiomarkers: hydrateBiomarkers(
          parsed.previousBiomarkers ?? parsed.biomarkers
        ),
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
  const [activeNavSection, setActiveNavSection] =
    useState<NavSectionId>("resumen");
  const [scanModalOpen, setScanModalOpen] = useState(false);
  const [scanInitialTab, setScanInitialTab] = useState<ScanModalTab>("camara");
  const [referencesOpen, setReferencesOpen] = useState(false);

  const handleNavigateSection = (section: NavSectionId) => {
    setActiveNavSection(section);
    if (typeof document !== "undefined") {
      const viewport = document.getElementById("section-viewport");
      if (viewport) {
        viewport.scrollTo({ top: 0, behavior: "smooth" });
      }
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
    handleNavigateSection("resumen");
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#f4f7fc] text-slate-900 md:flex-row">
      {/* Barra Lateral Izquierda */}
      <LeftNavSidebar
        activeSection={activeNavSection}
        emergencyMode={state.emergencyMode}
        onNavigate={handleNavigateSection}
        onOpenScanModal={() => handleOpenScanTab("camara")}
        onOpenReferences={() => setReferencesOpen(true)}
        onToggleEmergency={handleToggleEmergency}
      />

      {/* Contenedor Principal Bloqueado a Pantalla Completa (Sin scroll global de ventana) */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-telemetry-grid">
        {/* Barra Superior de Misión Fija */}
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

        {/* Visor de Sección Activa (Cambio exclusivo por barra lateral o flechas) */}
        <main
          id="section-viewport"
          onWheel={(e) => e.preventDefault()}
          className="mx-auto w-full max-w-[1600px] flex-1 overflow-hidden px-4 py-5 sm:px-6"
        >
          <div className="h-full space-y-5 overflow-hidden">
            {/* Alerta de Emergencia (visible en cualquier sección si está activa) */}
            <EmergencyBannerModal
              emergencyMode={state.emergencyMode}
              environmentId={state.environmentId}
              telemedicineEnabled={state.telemedicineEnabled}
              biomarkers={state.biomarkers}
              checklist={state.emergencyChecklist}
              onToggleStep={handleToggleEmergencyStep}
              onRestoreNominal={handleToggleEmergency}
            />

            {/* SECCIÓN 1: Resumen Ejecutivo + Reloj Astronauta vs Tierra */}
            {activeNavSection === "resumen" && (
              <div className="space-y-5">
                <MissionTimeSyncBar
                  environmentId={state.environmentId}
                  missionDay={state.missionDay}
                  telemedicineEnabled={state.telemedicineEnabled}
                />
                <OverviewBentoGrid
                  environmentId={state.environmentId}
                  biomarkers={state.biomarkers}
                  routine={state.routine}
                  zoneStatuses={zoneStatuses}
                  readinessScore={readinessScore}
                  history={state.history}
                  onSelectZoneAndScroll={handleSelectZoneAndScroll}
                  onOpenScanTab={handleOpenScanTab}
                  onOpenReferences={() => setReferencesOpen(true)}
                />
              </div>
            )}

            {/* SECCIÓN 2: Escáner Anatómico Interactivo (6 Sistemas) */}
            {activeNavSection === "escaner" && (
              <AnatomicalScanner
                selectedZone={selectedZone}
                onSelectZone={setSelectedZone}
                zoneStatuses={zoneStatuses}
                biomarkers={state.biomarkers}
                environmentId={state.environmentId}
                onOpenScanTab={handleOpenScanTab}
              />
            )}

            {/* SECCIÓN 3: Arnés Vestible CSA Bio-Monitor (13 Signos) */}
            {activeNavSection === "wearable" && (
              <WearableHarnessPanel
                environmentId={state.environmentId}
                biomarkers={state.biomarkers}
                onCalibrateOscillometric={handleCalibrateOscillometric}
                onSelectSystemZone={handleSelectZoneAndScroll}
              />
            )}

            {/* SECCIÓN 4: Biomarcadores, Salud Mental y Detector de Rutina */}
            {activeNavSection === "biomarcadores" && (
              <BiomarkersDashboard
                biomarkers={state.biomarkers}
                previousBiomarkers={state.previousBiomarkers}
                routine={state.routine}
                lastCameraFinding={state.lastCameraFinding}
                lastUltrasoundFinding={state.lastUltrasoundFinding}
                onSelectSystemZone={handleSelectZoneAndScroll}
                onOpenManualEdit={() => handleOpenScanTab("manual")}
                onJumpToWearable={() => handleNavigateSection("wearable")}
              />
            )}

            {/* SECCIÓN 5: Informes Recharts, Misiones de Acción y Bitácora Local */}
            {activeNavSection === "informes" && (
              <div className="space-y-5">
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

                {/* Bitácora Local de Autoevaluaciones */}
                <section className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-[0_6px_24px_rgba(15,23,42,0.04)] sm:p-5">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
                      <ClipboardList className="h-4 w-4 text-[#1a73e8]" />
                      Bitácora Local de Autoevaluaciones (Persistencia Offline)
                    </h3>
                    <span className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-700">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Guardado localmente en el dispositivo sin conexión externa
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
                    {state.scanLogs.slice(0, 4).map((log) => (
                      <div
                        key={log.id}
                        className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-xs"
                      >
                        <div className="flex items-center justify-between font-mono-hud text-[10px]">
                          <span className="font-semibold uppercase text-[#1a73e8]">
                            {log.modality}
                          </span>
                          <span className="text-slate-400">{log.timestamp}</span>
                        </div>
                        <p className="mt-1 line-clamp-2 text-slate-600">
                          {log.summary}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Control Flotante de Flechas Arriba / Abajo para cambiar entre secciones */}
      <SectionPagerControls
        activeSection={activeNavSection}
        onNavigate={handleNavigateSection}
      />

      {/* Modal Multimodal (Cámara / Ultrasonido / Manual) */}
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

      {/* Modal de Referencias Científicas NASA HRP & CSA */}
      <ScientificReferencesModal
        isOpen={referencesOpen}
        onClose={() => setReferencesOpen(false)}
      />
    </div>
  );
}