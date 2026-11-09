/**
 * Service Layer & Ketahanan Dual-Path Audit Log Aktivitas
 * HIMASI ISB Atma Luhur
 * 
 * Sesuai Dokumen Spesifikasi: docs/superpowers/specs/2026-11-09-audit-log-aktivitas-design.md
 * dan Task 2 Brief: .superpowers/audit-log/task-2-brief.md
 */

import { supabase } from "@/lib/supabase/client";
import type {
  AuditLogItem,
  AuditLogFilter,
} from "@/lib/types/audit-log";
import { DEFAULT_AUDIT_LOGS } from "@/lib/types/audit-log";

export const STORAGE_KEY_AUDIT_LOGS = "himasiv2_audit_logs";
export const MAX_LOCAL_LOGS = 100;

// In-memory cache untuk fallback runtime Node.js / SSR
let inMemoryLogs: AuditLogItem[] = [...DEFAULT_AUDIT_LOGS];

/**
 * Pengecekan apakah kredensial Supabase sudah terkonfigurasi dengan benar
 */
export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !anonKey) return false;
  if (url.includes("placeholder") || anonKey.includes("placeholder")) return false;
  return true;
}

/**
 * Pengecekan ketersediaan lingkungan browser untuk safe SSR
 */
function isBrowser(): boolean {
  try {
    return (
      typeof window !== "undefined" &&
      typeof window.localStorage !== "undefined" &&
      window.localStorage !== null
    );
  } catch {
    return false;
  }
}

/**
 * Helper pembuat UUID v4 yang aman di browser maupun Node.js runtime
 */
function generateUUID(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Menyimpan data log ke in-memory cache dan localStorage jika di lingkungan browser
 */
function saveLocalAuditLogs(logs: AuditLogItem[]): void {
  const capped = logs.slice(0, MAX_LOCAL_LOGS);
  inMemoryLogs = capped;

  if (isBrowser()) {
    try {
      localStorage.setItem(STORAGE_KEY_AUDIT_LOGS, JSON.stringify(capped));
    } catch (err) {
      console.warn("[AuditLog] Gagal menyimpan log ke localStorage:", err);
    }
  }
}

/**
 * Mengambil array log dari localStorage (browser) atau in-memory cache (SSR/Node.js)
 * Jika kosong atau belum ada, secara otomatis menginisialisasi dengan DEFAULT_AUDIT_LOGS
 */
export function getLocalAuditLogs(): AuditLogItem[] {
  if (!isBrowser()) {
    if (!inMemoryLogs || inMemoryLogs.length === 0) {
      inMemoryLogs = [...DEFAULT_AUDIT_LOGS];
    }
    return [...inMemoryLogs];
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY_AUDIT_LOGS);
    if (!raw) {
      localStorage.setItem(
        STORAGE_KEY_AUDIT_LOGS,
        JSON.stringify(DEFAULT_AUDIT_LOGS)
      );
      inMemoryLogs = [...DEFAULT_AUDIT_LOGS];
      return [...DEFAULT_AUDIT_LOGS];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      inMemoryLogs = parsed;
      return parsed;
    }
    localStorage.setItem(
      STORAGE_KEY_AUDIT_LOGS,
      JSON.stringify(DEFAULT_AUDIT_LOGS)
    );
    inMemoryLogs = [...DEFAULT_AUDIT_LOGS];
    return [...DEFAULT_AUDIT_LOGS];
  } catch {
    return inMemoryLogs && inMemoryLogs.length > 0
      ? [...inMemoryLogs]
      : [...DEFAULT_AUDIT_LOGS];
  }
}

/**
 * Menghapus cache localStorage dan mengembalikan in-memory array ke default seeds
 */
export function clearLocalAuditLogs(): void {
  inMemoryLogs = [...DEFAULT_AUDIT_LOGS];
  if (isBrowser()) {
    try {
      localStorage.setItem(
        STORAGE_KEY_AUDIT_LOGS,
        JSON.stringify(DEFAULT_AUDIT_LOGS)
      );
    } catch {
      // Abaikan jika storage sedang tidak dapat diakses
    }
  }
}

/**
 * Filter pembantu untuk memfilter array AuditLogItem secara in-memory
 */
function filterLocalAuditLogs(
  logs: AuditLogItem[],
  filter?: AuditLogFilter
): AuditLogItem[] {
  let result = [...logs];

  if (filter?.modul && filter.modul !== "semua") {
    result = result.filter((item) => item.modul === filter.modul);
  }

  if (filter?.status && filter.status !== "semua") {
    result = result.filter((item) => item.status === filter.status);
  }

  if (filter?.startDate) {
    const startTime = new Date(filter.startDate).getTime();
    if (!isNaN(startTime)) {
      result = result.filter(
        (item) => new Date(item.created_at).getTime() >= startTime
      );
    }
  }

  if (filter?.endDate) {
    const endTime = new Date(filter.endDate).getTime();
    if (!isNaN(endTime)) {
      result = result.filter(
        (item) => new Date(item.created_at).getTime() <= endTime
      );
    }
  }

  if (filter?.search && filter.search.trim().length > 0) {
    const searchRaw = filter.search.toLowerCase().trim();
    const sanitized = filter.search
      .replace(/[%,(),\\.*+?^${}|[\]]/g, " ")
      .trim()
      .toLowerCase();

    result = result.filter((item) => {
      const pengurus = item.pengurus_nama.toLowerCase();
      const aksi = item.aksi.toLowerCase();
      const modul = item.modul.toLowerCase();
      const detail = (item.detail || "").toLowerCase();
      const role = (item.pengurus_role || "").toLowerCase();

      // Pencarian string langsung
      if (
        pengurus.includes(searchRaw) ||
        aksi.includes(searchRaw) ||
        modul.includes(searchRaw) ||
        detail.includes(searchRaw) ||
        role.includes(searchRaw)
      ) {
        return true;
      }

      // Pencarian string yang disanitasi
      if (
        sanitized.length > 0 &&
        (pengurus.includes(sanitized) ||
          aksi.includes(sanitized) ||
          modul.includes(sanitized) ||
          detail.includes(sanitized) ||
          role.includes(sanitized))
      ) {
        return true;
      }

      // Pencarian kata per kata
      const words = sanitized.split(/\s+/).filter(Boolean);
      if (
        words.length > 0 &&
        words.every(
          (w) =>
            pengurus.includes(w) ||
            aksi.includes(w) ||
            modul.includes(w) ||
            detail.includes(w) ||
            role.includes(w)
        )
      ) {
        return true;
      }

      return false;
    });
  }

  // Pengurutan terbalik berdasarkan timestamp (terbaru lebih dulu)
  result.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const limit = filter?.limit && filter.limit > 0 ? filter.limit : 100;
  return result.slice(0, limit);
}

/**
 * Mencatat entri audit log baru secara fail-safe dan non-blocking.
 * Tidak akan pernah melempar error unhandled ke modul pemanggil.
 *
 * @param entry Data log aktivitas tanpa id dan created_at
 * @returns AuditLogItem yang berhasil dibentuk dan disimpan
 */
export async function recordAuditLog(
  entry: Omit<AuditLogItem, "id" | "created_at">
): Promise<AuditLogItem> {
  const newItem: AuditLogItem = {
    id: generateUUID(),
    created_at: new Date().toISOString(),
    pengurus_id: entry.pengurus_id ?? null,
    pengurus_nama: entry.pengurus_nama,
    pengurus_role: entry.pengurus_role,
    modul: entry.modul,
    aksi: entry.aksi,
    status: entry.status || "berhasil",
    detail: entry.detail ?? null,
  };

  // 1. Simpan ke local cache secara sinkron & aman (fallback offline path)
  try {
    const existing = getLocalAuditLogs();
    const updated = [
      newItem,
      ...existing.filter((item) => item.id !== newItem.id),
    ].slice(0, MAX_LOCAL_LOGS);
    saveLocalAuditLogs(updated);
  } catch (err) {
    console.warn("[AuditLog] Gagal menyimpan log secara lokal:", err);
  }

  // 2. Simpan ke Supabase jika terkonfigurasi (online path)
  if (isSupabaseConfigured() && supabase) {
    try {
      const { error } = await supabase.from("audit_logs").insert([
        {
          id: newItem.id,
          created_at: newItem.created_at,
          pengurus_id: newItem.pengurus_id,
          pengurus_nama: newItem.pengurus_nama,
          pengurus_role: newItem.pengurus_role,
          modul: newItem.modul,
          aksi: newItem.aksi,
          status: newItem.status,
          detail: newItem.detail,
        },
      ]);
      if (error) {
        console.warn(
          "[AuditLog] Supabase insert warning (menggunakan fallback lokal):",
          error.message || error
        );
      }
    } catch (supabaseError) {
      console.warn(
        "[AuditLog] Gagal koneksi Supabase saat mencatat log:",
        supabaseError
      );
    }
  }

  return newItem;
}

/**
 * Mengambil daftar riwayat audit log dengan dukungan filter modul, status, pencarian, dan limit.
 * Melakukan fallback mulus ke local cache jika Supabase offline atau belum siap.
 *
 * @param filter Parameter penyaringan opsional
 * @returns Array entri AuditLogItem
 */
export async function getAuditLogs(
  filter?: AuditLogFilter
): Promise<AuditLogItem[]> {
  if (isSupabaseConfigured() && supabase) {
    try {
      let query = supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false });

      if (filter?.modul && filter.modul !== "semua") {
        query = query.eq("modul", filter.modul);
      }

      if (filter?.status && filter.status !== "semua") {
        query = query.eq("status", filter.status);
      }

      if (filter?.startDate) {
        query = query.gte("created_at", filter.startDate);
      }

      if (filter?.endDate) {
        query = query.lte("created_at", filter.endDate);
      }

      if (filter?.search && filter.search.trim().length > 0) {
        const sanitized = filter.search
          .replace(/[%,(),\\.*+?^${}|[\]]/g, " ")
          .trim()
          .replace(/\s+/g, " ");

        if (sanitized.length > 0) {
          query = query.or(
            `pengurus_nama.ilike.%${sanitized}%,aksi.ilike.%${sanitized}%,modul.ilike.%${sanitized}%`
          );
        }
      }

      const limit = filter?.limit && filter.limit > 0 ? filter.limit : 100;
      query = query.limit(limit);

      const { data, error } = await query;
      if (!error && Array.isArray(data)) {
        const hasActiveFilter = Boolean(
          (filter?.modul && filter.modul !== "semua") ||
          (filter?.status && filter.status !== "semua") ||
          (filter?.search && filter.search.trim().length > 0) ||
          filter?.startDate ||
          filter?.endDate
        );

        if (data.length > 0 || hasActiveFilter) {
          return data as AuditLogItem[];
        }
      }
      if (error) {
        console.warn(
          "[AuditLog] Supabase query error, fallback ke local:",
          error.message || error
        );
      }
    } catch (err) {
      console.warn(
        "[AuditLog] Gagal mengambil audit log dari Supabase, fallback ke local:",
        err
      );
    }
  }

  // Fallback ke local cache dengan pemfilteran in-memory
  return filterLocalAuditLogs(getLocalAuditLogs(), filter);
}

/**
 * Berlangganan (subscribe) pembaruan audit log realtime via Supabase WebSocket channel.
 *
 * @param callback Handler yang dipanggil setiap kali ada log baru diinsert
 * @returns Fungsi unsubscribe pembersih channel
 */
export function subscribeToAuditLogs(
  callback: (newLog: AuditLogItem) => void
): () => void {
  try {
    if (
      isSupabaseConfigured() &&
      supabase &&
      typeof supabase.channel === "function"
    ) {
      const channelName = `audit_logs_realtime_${generateUUID()}`;
      const channel = supabase
        .channel(channelName)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "audit_logs" },
          (payload) => {
            if (payload && payload.new) {
              const newLog = payload.new as AuditLogItem;
              // Sinkronkan ke local cache agar data selalu terbarui
              try {
                const current = getLocalAuditLogs();
                if (!current.some((l) => l.id === newLog.id)) {
                  saveLocalAuditLogs([newLog, ...current].slice(0, MAX_LOCAL_LOGS));
                }
              } catch {
                // Abaikan kesalahan sinkronisasi lokal
              }
              callback(newLog);
            }
          }
        )
        .subscribe();

      return () => {
        try {
          supabase.removeChannel(channel);
        } catch {
          // Abaikan kesalahan penghapusan channel
        }
      };
    }
  } catch (err) {
    console.warn(
      "[AuditLog] Realtime subscription tidak dapat diinisialisasi:",
      err
    );
  }

  // Kembalikan no-op callback jika Supabase belum siap atau di lingkungan non-browser
  return () => {};
}
