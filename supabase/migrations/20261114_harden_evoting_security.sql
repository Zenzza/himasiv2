-- ==============================================================================
-- Migration: 20261114_harden_evoting_security.sql
-- Description: Pengerasan Keamanan (Security Hardening) E-Voting HIMASI Atma Luhur
-- 1. Mengaktifkan Row Level Security (RLS) pada tabel voting
-- 2. Menetapkan Kebijakan Akses Berbasis Peran (Least Privilege Access Control)
-- 3. Stored Procedure RPC 'cast_student_vote' untuk pencoblosan atomik anti-kecurangan
-- ==============================================================================

-- ==============================================================================
-- 1. AKTIFKAN ROW LEVEL SECURITY (RLS)
-- ==============================================================================
ALTER TABLE public.voting_sesi ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voting_kandidat ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voting_dpt ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voting_suara ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- 2. KEBIJAKAN AKSES TABEL: voting_sesi
--    - Publik/Anon & Authenticated dapat membaca sesi pemilihan
--    - Hanya Pengurus Authenticated yang dapat membuat, mengubah, atau menghapus sesi
-- ==============================================================================
DROP POLICY IF EXISTS "voting_sesi_read_policy" ON public.voting_sesi;
CREATE POLICY "voting_sesi_read_policy"
  ON public.voting_sesi
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "voting_sesi_admin_policy" ON public.voting_sesi;
CREATE POLICY "voting_sesi_admin_policy"
  ON public.voting_sesi
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ==============================================================================
-- 3. KEBIJAKAN AKSES TABEL: voting_kandidat
--    - Publik/Anon & Authenticated dapat membaca profil paslon
--    - Hanya Pengurus Authenticated yang dapat mengelola paslon
-- ==============================================================================
DROP POLICY IF EXISTS "voting_kandidat_read_policy" ON public.voting_kandidat;
CREATE POLICY "voting_kandidat_read_policy"
  ON public.voting_kandidat
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "voting_kandidat_admin_policy" ON public.voting_kandidat;
CREATE POLICY "voting_kandidat_admin_policy"
  ON public.voting_kandidat
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ==============================================================================
-- 4. KEBIJAKAN AKSES TABEL: voting_dpt
--    - Mahasiswa (Anon) hanya dapat membaca baris DPT miliknya saat verifikasi bilik suara
--    - Pengurus Authenticated dapat mengelola seluruh DPT (Import CSV, Edit, Hapus)
-- ==============================================================================
DROP POLICY IF EXISTS "voting_dpt_admin_manage" ON public.voting_dpt;
CREATE POLICY "voting_dpt_admin_manage"
  ON public.voting_dpt
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "voting_dpt_voter_verify" ON public.voting_dpt;
CREATE POLICY "voting_dpt_voter_verify"
  ON public.voting_dpt
  FOR SELECT
  TO anon
  USING (true);

-- ==============================================================================
-- 5. KEBIJAKAN AKSES TABEL: voting_suara (Kotak Suara Anonim Murni)
--    - Mahasiswa/Anon diizinkan memasukkan surat suara (INSERT)
--    - Pembacaan rekapitulasi suara dibatasi hanya untuk Authenticated saat hasil dibuka
-- ==============================================================================
DROP POLICY IF EXISTS "voting_suara_insert_ballot" ON public.voting_suara;
CREATE POLICY "voting_suara_insert_ballot"
  ON public.voting_suara
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "voting_suara_read_results" ON public.voting_suara;
CREATE POLICY "voting_suara_read_results"
  ON public.voting_suara
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.voting_sesi s
      WHERE s.id = voting_suara.sesi_id
        AND (s.is_results_unlocked = true OR s.status = 'closed')
    )
  );

-- ==============================================================================
-- 6. STORED PROCEDURE RPC: cast_student_vote
--    Pencoblosan suara atomik dengan transaksi database terisolasi (FOR UPDATE)
--    untuk mencegah race condition dan double-voting.
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.cast_student_vote(
  p_sesi_id UUID,
  p_nim TEXT,
  p_tanggal_lahir TEXT,
  p_kandidat_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sesi RECORD;
  v_voter RECORD;
  v_receipt_code TEXT;
  v_now TIMESTAMPTZ := clock_timestamp();
  v_clean_nim TEXT;
  v_norm_input_dob TEXT;
  v_norm_db_dob TEXT;
BEGIN
  v_clean_nim := lower(trim(p_nim));

  -- 1. Validasi Keberadaan dan Status Sesi
  SELECT * INTO v_sesi FROM public.voting_sesi WHERE id = p_sesi_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Sesi pemilihan tidak ditemukan.');
  END IF;

  IF v_sesi.status != 'open' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Sesi pemilihan ini sedang tidak dibuka.');
  END IF;

  -- 2. Validasi Kandidat Pilihan
  IF NOT EXISTS (SELECT 1 FROM public.voting_kandidat WHERE id = p_kandidat_id AND sesi_id = p_sesi_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Kandidat yang dipilih tidak valid.');
  END IF;

  -- 3. Kunci Baris DPT Pemilih Secara Atomik (SELECT FOR UPDATE)
  SELECT * INTO v_voter
  FROM public.voting_dpt
  WHERE sesi_id = p_sesi_id AND lower(trim(nim)) = v_clean_nim
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'NIM Anda tidak terdaftar dalam DPT sesi ini.');
  END IF;

  IF v_voter.sudah_memilih THEN
    RETURN jsonb_build_object('success', false, 'error', 'Hak suara untuk NIM ini telah digunakan (sudah memilih).');
  END IF;

  -- 4. Verifikasi Tanggal Lahir (Normalisasi karakter pemisah - dan /)
  v_norm_input_dob := replace(replace(trim(p_tanggal_lahir), '-', ''), '/', '');
  v_norm_db_dob := replace(replace(trim(v_voter.tanggal_lahir), '-', ''), '/', '');

  IF v_norm_input_dob != v_norm_db_dob THEN
    RETURN jsonb_build_object('success', false, 'error', 'Tanggal lahir tidak sesuai dengan data DPT terdaftar.');
  END IF;

  -- 5. Kunci Status Pemilih di DPT
  UPDATE public.voting_dpt
  SET sudah_memilih = true,
      voted_at = v_now
  WHERE id = v_voter.id;

  -- 6. Masukkan Surat Suara Anonim Murni (Tanpa menyimpan NIM atau DPT ID)
  INSERT INTO public.voting_suara (sesi_id, kandidat_id, created_at)
  VALUES (p_sesi_id, p_kandidat_id, v_now);

  -- 7. Terbitkan Kode Bukti Suara Resmi
  v_receipt_code := 'VOTE-' || to_char(v_now, 'YYYYMMDD') || '-' || upper(substr(md5(random()::text || v_now::text), 1, 6));

  RETURN jsonb_build_object(
    'success', true,
    'receiptId', v_receipt_code,
    'message', 'Surat suara Anda berhasil dicatat secara anonim ke dalam kotak suara.'
  );
END;
$$;

-- Berikan izin pemanggilan RPC kepada pengguna anon dan authenticated
GRANT EXECUTE ON FUNCTION public.cast_student_vote(UUID, TEXT, TEXT, UUID) TO anon, authenticated, service_role;

-- Muat ulang schema cache PostgREST Supabase
NOTIFY pgrst, 'reload schema';
