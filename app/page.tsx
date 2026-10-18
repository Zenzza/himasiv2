"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Calendar,
  Award,
  Users,
  ChevronDown,
  Play,
  Clock,
  ArrowRight,
  Sparkles,
  UserPlus,
  Shirt,
  Trophy
} from "lucide-react";
import Footer from "@/components/footer";

// URL Video YouTube Company Profile HIMASI (Ganti link di sini sesuai kebutuhan)
const YOUTUBE_VIDEO_URL = "https://youtu.be/Q-SbWMLlmoI?si=5uNeFPoj9BzOo0bT";

// Helper untuk mengekstrak Video ID dari berbagai format link YouTube
function getYouTubeVideoId(url: string): string {
  if (!url) return "dQw4w9WgXcQ";
  const trimmed = url.trim();
  const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = trimmed.match(regExp);
  if (match && match[1]) {
    return match[1];
  }
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }
  return "dQw4w9WgXcQ";
}

export default function Home() {
  const [isPlayingInline, setIsPlayingInline] = useState(false);
  const videoId = getYouTubeVideoId(YOUTUBE_VIDEO_URL);
  const [thumbSrc, setThumbSrc] = useState(
    `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
  );

  return (
    <div className="flex flex-col w-full bg-white text-[#091e42] min-h-screen">
      
      <section className="relative w-full overflow-hidden min-h-[85vh] sm:min-h-[92vh] flex flex-col justify-center items-center">
        
        {/* 1. Dummy Nature Photograph (/hero-nature.jpg) */}
        <img
          src="/hero-banner.png"
          alt="Hero Nature Landscape"
          className="absolute inset-0 w-full h-full object-cover object-[center_65%] pointer-events-none select-none"
        />

        {/* 2. Gradient Overlay: Dibuat lebih pendek dan presisi (fokus blend navbar di atas & subtle fade di bawah) */}
        <div
          className="absolute inset-0 pointer-events-none transition-all duration-300"
          style={{
            background:
              "linear-gradient(180deg, #00296E 0%, rgba(0, 41, 110, 0.72) 8%, rgba(0, 41, 110, 0.22) 16%, rgba(0, 41, 110, 0.04) 24%, transparent 28%, transparent 92%, rgba(255, 255, 255, 0.75) 98%, #FFFFFF 100%)",
          }}
        />

        {/* 3. Ajakan Scroll: Simbol panah mengarah ke bawah memantul kecil di tengah bawah */}
        <button
          type="button"
          onClick={() => {
            document.getElementById("ikhtisar")?.scrollIntoView({ behavior: "smooth" });
          }}
          className="absolute bottom-5 sm:bottom-7 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center justify-center p-2 rounded-full cursor-pointer focus:outline-none group select-none animate-bounce"
          aria-label="Scroll ke konten bawah"
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/85 hover:bg-white backdrop-blur-md border border-slate-200/80 shadow-md hover:shadow-lg flex items-center justify-center transition-all duration-200 group-hover:scale-110">
            <ChevronDown className="w-5 h-5 text-[#00296E] stroke-[2.5]" />
          </div>
        </button>
      </section>

      {/* SECTION: TENTANG KAMI & COMPANY PROFILE VIDEO (Sesuai Referensi) */}
      <section id="ikhtisar" className="relative py-16 sm:py-24 px-4 sm:px-6 lg:px-12 bg-white w-full overflow-hidden scroll-mt-16">

        <div className="relative max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
            
            {/* Kiri: Video Mockup Card (YouTube Player Style) */}
            <div className="lg:col-span-7">
              <div className="relative group">
                <div
                  onClick={() => {
                    if (!isPlayingInline) setIsPlayingInline(true);
                  }}
                  className="relative w-full aspect-video rounded-2xl sm:rounded-3xl border-4 sm:border-[6px] border-slate-900 bg-slate-950 overflow-hidden shadow-2xl hover:shadow-[0_20px_50px_rgba(0,41,110,0.25)] transition-all duration-300 cursor-pointer select-none"
                  role="button"
                  tabIndex={0}
                  aria-label="Tonton Company Profile HIMASI"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      setIsPlayingInline(true);
                    }
                  }}
                >
                  {isPlayingInline ? (
                    <iframe
                      className="w-full h-full"
                      src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
                      title="Company Profile HIMASI Atma Luhur"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <>
                      {/* Background Video Thumbnail from YouTube */}
                      <img
                        src={thumbSrc}
                        alt="Thumbnail Company Profile HIMASI"
                        onError={() => {
                          setThumbSrc(`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`);
                        }}
                        className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                      />

                      {/* Gradient Overlays */}
                      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/85 via-black/40 to-transparent pointer-events-none" />
                      <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/85 via-black/40 to-transparent pointer-events-none" />
                      <div className="absolute inset-0 bg-blue-950/20 group-hover:bg-transparent transition-colors duration-300 pointer-events-none" />

                      {/* Top Overlay: Header Info YouTube */}
                      <div className="absolute top-3 left-3 sm:top-4 sm:left-4 right-3 sm:right-4 flex items-center gap-2.5 z-10 pointer-events-none">
                        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white p-0.5 shadow-md shrink-0 flex items-center justify-center">
                          <img
                            src="/logo-himasi.png"
                            alt="HIMASI Logo"
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-white text-xs sm:text-sm font-bold tracking-tight truncate drop-shadow-md">
                            COMPANY PROFILE HIMASI 2026 KABINET REKSABUDAYA
                          </h3>
                          <p className="text-white/80 text-[10px] sm:text-xs drop-shadow-xs">
                            HIMASI Atma Luhur
                          </p>
                        </div>
                      </div>

                      {/* Center: Red YouTube Play Button */}
                      <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                        <div className="w-16 h-11 sm:w-20 sm:h-14 rounded-2xl bg-[#ff0000] group-hover:bg-red-700 shadow-[0_10px_25px_rgba(255,0,0,0.4)] flex items-center justify-center transition-all duration-300 group-hover:scale-110">
                          <Play className="w-6 h-6 sm:w-7 sm:h-7 text-white fill-white ml-0.5" />
                        </div>
                      </div>

                      {/* Bottom Left: Watch Later Clock Icon */}
                      <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 z-10">
                        <div className="w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-xs flex items-center justify-center text-white transition-colors">
                          <Clock className="w-4 h-4" />
                        </div>
                      </div>

                      {/* Bottom Right: "Tonton di YouTube" Badge */}
                      <a
                        href={`https://www.youtube.com/watch?v=${videoId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-black/75 hover:bg-black/95 backdrop-blur-xs text-white text-[11px] font-medium shadow-xs transition-colors cursor-pointer"
                        title="Buka langsung di YouTube"
                      >
                        <span>Tonton di</span>
                        <span className="font-bold flex items-center gap-1">
                          <span className="w-4 h-3 bg-red-600 rounded-[3px] flex items-center justify-center">
                            <Play className="w-2 h-2 text-white fill-white ml-0.5" />
                          </span>
                          YouTube
                        </span>
                      </a>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Kanan: Deskripsi Tentang Kami (Persis Sesuai Referensi) */}
            <div className="lg:col-span-5 flex flex-col items-start justify-center text-left">
              {/* Badge: TENTANG KAMI */}
              <span className="inline-block px-3.5 py-1 rounded-full bg-[#e0f2fe] text-[#0284c7] font-extrabold text-[11px] sm:text-xs tracking-wider uppercase mb-3 sm:mb-4">
                TENTANG KAMI
              </span>

              {/* Title: HIMASI Atma Luhur */}
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#00296E] tracking-tight mb-4 sm:mb-5 leading-tight">
                HIMASI Atma Luhur
              </h2>

              {/* Description Paragraph */}
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed mb-6 sm:mb-8 font-normal">
                Himpunan Mahasiswa Sistem Informasi Institut Sains dan Bisnis Atma Luhur adalah Lembaga Keilmuan dan Kaderisasi yang menaungi seluruh mahasiswa Program Studi Sistem Informasi ISB Atma Luhur.
              </p>

              {/* Button: → Lihat Selengkapnya */}
              <Link
                href="/tentang"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#00296E] hover:bg-[#1f4e79] text-white font-semibold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all duration-200 active:scale-95 group"
              >
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                <span>Lihat Selengkapnya</span>
              </Link>
            </div>

          </div>

          {/* Card Component Baris 1: 4 Metric Cards (Est. 2008, 7 Departments, 11 Divisions, 20+ Programs) */}
          <div className="pt-10 sm:pt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                icon: Calendar,
                title: "Est. 2010",
                subtitle: "16 tahun telah bersama dalam mengembangkan bakat dan minat.",
                iconStyle: "bg-[#0c2340] border border-[#0094E0]/40 text-[#0094E0]",
              },
              {
                icon: Users,
                title: "3 Divisi",
                subtitle: "Divisi yang telah bersatu dalam mengembangkan HIMASI.",
                iconStyle: "bg-[#0094E0] text-[#002257] shadow-md shadow-[#0094E0]/25",
              },
              {
                icon: Award,
                title: "30 Anggota Aktif",
                subtitle: "30 anggota yang aktif dalam mengembangkan HIMASI dan Sistem Informasi.",
                iconStyle: "bg-[#0c2340] border border-[#0094E0]/40 text-[#0094E0]",
              },
              {
                icon: Sparkles,
                title: "3 Program Kerja",
                subtitle: "3 program kerja utama yang telah dilaksanakan dalam mengembangkan HIMASI.",
                iconStyle: "bg-[#0094E0] text-[#002257] shadow-md shadow-[#0094E0]/25",
              },
            ].map((card, idx) => {
              const IconComponent = card.icon;
              return (
                <div
                  key={idx}
                  className="rounded-2xl bg-[#00296E] border border-white/10 p-6 sm:p-7 flex flex-col justify-between shadow-xl hover:-translate-y-1 hover:border-[#0094E0]/40 transition-all duration-300 group"
                >
                  <div className={`w-11 h-11 rounded-xl ${card.iconStyle} flex items-center justify-center transition-transform group-hover:scale-105 shrink-0`}>
                    <IconComponent className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <div className="mt-5">
                    <h4 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                      {card.title}
                    </h4>
                    <p className="text-slate-300/90 text-xs sm:text-sm mt-1.5 leading-relaxed font-normal">
                      {card.subtitle}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Card Component Baris 2: Our Mission & Our Vision (Warna Menyesuaikan Section di Atas) */}
          <div className="mt-6 sm:mt-8 grid grid-cols-1 md:grid-cols-2 rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl">
            {/* Left: Our Mission (Deep Navy #00296E) */}
            <div className="bg-[#00296E] text-white p-7 sm:p-9 lg:p-12 flex flex-col justify-center">
              <div className="flex items-center gap-3 mb-4 sm:mb-5">
                <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-[#FFFFFF]">
                  Misi Kami
                </h3>
              </div>
              <p className="text-slate-100/90 text-xs sm:text-sm md:text-base leading-relaxed">
                Mewujudkan HIMASI sebagai pusat kreativitas dan perkembangan teknologi yang kreatif, kolaboratifm dan relevant dimana setiap mahasiswa bisa berkembang bareng tanpa takut tertinggal.
              </p>
            </div>

            {/* Right: Our Vision (HIMASI Bright Cerulean Blue #0094E0) */}
            <div className="bg-[#0094E0] text-[#002257] p-7 sm:p-9 lg:p-12 flex flex-col justify-center">
              <div className="flex items-center gap-3 mb-4 sm:mb-5">
                <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-[#FFFFFF]">
                  Visi Kami
                </h3>
              </div>
              <p className="text-[#FFFFFF]/95 font-medium text-xs sm:text-sm md:text-base leading-relaxed">
                Membangun generasi teknologi yang unggul, berkarakter, dan berkontribusi positif bagi perkembangan teknologi informasi di Indonesia melalui berbagai program dan kegiatan yang bermanfaat.
              </p>
            </div>
          </div>

        </div>
      </section>
      {/* SECTION: DAFTAR FITUR UTAMA */}
      <section id="fitur-utama" className="relative py-8 sm:py-2 px-4 sm:px-6 lg:px-12 bg-white w-full overflow-hidden scroll-mt-16">
        <div className="relative max-w-6xl mx-auto">
          <div className="mb-6 sm:mb-8">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#00296E] tracking-tight">
              Daftar Fitur Utama
            </h2>
          </div>

          {/* Cards Grid: 4 Fitur Utama Persis Sesuai Referensi Gambar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {[
              {
                title: "Recruitment HIMASI",
                icon: UserPlus,
                href: "/oprec",
                status: "Coming Soon",
                statusColor: "text-[#eb5f5f]",
              },
              {
                title: "Order Baju Jurusan",
                icon: Shirt,
                href: "/order-baju",
                status: "Coming Soon",
                statusColor: "text-[#eb5f5f]",
              },
              {
                title: "Pusat Informasi",
                icon: Trophy,
                href: "/prestasi",
                status: "Coming Soon",
                statusColor: "text-[#eb5f5f]",
              },
              {
                title: "Apresia-SI",
                icon: Award,
                href: "/apresiasi",
                status: "Lihat Selengkapnya",
                statusColor: "text-[#22c55e]",
              },
            ].map((card, idx) => {
              const IconComp = card.icon;
              return (
                <Link
                  key={idx}
                  href={card.href}
                  className="group relative flex flex-col justify-between p-6 sm:p-7 min-h-[160px] sm:min-h-[175px] rounded-2xl hover:-translate-y-1.5 transition-all duration-300 select-none overflow-hidden cursor-pointer"
                  style={{
                    background: "#00296E",
                  }}
                >
                  {/* Top: Icon + Title */}
                  <div className="flex items-center gap-3.5 sm:gap-4">
                    <IconComp className="w-8 h-8 text-white stroke-[2.2] shrink-0 group-hover:scale-105 transition-transform duration-300" />
                    <h3 className="text-white font-bold text-base sm:text-lg tracking-tight leading-snug">
                      {card.title}
                    </h3>
                  </div>

                  {/* Bottom: Status Action Text */}
                  <div className="mt-auto pt-6 flex items-center justify-between">
                    <span className={`text-xs sm:text-sm font-semibold tracking-wide ${card.statusColor}`}>
                      {card.status}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>

        </div>
      </section>

      {/* Footer Section Sesuai Referensi Layout */}
      <Footer />

    </div>
  );
}
