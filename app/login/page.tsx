"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { sanitizeRedirectUrl } from "@/lib/constants/error-configs";
import {
  Lock,
  EnvelopeSimple,
  ArrowLeft,
  ShieldCheck,
  Eye,
  EyeSlash,
  Spinner,
  WarningCircle,
  CheckCircle,
  ArrowRight,
  X,
  Question,
} from "@phosphor-icons/react";
import { supabase } from "@/lib/supabase/client";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawRedirect = searchParams?.get("redirect");
  const targetRedirect = sanitizeRedirectUrl(rawRedirect) || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // State untuk modal pop-up kontak admin (pengganti alert browser)
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  // State untuk aktivasi invite & reset password
  const [isInviteOrRecovery, setIsInviteOrRecovery] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSettingPassword, setIsSettingPassword] = useState(false);

  // Cek apakah ada token invite / recovery di hash URL, atau jika pengurus sudah login
  useEffect(() => {
    if (typeof window !== "undefined") {
      const hash = window.location.hash;
      if (hash.includes("type=invite") || hash.includes("type=recovery")) {
        setIsInviteOrRecovery(true);
        return;
      }
    }

    const checkSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session) {
          router.replace(targetRedirect);
        }
      } catch {
        // Abaikan jika offline / koneksi awal belum siap
      }
    };
    checkSession();
  }, [router, targetRedirect]);

  // Listener keyboard Escape untuk menutup modal bantuan
  useEffect(() => {
    if (!isContactModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsContactModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isContactModalOpen]);

  // Handle Set Password untuk Akun Undangan / Reset Password
  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setErrorMessage("Kata sandi minimal 6 karakter.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage("Konfirmasi kata sandi tidak cocok. Silakan periksa kembali.");
      return;
    }

    setIsSettingPassword(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        setErrorMessage(error.message);
        setIsSettingPassword(false);
        return;
      }

      setSuccessMessage("Kata sandi berhasil disimpan! Mengarahkan ke Dashboard Pengurus...");
      setTimeout(() => {
        router.push(targetRedirect);
      }, 1000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal menyimpan kata sandi.";
      setErrorMessage(msg);
      setIsSettingPassword(false);
    }
  };

  // Handle Login Pengurus Biasa
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          setErrorMessage(
            "Email atau kata sandi pengurus salah. Silakan periksa kembali."
          );
        } else if (error.message.includes("Email not confirmed")) {
          setErrorMessage(
            "Email belum dikonfirmasi. Cek kotak masuk email Anda atau hubungi Admin Supabase."
          );
        } else {
          setErrorMessage(error.message);
        }
        setIsLoading(false);
        return;
      }

      if (data.session) {
        setSuccessMessage("Autentikasi berhasil! Mengarahkan...");
        setTimeout(() => {
          router.push(targetRedirect);
        }, 500);
      } else {
        setIsLoading(false);
        setErrorMessage("Sesi belum dapat dibuat. Pastikan email Anda sudah terkonfirmasi.");
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat menghubungi server autentikasi.";
      setErrorMessage(msg);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-center items-center p-4 sm:p-6 lg:p-10 text-slate-800 font-sans relative overflow-x-hidden">
      
      {/* Garis Aksen Halus di Paling Atas Layar */}
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[#00296E] via-[#0094E0] to-[#00296E]" />

      {/* Kontainer Utama Responsif: Desktop Split-Screen (md:grid) & Mobile Swiss Grid (shadow-none) */}
      <div className="w-full max-w-4xl bg-white border border-slate-200 rounded-2xl md:rounded-3xl shadow-none md:shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-12 relative z-10 transition-all">
        
        {/* ======================================================== */}
        {/* PANEL KIRI: MODERN SPLIT-SCREEN BRANDING (DESKTOP SAJA)  */}
        {/* ======================================================== */}
        <div className="hidden md:flex md:col-span-5 bg-gradient-to-br from-[#00296E] via-[#003893] to-[#0094E0] text-white p-8 lg:p-10 flex-col justify-between relative overflow-hidden">
          
          {/* Aksen visual halus latar belakang */}
          <div className="absolute -bottom-16 -right-16 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -top-12 -left-12 w-40 h-40 bg-sky-400/15 rounded-full blur-xl pointer-events-none" />

          {/* Top: Tombol Kembali ke Beranda & Badge */}
          <div className="relative z-10">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs font-semibold text-white/80 hover:text-white transition-colors group cursor-pointer mb-6"
            >
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              <span>Kembali ke Beranda</span>
            </Link>
          </div>

          {/* Center: Lambang Resmi & Tipografi Kabinet */}
          <div className="relative z-10 my-8">
            <div className="w-20 h-20 rounded-2xl bg-white/95 p-3 shadow-lg border border-white/30 flex items-center justify-center mb-5 backdrop-blur-xs">
              <img
                src="/logo-himasi.png"
                alt="Logo HIMASI ISB Atma Luhur"
                className="w-full h-full object-contain select-none"
              />
            </div>

            <h1 className="text-2xl lg:text-3xl font-black tracking-tight leading-tight text-white">
              {isInviteOrRecovery ? "Aktivasi Akun" : "Portal Pengurus"}
            </h1>
            <p className="text-sm font-semibold text-sky-200 mt-1">
              Kabinet REKSABUDAYA • 2025/2026
            </p>
            <p className="text-xs text-sky-100/80 leading-relaxed mt-3 max-w-xs font-normal">
              Sistem Informasi Manajemen Terpadu untuk menunjang kegiatan operasional dan aspirasi himpunan.
            </p>
          </div>

          {/* Bottom: Ticker Status Keamanan */}
          <div className="relative z-10 pt-4 border-t border-white/15 text-[11px] font-mono text-sky-100/70 flex items-center justify-between">
            <span>SECURE GATEWAY // V2</span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              RLS AKTIF
            </span>
          </div>

        </div>

        {/* ======================================================== */}
        {/* PANEL KANAN: FORMULIR AUTENTIKASI (RESPONSIF KEDUA MODE) */}
        {/* ======================================================== */}
        <div className="col-span-1 md:col-span-7 p-6 sm:p-8 lg:p-10 flex flex-col justify-center bg-white">
          
          {/* HEADER KHUSUS MOBILE: SWISS MINIMALIST GRID TITLE BAR (< md) */}
          <div className="md:hidden block mb-6">
            <div className="border-b border-slate-200 pb-3 mb-4 flex items-center justify-between font-mono text-[11px] text-[#00296E]">
              <span className="flex items-center gap-1.5 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                PORTAL PENGURUS // HIMASI
              </span>
              <Link
                href="/"
                className="text-slate-500 hover:text-[#00296E] transition-colors"
              >
                ← Beranda
              </Link>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 p-1.5 flex items-center justify-center shrink-0">
                <img
                  src="/logo-himasi.png"
                  alt="Logo HIMASI"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h2 className="text-base font-black text-[#00296E] tracking-tight">
                  {isInviteOrRecovery ? "Aktivasi Akun Pengurus" : "Login Pengurus HIMASI"}
                </h2>
                <p className="text-[11px] text-slate-500 font-mono">
                  Kabinet REKSABUDAYA • Periode 2025/2026
                </p>
              </div>
            </div>
          </div>

          {/* HEADER KHUSUS DESKTOP (md+) */}
          <div className="hidden md:block mb-6">
            <h2 className="text-xl lg:text-2xl font-black text-[#00296E] tracking-tight">
              {isInviteOrRecovery ? "Buat Kata Sandi Baru" : "Masuk ke Dashboard"}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              {isInviteOrRecovery
                ? "Silakan tentukan kata sandi akun Anda untuk mulai mengakses sistem."
                : "Masukkan kredensial akun pengurus resmi Anda di bawah ini."}
            </p>
          </div>

          {/* Notifikasi Alert Error */}
          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
              <WarningCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium leading-relaxed">{errorMessage}</div>
            </div>
          )}

          {/* Notifikasi Alert Success */}
          {successMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium leading-relaxed">{successMessage}</div>
            </div>
          )}

          {/* FORMULIR AKTIVASI PASSWORD (INVITE / RECOVERY) */}
          {isInviteOrRecovery ? (
            <form onSubmit={handleSetPassword} className="space-y-4">
              
              {/* Input Password Baru */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 md:font-bold md:text-slate-700 font-mono md:font-sans">
                  <span className="hidden md:inline">Buat Kata Sandi Baru</span>
                  <span className="inline md:hidden text-[11px] text-[#00296E]">01. KATA SANDI BARU</span>
                  <span className="text-rose-500 ml-1">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    className="w-full pl-10 pr-10 py-2.5 sm:py-3 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00296E] focus:border-transparent transition-all"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                    aria-label={showPassword ? "Sembunyikan sandi" : "Tampilkan sandi"}
                  >
                    {showPassword ? <EyeSlash className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Input Konfirmasi Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 md:font-bold md:text-slate-700 font-mono md:font-sans">
                  <span className="hidden md:inline">Ulangi Kata Sandi Baru</span>
                  <span className="inline md:hidden text-[11px] text-[#00296E]">02. KONFIRMASI KATA SANDI</span>
                  <span className="text-rose-500 ml-1">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ketik ulang kata sandi baru"
                    className="w-full pl-10 pr-10 py-2.5 sm:py-3 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00296E] focus:border-transparent transition-all"
                  />
                  <ShieldCheck className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                    aria-label={showConfirmPassword ? "Sembunyikan sandi" : "Tampilkan sandi"}
                  >
                    {showConfirmPassword ? <EyeSlash className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSettingPassword}
                className="w-full mt-2 py-3 rounded-xl bg-[#00296E] hover:bg-[#001f54] text-white font-bold text-xs sm:text-sm shadow-sm hover:shadow transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSettingPassword ? (
                  <>
                    <Spinner className="w-4 h-4 animate-spin text-white" />
                    <span>Menyimpan Kata Sandi...</span>
                  </>
                ) : (
                  <>
                    <span>Simpan Kata Sandi &amp; Masuk Dashboard</span>
                    <ArrowRight className="w-4 h-4 text-sky-300" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* FORMULIR LOGIN REGULER */
            <form onSubmit={handleLogin} className="space-y-4">
              
              {/* Input Email */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 font-sans md:font-bold">
                  <span className="hidden md:inline">Email Akun Pengurus</span>
                  <span className="inline md:hidden text-[11px] font-mono text-[#00296E]">01. ALAMAT EMAIL PENGURUS</span>
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="pengurus@himasi.atmaluhur.ac.id"
                    className="w-full pl-10 pr-3 py-2.5 sm:py-3 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00296E] focus:border-transparent transition-all"
                  />
                  <EnvelopeSimple className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Input Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 font-sans md:font-bold">
                    <span className="hidden md:inline">Kata Sandi</span>
                    <span className="inline md:hidden text-[11px] font-mono text-[#00296E]">02. KATA SANDI</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsContactModalOpen(true)}
                    className="text-[11px] font-semibold text-[#0094E0] hover:text-[#00296E] hover:underline cursor-pointer transition-colors"
                  >
                    Lupa sandi?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan kata sandi pengurus"
                    className="w-full pl-10 pr-10 py-2.5 sm:py-3 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00296E] focus:border-transparent transition-all"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                    aria-label={showPassword ? "Sembunyikan sandi" : "Tampilkan sandi"}
                  >
                    {showPassword ? (
                      <EyeSlash className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 rounded-xl bg-[#00296E] hover:bg-[#001f54] text-white font-bold text-xs sm:text-sm shadow-sm hover:shadow transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Spinner className="w-4 h-4 animate-spin text-white" />
                    <span>Memproses Autentikasi...</span>
                  </>
                ) : (
                  <>
                    <span>Masuk ke Dashboard</span>
                    <ArrowRight className="w-4 h-4 text-sky-300" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Footer Note Pengurus */}
          <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>© 2025/2026 HIMASI ISB Atma Luhur</span>
            <span className="font-mono">PORTAL ADMIN</span>
          </div>

        </div>

      </div>

      {/* ======================================================== */}
      {/* MODAL POP-UP BANTUAN LUPA SANDI / KONTAK ADMIN           */}
      {/* ======================================================== */}
      {isContactModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="contact-modal-title"
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div
            className="fixed inset-0"
            onClick={() => setIsContactModalOpen(false)}
          />
          <div className="relative z-10 w-full max-w-sm bg-white rounded-2xl border border-slate-200 p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            
            {/* Header Modal */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-[#0094E0]">
                  <Question className="w-5 h-5 font-bold" />
                </div>
                <div>
                  <h3 id="contact-modal-title" className="text-sm font-bold text-[#00296E]">
                    Bantuan Akses Akun
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Pemulihan Kata Sandi Pengurus
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsContactModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                aria-label="Tutup modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Isi Panduan */}
            <div className="text-xs text-slate-600 leading-relaxed space-y-3 mb-6 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              <p>
                Untuk menjaga keamanan data internal himpunan, permohonan reset kata sandi pengurus dilakukan melalui verifikasi resmi.
              </p>
              <div className="pt-2 border-t border-slate-200/80 space-y-1.5 font-medium text-[11px] text-slate-700">
                <p>1. Hubungi <strong>Divisi Medkominfo HIMASI</strong> melalui grup internal pengurus.</p>
                <p>2. Atau hubungi email resmi: <a href="mailto:himasi@atmaluhur.ac.id" className="text-[#0094E0] hover:underline font-semibold">himasi@atmaluhur.ac.id</a></p>
              </div>
            </div>

            {/* Tombol Tutup */}
            <button
              type="button"
              onClick={() => setIsContactModalOpen(false)}
              className="w-full py-2.5 rounded-xl bg-[#00296E] hover:bg-[#001f54] text-white font-bold text-xs transition-colors cursor-pointer shadow-sm"
            >
              Mengerti &amp; Tutup
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f8fafc]" />}>
      <LoginContent />
    </Suspense>
  );
}
