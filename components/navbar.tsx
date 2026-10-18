"use client";

import { useState } from "react";
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

  return (
    <header className="sticky top-0 z-50 w-full transition-all duration-300">
      {/* 
        FULL-WIDTH Navbar Container:
        - 100% full width edge-to-edge
        - Background color: Solid Biru Navy (#00296E) that starts the top-to-bottom gradient
        - Layout structured exactly as Payius: Logo on left, Capsule in center, Eng ⌄ and Start now on right
      */}
      <div className="w-full bg-[#00296E] text-white backdrop-blur-md">
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

              <span className="font-bold text-xl sm:text-2xl tracking-tight text-white font-sans select-none whitespace-nowrap">
                HIMASI Atma Luhur
              </span>
            </Link>
          </div>

          {/* Center: Navigasi Utama (Home, Berita, Kabinet, Tentang, Kalender) */}
          <nav
            aria-label="Navigasi Utama"
            className="hidden md:flex items-center gap-1 bg-white/15 backdrop-blur-md p-1.5 rounded-xl border border-white/20 shadow-inner"
          >
            {himasiNavItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`relative px-4 lg:px-5 py-2 rounded-lg text-xs lg:text-sm font-medium transition-all duration-200 ease-out select-none whitespace-nowrap ${
                    isActive
                      ? "bg-white text-[#00296E] shadow-sm font-bold"
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
              href="/profil#kontak"
              className="inline-flex items-center gap-1.5 px-4 sm:px-5 py-2 rounded-xl bg-white hover:bg-slate-100 text-[#00296E] font-bold text-xs sm:text-sm transition-all duration-200 shadow-sm hover:shadow active:scale-95 select-none"
            >
              <Mail className="w-4 h-4" />
              <span>Contact Us</span>
            </Link>

            {/* Mobile Hamburger Toggle Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-white hover:bg-white/15 transition-colors focus:outline-none"
              aria-label={mobileMenuOpen ? "Tutup Menu" : "Buka Menu"}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden w-full px-5 py-4 bg-[#001e52] text-white border-t border-white/15 animate-in fade-in slide-in-from-top-2 duration-150">
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
                        ? "bg-white text-[#00296E] shadow-sm font-bold"
                        : "bg-white/10 text-white/90 hover:bg-white/20"
                    }`}
                  >
                    {item.name}
                  </Link>
                );
              })}
            </div>

            <div className="pt-2 flex items-center justify-between text-xs px-2 text-white/80 border-t border-white/10">
              <Link
                href="/profil#kontak"
                onClick={() => setMobileMenuOpen(false)}
                className="inline-flex items-center gap-1.5 font-bold text-white bg-white/20 px-3 py-1.5 rounded-lg"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Contact Us</span>
              </Link>
              <Link
                href="/profil#kontak"
                onClick={() => setMobileMenuOpen(false)}
                className="font-semibold underline underline-offset-2 text-white"
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
