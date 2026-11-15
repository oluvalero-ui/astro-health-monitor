"use client";

import React, { useSyncExternalStore } from "react";
import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  Pie,
  PieChart,
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
  SYSTEM_DIAGNOSTIC_GUIDES,
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

const ZONE_PALETTE: Record<SystemZoneId, string> = {
  cerebro: "#1a73e8",
  rostro: "#4f46e5",
  corazon: "#2dd4bf",
  endocrino: "#38bdf8",
  abdomen: "#10b981",
  musculo: "#6366f1",
};

const ZONE_LIST: SystemZoneId[] = [
  "cerebro",
  "rostro",
  "corazon",
  "endocrino",
  "abdomen",
  "musculo",
];

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
    name: SYSTEM_DIAGNOSTIC_GUIDES[id].name,
    value: getZoneScore(id, b),
    status: zoneStatuses[id],
    color:
      zoneStatuses[id] === "critical"
        ? STATUS_HEX.critical
        : zoneStatuses[id] === "warning"
        ? STATUS_HEX.warning
        : ZONE_PALETTE[id],
  }));

  const hazardBars = [
    {
      label: "Radiación CSA",
      pct: Math.min(100, Math.round((b.dailyRadiationMsv / CSA_RADIATION_LIMITS.dailyAlertMsv) * 100)),
      text: `${b.dailyRadiationMsv.toFixed(2)} mSv/d`,
    },
    {
      label: "Carga Ósea / Gravedad",
      pct: Math.round(b.boneDensityIndex),
      text: `${env.gravityG.toFixed(2)}g`,
    },
    {
      label: "Aislamiento / Estrés",
      pct: Math.round((b.lonelinessLevel + b.stressLevel) / 2),
      text: `${Math.round((b.lonelinessLevel + b.stressLevel) / 2)}%`,
    },
    {
      label: "CO₂ en Cabina",
      pct: Math.min(100, Math.round((env.co2MmHg / 5) * 100)),
      text: `${env.co2MmHg} mmHg`,
    },
    {
      label: "Estabilidad Rutina",
      pct: routineAnalysis.stabilityScore,
      text: `${routineAnalysis.stabilityScore}%`,
    },
  ];

  const reportSummaryRows = [
    { label: "Pulso cardíaco", val: `${b.bpm} BPM`, pct: Math.min(100, Math.round((b.bpm / 140) * 100)) },
    { label: "Glucosa sangre", val: `${b.bloodGlucoseMgDl} mg/dL`, pct: Math.min(100, Math.round((b.bloodGlucoseMgDl / 160) * 100)) },
    { label: "Hidratación", val: `${b.hydrationPercent}%`, pct: b.hydrationPercent },
    { label: "Sueño diario", val: `${b.sleepHours.toFixed(1)} h`, pct: Math.min(100, Math.round((b.sleepHours / 9) * 100)) },
    { label: "Ánimo general", val: `${b.moodScore}/100`, pct: b.moodScore },
    { label: "Postura cámara", val: `${b.postureScore}/100`, pct: b.postureScore },
  ];

  return (
    <section
      id="resumen-bento"
      aria-label="Panel Ejecutivo de Misión"
      className="grid grid-cols-1 gap-5 lg:grid-cols-2"
    >
      {/* CARD 1 (Top-Left): Donut Chart like "Aplicaciones" -> Estado de Sistemas */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-[0_6px_24px_rgba(15,23,42,0.04)]">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">
            Sistemas Corporales (6 Zonas)
          </h2>
          <span className="rounded-full bg-blue-50 px-2.5 py-1 font-mono-hud text-xs font-semibold text-blue-700">
            Aptitud: {readinessScore}%
          </span>
        </div>

        <div className="grid grid-cols-1 items-center gap-4 sm:grid-cols-12">
          <div className="relative flex h-[180px] items-center justify-center sm:col-span-5">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={76}
                    paddingAngle={2}
                    stroke="none"
                  >
                    {donutData.map((entry) => (
                      <Cell key={entry.id} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val, name) => [`${val}% salud`, String(name)]}
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      borderColor: "#e2e8f0",
                      borderRadius: "0.75rem",
                      fontSize: "12px",
                      color: "#0f172a",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-36 w-36 rounded-full border-[14px] border-blue-100" />
            )}
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-mono-hud text-xl font-bold text-slate-900">
                {readinessScore}%
              </span>
              <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                Global
              </span>
            </div>
          </div>

          <div className="space-y-2 sm:col-span-7">
            {donutData.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectZoneAndScroll(item.id)}
                className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1 text-left transition hover:bg-slate-50"
              >
                <span
                  className="h-3 w-3 shrink-0 rounded-sm"
                  style={{ backgroundColor: item.color }}
                />
                <span className="w-32 truncate text-xs font-medium text-slate-700">
                  {item.name}
                </span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${item.value}%`,
                      backgroundColor: item.color,
                    }}
                  />
                </div>
                <span className="w-16 text-right font-mono-hud text-[11px] font-semibold text-slate-500">
                  {STATUS_LABELS[item.status]}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* CARD 2 (Top-Right): Blue Globe + Horizontal Bars like "Sitios web" -> Entorno y Peligros */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-[0_6px_24px_rgba(15,23,42,0.04)]">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">
            Entorno Espacial y Riesgos HRP
          </h2>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
            {env.shortName}
          </span>
        </div>

        <div className="grid grid-cols-1 items-center gap-4 sm:grid-cols-12">
          <div className="flex flex-col items-center justify-center sm:col-span-4">
            <div className="flex h-32 w-32 items-center justify-center rounded-full bg-blue-50/80 text-[#1a73e8]">
              <Globe className="h-24 w-24 stroke-[1.5]" />
            </div>
            <span className="mt-2 text-center font-mono-hud text-[11px] font-medium text-slate-500">
              {env.commLatencyLabel}
            </span>
          </div>

          <div className="space-y-3 sm:col-span-8">
            {hazardBars.map((bar) => (
              <div key={bar.label} className="flex items-center gap-3 text-xs">
                <span className="w-36 truncate font-medium text-slate-700">
                  {bar.label}
                </span>
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-[#1a73e8] transition-all duration-500"
                    style={{ width: `${Math.max(8, bar.pct)}%` }}
                  />
                </div>
                <span className="w-20 text-right font-mono-hud text-[11px] font-semibold text-slate-600">
                  {bar.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CARD 3 (Bottom-Left): 2x2 Visual Previews like "Capturas de pantalla" */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-[0_6px_24px_rgba(15,23,42,0.04)]">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">
            Capturas Biométricas y Escaneos
          </h2>
          <span className="text-xs font-medium text-slate-400">
            Acceso rápido multimodal
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Thumbnail 1: Anatomical SVG Scanner */}
          <button
            type="button"
            onClick={() => onSelectZoneAndScroll("cerebro")}
            className="group cursor-pointer overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-left transition hover:border-blue-400 hover:bg-blue-50/40"
          >
            <div className="flex h-20 items-center justify-between rounded-lg bg-gradient-to-br from-[#0b2559] to-[#1a4b9c] px-3 text-white">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-blue-200">
                  Escáner SVG
                </div>
                <div className="mt-0.5 text-xs font-bold">6 Sistemas</div>
              </div>
              <ScanLine className="h-8 w-8 text-cyan-300 transition group-hover:scale-110" />
            </div>
            <div className="mt-1.5 text-[11px] font-medium text-slate-600">
              Autoevaluación guiada
            </div>
          </button>

          {/* Thumbnail 2: Camera Body Language */}
          <button
            type="button"
            onClick={() => onOpenScanTab("camara")}
            className="group cursor-pointer overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-left transition hover:border-blue-400 hover:bg-blue-50/40"
          >
            <div className="flex h-20 items-center justify-between rounded-lg bg-gradient-to-br from-slate-800 to-blue-900 px-3 text-white">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-blue-200">
                  Cámara IA
                </div>
                <div className="mt-0.5 text-xs font-bold">
                  Postura {b.postureScore}%
                </div>
              </div>
              <Camera className="h-8 w-8 text-blue-300 transition group-hover:scale-110" />
            </div>
            <div className="mt-1.5 text-[11px] font-medium text-slate-600">
              Expresiones y fatiga
            </div>
          </button>

          {/* Thumbnail 3: Wearable Body Area Network (Prototype 2) */}
          <button
            type="button"
            onClick={onNavigateWearable}
            className="group cursor-pointer overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-left transition hover:border-blue-400 hover:bg-blue-50/40"
          >
            <div className="flex h-20 items-center justify-between rounded-lg bg-gradient-to-br from-[#0f172a] to-[#0e7490] px-3 text-white">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-cyan-200">
                  Arnés Vestible
                </div>
                <div className="mt-0.5 text-xs font-bold">
                  13 Signos · 3 Nodos
                </div>
              </div>
              <Watch className="h-8 w-8 text-teal-300 transition group-hover:scale-110" />
            </div>
            <div className="mt-1.5 text-[11px] font-medium text-slate-600">
              Pecho, Cabeza y Dedo
            </div>
          </button>

          {/* Thumbnail 4: Manual Entry & Self-Report */}
          <button
            type="button"
            onClick={() => onOpenScanTab("manual")}
            className="group cursor-pointer overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-left transition hover:border-blue-400 hover:bg-blue-50/40"
          >
            <div className="flex h-20 items-center justify-between rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 px-3 text-white">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-blue-100">
                  Autoevaluación
                </div>
                <div className="mt-0.5 text-xs font-bold">
                  Registro Manual
                </div>
              </div>
              <Sliders className="h-8 w-8 text-white/90 transition group-hover:scale-110" />
            </div>
            <div className="mt-1.5 text-[11px] font-medium text-slate-600">
              Signos vitales y rutina
            </div>
          </button>
        </div>
      </div>

      {/* CARD 4 (Bottom-Right): Line + Background Bars + Summary Rows like "Informes" */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-[0_6px_24px_rgba(15,23,42,0.04)]">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">
            Informes y Tendencia Vital
          </h2>
          <span className="font-mono-hud text-xs font-semibold text-blue-600">
            Últimos {history.length} registros
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
                    stroke="#f1f5f9"
                  />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: "#94a3b8", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "#94a3b8", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      borderColor: "#e2e8f0",
                      borderRadius: "0.75rem",
                      fontSize: "12px",
                      color: "#0f172a",
                    }}
                  />
                  <Bar
                    dataKey="hydration"
                    name="Hidratación (%)"
                    fill="#e2e8f0"
                    radius={[4, 4, 0, 0]}
                    barSize={14}
                  />
                  <Line
                    type="monotone"
                    dataKey="bpm"
                    name="Pulso (BPM)"
                    stroke="#1a73e8"
                    strokeWidth={2.5}
                    dot={{ r: 3.5, fill: "#1a73e8", strokeWidth: 0 }}
                    activeDot={{ r: 5 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full rounded-xl bg-slate-50" />
            )}
          </div>

          <div className="space-y-2.5 sm:col-span-5">
            {reportSummaryRows.map((row) => (
              <div key={row.label} className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-medium text-slate-600">{row.label}</span>
                  <span className="font-mono-hud font-semibold text-slate-900">
                    {row.val}
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-[#1a73e8]/80"
                    style={{ width: `${Math.max(8, row.pct)}%` }}
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
