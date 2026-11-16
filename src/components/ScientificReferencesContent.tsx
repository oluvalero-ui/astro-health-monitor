"use client";

import React from "react";
import { Cpu, Radiation } from "lucide-react";
import {
  CSA_RADIATION_LIMITS,
  SCIENTIFIC_REFERENCES,
} from "@/data/missionData";
import { HealthStatus } from "@/types/astronaut";
import { evaluateRadiationStatus, STATUS_HEX } from "@/utils/healthEngine";

const RAD_BADGE_CLASSES: Record<HealthStatus, string> = {
  optimal: "border-emerald-500/35 bg-emerald-500/10 text-emerald-300",
  warning: "border-amber-500/40 bg-amber-500/15 text-amber-300",
  critical: "border-red-500/45 bg-red-500/15 text-red-300",
};

interface ScientificReferencesContentProps {
  dailyRadiationMsv?: number;
  cumulativeRadiationMsv?: number;
  environmentShortName?: string;
  twoColumnsOnDesktop?: boolean;
}

export default function ScientificReferencesContent({
  dailyRadiationMsv,
  cumulativeRadiationMsv,
  environmentShortName,
  twoColumnsOnDesktop = false,
}: ScientificReferencesContentProps) {
  const hasLiveTelemetry =
    typeof dailyRadiationMsv === "number" &&
    typeof cumulativeRadiationMsv === "number";

  const radStatus: HealthStatus = hasLiveTelemetry
    ? evaluateRadiationStatus(dailyRadiationMsv)
    : "optimal";

  return (
    <div className="space-y-4">
      {/* CSA Radi-N2 / EVARM Radiological Reference Parameters */}
      <div className="rounded-xl border border-[#1e3458] bg-[#0a1324] p-4 shadow-inner">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sky-400">
            <Radiation className="h-4 w-4" />
            Radiological Reference Parameters ({CSA_RADIATION_LIMITS.instrumentName})
          </div>

          {hasLiveTelemetry && (
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono-hud text-[11px] font-bold ${RAD_BADGE_CLASSES[radStatus]}`}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: STATUS_HEX[radStatus] }}
              />
              Current reading{environmentShortName ? ` (${environmentShortName})` : ""}:{" "}
              {dailyRadiationMsv.toFixed(2)} mSv/day · Cum:{" "}
              {cumulativeRadiationMsv.toFixed(1)} mSv
            </span>
          )}
        </div>

        <div className="mt-2.5 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
          <div className="rounded-lg border border-[#1b2d4b] bg-[#0e192f] p-2.5 text-xs">
            <div className="text-slate-400">Nominal Daily Rate (LEO)</div>
            <div className="mt-0.5 font-mono-hud text-sm font-bold text-emerald-400">
              ≤ {CSA_RADIATION_LIMITS.dailyNominalMsv} mSv/day
            </div>
          </div>
          <div className="rounded-lg border border-[#1b2d4b] bg-[#0e192f] p-2.5 text-xs">
            <div className="text-slate-400">Daily Alert Threshold</div>
            <div className="mt-0.5 font-mono-hud text-sm font-bold text-red-400">
              ≥ {CSA_RADIATION_LIMITS.dailyAlertMsv} mSv/day
            </div>
          </div>
          <div className="rounded-lg border border-[#1b2d4b] bg-[#0e192f] p-2.5 text-xs">
            <div className="text-slate-400">Career Cumulative Limit</div>
            <div className="mt-0.5 font-mono-hud text-sm font-bold text-amber-400">
              {CSA_RADIATION_LIMITS.careerLimitMsv} mSv (Annual:{" "}
              {CSA_RADIATION_LIMITS.annualLimitMsv} mSv)
            </div>
          </div>
        </div>
      </div>

      {/* Bio-Monitor 3N Architecture & Sensor Physics (Offline) */}
      <div className="rounded-xl border border-[#182742] bg-[#091120] p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sky-300">
            <Cpu className="h-4 w-4 text-sky-400" />
            Bio-Monitor 3N Architecture & Sensor Physics (Local Memory)
          </div>
          <span className="rounded-full border border-sky-500/35 bg-sky-500/10 px-2.5 py-0.5 font-mono-hud text-[11px] font-bold text-sky-300">
            Offline Technical Manual
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="rounded-lg border border-[#182742] bg-[#0c1426] p-3 text-xs">
            <div className="font-bold text-slate-100">
              Frontal Node (Cephalic Headband)
            </div>
            <p className="mt-1 leading-relaxed text-slate-300">
              In microgravity (0g), fluids shift cephalad while peripheral hands
              cool down; capturing SpO₂, optical pulse (PTT), and Zero-Heat-Flux
              core temp (ZHF) at the forehead prevents vasoconstriction artifacts
              and enables cuffless continuous blood pressure estimation.
            </p>
          </div>
          <div className="rounded-lg border border-[#182742] bg-[#0c1426] p-3 text-xs">
            <div className="font-bold text-slate-100">
              Thoracic Node (Textile Smart Vest)
            </div>
            <p className="mt-1 leading-relaxed text-slate-300">
              Integrates 3 dry ECG leads (V1, V2, V3) and Respiratory Inductance
              Plethysmography (RIP) bands computing heart rate, HRV (rMSSD),
              minute ventilation (L/min), skin temp, and posture/sleep without
              wet skin adhesives.
            </p>
          </div>
          <div className="rounded-lg border border-[#182742] bg-[#0c1426] p-3 text-xs">
            <div className="font-bold text-slate-100">
              Radial Node & Gravity Calibration
            </div>
            <p className="mt-1 leading-relaxed text-slate-300">
              Pairs personal wrist dosimetry (mSv/day) with laryngeal neck
              accelerometry (quantifying vocal cord strain without audio
              recording). When gravity changes (0g, 0.16g, 0.38g), a 30 s cuff
              check recalibrates optical PTT vascular curves.
            </p>
          </div>
        </div>
      </div>

      {/* NASA HRP (5 Hazards) & CSA Program Cards */}
      <div
        className={
          twoColumnsOnDesktop
            ? "grid grid-cols-1 gap-4 xl:grid-cols-2"
            : "space-y-4"
        }
      >
        {SCIENTIFIC_REFERENCES.map((section) => (
          <div
            key={section.id}
            className="rounded-xl border border-[#182742] bg-[#091120] p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="rounded-full border border-sky-500/35 bg-sky-500/10 px-2.5 py-0.5 text-[11px] font-bold text-sky-300">
                {section.agency}
              </span>
              <span className="font-mono-hud text-[11px] text-slate-400">
                {section.badge}
              </span>
            </div>
            <h3 className="mt-2 text-sm font-bold text-slate-100 sm:text-base">
              {section.title}
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-slate-300">
              {section.description}
            </p>

            <div className="mt-3 space-y-2.5">
              {section.items.map((item) => (
                <div
                  key={item.name}
                  className="rounded-lg border border-[#182742] bg-[#0c1426] p-3 text-xs"
                >
                  <div className="font-bold text-slate-100">{item.name}</div>
                  <p className="mt-1 leading-relaxed text-slate-300">
                    {item.detail}
                  </p>
                  <p className="mt-1.5 text-[11px] font-medium text-sky-300">
                    Console Implementation: {item.appMapping}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
