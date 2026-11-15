"use client";

import React from "react";
import {
  Activity,
  Droplets,
  Gauge,
  HeartPulse,
  ShieldCheck,
  Wind,
} from "lucide-react";
import { BiomarkerData, HealthStatus, SystemZoneId } from "@/types/astronaut";
import {
  evaluateBpStatus,
  evaluateBpmStatus,
  evaluateHydrationStatus,
  evaluateMinuteVentilationStatus,
  evaluatePerfusionIndexStatus,
  evaluateRadiationStatus,
  evaluateRespiratoryRateStatus,
  evaluateSpo2Status,
  evaluateTempStatus,
  STATUS_HEX,
  STATUS_LABELS,
  worstStatus,
} from "@/utils/healthEngine";
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
  const waterEnergyStatus = worstStatus([
    evaluateHydrationStatus(b.hydrationPercent),
    evaluateTempStatus(b.bodyTempC),
  ]);
  const radStatus = evaluateRadiationStatus(b.dailyRadiationMsv);

  const hrColor = getVitalDisplayColor(hrStatus, "#22c55e");
  const spo2Color = getVitalDisplayColor(spo2Status, "#38bdf8");
  const bpColor = getVitalDisplayColor(bpStatus, "#f8fafc");
  const bpWaveColor = getVitalDisplayColor(bpStatus, "#38bdf8");
  const respColor = getVitalDisplayColor(respStatus, "#2dd4bf");
  const waterColor = getVitalDisplayColor(waterEnergyStatus, "#38bdf8");
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

  const waterSimpleText =
    waterEnergyStatus === "optimal"
      ? "Buena hidratación y calor normal"
      : waterEnergyStatus === "warning"
      ? "Toma un vaso de agua pronto"
      : "Falta agua o tienes calor alto";

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
      {/* 1. Corazón */}
      <button
        type="button"
        onClick={() => onSelectZone("corazon")}
        className={`group flex cursor-pointer flex-col justify-between rounded-xl border bg-[#091120] p-3 text-left transition ${BORDER_BY_STATUS[hrStatus]}`}
      >
        <div className="flex items-center justify-between gap-1">
          <span className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
            <HeartPulse className="h-3.5 w-3.5 shrink-0" style={{ color: hrColor }} />
            Corazón
          </span>
          <span
            className="rounded-full px-2 py-0.5 font-mono-hud text-[10px] font-bold"
            style={{
              backgroundColor: `${STATUS_HEX[hrStatus]}20`,
              color: STATUS_HEX[hrStatus],
            }}
          >
            {STATUS_LABELS[hrStatus]}
          </span>
        </div>

        <div className="my-0.5 flex items-baseline justify-between gap-1">
          <span
            className="font-mono-hud text-2xl font-bold tracking-tight sm:text-3xl"
            style={{ color: hrColor }}
          >
            {b.bpm}
          </span>
          <span className="text-[11px] font-medium text-slate-400">
            latidos/min
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

      {/* 2. Oxígeno */}
      <button
        type="button"
        onClick={onOpenWearable}
        className={`group flex cursor-pointer flex-col justify-between rounded-xl border bg-[#091120] p-3 text-left transition ${BORDER_BY_STATUS[spo2Status]}`}
      >
        <div className="flex items-center justify-between gap-1">
          <span className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
            <Activity className="h-3.5 w-3.5 shrink-0" style={{ color: spo2Color }} />
            Oxígeno
          </span>
          <span
            className="rounded-full px-2 py-0.5 font-mono-hud text-[10px] font-bold"
            style={{
              backgroundColor: `${STATUS_HEX[spo2Status]}20`,
              color: STATUS_HEX[spo2Status],
            }}
          >
            {STATUS_LABELS[spo2Status]}
          </span>
        </div>

        <div className="my-0.5 flex items-baseline justify-between gap-1">
          <span
            className="font-mono-hud text-2xl font-bold tracking-tight sm:text-3xl"
            style={{ color: spo2Color }}
          >
            {b.spo2Percent}%
          </span>
          <span className="text-[11px] font-medium text-slate-400">
            en sangre
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

      {/* 3. Presión */}
      <button
        type="button"
        onClick={() => onSelectZone("corazon")}
        className={`group flex cursor-pointer flex-col justify-between rounded-xl border bg-[#091120] p-3 text-left transition ${BORDER_BY_STATUS[bpStatus]}`}
      >
        <div className="flex items-center justify-between gap-1">
          <span className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
            <Gauge className="h-3.5 w-3.5 shrink-0 text-sky-400" />
            Presión
          </span>
          <span
            className="rounded-full px-2 py-0.5 font-mono-hud text-[10px] font-bold"
            style={{
              backgroundColor: `${STATUS_HEX[bpStatus]}20`,
              color: STATUS_HEX[bpStatus],
            }}
          >
            {STATUS_LABELS[bpStatus]}
          </span>
        </div>

        <div className="my-0.5 flex items-baseline justify-between gap-1">
          <span
            className="font-mono-hud text-2xl font-bold tracking-tight sm:text-3xl"
            style={{ color: bpColor }}
          >
            {b.systolicBP}/{b.diastolicBP}
          </span>
          <span className="text-[11px] font-medium text-slate-400">
            fuerza
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

      {/* 4. Respiración */}
      <button
        type="button"
        onClick={onOpenWearable}
        className={`group flex cursor-pointer flex-col justify-between rounded-xl border bg-[#091120] p-3 text-left transition ${BORDER_BY_STATUS[respStatus]}`}
      >
        <div className="flex items-center justify-between gap-1">
          <span className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
            <Wind className="h-3.5 w-3.5 shrink-0" style={{ color: respColor }} />
            Respiración
          </span>
          <span
            className="rounded-full px-2 py-0.5 font-mono-hud text-[10px] font-bold"
            style={{
              backgroundColor: `${STATUS_HEX[respStatus]}20`,
              color: STATUS_HEX[respStatus],
            }}
          >
            {STATUS_LABELS[respStatus]}
          </span>
        </div>

        <div className="my-0.5 flex items-baseline justify-between gap-1">
          <span
            className="font-mono-hud text-2xl font-bold tracking-tight sm:text-3xl"
            style={{ color: respColor }}
          >
            {b.respiratoryRateRpm}
          </span>
          <span className="text-[11px] font-medium text-slate-400">
            veces/min
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

      {/* 5. Agua y Energía */}
      <button
        type="button"
        onClick={() => onSelectZone("abdomen")}
        className={`group flex cursor-pointer flex-col justify-between rounded-xl border bg-[#091120] p-3 text-left transition ${BORDER_BY_STATUS[waterEnergyStatus]}`}
      >
        <div className="flex items-center justify-between gap-1">
          <span className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
            <Droplets className="h-3.5 w-3.5 shrink-0" style={{ color: waterColor }} />
            Agua y Calor
          </span>
          <span
            className="rounded-full px-2 py-0.5 font-mono-hud text-[10px] font-bold"
            style={{
              backgroundColor: `${STATUS_HEX[waterEnergyStatus]}20`,
              color: STATUS_HEX[waterEnergyStatus],
            }}
          >
            {STATUS_LABELS[waterEnergyStatus]}
          </span>
        </div>

        <div className="my-0.5 flex items-baseline justify-between gap-1">
          <span
            className="font-mono-hud text-2xl font-bold tracking-tight sm:text-3xl"
            style={{ color: waterColor }}
          >
            {b.hydrationPercent}%
          </span>
          <span className="font-mono-hud text-[11px] font-medium text-slate-400">
            · {b.bodyTempC.toFixed(1)}°C
          </span>
        </div>

        <LivePhysioWaveform
          mode="metab"
          color={waterColor}
          heightClass="h-6"
        />

        <p className="mt-1 truncate text-[11px] text-slate-300">
          {waterSimpleText}
        </p>
      </button>

      {/* 6. Escudo Radiación */}
      <button
        type="button"
        onClick={() => onSelectZone("endocrino")}
        className={`group flex cursor-pointer flex-col justify-between rounded-xl border bg-[#091120] p-3 text-left transition ${BORDER_BY_STATUS[radStatus]}`}
      >
        <div className="flex items-center justify-between gap-1">
          <span className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
            <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-amber-400" />
            Escudo Nave
          </span>
          <span
            className="rounded-full px-2 py-0.5 font-mono-hud text-[10px] font-bold"
            style={{
              backgroundColor: `${STATUS_HEX[radStatus]}20`,
              color: STATUS_HEX[radStatus],
            }}
          >
            {STATUS_LABELS[radStatus]}
          </span>
        </div>

        <div className="my-0.5 flex items-baseline justify-between gap-1">
          <span
            className="font-mono-hud text-2xl font-bold tracking-tight sm:text-3xl"
            style={{ color: radColor }}
          >
            {radShieldPercent}%
          </span>
          <span className="text-[11px] font-medium text-slate-400">
            protección
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
