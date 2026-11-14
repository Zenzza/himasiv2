"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  ArrowLeft,
  PaperPlaneRight,
  WarningCircle,
  Spinner,
  ShieldCheck,
  Archive,
  LockKey,
} from "@phosphor-icons/react";
import type { VotingKandidat, VotingDPT } from "@/lib/types/voting";
import { castStudentVote } from "@/lib/supabase/voting";

interface StepConfirmationProps {
  selectedKandidat: VotingKandidat;
  voter: VotingDPT;
  sesiId: string;
  onBack: () => void;
  onSuccess: (receiptId: string) => void;
}

export default function StepConfirmation({
  selectedKandidat,
  voter,
  sesiId,
  onBack,
  onSuccess,
}: StepConfirmationProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isKotakKosong =
    !selectedKandidat.foto_url &&
    selectedKandidat.nama_calon.toLowerCase().includes("kotak kosong");

  const handleConfirmVote = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await castStudentVote(
        sesiId,
        voter.id,
        selectedKandidat.id,
        voter.nim,
        voter.tanggal_lahir
      );
      if (res.success && res.receiptId) {
        onSuccess(res.receiptId);
      } else {
        setErrorMessage(
          res.error || "Gagal mengirim surat suara. Silakan coba kembali."
        );
      }
    } catch (err: unknown) {
      console.error("[StepConfirmation] Vote submission error:", err);
      setErrorMessage("Terjadi kesalahan jaringan saat memasukkan surat suara.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 sm:space-y-8 animate-in fade-in duration-200 font-poppins">
      {/* Title */}
      <div className="text-center space-y-2.5">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs sm:text-sm font-semibold tracking-wider uppercase font-poppins">
          <ShieldCheck className="w-4 h-4 text-amber-700" weight="bold" />
          Konfirmasi Akhir Surat Suara
        </div>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#00296E] font-poppins tracking-tight">
          Tinjau Pilihan Suara Anda
        </h2>
        <p className="text-sm sm:text-base text-slate-600 font-poppins leading-relaxed max-w-lg mx-auto">
          Pastikan calon yang Anda pilih sudah sesuai sebelum mengirimkan surat suara ke kotak suara digital.
        </p>
      </div>

      {/* Selected Ballot Card Summary */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border-2 border-[#0094e0] shadow-[0_8px_30px_rgba(0,148,224,0.15)] ring-2 ring-[#0094e0]/20 space-y-6 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center gap-6 relative z-10">
          <div className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0 shadow-sm flex items-center justify-center">
            {selectedKandidat.foto_url ? (
              <Image
                src={selectedKandidat.foto_url}
                alt={selectedKandidat.nama_calon}
                fill
                unoptimized
                sizes="144px"
                className="object-cover object-top"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 text-slate-500 p-2 text-center">
                <Archive className="w-10 h-10 text-slate-400 mb-1" />
                <span className="text-xs font-bold uppercase text-slate-700 font-poppins">
                  Kotak Kosong
                </span>
              </div>
            )}
          </div>

          <div className="space-y-2 text-center sm:text-left flex-1">
            <span className="inline-block px-3.5 py-1 rounded-lg bg-[#00296E] text-white font-poppins text-xs sm:text-sm font-bold tracking-wider shadow-xs">
              NO. URUT {selectedKandidat.nomor_urut.toString().padStart(2, "0")}
            </span>

            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-950 font-poppins leading-tight">
              {selectedKandidat.nama_calon}
            </h3>

            <p className="text-sm sm:text-base text-slate-600 font-poppins">
              {isKotakKosong
                ? "Pilihan alternatif sah bagi anggota yang menghendaki evaluasi calon tunggal."
                : "Calon Ketua Himpunan Mahasiswa Sistem Informasi ISB Atma Luhur"}
            </p>
          </div>
        </div>

        {/* Voter Secrecy Guarantee Card */}
        <div className="p-4 sm:p-5 rounded-2xl bg-sky-50 border border-sky-100 space-y-2 text-xs sm:text-sm text-slate-700 leading-relaxed font-poppins">
          <div className="flex items-center gap-2 text-[#00296E] font-bold text-xs sm:text-sm uppercase tracking-wider font-poppins">
            <LockKey className="w-4 h-4 shrink-0" weight="bold" />
            <span>Jaminan Kerahasiaan (Asas Luber Jurdil)</span>
          </div>
          <p>
            Pilihan surat suara ini akan dimasukkan ke kotak suara secara <strong>anonim</strong> tanpa mencatat NIM Anda. Setelah dikirim, hak suara Anda dikunci dan Anda tidak dapat memilih ulang.
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-poppins flex items-center gap-3">
            <WarningCircle className="w-5 h-5 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10">
          <button
            type="button"
            onClick={onBack}
            disabled={isSubmitting}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm sm:text-base border border-slate-200 transition cursor-pointer disabled:opacity-50 font-poppins"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Ubah Pilihan</span>
          </button>

          <button
            type="button"
            onClick={handleConfirmVote}
            disabled={isSubmitting}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm sm:text-base shadow-md transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed font-poppins"
          >
            {isSubmitting ? (
              <>
                <Spinner className="w-5 h-5 animate-spin text-white" />
                <span>Memasukkan Surat Suara...</span>
              </>
            ) : (
              <>
                <PaperPlaneRight className="w-5 h-5" weight="fill" />
                <span>Kirim Suara Sekarang (Kunci)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

