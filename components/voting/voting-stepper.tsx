"use client";

import React from "react";
import { Check } from "@phosphor-icons/react";

export type StepNumber = 1 | 2 | 3 | 4;

interface VotingStepperProps {
  currentStep: StepNumber;
}

const STEPS = [
  { step: 1, label: "01. Verifikasi", shortLabel: "Verifikasi" },
  { step: 2, label: "02. Pilih Kandidat", shortLabel: "Pilih" },
  { step: 3, label: "03. Konfirmasi", shortLabel: "Konfirmasi" },
  { step: 4, label: "04. Selesai", shortLabel: "Selesai" },
] as const;

export default function VotingStepper({ currentStep }: VotingStepperProps) {
  return (
    <div className="w-full bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-4 items-center">
          {STEPS.map((s) => {
            const isActive = currentStep === s.step;
            const isCompleted = currentStep > s.step;

            return (
              <div
                key={s.step}
                className={`py-4 sm:py-5 px-1.5 sm:px-4 text-center sm:text-left transition-all relative ${
                  isActive
                    ? "text-[#00296E] font-bold"
                    : isCompleted
                    ? "text-slate-700 font-semibold"
                    : "text-slate-400 font-medium"
                }`}
              >
                {/* Active highlight line at bottom */}
                {isActive && (
                  <div className="absolute bottom-0 inset-x-0 h-1 bg-[#0094e0] rounded-full" />
                )}

                <div className="flex items-center justify-center sm:justify-start gap-2 sm:gap-2.5">
                  {isCompleted ? (
                    <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-300 flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5" weight="bold" />
                    </span>
                  ) : (
                    <span
                      className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full shrink-0 hidden sm:inline-block ${
                        isActive ? "bg-[#0094e0]" : "bg-slate-300"
                      }`}
                    />
                  )}

                  <span className="text-sm sm:text-base md:text-lg tracking-normal font-poppins truncate">
                    <span className="hidden md:inline">{s.label}</span>
                    <span className="md:hidden">{s.shortLabel}</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

