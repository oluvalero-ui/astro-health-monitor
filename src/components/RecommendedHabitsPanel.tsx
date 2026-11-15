"use client";

import React, { useState } from "react";
import { CheckCircle2, Circle, ClipboardCheck, Info, Plus } from "lucide-react";
import { HABIT_CATEGORY_META } from "@/components/habitCategoryMeta";
import { MissionQuest } from "@/types/astronaut";

interface RecommendedHabitsPanelProps {
  habits: MissionQuest[];
  onToggleHabit: (habitId: string) => void;
  onAddCustomHabit: (
    title: string,
    category: MissionQuest["category"]
  ) => void;
  onInspectHabit?: (habitId: string) => void;
}

export default function RecommendedHabitsPanel({
  habits,
  onToggleHabit,
  onAddCustomHabit,
  onInspectHabit,
}: RecommendedHabitsPanelProps) {
  const [newHabitTitle, setNewHabitTitle] = useState("");
  const [newCategory, setNewCategory] =
    useState<MissionQuest["category"]>("mental");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newHabitTitle.trim();
    if (!trimmed) return;
    onAddCustomHabit(trimmed, newCategory);
    setNewHabitTitle("");
  };

  return (
    <section className="flex h-full flex-col justify-between rounded-2xl border border-[#1b2d4b] bg-[#0c1426] p-4 shadow-[0_14px_34px_rgba(2,6,23,0.45)] sm:p-5">
      <div>
        {/* Header limpio: solo título */}
        <div className="mb-3.5 border-b border-[#182742] pb-3">
          <h2 className="flex items-center gap-2 text-base font-bold text-slate-100">
            <ClipboardCheck className="h-5 w-5 text-sky-400" />
            Protocolo de Contramedidas Diarias (NASA HRP)
          </h2>
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
                  title="Ver explicación clínica en el apartado inferior"
                  aria-label={`Ver explicación de ${habit.title}`}
                  className="shrink-0 cursor-pointer rounded-lg p-1.5 text-slate-400 transition hover:bg-sky-500/15 hover:text-sky-300"
                >
                  <Info className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Formulario minimalista para agregar tarea personal */}
      <form
        onSubmit={handleSubmit}
        className="mt-4 flex gap-2 border-t border-[#182742] pt-3"
      >
        <input
          type="text"
          value={newHabitTitle}
          onChange={(e) => setNewHabitTitle(e.target.value)}
          placeholder="Añadir hábito personal (ej. estiramiento lumbar)..."
          className="min-w-0 flex-1 rounded-xl border border-[#1b2d4b] bg-[#091120] px-3 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 focus:border-sky-400 focus:bg-[#0c162b] focus:outline-none"
        />
        <select
          value={newCategory}
          onChange={(e) =>
            setNewCategory(e.target.value as MissionQuest["category"])
          }
          className="rounded-xl border border-[#1b2d4b] bg-[#091120] px-2 py-1.5 text-xs text-slate-200 focus:border-sky-400 focus:outline-none"
          aria-label="Categoría de hábito recomendado"
        >
          <option value="mental">Mental</option>
          <option value="fisico">Físico</option>
          <option value="hidratacion">Agua</option>
          <option value="circadiano">Luz</option>
        </select>
        <button
          type="submit"
          className="inline-flex cursor-pointer items-center gap-1 rounded-xl bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-sky-500"
        >
          <Plus className="h-3.5 w-3.5" />
          Añadir
        </button>
      </form>
    </section>
  );
}
