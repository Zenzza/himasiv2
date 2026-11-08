/**
 * Tipe Data Sistem Aspirasi Mahasiswa/Alumni HIMASI ISB Atma Luhur
 * Sesuai Dokumen Desain Teknis: docs/superpowers/specs/2026-11-08-aspirasi-backend-and-dashboard-design.md
 */

export type AspirasiStatus = "baru" | "diproses" | "selesai";

export type AspirasiEmailStatus =
  | "belum_dikirim"
  | "pending"
  | "simulasi_terkirim"
  | "terkirim"
  | "gagal";

export interface AspirasiItem {
  id: string;
  nomor_tiket: string;
  email: string;
  angkatan: string;
  pesan: string;
  status: AspirasiStatus;
  jawaban_admin?: string | null;
  catatan_pengurus?: string | null; // Backward compatibility alias
  dijawab_pada?: string | null;
  dijawab_oleh?: string | null;
  status_email?: AspirasiEmailStatus;
  created_at?: string;
}

export interface AspirasiFilter {
  status?: string;
  search?: string;
}

export interface SelesaikanAspirasiInput {
  jawaban_admin: string;
  dijawab_oleh?: string;
  status_email?: AspirasiEmailStatus;
}

/**
 * Seed data default aspirasi mahasiswa & alumni untuk fallback offline / SSR
 */
export const DEFAULT_ASPIRASI_LIST: AspirasiItem[] = [
  {
    id: "asp-demo-01",
    nomor_tiket: "ASP-2026-1001",
    email: "mahasiswa.2024@atmaluhur.ac.id",
    angkatan: "2024",
    pesan: "Mohon penambahan stopkontak dan perbaikan AC di laboratorium komputer lantai 2 gedung utama agar praktikum pemrograman lebih nyaman.",
    status: "baru",
    status_email: "belum_dikirim",
    created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
  },
  {
    id: "asp-demo-02",
    nomor_tiket: "ASP-2026-1002",
    email: "si.alumni@atmaluhur.ac.id",
    angkatan: "2022",
    pesan: "Apakah bisa diadakan webinar sharing alumni mengenai persiapan karir Product Management dan UI/UX Designer di industri teknologi?",
    status: "diproses",
    status_email: "belum_dikirim",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
  },
  {
    id: "asp-demo-03",
    nomor_tiket: "ASP-2026-1003",
    email: "teguh.2023@atmaluhur.ac.id",
    angkatan: "2023",
    pesan: "Jadwal tentir UTS untuk mata kuliah Basis Data Lanjut apakah bisa diumumkan H-7 sebelum ujian agar persiapan belajar kelompok lebih optimal?",
    status: "selesai",
    jawaban_admin: "Sudah dikoordinasikan dengan Divisi Litbang untuk tentir online via Zoom pada hari Sabtu pukul 19.30 WIB.",
    catatan_pengurus: "Sudah dikoordinasikan dengan Divisi Litbang untuk tentir online via Zoom pada hari Sabtu pukul 19.30 WIB.",
    dijawab_pada: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    dijawab_oleh: "Pengurus HIMASI",
    status_email: "simulasi_terkirim",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 28).toISOString(),
  },
  {
    id: "asp-demo-04",
    nomor_tiket: "ASP-2026-1004",
    email: "tiara.siregar@mahasiswa.atmaluhur.ac.id",
    angkatan: "2025",
    pesan: "Usul pengadaan workshop Git & GitHub tingkat dasar bagi mahasiswa semester 1 sebelum memasuki tugas besar mata kuliah pemrograman web.",
    status: "baru",
    status_email: "belum_dikirim",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
];
