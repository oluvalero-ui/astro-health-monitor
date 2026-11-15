"use client";

import React from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { NavSectionId } from "@/components/LeftNavSidebar";

export interface SectionStepMeta {
  id: NavSectionId;
  index: number;
  shortLabel: string;
}

export const ORDERED_SECTIONS: SectionStepMeta[] = [
  { id: "resumen", index: 1, shortLabel: "Resumen y Cronometría" },
  { id: "escaner", index: 2, shortLabel: "Escáner Anatómico (6 Sistemas)" },
  { id: "wearable", index: 3, shortLabel: "Arnés Vestible (13 Signos)" },
  { id: "biomarcadores", index: 4, shortLabel: "Biomarcadores y Rutina" },
  { id: "informes", index: 5, shortLabel: "Informes y Hábitos" },
  { id: "referencias", index: 6, shortLabel: "NASA HRP y CSA" },
];

interface SectionPagerControlsProps {
  activeSection: NavSectionId;
  onNavigate: (section: NavSectionId) => void;
}

export default function SectionPagerControls({
  activeSection,
  onNavigate,
}: SectionPagerControlsProps) {
  const currentIdx = ORDERED_SECTIONS.findIndex((s) => s.id === activeSection);
  const safeIdx = currentIdx >= 0 ? currentIdx : 0;

  const prevSection = safeIdx > 0 ? ORDERED_SECTIONS[safeIdx - 1] : null;
  const nextSection =
    safeIdx < ORDERED_SECTIONS.length - 1 ? ORDERED_SECTIONS[safeIdx + 1] : null;
  const currentMeta = ORDERED_SECTIONS[safeIdx];

  return (
    <div
      aria-label="Controles de cambio de sección"
      className="fixed right-4 bottom-4 z-40 flex items-center gap-2 rounded-2xl border border-slate-300/90 bg-[#0b2559]/95 p-1.5 text-white shadow-2xl backdrop-blur-md sm:right-6 sm:bottom-6"
    >
      {/* Indicador de sección actual */}
      <div className="hidden px-2.5 text-right sm:block">
        <div className="font-mono-hud text-[10px] font-bold uppercase tracking-wider text-blue-300">
          Módulo {currentMeta.index} de {ORDERED_SECTIONS.length}
        </div>
        <div className="text-xs font-semibold text-white">
          {currentMeta.shortLabel}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        {/* Flecha Arriba (Sección Anterior) */}
        <button
          type="button"
          disabled={!prevSection}
          onClick={() => prevSection && onNavigate(prevSection.id)}
          title={
            prevSection
              ? `Subir a: ${prevSection.shortLabel}`
              : "Estás en la primera sección"
          }
          aria-label="Sección anterior"
          className={`flex h-9 w-9 items-center justify-center rounded-xl border transition ${
            prevSection
              ? "cursor-pointer border-white/20 bg-white/10 text-white hover:bg-[#1a73e8] hover:border-blue-400"
              : "cursor-not-allowed border-white/5 bg-white/5 text-white/25"
          }`}
        >
          <ChevronUp className="h-5 w-5" />
        </button>

        {/* Flecha Abajo (Sección Siguiente) */}
        <button
          type="button"
          disabled={!nextSection}
          onClick={() => nextSection && onNavigate(nextSection.id)}
          title={
            nextSection
              ? `Bajar a: ${nextSection.shortLabel}`
              : "Estás en la última sección"
          }
          aria-label="Sección siguiente"
          className={`flex h-9 w-9 items-center justify-center rounded-xl border transition ${
            nextSection
              ? "cursor-pointer border-white/20 bg-white/10 text-white hover:bg-[#1a73e8] hover:border-blue-400"
              : "cursor-not-allowed border-white/5 bg-white/5 text-white/25"
          }`}
        >
          <ChevronDown className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}