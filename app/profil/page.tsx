"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Calendar,
  Users,
  Award,
  FileText,
  BookOpen,
  Gavel,
  Download,
  CheckCircle2
} from "lucide-react";
import Footer from "@/components/footer";
import ScrollReveal from "@/components/scroll-reveal";

// ===================================================================
// DATA SINGKAT KABINET (PERSIS SESUAI HOMEPAGE)
// ===================================================================
const KABINET_METRICS = [
  {
    number: "",
    icon: Calendar,
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
    icon: Award,
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
    text: "Menyelenggarakan kegiatan akademik dan non-akademik yang mendukung pengembangan ilmu pengetahuan dan keterampilan.",
    highlight: false,
  },
  {
    no: "02",
    text: "Meningkatkan kualitas sumber daya mahasiswa melalui pembinaan, pelatihan, dan kolaborasi.",
    highlight: false,
  },
  {
    no: "03",
    text: "Memperkuat jejaring dan kemitraan dengan berbagai pihak.",
    highlight: false,
  },
  {
    no: "04",
    text: "Menumbuhkan jiwa kepemimpinan, kreativitas, dan kepedulian sosial.",
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
// DAFTAR 6 DIVISI KABINET & DATA PENGURUS
// PEMBINA, BPH, MEDKOMINFO, HUMAS, BISNIS KREATIF, PENASIHAT
// ===================================================================
type Member = {
  id: number;
  name: string;
  role: string;
  image: string;
};

const DIVISI_KEYS = [
  "PEMBINA",
  "BPH",
  "MEDKOMINFO",
  "HUMAS",
  "BISNIS KREATIF",
  "PENASIHAT",
] as const;

type DivisiKey = (typeof DIVISI_KEYS)[number];

const DIVISI_DATA: Record<
  DivisiKey,
  { title: string; subtitle: string; members: Member[] }
> = {
  PEMBINA: {
    title: "Pembina HIMASI",
    subtitle:
      "Dosen penasihat dan pengarah kebijakan kemahasiswaan Program Studi Sistem Informasi ISB Atma Luhur.",
    members: [
      {
        id: 101,
        name: "DOSEN PEMBINA I",
        role: "PEMBINA UTAMA HIMASI",
        image:
          "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=800&auto=format&fit=crop",
      },
      {
        id: 102,
        name: "DOSEN PEMBINA II",
        role: "KAPRODI SISTEM INFORMASI",
        image:
          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800&auto=format&fit=crop",
      },
    ],
  },
  BPH: {
    title: "Badan Pengurus Harian (BPH)",
    subtitle:
      "Pusat kepemimpinan eksekutif, koordinasi internal, tata kelola administrasi, dan perbendaharaan organisasi.",
    members: [
      {
        id: 201,
        name: "JORDI VENZEN",
        role: "KETUA UMUM HIMASI",
        image:
          "/DSC01203.png",
      },
      {
        id: 202,
        name: "MUHAMMAD FADHIL",
        role: "WAKIL KETUA UMUM",
        image:
          "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=800&auto=format&fit=crop",
      },
      {
        id: 203,
        name: "ANINDYA PUTRI",
        role: "SEKRETARIS UMUM",
        image:
          "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=800&auto=format&fit=crop",
      },
      {
        id: 204,
        name: "ZAHRA SALSABILA",
        role: "BENDAHARA UMUM",
        image:
          "https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=800&auto=format&fit=crop",
      },
    ],
  },
  MEDKOMINFO: {
    title: "Divisi Medkominfo",
    subtitle:
      "Media Komunikasi & Informasi: publikasi visual, konten kreatif, pengelolaan web, dan aftermovie kegiatan.",
    members: [
      {
        id: 301,
        name: "LEYSA REGITA PARHUSIP",
        role: "KORD. DIVISI MEDKOMINFO",
        image:
          "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=800&auto=format&fit=crop",
      },
      {
        id: 302,
        name: "MUHAMMAD EVAN ELUA",
        role: "ANGGOTA MEDKOMINFO",
        image:
          "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=800&auto=format&fit=crop",
      },
      {
        id: 303,
        name: "BEATRIKS MARIA",
        role: "ANGGOTA MEDKOMINFO",
        image:
          "https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=800&auto=format&fit=crop",
      },
      {
        id: 304,
        name: "DHIFA ARYA PRATAMA",
        role: "ANGGOTA MEDKOMINFO",
        image:
          "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=800&auto=format&fit=crop",
      },
    ],
  },
  HUMAS: {
    title: "Divisi Humas",
    subtitle:
      "Hubungan Masyarakat: menjalin kemitraan institusi, komunikasi eksternal, jejaring ormawa, dan hubungan alumni.",
    members: [
      {
        id: 401,
        name: "NABILA SYAHRANI",
        role: "KORD. DIVISI HUMAS",
        image:
          "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=800&auto=format&fit=crop",
      },
      {
        id: 402,
        name: "FARHAN RAMADHAN",
        role: "ANGGOTA HUMAS",
        image:
          "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=800&auto=format&fit=crop",
      },
      {
        id: 403,
        name: "SITI RAHMAWATI",
        role: "ANGGOTA HUMAS",
        image:
          "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=800&auto=format&fit=crop",
      },
      {
        id: 404,
        name: "ALDO KURNIAWAN",
        role: "ANGGOTA HUMAS",
        image:
          "https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?q=80&w=800&auto=format&fit=crop",
      },
    ],
  },
  "BISNIS KREATIF": {
    title: "Divisi Bisnis Kreatif",
    subtitle:
      "Pengembangan kewirausahaan mandiri, penyediaan merchandise resmi HIMASI, dan kemitraan pendanaan kreatif.",
    members: [
      {
        id: 501,
        name: "RIAN HIDAYAT",
        role: "KORD. DIVISI BISNIS KREATIF",
        image:
          "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?q=80&w=800&auto=format&fit=crop",
      },
      {
        id: 502,
        name: "AULIA RAHMA",
        role: "ANGGOTA BISNIS KREATIF",
        image:
          "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=800&auto=format&fit=crop",
      },
      {
        id: 503,
        name: "BAGAS SAPUTRA",
        role: "ANGGOTA BISNIS KREATIF",
        image:
          "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?q=80&w=800&auto=format&fit=crop",
      },
      {
        id: 504,
        name: "CITRA DEWI",
        role: "ANGGOTA BISNIS KREATIF",
        image:
          "https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=800&auto=format&fit=crop",
      },
    ],
  },
  PENASIHAT: {
    title: "Penasihat Organisasi",
    subtitle:
      "Dewan Penasihat Organisasi dan Demisioner yang mengawal kesinambungan nilai serta tradisi luhur HIMASI.",
    members: [
      {
        id: 601,
        name: "DEMISIONER KETUA UMUM",
        role: "DEWAN PENASIHAT ORGANISASI",
        image:
          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800&auto=format&fit=crop",
      },
      {
        id: 602,
        name: "ALUMNI BERPRESTASI SI",
        role: "PENASIHAT ALUMNI PROFESIONAL",
        image:
          "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=800&auto=format&fit=crop",
      },
    ],
  },
};

// ===================================================================
// DOKUMEN ORGANISASI (SESUAI REFERENSI GAMBAR)
// ===================================================================
const DOKUMEN_ORGANISASI = [
  {
    id: 1,
    title: "AD HIMASI",
    desc: "Anggaran Dasar HIMASI ISB Atma Luhur",
    icon: FileText,
    fileName: "AD-ART-HIMASI-AtmaLuhur.pdf",
  },
  {
    id: 2,
    title: "ART HIMASI",
    desc: "Anggaran Rumah Tangga HIMASI ISB Atma Luhur",
    icon: BookOpen,
    fileName: "BPPK-Pedoman-Pengurus-HIMASI.pdf",
  },
  {
    id: 3,
    title: "SK Kepengurusan",
    desc: "SK Kepengurusan HIMASI ISB Atma Luhur",
    icon: Gavel,
    fileName: "SK-Kepengurusan-HIMASI-AtmaLuhur.pdf",
  },
];

export default function ProfilPage() {
  const [hoveredLogoElement, setHoveredLogoElement] = useState<number | null>(null);
  const [activeDivisi, setActiveDivisi] = useState<DivisiKey>("BPH");
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  const handleDownload = (doc: (typeof DOKUMEN_ORGANISASI)[number]) => {
    const content = `Dokumen Resmi HIMASI ISB Atma Luhur\n\nJudul: ${doc.title}\nKeterangan: ${doc.desc}\nKabinet: REKSABUDAYA\nTahun Kepengurusan: 2025/2026\nInstitut Sains dan Bisnis Atma Luhur Pangkalpinang\n`;
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = doc.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setDownloadSuccess(`Dokumen "${doc.title}" berhasil diunduh!`);
    setTimeout(() => {
      setDownloadSuccess(null);
    }, 3500);
  };

  const activeElement =
    hoveredLogoElement !== null ? KABINET_LOGO_ELEMENTS[hoveredLogoElement] : null;
  const targetPin = activeElement?.primaryPin;
  const pinX = targetPin ? 9 + 0.82 * targetPin.left : 50;
  const pinY = targetPin ? 9 + 0.82 * targetPin.top : 50;

  const currentDivisiData = DIVISI_DATA[activeDivisi];

  return (
    <div className="flex flex-col w-full bg-white text-[#091e42] min-h-screen">
      
      {/* ============================================================ */}
      {/* SECTION HEADER: PERSIS SESUAI STYLE PAGE BERITA */}
      {/* Breadcrumb HOME / KABINET, Judul Tengah Besar, dan Subjudul */}
      {/* ============================================================ */}
      <section className="relative pt-10 sm:pt-14 pb-8 sm:pb-12 px-4 sm:px-6 lg:px-12 bg-white w-full">
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
              Mengenal lebih dekat Kabinet REKSABUDAYA HIMASI ISB Atma Luhur: landasan filosofis, arah kepemimpinan, visi misi strategis, dan struktur divisi kerja.
            </p>
          </div>
        </ScrollReveal>
      </section>

      {/* ============================================================ */}
      {/* BAGIAN 1: DESKRIPSI KABINET REKSABUDAYA */}
      {/* Showcase Profil, Makna Nama, dan Semangat Kepengurusan */}
      {/* ============================================================ */}
      <section className="relative py-12 sm:py-16 px-4 sm:px-6 lg:px-12 bg-gradient-to-b from-white via-[#f7faff] to-white w-full">
        <ScrollReveal className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            
            {/* Sisi Kiri: Foto Kepengurusan & Kartu Visual Kabinet */}
            <div className="lg:col-span-5 relative flex flex-col items-center justify-center">
              {/* Ambient Glow */}
              <div className="absolute inset-0 bg-[#0094E0]/15 rounded-full blur-3xl -z-10 pointer-events-none" />
              
              <div className="relative w-full rounded-[30px] sm:rounded-[36px] bg-white p-3 sm:p-4 shadow-[0_20px_50px_rgba(0,41,110,0.12)] border border-slate-100">
                <div className="aspect-[4/3] w-full rounded-[24px] sm:rounded-[28px] overflow-hidden bg-slate-100 relative group">
                  <img
                    src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=1200&auto=format&fit=crop"
                    alt="Kepengurusan Kabinet REKSABUDAYA HIMASI"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#002257]/90 via-[#002257]/20 to-transparent flex flex-col justify-end p-5 text-white">
                    <span className="text-[11px] font-bold tracking-wider uppercase text-sky-300">
                      Periode 2025 / 2026
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
      <section className="relative py-12 sm:py-16 px-4 sm:px-6 lg:px-12 bg-white w-full">
        <ScrollReveal className="relative max-w-6xl mx-auto">
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 items-stretch">
            
            {/* Kolom Kiri: Header 'HIMASI dalam Angka' */}
            <div className="sm:col-span-2 lg:col-span-1 flex flex-col justify-center py-2 pr-2">
              <div className="flex items-center gap-2 text-3xl font-extrabold text-[#00296E] uppercase">
                <span>REKSABUDAYA</span>
              </div>
              <h3 className="text-2xl sm:text-3xl lg:text-[28px] xl:text-2xl font-bold tracking-tight text-[#00296E] leading-tight">
                dalam <span className="text-[#0094E0]">Angka</span>
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-2.5 leading-relaxed font-normal">
                Lebih dari sekadar angka, ini adalah tentang perjalanan dan kontribusi.
              </p>
            </div>

            {/* Kolom Kanan: 3 Metric Cards (Warna & Style Persis Homepage) */}
            {KABINET_METRICS.map((card, idx) => {
              const IconComponent = card.icon;
              return (
                <div
                  key={idx}
                  className="relative rounded-2xl bg-[#00296E] border border-white/10 p-5 sm:p-6 flex flex-col justify-between shadow-xl hover:-translate-y-1 hover:border-[#0094E0]/40 transition-all duration-300 group"
                >
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
              );
            })}

          </div>

        </ScrollReveal>
      </section>

      {/* ============================================================ */}
      {/* BAGIAN 3: VISI & MISI KABINET (PERSIS SESUAI HOMEPAGE) */}
      {/* VISI Trapesium (Kiri) & MISI 4 Pill (Kanan) */}
      {/* ============================================================ */}
      <section className="relative py-12 sm:py-16 px-4 sm:px-6 lg:px-12 bg-gradient-to-b from-white via-[#f7faff] to-white w-full">
        <ScrollReveal className="max-w-6xl mx-auto">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
            
            {/* Kolom Kiri: VISI (Bentuk Trapesium Presisi Sesuai Homepage) */}
            <div className="lg:col-span-5 relative flex flex-col justify-between p-7 sm:p-9 lg:p-10 min-h-[380px] drop-shadow-2xl group overflow-visible">
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
                <div>
                  {/* Header: ── VISI */}
                  <div className="flex items-center gap-2 text-xl font-bold tracking-[0.25em] text-[#FFFFFF] uppercase mb-4 sm:mb-6">
                    <span>VISI KABINET</span>
                  </div>

                  {/* Content */}
                  <div className="pr-6 sm:pr-12 lg:pr-16">
                    <p className="text-white text-base sm:text-lg lg:text-xl font-medium leading-relaxed tracking-normal">
                      Menjadi lembaga keilmuan yang <strong className="font-extrabold text-white">unggul</strong> dalam pengembangan potensi mahasiswa Sistem Informasi yang berdaya saing, berintegritas, dan berkontribusi bagi masyarakat.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Kolom Kanan: MISI (4 Pill Horizontal Sesuai Homepage) */}
            <div className="lg:col-span-7 flex flex-col justify-center py-2">
              {/* Header: ── MISI */}
              <div className="flex items-center gap-2 text-xl font-bold tracking-[0.25em] text-[#00296E] uppercase mb-4 sm:mb-5">
                <span>MISI KABINET</span>
              </div>

              {/* 4 Misi Items with Numbered Circle Badges */}
              <div className="space-y-3 sm:space-y-3.5">
                {MISI_ITEMS.map((misi, idx) => (
                  <div key={idx} className="flex items-center gap-3 sm:gap-4 group">
                    {/* Circle Badge 01, 02, 03, 04 */}
                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#00296E] text-white font-bold text-xs sm:text-sm flex items-center justify-center shrink-0 shadow-md transition-all duration-200">
                      {misi.no}
                    </div>

                    {/* Pill Text Container */}
                    <div className="flex-1 py-3 px-4 sm:px-5 rounded-2xl sm:rounded-full bg-slate-50 border border-slate-100 transition-all duration-200">
                      <p className={`text-xs sm:text-sm leading-relaxed ${misi.highlight ? "text-[#0094E0] font-semibold" : "text-slate-700 font-medium"}`}>
                        {misi.text}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </ScrollReveal>
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
      <section className="relative py-14 sm:py-22 px-4 sm:px-6 lg:px-12 bg-gradient-to-b from-white via-[#f7faff] to-white w-full">
        <ScrollReveal className="max-w-6xl mx-auto">
          
          <div className="text-center mb-10 sm:mb-12">
            <h2 className="text-xl sm:text-4xl font-black text-[#00296E] tracking-tight">
              DIVISI KABINET REKSABUDAYA
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
              {currentDivisiData.subtitle}
            </p>
          </div>

          {/* Grid Card Pengurus: Menggunakan Card Pengurus Persis Sesuai Homepage & Gambar Referensi */}
          <div
            className={
              currentDivisiData.members.length <= 2
                ? "grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 max-w-2xl mx-auto"
                : "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6"
            }
          >
            {currentDivisiData.members.map((member) => (
              <div
                key={member.id}
                className="relative aspect-[3/4] sm:aspect-[3/4.1] rounded-[24px] sm:rounded-[28px] bg-white border border-slate-200/90 hover:border-slate-300 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 overflow-hidden group/card select-none flex flex-col justify-end"
              >
                {/* Foto Pengurus Full Tanpa Gradasi Sesuai Permintaan */}
                <div className="absolute inset-0 bg-slate-100 overflow-hidden">
                  <img
                    src={member.image}
                    alt={member.name}
                    draggable={false}
                    className="w-full h-full object-cover object-top group-hover/card:scale-105 transition-transform duration-500 pointer-events-none"
                  />
                </div>

                {/* Konten Bawah: Banner Biru untuk Nama + Subtitle Jabatan Persis Sesuai Gambar Referensi & Homepage */}
                <div className="relative z-10 p-4 sm:p-5 pb-5 sm:pb-6 flex flex-col items-start">
                  <div className="inline-block px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xs bg-gradient-to-r from-[#003B96] via-[#0055D4] to-[#FFFFFF]/20 max-w-full">
                    <h3 className="text-white font-black text-sm sm:text-base lg:text-[17px] xl:text-[18px] tracking-wider uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.55)] leading-tight select-none whitespace-nowrap">
                      {member.name}
                    </h3>
                  </div>
                  <p className="mt-1.5 sm:mt-2 text-white font-extrabold text-xs sm:text-[13px] tracking-[0.14em] uppercase select-none pl-0.5 drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
                    {member.role}
                  </p>
                </div>
              </div>
            ))}
          </div>

        </ScrollReveal>
      </section>

      {/* ============================================================ */}
      {/* BAGIAN 6: DOKUMEN ORGANISASI */}
      {/* Layout Persis Sesuai Gambar Referensi (AD/ART, BPPK, UU Pilka) */}
      {/* Menggunakan Warna & Style HIMASI yang Telah Ada */}
      {/* ============================================================ */}
      <section className="relative py-14 sm:py-20 px-4 sm:px-6 lg:px-12 bg-white w-full">
        <ScrollReveal className="max-w-6xl mx-auto">
          
          {/* Header Dokumen Organisasi Sesuai Gambar Referensi */}
          <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
            <h2 className="text-3xl sm:text-4xl font-black text-[#00296E] tracking-tight">
              Dokumen Organisasi
            </h2>
          </div>

          {/* Grid 3 Cards Sesuai Gambar Referensi */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-7 lg:gap-8 items-stretch">
            {DOKUMEN_ORGANISASI.map((doc) => {
              const Icon = doc.icon;
              return (
                <div
                  key={doc.id}
                  className="group relative bg-white rounded-[24px] sm:rounded-[28px] border border-slate-200/90 hover:border-[#0094E0]/40 p-6 sm:p-8 flex flex-col justify-between shadow-xs hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300"
                >
                  <div>

                    {/* Judul Dokumen */}
                    <h3 className="text-xl sm:text-2xl font-black text-[#00296E] tracking-tight">
                      {doc.title}
                    </h3>

                    {/* Deskripsi Dokumen */}
                    <p className="text-slate-500 text-xs sm:text-sm mt-2 leading-relaxed">
                      {doc.desc}
                    </p>
                  </div>

                  {/* Tombol Unduh Dokumen Sesuai Gambar Referensi */}
                  <div className="mt-8">
                    <button
                      type="button"
                      onClick={() => handleDownload(doc)}
                      className="w-full py-3 sm:py-3.5 px-4 rounded-xl font-bold text-sm text-white bg-[#00296E] hover:from-[#001F54] hover:to-[#003B96] transition-all shadow-md shadow-[#00296E]/20 hover:shadow-lg hover:shadow-[#00296E]/30 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
                    >
                      <Download className="w-4 h-4" />
                      <span>Unduh Dokumen</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

        </ScrollReveal>
      </section>

      {/* Toast Notifikasi Unduh Berkas */}
      {downloadSuccess && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#00296E] text-white px-5 py-3.5 rounded-xl shadow-2xl flex items-center gap-3 border border-[#0094E0]/30 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <CheckCircle2 className="w-5 h-5 text-[#0094E0] shrink-0" />
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
