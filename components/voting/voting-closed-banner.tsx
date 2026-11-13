"use client";

import React from "react";
import Link from "next/link";
import { WarningCircle, Clock, ArrowLeft, SealCheck } from "@phosphor-icons/react";
import type { VotingSesi } from "@/lib/types/voting";

interface VotingClosedBannerProps {
  sesi: VotingSesi | null;
}

export default function VotingClosedBanner({ sesi }: VotingClosedBannerProps) {
  const isDraft = sesi?.status === "draft";
  const isClosed = sesi?.status === "closed";
  const isArchived = sesi?.status === "archived";

  return (
    <div className="max-w-xl mx-auto my-12 p-8 sm:p-12 rounded-3xl bg-white border border-slate-200 shadow-xl text-center space-y-6 font-poppins">
      <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto shadow-xs">
        {isClosed ? (
          <Clock className="w-8 h-8" weight="bold" />
        ) : isArchived ? (
          <SealCheck className="w-8 h-8" weight="bold" />
        ) : (
          <WarningCircle className="w-8 h-8" weight="bold" />
        )}
      </div>

      <div className="space-y-2">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#00296E] font-poppins tracking-tight">
          {isDraft
            ? "Bilik Suara Belum Dibuka"
            : isClosed
            ? "Bilik Suara Resmi Ditutup"
            : isArchived
            ? "Sesi Pemilihan Telah Diarsipkan"
            : "Tidak Ada Sesi Pemilihan Aktif"}
        </h2>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-md mx-auto font-poppins">
          {isDraft
            ? "Sesi pemilihan sedang dalam persiapan panitia KPU HIMASI. Silakan tunggu jadwal resmi pembukaan bilik suara."
            : isClosed
            ? "Waktu pemungutan suara telah berakhir. Hasil rekapitulasi akan segera diumumkan setelah kotak suara resmi dibuka oleh panitia."
            : isArchived
            ? "Pemilihan untuk periode ini telah selesai diselenggarakan dan data telah diarsipkan secara resmi."
            : "Saat ini belum ada agenda pemilihan umum ketua himpunan yang sedang berjalan."}
        </p>
      </div>

      {sesi && (
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 inline-block text-left max-w-sm w-full font-poppins text-xs sm:text-sm text-slate-700 space-y-1">
          <p className="text-slate-500 text-xs uppercase font-bold tracking-wider font-poppins">
            Sesi Agenda:
          </p>
          <p className="text-slate-900 font-bold truncate font-poppins">{sesi.judul}</p>
          <p className="text-[#0094e0] font-semibold text-xs sm:text-sm font-poppins">Periode: {sesi.tahun_periode}</p>
        </div>
      )}

      <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#00296E] hover:bg-[#002055] text-white text-sm sm:text-base font-bold shadow-md transition-all w-full sm:w-auto justify-center font-poppins"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Beranda</span>
        </Link>
      </div>
    </div>
  );
}

