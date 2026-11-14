"use client";

import React from "react";
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
  onOpenScanTab: (tab: "camara" | "ultrasonido" | "manual") => void;
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

  const getZoneFill = (zone: SystemZoneId, baseOpacity = 0.25) => {
    const color = STATUS_HEX[zoneStatuses[zone]];
    const isSel = selectedZone === zone;
    return {
      stroke: color,
      fill: color,
      fillOpacity: isSel ? baseOpacity + 0.2 : baseOpacity,
      strokeWidth: isSel ? 2.4 : 1.5,
    };
  };

  const recommendedScanTab: "camara" | "ultrasonido" | "manual" =
    selectedZone === "rostro" || selectedZone === "cerebro"
      ? "camara"
      : selectedZone === "musculo" ||
        selectedZone === "abdomen" ||
        selectedZone === "corazon"
      ? "ultrasonido"
      : "manual";

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 shadow-xl sm:p-5">
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-cyan-400" />
            <h2 className="text-base font-bold text-slate-100 sm:text-lg">
              Módulo 1 · Escáner Anatómico y Psicológico Interactivo
            </h2>
          </div>
          <p className="mt-0.5 text-xs text-slate-400">
            Haz clic en cualquiera de los 6 sistemas de la silueta humana para ver su autoevaluación guiada sin jerga médica.
          </p>
        </div>

        {/* Status Legend */}
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/70 px-3 py-1.5 text-xs">
          <span className="flex items-center gap-1.5 text-emerald-300">
            <span className="h-2.5 w-2.5 rounded-full bg-[#10b981]" />
            Óptimo
          </span>
          <span className="flex items-center gap-1.5 text-amber-300">
            <span className="h-2.5 w-2.5 rounded-full bg-[#f59e0b]" />
            Precaución
          </span>
          <span className="flex items-center gap-1.5 text-red-300">
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
                  className={`flex cursor-pointer items-center gap-2 rounded-lg border px-2.5 py-2 text-left text-xs transition ${
                    isSelected
                      ? "border-cyan-400/70 bg-cyan-500/15 text-white shadow-sm"
                      : "border-slate-800 bg-slate-950/70 text-slate-300 hover:border-slate-700"
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

          {/* Interactive SVG Container */}
          <div className="relative flex flex-1 items-center justify-center overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/95 p-3">
            {/* Scan beam micro-animation */}
            <div className="pointer-events-none absolute inset-x-4 top-2 h-1 rounded-full bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent animate-scanline" />

            {/* HUD Corner Data */}
            <div className="pointer-events-none absolute left-3 top-3 font-mono-hud text-[10px] text-cyan-400/70">
              <div>SCANNER: BIO-HUD v4.2</div>
              <div>ENTORNO: {environmentId.toUpperCase()}</div>
            </div>
            <div className="pointer-events-none absolute right-3 top-3 text-right font-mono-hud text-[10px] text-slate-500">
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
                <radialGradient id="hudGlow" cx="50%" cy="45%" r="55%">
                  <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.14" />
                  <stop offset="100%" stopColor="#020617" stopOpacity="0" />
                </radialGradient>
                <filter id="zoneGlow" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="3.5" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Background Holographic Grid Rings */}
              <rect x="0" y="0" width="360" height="490" fill="url(#hudGlow)" />
              <circle
                cx="180"
                cy="240"
                r="160"
                fill="none"
                stroke="#1e293b"
                strokeDasharray="4 6"
                strokeWidth="1"
              />
              <circle
                cx="180"
                cy="240"
                r="112"
                fill="none"
                stroke="#1e293b"
                strokeDasharray="2 5"
                strokeWidth="1"
              />
              <line
                x1="180"
                y1="15"
                x2="180"
                y2="475"
                stroke="#1e293b"
                strokeWidth="1"
                strokeDasharray="3 4"
              />

              {/* Base Human Silhouette Outline */}
              <g
                fill="#0f172a"
                fillOpacity="0.85"
                stroke="#475569"
                strokeWidth="1.4"
                strokeLinejoin="round"
              >
                {/* Head & Neck */}
                <path d="M180 24 C157 24 143 41 143 65 C143 85 154 103 166 108 L166 122 L194 122 L194 108 C206 103 217 85 217 65 C217 41 203 24 180 24 Z" />
                {/* Torso & Arms */}
                <path d="M166 122 L120 132 C106 136 98 148 94 166 L76 244 C73 255 82 263 91 256 L112 184 L124 176 L124 278 L236 278 L236 176 L248 184 L269 256 C278 263 287 255 284 244 L266 166 C262 148 254 136 240 132 L194 122 Z" />
                {/* Pelvis & Legs */}
                <path d="M124 278 L120 315 L127 458 C128 468 148 469 151 458 L166 336 L180 326 L194 336 L209 458 C212 469 232 468 233 458 L240 315 L236 278 Z" />
              </g>

              {/* 6. SISTEMA MUSCULOESQUELÉTICO (Arms, Spine, Pelvis & Legs) */}
              <g
                className="cursor-pointer transition-opacity hover:opacity-100"
                onClick={() => onSelectZone("musculo")}
                filter={selectedZone === "musculo" ? "url(#zoneGlow)" : undefined}
              >
                {/* Left & Right Leg Femur/Tibia + Muscular Contours */}
                <path
                  d="M135 295 L143 375 L140 448 M225 295 L217 375 L220 448"
                  fill="none"
                  stroke={STATUS_HEX[zoneStatuses.musculo]}
                  strokeWidth={selectedZone === "musculo" ? 7 : 5}
                  strokeLinecap="round"
                  strokeOpacity="0.4"
                />
                <path
                  d="M135 295 L143 375 L140 448 M225 295 L217 375 L220 448"
                  fill="none"
                  stroke={STATUS_HEX[zoneStatuses.musculo]}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeDasharray="6 4"
                />
                {/* Arms Muscle/Bone Paths */}
                <path
                  d="M112 145 L95 200 L84 245 M248 145 L265 200 L276 245"
                  fill="none"
                  stroke={STATUS_HEX[zoneStatuses.musculo]}
                  strokeWidth={selectedZone === "musculo" ? 5 : 3.5}
                  strokeLinecap="round"
                  strokeOpacity="0.65"
                />
                {/* Pelvis & Knee Joints */}
                <circle
                  cx="143"
                  cy="375"
                  r="7"
                  {...getZoneFill("musculo", 0.25)}
                />
                <circle
                  cx="217"
                  cy="375"
                  r="7"
                  {...getZoneFill("musculo", 0.25)}
                />
                {/* Transparent easy click hitboxes for legs & arms */}
                <rect
                  x="118"
                  y="288"
                  width="46"
                  height="175"
                  rx="16"
                  fill="transparent"
                />
                <rect
                  x="196"
                  y="288"
                  width="46"
                  height="175"
                  rx="16"
                  fill="transparent"
                />
                <rect
                  x="70"
                  y="140"
                  width="45"
                  height="125"
                  rx="16"
                  fill="transparent"
                />
                <rect
                  x="245"
                  y="140"
                  width="45"
                  height="125"
                  rx="16"
                  fill="transparent"
                />
              </g>

              {/* 5. ABDOMEN / METABOLISMO (Glucose, Hydration, Nutrition) */}
              <g
                className="cursor-pointer"
                onClick={() => onSelectZone("abdomen")}
                filter={selectedZone === "abdomen" ? "url(#zoneGlow)" : undefined}
              >
                <rect
                  x="140"
                  y="214"
                  width="80"
                  height="58"
                  rx="16"
                  {...getZoneFill("abdomen", 0.22)}
                />
                {/* Metabolic grid lines */}
                <path
                  d="M153 232 C164 224 196 224 205 236 C210 245 198 260 180 260 C162 260 150 245 153 232 Z"
                  fill="none"
                  stroke={STATUS_HEX[zoneStatuses.abdomen]}
                  strokeWidth="1.5"
                />
                <circle
                  cx="180"
                  cy="243"
                  r="4"
                  fill={STATUS_HEX[zoneStatuses.abdomen]}
                />
              </g>

              {/* 4. SISTEMA ENDOCRINO / INMUNOLÓGICO (Thyroid, Thymus, Adrenals/Lymph) */}
              <g
                className="cursor-pointer"
                onClick={() => onSelectZone("endocrino")}
                filter={selectedZone === "endocrino" ? "url(#zoneGlow)" : undefined}
              >
                {/* Thyroid / Cervical Endocrine Butterfly */}
                <path
                  d="M168 117 Q180 124 192 117 Q195 127 180 129 Q165 127 168 117 Z"
                  {...getZoneFill("endocrino", 0.35)}
                />
                {/* Thymus / Immune Nodes */}
                <circle
                  cx="154"
                  cy="154"
                  r="10"
                  {...getZoneFill("endocrino", 0.28)}
                />
                <circle
                  cx="148"
                  cy="202"
                  r="8"
                  {...getZoneFill("endocrino", 0.25)}
                />
                <circle
                  cx="212"
                  cy="202"
                  r="8"
                  {...getZoneFill("endocrino", 0.25)}
                />
                {/* Connecting Hormonal/Immune Pathways */}
                <path
                  d="M180 128 L154 154 L148 202 M180 128 L212 202"
                  fill="none"
                  stroke={STATUS_HEX[zoneStatuses.endocrino]}
                  strokeWidth="1.4"
                  strokeDasharray="3 3"
                />
                {/* Hitbox */}
                <rect
                  x="136"
                  y="112"
                  width="88"
                  height="98"
                  rx="14"
                  fill="transparent"
                />
              </g>

              {/* 3. CORAZÓN / TÓRAX (Cardiovascular) */}
              <g
                className="cursor-pointer"
                onClick={() => onSelectZone("corazon")}
                filter={selectedZone === "corazon" ? "url(#zoneGlow)" : undefined}
              >
                {/* Thoracic Ribcage Frame */}
                <ellipse
                  cx="180"
                  cy="170"
                  rx="44"
                  ry="34"
                  fill="none"
                  stroke={STATUS_HEX[zoneStatuses.corazon]}
                  strokeOpacity="0.45"
                  strokeWidth="1.3"
                  strokeDasharray="4 3"
                />
                {/* Heart Shape (shifted anatomical left -> right side of viewer) */}
                <path
                  d="M190 156 C183 149 173 155 176 165 C178 173 190 183 192 184 C194 183 206 173 208 165 C211 155 201 149 194 156 L192 159 Z"
                  {...getZoneFill("corazon", 0.42)}
                />
                {/* ECG Mini Trace */}
                <polyline
                  points="150,174 166,174 171,164 176,184 182,160 187,174 212,174"
                  fill="none"
                  stroke={STATUS_HEX[zoneStatuses.corazon]}
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </g>

              {/* 2. ROSTRO / POSTURA (Facial Expressions & Body Language) */}
              <g
                className="cursor-pointer"
                onClick={() => onSelectZone("rostro")}
                filter={selectedZone === "rostro" ? "url(#zoneGlow)" : undefined}
              >
                {/* Face Mask & Jaw Biometric Mesh */}
                <path
                  d="M152 62 L208 62 L203 93 L180 104 L157 93 Z"
                  {...getZoneFill("rostro", 0.25)}
                />
                {/* Eyes / Ocular Tension Landmarks */}
                <line
                  x1="160"
                  y1="72"
                  x2="173"
                  y2="72"
                  stroke={STATUS_HEX[zoneStatuses.rostro]}
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
                <line
                  x1="187"
                  y1="72"
                  x2="200"
                  y2="72"
                  stroke={STATUS_HEX[zoneStatuses.rostro]}
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
                {/* Shoulder Posture Line */}
                <path
                  d="M118 134 Q180 124 242 134"
                  fill="none"
                  stroke={STATUS_HEX[zoneStatuses.rostro]}
                  strokeWidth="2"
                  strokeDasharray="4 3"
                />
              </g>

              {/* 1. CEREBRO / MENTE (Cognition, Stress, Mood, Sleep) */}
              <g
                className="cursor-pointer"
                onClick={() => onSelectZone("cerebro")}
                filter={selectedZone === "cerebro" ? "url(#zoneGlow)" : undefined}
              >
                <path
                  d="M148 56 C148 33 163 26 180 26 C197 26 212 33 212 56 C203 59 189 58 180 56 C171 58 157 59 148 56 Z"
                  {...getZoneFill("cerebro", 0.38)}
                />
                {/* Neural synapsis nodes */}
                <circle
                  cx="166"
                  cy="43"
                  r="2.5"
                  fill={STATUS_HEX[zoneStatuses.cerebro]}
                />
                <circle
                  cx="194"
                  cy="43"
                  r="2.5"
                  fill={STATUS_HEX[zoneStatuses.cerebro]}
                />
                <circle
                  cx="180"
                  cy="36"
                  r="2.5"
                  fill={STATUS_HEX[zoneStatuses.cerebro]}
                />
                <path
                  d="M166 43 L180 36 L194 43"
                  fill="none"
                  stroke={STATUS_HEX[zoneStatuses.cerebro]}
                  strokeWidth="1.2"
                />
              </g>

              {/* Interactive Leader Callouts (Left & Right) */}
              {/* Cerebro */}
              <g
                className="cursor-pointer"
                onClick={() => onSelectZone("cerebro")}
              >
                <line
                  x1="150"
                  y1="38"
                  x2="78"
                  y2="38"
                  stroke={STATUS_HEX[zoneStatuses.cerebro]}
                  strokeWidth="1.2"
                />
                <rect
                  x="6"
                  y="24"
                  width="74"
                  height="24"
                  rx="6"
                  fill={selectedZone === "cerebro" ? "#083344" : "#0f172a"}
                  stroke={STATUS_HEX[zoneStatuses.cerebro]}
                  strokeWidth={selectedZone === "cerebro" ? 1.8 : 1}
                />
                <text
                  x="43"
                  y="39"
                  textAnchor="middle"
                  fill="#e2e8f0"
                  fontSize="10"
                  fontWeight="600"
                >
                  1. Cerebro
                </text>
              </g>

              {/* Rostro */}
              <g
                className="cursor-pointer"
                onClick={() => onSelectZone("rostro")}
              >
                <line
                  x1="210"
                  y1="74"
                  x2="278"
                  y2="74"
                  stroke={STATUS_HEX[zoneStatuses.rostro]}
                  strokeWidth="1.2"
                />
                <rect
                  x="278"
                  y="60"
                  width="76"
                  height="24"
                  rx="6"
                  fill={selectedZone === "rostro" ? "#083344" : "#0f172a"}
                  stroke={STATUS_HEX[zoneStatuses.rostro]}
                  strokeWidth={selectedZone === "rostro" ? 1.8 : 1}
                />
                <text
                  x="316"
                  y="75"
                  textAnchor="middle"
                  fill="#e2e8f0"
                  fontSize="10"
                  fontWeight="600"
                >
                  2. Rostro
                </text>
              </g>

              {/* Endocrino */}
              <g
                className="cursor-pointer"
                onClick={() => onSelectZone("endocrino")}
              >
                <line
                  x1="146"
                  y1="150"
                  x2="78"
                  y2="132"
                  stroke={STATUS_HEX[zoneStatuses.endocrino]}
                  strokeWidth="1.2"
                />
                <rect
                  x="4"
                  y="118"
                  width="76"
                  height="24"
                  rx="6"
                  fill={selectedZone === "endocrino" ? "#083344" : "#0f172a"}
                  stroke={STATUS_HEX[zoneStatuses.endocrino]}
                  strokeWidth={selectedZone === "endocrino" ? 1.8 : 1}
                />
                <text
                  x="42"
                  y="133"
                  textAnchor="middle"
                  fill="#e2e8f0"
                  fontSize="10"
                  fontWeight="600"
                >
                  4. Endocrino
                </text>
              </g>

              {/* Corazon */}
              <g
                className="cursor-pointer"
                onClick={() => onSelectZone("corazon")}
              >
                <line
                  x1="214"
                  y1="168"
                  x2="278"
                  y2="160"
                  stroke={STATUS_HEX[zoneStatuses.corazon]}
                  strokeWidth="1.2"
                />
                <rect
                  x="278"
                  y="146"
                  width="76"
                  height="24"
                  rx="6"
                  fill={selectedZone === "corazon" ? "#083344" : "#0f172a"}
                  stroke={STATUS_HEX[zoneStatuses.corazon]}
                  strokeWidth={selectedZone === "corazon" ? 1.8 : 1}
                />
                <text
                  x="316"
                  y="161"
                  textAnchor="middle"
                  fill="#e2e8f0"
                  fontSize="10"
                  fontWeight="600"
                >
                  3. Corazón
                </text>
              </g>

              {/* Abdomen */}
              <g
                className="cursor-pointer"
                onClick={() => onSelectZone("abdomen")}
              >
                <line
                  x1="140"
                  y1="242"
                  x2="78"
                  y2="242"
                  stroke={STATUS_HEX[zoneStatuses.abdomen]}
                  strokeWidth="1.2"
                />
                <rect
                  x="4"
                  y="228"
                  width="76"
                  height="24"
                  rx="6"
                  fill={selectedZone === "abdomen" ? "#083344" : "#0f172a"}
                  stroke={STATUS_HEX[zoneStatuses.abdomen]}
                  strokeWidth={selectedZone === "abdomen" ? 1.8 : 1}
                />
                <text
                  x="42"
                  y="243"
                  textAnchor="middle"
                  fill="#e2e8f0"
                  fontSize="10"
                  fontWeight="600"
                >
                  5. Abdomen
                </text>
              </g>

              {/* Musculo */}
              <g
                className="cursor-pointer"
                onClick={() => onSelectZone("musculo")}
              >
                <line
                  x1="224"
                  y1="362"
                  x2="278"
                  y2="362"
                  stroke={STATUS_HEX[zoneStatuses.musculo]}
                  strokeWidth="1.2"
                />
                <rect
                  x="274"
                  y="348"
                  width="82"
                  height="24"
                  rx="6"
                  fill={selectedZone === "musculo" ? "#083344" : "#0f172a"}
                  stroke={STATUS_HEX[zoneStatuses.musculo]}
                  strokeWidth={selectedZone === "musculo" ? 1.8 : 1}
                />
                <text
                  x="315"
                  y="363"
                  textAnchor="middle"
                  fill="#e2e8f0"
                  fontSize="10"
                  fontWeight="600"
                >
                  6. Músculos
                </text>
              </g>
            </svg>
          </div>
        </div>

        {/* RIGHT: 5-Section Non-Jargon Diagnostic Panel */}
        <div className="flex flex-col gap-3.5 xl:col-span-7">
          {/* Selected Zone Summary Banner */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/90 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border"
                  style={{
                    borderColor: `${activeHex}66`,
                    backgroundColor: `${activeHex}20`,
                    color: activeHex,
                  }}
                >
                  {ZONE_ICONS[selectedZone]}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-bold text-white sm:text-lg">
                      {guide.name}
                    </h3>
                    <span
                      className="rounded-full px-2.5 py-0.5 font-mono-hud text-xs font-bold uppercase"
                      style={{
                        backgroundColor: `${activeHex}22`,
                        color: activeHex,
                        border: `1px solid ${activeHex}55`,
                      }}
                    >
                      Estado: {STATUS_LABELS[activeStatus]}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {guide.subtitle}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onOpenScanTab(recommendedScanTab)}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-cyan-500/40 bg-cyan-500/15 px-3 py-1.5 text-xs font-semibold text-cyan-200 transition hover:bg-cyan-500/25"
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
                  className="rounded-md border border-slate-800 bg-slate-900 px-2.5 py-1 font-mono-hud text-xs text-slate-200"
                >
                  {val}
                </span>
              ))}
            </div>
          </div>

          {/* 5 Mandatory Plain-Language Diagnostic Sections */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {/* 1. Cómo realizar el examen */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/75 p-3.5">
              <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-300">
                <ScanLine className="h-4 w-4" />
                1. Cómo realizar el examen (Sin ser médico)
              </h4>
              <ol className="mt-2 space-y-1.5 text-xs leading-relaxed text-slate-300">
                {guide.howToPerform.map((step, idx) => (
                  <li key={idx} className="flex gap-2">
                    <span className="font-mono-hud font-bold text-cyan-400">
                      {idx + 1}.
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* 2. ¿Por qué es necesario este examen? */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/75 p-3.5">
              <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-300">
                <Info className="h-4 w-4" />
                2. ¿Por qué es necesario este examen?
              </h4>
              <p className="mt-2 text-xs leading-relaxed text-slate-300">
                {guide.whyNecessary}
              </p>
            </div>
          </div>

          {/* 3. Impacto de los 5 Peligros Espaciales (NASA HRP) */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/75 p-3.5">
            <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-300">
              <ShieldAlert className="h-4 w-4" />
              3. Impacto de los 5 Peligros Espaciales (NASA HRP)
            </h4>
            <div className="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">
              <div className="rounded-lg border border-slate-800/90 bg-slate-900/70 p-2.5">
                <div className="text-[11px] font-bold text-rose-300">
                  Radiación
                </div>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-300">
                  {guide.fiveHazardsImpact.radiation}
                </p>
              </div>
              <div className="rounded-lg border border-slate-800/90 bg-slate-900/70 p-2.5">
                <div className="text-[11px] font-bold text-violet-300">
                  Aislamiento / Confinamiento
                </div>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-300">
                  {guide.fiveHazardsImpact.isolation}
                </p>
              </div>
              <div className="rounded-lg border border-slate-800/90 bg-slate-900/70 p-2.5">
                <div className="text-[11px] font-bold text-sky-300">
                  Distancia de la Tierra
                </div>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-300">
                  {guide.fiveHazardsImpact.distance}
                </p>
              </div>
              <div className="rounded-lg border border-slate-800/90 bg-slate-900/70 p-2.5">
                <div className="text-[11px] font-bold text-amber-300">
                  Campos de Gravedad
                </div>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-300">
                  {guide.fiveHazardsImpact.gravity}
                </p>
              </div>
              <div className="rounded-lg border border-slate-800/90 bg-slate-900/70 p-2.5">
                <div className="text-[11px] font-bold text-teal-300">
                  Ambientes Cerrados Hostiles
                </div>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-300">
                  {guide.fiveHazardsImpact.closedEnvironment}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {/* 4. Umbral de Atención */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/75 p-3.5">
              <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-300">
                <AlertCircle className="h-4 w-4" />
                4. Umbral de Atención (Alerta a Cirujanos de Vuelo)
              </h4>
              <div className="mt-2 space-y-1.5 text-xs">
                <div className="rounded-md bg-emerald-500/10 px-2.5 py-1.5 text-emerald-200">
                  <strong className="text-emerald-300">Óptimo:</strong>{" "}
                  {guide.attentionThreshold.optimal}
                </div>
                <div className="rounded-md bg-amber-500/10 px-2.5 py-1.5 text-amber-200">
                  <strong className="text-amber-300">Precaución:</strong>{" "}
                  {guide.attentionThreshold.warning}
                </div>
                <div className="rounded-md bg-red-500/10 px-2.5 py-1.5 text-red-200">
                  <strong className="text-red-300">Crítico:</strong>{" "}
                  {guide.attentionThreshold.critical}
                </div>
                <p className="pt-1 text-[11px] text-slate-400">
                  <strong className="text-slate-300">Acción con Tierra:</strong>{" "}
                  {guide.attentionThreshold.flightSurgeonNote}
                </p>
              </div>
            </div>

            {/* 5. Contramedida Preventiva */}
            <div className="rounded-xl border border-emerald-500/25 bg-emerald-950/20 p-3.5">
              <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-300">
                <CheckCircle2 className="h-4 w-4" />
                5. Contramedida Preventiva (Acción Inmediata)
              </h4>
              <ul className="mt-2 space-y-2 text-xs leading-relaxed text-slate-200">
                {guide.preventiveCountermeasures.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
