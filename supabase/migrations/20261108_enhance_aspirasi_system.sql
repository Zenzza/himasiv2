-- 1. Tambah kolom nomor_tiket dan tanggapan admin jika belum ada
ALTER TABLE public.aspirasi 
ADD COLUMN IF NOT EXISTS nomor_tiket VARCHAR(30),
ADD COLUMN IF NOT EXISTS jawaban_admin TEXT,
ADD COLUMN IF NOT EXISTS dijawab_pada TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS dijawab_oleh TEXT,
ADD COLUMN IF NOT EXISTS status_email VARCHAR(30) NOT NULL DEFAULT 'belum_dikirim'
CHECK (status_email IN ('belum_dikirim', 'pending', 'simulasi_terkirim', 'terkirim', 'gagal'));

-- 2. Migrasi data historis: Salin catatan_pengurus ke jawaban_admin jika ada
UPDATE public.aspirasi 
SET jawaban_admin = catatan_pengurus 
WHERE jawaban_admin IS NULL AND catatan_pengurus IS NOT NULL;

-- 3. Isi nomor_tiket untuk data yang sudah ada sebelumnya
UPDATE public.aspirasi 
SET nomor_tiket = 'ASP-' || TO_CHAR(created_at, 'YYYY') || '-' || LPAD(FLOOR(RANDOM() * 9000 + 1000)::text, 4, '0')
WHERE nomor_tiket IS NULL;

-- 4. Fungsi & Trigger Otomatisasi Pembuatan nomor_tiket unik di Database
CREATE OR REPLACE FUNCTION public.set_aspirasi_nomor_tiket()
RETURNS TRIGGER AS $$
DECLARE
    tahun_str TEXT;
    random_num TEXT;
    candidate_ticket TEXT;
    exists_count INT;
    attempts INT := 0;
BEGIN
    IF NEW.nomor_tiket IS NULL OR NEW.nomor_tiket = '' THEN
        tahun_str := TO_CHAR(COALESCE(NEW.created_at, NOW()), 'YYYY');
        LOOP
            attempts := attempts + 1;
            IF attempts > 100 THEN
                RAISE EXCEPTION 'Gagal membuat nomor tiket unik untuk aspirasi setelah 100 percobaan';
            END IF;

            random_num := LPAD(FLOOR(RANDOM() * 9000 + 1000)::text, 4, '0');
            candidate_ticket := 'ASP-' || tahun_str || '-' || random_num;
            SELECT COUNT(*) INTO exists_count FROM public.aspirasi WHERE nomor_tiket = candidate_ticket;
            IF exists_count = 0 THEN
                NEW.nomor_tiket := candidate_ticket;
                EXIT;
            END IF;
        END LOOP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_aspirasi_nomor_tiket ON public.aspirasi;
CREATE TRIGGER trg_set_aspirasi_nomor_tiket
BEFORE INSERT ON public.aspirasi
FOR EACH ROW
EXECUTE FUNCTION public.set_aspirasi_nomor_tiket();

-- 5. Berikan constraint NOT NULL dan UNIQUE pada nomor_tiket
ALTER TABLE public.aspirasi 
ALTER COLUMN nomor_tiket SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_aspirasi_nomor_tiket ON public.aspirasi(nomor_tiket);
CREATE INDEX IF NOT EXISTS idx_aspirasi_status ON public.aspirasi(status);
