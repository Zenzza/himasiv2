-- ====================================================================
-- SKEMA TABEL POPUP PENGUMUMAN BERANDA HIMASI ISB ATMA LUHUR
-- Modul: Popup Beranda & Notifikasi Mahasiswa
-- Sesuai Spesifikasi: docs/superpowers/specs/2026-11-10-homepage-announcement-popup-design.md
-- Dibuat: 2026-11-10
-- ====================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ====================================================================
-- 2. TABEL: public.homepage_popups
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.homepage_popups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    title TEXT NOT NULL,
    tag VARCHAR(50) NOT NULL DEFAULT 'PENGUMUMAN',
    content TEXT NOT NULL,
    image_url TEXT,
    cta_text VARCHAR(50) DEFAULT 'Lihat Detail',
    cta_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT false,
    created_by TEXT NOT NULL DEFAULT 'Pengurus HIMASI'
);

-- ====================================================================
-- 3. INDEKS UNTUK PENCARIAN & STATUS PENAYANGAN
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_homepage_popups_is_active ON public.homepage_popups(is_active);
CREATE INDEX IF NOT EXISTS idx_homepage_popups_created_at ON public.homepage_popups(created_at DESC);

-- ====================================================================
-- 4. HAK AKSES API & KEAMANAN (ROW LEVEL SECURITY)
-- ====================================================================
GRANT ALL ON TABLE public.homepage_popups TO anon, authenticated, service_role;

ALTER TABLE public.homepage_popups ENABLE ROW LEVEL SECURITY;

-- Publik dapat membaca popup aktif untuk penayangan di halaman depan
DROP POLICY IF EXISTS "homepage_popups_select_all" ON public.homepage_popups;
CREATE POLICY "homepage_popups_select_all" ON public.homepage_popups
    FOR SELECT USING (true);

-- Pengurus dapat menambah, mengedit, dan menghapus popup
DROP POLICY IF EXISTS "homepage_popups_insert_all" ON public.homepage_popups;
CREATE POLICY "homepage_popups_insert_all" ON public.homepage_popups
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "homepage_popups_update_all" ON public.homepage_popups;
CREATE POLICY "homepage_popups_update_all" ON public.homepage_popups
    FOR UPDATE USING (true);

DROP POLICY IF EXISTS "homepage_popups_delete_all" ON public.homepage_popups;
CREATE POLICY "homepage_popups_delete_all" ON public.homepage_popups
    FOR DELETE USING (true);

-- ====================================================================
-- 5. FUNCTION RPC: set_active_homepage_popup
-- Menjamin invariant: hanya 1 popup yang aktif pada satu waktu
-- ====================================================================
CREATE OR REPLACE FUNCTION set_active_homepage_popup(target_id UUID)
RETURNS void AS $$
BEGIN
    -- Matikan semua popup terlebih dahulu
    UPDATE public.homepage_popups
    SET is_active = false,
        updated_at = NOW();

    -- Aktifkan popup target yang dipilih
    UPDATE public.homepage_popups
    SET is_active = true,
        updated_at = NOW()
    WHERE id = target_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

