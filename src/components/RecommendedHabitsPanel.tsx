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
    <section className="flex h-full flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-4 shadow-[0_6px_24px_rgba(15,23,42,0.04)] sm:p-5">
      <div>
        {/* Header limpio: solo título */}
        <div className="mb-3.5 border-b border-slate-100 pb-3">
          <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
            <ClipboardCheck className="h-5 w-5 text-[#1a73e8]" />
            Hábitos Recomendados
          </h2>
        </div>

        {/* Lista limpia: solo la tarea recomendada */}
        <div className="space-y-2">
          {habits.map((habit) => (
            <div
              key={habit.id}
              className={`flex items-center gap-2 rounded-xl border p-2.5 transition ${
                habit.completed
                  ? "border-emerald-300 bg-emerald-50/75"
                  : "border-slate-200 bg-slate-50/70 hover:border-blue-300 hover:bg-white"
              }`}
            >
              <button
                type="button"
                onClick={() => onToggleHabit(habit.id)}
                className="flex min-w-0 flex-1 cursor-pointer items-center justify-between gap-2 text-left"
              >
                <span className="flex min-w-0 items-center gap-2.5">
                  {habit.completed ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  ) : (
                    <Circle className="h-4 w-4 shrink-0 text-slate-400" />
                  )}
                  <span className="shrink-0">
                    {HABIT_CATEGORY_META[habit.category].icon}
                  </span>
                  <span
                    className={`text-xs font-semibold ${
                      habit.completed
                        ? "text-emerald-800 line-through"
                        : "text-slate-800"
                    }`}
                  >
                    {habit.title}
                  </span>
                </span>

                <span className="shrink-0 rounded-md bg-blue-50 px-2 py-0.5 font-mono-hud text-[10px] font-bold text-[#1a73e8]">
                  {habit.durationLabel}
                </span>
              </button>

              {onInspectHabit && (
                <button
                  type="button"
                  onClick={() => onInspectHabit(habit.id)}
                  title="Ver explicación clínica en el apartado inferior"
                  aria-label={`Ver explicación de ${habit.title}`}
                  className="shrink-0 cursor-pointer rounded-lg p-1.5 text-slate-400 transition hover:bg-blue-50 hover:text-[#1a73e8]"
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
        className="mt-4 flex gap-2 border-t border-slate-100 pt-3"
      >
        <input
          type="text"
          value={newHabitTitle}
          onChange={(e) => setNewHabitTitle(e.target.value)}
          placeholder="Añadir hábito personal (ej. estiramiento lumbar)..."
          className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-[#1a73e8] focus:bg-white focus:outline-none"
        />
        <select
          value={newCategory}
          onChange={(e) =>
            setNewCategory(e.target.value as MissionQuest["category"])
          }
          className="rounded-xl border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs text-slate-700 focus:border-[#1a73e8] focus:outline-none"
          aria-label="Categoría de hábito recomendado"
        >
          <option value="mental">Mental</option>
          <option value="fisico">Físico</option>
          <option value="hidratacion">Agua</option>
          <option value="circadiano">Luz</option>
        </select>
        <button
          type="submit"
          className="inline-flex cursor-pointer items-center gap-1 rounded-xl bg-[#1a73e8] px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
        >
          <Plus className="h-3.5 w-3.5" />
          Añadir
        </button>
      </form>
    </section>
  );
}
