import { supabase } from "./client";

export interface MaintenanceSettings {
  enabled: boolean;
  message: string;
  estimatedEnd: string;
  updatedAt?: string;
}

export const DEFAULT_MAINTENANCE_STATE: MaintenanceSettings = {
  enabled: false,
  message: "Layanan HIMASI sedang diperbarui oleh administrator untuk peningkatan performa dan keamanan.",
  estimatedEnd: "~15-30 Menit",
};

/**
 * Safely parse maintenance payload from Supabase or localStorage
 */
export function parseMaintenancePayload(data: unknown): MaintenanceSettings {
  if (!data) {
    return { ...DEFAULT_MAINTENANCE_STATE };
  }

  let parsed: any = data;
  if (typeof data === "string") {
    try {
      parsed = JSON.parse(data);
    } catch {
      return { ...DEFAULT_MAINTENANCE_STATE };
    }
  }

  if (typeof parsed !== "object" || parsed === null) {
    return { ...DEFAULT_MAINTENANCE_STATE };
  }

  return {
    enabled: Boolean(parsed.enabled),
    message: typeof parsed.message === "string" && parsed.message.trim() ? parsed.message : DEFAULT_MAINTENANCE_STATE.message,
    estimatedEnd: typeof parsed.estimatedEnd === "string" && parsed.estimatedEnd.trim() ? parsed.estimatedEnd : DEFAULT_MAINTENANCE_STATE.estimatedEnd,
    updatedAt: parsed.updatedAt,
  };
}

/**
 * Get static fallback state when offline or disconnected
 */
export function getMaintenanceFallback(): MaintenanceSettings {
  return { ...DEFAULT_MAINTENANCE_STATE };
}

/**
 * Get maintenance mode status from local storage and/or cookie
 */
export function getClientMaintenanceMode(): MaintenanceSettings {
  if (typeof window === "undefined") {
    return getMaintenanceFallback();
  }
  try {
    const local = window.localStorage.getItem("himasi_maintenance_mode");
    if (local) {
      return parseMaintenancePayload(local);
    }
  } catch {
    // Ignore storage read errors
  }
  return getMaintenanceFallback();
}

/**
 * Save maintenance mode status to local storage and document cookie
 */
export function saveClientMaintenanceMode(
  enabled: boolean,
  message?: string,
  estimatedEnd?: string
): MaintenanceSettings {
  const payload: MaintenanceSettings = {
    enabled,
    message: message || DEFAULT_MAINTENANCE_STATE.message,
    estimatedEnd: estimatedEnd || DEFAULT_MAINTENANCE_STATE.estimatedEnd,
    updatedAt: new Date().toISOString(),
  };

  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem("himasi_maintenance_mode", JSON.stringify(payload));
      // Also set document cookie for 30 days
      document.cookie = `himasi_maintenance_mode=${enabled ? "true" : "false"}; path=/; max-age=2592000; SameSite=Lax`;
    } catch (err) {
      console.error("Failed to persist client maintenance mode:", err);
    }
  }

  return payload;
}

/**
 * Fetch maintenance mode status from Supabase (system_settings table) with client-side fallback
 */
export async function getMaintenanceMode(): Promise<MaintenanceSettings> {
  const fallback = getClientMaintenanceMode();
  try {
    const { data, error } = await supabase
      .from("system_settings")
      .select("value")
      .eq("key", "maintenance_mode")
      .maybeSingle();

    if (!error && data?.value) {
      const parsed = parseMaintenancePayload(data.value);
      if (typeof window !== "undefined") {
        saveClientMaintenanceMode(parsed.enabled, parsed.message, parsed.estimatedEnd);
      }
      return parsed;
    }
  } catch (err) {
    console.warn("Could not load maintenance settings from Supabase, using fallback:", err);
  }

  return fallback;
}

/**
 * Update maintenance mode status in Supabase and client storage
 */
export async function setMaintenanceMode(
  enabled: boolean,
  message?: string,
  estimatedEnd?: string
): Promise<MaintenanceSettings> {
  const payload = saveClientMaintenanceMode(enabled, message, estimatedEnd);

  try {
    await supabase.from("system_settings").upsert(
      {
        key: "maintenance_mode",
        value: payload,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "key" }
    );
  } catch (err) {
    console.warn("Could not sync maintenance settings to Supabase:", err);
  }

  return payload;
}
