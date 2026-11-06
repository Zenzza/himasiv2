# Task 1 Report: Type Contracts, Seed Mock Data, & Roman Numeral Utilities

**Date:** 2026-11-06  
**Status:** DONE  
**Module:** Sistem Persuratan Digital & Penomoran Otomatis HIMASI  
**Execution Scope:** Non-Git mode (per user constraint: *"tidak perlu menggunakan git"*)

---

## 1. Overview & Summary of Deliverables

Task 1 establishes the foundational type contracts, classification dictionaries, initial mock data, and numbering formatting engine for the Persuratan module. All interfaces strictly conform to the technical design specification (`docs/superpowers/specs/2026-11-06-persuratan-design.md`) and the official numbering formula:
$$\text{Nomor Surat} = \text{[urut 3-digit]} / \text{HIMASI} / \text{[kode jenis]} / \text{ISB-AL} / \text{[bulan romawi]} / \text{[tahun]}$$

### Files Created:
1. `lib/types/persuratan.ts` — Type definitions, interfaces, kop metadata schema, classification mappings, and seed mock data.
2. `lib/utils/romawi.ts` — Roman numeral converter (months I–XII), automated letter numbering builder, number extractor, timezone-safe date parser, and Indonesian date formatter.

---

## 2. Implemented Components

### 2.1 Type Contracts (`lib/types/persuratan.ts`)
- **`JenisSurat`**: `'keluar' | 'masuk'`
- **`KodeJenisSurat`**: `'UND' | 'PRM' | 'PDN' | 'DSP' | 'PKS' | 'KPT' | 'KTR' | 'PBM' | 'LAIN'`
- **`StatusSuratKeluar`**: `'draft' | 'menunggu_ttd' | 'terkirim'`
- **`StatusSuratMasuk`**: `'belum_disposisi' | 'didisposisi' | 'selesai'`
- **`StatusSurat`**: Union of all surat statuses including `'arsip'`.
- **`KontenKopSurat` & `PenandatanganSurat`**: Structured JSON schema for Phase 2 letterhead and document printing capabilities without requiring database redesign.
- **`SuratArsipItem`**: Comprehensive data interface representing rows in `surat_arsip`, including `id`, `jenis_surat`, `kode_jenis`, `nomor_urut`, `nomor_surat`, `perihal`, `kategori_label`, `tujuan_pengirim`, `tanggal_surat`, `tanggal_diterima`, `status`, `file_url`, `file_name`, `catatan_disposisi`, and `konten_kop`.
- **`KODE_JENIS_SURAT_MAP` & `DAFTAR_KLASIFIKASI_SURAT`**: Complete dictionary mapping the 9 official letter types with user-friendly Indonesian labels and descriptions (Undangan, Peminjaman Ruang, Permohonan Dana, Dispensasi, Kerjasama, Keputusan SK, Keterangan, Pemberitahuan, Lainnya).

### 2.2 Seed Mock Data
- **`DEFAULT_SURAT_LIST` (5 items)**: Matches the user's initial state exactly:
  1. `014/HIMASI/UND/ISB-AL/XI/2026` — Undangan Rapat Pleno (Status: `menunggu_ttd`, Urut: 14)
  2. `013/HIMASI/PRM/ISB-AL/XI/2026` — Permohonan Peminjaman Aula Kampus & Lab (Status: `terkirim`, Urut: 13)
  3. `012/HIMASI/PDN/ISB-AL/X/2026` — Permohonan Bantuan Dana Delegasi Kompetisi (Status: `terkirim`, Urut: 12)
  4. `011/HIMASI/DSP/ISB-AL/X/2026` — Permohonan Dispensasi Perkuliahan Panitia (Status: `terkirim`, Urut: 11)
  5. `—` — Permohonan Narasumber Seminar Nasional (Status: `draft`, Urut: `null`, Nomor: `—`)
  *(Max active urut is 14; next calculated sequential number is automatically 015).*
- **`DEFAULT_SURAT_MASUK_LIST` (2 items)**: Added sample inbound letters from BEM and LPPM for incoming letter and disposition workflow testing.

### 2.3 Numbering & Roman Numeral Engine (`lib/utils/romawi.ts`)
- **`angkaKeRomawi(bulan: number): string`**: Deterministic conversion of months 1 through 12 to Roman numerals (`I` to `XII`) with safe bounds checking.
- **`parseBulanTahun(tanggal: Date | string)`**: Extracts year and month without risk of timezone shift errors on ISO and date strings.
- **`generateNomorSurat(urut: number, kodeJenis: string, tanggal: Date | string): string`**: Formats 3-digit padded numbers with uppercase type codes and correct Roman calendar notations.
- **`parseNomorUrut(nomorSurat?: string | null): number | null`**: Extracts sequence integer from full letter number strings, returning `null` for drafts, blanks, and dashes.
- **`formatTanggalSurat(tanggal?: string | Date | null): string`**: Utility formatting dates into Indonesian short format (e.g. `04 Nov 2026`).

---

## 3. Verification & Testing

1. **TypeScript Type Safety Check**:
   - Command: `npx tsc --noEmit`
   - Result: **PASS with 0 errors**.
2. **Runtime Verification**:
   - All 12 Roman numerals verified (`1 => 'I'`, ..., `12 => 'XII'`).
   - `generateNomorSurat` verified for correct 3-digit padding and month formatting.
   - `parseNomorUrut` verified for standard strings, edge cases (`—`, `null`, `""`, `"draft"`).
   - Date formatting verified for Indonesian date output.
   - `DEFAULT_SURAT_LIST` verified against all required keys and values.

---

## 4. Next Steps
- Ready for **Task 2**: Supabase Database Migration (`supabase/migrations/20261106_create_surat_arsip.sql`) & Client Service with Offline Fallback (`lib/supabase/persuratan.ts`).
