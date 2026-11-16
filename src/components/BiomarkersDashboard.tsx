"use client";

import React, { useEffect, useState } from "react";
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
  Clock,
  Flame,
  Gauge,
  HeartPulse,
  Moon,
  Radiation,
  Sun,
  Thermometer,
  UserCheck,
  Watch,
  Wind,
} from "lucide-react";
import { CSA_RADIATION_LIMITS, MISSION_ENVIRONMENTS } from "@/data/missionData";
import {
  BiomarkerData,
  HealthStatus,
  MissionEnvironmentId,
  RoutineTracking,
  SystemZoneId,
  TrendDirection,
} from "@/types/astronaut";
import {
  computeRoutineDeviations,
  evaluateBoneDensityStatus,
  evaluateBpStatus,
  evaluateBpmStatus,
  evaluateCortisolStatus,
  evaluateHrvStatus,
  evaluateMelatoninStatus,
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
  environmentId?: MissionEnvironmentId;
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
  badgeText?: string;
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
  badgeText,
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
          Stable
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
        {isUp ? "Rising" : "Falling"}
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
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border"
              style={{
                borderColor: `${hex}44`,
                backgroundColor: `${hex}15`,
                color: hex,
              }}
            >
              {icon}
            </span>
            <div>
              <span className="block text-xs font-semibold text-slate-200">
                {title}
              </span>
              {badgeText && (
                <span className="mt-0.5 inline-block rounded border border-sky-500/30 bg-sky-500/10 px-1.5 py-0.5 font-mono-hud text-[9px] font-bold uppercase tracking-wider text-sky-300">
                  {badgeText}
                </span>
              )}
            </div>
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
  environmentId = "iss",
  biomarkers: b,
  previousBiomarkers: prev,
  routine,
  lastCameraFinding,
  onSelectSystemZone,
  onOpenManualEdit,
  onJumpToWearable,
}: BiomarkersDashboardProps) {
  const env = MISSION_ENVIRONMENTS[environmentId];
  const routineAnalysis = computeRoutineDeviations(routine);
  const radStatus = evaluateRadiationStatus(b.dailyRadiationMsv);
  const careerRadPct = getCareerRadiationPct(b.cumulativeRadiationMsv);

  const [utcNow, setUtcNow] = useState<{ hour: number; label: string }>({
    hour: 14,
    label: "14:00 UTC",
  });

  useEffect(() => {
    const syncClock = () => {
      const now = new Date();
      setUtcNow({
        hour: now.getUTCHours(),
        label: `${now.toISOString().slice(11, 16)} UTC`,
      });
    };
    const initTimer = window.setTimeout(syncClock, 0);
    const interval = window.setInterval(syncClock, 15000);
    return () => {
      window.clearTimeout(initTimer);
      window.clearInterval(interval);
    };
  }, []);

  const cortisolPhase =
    utcNow.hour >= 5 && utcNow.hour < 10
      ? "Peak Acrophase (05–10h ↑)"
      : utcNow.hour >= 10 && utcNow.hour < 19
      ? "Diurnal Slope (10–19h ↓)"
      : "Nocturnal Trough (19–05h)";

  const melatoninPhase =
    utcNow.hour >= 21 || utcNow.hour < 5
      ? "Nocturnal Peak / DLMO (21–05h ↑)"
      : utcNow.hour >= 5 && utcNow.hour < 9
      ? "Morning Washout (05–09h ↓)"
      : "Daytime Suppression Trough (09–21h)";

  const spo2PiStatus = worstStatus([
    evaluateSpo2Status(b.spo2Percent, environmentId),
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
      {/* Clean Sub-Section Tabs Bar */}
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
            Physiological · 3N &amp; Baselines
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
            Behavioral Health BHP (4)
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
            Circadian Synchrony ({routineAnalysis.stabilityScore}%)
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
          {subView === "todos" ? "Split by Category" : "View All"}
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
                  Sleep, Exercise, Nutrition & Hydration Schedule
                </h2>
                <span
                  className="rounded-full px-2.5 py-0.5 font-mono-hud text-[11px] font-bold uppercase"
                  style={{
                    backgroundColor: `${STATUS_HEX[routineAnalysis.overallStatus]}1a`,
                    color: STATUS_HEX[routineAnalysis.overallStatus],
                  }}
                >
                  {routineAnalysis.overallStatus === "optimal"
                    ? "On Track"
                    : routineAnalysis.overallStatus === "warning"
                    ? "Schedule Drift"
                    : "Major Disruption"}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-slate-400">
                Flags circadian phase shift, under-hydration, missed exercise, or skipped rations against baseline.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-[11px] text-slate-400">
                Today&apos;s Adherence
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
              Edit Data
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

      {/* Biomarker Group A: 12 Endogenous Physiological + 1 Exogenous Dosimetry Channel */}
      {(subView === "fisicos" || subView === "todos") && (
      <div className="space-y-4">
      <div className="rounded-2xl border border-[#1b2d4b] bg-[#0c1426] p-4 shadow-[0_14px_34px_rgba(2,6,23,0.45)] sm:p-5">
        <div className="mb-3.5 flex flex-wrap items-center justify-between gap-2 border-b border-[#182742] pb-2.5">
          <div>
            <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-sky-300 sm:text-base">
              <HeartPulse className="h-4 w-4" />
              Real-Time Biomarkers (Bio-Monitor 3N · 12 Endogenous + 1 Exogenous)
            </h3>
            <p className="text-xs text-slate-400">
              12 endogenous wearable vitals (2.5s beat-to-beat fluctuation) + 1 exogenous dosimetry channel synced with NASA SRAG / CSA RAD.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-xl border border-cyan-500/35 bg-cyan-500/10 px-2.5 py-1 font-mono-hud text-[10px] font-bold text-cyan-200">
              Pre-Flight Individual Baseline: NASA MedOps / OSDR
            </span>
            {onJumpToWearable && (
              <button
                type="button"
                onClick={onJumpToWearable}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-sky-500/35 bg-sky-500/10 px-2.5 py-1 text-[11px] font-semibold text-sky-300 transition hover:bg-sky-500/20"
              >
                <Watch className="h-3.5 w-3.5" />
                Open Bio-Monitor 3N (13 channels)
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Heart Rate (Thoracic)"
            value={`${b.bpm}`}
            unit="bpm"
            badgeText="ENDOGENOUS · 3N CHEST"
            subtitle="Resting cardiac cadence captured by chest leads (±1–2 bpm live tick)"
            status={evaluateBpmStatus(b.bpm)}
            trend={getTrend(b.bpm, prev.bpm, 1.5)}
            progressPercent={(b.bpm / 150) * 100}
            icon={<HeartPulse className="h-4 w-4" />}
            onClick={() => onSelectSystemZone("corazon")}
          />
          <MetricCard
            title="Cardiac Recovery (Thoracic)"
            value={`${Math.min(100, Math.round((b.hrvRmssdMs / 60) * 100))}%`}
            unit={`(${b.hrvRmssdMs} ms)`}
            badgeText="ENDOGENOUS · 3N CHEST"
            subtitle="Autonomic vagal recovery & parasympathetic tone (±1 ms tick)"
            status={evaluateHrvStatus(b.hrvRmssdMs)}
            trend={getTrend(b.hrvRmssdMs, prev.hrvRmssdMs, 1.5)}
            trendPositiveIsGood
            progressPercent={Math.min(100, (b.hrvRmssdMs / 70) * 100)}
            icon={<Activity className="h-4 w-4" />}
            onClick={() => onSelectSystemZone("corazon")}
          />
          <MetricCard
            title="Blood Pressure (Frontal PTT)"
            value={`${b.systolicBP}/${b.diastolicBP}`}
            unit="mmHg"
            badgeText={`ENDOGENOUS · PTT ${b.pttMs} ms`}
            subtitle={
              environmentId === "iss" || environmentId === "nave"
                ? "0g cephalad vasodilation baseline (~112/72 mmHg; ±1 mmHg tick)"
                : "Partial-g orthostatic BP estimation (±1 mmHg, PTT ±2 ms)"
            }
            status={evaluateBpStatus(b.systolicBP, b.diastolicBP)}
            trend={getTrend(b.systolicBP, prev.systolicBP, 2)}
            progressPercent={(b.systolicBP / 170) * 100}
            icon={<Gauge className="h-4 w-4" />}
            onClick={() => onSelectSystemZone("corazon")}
          />
          <MetricCard
            title="Cranial SpO₂ (Frontal)"
            value={`${b.spo2Percent}%`}
            unit={`· Pulse ${b.perfusionIndex.toFixed(1)}%`}
            badgeText="ENDOGENOUS · 3N FRONTAL"
            subtitle={
              environmentId === "luna" || environmentId === "marte"
                ? `Hypobaric ${env.cabinPressureKpa} kPa exploration norm (nominal 94–96%)`
                : "Arterial oxygen saturation & perfusion (sea-level norm 95–100%)"
            }
            status={spo2PiStatus}
            trend={getTrend(b.spo2Percent, prev.spo2Percent, 0.5)}
            trendPositiveIsGood
            progressPercent={b.spo2Percent}
            icon={<Activity className="h-4 w-4" />}
            onClick={() => onSelectSystemZone("corazon")}
          />
          <MetricCard
            title="Respiration & Flow (Thoracic)"
            value={`${b.respiratoryRateRpm} /min`}
            unit={`· ${b.minuteVentilationLpm.toFixed(1)} L/m`}
            badgeText="ENDOGENOUS · 3N RIP"
            subtitle="Respiratory cadence & minute ventilation (±1 rpm, ±0.2 L/min)"
            status={respRipStatus}
            trend={getTrend(b.respiratoryRateRpm, prev.respiratoryRateRpm, 1)}
            progressPercent={(b.respiratoryRateRpm / 28) * 100}
            icon={<Wind className="h-4 w-4" />}
            onClick={() => onSelectSystemZone("corazon")}
          />
          <MetricCard
            title="Core & Skin Temp (ZHF)"
            value={`${b.bodyTempC.toFixed(2)} °C`}
            unit={`· Skin ${b.skinTempC.toFixed(2)} °C`}
            badgeText="ENDOGENOUS · ±0.05 °C TICK"
            subtitle={
              environmentId === "iss" || environmentId === "nave"
                ? "Zero-heat-flux core temp (0g Space Fever ~37.10 °C baseline)"
                : "Zero-heat-flux internal core temperature & peripheral gradient"
            }
            status={thermalZhfStatus}
            trend={getTrend(b.bodyTempC, prev.bodyTempC, 0.15)}
            progressPercent={((b.bodyTempC - 34) / 6) * 100}
            icon={<Thermometer className="h-4 w-4" />}
            onClick={() => onSelectSystemZone("abdomen")}
          />
          <MetricCard
            title="Posture & Sleep (Thoracic)"
            value={`${b.postureScore}%`}
            unit={`· ${b.sleepHours.toFixed(1)} h`}
            badgeText="ENDOGENOUS · 3N CHEST"
            subtitle="Upper-body ergonomics & uninterrupted sleep duration"
            status={postureSleepStatus}
            trend={getTrend(b.postureScore, prev.postureScore, 2)}
            trendPositiveIsGood
            progressPercent={b.postureScore}
            icon={<Watch className="h-4 w-4" />}
            onClick={() => onSelectSystemZone("musculo")}
          />
          <MetricCard
            title="Dosimetry & Vocal (Node 3)"
            value={`${b.dailyRadiationMsv.toFixed(2)} mSv/d`}
            unit={`· ${Math.max(0, Math.min(100, Math.round((1 - b.dailyRadiationMsv / CSA_RADIATION_LIMITS.dailyAlertMsv) * 100)))}% shield`}
            badgeText="EXOGENOUS RAD · NASA SRAG / CSA"
            subtitle={`Synced NASA MSL/RAD & SRAG telemetry (${careerRadPct}% career) · Vocal calm: ${100 - b.facialTension}%`}
            status={radStatus}
            trend={getTrend(b.dailyRadiationMsv, prev.dailyRadiationMsv, 0.05)}
            progressPercent={(b.dailyRadiationMsv / 2.2) * 100}
            icon={<Radiation className="h-4 w-4" />}
            onClick={() => onSelectSystemZone("endocrino")}
          />
        </div>
      </div>

      {/* Longitudinal (NASA DEXA) & 24h Circadian Variations (Not Instantaneous Sensors) */}
      <div className="rounded-2xl border border-[#1b2d4b] bg-[#0c1426] p-4 shadow-[0_14px_34px_rgba(2,6,23,0.45)] sm:p-5">
        <div className="mb-3.5 flex flex-wrap items-center justify-between gap-2 border-b border-[#182742] pb-2.5">
          <div>
            <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-cyan-300 sm:text-base">
              <Clock className="h-4 w-4" />
              NASA MedOps Pre-Flight Baseline · Longitudinal (DEXA) &amp; 24h Circadian
            </h3>
            <p className="text-xs text-slate-400">
              Separates multi-month DEXA bone density projections and 24-hour UTC endocrine oscillations from instantaneous wearable channels.
            </p>
          </div>
          <span className="rounded-xl border border-cyan-500/35 bg-cyan-500/10 px-2.5 py-1 font-mono-hud text-[10px] font-bold text-cyan-200">
            Mission Clock: {utcNow.label} · Pre-Flight Baseline: NASA MedOps / OSDR
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <MetricCard
            title="Bone Mineral Density (BMD · DEXA)"
            value={`${b.boneDensityIndex.toFixed(1)}%`}
            unit="of pre-flight DEXA"
            badgeText="LONGITUDINAL PROJECTION · NOT INSTANT SENSOR"
            subtitle={`Longitudinal projection over NASA Pre-Flight DEXA Baseline (-1.0 to -1.5%/mo in 0g), modulated by ARED exercise (${routine.exerciseMinutes}/${routine.baselineExerciseMinutes} min) · ${env.gravityLabel}.`}
            status={evaluateBoneDensityStatus(b.boneDensityIndex)}
            trend={getTrend(b.boneDensityIndex, prev.boneDensityIndex, 0.3)}
            trendPositiveIsGood
            progressPercent={b.boneDensityIndex}
            icon={<Activity className="h-4 w-4" />}
            onClick={() => onSelectSystemZone("musculo")}
          />
          <MetricCard
            title="Cortisol (HPA Axis Curve)"
            value={`${b.cortisolIndex}`}
            unit="/100 index"
            badgeText={`24H CIRCADIAN · ${cortisolPhase}`}
            subtitle={`Circadian Phase Variation (Mission Clock ${utcNow.label}): physiologic 24h peak-trough oscillation peaking ~06–09h UTC (acrophase) to nocturnal nadir ~00–03h UTC.`}
            status={evaluateCortisolStatus(b.cortisolIndex)}
            trend={getTrend(b.cortisolIndex, prev.cortisolIndex, 2)}
            progressPercent={b.cortisolIndex}
            icon={<Sun className="h-4 w-4" />}
            onClick={() => onSelectSystemZone("endocrino")}
          />
          <MetricCard
            title="Melatonin (SSLA Circadian Drive)"
            value={`${b.melatoninIndex}`}
            unit="/100 index"
            badgeText={`24H CIRCADIAN · ${melatoninPhase}`}
            subtitle={`Circadian Phase Variation (Mission Clock ${utcNow.label}): 24h physiologic peak-trough swing rising after ~21h UTC DLMO onset to ~02–04h UTC peak, suppressed in daylight.`}
            status={evaluateMelatoninStatus(b.melatoninIndex)}
            trend={getTrend(b.melatoninIndex, prev.melatoninIndex, 2)}
            trendPositiveIsGood
            progressPercent={b.melatoninIndex}
            icon={<Moon className="h-4 w-4" />}
            onClick={() => onSelectSystemZone("endocrino")}
          />
        </div>
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
              Behavioral & Neurocognitive Health (BHP)
            </h3>
            <p className="text-xs text-slate-400">
              Mood stability, cognitive stamina, sleep architecture, and relaxation across deep spaceflight.
            </p>
          </div>
          <span className="font-mono-hud text-[11px] text-slate-400">
            Face: {lastCameraFinding}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Cognitive Fatigue"
            value={`${b.mentalFatigue}%`}
            unit=""
            subtitle="Subjective cognitive strain and focus endurance"
            status={evaluateMentalFatigueStatus(b.mentalFatigue)}
            trend={getTrend(b.mentalFatigue, prev.mentalFatigue, 2)}
            progressPercent={b.mentalFatigue}
            icon={<BatteryCharging className="h-4 w-4" />}
            onClick={() => onSelectSystemZone("cerebro")}
          />
          <MetricCard
            title="Stress Level"
            value={`${b.stressLevel}%`}
            unit=""
            subtitle="Physiological arousal and operational strain index"
            status={evaluateStressStatus(b.stressLevel)}
            trend={getTrend(b.stressLevel, prev.stressLevel, 2)}
            progressPercent={b.stressLevel}
            icon={<Flame className="h-4 w-4" />}
            onClick={() => onSelectSystemZone("cerebro")}
          />
          <MetricCard
            title="Sleep Duration"
            value={b.sleepHours.toFixed(1)}
            unit={`h (${Math.min(100, Math.round((b.sleepHours / 8) * 100))}%)`}
            subtitle="Target uninterrupted sleep window: 7–8.5 hours"
            status={evaluateSleepStatus(b.sleepHours)}
            trend={getTrend(b.sleepHours, prev.sleepHours, 0.2)}
            trendPositiveIsGood
            progressPercent={(b.sleepHours / 9) * 100}
            icon={<BedDouble className="h-4 w-4" />}
            onClick={() => onSelectSystemZone("cerebro")}
          />
          <MetricCard
            title="Posture & Facial Relaxation"
            value={`${b.postureScore}%`}
            unit=""
            subtitle={`Ocular & facial calm index: ${100 - b.facialTension}%`}
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
