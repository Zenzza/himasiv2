/**
 * Tipe Data & Kontrak Fitur Audit Log Aktivitas HIMASI ISB Atma Luhur
 * Sesuai Spesifikasi Teknis: docs/superpowers/specs/2026-11-09-audit-log-aktivitas-design.md
 */

export type AuditLogModul =
  | "berita"
  | "aspirasi"
  | "apresiasi"
  | "persuratan"
  | "content-planner"
  | "absensi"
  | "kartu-qr"
  | "kalender"
  | "dokumen"
  | "banner"
  | "users"
  | "sistem"
  | "auth";

export type AuditLogStatus = "berhasil" | "gagal" | "peringatan";

export interface AuditLogItem {
  id: string;
  created_at: string;
  pengurus_id?: string | null;
  pengurus_nama: string;
  pengurus_role: string;
  modul: AuditLogModul;
  aksi: string;
  status: AuditLogStatus;
  detail?: string | null;
}

export interface AuditLogFilter {
  modul?: AuditLogModul | "semua";
  status?: AuditLogStatus | "semua";
  search?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}

export const AUDIT_LOG_MODULS: readonly AuditLogModul[] = [
  "berita",
  "aspirasi",
  "apresiasi",
  "persuratan",
  "content-planner",
  "absensi",
  "kartu-qr",
  "kalender",
  "dokumen",
  "banner",
  "users",
  "sistem",
  "auth",
] as const;

export const AUDIT_LOG_STATUSES: readonly AuditLogStatus[] = [
  "berhasil",
  "gagal",
  "peringatan",
] as const;

export const AUDIT_LOG_MODUL_LABELS: Record<AuditLogModul, string> = {
  berita: "Warta & Berita",
  aspirasi: "Kotak Aspirasi",
  apresiasi: "Apresiasi & Prestasi",
  persuratan: "Arsip Persuratan",
  "content-planner": "Content Planner",
  absensi: "Absensi & Presensi QR",
  "kartu-qr": "Kartu QR & Profil",
  kalender: "Kalender Kegiatan",
  dokumen: "Repository Dokumen",
  banner: "Banner Pengumuman",
  users: "Manajemen Pengurus",
  sistem: "Konfigurasi Sistem",
  auth: "Autentikasi & Keamanan",
};

export const AUDIT_LOG_STATUS_LABELS: Record<AuditLogStatus, string> = {
  berhasil: "Berhasil",
  gagal: "Gagal",
  peringatan: "Peringatan",
};

export const AUDIT_MODUL_LABELS = AUDIT_LOG_MODUL_LABELS;
export const AUDIT_STATUS_LABELS = AUDIT_LOG_STATUS_LABELS;

/**
 * Data mock/fallback awal saat koneksi database belum terpasang atau tabel masih kosong.
 */
export const DEFAULT_AUDIT_LOGS: AuditLogItem[] = [
  {
    id: "audit-seed-01",
    created_at: "2026-11-09T08:15:00.000Z",
    pengurus_id: "usr-admin-01",
    pengurus_nama: "Super Admin",
    pengurus_role: "super_admin",
    modul: "sistem",
    aksi: "Memperbarui konfigurasi sistem pemeliharaan website",
    status: "berhasil",
    detail: "Mode pemeliharaan dinonaktifkan untuk publik.",
  },
  {
    id: "audit-seed-02",
    created_at: "2026-11-09T09:30:00.000Z",
    pengurus_id: "usr-medkom-01",
    pengurus_nama: "Divisi Medkominfo",
    pengurus_role: "medkominfo",
    modul: "berita",
    aksi: "Mempublikasikan warta kegiatan Dies Natalis HIMASI",
    status: "berhasil",
    detail: "Slug: dies-natalis-himasi-2026",
  },
  {
    id: "audit-seed-03",
    created_at: "2026-11-09T10:00:00.000Z",
    pengurus_id: "usr-bph-01",
    pengurus_nama: "Sekretaris HIMASI",
    pengurus_role: "bph",
    modul: "absensi",
    aksi: "Membuka sesi absensi QR Rapat Pleno Semester Ganjil",
    status: "berhasil",
    detail: "Kode sesi: SESI-PLENO-202611, radius 50m",
  },
  {
    id: "audit-seed-04",
    created_at: "2026-11-09T11:45:00.000Z",
    pengurus_id: "usr-humas-01",
    pengurus_nama: "Divisi Humas",
    pengurus_role: "humas",
    modul: "aspirasi",
    aksi: "Menjawab aspirasi ASP-202611-001 terkait fasilitas lab",
    status: "berhasil",
    detail: "Jawaban tersimpan dan email notifikasi berhasil dikirim.",
  },
  {
    id: "audit-seed-05",
    created_at: "2026-11-09T13:20:00.000Z",
    pengurus_id: "usr-sekretariat-02",
    pengurus_nama: "Sekretariat HIMASI",
    pengurus_role: "bph",
    modul: "persuratan",
    aksi: "Menerbitkan surat keluar Nomor 042/HIMASI/XI/2026",
    status: "berhasil",
    detail: "Surat permohonan peminjaman ruangan aula ISB Atma Luhur.",
  },
];
