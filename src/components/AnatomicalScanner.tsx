"use client";

import React, { useState } from "react";
import {
  Activity,
  AlertCircle,
  Brain,
  CheckCircle2,
  Dumbbell,
  Eye,
  HeartPulse,
  Info,
  ScanLine,
  ShieldAlert,
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
import { STATUS_HEX, STATUS_LABELS } from "@/utils/healthEngine";

interface AnatomicalScannerProps {
  selectedZone: SystemZoneId;
  onSelectZone: (zone: SystemZoneId) => void;
  zoneStatuses: Record<SystemZoneId, HealthStatus>;
  biomarkers: BiomarkerData;
  environmentId: MissionEnvironmentId;
  onOpenScanTab: (tab: "camara" | "manual") => void;
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
        `Fatiga mental: ${b.mentalFatigue}/100`,
        `Estrés: ${b.stressLevel}/100`,
        `Soledad: ${b.lonelinessLevel}/100`,
        `Aburrimiento: ${b.boredomLevel}/100`,
        `Sueño: ${b.sleepHours.toFixed(1)} h`,
        `Ánimo: ${b.moodScore}/100`,
      ];
    case "rostro":
      return [
        `Postura corporal: ${b.postureScore}/100`,
        `Tensión facial/ocular: ${b.facialTension}/100`,
      ];
    case "corazon":
      return [
        `Pulso: ${b.bpm} BPM`,
        `Presión Arterial: ${b.systolicBP}/${b.diastolicBP} mmHg`,
      ];
    case "endocrino":
      return [
        `Cortisol (estrés): ${b.cortisolIndex}/100`,
        `Melatonina (sueño): ${b.melatoninIndex}/100`,
        `Radiación CSA: ${b.dailyRadiationMsv.toFixed(2)} mSv/d`,
      ];
    case "abdomen":
      return [
        `Azúcar en sangre: ${b.bloodGlucoseMgDl} mg/dL`,
        `Hidratación: ${b.hydrationPercent}%`,
        `Temperatura: ${b.bodyTempC.toFixed(1)} °C`,
      ];
    case "musculo":
      return [
        `Cansancio físico: ${b.physicalFatigue}/100`,
        `Densidad ósea: ${b.boneDensityIndex}%`,
      ];
  }
}

export default function AnatomicalScanner({
  selectedZone,
  onSelectZone,
  zoneStatuses,
  biomarkers,
  environmentId,
  onOpenScanTab,
}: AnatomicalScannerProps) {
  const guide = SYSTEM_DIAGNOSTIC_GUIDES[selectedZone];
  const activeStatus = zoneStatuses[selectedZone];
  const activeHex = STATUS_HEX[activeStatus];
  const [diagnosticTab, setDiagnosticTab] = useState<
    "protocolo" | "umbrales" | "ciencia"
  >("protocolo");

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

  const recommendedScanTab: "camara" | "manual" =
    selectedZone === "rostro" || selectedZone === "cerebro"
      ? "camara"
      : "manual";

  return (
    <section
      id="scanner-section"
      className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-[0_6px_24px_rgba(15,23,42,0.04)] sm:p-5"
    >
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-[#1a73e8]" />
            <h2 className="text-base font-bold text-slate-900 sm:text-lg">
              Módulo 1 · Escáner Anatómico y Psicológico Interactivo
            </h2>
          </div>
          <p className="mt-0.5 text-xs text-slate-500">
            Haz clic en cualquiera de los 6 sistemas de la silueta humana para ver su autoevaluación guiada sin jerga médica.
          </p>
        </div>

        {/* Status Legend */}
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium">
          <span className="flex items-center gap-1.5 text-emerald-700">
            <span className="h-2.5 w-2.5 rounded-full bg-[#10b981]" />
            Óptimo
          </span>
          <span className="flex items-center gap-1.5 text-amber-700">
            <span className="h-2.5 w-2.5 rounded-full bg-[#f59e0b]" />
            Precaución
          </span>
          <span className="flex items-center gap-1.5 text-red-700">
            <span className="h-2.5 w-2.5 rounded-full bg-[#ef4444]" />
            Crítico
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
                      ? "border-[#1a73e8] bg-blue-50 text-blue-950 font-semibold shadow-sm"
                      : "border-slate-200 bg-slate-50/70 text-slate-600 hover:border-slate-300 hover:bg-white"
                  }`}
                >
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
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
            <div className="pointer-events-none absolute inset-x-4 top-2 h-1 rounded-full bg-gradient-to-r from-transparent via-blue-500/45 to-transparent animate-scanline" />

            {/* HUD Corner Data */}
            <div className="pointer-events-none absolute left-3 top-3 font-mono-hud text-[10px] font-semibold text-[#1a73e8]">
              <div>SCANNER: BIO-HUD v4.2</div>
              <div>ENTORNO: {environmentId.toUpperCase()}</div>
            </div>
            <div className="pointer-events-none absolute right-3 top-3 text-right font-mono-hud text-[10px] text-slate-400">
              <div>6 SISTEMAS</div>
              <div>CLIC PARA INSPECCIÓN</div>
            </div>

            <svg
              viewBox="0 0 360 490"
              className="h-[410px] w-full max-w-[350px] select-none sm:h-[455px]"
              role="img"
              aria-label="Silueta anatómica y psicológica interactiva del astronauta"
            >
              <defs>
                <radialGradient id="hudGlowLight" cx="50%" cy="45%" r="55%">
                  <stop offset="0%" stopColor="#1a73e8" stopOpacity="0.1" />
                  <stop offset="100%" stopColor="#f8fafc" stopOpacity="0" />
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
                stroke="#cbd5e1"
                strokeDasharray="4 6"
                strokeWidth="1"
              />
              <circle
                cx="180"
                cy="240"
                r="112"
                fill="none"
                stroke="#cbd5e1"
                strokeDasharray="2 5"
                strokeWidth="1"
              />
              <line
                x1="180"
                y1="15"
                x2="180"
                y2="475"
                stroke="#cbd5e1"
                strokeWidth="1"
                strokeDasharray="3 4"
              />

              {/* Base Human Silhouette Outline */}
              <g
                fill="#ffffff"
                fillOpacity="0.92"
                stroke="#94a3b8"
                strokeWidth="1.6"
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
                  fill={selectedZone === "cerebro" ? "#eff6ff" : "#ffffff"}
                  stroke={STATUS_HEX[zoneStatuses.cerebro]}
                  strokeWidth={selectedZone === "cerebro" ? 2 : 1.2}
                />
                <text x="43" y="39" textAnchor="middle" fill="#0f172a" fontSize="10" fontWeight="600">
                  1. Cerebro
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
                  fill={selectedZone === "rostro" ? "#eff6ff" : "#ffffff"}
                  stroke={STATUS_HEX[zoneStatuses.rostro]}
                  strokeWidth={selectedZone === "rostro" ? 2 : 1.2}
                />
                <text x="316" y="75" textAnchor="middle" fill="#0f172a" fontSize="10" fontWeight="600">
                  2. Rostro
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
                  fill={selectedZone === "endocrino" ? "#eff6ff" : "#ffffff"}
                  stroke={STATUS_HEX[zoneStatuses.endocrino]}
                  strokeWidth={selectedZone === "endocrino" ? 2 : 1.2}
                />
                <text x="42" y="133" textAnchor="middle" fill="#0f172a" fontSize="10" fontWeight="600">
                  4. Endocrino
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
                  fill={selectedZone === "corazon" ? "#eff6ff" : "#ffffff"}
                  stroke={STATUS_HEX[zoneStatuses.corazon]}
                  strokeWidth={selectedZone === "corazon" ? 2 : 1.2}
                />
                <text x="316" y="161" textAnchor="middle" fill="#0f172a" fontSize="10" fontWeight="600">
                  3. Corazón
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
                  fill={selectedZone === "abdomen" ? "#eff6ff" : "#ffffff"}
                  stroke={STATUS_HEX[zoneStatuses.abdomen]}
                  strokeWidth={selectedZone === "abdomen" ? 2 : 1.2}
                />
                <text x="42" y="243" textAnchor="middle" fill="#0f172a" fontSize="10" fontWeight="600">
                  5. Abdomen
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
                  fill={selectedZone === "musculo" ? "#eff6ff" : "#ffffff"}
                  stroke={STATUS_HEX[zoneStatuses.musculo]}
                  strokeWidth={selectedZone === "musculo" ? 2 : 1.2}
                />
                <text x="315" y="363" textAnchor="middle" fill="#0f172a" fontSize="10" fontWeight="600">
                  6. Músculos
                </text>
              </g>
            </svg>
          </div>
        </div>

        {/* RIGHT: 5-Section Non-Jargon Diagnostic Panel */}
        <div className="flex flex-col gap-3.5 xl:col-span-7">
          {/* Selected Zone Summary Banner */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/75 p-4">
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
                    <h3 className="text-base font-bold text-slate-900 sm:text-lg">
                      {guide.name}
                    </h3>
                    <span
                      className="rounded-full px-2.5 py-0.5 font-mono-hud text-xs font-bold uppercase"
                      style={{
                        backgroundColor: `${activeHex}18`,
                        color: activeHex,
                        border: `1px solid ${activeHex}44`,
                      }}
                    >
                      Estado: {STATUS_LABELS[activeStatus]}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {guide.subtitle}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onOpenScanTab(recommendedScanTab)}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-[#1a73e8] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700"
              >
                <ScanLine className="h-3.5 w-3.5" />
                Evaluar ahora
              </button>
            </div>

            {/* Live Readings for this Zone */}
            <div className="mt-3 flex flex-wrap gap-2">
              {getZoneLiveValues(selectedZone, biomarkers).map((val) => (
                <span
                  key={val}
                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 font-mono-hud text-xs font-medium text-slate-700"
                >
                  {val}
                </span>
              ))}
            </div>
          </div>

          {/* Selector de Pestañas Clínicas (Progresive Disclosure sin ruido visual) */}
          <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
            <button
              type="button"
              onClick={() => setDiagnosticTab("protocolo")}
              className={`inline-flex cursor-pointer items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-bold transition ${
                diagnosticTab === "protocolo"
                  ? "border-[#1a73e8] bg-[#1a73e8] text-white shadow-xs"
                  : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-white"
              }`}
            >
              <ScanLine className="h-4 w-4" />
              1. Protocolo de Examen y Acción
            </button>
            <button
              type="button"
              onClick={() => setDiagnosticTab("umbrales")}
              className={`inline-flex cursor-pointer items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-bold transition ${
                diagnosticTab === "umbrales"
                  ? "border-[#1a73e8] bg-[#1a73e8] text-white shadow-xs"
                  : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-white"
              }`}
            >
              <AlertCircle className="h-4 w-4" />
              2. Umbrales de Alerta y Triage
            </button>
            <button
              type="button"
              onClick={() => setDiagnosticTab("ciencia")}
              className={`inline-flex cursor-pointer items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-bold transition ${
                diagnosticTab === "ciencia"
                  ? "border-[#1a73e8] bg-[#1a73e8] text-white shadow-xs"
                  : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-white"
              }`}
            >
              <ShieldAlert className="h-4 w-4" />
              3. Motivo Clínico y 5 Peligros NASA
            </button>
          </div>

          {/* PESTAÑA 1: Protocolo paso a paso + Contramedida inmediata */}
          {diagnosticTab === "protocolo" && (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#1a73e8]">
                  <ScanLine className="h-4 w-4" />
                  Cómo realizar el examen (Sin ser médico)
                </h4>
                <ol className="mt-3 space-y-2.5 text-xs leading-relaxed text-slate-700 sm:text-sm">
                  {guide.howToPerform.map((step, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2.5 rounded-lg border border-slate-200/80 bg-white p-2.5"
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-blue-50 font-mono-hud text-xs font-bold text-[#1a73e8]">
                        0{idx + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="flex flex-col justify-between rounded-xl border border-emerald-200 bg-emerald-50/45 p-4">
                <div>
                  <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-800">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    Contramedida Preventiva (Acción Inmediata)
                  </h4>
                  <ul className="mt-3 space-y-2.5 text-xs leading-relaxed text-slate-700 sm:text-sm">
                    {guide.preventiveCountermeasures.map((item, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2.5 rounded-lg border border-emerald-200/80 bg-white/90 p-3"
                      >
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-3 rounded-lg border border-blue-200/70 bg-white/80 p-3 text-xs text-slate-600">
                  <strong className="text-slate-900">
                    ¿Por qué evaluarlo hoy?
                  </strong>{" "}
                  {guide.whyNecessary}
                </div>
              </div>
            </div>
          )}

          {/* PESTAÑA 2: Umbrales de Atención y Escalamiento con Cirujanos de Vuelo */}
          {diagnosticTab === "umbrales" && (
            <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
              <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-700">
                <AlertCircle className="h-4 w-4" />
                Criterios Clínicos de Triage y Alerta a Cirujanos de Vuelo
              </h4>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/90 p-3.5 text-xs sm:text-sm">
                  <div className="font-mono-hud text-xs font-bold uppercase text-emerald-800">
                    ● Nivel Óptimo (Verde)
                  </div>
                  <p className="mt-1.5 leading-relaxed text-emerald-950">
                    {guide.attentionThreshold.optimal}
                  </p>
                </div>

                <div className="rounded-xl border border-amber-300 bg-amber-50/90 p-3.5 text-xs sm:text-sm">
                  <div className="font-mono-hud text-xs font-bold uppercase text-amber-800">
                    ▲ Nivel Precaución (Amarillo)
                  </div>
                  <p className="mt-1.5 leading-relaxed text-amber-950">
                    {guide.attentionThreshold.warning}
                  </p>
                </div>

                <div className="rounded-xl border border-red-300 bg-red-50/90 p-3.5 text-xs sm:text-sm">
                  <div className="font-mono-hud text-xs font-bold uppercase text-red-800">
                    ■ Nivel Crítico (Rojo)
                  </div>
                  <p className="mt-1.5 leading-relaxed text-red-950">
                    {guide.attentionThreshold.critical}
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-blue-200 bg-white p-3.5 text-xs leading-relaxed text-slate-700 sm:text-sm">
                <strong className="text-[#0b2559]">
                  Protocolo de Contacto con Tierra (Houston / CSA):
                </strong>{" "}
                {guide.attentionThreshold.flightSurgeonNote}
              </div>
            </div>
          )}

          {/* PESTAÑA 3: Motivo Clínico y 5 Peligros Espaciales NASA HRP */}
          {diagnosticTab === "ciencia" && (
            <div className="space-y-4">
              <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-4">
                <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-800">
                  <Info className="h-4 w-4" />
                  Fundamento Fisiológico en Vuelo Espacial
                </h4>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-700 sm:text-sm">
                  {guide.whyNecessary}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-800">
                  <ShieldAlert className="h-4 w-4" />
                  Impacto de los 5 Peligros Espaciales (NASA HRP) en este Sistema
                </h4>
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="rounded-xl border border-slate-200 bg-white p-3">
                    <div className="text-xs font-bold text-rose-600">
                      1. Radiación Espacial
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-slate-600">
                      {guide.fiveHazardsImpact.radiation}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-3">
                    <div className="text-xs font-bold text-violet-600">
                      2. Aislamiento y Confinamiento
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-slate-600">
                      {guide.fiveHazardsImpact.isolation}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-3">
                    <div className="text-xs font-bold text-blue-600">
                      3. Distancia de la Tierra
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-slate-600">
                      {guide.fiveHazardsImpact.distance}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-3">
                    <div className="text-xs font-bold text-amber-600">
                      4. Campos de Gravedad Alterados
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-slate-600">
                      {guide.fiveHazardsImpact.gravity}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-3 sm:col-span-2 lg:col-span-1">
                    <div className="text-xs font-bold text-teal-600">
                      5. Ambientes Cerrados Hostiles
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-slate-600">
                      {guide.fiveHazardsImpact.closedEnvironment}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
