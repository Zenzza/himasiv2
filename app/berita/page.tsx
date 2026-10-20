"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  ArrowRight,
  Share2,
  Check,
  X
} from "lucide-react";
import Footer from "@/components/footer";
import ScrollReveal from "@/components/scroll-reveal";

// Kategori & Topik Sesuai Referensi Gambar
const CATEGORIES = [
  { id: "all", label: "Semua Berita", badge: "All" },
  { id: "event", label: "Kegiatan Himpunan", badge: "Event" },
  { id: "prestasi", label: "Prestasi Mahasiswa", badge: "Award" },
  { id: "teknologi", label: "Teknologi & Riset", badge: "Tech" },
];

// Berita Terbaru Sesuai Referensi Gambar
const RECENT_NEWS = [
  {
    id: 1,
    title: "Perluas Relasi Organisasi dan Bertukar Pikiran, Departemen Eksternal HIMASI AMIKOM Gelar...",
    date: "30 July 2026",
    categoryKey: "event",
  },
  {
    id: 2,
    title: "Kolaborasi dengan DevWeb3 Jogja, Departemen Iptek HIMASI Gelar Workshop...",
    date: "30 July 2026",
    categoryKey: "teknologi",
  },
  {
    id: 3,
    title: "Program Studi Sistem Informasi Raih Juara Umum PIMAPOSMA 2025",
    date: "30 July 2026",
    categoryKey: "prestasi",
  },
  {
    id: 4,
    title: "Jembatani Aspirasi Mahasiswa, HIMASI Sukses Selenggarakan Dialog Program Studi (DPS)...",
    date: "30 July 2026",
    categoryKey: "event",
  },
  {
    id: 5,
    title: "Mahasiswa Sistem Informasi AMIKOM Raih Prestasi pada Indonesia National IT...",
    date: "30 July 2026",
    categoryKey: "prestasi",
  },
];

// Data Lengkap Artikel Berita & Insight HIMASI
const ARTICLES_DATA = [
  {
    id: 1,
    title: "Perluas Relasi Organisasi dan Bertukar Pikiran, Departemen Eksternal HIMASI AMIKOM Gelar Studi Banding Strategis",
    categoryKey: "event",
    categoryLabel: "Kegiatan Himpunan",
    date: "30 July 2026",
    readTime: "5 min read",
    excerpt: "Departemen Hubungan Eksternal HIMASI sukses menggelar forum studi banding strategis guna memperluas relasi, berbagi praktik terbaik, dan memperkuat sinergi organisasi mahasiswa.",
    image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=800&auto=format&fit=crop",
    cornerShape: "rounded-tr-[40px] rounded-bl-[40px]",
    cornerColor: "bg-[#f97316]",
    cornerPosition: "bottom-3 left-3",
    author: "Departemen Eksternal",
  },
  {
    id: 2,
    title: "Kolaborasi dengan DevWeb3 Jogja, Departemen Iptek HIMASI Gelar Workshop Blockchain & Smart Contract",
    categoryKey: "teknologi",
    categoryLabel: "Teknologi & Riset",
    date: "30 July 2026",
    readTime: "7 min read",
    excerpt: "Eksplorasi ekosistem Web3, arsitektur desentralisasi, dan fundamental smart contract development bersama praktisi industri melalui workshop interaktif berbasis hands-on coding.",
    image: "https://images.unsplash.com/photo-1531482615713-2afd69097998?q=80&w=800&auto=format&fit=crop",
    cornerShape: "rounded-tl-[45px] rounded-br-[15px]",
    cornerColor: "bg-[#0094E0]",
    cornerPosition: "top-3 left-3",
    author: "Departemen Iptek",
  },
  {
    id: 3,
    title: "Program Studi Sistem Informasi Raih Juara Umum PIMAPOSMA 2025",
    categoryKey: "prestasi",
    categoryLabel: "Prestasi Mahasiswa",
    date: "30 July 2026",
    readTime: "4 min read",
    excerpt: "Kontingen mahasiswa Sistem Informasi sukses memborong perolehan medali emas di berbagai cabang kompetisi ilmiah, gagasan futuristik, dan seni pada pekan PIMAPOSMA.",
    image: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=800&auto=format&fit=crop",
    cornerShape: "rounded-bl-[45px] rounded-tr-[20px]",
    cornerColor: "bg-[#8b5cf6]",
    cornerPosition: "bottom-3 right-3",
    author: "Divisi Bakat & Prestasi",
  },
  {
    id: 4,
    title: "Jembatani Aspirasi Mahasiswa, HIMASI Sukses Selenggarakan Dialog Program Studi (DPS) 2026",
    categoryKey: "event",
    categoryLabel: "Kegiatan Himpunan",
    date: "30 July 2026",
    readTime: "6 min read",
    excerpt: "Forum dialog terbuka antara civitas akademika, pengelola prodi, dan mahasiswa guna menyalurkan aspirasi akademik, evaluasi kurikulum, dan peningkatan fasilitas laboratorium.",
    image: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=800&auto=format&fit=crop",
    cornerShape: "rounded-tr-[45px]",
    cornerColor: "bg-[#10b981]",
    cornerPosition: "top-3 right-3",
    author: "Departemen Internal",
  },
  {
    id: 5,
    title: "Mahasiswa Sistem Informasi AMIKOM Raih Prestasi pada Indonesia National IT Competition 2026",
    categoryKey: "prestasi",
    categoryLabel: "Prestasi Mahasiswa",
    date: "30 July 2026",
    readTime: "5 min read",
    excerpt: "Inovasi prototipe sistem analitik cerdas buatan tim mahasiswa Sistem Informasi berhasil meraih podium penghargaan bergengsi tingkat nasional di ajang kompetisi IT tahunan.",
    image: "https://images.unsplash.com/photo-1531403009284-440f080d1e12?q=80&w=800&auto=format&fit=crop",
    cornerShape: "rounded-tl-[40px] rounded-br-[40px]",
    cornerColor: "bg-[#00296E]",
    cornerPosition: "bottom-3 left-3",
    author: "Biro Riset Mahasiswa",
  },
  {
    id: 6,
    title: "The Future of AI & System Architecture: Tren Arsitektur Microservices dan Gen-AI di Industri",
    categoryKey: "teknologi",
    categoryLabel: "Teknologi & Riset",
    date: "25 July 2026",
    readTime: "8 min read",
    excerpt: "Perkembangan arsitektur microservices terdistribusi dan integrasi LLM lokal menjadi keahlian kunci yang banyak dicari industri rekayasa perangkat lunak modern saat ini.",
    image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=800&auto=format&fit=crop",
    cornerShape: "rounded-br-[45px]",
    cornerColor: "bg-[#f59e0b]",
    cornerPosition: "top-3 left-3",
    author: "Divisi Medkominfo",
  },
  {
    id: 7,
    title: "HIMASI Fest 2026: Kolaborasi Kreatif Coding, Hackathon 24 Jam, dan Turnamen E-Sport",
    categoryKey: "event",
    categoryLabel: "Kegiatan Himpunan",
    date: "18 July 2026",
    readTime: "5 min read",
    excerpt: "Ajang akbar tahunan mahasiswa Sistem Informasi kembali hadir mempertemukan ratusan talenta muda melalui hackathon dan turnamen kompetitif penuh semangat inovasi.",
    image: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=800&auto=format&fit=crop",
    cornerShape: "rounded-tr-[45px]",
    cornerColor: "bg-[#0094E0]",
    cornerPosition: "top-3 right-3",
    author: "Panitia HIMASI Fest",
  },
  {
    id: 8,
    title: "Kisah Inspiratif Alumni: Dari Lab Komputer Menuju Tech Lead Startup Unicorn",
    categoryKey: "prestasi",
    categoryLabel: "Prestasi Mahasiswa",
    date: "10 July 2026",
    readTime: "7 min read",
    excerpt: "Wawancara eksklusif bersama alumni Sistem Informasi tentang perjuangan meniti karir rekayasa perangkat lunak internasional dan pentingnya aktif berorganisasi di kampus.",
    image: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=800&auto=format&fit=crop",
    cornerShape: "rounded-bl-[45px]",
    cornerColor: "bg-[#10b981]",
    cornerPosition: "top-3 left-3",
    author: "Redaksi InfoTek",
  },
];

export default function BeritaPage() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [copiedToast, setCopiedToast] = useState(false);

  const ITEMS_PER_PAGE = 6;

  // Filter Artikel berdasarkan Kategori dan Pencarian Teks
  const filteredArticles = useMemo(() => {
    return ARTICLES_DATA.filter((article) => {
      const matchCategory =
        selectedCategory === "all" || article.categoryKey === selectedCategory;
      const matchSearch =
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.categoryLabel.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [selectedCategory, searchQuery]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredArticles.length / ITEMS_PER_PAGE) || 1;
  const paginatedArticles = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredArticles.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredArticles, currentPage]);

  const handleShare = (article: (typeof ARTICLES_DATA)[0]) => {
    if (typeof navigator !== "undefined" && navigator.share) {
      navigator
        .share({
          title: article.title,
          text: article.excerpt,
          url: window.location.href,
        })
        .catch(() => {});
    } else if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(`${article.title} - ${window.location.href}`);
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 2500);
    }
  };

  const currentCategoryLabel =
    CATEGORIES.find((c) => c.id === selectedCategory)?.label || "Semua Berita";

  return (
    <div className="flex flex-col w-full bg-white text-[#091e42] min-h-screen">
      
      {/* SECTION HEADER: SESUAI REFERENSI (BREADCRUMB, JUDUL TENGAH BESAR, SUBJUDUL) */}
      <section className="relative pt-10 sm:pt-14 pb-8 sm:pb-12 px-4 sm:px-6 lg:px-12 bg-white w-full">
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
      <section className="relative py-8 sm:py-10 px-4 sm:px-6 lg:px-12 bg-white w-full">
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
                  {paginatedArticles.map((article) => (
                    <article
                      key={article.id}
                      className="group flex flex-col items-start select-none"
                    >
                      {/* Gambar Artikel dengan Sudut Melengkung & Aksen Bentuk Geometris */}
                      <div className="relative w-full aspect-[16/10.5] rounded-[22px] sm:rounded-[24px] overflow-hidden bg-slate-100 border border-slate-100 shadow-xs group-hover:shadow-lg transition-all duration-300">
                        <img
                          src={article.image}
                          alt={article.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />

                        {/* Ornamen Bentuk Geometris Warna-Warni Sesuai Referensi Gambar */}
                        <div
                          className={`absolute ${article.cornerPosition} w-14 h-14 sm:w-16 sm:h-16 ${article.cornerShape} ${article.cornerColor} opacity-90 transition-transform group-hover:scale-110 duration-300 pointer-events-none shadow-sm`}
                        />
                      </div>

                      {/* Kategori Badge Pill */}
                      <div className="mt-4">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCategory(article.categoryKey);
                            setCurrentPage(1);
                          }}
                          className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 hover:bg-[#00296E] hover:text-white text-slate-700 transition-colors cursor-pointer"
                        >
                          {article.categoryLabel}
                        </button>
                      </div>

                      {/* Meta Row: Tanggal & Waktu Baca */}
                      <div className="mt-2.5 flex items-center gap-2 text-xs text-slate-500 font-medium">
                        <span>{article.date}</span>
                        <span>&bull;</span>
                        <span>{article.readTime}</span>
                      </div>

                      {/* Judul Artikel */}
                      <h3 className="mt-2 text-base sm:text-lg font-bold text-[#00296E] group-hover:text-[#0094E0] transition-colors leading-snug line-clamp-2">
                        {article.title}
                      </h3>

                      {/* Ringkasan / Excerpt */}
                      <p className="mt-2 text-slate-600 text-xs sm:text-sm leading-relaxed line-clamp-2 font-normal">
                        {article.excerpt}
                      </p>

                      {/* Tombol Aksi: Baca Selengkapnya & Bagikan */}
                      <div className="mt-4 pt-3 border-t border-slate-100 w-full flex items-center justify-between">
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#00296E] group-hover:text-[#0094E0] transition-colors">
                          <span>Baca Selengkapnya</span>
                          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShare(article);
                          }}
                          className="w-8 h-8 rounded-full bg-slate-100 hover:bg-[#00296E] text-slate-600 hover:text-white flex items-center justify-center transition-all cursor-pointer"
                          title="Bagikan Artikel"
                          aria-label="Bagikan Artikel"
                        >
                          <Share2 className="w-3.5 h-3.5 stroke-[2]" />
                        </button>
                      </div>

                    </article>
                  ))}
                </div>
              ) : (
                /* Tampilan Kosong Jika Pencarian Tidak Ada Hasil */
                <div className="text-center py-16 px-4 rounded-[24px] bg-slate-50 border border-slate-100">
                  <div className="w-14 h-14 rounded-2xl bg-sky-100 text-[#0094E0] flex items-center justify-center mx-auto mb-4">
                    <Search className="w-7 h-7" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800">Tidak ada artikel yang cocok</h3>
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
            {/* SISI KANAN (lg:col-span-4): SIDEBAR KATEGORI & BERITA TERBARU (FIXED / STICKY SAAT SCROLL) */}
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
                          {cat.badge}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* KOTAK 2: BERITA TERBARU (PERSIS GAMBAR REFERENSI) */}
              <div className="bg-white rounded-[20px] p-5 sm:p-6 border border-slate-200/90 shadow-xs">
                <h2 className="text-[13px] sm:text-sm font-bold text-slate-800 tracking-wider uppercase border-b border-slate-100 pb-3 mb-3.5">
                  BERITA TERBARU
                </h2>
                <div className="divide-y divide-slate-100">
                  {RECENT_NEWS.map((news) => (
                    <div
                      key={news.id}
                      onClick={() => {
                        setSelectedCategory(news.categoryKey);
                        setCurrentPage(1);
                      }}
                      className="py-3.5 first:pt-0 last:pb-0 group cursor-pointer"
                    >
                      <h3 className="text-[13px] sm:text-[13.5px] font-semibold text-slate-800 group-hover:text-[#00296E] leading-snug line-clamp-2 transition-colors">
                        {news.title}
                      </h3>
                      <p className="mt-1.5 text-xs text-slate-400 font-normal">
                        {news.date}
                      </p>
                    </div>
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
