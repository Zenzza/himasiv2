"use client";

import React, { useState } from "react";
import {
  IdentificationCard,
  CalendarBlank,
  ArrowRight,
  Spinner,
  WarningCircle,
  Question,
  X,
  ShieldCheck,
} from "@phosphor-icons/react";
import type { VotingDPT } from "@/lib/types/voting";
import { verifyDPTVoter } from "@/lib/supabase/voting";
import { formatDateInput } from "@/lib/utils/voting-helpers";

interface StepVerificationProps {
  sesiId: string;
  onVerified: (voter: VotingDPT) => void;
}

export default function StepVerification({ sesiId, onVerified }: StepVerificationProps) {
  const [nim, setNim] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showGuideModal, setShowGuideModal] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanNIM = nim.trim();
    const cleanDate = birthDate.trim();

    if (!cleanNIM) {
      setErrorMessage("NIM wajib diisi.");
      return;
    }

    if (!cleanDate) {
      setErrorMessage("Tanggal lahir wajib diisi sebagai verifikasi 2FA.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await verifyDPTVoter(sesiId, cleanNIM, cleanDate);
      if (res.success && res.voter) {
        onVerified(res.voter);
      } else {
        setErrorMessage(res.error || "Verifikasi gagal. Silakan periksa kembali data Anda.");
      }
    } catch (err: unknown) {
      console.error("[StepVerification] Error:", err);
      setErrorMessage("Terjadi gangguan jaringan saat menghubungi server verifikasi.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="w-full bg-white border border-slate-200 rounded-3xl p-6 sm:p-9 shadow-xl relative overflow-hidden text-slate-900 font-poppins">
        <div className="space-y-6 relative z-10">
          {/* Card Header */}
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-[#00296E] tracking-tight font-poppins">
              Masuk untuk memilih
            </h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-poppins">
              Verifikasi identitas hak suara Anda terdaftar di DPT menggunakan NIM &amp; Tanggal Lahir.
            </p>
          </div>

          {/* Error Alert Box */}
          {errorMessage && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3 animate-in fade-in zoom-in-95 duration-150 font-poppins">
              <WarningCircle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-bold uppercase tracking-wider text-xs text-rose-700 font-poppins">
                  Verifikasi Ditolak
                </p>
                <p className="text-xs sm:text-sm leading-relaxed">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Form Fields */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* NIM Field */}
            <div className="space-y-2">
              <label
                htmlFor="voter-nim"
                className="block text-xs sm:text-sm font-bold uppercase tracking-wider text-[#00296E] font-poppins"
              >
                NIM (Nomor Induk Mahasiswa)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <IdentificationCard className="w-5 h-5" />
                </div>
                <input
                  id="voter-nim"
                  type="text"
                  inputMode="numeric"
                  value={nim}
                  onChange={(e) => {
                    setNim(e.target.value.replace(/[^0-9]/g, "").slice(0, 15));
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="Contoh: 2311500000"
                  disabled={isLoading}
                  autoComplete="off"
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-slate-50/80 border border-slate-200 text-slate-900 placeholder-slate-400 text-sm sm:text-base font-poppins focus:bg-white focus:outline-hidden focus:border-[#0094e0] focus:ring-1 focus:ring-[#0094e0] transition-all disabled:opacity-50"
                />
              </div>
            </div>

            {/* Tanggal Lahir (2FA) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="voter-dob"
                  className="block text-xs sm:text-sm font-bold uppercase tracking-wider text-[#00296E] font-poppins"
                >
                  Tanggal Lahir (Kunci 2FA)
                </label>
                <span className="text-xs text-[#0094e0] font-semibold font-poppins">Format DD/MM/YYYY</span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <CalendarBlank className="w-5 h-5" />
                </div>
                <input
                  id="voter-dob"
                  type="text"
                  inputMode="numeric"
                  maxLength={10}
                  value={birthDate}
                  onChange={(e) => {
                    const formatted = formatDateInput(e.target.value, birthDate);
                    setBirthDate(formatted);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="DD/MM/YYYY (Contoh: 17/08/2004)"
                  disabled={isLoading}
                  autoComplete="off"
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-slate-50/80 border border-slate-200 text-slate-900 placeholder-slate-400 text-sm sm:text-base font-poppins focus:bg-white focus:outline-hidden focus:border-[#0094e0] focus:ring-1 focus:ring-[#0094e0] transition-all disabled:opacity-50"
                />
              </div>
              <p className="text-xs sm:text-sm text-slate-500 leading-snug font-poppins">
                Tanggal lahir digunakan sebagai kata sandi verifikasi pemilih untuk mencegah suara disalahgunakan.
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !nim.trim() || !birthDate.trim()}
              className="w-full mt-2 py-4 px-6 rounded-xl bg-gradient-to-r from-[#00296E] to-[#0047b3] hover:from-[#001f54] hover:to-[#00388f] text-white font-bold text-sm sm:text-base shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none font-poppins"
            >
              {isLoading ? (
                <>
                  <Spinner className="w-5 h-5 animate-spin" />
                  <span>Memverifikasi DPT...</span>
                </>
              ) : (
                <>
                  <span>Verifikasi &amp; Masuk Bilik Suara</span>
                  <ArrowRight className="w-5 h-5" weight="bold" />
                </>
              )}
            </button>
          </form>

          {/* Footer Helper Links */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs sm:text-sm text-slate-500 font-poppins">
            <button
              type="button"
              onClick={() => setShowGuideModal(true)}
              className="hover:text-[#00296E] transition-colors inline-flex items-center gap-1.5 cursor-pointer font-medium"
            >
            </button>

            <button
              type="button"
              onClick={() => setShowGuideModal(true)}
              className="hover:text-[#00296E] transition-colors cursor-pointer text-slate-500 hover:underline font-medium"
            >
              Panduan Memilih
            </button>
          </div>
        </div>
      </div>

      {/* Modal Panduan & Bantuan DPT */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150 font-poppins">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 sm:p-8 text-slate-900 space-y-5 shadow-2xl relative font-poppins">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-sky-50 text-[#00296E]">
                  <ShieldCheck className="w-6 h-6" weight="bold" />
                </div>
                <h3 className="font-bold text-base sm:text-lg font-poppins text-slate-900">
                  Panduan Autentikasi Pemilih
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs sm:text-sm text-slate-600 leading-relaxed font-poppins">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                <span className="font-bold text-[#00296E] font-poppins text-xs sm:text-sm block">
                  1. Siapa yang berhak memilih?
                </span>
                <p>
                  Seluruh mahasiswa aktif Program Studi Sistem Informasi ISB Atma Luhur yang telah tercatat dalam Daftar Pemilih Tetap (DPT) resmi KPU HIMASI.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                <span className="font-bold text-[#00296E] font-poppins text-xs sm:text-sm block">
                  2. Kunci Verifikasi 2FA
                </span>
                <p>
                  Masukkan <strong>NIM</strong> Anda (misal: 2311500000) dan <strong>Tanggal Lahir</strong> (format DD/MM/YYYY) sesuai data registrasi akademik kampus.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                <span className="font-bold text-[#00296E] font-poppins text-xs sm:text-sm block">
                  3. Kendala Verifikasi?
                </span>
                <p>
                  Bila NIM Anda belum terdaftar atau terdapat ketidaksesuaian tanggal lahir, silakan hubungi Panitia KPU HIMASI melalui Sekretariat atau email ke{" "}
                  <code className="text-[#00296E] font-bold">himasi@atmaluhur.ac.id</code> dengan melampirkan foto Kartu Tanda Mahasiswa (KTM).
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowGuideModal(false)}
              className="w-full py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm sm:text-base transition cursor-pointer font-poppins"
            >
              Mengerti &amp; Tutup
            </button>
          </div>
        </div>
      )}
    </>
  );
}

