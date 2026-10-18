"use client";

import { useState } from "react";
import Link from "next/link";
import { Lock, Mail, ArrowLeft, ShieldCheck, CheckCircle2 } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"pengurus" | "mahasiswa">("pengurus");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password) {
      setIsSubmitted(true);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center px-4 py-12">
      {/* Back to Home Link */}
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#00296E] hover:text-[#0094E0] transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Kembali ke Beranda</span>
      </Link>

      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200/80 p-6 sm:p-8">
        {/* Header with Logo */}
        <div className="flex flex-col items-center text-center mb-6">
          <img
            src="/logo-himasi.png"
            alt="Logo HIMASI Atma Luhur"
            className="w-16 h-16 object-contain mb-3 drop-shadow-sm"
          />
          <h1 className="text-xl sm:text-2xl font-black text-[#00296E]">
            Portal HIMASI
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Sistem Informasi Terpadu & Autentikasi Anggota
          </p>
        </div>

        {/* Role Selector Tabs */}
        <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl mb-6">
          <button
            type="button"
            onClick={() => setRole("pengurus")}
            className={`py-2 text-xs font-bold rounded-lg transition-all ${
              role === "pengurus"
                ? "bg-white text-[#00296E] shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Pengurus Kabinet
          </button>
          <button
            type="button"
            onClick={() => setRole("mahasiswa")}
            className={`py-2 text-xs font-bold rounded-lg transition-all ${
              role === "mahasiswa"
                ? "bg-white text-[#00296E] shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Mahasiswa SI
          </button>
        </div>

        {isSubmitted ? (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
            <h2 className="text-sm font-bold text-emerald-800">
              Autentikasi Berhasil (Demo)
            </h2>
            <p className="text-xs text-emerald-700">
              Selamat datang kembali di Portal HIMASI ISB Atma Luhur.
            </p>
            <button
              type="button"
              onClick={() => setIsSubmitted(false)}
              className="mt-3 inline-block px-4 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700"
            >
              Reset
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {role === "pengurus" ? "Email Institusi / Akun Pengurus" : "NIM / Email Mahasiswa"}
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={
                    role === "pengurus"
                      ? "pengurus@himasi.atmaluhur.ac.id"
                      : "contoh: 2211500001"
                  }
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#00296E] focus:border-transparent"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">
                  Kata Sandi
                </label>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    alert("Silakan hubungi Divisi Kominfo/BPH HIMASI untuk reset password.");
                  }}
                  className="text-[11px] text-[#0094E0] hover:underline"
                >
                  Lupa sandi?
                </a>
              </div>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#00296E] focus:border-transparent"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-[#00296E] hover:bg-[#00173d] text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-[0.98]"
            >
              Masuk ke Portal
            </button>
          </form>
        )}

        {/* Security Footer Note */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-center gap-1.5 text-slate-400 text-[11px]">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Aman & Terenkripsi • ISB Atma Luhur</span>
        </div>
      </div>
    </div>
  );
}
