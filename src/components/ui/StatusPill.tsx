import React from "react";
import { HealthStatus } from "@/types/astronaut";

const PILL_CLASSES: Record<HealthStatus, string> = {
  optimal: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  warning: "border-amber-500/40 bg-amber-500/10 text-amber-300",
  critical: "border-red-500/50 bg-red-500/15 text-red-300",
};

const PILL_LABELS: Record<HealthStatus, string> = {
  optimal: "NOMINAL",
  warning: "PRECAUCIÓN",
  critical: "CRÍTICO",
};

const DOT_CLASSES: Record<HealthStatus, string> = {
  optimal: "bg-emerald-400",
  warning: "bg-amber-400",
  critical: "bg-red-500",
};

interface StatusPillProps {
  status: HealthStatus;
  /** Show the pill even when the status is nominal. Default: false (alarm-only, like a bedside monitor). */
  showNominal?: boolean;
  className?: string;
}

/**
 * Alarm-style status pill. Following bedside-monitor conventions, nominal
 * readings stay quiet (no pill) and only PRECAUCIÓN / CRÍTICO are flagged.
 */
export function StatusPill({
  status,
  showNominal = false,
  className = "",
}: StatusPillProps) {
  if (status === "optimal" && !showNominal) return null;
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded border px-1.5 py-0.5 font-mono-hud text-[10px] font-semibold tracking-wide ${PILL_CLASSES[status]} ${className}`}
    >
      {PILL_LABELS[status]}
    </span>
  );
}

/** Small status dot for list rows and compact headers. */
export function StatusDot({
  status,
  className = "",
}: {
  status: HealthStatus;
  className?: string;
}) {
  return (
    <span
      aria-label={PILL_LABELS[status]}
      className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full ${DOT_CLASSES[status]} ${className}`}
    />
  );
}
