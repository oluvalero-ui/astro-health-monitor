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
      className={`relative border-b bg-white transition-colors ${
        emergencyMode
          ? "border-red-300 shadow-sm shadow-red-100"
          : "border-slate-200/90"
      }`}
    >
      <div className="mx-auto max-w-[1600px] px-4 py-3.5 sm:px-6">
        {/* Top Row: Brand, Crew Info, Main Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-11 w-11 items-center justify-center rounded-xl border ${
                emergencyMode
                  ? "animate-pulse border-red-300 bg-red-600 text-white"
                  : "border-blue-600/20 bg-[#1a73e8] text-white shadow-sm shadow-blue-600/25"
              }`}
            >
              <Activity className="h-6 w-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-base font-bold tracking-tight text-slate-900 sm:text-lg">
                  ASTRO-MED <span className="text-[#1a73e8]">HRP</span>
                </h1>
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 font-mono-hud text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
                  100% Offline Local
                </span>
                <span className="rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 font-mono-hud text-[10px] font-medium text-slate-600">
                  Día de Misión {missionDay}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {astronautName} · <span className="text-slate-400">{crewRole}</span>
              </p>
            </div>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Readiness Pill */}
            <div className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 xl:flex">
              <Gauge className="h-4 w-4 text-[#1a73e8]" />
              <div className="text-xs">
                <span className="text-slate-500">Aptitud: </span>
                <span
                  className={`font-mono-hud font-bold ${
                    readinessScore >= 80
                      ? "text-emerald-600"
                      : readinessScore >= 55
                      ? "text-amber-600"
                      : "text-red-600"
                  }`}
                >
                  {readinessScore}%
                </span>
              </div>
              <span className="text-[11px] text-slate-300">|</span>
              <div className="flex items-center gap-1 text-[11px]">
                {criticalCount > 0 ? (
                  <span className="font-semibold text-red-600">
                    {criticalCount} Crítico(s)
                  </span>
                ) : warningCount > 0 ? (
                  <span className="font-semibold text-amber-600">
                    {warningCount} Precaución
                  </span>
                ) : (
                  <span className="font-semibold text-emerald-600">
                    6/6 Sistemas Óptimos
                  </span>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={onOpenScanModal}
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#1a73e8] px-3.5 py-2 text-xs font-semibold text-white shadow-sm shadow-blue-600/20 transition hover:bg-blue-700 active:scale-[0.98] sm:text-sm"
            >
              <ScanLine className="h-4 w-4" />
              Nueva Evaluación / Escaneo
            </button>

            <button
              type="button"
              onClick={onToggleEmergency}
              className={`inline-flex cursor-pointer items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-semibold transition active:scale-[0.98] sm:text-sm ${
                emergencyMode
                  ? "animate-emergency-glow border-red-600 bg-red-600 text-white hover:bg-red-700"
                  : "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
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
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
            >
              <BookOpen className="h-4 w-4 text-[#1a73e8]" />
              <span className="hidden sm:inline">Referencias NASA/CSA</span>
              <span className="sm:hidden">NASA/CSA</span>
            </button>

            <button
              type="button"
              onClick={onResetMission}
              title="Reiniciar datos locales a línea base de misión"
              className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white p-2 text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Second Row: 4-Environment Selector + Telemedicine Switch + Live Physics HUD */}
        <div className="mt-3 flex flex-col gap-2.5 border-t border-slate-100 pt-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Mission Environment Selector */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
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
                    className={`inline-flex cursor-pointer items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium transition ${
                      active
                        ? "border-[#1a73e8] bg-[#1a73e8] text-white shadow-sm"
                        : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-white hover:text-slate-900"
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
              className={`inline-flex cursor-pointer items-center gap-2 rounded-xl border px-2.5 py-1.5 transition ${
                telemedicineEnabled
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-amber-200 bg-amber-50 text-amber-800"
              }`}
            >
              {telemedicineEnabled ? (
                <Wifi className="h-3.5 w-3.5 text-emerald-600" />
              ) : (
                <WifiOff className="h-3.5 w-3.5 text-amber-600" />
              )}
              <span className="font-medium">Telemedicina en Tierra:</span>
              <span
                className={`rounded-md px-1.5 py-0.5 font-mono-hud text-[10px] font-bold ${
                  telemedicineEnabled
                    ? "bg-emerald-600 text-white"
                    : "bg-amber-600 text-white"
                }`}
              >
                {telemedicineEnabled ? "ON" : "OFF"}
              </span>
            </button>

            {/* Gravity Pill */}
            <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5">
              <span className="text-slate-500">Gravedad:</span>
              <span className="font-mono-hud font-semibold text-[#1a73e8]">
                {currentEnv.gravityLabel}
              </span>
            </div>

            {/* CSA Radiation Pill */}
            <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: STATUS_HEX[radStatus] }}
              />
              <span className="text-slate-500">Radiación CSA:</span>
              <span className="font-mono-hud font-semibold text-slate-900">
                {dailyRadiationMsv.toFixed(2)} mSv/d
              </span>
              <span className="hidden font-mono-hud text-[11px] text-slate-500 sm:inline">
                ({cumulativeRadiationMsv.toFixed(1)}/{CSA_RADIATION_LIMITS.careerLimitMsv} mSv · {careerPct}%)
              </span>
            </div>

            {/* Earth Comm Latency Pill */}
            <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5">
              <Radio
                className={`h-3.5 w-3.5 ${
                  !telemedicineEnabled
                    ? "text-slate-400"
                    : isDelayedDeepSpace
                    ? "text-red-500"
                    : "text-emerald-600"
                }`}
              />
              <span className="text-slate-500">Enlace Tierra:</span>
              <span className="font-mono-hud font-medium text-slate-700">
                {effectiveTelemedicineStatus}
              </span>
            </div>
          </div>
        </div>

        {/* Dynamic Environment Alerts Strip */}
        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-medium text-slate-500">
            {currentEnv.agencyProgram}:
          </span>
          {currentEnv.alerts.map((alert) => (
            <div
              key={alert.id}
              title={alert.detail}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] ${
                alert.severity === "critical"
                  ? "border-red-200 bg-red-50 text-red-700"
                  : alert.severity === "warning"
                  ? "border-amber-200 bg-amber-50 text-amber-800"
                  : "border-emerald-200 bg-emerald-50 text-emerald-800"
              }`}
            >
              <AlertTriangle className="h-3 w-3 shrink-0" />
              <span className="font-semibold">{alert.title}:</span>
              <span className="hidden text-slate-600 md:inline">
                {alert.detail}
              </span>
            </div>
          ))}
        </div>
      </div>
    </header>
  );
}
