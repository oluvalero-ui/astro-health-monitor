"use client";

import React from "react";
import {
  Activity,
  Droplets,
  Gauge,
  HeartPulse,
  Radiation,
  Wind,
} from "lucide-react";
import { CSA_RADIATION_LIMITS } from "@/data/missionData";
import { BiomarkerData, HealthStatus, SystemZoneId } from "@/types/astronaut";
import {
  evaluateBpStatus,
  evaluateBpmStatus,
  evaluateGlucoseStatus,
  evaluateHydrationStatus,
  evaluateRadiationStatus,
  evaluateRespiratoryRateStatus,
  evaluateSpo2Status,
  evaluateTempStatus,
  STATUS_HEX,
  worstStatus,
} from "@/utils/healthEngine";

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
  cabinCo2MmHg,
  onSelectZone,
  onOpenWearable,
}: PrimaryVitalsStripProps) {
  const hrStatus = evaluateBpmStatus(b.bpm);
  const spo2Status = evaluateSpo2Status(b.spo2Percent);
  const bpStatus = evaluateBpStatus(b.systolicBP, b.diastolicBP);
  const respStatus = evaluateRespiratoryRateStatus(b.respiratoryRateRpm);
  const metabolicStatus = worstStatus([
    evaluateTempStatus(b.bodyTempC),
    evaluateGlucoseStatus(b.bloodGlucoseMgDl),
    evaluateHydrationStatus(b.hydrationPercent),
  ]);
  const radStatus = evaluateRadiationStatus(b.dailyRadiationMsv);

  const mapMmHg = Math.round(b.diastolicBP + (b.systolicBP - b.diastolicBP) / 3);

  const hrColor = getVitalDisplayColor(hrStatus, "#22c55e");
  const spo2Color = getVitalDisplayColor(spo2Status, "#38bdf8");
  const bpColor = getVitalDisplayColor(bpStatus, "#f8fafc");
  const respColor = getVitalDisplayColor(respStatus, "#2dd4bf");
  const metabColor = getVitalDisplayColor(metabolicStatus, "#38bdf8");
  const radColor = getVitalDisplayColor(radStatus, "#34d399");

  return (
    <section
      aria-label="Monitor primario de signos vitales"
      className="grid grid-cols-2 gap-2.5 lg:grid-cols-6"
    >
      {/* 1. ECG / Frecuencia Cardíaca */}
      <button
        type="button"
        onClick={() => onSelectZone("corazon")}
        className={`group flex cursor-pointer flex-col justify-between rounded-xl border bg-[#091120] p-3 text-left transition ${BORDER_BY_STATUS[hrStatus]}`}
      >
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 font-mono-hud text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <HeartPulse className="h-3.5 w-3.5" style={{ color: hrColor }} />
            ECG · FC
          </span>
          <span
            className="h-2 w-2 rounded-full"
            style={{
              backgroundColor: STATUS_HEX[hrStatus],
              boxShadow: `0 0 8px ${STATUS_HEX[hrStatus]}`,
            }}
          />
        </div>

        <div className="my-1 flex items-baseline justify-between gap-2">
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

        {/* Mini trazo ECG */}
        <svg viewBox="0 0 120 22" className="h-5 w-full overflow-visible">
          <path
            d="M 0 12 L 18 12 L 23 8 L 28 12 L 34 12 L 37 17 L 41 2 L 45 19 L 49 12 L 57 12 L 63 7 L 69 12 L 85 12 L 90 17 L 94 2 L 98 19 L 102 12 L 120 12"
            fill="none"
            stroke={hrColor}
            strokeWidth="1.85"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        <div className="mt-1 flex items-center justify-between font-mono-hud text-[10px] text-slate-400">
          <span>HRV {b.hrvRmssdMs} ms</span>
          <span>52–92</span>
        </div>
      </button>

      {/* 2. SpO2 / Pletismografía */}
      <button
        type="button"
        onClick={onOpenWearable}
        className={`group flex cursor-pointer flex-col justify-between rounded-xl border bg-[#091120] p-3 text-left transition ${BORDER_BY_STATUS[spo2Status]}`}
      >
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 font-mono-hud text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <Activity className="h-3.5 w-3.5" style={{ color: spo2Color }} />
            SpO₂ · PPG
          </span>
          <span
            className="h-2 w-2 rounded-full"
            style={{
              backgroundColor: STATUS_HEX[spo2Status],
              boxShadow: `0 0 8px ${STATUS_HEX[spo2Status]}`,
            }}
          />
        </div>

        <div className="my-1 flex items-baseline justify-between gap-2">
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

        {/* Mini onda PPG */}
        <svg viewBox="0 0 120 22" className="h-5 w-full overflow-visible">
          <path
            d="M 0 16 Q 10 16, 16 5 Q 22 14, 27 11 Q 33 16, 42 16 Q 52 16, 58 5 Q 64 14, 69 11 Q 75 16, 84 16 Q 94 16, 100 5 Q 106 14, 111 11 L 120 16"
            fill="none"
            stroke={spo2Color}
            strokeWidth="1.85"
            strokeLinecap="round"
          />
        </svg>

        <div className="mt-1 flex items-center justify-between font-mono-hud text-[10px] text-slate-400">
          <span>PI {b.perfusionIndex.toFixed(1)}%</span>
          <span>≥ 95%</span>
        </div>
      </button>

      {/* 3. Presión Arterial Continua (PTT) */}
      <button
        type="button"
        onClick={() => onSelectZone("corazon")}
        className={`group flex cursor-pointer flex-col justify-between rounded-xl border bg-[#091120] p-3 text-left transition ${BORDER_BY_STATUS[bpStatus]}`}
      >
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 font-mono-hud text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <Gauge className="h-3.5 w-3.5 text-sky-400" />
            PA · PTT
          </span>
          <span
            className="h-2 w-2 rounded-full"
            style={{
              backgroundColor: STATUS_HEX[bpStatus],
              boxShadow: `0 0 8px ${STATUS_HEX[bpStatus]}`,
            }}
          />
        </div>

        <div className="my-1 flex items-baseline justify-between gap-1">
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

        <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#15233d]">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${Math.min(100, Math.round((b.systolicBP / 160) * 100))}%`,
              backgroundColor: STATUS_HEX[bpStatus],
            }}
          />
        </div>

        <div className="mt-1.5 flex items-center justify-between font-mono-hud text-[10px] text-slate-400">
          <span>PAM {mapMmHg}</span>
          <span>PTT {b.pttMs} ms</span>
        </div>
      </button>

      {/* 4. Frecuencia Respiratoria y Cabina */}
      <button
        type="button"
        onClick={onOpenWearable}
        className={`group flex cursor-pointer flex-col justify-between rounded-xl border bg-[#091120] p-3 text-left transition ${BORDER_BY_STATUS[respStatus]}`}
      >
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 font-mono-hud text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <Wind className="h-3.5 w-3.5" style={{ color: respColor }} />
            RESP · CO₂
          </span>
          <span
            className="h-2 w-2 rounded-full"
            style={{
              backgroundColor: STATUS_HEX[respStatus],
              boxShadow: `0 0 8px ${STATUS_HEX[respStatus]}`,
            }}
          />
        </div>

        <div className="my-1 flex items-baseline justify-between gap-2">
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

        <svg viewBox="0 0 120 22" className="h-5 w-full overflow-visible">
          <path
            d="M 0 14 Q 15 2, 30 14 T 60 14 T 90 14 T 120 14"
            fill="none"
            stroke={respColor}
            strokeWidth="1.85"
          />
        </svg>

        <div className="mt-1 flex items-center justify-between font-mono-hud text-[10px] text-slate-400">
          <span>CO₂ {cabinCo2MmHg} mmHg</span>
          <span>10–20 rpm</span>
        </div>
      </button>

      {/* 5. Temperatura, Glucosa e Hidratación */}
      <button
        type="button"
        onClick={() => onSelectZone("abdomen")}
        className={`group flex cursor-pointer flex-col justify-between rounded-xl border bg-[#091120] p-3 text-left transition ${BORDER_BY_STATUS[metabolicStatus]}`}
      >
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 font-mono-hud text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <Droplets className="h-3.5 w-3.5" style={{ color: metabColor }} />
            METAB · TEMP
          </span>
          <span
            className="h-2 w-2 rounded-full"
            style={{
              backgroundColor: STATUS_HEX[metabolicStatus],
              boxShadow: `0 0 8px ${STATUS_HEX[metabolicStatus]}`,
            }}
          />
        </div>

        <div className="my-1 flex items-baseline justify-between gap-1">
          <span
            className="font-mono-hud text-2xl font-bold tracking-tight sm:text-3xl"
            style={{ color: metabColor }}
          >
            {b.bodyTempC.toFixed(1)}
          </span>
          <span className="font-mono-hud text-[11px] font-semibold text-slate-500">
            °C
          </span>
        </div>

        <div className="flex items-center justify-between rounded-md bg-[#111e36] px-2 py-0.5 font-mono-hud text-[10px] font-semibold text-slate-200">
          <span>GLUC {b.bloodGlucoseMgDl}</span>
          <span>HIDR {b.hydrationPercent}%</span>
        </div>

        <div className="mt-1 flex items-center justify-between font-mono-hud text-[10px] text-slate-400">
          <span>Piel {b.skinTempC.toFixed(1)} °C</span>
          <span>ΔT {(b.bodyTempC - b.skinTempC).toFixed(1)} °C</span>
        </div>
      </button>

      {/* 6. Dosimetría CSA & Preparación */}
      <button
        type="button"
        onClick={() => onSelectZone("endocrino")}
        className={`group flex cursor-pointer flex-col justify-between rounded-xl border bg-[#091120] p-3 text-left transition ${BORDER_BY_STATUS[radStatus]}`}
      >
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 font-mono-hud text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <Radiation className="h-3.5 w-3.5 text-amber-400" />
            RAD CSA
          </span>
          <span
            className="h-2 w-2 rounded-full"
            style={{
              backgroundColor: STATUS_HEX[radStatus],
              boxShadow: `0 0 8px ${STATUS_HEX[radStatus]}`,
            }}
          />
        </div>

        <div className="my-1 flex items-baseline justify-between gap-1">
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

        <div className="flex items-center justify-between rounded-md bg-[#111e36] px-2 py-0.5 font-mono-hud text-[10px] font-semibold text-slate-200">
          <span>Acum {b.cumulativeRadiationMsv.toFixed(1)}</span>
          <span>Lím {CSA_RADIATION_LIMITS.careerLimitMsv}</span>
        </div>

        <div className="mt-1 flex items-center justify-between font-mono-hud text-[10px] text-slate-400">
          <span>Aptitud {readinessScore}%</span>
          <span>Sueño {b.sleepHours.toFixed(1)}h</span>
        </div>
      </button>
    </section>
  );
}
