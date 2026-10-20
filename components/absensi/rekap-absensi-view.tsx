"use client";

import { useState, useMemo } from "react";
import {
  Printer,
  Search,
  FileText,
  Plus,
  Trash2,
  Calendar,
  Clock,
  RotateCcw,
  Users,
  CheckCircle2,
  Eye,
  Table as TableIcon
} from "lucide-react";
import type { AbsensiRecord } from "@/components/absensi/admin-qr-scanner";
import { DAFTAR_PENGURUS_HIMASI } from "@/lib/data/pengurus";

export interface KegiatanItem {
  id: string;
  nama: string;
  tanggal: string;
  jam: string;
}

export function formatTanggalIndo(dateStr: string): string {
  if (!dateStr) return "-";
  try {
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      const rawYear = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      if (!isNaN(rawYear) && !isNaN(month) && !isNaN(day)) {
        const year = rawYear > 2100 ? 2026 : rawYear;
        const d = new Date(year, month, day);
        return d.toLocaleDateString("id-ID", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        });
      }
    }
    const d = new Date(dateStr.includes("T") ? dateStr : `${dateStr}T00:00:00`);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

interface RekapAbsensiViewProps {
  logs: AbsensiRecord[];
  kegiatanList: KegiatanItem[];
  activeKegiatan: KegiatanItem | null;
  onSelectKegiatan: (kegiatan: KegiatanItem) => void;
  onOpenTambahModal: () => void;
  onDeleteKegiatan?: (id: string) => void;
  onDeleteAbsensiLog?: (nim: string, kegiatanNama: string) => void;
  onResetAllAbsensiLogs?: (kegiatanNama: string) => void;
}

export default function RekapAbsensiView({
  logs,
  kegiatanList,
  activeKegiatan,
  onSelectKegiatan,
  onOpenTambahModal,
  onDeleteKegiatan,
  onDeleteAbsensiLog,
  onResetAllAbsensiLogs,
}: RekapAbsensiViewProps) {
  const [selectedDivisi, setSelectedDivisi] = useState<string>("SEMUA");
  const [searchQuery, setSearchQuery] = useState("");
  const [previewMode, setPreviewMode] = useState<"table" | "kegiatan" | "pdf">("table");
  const [searchKegiatanQuery, setSearchKegiatanQuery] = useState("");

  // Filter Daftar Kegiatan untuk Tabel Kegiatan Multi-Device
  const filteredKegiatanList = useMemo(() => {
    if (!searchKegiatanQuery.trim()) return kegiatanList;
    const q = searchKegiatanQuery.toLowerCase();
    return kegiatanList.filter(
      (k) =>
        k.nama.toLowerCase().includes(q) ||
        k.tanggal.includes(q) ||
        k.jam.toLowerCase().includes(q)
    );
  }, [kegiatanList, searchKegiatanQuery]);

  // Filter Log berdasarkan Kegiatan Terpilih
  const logsForKegiatan = useMemo(() => {
    if (!activeKegiatan?.nama) return [];
    const cleanAktif = activeKegiatan.nama.trim().toLowerCase();
    if (!cleanAktif) return logs;
    return logs.filter(
      (log) => log.kegiatan.trim().toLowerCase() === cleanAktif
    );
  }, [logs, activeKegiatan]);

  // Gabungkan dengan seluruh pengurus untuk mengetahui siapa yang belum hadir
  const fullAttendanceList = useMemo(() => {
    return DAFTAR_PENGURUS_HIMASI.map((pengurus) => {
      const matchLog = logsForKegiatan.find((l) => l.nim === pengurus.nim || l.pengurusId === pengurus.id);
      return {
        id: pengurus.id,
        nim: pengurus.nim,
        nama: pengurus.nama,
        jabatan: pengurus.jabatan,
        divisi: pengurus.divisi,
        image: pengurus.image,
        waktu: matchLog ? matchLog.waktu : "-",
        status: matchLog ? matchLog.status : ("Belum Hadir" as const),
      };
    });
  }, [logsForKegiatan]);

  // Filter Berdasarkan Divisi & Pencarian
  const filteredList = useMemo(() => {
    return fullAttendanceList.filter((item) => {
      const matchDivisi =
        selectedDivisi === "SEMUA" || item.divisi === selectedDivisi;
      const matchSearch =
        item.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.nim.includes(searchQuery) ||
        item.jabatan.toLowerCase().includes(searchQuery.toLowerCase());
      return matchDivisi && matchSearch;
    });
  }, [fullAttendanceList, selectedDivisi, searchQuery]);

  // Statistik
  const countHadir = logsForKegiatan.filter((l) => l.status === "Hadir").length;
  const countTerlambat = logsForKegiatan.filter((l) => l.status === "Terlambat").length;
  const totalPresensi = countHadir + countTerlambat;
  const totalPengurus = DAFTAR_PENGURUS_HIMASI.length;
  const persentase = Math.round((totalPresensi / totalPengurus) * 100);

  // Trigger Print Browser untuk Simpan PDF
  const handlePrint = () => {
    window.print();
  };

  const currentDateFormatted = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  if (!activeKegiatan || kegiatanList.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 text-center max-w-xl mx-auto shadow-xs">
        <div className="w-16 h-16 rounded-2xl bg-sky-50 text-[#00296E] flex items-center justify-center mx-auto mb-4 border border-sky-100 shadow-2xs">
          <Calendar className="w-8 h-8 text-[#0094E0]" />
        </div>
        <h3 className="text-xl font-black text-[#00296E]">Belum Ada Kegiatan Absensi</h3>
        <p className="text-xs text-slate-500 mt-2 leading-relaxed">
          Semua data kegiatan bersifat dinamis dan tersimpan di database. Silakan klik tombol di bawah untuk menambahkan agenda kegiatan baru dan melihat rekapitulasi presensi pengurus.
        </p>
        <button
          type="button"
          onClick={onOpenTambahModal}
          className="mt-6 px-5 py-2.5 rounded-xl bg-[#00296E] hover:bg-[#001f54] text-white text-xs font-bold transition-all shadow-md inline-flex items-center gap-2 cursor-pointer active:scale-95"
        >
          <Plus className="w-4 h-4 text-sky-300" />
          <span>Tambah Kegiatan Baru</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* HEADER KONTROL (HANYA DITAMPILKAN DI LAYAR, DISEMBUNYIKAN SAAT PRINT PDF) */}
      <div className="no-print bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-200">
                Laporan & Arsip
              </span>
              <span className="text-xs text-slate-400">• Kabinet REKSABUDAYA</span>
            </div>
            <h2 className="text-lg sm:text-2xl font-black text-[#00296E] mt-1">
              Rekapitulasi Absensi Kegiatan Pengurus
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Lihat riwayat kehadiran setiap kegiatan dan cetak dokumen resmi ber-kop surat HIMASI ke format PDF.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Segmented Control Mode: Presensi Pengurus | Tabel Data Kegiatan | Lembar Kop Surat PDF */}
            <div className="flex items-center p-1 bg-slate-100 rounded-2xl border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setPreviewMode("table")}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  previewMode === "table"
                    ? "bg-white text-[#00296E] shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                title="Tampilkan tabel kehadiran pengurus untuk kegiatan terpilih"
              >
                <Users className="w-3.5 h-3.5 text-[#0094E0]" />
                <span>Presensi Pengurus</span>
              </button>

              <button
                type="button"
                onClick={() => setPreviewMode("kegiatan")}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  previewMode === "kegiatan"
                    ? "bg-white text-[#00296E] shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                title="Tampilkan tabel master seluruh agenda kegiatan untuk berbagai device"
              >
                <TableIcon className="w-3.5 h-3.5 text-[#0094E0]" />
                <span>Tabel Data Kegiatan ({kegiatanList.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setPreviewMode("pdf")}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  previewMode === "pdf"
                    ? "bg-white text-[#00296E] shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                title="Tampilkan lembar dokumen resmi ber-kop surat HIMASI"
              >
                <FileText className="w-3.5 h-3.5 text-[#0094E0]" />
                <span>Format Kop Surat</span>
              </button>
            </div>

            {/* Tombol Cetak PDF Resmi */}
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-[#00296E] hover:bg-[#001f54] text-white text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <Printer className="w-4 h-4 text-sky-300" />
              <span>Cetak / Unduh PDF</span>
            </button>
          </div>
        </div>

        {/* Filter Bar & Rincian Kegiatan Aktif (Hanya saat mode Presensi Pengurus atau Cetak PDF) */}
        {previewMode !== "kegiatan" && (
          <>
            {/* Filter Bar: Pemilihan Kegiatan, Divisi, dan Search */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-1">
              {/* Pemilihan Kegiatan & Tombol Tambah Kegiatan */}
              <div className="md:col-span-5">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Pilih Kegiatan:
                  </label>
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={onOpenTambahModal}
                      className="text-[11px] font-bold text-[#0094E0] hover:text-[#00296E] flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Tambah</span>
                    </button>
                    {onDeleteKegiatan && activeKegiatan && (
                      <button
                        type="button"
                        onClick={() => onDeleteKegiatan(activeKegiatan.id)}
                        className="text-[11px] font-bold text-rose-500 hover:text-rose-700 flex items-center gap-1 transition-colors cursor-pointer"
                        title={`Hapus kegiatan "${activeKegiatan.nama}"`}
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Hapus</span>
                      </button>
                    )}
                  </div>
                </div>
                <div className="relative">
                  <select
                    value={activeKegiatan.id}
                    onChange={(e) => {
                      const found = kegiatanList.find((k) => k.id === e.target.value);
                      if (found) onSelectKegiatan(found);
                    }}
                    className="w-full px-3 py-2 text-xs font-bold text-[#00296E] bg-slate-50 hover:bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00296E] cursor-pointer"
                  >
                    {kegiatanList.map((k) => (
                      <option key={k.id} value={k.id}>
                        {k.nama} • {formatTanggalIndo(k.tanggal)} ({k.jam})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Search Nama / NIM */}
              <div className="md:col-span-4">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Cari Nama / NIM:
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Cari pengurus..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 hover:bg-white focus:outline-none focus:ring-2 focus:ring-[#00296E]"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {/* Filter Divisi */}
              <div className="md:col-span-3">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Divisi:
                </label>
                <select
                  value={selectedDivisi}
                  onChange={(e) => setSelectedDivisi(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-bold text-slate-700 bg-slate-50 hover:bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00296E] cursor-pointer"
                >
                  <option value="SEMUA">Semua Divisi</option>
                  <option value="BPH">BPH</option>
                  <option value="MEDKOMINFO">Medkominfo</option>
                  <option value="HUMAS">Humas</option>
                  <option value="BISNIS KREATIF">Bisnis Kreatif</option>
                  <option value="PENASIHAT">Penasihat</option>
                </select>
              </div>
            </div>

            {/* Banner Rincian Kegiatan Aktif */}
            <div className="p-3.5 rounded-2xl bg-sky-50/70 border border-sky-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#00296E] text-white flex items-center justify-center shrink-0">
                  <Calendar className="w-4 h-4 text-sky-300" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-sky-700 uppercase tracking-wider block">
                    Kegiatan Terpilih
                  </span>
                  <p className="font-extrabold text-sm text-[#00296E]">
                    {activeKegiatan.nama}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-700">
                <span className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-sky-100 shadow-2xs">
                  <Calendar className="w-3.5 h-3.5 text-sky-600" />
                  <span>{formatTanggalIndo(activeKegiatan.tanggal)}</span>
                </span>
                <span className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-sky-100 shadow-2xs">
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                  <span>{activeKegiatan.jam}</span>
                </span>
                {onResetAllAbsensiLogs && totalPresensi > 0 && (
                  <button
                    type="button"
                    onClick={() => onResetAllAbsensiLogs(activeKegiatan.nama)}
                    className="flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 px-2.5 py-1 rounded-lg border border-amber-200 transition-colors cursor-pointer active:scale-95 text-xs font-semibold"
                    title={`Kosongkan presensi untuk "${activeKegiatan.nama}"`}
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset Presensi ({totalPresensi})</span>
                  </button>
                )}
                {onDeleteKegiatan && (
                  <button
                    type="button"
                    onClick={() => onDeleteKegiatan(activeKegiatan.id)}
                    className="flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 px-2.5 py-1 rounded-lg border border-rose-200 transition-colors cursor-pointer active:scale-95"
                    title={`Hapus kegiatan "${activeKegiatan.nama}"`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus Kegiatan</span>
                  </button>
                )}
              </div>
            </div>

            {/* Kartu Ringkasan Metrik Presensi Kegiatan Terpilih */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                <span className="text-[11px] font-semibold text-slate-500">Total Pengurus</span>
                <p className="text-xl font-black text-slate-900 mt-0.5">{totalPengurus} Orang</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200">
                <span className="text-[11px] font-bold text-emerald-700">Hadir Tepat Waktu</span>
                <p className="text-xl font-black text-emerald-800 mt-0.5">{countHadir} Orang</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200">
                <span className="text-[11px] font-bold text-amber-700">Terlambat</span>
                <p className="text-xl font-black text-amber-800 mt-0.5">{countTerlambat} Orang</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200">
                <span className="text-[11px] font-bold text-blue-700">Persentase Hadir</span>
                <p className="text-xl font-black text-[#00296E] mt-0.5">{persentase}%</p>
              </div>
            </div>
          </>
        )}

      </div>

      {/* VIEW: TABEL MASTER DATA KEGIATAN RESPONSIF (UNTUK DILIHAT DI BERBAGAI DEVICE) */}
      {previewMode === "kegiatan" && (
        <div className="no-print space-y-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            {/* Header Toolbar Tabel Kegiatan */}
            <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#00296E] bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-200">
                    Master Data Kegiatan
                  </span>
                  <span className="text-xs text-slate-400">• Tampilan Tabel Multi-Device</span>
                </div>
                <h3 className="text-base sm:text-xl font-black text-[#00296E] mt-1">
                  Tabel Agenda & Rekap Kegiatan ({kegiatanList.length})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Daftar seluruh agenda kegiatan himpunan yang dapat dipantau dari Laptop, Tablet, maupun Smartphone.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                {/* Search Bar Kegiatan */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Cari kegiatan / tanggal..."
                    value={searchKegiatanQuery}
                    onChange={(e) => setSearchKegiatanQuery(e.target.value)}
                    className="w-48 sm:w-64 pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 hover:bg-white focus:outline-none focus:ring-2 focus:ring-[#00296E]"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                </div>

                {/* Tombol Tambah Kegiatan Baru */}
                <button
                  type="button"
                  onClick={onOpenTambahModal}
                  className="px-4 py-2 rounded-xl bg-[#00296E] hover:bg-[#001f54] text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5 text-sky-300" />
                  <span>+ Tambah Kegiatan</span>
                </button>
              </div>
            </div>

            {/* TABEL FORMAT (DESKTOP & TABLET - SCROLL HORIZONTAL AMAN) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-3 px-4 w-12 text-center">No</th>
                    <th className="py-3 px-4 min-w-[200px]">Nama Agenda Kegiatan</th>
                    <th className="py-3 px-4 min-w-[150px]">Tanggal Pelaksanaan</th>
                    <th className="py-3 px-4 min-w-[120px]">Waktu / Jam</th>
                    <th className="py-3 px-4 text-center min-w-[140px]">Presensi Terdata</th>
                    <th className="py-3 px-4 text-center min-w-[120px]">Status</th>
                    <th className="py-3 px-4 text-right min-w-[150px]">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredKegiatanList.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-slate-400">
                        <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="font-semibold text-slate-600">Tidak ada agenda kegiatan ditemukan</p>
                        <p className="text-[11px] text-slate-400 mt-1">Coba kata kunci pencarian lain atau tambahkan kegiatan baru.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredKegiatanList.map((k, index) => {
                      const isActive = activeKegiatan?.id === k.id;
                      const logCount = logs.filter(
                        (l) => l.kegiatan.trim().toLowerCase() === k.nama.trim().toLowerCase()
                      ).length;

                      return (
                        <tr
                          key={k.id}
                          className={`transition-colors hover:bg-slate-50/80 ${
                            isActive ? "bg-sky-50/50" : ""
                          }`}
                        >
                          <td className="py-3.5 px-4 text-center font-mono text-slate-400 font-medium">
                            {index + 1}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-sky-100 text-[#00296E] flex items-center justify-center shrink-0">
                                <Calendar className="w-3.5 h-3.5 text-[#0094E0]" />
                              </div>
                              <span className="font-extrabold text-slate-900">{k.nama}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-slate-700">
                            {formatTanggalIndo(k.tanggal)}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-slate-600 font-medium">
                            {k.jam}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              {logCount} / {totalPengurus} Hadir
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                isActive
                                  ? "bg-sky-100 text-[#00296E] border border-sky-200 font-black"
                                  : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {isActive ? "Sedang Dipindai" : "Tersimpan"}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  onSelectKegiatan(k);
                                  setPreviewMode("table");
                                }}
                                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all shadow-2xs flex items-center gap-1 cursor-pointer active:scale-95 ${
                                  isActive
                                    ? "bg-[#00296E] text-white hover:bg-[#001f54]"
                                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                                }`}
                                title="Buka dan lihat presensi kegiatan ini"
                              >
                                <Eye className="w-3 h-3" />
                                <span>{isActive ? "Buka Rekap" : "Pilih"}</span>
                              </button>

                              {onDeleteKegiatan && (
                                <button
                                  type="button"
                                  onClick={() => onDeleteKegiatan(k.id)}
                                  className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                                  title={`Hapus agenda "${k.nama}"`}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* TABEL FORMAT KARTU RESPONSIF (UNTUK HP / SMARTPHONE LAYAR KECIL) */}
            <div className="md:hidden p-4 space-y-3 divide-y divide-slate-100">
              {filteredKegiatanList.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  Tidak ada agenda kegiatan ditemukan.
                </div>
              ) : (
                filteredKegiatanList.map((k) => {
                  const isActive = activeKegiatan?.id === k.id;
                  const logCount = logs.filter(
                    (l) => l.kegiatan.trim().toLowerCase() === k.nama.trim().toLowerCase()
                  ).length;

                  return (
                    <div
                      key={k.id}
                      className={`pt-3 first:pt-0 rounded-2xl p-4 border transition-all ${
                        isActive
                          ? "bg-sky-50/70 border-sky-200 shadow-2xs"
                          : "bg-white border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="overflow-hidden">
                          <h4 className="text-xs font-bold text-slate-900 truncate">
                            {k.nama}
                          </h4>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {formatTanggalIndo(k.tanggal)} • {k.jam}
                          </p>
                        </div>
                        {isActive ? (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-[#00296E] text-white uppercase shrink-0">
                            Aktif
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 text-slate-600 shrink-0">
                            Tersimpan
                          </span>
                        )}
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          {logCount} / {totalPengurus} Hadir
                        </span>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              onSelectKegiatan(k);
                              setPreviewMode("table");
                            }}
                            className="px-3 py-1.5 rounded-lg bg-[#00296E] text-white text-[11px] font-bold active:scale-95 shadow-2xs flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Buka Rekap</span>
                          </button>
                          {onDeleteKegiatan && (
                            <button
                              type="button"
                              onClick={() => onDeleteKegiatan(k.id)}
                              className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 cursor-pointer"
                              title={`Hapus ${k.nama}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

          </div>

          {/* Banner Informasi Sinkronisasi Multi-Device */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-50 via-blue-50 to-indigo-50 border border-sky-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#00296E] text-white flex items-center justify-center shrink-0">
                <TableIcon className="w-4 h-4 text-sky-300" />
              </div>
              <div>
                <h4 className="font-bold text-[#00296E]">
                  Aksesibilitas Multi-Device Aktif
                </h4>
                <p className="text-slate-600 text-[11px] mt-0.5">
                  Tabel ini menyesuaikan otomatis di smartphone, tablet, maupun PC. Data kegiatan tersinkronisasi otomatis dengan database PostgreSQL Supabase.
                </p>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* VIEW 1: TABEL INTERAKTIF DI DASHBOARD (MODE TABEL BIASA) */}
      {previewMode === "table" && (
        <div className="no-print bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-[#00296E]">
              Daftar Kehadiran: {activeKegiatan.nama}
            </h3>
            <span className="text-xs text-slate-400">
              Menampilkan {filteredList.length} pengurus
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4 w-12 text-center">No</th>
                  <th className="py-3 px-4">Pengurus</th>
                  <th className="py-3 px-4">NIM</th>
                  <th className="py-3 px-4">Divisi & Jabatan</th>
                  <th className="py-3 px-4">Waktu Presensi</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredList.map((item, index) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 text-center font-mono text-slate-400">
                      {index + 1}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                          <img
                            src={item.image}
                            alt={item.nama}
                            className="w-full h-full object-cover object-top"
                          />
                        </div>
                        <span className="font-bold text-slate-900">{item.nama}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-slate-600">{item.nim}</td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-[#00296E]">{item.jabatan}</span>
                      <span className="text-slate-400 text-[11px] block">{item.divisi}</span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-700">
                      {item.waktu !== "-" ? `${item.waktu} WIB` : "-"}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                            item.status === "Hadir"
                              ? "bg-emerald-100 text-emerald-800"
                              : item.status === "Terlambat"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {item.status}
                        </span>
                        {onDeleteAbsensiLog && item.status !== "Belum Hadir" && (
                          <button
                            type="button"
                            onClick={() => onDeleteAbsensiLog(item.nim, activeKegiatan.nama)}
                            className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title={`Reset / Hapus kehadiran ${item.nama}`}
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 2 & CETAK RESMI: LEMBAR DOKUMEN REKAP ABSENSI DENGAN KOP SURAT RESMI */}
      <div
        id="lembar-rekap-pdf"
        className={`${
          previewMode === "pdf" ? "block" : "hidden print:block"
        } bg-white text-black p-8 sm:p-12 max-w-[210mm] mx-auto rounded-2xl shadow-xl print:shadow-none print:p-0 print:m-0 print:max-w-none print:w-full border border-slate-200 print:border-none`}
      >
        {/* 1. KOP SURAT RESMI (GAMBAR DARI LAMPIRAN PENGGUNA) */}
        <div className="w-full pb-4 border-b-2 border-black mb-6">
          <img
            src="/kop-surat-himasi.png"
            alt="Kop Surat HIMASI ISB Atma Luhur"
            className="w-full h-auto object-contain select-none"
          />
        </div>

        {/* 2. JUDUL DOKUMEN */}
        <div className="text-center my-6">
          <h1 className="font-bold text-base sm:text-lg uppercase tracking-wider text-black">
            DAFTAR HADIR / REKAPITULASI PRESENSI PENGURUS
          </h1>
          <h2 className="font-bold text-sm text-black mt-0.5 uppercase tracking-wide">
            KABINET REKSABUDAYA • PERIODE 2026/2027
          </h2>
        </div>

        {/* 3. KETERANGAN ACARA / KEGIATAN */}
        <div className="mb-6 text-xs text-black border border-slate-400 p-3.5 rounded-md bg-slate-50/50 print:bg-transparent">
          <table className="w-full">
            <tbody>
              <tr>
                <td className="w-36 font-bold py-1">Nama Kegiatan</td>
                <td className="w-4">:</td>
                <td className="font-bold py-1">{activeKegiatan.nama}</td>
              </tr>
              <tr>
                <td className="font-bold py-1">Hari, Tanggal</td>
                <td>:</td>
                <td className="py-1">{formatTanggalIndo(activeKegiatan.tanggal)}</td>
              </tr>
              <tr>
                <td className="font-bold py-1">Waktu / Jam</td>
                <td>:</td>
                <td className="py-1">{activeKegiatan.jam}</td>
              </tr>
              <tr>
                <td className="font-bold py-1">Total Kehadiran</td>
                <td>:</td>
                <td className="py-1">
                  <strong>{totalPresensi}</strong> Pengurus Hadir ({countHadir} Tepat Waktu, {countTerlambat} Terlambat) dari total {totalPengurus} Pengurus ({persentase}%)
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 4. TABEL PRESENSI FORMAT RESMI */}
        <div className="mb-8">
          <table className="w-full text-xs border border-black border-collapse">
            <thead>
              <tr className="bg-slate-200/80 print:bg-slate-100 font-bold border-b border-black text-center text-[11px]">
                <th className="border border-black py-2.5 px-2 w-12 text-center">NO</th>
                <th className="border border-black py-2.5 px-3 w-32 text-center">NIM</th>
                <th className="border border-black py-2.5 px-4 text-left">NAMA LENGKAP PENGURUS</th>
                <th className="border border-black py-2.5 px-4 text-left w-64">DIVISI & JABATAN</th>
                <th className="border border-black py-2.5 px-3 w-36 text-center">STATUS KEHADIRAN</th>
              </tr>
            </thead>
            <tbody>
              {fullAttendanceList.map((item, idx) => (
                <tr key={item.id} className="border-b border-black">
                  <td className="border border-black py-2 px-2 text-center font-medium">
                    {idx + 1}
                  </td>
                  <td className="border border-black py-2 px-3 text-center font-mono">
                    {item.nim}
                  </td>
                  <td className="border border-black py-2 px-4 font-bold uppercase">
                    {item.nama}
                  </td>
                  <td className="border border-black py-2 px-4">
                    <span className="font-semibold block">{item.jabatan}</span>
                    <span className="text-[10px] text-slate-700 block">{item.divisi}</span>
                  </td>
                  <td className="border border-black py-2 px-3 text-center font-medium">
                    {item.status === "Hadir" && (
                      <span className="font-bold text-emerald-700">HADIR</span>
                    )}
                    {item.status === "Terlambat" && (
                      <span className="font-bold text-amber-700">TERLAMBAT</span>
                    )}
                    {item.status === "Belum Hadir" && (
                      <span className="text-slate-500 italic">Alpa/Belum</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
}
