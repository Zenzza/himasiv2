# Spesifikasi Desain: Redesain Admin Dashboard HIMASI (Gaya 1 — Swiss Minimalist Grid)

## 1. Ringkasan Eksekutif (Overview)

Dokumen ini memuat arsitektur visual dan spesifikasi teknis untuk merombak total kerangka utama **Admin Dashboard HIMASI** ([`app/dashboard/page.tsx`](file:///c:/Users/ASUS/Documents/GitHub/himasiv2/app/dashboard/page.tsx)) menjadi standar visual baru: **Swiss Minimalist Grid** (*Zero-Shadow Mathematical Precision*) dengan dukungan penuh **Dual Theme (Light & Dark Mode)**.

### Prinsip Desain Kunci
1. **Tipografi Wajib**: **Poppins** sebagai tipografi utama (dengan *JetBrains Mono* sebagai font pendukung data angka/kode/timestamp).
2. **Palet Warna Utama**: **`#FFFFFF`** (Pure White) dan **`#00296E`** (HIMASI Deep Navy).
3. **Palet Dark Mode**: **`#001740`** (Midnight Swiss Navy Canvas), **`#001233`** (Deep Surface), **`#FFFFFF`** (High-Contrast Text), dan aksen status **`#38BDF8`** (Ice Cyan).
4. **Zero Cognitive Noise**: 100% tanpa bayangan buram (*shadow-none*), batas struktur murni dibentuk oleh garis kisi-kisi matematis (*hairline grid divide* `1px`).
5. **Preservasi 100% Logika Bisnis**: Seluruh 12 modul fungsional, Supabase auth, RBAC (`canAccessTab`), state filter, dan modal CRUD tetap berfungsi tanpa regresi.

---

## 2. Arsitektur Kerangka & Layout (Shell Architecture)

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│ HEADER TOPBAR (Hairline Border-B)                                                           │
│ [H] HIMASI / SYSTEM   │   DASHBOARD / 01. RINGKASAN   │  SYS: 100% HEALTHY ●  [☀️/🌙] [PROFIL]│
├───────────────────────┬─────────────────────────────────────────────────────────────────────┤
│ SIDEBAR (w-64)        │ WORKSPACE CONTENT CANVAS (Hairline Grid)                           │
│                       │                                                                     │
│ • RINGKASAN UTAMA     │ ┌─────────────────────────────────────────────────────────────────┐ │
│   [01. Overview]      │ │ KPI STRIP (Hairline 3-Column Divide, Poppins Font-Light)        │ │
│                       │ │ WARTA TERBIT: 24   │ ASPIRASI: 12        │ RASIO HADIR: 96.4%   │ │
│ • KONTROL HALAMAN     │ └─────────────────────────────────────────────────────────────────┘ │
│   [02. Banner & Home] │                                                                     │
│   [03. Warta Berita]  │ ┌─────────────────────────────────────────────────────────────────┐ │
│   [04. Apresia-SI]    │ │ MODUL AKTIF (Contoh: Ringkasan Aktivitas / Warta Berita / dsb)  │ │
│   [05. Kalender]      │ │ Tabel Minimalis Garis Rambut, Header Uppercase, Hover Tint       │ │
│   [06. Dokumen]       │ │                                                                 │ │
│   [07. Aspirasi]      │ │                                                                 │ │
│                       │ │                                                                 │ │
│ • OPERASIONAL ABSENSI │ │                                                                 │ │
│   [08. Scan QR]       │ │                                                                 │ │
│   [09. Rekap Absensi] │ │                                                                 │ │
│   [10. Kartu Pengurus]│ │                                                                 │ │
│                       │ │                                                                 │ │
│ • SISTEM & PENGGUNA   │ │                                                                 │ │
│   [11. User & Role]   │ │                                                                 │ │
│   [12. DB Supabase]   │ └─────────────────────────────────────────────────────────────────┘ │
└───────────────────────┴─────────────────────────────────────────────────────────────────────┘
```

---

## 3. Pemetaan Token Visual (Light vs Dark Mode)

| Elemen UI | Light Mode Token | Dark Mode Token (Midnight Swiss) |
| :--- | :--- | :--- |
| **Latar Canvas Utama** | `#FFFFFF` (Pure White) | `#001740` (Midnight Navy) |
| **Latar Sidebar** | `#FAFBFC` (Ultra-light tint) | `#001438` (Deep Tint Surface) |
| **Latar Topbar** | `#FFFFFF` | `#001233` (Midnight Bar) |
| **Garis Kisi-kisi (Dividers)** | `rgba(0, 41, 110, 0.15)` | `rgba(255, 255, 255, 0.12)` |
| **Teks Heading / Brand** | `#00296E` (Poppins Bold/ExtraBold) | `#FFFFFF` (Poppins Bold/ExtraBold) |
| **Angka Metrik (KPIs)** | `#00296E` (Poppins Light 36px) | `#FFFFFF` (Poppins Light 36px) |
| **Teks Body / Sekunder** | `#475569` (Slate-600) | `#94A3B8` (Slate-400) |
| **Garis Indikator Aktif** | `border-l-2 border-[#00296E]` | `border-l-2 border-[#38BDF8]` |
| **Status Tag / Badge Aktif** | `bg-[#00296E]/5 text-[#00296E]` | `bg-[#38BDF8]/10 text-[#38BDF8]` |
| **Tombol Aksi Utama** | `bg-[#00296E] text-white` | `bg-[#38BDF8] text-[#001740] font-bold` |
| **Bayangan (Shadow)** | `none` (100% Shadowless) | `none` (100% Shadowless) |

---

## 4. Penataan Modul & Menu Navigasi (12 Modul)

Navigasi sidebar disusun rapi ke dalam **4 Kategori Logis** dengan guard `canAccessTab(currentUserRole, tab)` tetap aktif:

1. **Seksi 1: Ringkasan Utama**
   - `overview`: Ringkasan Dashboard (Metrik KPI, Grafik Aktivitas, Banner Switcher Cepat, Audit Trail).
2. **Seksi 2: Kontrol Halaman Front-End**
   - `banner`: Kustomisasi Hero Banner & Fitur Utama (Desktop & Mobile).
   - `berita`: Pengelolaan Warta Berita (Editor Artikel, Kategori, Status Publish/Draft).
   - `apresiasi`: Prestasi & Karya Mahasiswa (ApresiasiManager).
   - `kalender`: Agenda & Kalender Kegiatan Himpunan.
   - `dokumen`: Arsip Dokumen Organisasi (AD/ART, SK, Proposal PDF).
   - `aspirasi`: Kotak Aspirasi Mahasiswa (Status Baru, Diproses, Selesai + Catatan Pengurus).
3. **Seksi 3: Operasional Absensi**
   - `absensi`: Scanner QR Presensi Kegiatan (Kamera & Token Generator).
   - `rekap-absensi`: Rekapitulasi Presensi (Ekspor PDF & Spreadsheet).
   - `kartu-qr`: Cetak & Download Kartu ID QR Pengurus HIMASI.
4. **Seksi 4: Sistem & Pengguna (Khusus Role Berwenang)**
   - `users`: Manajemen Pengguna & Hak Akses Role (Super Admin, Humas, BPH).
   - `database`: Status Koneksi & Database Supabase.

---

## 5. Fitur Baru: Saklar Tema (Theme Switcher ☀️/🌙)

- Diletakkan di kanan atas Topbar.
- Menggunakan state lokal yang persisten: `localStorage.getItem("himasi-admin-theme")`.
- Default: Mengikuti preferensi sistem pengguna via `window.matchMedia("(prefers-color-scheme: dark)")` atau default `"light"`.
- Memberikan transisi warna instan dan mulus pada seluruh elemen tanpa *flicker*.

---

## 6. Rencana Implementasi Bertahap (Next Steps)

1. **Fase 1: State Tema & Wrapper Root**:
   - Menambahkan state `theme` (`"light" | "dark"`) dan toggle handler di [`app/dashboard/page.tsx`](file:///c:/Users/ASUS/Documents/GitHub/himasiv2/app/dashboard/page.tsx).
   - Memastikan font `font-poppins` dan kelas tema terikat pada container root.
2. **Fase 2: Redesain Header Topbar**:
   - Memasang branding *Swiss hairline*, breadcrumbs dinamis, indikator server, dan tombol toggle tema.
3. **Fase 3: Redesain Sidebar Navigasi**:
   - Mengubah sidebar menjadi kisi matematis tanpa shadow dengan 4 kategori bersih, indikator aktif vertikal, dan profile badge pengurus.
4. **Fase 4: Overhaul Tampilan Tab `overview`**:
   - Mendesain ulang kartu KPI 3-kolom hairline, ringkasan warta, log audit pengurus, dan filter status kegiatan.
5. **Fase 5: Harmonisasi Kontainer Tab Lainnya (Tab 2–12)**:
   - Menyelaraskan border dan latar belakang kontainer untuk seluruh tab lainnya agar seragam dalam mode terang dan gelap.
6. **Fase 6: Pengujian Responsif & Verifikasi Build**:
   - Menguji tampilan pada desktop dan mobile drawer, verifikasi build Next.js (`npm run build`).

---

Dokumen spesifikasi ini siap dieksekusi setelah mendapatkan persetujuan.

