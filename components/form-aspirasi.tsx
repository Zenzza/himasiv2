"use client";

import { useState } from "react";
import {
  MessageSquareShare,
  Send,
  ShieldCheck,
  CheckCircle2,
  Lock,
  User,
  GraduationCap,
  Sparkles,
  HelpCircle,
  RotateCcw
} from "lucide-react";

export default function FormAspirasi() {
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [category, setCategory] = useState("Akademik & Perkuliahan");
  const [name, setName] = useState("");
  const [nim, setNim] = useState("");
  const [batch, setBatch] = useState("2024");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ticketId, setTicketId] = useState("");

  const categories = [
    { label: "Akademik & Perkuliahan", emoji: "🎓" },
    { label: "Sarana & Prasarana Kampus", emoji: "🏛️" },
    { label: "Kinerja Himpunan (HIMASI)", emoji: "⚡" },
    { label: "Advokasi & Hak Mahasiswa", emoji: "📢" },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;

    setIsSubmitting(true);
    // Simulate API submission
    setTimeout(() => {
      const generatedTicket = `ASP-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      setTicketId(generatedTicket);
      setIsSubmitting(false);
      setIsSubmitted(true);
    }, 700);
  };

  const handleReset = () => {
    setIsSubmitted(false);
    setSubject("");
    setMessage("");
    if (!isAnonymous) {
      setName("");
      setNim("");
    }
  };

  return (
    <section id="aspirasi" className="py-20 px-4 sm:px-6 max-w-7xl mx-auto w-full scroll-mt-24">
      <div className="relative rounded-[2.5rem] bg-gradient-to-br from-white via-slate-50/80 to-[#e5f4fd]/60 dark:from-[#00173d] dark:via-[#001333] dark:to-[#000d24] border border-slate-200/90 dark:border-white/10 p-6 sm:p-12 shadow-2xl shadow-sky-500/10 overflow-hidden">
        
        {/* Glow ambient background */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#0094E0]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-[#00296E]/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto">
          {/* Header Title */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0094E0]/10 dark:bg-[#0094E0]/20 border border-[#0094E0]/30 text-[#00296E] dark:text-sky-300 text-xs font-semibold uppercase tracking-wider mb-3">
              <MessageSquareShare className="w-3.5 h-3.5 text-[#0094E0]" />
              <span>Suara Mahasiswa Sistem Informasi</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Kotak Aspirasi & Advokasi Mahasiswa
            </h2>
            <p className="mt-3 text-slate-600 dark:text-slate-300 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
              Kirimkan ide inovatif, kritik membangun, atau laporan kendala fasilitas dan perkuliahan. Himpunan siap mengadvokasikan suara Anda ke pihak departemen secara transparan dan bertanggung jawab.
            </p>
          </div>

          {isSubmitted ? (
            /* Success Feedback Box */
            <div className="rounded-3xl bg-white/90 dark:bg-[#001d4a]/90 border border-emerald-500/30 p-8 sm:p-10 shadow-lg text-center backdrop-blur-md animate-in fade-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center mb-4">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                Aspirasi Berhasil Terkirim!
              </h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto">
                Terima kasih atas kontribusi Anda. Aspirasi Anda telah dicatat oleh Divisi Advokasi HIMASI dan akan ditinjau pada rapat koordinasi berkala.
              </p>

              <div className="my-6 inline-flex flex-col items-center p-4 rounded-2xl bg-slate-50 dark:bg-[#001333] border border-slate-200 dark:border-white/10">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Nomor Tiket Aspirasi Anda
                </span>
                <span className="font-mono text-xl sm:text-2xl font-bold text-[#00296E] dark:text-sky-300 tracking-wider mt-1">
                  {ticketId}
                </span>
                <span className="text-[11px] text-slate-400 mt-1">
                  Simpan kode ini untuk menanyakan status advokasi jika diperlukan.
                </span>
              </div>

              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#00296E] hover:bg-[#001e52] text-white text-xs sm:text-sm font-semibold transition-all shadow-md"
                >
                  <RotateCcw className="w-4 h-4 text-[#0094E0]" />
                  <span>Kirim Aspirasi Lainnya</span>
                </button>
              </div>
            </div>
          ) : (
            /* Submission Form */
            <form
              onSubmit={handleSubmit}
              className="rounded-3xl bg-white/95 dark:bg-[#001840]/90 border border-slate-200/90 dark:border-white/10 p-6 sm:p-10 shadow-xl backdrop-blur-md flex flex-col gap-6"
            >
              {/* Category Pills */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 mb-2.5">
                  1. Pilih Kategori Aspirasi
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  {categories.map((cat) => (
                    <button
                      key={cat.label}
                      type="button"
                      onClick={() => setCategory(cat.label)}
                      className={`flex items-center gap-2 p-3 rounded-2xl text-xs font-semibold text-left transition-all border ${
                        category === cat.label
                          ? "bg-[#00296E] text-white border-[#00296E] shadow-md shadow-[#00296E]/20"
                          : "bg-slate-50 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-[#0094E0]/60 hover:bg-white"
                      }`}
                    >
                      <span className="text-base">{cat.emoji}</span>
                      <span className="leading-tight">{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Anonymity Option Switch */}
              <div className="p-4 rounded-2xl bg-[#0094E0]/10 dark:bg-[#0094E0]/15 border border-[#0094E0]/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-white dark:bg-[#001e52] text-[#00296E] dark:text-sky-300 shadow-sm">
                    {isAnonymous ? <Lock className="w-4 h-4 text-[#0094E0]" /> : <ShieldCheck className="w-4 h-4 text-[#0094E0]" />}
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                      Opsi Kerahasiaan (Anonimitas)
                    </h4>
                    <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-300">
                      Aktifkan bila Anda ingin identitas nama & NIM dirahasiakan sepenuhnya dari publik.
                    </p>
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer self-end sm:self-center">
                  <input
                    type="checkbox"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="w-4 h-4 rounded text-[#00296E] focus:ring-[#0094E0] border-slate-300"
                  />
                  <span className="text-xs font-semibold text-[#00296E] dark:text-sky-300 select-none">
                    Kirim Anonim
                  </span>
                </label>
              </div>

              {/* Student Identity Inputs (Hidden/Disabled if Anonymous) */}
              {!isAnonymous ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-in fade-in duration-150">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Nama Mahasiswa <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Contoh: Budi Santoso"
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0094E0]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      NIM <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={nim}
                      onChange={(e) => setNim(e.target.value)}
                      placeholder="Contoh: 10221045"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0094E0]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Angkatan Mahasiswa
                    </label>
                    <select
                      value={batch}
                      onChange={(e) => setBatch(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0094E0]"
                    >
                      <option value="2025">Angkatan 2025</option>
                      <option value="2024">Angkatan 2024</option>
                      <option value="2023">Angkatan 2023</option>
                      <option value="2022">Angkatan 2022</option>
                      <option value="Alumni">Alumni / Lainnya</option>
                    </select>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-[#0094E0] shrink-0" />
                  <span>
                    Identitas Anda dienkripsi dan tidak akan ditampilkan kepada tim advokasi maupun departemen.
                  </span>
                </div>
              )}

              {/* Subject & Detail */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 mb-1.5">
                    2. Judul / Subjek Aspirasi <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Contoh: Usulan Penambahan Jam Operasional Laboratorium Komputer"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0094E0]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 mb-1.5">
                    3. Isi Detail Aspirasi & Masukan <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Tuliskan secara jelas kendala yang dialami, saran solusi konstruktif, serta pihak terkait yang diharapkan..."
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0094E0] leading-relaxed"
                  />
                  <div className="flex justify-between items-center text-[11px] text-slate-400 mt-1">
                    <span>Gunakan bahasa yang santun dan konstruktif.</span>
                    <span>{message.length} karakter</span>
                  </div>
                </div>
              </div>

              {/* Submit CTA */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100 dark:border-slate-800">
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  * Aspirasi akan ditindaklanjuti secara berkala setiap hari Rabu dan Jumat.
                </span>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3 rounded-full bg-[#00296E] hover:bg-[#001e52] active:scale-95 text-white font-semibold text-xs sm:text-sm shadow-lg shadow-[#00296E]/25 transition-all duration-200 disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Mengirimkan...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 text-[#0094E0]" />
                      <span>Kirimkan Aspirasi Saya</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </section>
  );
}
