/**
 * Utilitas Penomoran Surat & Angka Romawi HIMASI ISB Atma Luhur
 * Format Baku Organisasi: [urut 3-digit]/HIMASI/[kode jenis]/ISB-AL/[bulan romawi]/[tahun]
 * Contoh: 014/HIMASI/UND/ISB-AL/XI/2026
 */

const ROMAWI_BULAN: readonly string[] = [
  "",
  "I",
  "II",
  "III",
  "IV",
  "V",
  "VI",
  "VII",
  "VIII",
  "IX",
  "X",
  "XI",
  "XII",
];

/**
 * Mengonversi angka bulan (1-12) menjadi format angka Romawi baku (I s.d. XII).
 * Jika angka di luar rentang 1-12, mengembalikan fallback yang aman.
 */
export function angkaKeRomawi(bulan: number): string {
  const index = Math.floor(bulan);
  if (index >= 1 && index <= 12) {
    return ROMAWI_BULAN[index];
  }
  return "I";
}

/**
 * Mengekstrak bulan (1-12), tahun (4-digit), dan representasi Romawi dari tanggal
 * secara aman dari pergeseran zona waktu.
 */
export function parseBulanTahun(tanggal: Date | string): {
  bulan: number;
  tahun: number;
  bulanRomawi: string;
} {
  let tahun: number;
  let bulan: number;

  if (typeof tanggal === "string") {
    // Tangani format YYYY-MM-DD atau YYYY-MM langsung tanpa zona waktu
    const match = tanggal.match(/^(\d{4})-(\d{2})(?:-(\d{2}))?/);
    if (match) {
      tahun = parseInt(match[1], 10);
      bulan = parseInt(match[2], 10);
    } else {
      const d = new Date(tanggal);
      if (isNaN(d.getTime())) {
        const now = new Date();
        tahun = now.getFullYear();
        bulan = now.getMonth() + 1;
      } else {
        tahun = d.getFullYear();
        bulan = d.getMonth() + 1;
      }
    }
  } else if (tanggal instanceof Date && !isNaN(tanggal.getTime())) {
    tahun = tanggal.getFullYear();
    bulan = tanggal.getMonth() + 1;
  } else {
    const now = new Date();
    tahun = now.getFullYear();
    bulan = now.getMonth() + 1;
  }

  // Normalisasi batasan bulan 1 s.d. 12
  if (bulan < 1 || bulan > 12) {
    bulan = Math.min(Math.max(1, bulan), 12);
  }

  return {
    bulan,
    tahun,
    bulanRomawi: angkaKeRomawi(bulan),
  };
}

/**
 * Membentuk string nomor surat resmi HIMASI ISB Atma Luhur.
 * Formula: [nomor 3-digit]/[jenis]/HIMASI/[bulan romawi]/[tahun]
 * Contoh: generateNomorSurat(14, 'UND', '2026-11-04') => "014/UND/HIMASI/XI/2026"
 */
export function generateNomorSurat(
  urut: number,
  kodeJenis: string,
  tanggal: Date | string
): string {
  const safeUrut = (!urut || isNaN(urut) || urut < 1) ? 1 : Math.floor(urut);
  const paddedUrut = String(safeUrut).padStart(3, "0");
  const cleanKode = (kodeJenis || "UND").trim().toUpperCase();
  const { tahun, bulanRomawi } = parseBulanTahun(tanggal);

  return `${paddedUrut}/${cleanKode}/HIMASI/${bulanRomawi}/${tahun}`;
}

/**
 * Mengekstrak angka urut dari string nomor surat.
 * Mendukung format baru: "[nomor]/[jenis]/HIMASI/..." (misal: "014/UND/HIMASI/XI/2026")
 * serta format lama: "[nomor]/HIMASI/..." atau angka murni.
 *
 * Contoh:
 *   "014/UND/HIMASI/XI/2026"        => 14
 *   "014/HIMASI/UND/ISB-AL/XI/2026" => 14
 *   "001/DSP/HIMASI/I/2026"         => 1
 *   "045/BEM-ISBAL/E/X/2026"        => null (Surat masuk eksternal)
 *   "—" atau "draft" atau ""        => null
 */
export function parseNomorUrut(nomorSurat?: string | null): number | null {
  if (!nomorSurat || typeof nomorSurat !== "string") {
    return null;
  }

  const trimmed = nomorSurat.trim();
  if (!trimmed || trimmed === "—" || trimmed === "-" || trimmed.toLowerCase() === "draft") {
    return null;
  }

  // Mencocokkan format baru: "014/UND/HIMASI/..."
  const newFormatMatch = trimmed.match(/^(\d+)\/[A-Z0-9-]+\/HIMASI\//i);
  if (newFormatMatch) {
    const parsed = parseInt(newFormatMatch[1], 10);
    return isNaN(parsed) ? null : parsed;
  }

  // Mencocokkan format terdahulu: "014/HIMASI/..."
  const himasiMatch = trimmed.match(/^(\d+)\/HIMASI\//i);
  if (himasiMatch) {
    const parsed = parseInt(himasiMatch[1], 10);
    return isNaN(parsed) ? null : parsed;
  }

  // Fallback jika berupa angka murni urut
  const numericOnlyMatch = trimmed.match(/^(\d+)$/);
  if (numericOnlyMatch) {
    const parsed = parseInt(numericOnlyMatch[1], 10);
    return isNaN(parsed) ? null : parsed;
  }

  return null;
}

/**
 * Format tanggal Indonesia ringkas untuk tabel persuratan (misal: "04 Nov 2026").
 */
export function formatTanggalSurat(tanggal?: string | Date | null): string {
  if (!tanggal) return "—";

  try {
    const { bulan, tahun } = parseBulanTahun(tanggal);
    let hari = 1;

    if (typeof tanggal === "string") {
      const dayMatch = tanggal.match(/^\d{4}-\d{2}-(\d{2})/);
      if (dayMatch) {
        hari = parseInt(dayMatch[1], 10);
      } else {
        const d = new Date(tanggal);
        if (!isNaN(d.getTime())) {
          hari = d.getDate();
        }
      }
    } else if (tanggal instanceof Date && !isNaN(tanggal.getTime())) {
      hari = tanggal.getDate();
    }

    const namaBulanSingkat = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "Mei",
      "Jun",
      "Jul",
      "Agu",
      "Sep",
      "Okt",
      "Nov",
      "Des",
    ];

    const paddedHari = String(hari).padStart(2, "0");
    const bulanStr = namaBulanSingkat[bulan - 1] || "Jan";

    return `${paddedHari} ${bulanStr} ${tahun}`;
  } catch {
    return String(tanggal);
  }
}
