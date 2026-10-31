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
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      requestAnimationFrame(() => {
        window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      });
    }
  }, [pathname]);

  return null;
}

