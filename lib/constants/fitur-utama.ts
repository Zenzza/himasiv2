import { supabase } from "@/lib/supabase/client";

export interface FiturItemConfig {
  id: "recruitment" | "order-baju" | "informasi" | "apresiasi" | string;
  title: string;
  href: string;
  iconName: "UserPlus" | "Shirt" | "Trophy" | "Award" | string;
  isOpen: boolean;
  statusOpenText: string;
  statusClosedText: string;
  lockWhenClosed?: boolean;
  urutan?: number;
}

export interface FiturUtamaSectionConfig {
  showSection: boolean;
  items: FiturItemConfig[];
}

export const DEFAULT_FITUR_UTAMA: FiturUtamaSectionConfig = {
  showSection: true,
  items: [
    {
      id: "recruitment",
      title: "Recruitment HIMASI",
      href: "/oprec",
      iconName: "UserPlus",
      isOpen: false,
      statusOpenText: "Lihat Selengkapnya",
      statusClosedText: "Coming Soon",
      lockWhenClosed: true,
      urutan: 1,
    },
    {
      id: "order-baju",
      title: "Order Baju Jurusan",
      href: "/order-baju",
      iconName: "Shirt",
      isOpen: false,
      statusOpenText: "Lihat Selengkapnya",
      statusClosedText: "Coming Soon",
      lockWhenClosed: true,
      urutan: 2,
    },
    {
      id: "informasi",
      title: "Pusat Informasi",
      href: "/prestasi",
      iconName: "Trophy",
      isOpen: false,
      statusOpenText: "Lihat Selengkapnya",
      statusClosedText: "Coming Soon",
      lockWhenClosed: true,
      urutan: 3,
    },
    {
      id: "apresiasi",
      title: "Apresia-SI",
      href: "/apresiasi",
      iconName: "Award",
      isOpen: true,
      statusOpenText: "Lihat Selengkapnya",
      statusClosedText: "Coming Soon",
      lockWhenClosed: false,
      urutan: 4,
    },
  ],
};

export const FITUR_UTAMA_STORAGE_KEY = "himasi_fitur_utama_config";
export const FITUR_UTAMA_UPDATE_EVENT = "himasi:fitur-utama-updated";

/**
 * Mendapatkan konfigurasi Fitur Utama dari localStorage atau default
 */
export function getFiturUtamaConfig(): FiturUtamaSectionConfig {
  if (typeof window === "undefined") {
    return DEFAULT_FITUR_UTAMA;
  }

  try {
    const raw = localStorage.getItem(FITUR_UTAMA_STORAGE_KEY);
    if (!raw) return DEFAULT_FITUR_UTAMA;
    const parsed = JSON.parse(raw);

    if (!parsed || !Array.isArray(parsed.items)) {
      return DEFAULT_FITUR_UTAMA;
    }

    // Merge dengan default agar item baru tetap ada jika ada update skema
    const mergedItems = DEFAULT_FITUR_UTAMA.items.map((defItem) => {
      const found = parsed.items.find((p: FiturItemConfig) => p.id === defItem.id);
      if (!found) return defItem;
      return {
        ...defItem,
        ...found,
        isOpen: typeof found.isOpen === "boolean" ? found.isOpen : defItem.isOpen,
        statusOpenText: found.statusOpenText || defItem.statusOpenText,
        statusClosedText: found.statusClosedText || defItem.statusClosedText,
        lockWhenClosed: typeof found.lockWhenClosed === "boolean" ? found.lockWhenClosed : defItem.lockWhenClosed,
      };
    });

    return {
      showSection: typeof parsed.showSection === "boolean" ? parsed.showSection : DEFAULT_FITUR_UTAMA.showSection,
      items: mergedItems,
    };
  } catch (err) {
    console.warn("Gagal memuat konfigurasi Fitur Utama, menggunakan default:", err);
    return DEFAULT_FITUR_UTAMA;
  }
}

/**
 * Menyimpan konfigurasi Fitur Utama ke localStorage & menyiarkan custom event
 */
export function saveFiturUtamaConfig(config: Partial<FiturUtamaSectionConfig>): FiturUtamaSectionConfig {
  const current = getFiturUtamaConfig();
  const updated: FiturUtamaSectionConfig = {
    ...current,
    ...config,
    items: config.items ? config.items : current.items,
  };

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(FITUR_UTAMA_STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent(FITUR_UTAMA_UPDATE_EVENT, { detail: updated }));
    } catch (err) {
      console.error("Gagal menyimpan konfigurasi Fitur Utama ke localStorage:", err);
    }
  }

  // Coba sinkronkan ke Supabase jika tabel 'fitur_utama' sudah dibuat
  syncFiturUtamaToSupabase(updated).catch(() => {});

  return updated;
}

/**
 * Mereset konfigurasi Fitur Utama ke nilai default
 */
export function resetFiturUtamaConfig(): FiturUtamaSectionConfig {
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem(FITUR_UTAMA_STORAGE_KEY);
      window.dispatchEvent(new CustomEvent(FITUR_UTAMA_UPDATE_EVENT, { detail: DEFAULT_FITUR_UTAMA }));
    } catch (err) {
      console.error("Gagal mereset konfigurasi Fitur Utama:", err);
    }
  }
  return DEFAULT_FITUR_UTAMA;
}

/**
 * Mengambil data Fitur Utama dari Supabase Cloud (fallback ke localStorage)
 */
export async function fetchFiturUtamaFromSupabase(): Promise<FiturUtamaSectionConfig> {
  try {
    const { data, error } = await supabase
      .from("fitur_utama")
      .select("*")
      .order("urutan", { ascending: true });

    if (!error && data && data.length > 0) {
      const items: FiturItemConfig[] = data.map((row: any) => ({
        id: row.id,
        title: row.title || "",
        href: row.href || "",
        iconName: row.icon_name || "Award",
        isOpen: Boolean(row.is_open),
        statusOpenText: row.status_open_text || "Lihat Selengkapnya",
        statusClosedText: row.status_closed_text || "Coming Soon",
        lockWhenClosed: row.lock_when_closed !== false,
        urutan: row.urutan != null ? Number(row.urutan) : 0,
      }));

      const config: FiturUtamaSectionConfig = {
        showSection: true,
        items,
      };

      // Simpan cache ke localStorage
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(FITUR_UTAMA_STORAGE_KEY, JSON.stringify(config));
          window.dispatchEvent(new CustomEvent(FITUR_UTAMA_UPDATE_EVENT, { detail: config }));
        } catch {}
      }

      return config;
    }
  } catch (err) {
    console.info("Info: Supabase tabel fitur_utama offline/belum dibuat, memakai cache lokal:", err);
  }

  return getFiturUtamaConfig();
}

/**
 * Sinkronisasi konfigurasi ke tabel Supabase (jika tabel tersedia)
 */
export async function syncFiturUtamaToSupabase(config: FiturUtamaSectionConfig): Promise<boolean> {
  try {
    const payload = config.items.map((item, idx) => ({
      id: item.id,
      title: item.title,
      href: item.href,
      is_open: item.isOpen,
      status_open_text: item.statusOpenText,
      status_closed_text: item.statusClosedText,
      lock_when_closed: item.lockWhenClosed !== false,
      urutan: item.urutan ?? idx + 1,
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabase.from("fitur_utama").upsert(payload, { onConflict: "id" });
    if (!error) return true;
  } catch {
    // Abaikan jika tabel belum ada di database Supabase
  }
  return false;
}

