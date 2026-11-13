"use client";

import React, { useState } from "react";
import { X, Check, ArrowClockwise, UserPlus, CalendarBlank } from "@phosphor-icons/react";

interface DPTAddModalProps {
  isOpen: boolean;
  sesiId: string;
  onClose: () => void;
  onAdd: (voter: {
    sesi_id: string;
    nim: string;
    nama_lengkap: string;
    tanggal_lahir: string;
  }) => Promise<{ success: boolean; error?: string }>;
}

export default function DPTAddModal({ isOpen, sesiId, onClose, onAdd }: DPTAddModalProps) {
  const [nim, setNim] = useState("");
  const [namaLengkap, setNamaLengkap] = useState("");
  const [tanggalLahir, setTanggalLahir] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nim.trim() || !namaLengkap.trim() || !tanggalLahir.trim()) {
      setErrorMsg("Semua kolom (NIM, Nama, Tanggal Lahir) wajib diisi.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await onAdd({
        sesi_id: sesiId,
        nim: nim.trim(),
        nama_lengkap: namaLengkap.trim(),
        tanggal_lahir: tanggalLahir.trim(),
      });

      if (res.success) {
        setNim("");
        setNamaLengkap("");
        setTanggalLahir("");
        onClose();
      } else {
        setErrorMsg(res.error || "Gagal menambahkan pemilih.");
      }
    } catch {
      setErrorMsg("Terjadi kesalahan sistem saat menambahkan pemilih.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-[#00296E] dark:text-blue-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white font-mono uppercase tracking-wider">
              Tambah Pemilih DPT
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-xs text-rose-600 dark:text-rose-400">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
              Nomor Induk Mahasiswa (NIM)
            </label>
            <input
              type="text"
              placeholder="misal: 2211500045"
              value={nim}
              onChange={(e) => setNim(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#00296E] font-mono"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
              Nama Lengkap Mahasiswa
            </label>
            <input
              type="text"
              placeholder="misal: Muhammad Rizky"
              value={namaLengkap}
              onChange={(e) => setNamaLengkap(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#00296E]"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
              Tanggal Lahir (Faktor Autentikasi 2FA)
            </label>
            <div className="relative">
              <input
                type="date"
                value={tanggalLahir}
                onChange={(e) => setTanggalLahir(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#00296E] font-mono"
                required
              />
              <CalendarBlank className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
            <span className="text-[10px] text-slate-500 mt-1 block">
              Format YYYY-MM-DD. Digunakan mahasiswa untuk verifikasi saat login di bilik suara.
            </span>
          </div>

          <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#00296E] hover:bg-[#002055] rounded-lg shadow-sm transition"
            >
              {isSubmitting ? (
                <ArrowClockwise className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Check className="w-3.5 h-3.5" />
              )}
              Simpan Pemilih
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
