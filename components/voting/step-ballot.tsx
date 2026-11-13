"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  User,
  Archive,
  Check,
  Eye,
  ArrowRight,
  SignOut,
  Info,
  ShieldCheck,
} from "@phosphor-icons/react";
import type { VotingKandidat, VotingDPT } from "@/lib/types/voting";
import CandidateDetailModal from "./candidate-detail-modal";

interface StepBallotProps {
  kandidatList: VotingKandidat[];
  voter: VotingDPT;
  selectedKandidatId: string | null;
  onSelect: (id: string) => void;
  onProceed: () => void;
  onLogout: () => void;
}

export default function StepBallot({
  kandidatList,
  voter,
  selectedKandidatId,
  onSelect,
  onProceed,
  onLogout,
}: StepBallotProps) {
  const [modalCandidate, setModalCandidate] = useState<VotingKandidat | null>(null);

  // Sort candidates by nomor_urut ascending
  const sortedCandidates = [...kandidatList].sort(
    (a, b) => a.nomor_urut - b.nomor_urut
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-200 font-poppins">
      {/* Top Voter Identity Strip */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3.5 text-left w-full sm:w-auto">
          <div className="w-11 h-11 rounded-xl bg-sky-50 text-[#0094e0] border border-sky-100 flex items-center justify-center shrink-0">
            <User className="w-6 h-6" weight="bold" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#00296E] bg-sky-50 px-2.5 py-0.5 rounded-md border border-sky-100 font-poppins">
                Pemilih Terverifikasi
              </span>
              <span className="text-xs sm:text-sm text-slate-500 font-semibold font-poppins">{voter.nim}</span>
            </div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 font-poppins truncate max-w-xs sm:max-w-md">
              {voter.nama_lengkap}
            </h3>
          </div>
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 transition-colors w-full sm:w-auto justify-center cursor-pointer shrink-0 font-poppins"
        >
          <SignOut className="w-4 h-4" />
          <span>Keluar Sesi</span>
        </button>
      </div>

      {/* Section Title */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sky-50 text-[#00296E] border border-sky-100 text-xs sm:text-sm font-bold tracking-wider uppercase font-poppins">
          <ShieldCheck className="w-4 h-4" weight="bold" />
          SURAT SUARA ELEKTRONIK
        </div>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-[#00296E] font-poppins tracking-tight">
          Tentukan Pilihan Anda
        </h2>
        <p className="text-sm sm:text-base text-slate-600 font-poppins leading-relaxed">
          Pilih salah satu surat suara di bawah ini. Anda dapat membaca rincian visi, misi, dan program kerja sebelum melanjutkan ke tahap konfirmasi.
        </p>
      </div>

      {/* Candidate Ballot Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto items-stretch">
        {sortedCandidates.map((cand) => {
          const isSelected = selectedKandidatId === cand.id;
          const isKotakKosong =
            !cand.foto_url && cand.nama_calon.toLowerCase().includes("kotak kosong");

          return (
            <div
              key={cand.id}
              onClick={() => onSelect(cand.id)}
              className={`rounded-3xl p-6 sm:p-7 transition-all duration-200 cursor-pointer flex flex-col justify-between relative group ${
                isSelected
                  ? "bg-sky-50/70 border-2 border-[#0094e0] shadow-[0_6px_25px_rgba(0,148,224,0.18)] ring-2 ring-[#0094e0]/20 scale-[1.01]"
                  : "bg-white border border-slate-200 hover:border-sky-300 hover:shadow-lg shadow-sm"
              }`}
            >
              {/* Card Header: Nomor Urut & Radio Indicator */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <span
                    className={`font-poppins text-xs sm:text-sm font-bold px-3.5 py-1.5 rounded-xl tracking-wider transition-colors ${
                      isSelected
                        ? "bg-[#00296E] text-white"
                        : "bg-slate-100 text-slate-700 border border-slate-200"
                    }`}
                  >
                    NO. URUT {cand.nomor_urut.toString().padStart(2, "0")}
                  </span>
                  {isKotakKosong && (
                    <span className="text-xs font-poppins text-slate-500 uppercase tracking-wider font-semibold">
                      (Alternatif)
                    </span>
                  )}
                </div>

                {/* Radio selection circle */}
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                    isSelected
                      ? "bg-[#0094e0] text-white shadow-[0_0_12px_rgba(0,148,224,0.4)]"
                      : "border-2 border-slate-300 bg-white group-hover:border-slate-400"
                  }`}
                >
                  {isSelected && <Check className="w-4 h-4" weight="bold" />}
                </div>
              </div>

              {/* Photo / Silhouette */}
              <div className="space-y-4 flex-1">
                <div className="relative w-full aspect-4/3 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center">
                  {cand.foto_url ? (
                    <Image
                      src={cand.foto_url}
                      alt={cand.nama_calon}
                      fill
                      unoptimized
                      sizes="(max-width: 768px) 100vw, 400px"
                      className="object-cover object-top transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 text-slate-500 p-6 text-center space-y-2">
                      <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 group-hover:text-slate-600 transition-colors shadow-xs">
                        <Archive className="w-8 h-8" />
                      </div>
                      <span className="text-sm font-poppins uppercase font-bold tracking-wider text-slate-800">
                        Kotak Kosong
                      </span>
                      <p className="text-xs text-slate-500 max-w-xs leading-relaxed font-poppins">
                        Pilihan sah bila Anda menghendaki peninjauan ulang kandidat tunggal
                      </p>
                    </div>
                  )}
                </div>

                {/* Candidate Info */}
                <div className="space-y-2 pt-1">
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-900 font-poppins leading-tight">
                    {cand.nama_calon}
                  </h3>
                  {cand.visi && (
                    <p className="text-xs sm:text-sm text-slate-600 line-clamp-3 leading-relaxed font-poppins italic">
                      &quot;{cand.visi}&quot;
                    </p>
                  )}
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="pt-5 mt-5 border-t border-slate-100 flex items-center justify-between gap-3 font-poppins">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setModalCandidate(cand);
                  }}
                  className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-[#0094e0] hover:text-[#007bbd] font-bold transition cursor-pointer font-poppins"
                >
                  <Eye className="w-4 h-4" />
                  <span>Lihat Visi &amp; Misi</span>
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect(cand.id);
                  }}
                  className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 cursor-pointer font-poppins ${
                    isSelected
                      ? "bg-[#00296E] text-white shadow-sm"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200"
                  }`}
                >
                  {isSelected ? (
                    <>
                      <Check className="w-4 h-4" weight="bold" />
                      <span>Dipilih</span>
                    </>
                  ) : (
                    <span>Pilih Paslon</span>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Sticky/Floating Confirmation CTA */}
      <div className="max-w-4xl mx-auto pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-slate-200 shadow-md font-poppins">
        <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-600 text-center sm:text-left font-poppins font-medium">
          <Info className="w-5 h-5 text-[#0094e0] shrink-0" />
          <span>
            {selectedKandidatId
              ? "Pilihan telah ditentukan. Klik tombol di samping untuk meninjau surat suara."
              : "Silakan tentukan pilihan salah satu calon di atas sebelum melanjutkan."}
          </span>
        </div>

        <button
          type="button"
          onClick={onProceed}
          disabled={!selectedKandidatId}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl bg-gradient-to-r from-[#00296E] to-[#0094e0] hover:from-[#001f54] hover:to-[#0080c4] text-white font-bold text-sm sm:text-base shadow-md transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none cursor-pointer shrink-0 font-poppins"
        >
          <span>Lanjutkan ke Konfirmasi</span>
          <ArrowRight className="w-4 h-4" weight="bold" />
        </button>
      </div>

      {/* Candidate Detail Modal */}
      <CandidateDetailModal
        candidate={modalCandidate}
        onClose={() => setModalCandidate(null)}
      />
    </div>
  );
}

