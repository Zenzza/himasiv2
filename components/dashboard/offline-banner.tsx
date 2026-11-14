"use client";

import React, { useState, useEffect } from "react";
import { WifiSlash, Warning } from "@phosphor-icons/react";

export default function OfflineBanner() {
  const [isOnline, setIsOnline] = useState<boolean>(true);

  useEffect(() => {
    if (typeof window === "undefined") return;

    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div
      role="alert"
      className="no-print w-full bg-rose-600 text-white px-4 py-2 border-b border-rose-700 flex items-center justify-between gap-3 text-xs font-mono select-none animate-in slide-in-from-top-2 duration-200 z-50 sticky top-0"
    >
      <div className="flex items-center gap-2.5">
        <WifiSlash className="w-4 h-4 text-rose-200 shrink-0 animate-pulse" />
        <span className="font-bold tracking-wide uppercase">
          PERINGATAN JARINGAN OFFLINE:
        </span>
        <span className="hidden sm:inline text-rose-100 font-sans">
          Koneksi internet terputus. Pastikan perangkat Anda terhubung kembali sebelum melakukan penyimpanan atau sinkronisasi data.
        </span>
      </div>

      <div className="flex items-center gap-2 shrink-0 text-[10px] uppercase font-bold tracking-wider bg-rose-800/80 px-2 py-0.5 border border-rose-400/30">
        <span className="w-2 h-2 rounded-full bg-amber-300 animate-ping" />
        <span>Menunggu Sinyal...</span>
      </div>
    </div>
  );
}
