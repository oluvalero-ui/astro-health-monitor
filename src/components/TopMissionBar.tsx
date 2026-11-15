"use client";

import React, { useEffect, useState } from "react";
import {
  Activity,
  Compass,
  Download,
  Globe,
  Orbit,
  Rocket,
  RotateCcw,
  ScanLine,
  ShieldAlert,
  ShieldCheck,
  Volume2,
  VolumeX,
} from "lucide-react";
import { CSA_RADIATION_LIMITS, MISSION_ENVIRONMENTS } from "@/data/missionData";
import {
  BiomarkerData,
  HealthStatus,
  MissionEnvironmentId,
  RoutineTracking,
  SystemZoneId,
} from "@/types/astronaut";

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
  biomarkers?: BiomarkerData;
  routine?: RoutineTracking;
  onSelectEnvironment: (envId: MissionEnvironmentId) => void;
  onToggleTelemedicine: () => void;
  onOpenScanModal: () => void;
  onToggleEmergency: () => void;
  onOpenReferences: () => void;
  onResetMission: () => void;
}

const ENV_SHORT_LABELS: Record<MissionEnvironmentId, string> = {
  iss: "ISS (0g)",
  nave: "Tránsito (0g)",
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
  cumulativeRadiationMsv,
  readinessScore,
  emergencyMode,
  zoneStatuses,
  biomarkers,
  routine,
  onSelectEnvironment,
  onToggleTelemedicine,
  onOpenScanModal,
  onToggleEmergency,
  onResetMission,
}: TopMissionBarProps) {
  const env = MISSION_ENVIRONMENTS[environmentId];
  const [utcTime, setUtcTime] = useState<string>("08:42:19 UTC");
  const [speaking, setSpeaking] = useState(false);

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
      ? `Consola ASTRO-MED. ${astronautName}, Sol ${missionDay} en ${env.shortName}. Aptitud operativa ${readinessScore} por ciento. Frecuencia cardíaca ${biomarkers.bpm} latidos por minuto, saturación ${biomarkers.spo2Percent} por ciento, presión ${biomarkers.systolicBP} sobre ${biomarkers.diastolicBP}, radiación ${dailyRadiationMsv.toFixed(2)} milisieverts por día. ${criticalCount > 0 ? `Alerta: ${criticalCount} sistema en estado crítico.` : "Sistemas nominales."}`
      : `Consola ASTRO-MED. Sol ${missionDay}, aptitud ${readinessScore} por ciento.`;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "es-ES";
    utterance.rate = 1.03;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleDownloadDtn = () => {
    const payload = {
      protocol: "NASA-DTN-TELEMETRY-V2",
      timestampUtc: new Date().toISOString(),
      missionDay,
      astronautName,
      environment: {
        id: env.id,
        name: env.name,
        gravityG: env.gravityG,
        latencySec: env.commLatencySeconds,
      },
      readinessScore,
      zoneStatuses,
      biomarkers,
      routine,
      radiationCsa: {
        instrument: CSA_RADIATION_LIMITS.instrumentName,
        dailyMsv: dailyRadiationMsv,
        cumulativeMsv: cumulativeRadiationMsv,
      },
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ASTROMED-SOL${missionDay}-${env.id.toUpperCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <header
      className={`border-b bg-[#050a14] text-white transition-colors ${
        emergencyMode ? "border-red-500 bg-red-950" : "border-[#182742]"
      }`}
    >
      <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-2.5 px-4 py-2.5 sm:px-6">
        {/* Left: Brand + Crew + Environment Switcher */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span
              className={`flex h-8 w-8 items-center justify-center rounded-lg border ${
                emergencyMode
                  ? "animate-pulse border-red-400 bg-red-600 text-white"
                  : "border-sky-400/40 bg-sky-500/20 text-sky-300"
              }`}
            >
              <Activity className="h-4 w-4" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono-hud text-sm font-bold tracking-wider text-slate-100">
                  ASTRO-MED <span className="text-sky-400">HRP</span>
                </span>
                <span className="rounded border border-sky-500/30 bg-sky-500/10 px-1.5 py-0.5 font-mono-hud text-[10px] font-semibold text-sky-300">
                  SOL {missionDay}
                </span>
              </div>
              <div className="text-[11px] text-slate-400">{astronautName}</div>
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
              title="Conmutar enlace de telemedicina con Tierra"
            >
              Enlace:{" "}
              <strong
                className={
                  telemedicineEnabled ? "text-emerald-300" : "text-amber-300"
                }
              >
                {telemedicineEnabled ? env.commLatencyLabel.split(" ")[0] : "AUTÓNOMO"}
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
            title="Asistente manos libres: lee signos vitales en voz alta (0g)"
          >
            {speaking ? (
              <>
                <VolumeX className="h-3.5 w-3.5" />
                <span>Silenciar Voz</span>
              </>
            ) : (
              <>
                <Volume2 className="h-3.5 w-3.5 text-cyan-300" />
                <span>Voz 0g</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleDownloadDtn}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-white/15 bg-white/10 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-white/20"
            title="Descargar paquete clínico comprimido JSON (Delay-Tolerant Networking)"
          >
            <Download className="h-3.5 w-3.5 text-emerald-300" />
            <span className="hidden md:inline">Paquete DTN</span>
          </button>

          <button
            type="button"
            onClick={onOpenScanModal}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-[#1a73e8] px-3 py-1.5 text-xs font-bold text-white transition hover:bg-blue-600"
          >
            <ScanLine className="h-3.5 w-3.5" />
            <span>Capturar / Manual</span>
          </button>

          <button
            type="button"
            onClick={onToggleEmergency}
            className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
              emergencyMode
                ? "animate-pulse bg-emerald-600 text-white hover:bg-emerald-700"
                : "bg-red-600 text-white hover:bg-red-700"
            }`}
          >
            {emergencyMode ? (
              <>
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Restaurar</span>
              </>
            ) : (
              <>
                <ShieldAlert className="h-3.5 w-3.5" />
                <span>SOS</span>
              </>
            )}
          </button>

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
    </header>
  );
}
