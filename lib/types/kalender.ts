import { ContentStatus } from "./auth";

// ===================================================================
// TIPE & DEFINISI DATA AGENDA KALENDER HIMASI
// ===================================================================

export type EventCategory = "HIMASI" | "Akademik" | "Libur";

export interface AgendaKalender {
  id: string;
  tanggal_mulai: string; // Format 'YYYY-MM-DD'
  tanggal_selesai?: string | null; // Format 'YYYY-MM-DD', null jika acara 1 hari
  judul: string;
  kategori: EventCategory;
  waktu: string;
  lokasi: string;
  deskripsi: string;
  status?: ContentStatus;
  catatan_revisi?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Memeriksa apakah suatu tanggal spesifik berada dalam rentang pelaksanaan acara.
 */
export function isDateInEventRange(dateStr: string, event: AgendaKalender): boolean {
  if (!event.tanggal_selesai || event.tanggal_selesai === event.tanggal_mulai) {
    return dateStr === event.tanggal_mulai;
  }
  return dateStr >= event.tanggal_mulai && dateStr <= event.tanggal_selesai;
}

/**
 * Metadata visual kategori agenda (warna, dot, badge, border).
 */
export const CATEGORY_METADATA: Record<
  EventCategory,
  { label: string; border: string; dot: string; bgBadge: string; textBadge: string }
> = {
  HIMASI: {
    label: "Agenda HIMASI",
    border: "border-[#1E88E5]",
    dot: "bg-[#1E88E5]",
    bgBadge: "bg-[#1E88E5]/10",
    textBadge: "text-[#00296E]",
  },
  Akademik: {
    label: "Akademik Kampus",
    border: "border-[#F2B705]",
    dot: "bg-[#F2B705]",
    bgBadge: "bg-[#F2B705]/15",
    textBadge: "text-amber-800",
  },
  Libur: {
    label: "Libur Nasional",
    border: "border-[#8E24AA]",
    dot: "bg-[#8E24AA]",
    bgBadge: "bg-[#8E24AA]/10",
    textBadge: "text-purple-800",
  },
};

export function getCategoryMeta(category: EventCategory | string) {
  if (category in CATEGORY_METADATA) {
    return CATEGORY_METADATA[category as EventCategory];
  }
  return CATEGORY_METADATA.HIMASI;
}

// ===================================================================
// DATA SEED BAWAAN KALENDER (SEPTEMBER - OKTOBER 2026)
// ===================================================================
export const DEFAULT_AGENDA_EVENTS: AgendaKalender[] = [
  {
    id: "evt-sep-09",
    tanggal_mulai: "2026-09-09",
    tanggal_selesai: "2026-09-10",
    judul: "Ujian Sidang Skripsi & Tugas Akhir Gelombang I",
    kategori: "Akademik",
    waktu: "08.30 - 16.00 WIB",
    lokasi: "Ruang Sidang Utama Lt. 2 ISB Atma Luhur",
    deskripsi: "Pelaksanaan ujian sidang skripsi dan tugas akhir tahap 1 bagi mahasiswa tingkat akhir Program Studi Sistem Informasi ISB Atma Luhur.",
  },
  {
    id: "evt-sep-14",
    tanggal_mulai: "2026-09-14",
    tanggal_selesai: null,
    judul: "Awal Perkuliahan Efektif Semester Ganjil 2026/2027",
    kategori: "Akademik",
    waktu: "07.30 - 17.00 WIB",
    lokasi: "Seluruh Ruang Kelas Sistem Informasi ISB Atma Luhur",
    deskripsi: "Dimulainya perkuliahan tatap muka minggu ke-1 seluruh mata kuliah prodi Sistem Informasi ISB Atma Luhur tahun akademik baru.",
  },
  {
    id: "evt-sep-25",
    tanggal_mulai: "2026-09-25",
    tanggal_selesai: null,
    judul: "Malam Keakraban (MAKRAB) & Inaugurasi HIMASI 2026",
    kategori: "HIMASI",
    waktu: "16.00 - 22.00 WIB",
    lokasi: "Auditorium & Lapangan Utama ISB Atma Luhur",
    deskripsi: "Temu akrab mahasiswa baru bersama BPH & seluruh divisi HIMASI untuk menjalin sinergi, pengenalan ormawa, dan pentas kebersamaan.",
  },
  {
    id: "evt-sep-29",
    tanggal_mulai: "2026-09-29",
    tanggal_selesai: null,
    judul: "HIMASI Tech Talk: Road to Cloud Engineer & AI Frontier",
    kategori: "HIMASI",
    waktu: "13.30 - 16.30 WIB",
    lokasi: "Lab Komputer Cloud & Live Streaming YouTube HIMASI",
    deskripsi: "Seminar teknologi komputasi awan dan rekayasa kecerdasan buatan bersama alumni praktisi industri teknologi nasional.",
  },
  {
    id: "evt-aug-17",
    tanggal_mulai: "2026-08-17",
    tanggal_selesai: null,
    judul: "Upacara Peringatan HUT Kemerdekaan RI ke-81",
    kategori: "Libur",
    waktu: "07.30 - 10.00 WIB",
    lokasi: "Lapangan Upacara ISB Atma Luhur",
    deskripsi: "Upacara bendera peringatan kemerdekaan Republik Indonesia dan festival lomba ormawa kampus Atma Luhur.",
  },
  {
    id: "evt-aug-24",
    tanggal_mulai: "2026-08-24",
    tanggal_selesai: null,
    judul: "Masa Pengisian & Revisi KRS Online Semester Ganjil",
    kategori: "Akademik",
    waktu: "09.00 - 23.59 WIB",
    lokasi: "Portal SIAKAD Online Atma Luhur",
    deskripsi: "Konsultasi dosen pembimbing akademik (PA) dan penguncian jadwal rencana studi semester ganjil.",
  },
  {
    id: "evt-oct-05",
    tanggal_mulai: "2026-10-05",
    tanggal_selesai: null,
    judul: "HIMASI Coding Clinic: Algoritma & Basis Data Relasional",
    kategori: "HIMASI",
    waktu: "15.30 - 17.30 WIB",
    lokasi: "Lab Pemrograman Web Lt. 3",
    deskripsi: "Sesi tutorial intensif dan bimbingan praktikum koding bersama tutor sebaya berprestasi HIMASI.",
  },
  {
    id: "evt-oct-15",
    tanggal_mulai: "2026-10-15",
    tanggal_selesai: null,
    judul: "Batas Akhir Verifikasi Dispensasi Kuliah & Delegasi Lomba",
    kategori: "Akademik",
    waktu: "16.00 WIB",
    lokasi: "Sekretariat Prodi Sistem Informasi",
    deskripsi: "Batas akhir penyerahan berkas verifikasi dispensasi lomba akademik dan program magang bersertifikat MBKM.",
  },
  {
    id: "evt-oct-26",
    tanggal_mulai: "2026-10-26",
    tanggal_selesai: "2026-10-31",
    judul: "Ujian Tengah Semester (UTS) Ganjil 2026/2027",
    kategori: "Akademik",
    waktu: "08.00 - 16.00 WIB",
    lokasi: "Ruang Ujian Terpadu Kampus Atma Luhur",
    deskripsi: "Pekan evaluasi tengah semester untuk seluruh mata kuliah teori dan praktikum sistem informasi.",
  },
];

