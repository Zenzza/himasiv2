"use client";

import { useState } from "react";
import { Calendar as CalendarIcon, Clock, Tag, ChevronLeft, ChevronRight, Download, Sparkles, Filter } from "lucide-react";

export default function KalenderPage() {
  const [selectedSemester, setSelectedSemester] = useState("Genap 2025/2026");
  const [filterType, setFilterType] = useState("Semua");

  const events = [
    {
      title: "Masa Pengisian & Revisi KRS Online",
      category: "Akademik Kampus",
      date: "09 - 14 Februari 2026",
      badgeColor: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
      type: "Akademik",
      desc: "Konsultasi dosen pembimbing akademik dan finalisasi rencana studi semester genap."
    },
    {
      title: "Awal Perkuliahan Efektif Semester Genap",
      category: "Akademik Kampus",
      date: "16 Februari 2026",
      badgeColor: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
      type: "Akademik",
      desc: "Dimulainya perkuliahan tatap muka minggu ke-1 di seluruh kelas Sistem Informasi."
    },
    {
      title: "Workshop UI/UX Design & Prototyping HIMASI",
      category: "Event HIMASI",
      date: "28 Februari 2026",
      badgeColor: "bg-[#0094E0]/15 text-[#00296E] dark:text-sky-300",
      type: "HIMASI",
      desc: "Pelatihan hands-on Figma dan Design System bersama alumni Product Designer."
    },
    {
      title: "Ujian Tengah Semester (UTS) Genap",
      category: "Ujian & Evaluasi",
      date: "06 - 17 April 2026",
      badgeColor: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
      type: "Ujian",
      desc: "Evaluasi capaian pembelajaran paruh semester gasal/genap seluruh program studi."
    },
    {
      title: "HIMASI Coding Clinic: Algoritma & Basis Data",
      category: "Event HIMASI",
      date: "30 Maret - 04 April 2026",
      badgeColor: "bg-[#0094E0]/15 text-[#00296E] dark:text-sky-300",
      type: "HIMASI",
      desc: "Sesi bimbingan belajar dan bedah latihan soal persiapan UTS bersama asisten laboratorium."
    },
    {
      title: "Libur Hari Raya Idul Fitri 1447 H",
      category: "Libur Nasional",
      date: "20 - 25 April 2026",
      badgeColor: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300",
      type: "Libur",
      desc: "Libur nasional dan cuti bersama keagamaan sesuai ketetapan pemerintah & rektorat."
    },
    {
      title: "Ujian Akhir Semester (UAS) Genap",
      category: "Ujian & Evaluasi",
      date: "15 - 26 Juni 2026",
      badgeColor: "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300",
      type: "Ujian",
      desc: "Evaluasi akhir perkuliahan semester dan pengumpulan tugas besar proyek koding."
    },
  ];

  const filteredEvents = events.filter((e) => {
    return filterType === "Semua" || e.type === filterType;
  });

  return (
    <div className="flex flex-col w-full py-8 px-4 sm:px-6 max-w-7xl mx-auto">
      {/* Banner */}
      <section className="relative rounded-[2.5rem] bg-gradient-to-r from-[#0094E0] via-[#0070c0] to-[#00296E] p-8 sm:p-14 text-white shadow-xl shadow-sky-500/10 overflow-hidden mb-8">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold uppercase tracking-wider mb-4 border border-white/30">
            <CalendarIcon className="w-3.5 h-3.5 text-sky-200" />
            <span>Manajemen Waktu & Agenda</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
            Kalender Interaktif Semester
          </h1>
          <p className="mt-3 text-sm sm:text-base text-sky-100 font-normal leading-relaxed">
            Pantau jadwal perkuliahan, rentang UTS/UAS, tanggal penting administrasi kampus, serta rangkaian kegiatan proker HIMASI sepanjang semester.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/30 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Semester: {selectedSemester}</span>
            </div>
            <button
              onClick={() => alert("Mengunduh kalender akademik HIMASI (.ics)...")}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white text-[#00296E] font-semibold text-xs shadow-md hover:bg-slate-50 transition-all"
            >
              <Download className="w-3.5 h-3.5 text-[#0094E0]" />
              <span>Ekspor ke Google Calendar</span>
            </button>
          </div>
        </div>
      </section>

      {/* Filter Type Pills */}
      <div className="flex flex-wrap gap-2 mb-8">
        {["Semua", "Akademik", "HIMASI", "Ujian", "Libur"].map((type) => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
              filterType === type
                ? "bg-[#00296E] text-white shadow-sm"
                : "bg-white dark:bg-[#00173d] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-[#0094E0]"
            }`}
          >
            {type === "Semua" ? "Semua Agenda" : `Agenda ${type}`}
          </button>
        ))}
      </div>

      {/* Timeline List of Events */}
      <div className="space-y-4">
        {filteredEvents.map((item, i) => (
          <div
            key={i}
            className="rounded-3xl bg-white dark:bg-[#00173d]/60 border border-slate-200/90 dark:border-white/10 p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="flex items-start sm:items-center gap-4">
              <div className="p-3 rounded-2xl bg-[#0094E0]/10 text-[#00296E] dark:text-sky-300 shrink-0">
                <CalendarIcon className="w-5 h-5 text-[#0094E0]" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${item.badgeColor}`}>
                    {item.category}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {item.desc}
                </p>
              </div>
            </div>

            <div className="sm:text-right shrink-0">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200">
                <Clock className="w-3.5 h-3.5 text-[#0094E0]" />
                <span>{item.date}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
