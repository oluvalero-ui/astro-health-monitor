"use client";

import React, { useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Gauge,
  Headphones,
  HeartPulse,
  Mic,
  Radiation,
  ShieldCheck,
  Stethoscope,
  Thermometer,
  Watch,
} from "lucide-react";
import { CSA_RADIATION_LIMITS, MISSION_ENVIRONMENTS } from "@/data/missionData";
import {
  BiomarkerData,
  HealthStatus,
  MissionEnvironmentId,
  SystemZoneId,
} from "@/types/astronaut";
import {
  computeHemodynamicIndices,
  estimatePhysioEtco2MmHg,
  evaluateBpStatus,
  evaluateBpmStatus,
  evaluateHrvStatus,
  evaluateMinuteVentilationStatus,
  evaluatePerfusionIndexStatus,
  evaluatePostureStatus,
  evaluatePttStatus,
  evaluateRadiationStatus,
  evaluateRespiratoryRateStatus,
  evaluateSkinTempStatus,
  evaluateSleepStatus,
  evaluateSpo2Status,
  evaluateStressStatus,
  evaluateTempStatus,
  STATUS_HEX,
} from "@/utils/healthEngine";
import LivePhysioWaveform from "./LivePhysioWaveform";
import { StatusPill } from "./ui/StatusPill";

interface WearableHarnessPanelProps {
  environmentId: MissionEnvironmentId;
  biomarkers: BiomarkerData;
  cabinCo2MmHg?: number;
  cabinPressureKpa?: number;
  onCalibrateOscillometric: () => void;
  onSelectSystemZone?: (zone: SystemZoneId) => void;
}

interface TelemetryBadgeProps {
  label: string;
  value: string;
  meta: string;
  status: HealthStatus;
  onClick?: () => void;
  className?: string;
}

function TelemetryBadge({
  label,
  value,
  meta,
  status,
  onClick,
  className = "",
}: TelemetryBadgeProps) {
  return (
    <div
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      className={`rounded-xl border border-[#182742] bg-[#091120] p-2.5 transition ${
        onClick ? "cursor-pointer hover:border-sky-500/45 hover:bg-[#0d192e]" : ""
      } ${className}`}
    >
      <div className="flex items-center justify-between gap-1.5">
        <span className="truncate text-[11px] font-semibold text-slate-300">
          {label}
        </span>
        <StatusPill status={status} />
      </div>
      <div className="mt-1 font-mono-hud text-base font-bold text-slate-100">
        {value}
      </div>
      <div className="mt-0.5 truncate text-[10px] text-slate-400">{meta}</div>
    </div>
  );
}

export default function WearableHarnessPanel({
  environmentId,
  biomarkers: b,
  cabinCo2MmHg,
  cabinPressureKpa,
  onCalibrateOscillometric,
  onSelectSystemZone,
}: WearableHarnessPanelProps) {
  const [calFeedbackAt, setCalFeedbackAt] = useState<string | null>(null);

  const env = MISSION_ENVIRONMENTS[environmentId];
  const currentCo2 = cabinCo2MmHg ?? env.co2MmHg;
  const currentPressure = cabinPressureKpa ?? env.cabinPressureKpa;
  const etCo2MmHg = estimatePhysioEtco2MmHg(b.respiratoryRateRpm, currentCo2);
  const hemo = computeHemodynamicIndices(b, environmentId);

  const calHoursStatus: HealthStatus =
    b.pttCalibrationRequired || b.lastOscillometricCalHours >= 24
      ? "warning"
      : "optimal";

  const handleCalibrateClick = () => {
    onCalibrateOscillometric();
    const utc = new Date().toISOString().slice(11, 19);
    setCalFeedbackAt(`${utc} UTC`);
  };

  return (
    <section
      id="wearable-harness"
      aria-label="Physical Prototype: CSA Bio-Monitor 3N Harness"
      className="rounded-2xl border border-[#1b2d4b] bg-[#0c1426] p-4 shadow-[0_14px_34px_rgba(2,6,23,0.45)] sm:p-5"
    >
      {/* Section Header — Unique 3N Harness Hardware */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-[#182742] pb-3">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-sky-400/35 bg-sky-500/15 text-sky-300 shadow-sm">
            <Watch className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100 sm:text-lg">
              Bio-Monitor 3N · Continuous Wearable Telemetry (CSA / NASA)
            </h2>
            <p className="mt-0.5 text-xs text-slate-400">
              12 Endogenous Physiological Vital Signs + 1 Exogenous Dosimetry Channel (Synced with NASA SRAG / CSA RAD Telemetry) across thoracic vest, frontal headband, and Node 3.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-xl border border-sky-500/35 bg-sky-500/10 px-3 py-1.5 font-mono-hud text-[11px] font-bold text-sky-200">
            Dynamic Environmental Telemetry: NASA ECLSS &amp; SRAG ({currentPressure.toFixed(2)} kPa · {currentCo2.toFixed(1)} mmHg ppCO₂)
          </span>
          <span className="rounded-xl border border-cyan-500/35 bg-cyan-500/10 px-3 py-1.5 font-mono-hud text-[11px] font-bold text-cyan-200">
            Pre-Flight Individual Baseline: NASA MedOps / OSDR
          </span>
          <div className="rounded-xl border border-[#1b2d4b] bg-[#091120] px-3 py-1.5 font-mono-hud">
            <span className="text-slate-400">Mission: </span>
            <span className="font-bold text-sky-300">{env.shortName}</span>
            <span className="text-slate-400"> · {env.gravityLabel}</span>
          </div>
        </div>
      </div>

      {/* Amber Gravity / BP Reg Calibration Banner */}
      {b.pttCalibrationRequired && (
        <div
          role="alert"
          className="mb-4 flex flex-col justify-between gap-3 rounded-xl border border-amber-500/40 bg-amber-950/35 p-3.5 text-xs text-amber-100 sm:flex-row sm:items-center"
        >
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
            <div>
              <div className="font-bold text-amber-200">
                Optical BP recalibration advised following gravity transition
              </div>
              <p className="mt-0.5 leading-relaxed text-amber-100/85">
                Entered <strong>{env.name} ({env.gravityG}g)</strong>; hydrostatic fluid gradients have shifted. Press to calibrate wearable PTT against the spacecraft BP cuff in 30 seconds.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleCalibrateClick}
            className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xl bg-amber-600 px-3.5 py-2 font-mono-hud text-xs font-bold text-white shadow-xs transition hover:bg-amber-500"
          >
            <Stethoscope className="h-4 w-4" />
            Calibrate BP (30 s)
          </button>
        </div>
      )}

      {calFeedbackAt && !b.pttCalibrationRequired && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-emerald-500/35 bg-emerald-950/30 px-3.5 py-2.5 text-xs text-emerald-100">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
            <span>
              <strong>Optical BP calibrated ({calFeedbackAt}):</strong>{" "}
              Frontal headband synchronized for continuous cuffless blood pressure tracking.
            </span>
          </div>
          <span className="rounded-full bg-emerald-600 px-2.5 py-0.5 font-mono-hud text-[11px] font-bold text-white">
            Saved
          </span>
        </div>
      )}

      {/* 3 Physical Capture Nodes Grid (7 + 4 + 2 = 13 Continuous Physiological Signs) */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        {/* NODO 1: Chaleco en el Pecho (7 Signos) */}
        <div className="flex flex-col justify-between rounded-2xl border border-[#1b2d4b] bg-[#0a1222] p-4 xl:col-span-5">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#182742] pb-2.5">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-sky-400/25 bg-sky-500/15 text-sky-300">
                  <HeartPulse className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-100">
                    Thoracic Node (Smart Vest)
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Heart rate, respiratory flow, skin heat & sleep posture
                  </p>
                </div>
              </div>
            </div>

            {/* Continuous 3-Lead ECG */}
            <div className="mt-3 rounded-xl border border-[#182742] bg-[#091120] p-2.5">
              <div className="mb-1.5 flex items-center justify-between text-[10px] font-mono-hud">
                <span className="font-bold text-slate-200">
                  Continuous ECG · 3 Dry Leads (V1, V2, V3)
                </span>
                <span className="text-sky-400">
                  {b.bpm} bpm · Recovery {Math.min(100, Math.round((b.hrvRmssdMs / 60) * 100))}%
                </span>
              </div>
              <div className="space-y-1.5">
                {[
                  { label: "V1", amp: 0.85, phase: 0, color: "#38bdf8" },
                  { label: "V2", amp: 1.08, phase: 0.03, color: "#22c55e" },
                  { label: "V3", amp: 0.94, phase: 0.06, color: "#2dd4bf" },
                ].map((lead) => (
                  <div key={lead.label} className="flex items-center gap-2">
                    <span className="w-6 font-mono-hud text-[10px] font-bold text-slate-400">
                      {lead.label}
                    </span>
                    <div className="flex-1 rounded border border-[#182742] bg-[#081020] px-1.5 py-0.5">
                      <LivePhysioWaveform
                        mode="ecg"
                        color={lead.color}
                        bpm={b.bpm}
                        hrvMs={b.hrvRmssdMs}
                        leadAmplitude={lead.amp}
                        phaseOffset={lead.phase}
                        width={280}
                        height={30}
                        heightClass="h-7"
                        showGrid
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Thoracic Node Signals */}
            <div className="mt-3 grid grid-cols-2 gap-2">
              <TelemetryBadge
                label="Heart Rate"
                value={`${b.bpm} bpm`}
                meta="Nominal resting band: 52–92 bpm"
                status={evaluateBpmStatus(b.bpm)}
                onClick={() => onSelectSystemZone?.("corazon")}
              />
              <TelemetryBadge
                label="Cardiac Recovery (HRV)"
                value={`${Math.min(100, Math.round((b.hrvRmssdMs / 60) * 100))}% (${b.hrvRmssdMs} ms)`}
                meta="Autonomic vagal recovery index"
                status={evaluateHrvStatus(b.hrvRmssdMs)}
                onClick={() => onSelectSystemZone?.("corazon")}
              />
              <TelemetryBadge
                label="Respiratory Rate"
                value={`${b.respiratoryRateRpm} / min`}
                meta="Calm breathing band (12–20 rpm)"
                status={evaluateRespiratoryRateStatus(b.respiratoryRateRpm)}
                onClick={() => onSelectSystemZone?.("corazon")}
              />
              <TelemetryBadge
                label="RESP · VENT (RIP)"
                value={`${b.minuteVentilationLpm.toFixed(1)} L/min · EtCO₂ ${etCo2MmHg}`}
                meta={`Physio EtCO₂ 35–45 mmHg · Cabin ECLSS: ${currentCo2.toFixed(1)} mmHg ppCO₂`}
                status={evaluateMinuteVentilationStatus(b.minuteVentilationLpm)}
                onClick={() => onSelectSystemZone?.("corazon")}
              />
              <TelemetryBadge
                label="Skin Temperature"
                value={`${b.skinTempC.toFixed(2)} °C`}
                meta="Surface chest thermistor (±0.05 °C tick)"
                status={evaluateSkinTempStatus(b.skinTempC)}
                onClick={() => onSelectSystemZone?.("abdomen")}
              />
              <TelemetryBadge
                label="Posture & Sleep"
                value={`${b.postureScore}% · ${b.sleepHours.toFixed(1)}h`}
                meta="Body posture & restorative rest"
                status={
                  evaluateSleepStatus(b.sleepHours) === "critical" ||
                  evaluatePostureStatus(b.postureScore) === "critical"
                    ? "critical"
                    : evaluateSleepStatus(b.sleepHours) === "warning" ||
                      evaluatePostureStatus(b.postureScore) === "warning"
                    ? "warning"
                    : "optimal"
                }
                onClick={() => onSelectSystemZone?.("rostro")}
              />
            </div>
          </div>
        </div>

        {/* NODE 2: Frontal Headband (4 Signs) */}
        <div className="flex flex-col justify-between rounded-2xl border border-[#1b2d4b] bg-[#0a1222] p-4 xl:col-span-4">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#182742] pb-2.5">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-sky-400/25 bg-sky-500/15 text-sky-300">
                  <Activity className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-100">
                    Frontal Node (Headband)
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Cuffless arterial BP, cranial SpO₂ & core temp
                  </p>
                </div>
              </div>
            </div>

            {/* Live Forehead Pulse Wave */}
            <div className="mt-3 rounded-xl border border-[#182742] bg-[#091120] p-2.5">
              <div className="mb-1 flex items-center justify-between font-mono-hud text-[10px]">
                <span className="font-bold text-sky-300">
                  FRONTAL PULSE · TRANSIT TIME ({b.pttMs} ms)
                </span>
                <span
                  className="font-semibold"
                  style={{ color: STATUS_HEX[evaluatePttStatus(b.pttMs)] }}
                >
                  Chest → Forehead
                </span>
              </div>
              <div className="rounded border border-[#182742] bg-[#081020] px-2 py-1">
                <LivePhysioWaveform
                  mode="ppg"
                  color="#38bdf8"
                  bpm={b.bpm}
                  pttMs={b.pttMs}
                  width={280}
                  height={34}
                  heightClass="h-8"
                  showGrid
                />
              </div>
            </div>

            {/* Frontal Headband 4 Continuous Signs */}
            <div className="mt-3 grid grid-cols-2 gap-2">
              <TelemetryBadge
                label="Arterial Blood Pressure"
                value={`${b.systolicBP}/${b.diastolicBP} mmHg`}
                meta="Cuffless continuous estimation (nominal 120/80)"
                status={evaluateBpStatus(b.systolicBP, b.diastolicBP)}
                onClick={() => onSelectSystemZone?.("corazon")}
                className="col-span-2"
              />
              <TelemetryBadge
                label="Cranial SpO₂"
                value={`${b.spo2Percent}%`}
                meta={
                  environmentId === "luna" || environmentId === "marte"
                    ? `Hypobaric ${env.cabinPressureKpa} kPa norm (94–96%)`
                    : "Arterial oxygen (nominal 95–100%)"
                }
                status={evaluateSpo2Status(b.spo2Percent, environmentId)}
                onClick={() => onSelectSystemZone?.("corazon")}
              />
              <TelemetryBadge
                label="Perfusion Index"
                value={`${b.perfusionIndex.toFixed(1)}%`}
                meta="Microvascular pulse strength"
                status={evaluatePerfusionIndexStatus(b.perfusionIndex)}
                onClick={() => onSelectSystemZone?.("corazon")}
              />
              <TelemetryBadge
                label="Core Temperature (ZHF)"
                value={`${b.bodyTempC.toFixed(2)} °C`}
                meta={
                  environmentId === "iss" || environmentId === "nave"
                    ? "0g Space Fever norm (~37.10 °C)"
                    : "Internal core temp (nominal 36.5–37.3 °C)"
                }
                status={evaluateTempStatus(b.bodyTempC)}
                onClick={() => onSelectSystemZone?.("abdomen")}
                className="col-span-2"
              />
            </div>
          </div>

          {/* Central vs Peripheral Thermal Contrast Pill */}
          <div className="mt-3 flex items-center justify-between rounded-xl border border-[#182742] bg-[#091120] px-3 py-2 text-xs">
            <span className="flex items-center gap-1.5 text-slate-300">
              <Thermometer className="h-3.5 w-3.5 text-sky-400" />
              Thermal gradient (core vs. skin):
            </span>
            <span
              className="font-mono-hud font-bold"
              style={{ color: STATUS_HEX[hemo.thermalGradientStatus] }}
            >
              {hemo.thermalGradientC.toFixed(1)} °C
            </span>
          </div>
        </div>

        {/* NODE 3: Wrist & Neck Array (2 Signs + BP Calibration) */}
        <div className="flex flex-col justify-between gap-3 rounded-2xl border border-[#1b2d4b] bg-[#0a1222] p-4 xl:col-span-3">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#182742] pb-2.5">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-amber-400/25 bg-amber-500/15 text-amber-300">
                  <Radiation className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-100">
                    Node 3: Dosimetric Wristband, Laryngeal Collar &amp; BLE Bone-Conduction Earpiece
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Radiation dosimetry, piezo vocal-cord vibration &amp; private 0g hands-free ASTRO loop
                  </p>
                </div>
              </div>
            </div>

            {/* Live Dosimetric Scintillation */}
            <div className="mt-3 rounded-xl border border-[#182742] bg-[#091120] p-2.5">
              <div className="mb-1 flex items-center justify-between font-mono-hud text-[10px]">
                <span className="font-bold text-amber-300">
                  RAD SHIELD · {Math.max(0, Math.min(100, Math.round((1 - b.dailyRadiationMsv / CSA_RADIATION_LIMITS.dailyAlertMsv) * 100)))}% SAFE
                </span>
                <span className="text-slate-400">
                  {b.dailyRadiationMsv.toFixed(2)} mSv/day
                </span>
              </div>
              <div className="rounded border border-[#182742] bg-[#081020] px-2 py-1">
                <LivePhysioWaveform
                  mode="rad"
                  color={STATUS_HEX[evaluateRadiationStatus(b.dailyRadiationMsv)]}
                  radiationMsv={b.dailyRadiationMsv}
                  width={240}
                  height={34}
                  heightClass="h-8"
                  showGrid
                />
              </div>
            </div>

            {/* Node 3 Two Signs */}
            <div className="mt-3 space-y-2">
              <TelemetryBadge
                label="RAD CSA (Exogenous)"
                value={`${Math.max(0, Math.min(100, Math.round((1 - b.dailyRadiationMsv / CSA_RADIATION_LIMITS.dailyAlertMsv) * 100)))}% safe`}
                meta={`Dose vs. NASA SRAG / ECLSS: ${b.dailyRadiationMsv.toFixed(2)} mSv/d${
                  environmentId === "marte" ? " (SPE > 5.0)" : ""
                }`}
                status={evaluateRadiationStatus(b.dailyRadiationMsv)}
                onClick={() => onSelectSystemZone?.("endocrino")}
              />
              <TelemetryBadge
                label="Vocal Equanimity"
                value={`${100 - b.facialTension}% calm`}
                meta={`Strain today: ${b.stressLevel}% · Piezo laryngeal collar (~60 dBA ECLSS noise-immune)`}
                status={evaluateStressStatus(b.stressLevel)}
                onClick={() => onSelectSystemZone?.("cerebro")}
              />
            </div>

            {/* Node 3 Two-Way Hands-Free ASTRO Audio Loop (Hardware Description, 13 Signs Intact) */}
            <div className="mt-2.5 rounded-xl border border-[#182742] bg-[#091120] p-2.5 text-[11px] leading-relaxed text-slate-300">
              <div className="flex items-center justify-between gap-1.5 font-mono-hud text-[10px] font-bold uppercase tracking-wider text-cyan-300">
                <span className="flex items-center gap-1.5">
                  <Headphones className="h-3.5 w-3.5 text-cyan-400" />
                  Two-Way Hands-Free &ldquo;ASTRO&rdquo; Audio Loop
                </span>
                <span className="rounded border border-cyan-500/30 bg-cyan-500/10 px-1.5 py-0.5 text-[9px] text-cyan-200">
                  BLE · 0g PRIVATE
                </span>
              </div>
              <ol className="mt-1.5 space-y-1 text-[10.5px] text-slate-300">
                <li>
                  <strong className="text-slate-100">1. Piezoelectric Laryngeal Collar:</strong>{" "}
                  Measures vocal fatigue via mechanical micro-vibration of the vocal cords and captures crew speech with{" "}
                  <strong className="text-emerald-300">100% immunity to ~60 dBA ambient cabin fan noise (ECLSS)</strong>.
                </li>
                <li>
                  <strong className="text-slate-100">2. Low-Power In-Ear / Bone-Conduction BLE Earpiece:</strong>{" "}
                  Delivers <strong className="text-cyan-300">&ldquo;ASTRO&rdquo;</strong> voice assistant alerts and clinical protocols privately directly to the ear, enabling hands-free triage in microgravity without waking the rest of the crew.
                </li>
              </ol>
            </div>

            {/* Calibration Age Pill */}
            <div className="mt-2.5 flex items-center justify-between rounded-xl border border-[#182742] bg-[#091120] px-3 py-2 text-xs">
              <span className="flex items-center gap-1.5 text-slate-300">
                <Mic className="h-3.5 w-3.5 text-sky-400" />
                Last BP calibration:
              </span>
              <span
                className="font-mono-hud font-bold"
                style={{ color: STATUS_HEX[calHoursStatus] }}
              >
                {b.lastOscillometricCalHours} h ago
              </span>
            </div>
          </div>

          {/* Quick BP Calibration Control */}
          <div className="rounded-xl border border-[#182742] bg-[#091120] p-3">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold text-slate-100">
                Optical BP Calibration
              </span>
              <span
                className="font-mono-hud font-semibold"
                style={{ color: STATUS_HEX[calHoursStatus] }}
              >
                {b.pttCalibrationRequired ? "Needs Sync" : "Ready"}
              </span>
            </div>
            <button
              type="button"
              onClick={handleCalibrateClick}
              className="mt-2.5 flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-sky-600 px-3 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-sky-500 active:scale-[0.98]"
            >
              <Stethoscope className="h-3.5 w-3.5" />
              Calibrate BP Monitor (30 s)
            </button>
          </div>
        </div>
      </div>

      {/* Derived Hemodynamic & Thermal Indices Strip */}
      <div className="mt-4 rounded-xl border border-[#182742] bg-[#091120] p-3.5">
        <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
          <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-100">
            <Gauge className="h-4 w-4 text-sky-400" />
            Automated Circulation & Thermal Summary (Derived by Suit)
          </h3>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${
              hemo.orthostaticAlert
                ? "border-amber-500/40 bg-amber-950/40 text-amber-200"
                : "border-emerald-500/35 bg-emerald-950/30 text-emerald-300"
            }`}
          >
            {hemo.orthostaticAlert ? (
              <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
            ) : (
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            )}
            {hemo.orthostaticAlert
              ? "Orthostatic caution on standing (syncope risk)"
              : "Low orthostatic risk during movement"}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              key: "map",
              title: "Mean Arterial Pressure",
              value: `${hemo.mapMmHg}`,
              unit: "mmHg",
              status: hemo.mapStatus,
              note: "Mean perfusion pressure to vital organs (nominal: 70–100)",
            },
            {
              key: "pp",
              title: "Pulse Pressure",
              value: `${hemo.pulsePressureMmHg}`,
              unit: "mmHg",
              status: hemo.pulsePressureStatus,
              note: "Systolic-to-diastolic stroke force (nominal: 30–50)",
            },
            {
              key: "shock",
              title: "Vascular / Volume Balance",
              value: `${Math.max(0, Math.min(100, Math.round((1 - Math.max(0, hemo.shockIndex - 0.5)) * 100)))}%`,
              unit: `(${hemo.shockIndex.toFixed(2)})`,
              status: hemo.shockStatus,
              note: "Reflects intravascular hydration & cardiac reserve",
            },
            {
              key: "thermal",
              title: "Thermal Equilibrium",
              value: hemo.thermalGradientC.toFixed(1),
              unit: "°C diff.",
              status: hemo.thermalGradientStatus,
              note: "Core-to-skin heat transfer differential",
            },
          ].map((item) => (
            <div
              key={item.key}
              className="rounded-xl border border-[#182742] bg-[#0c1426] p-3"
            >
              <div className="flex items-center justify-between gap-1.5 text-xs">
                <span className="font-semibold text-slate-300">
                  {item.title}
                </span>
                <StatusPill status={item.status} />
              </div>
              <div className="mt-1.5 flex items-baseline gap-1.5">
                <span className="font-mono-hud text-xl font-bold text-slate-100">
                  {item.value}
                </span>
                <span className="font-mono-hud text-xs text-slate-400">
                  {item.unit}
                </span>
              </div>
              <p className="mt-0.5 text-[11px] text-slate-400">{item.note}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
