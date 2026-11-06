### Task 3: Swiss Minimalist Grid Persuratan Module Component

**Files:**
- Create: `components/dashboard/persuratan-manager.tsx`

**Interfaces:**
- Consumes:
  - `lib/types/persuratan.ts`: `SuratArsipItem`, `JenisSurat`, `KodeJenisSurat`, `StatusSuratKeluar`, `StatusSuratMasuk`, `KODE_JENIS_SURAT_MAP`, `KLASIFIKASI_SURAT_LIST`, `DEFAULT_SURAT_LIST`
  - `lib/utils/romawi.ts`: `generateNomorSurat`, `parseNomorUrut`, `formatTanggalSurat`, `angkaKeRomawi`
  - `lib/supabase/persuratan.ts`: `getDaftarSurat`, `getNextNomorUrut`, `createSurat`, `updateSurat`, `updateStatusSurat`, `revertSuratToDraft`, `deleteSurat`, `uploadBerkasSurat`
  - `lib/types/auth.ts`: `UserRole`, `ROLE_LABELS`
- Produces:
  - `<PersuratanManager currentUserRole={currentUserRole} />`

- [ ] **Step 1: Layout Header & 4 Kartu Metrik Swiss Grid**
  - Category breadcrumb: `02. ORGANISASI & ARSIP`
  - Title: `Persuratan` + Subtitle *"Penomoran otomatis, template surat, dan arsip surat masuk & keluar."*
  - Top buttons: `Ekspor Rekap` (CSV) dan `+ Buat Surat` (buka modal)
  - 4 Cards: Surat Keluar, Surat Masuk, Menunggu Tanda Tangan (amber), Nomor Berikutnya (cyan/sky 3-digit, misal `015`)

- [ ] **Step 2: Tab Navigasi & Filter Bar Dinamis**
  - Tab buttons: `Surat Keluar`, `Surat Masuk`, `Buat Surat Baru`
  - Search input: *"Cari nomor, perihal, atau tujuan..."*
  - Dynamic status pills:
    - Tab `Surat Keluar`: `Semua`, `Draft`, `Menunggu TTD`, `Terkirim`
    - Tab `Surat Masuk`: `Semua`, `Belum Disposisi`, `Didisposisi`, `Selesai`

- [ ] **Step 3: Tabel Data Responsif Swiss Grid**
  - Dark mode `#001438` / `#001740`, border hairline `border-[#00296E]/20 dark:border-white/10`, `rounded-none`.
  - Columns Surat Keluar: `NOMOR SURAT`, `PERIHAL`, `TUJUAN`, `TANGGAL`, `STATUS`, `AKSI`.
  - Columns Surat Masuk: `NOMOR SURAT ASAL`, `PERIHAL`, `INSTANSI PENGIRIM`, `TANGGAL DITERIMA`, `STATUS DISPOSISI`, `AKSI`.
  - Actions: Eye (Preview/Detail modal) dan Download.
  - Formula footer: `Format nomor: [urut]/HIMASI/[kode jenis]/ISB-AL/[bulan romawi]/[tahun]`.

- [ ] **Step 4: Modal-Modal Interaktif & Logika Daur Ulang Nomor (*Number Recycling*)**
  - Modal Form Buat Surat Keluar: Klasifikasi, perihal, tujuan, tanggal surat, upload PDF (opsional), Simpan Draf (nomor `—`) vs Ajukan ke BPH (locks nomor berikutnya).
  - Modal Catat Surat Masuk: Instansi pengirim, nomor asal, perihal, tanggal diterima, upload PDF, disposisi BPH.
  - Modal Detail Surat: Rincian lengkap, tombol *Salin Nomor Surat*, tombol aksi BPH (Setujui TTD $\rightarrow$ `terkirim`, atau Tolak / Tarik kembali ke Draf $\rightarrow$ melepaskan nomor urut ke antrean).
  - Ekspor CSV: Mengunduh data tabel aktif ke format `.csv` dengan header rapi.

- [ ] **Step 5: Verifikasi Type Safety**
  - Jalankan `npx tsc --noEmit` di powershell (harus 0 errors).

NOTE: Do NOT run git commands (user instructed: "tidak perlu menggunakan git"). Focus on creating the component and verifying with `npx tsc --noEmit`.

