"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Lock,
  Mail,
  ArrowLeft,
  ShieldCheck,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  ArrowRight
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Cek apakah pengurus sudah login sebelumnya
  useEffect(() => {
    const checkSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session) {
          router.replace("/dashboard");
        }
      } catch (err) {
        // Abaikan jika offline / koneksi awal belum siap
      }
    };
    checkSession();
  }, [router]);

  // Handle Login Pengurus
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
        setSuccessMessage(
          "Autentikasi berhasil! Mengarahkan ke Dashboard Pengurus..."
        );
        setTimeout(() => {
          router.push("/dashboard");
        }, 600);
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
    <div className="min-h-screen bg-gradient-to-br from-[#00173d] via-[#00296E] to-[#00173d] flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden text-slate-800 font-sans">
      
      {/* Background Decorative Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#0094E0]/15 rounded-full blur-[140px] pointer-events-none -z-0" />
      <div className="absolute -bottom-20 -right-20 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none -z-0" />

      {/* Tombol Kembali ke Beranda */}
      <div className="w-full max-w-md mb-6 z-10 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-white/80 hover:text-white transition-colors group cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span>Kembali ke Beranda HIMASI</span>
        </Link>
      </div>  

      {/* Main Card Container */}
      <div className="w-full max-w-md bg-white rounded-[28px] sm:rounded-[32px] shadow-2xl border border-white/20 p-6 sm:p-9 relative z-10 backdrop-blur-xs">
        
        {/* Header with Logo */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-gradient-to-br from-white to-sky-50 p-2 shadow-md border border-sky-100 flex items-center justify-center mb-3.5">
            <img
              src="/logo-himasi.png"
              alt="Logo HIMASI ISB Atma Luhur"
              className="w-full h-full object-contain select-none"
            />
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-[#00296E] tracking-tight">
            Portal Pengurus HIMASI
          </h1>
          <p className="text-xs sm:text-[13px] text-slate-500 mt-1 font-normal leading-relaxed">
            Sistem Informasi Manajemen Terpadu Kabinet REKSABUDAYA
          </p>
        </div>

        {/* Notifikasi Alert Error */}
        {errorMessage && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium leading-relaxed">{errorMessage}</div>
          </div>
        )}

        {/* Notifikasi Alert Success */}
        {successMessage && (
          <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium leading-relaxed">{successMessage}</div>
          </div>
        )}

        {/* Form Login Pengurus */}
        <form onSubmit={handleLogin} className="space-y-4">
          
          {/* Input Email */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Email Akun Pengurus
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
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Input Password */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Kata Sandi
              </label>
              <button
                type="button"
                onClick={() =>
                  alert(
                    "Untuk reset kata sandi akun pengurus, silakan hubungi Divisi Medkominfo atau Admin Database Supabase."
                  )
                }
                className="text-[11px] text-[#0094E0] hover:underline cursor-pointer"
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
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                aria-label={showPassword ? "Sembunyikan sandi" : "Tampilkan sandi"}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
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
            className="w-full mt-2 py-3 rounded-xl bg-[#00296E] hover:bg-[#001f54] text-white font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
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

      </div>

    </div>
  );
}
