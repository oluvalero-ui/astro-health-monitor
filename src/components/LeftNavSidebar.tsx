"use client";

import React from "react";
import {
  Activity,
  BarChart3,
  BookOpen,
  Monitor,
  ScanLine,
  Sliders,
  Watch,
} from "lucide-react";

export type NavSectionId =
  | "resumen"
  | "escaner"
  | "wearable"
  | "biomarcadores"
  | "informes"
  | "referencias";

interface LeftNavSidebarProps {
  activeSection: NavSectionId;
  onNavigate: (section: NavSectionId) => void;
  onOpenScanModal: () => void;
}

const NAV_ITEMS: {
  id: NavSectionId;
  label: string;
  title: string;
  icon: React.ReactNode;
}[] = [
  {
    id: "resumen",
    label: "MCC Telemetry",
    title: "Mission Control Center Telemetry (NASA HRP)",
    icon: <Monitor className="h-4 w-4" />,
  },
  {
    id: "escaner",
    label: "Bio-Scanner",
    title: "HRP Bio-Scanner (6 Subsystems)",
    icon: <ScanLine className="h-4 w-4" />,
  },
  {
    id: "wearable",
    label: "Bio-Monitor 3N",
    title: "CSA Bio-Monitor 3N (13 Channels)",
    icon: <Watch className="h-4 w-4" />,
  },
  {
    id: "biomarcadores",
    label: "Biomarkers",
    title: "Physiological Biomarkers, BHP & Synchrony",
    icon: <Activity className="h-4 w-4" />,
  },
  {
    id: "informes",
    label: "Countermeasures",
    title: "Longitudinal Telemetry & HRP Countermeasures",
    icon: <BarChart3 className="h-4 w-4" />,
  },
  {
    id: "referencias",
    label: "NASA-STD-3001",
    title: "NASA-STD-3001 Standards & CSA Dosimetry",
    icon: <BookOpen className="h-4 w-4" />,
  },
];

export default function LeftNavSidebar({
  activeSection,
  onNavigate,
  onOpenScanModal,
}: LeftNavSidebarProps) {
  return (
    <>
      {/* Desktop Left Navy Rail — Single Authoritative Navigation */}
      <aside
        aria-label="Primary health monitor navigation"
        className="hidden shrink-0 flex-col items-center justify-between border-r border-[#182742] bg-[#050a14] px-1.5 py-3 text-white shadow-xl md:sticky md:top-0 md:flex md:h-screen md:w-[92px]"
      >
        <div className="flex w-full flex-col items-center gap-1.5">
          {NAV_ITEMS.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                title={item.title}
                onClick={() => onNavigate(item.id)}
                className={`flex w-full cursor-pointer flex-col items-center justify-center gap-1 rounded-xl px-1 py-2.5 text-center text-[9.5px] font-semibold leading-tight transition-all ${
                  isActive
                    ? "border border-sky-400/40 bg-sky-500/20 text-sky-300 shadow-md shadow-sky-950/50"
                    : "text-slate-400 hover:bg-[#0e182c] hover:text-slate-100"
                }`}
              >
                {item.icon}
                <span className="tracking-tight">{item.label}</span>
              </button>
            );
          })}

          <div className="my-1 h-px w-10 bg-[#182742]" />

          <button
            type="button"
            title="Point-of-Care Log & Clinical Simulator"
            onClick={onOpenScanModal}
            className="flex w-full cursor-pointer flex-col items-center justify-center gap-1 rounded-xl py-2 text-[10px] font-semibold text-teal-300/85 transition hover:bg-[#0e182c] hover:text-teal-200"
          >
            <Sliders className="h-4 w-4" />
            <span>PoC Sim</span>
          </button>
        </div>
      </aside>

      {/* Mobile Compact Bar */}
      <nav
        aria-label="Mobile navigation"
        className="flex flex-wrap items-center justify-around gap-1 border-b border-slate-800 bg-[#0b2559] px-1.5 py-1.5 text-white md:hidden"
      >
        {NAV_ITEMS.map((item) => {
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className={`flex flex-col items-center gap-0.5 rounded-lg px-2 py-1 text-[10px] font-semibold ${
                isActive ? "bg-[#1a73e8] text-white" : "text-blue-100/75"
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          );
        })}
        <button
          type="button"
          onClick={onOpenScanModal}
          className="flex flex-col items-center gap-0.5 rounded-lg px-2 py-1 text-[10px] font-semibold text-cyan-200"
        >
          <Sliders className="h-4 w-4" />
          <span>PoC Sim</span>
        </button>
      </nav>
    </>
  );
}
