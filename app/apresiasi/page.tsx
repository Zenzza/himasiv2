"use client";

import { useState } from "react";
import Link from "next/link";
import {
  MessageSquareShare,
  Award,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  Send,
  Heart,
  Trophy,
  ShieldCheck,
  Star,
  Users,
  Search,
  Filter,
  Lock,
  MessageCircle
} from "lucide-react";
import FormAspirasi from "@/components/form-aspirasi";
import Footer from "@/components/footer";

export default function ApresiaSIPage() {
  const [activeTab, setActiveTab] = useState<"aspirasi" | "apresiasi">("aspirasi");
  const [apresiasiFilter, setApresiasiFilter] = useState("Semua");
  const [kudosSubmitted, setKudosSubmitted] = useState(false);
  const [kudosForm, setKudosForm] = useState({
    recipient: "",
    nim: "",
    category: "Prestasi Akademik & Lomba",
    message: "",
  });

  const appreciationHighlights = [
    {
      name: "Tim Inovasi Aksesibel SI",
      members: "Fadhil, Anindya, Zahra (Angkatan 2024)",
      badge: "Juara 1 Nasional Hackathon",
      desc: "Mengembangkan aplikasi asisten perkuliahan untuk penyandang disabilitas sensorik dengan pengenalan suara dan gestur berbasis AI.",
      category: "Kompetisi",
      likes: 68,
    },
    {
      name: "Arya Wijaya",
      members: "Angkatan 2023",
      badge: "Best Paper ICIS 2025",
      desc: "Menerbitkan penelitian bereputasi internasional mengenai arsitektur sistem informasi prediktif pada rantai pasok maritim.",
      category: "Riset Ilmiah",
      likes: 54,
    },
    {
      name: "DevSI Open Source Community",
      members: "Pengurus Akademik HIMASI",
      badge: "Inisiator Bootcamp Koding",
      desc: "Menyelenggarakan lebih dari 12 sesi pelatihan intensif pemrograman gratis dan membimbing lebih dari 80 mahasiswa baru membuat portofolio web.",
      category: "Kontribusi Sosial",
      likes: 92,
    },
  ];

  const handleKudosSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setKudosSubmitted(true);
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
            <Sparkles className="w-4 h-4 text-sky-400" />
            <span className="text-white">Apresia-SI • Suara & Kebanggaan Sistem Informasi</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight mb-4">
            Apresia-SI Portal
          </h1>

          <p className="text-slate-200 text-sm sm:text-base max-w-2xl leading-relaxed">
            Wadah terintegrasi penyaluran aspirasi konstruktif dan advokasi mahasiswa, sekaligus panggung apresiasi untuk karya dan prestasi civitas akademika HIMASI Atma Luhur.
          </p>

          {/* Quick Metrics Bar */}
          <div className="mt-8 pt-8 border-t border-white/15 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <span className="text-2xl sm:text-3xl font-black text-white">140+</span>
              <p className="text-xs text-sky-200 mt-0.5">Aspirasi Ditindaklanjuti</p>
            </div>
            <div>
              <span className="text-2xl sm:text-3xl font-black text-white">98%</span>
              <p className="text-xs text-sky-200 mt-0.5">Tingkat Respon Advokasi</p>
            </div>
            <div>
              <span className="text-2xl sm:text-3xl font-black text-white">25+</span>
              <p className="text-xs text-sky-200 mt-0.5">Penghargaan Prestasi</p>
            </div>
            <div>
              <span className="text-2xl sm:text-3xl font-black text-white">100%</span>
              <p className="text-xs text-sky-200 mt-0.5">Transparan & Terpercaya</p>
            </div>
          </div>
        </div>
      </section>

      {/* Tab Switcher */}
      <div className="sticky top-16 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 py-3 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setActiveTab("aspirasi")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all ${
              activeTab === "aspirasi"
                ? "bg-[#00296E] text-white shadow-md"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <MessageSquareShare className="w-4 h-4" />
            <span>Kotak Aspirasi & Advokasi</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("apresiasi")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all ${
              activeTab === "apresiasi"
                ? "bg-[#00296E] text-white shadow-md"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Panggung Apresiasi & Prestasi</span>
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      <main className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-10 sm:py-14">

        {activeTab === "aspirasi" ? (
          <div>
            {/* Form Aspirasi Mahasiswa Component */}
            <FormAspirasi />

            {/* Informational Guidelines on Advocacy */}
            <div className="mt-12 p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-sky-100 text-[#00296E] shrink-0">
                  <ShieldCheck className="w-5 h-5 text-[#0094E0]" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Privasi & Kerahasiaan Terjamin</h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Identitas mahasiswa pengirim opsi anonim dienkripsi dan tidak dibagikan ke pihak luar.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-sky-100 text-[#00296E] shrink-0">
                  <MessageCircle className="w-5 h-5 text-[#0094E0]" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Alur Advokasi Berkala</h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Setiap aspirasi dikelompokkan dan dibawa pada audiensi resmi himpunan bersama pimpinan prodi.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-sky-100 text-[#00296E] shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-[#0094E0]" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Pelacakan Tiket Terbuka</h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Simpan nomor tiket Anda untuk menanyakan progres tindak lanjut ke Divisi Advokasi HIMASI.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-12">
            {/* Panggung Apresiasi Section */}
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-[#0094E0] uppercase tracking-wider mb-2">
                <Trophy className="w-4 h-4" />
                <span>Karya & Prestasi Civitas Akademika</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-6">
                Hall of Fame & Apresiasi Mahasiswa
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {appreciationHighlights.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                          {item.badge}
                        </span>
                        <span className="text-xs font-semibold text-rose-500 flex items-center gap-1">
                          <Heart className="w-3.5 h-3.5 fill-rose-500" />
                          <span>{item.likes}</span>
                        </span>
                      </div>
                      <h3 className="font-bold text-slate-900 text-base mb-1">
                        {item.name}
                      </h3>
                      <p className="text-xs font-medium text-slate-500 mb-3">
                        {item.members}
                      </p>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {item.desc}
                      </p>
                    </div>

                    <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-slate-400">
                        {item.category}
                      </span>
                      <button
                        type="button"
                        onClick={() => alert(`Terima kasih telah memberikan apresiasi untuk ${item.name}!`)}
                        className="text-xs font-bold text-[#0094E0] hover:text-[#00296E] inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Heart className="w-3.5 h-3.5" />
                        <span>Kirim Apresiasi</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Form Apresiasi / Kudos Teman Sejawat */}
            <section className="p-6 sm:p-10 rounded-3xl bg-white border border-slate-200 shadow-xl">
              <div className="max-w-2xl mx-auto">
                <div className="text-center mb-8">
                  <span className="text-xs font-bold text-[#0094E0] uppercase tracking-wider">
                    Suara Kebanggaan
                  </span>
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
                    Kirimkan Apresiasi untuk Teman / Rekan Timmu
                  </h3>
                  <p className="text-xs text-slate-500 mt-1.5">
                    Kenal teman mahasiswa SI yang menjuarai kompetisi, meluncurkan proyek keren, atau berdedikasi tinggi di kelas? Tuliskan pesan apresiasimu di sini!
                  </p>
                </div>

                {kudosSubmitted ? (
                  <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-300 text-center animate-in fade-in">
                    <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
                    <h4 className="font-bold text-slate-900 text-base">Pesan Apresiasi Terkirim!</h4>
                    <p className="text-xs text-slate-600 mt-1">
                      Pesan apresiasi Anda akan diverifikasi oleh Divisi Kominfo HIMASI untuk ditayangkan di papan apresiasi bulanan.
                    </p>
                    <button
                      type="button"
                      onClick={() => setKudosSubmitted(false)}
                      className="mt-4 px-4 py-1.5 rounded-full bg-[#00296E] text-white text-xs font-bold"
                    >
                      Kirim Apresiasi Lain
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleKudosSubmit} className="space-y-4 text-xs sm:text-sm">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Nama Teman yang Diapresiasi <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={kudosForm.recipient}
                          onChange={(e) => setKudosForm({ ...kudosForm, recipient: e.target.value })}
                          placeholder="Nama Mahasiswa / Nama Tim"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0094E0]"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Kategori Apresiasi <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={kudosForm.category}
                          onChange={(e) => setKudosForm({ ...kudosForm, category: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0094E0]"
                        >
                          <option value="Prestasi Akademik & Lomba">Juara Lomba / Kompetisi Teknologi</option>
                          <option value="Proyek & Karya Inovatif">Peluncuran Software / Aplikasi / Startup</option>
                          <option value="Dedikasi Kepanitiaan">Dedikasi Pengurus & Kepanitiaan</option>
                          <option value="Lainnya">Apresiasi & Ucapan Semangat Lainnya</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Pesan Apresiasi / Alasan Merekomendasikan <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        rows={3}
                        required
                        value={kudosForm.message}
                        onChange={(e) => setKudosForm({ ...kudosForm, message: e.target.value })}
                        placeholder="Tuliskan ucapan selamat, apresiasi karya, dan inspirasi yang mereka berikan..."
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0094E0]"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 rounded-xl bg-[#00296E] hover:bg-[#001e52] text-white font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Send className="w-4 h-4 text-[#0094E0]" />
                      <span>Publikasikan Apresiasi</span>
                    </button>
                  </form>
                )}
              </div>
            </section>
          </div>
        )}

      </main>

      <Footer />
    </div>
  );
}
