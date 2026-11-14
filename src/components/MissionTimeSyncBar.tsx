"use client";

import React, { useSyncExternalStore } from "react";
import { Clock, Globe, Radio, Sparkles } from "lucide-react";
import { MISSION_ENVIRONMENTS } from "@/data/missionData";
import { MissionEnvironmentId } from "@/types/astronaut";

interface MissionTimeSyncBarProps {
  environmentId: MissionEnvironmentId;
  missionDay: number;
  telemedicineEnabled: boolean;
}

interface TimePhysicsProfile {
  astronautZoneLabel: string;
  cycleNote: string;
  /** Factor de velocidad del reloj del astronauta respecto a 1 segundo terrestre */
  timeRateMultiplier: number;
  /** Desfase relativista diario aproximado (microsegundos/día) */
  relativisticDailyOffsetText: string;
  /** Duración del día local en segundos terrestres (Marte = 88775s, otros = 86400s) */
  localDaySeconds: number;
  localDayUnit: string;
}

const TIME_PROFILES: Record<MissionEnvironmentId, TimePhysicsProfile> = {
  iss: {
    astronautZoneLabel: "UTC Orbital · ISS (Órbita Baja 408 km)",
    cycleNote: "16 amaneceres cada 24h (ciclo orbital de 90 min)",
    // Velocidad orbital ~7.66 km/s: el reloj atrasa ~28 µs/día respecto a la Tierra
    timeRateMultiplier: 0.99999999968,
    relativisticDailyOffsetText: "-28.4 µs / día (dilatación por velocidad orbital)",
    localDaySeconds: 86400,
    localDayUnit: "Día MET",
  },
  nave: {
    astronautZoneLabel: "MET · Tránsito Espacio Profundo",
    cycleNote: "Ciclo circadiano artificial LED 24h a bordo",
    // Crucero interplanetario (~30-40 km/s): dilatación cinemática mayor
    timeRateMultiplier: 0.999999992,
    relativisticDailyOffsetText: "-690 µs / día (crucero interplanetario)",
    localDaySeconds: 86400,
    localDayUnit: "Día MET",
  },
  luna: {
    astronautZoneLabel: "LTC · Tiempo Coordinado Lunar (Artemis)",
    cycleNote: "Día solar lunar = 29.5 días terrestres (14d luz / 14d noche)",
    // Gravedad lunar más débil (1/6 g): el reloj adelanta ~56 µs/día (NASA/NIST)
    timeRateMultiplier: 1.00000000065,
    relativisticDailyOffsetText: "+56.0 µs / día (menor gravedad lunar · estándar NASA LTC)",
    localDaySeconds: 86400,
    localDayUnit: "Día Lunar",
  },
  marte: {
    astronautZoneLabel: "MTC · Tiempo Coordinado Marciano (Sol)",
    cycleNote: "1 Sol marciano = 24h 39m 35s (+39m 35s diarios vs. Tierra)",
    // Gravedad marciana 0.38g: adelanta ~477 µs/día en reloj atómico, más el día Sol de 24h 39m
    timeRateMultiplier: 1.0000000055,
    relativisticDailyOffsetText: "+477 µs / día + desfase solar de +39m 35s por Sol",
    localDaySeconds: 88775,
    localDayUnit: "Sol",
  },
};

// Ticker global de 1 segundo compatible con SSR y ESLint 9 (sin setState en useEffect)
let currentNowMs = 0;
const listeners = new Set<() => void>();
let intervalId: ReturnType<typeof setInterval> | null = null;

function subscribeClock(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  if (currentNowMs === 0) {
    currentNowMs = Date.now();
  }
  listeners.add(callback);
  if (!intervalId) {
    intervalId = setInterval(() => {
      currentNowMs = Date.now();
      listeners.forEach((listener) => listener());
    }, 1000);
  }
  return () => {
    listeners.delete(callback);
    if (listeners.size === 0 && intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  };
}

function getClockSnapshot(): number {
  return currentNowMs;
}

function getClockServerSnapshot(): number {
  return 0;
}

function pad2(value: number): string {
  return String(Math.floor(value)).padStart(2, "0");
}

function formatHmsFromSeconds(totalSeconds: number): string {
  const safe = ((totalSeconds % 86400) + 86400) % 86400;
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  const s = Math.floor(safe % 60);
  return `${pad2(h)}:${pad2(m)}:${pad2(s)}`;
}

function formatSolHms(totalSecondsInSol: number): string {
  const h = Math.floor(totalSecondsInSol / 3600);
  const m = Math.floor((totalSecondsInSol % 3600) / 60);
  const s = Math.floor(totalSecondsInSol % 60);
  return `${pad2(h)}:${pad2(m)}:${pad2(s)}`;
}

export default function MissionTimeSyncBar({
  environmentId,
  missionDay,
  telemedicineEnabled,
}: MissionTimeSyncBarProps) {
  const nowMs = useSyncExternalStore(
    subscribeClock,
    getClockSnapshot,
    getClockServerSnapshot
  );

  const env = MISSION_ENVIRONMENTS[environmentId];
  const profile = TIME_PROFILES[environmentId];

  // Cálculos seguros para SSR (cuando nowMs === 0 muestra marcadores estables)
  const isMounted = nowMs > 0;
  const earthDate = isMounted ? new Date(nowMs) : null;

  // Segundos transcurridos del día terrestre UTC actual
  const earthSecondsToday = earthDate
    ? earthDate.getUTCHours() * 3600 +
      earthDate.getUTCMinutes() * 60 +
      earthDate.getUTCSeconds()
    : 0;

  // Tiempo total acumulado de misión en segundos terrestres
  const totalMissionEarthSeconds =
    (missionDay - 1) * 86400 + earthSecondsToday;

  // Tiempo percibido por el astronauta (ajustado por escala del día local o Sol marciano)
  const astroTotalSeconds =
    totalMissionEarthSeconds * profile.timeRateMultiplier;
  const astroLocalDayCount =
    Math.floor(astroTotalSeconds / profile.localDaySeconds) + 1;
  const astroSecondsInCurrentDay =
    astroTotalSeconds % profile.localDaySeconds;

  const astroClockFormatted = !isMounted
    ? "--:--:--"
    : environmentId === "marte"
    ? formatSolHms(astroSecondsInCurrentDay)
    : formatHmsFromSeconds(astroSecondsInCurrentDay);

  const earthUtcFormatted = !isMounted
    ? "--:--:--"
    : formatHmsFromSeconds(earthSecondsToday);

  // Hora en que la Tierra recibe la señal enviada ahora por el astronauta (Tierra + latencia unidireccional)
  const earthSignalArrivalFormatted = !isMounted
    ? "--:--:--"
    : formatHmsFromSeconds(earthSecondsToday + env.commLatencySeconds);

  const roundTripSeconds = env.commLatencySeconds * 2;
  const roundTripFormatted =
    roundTripSeconds < 60
      ? `${roundTripSeconds.toFixed(1)} s`
      : `${(roundTripSeconds / 60).toFixed(1)} min`;

  return (
    <section
      aria-label="Sincronización Temporal Astronauta vs Tierra"
      className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-[0_6px_24px_rgba(15,23,42,0.04)] sm:p-5"
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-[#1a73e8]">
            <Clock className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Cronometría de Misión: Percepción del Astronauta vs. Tierra
            </h2>
            <p className="text-[11px] text-slate-500">
              Comparativa en vivo de reloj biológico/orbital, latencia de señal y dilatación temporal ({env.shortName})
            </p>
          </div>
        </div>

        <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50/80 px-2.5 py-1 font-mono-hud text-[11px] font-semibold text-indigo-700">
          <Sparkles className="h-3.5 w-3.5" />
          {profile.relativisticDailyOffsetText}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {/* 1. Reloj del Astronauta */}
        <div className="rounded-xl border border-blue-200/80 bg-gradient-to-br from-blue-50/70 to-slate-50 p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#1a73e8]">
              Tiempo del Astronauta
            </span>
            <span className="rounded-md bg-blue-100/80 px-2 py-0.5 font-mono-hud text-[10px] font-bold text-blue-800">
              {profile.localDayUnit} #{astroLocalDayCount}
            </span>
          </div>
          <div className="mt-1.5 font-mono-hud text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            {astroClockFormatted}
          </div>
          <p className="mt-1 text-[11px] font-medium text-slate-700">
            {profile.astronautZoneLabel}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500">
            {profile.cycleNote}
          </p>
        </div>

        {/* 2. Desfase de Percepción / Señal (Ida y Vuelta) */}
        <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/80 p-3.5">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-600">
              <Radio className="h-3.5 w-3.5 text-amber-600" />
              Desfase de Percepción y Señal
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                telemedicineEnabled
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              {telemedicineEnabled ? "Enlace Activo" : "Modo Autónomo"}
            </span>
          </div>

          <div className="my-2 grid grid-cols-2 gap-2 text-center">
            <div className="rounded-lg border border-slate-200/80 bg-white p-2">
              <div className="text-[10px] font-semibold uppercase text-slate-400">
                Latencia Unidireccional
              </div>
              <div className="font-mono-hud text-sm font-bold text-slate-800">
                {env.commLatencyLabel}
              </div>
            </div>
            <div className="rounded-lg border border-slate-200/80 bg-white p-2">
              <div className="text-[10px] font-semibold uppercase text-slate-400">
                Respuesta Tierra (RTT)
              </div>
              <div className="font-mono-hud text-sm font-bold text-amber-700">
                {roundTripFormatted}
              </div>
            </div>
          </div>

          <p className="text-[11px] text-slate-500">
            Una alerta emitida ahora por el astronauta llega a Houston a las{" "}
            <span className="font-mono-hud font-semibold text-slate-800">
              {earthSignalArrivalFormatted} UTC
            </span>
            .
          </p>
        </div>

        {/* 3. Reloj en la Tierra */}
        <div className="rounded-xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/60 to-slate-50 p-3.5">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-800">
              <Globe className="h-3.5 w-3.5 text-emerald-600" />
              Tiempo en la Tierra
            </span>
            <span className="rounded-md bg-emerald-100/80 px-2 py-0.5 font-mono-hud text-[10px] font-bold text-emerald-800">
              Día Terrestre #{missionDay}
            </span>
          </div>
          <div className="mt-1.5 font-mono-hud text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            {earthUtcFormatted}{" "}
            <span className="text-sm font-bold text-emerald-700">UTC</span>
          </div>
          <p className="mt-1 text-[11px] font-medium text-slate-700">
            Control de Misión · NASA Johnson Space Center (Houston)
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500">
            Referencia circadiana estándar de 24h 00m 00s (1.0 g terrestre)
          </p>
        </div>
      </div>
    </section>
  );
}