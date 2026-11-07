/**
 * Service Layer Database Supabase, Realtime Subscription & Fallback Offline
 * Modul Content Planning & Strategy HIMASI ISB Atma Luhur
 * Sesuai Spesifikasi Teknis: docs/superpowers/specs/2026-11-07-content-planner-design.md
 * dan Task 2 Brief.
 */

import { supabase } from "@/lib/supabase/client";
import {
  type ContentPlanItem,
  type ContentPlanInput,
  type PlatformKonten,
  type TipeKonten,
  type KonsepKonten,
  type ObjektifKonten,
  type StatusKonten,
  DEFAULT_CONTENT_PLANS,
} from "@/lib/types/content-planner";

export const STORAGE_KEY_CONTENT_PLANS = "himasiv2_content_plans_v2";

// In-memory fallback untuk SSR / Node.js runtime saat localStorage tidak tersedia
let inMemoryPlans: ContentPlanItem[] = [...DEFAULT_CONTENT_PLANS];

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
 * Pengecekan ketersediaan lingkungan peramban (browser) untuk SSR safe
 */
function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

/**
 * Helper pembuat UUID v4 yang aman di browser maupun Node.js runtime
 */
function generateUuidV4(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Mapping baris Supabase mentah ke objek terstandarisasi ContentPlanItem
 */
function mapRowToItem(row: Record<string, unknown>): ContentPlanItem {
  return {
    id: String(row.id),
    tanggal: String(row.tanggal),
    calendar_week: Number(row.calendar_week),
    day_of_week: String(row.day_of_week),
    platform: (row.platform as PlatformKonten) || "Instagram",
    tipe_konten: (row.tipe_konten as TipeKonten) || "Edukasi",
    topik: String(row.topik || ""),
    konsep: (row.konsep as KonsepKonten) || "Feeds",
    objektif: typeof row.objektif === "string" ? row.objektif : null,
    status: (row.status as StatusKonten) || "Planning",
    referensi_url: typeof row.referensi_url === "string" ? row.referensi_url : null,
    progress: Number(row.progress ?? 0),
    is_done: Boolean(row.is_done),
    catatan: typeof row.catatan === "string" ? row.catatan : null,
    created_by: typeof row.created_by === "string" ? row.created_by : null,
    created_at: typeof row.created_at === "string" ? row.created_at : new Date().toISOString(),
    updated_at: typeof row.updated_at === "string" ? row.updated_at : new Date().toISOString(),
  };
}

/**
 * Membaca data rencana konten dari localStorage (atau in-memory fallback)
 */
export function getLocalContentPlans(): ContentPlanItem[] {
  if (!isBrowser()) {
    return inMemoryPlans;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CONTENT_PLANS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_CONTENT_PLANS, JSON.stringify(DEFAULT_CONTENT_PLANS));
      inMemoryPlans = [...DEFAULT_CONTENT_PLANS];
      return inMemoryPlans;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      inMemoryPlans = parsed;
      return parsed;
    }
    localStorage.setItem(STORAGE_KEY_CONTENT_PLANS, JSON.stringify(DEFAULT_CONTENT_PLANS));
    inMemoryPlans = [...DEFAULT_CONTENT_PLANS];
    return inMemoryPlans;
  } catch (err) {
    console.warn("[content-planner] Gagal membaca localStorage:", err);
    return inMemoryPlans;
  }
}

/**
 * Menyimpan data rencana konten ke localStorage dan in-memory cache
 */
export function saveLocalContentPlans(items: ContentPlanItem[]): void {
  inMemoryPlans = [...items];
  if (!isBrowser()) return;
  try {
    localStorage.setItem(STORAGE_KEY_CONTENT_PLANS, JSON.stringify(items));
  } catch (err) {
    console.warn("[content-planner] Gagal menyimpan ke localStorage:", err);
  }
}

/**
 * Mengembalikan isi data lokal ke daftar awal mock bawaan (CW 22 & CW 23)
 */
export function resetContentPlansStorageToDefault(): ContentPlanItem[] {
  const initial = [...DEFAULT_CONTENT_PLANS];
  saveLocalContentPlans(initial);
  return initial;
}

/**
 * Helper pemfilteran lokal berdasarkan parameter platform, tahun, dan bulan
 */
function filterLocalPlans(params?: {
  platform?: string;
  year?: number;
  month?: number;
}): ContentPlanItem[] {
  let items = getLocalContentPlans();

  if (params?.platform && params.platform !== "All") {
    items = items.filter((item) => item.platform === params.platform);
  }

  if (params?.year) {
    items = items.filter((item) => {
      const itemYear = parseInt(item.tanggal.slice(0, 4), 10);
      return itemYear === params.year;
    });
  }

  if (params?.month) {
    items = items.filter((item) => {
      const itemMonth = parseInt(item.tanggal.slice(5, 7), 10);
      return itemMonth === params.month;
    });
  }

  return items.sort((a, b) => a.tanggal.localeCompare(b.tanggal));
}

/**
 * 1. Mengambil daftar rencana konten dari Supabase (dengan fallback offline terisolasi)
 */
export async function getContentPlans(params?: {
  platform?: string;
  year?: number;
  month?: number;
}): Promise<ContentPlanItem[]> {
  // Jika Supabase belum dikonfigurasi, gunakan fallback lokal secara transparan
  if (!isSupabaseConfigured()) {
    return filterLocalPlans(params);
  }

  try {
    let query = supabase.from("content_plans").select("*");

    if (params?.platform && params.platform !== "All") {
      query = query.eq("platform", params.platform);
    }

    if (params?.year && params?.month) {
      const m = String(params.month).padStart(2, "0");
      const lastDay = new Date(params.year, params.month, 0).getDate();
      query = query
        .gte("tanggal", `${params.year}-${m}-01`)
        .lte("tanggal", `${params.year}-${m}-${String(lastDay).padStart(2, "0")}`);
    } else if (params?.year) {
      query = query
        .gte("tanggal", `${params.year}-01-01`)
        .lte("tanggal", `${params.year}-12-31`);
    }

    query = query
      .order("tanggal", { ascending: true })
      .order("calendar_week", { ascending: true })
      .order("created_at", { ascending: true });

    const { data, error } = await query;

    if (error) {
      console.warn("[content-planner] Supabase error, fallback offline:", error.message);
      return filterLocalPlans(params);
    }

    // Jika tabel ada tapi kosong dan tanpa parameter filter spesifik, inisialisasi dari lokal
    if ((!data || data.length === 0) && !params?.platform && !params?.year && !params?.month) {
      return filterLocalPlans(params);
    }

    if (!data) {
      return [];
    }

    const items: ContentPlanItem[] = data.map((row) =>
      mapRowToItem(row as Record<string, unknown>)
    );

    // Jika query tanpa filter, sinkronkan ke local storage
    if (!params?.platform && !params?.year && !params?.month && items.length > 0) {
      saveLocalContentPlans(items);
    }

    return items;
  } catch (err) {
    console.warn("[content-planner] Exception query Supabase, fallback lokal:", err);
    return filterLocalPlans(params);
  }
}

/**
 * 2. Membuat slot rencana konten baru
 */
export async function createContentPlan(input: ContentPlanInput): Promise<ContentPlanItem> {
  const now = new Date().toISOString();
  const id = generateUuidV4();

  const newItem: ContentPlanItem = {
    id,
    tanggal: input.tanggal,
    calendar_week: input.calendar_week,
    day_of_week: input.day_of_week,
    platform: input.platform,
    tipe_konten: input.tipe_konten,
    topik: input.topik,
    konsep: input.konsep,
    objektif: input.objektif,
    status: input.status,
    referensi_url: input.referensi_url ?? null,
    progress: input.progress ?? 0,
    is_done: Boolean(input.is_done),
    catatan: input.catatan ?? null,
    created_by: input.created_by ?? null,
    created_at: now,
    updated_at: now,
  };

  if (!isSupabaseConfigured()) {
    const currentLocal = getLocalContentPlans();
    saveLocalContentPlans([...currentLocal, newItem]);
    return newItem;
  }

  try {
    const { data, error } = await supabase
      .from("content_plans")
      .insert({
        id: newItem.id,
        tanggal: newItem.tanggal,
        calendar_week: newItem.calendar_week,
        day_of_week: newItem.day_of_week,
        platform: newItem.platform,
        tipe_konten: newItem.tipe_konten,
        topik: newItem.topik,
        konsep: newItem.konsep,
        objektif: newItem.objektif,
        status: newItem.status,
        referensi_url: newItem.referensi_url,
        progress: newItem.progress,
        is_done: newItem.is_done,
        catatan: newItem.catatan,
        created_by: newItem.created_by,
      })
      .select()
      .single();

    if (error) {
      console.warn("[content-planner] Supabase insert error, fallback offline:", error.message);
    } else if (data) {
      const created = mapRowToItem(data as Record<string, unknown>);
      const currentLocal = getLocalContentPlans();
      saveLocalContentPlans([created, ...currentLocal.filter((p) => p.id !== created.id)]);
      return created;
    }
  } catch (err) {
    console.warn("[content-planner] Supabase insert failed, fallback offline:", err);
  }

  // Fallback offline penyimpanan lokal
  const currentLocal = getLocalContentPlans();
  const updatedLocal = [...currentLocal, newItem];
  saveLocalContentPlans(updatedLocal);
  return newItem;
}

/**
 * 3. Memperbarui rencana konten yang ada
 */
export async function updateContentPlan(
  id: string,
  updates: Partial<ContentPlanInput>
): Promise<ContentPlanItem> {
  const now = new Date().toISOString();

  if (!isSupabaseConfigured()) {
    const currentLocal = getLocalContentPlans();
    const index = currentLocal.findIndex((p) => p.id === id);
    if (index === -1) {
      throw new Error(`Rencana konten dengan ID ${id} tidak ditemukan`);
    }

    const existing = currentLocal[index];
    const updated: ContentPlanItem = {
      ...existing,
      ...updates,
      updated_at: now,
    };

    currentLocal[index] = updated;
    saveLocalContentPlans(currentLocal);
    return updated;
  }

  try {
    const { data, error } = await supabase
      .from("content_plans")
      .update({
        ...updates,
        updated_at: now,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.warn("[content-planner] Supabase update error, fallback offline:", error.message);
    } else if (data) {
      const updated = mapRowToItem(data as Record<string, unknown>);
      const currentLocal = getLocalContentPlans();
      const index = currentLocal.findIndex((p) => p.id === id);
      if (index !== -1) {
        currentLocal[index] = updated;
        saveLocalContentPlans(currentLocal);
      }
      return updated;
    }
  } catch (err) {
    console.warn("[content-planner] Supabase update failed, fallback offline:", err);
  }

  // Fallback offline pembaruan lokal
  const currentLocal = getLocalContentPlans();
  const index = currentLocal.findIndex((p) => p.id === id);
  if (index === -1) {
    throw new Error(`Rencana konten dengan ID ${id} tidak ditemukan`);
  }

  const existing = currentLocal[index];
  const updated: ContentPlanItem = {
    ...existing,
    ...updates,
    updated_at: now,
  };

  currentLocal[index] = updated;
  saveLocalContentPlans(currentLocal);
  return updated;
}

/**
 * 4. Toggle status selesai (Done) satu klik
 * Saat isDone = true -> otomatis progress = 100 dan status = 'Published'
 */
export async function toggleContentPlanDone(
  id: string,
  isDone: boolean
): Promise<ContentPlanItem> {
  const updates: Partial<ContentPlanInput> = {
    is_done: isDone,
  };

  if (isDone) {
    updates.progress = 100;
    updates.status = "Publish";
  } else {
    updates.status = "Review";
    updates.progress = 75;
  }

  return updateContentPlan(id, updates);
}

/**
 * 5. Menghapus rencana konten
 */
export async function deleteContentPlan(id: string): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    const currentLocal = getLocalContentPlans();
    saveLocalContentPlans(currentLocal.filter((p) => p.id !== id));
    return true;
  }

  try {
    const { error } = await supabase
      .from("content_plans")
      .delete()
      .eq("id", id);

    if (error) {
      console.warn("[content-planner] Supabase delete error, fallback offline:", error.message);
    } else {
      const currentLocal = getLocalContentPlans();
      saveLocalContentPlans(currentLocal.filter((p) => p.id !== id));
      return true;
    }
  } catch (err) {
    console.warn("[content-planner] Supabase delete failed, fallback offline:", err);
  }

  // Fallback offline penghapusan lokal
  const currentLocal = getLocalContentPlans();
  saveLocalContentPlans(currentLocal.filter((p) => p.id !== id));
  return true;
}

/**
 * 6. Berlangganan (subscribe) perubahan data realtime WebSocket
 * Mengembalikan fungsi unsubscribe pembatalan langganan
 */
export function subscribeToContentPlans(
  onUpdate: (payload: {
    eventType: "INSERT" | "UPDATE" | "DELETE";
    new?: ContentPlanItem;
    old?: { id: string };
  }) => void
): () => void {
  try {
    const channelName = `public:content_plans:${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "content_plans",
        },
        (payload: {
          eventType: string;
          new?: Record<string, unknown>;
          old?: Record<string, unknown>;
        }) => {
          const eventType = payload.eventType as "INSERT" | "UPDATE" | "DELETE";
          const result: {
            eventType: "INSERT" | "UPDATE" | "DELETE";
            new?: ContentPlanItem;
            old?: { id: string };
          } = {
            eventType,
          };

          if (payload.new && Object.keys(payload.new).length > 0) {
            result.new = mapRowToItem(payload.new);
          }
          if (payload.old && Object.keys(payload.old).length > 0) {
            result.old = { id: String(payload.old.id) };
          }

          onUpdate(result);
        }
      )
      .subscribe();

    return () => {
      try {
        supabase.removeChannel(channel);
      } catch (removeErr) {
        console.warn("[content-planner] Gagal melepas channel realtime:", removeErr);
      }
    };
  } catch (err) {
    console.warn("[content-planner] Gagal inisialisasi subscription realtime:", err);
    return () => {};
  }
}
