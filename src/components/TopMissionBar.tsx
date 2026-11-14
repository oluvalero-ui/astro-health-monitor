"use client";

import React from "react";
import {
  Activity,
  AlertTriangle,
  BookOpen,
  Compass,
  Gauge,
  Globe,
  Orbit,
  Radio,
  RotateCcw,
  Rocket,
  ScanLine,
  ShieldAlert,
  ShieldCheck,
  Wifi,
  WifiOff,
} from "lucide-react";
import { CSA_RADIATION_LIMITS, MISSION_ENVIRONMENTS } from "@/data/missionData";
import {
  HealthStatus,
  MissionEnvironmentId,
  SystemZoneId,
} from "@/types/astronaut";
import {
  evaluateRadiationStatus,
  getCareerRadiationPct,
  STATUS_HEX,
} from "@/utils/healthEngine";

interface TopMissionBarProps {
  environmentId: MissionEnvironmentId;
  telemedicineEnabled: boolean;
  missionDay: number;
  astronautName: string;
  crewRole: string;
  dailyRadiationMsv: number;
  cumulativeRadiationMsv: number;
  readinessScore: number;
  emergencyMode: boolean;
  zoneStatuses: Record<SystemZoneId, HealthStatus>;
  onSelectEnvironment: (envId: MissionEnvironmentId) => void;
  onToggleTelemedicine: () => void;
  onOpenScanModal: () => void;
  onToggleEmergency: () => void;
  onOpenReferences: () => void;
  onResetMission: () => void;
}

const ENV_ICONS: Record<MissionEnvironmentId, React.ReactNode> = {
  iss: <Orbit className="h-4 w-4" />,
  nave: <Rocket className="h-4 w-4" />,
  luna: <Globe className="h-4 w-4" />,
  marte: <Compass className="h-4 w-4" />,
};

export default function TopMissionBar({
  environmentId,
  telemedicineEnabled,
  missionDay,
  astronautName,
  crewRole,
  dailyRadiationMsv,
  cumulativeRadiationMsv,
  readinessScore,
  emergencyMode,
  zoneStatuses,
  onSelectEnvironment,
  onToggleTelemedicine,
  onOpenScanModal,
  onToggleEmergency,
  onOpenReferences,
  onResetMission,
}: TopMissionBarProps) {
  const currentEnv = MISSION_ENVIRONMENTS[environmentId];
  const radStatus = evaluateRadiationStatus(dailyRadiationMsv);
  const careerPct = getCareerRadiationPct(cumulativeRadiationMsv);

  const criticalCount = Object.values(zoneStatuses).filter(
    (s) => s === "critical"
  ).length;
  const warningCount = Object.values(zoneStatuses).filter(
    (s) => s === "warning"
  ).length;

  const isDelayedDeepSpace = currentEnv.commLatencySeconds > 60;
  const effectiveTelemedicineStatus = !telemedicineEnabled
    ? "Desconectado (Autonomía Local)"
    : isDelayedDeepSpace
    ? `Enlace Diferido (${currentEnv.commLatencyLabel})`
    : `Enlace Activo (${currentEnv.commLatencyLabel})`;

  return (
    <header
      className={`sticky top-0 z-30 border-b backdrop-blur-md transition-colors ${
        emergencyMode
          ? "border-red-500/70 bg-slate-950/95 shadow-lg shadow-red-950/40"
          : "border-slate-800 bg-slate-950/92"
      }`}
    >
      <div className="mx-auto max-w-[1600px] px-4 py-3 sm:px-6">
        {/* Top Row: Brand, Crew Info, Main Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-11 w-11 items-center justify-center rounded-xl border ${
                emergencyMode
                  ? "border-red-500 bg-red-500/20 text-red-400 animate-pulse"
                  : "border-cyan-500/40 bg-cyan-500/10 text-cyan-400"
              }`}
            >
              <Activity className="h-6 w-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-base font-bold tracking-wide text-slate-100 sm:text-lg">
                  ASTRO-MED <span className="text-cyan-400">HRP</span>
                </h1>
                <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-mono-hud text-[10px] font-semibold uppercase tracking-wider text-emerald-300">
                  100% Offline Local
                </span>
                <span className="rounded-full border border-slate-700 bg-slate-900 px-2 py-0.5 font-mono-hud text-[10px] text-slate-300">
                  Día de Misión {missionDay}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {astronautName} · <span className="text-slate-500">{crewRole}</span>
              </p>
            </div>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Readiness Pill */}
            <div className="hidden items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/90 px-3 py-1.5 xl:flex">
              <Gauge className="h-4 w-4 text-cyan-400" />
              <div className="text-xs">
                <span className="text-slate-400">Aptitud: </span>
                <span
                  className={`font-mono-hud font-bold ${
                    readinessScore >= 80
                      ? "text-emerald-400"
                      : readinessScore >= 55
                      ? "text-amber-400"
                      : "text-red-400"
                  }`}
                >
                  {readinessScore}%
                </span>
              </div>
              <span className="text-[11px] text-slate-500">|</span>
              <div className="flex items-center gap-1 text-[11px]">
                {criticalCount > 0 ? (
                  <span className="font-semibold text-red-400">
                    {criticalCount} Crítico(s)
                  </span>
                ) : warningCount > 0 ? (
                  <span className="font-semibold text-amber-400">
                    {warningCount} Precaución
                  </span>
                ) : (
                  <span className="font-semibold text-emerald-400">
                    6/6 Sistemas Óptimos
                  </span>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={onOpenScanModal}
              className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-cyan-400/50 bg-cyan-500/20 px-3.5 py-2 text-xs font-semibold text-cyan-200 transition hover:bg-cyan-500/30 active:scale-[0.98] sm:text-sm"
            >
              <ScanLine className="h-4 w-4 text-cyan-300" />
              Nueva Evaluación / Escaneo
            </button>

            <button
              type="button"
              onClick={onToggleEmergency}
              className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3.5 py-2 text-xs font-semibold transition active:scale-[0.98] sm:text-sm ${
                emergencyMode
                  ? "animate-emergency-glow border-red-400 bg-red-600 text-white hover:bg-red-500"
                  : "border-red-500/40 bg-red-500/15 text-red-300 hover:bg-red-500/25"
              }`}
            >
              {emergencyMode ? (
                <>
                  <ShieldCheck className="h-4 w-4" />
                  Restaurar Estado Nominal
                </>
              ) : (
                <>
                  <ShieldAlert className="h-4 w-4" />
                  Simular Emergencia (Demo Mode)
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onOpenReferences}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900/90 px-3 py-2 text-xs font-medium text-slate-200 transition hover:border-slate-600 hover:bg-slate-800"
            >
              <BookOpen className="h-4 w-4 text-indigo-400" />
              <span className="hidden sm:inline">Referencias NASA/CSA</span>
              <span className="sm:hidden">NASA/CSA</span>
            </button>

            <button
              type="button"
              onClick={onResetMission}
              title="Reiniciar datos locales a línea base de misión"
              className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-slate-800 bg-slate-900/90 p-2 text-slate-400 transition hover:border-slate-700 hover:text-slate-200"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Second Row: 4-Environment Selector + Telemedicine Switch + Live Physics HUD */}
        <div className="mt-3 flex flex-col gap-2.5 border-t border-slate-800/80 pt-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Mission Environment Selector */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Entorno de Misión:
            </span>
            {(Object.keys(MISSION_ENVIRONMENTS) as MissionEnvironmentId[]).map(
              (id) => {
                const env = MISSION_ENVIRONMENTS[id];
                const active = id === environmentId;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => onSelectEnvironment(id)}
                    className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition ${
                      active
                        ? "border-cyan-500/60 bg-cyan-500/20 text-cyan-200 shadow-sm shadow-cyan-950/50"
                        : "border-slate-800 bg-slate-900/80 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                    }`}
                  >
                    {ENV_ICONS[id]}
                    <span>{env.name}</span>
                  </button>
                );
              }
            )}
          </div>

          {/* Telemedicine Switch & Auto-Recalculated Telemetry Strip */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Switch Telemedicina en Tierra */}
            <button
              type="button"
              role="switch"
              aria-checked={telemedicineEnabled}
              onClick={onToggleTelemedicine}
              className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border px-2.5 py-1.5 transition ${
                telemedicineEnabled
                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
                  : "border-amber-500/40 bg-amber-500/10 text-amber-200"
              }`}
            >
              {telemedicineEnabled ? (
                <Wifi className="h-3.5 w-3.5 text-emerald-400" />
              ) : (
                <WifiOff className="h-3.5 w-3.5 text-amber-400" />
              )}
              <span className="font-medium">Telemedicina en Tierra:</span>
              <span
                className={`rounded px-1.5 py-0.5 font-mono-hud text-[10px] font-bold ${
                  telemedicineEnabled
                    ? "bg-emerald-500/25 text-emerald-300"
                    : "bg-amber-500/25 text-amber-300"
                }`}
              >
                {telemedicineEnabled ? "ON" : "OFF"}
              </span>
            </button>

            {/* Gravity Pill */}
            <div className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/90 px-2.5 py-1.5">
              <span className="text-slate-400">Gravedad:</span>
              <span className="font-mono-hud font-semibold text-cyan-300">
                {currentEnv.gravityLabel}
              </span>
            </div>

            {/* CSA Radiation Pill */}
            <div className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/90 px-2.5 py-1.5">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: STATUS_HEX[radStatus] }}
              />
              <span className="text-slate-400">Radiación CSA:</span>
              <span className="font-mono-hud font-semibold text-slate-100">
                {dailyRadiationMsv.toFixed(2)} mSv/d
              </span>
              <span className="hidden font-mono-hud text-[11px] text-slate-400 sm:inline">
                ({cumulativeRadiationMsv.toFixed(1)}/{CSA_RADIATION_LIMITS.careerLimitMsv} mSv · {careerPct}%)
              </span>
            </div>

            {/* Earth Comm Latency Pill */}
            <div className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/90 px-2.5 py-1.5">
              <Radio
                className={`h-3.5 w-3.5 ${
                  !telemedicineEnabled
                    ? "text-slate-500"
                    : isDelayedDeepSpace
                    ? "text-red-400"
                    : "text-emerald-400"
                }`}
              />
              <span className="text-slate-400">Enlace Tierra:</span>
              <span className="font-mono-hud font-medium text-slate-200">
                {effectiveTelemedicineStatus}
              </span>
            </div>
          </div>
        </div>

        {/* Dynamic Environment Alerts Strip */}
        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-medium text-slate-400">
            {currentEnv.agencyProgram}:
          </span>
          {currentEnv.alerts.map((alert) => (
            <div
              key={alert.id}
              title={alert.detail}
              className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] ${
                alert.severity === "critical"
                  ? "border-red-500/40 bg-red-500/10 text-red-300"
                  : alert.severity === "warning"
                  ? "border-amber-500/35 bg-amber-500/10 text-amber-300"
                  : "border-emerald-500/35 bg-emerald-500/10 text-emerald-300"
              }`}
            >
              <AlertTriangle className="h-3 w-3 shrink-0" />
              <span className="font-semibold">{alert.title}:</span>
              <span className="hidden text-slate-300 md:inline">
                {alert.detail}
              </span>
            </div>
          ))}
        </div>
      </div>
    </header>
  );
}
