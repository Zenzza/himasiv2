/**
 * Kontrak Tipe Data, Pemetaan Gaya Visual & Data Awal Modul Content Planning & Strategy HIMASI
 * Sesuai Revisi Permintaan Pengguna:
 * 1. Platform tanpa LinkedIn
 * 2. Jenis Konten: Edukasi, PHB, Apresia-SI, Pemberitahuan
 * 3. Tipe Konten (Format): Feeds, Reels, Short Video, Story
 * 4. Kolom Objective dihapus / opsional
 * 5. Status: Planning, On Proses, Revisi, Review, Publish (terhubung dua arah dengan Progress bar secara realtime)
 * 6. Tahun: 2026 & 2027
 */

// ============================================================================
// 1. UNION TYPES
// ============================================================================

export type PlatformKonten =
  | "TikTok"
  | "Instagram"
  | "YouTube"
  | "Web"
  | "Lainnya";

export type JenisKonten =
  | "Edukasi"
  | "PHB"
  | "Apresia-SI"
  | "Pemberitahuan";

// Alias agar kompatibel dengan kode sebelumnya
export type TipeKonten = JenisKonten;

export type FormatKonten =
  | "Feeds"
  | "Reels"
  | "Short Video"
  | "Story";

// Alias agar kompatibel dengan kolom DB 'konsep'
export type KonsepKonten = FormatKonten;

export type ObjektifKonten = string;

export type StatusKonten =
  | "Planning"
  | "On Proses"
  | "Revisi"
  | "Review"
  | "Publish";

// ============================================================================
// 2. OPTIONS LISTS
// ============================================================================

export const PLATFORM_OPTIONS: readonly PlatformKonten[] = [
  "TikTok",
  "Instagram",
  "YouTube",
  "Web",
  "Lainnya",
] as const;

export const JENIS_KONTEN_OPTIONS: readonly JenisKonten[] = [
  "Edukasi",
  "PHB",
  "Apresia-SI",
  "Pemberitahuan",
] as const;

export const TIPE_KONTEN_OPTIONS = JENIS_KONTEN_OPTIONS;

export const FORMAT_KONTEN_OPTIONS: readonly FormatKonten[] = [
  "Feeds",
  "Reels",
  "Short Video",
  "Story",
] as const;

export const KONSEP_OPTIONS = FORMAT_KONTEN_OPTIONS;

export const STATUS_OPTIONS: readonly StatusKonten[] = [
  "Planning",
  "On Proses",
  "Revisi",
  "Review",
  "Publish",
] as const;

// ============================================================================
// 3. REAKTIVITAS DUA ARAH: STATUS <-> PROGRESS BAR
// ============================================================================

export function getProgressForStatus(status: StatusKonten): number {
  switch (status) {
    case "Planning":
      return 0;
    case "On Proses":
      return 25;
    case "Revisi":
      return 50;
    case "Review":
      return 75;
    case "Publish":
      return 100;
    default:
      return 0;
  }
}

export function getStatusForProgress(progress: number): StatusKonten {
  if (progress <= 0) return "Planning";
  if (progress < 50) return "On Proses";
  if (progress < 75) return "Revisi";
  if (progress < 100) return "Review";
  return "Publish";
}

// ============================================================================
// 4. STYLE DEFINITIONS (SWISS MINIMALIST PALETTE)
// ============================================================================

export interface ContentBadgeStyle {
  label: string;
  bg: string;
  text: string;
  border: string;
  dot: string;
  className: string;
}

export const TIPE_KONTEN_STYLES: Record<JenisKonten, ContentBadgeStyle> = {
  Edukasi: {
    label: "Edukasi",
    bg: "bg-emerald-50 dark:bg-emerald-950/70",
    text: "text-emerald-800 dark:text-emerald-200",
    border: "border-emerald-300 dark:border-emerald-700/60",
    dot: "bg-emerald-500",
    className: "bg-emerald-50 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700/60",
  },
  PHB: {
    label: "PHB",
    bg: "bg-purple-50 dark:bg-purple-950/70",
    text: "text-purple-800 dark:text-purple-200",
    border: "border-purple-300 dark:border-purple-700/60",
    dot: "bg-purple-500",
    className: "bg-purple-50 dark:bg-purple-950/70 text-purple-800 dark:text-purple-200 border-purple-300 dark:border-purple-700/60",
  },
  "Apresia-SI": {
    label: "Apresia-SI",
    bg: "bg-amber-50 dark:bg-amber-950/70",
    text: "text-amber-800 dark:text-amber-200",
    border: "border-amber-300 dark:border-amber-700/60",
    dot: "bg-amber-500",
    className: "bg-amber-50 dark:bg-amber-950/70 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-700/60",
  },
  Pemberitahuan: {
    label: "Pemberitahuan",
    bg: "bg-sky-50 dark:bg-sky-950/70",
    text: "text-sky-800 dark:text-sky-200",
    border: "border-sky-300 dark:border-sky-700/60",
    dot: "bg-sky-500",
    className: "bg-sky-50 dark:bg-sky-950/70 text-sky-800 dark:text-sky-200 border-sky-300 dark:border-sky-700/60",
  },
};

export const JENIS_KONTEN_STYLES = TIPE_KONTEN_STYLES;

export const KONSEP_STYLES: Record<FormatKonten, ContentBadgeStyle> = {
  Feeds: {
    label: "Feeds",
    bg: "bg-blue-50 dark:bg-blue-950/70",
    text: "text-blue-800 dark:text-blue-200",
    border: "border-blue-300 dark:border-blue-700/60",
    dot: "bg-blue-500",
    className: "bg-blue-50 dark:bg-blue-950/70 text-blue-800 dark:text-blue-200 border-blue-300 dark:border-blue-700/60",
  },
  Reels: {
    label: "Reels",
    bg: "bg-rose-50 dark:bg-rose-950/70",
    text: "text-rose-800 dark:text-rose-200",
    border: "border-rose-300 dark:border-rose-700/60",
    dot: "bg-rose-500",
    className: "bg-rose-50 dark:bg-rose-950/70 text-rose-800 dark:text-rose-200 border-rose-300 dark:border-rose-700/60",
  },
  "Short Video": {
    label: "Short Video",
    bg: "bg-red-50 dark:bg-red-950/70",
    text: "text-red-800 dark:text-red-200",
    border: "border-red-300 dark:border-red-700/60",
    dot: "bg-red-500",
    className: "bg-red-50 dark:bg-red-950/70 text-red-800 dark:text-red-200 border-red-300 dark:border-red-700/60",
  },
  Story: {
    label: "Story",
    bg: "bg-orange-50 dark:bg-orange-950/70",
    text: "text-orange-800 dark:text-orange-200",
    border: "border-orange-300 dark:border-orange-700/60",
    dot: "bg-orange-500",
    className: "bg-orange-50 dark:bg-orange-950/70 text-orange-800 dark:text-orange-200 border-orange-300 dark:border-orange-700/60",
  },
};

export const FORMAT_KONTEN_STYLES = KONSEP_STYLES;

export const STATUS_STYLES: Record<StatusKonten, ContentBadgeStyle> = {
  Planning: {
    label: "Planning",
    bg: "bg-slate-100 dark:bg-slate-800/80",
    text: "text-slate-700 dark:text-slate-200",
    border: "border-slate-300 dark:border-slate-700",
    dot: "bg-slate-500 dark:bg-slate-400",
    className: "bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700",
  },
  "On Proses": {
    label: "On Proses",
    bg: "bg-sky-50 dark:bg-sky-950/70",
    text: "text-sky-800 dark:text-sky-200",
    border: "border-sky-300 dark:border-sky-700/60",
    dot: "bg-sky-500",
    className: "bg-sky-50 dark:bg-sky-950/70 text-sky-800 dark:text-sky-200 border-sky-300 dark:border-sky-700/60",
  },
  Revisi: {
    label: "Revisi",
    bg: "bg-amber-50 dark:bg-amber-950/70",
    text: "text-amber-800 dark:text-amber-200",
    border: "border-amber-300 dark:border-amber-700/60",
    dot: "bg-amber-500",
    className: "bg-amber-50 dark:bg-amber-950/70 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-700/60",
  },
  Review: {
    label: "Review",
    bg: "bg-purple-50 dark:bg-purple-950/70",
    text: "text-purple-800 dark:text-purple-200",
    border: "border-purple-300 dark:border-purple-700/60",
    dot: "bg-purple-500",
    className: "bg-purple-50 dark:bg-purple-950/70 text-purple-800 dark:text-purple-200 border-purple-300 dark:border-purple-700/60",
  },
  Publish: {
    label: "Publish",
    bg: "bg-emerald-50 dark:bg-emerald-950/70",
    text: "text-emerald-800 dark:text-emerald-200",
    border: "border-emerald-300 dark:border-emerald-700/60",
    dot: "bg-emerald-500",
    className: "bg-emerald-50 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700/60",
  },
};

// ============================================================================
// 5. DATA INTERFACES
// ============================================================================

export interface ContentPlanItem {
  id: string;
  tanggal: string; // Format YYYY-MM-DD
  calendar_week: number;
  day_of_week: string; // Misal 'Sunday', 'Monday'
  platform: PlatformKonten;
  tipe_konten: JenisKonten;
  topik: string;
  konsep: FormatKonten;
  objektif?: string | null;
  status: StatusKonten;
  referensi_url: string | null;
  progress: number; // 0 - 100
  is_done: boolean;
  catatan?: string | null;
  created_by?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ContentPlanInput {
  tanggal: string; // Format YYYY-MM-DD
  calendar_week: number;
  day_of_week: string;
  platform: PlatformKonten;
  tipe_konten: JenisKonten;
  topik: string;
  konsep: FormatKonten;
  objektif?: string | null;
  status: StatusKonten;
  referensi_url?: string | null;
  progress: number;
  is_done: boolean;
  catatan?: string | null;
  created_by?: string | null;
}

export interface CalendarWeekGroup {
  calendar_week: number;
  year: number;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  items: ContentPlanItem[];
}

// ============================================================================
// 6. DEFAULT SEED DATA (14 ROWS TAHUN 2026: CW 45 & CW 46)
// CW 45 adalah minggu berjalan (1 Nov - 7 Nov 2026)
// CW 46 adalah minggu berikutnya (8 Nov - 14 Nov 2026)
// ============================================================================

export const DEFAULT_CONTENT_PLANS: ContentPlanItem[] = [
  // --- CW 45 (1 November - 7 November 2026) - MINGGU BERJALAN ---
  {
    id: "cp-2026-cw45-01",
    tanggal: "2026-11-01",
    calendar_week: 45,
    day_of_week: "Sunday",
    platform: "Instagram",
    tipe_konten: "Edukasi",
    topik: "Roadmap Belajar UI/UX & Web Development untuk Mahasiswa Sistem Informasi",
    konsep: "Feeds",
    status: "Publish",
    referensi_url: "https://instagram.com/himasi_isb",
    progress: 100,
    is_done: true,
    catatan: "Desain carousel Swiss typography, cover kontras tinggi",
    created_at: "2026-10-28T10:00:00.000Z",
    updated_at: "2026-11-01T14:30:00.000Z",
  },
  {
    id: "cp-2026-cw45-02",
    tanggal: "2026-11-02",
    calendar_week: 45,
    day_of_week: "Monday",
    platform: "Instagram",
    tipe_konten: "PHB",
    topik: "Peringatan Hari Pahlawan Nasional 2026 - Semangat Juang Mahasiswa Teknologi",
    konsep: "Story",
    status: "Publish",
    referensi_url: "https://drive.google.com/drive/folders/himasi-cw45",
    progress: 100,
    is_done: true,
    catatan: "Template resmi poster HIMASI, repost di Story pengurus",
    created_at: "2026-10-29T08:00:00.000Z",
    updated_at: "2026-11-02T16:00:00.000Z",
  },
  {
    id: "cp-2026-cw45-03",
    tanggal: "2026-11-03",
    calendar_week: 45,
    day_of_week: "Tuesday",
    platform: "TikTok",
    tipe_konten: "Edukasi",
    topik: "5 Tips Menghadapi Ujian Praktikum Basis Data & Algoritma Pemrograman",
    konsep: "Reels",
    status: "Publish",
    referensi_url: null,
    progress: 100,
    is_done: true,
    catatan: "Talent: Tim Medkominfo & Lab Komputer",
    created_at: "2026-10-30T09:00:00.000Z",
    updated_at: "2026-11-03T17:15:00.000Z",
  },
  {
    id: "cp-2026-cw45-04",
    tanggal: "2026-11-04",
    calendar_week: 45,
    day_of_week: "Wednesday",
    platform: "TikTok",
    tipe_konten: "Apresia-SI",
    topik: "Selamat Atas Prestasi Tim Mahasiswa ISB Juara Hackathon Nasional 2026",
    konsep: "Short Video",
    status: "Publish",
    referensi_url: "https://tiktok.com/@himasi_isb",
    progress: 100,
    is_done: true,
    catatan: "Format video transisi wawancara pemenang",
    created_at: "2026-10-31T11:00:00.000Z",
    updated_at: "2026-11-04T18:00:00.000Z",
  },
  {
    id: "cp-2026-cw45-05",
    tanggal: "2026-11-05",
    calendar_week: 45,
    day_of_week: "Thursday",
    platform: "Instagram",
    tipe_konten: "Pemberitahuan",
    topik: "Jadwal Pengisian KRS Susulan & Batas Akhir Pembayaran Administrasi",
    konsep: "Feeds",
    status: "Publish",
    referensi_url: "https://drive.google.com/drive/folders/himasi-cw45-krs",
    progress: 100,
    is_done: true,
    catatan: "Infografis batas tanggal dan alur akademik BAAK",
    created_at: "2026-11-01T08:30:00.000Z",
    updated_at: "2026-11-05T15:45:00.000Z",
  },
  {
    id: "cp-2026-cw45-06",
    tanggal: "2026-11-06",
    calendar_week: 45,
    day_of_week: "Friday",
    platform: "Instagram",
    tipe_konten: "Edukasi",
    topik: "Pengenalan Arsitektur Cloud Computing & Microservices untuk Skripsi",
    konsep: "Feeds",
    status: "Review",
    referensi_url: "https://drive.google.com/file/d/himasi-cloud-article",
    progress: 75,
    is_done: false,
    catatan: "Final review materi oleh Ketua Divisi Medkominfo",
    created_at: "2026-11-02T13:00:00.000Z",
    updated_at: "2026-11-06T10:00:00.000Z",
  },
  {
    id: "cp-2026-cw45-07",
    tanggal: "2026-11-07",
    calendar_week: 45,
    day_of_week: "Saturday",
    platform: "TikTok",
    tipe_konten: "PHB",
    topik: "Highlight Keseruan Welcoming Party & Temu Keakraban Mahasiswa Baru SI 2026",
    konsep: "Short Video",
    status: "On Proses",
    referensi_url: null,
    progress: 25,
    is_done: false,
    catatan: "Tahap perakitan footage video kegiatan outdoor kampus",
    created_at: "2026-11-03T14:00:00.000Z",
    updated_at: "2026-11-07T09:00:00.000Z",
  },

  // --- CW 46 (8 November - 14 November 2026) - MINGGU DEPAN ---
  {
    id: "cp-2026-cw46-01",
    tanggal: "2026-11-08",
    calendar_week: 46,
    day_of_week: "Sunday",
    platform: "Instagram",
    tipe_konten: "Edukasi",
    topik: "Tutorial Git & GitHub Collaboration untuk Pemula di Tim Proyek",
    konsep: "Feeds",
    status: "Planning",
    referensi_url: null,
    progress: 0,
    is_done: false,
    catatan: "Naskah slide materi dasar: clone, branch, commit, push, PR",
    created_at: "2026-11-04T10:00:00.000Z",
    updated_at: "2026-11-04T10:00:00.000Z",
  },
  {
    id: "cp-2026-cw46-02",
    tanggal: "2026-11-09",
    calendar_week: 46,
    day_of_week: "Monday",
    platform: "Instagram",
    tipe_konten: "Pemberitahuan",
    topik: "Pengumuman Open Recruitment Panitia Dies Natalis HIMASI Ke-24",
    konsep: "Story",
    status: "Planning",
    referensi_url: null,
    progress: 0,
    is_done: false,
    catatan: "Poster rekrutmen divisi acara, humas, medkom, konsumsi",
    created_at: "2026-11-04T11:00:00.000Z",
    updated_at: "2026-11-04T11:00:00.000Z",
  },
  {
    id: "cp-2026-cw46-03",
    tanggal: "2026-11-10",
    calendar_week: 46,
    day_of_week: "Tuesday",
    platform: "TikTok",
    tipe_konten: "Edukasi",
    topik: "Perbedaan Nyata Frontend Dev vs Backend Dev vs UI/UX Designer",
    konsep: "Short Video",
    status: "Planning",
    referensi_url: null,
    progress: 0,
    is_done: false,
    catatan: "Format video interaktif di lab komputer",
    created_at: "2026-11-04T12:00:00.000Z",
    updated_at: "2026-11-04T12:00:00.000Z",
  },
  {
    id: "cp-2026-cw46-04",
    tanggal: "2026-11-11",
    calendar_week: 46,
    day_of_week: "Wednesday",
    platform: "Instagram",
    tipe_konten: "Apresia-SI",
    topik: "Apresiasi Wisudawan Terbaik & Peraih IPK Tertinggi Prodi SI 2026",
    konsep: "Feeds",
    status: "Planning",
    referensi_url: null,
    progress: 0,
    is_done: false,
    catatan: "Profil singkat wisudawan dan kutipan motivasi",
    created_at: "2026-11-04T13:00:00.000Z",
    updated_at: "2026-11-04T13:00:00.000Z",
  },
  {
    id: "cp-2026-cw46-05",
    tanggal: "2026-11-12",
    calendar_week: 46,
    day_of_week: "Thursday",
    platform: "YouTube",
    tipe_konten: "Edukasi",
    topik: "Tips Membuat Portofolio UI/UX yang Dilirik Recruiter Tech Company",
    konsep: "Short Video",
    status: "Planning",
    referensi_url: null,
    progress: 0,
    is_done: false,
    catatan: "YouTube Shorts 60 detik",
    created_at: "2026-11-04T14:00:00.000Z",
    updated_at: "2026-11-04T14:00:00.000Z",
  },
  {
    id: "cp-2026-cw46-06",
    tanggal: "2026-11-13",
    calendar_week: 46,
    day_of_week: "Friday",
    platform: "Instagram",
    tipe_konten: "PHB",
    topik: "Peringatan Hari Pohon Sedunia - Aksi Bersih & Hijau Kampus ISB",
    konsep: "Story",
    status: "Planning",
    referensi_url: null,
    progress: 0,
    is_done: false,
    catatan: "Kampanye peduli lingkungan kampus Atma Luhur",
    created_at: "2026-11-04T15:00:00.000Z",
    updated_at: "2026-11-04T15:00:00.000Z",
  },
  {
    id: "cp-2026-cw46-07",
    tanggal: "2026-11-14",
    calendar_week: 46,
    day_of_week: "Saturday",
    platform: "TikTok",
    tipe_konten: "Pemberitahuan",
    topik: "Recap Mingguan Info Akademik & Agenda Kegiatan Divisi Medkominfo",
    konsep: "Reels",
    status: "Planning",
    referensi_url: null,
    progress: 0,
    is_done: false,
    catatan: "News flash mingguan Instagram Reels & TikTok",
    created_at: "2026-11-04T16:00:00.000Z",
    updated_at: "2026-11-04T16:00:00.000Z",
  },
];
