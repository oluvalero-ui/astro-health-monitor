"use client";

import React, { useState, useSyncExternalStore } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Activity, Brain, HeartPulse, LineChart as LineIcon } from "lucide-react";
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

  return (
    <section className="flex h-full flex-col rounded-2xl border border-slate-800 bg-slate-900/90 p-4 shadow-xl sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <h2 className="flex items-center gap-2 text-base font-bold text-white">
            <LineIcon className="h-5 w-5 text-cyan-400" />
            Módulo 4A · Evolución Temporal (Recharts)
          </h2>
          <p className="mt-0.5 text-xs text-slate-400">
            Tendencias históricas y actualizaciones en tiempo real tras cada escaneo o simulación.
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab("vitales")}
            className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition ${
              activeTab === "vitales"
                ? "border-cyan-400/70 bg-cyan-500/20 text-cyan-200"
                : "border-slate-800 bg-slate-950/70 text-slate-400 hover:text-slate-200"
            }`}
          >
            <HeartPulse className="h-3.5 w-3.5" />
            Signos Vitales
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("carga")}
            className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition ${
              activeTab === "carga"
                ? "border-amber-400/70 bg-amber-500/20 text-amber-200"
                : "border-slate-800 bg-slate-950/70 text-slate-400 hover:text-slate-200"
            }`}
          >
            <Activity className="h-3.5 w-3.5" />
            Físico vs. Mental y Hormonas
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("emocional")}
            className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition ${
              activeTab === "emocional"
                ? "border-violet-400/70 bg-violet-500/20 text-violet-200"
                : "border-slate-800 bg-slate-950/70 text-slate-400 hover:text-slate-200"
            }`}
          >
            <Brain className="h-3.5 w-3.5" />
            Bienestar Emocional
          </button>
        </div>
      </div>

      <div className="h-[310px] w-full flex-1">
        {!mounted ? (
          <div className="flex h-full w-full items-center justify-center rounded-xl border border-slate-800 bg-slate-950/60 text-xs text-slate-500">
            Cargando gráficas telemétricas...
          </div>
        ) : activeTab === "vitales" ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={history}
              margin={{ top: 10, right: 16, left: -12, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis
                dataKey="label"
                stroke="#64748b"
                tick={{ fill: "#94a3b8", fontSize: 11 }}
              />
              <YAxis
                stroke="#64748b"
                tick={{ fill: "#94a3b8", fontSize: 11 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#020617",
                  borderColor: "#334155",
                  borderRadius: "0.75rem",
                  fontSize: "12px",
                  color: "#f1f5f9",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "12px" }} />
              <Line
                type="monotone"
                dataKey="bpm"
                name="Pulso (BPM)"
                stroke="#f43f5e"
                strokeWidth={2.4}
                dot={{ r: 3.5 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="glucose"
                name="Glucosa (mg/dL)"
                stroke="#f59e0b"
                strokeWidth={2.4}
                dot={{ r: 3.5 }}
              />
              <Line
                type="monotone"
                dataKey="hydration"
                name="Hidratación (%)"
                stroke="#22d3ee"
                strokeWidth={2.4}
                dot={{ r: 3.5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : activeTab === "carga" ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={history}
              margin={{ top: 10, right: 16, left: -12, bottom: 5 }}
            >
              <defs>
                <linearGradient id="gradCortisol" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="gradMelatonin" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.32} />
                  <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis
                dataKey="label"
                stroke="#64748b"
                tick={{ fill: "#94a3b8", fontSize: 11 }}
              />
              <YAxis
                domain={[0, 100]}
                stroke="#64748b"
                tick={{ fill: "#94a3b8", fontSize: 11 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#020617",
                  borderColor: "#334155",
                  borderRadius: "0.75rem",
                  fontSize: "12px",
                  color: "#f1f5f9",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "12px" }} />
              <Area
                type="monotone"
                dataKey="cortisol"
                name="Cortisol / Estrés"
                stroke="#ef4444"
                fill="url(#gradCortisol)"
                strokeWidth={2.2}
              />
              <Area
                type="monotone"
                dataKey="melatonin"
                name="Melatonina (Sueño)"
                stroke="#38bdf8"
                fill="url(#gradMelatonin)"
                strokeWidth={2.2}
              />
              <Line
                type="monotone"
                dataKey="physicalFatigue"
                name="Cansancio Físico"
                stroke="#f59e0b"
                strokeWidth={2.2}
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="mentalFatigue"
                name="Cansancio Mental"
                stroke="#a855f7"
                strokeWidth={2.2}
                dot={{ r: 3 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={history}
              margin={{ top: 10, right: 16, left: -12, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis
                dataKey="label"
                stroke="#64748b"
                tick={{ fill: "#94a3b8", fontSize: 11 }}
              />
              <YAxis
                domain={[0, 100]}
                stroke="#64748b"
                tick={{ fill: "#94a3b8", fontSize: 11 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#020617",
                  borderColor: "#334155",
                  borderRadius: "0.75rem",
                  fontSize: "12px",
                  color: "#f1f5f9",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "12px" }} />
              <Line
                type="monotone"
                dataKey="stress"
                name="Estrés"
                stroke="#f43f5e"
                strokeWidth={2.3}
                dot={{ r: 3.5 }}
              />
              <Line
                type="monotone"
                dataKey="loneliness"
                name="Soledad"
                stroke="#8b5cf6"
                strokeWidth={2.3}
                dot={{ r: 3.5 }}
              />
              <Line
                type="monotone"
                dataKey="boredom"
                name="Aburrimiento"
                stroke="#f59e0b"
                strokeWidth={2.3}
                dot={{ r: 3.5 }}
              />
              <Line
                type="monotone"
                dataKey="routineStability"
                name="Estabilidad Rutina (%)"
                stroke="#10b981"
                strokeWidth={2.5}
                dot={{ r: 3.5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}
