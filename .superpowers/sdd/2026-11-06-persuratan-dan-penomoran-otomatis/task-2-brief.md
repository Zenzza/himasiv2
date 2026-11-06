### Task 2: Supabase Database Migration & Client Service with Offline Fallback

**Files:**
- Create: `supabase/migrations/20261106_create_surat_arsip.sql`
- Create: `lib/supabase/persuratan.ts`

**Interfaces:**
- Consumes:
  - `lib/types/persuratan.ts`: `SuratArsipItem`, `JenisSurat`, `KodeJenisSurat`, `StatusSuratKeluar`, `StatusSuratMasuk`, `DEFAULT_SURAT_LIST`
  - `lib/utils/romawi.ts`: `generateNomorSurat`, `angkaKeRomawi`
- Produces:
  - `lib/supabase/persuratan.ts`:
    - `getDaftarSurat(): Promise<SuratArsipItem[]>`
    - `getNextNomorUrut(kodeJenis: string, tanggal: string): Promise<{ nomor_urut: number; nomor_surat: string }>`
    - `createSurat(item: Partial<SuratArsipItem>): Promise<SuratArsipItem>`
    - `updateSurat(id: string, updates: Partial<SuratArsipItem>): Promise<SuratArsipItem | null>`
    - `updateStatusSurat(id: string, status: string, catatanDisposisi?: string): Promise<SuratArsipItem | null>`
    - `revertSuratToDraft(id: string): Promise<SuratArsipItem | null>` (Mekanisme *number recycling*: melepaskan `nomor_urut = null` dan `nomor_surat = '—'` sehingga nomor kembali ke antrean)
    - `deleteSurat(id: string): Promise<boolean>`
    - `uploadBerkasSurat(file: File): Promise<{ url: string; fileName: string } | null>`

- [ ] **Step 1: Tulis skrip DDL & stored procedure di `supabase/migrations/20261106_create_surat_arsip.sql`**
  - Tabel `public.surat_arsip` dengan kolom `id`, `jenis_surat`, `kode_jenis`, `nomor_urut`, `nomor_surat`, `perihal`, `kategori_label`, `tujuan_pengirim`, `tanggal_surat`, `tanggal_diterima`, `status`, `file_url`, `file_name`, `catatan_disposisi`, `konten_kop`, `created_by`, `created_at`, `updated_at`.
  - Stored procedure `public.get_next_nomor_surat(p_kode_jenis text, p_tanggal_surat date DEFAULT CURRENT_DATE) RETURNS jsonb`.
  - RLS policies.

- [ ] **Step 2: Implementasikan service `lib/supabase/persuratan.ts` dengan fallback offline**
  - Ambil client dari `@/lib/supabase/client`.
  - Gunakan `localStorage` (key: `himasiv2_surat_arsip`) sebagai fallback cache jika Supabase belum ada tabelnya / error.
  - Implementasikan `revertSuratToDraft`: mengubah status menjadi `'draft'`, melepaskan nomor urut (`nomor_urut: null`, `nomor_surat: '—'`).
  - Implementasikan `getNextNomorUrut`: mencoba panggil RPC `get_next_nomor_surat`, jika gagal hitung `MAX(nomor_urut) + 1` dari daftar surat keluar tahun berjalan.
  - Implementasikan `uploadBerkasSurat`: unggah ke Supabase storage bucket `dokumen_organisasi` (atau fallback data URL jika error).

- [ ] **Step 3: Verifikasi integritas tipe via TypeScript**
  - Jalankan: `npx tsc --noEmit`
  - Expected: PASS dengan 0 eror.

NOTE: Do NOT run git commands (user instructed: "tidak perlu menggunakan git"). Focus on creating the files and verifying with `npx tsc --noEmit`.

