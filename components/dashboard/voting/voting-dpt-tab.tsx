"use client";

import React, { useState, useMemo } from "react";
import {
  MagnifyingGlass,
  Plus,
  UploadSimple,
  Eye,
  EyeSlash,
  Trash,
  CheckCircle,
  Clock,
  Lock,
  Users,
} from "@phosphor-icons/react";
import type { VotingSesi, VotingDPT } from "@/lib/types/voting";
import DPTAddModal from "./dpt-add-modal";
import DPTImportModal from "./dpt-import-modal";

interface VotingDPTTabProps {
  sesi: VotingSesi;
  dptList: VotingDPT[];
  onAddVoter: (voter: {
    sesi_id: string;
    nim: string;
    nama_lengkap: string;
    tanggal_lahir: string;
  }) => Promise<{ success: boolean; error?: string }>;
  onDeleteVoter: (voterId: string) => Promise<boolean>;
  onImportBatch: (
    items: Array<{ nim: string; nama_lengkap: string; tanggal_lahir: string }>
  ) => Promise<{ inserted: number; skipped: number }>;
}

export default function VotingDPTTab({
  sesi,
  dptList,
  onAddVoter,
  onDeleteVoter,
  onImportBatch,
}: VotingDPTTabProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "voted" | "not_voted">("all");
  const [isBirthDateMasked, setIsBirthDateMasked] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [voterToDelete, setVoterToDelete] = useState<VotingDPT | null>(null);

  // Filtered DPT list
  const filteredDPT = useMemo(() => {
    return dptList.filter((item) => {
      // Status filter
      if (statusFilter === "voted" && !item.sudah_memilih) return false;
      if (statusFilter === "not_voted" && item.sudah_memilih) return false;

      // Search filter
      if (search.trim()) {
        const q = search.toLowerCase();
        return item.nim.toLowerCase().includes(q) || item.nama_lengkap.toLowerCase().includes(q);
      }

      return true;
    });
  }, [dptList, statusFilter, search]);

  const totalCount = dptList.length;
  const votedCount = dptList.filter((d) => d.sudah_memilih).length;
  const notVotedCount = totalCount - votedCount;

  // Format date masking
  const formatBirthDate = (rawIsoDate: string) => {
    if (!rawIsoDate) return "-";
    if (isBirthDateMasked) {
      const parts = rawIsoDate.split("-");
      return `••/••/${parts[0] || "••••"}`;
    }
    const [y, m, d] = rawIsoDate.split("-");
    return `${d}/${m}/${y}`;
  };

  const handleConfirmDelete = async () => {
    if (!voterToDelete) return;
    try {
      await onDeleteVoter(voterToDelete.id);
      setVoterToDelete(null);
    } catch {
      // handle error
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Toolbar & Quick Stats (Swiss Minimalist Grid) */}
      <div className="bg-white dark:bg-[#001438] border border-[#00296E]/15 dark:border-white/10 rounded-none p-5 shadow-none">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 text-[#00296E] dark:text-[#38BDF8]" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white font-mono uppercase tracking-wider">
                Daftar Pemilih Tetap (DPT) Mahasiswa
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Verifikasi ganda berbasis NIM dan Tanggal Lahir untuk menjaga keabsahan hak pilih mahasiswa.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowImportModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 border border-[#00296E]/20 dark:border-white/20 rounded-none transition cursor-pointer shadow-none"
            >
              <UploadSimple className="w-3.5 h-3.5" />
              Import Batch (CSV)
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold uppercase tracking-wider text-white bg-[#00296E] hover:bg-[#001f54] rounded-none transition cursor-pointer shadow-none"
            >
              <Plus className="w-3.5 h-3.5" />
              Tambah Pemilih
            </button>
          </div>
        </div>

        {/* Filter bar and search */}
        <div className="mt-5 pt-4 border-t border-[#00296E]/15 dark:border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setStatusFilter("all")}
              className={`px-3 py-1.5 text-xs font-mono font-bold uppercase tracking-wider transition rounded-none cursor-pointer ${
                statusFilter === "all"
                  ? "bg-[#00296E] text-white border border-[#00296E]"
                  : "bg-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 border border-[#00296E]/20 dark:border-white/20"
              }`}
            >
              Semua DPT ({totalCount})
            </button>
            <button
              onClick={() => setStatusFilter("voted")}
              className={`px-3 py-1.5 text-xs font-mono font-bold uppercase tracking-wider transition rounded-none cursor-pointer flex items-center gap-1.5 ${
                statusFilter === "voted"
                  ? "bg-emerald-600 text-white border border-emerald-600"
                  : "bg-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 border border-[#00296E]/20 dark:border-white/20"
              }`}
            >
              <CheckCircle weight="fill" className="w-3.5 h-3.5" />
              Sudah Memilih ({votedCount})
            </button>
            <button
              onClick={() => setStatusFilter("not_voted")}
              className={`px-3 py-1.5 text-xs font-mono font-bold uppercase tracking-wider transition rounded-none cursor-pointer flex items-center gap-1.5 ${
                statusFilter === "not_voted"
                  ? "bg-slate-700 dark:bg-slate-600 text-white border border-slate-700 dark:border-slate-600"
                  : "bg-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 border border-[#00296E]/20 dark:border-white/20"
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              Belum Memilih ({notVotedCount})
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Toggle masked birth date */}
            <button
              onClick={() => setIsBirthDateMasked(!isBirthDateMasked)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono uppercase tracking-wider text-slate-600 dark:text-slate-300 bg-white dark:bg-white/5 border border-[#00296E]/20 dark:border-white/20 rounded-none hover:bg-slate-100 dark:hover:bg-white/10 transition cursor-pointer"
              title="Sembunyikan / Tampilkan Tanggal Lahir"
            >
              {isBirthDateMasked ? <Eye className="w-3.5 h-3.5" /> : <EyeSlash className="w-3.5 h-3.5" />}
              <span>{isBirthDateMasked ? "Buka Sensor 2FA" : "Sensor 2FA"}</span>
            </button>

            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                placeholder="Cari NIM atau Nama..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-white/5 border border-[#00296E]/20 dark:border-white/20 rounded-none focus:outline-none focus:border-[#00296E] dark:focus:border-[#38BDF8] font-mono text-slate-900 dark:text-white w-48 sm:w-60"
              />
              <MagnifyingGlass className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Tabel DPT Swiss Minimalist Grid */}
      <div className="bg-white dark:bg-[#001438] border border-[#00296E]/15 dark:border-white/10 rounded-none overflow-hidden shadow-none">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 dark:bg-[#001740] border-b border-[#00296E]/15 dark:border-white/10 text-[10px] font-mono uppercase tracking-wider text-slate-600 dark:text-slate-300">
              <tr>
                <th className="py-3 px-4 font-bold text-center w-12 border-r border-[#00296E]/15 dark:border-white/10">No</th>
                <th className="py-3 px-4 font-bold border-r border-[#00296E]/15 dark:border-white/10">NIM</th>
                <th className="py-3 px-4 font-bold border-r border-[#00296E]/15 dark:border-white/10">Nama Mahasiswa</th>
                <th className="py-3 px-4 font-bold border-r border-[#00296E]/15 dark:border-white/10">Tgl Lahir (2FA)</th>
                <th className="py-3 px-4 font-bold border-r border-[#00296E]/15 dark:border-white/10">Status Hak Suara</th>
                <th className="py-3 px-4 font-bold border-r border-[#00296E]/15 dark:border-white/10">Waktu Mencoblos</th>
                <th className="py-3 px-4 font-bold text-center w-16">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#00296E]/10 dark:divide-white/10">
              {filteredDPT.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-mono text-xs">
                    Tidak ada data pemilih yang sesuai dengan kriteria filter.
                  </td>
                </tr>
              ) : (
                filteredDPT.map((voter, index) => (
                  <tr
                    key={voter.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-white/[0.03] transition-colors"
                  >
                    <td className="py-3 px-4 text-center font-mono text-slate-400 font-semibold border-r border-[#00296E]/10 dark:border-white/5">
                      {index + 1}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-[#00296E] dark:text-[#38BDF8] border-r border-[#00296E]/10 dark:border-white/5">
                      {voter.nim}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900 dark:text-white border-r border-[#00296E]/10 dark:border-white/5">
                      {voter.nama_lengkap}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300 border-r border-[#00296E]/10 dark:border-white/5">
                      <span className="px-2 py-0.5 rounded-none bg-slate-100 dark:bg-white/5 border border-[#00296E]/15 dark:border-white/10 text-[11px]">
                        {formatBirthDate(voter.tanggal_lahir)}
                      </span>
                    </td>
                    <td className="py-3 px-4 border-r border-[#00296E]/10 dark:border-white/5">
                      {voter.sudah_memilih ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-none text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 uppercase tracking-wider">
                          <CheckCircle weight="fill" className="w-3 h-3" />
                          SUDAH MEMILIH
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-none text-[10px] font-mono font-medium bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 border border-[#00296E]/20 dark:border-white/20 uppercase tracking-wider">
                          <Clock className="w-3 h-3" />
                          BELUM MEMILIH
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500 dark:text-slate-400 text-[11px] border-r border-[#00296E]/10 dark:border-white/5">
                      {voter.voted_at
                        ? new Date(voter.voted_at).toLocaleDateString("id-ID", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "-"}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {voter.sudah_memilih ? (
                        <div
                          className="inline-flex p-1 text-slate-300 dark:text-slate-600 cursor-not-allowed"
                          title="Terkunci: Surat suara sudah masuk kotak suara (asas audit ketat)"
                        >
                          <Lock className="w-4 h-4" />
                        </div>
                      ) : (
                        <button
                          onClick={() => setVoterToDelete(voter)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded-none hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer"
                          title="Hapus Pemilih"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        <div className="p-3 bg-slate-50 dark:bg-[#001740] border-t border-[#00296E]/15 dark:border-white/10 text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2 px-4">
          <span>Menampilkan {filteredDPT.length} dari total {totalCount} data pemilih</span>
          <span>Proteksi Audit: Pemilih yang sudah mencoblos dikunci otomatis (read-only)</span>
        </div>
      </div>

      {/* Modals */}
      <DPTAddModal
        isOpen={showAddModal}
        sesiId={sesi.id}
        onClose={() => setShowAddModal(false)}
        onAdd={onAddVoter}
      />

      <DPTImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={onImportBatch}
      />

      {/* Konfirmasi Hapus Pemilih (Swiss Minimalist Grid) */}
      {voterToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#001438] border border-[#00296E]/20 dark:border-white/15 rounded-none p-6 max-w-sm w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2.5 rounded-none bg-rose-50 dark:bg-rose-950/40 text-rose-600 border border-rose-500/30">
                <Trash className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white font-mono uppercase tracking-wider">
                Hapus Pemilih dari DPT?
              </h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Mahasiswa <strong>{voterToDelete.nama_lengkap}</strong> ({voterToDelete.nim}) akan
              dihapus dari daftar pemilih tetap dan tidak akan memiliki hak akses bilik suara.
            </p>
            <div className="pt-3 flex items-center justify-end gap-2 border-t border-[#00296E]/15 dark:border-white/10">
              <button
                type="button"
                onClick={() => setVoterToDelete(null)}
                className="px-3.5 py-2 text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 border border-[#00296E]/20 dark:border-white/20 rounded-none transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-3.5 py-2 text-xs font-semibold uppercase tracking-wider text-white bg-rose-600 hover:bg-rose-700 rounded-none shadow-none transition cursor-pointer"
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
