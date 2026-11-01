import { supabase } from "@/lib/supabase/client";
import { type BeritaItem, FALLBACK_BERITA } from "@/lib/types/berita";
import { type ContentStatus } from "@/lib/types/auth";
import { slugify } from "@/lib/utils/slug";

const LOCAL_STORAGE_KEY = "himasi_berita_local_cache";

/**
 * Helper untuk mengambil cache berita lokal dari localStorage (jika tersedia di browser)
 */
function getLocalCache(): BeritaItem[] {
  if (typeof window === "undefined") return FALLBACK_BERITA;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return FALLBACK_BERITA;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    return FALLBACK_BERITA;
  } catch {
    return FALLBACK_BERITA;
  }
}

/**
 * Helper untuk menyimpan berita ke localStorage
 */
function saveLocalCache(list: BeritaItem[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
  } catch (err) {
    console.error("[Berita] Gagal menyimpan ke localStorage:", err);
  }
}

/**
 * Mengambil daftar berita yang berstatus Terbit (is_published = true & status = 'published') untuk halaman publik
 */
export async function getPublishedBerita(): Promise<BeritaItem[]> {
  try {
    const { data, error } = await supabase
      .from("berita")
      .select("*")
      .eq("is_published", true)
      .order("published_at", { ascending: false });

    if (!error && data) {
      // Filter hanya yang berstatus published (atau jika kolom status belum ada di baris lama, izinkan fallback)
      const publishedRows = data.filter(
        (item: any) => !item.status || item.status === "published"
      );

      if (publishedRows.length > 0) {
        const mapped: BeritaItem[] = publishedRows.map((item: any) => ({
          id: item.id,
          title: item.title,
          slug: item.slug || slugify(item.title),
          excerpt: item.excerpt || "",
          content: item.content || "",
          category_key: item.category_key || "event",
          category_label: item.category_label || "Kegiatan Himpunan",
          author: item.author || "HIMASI Media",
          read_time: item.read_time || "5 min read",
          image_url: item.image_url || "/DSC01203.png",
          is_published: true,
          status: "published",
          catatan_revisi: item.catatan_revisi || undefined,
          created_at: item.created_at,
          published_at: item.published_at || item.created_at || new Date().toISOString(),
        }));
        saveLocalCache(mapped);
        return mapped;
      }
      return [];
    }
  } catch (err) {
    console.warn("[Berita] Menggunakan fallback lokal:", err);
  }

  const local = getLocalCache();
  return local.filter((b) => b.is_published && (!b.status || b.status === "published"));
}

/**
 * Mengambil satu berita berdasarkan slug (atau fallback ID numerik)
 */
export async function getBeritaBySlug(slug: string): Promise<BeritaItem | null> {
  const cleanSlug = decodeURIComponent(slug).trim().toLowerCase();

  try {
    const { data, error } = await supabase
      .from("berita")
      .select("*")
      .eq("slug", cleanSlug)
      .single();

    if (!error && data) {
      return {
        id: data.id,
        title: data.title,
        slug: data.slug || cleanSlug,
        excerpt: data.excerpt || "",
        content: data.content || "",
        category_key: data.category_key || "event",
        category_label: data.category_label || "Kegiatan Himpunan",
        author: data.author || "HIMASI Media",
        read_time: data.read_time || "5 min read",
        image_url: data.image_url || "/DSC01203.png",
        is_published: data.is_published ?? true,
        status: (data.status as ContentStatus) || (data.is_published ? "published" : "draft"),
        catatan_revisi: data.catatan_revisi || undefined,
        created_at: data.created_at,
        published_at: data.published_at || data.created_at || new Date().toISOString(),
      };
    }

    if (!isNaN(Number(cleanSlug))) {
      const { data: idData } = await supabase
        .from("berita")
        .select("*")
        .eq("id", Number(cleanSlug))
        .single();

      if (idData) {
        return {
          id: idData.id,
          title: idData.title,
          slug: idData.slug || cleanSlug,
          excerpt: idData.excerpt || "",
          content: idData.content || "",
          category_key: idData.category_key || "event",
          category_label: idData.category_label || "Kegiatan Himpunan",
          author: idData.author || "HIMASI Media",
          read_time: idData.read_time || "5 min read",
          image_url: idData.image_url || "/DSC01203.png",
          is_published: idData.is_published ?? true,
          status: (idData.status as ContentStatus) || (idData.is_published ? "published" : "draft"),
          catatan_revisi: idData.catatan_revisi || undefined,
          created_at: idData.created_at,
          published_at: idData.published_at || idData.created_at || new Date().toISOString(),
        };
      }
    }
  } catch (err) {
    console.warn("[Berita] Query Supabase slug gagal, beralih ke cache lokal:", err);
  }

  const local = getLocalCache();
  const found = local.find(
    (b) =>
      b.slug.toLowerCase() === cleanSlug ||
      String(b.id) === cleanSlug ||
      slugify(b.title) === cleanSlug
  );

  return found || null;
}

/**
 * Mengambil seluruh berita untuk Dashboard Admin (termasuk status Draft & Pending Review)
 */
export async function getAllBeritaAdmin(): Promise<BeritaItem[]> {
  try {
    const { data, error } = await supabase
      .from("berita")
      .select("*")
      .order("published_at", { ascending: false });

    if (!error && data && data.length > 0) {
      const mapped = data.map((item: any) => ({
        id: item.id,
        title: item.title,
        slug: item.slug || slugify(item.title),
        excerpt: item.excerpt || "",
        content: item.content || "",
        category_key: item.category_key || "event",
        category_label: item.category_label || "Kegiatan Himpunan",
        author: item.author || "HIMASI Media",
        read_time: item.read_time || "5 min read",
        image_url: item.image_url || "/DSC01203.png",
        is_published: item.is_published ?? true,
        status: (item.status as ContentStatus) || (item.is_published ? "published" : "draft"),
        catatan_revisi: item.catatan_revisi || undefined,
        created_at: item.created_at,
        published_at: item.published_at || item.created_at || new Date().toISOString(),
      }));
      saveLocalCache(mapped);
      return mapped;
    }
  } catch (err) {
    console.warn("[Berita] Supabase admin fetch gagal:", err);
  }

  return getLocalCache();
}

/**
 * Menambahkan berita baru (Create)
 */
export async function createBerita(
  payload: Omit<BeritaItem, "id" | "created_at">
): Promise<BeritaItem> {
  const newSlug = payload.slug ? slugify(payload.slug) : slugify(payload.title);
  const newDate = payload.published_at || new Date().toISOString();
  const defaultStatus: ContentStatus = payload.status || (payload.is_published ? "published" : "draft");

  let createdItem: BeritaItem = {
    id: Date.now(),
    ...payload,
    slug: newSlug,
    status: defaultStatus,
    is_published: defaultStatus === "published",
    published_at: newDate,
    created_at: newDate,
  };

  try {
    const { data, error } = await supabase
      .from("berita")
      .insert({
        title: payload.title,
        slug: newSlug,
        excerpt: payload.excerpt,
        content: payload.content,
        category_key: payload.category_key,
        category_label: payload.category_label,
        author: payload.author,
        read_time: payload.read_time,
        image_url: payload.image_url,
        is_published: defaultStatus === "published",
        status: defaultStatus,
        catatan_revisi: payload.catatan_revisi || null,
        published_at: newDate,
      })
      .select()
      .single();

    if (!error && data) {
      createdItem = {
        id: data.id,
        title: data.title,
        slug: data.slug,
        excerpt: data.excerpt,
        content: data.content,
        category_key: data.category_key,
        category_label: data.category_label,
        author: data.author,
        read_time: data.read_time,
        image_url: data.image_url,
        is_published: data.is_published,
        status: (data.status as ContentStatus) || defaultStatus,
        catatan_revisi: data.catatan_revisi || undefined,
        created_at: data.created_at,
        published_at: data.published_at,
      };
    }
  } catch (err) {
    console.warn("[Berita] Gagal insert ke Supabase, menyimpan ke cache lokal:", err);
  }

  const current = getLocalCache();
  const updated = [createdItem, ...current];
  saveLocalCache(updated);

  return createdItem;
}

/**
 * Memperbarui data berita yang sudah ada (Update)
 */
export async function updateBerita(
  id: number | string,
  payload: Partial<BeritaItem>
): Promise<BeritaItem> {
  const cleanSlug = payload.title ? slugify(payload.slug || payload.title) : payload.slug;

  const dbUpdatePayload: any = {
    ...payload,
    ...(cleanSlug ? { slug: cleanSlug } : {}),
  };

  if (payload.status) {
    dbUpdatePayload.is_published = payload.status === "published";
  }

  try {
    const { data, error } = await supabase
      .from("berita")
      .update(dbUpdatePayload)
      .eq("id", id)
      .select()
      .single();

    if (!error && data) {
      const current = getLocalCache();
      const updated = current.map((b) => (String(b.id) === String(id) ? { ...b, ...data } : b));
      saveLocalCache(updated);
      return data;
    }
  } catch (err) {
    console.warn("[Berita] Update Supabase gagal, memperbarui cache lokal:", err);
  }

  const current = getLocalCache();
  let updatedItem: BeritaItem | null = null;
  const updated = current.map((b) => {
    if (String(b.id) === String(id)) {
      updatedItem = {
        ...b,
        ...payload,
        ...(cleanSlug ? { slug: cleanSlug } : {}),
      };
      return updatedItem;
    }
    return b;
  });

  saveLocalCache(updated);
  return updatedItem || ({ id, ...payload } as BeritaItem);
}

/**
 * Memperbarui status persetujuan berita (Approve & Publish / Reject dengan Catatan)
 */
export async function updateBeritaStatus(
  id: number | string,
  status: ContentStatus,
  catatanRevisi?: string
): Promise<BeritaItem> {
  return updateBerita(id, {
    status,
    is_published: status === "published",
    catatan_revisi: catatanRevisi || undefined,
  });
}

/**
 * Menghapus berita (Delete)
 */
export async function deleteBerita(id: number | string): Promise<boolean> {
  try {
    const { error } = await supabase.from("berita").delete().eq("id", id);
    if (error) {
      console.warn("[Berita] Supabase delete error:", error.message);
    }
  } catch (err) {
    console.warn("[Berita] Delete Supabase gagal:", err);
  }

  const current = getLocalCache();
  const filtered = current.filter((b) => String(b.id) !== String(id));
  saveLocalCache(filtered);

  return true;
}

/**
 * Toggle status publikasi (Terbit <-> Draft)
 */
export async function togglePublishedBerita(
  id: number | string,
  currentStatus: boolean
): Promise<boolean> {
  const newStatus = !currentStatus;
  await updateBerita(id, {
    is_published: newStatus,
    status: newStatus ? "published" : "draft",
  });
  return newStatus;
}


