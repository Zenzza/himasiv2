import QRCode from "qrcode";

export interface QrOptions {
  width?: number;
  margin?: number;
  darkColor?: string;
  lightColor?: string;
}

export const HIMASI_BRAND_NAVY = "#00296E";
export const HIMASI_BRAND_WHITE = "#FFFFFF";

export const RESERVED_SLUGS: readonly string[] = [
  "dashboard",
  "admin",
  "login",
  "logout",
  "register",
  "berita",
  "profil",
  "kalender",
  "informasi",
  "apresiasi",
  "prestasi",
  "tentang",
  "oprec",
  "order-baju",
  "api",
  "s",
  "auth",
  "static",
  "favicon.ico",
  "robots.txt",
  "sitemap.xml",
] as const;

/**
 * Membersihkan string input menjadi format slug yang valid dan ramah URL.
 * Contoh: "Makrab TI & SI 2026!" -> "makrab-ti-si-2026"
 */
export function sanitizeSlug(rawSlug: string): string {
  if (!rawSlug) return "";

  return rawSlug
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Hapus karakter non-alfanumerik kecuali strip & spasi
    .replace(/\s+/g, "-") // Ganti spasi dengan tanda strip
    .replace(/_+/g, "") // Hapus underscore jika ada
    .replace(/-+/g, "-") // Gabungkan strip ganda
    .replace(/^-+|-+$/g, ""); // Pangkas strip di awal dan akhir
}

/**
 * Memeriksa apakah slug bertabrakan dengan rute internal aplikasi
 */
export function isReservedSlug(slug: string): boolean {
  const clean = sanitizeSlug(slug);
  return RESERVED_SLUGS.includes(clean);
}

/**
 * Validasi form shortlink sebelum disimpan
 */
export function validateShortLinkInput(
  title: string,
  slug: string,
  originalUrl: string
): { isValid: boolean; error?: string } {
  if (!title || !title.trim()) {
    return { isValid: false, error: "Judul kegiatan/tautan wajib diisi." };
  }

  const cleanSlug = sanitizeSlug(slug);
  if (!cleanSlug || cleanSlug.length < 2) {
    return { isValid: false, error: "Slug tautan minimal harus terdiri dari 2 karakter alfanumerik." };
  }

  if (cleanSlug.length > 100) {
    return { isValid: false, error: "Slug tautan maksimal 100 karakter." };
  }

  if (isReservedSlug(cleanSlug)) {
    return { isValid: false, error: `Slug "${cleanSlug}" adalah kata kunci sistem terproteksi dan tidak dapat digunakan.` };
  }

  if (!originalUrl || !originalUrl.trim()) {
    return { isValid: false, error: "URL tujuan asli wajib diisi." };
  }

  let formattedUrl = originalUrl.trim();
  if (!formattedUrl.startsWith("http://") && !formattedUrl.startsWith("https://")) {
    formattedUrl = `https://${formattedUrl}`;
  }

  try {
    const parsed = new URL(formattedUrl);
    if (!parsed.hostname || !parsed.hostname.includes(".") || parsed.hostname.length < 4) {
      return { isValid: false, error: "Format URL tujuan tidak valid. Pastikan menyertakan domain lengkap (misal: https://contoh.com)." };
    }
  } catch {
    return { isValid: false, error: "Format URL tujuan tidak valid. Pastikan menyertakan domain lengkap." };
  }

  return { isValid: true };
}

/**
 * Menghasilkan Data URL gambar QR Code berformat PNG resolusi tinggi (default: 1000px)
 */
export async function generateQrDataUrl(url: string, options?: QrOptions): Promise<string> {
  const width = options?.width || 1000;
  const margin = options?.margin !== undefined ? options?.margin : 2;
  const darkColor = options?.darkColor || HIMASI_BRAND_NAVY;
  const lightColor = options?.lightColor || HIMASI_BRAND_WHITE;

  return QRCode.toDataURL(url, {
    width,
    margin,
    color: {
      dark: darkColor,
      light: lightColor,
    },
    errorCorrectionLevel: "H",
  });
}

/**
 * Menghasilkan markup SVG vektor untuk kebutuhan cetak resolusi tinggi / percetakan
 */
export async function generateQrSvg(url: string, options?: QrOptions): Promise<string> {
  const margin = options?.margin !== undefined ? options?.margin : 2;
  const darkColor = options?.darkColor || HIMASI_BRAND_NAVY;
  const lightColor = options?.lightColor || HIMASI_BRAND_WHITE;

  return QRCode.toString(url, {
    type: "svg",
    margin,
    color: {
      dark: darkColor,
      light: lightColor,
    },
    errorCorrectionLevel: "H",
  });
}
