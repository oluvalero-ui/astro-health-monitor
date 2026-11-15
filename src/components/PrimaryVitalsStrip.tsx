"use client";

import React from "react";
import {
  Activity,
  Gauge,
  HeartPulse,
  Radiation,
  Thermometer,
  Wind,
} from "lucide-react";
import { CSA_RADIATION_LIMITS } from "@/data/missionData";
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
  STATUS_HEX,
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
  readinessScore,
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
  const thermalStatus = worstStatus([
    evaluateTempStatus(b.bodyTempC),
    evaluateSkinTempStatus(b.skinTempC),
  ]);
  const radStatus = evaluateRadiationStatus(b.dailyRadiationMsv);

  const mapMmHg = Math.round(b.diastolicBP + (b.systolicBP - b.diastolicBP) / 3);

  const hrColor = getVitalDisplayColor(hrStatus, "#22c55e");
  const spo2Color = getVitalDisplayColor(spo2Status, "#38bdf8");
  const bpColor = getVitalDisplayColor(bpStatus, "#f8fafc");
  const bpWaveColor = getVitalDisplayColor(bpStatus, "#38bdf8");
  const respColor = getVitalDisplayColor(respStatus, "#2dd4bf");
  const thermalColor = getVitalDisplayColor(thermalStatus, "#38bdf8");
  const radColor = getVitalDisplayColor(radStatus, "#34d399");

  return (
    <section
      aria-label="Monitor primario en vivo del Arnés 3N (13 signos continuos)"
      className="grid grid-cols-2 gap-2.5 lg:grid-cols-6"
    >
      {/* 1. NODO 1: ECG 3 Derivaciones / FC + HRV */}
      <button
        type="button"
        onClick={onOpenWearable}
        className={`group flex cursor-pointer flex-col justify-between rounded-xl border bg-[#091120] p-3 text-left transition ${BORDER_BY_STATUS[hrStatus]}`}
      >
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 font-mono-hud text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <HeartPulse className="h-3.5 w-3.5" style={{ color: hrColor }} />
            ECG · FC (N1)
          </span>
          <span
            className="h-2 w-2 rounded-full"
            style={{
              backgroundColor: STATUS_HEX[hrStatus],
              boxShadow: `0 0 8px ${STATUS_HEX[hrStatus]}`,
            }}
          />
        </div>

        <div className="my-0.5 flex items-baseline justify-between gap-2">
          <span
            className="font-mono-hud text-2xl font-bold tracking-tight sm:text-3xl"
            style={{ color: hrColor }}
          >
            {b.bpm}
          </span>
          <span className="font-mono-hud text-[11px] font-semibold text-slate-500">
            BPM
          </span>
        </div>

        <LivePhysioWaveform
          mode="ecg"
          color={hrColor}
          bpm={b.bpm}
          hrvMs={b.hrvRmssdMs}
          heightClass="h-6"
        />

        <div className="mt-1 flex items-center justify-between font-mono-hud text-[10px] text-slate-400">
          <span>HRV {b.hrvRmssdMs} ms</span>
          <span>ECG 3D · 256Hz</span>
        </div>
      </button>

      {/* 2. NODO 2: SpO2 Supraorbitario + Índice de Perfusión (PI) */}
      <button
        type="button"
        onClick={onOpenWearable}
        className={`group flex cursor-pointer flex-col justify-between rounded-xl border bg-[#091120] p-3 text-left transition ${BORDER_BY_STATUS[spo2Status]}`}
      >
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 font-mono-hud text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <Activity className="h-3.5 w-3.5" style={{ color: spo2Color }} />
            SpO₂ · PI (N2)
          </span>
          <span
            className="h-2 w-2 rounded-full"
            style={{
              backgroundColor: STATUS_HEX[spo2Status],
              boxShadow: `0 0 8px ${STATUS_HEX[spo2Status]}`,
            }}
          />
        </div>

        <div className="my-0.5 flex items-baseline justify-between gap-2">
          <span
            className="font-mono-hud text-2xl font-bold tracking-tight sm:text-3xl"
            style={{ color: spo2Color }}
          >
            {b.spo2Percent}
          </span>
          <span className="font-mono-hud text-[11px] font-semibold text-slate-500">
            %
          </span>
        </div>

        <LivePhysioWaveform
          mode="ppg"
          color={spo2Color}
          bpm={b.bpm}
          pttMs={b.pttMs}
          heightClass="h-6"
        />

        <div className="mt-1 flex items-center justify-between font-mono-hud text-[10px] text-slate-400">
          <span>PI {b.perfusionIndex.toFixed(1)}%</span>
          <span>Vincha 64Hz</span>
        </div>
      </button>

      {/* 3. NODO 1→2: Presión Arterial Continua por PTT */}
      <button
        type="button"
        onClick={onOpenWearable}
        className={`group flex cursor-pointer flex-col justify-between rounded-xl border bg-[#091120] p-3 text-left transition ${BORDER_BY_STATUS[bpStatus]}`}
      >
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 font-mono-hud text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <Gauge className="h-3.5 w-3.5 text-sky-400" />
            PA · PTT (N2)
          </span>
          <span
            className="h-2 w-2 rounded-full"
            style={{
              backgroundColor: STATUS_HEX[bpStatus],
              boxShadow: `0 0 8px ${STATUS_HEX[bpStatus]}`,
            }}
          />
        </div>

        <div className="my-0.5 flex items-baseline justify-between gap-1">
          <span
            className="font-mono-hud text-2xl font-bold tracking-tight sm:text-3xl"
            style={{ color: bpColor }}
          >
            {b.systolicBP}/{b.diastolicBP}
          </span>
          <span className="font-mono-hud text-[11px] font-semibold text-slate-500">
            mmHg
          </span>
        </div>

        <LivePhysioWaveform
          mode="abp"
          color={bpWaveColor}
          bpm={b.bpm}
          pttMs={b.pttMs}
          heightClass="h-6"
        />

        <div className="mt-1 flex items-center justify-between font-mono-hud text-[10px] text-slate-400">
          <span>PAM {mapMmHg}</span>
          <span>PTT {b.pttMs} ms</span>
        </div>
      </button>

      {/* 4. NODO 1: Frecuencia Respiratoria + Volumen Minuto (Bandas RIP) */}
      <button
        type="button"
        onClick={onOpenWearable}
        className={`group flex cursor-pointer flex-col justify-between rounded-xl border bg-[#091120] p-3 text-left transition ${BORDER_BY_STATUS[respStatus]}`}
      >
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 font-mono-hud text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <Wind className="h-3.5 w-3.5" style={{ color: respColor }} />
            RESP · RIP (N1)
          </span>
          <span
            className="h-2 w-2 rounded-full"
            style={{
              backgroundColor: STATUS_HEX[respStatus],
              boxShadow: `0 0 8px ${STATUS_HEX[respStatus]}`,
            }}
          />
        </div>

        <div className="my-0.5 flex items-baseline justify-between gap-2">
          <span
            className="font-mono-hud text-2xl font-bold tracking-tight sm:text-3xl"
            style={{ color: respColor }}
          >
            {b.respiratoryRateRpm}
          </span>
          <span className="font-mono-hud text-[11px] font-semibold text-slate-500">
            RPM
          </span>
        </div>

        <LivePhysioWaveform
          mode="resp"
          color={respColor}
          respiratoryRateRpm={b.respiratoryRateRpm}
          heightClass="h-6"
        />

        <div className="mt-1 flex items-center justify-between font-mono-hud text-[10px] text-slate-400">
          <span>Vol.Min {b.minuteVentilationLpm.toFixed(1)} L/m</span>
          <span>RIP 128Hz</span>
        </div>
      </button>

      {/* 5. NODO 1 & 2: Temp. Central ZHF + Temp. Cutánea + Postura/Sueño */}
      <button
        type="button"
        onClick={onOpenWearable}
        className={`group flex cursor-pointer flex-col justify-between rounded-xl border bg-[#091120] p-3 text-left transition ${BORDER_BY_STATUS[thermalStatus]}`}
      >
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 font-mono-hud text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <Thermometer className="h-3.5 w-3.5" style={{ color: thermalColor }} />
            TEMP · ZHF (N1/2)
          </span>
          <span
            className="h-2 w-2 rounded-full"
            style={{
              backgroundColor: STATUS_HEX[thermalStatus],
              boxShadow: `0 0 8px ${STATUS_HEX[thermalStatus]}`,
            }}
          />
        </div>

        <div className="my-0.5 flex items-baseline justify-between gap-1">
          <span
            className="font-mono-hud text-2xl font-bold tracking-tight sm:text-3xl"
            style={{ color: thermalColor }}
          >
            {b.bodyTempC.toFixed(1)}
          </span>
          <span className="font-mono-hud text-[11px] font-semibold text-slate-500">
            °C ZHF
          </span>
        </div>

        <LivePhysioWaveform
          mode="metab"
          color={thermalColor}
          heightClass="h-6"
        />

        <div className="mt-1 flex items-center justify-between font-mono-hud text-[10px] text-slate-400">
          <span>Piel {b.skinTempC.toFixed(1)}°C</span>
          <span>Post {b.postureScore}% · {b.sleepHours.toFixed(1)}h</span>
        </div>
      </button>

      {/* 6. NODO 3: Dosimetría CSA + Biometría Acústica Vocal */}
      <button
        type="button"
        onClick={() => onSelectZone("endocrino")}
        className={`group flex cursor-pointer flex-col justify-between rounded-xl border bg-[#091120] p-3 text-left transition ${BORDER_BY_STATUS[radStatus]}`}
      >
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 font-mono-hud text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <Radiation className="h-3.5 w-3.5 text-amber-400" />
            RAD · VOZ (N3)
          </span>
          <span
            className="h-2 w-2 rounded-full"
            style={{
              backgroundColor: STATUS_HEX[radStatus],
              boxShadow: `0 0 8px ${STATUS_HEX[radStatus]}`,
            }}
          />
        </div>

        <div className="my-0.5 flex items-baseline justify-between gap-1">
          <span
            className="font-mono-hud text-2xl font-bold tracking-tight sm:text-3xl"
            style={{ color: radColor }}
          >
            {b.dailyRadiationMsv.toFixed(2)}
          </span>
          <span className="font-mono-hud text-[11px] font-semibold text-slate-500">
            mSv/d
          </span>
        </div>

        <LivePhysioWaveform
          mode="rad"
          color={radColor}
          radiationMsv={b.dailyRadiationMsv}
          heightClass="h-6"
        />

        <div className="mt-1 flex items-center justify-between font-mono-hud text-[10px] text-slate-400">
          <span>Acum {b.cumulativeRadiationMsv.toFixed(1)}/{CSA_RADIATION_LIMITS.careerLimitMsv}</span>
          <span>Voz {100 - b.facialTension}% · Apt {readinessScore}%</span>
        </div>
      </button>
    </section>
  );
}
