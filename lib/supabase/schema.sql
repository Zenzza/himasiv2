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
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.pengurus ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pengurus dapat melihat daftar anggota"
  ON public.pengurus FOR SELECT TO authenticated USING (true);

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
