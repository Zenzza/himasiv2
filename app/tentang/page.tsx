"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Building2,
  Headphones,
  Quote,
  ArrowRight,
  Play,
  X,
  Calendar,
  Users,
  Award,
  Globe,
  Compass,
  Sparkles,
  HeartHandshake,
  Rocket,
  CheckCircle2,
  Layers,
  Lightbulb,
  Target,
  MapPin,
  ArrowUpRight
} from "lucide-react";
import Footer from "@/components/footer";
import ScrollReveal from "@/components/scroll-reveal";

const YOUTUBE_VIDEO_ID = "Q-SbWMLlmoI";

const LOGO_ELEMENTS = [
  {
    id: 0,
    shortName: "Tulisan HIMASI",
    title: "Tulisan HIMASI (Warna Putih & Biru)",
    description:
      "Tulisan HIMASI dengan warna putih dan biru melambangkan Himpunan Mahasiswa Sistem Informasi ISB Atma Luhur.",
    pins: [{ top: "24%", left: "50%" }],
    primaryPin: { top: 24, left: 50 },
  },
  {
    id: 1,
    shortName: "2 (Dua) Buku",
    title: "Gambar 2 (Dua) Buku",
    description:
      "Gambar 2 (dua) buku dengan warna putih dan biru melambangkan ilmu pengetahuan yang terus berkembang.",
    pins: [{ top: "43%", left: "74%" }],
    primaryPin: { top: 43, left: 74 },
  },
  {
    id: 2,
    shortName: "Pagoda S & I",
    title: "Tulisan S & I Berbentuk Pagoda",
    description:
      "Tulisan S dan I yaitu melambangkan Jurusan Sistem Informasi berbentuk pagoda yang melambangkan memiliki VISI yang tinggi untuk dicapai.",
    pins: [{ top: "58%", left: "50%" }],
    primaryPin: { top: 58, left: 50 },
  },
  {
    id: 3,
    shortName: "Perisai Biru Tua",
    title: "Gambar Perisai Berwarna Biru Tua",
    description:
      "Gambar perisai berwarna biru tua melambangkan pertahanan Himpunan yang kokoh baik dari internal maupun eksternal serta mencapai tujuan dengan cara yang baik, jujur, dan bersahabat.",
    pins: [{ top: "37%", left: "49%" }],
    primaryPin: { top: 37, left: 49 },
  },
  {
    id: 4,
    shortName: "Pita Persatuan",
    title: "Gambar Pita",
    description:
      "Gambar pita yang melambangkan persatuan dan keramahan antar anggota.",
    pins: [{ top: "66%", left: "86%" }],
    primaryPin: { top: 66, left: 86 },
  },
  {
    id: 5,
    shortName: "Teks Himpunan",
    title: "Tulisan Himpunan Mahasiswa Sistem Informasi",
    description:
      "Tulisan Himpunan Mahasiswa Sistem Informasi dengan warna hitam.",
    pins: [{ top: "72.5%", left: "50%" }],
    primaryPin: { top: 72.5, left: 50 },
  },
  {
    id: 6,
    shortName: "ISB Atma Luhur",
    title: "Tulisan ISB Atma Luhur",
    description:
      "Tulisan ISB Atma Luhur dengan warna hitam melambangkan Sekolah Tinggi yang menaungi HIMASI.",
    pins: [{ top: "76.2%", left: "50%" }],
    primaryPin: { top: 76.2, left: 50 },
  },
];

const CONTACT_CHANNELS = [
  {
    id: "instagram",
    name: "Instagram",
    handle: "@himasi.atmaluhur",
    url: "https://instagram.com/himasi.atmaluhur",
    accentColor: "hover:border-[#E1306C]/40 hover:shadow-pink-500/10",
    iconBg: "bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white shadow-pink-500/25",
  },
  {
    id: "tiktok",
    name: "TikTok",
    handle: "@himasi.atmaluhur",
    url: "https://tiktok.com/@himasi.atmaluhur",
    accentColor: "hover:border-slate-800/40 hover:shadow-slate-900/10",
    iconBg: "bg-slate-950 text-white shadow-slate-900/25",
  },
  {
    id: "youtube",
    name: "YouTube",
    handle: "HIMASI Atma Luhur",
    url: "https://youtube.com/@himasiatmaluhur",
    accentColor: "hover:border-red-500/40 hover:shadow-red-500/10",
    iconBg: "bg-[#FF0000] text-white shadow-red-500/25",
  },
  {
    id: "website",
    name: "Website",
    handle: "himasi.atmaluhur.ac.id",
    url: "https://himasi.atmaluhur.ac.id",
    accentColor: "hover:border-[#0094E0]/40 hover:shadow-sky-500/10",
    iconBg: "bg-gradient-to-tr from-[#00296E] to-[#0094E0] text-white shadow-sky-500/25",
  },
  {
    id: "alamat",
    name: "Alamat",
    handle: "ISB Atma Luhur Pangkalpinang",
    url: "https://maps.google.com/?q=ISB+Atma+Luhur+Pangkalpinang",
    accentColor: "hover:border-[#00296E]/40 hover:shadow-blue-900/10",
    iconBg: "bg-[#00296E] text-white shadow-blue-900/25",
  },
  {
    id: "whatsapp",
    name: "WhatsApp",
    handle: "+62 812-3456-7890",
    url: "https://wa.me/6281234567890?text=Halo%20HIMASI%20ISB%20Atma%20Luhur,%20saya%20ingin%20bertanya",
    accentColor: "hover:border-emerald-500/40 hover:shadow-emerald-500/10",
    iconBg: "bg-[#25D366] text-white shadow-emerald-500/25",
  },
];

export default function TentangPage() {
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [hoveredLogoElement, setHoveredLogoElement] = useState<number | null>(null);

  const activeElement = hoveredLogoElement !== null ? LOGO_ELEMENTS[hoveredLogoElement] : null;
  const targetPin = activeElement?.primaryPin;
  const pinX = targetPin ? 9 + 0.82 * targetPin.left : 50;
  const pinY = targetPin ? 9 + 0.82 * targetPin.top : 50;

  return (
    <div className="flex flex-col w-full bg-white text-[#091e42] min-h-screen">
      
      {/* ============================================================ */}
      {/* BAGIAN 1: HERO & STAGGERED PHOTO COLLAGE (SESUAI GAMBAR ATAS) */}
      {/* ============================================================ */}
      <section className="relative pt-10 sm:pt-14 pb-16 sm:pb-20 px-4 sm:px-6 lg:px-12 w-full overflow-hidden">
        <ScrollReveal className="max-w-6xl mx-auto">
          
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
              Tentang HIMASI
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

        </ScrollReveal>
      </section>

      {/* ============================================================ */}
      {/* BAGIAN 2: DETAIL TENTANG KAMI & BANNER VIDEO (SESUAI GAMBAR BAWAH) */}
      {/* ============================================================ */}
      <section className="relative py-12 sm:py-18 px-4 sm:px-6 lg:px-12 bg-white w-full">
        <ScrollReveal className="max-w-6xl mx-auto">
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
        </ScrollReveal>
      </section>

      {/* ============================================================ */}
      {/* BAGIAN 3: HIMASI DALAM ANGKA & VISI MISI */}
      {/* ============================================================ */}
      <section className="relative py-14 sm:py-20 px-4 sm:px-6 lg:px-12 bg-white w-full">
        <ScrollReveal className="max-w-6xl mx-auto">
          
          {/* Baris 1: HIMASI dalam Angka + 3 Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 items-stretch">
            
            {/* Kolom Kiri: Header 'HIMASI dalam Angka' */}
            <div className="sm:col-span-2 lg:col-span-1 flex flex-col justify-center py-2 pr-2">
              <div className="text-3xl sm:text-4xl font-extrabold text-[#00296E] uppercase tracking-tight">
                HIMASI
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#00296E] leading-tight">
                dalam <span className="text-[#0094E0]">Angka</span>
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-2.5 leading-relaxed font-normal">
                Lebih dari sekadar angka, ini adalah tentang perjalanan dan kontribusi.
              </p>
            </div>

            {/* Kolom Kanan: 3 Metric Cards */}
            {[
              {
                icon: Calendar,
                title: "Est. 2010",
                subtitle: "16 tahun telah bersama dalam mengembangkan bakat dan minat mahasiswa Sistem Informasi.",
                iconStyle: "bg-[#0c2340] border border-[#0094E0]/40 text-[#0094E0]",
              },
              {
                icon: Users,
                title: "3 Divisi",
                subtitle: "Divisi yang telah bersatu dalam mengembangkan HIMASI dan Sistem Informasi.",
                iconStyle: "bg-[#0094E0] text-[#002257] shadow-md shadow-[#0094E0]/25",
              },
              {
                icon: Award,
                title: "30 Anggota Aktif",
                subtitle: "30 anggota yang aktif dalam mengembangkan HIMASI dan Sistem Informasi.",
                iconStyle: "bg-[#0c2340] border border-[#0094E0]/40 text-[#0094E0]",
              },
            ].map((card, idx) => {
              const IconComponent = card.icon;
              return (
                <ScrollReveal
                  key={idx}
                  direction="card-pop"
                  delay={idx * 160}
                  className="h-full"
                >
                  <div
                    className="h-full relative rounded-2xl sm:rounded-3xl bg-[#00296E] border border-white/10 p-5 sm:p-6 flex flex-col justify-between shadow-xl hover:-translate-y-1 hover:border-[#0094E0]/40 transition-all duration-300 group"
                  >
                    {/* Top Row: Icon Container */}
                    <div className="flex items-center justify-between mb-4">
                      <div className={`w-11 h-11 rounded-xl ${card.iconStyle} flex items-center justify-center transition-transform group-hover:scale-105 shrink-0`}>
                        <IconComponent className="w-5 h-5 stroke-[2.2]" />
                      </div>
                    </div>

                    {/* Content: Title & Subtitle */}
                    <div>
                      <h4 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                        {card.title}
                      </h4>
                      <p className="text-slate-300/90 text-xs mt-2 leading-relaxed font-normal">
                        {card.subtitle}
                      </p>
                    </div>
                  </div>
                </ScrollReveal>
              );
            })}

          </div>

          {/* ============================================================ */}
          {/* HEADER VISI & MISI: LANDASAN FILOSOFIS & KOMPAS STRATEGIS */}
          {/* ============================================================ */}
          <div className="mt-16 sm:mt-24 mb-10 sm:mb-14 text-center max-w-3xl mx-auto">
          </div>

          {/* ============================================================ */}
          {/* SUB-SECTION 1: VISI HIMASI (DUAL NORTH STAR BENTO CARDS) */}
          {/* ============================================================ */}
          <div className="mb-14 sm:mb-20">
            {/* Section Tag */}
            <div className="text-center mb-6 sm:mb-8">
              <h3 className="text-xl sm:text-4xl font-black text-[#00296E] tracking-tight">
                Visi HIMASI
              </h3>
            </div>

            {/* 2 Visi Bento Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-stretch">
              
              {/* CARD VISI 1 */}
              <div className="relative rounded-[28px] sm:rounded-[32px] bg-[#00296E] p-7 sm:p-9 text-white shadow-xl border border-white/10 overflow-hidden flex flex-col justify-between group hover:border-[#0094E0]/40 transition-all duration-300">
                {/* Giant watermark number */}
                <span className="absolute -bottom-6 -right-3 text-[140px] font-black text-white/[0.04] select-none pointer-events-none font-mono leading-none">
                  01
                </span>

                <div className="relative z-10">
                  {/* Headline */}
                  <h4 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-snug mb-4">
                    Organisasi Unggul Komputer &amp; Teknologi di Era Globalisasi
                  </h4>

                  {/* Verbatim Vision Statement 1 */}
                  <p className="text-slate-200/95 text-sm sm:text-base leading-relaxed font-normal">
                    &ldquo;Menjadikan HIMASI (Himpunan Mahasiswa Sistem Informasi) ISB Atma Luhur Pangkalpinang sebagai <strong className="text-white font-bold underline decoration-sky-400/50 underline-offset-4">organisasi unggul dalam hal dunia Komputer &amp; Teknologi</strong> untuk menjawab tantangan yang kompleks di era Globalisasi khususnya di <strong className="text-white font-bold">Provinsi Bangka Belitung</strong>.&rdquo;
                  </p>
                </div>
              </div>

              {/* CARD VISI 2 */}
              <div className="relative rounded-[28px] sm:rounded-[32px] bg-[#00296E] p-7 sm:p-9 text-white shadow-xl border border-white/10 overflow-hidden flex flex-col justify-between group hover:border-[#0094E0]/40 transition-all duration-300">
                {/* Giant watermark number */}
                <span className="absolute -bottom-6 -right-3 text-[140px] font-black text-white/[0.04] select-none pointer-events-none font-mono leading-none">
                  02
                </span>

                <div className="relative z-10">
                  {/* Headline */}
                  <h4 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-snug mb-4">
                    Wadah Budi Pekerti, Inovatif, Kreatif, &amp; Intelektual
                  </h4>

                  {/* Verbatim Vision Statement 2 */}
                  <p className="text-slate-200/95 text-sm sm:text-base leading-relaxed font-normal">
                    &ldquo;Menjadikan HIMASI ISB Atma Luhur sebagai wadah yang membawa <strong className="text-white font-bold underline decoration-emerald-400/50 underline-offset-4">budi pekerti, inovatif, kreatif, dan intelektual</strong> bagi Mahasiswa Jurusan Sistem Informasi khususnya dan kampus ISB Atma Luhur Pangkalpinang pada umumnya.&rdquo;
                  </p>
                </div>
              </div>

            </div>
          </div>

          {/* ============================================================ */}
          {/* SUB-SECTION 2: MISI HIMASI (3 ACTION PILLAR CARDS) */}
          {/* ============================================================ */}
          <div>
            {/* Section Tag */}
            <div className="text-center mb-6 sm:mb-8">
              <h3 className="text-xl sm:text-4xl font-black text-[#00296E] tracking-tight">
                Misi HIMASI
              </h3>
            </div>

            {/* 3 Misi Cards with Connected Flow */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-7 items-stretch">
              
              {/* MISI 1 */}
              <div className="relative rounded-[26px] sm:rounded-[30px] bg-white border border-slate-200/90 p-7 sm:p-8 flex flex-col justify-between shadow-[0_10px_30px_rgba(0,41,110,0.06)] hover:shadow-[0_20px_45px_rgba(0,41,110,0.13)] hover:-translate-y-2 transition-all duration-300 group">
                <div>
                  {/* Row: Number & Icon */}
                  <div className="flex items-center justify-between mb-6">
                    <span className="w-12 h-12 rounded-2xl bg-[#00296E] text-white font-mono font-black text-lg flex items-center justify-center shadow-md shadow-[#00296E]/20 group-hover:scale-110 transition-transform">
                      01
                    </span>
                  </div>

                  {/* Title Highlight */}
                  <h4 className="text-lg sm:text-xl font-bold text-[#00296E] tracking-tight mb-3 group-hover:text-[#0094E0] transition-colors leading-snug">
                    Perkembangan Komputer &amp; Teknologi Masyarakat
                  </h4>

                  {/* Verbatim Mission 1 */}
                  <p className="text-slate-600 text-xs sm:text-sm leading-relaxed font-normal">
                    &ldquo;Menciptakan mahasiswa ISB Atma Luhur yang memiliki wadah organisasi dalam hal perkembangan komputer dan teknologi di dalam lingkungan terutama masyarakat.&rdquo;
                  </p>
                </div>
              </div>

              {/* MISI 2 */}
              <div className="relative rounded-[26px] sm:rounded-[30px] bg-white border border-slate-200/90 p-7 sm:p-8 flex flex-col justify-between shadow-[0_10px_30px_rgba(0,41,110,0.06)] hover:shadow-[0_20px_45px_rgba(0,41,110,0.13)] hover:-translate-y-2 transition-all duration-300 group">
                {/* Top Accent Strip */}
                <div>
                  {/* Row: Number & Icon */}
                  <div className="flex items-center justify-between mb-6">
                    <span className="w-12 h-12 rounded-2xl bg-[#002257] text-white font-mono font-black text-lg flex items-center justify-center shadow-md shadow-[#002257]/20 group-hover:scale-110 transition-transform">
                      02
                    </span>
                  </div>
                  <h4 className="text-lg sm:text-xl font-bold text-[#00296E] tracking-tight mb-3 group-hover:text-[#0094E0] transition-colors leading-snug">
                    Kepekaan &amp; Kebersamaan Mahasiswa
                  </h4>

                  {/* Verbatim Mission 2 */}
                  <p className="text-slate-600 text-xs sm:text-sm leading-relaxed font-normal">
                    &ldquo;Menerapkan kepekaan saling menjaga kebersamaan di antara mahasiswa terutama mahasiswa jurusan sistem informasi.&rdquo;
                  </p>
                </div>
              </div>

              {/* MISI 3 */}
              <div className="relative rounded-[26px] sm:rounded-[30px] bg-white border border-slate-200/90 p-7 sm:p-8 flex flex-col justify-between shadow-[0_10px_30px_rgba(0,41,110,0.06)] hover:shadow-[0_20px_45px_rgba(0,41,110,0.13)] hover:-translate-y-2 transition-all duration-300 group">
                {/* Top Accent Strip */}
                <div>
                  {/* Row: Number & Icon */}
                  <div className="flex items-center justify-between mb-6">
                    <span className="w-12 h-12 rounded-2xl bg-[#001B4A] text-white font-mono font-black text-lg flex items-center justify-center shadow-md shadow-[#001B4A]/20 group-hover:scale-110 transition-transform">
                      03
                    </span>
                  </div>
                  <h4 className="text-lg sm:text-xl font-bold text-[#00296E] tracking-tight mb-3 group-hover:text-[#0094E0] transition-colors leading-snug">
                    Inovatif &amp; Jiwa Berkarya Multitalenta
                  </h4>

                  {/* Verbatim Mission 3 */}
                  <p className="text-slate-600 text-xs sm:text-sm leading-relaxed font-normal">
                    &ldquo;Menciptakan Mahasiswa yang intelektual, inovatif dan jiwa berkarya yang tidak hanya dalam dunia komputer namun juga di bidang lain.&rdquo;
                  </p>
                </div>
              </div>

            </div>
          </div>

          {/* ============================================================ */}
          {/* SUB-SECTION 3: MOTTO HIMASI */}
          {/* ============================================================ */}
          <div className="mt-14 sm:mt-20">
            {/* Section Tag */}
            <div className="text-center mb-6 sm:mb-8">
              <h3 className="text-xl sm:text-4xl font-black text-[#00296E] tracking-tight">
                Motto HIMASI
              </h3>
            </div>

            {/* Motto Card - Style seragam dengan kartu Visi */}
            <div className="relative rounded-[28px] sm:rounded-[32px] bg-[#00296E] p-7 sm:p-10 text-white shadow-xl border border-white/10 overflow-hidden text-center group hover:border-[#0094E0]/40 transition-all duration-300">
              <p className="text-lg sm:text-2xl md:text-3xl font-black text-white tracking-tight leading-snug sm:leading-relaxed">
                &ldquo;MENJEMBATANI TEKNOLOGI DAN STRATEGI, MEMBANGUN MASA DEPAN&rdquo;
              </p>
            </div>
          </div>

        </ScrollReveal>
      </section>

      {/* ============================================================ */}
      {/* BAGIAN 4: FILOSOFI LOGO HIMASI */}
      {/* Logo di Kiri & Teks di Kanan, Style & Warna Seragam, Background Putih */}
      {/* ============================================================ */}
      <section className="relative py-16 sm:py-24 px-4 sm:px-6 lg:px-12 bg-white w-full overflow-hidden">
        <ScrollReveal className="max-w-6xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            
            {/* ======================================================== */}
            {/* SISI KIRI (lg:col-span-5): LOGO BERSIH TANPA SEGI LIMA + POPUP HANYA MUNCUL SAAT HOVER */}
            {/* ======================================================== */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center relative">
              <div className="relative w-full max-w-[350px] sm:max-w-[370px] aspect-square flex items-center justify-center p-2">
                
                {/* SVG Garis Penghubung (Connector Line) & Target Ring di Desktop - HANYA MUNCUL SAAT HOVER */}
                {activeElement && (
                  <svg
                    viewBox="0 0 100 100"
                    className="hidden lg:block absolute inset-0 w-full h-full pointer-events-none z-20 overflow-visible"
                  >
                    {/* Garis Penghubung dari Tepi Popup ke Titik Pin Aktif */}
                    <line
                      x1={pinY < 32 ? 44 : Math.max(48, Math.min(78, pinX))}
                      y1={pinY < 32 ? pinY : 32}
                      x2={pinX}
                      y2={pinY}
                      stroke="#0094E0"
                      strokeWidth="2"
                      strokeDasharray="4 3"
                      className="transition-all duration-300"
                    />
                    {/* Lingkaran Target Berwarna Biru Langit pada Titik Aktif (Sesuai Referensi) */}
                    <circle
                      cx={pinX}
                      cy={pinY}
                      r="4.5"
                      fill="none"
                      stroke="#0094E0"
                      strokeWidth="2"
                      className="transition-all duration-300"
                    />
                    <circle
                      cx={pinX}
                      cy={pinY}
                      r="2"
                      fill="#0094E0"
                      className="transition-all duration-300"
                    />
                  </svg>
                )}

                {/* Wadah Logo HIMASI Bersih (Tanpa Segi Lima) */}
                <div className="relative w-[84%] h-[84%] flex items-center justify-center">
                  <img
                    src="/logo-himasi.png"
                    alt="Lambang HIMASI ISB Atma Luhur"
                    className="w-full h-full object-contain filter drop-shadow-[0_12px_24px_rgba(0,41,110,0.12)] select-none pointer-events-none"
                    draggable={false}
                  />

                  {/* Hotspots Pin Penunjuk Elemen Filosofi */}
                  {LOGO_ELEMENTS.map((element, elemIdx) => {
                    const isHovered = hoveredLogoElement === elemIdx;
                    return element.pins.map((pin, pIdx) => (
                      <button
                        key={`${elemIdx}-${pIdx}`}
                        type="button"
                        onMouseEnter={() => setHoveredLogoElement(elemIdx)}
                        onMouseLeave={() => setHoveredLogoElement(null)}
                        style={{ top: pin.top, left: pin.left }}
                        className="absolute -translate-x-1/2 -translate-y-1/2 z-30 flex items-center justify-center transition-all duration-300 group cursor-pointer focus:outline-none"
                        aria-label={`Pilih filosofi ${element.shortName}`}
                        title={element.shortName}
                      >
                        {isHovered ? (
                          <span className="relative flex h-6 w-6 items-center justify-center">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-4 w-4 bg-[#0094E0] border-2 border-white shadow-[0_0_12px_rgba(0,148,224,0.8)] items-center justify-center">
                              <span className="w-1.5 h-1.5 rounded-full bg-white" />
                            </span>
                          </span>
                        ) : (
                          <span className="w-3.5 h-3.5 rounded-full bg-rose-500/85 hover:bg-rose-600 border-2 border-white hover:scale-130 transition-all shadow-md flex items-center justify-center group-hover:shadow-[0_0_10px_rgba(225,29,72,0.6)]">
                            <span className="w-1 h-1 rounded-full bg-white/90" />
                          </span>
                        )}
                      </button>
                    ));
                  })}
                </div>

                {/* Floating Popup Card di Desktop - HANYA MUNCUL SAAT DIHOVER */}
                {activeElement && (
                  <div
                    className="hidden lg:block absolute z-30 transition-all duration-300 pointer-events-auto"
                    onMouseEnter={() => setHoveredLogoElement(activeElement.id)}
                    onMouseLeave={() => setHoveredLogoElement(null)}
                    style={{
                      top: "-36px",
                      right: "-68px",
                      width: "275px",
                    }}
                  >
                    <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-[0_16px_36px_rgba(0,41,110,0.14)] border border-sky-100/90 relative animate-in fade-in zoom-in-95 duration-150">
                      <h4 className="text-sm sm:text-base font-bold text-[#00296E] tracking-tight leading-snug">
                        {activeElement.title}
                      </h4>
                      <p className="text-slate-600 text-xs sm:text-[13px] leading-relaxed mt-1.5 font-normal">
                        {activeElement.description}
                      </p>
                    </div>
                  </div>
                )}

              </div>

              {/* Popup Penjelasan di Layar Mobile & Tablet - HANYA MUNCUL SAAT DIHOVER */}
              {activeElement && (
                <div className="lg:hidden w-full max-w-[380px] mx-auto mt-4 bg-white rounded-2xl p-4.5 shadow-[0_12px_30px_rgba(0,41,110,0.1)] border border-sky-100/90 transition-all duration-200 animate-in fade-in duration-150">
                  <h4 className="text-sm sm:text-base font-bold text-[#00296E] tracking-tight leading-snug">
                    {activeElement.title}
                  </h4>
                  <p className="text-slate-600 text-xs sm:text-sm leading-relaxed mt-1.5 font-normal">
                    {activeElement.description}
                  </p>
                </div>
              )}

              {/* Petunjuk Interaksi */}
              <p className="text-[11px] sm:text-xs text-slate-400 text-center mt-3 font-medium">
                Tip: Arahkan kursor (hover) pada titik lambang atau tombol di samping
              </p>
            </div>

            {/* ======================================================== */}
            {/* SISI KANAN (lg:col-span-7): JUDUL, DESKRIPSI & PILLS PILIHAN */}
            {/* ======================================================== */}
            <div className="lg:col-span-7 flex flex-col justify-center">
              
              {/* Badge Tag */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00296E]/5 border border-[#00296E]/10 mb-3 w-fit">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0094E0]" />
                <span className="text-xs font-bold text-[#00296E] uppercase tracking-wider">
                  Makna &amp; Filosofi
                </span>
              </div>

              {/* Judul: Filosofi Lambang Himasi (Gaya Font Sesuai Referensi) */}
              <div className="mb-4">
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#00296E] tracking-tight leading-[1.1]">
                  Filosofi Lambang
                </h2>
                <span className="block text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#00296E] mt-0.5 sm:mt-1">
                  HIMASI
                </span>
              </div>

              {/* Deskripsi Pengantar Sesuai Referensi */}
              <p className="text-slate-600 text-xs sm:text-sm md:text-base leading-relaxed font-normal mb-6 max-w-xl">
                Setiap elemen memiliki makna filosofis yang mendalam. Temukan arti di balik simbol-simbol yang membentuk identitas HIMASI ISB Atma Luhur.
              </p>

              {/* Daftar Pills Pilihan Elemen Sesuai Referensi Gambar */}
              <div className="flex flex-wrap gap-2 sm:gap-2.5">
                {LOGO_ELEMENTS.map((elem, idx) => {
                  const isHovered = hoveredLogoElement === idx;
                  return (
                    <button
                      key={elem.id}
                      type="button"
                      onMouseEnter={() => setHoveredLogoElement(idx)}
                      onMouseLeave={() => setHoveredLogoElement(null)}
                      className={`px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer border ${
                        isHovered
                          ? "bg-[#00296E] text-white border-[#00296E] shadow-md shadow-[#00296E]/20 scale-[1.02]"
                          : "bg-[#f0f7fd] text-[#00296E] border-sky-100 hover:bg-sky-100/80 hover:border-sky-200 hover:text-[#001f52]"
                      }`}
                    >
                      {elem.shortName}
                    </button>
                  );
                })}
              </div>

            </div>

          </div>
        </ScrollReveal>
      </section>

      {/* ============================================================ */}
      {/* BAGIAN 5: KONTAK KAMI & MEDIA SOSIAL */}
      {/* ============================================================ */}
      <section id="ko"className="relative py-16 sm:py-24 px-4 sm:px-6 lg:px-12 bg-gradient-to-b from-white via-[#f7faff] to-white w-full">
        <ScrollReveal className="max-w-6xl mx-auto">
          
          {/* Header Section: Hubungi Kami */}
          <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">            
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#00296E] tracking-tight leading-[1.15]">
              Kontak &amp; Media Sosial
            </h2>
            
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed mt-3.5 font-normal">
              Terhubung dengan HIMASI ISB Atma Luhur melalui kanal resmi media sosial, portal web, layanan helpdesk mahasiswa, dan sekretariat himpunan.
            </p>
          </div>

          {/* Grid 6 Kartu Kontak & Media Sosial (Hanya Nama Media Sosial & Nama Akun) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {CONTACT_CHANNELS.map((channel, idx) => (
              <ScrollReveal key={channel.id} delay={(idx % 3) * 100}>
                <a
                  href={channel.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`group relative flex items-center justify-between p-5 sm:p-6 rounded-[22px] bg-white border border-slate-200/80 shadow-sm hover:shadow-lg transition-all duration-300 ${channel.accentColor} hover:-translate-y-1`}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    {/* Icon Media Sosial */}
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-md ${channel.iconBg} transition-transform duration-300 group-hover:scale-105`}>
                      {channel.id === "instagram" && (
                        <svg className="w-5 h-5 fill-none stroke-current stroke-[2]" viewBox="0 0 24 24">
                          <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                        </svg>
                      )}
                      {channel.id === "tiktok" && (
                        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.89 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.3 0 .58.05.85.14V9.45a6.37 6.37 0 0 0-.85-.06A6.34 6.34 0 0 0 3 15.73 6.34 6.34 0 0 0 9.34 22a6.34 6.34 0 0 0 6.34-6.27V9.06a8.28 8.28 0 0 0 3.91 1V6.69z" />
                        </svg>
                      )}
                      {channel.id === "youtube" && (
                        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                        </svg>
                      )}
                      {channel.id === "website" && (
                        <Globe className="w-5 h-5 text-white" />
                      )}
                      {channel.id === "alamat" && (
                        <MapPin className="w-5 h-5 text-white" />
                      )}
                      {channel.id === "whatsapp" && (
                        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                          <path d="M20.52 3.48A11.93 11.93 0 0 0 12.06 0C5.46 0 .09 5.37.09 11.97c0 2.11.55 4.16 1.6 5.97L0 24l6.23-1.63a11.93 11.93 0 0 0 5.83 1.51h.01c6.6 0 11.97-5.37 11.97-11.97 0-3.2-1.25-6.21-3.52-8.43zM12.07 21.87h-.01a9.9 9.9 0 0 1-5.05-1.39l-.36-.22-3.75.98 1-3.66-.24-.38a9.92 9.92 0 0 1-1.52-5.23c0-5.48 4.46-9.94 9.95-9.94 2.65 0 5.15 1.03 7.02 2.91a9.88 9.88 0 0 1 2.91 7.03c0 5.48-4.46 9.94-9.95 9.94zm5.45-7.44c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.95 1.17-.17.2-.35.22-.65.07-.3-.15-1.27-.47-2.42-1.5-.9-.8-1.5-1.79-1.67-2.09-.17-.3-.02-.46.13-.61.14-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.05 1.03-1.05 2.51s1.07 2.91 1.22 3.11c.15.2 2.11 3.22 5.11 4.51.71.31 1.27.49 1.7.63.72.23 1.37.2 1.88.12.58-.09 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.07-.12-.27-.2-.57-.35z"/>
                        </svg>
                      )}
                    </div>

                    {/* Nama Media Sosial & Nama Akun */}
                    <div className="min-w-0">
                      <h3 className="text-base sm:text-lg font-bold text-[#00296E] group-hover:text-[#0094E0] transition-colors leading-tight">
                        {channel.name}
                      </h3>
                      <p className="text-xs sm:text-sm font-semibold text-slate-500 mt-1 leading-snug break-words">
                        {channel.handle}
                      </p>
                    </div>
                  </div>

                  {/* Panah Indikator Link */}
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 shrink-0 ml-3 group-hover:bg-[#00296E] group-hover:text-white transition-all duration-300">
                    <ArrowUpRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </div>
                </a>
              </ScrollReveal>
            ))}
          </div>

          {/* Banner Kolaborasi & Aspirasi di Bawah Grid */}
          <div className="mt-12 sm:mt-16 p-6 sm:p-8 rounded-[28px] bg-gradient-to-r from-[#00296E] via-[#00388d] to-[#0094E0] text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-[#00296E]/15">
            <div className="max-w-xl text-center md:text-left">
              <h3 className="text-xl sm:text-2xl font-bold tracking-tight">
                Ingin Berkolaborasi dengan HIMASI?
              </h3>
              <p className="text-xs sm:text-sm text-white/85 mt-1.5 leading-relaxed font-normal">
                Kami terbuka untuk kerja sama kegiatan, kemitraan sponsor, dan menerima aspirasi mahasiswa Sistem Informasi ISB Atma Luhur.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 shrink-0">
              <a
                href="https://wa.me/6281234567890?text=Halo%20HIMASI%20ISB%20Atma%20Luhur,%20saya%20ingin%20mengajukan%20kerjasama"
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-3 rounded-full bg-white text-[#00296E] font-bold text-xs sm:text-sm hover:bg-sky-50 shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2"
              >
                <span>Hubungi via WhatsApp</span>
                <ArrowUpRight className="w-4 h-4" />
              </a>
            </div>
          </div>

        </ScrollReveal>
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
