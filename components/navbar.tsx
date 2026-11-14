"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { List, X, EnvelopeSimple } from "@phosphor-icons/react";
import { getMaintenanceMode } from "@/lib/supabase/system-settings";
import { supabase } from "@/lib/supabase/client";

// Nav items mapped for desktop and mobile
const himasiNavItems = [
  { name: "Home", href: "/" },
  { name: "Berita", href: "/berita" },
  { name: "Kabinet", href: "/profil" },
  { name: "Tentang", href: "/tentang" },
  { name: "Kalender", href: "/kalender" },
];

const mobileNavItems = [
  { name: "Home", href: "/" },
  { name: "Berita", href: "/berita" },
  { name: "Kabinet", href: "/profil" },
  { name: "Tentang", href: "/tentang" },
  { name: "Kalender", href: "/kalender" },
  { name: "Contact Us", href: "/tentang#kontak" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Deteksi posisi scroll window
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Kunci scroll body saat menu mobile aktif
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  // Tutup menu otomatis jika rute halaman berpindah dan pastikan scroll ke titik tertinggi jika bukan navigasi hash
  useEffect(() => {
    setMobileMenuOpen(false);
    if (typeof document !== "undefined") {
      document.body.style.overflow = "";
    }
    if (typeof window !== "undefined" && !window.location.hash) {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }
  }, [pathname]);

  // Guard Mode Pemeliharaan (503) untuk seluruh rute publik
  useEffect(() => {
    if (!pathname || pathname === "/login" || pathname.startsWith("/dashboard") || pathname.startsWith("/error")) {
      return;
    }

    let isMounted = true;

    const checkMaintenance = () => {
      try {
        getMaintenanceMode()
          .then(async (m) => {
            if (!isMounted) return;
            if (m && m.enabled) {
              try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session && isMounted) {
                  window.location.replace("/error/503");
                }
              } catch {
                if (isMounted) window.location.replace("/error/503");
              }
            }
          })
          .catch((err) => {
            console.warn("[Navbar] Gagal memeriksa status maintenance:", err);
          });
      } catch (err) {
        console.warn("[Navbar] Exception checkMaintenance:", err);
      }
    };

    checkMaintenance();

    let channel: ReturnType<typeof supabase.channel> | null = null;
    try {
      channel = supabase
        .channel("system_settings_realtime")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "system_settings",
            filter: "key=eq.maintenance_mode",
          },
          () => {
            checkMaintenance();
          }
        )
        .subscribe();
    } catch (e) {
      console.warn("[Navbar] Realtime subscription failed:", e);
    }

    return () => {
      isMounted = false;
      if (channel) {
        try {
          supabase.removeChannel(channel);
        } catch {
          // Ignore cleanup errors
        }
      }
    };
  }, [pathname]);

  // Handler klik link menu navigasi (memastikan layar selalu kembali ke puncak atas)
  const handleNavClick = (href: string) => {
    if (typeof document !== "undefined") {
      document.body.style.overflow = "";
    }
    setMobileMenuOpen(false);

    if (!href.includes("#") && typeof window !== "undefined") {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      requestAnimationFrame(() => {
        window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      });
    }
  };

  // Handler khusus tombol Contact Us agar melakukan smooth scroll jika sudah di halaman /tentang
  const handleContactUsClick = (e: React.MouseEvent) => {
    if (typeof document !== "undefined") {
      document.body.style.overflow = "";
    }
    setMobileMenuOpen(false);

    if (pathname === "/tentang") {
      e.preventDefault();
      const el = document.getElementById("kontak");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        if (typeof window !== "undefined") {
          window.history.pushState(null, "", "/tentang#kontak");
        }
      }
    }
  };

  // Tutup menu dengan tombol keyboard Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const isHomepage = pathname === "/";
  // Kondisi: jika bukan homepage dan sedang di posisi paling atas, background putih transparan
  const isTransparentWhite = !isHomepage && !isScrolled;

  // Sembunyikan navbar di halaman login pengurus dan dashboard
  if (pathname === "/login" || pathname?.startsWith("/dashboard")) {
    return null;
  }

  return (
    <>
      <header className="sticky -top-0.5 inset-x-0 z-50 w-full transition-all duration-300">
        {/* 
          Navbar Container:
          - Jika bukan HOMEPAGE dan posisi di atas: background putih dengan teks biru #00296E
          - Jika HOMEPAGE atau di-scroll: warna biru navy (#00296E) dengan teks putih
          - Pseudo-element before:-top-3 menutup celah subpixel / garis putih antara browser chrome & navbar
        */}
        <div
          className={`relative w-full transition-all duration-300 before:content-[''] before:absolute before:-top-3 before:inset-x-0 before:h-3 ${
            isTransparentWhite
              ? "bg-white text-[#00296E] before:bg-white"
              : "bg-[#00296E] text-white before:bg-[#00296E]"
          }`}
        >
          <div className="w-full px-5 sm:px-10 lg:px-16 py-3.5 sm:py-4 flex items-center justify-between">
            
            {/* Left: Official HIMASI Logo + Brand Name */}
            <div className="flex items-center flex-1 justify-start min-w-0">
              <Link
                href="/"
                className="flex items-center gap-2.5 sm:gap-3 group focus:outline-none min-w-0"
                aria-label="HIMASI Home"
              >
                <img
                  src="/logo-himasi.png"
                  alt="Logo HIMASI ISB Atma Luhur"
                  decoding="async"
                  className="w-9 h-9 sm:w-11 sm:h-11 object-contain group-hover:scale-105 transition-transform drop-shadow-sm select-none shrink-0"
                />

                <span
                  className={`font-bold text-lg sm:text-2xl tracking-tight font-sans select-none whitespace-nowrap transition-colors duration-200 ${
                    isTransparentWhite ? "text-[#00296E]" : "text-white"
                  }`}
                >
                  HIMASI Atma Luhur
                </span>
              </Link>
            </div>

            {/* Center: Navigasi Utama Desktop (Home, Berita, Kabinet, Tentang, Kalender) */}
            <nav
              aria-label="Navigasi Utama"
              className={`hidden md:flex items-center gap-1 backdrop-blur-md p-1.5 rounded-xl border shadow-inner transition-all duration-300 ${
                isTransparentWhite
                  ? "bg-slate-100/90 border-slate-200/90"
                  : "bg-white/15 border-white/20"
              }`}
            >
              {himasiNavItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => handleNavClick(item.href)}
                    className={`relative px-4 lg:px-5 py-2 rounded-lg text-xs lg:text-sm font-medium transition-all duration-200 ease-out select-none whitespace-nowrap ${
                      isActive
                        ? isTransparentWhite
                          ? "bg-[#00296E] text-white shadow-sm font-bold"
                          : "bg-white text-[#00296E] shadow-sm font-bold"
                        : isTransparentWhite
                        ? "text-slate-600 hover:text-[#00296E] hover:bg-white/80"
                        : "text-white/90 hover:text-white hover:bg-white/15"
                    }`}
                  >
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            {/* Right: Tombol Contact Us (Desktop) + Mobile Hamburger Toggle */}
            <div className="flex items-center flex-1 justify-end gap-3 sm:gap-4">
              {/* Tombol Contact Us: HANYA tampil di layar desktop (md+) agar tidak menabrak logo di layar mobile */}
              <Link
                href="/tentang#kontak"
                onClick={handleContactUsClick}
                className={`hidden md:inline-flex items-center gap-1.5 px-4 sm:px-5 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 shadow-sm hover:shadow active:scale-95 select-none ${
                  isTransparentWhite
                    ? "bg-[#00296E] hover:bg-[#0094E0] text-white"
                    : "bg-white hover:bg-slate-100 text-[#00296E]"
                }`}
              >
                <EnvelopeSimple className="w-4 h-4" />
                <span>Contact Us</span>
              </Link>

              {/* Mobile Hamburger Toggle Button (Hanya tampil di mobile < md) */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className={`md:hidden p-2 rounded-xl transition-colors focus:outline-none cursor-pointer ${
                  isTransparentWhite
                    ? "text-[#00296E] hover:bg-slate-100"
                    : "text-white hover:bg-white/15"
                }`}
                aria-label="Buka Menu Navigasi"
              >
                <List className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 
        ========================================================================
        FULLSCREEN MOBILE NAVIGATION OVERLAY (Sesuai Referensi Sunday Design)
        ========================================================================
      */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-[100] bg-white text-slate-900 flex flex-col justify-between overflow-y-auto animate-in fade-in duration-200">
          
          {/* Top Bar Header: [Logo] --- [HIMASI] --- [X] */}
          <div className="w-full px-6 sm:px-8 py-4 sm:py-5 flex items-center justify-between border-b border-slate-100">
            {/* Sisi Kiri: Logo HIMASI */}
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center focus:outline-none"
              aria-label="HIMASI Home"
            >
              <img
                src="/logo-himasi.png"
                alt="Logo HIMASI"
                decoding="async"
                className="w-8 h-8 sm:w-9 sm:h-9 object-contain"
              />
            </Link>

            {/* Sisi Tengah: Brand Wordmark */}
            <div className="font-extrabold text-base sm:text-xl tracking-tight text-black font-sans select-none text-center">
              HIMASI Atma Luhur
            </div>

            {/* Sisi Kanan: Tombol Close (X) Bersih & Tegas */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="p-1.5 text-black hover:opacity-60 transition-opacity cursor-pointer focus:outline-none"
              aria-label="Tutup Menu"
            >
              <X className="w-7 h-7" />
            </button>
          </div>

          {/* Menu Items: Typographic Clean Left-Aligned List */}
          <div className="flex-1 px-7 sm:px-10 pt-10 sm:pt-14 pb-12 flex flex-col justify-between">
            <nav className="flex flex-col space-y-6 sm:space-y-7">
              {mobileNavItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={(e) => {
                      if (item.href === "/tentang#kontak") {
                        handleContactUsClick(e);
                      } else {
                        handleNavClick(item.href);
                      }
                    }}
                    className={`text-[30px] sm:text-[36px] font-semibold tracking-tight text-left transition-colors duration-150 block ${
                      isActive
                        ? "text-[#00296E] font-bold"
                        : "text-slate-950 hover:text-[#0094E0]"
                    }`}
                  >
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            {/* Bottom Footer Area */}
            <div className="pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-slate-500">
              <div>
                <p className="font-bold text-slate-800">HIMASI ISB Atma Luhur</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Kabinet REKSABUDAYA • Periode 2025/2026
                </p>
              </div>

              <div className="flex items-center gap-4 text-xs font-semibold text-slate-600">
                <Link
                  href="/login"
                  onClick={() => handleNavClick("/login")}
                  className="hover:text-[#00296E] transition-colors"
                >
                  Portal Pengurus →
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
