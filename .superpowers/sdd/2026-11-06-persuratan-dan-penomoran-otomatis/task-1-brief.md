### Task 1: Type Contracts, Seed Mock Data, & Roman Numeral Utilities

**Files:**
- Create: `lib/types/persuratan.ts`
- Create: `lib/utils/romawi.ts`

**Interfaces:**
- Produces:
  - `lib/types/persuratan.ts`: `SuratArsipItem`, `JenisSurat`, `KodeJenisSurat`, `StatusSuratKeluar`, `StatusSuratMasuk`, `KODE_JENIS_SURAT_MAP`, `DEFAULT_SURAT_LIST`
  - `lib/utils/romawi.ts`: `angkaKeRomawi(bulan: number): string`, `generateNomorSurat(urut: number, kodeJenis: string, tanggal: Date | string): string`, `parseNomorUrut(nomorSurat: string): number | null`

- [ ] **Step 1: Definisikan tipe data & konstanta klasifikasi surat di `lib/types/persuratan.ts`**
  - Sertakan `JenisSurat = 'keluar' | 'masuk'`
  - Sertakan `KodeJenisSurat = 'UND' | 'PRM' | 'PDN' | 'DSP' | 'PKS' | 'KPT' | 'KTR' | 'PBM' | 'LAIN'`
  - Sertakan `StatusSuratKeluar = 'draft' | 'menunggu_ttd' | 'terkirim'`
  - Sertakan `StatusSuratMasuk = 'belum_disposisi' | 'didisposisi' | 'selesai'`
  - Tambahkan 5 data awal `DEFAULT_SURAT_LIST` yang persis dengan tangkapan layar user (`014/HIMASI/UND/...`, `013/HIMASI/PRM/...`, `012/HIMASI/PDN/...`, `011/HIMASI/DSP/...`, dan 1 draf `— Permohonan Narasumber Seminar`).
  - Tambahkan metadata kop JSON type untuk Fase 2.

- [ ] **Step 2: Implementasikan helper Romawi dan penomoran di `lib/utils/romawi.ts`**
  - Fungsi `angkaKeRomawi(bulan: number): string` yang mengonversi angka 1-12 ke Romawi (`I` s.d. `XII`).
  - Fungsi `generateNomorSurat(urut: number, kodeJenis: string, tanggal: Date | string): string` yang memformat nomor 3-digit `LPAD(urut, 3, '0') + '/HIMASI/' + kodeJenis + '/ISB-AL/' + romawi + '/' + tahun`.
  - Fungsi `parseNomorUrut(nomorSurat: string): number | null` untuk mengekstrak angka urut dari string nomor.

- [ ] **Step 3: Verifikasi tipe data & utilitas dengan TypeScript compiler**
  - Jalankan: `npx tsc --noEmit`
  - Expected: PASS dengan 0 eror.

NOTE: Do NOT run git commands (the user instructed: "tidak perlu menggunakan git"). Focus on creating the files and verifying with `npx tsc --noEmit`.

