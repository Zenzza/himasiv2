-- ====================================================================
-- SKEMA LENGKAP DATABASE SUPABASE HIMASI ISB ATMA LUHUR
-- Kabinet REKSABUDAYA - Sistem Absensi QR, Rekap Kegiatan, & Portal Pengurus
-- ====================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ====================================================================
-- 2. TABEL: kegiatan_absensi (Master Data Agenda Kegiatan)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.kegiatan_absensi (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nama_kegiatan TEXT NOT NULL,
    tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
    jam TEXT NOT NULL DEFAULT '09:00 WIB',
    keterangan TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indeks untuk query cepat berdasarkan tanggal dan nama
CREATE INDEX IF NOT EXISTS idx_kegiatan_absensi_tanggal ON public.kegiatan_absensi(tanggal DESC);
CREATE INDEX IF NOT EXISTS idx_kegiatan_absensi_nama ON public.kegiatan_absensi(nama_kegiatan);

-- ====================================================================
-- 3. TABEL: absensi_log (Riwayat Presensi Pengurus saat Scan QR)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.absensi_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nama_pengurus TEXT NOT NULL,
    nim TEXT NOT NULL,
    divisi TEXT NOT NULL,
    nama_kegiatan TEXT NOT NULL,
    waktu_scan TIMESTAMPTZ NOT NULL DEFAULT now(),
    status TEXT NOT NULL DEFAULT 'Hadir' CHECK (status IN ('Hadir', 'Terlambat')),
    catatan TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indeks untuk filter absensi per kegiatan dan per pengurus
CREATE INDEX IF NOT EXISTS idx_absensi_log_kegiatan ON public.absensi_log(nama_kegiatan);
CREATE INDEX IF NOT EXISTS idx_absensi_log_nim ON public.absensi_log(nim);
CREATE INDEX IF NOT EXISTS idx_absensi_log_waktu ON public.absensi_log(waktu_scan DESC);

-- ====================================================================
-- 4. TABEL: aspirasi (Kotak Aspirasi Mahasiswa)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.aspirasi (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    angkatan TEXT NOT NULL,
    pesan TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'baru' CHECK (status IN ('baru', 'diproses', 'selesai')),
    catatan_pengurus TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_aspirasi_status ON public.aspirasi(status);
CREATE INDEX IF NOT EXISTS idx_aspirasi_created ON public.aspirasi(created_at DESC);

-- ====================================================================
-- 5. TABEL: pengurus (Master Data Peserta / Pengurus HIMASI)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.pengurus (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nim TEXT UNIQUE NOT NULL,
    nama TEXT NOT NULL,
    jabatan TEXT NOT NULL,
    divisi TEXT NOT NULL,
    qr_token TEXT UNIQUE NOT NULL,
    foto_url TEXT,
    email TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pengurus_nim ON public.pengurus(nim);
CREATE INDEX IF NOT EXISTS idx_pengurus_divisi ON public.pengurus(divisi);

-- ====================================================================
-- 6. HAK AKSES API & IZIN PERANGKAT (GRANT & RLS)
-- ====================================================================
-- Berikan hak akses tabel penuh ke API Supabase (anon, authenticated, service_role)
GRANT ALL ON TABLE public.kegiatan_absensi TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.absensi_log TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.aspirasi TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.pengurus TO anon, authenticated, service_role;

-- Nonaktifkan RLS agar semua perangkat (Laptop Admin & HP Pengurus) dapat membaca & menulis data absensi tanpa error 42501
ALTER TABLE public.kegiatan_absensi DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.absensi_log DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.aspirasi DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.pengurus DISABLE ROW LEVEL SECURITY;

-- ====================================================================
-- 7. SUPABASE STORAGE BUCKET: foto-pengurus
-- ====================================================================
-- Buat bucket penyimpanan foto peserta dengan batasan ukuran 3MB & tipe MIME gambar
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES (
    'foto-pengurus', 
    'foto-pengurus', 
    true, 
    3145728, -- Maksimum 3MB per berkas foto
    ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET 
    public = true,
    file_size_limit = 3145728,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- Hapus kebijakan lama jika ada untuk pembaruan
DROP POLICY IF EXISTS "Public Access Foto Pengurus" ON storage.objects;
DROP POLICY IF EXISTS "Upload Foto Pengurus" ON storage.objects;
DROP POLICY IF EXISTS "Update Foto Pengurus" ON storage.objects;
DROP POLICY IF EXISTS "Delete Foto Pengurus" ON storage.objects;
DROP POLICY IF EXISTS "Public Read Foto Pengurus" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload Foto Pengurus" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Update Foto Pengurus" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Delete Foto Pengurus" ON storage.objects;

-- Kebijakan Hak Akses Aman (Hardened Security):
-- a. Semua orang (Public) HANYA BISA MELIHAT foto profil (Read-Only)
CREATE POLICY "Public Read Foto Pengurus" 
ON storage.objects FOR SELECT 
TO public
USING (bucket_id = 'foto-pengurus');

-- b. HANYA PENGURUS TERAUTENTIKASI (Login) yang dapat mengunggah berkas foto
CREATE POLICY "Authenticated Upload Foto Pengurus" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (
    bucket_id = 'foto-pengurus' AND 
    auth.role() = 'authenticated'
);

-- c. HANYA PENGURUS TERAUTENTIKASI yang dapat memperbarui berkas foto
CREATE POLICY "Authenticated Update Foto Pengurus" 
ON storage.objects FOR UPDATE 
TO authenticated 
USING (
    bucket_id = 'foto-pengurus' AND 
    auth.role() = 'authenticated'
);

-- d. HANYA PENGURUS TERAUTENTIKASI yang dapat menghapus berkas foto
CREATE POLICY "Authenticated Delete Foto Pengurus" 
ON storage.objects FOR DELETE 
TO authenticated 
USING (
    bucket_id = 'foto-pengurus' AND 
    auth.role() = 'authenticated'
);

-- ====================================================================
-- 8. REFRESH SCHEMA CACHE & REALTIME PUBLICATION
-- ====================================================================
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.kegiatan_absensi, public.absensi_log, public.aspirasi, public.pengurus;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
END $$;

-- Memaksa Supabase me-reload schema cache agar API REST langsung mengenali tabel baru
NOTIFY pgrst, 'reload schema';
