"use client";

import React, { useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Gauge,
  HeartPulse,
  Mic,
  Radiation,
  ShieldCheck,
  Stethoscope,
  Thermometer,
  Watch,
  Wind,
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
  evaluateSleepStatus,
  evaluateSpo2Status,
  evaluateStressStatus,
  evaluateTempStatus,
  STATUS_HEX,
  STATUS_LABELS,
} from "@/utils/healthEngine";
import LivePhysioWaveform from "./LivePhysioWaveform";

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
      } ${className}`}
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

export default function WearableHarnessPanel({
  environmentId,
  biomarkers: b,
  onCalibrateOscillometric,
  onSelectSystemZone,
}: WearableHarnessPanelProps) {
  const [calFeedbackAt, setCalFeedbackAt] = useState<string | null>(null);

  const env = MISSION_ENVIRONMENTS[environmentId];
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
      aria-label="Prototipo Físico Único: Arnés 3N Bio-Monitor CSA"
      className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-[0_6px_24px_rgba(15,23,42,0.04)] sm:p-5"
    >
      {/* Section Header — Hardware Único Arnés 3N */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-sky-400/40 bg-sky-500/20 text-sky-300 shadow-sm">
            <Watch className="h-5 w-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 sm:text-lg">
                Prototipo Físico Único · Arnés 3N (Bio-Monitor / Astroskin CSA)
              </h2>
              <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 font-mono-hud text-[10px] font-bold uppercase tracking-wider text-[#1a73e8]">
                13 Signos Continuos (7 + 4 + 2) · 24/7
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 font-mono-hud text-[10px] font-semibold text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Hardware Único · 100% Offline
              </span>
            </div>
            <p className="mt-0.5 text-xs text-slate-500">
              Toda la captura física continua reside en los <strong>3 nodos del Arnés 3N</strong>: <strong>Nodo 1</strong> Chaleco Inteligente Torácico (7 signos), <strong>Nodo 2</strong> Vincha Cefálica Frontal (4 signos por desplazamiento cefálico de fluidos) y <strong>Nodo 3</strong> Pulsera Dosimétrica y Collar Laríngeo (2 signos). Los módulos de Cámara IA, Ultrasonido B-Mode y Registro Manual operan como flujos de software bajo demanda con equipamiento estándar de cabina.
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
                Recalibración Oscilométrica Requerida (Experimento CSA/NASA BP Reg [3, 4])
              </div>
              <p className="mt-0.5 leading-relaxed text-amber-800">
                Transición gravitatoria detectada hacia{" "}
                <strong>{env.name} ({env.gravityG}g)</strong>. El cambio en el gradiente hidrostático y la rigidez carotídea altera la velocidad de onda de pulso (PTT = {b.pttMs} ms). Ejecuta una calibración con manguito oscilométrico estándar de cabina.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleCalibrateClick}
            className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xl bg-amber-600 px-3.5 py-2 font-mono-hud text-xs font-bold text-white shadow-xs transition hover:bg-amber-700"
          >
            <Stethoscope className="h-4 w-4" />
            Calibrar Manguito (30 s)
          </button>
        </div>
      )}

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
            Guardado en bitácora
          </span>
        </div>
      )}

      {/* 3 Physical Capture Nodes Grid (7 + 4 + 2 = 13 Continuous Physiological Signs) */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        {/* NODO 1: Chaleco Inteligente Torácico (Bio-Monitor RIP + ECG 256 Hz · 7 Signos) */}
        <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-xs xl:col-span-5">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-[#1a73e8]">
                  <HeartPulse className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#0b2559]">
                    Nodo 1 · Chaleco Inteligente Torácico (7 Signos)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Bio-Monitor RIP 128 Hz + ECG Textil 256 Hz + Termistor + Acelerómetro 64 Hz
                  </p>
                </div>
              </div>
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-mono-hud text-[10px] font-bold text-emerald-700">
                7 Signos · 256 Hz
              </span>
            </div>

            {/* Signo 3: Trazado ECG de 3 Derivaciones en Vivo */}
            <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50/90 p-2.5">
              <div className="mb-1.5 flex items-center justify-between text-[10px] font-mono-hud">
                <span className="font-bold text-slate-200">
                  SIGNO #3 · TRAZADO ECG 3 DERIVACIONES (DI · DII · V5)
                </span>
                <span className="text-sky-400">
                  {b.bpm} BPM · HRV {b.hrvRmssdMs} ms
                </span>
              </div>
              <div className="space-y-1.5">
                {[
                  { label: "DI", amp: 0.85, phase: 0, color: "#38bdf8" },
                  { label: "DII", amp: 1.08, phase: 0.03, color: "#22c55e" },
                  { label: "V5", amp: 0.94, phase: 0.06, color: "#2dd4bf" },
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

            {/* Los 7 Signos del Nodo 1 (Chaleco Torácico) */}
            <div className="mt-3 grid grid-cols-2 gap-2">
              <TelemetryBadge
                label="1. Frec. Cardíaca (FC)"
                value={`${b.bpm} BPM`}
                meta="ECG Textil 256 Hz (52–92)"
                status={evaluateBpmStatus(b.bpm)}
                onClick={() => onSelectSystemZone?.("corazon")}
              />
              <TelemetryBadge
                label="2. HRV (rMSSD)"
                value={`${b.hrvRmssdMs} ms`}
                meta="Vagal autónomo (Nominal > 20 ms)"
                status={evaluateHrvStatus(b.hrvRmssdMs)}
                onClick={() => onSelectSystemZone?.("corazon")}
              />
              <TelemetryBadge
                label="4. Frec. Respiratoria"
                value={`${b.respiratoryRateRpm} rpm`}
                meta="Bandas RIP 128 Hz (12–20 rpm)"
                status={evaluateRespiratoryRateStatus(b.respiratoryRateRpm)}
                onClick={() => onSelectSystemZone?.("corazon")}
              />
              <TelemetryBadge
                label="5. Volumen Minuto"
                value={`${b.minuteVentilationLpm.toFixed(1)} L/min`}
                meta="Pletismografía RIP (5.0–8.0 L/m)"
                status={evaluateMinuteVentilationStatus(b.minuteVentilationLpm)}
                onClick={() => onSelectSystemZone?.("corazon")}
              />
              <TelemetryBadge
                label="6. Temp. Cutánea"
                value={`${b.skinTempC.toFixed(1)} °C`}
                meta="Termistor torácico (32.0–35.5 °C)"
                status={evaluateSkinTempStatus(b.skinTempC)}
                onClick={() => onSelectSystemZone?.("abdomen")}
              />
              <TelemetryBadge
                label="7. Postura y Sueño"
                value={`${b.postureScore}% · ${b.sleepHours.toFixed(1)}h`}
                meta="Acelerómetro 3 ejes 64 Hz (Meta 7–8h)"
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

        {/* NODO 2: Vincha Cefálica Frontal (PPG 64 Hz + Zero-Heat-Flux · 4 Signos) */}
        <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-xs xl:col-span-4">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-[#1a73e8]">
                  <Activity className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#0b2559]">
                    Nodo 2 · Vincha Cefálica Frontal (4 Signos)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    PPG Supraorbitario 64 Hz (PTT) + Flujo Térmico Nulo (ZHF)
                  </p>
                </div>
              </div>
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-mono-hud text-[10px] font-bold text-emerald-700">
                4 Signos · 64 Hz
              </span>
            </div>

            {/* Justificación Fisiológica: Desplazamiento Cefálico de Fluidos (Cephalad Fluid Shift) */}
            <div className="mt-3 rounded-xl border border-blue-200/80 bg-blue-50/70 p-2.5 text-[11px] leading-relaxed text-slate-700">
              <div className="flex items-center gap-1.5 font-bold text-[#0b2559]">
                <Wind className="h-3.5 w-3.5 text-[#1a73e8]" />
                Ubicación Frontal por Desplazamiento Cefálico (0g) [2, 3, 8]
              </div>
              <p className="mt-1 text-slate-600">
                En microgravedad los fluidos migran hacia la cabeza (<em>cephalad fluid shift</em>). Medir en la arteria supraorbitaria evita errores por vasoconstricción periférica y permite calcular la <strong>PA continua sin manguito por PTT ({b.pttMs} ms)</strong>.
              </p>
            </div>

            {/* Onda PPG Frontal / PTT en Vivo */}
            <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50/90 p-2.5">
              <div className="mb-1 flex items-center justify-between font-mono-hud text-[10px]">
                <span className="font-bold text-sky-300">
                  ONDA PPG FRONTAL & PTT = {b.pttMs} ms (150–250 ms)
                </span>
                <span
                  className="font-semibold"
                  style={{ color: STATUS_HEX[evaluatePttStatus(b.pttMs)] }}
                >
                  ECG tórax → PPG frente
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

            {/* Los 4 Signos Continuos de la Vincha Cefálica Frontal */}
            <div className="mt-3 grid grid-cols-2 gap-2">
              <TelemetryBadge
                label="8. PA Continua (PTT)"
                value={`${b.systolicBP}/${b.diastolicBP} mmHg`}
                meta={`PTT ${b.pttMs} ms (150–250 ms) · Sin manguito`}
                status={evaluateBpStatus(b.systolicBP, b.diastolicBP)}
                onClick={() => onSelectSystemZone?.("corazon")}
                className="col-span-2"
              />
              <TelemetryBadge
                label="9. SpO₂ Frontal"
                value={`${b.spo2Percent}%`}
                meta="PPG 64 Hz (Nominal 95–100%)"
                status={evaluateSpo2Status(b.spo2Percent)}
                onClick={() => onSelectSystemZone?.("corazon")}
              />
              <TelemetryBadge
                label="10. Perfusión (PI)"
                value={`${b.perfusionIndex.toFixed(1)}%`}
                meta="Pulso óptico (Nominal 1.0–10.0%)"
                status={evaluatePerfusionIndexStatus(b.perfusionIndex)}
                onClick={() => onSelectSystemZone?.("corazon")}
              />
              <TelemetryBadge
                label="11. Temp. Central (ZHF)"
                value={`${b.bodyTempC.toFixed(1)} °C`}
                meta="Zero-Heat-Flux craneal (36.5–37.5 °C)"
                status={evaluateTempStatus(b.bodyTempC)}
                onClick={() => onSelectSystemZone?.("abdomen")}
                className="col-span-2"
              />
            </div>
          </div>

          {/* Central vs Peripheral Thermal Contrast Pill */}
          <div className="mt-3 flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs">
            <span className="flex items-center gap-1.5 text-slate-600">
              <Thermometer className="h-3.5 w-3.5 text-sky-400" />
              Gradiente Central–Cutáneo:
            </span>
            <span
              className="font-mono-hud font-bold"
              style={{ color: STATUS_HEX[hemo.thermalGradientStatus] }}
            >
              Δ {hemo.thermalGradientC.toFixed(1)} °C
            </span>
          </div>
        </div>

        {/* NODO 3: Pulsera Dosimétrica & Collar Laríngeo (2 Signos + Calibración BP Reg) */}
        <div className="flex flex-col justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs xl:col-span-3">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-500">
                  <Radiation className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#0b2559]">
                    Nodo 3 · Pulsera & Collar Laríngeo (2 Signos)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Dosímetro MOSFET CSA + Biometría Acústica Vocal
                  </p>
                </div>
              </div>
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-mono-hud text-[10px] font-bold text-emerald-700">
                2 Signos · Activo
              </span>
            </div>

            {/* Centelleo Dosimétrico en Vivo */}
            <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50/90 p-2.5">
              <div className="mb-1 flex items-center justify-between font-mono-hud text-[10px]">
                <span className="font-bold text-amber-300">
                  DOSÍMETRO CSA · {b.dailyRadiationMsv.toFixed(2)} mSv/d
                </span>
                <span className="text-slate-400">
                  Lím. {CSA_RADIATION_LIMITS.careerLimitMsv} mSv
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

            {/* Los 2 Signos del Nodo 3 */}
            <div className="mt-3 space-y-2">
              <TelemetryBadge
                label="12. Radiación Ionizante CSA"
                value={`${b.dailyRadiationMsv.toFixed(2)} mSv/d`}
                meta={`Acum: ${b.cumulativeRadiationMsv.toFixed(1)}/${CSA_RADIATION_LIMITS.careerLimitMsv} mSv (Nominal ≤ ${CSA_RADIATION_LIMITS.dailyNominalMsv} · Alerta ≥ ${CSA_RADIATION_LIMITS.dailyAlertMsv})`}
                status={evaluateRadiationStatus(b.dailyRadiationMsv)}
                onClick={() => onSelectSystemZone?.("endocrino")}
              />
              <TelemetryBadge
                label="13. Biometría Acústica Vocal"
                value={`Estrés ${b.stressLevel}% · Voz ${100 - b.facialTension}%`}
                meta="Vibración laríngea sin micrófono abierto (BHP [10, 13])"
                status={evaluateStressStatus(b.stressLevel)}
                onClick={() => onSelectSystemZone?.("cerebro")}
              />
            </div>

            {/* Indicador de Edad de Calibración PTT */}
            <div className="mt-2.5 flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs">
              <span className="flex items-center gap-1.5 text-slate-600">
                <Mic className="h-3.5 w-3.5 text-[#1a73e8]" />
                Deriva PTT desde calibración:
              </span>
              <span
                className="font-mono-hud font-bold"
                style={{ color: STATUS_HEX[calHoursStatus] }}
              >
                {b.lastOscillometricCalHours} h
              </span>
            </div>
          </div>

          {/* Calibración Oscilométrica de Referencia (Experimento CSA BP Reg) */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold text-[#0b2559]">
                Calibración Oscilométrica (BP Reg [3])
              </span>
              <span
                className="font-mono-hud font-semibold"
                style={{ color: STATUS_HEX[calHoursStatus] }}
              >
                {b.pttCalibrationRequired ? "Requiere ajuste" : "Calibrado"}
              </span>
            </div>
            <p className="mt-1 text-[10px] leading-snug text-slate-500">
              Al cambiar de 0.00g a gravedad parcial (Luna 0.16g / Marte 0.38g), recalibra el PTT del Arnés 3N contra manguito de cabina.
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

      {/* Derived Hemodynamic & Thermal Indices Strip */}
      <div className="mt-4 rounded-xl border border-slate-200/90 bg-slate-50/75 p-3.5">
        <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
          <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#0b2559]">
            <Gauge className="h-4 w-4 text-[#1a73e8]" />
            Índices Hemodinámicos Derivados del Arnés 3N (Cálculo Autónomo ExMC [4, 5])
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

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              key: "map",
              title: "Presión Arterial Media (PAM)",
              value: `${hemo.mapMmHg}`,
              unit: "mmHg",
              status: hemo.mapStatus,
              note: "PAD + (PAS - PAD)/3 · Nominal: 70–100 mmHg",
            },
            {
              key: "pp",
              title: "Presión de Pulso (PAS - PAD)",
              value: `${hemo.pulsePressureMmHg}`,
              unit: "mmHg",
              status: hemo.pulsePressureStatus,
              note: "Nominal: 30–50 mmHg · Alerta < 25 mmHg",
            },
            {
              key: "shock",
              title: "Índice de Shock (FC / PAS)",
              value: hemo.shockIndex.toFixed(2),
              unit: "ratio",
              status: hemo.shockStatus,
              note: "Nominal: 0.50–0.70 · Crítico ≥ 0.90",
            },
            {
              key: "thermal",
              title: "Gradiente Térmico (Frente–Tórax)",
              value: hemo.thermalGradientC.toFixed(1),
              unit: "°C",
              status: hemo.thermalGradientStatus,
              note: "Nominal: 1.0–4.2 °C · Vasoconstricción ≥ 5.8 °C",
            },
          ].map((item) => (
            <div
              key={item.key}
              className="rounded-xl border border-slate-200 bg-white p-3"
            >
              <div className="flex items-center justify-between gap-1.5 text-xs">
                <span className="font-semibold text-slate-700">
                  {item.title}
                </span>
                <span
                  className="shrink-0 rounded-full px-2 py-0.5 font-mono-hud text-[10px] font-bold uppercase"
                  style={{
                    backgroundColor: `${STATUS_HEX[item.status]}1a`,
                    color: STATUS_HEX[item.status],
                  }}
                >
                  {STATUS_LABELS[item.status]}
                </span>
              </div>
              <div className="mt-1.5 flex items-baseline gap-1.5">
                <span className="font-mono-hud text-xl font-bold text-slate-900">
                  {item.value}
                </span>
                <span className="font-mono-hud text-xs text-slate-500">
                  {item.unit}
                </span>
              </div>
              <p className="mt-0.5 text-[11px] text-slate-500">{item.note}</p>
            </div>
          ))}
        </div>

        <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
          <span className="flex items-center gap-1.5">
            <Cpu className="h-3.5 w-3.5 text-[#1a73e8]" />
            Hardware único: Arnés 3N (Chaleco Torácico · Vincha Cefálica · Pulsera/Collar) 100% autónomo.
          </span>
          <span className="flex items-center gap-1 font-mono-hud text-slate-600">
            <Radiation className="h-3.5 w-3.5 text-amber-600" />
            PTT calibrado: {b.pttMs} ms
          </span>
        </div>
      </div>
    </section>
  );
}
