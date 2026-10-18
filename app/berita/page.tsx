"use client";

import { useState } from "react";
import { Sparkles, Calendar, Tag, ArrowRight, Image as ImageIcon, BookOpen, Search } from "lucide-react";

export default function BeritaPage() {
  const [activeTab, setActiveTab] = useState<"berita" | "galeri">("berita");
  const [searchQuery, setSearchQuery] = useState("");

  const articles = [
    {
      title: "Mahasiswa Sistem Informasi Sabet Juara 1 UI/UX Design Competition Nasional 2026",
      category: "Prestasi & Berita",
      date: "12 Maret 2026",
      author: "Kominfo HIMASI",
      excerpt: "Tim 'Inovasi Digital' berhasil mengungguli 85 tim dari berbagai universitas terkemuka dengan aplikasi solusi aksesibilitas perkuliahan.",
      readTime: "3 min baca"
    },
    {
      title: "Kuliah Tamu: Transformasi Enterprise Architecture dengan Cloud & GenAI",
      category: "Akademik & Teknologi",
      date: "05 Maret 2026",
      author: "Divisi Akademik",
      excerpt: "Hadirkan Principal Solution Architect dari AWS untuk membahas implementasi microservices dan data governance di dunia perbankan.",
      readTime: "4 min baca"
    },
    {
      title: "Rilis Buletin 'InfoTek' Edisi Q1 2026: Masa Depan Karir Data & Software Engineering",
      category: "Publikasi Digital",
      date: "28 Februari 2026",
      author: "Redaksi HIMASI",
      excerpt: "Ulasan komprehensif mengenai skill yang paling dicari recruiter tahun ini serta tips portofolio proyek open source dari alumni.",
      readTime: "5 min baca"
    },
  ];

  const galleryItems = [
    { title: "Opening Ceremony HIMASI Fest 2025", tag: "Festival", date: "Nov 2025" },
    { title: "Kunjungan Industri ke Google Indonesia Office", tag: "Company Visit", date: "Okt 2025" },
    { title: "Welcoming Party & Makrab Maba Sistem Informasi", tag: "Kaderisasi", date: "Jan 2026" },
    { title: "Workshop UI/UX Design with Figma", tag: "Pelatihan", date: "Feb 2026" },
    { title: "Bakti Sosial & SI Mengajar di Sekolah Binaan", tag: "Pengabdian", date: "Des 2025" },
    { title: "Pelepasan Wisudawan & Temu Alumni SI", tag: "Seremoni", date: "Feb 2026" },
  ];

  return (
    <div className="flex flex-col w-full py-8 px-4 sm:px-6 max-w-7xl mx-auto">
      {/* Banner */}
      <section className="relative rounded-[2.5rem] bg-gradient-to-r from-[#0094E0] via-[#0070c0] to-[#00296E] p-8 sm:p-14 text-white shadow-xl shadow-sky-500/10 overflow-hidden mb-8">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold uppercase tracking-wider mb-4 border border-white/30">
            <Sparkles className="w-3.5 h-3.5 text-sky-200" />
            <span>Kabar & Jejak Langkah HIMASI</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
            Warta, Publikasi & Galeri
          </h1>
          <p className="mt-3 text-sm sm:text-base text-sky-100 font-normal leading-relaxed">
            Ikuti perkembangan terbaru inovasi teknologi sistem informasi, artikel riset, rilis majalah digital, dan dokumentasi visual kegiatan mahasiswa.
          </p>

          <div className="mt-6 flex gap-2">
            <button
              onClick={() => setActiveTab("berita")}
              className={`px-5 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all ${
                activeTab === "berita"
                  ? "bg-white text-[#00296E] shadow-md"
                  : "bg-white/15 text-white hover:bg-white/25"
              }`}
            >
              Artikel & Berita
            </button>
            <button
              onClick={() => setActiveTab("galeri")}
              className={`px-5 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all ${
                activeTab === "galeri"
                  ? "bg-white text-[#00296E] shadow-md"
                  : "bg-white/15 text-white hover:bg-white/25"
              }`}
            >
              Galeri Dokumentasi
            </button>
          </div>
        </div>
      </section>

      {/* Content */}
      {activeTab === "berita" ? (
        <section className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {articles.map((item, i) => (
              <div
                key={i}
                className="rounded-3xl bg-white dark:bg-[#00173d]/60 border border-slate-200/90 dark:border-white/10 p-6 shadow-sm hover:shadow-xl hover:border-[#0094E0]/40 transition-all flex flex-col justify-between"
              >
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#0094E0]/15 text-[#00296E] dark:text-sky-300">
                    {item.category}
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-3 mb-2 leading-snug">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                    {item.excerpt}
                  </p>
                </div>
                <div className="pt-4 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-[11px] text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#0094E0]" />
                    <span>{item.date}</span>
                  </div>
                  <span>{item.readTime}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : (
        <section>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {galleryItems.map((item, i) => (
              <div
                key={i}
                className="group relative rounded-3xl overflow-hidden bg-slate-900 border border-slate-200 dark:border-white/10 aspect-video flex items-end p-5 shadow-sm hover:shadow-lg transition-all"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-10" />
                <div className="absolute inset-0 bg-gradient-to-tr from-[#0094E0]/30 to-[#00296E]/40 group-hover:scale-105 transition-transform duration-300" />
                <div className="relative z-20">
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-[#0094E0] text-white">
                    {item.tag}
                  </span>
                  <h4 className="text-sm font-bold text-white mt-1.5">{item.title}</h4>
                  <p className="text-[11px] text-slate-300">{item.date}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
