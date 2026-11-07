-- ====================================================================
-- SKEMA TABEL & FUNGSI PERSURATAN HIMASI ISB ATMA LUHUR
-- Modul: Persuratan & Penomoran Otomatis (Kabinet Reksabudaya)
-- Tanggal: 2026-11-06
-- ====================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ====================================================================
-- 2. TABEL: public.surat_arsip
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.surat_arsip (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    jenis_surat VARCHAR(10) NOT NULL CHECK (jenis_surat IN ('keluar', 'masuk')),
    kode_jenis VARCHAR(10) NOT NULL DEFAULT 'UND',
    nomor_urut INTEGER, -- NULL jika masih 'draft' atau surat masuk
    nomor_surat VARCHAR(100), -- Format HIMASI untuk surat keluar, atau nomor asal untuk surat masuk, atau '—' jika draft
    perihal TEXT NOT NULL,
    kategori_label VARCHAR(50) NOT NULL DEFAULT 'Undangan',
    tujuan_pengirim TEXT NOT NULL, -- Pihak tujuan (keluar) atau Asal Pengirim (masuk)
    tanggal_surat DATE NOT NULL DEFAULT CURRENT_DATE,
    tanggal_diterima DATE, -- Khusus surat masuk
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (
        status IN ('draft', 'menunggu_ttd', 'terkirim', 'arsip', 'belum_disposisi', 'didisposisi', 'selesai')
    ),
    file_url TEXT,
    file_name TEXT,
    file_size TEXT,
    catatan_disposisi TEXT,
    konten_kop JSONB DEFAULT '{}'::jsonb, -- Persiapan Fase 2 (isi surat, tembusan, penandatangan)
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ====================================================================
-- 3. INDEKS UNTUK PERFORMA PENCARIAN & INTEGRITAS PENOMORAN
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_surat_jenis_status ON public.surat_arsip(jenis_surat, status);
CREATE INDEX IF NOT EXISTS idx_surat_tanggal ON public.surat_arsip(tanggal_surat DESC);
CREATE INDEX IF NOT EXISTS idx_surat_nomor_urut ON public.surat_arsip(nomor_urut DESC) WHERE nomor_urut IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_surat_created_at ON public.surat_arsip(created_at DESC);

-- Partial Unique Index untuk mencegah nomor urut kembar pada tahun yang sama
CREATE UNIQUE INDEX IF NOT EXISTS uq_surat_nomor_keluar_tahun
ON public.surat_arsip (nomor_urut, (EXTRACT(YEAR FROM tanggal_surat)::int))
WHERE jenis_surat = 'keluar' AND nomor_urut IS NOT NULL;

-- ====================================================================
-- 4. FUNGSI ATOMIC SEQUENCE & NUMBER RECYCLING
-- Mengalokasikan nomor urut berikutnya per tahun kalender.
-- Jika surat ditarik kembali ke 'draft', nomor_urut diset NULL sehingga
-- MAX(nomor_urut) + 1 secara otomatis mendaur ulang nomor tanpa celah.
-- ====================================================================
CREATE OR REPLACE FUNCTION public.get_next_nomor_surat(
    p_kode_jenis text,
    p_tanggal_surat date DEFAULT CURRENT_DATE
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
    v_tahun int;
    v_bulan int;
    v_bulan_romawi text;
    v_next_urut int;
    v_nomor_surat text;
    v_romawi_arr text[] := ARRAY['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII'];
BEGIN
    v_tahun := EXTRACT(YEAR FROM p_tanggal_surat)::int;
    v_bulan := EXTRACT(MONTH FROM p_tanggal_surat)::int;

    -- Validasi rentang bulan 1-12
    IF v_bulan < 1 OR v_bulan > 12 THEN
        v_bulan := 1;
    END IF;
    v_bulan_romawi := v_romawi_arr[v_bulan];

    -- Hitung urutan tertinggi yang aktif untuk surat keluar tahun berjalan
    -- (surat draft atau yang dibatalkan memiliki nomor_urut IS NULL sehingga nomor didaur ulang)
    SELECT COALESCE(MAX(nomor_urut), 0) + 1 INTO v_next_urut
    FROM public.surat_arsip
    WHERE jenis_surat = 'keluar'
      AND EXTRACT(YEAR FROM tanggal_surat) = v_tahun
      AND nomor_urut IS NOT NULL;

    -- Format nomor surat keluar HIMASI: [nomor 3-digit]/[jenis]/HIMASI/[bulan romawi]/[tahun]
    v_nomor_surat := LPAD(v_next_urut::text, 3, '0') || '/' || UPPER(TRIM(p_kode_jenis)) || '/HIMASI/' || v_bulan_romawi || '/' || v_tahun::text;

    RETURN jsonb_build_object(
        'nomor_urut', v_next_urut,
        'nomor_surat', v_nomor_surat,
        'tahun', v_tahun,
        'bulan_romawi', v_bulan_romawi
    );
END;
$$;

-- ====================================================================
-- 5. TRIGGER UNTUK OTOMATISASI UPDATED_AT
-- ====================================================================
CREATE OR REPLACE FUNCTION public.handle_surat_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_surat_arsip_updated_at ON public.surat_arsip;
CREATE TRIGGER trg_surat_arsip_updated_at
    BEFORE UPDATE ON public.surat_arsip
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_surat_updated_at();

-- ====================================================================
-- 6. HAK AKSES API & KEAMANAN (RLS & GRANTS)
-- ====================================================================
GRANT ALL ON TABLE public.surat_arsip TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_next_nomor_surat(text, date) TO anon, authenticated, service_role;

ALTER TABLE public.surat_arsip ENABLE ROW LEVEL SECURITY;

-- Kebijakan RLS agar pengguna aplikasi dan dashboard dapat membaca & menulis data persuratan
DROP POLICY IF EXISTS "surat_arsip_select_all" ON public.surat_arsip;
CREATE POLICY "surat_arsip_select_all" ON public.surat_arsip FOR SELECT USING (true);

DROP POLICY IF EXISTS "surat_arsip_insert_all" ON public.surat_arsip;
CREATE POLICY "surat_arsip_insert_all" ON public.surat_arsip FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "surat_arsip_update_all" ON public.surat_arsip;
CREATE POLICY "surat_arsip_update_all" ON public.surat_arsip FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "surat_arsip_delete_all" ON public.surat_arsip;
CREATE POLICY "surat_arsip_delete_all" ON public.surat_arsip FOR DELETE USING (true);

-- ====================================================================
-- 7. STORAGE BUCKET: dokumen_organisasi
-- ====================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('dokumen_organisasi', 'dokumen_organisasi', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "dokumen_organisasi_public_select" ON storage.objects;
CREATE POLICY "dokumen_organisasi_public_select" ON storage.objects
    FOR SELECT USING (bucket_id = 'dokumen_organisasi');

DROP POLICY IF EXISTS "dokumen_organisasi_public_insert" ON storage.objects;
CREATE POLICY "dokumen_organisasi_public_insert" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'dokumen_organisasi');

-- ====================================================================
-- 8. DATA AWAL (SEED INITIAL DATA)
-- Sesuai tampilan persis referensi visual mockup HIMASI:
-- - Surat Keluar: 5 arsip (4 resmi 011-014, 1 draft)
-- - Surat Masuk: 3 arsip (1 belum didisposisi)
-- ====================================================================
INSERT INTO public.surat_arsip (
    id, jenis_surat, kode_jenis, nomor_urut, nomor_surat, perihal, kategori_label,
    tujuan_pengirim, tanggal_surat, tanggal_diterima, status, catatan_disposisi, file_name
) VALUES
-- Surat Keluar HIMASI
('b1111111-1111-4111-8111-111111111111', 'keluar', 'UND', NULL, '—', 'Permohonan Narasumber Seminar', 'Permohonan', '[NAMA NARASUMBER]', '2026-11-06', NULL, 'draft', NULL, NULL),
('b2222222-2222-4222-8222-222222222222', 'keluar', 'UND', 14, '014/UND/HIMASI/XI/2026', 'Undangan Rapat Pleno Pengurus', 'Undangan', 'Seluruh Pengurus', '2026-11-04', NULL, 'terkirim', NULL, 'Surat_Undangan_Pleno_014.pdf'),
('b3333333-3333-4333-8333-333333333333', 'keluar', 'PRM', 13, '013/PRM/HIMASI/X/2026', 'Peminjaman Ruang Aula', 'Peminjaman Ruang', 'Bagian Sarana Prasarana', '2026-10-30', NULL, 'menunggu_ttd', NULL, 'Peminjaman_Aula_013.pdf'),
('b4444444-4444-4444-8444-444444444444', 'keluar', 'PDN', 12, '012/PDN/HIMASI/X/2026', 'Permohonan Dana Delegasi Lomba', 'Permohonan Dana', 'Bagian Kemahasiswaan', '2026-10-28', NULL, 'menunggu_ttd', NULL, 'Pengajuan_Dana_Lomba_012.pdf'),
('b5555555-5555-4555-8555-555555555555', 'keluar', 'DSP', 11, '011/DSP/HIMASI/X/2026', 'Dispensasi Perkuliahan Peserta Kegiatan', 'Dispensasi', 'Kaprodi Sistem Informasi', '2026-10-21', NULL, 'terkirim', NULL, 'Dispensasi_Kuliah_011.pdf'),

-- Surat Masuk dari Instansi Luar
('c1111111-1111-4111-8111-111111111111', 'masuk', 'UND', NULL, '045/BEM-ISBAL/E/X/2026', 'Undangan Pembukaan Pekan Olahraga & Seni Mahasiswa', 'Undangan', 'Badan Eksekutif Mahasiswa (BEM) ISB Atma Luhur', '2026-10-29', '2026-10-30', 'didisposisi', 'Disposisi ke Departemen Olahraga & Seni untuk mengirim perwakilan 4 orang.', '045-BEM-ISBAL-E-X-2026.pdf'),
('c2222222-2222-4222-8222-222222222222', 'masuk', 'PBM', NULL, '112/LPPM-AL/PBM/XI/2026', 'Pemberitahuan Sosialisasi Program Kreativitas Mahasiswa (PKM) 2027', 'Pemberitahuan', 'Lembaga Penelitian & Pengabdian Masyarakat (LPPM)', '2026-11-03', '2026-11-04', 'belum_disposisi', NULL, '112-LPPM-AL-PBM-XI-2026.pdf'),
('c3333333-3333-4333-8333-333333333333', 'masuk', 'UND', NULL, '088/DPM-ISBAL/U/X/2026', 'Undangan Sidang Umum Mahasiswa & Laporan Triwulan', 'Undangan', 'Dewan Perwakilan Mahasiswa (DPM)', '2026-10-25', '2026-10-26', 'selesai', 'Dihadiri langsung oleh Ketua Umum dan Sekretaris 1.', '088-DPM-ISBAL-U-X-2026.pdf')
ON CONFLICT (id) DO NOTHING;
