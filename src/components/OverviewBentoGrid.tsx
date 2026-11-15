"use client";

import React, { useSyncExternalStore } from "react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Camera,
  Globe,
  ScanLine,
  Sliders,
  Watch,
} from "lucide-react";
import {
  CSA_RADIATION_LIMITS,
  MISSION_ENVIRONMENTS,
} from "@/data/missionData";
import {
  BiomarkerData,
  HealthStatus,
  MissionEnvironmentId,
  RoutineTracking,
  SystemZoneId,
  TelemetryPoint,
} from "@/types/astronaut";
import {
  computeRoutineDeviations,
  STATUS_HEX,
} from "@/utils/healthEngine";
import { StatusPill } from "@/components/ui/StatusPill";
import { ScanModalTab } from "./MultimodalScanModal";

interface OverviewBentoGridProps {
  environmentId: MissionEnvironmentId;
  biomarkers: BiomarkerData;
  routine: RoutineTracking;
  zoneStatuses: Record<SystemZoneId, HealthStatus>;
  readinessScore: number;
  history: TelemetryPoint[];
  onSelectZoneAndScroll: (zone: SystemZoneId) => void;
  onNavigateWearable: () => void;
  onOpenScanTab: (tab: ScanModalTab) => void;
}

const emptySubscribe = () => () => {};

/**
 * Cohesive Aerospace Cyan-to-Emerald nominal spectrum (zero decorative purples).
 * Automatically overridden by Amber (#f59e0b) or Crimson (#ef4444) when a zone
 * enters Warning or Critical status.
 */
const ZONE_PALETTE: Record<SystemZoneId, string> = {
  cerebro: "#38bdf8",
  rostro: "#0ea5e9",
  corazon: "#22c55e",
  endocrino: "#2dd4bf",
  abdomen: "#10b981",
  musculo: "#06b6d4",
};

const ZONE_LIST: SystemZoneId[] = [
  "cerebro",
  "rostro",
  "corazon",
  "endocrino",
  "abdomen",
  "musculo",
];

const ZONE_RADAR_LABELS: Record<SystemZoneId, string> = {
  cerebro: "Mente",
  rostro: "Rostro",
  corazon: "Corazón",
  endocrino: "Defensas",
  abdomen: "Energía",
  musculo: "Fuerza",
};

const ZONE_SIMPLE_NAMES: Record<SystemZoneId, string> = {
  cerebro: "Neuro-Cognitivo (BHP)",
  rostro: "Oculomotor y Postura",
  corazon: "Cardiovascular y Ventilación",
  endocrino: "Inmuno-Endocrino y Sueño",
  abdomen: "Metabólico e Hidratación",
  musculo: "Músculo-Esquelético (ARED)",
};

function getZoneScore(zone: SystemZoneId, b: BiomarkerData): number {
  switch (zone) {
    case "cerebro":
      return Math.max(15, Math.round(100 - (b.mentalFatigue + b.stressLevel) / 2));
    case "rostro":
      return Math.round((b.postureScore + (100 - b.facialTension)) / 2);
    case "corazon":
      return b.bpm <= 92 && b.bpm >= 52 ? 92 : b.bpm <= 115 ? 64 : 32;
    case "endocrino":
      return Math.max(18, Math.round((100 - b.cortisolIndex + b.melatoninIndex) / 2));
    case "abdomen":
      return Math.max(
        18,
        Math.round(
          (b.hydrationPercent + (b.bloodGlucoseMgDl >= 74 && b.bloodGlucoseMgDl <= 125 ? 92 : 48)) /
            2
        )
      );
    case "musculo":
      return Math.max(18, Math.round((100 - b.physicalFatigue + b.boneDensityIndex) / 2));
  }
}

export default function OverviewBentoGrid({
  environmentId,
  biomarkers: b,
  routine,
  zoneStatuses,
  readinessScore,
  history,
  onSelectZoneAndScroll,
  onNavigateWearable,
  onOpenScanTab,
}: OverviewBentoGridProps) {
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const env = MISSION_ENVIRONMENTS[environmentId];
  const routineAnalysis = computeRoutineDeviations(routine);

  const donutData = ZONE_LIST.map((id) => ({
    id,
    name: ZONE_SIMPLE_NAMES[id],
    shortLabel: ZONE_RADAR_LABELS[id],
    value: getZoneScore(id, b),
    baseline: 80,
    status: zoneStatuses[id],
    color:
      zoneStatuses[id] === "critical"
        ? STATUS_HEX.critical
        : zoneStatuses[id] === "warning"
        ? STATUS_HEX.warning
        : ZONE_PALETTE[id],
  }));

  const hasCriticalZone = donutData.some((z) => z.status === "critical");
  const hasWarningZone = donutData.some((z) => z.status === "warning");
  const radarPolygonColor = hasCriticalZone
    ? "#ef4444"
    : hasWarningZone
    ? "#f59e0b"
    : "#38bdf8";

  const shieldProtectionPct = Math.max(
    0,
    Math.min(
      100,
      Math.round((1 - b.dailyRadiationMsv / CSA_RADIATION_LIMITS.dailyAlertMsv) * 100)
    )
  );
  const calmPct = Math.max(0, Math.round(100 - (b.mentalFatigue + b.stressLevel) / 2));
  const cleanAirPct = Math.max(0, Math.min(100, Math.round((1 - env.co2MmHg / 6) * 100)));

  const hazardBars: {
    label: string;
    metric: string;
    pct: number;
    status: HealthStatus;
    color: string;
    onClick: () => void;
  }[] = [
    {
      label: "Blindaje Radiológico (GCR / SPE)",
      metric: `${b.dailyRadiationMsv.toFixed(2)} mSv/d`,
      pct: shieldProtectionPct,
      status:
        b.dailyRadiationMsv > 1.2
          ? "critical"
          : b.dailyRadiationMsv > 0.7
          ? "warning"
          : "optimal",
      color:
        b.dailyRadiationMsv > 1.2
          ? "#ef4444"
          : b.dailyRadiationMsv > 0.7
          ? "#f59e0b"
          : "#38bdf8",
      onClick: onNavigateWearable,
    },
    {
      label: "Densidad Ósea y Carga ARED",
      metric: `Índice ${b.boneDensityIndex.toFixed(0)}%`,
      pct: Math.round(b.boneDensityIndex),
      status:
        b.boneDensityIndex < 82
          ? "critical"
          : b.boneDensityIndex < 90
          ? "warning"
          : "optimal",
      color:
        b.boneDensityIndex < 82
          ? "#ef4444"
          : b.boneDensityIndex < 90
          ? "#f59e0b"
          : "#0ea5e9",
      onClick: () => onSelectZoneAndScroll("musculo"),
    },
    {
      label: "Salud Conductual (NASA BHP)",
      metric: `Estrés ${b.stressLevel}%`,
      pct: calmPct,
      status: calmPct < 45 ? "critical" : calmPct < 68 ? "warning" : "optimal",
      color: calmPct < 45 ? "#ef4444" : calmPct < 68 ? "#f59e0b" : "#2dd4bf",
      onClick: () => onSelectZoneAndScroll("cerebro"),
    },
    {
      label: "Control de CO₂ (Sistema CDRA)",
      metric: `CO₂ ${env.co2MmHg.toFixed(1)} mmHg`,
      pct: cleanAirPct,
      status:
        env.co2MmHg >= 4.2
          ? "critical"
          : env.co2MmHg >= 3.2
          ? "warning"
          : "optimal",
      color:
        env.co2MmHg >= 4.2
          ? "#ef4444"
          : env.co2MmHg >= 3.2
          ? "#f59e0b"
          : "#38bdf8",
      onClick: () => onSelectZoneAndScroll("corazon"),
    },
    {
      label: "Sincronía Circadiana (Fase Solar)",
      metric: `Sueño ${b.sleepHours.toFixed(1)}h`,
      pct: routineAnalysis.stabilityScore,
      status:
        routineAnalysis.stabilityScore < 55
          ? "critical"
          : routineAnalysis.stabilityScore < 75
          ? "warning"
          : "optimal",
      color:
        routineAnalysis.stabilityScore < 55
          ? "#ef4444"
          : routineAnalysis.stabilityScore < 75
          ? "#f59e0b"
          : "#22c55e",
      onClick: () => onSelectZoneAndScroll("endocrino"),
    },
  ];

  const cabinSafetyScore = Math.round(
    hazardBars.reduce((acc, item) => acc + item.pct, 0) / hazardBars.length
  );
  const cabinRingCircumference = 2 * Math.PI * 46;
  const cabinRingOffset =
    cabinRingCircumference - (cabinSafetyScore / 100) * cabinRingCircumference;
  const cabinRingColor =
    cabinSafetyScore < 55
      ? "#ef4444"
      : cabinSafetyScore < 75
      ? "#f59e0b"
      : "#38bdf8";

  const reportSummaryRows = [
    { label: "Frecuencia Cardíaca (ECG)", val: `${b.bpm} lat/min`, pct: Math.min(100, Math.round((b.bpm / 140) * 100)), color: "#22c55e" },
    { label: "Presión Arterial (PTT)", val: `${b.systolicBP}/${b.diastolicBP} mmHg`, pct: Math.min(100, Math.round((b.systolicBP / 160) * 100)), color: "#38bdf8" },
    { label: "Saturación Arterial (SpO₂)", val: `${b.spo2Percent}%`, pct: b.spo2Percent, color: "#0ea5e9" },
    { label: "Ciclo de Sueño (BHP)", val: `${b.sleepHours.toFixed(1)} h (${Math.min(100, Math.round((b.sleepHours / 8) * 100))}%)`, pct: Math.min(100, Math.round((b.sleepHours / 9) * 100)), color: "#2dd4bf" },
    { label: "Alineación Postural (0g)", val: `${b.postureScore}%`, pct: b.postureScore, color: "#10b981" },
    { label: "Estabilidad Vocal / Facial", val: `${100 - b.facialTension}%`, pct: 100 - b.facialTension, color: "#38bdf8" },
  ];

  return (
    <section
      id="resumen-bento"
      aria-label="Panel Ejecutivo de Misión"
      className="grid grid-cols-1 gap-4 lg:grid-cols-2"
    >
      {/* CARD 1 (Top-Left): Estado de Sistemas Corporales */}
      <div className="rounded-2xl border border-[#1b2d4b] bg-[#0c1426] p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-100">
              Estado de Subsistemas Fisiológicos (NASA HRP)
            </h2>
            <p className="text-[11px] text-slate-400">
              Evaluación integral de las 6 zonas anatómicas (umbral nominal ≥ 80%).
            </p>
          </div>
          <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 font-mono-hud text-xs font-semibold text-emerald-400">
            Flight Readiness: {readinessScore}% NOMINAL
          </span>
        </div>

        <div className="grid grid-cols-1 items-center gap-4 sm:grid-cols-12">
          <div className="relative flex h-[200px] flex-col items-center justify-center sm:col-span-5">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart
                  cx="50%"
                  cy="50%"
                  outerRadius="70%"
                  data={donutData}
                >
                  <PolarGrid gridType="polygon" stroke="#1d3254" />
                  <PolarAngleAxis
                    dataKey="shortLabel"
                    tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 600 }}
                  />
                  <PolarRadiusAxis
                    angle={30}
                    domain={[0, 100]}
                    tick={false}
                    axisLine={false}
                  />
                  {/* Meta saludable (80%) */}
                  <Radar
                    name="Meta Saludable"
                    dataKey="baseline"
                    stroke="#475569"
                    strokeWidth={1.2}
                    strokeDasharray="3 3"
                    fill="none"
                  />
                  {/* Estado Actual (%) */}
                  <Radar
                    name="Tu Nivel Hoy"
                    dataKey="value"
                    stroke={radarPolygonColor}
                    strokeWidth={2.2}
                    fill={radarPolygonColor}
                    fillOpacity={0.22}
                    dot={{
                      r: 3.2,
                      fill: radarPolygonColor,
                      stroke: "#0c1426",
                      strokeWidth: 1.5,
                    }}
                  />
                  <Tooltip
                    formatter={(val, name) => [`${val}%`, String(name)]}
                    contentStyle={{
                      backgroundColor: "#081020",
                      borderColor: "#1e3254",
                      borderRadius: "0.75rem",
                      fontSize: "12px",
                      color: "#f1f5f9",
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-36 w-36 rounded-full border-2 border-sky-900/40" />
            )}
            <div className="mt-0.5 flex items-center gap-3 font-mono-hud text-[10px] text-slate-400">
              <span className="flex items-center gap-1">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: radarPolygonColor }}
                />
                Tu Nivel (%)
              </span>
              <span className="flex items-center gap-1">
                <span className="h-0.5 w-3 border-t border-dashed border-slate-400" />
                Meta 80%
              </span>
            </div>
          </div>

          <div className="space-y-2.5 sm:col-span-7">
            {donutData.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectZoneAndScroll(item.id)}
                className="block w-full cursor-pointer rounded-lg px-2 py-1.5 text-left transition hover:bg-[#13203a]"
              >
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="flex min-w-0 items-center gap-2">
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="truncate text-xs font-medium text-slate-200">
                      {item.name}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2 font-mono-hud">
                    <span className="text-xs font-bold text-slate-100">
                      {item.value}%
                    </span>
                    <StatusPill status={item.status} />
                  </span>
                </div>

                <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-[#15233d]">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${item.value}%`,
                      backgroundColor: item.color,
                    }}
                  />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* CARD 2 (Top-Right): Soporte Vital ECLSS y Riesgos NASA HRP */}
      <div className="rounded-2xl border border-[#1b2d4b] bg-[#0c1426] p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-100">
              Soporte Vital ECLSS y Riesgos NASA HRP
            </h2>
            <p className="text-[11px] text-slate-400">
              Control ambiental de cabina (ECLSS), blindaje radiológico y sincronía de misión.
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-500/30 bg-sky-500/10 px-2.5 py-1 font-mono-hud text-xs font-semibold text-sky-300">
            <Globe className="h-3.5 w-3.5 text-sky-400" />
            {env.shortName}
          </span>
        </div>

        <div className="grid grid-cols-1 items-center gap-4 sm:grid-cols-12">
          {/* Izquierda: Anillo Radial ECLSS + Telemetría Física */}
          <div className="flex flex-col items-center justify-between rounded-xl border border-[#172846] bg-[#081020] p-3 sm:col-span-5">
            <div className="relative flex h-32 w-32 items-center justify-center">
              <svg className="h-full w-full -rotate-90" viewBox="0 0 112 112">
                <circle
                  cx="56"
                  cy="56"
                  r="46"
                  fill="none"
                  stroke="#15233d"
                  strokeWidth="8"
                />
                <circle
                  cx="56"
                  cy="56"
                  r="38"
                  fill="none"
                  stroke="#1b2e4f"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                />
                <circle
                  cx="56"
                  cy="56"
                  r="46"
                  fill="none"
                  stroke={cabinRingColor}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={cabinRingCircumference}
                  strokeDashoffset={cabinRingOffset}
                  className="transition-all duration-700"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="font-mono-hud text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                  ECLSS
                </span>
                <span className="font-mono-hud text-2xl font-extrabold text-slate-100">
                  {cabinSafetyScore}%
                </span>
                <span
                  className="font-mono-hud text-[10px] font-bold"
                  style={{ color: cabinRingColor }}
                >
                  {cabinSafetyScore >= 75
                    ? "NOMINAL"
                    : cabinSafetyScore >= 55
                    ? "PRECAUCIÓN"
                    : "CRÍTICO"}
                </span>
              </div>
            </div>

            <div className="mt-2 grid w-full grid-cols-3 gap-1.5 border-t border-[#162642] pt-2 text-center font-mono-hud">
              <div className="rounded-lg bg-[#0c162b] px-1.5 py-1">
                <div className="text-[9px] uppercase text-slate-400">Carga-G</div>
                <div className="text-[11px] font-bold text-sky-300">
                  {env.gravityLabel.split(" ")[0]}
                </div>
              </div>
              <div className="rounded-lg bg-[#0c162b] px-1.5 py-1">
                <div className="text-[9px] uppercase text-slate-400">Cabina ECLSS</div>
                <div className="text-[11px] font-bold text-slate-200">
                  {env.cabinPressureKpa} kPa
                </div>
              </div>
              <div className="rounded-lg bg-[#0c162b] px-1.5 py-1">
                <div className="text-[9px] uppercase text-slate-400">Enlace DSN</div>
                <div className="text-[11px] font-bold text-emerald-300">
                  {env.commLatencyLabel.split(" ")[0]}
                </div>
              </div>
            </div>
          </div>

          {/* Derecha: 5 Barras Interactivas con Unidad Física y Estado de Alarma */}
          <div className="space-y-2.5 sm:col-span-7">
            {hazardBars.map((bar) => (
              <button
                key={bar.label}
                type="button"
                onClick={bar.onClick}
                className="block w-full cursor-pointer rounded-lg px-2 py-1.5 text-left transition hover:bg-[#13203a]"
              >
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="flex min-w-0 items-center gap-2">
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: bar.color }}
                    />
                    <span className="truncate text-xs font-medium text-slate-200">
                      {bar.label}
                    </span>
                    <span className="hidden rounded border border-[#1f3458] bg-[#091224] px-1.5 py-0.5 font-mono-hud text-[10px] text-slate-400 xl:inline-block">
                      {bar.metric}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2 font-mono-hud">
                    <span className="text-xs font-bold text-slate-100">
                      {bar.pct}%
                    </span>
                    <StatusPill status={bar.status} />
                  </span>
                </div>

                <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-[#15233d]">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.max(8, bar.pct)}%`,
                      backgroundColor: bar.color,
                    }}
                  />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* CARD 3 (Bottom-Left): Módulos de Diagnóstico a Bordo (In-Flight Medical) */}
      <div className="rounded-2xl border border-[#1b2d4b] bg-[#0c1426] p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-100">
              Módulos de Diagnóstico a Bordo (In-Flight Medical)
            </h2>
            <p className="text-[11px] text-slate-400">
              Acceso directo al Bio-Escáner HRP, telemetría del Arnés 3N y registro clínico.
            </p>
          </div>
          <span className="font-mono-hud text-xs font-medium text-sky-400">
            NASA-STD-3001
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Módulo 1: Escáner SVG */}
          <button
            type="button"
            onClick={() => onSelectZoneAndScroll("cerebro")}
            className="group flex cursor-pointer flex-col justify-between rounded-xl border border-[#1e3254] bg-[#091120] p-3.5 text-left transition hover:border-sky-400/60 hover:bg-[#0e192f]"
          >
            <div className="flex items-center justify-between">
              <span className="rounded border border-sky-500/30 bg-sky-500/10 px-1.5 py-0.5 font-mono-hud text-[10px] font-bold uppercase tracking-wider text-sky-300">
                BIO-ESCÁNER HRP
              </span>
              <ScanLine className="h-5 w-5 text-sky-400 transition group-hover:scale-110" />
            </div>
            <div className="mt-3">
              <div className="text-sm font-bold text-slate-100">
                Protocolos (6 Subsistemas)
              </div>
              <div className="mt-0.5 text-[11px] text-slate-400">
                Guía de examen y contramedidas clínicas
              </div>
            </div>
          </button>

          {/* Módulo 2: Cámara IA */}
          <button
            type="button"
            onClick={() => onOpenScanTab("camara")}
            className="group flex cursor-pointer flex-col justify-between rounded-xl border border-[#1e3254] bg-[#091120] p-3.5 text-left transition hover:border-sky-400/60 hover:bg-[#0e192f]"
          >
            <div className="flex items-center justify-between">
              <span className="rounded border border-teal-500/30 bg-teal-500/10 px-1.5 py-0.5 font-mono-hud text-[10px] font-bold uppercase tracking-wider text-teal-300">
                VISIÓN COMPUTACIONAL
              </span>
              <Camera className="h-5 w-5 text-teal-400 transition group-hover:scale-110" />
            </div>
            <div className="mt-3">
              <div className="text-sm font-bold text-slate-100">
                Postura {b.postureScore}% · Biometría
              </div>
              <div className="mt-0.5 text-[11px] text-slate-400">
                Evaluación oculomotora y tensión facial
              </div>
            </div>
          </button>

          {/* Módulo 3: Arnés Vestible */}
          <button
            type="button"
            onClick={onNavigateWearable}
            className="group flex cursor-pointer flex-col justify-between rounded-xl border border-[#1e3254] bg-[#091120] p-3.5 text-left transition hover:border-sky-400/60 hover:bg-[#0e192f]"
          >
            <div className="flex items-center justify-between">
              <span className="rounded border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 font-mono-hud text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                BIO-MONITOR CSA
              </span>
              <Watch className="h-5 w-5 text-emerald-400 transition group-hover:scale-110" />
            </div>
            <div className="mt-3">
              <div className="text-sm font-bold text-slate-100">
                Arnés 3N (13 Canales)
              </div>
              <div className="mt-0.5 text-[11px] text-slate-400">
                Nodos Torácico, Cefálico y Radial
              </div>
            </div>
          </button>

          {/* Módulo 4: Registro Manual */}
          <button
            type="button"
            onClick={() => onOpenScanTab("manual")}
            className="group flex cursor-pointer flex-col justify-between rounded-xl border border-[#1e3254] bg-[#091120] p-3.5 text-left transition hover:border-sky-400/60 hover:bg-[#0e192f]"
          >
            <div className="flex items-center justify-between">
              <span className="rounded border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 font-mono-hud text-[10px] font-bold uppercase tracking-wider text-amber-300">
                BITÁCORA MÉDICA
              </span>
              <Sliders className="h-5 w-5 text-amber-400 transition group-hover:scale-110" />
            </div>
            <div className="mt-3">
              <div className="text-sm font-bold text-slate-100">
                Registro Clínico Manual
              </div>
              <div className="mt-0.5 text-[11px] text-slate-400">
                Actualización de biomarcadores y rutina
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* CARD 4 (Bottom-Right): Telemetría Longitudinal de Misión */}
      <div className="rounded-2xl border border-[#1b2d4b] bg-[#0c1426] p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-100">
              Telemetría Longitudinal de Misión
            </h2>
            <p className="text-[11px] text-slate-400">
              Tendencia cardiovascular, balance hídrico y estabilidad neuro-vestibular.
            </p>
          </div>
          <span className="font-mono-hud text-xs font-semibold text-sky-400">
            Ventana: {history.length} Soles
          </span>
        </div>

        <div className="grid grid-cols-1 items-center gap-4 sm:grid-cols-12">
          <div className="h-[190px] sm:col-span-7">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={history}
                  margin={{ top: 8, right: 8, left: -24, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#182742"
                  />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: "#8b9db8", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "#8b9db8", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#081020",
                      borderColor: "#1e3254",
                      borderRadius: "0.75rem",
                      fontSize: "12px",
                      color: "#f1f5f9",
                    }}
                  />
                  <Bar
                    dataKey="hydration"
                    name="Hidratación (%)"
                    fill="#162847"
                    radius={[4, 4, 0, 0]}
                    barSize={14}
                  />
                  <Line
                    type="monotone"
                    dataKey="bpm"
                    name="Pulso (BPM)"
                    stroke="#38bdf8"
                    strokeWidth={2.5}
                    dot={{ r: 3.5, fill: "#38bdf8", strokeWidth: 0 }}
                    activeDot={{ r: 5 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full rounded-xl bg-[#091120]" />
            )}
          </div>

          <div className="space-y-2.5 sm:col-span-5">
            {reportSummaryRows.map((row) => (
              <div key={row.label} className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-medium text-slate-300">{row.label}</span>
                  <span className="font-mono-hud font-semibold text-slate-100">
                    {row.val}
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#15233d]">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.max(8, row.pct)}%`,
                      backgroundColor: row.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
