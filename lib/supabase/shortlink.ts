import { supabase } from "@/lib/supabase/client";
import {
  type ShortLinkItem,
  type CreateShortLinkPayload,
  type UpdateShortLinkPayload,
} from "@/lib/types/shortlink";

const STORAGE_KEY = "himasi_short_links_fallback";

// In-memory cache untuk fallback jika browser localStorage belum tersedia (misal SSR/Node test)
let memoryShortLinks: ShortLinkItem[] = [];

function getStoredFallbackLinks(): ShortLinkItem[] {
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
  return memoryShortLinks;
}

function saveStoredFallbackLinks(items: ShortLinkItem[]): void {
  memoryShortLinks = [...items];
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {}
  }
}

/**
 * Mengambil seluruh daftar shortlink dari database Supabase (atau fallback offline)
 */
export async function getAllShortLinks(): Promise<ShortLinkItem[]> {
  try {
    const { data, error } = await supabase
      .from("short_links")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("[shortlink] Gagal query Supabase, memakai data lokal:", error.message);
      return getStoredFallbackLinks();
    }

    if (data && Array.isArray(data)) {
      const mapped: ShortLinkItem[] = data.map((row: Record<string, unknown>) => ({
        id: String(row.id),
        created_at: (row.created_at as string) || new Date().toISOString(),
        updated_at: (row.updated_at as string) || new Date().toISOString(),
        title: (row.title as string) || "",
        slug: String(row.slug || "").toLowerCase().trim(),
        original_url: (row.original_url as string) || "",
        clicks_count: Number(row.clicks_count) || 0,
        is_active: Boolean(row.is_active),
        divisi: (row.divisi as string) || "BPH",
        created_by: (row.created_by as string) || "Pengurus HIMASI",
        description: (row.description as string) || null,
      }));
      // Sinkronkan ke memory cache
      saveStoredFallbackLinks(mapped);
      return mapped;
    }

    return getStoredFallbackLinks();
  } catch (err) {
    console.warn("[shortlink] Exception saat mengambil data shortlink:", err);
    return getStoredFallbackLinks();
  }
}

/**
 * Mencari satu shortlink berdasarkan slug (misal 'makrab2026')
 */
export async function getShortLinkBySlug(slug: string): Promise<ShortLinkItem | null> {
  const cleanSlug = slug.toLowerCase().trim();
  if (!cleanSlug) return null;

  try {
    const { data, error } = await supabase
      .from("short_links")
      .select("*")
      .eq("slug", cleanSlug)
      .maybeSingle();

    if (error) {
      console.warn("[shortlink] Query slug Supabase gagal, memeriksa fallback lokal:", error.message);
      const localList = getStoredFallbackLinks();
      const found = localList.find((item) => item.slug.toLowerCase().trim() === cleanSlug);
      return found || null;
    }

    if (data) {
      return {
        id: String(data.id),
        created_at: data.created_at,
        updated_at: data.updated_at,
        title: data.title || "",
        slug: String(data.slug || "").toLowerCase().trim(),
        original_url: data.original_url || "",
        clicks_count: Number(data.clicks_count) || 0,
        is_active: Boolean(data.is_active),
        divisi: data.divisi || "BPH",
        created_by: data.created_by || "Pengurus HIMASI",
        description: data.description || null,
      };
    }

    // Jika database normal dan query berhasil tapi tidak ada data,
    // berarti slug ini memang tidak ada (atau sudah dihapus)
    return null;
  } catch (err) {
    console.warn("[shortlink] Exception saat query slug Supabase:", err);
    const localList = getStoredFallbackLinks();
    const found = localList.find((item) => item.slug.toLowerCase().trim() === cleanSlug);
    return found || null;
  }
}

/**
 * Membuat tautan pendek baru
 */
export async function createShortLink(payload: CreateShortLinkPayload): Promise<ShortLinkItem> {
  const cleanSlug = payload.slug.toLowerCase().trim();
  let cleanUrl = payload.original_url.trim();
  if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
    cleanUrl = `https://${cleanUrl}`;
  }

  const now = new Date().toISOString();
  const newItem: ShortLinkItem = {
    id: `sl-${Date.now()}`,
    created_at: now,
    updated_at: now,
    title: payload.title.trim(),
    slug: cleanSlug,
    original_url: cleanUrl,
    clicks_count: 0,
    is_active: payload.is_active !== undefined ? payload.is_active : true,
    divisi: payload.divisi || "BPH",
    created_by: payload.created_by || "Pengurus HIMASI",
    description: payload.description?.trim() || null,
  };

  try {
    const { data, error } = await supabase
      .from("short_links")
      .insert([
        {
          title: newItem.title,
          slug: newItem.slug,
          original_url: newItem.original_url,
          clicks_count: 0,
          is_active: newItem.is_active,
          divisi: newItem.divisi,
          created_by: newItem.created_by,
          description: newItem.description,
        },
      ])
      .select()
      .single();

    if (!error && data) {
      newItem.id = String(data.id);
      newItem.created_at = data.created_at;
      newItem.updated_at = data.updated_at;
    } else if (error) {
      console.warn("[shortlink] Catatan insert Supabase (tersimpan lokal):", error.message);
    }
  } catch (err) {
    console.warn("[shortlink] Supabase insert offline fallback:", err);
  }

  // Simpan ke local cache
  const existing = getStoredFallbackLinks().filter((item) => item.slug !== cleanSlug && item.id !== newItem.id);
  saveStoredFallbackLinks([newItem, ...existing]);

  return newItem;
}

/**
 * Memperbarui data shortlink yang sudah ada
 */
export async function updateShortLink(
  id: string,
  payload: UpdateShortLinkPayload
): Promise<ShortLinkItem | null> {
  const updateFields: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (payload.title !== undefined) updateFields.title = payload.title.trim();
  if (payload.slug !== undefined) updateFields.slug = payload.slug.toLowerCase().trim();
  if (payload.original_url !== undefined) {
    let url = payload.original_url.trim();
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = `https://${url}`;
    }
    updateFields.original_url = url;
  }
  if (payload.is_active !== undefined) updateFields.is_active = payload.is_active;
  if (payload.divisi !== undefined) updateFields.divisi = payload.divisi;
  if (payload.created_by !== undefined) updateFields.created_by = payload.created_by;
  if (payload.description !== undefined) updateFields.description = payload.description.trim() || null;

  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    if (isUuid) {
      await supabase.from("short_links").update(updateFields).eq("id", id);
    } else {
      await supabase.from("short_links").update(updateFields).eq("slug", payload.slug);
    }
  } catch (err) {
    console.warn("[shortlink] Gagal update ke Supabase:", err);
  }

  // Perbarui local cache
  const localList = getStoredFallbackLinks();
  let updatedItem: ShortLinkItem | null = null;
  const updatedList = localList.map((item) => {
    if (item.id === id || (payload.slug && item.slug === payload.slug)) {
      updatedItem = {
        ...item,
        ...(updateFields as Partial<ShortLinkItem>),
      };
      return updatedItem;
    }
    return item;
  });

  saveStoredFallbackLinks(updatedList);
  return updatedItem;
}

/**
 * Mengubah status aktif/tutup shortlink (toggle switch)
 */
export async function toggleShortLinkActive(
  id: string,
  isActive: boolean
): Promise<ShortLinkItem | null> {
  return updateShortLink(id, { is_active: isActive });
}

/**
 * Menghapus shortlink
 */
export async function deleteShortLink(id: string): Promise<boolean> {
  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    if (isUuid) {
      const { error } = await supabase.from("short_links").delete().eq("id", id);
      if (error) {
        console.warn("[shortlink] Catatan gagal delete dari Supabase by ID:", error.message);
      }
    } else {
      const { error } = await supabase.from("short_links").delete().or(`id.eq.${id},slug.eq.${id}`);
      if (error) {
        console.warn("[shortlink] Catatan gagal delete dari Supabase by slug/id:", error.message);
      }
    }
  } catch (err) {
    console.warn("[shortlink] Exception saat delete dari Supabase:", err);
  }

  const localList = getStoredFallbackLinks();
  const filtered = localList.filter((item) => item.id !== id && item.slug !== id);
  saveStoredFallbackLinks(filtered);
  return true;
}

/**
 * Menambah counter klik tautan secara atomic
 */
export async function incrementShortLinkClicks(slug: string): Promise<void> {
  const cleanSlug = slug.toLowerCase().trim();
  if (!cleanSlug) return;

  try {
    // Panggil fungsi RPC atomic jika tabel sudah ada di Supabase
    const { error: rpcErr } = await supabase.rpc("increment_short_link_clicks", {
      link_slug: cleanSlug,
    });

    if (rpcErr) {
      // Fallback update langsung jika RPC belum dibuat
      await supabase
        .from("short_links")
        .update({
          updated_at: new Date().toISOString(),
        })
        .eq("slug", cleanSlug);
    }
  } catch (err) {
    console.warn("[shortlink] Gagal increment counter di Supabase:", err);
  }

  // Sinkronkan ke local cache
  const localList = getStoredFallbackLinks();
  const updatedList = localList.map((item) => {
    if (item.slug.toLowerCase().trim() === cleanSlug) {
      return {
        ...item,
        clicks_count: item.clicks_count + 1,
        updated_at: new Date().toISOString(),
      };
    }
    return item;
  });
  saveStoredFallbackLinks(updatedList);
}

