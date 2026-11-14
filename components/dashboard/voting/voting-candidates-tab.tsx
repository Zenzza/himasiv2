"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  Plus,
  PencilSimple,
  Trash,
  User,
  WarningCircle,
  ListNumbers,
} from "@phosphor-icons/react";
import type { VotingSesi, VotingKandidat } from "@/lib/types/voting";
import CandidateModal from "./candidate-modal";

interface VotingCandidatesTabProps {
  sesi: VotingSesi;
  candidates: VotingKandidat[];
  onSaveCandidate: (
    candidate: Partial<VotingKandidat> & { sesi_id: string; nama_calon: string; nomor_urut: number }
  ) => Promise<void>;
  onDeleteCandidate: (candidateId: string) => Promise<void>;
}

export default function VotingCandidatesTab({
  sesi,
  candidates,
  onSaveCandidate,
  onDeleteCandidate,
}: VotingCandidatesTabProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState<VotingKandidat | null>(null);
  const [deleteCandidateId, setDeleteCandidateId] = useState<string | null>(null);

  const isEditable = sesi.status === "draft";

  const handleOpenAdd = () => {
    setEditingCandidate(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (cand: VotingKandidat) => {
    setEditingCandidate(cand);
    setModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteCandidateId) return;
    try {
      await onDeleteCandidate(deleteCandidateId);
      setDeleteCandidateId(null);
    } catch {
      // handle error
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Header & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#001438] border border-[#00296E]/15 dark:border-white/10 rounded-none p-5 shadow-none">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ListNumbers className="w-4 h-4 text-[#00296E] dark:text-[#38BDF8]" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white font-mono uppercase tracking-wider">
              Data Calon Ketua Himpunan &amp; Opsi Kotak Kosong
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Daftar resmi kandidat yang akan tampil pada bilik suara digital mahasiswa.
          </p>
        </div>

        {isEditable ? (
          <button
            type="button"
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold uppercase tracking-wider text-white bg-[#00296E] hover:bg-[#001f54] rounded-none shadow-none transition self-start sm:self-auto cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Tambah Kandidat
          </button>
        ) : (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-none bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-[11px] font-mono text-amber-700 dark:text-amber-400">
            <WarningCircle className="w-3.5 h-3.5" />
            Data kandidat terkunci (sesi berstatus {sesi.status.toUpperCase()})
          </div>
        )}
      </div>

      {/* Grid Kartu Kandidat Swiss Minimalist */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {candidates.map((cand) => (
          <div
            key={cand.id}
            className="group relative bg-white dark:bg-[#001438] border border-[#00296E]/15 dark:border-white/10 rounded-none overflow-hidden shadow-none hover:border-[#00296E]/40 dark:hover:border-white/30 transition duration-200"
          >
            {/* Header Nomor Urut & Aksi */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-[#00296E]/15 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02]">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Nomor Urut
                </span>
                <span className="w-7 h-7 rounded-none bg-[#00296E] dark:bg-[#38BDF8] text-white dark:text-[#001438] font-mono font-bold text-sm flex items-center justify-center shadow-none">
                  {String(cand.nomor_urut).padStart(2, "0")}
                </span>
              </div>

              {isEditable && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(cand)}
                    className="p-1.5 text-slate-500 hover:text-[#00296E] dark:hover:text-[#38BDF8] rounded-none hover:bg-slate-100 dark:hover:bg-white/5 transition cursor-pointer"
                    title="Edit Profil"
                  >
                    <PencilSimple className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteCandidateId(cand.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-600 rounded-none hover:bg-rose-50 dark:hover:bg-rose-950/20 transition cursor-pointer"
                    title="Hapus Kandidat"
                  >
                    <Trash className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Profile Body */}
            <div className="p-5 space-y-4">
              <div className="flex items-start gap-4">
                {/* Foto / Ilustrasi Avatar */}
                <div className="relative w-20 h-24 rounded-none overflow-hidden bg-slate-100 dark:bg-white/5 border border-[#00296E]/15 dark:border-white/10 shrink-0">
                  {cand.foto_url ? (
                    <Image
                      src={cand.foto_url}
                      alt={cand.nama_calon}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 p-2 text-center">
                      <User className="w-8 h-8 mb-1" />
                      <span className="text-[9px] font-mono leading-tight uppercase">Kotak Kosong</span>
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <h4 className="text-base font-bold text-slate-900 dark:text-white leading-tight mb-1 uppercase font-poppins">
                    {cand.nama_calon}
                  </h4>
                  <p className="text-[10px] font-mono text-[#00296E] dark:text-[#38BDF8] font-bold uppercase tracking-wider mb-2">
                    {cand.nomor_urut === 1 ? "CALON KETUA HIMPUNAN TUNGGAL" : "OPSI ASPIRASI MAHASISWA"}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed">
                    {cand.visi || "Belum ada deskripsi visi yang dimasukkan."}
                  </p>
                </div>
              </div>

              {/* Misi & Program Kerja Snippet */}
              <div className="pt-3 border-t border-[#00296E]/15 dark:border-white/10 space-y-2 text-xs">
                <div>
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-0.5">
                    Misi Utama:
                  </span>
                  <p className="text-slate-600 dark:text-slate-400 whitespace-pre-line text-[11px] leading-relaxed line-clamp-2">
                    {cand.misi || "-"}
                  </p>
                </div>

                {cand.program_kerja && (
                  <div>
                    <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-0.5">
                      Program Kerja Unggulan:
                    </span>
                    <p className="text-slate-600 dark:text-slate-400 whitespace-pre-line text-[11px] leading-relaxed line-clamp-2">
                      {cand.program_kerja}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Edit / Tambah Kandidat */}
      <CandidateModal
        key={editingCandidate?.id || "new-candidate-modal"}
        isOpen={modalOpen}
        sesiId={sesi.id}
        candidateToEdit={editingCandidate}
        onClose={() => setModalOpen(false)}
        onSave={onSaveCandidate}
      />

      {/* Dialog Konfirmasi Hapus */}
      {deleteCandidateId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#001438] border border-[#00296E]/20 dark:border-white/15 rounded-none p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2.5 rounded-none bg-rose-100 dark:bg-rose-900/30 border border-rose-300 dark:border-rose-800">
                <Trash className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white font-mono uppercase tracking-wider">
                Hapus Data Kandidat?
              </h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Data kandidat ini akan dihapus dari sesi pemilihan. Tindakan ini hanya dapat dilakukan
              selama sesi berstatus draf.
            </p>
            <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#00296E]/15 dark:border-white/10">
              <button
                type="button"
                onClick={() => setDeleteCandidateId(null)}
                className="px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 border border-[#00296E]/20 dark:border-white/20 rounded-none transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-white bg-rose-600 hover:bg-rose-700 rounded-none shadow-none transition cursor-pointer"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
