"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  CalendarBlank,
  Medal,
  Users,
  CaretDown,
  CaretUp,
  CaretLeft,
  CaretRight,
  Play,
  Clock,
  ArrowRight,
  Sparkle,
  UserPlus,
  TShirt,
  Trophy,
  ShareNetwork,
  DotsThree,
  Check,
  Smiley,
  Stack,
  BookOpen,
  FileText,
  ChatTeardropText,
  PlayCircle,
} from "@phosphor-icons/react";
import dynamic from "next/dynamic";
import Footer from "@/components/footer";
import ScrollReveal from "@/components/scroll-reveal";
import HeroBannerImage from "@/components/hero-banner-image";
import FloatingAlert, { type FloatingAlertType } from "@/components/ui/floating-alert";

// Dynamic Imports untuk komponen below-the-fold & modal guna memangkas initial bundle
const FormAspirasi = dynamic(() => import("@/components/form-aspirasi"), {
  loading: () => (
    <div className="w-full h-80 rounded-3xl bg-white border border-slate-200/80 p-8 flex items-center justify-center animate-pulse">
      <div className="w-8 h-8 rounded-full border-2 border-slate-200 border-t-[#0094e0] animate-spin" />
    </div>
  ),
});

const HomepagePopup = dynamic(() => import("@/components/homepage-popup"), {
  ssr: false,
});
import { type BeritaItem, FALLBACK_BERITA } from "@/lib/types/berita";
import { getPublishedBerita } from "@/lib/supabase/berita";
import { formatBeritaDate } from "@/lib/utils/slug";
import { supabase } from "@/lib/supabase/client";
import {
  type PengurusMember,
  DAFTAR_PENGURUS_HIMASI,
  sortKabinetHomepage,
} from "@/lib/data/pengurus";
import {
  type FiturUtamaSectionConfig,
  type FiturItemConfig,
  DEFAULT_FITUR_UTAMA,
  getFiturUtamaConfig,
  fetchFiturUtamaFromSupabase,
  FITUR_UTAMA_UPDATE_EVENT,
} from "@/lib/constants/fitur-utama";

// URL Video YouTube Company Profile HIMASI (Ganti link di sini sesuai kebutuhan)
const YOUTUBE_VIDEO_URL = "https://youtu.be/ChpVoTLy36k";

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

// Data Pertanyaan FAQ HIMASI Sesuai Referensi Desain
const FAQ_ITEMS = [
  {
    id: 1,
    icon: Smiley,
    question: "Apa itu HIMASI dan apa saja peran utamanya di ISB Atma Luhur?",
    answer:
      "\"HIMASI\" adalah organisasi mahasiswa dan lembaga keilmuan resmi di bawah naungan Program Studi Sistem Informasi di Institut Sains dan Bisnis Atma Luhur. Organisasi ini bertujuan untuk menjadi wadah pengembangan diri, kreativitas, kepemimpinan, dan keterampilan mahasiswa dalam bidang akademik, sosial, serta teknologi informasi.",
  },
  {
    id: 2,
    icon: Stack,
    question: "Berapa divisi dalam kepengurusan Kabinet HIMASI saat ini?",
    answer:
      "HIMASI ISB Atma Luhur Kabinet REKSABUDAYA menaungi 4 divisi strategis: Badan Pengurus Harian (BPH), Divisi Media Komunikasi dan Informasi (MEDKOMINFO), Divisi Hubungan Masyarakat (HUMAS), Divisi Bisnis Kreatif.",
  },
  {
    id: 3,
    icon: UserPlus,
    question: "Bagaimana alur pendaftaran untuk bergabung di HIMASI?",
    answer:
      "Mahasiswa aktif Program Studi Sistem Informasi dapat mendaftar saat periode Open Recruitment (Oprec) pengurus kabinet baru setiap awal tahun kepengurusan, melalui seleksi administrasi, tes wawasan keorganisasian, serta sesi wawancara.",
  },
  {
    id: 4,
    icon: Sparkle,
    question: "Apakah kegiatan seminar, workshop, atau kompetisi HIMASI terbuka untuk umum?",
    answer:
      "Ya! Sebagian besar agenda besar kami seperti FTI Festival, workshop, seminar terbuka untuk seluruh mahasiswa lintas fakultas maupun masyarakat umum dari universitas lain.",
  },
  {
    id: 5,
    icon: ChatTeardropText,
    question: "Bagaimana cara menyampaikan aspirasi, saran, atau aduan ke jurusan?",
    answer:
      "Mahasiswa dapat menyampaikan aspirasi kapan saja secara daring lewat formulir online di website ini yang langsung diadvokasikan ke Kaprodi Sistem Informasi.",
  },
];

// ===================================================================
// MISI KABINET (PERSIS SESUAI PROFILE PAGE)
// ===================================================================
const MISI_KABINET_ITEMS = [
  {
    no: "01",
    text: "Membangun lingkungan himpunan yang inklusif & supportive dengan menciptakan suasana organisasi yang nyaman, terbuka dan saling bantu, supaya semua anggota merasa didengar dan berkembang tanpa takut ketinggalan.",
    highlight: false,
  },
  {
    no: "02",
    text: "Mengoptimalkan media digital HIMASI secara edukatif, kreatif, dan interaktif yang tetap relevan dengan tujuan HIMASI sebagai sumber informasi dan inspirasi untuk mahasiswa SI",
    highlight: false,
  },
  {
    no: "03",
    text: "Menguatkan kolaborasi eksternal dengan menjalin kerja sama dengan startup, UMKM, dan komunitas digital untuk membuka peluang sponsor, informasi, dan jaringan HIMASI",
    highlight: false,
  },
  {
    no: "04",
    text: "Mempercepat adaptasi teknologi dalam kegiatan organisasi dengan menggunakan platform digital untuk administrasi, koordinasi hingga evaluasi, supaya HIMASI lebih gesit dan efisien",
    highlight: false,
  },
  {
    no: "05",
    text: "Meneruskan program unggulan yang sudah berjalan dengan lebih terstruktur",
    highlight: false,
  },
];

export default function Home() {
  // Deteksi redirect dari Supabase Auth Invite atau Password Recovery
  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash) {
      const hash = window.location.hash;
      if (hash.includes("type=invite") || hash.includes("type=recovery")) {
        window.location.replace(`/login${hash}`);
      }
    }
  }, []);

  const [isPlayingInline, setIsPlayingInline] = useState(false);
  const videoId = getYouTubeVideoId(YOUTUBE_VIDEO_URL);
  const [thumbSrc, setThumbSrc] = useState(
    `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
  );

  // State untuk Infinite Carousel Berita & Informasi (Sinkron Live dengan Berita Page)
  const [newsList, setNewsList] = useState<BeritaItem[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("himasi_berita_local_cache");
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch {
        // Abaikan parse error
      }
    }
    return FALLBACK_BERITA;
  });
  const [loadingNews, setLoadingNews] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("himasi_berita_local_cache");
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
  const [currentIndex, setCurrentIndex] = useState(0);
  const [transitionEnabled, setTransitionEnabled] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [copiedToast, setCopiedToast] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  // Clones Count dinamis
  const clonesCount = useMemo(() => {
    if (newsList.length <= 2) return 0;
    return Math.min(4, newsList.length);
  }, [newsList.length]);

  // Slides dinamis dengan clones untuk infinite looping mulus
  const slides = useMemo(() => {
    if (newsList.length === 0) return [];
    if (newsList.length <= 2) {
      return newsList.map((item, idx) => ({ ...item, uniqueKey: `single-${idx}` }));
    }
    return [
      ...newsList.slice(-clonesCount).map((item, idx) => ({ ...item, uniqueKey: `clone-before-${idx}` })),
      ...newsList.map((item, idx) => ({ ...item, uniqueKey: `real-${idx}` })),
      ...newsList.slice(0, clonesCount).map((item, idx) => ({ ...item, uniqueKey: `clone-after-${idx}` })),
    ];
  }, [newsList, clonesCount]);

  // Memuat data berita live dari Supabase / cache lokal
  useEffect(() => {
    let isMounted = true;
    async function loadHomeNews() {
      try {
        const liveArticles = await getPublishedBerita();
        if (isMounted) {
          if (liveArticles && liveArticles.length > 0) {
            setNewsList(liveArticles);
            if (typeof window !== "undefined") {
              try {
                localStorage.setItem("himasi_berita_local_cache", JSON.stringify(liveArticles));
              } catch {
                // Kuota storage
              }
            }
          } else {
            setNewsList((prev) => (prev.length > 0 ? prev : FALLBACK_BERITA));
          }
        }
      } catch (err) {
        console.warn("[HomeNews] Menggunakan berita fallback:", err);
        if (isMounted) setNewsList((prev) => (prev.length > 0 ? prev : FALLBACK_BERITA));
      } finally {
        if (isMounted) setLoadingNews(false);
      }
    }
    loadHomeNews();
    return () => {
      isMounted = false;
    };
  }, []);

  // Update currentIndex ke clonesCount saat berita termuat
  useEffect(() => {
    setCurrentIndex(clonesCount);
  }, [clonesCount]);

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
    window.addEventListener("resize", updateMedia, { passive: true });
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
    if (isTransitioning || newsList.length <= 1) return;
    setIsTransitioning(true);
    setTransitionEnabled(true);
    setCurrentIndex((prev) => prev + 1);
  };

  // Fungsi Navigasi Mundur (Prev)
  const handlePrev = () => {
    if (isTransitioning || newsList.length <= 1) return;
    setIsTransitioning(true);
    setTransitionEnabled(true);
    setCurrentIndex((prev) => prev - 1);
  };

  // Logika Infinite Loop Reset pada boundary clone
  const handleTransitionEnd = () => {
    setIsTransitioning(false);
    if (newsList.length <= 2) return;
    if (currentIndex >= clonesCount + newsList.length) {
      // Sampai di clone setelah item akhir -> reset instan ke awal tanpa transisi
      setTransitionEnabled(false);
      setCurrentIndex((prev) => prev - newsList.length);
    } else if (currentIndex < clonesCount) {
      // Sampai di clone sebelum item awal -> reset instan ke akhir tanpa transisi
      setTransitionEnabled(false);
      setCurrentIndex((prev) => prev + newsList.length);
    }
  };

  // Auto-play infinite carousel setiap 5.5 detik saat tidak di-hover dan tidak di-drag
  useEffect(() => {
    if (isHovered || isDragging || newsList.length <= 1) return;
    const interval = setInterval(() => {
      handleNext();
    }, 5500);
    return () => clearInterval(interval);
  }, [isHovered, isDragging, currentIndex, isTransitioning, newsList.length]);

  // Handler Drag & Geser Mouse / Touch
  const handleDragStart = (clientX: number) => {
    if (isTransitioning || newsList.length <= 1) return;
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

  // Titik aktif pagination yang diselaraskan dengan indeks asli berita
  const activeDotIndex =
    newsList.length > 0
      ? ((currentIndex - clonesCount) % newsList.length + newsList.length) % newsList.length
      : 0;

  const goToDot = (dotIdx: number) => {
    if (isTransitioning || newsList.length <= 1) return;
    setIsTransitioning(true);
    setTransitionEnabled(true);
    setCurrentIndex(clonesCount + dotIdx);
  };

  const handleShare = (article: BeritaItem) => {
    const articleUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}/berita/${article.slug}`
        : `/berita/${article.slug}`;

    if (typeof navigator !== "undefined" && navigator.share) {
      navigator.share({
        title: article.title,
        text: article.excerpt,
        url: articleUrl,
      }).catch(() => {});
    } else if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(`${article.title} - ${articleUrl}`);
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 2500);
    }
  };

  // Dynamic Pengurus Kabinet HIMASI (Tersinkronisasi Realtime dengan Supabase & Dashboard)
  const [pengurusList, setPengurusList] = useState<PengurusMember[]>(() =>
    sortKabinetHomepage(DAFTAR_PENGURUS_HIMASI)
  );
  const [loadingPengurus, setLoadingPengurus] = useState(true);

  const fetchPengurusData = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("pengurus")
        .select("*")
        .order("created_at", { ascending: true });

      if (!error && data && data.length > 0) {
        const activeRows = data.filter((row: any) => row.is_active !== false);
        const mapped: PengurusMember[] = activeRows.map((row: any) => ({
          id: String(row.id),
          nim: row.nim || "",
          nama: row.nama || "",
          jabatan: row.jabatan || "",
          divisi: (row.divisi || "").trim().toUpperCase(),
          qrToken: row.qr_token || "",
          image: row.foto_url || "/DSC01203.jpg",
          email: row.email || "",
          urutan: row.urutan != null ? Number(row.urutan) : undefined,
        }));
        setPengurusList(sortKabinetHomepage(mapped));
      } else {
        setPengurusList(sortKabinetHomepage(DAFTAR_PENGURUS_HIMASI));
      }
    } catch (err) {
      console.warn("Koneksi pengurus homepage offline, memakai data fallback:", err);
      setPengurusList(sortKabinetHomepage(DAFTAR_PENGURUS_HIMASI));
    } finally {
      setLoadingPengurus(false);
    }
  }, []);

  useEffect(() => {
    fetchPengurusData();

    // Supabase Realtime Listener agar sinkron otomatis saat Dashboard mengubah data pengurus
    const channel = supabase
      .channel("himasi_realtime_homepage_pengurus")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "pengurus" },
        () => {
          fetchPengurusData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchPengurusData]);

  // Memastikan track marquee terisi cukup banyak elemen agar infinite loop mulus tanpa celah kosong
  const displayPengurus = useMemo(() => {
    if (pengurusList.length === 0) return [];
    if (pengurusList.length < 5) {
      let list = [...pengurusList];
      while (list.length < 8) {
        list = [...list, ...pengurusList];
      }
      return list;
    }
    return pengurusList;
  }, [pengurusList]);

  // State untuk Infinite Smooth Carousel Pengurus HIMASI (berjalan sendiri secara smooth)
  const [pengurusDirection, setPengurusDirection] = useState<"normal" | "reverse">("normal");
  const [isPengurusPaused, setIsPengurusPaused] = useState(false);

  // Dynamic Fitur Utama State (Tersinkronisasi Realtime dengan Dashboard & Supabase)
  const [fiturConfig, setFiturConfig] = useState<FiturUtamaSectionConfig>(DEFAULT_FITUR_UTAMA);
  const [fiturNoticeToast, setFiturNoticeToast] = useState<{
    title: string;
    message: string;
    type?: FloatingAlertType;
  } | null>(null);

  useEffect(() => {
    // 1. Muat dari localStorage / default
    setFiturConfig(getFiturUtamaConfig());

    // 2. Fetch data dari Supabase jika tersedia
    fetchFiturUtamaFromSupabase().then((data) => {
      if (data) setFiturConfig(data);
    });

    // 3. Listener event custom antar-tab & saat dashboard menyimpan
    const handleFiturUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<FiturUtamaSectionConfig>;
      if (customEvent.detail) {
        setFiturConfig(customEvent.detail);
      } else {
        setFiturConfig(getFiturUtamaConfig());
      }
    };

    window.addEventListener(FITUR_UTAMA_UPDATE_EVENT, handleFiturUpdate);

    // 4. Supabase Realtime Listener untuk tabel fitur_utama
    const channel = supabase
      .channel("himasi_realtime_homepage_fitur_utama")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "fitur_utama" },
        () => {
          fetchFiturUtamaFromSupabase().then((data) => {
            if (data) setFiturConfig(data);
          });
        }
      )
      .subscribe();

    return () => {
      window.removeEventListener(FITUR_UTAMA_UPDATE_EVENT, handleFiturUpdate);
      supabase.removeChannel(channel);
    };
  }, []);

  const getFiturIcon = (iconName: string) => {
    switch (iconName) {
      case "UserPlus":
        return UserPlus;
      case "Shirt":
        return TShirt;
      case "Trophy":
        return Trophy;
      case "Award":
      default:
        return Medal;
    }
  };

  return (
    <div className="flex flex-col w-full max-w-full overflow-x-clip bg-white text-[#091e42] min-h-screen">
      {/* 0. Popup Pengumuman Beranda (Muncul saat pertama kali dibuka) */}
      <HomepagePopup />
      
      <section className="relative w-full overflow-hidden h-[calc(100dvh-64px)] min-h-[calc(100dvh-64px)] sm:h-auto sm:min-h-[92vh] flex flex-col justify-center items-center">
        
        {/* 1. Responsive Hero Banner System (Background Desktop & Mobile Berbeda) */}
        <HeroBannerImage />

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
            <CaretDown className="w-4 h-4 sm:w-5 sm:h-5 text-[#00296E]" weight="bold" />
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

        <ScrollReveal className="relative max-w-6xl mx-auto">
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
                        loading="lazy"
                        decoding="async"
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
                            loading="lazy"
                            decoding="async"
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
                          <Play className="w-6 h-6 sm:w-7 sm:h-7 text-white ml-0.5" weight="fill" />
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
                            <Play className="w-2 h-2 text-white ml-0.5" weight="fill" />
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
        </ScrollReveal>
      </section>

      {/* SECTION: HIMASI DALAM ANGKA */}
      <section id="himasi-angka" className="relative py-12 sm:py-16 px-4 sm:px-6 lg:px-12 bg-white w-full overflow-hidden scroll-mt-16">
        <div className="relative max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 items-stretch">
            
            {/* Kolom Kiri: Header 'HIMASI dalam Angka' */}
            <ScrollReveal direction="up" className="sm:col-span-2 lg:col-span-1 flex flex-col justify-center py-2 pr-2">
              <div className="flex items-center gap-2 text-4xl font-extrabold text-[#00296E] uppercase">
                <span>HIMASI</span>
              </div>
              <h3 className="text-2xl sm:text-3xl lg:text-[28px] xl:text-3xl font-bold tracking-tight text-[#00296E] leading-tight">
                dalam <span className="text-[#0094E0]">Angka</span>
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-2.5 leading-relaxed font-normal">
                Lebih dari sekadar angka, ini adalah tentang perjalanan dan kontribusi.
              </p>
            </ScrollReveal>

            {/* Kolom Kanan: 3 Metric Cards (Animasi kotak muncul satu persatu) */}
            {[
              {
                number: "",
                icon: CalendarBlank,
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
                icon: Medal,
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
                    className="h-full relative rounded-2xl bg-[#00296E] border border-white/10 p-5 sm:p-6 flex flex-col justify-between shadow-xl hover:-translate-y-1 hover:border-[#0094E0]/40 transition-all duration-300 group"
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
                </ScrollReveal>
              );
            })}

          </div>
        </div>
      </section>

      {/* SECTION: VISI & MISI KABINET (PERSIS SESUAI PROFILE PAGE) */}
      <section id="visi-misi" className="relative py-12 sm:py-16 px-4 sm:px-6 lg:px-12 bg-gradient-to-b from-white via-[#f7faff] to-white w-full overflow-hidden scroll-mt-16">
        <div className="max-w-6xl mx-auto">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
            
            {/* Kolom Kiri: VISI (Bentuk Trapesium Presisi Sesuai Profile Page - Card Pop) */}
            <ScrollReveal direction="card-pop" className="lg:col-span-5 h-full">
              <div className="relative flex flex-col justify-between p-7 sm:p-9 lg:p-10 min-h-[380px] drop-shadow-2xl group overflow-hidden rounded-2xl h-full">
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
                  {/* Header: VISI KABINET */}
                  <div className="flex items-center gap-2.5 text-xl font-bold tracking-[0.25em] text-white uppercase">
                    <span className="w-2 h-2 rounded-full bg-[#0094E0]" />
                    <span>VISI KABINET</span>
                  </div>

                  {/* Body: Visi Statement with Balanced Typography */}
                  <div className="my-auto py-5 sm:py-7 pr-4 sm:pr-8 lg:pr-12">
                    <p className="text-white text-lg sm:text-xl lg:text-[22px] xl:text-[23px] font-normal leading-[1.65] sm:leading-[1.7] tracking-normal">
                      Mewujudkan HIMASI sebagai pusat <strong className="font-extrabold text-white underline decoration-[#0094E0] decoration-2 underline-offset-4">kreativitas dan perkembangan teknologi</strong> yang kreatif, kolaboratif, dan relevan di mana setiap mahasiswa bisa berkembang bersama tanpa takut tertinggal.
                    </p>
                  </div>

                  {/* Bottom: Minimal Signature Line (Clean & Simple, No Badges) */}
                  <div className="pt-4 sm:pt-5 border-t border-white/10 flex items-center justify-between text-xs tracking-wider text-white/50 font-mono">
                    <span>KABINET REKSABUDAYA</span>
                    <span>HIMASI</span>
                  </div>
                </div>
              </div>
            </ScrollReveal>

            {/* Kolom Kanan: MISI (5 Pill Horizontal Sesuai Profile Page - Muncul Satu Persatu) */}
            <div className="lg:col-span-7 flex flex-col justify-center py-2">
              {/* Header: MISI KABINET */}
              <ScrollReveal direction="up">
                <div className="flex items-center gap-2.5 text-xl font-bold tracking-[0.25em] text-[#00296E] uppercase mb-4 sm:mb-5">
                  <span className="w-2 h-2 rounded-full bg-[#0094E0]" />
                  <span>MISI KABINET</span>
                </div>
              </ScrollReveal>

              {/* 5 Misi Items with Numbered Circle Badges (Muncul satu persatu bergantian) */}
              <div className="space-y-3 sm:space-y-3.5">
                {MISI_KABINET_ITEMS.map((misi, idx) => (
                  <ScrollReveal key={idx} direction="left" delay={idx * 120}>
                    <div className="flex items-center gap-3 sm:gap-4 group">
                      {/* Circle Badge 01, 02, 03, 04, 05 */}
                      <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#00296E] text-white font-bold text-xs sm:text-sm flex items-center justify-center shrink-0 shadow-sm transition-all duration-200 group-hover:scale-105 group-hover:bg-[#0094E0]">
                        {misi.no}
                      </div>

                      {/* Pill Text Container */}
                      <div className="flex-1 py-3 px-4 sm:px-5 rounded-2xl sm:rounded-[22px] bg-slate-50 border border-slate-100 transition-all duration-200 group-hover:bg-slate-100/80 group-hover:border-slate-200">
                        <p className={`text-xs sm:text-sm leading-relaxed ${misi.highlight ? "text-[#0094E0] font-semibold" : "text-slate-700 font-medium"}`}>
                          {misi.text}
                        </p>
                      </div>
                    </div>
                  </ScrollReveal>
                ))}
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* SECTION: DAFTAR FITUR UTAMA (TOGGLE OPEN / CLOSED DARI DASHBOARD) */}
      {fiturConfig.showSection && (
        <section id="fitur-utama" className="relative py-8 sm:py-2 px-4 sm:px-6 lg:px-12 bg-white w-full overflow-hidden scroll-mt-16">
          <ScrollReveal className="relative max-w-6xl mx-auto">
            <div className="mb-6 sm:mb-8">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#00296E] tracking-tight">
                Daftar Fitur Utama
              </h2>
            </div>

            {/* Cards Grid: 4 Fitur Utama (Status Open / Closed Dinamis dari Dashboard) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
              {fiturConfig.items.map((card) => {
                const IconComp = getFiturIcon(card.iconName);
                const isOpen = card.isOpen;
                const statusLabel = isOpen
                  ? (card.statusOpenText || "Lihat Selengkapnya")
                  : (card.statusClosedText || "Coming Soon");
                const statusColor = isOpen ? "text-[#22c55e]" : "text-[#eb5f5f]";
                const isLocked = !isOpen && card.lockWhenClosed;

                const handleCardClick = (e: React.MouseEvent) => {
                  if (isLocked) {
                    e.preventDefault();
                    setFiturNoticeToast({
                      title: "Information",
                      message: `Fitur ${card.title} saat ini sedang ditutup (${statusLabel}). Pantau terus informasi terbaru di media sosial resmi HIMASI!`,
                      type: "info",
                    });
                  }
                };

                return (
                  <Link
                    key={card.id}
                    href={card.href}
                    onClick={handleCardClick}
                    className={`group relative flex flex-col justify-between p-6 sm:p-7 min-h-[160px] sm:min-h-[175px] rounded-2xl transition-all duration-300 select-none overflow-hidden ${
                      isLocked
                        ? "cursor-not-allowed opacity-95 hover:border-rose-400/40"
                        : "cursor-pointer hover:-translate-y-1.5"
                    }`}
                    style={{
                      background: "#00296E",
                    }}
                    title={isLocked ? `${card.title} (${statusLabel})` : card.title}
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
                      <span className={`text-xs sm:text-sm font-semibold tracking-wide ${statusColor}`}>
                        {statusLabel}
                      </span>
                      {!isOpen && (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-400/30">
                          Closed
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>

          </ScrollReveal>
        </section>
      )}

      {/* SECTION: BERITA & INFORMASI TERKINI (CAROUSEL SESUAI REFERENSI) */}
      <section id="berita-informasi" className="relative py-14 sm:py-20 px-4 sm:px-6 lg:px-12 bg-[#FFFFFF] w-full overflow-hidden ">
        <ScrollReveal className="relative max-w-6xl mx-auto">
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
                  <CaretLeft className="w-5 h-5" weight="bold" />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white border border-slate-200/90 hover:border-[#00296E] hover:bg-[#00296E] hover:text-white text-[#00296E] flex items-center justify-center shadow-sm hover:shadow-md transition-all active:scale-95 cursor-pointer"
                  aria-label="Berita Selanjutnya"
                >
                  <CaretRight className="w-5 h-5" weight="bold" />
                </button>
              </div>
            </div>
          </div>

          {/* Carousel Slider Card Container: 2 Kolom Card Per View (Infinite & Geser Drag/Swipe) */}
          {loadingNews ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 select-none">
              {[1, 2].map((i) => (
                <div key={i} className="px-2 sm:px-3 animate-pulse">
                  <div className="bg-slate-50 rounded-[24px] sm:rounded-[28px] p-4 sm:p-5 border border-slate-100 flex flex-col sm:flex-row gap-4 sm:gap-4.5 items-stretch h-full">
                    <div className="w-full sm:w-[155px] md:w-[165px] lg:w-[185px] aspect-[16/10] sm:aspect-square shrink-0 rounded-[18px] sm:rounded-[20px] bg-slate-200" />
                    <div className="flex-1 flex flex-col justify-between py-1 space-y-3">
                      <div className="space-y-2">
                        <div className="w-20 h-4 bg-slate-200 rounded-full" />
                        <div className="w-full h-5 bg-slate-200 rounded" />
                        <div className="w-3/4 h-5 bg-slate-200 rounded" />
                        <div className="w-full h-3.5 bg-slate-200 rounded mt-2" />
                        <div className="w-5/6 h-3.5 bg-slate-200 rounded" />
                      </div>
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                        <div className="w-24 h-3 bg-slate-200 rounded" />
                        <div className="flex gap-2">
                          <div className="w-8 h-8 rounded-full bg-slate-200" />
                          <div className="w-8 h-8 rounded-full bg-slate-200" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : slides.length > 0 ? (
            <div
              className={`relative w-full max-w-full overflow-hidden select-none ${
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
                {slides.map((item) => (
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
                      <Link
                        href={`/berita/${item.slug}`}
                        draggable={false}
                        className="relative w-full sm:w-[155px] md:w-[165px] lg:w-[185px] aspect-[16/10] sm:aspect-square shrink-0 rounded-[18px] sm:rounded-[20px] overflow-hidden bg-slate-900 group/img select-none block"
                      >
                        <img
                          src={item.image_url}
                          alt={item.title}
                          draggable={false}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-500 pointer-events-none"
                        />
                        {/* Tag Kategori (seperti #science pada gambar referensi) */}
                        <span className="absolute top-2.5 left-2.5 z-10 px-2.5 py-0.5 rounded-full text-[11px] font-semibold text-white/95 bg-black/45 backdrop-blur-md border border-white/10 tracking-wide pointer-events-none">
                          #{item.category_key || "berita"}
                        </span>
                      </Link>

                      {/* Sisi Kanan: Judul, Deskripsi, Penulis, dan Tombol Aksi */}
                      <div className="flex-1 flex flex-col justify-between py-0.5 min-w-0">
                        <div>
                          <Link href={`/berita/${item.slug}`} draggable={false}>
                            <h3 className="text-base sm:text-[17px] lg:text-lg font-bold text-[#00296E] hover:text-[#0094E0] transition-colors leading-snug line-clamp-2 cursor-pointer">
                              {item.title}
                            </h3>
                          </Link>
                          <p className="mt-2 text-slate-500 text-xs sm:text-[13px] leading-relaxed line-clamp-2 sm:line-clamp-3 font-normal">
                            {item.excerpt}
                          </p>
                        </div>

                        {/* Bar Bawah: Tanggal & Action Buttons */}
                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-[11px] text-slate-400 font-medium">
                            {formatBeritaDate(item.published_at)}
                          </span>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleShare(item)}
                              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#00296E] hover:bg-[#0094E0] text-white flex items-center justify-center shadow-sm hover:shadow-md transition-all hover:scale-105 active:scale-95 cursor-pointer"
                              aria-label="Bagikan Berita"
                              title="Bagikan Tautan Berita"
                            >
                              <ShareNetwork className="w-3.5 h-3.5 sm:w-4 sm:h-4" weight="bold" />
                            </button>
                            <Link
                              href={`/berita/${item.slug}`}
                              draggable={false}
                              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-slate-200 hover:border-[#00296E] hover:bg-slate-50 text-slate-700 flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer"
                              aria-label="Baca Selengkapnya"
                              title="Detail Berita"
                            >
                              <DotsThree className="w-4 h-4 sm:w-4.5 sm:h-4.5" weight="bold" />
                            </Link>
                          </div>
                        </div>

                      </div>

                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-12 text-center bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-slate-500 text-sm">Belum ada kabar berita terbaru.</p>
            </div>
          )}

          {/* Indikator Titik Pagination Carousel */}
          {!loadingNews && newsList.length > 1 && (
            <div className="mt-6 sm:mt-8 flex items-center justify-center gap-2">
              {newsList.map((_, idx) => (
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
          )}

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

        </ScrollReveal>
      </section>

      {/* SECTION: PENGURUS HIMASI (INFINITE SMOOTH CAROUSEL BERJALAN SENDIRI) */}
      <section id="pengurus-himasi" className="relative py-8 sm:py-10 px-4 sm:px-6 lg:px-12 bg-white w-full overflow-hidden scroll-mt-16">
        <ScrollReveal className="relative max-w-6xl mx-auto">
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
          <div className="relative w-full max-w-full overflow-hidden select-none group/carousel py-2">
            
            {/* Left & Right Gradient Fade Masks */}
            <div className="pointer-events-none absolute -left-4 sm:-left-8 -top-1 -bottom-1 w-14 sm:w-36 z-20 bg-gradient-to-r from-white via-white/90 to-transparent" />
            <div className="pointer-events-none absolute -right-4 sm:-right-8 -top-1 -bottom-1 w-14 sm:w-36 z-20 bg-gradient-to-l from-white via-white/90 to-transparent" />

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
                {displayPengurus.map((item, idx) => (
                  <div
                    key={`track1-${item.id}-${idx}`}
                    className="w-[280px] sm:w-[320px] md:w-[350px] shrink-0"
                  >
                    <div className="relative aspect-[3/4] sm:aspect-[3/4.1] rounded-[24px] sm:rounded-[28px] bg-white border border-slate-200/90 hover:border-slate-300 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 overflow-hidden group/card select-none flex flex-col justify-end">
                      {/* Foto Pengurus Full */}
                      <div className="absolute inset-0 bg-slate-100 overflow-hidden">
                        <img
                          src={item.image || "/DSC01203.jpg"}
                          alt={item.nama}
                          draggable={false}
                          loading="lazy"
                          decoding="async"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = "/DSC01203.jpg";
                          }}
                          className="w-full h-full object-cover object-top group-hover/card:scale-105 transition-transform duration-500 pointer-events-none"
                        />
                      </div>

                      {/* Konten Bawah: Banner Biru untuk Nama + Subtitle Jabatan Sesuai Gambar Referensi */}
                      <div className="relative z-10 p-4 sm:p-5 pb-5 sm:pb-6 flex flex-col items-start max-w-full">
                        <div className="inline-block px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xs bg-gradient-to-r from-[#003B96] via-[#0055D4] to-[#FFFFFF]/20 max-w-full">
                          <h3 className="text-white font-black text-sm sm:text-base lg:text-[17px] xl:text-[18px] tracking-wider uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.55)] leading-tight select-none truncate max-w-full">
                            {item.nama}
                          </h3>
                        </div>
                        <p className="mt-1.5 sm:mt-2 text-white font-extrabold text-xs sm:text-[13px] tracking-[0.14em] uppercase select-none pl-0.5 drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] truncate max-w-full">
                          {item.jabatan}
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
                {displayPengurus.map((item, idx) => (
                  <div
                    key={`track2-${item.id}-${idx}`}
                    className="w-[280px] sm:w-[320px] md:w-[350px] shrink-0"
                  >
                    <div className="relative aspect-[3/4] sm:aspect-[3/4.1] rounded-[24px] sm:rounded-[28px] bg-white border border-slate-200/90 hover:border-slate-300 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 overflow-hidden group/card select-none flex flex-col justify-end">
                      {/* Foto Pengurus Full */}
                      <div className="absolute inset-0 bg-slate-100 overflow-hidden">
                        <img
                          src={item.image || "/DSC01203.jpg"}
                          alt={item.nama}
                          draggable={false}
                          loading="lazy"
                          decoding="async"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = "/DSC01203.jpg";
                          }}
                          className="w-full h-full object-cover object-top group-hover/card:scale-105 transition-transform duration-500 pointer-events-none"
                        />
                      </div>

                      {/* Konten Bawah: Banner Biru untuk Nama + Subtitle Jabatan Sesuai Gambar Referensi */}
                      <div className="relative z-10 p-4 sm:p-5 pb-5 sm:pb-6 flex flex-col items-start max-w-full">
                        <div className="inline-block px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xs bg-gradient-to-r from-[#003B96] via-[#0055D4] to-[#FFFFFF]/20 max-w-full">
                          <h3 className="text-white font-black text-sm sm:text-base lg:text-[17px] xl:text-[18px] tracking-wider uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.55)] leading-tight select-none truncate max-w-full">
                            {item.nama}
                          </h3>
                        </div>
                        <p className="mt-1.5 sm:mt-2 text-white font-extrabold text-xs sm:text-[13px] tracking-[0.14em] uppercase select-none pl-0.5 drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] truncate max-w-full">
                          {item.jabatan}
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

        </ScrollReveal>
      </section>

      {/* SECTION: FORM ASPIRASI MAHASISWA */}
      <FormAspirasi />

      {/* SECTION: FREQUENTLY ASKED QUESTIONS (FAQ DENGAN SHAPE BOX & LEFT ALIGN) */}
      <section
        id="faq"
        className="relative py-2 sm:py-10 px-4 sm:px-6 lg:px-12 bg-white w-full overflow-hidden scroll-mt-16"
      >
        <ScrollReveal className="relative max-w-6xl mx-auto">
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
                        <CaretUp className="w-5 h-5" weight="bold" />
                      ) : (
                        <CaretDown className="w-5 h-5" weight="bold" />
                      )}
                    </div>
                  </button>
                </div>
              );
            })}
          </div>

        </ScrollReveal>
      </section>

      {/* Toast Notifikasi Berhasil Salin Link */}
      {copiedToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#00296E] text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 text-xs sm:text-sm font-semibold animate-bounce">
          <Check className="w-4 h-4 text-emerald-400" weight="bold" />
          <span>Tautan berita berhasil disalin!</span>
        </div>
      )}

      {/* Floating Alert Notifikasi Fitur Tertutup (Closed) - Modern & Unik di Atas Kanan */}
      {fiturNoticeToast && (
        <FloatingAlert
          isOpen={!!fiturNoticeToast}
          onClose={() => setFiturNoticeToast(null)}
          title={fiturNoticeToast.title}
          message={fiturNoticeToast.message}
          type={fiturNoticeToast.type || "info"}
          position="top-right"
          duration={5000}
        />
      )}

      {/* Footer Section Sesuai Referensi Layout */}
      <Footer />

    </div>
  );
}
