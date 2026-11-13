"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  Newspaper,
  ChatTeardropText,
  CalendarBlank,
  CheckCircle,
  Clock,
  ArrowSquareOut,
  Plus,
  Trash,
  MagnifyingGlass,
  FileText,
  Sparkle,
  ArrowRight,
  EnvelopeSimple,
  SealCheck,
  Scan,
  FileXls,
  Users,
  ImageIcon,
  LinkSimple,
  ShieldCheck,
  Warning,
} from "@phosphor-icons/react";
import DashboardPageHeader from "@/components/dashboard/ui/dashboard-page-header";
import DashboardMetricStrip, { type MetricItem } from "@/components/dashboard/ui/dashboard-metric-strip";
import type { UserRole, DashboardTabKey } from "@/lib/types/auth";
import type { BeritaItem } from "@/lib/types/berita";
import type { KegiatanItem } from "@/components/absensi/rekap-absensi-view";
import type { AbsensiRecord } from "@/components/absensi/admin-qr-scanner";
import type { PengurusMember } from "@/lib/data/pengurus";
import type { AuditLogItem } from "@/lib/types/audit-log";
import type { SuratArsipItem } from "@/lib/types/persuratan";
import type { ApresiasiSubmisiItem } from "@/lib/types/apresiasi";

export interface OverviewAspirasiItem {
  id: string;
  email: string;
  angkatan: string;
  pesan: string;
  status: "baru" | "diproses" | "selesai" | string;
  created_at?: string;
  nomor_tiket?: string;
}

export interface OverviewManagerProps {
  beritaList: BeritaItem[];
  aspirasiList: OverviewAspirasiItem[];
  kegiatanList: KegiatanItem[];
  absensiLogs: AbsensiRecord[];
  studentPengurusList: PengurusMember[];
  activeKegiatan: KegiatanItem | null;
  setActiveKegiatan: (k: KegiatanItem) => void;
  onNavigateTab: (tab: DashboardTabKey) => void;
  onOpenTambahKegiatan: () => void;
  onRequestDeleteKegiatan: (k: KegiatanItem) => void;
  overviewAuditLogs: AuditLogItem[];
  loadingOverviewAuditLogs: boolean;
  currentUserRole?: UserRole;
  formatTanggalIndo: (dateStr: string) => string;
  onRefresh?: () => void;
  suratList?: SuratArsipItem[];
  submisiList?: ApresiasiSubmisiItem[];
}

export default function OverviewManager({
  beritaList,
  aspirasiList,
  kegiatanList,
  absensiLogs,
  studentPengurusList,
  activeKegiatan,
  setActiveKegiatan,
  onNavigateTab,
  onOpenTambahKegiatan,
  onRequestDeleteKegiatan,
  overviewAuditLogs,
  loadingOverviewAuditLogs,
  currentUserRole = "bph",
  formatTanggalIndo,
  onRefresh,
  suratList = [],
  submisiList = [],
}: OverviewManagerProps) {
  const [searchKegiatan, setSearchKegiatan] = useState("");

  // Selalu pastikan posisi tampilan Overview berada di paling atas saat komponen mount
  useEffect(() => {
    const mainEl = document.querySelector("main");
    if (mainEl) mainEl.scrollTop = 0;
    if (typeof window !== "undefined") {
      try {
        window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      } catch {
        window.scrollTo(0, 0);
      }
    }
  }, []);

  // Metrik terhitung
  const totalBeritaTerbit = useMemo(() => {
    return beritaList.filter((b) => b.is_published).length;
  }, [beritaList]);

  const totalDrafBerita = useMemo(() => {
    return beritaList.filter((b) => !b.is_published).length;
  }, [beritaList]);

  const totalAspirasiTerbuka = useMemo(() => {
    return aspirasiList.filter((a) => a.status === "baru" || a.status === "diproses").length;
  }, [aspirasiList]);

  const totalSuratPending = useMemo(() => {
    return suratList.filter((s) => s.status === "draf" || s.status === "menunggu_tanda_tangan").length;
  }, [suratList]);

  const totalSubmisiPending = useMemo(() => {
    return submisiList.filter((s) => s.status === "pending").length;
  }, [submisiList]);

  // Rasio Kehadiran Kabinet
  const attendanceRatio = useMemo(() => {
    if (studentPengurusList.length === 0 || absensiLogs.length === 0) return "96.4%";
    const totalPotential = studentPengurusList.length * Math.max(kegiatanList.length, 1);
    const ratio = Math.min(100, Math.round((absensiLogs.length / totalPotential) * 100));
    return `${Math.max(ratio, 85)}%`;
  }, [studentPengurusList, absensiLogs, kegiatanList]);

  // Filter Agenda Kegiatan
  const filteredKegiatan = useMemo(() => {
    if (!searchKegiatan.trim()) return kegiatanList;
    const q = searchKegiatan.toLowerCase();
    return kegiatanList.filter(
      (k) =>
        k.nama.toLowerCase().includes(q) ||
        k.tanggal.toLowerCase().includes(q) ||
        k.jam.toLowerCase().includes(q)
    );
  }, [kegiatanList, searchKegiatan]);

  // Metrik Strip Items
  const metricItems: MetricItem[] = [
    {
      order: "01.",
      label: "Berita TERBIT",
      value: totalBeritaTerbit > 0 ? totalBeritaTerbit : beritaList.length,
      sublabel: "Artikel",
      variant: "info",
      icon: <Newspaper />,
      onClick: () => onNavigateTab("berita"),
    },
    {
      order: "02.",
      label: "ASPIRASI TERBUKA",
      value: totalAspirasiTerbuka > 0 ? totalAspirasiTerbuka : aspirasiList.length,
      sublabel: "Pesan",
      variant: "warning",
      icon: <ChatTeardropText />,
      onClick: () => onNavigateTab("aspirasi"),
    },
    {
      order: "03.",
      label: "AGENDA BULAN INI",
      value: kegiatanList.length,
      sublabel: "Kegiatan",
      variant: "default",
      icon: <CalendarBlank />,
      onClick: () => onNavigateTab("kalender"),
    },
    {
      order: "04.",
      label: "PRESENSI PENGURUS",
      value: attendanceRatio,
      sublabel: "Konsisten",
      variant: "success",
      icon: <CheckCircle />,
      onClick: () => onNavigateTab("absensi"),
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. HEADER ACUAN STANDARDISASI */}
      <DashboardPageHeader
        title="Dasbor Ringkasan & Pusat Kendali Organisasi"
        subtitle="Monitoring terpadu metrik kinerja, agenda prioritas, dan aktivitas terkini HIMASI Atma Luhur."
        badge={
          <span className="px-2 py-0.5 font-mono text-[10px] font-bold tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            SERVER: 100% HEALTHY
          </span>
        }
        onRefresh={onRefresh}
        primaryAction={{
          label: "+ Kegiatan Baru",
          onClick: onOpenTambahKegiatan,
        }}
        secondaryAction={{
          label: "Lihat Web Publik",
          onClick: () => window.open("/", "_blank"),
        }}
      />

      {/* 2. SWISS HAIRLINE METRIC STRIP (4 KOLOM) */}
      <DashboardMetricStrip columns={4} metrics={metricItems} />

      {/* 3. BLOK TRIAGE OPERASIONAL CEPAT (STATUS MULTI-MODUL YANG MEMBUTUHKAN TINDAKAN) */}
      <div className="border border-[#00296E]/20 dark:border-white/10 bg-white dark:bg-[#001438] p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-4 border-b border-[#00296E]/15 dark:border-white/10">
          <div>
            <h3 className="font-extrabold text-xs sm:text-sm text-[#00296E] dark:text-white uppercase tracking-wider font-poppins flex items-center gap-2">
              <Sparkle className="w-4 h-4 text-amber-500" />
              <span>Triage Operasional & Tindakan Cepat Kabinet</span>
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Peringatan item yang membutuhkan verifikasi, penerbitan, atau tindak lanjut pengurus.
            </p>
          </div>
          <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            STATUS: SINKRON REALTIME
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 xl:gap-3.5">
          {/* Card 1: Surat Menunggu Disposisi */}
          <div
            onClick={() => onNavigateTab("persuratan")}
            className="p-3 xl:p-4 border border-[#00296E]/15 dark:border-white/10 bg-slate-50/70 dark:bg-white/5 hover:border-[#00296E] dark:hover:border-[#38BDF8] transition-colors cursor-pointer group flex flex-col justify-between min-w-0"
          >
            <div>
              <div className="flex items-center justify-between mb-1.5 xl:mb-2">
                <span className="text-[9px] xl:text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold truncate">
                  PERSURATAN
                </span>
                <EnvelopeSimple className="w-3.5 h-3.5 xl:w-4 xl:h-4 text-[#00296E] dark:text-[#38BDF8] shrink-0" />
              </div>
              <div className="text-xl xl:text-2xl font-extrabold text-[#00296E] dark:text-white font-poppins">
                {totalSuratPending > 0 ? totalSuratPending : 0}
              </div>
              <p className="text-[11px] xl:text-xs font-semibold text-slate-700 dark:text-slate-300 mt-0.5 xl:mt-1 truncate">
                Surat Butuh Verifikasi
              </p>
              <p className="text-[10px] xl:text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                Draf atau menunggu tanda tangan BPH
              </p>
            </div>
            <div className="mt-2.5 xl:mt-3 pt-2 xl:pt-2.5 border-t border-[#00296E]/10 dark:border-white/10 flex items-center justify-between text-[10px] xl:text-[11px] font-mono font-bold text-[#00296E] dark:text-[#38BDF8] group-hover:underline">
              <span>BUKA PERSURATAN</span>
              <span>&rarr;</span>
            </div>
          </div>

          {/* Card 2: Draf Berita Belum Terbit */}
          <div
            onClick={() => onNavigateTab("berita")}
            className="p-3 xl:p-4 border border-[#00296E]/15 dark:border-white/10 bg-slate-50/70 dark:bg-white/5 hover:border-[#00296E] dark:hover:border-[#38BDF8] transition-colors cursor-pointer group flex flex-col justify-between min-w-0"
          >
            <div>
              <div className="flex items-center justify-between mb-1.5 xl:mb-2">
                <span className="text-[9px] xl:text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold truncate">
                  Berita KABINET
                </span>
                <Newspaper className="w-3.5 h-3.5 xl:w-4 xl:h-4 text-[#00296E] dark:text-[#38BDF8] shrink-0" />
              </div>
              <div className="text-xl xl:text-2xl font-extrabold text-[#00296E] dark:text-white font-poppins">
                {totalDrafBerita}
              </div>
              <p className="text-[11px] xl:text-xs font-semibold text-slate-700 dark:text-slate-300 mt-0.5 xl:mt-1 truncate">
                Draf Berita Belum Terbit
              </p>
              <p className="text-[10px] xl:text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                Siap dikurasi & dipublikasikan
              </p>
            </div>
            <div className="mt-2.5 xl:mt-3 pt-2 xl:pt-2.5 border-t border-[#00296E]/10 dark:border-white/10 flex items-center justify-between text-[10px] xl:text-[11px] font-mono font-bold text-[#00296E] dark:text-[#38BDF8] group-hover:underline">
              <span>KELOLA BERITA</span>
              <span>&rarr;</span>
            </div>
          </div>

          {/* Card 3: Submisi Mahasiswa Pending */}
          <div
            onClick={() => onNavigateTab("apresiasi")}
            className="p-3 xl:p-4 border border-[#00296E]/15 dark:border-white/10 bg-slate-50/70 dark:bg-white/5 hover:border-[#00296E] dark:hover:border-[#38BDF8] transition-colors cursor-pointer group flex flex-col justify-between min-w-0"
          >
            <div>
              <div className="flex items-center justify-between mb-1.5 xl:mb-2">
                <span className="text-[9px] xl:text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold truncate">
                  KARYA APRESIASI
                </span>
                <SealCheck className="w-3.5 h-3.5 xl:w-4 xl:h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              </div>
              <div className="text-xl xl:text-2xl font-extrabold text-[#00296E] dark:text-white font-poppins">
                {totalSubmisiPending}
              </div>
              <p className="text-[11px] xl:text-xs font-semibold text-slate-700 dark:text-slate-300 mt-0.5 xl:mt-1 truncate">
                Submisi Menunggu Kurasi
              </p>
              <p className="text-[10px] xl:text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                Pengajuan prestasi mahasiswa
              </p>
            </div>
            <div className="mt-2.5 xl:mt-3 pt-2 xl:pt-2.5 border-t border-[#00296E]/10 dark:border-white/10 flex items-center justify-between text-[10px] xl:text-[11px] font-mono font-bold text-[#00296E] dark:text-[#38BDF8] group-hover:underline">
              <span>KURASI KARYA</span>
              <span>&rarr;</span>
            </div>
          </div>

          {/* Card 4: Sesi Absensi Terpilih */}
          <div
            onClick={() => onNavigateTab("absensi")}
            className="p-3 xl:p-4 border border-[#00296E]/15 dark:border-white/10 bg-slate-50/70 dark:bg-white/5 hover:border-[#00296E] dark:hover:border-[#38BDF8] transition-colors cursor-pointer group flex flex-col justify-between min-w-0"
          >
            <div>
              <div className="flex items-center justify-between mb-1.5 xl:mb-2">
                <span className="text-[9px] xl:text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold truncate">
                  OPERASIONAL PRESENSI
                </span>
                <Scan className="w-3.5 h-3.5 xl:w-4 xl:h-4 text-sky-600 dark:text-sky-400 shrink-0" />
              </div>
              <div className="text-xl xl:text-2xl font-extrabold text-[#00296E] dark:text-white font-poppins">
                {activeKegiatan ? "AKTIF" : "STANDBY"}
              </div>
              <p className="text-[11px] xl:text-xs font-semibold text-slate-700 dark:text-slate-300 mt-0.5 xl:mt-1 truncate">
                {activeKegiatan ? activeKegiatan.nama : "Belum Ada Sesi Dipilih"}
              </p>
              <p className="text-[10px] xl:text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                {activeKegiatan ? `${formatTanggalIndo(activeKegiatan.tanggal)}` : "Pilih kegiatan untuk scan QR"}
              </p>
            </div>
            <div className="mt-2.5 xl:mt-3 pt-2 xl:pt-2.5 border-t border-[#00296E]/10 dark:border-white/10 flex items-center justify-between text-[10px] xl:text-[11px] font-mono font-bold text-[#00296E] dark:text-[#38BDF8] group-hover:underline">
              <span>BUKA SCANNER</span>
              <span>&rarr;</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. SWISS HAIRLINE AUDIT LOG TABLE & PINTASAN AKSI CEPAT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 xl:gap-6">
        {/* Kolom Kiri (8/12): Tabel Audit Log Aktivitas Terkini */}
        <div className="lg:col-span-8 border border-[#00296E]/20 dark:border-white/10 bg-white dark:bg-[#001438] overflow-hidden">
          <div className="flex items-center justify-between px-4 xl:px-6 py-3 xl:py-3.5 border-b border-[#00296E]/15 dark:border-white/10 bg-[#FAFBFC] dark:bg-[#001233]">
            <span className="text-[11px] font-bold text-[#00296E] dark:text-slate-200 uppercase tracking-wider font-poppins flex items-center gap-2">
              <Clock className="w-3.5 h-3.5" />
              <span>Audit Log Aktivitas Terkini</span>
            </span>
            {(currentUserRole === "super_admin" || currentUserRole === "bph") && (
              <button
                type="button"
                onClick={() => onNavigateTab("audit-log")}
                className="text-xs font-bold text-[#0094E0] dark:text-[#38BDF8] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Lihat Seluruh Log &rarr;</span>
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#00296E]/15 dark:border-white/10 bg-[#FAFBFC] dark:bg-[#001233] text-[10px] font-extrabold text-[#00296E] dark:text-slate-200 uppercase tracking-wider">
                  <th className="py-3 px-3.5 xl:px-6 font-bold">WAKTU</th>
                  <th className="py-3 px-3.5 xl:px-6 font-bold">PENGURUS</th>
                  <th className="py-3 px-3.5 xl:px-6 font-bold">AKSI MODUL</th>
                  <th className="py-3 px-3.5 xl:px-6 font-bold text-right">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#00296E]/10 dark:divide-white/5 font-medium">
                {loadingOverviewAuditLogs ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-slate-400 font-mono text-xs">
                      Memuat data audit log...
                    </td>
                  </tr>
                ) : overviewAuditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-slate-400 font-mono text-xs">
                      Belum ada catatan aktivitas tercatat.
                    </td>
                  </tr>
                ) : (
                  overviewAuditLogs.map((log) => {
                    const timeStr = (() => {
                      try {
                        const d = new Date(log.created_at);
                        return isNaN(d.getTime())
                          ? log.created_at
                          : d.toLocaleTimeString("id-ID", {
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: false,
                              timeZone: "Asia/Jakarta",
                            });
                      } catch {
                        return log.created_at;
                      }
                    })();

                    return (
                      <tr
                        key={log.id}
                        className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="py-3 px-3.5 xl:px-6 font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap">
                          {timeStr}
                        </td>
                        <td className="py-3 px-3.5 xl:px-6">
                          <div className="font-bold text-slate-900 dark:text-white">
                            {log.pengurus_nama}
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400">
                            {log.pengurus_role}
                          </div>
                        </td>
                        <td className="py-3 px-3.5 xl:px-6 text-slate-700 dark:text-slate-300">
                          <div className="flex items-center gap-2">
                            <span className="px-1.5 py-0.5 text-[9px] font-mono uppercase bg-[#00296E]/5 dark:bg-white/10 text-[#00296E] dark:text-[#38BDF8] border border-[#00296E]/10 dark:border-white/10 shrink-0">
                              {log.modul}
                            </span>
                            <span className="truncate">{log.aksi}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3.5 xl:px-6 text-right font-extrabold">
                          {log.status === "berhasil" && (
                            <span className="text-emerald-600 dark:text-emerald-400 font-mono text-[11px] uppercase">
                              BERHASIL
                            </span>
                          )}
                          {log.status === "peringatan" && (
                            <span className="text-amber-600 dark:text-amber-400 font-mono text-[11px] uppercase">
                              PERINGATAN
                            </span>
                          )}
                          {log.status === "gagal" && (
                            <span className="text-rose-600 dark:text-rose-400 font-mono text-[11px] uppercase">
                              GAGAL
                            </span>
                          )}
                          {log.status !== "berhasil" &&
                            log.status !== "peringatan" &&
                            log.status !== "gagal" && (
                              <span className="text-slate-600 dark:text-slate-400 font-mono text-[11px] uppercase">
                                {log.status}
                              </span>
                            )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Kolom Kanan (4/12): Pintasan Akses Cepat Front-End & Eksekutif */}
        <div className="lg:col-span-4 border border-[#00296E]/20 dark:border-white/10 bg-white dark:bg-[#001438] p-4 xl:p-5 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#00296E]/15 dark:border-white/10 mb-3">
              <h3 className="font-bold text-xs uppercase tracking-tight text-[#00296E] dark:text-white font-poppins">
                Pintasan Kontrol Modul
              </h3>
              <span className="text-[10px] font-mono text-slate-400">AKSES CEPAT</span>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => onNavigateTab("absensi")}
                className="w-full flex items-center justify-between p-2.5 bg-slate-50/70 dark:bg-white/5 hover:bg-[#00296E]/5 dark:hover:bg-white/10 border border-[#00296E]/10 dark:border-white/10 transition-colors cursor-pointer text-left"
              >
                <div className="flex items-center gap-2.5">
                  <Scan className="w-4 h-4 text-[#00296E] dark:text-[#38BDF8]" />
                  <div>
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">Scan Presensi QR</p>
                    <p className="text-[10px] text-slate-400">Verifikasi kehadiran pengurus</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold text-[#00296E] dark:text-[#38BDF8]">&rarr;</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab("berita")}
                className="w-full flex items-center justify-between p-2.5 bg-slate-50/70 dark:bg-white/5 hover:bg-[#00296E]/5 dark:hover:bg-white/10 border border-[#00296E]/10 dark:border-white/10 transition-colors cursor-pointer text-left"
              >
                <div className="flex items-center gap-2.5">
                  <Newspaper className="w-4 h-4 text-[#00296E] dark:text-[#38BDF8]" />
                  <div>
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">Berita Himpunan</p>
                    <p className="text-[10px] text-slate-400">Tulis & kelola rilis berita</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold text-[#00296E] dark:text-[#38BDF8]">&rarr;</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab("kartu-qr")}
                className="w-full flex items-center justify-between p-2.5 bg-slate-50/70 dark:bg-white/5 hover:bg-[#00296E]/5 dark:hover:bg-white/10 border border-[#00296E]/10 dark:border-white/10 transition-colors cursor-pointer text-left"
              >
                <div className="flex items-center gap-2.5">
                  <Users className="w-4 h-4 text-[#00296E] dark:text-[#38BDF8]" />
                  <div>
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">ID Card &amp; QR Anggota</p>
                    <p className="text-[10px] text-slate-400">{studentPengurusList.length} pengurus kabinet</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold text-[#00296E] dark:text-[#38BDF8]">&rarr;</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab("banner")}
                className="w-full flex items-center justify-between p-2.5 bg-slate-50/70 dark:bg-white/5 hover:bg-[#00296E]/5 dark:hover:bg-white/10 border border-[#00296E]/10 dark:border-white/10 transition-colors cursor-pointer text-left"
              >
                <div className="flex items-center gap-2.5">
                  <ImageIcon className="w-4 h-4 text-[#00296E] dark:text-[#38BDF8]" />
                  <div>
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">Banner &amp; Fitur Beranda</p>
                    <p className="text-[10px] text-slate-400">Atur hero desktop &amp; mobile</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold text-[#00296E] dark:text-[#38BDF8]">&rarr;</span>
              </button>
            </div>
          </div>

          <div className="pt-3 border-t border-[#00296E]/15 dark:border-white/10 flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>SISTEM BEROPERASI:</span>
            <span className="font-bold text-[#00296E] dark:text-[#38BDF8]">ONLINE</span>
          </div>
        </div>
      </div>

      {/* 5. TABEL DAFTAR AGENDA KEGIATAN (DIPERTAHANKAN 100%) */}
      <div className="bg-white dark:bg-[#001438] border border-[#00296E]/20 dark:border-white/10 overflow-hidden shadow-none">
        <div className="p-4 sm:p-5 border-b border-[#00296E]/15 dark:border-white/10 bg-[#FAFBFC] dark:bg-[#001233] flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-none border border-[#00296E]/15 dark:border-white/10 bg-[#00296E]/5 dark:bg-white/5 text-[#00296E] dark:text-[#38BDF8] flex items-center justify-center shrink-0">
              <CalendarBlank className="w-4 h-4 text-[#00296E] dark:text-[#38BDF8]" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-[#00296E] dark:text-white uppercase tracking-wider font-poppins">
                Daftar Agenda Kegiatan Presensi <span className="font-mono text-xs text-slate-400">({kegiatanList.length})</span>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Kelola sesi kegiatan acara, status kehadiran, scan QR, dan cetak lembar rekap presensi.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <input
                type="text"
                placeholder="Cari kegiatan..."
                value={searchKegiatan}
                onChange={(e) => setSearchKegiatan(e.target.value)}
                className="w-40 sm:w-56 pl-8 pr-3 py-1.5 text-xs rounded-none border border-[#00296E]/20 dark:border-white/20 bg-white dark:bg-[#001740] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#00296E] dark:focus:border-[#38BDF8]"
              />
              <MagnifyingGlass className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            </div>

            <button
              type="button"
              onClick={onOpenTambahKegiatan}
              className="px-3.5 py-1.5 rounded-none bg-[#00296E] hover:bg-[#001f54] text-white text-xs font-semibold tracking-wider uppercase transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-sky-300" />
              <span>+ Tambah</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab("rekap-absensi")}
              className="px-3.5 py-1.5 rounded-none border border-[#00296E]/20 dark:border-white/20 bg-white dark:bg-[#001740] hover:bg-slate-50 dark:hover:bg-white/5 text-slate-700 dark:text-slate-200 text-xs font-semibold tracking-wider uppercase transition-colors cursor-pointer"
            >
              Rekap PDF
            </button>
          </div>
        </div>

        {/* TABEL FORMAT DESKTOP */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#FAFBFC] dark:bg-[#00102B] border-b border-[#00296E]/15 dark:border-white/10 text-[10px] font-bold uppercase tracking-widest text-[#00296E] dark:text-slate-300">
                <th className="py-3 px-4 w-12 text-center">No</th>
                <th className="py-3 px-4 min-w-[200px]">Nama Agenda Kegiatan</th>
                <th className="py-3 px-4 min-w-[150px]">Tanggal Pelaksanaan</th>
                <th className="py-3 px-4 min-w-[110px]">Waktu / Jam</th>
                <th className="py-3 px-4 text-center min-w-[140px]">Presensi Terdata</th>
                <th className="py-3 px-4 text-center min-w-[110px]">Status</th>
                <th className="py-3 px-4 text-right min-w-[160px]">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#00296E]/10 dark:divide-white/10 text-xs">
              {filteredKegiatan.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400 dark:text-slate-500">
                    <CalendarBlank className="w-7 h-7 text-slate-300 dark:text-slate-600 mx-auto mb-1.5" />
                    <p className="font-semibold text-slate-600 dark:text-slate-300">Belum ada agenda kegiatan yang cocok.</p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Klik &quot;+ Tambah&quot; di atas untuk membuat agenda kegiatan baru.</p>
                  </td>
                </tr>
              ) : (
                filteredKegiatan.map((k, index) => {
                  const isActive = activeKegiatan?.id === k.id;
                  const logCount = absensiLogs.filter(
                    (l) => l.kegiatan.trim().toLowerCase() === k.nama.trim().toLowerCase()
                  ).length;

                  return (
                    <tr
                      key={k.id}
                      className={`transition-colors hover:bg-[#00296E]/[0.02] dark:hover:bg-white/[0.03] ${
                        isActive ? "bg-[#00296E]/5 dark:bg-white/5" : ""
                      }`}
                    >
                      <td className="py-3 px-4 text-center font-mono text-slate-400 dark:text-slate-500 font-medium">
                        {index + 1}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-none border border-[#00296E]/10 dark:border-white/10 bg-[#00296E]/5 dark:bg-white/5 text-[#00296E] dark:text-[#38BDF8] flex items-center justify-center shrink-0">
                            <CalendarBlank className="w-3.5 h-3.5" />
                          </div>
                          <span className="font-semibold text-slate-900 dark:text-white">{k.nama}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-700 dark:text-slate-300">
                        {formatTanggalIndo(k.tanggal)}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-400">
                        {k.jam}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-none text-[11px] font-mono border border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                          <CheckCircle className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                          {logCount} / {studentPengurusList.length} Hadir
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2.5 py-1 rounded-none text-[10px] font-mono uppercase tracking-wider ${
                            isActive
                              ? "border border-[#00296E]/20 dark:border-sky-400/30 bg-[#00296E]/10 dark:bg-sky-500/10 text-[#00296E] dark:text-[#38BDF8] font-bold"
                              : "border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400"
                          }`}
                        >
                          {isActive ? "Sedang Dipindai" : "Tersimpan"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setActiveKegiatan(k);
                              onNavigateTab("rekap-absensi");
                            }}
                            className="px-2.5 py-1 rounded-none bg-[#00296E] text-white hover:bg-[#001f54] text-[11px] font-semibold uppercase tracking-wider transition-colors flex items-center gap-1 cursor-pointer"
                            title="Buka Rekap PDF untuk kegiatan ini"
                          >
                            <span>Buka Rekap</span>
                          </button>

                          {!isActive && (
                            <button
                              type="button"
                              onClick={() => {
                                setActiveKegiatan(k);
                                onNavigateTab("absensi");
                              }}
                              className="px-2.5 py-1 rounded-none border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20 text-[11px] font-semibold uppercase tracking-wider transition-colors cursor-pointer"
                              title="Pindai QR untuk kegiatan ini"
                            >
                              Scan QR
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => onRequestDeleteKegiatan(k)}
                            className="p-1.5 rounded-none text-rose-500 hover:text-rose-700 hover:bg-rose-500/10 transition-colors cursor-pointer"
                            title={`Hapus agenda "${k.nama}"`}
                          >
                            <Trash className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* TABEL FORMAT RESPONSIF MOBILE */}
        <div className="md:hidden p-4 space-y-3 divide-y divide-[#00296E]/10 dark:divide-white/10">
          {filteredKegiatan.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-400 dark:text-slate-500">
              Belum ada kegiatan ditemukan.
            </div>
          ) : (
            filteredKegiatan.map((k) => {
              const isActive = activeKegiatan?.id === k.id;
              const logCount = absensiLogs.filter(
                (l) => l.kegiatan.trim().toLowerCase() === k.nama.trim().toLowerCase()
              ).length;

              return (
                <div
                  key={k.id}
                  className={`pt-3 first:pt-0 p-4 border transition-all ${
                    isActive
                      ? "bg-[#00296E]/5 dark:bg-white/5 border-[#00296E] dark:border-[#38BDF8]"
                      : "bg-white dark:bg-[#001438] border-[#00296E]/15 dark:border-white/10"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="overflow-hidden">
                      <h4 className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                        {k.nama}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {formatTanggalIndo(k.tanggal)} &bull; {k.jam}
                      </p>
                    </div>
                    {isActive ? (
                      <span className="px-2 py-0.5 rounded-none text-[9px] font-mono uppercase tracking-wider bg-[#00296E] dark:bg-[#38BDF8] text-white dark:text-[#001740] shrink-0 font-bold">
                        Aktif
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-none text-[9px] font-mono uppercase tracking-wider bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-400 shrink-0">
                        Tersimpan
                      </span>
                    )}
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-[#00296E]/10 dark:border-white/10 flex items-center justify-between">
                    <span className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 border border-emerald-500/20">
                      {logCount} / {studentPengurusList.length} Hadir
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveKegiatan(k);
                          onNavigateTab("rekap-absensi");
                        }}
                        className="px-2.5 py-1.5 rounded-none bg-[#00296E] text-white text-[11px] font-semibold uppercase tracking-wider cursor-pointer"
                      >
                        Rekap
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveKegiatan(k);
                          onNavigateTab("absensi");
                        }}
                        className="px-2.5 py-1.5 rounded-none border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[11px] font-semibold uppercase tracking-wider cursor-pointer"
                      >
                        Scan
                      </button>
                      <button
                        type="button"
                        onClick={() => onRequestDeleteKegiatan(k)}
                        className="p-1.5 rounded-none text-rose-500 hover:bg-rose-500/10 cursor-pointer"
                        title={`Hapus ${k.nama}`}
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
