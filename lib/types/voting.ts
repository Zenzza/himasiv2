/**
 * Data contracts and TypeScript interfaces for the E-Voting module
 * HIMASI Atma Luhur
 */

export type VotingStatus = "draft" | "open" | "closed" | "archived";

export interface VotingSesi {
  id: string;
  judul: string;
  tahun_periode: string;
  deskripsi?: string | null;
  status: VotingStatus;
  is_results_unlocked: boolean;
  opened_at?: string | null;
  closed_at?: string | null;
  unlocked_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface VotingKandidat {
  id: string;
  sesi_id: string;
  nomor_urut: number;
  nama_calon: string;
  foto_url?: string | null;
  visi?: string | null;
  misi?: string | null;
  program_kerja?: string | null;
  created_at: string;
}

export interface VotingDPT {
  id: string;
  sesi_id: string;
  nim: string;
  nama_lengkap: string;
  tanggal_lahir: string; // YYYY-MM-DD
  sudah_memilih: boolean;
  voted_at?: string | null;
  created_at: string;
}

export interface VotingSuaraResult {
  kandidat_id: string;
  nomor_urut: number;
  nama_calon: string;
  total_suara: number;
  persentase: number;
  is_winner: boolean;
}

export interface VotingSummaryMetrics {
  status_label: string;
  status: VotingStatus;
  total_dpt: number;
  suara_masuk: number;
  belum_memilih: number;
  persentase_partisipasi: number;
  is_results_unlocked: boolean;
}

export interface SignatoryConfig {
  nama_ketua_kpu: string;
  nim_ketua_kpu: string;
  nama_saksi_1: string;
  nim_saksi_1: string;
  nama_saksi_2: string;
  nim_saksi_2: string;
  nama_ketua_umum: string;
  nim_ketua_umum: string;
}

export interface BeritaAcaraData {
  nomor_surat: string;
  tanggal_surat: string;
  hari_pelaksanaan: string;
  sesi_judul: string;
  tahun_periode: string;
  total_dpt: number;
  total_suara_masuk: number;
  total_golput: number;
  persentase_partisipasi: number;
  hasil_kandidat: VotingSuaraResult[];
  signatories: SignatoryConfig;
}

export interface DPTImportPreviewItem {
  nim: string;
  nama_lengkap: string;
  tanggal_lahir: string; // Normalized YYYY-MM-DD
  raw_tanggal_lahir: string;
  is_valid: boolean;
  error_message?: string;
  is_duplicate?: boolean;
}

