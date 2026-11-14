"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CalendarBlank,
  Users,
  Medal,
  FileText,
  DownloadSimple,
  CheckCircle,
} from "@phosphor-icons/react";
import Footer from "@/components/footer";
import ScrollReveal from "@/components/scroll-reveal";
import { supabase } from "@/lib/supabase/client";
import {
  DAFTAR_DIVISI,
  DAFTAR_PENGURUS_HIMASI,
  DIVISI_DESCRIPTIONS,
  sortPengurusMembers,
  type PengurusMember,
} from "@/lib/data/pengurus";
import {
  DokumenOrganisasi,
  DEFAULT_DOKUMEN_ORGANISASI,
} from "@/lib/types/dokumen";
import { getDokumenOrganisasi } from "@/lib/supabase/dokumen";

// ===================================================================
// DATA SINGKAT KABINET (PERSIS SESUAI HOMEPAGE)
// ===================================================================
const KABINET_METRICS = [
  {
    number: "",
    icon: CalendarBlank,
    title: "Est. 2010",
    subtitle: "16 tahun telah bersama dalam mengembangkan bakat dan minat mahasiswa Sistem Informasi.",
    iconStyle: "bg-[#0c2340] border border-[#0094E0]/40 text-[#0094E0]",
  },
  {
    number: "",
    icon: Users,
    title: "3 Divisi",
    subtitle: "Divisi yang telah bersatu dalam mengembangkan HIMASI dan Sistem Informasi.",
    iconStyle: "bg-[#0094E0] text-[#002257] shadow-md shadow-[#0094E0]/25",
  },
  {
    number: "",
    icon: Medal,
    title: "30 Anggota Aktif",
    subtitle: "30 anggota yang aktif dalam mengembangkan HIMASI dan Sistem Informasi.",
    iconStyle: "bg-[#0c2340] border border-[#0094E0]/40 text-[#0094E0]",
  },
];

// ===================================================================
// MISI ITEMS (PERSIS SESUAI HOMEPAGE)
// ===================================================================
const MISI_ITEMS = [
  {
    no: "01",
    text: "Membangun lingkungan himpunan yang inklusif & supportive dengan menciptakan suasana organisasi yang nyaman, terbuka dan saling bantu, supaya semua anggota merasa didengar dan berkembang tanpa takut ketinggalan.",
    highlight: false,
  },
  {
    no: "02",
    text: "Mengoptimalkan media digital HIMASI secara edukatif, kreatif, dan interaktif yang tetap relevan dengan tujuan HIMASI sebagai sumber informasi dan inspirasi untuk mahasiswa SI",
    highlight: false,
  },
  {
    no: "03",
    text: "Menguatkan kolaborasi eksternal dengan menjalin kerja sama dengan startup, UMKM, dan komunitas digital untuk membuka peluang sponsor, informasi, dan jaringan HIMASI",
    highlight: false,
  },
  {
    no: "04",
    text: "Mempercepat adaptasi teknologi dalam kegiatan organisasi dengan menggunakan platform digital untuk administrasi, koordinasi hingga evaluasi, supaya HIMASI lebih gesit dan efisien",
    highlight: false,
  },
  {
    no: "05",
    text: "Meneruskan program unggulan yang sudah berjalan dengan lebih terstruktur",
    highlight: false,
  },
];

// ===================================================================
// FILOSOFI LOGO KABINET (TEPAT 1 HOTSPOT PER FILOSOFI)
// ===================================================================
const KABINET_LOGO_ELEMENTS = [
  {
    id: 0,
    shortName: "Simbol Buku",
    title: "Simbol Buku",
    description:
      "Merepresentasikan ilmu pengetahuan, pembelajaran, dan wawasan sebagai landasan HIMASI, sekaligus melambangkan nilai dan budi luhur yang diwariskan antargenerasi.",
    pin: { top: "78%", left: "50%" },
    primaryPin: { top: 78, left: 50 },
  },
  {
    id: 1,
    shortName: "Simbol Perisai",
    title: "Simbol Perisai",
    description:
      "Melambangkan perlindungan, keteguhan, dan tanggung jawab dalam menjaga identitas, etika, integritas, serta nilai-nilai luhur HIMASI di tengah perkembangan zaman.",
    pin: { top: "14%", left: "50%" },
    primaryPin: { top: 14, left: 50 },
  },
  {
    id: 2,
    shortName: "Simbol Api",
    title: "Simbol Api",
    description:
      "Menggambarkan semangat, keberanian, dan daya juang anggota HIMASI untuk terus belajar, berkarya, serta menjadi cahaya dalam menghadapi perubahan zaman.",
    pin: { top: "32%", left: "50%" },
    primaryPin: { top: 32, left: 50 },
  },
  {
    id: 3,
    shortName: "Simbol Empat Pilar",
    title: "Simbol Empat Pilar",
    description:
      "Merepresentasikan tiga divisi dan satu BPH yang saling melengkapi dalam menjalankan HIMASI, dengan mengedepankan kolaborasi, sinergi, dan keseimbangan untuk mencapai tujuan bersama.",
    pin: { top: "52%", left: "50%" },
    primaryPin: { top: 52, left: 50 },
  },
];

// ===================================================================
// DAFTAR 6 DIVISI KABINET
// PEMBINA, BPH, MEDKOMINFO, HUMAS, BISNIS KREATIF, PENASIHAT
// ===================================================================
const DIVISI_KEYS = DAFTAR_DIVISI;
type DivisiKey = string;

export default function ProfilPage() {
  const [hoveredLogoElement, setHoveredLogoElement] = useState<number | null>(null);
  const [activeDivisi, setActiveDivisi] = useState<DivisiKey>("BPH");
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);
  const [pengurusList, setPengurusList] = useState<PengurusMember[]>([]);
  const [loadingPengurus, setLoadingPengurus] = useState(true);

  // Dynamic Dokumen Organisasi
  const [dokumenList, setDokumenList] = useState<DokumenOrganisasi[]>(DEFAULT_DOKUMEN_ORGANISASI);
  const [loadingDokumen, setLoadingDokumen] = useState(true);

  const fetchPengurusData = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("pengurus")
        .select("*")
        .order("created_at", { ascending: true });

      if (!error && data && data.length > 0) {
        const activeRows = data.filter((row: any) => row.is_active !== false);
        const mapped: PengurusMember[] = activeRows.map((row: any) => ({
          id: String(row.id),
          nim: row.nim || "",
          nama: row.nama || "",
          jabatan: row.jabatan || "",
          divisi: (row.divisi || "").trim().toUpperCase(),
          qrToken: "",
          image: row.foto_url || "/DSC01203.jpg",
          email: "",
          urutan: row.urutan != null ? Number(row.urutan) : undefined,
        }));
        setPengurusList(sortPengurusMembers(mapped));
      } else {
        setPengurusList(sortPengurusMembers(DAFTAR_PENGURUS_HIMASI));
      }
    } catch (err) {
      console.warn("Koneksi pengurus profil offline, memakai data fallback:", err);
      setPengurusList(sortPengurusMembers(DAFTAR_PENGURUS_HIMASI));
    } finally {
      setLoadingPengurus(false);
    }
  }, []);

  const fetchDokumenData = useCallback(async () => {
    try {
      const docs = await getDokumenOrganisasi();
      setDokumenList(docs);
    } catch (err) {
      console.warn("Koneksi dokumen profil offline, memakai data default:", err);
      setDokumenList(DEFAULT_DOKUMEN_ORGANISASI);
    } finally {
      setLoadingDokumen(false);
    }
  }, []);

  useEffect(() => {
    fetchPengurusData();
    fetchDokumenData();

    // Realtime listener Supabase agar penambahan/perubahan/penghapusan pengurus & dokumen di Dashboard langsung tersinkronisasi
    const channel = supabase
      .channel("himasi_realtime_profil_page")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "pengurus" },
        () => {
          fetchPengurusData();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "dokumen_organisasi" },
        () => {
          fetchDokumenData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchPengurusData, fetchDokumenData]);

  const currentDivisiDesc =
    DIVISI_DESCRIPTIONS[activeDivisi] || {
      title: activeDivisi,
      subtitle: "Pusat kepemimpinan, koordinasi internal, dan tata kelola organisasi HIMASI.",
    };

  const currentMembers = useMemo(() => {
    const cleanActive = (activeDivisi || "").trim().toUpperCase();
    const filtered = pengurusList.filter(
      (m) => (m.divisi || "").trim().toUpperCase() === cleanActive
    );
    return sortPengurusMembers(filtered);
  }, [pengurusList, activeDivisi]);

  const handleDownload = (doc: DokumenOrganisasi) => {
    if (doc.file_url) {
      const link = document.createElement("a");
      link.href = doc.file_url;
      link.download = doc.file_name || `${doc.judul}.pdf`;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      const content = `Dokumen Resmi HIMASI ISB Atma Luhur\n\nJudul: ${doc.judul}\nKeterangan: ${doc.deskripsi}\nKabinet: REKSABUDAYA\nTahun Kepengurusan: 2025/2026\nInstitut Sains dan Bisnis Atma Luhur Pangkalpinang\n`;
      const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = doc.file_name || `${doc.judul}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }

    setDownloadSuccess(`Dokumen "${doc.judul}" berhasil diunduh!`);
    setTimeout(() => {
      setDownloadSuccess(null);
    }, 3500);
  };

  const activeElement =
    hoveredLogoElement !== null ? KABINET_LOGO_ELEMENTS[hoveredLogoElement] : null;
  const targetPin = activeElement?.primaryPin;
  const pinX = targetPin ? 9 + 0.82 * targetPin.left : 50;
  const pinY = targetPin ? 9 + 0.82 * targetPin.top : 50;


  return (
    <div className="flex flex-col w-full max-w-full overflow-x-clip bg-white text-[#091e42] min-h-screen">
      
      {/* ============================================================ */}
      {/* SECTION HEADER: PERSIS SESUAI STYLE PAGE BERITA */}
      {/* Breadcrumb HOME / KABINET, Judul Tengah Besar, dan Subjudul */}
      {/* ============================================================ */}
      <section className="relative pt-10 sm:pt-14 pb-8 sm:pb-12 px-4 sm:px-6 lg:px-12 bg-white w-full overflow-hidden">
        <ScrollReveal className="max-w-6xl mx-auto">
          <div className="relative text-center max-w-3xl mx-auto">
            {/* Breadcrumb Sesuai Referensi: HOME / KABINET */}
            <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">
              <Link href="/" className="text-[#0094E0] hover:underline">
                HOME
              </Link>
              <span className="text-slate-300">/</span>
              <span className="text-slate-600">KABINET</span>
            </div>

            {/* Judul Utama: Profil Kabinet */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-[#00296E] tracking-tight leading-tight">
              Kabinet REKSABUDAYA
            </h1>

            {/* Subjudul Sesuai Referensi Berita */}
            <p className="text-slate-600 text-xs sm:text-sm md:text-base leading-relaxed mt-3 font-normal">
              Mengenal lebih dekat Kabinet REKSABUDAYA HIMASI ISB Atma Luhur
            </p>
          </div>
        </ScrollReveal>
      </section>

      {/* ============================================================ */}
      {/* BAGIAN 1: DESKRIPSI KABINET REKSABUDAYA */}
      {/* Showcase Profil, Makna Nama, dan Semangat Kepengurusan */}
      {/* ============================================================ */}
      <section className="relative py-12 sm:py-16 px-4 sm:px-6 lg:px-12 bg-gradient-to-b from-white via-[#f7faff] to-white w-full overflow-hidden">
        <ScrollReveal className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            
            {/* Sisi Kiri: Foto Kepengurusan & Kartu Visual Kabinet */}
            <div className="lg:col-span-5 relative flex flex-col items-center justify-center">
              {/* Ambient Glow */}
              <div className="absolute inset-0 bg-[#0094E0]/15 rounded-full blur-3xl -z-10 pointer-events-none" />
              
              <div className="relative w-full rounded-[30px] sm:rounded-[36px] bg-white p-3 sm:p-4 shadow-[0_20px_50px_rgba(0,41,110,0.12)] border border-slate-100">
                <div className="aspect-[4/3] w-full rounded-[24px] sm:rounded-[28px] overflow-hidden bg-slate-100 relative group">
                  <img
                    src="/hero-banner.jpg"
                    alt="Kepengurusan Kabinet REKSABUDAYA HIMASI"
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#002257]/90 via-[#002257]/20 to-transparent flex flex-col justify-end p-5 text-white">
                    <span className="text-[11px] font-bold tracking-wider uppercase text-sky-300">
                      Periode 2026
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white mt-0.5">
                      Kabinet REKSABUDAYA
                    </h3>
                    <p className="text-xs text-slate-200 mt-1 font-normal line-clamp-2">
                      Himpunan Mahasiswa Sistem Informasi ISB Atma Luhur Pangkalpinang
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Sisi Kanan: Narasi Deskripsi Kabinet */}
            <div className="lg:col-span-7 flex flex-col justify-center">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-[#00296E] tracking-tight leading-[1.2] mb-4">
                Kabinet REKSABUDAYA
              </h2>

              <p className="text-slate-600 text-sm sm:text-base leading-relaxed font-normal mb-4">
                Nama <strong className="text-[#00296E] font-bold">REKSABUDAYA</strong> diambil dari dua pilar nilai luhur: <em>Reksa</em> yang bermakna menjaga, merawat, dan mengayomi; serta <em>Budaya</em> yang merepresentasikan nilai moralitas, budi pekerti, dan budaya keilmuan akademis yang dijunjung tinggi oleh seluruh civitas akademika Sistem Informasi ISB Atma Luhur.
              </p>

              <p className="text-slate-600 text-sm sm:text-base leading-relaxed font-normal mb-6">
                Sebagai wadah resmi mahasiswa, kabinet ini berkomitmen menjadi jembatan strategis yang adaptif terhadap kemajuan era revolusi digital dan kecerdasan buatan, tanpa melupakan esensi kebersamaan, kepedulian sosial, serta etika profesionalisme seorang sarjana Sistem Informasi.
              </p>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* ============================================================ */}
      {/* BAGIAN 2: DATA SINGKAT KABINET (PERSIS SESUAI HOMEPAGE) */}
      {/* HIMASI dalam Angka + 3 Metric Cards */}
      {/* ============================================================ */}
      <section className="relative py-12 sm:py-16 px-4 sm:px-6 lg:px-12 bg-white w-full overflow-hidden">
        <div className="relative max-w-6xl mx-auto">
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 items-stretch">
            
            {/* Kolom Kiri: Header 'HIMASI dalam Angka' */}
            <ScrollReveal direction="up" className="sm:col-span-2 lg:col-span-1 flex flex-col justify-center py-2 pr-2">
              <div className="flex items-center gap-2 text-3xl font-extrabold text-[#00296E] uppercase">
                <span>REKSABUDAYA</span>
              </div>
              <h3 className="text-2xl sm:text-3xl lg:text-[28px] xl:text-2xl font-bold tracking-tight text-[#00296E] leading-tight">
                dalam <span className="text-[#0094E0]">Angka</span>
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-2.5 leading-relaxed font-normal">
                Lebih dari sekadar angka, ini adalah tentang perjalanan dan kontribusi.
              </p>
            </ScrollReveal>

            {/* Kolom Kanan: 3 Metric Cards (Animasi kotak muncul satu persatu) */}
            {KABINET_METRICS.map((card, idx) => {
              const IconComponent = card.icon;
              return (
                <ScrollReveal
                  key={idx}
                  direction="card-pop"
                  delay={idx * 160}
                  className="h-full"
                >
                  <div className="h-full relative rounded-2xl bg-[#00296E] border border-white/10 p-5 sm:p-6 flex flex-col justify-between shadow-xl hover:-translate-y-1 hover:border-[#0094E0]/40 transition-all duration-300 group">
                    {/* Top Row: Icon on Left, Number on Right */}
                    <div className="flex items-center justify-between mb-4">
                      <div className={`w-11 h-11 rounded-xl ${card.iconStyle} flex items-center justify-center transition-transform group-hover:scale-105 shrink-0`}>
                        <IconComponent className="w-5 h-5 stroke-[2.2]" />
                      </div>
                      <span className="text-xs sm:text-sm font-bold text-[#0094E0]/80 tracking-wider font-mono">
                        {card.number}
                      </span>
                    </div>

                    {/* Content: Title, Underline, Subtitle */}
                    <div>
                      <h4 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                        {card.title}
                      </h4>
                      <div className="w-7 h-0.5 bg-[#0094E0] my-2 rounded-full" />
                      <p className="text-slate-300/90 text-xs mt-1.5 leading-relaxed font-normal">
                        {card.subtitle}
                      </p>
                    </div>
                  </div>
                </ScrollReveal>
              );
            })}

          </div>

        </div>
      </section>

      {/* ============================================================ */}
      {/* BAGIAN 3: VISI & MISI KABINET (PERSIS SESUAI HOMEPAGE) */}
      {/* VISI Trapesium (Kiri) & MISI 4 Pill (Kanan) */}
      {/* ============================================================ */}
      <section className="relative py-12 sm:py-16 px-4 sm:px-6 lg:px-12 bg-gradient-to-b from-white via-[#f7faff] to-white w-full overflow-hidden">
        <div className="max-w-6xl mx-auto">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
            
            {/* Kolom Kiri: VISI (Bentuk Trapesium Presisi Sesuai Homepage - Card Pop) */}
            <ScrollReveal direction="card-pop" className="lg:col-span-5 h-full">
              <div className="relative flex flex-col justify-between p-7 sm:p-9 lg:p-10 min-h-[380px] drop-shadow-2xl group overflow-hidden rounded-2xl h-full">
                {/* Background SVG Trapesium with exact path - Single Solid Color #00296E */}
                <svg
                  className="absolute inset-0 w-full h-full -z-0"
                  viewBox="0 0 500 400"
                  preserveAspectRatio="none"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M 28,0.75 L 335,0.75 C 370,0.75 398,15.75 428,48.75 L 472,92.75 C 492,112.75 499.25,128 499.25,150 L 499.25,372 C 499.25,389.5 487.5,399.25 468,399.25 L 28,399.25 C 12.5,399.25 0.75,387.5 0.75,372 L 0.75,28 C 0.75,12.5 12.5,0.75 28,0.75 Z"
                    fill="#00296E"
                    stroke="rgba(255,255,255,0.15)"
                    strokeWidth="1.5"
                  />
                </svg>

                {/* Content within Trapezoid */}
                <div className="relative z-10 flex flex-col justify-between h-full">
                  {/* Header: VISI KABINET */}
                  <div className="flex items-center gap-2.5 text-xl font-bold tracking-[0.25em] text-white uppercase">
                    <span className="w-2 h-2 rounded-full bg-[#0094E0]" />
                    <span>VISI KABINET</span>
                  </div>

                  {/* Body: Visi Statement with Balanced Typography */}
                  <div className="my-auto py-5 sm:py-7 pr-4 sm:pr-8 lg:pr-12">
                    <p className="text-white text-lg sm:text-xl lg:text-[22px] xl:text-[23px] font-normal leading-[1.65] sm:leading-[1.7] tracking-normal">
                      Mewujudkan HIMASI sebagai pusat <strong className="font-extrabold text-white underline decoration-[#0094E0] decoration-2 underline-offset-4">kreativitas dan perkembangan teknologi</strong> yang kreatif, kolaboratif, dan relevan di mana setiap mahasiswa bisa berkembang bersama tanpa takut tertinggal.
                    </p>
                  </div>

                  {/* Bottom: Minimal Signature Line (Clean & Simple, No Badges) */}
                  <div className="pt-4 sm:pt-5 border-t border-white/10 flex items-center justify-between text-xs tracking-wider text-white/50 font-mono">
                    <span>KABINET REKSABUDAYA</span>
                    <span>HIMASI</span>
                  </div>
                </div>
              </div>
            </ScrollReveal>

            {/* Kolom Kanan: MISI (5 Pill Horizontal Sesuai Homepage - Muncul Satu Persatu) */}
            <div className="lg:col-span-7 flex flex-col justify-center py-2">
              {/* Header: MISI KABINET */}
              <ScrollReveal direction="up">
                <div className="flex items-center gap-2.5 text-xl font-bold tracking-[0.25em] text-[#00296E] uppercase mb-4 sm:mb-5">
                  <span className="w-2 h-2 rounded-full bg-[#0094E0]" />
                  <span>MISI KABINET</span>
                </div>
              </ScrollReveal>

              {/* 5 Misi Items with Numbered Circle Badges (Muncul satu persatu bergantian) */}
              <div className="space-y-3 sm:space-y-3.5">
                {MISI_ITEMS.map((misi, idx) => (
                  <ScrollReveal key={idx} direction="left" delay={idx * 120}>
                    <div className="flex items-center gap-3 sm:gap-4 group">
                      {/* Circle Badge 01, 02, 03, 04, 05 */}
                      <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#00296E] text-white font-bold text-xs sm:text-sm flex items-center justify-center shrink-0 shadow-sm transition-all duration-200 group-hover:scale-105 group-hover:bg-[#0094E0]">
                        {misi.no}
                      </div>

                      {/* Pill Text Container */}
                      <div className="flex-1 py-3 px-4 sm:px-5 rounded-2xl sm:rounded-[22px] bg-slate-50 border border-slate-100 transition-all duration-200 group-hover:bg-slate-100/80 group-hover:border-slate-200">
                        <p className={`text-xs sm:text-sm leading-relaxed ${misi.highlight ? "text-[#0094E0] font-semibold" : "text-slate-700 font-medium"}`}>
                          {misi.text}
                        </p>
                      </div>
                    </div>
                  </ScrollReveal>
                ))}
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ============================================================ */}
      {/* BAGIAN 4: FILOSOFI LOGO KABINET */}
      {/* SAMA DENGAN PAGE TENTANG (LOGO DI KIRI, POPUP HOVER, TEKS DI KANAN) */}
      {/* CUKUP 1 TITIK HOTSPOT PER FILOSOFI */}
      {/* ============================================================ */}
      <section className="relative py-16 sm:py-24 px-4 sm:px-6 lg:px-12 bg-white w-full overflow-hidden">
        <ScrollReveal className="max-w-6xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            
            {/* SISI KIRI (lg:col-span-5): LOGO KABINET + 1 HOTSPOT PER FILOSOFI */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center relative">
              <div className="relative w-full max-w-[350px] sm:max-w-[370px] aspect-square flex items-center justify-center p-2">
                
                {/* SVG Garis Penghubung (Connector Line) & Target Ring di Desktop - HANYA MUNCUL SAAT HOVER */}
                {activeElement && (
                  <svg
                    viewBox="0 0 100 100"
                    className="hidden lg:block absolute inset-0 w-full h-full pointer-events-none z-20 overflow-visible"
                  >
                    {/* Garis Penghubung dari Tepi Popup ke Titik Pin Aktif */}
                    <line
                      x1={pinY < 32 ? 44 : Math.max(48, Math.min(78, pinX))}
                      y1={pinY < 32 ? pinY : 32}
                      x2={pinX}
                      y2={pinY}
                      stroke="#0094E0"
                      strokeWidth="2"
                      strokeDasharray="4 3"
                      className="transition-all duration-300"
                    />
                    {/* Lingkaran Target Berwarna Biru Langit pada Titik Aktif */}
                    <circle
                      cx={pinX}
                      cy={pinY}
                      r="4.5"
                      fill="none"
                      stroke="#0094E0"
                      strokeWidth="2"
                      className="transition-all duration-300"
                    />
                    <circle
                      cx={pinX}
                      cy={pinY}
                      r="2"
                      fill="#0094E0"
                      className="transition-all duration-300"
                    />
                  </svg>
                )}

                {/* Wadah Logo Kabinet Bersih */}
                <div className="relative w-[84%] h-[84%] flex items-center justify-center">
                  <img
                    src="/logo-kabinet.png"
                    alt="Lambang Kabinet REKSABUDAYA HIMASI"
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-contain filter drop-shadow-[0_12px_24px_rgba(0,41,110,0.14)] select-none pointer-events-none"
                    draggable={false}
                  />

                  {/* Hotspots Pin Penunjuk Elemen Filosofi - TEPAT 1 TITIK PER FILOSOFI */}
                  {KABINET_LOGO_ELEMENTS.map((element, elemIdx) => {
                    const isHovered = hoveredLogoElement === elemIdx;
                    return (
                      <button
                        key={element.id}
                        type="button"
                        onMouseEnter={() => setHoveredLogoElement(elemIdx)}
                        onMouseLeave={() => setHoveredLogoElement(null)}
                        style={{ top: element.pin.top, left: element.pin.left }}
                        className="absolute -translate-x-1/2 -translate-y-1/2 z-30 flex items-center justify-center transition-all duration-300 group cursor-pointer focus:outline-none"
                        aria-label={`Pilih filosofi ${element.shortName}`}
                        title={element.shortName}
                      >
                        {isHovered ? (
                          <span className="relative flex h-6 w-6 items-center justify-center">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-4 w-4 bg-[#0094E0] border-2 border-white shadow-[0_0_12px_rgba(0,148,224,0.8)] items-center justify-center">
                              <span className="w-1.5 h-1.5 rounded-full bg-white" />
                            </span>
                          </span>
                        ) : (
                          <span className="w-3.5 h-3.5 rounded-full bg-rose-500/85 hover:bg-rose-600 border-2 border-white hover:scale-130 transition-all shadow-md flex items-center justify-center group-hover:shadow-[0_0_10px_rgba(225,29,72,0.6)]">
                            <span className="w-1 h-1 rounded-full bg-white/90" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Floating Popup Card di Desktop - HANYA MUNCUL SAAT DIHOVER */}
                {activeElement && (
                  <div
                    className="hidden lg:block absolute z-30 transition-all duration-300 pointer-events-auto"
                    onMouseEnter={() => setHoveredLogoElement(activeElement.id)}
                    onMouseLeave={() => setHoveredLogoElement(null)}
                    style={{
                      top: "-36px",
                      right: "-68px",
                      width: "285px",
                    }}
                  >
                    <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-[0_16px_36px_rgba(0,41,110,0.14)] border border-sky-100/90 relative animate-in fade-in zoom-in-95 duration-150">
                      <h4 className="text-sm sm:text-base font-bold text-[#00296E] tracking-tight leading-snug">
                        {activeElement.title}
                      </h4>
                      <p className="text-slate-600 text-xs sm:text-[13px] leading-relaxed mt-1.5 font-normal">
                        {activeElement.description}
                      </p>
                    </div>
                  </div>
                )}

              </div>

              {/* Popup Penjelasan di Layar Mobile & Tablet - HANYA MUNCUL SAAT DIHOVER */}
              {activeElement && (
                <div className="lg:hidden w-full max-w-[380px] mx-auto mt-4 bg-white rounded-2xl p-4.5 shadow-[0_12px_30px_rgba(0,41,110,0.1)] border border-sky-100/90 transition-all duration-200 animate-in fade-in duration-150">
                  <h4 className="text-sm sm:text-base font-bold text-[#00296E] tracking-tight leading-snug">
                    {activeElement.title}
                  </h4>
                  <p className="text-slate-600 text-xs sm:text-sm leading-relaxed mt-1.5 font-normal">
                    {activeElement.description}
                  </p>
                </div>
              )}

              {/* Petunjuk Interaksi */}
              <p className="text-[11px] sm:text-xs text-slate-400 text-center mt-3 font-medium">
                Tip: Arahkan kursor (hover) pada 1 titik lambang atau tombol di samping
              </p>
            </div>

            {/* SISI KANAN (lg:col-span-7): JUDUL, DESKRIPSI & PILLS PILIHAN */}
            <div className="lg:col-span-7 flex flex-col justify-center">
              
              {/* Badge Tag */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00296E]/5 border border-[#00296E]/10 mb-3 w-fit">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0094E0]" />
                <span className="text-xs font-bold text-[#00296E] uppercase tracking-wider">
                  Makna &amp; Filosofi
                </span>
              </div>

              {/* Judul: Filosofi Lambang Kabinet REKSABUDAYA */}
              <div className="mb-4">
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#00296E] tracking-tight leading-[1.1]">
                  Filosofi Logo
                </h2>
                <span className="block text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#00296E] mt-0.5 sm:mt-1">
                  Kabinet REKSABUDAYA
                </span>
              </div>

              {/* Deskripsi Pengantar */}
              <p className="text-slate-600 text-xs sm:text-sm md:text-base leading-relaxed font-normal mb-6 max-w-xl">
                Setiap elemen visual dalam lambang Kabinet REKSABUDAYA memiliki makna filosofis mendalam yang menjadi landasan integritas, semangat juang, dan sinergi organisasi.
              </p>

              {/* Daftar Pills Pilihan Elemen Sesuai Referensi Halaman Tentang */}
              <div className="flex flex-wrap gap-2 sm:gap-2.5">
                {KABINET_LOGO_ELEMENTS.map((elem, idx) => {
                  const isHovered = hoveredLogoElement === idx;
                  return (
                    <button
                      key={elem.id}
                      type="button"
                      onMouseEnter={() => setHoveredLogoElement(idx)}
                      onMouseLeave={() => setHoveredLogoElement(null)}
                      className={`px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer border ${
                        isHovered
                          ? "bg-[#00296E] text-white border-[#00296E] shadow-md shadow-[#00296E]/20 scale-[1.02]"
                          : "bg-[#f0f7fd] text-[#00296E] border-sky-100 hover:bg-sky-100/80 hover:border-sky-200 hover:text-[#001f52]"
                      }`}
                    >
                      {elem.shortName}
                    </button>
                  );
                })}
              </div>

            </div>

          </div>
        </ScrollReveal>
      </section>

      {/* ============================================================ */}
      {/* BAGIAN 5: DAFTAR DIVISI KABINET (6 PILIHAN SAJA) */}
      {/* PEMBINA, BPH, MEDKOMINFO, HUMAS, BISNIS KREATIF, PENASIHAT */}
      {/* CARD PENGURUS HOMEPAGE + LAYOUT REFERENSI GAMBAR */}
      {/* ============================================================ */}
      <section className="relative py-14 sm:py-22 px-4 sm:px-6 lg:px-12 bg-gradient-to-b from-white via-[#f7faff] to-white w-full overflow-hidden">
        <ScrollReveal className="max-w-6xl mx-auto">
          
          <div className="text-center mb-10 sm:mb-12">
            <h2 className="text-xl sm:text-4xl font-black text-[#00296E] tracking-tight">
              Pengurus Kabinet REKSABUDAYA
            </h2>

            {/* Filter Tabs: TEPAT 6 PILIHAN SAJA */}
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5 mt-6 sm:mt-8">
              {DIVISI_KEYS.map((key) => {
                const isActive = activeDivisi === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setActiveDivisi(key)}
                    className={`px-4 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-bold tracking-wide transition-all duration-200 cursor-pointer border ${
                      isActive
                        ? "bg-[#00296E] text-white border-[#00296E] shadow-md shadow-[#00296E]/20 scale-105"
                        : "bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    {key}
                  </button>
                );
              })}
            </div>

            {/* Deskripsi Divisi Terpilih Diletakkan di Bawah Pilihan */}
            <p className="text-slate-500 text-xs sm:text-sm mt-4 sm:mt-5 max-w-xl mx-auto font-normal leading-relaxed">
              {currentDivisiDesc.subtitle}
            </p>
          </div>

          {/* Grid Card Pengurus: Loading Skeleton / Empty / Real-time Cards */}
          {loadingPengurus ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
              {[1, 2, 3, 4].map((n) => (
                <div
                  key={n}
                  className="relative aspect-[3/4] sm:aspect-[3/4.1] rounded-[24px] sm:rounded-[28px] bg-slate-100 border border-slate-200/90 shadow-sm overflow-hidden flex flex-col justify-end p-4 sm:p-5 pb-5 sm:pb-6 animate-pulse"
                >
                  <div className="space-y-2.5">
                    <div className="h-6 w-3/4 bg-slate-300 rounded-md" />
                    <div className="h-4 w-1/2 bg-slate-200 rounded-md" />
                  </div>
                </div>
              ))}
            </div>
          ) : currentMembers.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center max-w-md mx-auto">
              <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">Belum Ada Pengurus di Divisi Ini</p>
              <p className="text-xs text-slate-400 mt-1">
                Data pengurus untuk divisi {activeDivisi} sedang dalam pembaruan.
              </p>
            </div>
          ) : (
            <div
              className={
                currentMembers.length <= 2
                  ? "grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 max-w-2xl mx-auto"
                  : "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6"
              }
            >
              {currentMembers.map((member) => (
                <div
                  key={member.id}
                  className="relative aspect-[3/4] sm:aspect-[3/4.1] rounded-[24px] sm:rounded-[28px] bg-white border border-slate-200/90 hover:border-slate-300 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 overflow-hidden group/card select-none flex flex-col justify-end"
                >
                  {/* Foto Pengurus Full */}
                  <div className="absolute inset-0 bg-slate-100 overflow-hidden">
                    <img
                      src={member.image || "/DSC01203.jpg"}
                      alt={member.nama}
                      draggable={false}
                      loading="lazy"
                      decoding="async"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = "/DSC01203.jpg";
                      }}
                      className="w-full h-full object-cover object-top group-hover/card:scale-105 transition-transform duration-500 pointer-events-none"
                    />
                  </div>

                  {/* Konten Bawah: Banner Biru untuk Nama + Subtitle Jabatan Persis Sesuai Gambar Referensi */}
                  <div className="relative z-10 p-4 sm:p-5 pb-5 sm:pb-6 flex flex-col items-start">
                    <div className="inline-block px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xs bg-gradient-to-r from-[#003B96] via-[#0055D4] to-[#FFFFFF]/20 max-w-full">
                      <h3 className="text-white font-black text-sm sm:text-base lg:text-[17px] xl:text-[18px] tracking-wider uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.55)] leading-tight select-none truncate max-w-full">
                        {member.nama}
                      </h3>
                    </div>
                    <p className="mt-1.5 sm:mt-2 text-white font-extrabold text-xs sm:text-[13px] tracking-[0.14em] uppercase select-none pl-0.5 drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
                      {member.jabatan}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

        </ScrollReveal>
      </section>

      {/* ============================================================ */}
      {/* BAGIAN 6: DOKUMEN ORGANISASI */}
      {/* Layout Persis Sesuai Gambar Referensi (AD/ART, BPPK, UU Pilka) */}
      {/* Menggunakan Warna & Style HIMASI yang Telah Ada */}
      {/* ============================================================ */}
      <section className="relative py-14 sm:py-20 px-4 sm:px-6 lg:px-12 bg-white w-full overflow-hidden content-auto">
        <ScrollReveal className="max-w-6xl mx-auto">
          
          {/* Header Dokumen Organisasi Sesuai Gambar Referensi */}
          <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
            <h2 className="text-3xl sm:text-4xl font-black text-[#00296E] tracking-tight">
              Dokumen Organisasi
            </h2>
          </div>

          {/* Grid Cards Sesuai Gambar Referensi (Animasi card-pop muncul bergantian) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-7 lg:gap-8 items-stretch">
            {dokumenList.map((doc, idx) => {
              return (
                <ScrollReveal
                  key={doc.id}
                  direction="card-pop"
                  delay={idx * 160}
                  className="h-full"
                >
                  <div
                    className="h-full group relative bg-white rounded-[24px] sm:rounded-[28px] border border-slate-200/90 hover:border-[#0094E0]/40 p-6 sm:p-8 flex flex-col justify-between shadow-xs hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300"
                  >
                    <div>
                      {/* Judul Dokumen */}
                      <h3 className="text-xl sm:text-2xl font-black text-[#00296E] tracking-tight">
                        {doc.judul}
                      </h3>

                      {/* Deskripsi Dokumen */}
                      <p className="text-slate-500 text-xs sm:text-sm mt-2 leading-relaxed">
                        {doc.deskripsi}
                      </p>

                      {doc.file_size && (
                        <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-[11px] font-semibold text-slate-500">
                          <FileText className="w-3 h-3 text-[#0094E0]" />
                          <span>PDF • {doc.file_size}</span>
                        </div>
                      )}
                    </div>

                    {/* Tombol Unduh Dokumen Sesuai Gambar Referensi */}
                    <div className="mt-8">
                      <button
                        type="button"
                        onClick={() => handleDownload(doc)}
                        className="w-full py-3 sm:py-3.5 px-4 rounded-xl font-bold text-sm text-white bg-[#00296E] hover:from-[#001F54] hover:to-[#003B96] transition-all shadow-md shadow-[#00296E]/20 hover:shadow-lg hover:shadow-[#00296E]/30 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
                      >
                        <DownloadSimple className="w-4 h-4" />
                        <span>Unduh Dokumen</span>
                      </button>
                    </div>
                  </div>
                </ScrollReveal>
              );
            })}
          </div>

        </ScrollReveal>
      </section>

      {/* Toast Notifikasi Unduh Berkas */}
      {downloadSuccess && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#00296E] text-white px-5 py-3.5 rounded-xl shadow-2xl flex items-center gap-3 border border-[#0094E0]/30 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <CheckCircle className="w-5 h-5 text-[#0094E0] shrink-0" weight="fill" />
          <span className="text-xs sm:text-sm font-semibold">{downloadSuccess}</span>
        </div>
      )}

      {/* ============================================================ */}
      {/* FOOTER KONSISTEN DENGAN SELURUH HALAMAN */}
      {/* ============================================================ */}
      <Footer />

    </div>
  );
}
