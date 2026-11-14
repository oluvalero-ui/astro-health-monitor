"use client";

import React, { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Gauge,
  HeartPulse,
  Radiation,
  Radio,
  ShieldCheck,
  Stethoscope,
  Thermometer,
  Watch,
  Wind,
  Zap,
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
  evaluateSpo2Status,
  evaluateTempStatus,
  STATUS_HEX,
  STATUS_LABELS,
} from "@/utils/healthEngine";

interface WearableHarnessPanelProps {
  environmentId: MissionEnvironmentId;
  biomarkers: BiomarkerData;
  onCalibrateOscillometric: () => void;
  onSelectSystemZone?: (zone: SystemZoneId) => void;
}

interface TelemetryBadgeProps {
  label: string;
  value: string;
  meta: string;
  status: HealthStatus;
  onClick?: () => void;
}

function TelemetryBadge({
  label,
  value,
  meta,
  status,
  onClick,
}: TelemetryBadgeProps) {
  const hex = STATUS_HEX[status];
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
      className={`rounded-xl border border-slate-200/90 bg-slate-50/75 p-2.5 transition ${
        onClick ? "cursor-pointer hover:border-blue-300 hover:bg-white" : ""
      }`}
    >
      <div className="flex items-center justify-between gap-1.5">
        <span className="truncate text-[11px] font-semibold text-slate-700">
          {label}
        </span>
        <span
          className="shrink-0 rounded-full px-1.5 py-0.5 font-mono-hud text-[9px] font-bold uppercase"
          style={{
            backgroundColor: `${hex}1a`,
            color: hex,
          }}
        >
          {STATUS_LABELS[status]}
        </span>
      </div>
      <div className="mt-1 font-mono-hud text-base font-bold text-slate-900">
        {value}
      </div>
      <div className="mt-0.5 truncate text-[10px] text-slate-500">{meta}</div>
    </div>
  );
}

/**
 * Generates deterministic 3-lead P-QRS-T ECG SVG polyline points from live BPM and HRV.
 */
function buildEcgTrace(
  bpm: number,
  hrvMs: number,
  leadAmplitude: number,
  phaseShift: number
): string {
  const width = 320;
  const baseline = 26;
  const cycles = Math.max(2, Math.min(4.8, bpm / 32));
  const hrvMod = Math.max(0.85, Math.min(1.15, hrvMs / 42));
  const points: string[] = [];

  for (let x = 0; x <= width; x += 2) {
    const rawPhase = ((x / width) * cycles + phaseShift) % 1;
    const p = rawPhase < 0 ? rawPhase + 1 : rawPhase;

    // Gaussian P, Q, R, S, T morphological components (deterministic, no randomness)
    const pWave = 3.2 * Math.exp(-Math.pow((p - 0.16) / 0.045, 2));
    const qDip = -3.8 * Math.exp(-Math.pow((p - 0.27) / 0.015, 2));
    const rPeak = 18.5 * Math.exp(-Math.pow((p - 0.3) / 0.016, 2));
    const sDip = -5.4 * Math.exp(-Math.pow((p - 0.335) / 0.017, 2));
    const tWave =
      5.2 * hrvMod * Math.exp(-Math.pow((p - 0.54) / 0.065, 2));

    const y = baseline - (pWave + qDip + rPeak + sDip + tWave) * leadAmplitude;
    points.push(`${x},${y.toFixed(1)}`);
  }

  return points.join(" ");
}

/**
 * Generates deterministic frontal PPG arterial pulse wave shifted by PTT relative to ECG.
 */
function buildPpgTrace(bpm: number, pttMs: number): string {
  const width = 300;
  const baseline = 34;
  const cycles = Math.max(2, Math.min(4.5, bpm / 34));
  const delayPhase = (pttMs - 140) / 420;
  const points: string[] = [];

  for (let x = 0; x <= width; x += 2) {
    const shifted = ((x / width) * cycles - delayPhase) % 1;
    const p = shifted < 0 ? shifted + 1 : shifted;
    const systolicPeak = 22 * Math.exp(-Math.pow((p - 0.32) / 0.11, 2));
    const dicroticNotch = 9.5 * Math.exp(-Math.pow((p - 0.56) / 0.12, 2));
    const y = baseline - (systolicPeak + dicroticNotch);
    points.push(`${x},${y.toFixed(1)}`);
  }

  return points.join(" ");
}

export default function WearableHarnessPanel({
  environmentId,
  biomarkers: b,
  onCalibrateOscillometric,
  onSelectSystemZone,
}: WearableHarnessPanelProps) {
  const [calFeedbackAt, setCalFeedbackAt] = useState<string | null>(null);

  const env = MISSION_ENVIRONMENTS[environmentId];
  const hemo = computeHemodynamicIndices(b, environmentId);

  const vocalStressIndex = Math.round((b.facialTension + b.stressLevel) / 2);
  const vocalStatus: HealthStatus =
    vocalStressIndex >= 72
      ? "critical"
      : vocalStressIndex >= 46
      ? "warning"
      : "optimal";
  const vocalLabel =
    vocalStatus === "critical"
      ? "Estrés Vocal Agudo"
      : vocalStatus === "warning"
      ? "Tensión Laríngea Moderada"
      : "Prosodia Estable";

  const leadIPoints = useMemo(
    () => buildEcgTrace(b.bpm, b.hrvRmssdMs, 0.85, 0),
    [b.bpm, b.hrvRmssdMs]
  );
  const leadIIPoints = useMemo(
    () => buildEcgTrace(b.bpm, b.hrvRmssdMs, 1.08, 0.04),
    [b.bpm, b.hrvRmssdMs]
  );
  const leadV5Points = useMemo(
    () => buildEcgTrace(b.bpm, b.hrvRmssdMs, 0.94, 0.08),
    [b.bpm, b.hrvRmssdMs]
  );
  const ppgWavePoints = useMemo(
    () => buildPpgTrace(b.bpm, b.pttMs),
    [b.bpm, b.pttMs]
  );

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
      aria-label="Red de Área Corporal Vestible Bio-Monitor CSA"
      className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-[0_6px_24px_rgba(15,23,42,0.04)] sm:p-5"
    >
      {/* Section Header */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0b2559] text-white shadow-sm">
            <Watch className="h-5 w-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 sm:text-lg">
                Prototipo 2 · Red de Área Corporal Vestible (Bio-Monitor / Astroskin CSA)
              </h2>
              <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 font-mono-hud text-[10px] font-bold uppercase tracking-wider text-[#1a73e8]">
                13 Signos Continuos 24/7
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 font-mono-hud text-[10px] font-semibold text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                3 Nodos Activos Offline
              </span>
            </div>
            <p className="mt-0.5 text-xs text-slate-500">
              Adquisición continua sin cables ni conexión a Tierra mediante chaleco textil RIP/ECG, vincha óptica frontal PPG + flujo térmico nulo y pulsera dosimétrica.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 font-mono-hud">
            <span className="text-slate-500">Entorno: </span>
            <span className="font-bold text-[#0b2559]">{env.shortName}</span>
            <span className="text-slate-400"> · {env.gravityLabel}</span>
          </div>
        </div>
      </div>

      {/* Amber Gravity / BP Reg Calibration Banner */}
      {b.pttCalibrationRequired && (
        <div
          role="alert"
          className="mb-4 flex flex-col justify-between gap-3 rounded-xl border border-amber-300 bg-amber-50 p-3.5 text-xs text-amber-950 sm:flex-row sm:items-center"
        >
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div>
              <div className="font-bold text-amber-900">
                Recalibración Oscilométrica Requerida (Protocolo CSA BP Reg)
              </div>
              <p className="mt-0.5 leading-relaxed text-amber-800">
                {environmentId === "luna" || environmentId === "marte"
                  ? `La transición gravitacional hacia ${env.shortName} (${env.gravityLabel}) altera el gradiente hidrostático y la rigidez arterial carotídea. Calibra el Tiempo de Tránsito de Pulso (PTT) con manguito oscilométrico antes de autorizar una salida EVA.`
                  : `Han transcurrido ${b.lastOscillometricCalHours} h desde la última referencia oscilométrica (límite: 24 h). Realiza una recalibración breve de 30 s para corregir la deriva del PTT.`}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCalibrateClick}
            className="inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-amber-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-amber-700"
          >
            <Zap className="h-3.5 w-3.5" />
            Calibrar Manguito Ahora
          </button>
        </div>
      )}

      {/* Immediate Calibration Confirmation Notice */}
      {calFeedbackAt && !b.pttCalibrationRequired && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs text-emerald-900">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>
              <strong>Calibración Oscilométrica Completada ({calFeedbackAt}):</strong>{" "}
              Línea base PTT sincronizada a{" "}
              <span className="font-mono-hud font-bold">{b.pttMs} ms</span> · Deriva reiniciada a{" "}
              <span className="font-mono-hud font-bold">0 h</span>.
            </span>
          </div>
          <span className="rounded-full bg-emerald-600 px-2.5 py-0.5 font-mono-hud text-[11px] font-bold text-white">
            +15 XP Gamificación
          </span>
        </div>
      )}

      {/* 3 Physical Capture Nodes Grid */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        {/* NODE 1: Smart Thoracic Vest (6 Continuous Signs + 3-Lead ECG SVG) */}
        <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-xs xl:col-span-5">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-[#1a73e8]">
                  <HeartPulse className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#0b2559]">
                    Nodo 1 · Chaleco Inteligente Torácico
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Bio-Monitor RIP + ECG Textil 3 Derivaciones
                  </p>
                </div>
              </div>
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-mono-hud text-[10px] font-bold text-emerald-700">
                Activo · 256 Hz / 128 Hz
              </span>
            </div>

            {/* Deterministic 3-Lead ECG Trace */}
            <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50/90 p-2.5">
              <div className="mb-1.5 flex items-center justify-between text-[10px] font-mono-hud">
                <span className="font-bold text-[#0b2559]">
                  ECG TEXTIL 3 DERIVACIONES (I · II · V5)
                </span>
                <span className="text-[#1a73e8]">
                  {b.bpm} BPM · HRV {b.hrvRmssdMs} ms
                </span>
              </div>
              <div className="space-y-1">
                {[
                  { label: "DI", points: leadIPoints, color: "#1a73e8" },
                  { label: "DII", points: leadIIPoints, color: "#059669" },
                  { label: "V5", points: leadV5Points, color: "#4f46e5" },
                ].map((lead) => (
                  <div key={lead.label} className="flex items-center gap-2">
                    <span className="w-6 font-mono-hud text-[10px] font-bold text-slate-500">
                      {lead.label}
                    </span>
                    <svg
                      viewBox="0 0 320 40"
                      className="h-8 w-full rounded border border-slate-200/70 bg-white"
                      aria-label={`Trazado ECG derivación ${lead.label}`}
                    >
                      <line
                        x1="0"
                        y1="26"
                        x2="320"
                        y2="26"
                        stroke="#f1f5f9"
                        strokeWidth="1"
                      />
                      <polyline
                        fill="none"
                        stroke={lead.color}
                        strokeWidth="1.6"
                        strokeLinejoin="round"
                        points={lead.points}
                      />
                    </svg>
                  </div>
                ))}
              </div>
            </div>

            {/* 6 Continuous Thoracic Parameters */}
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
              <TelemetryBadge
                label="Frec. Cardíaca"
                value={`${b.bpm} BPM`}
                meta="ECG Textil 256 Hz"
                status={evaluateBpmStatus(b.bpm)}
                onClick={() => onSelectSystemZone?.("corazon")}
              />
              <TelemetryBadge
                label="HRV (rMSSD)"
                value={`${b.hrvRmssdMs} ms`}
                meta="Nominal > 20 ms"
                status={evaluateHrvStatus(b.hrvRmssdMs)}
                onClick={() => onSelectSystemZone?.("corazon")}
              />
              <TelemetryBadge
                label="Frec. Respiratoria"
                value={`${b.respiratoryRateRpm} rpm`}
                meta="RIP 128 Hz (12–20)"
                status={evaluateRespiratoryRateStatus(b.respiratoryRateRpm)}
                onClick={() => onSelectSystemZone?.("corazon")}
              />
              <TelemetryBadge
                label="Volumen Minuto"
                value={`${b.minuteVentilationLpm.toFixed(1)} L/m`}
                meta="RIP Torácico (5–8)"
                status={evaluateMinuteVentilationStatus(b.minuteVentilationLpm)}
                onClick={() => onSelectSystemZone?.("corazon")}
              />
              <TelemetryBadge
                label="Temp. Cutánea"
                value={`${b.skinTempC.toFixed(1)} °C`}
                meta="Termistor 1 Hz (32–35.5)"
                status={evaluateSkinTempStatus(b.skinTempC)}
                onClick={() => onSelectSystemZone?.("abdomen")}
              />
              <TelemetryBadge
                label="Postura Axial"
                value={`${b.postureScore}/100`}
                meta="Acelerómetro 64 Hz"
                status={evaluatePostureStatus(b.postureScore)}
                onClick={() => onSelectSystemZone?.("rostro")}
              />
            </div>
          </div>
        </div>

        {/* NODE 2: Frontal Cephalic Headband (5 Continuous Signs + PTT PPG Wave) */}
        <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-xs xl:col-span-4">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                  <Activity className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#0b2559]">
                    Nodo 2 · Vincha Cefálica Frontal
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    PPG Óptico 64 Hz + Flujo Térmico Nulo (ZHF)
                  </p>
                </div>
              </div>
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-mono-hud text-[10px] font-bold text-emerald-700">
                Activo · 64 Hz
              </span>
            </div>

            {/* Cephalad Fluid Shift Rationale Card */}
            <div className="mt-3 rounded-xl border border-blue-200/80 bg-blue-50/70 p-2.5 text-[11px] leading-relaxed text-slate-700">
              <div className="flex items-center gap-1.5 font-bold text-[#0b2559]">
                <Wind className="h-3.5 w-3.5 text-[#1a73e8]" />
                Ubicación Frontal por Desplazamiento Cefálico de Fluidos
              </div>
              <p className="mt-1 text-slate-600">
                En microgravedad (~2 L de líquido migran de piernas a cabeza y disminuye el pulso periférico en dedos), el sensor frontal sobre la arteria supraorbitaria garantiza señal PPG estable sin estorbar guantes ni tareas EVA.
              </p>
            </div>

            {/* Deterministic PPG + PTT Transit Strip */}
            <div className="mt-2.5 rounded-xl border border-slate-200 bg-slate-50/90 p-2.5">
              <div className="mb-1 flex items-center justify-between font-mono-hud text-[10px]">
                <span className="font-bold text-indigo-900">
                  ONDA PPG FRONTAL · PTT = {b.pttMs} ms
                </span>
                <span
                  className="font-semibold"
                  style={{ color: STATUS_HEX[evaluatePttStatus(b.pttMs)] }}
                >
                  ECG pecho → PPG frente
                </span>
              </div>
              <svg
                viewBox="0 0 300 42"
                className="h-10 w-full rounded border border-slate-200/70 bg-white"
                aria-label="Onda de pulso PPG frontal y tiempo de tránsito PTT"
              >
                <line
                  x1="0"
                  y1="34"
                  x2="300"
                  y2="34"
                  stroke="#f1f5f9"
                  strokeWidth="1"
                />
                <polyline
                  fill="none"
                  stroke="#6366f1"
                  strokeWidth="1.9"
                  strokeLinejoin="round"
                  points={ppgWavePoints}
                />
              </svg>
            </div>

            {/* 5 Continuous Frontal Parameters */}
            <div className="mt-3 grid grid-cols-2 gap-2">
              <TelemetryBadge
                label="PA Continua (vía PTT)"
                value={`${b.systolicBP}/${b.diastolicBP} mmHg`}
                meta={`PTT ${b.pttMs} ms · Sin manguito`}
                status={evaluateBpStatus(b.systolicBP, b.diastolicBP)}
                onClick={() => onSelectSystemZone?.("corazon")}
              />
              <TelemetryBadge
                label="SpO₂ Arterial"
                value={`${b.spo2Percent}%`}
                meta="PPG 64 Hz (Alerta < 92%)"
                status={evaluateSpo2Status(b.spo2Percent)}
                onClick={() => onSelectSystemZone?.("corazon")}
              />
              <TelemetryBadge
                label="Índice Perfusión (PI)"
                value={`${b.perfusionIndex.toFixed(1)}%`}
                meta="Óptico 64 Hz (Alerta < 0.5%)"
                status={evaluatePerfusionIndexStatus(b.perfusionIndex)}
                onClick={() => onSelectSystemZone?.("corazon")}
              />
              <TelemetryBadge
                label="Temp. Central (ZHF)"
                value={`${b.bodyTempC.toFixed(1)} °C`}
                meta="Zero-Heat-Flux 1 Hz"
                status={evaluateTempStatus(b.bodyTempC)}
                onClick={() => onSelectSystemZone?.("abdomen")}
              />
            </div>
          </div>
        </div>

        {/* NODE 3: Wristband & Laryngeal Collar + Derived Hemodynamics & Cuff Calibration */}
        <div className="flex flex-col justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs xl:col-span-3">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
                  <Radio className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#0b2559]">
                    Nodo 3 · Pulsera y Collar
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Radi-N2 / MOSFET + Acústica 16 kHz
                  </p>
                </div>
              </div>
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-mono-hud text-[10px] font-bold text-emerald-700">
                Activo · 1 Hz
              </span>
            </div>

            {/* 2 Continuous Node 3 Parameters */}
            <div className="mt-3 space-y-2">
              <TelemetryBadge
                label="Dosimetría Radiación (MOSFET)"
                value={`${b.dailyRadiationMsv.toFixed(2)} mSv/d`}
                meta={`Acum: ${b.cumulativeRadiationMsv.toFixed(1)}/${CSA_RADIATION_LIMITS.careerLimitMsv} mSv · ${CSA_RADIATION_LIMITS.instrumentName}`}
                status={evaluateRadiationStatus(b.dailyRadiationMsv)}
                onClick={() => onSelectSystemZone?.("endocrino")}
              />
              <TelemetryBadge
                label="Collar Laríngeo (Estrés Vocal)"
                value={`${vocalStressIndex}/100`}
                meta={`${vocalLabel} · Análisis acústico local`}
                status={vocalStatus}
                onClick={() => onSelectSystemZone?.("cerebro")}
              />
            </div>

            {/* Cuff Calibration Age Indicator */}
            <div className="mt-2.5 flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs">
              <span className="flex items-center gap-1.5 text-slate-600">
                <Thermometer className="h-3.5 w-3.5 text-[#1a73e8]" />
                Última calibración PTT:
              </span>
              <span
                className="font-mono-hud font-bold"
                style={{ color: STATUS_HEX[calHoursStatus] }}
              >
                {b.lastOscillometricCalHours} h
              </span>
            </div>
          </div>

          {/* Interactive Cuff Calibration CTA */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold text-[#0b2559]">
                Manguito Oscilométrico
              </span>
              <span
                className="font-mono-hud font-semibold"
                style={{ color: STATUS_HEX[calHoursStatus] }}
              >
                {b.pttCalibrationRequired ? "Requiere ajuste" : "Calibrado"}
              </span>
            </div>
            <p className="mt-1 text-[10px] leading-snug text-slate-500">
              Sincroniza la ecuación PTT pecho-frente contra lectura oscilométrica absoluta de brazo (+15 XP).
            </p>
            <button
              type="button"
              onClick={handleCalibrateClick}
              className="mt-2.5 flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-[#1a73e8] px-3 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-blue-700 active:scale-[0.98]"
            >
              <Stethoscope className="h-3.5 w-3.5" />
              Calibrar Manguito Oscilométrico (30 s)
            </button>
          </div>
        </div>
      </div>

      {/* Derived Hemodynamic Indices Strip */}
      <div className="mt-4 rounded-xl border border-slate-200/90 bg-slate-50/75 p-3.5">
        <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
          <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#0b2559]">
            <Gauge className="h-4 w-4 text-[#1a73e8]" />
            Índices Hemodinámicos Derivados en Tiempo Real (Sin Conexión a Tierra)
          </h3>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${
              hemo.orthostaticAlert
                ? "border-amber-300 bg-amber-50 text-amber-800"
                : "border-emerald-200 bg-emerald-50 text-emerald-700"
            }`}
          >
            {hemo.orthostaticAlert ? (
              <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
            ) : (
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            )}
            {hemo.orthostaticAlert
              ? "Alerta Ortostática (Gravedad Parcial / Calibración)"
              : "Estabilidad Ortostática Nominal"}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {/* PAM */}
          <div className="rounded-xl border border-slate-200 bg-white p-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">
                Presión Arterial Media (PAM)
              </span>
              <span
                className="rounded-full px-2 py-0.5 font-mono-hud text-[10px] font-bold uppercase"
                style={{
                  backgroundColor: `${STATUS_HEX[hemo.mapStatus]}1a`,
                  color: STATUS_HEX[hemo.mapStatus],
                }}
              >
                {STATUS_LABELS[hemo.mapStatus]}
              </span>
            </div>
            <div className="mt-1.5 flex items-baseline gap-1.5">
              <span className="font-mono-hud text-xl font-bold text-slate-900">
                {hemo.mapMmHg}
              </span>
              <span className="font-mono-hud text-xs text-slate-500">mmHg</span>
            </div>
            <p className="mt-0.5 text-[11px] text-slate-500">
              Nominal: 70–100 mmHg · Crítico &lt; 65 mmHg
            </p>
          </div>

          {/* Pulse Pressure */}
          <div className="rounded-xl border border-slate-200 bg-white p-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">
                Presión de Pulso
              </span>
              <span
                className="rounded-full px-2 py-0.5 font-mono-hud text-[10px] font-bold uppercase"
                style={{
                  backgroundColor: `${STATUS_HEX[hemo.pulsePressureStatus]}1a`,
                  color: STATUS_HEX[hemo.pulsePressureStatus],
                }}
              >
                {STATUS_LABELS[hemo.pulsePressureStatus]}
              </span>
            </div>
            <div className="mt-1.5 flex items-baseline gap-1.5">
              <span className="font-mono-hud text-xl font-bold text-slate-900">
                {hemo.pulsePressureMmHg}
              </span>
              <span className="font-mono-hud text-xs text-slate-500">mmHg</span>
            </div>
            <p className="mt-0.5 text-[11px] text-slate-500">
              Nominal: 30–50 mmHg · Alerta &lt; 25 mmHg
            </p>
          </div>

          {/* Shock Index */}
          <div className="rounded-xl border border-slate-200 bg-white p-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">
                Índice de Shock (FC / PAS)
              </span>
              <span
                className="rounded-full px-2 py-0.5 font-mono-hud text-[10px] font-bold uppercase"
                style={{
                  backgroundColor: `${STATUS_HEX[hemo.shockStatus]}1a`,
                  color: STATUS_HEX[hemo.shockStatus],
                }}
              >
                {STATUS_LABELS[hemo.shockStatus]}
              </span>
            </div>
            <div className="mt-1.5 flex items-baseline gap-1.5">
              <span className="font-mono-hud text-xl font-bold text-slate-900">
                {hemo.shockIndex.toFixed(2)}
              </span>
              <span className="font-mono-hud text-xs text-slate-500">
                ratio
              </span>
            </div>
            <p className="mt-0.5 text-[11px] text-slate-500">
              Nominal: 0.50–0.70 · Crítico ≥ 0.90
            </p>
          </div>
        </div>

        <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
          <span className="flex items-center gap-1.5">
            <Cpu className="h-3.5 w-3.5 text-[#1a73e8]" />
            Procesamiento local determinístico del bus corporal CSA (sin envío continuo de datos crudos a la nube).
          </span>
          <span className="flex items-center gap-1 font-mono-hud text-slate-600">
            <Radiation className="h-3.5 w-3.5 text-amber-600" />
            PTT calibrado base: {b.pttMs} ms
          </span>
        </div>
      </div>
    </section>
  );
}
