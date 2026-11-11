/**
 * Tipe Data & Kontrak Modul Link Shortener & QR Generator HIMASI (/s/[slug])
 * Sesuai Spesifikasi: docs/superpowers/specs/2026-11-10-link-shortener-qr-generator-design.md
 */

export interface ShortLinkItem {
  id: string;
  created_at: string;
  updated_at: string;
  title: string;
  slug: string;
  original_url: string;
  clicks_count: number;
  is_active: boolean;
  divisi: string;
  created_by: string;
  description?: string | null;
}

export interface CreateShortLinkPayload {
  title: string;
  slug: string;
  original_url: string;
  is_active?: boolean;
  divisi?: string;
  created_by?: string;
  description?: string;
}

export interface UpdateShortLinkPayload {
  title?: string;
  slug?: string;
  original_url?: string;
  is_active?: boolean;
  divisi?: string;
  created_by?: string;
  description?: string;
}

export interface ShortLinkFilter {
  search?: string;
  divisi?: string;
  status?: "all" | "active" | "inactive";
}

/**
 * Data mock/fallback awal saat koneksi database Supabase belum terpasang
 */
export const DEFAULT_SHORT_LINKS: ShortLinkItem[] = [
  {
    id: "shortlink-seed-01",
    created_at: "2026-11-10T08:00:00.000Z",
    updated_at: "2026-11-10T08:00:00.000Z",
    title: "Pendaftaran Makrab TI & SI 2026",
    slug: "makrab2026",
    original_url: "https://forms.gle/makrab-himasi-2026",
    clicks_count: 142,
    is_active: true,
    divisi: "BPH",
    created_by: "Badan Pengurus Harian",
    description: "Formulir registrasi mahasiswa baru untuk Malam Keakraban HIMASI.",
  },
  {
    id: "shortlink-seed-02",
    created_at: "2026-11-09T14:30:00.000Z",
    updated_at: "2026-11-09T14:30:00.000Z",
    title: "Materi Workshop UI/UX Design System",
    slug: "materi-uiux",
    original_url: "https://drive.google.com/drive/folders/himasi-uiux-workshop",
    clicks_count: 89,
    is_active: true,
    divisi: "Medkominfo",
    created_by: "Divisi Medkominfo",
    description: "Slide presentasi dan asset kit materi pelatihan Figma.",
  },
  {
    id: "shortlink-seed-03",
    created_at: "2026-11-08T10:15:00.000Z",
    updated_at: "2026-11-08T10:15:00.000Z",
    title: "Pendaftaran Turnamen E-Sport HIMASI Cup",
    slug: "esport-cup",
    original_url: "https://forms.gle/himasi-esport-cup-2026",
    clicks_count: 230,
    is_active: false,
    divisi: "Biskraf",
    created_by: "Divisi Biskraf",
    description: "Pendaftaran kompetisi Mobile Legends & Valorant antar-mahasiswa.",
  },
];

