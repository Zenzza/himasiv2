"use client";

import { use, useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  CalendarBlank,
  Clock,
  ArrowLeft,
  Check,
  Tag,
  Link as LinkIcon,
  WarningCircle,
  ChatCircle,
  ArrowRight,
} from "@phosphor-icons/react";
import Footer from "@/components/footer";
import ScrollReveal from "@/components/scroll-reveal";
import { type BeritaItem, FALLBACK_BERITA } from "@/lib/types/berita";
import { getBeritaBySlug, getPublishedBerita } from "@/lib/supabase/berita";
import { formatBeritaDate } from "@/lib/utils/slug";

interface PageProps {
  params?: Promise<{ slug: string }>;
}

export default function BeritaDetailPage({ params }: PageProps) {
  // Support both React 19 Promise params and next/navigation useParams hook
  const routerParams = useParams();
  const unwrappedParams = params ? use(params) : null;
  const rawSlug = unwrappedParams?.slug || (routerParams?.slug as string);
  const slug = typeof rawSlug === "string" ? decodeURIComponent(rawSlug) : "";

  const [article, setArticle] = useState<BeritaItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [relatedArticles, setRelatedArticles] = useState<BeritaItem[]>([]);
  const [copiedToast, setCopiedToast] = useState(false);

  // Ambil detail artikel dari Supabase / cache lokal
  useEffect(() => {
    if (!slug) {
      setLoading(false);
      setNotFound(true);
      return;
    }

    let isMounted = true;
    async function loadArticle() {
      setLoading(true);
      setNotFound(false);
      try {
        const liveArticle = await getBeritaBySlug(slug);
        if (isMounted) {
          if (liveArticle) {
            setArticle(liveArticle);
          } else {
            // Cek kembali di data fallback jika database belum terisi
            const fallbackMatch = FALLBACK_BERITA.find(
              (b) => b.slug === slug || String(b.id) === String(slug)
            );
            if (fallbackMatch) {
              setArticle(fallbackMatch);
            } else {
              setNotFound(true);
            }
          }
        }

        // Ambil artikel terkait lainnya
        const allPublished = await getPublishedBerita();
        if (isMounted && allPublished && allPublished.length > 0) {
          const others = allPublished.filter(
            (b) =>
              b.slug !== slug &&
              String(b.id) !== String(liveArticle?.id || slug)
          );
          setRelatedArticles(others.slice(0, 3));
        }
      } catch (err) {
        console.warn("[BeritaDetail] Error fetching article:", err);
        if (isMounted) {
          const fallbackMatch = FALLBACK_BERITA.find(
            (b) => b.slug === slug || String(b.id) === String(slug)
          );
          if (fallbackMatch) {
            setArticle(fallbackMatch);
          } else {
            setNotFound(true);
          }
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadArticle();

    return () => {
      isMounted = false;
    };
  }, [slug]);

  // Handle Share WhatsApp
  const handleWhatsAppShare = () => {
    if (!article) return;
    const currentUrl =
      typeof window !== "undefined"
        ? window.location.href
        : `https://himasiv2.vercel.app/berita/${article.slug}`;
    const text = `${article.title}\n\nBaca artikel selengkapnya di Portal HIMASI:\n${currentUrl}`;
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(waUrl, "_blank", "noopener,noreferrer");
  };

  // Handle Salin Tautan
  const handleCopyLink = () => {
    if (typeof window !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 2500);
    }
  };

  // Parsing konten menjadi array paragraf
  const paragraphs = useMemo(() => {
    if (!article?.content) return [];
    return article.content
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter(Boolean);
  }, [article?.content]);

  // Tampilan Shimmer Skeleton Saat Artikel Sedang Dimuat (Mencegah Flashing Data Lama)
  if (loading) {
    return (
      <div className="flex flex-col w-full min-h-screen bg-white text-[#091e42]">
        <header className="relative pt-8 sm:pt-12 pb-6 px-4 sm:px-6 lg:px-8 bg-white border-b border-slate-100 w-full overflow-hidden">
          <div className="max-w-4xl mx-auto animate-pulse">
            {/* Breadcrumb Skeleton */}
            <div className="w-48 h-3.5 bg-slate-200/80 rounded mb-5" />

            {/* Badge & Back Button Skeleton */}
            <div className="flex items-center justify-between gap-4 mb-4">
              <div className="w-32 h-6 rounded-full bg-slate-200/80" />
              <div className="w-24 h-4 rounded bg-slate-200/60" />
            </div>

            {/* Title Skeleton */}
            <div className="space-y-3 mb-6">
              <div className="w-full h-8 sm:h-12 rounded-lg bg-slate-200/80" />
              <div className="w-4/5 h-8 sm:h-12 rounded-lg bg-slate-200/80" />
            </div>

            {/* Metadata Bar Skeleton */}
            <div className="pt-5 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-slate-200/80" />
                <div className="space-y-1.5">
                  <div className="w-28 h-3.5 rounded bg-slate-200/80" />
                  <div className="w-20 h-2.5 rounded bg-slate-200/60" />
                </div>
              </div>
              <div className="w-36 h-4 rounded bg-slate-200/60" />
            </div>
          </div>
        </header>

        {/* Content Skeleton */}
        <main className="py-8 sm:py-12 px-4 sm:px-6 lg:px-8 bg-white w-full">
          <div className="max-w-4xl mx-auto animate-pulse">
            {/* Hero Image Skeleton */}
            <div className="w-full aspect-[16/10] sm:aspect-[21/10] rounded-[24px] sm:rounded-[32px] bg-slate-200/80 mb-8 sm:mb-10" />

            {/* Excerpt Box Skeleton */}
            <div className="p-6 rounded-[20px] bg-slate-100/70 border-l-4 border-slate-200 mb-8 space-y-2">
              <div className="w-full h-4 rounded bg-slate-200/80" />
              <div className="w-3/4 h-4 rounded bg-slate-200/80" />
            </div>

            {/* Paragraph Lines Skeleton */}
            <div className="space-y-4">
              <div className="w-full h-4 rounded bg-slate-200/70" />
              <div className="w-full h-4 rounded bg-slate-200/70" />
              <div className="w-5/6 h-4 rounded bg-slate-200/70" />
              <div className="w-full h-4 rounded bg-slate-200/70 mt-6" />
              <div className="w-11/12 h-4 rounded bg-slate-200/70" />
              <div className="w-4/5 h-4 rounded bg-slate-200/70" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Tampilan 404 jika artikel tidak ditemukan
  if (!loading && (notFound || !article)) {
    return (
      <div className="flex flex-col w-full min-h-screen bg-white text-[#091e42]">
        <div className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-20 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center mb-6 shadow-xs border border-amber-200">
            <WarningCircle className="w-8 h-8 sm:w-10 sm:h-10" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-[#00296E] tracking-tight">
            Artikel Tidak Ditemukan
          </h1>
          <p className="mt-3 text-slate-600 text-sm sm:text-base max-w-md mx-auto leading-relaxed">
            Mohon maaf, berita atau warta yang Anda cari tidak tersedia, telah diarsipkan, atau URL telah berubah.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/berita"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#00296E] hover:bg-[#0094E0] text-white text-xs sm:text-sm font-bold transition-all shadow-sm cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Katalog Berita</span>
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-bold transition-all cursor-pointer"
            >
              <span>Beranda HIMASI</span>
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full max-w-full overflow-x-hidden bg-white text-[#091e42] min-h-screen">
      {/* SECTION HEADER EDITORIAL: BREADCRUMB, KATEGORI, JUDUL BESAR, METADATA */}
      <header className="relative pt-8 sm:pt-12 pb-6 px-4 sm:px-6 lg:px-8 bg-white border-b border-slate-100 w-full overflow-hidden">
        <ScrollReveal className="max-w-4xl mx-auto">
          {/* Breadcrumb Sesuai Standar Option A */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-widest mb-5">
            <Link href="/" className="text-[#0094E0] hover:underline">
              HOME
            </Link>
            <span className="text-slate-300">/</span>
            <Link href="/berita" className="text-[#0094E0] hover:underline">
              BERITA
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-slate-700 font-bold truncate max-w-[200px] sm:max-w-xs">
              {article?.category_label || "WARTA"}
            </span>
          </div>

          {/* Badge Kategori & Tombol Kembali */}
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-sky-50 text-[#00296E] border border-sky-100">
              <Tag className="w-3.5 h-3.5 text-[#0094E0]" />
              <span>{article?.category_label}</span>
            </div>

            <Link
              href="/berita"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#00296E] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Kembali ke Berita</span>
              <span className="sm:hidden">Kembali</span>
            </Link>
          </div>

          {/* Judul Artikel Utama (Besar, Bold, Tegas Navy) */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#00296E] tracking-tight leading-[1.2]">
            {article?.title}
          </h1>

          {/* Baris Metadata: Penulis, Tanggal Terbit, Waktu Baca */}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 pt-5 border-t border-slate-100 text-xs sm:text-sm">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#00296E] text-white flex items-center justify-center font-bold text-xs uppercase shadow-xs">
                {(article?.author || "H").slice(0, 2)}
              </div>
              <div>
                <p className="font-bold text-slate-800 leading-tight">
                  {article?.author}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Redaksi Warta HIMASI
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-slate-500 font-medium">
              <div className="flex items-center gap-1.5">
                <CalendarBlank className="w-3.5 h-3.5 text-slate-400" />
                <span>{formatBeritaDate(article?.published_at)}</span>
              </div>
              <span>&bull;</span>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>{article?.read_time}</span>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </header>

      {/* SECTION KONTEN ARTIKEL */}
      <main className="relative py-8 sm:py-12 px-4 sm:px-6 lg:px-8 bg-white w-full">
        <article className="max-w-4xl mx-auto">
          {/* Featured Hero Image dengan Aksen Geometris Khas HIMASI */}
          <div className="relative w-full aspect-[16/10] sm:aspect-[21/10] rounded-[24px] sm:rounded-[32px] overflow-hidden bg-slate-100 border border-slate-200/80 shadow-md mb-8 sm:mb-10 select-none">
            <img
              src={article?.image_url}
              alt={article?.title || "Sampul Berita"}
              className="w-full h-full object-cover"
            />
            {/* Ornamen Sudut Berwarna */}
            <div
              className={`absolute ${
                article?.corner_position || "bottom-4 left-4"
              } w-16 h-16 sm:w-20 sm:h-20 ${
                article?.corner_shape || "rounded-tr-[40px] rounded-bl-[40px]"
              } ${
                article?.corner_color || "bg-[#00296E]"
              } opacity-90 shadow-lg pointer-events-none`}
            />
          </div>

          {/* Excerpt / Lead Paragraph Highlight Box */}
          {article?.excerpt && (
            <div className="p-5 sm:p-7 rounded-[20px] bg-slate-50 border-l-4 border-[#0094E0] text-slate-700 font-medium text-base sm:text-lg leading-relaxed mb-8 shadow-xs">
              <p className="italic">"{article.excerpt}"</p>
            </div>
          )}

          {/* Body Konten Artikel (Paragraf Rapi, Proporsional, Nyaman Dibaca) */}
          <div className="space-y-6 text-slate-700 text-base sm:text-[17px] leading-[1.8] font-normal selection:bg-[#0094E0]/20">
            {paragraphs.map((p, idx) => (
              <p key={idx} className="text-justify sm:text-left">
                {p}
              </p>
            ))}
          </div>

          {/* BARIS AKSI & BAGIKAN (SHARE BAR) */}
          <section className="mt-12 pt-8 pb-4 border-t border-b border-slate-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Bagikan Berita Ini:
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              {/* Tombol Bagikan WhatsApp */}
              <button
                type="button"
                onClick={handleWhatsAppShare}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-xs active:scale-95"
                title="Bagikan ke WhatsApp"
              >
                <ChatCircle className="w-4 h-4 fill-emerald-600 text-emerald-600" weight="fill" />
                <span>WhatsApp</span>
              </button>

              {/* Tombol Salin Tautan */}
              <button
                type="button"
                onClick={handleCopyLink}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-slate-100 hover:bg-[#00296E] text-slate-700 hover:text-white border border-slate-200 text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-xs active:scale-95"
                title="Salin Tautan Artikel"
              >
                <LinkIcon className="w-4 h-4" />
                <span>Salin Tautan</span>
              </button>

              {/* Tombol Kembali ke Daftar Berita */}
              <Link
                href="/berita"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-white hover:bg-slate-50 text-[#00296E] border border-slate-200 text-xs sm:text-sm font-bold transition-all cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Semua Berita</span>
              </Link>
            </div>
          </section>

          {/* SECTION BERITA TERKAIT LAINNYA */}
          {relatedArticles.length > 0 && (
            <section className="mt-14 sm:mt-16 pt-2">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-[#00296E] tracking-tight">
                    Berita Terkait Lainnya
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Jelajahi informasi dan warta terkini lainnya dari HIMASI
                  </p>
                </div>

                <Link
                  href="/berita"
                  className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-[#0094E0] hover:underline"
                >
                  <span>Lihat Semua</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-7">
                {relatedArticles.map((rel) => (
                  <article
                    key={rel.id}
                    className="group flex flex-col bg-white rounded-[20px] border border-slate-200/90 overflow-hidden shadow-xs hover:shadow-md transition-all duration-300"
                  >
                    {/* Gambar Artikel Terkait */}
                    <Link
                      href={`/berita/${rel.slug}`}
                      className="relative w-full aspect-[16/10] overflow-hidden bg-slate-100 block"
                    >
                      <img
                        src={rel.image_url}
                        alt={rel.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    </Link>

                    {/* Konten Kartu */}
                    <div className="p-4 sm:p-5 flex flex-col flex-1">
                      <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium mb-2">
                        <span className="font-semibold text-[#0094E0]">
                          {rel.category_label}
                        </span>
                        <span>{rel.read_time}</span>
                      </div>

                      <h3 className="text-sm font-bold text-[#00296E] group-hover:text-[#0094E0] transition-colors line-clamp-2 leading-snug">
                        <Link href={`/berita/${rel.slug}`}>{rel.title}</Link>
                      </h3>

                      <p className="mt-2 text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {rel.excerpt}
                      </p>

                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-[#00296E]">
                        <Link
                          href={`/berita/${rel.slug}`}
                          className="inline-flex items-center gap-1 group-hover:text-[#0094E0] transition-colors"
                        >
                          <span>Baca</span>
                          <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <span className="text-[11px] text-slate-400 font-normal">
                          {formatBeritaDate(rel.published_at)}
                        </span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}
        </article>
      </main>

      {/* Toast Notifikasi Salin Tautan */}
      {copiedToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#00296E] text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 text-xs sm:text-sm font-semibold animate-bounce">
          <Check className="w-4 h-4 text-emerald-400" weight="bold" />
          <span>Tautan artikel berhasil disalin!</span>
        </div>
      )}

      {/* FOOTER */}
      <Footer />
    </div>
  );
}

