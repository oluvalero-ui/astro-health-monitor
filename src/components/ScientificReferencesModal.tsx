"use client";

import React from "react";
import { BookOpen, X } from "lucide-react";
import ScientificReferencesContent from "@/components/ScientificReferencesContent";

interface ScientificReferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ScientificReferencesModal({
  isOpen,
  onClose,
}: ScientificReferencesModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-3 backdrop-blur-sm sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-label="Estándares NASA-STD-3001 · Human Research Program & Dosimetría CSA"
    >
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-[#1b2d4b] bg-[#0c1426] text-slate-100 shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#182742] bg-[#091120] px-5 py-4">
          <div className="flex items-center gap-2.5">
            <BookOpen className="h-5 w-5 text-sky-400" />
            <div>
              <h2 className="text-base font-bold text-slate-100 sm:text-lg">
                Estándares NASA-STD-3001 · Human Research Program & Dosimetría CSA
              </h2>
              <p className="text-xs text-slate-400">
                Base biomédica del desafío: 5 Peligros del Espacio Humano y
                Dosimetría de Radiación Canadiense.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-xl border border-[#1b2d4b] bg-[#0c1426] p-1.5 text-slate-400 transition hover:border-sky-400 hover:text-slate-100"
            aria-label="Cerrar referencias"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <ScientificReferencesContent />
        </div>
      </div>
    </div>
  );
}
