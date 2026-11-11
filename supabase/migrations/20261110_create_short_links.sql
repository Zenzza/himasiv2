-- ====================================================================
-- SKEMA TABEL SHORT LINKS & QR GENERATOR HIMASI ISB ATMA LUHUR
-- Modul: Tautan Singkat Resmi (/s/[slug]) & QR Generator
-- Sesuai Spesifikasi: docs/superpowers/specs/2026-11-10-link-shortener-qr-generator-design.md
-- Dibuat: 2026-11-10
-- ====================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ====================================================================
-- 2. TABEL: public.short_links
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.short_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    title TEXT NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    original_url TEXT NOT NULL,
    clicks_count INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    divisi TEXT NOT NULL DEFAULT 'BPH',
    created_by TEXT NOT NULL DEFAULT 'Pengurus HIMASI',
    description TEXT
);

-- ====================================================================
-- 3. INDEKS UNTUK PENCARIAN & PERFORMA REDIRECT CEPAT
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_short_links_slug ON public.short_links(slug);
CREATE INDEX IF NOT EXISTS idx_short_links_created_at ON public.short_links(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_short_links_is_active ON public.short_links(is_active);

-- ====================================================================
-- 4. HAK AKSES API & KEAMANAN (ROW LEVEL SECURITY)
-- ====================================================================
GRANT ALL ON TABLE public.short_links TO anon, authenticated, service_role;

ALTER TABLE public.short_links ENABLE ROW LEVEL SECURITY;

-- Publik dapat membaca semua shortlink untuk keperluan pengalihan rute /s/[slug]
DROP POLICY IF EXISTS "short_links_select_all" ON public.short_links;
CREATE POLICY "short_links_select_all" ON public.short_links
    FOR SELECT USING (true);

-- Pengurus terotorisasi / authenticated dapat menambah, memperbarui, & menghapus
DROP POLICY IF EXISTS "short_links_insert_all" ON public.short_links;
CREATE POLICY "short_links_insert_all" ON public.short_links
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "short_links_update_all" ON public.short_links;
CREATE POLICY "short_links_update_all" ON public.short_links
    FOR UPDATE USING (true);

DROP POLICY IF EXISTS "short_links_delete_all" ON public.short_links;
CREATE POLICY "short_links_delete_all" ON public.short_links
    FOR DELETE USING (true);

-- ====================================================================
-- 5. FUNCTION RPC: increment_short_link_clicks
-- Menginkrementasi counter klik secara atomic tanpa race condition
-- ====================================================================
CREATE OR REPLACE FUNCTION increment_short_link_clicks(link_slug TEXT)
RETURNS void AS $$
BEGIN
    UPDATE public.short_links
    SET clicks_count = clicks_count + 1,
        updated_at = NOW()
    WHERE slug = link_slug;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

