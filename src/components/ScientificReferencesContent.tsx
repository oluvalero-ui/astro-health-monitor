"use client";

import React from "react";
import { Radiation, ShieldCheck } from "lucide-react";
import {
  CSA_RADIATION_LIMITS,
  SCIENTIFIC_REFERENCES,
} from "@/data/missionData";
import { HealthStatus } from "@/types/astronaut";
import { evaluateRadiationStatus, STATUS_HEX } from "@/utils/healthEngine";

const RAD_BADGE_CLASSES: Record<HealthStatus, string> = {
  optimal: "border-emerald-200 bg-emerald-50 text-emerald-700",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  critical: "border-red-200 bg-red-50 text-red-700",
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
      {/* Parámetros Radiológicos CSA Radi-N2 / EVARM */}
      <div className="rounded-xl border border-blue-200 bg-blue-50/65 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#1a73e8]">
            <Radiation className="h-4 w-4" />
            Parámetros de Referencia Radiológica ({CSA_RADIATION_LIMITS.instrumentName})
          </div>

          {hasLiveTelemetry && (
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono-hud text-[11px] font-bold ${RAD_BADGE_CLASSES[radStatus]}`}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: STATUS_HEX[radStatus] }}
              />
              Lectura actual{environmentShortName ? ` (${environmentShortName})` : ""}:{" "}
              {dailyRadiationMsv.toFixed(2)} mSv/día · Acum:{" "}
              {cumulativeRadiationMsv.toFixed(1)} mSv
            </span>
          )}
        </div>

        <div className="mt-2.5 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
          <div className="rounded-lg border border-slate-200 bg-white p-2.5 text-xs">
            <div className="text-slate-500">Tasa Diaria Nominal (Órbita)</div>
            <div className="mt-0.5 font-mono-hud text-sm font-bold text-emerald-600">
              ≤ {CSA_RADIATION_LIMITS.dailyNominalMsv} mSv/día
            </div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-2.5 text-xs">
            <div className="text-slate-500">Umbral de Alerta Diaria</div>
            <div className="mt-0.5 font-mono-hud text-sm font-bold text-red-600">
              ≥ {CSA_RADIATION_LIMITS.dailyAlertMsv} mSv/día
            </div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-2.5 text-xs">
            <div className="text-slate-500">Límite Acumulado de Carrera</div>
            <div className="mt-0.5 font-mono-hud text-sm font-bold text-amber-600">
              {CSA_RADIATION_LIMITS.careerLimitMsv} mSv (Anual:{" "}
              {CSA_RADIATION_LIMITS.annualLimitMsv} mSv)
            </div>
          </div>
        </div>
      </div>

      {/* Tarjetas de NASA HRP (5 Peligros) y Programa CSA */}
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
            className="rounded-xl border border-slate-200 bg-slate-50/60 p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-[11px] font-bold text-[#1a73e8]">
                {section.agency}
              </span>
              <span className="font-mono-hud text-[11px] text-slate-500">
                {section.badge}
              </span>
            </div>
            <h3 className="mt-2 text-sm font-bold text-slate-900 sm:text-base">
              {section.title}
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-slate-600">
              {section.description}
            </p>

            <div className="mt-3 space-y-2.5">
              {section.items.map((item) => (
                <div
                  key={item.name}
                  className="rounded-lg border border-slate-200 bg-white p-3 text-xs"
                >
                  <div className="font-bold text-slate-900">{item.name}</div>
                  <p className="mt-1 leading-relaxed text-slate-600">
                    {item.detail}
                  </p>
                  <p className="mt-1.5 text-[11px] font-medium text-[#1a73e8]">
                    Integración en ASTRO-MED: {item.appMapping}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Nota de Operación Autónoma Offline */}
      <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
        <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600" />
        <span>
          Arquitectura 100% Autónoma Offline: Toda la base científica, telemetría
          vestible, análisis facial y almacenamiento local operan sin conexión a
          internet ni dependencias externas.
        </span>
      </div>
    </div>
  );
}
