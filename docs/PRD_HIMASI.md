# Product Requirements Document (PRD)
## Website Resmi HIMASI (Himpunan Mahasiswa Sistem Informasi)

**Version:** 1.0.0  
**Status:** In Review / Ready for Implementation  
**Target Audience:** Mahasiswa Sistem Informasi, Dosen & Program Studi, Calon Mahasiswa, Mitra Industri/Eksternal, Alumni  
**Design Reference:** HIMASI Brand Identity (`#0094E0`, `#00296E`, `#FFFFFF`, Poppins) & Modern Floating Capsule Navigation  

---

## 1. Executive Summary & Objective

### 1.1 Objective
Membangun platform portal resmi HIMASI yang modern, responsif, dan interaktif yang berfungsi sebagai:
1. **Pusat Informasi Terintegrasi:** Menyediakan akses terpusat untuk pengumuman akademik, program kerja himpunan, arsip dokumen, dan kalender kegiatan semester.
2. **Kanal Aspirasi Dua Arah:** Memfasilitasi mahasiswa dalam menyalurkan aspirasi, kritik, dan saran kepada pengurus himpunan maupun program studi secara transparan atau anonim.
3. **Pusat Kolaborasi & Prestasi:** Menjadi etalase pencapaian prestasi mahasiswa Sistem Informasi serta gerbang kerja sama dengan mitra organisasi, sponsorship, dan industri.

### 1.2 Target Metrics & Success Criteria
- **Accessibility & Responsiveness:** 100% responsif pada mobile, tablet, dan desktop tanpa layout shift (CLS < 0.05).
- **Performance:** Skor Google Lighthouse > 90 untuk Performance, Accessibility, Best Practices, dan SEO.
- **Engagement:** Mahasiswa dapat mencari dokumen dan mengirim aspirasi dalam kurang dari 3 langkah navigasi (< 10 detik).
- **Interactivity:** Filter realtime pada kalender semester, program kerja, dan pusat unduhan dokumen tanpa refresh halaman.

---

## 2. Design System & Brand Identity

Berdasarkan Design Brief yang ditentukan:

### 2.1 Color Palette
| Token Name | Hex Code | Semantic Role | Usage Example |
| :--- | :--- | :--- | :--- |
| **`himasi-blue`** | `#0094E0` | Primary Accent / Electric Cyan-Blue | Gradient start, active highlights, badge accents, icons |
| **`himasi-navy`** | `#00296E` | Brand Primary / Royal Deep Navy | Header gradient end, dark buttons, text contrast, footer |
| **`himasi-navy-dark`**| `#001b4a` | Midnight Navy / Deep Surface | Active capsule tab, high contrast button hover, dark mode |
| **`himasi-surface`** | `#FFFFFF` | Base Light Background | Main background, card surface, clean content panels |
| **`himasi-sky`** | `#F0F8FF` / `#E5F4FD` | Soft Tint Neutral | Card subtle tints, hover backgrounds, tag capsules |
| **`himasi-slate`** | `#475569` | Body Muted Text | Secondary typography, captions, metadata |

### 2.2 Typography
- **Primary Font Family:** **Poppins** (Google Fonts)
  - `Light (300)`: Keterangan waktu / metadata
  - `Regular (400)`: Body text, paragraf informasi
  - `Medium (500)`: Menu navigasi, button labels, pills
  - `SemiBold (600)`: Subjudul komponen, card titles, table headers
  - `Bold (700)`: Page headlines, hero display text
- **Scale:** Modular scale (Mobile: 14px base, Desktop: 16px base, Hero: 36px–56px responsive).

### 2.3 Visual Language & Navbar Architecture
- **Capsule / Floating Pill Style (Reference Payius Style):**
  - Header dengan top banner bergradasi halus `#0094E0` ke `#00296E` atau floating glass capsule.
  - **Left Section:** Logo grafis HIMASI modern dengan tipografi brand "HIMASI".
  - **Center Section:** Floating capsule pill navigation dengan backdrop blur, border tipis semi-transparan, indikator tab aktif (pill gelap `#00296E` berkontras tajam dengan teks putih), dan efek hover halus pada item non-aktif.
  - **Right Section:** Quick semester indicator / badge interaktif + Tombol CTA primer ("Kirim Aspirasi" / "Hubungi Kami") berkontur rounded pill.
  - **Mobile State:** Hamburger menu dengan animasi smooth spring/slide-over card drawer.

---

## 3. Tech Stack & Environment

| Layer | Technology | Rationale |
| :--- | :--- | :--- |
| **Framework** | Next.js 16 (App Router + React 19) | Server-side rendering, performa optimal, SEO built-in |
| **Styling** | Tailwind CSS v4 + Vanilla CSS Variables | Ringan, modern theme engine, utilitas konsisten |
| **Typography** | `next/font/google` (`Poppins`) | Zero CLS, optimized font delivery |
| **Icons** | Lucide React | Ikon modern, ringan, accessible |
| **State & Interactivity** | React Hooks (`useState`, `useMemo`) | Client filtering cepat tanpa dependensi berat |
| **Package Manager** | `pnpm` (v12.4.2) | Cepat, efisien disk space |

---

## 4. Full Commands

```bash
# Development server (runs on http://localhost:3000)
pnpm run dev

# Typechecking verification
npx tsc --noEmit

# Production build
pnpm run build

# Start production server
pnpm run start

# Linting
pnpm run lint
```

---

## 5. Information Architecture & Site Map

Berdasarkan revisi struktur navigasi dan tata letak:

```
HIMASI Portal Web
├── 1. Home (Landing Page - /)
│   ├── Hero Banner with HIMASI Mission & Quick CTAs
│   ├── Sekilas HIMASI & Highlight Kabinet
│   ├── Metrik Statistik (Mahasiswa, Proker, Prestasi, Dokumen)
│   ├── Showcase Ringkasan Layanan & Fitur Utama
│   ├── Preview Agenda & Pengumuman Penting Terdekat
│   └── [REVISI] Form Aspirasi Mahasiswa (Terintegrasi di Bagian Bawah Halaman)
│       ├── Input Kategori Aspirasi (Akademik, Sarpras, Himpunan, Advokasi)
│       ├── Checkbox Kirim Anonim / Cantumkan NIM & Nama
│       ├── Form Pesan, Subjek & Lampiran Bukti
│       └── Notifikasi Sukses dengan Nomor Tiket Aspirasi
├── 2. Profil & Kelembagaan (/profil)
│   ├── [Sub-modul A] Profil & Struktur Organisasi
│   │   ├── Sejarah Singkat, Visi, Misi & Nilai Dasar (Core Values)
│   │   ├── Sambutan Ketua Himpunan
│   │   └── Bagan Struktur Organisasi (BPH & Divisi: Akademik, Kominfo, PSDM, Hublu, Danus)
│   ├── [Sub-modul B] Program Kerja dan Agenda
│   │   ├── Linimasa Proker 1 Periode Kepengurusan
│   │   ├── Filter Berdasarkan Divisi Pelaksana & Status (Akan Datang, Berjalan, Selesai)
│   │   └── Detail Tiap Program Kerja (Tujuan, Sasaran, Output Kegiatan)
│   ├── [Sub-modul C] Pusat Unduhan Dokumen
│   │   ├── Repositori Berkas Resmi (Surat Dispensasi, Template Proposal, AD/ART, Modul, Silabus)
│   │   ├── Search Bar & Filter Kategori File
│   │   └── Detail Format (.PDF, .DOCX, .ZIP), Ukuran File & Tombol Unduh Langsung
│   └── [Sub-modul D] Kontak, Sekretariat & Kemitraan
│       ├── Alamat Fisik Sekretariat & Peta Lokasi Kampus
│       ├── Direct Helpdesk WhatsApp & Email Resmi
│       ├── Formulir Permohonan Sponsorship / Kerja Sama Organisasi
│       └── Tautan Resmi Media Sosial (Instagram, LinkedIn, YouTube, TikTok)
├── 3. Berita, Publikasi & Galeri (/berita)
│   ├── Warta Kampus & Berita Perkembangan Teknologi Sistem Informasi
│   ├── Publikasi / Buletin & Newsletter Digital HIMASI
│   └── Galeri Dokumentasi Foto & Video Kegiatan dengan Filter Tag Acara
├── 4. Pusat Prestasi - Hall of Fame (/prestasi)
│   ├── Showcase Juara Kompetisi Mahasiswa SI (Regional, Nasional, Internasional)
│   ├── Filter Kategori (Hackathon, UI/UX, Paper Ilmiah, Business Plan, Beasiswa)
│   └── Formulir Pendataan / Pengajuan Prestasi Baru Mahasiswa
└── 5. Kalender Interaktif Per Semester (/kalender)
    ├── Selector Semester (Ganjil vs Genap 2025/2026)
    ├── Tampilan Grid Kalender Bulanan & Timeline List Agenda
    ├── Tagging Event (Minggu Efektif Kuliah, Jadwal UTS/UAS, KRS, Event HIMASI, Libur)
    └── Tombol Export Jadwal ke Google Calendar / iCal
```

---

## 6. Functional Requirements per Module

### 6.1 Floating Capsule Navbar (Payius-Inspired Style)
- **Visual Design:**
  - Container floating dengan rounded pill geometry (`rounded-full` container).
  - Background semi-transparan dengan backdrop-blur: `rgba(255, 255, 255, 0.85)` pada background terang atau container bergradasi modern `#0094E0` ke `#00296E`.
  - Item navigasi berbentuk segmented pill kapsul. Item aktif memiliki latar belakang solid gelap `#00296E` dengan teks putih dan shadow elevasi.
  - Nav Items: **Home** (`/`), **Profil & Organisasi** (`/profil` - mencakup proker, unduhan & kemitraan), **Berita** (`/berita`), **Prestasi** (`/prestasi`), **Kalender** (`/kalender`).
  - Bagian kanan menyertakan badge filter semester aktif dan tombol CTA kapsul: **"Aspirasi"** yang mengarahkan pengguna secara mulus (*smooth-scroll*) ke bagian Form Aspirasi di bawah homepage (`/#aspirasi`).
- **Responsive Behavior:**
  - Desktop (>1024px): Horizontal pill menu lengkap.
  - Mobile (<1024px): Capsule bar disederhanakan dengan logo, tombol aksi cepat, dan hamburger menu yang memicu slide-over drawer modern beranimasi.

### 6.2 Form Aspirasi Mahasiswa (Terletak di Bagian Bawah Homepage)
- **Penempatan:** Berada tepat sebelum footer di halaman utama (Homepage `/`), mudah dijangkau melalui scroll alami maupun tombol CTA navigasi.
- **Input Fields:**
  - Kategori Aspirasi (dropdown: *Akademik & Perkuliahan*, *Sarana & Prasarana Kampus*, *Kinerja Himpunan*, *Advokasi & Hak Mahasiswa*).
  - Checkbox privasi: *"Kirimkan sebagai aspirasi anonim (identitas dirahasiakan)"*.
  - Nama Mahasiswa & NIM (wajib diisi bila tidak memilih anonim, tersembunyi bila anonim).
  - Angkatan Mahasiswa (dropdown: 2022, 2023, 2024, 2025).
  - Subjek Aspirasi & Pesan Aspirasi/Saran terperinci.
- **Interaksi & Validasi:**
  - Validasi form sisi klien dengan instant feedback.
  - Simulasi tiket pelacakan aspirasi (misal: `#ASP-2026-0891`) untuk meyakinkan mahasiswa bahwa aspirasi tercatat di sistem himpunan.

### 6.3 Halaman Profil & Kelembagaan (/profil)
Halaman terpadu yang menyajikan 4 sub-bagian esensial:
1. **Profil & Struktur Organisasi:**
   - Sejarah, visi, misi, dan nilai dasar himpunan.
   - Bagan interaktif kepengurusan kabinet (BPH, Divisi Akademik, Kominfo, PSDM, Hublu, Danus) lengkap dengan foto, nama, peran, dan link LinkedIn.
2. **Program Kerja & Agenda:**
   - Direktori proker dengan tab filter divisi dan status (*Akan Datang*, *Berjalan*, *Terlaksana*).
   - Kartu detail mencakup deskripsi kegiatan, sasaran, waktu pelaksanaan, dan capaian.
3. **Pusat Unduhan Dokumen:**
   - Tabel direktori arsip dokumen resmi (Surat Dispensasi Kuliah, Template Proposal Delegasi, AD/ART HIMASI, Modul Praktikum, Silabus Mata Kuliah).
   - Fitur pencarian instan (search filter) dan tombol unduh langsung dengan indikasi ukuran berkas dan format file (.PDF, .DOCX, .ZIP).
4. **Kontak & Kemitraan:**
   - Informasi detail sekretariat, jam operasional, peta lokasi kampus.
   - Kanal langsung WhatsApp helpdesk mahasiswa & email resmi.
   - Formulir permohonan kemitraan sponsor, media partner, atau studi banding organisasi eksternal.

### 6.4 Pusat Prestasi (Hall of Fame - /prestasi)
- Grid kartu prestasi mahasiswa dengan medali/badge prestasi (Juara 1, 2, 3, Harapan, Finalis), nama delegasi, nama ajang, penyelenggara, dan tingkatan (Nasional/Internasional).
- Filter realtime berdasarkan tahun dan cabang kompetisi (Hackathon, UI/UX, Paper Ilmiah, Business Plan).
- Formulir pengajuan pendataan prestasi baru oleh mahasiswa aktif.

### 6.5 Kalender Interaktif Per Semester (/kalender)
- Selector semester (Semester Ganjil 2025/2026 vs Genap 2025/2026).
- Dual view: Tampilan Kalender Bulanan Interaktif & Timeline Agenda Mendatang.
- Kategori warna penanda:
  - Biru Muda (`#0094E0`): Event HIMASI (Webinar, Workshop, Himasi Fest).
  - Biru Tua (`#00296E`): Agenda Akademik (KRS, Sidang, Yudisium).
  - Merah / Amber: Ujian (UTS/UAS) dan batas akhir pembayaran/revisi.
  - Hijau: Libur Semester & Hari Libur Nasional.
- Tombol export ke Google Calendar / iCal.

---

## 7. Project Structure

```
himasiv2/
├── app/
│   ├── layout.tsx             # Root layout with Poppins font & metadata
│   ├── globals.css            # Tailwind 4 theme, HIMASI tokens (#0094E0, #00296E)
│   ├── page.tsx               # Homepage: Hero, Highlights, Metrik, & Form Aspirasi di bawah
│   ├── profil/page.tsx        # Hub Profil: Struktur, Proker/Agenda, Unduhan Dokumen, & Kontak/Kemitraan
│   ├── berita/page.tsx        # Berita kampus, artikel teknologi SI & galeri dokumentasi
│   ├── prestasi/page.tsx      # Pusat prestasi mahasiswa (Hall of Fame)
│   └── kalender/page.tsx      # Kalender interaktif akademik & agenda per semester
├── components/
│   ├── navbar.tsx             # Capsule pill navigation (Payius style) dengan CTA smooth-scroll #aspirasi
│   ├── form-aspirasi.tsx      # Komponen Form Aspirasi Mahasiswa (Anonim/Identitas, Validasi, Tiket)
│   ├── footer.tsx             # Footer resmi HIMASI dengan kontak dan navigasi cepat
│   ├── proker-section.tsx     # Komponen tab/grid program kerja per divisi
│   ├── document-section.tsx   # Komponen repositori unduhan berkas & template
│   └── partnership-section.tsx # Komponen kontak sekretariat & form kemitraan
├── public/
│   └── assets/                # Aset visual & logo
└── docs/
    └── PRD_HIMASI.md          # Dokumen PRD yang telah disesuaikan
```

---

## 8. Code Style & Conventions

- **Component Standard:** React Functional Components dengan TypeScript type annotations.
- **Naming Conventions:**
  - Files: `kebab-case.tsx` untuk komponen, `page.tsx` untuk route.
  - Variables/Functions: `camelCase`.
  - Types/Interfaces: `PascalCase`.
- **CSS Styling:** Tailwind CSS classes yang konsisten dengan token palet HIMASI (`#0094E0`, `#00296E`, `#FFFFFF`).
- **Imports:** Urutan import: standard library / framework -> internal components -> icons -> styles.

*Contoh snippet kode Navbar Kapsul Modern:*
```tsx
import Link from "next/link";
import { useState } from "react";
import { MessageSquarePlus, Menu, X } from "lucide-react";

export function HIMASINavbar() {
  const [activeTab, setActiveTab] = useState("home");
  return (
    <header className="sticky top-4 z-50 px-4 max-w-7xl mx-auto w-full">
      <div className="bg-white/80 backdrop-blur-md border border-slate-200/70 shadow-lg rounded-full px-5 py-2.5 flex items-center justify-between">
        {/* Brand Logo & Title */}
        {/* Pill Nav Items */}
        {/* Action Button */}
      </div>
    </header>
  );
}
```

---

## 9. Boundaries (Rules of Engagement)

- **Always Do:**
  - Gunakan font `Poppins` dan palet warna resmi (`#0094E0`, `#00296E`, `#FFFFFF`).
  - Pastikan semua link dan tombol memiliki accessibility tag (`aria-label`, semantic elements).
  - Pastikan tampilan mobile drawer responsif dan tidak menimbulkan overflow horizontal pada layar sempit (<360px).
- **Ask First:**
  - Menambahkan dependensi paket external npm baru di luar yang sudah terpasang.
  - Mengubah struktur database backend atau CMS integrasi di masa mendatang.
- **Never Do:**
  - Menggunakan warna acak yang bertentangan dengan design brief.
  - Membocorkan data aspirasi atau informasi rahasia tanpa enkripsi/anonimisasi.
  - Menghapus konfigurasi standard Next.js 16 / Turbopack yang sudah tervalidasi.

---

## 10. Implementation Plan & Milestones

1. **Milestone 1 (Foundation & Navigation):**
   - Setup font `Poppins` dan CSS design tokens HIMASI di [app/globals.css](file:///c:/Users/ASUS/Documents/GitHub/himasiv2/app/globals.css) & [app/layout.tsx](file:///c:/Users/ASUS/Documents/GitHub/himasiv2/app/layout.tsx).
   - Implementasi komponen modern Navbar Kapsul (Payius-style) lengkap dengan responsive drawer dan HIMASI branding.
2. **Milestone 2 (Landing Page Showcase):**
   - Implementasi halaman utama [app/page.tsx](file:///c:/Users/ASUS/Documents/GitHub/himasiv2/app/page.tsx) dengan Hero Banner, ringkasan fitur, highlight prestasi, dan kalender kegiatan cepat.
3. **Milestone 3 (Fitur Mahasiswa: Aspirasi, Kalender & Unduhan):**
   - Halaman Form Aspirasi dengan validasi dan kategori.
   - Halaman Kalender Interaktif Semester dengan filter ganjil/genap.
   - Halaman Pusat Unduhan Dokumen dengan search dan filter format.
4. **Milestone 4 (Profil, Proker, Berita & Prestasi):**
   - Struktur organisasi, timeline proker, berita/galeri, dan Hall of Fame prestasi.
