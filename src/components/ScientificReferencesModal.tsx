"use client";

import React from "react";
import { BookOpen, Radiation, ShieldCheck, X } from "lucide-react";
import {
  CSA_RADIATION_LIMITS,
  SCIENTIFIC_REFERENCES,
} from "@/data/missionData";

interface ScientificReferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ScientificReferencesModal({
  isOpen,
  onClose,
}: ScientificReferencesModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3 backdrop-blur-sm sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-label="Referencias Científicas NASA HRP y CSA"
    >
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <BookOpen className="h-5 w-5 text-[#1a73e8]" />
            <div>
              <h2 className="text-base font-bold text-slate-900 sm:text-lg">
                Referencias Científicas Oficiales · NASA HRP & CSA
              </h2>
              <p className="text-xs text-slate-500">
                Base biomédica del desafío: 5 Peligros del Espacio Humano y Dosimetría de Radiación Canadiense.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-xl border border-slate-200 bg-white p-1.5 text-slate-500 hover:text-slate-900"
            aria-label="Cerrar referencias"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          {/* CSA Thresholds Summary Strip */}
          <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#1a73e8]">
              <Radiation className="h-4 w-4" />
              Parámetros de Referencia Radiológica ({CSA_RADIATION_LIMITS.instrumentName})
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
                  {CSA_RADIATION_LIMITS.careerLimitMsv} mSv (Anual: {CSA_RADIATION_LIMITS.annualLimitMsv} mSv)
                </div>
              </div>
            </div>
          </div>

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

          <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
            <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>
              Arquitectura 100% Autónoma Offline: Toda la base científica, simulaciones de ultrasonido, análisis facial y almacenamiento local operan sin conexión a internet ni dependencias externas.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
