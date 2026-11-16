"use client";

import React, { useState } from "react";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  Brain,
  CheckCircle2,
  Dumbbell,
  Eye,
  HeartPulse,
  ScanLine,
  Sparkles,
  Utensils,
} from "lucide-react";
import { SYSTEM_DIAGNOSTIC_GUIDES } from "@/data/missionData";
import {
  BiomarkerData,
  HealthStatus,
  MissionEnvironmentId,
  SystemZoneId,
} from "@/types/astronaut";
import {
  getZoneTargetedRecommendations,
  STATUS_HEX,
} from "@/utils/healthEngine";
import { StatusPill } from "@/components/ui/StatusPill";

interface AnatomicalScannerProps {
  selectedZone: SystemZoneId;
  onSelectZone: (zone: SystemZoneId) => void;
  zoneStatuses: Record<SystemZoneId, HealthStatus>;
  biomarkers: BiomarkerData;
  environmentId: MissionEnvironmentId;
  onOpenPocModal: () => void;
}

const ZONE_ICONS: Record<SystemZoneId, React.ReactNode> = {
  cerebro: <Brain className="h-4 w-4" />,
  rostro: <Eye className="h-4 w-4" />,
  corazon: <HeartPulse className="h-4 w-4" />,
  endocrino: <Sparkles className="h-4 w-4" />,
  abdomen: <Utensils className="h-4 w-4" />,
  musculo: <Dumbbell className="h-4 w-4" />,
};

const ZONE_ORDER: SystemZoneId[] = [
  "cerebro",
  "rostro",
  "corazon",
  "endocrino",
  "abdomen",
  "musculo",
];

function getZoneLiveValues(zone: SystemZoneId, b: BiomarkerData): string[] {
  switch (zone) {
    case "cerebro":
      return [
        `Mental fatigue: ${b.mentalFatigue}/100`,
        `Stress: ${b.stressLevel}/100`,
        `Loneliness: ${b.lonelinessLevel}/100`,
        `Boredom: ${b.boredomLevel}/100`,
        `Sleep: ${b.sleepHours.toFixed(1)} h`,
        `Mood: ${b.moodScore}/100`,
      ];
    case "rostro":
      return [
        `Body posture: ${b.postureScore}/100`,
        `Facial/ocular tension: ${b.facialTension}/100`,
      ];
    case "corazon":
      return [
        `Heart rate: ${b.bpm} BPM`,
        `Blood Pressure: ${b.systolicBP}/${b.diastolicBP} mmHg`,
      ];
    case "endocrino":
      return [
        `Cortisol (stress): ${b.cortisolIndex}/100`,
        `Melatonin (sleep): ${b.melatoninIndex}/100`,
        `CSA Radiation: ${b.dailyRadiationMsv.toFixed(2)} mSv/d`,
      ];
    case "abdomen":
      return [
        `Blood glucose: ${b.bloodGlucoseMgDl} mg/dL`,
        `Hydration: ${b.hydrationPercent}%`,
        `Core Temp: ${b.bodyTempC.toFixed(1)} °C`,
      ];
    case "musculo":
      return [
        `Physical fatigue: ${b.physicalFatigue}/100`,
        `Bone density: ${b.boneDensityIndex}%`,
      ];
  }
}

export default function AnatomicalScanner({
  selectedZone,
  onSelectZone,
  zoneStatuses,
  biomarkers,
  environmentId,
  onOpenPocModal,
}: AnatomicalScannerProps) {
  const guide = SYSTEM_DIAGNOSTIC_GUIDES[selectedZone];
  const activeStatus = zoneStatuses[selectedZone];
  const activeHex = STATUS_HEX[activeStatus];
  const zoneRecs = getZoneTargetedRecommendations(
    selectedZone,
    biomarkers,
    environmentId
  );
  const [diagnosticTab, setDiagnosticTab] = useState<"protocolo" | "umbrales">(
    "protocolo"
  );

  const getZoneFill = (zone: SystemZoneId, baseOpacity = 0.25) => {
    const color = STATUS_HEX[zoneStatuses[zone]];
    const isSel = selectedZone === zone;
    return {
      stroke: color,
      fill: color,
      fillOpacity: isSel ? baseOpacity + 0.22 : baseOpacity,
      strokeWidth: isSel ? 2.6 : 1.7,
    };
  };

  return (
    <section
      id="scanner-section"
      className="rounded-2xl border border-[#1b2d4b] bg-[#0c1426] p-4 sm:p-5"
    >
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-[#162642] pb-3">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-sky-400" />
            <h2 className="text-base font-bold text-slate-100 sm:text-lg">
              Anatomical & Neuro-Behavioral Bio-Scanner (NASA HRP)
            </h2>
          </div>
          <p className="mt-0.5 text-xs text-slate-400">
            Select a physiological subsystem to inspect telemetry, clinical thresholds, and action protocols.
          </p>
        </div>

        {/* Status Legend */}
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[#1b2d4b] bg-[#091120] px-3 py-1.5 text-xs font-medium">
          <span className="flex items-center gap-1.5 text-emerald-300">
            <span className="h-2 w-2 rounded-full bg-[#10b981]" />
            NOMINAL
          </span>
          <span className="flex items-center gap-1.5 text-amber-300">
            <span className="h-2 w-2 rounded-full bg-[#f59e0b]" />
            CAUTION
          </span>
          <span className="flex items-center gap-1.5 text-red-300">
            <span className="h-2 w-2 rounded-full bg-[#ef4444]" />
            CRITICAL
          </span>
        </div>
      </div>

      {/* Main Split: Left SVG Interactive Body + Quick Zone Selector, Right 5-Section Diagnostic Panel */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
        {/* LEFT: Interactive SVG Silhouette */}
        <div className="flex flex-col gap-3 xl:col-span-5">
          {/* Quick 6-system tabs */}
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
            {ZONE_ORDER.map((zoneId) => {
              const g = SYSTEM_DIAGNOSTIC_GUIDES[zoneId];
              const st = zoneStatuses[zoneId];
              const isSelected = selectedZone === zoneId;
              return (
                <button
                  key={zoneId}
                  type="button"
                  onClick={() => onSelectZone(zoneId)}
                  className={`flex cursor-pointer items-center gap-2 rounded-xl border px-2.5 py-2 text-left text-xs transition ${
                    isSelected
                      ? "border-sky-400/60 bg-sky-500/15 font-semibold text-sky-200"
                      : "border-[#1b2d4b] bg-[#091120] text-slate-300 hover:border-sky-500/40 hover:text-white"
                  }`}
                >
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: STATUS_HEX[st] }}
                  />
                  <span className="truncate font-medium">{g.name}</span>
                </button>
              );
            })}
          </div>

          {/* Interactive SVG Container (Clean Clinical Blueprint Surface) */}
          <div className="relative flex flex-1 items-center justify-center overflow-hidden rounded-2xl border border-[#1c2d4a] bg-[#091224] p-3">
            {/* Scan beam micro-animation */}
            <div className="pointer-events-none absolute inset-x-4 top-2 h-1 rounded-full bg-gradient-to-r from-transparent via-sky-500/35 to-transparent animate-scanline" />

            {/* HUD Corner Data */}
            <div className="pointer-events-none absolute left-3 top-3 font-mono-hud text-[10px] font-medium text-slate-400">
              ENVIRONMENT: <span className="text-sky-300">{environmentId.toUpperCase()}</span>
            </div>

            <svg
              viewBox="0 0 360 490"
              className="h-[410px] w-full max-w-[350px] select-none sm:h-[455px]"
              role="img"
              aria-label="Interactive anatomical and psychological astronaut silhouette"
            >
              <defs>
                <radialGradient id="hudGlowLight" cx="50%" cy="45%" r="55%">
                  <stop offset="0%" stopColor="#1a73e8" stopOpacity="0.12" />
                  <stop offset="100%" stopColor="#091224" stopOpacity="0" />
                </radialGradient>
                <filter id="zoneGlowLight" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="2.5" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Background Clinical Grid Rings */}
              <rect x="0" y="0" width="360" height="490" fill="url(#hudGlowLight)" />
              <circle
                cx="180"
                cy="240"
                r="160"
                fill="none"
                stroke="#182a4a"
                strokeDasharray="4 6"
                strokeWidth="1"
              />
              <circle
                cx="180"
                cy="240"
                r="112"
                fill="none"
                stroke="#182a4a"
                strokeDasharray="2 5"
                strokeWidth="1"
              />
              <line
                x1="180"
                y1="15"
                x2="180"
                y2="475"
                stroke="#182a4a"
                strokeWidth="1"
                strokeDasharray="3 4"
              />

              {/* Base Human Silhouette Outline (Dark Clinical Schematic) */}
              <g
                fill="#0f1d36"
                fillOpacity="0.95"
                stroke="#2b4c7e"
                strokeWidth="1.5"
                strokeLinejoin="round"
              >
                <path d="M180 24 C157 24 143 41 143 65 C143 85 154 103 166 108 L166 122 L194 122 L194 108 C206 103 217 85 217 65 C217 41 203 24 180 24 Z" />
                <path d="M166 122 L120 132 C106 136 98 148 94 166 L76 244 C73 255 82 263 91 256 L112 184 L124 176 L124 278 L236 278 L236 176 L248 184 L269 256 C278 263 287 255 284 244 L266 166 C262 148 254 136 240 132 L194 122 Z" />
                <path d="M124 278 L120 315 L127 458 C128 468 148 469 151 458 L166 336 L180 326 L194 336 L209 458 C212 469 232 468 233 458 L240 315 L236 278 Z" />
              </g>

              {/* 6. SISTEMA MUSCULOESQUELÉTICO */}
              <g
                className="cursor-pointer transition-opacity hover:opacity-100"
                onClick={() => onSelectZone("musculo")}
                filter={selectedZone === "musculo" ? "url(#zoneGlowLight)" : undefined}
              >
                <path
                  d="M135 295 L143 375 L140 448 M225 295 L217 375 L220 448"
                  fill="none"
                  stroke={STATUS_HEX[zoneStatuses.musculo]}
                  strokeWidth={selectedZone === "musculo" ? 7 : 5}
                  strokeLinecap="round"
                  strokeOpacity="0.45"
                />
                <path
                  d="M135 295 L143 375 L140 448 M225 295 L217 375 L220 448"
                  fill="none"
                  stroke={STATUS_HEX[zoneStatuses.musculo]}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeDasharray="6 4"
                />
                <path
                  d="M112 145 L95 200 L84 245 M248 145 L265 200 L276 245"
                  fill="none"
                  stroke={STATUS_HEX[zoneStatuses.musculo]}
                  strokeWidth={selectedZone === "musculo" ? 5 : 3.5}
                  strokeLinecap="round"
                  strokeOpacity="0.7"
                />
                <circle cx="143" cy="375" r="7" {...getZoneFill("musculo", 0.25)} />
                <circle cx="217" cy="375" r="7" {...getZoneFill("musculo", 0.25)} />
                <rect x="118" y="288" width="46" height="175" rx="16" fill="transparent" />
                <rect x="196" y="288" width="46" height="175" rx="16" fill="transparent" />
                <rect x="70" y="140" width="45" height="125" rx="16" fill="transparent" />
                <rect x="245" y="140" width="45" height="125" rx="16" fill="transparent" />
              </g>

              {/* 5. ABDOMEN / METABOLISMO */}
              <g
                className="cursor-pointer"
                onClick={() => onSelectZone("abdomen")}
                filter={selectedZone === "abdomen" ? "url(#zoneGlowLight)" : undefined}
              >
                <rect x="140" y="214" width="80" height="58" rx="16" {...getZoneFill("abdomen", 0.22)} />
                <path
                  d="M153 232 C164 224 196 224 205 236 C210 245 198 260 180 260 C162 260 150 245 153 232 Z"
                  fill="none"
                  stroke={STATUS_HEX[zoneStatuses.abdomen]}
                  strokeWidth="1.6"
                />
                <circle cx="180" cy="243" r="4" fill={STATUS_HEX[zoneStatuses.abdomen]} />
              </g>

              {/* 4. SISTEMA ENDOCRINO / INMUNOLÓGICO */}
              <g
                className="cursor-pointer"
                onClick={() => onSelectZone("endocrino")}
                filter={selectedZone === "endocrino" ? "url(#zoneGlowLight)" : undefined}
              >
                <path
                  d="M168 117 Q180 124 192 117 Q195 127 180 129 Q165 127 168 117 Z"
                  {...getZoneFill("endocrino", 0.35)}
                />
                <circle cx="154" cy="154" r="10" {...getZoneFill("endocrino", 0.28)} />
                <circle cx="148" cy="202" r="8" {...getZoneFill("endocrino", 0.25)} />
                <circle cx="212" cy="202" r="8" {...getZoneFill("endocrino", 0.25)} />
                <path
                  d="M180 128 L154 154 L148 202 M180 128 L212 202"
                  fill="none"
                  stroke={STATUS_HEX[zoneStatuses.endocrino]}
                  strokeWidth="1.4"
                  strokeDasharray="3 3"
                />
                <rect x="136" y="112" width="88" height="98" rx="14" fill="transparent" />
              </g>

              {/* 3. CORAZÓN / TÓRAX */}
              <g
                className="cursor-pointer"
                onClick={() => onSelectZone("corazon")}
                filter={selectedZone === "corazon" ? "url(#zoneGlowLight)" : undefined}
              >
                <ellipse
                  cx="180"
                  cy="170"
                  rx="44"
                  ry="34"
                  fill="none"
                  stroke={STATUS_HEX[zoneStatuses.corazon]}
                  strokeOpacity="0.55"
                  strokeWidth="1.3"
                  strokeDasharray="4 3"
                />
                <path
                  d="M190 156 C183 149 173 155 176 165 C178 173 190 183 192 184 C194 183 206 173 208 165 C211 155 201 149 194 156 L192 159 Z"
                  {...getZoneFill("corazon", 0.42)}
                />
                <polyline
                  points="150,174 166,174 171,164 176,184 182,160 187,174 212,174"
                  fill="none"
                  stroke={STATUS_HEX[zoneStatuses.corazon]}
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </g>

              {/* 2. ROSTRO / POSTURA */}
              <g
                className="cursor-pointer"
                onClick={() => onSelectZone("rostro")}
                filter={selectedZone === "rostro" ? "url(#zoneGlowLight)" : undefined}
              >
                <path d="M152 62 L208 62 L203 93 L180 104 L157 93 Z" {...getZoneFill("rostro", 0.25)} />
                <line x1="160" y1="72" x2="173" y2="72" stroke={STATUS_HEX[zoneStatuses.rostro]} strokeWidth="2.3" strokeLinecap="round" />
                <line x1="187" y1="72" x2="200" y2="72" stroke={STATUS_HEX[zoneStatuses.rostro]} strokeWidth="2.3" strokeLinecap="round" />
                <path
                  d="M118 134 Q180 124 242 134"
                  fill="none"
                  stroke={STATUS_HEX[zoneStatuses.rostro]}
                  strokeWidth="2"
                  strokeDasharray="4 3"
                />
              </g>

              {/* 1. CEREBRO / MENTE */}
              <g
                className="cursor-pointer"
                onClick={() => onSelectZone("cerebro")}
                filter={selectedZone === "cerebro" ? "url(#zoneGlowLight)" : undefined}
              >
                <path
                  d="M148 56 C148 33 163 26 180 26 C197 26 212 33 212 56 C203 59 189 58 180 56 C171 58 157 59 148 56 Z"
                  {...getZoneFill("cerebro", 0.38)}
                />
                <circle cx="166" cy="43" r="2.5" fill={STATUS_HEX[zoneStatuses.cerebro]} />
                <circle cx="194" cy="43" r="2.5" fill={STATUS_HEX[zoneStatuses.cerebro]} />
                <circle cx="180" cy="36" r="2.5" fill={STATUS_HEX[zoneStatuses.cerebro]} />
                <path d="M166 43 L180 36 L194 43" fill="none" stroke={STATUS_HEX[zoneStatuses.cerebro]} strokeWidth="1.3" />
              </g>

              {/* Interactive Leader Callouts */}
              <g className="cursor-pointer" onClick={() => onSelectZone("cerebro")}>
                <line x1="150" y1="38" x2="78" y2="38" stroke={STATUS_HEX[zoneStatuses.cerebro]} strokeWidth="1.2" />
                <rect
                  x="6"
                  y="24"
                  width="74"
                  height="24"
                  rx="6"
                  fill={selectedZone === "cerebro" ? "#0e2240" : "#091326"}
                  stroke={selectedZone === "cerebro" ? "#38bdf8" : STATUS_HEX[zoneStatuses.cerebro]}
                  strokeWidth={selectedZone === "cerebro" ? 1.8 : 1.1}
                />
                <text x="43" y="39" textAnchor="middle" fill="#e2e8f0" fontSize="10" fontWeight="600">
                  Brain
                </text>
              </g>

              <g className="cursor-pointer" onClick={() => onSelectZone("rostro")}>
                <line x1="210" y1="74" x2="278" y2="74" stroke={STATUS_HEX[zoneStatuses.rostro]} strokeWidth="1.2" />
                <rect
                  x="278"
                  y="60"
                  width="76"
                  height="24"
                  rx="6"
                  fill={selectedZone === "rostro" ? "#0e2240" : "#091326"}
                  stroke={selectedZone === "rostro" ? "#38bdf8" : STATUS_HEX[zoneStatuses.rostro]}
                  strokeWidth={selectedZone === "rostro" ? 1.8 : 1.1}
                />
                <text x="316" y="75" textAnchor="middle" fill="#e2e8f0" fontSize="10" fontWeight="600">
                  Face
                </text>
              </g>

              <g className="cursor-pointer" onClick={() => onSelectZone("endocrino")}>
                <line x1="146" y1="150" x2="78" y2="132" stroke={STATUS_HEX[zoneStatuses.endocrino]} strokeWidth="1.2" />
                <rect
                  x="4"
                  y="118"
                  width="76"
                  height="24"
                  rx="6"
                  fill={selectedZone === "endocrino" ? "#0e2240" : "#091326"}
                  stroke={selectedZone === "endocrino" ? "#38bdf8" : STATUS_HEX[zoneStatuses.endocrino]}
                  strokeWidth={selectedZone === "endocrino" ? 1.8 : 1.1}
                />
                <text x="42" y="133" textAnchor="middle" fill="#e2e8f0" fontSize="10" fontWeight="600">
                  Endocrine
                </text>
              </g>

              <g className="cursor-pointer" onClick={() => onSelectZone("corazon")}>
                <line x1="214" y1="168" x2="278" y2="160" stroke={STATUS_HEX[zoneStatuses.corazon]} strokeWidth="1.2" />
                <rect
                  x="278"
                  y="146"
                  width="76"
                  height="24"
                  rx="6"
                  fill={selectedZone === "corazon" ? "#0e2240" : "#091326"}
                  stroke={selectedZone === "corazon" ? "#38bdf8" : STATUS_HEX[zoneStatuses.corazon]}
                  strokeWidth={selectedZone === "corazon" ? 1.8 : 1.1}
                />
                <text x="316" y="161" textAnchor="middle" fill="#e2e8f0" fontSize="10" fontWeight="600">
                  Heart
                </text>
              </g>

              <g className="cursor-pointer" onClick={() => onSelectZone("abdomen")}>
                <line x1="140" y1="242" x2="78" y2="242" stroke={STATUS_HEX[zoneStatuses.abdomen]} strokeWidth="1.2" />
                <rect
                  x="4"
                  y="228"
                  width="76"
                  height="24"
                  rx="6"
                  fill={selectedZone === "abdomen" ? "#0e2240" : "#091326"}
                  stroke={selectedZone === "abdomen" ? "#38bdf8" : STATUS_HEX[zoneStatuses.abdomen]}
                  strokeWidth={selectedZone === "abdomen" ? 1.8 : 1.1}
                />
                <text x="42" y="243" textAnchor="middle" fill="#e2e8f0" fontSize="10" fontWeight="600">
                  Abdomen
                </text>
              </g>

              <g className="cursor-pointer" onClick={() => onSelectZone("musculo")}>
                <line x1="224" y1="362" x2="278" y2="362" stroke={STATUS_HEX[zoneStatuses.musculo]} strokeWidth="1.2" />
                <rect
                  x="274"
                  y="348"
                  width="82"
                  height="24"
                  rx="6"
                  fill={selectedZone === "musculo" ? "#0e2240" : "#091326"}
                  stroke={selectedZone === "musculo" ? "#38bdf8" : STATUS_HEX[zoneStatuses.musculo]}
                  strokeWidth={selectedZone === "musculo" ? 1.8 : 1.1}
                />
                <text x="315" y="363" textAnchor="middle" fill="#e2e8f0" fontSize="10" fontWeight="600">
                  Muscles
                </text>
              </g>
            </svg>
          </div>
        </div>

        {/* RIGHT: 5-Section Diagnostic Panel */}
        <div className="flex flex-col gap-3.5 xl:col-span-7">
          {/* Selected Zone Summary Banner */}
          <div className="rounded-xl border border-[#1b2d4b] bg-[#091120] p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border"
                  style={{
                    borderColor: `${activeHex}55`,
                    backgroundColor: `${activeHex}18`,
                    color: activeHex,
                  }}
                >
                  {ZONE_ICONS[selectedZone]}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-bold text-slate-100 sm:text-lg">
                      {guide.name}
                    </h3>
                    <StatusPill status={activeStatus} showNominal />
                  </div>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {guide.subtitle}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onOpenPocModal}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-[#1a73e8] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-600"
              >
                <ScanLine className="h-3.5 w-3.5" />
                PoC Log / Sim
              </button>
            </div>

            {/* Live Readings for this Zone */}
            <div className="mt-3 flex flex-wrap gap-2">
              {getZoneLiveValues(selectedZone, biomarkers).map((val) => (
                <span
                  key={val}
                  className="rounded-lg border border-[#162642] bg-[#0c1426] px-2.5 py-1 font-mono-hud text-xs font-medium text-slate-200"
                >
                  {val}
                </span>
              ))}
            </div>
          </div>

          {/* Clinical Tab Selector */}
          <div className="flex flex-wrap gap-2 border-b border-[#162642] pb-3">
            <button
              type="button"
              onClick={() => setDiagnosticTab("protocolo")}
              className={`inline-flex cursor-pointer items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-bold transition ${
                diagnosticTab === "protocolo"
                  ? "border-sky-400/60 bg-[#1a73e8] text-white"
                  : "border-[#1b2d4b] bg-[#091120] text-slate-300 hover:border-sky-500/40 hover:text-white"
              }`}
            >
              <ScanLine className="h-4 w-4" />
              Clinical Protocol
            </button>
            <button
              type="button"
              onClick={() => setDiagnosticTab("umbrales")}
              className={`inline-flex cursor-pointer items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-bold transition ${
                diagnosticTab === "umbrales"
                  ? "border-sky-400/60 bg-[#1a73e8] text-white"
                  : "border-[#1b2d4b] bg-[#091120] text-slate-300 hover:border-sky-500/40 hover:text-white"
              }`}
            >
              <AlertCircle className="h-4 w-4" />
              Thresholds & Triage
            </button>
          </div>

          {/* TAB 1: Step-by-step protocol + Immediate Countermeasure */}
          {diagnosticTab === "protocolo" && (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="rounded-xl border border-[#1b2d4b] bg-[#091120] p-4">
                <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sky-400">
                  <ScanLine className="h-4 w-4" />
                  Clinical Assessment Procedure
                </h4>
                <ol className="mt-3 space-y-2.5 text-xs leading-relaxed text-slate-200 sm:text-sm">
                  {guide.howToPerform.map((step, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2.5 rounded-lg border border-[#162642] bg-[#0c1426] p-2.5"
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-sky-500/10 font-mono-hud text-xs font-bold text-sky-300">
                        0{idx + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              <div
                className={`flex flex-col justify-between rounded-xl border p-4 ${
                  activeStatus === "critical"
                    ? "border-red-500/45 bg-[#200c11]"
                    : activeStatus === "warning"
                    ? "border-amber-500/40 bg-[#1c1508]"
                    : "border-emerald-500/25 bg-[#091826]"
                }`}
              >
                <div>
                  <h4
                    className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider ${
                      activeStatus === "critical"
                        ? "text-red-300"
                        : activeStatus === "warning"
                        ? "text-amber-300"
                        : "text-emerald-400"
                    }`}
                  >
                    {activeStatus === "critical" || activeStatus === "warning" ? (
                      <AlertTriangle className="h-4 w-4 shrink-0" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                    )}
                    {activeStatus === "critical"
                      ? "Critical Emergency Countermeasures · Immediate Vital-Specific Action"
                      : activeStatus === "warning"
                      ? "Caution Intervention · Adapted to Active Vital Signs"
                      : "Nominal Preventive Countermeasures"}
                  </h4>
                  <ul className="mt-3 space-y-2.5 text-xs leading-relaxed text-slate-200 sm:text-sm">
                    {zoneRecs.map((item) => (
                      <li
                        key={item.id}
                        className={`rounded-lg border p-3 ${
                          item.status === "critical"
                            ? "border-red-500/45 bg-[#0c1426]"
                            : item.status === "warning"
                            ? "border-amber-500/40 bg-[#0c1426]"
                            : "border-[#162642] bg-[#0c1426]"
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-slate-100">
                              {item.vitalName}
                            </span>
                            <span className="rounded border border-[#1b2d4b] bg-[#070c17] px-1.5 py-0.5 font-mono-hud text-[11px] font-semibold text-sky-300">
                              {item.currentReading}
                            </span>
                          </div>
                          <StatusPill status={item.status} showNominal />
                        </div>
                        <div
                          className={`mt-1 font-mono-hud text-[11px] font-bold ${
                            item.status === "critical"
                              ? "text-red-300"
                              : item.status === "warning"
                              ? "text-amber-300"
                              : "text-emerald-300"
                          }`}
                        >
                          {item.problemLabel}
                        </div>
                        <p className="mt-1 text-xs leading-relaxed text-slate-300">
                          {item.recommendation}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Clinical Thresholds & Flight Surgeon Escalation */}
          {diagnosticTab === "umbrales" && (
            <div className="space-y-4 rounded-xl border border-[#1b2d4b] bg-[#091120] p-4">
              <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-300">
                <AlertCircle className="h-4 w-4" />
                Clinical Triage Criteria & Flight Surgeon Alert
              </h4>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="rounded-xl border border-emerald-500/30 bg-[#091d1a] p-3.5 text-xs sm:text-sm">
                  <div className="font-mono-hud text-xs font-bold uppercase text-emerald-300">
                    ● Nominal Level
                  </div>
                  <p className="mt-1.5 leading-relaxed text-emerald-100">
                    {guide.attentionThreshold.optimal}
                  </p>
                </div>

                <div className="rounded-xl border border-amber-500/35 bg-[#21190c] p-3.5 text-xs sm:text-sm">
                  <div className="font-mono-hud text-xs font-bold uppercase text-amber-300">
                    ▲ Caution Level
                  </div>
                  <p className="mt-1.5 leading-relaxed text-amber-100">
                    {guide.attentionThreshold.warning}
                  </p>
                </div>

                <div className="rounded-xl border border-red-500/40 bg-[#231015] p-3.5 text-xs sm:text-sm">
                  <div className="font-mono-hud text-xs font-bold uppercase text-red-300">
                    ■ Critical Level
                  </div>
                  <p className="mt-1.5 leading-relaxed text-red-100">
                    {guide.attentionThreshold.critical}
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-[#1b2d4b] bg-[#0c1426] p-3.5 text-xs leading-relaxed text-slate-300 sm:text-sm">
                <strong className="text-sky-300">
                  Ground Support Protocol (Houston / CSA):
                </strong>{" "}
                {guide.attentionThreshold.flightSurgeonNote}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
