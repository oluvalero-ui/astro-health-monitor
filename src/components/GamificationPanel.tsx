"use client";

import React, { useState } from "react";
import {
  Award,
  CheckCircle2,
  Circle,
  Droplets,
  Dumbbell,
  Flame,
  Plus,
  Sparkles,
  Sun,
  Trophy,
  Video,
} from "lucide-react";
import { MISSION_BADGES } from "@/data/missionData";
import { MissionQuest } from "@/types/astronaut";

interface GamificationPanelProps {
  quests: MissionQuest[];
  xp: number;
  streakDays: number;
  onToggleQuest: (questId: string) => void;
  onAddCustomQuest: (title: string, category: MissionQuest["category"]) => void;
}

const CATEGORY_ICON: Record<MissionQuest["category"], React.ReactNode> = {
  fisico: <Dumbbell className="h-3.5 w-3.5 text-amber-400" />,
  hidratacion: <Droplets className="h-3.5 w-3.5 text-cyan-400" />,
  mental: <Video className="h-3.5 w-3.5 text-violet-400" />,
  circadiano: <Sun className="h-3.5 w-3.5 text-emerald-400" />,
};

export default function GamificationPanel({
  quests,
  xp,
  streakDays,
  onToggleQuest,
  onAddCustomQuest,
}: GamificationPanelProps) {
  const [newQuestTitle, setNewQuestTitle] = useState("");
  const [newCategory, setNewCategory] =
    useState<MissionQuest["category"]>("mental");

  const level = Math.floor(xp / 200) + 1;
  const currentLevelXp = xp % 200;
  const progressPct = Math.round((currentLevelXp / 200) * 100);
  const completedCount = quests.filter((q) => q.completed).length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newQuestTitle.trim();
    if (!trimmed) return;
    onAddCustomQuest(trimmed, newCategory);
    setNewQuestTitle("");
  };

  return (
    <section className="flex h-full flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/90 p-4 shadow-xl sm:p-5">
      <div>
        {/* Header: Level, XP & Streak */}
        <div className="mb-3.5 flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <h2 className="flex items-center gap-2 text-base font-bold text-white">
              <Trophy className="h-5 w-5 text-amber-400" />
              Módulo 4B · Misiones y Plan de Acción
            </h2>
            <p className="mt-0.5 text-xs text-slate-400">
              Completa contramedidas contra aburrimiento, sedentarismo y aislamiento.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/15 px-2.5 py-1 text-xs font-bold text-amber-300">
              <Flame className="h-3.5 w-3.5" />
              <span className="font-mono-hud">{streakDays} días</span>
            </div>
            <div className="rounded-lg border border-cyan-500/40 bg-cyan-500/15 px-2.5 py-1 font-mono-hud text-xs font-bold text-cyan-200">
              Nivel {level}
            </div>
          </div>
        </div>

        {/* XP Progress Bar */}
        <div className="mb-4 rounded-xl border border-slate-800 bg-slate-950/80 p-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300">
              Experiencia de Misión ({completedCount}/{quests.length} completadas hoy)
            </span>
            <span className="font-mono-hud font-bold text-cyan-300">
              {xp} XP ({currentLevelXp}/200 para Nivel {level + 1})
            </span>
          </div>
          <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-emerald-400 to-amber-400 transition-all duration-500"
              style={{ width: `${Math.max(8, progressPct)}%` }}
            />
          </div>
        </div>

        {/* Interactive Missions Checklist */}
        <div className="space-y-2">
          {quests.map((quest) => (
            <button
              key={quest.id}
              type="button"
              onClick={() => onToggleQuest(quest.id)}
              className={`flex w-full cursor-pointer items-start gap-2.5 rounded-xl border p-3 text-left transition ${
                quest.completed
                  ? "border-emerald-500/40 bg-emerald-500/10"
                  : "border-slate-800 bg-slate-950/75 hover:border-slate-700"
              }`}
            >
              {quest.completed ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
              ) : (
                <Circle className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
              )}

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-1.5">
                  <span
                    className={`flex items-center gap-1.5 text-xs font-semibold ${
                      quest.completed
                        ? "text-emerald-200 line-through"
                        : "text-slate-100"
                    }`}
                  >
                    {CATEGORY_ICON[quest.category]}
                    {quest.title}
                  </span>
                  <span className="rounded bg-slate-900 px-2 py-0.5 font-mono-hud text-[10px] font-bold text-amber-300">
                    +{quest.xpReward} XP · {quest.durationLabel}
                  </span>
                </div>
                <p className="mt-1 text-[11px] leading-snug text-slate-400">
                  {quest.description}
                </p>
                <p className="mt-1 text-[11px] font-medium text-cyan-300/90">
                  Impacto: {quest.impactDescription}
                </p>
              </div>
            </button>
          ))}
        </div>

        {/* Add Custom Reminder / Activity */}
        <form onSubmit={handleSubmit} className="mt-3 flex gap-2">
          <input
            type="text"
            value={newQuestTitle}
            onChange={(e) => setNewQuestTitle(e.target.value)}
            placeholder="Añadir recordatorio personal (ej. música / estiramiento)..."
            className="min-w-0 flex-1 rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none"
          />
          <select
            value={newCategory}
            onChange={(e) =>
              setNewCategory(e.target.value as MissionQuest["category"])
            }
            className="rounded-lg border border-slate-800 bg-slate-950 px-2 py-1.5 text-xs text-slate-300 focus:border-cyan-500 focus:outline-none"
            aria-label="Categoría de recordatorio"
          >
            <option value="mental">Mental</option>
            <option value="fisico">Físico</option>
            <option value="hidratacion">Agua</option>
            <option value="circadiano">Luz</option>
          </select>
          <button
            type="submit"
            className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-cyan-500/40 bg-cyan-500/15 px-3 py-1.5 text-xs font-semibold text-cyan-200 hover:bg-cyan-500/25"
          >
            <Plus className="h-3.5 w-3.5" />
            Añadir
          </button>
        </form>
      </div>

      {/* Mission Badges */}
      <div className="mt-4 border-t border-slate-800 pt-3">
        <div className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-300">
          <Award className="h-4 w-4 text-amber-400" />
          Insignias de Misión
        </div>
        <div className="grid grid-cols-2 gap-2">
          {MISSION_BADGES.map((badge) => {
            const unlocked =
              xp >= badge.requiredXp &&
              streakDays >= badge.requiredStreak &&
              completedCount >= badge.requiredQuests;
            return (
              <div
                key={badge.id}
                className={`rounded-lg border p-2 text-[11px] transition ${
                  unlocked
                    ? "border-amber-400/50 bg-amber-500/10 text-amber-100"
                    : "border-slate-800 bg-slate-950/60 text-slate-500"
                }`}
              >
                <div className="flex items-center gap-1.5 font-semibold">
                  <Sparkles
                    className={`h-3.5 w-3.5 shrink-0 ${
                      unlocked ? "text-amber-400" : "text-slate-600"
                    }`}
                  />
                  <span className="truncate">{badge.name}</span>
                </div>
                <p className="mt-0.5 line-clamp-2 text-[10px] opacity-85">
                  {badge.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
