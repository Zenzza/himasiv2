# Task 3 Report: Swiss Minimalist Grid Persuratan Module Component

- **Status:** DONE
- **Tanggal:** 2026-11-06
- **Komponen yang Dibuat:** `components/dashboard/persuratan-manager.tsx`
- **Verifikasi TypeScript:** `npx tsc --noEmit` $\rightarrow$ 0 errors

---

## 1. Ringkasan Implementasi

Komponen antarmuka dashboard `PersuratanManager` telah selesai dibangun dengan mematuhi penuh prinsip desain **Swiss Minimalist Grid** dan seluruh persyaratan teknis pada spesifikasi (`docs/superpowers/specs/2026-11-06-persuratan-design.md`) serta `task-3-brief.md`.

### Fitur Utama yang Dihadirkan:

1. **Header & Kategori Baku:**
   - Kategori breadcrumb: `02. ORGANISASI & ARSIP`
   - Judul Modul: `Persuratan`
   - Subjudul: *"Penomoran otomatis, template surat, dan arsip surat masuk & keluar."*
   - Tombol cepat: `Muat Ulang` (refresh icon), `Ekspor Rekap` (CSV), dan `+ Buat Surat` / `+ Catat Surat Masuk`.

2. **4 Kartu Metrik Operasional Swiss Grid:**
   - **Surat Keluar:** Total surat keluar periode berjalan (*"periode ini"*).
   - **Surat Masuk:** Total surat masuk (*"X belum didisposisi"*).
   - **Menunggu Tanda Tangan:** Jumlah surat keluar berstatus `menunggu_ttd` (*"perlu tindakan Ketua"*, teks amber).
   - **Nomor Berikutnya:** Tampilan 3-digit nomor urut berikutnya yang akan diterbitkan (*"urut otomatis per tahun"*, teks cyan/sky e.g. `015`).

3. **Tab Navigasi & Filter Dinamis:**
   - Tab navigasi atas: `Surat Keluar`, `Surat Masuk`, dan `Buat Surat Baru`.
   - Input pencarian responsif: *"Cari nomor, perihal, atau tujuan..."*.
   - Filter status pills dinamis:
     - Tab Surat Keluar: `Semua`, `Draft`, `Menunggu TTD`, `Terkirim`.
     - Tab Surat Masuk: `Semua`, `Belum Disposisi`, `Didisposisi`, `Selesai`.

4. **Tabel Data Responsif Swiss Grid:**
   - Palet tema gelap presisi: dark canvas `#001740`, kartu `#001438`, border hairline `border-[#00296E]/20 dark:border-white/10`, sudut tegas `rounded-none`, tanpa bayangan `shadow-none`.
   - Kolom Surat Keluar: `NOMOR SURAT`, `PERIHAL`, `TUJUAN`, `TANGGAL`, `STATUS`, `AKSI`.
   - Kolom Surat Masuk: `NOMOR SURAT ASAL`, `PERIHAL`, `INSTANSI PENGIRIM`, `TANGGAL DITERIMA`, `STATUS DISPOSISI`, `AKSI`.
   - Formula footer informatif: `Format penomoran: [urut]/HIMASI/[kode jenis]/ISB-AL/[bulan romawi]/[tahun]`.

5. **Modal Interaktif & Mekanisme Number Recycling:**
   - **Modal Buat Surat Keluar:** Klasifikasi jenis surat baku (`UND`, `PRM`, `PDN`, `DSP`, dll.), tanggal surat, perihal, tujuan, unggah PDF (opsional), live preview estimasi nomor resmi, tombol `Simpan Draf (Tanpa Nomor)` vs `Ajukan ke BPH` (mengunci nomor urut berikutnya).
   - **Modal Catat Surat Masuk:** Pencatatan instansi luar, nomor asal dokumen, perihal, tanggal surat & tanggal diterima, status disposisi awal, instruksi tindak lanjut, dan unggahan PDF.
   - **Modal Detail Dokumen:** Pratinjau lengkap, tombol *Salin Nomor Surat* dengan visual checkmark, unduh/lampirkan PDF, lembar disposisi BPH.
   - **Aksi Pimpinan BPH (Number Recycling):**
     - *Setujui & Tandai Terkirim:* Status berubah menjadi `terkirim`.
     - *Tolak / Tarik ke Draf (Recycle):* Menjalankan `revertSuratToDraft()`, melepaskan `nomor_urut` kembali `NULL` dan nomor kembali `—`. Kartu nomor berikutnya langsung memperbarui urutan antrean tanpa celah nomor bolong.
   - **Ekspor CSV:** Mengonversi data tabel aktif ke format RFC 4180 `.csv` dan memicu pengunduhan otomatis.

---

## 2. Hasil Verifikasi

- **Kompilasi TypeScript:**
  ```powershell
  npx tsc --noEmit
  # Exit code: 0 (No errors)
  ```
- **Batasan Pengguna Dipatuhi:**
  - Tidak ada perintah git yang dieksekusi selama pengerjaan sesuai instruksi pengguna ("tidak perlu menggunakan git").
