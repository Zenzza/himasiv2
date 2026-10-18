"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Users,
  Layers,
  FileDown,
  Handshake,
  CheckCircle2,
  Calendar,
  Search,
  Download,
  Mail,
  Phone,
  MapPin,
  ExternalLink,
  ChevronRight,
  Filter,
  Send,
  Sparkles,
  Building,
  GraduationCap
} from "lucide-react";

export default function ProfilPage() {
  const [activeTab, setActiveTab] = useState<"struktur" | "proker" | "unduhan" | "kontak">("struktur");

  // Proker Filter State
  const [selectedDivisi, setSelectedDivisi] = useState("Semua");
  const [selectedStatus, setSelectedStatus] = useState("Semua");

  // Unduhan Search & Category State
  const [searchDoc, setSearchDoc] = useState("");
  const [selectedDocCategory, setSelectedDocCategory] = useState("Semua");
  const [downloadSuccessMessage, setDownloadSuccessMessage] = useState<string | null>(null);

  // Form Kemitraan State
  const [mitraForm, setMitraForm] = useState({
    instansi: "",
    pic: "",
    email: "",
    jenis: "Sponsorship Event",
    pesan: "",
  });
  const [mitraSubmitted, setMitraSubmitted] = useState(false);

  // Proker Mock Data
  const prokerList = [
    {
      title: "HIMASI Fest & Seminar Nasional Teknologi 2026",
      divisi: "Hublu & Kominfo",
      status: "Akan Datang",
      date: "14 - 16 November 2026",
      desc: "Festival tahunan sistem informasi menghadirkan pameran karya teknologi mahasiswa, kompetisi nasional, dan seminar pakar AI & Cloud Architecture.",
      target: "Mahasiswa SI se-Indonesia & Umum",
    },
    {
      title: "Bootcamp Intensive: Fullstack Web Development",
      divisi: "Akademik",
      status: "Sedang Berjalan",
      date: "Setiap Sabtu (Semester Genap)",
      desc: "Pelatihan koding intensif berbasis proyek nyata menggunakan Next.js, TypeScript, dan database relational untuk menyiapkan portofolio magang.",
      target: "Mahasiswa SI Angkatan 2024 & 2025",
    },
    {
      title: "Studi Ekskursi & Company Visit: Unicorn Tech Jakarta",
      divisi: "Hublu",
      status: "Akan Datang",
      date: "22 September 2026",
      desc: "Kunjungan langsung ke kantor industri teknologi terkemuka untuk memahami arsitektur sistem enterprise dan budaya kerja engineer modern.",
      target: "Mahasiswa SI Tingkat Akhir & Pengurus",
    },
    {
      title: "Klinik & Mentoring Mata Kuliah Pemrograman",
      divisi: "Akademik",
      status: "Sedang Berjalan",
      date: "Minggu Menjelang UTS/UAS",
      desc: "Bimbingan belajar sejawat (*peer-to-peer mentoring*) untuk mata kuliah Algoritma, Basis Data, dan Rekayasa Perangkat Lunak.",
      target: "Seluruh Mahasiswa Aktif SI",
    },
    {
      title: "Malam Keakraban (Makrab) & Latihan Kepemimpinan",
      divisi: "PSDM",
      status: "Selesai",
      date: "18 - 19 Januari 2026",
      desc: "Pembekalan kepemimpinan, team building, dan peresmian penerimaan mahasiswa baru angkatan 2025 ke dalam keluarga besar HIMASI.",
      target: "Mahasiswa Baru Angkatan 2025",
    },
    {
      title: "SI Creative Content & Podcast Bulanan 'InfoTek'",
      divisi: "Kominfo",
      status: "Sedang Berjalan",
      date: "Rilis Berkala di Spotify & YouTube",
      desc: "Media edukasi dan hiburan yang mengulas topik tren kecerdasan buatan, tips lolos magang BUMN/Startup, serta wawancara alumni inspiratif.",
      target: "Civitas Akademika & Netizen",
    },
  ];

  // Filtered Proker
  const filteredProker = useMemo(() => {
    return prokerList.filter((item) => {
      const matchDiv = selectedDivisi === "Semua" || item.divisi.includes(selectedDivisi);
      const matchStatus = selectedStatus === "Semua" || item.status === selectedStatus;
      return matchDiv && matchStatus;
    });
  }, [selectedDivisi, selectedStatus]);

  // Documents Mock Data
  const documents = [
    {
      name: "Surat Permohonan Dispensasi Kuliah",
      category: "Administrasi & Surat",
      format: "DOCX",
      size: "42 KB",
      updated: "10 Feb 2026",
    },
    {
      name: "Template Proposal Pengajuan Delegasi Lomba",
      category: "Administrasi & Surat",
      format: "DOCX",
      size: "115 KB",
      updated: "18 Jan 2026",
    },
    {
      name: "Buku Pedoman Kerja Praktik (KP) & Magang SI",
      category: "Panduan Akademik",
      format: "PDF",
      size: "2.4 MB",
      updated: "02 Mar 2026",
    },
    {
      name: "Anggaran Dasar & Anggaran Rumah Tangga (AD/ART) HIMASI",
      category: "Keorganisasian",
      format: "PDF",
      size: "1.8 MB",
      updated: "12 Des 2025",
    },
    {
      name: "Roadmap Kurikulum & Silabus Konsentrasi SI 2026",
      category: "Panduan Akademik",
      format: "PDF",
      size: "3.2 MB",
      updated: "20 Jan 2026",
    },
    {
      name: "Format Baku Laporan Pertanggungjawaban (LPJ) Kegiatan",
      category: "Keorganisasian",
      format: "ZIP",
      size: "520 KB",
      updated: "15 Jan 2026",
    },
  ];

  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      const matchSearch = doc.name.toLowerCase().includes(searchDoc.toLowerCase());
      const matchCat = selectedDocCategory === "Semua" || doc.category === selectedDocCategory;
      return matchSearch && matchCat;
    });
  }, [searchDoc, selectedDocCategory]);

  const handleDownload = (docName: string) => {
    setDownloadSuccessMessage(`Mengunduh berkas: "${docName}"...`);
    setTimeout(() => {
      setDownloadSuccessMessage(null);
    }, 3500);
  };

  const handleMitraSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMitraSubmitted(true);
  };

  return (
    <div className="flex flex-col w-full py-8 px-4 sm:px-6 max-w-7xl mx-auto">
      
      {/* Top Banner & Header */}
      <section className="relative rounded-[2.5rem] bg-gradient-to-r from-[#0094E0] via-[#0070c0] to-[#00296E] p-8 sm:p-14 text-white shadow-xl shadow-sky-500/10 overflow-hidden mb-8">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold uppercase tracking-wider mb-4 border border-white/30">
            <Sparkles className="w-3.5 h-3.5 text-sky-200" />
            <span>Pusat Kelembagaan & Operasional</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
            Profil & Hub Informasi HIMASI
          </h1>
          <p className="mt-3 text-sm sm:text-base text-sky-100 font-normal leading-relaxed">
            Menyatukan struktur organisasi, transparansi program kerja tahunan, repositori unduhan dokumen resmi, serta kanal kemitraan strategis dalam satu ruang terpadu.
          </p>

          {/* Quick Sub-Navigation Capsule Bar */}
          <div className="mt-8 flex flex-wrap gap-2">
            {[
              { id: "struktur", label: "Struktur Organisasi", icon: Users },
              { id: "proker", label: "Program Kerja & Agenda", icon: Layers },
              { id: "unduhan", label: "Pusat Unduhan Dokumen", icon: FileDown },
              { id: "kontak", label: "Kontak & Kemitraan", icon: Handshake },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.id as typeof activeTab);
                    const el = document.getElementById(tab.id);
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all backdrop-blur-md ${
                    isActive
                      ? "bg-white text-[#00296E] shadow-md shadow-black/10 scale-105"
                      : "bg-white/15 text-white hover:bg-white/25 border border-white/20"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* SECTION 1: Struktur Organisasi */}
      <section id="struktur" className="py-10 scroll-mt-24">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#0094E0] mb-1">
              <Users className="w-3.5 h-3.5" />
              <span>Kabinet Sinergi & Integritas</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              Struktur Kepengurusan HIMASI
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md">
            Dipimpin oleh mahasiswa berdedikasi tinggi untuk memajukan potensi keilmuan dan kesejahteraan mahasiswa Sistem Informasi.
          </p>
        </div>

        {/* Visi & Misi Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <div className="p-6 rounded-3xl bg-white dark:bg-[#00173d]/60 border border-slate-200/90 dark:border-white/10 shadow-sm">
            <h3 className="text-lg font-bold text-[#00296E] dark:text-sky-300 mb-2 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#0094E0]" />
              Visi Himpunan
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Mewujudkan HIMASI sebagai ormawa yang inklusif, adaptif terhadap percepatan teknologi global, serta unggul dalam melahirkan inovator Sistem Informasi yang berintegritas dan berdaya saing internasional.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-[#00173d]/60 border border-slate-200/90 dark:border-white/10 shadow-sm">
            <h3 className="text-lg font-bold text-[#00296E] dark:text-sky-300 mb-2 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#0094E0]" />
              Misi Strategis
            </h3>
            <ul className="text-sm text-slate-600 dark:text-slate-300 space-y-1.5 list-disc list-inside">
              <li>Membangun iklim akademik yang kolaboratif dan suportif bagi seluruh mahasiswa.</li>
              <li>Menjadi jembatan advokasi yang tanggap, transparan, dan proaktif.</li>
              <li>Memperluas jejaring kemitraan strategis dengan alumni, industri teknologi, dan ormawa eksternal.</li>
            </ul>
          </div>
        </div>

        {/* Badan Pengurus Harian (BPH) */}
        <div className="mb-6">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4">
            Badan Pengurus Harian (BPH)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { role: "Ketua Himpunan", name: "Muhammad Fadhil", batch: "2023", major: "Sistem Informasi Enterprise" },
              { role: "Wakil Ketua", name: "Anindya Putri", batch: "2023", major: "Data Analytics & AI" },
              { role: "Sekretaris Umum", name: "Zahra Salsabila", batch: "2024", major: "Information Security" },
              { role: "Bendahara Umum", name: "Dimas Arya", batch: "2024", major: "Digital Business Technology" },
            ].map((leader, i) => (
              <div
                key={i}
                className="rounded-2xl bg-white dark:bg-[#00173d]/50 border border-slate-200/80 dark:border-white/10 p-5 shadow-sm hover:shadow-md transition-shadow text-center"
              >
                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#0094E0] to-[#00296E] mx-auto flex items-center justify-center text-white font-bold text-xl mb-3 shadow-md">
                  {leader.name.split(" ").map(n => n[0]).join("")}
                </div>
                <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#0094E0]/15 text-[#00296E] dark:text-sky-300 text-[11px] font-semibold mb-1">
                  {leader.role}
                </span>
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  {leader.name}
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">Angkatan {leader.batch} &bull; {leader.major}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Divisi - Divisi HIMASI */}
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4">
            Divisi Kerja Operasional
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { name: "Divisi Akademik & Keilmuan", focus: "Klinik koding, modul kuliah, bimbingan sertifikasi, mentoring UTS/UAS" },
              { name: "Divisi Komunikasi & Informasi (Kominfo)", focus: "Pengelolaan web portal, konten podcast, media sosial & publikasi warta" },
              { name: "Divisi Pengembangan Sumber Daya Mahasiswa (PSDM)", focus: "Kaderisasi, welcoming maba, Makrab, & pelatihan kepemimpinan" },
              { name: "Divisi Hubungan Luar (Hublu)", focus: "Studi banding ormawa, kunjungan industri teknologi, & relasi alumni" },
              { name: "Divisi Dana & Usaha (Danus)", focus: "Merchandise resmi HIMASI, kemitraan sponsorship, & kewirausahaan mahasiswa" },
              { name: "Divisi Advokasi & Kesejahteraan Mahasiswa", focus: "Kanal aspirasi, pendampingan kendala UKT, & fasilitas perkuliahan" },
            ].map((div, i) => (
              <div
                key={i}
                className="rounded-2xl bg-slate-50/80 dark:bg-[#00173d]/30 border border-slate-200/60 dark:border-white/5 p-4"
              >
                <h5 className="text-sm font-bold text-[#00296E] dark:text-sky-300 mb-1">
                  {div.name}
                </h5>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {div.focus}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <hr className="my-10 border-slate-200/80 dark:border-white/10" />

      {/* SECTION 2: Program Kerja & Agenda */}
      <section id="proker" className="py-10 scroll-mt-24">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#0094E0] mb-1">
              <Layers className="w-3.5 h-3.5" />
              <span>Program Kerja & Agenda</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              Linimasa & Direktori Agenda Kepengurusan
            </h2>
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap gap-2">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="text-xs font-semibold px-3 py-2 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#00173d] text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0094E0]"
            >
              <option value="Semua">Semua Status</option>
              <option value="Akan Datang">Akan Datang</option>
              <option value="Sedang Berjalan">Sedang Berjalan</option>
              <option value="Selesai">Selesai</option>
            </select>
          </div>
        </div>

        {/* Proker Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProker.map((proker, idx) => (
            <div
              key={idx}
              className="rounded-3xl bg-white dark:bg-[#00173d]/60 border border-slate-200/90 dark:border-white/10 p-6 shadow-sm hover:shadow-xl hover:border-[#0094E0]/40 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#0094E0]/15 text-[#00296E] dark:text-sky-300">
                    {proker.divisi}
                  </span>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      proker.status === "Akan Datang"
                        ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
                        : proker.status === "Sedang Berjalan"
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 animate-pulse"
                        : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                    }`}
                  >
                    {proker.status}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 leading-snug">
                  {proker.title}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
                  {proker.desc}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-white/5 flex flex-col gap-1.5 text-[11px] text-slate-500">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#0094E0]" />
                  <span>{proker.date}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-[#0094E0]" />
                  <span>Sasaran: {proker.target}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <hr className="my-10 border-slate-200/80 dark:border-white/10" />

      {/* SECTION 3: Pusat Unduhan Dokumen */}
      <section id="unduhan" className="py-10 scroll-mt-24">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#0094E0] mb-1">
              <FileDown className="w-3.5 h-3.5" />
              <span>Pusat Unduhan Dokumen</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              Repositori Berkas & Dokumen Resmi HIMASI
            </h2>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari nama berkas / surat..."
                value={searchDoc}
                onChange={(e) => setSearchDoc(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#00173d] text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0094E0]"
              />
            </div>
          </div>
        </div>

        {downloadSuccessMessage && (
          <div className="mb-4 p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-150">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{downloadSuccessMessage}</span>
          </div>
        )}

        {/* Document Repository Table */}
        <div className="rounded-3xl bg-white dark:bg-[#00173d]/60 border border-slate-200/90 dark:border-white/10 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-white/10 bg-slate-50/70 dark:bg-slate-900/40 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-6">Nama Dokumen</th>
                  <th className="py-3.5 px-4">Kategori</th>
                  <th className="py-3.5 px-4">Format</th>
                  <th className="py-3.5 px-4">Ukuran</th>
                  <th className="py-3.5 px-4">Diperbarui</th>
                  <th className="py-3.5 px-6 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-xs">
                {filteredDocuments.map((doc, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-4 px-6 font-semibold text-slate-900 dark:text-white">
                      {doc.name}
                    </td>
                    <td className="py-4 px-4 text-slate-500">
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px]">
                        {doc.category}
                      </span>
                    </td>
                    <td className="py-4 px-4 font-mono font-bold text-[#00296E] dark:text-sky-300">
                      .{doc.format}
                    </td>
                    <td className="py-4 px-4 text-slate-500">{doc.size}</td>
                    <td className="py-4 px-4 text-slate-400">{doc.updated}</td>
                    <td className="py-4 px-6 text-right">
                      <button
                        type="button"
                        onClick={() => handleDownload(doc.name)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#0094E0]/15 hover:bg-[#0094E0]/25 text-[#00296E] dark:text-sky-300 font-semibold text-xs transition-colors"
                      >
                        <Download className="w-3.5 h-3.5 text-[#0094E0]" />
                        <span>Unduh</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <hr className="my-10 border-slate-200/80 dark:border-white/10" />

      {/* SECTION 4: Kontak & Kemitraan */}
      <section id="kontak" className="py-10 scroll-mt-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          
          {/* Left: Contact Info */}
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#0094E0] mb-1">
              <Handshake className="w-3.5 h-3.5" />
              <span>Kontak & Kemitraan</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-4">
              Terhubung & Berkolaborasi dengan HIMASI
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
              Kami membuka peluang kolaborasi seluas-luasnya untuk kegiatan kemahasiswaan, kemitraan sponsorship, studi banding, maupun media partner kegiatan teknologi.
            </p>

            <div className="space-y-4 mb-8">
              <div className="flex items-start gap-3 p-4 rounded-2xl bg-white dark:bg-[#00173d]/50 border border-slate-200/80 dark:border-white/10">
                <div className="p-2.5 rounded-xl bg-[#0094E0]/15 text-[#00296E] dark:text-sky-300">
                  <MapPin className="w-5 h-5 text-[#0094E0]" />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Sekretariat</h4>
                  <p className="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200">
                    Gedung Organisasi Mahasiswa Sistem Informasi Lantai 2, Kampus Terpadu
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-2xl bg-white dark:bg-[#00173d]/50 border border-slate-200/80 dark:border-white/10">
                <div className="p-2.5 rounded-xl bg-[#0094E0]/15 text-[#00296E] dark:text-sky-300">
                  <Mail className="w-5 h-5 text-[#0094E0]" />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Email Resmi</h4>
                  <p className="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200">
                    himasi@univ.ac.id | kemitraan.himasi@univ.ac.id
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-2xl bg-white dark:bg-[#00173d]/50 border border-slate-200/80 dark:border-white/10">
                <div className="p-2.5 rounded-xl bg-[#0094E0]/15 text-[#00296E] dark:text-sky-300">
                  <Phone className="w-5 h-5 text-[#0094E0]" />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Helpdesk WhatsApp</h4>
                  <p className="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200">
                    +62 812-3456-7890 (Humas HIMASI)
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Sponsorship & Partnership Proposal Form */}
          <div className="rounded-3xl bg-white dark:bg-[#00173d]/60 border border-slate-200/90 dark:border-white/10 p-6 sm:p-8 shadow-xl">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
              Formulir Permohonan Kemitraan
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              Sampaikan penawaran kerja sama instansi / perusahaan Anda kepada Divisi Hubungan Luar & Danus.
            </p>

            {mitraSubmitted ? (
              <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 text-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
                <h4 className="text-base font-bold text-slate-900 dark:text-white">Permohonan Kemitraan Diterima</h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                  Tim Hubungan Luar HIMASI akan menindaklanjuti proposal Anda via email dalam 1x24 jam kerja.
                </p>
                <button
                  type="button"
                  onClick={() => setMitraSubmitted(false)}
                  className="mt-4 px-4 py-1.5 rounded-full bg-[#00296E] text-white text-xs font-semibold"
                >
                  Kirim Pengajuan Baru
                </button>
              </div>
            ) : (
              <form onSubmit={handleMitraSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nama Instansi / Perusahaan / Organisasi <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={mitraForm.instansi}
                    onChange={(e) => setMitraForm({ ...mitraForm, instansi: e.target.value })}
                    placeholder="Contoh: PT Teknologi Inovasi Nusantara"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0094E0]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Nama Penanggung Jawab (PIC) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={mitraForm.pic}
                      onChange={(e) => setMitraForm({ ...mitraForm, pic: e.target.value })}
                      placeholder="Nama PIC"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0094E0]"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Email Resmi <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={mitraForm.email}
                      onChange={(e) => setMitraForm({ ...mitraForm, email: e.target.value })}
                      placeholder="email@perusahaan.com"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0094E0]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Bentuk Kerja Sama
                  </label>
                  <select
                    value={mitraForm.jenis}
                    onChange={(e) => setMitraForm({ ...mitraForm, jenis: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0094E0]"
                  >
                    <option value="Sponsorship Event">Sponsorship Kegiatan (HIMASI Fest / Seminar)</option>
                    <option value="Media Partner">Media Partner & Publikasi Bersama</option>
                    <option value="Kunjungan Industri">Kunjungan Industri / Company Visit</option>
                    <option value="Studi Banding">Studi Banding Organisasi Mahasiswa</option>
                    <option value="Lainnya">Bentuk Kemitraan Lainnya</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Deskripsi Ringkas Kerja Sama <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={mitraForm.pesan}
                    onChange={(e) => setMitraForm({ ...mitraForm, pesan: e.target.value })}
                    placeholder="Sampaikan ringkasan penawaran, tanggal perkiraan, serta lampiran link proposal jika ada..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0094E0]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-full bg-[#00296E] hover:bg-[#001e52] text-white font-semibold shadow-md transition-all"
                >
                  <Send className="w-4 h-4 text-[#0094E0]" />
                  <span>Kirim Proposal Kemitraan</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

    </div>
  );
}
