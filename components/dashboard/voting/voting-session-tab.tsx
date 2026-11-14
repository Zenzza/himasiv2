"use client";

import React, { useState } from "react";
import {
  Lock,
  LockOpen,
  WarningCircle,
  Clock,
  Trophy,
  ArrowClockwise,
  Broadcast,
  Play,
  Stop,
  Archive,
  ChartBar,
} from "@phosphor-icons/react";
import type {
  VotingSesi,
  VotingKandidat,
  VotingSuaraResult,
  VotingSummaryMetrics,
} from "@/lib/types/voting";

interface VotingSessionTabProps {
  sesi: VotingSesi;
  metrics: VotingSummaryMetrics;
  candidates: VotingKandidat[];
  results: VotingSuaraResult[];
  loading: boolean;
  onRefresh: () => void;
  onUpdateStatus: (newStatus: VotingSesi["status"]) => Promise<void>;
  onUnlockResults: () => Promise<void>;
}

export default function VotingSessionTab({
  sesi,
  metrics,
  results,
  loading,
  onRefresh,
  onUpdateStatus,
  onUnlockResults,
}: VotingSessionTabProps) {
  const [showUnlockConfirm, setShowUnlockConfirm] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const handleUnlock = async () => {
    setIsUnlocking(true);
    try {
      await onUnlockResults();
      setShowUnlockConfirm(false);
    } finally {
      setIsUnlocking(false);
    }
  };

  const handleStatusChange = async (newStatus: VotingSesi["status"]) => {
    setIsUpdatingStatus(true);
    try {
      await onUpdateStatus(newStatus);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Turnout percentage calculations
  const turnoutPct = metrics.persentase_partisipasi;

  return (
    <div className="space-y-5">
      {/* 1. Panel Status Sesi Utama (Swiss Minimalist Grid) */}
      <div className="bg-white dark:bg-[#001438] border border-[#00296E]/15 dark:border-white/10 rounded-none p-5 shadow-none">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#00296E]/15 dark:border-white/10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400">
                Siklus Sesi Pemilihan
              </span>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-none text-[10px] font-mono font-bold uppercase tracking-wider ${
                  sesi.status === "open"
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                    : sesi.status === "closed"
                      ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                      : sesi.status === "archived"
                        ? "bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20"
                        : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                }`}
              >
                {sesi.status === "open" && (
                  <span className="w-1.5 h-1.5 rounded-none bg-emerald-500 animate-pulse" />
                )}
                STATUS: {metrics.status_label}
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight uppercase font-poppins">
              {sesi.judul}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
              Periode: <span className="font-semibold text-[#00296E] dark:text-[#38BDF8]">{sesi.tahun_periode}</span>
              {sesi.opened_at && ` • Dibuka: ${new Date(sesi.opened_at).toLocaleDateString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB`}
              {sesi.closed_at && ` • Ditutup: ${new Date(sesi.closed_at).toLocaleDateString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB`}
            </p>
          </div>

          {/* Quick Action Buttons for Status Lifecycle */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onRefresh}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-200 bg-white dark:bg-[#001740] border border-[#00296E]/20 dark:border-white/20 rounded-none hover:bg-slate-50 dark:hover:bg-white/5 transition cursor-pointer"
              title="Refresh Data"
            >
              <ArrowClockwise className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            {sesi.status === "draft" && (
              <button
                type="button"
                onClick={() => handleStatusChange("open")}
                disabled={isUpdatingStatus}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white bg-emerald-600 hover:bg-emerald-700 rounded-none shadow-none transition cursor-pointer"
              >
                <Play weight="fill" className="w-3.5 h-3.5" />
                Buka Bilik Suara
              </button>
            )}

            {sesi.status === "open" && (
              <button
                type="button"
                onClick={() => handleStatusChange("closed")}
                disabled={isUpdatingStatus}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white bg-amber-600 hover:bg-amber-700 rounded-none shadow-none transition cursor-pointer"
              >
                <Stop weight="fill" className="w-3.5 h-3.5" />
                Tutup Pemilihan
              </button>
            )}

            {sesi.status === "closed" && !sesi.is_results_unlocked && (
              <button
                type="button"
                onClick={() => handleStatusChange("open")}
                disabled={isUpdatingStatus}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-200 bg-white dark:bg-[#001740] hover:bg-slate-50 dark:hover:bg-white/5 border border-[#00296E]/20 dark:border-white/20 rounded-none transition cursor-pointer"
              >
                <Broadcast className="w-3.5 h-3.5 text-blue-500" />
                Perpanjang Waktu
              </button>
            )}

            {sesi.status === "closed" && sesi.is_results_unlocked && (
              <button
                type="button"
                onClick={() => handleStatusChange("archived")}
                disabled={isUpdatingStatus}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-200 bg-white dark:bg-[#001740] hover:bg-slate-50 dark:hover:bg-white/5 border border-[#00296E]/20 dark:border-white/20 rounded-none transition cursor-pointer"
              >
                <Archive className="w-3.5 h-3.5 text-slate-500" />
                Arsipkan Sesi
              </button>
            )}
          </div>
        </div>

        {/* Partisipasi Live Meter */}
        <div className="pt-4">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
              Tingkat Partisipasi Mahasiswa (Turnout)
            </span>
            <span className="font-mono font-bold text-slate-900 dark:text-white">
              {metrics.suara_masuk} dari {metrics.total_dpt} DPT ({turnoutPct}%)
            </span>
          </div>
          <div className="w-full h-2.5 bg-slate-100 dark:bg-white/5 rounded-none overflow-hidden border border-[#00296E]/15 dark:border-white/10">
            <div
              className="h-full bg-[#00296E] dark:bg-[#38BDF8] transition-all duration-700 ease-out rounded-none"
              style={{ width: `${turnoutPct}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1 font-mono uppercase">
            <span>0%</span>
            <span>Kuorum Minimal 50%</span>
            <span>100%</span>
          </div>
        </div>
      </div>

      {/* 2. Section Quick Count & Blind Voting */}
      <div className="bg-white dark:bg-[#001438] border border-[#00296E]/15 dark:border-white/10 rounded-none p-5 sm:p-6 shadow-none">
        <div className="flex items-center justify-between pb-4 border-b border-[#00296E]/15 dark:border-white/10 mb-6">
          <div className="flex items-center gap-2">
            <ChartBar className="w-4 h-4 text-[#00296E] dark:text-[#38BDF8]" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono">
              Rekapitulasi Suara &amp; Quick Count
            </h3>
          </div>
          <div>
            {sesi.is_results_unlocked ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-none text-xs font-mono font-bold uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <LockOpen className="w-3.5 h-3.5" />
                KOTAK SUARA TERBUKA (HASIL RESMI)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-none text-xs font-mono font-bold uppercase bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                <Lock className="w-3.5 h-3.5" />
                BLIND VOTING (DIKUNCI)
              </span>
            )}
          </div>
        </div>

        {/* Kondisi A: Sesi Masih Aktif (Open) -> Kotak Suara Dirahasiakan Mutlak */}
        {sesi.status === "open" && !sesi.is_results_unlocked && (
          <div className="rounded-none border border-dashed border-amber-300 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20 p-8 text-center max-w-xl mx-auto my-4">
            <div className="w-12 h-12 rounded-none bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-3 border border-amber-300 dark:border-amber-800">
              <Lock className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono mb-1">
              Blind Voting Aktif — Kotak Suara Terkunci Rapat
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-md mx-auto">
              Sesuai asas Luber Jurdil, angka perolehan masing-masing kandidat dirahasiakan selama
              bilik suara masih dibuka untuk menjamin independensi hak pilih mahasiswa.
            </p>
            <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-none bg-amber-100/80 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 text-xs font-mono">
              <Clock className="w-3.5 h-3.5" />
              Hasil perolehan kandidat dapat dibuka setelah pemilihan ditutup.
            </div>
          </div>
        )}

        {/* Kondisi B: Sesi Ditutup (Closed), Hasil Belum Dibuka -> Admin Berwenang Buka Kunci */}
        {sesi.status === "closed" && !sesi.is_results_unlocked && (
          <div className="rounded-none border border-dashed border-[#00296E]/30 dark:border-white/20 bg-slate-50/50 dark:bg-white/[0.02] p-8 text-center max-w-xl mx-auto my-4">
            <div className="w-12 h-12 rounded-none bg-[#00296E]/10 dark:bg-white/10 text-[#00296E] dark:text-[#38BDF8] flex items-center justify-center mx-auto mb-3 border border-[#00296E]/20 dark:border-white/20">
              <Lock className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono mb-1">
              Pemilihan Telah Ditutup — Kotak Suara Siap Dibuka
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-md mx-auto mb-5">
              Seluruh surat suara telah terenkripsi dan tersimpan anonim di database. Buka kunci kotak
              suara digital untuk menghitung dan menampilkan hasil rekapitulasi secara resmi.
            </p>
            <button
              type="button"
              onClick={() => setShowUnlockConfirm(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider font-mono text-white bg-[#00296E] hover:bg-[#001f54] rounded-none shadow-none transition cursor-pointer"
            >
              <LockOpen className="w-4 h-4" />
              Buka Kunci Kotak Suara &amp; Ungkap Hasil
            </button>
          </div>
        )}

        {/* Kondisi C: Sesi Masih Draft */}
        {sesi.status === "draft" && !sesi.is_results_unlocked && (
          <div className="rounded-none border border-[#00296E]/15 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] p-8 text-center max-w-xl mx-auto my-4">
            <div className="w-12 h-12 rounded-none bg-slate-200 dark:bg-white/10 text-slate-500 dark:text-slate-400 flex items-center justify-center mx-auto mb-3 border border-slate-300 dark:border-white/15">
              <Clock className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono mb-1">
              Sesi Masih Dalam Tahap Persiapan (Draf)
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-md mx-auto">
              Silakan lengkapi data kandidat dan verifikasi daftar pemilih tetap (DPT) sebelum membuka
              bilik suara bagi mahasiswa.
            </p>
          </div>
        )}

        {/* Kondisi D: Hasil Terbuka (Unlocked) -> Tampilkan Grafik & Hasil Suara Lengkap */}
        {sesi.is_results_unlocked && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {results.map((r) => (
                <div
                  key={r.kandidat_id}
                  className={`relative p-5 rounded-none border transition-all ${
                    r.is_winner
                      ? "border-emerald-500/40 bg-emerald-50/20 dark:bg-emerald-950/20 shadow-none"
                      : "border-[#00296E]/15 dark:border-white/10 bg-white dark:bg-[#001438]"
                  }`}
                >
                  {r.is_winner && (
                    <div className="absolute top-3 right-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-none text-[10px] font-mono font-bold uppercase bg-emerald-600 text-white shadow-none">
                      <Trophy className="w-3 h-3" />
                      SUARA TERBANYAK
                    </div>
                  )}

                  <div className="flex items-start gap-3 mb-3">
                    <span className="font-mono text-2xl font-black text-[#00296E] dark:text-[#38BDF8]">
                      {String(r.nomor_urut).padStart(2, "0")}
                    </span>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white uppercase font-poppins">
                        {r.nama_calon}
                      </h4>
                      <p className="text-xs text-slate-500 font-mono">
                        {r.total_suara} Suara Terkumpul
                      </p>
                    </div>
                  </div>

                  {/* Progress bar visual */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-slate-500 uppercase tracking-wider text-[10px]">Persentase</span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {r.persentase}%
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-none bg-slate-100 dark:bg-white/5 overflow-hidden border border-[#00296E]/15 dark:border-white/10">
                      <div
                        className={`h-full rounded-none transition-all duration-700 ${
                          r.is_winner
                            ? "bg-emerald-500 dark:bg-emerald-400"
                            : "bg-[#00296E] dark:bg-[#38BDF8]"
                        }`}
                        style={{ width: `${r.persentase}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 rounded-none bg-slate-50 dark:bg-white/[0.02] border border-[#00296E]/15 dark:border-white/10 text-xs text-slate-600 dark:text-slate-400 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="font-mono">
                Total Suara Sah Masuk:{" "}
                <strong className="text-slate-900 dark:text-white">{metrics.suara_masuk}</strong>{" "}
                dari{" "}
                <strong className="text-slate-900 dark:text-white">{metrics.total_dpt}</strong> DPT
              </span>
              <span className="text-slate-500 text-[11px] font-mono">
                Dokumen Berita Acara dapat dicetak pada sub-tab &quot;04. Berita Acara &amp; Cetak PDF&quot;.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Modal Konfirmasi Buka Kunci Hasil (Irreversible Action) */}
      {showUnlockConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#001438] border border-[#00296E]/20 dark:border-white/15 rounded-none p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400">
              <div className="p-2.5 rounded-none bg-amber-100 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-800">
                <WarningCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-[#00296E] dark:text-white font-mono uppercase tracking-wider">
                  Konfirmasi Pembukaan Kotak Suara
                </h3>
                <p className="text-xs text-slate-500 font-mono">Tindakan ini bersifat permanen &amp; resmi</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Apakah Anda yakin ingin membuka kunci kotak suara digital? Setelah dibuka, hasil perolehan
              seluruh kandidat akan terungkap secara publik dan status pemilihan tidak dapat dibuka
              kembali.
            </p>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#00296E]/15 dark:border-white/10">
              <button
                type="button"
                onClick={() => setShowUnlockConfirm(false)}
                disabled={isUnlocking}
                className="px-3.5 py-2 text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 border border-[#00296E]/20 dark:border-white/20 rounded-none transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleUnlock}
                disabled={isUnlocking}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white bg-[#00296E] hover:bg-[#001f54] rounded-none shadow-none transition cursor-pointer"
              >
                {isUnlocking ? (
                  <ArrowClockwise className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <LockOpen className="w-3.5 h-3.5" />
                )}
                Buka Kunci Sekarang
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
