"use client";

import React, { useState } from "react";
import {
  AlertOctagon,
  CheckCircle2,
  Circle,
  Radio,
  Send,
  ShieldCheck,
  Siren,
  WifiOff,
} from "lucide-react";
import { MISSION_ENVIRONMENTS } from "@/data/missionData";
import {
  BiomarkerData,
  EmergencyProtocolStep,
  MissionEnvironmentId,
} from "@/types/astronaut";

interface EmergencyBannerModalProps {
  emergencyMode: boolean;
  environmentId: MissionEnvironmentId;
  telemedicineEnabled: boolean;
  biomarkers: BiomarkerData;
  checklist: EmergencyProtocolStep[];
  onToggleStep: (stepId: string) => void;
  onRestoreNominal: () => void;
}

export default function EmergencyBannerModal({
  emergencyMode,
  environmentId,
  telemedicineEnabled,
  biomarkers,
  checklist,
  onToggleStep,
  onRestoreNominal,
}: EmergencyBannerModalProps) {
  const [packetSentAt, setPacketSentAt] = useState<string | null>(null);

  if (!emergencyMode) return null;

  const env = MISSION_ENVIRONMENTS[environmentId];
  const completedCount = checklist.filter((s) => s.completed).length;
  const isHighLatency = env.commLatencySeconds >= 60;

  const handleTransmitTelemetry = () => {
    const now = new Date();
    const utc = now.toISOString().slice(11, 19);
    setPacketSentAt(`${utc} UTC`);
  };

  return (
    <section aria-live="assertive">
      <div className="animate-emergency-glow rounded-2xl border-2 border-red-400 bg-red-50/90 p-4 shadow-lg sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          {/* Alert Header & Triggered Metrics */}
          <div className="space-y-3 lg:max-w-xl">
            <div className="flex items-center gap-2.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-600 text-white animate-pulse">
                <Siren className="h-5 w-5" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-red-600 px-2 py-0.5 font-mono-hud text-[11px] font-bold uppercase tracking-wider text-white">
                    CRITICAL MEDICAL ALERT · DEMO MODE
                  </span>
                  <span className="font-mono-hud text-xs font-semibold text-red-700">
                    {completedCount}/{checklist.length} steps completed
                  </span>
                </div>
                <h2 className="mt-1 text-base font-bold text-red-950 sm:text-lg">
                  Metabolic Decompensation, Acute Stress & Schedule Disruption
                </h2>
              </div>
            </div>

            <p className="text-xs leading-relaxed text-red-900 sm:text-sm">
              Hazardous drop in blood glucose detected (
              <strong className="font-mono-hud text-red-950">
                {biomarkers.bloodGlucoseMgDl} mg/dL
              </strong>
              ), dehydration (
              <strong className="font-mono-hud text-red-950">
                {biomarkers.hydrationPercent}%
              </strong>
              ), tachycardia (
              <strong className="font-mono-hud text-red-950">
                {biomarkers.bpm} BPM
              </strong>
              ), cortisol surge (
              <strong className="font-mono-hud text-red-950">
                {biomarkers.cortisolIndex}/100
              </strong>
              ), and severe postural / autonomic strain across Bio-Monitor 3N.
            </p>

            {/* Comm Link Reality Box */}
            <div className="rounded-xl border border-red-200 bg-white p-3.5 text-xs shadow-sm">
              <div className="flex items-center gap-2 font-semibold text-amber-700">
                {telemedicineEnabled ? (
                  <Radio className="h-4 w-4 text-amber-600" />
                ) : (
                  <WifiOff className="h-4 w-4 text-red-600" />
                )}
                <span>
                  Downlink Protocol ({env.name}):{" "}
                  {telemedicineEnabled
                    ? env.commProtocol
                    : "Telemedicine DISABLED"}
                </span>
              </div>
              <p className="mt-1 text-slate-600">
                {!telemedicineEnabled
                  ? "Ground Telemedicine switch is offline: execute steps 1 and 2 autonomously and re-enable uplink when safe."
                  : isHighLatency
                  ? `Active latency of ${env.commLatencyLabel}. DO NOT wait for flight surgeon confirmation to stabilize crew member; queue packet and administer glucose/electrolytes immediately.`
                  : `Low latency (${env.commLatencyLabel}). Open live voice loop with Flight Surgeons in Houston/CSA while executing step 1.`}
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleTransmitTelemetry}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-700"
                >
                  <Send className="h-3.5 w-3.5" />
                  {telemedicineEnabled
                    ? isHighLatency
                      ? "Queue Medical Packet (Store & Forward)"
                      : "Transmit Priority Telemetry to Ground"
                    : "Save Medical Packet to Local Black Box"}
                </button>
                <button
                  type="button"
                  onClick={onRestoreNominal}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  End Demo / Restore Nominal Values
                </button>
              </div>

              {packetSentAt && (
                <p className="mt-2 flex items-center gap-1.5 font-mono-hud text-[11px] font-medium text-emerald-700">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Biomedical packet locally signed at {packetSentAt} (
                  {telemedicineEnabled
                    ? isHighLatency
                      ? `in transit to Earth · ETA ~${Math.round(
                          env.commLatencySeconds / 60
                        )} min`
                      : "acknowledged by Flight Surgeon Console"
                    : "stored in local offline buffer"}
                  ).
                </p>
              )}
            </div>
          </div>

          {/* Step-by-Step Flight Surgeon Protocol Checklist */}
          <div className="flex-1 rounded-xl border border-red-200 bg-white p-3.5 shadow-sm">
            <div className="mb-2.5 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-red-700">
                <AlertOctagon className="h-4 w-4" />
                Step-by-Step Protocol: Emergency & Ground Link
              </h3>
              <span className="font-mono-hud text-[11px] text-slate-500">
                Operable without onboard MD
              </span>
            </div>

            <div className="space-y-2">
              {checklist.map((step) => (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => onToggleStep(step.id)}
                  className={`flex w-full cursor-pointer items-start gap-2.5 rounded-lg border p-2.5 text-left transition ${
                    step.completed
                      ? "border-emerald-300 bg-emerald-50"
                      : "border-slate-200 bg-slate-50/70 hover:border-red-300"
                  }`}
                >
                  {step.completed ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  ) : (
                    <Circle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                  )}
                  <div>
                    <div className="text-xs font-semibold text-slate-900">
                      Step {step.stepNumber}: {step.title}
                    </div>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-slate-600">
                      {step.instruction}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
