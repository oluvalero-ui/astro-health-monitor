"use client";

import React, { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Circle,
  ClipboardCheck,
  Info,
  Plus,
  ShieldCheck,
} from "lucide-react";
import { HABIT_CATEGORY_META } from "@/components/habitCategoryMeta";
import { StatusPill } from "@/components/ui/StatusPill";
import {
  BiomarkerData,
  MissionEnvironmentId,
  MissionQuest,
} from "@/types/astronaut";
import { getActiveVitalRecommendations } from "@/utils/healthEngine";

interface RecommendedHabitsPanelProps {
  habits: MissionQuest[];
  biomarkers: BiomarkerData;
  environmentId: MissionEnvironmentId;
  onToggleHabit: (habitId: string) => void;
  onAddCustomHabit: (
    title: string,
    category: MissionQuest["category"]
  ) => void;
  onInspectHabit?: (habitId: string) => void;
}

export default function RecommendedHabitsPanel({
  habits,
  biomarkers,
  environmentId,
  onToggleHabit,
  onAddCustomHabit,
  onInspectHabit,
}: RecommendedHabitsPanelProps) {
  const [newHabitTitle, setNewHabitTitle] = useState("");
  const [newCategory, setNewCategory] =
    useState<MissionQuest["category"]>("mental");

  const activeVitalRecs = getActiveVitalRecommendations(biomarkers, environmentId);
  const triggeredRecs = activeVitalRecs.filter((r) => r.status !== "optimal");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newHabitTitle.trim();
    if (!trimmed) return;
    onAddCustomHabit(trimmed, newCategory);
    setNewHabitTitle("");
  };

  return (
    <section className="flex h-full flex-col justify-between rounded-2xl border border-[#1b2d4b] bg-[#0c1426] p-4 shadow-[0_14px_34px_rgba(2,6,23,0.45)] sm:p-5">
      <div className="space-y-3.5">
        {/* Header limpio: solo título */}
        <div className="border-b border-[#182742] pb-3">
          <h2 className="flex items-center gap-2 text-base font-bold text-slate-100">
            <ClipboardCheck className="h-5 w-5 text-sky-400" />
            Daily Countermeasures Protocol (NASA HRP)
          </h2>
        </div>

        {/* Adaptive Clinical Prescriptions (By Active Vital Sign & Severity) */}
        <div className="rounded-xl border border-[#182742] bg-[#091120] p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 font-mono-hud text-[11px] font-bold uppercase tracking-wider text-sky-300">
              {triggeredRecs.length > 0 ? (
                <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
              ) : (
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              )}
              Adaptive Clinical Prescriptions
            </span>
            <span className="font-mono-hud text-[10px] text-slate-400">
              {triggeredRecs.length > 0
                ? `${triggeredRecs.length} active alert${triggeredRecs.length > 1 ? "s" : ""}`
                : "ALL VITALS NOMINAL"}
            </span>
          </div>

          {triggeredRecs.length === 0 ? (
            <div className="mt-2 rounded-lg border border-emerald-500/30 bg-emerald-950/25 px-2.5 py-2 text-[11px] text-emerald-200">
              All 13 Bio-Monitor 3N channels nominal — follow preventive baseline countermeasures below.
            </div>
          ) : (
            <div className="mt-2 space-y-2">
              {triggeredRecs.slice(0, 4).map((rec) => (
                <div
                  key={rec.id}
                  className={`rounded-lg border p-2.5 text-[11px] ${
                    rec.status === "critical"
                      ? "border-red-500/45 bg-red-950/25"
                      : "border-amber-500/40 bg-amber-950/20"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-1.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-bold text-slate-100">
                        {rec.vitalName}
                      </span>
                      <span className="rounded border border-[#1b2d4b] bg-[#070c17] px-1.5 py-0.5 font-mono-hud text-[10px] text-sky-300">
                        {rec.currentReading}
                      </span>
                    </div>
                    <StatusPill status={rec.status} />
                  </div>
                  <div
                    className={`mt-1 font-mono-hud text-[10.5px] font-bold ${
                      rec.status === "critical"
                        ? "text-red-300"
                        : "text-amber-300"
                    }`}
                  >
                    {rec.problemLabel}
                  </div>
                  <p className="mt-0.5 leading-relaxed text-slate-300">
                    {rec.recommendation}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Lista limpia: solo la tarea recomendada */}
        <div className="space-y-2">
          {habits.map((habit) => (
            <div
              key={habit.id}
              className={`flex items-center gap-2 rounded-xl border p-2.5 transition ${
                habit.completed
                  ? "border-emerald-500/35 bg-emerald-950/30"
                  : "border-[#182742] bg-[#091120] hover:border-sky-500/45 hover:bg-[#0d192e]"
              }`}
            >
              <button
                type="button"
                onClick={() => onToggleHabit(habit.id)}
                className="flex min-w-0 flex-1 cursor-pointer items-center justify-between gap-2 text-left"
              >
                <span className="flex min-w-0 items-center gap-2.5">
                  {habit.completed ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                  ) : (
                    <Circle className="h-4 w-4 shrink-0 text-slate-400" />
                  )}
                  <span className="shrink-0">
                    {HABIT_CATEGORY_META[habit.category].icon}
                  </span>
                  <span
                    className={`text-xs font-semibold ${
                      habit.completed
                        ? "text-emerald-300 line-through"
                        : "text-slate-100"
                    }`}
                  >
                    {habit.title}
                  </span>
                </span>

                <span className="shrink-0 rounded-md border border-sky-500/30 bg-sky-500/10 px-2 py-0.5 font-mono-hud text-[10px] font-bold text-sky-300">
                  {habit.durationLabel}
                </span>
              </button>

              {onInspectHabit && (
                <button
                  type="button"
                  onClick={() => onInspectHabit(habit.id)}
                  title="Inspect clinical rationale in NASA-STD-3001 manual"
                  aria-label={`Inspect rationale for ${habit.title}`}
                  className="shrink-0 cursor-pointer rounded-lg p-1.5 text-slate-400 transition hover:bg-sky-500/15 hover:text-sky-300"
                >
                  <Info className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Minimalist form for adding a custom crew habit */}
      <form
        onSubmit={handleSubmit}
        className="mt-4 flex gap-2 border-t border-[#182742] pt-3"
      >
        <input
          type="text"
          value={newHabitTitle}
          onChange={(e) => setNewHabitTitle(e.target.value)}
          placeholder="Add custom countermeasure (e.g., lumbar stretch)..."
          className="min-w-0 flex-1 rounded-xl border border-[#1b2d4b] bg-[#091120] px-3 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 focus:border-sky-400 focus:bg-[#0c162b] focus:outline-none"
        />
        <select
          value={newCategory}
          onChange={(e) =>
            setNewCategory(e.target.value as MissionQuest["category"])
          }
          className="rounded-xl border border-[#1b2d4b] bg-[#091120] px-2 py-1.5 text-xs text-slate-200 focus:border-sky-400 focus:outline-none"
          aria-label="Countermeasure category"
        >
          <option value="mental">Behavioral</option>
          <option value="fisico">Physical</option>
          <option value="hidratacion">Hydration</option>
          <option value="circadiano">Circadian</option>
        </select>
        <button
          type="submit"
          className="inline-flex cursor-pointer items-center gap-1 rounded-xl bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-sky-500"
        >
          <Plus className="h-3.5 w-3.5" />
          Add
        </button>
      </form>
    </section>
  );
}
