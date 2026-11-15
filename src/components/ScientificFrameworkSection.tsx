"use client";

import React from "react";
import { BookOpen } from "lucide-react";
import ScientificReferencesContent from "@/components/ScientificReferencesContent";
import { MISSION_ENVIRONMENTS } from "@/data/missionData";
import { MissionEnvironmentId } from "@/types/astronaut";

interface ScientificFrameworkSectionProps {
  environmentId: MissionEnvironmentId;
  dailyRadiationMsv: number;
  cumulativeRadiationMsv: number;
}

export default function ScientificFrameworkSection({
  environmentId,
  dailyRadiationMsv,
  cumulativeRadiationMsv,
}: ScientificFrameworkSectionProps) {
  const env = MISSION_ENVIRONMENTS[environmentId];

  return (
    <section
      id="referencias-section"
      className="rounded-2xl border border-[#1b2d4b] bg-[#0c1426] p-4 shadow-[0_14px_34px_rgba(2,6,23,0.45)] sm:p-5"
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-[#182742] pb-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-sky-400/25 bg-sky-500/15 text-sky-300">
            <BookOpen className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-base font-bold text-slate-100 sm:text-lg">
              Estándares NASA-STD-3001 · Human Research Program & Dosimetría CSA
            </h2>
            <p className="text-xs text-slate-400">
              Marco oficial de los 5 Peligros del Espacio Humano y monitoreo
              radiológico {env.shortName}.
            </p>
          </div>
        </div>
      </div>

      <ScientificReferencesContent
        dailyRadiationMsv={dailyRadiationMsv}
        cumulativeRadiationMsv={cumulativeRadiationMsv}
        environmentShortName={env.shortName}
        twoColumnsOnDesktop
      />
    </section>
  );
}
