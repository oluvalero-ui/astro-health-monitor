"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  Camera,
  CheckCircle2,
  Cpu,
  FileImage,
  Sliders,
  Sparkles,
  Upload,
  VideoOff,
  Waves,
  X,
} from "lucide-react";
import {
  BiomarkerData,
  RoutineTracking,
} from "@/types/astronaut";
import { clamp } from "@/utils/healthEngine";

export type ScanModalTab = "camara" | "ultrasonido" | "manual";

interface MultimodalScanModalProps {
  isOpen: boolean;
  initialTab: ScanModalTab;
  biomarkers: BiomarkerData;
  routine: RoutineTracking;
  onClose: () => void;
  onApplyCameraResults: (
    updates: Partial<BiomarkerData>,
    summary: string
  ) => void;
  onApplyUltrasoundResults: (
    updates: Partial<BiomarkerData>,
    finding: string
  ) => void;
  onApplyManualEntry: (
    nextBiomarkers: BiomarkerData,
    nextRoutine: RoutineTracking
  ) => void;
}

type CameraScenario = "optimo" | "fatigado" | "critico";
type UltrasoundPresetId = "bone" | "cardio" | "abdomen";

const ULTRASOUND_PRESETS: {
  id: UltrasoundPresetId;
  title: string;
  targetLabel: string;
  defaultFinding: string;
}[] = [
  {
    id: "bone",
    title: "Muestra 1: Densidad Ósea Femoral",
    targetLabel: "Hueso y Tejido Muscular",
    defaultFinding:
      "Cortical ósea nítida sin pérdida severa; densidad femoral estimada en 96%.",
  },
  {
    id: "cardio",
    title: "Muestra 2: Flujo Cardíaco / Yugular",
    targetLabel: "Corazón y Fluidos Cefálicos",
    defaultFinding:
      "Cámaras cardíacas con llenado estable y flujo venoso normal para microgravedad.",
  },
  {
    id: "abdomen",
    title: "Muestra 3: Revisión Abdominal / Hídrica",
    targetLabel: "Abdomen e Hidratación Renal",
    defaultFinding:
      "Sin retención anómala ni microcálculos; balance de líquidos en rango saludable.",
  },
];

function generateUltrasoundDataUrl(preset: UltrasoundPresetId): string {
  if (typeof document === "undefined") return "";
  const canvas = document.createElement("canvas");
  canvas.width = 480;
  canvas.height = 320;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  // Dark acoustic background
  ctx.fillStyle = "#030712";
  ctx.fillRect(0, 0, 480, 320);

  // Ultrasound sector fan
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(240, 20);
  ctx.arc(240, 20, 290, Math.PI * 0.22, Math.PI * 0.78);
  ctx.closePath();
  ctx.clip();

  const grad = ctx.createRadialGradient(240, 30, 15, 240, 160, 280);
  grad.addColorStop(0, "#1e293b");
  grad.addColorStop(0.45, "#0f172a");
  grad.addColorStop(1, "#020617");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 480, 320);

  // Speckle acoustic texture (deterministic pseudo-random for pure render)
  let seed = preset === "bone" ? 17 : preset === "cardio" ? 53 : 89;
  const nextRand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  for (let i = 0; i < 2400; i++) {
    const x = nextRand() * 480;
    const y = 25 + nextRand() * 290;
    const alpha = nextRand() * 0.18;
    ctx.fillStyle = `rgba(148, 163, 184, ${alpha})`;
    ctx.fillRect(x, y, 2, 1.5);
  }

  // Depth arcs
  ctx.strokeStyle = "rgba(56, 189, 248, 0.22)";
  ctx.lineWidth = 1;
  [90, 150, 210, 270].forEach((r) => {
    ctx.beginPath();
    ctx.arc(240, 20, r, Math.PI * 0.24, Math.PI * 0.76);
    ctx.stroke();
  });

  // Preset-specific anatomical structures
  if (preset === "bone") {
    // Femur cortical bright white echo & shadow
    ctx.strokeStyle = "rgba(226, 232, 240, 0.85)";
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(120, 170);
    ctx.quadraticCurveTo(240, 148, 360, 174);
    ctx.stroke();

    ctx.fillStyle = "rgba(2, 6, 23, 0.78)";
    ctx.fillRect(128, 178, 224, 120);

    // Muscle striations above femur
    ctx.strokeStyle = "rgba(148, 163, 184, 0.35)";
    ctx.lineWidth = 1.5;
    for (let y = 95; y <= 145; y += 10) {
      ctx.beginPath();
      ctx.moveTo(110, y);
      ctx.quadraticCurveTo(240, y - 8, 370, y + 4);
      ctx.stroke();
    }
  } else if (preset === "cardio") {
    // Heart chambers
    ctx.fillStyle = "rgba(2, 6, 23, 0.88)";
    ctx.strokeStyle = "rgba(203, 213, 225, 0.7)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(215, 165, 42, 62, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.ellipse(275, 175, 32, 52, 0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Doppler flow accent
    ctx.fillStyle = "rgba(56, 189, 248, 0.32)";
    ctx.beginPath();
    ctx.ellipse(222, 162, 18, 30, -0.2, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Abdominal kidney/organ echogenic outline
    ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
    ctx.strokeStyle = "rgba(203, 213, 225, 0.65)";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(235, 168, 72, 42, 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "rgba(148, 163, 184, 0.25)";
    ctx.beginPath();
    ctx.ellipse(238, 168, 36, 18, 0.1, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // Scale ruler on right
  ctx.fillStyle = "#38bdf8";
  ctx.font = "11px monospace";
  ctx.fillText("CSA-US PROBE 5.0MHz", 14, 24);
  ctx.fillText(`MODO: ${preset.toUpperCase()}`, 14, 40);
  for (let i = 0; i < 6; i++) {
    ctx.fillRect(452, 55 + i * 42, 10, 1.5);
    ctx.fillText(`${(i + 1) * 3}cm`, 418, 59 + i * 42);
  }

  return canvas.toDataURL("image/png");
}

export default function MultimodalScanModal({
  isOpen,
  initialTab,
  biomarkers,
  routine,
  onClose,
  onApplyCameraResults,
  onApplyUltrasoundResults,
  onApplyManualEntry,
}: MultimodalScanModalProps) {
  const [activeTab, setActiveTab] = useState<ScanModalTab>(initialTab);

  // Camera state
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const simCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [cameraMode, setCameraMode] = useState<"webcam" | "simulacion">("simulacion");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [simScenario, setSimScenario] = useState<CameraScenario>("optimo");
  const [isAnalyzingCam, setIsAnalyzingCam] = useState(false);
  const [camProgress, setCamProgress] = useState(0);
  const [camResult, setCamResult] = useState<{
    mentalFatigue: number;
    stressLevel: number;
    lonelinessLevel: number;
    boredomLevel: number;
    postureScore: number;
    facialTension: number;
    moodScore: number;
    summary: string;
  } | null>(null);

  // Ultrasound state
  const [selectedPreset, setSelectedPreset] = useState<UltrasoundPresetId>("bone");
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [gainContrast, setGainContrast] = useState<number>(115);
  const [isScanningUS, setIsScanningUS] = useState(false);
  const [usSimulateIssue, setUsSimulateIssue] = useState(false);
  const [usResult, setUsResult] = useState<{
    finding: string;
    updates: Partial<BiomarkerData>;
    statusLabel: string;
  } | null>(null);

  // Manual Entry state
  const [draftBio, setDraftBio] = useState<BiomarkerData>(biomarkers);
  const [draftRoutine, setDraftRoutine] = useState<RoutineTracking>(routine);

  const presetImageUrl = useMemo(
    () => (isOpen ? generateUltrasoundDataUrl(selectedPreset) : ""),
    [isOpen, selectedPreset]
  );

  const stopWebcam = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const startWebcam = useCallback(async () => {
    setCameraError(null);
    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia
    ) {
      setCameraError(
        "Cámara no disponible en este navegador. Modo simulación biométrica activado automáticamente."
      );
      setCameraMode("simulacion");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      streamRef.current = stream;
      setCameraMode("webcam");
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
    } catch {
      setCameraError(
        "No se detectó cámara física o se denegó el permiso. Usando modo de simulación biométrica automática."
      );
      setCameraMode("simulacion");
    }
  }, []);

  // Stop webcam whenever modal closes or switches away from camera tab
  useEffect(() => {
    if (!isOpen || activeTab !== "camara") {
      stopWebcam();
    }
    return () => {
      stopWebcam();
    };
  }, [isOpen, activeTab, stopWebcam]);

  // Animated Canvas Simulation for Body Language & Facial Landmarks
  useEffect(() => {
    if (!isOpen || activeTab !== "camara" || cameraMode !== "simulacion") {
      return;
    }
    const canvas = simCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId = 0;
    let tick = 0;

    const renderFrame = () => {
      tick += 0.04;
      const w = canvas.width;
      const h = canvas.height;
      ctx.fillStyle = "#020617";
      ctx.fillRect(0, 0, w, h);

      // Grid lines
      ctx.strokeStyle = "rgba(30, 41, 59, 0.7)";
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 32) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += 32) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      const slouch =
        simScenario === "optimo" ? 0 : simScenario === "fatigado" ? 12 : 26;
      const color =
        simScenario === "optimo"
          ? "#10b981"
          : simScenario === "fatigado"
          ? "#f59e0b"
          : "#ef4444";

      const headY = 92 + slouch + Math.sin(tick) * 2.5;
      const shoulderY = 178 + slouch * 0.7;

      // Shoulder posture vector
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(135, shoulderY + (simScenario === "critico" ? 14 : 0));
      ctx.quadraticCurveTo(240, shoulderY - 10, 345, shoulderY + (simScenario === "critico" ? 14 : 0));
      ctx.stroke();

      // Torso lines
      ctx.beginPath();
      ctx.moveTo(155, shoulderY);
      ctx.lineTo(170, 290);
      ctx.moveTo(325, shoulderY);
      ctx.lineTo(310, 290);
      ctx.stroke();

      // Face oval mesh
      ctx.fillStyle = `${color}18`;
      ctx.beginPath();
      ctx.ellipse(240, headY, 44, 56, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Eyes & blink animation
      const blink = Math.sin(tick * 1.8) > 0.92 ? 1.5 : 5;
      const eyeOpen = simScenario === "critico" ? blink * 0.55 : blink;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.ellipse(222, headY - 8, 7, eyeOpen, 0, 0, Math.PI * 2);
      ctx.ellipse(258, headY - 8, 7, eyeOpen, 0, 0, Math.PI * 2);
      ctx.fill();

      // Eyebrow tension / expression mouth
      ctx.beginPath();
      if (simScenario === "optimo") {
        ctx.arc(240, headY + 18, 13, 0.15 * Math.PI, 0.85 * Math.PI);
      } else if (simScenario === "fatigado") {
        ctx.moveTo(226, headY + 23);
        ctx.lineTo(254, headY + 23);
      } else {
        ctx.arc(240, headY + 34, 13, 1.15 * Math.PI, 1.85 * Math.PI);
      }
      ctx.stroke();

      // Face landmarks dots
      const landmarks = [
        [240, headY - 38],
        [208, headY - 12],
        [272, headY - 12],
        [240, headY + 6],
        [216, headY + 28],
        [264, headY + 28],
        [155, shoulderY],
        [325, shoulderY],
      ];
      ctx.fillStyle = "#38bdf8";
      landmarks.forEach(([lx, ly]) => {
        ctx.beginPath();
        ctx.arc(lx, ly, 3, 0, Math.PI * 2);
        ctx.fill();
      });

      // Tracking HUD text
      ctx.fillStyle = "#94a3b8";
      ctx.font = "11px monospace";
      ctx.fillText("SIMULACIÓN BIOMÉTRICA FACIAL/POSTURAL", 14, 22);
      ctx.fillStyle = color;
      ctx.fillText(
        `INCLINACIÓN CERVICAL: ${
          simScenario === "optimo" ? "3°" : simScenario === "fatigado" ? "14°" : "29°"
        }`,
        14,
        296
      );

      animId = requestAnimationFrame(renderFrame);
    };

    animId = requestAnimationFrame(renderFrame);
    return () => cancelAnimationFrame(animId);
  }, [isOpen, activeTab, cameraMode, simScenario]);

  const handleRunCameraAnalysis = () => {
    setIsAnalyzingCam(true);
    setCamProgress(0);
    setCamResult(null);

    const interval = setInterval(() => {
      setCamProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsAnalyzingCam(false);

          // Compute metrics based on real frame luma if webcam active or chosen scenario
          let scenario: CameraScenario = simScenario;
          if (cameraMode === "webcam" && videoRef.current) {
            try {
              const temp = document.createElement("canvas");
              temp.width = 64;
              temp.height = 48;
              const tCtx = temp.getContext("2d");
              if (tCtx) {
                tCtx.drawImage(videoRef.current, 0, 0, 64, 48);
                const data = tCtx.getImageData(0, 0, 64, 48).data;
                let sum = 0;
                for (let i = 0; i < data.length; i += 4) {
                  sum += (data[i] + data[i + 1] + data[i + 2]) / 3;
                }
                const avgLuma = sum / (data.length / 4);
                scenario =
                  avgLuma > 95 ? "optimo" : avgLuma > 55 ? "fatigado" : "critico";
              }
            } catch {
              scenario = "optimo";
            }
          }

          if (scenario === "optimo") {
            setCamResult({
              mentalFatigue: 24,
              stressLevel: 26,
              lonelinessLevel: 22,
              boredomLevel: 25,
              postureScore: 88,
              facialTension: 19,
              moodScore: 86,
              summary:
                "Postura erguida (88/100), mirada atenta y microexpresiones relajadas sin signos de aislamiento o fatiga.",
            });
          } else if (scenario === "fatigado") {
            setCamResult({
              mentalFatigue: 58,
              stressLevel: 54,
              lonelinessLevel: 52,
              boredomLevel: 61,
              postureScore: 61,
              facialTension: 56,
              moodScore: 59,
              summary:
                "Leve encorvamiento dorsal (61/100), parpadeo lento y signos moderados de aburrimiento y cansancio mental.",
            });
          } else {
            setCamResult({
              mentalFatigue: 82,
              stressLevel: 81,
              lonelinessLevel: 76,
              boredomLevel: 74,
              postureScore: 41,
              facialTension: 80,
              moodScore: 37,
              summary:
                "ALERTA: Postura encorvada de agotamiento (41/100), tensión ocular alta y expresión facial de aislamiento severo.",
            });
          }
          return 100;
        }
        return prev + 12.5;
      });
    }, 240);
  };

  const handleUploadUltrasound = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setUploadedImageUrl(reader.result);
        setUsResult(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRunUltrasoundScan = () => {
    setIsScanningUS(true);
    setUsResult(null);

    setTimeout(() => {
      setIsScanningUS(false);
      if (selectedPreset === "bone") {
        if (usSimulateIssue) {
          setUsResult({
            statusLabel: "Precaución (Pérdida Ósea Leve)",
            finding:
              "Adelgazamiento cortical femoral detectado (densidad estimada 90.5%). Reforzar ejercicio ARED y Vitamina D.",
            updates: {
              boneDensityIndex: 90.5,
              physicalFatigue: 56,
            },
          });
        } else {
          setUsResult({
            statusLabel: "Óptimo (Densidad Estable)",
            finding:
              "Cortical femoral uniforme (96.5%). Sin desmineralización apreciable por microgravedad.",
            updates: {
              boneDensityIndex: 96.5,
              physicalFatigue: 26,
            },
          });
        }
      } else if (selectedPreset === "cardio") {
        if (usSimulateIssue) {
          setUsResult({
            statusLabel: "Precaución (Flujo Acelerado)",
            finding:
              "Llenado ventricular ligeramente reducido con pulso elevado (98 BPM). Incrementar hidratación con electrolitos.",
            updates: {
              bpm: 98,
              hydrationPercent: 74,
            },
          });
        } else {
          setUsResult({
            statusLabel: "Óptimo (Flujo Nominal)",
            finding:
              "Flujo sanguíneo en vena yugular y cámaras cardíacas estable (68 BPM, buena respuesta vascular).",
            updates: {
              bpm: 68,
              systolicBP: 118,
              diastolicBP: 76,
            },
          });
        }
      } else {
        if (usSimulateIssue) {
          setUsResult({
            statusLabel: "Precaución (Déficit Hídrico)",
            finding:
              "Signos ecográficos de hidratación baja (71%) con leve concentración renal. Tomar 500 ml de agua.",
            updates: {
              hydrationPercent: 71,
            },
          });
        } else {
          setUsResult({
            statusLabel: "Óptimo (Tejidos Normales)",
            finding:
              "Órganos abdominales y balance hídrico renal normales (hidratación estimada 87%).",
            updates: {
              hydrationPercent: 87,
            },
          });
        }
      }
    }, 1500);
  };

  if (!isOpen) return null;

  const activeUltrasoundImage = uploadedImageUrl || presetImageUrl;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3 backdrop-blur-sm sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-label="Nueva Evaluación y Escaneo Multimodal"
    >
      <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-3.5">
          <div>
            <h2 className="text-base font-bold text-slate-900 sm:text-lg">
              Módulo 3 · Nueva Evaluación y Escaneo Multimodal
            </h2>
            <p className="text-xs text-slate-500">
              Reúne tus indicadores mediante cámara postural, ultrasonido guiado o registro manual.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-xl border border-slate-200 bg-white p-1.5 text-slate-500 transition hover:text-slate-900"
            aria-label="Cerrar modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 3 Modal Tabs */}
        <div className="grid grid-cols-3 border-b border-slate-200 bg-slate-50/70 text-xs sm:text-sm">
          <button
            type="button"
            onClick={() => setActiveTab("camara")}
            className={`flex cursor-pointer items-center justify-center gap-2 border-b-2 px-3 py-3 font-semibold transition ${
              activeTab === "camara"
                ? "border-[#1a73e8] bg-white text-[#1a73e8]"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Camera className="h-4 w-4 shrink-0" />
            <span className="truncate">Cámara: Lenguaje Corporal</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("ultrasonido")}
            className={`flex cursor-pointer items-center justify-center gap-2 border-b-2 px-3 py-3 font-semibold transition ${
              activeTab === "ultrasonido"
                ? "border-[#1a73e8] bg-white text-[#1a73e8]"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Waves className="h-4 w-4 shrink-0" />
            <span className="truncate">Escáner de Ultrasonido</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("manual")}
            className={`flex cursor-pointer items-center justify-center gap-2 border-b-2 px-3 py-3 font-semibold transition ${
              activeTab === "manual"
                ? "border-[#1a73e8] bg-white text-[#1a73e8]"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Sliders className="h-4 w-4 shrink-0" />
            <span className="truncate">Registro Manual</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {/* TAB 1: CAMERA BODY LANGUAGE & EXPRESSIONS */}
          {activeTab === "camara" && (
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
              <div className="space-y-3 lg:col-span-7">
                <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-950 shadow-inner">
                  {cameraMode === "webcam" ? (
                    <div className="relative aspect-[3/2] w-full">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="h-full w-full object-cover"
                      />
                      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                        <div className="h-44 w-36 rounded-full border-2 border-dashed border-cyan-400/60" />
                      </div>
                      <div className="pointer-events-none absolute left-3 top-3 rounded bg-slate-950/80 px-2 py-1 font-mono-hud text-[11px] text-emerald-300">
                        WEBCAM ACTIVA · TRACKING FACIAL
                      </div>
                    </div>
                  ) : (
                    <canvas
                      ref={simCanvasRef}
                      width={480}
                      height={320}
                      className="aspect-[3/2] w-full object-cover"
                    />
                  )}

                  {isAnalyzingCam && (
                    <div className="absolute inset-x-0 bottom-0 bg-slate-950/90 p-3">
                      <div className="mb-1 flex justify-between font-mono-hud text-xs text-cyan-300">
                        <span>Analizando microexpresiones y postura...</span>
                        <span>{Math.round(camProgress)}%</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                        <div
                          className="h-full bg-[#1a73e8] transition-all"
                          style={{ width: `${camProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {cameraError && (
                  <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                    {cameraError}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={startWebcam}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100"
                  >
                    <Camera className="h-3.5 w-3.5 text-[#1a73e8]" />
                    Activar Cámara Web Real
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      stopWebcam();
                      setCameraMode("simulacion");
                    }}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100"
                  >
                    <VideoOff className="h-3.5 w-3.5 text-amber-600" />
                    Usar Simulación Biométrica
                  </button>
                </div>
              </div>

              {/* Camera Analysis Controls & Results */}
              <div className="flex flex-col justify-between space-y-4 lg:col-span-5">
                <div className="space-y-3">
                  <div className="rounded-xl border border-slate-200 bg-slate-50/75 p-4">
                    <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#1a73e8]">
                      <Cpu className="h-4 w-4" />
                      Análisis de Expresiones y Postura
                    </h3>
                    <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
                      Detecta inclinación encorvada de hombros, tensión ocular y microexpresiones para calcular cansancio mental, estrés, soledad y aburrimiento.
                    </p>

                    {cameraMode === "simulacion" && (
                      <div className="mt-3">
                        <label className="block text-[11px] font-semibold text-slate-700">
                          Escenario de Simulación (Sin cámara):
                        </label>
                        <div className="mt-1.5 grid grid-cols-3 gap-1.5">
                          {(
                            [
                              ["optimo", "Óptimo"],
                              ["fatigado", "Fatigado"],
                              ["critico", "Agotamiento"],
                            ] as const
                          ).map(([id, label]) => (
                            <button
                              key={id}
                              type="button"
                              onClick={() => setSimScenario(id)}
                              className={`cursor-pointer rounded-lg border px-2 py-1.5 text-[11px] font-semibold transition ${
                                simScenario === id
                                  ? "border-[#1a73e8] bg-[#1a73e8] text-white"
                                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
                              }`}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <button
                      type="button"
                      disabled={isAnalyzingCam}
                      onClick={handleRunCameraAnalysis}
                      className="mt-3 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#1a73e8] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-blue-700 disabled:opacity-50"
                    >
                      <Sparkles className="h-4 w-4" />
                      {isAnalyzingCam
                        ? "Escaneando Rostro y Postura..."
                        : "Iniciar Escaneo Biométrico"}
                    </button>
                  </div>

                  {camResult && (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5 text-xs">
                      <div className="font-bold text-emerald-800">
                        Resultado Calculado:
                      </div>
                      <p className="mt-1 text-slate-700">{camResult.summary}</p>
                      <div className="mt-2.5 grid grid-cols-2 gap-2 font-mono-hud text-[11px]">
                        <div className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-slate-700">
                          Fatiga Mental: {camResult.mentalFatigue}/100
                        </div>
                        <div className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-slate-700">
                          Estrés: {camResult.stressLevel}/100
                        </div>
                        <div className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-slate-700">
                          Soledad: {camResult.lonelinessLevel}/100
                        </div>
                        <div className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-slate-700">
                          Aburrimiento: {camResult.boredomLevel}/100
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          onApplyCameraResults(
                            {
                              mentalFatigue: camResult.mentalFatigue,
                              stressLevel: camResult.stressLevel,
                              lonelinessLevel: camResult.lonelinessLevel,
                              boredomLevel: camResult.boredomLevel,
                              stimulationIndex: 100 - camResult.boredomLevel,
                              postureScore: camResult.postureScore,
                              facialTension: camResult.facialTension,
                              moodScore: camResult.moodScore,
                            },
                            camResult.summary
                          );
                          onClose();
                        }}
                        className="mt-3 flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Aplicar al Dashboard
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ULTRASOUND SCANNER */}
          {activeTab === "ultrasonido" && (
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
              <div className="space-y-3 lg:col-span-7">
                <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-950 shadow-inner">
                  {activeUltrasoundImage ? (
                    <div className="relative aspect-[3/2] w-full overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={activeUltrasoundImage}
                        alt="Imagen de ultrasonido espacial"
                        className="h-full w-full object-contain"
                        style={{ filter: `contrast(${gainContrast}%)` }}
                      />
                      {isScanningUS && (
                        <div className="pointer-events-none absolute inset-y-0 left-0 w-1.5 bg-cyan-400/80 shadow-[0_0_20px_#22d3ee] animate-ultrasound" />
                      )}
                    </div>
                  ) : (
                    <div className="flex aspect-[3/2] items-center justify-center text-xs text-slate-400">
                      Generando muestra local de ultrasonido...
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100">
                    <Upload className="h-3.5 w-3.5 text-[#1a73e8]" />
                    <span>Subir Imagen Propia</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleUploadUltrasound}
                      className="hidden"
                    />
                  </label>
                  {uploadedImageUrl && (
                    <button
                      type="button"
                      onClick={() => setUploadedImageUrl(null)}
                      className="cursor-pointer text-xs font-medium text-[#1a73e8] hover:underline"
                    >
                      Volver a muestras predefinidas
                    </button>
                  )}

                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <span>Ganancia:</span>
                    <input
                      type="range"
                      min={70}
                      max={160}
                      value={gainContrast}
                      onChange={(e) => setGainContrast(Number(e.target.value))}
                      className="w-24 accent-[#1a73e8]"
                    />
                    <span className="font-mono-hud text-[11px] font-semibold">
                      {gainContrast}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3.5 lg:col-span-5">
                <div className="rounded-xl border border-slate-200 bg-slate-50/75 p-4">
                  <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#1a73e8]">
                    <FileImage className="h-4 w-4" />
                    Muestras Predefinidas Offline
                  </h3>
                  <div className="mt-2.5 space-y-1.5">
                    {ULTRASOUND_PRESETS.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setSelectedPreset(p.id);
                          setUploadedImageUrl(null);
                          setUsResult(null);
                        }}
                        className={`w-full cursor-pointer rounded-xl border px-3 py-2 text-left text-xs transition ${
                          selectedPreset === p.id && !uploadedImageUrl
                            ? "border-[#1a73e8] bg-blue-50 text-slate-900"
                            : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                        }`}
                      >
                        <div className="font-semibold">{p.title}</div>
                        <div className="text-[11px] text-slate-500">
                          {p.targetLabel}
                        </div>
                      </button>
                    ))}
                  </div>

                  <label className="mt-3 flex cursor-pointer items-center gap-2 text-xs text-slate-700">
                    <input
                      type="checkbox"
                      checked={usSimulateIssue}
                      onChange={(e) => setUsSimulateIssue(e.target.checked)}
                      className="accent-amber-600"
                    />
                    <span>Simular anomalía leve (demo preventiva)</span>
                  </label>

                  <button
                    type="button"
                    disabled={isScanningUS}
                    onClick={handleRunUltrasoundScan}
                    className="mt-3 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#1a73e8] px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    <Activity className="h-4 w-4" />
                    {isScanningUS
                      ? "Procesando Ecos Tisulares..."
                      : "Analizar Ultrasonido"}
                  </button>
                </div>

                {usResult && (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3.5 text-xs">
                    <div className="font-bold text-[#1a73e8]">
                      {usResult.statusLabel}
                    </div>
                    <p className="mt-1 leading-relaxed text-slate-700">
                      {usResult.finding}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        onApplyUltrasoundResults(
                          usResult.updates,
                          usResult.finding
                        );
                        onClose();
                      }}
                      className="mt-3 flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Guardar Hallazgo en Dashboard
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: MANUAL ENTRY WITH SLIDERS */}
          {activeTab === "manual" && (
            <div className="space-y-4">
              {/* Quick Presets */}
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <span className="text-xs font-semibold text-slate-700">
                  Cargar perfil rápido de prueba:
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setDraftBio((b) => ({
                        ...b,
                        bpm: 68,
                        bloodGlucoseMgDl: 95,
                        hydrationPercent: 86,
                        sleepHours: 7.5,
                        physicalFatigue: 25,
                        mentalFatigue: 24,
                        stressLevel: 26,
                        boredomLevel: 24,
                        stimulationIndex: 76,
                        moodScore: 86,
                      }));
                      setDraftRoutine((r) => ({
                        ...r,
                        sleepDeviationMin: 5,
                        exerciseMinutes: 120,
                        mealsCompleted: 3,
                        hydrationLiters: 2.5,
                      }));
                    }}
                    className="cursor-pointer rounded-lg border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                  >
                    Óptimo Nominal
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDraftBio((b) => ({
                        ...b,
                        bpm: 96,
                        bloodGlucoseMgDl: 69,
                        hydrationPercent: 73,
                        sleepHours: 5.7,
                        physicalFatigue: 62,
                        mentalFatigue: 60,
                        stressLevel: 63,
                        boredomLevel: 66,
                        stimulationIndex: 34,
                        moodScore: 54,
                      }));
                      setDraftRoutine((r) => ({
                        ...r,
                        sleepDeviationMin: 55,
                        exerciseMinutes: 65,
                        mealsCompleted: 2,
                        hydrationLiters: 1.7,
                      }));
                    }}
                    className="cursor-pointer rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-100"
                  >
                    Desviación Temprana
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* Column 1: Physiological */}
                <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/75 p-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#1a73e8]">
                    Signos Vitales y Fisiológicos
                  </h4>

                  <SliderField
                    label="Pulsaciones por minuto (BPM)"
                    value={draftBio.bpm}
                    min={42}
                    max={150}
                    unit="BPM"
                    onChange={(v) => setDraftBio((b) => ({ ...b, bpm: v }))}
                  />
                  <SliderField
                    label="Azúcar en la sangre (mg/dL)"
                    value={draftBio.bloodGlucoseMgDl}
                    min={50}
                    max={200}
                    unit="mg/dL"
                    onChange={(v) =>
                      setDraftBio((b) => ({ ...b, bloodGlucoseMgDl: v }))
                    }
                  />
                  <SliderField
                    label="Hidratación (%)"
                    value={draftBio.hydrationPercent}
                    min={50}
                    max={100}
                    unit="%"
                    onChange={(v) =>
                      setDraftBio((b) => ({ ...b, hydrationPercent: v }))
                    }
                  />
                  <SliderField
                    label="Temperatura Corporal (°C)"
                    value={draftBio.bodyTempC}
                    min={35.2}
                    max={39.0}
                    step={0.1}
                    unit="°C"
                    onChange={(v) =>
                      setDraftBio((b) => ({ ...b, bodyTempC: v }))
                    }
                  />
                  <SliderField
                    label="Cansancio Físico (0–100)"
                    value={draftBio.physicalFatigue}
                    min={0}
                    max={100}
                    unit="/100"
                    onChange={(v) =>
                      setDraftBio((b) => ({ ...b, physicalFatigue: v }))
                    }
                  />
                  <SliderField
                    label="Cortisol / Estrés Hormonal (0–100)"
                    value={draftBio.cortisolIndex}
                    min={10}
                    max={100}
                    unit="/100"
                    onChange={(v) =>
                      setDraftBio((b) => ({ ...b, cortisolIndex: v }))
                    }
                  />
                </div>

                {/* Column 2: Mental, Mood & Routine */}
                <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/75 p-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-700">
                    Salud Mental y Rutina Diaria
                  </h4>

                  <SliderField
                    label="Horas de Sueño"
                    value={draftBio.sleepHours}
                    min={3.0}
                    max={10.0}
                    step={0.1}
                    unit="hrs"
                    onChange={(v) =>
                      setDraftBio((b) => ({ ...b, sleepHours: v }))
                    }
                  />
                  <SliderField
                    label="Cansancio Mental (0–100)"
                    value={draftBio.mentalFatigue}
                    min={0}
                    max={100}
                    unit="/100"
                    onChange={(v) =>
                      setDraftBio((b) => ({
                        ...b,
                        mentalFatigue: v,
                        reactionTimeMs: Math.round(220 + v * 3.1),
                      }))
                    }
                  />
                  <SliderField
                    label="Estado de Ánimo General (0–100)"
                    value={draftBio.moodScore}
                    min={10}
                    max={100}
                    unit="/100"
                    onChange={(v) =>
                      setDraftBio((b) => ({ ...b, moodScore: v }))
                    }
                  />
                  <SliderField
                    label="Nivel de Estrés (0–100)"
                    value={draftBio.stressLevel}
                    min={0}
                    max={100}
                    unit="/100"
                    onChange={(v) =>
                      setDraftBio((b) => ({ ...b, stressLevel: v }))
                    }
                  />
                  <SliderField
                    label="Soledad / Aislamiento (0–100)"
                    value={draftBio.lonelinessLevel}
                    min={0}
                    max={100}
                    unit="/100"
                    onChange={(v) =>
                      setDraftBio((b) => ({ ...b, lonelinessLevel: v }))
                    }
                  />
                  <SliderField
                    label="Aburrimiento / Baja Estimulación (0–100)"
                    value={draftBio.boredomLevel}
                    min={0}
                    max={100}
                    unit="/100"
                    onChange={(v) =>
                      setDraftBio((b) => ({
                        ...b,
                        boredomLevel: v,
                        stimulationIndex: clamp(100 - v, 5, 100),
                      }))
                    }
                  />

                  <div className="border-t border-slate-200 pt-2">
                    <SliderField
                      label="Desviación de Horario de Sueño (min)"
                      value={draftRoutine.sleepDeviationMin}
                      min={0}
                      max={180}
                      unit="min"
                      onChange={(v) =>
                        setDraftRoutine((r) => ({ ...r, sleepDeviationMin: v }))
                      }
                    />
                    <SliderField
                      label="Minutos de Ejercicio Hoy"
                      value={draftRoutine.exerciseMinutes}
                      min={0}
                      max={150}
                      unit="min"
                      onChange={(v) =>
                        setDraftRoutine((r) => ({ ...r, exerciseMinutes: v }))
                      }
                    />
                    <SliderField
                      label="Agua Consumida Hoy (L)"
                      value={draftRoutine.hydrationLiters}
                      min={0.5}
                      max={3.5}
                      step={0.1}
                      unit="L"
                      onChange={(v) =>
                        setDraftRoutine((r) => ({ ...r, hydrationLiters: v }))
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="cursor-pointer rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onApplyManualEntry(draftBio, draftRoutine);
                    onClose();
                  }}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-[#1a73e8] px-4 py-2 text-xs font-bold text-white hover:bg-blue-700"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Guardar Evaluación en Dashboard
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface SliderFieldProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit: string;
  onChange: (value: number) => void;
}

function SliderField({
  label,
  value,
  min,
  max,
  step = 1,
  unit,
  onChange,
}: SliderFieldProps) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-700">{label}</span>
        <span className="font-mono-hud font-bold text-[#1a73e8]">
          {step < 1 ? value.toFixed(1) : value} {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1.5 w-full cursor-pointer accent-[#1a73e8]"
      />
    </div>
  );
}
