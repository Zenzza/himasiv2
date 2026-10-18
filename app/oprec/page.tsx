"use client";

import { useState } from "react";
import Link from "next/link";
import {
  UserPlus,
  Users,
  CheckCircle2,
  Calendar,
  Send,
  Sparkles,
  ArrowLeft,
  ChevronRight,
  Clock,
  Award,
  Layers,
  HeartHandshake,
  Laptop,
  HelpCircle,
  FileCheck
} from "lucide-react";
import Footer from "@/components/footer";

export default function OprecPage() {
  const [formData, setFormData] = useState({
    name: "",
    nim: "",
    batch: "2025",
    email: "",
    whatsapp: "",
    division1: "Kominfo (Komunikasi & Informasi)",
    division2: "Akademik & Riset",
    motivation: "",
    portfolioUrl: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [regNumber, setRegNumber] = useState("");

  const divisions = [
    {
      name: "Kominfo (Komunikasi & Informasi)",
      icon: Laptop,
      desc: "Mengelola media sosial, branding, desain grafis, videografi, dan pemeliharaan website resmi HIMASI.",
    },
    {
      name: "Akademik & Riset",
      icon: Layers,
      desc: "Menyelenggarakan klinik koding, bootcamp teknologi, modul materi kuliah, dan persiapan lomba mahasiswa.",
    },
    {
      name: "PSDM (Pengembangan Sumber Daya Mahasiswa)",
      icon: Users,
      desc: "Kaderisasi mahasiswa baru, Malam Keakraban (Makrab), pelatihan soft skill, dan evaluasi kepengurusan.",
    },
    {
      name: "Hublu (Hubungan Luar)",
      icon: HeartHandshake,
      desc: "Menjalin kemitraan dengan instansi industri, company visit, studi banding, dan relasi alumni.",
    },
    {
      name: "Danus (Dana & Usaha)",
      icon: Award,
      desc: "Kewirausahaan organisasi, pengadaan merchandise dan baju jurusan, serta pengelolaan sponsorship.",
    },
  ];

  const timeline = [
    {
      stage: "Pendaftaran Online & Berkas",
      date: "10 - 24 Maret 2026",
      status: "Sedang Berlangsung",
      active: true,
    },
    {
      stage: "Seleksi Administrasi",
      date: "25 - 26 Maret 2026",
      status: "Akan Datang",
      active: false,
    },
    {
      stage: "Wawancara & Forum Group Discussion",
      date: "28 - 29 Maret 2026",
      status: "Akan Datang",
      active: false,
    },
    {
      stage: "Pengumuman Resmi & Welcoming Session",
      date: "02 April 2026",
      status: "Akan Datang",
      active: false,
    },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      const generated = `OPREC-SI-${Math.floor(1000 + Math.random() * 9000)}`;
      setRegNumber(generated);
      setIsSubmitting(false);
      setIsSubmitted(true);
    }, 800);
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-[#091e42]">
      {/* Top Banner */}
      <section className="relative w-full bg-[#00296E] text-white py-14 sm:py-20 px-4 sm:px-6 lg:px-12 overflow-hidden">
        {/* Glow Effects */}
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
            <UserPlus className="w-4 h-4 text-sky-400" />
            <span className="text-white">Rekrutmen Terbuka Pengurus 2026/2027</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight mb-4">
            Open Recruitment HIMASI Atma Luhur
          </h1>

          <p className="text-slate-200 text-sm sm:text-base max-w-2xl leading-relaxed">
            Bergabunglah bersama keluarga besar Himpunan Mahasiswa Sistem Informasi. Kembangkan jiwa kepemimpinan, perluas relasi, dan ciptakan karya berdampak nyata bagi almamater dan industri teknologi.
          </p>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-12 sm:py-16 space-y-16">
        
        {/* Linimasa Pendaftaran */}
        <section>
          <div className="flex items-center gap-2 text-xs font-bold text-[#0094E0] uppercase tracking-wider mb-2">
            <Calendar className="w-4 h-4" />
            <span>Jadwal & Tahapan Seleksi</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-6">
            Linimasa Rekrutmen
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {timeline.map((item, idx) => (
              <div
                key={idx}
                className={`p-5 rounded-2xl border transition-all ${
                  item.active
                    ? "bg-white border-[#0094E0] shadow-lg shadow-sky-500/10 ring-2 ring-[#0094E0]/20"
                    : "bg-white/80 border-slate-200"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                    item.active ? "bg-[#0094E0] text-white" : "bg-slate-100 text-slate-600"
                  }`}>
                    Tahap 0{idx + 1}
                  </span>
                  <span className={`text-[11px] font-semibold ${
                    item.active ? "text-[#0094E0]" : "text-slate-400"
                  }`}>
                    {item.status}
                  </span>
                </div>
                <h3 className="font-bold text-slate-900 text-sm sm:text-base mb-1">
                  {item.stage}
                </h3>
                <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-2">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{item.date}</span>
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Pilihan Divisi */}
        <section>
          <div className="flex items-center gap-2 text-xs font-bold text-[#0094E0] uppercase tracking-wider mb-2">
            <Layers className="w-4 h-4" />
            <span>Kenali Bidang Minatmu</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-6">
            Pilihan Divisi Kepengurusan
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {divisions.map((div, idx) => {
              const IconComp = div.icon;
              return (
                <div
                  key={idx}
                  className="p-6 rounded-2xl bg-white border border-slate-200 hover:border-[#0094E0]/60 shadow-sm hover:shadow-md transition-all group"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#0094E0]/10 text-[#0094E0] flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                    <IconComp className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-base mb-2">
                    {div.name}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {div.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Syarat & Kualifikasi */}
        <section className="p-6 sm:p-8 rounded-3xl bg-[#00296E] text-white">
          <div className="max-w-3xl">
            <span className="text-xs font-bold text-sky-300 uppercase tracking-wider">
              Persyaratan Umum
            </span>
            <h2 className="text-xl sm:text-2xl font-bold mt-1 mb-4">
              Siapa yang Bisa Mendaftar?
            </h2>
            <ul className="space-y-2.5 text-xs sm:text-sm text-slate-200">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Mahasiswa aktif Program Studi Sistem Informasi ISB Atma Luhur (Angkatan 2024 dan 2025).</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Memiliki integritas, rasa tanggung jawab, dan komitmen tinggi selama satu periode kepengurusan.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Mampu bekerja sama dalam tim dan bersedia belajar hal-hal baru di bidang keorganisasian & teknologi.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Tidak sedang menjabat sebagai pengurus inti pada organisasi mahasiswa lainnya.</span>
              </li>
            </ul>
          </div>
        </section>

        {/* Formulir Pendaftaran */}
        <section id="daftar" className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-10 shadow-xl scroll-mt-24">
          <div className="text-center max-w-xl mx-auto mb-8">
            <span className="text-xs font-bold text-[#0094E0] uppercase tracking-wider">
              Formulir Online
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
              Daftarkan Dirimu Sekarang
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-2">
              Isi data diri dengan teliti. Tim kaderisasi HIMASI akan menghubungi via WhatsApp dan email resmi untuk konfirmasi jadwal wawancara.
            </p>
          </div>

          {isSubmitted ? (
            <div className="p-8 sm:p-12 rounded-2xl bg-emerald-50 border border-emerald-300 text-center max-w-lg mx-auto animate-in fade-in zoom-in-95">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center mb-4">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900">
                Pendaftaran Berhasil Dikirim!
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                Selamat! Berkas pendaftaran kamu telah masuk ke sistem rekrutmen HIMASI Atma Luhur.
              </p>

              <div className="my-6 p-4 rounded-xl bg-white border border-emerald-200">
                <span className="text-xs text-slate-500 font-medium">Nomor Registrasi Oprec</span>
                <p className="text-xl sm:text-2xl font-mono font-bold text-[#00296E] mt-1">
                  {regNumber}
                </p>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Simpan nomor ini untuk verifikasi kartu peserta wawancara.
                </span>
              </div>

              <button
                type="button"
                onClick={() => setIsSubmitted(false)}
                className="px-6 py-2 rounded-xl bg-[#00296E] text-white text-xs font-semibold hover:bg-[#001e52] transition-colors"
              >
                Kirim Pendaftaran Lain
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5 max-w-2xl mx-auto text-xs sm:text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">
                    Nama Lengkap <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Contoh: Muhammad Farhan"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0094E0]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">
                    Nomor Induk Mahasiswa (NIM) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nim}
                    onChange={(e) => setFormData({ ...formData, nim: e.target.value })}
                    placeholder="Contoh: 2311500001"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0094E0]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">
                    Angkatan <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.batch}
                    onChange={(e) => setFormData({ ...formData, batch: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0094E0]"
                  >
                    <option value="2025">2025 (Tingkat 1)</option>
                    <option value="2024">2024 (Tingkat 2)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">
                    Email Mahasiswa <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="nama@mhs.atmaluhur.ac.id"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0094E0]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">
                    Nomor WhatsApp Aktif <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                    placeholder="0812-xxxx-xxxx"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0094E0]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">
                    Pilihan Divisi 1 (Prioritas) <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.division1}
                    onChange={(e) => setFormData({ ...formData, division1: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0094E0]"
                  >
                    {divisions.map((d, i) => (
                      <option key={i} value={d.name}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">
                    Pilihan Divisi 2 (Alternatif) <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.division2}
                    onChange={(e) => setFormData({ ...formData, division2: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0094E0]"
                  >
                    {divisions.map((d, i) => (
                      <option key={i} value={d.name}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Motivasi Bergabung dengan HIMASI <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={formData.motivation}
                  onChange={(e) => setFormData({ ...formData, motivation: e.target.value })}
                  placeholder="Ceritakan motivasimu, kontribusi apa yang ingin kamu berikan, dan pengalaman organisasi/kepanitiaan yang pernah kamu ikuti..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0094E0]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Link Portofolio / CV / Berkas Pendukung (Google Drive / GitHub / LinkedIn)
                </label>
                <input
                  type="url"
                  value={formData.portfolioUrl}
                  onChange={(e) => setFormData({ ...formData, portfolioUrl: e.target.value })}
                  placeholder="https://drive.google.com/..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0094E0]"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Pastikan akses file Google Drive diatur ke &#34;Siapa saja yang memiliki link&#34;.
                </span>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-xl bg-[#00296E] hover:bg-[#001e52] text-white font-bold shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
              >
                {isSubmitting ? (
                  <span>Mengirim Pendaftaran...</span>
                ) : (
                  <>
                    <Send className="w-4 h-4 text-[#0094E0]" />
                    <span>Kirim Formulir Pendaftaran</span>
                  </>
                )}
              </button>
            </form>
          )}
        </section>

      </main>

      <Footer />
    </div>
  );
}
