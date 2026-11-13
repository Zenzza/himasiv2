"use client";

import React from "react";
import Image from "next/image";
import { X, Archive, Sparkle, Target, ListBullets } from "@phosphor-icons/react";
import type { VotingKandidat } from "@/lib/types/voting";

interface CandidateDetailModalProps {
  candidate: VotingKandidat | null;
  onClose: () => void;
}

export default function CandidateDetailModal({ candidate, onClose }: CandidateDetailModalProps) {
  if (!candidate) return null;

  const isKotakKosong =
    !candidate.foto_url &&
    candidate.nama_calon.toLowerCase().includes("kotak kosong");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto font-poppins">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full p-6 sm:p-8 text-slate-900 space-y-6 shadow-2xl relative my-8 max-h-[90vh] overflow-y-auto font-poppins">
        {/* Modal Topbar */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-xl bg-sky-50 text-[#00296E] font-poppins font-bold text-xs sm:text-sm flex items-center justify-center border border-sky-100">
              {candidate.nomor_urut.toString().padStart(2, "0")}
            </span>
            <div>
              <h3 className="text-base sm:text-lg font-bold font-poppins text-slate-950 leading-tight">
                {candidate.nama_calon}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 font-poppins">
                {isKotakKosong ? "Opsi Alternatif Pemilihan" : "Calon Ketua Himpunan"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Candidate Visual Header */}
        <div className="flex flex-col sm:flex-row items-center gap-5 p-5 rounded-2xl bg-slate-50 border border-slate-200/80">
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0 flex items-center justify-center shadow-xs">
            {candidate.foto_url ? (
              <Image
                src={candidate.foto_url}
                alt={candidate.nama_calon}
                fill
                unoptimized
                sizes="112px"
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 text-slate-400 p-2 text-center">
                <Archive className="w-8 h-8 mb-1 text-slate-400" />
                <span className="text-[10px] font-poppins uppercase font-bold text-slate-500">
                  Kotak Kosong
                </span>
              </div>
            )}
          </div>

          <div className="space-y-1.5 text-center sm:text-left">
            <span className="text-xs font-poppins font-bold uppercase tracking-wider text-[#00296E] bg-sky-50 px-2.5 py-0.5 rounded-md border border-sky-100 inline-block">
              Kandidat Nomor Urut {candidate.nomor_urut.toString().padStart(2, "0")}
            </span>
            <h4 className="text-xl sm:text-2xl font-bold text-slate-950 font-poppins">
              {candidate.nama_calon}
            </h4>
            <p className="text-xs sm:text-sm text-slate-500 font-poppins">
              Himpunan Mahasiswa Sistem Informasi • ISB Atma Luhur
            </p>
          </div>
        </div>

        {/* Visi, Misi, Proker Sections */}
        <div className="space-y-4">
          {candidate.visi && (
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="flex items-center gap-2 text-sky-600">
                <Target className="w-4 h-4" weight="bold" />
                <h5 className="font-bold text-xs sm:text-sm uppercase tracking-wider font-poppins">
                  Visi
                </h5>
              </div>
              <p className="text-sm sm:text-base text-slate-700 leading-relaxed font-poppins whitespace-pre-line">
                {candidate.visi}
              </p>
            </div>
          )}

          {candidate.misi && (
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="flex items-center gap-2 text-emerald-600">
                <ListBullets className="w-4 h-4" weight="bold" />
                <h5 className="font-bold text-xs sm:text-sm uppercase tracking-wider font-poppins">
                  Misi
                </h5>
              </div>
              <p className="text-sm sm:text-base text-slate-700 leading-relaxed font-poppins whitespace-pre-line">
                {candidate.misi}
              </p>
            </div>
          )}

          {candidate.program_kerja && (
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="flex items-center gap-2 text-amber-600">
                <Sparkle className="w-4 h-4" weight="bold" />
                <h5 className="font-bold text-xs sm:text-sm uppercase tracking-wider font-poppins">
                  Program Kerja Unggulan
                </h5>
              </div>
              <p className="text-sm sm:text-base text-slate-700 leading-relaxed font-poppins whitespace-pre-line">
                {candidate.program_kerja}
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="pt-3 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm border border-slate-200 transition cursor-pointer font-poppins"
          >
            Tutup Pratinjau
          </button>
        </div>
      </div>
    </div>
  );
}

