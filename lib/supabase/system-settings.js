// System settings helpers for Maintenance Mode (503) and runtime controls

const DEFAULT_MAINTENANCE_STATE = {
  enabled: false,
  message: "Layanan HIMASI sedang diperbarui oleh administrator untuk peningkatan performa dan keamanan.",
  estimatedEnd: "~15-30 Menit",
};

/**
 * Safely parse maintenance payload from Supabase or localStorage
 * @param {unknown} data
 * @returns {{ enabled: boolean; message: string; estimatedEnd: string }}
 */
function parseMaintenancePayload(data) {
  if (!data) {
    return { ...DEFAULT_MAINTENANCE_STATE };
  }

  let parsed = data;
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
  };
}

/**
 * Get static fallback state when offline or disconnected
 */
function getMaintenanceFallback() {
  return { ...DEFAULT_MAINTENANCE_STATE };
}

/**
 * Get maintenance mode status from local storage and/or cookie
 */
function getClientMaintenanceMode() {
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
 * @param {boolean} enabled
 * @param {string} [message]
 * @param {string} [estimatedEnd]
 */
function saveClientMaintenanceMode(enabled, message, estimatedEnd) {
  if (typeof window === "undefined") return;

  const payload = {
    enabled,
    message: message || DEFAULT_MAINTENANCE_STATE.message,
    estimatedEnd: estimatedEnd || DEFAULT_MAINTENANCE_STATE.estimatedEnd,
    updatedAt: new Date().toISOString(),
  };

  try {
    window.localStorage.setItem("himasi_maintenance_mode", JSON.stringify(payload));
    // Also set document cookie for 30 days
    document.cookie = `himasi_maintenance_mode=${enabled ? "true" : "false"}; path=/; max-age=2592000; SameSite=Lax`;
  } catch (err) {
    console.error("Failed to persist client maintenance mode:", err);
  }

  return payload;
}

module.exports = {
  DEFAULT_MAINTENANCE_STATE,
  parseMaintenancePayload,
  getMaintenanceFallback,
  getClientMaintenanceMode,
  saveClientMaintenanceMode,
};

