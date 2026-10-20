"use client";

import { useState } from "react";
import Link from "next/link";
import { MessageSquareShare, X as CloseIcon, Send, CheckCircle2 } from "lucide-react";

export default function Footer() {
  const [isAspirasiModalOpen, setIsAspirasiModalOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [nama, setNama] = useState("");
  const [pesan, setPesan] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pesan.trim()) return;
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setIsAspirasiModalOpen(false);
      setNama("");
      setPesan("");
    }, 2000);
  };

  return (
    <footer className="relative w-full overflow-hidden bg-gradient-to-b from-white via-[#eaf2fc] to-[#c7ddf5] text-slate-800 pt-16 sm:pt-24 pb-8 sm:pb-12">
      
      {/* Container Utama Konten Footer */}
      <div className="relative max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 z-10">
        
        {/* Baris Utama: 3 Kolom (Kiri: Kontak, Tengah: Diagram CTA, Kanan: Navigasi) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center mb-16 sm:mb-20">
          
          {/* Kolom Kiri: Social Media Icons + Email + Alamat Lengkap */}
          <div className="lg:col-span-4 flex flex-col items-start justify-center">
            
            {/* Social Media Icons (Hanya IG, TikTok, dan YouTube Sesuai Permintaan) */}
            <div className="flex items-center gap-3.5 mb-6 text-slate-800">
              {/* Instagram */}
              <a
                href="https://instagram.com/himasi.atmaluhur"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full border border-slate-700/80 hover:border-[#00296E] hover:text-[#00296E] hover:bg-white/60 flex items-center justify-center transition-all duration-200"
                aria-label="Instagram HIMASI"
              >
                <svg className="w-4 h-4 fill-none stroke-current stroke-[1.8]" viewBox="0 0 24 24">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
              </a>

              {/* TikTok */}
              <a
                href="https://tiktok.com/@himasi.atmaluhur"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full border border-slate-700/80 hover:border-[#00296E] hover:text-[#00296E] hover:bg-white/60 flex items-center justify-center transition-all duration-200"
                aria-label="TikTok HIMASI"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.89 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.3 0 .58.05.85.14V9.45a6.37 6.37 0 0 0-.85-.06A6.34 6.34 0 0 0 3 15.73 6.34 6.34 0 0 0 9.34 22a6.34 6.34 0 0 0 6.34-6.27V9.06a8.28 8.28 0 0 0 3.91 1V6.69z" />
                </svg>
              </a>

              {/* YouTube */}
              <a
                href="https://youtube.com/@himasiatmaluhur"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full border border-slate-700/80 hover:border-[#00296E] hover:text-[#00296E] hover:bg-white/60 flex items-center justify-center transition-all duration-200"
                aria-label="YouTube HIMASI"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </a>
            </div>

            <a
              href="mailto:himasi@atmaluhur.ac.id"
              className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 hover:text-[#00296E] transition-colors mb-3.5 block"
            >
              HIMASI Atma Luhur
            </a>

            {/* Alamat Fisik / Sekretariat */}
            <div className="text-slate-600 text-xs sm:text-sm leading-relaxed max-w-xs font-normal">
              <p>Ruang HIMPUNAN ISB Atma Luhur,</p>
              <p>Kecamatan Gabek, Pangkalpinang,</p>
              <p>Jl. Jendral Sudirman, Selindung Baru 33172</p>
            </div>
          </div>

          {/* Kolom Tengah: Interactive Connected Bracket Diagram & Center Pill CTA Button */}
          <div className="lg:col-span-4 flex items-center justify-center w-full my-4 lg:my-0">
            <div className="flex items-center justify-center w-full max-w-md">
            </div>
          </div>

          {/* Kolom Kanan: Navigasi Rata Kanan Sesuai Referensi */}
          <div className="lg:col-span-4 flex flex-col items-start lg:items-end justify-center">
            <nav aria-label="Navigasi Footer" className="flex flex-col items-start lg:items-end gap-2.5 sm:gap-3">
              <Link
                href="/"
                className="text-base sm:text-lg font-bold text-slate-800 hover:text-[#00296E] transition-colors"
              >
                Beranda
              </Link>
              <Link
                href="/profil"
                className="text-base sm:text-lg font-bold text-slate-800 hover:text-[#00296E] transition-colors"
              >
                Profil & Struktur
              </Link>
              <Link
                href="/berita"
                className="text-base sm:text-lg font-bold text-slate-800 hover:text-[#00296E] transition-colors"
              >
                Berita & Informasi
              </Link>
              <Link
                href="/tentang"
                className="text-base sm:text-lg font-bold text-slate-800 hover:text-[#00296E] transition-colors"
              >
                Tentang Kabinet
              </Link>
              <Link
                href="/kalender"
                className="text-base sm:text-lg font-bold text-slate-800 hover:text-[#00296E] transition-colors"
              >
                Kalender Kegiatan
              </Link>
            </nav>
          </div>

        </div>

        {/* Sub-footer / Copyright Row */}
        <div className="relative pt-6 pb-2 border-t border-slate-300/50 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-600 font-medium z-10">
          <Link
            href="/profil#unduhan"
            className="underline underline-offset-4 hover:text-[#00296E] transition-colors order-2 sm:order-1"
          >
          </Link>

          <p className="order-1 sm:order-2 text-center text-slate-600 font-normal">
            © 2026 HIMASI ISB Atma Luhur. All Rights Reserved
          </p>

          <Link
            href="/login"
            className="hover:text-[#00296E] transition-colors order-3 text-[11px] font-semibold text-slate-500 hover:underline flex items-center gap-1"
          >
            <span>Portal Pengurus</span>
          </Link>
        </div>

      </div>

      {/* Giant Background Watermark Text "himasi" Sesuai Referensi "medtech" */}
      <div
        aria-hidden="true"
        className="absolute bottom-0 inset-x-0 w-full overflow-hidden select-none pointer-events-none flex items-end justify-center z-0 opacity-80"
      >
        <span
          className="text-[17vw] sm:text-[18vw] lg:text-[19vw] font-black tracking-tighter leading-[0.75] text-[#00296E]/[0.10] transform translate-y-3 sm:translate-y-6"
          style={{ fontFamily: "inherit" }}
        >
          himasi
        </span>
      </div>

      {/* Modal Popup Kotak Aspirasi Cepat */}
      {isAspirasiModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => setIsAspirasiModalOpen(false)}
        >
          <div
            className="relative w-full max-w-lg rounded-2xl bg-white border border-slate-200 p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setIsAspirasiModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              aria-label="Tutup Modal"
            >
              <CloseIcon className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0094E0] to-[#00296E] flex items-center justify-center text-white">
                <MessageSquareShare className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#00296E]">Kotak Aspirasi Mahasiswa</h3>
                <p className="text-xs text-slate-500">Kirim masukan atau aspirasi secara langsung ke pengurus</p>
              </div>
            </div>

            {submitted ? (
              <div className="py-8 flex flex-col items-center justify-center text-center text-emerald-600">
                <CheckCircle2 className="w-12 h-12 mb-2 animate-bounce" />
                <h4 className="font-bold text-base text-slate-800">Aspirasi Berhasil Dikirim!</h4>
                <p className="text-xs text-slate-500 mt-1">Terima kasih atas aspirasi dan kepedulian Anda.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama / Inisial (Opsional)
                  </label>
                  <input
                    type="text"
                    value={nama}
                    onChange={(e) => setNama(e.target.value)}
                    placeholder="Contoh: Mahasiswa SI 2024 (Boleh anonim)"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#0094E0]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Pesan Aspirasi & Masukan <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={pesan}
                    onChange={(e) => setPesan(e.target.value)}
                    placeholder="Tuliskan aspirasi, fasilitas, atau saran membangun untuk HIMASI..."
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#0094E0]"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAspirasiModalOpen(false)}
                    className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#00296E] hover:bg-[#001f54] text-white text-xs font-bold shadow-md hover:shadow-lg transition-all"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Kirim Aspirasi</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </footer>
  );
}
