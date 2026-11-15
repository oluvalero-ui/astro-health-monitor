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
  const [lastUserQuery, setLastUserQuery] = useState<string>("");
  const [astroReply, setAstroReply] = useState<string>(
    `¡Hola ${astronautName}! Soy ASTRO. ¿Qué necesitas el día de hoy?`
  );
  const [astroTargetZone, setAstroTargetZone] = useState<SystemZoneId>("corazon");
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

    // 0. Conversación racional y saludo amable ("Hola Astro, ¿cómo estás?", "Buenos días", "Gracias")
    const hasSignOrNavKeyword =
      q.includes("signo") ||
      q.includes("corazon") ||
      q.includes("latido") ||
      q.includes("pulso") ||
      q.includes("oxigeno") ||
      q.includes("presion") ||
      q.includes("respiracion") ||
      q.includes("temperatura") ||
      q.includes("fiebre") ||
      q.includes("agua") ||
      q.includes("hidratacion") ||
      q.includes("glucosa") ||
      q.includes("radiacion") ||
      q.includes("escudo") ||
      q.includes("sueno") ||
      q.includes("estres") ||
      q.includes("mente") ||
      q.includes("arnes") ||
      q.includes("escaner") ||
      q.includes("ciencia") ||
      q.includes("habito") ||
      q.includes("monitor") ||
      q.includes("camara");

    if (
      !hasSignOrNavKeyword &&
      (q.includes("como estas") ||
        q.includes("que tal") ||
        q.includes("hola") ||
        q.includes("buenos dias") ||
        q.includes("buenas tardes") ||
        q.includes("buenas noches") ||
        q.includes("quien eres"))
    ) {
      speakAstroText(
        `¡Hola ${astronautName}! Estoy muy bien, con mis sistemas de telemetría al 100 por ciento en ${env.shortName}. Tu bienestar general se encuentra al ${readinessScore} por ciento. ¿Qué necesitas el día de hoy?`
      );
      return;
    }

    if (
      !hasSignOrNavKeyword &&
      (q.includes("gracias") || q.includes("perfecto") || q.includes("listo"))
    ) {
      speakAstroText(
        `Con todo gusto, ${astronautName}. Sigo monitoreando tu Arnés 3N en tiempo real. ¿Qué necesitas el día de hoy?`
      );
      return;
    }

    // 1. Comando clave: "Astro dime el estado de mis signos" (y variantes de resumen de signos)
    if (
      q.includes("estado de mis signos") ||
      q.includes("como estan mis signos") ||
      q.includes("dime mis signos") ||
      q.includes("resumen de mis signos") ||
      q.includes("mis signos vitales") ||
      q.includes("estado general")
    ) {
      const criticalCount = criticalZones.length;
      const warningCount = warningZones.length;

      if (criticalCount > 0) {
        setAstroTargetZone(primaryCriticalZone);
        onInspectProtocol(primaryCriticalZone);
      } else {
        setAstroTargetZone(primaryWarningZone);
        onNavigateSection("biomarcadores");
      }

      const summaryText = b
        ? `Claro ${astronautName}, te traslado a la sección de Signos. En el día ${missionDay} (${env.shortName}), tu estado general es del ${readinessScore} por ciento. Corazón: ${b.bpm} latidos por minuto. Oxígeno: ${b.spo2Percent} por ciento. Presión: ${b.systolicBP} sobre ${b.diastolicBP}. Respiración: ${b.respiratoryRateRpm} por minuto. Temperatura: ${b.bodyTempC.toFixed(
            1
          )} grados. Hidratación: ${b.hydrationPercent} por ciento y Escudo de Radiación al ${shieldPct} por ciento. ${
            criticalCount > 0
              ? `Atención: detecto ${criticalCount} zona en peligro crítico (${ZONE_FRIENDLY_NAMES[primaryCriticalZone]}); te abrí el protocolo de emergencia en el Escáner y te recomiendo contactar al médico de inmediato.`
              : warningCount > 0
              ? `Nota preventiva: tienes ${warningCount} zona en precaución (${ZONE_FRIENDLY_NAMES[primaryWarningZone]}). Te recomiendo hidratarte con 300 mililitros de agua, hacer 5 minutos de respiración lenta y revisar el manual clínico.`
              : `Todos tus signos están en rango óptimo; te recomiendo mantener tu hidratación constante y tu sesión diaria de ejercicio.`
          } ¿Qué necesitas el día de hoy?`
        : `Tu estado general es del ${readinessScore} por ciento y te he trasladado a la sección de Signos. ¿Qué necesitas el día de hoy?`;

      speakAstroText(summaryText);
      return;
    }

    // 2. Navegación explícita por secciones cuando el usuario pide ir/abrir/mostrar/cambiar
    if (
      q.includes("arnes") ||
      q.includes("traje") ||
      q.includes("chaleco") ||
      q.includes("sensores") ||
      q.includes("wearable")
    ) {
      onNavigateSection("wearable");
      speakAstroText(
        `Claro, te traslado a la sección de tu Traje de Sensores Arnés 3N. Aquí puedes revisar los 13 signos continuos en tus 3 nodos corporales. ¿Qué necesitas el día de hoy?`
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
        `Te traslado a la sección de Ciencia con los 5 peligros espaciales de la NASA y las 16 fuentes clínicas verificadas. ¿Qué necesitas el día de hoy?`
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
        `Abriendo la sección de Hábitos y evolución clínica para mantener tu cuerpo fuerte en el espacio. ¿Qué necesitas el día de hoy?`
      );
      return;
    }

    if (q.includes("camara") || q.includes("manual") || q.includes("ajustar")) {
      onOpenScanModal();
      speakAstroText(
        `Abriendo la ventana de Cámara y Registro Manual para que actualices tu evaluación. ¿Qué necesitas el día de hoy?`
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
        setAstroTargetZone("corazon");
        onInspectProtocol("corazon");
      } else if (q.includes("rostro") || q.includes("cara")) {
        setAstroTargetZone("rostro");
        onInspectProtocol("rostro");
      } else if (q.includes("abdomen") || q.includes("energia")) {
        setAstroTargetZone("abdomen");
        onInspectProtocol("abdomen");
      } else if (q.includes("musculo") || q.includes("hueso")) {
        setAstroTargetZone("musculo");
        onInspectProtocol("musculo");
      } else if (q.includes("defensa") || q.includes("endocrino")) {
        setAstroTargetZone("endocrino");
        onInspectProtocol("endocrino");
      } else {
        onNavigateSection("escaner");
      }
      speakAstroText(
        `Te he trasladado al Escáner Anatómico con el Manual de Instrucciones Clínico y recomendaciones paso a paso. ¿Qué necesitas el día de hoy?`
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
        `Volviendo al Monitor Principal de misión. Tu bienestar general es del ${readinessScore} por ciento. ¿Qué necesitas el día de hoy?`
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
        `Te traslado a la sección de Signos, Ánimo y Horarios del día. ¿Qué necesitas el día de hoy?`
      );
      return;
    }

    // 3. Cambio de entorno gravitatorio por voz
    if (q.includes("marte")) {
      onSelectEnvironment("marte");
      speakAstroText(
        `Entorno cambiado a Marte con gravedad de 0.38 g. Te recomiendo calibrar el nodo de muñeca del Arnés 3N al nivel del corazón. ¿Qué necesitas el día de hoy?`
      );
      return;
    }
    if (q.includes("luna")) {
      onSelectEnvironment("luna");
      speakAstroText(
        `Entorno cambiado a la Luna con gravedad de 0.16 g. ¿Qué necesitas el día de hoy?`
      );
      return;
    }
    if (q.includes("estacion") || q.includes("iss")) {
      onSelectEnvironment("iss");
      speakAstroText(
        `Entorno cambiado a la Estación Espacial en microgravedad cero g. ¿Qué necesitas el día de hoy?`
      );
      return;
    }
    if (q.includes("viaje") || q.includes("transito")) {
      onSelectEnvironment("nave");
      speakAstroText(
        `Entorno cambiado a Viaje espacial profundo en cero g. ¿Qué necesitas el día de hoy?`
      );
      return;
    }

    // 4. Consultas de signos vitales específicos: lectura + recomendación + traslado automático a la sección
    if (b) {
      if (
        q.includes("corazon") ||
        q.includes("latido") ||
        q.includes("pulso") ||
        q.includes("cardiac") ||
        q.includes("hrv")
      ) {
        const restPct = Math.min(100, Math.round((b.hrvRmssdMs / 60) * 100));
        setAstroTargetZone("corazon");
        if (zoneStatuses.corazon !== "optimal") {
          onInspectProtocol("corazon");
        } else {
          onNavigateSection("biomarcadores");
        }
        const rec =
          b.bpm <= 92 && b.bpm >= 52 && b.hrvRmssdMs >= 38
            ? "Estado Bien: tu ritmo es tranquilo y parejo. Recomendación: mantén tu rutina aeróbica de 30 minutos y evita estimulantes antes de dormir."
            : "Estado a Cuidar: notamos mayor carga cardíaca. Recomendación: haz 5 minutos de respiración lenta (inhalando 4 segundos y exhalando 6), bebe 250 mililitros de agua y revisa el protocolo de Corazón.";
        speakAstroText(
          `Tu corazón late a ${b.bpm} latidos por minuto y su descanso cardíaco está al ${restPct} por ciento (${b.hrvRmssdMs} milisegundos). ${rec} Te he trasladado a la sección donde se encuentra este signo. ¿Qué necesitas el día de hoy?`
        );
        return;
      }

      if (
        q.includes("oxigeno") ||
        q.includes("saturacion") ||
        q.includes("spo2")
      ) {
        setAstroTargetZone("corazon");
        onNavigateSection("biomarcadores");
        const rec =
          b.spo2Percent >= 95
            ? "Estado Bien: llega suficiente aire a tu cuerpo. Recomendación: mantén la banda frontal limpia y continúa tus actividades con normalidad."
            : "Estado a Cuidar: oxigenación por debajo de lo ideal. Recomendación: realiza 10 respiraciones profundas, verifica la ventilación del módulo y consulta el protocolo cardiorrespiratorio.";
        speakAstroText(
          `Tu oxígeno en sangre medido en la frente es del ${b.spo2Percent} por ciento, con fuerza de pulso de ${b.perfusionIndex.toFixed(
            1
          )} por ciento. ${rec} Te he llevado a la sección de Signos para que lo veas en detalle. ¿Qué necesitas el día de hoy?`
        );
        return;
      }

      if (q.includes("presion") || q.includes("sangre") || q.includes("circulacion")) {
        setAstroTargetZone("corazon");
        if (b.systolicBP >= 135 || b.systolicBP < 95) {
          onInspectProtocol("corazon");
        } else {
          onNavigateSection("biomarcadores");
        }
        const rec =
          b.systolicBP < 135 && b.systolicBP >= 95
            ? "Estado Bien: la sangre circula con fuerza normal hacia tu cabeza y cuerpo. Recomendación: mantén buena hidratación y bajo consumo de sodio liofilizado."
            : "Estado a Cuidar: presión fuera del rango ideal. Recomendación: reposa 10 minutos en postura neutra, hidrátate y verifica la calibración del nodo de muñeca al nivel del corazón.";
        speakAstroText(
          `Tu presión arterial sin manguito es de ${b.systolicBP} sobre ${b.diastolicBP} milímetros de mercurio (velocidad de pulso ${b.pttMs} milisegundos). ${rec} Ya te trasladé a la sección correspondiente. ¿Qué necesitas el día de hoy?`
        );
        return;
      }

      if (q.includes("respiracion") || q.includes("respiro") || q.includes("pulmon")) {
        setAstroTargetZone("corazon");
        onNavigateSection("biomarcadores");
        const rec =
          b.respiratoryRateRpm >= 10 && b.respiratoryRateRpm <= 19
            ? "Estado Bien: respiración tranquila y constante. Recomendación: conserva tu ritmo respiratorio nasal durante las tareas de cabina."
            : "Estado a Cuidar: respiración acelerada. Recomendación: practica respiración cuadrada de 4 segundos por fase durante 3 minutos y verifica el nivel de CO2 ambiental.";
        speakAstroText(
          `Estás respirando ${b.respiratoryRateRpm} veces por minuto y entran ${b.minuteVentilationLpm.toFixed(
            1
          )} litros de aire por minuto a tu pecho. ${rec} Te trasladé a la sección de Signos donde puedes monitorearlo. ¿Qué necesitas el día de hoy?`
        );
        return;
      }

      if (
        q.includes("temperatura") ||
        q.includes("calor") ||
        q.includes("fiebre")
      ) {
        setAstroTargetZone("endocrino");
        onNavigateSection("biomarcadores");
        const rec =
          b.bodyTempC >= 36.0 && b.bodyTempC <= 37.4
            ? "Estado Bien: temperatura corporal en equilibrio óptimo. Recomendación: mantén la ventilación térmica de tu traje e hidrátate cada 2 horas."
            : "Estado a Cuidar: variación térmica detectada. Recomendación: bebe 400 mililitros de agua fresca, disminuye la carga física por 20 minutos y vuelve a medir.";
        speakAstroText(
          `Tu temperatura interna es de ${b.bodyTempC.toFixed(
            1
          )} grados centígrados y en la piel es de ${b.skinTempC.toFixed(
            1
          )} grados. ${rec} Te he trasladado a la sección de Signos. ¿Qué necesitas el día de hoy?`
        );
        return;
      }

      if (
        q.includes("agua") ||
        q.includes("hidratacion") ||
        q.includes("glucosa") ||
        q.includes("azucar") ||
        q.includes("energia") ||
        q.includes("abdomen")
      ) {
        setAstroTargetZone("abdomen");
        if (b.hydrationPercent < 72 || b.bloodGlucoseMgDl > 125) {
          onInspectProtocol("abdomen");
        } else {
          onNavigateSection("biomarcadores");
        }
        const rec =
          b.hydrationPercent >= 75 &&
          b.bloodGlucoseMgDl >= 75 &&
          b.bloodGlucoseMgDl <= 115
            ? "Estado Bien: excelente reserva de agua y energía estable. Recomendación: continúa tomando pequeños sorbos de agua con electrolitos cada hora."
            : "Estado a Cuidar: requiere ajuste metabólico. Recomendación: bebe 350 mililitros de solución hidratante ahora mismo para proteger tus riñones en microgravedad y prioriza carbohidratos complejos.";
        speakAstroText(
          `Tu nivel de agua en el cuerpo está al ${b.hydrationPercent} por ciento y tu energía en sangre (glucosa) es de ${b.bloodGlucoseMgDl} miligramos por decilitro. ${rec} Te trasladé a la vista donde se encuentra este indicador. ¿Qué necesitas el día de hoy?`
        );
        return;
      }

      if (q.includes("radiacion") || q.includes("escudo")) {
        setAstroTargetZone("endocrino");
        onNavigateSection("wearable");
        const rec =
          dailyRadiationMsv <= 0.8
            ? "Estado Bien: el blindaje de la nave te protege adecuadamente. Recomendación: mantén tu dosímetro activo en el nodo torácico."
            : "Estado a Cuidar: flujo radiológico elevado. Recomendación: permanece en el sector con blindaje de agua/polietileno, evita actividades extravehiculares y consume antioxidantes de tu ración.";
        speakAstroText(
          `El escudo de radiación te brinda un ${shieldPct} por ciento de protección hoy, con lectura de ${dailyRadiationMsv.toFixed(
            2
          )} milisieverts por día. ${rec} Te he trasladado a la sección del Arnés 3N donde se monitorea el dosímetro. ¿Qué necesitas el día de hoy?`
        );
        return;
      }

      if (
        q.includes("sueno") ||
        q.includes("dormir") ||
        q.includes("descanso") ||
        q.includes("postura") ||
        q.includes("musculo") ||
        q.includes("hueso")
      ) {
        setAstroTargetZone("musculo");
        onNavigateSection("informes");
        const rec =
          b.sleepHours >= 6.8 && b.postureScore >= 75
            ? "Estado Bien: buen descanso reparador y soporte muscular firme. Recomendación: mantén tus 8 horas de bloque nocturno y tu rutina de resistencia ARED."
            : "Estado a Cuidar: déficit de sueño o fatiga postural. Recomendación: atenúa las luces azules de cabina 60 minutos antes de dormir, usa antifaz y realiza estiramientos de descarga.";
        speakAstroText(
          `Dormiste ${b.sleepHours.toFixed(
            1
          )} horas, tu postura corporal está al ${b.postureScore} por ciento y el orden de tu reloj de sueño al ${b.melatoninIndex} por ciento. ${rec} Te trasladé a la sección de Hábitos y Evolución. ¿Qué necesitas el día de hoy?`
        );
        return;
      }

      if (
        q.includes("estres") ||
        q.includes("mente") ||
        q.includes("mental") ||
        q.includes("calma") ||
        q.includes("animo") ||
        q.includes("voz") ||
        q.includes("cerebro")
      ) {
        setAstroTargetZone("cerebro");
        onNavigateSection("biomarcadores");
        const rec =
          b.stressLevel <= 45 && b.mentalFatigue <= 50
            ? "Estado Bien: mente despejada, enfocada y voz tranquila. Recomendación: conserva tus pausas de 5 minutos cada 2 horas de trabajo técnico."
            : "Estado a Cuidar: tensión o fatiga mental acumulada. Recomendación: toma una pausa activa de 15 minutos, practica respiración diafragmática y conversa con Tierra o con tu tripulación.";
        speakAstroText(
          `Tu nivel de tensión es del ${b.stressLevel} por ciento, cansancio mental del ${b.mentalFatigue} por ciento y tus reflejos están en ${b.reactionTimeMs} milisegundos. ${rec} Te he trasladado a la sección de Signos y Salud Mental. ¿Qué necesitas el día de hoy?`
        );
        return;
      }
    }

    // 5. Respuesta general racional por defecto: informa el estado de signos y traslada a Signos
    onNavigateSection("biomarcadores");
    const criticalCount = criticalZones.length;
    const summaryText = b
      ? `Hola ${astronautName}, soy ASTRO. Te muestro la sección de Signos: en el día ${missionDay} en ${env.shortName}, tu bienestar general está al ${readinessScore} por ciento. Corazón: ${b.bpm} latidos por minuto. Oxígeno: ${b.spo2Percent} por ciento. Presión: ${b.systolicBP} sobre ${b.diastolicBP}. Temperatura: ${b.bodyTempC.toFixed(
          1
        )} grados. Escudo de radiación: ${shieldPct} por ciento seguro. ${
          criticalCount > 0
            ? `Atención: hay ${criticalCount} zona en nivel crítico; te recomiendo abrir el Escáner y contactar al médico.`
            : "Todos tus sistemas principales están en buen estado; te recomiendo mantener tu hidratación y rutina del día."
        } ¿Qué necesitas el día de hoy?`
      : `Hola ${astronautName}, soy ASTRO. Día ${missionDay}, salud general al ${readinessScore} por ciento. ¿Qué necesitas el día de hoy?`;

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
        "Tu navegador no tiene micrófono directo, pero puedes escribirme aquí al lado. ¿Qué necesitas el día de hoy?"
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
                  ASTRO-MED <span className="text-sky-400">HRP · CONSOLA BIOMÉDICA</span>
                </span>
                <span className="rounded border border-sky-500/30 bg-sky-500/10 px-1.5 py-0.5 font-mono-hud text-[10px] font-semibold text-sky-300">
                  MET · DÍA {missionDay}
                </span>
              </div>
              <div className="text-[11px] text-slate-400">
                {astronautName} · Telemetría Bio-Monitor 3N (NASA-STD-3001)
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
              title="Detección automática: todos los subsistemas en rango nominal"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              <span>Estado: NOMINAL</span>
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
              <span>PRECAUCIÓN ({warningZones.length})</span>
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
              <span>CRÍTICO ({Math.max(1, criticalZones.length)})</span>
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
                <div className="flex items-center gap-2">
                  <span className="font-mono-hud text-xs font-bold tracking-wider text-cyan-300">
                    ASTRO · ASISTENTE DE VOZ
                  </span>
                  <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-mono-hud text-[10px] text-emerald-300">
                    Sección actual: {activeSection.toUpperCase()}
                  </span>
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
                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono-hud text-slate-400">
                  <span>
                    {lastUserQuery ? `TÚ: "${lastUserQuery}"` : "RESPUESTA DE ASTRO"}
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onInspectProtocol(astroTargetZone)}
                      className="inline-flex cursor-pointer items-center gap-1 rounded border border-sky-400/40 bg-sky-500/15 px-2 py-0.5 text-[10px] font-semibold text-sky-200 hover:bg-sky-500/25"
                    >
                      <ScanLine className="h-3 w-3" />
                      Protocolo ({ZONE_FRIENDLY_NAMES[astroTargetZone]})
                    </button>
                    <button
                      type="button"
                      onClick={() => speakAstroText(astroReply)}
                      className="inline-flex cursor-pointer items-center gap-1 text-cyan-300 hover:underline"
                    >
                      <Volume2 className="h-3.5 w-3.5" />
                      Repetir en voz alta
                    </button>
                  </div>
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
                className="flex items-center gap-2 rounded-xl border border-[#1b3154] bg-[#0c1830] p-3 lg:col-span-5"
              >
                <input
                  type="text"
                  value={astroInput}
                  onChange={(e) => setAstroInput(e.target.value)}
                  placeholder="Habla o escribe a ASTRO..."
                  className="flex-1 rounded-lg border border-[#233b63] bg-[#070e1d] px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
                />
                <button
                  type="submit"
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-[#1a73e8] px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-600"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Enviar</span>
                </button>
              </form>
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
