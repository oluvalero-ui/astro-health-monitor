"use client";

import React, { useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BatteryCharging,
  BedDouble,
  Brain,
  CalendarClock,
  CheckCircle2,
  Flame,
  Gauge,
  HeartPulse,
  Moon,
  Radiation,
  Smile,
  Sun,
  Thermometer,
  UserCheck,
  Users,
  Watch,
  Wind,
} from "lucide-react";
import { CSA_RADIATION_LIMITS } from "@/data/missionData";
import {
  BiomarkerData,
  HealthStatus,
  RoutineTracking,
  SystemZoneId,
  TrendDirection,
} from "@/types/astronaut";
import {
  computeRoutineDeviations,
  evaluateBoredomStatus,
  evaluateBpStatus,
  evaluateBpmStatus,
  evaluateDepressionStatus,
  evaluateHrvStatus,
  evaluateLonelinessStatus,
  evaluateMentalFatigueStatus,
  evaluateMinuteVentilationStatus,
  evaluateMoodStatus,
  evaluatePerfusionIndexStatus,
  evaluatePostureStatus,
  evaluateRadiationStatus,
  evaluateRespiratoryRateStatus,
  evaluateSkinTempStatus,
  evaluateSleepStatus,
  evaluateSpo2Status,
  evaluateStressStatus,
  evaluateTempStatus,
  getCareerRadiationPct,
  getTrend,
  STATUS_HEX,
  STATUS_LABELS,
  worstStatus,
} from "@/utils/healthEngine";

interface BiomarkersDashboardProps {
  biomarkers: BiomarkerData;
  previousBiomarkers: BiomarkerData;
  routine: RoutineTracking;
  lastCameraFinding: string;
  onSelectSystemZone: (zone: SystemZoneId) => void;
  onOpenManualEdit: () => void;
  onJumpToWearable?: () => void;
}

interface MetricCardProps {
  title: string;
  value: string;
  unit?: string;
  subtitle: string;
  status: HealthStatus;
  trend: TrendDirection;
  trendPositiveIsGood?: boolean;
  progressPercent: number;
  icon: React.ReactNode;
  onClick?: () => void;
}

function MetricCard({
  title,
  value,
  unit,
  subtitle,
  status,
  trend,
  trendPositiveIsGood = false,
  progressPercent,
  icon,
  onClick,
}: MetricCardProps) {
  const hex = STATUS_HEX[status];

  const renderTrend = () => {
    if (trend === "stable") {
      return (
        <span className="inline-flex items-center gap-0.5 text-[11px] text-slate-400">
          <ArrowRight className="h-3 w-3" />
          Estable
        </span>
      );
    }
    const isUp = trend === "up";
    const goodTrend = trendPositiveIsGood ? isUp : !isUp;
    return (
      <span
        className={`inline-flex items-center gap-0.5 text-[11px] font-medium ${
          goodTrend ? "text-emerald-600" : "text-amber-600"
        }`}
      >
        {isUp ? (
          <ArrowUpRight className="h-3 w-3" />
        ) : (
          <ArrowDownRight className="h-3 w-3" />
        )}
        {isUp ? "Subiendo" : "Bajando"}
      </span>
    );
  };

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
      className={`group flex flex-col justify-between rounded-xl border border-slate-200/90 bg-slate-50/70 p-3.5 transition ${
        onClick
          ? "cursor-pointer hover:border-blue-300 hover:bg-white hover:shadow-sm"
          : ""
      }`}
    >
      <div>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <span
              className="flex h-7 w-7 items-center justify-center rounded-lg border"
              style={{
                borderColor: `${hex}44`,
                backgroundColor: `${hex}15`,
                color: hex,
              }}
            >
              {icon}
            </span>
            <span className="text-xs font-semibold text-slate-800">{title}</span>
          </div>
          <span
            className="rounded-full px-2 py-0.5 font-mono-hud text-[10px] font-bold uppercase"
            style={{
              backgroundColor: `${hex}1a`,
              color: hex,
            }}
          >
            {STATUS_LABELS[status]}
          </span>
        </div>

        <div className="mt-3 flex items-baseline justify-between gap-2">
          <div className="flex items-baseline gap-1.5">
            <span className="font-mono-hud text-2xl font-bold text-slate-900">
              {value}
            </span>
            {unit && (
              <span className="font-mono-hud text-xs text-slate-500">
                {unit}
              </span>
            )}
          </div>
          {renderTrend()}
        </div>

        <p className="mt-1 text-[11px] leading-snug text-slate-500">
          {subtitle}
        </p>
      </div>

      {/* Colored Status Bar */}
      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-200/75">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${Math.max(6, Math.min(100, progressPercent))}%`,
            backgroundColor: hex,
          }}
        />
      </div>
    </div>
  );
}

export default function BiomarkersDashboard({
  biomarkers: b,
  previousBiomarkers: prev,
  routine,
  lastCameraFinding,
  onSelectSystemZone,
  onOpenManualEdit,
  onJumpToWearable,
}: BiomarkersDashboardProps) {
  const routineAnalysis = computeRoutineDeviations(routine);
  const radStatus = evaluateRadiationStatus(b.dailyRadiationMsv);
  const careerRadPct = getCareerRadiationPct(b.cumulativeRadiationMsv);

  const spo2PiStatus = worstStatus([
    evaluateSpo2Status(b.spo2Percent),
    evaluatePerfusionIndexStatus(b.perfusionIndex),
  ]);

  const respRipStatus = worstStatus([
    evaluateRespiratoryRateStatus(b.respiratoryRateRpm),
    evaluateMinuteVentilationStatus(b.minuteVentilationLpm),
  ]);

  const thermalZhfStatus = worstStatus([
    evaluateTempStatus(b.bodyTempC),
    evaluateSkinTempStatus(b.skinTempC),
  ]);

  const postureSleepStatus = worstStatus([
    evaluatePostureStatus(b.postureScore),
    evaluateSleepStatus(b.sleepHours),
  ]);

  const moodDescription =
    b.moodScore >= 72
      ? "Positivo / Enfocado"
      : b.moodScore >= 50
      ? "Fatiga / Apatía Leve"
      : "Ánimo Deprimido";

  const [subView, setSubView] = useState<
    "fisicos" | "mental" | "rutina" | "todos"
  >("fisicos");

  return (
    <section id="biomarkers-section" className="space-y-4">
      {/* Barra de Sub-Secciones Limpia (Evita mostrar 20 tarjetas de golpe) */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-200/90 bg-white p-3 shadow-[0_6px_24px_rgba(15,23,42,0.04)]">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setSubView("fisicos")}
            className={`inline-flex cursor-pointer items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-bold transition ${
              subView === "fisicos"
                ? "border-[#1a73e8] bg-[#1a73e8] text-white shadow-xs"
                : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-white"
            }`}
          >
            <HeartPulse className="h-4 w-4" />
            1. Signos Fisiológicos Arnés 3N (13)
          </button>

          <button
            type="button"
            onClick={() => setSubView("mental")}
            className={`inline-flex cursor-pointer items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-bold transition ${
              subView === "mental"
                ? "border-[#1a73e8] bg-[#1a73e8] text-white shadow-xs"
                : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-white"
            }`}
          >
            <Brain className="h-4 w-4" />
            2. Salud Mental y Conductual BHP (8)
          </button>

          <button
            type="button"
            onClick={() => setSubView("rutina")}
            className={`inline-flex cursor-pointer items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-bold transition ${
              subView === "rutina"
                ? "border-[#1a73e8] bg-[#1a73e8] text-white shadow-xs"
                : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-white"
            }`}
          >
            <CalendarClock className="h-4 w-4" />
            3. Detector de Rutina ({routineAnalysis.stabilityScore}% Base)
          </button>
        </div>

        <button
          type="button"
          onClick={() => setSubView(subView === "todos" ? "fisicos" : "todos")}
          className={`cursor-pointer rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
            subView === "todos"
              ? "border-[#0b2559] bg-[#0b2559] text-white"
              : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
          }`}
        >
          {subView === "todos" ? "Agrupar por pestañas" : "Ver todos juntos"}
        </button>
      </div>

      {/* Routine Change Detector */}
      {(subView === "rutina" || subView === "todos") && (
      <div
        className={`rounded-2xl border p-4 shadow-[0_6px_24px_rgba(15,23,42,0.04)] sm:p-5 ${
          routineAnalysis.overallStatus === "critical"
            ? "border-red-300 bg-red-50/70"
            : routineAnalysis.overallStatus === "warning"
            ? "border-amber-300 bg-amber-50/60"
            : "border-slate-200/90 bg-white"
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-start gap-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border"
              style={{
                borderColor: `${STATUS_HEX[routineAnalysis.overallStatus]}44`,
                backgroundColor: `${STATUS_HEX[routineAnalysis.overallStatus]}15`,
                color: STATUS_HEX[routineAnalysis.overallStatus],
              }}
            >
              <CalendarClock className="h-5 w-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  Detector Automático de Cambios en la Rutina
                </h2>
                <span
                  className="rounded-full px-2.5 py-0.5 font-mono-hud text-[11px] font-bold uppercase"
                  style={{
                    backgroundColor: `${STATUS_HEX[routineAnalysis.overallStatus]}1a`,
                    color: STATUS_HEX[routineAnalysis.overallStatus],
                  }}
                >
                  {routineAnalysis.overallStatus === "optimal"
                    ? "Rutina Estable"
                    : routineAnalysis.overallStatus === "warning"
                    ? "Desviación Temprana Detectada"
                    : "Alerta: Ruptura de Rutina"}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-slate-500">
                Compara tus horarios actuales de sueño, ejercicio, alimentación e hidratación contra la línea base de la misión.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-[11px] text-slate-500">
                Adherencia a Línea Base
              </div>
              <div className="font-mono-hud text-xl font-bold text-[#1a73e8]">
                {routineAnalysis.stabilityScore}%
              </div>
            </div>
            <button
              type="button"
              onClick={onOpenManualEdit}
              className="cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-blue-400 hover:text-blue-700"
            >
              Ajustar Rutina
            </button>
          </div>
        </div>

        <div className="mt-3.5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {routineAnalysis.items.map((item) => {
            const hex = STATUS_HEX[item.status];
            return (
              <div
                key={item.id}
                className="rounded-xl border border-slate-200/90 bg-white p-3 shadow-xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-800">
                    {item.label}
                  </span>
                  {item.status === "optimal" ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="h-4 w-4" style={{ color: hex }} />
                  )}
                </div>
                <div className="mt-2 flex items-baseline justify-between text-xs">
                  <span className="font-mono-hud text-base font-bold text-slate-900">
                    {item.currentText}
                  </span>
                  <span className="font-mono-hud text-[11px] text-slate-400">
                    Base: {item.baselineText}
                  </span>
                </div>
                <div className="mt-1.5 text-[11px] font-medium" style={{ color: hex }}>
                  {item.deviationText}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      )}

      {/* Biomarker Group A: Los 13 Signos Fisiológicos Continuos del Arnés 3N */}
      {(subView === "fisicos" || subView === "todos") && (
      <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-[0_6px_24px_rgba(15,23,42,0.04)] sm:p-5">
        <div className="mb-3.5 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
          <div>
            <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-[#1a73e8] sm:text-base">
              <HeartPulse className="h-4 w-4" />
              Módulo 2A · 13 Signos Fisiológicos Continuos del Arnés 3N (Nodos 1, 2 y 3)
            </h3>
            <p className="text-xs text-slate-500">
              Adquisición 100% mediante el hardware único Arnés 3N (Chaleco Torácico · Vincha Cefálica Frontal · Pulsera/Collar).
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            {onJumpToWearable && (
              <button
                type="button"
                onClick={onJumpToWearable}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-[#1a73e8] transition hover:bg-blue-100"
              >
                <Watch className="h-3.5 w-3.5" />
                Abrir Vista Hardware Arnés 3N (7 + 4 + 2 = 13 Signos)
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="FC + ECG 3 Derivaciones (Nodo 1)"
            value={`${b.bpm}`}
            unit="BPM"
            subtitle="Signos #1 y #3 · ECG Textil 256 Hz (DI · DII · V5)"
            status={evaluateBpmStatus(b.bpm)}
            trend={getTrend(b.bpm, prev.bpm, 1.5)}
            progressPercent={(b.bpm / 150) * 100}
            icon={<HeartPulse className="h-4 w-4" />}
            onClick={() => onSelectSystemZone("corazon")}
          />
          <MetricCard
            title="Variabilidad HRV rMSSD (Nodo 1)"
            value={`${b.hrvRmssdMs}`}
            unit="ms"
            subtitle="Signo #2 · Tono vagal autónomo (Nominal > 20 ms)"
            status={evaluateHrvStatus(b.hrvRmssdMs)}
            trend={getTrend(b.hrvRmssdMs, prev.hrvRmssdMs, 1.5)}
            trendPositiveIsGood
            progressPercent={Math.min(100, (b.hrvRmssdMs / 70) * 100)}
            icon={<Activity className="h-4 w-4" />}
            onClick={() => onSelectSystemZone("corazon")}
          />
          <MetricCard
            title="PA Continua por PTT (Nodo 2)"
            value={`${b.systolicBP}/${b.diastolicBP}`}
            unit="mmHg"
            subtitle={`Signo #8 · Vincha Cefálica PTT = ${b.pttMs} ms (150–250 ms)`}
            status={evaluateBpStatus(b.systolicBP, b.diastolicBP)}
            trend={getTrend(b.systolicBP, prev.systolicBP, 2)}
            progressPercent={(b.systolicBP / 170) * 100}
            icon={<Gauge className="h-4 w-4" />}
            onClick={() => onSelectSystemZone("corazon")}
          />
          <MetricCard
            title="SpO₂ Frontal + Perfusión (Nodo 2)"
            value={`${b.spo2Percent}% · PI ${b.perfusionIndex.toFixed(1)}%`}
            unit=""
            subtitle="Signos #9 y #10 · PPG Supraorbitario 64 Hz (95–100%)"
            status={spo2PiStatus}
            trend={getTrend(b.spo2Percent, prev.spo2Percent, 0.5)}
            trendPositiveIsGood
            progressPercent={b.spo2Percent}
            icon={<Activity className="h-4 w-4" />}
            onClick={() => onSelectSystemZone("corazon")}
          />
          <MetricCard
            title="FR + Volumen Minuto (Nodo 1)"
            value={`${b.respiratoryRateRpm} rpm`}
            unit={`· ${b.minuteVentilationLpm.toFixed(1)} L/m`}
            subtitle="Signos #4 y #5 · Bandas Torácicas RIP 128 Hz (5.0–8.0 L/m)"
            status={respRipStatus}
            trend={getTrend(b.respiratoryRateRpm, prev.respiratoryRateRpm, 1)}
            progressPercent={(b.respiratoryRateRpm / 28) * 100}
            icon={<Wind className="h-4 w-4" />}
            onClick={() => onSelectSystemZone("corazon")}
          />
          <MetricCard
            title="Temp. Central ZHF + Cutánea (N1/N2)"
            value={`${b.bodyTempC.toFixed(1)} °C`}
            unit={`· Piel ${b.skinTempC.toFixed(1)} °C`}
            subtitle="Signos #6 y #11 · Zero-Heat-Flux craneal (36.5–37.5 °C)"
            status={thermalZhfStatus}
            trend={getTrend(b.bodyTempC, prev.bodyTempC, 0.15)}
            progressPercent={((b.bodyTempC - 34) / 6) * 100}
            icon={<Thermometer className="h-4 w-4" />}
            onClick={() => onSelectSystemZone("abdomen")}
          />
          <MetricCard
            title="Postura Axial + Actigrafía (Nodo 1)"
            value={`${b.postureScore}%`}
            unit={`· ${b.sleepHours.toFixed(1)} h`}
            subtitle="Signo #7 · Acelerómetro 3 ejes 64 Hz (Descanso y postura)"
            status={postureSleepStatus}
            trend={getTrend(b.postureScore, prev.postureScore, 2)}
            trendPositiveIsGood
            progressPercent={b.postureScore}
            icon={<Watch className="h-4 w-4" />}
            onClick={() => onSelectSystemZone("musculo")}
          />
          <MetricCard
            title="Radiación CSA + Voz (Nodo 3)"
            value={b.dailyRadiationMsv.toFixed(2)}
            unit="mSv/día"
            subtitle={`Signos #12 y #13 · Acum: ${b.cumulativeRadiationMsv.toFixed(1)}/${CSA_RADIATION_LIMITS.careerLimitMsv} mSv (${careerRadPct}%) · Voz ${100 - b.facialTension}%`}
            status={radStatus}
            trend={getTrend(b.dailyRadiationMsv, prev.dailyRadiationMsv, 0.05)}
            progressPercent={(b.dailyRadiationMsv / 2.0) * 100}
            icon={<Radiation className="h-4 w-4" />}
            onClick={() => onSelectSystemZone("endocrino")}
          />
        </div>
      </div>
      )}

      {/* Biomarker Group B */}
      {(subView === "mental" || subView === "todos") && (
      <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-[0_6px_24px_rgba(15,23,42,0.04)] sm:p-5">
        <div className="mb-3.5 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
          <div>
            <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-indigo-700 sm:text-base">
              <Brain className="h-4 w-4" />
              Módulo 2B · Salud Mental, Conductual y Lenguaje Corporal
            </h3>
            <p className="text-xs text-slate-500">
              Detección temprana de aislamiento, aburrimiento, fatiga cognitiva y agotamiento postural.
            </p>
          </div>
          <span className="font-mono-hud text-[11px] text-slate-500">
            Cámara: {lastCameraFinding}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Cansancio Mental"
            value={`${b.mentalFatigue}`}
            unit="/ 100"
            subtitle={`Tiempo de reacción: ${b.reactionTimeMs} ms (Base < 320 ms)`}
            status={evaluateMentalFatigueStatus(b.mentalFatigue)}
            trend={getTrend(b.mentalFatigue, prev.mentalFatigue, 2)}
            progressPercent={b.mentalFatigue}
            icon={<BatteryCharging className="h-4 w-4" />}
            onClick={() => onSelectSystemZone("cerebro")}
          />
          <MetricCard
            title="Nivel de Estrés"
            value={`${b.stressLevel}`}
            unit="/ 100"
            subtitle="Carga operativa y presión por confinamiento"
            status={evaluateStressStatus(b.stressLevel)}
            trend={getTrend(b.stressLevel, prev.stressLevel, 2)}
            progressPercent={b.stressLevel}
            icon={<Flame className="h-4 w-4" />}
            onClick={() => onSelectSystemZone("cerebro")}
          />
          <MetricCard
            title="Indicador de Depresión"
            value={`${b.depressionRisk}`}
            unit="/ 100"
            subtitle="Riesgo de desánimo persistente o desconexión"
            status={evaluateDepressionStatus(b.depressionRisk)}
            trend={getTrend(b.depressionRisk, prev.depressionRisk, 2)}
            progressPercent={b.depressionRisk}
            icon={<Moon className="h-4 w-4" />}
            onClick={() => onSelectSystemZone("cerebro")}
          />
          <MetricCard
            title="Soledad (Aislamiento)"
            value={`${b.lonelinessLevel}`}
            unit="/ 100"
            subtitle="Impacto por distancia de Tierra y grupo reducido"
            status={evaluateLonelinessStatus(b.lonelinessLevel)}
            trend={getTrend(b.lonelinessLevel, prev.lonelinessLevel, 2)}
            progressPercent={b.lonelinessLevel}
            icon={<Users className="h-4 w-4" />}
            onClick={() => onSelectSystemZone("cerebro")}
          />
          <MetricCard
            title="Aburrimiento / Monotonía"
            value={`${b.boredomLevel}`}
            unit="/ 100"
            subtitle={`Índice de estimulación cognitiva: ${b.stimulationIndex}/100`}
            status={evaluateBoredomStatus(b.boredomLevel)}
            trend={getTrend(b.boredomLevel, prev.boredomLevel, 2)}
            progressPercent={b.boredomLevel}
            icon={<Sun className="h-4 w-4" />}
            onClick={() => onSelectSystemZone("cerebro")}
          />
          <MetricCard
            title="Horas Diarias de Sueño"
            value={b.sleepHours.toFixed(1)}
            unit="hrs"
            subtitle="Meta orbital: 7.0–8.0 hrs sin interrupciones"
            status={evaluateSleepStatus(b.sleepHours)}
            trend={getTrend(b.sleepHours, prev.sleepHours, 0.2)}
            trendPositiveIsGood
            progressPercent={(b.sleepHours / 9) * 100}
            icon={<BedDouble className="h-4 w-4" />}
            onClick={() => onSelectSystemZone("cerebro")}
          />
          <MetricCard
            title="Estado de Ánimo General"
            value={`${b.moodScore}`}
            unit="/ 100"
            subtitle={`Estado actual: ${moodDescription}`}
            status={evaluateMoodStatus(b.moodScore)}
            trend={getTrend(b.moodScore, prev.moodScore, 2)}
            trendPositiveIsGood
            progressPercent={b.moodScore}
            icon={<Smile className="h-4 w-4" />}
            onClick={() => onSelectSystemZone("cerebro")}
          />
          <MetricCard
            title="Postura y Lenguaje Corporal"
            value={`${b.postureScore}`}
            unit="/ 100"
            subtitle={`Tensión facial/ocular: ${b.facialTension}/100 (Vía cámara)`}
            status={evaluatePostureStatus(b.postureScore)}
            trend={getTrend(b.postureScore, prev.postureScore, 2)}
            trendPositiveIsGood
            progressPercent={b.postureScore}
            icon={<UserCheck className="h-4 w-4" />}
            onClick={() => onSelectSystemZone("rostro")}
          />
        </div>
      </div>
      )}
    </section>
  );
}
