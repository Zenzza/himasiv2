-- ====================================================================
-- SKEMA TABEL & PUBLIKASI REALTIME CONTENT PLANNER HIMASI ISB ATMA LUHUR
-- Modul: Content Planning & Strategy (Divisi Medkominfo)
-- Sesuai Spesifikasi Teknis: docs/superpowers/specs/2026-11-07-content-planner-design.md
-- Revisi: 2026-11-07 (Schema Refinement: Jenis Konten, Tipe Konten, Realtime Status/Progress, Platform)
-- ====================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ====================================================================
-- 2. TABEL: public.content_plans
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.content_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tanggal DATE NOT NULL,
    calendar_week INTEGER NOT NULL,
    day_of_week VARCHAR(20) NOT NULL,
    platform VARCHAR(30) NOT NULL DEFAULT 'Instagram' CHECK (
        platform IN ('TikTok', 'Instagram', 'YouTube', 'Web', 'Lainnya')
    ),
    tipe_konten VARCHAR(50) NOT NULL DEFAULT 'Edukasi' CHECK (
        tipe_konten IN ('Edukasi', 'PHB', 'Apresia-SI', 'Pemberitahuan')
    ),
    topik TEXT NOT NULL,
    konsep VARCHAR(50) NOT NULL DEFAULT 'Feeds' CHECK (
        konsep IN ('Feeds', 'Reels', 'Short Video', 'Story')
    ),
    objektif VARCHAR(50) DEFAULT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'Planning' CHECK (
        status IN ('Planning', 'On Proses', 'Revisi', 'Review', 'Publish')
    ),
    referensi_url TEXT,
    progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    is_done BOOLEAN NOT NULL DEFAULT FALSE,
    catatan TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ====================================================================
-- 3. INDEKS UNTUK PERFORMA PENCARIAN & FILTERING REALTIME
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_content_plans_platform_date ON public.content_plans(platform, tanggal);
CREATE INDEX IF NOT EXISTS idx_content_plans_cw ON public.content_plans(calendar_week, tanggal);
CREATE INDEX IF NOT EXISTS idx_content_plans_status ON public.content_plans(status);
CREATE INDEX IF NOT EXISTS idx_content_plans_created_at ON public.content_plans(created_at DESC);

-- ====================================================================
-- 4. TRIGGER UNTUK OTOMATISASI UPDATED_AT
-- ====================================================================
CREATE OR REPLACE FUNCTION public.handle_content_plans_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_content_plans_updated_at ON public.content_plans;
CREATE TRIGGER trg_content_plans_updated_at
    BEFORE UPDATE ON public.content_plans
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_content_plans_updated_at();

-- ====================================================================
-- 5. HAK AKSES API & KEAMANAN (RLS & GRANTS)
-- ====================================================================
GRANT ALL ON TABLE public.content_plans TO anon, authenticated, service_role;

ALTER TABLE public.content_plans ENABLE ROW LEVEL SECURITY;

-- Kebijakan RLS agar pengguna dan pengurus dapat membaca & memutasi jadwal konten
DROP POLICY IF EXISTS "content_plans_select_all" ON public.content_plans;
CREATE POLICY "content_plans_select_all" ON public.content_plans
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "content_plans_insert_all" ON public.content_plans;
CREATE POLICY "content_plans_insert_all" ON public.content_plans
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "content_plans_update_all" ON public.content_plans;
CREATE POLICY "content_plans_update_all" ON public.content_plans
    FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "content_plans_delete_all" ON public.content_plans;
CREATE POLICY "content_plans_delete_all" ON public.content_plans
    FOR DELETE USING (true);

-- ====================================================================
-- 6. PENDAFTARAN KE PUBLIKASI SUPABASE REALTIME
-- Mengaktifkan siaran langsung WebSocket postgres_changes per baris
-- ====================================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
          AND schemaname = 'public' 
          AND tablename = 'content_plans'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.content_plans;
    END IF;
EXCEPTION
    WHEN duplicate_object THEN
        NULL;
    WHEN undefined_object THEN
        NULL;
END $$;

-- ====================================================================
-- 7. DATA AWAL (SEED INITIAL DATA CW 45 & CW 46 TAHUN 2026)
-- Sesuai acuan operasional Medkominfo HIMASI
-- ====================================================================
INSERT INTO public.content_plans (
    id, tanggal, calendar_week, day_of_week, platform,
    tipe_konten, topik, konsep, status,
    referensi_url, progress, is_done, catatan
) VALUES
-- CW 45 (1 November - 7 November 2026) - MINGGU BERJALAN
(
    'd4500001-0045-4000-8000-000000000001',
    '2026-11-01', 45, 'Sunday', 'Instagram',
    'Edukasi', 'Roadmap Belajar UI/UX & Web Development untuk Mahasiswa Sistem Informasi',
    'Feeds', 'Publish',
    'https://instagram.com/himasi_isb', 100, TRUE,
    'Desain carousel Swiss typography, cover kontras tinggi'
),
(
    'd4500001-0045-4000-8000-000000000002',
    '2026-11-02', 45, 'Monday', 'Instagram',
    'PHB', 'Peringatan Hari Pahlawan Nasional 2026 - Semangat Juang Mahasiswa Teknologi',
    'Story', 'Publish',
    'https://drive.google.com/drive/folders/himasi-cw45', 100, TRUE,
    'Template resmi poster HIMASI, repost di Story pengurus'
),
(
    'd4500001-0045-4000-8000-000000000003',
    '2026-11-03', 45, 'Tuesday', 'TikTok',
    'Edukasi', '5 Tips Menghadapi Ujian Praktikum Basis Data & Algoritma Pemrograman',
    'Reels', 'Publish',
    NULL, 100, TRUE,
    'Talent: Tim Medkominfo & Lab Komputer'
),
(
    'd4500001-0045-4000-8000-000000000004',
    '2026-11-04', 45, 'Wednesday', 'TikTok',
    'Apresia-SI', 'Selamat Atas Prestasi Tim Mahasiswa ISB Juara Hackathon Nasional 2026',
    'Short Video', 'Publish',
    'https://tiktok.com/@himasi_isb', 100, TRUE,
    'Format video transisi wawancara pemenang'
),
(
    'd4500001-0045-4000-8000-000000000005',
    '2026-11-05', 45, 'Thursday', 'Instagram',
    'Pemberitahuan', 'Jadwal Pengisian KRS Susulan & Batas Akhir Pembayaran Administrasi',
    'Feeds', 'Publish',
    'https://drive.google.com/drive/folders/himasi-cw45-krs', 100, TRUE,
    'Infografis batas tanggal dan alur akademik BAAK'
),
(
    'd4500001-0045-4000-8000-000000000006',
    '2026-11-06', 45, 'Friday', 'Instagram',
    'Edukasi', 'Pengenalan Arsitektur Cloud Computing & Microservices untuk Skripsi',
    'Feeds', 'Review',
    'https://drive.google.com/file/d/himasi-cloud-article', 75, FALSE,
    'Final review materi oleh Ketua Divisi Medkominfo'
),
(
    'd4500001-0045-4000-8000-000000000007',
    '2026-11-07', 45, 'Saturday', 'TikTok',
    'PHB', 'Highlight Keseruan Welcoming Party & Temu Keakraban Mahasiswa Baru SI 2026',
    'Short Video', 'On Proses',
    NULL, 25, FALSE,
    'Tahap perakitan footage video kegiatan outdoor kampus'
),

-- CW 46 (8 November - 14 November 2026) - MINGGU DEPAN
(
    'd4600001-0046-4000-8000-000000000001',
    '2026-11-08', 46, 'Sunday', 'Instagram',
    'Edukasi', 'Tutorial Git & GitHub Collaboration untuk Pemula di Tim Proyek',
    'Feeds', 'Planning',
    NULL, 0, FALSE,
    'Naskah slide materi dasar: clone, branch, commit, push, PR'
),
(
    'd4600001-0046-4000-8000-000000000002',
    '2026-11-09', 46, 'Monday', 'Instagram',
    'Pemberitahuan', 'Pengumuman Open Recruitment Panitia Dies Natalis HIMASI Ke-24',
    'Story', 'Planning',
    NULL, 0, FALSE,
    'Poster rekrutmen divisi acara, humas, medkom, konsumsi'
),
(
    'd4600001-0046-4000-8000-000000000003',
    '2026-11-10', 46, 'Tuesday', 'TikTok',
    'Edukasi', 'Perbedaan Nyata Frontend Dev vs Backend Dev vs UI/UX Designer',
    'Short Video', 'Planning',
    NULL, 0, FALSE,
    'Format video interaktif di lab komputer'
),
(
    'd4600001-0046-4000-8000-000000000004',
    '2026-11-11', 46, 'Wednesday', 'Instagram',
    'Apresia-SI', 'Apresiasi Wisudawan Terbaik & Peraih IPK Tertinggi Prodi SI 2026',
    'Feeds', 'Planning',
    NULL, 0, FALSE,
    'Profil singkat wisudawan dan kutipan motivasi'
),
(
    'd4600001-0046-4000-8000-000000000005',
    '2026-11-12', 46, 'Thursday', 'YouTube',
    'Edukasi', 'Tips Membuat Portofolio UI/UX yang Dilirik Recruiter Tech Company',
    'Short Video', 'Planning',
    NULL, 0, FALSE,
    'YouTube Shorts 60 detik'
),
(
    'd4600001-0046-4000-8000-000000000006',
    '2026-11-13', 46, 'Friday', 'Instagram',
    'PHB', 'Peringatan Hari Pohon Sedunia - Aksi Bersih & Hijau Kampus ISB',
    'Story', 'Planning',
    NULL, 0, FALSE,
    'Kampanye peduli lingkungan kampus Atma Luhur'
),
(
    'd4600001-0046-4000-8000-000000000007',
    '2026-11-14', 46, 'Saturday', 'TikTok',
    'Pemberitahuan', 'Recap Mingguan Info Akademik & Agenda Kegiatan Divisi Medkominfo',
    'Reels', 'Planning',
    NULL, 0, FALSE,
    'News flash mingguan Instagram Reels & TikTok'
)
ON CONFLICT (id) DO NOTHING;
