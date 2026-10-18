"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Calendar,
  Award,
  Users,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Play,
  Clock,
  ArrowRight,
  Sparkles,
  UserPlus,
  Shirt,
  Trophy,
  Briefcase,
  Quote,
  Share2,
  MoreHorizontal,
  Check,
  Smile,
  Layers,
  BookOpen,
  FileText,
  MessageSquare,
  PlayCircle
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

// Data Berita & Informasi HIMASI untuk News Carousel (Sesuai Referensi Card)
const NEWS_ITEMS = [
  {
    id: 1,
    tag: "#prestasi",
    title: "Mahasiswa Sistem Informasi Sabet Juara 1 UI/UX Design Competition Nasional 2026",
    excerpt:
      "Tim 'Inovasi Digital' HIMASI ISB Atma Luhur berhasil mengungguli 85 tim dari berbagai universitas dengan rancangan solusi aplikasi aksesibilitas perkuliahan modern berbasis mobile.",
    image:
      "https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?q=80&w=800&auto=format&fit=crop",
    author: "Kominfo HIMASI",
    authorAvatar:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop",
    date: "12 Maret 2026",
    href: "/berita",
  },
  {
    id: 2,
    tag: "#teknologi",
    title: "Kuliah Tamu & Workshop: Transformasi Enterprise Architecture dengan Cloud & GenAI",
    excerpt:
      "Menghadirkan Principal Solution Architect AWS untuk mengupas tuntas implementasi scalable microservices, AI workflow, dan tata kelola data di industri finansial modern.",
    image:
      "https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=800&auto=format&fit=crop",
    author: "Divisi Akademik",
    authorAvatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop",
    date: "05 Maret 2026",
    href: "/berita",
  },
  {
    id: 3,
    tag: "#kegiatan",
    title: "HIMASI Fest 2026: Kolaborasi Kreatif Coding, E-Sport, dan Pameran Proyek Sistem Informasi",
    excerpt:
      "Ajang akbar tahunan mahasiswa Sistem Informasi kembali hadir mempertemukan ratusan talenta muda melalui hackathon coding, turnamen esport, dan seminar teknologi interaktif.",
    image:
      "https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=800&auto=format&fit=crop",
    author: "BPH HIMASI",
    authorAvatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop",
    date: "28 Februari 2026",
    href: "/berita",
  },
  {
    id: 4,
    tag: "#organisasi",
    title: "Rapat Kerja & Upgrading Kabinet REKSABUDAYA: Menyongsong Inovasi Berkelanjutan",
    excerpt:
      "Seluruh fungsionaris kabinet mematangkan eksekusi program kerja strategis yang berfokus pada penguatan kompetensi digital, kepemimpinan berintegritas, dan sinergi organisasi.",
    image:
      "https://images.unsplash.com/photo-1531403009284-440f080d1e12?q=80&w=800&auto=format&fit=crop",
    author: "Sekretariat Kabinet",
    authorAvatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop",
    date: "15 Februari 2026",
    href: "/berita",
  },
  {
    id: 5,
    tag: "#akademik",
    title: "Sosialisasi Program Magang MBKM & Studi Independen Bersertifikat (MSIB) Batch 7",
    excerpt:
      "Fakultas dan HIMASI fasilitasi mahasiswa raih pengalaman kerja nyata di industri tech unicorns melalui kurikulum konversi 20 SKS.",
    image:
      "https://images.unsplash.com/photo-1531482615713-2afd69097998?q=80&w=800&auto=format&fit=crop",
    author: "Biro Karir",
    authorAvatar:
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200&auto=format&fit=crop",
    date: "02 Februari 2026",
    href: "/berita",
  },
  {
    id: 6,
    tag: "#pengabdian",
    title: "SI Mengajar & Literasi Digital: Edukasi Cyber Awareness untuk Generasi Muda",
    excerpt:
      "Aksi sosial HIMASI mengedukasi keamanan siber, etika berinternet, dan pengenalan logika pemrograman bagi siswa sekolah menengah.",
    image:
      "https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=800&auto=format&fit=crop",
    author: "Pengabdian",
    authorAvatar:
      "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop",
    date: "25 Januari 2026",
    href: "/berita",
  },
];

// Jumlah clone untuk infinite loop mulus tanpa jeda
const CLONES_COUNT = 4;
const SLIDES = [
  ...NEWS_ITEMS.slice(-CLONES_COUNT).map((item, idx) => ({ ...item, uniqueKey: `clone-before-${idx}` })),
  ...NEWS_ITEMS.map((item, idx) => ({ ...item, uniqueKey: `real-${idx}` })),
  ...NEWS_ITEMS.slice(0, CLONES_COUNT).map((item, idx) => ({ ...item, uniqueKey: `clone-after-${idx}` })),
];

// Data Pengurus HIMASI Sesuai Referensi Gambar Layout (Jordi Venzen - Ketua Umum dkk.)
const PENGURUS_ITEMS = [
  {
    id: 1,
    name: "JORDI VENZEN",
    role: "KETUA UMUM HIMASI",
    period: "2025/2026",
    image:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: 2,
    name: "MUHAMMAD FADHIL",
    role: "WAKIL KETUA UMUM",
    period: "2025/2026",
    image:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: 3,
    name: "ANINDYA PUTRI",
    role: "SEKRETARIS UMUM",
    period: "2025/2026",
    image:
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: 4,
    name: "ZAHRA SALSABILA",
    role: "BENDAHARA UMUM",
    period: "2025/2026",
    image:
      "https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: 5,
    name: "DIMAS ARYA PRATAMA",
    role: "KORD. DIVISI AKADEMIK & RISET",
    period: "2025/2026",
    image:
      "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: 6,
    name: "KEVIN ALAMSYAH",
    role: "KORD. DIVISI MEDKOMINFO",
    period: "2025/2026",
    image:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: 7,
    name: "NABILA SYAHRANI",
    role: "KORD. DIVISI HUBLU",
    period: "2025/2026",
    image:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: 8,
    name: "RIAN HIDAYAT",
    role: "KORD. DIVISI MINAT & BAKAT",
    period: "2025/2026",
    image:
      "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=800&auto=format&fit=crop",
  },
];

// Data Pertanyaan FAQ HIMASI Sesuai Referensi Desain
const FAQ_ITEMS = [
  {
    id: 1,
    icon: Smile,
    question: "Apa itu HIMASI dan apa saja peran utamanya di ISB Atma Luhur?",
    answer:
      "\"HIMASI\" adalah organisasi mahasiswa resmi di bawah naungan Program Studi Sistem Informasi di Institut Sains dan Bisnis Atma Luhur. Organisasi ini bertujuan untuk menjadi wadah pengembangan diri, kreativitas, kepemimpinan, dan keterampilan mahasiswa dalam bidang akademik, sosial, serta teknologi informasi.",
  },
  {
    id: 2,
    icon: Layers,
    question: "Berapa divisi dalam kepengurusan Kabinet HIMASI saat ini?",
    answer:
      "HIMASI ISB Atma Luhur Kabinet REKSABUDAYA menaungi 6 divisi strategis: Badan Pengurus Harian (BPH), Divisi Akademik & Riset, Divisi Media Komunikasi & Informasi (Medkominfo), Divisi Hubungan Luar (Hublu), Divisi Dana Usaha (Danus), dan Divisi Minat & Bakat (Mikat).",
  },
  {
    id: 3,
    icon: UserPlus,
    question: "Bagaimana alur pendaftaran untuk bergabung di HIMASI?",
    answer:
      "Mahasiswa aktif Program Studi Sistem Informasi dapat mendaftar saat periode Open Recruitment (Oprec) pengurus kabinet baru setiap awal tahun kepengurusan, melalui seleksi administrasi, tes wawasan keorganisasian, serta sesi wawancara bersama BPH.",
  },
  {
    id: 4,
    icon: BookOpen,
    question: "Bantuan akademik apa saja yang disediakan HIMASI bagi mahasiswa?",
    answer:
      "HIMASI menyelenggarakan Klinik Koding & Asistensi Tutorial praktikum bersama tutor sebaya berprestasi, bank soal ujian semester terdahulu, bimbingan persiapan sidang skripsi/Tugas Akhir, serta sosialisasi berkala konversi SKS untuk program Magang MBKM & MSIB.",
  },
  {
    id: 5,
    icon: FileText,
    question: "Bagaimana alur pengajuan surat dispensasi kuliah atau delegasi lomba?",
    answer:
      "Mahasiswa dapat mengunduh format surat dispensasi di portal Pusat Informasi, melengkapi data mata kuliah serta surat undangan lomba/kegiatan, lalu menghubungi narahubung Divisi Hubungan Luar (Hublu) paling lambat H-7 untuk diverifikasi dan diteruskan ke pihak Program Studi dan Dekanat.",
  },
  {
    id: 6,
    icon: Sparkles,
    question: "Apakah kegiatan seminar, workshop, atau kompetisi HIMASI terbuka untuk umum?",
    answer:
      "Ya! Sebagian besar agenda besar kami seperti HIMASI Fest, workshop artificial intelligence, seminar karir software engineering, dan turnamen e-sport terbuka untuk seluruh mahasiswa lintas fakultas maupun masyarakat umum dari universitas lain.",
  },
  {
    id: 7,
    icon: MessageSquare,
    question: "Bagaimana cara menyampaikan aspirasi, saran, atau aduan ke jurusan?",
    answer:
      "Melalui program Apresia-SI (Aspirasi Mahasiswa SI), mahasiswa dapat menyampaikan aspirasi kapan saja secara daring lewat formulir online di website ini atau menghadiri forum tatap muka Serap Aspirasi berkala yang langsung diadvokasikan ke Kaprodi Sistem Informasi.",
  },
  {
    id: 8,
    icon: PlayCircle,
    question: "Apakah HIMASI menyediakan rekaman tutorial atau materi pembelajaran?",
    answer:
      "Ya, dokumentasi materi workshop, rekaman webinar, dan tutorial teknologi dapat diakses melalui kanal YouTube resmi HIMASI ISB Atma Luhur serta arsip dokumentasi digital di website ini.",
  },
];

export default function Home() {
  const [isPlayingInline, setIsPlayingInline] = useState(false);
  const videoId = getYouTubeVideoId(YOUTUBE_VIDEO_URL);
  const [thumbSrc, setThumbSrc] = useState(
    `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
  );

  // State untuk Infinite Carousel Berita & Informasi
  const [currentIndex, setCurrentIndex] = useState(CLONES_COUNT);
  const [transitionEnabled, setTransitionEnabled] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [copiedToast, setCopiedToast] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  // State untuk Drag & Swipe Geser (Mouse & Touch)
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [hasMoved, setHasMoved] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // State untuk Section FAQ (default item 1 terbuka sesuai referensi)
  const [openFaqId, setOpenFaqId] = useState<number | null>(1);

  // Deteksi ukuran layar (tablet/desktop: 2 kolom per view, mobile: 1 kolom)
  useEffect(() => {
    const updateMedia = () => {
      setIsDesktop(window.innerWidth >= 768);
    };
    updateMedia();
    window.addEventListener("resize", updateMedia);
    return () => window.removeEventListener("resize", updateMedia);
  }, []);

  // Re-enable transition setelah snap tanpa transisi selesai
  useEffect(() => {
    if (!transitionEnabled) {
      const id1 = requestAnimationFrame(() => {
        const id2 = requestAnimationFrame(() => {
          setTransitionEnabled(true);
        });
        return () => cancelAnimationFrame(id2);
      });
      return () => cancelAnimationFrame(id1);
    }
  }, [transitionEnabled]);

  // Fungsi Navigasi Maju (Next)
  const handleNext = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setTransitionEnabled(true);
    setCurrentIndex((prev) => prev + 1);
  };

  // Fungsi Navigasi Mundur (Prev)
  const handlePrev = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setTransitionEnabled(true);
    setCurrentIndex((prev) => prev - 1);
  };

  // Logika Infinite Loop Reset pada boundary clone
  const handleTransitionEnd = () => {
    setIsTransitioning(false);
    if (currentIndex >= CLONES_COUNT + NEWS_ITEMS.length) {
      // Sampai di clone setelah item akhir -> reset instan ke awal tanpa transisi
      setTransitionEnabled(false);
      setCurrentIndex((prev) => prev - NEWS_ITEMS.length);
    } else if (currentIndex < CLONES_COUNT) {
      // Sampai di clone sebelum item awal -> reset instan ke akhir tanpa transisi
      setTransitionEnabled(false);
      setCurrentIndex((prev) => prev + NEWS_ITEMS.length);
    }
  };

  // Auto-play infinite carousel setiap 5.5 detik saat tidak di-hover dan tidak di-drag
  useEffect(() => {
    if (isHovered || isDragging) return;
    const interval = setInterval(() => {
      handleNext();
    }, 5500);
    return () => clearInterval(interval);
  }, [isHovered, isDragging, currentIndex, isTransitioning]);

  // Handler Drag & Geser Mouse / Touch
  const handleDragStart = (clientX: number) => {
    if (isTransitioning) return;
    setIsDragging(true);
    setStartX(clientX);
    setDragOffset(0);
    setHasMoved(false);
  };

  const handleDragMove = (clientX: number) => {
    if (!isDragging) return;
    const diff = clientX - startX;
    setDragOffset(diff);
    if (Math.abs(diff) > 6) {
      setHasMoved(true);
    }
  };

  const handleDragEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    if (dragOffset < -50) {
      handleNext();
    } else if (dragOffset > 50) {
      handlePrev();
    }
    setDragOffset(0);
  };

  // Titik aktif pagination yang diselaraskan dengan indeks asli berita (0 - 5)
  const activeDotIndex =
    ((currentIndex - CLONES_COUNT) % NEWS_ITEMS.length + NEWS_ITEMS.length) %
    NEWS_ITEMS.length;

  const goToDot = (dotIdx: number) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setTransitionEnabled(true);
    setCurrentIndex(CLONES_COUNT + dotIdx);
  };

  const handleShare = (article: (typeof NEWS_ITEMS)[0]) => {
    if (typeof navigator !== "undefined" && navigator.share) {
      navigator.share({
        title: article.title,
        text: article.excerpt,
        url: window.location.href,
      }).catch(() => {});
    } else if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(`${article.title} - ${window.location.origin}/berita`);
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 2500);
    }
  };

  // State untuk Infinite Smooth Carousel Pengurus HIMASI (berjalan sendiri secara smooth)
  const [pengurusDirection, setPengurusDirection] = useState<"normal" | "reverse">("normal");
  const [isPengurusPaused, setIsPengurusPaused] = useState(false);

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
          className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center justify-center p-2 rounded-full cursor-pointer focus:outline-none group select-none animate-bounce"
          aria-label="Scroll ke konten bawah"
        >
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/85 hover:bg-white backdrop-blur-md border border-slate-200/80 shadow-md hover:shadow-lg flex items-center justify-center transition-all duration-200 group-hover:scale-110">
            <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-[#00296E] stroke-[2.5]" />
          </div>
        </button>

        {/* 4. Text Carousel Besar & Semi-Transparan (Sesuai Referensi, Tanpa Simbol, Diangkat Sedikit ke Atas) */}
        <div className="absolute bottom-10 sm:bottom-16 md:bottom-20 inset-x-0 z-10 w-full overflow-hidden pointer-events-none select-none">
          <div className="flex w-full overflow-hidden">
            <div
              className="flex shrink-0 items-center min-w-full animate-marquee gap-10 sm:gap-16 pr-10 sm:pr-16"
              style={{ animationDuration: "60s" }}
            >
              {[...Array(4)].map((_, i) => (
                <span
                  key={`track-1-${i}`}
                  className="font-black text-4xl sm:text-5xl md:text-6xl lg:text-6xl xl:text-6xl tracking-tight text-white/30 uppercase whitespace-nowrap drop-shadow-[0_2px_8px_rgba(0,0,0,0.2)]"
                >
                  HIMASI ATMALUHUR KABINET REKSABUDAYA
                </span>
              ))}
            </div>
            <div
              className="flex shrink-0 items-center min-w-full animate-marquee gap-10 sm:gap-16 pr-10 sm:pr-16"
              style={{ animationDuration: "60s" }}
              aria-hidden="true"
            >
              {[...Array(4)].map((_, i) => (
                <span
                  key={`track-2-${i}`}
                  className="font-black text-4xl sm:text-5xl md:text-6xl lg:text-6xl xl:text-6xl tracking-tight text-white/30 uppercase whitespace-nowrap drop-shadow-[0_2px_8px_rgba(0,0,0,0.2)]"
                >
                  HIMASI ATMALUHUR KABINET REKSABUDAYA
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION: TENTANG KAMI & COMPANY PROFILE VIDEO (Sesuai Referensi) */}
      <section id="ikhtisar" className="relative py-16 sm:py-18 px-4 sm:px-6 lg:px-12 bg-white w-full overflow-hidden scroll-mt-16">

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

          {/* Card Component Baris 1: HIMASI dalam Angka + 4 Metric Cards (Layout Sesuai Referensi Gambar) */}
          <div className="pt-12 sm:pt-16">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 items-stretch">
              
              {/* Kolom Kiri: Header 'HIMASI dalam Angka' */}
              <div className="sm:col-span-2 lg:col-span-1 flex flex-col justify-center py-2 pr-2">
                <div className="flex items-center gap-2 text-4xl font-extrabold text-[#00296E] uppercase">
                  <span>HIMASI</span>
                </div>
                <h3 className="text-2xl sm:text-3xl lg:text-[28px] xl:text-3xl font-bold tracking-tight text-[#00296E] leading-tight">
                  dalam <span className="text-[#0094E0]">Angka</span>
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-2.5 leading-relaxed font-normal">
                  Lebih dari sekadar angka, ini adalah tentang perjalanan dan kontribusi.
                </p>
              </div>

              {/* Kolom Kanan: 4 Metric Cards (Warna Tetap Sesuai Yang Ada) */}
              {[
                {
                  number: "",
                  icon: Calendar,
                  title: "Est. 2010",
                  subtitle: "16 tahun telah bersama dalam mengembangkan bakat dan minat mahasiswa Sistem Informasi.",
                  iconStyle: "bg-[#0c2340] border border-[#0094E0]/40 text-[#0094E0]",
                },
                {
                  number: "",
                  icon: Users,
                  title: "3 Divisi",
                  subtitle: "Divisi yang telah bersatu dalam mengembangkan HIMASI dan Sistem Informasi.",
                  iconStyle: "bg-[#0094E0] text-[#002257] shadow-md shadow-[#0094E0]/25",
                },
                {
                  number: "",
                  icon: Award,
                  title: "30 Anggota Aktif",
                  subtitle: "30 anggota yang aktif dalam mengembangkan HIMASI dan Sistem Informasi.",
                  iconStyle: "bg-[#0c2340] border border-[#0094E0]/40 text-[#0094E0]",
                },
              ].map((card, idx) => {
                const IconComponent = card.icon;
                return (
                  <div
                    key={idx}
                    className="relative rounded-2xl bg-[#00296E] border border-white/10 p-5 sm:p-6 flex flex-col justify-between shadow-xl hover:-translate-y-1 hover:border-[#0094E0]/40 transition-all duration-300 group"
                  >
                    {/* Top Row: Icon on Left, Number on Right */}
                    <div className="flex items-center justify-between mb-4">
                      <div className={`w-11 h-11 rounded-xl ${card.iconStyle} flex items-center justify-center transition-transform group-hover:scale-105 shrink-0`}>
                        <IconComponent className="w-5 h-5 stroke-[2.2]" />
                      </div>
                      <span className="text-xs sm:text-sm font-bold text-[#0094E0]/80 tracking-wider font-mono">
                        {card.number}
                      </span>
                    </div>

                    {/* Content: Title, Underline, Subtitle */}
                    <div>
                      <h4 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                        {card.title}
                      </h4>
                      <div className="w-7 h-0.5 bg-[#0094E0] my-2 rounded-full" />
                      <p className="text-slate-300/90 text-xs mt-1.5 leading-relaxed font-normal">
                        {card.subtitle}
                      </p>
                    </div>
                  </div>
                );
              })}

            </div>
          </div>

          {/* Card Component Baris 2: VISI (Kiri) & MISI (Kanan) Sesuai Referensi Gambar */}
          <div className="mt-10 sm:mt-14 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
            
            {/* Kolom Kiri: VISI (Bentuk Trapesium Presisi Sesuai Gambar Referensi) */}
            <div className="lg:col-span-5 relative flex flex-col justify-between p-7 sm:p-9 lg:p-10 min-h-[380px] drop-shadow-2xl group overflow-visible">
              {/* Background SVG Trapesium with exact path - Single Solid Color #00296E */}
              <svg
                className="absolute inset-0 w-full h-full -z-0"
                viewBox="0 0 500 400"
                preserveAspectRatio="none"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M 28,0.75 L 335,0.75 C 370,0.75 398,15.75 428,48.75 L 472,92.75 C 492,112.75 499.25,128 499.25,150 L 499.25,372 C 499.25,389.5 487.5,399.25 468,399.25 L 28,399.25 C 12.5,399.25 0.75,387.5 0.75,372 L 0.75,28 C 0.75,12.5 12.5,0.75 28,0.75 Z"
                  fill="#00296E"
                  stroke="rgba(255,255,255,0.15)"
                  strokeWidth="1.5"
                />
              </svg>

              {/* Content within Trapezoid */}
              <div className="relative z-10 flex flex-col justify-between h-full">
                <div>
                  {/* Header: ── VISI */}
                  <div className="flex items-center gap-2 text-xl font-bold tracking-[0.25em] text-[#FFFFFF] uppercase mb-4 sm:mb-6">
                    <span>VISI HIMASI</span>
                  </div>

                  {/* Quote Icon & Content */}
                  <div className="pr-6 sm:pr-12 lg:pr-16">
                    <p className="text-white text-base sm:text-lg lg:text-xl font-medium leading-relaxed tracking-normal">
                      Menjadi lembaga keilmuan yang <strong className="font-extrabold text-white">unggul</strong> dalam pengembangan potensi mahasiswa Sistem Informasi yang berdaya saing, berintegritas, dan berkontribusi bagi masyarakat.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Kolom Kanan: MISI (4 Pill Horizontal Sesuai Gambar) */}
            <div className="lg:col-span-7 flex flex-col justify-center py-2">
              {/* Header: ── MISI */}
              <div className="flex items-center gap-2 text-xl font-bold tracking-[0.25em] text-[#00296E] uppercase mb-4 sm:mb-5">
                <span>MISI HIMASI</span>
              </div>

              {/* 4 Misi Items with Numbered Circle Badges */}
              <div className="space-y-3 sm:space-y-3.5">
                {[
                  {
                    no: "01",
                    text: "Menyelenggarakan kegiatan akademik dan non-akademik yang mendukung pengembangan ilmu pengetahuan dan keterampilan.",
                    highlight: false,
                  },
                  {
                    no: "02",
                    text: "Meningkatkan kualitas sumber daya mahasiswa melalui pembinaan, pelatihan, dan kolaborasi.",
                    highlight: false,
                  },
                  {
                    no: "03",
                    text: "Memperkuat jejaring dan kemitraan dengan berbagai pihak.",
                    highlight: false,
                  },
                  {
                    no: "04",
                    text: "Menumbuhkan jiwa kepemimpinan, kreativitas, dan kepedulian sosial.",
                    highlight: false,
                  },
                ].map((misi, idx) => (
                  <div key={idx} className="flex items-center gap-3 sm:gap-4 group">
                    {/* Circle Badge 01, 02, 03, 04 */}
                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#00296E] text-white font-bold text-xs sm:text-sm flex items-center justify-center shrink-0 shadow-md transition-all duration-200">
                      {misi.no}
                    </div>

                    {/* Pill Text Container */}
                    <div className="flex-1 py-3 px-4 sm:px-5 rounded-2xl sm:rounded-full bg-slate-50 border border-slate-100 transition-all duration-200">
                      <p className={`text-xs sm:text-sm leading-relaxed ${misi.highlight ? "text-[#0094E0] font-semibold" : "text-slate-700 font-medium"}`}>
                        {misi.text}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
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

      {/* SECTION: BERITA & INFORMASI TERKINI (CAROUSEL SESUAI REFERENSI) */}
      <section id="berita-informasi" className="relative py-14 sm:py-20 px-4 sm:px-6 lg:px-12 bg-[#FFFFFF] w-full overflow-hidden ">
        <div className="relative max-w-6xl mx-auto">
          {/* Header Section dengan Navigasi Carousel */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 mb-8 sm:mb-10">
            <div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#00296E] tracking-tight">
                Kabar Terkini HIMASI
              </h2>
            </div>

            {/* Tombol Aksi & Navigasi Arrow */}
            <div className="flex items-center gap-3 shrink-0 self-start md:self-end">
              <Link
                href="/berita"
                className="hidden sm:inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#00296E] hover:text-[#0094E0] transition-colors mr-2 group/all"
              >
                <span>Lihat Semua Berita</span>
                <ArrowRight className="w-4 h-4 group-hover/all:translate-x-1 transition-transform" />
              </Link>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrev}
                  className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white border border-slate-200/90 hover:border-[#00296E] hover:bg-[#00296E] hover:text-white text-[#00296E] flex items-center justify-center shadow-sm hover:shadow-md transition-all active:scale-95 cursor-pointer"
                  aria-label="Berita Sebelumnya"
                >
                  <ChevronLeft className="w-5 h-5 stroke-[2.2]" />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white border border-slate-200/90 hover:border-[#00296E] hover:bg-[#00296E] hover:text-white text-[#00296E] flex items-center justify-center shadow-sm hover:shadow-md transition-all active:scale-95 cursor-pointer"
                  aria-label="Berita Selanjutnya"
                >
                  <ChevronRight className="w-5 h-5 stroke-[2.2]" />
                </button>
              </div>
            </div>
          </div>

          {/* Carousel Slider Card Container: 2 Kolom Card Per View (Infinite & Geser Drag/Swipe) */}
          <div
            className={`relative w-full overflow-hidden -mx-2 sm:-mx-3 select-none ${
              isDragging ? "cursor-grabbing" : "cursor-grab"
            }`}
            onMouseDown={(e) => handleDragStart(e.clientX)}
            onMouseMove={(e) => handleDragMove(e.clientX)}
            onMouseUp={handleDragEnd}
            onMouseLeave={() => {
              handleDragEnd();
              setIsHovered(false);
            }}
            onMouseEnter={() => setIsHovered(true)}
            onTouchStart={(e) => handleDragStart(e.touches[0].clientX)}
            onTouchMove={(e) => handleDragMove(e.touches[0].clientX)}
            onTouchEnd={handleDragEnd}
          >
            <div
              className="flex"
              onTransitionEnd={handleTransitionEnd}
              style={{
                transform: isDragging
                  ? `translateX(calc(-${currentIndex * (isDesktop ? 50 : 100)}% + ${dragOffset}px))`
                  : `translateX(-${currentIndex * (isDesktop ? 50 : 100)}%)`,
                transition: isDragging
                  ? "none"
                  : transitionEnabled
                  ? "transform 450ms cubic-bezier(0.25, 1, 0.5, 1)"
                  : "none",
              }}
            >
              {SLIDES.map((item) => (
                <div
                  key={item.uniqueKey}
                  className="w-full md:w-1/2 shrink-0 px-2 sm:px-3"
                  onClickCapture={(e) => {
                    if (hasMoved) {
                      e.preventDefault();
                      e.stopPropagation();
                    }
                  }}
                >
                  {/* Card Component Sesuai Referensi Gambar */}
                  <div className="bg-slate-50 rounded-[24px] sm:rounded-[28px] p-4 sm:p-5 border border-slate-100 hover:border-slate-200/80 flex flex-col sm:flex-row gap-4 sm:gap-4.5 items-stretch transition-all duration-300 h-full">
                    
                    {/* Sisi Kiri: Gambar dengan Tag Kategori Sesuai Gambar Referensi */}
                    <div className="relative w-full sm:w-[155px] md:w-[165px] lg:w-[185px] aspect-[16/10] sm:aspect-square shrink-0 rounded-[18px] sm:rounded-[20px] overflow-hidden bg-slate-900 group/img select-none">
                      <img
                        src={item.image}
                        alt={item.title}
                        draggable={false}
                        className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-500 pointer-events-none"
                      />
                      {/* Tag Kategori (seperti #science pada gambar referensi) */}
                      <span className="absolute top-2.5 left-2.5 z-10 px-2.5 py-0.5 rounded-full text-[11px] font-semibold text-white/95 bg-black/45 backdrop-blur-md border border-white/10 tracking-wide pointer-events-none">
                        {item.tag}
                      </span>
                    </div>

                    {/* Sisi Kanan: Judul, Deskripsi, Penulis, dan Tombol Aksi */}
                    <div className="flex-1 flex flex-col justify-between py-0.5 min-w-0">
                      <div>
                        <Link href={item.href} draggable={false}>
                          <h3 className="text-base sm:text-[17px] lg:text-lg font-bold text-[#00296E] hover:text-[#0094E0] transition-colors leading-snug line-clamp-2 cursor-pointer">
                            {item.title}
                          </h3>
                        </Link>
                        <p className="mt-2 text-slate-500 text-xs sm:text-[13px] leading-relaxed line-clamp-2 sm:line-clamp-3 font-normal">
                          {item.excerpt}
                        </p>
                      </div>

                      {/* Bar Bawah: Action Buttons */}
                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                        {/* Action Buttons: Bulatan Share (HIMASI Style) & Bulatan Opsi (...) */}
                        <button
                          type="button"
                          onClick={() => handleShare(item)}
                          className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#00296E] hover:bg-[#0094E0] text-white flex items-center justify-center shadow-sm hover:shadow-md transition-all hover:scale-105 active:scale-95 cursor-pointer"
                          aria-label="Bagikan Berita"
                          title="Bagikan Tautan Berita"
                        >
                          <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.2]" />
                        </button>
                        <Link
                          href={item.href}
                          draggable={false}
                          className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-slate-200 hover:border-[#00296E] hover:bg-slate-50 text-slate-700 flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer"
                          aria-label="Baca Selengkapnya"
                          title="Detail Berita"
                        >
                          <MoreHorizontal className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2.2]" />
                        </Link>
                      </div>

                    </div>

                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Indikator Titik Pagination Carousel */}
          <div className="mt-6 sm:mt-8 flex items-center justify-center gap-2">
            {NEWS_ITEMS.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => goToDot(idx)}
                className={`transition-all duration-300 rounded-full cursor-pointer ${
                  activeDotIndex === idx
                    ? "w-8 h-2.5 bg-[#00296E]"
                    : "w-2.5 h-2.5 bg-slate-300 hover:bg-slate-400"
                }`}
                aria-label={`Ke slide ${idx + 1}`}
              />
            ))}
          </div>

          {/* Mobile Link ke Semua Berita */}
          <div className="mt-6 text-center sm:hidden">
            <Link
              href="/berita"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#00296E] hover:text-[#0094E0]"
            >
              <span>Lihat Semua Berita</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

        </div>
      </section>

      {/* SECTION: PENGURUS HIMASI (INFINITE SMOOTH CAROUSEL BERJALAN SENDIRI) */}
      <section id="pengurus-himasi" className="relative py-8 sm:py-10 px-4 sm:px-6 lg:px-12 bg-white w-full overflow-hidden scroll-mt-16">
        <div className="relative max-w-6xl mx-auto">
          {/* Header Section dengan Kontrol Arah & Link Struktur */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 mb-8 sm:mb-10">
            <div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#00296E] tracking-tight">
                Kabinet REKSABUDAYA
              </h2>
            </div>

            {/* Tombol Aksi & Kontrol Arah Smooth Carousel */}
            <div className="flex items-center gap-3 shrink-0 self-start md:self-end">
              <Link
                href="/profil"
                className="hidden sm:inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#00296E] hover:text-[#0094E0] transition-colors mr-2 group/all"
              >
                <span>Lihat Struktur Kabinet</span>
                <ArrowRight className="w-4 h-4 group-hover/all:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Infinite Smooth Carousel Track Container (Berjalan Sendiri Secara Smooth & Pause on Hover) */}
          <div className="relative w-full overflow-hidden select-none group/carousel py-2 -mx-2 sm:-mx-0">
            
            {/* Left & Right Gradient Fade Masks */}
            <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-8 sm:w-24 z-20 bg-gradient-to-r from-white via-white/80 to-transparent" />
            <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 sm:w-24 z-20 bg-gradient-to-l from-white via-white/80 to-transparent" />

            {/* Seamless Infinite Looping Track Container */}
            <div
              className="flex w-max"
              onMouseEnter={() => setIsPengurusPaused(true)}
              onMouseLeave={() => setIsPengurusPaused(false)}
            >
              {/* Track 1 */}
              <div
                className="flex shrink-0 items-center gap-5 sm:gap-6 animate-cards-marquee pr-5 sm:pr-6"
                style={{
                  animationDirection: pengurusDirection,
                  animationPlayState: isPengurusPaused ? "paused" : "running",
                }}
              >
                {PENGURUS_ITEMS.map((item) => (
                  <div
                    key={`track1-${item.id}`}
                    className="w-[280px] sm:w-[320px] md:w-[350px] shrink-0"
                  >
                    <div className="relative aspect-[3/4] sm:aspect-[3/4.1] rounded-[24px] sm:rounded-[28px] bg-white border border-slate-200/90 hover:border-slate-300 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 overflow-hidden group/card select-none flex flex-col justify-end">
                      {/* Foto Pengurus */}
                      <div className="absolute inset-0 bg-slate-100 overflow-hidden">
                        <img
                          src={item.image}
                          alt={item.name}
                          draggable={false}
                          className="w-full h-full object-cover object-top group-hover/card:scale-105 transition-transform duration-500 pointer-events-none"
                        />
                        {/* Gradient Fade di Bawah */}
                        <div className="absolute inset-0 bg-gradient-to-t from-white via-white/50 to-transparent pointer-events-none" />
                      </div>

                      {/* Konten Bawah: Banner Biru untuk Nama + Subtitle Jabatan Sesuai Gambar Referensi */}
                      <div className="relative z-10 p-5 sm:p-6 pb-5 sm:pb-6 flex flex-col items-start">
                        <div className="inline-block px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xs bg-gradient-to-r from-[#003B96] via-[#0055D4] to-[#FFFFFF]/20">
                          <h3 className="text-white font-black text-lg sm:text-xl lg:text-[22px] tracking-wider uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.55)] leading-tight select-none">
                            {item.name}
                          </h3>
                        </div>
                        <p className="mt-1.5 sm:mt-2 text-slate-700 font-extrabold text-xs sm:text-[13px] tracking-[0.14em] uppercase select-none pl-0.5 drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)]">
                          {item.role}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Track 2 (Duplikasi Seamless untuk Infinite Loop Mulus Tanpa Jeda) */}
              <div
                className="flex shrink-0 items-center gap-5 sm:gap-6 animate-cards-marquee pr-5 sm:pr-6"
                aria-hidden="true"
                style={{
                  animationDirection: pengurusDirection,
                  animationPlayState: isPengurusPaused ? "paused" : "running",
                }}
              >
                {PENGURUS_ITEMS.map((item) => (
                  <div
                    key={`track2-${item.id}`}
                    className="w-[280px] sm:w-[320px] md:w-[350px] shrink-0"
                  >
                    <div className="relative aspect-[3/4] sm:aspect-[3/4.1] rounded-[24px] sm:rounded-[28px] bg-white border border-slate-200/90 hover:border-slate-300 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 overflow-hidden group/card select-none flex flex-col justify-end">
                      {/* Foto Pengurus */}
                      <div className="absolute inset-0 bg-slate-100 overflow-hidden">
                        <img
                          src={item.image}
                          alt={item.name}
                          draggable={false}
                          className="w-full h-full object-cover object-top group-hover/card:scale-105 transition-transform duration-500 pointer-events-none"
                        />
                        {/* Gradient Fade di Bawah */}
                        <div className="absolute inset-0 bg-gradient-to-t from-white via-white/50 to-transparent pointer-events-none" />
                      </div>

                      {/* Konten Bawah: Banner Biru untuk Nama + Subtitle Jabatan Sesuai Gambar Referensi */}
                      <div className="relative z-10 p-5 sm:p-6 pb-5 sm:pb-6 flex flex-col items-start">
                        <div className="inline-block px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xs bg-gradient-to-r from-[#003B96] via-[#0055D4] to-[#0077F5]/20 shadow-sm">
                          <h3 className="text-white font-black text-lg sm:text-xl lg:text-[22px] tracking-wider uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.55)] leading-tight select-none">
                            {item.name}
                          </h3>
                        </div>
                        <p className="mt-1.5 sm:mt-2 text-slate-700 font-extrabold text-xs sm:text-[13px] tracking-[0.14em] uppercase select-none pl-0.5 drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)]">
                          {item.role}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </div>

          {/* Mobile Link ke Struktur Lengkap */}
          <div className="mt-6 text-center sm:hidden">
            <Link
              href="/profil"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#00296E] hover:text-[#0094E0]"
            >
              <span>Lihat Struktur Kabinet Lengkap</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

        </div>
      </section>

      {/* SECTION: FREQUENTLY ASKED QUESTIONS (FAQ DENGAN SHAPE BOX & LEFT ALIGN) */}
      <section
        id="faq"
        className="relative py-2 sm:py-10 px-4 sm:px-6 lg:px-12 bg-white w-full overflow-hidden scroll-mt-16"
      >
        <div className="relative max-w-6xl mx-auto">
          {/* Header Left-Aligned Selaras dengan Section Lainnya */}
          <div className="mb-6 sm:mb-8 text-left">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#00296E] tracking-tight leading-tight">
              Frequently Asked Questions
            </h2>
          </div>

          {/* List Accordion dengan Box / Shape Style Sesuai Kartu Lainnya */}
          <div className="space-y-4 sm:space-y-4">
            {FAQ_ITEMS.map((item) => {
              const isOpen = openFaqId === item.id;
              const IconComp = item.icon;
              return (
                <div
                  key={item.id}
                  className={`w-full rounded-[22px] sm:rounded-[26px] border transition-all duration-300 overflow-hidden ${
                    isOpen
                      ? "bg-slate-50 border-[#0094E0]/40 shadow-sm ring-1 ring-[#0094E0]/20"
                      : "bg-slate-50 border-slate-100 hover:border-slate-200/90 hover:bg-slate-50/80"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqId(isOpen ? null : item.id)}
                    className="w-full p-4 sm:p-5 flex items-start gap-3.5 sm:gap-4.5 text-left cursor-pointer select-none group"
                    aria-expanded={isOpen}
                  >
                    <div
                      className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl border flex items-center justify-center shrink-0 transition-all duration-300 ${
                        isOpen
                          ? "bg-[#00296E] text-white border-[#00296E] shadow-sm"
                          : "bg-white text-slate-700 border-slate-200/90 group-hover:border-[#00296E]/40 group-hover:text-[#00296E]"
                      }`}
                    >
                      <IconComp className="w-5 h-5 stroke-[1.8]" />
                    </div>
                    <div className="flex-1 min-w-0 pt-1 sm:pt-1.5">
                      <h3
                        className={`text-sm sm:text-base md:text-[17px] font-bold transition-colors leading-snug ${
                          isOpen ? "text-[#00296E]" : "text-slate-900 group-hover:text-[#00296E]"
                        }`}
                      >
                        {item.question}
                      </h3>
                      {/* Jawaban Expandable */}
                      <div
                        className={`transition-all duration-300 ease-in-out overflow-hidden ${
                          isOpen ? "max-h-96 pt-3 opacity-100" : "max-h-0 pt-0 opacity-0"
                        }`}
                      >
                        <p className="text-slate-600 text-xs sm:text-sm md:text-[15px] leading-relaxed font-normal">
                          {item.answer}
                        </p>
                      </div>
                    </div>

                    {/* Chevron di Sisi Kanan */}
                    <div
                      className={`shrink-0 pt-1.5 sm:pt-2 transition-colors ${
                        isOpen ? "text-[#00296E]" : "text-slate-400 group-hover:text-slate-700"
                      }`}
                    >
                      {isOpen ? (
                        <ChevronUp className="w-5 h-5 stroke-[2.2]" />
                      ) : (
                        <ChevronDown className="w-5 h-5 stroke-[2.2]" />
                      )}
                    </div>
                  </button>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* Toast Notifikasi Berhasil Salin Link */}
      {copiedToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#00296E] text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 text-xs sm:text-sm font-semibold animate-bounce">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>Tautan berita berhasil disalin!</span>
        </div>
      )}

      {/* Footer Section Sesuai Referensi Layout */}
      <Footer />

    </div>
  );
}
