"use client";

import React, { useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  Sliders,
  Stethoscope,
  X,
} from "lucide-react";
import {
  BiomarkerData,
  MissionEnvironmentId,
  RoutineTracking,
} from "@/types/astronaut";

export type ScanModalTab = "camara" | "manual";

interface MultimodalScanModalProps {
  isOpen: boolean;
  initialTab?: ScanModalTab;
  environmentId?: MissionEnvironmentId;
  biomarkers: BiomarkerData;
  routine: RoutineTracking;
  onClose: () => void;
  onApplyCameraResults?: (
    updates: Partial<BiomarkerData>,
    summary: string
  ) => void;
  onApplyManualEntry: (
    nextBiomarkers: BiomarkerData,
    nextRoutine: RoutineTracking
  ) => void;
}

interface ClinicalPreset {
  id: string;
  label: string;
  toneClass: string;
  bio: Partial<BiomarkerData>;
  routine: Partial<RoutineTracking>;
}

const CLINICAL_PRESETS: ClinicalPreset[] = [
  {
    id: "optimal",
    label: "Optimal / Nominal",
    toneClass:
      "border-emerald-500/40 bg-emerald-950/35 text-emerald-300 hover:bg-emerald-900/45",
    bio: {
      bpm: 68,
      systolicBP: 118,
      diastolicBP: 75,
      spo2Percent: 98,
      bodyTempC: 36.6,
      respiratoryRateRpm: 14,
      hrvRmssdMs: 52,
      bloodGlucoseMgDl: 92,
      hydrationPercent: 86,
      cortisolIndex: 24,
      stressLevel: 22,
      reactionTimeMs: 245,
      sleepHours: 7.6,
      physicalFatigue: 22,
      mentalFatigue: 20,
    },
    routine: {
      sleepDeviationMin: 5,
      exerciseMinutes: 120,
      mealsCompleted: 3,
      hydrationLiters: 2.5,
    },
  },
  {
    id: "moderate",
    label: "Moderate Fatigue",
    toneClass:
      "border-amber-500/45 bg-amber-950/35 text-amber-300 hover:bg-amber-900/45",
    bio: {
      bpm: 96,
      systolicBP: 136,
      diastolicBP: 86,
      spo2Percent: 95,
      bodyTempC: 37.3,
      respiratoryRateRpm: 20,
      hrvRmssdMs: 31,
      bloodGlucoseMgDl: 71,
      hydrationPercent: 72,
      cortisolIndex: 64,
      stressLevel: 62,
      reactionTimeMs: 325,
      sleepHours: 5.6,
      physicalFatigue: 62,
      mentalFatigue: 60,
    },
    routine: {
      sleepDeviationMin: 55,
      exerciseMinutes: 65,
      mealsCompleted: 2,
      hydrationLiters: 1.7,
    },
  },
  {
    id: "critical",
    label: "Exhausted / Critical",
    toneClass:
      "border-red-500/45 bg-red-950/40 text-red-300 hover:bg-red-900/50",
    bio: {
      bpm: 128,
      systolicBP: 154,
      diastolicBP: 98,
      spo2Percent: 91,
      bodyTempC: 38.2,
      respiratoryRateRpm: 25,
      hrvRmssdMs: 18,
      bloodGlucoseMgDl: 58,
      hydrationPercent: 61,
      cortisolIndex: 86,
      stressLevel: 84,
      reactionTimeMs: 430,
      sleepHours: 4.3,
      physicalFatigue: 84,
      mentalFatigue: 82,
    },
    routine: {
      sleepDeviationMin: 125,
      exerciseMinutes: 25,
      mealsCompleted: 1,
      hydrationLiters: 1.1,
    },
  },
];

export default function MultimodalScanModal({
  isOpen,
  biomarkers,
  routine,
  onClose,
  onApplyManualEntry,
}: MultimodalScanModalProps) {
  const [draftBio, setDraftBio] = useState<BiomarkerData>(biomarkers);
  const [draftRoutine, setDraftRoutine] = useState<RoutineTracking>(routine);
  const [activePresetId, setActivePresetId] = useState<string | null>(null);

  if (!isOpen) return null;

  const applyPreset = (preset: ClinicalPreset) => {
    setDraftBio((prev) => ({ ...prev, ...preset.bio }));
    setDraftRoutine((prev) => ({ ...prev, ...preset.routine }));
    setActivePresetId(preset.id);
  };

  return (
    <div
      className="crew-dragon-theme fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-3 backdrop-blur-sm sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-label="Point-of-Care Manual Entry & Clinical Profile Simulator"
    >
      <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-[#1b2d4b] bg-[#070c17] text-slate-100 shadow-2xl">
        {/* Unified Modal Header */}
        <div className="flex items-center justify-between border-b border-[#182742] bg-[#091120] px-5 py-3.5">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-sky-400/35 bg-sky-500/15 text-sky-300">
              <Sliders className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-100 sm:text-lg">
                Point-of-Care Manual Entry &amp; Clinical Profile Simulator
              </h2>
              <p className="text-xs text-slate-400">
                Inject test physiological profiles or adjust Point-of-Care clinical parameters to verify Bio-Monitor 3N (13 continuous signs) and autonomous triage response.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-xl border border-[#1b2d4b] bg-[#0c1426] p-1.5 text-slate-400 transition hover:border-sky-400 hover:text-slate-100"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Unified PoC Body */}
        <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
          {/* Quick Clinical Profile Simulator */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#1b2d4b] bg-[#091120] p-3.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
              <Stethoscope className="h-4 w-4 text-sky-400" />
              <span>Clinical Profile Simulator:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {CLINICAL_PRESETS.map((preset) => {
                const isSelected = activePresetId === preset.id;
                const Icon =
                  preset.id === "optimal" ? ShieldCheck : AlertTriangle;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => applyPreset(preset)}
                    className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 font-mono-hud text-xs font-bold transition ${
                      preset.toneClass
                    } ${isSelected ? "ring-1 ring-white/40" : ""}`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Comprehensive Point-of-Care Clinical Sliders */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Column 1: Cardiorespiratory, Hemodynamic & Thermal Signs */}
            <div className="space-y-3 rounded-xl border border-[#182742] bg-[#091120] p-4">
              <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sky-300">
                <Activity className="h-4 w-4" />
                Cardiorespiratory, Hemodynamic &amp; Thermal (3N &amp; PoC)
              </h3>

              <SliderField
                label="Heart Rate (BPM)"
                value={draftBio.bpm}
                min={42}
                max={150}
                unit="BPM"
                onChange={(v) => setDraftBio((b) => ({ ...b, bpm: v }))}
              />
              <SliderField
                label="Systolic Blood Pressure (mmHg)"
                value={draftBio.systolicBP}
                min={85}
                max={175}
                unit="mmHg"
                onChange={(v) => setDraftBio((b) => ({ ...b, systolicBP: v }))}
              />
              <SliderField
                label="Diastolic Blood Pressure (mmHg)"
                value={draftBio.diastolicBP}
                min={50}
                max={115}
                unit="mmHg"
                onChange={(v) => setDraftBio((b) => ({ ...b, diastolicBP: v }))}
              />
              <SliderField
                label="Arterial Oxygen SpO₂ (%)"
                value={draftBio.spo2Percent}
                min={85}
                max={100}
                unit="%"
                onChange={(v) => setDraftBio((b) => ({ ...b, spo2Percent: v }))}
              />
              <SliderField
                label="Core Body Temperature (°C)"
                value={draftBio.bodyTempC}
                min={35.2}
                max={39.2}
                step={0.1}
                unit="°C"
                onChange={(v) => setDraftBio((b) => ({ ...b, bodyTempC: v }))}
              />
              <SliderField
                label="Respiratory Rate (rpm)"
                value={draftBio.respiratoryRateRpm}
                min={8}
                max={32}
                unit="rpm"
                onChange={(v) =>
                  setDraftBio((b) => ({ ...b, respiratoryRateRpm: v }))
                }
              />
              <SliderField
                label="Heart Rate Variability · HRV rMSSD (ms)"
                value={draftBio.hrvRmssdMs}
                min={10}
                max={85}
                unit="ms"
                onChange={(v) => setDraftBio((b) => ({ ...b, hrvRmssdMs: v }))}
              />
              <SliderField
                label="Blood Glucose PoC (mg/dL)"
                value={draftBio.bloodGlucoseMgDl}
                min={50}
                max={200}
                unit="mg/dL"
                onChange={(v) =>
                  setDraftBio((b) => ({ ...b, bloodGlucoseMgDl: v }))
                }
              />
            </div>

            {/* Column 2: Neurocognitive (PVT), Endocrine, Sleep & Hydration */}
            <div className="space-y-3 rounded-xl border border-[#182742] bg-[#091120] p-4">
              <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-300">
                <Sliders className="h-4 w-4" />
                Neurocognitive (PVT), Endocrine, Sleep &amp; Hydration
              </h3>

              <SliderField
                label="Cortisol / Hormonal Stress (0–100)"
                value={draftBio.cortisolIndex}
                min={10}
                max={100}
                unit="/100"
                onChange={(v) =>
                  setDraftBio((b) => ({ ...b, cortisolIndex: v }))
                }
              />
              <SliderField
                label="Stress & Vocal Tension Level (0–100)"
                value={draftBio.stressLevel}
                min={0}
                max={100}
                unit="/100"
                onChange={(v) => setDraftBio((b) => ({ ...b, stressLevel: v }))}
              />
              <SliderField
                label="Psychomotor Vigilance · PVT Reaction Time (ms)"
                value={draftBio.reactionTimeMs}
                min={180}
                max={520}
                unit="ms"
                onChange={(v) =>
                  setDraftBio((b) => ({ ...b, reactionTimeMs: v }))
                }
              />
              <SliderField
                label="Sleep Duration (hrs)"
                value={draftBio.sleepHours}
                min={3.0}
                max={10.0}
                step={0.1}
                unit="hrs"
                onChange={(v) => setDraftBio((b) => ({ ...b, sleepHours: v }))}
              />
              <SliderField
                label="Body Hydration (%)"
                value={draftBio.hydrationPercent}
                min={50}
                max={100}
                unit="%"
                onChange={(v) =>
                  setDraftBio((b) => ({ ...b, hydrationPercent: v }))
                }
              />
              <SliderField
                label="Physical Fatigue (0–100)"
                value={draftBio.physicalFatigue}
                min={0}
                max={100}
                unit="/100"
                onChange={(v) =>
                  setDraftBio((b) => ({ ...b, physicalFatigue: v }))
                }
              />
              <SliderField
                label="Exercise Minutes Today"
                value={draftRoutine.exerciseMinutes}
                min={0}
                max={150}
                unit="min"
                onChange={(v) =>
                  setDraftRoutine((r) => ({ ...r, exerciseMinutes: v }))
                }
              />
              <SliderField
                label="Water Intake Today (L)"
                value={draftRoutine.hydrationLiters}
                min={0.5}
                max={3.5}
                step={0.1}
                unit="L"
                onChange={(v) =>
                  setDraftRoutine((r) => ({ ...r, hydrationLiters: v }))
                }
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-xl border border-[#1b2d4b] bg-[#091120] px-4 py-2 text-xs font-medium text-slate-300 transition hover:border-slate-500 hover:text-slate-100"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                onApplyManualEntry(draftBio, draftRoutine);
                onClose();
              }}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-sky-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-sky-500"
            >
              <CheckCircle2 className="h-4 w-4" />
              Apply to Console / Save PoC Entry
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface SliderFieldProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit: string;
  onChange: (value: number) => void;
}

function SliderField({
  label,
  value,
  min,
  max,
  step = 1,
  unit,
  onChange,
}: SliderFieldProps) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-300">{label}</span>
        <span className="font-mono-hud font-bold text-sky-300">
          {step < 1 ? value.toFixed(1) : value} {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-[#182742] accent-sky-400"
      />
    </div>
  );
}
