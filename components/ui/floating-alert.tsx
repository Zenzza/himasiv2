"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  Info,
  CheckCircle,
  Warning,
  XCircle,
  X,
} from "@phosphor-icons/react";

export type FloatingAlertType = "info" | "success" | "warning" | "error";

export interface FloatingAlertProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message: string;
  type?: FloatingAlertType;
  duration?: number; // ms, default 5000
  position?: "top-right" | "top-center" | "bottom-right";
}

const TYPE_CONFIG = {
  info: {
    defaultTitle: "Information",
    icon: Info,
    iconColor: "text-sky-500",
    glowColor: "bg-sky-200/50",
    progressColor: "bg-sky-500",
  },
  success: {
    defaultTitle: "Success",
    icon: CheckCircle,
    iconColor: "text-emerald-500",
    glowColor: "bg-emerald-200/50",
    progressColor: "bg-emerald-500",
  },
  warning: {
    defaultTitle: "Warning",
    icon: Warning,
    iconColor: "text-amber-500",
    glowColor: "bg-amber-200/50",
    progressColor: "bg-amber-500",
  },
  error: {
    defaultTitle: "Error",
    icon: XCircle,
    iconColor: "text-rose-500",
    glowColor: "bg-rose-200/50",
    progressColor: "bg-rose-500",
  },
} as const;

export default function FloatingAlert({
  isOpen,
  onClose,
  title,
  message,
  type = "info",
  duration = 5000,
  position = "top-right",
}: FloatingAlertProps) {
  const [progress, setProgress] = useState(100);
  const [isHovered, setIsHovered] = useState(false);
  const startTimeRef = useRef<number>(0);
  const remainingTimeRef = useRef<number>(duration);

  const cfg = TYPE_CONFIG[type] || TYPE_CONFIG.info;
  const IconComp = cfg.icon;
  const displayTitle = title || cfg.defaultTitle;

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;

    startTimeRef.current = Date.now();
    remainingTimeRef.current = duration;

    const interval = setInterval(() => {
      if (!isHovered) {
        const elapsed = Date.now() - startTimeRef.current;
        const remaining = Math.max(0, remainingTimeRef.current - elapsed);
        setProgress((remaining / duration) * 100);

        if (remaining <= 0) {
          clearInterval(interval);
          handleClose();
        }
      } else {
        startTimeRef.current = Date.now();
      }
    }, 50);

    return () => clearInterval(interval);
  }, [isOpen, duration, isHovered, handleClose]);

  if (!isOpen) return null;

  const positionClasses = {
    "top-right": "top-20 sm:top-24 right-4 sm:right-6",
    "top-center": "top-20 sm:top-24 left-1/2 -translate-x-1/2",
    "bottom-right": "bottom-6 right-4 sm:right-6",
  }[position];

  return (
    <div
      role="alert"
      aria-live="polite"
      onMouseEnter={() => {
        setIsHovered(true);
        remainingTimeRef.current = (progress / 100) * duration;
      }}
      onMouseLeave={() => {
        setIsHovered(false);
        startTimeRef.current = Date.now();
      }}
      className={`fixed ${positionClasses} z-50 max-w-[calc(100vw-2rem)] sm:max-w-md w-full animate-in fade-in slide-in-from-top-4 sm:slide-in-from-right-6 duration-300 ease-out select-none`}
    >
      <div className="relative overflow-hidden rounded-2xl bg-white/95 backdrop-blur-md border border-slate-100/90 shadow-[0_12px_36px_-6px_rgba(0,0,0,0.08),0_4px_16px_-2px_rgba(0,0,0,0.04)] p-4 sm:p-5 flex items-start gap-3.5 sm:gap-4 font-poppins text-slate-900 group">
        {/* Soft pastel ambient glow in the top-left corner */}
        <div
          className={`absolute -top-10 -left-10 w-32 h-32 rounded-full ${cfg.glowColor} blur-2xl pointer-events-none transition-opacity duration-300`}
        />

        {/* Icon tile (squircle box matching design) */}
        <div className="relative z-10 w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-white border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.04)] flex items-center justify-center shrink-0">
          <IconComp className={`w-5 h-5 sm:w-6 sm:h-6 ${cfg.iconColor}`} weight="regular" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex-1 min-w-0 pr-1 space-y-0.5">
          <h4 className="text-sm sm:text-base font-bold text-slate-900 font-poppins tracking-tight">
            {displayTitle}
          </h4>
          <p className="text-xs sm:text-sm text-slate-500 font-poppins leading-relaxed font-normal">
            {message}
          </p>
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={handleClose}
          aria-label="Tutup notifikasi"
          className="relative z-10 text-slate-400 hover:text-slate-600 hover:bg-slate-100/80 p-1.5 rounded-xl transition cursor-pointer shrink-0 mt-0.5"
        >
          <X className="w-4 h-4" weight="bold" />
        </button>

        {/* Subtle timer progress bar at bottom edge */}
        <div className="absolute bottom-0 inset-x-0 h-0.5 bg-slate-100/60 overflow-hidden">
          <div
            className={`h-full ${cfg.progressColor} transition-all ease-linear`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
