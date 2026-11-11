"use client";

import { useState, useEffect, useCallback } from "react";
import { X, MegaphoneSimple, ArrowSquareOut } from "@phosphor-icons/react";
import { type PopupItem } from "@/lib/types/popup";
import { getActivePopup } from "@/lib/supabase/popup";

export default function HomepagePopup() {
  const [popup, setPopup] = useState<PopupItem | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    let isMounted = true;

    async function checkActivePopup() {
      try {
        const active = await getActivePopup();
        if (!isMounted || !active || !active.is_active) return;

        // Periksa apakah pengunjung sudah memilih "Jangan tampilkan lagi" untuk popup ID ini
        const dismissedKey = `himasi_dismissed_popup_${active.id}`;
        const isDismissed = localStorage.getItem(dismissedKey);
        if (isDismissed === "true") return;

        // Periksa apakah popup sudah ditutup pada sesi tab saat ini
        const sessionKey = `himasi_popup_closed_session_${active.id}`;
        const isClosedInSession = sessionStorage.getItem(sessionKey);
        if (isClosedInSession === "true") return;

        setPopup(active);

        // Beri jeda 1.2 detik agar animasi hero banner beranda tidak terpotong
        timer = setTimeout(() => {
          if (isMounted) {
            setIsOpen(true);
          }
        }, 1200);
      } catch {
        // Fallback hening jika penyimpanan lokal atau service belum siap
      }
    }

    checkActivePopup();

    return () => {
      isMounted = false;
      if (timer) clearTimeout(timer);
    };
  }, []);

  const handleClose = useCallback(() => {
    if (!popup) return;

    if (dontShowAgain) {
      try {
        localStorage.setItem(`himasi_dismissed_popup_${popup.id}`, "true");
      } catch {}
    }

    try {
      sessionStorage.setItem(`himasi_popup_closed_session_${popup.id}`, "true");
    } catch {}

    setIsClosing(true);
    setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
    }, 200);
  }, [popup, dontShowAgain]);

  // Kunci scroll halaman belakang saat popup terbuka
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  // Listener tombol Escape keyboard untuk menutup popup
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, handleClose]);

  if (!isOpen || !popup) return null;

  const isExternalUrl = popup.cta_url?.startsWith("http");
  const hasImage = Boolean(popup.image_url);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="homepage-popup-title"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
    >
      {/* Backdrop Blur Gelap */}
      <div
        role="presentation"
        aria-hidden="true"
        onClick={handleClose}
        className={`fixed inset-0 bg-black/75 backdrop-blur-md transition-opacity duration-200 ${
          isClosing ? "opacity-0" : "opacity-100"
        }`}
      />

      {/* Modal Dialog Card Solid (Bukan Transparan) */}
      <div
        className={`relative w-full max-w-lg bg-white dark:bg-[#001740] text-slate-900 dark:text-white border border-slate-200 dark:border-white/15 shadow-2xl rounded-2xl sm:rounded-3xl overflow-hidden z-10 transition-all duration-200 transform ${
          isClosing
            ? "opacity-0 scale-95 translate-y-2"
            : "opacity-100 scale-100 translate-y-0"
        }`}
      >
        {/* Strip Aksen Gradasi Atas (Memberi sentuhan rapi saat tanpa gambar poster) */}
        {!hasImage && (
          <div className="h-1.5 w-full bg-gradient-to-r from-[#00296E] via-[#0094E0] to-[#38BDF8]" />
        )}

        {/* Tombol Tutup Silang di Kanan Atas */}
        <button
          type="button"
          onClick={handleClose}
          aria-label="Tutup Pengumuman"
          className={`absolute top-3.5 right-3.5 z-20 p-2 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#0094E0] cursor-pointer ${
            hasImage
              ? "bg-black/50 hover:bg-black/75 text-white backdrop-blur-md border border-white/20 shadow-md"
              : "bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white border border-slate-200 dark:border-white/10"
          }`}
        >
          <X size={18} weight="bold" />
        </button>

        {/* Gambar Flyer / Poster Pengumuman (Opsional) */}
        {hasImage ? (
          <div className="relative w-full aspect-[16/9] sm:aspect-[2/1] overflow-hidden bg-slate-100 dark:bg-slate-800">
            <img
              src={popup.image_url!}
              alt={popup.title}
              className="w-full h-full object-cover"
              loading="eager"
            />
          </div>
        ) : null}

        {/* Isi Pengumuman */}
        <div className="p-5 sm:p-6 space-y-4">
          {/* Badge Tag Kategori */}
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#00296E]/10 dark:bg-[#38BDF8]/15 text-[#00296E] dark:text-[#38BDF8] border border-[#00296E]/20 dark:border-[#38BDF8]/30 tracking-wider">
              <MegaphoneSimple size={14} weight="regular" />
              <span>{popup.tag || "PENGUMUMAN"}</span>
            </span>
          </div>

          {/* Judul Pengumuman */}
          <h3
            id="homepage-popup-title"
            className="text-lg sm:text-xl font-bold text-[#00296E] dark:text-white leading-snug tracking-tight"
          >
            {popup.title}
          </h3>

          {/* Konten Deskripsi */}
          <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-line leading-relaxed max-h-52 overflow-y-auto pr-1">
            {popup.content}
          </p>

          {/* Tombol Call to Action (Jika Disediakan) */}
          {popup.cta_text && popup.cta_url ? (
            <div className="pt-1">
              <a
                href={popup.cta_url}
                onClick={handleClose}
                target={isExternalUrl ? "_blank" : undefined}
                rel={isExternalUrl ? "noopener noreferrer" : undefined}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl bg-[#00296E] hover:bg-[#001f54] text-white dark:bg-[#38BDF8] dark:hover:bg-[#0284c7] dark:text-[#001740] active:scale-[0.99] transition shadow-md cursor-pointer"
              >
                <span>{popup.cta_text}</span>
                <ArrowSquareOut size={16} weight="regular" />
              </a>
            </div>
          ) : null}

          {/* Footer Bar: Checkbox 'Jangan tampilkan lagi' & Tombol Tutup */}
          <div className="pt-3 border-t border-slate-200/80 dark:border-white/10 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <label className="inline-flex items-center gap-2 cursor-pointer select-none text-slate-600 dark:text-slate-300 hover:text-[#00296E] dark:hover:text-white transition">
              <input
                type="checkbox"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
                className="rounded border-slate-300 dark:border-white/20 text-[#00296E] accent-[#00296E] dark:accent-[#38BDF8] w-4 h-4 cursor-pointer"
              />
              <span className="font-medium">Jangan tampilkan lagi</span>
            </label>

            <button
              type="button"
              onClick={handleClose}
              className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white font-medium transition underline underline-offset-2 cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
