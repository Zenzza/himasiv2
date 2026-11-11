import { supabase } from "@/lib/supabase/client";
import {
  type PopupItem,
  type CreatePopupPayload,
  type UpdatePopupPayload,
} from "@/lib/types/popup";

const STORAGE_KEY = "himasi_homepage_popups_fallback";

// In-memory cache untuk fallback jika browser localStorage belum tersedia (SSR / Node test)
let memoryPopups: PopupItem[] = [];

function getStoredFallbackPopups(): PopupItem[] {
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw !== null) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch {}
  }
  return memoryPopups;
}

function saveStoredFallbackPopups(items: PopupItem[]): void {
  memoryPopups = [...items];
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {}
  }
}

function mapRowToPopupItem(row: Record<string, unknown>): PopupItem {
  return {
    id: String(row.id),
    created_at: (row.created_at as string) || new Date().toISOString(),
    updated_at: (row.updated_at as string) || new Date().toISOString(),
    title: (row.title as string) || "",
    tag: (row.tag as string) || "PENGUMUMAN",
    content: (row.content as string) || "",
    image_url: (row.image_url as string) || null,
    cta_text: (row.cta_text as string) || null,
    cta_url: (row.cta_url as string) || null,
    is_active: Boolean(row.is_active),
    created_by: (row.created_by as string) || "Pengurus HIMASI",
  };
}

/**
 * Mengambil semua pengumuman popup (aktif maupun nonaktif) diurutkan berdasarkan updated_at DESC
 */
export async function getAllPopups(): Promise<PopupItem[]> {
  try {
    const { data, error } = await supabase
      .from("homepage_popups")
      .select("*")
      .order("updated_at", { ascending: false });

    if (error) {
      return getStoredFallbackPopups();
    }

    if (data && Array.isArray(data)) {
      const mapped = data.map(mapRowToPopupItem);
      saveStoredFallbackPopups(mapped);
      return mapped;
    }

    return getStoredFallbackPopups();
  } catch {
    return getStoredFallbackPopups();
  }
}

/**
 * Mengambil satu popup yang berstatus aktif saat ini (untuk ditampilkan di halaman publik beranda)
 */
export async function getActivePopup(): Promise<PopupItem | null> {
  try {
    const { data, error } = await supabase
      .from("homepage_popups")
      .select("*")
      .eq("is_active", true)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      // Fallback lokal HANYA jika query error (koneksi terputus atau tabel belum dibuat)
      console.warn("[HIMASI Popup] Gagal mengambil popup aktif dari Supabase, beralih ke fallback:", error.message);
      const local = getStoredFallbackPopups();
      const activeLocal = local.find((p) => p.is_active);
      return activeLocal || null;
    }

    // Jika database normal dan query berhasil:
    // Kembalikan popup aktif jika ada, atau null jika memang tidak ada popup yang aktif
    if (data) {
      return mapRowToPopupItem(data);
    }

    return null;
  } catch (err) {
    console.warn("[HIMASI Popup] Exception saat mengambil popup aktif, beralih ke fallback:", err);
    const local = getStoredFallbackPopups();
    return local.find((p) => p.is_active) || null;
  }
}

/**
 * Membuat popup baru. Jika is_active = true, secara otomatis menonaktifkan popup lain.
 */
export async function createPopup(payload: CreatePopupPayload): Promise<PopupItem> {
  const willBeActive = Boolean(payload.is_active);

  try {
    if (willBeActive) {
      // Nonaktifkan semua popup lain di database
      await supabase
        .from("homepage_popups")
        .update({ is_active: false })
        .eq("is_active", true);
    }

    const { data, error } = await supabase
      .from("homepage_popups")
      .insert({
        title: payload.title.trim(),
        tag: (payload.tag || "PENGUMUMAN").trim().toUpperCase(),
        content: payload.content.trim(),
        image_url: payload.image_url?.trim() || null,
        cta_text: payload.cta_text?.trim() || null,
        cta_url: payload.cta_url?.trim() || null,
        is_active: willBeActive,
        created_by: payload.created_by?.trim() || "Pengurus HIMASI",
      })
      .select()
      .single();

    if (!error && data) {
      const created = mapRowToPopupItem(data);
      // Sinkronkan ke lokal fallback
      const current = getStoredFallbackPopups();
      const updatedList = willBeActive
        ? current.map((p) => ({ ...p, is_active: false }))
        : [...current];
      saveStoredFallbackPopups([created, ...updatedList]);
      return created;
    }

    throw new Error(error?.message || "Gagal insert Supabase");
  } catch {
    const current = getStoredFallbackPopups();
    const newId =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `popup-${Date.now()}`;

    const newPopup: PopupItem = {
      id: newId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      title: payload.title.trim(),
      tag: (payload.tag || "PENGUMUMAN").trim().toUpperCase(),
      content: payload.content.trim(),
      image_url: payload.image_url?.trim() || null,
      cta_text: payload.cta_text?.trim() || null,
      cta_url: payload.cta_url?.trim() || null,
      is_active: willBeActive,
      created_by: payload.created_by?.trim() || "Pengurus HIMASI",
    };

    const updatedList = willBeActive
      ? current.map((p) => ({ ...p, is_active: false }))
      : [...current];

    const result = [newPopup, ...updatedList];
    saveStoredFallbackPopups(result);
    return newPopup;
  }
}

/**
 * Memperbarui data popup berdasarkan ID
 */
export async function updatePopup(
  id: string,
  payload: UpdatePopupPayload
): Promise<PopupItem | null> {
  const willBeActive = payload.is_active !== undefined ? Boolean(payload.is_active) : undefined;

  try {
    if (willBeActive === true) {
      // Nonaktifkan popup lain di database
      await supabase
        .from("homepage_popups")
        .update({ is_active: false })
        .neq("id", id)
        .eq("is_active", true);
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (payload.title !== undefined) updateData.title = payload.title.trim();
    if (payload.tag !== undefined) updateData.tag = payload.tag.trim().toUpperCase();
    if (payload.content !== undefined) updateData.content = payload.content.trim();
    if (payload.image_url !== undefined) updateData.image_url = payload.image_url?.trim() || null;
    if (payload.cta_text !== undefined) updateData.cta_text = payload.cta_text?.trim() || null;
    if (payload.cta_url !== undefined) updateData.cta_url = payload.cta_url?.trim() || null;
    if (payload.is_active !== undefined) updateData.is_active = Boolean(payload.is_active);
    if (payload.created_by !== undefined) updateData.created_by = payload.created_by.trim();

    const { data, error } = await supabase
      .from("homepage_popups")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (!error && data) {
      const updated = mapRowToPopupItem(data);
      const current = getStoredFallbackPopups();
      const nextList = current.map((p) => {
        if (p.id === id) return updated;
        if (willBeActive === true) return { ...p, is_active: false };
        return p;
      });
      saveStoredFallbackPopups(nextList);
      return updated;
    }

    throw new Error(error?.message || "Gagal update Supabase");
  } catch {
    const current = getStoredFallbackPopups();
    let foundItem: PopupItem | null = null;

    const nextList = current.map((p) => {
      if (p.id === id) {
        foundItem = {
          ...p,
          ...payload,
          tag: payload.tag !== undefined ? payload.tag.trim().toUpperCase() : p.tag,
          updated_at: new Date().toISOString(),
          is_active: willBeActive !== undefined ? willBeActive : p.is_active,
        };
        return foundItem;
      }
      if (willBeActive === true) {
        return { ...p, is_active: false };
      }
      return p;
    });

    if (foundItem) {
      saveStoredFallbackPopups(nextList);
      return foundItem;
    }
    return null;
  }
}

/**
 * Menjadikan satu popup aktif dan otomatis menonaktifkan seluruh popup lainnya
 */
export async function setActivePopup(id: string): Promise<boolean> {
  try {
    // Coba via RPC Supabase
    const { error: rpcError } = await supabase.rpc("set_active_homepage_popup", {
      target_id: id,
    });

    if (!rpcError) {
      const current = getStoredFallbackPopups();
      saveStoredFallbackPopups(
        current.map((p) => ({
          ...p,
          is_active: p.id === id,
          updated_at: p.id === id ? new Date().toISOString() : p.updated_at,
        }))
      );
      return true;
    }

    // Jika RPC belum terpasang, coba 2-step update manual di Supabase
    await supabase.from("homepage_popups").update({ is_active: false }).neq("id", id);
    const { error: activateError } = await supabase
      .from("homepage_popups")
      .update({ is_active: true, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (!activateError) {
      const current = getStoredFallbackPopups();
      saveStoredFallbackPopups(
        current.map((p) => ({
          ...p,
          is_active: p.id === id,
          updated_at: p.id === id ? new Date().toISOString() : p.updated_at,
        }))
      );
      return true;
    }

    throw new Error(activateError.message);
  } catch {
    const current = getStoredFallbackPopups();
    const updated = current.map((p) => ({
      ...p,
      is_active: p.id === id,
      updated_at: p.id === id ? new Date().toISOString() : p.updated_at,
    }));
    saveStoredFallbackPopups(updated);
    return true;
  }
}

/**
 * Menghapus popup berdasarkan ID
 */
export async function deletePopup(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from("homepage_popups").delete().eq("id", id);
    if (!error) {
      const current = getStoredFallbackPopups();
      saveStoredFallbackPopups(current.filter((p) => p.id !== id));
      return true;
    }
    throw new Error(error.message);
  } catch {
    const current = getStoredFallbackPopups();
    saveStoredFallbackPopups(current.filter((p) => p.id !== id));
    return true;
  }
}
