import { supabase } from "@/lib/supabase/client";
import {
  type DokumenOrganisasi,
  DEFAULT_DOKUMEN_ORGANISASI,
} from "@/lib/types/dokumen";

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Mengambil daftar seluruh dokumen organisasi dari Supabase
 */
export async function getDokumenOrganisasi(): Promise<DokumenOrganisasi[]> {
  try {
    const { data, error } = await supabase
      .from("dokumen_organisasi")
      .select("*")
      .order("urutan", { ascending: true });

    if (!error && data && data.length > 0) {
      return data.map((row: any) => ({
        id: String(row.id),
        judul: row.judul || "",
        deskripsi: row.deskripsi || "",
        file_url: row.file_url || "",
        file_name: row.file_name || "dokumen.pdf",
        file_size: row.file_size || "",
        urutan: row.urutan != null ? Number(row.urutan) : 0,
        created_at: row.created_at,
        updated_at: row.updated_at,
      }));
    }

    return DEFAULT_DOKUMEN_ORGANISASI;
  } catch (err) {
    console.warn("Gagal mengambil data dokumen dari Supabase, memakai fallback:", err);
    return DEFAULT_DOKUMEN_ORGANISASI;
  }
}

/**
 * Mengunggah berkas PDF dokumen organisasi ke Supabase Storage (bucket: dokumen-organisasi)
 */
export async function uploadDokumenPdf(
  file: File
): Promise<{ url: string; fileName: string; fileSize: string } | null> {
  try {
    if (!file.name.toLowerCase().endsWith(".pdf") && file.type !== "application/pdf") {
      throw new Error("Berkas harus dalam format PDF (.pdf)");
    }

    const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const filePath = `dokumen_${Date.now()}_${cleanName}`;
    const formattedSize = formatFileSize(file.size);

    const { data, error } = await supabase.storage
      .from("dokumen-organisasi")
      .upload(filePath, file, {
        contentType: "application/pdf",
        cacheControl: "3600",
        upsert: true,
      });

    if (!error && data) {
      const { data: publicUrlData } = supabase.storage
        .from("dokumen-organisasi")
        .getPublicUrl(filePath);

      if (publicUrlData?.publicUrl) {
        return {
          url: publicUrlData.publicUrl,
          fileName: file.name,
          fileSize: formattedSize,
        };
      }
    }

    // Fallback: Jika bucket belum dibuat, gunakan Base64 data URL agar tetap bisa diunduh
    console.warn("Storage upload note (fallback to base64):", error?.message);
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
  } catch (err) {
    console.error("Gagal mengunggah dokumen PDF:", err);
    throw err;
  }
}

/**
 * Menambahkan data dokumen organisasi baru ke database
 */
export async function createDokumen(
  payload: Partial<DokumenOrganisasi>
): Promise<DokumenOrganisasi | null> {
  try {
    const insertPayload = {
      judul: payload.judul?.trim(),
      deskripsi: payload.deskripsi?.trim(),
      file_url: payload.file_url,
      file_name: payload.file_name,
      file_size: payload.file_size || "",
      urutan: payload.urutan || 0,
    };

    const { data, error } = await supabase
      .from("dokumen_organisasi")
      .insert([insertPayload])
      .select();

    if (error) {
      console.error("Supabase insert dokumen error:", error);
      return null;
    }

    if (data && data.length > 0) {
      const row = data[0];
      return {
        id: String(row.id),
        judul: row.judul,
        deskripsi: row.deskripsi,
        file_url: row.file_url,
        file_name: row.file_name,
        file_size: row.file_size,
        urutan: row.urutan,
        created_at: row.created_at,
        updated_at: row.updated_at,
      };
    }

    return null;
  } catch (err) {
    console.error("createDokumen error:", err);
    return null;
  }
}

/**
 * Memperbarui data dokumen organisasi
 */
export async function updateDokumen(
  id: string,
  payload: Partial<DokumenOrganisasi>
): Promise<boolean> {
  try {
    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    if (payload.judul !== undefined) updatePayload.judul = payload.judul.trim();
    if (payload.deskripsi !== undefined) updatePayload.deskripsi = payload.deskripsi.trim();
    if (payload.file_url !== undefined) updatePayload.file_url = payload.file_url;
    if (payload.file_name !== undefined) updatePayload.file_name = payload.file_name;
    if (payload.file_size !== undefined) updatePayload.file_size = payload.file_size;
    if (payload.urutan !== undefined) updatePayload.urutan = payload.urutan;

    const { error } = await supabase
      .from("dokumen_organisasi")
      .update(updatePayload)
      .eq("id", id);

    if (error) {
      console.error("Supabase update dokumen error:", error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("updateDokumen error:", err);
    return false;
  }
}

/**
 * Menghapus data dokumen organisasi
 */
export async function deleteDokumen(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("dokumen_organisasi")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Supabase delete dokumen error:", error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("deleteDokumen error:", err);
    return false;
  }
}

