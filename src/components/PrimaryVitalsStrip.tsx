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
import {
  BiomarkerData,
  HealthStatus,
  MissionEnvironmentId,
  SystemZoneId,
} from "@/types/astronaut";
import {
  estimatePhysioEtco2MmHg,
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
  environmentId?: MissionEnvironmentId;
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
  environmentId = "iss",
  cabinCo2MmHg,
  onSelectZone,
  onOpenWearable,
}: PrimaryVitalsStripProps) {
  const etCo2MmHg = estimatePhysioEtco2MmHg(b.respiratoryRateRpm, cabinCo2MmHg);
  const hrStatus = evaluateBpmStatus(b.bpm);
  const spo2Status = worstStatus([
    evaluateSpo2Status(b.spo2Percent, environmentId),
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
      ? "Steady resting rhythm"
      : hrStatus === "warning"
      ? "Elevated rate, pace breathing"
      : "Severe tachycardia, rest now";

  const spo2SimpleText =
    spo2Status === "optimal"
      ? "Nominal arterial oxygen"
      : spo2Status === "warning"
      ? "Slightly low, deep breaths"
      : "Hypoxia alert, check O₂";

  const bpSimpleText =
    bpStatus === "optimal"
      ? "Normal vascular pressure"
      : bpStatus === "warning"
      ? "Slightly elevated, pause task"
      : "Out-of-range BP, rest immediately";

  const respSimpleText =
    respStatus === "optimal"
      ? "Calm, unlabored breathing"
      : respStatus === "warning"
      ? "Rapid breathing, relax shoulders"
      : "Dyspnea risk, request support";

  const tempSimpleText =
    tempStatus === "optimal"
      ? "Nominal core temp, afebrile"
      : tempStatus === "warning"
      ? "Mild hyperthermia, hydrate & rest"
      : "High fever, run thermal protocol";

  const radSimpleText =
    radStatus === "optimal"
      ? "Crossed vs. NASA SRAG / ECLSS var. telemetry"
      : radStatus === "warning"
      ? "Elevated vs. NASA SRAG / ECLSS telemetry"
      : "SPE alert vs. NASA SRAG / ECLSS · Shelter";

  return (
    <section
      aria-label="Your 6 primary real-time vitals"
      className="space-y-2"
    >
      {/* Telemetry Source Separation & Pre-Flight Baseline Strip */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#182742] bg-[#091120] px-3 py-1.5 text-[11px]">
        <div className="flex items-center gap-2 font-mono-hud text-slate-300">
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
          <span>
            <strong className="text-sky-300">BIO-MONITOR 3N LIVE (2.5s TICK):</strong>{" "}
            12 Endogenous Physiological Signs + 1 Exogenous Dosimetry Channel (NASA SRAG / CSA RAD)
          </span>
        </div>
        <span className="rounded-md border border-cyan-500/35 bg-cyan-500/10 px-2 py-0.5 font-mono-hud text-[10px] font-bold text-cyan-200">
          Pre-Flight Individual Baseline: NASA MedOps / OSDR
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-6">
      {/* 1. Heart Rate (ECG) */}
      <button
        type="button"
        onClick={() => onSelectZone("corazon")}
        className={`group flex cursor-pointer flex-col justify-between rounded-xl border bg-[#091120] p-3 text-left transition ${BORDER_BY_STATUS[hrStatus]}`}
      >
        <div className="flex items-center justify-between gap-1">
          <span className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
            <HeartPulse className="h-3.5 w-3.5 shrink-0" style={{ color: hrColor }} />
            Heart Rate (ECG)
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
            bpm · HRV {b.hrvRmssdMs}ms
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

      {/* 2. Arterial Saturation (SpO₂) */}
      <button
        type="button"
        onClick={onOpenWearable}
        className={`group flex cursor-pointer flex-col justify-between rounded-xl border bg-[#091120] p-3 text-left transition ${BORDER_BY_STATUS[spo2Status]}`}
      >
        <div className="flex items-center justify-between gap-1">
          <span className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
            <Activity className="h-3.5 w-3.5 shrink-0" style={{ color: spo2Color }} />
            Saturation (SpO₂)
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

      {/* 3. Optical Blood Pressure (PTT) */}
      <button
        type="button"
        onClick={() => onSelectZone("corazon")}
        className={`group flex cursor-pointer flex-col justify-between rounded-xl border bg-[#091120] p-3 text-left transition ${BORDER_BY_STATUS[bpStatus]}`}
      >
        <div className="flex items-center justify-between gap-1">
          <span className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
            <Gauge className="h-3.5 w-3.5 shrink-0 text-sky-400" />
            Optical BP (PTT)
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

      {/* 4. RESP · VENT (Node 1 RIP Bands + Physio EtCO₂ vs. Cabin ECLSS ppCO₂) */}
      <button
        type="button"
        onClick={onOpenWearable}
        className={`group flex cursor-pointer flex-col justify-between rounded-xl border bg-[#091120] p-3 text-left transition ${BORDER_BY_STATUS[respStatus]}`}
      >
        <div className="flex items-center justify-between gap-1">
          <span className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
            <Wind className="h-3.5 w-3.5 shrink-0" style={{ color: respColor }} />
            RESP · VENT
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

        <div className="mt-1 space-y-0.5 text-[10px]">
          <div className="truncate font-mono-hud text-emerald-300">
            EtCO₂: {etCo2MmHg} mmHg (norm 35–45) · {respSimpleText}
          </div>
          <div className="truncate font-mono-hud text-sky-300/90">
            Cabin ECLSS: {cabinCo2MmHg.toFixed(1)} mmHg ppCO₂ (NASA Telemetry)
          </div>
        </div>
      </button>

      {/* 5. Core Temperature */}
      <button
        type="button"
        onClick={() => onSelectZone("abdomen")}
        className={`group flex cursor-pointer flex-col justify-between rounded-xl border bg-[#091120] p-3 text-left transition ${BORDER_BY_STATUS[tempStatus]}`}
      >
        <div className="flex items-center justify-between gap-1">
          <span className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
            <Thermometer className="h-3.5 w-3.5 shrink-0" style={{ color: tempColor }} />
            Core Temp (Body)
          </span>
          <StatusPill status={tempStatus} />
        </div>

        <div className="my-0.5 flex items-baseline justify-between gap-1">
          <span
            className="font-mono-hud text-2xl font-bold tracking-tight sm:text-3xl"
            style={{ color: tempColor }}
          >
            {b.bodyTempC.toFixed(2)}°C
          </span>
          <span className="text-[11px] font-medium text-slate-400">
            Skin {b.skinTempC.toFixed(2)}°C
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

      {/* 6. Active Dosimetry (RAD CSA) */}
      <button
        type="button"
        onClick={() => onSelectZone("endocrino")}
        className={`group flex cursor-pointer flex-col justify-between rounded-xl border bg-[#091120] p-3 text-left transition ${BORDER_BY_STATUS[radStatus]}`}
      >
        <div className="flex items-center justify-between gap-1">
          <span className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
            <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-amber-400" />
            RAD CSA
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
      </div>
    </section>
  );
}
