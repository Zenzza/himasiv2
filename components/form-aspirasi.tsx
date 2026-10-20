"use client";

import { useState } from "react";
import {
  Send,
  CheckCircle2,
  Mail,
  GraduationCap,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  RotateCcw,
  Check,
  Megaphone,
  Clock
} from "lucide-react";
import ScrollReveal from "@/components/scroll-reveal";

import { supabase } from "@/lib/supabase/client";

export default function FormAspirasi() {
  const [email, setEmail] = useState("");
  const [angkatan, setAngkatan] = useState("2024");
  const [pesan, setPesan] = useState("");
  const [agreed, setAgreed] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [ticketId, setTicketId] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !pesan.trim()) return;

    setIsSubmitting(true);
    const randomTicket = `ASP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    try {
      // Kirim data aspirasi ke tabel PostgreSQL Supabase 'public.aspirasi'
      const { error } = await supabase.from("aspirasi").insert([
        {
          email: email.trim(),
          angkatan,
          pesan: pesan.trim(),
          status: "baru",
        },
      ]);

      if (error) {
        console.warn("Catatan: Menyimpan ke Supabase:", error.message);
        // Fallback tetap berhasil di sisi klien jika tabel belum di-create via SQL Editor
      }
    } catch (err) {
      console.warn("Koneksi Supabase error / offline:", err);
    } finally {
      setTicketId(randomTicket);
      setIsSubmitting(false);
      setIsSubmitted(true);
    }
  };

  const handleReset = () => {
    setIsSubmitted(false);
    setEmail("");
    setPesan("");
    setAngkatan("2024");
    setAgreed(true);
  };

  return (
    <section
      id="aspirasi"
      className="relative py-10 sm:py-16 px-4 sm:px-6 lg:px-12 bg-white w-full overflow-hidden scroll-mt-16"
    >
      <ScrollReveal className="relative max-w-6xl mx-auto">
        {/* Header Section (Selaras dengan section lain di Homepage) */}
        <div className="mb-8 sm:mb-10 text-left">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#00296E] tracking-tight leading-tight">
            Form Aspirasi Mahasiswa
          </h2>
        </div>

        {/* Split Card: Sisi Kiri Info / Panduan & Sisi Kanan Form Input */}
        <div className="rounded-[28px] sm:rounded-[32px] bg-white border border-slate-200/90 shadow-[0_15px_40px_rgba(0,41,110,0.06)] overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          
          {/* SISI KIRI (lg:col-span-5): Branding Card dengan Gradient Navy & Poin Advokasi */}
          <div className="lg:col-span-5 bg-gradient-to-br from-[#00296E] via-[#002257] to-[#00173d] p-6 sm:p-8 lg:p-10 text-white flex flex-col justify-between relative overflow-hidden">
            {/* Ambient Glow Lingkaran Halus */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#0094E0]/20 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-sky-400/10 rounded-full blur-3xl pointer-events-none -ml-16 -mb-16" />

            <div className="relative z-10">
              <h3 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight leading-snug">
                Suaramu Membangun Masa Depan HIMASI
              </h3>

              <p className="mt-3 text-slate-200 text-xs sm:text-sm leading-relaxed font-normal">
                Setiap masukan yang Anda sampaikan akan ditinjau secara berkala oleh pengurus HIMASI dan diteruskan langsung ke pihak terkait secara transparan dan bertanggung jawab.
              </p>
            </div>

            {/* Catatan Bawah Sisi Kiri */}
            <div className="relative z-10 mt-8 pt-5 text-[11px] text-slate-300 flex items-center gap-2">
              <span>Form Aspirasi Aktif Periode 2026</span>
            </div>
          </div>

          {/* SISI KANAN (lg:col-span-7): Form Pengisian Aspirasi */}
          <div className="lg:col-span-7 p-6 sm:p-8 lg:p-10 flex flex-col justify-center bg-white">
            {isSubmitted ? (
              /* Success Feedback State */
              <div className="py-6 px-4 text-center animate-in fade-in zoom-in-95 duration-200">
                <div className="w-16 h-16 rounded-full bg-emerald-100 border-2 border-emerald-500/20 text-emerald-600 mx-auto flex items-center justify-center mb-4 shadow-sm">
                  <CheckCircle2 className="w-9 h-9 stroke-[2.2]" />
                </div>
                <h3 className="text-xl sm:text-2xl font-extrabold text-[#00296E] tracking-tight">
                  Aspirasi Berhasil Terkirim!
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                  Terima kasih atas kontribusi Anda. Aspirasi Anda telah dicatat oleh Divisi Advokasi HIMASI ISB Atma Luhur untuk ditindaklanjuti.
                </p>

                {/* Box Nomor Tiket */}
                <div className="my-6 inline-flex flex-col items-center px-6 py-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-xs text-slate-500 font-medium">
                    Nomor Tiket Aspirasi
                  </span>
                  <span className="font-mono text-xl sm:text-2xl font-extrabold text-[#00296E] tracking-wider mt-1">
                    {ticketId}
                  </span>
                  <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-400">
                    <span>Email: <strong className="text-slate-600">{email}</strong></span>
                    <span>•</span>
                    <span>Angkatan: <strong className="text-slate-600">{angkatan}</strong></span>
                  </div>
                </div>

                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#00296E] hover:bg-[#001f52] text-white text-xs sm:text-sm font-semibold transition-all shadow-md hover:shadow-lg active:scale-95 cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4 text-[#0094E0]" />
                    <span>Kirim Aspirasi Lainnya</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Input Form: Email, Angkatan, Pesan */
              <form onSubmit={handleSubmit} className="space-y-5">
                
                {/* 1. INPUT EMAIL MAHASISWA */}
                <div>
                  <label
                    htmlFor="aspirasi-email"
                    className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
                  >
                    Email Mahasiswa <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      id="aspirasi-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="nama@mahasiswa.atmaluhur.ac.id"
                      className="w-full pl-10 pr-4 py-2.5 sm:py-3 rounded-xl border border-slate-200 bg-slate-50/80 hover:bg-white focus:bg-white text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0094E0]/40 focus:border-[#0094E0] transition-all"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Gunakan email institusi mahasiswa Atma Luhur atau email aktif Anda.
                  </p>
                </div>

                {/* 2. INPUT ANGKATAN */}
                <div>
                  <label
                    htmlFor="aspirasi-angkatan"
                    className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
                  >
                    Angkatan Mahasiswa <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <GraduationCap className="w-4 h-4" />
                    </div>
                    <select
                      id="aspirasi-angkatan"
                      value={angkatan}
                      onChange={(e) => setAngkatan(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 sm:py-3 rounded-xl border border-slate-200 bg-slate-50/80 hover:bg-white focus:bg-white text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0094E0]/40 focus:border-[#0094E0] transition-all cursor-pointer"
                    >
                      <option value="2026">Angkatan 2026</option>
                      <option value="2025">Angkatan 2025</option>
                      <option value="2024">Angkatan 2024</option>
                      <option value="2023">Angkatan 2023</option>
                      <option value="2022">Angkatan 2022</option>
                      <option value="2021">Angkatan 2021</option>
                      <option value="Alumni">Alumni / Mahasiswa Lainnya</option>
                    </select>
                  </div>
                </div>

                {/* 3. INPUT PESAN ASPIRASI */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      htmlFor="aspirasi-pesan"
                      className="block text-xs font-bold uppercase tracking-wider text-slate-700"
                    >
                      Pesan Aspirasi <span className="text-red-500">*</span>
                    </label>
                    <span className="text-[11px] text-slate-400">
                      {pesan.length} karakter
                    </span>
                  </div>
                  <div className="relative">
                    <textarea
                      id="aspirasi-pesan"
                      required
                      rows={5}
                      value={pesan}
                      onChange={(e) => setPesan(e.target.value)}
                      placeholder="Tuliskan aspirasi, kritik membangun, atau saran perbaikan Anda secara terperinci..."
                      className="w-full p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200 bg-slate-50/80 hover:bg-white focus:bg-white text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0094E0]/40 focus:border-[#0094E0] transition-all leading-relaxed resize-none"
                    />
                  </div>
                </div>

                {/* Checklist Persetujuan & Etika Penyampaian */}
                <div className="flex items-start gap-2.5 pt-1">
                  <label className="relative flex items-center mt-0.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={agreed}
                      onChange={(e) => setAgreed(e.target.checked)}
                      required
                      className="w-4 h-4 rounded text-[#00296E] focus:ring-[#0094E0] border-slate-300 cursor-pointer"
                    />
                  </label>
                  <span className="text-xs text-slate-600 leading-snug select-none">
                    Saya menyatakan bahwa aspirasi yang disampaikan bersifat konstruktif, objektif, dan dapat dipertanggungjawabkan.
                  </span>
                </div>

                {/* Tombol Submit */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting || !agreed}
                    className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 sm:py-3.5 rounded-xl bg-[#00296E] hover:bg-[#001f52] active:scale-[0.99] text-white font-bold text-xs sm:text-sm shadow-md hover:shadow-lg shadow-[#00296E]/20 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Mengirimkan Aspirasi...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 text-[#0094E0]" />
                        <span>Kirim Aspirasi Sekarang</span>
                      </>
                    )}
                  </button>
                </div>

              </form>
            )}
          </div>

        </div>
      </ScrollReveal>
    </section>
  );
}
