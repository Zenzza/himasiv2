"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  Mail
} from "lucide-react";

// Nav items mapped alongside the Payius layout
const himasiNavItems = [
  { name: "Home", href: "/" },
  { name: "Berita", href: "/berita" },
  { name: "Kabinet", href: "/profil" },
  { name: "Tentang", href: "/tentang" },
  { name: "Kalender", href: "/kalender" },
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

  const isHomepage = pathname === "/";
  // Kondisi: jika bukan homepage dan sedang di posisi paling atas, background putih transparan
  const isTransparentWhite = !isHomepage && !isScrolled;

  return (
    <header className="sticky top-0 z-50 w-full transition-all duration-300">
      {/* 
        Navbar Container:
        - Jika bukan HOMEPAGE dan posisi di atas: background putih (transparan) dengan teks biru #00296E
        - Jika HOMEPAGE atau di-scroll: warna biru navy (#00296E) dengan teks putih
      */}
      <div
        className={`w-full transition-all duration-300 ${
          isTransparentWhite
            ? "bg-white text-[#00296E]"
            : "bg-[#00296E] text-white"
        }`}
      >
        <div className="w-full px-5 sm:px-10 lg:px-16 py-3.5 sm:py-4 flex items-center justify-between">
          
          {/* Left: Official HIMASI Logo + Brand Name */}
          <div className="flex items-center flex-1 justify-start">
            <Link
              href="/"
              className="flex items-center gap-2.5 sm:gap-3 group focus:outline-none"
              aria-label="HIMASI Home"
            >
              <img
                src="/logo-himasi.png"
                alt="Logo HIMASI ISB Atma Luhur"
                className="w-10 h-10 sm:w-11 sm:h-11 object-contain group-hover:scale-105 transition-transform drop-shadow-sm select-none"
              />

              <span
                className={`font-bold text-xl sm:text-2xl tracking-tight font-sans select-none whitespace-nowrap transition-colors duration-200 ${
                  isTransparentWhite ? "text-[#00296E]" : "text-white"
                }`}
              >
                HIMASI Atma Luhur
              </span>
            </Link>
          </div>

          {/* Center: Navigasi Utama (Home, Berita, Kabinet, Tentang, Kalender) */}
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

          {/* Right: Tombol Contact Us + Mobile Hamburger */}
          <div className="flex items-center flex-1 justify-end gap-3 sm:gap-4">
            {/* Tombol Contact Us */}
            <Link
              href="/tentang#ko"
              className={`inline-flex items-center gap-1.5 px-4 sm:px-5 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 shadow-sm hover:shadow active:scale-95 select-none ${
                isTransparentWhite
                  ? "bg-[#00296E] hover:bg-[#0094E0] text-white"
                  : "bg-white hover:bg-slate-100 text-[#00296E]"
              }`}
            >
              <Mail className="w-4 h-4" />
              <span>Contact Us</span>
            </Link>

            {/* Mobile Hamburger Toggle Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`md:hidden p-2 rounded-xl transition-colors focus:outline-none ${
                isTransparentWhite
                  ? "text-[#00296E] hover:bg-slate-100"
                  : "text-white hover:bg-white/15"
              }`}
              aria-label={mobileMenuOpen ? "Tutup Menu" : "Buka Menu"}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div
            className={`md:hidden w-full px-5 py-4 border-t animate-in fade-in slide-in-from-top-2 duration-150 ${
              isTransparentWhite
                ? "bg-white text-slate-800 border-slate-200 shadow-lg"
                : "bg-[#001e52] text-white border-white/15"
            }`}
          >
            <div className="grid grid-cols-2 gap-2 mb-3">
              {himasiNavItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center justify-center py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                      isActive
                        ? isTransparentWhite
                          ? "bg-[#00296E] text-white shadow-sm font-bold"
                          : "bg-white text-[#00296E] shadow-sm font-bold"
                        : isTransparentWhite
                        ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        : "bg-white/10 text-white/90 hover:bg-white/20"
                    }`}
                  >
                    {item.name}
                  </Link>
                );
              })}
            </div>

            <div
              className={`pt-2 flex items-center justify-between text-xs px-2 border-t ${
                isTransparentWhite
                  ? "text-slate-600 border-slate-200"
                  : "text-white/80 border-white/10"
              }`}
            >
              <Link
                href="/profil#kontak"
                onClick={() => setMobileMenuOpen(false)}
                className={`inline-flex items-center gap-1.5 font-bold px-3 py-1.5 rounded-lg ${
                  isTransparentWhite
                    ? "text-white bg-[#00296E]"
                    : "text-white bg-white/20"
                }`}
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Contact Us</span>
              </Link>
              <Link
                href="/profil#kontak"
                onClick={() => setMobileMenuOpen(false)}
                className={`font-semibold underline underline-offset-2 ${
                  isTransparentWhite ? "text-[#00296E]" : "text-white"
                }`}
              >
                Kontak & Kemitraan
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
