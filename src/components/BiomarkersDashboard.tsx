"use client";

import React from "react";
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BatteryCharging,
  BedDouble,
  Bone,
  Brain,
  CalendarClock,
  CheckCircle2,
  Droplets,
  Flame,
  Gauge,
  HeartPulse,
  Moon,
  Radiation,
  Smile,
  Sparkles,
  Sun,
  Thermometer,
  UserCheck,
  Users,
  Watch,
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
  evaluateBoneDensityStatus,
  evaluateBoredomStatus,
  evaluateBpStatus,
  evaluateBpmStatus,
  evaluateCortisolStatus,
  evaluateDepressionStatus,
  evaluateGlucoseStatus,
  evaluateHrvStatus,
  evaluateHydrationStatus,
  evaluateLonelinessStatus,
  evaluateMelatoninStatus,
  evaluateMentalFatigueStatus,
  evaluateMoodStatus,
  evaluatePerfusionIndexStatus,
  evaluatePhysicalFatigueStatus,
  evaluatePostureStatus,
  evaluateRadiationStatus,
  evaluateRespiratoryRateStatus,
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
  lastUltrasoundFinding: string;
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
  lastUltrasoundFinding,
  onSelectSystemZone,
  onOpenManualEdit,
  onJumpToWearable,
}: BiomarkersDashboardProps) {
  const routineAnalysis = computeRoutineDeviations(routine);
  const radStatus = evaluateRadiationStatus(b.dailyRadiationMsv);
  const careerRadPct = getCareerRadiationPct(b.cumulativeRadiationMsv);

  const hormonalStatus = worstStatus([
    evaluateCortisolStatus(b.cortisolIndex),
    evaluateMelatoninStatus(b.melatoninIndex),
  ]);

  const cardioStatus = worstStatus([
    evaluateBpmStatus(b.bpm),
    evaluateBpStatus(b.systolicBP, b.diastolicBP),
    evaluateSpo2Status(b.spo2Percent),
    evaluateRespiratoryRateStatus(b.respiratoryRateRpm),
    evaluateHrvStatus(b.hrvRmssdMs),
    evaluatePerfusionIndexStatus(b.perfusionIndex),
  ]);

  const physicalBoneStatus = worstStatus([
    evaluatePhysicalFatigueStatus(b.physicalFatigue),
    evaluateBoneDensityStatus(b.boneDensityIndex),
  ]);

  const moodDescription =
    b.moodScore >= 72
      ? "Positivo / Enfocado"
      : b.moodScore >= 50
      ? "Fatiga / Apatía Leve"
      : "Ánimo Deprimido";

  return (
    <section id="biomarkers-section" className="space-y-5">
      {/* Routine Change Detector */}
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

      {/* Biomarker Group A */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-[0_6px_24px_rgba(15,23,42,0.04)] sm:p-5">
        <div className="mb-3.5 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
          <div>
            <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-[#1a73e8] sm:text-base">
              <HeartPulse className="h-4 w-4" />
              Módulo 2A · Signos Vitales, Hormonas y Radiación (CSA)
            </h3>
            <p className="text-xs text-slate-500">
              Haz clic en cualquier tarjeta para abrir su guía anatómica y contramedidas.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="font-mono-hud text-[11px] text-slate-500">
              Último Ultrasonido: {lastUltrasoundFinding}
            </span>
            {onJumpToWearable && (
              <button
                type="button"
                onClick={onJumpToWearable}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-[#1a73e8] transition hover:bg-blue-100"
              >
                <Watch className="h-3.5 w-3.5" />
                Arnés Vestible: SpO₂ {b.spo2Percent}% · FR {b.respiratoryRateRpm} rpm · HRV {b.hrvRmssdMs} ms
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Pulsaciones por Minuto"
            value={`${b.bpm}`}
            unit="BPM"
            subtitle={`HRV ${b.hrvRmssdMs} ms · SpO₂ ${b.spo2Percent}% · FR ${b.respiratoryRateRpm} rpm`}
            status={cardioStatus}
            trend={getTrend(b.bpm, prev.bpm, 1.5)}
            progressPercent={(b.bpm / 150) * 100}
            icon={<HeartPulse className="h-4 w-4" />}
            onClick={() => onSelectSystemZone("corazon")}
          />
          <MetricCard
            title="Presión Arterial"
            value={`${b.systolicBP}/${b.diastolicBP}`}
            unit="mmHg"
            subtitle={`Derivada vía PTT (${b.pttMs} ms) · Bio-Monitor Frontal`}
            status={evaluateBpStatus(b.systolicBP, b.diastolicBP)}
            trend={getTrend(b.systolicBP, prev.systolicBP, 2)}
            progressPercent={(b.systolicBP / 170) * 100}
            icon={<Gauge className="h-4 w-4" />}
            onClick={() => onSelectSystemZone("corazon")}
          />
          <MetricCard
            title="Azúcar en la Sangre"
            value={`${b.bloodGlucoseMgDl}`}
            unit="mg/dL"
            subtitle="Meta en misión: 75–118 mg/dL (Riesgo <65 o >180)"
            status={evaluateGlucoseStatus(b.bloodGlucoseMgDl)}
            trend={getTrend(b.bloodGlucoseMgDl, prev.bloodGlucoseMgDl, 2)}
            trendPositiveIsGood={b.bloodGlucoseMgDl < 80}
            progressPercent={(b.bloodGlucoseMgDl / 180) * 100}
            icon={<Activity className="h-4 w-4" />}
            onClick={() => onSelectSystemZone("abdomen")}
          />
          <MetricCard
            title="Temperatura Corporal"
            value={b.bodyTempC.toFixed(1)}
            unit="°C"
            subtitle="Rango seguro: 36.1–37.2 °C (Control térmico de traje/cabina)"
            status={evaluateTempStatus(b.bodyTempC)}
            trend={getTrend(b.bodyTempC, prev.bodyTempC, 0.15)}
            progressPercent={((b.bodyTempC - 34) / 6) * 100}
            icon={<Thermometer className="h-4 w-4" />}
            onClick={() => onSelectSystemZone("abdomen")}
          />
          <MetricCard
            title="Hidratación Hídrica"
            value={`${b.hydrationPercent}`}
            unit="%"
            subtitle={`Ingesta hoy: ${routine.hydrationLiters.toFixed(1)} L / ${routine.baselineHydrationLiters.toFixed(1)} L`}
            status={evaluateHydrationStatus(b.hydrationPercent)}
            trend={getTrend(b.hydrationPercent, prev.hydrationPercent, 1)}
            trendPositiveIsGood
            progressPercent={b.hydrationPercent}
            icon={<Droplets className="h-4 w-4" />}
            onClick={() => onSelectSystemZone("abdomen")}
          />
          <MetricCard
            title="Cambios Hormonales"
            value={`${b.cortisolIndex} / ${b.melatoninIndex}`}
            unit="Cort / Mel"
            subtitle={`Cortisol (estrés): ${b.cortisolIndex}/100 · Melatonina (sueño): ${b.melatoninIndex}/100`}
            status={hormonalStatus}
            trend={getTrend(b.cortisolIndex, prev.cortisolIndex, 2)}
            progressPercent={b.melatoninIndex}
            icon={<Sparkles className="h-4 w-4" />}
            onClick={() => onSelectSystemZone("endocrino")}
          />
          <MetricCard
            title="Cansancio Físico y Óseo"
            value={`${b.physicalFatigue}`}
            unit="/ 100"
            subtitle={`Densidad ósea: ${b.boneDensityIndex.toFixed(1)}% · Carga muscular ARED`}
            status={physicalBoneStatus}
            trend={getTrend(b.physicalFatigue, prev.physicalFatigue, 2)}
            progressPercent={b.physicalFatigue}
            icon={<Bone className="h-4 w-4" />}
            onClick={() => onSelectSystemZone("musculo")}
          />
          <MetricCard
            title="Exposición a Radiación (CSA)"
            value={b.dailyRadiationMsv.toFixed(2)}
            unit="mSv/día"
            subtitle={`Acumulada: ${b.cumulativeRadiationMsv.toFixed(1)} mSv (${careerRadPct}% de ${CSA_RADIATION_LIMITS.careerLimitMsv} mSv)`}
            status={radStatus}
            trend={getTrend(b.dailyRadiationMsv, prev.dailyRadiationMsv, 0.05)}
            progressPercent={(b.dailyRadiationMsv / 2.0) * 100}
            icon={<Radiation className="h-4 w-4" />}
            onClick={() => onSelectSystemZone("endocrino")}
          />
        </div>
      </div>

      {/* Biomarker Group B */}
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
    </section>
  );
}
