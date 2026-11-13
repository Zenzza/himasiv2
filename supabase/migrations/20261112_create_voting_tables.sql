-- ==============================================================================
-- Migration: E-Voting Pemilihan Ketua Himpunan HIMASI Atma Luhur
-- Description: Tabel Sesi Pemilihan, Data Kandidat Paslon/Kotak Kosong,
--              DPT Mahasiswa (NIM + Tgl Lahir), dan Kotak Suara Anonim
-- ==============================================================================

-- 1. Tabel Sesi Pemilihan
CREATE TABLE IF NOT EXISTS public.voting_sesi (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  judul TEXT NOT NULL,                                 -- e.g. "Pemilihan Ketua HIMASI Periode 2026/2027"
  tahun_periode VARCHAR(20) NOT NULL,                  -- e.g. "2026/2027"
  deskripsi TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'draft',         -- 'draft', 'open', 'closed', 'archived'
  is_results_unlocked BOOLEAN NOT NULL DEFAULT false,  -- blind vote status flag
  opened_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  unlocked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Tabel Kandidat Calon Ketua Himpunan (Paslon & Kotak Kosong)
CREATE TABLE IF NOT EXISTS public.voting_kandidat (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sesi_id UUID NOT NULL REFERENCES public.voting_sesi(id) ON DELETE CASCADE,
  nomor_urut INT NOT NULL,                             -- 1 (Calon Tunggal), 2 (Kotak Kosong / Alternatif)
  nama_calon TEXT NOT NULL,
  foto_url TEXT,
  visi TEXT,
  misi TEXT,
  program_kerja TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Tabel Daftar Pemilih Tetap (DPT)
CREATE TABLE IF NOT EXISTS public.voting_dpt (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sesi_id UUID NOT NULL REFERENCES public.voting_sesi(id) ON DELETE CASCADE,
  nim VARCHAR(20) NOT NULL,                            -- NIM Mahasiswa
  nama_lengkap TEXT NOT NULL,
  tanggal_lahir DATE NOT NULL,                         -- Tanggal Lahir (YYYY-MM-DD) sebagai 2FA
  sudah_memilih BOOLEAN NOT NULL DEFAULT false,
  voted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(sesi_id, nim)
);

-- 4. Tabel Kotak Suara Digital Anonim (Asas Rahasia Luber Jurdil)
-- CATATAN: TIDAK ADA KOLOM NIM ATAU VOTER_ID DI SINI! HAK SUARA TERPUTUS DARI IDENTITAS
CREATE TABLE IF NOT EXISTS public.voting_suara (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sesi_id UUID NOT NULL REFERENCES public.voting_sesi(id) ON DELETE CASCADE,
  kandidat_id UUID NOT NULL REFERENCES public.voting_kandidat(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes untuk akselerasi query
CREATE INDEX IF NOT EXISTS idx_voting_sesi_status ON public.voting_sesi(status);
CREATE INDEX IF NOT EXISTS idx_voting_kandidat_sesi ON public.voting_kandidat(sesi_id, nomor_urut);
CREATE INDEX IF NOT EXISTS idx_voting_dpt_lookup ON public.voting_dpt(sesi_id, nim, tanggal_lahir);
CREATE INDEX IF NOT EXISTS idx_voting_dpt_status ON public.voting_dpt(sesi_id, sudah_memilih);
CREATE INDEX IF NOT EXISTS idx_voting_suara_sesi ON public.voting_suara(sesi_id, kandidat_id);

-- ==============================================================================
-- 5. Hak Akses & Kebijakan Keamanan (Row Level Security)
-- ==============================================================================
GRANT ALL ON TABLE public.voting_sesi TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.voting_kandidat TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.voting_dpt TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.voting_suara TO anon, authenticated, service_role;

ALTER TABLE public.voting_sesi ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voting_kandidat ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voting_dpt ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voting_suara ENABLE ROW LEVEL SECURITY;

-- Policies: voting_sesi
DROP POLICY IF EXISTS "voting_sesi_read_all" ON public.voting_sesi;
CREATE POLICY "voting_sesi_read_all" ON public.voting_sesi FOR SELECT USING (true);
DROP POLICY IF EXISTS "voting_sesi_manage_all" ON public.voting_sesi;
CREATE POLICY "voting_sesi_manage_all" ON public.voting_sesi FOR ALL USING (true);

-- Policies: voting_kandidat
DROP POLICY IF EXISTS "voting_kandidat_read_all" ON public.voting_kandidat;
CREATE POLICY "voting_kandidat_read_all" ON public.voting_kandidat FOR SELECT USING (true);
DROP POLICY IF EXISTS "voting_kandidat_manage_all" ON public.voting_kandidat;
CREATE POLICY "voting_kandidat_manage_all" ON public.voting_kandidat FOR ALL USING (true);

-- Policies: voting_dpt
DROP POLICY IF EXISTS "voting_dpt_read_all" ON public.voting_dpt;
CREATE POLICY "voting_dpt_read_all" ON public.voting_dpt FOR SELECT USING (true);
DROP POLICY IF EXISTS "voting_dpt_update_all" ON public.voting_dpt;
CREATE POLICY "voting_dpt_update_all" ON public.voting_dpt FOR UPDATE USING (true);
DROP POLICY IF EXISTS "voting_dpt_manage_all" ON public.voting_dpt;
CREATE POLICY "voting_dpt_manage_all" ON public.voting_dpt FOR ALL USING (true);

-- Policies: voting_suara
DROP POLICY IF EXISTS "voting_suara_insert_all" ON public.voting_suara;
CREATE POLICY "voting_suara_insert_all" ON public.voting_suara FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "voting_suara_read_all" ON public.voting_suara;
CREATE POLICY "voting_suara_read_all" ON public.voting_suara FOR SELECT USING (true);
DROP POLICY IF EXISTS "voting_suara_manage_all" ON public.voting_suara;
CREATE POLICY "voting_suara_manage_all" ON public.voting_suara FOR ALL USING (true);


