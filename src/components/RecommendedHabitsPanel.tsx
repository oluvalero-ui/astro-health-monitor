"use client";

import React, { useState } from "react";
import {
  BookOpenCheck,
  CheckCircle2,
  Circle,
  ClipboardCheck,
  Droplets,
  Dumbbell,
  Plus,
  ShieldCheck,
  Sun,
  Video,
} from "lucide-react";
import { MissionQuest } from "@/types/astronaut";

interface RecommendedHabitsPanelProps {
  habits: MissionQuest[];
  onToggleHabit: (habitId: string) => void;
  onAddCustomHabit: (
    title: string,
    category: MissionQuest["category"]
  ) => void;
  onOpenReferences?: () => void;
}

const CATEGORY_ICON: Record<MissionQuest["category"], React.ReactNode> = {
  fisico: <Dumbbell className="h-3.5 w-3.5 text-amber-600" />,
  hidratacion: <Droplets className="h-3.5 w-3.5 text-[#1a73e8]" />,
  mental: <Video className="h-3.5 w-3.5 text-indigo-600" />,
  circadiano: <Sun className="h-3.5 w-3.5 text-emerald-600" />,
};

export default function RecommendedHabitsPanel({
  habits,
  onToggleHabit,
  onAddCustomHabit,
  onOpenReferences,
}: RecommendedHabitsPanelProps) {
  const [newHabitTitle, setNewHabitTitle] = useState("");
  const [newCategory, setNewCategory] =
    useState<MissionQuest["category"]>("mental");

  const completedCount = habits.filter((h) => h.completed).length;
  const totalCount = Math.max(1, habits.length);
  const adherencePct = Math.round((completedCount / totalCount) * 100);

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
        {/* Header: Title & Daily Adherence */}
        <div className="mb-3.5 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
              <ClipboardCheck className="h-5 w-5 text-[#1a73e8]" />
              Hábitos Recomendados
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Contramedidas diarias validadas contra protocolos oficiales NASA HRP
              y estándar NASA-STD-3001.
            </p>
          </div>

          <div className="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span className="font-mono-hud">
              {completedCount}/{habits.length} cumplidos
            </span>
          </div>
        </div>

        {/* Daily Adherence Progress Bar */}
        <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50/80 p-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700">
              Adherencia preventiva del turno actual
            </span>
            <span className="font-mono-hud font-bold text-[#1a73e8]">
              {adherencePct}% ({completedCount} de {habits.length} hábitos)
            </span>
          </div>
          <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#1a73e8] via-teal-500 to-emerald-500 transition-all duration-500"
              style={{ width: `${Math.max(4, adherencePct)}%` }}
            />
          </div>
        </div>

        {/* Interactive Recommended Habits Checklist */}
        <div className="space-y-2">
          {habits.map((habit) => (
            <button
              key={habit.id}
              type="button"
              onClick={() => onToggleHabit(habit.id)}
              className={`flex w-full cursor-pointer items-start gap-2.5 rounded-xl border p-3 text-left transition ${
                habit.completed
                  ? "border-emerald-300 bg-emerald-50/75"
                  : "border-slate-200 bg-slate-50/70 hover:border-blue-300 hover:bg-white"
              }`}
            >
              {habit.completed ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              ) : (
                <Circle className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
              )}

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-1.5">
                  <span
                    className={`flex items-center gap-1.5 text-xs font-semibold ${
                      habit.completed
                        ? "text-emerald-800 line-through"
                        : "text-slate-800"
                    }`}
                  >
                    {CATEGORY_ICON[habit.category]}
                    {habit.title}
                  </span>
                  <span className="rounded-md bg-blue-50 px-2 py-0.5 font-mono-hud text-[10px] font-bold text-[#1a73e8]">
                    {habit.durationLabel}
                  </span>
                </div>

                <p className="mt-1 text-[11px] leading-snug text-slate-500">
                  {habit.description}
                </p>

                <p className="mt-1 text-[11px] font-medium text-emerald-700">
                  Efecto clínico: {habit.impactDescription}
                </p>

                {habit.nasaStandard && (
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[10px]">
                    <span className="rounded-md border border-blue-200 bg-blue-50/70 px-1.5 py-0.5 font-semibold text-[#0b2559]">
                      {habit.nasaStandard}
                    </span>
                    {habit.nasaSource && (
                      <span className="text-slate-400">{habit.nasaSource}</span>
                    )}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Add Custom Personal Habit */}
        <form onSubmit={handleSubmit} className="mt-3 flex gap-2">
          <input
            type="text"
            value={newHabitTitle}
            onChange={(e) => setNewHabitTitle(e.target.value)}
            placeholder="Añadir hábito personal (ej. estiramiento lumbar, lectura)..."
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
      </div>

      {/* NASA HRP Evidence Summary Footer */}
      <div className="mt-4 rounded-xl border border-blue-200/80 bg-blue-50/45 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#0b2559]">
            <BookOpenCheck className="h-4 w-4 text-[#1a73e8]" />
            Criterios Oficiales NASA HRP Aplicados
          </div>
          {onOpenReferences && (
            <button
              type="button"
              onClick={onOpenReferences}
              className="cursor-pointer text-[11px] font-semibold text-[#1a73e8] underline-offset-2 hover:underline"
            >
              Ver fuentes científicas
            </button>
          )}
        </div>
        <ul className="mt-2 space-y-1 text-[11px] leading-snug text-slate-600">
          <li>
            • <strong className="text-slate-800">Ejercicio ISS:</strong>{" "}
            ampliado de 60 min a <strong>120–150 min/día</strong> (fuerza ARED +
            aeróbico CEVIS/T2).
          </li>
          <li>
            • <strong className="text-slate-800">Hidratación y Sueño:</strong>{" "}
            pauta NASA-STD-3001 de <strong>≥ 2.5 L/día</strong> y ventana de{" "}
            <strong>8–8.5 h</strong> con luz SSLA.
          </li>
          <li>
            • <strong className="text-slate-800">Soporte nutricional y BHP:</strong>{" "}
            <strong>800 UI/día Vitamina D</strong> por cabina sin UV + enlace
            familiar y dosimetría CSA Radi-N2.
          </li>
        </ul>
      </div>
    </section>
  );
}
