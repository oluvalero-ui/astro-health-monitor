"use client";

import React, { useState, useSyncExternalStore } from "react";
import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Activity,
  Brain,
  HeartPulse,
  LineChart as LineIcon,
  ShieldCheck,
} from "lucide-react";
import { TelemetryPoint } from "@/types/astronaut";

interface TelemetryChartsProps {
  history: TelemetryPoint[];
}

type ChartTabId = "vitales" | "carga" | "emocional";

const emptySubscribe = () => () => {};

export default function TelemetryCharts({ history }: TelemetryChartsProps) {
  const [activeTab, setActiveTab] = useState<ChartTabId>("vitales");
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const latest = history[history.length - 1] ?? {
    label: "Hoy",
    bpm: 70,
    glucose: 94,
    hydration: 86,
    physicalFatigue: 28,
    mentalFatigue: 26,
    cortisol: 30,
    melatonin: 78,
    stress: 26,
    loneliness: 20,
    boredom: 22,
    routineStability: 92,
  };

  const avgBpm = Math.round(
    history.reduce((acc, p) => acc + p.bpm, 0) / Math.max(1, history.length)
  );
  const avgHydration = Math.round(
    history.reduce((acc, p) => acc + p.hydration, 0) /
      Math.max(1, history.length)
  );
  const avgRoutine = Math.round(
    history.reduce((acc, p) => acc + p.routineStability, 0) /
      Math.max(1, history.length)
  );

  const kpiCards =
    activeTab === "vitales"
      ? [
          {
            label: "Corazón Hoy (Promedio)",
            value: `${latest.bpm} lat/min`,
            sub: `Prom. ${avgBpm} lat/min · Meta 52–92`,
            color: latest.bpm <= 92 ? "#22c55e" : "#f59e0b",
          },
          {
            label: "Agua en el Cuerpo",
            value: `${latest.hydration}%`,
            sub: `Prom. ${avgHydration}% · Meta ≥ 80%`,
            color: latest.hydration >= 80 ? "#38bdf8" : "#f59e0b",
          },
          {
            label: "Energía (Azúcar)",
            value: `${latest.glucose} mg/dL`,
            sub: "Rango seguro: 74–120 mg/dL",
            color:
              latest.glucose >= 74 && latest.glucose <= 120
                ? "#2dd4bf"
                : "#f59e0b",
          },
        ]
      : activeTab === "carga"
      ? [
          {
            label: "Calidad de Sueño",
            value: `${latest.melatonin}%`,
            sub: "Meta saludable: ≥ 70%",
            color: latest.melatonin >= 70 ? "#38bdf8" : "#f59e0b",
          },
          {
            label: "Cansancio del Cuerpo",
            value: `${latest.physicalFatigue}%`,
            sub: "Ideal mantener bajo 50%",
            color: latest.physicalFatigue <= 50 ? "#22c55e" : "#f59e0b",
          },
          {
            label: "Tensión Hormonal",
            value: `${latest.cortisol}%`,
            sub: "Ideal mantener bajo 50%",
            color: latest.cortisol <= 50 ? "#2dd4bf" : "#ef4444",
          },
        ]
      : [
          {
            label: "Orden en tu Rutina",
            value: `${latest.routineStability}%`,
            sub: `Prom. ${avgRoutine}% · Meta ≥ 80%`,
            color: latest.routineStability >= 80 ? "#22c55e" : "#f59e0b",
          },
          {
            label: "Cansancio de la Mente",
            value: `${latest.mentalFatigue}%`,
            sub: "Ideal mantener bajo 45%",
            color: latest.mentalFatigue <= 45 ? "#38bdf8" : "#f59e0b",
          },
          {
            label: "Nivel de Tensión (Estrés)",
            value: `${latest.stress}%`,
            sub: "Ideal mantener bajo 45%",
            color: latest.stress <= 45 ? "#2dd4bf" : "#ef4444",
          },
        ];

  return (
    <section
      id="informes-section"
      className="flex h-full flex-col rounded-2xl border border-[#1b2d4b] bg-[#0c1426] p-4 shadow-[0_14px_34px_rgba(2,6,23,0.45)] sm:p-5"
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3 border-b border-[#182742] pb-3">
        <div>
          <div className="flex items-center gap-2">
            <LineIcon className="h-5 w-5 text-sky-400" />
            <h2 className="text-base font-bold text-slate-100">
              Evolución y Bandas de Control Clínico
            </h2>
            <span className="hidden items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-mono-hud text-[10px] font-semibold text-emerald-300 sm:inline-flex">
              <ShieldCheck className="h-3 w-3" />
              Banda Segura NASA
            </span>
          </div>
          <p className="mt-0.5 text-xs text-slate-400">
            Gráfico combinado de área, barras y banda segura para ver de un vistazo si tus niveles siguen dentro de la meta.
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab("vitales")}
            className={`inline-flex cursor-pointer items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
              activeTab === "vitales"
                ? "border-sky-400/60 bg-sky-500/20 text-sky-200 shadow-xs"
                : "border-[#1b2d4b] bg-[#091120] text-slate-400 hover:bg-[#111e36] hover:text-slate-100"
            }`}
          >
            <HeartPulse className="h-3.5 w-3.5 text-emerald-400" />
            Corazón, Agua y Energía
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("carga")}
            className={`inline-flex cursor-pointer items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
              activeTab === "carga"
                ? "border-sky-400/60 bg-sky-500/20 text-sky-200 shadow-xs"
                : "border-[#1b2d4b] bg-[#091120] text-slate-400 hover:bg-[#111e36] hover:text-slate-100"
            }`}
          >
            <Activity className="h-3.5 w-3.5 text-sky-400" />
            Descanso vs. Cansancio
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("emocional")}
            className={`inline-flex cursor-pointer items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
              activeTab === "emocional"
                ? "border-sky-400/60 bg-sky-500/20 text-sky-200 shadow-xs"
                : "border-[#1b2d4b] bg-[#091120] text-slate-400 hover:bg-[#111e36] hover:text-slate-100"
            }`}
          >
            <Brain className="h-3.5 w-3.5 text-teal-400" />
            Rutina y Calma Mental
          </button>
        </div>
      </div>

      {/* Franja de 3 indicadores clave (KPIs) de la gráfica activa */}
      <div className="mb-3 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
        {kpiCards.map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-xl border border-[#1b2d4b] bg-[#091120] px-3 py-2"
          >
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>{kpi.label}</span>
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: kpi.color }}
              />
            </div>
            <div
              className="mt-0.5 font-mono-hud text-base font-bold"
              style={{ color: kpi.color }}
            >
              {kpi.value}
            </div>
            <div className="text-[10px] text-slate-400">{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* Visor de Gráfica Combinada de Alta Precisión */}
      <div className="h-[300px] min-h-[300px] w-full rounded-xl border border-[#182742] bg-[#081020] p-2.5">
        {!mounted ? (
          <div className="flex h-full w-full items-center justify-center rounded-xl text-xs text-slate-400">
            Cargando gráficas telemétricas...
          </div>
        ) : activeTab === "vitales" ? (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={history}
              margin={{ top: 12, right: 12, left: -14, bottom: 4 }}
            >
              <defs>
                <linearGradient id="gradBpmTelemetry" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.32} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="gradHydrationBar" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.42} />
                  <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0.12} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#182742"
                vertical={false}
              />
              <XAxis
                dataKey="label"
                stroke="#475569"
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                yAxisId="left"
                domain={[0, 100]}
                stroke="#38bdf8"
                tick={{ fill: "#7dd3fc", fontSize: 10 }}
                tickFormatter={(v) => `${v}%`}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                domain={[40, 150]}
                stroke="#22c55e"
                tick={{ fill: "#86efac", fontSize: 10 }}
                width={38}
                axisLine={false}
                tickLine={false}
              />
              {/* Banda Segura de Hidratación (80% - 100%) */}
              <ReferenceArea
                yAxisId="left"
                y1={80}
                y2={100}
                fill="#10b981"
                fillOpacity={0.07}
              />
              <ReferenceLine
                yAxisId="left"
                y={80}
                stroke="#38bdf8"
                strokeDasharray="4 4"
                strokeOpacity={0.65}
                label={{
                  value: "Meta Agua 80%",
                  position: "insideTopLeft",
                  fill: "#38bdf8",
                  fontSize: 10,
                }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#060c18",
                  borderColor: "#1e3458",
                  borderRadius: "0.75rem",
                  fontSize: "12px",
                  color: "#f1f5f9",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "4px" }} />
              <Bar
                yAxisId="left"
                dataKey="hydration"
                name="Agua en el Cuerpo (%)"
                fill="url(#gradHydrationBar)"
                stroke="#38bdf8"
                strokeWidth={1}
                radius={[6, 6, 0, 0]}
                barSize={24}
              />
              <Area
                yAxisId="right"
                type="monotone"
                dataKey="bpm"
                name="Corazón (lat/min)"
                stroke="#22c55e"
                fill="url(#gradBpmTelemetry)"
                strokeWidth={2.6}
                dot={{ r: 3.5, fill: "#22c55e", stroke: "#081020", strokeWidth: 1.5 }}
                activeDot={{ r: 6 }}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="glucose"
                name="Energía / Glucosa (mg/dL)"
                stroke="#fbbf24"
                strokeWidth={2.3}
                dot={{ r: 3.5, fill: "#fbbf24", stroke: "#081020", strokeWidth: 1.5 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        ) : activeTab === "carga" ? (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={history}
              margin={{ top: 12, right: 14, left: -12, bottom: 4 }}
            >
              <defs>
                <linearGradient id="gradSleepRest" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.32} />
                  <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="gradCortisolDark" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.28} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#182742"
                vertical={false}
              />
              <XAxis
                dataKey="label"
                stroke="#475569"
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
                stroke="#64748b"
                tick={{ fill: "#94a3b8", fontSize: 10 }}
                tickFormatter={(v) => `${v}%`}
                axisLine={false}
                tickLine={false}
              />
              <ReferenceLine
                y={50}
                stroke="#f59e0b"
                strokeDasharray="4 4"
                strokeOpacity={0.65}
                label={{
                  value: "Límite Cansancio (50%)",
                  position: "insideTopRight",
                  fill: "#fbbf24",
                  fontSize: 10,
                }}
              />
              <Tooltip
                formatter={(val, name) => [`${val}%`, String(name)]}
                contentStyle={{
                  backgroundColor: "#060c18",
                  borderColor: "#1e3458",
                  borderRadius: "0.75rem",
                  fontSize: "12px",
                  color: "#f1f5f9",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "4px" }} />
              <Area
                type="monotone"
                dataKey="melatonin"
                name="Calidad de Sueño (%)"
                stroke="#38bdf8"
                fill="url(#gradSleepRest)"
                strokeWidth={2.5}
                dot={{ r: 3.5, fill: "#38bdf8" }}
              />
              <Area
                type="monotone"
                dataKey="physicalFatigue"
                name="Cansancio del Cuerpo (%)"
                stroke="#f59e0b"
                fill="url(#gradCortisolDark)"
                strokeWidth={2.3}
                dot={{ r: 3.5, fill: "#f59e0b" }}
              />
              <Line
                type="monotone"
                dataKey="cortisol"
                name="Tensión Hormonal (%)"
                stroke="#ef4444"
                strokeWidth={2.3}
                dot={{ r: 3.5, fill: "#ef4444" }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={history}
              margin={{ top: 12, right: 14, left: -12, bottom: 4 }}
            >
              <defs>
                <linearGradient id="gradRoutineBar" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.42} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0.12} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#182742"
                vertical={false}
              />
              <XAxis
                dataKey="label"
                stroke="#475569"
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
                stroke="#64748b"
                tick={{ fill: "#94a3b8", fontSize: 10 }}
                tickFormatter={(v) => `${v}%`}
                axisLine={false}
                tickLine={false}
              />
              <ReferenceArea
                y1={80}
                y2={100}
                fill="#10b981"
                fillOpacity={0.07}
              />
              <ReferenceLine
                y={80}
                stroke="#22c55e"
                strokeDasharray="4 4"
                strokeOpacity={0.65}
                label={{
                  value: "Meta Rutina 80%",
                  position: "insideTopLeft",
                  fill: "#4ade80",
                  fontSize: 10,
                }}
              />
              <Tooltip
                formatter={(val, name) => [`${val}%`, String(name)]}
                contentStyle={{
                  backgroundColor: "#060c18",
                  borderColor: "#1e3458",
                  borderRadius: "0.75rem",
                  fontSize: "12px",
                  color: "#f1f5f9",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "4px" }} />
              <Bar
                dataKey="routineStability"
                name="Orden en tu Rutina (%)"
                fill="url(#gradRoutineBar)"
                stroke="#22c55e"
                strokeWidth={1}
                radius={[6, 6, 0, 0]}
                barSize={24}
              />
              <Line
                type="monotone"
                dataKey="mentalFatigue"
                name="Cansancio de la Mente (%)"
                stroke="#38bdf8"
                strokeWidth={2.5}
                dot={{ r: 3.5, fill: "#38bdf8" }}
              />
              <Line
                type="monotone"
                dataKey="stress"
                name="Nivel de Tensión / Estrés (%)"
                stroke="#f59e0b"
                strokeWidth={2.5}
                dot={{ r: 3.5, fill: "#f59e0b" }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}
