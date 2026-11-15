"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Compass,
  Globe,
  Mic,
  MicOff,
  Orbit,
  Radio,
  Rocket,
  RotateCcw,
  ScanLine,
  Send,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { MISSION_ENVIRONMENTS } from "@/data/missionData";
import {
  BiomarkerData,
  HealthStatus,
  MissionEnvironmentId,
  SystemZoneId,
} from "@/types/astronaut";
import { NavSectionId } from "./LeftNavSidebar";

interface SpeechRecognitionAlternativeLike {
  transcript: string;
}

interface SpeechRecognitionResultLike {
  0: SpeechRecognitionAlternativeLike;
  isFinal?: boolean;
}

interface SpeechRecognitionEventLike {
  results: ArrayLike<SpeechRecognitionResultLike>;
}

interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  continuous: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

interface TopMissionBarProps {
  environmentId: MissionEnvironmentId;
  telemedicineEnabled: boolean;
  missionDay: number;
  astronautName: string;
  dailyRadiationMsv: number;
  readinessScore: number;
  emergencyMode: boolean;
  zoneStatuses: Record<SystemZoneId, HealthStatus>;
  biomarkers?: BiomarkerData;
  activeSection: NavSectionId;
  onNavigateSection: (section: NavSectionId) => void;
  onSelectEnvironment: (envId: MissionEnvironmentId) => void;
  onToggleTelemedicine: () => void;
  onOpenScanModal: () => void;
  onInspectProtocol: (zone: SystemZoneId) => void;
  onResetMission: () => void;
}

const ZONE_FRIENDLY_NAMES: Record<SystemZoneId, string> = {
  cerebro: "Mente y Descanso",
  rostro: "Rostro y Postura",
  corazon: "Corazón y Aire",
  endocrino: "Defensas y Sueño",
  abdomen: "Agua y Energía",
  musculo: "Músculos y Huesos",
};

const ENV_SHORT_LABELS: Record<MissionEnvironmentId, string> = {
  iss: "Estación (0g)",
  nave: "Viaje (0g)",
  luna: "Luna (0.16g)",
  marte: "Marte (0.38g)",
};

const ENV_ICONS: Record<MissionEnvironmentId, React.ReactNode> = {
  iss: <Orbit className="h-3.5 w-3.5" />,
  nave: <Rocket className="h-3.5 w-3.5" />,
  luna: <Globe className="h-3.5 w-3.5" />,
  marte: <Compass className="h-3.5 w-3.5" />,
};

export default function TopMissionBar({
  environmentId,
  telemedicineEnabled,
  missionDay,
  astronautName,
  dailyRadiationMsv,
  readinessScore,
  emergencyMode,
  zoneStatuses,
  biomarkers,
  activeSection,
  onNavigateSection,
  onSelectEnvironment,
  onToggleTelemedicine,
  onOpenScanModal,
  onInspectProtocol,
  onResetMission,
}: TopMissionBarProps) {
  const env = MISSION_ENVIRONMENTS[environmentId];
  const [utcTime, setUtcTime] = useState<string>("08:42:19 UTC");
  const [speaking, setSpeaking] = useState(false);
  const [astroOpen, setAstroOpen] = useState(false);
  const [listening, setListening] = useState(false);
  const [astroInput, setAstroInput] = useState("");
  const [lastUserQuery, setLastUserQuery] = useState<string>(
    "Astro, ¿cómo están mis signos vitales?"
  );
  const [astroReply, setAstroReply] = useState<string>(
    "Hola, soy ASTRO, tu asistente de voz a bordo. Pregúntame por tus signos vitales (corazón, oxígeno, presión, temperatura, radiación) o pídeme cambiar de sección (Monitor, Escáner, Arnés 3N, Signos, Hábitos o Ciencia)."
  );
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  const criticalZones = (
    Object.entries(zoneStatuses) as [SystemZoneId, HealthStatus][]
  )
    .filter(([, status]) => status === "critical")
    .map(([zone]) => zone);

  const warningZones = (
    Object.entries(zoneStatuses) as [SystemZoneId, HealthStatus][]
  )
    .filter(([, status]) => status === "warning")
    .map(([zone]) => zone);

  const overallRiskStatus: HealthStatus =
    emergencyMode || criticalZones.length > 0
      ? "critical"
      : warningZones.length > 0
      ? "warning"
      : "optimal";

  const isLowLatency = env.commLatencySeconds < 60;
  const primaryCriticalZone: SystemZoneId = criticalZones[0] ?? "corazon";
  const primaryWarningZone: SystemZoneId = warningZones[0] ?? "cerebro";

  useEffect(() => {
    const updateClock = () => {
      setUtcTime(`${new Date().toISOString().slice(11, 19)} UTC`);
    };
    updateClock();
    const timer = window.setInterval(updateClock, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const speakAstroText = (text: string) => {
    setAstroReply(text);
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "es-ES";
    utterance.rate = 1.03;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const processAstroCommand = (rawCommand: string) => {
    const clean = rawCommand.trim();
    if (!clean) return;
    setLastUserQuery(clean);

    const q = clean
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    const b = biomarkers;
    const shieldPct = Math.max(
      10,
      Math.min(100, Math.round(100 - (dailyRadiationMsv / 2.2) * 100))
    );

    // 1. Navegación por secciones o zonas cuando el usuario pide ir/abrir/mostrar/cambiar
    if (
      q.includes("arnes") ||
      q.includes("traje") ||
      q.includes("chaleco") ||
      q.includes("sensores") ||
      q.includes("wearable")
    ) {
      onNavigateSection("wearable");
      speakAstroText(
        `Claro, abriendo la sección de tu Traje de Sensores Arnés 3N. Aquí ves los 13 signos continuos en tus 3 nodos corporales.`
      );
      return;
    }

    if (
      q.includes("ciencia") ||
      q.includes("referencia") ||
      q.includes("fuente") ||
      q.includes("estudio")
    ) {
      onNavigateSection("referencias");
      speakAstroText(
        `Abriendo la sección de Ciencia con los 5 peligros espaciales de la NASA y las 16 fuentes verificadas.`
      );
      return;
    }

    if (
      q.includes("habito") ||
      q.includes("informe") ||
      q.includes("grafica") ||
      q.includes("evolucion") ||
      q.includes("ejercicio")
    ) {
      onNavigateSection("informes");
      speakAstroText(
        `Mostrando la sección de Hábitos y gráficas de evolución para mantener tu cuerpo fuerte en el espacio.`
      );
      return;
    }

    if (q.includes("camara") || q.includes("manual") || q.includes("ajustar")) {
      onOpenScanModal();
      speakAstroText(
        `Abriendo la ventana de Cámara y Registro Manual para que actualices tu evaluación.`
      );
      return;
    }

    if (
      q.includes("escaner") ||
      q.includes("mapa") ||
      q.includes("protocolo") ||
      q.includes("instrucciones") ||
      q.includes("anatom")
    ) {
      if (q.includes("corazon")) {
        onInspectProtocol("corazon");
      } else if (q.includes("rostro") || q.includes("cara")) {
        onInspectProtocol("rostro");
      } else if (q.includes("abdomen") || q.includes("energia")) {
        onInspectProtocol("abdomen");
      } else if (q.includes("musculo") || q.includes("hueso")) {
        onInspectProtocol("musculo");
      } else if (q.includes("defensa") || q.includes("endocrino")) {
        onInspectProtocol("endocrino");
      } else {
        onNavigateSection("escaner");
      }
      speakAstroText(
        `Abriendo el Escáner Anatómico y el Manual de Instrucciones Clínico paso a paso.`
      );
      return;
    }

    if (
      q.includes("monitor") ||
      q.includes("inicio") ||
      q.includes("principal") ||
      q.includes("panel general")
    ) {
      onNavigateSection("resumen");
      speakAstroText(
        `Volviendo al Monitor Principal de misión. Tu bienestar general es del ${readinessScore} por ciento.`
      );
      return;
    }

    if (
      (q.includes("ir a") ||
        q.includes("abre") ||
        q.includes("abrir") ||
        q.includes("ver") ||
        q.includes("muestra") ||
        q.includes("seccion") ||
        q.includes("cambia")) &&
      (q.includes("signos") ||
        q.includes("biomarcador") ||
        q.includes("animo") ||
        q.includes("rutina") ||
        q.includes("horario"))
    ) {
      onNavigateSection("biomarcadores");
      speakAstroText(
        `Abriendo la sección de Signos, Ánimo y Horarios del día.`
      );
      return;
    }

    // 2. Cambio de entorno gravitatorio por voz
    if (q.includes("marte")) {
      onSelectEnvironment("marte");
      speakAstroText(
        `Entorno cambiado a Marte con gravedad de 0.38 g. Recuerda calibrar el medidor de presión del Arnés 3N.`
      );
      return;
    }
    if (q.includes("luna")) {
      onSelectEnvironment("luna");
      speakAstroText(
        `Entorno cambiado a la Luna con gravedad de 0.16 g.`
      );
      return;
    }
    if (q.includes("estacion") || q.includes("iss")) {
      onSelectEnvironment("iss");
      speakAstroText(
        `Entorno cambiado a la Estación Espacial en microgravedad cero g.`
      );
      return;
    }
    if (q.includes("viaje") || q.includes("transito")) {
      onSelectEnvironment("nave");
      speakAstroText(
        `Entorno cambiado a Viaje espacial profundo en cero g.`
      );
      return;
    }

    // 3. Consultas de signos vitales específicos
    if (b) {
      if (
        q.includes("corazon") ||
        q.includes("latido") ||
        q.includes("pulso") ||
        q.includes("cardiac")
      ) {
        const restPct = Math.min(100, Math.round((b.hrvRmssdMs / 60) * 100));
        speakAstroText(
          `Soy ASTRO. Tu corazón late a ${b.bpm} latidos por minuto y su nivel de descanso está al ${restPct} por ciento (${b.hrvRmssdMs} milisegundos). ${
            b.bpm <= 92 && b.bpm >= 52
              ? "El ritmo es tranquilo y parejo."
              : "Te recomiendo respirar lento y descansar unos minutos."
          }`
        );
        return;
      }

      if (
        q.includes("oxigeno") ||
        q.includes("aire") ||
        q.includes("saturacion")
      ) {
        speakAstroText(
          `Soy ASTRO. Tu oxígeno en sangre medido en la frente es del ${b.spo2Percent} por ciento, con una fuerza de pulso de ${b.perfusionIndex.toFixed(
            1
          )} por ciento. Llega suficiente aire a tu cuerpo.`
        );
        return;
      }

      if (q.includes("presion") || q.includes("sangre") || q.includes("circulacion")) {
        speakAstroText(
          `Soy ASTRO. Tu presión arterial medida sin manguito por el Arnés 3N es de ${b.systolicBP} sobre ${b.diastolicBP} milímetros de mercurio, con paso de pulso de ${b.pttMs} milisegundos.`
        );
        return;
      }

      if (q.includes("respiracion") || q.includes("respiro") || q.includes("pulmon")) {
        speakAstroText(
          `Soy ASTRO. Estás respirando ${b.respiratoryRateRpm} veces por minuto y entran ${b.minuteVentilationLpm.toFixed(
            1
          )} litros de aire por minuto a tu pecho.`
        );
        return;
      }

      if (
        q.includes("temperatura") ||
        q.includes("calor") ||
        q.includes("fiebre") ||
        q.includes("agua") ||
        q.includes("hidratacion")
      ) {
        speakAstroText(
          `Soy ASTRO. Tu temperatura interna es de ${b.bodyTempC.toFixed(
            1
          )} grados centígrados y en la piel de ${b.skinTempC.toFixed(
            1
          )} grados. Tu hidratación está al ${b.hydrationPercent} por ciento.`
        );
        return;
      }

      if (q.includes("radiacion") || q.includes("escudo")) {
        speakAstroText(
          `Soy ASTRO. El escudo de la nave te da un ${shieldPct} por ciento de protección hoy, con una lectura de ${dailyRadiationMsv.toFixed(
            2
          )} milisieverts por día.`
        );
        return;
      }

      if (q.includes("sueno") || q.includes("dormir") || q.includes("descanso")) {
        speakAstroText(
          `Soy ASTRO. Dormiste ${b.sleepHours.toFixed(
            1
          )} horas y tu postura corporal está al ${b.postureScore} por ciento.`
        );
        return;
      }
    }

    // 4. Respuesta general de signos vitales (por defecto o cuando pregunta "¿cómo están mis signos?")
    const criticalCount = Object.values(zoneStatuses).filter(
      (s) => s === "critical"
    ).length;
    const summaryText = b
      ? `Hola ${astronautName}, soy ASTRO. En el día ${missionDay} en ${env.shortName}, tu salud general está al ${readinessScore} por ciento. Corazón: ${b.bpm} latidos por minuto. Oxígeno: ${b.spo2Percent} por ciento. Presión: ${b.systolicBP} sobre ${b.diastolicBP}. Temperatura: ${b.bodyTempC.toFixed(1)} grados. Escudo de radiación: ${shieldPct} por ciento seguro. ${
          criticalCount > 0
            ? `Atención: hay ${criticalCount} zona en nivel crítico; te recomiendo abrir el Escáner.`
            : "Todos tus sistemas principales están en buen estado."
        }`
      : `Hola, soy ASTRO. Día ${missionDay}, salud general al ${readinessScore} por ciento.`;

    speakAstroText(summaryText);
  };

  const handleToggleListening = () => {
    if (listening && recognitionRef.current) {
      recognitionRef.current.stop();
      setListening(false);
      return;
    }

    if (typeof window === "undefined") return;
    const win = window as unknown as {
      SpeechRecognition?: SpeechRecognitionConstructor;
      webkitSpeechRecognition?: SpeechRecognitionConstructor;
    };
    const SpeechRec = win.SpeechRecognition ?? win.webkitSpeechRecognition;

    if (!SpeechRec) {
      speakAstroText(
        "Tu navegador no tiene micrófono de voz directo, pero puedes tocar cualquiera de las preguntas rápidas o escribirme aquí abajo."
      );
      return;
    }

    try {
      if ( "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        setSpeaking(false);
      }
      const recognition = new SpeechRec();
      recognition.lang = "es-ES";
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognition.continuous = false;

      recognition.onresult = (event: SpeechRecognitionEventLike) => {
        const transcript = event.results?.[0]?.[0]?.transcript ?? "";
        setListening(false);
        if (transcript) {
          processAstroCommand(transcript);
        }
      };

      recognition.onerror = () => {
        setListening(false);
      };

      recognition.onend = () => {
        setListening(false);
      };

      recognitionRef.current = recognition;
      setListening(true);
      recognition.start();
    } catch {
      setListening(false);
    }
  };

  return (
    <header
      className={`border-b bg-[#050a14] text-white transition-colors ${
        overallRiskStatus === "critical"
          ? "border-red-500 bg-red-950/90"
          : overallRiskStatus === "warning"
          ? "border-amber-500/60 bg-[#050a14]"
          : "border-[#182742]"
      }`}
    >
      <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-2.5 px-4 py-2.5 sm:px-6">
        {/* Left: Brand + Crew + Environment Switcher */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span
              className={`flex h-8 w-8 items-center justify-center rounded-lg border ${
                overallRiskStatus === "critical"
                  ? "animate-pulse border-red-400 bg-red-600 text-white"
                  : overallRiskStatus === "warning"
                  ? "border-amber-400/50 bg-amber-500/20 text-amber-300"
                  : "border-sky-400/40 bg-sky-500/20 text-sky-300"
              }`}
            >
              <Activity className="h-4 w-4" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono-hud text-sm font-bold tracking-wider text-slate-100">
                  ASTRO-MED <span className="text-sky-400">SALUD</span>
                </span>
                <span className="rounded border border-sky-500/30 bg-sky-500/10 px-1.5 py-0.5 font-mono-hud text-[10px] font-semibold text-sky-300">
                  DÍA {missionDay}
                </span>
              </div>
              <div className="text-[11px] text-slate-400">
                {astronautName} · Monitoreo fácil en vivo
              </div>
            </div>
          </div>

          <span className="hidden h-5 w-px bg-[#182742] lg:inline-block" />

          {/* Compact Segmented Environment Selector */}
          <div className="flex flex-wrap items-center gap-1 rounded-xl border border-[#182742] bg-[#091120] p-1">
            {(Object.keys(MISSION_ENVIRONMENTS) as MissionEnvironmentId[]).map(
              (id) => {
                const isActive = id === environmentId;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => onSelectEnvironment(id)}
                    className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition ${
                      isActive
                        ? "border border-sky-400/40 bg-sky-500/20 text-sky-300 shadow-xs"
                        : "text-slate-400 hover:bg-[#111e36] hover:text-slate-100"
                    }`}
                  >
                    {ENV_ICONS[id]}
                    <span>{ENV_SHORT_LABELS[id]}</span>
                  </button>
                );
              }
            )}
          </div>

          {/* Inline Physics Readout */}
          <div className="hidden items-center gap-3 font-mono-hud text-[11px] text-blue-100/85 xl:flex">
            <span>{env.gravityLabel.split(" ")[0]}</span>
            <span className="text-white/25">·</span>
            <button
              type="button"
              onClick={onToggleTelemedicine}
              className="cursor-pointer hover:text-white"
              title="Cambiar conexión con médicos en Tierra"
            >
              Tierra:{" "}
              <strong
                className={
                  telemedicineEnabled ? "text-emerald-300" : "text-amber-300"
                }
              >
                {telemedicineEnabled ? env.commLatencyLabel.split(" ")[0] : "SIN SEÑAL (LOCAL)"}
              </strong>
            </button>
          </div>
        </div>

        {/* Right: UTC Clock + Operational Console Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="hidden rounded-lg border border-white/10 bg-slate-950/40 px-2.5 py-1 font-mono-hud text-xs font-semibold text-cyan-300 sm:inline-block">
            {utcTime}
          </span>

          <button
            type="button"
            onClick={() => setAstroOpen((prev) => !prev)}
            className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-bold transition ${
              listening
                ? "animate-pulse border-cyan-300 bg-cyan-500 text-slate-950"
                : astroOpen || speaking
                ? "border-cyan-400/70 bg-cyan-500/20 text-cyan-200"
                : "border-cyan-500/35 bg-cyan-500/10 text-cyan-200 hover:bg-cyan-500/20"
            }`}
            title="Asistente de voz ASTRO: pregúntale tus signos vitales o pídele cambiar de sección"
          >
            {listening ? (
              <>
                <Mic className="h-3.5 w-3.5" />
                <span>ASTRO Escuchando...</span>
              </>
            ) : speaking ? (
              <>
                <Volume2 className="h-3.5 w-3.5 text-cyan-300" />
                <span>ASTRO Hablando...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5 text-cyan-300" />
                <span>Asistente ASTRO</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onOpenScanModal}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-[#1a73e8] px-3 py-1.5 text-xs font-bold text-white transition hover:bg-blue-600"
          >
            <ScanLine className="h-3.5 w-3.5" />
            <span>Revisar / Ajustar</span>
          </button>

          {/* Indicador Clínico Automático de Nivel de Peligro */}
          {overallRiskStatus === "optimal" && (
            <div
              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/35 bg-emerald-500/10 px-2.5 py-1.5 text-xs font-semibold text-emerald-300"
              title="Detección automática: todos los signos dentro de rango seguro"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              <span>Estado: Normal</span>
            </div>
          )}

          {overallRiskStatus === "warning" && (
            <button
              type="button"
              onClick={() => onInspectProtocol(primaryWarningZone)}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-amber-400/60 bg-amber-500/20 px-3 py-1.5 text-xs font-bold text-amber-300 transition hover:bg-amber-500/30"
              title="Parámetros en precaución detectados automáticamente"
            >
              <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
              <span>Precaución ({warningZones.length})</span>
            </button>
          )}

          {overallRiskStatus === "critical" && (
            <button
              type="button"
              onClick={() => onInspectProtocol(primaryCriticalZone)}
              className="inline-flex animate-pulse cursor-pointer items-center gap-1.5 rounded-lg border border-red-400 bg-red-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-red-700"
              title="Nivel crítico detectado automáticamente"
            >
              <ShieldAlert className="h-3.5 w-3.5" />
              <span>Peligro Crítico ({Math.max(1, criticalZones.length)})</span>
            </button>
          )}

          <button
            type="button"
            onClick={onResetMission}
            title="Reiniciar misión a valores nominales"
            className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-white/15 bg-white/5 p-1.5 text-blue-200 transition hover:bg-white/15 hover:text-white"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Consola Interactiva del Asistente de Voz ASTRO */}
      {astroOpen && (
        <div className="border-t border-cyan-500/35 bg-[#081225] px-4 py-3 text-xs text-slate-100 shadow-xl sm:px-6">
          <div className="mx-auto max-w-[1600px] space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-cyan-400/40 bg-cyan-500/20 text-cyan-300">
                  <Sparkles className="h-4 w-4" />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono-hud text-xs font-bold tracking-wider text-cyan-300">
                      ASTRO · ASISTENTE DE VOZ DE CABINA (0g)
                    </span>
                    <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-mono-hud text-[10px] text-emerald-300">
                      Sección actual: {activeSection.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Háblale con el micrófono, escribe tu consulta o toca un comando rápido para escuchar tus signos o cambiar de sección.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleToggleListening}
                  className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold transition ${
                    listening
                      ? "animate-pulse border-red-400 bg-red-600 text-white"
                      : "border-cyan-400/50 bg-cyan-500 text-slate-950 hover:bg-cyan-400"
                  }`}
                >
                  {listening ? (
                    <>
                      <MicOff className="h-3.5 w-3.5" />
                      <span>Detener Micrófono</span>
                    </>
                  ) : (
                    <>
                      <Mic className="h-3.5 w-3.5" />
                      <span>Hablar con ASTRO</span>
                    </>
                  )}
                </button>

                {speaking && (
                  <button
                    type="button"
                    onClick={() => {
                      if (typeof window !== "undefined" && "speechSynthesis" in window) {
                        window.speechSynthesis.cancel();
                      }
                      setSpeaking(false);
                    }}
                    className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-white/20 bg-white/10 px-2.5 py-1.5 text-xs font-semibold text-slate-200 hover:bg-white/20"
                  >
                    <VolumeX className="h-3.5 w-3.5" />
                    <span>Callar Voz</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setAstroOpen(false)}
                  className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-white/15 bg-white/5 p-1.5 text-slate-300 hover:bg-white/15 hover:text-white"
                  aria-label="Cerrar asistente ASTRO"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Respuesta en vivo de ASTRO + Entrada de voz/texto */}
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
              <div className="rounded-xl border border-[#1b3154] bg-[#0c1830] p-3 lg:col-span-7">
                <div className="flex items-center justify-between text-[11px] font-mono-hud text-slate-400">
                  <span>TÚ: &ldquo;{lastUserQuery}&rdquo;</span>
                  <button
                    type="button"
                    onClick={() => speakAstroText(astroReply)}
                    className="inline-flex cursor-pointer items-center gap-1 text-cyan-300 hover:underline"
                  >
                    <Volume2 className="h-3.5 w-3.5" />
                    Repetir en voz alta
                  </button>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed font-medium text-cyan-100">
                  <strong className="text-cyan-300">ASTRO:</strong> {astroReply}
                </p>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!astroInput.trim()) return;
                  processAstroCommand(astroInput);
                  setAstroInput("");
                }}
                className="flex flex-col justify-between gap-2 rounded-xl border border-[#1b3154] bg-[#0c1830] p-3 lg:col-span-5"
              >
                <label className="text-[11px] font-semibold text-slate-300">
                  Pregúntale a ASTRO (ej. &ldquo;Astro, ¿cómo está mi corazón?&rdquo; o &ldquo;Astro, abre Arnés 3N&rdquo;):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={astroInput}
                    onChange={(e) => setAstroInput(e.target.value)}
                    placeholder="Escribe o usa el micrófono..."
                    className="flex-1 rounded-lg border border-[#233b63] bg-[#070e1d] px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-[#1a73e8] px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-600"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>Enviar</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Comandos rápidos de voz en 1 clic: Signos Vitales y Navegación de Secciones */}
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              <span className="mr-1 font-mono-hud text-[10px] font-bold uppercase text-cyan-400">
                Preguntar Signos:
              </span>
              {[
                "Astro, ¿cómo están mis signos vitales?",
                "Astro, ¿cómo está mi corazón?",
                "Astro, ¿cuál es mi oxígeno?",
                "Astro, ¿cómo está mi presión?",
                "Astro, ¿cuál es mi temperatura?",
                "Astro, ¿cómo está el escudo de radiación?",
              ].map((cmd) => (
                <button
                  key={cmd}
                  type="button"
                  onClick={() => processAstroCommand(cmd)}
                  className="cursor-pointer rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1 text-[11px] font-medium text-cyan-200 transition hover:bg-cyan-500/25"
                >
                  {cmd.replace("Astro, ", "")}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <span className="mr-1 font-mono-hud text-[10px] font-bold uppercase text-sky-400">
                Cambiar Sección:
              </span>
              {[
                { label: "Ir a Monitor", cmd: "Astro, ir a Monitor" },
                { label: "Ir a Escáner", cmd: "Astro, abre el Escáner" },
                { label: "Ir a Arnés 3N", cmd: "Astro, abre el Arnés 3N" },
                { label: "Ir a Signos", cmd: "Astro, ver sección Signos" },
                { label: "Ir a Hábitos", cmd: "Astro, abre Hábitos" },
                { label: "Ir a Ciencia", cmd: "Astro, abre Ciencia" },
              ].map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => processAstroCommand(item.cmd)}
                  className="cursor-pointer rounded-lg border border-[#233b63] bg-[#0e1b33] px-2.5 py-1 text-[11px] font-semibold text-slate-200 transition hover:border-sky-400/50 hover:text-sky-200"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Banner Automático en Estado Precaución (Warning) */}
      {overallRiskStatus === "warning" && (
        <div
          role="status"
          className="border-t border-amber-500/40 bg-amber-500/10 px-4 py-2 text-xs text-amber-200 sm:px-6"
        >
          <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
              <div>
                <strong className="text-amber-300">
                  Aviso Preventivo Automático (
                  {warningZones.map((z) => ZONE_FRIENDLY_NAMES[z]).join(", ")}
                  ):
                </strong>{" "}
                Se recomienda <strong>consultar a Tierra</strong> (
                {telemedicineEnabled
                  ? `enlace activo · ${env.commLatencyLabel}`
                  : `modo sin red · ${env.commLatencyLabel}`}
                ) o revisar el{" "}
                <strong>Manual de Instrucciones Clínico autónomo</strong> en el
                Escáner [5].
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {!telemedicineEnabled && (
                <button
                  type="button"
                  onClick={onToggleTelemedicine}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-amber-400/50 bg-amber-500/15 px-2.5 py-1 text-[11px] font-bold text-amber-200 transition hover:bg-amber-500/25"
                >
                  <Radio className="h-3.5 w-3.5" />
                  Consultar a Tierra ({env.commLatencyLabel.split(" ")[0]})
                </button>
              )}
              <button
                type="button"
                onClick={() => onInspectProtocol(primaryWarningZone)}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-amber-400/60 bg-amber-500/25 px-2.5 py-1 text-[11px] font-bold text-amber-100 transition hover:bg-amber-500/35"
              >
                <ScanLine className="h-3.5 w-3.5" />
                Ver Manual de Instrucciones Clínico (Escáner)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Banner Automático Prioritario en Estado Muy Peligroso / Crítico */}
      {overallRiskStatus === "critical" && (
        <div
          role="alert"
          className="border-t border-red-500/60 bg-red-950/95 px-4 py-2.5 text-xs text-red-100 sm:px-6"
        >
          <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
              <div className="space-y-0.5">
                <div>
                  <strong className="text-red-300">
                    PELIGRO CRÍTICO AUTOMÁTICO (
                    {criticalZones.length > 0
                      ? criticalZones.map((z) => ZONE_FRIENDLY_NAMES[z]).join(", ")
                      : "Riesgo General"}
                    ):
                  </strong>{" "}
                  Se recomienda <strong>contactar a un médico de inmediato</strong>{" "}
                  si hay enlace activo (ISS/Luna) o seguir los{" "}
                  <strong>protocolos autónomos del Escáner Anatómico</strong> [5].
                </div>
                <div className="text-[11px] text-red-200/90">
                  {isLowLatency && telemedicineEnabled
                    ? `Enlace activo con Tierra (${env.commLatencyLabel}): comunica tus signos al Cirujano de Vuelo ahora mismo.`
                    : `Sin comunicación directa con Tierra (${env.commLatencyLabel} o modo sin red): abre el Manual de Instrucciones Clínico en "Escáner → 1. Protocolo de Examen y Acción".`}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {isLowLatency && !telemedicineEnabled && (
                <button
                  type="button"
                  onClick={onToggleTelemedicine}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-emerald-400/50 bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white transition hover:bg-emerald-500"
                >
                  <Radio className="h-3.5 w-3.5" />
                  Activar Enlace Médico ({env.commLatencyLabel.split(" ")[0]})
                </button>
              )}
              <button
                type="button"
                onClick={() => onInspectProtocol(primaryCriticalZone)}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-red-300/60 bg-red-600 px-3 py-1 text-[11px] font-bold text-white transition hover:bg-red-500"
              >
                <ScanLine className="h-3.5 w-3.5" />
                Ver Manual Clínico y Protocolos Autónomos (Escáner)
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
