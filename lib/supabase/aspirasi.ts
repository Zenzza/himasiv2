/**
 * Modul Layanan Database Supabase & Fallback Offline Aspirasi Mahasiswa/Alumni HIMASI
 * Sesuai Dokumen Desain Teknis: docs/superpowers/specs/2026-11-08-aspirasi-backend-and-dashboard-design.md
 * dan Task 3 Brief.
 */

import { supabase } from "@/lib/supabase/client";
import { recordAuditLog } from "@/lib/supabase/audit-log";
import {
  type AspirasiItem,
  type AspirasiStatus,
  type AspirasiEmailStatus,
  type AspirasiFilter,
  type SelesaikanAspirasiInput,
  DEFAULT_ASPIRASI_LIST,
} from "@/lib/types/aspirasi";

export const STORAGE_KEY_ASPIRASI = "himasiv2_aspirasi_list";

// In-memory fallback untuk SSR / Node.js runtime saat localStorage tidak tersedia
let inMemoryItems: AspirasiItem[] = [...DEFAULT_ASPIRASI_LIST];

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
 * Pengecekan ketersediaan lingkungan browser untuk SSR safe
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
 * Helper pembuat nomor tiket fallback lokal dengan format ASP-YYYY-XXXX.
 * Mendukung seed (misal UUID) agar deterministik dan tidak berubah saat re-render.
 */
export function generateNomorTiket(year?: number, seed?: string): string {
  const y = year || new Date().getFullYear();
  if (seed) {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = (hash << 5) - hash + seed.charCodeAt(i);
      hash |= 0;
    }
    const num = Math.abs(hash % 9000) + 1000;
    return `ASP-${y}-${num}`;
  }
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `ASP-${y}-${rand}`;
}

/**
 * Normalisasi baris Supabase ke bentuk objek AspirasiItem
 */
export function mapRowToItem(row: Record<string, unknown>): AspirasiItem {
  const r = row as Record<string, any>;
  const jawaban = r.jawaban_admin ?? r.catatan_pengurus ?? null;
  const createdYear = r.created_at ? new Date(r.created_at).getFullYear() : undefined;
  return {
    id: String(r.id),
    nomor_tiket: r.nomor_tiket
      ? String(r.nomor_tiket)
      : generateNomorTiket(createdYear, String(r.id)),
    email: String(r.email || ""),
    angkatan: String(r.angkatan || ""),
    pesan: String(r.pesan || ""),
    status: (r.status || "baru") as AspirasiStatus,
    jawaban_admin: jawaban,
    catatan_pengurus: jawaban, // Kompatibilitas mundur
    dijawab_pada: r.dijawab_pada ? String(r.dijawab_pada) : null,
    dijawab_oleh: r.dijawab_oleh ? String(r.dijawab_oleh) : null,
    status_email: (r.status_email || "belum_dikirim") as AspirasiEmailStatus,
    created_at: r.created_at ? String(r.created_at) : new Date().toISOString(),
  };
}

/**
 * Membaca data aspirasi dari localStorage (atau in-memory fallback jika SSR/Node)
 */
export function getLocalAspirasi(): AspirasiItem[] {
  if (!isBrowser()) {
    return inMemoryItems;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ASPIRASI);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_ASPIRASI, JSON.stringify(inMemoryItems));
      return inMemoryItems;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      inMemoryItems = parsed;
      return parsed;
    }
    localStorage.setItem(STORAGE_KEY_ASPIRASI, JSON.stringify(inMemoryItems));
    return inMemoryItems;
  } catch (err) {
    console.warn("[aspirasi] Gagal membaca localStorage aspirasi:", err);
    return inMemoryItems;
  }
}

/**
 * Menyimpan data aspirasi ke localStorage dan in-memory cache
 */
export function saveLocalAspirasi(items: AspirasiItem[]): void {
  inMemoryItems = [...items];
  if (!isBrowser()) return;
  try {
    localStorage.setItem(STORAGE_KEY_ASPIRASI, JSON.stringify(items));
  } catch (err) {
    console.warn("[aspirasi] Gagal menyimpan ke localStorage aspirasi:", err);
  }
}

/**
 * Mengembalikan isi data lokal ke daftar awal mock
 */
export function resetAspirasiStorageToDefault(): AspirasiItem[] {
  inMemoryItems = [...DEFAULT_ASPIRASI_LIST];
  if (isBrowser()) {
    try {
      localStorage.setItem(STORAGE_KEY_ASPIRASI, JSON.stringify(DEFAULT_ASPIRASI_LIST));
    } catch (err) {
      console.warn("[aspirasi] Gagal reset localStorage aspirasi:", err);
    }
  }
  return inMemoryItems;
}

/**
 * Mengambil daftar aspirasi dengan filter status dan kata kunci pencarian
 */
export async function getAspirasiList(filter?: AspirasiFilter): Promise<AspirasiItem[]> {
  if (isSupabaseConfigured()) {
    try {
      let query = supabase
        .from("aspirasi")
        .select("*")
        .order("created_at", { ascending: false });

      if (filter?.status && filter.status !== "semua" && filter.status !== "all") {
        query = query.eq("status", filter.status);
      }

      if (filter?.search && filter.search.trim()) {
        const sanitized = filter.search.trim().replace(/[,()]/g, " ");
        const term = `%${sanitized}%`;

        // 1. Coba pencarian dengan kolom lengkap
        let res = await query.or(
          `pesan.ilike.${term},email.ilike.${term},nomor_tiket.ilike.${term},angkatan.ilike.${term}`
        );

        // 2. Jika kolom nomor_tiket belum ada di skema database (code 42703 / PGRST204)
        if (
          res.error &&
          (res.error.code === "42703" ||
            res.error.code === "PGRST204" ||
            res.error.message?.includes("nomor_tiket"))
        ) {
          const fallbackQuery = supabase
            .from("aspirasi")
            .select("*")
            .order("created_at", { ascending: false });

          if (filter?.status && filter.status !== "semua" && filter.status !== "all") {
            fallbackQuery.eq("status", filter.status);
          }

          res = await fallbackQuery.or(
            `pesan.ilike.${term},email.ilike.${term},angkatan.ilike.${term}`
          );
        }

        if (!res.error && Array.isArray(res.data)) {
          const mapped = res.data.map(mapRowToItem);
          return mapped;
        }
        console.warn("[aspirasi] Supabase search error, fallback offline:", res.error?.message);
      } else {
        const { data, error } = await query;
        if (!error && Array.isArray(data)) {
          const mapped = data.map(mapRowToItem);
          if (!filter?.status) {
            saveLocalAspirasi(mapped);
          }
          return mapped;
        }
        console.warn("[aspirasi] Supabase fetch error, fallback offline:", error?.message);
      }
    } catch (err) {
      console.warn("[aspirasi] Supabase query failed, fallback offline:", err);
    }
  }

  // Fallback offline (localStorage / inMemory)
  let items = getLocalAspirasi();

  if (filter?.status && filter.status !== "semua" && filter.status !== "all") {
    const s = filter.status.toLowerCase();
    items = items.filter((item) => item.status.toLowerCase() === s);
  }

  if (filter?.search && filter.search.trim()) {
    const term = filter.search.trim().toLowerCase();
    items = items.filter(
      (item) =>
        (item.pesan && item.pesan.toLowerCase().includes(term)) ||
        (item.email && item.email.toLowerCase().includes(term)) ||
        (item.nomor_tiket && item.nomor_tiket.toLowerCase().includes(term)) ||
        (item.angkatan && item.angkatan.toLowerCase().includes(term))
    );
  }

  // Urutkan created_at terbaru di atas
  return items.sort((a, b) => {
    const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
    return dateB - dateA;
  });
}

/**
 * Mengambil record aspirasi tunggal berdasarkan ID
 */
export async function getAspirasiById(id: string): Promise<AspirasiItem | null> {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from("aspirasi")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (!error && data) {
        return mapRowToItem(data);
      }
    } catch (err) {
      console.warn("[aspirasi] Supabase getAspirasiById failed, check local:", err);
    }
  }

  const local = getLocalAspirasi();
  return local.find((item) => item.id === id) || null;
}

/**
 * Memperbarui status aspirasi ke 'baru' atau 'diproses'
 * Aspirasi yang sudah 'selesai' bersifat immutable dan tidak dapat diubah kembali.
 */
export async function updateAspirasiStatus(
  id: string,
  status: "baru" | "diproses",
  actorName?: string,
  actorRole?: string
): Promise<AspirasiItem> {
  // Ambil item terkini terlebih dahulu untuk validasi status
  let currentItem: AspirasiItem | undefined;

  if (isSupabaseConfigured()) {
    try {
      const { data } = await supabase.from("aspirasi").select("*").eq("id", id).maybeSingle();
      if (data) currentItem = mapRowToItem(data);
    } catch (err) {
      console.warn("[aspirasi] Supabase get item failed, check local:", err);
    }
  }

  if (!currentItem) {
    const local = getLocalAspirasi();
    currentItem = local.find((a) => a.id === id);
  }

  if (!currentItem) {
    throw new Error("Aspirasi dengan ID tersebut tidak ditemukan");
  }

  if (currentItem.status === "selesai") {
    throw new Error("Aspirasi berstatus selesai telah dikunci permanen dan tidak dapat diubah");
  }

  let resultItem: AspirasiItem | null = null;

  // Update Supabase jika online
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from("aspirasi")
        .update({ status })
        .eq("id", id)
        .neq("status", "selesai")
        .select()
        .single();

      if (!error && data) {
        const mapped = mapRowToItem(data);
        const local = getLocalAspirasi();
        saveLocalAspirasi(local.map((item) => (item.id === id ? mapped : item)));
        resultItem = mapped;
      } else {
        console.warn("[aspirasi] Supabase status update error, fallback local:", error?.message);
      }
    } catch (err) {
      console.warn("[aspirasi] Supabase status update failed, fallback local:", err);
    }
  }

  // Fallback offline update
  if (!resultItem) {
    const local = getLocalAspirasi();
    const updatedItem: AspirasiItem = {
      ...currentItem,
      status,
    };
    saveLocalAspirasi(local.map((item) => (item.id === id ? updatedItem : item)));
    resultItem = updatedItem;
  }

  recordAuditLog({
    pengurus_nama: actorName || "Pengurus HIMASI",
    pengurus_role: actorRole || "bph",
    modul: "aspirasi",
    aksi: `Mengubah status aspirasi ${resultItem.nomor_tiket || id} ke ${status}`,
    status: "berhasil",
    detail: `Status baru: ${status}`,
  }).catch((err) => console.warn("[aspirasi] Gagal mencatat audit log status:", err));

  return resultItem;
}

/**
 * Menyelesaikan aspirasi dengan mencatat jawaban resmi pengurus.
 * Menandai status = 'selesai', mengisi jawaban_admin, dijawab_pada, dijawab_oleh,
 * dan status_email = 'simulasi_terkirim'.
 * Ditolak jika jawaban_admin kosong/whitespace atau jika item sudah selesai.
 */
export async function selesaikanAspirasi(
  id: string,
  input: SelesaikanAspirasiInput
): Promise<AspirasiItem> {
  if (!input || typeof input.jawaban_admin !== "string" || !input.jawaban_admin.trim()) {
    throw new Error("Jawaban admin wajib diisi untuk menyelesaikan aspirasi");
  }

  let currentItem: AspirasiItem | undefined;

  if (isSupabaseConfigured()) {
    try {
      const { data } = await supabase.from("aspirasi").select("*").eq("id", id).maybeSingle();
      if (data) currentItem = mapRowToItem(data);
    } catch (err) {
      console.warn("[aspirasi] Supabase get item failed, check local:", err);
    }
  }

  if (!currentItem) {
    const local = getLocalAspirasi();
    currentItem = local.find((a) => a.id === id);
  }

  if (!currentItem) {
    throw new Error("Aspirasi dengan ID tersebut tidak ditemukan");
  }

  if (currentItem.status === "selesai") {
    throw new Error("Aspirasi ini sudah selesai dan tidak dapat diubah kembali");
  }

  const cleanedJawaban = input.jawaban_admin.trim();
  const dijawabOleh = (input.dijawab_oleh && input.dijawab_oleh.trim()) || "Pengurus HIMASI";
  const dijawabPada = new Date().toISOString();
  const statusEmail: AspirasiEmailStatus = input.status_email || "simulasi_terkirim";

  let resultItem: AspirasiItem | null = null;

  if (isSupabaseConfigured()) {
    try {
      let res = await supabase
        .from("aspirasi")
        .update({
          status: "selesai",
          jawaban_admin: cleanedJawaban,
          catatan_pengurus: cleanedJawaban, // Kompatibilitas mundur
          dijawab_pada: dijawabPada,
          dijawab_oleh: dijawabOleh,
          status_email: statusEmail,
        })
        .eq("id", id)
        .neq("status", "selesai")
        .select()
        .single();

      // Jika skema live belum memiliki kolom jawaban_admin / status_email (PGRST204 / 42703)
      if (
        res.error &&
        (res.error.code === "PGRST204" ||
          res.error.code === "42703" ||
          res.error.message?.includes("column"))
      ) {
        console.warn("[aspirasi] Kolom baru belum ada di Supabase, update ke catatan_pengurus...");
        res = await supabase
          .from("aspirasi")
          .update({
            status: "selesai",
            catatan_pengurus: cleanedJawaban,
          })
          .eq("id", id)
          .neq("status", "selesai")
          .select()
          .single();
      }

      if (!res.error && res.data) {
        const mapped = mapRowToItem(res.data);
        const local = getLocalAspirasi();
        saveLocalAspirasi(local.map((item) => (item.id === id ? mapped : item)));
        resultItem = mapped;
      } else {
        console.warn("[aspirasi] Supabase selesaikan error, fallback local:", res.error?.message);
      }
    } catch (err) {
      console.warn("[aspirasi] Supabase selesaikan failed, fallback local:", err);
    }
  }

  // Fallback offline
  if (!resultItem) {
    const local = getLocalAspirasi();
    const resolvedItem: AspirasiItem = {
      ...currentItem,
      status: "selesai",
      jawaban_admin: cleanedJawaban,
      catatan_pengurus: cleanedJawaban,
      dijawab_pada: dijawabPada,
      dijawab_oleh: dijawabOleh,
      status_email: statusEmail,
    };
    saveLocalAspirasi(local.map((item) => (item.id === id ? resolvedItem : item)));
    resultItem = resolvedItem;
  }

  recordAuditLog({
    pengurus_nama: dijawabOleh,
    pengurus_role: "pengurus",
    modul: "aspirasi",
    aksi: `Menyelesaikan aspirasi tiket ${resultItem.nomor_tiket || id} dengan tanggapan resmi`,
    status: "berhasil",
    detail: `Tanggapan: ${cleanedJawaban.slice(0, 100)}`,
  }).catch((err) => console.warn("[aspirasi] Gagal mencatat audit log selesaikan:", err));

  return resultItem;
}

/**
 * Memperbarui status pengiriman email pada aspirasi (misal 'terkirim', 'gagal', 'pending', 'simulasi_terkirim')
 */
export async function updateAspirasiEmailStatus(
  id: string,
  status_email: AspirasiEmailStatus
): Promise<AspirasiItem> {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from("aspirasi")
        .update({ status_email })
        .eq("id", id)
        .select()
        .single();

      if (!error && data) {
        const mapped = mapRowToItem(data);
        const local = getLocalAspirasi();
        saveLocalAspirasi(local.map((item) => (item.id === id ? mapped : item)));
        return mapped;
      }
      if (
        error &&
        (error.code === "PGRST204" ||
          error.code === "42703" ||
          error.message?.includes("status_email"))
      ) {
        console.warn("[aspirasi] status_email belum ada di database live, disimpan di cache lokal");
      } else if (error) {
        console.warn("[aspirasi] Supabase update email status error, fallback local:", error.message);
      }
    } catch (err) {
      console.warn("[aspirasi] Supabase update email status failed, fallback local:", err);
    }
  }

  const local = getLocalAspirasi();
  const current = local.find((a) => a.id === id);
  if (!current) {
    throw new Error("Aspirasi tidak ditemukan");
  }
  const updated: AspirasiItem = { ...current, status_email };
  saveLocalAspirasi(local.map((item) => (item.id === id ? updated : item)));
  return updated;
}

/**
 * Menghapus entri aspirasi dari database Supabase dan storage lokal
 */
export async function deleteAspirasi(
  id: string,
  actorName?: string,
  actorRole?: string
): Promise<boolean> {
  const currentLocal = getLocalAspirasi();
  const targetItem = currentLocal.find((item) => item.id === id);

  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase.from("aspirasi").delete().eq("id", id);
      if (error) {
        console.warn("[aspirasi] Gagal menghapus aspirasi di Supabase:", error.message);
      }
    } catch (err) {
      console.warn("[aspirasi] Gagal menghapus aspirasi di Supabase:", err);
    }
  }

  saveLocalAspirasi(currentLocal.filter((item) => item.id !== id));

  recordAuditLog({
    pengurus_nama: actorName || "Pengurus HIMASI",
    pengurus_role: actorRole || "bph",
    modul: "aspirasi",
    aksi: `Menghapus rekaman aspirasi ${targetItem?.nomor_tiket ? targetItem.nomor_tiket : id}`,
    status: "berhasil",
    detail: targetItem ? `Email: ${targetItem.email}, Angkatan: ${targetItem.angkatan}` : `ID: ${id}`,
  }).catch((err) => console.warn("[aspirasi] Gagal mencatat audit log delete:", err));

  return true;
}

/**
 * Membuat aspirasi baru (digunakan oleh form aspirasi beranda atau testing)
 */
export async function createAspirasi(input: {
  email: string;
  angkatan: string;
  pesan: string;
}): Promise<AspirasiItem> {
  const generatedTicket = generateNomorTiket();
  const newItem: AspirasiItem = {
    id: generateUuidV4(),
    nomor_tiket: generatedTicket,
    email: input.email.trim(),
    angkatan: input.angkatan.trim(),
    pesan: input.pesan.trim(),
    status: "baru",
    status_email: "belum_dikirim",
    created_at: new Date().toISOString(),
  };

  let resultItem: AspirasiItem | null = null;

  if (isSupabaseConfigured()) {
    try {
      // 1. Coba insert dengan field lengkap terlebih dahulu (jika migrasi sudah dijalankan)
      let res = await supabase
        .from("aspirasi")
        .insert({
          email: newItem.email,
          angkatan: newItem.angkatan,
          pesan: newItem.pesan,
          status: "baru",
          nomor_tiket: generatedTicket,
          status_email: "belum_dikirim",
        })
        .select()
        .single();

      // 2. Jika skema di Supabase belum memiliki kolom nomor_tiket atau status_email (PGRST204 / 42703)
      if (
        res.error &&
        (res.error.code === "PGRST204" ||
          res.error.code === "42703" ||
          res.error.message?.includes("column"))
      ) {
        console.warn(
          "[aspirasi] Kolom lanjutan belum ada di Supabase, melakukan insert dengan kolom kompatibel..."
        );
        res = await supabase
          .from("aspirasi")
          .insert({
            email: newItem.email,
            angkatan: newItem.angkatan,
            pesan: newItem.pesan,
            status: "baru",
          })
          .select()
          .single();
      }

      if (!res.error && res.data) {
        const mapped = mapRowToItem(res.data);
        const local = getLocalAspirasi();
        saveLocalAspirasi([mapped, ...local]);
        resultItem = mapped;
      } else if (res.error) {
        console.error("[aspirasi] Supabase insert failed:", res.error);
      }
    } catch (err) {
      console.warn("[aspirasi] Supabase insert failed, fallback offline:", err);
    }
  }

  if (!resultItem) {
    const local = getLocalAspirasi();
    saveLocalAspirasi([newItem, ...local]);
    resultItem = newItem;
  }

  recordAuditLog({
    pengurus_nama: "Publik / Mahasiswa",
    pengurus_role: "mahasiswa",
    modul: "aspirasi",
    aksi: `Menerima aspirasi baru dari mahasiswa angkatan ${resultItem.angkatan || "-"} (${resultItem.nomor_tiket})`,
    status: "berhasil",
    detail: `Email: ${resultItem.email}, Pesan: ${resultItem.pesan.slice(0, 100)}`,
  }).catch((err) => console.warn("[aspirasi] Gagal mencatat audit log create:", err));

  return resultItem;
}

/**
 * Berlangganan perubahan data realtime WebSocket tabel public.aspirasi
 */
export function subscribeToAspirasi(
  callback: (payload: {
    eventType: "INSERT" | "UPDATE" | "DELETE";
    new?: AspirasiItem;
    old?: { id: string };
  }) => void
): () => void {
  try {
    const channelName = `public:aspirasi:${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "aspirasi",
        },
        (payload: {
          eventType: string;
          new?: Record<string, unknown>;
          old?: Record<string, unknown>;
        }) => {
          const eventType = payload.eventType as "INSERT" | "UPDATE" | "DELETE";
          const result: {
            eventType: "INSERT" | "UPDATE" | "DELETE";
            new?: AspirasiItem;
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

          callback(result);
        }
      )
      .subscribe();

    return () => {
      try {
        supabase.removeChannel(channel);
      } catch (removeErr) {
        console.warn("[aspirasi] Gagal melepas channel realtime aspirasi:", removeErr);
      }
    };
  } catch (err) {
    console.warn("[aspirasi] Gagal inisialisasi subscription realtime:", err);
    return () => {};
  }
}
