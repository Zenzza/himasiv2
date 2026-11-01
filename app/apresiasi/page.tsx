"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Trophy,
  Code2,
  Briefcase,
  Heart,
  Search,
  ExternalLink,
  Award,
  Sparkles,
  Users,
  GraduationCap,
  Building2,
  X,
  FileCheck2,
  Calendar,
  Share2,
  Layers,
  ArrowRight,
  Filter,
} from "lucide-react";
import ScrollReveal from "@/components/scroll-reveal";
import Footer from "@/components/footer";
import FormPengajuanApresiasi from "@/components/form-pengajuan-apresiasi";
import {
  getApresiasiShowcase,
  isApresiasiLiked,
  toggleApresiasiLike,
} from "@/lib/data/apresiasi";
import { type ApresiasiItem, type ApresiasiCategory } from "@/lib/types/apresiasi";

export default function ApresiaSIPage() {
  const [items, setItems] = useState<ApresiasiItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<"all" | ApresiasiCategory>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<ApresiasiItem | null>(null);

  // Status Like & Count lokal per item
  const [likesMap, setLikesMap] = useState<Record<string, number>>({});
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const data = await getApresiasiShowcase();
        setItems(data);

        // Inisialisasi like state
        const initialLikes: Record<string, number> = {};
        const initialLiked: Record<string, boolean> = {};
        data.forEach((item) => {
          initialLikes[item.id] = item.likes;
          initialLiked[item.id] = isApresiasiLiked(item.id);
        });
        setLikesMap(initialLikes);
        setLikedMap(initialLiked);
      } catch (err) {
        console.error("Gagal memuat showcase apresiasi:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // Lock scroll saat modal terbuka
  useEffect(() => {
    if (selectedItem) {
      document.body.style.overflow = "hidden";
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") setSelectedItem(null);
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => {
        document.body.style.overflow = "unset";
        window.removeEventListener("keydown", handleKeyDown);
      };
    } else {
      document.body.style.overflow = "unset";
    }
  }, [selectedItem]);

  // Handle Like Button Click
  const handleLikeClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const newLikedStatus = toggleApresiasiLike(id);
    setLikedMap((prev) => ({ ...prev, [id]: newLikedStatus }));
    setLikesMap((prev) => ({
      ...prev,
      [id]: Math.max(0, (prev[id] ?? 0) + (newLikedStatus ? 1 : -1)),
    }));
  };

  // Filter & Search Items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchCategory =
        selectedCategory === "all" ? true : item.category === selectedCategory;

      const q = searchQuery.toLowerCase().trim();
      if (!q) return matchCategory;

      const matchSearch =
        item.title.toLowerCase().includes(q) ||
        item.studentName.toLowerCase().includes(q) ||
        (item.teamMembers && item.teamMembers.toLowerCase().includes(q)) ||
        item.organizerOrCompany.toLowerCase().includes(q) ||
        item.badge.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.batch.includes(q);

      return matchCategory && matchSearch;
    });
  }, [items, selectedCategory, searchQuery]);

  return (
    <div className="flex flex-col w-full max-w-full overflow-x-hidden bg-white text-[#091e42] min-h-screen">
      {/* ============================================================ */}
      {/* 1. SECTION HEADER: PERSIS SEPERTI HALAMAN BERITA & PROFIL */}
      {/* ============================================================ */}
      <section className="relative pt-10 sm:pt-14 pb-8 sm:pb-12 px-4 sm:px-6 lg:px-12 bg-white w-full overflow-hidden">
        <ScrollReveal className="max-w-6xl mx-auto">
          <div className="relative text-center max-w-2xl mx-auto">
            {/* Breadcrumb Sesuai Referensi: HOME / APRESIASI */}
            <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">
              <Link href="/" className="text-[#0094E0] hover:underline">
                HOME
              </Link>
              <span className="text-slate-300">/</span>
              <span className="text-slate-600">APRESIASI</span>
            </div>

            {/* Judul Utama: Apresia-SI */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-[#00296E] tracking-tight leading-tight">
              Apresia-SI
            </h1>

            {/* Subjudul Sesuai Referensi */}
            <p className="mt-3 text-slate-600 text-sm sm:text-base leading-relaxed font-normal">
              Panggung apresiasi karya inovatif, prestasi kompetisi, dan kiprah magang mahasiswa Sistem Informasi
            </p>
          </div>
        </ScrollReveal>
      </section>

      {/* ============================================================ */}
      {/* 3. SECTION SHOWCASE GALERI: FILTER, PENCARIAN & GRID KARTU */}
      {/* ============================================================ */}
      <section className="relative py-10 sm:py-14 px-4 sm:px-6 lg:px-12 bg-white w-full">
        <div className="max-w-6xl mx-auto">
          {/* Controls: Filter Pills & Search Bar */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-8 sm:mb-10">
            {/* Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
              <button
                type="button"
                onClick={() => setSelectedCategory("all")}
                className={`px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all shrink-0 cursor-pointer ${
                  selectedCategory === "all"
                    ? "bg-[#00296E] text-white shadow-md shadow-[#00296E]/20"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                }`}
              >
                Semua ({items.length})
              </button>
              <button
                type="button"
                onClick={() => setSelectedCategory("lomba")}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all shrink-0 cursor-pointer ${
                  selectedCategory === "lomba"
                    ? "bg-[#00296E] text-white shadow-md shadow-[#00296E]/20"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                }`}
              >
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span>Pemenang Lomba</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedCategory("karya")}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all shrink-0 cursor-pointer ${
                  selectedCategory === "karya"
                    ? "bg-[#00296E] text-white shadow-md shadow-[#00296E]/20"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                }`}
              >
                <Code2 className="w-3.5 h-3.5 text-cyan-500" />
                <span>Karya & Inovasi</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedCategory("magang")}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all shrink-0 cursor-pointer ${
                  selectedCategory === "magang"
                    ? "bg-[#00296E] text-white shadow-md shadow-[#00296E]/20"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                }`}
              >
                <Briefcase className="w-3.5 h-3.5 text-emerald-500" />
                <span>Magang & MSIB</span>
              </button>
            </div>

            {/* Kolom Pencarian */}
            <div className="relative w-full md:w-72 shrink-0">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari prestasi, nama, NIM..."
                className="w-full pl-10 pr-9 py-2 rounded-full border border-slate-200 bg-slate-50 hover:bg-white focus:bg-white text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0094E0]/40 focus:border-[#0094E0] transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Status Jumlah Data & Keterangan Filter Aktif */}
          <div className="mb-6 flex items-center justify-between text-xs text-slate-500">
            <span>
              Menampilkan <strong className="text-slate-800">{filteredItems.length}</strong> karya & pencapaian
              {searchQuery && (
                <>
                  {" "}untuk pencarian &quot;<span className="text-[#00296E] font-medium">{searchQuery}</span>&quot;
                </>
              )}
            </span>
            {(selectedCategory !== "all" || searchQuery) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory("all");
                  setSearchQuery("");
                }}
                className="text-[#0094E0] hover:underline font-medium cursor-pointer"
              >
                Reset Filter
              </button>
            )}
          </div>

          {/* Grid Kartu Apresiasi */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="rounded-3xl border border-slate-200/80 bg-white p-4 animate-pulse flex flex-col justify-between"
                >
                  <div className="w-full aspect-[16/9] rounded-2xl bg-slate-200" />
                  <div className="mt-4 space-y-2">
                    <div className="w-24 h-5 rounded-full bg-slate-200" />
                    <div className="w-3/4 h-5 rounded bg-slate-200" />
                    <div className="w-1/2 h-4 rounded bg-slate-200" />
                    <div className="w-full h-8 rounded bg-slate-100" />
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between">
                    <div className="w-16 h-6 rounded bg-slate-200" />
                    <div className="w-24 h-6 rounded bg-slate-200" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredItems.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {filteredItems.map((item, idx) => {
                const isLiked = likedMap[item.id] ?? false;
                const currentLikes = likesMap[item.id] ?? item.likes;

                return (
                  <ScrollReveal
                    key={item.id}
                    direction="card-pop"
                    delay={(idx % 3) * 100}
                    className="w-full h-full"
                  >
                    <div
                      onClick={() => setSelectedItem(item)}
                      className="group flex flex-col justify-between h-full rounded-[24px] bg-white border border-slate-200/80 hover:border-[#0094E0]/40 shadow-sm hover:shadow-[0_12px_30px_rgba(0,41,110,0.08)] transition-all duration-300 overflow-hidden cursor-pointer"
                    >
                      {/* Bagian Gambar + Badge */}
                      <div className="relative w-full aspect-[16/9] overflow-hidden bg-slate-100">
                        <img
                          src={item.image}
                          alt={item.title}
                          loading="lazy"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              "https://images.unsplash.com/photo-1531403009284-440f080d1e12?q=80&w=800&auto=format&fit=crop";
                          }}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        {/* Overlay Gradient Halus */}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-80" />

                        {/* Badges di atas gambar */}
                        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase shadow-sm ${
                              item.category === "lomba"
                                ? "bg-amber-500 text-white"
                                : item.category === "karya"
                                ? "bg-[#0094E0] text-white"
                                : "bg-emerald-600 text-white"
                            }`}
                          >
                            {item.categoryLabel}
                          </span>
                        </div>

                        <div className="absolute top-3 right-3">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/90 backdrop-blur-md text-[#00296E] shadow-sm">
                            {item.badge}
                          </span>
                        </div>

                        {/* Level Info di sudut kiri bawah gambar */}
                        {item.level && (
                          <div className="absolute bottom-2.5 left-3 text-[11px] font-semibold text-white/90 drop-shadow-sm flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-amber-300" />
                            <span>Tingkat {item.level}</span>
                          </div>
                        )}
                      </div>

                      {/* Konten Kartu */}
                      <div className="p-5 flex-1 flex flex-col justify-between">
                        <div>
                          {/* Nama Mahasiswa / Tim & Angkatan */}
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-2">
                            <Users className="w-3.5 h-3.5 text-[#0094E0]" />
                            <span className="font-semibold text-slate-700 truncate">
                              {item.studentName}
                            </span>
                            <span className="text-slate-300">•</span>
                            <span className="shrink-0">Angk. {item.batch}</span>
                          </div>

                          {/* Judul Prestasi / Karya */}
                          <h3 className="text-base font-bold text-[#00296E] group-hover:text-[#0094E0] transition-colors leading-snug line-clamp-2">
                            {item.title}
                          </h3>

                          {/* Mitra / Penyelenggara */}
                          <div className="mt-2 flex items-center gap-1.5 text-xs text-[#0094E0] font-medium">
                            <Building2 className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">{item.organizerOrCompany}</span>
                          </div>

                          {/* Deskripsi Singkat */}
                          <p className="mt-2.5 text-xs text-slate-600 leading-relaxed line-clamp-2">
                            {item.description}
                          </p>
                        </div>

                        {/* Footer Kartu: Like Counter & Tombol Detail */}
                        <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                          {/* Like Button */}
                          <button
                            type="button"
                            onClick={(e) => handleLikeClick(e, item.id)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                              isLiked
                                ? "bg-rose-50 text-rose-600 border border-rose-200"
                                : "bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200"
                            }`}
                            title="Apresiasi karya ini"
                          >
                            <Heart
                              className={`w-3.5 h-3.5 transition-transform active:scale-125 ${
                                isLiked ? "fill-rose-500 text-rose-500" : "text-slate-400"
                              }`}
                            />
                            <span>{currentLikes}</span>
                          </button>

                          {/* Detail Button */}
                          <div className="inline-flex items-center gap-1 text-xs font-bold text-[#00296E] group-hover:text-[#0094E0] transition-colors">
                            <span>Detail Cerita</span>
                            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </ScrollReveal>
                );
              })}
            </div>
          ) : items.length === 0 ? (
            /* Empty State: Database Galeri Masih Kosong */
            <div className="py-16 px-4 text-center max-w-md mx-auto">
              <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-200 text-amber-500 mx-auto flex items-center justify-center mb-4">
                <Trophy className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-[#00296E]">
                Belum Ada Karya yang Dipublikasikan
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed">
                Punya prestasi lomba, karya cipta aplikasi, atau pengalaman magang industri? Daftarkan pencapaian Anda melalui formulir di bawah ini!
              </p>
              <a
                href="#ajukan-apresiasi"
                className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#00296E] text-white text-xs font-bold hover:bg-[#001f52] transition-colors cursor-pointer shadow-sm"
              >
                <span>Ajukan Prestasi Sekarang</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          ) : (
            /* Empty State: Filter / Pencarian tidak ada yang cocok */
            <div className="py-16 px-4 text-center max-w-md mx-auto">
              <div className="w-16 h-16 rounded-full bg-slate-100 border border-slate-200 text-slate-400 mx-auto flex items-center justify-center mb-4">
                <Search className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-[#00296E]">
                Tidak Ada Apresiasi yang Cocok
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1.5">
                Tidak ditemukan pencapaian atau karya untuk kategori dan kata kunci yang Anda masukkan.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory("all");
                  setSearchQuery("");
                }}
                className="mt-5 inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#00296E] text-white text-xs font-semibold hover:bg-[#001f52] transition-colors cursor-pointer"
              >
                Reset Filter
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ============================================================ */}
      {/* 4. MODAL DIALOG DETAIL CERITA APRESIASI */}
      {/* ============================================================ */}
      {selectedItem && (
        <div
          className="fixed inset-0 z-50 bg- backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-200"
          onClick={() => setSelectedItem(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="relative w-full max-w-2xl bg-white rounded-[28px] sm:rounded-[32px] shadow-2xl overflow-hidden my-8 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Gambar Modal */}
            <div className="relative w-full aspect-[16/9] sm:aspect-[21/9] bg-slate-100 overflow-hidden">
              <img
                src={selectedItem.image}
                alt={selectedItem.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "https://images.unsplash.com/photo-1531403009284-440f080d1e12?q=80&w=800&auto=format&fit=crop";
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/30 to-transparent" />

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-md text-white flex items-center justify-center transition-colors cursor-pointer"
                title="Tutup dialog"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Badges di dalam Banner Modal */}
              <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-center gap-2">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-white shadow-sm ${
                    selectedItem.category === "lomba"
                      ? "bg-amber-500"
                      : selectedItem.category === "karya"
                      ? "bg-[#0094E0]"
                      : "bg-emerald-600"
                  }`}
                >
                  {selectedItem.categoryLabel}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/90 text-[#00296E]">
                  {selectedItem.badge}
                </span>
                {selectedItem.level && (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-md text-white border border-white/30">
                    Tingkat {selectedItem.level}
                  </span>
                )}
              </div>
            </div>

            {/* Konten Isi Modal */}
            <div className="p-6 sm:p-8 max-h-[70vh] overflow-y-auto space-y-5">
              {/* Judul Lengkap */}
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-[#00296E] tracking-tight leading-snug">
                  {selectedItem.title}
                </h2>
                <div className="mt-2 flex items-center gap-2 text-xs sm:text-sm text-[#0094E0] font-semibold">
                  <Building2 className="w-4 h-4 shrink-0" />
                  <span>{selectedItem.organizerOrCompany}</span>
                </div>
              </div>

              {/* Profil Mahasiswa / Tim Card */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block mb-0.5">Mahasiswa / Ketua:</span>
                  <span className="font-bold text-slate-800 text-sm">
                    {selectedItem.studentName}
                  </span>
                  {selectedItem.nim && (
                    <span className="text-slate-500 block text-xs">
                      NIM: {selectedItem.nim}
                    </span>
                  )}
                </div>

                <div>
                  <span className="text-slate-400 block mb-0.5">Angkatan:</span>
                  <span className="font-bold text-slate-800">
                    Sistem Informasi {selectedItem.batch}
                  </span>
                </div>

                {selectedItem.teamMembers && (
                  <div className="sm:col-span-2 pt-2 border-t border-slate-200/60">
                    <span className="text-slate-400 block mb-0.5">Anggota Tim:</span>
                    <span className="font-medium text-slate-700">
                      {selectedItem.teamMembers}
                    </span>
                  </div>
                )}

                {selectedItem.mentorOrLecturer && (
                  <div className="sm:col-span-2 pt-2 border-t border-slate-200/60">
                    <span className="text-slate-400 block mb-0.5">Pembina / Laboratorium:</span>
                    <span className="font-medium text-slate-700">
                      {selectedItem.mentorOrLecturer}
                    </span>
                  </div>
                )}
              </div>

              {/* Cerita Lengkap / Deskripsi */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Cerita & Catatan Inovasi
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                  {selectedItem.fullStory || selectedItem.description}
                </p>
              </div>

              {/* Tautan Eksternal & Bukti */}
              {(selectedItem.liveUrl || selectedItem.githubUrl || selectedItem.proofUrl) && (
                <div className="pt-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2.5">
                    Tautan & Portofolio Karya
                  </h4>
                  <div className="flex flex-wrap gap-2.5">
                    {selectedItem.liveUrl && (
                      <a
                        href={selectedItem.liveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#00296E] hover:bg-[#001f52] text-white text-xs font-semibold transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Kunjungi Live Demo</span>
                      </a>
                    )}
                    {selectedItem.githubUrl && (
                      <a
                        href={selectedItem.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors"
                      >
                        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                          <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                        </svg>
                        <span>Source Code GitHub</span>
                      </a>
                    )}
                    {selectedItem.proofUrl && (
                      <a
                        href={selectedItem.proofUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors border border-slate-200"
                      >
                        <FileCheck2 className="w-3.5 h-3.5 text-[#0094E0]" />
                        <span>Lihat Sertifikat / Bukti</span>
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Footer Modal: Like & Tombol Tutup */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={(e) => handleLikeClick(e, selectedItem.id)}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    likedMap[selectedItem.id]
                      ? "bg-rose-50 text-rose-600 border border-rose-200"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                  }`}
                >
                  <Heart
                    className={`w-4 h-4 ${
                      likedMap[selectedItem.id] ? "fill-rose-500 text-rose-500" : "text-slate-400"
                    }`}
                  />
                  <span>
                    {likedMap[selectedItem.id] ? "Anda Mengapresiasi" : "Beri Apresiasi"} (
                    {likesMap[selectedItem.id] ?? selectedItem.likes})
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedItem(null)}
                  className="px-5 py-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 5. SECTION FORMULIR SUBMISI MANDIRI MAHASISWA (DI BAGIAN BAWAH) */}
      {/* ============================================================ */}
      <section
        id="ajukan-apresiasi"
        className="relative py-12 sm:py-16 px-4 sm:px-6 lg:px-12 bg-white w-full"
      >
        <ScrollReveal className="max-w-6xl mx-auto">
          {/* Header Section Form Submisi */}
          <div className="mb-8 sm:mb-10 text-center max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#00296E] tracking-tight leading-tight">
              Punya Prestasi atau Karya yang Ingin Diapresiasi?
            </h2>
            <p className="mt-2.5 text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
              Daftarkan capaian kompetisi, proyek karya cipta mandiri, atau pengalaman magang & MSIB Anda untuk dipublikasikan di Apresia-SI.
            </p>
          </div>

          {/* Form Component */}
          <FormPengajuanApresiasi />
        </ScrollReveal>
      </section>

      {/* ============================================================ */}
      {/* 6. FOOTER */}
      {/* ============================================================ */}
      <Footer />
    </div>
  );
}
