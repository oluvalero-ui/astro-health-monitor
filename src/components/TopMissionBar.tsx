"use client";

import React, { useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Compass,
  Globe,
  Orbit,
  Radio,
  Rocket,
  RotateCcw,
  ScanLine,
  ShieldAlert,
  ShieldCheck,
  Volume2,
  VolumeX,
} from "lucide-react";
import { MISSION_ENVIRONMENTS } from "@/data/missionData";
import {
  BiomarkerData,
  HealthStatus,
  MissionEnvironmentId,
  SystemZoneId,
} from "@/types/astronaut";

interface TopMissionBarProps {
  environmentId: MissionEnvironmentId;
  telemedicineEnabled: boolean;
  missionDay: number;
  astronautName: string;
  dailyRadiationMsv: number;
  readinessScore: number;
  emergencyMode: boolean;
  zoneStatuses: Record<SystemZoneId, HealthStatus>;
  biomarkers?: BiomarkerData;
  onSelectEnvironment: (envId: MissionEnvironmentId) => void;
  onToggleTelemedicine: () => void;
  onOpenScanModal: () => void;
  onInspectProtocol: (zone: SystemZoneId) => void;
  onResetMission: () => void;
}

const ZONE_FRIENDLY_NAMES: Record<SystemZoneId, string> = {
  cerebro: "Mente y Descanso",
  rostro: "Rostro y Postura",
  corazon: "Corazón y Aire",
  endocrino: "Defensas y Sueño",
  abdomen: "Agua y Energía",
  musculo: "Músculos y Huesos",
};

const ENV_SHORT_LABELS: Record<MissionEnvironmentId, string> = {
  iss: "Estación (0g)",
  nave: "Viaje (0g)",
  luna: "Luna (0.16g)",
  marte: "Marte (0.38g)",
};

const ENV_ICONS: Record<MissionEnvironmentId, React.ReactNode> = {
  iss: <Orbit className="h-3.5 w-3.5" />,
  nave: <Rocket className="h-3.5 w-3.5" />,
  luna: <Globe className="h-3.5 w-3.5" />,
  marte: <Compass className="h-3.5 w-3.5" />,
};

export default function TopMissionBar({
  environmentId,
  telemedicineEnabled,
  missionDay,
  astronautName,
  dailyRadiationMsv,
  readinessScore,
  emergencyMode,
  zoneStatuses,
  biomarkers,
  onSelectEnvironment,
  onToggleTelemedicine,
  onOpenScanModal,
  onInspectProtocol,
  onResetMission,
}: TopMissionBarProps) {
  const env = MISSION_ENVIRONMENTS[environmentId];
  const [utcTime, setUtcTime] = useState<string>("08:42:19 UTC");
  const [speaking, setSpeaking] = useState(false);

  const criticalZones = (
    Object.entries(zoneStatuses) as [SystemZoneId, HealthStatus][]
  )
    .filter(([, status]) => status === "critical")
    .map(([zone]) => zone);

  const warningZones = (
    Object.entries(zoneStatuses) as [SystemZoneId, HealthStatus][]
  )
    .filter(([, status]) => status === "warning")
    .map(([zone]) => zone);

  const overallRiskStatus: HealthStatus =
    emergencyMode || criticalZones.length > 0
      ? "critical"
      : warningZones.length > 0
      ? "warning"
      : "optimal";

  const isLowLatency = env.commLatencySeconds < 60;
  const primaryCriticalZone: SystemZoneId = criticalZones[0] ?? "corazon";
  const primaryWarningZone: SystemZoneId = warningZones[0] ?? "cerebro";

  useEffect(() => {
    const updateClock = () => {
      setUtcTime(`${new Date().toISOString().slice(11, 19)} UTC`);
    };
    updateClock();
    const timer = window.setInterval(updateClock, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const handleVoiceBriefing = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    const criticalCount = Object.values(zoneStatuses).filter(
      (s) => s === "critical"
    ).length;
    const text = biomarkers
      ? `Resumen de salud para ${astronautName}, día ${missionDay} en ${env.shortName}. Tu bienestar general está al ${readinessScore} por ciento. Tu corazón late a ${biomarkers.bpm} por minuto, tu oxígeno está al ${biomarkers.spo2Percent} por ciento, tu presión es ${biomarkers.systolicBP} sobre ${biomarkers.diastolicBP}, y el escudo de radiación marca ${dailyRadiationMsv.toFixed(2)} por día. ${criticalCount > 0 ? `Atención: hay ${criticalCount} zona que necesita cuidado urgente.` : "Todo tu cuerpo está en buen estado."}`
      : `Resumen de salud. Día ${missionDay}, bienestar general ${readinessScore} por ciento.`;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "es-ES";
    utterance.rate = 1.03;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <header
      className={`border-b bg-[#050a14] text-white transition-colors ${
        overallRiskStatus === "critical"
          ? "border-red-500 bg-red-950/90"
          : overallRiskStatus === "warning"
          ? "border-amber-500/60 bg-[#050a14]"
          : "border-[#182742]"
      }`}
    >
      <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-2.5 px-4 py-2.5 sm:px-6">
        {/* Left: Brand + Crew + Environment Switcher */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span
              className={`flex h-8 w-8 items-center justify-center rounded-lg border ${
                overallRiskStatus === "critical"
                  ? "animate-pulse border-red-400 bg-red-600 text-white"
                  : overallRiskStatus === "warning"
                  ? "border-amber-400/50 bg-amber-500/20 text-amber-300"
                  : "border-sky-400/40 bg-sky-500/20 text-sky-300"
              }`}
            >
              <Activity className="h-4 w-4" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono-hud text-sm font-bold tracking-wider text-slate-100">
                  ASTRO-MED <span className="text-sky-400">SALUD</span>
                </span>
                <span className="rounded border border-sky-500/30 bg-sky-500/10 px-1.5 py-0.5 font-mono-hud text-[10px] font-semibold text-sky-300">
                  DÍA {missionDay}
                </span>
              </div>
              <div className="text-[11px] text-slate-400">
                {astronautName} · Monitoreo fácil en vivo
              </div>
            </div>
          </div>

          <span className="hidden h-5 w-px bg-[#182742] lg:inline-block" />

          {/* Compact Segmented Environment Selector */}
          <div className="flex flex-wrap items-center gap-1 rounded-xl border border-[#182742] bg-[#091120] p-1">
            {(Object.keys(MISSION_ENVIRONMENTS) as MissionEnvironmentId[]).map(
              (id) => {
                const isActive = id === environmentId;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => onSelectEnvironment(id)}
                    className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition ${
                      isActive
                        ? "border border-sky-400/40 bg-sky-500/20 text-sky-300 shadow-xs"
                        : "text-slate-400 hover:bg-[#111e36] hover:text-slate-100"
                    }`}
                  >
                    {ENV_ICONS[id]}
                    <span>{ENV_SHORT_LABELS[id]}</span>
                  </button>
                );
              }
            )}
          </div>

          {/* Inline Physics Readout */}
          <div className="hidden items-center gap-3 font-mono-hud text-[11px] text-blue-100/85 xl:flex">
            <span>{env.gravityLabel.split(" ")[0]}</span>
            <span className="text-white/25">·</span>
            <button
              type="button"
              onClick={onToggleTelemedicine}
              className="cursor-pointer hover:text-white"
              title="Cambiar conexión con médicos en Tierra"
            >
              Tierra:{" "}
              <strong
                className={
                  telemedicineEnabled ? "text-emerald-300" : "text-amber-300"
                }
              >
                {telemedicineEnabled ? env.commLatencyLabel.split(" ")[0] : "SIN SEÑAL (LOCAL)"}
              </strong>
            </button>
          </div>
        </div>

        {/* Right: UTC Clock + Operational Console Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="hidden rounded-lg border border-white/10 bg-slate-950/40 px-2.5 py-1 font-mono-hud text-xs font-semibold text-cyan-300 sm:inline-block">
            {utcTime}
          </span>

          <button
            type="button"
            onClick={handleVoiceBriefing}
            className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition ${
              speaking
                ? "border-cyan-400 bg-cyan-500 text-slate-950"
                : "border-white/15 bg-white/10 text-white hover:bg-white/20"
            }`}
            title="Escuchar un resumen hablado y sencillo de cómo estás hoy"
          >
            {speaking ? (
              <>
                <VolumeX className="h-3.5 w-3.5" />
                <span>Callar Voz</span>
              </>
            ) : (
              <>
                <Volume2 className="h-3.5 w-3.5 text-cyan-300" />
                <span>Escuchar Resumen</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onOpenScanModal}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-[#1a73e8] px-3 py-1.5 text-xs font-bold text-white transition hover:bg-blue-600"
          >
            <ScanLine className="h-3.5 w-3.5" />
            <span>Revisar / Ajustar</span>
          </button>

          {/* Indicador Clínico Automático de Nivel de Peligro */}
          {overallRiskStatus === "optimal" && (
            <div
              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/35 bg-emerald-500/10 px-2.5 py-1.5 text-xs font-semibold text-emerald-300"
              title="Detección automática: todos los signos dentro de rango seguro"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              <span>Estado: Normal</span>
            </div>
          )}

          {overallRiskStatus === "warning" && (
            <button
              type="button"
              onClick={() => onInspectProtocol(primaryWarningZone)}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-amber-400/60 bg-amber-500/20 px-3 py-1.5 text-xs font-bold text-amber-300 transition hover:bg-amber-500/30"
              title="Parámetros en precaución detectados automáticamente"
            >
              <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
              <span>Precaución ({warningZones.length})</span>
            </button>
          )}

          {overallRiskStatus === "critical" && (
            <button
              type="button"
              onClick={() => onInspectProtocol(primaryCriticalZone)}
              className="inline-flex animate-pulse cursor-pointer items-center gap-1.5 rounded-lg border border-red-400 bg-red-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-red-700"
              title="Nivel crítico detectado automáticamente"
            >
              <ShieldAlert className="h-3.5 w-3.5" />
              <span>Peligro Crítico ({Math.max(1, criticalZones.length)})</span>
            </button>
          )}

          <button
            type="button"
            onClick={onResetMission}
            title="Reiniciar misión a valores nominales"
            className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-white/15 bg-white/5 p-1.5 text-blue-200 transition hover:bg-white/15 hover:text-white"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Banner Automático en Estado Precaución (Warning) */}
      {overallRiskStatus === "warning" && (
        <div
          role="status"
          className="border-t border-amber-500/40 bg-amber-500/10 px-4 py-2 text-xs text-amber-200 sm:px-6"
        >
          <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
              <span>
                <strong className="text-amber-300">
                  Alerta Preventiva Automática:
                </strong>{" "}
                Se detectaron parámetros en precaución en{" "}
                <strong>
                  {warningZones.map((z) => ZONE_FRIENDLY_NAMES[z]).join(", ")}
                </strong>{" "}
                que requieren revisión temprana.
              </span>
            </div>
            <button
              type="button"
              onClick={() => onInspectProtocol(primaryWarningZone)}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-amber-400/50 bg-amber-500/20 px-2.5 py-1 text-[11px] font-bold text-amber-200 transition hover:bg-amber-500/30"
            >
              <ScanLine className="h-3.5 w-3.5" />
              Revisar Protocolo en Escáner
            </button>
          </div>
        </div>
      )}

      {/* Banner Automático Prioritario en Estado Muy Peligroso / Crítico */}
      {overallRiskStatus === "critical" && (
        <div
          role="alert"
          className="border-t border-red-500/60 bg-red-950/95 px-4 py-2.5 text-xs text-red-100 sm:px-6"
        >
          <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
              <div className="space-y-0.5">
                <div>
                  <strong className="text-red-300">
                    ALERTA CLÍNICA CRÍTICA AUTOMÁTICA (
                    {criticalZones.length > 0
                      ? criticalZones.map((z) => ZONE_FRIENDLY_NAMES[z]).join(", ")
                      : "Riesgo General"}
                    ):
                  </strong>{" "}
                  Se recomienda <strong>contactar a un médico de vuelo de inmediato</strong>.
                </div>
                <div className="text-[11px] text-red-200/90">
                  {isLowLatency && telemedicineEnabled
                    ? `Enlace de baja latencia activo (${env.commLatencyLabel}): comunica tus lecturas al Cirujano de Vuelo ahora mismo.`
                    : `Si no puedes comunicarte con Tierra (${env.commLatencyLabel} o sin señal), consulta de inmediato las recomendaciones autónomas en la vista "Escáner → 1. Protocolo de Examen y Acción".`}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {isLowLatency && !telemedicineEnabled && (
                <button
                  type="button"
                  onClick={onToggleTelemedicine}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-emerald-400/50 bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white transition hover:bg-emerald-500"
                >
                  <Radio className="h-3.5 w-3.5" />
                  Activar Enlace Médico ({env.commLatencyLabel.split(" ")[0]})
                </button>
              )}
              <button
                type="button"
                onClick={() => onInspectProtocol(primaryCriticalZone)}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-red-300/60 bg-red-600 px-3 py-1 text-[11px] font-bold text-white transition hover:bg-red-500"
              >
                <ScanLine className="h-3.5 w-3.5" />
                Ir a Protocolo y Recomendaciones Autónomas (Escáner)
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
