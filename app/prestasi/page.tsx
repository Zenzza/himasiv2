"use client";

import { useState } from "react";
import { Award, Trophy, Medal, PlusCircle, CheckCircle2, Search, ExternalLink, Sparkles } from "lucide-react";

export default function PrestasiPage() {
  const [filterCategory, setFilterCategory] = useState("Semua");
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const achievements = [
    {
      title: "Juara 1 - National UI/UX Design Hackathon 2026",
      team: "Tim Inovasi Aksesibel SI (Fadhil, Anindya, Zahra)",
      organizer: "Universitas Indonesia Tech Summit",
      level: "Tingkat Nasional",
      year: "2026",
      medal: "Emas",
      category: "UI/UX & Desain Produk"
    },
    {
      title: "Juara 2 - Business IT Case Competition ASEAN 2025",
      team: "Tim Enterprise Synergies",
      organizer: "ASEAN Information System Forum",
      level: "Tingkat Internasional",
      year: "2025",
      medal: "Perak",
      category: "Business Case & IT Solution"
    },
    {
      title: "Best Paper Award - International Conference on Information Systems (ICIS)",
      team: "Arya Wijaya & Tim Dosen Pembimbing",
      organizer: "IEEE Computer Society",
      level: "Tingkat Internasional",
      year: "2025",
      medal: "Best Paper",
      category: "Karya Ilmiah & Riset"
    },
    {
      title: "Juara 3 - National Cyber Security & Penetration Testing Challenge",
      team: "ZeroDay SI Security Group",
      organizer: "Badan Siber & Sandi Negara (BSSN) Challenge",
      level: "Tingkat Nasional",
      year: "2025",
      medal: "Perunggu",
      category: "Cybersecurity & Forensic"
    },
    {
      title: "Juara 1 - Web Development Innovation Cup 2025",
      team: "DevSI Studio",
      organizer: "HIMATIF Tech Week",
      level: "Tingkat Nasional",
      year: "2025",
      medal: "Emas",
      category: "Software Engineering"
    },
  ];

  const filtered = achievements.filter(
    (item) => filterCategory === "Semua" || item.category === filterCategory
  );

  return (
    <div className="flex flex-col w-full py-8 px-4 sm:px-6 max-w-7xl mx-auto">
      {/* Banner */}
      <section className="relative rounded-[2.5rem] bg-gradient-to-r from-[#0094E0] via-[#0070c0] to-[#00296E] p-8 sm:p-14 text-white shadow-xl shadow-sky-500/10 overflow-hidden mb-8">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold uppercase tracking-wider mb-4 border border-white/30">
            <Trophy className="w-3.5 h-3.5 text-amber-300" />
            <span>Hall of Fame Sistem Informasi</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
            Pusat Prestasi Mahasiswa
          </h1>
          <p className="mt-3 text-sm sm:text-base text-sky-100 font-normal leading-relaxed">
            Menghargai dedikasi dan kiprah gemilang mahasiswa Sistem Informasi dalam mengharumkan almamater di kancah kompetisi teknologi regional, nasional, dan global.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={() => setShowSubmitModal(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-[#00296E] font-semibold text-xs sm:text-sm shadow-md hover:bg-slate-50 transition-all"
            >
              <PlusCircle className="w-4 h-4 text-[#0094E0]" />
              <span>Daftarkan Prestasi Baru</span>
            </button>
          </div>
        </div>
      </section>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 mb-8">
        {["Semua", "UI/UX & Desain Produk", "Business Case & IT Solution", "Karya Ilmiah & Riset", "Cybersecurity & Forensic", "Software Engineering"].map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
              filterCategory === cat
                ? "bg-[#00296E] text-white shadow-sm"
                : "bg-white dark:bg-[#00173d] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-[#0094E0]"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Achievements Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((item, i) => (
          <div
            key={i}
            className="rounded-3xl bg-white dark:bg-[#00173d]/60 border border-slate-200/90 dark:border-white/10 p-6 shadow-sm hover:shadow-xl hover:border-[#0094E0]/40 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#0094E0]/15 text-[#00296E] dark:text-sky-300">
                  {item.level}
                </span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300">
                  Tahun {item.year}
                </span>
              </div>

              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 leading-snug">
                {item.title}
              </h3>
              <p className="text-xs text-slate-500 mb-1">
                Penyelenggara: <span className="font-semibold text-slate-700 dark:text-slate-300">{item.organizer}</span>
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 font-medium">
                Delegasi: {item.team}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-xs text-[#00296E] dark:text-sky-300 font-semibold">
              <div className="flex items-center gap-1.5">
                <Medal className="w-4 h-4 text-amber-500" />
                <span>Medali {item.medal}</span>
              </div>
              <span className="text-[11px] text-slate-400 font-normal">{item.category}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Pengajuan Prestasi */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-[#00173d] max-w-lg w-full rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-white/10">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
              Formulir Pendataan Prestasi Mahasiswa SI
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              Laporkan perolehan kejuaraan lomba akademik atau non-akademik Anda agar dicatat oleh Biro Prestasi HIMASI.
            </p>

            {submitSuccess ? (
              <div className="text-center py-6">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                <h4 className="text-base font-bold text-slate-900 dark:text-white">Laporan Berhasil Diajukan!</h4>
                <p className="text-xs text-slate-500 mt-1">Tim HIMASI akan memvalidasi bukti sertifikat dalam 2 hari kerja.</p>
                <button
                  onClick={() => {
                    setSubmitSuccess(false);
                    setShowSubmitModal(false);
                  }}
                  className="mt-6 px-6 py-2 rounded-full bg-[#00296E] text-white text-xs font-semibold"
                >
                  Tutup
                </button>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setSubmitSuccess(true);
                }}
                className="space-y-3.5 text-xs"
              >
                <div>
                  <label className="block font-semibold mb-1">Nama Ajang / Kompetisi</label>
                  <input required placeholder="Contoh: Hackathon Nasional Kemenpora 2026" className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold mb-1">Capaian Juara</label>
                    <input required placeholder="Contoh: Juara 1 / Harapan 1" className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900" />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Tingkat</label>
                    <select className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                      <option>Tingkat Nasional</option>
                      <option>Tingkat Internasional</option>
                      <option>Tingkat Regional / Wilayah</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Nama Anggota Tim & NIM</label>
                  <textarea rows={2} required placeholder="Nama dan NIM anggota delegasi" className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900" />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowSubmitModal(false)}
                    className="px-4 py-2 rounded-full border border-slate-200 text-slate-600 text-xs font-semibold"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 rounded-full bg-[#00296E] text-white text-xs font-semibold shadow-md"
                  >
                    Kirim Data Prestasi
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
