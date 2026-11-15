"use client";

import React from "react";
import {
  Activity,
  Gauge,
  HeartPulse,
  ShieldCheck,
  Thermometer,
  Wind,
} from "lucide-react";
import { BiomarkerData, HealthStatus, SystemZoneId } from "@/types/astronaut";
import {
  evaluateBpStatus,
  evaluateBpmStatus,
  evaluateMinuteVentilationStatus,
  evaluatePerfusionIndexStatus,
  evaluateRadiationStatus,
  evaluateRespiratoryRateStatus,
  evaluateSkinTempStatus,
  evaluateSpo2Status,
  evaluateTempStatus,
  worstStatus,
} from "@/utils/healthEngine";
import { StatusPill } from "@/components/ui/StatusPill";
import LivePhysioWaveform from "./LivePhysioWaveform";

interface PrimaryVitalsStripProps {
  biomarkers: BiomarkerData;
  readinessScore: number;
  cabinCo2MmHg: number;
  onSelectZone: (zone: SystemZoneId) => void;
  onOpenWearable: () => void;
}

const BORDER_BY_STATUS: Record<HealthStatus, string> = {
  optimal: "border-[#1b2d4b] hover:border-sky-400/60",
  warning: "border-amber-500/80 bg-amber-950/20",
  critical: "border-red-500 bg-red-950/30 animate-emergency-glow",
};

function getVitalDisplayColor(status: HealthStatus, nominalColor: string): string {
  if (status === "critical") return "#f87171";
  if (status === "warning") return "#fbbf24";
  return nominalColor;
}

export default function PrimaryVitalsStrip({
  biomarkers: b,
  onSelectZone,
  onOpenWearable,
}: PrimaryVitalsStripProps) {
  const hrStatus = evaluateBpmStatus(b.bpm);
  const spo2Status = worstStatus([
    evaluateSpo2Status(b.spo2Percent),
    evaluatePerfusionIndexStatus(b.perfusionIndex),
  ]);
  const bpStatus = evaluateBpStatus(b.systolicBP, b.diastolicBP);
  const respStatus = worstStatus([
    evaluateRespiratoryRateStatus(b.respiratoryRateRpm),
    evaluateMinuteVentilationStatus(b.minuteVentilationLpm),
  ]);
  const tempStatus = worstStatus([
    evaluateTempStatus(b.bodyTempC),
    evaluateSkinTempStatus(b.skinTempC),
  ]);
  const radStatus = evaluateRadiationStatus(b.dailyRadiationMsv);

  const hrColor = getVitalDisplayColor(hrStatus, "#22c55e");
  const spo2Color = getVitalDisplayColor(spo2Status, "#38bdf8");
  const bpColor = getVitalDisplayColor(bpStatus, "#f8fafc");
  const bpWaveColor = getVitalDisplayColor(bpStatus, "#38bdf8");
  const respColor = getVitalDisplayColor(respStatus, "#2dd4bf");
  const tempColor = getVitalDisplayColor(tempStatus, "#38bdf8");
  const radColor = getVitalDisplayColor(radStatus, "#34d399");

  const radShieldPercent = Math.max(
    10,
    Math.min(100, Math.round(100 - (b.dailyRadiationMsv / 2.2) * 100))
  );

  const hrSimpleText =
    hrStatus === "optimal"
      ? "Ritmo tranquilo y parejo"
      : hrStatus === "warning"
      ? "Latidos algo rápidos, respira lento"
      : "Corazón muy acelerado, siéntate";

  const spo2SimpleText =
    spo2Status === "optimal"
      ? "Llega suficiente aire a tu cuerpo"
      : spo2Status === "warning"
      ? "Un poco bajo, respira profundo"
      : "Falta aire, revisa tu oxígeno";

  const bpSimpleText =
    bpStatus === "optimal"
      ? "La sangre circula con fuerza normal"
      : bpStatus === "warning"
      ? "Presión algo alta, haz una pausa"
      : "Presión fuera de rango, descansa";

  const respSimpleText =
    respStatus === "optimal"
      ? "Respiración calmada y sin esfuerzo"
      : respStatus === "warning"
      ? "Respiras rápido, relaja los hombros"
      : "Cuesta respirar, pide apoyo";

  const tempSimpleText =
    tempStatus === "optimal"
      ? "Calor del cuerpo normal, sin fiebre"
      : tempStatus === "warning"
      ? "Cuerpo algo caliente, toma agua y descansa"
      : "Fiebre o calor alto, revisa el protocolo";

  const radSimpleText =
    radStatus === "optimal"
      ? "Nivel seguro dentro de la nave"
      : radStatus === "warning"
      ? "Radiación media, evita salir hoy"
      : "Radiación alta, ve a zona protegida";

  return (
    <section
      aria-label="Tus 6 signos principales en tiempo real"
      className="grid grid-cols-2 gap-2.5 lg:grid-cols-6"
    >
      {/* 1. Frecuencia Cardíaca (ECG) */}
      <button
        type="button"
        onClick={() => onSelectZone("corazon")}
        className={`group flex cursor-pointer flex-col justify-between rounded-xl border bg-[#091120] p-3 text-left transition ${BORDER_BY_STATUS[hrStatus]}`}
      >
        <div className="flex items-center justify-between gap-1">
          <span className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
            <HeartPulse className="h-3.5 w-3.5 shrink-0" style={{ color: hrColor }} />
            Frec. Cardíaca (ECG)
          </span>
          <StatusPill status={hrStatus} />
        </div>

        <div className="my-0.5 flex items-baseline justify-between gap-1">
          <span
            className="font-mono-hud text-2xl font-bold tracking-tight sm:text-3xl"
            style={{ color: hrColor }}
          >
            {b.bpm}
          </span>
          <span className="text-[11px] font-medium text-slate-400">
            lat/min · HRV {b.hrvRmssdMs}ms
          </span>
        </div>

        <LivePhysioWaveform
          mode="ecg"
          color={hrColor}
          bpm={b.bpm}
          hrvMs={b.hrvRmssdMs}
          heightClass="h-6"
        />

        <p className="mt-1 truncate text-[11px] text-slate-300">
          {hrSimpleText}
        </p>
      </button>

      {/* 2. Saturación Arterial (SpO₂) */}
      <button
        type="button"
        onClick={onOpenWearable}
        className={`group flex cursor-pointer flex-col justify-between rounded-xl border bg-[#091120] p-3 text-left transition ${BORDER_BY_STATUS[spo2Status]}`}
      >
        <div className="flex items-center justify-between gap-1">
          <span className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
            <Activity className="h-3.5 w-3.5 shrink-0" style={{ color: spo2Color }} />
            Saturación (SpO₂)
          </span>
          <StatusPill status={spo2Status} />
        </div>

        <div className="my-0.5 flex items-baseline justify-between gap-1">
          <span
            className="font-mono-hud text-2xl font-bold tracking-tight sm:text-3xl"
            style={{ color: spo2Color }}
          >
            {b.spo2Percent}%
          </span>
          <span className="text-[11px] font-medium text-slate-400">
            PI {b.perfusionIndex.toFixed(1)}%
          </span>
        </div>

        <LivePhysioWaveform
          mode="ppg"
          color={spo2Color}
          bpm={b.bpm}
          pttMs={b.pttMs}
          heightClass="h-6"
        />

        <p className="mt-1 truncate text-[11px] text-slate-300">
          {spo2SimpleText}
        </p>
      </button>

      {/* 3. Presión Arterial Óptica (PTT) */}
      <button
        type="button"
        onClick={() => onSelectZone("corazon")}
        className={`group flex cursor-pointer flex-col justify-between rounded-xl border bg-[#091120] p-3 text-left transition ${BORDER_BY_STATUS[bpStatus]}`}
      >
        <div className="flex items-center justify-between gap-1">
          <span className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
            <Gauge className="h-3.5 w-3.5 shrink-0 text-sky-400" />
            Presión Óptica (PTT)
          </span>
          <StatusPill status={bpStatus} />
        </div>

        <div className="my-0.5 flex items-baseline justify-between gap-1">
          <span
            className="font-mono-hud text-2xl font-bold tracking-tight sm:text-3xl"
            style={{ color: bpColor }}
          >
            {b.systolicBP}/{b.diastolicBP}
          </span>
          <span className="text-[11px] font-medium text-slate-400">
            mmHg · {b.pttMs}ms
          </span>
        </div>

        <LivePhysioWaveform
          mode="abp"
          color={bpWaveColor}
          bpm={b.bpm}
          pttMs={b.pttMs}
          heightClass="h-6"
        />

        <p className="mt-1 truncate text-[11px] text-slate-300">
          {bpSimpleText}
        </p>
      </button>

      {/* 4. Frecuencia Respiratoria (RIP) */}
      <button
        type="button"
        onClick={onOpenWearable}
        className={`group flex cursor-pointer flex-col justify-between rounded-xl border bg-[#091120] p-3 text-left transition ${BORDER_BY_STATUS[respStatus]}`}
      >
        <div className="flex items-center justify-between gap-1">
          <span className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
            <Wind className="h-3.5 w-3.5 shrink-0" style={{ color: respColor }} />
            Ventilación (RIP)
          </span>
          <StatusPill status={respStatus} />
        </div>

        <div className="my-0.5 flex items-baseline justify-between gap-1">
          <span
            className="font-mono-hud text-2xl font-bold tracking-tight sm:text-3xl"
            style={{ color: respColor }}
          >
            {b.respiratoryRateRpm}
          </span>
          <span className="text-[11px] font-medium text-slate-400">
            rpm · {b.minuteVentilationLpm.toFixed(1)} L/m
          </span>
        </div>

        <LivePhysioWaveform
          mode="resp"
          color={respColor}
          respiratoryRateRpm={b.respiratoryRateRpm}
          heightClass="h-6"
        />

        <p className="mt-1 truncate text-[11px] text-slate-300">
          {respSimpleText}
        </p>
      </button>

      {/* 5. Temperatura Central (Core) */}
      <button
        type="button"
        onClick={() => onSelectZone("abdomen")}
        className={`group flex cursor-pointer flex-col justify-between rounded-xl border bg-[#091120] p-3 text-left transition ${BORDER_BY_STATUS[tempStatus]}`}
      >
        <div className="flex items-center justify-between gap-1">
          <span className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
            <Thermometer className="h-3.5 w-3.5 shrink-0" style={{ color: tempColor }} />
            Temp. Central (Core)
          </span>
          <StatusPill status={tempStatus} />
        </div>

        <div className="my-0.5 flex items-baseline justify-between gap-1">
          <span
            className="font-mono-hud text-2xl font-bold tracking-tight sm:text-3xl"
            style={{ color: tempColor }}
          >
            {b.bodyTempC.toFixed(1)}°C
          </span>
          <span className="text-[11px] font-medium text-slate-400">
            Piel {b.skinTempC.toFixed(1)}°C
          </span>
        </div>

        <LivePhysioWaveform
          mode="metab"
          color={tempColor}
          heightClass="h-6"
        />

        <p className="mt-1 truncate text-[11px] text-slate-300">
          {tempSimpleText}
        </p>
      </button>

      {/* 6. Dosimetría Activa (RAD) */}
      <button
        type="button"
        onClick={() => onSelectZone("endocrino")}
        className={`group flex cursor-pointer flex-col justify-between rounded-xl border bg-[#091120] p-3 text-left transition ${BORDER_BY_STATUS[radStatus]}`}
      >
        <div className="flex items-center justify-between gap-1">
          <span className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
            <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-amber-400" />
            Dosimetría (RAD)
          </span>
          <StatusPill status={radStatus} />
        </div>

        <div className="my-0.5 flex items-baseline justify-between gap-1">
          <span
            className="font-mono-hud text-2xl font-bold tracking-tight sm:text-3xl"
            style={{ color: radColor }}
          >
            {radShieldPercent}%
          </span>
          <span className="text-[11px] font-medium text-slate-400">
            {b.dailyRadiationMsv.toFixed(2)} mSv/d
          </span>
        </div>

        <LivePhysioWaveform
          mode="rad"
          color={radColor}
          radiationMsv={b.dailyRadiationMsv}
          heightClass="h-6"
        />

        <p className="mt-1 truncate text-[11px] text-slate-300">
          {radSimpleText}
        </p>
      </button>
    </section>
  );
}
