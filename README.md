# HIMASI Atma Luhur Web Platform (v2)

<div align="center">
  <img src="public/logo-himasi.png" alt="Logo HIMASI ISB Atma Luhur" width="120" height="120" />

  ### Portal Resmi & Sistem Terintegrasi Himpunan Mahasiswa Sistem Informasi
  **Institut Sains dan Bisnis (ISB) Atma Luhur Pangkalpinang**  
  *Kabinet Reksabudaya • Periode 2025/2026*

  [![Next.js](https://img.shields.io/badge/Next.js-16.3.5-black?style=flat&logo=next.js)](https://nextjs.org/)
  [![React](https://img.shields.io/badge/React-19.2.8-blue?style=flat&logo=react)](https://react.dev/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
  [![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ecf8e?style=flat&logo=supabase)](https://supabase.com/)
  [![Tests](https://img.shields.io/badge/Unit_Tests-95%20Passing-brightgreen?style=flat)](#pengujian--kualitas-kode)
  [![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
</div>

---

## 📋 Daftar Isi

- [Tentang Platform](#-tentang-platform)
- [Fitur Utama](#-fitur-utama)
  - [1. Portal Publik Kemahasiswaan](#1-portal-publik-kemahasiswaan)
  - [2. Mesin E-Voting Berintegritas](#2-mesin-e-voting-berintegritas)
  - [3. Dashboard Pusat Kendali Pengurus (Swiss Minimalist Grid)](#3-dashboard-pusat-kendali-pengurus-swiss-minimalist-grid)
- [Arsitektur & Tumpukan Teknologi](#-arsitektur--tumpukan-teknologi)
- [Struktur Direktori](#-struktur-direktori)
- [Prasyarat Sistem](#-prasyarat-sistem)
- [Panduan Instalasi & Menjalankan Proyek](#-panduan-instalasi--menjalankan-proyek)
- [Konfigurasi Environment (.env.local)](#-konfigurasi-environment-envlocal)
- [Skema Basis Data & Migrasi](#-skema-basis-data--migrasi)
- [Pengujian & Kualitas Kode](#-pengujian--kualitas-kode)
- [Sistem Desain & Identitas Brand](#-sistem-desain--identitas-brand)
- [Panduan Kontribusi](#-panduan-kontribusi)
- [Tim Pengembang & Kontak](#-tim-pengembang--kontak)

---

## 🌟 Tentang Platform

**HIMASI Atma Luhur Web Platform** adalah portal resmi terintegrasi yang dikembangkan untuk mendukung seluruh kegiatan operasional, publikasi informasi, layanan aspirasi mahasiswa, serta pemilihan ketua himpunan secara demokratis dan transparan bagi civitas akademika Program Studi Sistem Informasi ISB Atma Luhur Pangkalpinang.

Dibangun dengan arsitektur modern **Next.js 16 (App Router)** dan **React 19**, sistem ini mengedepankan performa tinggi (tanpa layout shift), keamanan tingkat enterprise dengan **Supabase PostgreSQL & Row Level Security (RLS)**, serta estetika visual interaktif melalui perpaduan identitas brand HIMASI dan filosofi **Swiss Minimalist Grid**.

---

## 🚀 Fitur Utama

### 1. Portal Publik Kemahasiswaan
- **Beranda Interaktif**: Hero section dinamis, pengumuman pop-up darurat/event, showcase kabar terbaru, rekap kalender kegiatan terdekat, dan etalase mahasiswa berprestasi.
- **Profil & Sejarah Himpunan**: Sejarah berdirinya himpunan, visi-misi, bagan struktur kepengurusan Kabinet Reksabudaya, dan **Filosofi Lambang Interaktif** dengan hotspot pin dan kartu penjelasan mengambang (*hover-activated*).
- **Portal Berita & Artikel (`/berita`)**: Manajemen warta kegiatan dengan filter kategori, pencarian artikel instan, pembaca artikel ramah SEO dengan metadata OpenGraph, serta perutean dinamis `[slug]`.
- **Kalender Agenda Akademik (`/kalender`)**: Kalender terintegrasi yang memuat jadwal rapat, workshop, seminar, serta program kerja semester himpunan.
- **Aspirasi Mahasiswa**: Formulir aspirasi terbuka & anonim dengan notifikasi relay otomatis ke email fungsionaris melalui integrasi Google Apps Script Webhook.
- **Apresiasi & Karya Mahasiswa (`/apresiasi`)**: Galeri prestasi mahasiswa Sistem Informasi dengan formulir pengajuan terbuka yang dilengkapi kompresi gambar otomatis sisi klien.
- **Shortlink & QR Code Resmi (`/s/[slug]`)**: Generator pemendek tautan mandiri untuk kebutuhan publikasi dokumen dan tautan sosial media himpunan.
- **Custom Interactive Cursor**: Pointer kursor khusus (idle flame point & hover hand clicker) dengan akselerasi hardware native CSS tanpa latensi yang secara cerdas hanya aktif pada area publik dan terisolasi dari dashboard admin.

### 2. Mesin E-Voting Berintegritas
- **Alur Pemilihan 4-Tahap Mahasiswa**:
  1. *Verifikasi 2FA*: Validasi NIM resmi dan Tanggal Lahir sesuai Daftar Pemilih Tetap (DPT).
  2. *Bilik Suara (Ballot)*: Tampilan kartu kandidat bersih dengan visi, misi, dan program kerja unggulan.
  3. *Konfirmasi Pilihan*: Verifikasi akhir sebelum suara dicatat ke blockchain/database.
  4. *Tanda Terima Resmi*: Penerbitan kode unik verifikasi pemilih (`RCP-XXXX-XXXX`) dengan fitur unduh bukti pemilihan berformat PDF resmi.
- **Blind Voting Security Model**: Hasil penghitungan suara (*Quick Count*) terenkripsi dan dikunci secara ketat di tingkat basis data via Stored Procedure (`cast_student_vote`) & RLS hingga sesi pemilihan ditutup resmi oleh komisi pemilihan.
- **Anti-Double Voting**: Pencegahan ganda di level database constraint untuk menjamin asas Langsung, Umum, Bebas, Rahasia, Jujur, dan Adil.

### 3. Dashboard Pusat Kendali Pengurus (Swiss Minimalist Grid)
- **Desain Modern Swiss Minimalist Grid**: Antarmuka bersih dengan border pembatas tegas (`border-slate-200`), tipografi monospaced untuk kode data, metrik performa ringkas, dan bebas sudut membulat berlebihan.
- **Pusat Kendali E-Voting**:
  - Manajemen sesi pemilihan (Draft, Aktif, Selesai, Arsip).
  - Impor batch DPT massal via berkas CSV dengan validasi format instan.
  - Quick count real-time & kalkulasi kuorum partisipasi pemilih.
  - Cetak Berita Acara resmi pemilihan ber-kop surat resmi HIMASI ISB Atma Luhur.
- **Modul Manajemen Konten & Operasional**:
  - *Berita Manager*: Editor publikasi warta berita himpunan.
  - *Kalender Manager*: Penjadwalan agenda kegiatan.
  - *Persuratan & Penomoran Otomatis*: Arsip surat keluar/masuk dengan klasifikasi otomatis.
  - *Aspirasi Manager*: Monitoring status aspirasi (Menunggu, Diproses, Selesai).
  - *Dokumen Arsip*: Penyimpanan terpusat AD/ART, modul, dan LPJ.
  - *Absensi QR Scanner*: Pemindai presensi rapat berbasis kamera web dan kartu identitas pengurus digital.
  - *Audit Logs*: Pencatatan histori aktivitas penting administratif secara transparan.

---

## 🛠 Arsitektur & Tumpukan Teknologi

| Komponen | Teknologi | Keterangan |
| :--- | :--- | :--- |
| **Framework Utama** | [Next.js 16.3.5](https://nextjs.org/) | App Router, Server & Client Components, Turbopack/Webpack |
| **UI Library** | [React 19.2.8](https://react.dev/) | React Server Actions, Transition, Hooks |
| **Bahasa Pemrograman**| [TypeScript 5](https://www.typescriptlang.org/) | Strict type checking, type safety menyeluruh |
| **CSS & Styling** | [Tailwind CSS v4](https://tailwindcss.com/) | Theme variables modern, responsive breakpoints |
| **Ikonografi** | [Phosphor Icons](https://phosphoricons.com/) | `@phosphor-icons/react` paket ikon seragam & ringan |
| **Basis Data & Auth** | [Supabase](https://supabase.com/) | PostgreSQL 15, Row Level Security, RPC Stored Procedures |
| **QR Engine** | `html5-qrcode` & `qrcode` | Pemindaian barcode/QR kamera dan generator QR SVG/PNG |
| **Email Relay** | Google Apps Script Webhook | Pengiriman notifikasi email aman tanpa eksposur kredensial SMTP |
| **Test Runner** | Node.js Native Test Runner | `node:test` & `node:assert/strict` (95 unit tests) |
| **Package Manager** | [pnpm](https://pnpm.io/) (v12.4.2) | Manajemen paket efisien, cepat, dan terisolasi |

---

## 📁 Struktur Direktori

```text
himasiv2/
├── app/                              # Next.js 16 App Router (Rute & Layout)
│   ├── api/                          # Route Handlers (Auth webhook, Aspirasi email, dll.)
│   ├── apresiasi/                    # Halaman Apresiasi & Showcase Karya
│   ├── berita/                       # Halaman Berita & Detail Berita ([slug])
│   ├── dashboard/                    # Portal Admin Pengurus (Protected Routes)
│   ├── kalender/                     # Halaman Kalender Agenda Akademik
│   ├── login/                        # Halaman Autentikasi Pengurus
│   ├── oprec/                        # Formulir Pendaftaran Anggota Baru
│   ├── profil/                       # Halaman Profil Kepengurusan
│   ├── s/[slug]/                     # Mesin Pengalihan Shortlink
│   ├── tentang/                      # Halaman Tentang HIMASI, Filosofi, & Kontak (#kontak)
│   ├── voting/                       # Portal Pemilihan E-Voting Mahasiswa
│   ├── globals.css                   # Master CSS, Tokens, Kursor Publik Native
│   ├── layout.tsx                    # Root Layout, Metadata SEO, Font Poppins & Geist
│   ├── manifest.ts                   # Konfigurasi PWA Web Manifest
│   ├── robots.ts                     # Konfigurasi Indeks Mesin Pencari
│   └── sitemap.ts                    # Generator Peta Situs Otomatis
├── components/                       # Komponen UI Reusable
│   ├── absensi/                      # Pemindai QR & Rekap Presensi Rapat
│   ├── dashboard/                    # Pengelola Modul Admin (Swiss Grid Design)
│   ├── providers/                    # Context Providers Aplikasi
│   ├── voting/                       # Komponen Stepper E-Voting (Bilik, Verifikasi, dll.)
│   ├── footer.tsx                    # Footer Situs Publik
│   ├── navbar.tsx                    # Floating Capsule Navigation Bar
│   ├── scroll-reveal.tsx             # Animasi Scroll Reveal Berbasis IntersectionObserver
│   └── scroll-to-top-on-nav.tsx      # Manajemen Scroll Top & Anchor Link (#kontak)
├── docs/                             # Dokumentasi Spesifikasi & Rencana Arsitektur
│   ├── PRD_HIMASI.md                 # Product Requirements Document
│   └── superpowers/                  # Spesifikasi Teknis & Rencana Fitur
├── lib/                              # Utilitas, Layanan Basis Data, & Tipe Data
│   ├── constants/                    # Konfigurasi Banner, Error, & Menu
│   ├── email/                        # Modul Pengirim Relay Email
│   ├── supabase/                     # Klien Supabase, Auth Guard, & Service Model
│   ├── types/                        # Definisi Tipe TypeScript Global
│   └── utils/                        # Format Tanggal, Helper Voting, QR Code, Slug
├── public/                           # Aset Statis (Gambar, Logo, Kursor, Favicon)
│   └── cursors/                      # Asset Kursor Hand & Point (32px & 48px Retina)
├── supabase/
│   └── migrations/                   # Berkas SQL Migrasi PostgreSQL & RLS
├── test/                             # Berkas Pengujian Unit (Node.js Native Test)
├── CONTRIBUTING.md                   # Panduan Berkontribusi Proyek
├── package.json                      # Konfigurasi Dependensi & Skrip Proyek
├── tsconfig.json                     # Konfigurasi TypeScript Compiler
└── README.md                         # Dokumentasi Utama Proyek
```

---

## 💻 Prasyarat Sistem

Sebelum memulai instalasi, pastikan lingkungan pengembangan lokal Anda telah memenuhi persyaratan berikut:

- **Node.js**: Versi `20.x` atau `22.x` (disarankan Node.js LTS).
- **pnpm**: Versi `9.x` atau `12.x` (`corepack enable pnpm` atau `npm i -g pnpm`).
- **Git**: Versi terbaru untuk manajemen branch.
- **Akun Supabase**: Proyek Supabase aktif untuk basis data dan autentikasi.

---

## ⚡ Panduan Instalasi & Menjalankan Proyek

### 1. Klon Repositori
```bash
git clone https://github.com/himasi-atmaluhur/himasiv2.git
cd himasiv2
```

### 2. Pasang Dependensi
Gunakan `pnpm` untuk memasang seluruh paket secara konsisten:
```bash
pnpm install
```

### 3. Konfigurasi Environment Variables
Salin berkas template lingkungan:
```bash
cp .env.example .env.local
```
Buka `.env.local` pada editor Anda dan sesuaikan kredensial proyek Supabase Anda.

### 4. Jalankan Server Pengembangan
```bash
pnpm dev
```
Buka peramban Anda di [http://localhost:3000](http://localhost:3000).

---

## 🔐 Konfigurasi Environment (.env.local)

Berikut adalah daftar variabel lingkungan yang dibutuhkan:

| Nama Variabel | Wajib | Deskripsi |
| :--- | :---: | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Ya | URL Endpoint proyek Supabase (`https://xyz.supabase.co`). |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Ya | Anon / Public API Key dari Supabase Dashboard. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Opsional | Kunci publishable alternatif untuk client browser. |
| `HIMASI_EMAIL_WEBHOOK_URL` | Opsional | URL Webhook Google Apps Script untuk pengiriman notifikasi email. |
| `HIMASI_EMAIL_SECRET_TOKEN` | Opsional | Token rahasia otentikasi webhook relay email. |
| `SUPABASE_AUTH_HOOK_SECRET` | Opsional | Kunci verifikasi HMAC-SHA256 untuk hook auth Supabase (`v1,whsec_...`). |

---

## 🗄 Skema Basis Data & Migrasi

Seluruh migrasi basis data berada di folder `supabase/migrations/`:

```bash
supabase/migrations/
├── 20261106_create_surat_arsip.sql        # Tabel arsip surat keluar/masuk
├── 20261107_create_content_plans.sql      # Tabel jadwal publikasi konten sosmed
├── 20261108_enhance_aspirasi_system.sql   # Tabel aspirasi mahasiswa & status
├── 20261109_create_audit_logs.sql         # Tabel audit log histori aktivitas
├── 20261110_create_homepage_popups.sql    # Tabel pop-up banner beranda
├── 20261110_create_short_links.sql        # Tabel pemendek tautan resmi
├── 20261112_create_voting_tables.sql      # Tabel sesi e-voting, kandidat, dpt, suara
└── 20261114_harden_evoting_security.sql   # Pengerasan RLS & RPC cast_student_vote
```

Jika Anda menggunakan **Supabase CLI**, Anda dapat menerapkan migrasi lokal dengan:
```bash
supabase db push
# atau
supabase migration up
```

---

## 🧪 Pengujian & Kualitas Kode

Proyek ini dilengkapi dengan rangkaian pengujian komprehensif menggunakan **Node.js Native Test Runner** (`node:test` dan `node:assert/strict`) tanpa dependensi tambahan yang berat.

```bash
# 1. Menjalankan seluruh rangkaian unit tests (15 test suites, 95 tests)
pnpm test

# 2. Menjalankan pemeriksaan type safety TypeScript
pnpm run typecheck

# 3. Menjalankan linter Next.js & ESLint
pnpm run lint

# 4. Melakukan simulasi build produksi lengkap
pnpm run build
```

---

## 🎨 Sistem Desain & Identitas Brand

### 1. Palet Warna Resmi
| Nama Token | Nilai Hex | Peran Semantik |
| :--- | :--- | :--- |
| **`HIMASI Blue`** | `#0094E0` | Aksen cerah, tombol aksi utama, hover state, indikator aktif |
| **`HIMASI Navy`** | `#00296E` | Warna brand resmi, judul utama, latar belakang navbar/footer |
| **`Deep Midnight`** | `#001b4a` | Kontras tinggi, teks hitam navy |
| **`Pure White`** | `#FFFFFF` | Latar belakang bersih, panel kartu |
| **`Sky Mist`** | `#F0F8FF` / `#f7faff` | Latar belakang gradasi halus & badge lembut |

### 2. Standar Tipografi
- **Headings & Body Font**: [Poppins](https://fonts.google.com/specimen/Poppins) & [Geist](https://vercel.com/font) dioptimasi tanpa Cumulative Layout Shift (CLS) via `next/font`.
- **Admin Dashboard**: Tipografi presisi dengan font monospace (`font-mono`) pada data numerik (NIM, kode verifikasi, hash token).

---

## 🤝 Panduan Kontribusi

Kami sangat menyambut kontribusi dari pengurus, mahasiswa, dan kontributor open-source!

Untuk menjaga kualitas kode, keamanan data, dan konsistensi arsitektur sistem, silakan baca panduan kontribusi lengkap di **[CONTRIBUTING.md](CONTRIBUTING.md)** sebelum membuat Pull Request.

### Alur Singkat:
1. **Fork** repositori ini ke akun GitHub Anda.
2. Buat branch fitur baru (`git checkout -b feature/fitur-keren-anda`).
3. Tulis kode Anda dengan standar TypeScript ketat dan pastikan menggunakan Phosphor Icons.
4. Jalankan pengujian `pnpm test` dan `pnpm run typecheck` hingga 100% lulus.
5. Lakukan commit dengan pesan konvensional (`feat: menambahkan fitur X`).
6. Buka **Pull Request** ke branch `master` dengan deskripsi perubahan yang jelas.

---

## 👥 Tim Pengembang & Kontak

Platform ini dikembangkan dan dikelola oleh:
- **Departemen Komunikasi, Informasi & Teknologi (KOMINFO)**  
  **Himpunan Mahasiswa Sistem Informasi (HIMASI)**  
  **Institut Sains dan Bisnis (ISB) Atma Luhur Pangkalpinang**
- **Situs Resmi**: [himasi.atmaluhur.ac.id](https://himasi.atmaluhur.ac.id)
- **Instagram**: [@himasi.atmaluhur](https://instagram.com/himasi.atmaluhur)
- **Email Sekretariat**: `himasi@atmaluhur.ac.id`
- **Sekretariat**: Ruang Himpunan Mahasiswa ISB Atma Luhur, Jl. Jendral Sudirman, Selindung Baru, Kota Pangkalpinang, Kepulauan Bangka Belitung 33172.

---

<div align="center">
  <sub>Dibuat dengan dedikasi untuk kemajuan mahasiswa Sistem Informasi ISB Atma Luhur.</sub><br />
  <sub>© 2025/2026 HIMASI ISB Atma Luhur • Kabinet Reksabudaya. Seluruh Hak Cipta Dilindungi.</sub>
</div>
