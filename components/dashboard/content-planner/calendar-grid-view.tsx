"use client";

import { useMemo } from "react";
import { Plus, CheckCircle, CalendarBlank, Sparkle } from "@phosphor-icons/react";
import {
  type ContentPlanItem,
  type PlatformKonten,
  STATUS_STYLES,
  TIPE_KONTEN_STYLES,
} from "@/lib/types/content-planner";
import { formatDateToYYYYMMDD } from "@/lib/utils/calendar-week";
import { type UserRole } from "@/lib/types/auth";

export interface CalendarGridViewProps {
  plans: ContentPlanItem[];
  selectedYear: number;
  selectedMonth: number; // 1-12
  currentUserRole?: UserRole;
  onSelectContent: (item: ContentPlanItem) => void;
  onAddForDate: (dateStr: string) => void;
}

// Konfigurasi visual platform untuk badge kalender (light & dark mode)
const PLATFORM_BADGES: Record<
  PlatformKonten,
  { label: string; bg: string; text: string; border: string }
> = {
  TikTok: {
    label: "TikTok",
    bg: "bg-pink-50 dark:bg-pink-500/15",
    text: "text-pink-700 dark:text-pink-300",
    border: "border-pink-200 dark:border-pink-500/30",
  },
  Instagram: {
    label: "IG",
    bg: "bg-rose-50 dark:bg-rose-500/15",
    text: "text-rose-700 dark:text-rose-300",
    border: "border-rose-200 dark:border-rose-500/30",
  },
  YouTube: {
    label: "YT",
    bg: "bg-red-50 dark:bg-red-500/15",
    text: "text-red-700 dark:text-red-300",
    border: "border-red-200 dark:border-red-500/30",
  },
  Web: {
    label: "Web",
    bg: "bg-indigo-50 dark:bg-indigo-500/15",
    text: "text-indigo-700 dark:text-indigo-300",
    border: "border-indigo-200 dark:border-indigo-500/30",
  },
  Lainnya: {
    label: "Other",
    bg: "bg-slate-100 dark:bg-slate-500/15",
    text: "text-slate-700 dark:text-slate-300",
    border: "border-slate-200 dark:border-slate-500/30",
  },
};

export function CalendarGridView({
  plans,
  selectedYear,
  selectedMonth,
  currentUserRole = "medkominfo",
  onSelectContent,
  onAddForDate,
}: CalendarGridViewProps) {
  const canManage =
    currentUserRole === "super_admin" ||
    currentUserRole === "bph" ||
    currentUserRole === "medkominfo";

  const todayStr = useMemo(() => formatDateToYYYYMMDD(new Date()), []);

  // Header nama hari kalender (Sunday s.d. Saturday)
  const DAY_HEADERS = [
    { key: "SUN", label: "Sunday", short: "SUN" },
    { key: "MON", label: "Monday", short: "MON" },
    { key: "TUE", label: "Tuesday", short: "TUE" },
    { key: "WED", label: "Wednesday", short: "WED" },
    { key: "THU", label: "Thursday", short: "THU" },
    { key: "FRI", label: "Friday", short: "FRI" },
    { key: "SAT", label: "Saturday", short: "SAT" },
  ];

  // Hitung grid kalender 7 kolom
  const calendarCells = useMemo(() => {
    const firstDay = new Date(selectedYear, selectedMonth - 1, 1);
    const startingDayOfWeek = firstDay.getDay(); // 0 = Sunday
    const daysInCurrentMonth = new Date(selectedYear, selectedMonth, 0).getDate();
    const daysInPrevMonth = new Date(selectedYear, selectedMonth - 1, 0).getDate();

    const cells: {
      dateStr: string;
      dayNum: number;
      isCurrentMonth: boolean;
      isToday: boolean;
    }[] = [];

    // Hari-hari sisa bulan sebelumnya
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const dNum = daysInPrevMonth - i;
      const prevDate = new Date(selectedYear, selectedMonth - 2, dNum);
      const dStr = formatDateToYYYYMMDD(prevDate);
      cells.push({
        dateStr: dStr,
        dayNum: dNum,
        isCurrentMonth: false,
        isToday: dStr === todayStr,
      });
    }

    // Hari-hari bulan berjalan
    for (let d = 1; d <= daysInCurrentMonth; d++) {
      const currDate = new Date(selectedYear, selectedMonth - 1, d);
      const dStr = formatDateToYYYYMMDD(currDate);
      cells.push({
        dateStr: dStr,
        dayNum: d,
        isCurrentMonth: true,
        isToday: dStr === todayStr,
      });
    }

    // Hari-hari awal bulan berikutnya hingga kelipatan 7
    const remaining = (7 - (cells.length % 7)) % 7;
    for (let nextDay = 1; nextDay <= remaining; nextDay++) {
      const nextDate = new Date(selectedYear, selectedMonth, nextDay);
      const dStr = formatDateToYYYYMMDD(nextDate);
      cells.push({
        dateStr: dStr,
        dayNum: nextDay,
        isCurrentMonth: false,
        isToday: dStr === todayStr,
      });
    }

    return cells;
  }, [selectedYear, selectedMonth, todayStr]);

  // Petakan rencana konten ke tanggal (lookup map)
  const plansByDate = useMemo(() => {
    const map = new Map<string, ContentPlanItem[]>();
    plans.forEach((plan) => {
      const existing = map.get(plan.tanggal) || [];
      existing.push(plan);
      map.set(plan.tanggal, existing);
    });
    return map;
  }, [plans]);

  return (
    <div className="bg-white dark:bg-[#001438] border border-[#00296E]/20 dark:border-[#00296E]/40 rounded-none shadow-none overflow-hidden transition-colors">
      {/* 7-Kolom Header Baris Hari (Sunday to Saturday) */}
      <div className="grid grid-cols-7 border-b border-[#00296E]/15 dark:border-[#00296E]/40 bg-slate-50 dark:bg-[#001740]/80">
        {DAY_HEADERS.map((dh, idx) => (
          <div
            key={dh.key}
            className={`py-2.5 px-2 text-center font-mono text-xs uppercase tracking-wider ${
              idx === 0 || idx === 6
                ? "text-amber-600 dark:text-amber-400 font-bold"
                : "text-slate-600 dark:text-slate-300"
            } ${idx < 6 ? "border-r border-[#00296E]/10 dark:border-[#00296E]/30" : ""}`}
          >
            <span className="hidden sm:inline">{dh.label}</span>
            <span className="sm:hidden">{dh.short}</span>
          </div>
        ))}
      </div>

      {/* Grid Sel-Sel Kalender */}
      <div className="grid grid-cols-7 divide-y divide-slate-100 dark:divide-[#00296E]/20">
        {calendarCells.map((cell, idx) => {
          const dayPlans = plansByDate.get(cell.dateStr) || [];
          const isRightEdge = (idx + 1) % 7 === 0;

          return (
            <div
              key={cell.dateStr}
              className={`min-h-[125px] sm:min-h-[145px] p-2 flex flex-col justify-between transition-colors relative group ${
                isRightEdge ? "" : "border-r border-slate-100 dark:border-[#00296E]/20"
              } ${
                !cell.isCurrentMonth
                  ? "bg-slate-50/70 dark:bg-[#001230]/70 text-slate-400 dark:text-slate-600"
                  : cell.isToday
                  ? "bg-sky-50/70 dark:bg-[#001e52]/40"
                  : "bg-white dark:bg-[#001438] hover:bg-slate-50 dark:hover:bg-[#001740]/60"
              }`}
            >
              {/* Header Kotak Tanggal */}
              <div className="flex items-center justify-between gap-1 mb-1.5">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-xs font-mono font-bold ${
                      cell.isToday
                        ? "text-[#00296E] dark:text-[#38BDF8]"
                        : cell.isCurrentMonth
                        ? "text-slate-800 dark:text-slate-200"
                        : "text-slate-400 dark:text-slate-600"
                    }`}
                  >
                    {cell.dayNum}
                  </span>
                  {cell.isToday && (
                    <span className="px-1.5 py-0.2 bg-[#00296E] text-white dark:bg-[#38BDF8] dark:text-[#001740] font-black text-[9px] font-mono tracking-wider rounded-none uppercase">
                      HARI INI
                    </span>
                  )}
                </div>

                {/* Tombol Mini Tambah Rencana Konten di Tanggal Ini */}
                <button
                  type="button"
                  onClick={() => onAddForDate(cell.dateStr)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-[#00296E] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#00296E]/50 rounded-none transition-all"
                  title={`+ Tambah Konten untuk ${cell.dateStr}`}
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Daftar Kartu Pill Konten */}
              <div className="space-y-1.5 flex-1 overflow-y-auto max-h-[110px] pr-0.5">
                {dayPlans.map((plan) => {
                  const platCfg = PLATFORM_BADGES[plan.platform] || PLATFORM_BADGES.Lainnya;
                  const statusStyle = STATUS_STYLES[plan.status] || STATUS_STYLES.Planning;

                  return (
                    <div
                      key={plan.id}
                      onClick={() => onSelectContent(plan)}
                      className={`p-1.5 border border-slate-200 dark:border-[#00296E]/40 hover:border-[#00296E] dark:hover:border-[#38BDF8]/60 cursor-pointer transition-all rounded-none text-left bg-white dark:bg-[#001740]/80 hover:bg-slate-50 dark:hover:bg-[#00205c]/90 shadow-sm dark:shadow-none ${
                        plan.is_done ? "opacity-75" : ""
                      }`}
                      title={`${plan.platform} • ${plan.tipe_konten}\n${plan.topik}\nProgress: ${plan.progress}% • Status: ${plan.status}`}
                    >
                      {/* Baris Atas: Badge Platform & Status Dot */}
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span
                          className={`text-[9px] font-mono px-1 py-0.2 border ${platCfg.bg} ${platCfg.text} ${platCfg.border}`}
                        >
                          {platCfg.label}
                        </span>
                        <div className="flex items-center gap-1">
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`}
                            title={plan.status}
                          />
                          {plan.is_done && (
                            <CheckCircle className="w-3 h-3 text-emerald-500 dark:text-emerald-400 shrink-0" />
                          )}
                        </div>
                      </div>

                      {/* Judul Topik Ringkas */}
                      <p
                        className={`text-[11px] leading-tight font-medium line-clamp-2 ${
                          plan.is_done
                            ? "line-through text-slate-400 dark:text-slate-500"
                            : "text-slate-800 dark:text-white"
                        }`}
                      >
                        {plan.topik}
                      </p>

                      {/* Mini Progress Bar */}
                      <div className="mt-1 flex items-center gap-1.5">
                        <div className="flex-1 h-1 bg-slate-200 dark:bg-[#001438] overflow-hidden">
                          <div
                            className={`h-full ${
                              plan.progress <= 25
                                ? "bg-red-500"
                                : plan.progress <= 50
                                ? "bg-orange-500"
                                : plan.progress <= 75
                                ? "bg-amber-400"
                                : "bg-emerald-500"
                            }`}
                            style={{ width: `${plan.progress}%` }}
                          />
                        </div>
                        <span className="text-[9px] font-mono text-slate-500 dark:text-slate-400">
                          {plan.progress}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Status Kosong Tipis */}
              {dayPlans.length === 0 && (
                <div className="h-4 text-[10px] font-mono text-slate-400 dark:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span>+ Tambah</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
