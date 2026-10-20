"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Download,
  CheckCircle2,
  ExternalLink,
  Sparkles,
  Info,
  CalendarDays
} from "lucide-react";
import Footer from "@/components/footer";
import ScrollReveal from "@/components/scroll-reveal";

// ===================================================================
// TIPE & DATA EVENT KALENDER
// ===================================================================
type EventCategory = "HIMASI" | "Akademik" | "Libur";

type EventItem = {
  id: string;
  dateStr: string; // Format: YYYY-MM-DD
  title: string;
  category: EventCategory;
  categoryLabel: string;
  time: string;
  location: string;
  desc: string;
  color: {
    border: string;
    dot: string;
    bgBadge: string;
    textBadge: string;
  };
};

const CATEGORY_COLORS: Record<
  EventCategory,
  { border: string; dot: string; bgBadge: string; textBadge: string; label: string }
> = {
  HIMASI: {
    border: "border-[#1E88E5]",
    dot: "bg-[#1E88E5]",
    bgBadge: "bg-[#1E88E5]/10",
    textBadge: "text-[#00296E]",
    label: "Agenda HIMASI",
  },
  Akademik: {
    border: "border-[#F2B705]",
    dot: "bg-[#F2B705]",
    bgBadge: "bg-[#F2B705]/15",
    textBadge: "text-amber-800",
    label: "Akademik Kampus",
  },
  Libur: {
    border: "border-[#8E24AA]",
    dot: "bg-[#8E24AA]",
    bgBadge: "bg-[#8E24AA]/10",
    textBadge: "text-purple-800",
    label: "Libur Nasional",
  },
};

const ALL_EVENTS: EventItem[] = [
  // --- September 2026 (Persis Sesuai Gambar Referensi) ---
  {
    id: "evt-sep-09",
    dateStr: "2026-09-09",
    title: "Ujian Sidang Skripsi & Tugas Akhir Gelombang I (Hari ke-1)",
    category: "Akademik",
    categoryLabel: "Akademik Kampus",
    time: "08.30 - 16.00 WIB",
    location: "Ruang Sidang Utama Lt. 2 ISB Atma Luhur",
    desc: "Pelaksanaan ujian sidang skripsi dan tugas akhir tahap 1 bagi mahasiswa tingkat akhir Program Studi Sistem Informasi ISB Atma Luhur.",
    color: CATEGORY_COLORS.Akademik,
  },
  {
    id: "evt-sep-10",
    dateStr: "2026-09-10",
    title: "Ujian Sidang Skripsi & Tugas Akhir Gelombang I (Hari ke-2)",
    category: "Akademik",
    categoryLabel: "Akademik Kampus",
    time: "08.30 - 15.30 WIB",
    location: "Ruang Sidang Utama Lt. 2 ISB Atma Luhur",
    desc: "Lanjutan sidang meja hijau dan verifikasi kelayakan naskah tugas akhir mahasiswa Program Studi Sistem Informasi.",
    color: CATEGORY_COLORS.Akademik,
  },
  {
    id: "evt-sep-14",
    dateStr: "2026-09-14",
    title: "Awal Perkuliahan Efektif Semester Ganjil 2026/2027",
    category: "Akademik",
    categoryLabel: "Akademik Kampus",
    time: "07.30 - 17.00 WIB",
    location: "Seluruh Ruang Kelas Sistem Informasi ISB Atma Luhur",
    desc: "Dimulainya perkuliahan tatap muka minggu ke-1 seluruh mata kuliah prodi Sistem Informasi ISB Atma Luhur tahun akademik baru.",
    color: CATEGORY_COLORS.Akademik,
  },
  {
    id: "evt-sep-25",
    dateStr: "2026-09-25",
    title: "Malam Keakraban (MAKRAB) & Inaugurasi HIMASI 2026",
    category: "HIMASI",
    categoryLabel: "Agenda HIMASI",
    time: "16.00 - 22.00 WIB",
    location: "Auditorium & Lapangan Utama ISB Atma Luhur",
    desc: "Temu akrab mahasiswa baru bersama BPH & seluruh divisi HIMASI untuk menjalin sinergi, pengenalan ormawa, dan pentas kebersamaan.",
    color: CATEGORY_COLORS.HIMASI,
  },
  {
    id: "evt-sep-29",
    dateStr: "2026-09-29",
    title: "HIMASI Tech Talk: Road to Cloud Engineer & AI Frontier",
    category: "HIMASI",
    categoryLabel: "Agenda HIMASI",
    time: "13.30 - 16.30 WIB",
    location: "Lab Komputer Cloud & Live Streaming YouTube HIMASI",
    desc: "Seminar teknologi komputasi awan dan rekayasa kecerdasan buatan bersama alumni praktisi industri teknologi nasional.",
    color: CATEGORY_COLORS.HIMASI,
  },

  // --- Agustus 2026 (Bulan Sebelumnya) ---
  {
    id: "evt-aug-17",
    dateStr: "2026-08-17",
    title: "Upacara Peringatan HUT Kemerdekaan RI ke-81",
    category: "Libur",
    categoryLabel: "Libur Nasional",
    time: "07.30 - 10.00 WIB",
    location: "Lapangan Upacara ISB Atma Luhur",
    desc: "Upacara bendera peringatan kemerdekaan Republik Indonesia dan festival lomba ormawa kampus Atma Luhur.",
    color: CATEGORY_COLORS.Libur,
  },
  {
    id: "evt-aug-24",
    dateStr: "2026-08-24",
    title: "Masa Pengisian & Revisi KRS Online Semester Ganjil",
    category: "Akademik",
    categoryLabel: "Akademik Kampus",
    time: "09.00 - 23.59 WIB",
    location: "Portal SIAKAD Online Atma Luhur",
    desc: "Konsultasi dosen pembimbing akademik (PA) dan penguncian jadwal rencana studi semester ganjil.",
    color: CATEGORY_COLORS.Akademik,
  },

  // --- Oktober 2026 (Bulan Selanjutnya) ---
  {
    id: "evt-oct-05",
    dateStr: "2026-10-05",
    title: "HIMASI Coding Clinic: Algoritma & Basis Data Relasional",
    category: "HIMASI",
    categoryLabel: "Agenda HIMASI",
    time: "15.30 - 17.30 WIB",
    location: "Lab Pemrograman Web Lt. 3",
    desc: "Sesi tutorial intensif dan bimbingan praktikum koding bersama tutor sebaya berprestasi HIMASI.",
    color: CATEGORY_COLORS.HIMASI,
  },
  {
    id: "evt-oct-15",
    dateStr: "2026-10-15",
    title: "Batas Akhir Verifikasi Dispensasi Kuliah & Delegasi Lomba",
    category: "Akademik",
    categoryLabel: "Akademik Kampus",
    time: "16.00 WIB",
    location: "Sekretariat Prodi Sistem Informasi",
    desc: "Batas akhir penyerahan berkas verifikasi dispensasi lomba akademik dan program magang bersertifikat MBKM.",
    color: CATEGORY_COLORS.Akademik,
  },
  {
    id: "evt-oct-26",
    dateStr: "2026-10-26",
    title: "Ujian Tengah Semester (UTS) Ganjil 2026/2027",
    category: "Akademik",
    categoryLabel: "Akademik Kampus",
    time: "08.00 - 16.00 WIB",
    location: "Ruang Ujian Terpadu Kampus Atma Luhur",
    desc: "Pekan evaluasi tengah semester untuk seluruh mata kuliah teori dan praktikum sistem informasi.",
    color: CATEGORY_COLORS.Akademik,
  },
];

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
  // Default to September 2026 to match reference screenshot perfectly
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(8); // 8 = September (0-indexed)
  const [selectedDate, setSelectedDate] = useState<string | null>("2026-09-29"); // Default selected date 29
  const [selectedCategory, setSelectedCategory] = useState<string>("Semua");
  const [downloadToast, setDownloadToast] = useState<string | null>(null);
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);

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
    const firstDay = new Date(currentYear, currentMonth, 1);
    // Senin sebagai hari pertama (0 = Mon, ..., 6 = Sun)
    const startDayOfWeek = (firstDay.getDay() + 6) % 7;

    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

    const cells: {
      dayNumber: number;
      monthOffset: -1 | 0 | 1;
      fullDate: string;
    }[] = [];

    // Hari dari bulan sebelumnya
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const prevDate = new Date(currentYear, currentMonth - 1, d);
      const dateStr = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      cells.push({ dayNumber: d, monthOffset: -1, fullDate: dateStr });
    }

    // Hari dari bulan sekarang
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
      cells.push({ dayNumber: i, monthOffset: 0, fullDate: dateStr });
    }

    // Hari dari bulan selanjutnya hingga genap kelipatan 7 (minimal 35 sel)
    const totalCells = cells.length <= 35 ? 35 : 42;
    const remaining = totalCells - cells.length;
    for (let i = 1; i <= remaining; i++) {
      const nextDate = new Date(currentYear, currentMonth + 1, i);
      const dateStr = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
      cells.push({ dayNumber: i, monthOffset: 1, fullDate: dateStr });
    }

    return cells;
  }, [currentYear, currentMonth]);

  // Map Event Berdasarkan Tanggal
  const eventsByDate = useMemo(() => {
    const map = new Map<string, EventItem>();
    ALL_EVENTS.forEach((e) => {
      map.set(e.dateStr, e);
    });
    return map;
  }, []);

  // Filter Event untuk List Keterangan di Bawah
  const currentMonthPrefix = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}`;

  const displayedEvents = useMemo(() => {
    let list = ALL_EVENTS.filter((e) => {
      // Jika ada tanggal terpilih, tampilkan tanggal terpilih
      if (selectedDate) {
        return e.dateStr === selectedDate;
      }
      // Jika tidak ada tanggal terpilih, tampilkan semua agenda bulan yang sedang dibuka
      return e.dateStr.startsWith(currentMonthPrefix);
    });

    if (selectedCategory !== "Semua") {
      list = list.filter((e) => e.category === selectedCategory);
    }

    // Urutkan berdasarkan tanggal
    return list.sort((a, b) => a.dateStr.localeCompare(b.dateStr));
  }, [selectedDate, currentMonthPrefix, selectedCategory]);

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
    const date = new Date(dateStr);
    const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    return days[date.getDay()];
  };

  // Buat Google Calendar URL
  const getGoogleCalendarUrl = (evt: EventItem) => {
    const title = encodeURIComponent(evt.title);
    const details = encodeURIComponent(
      `${evt.desc}\n\nKategori: ${evt.categoryLabel}\nLokasi: ${evt.location}`
    );
    const location = encodeURIComponent(evt.location);
    const cleanDate = evt.dateStr.replace(/-/g, "");
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}&dates=${cleanDate}T080000Z/${cleanDate}T170000Z`;
  };

  // Unduh Berkas Kalender iCal (.ics)
  const handleExportICS = () => {
    let icsContent = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//HIMASI ISB Atma Luhur//Kalender Kegiatan//ID\nCALSCALE:GREGORIAN\n";
    
    ALL_EVENTS.forEach((evt) => {
      const cleanDate = evt.dateStr.replace(/-/g, "");
      icsContent += `BEGIN:VEVENT\nSUMMARY:${evt.title}\nDESCRIPTION:${evt.desc}\nLOCATION:${evt.location}\nDTSTART;VALUE=DATE:${cleanDate}\nDTEND;VALUE=DATE:${cleanDate}\nSTATUS:CONFIRMED\nEND:VEVENT\n`;
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
    <div className="flex flex-col w-full bg-white text-[#091e42] min-h-screen">
      
      {/* ============================================================ */}
      {/* SECTION HEADER: PERSIS SESUAI STYLE PAGE LAIN */}
      {/* Breadcrumb HOME / KALENDER, Judul Tengah Besar, dan Subjudul */}
      {/* ============================================================ */}
      <section className="relative pt-10 sm:pt-14 pb-8 sm:pb-12 px-4 sm:px-6 lg:px-12 bg-white w-full">
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
      <section className="relative py-8 sm:py-12 px-4 sm:px-6 lg:px-12 bg-gradient-to-b from-white via-[#f7faff] to-white w-full">
        <ScrollReveal className="max-w-xl mx-auto">
          
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
                <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2]" />
              </button>

              <h2 className="text-sm sm:text-base font-bold tracking-[0.22em] text-slate-400 uppercase select-none text-center">
                {MONTH_NAMES_EN[currentMonth]} {currentYear}
              </h2>

              <button
                type="button"
                onClick={handleNextMonth}
                className="p-2 sm:p-2.5 rounded-full text-slate-300 hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer active:scale-95"
                aria-label="Bulan Selanjutnya"
              >
                <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2]" />
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
                const event = eventsByDate.get(cell.fullDate);
                const hasEvent = Boolean(event);
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
                          : hasEvent
                          ? `${event?.color.border} border-2 rounded-[14px] sm:rounded-[16px] text-slate-800 hover:scale-105`
                          : !isCurrentMonth
                          ? "text-slate-300 font-normal hover:text-slate-500"
                          : "text-slate-700 font-medium hover:bg-slate-100 rounded-[14px] sm:rounded-[16px]"
                      }`}
                    >
                      <span>{cell.dayNumber}</span>

                      {/* Dot Indikator di Pojok Kanan Atas Persis Sesuai Gambar Referensi */}
                      {hasEvent && !isSelected && (
                        <span
                          className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full ring-2 ring-white ${event?.color.dot}`}
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
                      {hasEvent && event ? (
                        <div className="relative w-64 sm:w-72 p-4 rounded-2xl bg-white text-slate-800 shadow-[0_12px_36px_rgba(0,41,110,0.15)] border border-slate-200 text-left">
                          {/* Caret Triangle dengan border */}
                          <span className={`absolute w-0 h-0 pointer-events-none ${caretBorderClass}`} />
                          <span className={`absolute w-0 h-0 pointer-events-none ${caretBgClass}`} />

                          {/* Header: Tanggal & Badge Kategori */}
                          <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-100 text-[11px]">
                            <span className="font-semibold text-slate-500 flex items-center gap-1.5">
                              <CalendarDays className="w-3.5 h-3.5 text-[#0094E0]" />
                              {formatDayName(cell.fullDate)}, {cell.dayNumber} {MONTH_SHORT_ID[parseInt(cell.fullDate.split("-")[1], 10) - 1]}
                            </span>
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider ${
                                event.category === "HIMASI"
                                  ? "bg-[#1E88E5] text-white"
                                  : event.category === "Akademik"
                                  ? "bg-[#F2B705] text-slate-900"
                                  : "bg-[#8E24AA] text-white"
                              }`}
                            >
                              {event.categoryLabel}
                            </span>
                          </div>

                          {/* Judul Event */}
                          <h4 className="text-xs sm:text-[13px] font-bold text-[#00296E] leading-snug mb-1">
                            {event.title}
                          </h4>
                        </div>
                      ) : (
                        <div className="relative whitespace-nowrap px-3.5 py-1.5 rounded-xl bg-white text-slate-700 shadow-xl border border-slate-200 text-center text-xs">
                          {/* Caret Triangle */}
                          <span className={`absolute w-0 h-0 pointer-events-none ${caretBorderClass}`} />
                          <span className={`absolute w-0 h-0 pointer-events-none ${caretBgClass}`} />
                          <div className="text-[11px] font-medium text-slate-600">
                            {cell.dayNumber} {MONTH_NAMES_ID[parseInt(cell.fullDate.split("-")[1], 10) - 1]} • <span className="text-slate-400">Tidak ada agenda</span>
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
              <Download className="w-3.5 h-3.5" />
              <span>Ekspor Kalender (.ics)</span>
            </button>
          </div>

        </ScrollReveal>
      </section>

      {/* ============================================================ */}
      {/* SECTION LIST KETERANGAN DI BAWAHNYA */}
      {/* Daftar Keterangan Detail Event Sesuai Tanggal/Bulan Terpilih */}
      {/* ============================================================ */}
      <section className="relative py-12 sm:py-16 px-4 sm:px-6 lg:px-12 bg-white w-full border-t border-slate-100">
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
                <CalendarDays className="w-4 h-4 text-amber-700 shrink-0" />
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
              {displayedEvents.map((evt) => (
                <div
                  key={evt.id}
                  className="group relative bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 hover:border-[#0094E0]/40 p-5 sm:p-6 shadow-xs hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-5"
                >
                  <div className="flex items-start sm:items-center gap-4 sm:gap-5">
                    {/* Kotak Tanggal di Kiri */}
                    <div
                      className={`w-16 h-16 sm:w-18 sm:h-18 rounded-2xl border-2 flex flex-col items-center justify-center shrink-0 ${evt.color.border} bg-white shadow-xs`}
                    >
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        {formatDayName(evt.dateStr).slice(0, 3)}
                      </span>
                      <span className="text-xl sm:text-2xl font-black text-[#00296E] leading-tight">
                        {evt.dateStr.split("-")[2]}
                      </span>
                      <span className="text-[9px] font-semibold text-slate-400 uppercase">
                        {MONTH_SHORT_ID[parseInt(evt.dateStr.split("-")[1], 10) - 1]}
                      </span>
                    </div>

                    {/* Rincian Keterangan Event */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] sm:text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${evt.color.bgBadge} ${evt.color.textBadge}`}
                        >
                          {evt.categoryLabel}
                        </span>
                      </div>

                      <h3 className="text-base sm:text-lg font-bold text-[#00296E] group-hover:text-[#0094E0] transition-colors leading-snug">
                        {evt.title}
                      </h3>

                      <p className="text-slate-600 text-xs sm:text-sm leading-relaxed max-w-2xl">
                        {evt.desc}
                      </p>
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
                      <CalendarIcon className="w-3.5 h-3.5 text-[#0094E0] group-hover/cal:text-white" />
                      <span>Simpan ke Kalender</span>
                      <ExternalLink className="w-3 h-3 opacity-60" />
                    </a>
                  </div>
                </div>
              ))}
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
          <CheckCircle2 className="w-5 h-5 text-[#0094E0] shrink-0" />
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
