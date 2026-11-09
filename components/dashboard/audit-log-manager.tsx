"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  MagnifyingGlass,
  ArrowsClockwise,
  Funnel,
  CheckCircle,
  WarningCircle,
  XCircle,
  Clock,
  User,
  ShieldCheck,
  Eye,
  X,
  CaretLeft,
  CaretRight,
  Pulse,
  Database,
  CalendarBlank,
  Broadcast,
  ListDashes,
} from "@phosphor-icons/react";
import type {
  AuditLogItem,
  AuditLogModul,
  AuditLogStatus,
} from "@/lib/types/audit-log";
import {
  AUDIT_LOG_MODULS,
  AUDIT_LOG_STATUSES,
  AUDIT_MODUL_LABELS,
  AUDIT_STATUS_LABELS,
  DEFAULT_AUDIT_LOGS,
} from "@/lib/types/audit-log";
import {
  getAuditLogs,
  subscribeToAuditLogs,
  isSupabaseConfigured,
} from "@/lib/supabase/audit-log";

export interface AuditLogManagerProps {
  currentUserRole?: string;
}

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  bph: "BPH (Pimpinan)",
  medkominfo: "Medkominfo",
  humas_biskraf: "HUMAS & BISKRAF",
};

const ROLE_BADGE_STYLES: Record<string, string> = {
  super_admin:
    "bg-purple-100 dark:bg-purple-950/50 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800/50",
  bph:
    "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50",
  medkominfo:
    "bg-sky-100 dark:bg-sky-950/50 text-[#00296E] dark:text-sky-300 border-sky-200 dark:border-sky-800/50",
  humas_biskraf:
    "bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/50",
};

function formatWaktuIndo(isoString: string): string {
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;
    return (
      new Intl.DateTimeFormat("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
        timeZone: "Asia/Jakarta",
      }).format(date) + " WIB"
    );
  } catch {
    return isoString;
  }
}

export default function AuditLogManager({ currentUserRole }: AuditLogManagerProps) {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedModul, setSelectedModul] = useState<AuditLogModul | "semua">("semua");
  const [selectedStatus, setSelectedStatus] = useState<AuditLogStatus | "semua">("semua");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedDetailLog, setSelectedDetailLog] = useState<AuditLogItem | null>(null);

  const ITEMS_PER_PAGE = 15;

  // 1. Memuat daftar log dari service layer
  const loadLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getAuditLogs();
      if (Array.isArray(data) && data.length > 0) {
        setLogs(data);
      } else {
        setLogs(DEFAULT_AUDIT_LOGS);
      }
    } catch (err) {
      console.warn("[AuditLogManager] Gagal mengambil log, menggunakan fallback:", err);
      setLogs(DEFAULT_AUDIT_LOGS);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 2. Realtime WebSocket subscription & sinkronisasi
  useEffect(() => {
    loadLogs();

    const configured = isSupabaseConfigured();
    setIsLiveConnected(configured);

    const unsubscribe = subscribeToAuditLogs((newLog: AuditLogItem) => {
      setIsLiveConnected(true);
      setLogs((prev) => {
        if (prev.some((item) => item.id === newLog.id)) return prev;
        return [newLog, ...prev];
      });
    });

    return () => {
      unsubscribe();
    };
  }, [loadLogs]);

  // Listener ESC key untuk menutup modal detail log
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && selectedDetailLog) {
        setSelectedDetailLog(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedDetailLog]);

  // 3. Reset ke halaman pertama saat filter berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedModul, selectedStatus]);

  // 4. Perhitungan statistik metrik
  const metrics = useMemo(() => {
    const total = logs.length;

    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    ).getTime();

    const todayCount = logs.filter(
      (item) => new Date(item.created_at).getTime() >= startOfToday
    ).length;

    const modulCounts: Record<string, number> = {};
    logs.forEach((item) => {
      modulCounts[item.modul] = (modulCounts[item.modul] || 0) + 1;
    });

    let topModulKey = "—";
    let maxModulCount = 0;
    Object.entries(modulCounts).forEach(([modul, count]) => {
      if (count > maxModulCount) {
        maxModulCount = count;
        topModulKey = modul;
      }
    });

    const topModulLabel =
      topModulKey !== "—"
        ? AUDIT_MODUL_LABELS[topModulKey as AuditLogModul] || topModulKey
        : "—";

    return {
      total,
      today: todayCount,
      topModul: topModulLabel,
      topModulCount: maxModulCount,
    };
  }, [logs]);

  // 5. Pemfilteran log
  const filteredLogs = useMemo(() => {
    return logs.filter((item) => {
      if (selectedModul !== "semua" && item.modul !== selectedModul) {
        return false;
      }

      if (selectedStatus !== "semua" && item.status !== selectedStatus) {
        return false;
      }

      if (searchQuery.trim().length > 0) {
        const query = searchQuery.toLowerCase().trim();
        const nama = (item.pengurus_nama || "").toLowerCase();
        const aksi = (item.aksi || "").toLowerCase();
        const modul = (item.modul || "").toLowerCase();
        const modulLabel = (AUDIT_MODUL_LABELS[item.modul] || "").toLowerCase();
        const role = (item.pengurus_role || "").toLowerCase();
        const roleLabel = ((ROLE_LABELS as Record<string, string>)[item.pengurus_role] || "").toLowerCase();
        const detail = (item.detail || "").toLowerCase();

        const match =
          nama.includes(query) ||
          aksi.includes(query) ||
          modul.includes(query) ||
          modulLabel.includes(query) ||
          role.includes(query) ||
          roleLabel.includes(query) ||
          detail.includes(query);

        if (!match) return false;
      }

      return true;
    });
  }, [logs, selectedModul, selectedStatus, searchQuery]);

  // 6. Logika paginasi (15 per halaman)
  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / ITEMS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, filteredLogs.length);
  const paginatedLogs = useMemo(() => {
    return filteredLogs.slice(startIndex, endIndex);
  }, [filteredLogs, startIndex, endIndex]);

  // Helper render status semantik
  const renderStatusBadge = (status: AuditLogStatus) => {
    switch (status) {
      case "berhasil":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono font-bold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 rounded-none">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" weight="regular" />
            <span>{AUDIT_STATUS_LABELS.berhasil}</span>
          </span>
        );
      case "peringatan":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono font-bold uppercase tracking-wider bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 rounded-none">
            <WarningCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" weight="regular" />
            <span>{AUDIT_STATUS_LABELS.peringatan}</span>
          </span>
        );
      case "gagal":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono font-bold uppercase tracking-wider bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 rounded-none">
            <XCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" weight="regular" />
            <span>{AUDIT_STATUS_LABELS.gagal}</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono font-bold uppercase tracking-wider bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/20 rounded-none">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* =================================================================== */}
      {/* 1. HEADER SECTION & REALTIME STATUS */}
      {/* =================================================================== */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-[#001438] p-5 sm:p-6 rounded-none border border-[#00296E]/20 dark:border-white/10 shadow-none">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#00296E] dark:text-[#38BDF8] uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4 text-[#0094E0] dark:text-[#38BDF8]" weight="regular" />
            <span>Audit Trail &amp; Integritas Data</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-[#00296E] dark:text-white uppercase tracking-tight">
            Audit Log Aktivitas
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Rekam jejak seluruh mutasi data, tindakan pengurus, dan riwayat operasional sistem HIMASI.
          </p>
        </div>

        <div className="flex items-center gap-3 self-stretch sm:self-auto">
          {/* Live Indicator Badge */}
          <div
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-none border text-xs font-mono font-semibold transition-colors ${
              isLiveConnected
                ? "border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300"
                : "border-slate-300 dark:border-white/10 bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400"
            }`}
          >
            <span className="relative flex h-2 w-2">
              {isLiveConnected && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              )}
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  isLiveConnected ? "bg-emerald-500" : "bg-slate-400"
                }`}
              ></span>
            </span>
            <Broadcast
              className={`w-3.5 h-3.5 ${
                isLiveConnected
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-slate-400"
              }`}
              weight="regular"
            />
            <span className="uppercase tracking-wider text-[11px]">
              {isLiveConnected ? "Live Realtime" : "Mode Offline / Standby"}
            </span>
          </div>

          {/* Tombol Refresh Manual */}
          <button
            type="button"
            onClick={loadLogs}
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-none text-xs font-bold bg-[#00296E] text-white hover:bg-[#001f54] transition-colors cursor-pointer shadow-none disabled:opacity-50 uppercase tracking-wider font-mono"
            title="Segarkan Log Aktivitas"
          >
            <ArrowsClockwise className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} weight="regular" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* =================================================================== */}
      {/* 2. GRID STATISTIK METRIK */}
      {/* =================================================================== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Metrik 1: Total Aktivitas */}
        <div className="bg-white dark:bg-[#001438] p-4 sm:p-5 border border-[#00296E]/20 dark:border-white/10 rounded-none shadow-none flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-mono uppercase tracking-wider font-bold">
              Total Aktivitas
            </span>
            <Database className="w-4 h-4 text-[#00296E] dark:text-[#38BDF8]" weight="regular" />
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 dark:text-white">
              {isLoading ? "—" : metrics.total}
            </span>
            <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
              seluruh riwayat terekam
            </span>
          </div>
        </div>

        {/* Metrik 2: Hari Ini */}
        <div className="bg-white dark:bg-[#001438] p-4 sm:p-5 border border-[#00296E]/20 dark:border-white/10 rounded-none shadow-none flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-mono uppercase tracking-wider font-bold">
              Hari Ini
            </span>
            <CalendarBlank className="w-4 h-4 text-[#0094E0] dark:text-[#38BDF8]" weight="regular" />
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-[#00296E] dark:text-[#38BDF8]">
              {isLoading ? "—" : metrics.today}
            </span>
            <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
              aktivitas sejak 00:00 WIB
            </span>
          </div>
        </div>

        {/* Metrik 3: Modul Teraktif */}
        <div className="bg-white dark:bg-[#001438] p-4 sm:p-5 border border-[#00296E]/20 dark:border-white/10 rounded-none shadow-none flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-mono uppercase tracking-wider font-bold">
              Modul Teraktif
            </span>
            <Pulse className="w-4 h-4 text-purple-600 dark:text-purple-400" weight="regular" />
          </div>
          <div className="mt-3">
            <span className="text-lg sm:text-xl font-bold font-mono text-slate-900 dark:text-white truncate block">
              {isLoading ? "—" : metrics.topModul}
            </span>
            <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
              {metrics.topModulCount > 0 ? `${metrics.topModulCount} mutasi terekam` : "belum ada mutasi"}
            </span>
          </div>
        </div>

        {/* Metrik 4: Status Realtime */}
        <div className="bg-white dark:bg-[#001438] p-4 sm:p-5 border border-[#00296E]/20 dark:border-white/10 rounded-none shadow-none flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-mono uppercase tracking-wider font-bold">
              Status Realtime
            </span>
            <Broadcast
              className={`w-4 h-4 ${
                isLiveConnected ? "text-emerald-500" : "text-slate-400"
              }`}
              weight="regular"
            />
          </div>
          <div className="mt-3">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                {isLiveConnected && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                )}
                <span
                  className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                    isLiveConnected ? "bg-emerald-500" : "bg-slate-400"
                  }`}
                ></span>
              </span>
              <span
                className={`text-lg sm:text-xl font-bold font-mono ${
                  isLiveConnected
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-slate-500 dark:text-slate-400"
                }`}
              >
                {isLiveConnected ? "Aktif Sinkron" : "Lokal / Standby"}
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
              {isLiveConnected
                ? "saluran postgres_changes siap"
                : "penyimpanan lokal aktif"}
            </span>
          </div>
        </div>
      </div>

      {/* =================================================================== */}
      {/* 3. TOOLBAR PENCARIAN & FILTER DROPDOWN */}
      {/* =================================================================== */}
      <div className="bg-white dark:bg-[#001438] p-3.5 sm:p-4 border border-[#00296E]/20 dark:border-white/10 rounded-none shadow-none flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Bar Input */}
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Cari nama pengurus, aksi, modul, peran, atau rincian..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-xs rounded-none border border-[#00296E]/20 dark:border-white/20 bg-white dark:bg-[#001740] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#00296E] dark:focus:border-[#38BDF8] font-mono"
          />
          <MagnifyingGlass className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" weight="regular" />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              title="Hapus pencarian"
            >
              <X className="w-3.5 h-3.5" weight="regular" />
            </button>
          )}
        </div>

        {/* Filter Dropdowns & Reset */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Dropdown Filter Modul */}
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-[#001740] px-2.5 py-1.5 border border-[#00296E]/20 dark:border-white/20 text-xs">
            <Funnel className="w-3.5 h-3.5 text-slate-400 shrink-0" weight="regular" />
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono hidden sm:inline">Modul:</span>
            <select
              value={selectedModul}
              onChange={(e) => setSelectedModul(e.target.value as AuditLogModul | "semua")}
              className="bg-transparent text-xs font-mono font-medium text-slate-800 dark:text-slate-100 outline-none cursor-pointer"
            >
              <option value="semua">Semua Modul</option>
              {AUDIT_LOG_MODULS.map((m) => (
                <option key={m} value={m}>
                  {AUDIT_MODUL_LABELS[m]}
                </option>
              ))}
            </select>
          </div>

          {/* Dropdown Filter Status */}
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-[#001740] px-2.5 py-1.5 border border-[#00296E]/20 dark:border-white/20 text-xs">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono hidden sm:inline">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as AuditLogStatus | "semua")}
              className="bg-transparent text-xs font-mono font-medium text-slate-800 dark:text-slate-100 outline-none cursor-pointer"
            >
              <option value="semua">Semua Status</option>
              {AUDIT_LOG_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {AUDIT_STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </div>

          {/* Tombol Bersihkan Filter jika aktif */}
          {(selectedModul !== "semua" || selectedStatus !== "semua" || searchQuery) && (
            <button
              type="button"
              onClick={() => {
                setSelectedModul("semua");
                setSelectedStatus("semua");
                setSearchQuery("");
              }}
              className="px-2.5 py-1.5 text-xs font-mono text-rose-600 hover:text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/20 cursor-pointer"
            >
              Reset Filter
            </button>
          )}
        </div>
      </div>

      {/* =================================================================== */}
      {/* 4. TABEL DATA SWISS HAIRLINE GRID */}
      {/* =================================================================== */}
      <div className="bg-white dark:bg-[#001438] border border-[#00296E]/20 dark:border-white/10 rounded-none shadow-none overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-[#001740] border-b border-[#00296E]/20 dark:border-white/10 font-mono text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="py-3 px-4 font-bold whitespace-nowrap">WAKTU</th>
                <th className="py-3 px-4 font-bold whitespace-nowrap">PENGURUS &amp; ROLE</th>
                <th className="py-3 px-4 font-bold whitespace-nowrap">MODUL</th>
                <th className="py-3 px-4 font-bold">AKSI RINGKAS</th>
                <th className="py-3 px-4 font-bold text-center whitespace-nowrap">STATUS</th>
                <th className="py-3 px-4 font-bold text-right whitespace-nowrap">DETAIL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#00296E]/10 dark:divide-white/5">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-14 text-center text-slate-400 font-mono">
                    <ArrowsClockwise className="w-6 h-6 animate-spin mx-auto mb-2.5 text-[#0094E0]" weight="regular" />
                    Memuat catatan riwayat audit log aktivitas...
                  </td>
                </tr>
              ) : paginatedLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-14 text-center text-slate-400 font-mono">
                    <ListDashes className="w-6 h-6 mx-auto mb-2 text-slate-300 dark:text-slate-600" weight="regular" />
                    Tidak ada entri log yang sesuai dengan filter pencarian.
                  </td>
                </tr>
              ) : (
                paginatedLogs.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition-colors"
                  >
                    {/* WAKTU */}
                    <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" weight="regular" />
                        <span>{formatWaktuIndo(item.created_at)}</span>
                      </div>
                    </td>

                    {/* PENGURUS & ROLE */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" weight="regular" />
                          <span className="font-bold text-slate-900 dark:text-white">
                            {item.pengurus_nama}
                          </span>
                        </div>
                        <span
                          className={`inline-block px-1.5 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider border rounded-none self-start ${
                            ROLE_BADGE_STYLES[item.pengurus_role] ||
                            "bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10"
                          }`}
                        >
                          {ROLE_LABELS[item.pengurus_role] || item.pengurus_role}
                        </span>
                      </div>
                    </td>

                    {/* MODUL */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 text-[11px] font-mono font-medium bg-slate-100 dark:bg-white/10 text-[#00296E] dark:text-[#38BDF8] border border-[#00296E]/15 dark:border-white/15 rounded-none">
                        {AUDIT_MODUL_LABELS[item.modul] || item.modul}
                      </span>
                    </td>

                    {/* AKSI RINGKAS */}
                    <td className="py-3 px-4 max-w-md">
                      <p className="font-medium text-slate-800 dark:text-slate-200 line-clamp-2 leading-relaxed">
                        {item.aksi}
                      </p>
                      {item.detail && (
                        <p className="text-[11px] text-slate-400 dark:text-slate-400 truncate mt-0.5 font-mono">
                          {item.detail}
                        </p>
                      )}
                    </td>

                    {/* STATUS */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      {renderStatusBadge(item.status)}
                    </td>

                    {/* DETAIL */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setSelectedDetailLog(item)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-none text-xs font-semibold bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 text-[#00296E] dark:text-[#38BDF8] border border-[#00296E]/15 dark:border-white/10 transition-colors cursor-pointer font-mono"
                        title="Lihat Detail Entri"
                      >
                        <Eye className="w-3.5 h-3.5" weight="regular" />
                        <span>Detail</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* =================================================================== */}
        {/* 5. PAGINASI (15 BARIS PER HALAMAN) */}
        {/* =================================================================== */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-[#00296E]/20 dark:border-white/10 bg-slate-50/50 dark:bg-[#001740]/50 text-xs font-mono">
          <div className="text-slate-500 dark:text-slate-400">
            Menampilkan{" "}
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {filteredLogs.length === 0 ? 0 : startIndex + 1}
            </span>{" "}
            -{" "}
            <span className="font-bold text-slate-800 dark:text-slate-200">{endIndex}</span>{" "}
            dari{" "}
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {filteredLogs.length}
            </span>{" "}
            entri aktivitas
          </div>

          <div className="flex items-center gap-3">
            <span className="text-slate-500 dark:text-slate-400 text-xs">
              Halaman <span className="font-bold text-slate-800 dark:text-slate-200">{safeCurrentPage}</span> dari{" "}
              <span className="font-bold text-slate-800 dark:text-slate-200">{totalPages}</span>
            </span>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCurrentPage(Math.max(1, safeCurrentPage - 1))}
                disabled={safeCurrentPage <= 1}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-none border border-[#00296E]/20 dark:border-white/10 bg-white dark:bg-[#001438] text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer uppercase tracking-wider font-semibold text-[11px]"
              >
                <CaretLeft className="w-3.5 h-3.5" weight="regular" />
                <span>Sebelumnya</span>
              </button>

              <button
                type="button"
                onClick={() => setCurrentPage(Math.min(totalPages, safeCurrentPage + 1))}
                disabled={safeCurrentPage >= totalPages}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-none border border-[#00296E]/20 dark:border-white/10 bg-white dark:bg-[#001438] text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer uppercase tracking-wider font-semibold text-[11px]"
              >
                <span>Selanjutnya</span>
                <CaretRight className="w-3.5 h-3.5" weight="regular" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* =================================================================== */}
      {/* 6. MODAL POP-UP RINCIAN DETAIL AKTIVITAS */}
      {/* =================================================================== */}
      {selectedDetailLog && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedDetailLog(null);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-150"
        >
          <div className="bg-white dark:bg-[#001438] border border-[#00296E]/20 dark:border-white/10 w-full max-w-xl rounded-none shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#00296E]/20 dark:border-white/10 bg-slate-50 dark:bg-[#001740]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#0094E0] dark:text-[#38BDF8]" weight="regular" />
                <h3 className="text-sm sm:text-base font-bold text-[#00296E] dark:text-white uppercase tracking-tight">
                  Rincian Log Aktivitas
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDetailLog(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                title="Tutup Modal"
              >
                <X className="w-4 h-4" weight="regular" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 sm:p-6 space-y-4 overflow-y-auto font-sans text-xs sm:text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 p-3 bg-slate-50 dark:bg-[#001740] border border-[#00296E]/10 dark:border-white/5 font-mono text-xs">
                <div>
                  <span className="text-[10px] uppercase text-slate-400 block tracking-wider font-semibold">
                    ID Log
                  </span>
                  <span className="text-slate-900 dark:text-white break-all">
                    {selectedDetailLog.id}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-slate-400 block tracking-wider font-semibold">
                    Waktu Pencatatan
                  </span>
                  <span className="text-slate-900 dark:text-white">
                    {formatWaktuIndo(selectedDetailLog.created_at)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-slate-400 block tracking-wider font-semibold">
                    Pengurus Pelaksana
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {selectedDetailLog.pengurus_nama}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-slate-400 block tracking-wider font-semibold">
                    Peran / Wewenang
                  </span>
                  <span className="text-slate-900 dark:text-white">
                    {ROLE_LABELS[selectedDetailLog.pengurus_role] || selectedDetailLog.pengurus_role}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-slate-400 block tracking-wider font-semibold">
                    Modul Sistem
                  </span>
                  <span className="font-bold text-[#00296E] dark:text-[#38BDF8]">
                    {AUDIT_MODUL_LABELS[selectedDetailLog.modul] || selectedDetailLog.modul}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-slate-400 block tracking-wider font-semibold">
                    Status Eksekusi
                  </span>
                  <div className="mt-1">
                    {renderStatusBadge(selectedDetailLog.status)}
                  </div>
                </div>
              </div>

              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold block mb-1">
                  Ringkasan Tindakan
                </span>
                <p className="p-3 bg-slate-50 dark:bg-[#001740] border border-[#00296E]/15 dark:border-white/10 text-slate-900 dark:text-slate-100 font-medium leading-relaxed">
                  {selectedDetailLog.aksi}
                </p>
              </div>

              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold block mb-1">
                  Detail Teknis &amp; Catatan Mutasi
                </span>
                {selectedDetailLog.detail ? (
                  <pre className="p-3 bg-slate-900 text-emerald-400 border border-slate-800 rounded-none font-mono text-[11px] whitespace-pre-wrap break-words leading-relaxed overflow-x-auto">
                    {selectedDetailLog.detail}
                  </pre>
                ) : (
                  <p className="p-3 bg-slate-50 dark:bg-[#001740] border border-dashed border-slate-300 dark:border-white/15 text-slate-400 italic">
                    Tidak ada rincian payload tambahan untuk aktivitas ini.
                  </p>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[#00296E]/20 dark:border-white/10 bg-slate-50 dark:bg-[#001740] flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedDetailLog(null)}
                className="px-4 py-2 rounded-none text-xs font-bold bg-[#00296E] text-white hover:bg-[#001f54] transition-colors cursor-pointer uppercase tracking-wider font-mono shadow-none"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
