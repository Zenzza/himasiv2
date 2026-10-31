/**
 * Mengubah string judul menjadi format slug URL ramah SEO.
 * Contoh: "Pelantikan Serentak Pengurus 2026!" -> "pelantikan-serentak-pengurus-2026"
 */
export function slugify(text: string): string {
  if (!text) return "";
  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize("NFD") // Pisahkan karakter aksen jika ada
    .replace(/[\u0300-\u036f]/g, "") // Hapus tanda aksen
    .replace(/[^a-z0-9\s-]/g, "") // Hapus karakter non-alfanumerik kecuali spasi dan strip
    .replace(/[\s_]+/g, "-") // Ganti spasi atau underscore menjadi tanda hubung tunggal
    .replace(/-+/g, "-") // Ganti multiple tanda hubung menjadi satu
    .replace(/^-+|-+$/g, ""); // Hapus tanda hubung di awal atau akhir
}

/**
 * Menghitung estimasi waktu membaca berdasarkan jumlah kata dalam teks.
 * Rata-rata kecepatan membaca adalah ~200 kata per menit.
 */
export function estimateReadTime(text: string): string {
  if (!text) return "1 min read";
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} min read`;
}

/**
 * Format tanggal ramah bahasa Indonesia.
 * Menangani string ISO ("2026-07-30T..."), tanggal pendek ("2026-07-30"), atau fallback string ("30 July 2026").
 */
export function formatBeritaDate(dateStr?: string): string {
  if (!dateStr) return "30 Juli 2026";
  try {
    // Jika formatnya sudah teks seperti "30 July 2026" atau "30 Juli 2026"
    if (/^[0-9]{1,2}\s+[a-zA-Z]+\s+[0-9]{4}$/.test(dateStr.trim())) {
      return dateStr;
    }
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    }
    return dateStr;
  } catch {
    return dateStr;
  }
}

