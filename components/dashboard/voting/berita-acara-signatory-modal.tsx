"use client";

import React, { useState } from "react";
import { X, Check, PenNib } from "@phosphor-icons/react";
import type { SignatoryConfig } from "@/lib/types/voting";

interface BeritaAcaraSignatoryModalProps {
  isOpen: boolean;
  currentSignatories: SignatoryConfig;
  onClose: () => void;
  onSave: (config: SignatoryConfig) => void;
}

export default function BeritaAcaraSignatoryModal({
  isOpen,
  currentSignatories,
  onClose,
  onSave,
}: BeritaAcaraSignatoryModalProps) {
  const [signatories, setSignatories] = useState<SignatoryConfig>({ ...currentSignatories });

  if (!isOpen) return null;

  const handleChange = (key: keyof SignatoryConfig, value: string) => {
    setSignatories((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(signatories);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <PenNib className="w-5 h-5 text-[#00296E] dark:text-blue-400" />
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white font-mono uppercase tracking-wider">
                Konfigurasi Penandatangan Berita Acara
              </h3>
              <p className="text-xs text-slate-500">
                Atur nama &amp; NIM panitia KPU dan saksi resmi yang tercetak di lembar Berita Acara
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Ketua KPU */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#00296E] dark:text-blue-400 block">
              1. Ketua Panitia Pemilihan / KPU
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Nama Lengkap"
                value={signatories.nama_ketua_kpu}
                onChange={(e) => handleChange("nama_ketua_kpu", e.target.value)}
                className="px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                required
              />
              <input
                type="text"
                placeholder="NIM"
                value={signatories.nim_ketua_kpu}
                onChange={(e) => handleChange("nim_ketua_kpu", e.target.value)}
                className="px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-mono"
                required
              />
            </div>
          </div>

          {/* Saksi Paslon 1 */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
              2. Saksi Kandidat 01
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Nama Saksi 1"
                value={signatories.nama_saksi_1}
                onChange={(e) => handleChange("nama_saksi_1", e.target.value)}
                className="px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                required
              />
              <input
                type="text"
                placeholder="NIM Saksi 1"
                value={signatories.nim_saksi_1}
                onChange={(e) => handleChange("nim_saksi_1", e.target.value)}
                className="px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-mono"
                required
              />
            </div>
          </div>

          {/* Saksi Kotak Kosong / Alternatif */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
              3. Saksi Kotak Kosong / Saksi Independen
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Nama Saksi 2"
                value={signatories.nama_saksi_2}
                onChange={(e) => handleChange("nama_saksi_2", e.target.value)}
                className="px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                required
              />
              <input
                type="text"
                placeholder="NIM Saksi 2"
                value={signatories.nim_saksi_2}
                onChange={(e) => handleChange("nim_saksi_2", e.target.value)}
                className="px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-mono"
                required
              />
            </div>
          </div>

          {/* Ketua Umum HIMASI */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
              4. Mengetahui: Ketua Umum HIMASI
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Nama Ketua Umum"
                value={signatories.nama_ketua_umum}
                onChange={(e) => handleChange("nama_ketua_umum", e.target.value)}
                className="px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                required
              />
              <input
                type="text"
                placeholder="NIM"
                value={signatories.nim_ketua_umum}
                onChange={(e) => handleChange("nim_ketua_umum", e.target.value)}
                className="px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-mono"
                required
              />
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
            >
              Batal
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#00296E] hover:bg-[#002055] rounded-lg shadow-sm transition"
            >
              <Check className="w-3.5 h-3.5" />
              Simpan Konfigurasi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

