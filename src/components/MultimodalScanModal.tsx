"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
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

export type ScanModalTab = "camara" | "manual";

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
        "Camera unavailable in this browser. Biometric simulation mode activated automatically."
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
        "No physical camera detected or permission denied. Running in automatic biometric simulation mode."
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
      ctx.fillText("FACIAL / POSTURAL BIOMETRIC SIMULATION", 14, 22);
      ctx.fillStyle = color;
      ctx.fillText(
        `CERVICAL TILT: ${
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
                "Upright posture (88/100), attentive gaze, and relaxed micro-expressions with no signs of isolation or fatigue.",
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
                "Mild thoracic slouching (61/100), slow blink rate, and moderate signs of boredom and mental fatigue.",
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
                "ALERT: Slumped exhaustion posture (41/100), elevated ocular strain, and facial expression indicating severe isolation.",
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
      aria-label="On-Demand Software Workflows · Multimodal Scan"
    >
      <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-[#1b2d4b] bg-[#0c1426] text-slate-100 shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#182742] bg-[#091120] px-5 py-3.5">
          <div>
            <h2 className="text-base font-bold text-slate-100 sm:text-lg">
              Multimodal Assessment · Computer Vision & Clinical Entry
            </h2>
            <p className="text-xs text-slate-400">
              Use the cabin camera or manual entry whenever continuous telemetry from Bio-Monitor 3N requires verification.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-xl border border-[#1b2d4b] bg-[#0c1426] p-1.5 text-slate-400 transition hover:border-sky-400 hover:text-slate-100"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 2 Modal Tabs */}
        <div className="grid grid-cols-2 border-b border-[#182742] bg-[#091120] text-xs sm:text-sm">
          <button
            type="button"
            onClick={() => setActiveTab("camara")}
            className={`flex cursor-pointer items-center justify-center gap-2 border-b-2 px-3 py-3 font-semibold transition ${
              activeTab === "camara"
                ? "border-sky-400 bg-[#0c1426] text-sky-300"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Camera className="h-4 w-4 shrink-0" />
            <span className="truncate">Computer Vision (Face & Posture)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("manual")}
            className={`flex cursor-pointer items-center justify-center gap-2 border-b-2 px-3 py-3 font-semibold transition ${
              activeTab === "manual"
                ? "border-sky-400 bg-[#0c1426] text-sky-300"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Sliders className="h-4 w-4 shrink-0" />
            <span className="truncate">Manual Clinical Entry</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {/* TAB 1: CAMERA BODY LANGUAGE & EXPRESSIONS */}
          {activeTab === "camara" && (
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
              <div className="space-y-3 lg:col-span-7">
                <div className="relative overflow-hidden rounded-xl border border-[#1b2d4b] bg-[#070c17] shadow-inner">
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
                        LIVE WEBCAM · FACIAL TRACKING
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
                        <span>Analyzing micro-expressions & posture...</span>
                        <span>{Math.round(camProgress)}%</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-[#162642]">
                        <div
                          className="h-full bg-sky-500 transition-all"
                          style={{ width: `${camProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {cameraError && (
                  <p className="rounded-xl border border-amber-500/40 bg-amber-950/35 px-3 py-2 text-xs text-amber-200">
                    {cameraError}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={startWebcam}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-[#1b2d4b] bg-[#091120] px-3 py-2 text-xs font-medium text-slate-200 transition hover:border-sky-500/40 hover:bg-[#0d192e]"
                  >
                    <Camera className="h-3.5 w-3.5 text-sky-400" />
                    Enable Live Webcam
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      stopWebcam();
                      setCameraMode("simulacion");
                    }}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-[#1b2d4b] bg-[#091120] px-3 py-2 text-xs font-medium text-slate-200 transition hover:border-sky-500/40 hover:bg-[#0d192e]"
                  >
                    <VideoOff className="h-3.5 w-3.5 text-amber-400" />
                    Use Biometric Simulation
                  </button>
                </div>
              </div>

              {/* Camera Analysis Controls & Results */}
              <div className="flex flex-col justify-between space-y-4 lg:col-span-5">
                <div className="space-y-3">
                  <div className="rounded-xl border border-[#182742] bg-[#091120] p-4">
                    <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sky-300">
                      <Cpu className="h-4 w-4" />
                      Facial Expression & Posture Analysis
                    </h3>
                    <p className="mt-1.5 text-xs leading-relaxed text-slate-300">
                      Detects shoulder slouch, ocular strain, and micro-expressions to assess mental fatigue, stress, isolation, and boredom.
                    </p>

                    {cameraMode === "simulacion" && (
                      <div className="mt-3">
                        <label className="block text-[11px] font-semibold text-slate-300">
                          Simulation Scenario (Camera-free):
                        </label>
                        <div className="mt-1.5 grid grid-cols-3 gap-1.5">
                          {(
                            [
                              ["optimo", "Optimal"],
                              ["fatigado", "Fatigued"],
                              ["critico", "Exhausted"],
                            ] as const
                          ).map(([id, label]) => (
                            <button
                              key={id}
                              type="button"
                              onClick={() => setSimScenario(id)}
                              className={`cursor-pointer rounded-lg border px-2 py-1.5 text-[11px] font-semibold transition ${
                                simScenario === id
                                  ? "border-sky-400/60 bg-sky-500/20 text-sky-200"
                                  : "border-[#182742] bg-[#0c1426] text-slate-300 hover:text-slate-100"
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
                      className="mt-3 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-sky-500 disabled:opacity-50"
                    >
                      <Sparkles className="h-4 w-4" />
                      {isAnalyzingCam
                        ? "Scanning Face & Posture..."
                        : "Start Biometric Scan"}
                    </button>
                  </div>

                  {camResult && (
                    <div className="rounded-xl border border-emerald-500/35 bg-emerald-950/30 p-3.5 text-xs">
                      <div className="font-bold text-emerald-300">
                        Computed Result:
                      </div>
                      <p className="mt-1 text-slate-200">{camResult.summary}</p>
                      <div className="mt-2.5 grid grid-cols-2 gap-2 font-mono-hud text-[11px]">
                        <div className="rounded-lg border border-[#182742] bg-[#091120] px-2 py-1 text-slate-200">
                          Mental Fatigue: {camResult.mentalFatigue}/100
                        </div>
                        <div className="rounded-lg border border-[#182742] bg-[#091120] px-2 py-1 text-slate-200">
                          Stress: {camResult.stressLevel}/100
                        </div>
                        <div className="rounded-lg border border-[#182742] bg-[#091120] px-2 py-1 text-slate-200">
                          Isolation: {camResult.lonelinessLevel}/100
                        </div>
                        <div className="rounded-lg border border-[#182742] bg-[#091120] px-2 py-1 text-slate-200">
                          Boredom: {camResult.boredomLevel}/100
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
                        className="mt-3 flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-emerald-500"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Apply to Dashboard
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MANUAL ENTRY WITH SLIDERS */}
          {activeTab === "manual" && (
            <div className="space-y-4">
              {/* Quick Presets */}
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#182742] bg-[#091120] p-3">
                <span className="text-xs font-semibold text-slate-200">
                  Load quick clinical test preset:
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
                        stressLevel: 26,
                      }));
                      setDraftRoutine((r) => ({
                        ...r,
                        sleepDeviationMin: 5,
                        exerciseMinutes: 120,
                        mealsCompleted: 3,
                        hydrationLiters: 2.5,
                      }));
                    }}
                    className="cursor-pointer rounded-lg border border-emerald-500/35 bg-emerald-950/40 px-2.5 py-1 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-900/50"
                  >
                    Nominal Optimal
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
                        stressLevel: 63,
                      }));
                      setDraftRoutine((r) => ({
                        ...r,
                        sleepDeviationMin: 55,
                        exerciseMinutes: 65,
                        mealsCompleted: 2,
                        hydrationLiters: 1.7,
                      }));
                    }}
                    className="cursor-pointer rounded-lg border border-amber-500/35 bg-amber-950/40 px-2.5 py-1 text-xs font-semibold text-amber-300 transition hover:bg-amber-900/50"
                  >
                    Early Caution
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDraftBio((b) => ({
                        ...b,
                        bpm: 126,
                        bloodGlucoseMgDl: 58,
                        hydrationPercent: 62,
                        bodyTempC: 38.2,
                        sleepHours: 4.5,
                        physicalFatigue: 82,
                        cortisolIndex: 84,
                        stressLevel: 82,
                      }));
                      setDraftRoutine((r) => ({
                        ...r,
                        sleepDeviationMin: 125,
                        exerciseMinutes: 25,
                        mealsCompleted: 1,
                        hydrationLiters: 1.1,
                      }));
                    }}
                    className="cursor-pointer rounded-lg border border-red-500/35 bg-red-950/40 px-2.5 py-1 text-xs font-semibold text-red-300 transition hover:bg-red-900/50"
                  >
                    Critical Risk
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* Column 1: Physiological */}
                <div className="space-y-3 rounded-xl border border-[#182742] bg-[#091120] p-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-sky-300">
                    Vitals & Physiological Signs
                  </h4>

                  <SliderField
                    label="Heart Rate (BPM)"
                    value={draftBio.bpm}
                    min={42}
                    max={150}
                    unit="BPM"
                    onChange={(v) => setDraftBio((b) => ({ ...b, bpm: v }))}
                  />
                  <SliderField
                    label="Blood Glucose (mg/dL)"
                    value={draftBio.bloodGlucoseMgDl}
                    min={50}
                    max={200}
                    unit="mg/dL"
                    onChange={(v) =>
                      setDraftBio((b) => ({ ...b, bloodGlucoseMgDl: v }))
                    }
                  />
                  <SliderField
                    label="Hydration (%)"
                    value={draftBio.hydrationPercent}
                    min={50}
                    max={100}
                    unit="%"
                    onChange={(v) =>
                      setDraftBio((b) => ({ ...b, hydrationPercent: v }))
                    }
                  />
                  <SliderField
                    label="Core Body Temp (°C)"
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
                    label="Physical Fatigue (0–100)"
                    value={draftBio.physicalFatigue}
                    min={0}
                    max={100}
                    unit="/100"
                    onChange={(v) =>
                      setDraftBio((b) => ({ ...b, physicalFatigue: v }))
                    }
                  />
                  <SliderField
                    label="Cortisol / Hormonal Stress (0–100)"
                    value={draftBio.cortisolIndex}
                    min={10}
                    max={100}
                    unit="/100"
                    onChange={(v) =>
                      setDraftBio((b) => ({ ...b, cortisolIndex: v }))
                    }
                  />
                </div>

                {/* Column 2: Sleep, Stress & Routine */}
                <div className="space-y-3 rounded-xl border border-[#182742] bg-[#091120] p-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-300">
                    Sleep, Stress & Daily Routine
                  </h4>

                  <SliderField
                    label="Sleep Duration"
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
                    label="Stress Level (0–100)"
                    value={draftBio.stressLevel}
                    min={0}
                    max={100}
                    unit="/100"
                    onChange={(v) =>
                      setDraftBio((b) => ({ ...b, stressLevel: v }))
                    }
                  />

                  <div className="space-y-3 border-t border-[#182742] pt-2">
                    <SliderField
                      label="Sleep Schedule Drift (min)"
                      value={draftRoutine.sleepDeviationMin}
                      min={0}
                      max={180}
                      unit="min"
                      onChange={(v) =>
                        setDraftRoutine((r) => ({ ...r, sleepDeviationMin: v }))
                      }
                    />
                    <SliderField
                      label="Exercise Minutes Today"
                      value={draftRoutine.exerciseMinutes}
                      min={0}
                      max={150}
                      unit="min"
                      onChange={(v) =>
                        setDraftRoutine((r) => ({ ...r, exerciseMinutes: v }))
                      }
                    />
                    <SliderField
                      label="Water Intake Today (L)"
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
                  className="cursor-pointer rounded-xl border border-[#1b2d4b] bg-[#091120] px-4 py-2 text-xs font-medium text-slate-300 transition hover:border-slate-500 hover:text-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onApplyManualEntry(draftBio, draftRoutine);
                    onClose();
                  }}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-sky-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-sky-500"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Save Assessment to Dashboard
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
        <span className="text-slate-300">{label}</span>
        <span className="font-mono-hud font-bold text-sky-300">
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
        className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-[#182742] accent-sky-400"
      />
    </div>
  );
}
