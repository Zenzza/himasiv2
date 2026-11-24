-- ==============================================================================
-- Migration: 20261123_enable_voting_realtime.sql
-- Description: Mengaktifkan Supabase Realtime (INSERT, UPDATE, DELETE) pada
--              tabel public.voting_sesi agar status sesi E-Voting tersinkronisasi
--              secara instan ke seluruh perangkat pemilih.
-- ==============================================================================

-- 1. Pastikan REPLICA IDENTITY FULL aktif agar event DELETE dan UPDATE
--    mengirimkan payload baris secara lengkap melalui WAL Realtime.
ALTER TABLE public.voting_sesi REPLICA IDENTITY FULL;

-- 2. Daftarkan public.voting_sesi ke publikasi supabase_realtime secara idempoten.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'voting_sesi'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.voting_sesi;
  END IF;
END
$$;

-- 3. Muat ulang schema cache PostgREST Supabase
NOTIFY pgrst, 'reload schema';
