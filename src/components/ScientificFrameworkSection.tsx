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
      className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-[0_6px_24px_rgba(15,23,42,0.04)] sm:p-5"
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-[#1a73e8]">
            <BookOpen className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-base font-bold text-slate-900 sm:text-lg">
              Base Científica · NASA HRP y Dosimetría CSA
            </h2>
            <p className="text-xs text-slate-500">
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
