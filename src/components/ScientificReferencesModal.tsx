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
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3 backdrop-blur-sm sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-label="Referencias Científicas NASA HRP y CSA"
    >
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <BookOpen className="h-5 w-5 text-[#1a73e8]" />
            <div>
              <h2 className="text-base font-bold text-slate-900 sm:text-lg">
                Referencias Científicas Oficiales · NASA HRP & CSA
              </h2>
              <p className="text-xs text-slate-500">
                Base biomédica del desafío: 5 Peligros del Espacio Humano y
                Dosimetría de Radiación Canadiense.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-xl border border-slate-200 bg-white p-1.5 text-slate-500 hover:text-slate-900"
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
