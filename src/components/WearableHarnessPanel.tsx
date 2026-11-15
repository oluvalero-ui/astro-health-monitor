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
                Tu Traje de Sensores · Arnés 3N (3 Partes del Cuerpo)
              </h2>
              <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 font-mono-hud text-[10px] font-bold uppercase tracking-wider text-[#1a73e8]">
                13 Signos en Vivo (7 + 4 + 2) · 24/7
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 font-mono-hud text-[10px] font-semibold text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Funciona sin Internet
              </span>
            </div>
            <p className="mt-0.5 text-xs text-slate-500">
              Este traje mide tu salud todo el día en <strong>3 partes</strong>: <strong>1. Chaleco en el Pecho</strong> (corazón, aire y descanso), <strong>2. Banda en la Frente</strong> (presión, oxígeno y calor) y <strong>3. Pulsera y Cuello</strong> (protección de radiación y calma al hablar).
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 font-mono-hud">
            <span className="text-slate-500">Lugar: </span>
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
                Conviene ajustar el medidor de presión por el cambio de gravedad
              </div>
              <p className="mt-0.5 leading-relaxed text-amber-800">
                Llegaste a <strong>{env.name} ({env.gravityG}g)</strong> y la sangre baja diferente por tu cuerpo. Presiona el botón para comparar tu traje con el brazalete de presión de la nave en 30 segundos.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleCalibrateClick}
            className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xl bg-amber-600 px-3.5 py-2 font-mono-hud text-xs font-bold text-white shadow-xs transition hover:bg-amber-700"
          >
            <Stethoscope className="h-4 w-4" />
            Ajustar Presión (30 s)
          </button>
        </div>
      )}

      {calFeedbackAt && !b.pttCalibrationRequired && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs text-emerald-900">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>
              <strong>Medidor de presión listo ({calFeedbackAt}):</strong>{" "}
              Tu banda de la frente quedó bien ajustada para medir tu presión sin apretar el brazo.
            </span>
          </div>
          <span className="rounded-full bg-emerald-600 px-2.5 py-0.5 font-mono-hud text-[11px] font-bold text-white">
            Guardado
          </span>
        </div>
      )}

      {/* 3 Physical Capture Nodes Grid (7 + 4 + 2 = 13 Continuous Physiological Signs) */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        {/* NODO 1: Chaleco en el Pecho (7 Signos) */}
        <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-xs xl:col-span-5">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-[#1a73e8]">
                  <HeartPulse className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#0b2559]">
                    Parte 1 · Chaleco en el Pecho (7 Mediciones)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Escucha tus latidos, tu respiración, el calor de tu piel y tu descanso
                  </p>
                </div>
              </div>
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-mono-hud text-[10px] font-bold text-emerald-700">
                7 Signos · En vivo
              </span>
            </div>

            {/* Signo 3: Dibujo de tus Latidos en Vivo */}
            <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50/90 p-2.5">
              <div className="mb-1.5 flex items-center justify-between text-[10px] font-mono-hud">
                <span className="font-bold text-slate-200">
                  3. DIBUJO DE TUS LATIDOS EN VIVO (3 VISTAS DEL CORAZÓN)
                </span>
                <span className="text-sky-400">
                  {b.bpm} lat/min · Descanso {Math.min(100, Math.round((b.hrvRmssdMs / 60) * 100))}%
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

            {/* Los 7 Signos del Nodo 1 (Chaleco Torácico) */}
            <div className="mt-3 grid grid-cols-2 gap-2">
              <TelemetryBadge
                label="1. Latidos del Corazón"
                value={`${b.bpm} lat/min`}
                meta="Lo normal en calma es 52 a 92"
                status={evaluateBpmStatus(b.bpm)}
                onClick={() => onSelectSystemZone?.("corazon")}
              />
              <TelemetryBadge
                label="2. Descanso del Corazón"
                value={`${Math.min(100, Math.round((b.hrvRmssdMs / 60) * 100))}% (${b.hrvRmssdMs} ms)`}
                meta="Qué tan relajado late tu corazón"
                status={evaluateHrvStatus(b.hrvRmssdMs)}
                onClick={() => onSelectSystemZone?.("corazon")}
              />
              <TelemetryBadge
                label="4. Veces que Respiras"
                value={`${b.respiratoryRateRpm} / min`}
                meta="Respiraciones tranquilas (12 a 20)"
                status={evaluateRespiratoryRateStatus(b.respiratoryRateRpm)}
                onClick={() => onSelectSystemZone?.("corazon")}
              />
              <TelemetryBadge
                label="5. Aire que Entra al Pecho"
                value={`${b.minuteVentilationLpm.toFixed(1)} L/min`}
                meta="Cantidad de aire por minuto (5 a 8 L)"
                status={evaluateMinuteVentilationStatus(b.minuteVentilationLpm)}
                onClick={() => onSelectSystemZone?.("corazon")}
              />
              <TelemetryBadge
                label="6. Calor en la Piel"
                value={`${b.skinTempC.toFixed(1)} °C`}
                meta="Temperatura por fuera del pecho"
                status={evaluateSkinTempStatus(b.skinTempC)}
                onClick={() => onSelectSystemZone?.("abdomen")}
              />
              <TelemetryBadge
                label="7. Postura y Sueño"
                value={`${b.postureScore}% · ${b.sleepHours.toFixed(1)}h`}
                meta="Posición del cuerpo y horas dormidas"
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

        {/* NODO 2: Banda en la Frente (4 Signos) */}
        <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-xs xl:col-span-4">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-[#1a73e8]">
                  <Activity className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#0b2559]">
                    Parte 2 · Banda en la Frente (4 Mediciones)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Mide tu presión sin apretar el brazo, el oxígeno y tu fiebre
                  </p>
                </div>
              </div>
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-mono-hud text-[10px] font-bold text-emerald-700">
                4 Signos · En vivo
              </span>
            </div>

            {/* Explicación sencilla de por qué va en la frente */}
            <div className="mt-3 rounded-xl border border-blue-200/80 bg-blue-50/70 p-2.5 text-[11px] leading-relaxed text-slate-700">
              <div className="flex items-center gap-1.5 font-bold text-[#0b2559]">
                <Wind className="h-3.5 w-3.5 text-[#1a73e8]" />
                ¿Por qué se mide en la frente en el espacio?
              </div>
              <p className="mt-1 text-slate-600">
                Sin gravedad, la sangre sube hacia la cabeza y las manos se enfrían. La banda en la frente mide tu <strong>oxígeno y tu presión sin usar brazalete</strong> con mucha más precisión.
              </p>
            </div>

            {/* Onda de Pulso en la Frente en Vivo */}
            <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50/90 p-2.5">
              <div className="mb-1 flex items-center justify-between font-mono-hud text-[10px]">
                <span className="font-bold text-sky-300">
                  PULSO EN LA FRENTE · PASO DE SANGRE ({b.pttMs} ms)
                </span>
                <span
                  className="font-semibold"
                  style={{ color: STATUS_HEX[evaluatePttStatus(b.pttMs)] }}
                >
                  Pecho → Frente
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

            {/* Los 4 Signos Continuos de la Banda en la Frente */}
            <div className="mt-3 grid grid-cols-2 gap-2">
              <TelemetryBadge
                label="8. Presión de la Sangre"
                value={`${b.systolicBP}/${b.diastolicBP} mmHg`}
                meta="Medida suave sin apretar el brazo (normal 120/80)"
                status={evaluateBpStatus(b.systolicBP, b.diastolicBP)}
                onClick={() => onSelectSystemZone?.("corazon")}
                className="col-span-2"
              />
              <TelemetryBadge
                label="9. Oxígeno en la Cabeza"
                value={`${b.spo2Percent}%`}
                meta="Aire en tu sangre (bien: 95 a 100%)"
                status={evaluateSpo2Status(b.spo2Percent)}
                onClick={() => onSelectSystemZone?.("corazon")}
              />
              <TelemetryBadge
                label="10. Fuerza del Pulso"
                value={`${b.perfusionIndex.toFixed(1)}%`}
                meta="Qué tan bien llega la sangre a la piel"
                status={evaluatePerfusionIndexStatus(b.perfusionIndex)}
                onClick={() => onSelectSystemZone?.("corazon")}
              />
              <TelemetryBadge
                label="11. Calor Interno (Fiebre)"
                value={`${b.bodyTempC.toFixed(1)} °C`}
                meta="Temperatura dentro del cuerpo (normal 36.5 a 37.5 °C)"
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
              Diferencia de calor (adentro vs piel):
            </span>
            <span
              className="font-mono-hud font-bold"
              style={{ color: STATUS_HEX[hemo.thermalGradientStatus] }}
            >
              {hemo.thermalGradientC.toFixed(1)} °C
            </span>
          </div>
        </div>

        {/* NODO 3: Pulsera y Cuello (2 Signos + Ajuste de Presión) */}
        <div className="flex flex-col justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs xl:col-span-3">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-500">
                  <Radiation className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#0b2559]">
                    Parte 3 · Pulsera y Cuello (2 Mediciones)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Vigila la radiación espacial y la calma en tu voz
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
                  ESCUDO DE RADIACIÓN · {Math.max(0, Math.min(100, Math.round((1 - b.dailyRadiationMsv / CSA_RADIATION_LIMITS.dailyAlertMsv) * 100)))}% SEGURO
                </span>
                <span className="text-slate-400">
                  {b.dailyRadiationMsv.toFixed(2)} mSv/día
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
                label="12. Protección de Radiación"
                value={`${Math.max(0, Math.min(100, Math.round((1 - b.dailyRadiationMsv / CSA_RADIATION_LIMITS.dailyAlertMsv) * 100)))}% seguro`}
                meta={`Hoy: ${b.dailyRadiationMsv.toFixed(2)} mSv · Nivel de protección en la nave`}
                status={evaluateRadiationStatus(b.dailyRadiationMsv)}
                onClick={() => onSelectSystemZone?.("endocrino")}
              />
              <TelemetryBadge
                label="13. Calma en tu Voz"
                value={`${100 - b.facialTension}% tranquilo`}
                meta={`Tensión hoy: ${b.stressLevel}% · Mide vibración del cuello sin grabarte`}
                status={evaluateStressStatus(b.stressLevel)}
                onClick={() => onSelectSystemZone?.("cerebro")}
              />
            </div>

            {/* Indicador de Edad de Calibración */}
            <div className="mt-2.5 flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs">
              <span className="flex items-center gap-1.5 text-slate-600">
                <Mic className="h-3.5 w-3.5 text-[#1a73e8]" />
                Último ajuste de presión:
              </span>
              <span
                className="font-mono-hud font-bold"
                style={{ color: STATUS_HEX[calHoursStatus] }}
              >
                hace {b.lastOscillometricCalHours} h
              </span>
            </div>
          </div>

          {/* Ajuste rápido de presión */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold text-[#0b2559]">
                Ajuste del Medidor de Presión
              </span>
              <span
                className="font-mono-hud font-semibold"
                style={{ color: STATUS_HEX[calHoursStatus] }}
              >
                {b.pttCalibrationRequired ? "Conviene ajustar" : "Listo"}
              </span>
            </div>
            <p className="mt-1 text-[10px] leading-snug text-slate-500">
              Si cambias entre el espacio (0g), la Luna o Marte, toca este botón para afinar la lectura de presión.
            </p>
            <button
              type="button"
              onClick={handleCalibrateClick}
              className="mt-2.5 flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-[#1a73e8] px-3 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-blue-700 active:scale-[0.98]"
            >
              <Stethoscope className="h-3.5 w-3.5" />
              Ajustar Medidor de Presión (30 s)
            </button>
          </div>
        </div>
      </div>

      {/* Derived Hemodynamic & Thermal Indices Strip */}
      <div className="mt-4 rounded-xl border border-slate-200/90 bg-slate-50/75 p-3.5">
        <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
          <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#0b2559]">
            <Gauge className="h-4 w-4 text-[#1a73e8]" />
            Resumen Automático de Circulación y Calor (Calculado por tu Traje)
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
              ? "Cuidado al ponerte de pie (riesgo de mareo)"
              : "Sin riesgo de mareo al moverte"}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              key: "map",
              title: "Fuerza Media de la Sangre",
              value: `${hemo.mapMmHg}`,
              unit: "mmHg",
              status: hemo.mapStatus,
              note: "Empuje promedio que lleva sangre a tus órganos (bien: 70 a 100)",
            },
            {
              key: "pp",
              title: "Impulso de cada Latido",
              value: `${hemo.pulsePressureMmHg}`,
              unit: "mmHg",
              status: hemo.pulsePressureStatus,
              note: "Fuerza entre el latido alto y el descanso (bien: 30 a 50)",
            },
            {
              key: "shock",
              title: "Equilibrio Corazón / Presión",
              value: `${Math.max(0, Math.min(100, Math.round((1 - Math.max(0, hemo.shockIndex - 0.5)) * 100)))}%`,
              unit: `(${hemo.shockIndex.toFixed(2)})`,
              status: hemo.shockStatus,
              note: "Indica si tu cuerpo tiene suficiente agua y sangre circulando",
            },
            {
              key: "thermal",
              title: "Equilibrio de Temperatura",
              value: hemo.thermalGradientC.toFixed(1),
              unit: "°C dif.",
              status: hemo.thermalGradientStatus,
              note: "Comparación entre el calor interno y el de tu piel",
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
