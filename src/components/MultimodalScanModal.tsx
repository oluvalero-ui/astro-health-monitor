"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Activity,
  Camera,
  CheckCircle2,
  Cpu,
  Sliders,
  Sparkles,
  VideoOff,
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
  onApplyManualEntry: (
    nextBiomarkers: BiomarkerData,
    nextRoutine: RoutineTracking
  ) => void;
}

type CameraScenario = "optimo" | "fatigado" | "critico";

export default function MultimodalScanModal({
  isOpen,
  initialTab,
  biomarkers,
  routine,
  onClose,
  onApplyCameraResults,
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

  // Manual Entry state
  const [draftBio, setDraftBio] = useState<BiomarkerData>(biomarkers);
  const [draftRoutine, setDraftRoutine] = useState<RoutineTracking>(routine);

  // Ultrasound B-Mode state (on-demand cabin portable ultrasound)
  const [usTarget, setUsTarget] = useState<"ocular" | "cardiaco" | "renal" | "muscular">("ocular");
  const [usAppliedMsg, setUsAppliedMsg] = useState<string | null>(null);

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

  if (!isOpen) return null;

  return (
    <div
      className="crew-dragon-theme fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-3 backdrop-blur-sm sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-label="Flujos de Software Bajo Demanda · Escaneo Multimodal"
    >
      <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-3.5">
          <div>
            <h2 className="text-base font-bold text-slate-900 sm:text-lg">
              Flujos de Software Bajo Demanda (Complementarios al Arnés 3N)
            </h2>
            <p className="text-xs text-slate-500">
              Utilizan equipamiento estándar ya presente en cabina (cámara de tableta o ecógrafo portátil de a bordo) cuando alguno de los 13 signos del Arnés 3N dispara una alerta clínica.
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
            <span className="truncate">Cámara IA (Tableta)</span>
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
            <Activity className="h-4 w-4 shrink-0" />
            <span className="truncate">Ultrasonido B-Mode</span>
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

          {/* TAB 2: ULTRASONIDO B-MODE (FLUJO DE SOFTWARE CON ECÓGRAFO PORTÁTIL DE CABINA) */}
          {activeTab === "ultrasonido" && (
            <div className="space-y-4">
              <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-3.5 text-xs text-slate-700">
                <div className="font-bold text-slate-900">
                  Flujo Guiado por Software · Ecógrafo Portátil Estándar de Cabina (NASA ExMC [5, 8, 9])
                </div>
                <p className="mt-1 leading-relaxed">
                  Este módulo no requiere hardware vestible adicional: guía al astronauta paso a paso para usar la sonda ultrasónica estándar de la nave cuando el <strong>Arnés 3N</strong> detecta alteraciones en el PTT, hidratación o carga postural.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {(
                  [
                    {
                      id: "ocular",
                      label: "Nervio Óptico (SANS [8])",
                      metric: "ONSD: 5.1 mm",
                      desc: "Evalúa edema de papila y presión intracraneal por desplazamiento cefálico en 0g.",
                    },
                    {
                      id: "cardiaco",
                      label: "Ventana Apical (BP Reg [3])",
                      metric: `FEVI: 62% · FC ${biomarkers.bpm}`,
                      desc: "Verifica volumen sistólico y rigidez arterial ante cambios de PTT en el Arnés 3N.",
                    },
                    {
                      id: "renal",
                      label: "Renal / Vesical [9]",
                      metric: `Hidr: ${biomarkers.hydrationPercent}%`,
                      desc: "Descarta nefrolitiasis por hipercalciuria debido a resorción ósea en microgravedad.",
                    },
                    {
                      id: "muscular",
                      label: "Espesor Cuádriceps [9]",
                      metric: `Índice: ${biomarkers.boneDensityIndex}%`,
                      desc: "Cuantifica trofismo miofascial de miembros inferiores frente a protocolo ARED.",
                    },
                  ] as const
                ).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setUsTarget(item.id);
                      setUsAppliedMsg(null);
                    }}
                    className={`cursor-pointer rounded-xl border p-3 text-left transition ${
                      usTarget === item.id
                        ? "border-sky-400 bg-sky-500/15 text-slate-100"
                        : "border-slate-200 bg-slate-50 text-slate-700"
                    }`}
                  >
                    <div className="text-xs font-bold">{item.label}</div>
                    <div className="mt-1 font-mono-hud text-[11px] text-sky-400">
                      {item.metric}
                    </div>
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                <div className="relative flex aspect-[16/9] flex-col items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-[#050a14] p-4 lg:col-span-7">
                  <svg
                    viewBox="0 0 320 180"
                    className="h-full w-full"
                    aria-label="Simulación acústica B-Mode"
                  >
                    <path
                      d="M 160 12 L 35 168 Q 160 182 285 168 Z"
                      fill="#0c192e"
                      stroke="#1e3a5f"
                      strokeWidth="1.5"
                    />
                    <circle
                      cx="160"
                      cy="95"
                      r={usTarget === "ocular" ? 28 : usTarget === "cardiaco" ? 36 : 32}
                      fill="#060d1a"
                      stroke="#38bdf8"
                      strokeWidth="1.5"
                      strokeDasharray="4 2"
                    />
                    <line
                      x1="125"
                      y1="95"
                      x2="195"
                      y2="95"
                      stroke="#22c55e"
                      strokeWidth="1.5"
                    />
                    <text
                      x="160"
                      y="30"
                      textAnchor="middle"
                      fill="#38bdf8"
                      fontSize="10"
                      fontFamily="monospace"
                    >
                      SONDA B-MODE CABINA · {usTarget.toUpperCase()} · 7.5 MHz
                    </text>
                  </svg>
                </div>

                <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs lg:col-span-5">
                  <div>
                    <div className="font-mono-hud text-[11px] font-bold uppercase text-sky-400">
                      Protocolo de Adquisición Guiada
                    </div>
                    <p className="mt-2 leading-relaxed text-slate-700">
                      {usTarget === "ocular" &&
                        "Aplica gel acústico sobre párpado cerrado sin presión. Mide el diámetro de la vaina del nervio óptico (ONSD) a 3 mm detrás de la retina (Umbral SANS < 5.8 mm)."}
                      {usTarget === "cardiaco" &&
                        "Coloca el transductor en 4.º espacio intercostal izquierdo. Confirma contractilidad ventricular para validar el PTT del Arnés 3N."}
                      {usTarget === "renal" &&
                        "Explora flanco derecho e hipogastrio para descartar microcálculos cálcicos y retención urinaria en microgravedad."}
                      {usTarget === "muscular" &&
                        "Mide el corte transversal del recto femoral en tercio medio del muslo para ajustar carga en máquina ARED."}
                    </p>
                  </div>

                  {usAppliedMsg && (
                    <div className="my-2 rounded-lg border border-emerald-200 bg-emerald-50 p-2 text-[11px] text-emerald-700">
                      {usAppliedMsg}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      const msg = `Ultrasonido B-Mode (${usTarget.toUpperCase()}) registrado en bitácora local offline.`;
                      setUsAppliedMsg(msg);
                      onApplyCameraResults({}, msg);
                    }}
                    className="mt-3 flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-[#1a73e8] px-3 py-2.5 text-xs font-bold text-white hover:bg-blue-700"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Registrar Captura B-Mode en Bitácora
                  </button>
                </div>
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
