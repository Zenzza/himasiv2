"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowSquareOut,
  WarningCircle,
  XCircle,
  House,
  ArrowsClockwise,
  LinkSimpleHorizontal,
  ShieldCheck,
} from "@phosphor-icons/react";
import { type ShortLinkItem } from "@/lib/types/shortlink";
import { getShortLinkBySlug, incrementShortLinkClicks } from "@/lib/supabase/shortlink";

interface PageProps {
  params?: Promise<{ slug: string }>;
}

export default function ShortLinkRedirectPage({ params }: PageProps) {
  const routerParams = useParams();
  const unwrappedParams = params ? use(params) : null;
  const rawSlug = unwrappedParams?.slug || (routerParams?.slug as string);
  const slug = typeof rawSlug === "string" ? decodeURIComponent(rawSlug).toLowerCase().trim() : "";

  const [loading, setLoading] = useState(true);
  const [shortLink, setShortLink] = useState<ShortLinkItem | null>(null);
  const [isNotFound, setIsNotFound] = useState(false);
  const [isInactive, setIsInactive] = useState(false);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      setIsNotFound(true);
      return;
    }

    let isMounted = true;
    async function resolveAndRedirect() {
      try {
        const item = await getShortLinkBySlug(slug);
        if (!isMounted) return;

        if (!item) {
          setIsNotFound(true);
          setLoading(false);
          return;
        }

        setShortLink(item);

        if (!item.is_active) {
          setIsInactive(true);
          setLoading(false);
          return;
        }

        // Tautan aktif: increment counter klik & redirect instan
        incrementShortLinkClicks(slug).catch((err) =>
          console.warn("[shortlink-redirect] Gagal mencatat klik:", err)
        );

        // Pengalihan instan
        if (typeof window !== "undefined") {
          window.location.replace(item.original_url);
        }
      } catch (err) {
        console.error("[shortlink-redirect] Terjadi kesalahan:", err);
        if (isMounted) {
          setIsNotFound(true);
          setLoading(false);
        }
      }
    }

    resolveAndRedirect();

    return () => {
      isMounted = false;
    };
  }, [slug]);

  // 1. TAMPILAN REDIRECT AKTIF (LOADING / SEDANG MENGALIHKAN)
  if (loading || (shortLink && shortLink.is_active)) {
    return (
      <main className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B1120] flex items-center justify-center p-4 antialiased">
        <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 shadow-sm text-center">
          <div className="w-14 h-14 mx-auto mb-5 rounded-none bg-[#00296E]/10 dark:bg-[#00296E]/30 flex items-center justify-center text-[#00296E] dark:text-blue-400">
            <ArrowsClockwise className="w-7 h-7 animate-spin" weight="regular" />
          </div>

          <p className="text-[11px] font-mono tracking-widest uppercase text-[#00296E] dark:text-blue-400 font-bold mb-1">
            HIMASI Shortlink Service
          </p>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
            Mengalihkan Anda...
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
            Menuju tautan resmi <strong className="text-slate-700 dark:text-slate-200">{shortLink?.title || `/s/${slug}`}</strong>
          </p>

          {shortLink && (
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-left mb-6">
              <span className="text-[10px] font-mono uppercase text-slate-400 block mb-0.5">Tujuan URL:</span>
              <p className="text-xs font-mono text-slate-600 dark:text-slate-300 truncate">
                {shortLink.original_url}
              </p>
            </div>
          )}

          {shortLink && (
            <a
              href={shortLink.original_url}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#00296E] hover:bg-[#002156] text-white text-xs font-semibold tracking-wide transition-colors cursor-pointer w-full"
            >
              <span>Buka Tautan Sekarang</span>
              <ArrowSquareOut className="w-4 h-4" weight="regular" />
            </a>
          )}

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" weight="regular" />
            <span>Tautan Resmi Verifikasi HIMASI ISB Atma Luhur</span>
          </div>
        </div>
      </main>
    );
  }

  // 2. TAMPILAN TAUTAN DINONAKTIFKAN (TUTUP)
  if (isInactive && shortLink) {
    return (
      <main className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B1120] flex items-center justify-center p-4 antialiased">
        <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/40 p-8 shadow-sm text-center">
          <div className="w-14 h-14 mx-auto mb-5 rounded-none bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <WarningCircle className="w-7 h-7" weight="regular" />
          </div>

          <p className="text-[11px] font-mono tracking-widest uppercase text-amber-600 dark:text-amber-400 font-bold mb-1">
            Status: Ditutup
          </p>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
            Tautan Telah Dinonaktifkan
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
            Pendaftaran atau akses untuk kegiatan <strong className="text-slate-900 dark:text-white">&ldquo;{shortLink.title}&rdquo;</strong> telah ditutup oleh panitia / pengurus HIMASI.
          </p>

          {shortLink.description && (
            <div className="p-3 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 text-left mb-6">
              <span className="text-[10px] font-mono uppercase text-amber-700 dark:text-amber-300 block mb-0.5">Catatan Panitia:</span>
              <p className="text-xs text-slate-600 dark:text-slate-300 italic">
                &ldquo;{shortLink.description}&rdquo;
              </p>
            </div>
          )}

          <div className="space-y-2.5">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#00296E] hover:bg-[#002156] text-white text-xs font-semibold tracking-wide transition-colors cursor-pointer w-full"
            >
              <House className="w-4 h-4" weight="regular" />
              <span>Kembali ke Beranda HIMASI</span>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // 3. TAMPILAN TAUTAN TIDAK DITEMUKAN (404)
  return (
    <main className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B1120] flex items-center justify-center p-4 antialiased">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 shadow-sm text-center">
        <div className="w-14 h-14 mx-auto mb-5 rounded-none bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 flex items-center justify-center text-rose-600 dark:text-rose-400">
          <XCircle className="w-7 h-7" weight="regular" />
        </div>

        <p className="text-[11px] font-mono tracking-widest uppercase text-rose-600 dark:text-rose-400 font-bold mb-1">
          Error 404: Not Found
        </p>
        <h1 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
          Tautan Tidak Ditemukan
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
          Tautan pendek <strong className="text-slate-800 dark:text-slate-200 font-mono">/s/{slug || "..."}</strong> tidak terdaftar di sistem resmi HIMASI ISB Atma Luhur. Pastikan Anda mengetik alamat dengan benar.
        </p>

        <div className="space-y-2.5">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#00296E] hover:bg-[#002156] text-white text-xs font-semibold tracking-wide transition-colors cursor-pointer w-full"
          >
            <House className="w-4 h-4" weight="regular" />
            <span>Kembali ke Beranda HIMASI</span>
          </Link>
        </div>
      </div>
    </main>
  );
}

