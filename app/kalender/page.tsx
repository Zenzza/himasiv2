"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  CaretLeft,
  CaretRight,
  CalendarBlank,
  DownloadSimple,
  CheckCircle,
  ArrowSquareOut,
  Info,
  Clock,
  MapPin,
} from "@phosphor-icons/react";
import Footer from "@/components/footer";
import ScrollReveal from "@/components/scroll-reveal";
import {
  type AgendaKalender,
  type EventCategory,
  DEFAULT_AGENDA_EVENTS,
  isDateInEventRange,
  getCategoryMeta,
} from "@/lib/types/kalender";
import { getAgendaKalender } from "@/lib/supabase/kalender";
import { supabase } from "@/lib/supabase/client";

const MONTH_NAMES_EN = [
  "JANUARY",
  "FEBRUARY",
  "MARCH",
  "APRIL",
  "MAY",
  "JUNE",
  "JULY",
  "AUGUST",
  "SEPTEMBER",
  "OCTOBER",
  "NOVEMBER",
  "DECEMBER",
];

const MONTH_NAMES_ID = [
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

const MONTH_SHORT_ID = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MEI",
  "JUN",
  "JUL",
  "AGU",
  "SEP",
  "OKT",
  "NOV",
  "DES",
];

const DAYS_HEADER = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const CATEGORY_FILTERS = [
  { id: "Semua", label: "Semua Agenda" },
  { id: "HIMASI", label: "Agenda HIMASI" },
  { id: "Akademik", label: "Akademik Kampus" },
  { id: "Libur", label: "Libur Nasional" },
];

export default function KalenderPage() {
  // Inisialisasi kalender dengan bulan & tahun yang sedang berjalan secara dinamis (real-time)
  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(() => new Date().getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("Semua");
  const [downloadToast, setDownloadToast] = useState<string | null>(null);
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);

  // Dynamic Agenda List dari Supabase dengan Cache-First Instant Rendering
  const [agendaList, setAgendaList] = useState<AgendaKalender[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("himasi_kalender_local_cache");
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch {
        // Abaikan parse error
      }
    }
    return DEFAULT_AGENDA_EVENTS;
  });
  const [loadingAgenda, setLoadingAgenda] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("himasi_kalender_local_cache");
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) return false;
        }
      } catch {
        // Abaikan parse error
      }
    }
    return true;
  });

  const fetchAgendaData = useCallback(async () => {
    try {
      const data = await getAgendaKalender();
      if (data && data.length > 0) {
        setAgendaList(data);
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem("himasi_kalender_local_cache", JSON.stringify(data));
          } catch {
            // Kuota storage penuh
          }
        }
      } else {
        setAgendaList((prev) => (prev.length > 0 ? prev : DEFAULT_AGENDA_EVENTS));
      }
    } catch (err) {
      console.warn("Koneksi kalender offline, memakai data default/cache:", err);
      setAgendaList((prev) => (prev.length > 0 ? prev : DEFAULT_AGENDA_EVENTS));
    } finally {
      setLoadingAgenda(false);
    }
  }, []);

  useEffect(() => {
    fetchAgendaData();

    // Realtime Supabase Subscription
    const channel = supabase
      .channel("himasi_realtime_public_kalender")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "agenda_kalender" },
        () => {
          fetchAgendaData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchAgendaData]);

  // Navigasi Bulan Sebelumnya
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  // Navigasi Bulan Selanjutnya
  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  // Menghitung Grid Kalender Secara Dinamis
  const calendarCells = useMemo(() => {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    const firstDay = new Date(currentYear, currentMonth, 1);
    // Senin sebagai hari pertama (0 = Mon, ..., 6 = Sun)
    const startDayOfWeek = (firstDay.getDay() + 6) % 7;

    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

    const cells: {
      dayNumber: number;
      monthOffset: -1 | 0 | 1;
      fullDate: string;
      isToday: boolean;
    }[] = [];

    // Hari dari bulan sebelumnya
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const prevDate = new Date(currentYear, currentMonth - 1, d);
      const dateStr = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      cells.push({ dayNumber: d, monthOffset: -1, fullDate: dateStr, isToday: dateStr === todayStr });
    }

    // Hari dari bulan sekarang
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
      cells.push({ dayNumber: i, monthOffset: 0, fullDate: dateStr, isToday: dateStr === todayStr });
    }

    // Hari dari bulan selanjutnya hingga genap kelipatan 7 (minimal 35 sel)
    const totalCells = cells.length <= 35 ? 35 : 42;
    const remaining = totalCells - cells.length;
    for (let i = 1; i <= remaining; i++) {
      const nextDate = new Date(currentYear, currentMonth + 1, i);
      const dateStr = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
      cells.push({ dayNumber: i, monthOffset: 1, fullDate: dateStr, isToday: dateStr === todayStr });
    }

    return cells;
  }, [currentYear, currentMonth]);

  // Filter Event untuk List Keterangan di Bawah
  const currentMonthPrefix = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}`;

  const displayedEvents = useMemo(() => {
    const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const monthStart = `${currentMonthPrefix}-01`;
    const monthEnd = `${currentMonthPrefix}-${String(daysInCurrentMonth).padStart(2, "0")}`;

    let list = agendaList.filter((e) => {
      // Jika ada tanggal terpilih, tampilkan acara yang mencakup tanggal terpilih
      if (selectedDate) {
        return isDateInEventRange(selectedDate, e);
      }
      // Jika tidak ada tanggal terpilih, tampilkan semua agenda yang beririsan dengan bulan aktif
      const eventEnd = e.tanggal_selesai || e.tanggal_mulai;
      return e.tanggal_mulai <= monthEnd && eventEnd >= monthStart;
    });

    if (selectedCategory !== "Semua") {
      list = list.filter((e) => e.kategori === selectedCategory);
    }

    // Urutkan berdasarkan tanggal mulai
    return list.sort((a, b) => a.tanggal_mulai.localeCompare(b.tanggal_mulai));
  }, [agendaList, selectedDate, currentMonthPrefix, currentYear, currentMonth, selectedCategory]);

  // Handler Klik Tanggal pada Kalender
  const handleCellClick = (fullDate: string, monthOffset: -1 | 0 | 1) => {
    if (monthOffset === -1) {
      handlePrevMonth();
    } else if (monthOffset === 1) {
      handleNextMonth();
    }

    if (selectedDate === fullDate) {
      // Toggle unselect
      setSelectedDate(null);
    } else {
      setSelectedDate(fullDate);
    }
  };

  // Helper Format Tanggal Indonesia
  const formatDateIndo = (dateStr: string) => {
    const parts = dateStr.split("-");
    if (parts.length !== 3) return dateStr;
    const day = parseInt(parts[2], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parts[0];
    return `${day} ${MONTH_NAMES_ID[month]} ${year}`;
  };

  const formatDayName = (dateStr: string) => {
    const parts = dateStr.split("-");
    if (parts.length !== 3) return "";
    const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    return days[date.getDay()];
  };

  // Buat Google Calendar URL
  const getGoogleCalendarUrl = (evt: AgendaKalender) => {
    const meta = getCategoryMeta(evt.kategori);
    const title = encodeURIComponent(evt.judul);
    const details = encodeURIComponent(
      `${evt.deskripsi}\n\nKategori: ${meta.label}\nLokasi: ${evt.lokasi}\nWaktu: ${evt.waktu}`
    );
    const location = encodeURIComponent(evt.lokasi);
    const cleanStartDate = evt.tanggal_mulai.replace(/-/g, "");
    const cleanEndDate = (evt.tanggal_selesai || evt.tanggal_mulai).replace(/-/g, "");
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}&dates=${cleanStartDate}T080000Z/${cleanEndDate}T170000Z`;
  };

  // Helper hitung hari berikutnya untuk format iCal RFC 5545 (DTEND non-inclusive)
  const getIcsExclusiveEndDate = (dateStr: string) => {
    const parts = dateStr.split("-").map(Number);
    if (parts.length !== 3) return dateStr.replace(/-/g, "");
    const dt = new Date(parts[0], parts[1] - 1, parts[2] + 1);
    return `${dt.getFullYear()}${String(dt.getMonth() + 1).padStart(2, "0")}${String(dt.getDate()).padStart(2, "0")}`;
  };

  // Unduh Berkas Kalender iCal (.ics)
  const handleExportICS = () => {
    let icsContent = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//HIMASI ISB Atma Luhur//Kalender Kegiatan//ID\nCALSCALE:GREGORIAN\n";
    
    agendaList.forEach((evt) => {
      const cleanStartDate = evt.tanggal_mulai.replace(/-/g, "");
      const endBase = evt.tanggal_selesai || evt.tanggal_mulai;
      const cleanEndDate = getIcsExclusiveEndDate(endBase);
      icsContent += `BEGIN:VEVENT\nSUMMARY:${evt.judul}\nDESCRIPTION:${evt.deskripsi}\nLOCATION:${evt.lokasi}\nDTSTART;VALUE=DATE:${cleanStartDate}\nDTEND;VALUE=DATE:${cleanEndDate}\nSTATUS:CONFIRMED\nEND:VEVENT\n`;
    });

    icsContent += "END:VCALENDAR";

    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Kalender-Akademik-HIMASI-${currentYear}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setDownloadToast("Kalender (.ics) berhasil diunduh dan siap diimpor ke Google Calendar / Apple Calendar!");
    setTimeout(() => setDownloadToast(null), 3500);
  };

  return (
    <div className="flex flex-col w-full max-w-full overflow-x-clip bg-white text-[#091e42] min-h-screen">
      
      {/* ============================================================ */}
      {/* SECTION HEADER: PERSIS SESUAI STYLE PAGE LAIN */}
      {/* Breadcrumb HOME / KALENDER, Judul Tengah Besar, dan Subjudul */}
      {/* ============================================================ */}
      <section className="relative pt-10 sm:pt-14 pb-8 sm:pb-12 px-4 sm:px-6 lg:px-12 bg-white w-full overflow-hidden">
        <ScrollReveal className="max-w-6xl mx-auto">
          <div className="relative text-center max-w-3xl mx-auto">
            {/* Breadcrumb Sesuai Referensi: HOME / KALENDER */}
            <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">
              <Link href="/" className="text-[#0094E0] hover:underline">
                HOME
              </Link>
              <span className="text-slate-300">/</span>
              <span className="text-slate-600">KALENDER</span>
            </div>

            {/* Judul Utama: Kalender */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-[#00296E] tracking-tight leading-tight">
              Kalender Kegiatan
            </h1>

            {/* Subjudul Sesuai Referensi */}
            <p className="mt-3 text-slate-600 text-sm sm:text-base leading-relaxed font-normal">
              Agenda akademik, linimasa kegiatan mahasiswa, dan jadwal resmi kepengurusan HIMASI
            </p>
          </div>
        </ScrollReveal>
      </section>

      {/* ============================================================ */}
      {/* SECTION KALENDER INTERAKTIF (PERSIS SESUAI GAMBAR REFERENSI) */}
      {/* Navigasi Bulan, Hari Mon-Sun, Tanggal Border Squircle + Dot */}
      {/* ============================================================ */}
      <section className="relative py-8 sm:py-12 px-4 sm:px-6 lg:px-12 bg-gradient-to-b from-white via-[#f7faff] to-white w-full overflow-hidden">
        <ScrollReveal direction="card-pop" className="max-w-xl mx-auto">
          
          {/* Card Kalender Widget */}
          <div className="bg-white rounded-[28px] sm:rounded-[36px] p-6 sm:p-9 border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow">
            
            {/* Header Bulan & Navigasi Panah Persis Sesuai Gambar */}
            <div className="flex items-center justify-between mb-8 px-2">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-2 sm:p-2.5 rounded-full text-slate-300 hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer active:scale-95"
                aria-label="Bulan Sebelumnya"
              >
                <CaretLeft className="w-5 h-5 sm:w-6 sm:h-6" weight="bold" />
              </button>

              <div className="flex flex-col items-center">
                <h2 className="text-sm sm:text-base font-bold tracking-[0.22em] text-slate-400 uppercase select-none text-center">
                  {MONTH_NAMES_EN[currentMonth]} {currentYear}
                </h2>
                {(currentYear !== new Date().getFullYear() || currentMonth !== new Date().getMonth()) && (
                  <button
                    type="button"
                    onClick={() => {
                      const now = new Date();
                      setCurrentYear(now.getFullYear());
                      setCurrentMonth(now.getMonth());
                      setSelectedDate(null);
                    }}
                    className="text-[10px] font-bold text-[#00296E] hover:text-[#0094E0] hover:underline transition-colors mt-0.5 cursor-pointer"
                  >
                    Kembali ke Bulan Ini
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={handleNextMonth}
                className="p-2 sm:p-2.5 rounded-full text-slate-300 hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer active:scale-95"
                aria-label="Bulan Selanjutnya"
              >
                <CaretRight className="w-5 h-5 sm:w-6 sm:h-6" weight="bold" />
              </button>
            </div>

            {/* Nama Hari: Mon Tue Wed Thu Fri Sat Sun */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-4 text-center">
              {DAYS_HEADER.map((day) => (
                <div
                  key={day}
                  className="text-xs sm:text-sm font-semibold text-slate-500 py-1 select-none"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Grid Tanggal Kalender (Persis Sesuai Style Gambar Referensi) */}
            <div className="grid grid-cols-7 gap-1.5 sm:gap-3 text-center items-center justify-items-center">
              {calendarCells.map((cell, idx) => {
                const cellEvents = agendaList.filter((e) => isDateInEventRange(cell.fullDate, e));
                const hasEvent = cellEvents.length > 0;
                const primaryEvent = cellEvents[0];
                const primaryMeta = primaryEvent ? getCategoryMeta(primaryEvent.kategori) : null;
                const isSelected = selectedDate === cell.fullDate;
                const isCurrentMonth = cell.monthOffset === 0;
                const isHovered = hoveredDate === cell.fullDate;

                // Hitung posisi kolom & baris untuk penempatan tooltip agar tidak terpotong
                const colIndex = idx % 7;
                const rowIndex = Math.floor(idx / 7);

                const horizontalClass =
                  colIndex <= 1
                    ? "left-0"
                    : colIndex >= 5
                    ? "right-0"
                    : "left-1/2 -translate-x-1/2";

                const isTopRows = rowIndex <= 1;
                const verticalClass = isTopRows ? "top-full mt-2.5" : "bottom-full mb-2.5";

                const caretHorizontalClass =
                  colIndex <= 1
                    ? "left-5"
                    : colIndex >= 5
                    ? "right-5"
                    : "left-1/2 -translate-x-1/2";

                const caretBorderClass = isTopRows
                  ? `-top-[7px] ${caretHorizontalClass} border-b-slate-200 border-b-[7px] border-x-[7px] border-x-transparent border-t-0`
                  : `-bottom-[7px] ${caretHorizontalClass} border-t-slate-200 border-t-[7px] border-x-[7px] border-x-transparent border-b-0`;

                const caretBgClass = isTopRows
                  ? `-top-[5.5px] ${caretHorizontalClass} border-b-white border-b-[6px] border-x-[6px] border-x-transparent border-t-0`
                  : `-bottom-[5.5px] ${caretHorizontalClass} border-t-white border-t-[6px] border-x-[6px] border-x-transparent border-b-0`;

                return (
                  <div
                    key={`${cell.fullDate}-${idx}`}
                    className={`group relative flex items-center justify-center group-hover:z-40 ${
                      isHovered ? "z-40" : isSelected ? "z-10" : "z-0"
                    }`}
                    onMouseEnter={() => setHoveredDate(cell.fullDate)}
                    onMouseLeave={() => setHoveredDate(null)}
                  >
                    <button
                      type="button"
                      onClick={() => handleCellClick(cell.fullDate, cell.monthOffset)}
                      className={`relative w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center text-sm sm:text-base font-semibold transition-all duration-200 select-none cursor-pointer ${
                        isSelected
                          ? "bg-[#FEF6D8] border-2 border-[#F2B705] rounded-[14px] sm:rounded-[16px] text-amber-900 font-bold shadow-xs scale-105"
                          : hasEvent && primaryMeta
                          ? `${primaryMeta.border} border-2 rounded-[14px] sm:rounded-[16px] text-slate-800 hover:scale-105`
                          : cell.isToday
                          ? "bg-[#0094E0]/10 border-2 border-[#0094E0]/50 rounded-[14px] sm:rounded-[16px] text-[#00296E] font-bold shadow-xs hover:bg-[#0094E0]/20"
                          : !isCurrentMonth
                          ? "text-slate-300 font-normal hover:text-slate-500"
                          : "text-slate-700 font-medium hover:bg-slate-100 rounded-[14px] sm:rounded-[16px]"
                      }`}
                    >
                      <span>{cell.dayNumber}</span>

                      {/* Dot Indikator di Pojok Kanan Atas Persis Sesuai Gambar Referensi */}
                      {hasEvent && !isSelected && primaryMeta && (
                        <span
                          className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full ring-2 ring-white ${primaryMeta.dot}`}
                        />
                      )}
                    </button>

                    {/* Popover / Tooltip Informasi saat Tanggal di Hover (Background Putih) */}
                    <div
                      className={`absolute pointer-events-none transition-all duration-200 ${
                        isHovered
                          ? "opacity-100 scale-100"
                          : "opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100"
                      } ${verticalClass} ${horizontalClass}`}
                    >
                      {hasEvent && primaryEvent && primaryMeta ? (
                        <div className="relative w-64 sm:w-72 p-4 rounded-2xl bg-white text-slate-800 shadow-[0_12px_36px_rgba(0,41,110,0.15)] border border-slate-200 text-left">
                          {/* Caret Triangle dengan border */}
                          <span className={`absolute w-0 h-0 pointer-events-none ${caretBorderClass}`} />
                          <span className={`absolute w-0 h-0 pointer-events-none ${caretBgClass}`} />

                          {/* Header: Tanggal & Badge Kategori */}
                          <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-100 text-[11px]">
                            <span className="font-semibold text-slate-500 flex items-center gap-1.5 flex-wrap">
                              <CalendarBlank className="w-3.5 h-3.5 text-[#0094E0]" />
                              <span>{formatDayName(cell.fullDate)}, {cell.dayNumber} {MONTH_SHORT_ID[parseInt(cell.fullDate.split("-")[1], 10) - 1]}</span>
                              {cell.isToday && (
                                <span className="text-[9px] font-bold text-sky-700 bg-sky-100 px-1.5 py-0.5 rounded-full">
                                  Hari Ini
                                </span>
                              )}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider ${
                                primaryMeta.bgBadge
                              } ${primaryMeta.textBadge}`}
                            >
                              {primaryMeta.label}
                            </span>
                          </div>

                          {/* Judul Event */}
                          <div className="space-y-1.5">
                            {cellEvents.map((e) => (
                              <div key={e.id}>
                                <h4 className="text-xs sm:text-[13px] font-bold text-[#00296E] leading-snug">
                                  {e.judul}
                                </h4>
                                <p className="text-[10px] text-slate-400 mt-0.5">
                                  {e.waktu} &bull; {e.lokasi}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="relative whitespace-nowrap px-3.5 py-1.5 rounded-xl bg-white text-slate-700 shadow-xl border border-slate-200 text-center text-xs">
                          {/* Caret Triangle */}
                          <span className={`absolute w-0 h-0 pointer-events-none ${caretBorderClass}`} />
                          <span className={`absolute w-0 h-0 pointer-events-none ${caretBgClass}`} />
                          <div className="text-[11px] font-medium text-slate-600 flex items-center justify-center gap-1.5">
                            <span>{cell.dayNumber} {MONTH_NAMES_ID[parseInt(cell.fullDate.split("-")[1], 10) - 1]}</span>
                            {cell.isToday && (
                              <span className="text-[9px] font-bold text-sky-700 bg-sky-100 px-1.5 py-0.5 rounded-full">
                                Hari Ini
                              </span>
                            )}
                            <span>•</span>
                            <span className="text-slate-400">Tidak ada agenda</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Keterangan Titik Warna (Legend) */}
            <div className="flex flex-wrap items-center justify-center gap-3.5 sm:gap-6 pt-6 border-t border-slate-100 mt-7 text-[11px] sm:text-xs text-slate-500">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#1E88E5]" />
                <span className="font-medium text-slate-600">Agenda HIMASI</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#F2B705]" />
                <span className="font-medium text-slate-600">Akademik Kampus</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#8E24AA]" />
                <span className="font-medium text-slate-600">Libur Nasional</span>
              </div>
            </div>

          </div>

          {/* Quick Actions Bawah Kalender */}
          <div className="mt-5 flex items-center justify-between px-2 text-xs text-slate-500">
            <span className="text-slate-400">
              Tip: Klik tanggal dengan tanda untuk melihat rincian agenda.
            </span>
            <button
              type="button"
              onClick={handleExportICS}
              className="inline-flex items-center gap-1.5 font-bold text-[#00296E] hover:text-[#0094E0] transition-colors cursor-pointer"
            >
              <DownloadSimple className="w-3.5 h-3.5" />
              <span>Ekspor Kalender (.ics)</span>
            </button>
          </div>

        </ScrollReveal>
      </section>

      {/* ============================================================ */}
      {/* SECTION LIST KETERANGAN DI BAWAHNYA */}
      {/* Daftar Keterangan Detail Event Sesuai Tanggal/Bulan Terpilih */}
      {/* ============================================================ */}
      <section className="relative py-12 sm:py-16 px-4 sm:px-6 lg:px-12 bg-white w-full border-t border-slate-100 overflow-hidden">
        <ScrollReveal className="max-w-5xl mx-auto">
          
          {/* Header List Keterangan + Filter Kategori */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-[#00296E] tracking-tight">
                Keterangan & Rincian Agenda
              </h2>
            </div>

            {/* Filter Tabs Pills */}
            <div className="flex flex-wrap items-center gap-2">
              {CATEGORY_FILTERS.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                    selectedCategory === cat.id
                      ? "bg-[#00296E] text-white shadow-xs"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Banner Indikator Jika Tanggal Tertentu Sedang Dipilih */}
          {selectedDate && (
            <div className="mb-6 p-4 bg-amber-50/80 border border-amber-200/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-950">
              <div className="flex items-center gap-2.5 font-medium">
                <CalendarBlank className="w-4 h-4 text-amber-700 shrink-0" />
                <span>
                  Memfilter agenda pada tanggal: <strong>{formatDateIndo(selectedDate)} ({formatDayName(selectedDate)})</strong>
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDate(null)}
                className="font-bold text-[#00296E] hover:text-[#0094E0] hover:underline cursor-pointer shrink-0"
              >
                Tampilkan Semua Agenda Bulan Ini →
              </button>
            </div>
          )}

          {/* List Event Cards */}
          {displayedEvents.length > 0 ? (
            <div className="space-y-4">
              {displayedEvents.map((evt, idx) => {
                const meta = getCategoryMeta(evt.kategori);
                const isMultiDay = Boolean(
                  evt.tanggal_selesai && evt.tanggal_selesai !== evt.tanggal_mulai
                );
                const startMonthIdx = parseInt(evt.tanggal_mulai.split("-")[1], 10) - 1;
                const endMonthIdx = evt.tanggal_selesai
                  ? parseInt(evt.tanggal_selesai.split("-")[1], 10) - 1
                  : startMonthIdx;
                const startDay = parseInt(evt.tanggal_mulai.split("-")[2], 10);
                const endDay = evt.tanggal_selesai
                  ? parseInt(evt.tanggal_selesai.split("-")[2], 10)
                  : startDay;
                const spansDiffMonth = isMultiDay && startMonthIdx !== endMonthIdx;

                return (
                  <ScrollReveal key={evt.id} direction="left" delay={idx * 100}>
                    <div
                      className="group relative bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 hover:border-[#0094E0]/40 p-5 sm:p-6 shadow-xs hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-5"
                    >
                      <div className="flex items-start sm:items-center gap-4 sm:gap-5 flex-1 min-w-0">
                        {/* Kotak Tanggal di Kiri */}
                        <div
                          className={`w-16 h-16 sm:w-18 sm:h-18 rounded-2xl border-2 flex flex-col items-center justify-center shrink-0 ${meta.border} bg-white shadow-xs p-1`}
                        >
                          {spansDiffMonth ? (
                            <div className="flex flex-col items-center justify-center text-center">
                              <span className="text-[11px] sm:text-xs font-black text-[#00296E] leading-tight">
                                {startDay} {MONTH_SHORT_ID[startMonthIdx]}
                              </span>
                              <span className="text-[8px] font-bold text-slate-400 leading-none my-0.5">s/d</span>
                              <span className="text-[11px] sm:text-xs font-black text-[#00296E] leading-tight">
                                {endDay} {MONTH_SHORT_ID[endMonthIdx]}
                              </span>
                            </div>
                          ) : (
                            <>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                {formatDayName(evt.tanggal_mulai).slice(0, 3)}
                              </span>
                              <span className="text-base sm:text-lg font-black text-[#00296E] leading-tight">
                                {isMultiDay ? `${startDay}-${endDay}` : startDay}
                              </span>
                              <span className="text-[9px] font-semibold text-slate-400 uppercase">
                                {MONTH_SHORT_ID[startMonthIdx]}
                              </span>
                            </>
                          )}
                        </div>

                        {/* Rincian Keterangan Event */}
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`text-[10px] sm:text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${meta.bgBadge} ${meta.textBadge}`}
                            >
                              {meta.label}
                            </span>
                            {isMultiDay && (
                              <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
                                {evt.tanggal_mulai} s/d {evt.tanggal_selesai}
                              </span>
                            )}
                          </div>

                          <h3 className="text-base sm:text-lg font-bold text-[#00296E] group-hover:text-[#0094E0] transition-colors leading-snug">
                            {evt.judul}
                          </h3>

                          <div className="flex items-center gap-3 text-xs text-slate-500 font-medium flex-wrap">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              {evt.waktu}
                            </span>
                            <span>&bull;</span>
                            <span className="flex items-center gap-1 truncate">
                              <MapPin className="w-3.5 h-3.5 text-slate-400" />
                              {evt.lokasi}
                            </span>
                          </div>

                          {evt.deskripsi && (
                            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed max-w-2xl">
                              {evt.deskripsi}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Tombol Simpan ke Google Calendar di Kanan */}
                      <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                        <a
                          href={getGoogleCalendarUrl(evt)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-[#00296E] bg-slate-100 hover:bg-[#00296E] hover:text-white transition-all shadow-xs cursor-pointer group/cal"
                        >
                          <CalendarBlank className="w-3.5 h-3.5 text-[#0094E0] group-hover/cal:text-white" />
                          <span>Simpan ke Kalender</span>
                          <ArrowSquareOut className="w-3 h-3 opacity-60" />
                        </a>
                      </div>
                    </div>
                  </ScrollReveal>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16 px-4 bg-slate-50/70 rounded-3xl border border-slate-200/80">
              <div className="w-12 h-12 rounded-2xl bg-slate-200 text-slate-500 flex items-center justify-center mx-auto mb-3">
                <Info className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-700">
                Tidak ada agenda pada tanggal atau kategori yang dipilih
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md mx-auto">
                Silakan pilih kategori lain atau klik tombol di bawah untuk menampilkan seluruh kegiatan bulan ini.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedDate(null);
                  setSelectedCategory("Semua");
                }}
                className="mt-4 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#00296E] hover:bg-[#003B96] transition-colors cursor-pointer"
              >
                Tampilkan Semua Agenda {MONTH_NAMES_ID[currentMonth]} {currentYear}
              </button>
            </div>
          )}

        </ScrollReveal>
      </section>

      {/* Toast Notifikasi Ekspor ICS */}
      {downloadToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#00296E] text-white px-5 py-3.5 rounded-xl shadow-2xl flex items-center gap-3 border border-[#0094E0]/30 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <CheckCircle className="w-5 h-5 text-[#0094E0] shrink-0" weight="fill" />
          <span className="text-xs sm:text-sm font-semibold">{downloadToast}</span>
        </div>
      )}

      {/* ============================================================ */}
      {/* FOOTER KONSISTEN DENGAN SELURUH HALAMAN */}
      {/* ============================================================ */}
      <Footer />

    </div>
  );
}
