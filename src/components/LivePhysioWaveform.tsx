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
 * Evaluates the normalized physiological signal [-1, +1] at time `tSec` (seconds)
 * for each biomedical waveform modality.
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

  const beatFreqHz = Math.max(0.65, Math.min(2.8, bpm / 60));

  switch (mode) {
    case "ecg": {
      // Subtle respiratory sinus arrhythmia modulation from HRV
      const rsaShift =
        0.02 *
        Math.min(1.4, hrvMs / 40) *
        Math.sin(2 * Math.PI * 0.25 * tSec);
      const rawPhase = (tSec * beatFreqHz + phaseOffset + rsaShift) % 1;
      const p = rawPhase < 0 ? rawPhase + 1 : rawPhase;

      // Authentic P-QRS-T clinical morphology (Lead II / Lead I / V5)
      const pWave = 0.22 * Math.exp(-Math.pow((p - 0.14) / 0.032, 2));
      const qDip = -0.26 * Math.exp(-Math.pow((p - 0.238) / 0.009, 2));
      const rPeak = 1.12 * Math.exp(-Math.pow((p - 0.262) / 0.012, 2));
      const sDip = -0.36 * Math.exp(-Math.pow((p - 0.288) / 0.012, 2));
      const tWave = 0.34 * Math.exp(-Math.pow((p - 0.49) / 0.05, 2));

      return (pWave + qDip + rPeak + sDip + tWave - 0.12) * leadAmplitude;
    }

    case "ppg": {
      // Optical pulse wave delayed by chest-to-finger Pulse Transit Time (PTT)
      const pttDelaySec = (pttMs || 190) / 1000;
      const rawPhase =
        ((tSec - pttDelaySec) * beatFreqHz + phaseOffset) % 1;
      const p = rawPhase < 0 ? rawPhase + 1 : rawPhase;

      // Steep systolic upstroke + characteristic dicrotic notch + diastolic runoff
      const systolicPeak = 0.96 * Math.exp(-Math.pow((p - 0.22) / 0.078, 2));
      const dicroticNotch = -0.22 * Math.exp(-Math.pow((p - 0.36) / 0.025, 2));
      const diastolicWave = 0.52 * Math.exp(-Math.pow((p - 0.46) / 0.11, 2));

      return systolicPeak + dicroticNotch + diastolicWave - 0.36;
    }

    case "abp": {
      // Continuous Arterial Blood Pressure waveform (systolic crest + sharp dicrotic incisure)
      const rawPhase = ((tSec - 0.08) * beatFreqHz + phaseOffset) % 1;
      const p = rawPhase < 0 ? rawPhase + 1 : rawPhase;

      const systolicCrest = 1.04 * Math.exp(-Math.pow((p - 0.19) / 0.064, 2));
      const incisure = -0.26 * Math.exp(-Math.pow((p - 0.315) / 0.019, 2));
      const dicroticRunoff =
        0.56 * Math.exp(-Math.pow((p - 0.43) / 0.135, 2)) +
        0.18 * Math.exp(-Math.pow((p - 0.67) / 0.17, 2));

      return systolicCrest + incisure + dicroticRunoff - 0.4;
    }

    case "resp": {
      // Thoracic impedance / capnography wave (slower asymmetric inspiration/expiration)
      const respHz = Math.max(
        0.28,
        Math.min(0.95, (respiratoryRateRpm / 60) * 1.55)
      );
      const theta = 2 * Math.PI * respHz * tSec + phaseOffset;
      return (
        0.74 * Math.sin(theta) -
        0.24 * Math.sin(2 * theta + 0.45) +
        0.08 * Math.cos(3 * theta)
      );
    }

    case "metab": {
      // Zero-Heat-Flux cranial & microvascular vasomotion wave
      const theta = 2 * Math.PI * 0.62 * tSec + phaseOffset;
      return (
        0.54 * Math.sin(theta) +
        0.28 * Math.sin(2.4 * theta + 0.9) +
        0.16 * Math.cos(4.2 * theta)
      );
    }

    case "rad": {
      // Silicon MOSFET dosimeter scintillation pulse train (GCR / SPE particle hits)
      const intensity = Math.max(0.35, Math.min(2.2, radiationMsv / 0.65));
      const p1 = (tSec * (0.95 + intensity * 0.4)) % 1;
      const p2 = (tSec * (1.65 + intensity * 0.55) + 0.37) % 1;
      const p3 = (tSec * (2.4 + intensity * 0.7) + 0.71) % 1;

      const spike1 = 0.98 * Math.exp(-Math.pow((p1 - 0.22) / 0.016, 2));
      const spike2 =
        0.68 *
        Math.min(1.3, intensity) *
        Math.exp(-Math.pow((p2 - 0.58) / 0.014, 2));
      const spike3 =
        intensity > 0.85
          ? 0.88 * Math.exp(-Math.pow((p3 - 0.81) / 0.013, 2))
          : 0;
      const ripple = 0.06 * Math.sin(2 * Math.PI * 6.0 * tSec);

      return spike1 + spike2 + spike3 + ripple - 0.38;
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
    const numSamples = Math.max(84, Math.floor(width / 1.6));
    const usableWidth = width - 5;
    const windowDurationSec =
      mode === "resp" ? 4.2 : width > 220 ? 3.4 : 2.6;
    // Calm bedside ICU monitor sweep speed (25 mm/s equivalent visual cadence)
    const timeSpeedFactor = 0.42;

    const mapSignalToY = (sig: number): number => {
      const center = height * 0.58;
      const scale = height * 0.39;
      const rawY = center - sig * scale;
      return Math.max(2.5, Math.min(height - 2.5, rawY));
    };

    let animId = 0;

    const renderFrame = (nowMs: number) => {
      const nowSec = (nowMs / 1000) * timeSpeedFactor;
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

      {/* Continuous real-time scrolling physiological waveform */}
      <path
        ref={wavePathRef}
        fill="none"
        stroke={`url(#${gradId})`}
        strokeWidth="1.95"
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
