"use client";

import React, { useState } from "react";
import { X, Check, ArrowClockwise, Image as ImageIcon } from "@phosphor-icons/react";
import type { VotingKandidat } from "@/lib/types/voting";

interface CandidateModalProps {
  isOpen: boolean;
  sesiId: string;
  candidateToEdit?: VotingKandidat | null;
  onClose: () => void;
  onSave: (candidate: Partial<VotingKandidat> & { sesi_id: string; nama_calon: string; nomor_urut: number }) => Promise<void>;
}

export default function CandidateModal({
  isOpen,
  sesiId,
  candidateToEdit,
  onClose,
  onSave,
}: CandidateModalProps) {
  const [nomorUrut, setNomorUrut] = useState<number>(candidateToEdit ? candidateToEdit.nomor_urut : 1);
  const [namaCalon, setNamaCalon] = useState<string>(candidateToEdit ? candidateToEdit.nama_calon : "");
  const [fotoUrl, setFotoUrl] = useState<string>(candidateToEdit?.foto_url || "");
  const [visi, setVisi] = useState<string>(candidateToEdit?.visi || "");
  const [misi, setMisi] = useState<string>(candidateToEdit?.misi || "");
  const [programKerja, setProgramKerja] = useState<string>(candidateToEdit?.program_kerja || "");
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaCalon.trim()) {
      setErrorMsg("Nama calon ketua wajib diisi.");
      return;
    }

    setIsSaving(true);
    setErrorMsg(null);
    try {
      await onSave({
        id: candidateToEdit?.id,
        sesi_id: sesiId,
        nomor_urut: Number(nomorUrut),
        nama_calon: namaCalon.trim(),
        foto_url: fotoUrl.trim() || null,
        visi: visi.trim() || null,
        misi: misi.trim() || null,
        program_kerja: programKerja.trim() || null,
      });
      onClose();
    } catch {
      setErrorMsg("Terjadi kesalahan saat menyimpan data kandidat.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-[#001438] border border-[#00296E]/20 dark:border-white/15 rounded-none max-w-xl w-full shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#00296E]/15 dark:border-white/10">
          <div>
            <h3 className="text-sm font-bold text-[#00296E] dark:text-white font-mono uppercase tracking-wider">
              {candidateToEdit ? "Edit Profil Kandidat" : "Tambah Kandidat Pemilihan"}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Formulir identitas, foto resmi, visi-misi calon ketua himpunan
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-none text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-none bg-rose-50 dark:bg-rose-950/30 border border-rose-300 dark:border-rose-900/40 text-xs text-rose-600 dark:text-rose-400 font-mono">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="sm:col-span-1">
              <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                No. Urut
              </label>
              <input
                type="number"
                min={1}
                max={99}
                value={nomorUrut}
                onChange={(e) => setNomorUrut(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-white/5 border border-[#00296E]/20 dark:border-white/20 rounded-none focus:outline-none focus:border-[#00296E] dark:focus:border-[#38BDF8] font-mono text-center font-bold text-slate-900 dark:text-white"
                required
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                Nama Lengkap Calon Ketua / Opsi
              </label>
              <input
                type="text"
                placeholder="misal: Rayhan Maulana Pratama / Kotak Kosong"
                value={namaCalon}
                onChange={(e) => setNamaCalon(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-white/5 border border-[#00296E]/20 dark:border-white/20 rounded-none focus:outline-none focus:border-[#00296E] dark:focus:border-[#38BDF8] text-slate-900 dark:text-white"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
              URL Foto Resmi (Opsional)
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="url"
                  placeholder="https://..."
                  value={fotoUrl}
                  onChange={(e) => setFotoUrl(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-white/5 border border-[#00296E]/20 dark:border-white/20 rounded-none focus:outline-none focus:border-[#00296E] dark:focus:border-[#38BDF8] text-slate-900 dark:text-white"
                />
                <ImageIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
              Visi Kandidat
            </label>
            <textarea
              rows={2}
              placeholder="Visi kepemimpinan calon ketua himpunan..."
              value={visi}
              onChange={(e) => setVisi(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-white/5 border border-[#00296E]/20 dark:border-white/20 rounded-none focus:outline-none focus:border-[#00296E] dark:focus:border-[#38BDF8] text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
              Misi Kandidat (Butir per butir)
            </label>
            <textarea
              rows={3}
              placeholder="1. Mengembangkan ekosistem riset...&#10;2. Memperluas relasi..."
              value={misi}
              onChange={(e) => setMisi(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-white/5 border border-[#00296E]/20 dark:border-white/20 rounded-none focus:outline-none focus:border-[#00296E] dark:focus:border-[#38BDF8] text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
              Program Kerja Unggulan (Proker)
            </label>
            <textarea
              rows={2}
              placeholder="• SI-Techfest Hackathon&#10;• HIMASI Data Lab"
              value={programKerja}
              onChange={(e) => setProgramKerja(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-white/5 border border-[#00296E]/20 dark:border-white/20 rounded-none focus:outline-none focus:border-[#00296E] dark:focus:border-[#38BDF8] text-slate-900 dark:text-white"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-4 flex items-center justify-end gap-2 border-t border-[#00296E]/15 dark:border-white/10">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-3.5 py-2 text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 border border-[#00296E]/20 dark:border-white/20 rounded-none transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white bg-[#00296E] hover:bg-[#001f54] rounded-none shadow-none transition cursor-pointer"
            >
              {isSaving ? (
                <ArrowClockwise className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Check className="w-3.5 h-3.5" />
              )}
              {candidateToEdit ? "Simpan Perubahan" : "Tambahkan Kandidat"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
