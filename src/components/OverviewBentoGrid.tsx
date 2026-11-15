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
  STATUS_LABELS,
} from "@/utils/healthEngine";
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
  cerebro: "Mente y Descanso",
  rostro: "Rostro y Postura",
  corazon: "Corazón y Aire",
  endocrino: "Defensas y Sueño",
  abdomen: "Agua y Energía",
  musculo: "Músculos y Huesos",
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
  const calmPct = Math.max(0, Math.round(100 - (b.lonelinessLevel + b.stressLevel) / 2));
  const cleanAirPct = Math.max(0, Math.min(100, Math.round((1 - env.co2MmHg / 6) * 100)));

  const hazardBars = [
    {
      label: "Escudo de Radiación",
      pct: shieldProtectionPct,
      text: `${shieldProtectionPct}% seguro`,
      color: b.dailyRadiationMsv > 1.2 ? "#ef4444" : b.dailyRadiationMsv > 0.7 ? "#f59e0b" : "#38bdf8",
    },
    {
      label: "Fuerza en Huesos",
      pct: Math.round(b.boneDensityIndex),
      text: `${Math.round(b.boneDensityIndex)}%`,
      color: "#0ea5e9",
    },
    {
      label: "Calma y Ánimo",
      pct: calmPct,
      text: `${calmPct}%`,
      color: calmPct < 45 ? "#f59e0b" : "#2dd4bf",
    },
    {
      label: "Aire Limpio en Cabina",
      pct: cleanAirPct,
      text: `${cleanAirPct}% puro`,
      color: env.co2MmHg >= 3.5 ? "#f59e0b" : "#38bdf8",
    },
    {
      label: "Orden en tu Rutina",
      pct: routineAnalysis.stabilityScore,
      text: `${routineAnalysis.stabilityScore}%`,
      color: routineAnalysis.stabilityScore < 70 ? "#f59e0b" : "#22c55e",
    },
  ];

  const reportSummaryRows = [
    { label: "Ritmo del corazón", val: `${b.bpm} lat/min`, pct: Math.min(100, Math.round((b.bpm / 140) * 100)), color: "#22c55e" },
    { label: "Fuerza de la sangre", val: `${b.systolicBP}/${b.diastolicBP}`, pct: Math.min(100, Math.round((b.systolicBP / 160) * 100)), color: "#38bdf8" },
    { label: "Oxígeno en el cuerpo", val: `${b.spo2Percent}%`, pct: b.spo2Percent, color: "#0ea5e9" },
    { label: "Horas de sueño", val: `${b.sleepHours.toFixed(1)} h (${Math.min(100, Math.round((b.sleepHours / 8) * 100))}%)`, pct: Math.min(100, Math.round((b.sleepHours / 9) * 100)), color: "#2dd4bf" },
    { label: "Postura de espalda", val: `${b.postureScore}%`, pct: b.postureScore, color: "#10b981" },
    { label: "Calma al hablar", val: `${100 - b.facialTension}%`, pct: 100 - b.facialTension, color: "#38bdf8" },
  ];

  return (
    <section
      id="resumen-bento"
      aria-label="Panel Ejecutivo de Misión"
      className="grid grid-cols-1 gap-4 lg:grid-cols-2"
    >
      {/* CARD 1 (Top-Left): Estado de Sistemas Corporales */}
      <div className="rounded-2xl border border-[#1b2d4b] bg-[#0c1426] p-5">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-100">
              Estado de tu Cuerpo (6 Zonas)
            </h2>
            <p className="text-[11px] text-slate-400">
              Si una barra pasa del 80%, esa parte de tu cuerpo está trabajando bien.
            </p>
          </div>
          <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 font-mono-hud text-xs font-semibold text-emerald-400">
            Salud: {readinessScore}%
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

          <div className="space-y-2 sm:col-span-7">
            {/* Barra superior de escala de porcentajes (0% - 100%) */}
            <div className="rounded-lg border border-[#1a2c4a] bg-[#091120] px-2.5 py-1.5">
              <div className="flex items-center justify-between font-mono-hud text-[10px] font-semibold text-slate-400">
                <span>0%</span>
                <span>25%</span>
                <span>50%</span>
                <span className="text-sky-300">80% Meta</span>
                <span className="text-emerald-400">100%</span>
              </div>
              <div className="relative mt-1 h-1.5 w-full overflow-hidden rounded-full bg-[#15233d]">
                <div className="absolute inset-y-0 left-0 w-[50%] bg-red-500/35" />
                <div className="absolute inset-y-0 left-[50%] w-[30%] bg-amber-400/35" />
                <div className="absolute inset-y-0 left-[80%] w-[20%] bg-emerald-400/45" />
              </div>
            </div>

            {donutData.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectZoneAndScroll(item.id)}
                className="block w-full cursor-pointer rounded-lg px-2 py-1 text-left transition hover:bg-[#13203a]"
              >
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="flex min-w-0 items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{
                        backgroundColor: item.color,
                        boxShadow: `0 0 6px ${item.color}`,
                      }}
                    />
                    <span className="truncate text-xs font-medium text-slate-200">
                      {item.name}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2 font-mono-hud">
                    <span className="text-xs font-bold text-slate-100">
                      {item.value}%
                    </span>
                    <span
                      className="w-16 text-right text-[11px] font-semibold"
                      style={{ color: STATUS_HEX[item.status] }}
                    >
                      {STATUS_LABELS[item.status]}
                    </span>
                  </span>
                </div>

                <div className="relative h-2 w-full overflow-hidden rounded-full bg-[#15233d]">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${item.value}%`,
                      backgroundColor: item.color,
                    }}
                  />
                  {/* Marcas de escala 25%, 50% y 80% */}
                  <span
                    className="pointer-events-none absolute top-0 bottom-0 w-px bg-slate-400/20"
                    style={{ left: "25%" }}
                  />
                  <span
                    className="pointer-events-none absolute top-0 bottom-0 w-px bg-slate-400/25"
                    style={{ left: "50%" }}
                  />
                  <span
                    className="pointer-events-none absolute top-0 bottom-0 w-[1.5px] bg-sky-200/60"
                    style={{ left: "80%" }}
                  />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* CARD 2 (Top-Right): Ambiente de la Nave y Cuidados */}
      <div className="rounded-2xl border border-[#1b2d4b] bg-[#0c1426] p-5">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-100">
              Ambiente de la Nave y Cuidados
            </h2>
            <p className="text-[11px] text-slate-400">
              Qué tan seguro está el aire, la protección y tu rutina hoy.
            </p>
          </div>
          <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-2.5 py-1 font-mono-hud text-xs font-semibold text-sky-300">
            {env.shortName}
          </span>
        </div>

        <div className="grid grid-cols-1 items-center gap-4 sm:grid-cols-12">
          <div className="flex flex-col items-center justify-center sm:col-span-4">
            <div className="flex h-32 w-32 items-center justify-center rounded-full border border-sky-500/25 bg-[#091224] text-sky-400 shadow-[inset_0_0_24px_rgba(56,189,248,0.12)]">
              <Globe className="h-20 w-20 stroke-[1.35]" />
            </div>
            <span className="mt-2 text-center font-mono-hud text-[11px] font-medium text-slate-400">
              {env.commLatencyLabel}
            </span>
          </div>

          <div className="space-y-3 sm:col-span-8">
            {hazardBars.map((bar) => (
              <div key={bar.label} className="flex items-center gap-3 text-xs">
                <span className="w-36 truncate font-medium text-slate-200">
                  {bar.label}
                </span>
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-[#15233d]">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.max(8, bar.pct)}%`,
                      backgroundColor: bar.color,
                    }}
                  />
                </div>
                <span className="w-20 text-right font-mono-hud text-[11px] font-semibold text-slate-300">
                  {bar.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CARD 3 (Bottom-Left): Revisiones Rápidas */}
      <div className="rounded-2xl border border-[#1b2d4b] bg-[#0c1426] p-5">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-100">
              Revisiones Rápidas
            </h2>
            <p className="text-[11px] text-slate-400">
              Toca cualquier tarjeta para revisar una parte de tu cuerpo o anotar cómo te sientes.
            </p>
          </div>
          <span className="font-mono-hud text-xs font-medium text-slate-400">
            Fácil de usar
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
                MAPA DEL CUERPO
              </span>
              <ScanLine className="h-5 w-5 text-sky-400 transition group-hover:scale-110" />
            </div>
            <div className="mt-3">
              <div className="text-sm font-bold text-slate-100">
                Ver las 6 Zonas
              </div>
              <div className="mt-0.5 text-[11px] text-slate-400">
                Qué hacer paso a paso si algo molesta
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
                CÁMARA DE ROSTRO
              </span>
              <Camera className="h-5 w-5 text-teal-400 transition group-hover:scale-110" />
            </div>
            <div className="mt-3">
              <div className="text-sm font-bold text-slate-100">
                Postura {b.postureScore}% · Rostro
              </div>
              <div className="mt-0.5 text-[11px] text-slate-400">
                Mide cansancio en tus ojos y gestos
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
                TRAJE DE SENSORES
              </span>
              <Watch className="h-5 w-5 text-emerald-400 transition group-hover:scale-110" />
            </div>
            <div className="mt-3">
              <div className="text-sm font-bold text-slate-100">
                Arnés 3N (13 Signos)
              </div>
              <div className="mt-0.5 text-[11px] text-slate-400">
                Chaleco en pecho, banda en frente y pulsera
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
                ANOTAR DATOS
              </span>
              <Sliders className="h-5 w-5 text-amber-400 transition group-hover:scale-110" />
            </div>
            <div className="mt-3">
              <div className="text-sm font-bold text-slate-100">
                Ajuste Manual
              </div>
              <div className="mt-0.5 text-[11px] text-slate-400">
                Cambia tus horas de sueño, agua o comida
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* CARD 4 (Bottom-Right): Tu Evolución Reciente */}
      <div className="rounded-2xl border border-[#1b2d4b] bg-[#0c1426] p-5">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-100">
              Tu Evolución en los Últimos Días
            </h2>
            <p className="text-[11px] text-slate-400">
              Cómo se han mantenido tu corazón, tu agua y tu descanso.
            </p>
          </div>
          <span className="font-mono-hud text-xs font-semibold text-sky-400">
            Últimos {history.length} días
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
