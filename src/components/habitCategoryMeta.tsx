import React from "react";
import { Droplets, Dumbbell, Sun, Video } from "lucide-react";
import { MissionQuest } from "@/types/astronaut";

export const HABIT_CATEGORY_META: Record<
  MissionQuest["category"],
  { label: string; icon: React.ReactNode }
> = {
  fisico: {
    label: "Physical & Nutrition",
    icon: <Dumbbell className="h-3.5 w-3.5 text-amber-400" />,
  },
  hidratacion: {
    label: "Hydration",
    icon: <Droplets className="h-3.5 w-3.5 text-sky-400" />,
  },
  mental: {
    label: "Behavioral Health (BHP)",
    icon: <Video className="h-3.5 w-3.5 text-cyan-400" />,
  },
  circadiano: {
    label: "Circadian & Sleep",
    icon: <Sun className="h-3.5 w-3.5 text-emerald-400" />,
  },
};
