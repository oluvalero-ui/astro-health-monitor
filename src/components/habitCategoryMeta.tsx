import React from "react";
import { Droplets, Dumbbell, Sun, Video } from "lucide-react";
import { MissionQuest } from "@/types/astronaut";

export const HABIT_CATEGORY_META: Record<
  MissionQuest["category"],
  { label: string; icon: React.ReactNode }
> = {
  fisico: {
    label: "Físico y Nutrición",
    icon: <Dumbbell className="h-3.5 w-3.5 text-amber-400" />,
  },
  hidratacion: {
    label: "Hidratación",
    icon: <Droplets className="h-3.5 w-3.5 text-sky-400" />,
  },
  mental: {
    label: "Salud Mental (BHP)",
    icon: <Video className="h-3.5 w-3.5 text-cyan-400" />,
  },
  circadiano: {
    label: "Circadiano y Sueño",
    icon: <Sun className="h-3.5 w-3.5 text-emerald-400" />,
  },
};
