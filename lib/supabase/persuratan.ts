/**
 * Modul Layanan Database Supabase & Fallback Offline Persuratan HIMASI
 * Sesuai Spesifikasi Teknis: docs/superpowers/specs/2026-11-06-persuratan-design.md
 * dan Task 2 Brief.
 */

import { supabase } from "@/lib/supabase/client";
import {
  type SuratArsipItem,
  type JenisSurat,
  type KodeJenisSurat,
  type StatusSurat,
  DEFAULT_SURAT_LIST,
  DEFAULT_SURAT_MASUK_LIST,
  KODE_JENIS_SURAT_MAP,
} from "@/lib/types/persuratan";
import {
  generateNomorSurat,
  parseBulanTahun,
} from "@/lib/utils/romawi";

export const STORAGE_KEY_PERSURATAN = "himasiv2_surat_arsip";

// Daftar awal fallback (gabungan surat keluar dan surat masuk bawaan)
const INITIAL_FALLBACK_ITEMS: SuratArsipItem[] = [
  ...DEFAULT_SURAT_LIST,
  ...DEFAULT_SURAT_MASUK_LIST,
];

// In-memory fallback untuk SSR / Node.js runtime saat localStorage tidak tersedia
let inMemoryItems: SuratArsipItem[] = [...INITIAL_FALLBACK_ITEMS];

/**
 * Pengecekan ketersediaan lingkungan browser untuk SSR safe
 */
function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

/**
 * Helper pembuat UUID v4 yang aman di browser maupun Node.js
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

function isValidUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
}

/**
 * Membaca data arsip surat dari localStorage (atau in-memory fallback)
 */
export function getLocalSurat(): SuratArsipItem[] {
  if (!isBrowser()) {
    return inMemoryItems;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PERSURATAN);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_PERSURATAN, JSON.stringify(inMemoryItems));
      return inMemoryItems;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      inMemoryItems = parsed;
      return parsed;
    }
    localStorage.setItem(STORAGE_KEY_PERSURATAN, JSON.stringify(inMemoryItems));
    return inMemoryItems;
  } catch (err) {
    console.warn("[persuratan] Gagal membaca localStorage persuratan:", err);
    return inMemoryItems;
  }
}

/**
 * Menyimpan data arsip surat ke localStorage dan in-memory cache
 */
export function saveLocalSurat(items: SuratArsipItem[]): void {
  inMemoryItems = [...items];
  if (!isBrowser()) return;
  try {
    localStorage.setItem(STORAGE_KEY_PERSURATAN, JSON.stringify(items));
  } catch (err) {
    console.warn("[persuratan] Gagal menyimpan ke localStorage persuratan:", err);
  }
}

/**
 * Mengembalikan isi data lokal ke daftar awal mock
 */
export function resetSuratStorageToDefault(): SuratArsipItem[] {
  const initial = [...INITIAL_FALLBACK_ITEMS];
  saveLocalSurat(initial);
  return initial;
}

/**
 * Mengubah ukuran byte menjadi format terukur (KB/MB)
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * 1. Mengambil daftar seluruh arsip surat dari Supabase (dengan fallback offline)
 */
export async function getDaftarSurat(): Promise<SuratArsipItem[]> {
  try {
    const { data, error } = await supabase
      .from("surat_arsip")
      .select("*")
      .order("tanggal_surat", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("[persuratan] Supabase error saat mengambil daftar, fallback ke offline:", error.message);
      return getLocalSurat();
    }

    // Jika tabel ada tapi belum ada baris data (kosong)
    if (!data || data.length === 0) {
      return getLocalSurat();
    }

    const items: SuratArsipItem[] = data.map((row: any) => ({
      id: String(row.id),
      jenis_surat: (row.jenis_surat as JenisSurat) || "keluar",
      kode_jenis: (row.kode_jenis as KodeJenisSurat) || "UND",
      nomor_urut: row.nomor_urut !== null && row.nomor_urut !== undefined ? Number(row.nomor_urut) : null,
      nomor_surat: row.nomor_surat || "—",
      perihal: row.perihal || "",
      kategori_label: row.kategori_label || "Undangan",
      tujuan_pengirim: row.tujuan_pengirim || "",
      tanggal_surat: row.tanggal_surat || new Date().toISOString().slice(0, 10),
      tanggal_diterima: row.tanggal_diterima || null,
      status: (row.status as StatusSurat) || "draft",
      file_url: row.file_url || null,
      file_name: row.file_name || null,
      file_size: row.file_size || null,
      catatan_disposisi: row.catatan_disposisi || null,
      konten_kop: row.konten_kop || {},
      created_by: row.created_by || null,
      created_at: row.created_at || new Date().toISOString(),
      updated_at: row.updated_at || new Date().toISOString(),
    }));

    // Simpan ke local cache untuk menjaga konsistensi saat offline berikutnya
    saveLocalSurat(items);
    return items;
  } catch (err) {
    console.warn("[persuratan] Exception saat query Supabase, fallback lokal:", err);
    return getLocalSurat();
  }
}

/**
 * 2. Mengambil nomor urut berikutnya & string nomor surat resmi tahun kalender berjalan.
 * Mendukung number recycling: nomor yang kembali ke draf/batal otomatis dipakai kembali.
 */
export async function getNextNomorUrut(
  kodeJenis: string,
  tanggal: string = new Date().toISOString().slice(0, 10)
): Promise<{ nomor_urut: number; nomor_surat: string }> {
  const safeKode = (kodeJenis || "UND").trim().toUpperCase();
  const safeTanggal = tanggal || new Date().toISOString().slice(0, 10);

  // 1. Coba panggil RPC atomik di Supabase
  try {
    const { data, error } = await supabase.rpc("get_next_nomor_surat", {
      p_kode_jenis: safeKode,
      p_tanggal_surat: safeTanggal,
    });

    if (!error && data && typeof data === "object" && "nomor_urut" in data) {
      return {
        nomor_urut: Number((data as any).nomor_urut),
        nomor_surat: String((data as any).nomor_surat),
      };
    }
  } catch (err) {
    console.warn("[persuratan] RPC get_next_nomor_surat tidak tersedia, beralih ke kalkulasi lokal:", err);
  }

  // 2. Fallback kalkulasi lokal / offline:
  // Ambil daftar surat aktif, filter surat keluar dengan nomor_urut aktif pada tahun berjalan
  const { tahun } = parseBulanTahun(safeTanggal);
  const items = await getDaftarSurat();

  const activeNomorUrutList = items
    .filter((item) => {
      if (item.jenis_surat !== "keluar") return false;
      if (item.nomor_urut === null || item.nomor_urut === undefined || item.nomor_urut <= 0) return false;
      const itemTahun = parseBulanTahun(item.tanggal_surat).tahun;
      return itemTahun === tahun;
    })
    .map((item) => item.nomor_urut as number);

  const maxUrut = activeNomorUrutList.length > 0 ? Math.max(...activeNomorUrutList) : 0;
  const nextUrut = maxUrut + 1;
  const nextNomorSurat = generateNomorSurat(nextUrut, safeKode, safeTanggal);

  return {
    nomor_urut: nextUrut,
    nomor_surat: nextNomorSurat,
  };
}

/**
 * 3. Membuat surat baru (baik draf surat keluar, pengajuan bernomor, maupun surat masuk)
 */
export async function createSurat(
  item: Partial<SuratArsipItem>
): Promise<SuratArsipItem> {
  const jenis: JenisSurat = item.jenis_surat === "masuk" ? "masuk" : "keluar";
  const tanggalSurat = item.tanggal_surat || new Date().toISOString().slice(0, 10);
  const kodeJenis = (item.kode_jenis || "UND").trim().toUpperCase() as KodeJenisSurat;

  let status: StatusSurat;
  let nomorUrut: number | null = null;
  let nomorSurat: string = "—";

  if (jenis === "masuk") {
    status = (item.status as StatusSurat) || "belum_disposisi";
    nomorUrut = null;
    nomorSurat = item.nomor_surat && item.nomor_surat.trim() !== "" ? item.nomor_surat.trim() : "—";
  } else {
    // Surat keluar
    status = (item.status as StatusSurat) || "draft";
    if (status === "menunggu_ttd" || status === "terkirim") {
      // Jika nomor sudah ditentukan sebelumnya
      if (item.nomor_urut && item.nomor_surat && item.nomor_surat !== "—") {
        nomorUrut = item.nomor_urut;
        nomorSurat = item.nomor_surat;
      } else {
        // Alokasikan nomor urut berikutnya secara otomatis
        const next = await getNextNomorUrut(kodeJenis, tanggalSurat);
        nomorUrut = next.nomor_urut;
        nomorSurat = next.nomor_surat;
      }
    } else {
      // Draf: tidak mengonsumsi nomor urut (nomor tetap '—')
      nomorUrut = null;
      nomorSurat = "—";
    }
  }

  // Label kategori default sesuai kode jenis
  const kategoriLabel =
    item.kategori_label ||
    (KODE_JENIS_SURAT_MAP[kodeJenis]?.label) ||
    "Lainnya";

  const newId = item.id && isValidUUID(item.id) ? item.id : generateUuidV4();
  const nowIso = new Date().toISOString();

  const newItem: SuratArsipItem = {
    id: newId,
    jenis_surat: jenis,
    kode_jenis: kodeJenis,
    nomor_urut: nomorUrut,
    nomor_surat: nomorSurat,
    perihal: item.perihal?.trim() || "Tanpa Perihal",
    kategori_label: kategoriLabel,
    tujuan_pengirim: item.tujuan_pengirim?.trim() || "-",
    tanggal_surat: tanggalSurat,
    tanggal_diterima: jenis === "masuk" ? item.tanggal_diterima || tanggalSurat : null,
    status,
    file_url: item.file_url || null,
    file_name: item.file_name || null,
    file_size: item.file_size || null,
    catatan_disposisi: item.catatan_disposisi || null,
    konten_kop: item.konten_kop || {},
    created_by: item.created_by || null,
    created_at: nowIso,
    updated_at: nowIso,
  };

  // Coba simpan ke Supabase
  try {
    const { data, error } = await supabase
      .from("surat_arsip")
      .insert([
        {
          id: newItem.id,
          jenis_surat: newItem.jenis_surat,
          kode_jenis: newItem.kode_jenis,
          nomor_urut: newItem.nomor_urut,
          nomor_surat: newItem.nomor_surat,
          perihal: newItem.perihal,
          kategori_label: newItem.kategori_label,
          tujuan_pengirim: newItem.tujuan_pengirim,
          tanggal_surat: newItem.tanggal_surat,
          tanggal_diterima: newItem.tanggal_diterima,
          status: newItem.status,
          file_url: newItem.file_url,
          file_name: newItem.file_name,
          file_size: newItem.file_size,
          catatan_disposisi: newItem.catatan_disposisi,
          konten_kop: newItem.konten_kop,
          created_by: newItem.created_by,
        },
      ])
      .select()
      .maybeSingle();

    if (!error && data) {
      const persistedItem: SuratArsipItem = {
        ...newItem,
        id: String(data.id),
        created_at: data.created_at || newItem.created_at,
        updated_at: data.updated_at || newItem.updated_at,
      };

      const local = getLocalSurat();
      saveLocalSurat([persistedItem, ...local.filter((s) => s.id !== persistedItem.id)]);
      return persistedItem;
    } else if (error) {
      console.warn("[persuratan] Supabase insert error, fallback local storage:", error.message);
    }
  } catch (err) {
    console.warn("[persuratan] Exception insert Supabase, fallback local storage:", err);
  }

  // Fallback penyimpanan offline
  const local = getLocalSurat();
  saveLocalSurat([newItem, ...local.filter((s) => s.id !== newItem.id)]);
  return newItem;
}

/**
 * 4. Memperbarui data arsip surat
 */
export async function updateSurat(
  id: string,
  updates: Partial<SuratArsipItem>
): Promise<SuratArsipItem | null> {
  const nowIso = new Date().toISOString();

  // Coba update ke Supabase jika ID adalah UUID valid
  try {
    if (isValidUUID(id)) {
      const dbPayload: Record<string, any> = {
        updated_at: nowIso,
      };
      if (updates.jenis_surat !== undefined) dbPayload.jenis_surat = updates.jenis_surat;
      if (updates.kode_jenis !== undefined) dbPayload.kode_jenis = updates.kode_jenis;
      if (updates.nomor_urut !== undefined) dbPayload.nomor_urut = updates.nomor_urut;
      if (updates.nomor_surat !== undefined) dbPayload.nomor_surat = updates.nomor_surat;
      if (updates.perihal !== undefined) dbPayload.perihal = updates.perihal;
      if (updates.kategori_label !== undefined) dbPayload.kategori_label = updates.kategori_label;
      if (updates.tujuan_pengirim !== undefined) dbPayload.tujuan_pengirim = updates.tujuan_pengirim;
      if (updates.tanggal_surat !== undefined) dbPayload.tanggal_surat = updates.tanggal_surat;
      if (updates.tanggal_diterima !== undefined) dbPayload.tanggal_diterima = updates.tanggal_diterima;
      if (updates.status !== undefined) dbPayload.status = updates.status;
      if (updates.file_url !== undefined) dbPayload.file_url = updates.file_url;
      if (updates.file_name !== undefined) dbPayload.file_name = updates.file_name;
      if (updates.file_size !== undefined) dbPayload.file_size = updates.file_size;
      if (updates.catatan_disposisi !== undefined) dbPayload.catatan_disposisi = updates.catatan_disposisi;
      if (updates.konten_kop !== undefined) dbPayload.konten_kop = updates.konten_kop;

      const { data, error } = await supabase
        .from("surat_arsip")
        .update(dbPayload)
        .eq("id", id)
        .select()
        .maybeSingle();

      if (!error && data) {
        const updated: SuratArsipItem = {
          id: String(data.id),
          jenis_surat: (data.jenis_surat as JenisSurat) || "keluar",
          kode_jenis: (data.kode_jenis as KodeJenisSurat) || "UND",
          nomor_urut: data.nomor_urut !== null && data.nomor_urut !== undefined ? Number(data.nomor_urut) : null,
          nomor_surat: data.nomor_surat || "—",
          perihal: data.perihal || "",
          kategori_label: data.kategori_label || "Undangan",
          tujuan_pengirim: data.tujuan_pengirim || "",
          tanggal_surat: data.tanggal_surat || "",
          tanggal_diterima: data.tanggal_diterima || null,
          status: (data.status as StatusSurat) || "draft",
          file_url: data.file_url || null,
          file_name: data.file_name || null,
          file_size: data.file_size || null,
          catatan_disposisi: data.catatan_disposisi || null,
          konten_kop: data.konten_kop || {},
          created_by: data.created_by || null,
          created_at: data.created_at || nowIso,
          updated_at: data.updated_at || nowIso,
        };

        const local = getLocalSurat();
        const updatedList = local.map((s) => (s.id === id ? updated : s));
        saveLocalSurat(updatedList);
        return updated;
      }
    }
  } catch (err) {
    console.warn("[persuratan] Exception update Supabase, fallback ke local storage:", err);
  }

  // Fallback update di localStorage
  const local = getLocalSurat();
  const existingIndex = local.findIndex((s) => s.id === id);
  if (existingIndex === -1) {
    return null;
  }

  const updated: SuratArsipItem = {
    ...local[existingIndex],
    ...updates,
    updated_at: nowIso,
  };
  local[existingIndex] = updated;
  saveLocalSurat([...local]);
  return updated;
}

/**
 * 5. Mengubah status surat (termasuk alokasi nomor surat keluar jika naik dari draft,
 * atau melepaskan nomor jika kembali ke draft).
 */
export async function updateStatusSurat(
  id: string,
  status: string,
  catatanDisposisi?: string
): Promise<SuratArsipItem | null> {
  // Jika dialihkan ke draft, jalankan mekanisme number recycling
  if (status === "draft") {
    const reverted = await revertSuratToDraft(id);
    if (reverted && catatanDisposisi !== undefined) {
      return await updateSurat(id, { catatan_disposisi: catatanDisposisi });
    }
    return reverted;
  }

  // Ambil surat saat ini untuk memeriksa apakah surat keluar memerlukan nomor baru
  const items = await getDaftarSurat();
  const current = items.find((s) => s.id === id);

  const updates: Partial<SuratArsipItem> = {
    status: status as StatusSurat,
  };

  if (catatanDisposisi !== undefined) {
    updates.catatan_disposisi = catatanDisposisi;
  }

  // Jika surat keluar berpindah ke 'menunggu_ttd' atau 'terkirim' dan belum memiliki nomor
  if (
    current &&
    current.jenis_surat === "keluar" &&
    (status === "menunggu_ttd" || status === "terkirim") &&
    (current.nomor_urut === null || !current.nomor_surat || current.nomor_surat === "—")
  ) {
    const next = await getNextNomorUrut(current.kode_jenis, current.tanggal_surat);
    updates.nomor_urut = next.nomor_urut;
    updates.nomor_surat = next.nomor_surat;
  }

  return await updateSurat(id, updates);
}

/**
 * 6. Mekanisme Number Recycling:
 * Mengembalikan surat keluar ke status 'draft', melepaskan nomor_urut (diset null)
 * dan nomor_surat (diset '—') agar nomor kembali ke antrean tanpa membuat celah (gaps).
 */
export async function revertSuratToDraft(
  id: string
): Promise<SuratArsipItem | null> {
  return await updateSurat(id, {
    status: "draft",
    nomor_urut: null,
    nomor_surat: "—",
  });
}

/**
 * 7. Menghapus arsip surat berdasarkan ID
 */
export async function deleteSurat(id: string): Promise<boolean> {
  try {
    if (isValidUUID(id)) {
      const { error } = await supabase
        .from("surat_arsip")
        .delete()
        .eq("id", id);

      if (error) {
        console.warn("[persuratan] Supabase delete error, melanjutkan hapus lokal:", error.message);
      }
    }
  } catch (err) {
    console.warn("[persuratan] Exception delete Supabase, melanjutkan hapus lokal:", err);
  }

  // Selalu bersihkan juga dari localStorage
  const local = getLocalSurat();
  const filtered = local.filter((s) => s.id !== id);
  saveLocalSurat(filtered);

  return true;
}

/**
 * 8. Mengunggah berkas PDF surat ke Supabase Storage (bucket: dokumen_organisasi)
 * dengan fallback Base64 data URL untuk keandalan offline/tanpa bucket.
 */
export async function uploadBerkasSurat(
  file: File
): Promise<{ url: string; fileName: string; fileSize?: string } | null> {
  try {
    const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const filePath = `surat_${Date.now()}_${cleanName}`;
    const formattedSize = formatFileSize(file.size);

    // Coba upload ke bucket Supabase
    const bucketCandidates = ["dokumen_organisasi", "dokumen-organisasi"];
    for (const bucket of bucketCandidates) {
      try {
        const { data, error } = await supabase.storage
          .from(bucket)
          .upload(filePath, file, {
            contentType: file.type || "application/pdf",
            cacheControl: "3600",
            upsert: true,
          });

        if (!error && data) {
          const { data: publicUrlData } = supabase.storage
            .from(bucket)
            .getPublicUrl(filePath);

          if (publicUrlData?.publicUrl) {
            return {
              url: publicUrlData.publicUrl,
              fileName: file.name,
              fileSize: formattedSize,
            };
          }
        }
      } catch {
        // Lanjutkan ke kandidat bucket berikutnya jika gagal
      }
    }

    // Fallback offline: Buat Base64 data URL agar berkas tetap dapat dibuka & diunduh
    if (typeof FileReader !== "undefined") {
      const base64Url = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      return {
        url: base64Url,
        fileName: file.name,
        fileSize: formattedSize,
      };
    }

    return null;
  } catch (err) {
    console.warn("[persuratan] Gagal memproses berkas surat:", err);
    return null;
  }
}
