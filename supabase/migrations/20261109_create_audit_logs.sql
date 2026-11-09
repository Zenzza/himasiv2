-- ====================================================================
-- SKEMA TABEL & PUBLIKASI REALTIME AUDIT LOG AKTIVITAS HIMASI ISB ATMA LUHUR
-- Modul: Audit Trail & Tata Kelola Organisasi (Super Admin & BPH)
-- Sesuai Spesifikasi Teknis: docs/superpowers/specs/2026-11-09-audit-log-aktivitas-design.md
-- Dibuat: 2026-11-09
-- ====================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ====================================================================
-- 2. TABEL: public.audit_logs
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    pengurus_id TEXT,
    pengurus_nama TEXT NOT NULL,
    pengurus_role TEXT NOT NULL,
    modul VARCHAR(50) NOT NULL,
    aksi TEXT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'berhasil' CHECK (
        status IN ('berhasil', 'gagal', 'peringatan')
    ),
    detail TEXT
);

-- ====================================================================
-- 3. INDEKS UNTUK PERFORMA PENCARIAN & FILTERING REALTIME
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_modul ON public.audit_logs(modul);
CREATE INDEX IF NOT EXISTS idx_audit_logs_pengurus ON public.audit_logs(pengurus_nama);
CREATE INDEX IF NOT EXISTS idx_audit_logs_status ON public.audit_logs(status);

-- ====================================================================
-- 4. HAK AKSES API & KEAMANAN (RLS & GRANTS)
-- ====================================================================
GRANT ALL ON TABLE public.audit_logs TO anon, authenticated, service_role;

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Kebijakan RLS agar pengguna dan pengurus terotorisasi dapat membaca & mencatat audit log
DROP POLICY IF EXISTS "audit_logs_select_all" ON public.audit_logs;
CREATE POLICY "audit_logs_select_all" ON public.audit_logs
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "audit_logs_insert_all" ON public.audit_logs;
CREATE POLICY "audit_logs_insert_all" ON public.audit_logs
    FOR INSERT WITH CHECK (true);

-- ====================================================================
-- 5. PENDAFTARAN KE PUBLIKASI SUPABASE REALTIME
-- Mengaktifkan siaran langsung WebSocket postgres_changes per baris
-- ====================================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
          AND schemaname = 'public' 
          AND tablename = 'audit_logs'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.audit_logs;
    END IF;
EXCEPTION
    WHEN duplicate_object THEN
        NULL;
    WHEN undefined_object THEN
        NULL;
END $$;
