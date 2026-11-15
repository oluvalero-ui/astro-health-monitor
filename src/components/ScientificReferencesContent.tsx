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
      {/* Parámetros Radiológicos CSA Radi-N2 / EVARM */}
      <div className="rounded-xl border border-[#1e3458] bg-[#0a1324] p-4 shadow-inner">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sky-400">
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
          <div className="rounded-lg border border-[#1b2d4b] bg-[#0e192f] p-2.5 text-xs">
            <div className="text-slate-400">Tasa Diaria Nominal (Órbita)</div>
            <div className="mt-0.5 font-mono-hud text-sm font-bold text-emerald-400">
              ≤ {CSA_RADIATION_LIMITS.dailyNominalMsv} mSv/día
            </div>
          </div>
          <div className="rounded-lg border border-[#1b2d4b] bg-[#0e192f] p-2.5 text-xs">
            <div className="text-slate-400">Umbral de Alerta Diaria</div>
            <div className="mt-0.5 font-mono-hud text-sm font-bold text-red-400">
              ≥ {CSA_RADIATION_LIMITS.dailyAlertMsv} mSv/día
            </div>
          </div>
          <div className="rounded-lg border border-[#1b2d4b] bg-[#0e192f] p-2.5 text-xs">
            <div className="text-slate-400">Límite Acumulado de Carrera</div>
            <div className="mt-0.5 font-mono-hud text-sm font-bold text-amber-400">
              {CSA_RADIATION_LIMITS.careerLimitMsv} mSv (Anual:{" "}
              {CSA_RADIATION_LIMITS.annualLimitMsv} mSv)
            </div>
          </div>
        </div>
      </div>

      {/* Arquitectura y Fundamento Físico del Bio-Monitor 3N (Offline) */}
      <div className="rounded-xl border border-[#182742] bg-[#091120] p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sky-300">
            <Cpu className="h-4 w-4 text-sky-400" />
            Arquitectura y Fundamento Físico del Bio-Monitor 3N (Memoria Local)
          </div>
          <span className="rounded-full border border-sky-500/35 bg-sky-500/10 px-2.5 py-0.5 font-mono-hud text-[11px] font-bold text-sky-300">
            Manual Técnico Offline
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="rounded-lg border border-[#182742] bg-[#0c1426] p-3 text-xs">
            <div className="font-bold text-slate-100">
              Nodo Frontal (Banda Cefálica)
            </div>
            <p className="mt-1 leading-relaxed text-slate-300">
              En microgravedad (0g) la sangre se desplaza hacia la cabeza y las
              manos se enfrían; medir SpO₂, pulso óptico (PTT) y temperatura
              central (ZHF) en la frente evita lecturas falsas por
              vasoconstricción periférica y permite estimar la presión arterial
              sin inflar brazalete.
            </p>
          </div>
          <div className="rounded-lg border border-[#182742] bg-[#0c1426] p-3 text-xs">
            <div className="font-bold text-slate-100">
              Nodo Torácico (Chaleco Textil)
            </div>
            <p className="mt-1 leading-relaxed text-slate-300">
              Integra 3 derivaciones ECG (V1, V2, V3) en seco y bandas de
              inductancia respiratoria (RIP) que calculan frecuencia cardíaca,
              variabilidad (HRV rMSSD), ventilación por minuto (L/min),
              temperatura cutánea y postura/sueño sin adhesivos.
            </p>
          </div>
          <div className="rounded-lg border border-[#182742] bg-[#0c1426] p-3 text-xs">
            <div className="font-bold text-slate-100">
              Nodo Radial y Calibración por Gravedad
            </div>
            <p className="mt-1 leading-relaxed text-slate-300">
              Combina dosimetría personal (mSv/día) en muñeca y acelerometría
              laríngea en cuello (estima tensión vocal sin grabar la voz). Al
              cambiar de gravedad (0g, 0.16g, 0.38g), una calibración de 30 s
              frente al brazalete ajusta la curva de presión óptica (PTT).
            </p>
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
                    Aplicación en Consola: {item.appMapping}
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
