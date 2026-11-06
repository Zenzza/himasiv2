/**
 * Kontrak Tipe Data & Data Awal Modul Persuratan HIMASI ISB Atma Luhur
 * Sesuai Spesifikasi Teknis: docs/superpowers/specs/2026-11-06-persuratan-design.md
 */

export type JenisSurat = "keluar" | "masuk";

export type KodeJenisSurat =
  | "UND"
  | "PRM"
  | "PDN"
  | "DSP"
  | "PKS"
  | "KPT"
  | "KTR"
  | "PBM"
  | "LAIN";

export type StatusSuratKeluar = "draft" | "menunggu_ttd" | "terkirim";

export type StatusSuratMasuk = "belum_disposisi" | "didisposisi" | "selesai";

export type StatusSurat = StatusSuratKeluar | StatusSuratMasuk | "arsip";

export interface PenandatanganSurat {
  nama: string;
  jabatan: string;
  nim?: string;
  tanda_tangan_url?: string;
}

/**
 * Metadata kop surat terstruktur untuk persiapan Fase 2 (Kop Surat Builder & Generator PDF)
 */
export interface KontenKopSurat {
  nomor_lampiran?: string;
  perihal_detail?: string;
  tujuan_nama?: string;
  tujuan_jabatan?: string;
  tujuan_instansi?: string;
  tujuan_kota?: string;
  salam_pembuka?: string;
  isi_paragraf?: string[];
  waktu_acara?: string;
  tempat_acara?: string;
  salam_penutup?: string;
  penandatangan?: PenandatanganSurat[];
  tembusan?: string[];
}

export interface SuratArsipItem {
  id: string;
  jenis_surat: JenisSurat;
  kode_jenis: KodeJenisSurat | (string & {});
  nomor_urut: number | null; // NULL jika masih 'draft' atau surat masuk
  nomor_surat: string; // Format HIMASI untuk surat keluar, atau nomor asal untuk surat masuk, atau '—' jika draft
  perihal: string;
  kategori_label: string; // Misal: "Undangan", "Peminjaman Ruang", dll.
  tujuan_pengirim: string; // Pihak tujuan (surat keluar) atau asal pengirim (surat masuk)
  tanggal_surat: string; // Format YYYY-MM-DD
  tanggal_diterima?: string | null; // Khusus surat masuk (YYYY-MM-DD)
  status: StatusSurat | (string & {});
  file_url?: string | null;
  file_name?: string | null;
  file_size?: string | null;
  catatan_disposisi?: string | null;
  konten_kop?: KontenKopSurat | Record<string, unknown>;
  created_by?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface KlasifikasiJenisSurat {
  kode: KodeJenisSurat;
  label: string;
  deskripsi: string;
}

export const KODE_JENIS_SURAT_MAP: Record<KodeJenisSurat, { label: string; deskripsi: string }> = {
  UND: {
    label: "Undangan",
    deskripsi: "Undangan Rapat Pleno, Musyawarah Besar",
  },
  PRM: {
    label: "Peminjaman Ruang",
    deskripsi: "Peminjaman Aula Kampus, Lab Komputer, Sarpras",
  },
  PDN: {
    label: "Permohonan Dana",
    deskripsi: "Pengajuan Dana Delegasi Lomba, Bantuan Ormawa",
  },
  DSP: {
    label: "Dispensasi",
    deskripsi: "Permohonan izin perkuliahan panitia & delegasi lomba",
  },
  PKS: {
    label: "Kerjasama / Kemitraan",
    deskripsi: "MoU/MoA dengan instansi luar, sponsor acara",
  },
  KPT: {
    label: "Keputusan (SK)",
    deskripsi: "Surat Keputusan Kepanitiaan, Reshuffle Pengurus",
  },
  KTR: {
    label: "Keterangan",
    deskripsi: "Surat Keterangan Aktif Organisasi bagi Pengurus",
  },
  PBM: {
    label: "Pemberitahuan",
    deskripsi: "Pemberitahuan Izin Kegiatan ke Prodi/Rektorat",
  },
  LAIN: {
    label: "Lainnya",
    deskripsi: "Keperluan persuratan umum lainnya",
  },
};

export const DAFTAR_KLASIFIKASI_SURAT: KlasifikasiJenisSurat[] = (
  Object.keys(KODE_JENIS_SURAT_MAP) as KodeJenisSurat[]
).map((kode) => ({
  kode,
  label: KODE_JENIS_SURAT_MAP[kode].label,
  deskripsi: KODE_JENIS_SURAT_MAP[kode].deskripsi,
}));

export const KLASIFIKASI_SURAT_LIST = DAFTAR_KLASIFIKASI_SURAT;

/**
 * 5 Data Mock Awal Persis Tangkapan Layar Pengguna
 * Terdiri dari 4 surat resmi (nomor 011 s.d. 014) dan 1 draf tanpa nomor urut ('—').
 * Urutan berikutnya yang akan diterbitkan otomatis adalah 015.
 */
export const DEFAULT_SURAT_LIST: SuratArsipItem[] = [
  {
    id: "surat-014",
    jenis_surat: "keluar",
    kode_jenis: "UND",
    nomor_urut: 14,
    nomor_surat: "014/HIMASI/UND/ISB-AL/XI/2026",
    perihal: "Undangan Rapat Pleno Evaluasi Program Kerja Tengah Periode",
    kategori_label: "Undangan",
    tujuan_pengirim: "Seluruh BPH & Anggota HIMASI",
    tanggal_surat: "2026-11-04",
    status: "menunggu_ttd",
    file_url: "/documents/surat-014-undangan-pleno.pdf",
    file_name: "014-HIMASI-UND-ISB-AL-XI-2026.pdf",
    file_size: "245 KB",
    catatan_disposisi: null,
    konten_kop: {
      perihal_detail: "Undangan Rapat Pleno Evaluasi Program Kerja",
      tujuan_instansi: "Internal HIMASI ISB Atma Luhur",
      tempat_acara: "Ruang Rapat Ormawa Gedung B Lantai 2",
      waktu_acara: "Sabtu, 08 November 2026, Pukul 09.00 WIB",
    },
    created_at: "2026-11-04T08:30:00.000Z",
    updated_at: "2026-11-04T08:30:00.000Z",
  },
  {
    id: "surat-013",
    jenis_surat: "keluar",
    kode_jenis: "PRM",
    nomor_urut: 13,
    nomor_surat: "013/HIMASI/PRM/ISB-AL/XI/2026",
    perihal: "Permohonan Peminjaman Aula Kampus & Laboratorium Komputer",
    kategori_label: "Peminjaman Ruang",
    tujuan_pengirim: "Bagian Sarana & Prasarana ISB Atma Luhur",
    tanggal_surat: "2026-11-02",
    status: "terkirim",
    file_url: "/documents/surat-013-peminjaman-aula.pdf",
    file_name: "013-HIMASI-PRM-ISB-AL-XI-2026.pdf",
    file_size: "310 KB",
    catatan_disposisi: null,
    konten_kop: {
      perihal_detail: "Peminjaman Aula Utama dan Lab Jaringan",
      tujuan_instansi: "BAUK Sarpras ISB Atma Luhur",
      tempat_acara: "Aula Utama & Lab 3",
      waktu_acara: "15-16 November 2026",
    },
    created_at: "2026-11-02T09:15:00.000Z",
    updated_at: "2026-11-02T11:00:00.000Z",
  },
  {
    id: "surat-012",
    jenis_surat: "keluar",
    kode_jenis: "PDN",
    nomor_urut: 12,
    nomor_surat: "012/HIMASI/PDN/ISB-AL/X/2026",
    perihal: "Permohonan Bantuan Dana Delegasi Kompetisi UI/UX Nasional",
    kategori_label: "Permohonan Dana",
    tujuan_pengirim: "Wakil Rektor III Bidang Kemahasiswaan & Kerjasama",
    tanggal_surat: "2026-10-28",
    status: "terkirim",
    file_url: "/documents/surat-012-permohonan-dana.pdf",
    file_name: "012-HIMASI-PDN-ISB-AL-X-2026.pdf",
    file_size: "415 KB",
    catatan_disposisi: null,
    konten_kop: {
      perihal_detail: "Bantuan Dana Delegasi Lomba Desain Interaksi Nasional",
      tujuan_instansi: "Rektorat ISB Atma Luhur",
    },
    created_at: "2026-10-28T10:00:00.000Z",
    updated_at: "2026-10-28T14:20:00.000Z",
  },
  {
    id: "surat-011",
    jenis_surat: "keluar",
    kode_jenis: "DSP",
    nomor_urut: 11,
    nomor_surat: "011/HIMASI/DSP/ISB-AL/X/2026",
    perihal: "Permohonan Dispensasi Perkuliahan Panitia HIMASI Fest 2026",
    kategori_label: "Dispensasi",
    tujuan_pengirim: "Ketua Program Studi Sistem Informasi ISB Atma Luhur",
    tanggal_surat: "2026-10-24",
    status: "terkirim",
    file_url: "/documents/surat-011-dispensasi-panitia.pdf",
    file_name: "011-HIMASI-DSP-ISB-AL-X-2026.pdf",
    file_size: "190 KB",
    catatan_disposisi: null,
    konten_kop: {
      perihal_detail: "Dispensasi Kuliah Panitia Pelaksana HIMASI Fest",
      tujuan_instansi: "Prodi Sistem Informasi",
    },
    created_at: "2026-10-24T08:00:00.000Z",
    updated_at: "2026-10-24T10:45:00.000Z",
  },
  {
    id: "surat-draft-1",
    jenis_surat: "keluar",
    kode_jenis: "UND",
    nomor_urut: null,
    nomor_surat: "—",
    perihal: "Permohonan Narasumber Seminar Nasional Cyber Security",
    kategori_label: "Undangan",
    tujuan_pengirim: "Google Developer Student Club & Praktisi Industri",
    tanggal_surat: "2026-11-06",
    status: "draft",
    file_url: null,
    file_name: null,
    file_size: null,
    catatan_disposisi: null,
    konten_kop: {
      perihal_detail: "Permohonan Narasumber Seminar Nasional Keamanan Informasi",
      tujuan_instansi: "Google Developer Student Club",
    },
    created_at: "2026-11-06T11:00:00.000Z",
    updated_at: "2026-11-06T11:00:00.000Z",
  },
];

/**
 * Data sample surat masuk tambahan untuk verifikasi alur surat masuk & disposisi
 */
export const DEFAULT_SURAT_MASUK_LIST: SuratArsipItem[] = [
  {
    id: "surat-in-001",
    jenis_surat: "masuk",
    kode_jenis: "UND",
    nomor_urut: null,
    nomor_surat: "045/BEM-ISBAL/E/X/2026",
    perihal: "Undangan Menghadiri Pembukaan Pekan Olahraga & Seni Mahasiswa",
    kategori_label: "Undangan",
    tujuan_pengirim: "Badan Eksekutif Mahasiswa (BEM) ISB Atma Luhur",
    tanggal_surat: "2026-10-29",
    tanggal_diterima: "2026-10-30",
    status: "didisposisi",
    file_url: "/documents/surat-masuk-045-undangan-bem.pdf",
    file_name: "045-BEM-ISBAL-E-X-2026.pdf",
    file_size: "350 KB",
    catatan_disposisi: "Disposisi ke Departemen Olahraga & Seni untuk mengirim perwakilan 4 orang.",
    created_at: "2026-10-30T09:00:00.000Z",
    updated_at: "2026-10-30T14:00:00.000Z",
  },
  {
    id: "surat-in-002",
    jenis_surat: "masuk",
    kode_jenis: "PBM",
    nomor_urut: null,
    nomor_surat: "112/LPPM-AL/PBM/XI/2026",
    perihal: "Pemberitahuan Sosialisasi Program Kreativitas Mahasiswa (PKM) 2027",
    kategori_label: "Pemberitahuan",
    tujuan_pengirim: "Lembaga Penelitian & Pengabdian Masyarakat (LPPM)",
    tanggal_surat: "2026-11-03",
    tanggal_diterima: "2026-11-04",
    status: "belum_disposisi",
    file_url: "/documents/surat-masuk-112-sosialisasi-pkm.pdf",
    file_name: "112-LPPM-AL-PBM-XI-2026.pdf",
    file_size: "520 KB",
    catatan_disposisi: null,
    created_at: "2026-11-04T10:15:00.000Z",
    updated_at: "2026-11-04T10:15:00.000Z",
  },
];
