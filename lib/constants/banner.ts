export interface HeroBannerConfig {
  desktopImage: string;
  mobileImage: string;
  desktopPosition?: string;
  mobilePosition?: string;
  alt?: string;
}

export const DEFAULT_HERO_BANNER: HeroBannerConfig = {
  desktopImage: "/hero-banner.png",
  mobileImage: "/hero-banner-mobile.png",
  desktopPosition: "object-[center_65%]",
  mobilePosition: "object-center",
  alt: "Hero Banner HIMASI ISB Atma Luhur - Kabinet REKSABUDAYA",
};

export const BANNER_STORAGE_KEY = "himasi_hero_banner_config";
export const BANNER_UPDATE_EVENT = "himasi:banner-updated";

/**
 * Mendapatkan konfigurasi hero banner saat ini (dari localStorage atau default)
 */
export function getHeroBannerConfig(): HeroBannerConfig {
  if (typeof window === "undefined") {
    return DEFAULT_HERO_BANNER;
  }

  try {
    const raw = localStorage.getItem(BANNER_STORAGE_KEY);
    if (!raw) return DEFAULT_HERO_BANNER;
    const parsed = JSON.parse(raw);
    return {
      desktopImage: parsed.desktopImage || DEFAULT_HERO_BANNER.desktopImage,
      mobileImage: parsed.mobileImage || DEFAULT_HERO_BANNER.mobileImage,
      desktopPosition: parsed.desktopPosition || DEFAULT_HERO_BANNER.desktopPosition,
      mobilePosition: parsed.mobilePosition || DEFAULT_HERO_BANNER.mobilePosition,
      alt: parsed.alt || DEFAULT_HERO_BANNER.alt,
    };
  } catch (err) {
    console.warn("Gagal memuat konfigurasi hero banner, menggunakan default:", err);
    return DEFAULT_HERO_BANNER;
  }
}

/**
 * Menyimpan konfigurasi hero banner ke localStorage & menyiarkan pembaruan realtime
 */
export function saveHeroBannerConfig(config: Partial<HeroBannerConfig>): HeroBannerConfig {
  const current = getHeroBannerConfig();
  const updated: HeroBannerConfig = {
    ...current,
    ...config,
  };

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(BANNER_STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent(BANNER_UPDATE_EVENT, { detail: updated }));
    } catch (err) {
      console.error("Gagal menyimpan konfigurasi hero banner:", err);
    }
  }

  return updated;
}

/**
 * Mereset konfigurasi hero banner ke konfigurasi bawaan
 */
export function resetHeroBannerConfig(): HeroBannerConfig {
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem(BANNER_STORAGE_KEY);
      window.dispatchEvent(new CustomEvent(BANNER_UPDATE_EVENT, { detail: DEFAULT_HERO_BANNER }));
    } catch (err) {
      console.error("Gagal mereset konfigurasi hero banner:", err);
    }
  }
  return DEFAULT_HERO_BANNER;
}

