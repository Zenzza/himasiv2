"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Compass,
  FileText,
  Search,
  Download,
  Calendar,
  ArrowLeft,
  ChevronRight,
  Sparkles,
  HelpCircle,
  ExternalLink,
  BookOpen,
  Bell,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import Footer from "@/components/footer";

export default function InformasiPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  const announcements = [
    {
      id: 1,
      title: "Sosialisasi Pengisian KRS Online & Pembimbing Akademik Semester Genap 2025/2026",
      category: "Akademik",
      date: "14 Maret 2026",
      desc: "Panduan lengkap alur konsultasi dosen pembimbing akademik, batas maksimal SKS berdasarkan IPK, dan jadwal penutupan portal SIAKAD.",
      important: true,
      tag: "Penting",
    },
    {
      id: 2,
      title: "Pendaftaran Ujian Sidang Skripsi & Tugas Akhir Gelombang I Tahun 2026",
      category: "Skripsi / TA",
      date: "10 Maret 2026",
      desc: "Berkas persyaratan kelayakan naskah tugas akhir, surat bebas plagiarisme Turnitin (maksimal 20%), dan jadwal verifikasi berkas prodi.",
      important: false,
      tag: "Tugas Akhir",
    },
    {
      id: 3,
      title: "Program Magang Bersertifikat Industri & Studi Independen (MSIB) Batch 7",
      category: "Karir & Magang",
      date: "05 Maret 2026",
      desc: "Informasi rekomendasi surat pengantar prodi dan konversi 20 SKS untuk program magang teknologi di mitra BUMN dan startup terkemuka.",
      important: false,
      tag: "Karir",
    },
    {
      id: 4,
      title: "Jadwal Pelaksanaan Ujian Tengah Semester (UTS) Genap 2025/2026",
      category: "Akademik",
      date: "28 Februari 2026",
      desc: "Jadwal resmi, tata tertib ujian daring dan luring di laboratorium komputer, serta syarat kehadiran minimal 75%.",
      important: true,
      tag: "Ujian",
    },
  ];

  const documents = [
    {
      name: "Formulir Surat Dispensasi Kegiatan Mahasiswa",
      format: "PDF",
      size: "245 KB",
      category: "Administrasi",
      desc: "Format baku permohonan izin dispensasi perkuliahan untuk kegiatan organisasi dan lomba.",
    },
    {
      name: "Template Proposal & Laporan Pertanggungjawaban (LPJ)",
      format: "DOCX",
      size: "820 KB",
      category: "Organisasi",
      desc: "Format standar proposal kegiatan himpunan mahasiswa sesuai pedoman kemahasiswaan.",
    },
    {
      name: "Buku Pedoman Penulisan Skripsi & Kerja Praktik Sistem Informasi",
      format: "PDF",
      size: "2.4 MB",
      category: "Akademik",
      desc: "Pedoman tata tulis ilmiah, format kutipan IEEE, dan sistematika bab 1 sampai 5.",
    },
    {
      name: "Silabus & Rencana Pembelajaran Semester (RPS) Prodi SI",
      format: "ZIP",
      size: "4.1 MB",
      category: "Akademik",
      desc: "Rangkuman RPS kurikulum sistem informasi terbaru berbasis OBE.",
    },
  ];

  const faqs = [
    {
      q: "Bagaimana cara mengajukan surat dispensasi perkuliahan melalui HIMASI?",
      a: "Anda dapat mengunduh formulir dispensasi di menu Pusat Unduhan, mengisi data kegiatan dan mata kuliah yang terdampak, kemudian meminta paraf tanda tangan Ketua HIMASI sebelum diajukan ke Dosen Pengampu & Kaprodi.",
    },
    {
      q: "Kapan jadwal rutin klinik bimbingan koding dan tutorial akademik diselenggarakan?",
      a: "Divisi Akademik HIMASI mengadakan klinik koding setiap hari Sabtu pukul 09.00 - 12.00 WIB di Laboratorium Software Engineering atau via Google Meet menjelang minggu UTS/UAS.",
    },
    {
      q: "Bagaimana alur pendaftaran lomba nasional agar mendapat pendanaan dari prodi?",
      a: "Ajukan proposal delegasi lomba melalui Divisi Hublu/Akademik HIMASI paling lambat H-14 sebelum batas pendaftaran lomba untuk diverifikasi dan diteruskan ke Bagian Kemahasiswaan kampus.",
    },
  ];

  const filteredAnnouncements = announcements.filter((item) => {
    const matchCat = selectedCategory === "Semua" || item.category === selectedCategory;
    const matchSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.desc.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const handleDownload = (name: string) => {
    setDownloadSuccess(`Berkas "${name}" berhasil diunduh.`);
    setTimeout(() => setDownloadSuccess(null), 3500);
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-[#091e42]">
      {/* Top Banner */}
      <section className="relative w-full bg-[#00296E] text-white py-14 sm:py-20 px-4 sm:px-6 lg:px-12 overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#0094E0]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-sky-400/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative max-w-5xl mx-auto">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-white/80 hover:text-white mb-6 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span>Kembali ke Beranda</span>
          </Link>

          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[#0094E0] text-xs font-bold uppercase tracking-wider mb-4">
            <Compass className="w-4 h-4 text-sky-400" />
            <span className="text-white">Portal Layanan & Informasi Terpadu</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight mb-4">
            Pusat Informasi HIMASI
          </h1>

          <p className="text-slate-200 text-sm sm:text-base max-w-2xl leading-relaxed">
            Temukan pengumuman akademik terbaru, repositori unduhan berkas resmi kemahasiswaan, panduan perkuliahan, dan jadwal penting satu pintu.
          </p>

          {/* Search Box */}
          <div className="mt-8 max-w-xl relative">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari pengumuman, pedoman skripsi, berkas dispensasi..."
              className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white text-slate-900 placeholder:text-slate-400 shadow-xl focus:outline-none focus:ring-4 focus:ring-[#0094E0]/40 text-sm"
            />
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-12 sm:py-16 space-y-16">

        {/* Notifikasi Download Toast */}
        {downloadSuccess && (
          <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-emerald-600 text-white shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span className="text-xs sm:text-sm font-semibold">{downloadSuccess}</span>
          </div>
        )}

        {/* Pengumuman Terbaru */}
        <section>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-[#0094E0] uppercase tracking-wider mb-1">
                <Bell className="w-4 h-4" />
                <span>Pengumuman Terkini</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                Warta & Pengumuman Akademik
              </h2>
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap gap-2">
              {["Semua", "Akademik", "Skripsi / TA", "Karir & Magang"].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    selectedCategory === cat
                      ? "bg-[#00296E] text-white shadow-sm"
                      : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredAnnouncements.map((item) => (
              <div
                key={item.id}
                className="p-6 rounded-3xl bg-white border border-slate-200 hover:border-[#0094E0]/60 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-[#0094E0]/10 text-[#00296E]">
                      {item.tag}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{item.date}</span>
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-base mb-2 group-hover:text-[#00296E] transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {item.desc}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] font-medium text-slate-400">
                    Kategori: {item.category}
                  </span>
                  <Link
                    href="/berita"
                    className="text-xs font-bold text-[#0094E0] hover:text-[#00296E] inline-flex items-center gap-1"
                  >
                    <span>Baca Detail</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Pusat Unduhan Berkas */}
        <section id="unduhan" className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-bold text-[#0094E0] uppercase tracking-wider mb-2">
            <FileText className="w-4 h-4" />
            <span>Dokumen & Template</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">
            Pusat Unduhan Berkas Resmi
          </h2>
          <p className="text-xs text-slate-500 mb-6">
            Unduh formulir administrasi dan pedoman akademik resmi dalam format PDF dan Word siap pakai.
          </p>

          <div className="divide-y divide-slate-100">
            {documents.map((doc, idx) => (
              <div
                key={idx}
                className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 p-2 rounded-xl transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#0094E0]/10 text-[#00296E] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    {doc.format}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                      {doc.name}
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {doc.desc}
                    </p>
                    <span className="text-[10px] text-slate-400 mt-1 inline-block">
                      Kategori: {doc.category} • Ukuran: {doc.size}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleDownload(doc.name)}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#00296E] hover:bg-[#001e52] text-white text-xs font-bold shrink-0 transition-colors shadow-xs"
                >
                  <Download className="w-3.5 h-3.5 text-[#0094E0]" />
                  <span>Unduh File</span>
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Tanya Jawab (FAQ) */}
        <section>
          <div className="flex items-center gap-2 text-xs font-bold text-[#0094E0] uppercase tracking-wider mb-2">
            <HelpCircle className="w-4 h-4" />
            <span>Pertanyaan Umum</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-6">
            FAQ Mahasiswa Sistem Informasi
          </h2>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div key={idx} className="p-6 rounded-2xl bg-white border border-slate-200">
                <h4 className="font-bold text-slate-900 text-sm sm:text-base mb-2">
                  {faq.q}
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Bantuan Tambahan */}
        <section className="p-8 rounded-3xl bg-gradient-to-r from-[#00296E] to-[#0094E0] text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
          <div>
            <h3 className="text-xl sm:text-2xl font-bold">
              Butuh Informasi yang Belum Tercantum?
            </h3>
            <p className="text-xs sm:text-sm text-sky-100 mt-1 max-w-xl">
              Hubungi layanan helpdesk Divisi Kominfo HIMASI atau sampaikan pertanyaan langsung melalui kanal aspirasi kami.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/profil#kontak"
              className="px-5 py-2.5 rounded-xl bg-white text-[#00296E] text-xs font-bold hover:bg-slate-100 transition-colors shadow-md"
            >
              Hubungi Pengurus
            </Link>
            <Link
              href="/apresiasi"
              className="px-5 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition-colors"
            >
              Kirim Pertanyaan
            </Link>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
