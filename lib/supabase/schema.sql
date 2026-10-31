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
END $$;



