"use client";

import React, { useState, useEffect } from "react";
import { Lock, Check, ChartLineUp, Clock } from "@phosphor-icons/react";
import type { VotingSesi } from "@/lib/types/voting";

interface VotingHeroCountdownProps {
  sesi: VotingSesi;
}

function calculateTimeLeft(closedAt?: string | null) {
  if (!closedAt) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isExpired: false,
      hasTarget: false,
    };
  }

  const diff = new Date(closedAt).getTime() - Date.now();
  if (diff <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isExpired: true,
      hasTarget: true,
    };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / 1000 / 60) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  return {
    days,
    hours,
    minutes,
    seconds,
    isExpired: false,
    hasTarget: true,
  };
}

export default function VotingHeroCountdown({ sesi }: VotingHeroCountdownProps) {
  const [timeLeft, setTimeLeft] = useState(() => calculateTimeLeft(sesi.closed_at));

  useEffect(() => {
    if (!sesi.closed_at) return;

    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft(sesi.closed_at));
    }, 1000);

    return () => clearInterval(interval);
  }, [sesi.closed_at]);

  const padZero = (n: number) => n.toString().padStart(2, "0");

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Overline & Display Title */}
      <div className="space-y-4">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#00296E] tracking-tight leading-tight sm:leading-none font-poppins">
          Satu suara,
          <br />
          satu arah untuk <span className="text-[#0094e0]">HIMASI.</span>
        </h1>

        <p className="text-sm sm:text-base lg:text-lg text-slate-600 max-w-xl leading-relaxed font-poppins font-normal">
          Gunakan hak pilihmu sebagai anggota Himpunan Mahasiswa Sistem Informasi.
          Prosesnya kurang dari dua menit dan pilihanmu bersifat rahasia.
        </p>
      </div>

      {/* Countdown Timer Grid */}
      <div className="space-y-2">
        {timeLeft.hasTarget && !timeLeft.isExpired ? (
          <div className="grid grid-cols-4 gap-2.5 sm:gap-4 max-w-md">
            {[
              { val: padZero(timeLeft.days), label: "Hari" },
              { val: padZero(timeLeft.hours), label: "Jam" },
              { val: padZero(timeLeft.minutes), label: "Menit" },
              { val: padZero(timeLeft.seconds), label: "Detik" },
            ].map((box) => (
              <div
                key={box.label}
                className="bg-white border border-slate-200 rounded-2xl p-3.5 sm:p-5 text-center shadow-xs flex flex-col justify-center items-center group hover:border-[#0094e0] transition-all"
              >
                <span className="font-poppins text-3xl sm:text-4xl font-black text-[#00296E] tracking-tight tabular-nums">
                  {box.val}
                </span>
                <span className="text-xs sm:text-sm text-slate-500 font-poppins uppercase font-bold tracking-wider mt-1">
                  {box.label}
                </span>
              </div>
            ))}
          </div>
        ) : (
          /* Fallback when closed_at is not explicitly set */
          <div className="inline-flex items-center gap-3 px-5 py-4 rounded-2xl bg-white border border-emerald-200 shadow-sm text-slate-900 font-poppins">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
              <Clock className="w-5 h-5 animate-spin" />
            </div>
            <div>
              <p className="text-sm font-bold tracking-wider text-emerald-700 uppercase font-poppins">
                Bilik Suara Sedang Berlangsung
              </p>
              <p className="text-xs sm:text-sm text-slate-600 font-poppins">
                Periode {sesi.tahun_periode} • Salurkan hak suaramu sekarang
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 3 Pillar Security Trust Badges */}
      <div className="space-y-3.5 max-w-md pt-2">
        <div className="flex items-center gap-3.5 text-slate-700 text-sm sm:text-base font-medium font-poppins">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-[#00296E] shrink-0 shadow-2xs">
            <Lock className="w-5 h-5" weight="bold" />
          </div>
          <span className="leading-snug">Pilihanmu tidak terhubung dengan identitasmu.</span>
        </div>

        <div className="flex items-center gap-3.5 text-slate-700 text-sm sm:text-base font-medium font-poppins">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0 shadow-2xs">
            <Check className="w-5 h-5" weight="bold" />
          </div>
          <span className="leading-snug">Satu anggota terverifikasi, satu suara.</span>
        </div>

        <div className="flex items-center gap-3.5 text-slate-700 text-sm sm:text-base font-medium font-poppins">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#0094e0] shrink-0 shadow-2xs">
            <ChartLineUp className="w-5 h-5" weight="bold" />
          </div>
          <span className="leading-snug">Hasil diumumkan setelah voting ditutup.</span>
        </div>
      </div>
    </div>
  );
}
