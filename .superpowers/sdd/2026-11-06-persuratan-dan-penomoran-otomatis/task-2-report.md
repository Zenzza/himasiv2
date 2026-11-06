# Task 2 Report: Supabase Database Migration & Client Service with Offline Fallback

**Tanggal:** 2026-11-06  
**Status:** DONE  
**Implementer:** Subagent (Task 2)  

---

## 1. Ringkasan Pekerjaan

Telah berhasil mengimplementasikan skema database Supabase, fungsi PostgreSQL atomik penomoran surat, serta client service TypeScript yang dilengkapi sistem **offline fallback (dual-path)** dan mekanisme **number recycling**.

### Berkas yang Dibuat & Dimodifikasi:
1. `supabase/migrations/20261106_create_surat_arsip.sql` (Skrip DDL, stored procedure `get_next_nomor_surat`, triggers, RLS policies, dan bucket storage).
2. `lib/supabase/persuratan.ts` (Layanan persuratan dengan dual-path Supabase & localStorage/in-memory fallback, penomoran otomatis, upload berkas, dan daur ulang nomor).

---

## 2. Rincian Implementasi

### A. Migrasi SQL Database (`supabase/migrations/20261106_create_surat_arsip.sql`)
- **Tabel `public.surat_arsip`:**
  - `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
  - `jenis_surat VARCHAR(10) CHECK ('keluar', 'masuk')`
  - `kode_jenis VARCHAR(10) DEFAULT 'UND'`
  - `nomor_urut INTEGER` (NULL untuk draft dan surat masuk)
  - `nomor_surat VARCHAR(100)`
  - `perihal TEXT NOT NULL`
  - `kategori_label VARCHAR(50) DEFAULT 'Undangan'`
  - `tujuan_pengirim TEXT NOT NULL`
  - `tanggal_surat DATE DEFAULT CURRENT_DATE`
  - `tanggal_diterima DATE`
  - `status VARCHAR(20) DEFAULT 'draft' CHECK ('draft', 'menunggu_ttd', 'terkirim', 'arsip', 'belum_disposisi', 'didisposisi', 'selesai')`
  - `file_url`, `file_name`, `file_size`, `catatan_disposisi`
  - `konten_kop JSONB DEFAULT '{}'::jsonb` (fondasi Fase 2)
  - `created_by`, `created_at`, `updated_at`
- **Indeks Efisien:**
  - `idx_surat_jenis_status` pada `(jenis_surat, status)`
  - `idx_surat_tanggal` pada `(tanggal_surat DESC)`
  - Partial index `idx_surat_nomor_urut` pada `(nomor_urut DESC) WHERE nomor_urut IS NOT NULL`
  - `idx_surat_created_at` pada `(created_at DESC)`
- **Stored Procedure Atomik `get_next_nomor_surat`:**
  - Menerima `p_kode_jenis text` dan `p_tanggal_surat date DEFAULT CURRENT_DATE`.
  - Mengambil tahun & bulan Romawi (`I` s.d. `XII`).
  - Menghitung `COALESCE(MAX(nomor_urut), 0) + 1` khusus surat keluar aktif (`nomor_urut IS NOT NULL`) pada tahun berjalan.
  - Menghasilkan format baku: `[urut 3-digit]/HIMASI/[kode jenis]/ISB-AL/[bulan romawi]/[tahun]`.
- **Triggers & Keamanan RLS:**
  - Trigger `trg_surat_arsip_updated_at` otomatis memperbarui `updated_at`.
  - Kebijakan RLS (SELECT, INSERT, UPDATE, DELETE) dengan GRANT ke `anon`, `authenticated`, dan `service_role`.
  - Inisialisasi storage bucket `dokumen_organisasi` dan RLS policies.

### B. Client Service (`lib/supabase/persuratan.ts`)
- **Fungsi Utama:**
  1. `getDaftarSurat(): Promise<SuratArsipItem[]>`: Mengambil data dari Supabase, fallback transparan ke `localStorage` (kunci: `himasiv2_surat_arsip`) yang diinisialisasi dengan 7 data bawaan (`DEFAULT_SURAT_LIST` + `DEFAULT_SURAT_MASUK_LIST`).
  2. `getNextNomorUrut(kodeJenis: string, tanggal?: string): Promise<{ nomor_urut: number; nomor_surat: string }>`: Memanggil RPC Supabase `get_next_nomor_surat`, jika gagal atau offline melakukan kalkulasi lokal `MAX(nomor_urut) + 1` dari data aktif tahun berjalan.
  3. `createSurat(item: Partial<SuratArsipItem>): Promise<SuratArsipItem>`:
     - Jika status `draft`, `nomor_urut = null` dan `nomor_surat = '—'`.
     - Jika status `menunggu_ttd` atau `terkirim`, otomatis mengalokasikan nomor urut berikutnya.
     - Menyimpan ke Supabase dan menyinkronkan ke cache lokal.
  4. `updateSurat(id: string, updates: Partial<SuratArsipItem>): Promise<SuratArsipItem | null>`: Update data parsial baik di Supabase maupun lokal.
  5. `updateStatusSurat(id: string, status: string, catatanDisposisi?: string): Promise<SuratArsipItem | null>`: Menangani perubahan status, mengalokasikan nomor jika naik dari draft, dan melepaskan nomor jika kembali ke draft.
  6. `revertSuratToDraft(id: string): Promise<SuratArsipItem | null>`: **Number Recycling** — mengubah status menjadi `'draft'`, melepaskan nomor (`nomor_urut = null`, `nomor_surat = '—'`) sehingga nomor kembali ke antrean tanpa membuat celah (*no gaps*).
  7. `deleteSurat(id: string): Promise<boolean>`: Menghapus surat dari database dan penyimpanan lokal.
  8. `uploadBerkasSurat(file: File): Promise<{ url: string; fileName: string; fileSize?: string } | null>`: Mengunggah ke Supabase Storage (`dokumen_organisasi` / `dokumen-organisasi`) dengan fallback Base64 data URL untuk lingkungan offline.
  9. `resetSuratStorageToDefault()`: Helper utilitas untuk mereset data lokal ke kondisi mock awal.

---

## 3. Hasil Pengujian & Verifikasi

1. **TypeScript Typecheck (`npx tsc --noEmit`):**
   - **Hasil:** Exit code 0, 0 error.
2. **End-to-End Logic & Number Recycling Test (`test-persuratan.ts`):**
   - Inisialisasi data mock bawaan (7 item: 4 surat keluar resmi, 1 draft, 2 surat masuk).
   - Verifikasi nomor berikutnya awal: `015` (`015/HIMASI/UND/ISB-AL/XI/2026`).
   - Buat surat baru status `menunggu_ttd` -> mendapatkan nomor `015`. Nomor berikutnya bergeser ke `016`.
   - Jalankan `revertSuratToDraft(id)` -> status berubah menjadi `draft`, `nomor_urut: null`, `nomor_surat: '—'`.
   - Cek `getNextNomorUrut` setelah revert -> kembali menjadi `015` (nomor berhasil didaur ulang tanpa ada nomor bolong).
   - Update kembali surat draf ke `menunggu_ttd` -> kembali memperoleh nomor `015`.
   - Hapus surat -> nomor `015` tetap dapat digunakan oleh surat berikutnya.
   - **Hasil:** `=== ALL PERSURATAN TESTS PASSED! ===`
3. **Ketahanan Offline / Dual-Path:**
   - Saat koneksi Supabase gagal atau tabel belum dibuat, sistem otomatis menggunakan cache lokal tanpa crash/lempar uncaught error.

---

## 4. Kesimpulan
Task 2 selesai dengan sempurna dan siap diintegrasikan pada Task 3 (UI Management Component & Dashboard Integration).
