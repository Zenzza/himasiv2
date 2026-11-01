// Configuration dictionary for HIMASI Error Pages (404, 403, 500, 503, 401, 429)

export interface ErrorAction {
  label: string;
  href?: string;
  actionType?: 'link' | 'reset' | 'reload' | 'back';
}

export interface ErrorPageConfig {
  code: string;
  badge?: string;
  title: string;
  description: string;
  primaryAction: ErrorAction;
  secondaryAction?: ErrorAction;
  showIncidentId?: boolean;
  showCountdown?: boolean;
  countdownSeconds?: number;
}

export const ERROR_CONFIGS: Record<string, ErrorPageConfig> = {
  "404": {
    code: "404",
    title: "Halaman Tidak Ditemukan",
    description: "Maaf, halaman yang Anda tuju tidak tersedia, telah dipindahkan, atau tautan yang dimasukkan keliru.",
    primaryAction: {
      label: "Kembali ke Beranda",
      href: "/",
      actionType: "link",
    },
    secondaryAction: {
      label: "Kembali ke Halaman Sebelumnya",
      actionType: "back",
    },
  },
  "403": {
    code: "403",
    badge: "Akses Dibatasi",
    title: "Akses Tidak Diizinkan",
    description: "Akun Anda tidak memiliki hak akses untuk membuka modul atau menu ini. Silakan hubungi BPH atau Super Admin jika Anda memerlukan akses.",
    primaryAction: {
      label: "Kembali ke Dashboard",
      href: "/dashboard",
      actionType: "link",
    },
    secondaryAction: {
      label: "Ke Halaman Beranda",
      href: "/",
      actionType: "link",
    },
  },
  "500": {
    code: "500",
    badge: "Kesalahan Sistem",
    title: "Terjadi Gangguan Server",
    description: "Sistem mengalami kendala tak terduga saat memproses permintaan Anda. Divisi MEDKOMINFO HIMASI telah mencatat insiden ini untuk penanganan segera.",
    showIncidentId: true,
    primaryAction: {
      label: "Coba Muat Ulang",
      actionType: "reset",
    },
    secondaryAction: {
      label: "Hubungi Tim IT HIMASI",
      href: "mailto:himasi@atmaluhur.ac.id",
      actionType: "link",
    },
  },
  "503": {
    code: "503",
    badge: "Mode Pemeliharaan Aktif",
    title: "Sistem Sedang Dalam Pemeliharaan",
    description: "Layanan HIMASI sedang diperbarui oleh administrator untuk peningkatan performa dan keamanan. Sistem diperkirakan dapat diakses kembali dalam waktu singkat.",
    primaryAction: {
      label: "Periksa Status",
      actionType: "reload",
    },
    secondaryAction: {
      label: "Masuk Sebagai Pengurus",
      href: "/login",
      actionType: "link",
    },
  },
  "401": {
    code: "401",
    badge: "Autentikasi Kedaluwarsa",
    title: "Sesi Anda Telah Berakhir",
    description: "Masa aktif sesi masuk Anda telah selesai demi alasan keamanan. Silakan login kembali untuk melanjutkan pekerjaan Anda di sistem HIMASI.",
    primaryAction: {
      label: "Masuk Kembali",
      href: "/login",
      actionType: "link",
    },
    secondaryAction: {
      label: "Ke Halaman Beranda",
      href: "/",
      actionType: "link",
    },
  },
  "429": {
    code: "429",
    badge: "Batas Frekuensi",
    title: "Terlalu Banyak Permintaan",
    description: "Sistem mendeteksi aktivitas pengiriman formulir atau upaya login yang terlalu sering. Silakan tunggu beberapa saat sebelum mencoba kembali.",
    showCountdown: true,
    countdownSeconds: 60,
    primaryAction: {
      label: "Tunggu & Coba Lagi",
      actionType: "reload",
    },
    secondaryAction: {
      label: "Kembali ke Beranda",
      href: "/",
      actionType: "link",
    },
  },
};

/**
 * Get error page configuration by HTTP status code, falling back to 404 for unknown codes
 */
export function getErrorConfig(code?: string): ErrorPageConfig {
  if (!code || !ERROR_CONFIGS[code]) {
    return ERROR_CONFIGS["404"];
  }
  return ERROR_CONFIGS[code];
}

/**
 * Generate a randomized incident tracking ID (e.g. ERR-A8C3D2)
 */
export function generateIncidentId(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let hash = "";
  for (let i = 0; i < 6; i++) {
    hash += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `ERR-${hash}`;
}

/**
 * Sanitize user redirect parameter to prevent open redirect vulnerabilities
 */
export function sanitizeRedirectUrl(target?: string | null): string | null {
  if (!target || typeof target !== "string") return null;
  const trimmed = target.trim();
  if (trimmed.startsWith("/") && !trimmed.startsWith("//") && !trimmed.startsWith("/\\")) {
    return trimmed;
  }
  return null;
}
