-- ===================================================================
-- SKEMA DATABASE POSTGRESQL SUPABASE - HIMASI ISB ATMA LUHUR
-- Jalankan skrip ini di SQL Editor dashboard Supabase Anda.
-- ===================================================================

-- 1. Tabel Aspirasi Mahasiswa (Terkoneksi langsung dari Form Aspirasi Beranda)
CREATE TABLE IF NOT EXISTS public.aspirasi (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  angkatan TEXT NOT NULL,
  pesan TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'baru', -- 'baru', 'diproses', 'selesai'
  catatan_pengurus TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Aktifkan Row Level Security (RLS)
ALTER TABLE public.aspirasi ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Mahasiswa dapat mengirim aspirasi"
  ON public.aspirasi FOR INSERT WITH CHECK (true);

CREATE POLICY "Pengurus dapat membaca aspirasi"
  ON public.aspirasi FOR SELECT TO authenticated USING (true);

CREATE POLICY "Pengurus dapat mengupdate status aspirasi"
  ON public.aspirasi FOR UPDATE TO authenticated USING (true) WITH CHECK (true);


-- 2. Tabel Berita / Warta Himpunan (CMS Pengurus)
CREATE TABLE IF NOT EXISTS public.berita (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE,
  excerpt TEXT,
  content TEXT,
  category_key TEXT NOT NULL DEFAULT 'event',
  category_label TEXT NOT NULL DEFAULT 'Kegiatan Himpunan',
  author TEXT NOT NULL DEFAULT 'HIMASI Media',
  read_time TEXT DEFAULT '5 min read',
  image_url TEXT,
  is_published BOOLEAN DEFAULT true,
  published_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.berita ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Publik dapat membaca berita terbit"
  ON public.berita FOR SELECT USING (is_published = true);

CREATE POLICY "Pengurus dapat mengelola berita"
  ON public.berita FOR ALL TO authenticated USING (true);


-- 3. Tabel Profil Pengurus (Terhubung ke auth.users bawaan Supabase)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  nama_lengkap TEXT,
  jabatan TEXT DEFAULT 'Pengurus HIMASI',
  divisi TEXT DEFAULT 'Kabinet REKSABUDAYA',
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pengurus dapat membaca profil"
  ON public.profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Pengurus dapat mengupdate profil sendiri"
  ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, nama_lengkap, jabatan, divisi)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'Pengurus HIMASI'),
    COALESCE(NEW.raw_user_meta_data->>'divisi', 'Kabinet REKSABUDAYA')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ===================================================================
-- 4. SISTEM ABSENSI QR CODE PENGURUS HIMASI
-- ===================================================================

-- Tabel Daftar Pengurus dengan Kode QR Unik
CREATE TABLE IF NOT EXISTS public.pengurus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nim TEXT UNIQUE NOT NULL,
  nama TEXT NOT NULL,
  jabatan TEXT NOT NULL,
  divisi TEXT NOT NULL,
  qr_token TEXT UNIQUE NOT NULL,
  foto_url TEXT,
  urutan INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.pengurus ADD COLUMN IF NOT EXISTS urutan INT DEFAULT 0;

ALTER TABLE public.pengurus ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pengurus dapat melihat daftar anggota"
  ON public.pengurus FOR SELECT TO authenticated USING (true);

CREATE POLICY "Publik dapat melihat profil pengurus aktif"
  ON public.pengurus FOR SELECT TO anon USING (is_active = true);

CREATE POLICY "Admin dapat mengelola data pengurus"
  ON public.pengurus FOR ALL TO authenticated USING (true);


-- Tabel Agenda / Kegiatan Absensi (Dinamis diinput oleh Admin)
CREATE TABLE IF NOT EXISTS public.kegiatan_absensi (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama_kegiatan TEXT NOT NULL,
  tanggal DATE DEFAULT CURRENT_DATE NOT NULL,
  jam TEXT DEFAULT '09:00 WIB',
  keterangan TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.kegiatan_absensi ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Semua dapat melihat kegiatan"
  ON public.kegiatan_absensi FOR SELECT USING (true);

CREATE POLICY "Semua dapat mengelola kegiatan absensi"
  ON public.kegiatan_absensi FOR ALL USING (true);


-- Tabel Log Hasil Scan Absensi QR Code (Dinamis dari scanner)
CREATE TABLE IF NOT EXISTS public.absensi_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama_pengurus TEXT NOT NULL,
  nim TEXT NOT NULL,
  divisi TEXT NOT NULL,
  nama_kegiatan TEXT NOT NULL,
  waktu_scan TIMESTAMPTZ DEFAULT now() NOT NULL,
  status TEXT NOT NULL DEFAULT 'Hadir', -- 'Hadir', 'Terlambat', 'Izin', 'Sakit'
  catatan TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.absensi_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Semua dapat melihat log absensi"
  ON public.absensi_log FOR SELECT USING (true);

CREATE POLICY "Semua dapat menginput dan mengelola log absensi"
  ON public.absensi_log FOR ALL USING (true);


-- ===================================================================
-- 5. SUPABASE STORAGE BUCKETS (Foto Profil Pengurus & Foto Berita)
-- ===================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    ('foto-pengurus', 'foto-pengurus', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
    ('foto-berita', 'foto-berita', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET public = true;

CREATE POLICY "Public Read Storage Objects" 
ON storage.objects FOR SELECT 
TO public
USING (bucket_id IN ('foto-pengurus', 'foto-berita'));

CREATE POLICY "Authenticated Upload Storage Objects" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (
    bucket_id IN ('foto-pengurus', 'foto-berita') AND 
    auth.role() = 'authenticated'
);


-- ===================================================================
-- 6. TABEL DOKUMEN ORGANISASI (AD/ART, SK, Pedoman)
-- ===================================================================
CREATE TABLE IF NOT EXISTS public.dokumen_organisasi (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  judul TEXT NOT NULL,
  deskripsi TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size TEXT,
  urutan INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

GRANT ALL ON TABLE public.dokumen_organisasi TO anon, authenticated, service_role;
ALTER TABLE public.dokumen_organisasi DISABLE ROW LEVEL SECURITY;

-- Seed Data Awal Dokumen Organisasi (AD, ART, SK)
INSERT INTO public.dokumen_organisasi (id, judul, deskripsi, file_url, file_name, file_size, urutan)
VALUES
  ('doc-1', 'AD HIMASI', 'Anggaran Dasar HIMASI ISB Atma Luhur', '/documents/AD-ART-HIMASI-AtmaLuhur.pdf', 'AD-ART-HIMASI-AtmaLuhur.pdf', '1.2 MB', 1),
  ('doc-2', 'ART HIMASI', 'Anggaran Rumah Tangga HIMASI ISB Atma Luhur', '/documents/BPPK-Pedoman-Pengurus-HIMASI.pdf', 'BPPK-Pedoman-Pengurus-HIMASI.pdf', '1.8 MB', 2),
  ('doc-3', 'SK Kepengurusan', 'SK Kepengurusan HIMASI ISB Atma Luhur', '/documents/SK-Kepengurusan-HIMASI-AtmaLuhur.pdf', 'SK-Kepengurusan-HIMASI-AtmaLuhur.pdf', '850 KB', 3)
ON CONFLICT (id) DO NOTHING;

-- Bucket Storage Dokumen Organisasi (PDF up to 25MB)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('dokumen-organisasi', 'dokumen-organisasi', true, 26214400, ARRAY['application/pdf'])
ON CONFLICT (id) DO UPDATE SET public = true;

-- Kebijakan Akses Berkas PDF Dokumen Organisasi
DROP POLICY IF EXISTS "Public Read Dokumen Organisasi" ON storage.objects;
DROP POLICY IF EXISTS "Public Upload Dokumen Organisasi" ON storage.objects;
DROP POLICY IF EXISTS "Public Update Dokumen Organisasi" ON storage.objects;
DROP POLICY IF EXISTS "Public Delete Dokumen Organisasi" ON storage.objects;

CREATE POLICY "Public Read Dokumen Organisasi" 
ON storage.objects FOR SELECT 
TO public
USING (bucket_id = 'dokumen-organisasi');

CREATE POLICY "Public Upload Dokumen Organisasi" 
ON storage.objects FOR INSERT 
TO public
WITH CHECK (bucket_id = 'dokumen-organisasi');

CREATE POLICY "Public Update Dokumen Organisasi" 
ON storage.objects FOR UPDATE 
TO public
USING (bucket_id = 'dokumen-organisasi');

CREATE POLICY "Public Delete Dokumen Organisasi" 
ON storage.objects FOR DELETE 
TO public
USING (bucket_id = 'dokumen-organisasi');


-- ===================================================================
-- 7. TABEL AGENDA KALENDER (HIMASI, AKADEMIK, LIBUR)
-- ===================================================================
CREATE TABLE IF NOT EXISTS public.agenda_kalender (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tanggal_mulai DATE NOT NULL,
  tanggal_selesai DATE, -- NULL jika acara 1 hari saja
  judul TEXT NOT NULL,
  kategori TEXT NOT NULL DEFAULT 'HIMASI', -- 'HIMASI', 'Akademik', 'Libur'
  waktu TEXT NOT NULL DEFAULT 'Sepanjang Hari',
  lokasi TEXT NOT NULL DEFAULT 'Kampus ISB Atma Luhur',
  deskripsi TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

GRANT ALL ON TABLE public.agenda_kalender TO anon, authenticated, service_role;
ALTER TABLE public.agenda_kalender DISABLE ROW LEVEL SECURITY;

-- Seed Data Awal Kalender (September - Oktober 2026)
INSERT INTO public.agenda_kalender (id, tanggal_mulai, tanggal_selesai, judul, kategori, waktu, lokasi, deskripsi)
VALUES
  ('evt-sep-09', '2026-09-09', '2026-09-10', 'Ujian Sidang Skripsi & Tugas Akhir Gelombang I', 'Akademik', '08.30 - 16.00 WIB', 'Ruang Sidang Utama Lt. 2 ISB Atma Luhur', 'Pelaksanaan ujian sidang skripsi dan tugas akhir tahap 1 bagi mahasiswa tingkat akhir prodi Sistem Informasi.'),
  ('evt-sep-14', '2026-09-14', NULL, 'Awal Perkuliahan Efektif Semester Ganjil 2026/2027', 'Akademik', '07.30 - 17.00 WIB', 'Seluruh Ruang Kelas Sistem Informasi ISB Atma Luhur', 'Dimulainya perkuliahan tatap muka minggu ke-1 seluruh mata kuliah prodi Sistem Informasi.'),
  ('evt-sep-25', '2026-09-25', NULL, 'Malam Keakraban (MAKRAB) & Inaugurasi HIMASI 2026', 'HIMASI', '16.00 - 22.00 WIB', 'Auditorium & Lapangan Utama ISB Atma Luhur', 'Temu akrab mahasiswa baru bersama BPH & seluruh divisi HIMASI untuk menjalin sinergi.'),
  ('evt-sep-29', '2026-09-29', NULL, 'HIMASI Tech Talk: Road to Cloud Engineer & AI Frontier', 'HIMASI', '13.30 - 16.30 WIB', 'Lab Komputer Cloud & Live Streaming YouTube HIMASI', 'Seminar teknologi komputasi awan dan rekayasa AI bersama alumni praktisi industri.'),
  ('evt-aug-17', '2026-08-17', NULL, 'Upacara Peringatan HUT Kemerdekaan RI ke-81', 'Libur', '07.30 - 10.00 WIB', 'Lapangan Upacara ISB Atma Luhur', 'Upacara bendera peringatan kemerdekaan Republik Indonesia dan festival lomba kampus.'),
  ('evt-aug-24', '2026-08-24', NULL, 'Masa Pengisian & Revisi KRS Online Semester Ganjil', 'Akademik', '09.00 - 23.59 WIB', 'Portal SIAKAD Online Atma Luhur', 'Konsultasi dosen pembimbing akademik (PA) dan penguncian jadwal rencana studi.'),
  ('evt-oct-05', '2026-10-05', NULL, 'HIMASI Coding Clinic: Algoritma & Basis Data Relasional', 'HIMASI', '15.30 - 17.30 WIB', 'Lab Pemrograman Web Lt. 3', 'Sesi tutorial intensif dan bimbingan praktikum koding bersama tutor sebaya berprestasi HIMASI.'),
  ('evt-oct-15', '2026-10-15', NULL, 'Batas Akhir Verifikasi Dispensasi Kuliah & Delegasi Lomba', 'Akademik', '16.00 WIB', 'Sekretariat Prodi Sistem Informasi', 'Batas akhir penyerahan berkas verifikasi dispensasi lomba akademik dan program magang bersertifikat MBKM.'),
  ('evt-oct-26', '2026-10-26', '2026-10-31', 'Ujian Tengah Semester (UTS) Ganjil 2026/2027', 'Akademik', '08.00 - 16.00 WIB', 'Ruang Ujian Terpadu Kampus Atma Luhur', 'Pekan evaluasi tengah semester untuk seluruh mata kuliah teori dan praktikum sistem informasi.')
ON CONFLICT (id) DO NOTHING;

-- Realtime Publication
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.dokumen_organisasi;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.agenda_kalender;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.fitur_utama;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
END $$;


-- ===================================================================
-- 8. TABEL FITUR UTAMA BERANDA (TOGGLE STATUS OPEN / CLOSED)
-- ===================================================================
CREATE TABLE IF NOT EXISTS public.fitur_utama (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  href TEXT NOT NULL,
  icon_name TEXT DEFAULT 'Award',
  is_open BOOLEAN NOT NULL DEFAULT true,
  status_open_text TEXT DEFAULT 'Lihat Selengkapnya',
  status_closed_text TEXT DEFAULT 'Coming Soon',
  lock_when_closed BOOLEAN DEFAULT true,
  urutan INT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

GRANT ALL ON TABLE public.fitur_utama TO anon, authenticated, service_role;
ALTER TABLE public.fitur_utama DISABLE ROW LEVEL SECURITY;

-- Seed Data Awal Fitur Utama Beranda
INSERT INTO public.fitur_utama (id, title, href, icon_name, is_open, status_open_text, status_closed_text, lock_when_closed, urutan)
VALUES
  ('recruitment', 'Recruitment HIMASI', '/oprec', 'UserPlus', false, 'Lihat Selengkapnya', 'Coming Soon', true, 1),
  ('order-baju', 'Order Baju Jurusan', '/order-baju', 'Shirt', false, 'Lihat Selengkapnya', 'Coming Soon', true, 2),
  ('informasi', 'Pusat Informasi', '/prestasi', 'Trophy', false, 'Lihat Selengkapnya', 'Coming Soon', true, 3),
  ('apresiasi', 'Apresia-SI', '/apresiasi', 'Award', true, 'Lihat Selengkapnya', 'Coming Soon', false, 4)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  href = EXCLUDED.href;


-- ===================================================================
-- 9. TABEL APRESIA-SI (SHOWCASE PRESTASI & SUBMISI MAHASISWA)
-- ===================================================================

-- 1. Tabel Galeri Showcase Apresia-SI (Karya & Prestasi Terbit)
CREATE TABLE IF NOT EXISTS public.apresiasi_showcase (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'karya', -- 'lomba', 'karya', 'magang'
  category_label TEXT,
  badge TEXT,
  student_name TEXT NOT NULL,
  team_members TEXT,
  nim TEXT,
  batch TEXT DEFAULT '2024',
  organizer_or_company TEXT,
  level TEXT DEFAULT 'Nasional',
  description TEXT NOT NULL,
  full_story TEXT,
  mentor_or_lecturer TEXT,
  image TEXT DEFAULT 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?q=80&w=800&auto=format&fit=crop',
  live_url TEXT,
  github_url TEXT,
  proof_url TEXT,
  likes INT DEFAULT 0,
  featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Hak Akses & Kebijakan RLS Showcase
ALTER TABLE public.apresiasi_showcase ENABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE public.apresiasi_showcase TO anon, authenticated, service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

DROP POLICY IF EXISTS "Publik dapat melihat showcase apresiasi" ON public.apresiasi_showcase;
CREATE POLICY "Publik dapat melihat showcase apresiasi"
  ON public.apresiasi_showcase FOR SELECT USING (true);

DROP POLICY IF EXISTS "Pengurus dapat mengelola showcase apresiasi" ON public.apresiasi_showcase;
CREATE POLICY "Pengurus dapat mengelola showcase apresiasi"
  ON public.apresiasi_showcase FOR ALL USING (true) WITH CHECK (true);


-- 2. Tabel Pengajuan Submisi Mandiri Apresiasi Mahasiswa
CREATE TABLE IF NOT EXISTS public.apresiasi_submisi (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL, -- 'lomba', 'karya', 'magang'
  title TEXT NOT NULL,
  student_name TEXT NOT NULL,
  team_members TEXT,
  nim TEXT NOT NULL,
  batch TEXT NOT NULL,
  contact TEXT NOT NULL,
  organizer_or_company TEXT NOT NULL,
  level TEXT DEFAULT 'Nasional',
  description TEXT NOT NULL,
  link_demo_or_repo TEXT,
  proof_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Hak Akses & Kebijakan RLS Submisi
ALTER TABLE public.apresiasi_submisi ENABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE public.apresiasi_submisi TO anon, authenticated, service_role;

DROP POLICY IF EXISTS "Mahasiswa dapat mengajukan apresiasi" ON public.apresiasi_submisi;
CREATE POLICY "Mahasiswa dapat mengajukan apresiasi"
  ON public.apresiasi_submisi FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Pengurus dapat mengelola submisi apresiasi" ON public.apresiasi_submisi;
CREATE POLICY "Pengurus dapat mengelola submisi apresiasi"
  ON public.apresiasi_submisi FOR ALL USING (true) WITH CHECK (true);


-- 3. Data Awal (Seed Data) Galeri Showcase Apresia-SI
INSERT INTO public.apresiasi_showcase (
  title, category, category_label, badge, student_name, team_members, nim, batch,
  organizer_or_company, level, description, full_story, mentor_or_lecturer, image,
  live_url, github_url, proof_url, likes, featured
) VALUES
(
  'Juara 1 - National UI/UX Design Hackathon 2026', 'lomba', 'Juara Lomba', 'Juara 1 Nasional',
  'Muhammad Fadhil', 'Anindya Putri, Zahra Salsabila', '231150002', '2024',
  'TechFest Nasional x Kemendikbudristek', 'Nasional',
  'Mengembangkan aplikasi asisten perkuliahan cerdas untuk penyandang disabilitas sensorik dengan pengenalan suara dan gestur berbasis AI.',
  'Dalam kompetisi hackathon nasional berdurasi 48 jam yang diikuti lebih dari 120 universitas di seluruh Indonesia, Tim Inovasi Aksesibel SI berhasil meraih Juara 1 dengan menciptakan solusi Aksesibel-SI.',
  'Dosen Pembina HIMASI ISB Atma Luhur', 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?q=80&w=800&auto=format&fit=crop',
  'https://github.com/himasi-atmaluhur', 'https://github.com/himasi-atmaluhur', '/DSC01203.png', 84, true
),
(
  'Best Paper Award - International Conference on Information Systems (ICIS 2025)', 'lomba', 'Juara Lomba', 'Best Paper Internasional',
  'Arya Wijaya', 'Tim Riset Data Mahasiswa SI', '221150019', '2023',
  'IEEE Computer Society & AIS', 'Internasional',
  'Menerbitkan penelitian ilmiah bereputasi internasional mengenai arsitektur sistem informasi prediktif pada rantai pasok maritim kepulauan.',
  'Penelitian ini menganalisis efisiensi logistik distribusi komoditas antarpulau di Kepulauan Bangka Belitung menggunakan model prediktif berbasis machine learning.',
  'Kaprodi Sistem Informasi ISB Atma Luhur', 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=800&auto=format&fit=crop',
  'https://ieee.org', NULL, '/DSC01203.png', 72, true
),
(
  'SmartAgri Bangka - Sistem Monitoring IoT & Prediksi Panen Lada Putih', 'karya', 'Karya Aplikasi', 'Inovasi Daerah',
  'Rian Hidayat', 'Nabila Syahrani, Dimas Arya Pratama', '231150028', '2024',
  'Dinas Pertanian Prov. Kep. Bangka Belitung', 'Regional',
  'Perangkat IoT cerdas terintegrasi dashboard analitik cloud untuk memantau kelembaban mikro dan mendeteksi dini penyakit busuk batang tanaman lada.',
  'Proyek SmartAgri Bangka lahir dari kepedulian terhadap para petani lada putih di Bangka Belitung dengan telemetri ESP32 dan dashboard cloud.',
  'Laboratorium Komputasi & IoT ISB Atma Luhur', 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?q=80&w=800&auto=format&fit=crop',
  'https://github.com/himasi-atmaluhur', 'https://github.com/himasi-atmaluhur', NULL, 96, true
),
(
  'Software Engineer Intern di PT Bank Mandiri (Persero) Tbk - MSIB Batch 6', 'magang', 'Magang & MSIB', 'MSIB Batch 6',
  'Muhammad Evan Elua', NULL, '221150035', '2023',
  'Kampus Merdeka x PT Bank Mandiri (Persero) Tbk', 'Nasional',
  'Membangun dan mengoptimasi microservices backend pemrosesan transaksi perbankan digital serta mengimplementasikan automated API testing.',
  'Terpilih dari puluhan ribu pendaftar MSIB Kampus Merdeka untuk berkolaborasi di Divisi Digital Banking Core System.',
  NULL, 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=800&auto=format&fit=crop',
  'https://kampusmerdeka.kemdikbud.go.id', NULL, NULL, 67, false
),
(
  'Juara 3 - National Cyber Security & Penetration Testing Challenge 2025', 'lomba', 'Juara Lomba', 'Juara 3 Nasional',
  'Dimas Arya Pratama', 'Kevin Alamsyah', '221150041', '2023',
  'Badan Siber & Sandi Negara (BSSN) Challenge', 'Nasional',
  'Kompetisi Capture The Flag (CTF) kategori Web Exploitation, Reverse Engineering, dan Forensik Jaringan tingkat universitas se-Indonesia.',
  'Menghadapi 40 tim finalis dari seluruh perguruan tinggi, perwakilan HIMASI berhasil menyelesaikan skenario forensik digital.',
  NULL, 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=800&auto=format&fit=crop',
  NULL, NULL, '/DSC01203.png', 58, false
),
(
  'AtmaCare - Aplikasi Konseling Mahasiswa & Reservasi Sesi Psikolog Kampus', 'karya', 'Karya Aplikasi', 'Startup Digital',
  'Leysa Regita Parhusip', 'Felicia Angelica', '231150011', '2024',
  'Inkubator Bisnis & Inovasi ISB Atma Luhur', 'Kampus',
  'Aplikasi mobile-first untuk mendukung kesehatan mental mahasiswa dengan fitur jurnal refleksi harian dan booking konsultasi aman anonim.',
  'Dirancang untuk memberikan wadah bercerita yang aman bagi mahasiswa ISB Atma Luhur.',
  NULL, 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?q=80&w=800&auto=format&fit=crop',
  'https://github.com/himasi-atmaluhur', 'https://github.com/himasi-atmaluhur', NULL, 81, false
),
(
  'Product Design & UI/UX Intern di Tokopedia (GoTo Group) - MSIB Batch 5', 'magang', 'Magang & MSIB', 'MSIB Batch 5',
  'Beatriks Maria', NULL, '221150058', '2023',
  'Kampus Merdeka x Tokopedia (GoTo Group)', 'Nasional',
  'Merancang alur wireframing, user journey flow, serta pengujian kegunaan antarmuka (usability testing) pada fitur loyalty checkout rewards.',
  'Berkolaborasi langsung dengan tim UX Researcher Tokopedia dalam optimalisasi conversion checkout.',
  NULL, 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?q=80&w=800&auto=format&fit=crop',
  'https://kampusmerdeka.kemdikbud.go.id', NULL, NULL, 63, false
),
(
  'DevSI Open Source Library - Kumpulan Komponen UI Responsif HIMASI', 'karya', 'Karya Aplikasi', 'Open Source',
  'Kevin Saputra', 'Tim Medkominfo & Litbang HIMASI', '231150064', '2024',
  'HIMASI Developer Community', 'Nasional',
  'Koleksi komponen UI reusable berbasis Tailwind CSS dan accessible design system untuk standarisasi pembuatan situs web organisasi mahasiswa.',
  'Mempermudah mahasiswa prodi Sistem Informasi dalam membangun website kepanitiaan dan proyek akademik.',
  NULL, 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=800&auto=format&fit=crop',
  NULL, 'https://github.com/himasi-atmaluhur', NULL, 91, false
)
ON CONFLICT DO NOTHING;

-- Realtime Publication & Reload
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.apresiasi_showcase, public.apresiasi_submisi;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
END $$;

NOTIFY pgrst, 'reload schema';






