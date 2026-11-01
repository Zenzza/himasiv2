"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { usePathname } from "next/navigation";

interface LoadingScreenProps {
  children?: React.ReactNode;
  /**
   * Jika true, loading screen akan selalu dipaksa muncul.
   */
  forceShow?: boolean;
  /**
   * Callback opsional ketika loading screen selesai membuka tirai.
   */
  onComplete?: () => void;
}

const TOTAL_SEGMENTS = 64; // Jumlah segmen bar vertikal memanjang dari ujung kiri ke kanan
const INITIAL_DELAY_MS = 1000; // Jeda awal 1 detik sebelum bar mulai berhitung
const PROGRESS_DURATION_MS = 2400; // Durasi animasi hitungan dari 0% hingga 100%
const SEGMENT_INDICES = Array.from({ length: TOTAL_SEGMENTS }, (_, i) => i);

export default function LoadingScreen({ children, forceShow = false, onComplete }: LoadingScreenProps) {
  const pathname = usePathname();
  const isExcludedPath = Boolean(
    pathname &&
      (pathname.startsWith("/dashboard") ||
        pathname === "/login" ||
        pathname.startsWith("/error") ||
        pathname === "/_not-found")
  );

  // State fase: 'idle' (delay awal) -> 'animating' (bar jalan) -> 'exiting' (seluruh kontainer naik) -> 'hidden' (selesai)
  const [phase, setPhase] = useState<"idle" | "animating" | "exiting" | "hidden">("idle");

  useEffect(() => {
    const handleDismiss = () => {
      setPhase("hidden");
      restoreScroll();
    };
    if (typeof window !== "undefined") {
      window.addEventListener("himasi:dismiss-preloader", handleDismiss);
      return () => window.removeEventListener("himasi:dismiss-preloader", handleDismiss);
    }
  }, []);
  const [progress, setProgress] = useState(0);
  const [showText, setShowText] = useState(false);

  const onCompleteRef = useRef(onComplete);
  const exitTimerRef = useRef<NodeJS.Timeout | null>(null);
  const snapTimerRef = useRef<NodeJS.Timeout | null>(null);
  const delayTimerRef = useRef<NodeJS.Timeout | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const lastProgressRef = useRef(-1);
  const textShownRef = useRef(false);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // Helper untuk membersihkan seluruh sisa style scroll pada html & body
  const restoreScroll = () => {
    if (typeof document !== "undefined") {
      document.documentElement.style.overflow = "";
      document.documentElement.style.height = "";
      document.body.style.overflow = "";
      document.body.style.height = "";
      document.body.style.touchAction = "";
    }
  };

  // Transisi exit: kontainer utama meluncur -100vh ke atas, menarik navbar & halaman langsung di bawah preloader
  const exitIntro = () => {
    if (snapTimerRef.current) clearTimeout(snapTimerRef.current);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (delayTimerRef.current) clearTimeout(delayTimerRef.current);

    setPhase("exiting");

    if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
    // 1100ms durasi transisi naik ke atas tirai preloader
    exitTimerRef.current = setTimeout(() => {
      setPhase("hidden");
      restoreScroll();
      onCompleteRef.current?.();
    }, 1100);
  };

  // Jalankan perhitungan progress dari 0% ke 100% (Dioptimasi tanpa re-render berlebihan)
  const runProgressLoop = () => {
    let startTime: number | null = null;

    const animateProgress = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const rawProgress = Math.min(elapsed / PROGRESS_DURATION_MS, 1);

      // Kurva easing Walbi: awal lembut, akselerasi di tengah, suspens di 75-92%, lalu snap ke 100%
      let easedProgress = 0;
      if (rawProgress < 0.55) {
        easedProgress = (rawProgress / 0.55) * 68;
      } else if (rawProgress < 0.88) {
        easedProgress = 68 + ((rawProgress - 0.55) / 0.33) * 25;
      } else {
        easedProgress = 93 + ((rawProgress - 0.88) / 0.12) * 7;
      }

      const currentInt = Math.floor(Math.min(easedProgress, 100));

      // Optimasi CPU: Hanya picu re-render React saat angka persentase benar-benar berubah
      if (currentInt !== lastProgressRef.current) {
        lastProgressRef.current = currentInt;
        setProgress(currentInt);

        // Munculkan teks HIMASI setelah progress mencapai 28%
        if (currentInt >= 28 && !textShownRef.current) {
          textShownRef.current = true;
          setShowText(true);
        }
      }

      if (rawProgress < 1) {
        animFrameRef.current = requestAnimationFrame(animateProgress);
      } else {
        setProgress(100);
        snapTimerRef.current = setTimeout(() => {
          exitIntro();
        }, 220); // Jeda bernapas saat mencapai 100%
      }
    };

    animFrameRef.current = requestAnimationFrame(animateProgress);
  };

  // Penguncian scroll aktif secara reaktif berdasarkan fase preloader:
  // - Aktif saat preloader muncul ('idle', 'animating', 'exiting')
  // - Otomatis dilepas seutuhnya seketika tirai selesai ('hidden')
  useEffect(() => {
    if ((isExcludedPath && !forceShow) || phase === "hidden") {
      restoreScroll();
      return;
    }

    // Pastikan scroll berada di puncak paling atas
    if (typeof window !== "undefined") {
      window.scrollTo(0, 0);
    }

    // Intersep sentuhan layar mobile, roda mouse, dan tombol keyboard navigasi
    const preventScroll = (e: TouchEvent | WheelEvent) => {
      if (e.cancelable) {
        e.preventDefault();
      }
    };

    const preventKeys = (e: KeyboardEvent) => {
      if (["Space", "ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End"].includes(e.code)) {
        if (e.cancelable) {
          e.preventDefault();
        }
      }
    };

    window.addEventListener("touchmove", preventScroll, { passive: false });
    window.addEventListener("wheel", preventScroll, { passive: false });
    window.addEventListener("keydown", preventKeys);

    return () => {
      window.removeEventListener("touchmove", preventScroll);
      window.removeEventListener("wheel", preventScroll);
      window.removeEventListener("keydown", preventKeys);
      restoreScroll();
    };
  }, [phase, isExcludedPath, forceShow]);

  // Mulai alur animasi lengkap dari awal
  const startFullSequence = () => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (snapTimerRef.current) clearTimeout(snapTimerRef.current);
    if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
    if (delayTimerRef.current) clearTimeout(delayTimerRef.current);

    lastProgressRef.current = 0;
    textShownRef.current = false;
    setProgress(0);
    setShowText(false);
    setPhase("idle");

    if (typeof window !== "undefined") {
      window.scrollTo(0, 0);
    }

    // Delay 1 detik sebelum bar LED mulai terisi
    delayTimerRef.current = setTimeout(() => {
      setPhase("animating");
      runProgressLoop();
    }, INITIAL_DELAY_MS);
  };

  // Mount effect & register global handlers
  useEffect(() => {
    if (isExcludedPath && !forceShow) {
      restoreScroll();
      return;
    }

    // Jalankan urutan animasi dengan delay
    delayTimerRef.current = setTimeout(() => {
      setPhase("animating");
      runProgressLoop();
    }, INITIAL_DELAY_MS);

    // Daftarkan fungsi global replay untuk DevTools console
    const handleReplay = () => {
      startFullSequence();
    };

    if (typeof window !== "undefined") {
      (window as unknown as { replayIntro?: () => void }).replayIntro = handleReplay;
      window.addEventListener("himasi:replay-intro", handleReplay);
      console.log(
        "%c[HIMASI] Loading screen aktif. Ketik replayIntro() di console untuk memutar ulang animasi.",
        "color: #38bdf8; font-weight: bold; font-size: 12px;"
      );
    }

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (snapTimerRef.current) clearTimeout(snapTimerRef.current);
      if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
      if (delayTimerRef.current) clearTimeout(delayTimerRef.current);
      window.removeEventListener("himasi:replay-intro", handleReplay);
      restoreScroll();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isExcludedPath, forceShow]);

  const activeSegmentsCount = useMemo(() => {
    return Math.floor((progress / 100) * TOTAL_SEGMENTS);
  }, [progress]);

  // Jika rute dikecualikan atau animasi sudah selesai sepenuhnya ('hidden'), render konten normal
  if ((isExcludedPath && !forceShow) || phase === "hidden") {
    return (
      <div className="min-h-full flex-1 flex flex-col bg-white">
        {children}
      </div>
    );
  }

  const isExiting = phase === "exiting";

  return (
    <div
      className="w-full relative overflow-hidden"
      style={{
        transform: isExiting ? "translate3d(0, -100vh, 0)" : "translate3d(0, 0, 0)",
        transition: isExiting ? "transform 1100ms cubic-bezier(0.76, 0, 0.24, 1)" : "none",
        willChange: isExiting ? "transform" : "auto",
        backfaceVisibility: "hidden",
        WebkitBackfaceVisibility: "hidden",
      }}
    >
      {/* 1. Preloader Screen: Mengisi tepat 100vh pertama di layar */}
      <div
        id="himasi-preloader-root"
        aria-label="Memuat Portal HIMASI"
        role="status"
        aria-live="polite"
        className="w-full h-screen relative flex flex-col justify-between overflow-hidden select-none bg-[#00296E] shrink-0"
      >
        {/* Subtle Ambient Vertical Rays (GPU Accelerated) */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div
            className={`absolute inset-x-0 bottom-0 h-[60vh] flex justify-around items-end pointer-events-none transition-opacity duration-1000 ${
              showText ? "opacity-25" : "opacity-0"
            }`}
          >
            <div className="w-[1px] h-[45%] bg-gradient-to-t from-[#38BDF8] to-transparent intro-ray-anim-1" />
            <div className="w-[1.5px] h-[70%] bg-gradient-to-t from-[#38BDF8] to-transparent intro-ray-anim-2" />
            <div className="w-[1px] h-[55%] bg-gradient-to-t from-[#38BDF8] to-transparent intro-ray-anim-3" />
            <div className="w-[2px] h-[80%] bg-gradient-to-t from-[#38BDF8] to-transparent intro-ray-anim-1" />
            <div className="w-[1px] h-[40%] bg-gradient-to-t from-[#38BDF8] to-transparent intro-ray-anim-2" />
            <div className="w-[1.5px] h-[65%] bg-gradient-to-t from-[#38BDF8] to-transparent intro-ray-anim-3" />
          </div>
        </div>

        {/* Top Header: Loading Bar Jauh Lebih Tinggi Sesuai Gambar Referensi (H-10 / H-12) */}
        <header className="relative z-10 w-full px-4 sm:px-8 pt-5 sm:pt-8 flex items-center justify-between gap-3 sm:gap-6">
          {/* Segmented LED Bar Memanjang Penuh dari Tepi Kiri hingga Counter (Performa Tinggi Tanpa Delay CSS) */}
          <div
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            className="flex-1 flex items-center justify-between gap-[2px] sm:gap-[2.5px] min-w-0 h-10 sm:h-12"
          >
            {SEGMENT_INDICES.map((index) => {
              const isActive = index < activeSegmentsCount;
              const isLeading = index === activeSegmentsCount - 1;
              const isNearLeading = index >= activeSegmentsCount - 3 && index < activeSegmentsCount - 1;

              return (
                <div
                  key={index}
                  className={`h-full flex-1 min-w-0 rounded-[1px] ${
                    isActive
                      ? isLeading
                        ? "bg-white shadow-[0_0_12px_#ffffff,0_0_6px_#38BDF8]"
                        : isNearLeading
                        ? "bg-[#67E8F9] shadow-[0_0_6px_rgba(56,189,248,0.7)]"
                        : "bg-[#38BDF8]"
                      : "bg-white/[0.14]"
                  }`}
                />
              );
            })}
          </div>

          {/* Digital Percentage Monospace Counter */}
          <div className="min-w-[48px] sm:min-w-[72px] text-right font-mono text-lg sm:text-2xl font-bold tracking-wider text-[#38BDF8] shrink-0">
            {progress.toString().padStart(2, "0")}%
          </div>
        </header>

        {/* Center Subtitle / Tagline (Ringan & Bersih) */}
        <div
          className={`relative z-10 w-full text-center px-3 sm:px-4 flex flex-col items-center transition-all duration-700 ease-out ${
            showText ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
          }`}
        >
          <p className="font-mono text-[10px] sm:text-xs text-[#93c5fd]/90 tracking-[0.16em] sm:tracking-[0.25em] md:tracking-[0.3em] uppercase font-medium">
            Himpunan Mahasiswa Sistem Informasi
          </p>
          <span className="text-[9px] sm:text-[10px] text-white/40 tracking-[0.15em] font-sans mt-0.5">
            ISB ATMA LUHUR
          </span>
        </div>

        {/* Bottom Hero Typography ("HIMASI" - GPU Accelerated Smooth Emerge, Teroptimasi Responsif Mobile) */}
        <div className="relative z-10 w-full flex justify-center items-end pb-6 sm:pb-10 overflow-hidden px-2 sm:px-4">
          <div
            className={`w-full max-w-full flex justify-center items-end select-none will-change-transform ${
              showText
                ? "opacity-100 translate-y-0 scale-100 transition-all duration-900 ease-[cubic-bezier(0.16,1,0.3,1)]"
                : "opacity-0 translate-y-16 scale-[0.97]"
            }`}
          >
            <div
              role="presentation"
              className="font-black text-[18vw] sm:text-[20vw] md:text-[22vw] leading-[0.88] sm:leading-[0.82] md:leading-[0.76] tracking-[-0.03em] uppercase text-white select-none whitespace-nowrap text-center py-2"
              style={{
                fontFamily: "var(--font-poppins), sans-serif",
                textShadow: "0 4px 16px rgba(0, 0, 0, 0.2)",
              }}
            >
              HIMASI
            </div>
          </div>
        </div>
      </div>

      {/* 2. Seluruh Konten Website: Berada persis di bawah preloader (100vh), lalu ikut naik bersamaan saat exit */}
      <div className="w-full min-h-screen flex flex-col bg-white shrink-0">
        {children}
      </div>
    </div>
  );
}
