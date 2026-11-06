"use client";

import { useState, useMemo } from "react";
import {
  Printer,
  Search,
  FileText,
  Plus,
  Trash2,
  Calendar,
  RotateCcw,
  Users,
} from "lucide-react";
import type { AbsensiRecord } from "@/components/absensi/admin-qr-scanner";
import { DAFTAR_PENGURUS_HIMASI, type PengurusMember } from "@/lib/data/pengurus";

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
  pengurusList?: PengurusMember[];
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
  pengurusList,
}: RekapAbsensiViewProps) {
  const [selectedDivisi, setSelectedDivisi] = useState<string>("SEMUA");
  const [searchQuery, setSearchQuery] = useState("");
  const [previewMode, setPreviewMode] = useState<"table" | "pdf">("table");

  const masterPengurus = pengurusList && pengurusList.length > 0 ? pengurusList : DAFTAR_PENGURUS_HIMASI;

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
    return masterPengurus.map((pengurus) => {
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
  }, [logsForKegiatan, masterPengurus]);

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
  const totalPengurus = masterPengurus.length;
  const persentase = totalPengurus > 0 ? Math.round((totalPresensi / totalPengurus) * 100) : 0;

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
      <div className="bg-white dark:bg-[#001438] rounded-none border border-[#00296E]/20 dark:border-white/10 p-8 sm:p-12 text-center max-w-xl mx-auto shadow-none">
        <div className="w-16 h-16 rounded-none bg-sky-50 dark:bg-white/5 text-[#00296E] dark:text-[#38BDF8] flex items-center justify-center mx-auto mb-4 border border-[#00296E]/15 dark:border-white/10">
          <Calendar className="w-8 h-8 text-[#0094E0] dark:text-[#38BDF8]" />
        </div>
        <h3 className="text-xl font-black text-[#00296E] dark:text-white uppercase tracking-tight">Belum Ada Kegiatan Absensi</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
          Semua data kegiatan bersifat dinamis dan tersimpan di database. Silakan klik tombol di bawah untuk menambahkan agenda kegiatan baru dan melihat rekapitulasi presensi pengurus.
        </p>
        <button
          type="button"
          onClick={onOpenTambahModal}
          className="mt-6 px-5 py-2.5 rounded-none bg-[#00296E] hover:bg-[#001f54] text-white text-xs font-bold transition-all shadow-none inline-flex items-center gap-2 cursor-pointer active:scale-95 uppercase tracking-wider"
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
      <div className="no-print bg-white dark:bg-[#001438] p-5 sm:p-6 rounded-none border border-[#00296E]/20 dark:border-white/10 shadow-none space-y-4">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#00296E]/15 dark:border-white/10">
          <div>
            <h2 className="text-lg sm:text-2xl font-black text-[#00296E] dark:text-white mt-1 uppercase tracking-tight">
              Rekapitulasi Absensi Kegiatan Pengurus
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Lihat riwayat kehadiran setiap kegiatan dan cetak dokumen resmi ber-kop surat HIMASI ke format PDF.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Segmented Control Mode: Presensi Pengurus | Lembar Kop Surat PDF */}
            <div className="flex items-center p-1 bg-slate-100 dark:bg-white/10 rounded-none border border-[#00296E]/15 dark:border-white/10 text-xs">
              <button
                type="button"
                onClick={() => setPreviewMode("table")}
                className={`px-3 py-1.5 rounded-none font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  previewMode === "table"
                    ? "bg-white dark:bg-[#001740] text-[#00296E] dark:text-white shadow-none"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
                title="Tampilkan tabel kehadiran pengurus untuk kegiatan terpilih"
              >
                <Users className="w-3.5 h-3.5 text-[#0094E0] dark:text-[#38BDF8]" />
                <span>Presensi Pengurus</span>
              </button>

              <button
                type="button"
                onClick={() => setPreviewMode("pdf")}
                className={`px-3 py-1.5 rounded-none font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  previewMode === "pdf"
                    ? "bg-white dark:bg-[#001740] text-[#00296E] dark:text-white shadow-none"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
                title="Tampilkan lembar dokumen resmi ber-kop surat HIMASI"
              >
                <FileText className="w-3.5 h-3.5 text-[#0094E0] dark:text-[#38BDF8]" />
                <span>Format Kop Surat</span>
              </button>
            </div>

            {/* Tombol Cetak PDF Resmi */}
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 rounded-none bg-[#00296E] hover:bg-[#001f54] text-white text-xs font-bold transition-all shadow-none flex items-center gap-2 cursor-pointer active:scale-95 uppercase tracking-wider"
            >
              <Printer className="w-4 h-4 text-sky-300" />
              <span>Cetak / Unduh PDF</span>
            </button>
          </div>
        </div>

        {/* Filter Bar: Pemilihan Kegiatan, Divisi, dan Search */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-1">
          {/* Pemilihan Kegiatan & Tombol Tambah/Hapus/Reset Kegiatan */}
          <div className="md:col-span-5">
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Pilih Kegiatan:
              </label>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={onOpenTambahModal}
                  className="text-[11px] font-bold text-[#0094E0] dark:text-[#38BDF8] hover:text-[#00296E] dark:hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Tambah</span>
                </button>
                {onDeleteKegiatan && activeKegiatan && (
                  <button
                    type="button"
                    onClick={() => onDeleteKegiatan(activeKegiatan.id)}
                    className="text-[11px] font-bold text-rose-500 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 flex items-center gap-1 transition-colors cursor-pointer"
                    title={`Hapus kegiatan "${activeKegiatan.nama}"`}
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Hapus</span>
                  </button>
                )}
                {onResetAllAbsensiLogs && totalPresensi > 0 && (
                  <button
                    type="button"
                    onClick={() => onResetAllAbsensiLogs(activeKegiatan.nama)}
                    className="text-[11px] font-bold text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-300 flex items-center gap-1 transition-colors cursor-pointer"
                    title={`Kosongkan presensi untuk "${activeKegiatan.nama}"`}
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset Presensi ({totalPresensi})</span>
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
                className="w-full px-3 py-2 text-xs font-bold text-[#00296E] dark:text-white bg-slate-50 dark:bg-[#001740] hover:bg-white dark:hover:bg-[#001f54] rounded-none border border-[#00296E]/20 dark:border-white/20 focus:outline-none focus:border-[#00296E] dark:focus:border-[#38BDF8] cursor-pointer"
              >
                {kegiatanList.map((k) => (
                  <option key={k.id} value={k.id} className="bg-white dark:bg-[#001740] text-slate-900 dark:text-white">
                    {k.nama} • {formatTanggalIndo(k.tanggal)} ({k.jam})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Search Nama / NIM */}
          <div className="md:col-span-4">
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              Cari Nama / NIM:
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Cari pengurus..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-xs rounded-none border border-[#00296E]/20 dark:border-white/20 bg-slate-50 dark:bg-[#001740] hover:bg-white dark:hover:bg-[#001a4d] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#00296E] dark:focus:border-[#38BDF8]"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {/* Filter Divisi */}
          <div className="md:col-span-3">
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              Divisi:
            </label>
            <select
              value={selectedDivisi}
              onChange={(e) => setSelectedDivisi(e.target.value)}
              className="w-full px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-[#001740] hover:bg-white dark:hover:bg-[#001f54] rounded-none border border-[#00296E]/20 dark:border-white/20 focus:outline-none focus:border-[#00296E] dark:focus:border-[#38BDF8] cursor-pointer"
            >
              <option value="SEMUA" className="bg-white dark:bg-[#001740] text-slate-900 dark:text-white">Semua Divisi</option>
              <option value="BPH" className="bg-white dark:bg-[#001740] text-slate-900 dark:text-white">BPH</option>
              <option value="MEDKOMINFO" className="bg-white dark:bg-[#001740] text-slate-900 dark:text-white">Medkominfo</option>
              <option value="HUMAS" className="bg-white dark:bg-[#001740] text-slate-900 dark:text-white">Humas</option>
              <option value="BISNIS KREATIF" className="bg-white dark:bg-[#001740] text-slate-900 dark:text-white">Bisnis Kreatif</option>
              <option value="PENASIHAT" className="bg-white dark:bg-[#001740] text-slate-900 dark:text-white">Penasihat</option>
            </select>
          </div>
        </div>

        {/* Kartu Ringkasan Metrik Presensi Kegiatan Terpilih */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3.5 rounded-none bg-slate-50/70 dark:bg-white/5 border border-[#00296E]/15 dark:border-white/10">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Pengurus</span>
            <p className="text-xl font-black text-slate-900 dark:text-white mt-0.5">{totalPengurus} Orang</p>
          </div>
          <div className="p-3.5 rounded-none bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-500/30">
            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-widest">Hadir Tepat Waktu</span>
            <p className="text-xl font-black text-emerald-800 dark:text-emerald-300 mt-0.5">{countHadir} Orang</p>
          </div>
          <div className="p-3.5 rounded-none bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-500/30">
            <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-widest">Terlambat</span>
            <p className="text-xl font-black text-amber-800 dark:text-amber-300 mt-0.5">{countTerlambat} Orang</p>
          </div>
          <div className="p-3.5 rounded-none bg-blue-50/70 dark:bg-sky-950/30 border border-blue-200 dark:border-sky-500/30">
            <span className="text-[10px] font-bold text-blue-700 dark:text-sky-400 uppercase tracking-widest">Persentase Hadir</span>
            <p className="text-xl font-black text-[#00296E] dark:text-[#38BDF8] mt-0.5">{persentase}%</p>
          </div>
        </div>

      </div>



      {/* VIEW 1: TABEL INTERAKTIF DI DASHBOARD (MODE TABEL BIASA) */}
      {previewMode === "table" && (
        <div className="no-print bg-white dark:bg-[#001438] rounded-none border border-[#00296E]/20 dark:border-white/10 overflow-hidden shadow-none">
          <div className="p-4 sm:p-5 border-b border-[#00296E]/15 dark:border-white/10 bg-[#FAFBFC] dark:bg-[#001233] flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-[#00296E] dark:text-white uppercase tracking-wider">
              Daftar Kehadiran: {activeKegiatan.nama}
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              Menampilkan {filteredList.length} pengurus
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#FAFBFC] dark:bg-[#001233] border-b border-[#00296E]/20 dark:border-white/10 text-[10px] font-bold uppercase tracking-wider text-[#00296E] dark:text-slate-200">
                  <th className="py-3 px-4 w-12 text-center">No</th>
                  <th className="py-3 px-4">Pengurus</th>
                  <th className="py-3 px-4">NIM</th>
                  <th className="py-3 px-4">Divisi &amp; Jabatan</th>
                  <th className="py-3 px-4">Waktu Presensi</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#00296E]/10 dark:divide-white/5 text-xs">
                {filteredList.map((item, index) => (
                  <tr key={item.id} className="hover:bg-[#00296E]/[0.02] dark:hover:bg-white/[0.03] transition-colors">
                    <td className="py-3 px-4 text-center font-mono text-slate-400">
                      {index + 1}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-none overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 border border-[#00296E]/15 dark:border-white/10">
                          <img
                            src={item.image}
                            alt={item.nama}
                            className="w-full h-full object-cover object-top"
                          />
                        </div>
                        <span className="font-bold text-slate-900 dark:text-white">{item.nama}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-slate-600 dark:text-slate-400">{item.nim}</td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-[#00296E] dark:text-[#38BDF8]">{item.jabatan}</span>
                      <span className="text-slate-400 dark:text-slate-500 text-[11px] block">{item.divisi}</span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-700 dark:text-slate-300">
                      {item.waktu !== "-" ? `${item.waktu} WIB` : "-"}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-none font-bold text-[10px] uppercase font-mono ${
                            item.status === "Hadir"
                              ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-600/40"
                              : item.status === "Terlambat"
                              ? "bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-600/40"
                              : "bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/10"
                          }`}
                        >
                          {item.status}
                        </span>
                        {onDeleteAbsensiLog && item.status !== "Belum Hadir" && (
                          <button
                            type="button"
                            onClick={() => onDeleteAbsensiLog(item.nim, activeKegiatan.nama)}
                            className="p-1 rounded-none text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
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
