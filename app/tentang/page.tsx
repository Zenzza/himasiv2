"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Building2,
  Headphones,
  Quote,
  ArrowRight,
  Play,
  X
} from "lucide-react";
import Footer from "@/components/footer";

const YOUTUBE_VIDEO_ID = "Q-SbWMLlmoI";

export default function TentangPage() {
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  return (
    <div className="flex flex-col w-full bg-white text-[#091e42] min-h-screen">
      
      {/* ============================================================ */}
      {/* BAGIAN 1: HERO & STAGGERED PHOTO COLLAGE (SESUAI GAMBAR ATAS) */}
      {/* ============================================================ */}
      <section className="relative pt-10 sm:pt-14 pb-16 sm:pb-20 px-4 sm:px-6 lg:px-12 w-full overflow-hidden">
        <div className="max-w-6xl mx-auto">
          
          {/* Header Area dengan Breadcrumb, Judul Tengah */}
          <div className="relative text-center max-w-2xl mx-auto mb-10 sm:mb-14">
            {/* Breadcrumb Sesuai Referensi: HOME / About Us */}
            <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">
              <Link href="/" className="text-[#0094E0] hover:underline">
                HOME
              </Link>
              <span className="text-slate-300">/</span>
              <span className="text-slate-600">ABOUT US</span>
            </div>

            {/* Judul Utama: About Us */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-[#00296E] tracking-tight leading-tight">
              About Us
            </h1>

            {/* Subjudul Sesuai Referensi */}
            <p className="mt-3 text-slate-600 text-sm sm:text-base leading-relaxed font-normal">
              Kenalan lebih dekat dengan Himpunan Mahasiswa Sistem Informasi
            </p>
          </div>

          {/* 5-Column Photo Collage Sesuai Referensi Gambar */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4.5 items-center">
            
            {/* Kolom 1: Foto Portrait Tunggal (Tinggi) */}
            <div className="col-span-1 h-[280px] sm:h-[350px] lg:h-[380px] rounded-[22px] sm:rounded-[26px] overflow-hidden bg-slate-100 border border-slate-100 shadow-sm hover:shadow-md transition-all group">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=800&auto=format&fit=crop"
                alt="Anggota HIMASI"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>

            {/* Kolom 2: 2 Foto Ditumpuk + Floating Quote Pill di Bawah */}
            <div className="col-span-1 flex flex-col gap-3.5 sm:gap-4.5 relative">
              <div className="h-[135px] sm:h-[170px] lg:h-[185px] rounded-[20px] sm:rounded-[24px] overflow-hidden bg-slate-100 border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                <img
                  src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=800&auto=format&fit=crop"
                  alt="Kolaborasi HIMASI"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="h-[135px] sm:h-[170px] lg:h-[185px] rounded-[20px] sm:rounded-[24px] overflow-hidden bg-slate-100 border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                <img
                  src="https://images.unsplash.com/photo-1531482615713-2afd69097998?q=80&w=800&auto=format&fit=crop"
                  alt="Diskusi Tim HIMASI"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
            </div>

            {/* Kolom 3: Foto Portrait Tengah (Focal Point, Sedikit Lebih Tinggi) */}
            <div className="col-span-1 hidden md:block h-[310px] sm:h-[390px] lg:h-[420px] rounded-[24px] sm:rounded-[28px] overflow-hidden bg-slate-100 border border-slate-100 shadow-md hover:shadow-lg transition-all group lg:translate-y-2">
              <img
                src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=800&auto=format&fit=crop"
                alt="Pimpinan HIMASI"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>

            {/* Kolom 4: 2 Foto Ditumpuk */}
            <div className="col-span-1 hidden md:flex flex-col gap-3.5 sm:gap-4.5">
              <div className="h-[135px] sm:h-[170px] lg:h-[185px] rounded-[20px] sm:rounded-[24px] overflow-hidden bg-slate-100 border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                <img
                  src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=800&auto=format&fit=crop"
                  alt="Aktivitas Mahasiswa SI"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="h-[135px] sm:h-[170px] lg:h-[185px] rounded-[20px] sm:rounded-[24px] overflow-hidden bg-slate-100 border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                <img
                  src="https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=800&auto=format&fit=crop"
                  alt="Rapat Kerja HIMASI"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
            </div>

            {/* Kolom 5: Foto Portrait Tunggal (Tinggi) */}
            <div className="col-span-1 hidden lg:block h-[280px] sm:h-[350px] lg:h-[380px] rounded-[22px] sm:rounded-[26px] overflow-hidden bg-slate-100 border border-slate-100 shadow-sm hover:shadow-md transition-all group">
              <img
                src="https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=800&auto=format&fit=crop"
                alt="Forum HIMASI"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>

          </div>

        </div>
      </section>

      {/* ============================================================ */}
      {/* BAGIAN 2: DETAIL TENTANG KAMI & BANNER VIDEO (SESUAI GAMBAR BAWAH) */}
      {/* ============================================================ */}
      <section className="relative py-12 sm:py-18 px-4 sm:px-6 lg:px-12 bg-slate-50/50 w-full border-t border-slate-100">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            
            {/* SISI KIRI (lg:col-span-6): DUA KARTU FOTO MENUMPUK & MIRING SESUAI REFERENSI GAMBAR */}
            <div className="lg:col-span-6 relative flex items-center justify-center py-4 sm:py-6 lg:py-8">
              
              {/* Efek Ambient Glow Halus di Belakang Foto */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[85%] h-[85%] bg-sky-200/35 rounded-full blur-3xl -z-10 pointer-events-none" />

              <div className="relative w-full max-w-[460px] sm:max-w-[500px]">
                
                {/* KARTU 1 (ATAS - KANAN): Miring ke kanan, bingkai putih tebal & bayangan halus */}
                <div className="w-[84%] sm:w-[85%] ml-auto relative z-10 rotate-[3.5deg] transition-all duration-500 ease-out hover:rotate-[1.5deg] hover:scale-[1.02] group">
                  <div className="p-2 sm:p-2.5 md:p-3 bg-white rounded-[24px] sm:rounded-[32px] shadow-[0_20px_50px_rgba(0,41,110,0.16)] border border-slate-100/90">
                    <div className="aspect-[16/11] w-full rounded-[18px] sm:rounded-[24px] overflow-hidden bg-slate-100">
                      <img
                        src="/hero-banner.png"
                        alt="HIMASI Atma Luhur"
                        className="w-full h-full object-cover object-[center_60%] group-hover:scale-105 transition-transform duration-700"
                      />
                    </div>
                  </div>
                </div>

                {/* KARTU 2 (BAWAH - KIRI): Menumpuk di atas kartu 1, miring sejajar, berbingkai putih tebal */}
                <div className="w-[84%] sm:w-[85%] -mt-24 sm:-mt-32 mr-auto relative z-20 rotate-[3.5deg] transition-all duration-500 ease-out hover:rotate-[2deg] hover:scale-[1.03] group">
                  <div className="p-2 sm:p-2.5 md:p-3 bg-white rounded-[24px] sm:rounded-[32px] shadow-[0_25px_60px_rgba(0,41,110,0.22)] border border-slate-100/90">
                    <div className="aspect-[16/11] w-full rounded-[18px] sm:rounded-[24px] overflow-hidden bg-slate-100">
                      <img
                        src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=1200&auto=format&fit=crop"
                        alt="Aktivitas dan Kolaborasi Mahasiswa HIMASI"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* SISI KANAN (lg:col-span-6): TEKS UTAMA TENTANG KAMI */}
            <div className="lg:col-span-6 flex flex-col justify-center gap-5 sm:gap-6">
              
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00296E]/5 border border-[#00296E]/10 mb-3 w-fit">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0094E0]" />
                  <span className="text-xs font-bold text-[#00296E] uppercase tracking-wider">
                    Tentang Kami
                  </span>
                </div>
                
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#00296E] tracking-tight leading-[1.2] mb-4">
                  Himpunan Mahasiswa Sistem Informasi
                </h2>

                <p className="text-slate-600 text-xs sm:text-sm md:text-base leading-relaxed font-normal mb-4">
                  HIMASI (Himpunan Mahasiswa Sistem Informasi) adalah wadah pengembangan diri mahasiswa Sistem Informasi di ISB Atma Luhur. HIMASI menjembatani mahasiswa dengan dunia akademik, industri, dan masyarakat melalui berbagai program kerja yang terstruktur.
                </p>

                <p className="text-slate-600 text-xs sm:text-sm md:text-base leading-relaxed font-normal">
                  Kegiatan seperti seminar, workshop, dan pelatihan teknis diselenggarakan secara berkelanjutan untuk meningkatkan kompetensi anggotanya. HIMASI juga aktif dalam pengabdian masyarakat dan mendorong mahasiswa untuk berkontribusi secara nyata. Bergabung di HIMASI berarti membangun integritas, kreativitas, dan rasa peduli.
                </p>
              </div>

              {/* Highlight Statistik & Tombol Video */}
              <div className="pt-4 border-t border-slate-200/80 flex flex-wrap items-center gap-6">
                <div className="flex items-center gap-3 pr-6 border-r border-slate-200">
                  <span className="text-3xl sm:text-4xl font-black text-[#00296E]">16+</span>
                  <span className="text-xs sm:text-sm text-slate-500 font-medium leading-snug">
                    Tahun Berdiri &<br />Mengabdi
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setIsVideoModalOpen(true)}
                  className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-[#00296E] hover:bg-[#001f52] text-white text-xs sm:text-sm font-semibold transition-all shadow-md hover:shadow-lg hover:translate-y-[-1px] group cursor-pointer"
                >
                  <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Play className="w-3 h-3 fill-white text-white ml-0.5" />
                  </div>
                  <span>Tonton Video Profil</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MODAL VIDEO POPUP KETIKA TOMBOL PLAY DIKLIK */}
      {isVideoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div
            className="fixed inset-0"
            onClick={() => setIsVideoModalOpen(false)}
          />
          <div className="relative w-full max-w-4xl aspect-video rounded-3xl overflow-hidden bg-black shadow-2xl z-10 border border-white/20">
            <button
              type="button"
              onClick={() => setIsVideoModalOpen(false)}
              className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-black/60 hover:bg-black text-white flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Tutup Video"
            >
              <X className="w-5 h-5" />
            </button>
            <iframe
              className="w-full h-full"
              src={`https://www.youtube.com/embed/${YOUTUBE_VIDEO_ID}?autoplay=1&rel=0`}
              title="Company Profile HIMASI Atma Luhur"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}

      {/* FOOTER SESUAI DENGAN HOMEPAGE & HALAMAN LAIN */}
      <Footer />

    </div>
  );
}
