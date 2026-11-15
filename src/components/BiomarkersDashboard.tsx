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
  Radiation,
  Thermometer,
  UserCheck,
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
  evaluateBpStatus,
  evaluateBpmStatus,
  evaluateHrvStatus,
  evaluateMentalFatigueStatus,
  evaluateMinuteVentilationStatus,
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
  worstStatus,
} from "@/utils/healthEngine";
import { StatusPill } from "./ui/StatusPill";

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
          goodTrend ? "text-emerald-400" : "text-amber-400"
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
      className={`group flex flex-col justify-between rounded-xl border border-[#182742] bg-[#091120] p-3.5 transition ${
        onClick
          ? "cursor-pointer hover:border-sky-500/45 hover:bg-[#0d192e]"
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
            <span className="text-xs font-semibold text-slate-200">{title}</span>
          </div>
          <StatusPill status={status} />
        </div>

        <div className="mt-3 flex items-baseline justify-between gap-2">
          <div className="flex items-baseline gap-1.5">
            <span className="font-mono-hud text-2xl font-bold text-slate-100">
              {value}
            </span>
            {unit && (
              <span className="font-mono-hud text-xs text-slate-400">
                {unit}
              </span>
            )}
          </div>
          {renderTrend()}
        </div>

        <p className="mt-1 text-[11px] leading-snug text-slate-400">
          {subtitle}
        </p>
      </div>

      {/* Colored Status Bar */}
      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[#162642]">
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

  const [subView, setSubView] = useState<
    "fisicos" | "mental" | "rutina" | "todos"
  >("fisicos");

  return (
    <section id="biomarkers-section" className="space-y-4">
      {/* Barra de Sub-Secciones Limpia */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-[#1b2d4b] bg-[#0c1426] p-3 shadow-[0_14px_34px_rgba(2,6,23,0.45)]">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setSubView("fisicos")}
            className={`inline-flex cursor-pointer items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-bold transition ${
              subView === "fisicos"
                ? "border-sky-400/60 bg-sky-500/15 text-sky-200"
                : "border-[#182742] bg-[#091120] text-slate-300 hover:border-sky-500/40 hover:text-slate-100"
            }`}
          >
            <HeartPulse className="h-4 w-4" />
            Fisiológicos · Bio-Monitor 3N (13)
          </button>

          <button
            type="button"
            onClick={() => setSubView("mental")}
            className={`inline-flex cursor-pointer items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-bold transition ${
              subView === "mental"
                ? "border-sky-400/60 bg-sky-500/15 text-sky-200"
                : "border-[#182742] bg-[#091120] text-slate-300 hover:border-sky-500/40 hover:text-slate-100"
            }`}
          >
            <Brain className="h-4 w-4" />
            Salud Conductual BHP (4)
          </button>

          <button
            type="button"
            onClick={() => setSubView("rutina")}
            className={`inline-flex cursor-pointer items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-bold transition ${
              subView === "rutina"
                ? "border-sky-400/60 bg-sky-500/15 text-sky-200"
                : "border-[#182742] bg-[#091120] text-slate-300 hover:border-sky-500/40 hover:text-slate-100"
            }`}
          >
            <CalendarClock className="h-4 w-4" />
            Sincronía Circadiana ({routineAnalysis.stabilityScore}%)
          </button>
        </div>

        <button
          type="button"
          onClick={() => setSubView(subView === "todos" ? "fisicos" : "todos")}
          className={`cursor-pointer rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
            subView === "todos"
              ? "border-sky-400/60 bg-sky-500/20 text-sky-200"
              : "border-[#182742] bg-[#091120] text-slate-300 hover:border-sky-500/40 hover:text-slate-100"
          }`}
        >
          {subView === "todos" ? "Separar por áreas" : "Ver todos"}
        </button>
      </div>

      {/* Routine Change Detector */}
      {(subView === "rutina" || subView === "todos") && (
      <div
        className={`rounded-2xl border p-4 shadow-[0_14px_34px_rgba(2,6,23,0.45)] sm:p-5 ${
          routineAnalysis.overallStatus === "critical"
            ? "border-red-500/40 bg-red-950/30"
            : routineAnalysis.overallStatus === "warning"
            ? "border-amber-500/40 bg-amber-950/30"
            : "border-[#1b2d4b] bg-[#0c1426]"
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#182742] pb-3">
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
                <h2 className="text-base font-bold text-slate-100">
                  Tus Horarios de Sueño, Ejercicio, Comida y Agua
                </h2>
                <span
                  className="rounded-full px-2.5 py-0.5 font-mono-hud text-[11px] font-bold uppercase"
                  style={{
                    backgroundColor: `${STATUS_HEX[routineAnalysis.overallStatus]}1a`,
                    color: STATUS_HEX[routineAnalysis.overallStatus],
                  }}
                >
                  {routineAnalysis.overallStatus === "optimal"
                    ? "Al día"
                    : routineAnalysis.overallStatus === "warning"
                    ? "Cuidar horarios"
                    : "Retraso importante"}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-slate-400">
                Te avisa de forma sencilla si hoy dormiste menos, tomaste poca agua o te saltaste alguna comida.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-[11px] text-slate-400">
                Cumplimiento de hoy
              </div>
              <div className="font-mono-hud text-xl font-bold text-sky-400">
                {routineAnalysis.stabilityScore}%
              </div>
            </div>
            <button
              type="button"
              onClick={onOpenManualEdit}
              className="cursor-pointer rounded-xl border border-[#1b2d4b] bg-[#091120] px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:border-sky-400 hover:text-sky-300"
            >
              Cambiar Datos
            </button>
          </div>
        </div>

        <div className="mt-3.5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {routineAnalysis.items.map((item) => {
            const hex = STATUS_HEX[item.status];
            return (
              <div
                key={item.id}
                className="rounded-xl border border-[#182742] bg-[#091120] p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-200">
                    {item.label}
                  </span>
                  {item.status === "optimal" ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="h-4 w-4" style={{ color: hex }} />
                  )}
                </div>
                <div className="mt-2 flex items-baseline justify-between text-xs">
                  <span className="font-mono-hud text-base font-bold text-slate-100">
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
      <div className="rounded-2xl border border-[#1b2d4b] bg-[#0c1426] p-4 shadow-[0_14px_34px_rgba(2,6,23,0.45)] sm:p-5">
        <div className="mb-3.5 flex flex-wrap items-center justify-between gap-2 border-b border-[#182742] pb-2.5">
          <div>
            <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-sky-300 sm:text-base">
              <HeartPulse className="h-4 w-4" />
              Biomarcadores Fisiológicos en Tiempo Real (Bio-Monitor 3N)
            </h3>
            <p className="text-xs text-slate-400">
              Todo se mide solo con tu chaleco, tu banda en la frente y tu pulsera, sin cables molestos.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            {onJumpToWearable && (
              <button
                type="button"
                onClick={onJumpToWearable}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-sky-500/35 bg-sky-500/10 px-2.5 py-1 text-[11px] font-semibold text-sky-300 transition hover:bg-sky-500/20"
              >
                <Watch className="h-3.5 w-3.5" />
                Ver Bio-Monitor 3N (13 mediciones)
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Latidos del Corazón (Pecho)"
            value={`${b.bpm}`}
            unit="lat/min"
            subtitle="Ritmo de tus latidos medido por el chaleco (normal 52 a 92)"
            status={evaluateBpmStatus(b.bpm)}
            trend={getTrend(b.bpm, prev.bpm, 1.5)}
            progressPercent={(b.bpm / 150) * 100}
            icon={<HeartPulse className="h-4 w-4" />}
            onClick={() => onSelectSystemZone("corazon")}
          />
          <MetricCard
            title="Descanso del Corazón (Pecho)"
            value={`${Math.min(100, Math.round((b.hrvRmssdMs / 60) * 100))}%`}
            unit={`(${b.hrvRmssdMs} ms)`}
            subtitle="Qué tan relajado y recuperado está tu cuerpo hoy"
            status={evaluateHrvStatus(b.hrvRmssdMs)}
            trend={getTrend(b.hrvRmssdMs, prev.hrvRmssdMs, 1.5)}
            trendPositiveIsGood
            progressPercent={Math.min(100, (b.hrvRmssdMs / 70) * 100)}
            icon={<Activity className="h-4 w-4" />}
            onClick={() => onSelectSystemZone("corazon")}
          />
          <MetricCard
            title="Presión de la Sangre (Frente)"
            value={`${b.systolicBP}/${b.diastolicBP}`}
            unit="mmHg"
            subtitle="Fuerza con la que circula tu sangre sin apretar el brazo"
            status={evaluateBpStatus(b.systolicBP, b.diastolicBP)}
            trend={getTrend(b.systolicBP, prev.systolicBP, 2)}
            progressPercent={(b.systolicBP / 170) * 100}
            icon={<Gauge className="h-4 w-4" />}
            onClick={() => onSelectSystemZone("corazon")}
          />
          <MetricCard
            title="Oxígeno en la Sangre (Frente)"
            value={`${b.spo2Percent}%`}
            unit={`· Pulso ${b.perfusionIndex.toFixed(1)}%`}
            subtitle="Llega suficiente aire a tu cabeza y a tus músculos (meta 95–100%)"
            status={spo2PiStatus}
            trend={getTrend(b.spo2Percent, prev.spo2Percent, 0.5)}
            trendPositiveIsGood
            progressPercent={b.spo2Percent}
            icon={<Activity className="h-4 w-4" />}
            onClick={() => onSelectSystemZone("corazon")}
          />
          <MetricCard
            title="Respiración y Aire (Pecho)"
            value={`${b.respiratoryRateRpm} /min`}
            unit={`· ${b.minuteVentilationLpm.toFixed(1)} L/m`}
            subtitle="Veces que respiras por minuto y aire que entra al pecho"
            status={respRipStatus}
            trend={getTrend(b.respiratoryRateRpm, prev.respiratoryRateRpm, 1)}
            progressPercent={(b.respiratoryRateRpm / 28) * 100}
            icon={<Wind className="h-4 w-4" />}
            onClick={() => onSelectSystemZone("corazon")}
          />
          <MetricCard
            title="Calor del Cuerpo (Frente y Piel)"
            value={`${b.bodyTempC.toFixed(1)} °C`}
            unit={`· Piel ${b.skinTempC.toFixed(1)} °C`}
            subtitle="Temperatura interna para saber que no tienes fiebre ni frío"
            status={thermalZhfStatus}
            trend={getTrend(b.bodyTempC, prev.bodyTempC, 0.15)}
            progressPercent={((b.bodyTempC - 34) / 6) * 100}
            icon={<Thermometer className="h-4 w-4" />}
            onClick={() => onSelectSystemZone("abdomen")}
          />
          <MetricCard
            title="Postura y Sueño (Pecho)"
            value={`${b.postureScore}%`}
            unit={`· ${b.sleepHours.toFixed(1)} h`}
            subtitle="Qué tan cómoda está tu espalda y cuántas horas dormiste"
            status={postureSleepStatus}
            trend={getTrend(b.postureScore, prev.postureScore, 2)}
            trendPositiveIsGood
            progressPercent={b.postureScore}
            icon={<Watch className="h-4 w-4" />}
            onClick={() => onSelectSystemZone("musculo")}
          />
          <MetricCard
            title="Escudo Radiación y Voz (Pulsera)"
            value={`${Math.max(0, Math.min(100, Math.round((1 - b.dailyRadiationMsv / CSA_RADIATION_LIMITS.dailyAlertMsv) * 100)))}%`}
            unit="protección"
            subtitle={`Límite total usado: ${careerRadPct}% · Calma al hablar: ${100 - b.facialTension}%`}
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
      <div className="rounded-2xl border border-[#1b2d4b] bg-[#0c1426] p-4 shadow-[0_14px_34px_rgba(2,6,23,0.45)] sm:p-5">
        <div className="mb-3.5 flex flex-wrap items-center justify-between gap-2 border-b border-[#182742] pb-2.5">
          <div>
            <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-cyan-300 sm:text-base">
              <Brain className="h-4 w-4" />
              Salud Conductual y Neuro-Cognitiva (BHP)
            </h3>
            <p className="text-xs text-slate-400">
              Cómo te sientes de ánimo, energía mental y tranquilidad durante el viaje.
            </p>
          </div>
          <span className="font-mono-hud text-[11px] text-slate-400">
            Rostro: {lastCameraFinding}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Cansancio de la Mente"
            value={`${b.mentalFatigue}%`}
            unit=""
            subtitle="Qué tan cansada está tu cabeza para concentrarte hoy"
            status={evaluateMentalFatigueStatus(b.mentalFatigue)}
            trend={getTrend(b.mentalFatigue, prev.mentalFatigue, 2)}
            progressPercent={b.mentalFatigue}
            icon={<BatteryCharging className="h-4 w-4" />}
            onClick={() => onSelectSystemZone("cerebro")}
          />
          <MetricCard
            title="Nivel de Tensión (Estrés)"
            value={`${b.stressLevel}%`}
            unit=""
            subtitle="Qué tan presionado o intranquilo se siente tu cuerpo"
            status={evaluateStressStatus(b.stressLevel)}
            trend={getTrend(b.stressLevel, prev.stressLevel, 2)}
            progressPercent={b.stressLevel}
            icon={<Flame className="h-4 w-4" />}
            onClick={() => onSelectSystemZone("cerebro")}
          />
          <MetricCard
            title="Horas de Sueño"
            value={b.sleepHours.toFixed(1)}
            unit={`h (${Math.min(100, Math.round((b.sleepHours / 8) * 100))}%)`}
            subtitle="Lo ideal es dormir entre 7 y 8 horas seguidas"
            status={evaluateSleepStatus(b.sleepHours)}
            trend={getTrend(b.sleepHours, prev.sleepHours, 0.2)}
            trendPositiveIsGood
            progressPercent={(b.sleepHours / 9) * 100}
            icon={<BedDouble className="h-4 w-4" />}
            onClick={() => onSelectSystemZone("cerebro")}
          />
          <MetricCard
            title="Comodidad del Cuerpo y Rostro"
            value={`${b.postureScore}%`}
            unit=""
            subtitle={`Relajación en tus ojos y cara: ${100 - b.facialTension}%`}
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
