"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  SealCheck,
  Check,
  Copy,
  Printer,
  House,
  ShieldCheck,
} from "@phosphor-icons/react";

interface StepCompletedProps {
  receiptId: string;
  voterName: string;
  voterNIM: string;
  tahunPeriode?: string;
}

export default function StepCompleted({
  receiptId,
  voterName,
  voterNIM,
  tahunPeriode = "2026/2027",
}: StepCompletedProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyReceipt = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(receiptId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const formattedDate = useMemo(() => {
    const now = new Date();
    const dayNames = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    const monthNames = [
      "Januari",
      "Februari",
      "Maret",
      "April",
      "Mei",
      "Juni",
      "Juli",
      "Agustus",
      "September",
      "Oktober",
      "November",
      "Desember",
    ];
    return `${dayNames[now.getDay()]}, ${now.getDate()} ${
      monthNames[now.getMonth()]
    } ${now.getFullYear()} • ${now.toLocaleTimeString("id-ID")}`;
  }, []);

  return (
    <div className="max-w-2xl mx-auto space-y-6 sm:space-y-8 animate-in fade-in zoom-in-95 duration-200 font-poppins">
      {/* Celebration Header */}
      <div className="text-center space-y-3">
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto shadow-sm">
          <SealCheck className="w-12 h-12 sm:w-14 sm:h-14" weight="fill" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#00296E] font-poppins tracking-tight">
            Suara Anda Berhasil Disimpan!
          </h2>
          <p className="text-sm sm:text-base text-slate-600 font-poppins leading-relaxed max-w-lg mx-auto">
            Terima kasih telah menyalurkan hak suara Anda dalam pesta demokrasi pemilihan Ketua Himpunan Mahasiswa Sistem Informasi.
          </p>
        </div>
      </div>

      {/* Official Physical / Digital Receipt Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6 relative overflow-hidden print:bg-white print:text-black print:border-slate-300">
        {/* Receipt Header with Logo */}
        <div className="flex items-center gap-4 pb-4 border-b border-slate-100 print:border-slate-300">
          <div className="relative w-14 h-14 shrink-0 bg-slate-50 border border-slate-100 rounded-xl p-1 shadow-xs">
            <Image
              src="/logo-himasi.png"
              alt="Logo HIMASI"
              width={56}
              height={56}
              className="object-contain"
            />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#00296E] block print:text-blue-700 font-poppins">
              BUKTI TANDA TERIMA ELEKTRONIK RESMI
            </span>
            <h3 className="text-sm sm:text-base font-bold text-slate-950 uppercase font-poppins truncate print:text-black">
              E-VOTING KETUA HIMASI ISB ATMA LUHUR
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 print:text-slate-600 font-poppins">
              Periode {tahunPeriode} • KPU HIMASI
            </p>
          </div>
        </div>

        {/* Receipt Code Box */}
        <div className="p-4 sm:p-5 rounded-2xl bg-sky-50/70 border border-sky-100 flex items-center justify-between gap-3 print:bg-slate-50 print:border-slate-300">
          <div>
            <span className="text-xs sm:text-sm font-semibold uppercase text-slate-500 print:text-slate-600 block font-poppins">
              Kode Tanda Terima:
            </span>
            <span className="font-poppins text-lg sm:text-xl md:text-2xl font-black text-[#00296E] tracking-wider print:text-blue-900 select-all">
              {receiptId}
            </span>
          </div>

          <button
            type="button"
            onClick={handleCopyReceipt}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs sm:text-sm font-semibold shadow-xs transition flex items-center gap-1.5 print:hidden cursor-pointer shrink-0 font-poppins"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" weight="bold" />
                <span className="text-emerald-700 font-bold">Tersalin</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-slate-600" />
                <span>Salin</span>
              </>
            )}
          </button>
        </div>

        {/* Voter & Submission Metadata */}
        <div className="space-y-3 text-sm sm:text-base font-poppins">
          <div className="flex items-center justify-between py-2 border-b border-slate-100 print:border-slate-200">
            <span className="text-slate-500 print:text-slate-600">Nama Pemilih:</span>
            <span className="font-bold text-slate-950 print:text-black">{voterName}</span>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-slate-100 print:border-slate-200">
            <span className="text-slate-500 print:text-slate-600">NIM Pemilih:</span>
            <span className="font-bold text-slate-950 print:text-black">{voterNIM}</span>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-slate-100 print:border-slate-200">
            <span className="text-slate-500 print:text-slate-600">Waktu Pencoblosan:</span>
            <span className="text-slate-700 print:text-slate-800 text-xs sm:text-sm">
              {formattedDate}
            </span>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-slate-100 print:border-slate-200">
            <span className="text-slate-500 print:text-slate-600">Status Hak Suara:</span>
            <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-xs sm:text-sm print:text-emerald-700">
              <ShieldCheck className="w-4 h-4" weight="bold" />
              SUARA SAH TERSIMPAN
            </span>
          </div>
        </div>

        {/* Legal Secrecy Guarantee Notice */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-600 leading-relaxed font-poppins print:text-slate-700 print:border-slate-300">
          <strong className="block text-[#00296E] uppercase text-xs sm:text-sm mb-1 print:text-blue-900">
            Kerahasiaan Suara Dijamin Mutlak:
          </strong>
          Sesuai Asas Rahasia Pemilu (LUBER JURDIL), tanda terima ini membuktikan bahwa Anda telah menggunakan hak suara secara sah tanpa menyimpan pilihan pasangan calon Anda.
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 print:hidden">
          <button
            type="button"
            onClick={handlePrint}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm sm:text-base border border-slate-200 transition cursor-pointer font-poppins"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Tanda Terima</span>
          </button>

          <Link
            href="/"
            onClick={() => {
              if (typeof window !== "undefined") {
                sessionStorage.removeItem("himasi_evoting_student_session");
              }
            }}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#00296E] to-[#0094e0] hover:from-[#001f54] hover:to-[#0080c4] text-white font-bold text-sm sm:text-base shadow-md transition font-poppins"
          >
            <House className="w-4 h-4" weight="bold" />
            <span>Kembali ke Beranda HIMASI</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

