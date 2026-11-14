"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * ScrollToTopOnNav
 * Memastikan layar selalu kembali ke titik tertinggi (top: 0) saat berpindah halaman / menu navigasi.
 */
export default function ScrollToTopOnNav() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window !== "undefined") {
      // Jika terdapat hash anchor (misal: #kontak), izinkan peramban menggulir ke elemen target
      if (window.location.hash) {
        const targetId = window.location.hash.replace("#", "");
        const el = document.getElementById(targetId);
        if (el) {
          setTimeout(() => {
            el.scrollIntoView({ behavior: "smooth", block: "start" });
          }, 100);
          return;
        }
      }

      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      requestAnimationFrame(() => {
        if (!window.location.hash) {
          window.scrollTo({ top: 0, left: 0, behavior: "instant" });
        }
      });
    }
  }, [pathname]);

  return null;
}

