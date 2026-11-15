"use client";

import React, { useEffect, useId, useRef } from "react";

export type PhysioWaveMode = "ecg" | "ppg" | "abp" | "resp" | "metab" | "rad";

interface LivePhysioWaveformProps {
  mode: PhysioWaveMode;
  color: string;
  bpm?: number;
  hrvMs?: number;
  pttMs?: number;
  respiratoryRateRpm?: number;
  radiationMsv?: number;
  leadAmplitude?: number;
  phaseOffset?: number;
  heightClass?: string;
  width?: number;
  height?: number;
  showGrid?: boolean;
}

/**
 * Evaluates the normalized physiological signal [-1, +1] at exact 1:1 real-time
 * `tSec` (wall-clock seconds) matching true human physiology:
 * - Cardiac (ECG, PPG, ABP): exact `bpm / 60` beats per real second (e.g., 68 BPM = 1 beat every 0.882 s)
 * - Respiration (RESP): exact `respiratoryRateRpm / 60` breaths per real second (e.g., 15 RPM = 1 breath every 4.0 s)
 * - Metabolic / Thermal (METAB): true microvascular Mayer wave (~0.15 Hz, 1 slow wave every ~6.5 s)
 * - Radiation Dosimeter (RAD): realistic cosmic-ray particle scintillation hits
 */
function evaluatePhysioSignal(
  mode: PhysioWaveMode,
  tSec: number,
  params: {
    bpm: number;
    hrvMs: number;
    pttMs: number;
    respiratoryRateRpm: number;
    radiationMsv: number;
    leadAmplitude: number;
    phaseOffset: number;
  }
): number {
  const {
    bpm,
    hrvMs,
    pttMs,
    respiratoryRateRpm,
    radiationMsv,
    leadAmplitude,
    phaseOffset,
  } = params;

  // True 1:1 cardiac frequency in Hz (beats per real second)
  const beatFreqHz = Math.max(0.5, Math.min(3.0, bpm / 60));
  // True 1:1 respiratory frequency in Hz (breaths per real second)
  const respFreqHz = Math.max(0.1, Math.min(0.7, respiratoryRateRpm / 60));

  switch (mode) {
    case "ecg": {
      // Natural respiratory sinus arrhythmia (RSA) coupled to real breathing rate
      const rsaShift =
        0.015 *
        Math.min(1.3, hrvMs / 42) *
        Math.sin(2 * Math.PI * respFreqHz * tSec);
      const rawPhase = (tSec * beatFreqHz + phaseOffset + rsaShift) % 1;
      const p = rawPhase < 0 ? rawPhase + 1 : rawPhase;

      // Authentic P-QRS-T clinical morphology (1 beat per cardiac cycle)
      const pWave = 0.22 * Math.exp(-Math.pow((p - 0.14) / 0.032, 2));
      const qDip = -0.26 * Math.exp(-Math.pow((p - 0.238) / 0.009, 2));
      const rPeak = 1.15 * Math.exp(-Math.pow((p - 0.262) / 0.012, 2));
      const sDip = -0.36 * Math.exp(-Math.pow((p - 0.288) / 0.012, 2));
      const tWave = 0.34 * Math.exp(-Math.pow((p - 0.49) / 0.05, 2));

      return (pWave + qDip + rPeak + sDip + tWave - 0.12) * leadAmplitude;
    }

    case "ppg": {
      // Distal finger PPG delayed behind ECG by exact Pulse Transit Time (pttMs in seconds)
      const pttDelaySec = (pttMs || 194) / 1000;
      const rawPhase =
        ((tSec - pttDelaySec) * beatFreqHz + phaseOffset) % 1;
      const p = rawPhase < 0 ? rawPhase + 1 : rawPhase;

      // Systolic upstroke + dicrotic notch + diastolic runoff
      const systolicPeak = 0.96 * Math.exp(-Math.pow((p - 0.22) / 0.078, 2));
      const dicroticNotch = -0.22 * Math.exp(-Math.pow((p - 0.36) / 0.025, 2));
      const diastolicWave = 0.52 * Math.exp(-Math.pow((p - 0.46) / 0.11, 2));

      return systolicPeak + dicroticNotch + diastolicWave - 0.36;
    }

    case "abp": {
      // Continuous Arterial Blood Pressure wave (1:1 with heart rate, delayed 90 ms after R-peak)
      const rawPhase = ((tSec - 0.09) * beatFreqHz + phaseOffset) % 1;
      const p = rawPhase < 0 ? rawPhase + 1 : rawPhase;

      const systolicCrest = 1.04 * Math.exp(-Math.pow((p - 0.19) / 0.064, 2));
      const incisure = -0.26 * Math.exp(-Math.pow((p - 0.315) / 0.019, 2));
      const dicroticRunoff =
        0.56 * Math.exp(-Math.pow((p - 0.43) / 0.135, 2)) +
        0.18 * Math.exp(-Math.pow((p - 0.67) / 0.17, 2));

      return systolicCrest + incisure + dicroticRunoff - 0.4;
    }

    case "resp": {
      // True 1:1 human breathing cycle (e.g. 15 RPM = 4.0 seconds per breath: ~1.6s inhale, ~2.4s exhale)
      const theta = 2 * Math.PI * respFreqHz * tSec + phaseOffset;
      return 0.78 * Math.sin(theta) - 0.22 * Math.sin(2 * theta + 0.4);
    }

    case "metab": {
      // True slow microvascular Mayer vasomotion (~0.16 Hz) + gentle arterial perfusion ripple
      const slowMayer = 0.58 * Math.sin(2 * Math.PI * 0.16 * tSec + phaseOffset);
      const perfusionRipple = 0.22 * Math.sin(2 * Math.PI * 0.38 * tSec + 0.7);
      return slowMayer + perfusionRipple;
    }

    case "rad": {
      // Real-time cosmic ray MOSFET scintillation counter (isolated GCR particle hits)
      const intensity = Math.max(0.3, Math.min(2.2, radiationMsv / 0.65));
      const p1 = (tSec * (0.28 + intensity * 0.14)) % 1;
      const p2 = (tSec * (0.47 + intensity * 0.22) + 0.41) % 1;

      const spike1 = 0.96 * Math.exp(-Math.pow((p1 - 0.35) / 0.012, 2));
      const spike2 =
        intensity > 0.75
          ? 0.78 * Math.exp(-Math.pow((p2 - 0.72) / 0.011, 2))
          : 0;
      const baselineNoise = 0.04 * Math.sin(2 * Math.PI * 1.2 * tSec);

      return spike1 + spike2 + baselineNoise - 0.36;
    }
  }
}

export default function LivePhysioWaveform({
  mode,
  color,
  bpm = 68,
  hrvMs = 42,
  pttMs = 192,
  respiratoryRateRpm = 15,
  radiationMsv = 0.45,
  leadAmplitude = 1,
  phaseOffset = 0,
  heightClass = "h-6",
  width = 160,
  height = 28,
  showGrid = false,
}: LivePhysioWaveformProps) {
  const rawId = useId();
  const gradId = `wave-grad-${rawId.replace(/:/g, "")}`;

  const wavePathRef = useRef<SVGPathElement | null>(null);
  const areaPathRef = useRef<SVGPathElement | null>(null);
  const cursorDotRef = useRef<SVGCircleElement | null>(null);
  const cursorHaloRef = useRef<SVGCircleElement | null>(null);

  const paramsRef = useRef({
    bpm,
    hrvMs,
    pttMs,
    respiratoryRateRpm,
    radiationMsv,
    leadAmplitude,
    phaseOffset,
  });

  useEffect(() => {
    paramsRef.current = {
      bpm,
      hrvMs,
      pttMs,
      respiratoryRateRpm,
      radiationMsv,
      leadAmplitude,
      phaseOffset,
    };
  }, [
    bpm,
    hrvMs,
    pttMs,
    respiratoryRateRpm,
    radiationMsv,
    leadAmplitude,
    phaseOffset,
  ]);

  useEffect(() => {
    const numSamples = Math.max(96, Math.floor(width / 1.5));
    const usableWidth = width - 5;

    // Realistic hospital monitor time window in true wall-clock seconds:
    // - Cardiac strips (ECG/PPG/ABP): 4.4 seconds visible (~5 real heartbeats at 68 BPM)
    // - Respiration / Metabolic / Radiation: 7.5 seconds visible (~2 full breaths at 15 RPM)
    const windowDurationSec =
      mode === "resp" || mode === "metab"
        ? 7.5
        : mode === "rad"
        ? 6.0
        : width > 220
        ? 5.2
        : 4.4;

    const mapSignalToY = (sig: number): number => {
      const center = height * 0.58;
      const scale = height * 0.39;
      const rawY = center - sig * scale;
      return Math.max(2.5, Math.min(height - 2.5, rawY));
    };

    let animId = 0;

    const renderFrame = (nowMs: number) => {
      // Exact 1:1 real-time wall-clock seconds (1 second = 1000 ms)
      const nowSec = nowMs / 1000;
      const stepX = usableWidth / (numSamples - 1);

      let pathD = "";
      let lastX = "0";
      let lastY = (height * 0.58).toFixed(1);

      for (let i = 0; i < numSamples; i++) {
        const frac = i / (numSamples - 1);
        const sampleT = nowSec - (1 - frac) * windowDurationSec;
        const sig = evaluatePhysioSignal(mode, sampleT, paramsRef.current);
        const x = (i * stepX).toFixed(1);
        const y = mapSignalToY(sig).toFixed(1);

        pathD += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
        if (i === numSamples - 1) {
          lastX = x;
          lastY = y;
        }
      }

      if (wavePathRef.current) {
        wavePathRef.current.setAttribute("d", pathD);
      }
      if (areaPathRef.current) {
        areaPathRef.current.setAttribute(
          "d",
          `${pathD} L ${lastX} ${height} L 0 ${height} Z`
        );
      }
      if (cursorDotRef.current) {
        cursorDotRef.current.setAttribute("cx", lastX);
        cursorDotRef.current.setAttribute("cy", lastY);
      }
      if (cursorHaloRef.current) {
        cursorHaloRef.current.setAttribute("cx", lastX);
        cursorHaloRef.current.setAttribute("cy", lastY);
      }

      animId = requestAnimationFrame(renderFrame);
    };

    animId = requestAnimationFrame(renderFrame);
    return () => cancelAnimationFrame(animId);
  }, [mode, width, height]);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={`${heightClass} w-full overflow-visible`}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={color} stopOpacity="0.18" />
          <stop offset="35%" stopColor={color} stopOpacity="0.65" />
          <stop offset="100%" stopColor={color} stopOpacity="1" />
        </linearGradient>
      </defs>

      {showGrid && (
        <line
          x1="0"
          y1={height * 0.58}
          x2={width}
          y2={height * 0.58}
          stroke="#182742"
          strokeWidth="1"
          strokeDasharray="2 2"
        />
      )}

      {/* Subtle phosphor glow under-fill */}
      <path
        ref={areaPathRef}
        fill={color}
        opacity="0.06"
      />

      {/* Continuous 1:1 real-time scrolling physiological waveform */}
      <path
        ref={wavePathRef}
        fill="none"
        stroke={`url(#${gradId})`}
        strokeWidth="1.85"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Glowing phosphor leading-edge halo */}
      <circle
        ref={cursorHaloRef}
        r="4.5"
        fill={color}
        opacity="0.32"
      />

      {/* Crisp phosphor leading-edge point */}
      <circle
        ref={cursorDotRef}
        r="2.1"
        fill="#ffffff"
        stroke={color}
        strokeWidth="1.2"
      />
    </svg>
  );
}
