# Panduan Kontribusi (Contributing Guidelines)

Terima kasih atas ketertarikan Anda untuk berkontribusi pada **HIMASI Atma Luhur Web Platform (v2)**! 🚀

Proyek ini dibangun untuk mendukung kebutuhan digital civitas akademika Program Studi Sistem Informasi ISB Atma Luhur Pangkalpinang. Kontribusi Anda—baik berupa perbaikan bug, penambahan fitur baru, perbaikan dokumentasi, maupun optimasi performa—sangat berarti bagi kemajuan bersama.

Panduan ini disusun untuk memastikan proses pengembangan berjalan lancar, terstandar, dan teratur bagi seluruh kontributor.

---

## 📋 Daftar Isi

1. [Kode Etik (Code of Conduct)](#1-kode-etik-code-of-conduct)
2. [Cara Memulai (Getting Started)](#2-cara-memulai-getting-started)
3. [Alur Percabangan & Git Workflow](#3-alur-percabangan--git-workflow)
4. [Konvensi Pesan Commit (Conventional Commits)](#4-konvensi-pesan-commit-conventional-commits)
5. [Standar Penulisan Kode (Coding Standards)](#5-standar-penulisan-kode-coding-standards)
   - [Next.js 16 & React 19](#nextjs-16--react-19)
   - [TypeScript](#typescript)
   - [Tailwind CSS v4 & Sistem Desain](#tailwind-css-v4--sistem-desain)
   - [Ikonografi (Phosphor Icons)](#ikonografi-phosphor-icons)
   - [Basis Data Supabase & Keamanan (RLS & RPC)](#basis-data-supabase--keamanan-rls--rpc)
6. [Pengujian & Verifikasi Kualitas](#6-pengujian--verifikasi-kualitas)
7. [Proses Pengajuan Pull Request (PR)](#7-proses-pengajuan-pull-request-pr)
8. [Pelaporan Isu (Issue Reporting)](#8-pelaporan-isu-issue-reporting)
9. [Bantuan & Komunikasi](#9-bantuan--komunikasi)

---

## 1. Kode Etik (Code of Conduct)

Sebagai komunitas akademik dan organisasi mahasiswa, kami berkomitmen menciptakan lingkungan yang ramah, inklusif, profesional, dan saling menghormati:
- Berkomunikasi secara sopan dan konstruktif dalam diskusi Pull Request dan Issue.
- Menghargai sudut pandang dan tingkat keahlian sesama kontributor.
- Mengutamakan integritas dan transparansi, khususnya pada modul-modul krusial seperti **E-Voting**, **Aspirasi**, dan **Data Pengurus**.
- Menjaga kerahasiaan kredensial produksi dan data pribadi pemilih/mahasiswa.

---

## 2. Cara Memulai (Getting Started)

### Prasyarat:
- **Node.js**: Versi `20.x` atau `22.x` LTS.
- **pnpm**: Versi `9.x` atau `12.x` (Wajib, jangan gunakan `npm` atau `yarn` untuk menjaga integritas `pnpm-lock.yaml`).
- **Git**: Terpasang dan terkonfigurasi.

### Langkah Instalasi:
1. **Fork** repositori ini ke akun GitHub personal Anda.
2. **Klon** hasil fork ke mesin lokal Anda:
   ```bash
   git clone https://github.com/<username-anda>/himasiv2.git
   cd himasiv2
   ```
3. Pasang dependensi proyek:
   ```bash
   pnpm install
   ```
4. Siapkan konfigurasi variabel lingkungan lokal:
   ```bash
   cp .env.example .env.local
   ```
   Isi konfigurasi Supabase (URL dan Anon Key) sesuai proyek Supabase pengembangan lokal atau cloud Anda.
5. Jalankan server pengembangan lokal:
   ```bash
   pnpm dev
   ```
   Akses aplikasi di browser pada `http://localhost:3000`.

---

## 3. Alur Percabangan & Git Workflow

Kami menggunakan alur percabangan berbasis **Feature Branch Workflow**:

1. Pastikan branch `master` lokal Anda selalu sinkron dengan repositori utama (`upstream`):
   ```bash
   git remote add upstream https://github.com/himasi-atmaluhur/himasiv2.git
   git checkout master
   git pull upstream master
   ```
2. Buat branch baru dari `master` dengan penamaan deskriptif:
   - Fitur Baru: `feature/nama-fitur` (contoh: `feature/export-excel-dpt`)
   - Perbaikan Bug: `fix/nama-bug` (contoh: `fix/voting-receipt-overflow`)
   - Dokumentasi: `docs/nama-dokumen` (contoh: `docs/api-voting-reference`)
   - Refactoring / Optimasi: `refactor/nama-modul` (contoh: `refactor/news-image-compression`)
   ```bash
   git checkout -b feature/nama-fitur-anda
   ```

---

## 4. Konvensi Pesan Commit (Conventional Commits)

Gunakan format [Conventional Commits](https://www.conventionalcommits.org/) dalam bahasa Indonesia atau Inggris untuk menjaga riwayat git yang rapi dan mudah dilacak:

```text
<tipe>(<lingkup-opsional>): <deskripsi singkat perubahan>

[badan pesan opsional yang menjelaskan alasan perubahan]
```

### Tipe Commit yang Didukung:
- `feat`: Penambahan fitur baru bagi pengguna (contoh: `feat(voting): tambah unduh berita acara pdf`).
- `fix`: Perbaikan bug atau kesalahan logika (contoh: `fix(navbar): perbaiki offset scroll anchor #kontak`).
- `docs`: Perubahan atau penambahan dokumentasi saja (contoh: `docs: perbarui panduan instalasi di readme`).
- `style`: Perubahan formatting kode tanpa memengaruhi logika (whitespace, semicolon, dll.).
- `refactor`: Restrukturisasi kode tanpa menambah fitur baru atau mengubah behavior (contoh: `refactor(dashboard): modularisasi tab manajer`).
- `test`: Penambahan atau perbaikan unit test (contoh: `test: tambah verifikasi rpc cast_student_vote`).
- `perf`: Optimasi performa dan pengurangan waktu muat (contoh: `perf: optimasi dynamic import komponen absensi`).
- `chore`: Pembaruan dependensi, konfigurasi build, atau skrip internal.

---

## 5. Standar Penulisan Kode (Coding Standards)

### Next.js 16 & React 19
- **App Router**: Gunakan konvensi App Router terbaru (`app/`).
- **Server vs Client Components**:
  - Jadikan komponen sebagai **Server Component** secara default.
  - Tambahkan direktif `"use client";` di baris paling atas hanya jika komponen menggunakan hooks (`useState`, `useEffect`), event listener (`onClick`), atau API browser (`window`, `document`).
- **Dynamic Route Handlers**:
  - Pada Next.js 16, parameter rute dinamis bersifat asynchronous:
    ```typescript
    // Contoh di Server Component atau Route Handler:
    export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
      const { slug } = await params;
      // ...
    }
    ```
- **Pencegahan Cumulative Layout Shift (CLS)**:
  - Jangan gunakan `content-visibility: auto` (`.content-auto`) pada komponen atau seksi yang berada di atas target navigasi anchor (`#id`), karena dapat menyebabkan pergeseran posisi scroll saat scrolling berlangsung.
  - Berikan wadah gambar dengan dimensi eksplisit atau rasio aspek (misal: `aspect-video`, `aspect-[16/11]`, `h-[380px]`).

### TypeScript
- Tulis kode dengan mode **strict**: hindari penggunaan tipe `any`. Gunakan tipe data spesifik atau `unknown` jika tipe belum pasti.
- Simpan definisi tipe global atau antarmuka data di folder `lib/types/` (misal: `lib/types/voting.ts`, `lib/types/aspirasi.ts`).
- Manfaatkan export/import type yang jelas:
  ```typescript
  import type { Kandidat, SesiPemilihan } from "@/lib/types/voting";
  ```

### Tailwind CSS v4 & Sistem Desain
- **Area Publik**: Ikuti palet warna brand HIMASI:
  - Primer: `#0094E0` (`text-[#0094E0]`, `bg-[#0094E0]`)
  - Navy: `#00296E` (`text-[#00296E]`, `bg-[#00296E]`)
  - Aksen / Latar: Putih, `#f0f8ff`, `#f7faff`
- **Dashboard Admin (Swiss Minimalist Grid)**:
  - Gunakan layout grid tegas dengan pembatas garis tipis (`border-slate-200` atau `border-slate-100`).
  - Hindari penggunaan sudut membulat berlebihan (`rounded-2xl`, `rounded-3xl`) pada modul dashboard data; prioritaskan estetika datar bersih khas Swiss Style (`rounded-none`, `rounded-sm`, atau border grid murni).
  - Tampilkan data kode, NIM, tanggal, dan metrik dengan font monospace (`font-mono`).

### Ikonografi (Phosphor Icons)
- Seluruh ikon UI menggunakan pustaka `@phosphor-icons/react`.
- Hindari mencampuradukkan paket ikon pihak ketiga lainnya (Lucide, Heroicons, FontAwesome) untuk menjaga keseragaman ukuran bundle dan visual.
- Contoh penggunaan:
  ```tsx
  import { EnvelopeSimple, Users, CheckCircle } from "@phosphor-icons/react";
  
  <EnvelopeSimple className="w-5 h-5 text-[#00296E]" />
  ```

### Basis Data Supabase & Keamanan (RLS & RPC)
- **Migrasi**: Jangan mengubah tabel langsung di Dashboard produksi. Selalu buat berkas migrasi SQL baru di `supabase/migrations/` dengan awalan tanggal: `YYYYMMDD_deskripsi_singkat.sql`.
- **Row Level Security (RLS)**:
  - Wajib mengaktifkan RLS pada seluruh tabel:
    ```sql
    ALTER TABLE nama_tabel ENABLE ROW LEVEL SECURITY;
    ```
  - Pisahkan policy untuk akses publik (read-only jika perlu) dan akses pengurus/admin yang terautentikasi (`auth.role() = 'authenticated'`).
- **Server Auth Guard**:
  - Setiap API Route admin (`app/api/...`) wajib diverifikasi menggunakan `verifyServerAdminAuth` dari `@/lib/supabase/auth-guard` untuk mencegah akses tanpa izin.
- **Logika Kritis E-Voting**:
  - Pencatatan suara tidak boleh dilakukan secara insert langsung dari browser pemilih. Wajib menggunakan Stored Procedure aman berparameter (`cast_student_vote` RPC) yang memverifikasi kecocokan DPT, tanggal lahir, dan status belum memilih secara atomik (ACID transaction).

---

## 6. Pengujian & Verifikasi Kualitas

Setiap perubahan wajib lulus seluruh pengujian sebelum diajukan ke Pull Request.

Jalankan perintah verifikasi berikut secara berurutan:

```bash
# 1. Jalankan seluruh unit tests
pnpm test

# 2. Periksa keabsahan tipe data TypeScript
pnpm run typecheck

# 3. Jalankan linter ESLint
pnpm run lint

# 4. Pastikan build produksi berhasil tanpa error
pnpm run build
```

Jika Anda menambahkan fitur atau modul baru, tambahkan unit test pengujian di folder `test/` (misal: `test/fitur-baru.test.mjs`) menggunakan native test runner Node.js (`node:test` dan `node:assert/strict`).

---

## 7. Proses Pengajuan Pull Request (PR)

Sebelum menekan tombol **"Create Pull Request"**, pastikan Anda telah melengkapi checklist berikut:

- [ ] Kode telah diuji secara lokal di server pengembangan (`pnpm dev`).
- [ ] Rangkaian unit test lulus 100% (`pnpm test`).
- [ ] Pemeriksaan TypeScript compiler menghasilkan 0 error (`pnpm run typecheck`).
- [ ] Build produksi berhasil (`pnpm run build`).
- [ ] Tidak ada berkas sensitif (`.env.local`, file backup, credentials) yang masuk ke staging git.
- [ ] Judul dan deskripsi PR menjelaskan perubahan secara terperinci.

### Format Deskripsi Pull Request:
```markdown
### 📝 Deskripsi Perubahan
Jelaskan secara singkat apa yang diubah, ditambahkan, atau diperbaiki dalam PR ini.

### 🎯 Tautan Isu (Issue / Ticket)
Terkait dengan issue: #123 (jika ada)

### 🧪 Bukti Pengujian
- [x] Unit test lulus (`pnpm test`)
- [x] Typecheck lulus (`pnpm run typecheck`)
- [x] Build produksi lulus (`pnpm run build`)
- Sertakan screenshot / cuplikan layar jika terdapat perubahan visual antarmuka (UI).

### 🔍 Catatan Tambahan bagi Reviewer
Informasi khusus atau langkah konfigurasi lingkungan yang perlu diperhatikan.
```

---

## 8. Pelaporan Isu (Issue Reporting)

Jika Anda menemukan bug atau memiliki ide perbaikan fitur, silakan buat issue baru di GitHub dengan rincian:

- **Judul Jelas**: Awali dengan tag seperti `[BUG]` atau `[ENHANCEMENT]`.
- **Langkah Mereproduksi**: Rincian langkah demi langkah dari awal hingga bug terjadi.
- **Perilaku yang Diharapkan vs Perilaku Aktual**: Apa yang seharusnya terjadi dan apa yang sebenarnya terjadi.
- **Tangkapan Layar / Cuplikan Error**: Lampirkan pesan log dari konsol browser atau terminal.
- **Informasi Lingkungan**: Sistem operasi, versi peramban (Chrome, Firefox, Safari), dan resolusi layar.

---

## 9. Bantuan & Komunikasi

Jika Anda memiliki pertanyaan teknis seputar arsitektur, basis data, atau ingin berdiskusi mengenai rancangan fitur sebelum mulai mengode:

- Hubungi tim pengembang via email: `himasi@atmaluhur.ac.id`
- Diskusi internal tim di Sekretariat HIMASI ISB Atma Luhur Pangkalpinang.
- Buka thread di tab **Discussions / Issues** pada repositori GitHub ini.

Selamat berkontribusi dan mari kita bangun ekosistem digital HIMASI yang berdaya saing tinggi! 💙
