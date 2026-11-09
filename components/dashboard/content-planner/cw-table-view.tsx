"use client";

import { useState, useMemo, useEffect } from "react";
import {
  CalendarBlank,
  Clock,
  CheckCircle,
  WarningCircle,
  ArrowSquareOut,
  Plus,
  CaretDown,
  Check,
  NotePencil,
  Trash,
  X,
  Sparkle,
  Stack,
  CaretLeft,
  CaretRight,
} from "@phosphor-icons/react";
import {
  type ContentPlanItem,
  type ContentPlanInput,
  type PlatformKonten,
  type JenisKonten,
  type FormatKonten,
  type StatusKonten,
  PLATFORM_OPTIONS,
  JENIS_KONTEN_OPTIONS,
  FORMAT_KONTEN_OPTIONS,
  STATUS_OPTIONS,
  JENIS_KONTEN_STYLES,
  FORMAT_KONTEN_STYLES,
  STATUS_STYLES,
  getProgressForStatus,
  getStatusForProgress,
} from "@/lib/types/content-planner";
import {
  getCalendarWeekDetailsForMonth,
  formatDayOfWeek,
  formatDateToYYYYMMDD,
  getCalendarWeekNumber,
} from "@/lib/utils/calendar-week";
import { type UserRole } from "@/lib/types/auth";

export interface CwTableViewProps {
  plans: ContentPlanItem[];
  selectedYear: number;
  selectedMonth: number; // 1-12
  selectedCw?: number;
  onSelectCw?: (cw: number) => void;
  currentUserRole?: UserRole;
  onEdit: (item: ContentPlanItem) => void;
  onDelete: (id: string) => void;
  onToggleDone: (id: string, isDone: boolean) => void;
  onQuickUpdate: (id: string, updates: Partial<ContentPlanInput>) => void;
  onAddForDate: (dateStr: string) => void;
}

export function CwTableView({
  plans,
  selectedYear,
  selectedMonth,
  selectedCw,
  onSelectCw,
  currentUserRole = "medkominfo",
  onEdit,
  onDelete,
  onToggleDone,
  onQuickUpdate,
  onAddForDate,
}: CwTableViewProps) {
  const canManage =
    currentUserRole === "super_admin" ||
    currentUserRole === "bph" ||
    currentUserRole === "medkominfo" ||
    currentUserRole === "humas_biskraf" ||
    true;

  // State Inline Edit Topik
  const [editingTopicId, setEditingTopicId] = useState<string | null>(null);
  const [editingTopicValue, setEditingTopicValue] = useState<string>("");

  // Interface Popover Mengambang di Luar Tabel
  interface ActivePopoverInfo {
    id: string;
    field: "platform" | "jenis" | "tipe" | "status" | "progress";
    rect: {
      top: number;
      bottom: number;
      left: number;
      right: number;
      width: number;
    };
  }

  // State Quick Dropdown Popover
  const [activePopover, setActivePopover] = useState<ActivePopoverInfo | null>(null);

  // Rencana konten yang sedang aktif dibuka di popover
  const activePopoverItem = useMemo(() => {
    if (!activePopover) return null;
    return plans.find((p) => p.id === activePopover.id) || null;
  }, [activePopover, plans]);

  // Tutup popover saat klik di luar, scroll halaman/tabel, atau resize layar
  useEffect(() => {
    function handleDismiss() {
      setActivePopover(null);
    }
    window.addEventListener("scroll", handleDismiss, true);
    window.addEventListener("resize", handleDismiss);
    return () => {
      window.removeEventListener("scroll", handleDismiss, true);
      window.removeEventListener("resize", handleDismiss);
    };
  }, []);

  // Handler Buka Popover Mengambang
  const handleOpenPopover = (
    e: React.MouseEvent<HTMLButtonElement>,
    id: string,
    field: "platform" | "jenis" | "tipe" | "status" | "progress"
  ) => {
    e.stopPropagation();
    if (activePopover?.id === id && activePopover?.field === field) {
      setActivePopover(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    setActivePopover({
      id,
      field,
      rect: {
        top: rect.top,
        bottom: rect.bottom,
        left: rect.left,
        right: rect.right,
        width: rect.width,
      },
    });
  };

  // Helper kalkulasi koordinat fixed popover agar presisi dan tidak pernah terpotong
  const getPopoverStyle = (
    rect: { top: number; bottom: number; left: number; right: number; width: number },
    menuWidth = 190,
    menuHeight = 230
  ) => {
    const viewportHeight = typeof window !== "undefined" ? window.innerHeight : 800;
    const viewportWidth = typeof window !== "undefined" ? window.innerWidth : 1200;

    let top = rect.bottom + 4;
    if (top + menuHeight > viewportHeight && rect.top > menuHeight + 10) {
      top = rect.top - menuHeight - 4;
    }

    let left = rect.left;
    if (left + menuWidth > viewportWidth - 12) {
      left = viewportWidth - menuWidth - 12;
    }
    if (left < 12) left = 12;

    return {
      top: `${Math.round(top)}px`,
      left: `${Math.round(left)}px`,
      minWidth: `${menuWidth}px`,
    };
  };

  // Rincian Calendar Week (CW) yang menyentuh bulan terpilih
  const monthWeekDetails = useMemo(() => {
    return getCalendarWeekDetailsForMonth(selectedYear, selectedMonth - 1);
  }, [selectedYear, selectedMonth]);

  // Nomor CW aktif: jika tidak ada di prop, default ke CW pertama bulan atau minggu berjalan
  const activeCw = useMemo(() => {
    if (selectedCw && monthWeekDetails.some((w) => w.cw === selectedCw)) {
      return selectedCw;
    }
    return monthWeekDetails[0]?.cw ?? 1;
  }, [selectedCw, monthWeekDetails]);

  // Detail CW yang aktif dan sedang dirender tunggal
  const activeWeekDetail = useMemo(() => {
    return monthWeekDetails.find((w) => w.cw === activeCw) || monthWeekDetails[0];
  }, [monthWeekDetails, activeCw]);

  // Indeks minggu saat ini dalam bulan
  const currentWeekIndex = useMemo(() => {
    return monthWeekDetails.findIndex((w) => w.cw === activeWeekDetail?.cw);
  }, [monthWeekDetails, activeWeekDetail]);

  // Nama-nama bulan Indonesia
  const NAMA_BULAN = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];

  // Helper pewarnaan bar progres
  const getProgressVisual = (progress: number) => {
    if (progress <= 25) {
      return {
        barBg: "bg-red-500",
        textClass: "text-red-500 dark:text-red-400",
      };
    } else if (progress <= 50) {
      return {
        barBg: "bg-orange-500",
        textClass: "text-orange-500 dark:text-orange-400",
      };
    } else if (progress <= 75) {
      return {
        barBg: "bg-amber-400",
        textClass: "text-amber-500 dark:text-amber-400",
      };
    } else {
      return {
        barBg: "bg-emerald-500",
        textClass: "text-emerald-600 dark:text-emerald-400",
      };
    }
  };

  // Statistik Konten untuk Bulan Terpilih
  const monthStats = useMemo(() => {
    const total = plans.length;
    const done = plans.filter((p) => p.is_done).length;
    const review = plans.filter((p) => p.status === "Review" || p.status === "Revisi").length;
    const planning = plans.filter((p) => p.status === "Planning" || p.status === "On Proses").length;
    const avgProgress =
      total > 0 ? Math.round(plans.reduce((acc, cur) => acc + cur.progress, 0) / total) : 0;
    return { total, done, review, planning, avgProgress };
  }, [plans]);

  // Handler Inline Edit Topik
  const handleStartEditTopic = (item: ContentPlanItem) => {
    if (!canManage) return;
    setEditingTopicId(item.id);
    setEditingTopicValue(item.topik);
  };

  const handleSaveTopic = (id: string) => {
    if (editingTopicValue.trim()) {
      onQuickUpdate(id, { topik: editingTopicValue.trim() });
    }
    setEditingTopicId(null);
  };

  // Mini Kalender Matriks Generator untuk Sidebar
  const miniCalendarMatrix = useMemo(() => {
    const currentActualDateStr = formatDateToYYYYMMDD(new Date());
    return monthWeekDetails.map((week) => {
      const daysInfo = week.days.map((d) => {
        const dStr = formatDateToYYYYMMDD(d);
        const isCurrentMonth = d.getMonth() === selectedMonth - 1;
        const hasPlans = plans.some((p) => p.tanggal === dStr);
        const isToday = dStr === currentActualDateStr;
        return {
          date: d,
          dateStr: dStr,
          dayNum: d.getDate(),
          isCurrentMonth,
          hasPlans,
          isToday,
        };
      });
      return { cw: week.cw, days: daysInfo };
    });
  }, [selectedMonth, monthWeekDetails, plans]);

  if (!activeWeekDetail) {
    return null;
  }

  const cw = activeWeekDetail.cw;
  const daysInCw = activeWeekDetail.days;
  const startDateStr = formatDateToYYYYMMDD(daysInCw[0]);
  const endDateStr = formatDateToYYYYMMDD(daysInCw[6]);
  const weekPlans = plans.filter((p) => p.calendar_week === cw);
  const weekDoneCount = weekPlans.filter((p) => p.is_done).length;

  return (
    <div className="flex flex-col lg:flex-row gap-5 items-start">
      {/* ========================================================================= */}
      {/* 1. SIDEBAR: MINI KALENDER BULANAN PERSIS MOCKUP                           */}
      {/* ========================================================================= */}
      <aside className="w-full lg:w-72 shrink-0 bg-white dark:bg-[#001438] border border-[#00296E]/20 dark:border-[#00296E]/40 p-4 rounded-none shadow-none space-y-4 transition-colors">
        {/* Header Mini Kalender */}
        <div className="flex items-center justify-between border-b border-[#00296E]/15 dark:border-[#00296E]/30 pb-3">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 dark:text-slate-400 block font-semibold">
              Kalender Kerja Medkominfo
            </span>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-tight">
              {NAMA_BULAN[selectedMonth - 1]} {selectedYear}
            </h3>
          </div>
          <span className="text-xs font-mono px-2 py-0.5 bg-slate-100 dark:bg-[#001740] border border-[#00296E]/20 dark:border-[#00296E]/50 text-[#00296E] dark:text-[#38BDF8] font-bold">
            {monthWeekDetails.length} CW
          </span>
        </div>

        {/* Petunjuk Pemilihan CW */}
        <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 leading-tight">
          Pilih minggu di bawah untuk menampilkan lembar kerja CW terkait:
        </p>

        {/* Mini Calendar Grid Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-center border-collapse">
            <thead>
              <tr className="border-b border-[#00296E]/15 dark:border-[#00296E]/30 text-[10px] font-mono text-slate-500 dark:text-slate-400">
                <th className="py-1 px-1 text-left text-[#00296E] dark:text-[#38BDF8] font-bold">CW</th>
                <th className="py-1 px-1">S</th>
                <th className="py-1 px-1">M</th>
                <th className="py-1 px-1">T</th>
                <th className="py-1 px-1">W</th>
                <th className="py-1 px-1">T</th>
                <th className="py-1 px-1">F</th>
                <th className="py-1 px-1">S</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#00296E]/20 text-[11px] font-mono">
              {miniCalendarMatrix.map((row) => {
                const isSelected = row.cw === activeCw;
                return (
                  <tr
                    key={`mini-cw-${row.cw}`}
                    onClick={() => onSelectCw?.(row.cw)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-[#00296E]/15 dark:bg-[#00296E]/50 text-[#00296E] dark:text-[#38BDF8] font-bold border-l-4 border-[#00296E] dark:border-[#38BDF8]"
                        : "hover:bg-slate-100 dark:hover:bg-[#001740]/60 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    <td className="py-1 px-1.5 text-left font-bold text-[#00296E] dark:text-[#38BDF8] whitespace-nowrap">
                      CW {row.cw}
                    </td>
                    {row.days.map((day) => (
                      <td
                        key={day.dateStr}
                        className={`py-1 px-1 relative ${
                          day.isToday
                            ? "bg-[#00296E] text-white font-black"
                            : !day.isCurrentMonth
                            ? "text-slate-300 dark:text-slate-600"
                            : day.hasPlans
                            ? "text-emerald-600 dark:text-emerald-400 font-bold"
                            : "text-slate-700 dark:text-slate-300"
                        }`}
                        title={`${day.dateStr}${day.hasPlans ? " (Ada Konten)" : ""}${day.isToday ? " (Hari Ini)" : ""}`}
                      >
                        <span>{day.dayNum}</span>
                        {day.hasPlans && !day.isToday && (
                          <span className="block mx-auto w-1 h-1 bg-[#0094E0] dark:bg-[#38BDF8] rounded-full mt-0.5" />
                        )}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Ringkasan Statistik Bulan Berjalan */}
        <div className="pt-3 border-t border-[#00296E]/15 dark:border-[#00296E]/30 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">Total Rencana:</span>
            <span className="font-mono font-bold text-slate-900 dark:text-white">{monthStats.total} Konten</span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
              <CheckCircle className="w-3.5 h-3.5" /> Selesai (Publish):
            </span>
            <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300">{monthStats.done}</span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1 font-medium">
              <Clock className="w-3.5 h-3.5" /> Review / Revisi:
            </span>
            <span className="font-mono font-bold text-amber-700 dark:text-amber-300">{monthStats.review}</span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Sparkle className="w-3.5 h-3.5 text-slate-400" /> Planning / Proses:
            </span>
            <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{monthStats.planning}</span>
          </div>

          {/* Rata-rata Progres */}
          <div className="pt-2 border-t border-[#00296E]/15 dark:border-[#00296E]/20">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400 mb-1">
              <span>Rata-rata Progres:</span>
              <span className="font-bold text-slate-900 dark:text-white">{monthStats.avgProgress}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-200 dark:bg-[#001740] overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  getProgressVisual(monthStats.avgProgress).barBg
                }`}
                style={{ width: `${monthStats.avgProgress}%` }}
              />
            </div>
          </div>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* 2. TABEL MATRIKS CW MINGGUAN TUNGGAL (HANYA MINGGU TERPILIH)              */}
      {/* ========================================================================= */}
      <div className="flex-1 w-full space-y-6 overflow-hidden">
        <div className="bg-white dark:bg-[#001438] border border-[#00296E]/20 dark:border-[#00296E]/40 rounded-none shadow-none overflow-hidden transition-colors">
          {/* Header Blok CW dengan Tombol Navigasi Minggu */}
          <div className="p-3.5 sm:p-4 bg-slate-50 dark:bg-[#001740]/90 border-b border-[#00296E]/15 dark:border-[#00296E]/40 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 bg-[#00296E] text-white dark:bg-[#38BDF8] dark:text-[#001740] font-black font-mono text-xs tracking-wider rounded-none">
                CW {cw}
              </span>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono">
                  CALENDAR WEEK {cw}
                </h4>
                <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                  {startDateStr} s.d. {endDateStr}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Tombol Navigasi Prev/Next CW */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={currentWeekIndex <= 0}
                  onClick={() => onSelectCw?.(monthWeekDetails[currentWeekIndex - 1].cw)}
                  className="px-2 py-1 text-[11px] font-mono border border-slate-300 dark:border-[#00296E]/40 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#001740] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors flex items-center gap-1"
                  title="Minggu Sebelumnya"
                >
                  <CaretLeft className="w-3 h-3" />
                  <span>Prev CW</span>
                </button>
                <button
                  type="button"
                  disabled={currentWeekIndex >= monthWeekDetails.length - 1}
                  onClick={() => onSelectCw?.(monthWeekDetails[currentWeekIndex + 1].cw)}
                  className="px-2 py-1 text-[11px] font-mono border border-slate-300 dark:border-[#00296E]/40 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#001740] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors flex items-center gap-1"
                  title="Minggu Berikutnya"
                >
                  <span>Next CW</span>
                  <CaretRight className="w-3 h-3" />
                </button>
              </div>

              <span className="text-xs font-mono text-slate-700 dark:text-slate-300 px-2.5 py-1 bg-white dark:bg-[#001438] border border-[#00296E]/20 dark:border-[#00296E]/50">
                {weekPlans.length} Konten • {weekDoneCount} Selesai
              </span>
            </div>
          </div>

          {/* Matriks Tabel Responsif */}
          <div className="overflow-x-auto relative">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#00296E]/15 dark:border-[#00296E]/40 bg-slate-100/70 dark:bg-[#001740]/50 text-[10px] font-mono uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  <th className="py-2.5 px-3 w-12 text-center">CW</th>
                  <th className="py-2.5 px-3 w-32">DAY OF WEEK</th>
                  <th className="py-2.5 px-3 w-24">Platform</th>
                  <th className="py-2.5 px-3 w-32">Jenis Konten</th>
                  <th className="py-2.5 px-4 min-w-[240px]">Topik</th>
                  <th className="py-2.5 px-3 w-32">Tipe Konten</th>
                  <th className="py-2.5 px-3 w-28">Status</th>
                  <th className="py-2.5 px-2 w-14 text-center">Referensi</th>
                  <th className="py-2.5 px-3 w-36">Progress</th>
                  <th className="py-2.5 px-2 w-14 text-center">Done</th>
                  <th className="py-2.5 px-2 w-16 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#00296E]/20 text-slate-800 dark:text-slate-200">
                {daysInCw.map((dayDate) => {
                  const dayStr = formatDateToYYYYMMDD(dayDate);
                  const dayInfo = formatDayOfWeek(dayDate);
                  const dayPlans = plans.filter((p) => p.tanggal === dayStr);

                  // JIKA HARI MEMILIKI KONTEN
                  if (dayPlans.length > 0) {
                    return dayPlans.map((item, itemIdx) => {
                      const jenisStyle = JENIS_KONTEN_STYLES[item.tipe_konten] || JENIS_KONTEN_STYLES.Edukasi;
                      const formatStyle = FORMAT_KONTEN_STYLES[item.konsep] || FORMAT_KONTEN_STYLES.Feeds;
                      const statusStyle = STATUS_STYLES[item.status] || STATUS_STYLES.Planning;
                      const progVisual = getProgressVisual(item.progress);
                      const isFirstOfDay = itemIdx === 0;

                      return (
                        <tr
                          key={item.id}
                          className={`hover:bg-slate-50 dark:hover:bg-[#001c4d]/60 transition-colors ${
                            item.is_done ? "bg-slate-50/50 dark:bg-[#001740]/30 opacity-90" : ""
                          } ${
                            itemIdx === dayPlans.length - 1
                              ? "border-b border-[#00296E]/20 dark:border-[#00296E]/40"
                              : "border-b border-dashed border-slate-200 dark:border-[#00296E]/20"
                          }`}
                        >
                          {isFirstOfDay && (
                            <>
                              {/* Kolom CW (Merged dengan rowSpan jika hari memiliki lebih dari 1 konten) */}
                              <td
                                rowSpan={dayPlans.length}
                                className="py-2.5 px-3 text-center font-mono font-bold text-slate-400 dark:text-slate-500 border-r border-slate-100 dark:border-[#00296E]/20 align-top bg-slate-50/30 dark:bg-[#001740]/20"
                              >
                                {cw}
                              </td>

                              {/* Kolom DAY OF WEEK (Merged dengan rowSpan jika hari memiliki lebih dari 1 konten) */}
                              <td
                                rowSpan={dayPlans.length}
                                className="py-2.5 px-3 font-mono text-[11px] whitespace-nowrap border-r border-slate-100 dark:border-[#00296E]/20 align-top bg-slate-50/30 dark:bg-[#001740]/20"
                              >
                                <span className="font-bold text-slate-900 dark:text-white block">
                                  {dayInfo.dayName}
                                </span>
                                <span className="text-slate-500 dark:text-slate-400 text-[10px] block">
                                  {dayInfo.dayNumber} {NAMA_BULAN[dayDate.getMonth()].slice(0, 3)}
                                </span>

                                {/* Indikator jika ada lebih dari 1 konten di hari yang sama */}
                                {dayPlans.length > 1 && (
                                  <span className="inline-block mt-1 px-1.5 py-0.5 text-[9px] font-mono bg-[#00296E]/10 dark:bg-[#38BDF8]/15 text-[#00296E] dark:text-[#38BDF8] border border-[#00296E]/20 dark:border-[#38BDF8]/40 font-bold">
                                    {dayPlans.length} Konten
                                  </span>
                                )}

                                {/* Tombol Cepat Tambah Konten Tambahan pada Hari yang Sama */}
                                <button
                                  type="button"
                                  onClick={() => onAddForDate(dayStr)}
                                  className="mt-2 text-[10px] font-mono text-slate-500 dark:text-slate-400 hover:text-[#00296E] dark:hover:text-[#38BDF8] flex items-center gap-1 border border-dashed border-slate-300 dark:border-[#00296E]/40 px-1.5 py-0.5 hover:bg-white dark:hover:bg-[#001740] transition-colors cursor-pointer"
                                  title={`Tambah konten lain untuk hari ${dayInfo.dayName} (${dayInfo.dayNumber} ${NAMA_BULAN[dayDate.getMonth()].slice(0, 3)})`}
                                >
                                  <Plus className="w-2.5 h-2.5" />
                                  <span>+ Konten</span>
                                </button>
                              </td>
                            </>
                          )}

                          {/* Kolom Platform (Quick Dropdown) */}
                          <td className="py-2 px-2.5 border-r border-slate-100 dark:border-[#00296E]/20">
                            <button
                              type="button"
                              onClick={(e) => handleOpenPopover(e, item.id, "platform")}
                              className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono border border-slate-300 dark:border-[#00296E]/50 text-slate-800 dark:text-slate-200 bg-white dark:bg-[#001740] rounded-none hover:border-[#00296E] dark:hover:border-[#38BDF8] transition-colors cursor-pointer shadow-none"
                            >
                              <span>{item.platform}</span>
                              <CaretDown className="w-2.5 h-2.5 opacity-60" />
                            </button>
                          </td>

                          {/* Kolom Jenis Konten (Edukasi, PHB, Apresia-SI, Pemberitahuan) */}
                          <td className="py-2 px-3 border-r border-slate-100 dark:border-[#00296E]/20">
                            <button
                              type="button"
                              onClick={(e) => handleOpenPopover(e, item.id, "jenis")}
                              className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono border ${jenisStyle.className} rounded-none transition-colors cursor-pointer shadow-none`}
                            >
                              <span>{item.tipe_konten}</span>
                              <CaretDown className="w-2.5 h-2.5 opacity-60" />
                            </button>
                          </td>

                          {/* Kolom Topic (Inline Editable) */}
                          <td className="py-2 px-4 border-r border-slate-100 dark:border-[#00296E]/20">
                            {editingTopicId === item.id ? (
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="text"
                                  autoFocus
                                  value={editingTopicValue}
                                  onChange={(e) => setEditingTopicValue(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") handleSaveTopic(item.id);
                                    if (e.key === "Escape") setEditingTopicId(null);
                                  }}
                                  className="flex-1 bg-white dark:bg-[#001740] border border-[#00296E] dark:border-[#38BDF8] text-slate-900 dark:text-white px-2 py-1 text-xs rounded-none focus:outline-none"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleSaveTopic(item.id)}
                                  className="p-1 bg-[#00296E] text-white dark:bg-[#38BDF8] dark:text-[#001740] hover:opacity-90 cursor-pointer"
                                  title="Simpan Topik"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingTopicId(null)}
                                  className="p-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 cursor-pointer"
                                  title="Batal"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <div
                                onClick={() => handleStartEditTopic(item)}
                                className={`group flex items-center justify-between gap-2 cursor-pointer py-0.5 ${
                                  item.is_done ? "line-through text-slate-400 dark:text-slate-500" : "text-slate-800 dark:text-white"
                                }`}
                                title="Klik untuk mengedit topik secara langsung"
                              >
                                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                  {dayPlans.length > 1 && (
                                    <span className="shrink-0 px-1 py-0.2 text-[9px] font-mono bg-slate-100 dark:bg-[#001740] border border-slate-300 dark:border-[#00296E]/50 text-slate-500 dark:text-slate-400 font-bold">
                                      #{itemIdx + 1}
                                    </span>
                                  )}
                                  <span className="font-medium text-xs leading-snug line-clamp-2">
                                    {item.topik}
                                  </span>
                                </div>
                                <NotePencil className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                              </div>
                            )}
                          </td>

                          {/* Kolom Tipe Konten / Format (Feeds, Reels, Short Video, Story) */}
                          <td className="py-2 px-3 border-r border-slate-100 dark:border-[#00296E]/20">
                            <button
                              type="button"
                              onClick={(e) => handleOpenPopover(e, item.id, "tipe")}
                              className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono border ${formatStyle.className} rounded-none transition-colors cursor-pointer shadow-none`}
                            >
                              <span>{item.konsep}</span>
                              <CaretDown className="w-2.5 h-2.5 opacity-60" />
                            </button>
                          </td>

                          {/* Kolom Status (Planning, On Proses, Revisi, Review, Publish) */}
                          <td className="py-2 px-3 border-r border-slate-100 dark:border-[#00296E]/20">
                            <button
                              type="button"
                              onClick={(e) => handleOpenPopover(e, item.id, "status")}
                              className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-mono border ${statusStyle.className} rounded-none transition-colors cursor-pointer shadow-none`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
                              <span>{item.status}</span>
                              <CaretDown className="w-2.5 h-2.5 opacity-60" />
                            </button>
                          </td>

                          {/* Kolom Referensi */}
                          <td className="py-2 px-2 text-center border-r border-slate-100 dark:border-[#00296E]/20">
                            {item.referensi_url &&
                            (item.referensi_url.startsWith("http://") ||
                              item.referensi_url.startsWith("https://")) ? (
                              <a
                                href={item.referensi_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1 inline-flex items-center justify-center text-[#0094E0] dark:text-[#38BDF8] hover:text-[#00296E] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#00296E]/40 transition-colors"
                                title={item.referensi_url}
                              >
                                <ArrowSquareOut className="w-3.5 h-3.5" />
                              </a>
                            ) : (
                              <button
                                type="button"
                                onClick={() => onEdit(item)}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-[10px] font-mono cursor-pointer"
                                title="Tambah Tautan Referensi"
                              >
                                -
                              </button>
                            )}
                          </td>

                          {/* Kolom Progress Bar (Interactive with Popover) */}
                          <td className="py-2 px-3 border-r border-slate-100 dark:border-[#00296E]/20">
                            <button
                              type="button"
                              onClick={(e) => handleOpenPopover(e, item.id, "progress")}
                              className="w-full text-left group/prog cursor-pointer"
                              title="Klik untuk mengubah persentase progress secara realtime"
                            >
                              <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                                <span className={`font-bold ${progVisual.textClass}`}>{item.progress}%</span>
                                <CaretDown className="w-2.5 h-2.5 opacity-60 group-hover/prog:opacity-100 transition-opacity" />
                              </div>
                              <div className="w-full h-1.5 bg-slate-200 dark:bg-[#001740] border border-slate-300 dark:border-[#00296E] overflow-hidden">
                                <div
                                  className={`h-full transition-all duration-200 ${progVisual.barBg}`}
                                  style={{ width: `${item.progress}%` }}
                                />
                              </div>
                            </button>
                          </td>

                          {/* Kolom Done Checkbox */}
                          <td className="py-2 px-2 text-center border-r border-slate-100 dark:border-[#00296E]/20">
                            <input
                              type="checkbox"
                              checked={item.is_done}
                              onChange={(e) => onToggleDone(item.id, e.target.checked)}
                              className="w-4 h-4 rounded-none accent-emerald-600 dark:accent-[#22C55E] bg-white dark:bg-[#001740] border-slate-300 dark:border-[#00296E] cursor-pointer"
                              title={item.is_done ? "Sudah Tayang (Klik untuk kembalikan ke Review)" : "Tandai Selesai (100% Publish)"}
                            />
                          </td>

                          {/* Kolom Aksi */}
                          <td className="py-2 px-2 text-center whitespace-nowrap">
                            <div className="inline-flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => onEdit(item)}
                                className="p-1 text-slate-400 hover:text-[#00296E] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#00296E]/30 rounded-none transition-colors cursor-pointer"
                                title="Edit Detail Konten"
                              >
                                <NotePencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => onDelete(item.id)}
                                className="p-1 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-none transition-colors cursor-pointer"
                                title="Hapus Rencana Konten"
                              >
                                <Trash className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    });
                  }

                  // JIKA HARI BELUM MEMILIKI KONTEN -> BARIS GARIS PUTUS-PUTUS (DASHED LINE)
                  return (
                    <tr
                      key={`empty-${dayStr}`}
                      className="border-b border-dashed border-slate-200 dark:border-[#00296E]/30 bg-slate-50/40 dark:bg-transparent hover:bg-slate-100/60 dark:hover:bg-[#001740]/40 transition-colors"
                    >
                      {/* Kolom CW */}
                      <td className="py-2 px-3 text-center font-mono text-slate-400 dark:text-slate-500 border-r border-dashed border-slate-200 dark:border-[#00296E]/30">
                        {cw}
                      </td>

                      {/* Kolom DAY OF WEEK */}
                      <td className="py-2 px-3 font-mono text-[11px] whitespace-nowrap border-r border-dashed border-slate-200 dark:border-[#00296E]/30">
                        <span className="font-semibold text-slate-600 dark:text-slate-400 block">
                          {dayInfo.dayName}
                        </span>
                        <span className="text-slate-400 dark:text-slate-500 text-[10px]">
                          {dayInfo.dayNumber} {NAMA_BULAN[dayDate.getMonth()].slice(0, 3)}
                        </span>
                      </td>

                      {/* Kolom Content (Span Kosong dengan Tombol Cepat Tambah) */}
                      <td colSpan={9} className="py-1.5 px-4 text-left">
                        <button
                          type="button"
                          onClick={() => onAddForDate(dayStr)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono text-slate-500 dark:text-slate-400 hover:text-[#00296E] dark:hover:text-[#38BDF8] border border-dashed border-slate-300 dark:border-[#00296E]/50 hover:border-[#00296E] dark:hover:border-[#38BDF8]/60 bg-white/50 dark:bg-transparent hover:bg-slate-100 dark:hover:bg-[#001740] rounded-none transition-all cursor-pointer"
                        >
                          <Plus className="w-3 h-3 text-[#0094E0] dark:text-[#38BDF8]" />
                          <span>+ Tambah Ide Konten ({dayInfo.dayName} {dayInfo.dayNumber})</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. FLOATING SOLID POPOVER (DI LUAR TABEL - TIDAK MEMBUAT TABEL MEMANJANG) */}
      {/* ========================================================================= */}
      {activePopover && activePopoverItem && (
        <div className="fixed inset-0 z-[9999] pointer-events-none">
          {/* Transparent Backdrop to dismiss */}
          <div
            className="fixed inset-0 bg-black/15 dark:bg-black/40 pointer-events-auto"
            onClick={() => setActivePopover(null)}
          />

          {/* Floating Solid Card */}
          <div
            data-popover="true"
            className="fixed pointer-events-auto bg-white dark:bg-[#001740] border-2 border-[#00296E] dark:border-[#38BDF8] shadow-2xl rounded-none p-1.5 animate-in fade-in zoom-in-95"
            style={getPopoverStyle(
              activePopover.rect,
              activePopover.field === "progress" ? 220 : 185,
              activePopover.field === "status" ? 220 : activePopover.field === "jenis" ? 190 : 180
            )}
          >
            {/* Header Popover */}
            <div className="px-2 py-1 bg-slate-100 dark:bg-[#00225e] border-b border-slate-200 dark:border-[#00296E] text-[10px] font-mono font-bold uppercase tracking-wider text-[#00296E] dark:text-[#38BDF8] mb-1.5 flex items-center justify-between">
              <span>
                {activePopover.field === "platform" && "PILIH PLATFORM"}
                {activePopover.field === "jenis" && "PILIH JENIS KONTEN"}
                {activePopover.field === "tipe" && "PILIH TIPE KONTEN"}
                {activePopover.field === "status" && "PILIH STATUS"}
                {activePopover.field === "progress" && "UPDATE PROGRESS"}
              </span>
              <button
                type="button"
                onClick={() => setActivePopover(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-0.5 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </div>

            {/* Field: Platform */}
            {activePopover.field === "platform" && (
              <div className="space-y-1">
                {PLATFORM_OPTIONS.map((plat) => {
                  const isSelected = activePopoverItem.platform === plat;
                  return (
                    <button
                      key={plat}
                      type="button"
                      onClick={() => {
                        onQuickUpdate(activePopoverItem.id, { platform: plat });
                        setActivePopover(null);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 text-[11px] font-mono flex items-center justify-between cursor-pointer border transition-colors ${
                        isSelected
                          ? "bg-[#00296E] text-white dark:bg-[#38BDF8] dark:text-[#001740] font-bold border-[#00296E] dark:border-[#38BDF8]"
                          : "bg-white dark:bg-[#001c4d] text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-[#00296E] hover:text-[#00296E] dark:hover:text-white border-slate-200 dark:border-[#00296E]/50"
                      }`}
                    >
                      <span>{plat}</span>
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Field: Jenis Konten */}
            {activePopover.field === "jenis" && (
              <div className="space-y-1">
                {JENIS_KONTEN_OPTIONS.map((opt) => {
                  const isSelected = activePopoverItem.tipe_konten === opt;
                  const style = JENIS_KONTEN_STYLES[opt];
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => {
                        onQuickUpdate(activePopoverItem.id, { tipe_konten: opt });
                        setActivePopover(null);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 text-[11px] font-mono flex items-center justify-between cursor-pointer border transition-colors ${
                        isSelected
                          ? "bg-[#00296E] text-white dark:bg-[#38BDF8] dark:text-[#001740] font-bold border-[#00296E] dark:border-[#38BDF8]"
                          : "bg-white dark:bg-[#001c4d] text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-[#00296E] hover:text-[#00296E] dark:hover:text-white border-slate-200 dark:border-[#00296E]/50"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${style.dot}`} />
                        <span>{opt}</span>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Field: Tipe Konten (Format) */}
            {activePopover.field === "tipe" && (
              <div className="space-y-1">
                {FORMAT_KONTEN_OPTIONS.map((opt) => {
                  const isSelected = activePopoverItem.konsep === opt;
                  const style = FORMAT_KONTEN_STYLES[opt];
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => {
                        onQuickUpdate(activePopoverItem.id, { konsep: opt });
                        setActivePopover(null);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 text-[11px] font-mono flex items-center justify-between cursor-pointer border transition-colors ${
                        isSelected
                          ? "bg-[#00296E] text-white dark:bg-[#38BDF8] dark:text-[#001740] font-bold border-[#00296E] dark:border-[#38BDF8]"
                          : "bg-white dark:bg-[#001c4d] text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-[#00296E] hover:text-[#00296E] dark:hover:text-white border-slate-200 dark:border-[#00296E]/50"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${style.dot}`} />
                        <span>{opt}</span>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Field: Status */}
            {activePopover.field === "status" && (
              <div className="space-y-1">
                {STATUS_OPTIONS.map((opt) => {
                  const isSelected = activePopoverItem.status === opt;
                  const style = STATUS_STYLES[opt];
                  const prog = getProgressForStatus(opt);
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => {
                        const newProg = getProgressForStatus(opt);
                        onQuickUpdate(activePopoverItem.id, {
                          status: opt,
                          progress: newProg,
                          is_done: opt === "Publish",
                        });
                        setActivePopover(null);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 text-[11px] font-mono flex items-center justify-between cursor-pointer border transition-colors ${
                        isSelected
                          ? "bg-[#00296E] text-white dark:bg-[#38BDF8] dark:text-[#001740] font-bold border-[#00296E] dark:border-[#38BDF8]"
                          : "bg-white dark:bg-[#001c4d] text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-[#00296E] hover:text-[#00296E] dark:hover:text-white border-slate-200 dark:border-[#00296E]/50"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${style.dot}`} />
                        <span>{opt}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] font-mono ${isSelected ? "text-white dark:text-[#001740]" : "text-slate-500 dark:text-slate-400"}`}>
                          {prog}%
                        </span>
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Field: Progress */}
            {activePopover.field === "progress" && (
              <div className="p-1 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-700 dark:text-slate-300 font-semibold px-1">
                  <span>Status Otomatis:</span>
                  <span className="text-[#00296E] dark:text-[#38BDF8] font-bold">
                    {getStatusForProgress(activePopoverItem.progress)} ({activePopoverItem.progress}%)
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-1">
                  {[0, 25, 50, 75, 100].map((val) => {
                    const isSelected = activePopoverItem.progress === val;
                    return (
                      <button
                        key={val}
                        type="button"
                        onClick={() => {
                          const newStat = getStatusForProgress(val);
                          onQuickUpdate(activePopoverItem.id, {
                            progress: val,
                            status: newStat,
                            is_done: val === 100,
                          });
                          setActivePopover(null);
                        }}
                        className={`py-1.5 text-[11px] font-mono text-center border transition-all cursor-pointer font-bold ${
                          isSelected
                            ? "bg-[#00296E] text-white dark:bg-[#38BDF8] dark:text-[#001740] border-[#00296E] dark:border-[#38BDF8]"
                            : "bg-white dark:bg-[#001c4d] text-slate-800 dark:text-slate-200 border-slate-300 dark:border-[#00296E]/50 hover:bg-slate-100 dark:hover:bg-[#00296E]"
                        }`}
                      >
                        {val}%
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
