"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  Printer,
  PenNib,
  WarningCircle,
  FileText,
} from "@phosphor-icons/react";
import type {
  VotingSesi,
  VotingSuaraResult,
  VotingSummaryMetrics,
  SignatoryConfig,
} from "@/lib/types/voting";
import BeritaAcaraSignatoryModal from "./berita-acara-signatory-modal";

interface VotingBeritaAcaraTabProps {
  sesi: VotingSesi;
  metrics: VotingSummaryMetrics;
  results: VotingSuaraResult[];
  signatories: SignatoryConfig;
  onUpdateSignatories: (newConfig: SignatoryConfig) => void;
}

export default function VotingBeritaAcaraTab({
  sesi,
  metrics,
  results,
  signatories,
  onUpdateSignatories,
}: VotingBeritaAcaraTabProps) {
  const [showConfigModal, setShowConfigModal] = useState(false);

  const handlePrint = () => {
    window.print();
  };

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
  const hari = dayNames[now.getDay()];
  const tanggal = `${now.getDate()} ${monthNames[now.getMonth()]} ${now.getFullYear()}`;
  const nomorSurat = `001/BA-EVOTE/HIMASI/XI/${now.getFullYear()}`;

  return (
    <div className="space-y-6">
      {/* 1. Action Bar (Hidden on print) */}
      <div className="bg-white dark:bg-[#001438] border border-[#00296E]/15 dark:border-white/10 rounded-none p-5 shadow-none flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FileText className="w-4 h-4 text-[#00296E] dark:text-[#38BDF8]" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white font-mono uppercase tracking-wider">
              Berita Acara Rekapitulasi Suara Resmi
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Format lembar dokumen surat keputusan resmi HIMASI Atma Luhur siap cetak PDF / arsip fisik.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowConfigModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 border border-[#00296E]/20 dark:border-white/20 rounded-none transition cursor-pointer"
          >
            <PenNib className="w-3.5 h-3.5" />
            Atur Penandatangan
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white bg-[#00296E] hover:bg-[#001f54] rounded-none shadow-none transition cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Cetak / Simpan PDF
          </button>
        </div>
      </div>

      {/* Warning jika hasil masih dikunci */}
      {!sesi.is_results_unlocked && (
        <div className="p-4 rounded-none bg-amber-500/10 border border-amber-500/30 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-3 print:hidden">
          <WarningCircle className="w-5 h-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-bold font-mono uppercase tracking-wider">Perhatian: Hasil Suara Belum Diungkap</p>
            <p className="text-[11px] leading-relaxed text-amber-800 dark:text-amber-300">
              Kotak suara masih dalam status terkunci (Blind Voting). Tabel perolehan suara pada Berita
              Acara di bawah ini menampilkan estimasi angka sementara atau tanda sensor sampai kotak
              suara resmi dibuka pada sub-tab &quot;Sesi &amp; Quick Count&quot;.
            </p>
          </div>
        </div>
      )}

      {/* 2. Lembar Fisik Berita Acara (A4 Sheet Preview & Print Target) */}
      <div className="bg-slate-100 dark:bg-[#001740] p-4 sm:p-8 rounded-none border border-[#00296E]/15 dark:border-white/10 print:bg-white print:border-none print:p-0">
        <div className="max-w-[794px] mx-auto bg-white text-slate-900 border border-slate-300 dark:border-slate-700 shadow-none p-8 sm:p-12 print:border-none print:shadow-none print:p-0 print:max-w-none print:text-black">
          {/* KOP SURAT RESMI HIMASI */}
          <div className="pb-3 border-b-2 border-black flex items-center gap-4">
            <div className="relative w-18 h-18 shrink-0">
              <Image
                src="/logo-himasi.png"
                alt="Logo HIMASI"
                width={72}
                height={72}
                className="object-contain"
                priority
              />
            </div>
            <div className="flex-1 text-center font-serif">
              <h2 className="text-sm sm:text-base font-bold tracking-wider uppercase text-slate-900 leading-tight">
                HIMPUNAN MAHASISWA SISTEM INFORMASI (HIMASI)
              </h2>
              <h1 className="text-base sm:text-lg font-black tracking-wide uppercase text-slate-950 leading-tight">
                INSTITUT SAINS DAN BISNIS ATMA LUHUR
              </h1>
              <p className="text-[10px] text-slate-600 font-sans mt-0.5 leading-snug">
                Sekretariat: Kampus ISB Atma Luhur, Jl. Jend. Sudirman, Selindung Baru, Pangkalpinang, Bangka Belitung 33117
                <br />
                Email: himasi@atmaluhur.ac.id • Laman: himasi.atmaluhur.ac.id
              </p>
            </div>
          </div>
          <div className="h-0.5 bg-black mt-0.5 mb-6" />

          {/* JUDUL DOKUMEN BERITA ACARA */}
          <div className="text-center space-y-1 mb-6">
            <h3 className="font-serif font-black text-sm sm:text-base tracking-wide uppercase underline underline-offset-4">
              BERITA ACARA REKAPITULASI HASIL PEMUNGUTAN SUARA
            </h3>
            <p className="font-serif font-bold text-xs uppercase text-slate-800">
              PEMILIHAN KETUA HIMPUNAN MAHASISWA SISTEM INFORMASI (E-VOTING)
            </p>
            <p className="font-mono text-xs text-slate-700">
              Nomor: <span className="font-bold">{nomorSurat}</span>
            </p>
          </div>

          {/* PARAGRAF RECITALS */}
          <div className="space-y-3 text-xs leading-relaxed text-justify mb-5">
            <p>
              Pada hari ini <span className="font-bold">{hari}</span> tanggal{" "}
              <span className="font-bold">{tanggal}</span>, bertempat di Sekretariat HIMASI Kampus ISB
              Atma Luhur Pangkalpinang, telah diselenggarakan proses pemungutan dan penghitungan suara
              secara elektronik (E-Voting) untuk menetapkan Ketua Himpunan Mahasiswa Sistem Informasi
              Periode <strong>{sesi.tahun_periode}</strong> dengan hasil rekapitulasi sebagai berikut:
            </p>
          </div>

          {/* TABEL 1: REKAPITULASI PEMILIH */}
          <div className="mb-5 space-y-1">
            <h4 className="text-xs font-bold uppercase tracking-wide font-sans">
              I. REKAPITULASI DATA PEMILIH DAN PENGGUNA HAK PILIH
            </h4>
            <table className="w-full text-xs border border-black border-collapse">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-black p-1.5 text-center w-10">No</th>
                  <th className="border border-black p-1.5 text-left">Uraian Rekapitulasi</th>
                  <th className="border border-black p-1.5 text-center w-28">Jumlah</th>
                  <th className="border border-black p-1.5 text-center w-24">Persentase</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-black p-1.5 text-center font-mono">1</td>
                  <td className="border border-black p-1.5">Jumlah Daftar Pemilih Tetap (DPT) Terdaftar</td>
                  <td className="border border-black p-1.5 text-center font-mono font-bold">{metrics.total_dpt}</td>
                  <td className="border border-black p-1.5 text-center font-mono">100.0%</td>
                </tr>
                <tr>
                  <td className="border border-black p-1.5 text-center font-mono">2</td>
                  <td className="border border-black p-1.5">Jumlah Surat Suara Sah Masuk (Hak Pilih Digunakan)</td>
                  <td className="border border-black p-1.5 text-center font-mono font-bold text-emerald-800">{metrics.suara_masuk}</td>
                  <td className="border border-black p-1.5 text-center font-mono font-bold">{metrics.persentase_partisipasi}%</td>
                </tr>
                <tr>
                  <td className="border border-black p-1.5 text-center font-mono">3</td>
                  <td className="border border-black p-1.5">Jumlah Mahasiswa Tidak Menggunakan Hak Pilih (Golput)</td>
                  <td className="border border-black p-1.5 text-center font-mono">{metrics.belum_memilih}</td>
                  <td className="border border-black p-1.5 text-center font-mono">
                    {metrics.total_dpt > 0 ? (100 - metrics.persentase_partisipasi).toFixed(1) : 0}%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* TABEL 2: PEROLEHAN SUARA KANDIDAT */}
          <div className="mb-6 space-y-1">
            <h4 className="text-xs font-bold uppercase tracking-wide font-sans">
              II. REKAPITULASI PEROLEHAN SUARA KANDIDAT / PILIHAN
            </h4>
            <table className="w-full text-xs border border-black border-collapse">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-black p-1.5 text-center w-12">No. Urut</th>
                  <th className="border border-black p-1.5 text-left">Nama Calon Ketua / Opsi Pilihan</th>
                  <th className="border border-black p-1.5 text-center w-28">Perolehan Suara</th>
                  <th className="border border-black p-1.5 text-center w-24">Persentase</th>
                  <th className="border border-black p-1.5 text-center w-32">Keterangan</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <tr key={r.kandidat_id}>
                    <td className="border border-black p-1.5 text-center font-mono font-bold">
                      {String(r.nomor_urut).padStart(2, "0")}
                    </td>
                    <td className="border border-black p-1.5 font-bold">
                      {r.nama_calon}
                    </td>
                    <td className="border border-black p-1.5 text-center font-mono font-bold">
                      {sesi.is_results_unlocked ? r.total_suara : "•• (Terkunci)"}
                    </td>
                    <td className="border border-black p-1.5 text-center font-mono">
                      {sesi.is_results_unlocked ? `${r.persentase}%` : "••%"}
                    </td>
                    <td className="border border-black p-1.5 text-center font-sans text-[11px]">
                      {sesi.is_results_unlocked && r.is_winner ? (
                        <span className="font-bold text-emerald-800">Suara Terbanyak</span>
                      ) : sesi.is_results_unlocked ? (
                        "-"
                      ) : (
                        "Blind Count"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* PERNYATAAN KESIMPULAN LEGAL */}
          <div className="text-xs leading-relaxed text-justify mb-8">
            <p>
              Demikian Berita Acara Rekapitulasi ini dibuat dan ditandatangani oleh Panitia Pemilihan (KPU)
              dan para saksi resmi dalam keadaan sadar, tertib, dan tanpa ada paksaan dari pihak mana pun,
              untuk dipergunakan sebagaimana mestinya sebagai penetapan keabsahan kepengurusan HIMASI ISB
              Atma Luhur Periode {sesi.tahun_periode}.
            </p>
          </div>

          {/* TANDA TANGAN RESMI */}
          <div className="pt-2">
            <div className="grid grid-cols-2 gap-8 text-center text-xs">
              {/* Kolom Kiri: Saksi-Saksi */}
              <div className="space-y-12">
                <div>
                  <p className="font-bold">Saksi Calon 01,</p>
                  <div className="h-16" />
                  <p className="font-bold underline uppercase">{signatories.nama_saksi_1}</p>
                  <p className="font-mono text-[10px]">NIM. {signatories.nim_saksi_1}</p>
                </div>

                <div>
                  <p className="font-bold">Saksi Kotak Kosong / Independen,</p>
                  <div className="h-16" />
                  <p className="font-bold underline uppercase">{signatories.nama_saksi_2}</p>
                  <p className="font-mono text-[10px]">NIM. {signatories.nim_saksi_2}</p>
                </div>
              </div>

              {/* Kolom Kanan: KPU & Ketua Umum */}
              <div className="space-y-12">
                <div>
                  <p className="font-bold">Ketua Panitia Pemilihan / KPU,</p>
                  <div className="h-16" />
                  <p className="font-bold underline uppercase">{signatories.nama_ketua_kpu}</p>
                  <p className="font-mono text-[10px]">NIM. {signatories.nim_ketua_kpu}</p>
                </div>

                <div>
                  <p className="font-bold">Mengetahui,<br />Ketua Umum HIMASI,</p>
                  <div className="h-14" />
                  <p className="font-bold underline uppercase">{signatories.nama_ketua_umum}</p>
                  <p className="font-mono text-[10px]">NIM. {signatories.nim_ketua_umum}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Pengaturan Penandatangan */}
      <BeritaAcaraSignatoryModal
        isOpen={showConfigModal}
        currentSignatories={signatories}
        onClose={() => setShowConfigModal(false)}
        onSave={onUpdateSignatories}
      />
    </div>
  );
}
