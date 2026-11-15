"use client";

import React from "react";
import {
  Activity,
  BarChart3,
  BookOpen,
  Camera,
  Home,
  Monitor,
  ShieldAlert,
  Watch,
} from "lucide-react";

export type NavSectionId =
  | "resumen"
  | "escaner"
  | "wearable"
  | "biomarcadores"
  | "informes";

interface LeftNavSidebarProps {
  activeSection: NavSectionId;
  emergencyMode: boolean;
  onNavigate: (section: NavSectionId) => void;
  onOpenScanModal: () => void;
  onOpenReferences: () => void;
  onToggleEmergency: () => void;
}

export default function LeftNavSidebar({
  activeSection,
  emergencyMode,
  onNavigate,
  onOpenScanModal,
  onOpenReferences,
  onToggleEmergency,
}: LeftNavSidebarProps) {
  const navBtnClass = (isActive: boolean) =>
    `group relative flex h-12 w-12 cursor-pointer items-center justify-center rounded-xl transition-all ${
      isActive
        ? "bg-[#1a73e8] text-white shadow-lg shadow-blue-950/50"
        : "text-blue-100/75 hover:bg-white/10 hover:text-white"
    }`;

  return (
    <>
      {/* Desktop Left Navy Sidebar (matches reference design) */}
      <aside
        aria-label="Navegación principal del monitor"
        className="hidden shrink-0 flex-col items-center justify-between bg-[#0b2559] px-2.5 py-4 text-white shadow-xl md:sticky md:top-0 md:flex md:h-screen md:w-[76px]"
      >
        <div className="flex flex-col items-center gap-3">
          {/* Top Highlighted Dashboard Monitor Button */}
          <button
            type="button"
            title="Resumen Ejecutivo"
            onClick={() => onNavigate("resumen")}
            className={navBtnClass(activeSection === "resumen")}
          >
            <Monitor className="h-5 w-5" />
          </button>

          <div className="my-0.5 h-px w-8 bg-white/15" />

          {/* Home / Escáner Anatómico */}
          <button
            type="button"
            title="Escáner Anatómico (6 Sistemas)"
            onClick={() => onNavigate("escaner")}
            className={navBtnClass(activeSection === "escaner")}
          >
            <Home className="h-5 w-5" />
          </button>

          {/* Arnés Vestible (13 Signos Bio-Monitor CSA) */}
          <button
            type="button"
            title="Arnés Vestible (13 Signos)"
            onClick={() => onNavigate("wearable")}
            className={navBtnClass(activeSection === "wearable")}
          >
            <Watch className="h-5 w-5" />
          </button>

          {/* Biomarcadores y Detector de Rutina */}
          <button
            type="button"
            title="Biomarcadores y Detector de Rutina"
            onClick={() => onNavigate("biomarcadores")}
            className={navBtnClass(activeSection === "biomarcadores")}
          >
            <Activity className="h-5 w-5" />
          </button>

          {/* Entrada Multimodal (Cámara / Registro Manual) */}
          <button
            type="button"
            title="Evaluación Multimodal (Cámara / Registro Manual)"
            onClick={onOpenScanModal}
            className={navBtnClass(false)}
          >
            <Camera className="h-5 w-5" />
          </button>

          {/* Informes Recharts y Hábitos Recomendados */}
          <button
            type="button"
            title="Informes y Hábitos Recomendados"
            onClick={() => onNavigate("informes")}
            className={navBtnClass(activeSection === "informes")}
          >
            <BarChart3 className="h-5 w-5" />
          </button>

          {/* Referencias NASA HRP / CSA */}
          <button
            type="button"
            title="Referencias Científicas NASA HRP / CSA"
            onClick={onOpenReferences}
            className={navBtnClass(false)}
          >
            <BookOpen className="h-5 w-5" />
          </button>
        </div>

        {/* Bottom Emergency Shield Trigger */}
        <button
          type="button"
          title={
            emergencyMode
              ? "Restaurar Estado Nominal"
              : "Simular Emergencia (Demo Mode)"
          }
          onClick={onToggleEmergency}
          className={`flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl transition ${
            emergencyMode
              ? "animate-pulse bg-red-600 text-white shadow-lg shadow-red-900/50"
              : "text-blue-100/70 hover:bg-red-500/20 hover:text-red-300"
          }`}
        >
          <ShieldAlert className="h-5 w-5" />
        </button>
      </aside>

      {/* Mobile Compact Navy Bar */}
      <nav
        aria-label="Navegación móvil"
        className="flex items-center justify-around bg-[#0b2559] px-2 py-2 text-white md:hidden"
      >
        <button
          type="button"
          onClick={() => onNavigate("resumen")}
          className={`rounded-lg p-2 ${
            activeSection === "resumen" ? "bg-[#1a73e8]" : "text-blue-100/80"
          }`}
          aria-label="Resumen"
        >
          <Monitor className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => onNavigate("escaner")}
          className={`rounded-lg p-2 ${
            activeSection === "escaner" ? "bg-[#1a73e8]" : "text-blue-100/80"
          }`}
          aria-label="Escáner"
        >
          <Home className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => onNavigate("wearable")}
          className={`rounded-lg p-2 ${
            activeSection === "wearable" ? "bg-[#1a73e8]" : "text-blue-100/80"
          }`}
          aria-label="Arnés Vestible (13 Signos)"
        >
          <Watch className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => onNavigate("biomarcadores")}
          className={`rounded-lg p-2 ${
            activeSection === "biomarcadores"
              ? "bg-[#1a73e8]"
              : "text-blue-100/80"
          }`}
          aria-label="Biomarcadores"
        >
          <Activity className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onOpenScanModal}
          className="rounded-lg p-2 text-blue-100/80"
          aria-label="Cámara y Registro Manual"
        >
          <Camera className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => onNavigate("informes")}
          className={`rounded-lg p-2 ${
            activeSection === "informes" ? "bg-[#1a73e8]" : "text-blue-100/80"
          }`}
          aria-label="Informes"
        >
          <BarChart3 className="h-4 w-4" />
        </button>
      </nav>
    </>
  );
}
