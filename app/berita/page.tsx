"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  ArrowRight,
  Share2,
  Check,
  X,
  Loader2,
} from "lucide-react";
import Footer from "@/components/footer";
import ScrollReveal from "@/components/scroll-reveal";
import { type BeritaItem, FALLBACK_BERITA } from "@/lib/types/berita";
import { getPublishedBerita } from "@/lib/supabase/berita";
import { formatBeritaDate } from "@/lib/utils/slug";

// Kategori Sesuai Referensi Gambar HIMASI
const CATEGORIES = [
  { id: "all", label: "Semua Berita", badge: "All" },
  { id: "event", label: "Kegiatan Himpunan", badge: "Event" },
  { id: "prestasi", label: "Prestasi Mahasiswa", badge: "Award" },
  { id: "teknologi", label: "Teknologi & Riset", badge: "Tech" },
];

export default function BeritaPage() {
  const [articles, setArticles] = useState<BeritaItem[]>(FALLBACK_BERITA);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [copiedToast, setCopiedToast] = useState(false);

  const ITEMS_PER_PAGE = 6;

  // Ambil data berita terbit secara live dari Supabase / cache lokal
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setLoading(true);
      try {
        const liveArticles = await getPublishedBerita();
        if (isMounted && liveArticles && liveArticles.length > 0) {
          setArticles(liveArticles);
        }
      } catch (err) {
        console.warn("[BeritaPage] Menggunakan artikel fallback:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Filter Artikel berdasarkan Kategori dan Pencarian Teks
  const filteredArticles = useMemo(() => {
    return articles.filter((article) => {
      const matchCategory =
        selectedCategory === "all" || article.category_key === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        article.title.toLowerCase().includes(q) ||
        article.excerpt.toLowerCase().includes(q) ||
        article.category_label.toLowerCase().includes(q);
      return matchCategory && matchSearch;
    });
  }, [articles, selectedCategory, searchQuery]);

  // Daftar berita terbaru untuk sidebar (5 artikel teratas)
  const recentArticles = useMemo(() => {
    return articles.slice(0, 5);
  }, [articles]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredArticles.length / ITEMS_PER_PAGE) || 1;
  const paginatedArticles = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredArticles.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredArticles, currentPage]);

  const handleShare = (article: BeritaItem) => {
    const articleUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}/berita/${article.slug}`
        : `/berita/${article.slug}`;

    if (typeof navigator !== "undefined" && navigator.share) {
      navigator
        .share({
          title: article.title,
          text: article.excerpt,
          url: articleUrl,
        })
        .catch(() => {});
    } else if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(`${article.title} - ${articleUrl}`);
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 2500);
    }
  };

  const currentCategoryLabel =
    CATEGORIES.find((c) => c.id === selectedCategory)?.label || "Semua Berita";

  return (
    <div className="flex flex-col w-full max-w-full overflow-x-hidden bg-white text-[#091e42] min-h-screen">
      {/* SECTION HEADER: SESUAI REFERENSI (BREADCRUMB, JUDUL TENGAH BESAR, SUBJUDUL) */}
      <section className="relative pt-10 sm:pt-14 pb-8 sm:pb-12 px-4 sm:px-6 lg:px-12 bg-white w-full overflow-hidden">
        <ScrollReveal className="max-w-6xl mx-auto">
          <div className="relative text-center max-w-2xl mx-auto">
            {/* Breadcrumb Sesuai Referensi: HOME / BERITA */}
            <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">
              <Link href="/" className="text-[#0094E0] hover:underline">
                HOME
              </Link>
              <span className="text-slate-300">/</span>
              <span className="text-slate-600">BERITA</span>
            </div>

            {/* Judul Utama: Berita */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-[#00296E] tracking-tight leading-tight">
              Berita
            </h1>

            {/* Subjudul Sesuai Referensi */}
            <p className="mt-3 text-slate-600 text-sm sm:text-base leading-relaxed font-normal">
              Kupas tuntas warta terkini dan kegiatan Himpunan Mahasiswa Sistem Informasi
            </p>
          </div>
        </ScrollReveal>
      </section>

      {/* SECTION UTAMA: 2 KOLOM (GRID ARTIKEL DI KIRI, SIDEBAR KATEGORI & BERITA TERBARU DI KANAN) */}
      <section className="relative py-8 sm:py-10 px-4 sm:px-6 lg:px-12 bg-white w-full overflow-hidden">
        <ScrollReveal className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
            {/* ============================================================ */}
            {/* SISI KIRI (lg:col-span-8): PENCARIAN + GRID ARTIKEL + PAGINASI */}
            {/* ============================================================ */}
            <div className="lg:col-span-8 flex flex-col">
              {/* Search Bar & Status Filter */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-5 border-b border-slate-100">
                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder="Cari artikel atau topik..."
                    className="w-full pl-9 pr-8 py-2.5 rounded-full bg-slate-50 border border-slate-200/90 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0094E0] focus:ring-1 focus:ring-[#0094E0] transition-all"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Status Kategori Aktif */}
                <div className="flex items-center gap-2 text-xs sm:text-sm">
                  <span className="text-slate-500 font-normal">Kategori:</span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 text-[#00296E] font-bold border border-sky-100">
                    {currentCategoryLabel}
                    {selectedCategory !== "all" && (
                      <button
                        type="button"
                        onClick={() => setSelectedCategory("all")}
                        className="hover:text-red-500 cursor-pointer"
                        title="Reset ke Semua Berita"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </span>
                </div>
              </div>

              {/* Grid Artikel (2 Kolom di sisi kiri) */}
              {paginatedArticles.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-7 sm:gap-8">
                  {paginatedArticles.map((article, idx) => {
                    const cornerShape =
                      article.corner_shape ||
                      (idx % 3 === 0
                        ? "rounded-tr-[40px] rounded-bl-[40px]"
                        : idx % 3 === 1
                        ? "rounded-tl-[45px] rounded-br-[15px]"
                        : "rounded-bl-[45px] rounded-tr-[20px]");
                    const cornerColor =
                      article.corner_color ||
                      (article.category_key === "prestasi"
                        ? "bg-[#8b5cf6]"
                        : article.category_key === "teknologi"
                        ? "bg-[#0094E0]"
                        : "bg-[#f97316]");
                    const cornerPosition =
                      article.corner_position ||
                      (idx % 2 === 0 ? "bottom-3 left-3" : "top-3 right-3");

                    return (
                      <ScrollReveal
                        key={article.id}
                        direction="card-pop"
                        delay={(idx % 2) * 150}
                        className="w-full"
                      >
                        <article className="group flex flex-col items-start select-none">
                          {/* Gambar Artikel dengan Link ke Halaman Baca Khusus */}
                          <Link
                            href={`/berita/${article.slug}`}
                            className="relative w-full aspect-[16/10.5] rounded-[22px] sm:rounded-[24px] overflow-hidden bg-slate-100 border border-slate-100 shadow-xs group-hover:shadow-lg transition-all duration-300 block"
                          >
                            <img
                              src={article.image_url}
                              alt={article.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              loading="lazy"
                            />

                            {/* Ornamen Bentuk Geometris Warna-Warni Sesuai Referensi Gambar */}
                            <div
                              className={`absolute ${cornerPosition} w-14 h-14 sm:w-16 sm:h-16 ${cornerShape} ${cornerColor} opacity-90 transition-transform group-hover:scale-110 duration-300 pointer-events-none shadow-sm`}
                            />
                          </Link>

                          {/* Kategori Badge Pill */}
                          <div className="mt-4">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedCategory(article.category_key);
                                setCurrentPage(1);
                              }}
                              className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 hover:bg-[#00296E] hover:text-white text-slate-700 transition-colors cursor-pointer"
                            >
                              {article.category_label}
                            </button>
                          </div>

                          {/* Meta Row: Tanggal & Waktu Baca */}
                          <div className="mt-2.5 flex items-center gap-2 text-xs text-slate-500 font-medium">
                            <span>{formatBeritaDate(article.published_at)}</span>
                            <span>&bull;</span>
                            <span>{article.read_time}</span>
                          </div>

                          {/* Judul Artikel dengan Link ke Halaman Baca Khusus */}
                          <h3 className="mt-2 text-base sm:text-lg font-bold text-[#00296E] group-hover:text-[#0094E0] transition-colors leading-snug line-clamp-2">
                            <Link href={`/berita/${article.slug}`}>
                              {article.title}
                            </Link>
                          </h3>

                          {/* Ringkasan / Excerpt */}
                          <p className="mt-2 text-slate-600 text-xs sm:text-sm leading-relaxed line-clamp-2 font-normal">
                            {article.excerpt}
                          </p>

                          {/* Tombol Aksi: Baca Selengkapnya & Bagikan */}
                          <div className="mt-4 pt-3 border-t border-slate-100 w-full flex items-center justify-between">
                            <Link
                              href={`/berita/${article.slug}`}
                              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#00296E] group-hover:text-[#0094E0] transition-colors"
                            >
                              <span>Baca Selengkapnya</span>
                              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                            </Link>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleShare(article);
                              }}
                              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-[#00296E] text-slate-600 hover:text-white flex items-center justify-center transition-all cursor-pointer"
                              title="Bagikan Tautan Artikel"
                              aria-label="Bagikan Tautan Artikel"
                            >
                              <Share2 className="w-3.5 h-3.5 stroke-[2]" />
                            </button>
                          </div>
                        </article>
                      </ScrollReveal>
                    );
                  })}
                </div>
              ) : (
                /* Tampilan Kosong Jika Pencarian Tidak Ada Hasil */
                <div className="text-center py-16 px-4 rounded-[24px] bg-slate-50 border border-slate-100">
                  <div className="w-14 h-14 rounded-2xl bg-sky-100 text-[#0094E0] flex items-center justify-center mx-auto mb-4">
                    <Search className="w-7 h-7" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800">
                    Tidak ada artikel yang cocok
                  </h3>
                  <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
                    Coba gunakan kata kunci lain atau reset filter untuk menampilkan semua berita.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory("all");
                      setSearchQuery("");
                    }}
                    className="mt-5 px-5 py-2.5 rounded-full bg-[#00296E] hover:bg-[#0094E0] text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
                  >
                    Reset Semua Filter
                  </button>
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-12 flex items-center justify-center gap-2 select-none">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className={`px-4 py-2 rounded-full border text-xs sm:text-sm font-semibold transition-all ${
                      currentPage === 1
                        ? "border-slate-200 text-slate-300 cursor-not-allowed bg-slate-50"
                        : "border-slate-200 hover:border-[#00296E] text-[#00296E] bg-white cursor-pointer"
                    }`}
                  >
                    Sebelumnya
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      type="button"
                      onClick={() => setCurrentPage(page)}
                      className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                        currentPage === page
                          ? "bg-[#00296E] text-white shadow-sm"
                          : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200/90"
                      }`}
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className={`px-4 py-2 rounded-full border text-xs sm:text-sm font-semibold transition-all ${
                      currentPage === totalPages
                        ? "border-slate-200 text-slate-300 cursor-not-allowed bg-slate-50"
                        : "border-slate-200 hover:border-[#00296E] text-[#00296E] bg-white cursor-pointer"
                    }`}
                  >
                    Selanjutnya
                  </button>
                </div>
              )}
            </div>

            {/* ============================================================ */}
            {/* SISI KANAN (lg:col-span-4): SIDEBAR KATEGORI & BERITA TERBARU */}
            {/* ============================================================ */}
            <aside className="lg:col-span-4 flex flex-col space-y-6 sticky top-20 lg:top-24 self-start max-h-[calc(100vh-6.5rem)] overflow-y-auto scrollbar-none">
              {/* KOTAK 1: KATEGORI & TOPIK (PERSIS GAMBAR REFERENSI) */}
              <div className="bg-white rounded-[20px] p-5 sm:p-6 border border-slate-200/90 shadow-xs">
                <h2 className="text-[13px] sm:text-sm font-bold text-slate-800 tracking-wider uppercase border-b border-slate-100 pb-3 mb-3.5">
                  KATEGORI & TOPIK
                </h2>
                <div className="space-y-1">
                  {CATEGORIES.map((cat) => {
                    const isActive = selectedCategory === cat.id;
                    const count =
                      cat.id === "all"
                        ? articles.length
                        : articles.filter((a) => a.category_key === cat.id).length;

                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          setSelectedCategory(cat.id);
                          setCurrentPage(1);
                        }}
                        className={`w-full flex items-center justify-between py-2.5 px-3 rounded-xl text-xs sm:text-sm transition-all duration-150 cursor-pointer ${
                          isActive
                            ? "text-[#00296E] font-bold bg-sky-50/70"
                            : "text-slate-600 hover:text-[#00296E] hover:bg-slate-50 font-medium"
                        }`}
                      >
                        <span>{cat.label}</span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded font-mono font-medium tracking-tight ${
                            isActive
                              ? "bg-blue-100 text-blue-700 font-semibold"
                              : "text-slate-400 group-hover:text-slate-600"
                          }`}
                        >
                          {cat.badge} ({count})
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* KOTAK 2: BERITA TERBARU DENGAN LINK LANGSUNG KE HALAMAN BACA */}
              <div className="bg-white rounded-[20px] p-5 sm:p-6 border border-slate-200/90 shadow-xs">
                <h2 className="text-[13px] sm:text-sm font-bold text-slate-800 tracking-wider uppercase border-b border-slate-100 pb-3 mb-3.5 flex items-center justify-between">
                  <span>BERITA TERBARU</span>
                  {loading && <Loader2 className="w-3.5 h-3.5 text-[#0094E0] animate-spin" />}
                </h2>
                <div className="divide-y divide-slate-100">
                  {recentArticles.map((news) => (
                    <Link
                      key={news.id}
                      href={`/berita/${news.slug}`}
                      className="py-3.5 first:pt-0 last:pb-0 group block cursor-pointer"
                    >
                      <h3 className="text-[13px] sm:text-[13.5px] font-semibold text-slate-800 group-hover:text-[#00296E] leading-snug line-clamp-2 transition-colors">
                        {news.title}
                      </h3>
                      <p className="mt-1.5 text-xs text-slate-400 font-normal">
                        {formatBeritaDate(news.published_at)}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </ScrollReveal>
      </section>

      {/* Toast Notifikasi Berhasil Salin Tautan */}
      {copiedToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#00296E] text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 text-xs sm:text-sm font-semibold animate-bounce">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>Tautan artikel berhasil disalin!</span>
        </div>
      )}

      {/* FOOTER SESUAI STYLE HOMEPAGE */}
      <Footer />
    </div>
  );
}
