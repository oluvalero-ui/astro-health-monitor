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
  cerebro: "Cognition & Rest",
  rostro: "Face & Posture",
  corazon: "Heart & Airway",
  endocrino: "Immunity & Sleep",
  abdomen: "Fluids & Metabolic",
  musculo: "Musculoskeletal",
};

const ENV_SHORT_LABELS: Record<MissionEnvironmentId, string> = {
  iss: "ISS (0g)",
  nave: "Transit (0g)",
  luna: "Moon (0.16g)",
  marte: "Mars (0.38g)",
};

const SECTION_DISPLAY_NAMES: Record<string, string> = {
  resumen: "MCC TELEMETRY",
  escaner: "BIO-SCANNER",
  wearable: "BIO-MONITOR 3N",
  biomarcadores: "BIOMARKERS",
  informes: "COUNTERMEASURES",
  referencias: "NASA-STD-3001",
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
    `Hello ${astronautName}! I'm ASTRO. How can I assist you today?`
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
    utterance.lang = "en-US";
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

    // 0. Conversational greetings & acknowledgements
    const hasSignOrNavKeyword =
      q.includes("vital") ||
      q.includes("sign") ||
      q.includes("status") ||
      q.includes("heart") ||
      q.includes("beat") ||
      q.includes("pulse") ||
      q.includes("bpm") ||
      q.includes("cardiac") ||
      q.includes("hrv") ||
      q.includes("oxygen") ||
      q.includes("spo2") ||
      q.includes("pressure") ||
      q.includes("bp") ||
      q.includes("breath") ||
      q.includes("respirat") ||
      q.includes("lung") ||
      q.includes("temp") ||
      q.includes("fever") ||
      q.includes("water") ||
      q.includes("hydrat") ||
      q.includes("glucose") ||
      q.includes("sugar") ||
      q.includes("radiat") ||
      q.includes("shield") ||
      q.includes("sleep") ||
      q.includes("stress") ||
      q.includes("mind") ||
      q.includes("mental") ||
      q.includes("harness") ||
      q.includes("suit") ||
      q.includes("vest") ||
      q.includes("sensor") ||
      q.includes("wearable") ||
      q.includes("bio-monitor") ||
      q.includes("biomonitor") ||
      q.includes("3n") ||
      q.includes("earpiece") ||
      q.includes("bone") ||
      q.includes("laryngeal") ||
      q.includes("collar") ||
      q.includes("scanner") ||
      q.includes("manual") ||
      q.includes("nasa") ||
      q.includes("science") ||
      q.includes("countermeasure") ||
      q.includes("habit") ||
      q.includes("monitor") ||
      q.includes("telemetry") ||
      q.includes("camera") ||
      q.includes("biomarker");

    if (
      !hasSignOrNavKeyword &&
      (q.includes("how are you") ||
        q.includes("how's it going") ||
        q.includes("hello") ||
        q === "hi" ||
        q.startsWith("hi ") ||
        q.includes("hey") ||
        q.includes("good morning") ||
        q.includes("good afternoon") ||
        q.includes("good evening") ||
        q.includes("who are you"))
    ) {
      speakAstroText(
        `Hello ${astronautName}! Telemetry systems are nominal at 100 percent aboard ${env.shortName}. Your overall Flight Readiness is at ${readinessScore} percent. How can I assist you today?`
      );
      return;
    }

    if (
      !hasSignOrNavKeyword &&
      (q.includes("thank") ||
        q.includes("perfect") ||
        q.includes("awesome") ||
        q.includes("got it") ||
        q.includes("great"))
    ) {
      speakAstroText(
        `You're welcome, ${astronautName}. Continuing real-time Bio-Monitor 3N telemetry surveillance. What would you like to check next?`
      );
      return;
    }

    // 1. Key summary command: "How are my vitals?" / "Vitals status"
    if (
      q.includes("how are my vitals") ||
      q.includes("vitals status") ||
      q.includes("check my vitals") ||
      q.includes("my vitals") ||
      q.includes("overall status") ||
      q.includes("flight readiness") ||
      q.includes("status report")
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
        ? `Understood, ${astronautName}. Switching to Biomarkers. On Mission Day ${missionDay} aboard ${env.shortName}, Flight Readiness is ${readinessScore} percent. Heart rate: ${b.bpm} bpm. Oxygen saturation: ${b.spo2Percent} percent. Blood pressure: ${b.systolicBP} over ${b.diastolicBP}. Respiratory rate: ${b.respiratoryRateRpm} breaths per minute. Core temperature: ${b.bodyTempC.toFixed(
            1
          )} degrees Celsius. Hydration: ${b.hydrationPercent} percent, and radiation shielding at ${shieldPct} percent. ${
            criticalCount > 0
              ? `Critical advisory: ${criticalCount} zone requires immediate attention (${ZONE_FRIENDLY_NAMES[primaryCriticalZone]}). I have opened the emergency protocol in Bio-Scanner — contact the Flight Surgeon immediately.`
              : warningCount > 0
              ? `Caution notice: ${warningCount} zone is in caution (${ZONE_FRIENDLY_NAMES[primaryWarningZone]}). I recommend drinking 300 milliliters of water, performing 5 minutes of slow paced breathing, and reviewing the clinical protocol.`
              : `All primary systems are nominal. Maintain steady hydration and complete today's countermeasure exercise session.`
          } What else would you like to check?`
        : `Overall Flight Readiness is ${readinessScore} percent, and I've opened Biomarkers. What else would you like to check?`;

      speakAstroText(summaryText);
      return;
    }

    // 2. Explicit section navigation
    if (
      q.includes("harness") ||
      q.includes("suit") ||
      q.includes("vest") ||
      q.includes("sensor") ||
      q.includes("wearable") ||
      q.includes("bio-monitor") ||
      q.includes("biomonitor") ||
      q.includes("3n") ||
      q.includes("earpiece") ||
      q.includes("bone") ||
      q.includes("laryngeal") ||
      q.includes("collar")
    ) {
      onNavigateSection("wearable");
      speakAstroText(
        `Switching to the Bio-Monitor 3N telemetry harness view. Here you can inspect all 13 continuous streams across your 3 body nodes, plus our private two-way link via the Node 3 laryngeal collar and BLE bone-conduction earpiece. What else would you like to check?`
      );
      return;
    }

    if (
      q.includes("manual") ||
      q.includes("nasa") ||
      q.includes("3001") ||
      q.includes("reference") ||
      q.includes("science") ||
      q.includes("source") ||
      q.includes("study")
    ) {
      onNavigateSection("referencias");
      speakAstroText(
        `Opening the offline NASA-STD-3001 Clinical & Technical Manual with all 5 spaceflight hazards and local clinical references. What else would you like to check?`
      );
      return;
    }

    if (
      q.includes("countermeasure") ||
      q.includes("habit") ||
      q.includes("report") ||
      q.includes("chart") ||
      q.includes("trend") ||
      q.includes("exercise")
    ) {
      onNavigateSection("informes");
      speakAstroText(
        `Opening NASA HRP Countermeasures and clinical progression charts. What else would you like to check?`
      );
      return;
    }

    if (q.includes("camera") || q.includes("manual entry") || q.includes("adjust")) {
      onOpenScanModal();
      speakAstroText(
        `Opening the Multimodal Camera and Manual Clinical Entry panel so you can update your assessment. What else would you like to check?`
      );
      return;
    }

    if (
      q.includes("scanner") ||
      q.includes("map") ||
      q.includes("protocol") ||
      q.includes("anatom") ||
      q.includes("instructions")
    ) {
      if (q.includes("heart") || q.includes("cardio")) {
        setAstroTargetZone("corazon");
        onInspectProtocol("corazon");
      } else if (q.includes("face") || q.includes("posture")) {
        setAstroTargetZone("rostro");
        onInspectProtocol("rostro");
      } else if (q.includes("abdomen") || q.includes("energy") || q.includes("fluid")) {
        setAstroTargetZone("abdomen");
        onInspectProtocol("abdomen");
      } else if (q.includes("muscle") || q.includes("bone")) {
        setAstroTargetZone("musculo");
        onInspectProtocol("musculo");
      } else if (q.includes("immunit") || q.includes("endocrin") || q.includes("defens")) {
        setAstroTargetZone("endocrino");
        onInspectProtocol("endocrino");
      } else if (q.includes("brain") || q.includes("cognit")) {
        setAstroTargetZone("cerebro");
        onInspectProtocol("cerebro");
      } else {
        onNavigateSection("escaner");
      }
      speakAstroText(
        `Opening the Anatomical Bio-Scanner with the autonomous Clinical Protocol Manual and step-by-step actions. What else would you like to check?`
      );
      return;
    }

    if (
      q.includes("mcc") ||
      q.includes("telemetry") ||
      q.includes("monitor") ||
      q.includes("overview") ||
      q.includes("home") ||
      q.includes("main")
    ) {
      onNavigateSection("resumen");
      speakAstroText(
        `Returning to MCC Telemetry Overview. Your overall Flight Readiness is ${readinessScore} percent. What else would you like to check?`
      );
      return;
    }

    if (
      (q.includes("go to") ||
        q.includes("open") ||
        q.includes("show") ||
        q.includes("view") ||
        q.includes("switch") ||
        q.includes("section")) &&
      (q.includes("biomarker") ||
        q.includes("vital") ||
        q.includes("mood") ||
        q.includes("routine") ||
        q.includes("schedule"))
    ) {
      onNavigateSection("biomarcadores");
      speakAstroText(
        `Navigating to Biomarkers, Behavioral Health, and Daily Schedule. What else would you like to check?`
      );
      return;
    }

    // 3. Voice gravity environment switching
    if (q.includes("mars")) {
      onSelectEnvironment("marte");
      speakAstroText(
        `Environment switched to Mars at 0.38 g gravity. I recommend calibrating the Bio-Monitor 3N radial wrist node at heart level. What else would you like to check?`
      );
      return;
    }
    if (q.includes("moon") || q.includes("lunar")) {
      onSelectEnvironment("luna");
      speakAstroText(
        `Environment switched to Moon at 0.16 g gravity. What else would you like to check?`
      );
      return;
    }
    if (q.includes("station") || q.includes("iss")) {
      onSelectEnvironment("iss");
      speakAstroText(
        `Environment switched to the International Space Station in 0 g microgravity. What else would you like to check?`
      );
      return;
    }
    if (q.includes("transit") || q.includes("spacecraft") || q.includes("deep space")) {
      onSelectEnvironment("nave");
      speakAstroText(
        `Environment switched to Deep Space Transit in 0 g microgravity. What else would you like to check?`
      );
      return;
    }

    // 4. Specific vital-sign queries: readout + clinical guidance + section jump
    if (b) {
      if (
        q.includes("heart") ||
        q.includes("beat") ||
        q.includes("pulse") ||
        q.includes("bpm") ||
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
            ? "Status Nominal: rhythm is steady and well-recovered. Recommendation: maintain your 30-minute aerobic countermeasure and avoid stimulants before sleep."
            : "Status Caution: elevated cardiac strain detected. Recommendation: perform 5 minutes of slow paced breathing (4 seconds inhale, 6 seconds exhale), drink 250 milliliters of water, and review the Heart protocol.";
        speakAstroText(
          `Your heart rate is ${b.bpm} beats per minute with cardiac recovery at ${restPct} percent (${b.hrvRmssdMs} milliseconds HRV). ${rec} I've opened this metric view for you. What else would you like to check?`
        );
        return;
      }

      if (
        q.includes("oxygen") ||
        q.includes("saturation") ||
        q.includes("spo2")
      ) {
        setAstroTargetZone("corazon");
        onNavigateSection("biomarcadores");
        const rec =
          b.spo2Percent >= 95
            ? "Status Nominal: oxygen delivery is adequate. Recommendation: keep the frontal sensor band clean and continue cabin duties normally."
            : "Status Caution: oxygenation is below target. Recommendation: take 10 deep breaths, inspect module O2 and CO2 scrubbing, and review the cardiorespiratory protocol.";
        speakAstroText(
          `Your forehead-measured blood oxygen saturation is ${b.spo2Percent} percent, with a perfusion index of ${b.perfusionIndex.toFixed(
            1
          )} percent. ${rec} I've opened Biomarkers so you can inspect the trend. What else would you like to check?`
        );
        return;
      }

      if (q.includes("pressure") || q.includes("bp") || q.includes("circulation")) {
        setAstroTargetZone("corazon");
        if (b.systolicBP >= 135 || b.systolicBP < 95) {
          onInspectProtocol("corazon");
        } else {
          onNavigateSection("biomarcadores");
        }
        const rec =
          b.systolicBP < 135 && b.systolicBP >= 95
            ? "Status Nominal: systemic blood pressure is balanced. Recommendation: maintain steady hydration and low dietary sodium."
            : "Status Caution: blood pressure outside target window. Recommendation: rest 10 minutes in neutral posture, hydrate, and re-zero the radial node at heart level.";
        speakAstroText(
          `Your cuffless arterial pressure is ${b.systolicBP} over ${b.diastolicBP} millimeters of mercury (pulse transit time ${b.pttMs} milliseconds). ${rec} I've opened the corresponding view. What else would you like to check?`
        );
        return;
      }

      if (q.includes("breath") || q.includes("respirat") || q.includes("lung") || q.includes("ventil")) {
        setAstroTargetZone("corazon");
        onNavigateSection("biomarcadores");
        const rec =
          b.respiratoryRateRpm >= 10 && b.respiratoryRateRpm <= 19
            ? "Status Nominal: breathing is calm and steady. Recommendation: maintain nasal breathing cadence during cabin operations."
            : "Status Caution: elevated respiratory rate. Recommendation: practice 4-second box breathing for 3 minutes and check cabin CO2 levels.";
        speakAstroText(
          `Your respiratory rate is ${b.respiratoryRateRpm} breaths per minute with minute ventilation at ${b.minuteVentilationLpm.toFixed(
            1
          )} liters per minute. ${rec} I've opened Biomarkers where you can monitor ventilation. What else would you like to check?`
        );
        return;
      }

      if (
        q.includes("temp") ||
        q.includes("heat") ||
        q.includes("fever")
      ) {
        setAstroTargetZone("endocrino");
        onNavigateSection("biomarcadores");
        const rec =
          b.bodyTempC >= 36.0 && b.bodyTempC <= 37.4
            ? "Status Nominal: core thermoregulation is well balanced. Recommendation: keep suit ventilation steady and hydrate every 2 hours."
            : "Status Caution: thermal deviation detected. Recommendation: drink 400 milliliters of cool water, reduce physical workload for 20 minutes, and re-measure.";
        speakAstroText(
          `Your core body temperature is ${b.bodyTempC.toFixed(
            1
          )} degrees Celsius and skin temperature is ${b.skinTempC.toFixed(
            1
          )} degrees. ${rec} I've opened Biomarkers for review. What else would you like to check?`
        );
        return;
      }

      if (
        q.includes("water") ||
        q.includes("hydrat") ||
        q.includes("glucose") ||
        q.includes("sugar") ||
        q.includes("energy") ||
        q.includes("fluid") ||
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
            ? "Status Nominal: hydration reserve and glycemia are optimal. Recommendation: continue sipping electrolyte water every hour."
            : "Status Caution: metabolic adjustment needed. Recommendation: drink 350 milliliters of oral rehydration solution now to protect renal function in microgravity and favor complex carbohydrates.";
        speakAstroText(
          `Body hydration is at ${b.hydrationPercent} percent and blood glucose is ${b.bloodGlucoseMgDl} milligrams per deciliter. ${rec} I've opened the relevant telemetry view. What else would you like to check?`
        );
        return;
      }

      if (q.includes("radiat") || q.includes("shield") || q.includes("dosimet")) {
        setAstroTargetZone("endocrino");
        onNavigateSection("wearable");
        const rec =
          dailyRadiationMsv <= 0.8
            ? "Status Nominal: habitat shielding is holding exposure within ALARA bounds. Recommendation: keep your thoracic dosimeter active."
            : "Status Caution: elevated radiation flux. Recommendation: relocate to water-wall or polyethylene shielding, suspend EVA tasks, and take ration antioxidants.";
        speakAstroText(
          `Radiation shielding is holding at ${shieldPct} percent today, with dosimetry reading ${dailyRadiationMsv.toFixed(
            2
          )} millisieverts per day. ${rec} I've opened Bio-Monitor 3N where the thoracic dosimeter is tracked. What else would you like to check?`
        );
        return;
      }

      if (
        q.includes("sleep") ||
        q.includes("rest") ||
        q.includes("posture") ||
        q.includes("muscle") ||
        q.includes("bone")
      ) {
        setAstroTargetZone("musculo");
        onNavigateSection("informes");
        const rec =
          b.sleepHours >= 6.8 && b.postureScore >= 75
            ? "Status Nominal: restorative sleep and musculoskeletal posture are solid. Recommendation: protect your 8-hour sleep block and ARED resistive training."
            : "Status Caution: sleep deficit or postural fatigue. Recommendation: dim cabin blue light 60 minutes prior to sleep, wear eye shades, and perform unloading stretches.";
        speakAstroText(
          `You slept ${b.sleepHours.toFixed(
            1
          )} hours, posture score is ${b.postureScore} percent, and circadian rhythm stability is ${b.melatoninIndex} percent. ${rec} I've opened Countermeasures and clinical progression charts. What else would you like to check?`
        );
        return;
      }

      if (
        q.includes("stress") ||
        q.includes("mind") ||
        q.includes("mental") ||
        q.includes("calm") ||
        q.includes("mood") ||
        q.includes("voice") ||
        q.includes("brain") ||
        q.includes("cognit")
      ) {
        setAstroTargetZone("cerebro");
        onNavigateSection("biomarcadores");
        const rec =
          b.stressLevel <= 45 && b.mentalFatigue <= 50
            ? "Status Nominal: cognitive load is balanced and vocal stress is low. Recommendation: keep taking 5-minute resets every 2 hours of console work."
            : "Status Caution: accumulated mental strain detected. Recommendation: take a 15-minute active break, practice diaphragmatic breathing, and check in with Flight Control or crewmates.";
        speakAstroText(
          `Stress level is ${b.stressLevel} percent, mental fatigue is ${b.mentalFatigue} percent, and reaction latency is ${b.reactionTimeMs} milliseconds. ${rec} I've opened Biomarkers and Behavioral Health. What else would you like to check?`
        );
        return;
      }
    }

    // 5. Rational default fallback: summarize telemetry and open Biomarkers
    onNavigateSection("biomarcadores");
    const criticalCount = criticalZones.length;
    const summaryText = b
      ? `Hello ${astronautName}, ASTRO reporting. Opening Biomarkers: on Mission Day ${missionDay} aboard ${env.shortName}, overall Flight Readiness is ${readinessScore} percent. Heart rate: ${b.bpm} bpm. Oxygen: ${b.spo2Percent} percent. Blood pressure: ${b.systolicBP} over ${b.diastolicBP}. Core temp: ${b.bodyTempC.toFixed(
          1
        )} degrees Celsius. Radiation shield: ${shieldPct} percent nominal. ${
          criticalCount > 0
            ? `Attention: ${criticalCount} zone is at critical level. Open Bio-Scanner and contact the Flight Surgeon.`
            : "All core subsystems remain in healthy bounds — keep up your hydration and daily countermeasures."
        } What would you like to check next?`
      : `Hello ${astronautName}, ASTRO reporting. Mission Day ${missionDay}, Flight Readiness at ${readinessScore} percent. What would you like to check next?`;

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
        "Direct microphone input isn't supported in this browser, but you can type your query in the box beside me. What would you like to check?"
      );
      return;
    }

    try {
      if ( "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        setSpeaking(false);
      }
      const recognition = new SpeechRec();
      recognition.lang = "en-US";
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
                  ASTRO-MED <span className="text-sky-400">HRP · BIOMEDICAL CONSOLE</span>
                </span>
                <span className="rounded border border-sky-500/30 bg-sky-500/10 px-1.5 py-0.5 font-mono-hud text-[10px] font-semibold text-sky-300">
                  MET · DAY {missionDay}
                </span>
              </div>
              <div className="text-[11px] text-slate-400">
                {astronautName} · Bio-Monitor 3N Telemetry (NASA-STD-3001)
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
              title="Toggle Ground Flight Surgeon link"
            >
              Ground:{" "}
              <strong
                className={
                  telemedicineEnabled ? "text-emerald-300" : "text-amber-300"
                }
              >
                {telemedicineEnabled ? env.commLatencyLabel.split(" ")[0] : "NO LINK (LOCAL)"}
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
            title="ASTRO Voice Assistant (0g Voice) · Hands-free two-way link via Node 3 Laryngeal Collar & Bone-Conduction / In-Ear BLE Earpiece (3N Harness)"
          >
            {listening ? (
              <>
                <Mic className="h-3.5 w-3.5" />
                <span>ASTRO Listening...</span>
              </>
            ) : speaking ? (
              <>
                <Volume2 className="h-3.5 w-3.5 text-cyan-300" />
                <span>ASTRO Speaking...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5 text-cyan-300" />
                <span>ASTRO Assistant</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onOpenScanModal}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-[#1a73e8] px-3 py-1.5 text-xs font-bold text-white transition hover:bg-blue-600"
          >
            <ScanLine className="h-3.5 w-3.5" />
            <span>Review / Adjust</span>
          </button>

          {/* Automated Clinical Risk Indicator */}
          {overallRiskStatus === "optimal" && (
            <div
              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/35 bg-emerald-500/10 px-2.5 py-1.5 text-xs font-semibold text-emerald-300"
              title="Auto-detection: all subsystems within nominal range"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              <span>Status: NOMINAL</span>
            </div>
          )}

          {overallRiskStatus === "warning" && (
            <button
              type="button"
              onClick={() => onInspectProtocol(primaryWarningZone)}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-amber-400/60 bg-amber-500/20 px-3 py-1.5 text-xs font-bold text-amber-300 transition hover:bg-amber-500/30"
              title="Caution thresholds detected automatically"
            >
              <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
              <span>CAUTION ({warningZones.length})</span>
            </button>
          )}

          {overallRiskStatus === "critical" && (
            <button
              type="button"
              onClick={() => onInspectProtocol(primaryCriticalZone)}
              className="inline-flex animate-pulse cursor-pointer items-center gap-1.5 rounded-lg border border-red-400 bg-red-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-red-700"
              title="Critical threshold detected automatically"
            >
              <ShieldAlert className="h-3.5 w-3.5" />
              <span>CRITICAL ({Math.max(1, criticalZones.length)})</span>
            </button>
          )}

          <button
            type="button"
            onClick={onResetMission}
            title="Reset mission telemetry to nominal baseline"
            className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-white/15 bg-white/5 p-1.5 text-blue-200 transition hover:bg-white/15 hover:text-white"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Interactive ASTRO Voice Assistant Drawer */}
      {astroOpen && (
        <div className="border-t border-cyan-500/35 bg-[#081225] px-4 py-3 text-xs text-slate-100 shadow-xl sm:px-6">
          <div className="mx-auto max-w-[1600px] space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-cyan-400/40 bg-cyan-500/20 text-cyan-300">
                  <Sparkles className="h-4 w-4" />
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono-hud text-xs font-bold tracking-wider text-cyan-300">
                    ASTRO · VOICE ASSISTANT (0g)
                  </span>
                  <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 font-mono-hud text-[10px] text-cyan-200">
                    Node 3 Link: Laryngeal Collar (~60 dBA immune) + BLE Bone-Conduction Earpiece
                  </span>
                  <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-mono-hud text-[10px] text-emerald-300">
                    Section: {SECTION_DISPLAY_NAMES[activeSection] ?? activeSection.toUpperCase()}
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
                      <span>Stop Mic</span>
                    </>
                  ) : (
                    <>
                      <Mic className="h-3.5 w-3.5" />
                      <span>Talk to ASTRO</span>
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
                    <span>Mute Voice</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setAstroOpen(false)}
                  className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-white/15 bg-white/5 p-1.5 text-slate-300 hover:bg-white/15 hover:text-white"
                  aria-label="Close ASTRO assistant"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Live ASTRO Response + Voice/Text Input */}
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
              <div className="rounded-xl border border-[#1b3154] bg-[#0c1830] p-3 lg:col-span-7">
                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono-hud text-slate-400">
                  <span>
                    {lastUserQuery ? `YOU: "${lastUserQuery}"` : "ASTRO RESPONSE"}
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onInspectProtocol(astroTargetZone)}
                      className="inline-flex cursor-pointer items-center gap-1 rounded border border-sky-400/40 bg-sky-500/15 px-2 py-0.5 text-[10px] font-semibold text-sky-200 hover:bg-sky-500/25"
                    >
                      <ScanLine className="h-3 w-3" />
                      Protocol ({ZONE_FRIENDLY_NAMES[astroTargetZone]})
                    </button>
                    <button
                      type="button"
                      onClick={() => speakAstroText(astroReply)}
                      className="inline-flex cursor-pointer items-center gap-1 text-cyan-300 hover:underline"
                    >
                      <Volume2 className="h-3.5 w-3.5" />
                      Speak Aloud
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
                  placeholder="Speak or type to ASTRO..."
                  className="flex-1 rounded-lg border border-[#233b63] bg-[#070e1d] px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
                />
                <button
                  type="submit"
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-[#1a73e8] px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-600"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Send</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Automated Caution Advisory Banner */}
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
                  Automated Preventive Advisory (
                  {warningZones.map((z) => ZONE_FRIENDLY_NAMES[z]).join(", ")}
                  ):
                </strong>{" "}
                Recommended action:{" "}
                <strong>consult Ground Flight Surgeon</strong> (
                {telemedicineEnabled
                  ? `active link · ${env.commLatencyLabel}`
                  : `offline mode · ${env.commLatencyLabel}`}
                ) or open the{" "}
                <strong>autonomous Clinical Protocol Manual</strong> in
                Bio-Scanner [5].
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
                  Consult Ground ({env.commLatencyLabel.split(" ")[0]})
                </button>
              )}
              <button
                type="button"
                onClick={() => onInspectProtocol(primaryWarningZone)}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-amber-400/60 bg-amber-500/25 px-2.5 py-1 text-[11px] font-bold text-amber-100 transition hover:bg-amber-500/35"
              >
                <ScanLine className="h-3.5 w-3.5" />
                Open Clinical Protocol Manual (Bio-Scanner)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Automated Critical Alert Banner */}
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
                    AUTOMATED CRITICAL ALERT (
                    {criticalZones.length > 0
                      ? criticalZones.map((z) => ZONE_FRIENDLY_NAMES[z]).join(", ")
                      : "System-Wide Risk"}
                    ):
                  </strong>{" "}
                  Recommended action:{" "}
                  <strong>contact a Flight Surgeon immediately</strong> if
                  telemetry link is active (ISS/Moon), or execute the{" "}
                  <strong>autonomous Anatomical Bio-Scanner protocols</strong>{" "}
                  [5].
                </div>
                <div className="text-[11px] text-red-200/90">
                  {isLowLatency && telemedicineEnabled
                    ? `Ground link active (${env.commLatencyLabel}): transmit your telemetry to the Flight Surgeon immediately.`
                    : `No real-time Ground communication (${env.commLatencyLabel} or offline mode): open the Clinical Manual under "Bio-Scanner → 1. Exam & Action Protocol".`}
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
                  Activate Flight Surgeon Link ({env.commLatencyLabel.split(" ")[0]})
                </button>
              )}
              <button
                type="button"
                onClick={() => onInspectProtocol(primaryCriticalZone)}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-red-300/60 bg-red-600 px-3 py-1 text-[11px] font-bold text-white transition hover:bg-red-500"
              >
                <ScanLine className="h-3.5 w-3.5" />
                Open Clinical Manual & Autonomous Protocols (Bio-Scanner)
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
