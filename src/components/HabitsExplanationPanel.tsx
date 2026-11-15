"use client";

import React from "react";
import { BookOpenCheck } from "lucide-react";
import { HABIT_CATEGORY_META } from "@/components/habitCategoryMeta";
import { MissionQuest } from "@/types/astronaut";

interface HabitsExplanationPanelProps {
  habits: MissionQuest[];
  highlightedHabitId?: string | null;
  onOpenReferences?: () => void;
}

export default function HabitsExplanationPanel({
  habits,
  highlightedHabitId,
}: HabitsExplanationPanelProps) {
  return (
    <section
      id="explicacion-habitos"
      className="rounded-2xl border border-[#1b2d4b] bg-[#0c1426] p-4 shadow-[0_14px_34px_rgba(2,6,23,0.45)] sm:p-5"
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-[#182742] pb-3">
        <h3 className="flex items-center gap-2 text-sm font-bold text-slate-100 sm:text-base">
          <BookOpenCheck className="h-5 w-5 text-sky-400" />
          Fundamento Clínico de las Contramedidas (NASA HRP)
        </h3>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {habits.map((habit) => {
          const isHighlighted = highlightedHabitId === habit.id;
          const category = HABIT_CATEGORY_META[habit.category];
          return (
            <article
              key={habit.id}
              className={`flex flex-col justify-between rounded-xl border p-3.5 transition ${
                isHighlighted
                  ? "border-sky-400/70 bg-sky-950/35 ring-1 ring-sky-400/40"
                  : "border-[#182742] bg-[#091120]"
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
                    {category.icon}
                    {category.label}
                  </span>
                  <span className="rounded-md border border-[#1b2d4b] bg-[#0c1426] px-2 py-0.5 font-mono-hud text-[10px] font-bold text-sky-300">
                    {habit.durationLabel}
                  </span>
                </div>

                <h4 className="mt-1.5 text-xs font-bold text-slate-100">
                  {habit.title}
                </h4>

                <div className="mt-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    En qué consiste
                  </span>
                  <p className="mt-0.5 text-xs leading-relaxed text-slate-300">
                    {habit.description}
                  </p>
                </div>

                <div className="mt-2.5 rounded-lg border border-emerald-500/25 bg-[#091826] p-2.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                    Motivo médico en el espacio
                  </span>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-slate-200">
                    {habit.impactDescription}
                  </p>
                </div>
              </div>

              {habit.nasaStandard && (
                <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-[#182742] pt-2.5 text-[10px]">
                  <span className="rounded-md border border-sky-500/30 bg-sky-500/10 px-1.5 py-0.5 font-semibold text-sky-300">
                    {habit.nasaStandard}
                  </span>
                  {habit.nasaSource && (
                    <span className="text-slate-400">{habit.nasaSource}</span>
                  )}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
