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
    <section
      id="informes-section"
      className="flex h-full flex-col rounded-2xl border border-slate-200/90 bg-white p-4 shadow-[0_6px_24px_rgba(15,23,42,0.04)] sm:p-5"
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
            <LineIcon className="h-5 w-5 text-[#1a73e8]" />
            Módulo 4A · Evolución Temporal (Recharts)
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Tendencias históricas y actualizaciones en tiempo real tras cada escaneo o simulación.
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab("vitales")}
            className={`inline-flex cursor-pointer items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
              activeTab === "vitales"
                ? "border-[#1a73e8] bg-[#1a73e8] text-white shadow-xs"
                : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-white hover:text-slate-900"
            }`}
          >
            <HeartPulse className="h-3.5 w-3.5" />
            Signos Vitales
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("carga")}
            className={`inline-flex cursor-pointer items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
              activeTab === "carga"
                ? "border-[#1a73e8] bg-[#1a73e8] text-white shadow-xs"
                : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-white hover:text-slate-900"
            }`}
          >
            <Activity className="h-3.5 w-3.5" />
            Físico vs. Mental y Hormonas
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("emocional")}
            className={`inline-flex cursor-pointer items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
              activeTab === "emocional"
                ? "border-[#1a73e8] bg-[#1a73e8] text-white shadow-xs"
                : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-white hover:text-slate-900"
            }`}
          >
            <Brain className="h-3.5 w-3.5" />
            Bienestar Emocional
          </button>
        </div>
      </div>

      <div className="h-[310px] w-full flex-1">
        {!mounted ? (
          <div className="flex h-full w-full items-center justify-center rounded-xl border border-slate-100 bg-slate-50 text-xs text-slate-400">
            Cargando gráficas telemétricas...
          </div>
        ) : activeTab === "vitales" ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={history}
              margin={{ top: 10, right: 16, left: -12, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis
                dataKey="label"
                stroke="#94a3b8"
                tick={{ fill: "#64748b", fontSize: 11 }}
              />
              <YAxis
                stroke="#94a3b8"
                tick={{ fill: "#64748b", fontSize: 11 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#ffffff",
                  borderColor: "#e2e8f0",
                  borderRadius: "0.75rem",
                  fontSize: "12px",
                  color: "#0f172a",
                  boxShadow: "0 10px 25px rgba(15,23,42,0.08)",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "12px" }} />
              <Line
                type="monotone"
                dataKey="bpm"
                name="Pulso (BPM)"
                stroke="#e11d48"
                strokeWidth={2.4}
                dot={{ r: 3.5 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="glucose"
                name="Glucosa (mg/dL)"
                stroke="#d97706"
                strokeWidth={2.4}
                dot={{ r: 3.5 }}
              />
              <Line
                type="monotone"
                dataKey="hydration"
                name="Hidratación (%)"
                stroke="#1a73e8"
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
                <linearGradient id="gradCortisolLight" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.22} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="gradMelatoninLight" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1a73e8" stopOpacity={0.22} />
                  <stop offset="95%" stopColor="#1a73e8" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis
                dataKey="label"
                stroke="#94a3b8"
                tick={{ fill: "#64748b", fontSize: 11 }}
              />
              <YAxis
                domain={[0, 100]}
                stroke="#94a3b8"
                tick={{ fill: "#64748b", fontSize: 11 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#ffffff",
                  borderColor: "#e2e8f0",
                  borderRadius: "0.75rem",
                  fontSize: "12px",
                  color: "#0f172a",
                  boxShadow: "0 10px 25px rgba(15,23,42,0.08)",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "12px" }} />
              <Area
                type="monotone"
                dataKey="cortisol"
                name="Cortisol / Estrés"
                stroke="#ef4444"
                fill="url(#gradCortisolLight)"
                strokeWidth={2.2}
              />
              <Area
                type="monotone"
                dataKey="melatonin"
                name="Melatonina (Sueño)"
                stroke="#1a73e8"
                fill="url(#gradMelatoninLight)"
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
                stroke="#6366f1"
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
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis
                dataKey="label"
                stroke="#94a3b8"
                tick={{ fill: "#64748b", fontSize: 11 }}
              />
              <YAxis
                domain={[0, 100]}
                stroke="#94a3b8"
                tick={{ fill: "#64748b", fontSize: 11 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#ffffff",
                  borderColor: "#e2e8f0",
                  borderRadius: "0.75rem",
                  fontSize: "12px",
                  color: "#0f172a",
                  boxShadow: "0 10px 25px rgba(15,23,42,0.08)",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "12px" }} />
              <Line
                type="monotone"
                dataKey="stress"
                name="Estrés"
                stroke="#e11d48"
                strokeWidth={2.3}
                dot={{ r: 3.5 }}
              />
              <Line
                type="monotone"
                dataKey="loneliness"
                name="Soledad"
                stroke="#6366f1"
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
