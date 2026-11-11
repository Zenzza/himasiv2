/**
 * Tipe Data & Kontrak Modul Popup Pengumuman Beranda HIMASI
 * Sesuai Spesifikasi: docs/superpowers/specs/2026-11-10-homepage-announcement-popup-design.md
 */

export interface PopupItem {
  id: string;
  created_at: string;
  updated_at: string;
  title: string;
  tag: string;
  content: string;
  image_url?: string | null;
  cta_text?: string | null;
  cta_url?: string | null;
  is_active: boolean;
  created_by: string;
}

export interface CreatePopupPayload {
  title: string;
  tag?: string;
  content: string;
  image_url?: string | null;
  cta_text?: string | null;
  cta_url?: string | null;
  is_active?: boolean;
  created_by?: string;
}

export interface UpdatePopupPayload {
  title?: string;
  tag?: string;
  content?: string;
  image_url?: string | null;
  cta_text?: string | null;
  cta_url?: string | null;
  is_active?: boolean;
  created_by?: string;
}

/**
 * Data mock/fallback awal saat koneksi database Supabase belum terpasang
 */
export const DEFAULT_POPUPS: PopupItem[] = [
  {
    id: "popup-seed-01",
    created_at: "2026-11-10T10:00:00.000Z",
    updated_at: "2026-11-10T10:00:00.000Z",
    title: "Open Recruitment Pengurus HIMASI Kabinet REKSABUDAYA",
    tag: "OPREC RESMI",
    content: "Panggilan terbuka bagi seluruh mahasiswa aktif Program Studi Sistem Informasi ISB Atma Luhur untuk berkontribusi dan bertumbuh bersama kepengurusan himpunan.",
    image_url: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=800&auto=format&fit=crop",
    cta_text: "Daftar Oprec Sekarang",
    cta_url: "/s/oprec",
    is_active: true,
    created_by: "Badan Pengurus Harian",
  },
  {
    id: "popup-seed-02",
    created_at: "2026-11-08T08:30:00.000Z",
    updated_at: "2026-11-08T08:30:00.000Z",
    title: "Malam Keakraban (Makrab) Mahasiswa Sistem Informasi 2026",
    tag: "AGENDA HIMASI",
    content: "Rangkaian agenda tahunan menyambut keluarga baru mahasiswa Sistem Informasi dengan kebersamaan, pentas kreasi, dan malam api unggun.",
    image_url: "https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=800&auto=format&fit=crop",
    cta_text: "Info Makrab",
    cta_url: "/s/makrab2026",
    is_active: false,
    created_by: "Divisi Kaderisasi",
  },
];

