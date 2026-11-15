"use client";

import React from "react";
import { BookOpen, ExternalLink, Radiation } from "lucide-react";
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

interface VerifiedCitation {
  id: string;
  authors: string;
  year: string;
  title: string;
  url: string;
  domain: string;
}

const VERIFIED_16_SOURCES: VerifiedCitation[] = [
  {
    id: "[1]",
    authors: "NASA",
    year: "2023",
    title:
      "NASA-STD-3001_VOL_1: NASA Spaceflight Human-System Standard Volume 1, Crew Health (Rev C)",
    url: "https://standards.nasa.gov",
    domain: "standards.nasa.gov",
  },
  {
    id: "[2]",
    authors: "Agencia Espacial Canadiense / CSA",
    year: "2019",
    title:
      "Bio-Monitor: Wearable technology for astronaut health monitoring on the International Space Station",
    url: "https://www.asc-csa.gc.ca/eng/sciences/bio-monitor.asp",
    domain: "asc-csa.gc.ca",
  },
  {
    id: "[3]",
    authors: "Hughson, R. L. et al. / CSA & NASA",
    year: "2016",
    title:
      "Increased postflight carotid artery stiffness and inflight insulin resistance resulting from 6-mo spaceflight in male and female astronauts (BP Reg Experiment)",
    url: "https://doi.org/10.1152/ajpheart.00802.2015",
    domain: "osdr.nasa.gov / doi.org",
  },
  {
    id: "[4]",
    authors: "Platts, S. H. et al. / NASA HRP",
    year: "2016",
    title:
      "Evidence Report: Risk of Orthostatic Intolerance During Re-exposure to Gravity",
    url: "https://humanresearchroadmap.nasa.gov",
    domain: "humanresearchroadmap.nasa.gov",
  },
  {
    id: "[5]",
    authors: "NASA HRP / Exploration Medical Capability — ExMC",
    year: "2023",
    title:
      "Risk of Adverse Health Outcomes and Decrements in Performance Due to In-Flight Medical Conditions (Autonomous Medical Operations)",
    url: "https://www.nasa.gov/hrp",
    domain: "nasa.gov/hrp",
  },
  {
    id: "[6]",
    authors: "NASA LSDA & CSA",
    year: "2020",
    title:
      "Bio-Monitor System Operations and Flight Validation on ISS Expeditions 58/59",
    url: "https://www.nasa.gov/mission/station/research-explorer/",
    domain: "nasa.gov",
  },
  {
    id: "[7]",
    authors: "Garrett-Bakelman, F. E. et al. / NASA HRP",
    year: "2019",
    title:
      "The NASA Twins Study: A multidimensional analysis of a year-long human spaceflight",
    url: "https://www.nasa.gov/humans-in-space/twins-study/",
    domain: "nasa.gov / science.org",
  },
  {
    id: "[8]",
    authors: "Mader, T. H. et al. / NASA HRP",
    year: "2022",
    title:
      "Evidence Report: Risk of Spaceflight Associated Neuro-ocular Syndrome (SANS)",
    url: "https://ntrs.nasa.gov",
    domain: "ntrs.nasa.gov",
  },
  {
    id: "[9]",
    authors: "Sibonga, J. D. et al. / NASA HRP",
    year: "2017",
    title:
      "Evaluating Bone Loss in ISS Astronauts (Risk of Spaceflight-Induced Bone Loss)",
    url: "https://ntrs.nasa.gov",
    domain: "ntrs.nasa.gov",
  },
  {
    id: "[10]",
    authors: "Basner, M. et al. / NASA HRP",
    year: "2022",
    title:
      "Evidence Report: Risk of Performance and Behavioral Health Decrements (WinSCAT & Mars500)",
    url: "https://humanresearchroadmap.nasa.gov",
    domain: "humanresearchroadmap.nasa.gov",
  },
  {
    id: "[11]",
    authors: "Agencia Espacial Canadiense / CSA",
    year: "2022",
    title:
      "Canadian Space Agency Radiation Protection Guidelines and Operational Dose Limits (mSv)",
    url: "https://www.asc-csa.gc.ca",
    domain: "asc-csa.gc.ca",
  },
  {
    id: "[12]",
    authors: "Basner, M. et al. / NASA HRP",
    year: "2015",
    title:
      "Development and Validation of the Cognition Test Battery for Spaceflight",
    url: "https://osdr.nasa.gov",
    domain: "osdr.nasa.gov",
  },
  {
    id: "[13]",
    authors: "NASA HRP / Behavioral Health and Performance — BHP",
    year: "2021",
    title:
      "Evidence Report: Risk of Adverse Cognitive or Behavioral Conditions and Psychiatric Disorders",
    url: "https://humanresearchroadmap.nasa.gov",
    domain: "humanresearchroadmap.nasa.gov",
  },
  {
    id: "[14]",
    authors: "Agencia Espacial Canadiense / CSA",
    year: "2020",
    title:
      "Bio-Analyzer: Near-real-time biomedical analysis on the International Space Station",
    url: "https://www.asc-csa.gc.ca/eng/sciences/bio-analyzer.asp",
    domain: "asc-csa.gc.ca",
  },
  {
    id: "[15]",
    authors: "NASA Space Apps Challenge",
    year: "2026",
    title: "Official Project Submission Guidelines & Judging Criteria",
    url: "https://www.spaceappschallenge.org",
    domain: "spaceappschallenge.org",
  },
  {
    id: "[16]",
    authors: "NASA",
    year: "2026",
    title:
      "NASA-STD-3001_VOL_2: NASA Spaceflight Human-System Standard Volume 2: Human Factors, Habitability, and Environmental Health (Rev F)",
    url: "https://standards.nasa.gov",
    domain: "standards.nasa.gov",
  },
];

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
            Parámetros de Referencia Radiológica ({CSA_RADIATION_LIMITS.instrumentName} [11])
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

      {/* Registro Oficial de 16 Fuentes Verificadas (NASA y CSA) */}
      <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-[#1a73e8]" />
            <h3 className="text-sm font-bold text-slate-900 sm:text-base">
              Registro Oficial de 16 Fuentes Verificadas (NASA HRP, NASA-STD-3001 y CSA)
            </h3>
          </div>
          <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 font-mono-hud text-[11px] font-bold text-[#1a73e8]">
            16 Referencias Oficiales [1]–[16]
          </span>
        </div>

        <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
          {VERIFIED_16_SOURCES.map((ref) => (
            <a
              key={ref.id}
              href={ref.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-start justify-between gap-2.5 rounded-lg border border-slate-200 bg-white p-3 text-xs transition hover:border-sky-400/60"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 font-mono-hud text-[11px]">
                  <span className="font-bold text-[#1a73e8]">{ref.id}</span>
                  <span className="font-semibold text-slate-700">
                    {ref.authors} ({ref.year})
                  </span>
                </div>
                <p className="mt-1 text-xs leading-snug text-slate-900">
                  {ref.title}
                </p>
                <span className="mt-1 inline-block font-mono-hud text-[10px] text-slate-500">
                  {ref.domain}
                </span>
              </div>
              <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400 transition group-hover:text-sky-400" />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
