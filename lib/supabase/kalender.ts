import { supabase } from "./client";
import {
  AgendaKalender,
  DEFAULT_AGENDA_EVENTS,
} from "../types/kalender";

/**
 * Mengambil seluruh agenda kalender dari Supabase.
 * Mengembalikan DEFAULT_AGENDA_EVENTS jika tabel belum ada atau koneksi gagal.
 */
export async function getAgendaKalender(): Promise<AgendaKalender[]> {
  try {
    const { data, error } = await supabase
      .from("agenda_kalender")
      .select("*")
      .order("tanggal_mulai", { ascending: true });

    if (error) {
      console.warn("Menggunakan data default kalender (Supabase warning):", error.message);
      return DEFAULT_AGENDA_EVENTS;
    }

    if (!data) {
      return [];
    }

    return data.map((row: any) => ({
      id: String(row.id),
      tanggal_mulai: row.tanggal_mulai,
      tanggal_selesai: row.tanggal_selesai || null,
      judul: row.judul,
      kategori: row.kategori,
      waktu: row.waktu || "Sepanjang Hari",
      lokasi: row.lokasi || "Kampus ISB Atma Luhur",
      deskripsi: row.deskripsi || "",
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));
  } catch (err) {
    console.error("Gagal mengambil agenda kalender:", err);
    return DEFAULT_AGENDA_EVENTS;
  }
}

/**
 * Menambahkan agenda baru ke Supabase.
 */
export async function createAgenda(
  agenda: Omit<AgendaKalender, "id" | "created_at" | "updated_at">
): Promise<AgendaKalender | null> {
  try {
    const payload = {
      tanggal_mulai: agenda.tanggal_mulai,
      tanggal_selesai: agenda.tanggal_selesai || null,
      judul: agenda.judul.trim(),
      kategori: agenda.kategori,
      waktu: agenda.waktu.trim() || "Sepanjang Hari",
      lokasi: agenda.lokasi.trim() || "Kampus ISB Atma Luhur",
      deskripsi: (agenda.deskripsi || "").trim(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("agenda_kalender")
      .insert([payload])
      .select()
      .single();

    if (error) {
      console.error("Gagal membuat agenda di Supabase:", error);
      return null;
    }

    return {
      id: String(data.id),
      tanggal_mulai: data.tanggal_mulai,
      tanggal_selesai: data.tanggal_selesai || null,
      judul: data.judul,
      kategori: data.kategori,
      waktu: data.waktu,
      lokasi: data.lokasi,
      deskripsi: data.deskripsi || "",
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  } catch (err) {
    console.error("Exception createAgenda:", err);
    return null;
  }
}

/**
 * Memperbarui agenda di Supabase.
 */
export async function updateAgenda(
  id: string,
  agenda: Partial<Omit<AgendaKalender, "id" | "created_at" | "updated_at">>
): Promise<AgendaKalender | null> {
  try {
    const payload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (agenda.tanggal_mulai !== undefined) payload.tanggal_mulai = agenda.tanggal_mulai;
    if (agenda.tanggal_selesai !== undefined) payload.tanggal_selesai = agenda.tanggal_selesai || null;
    if (agenda.judul !== undefined) payload.judul = agenda.judul.trim();
    if (agenda.kategori !== undefined) payload.kategori = agenda.kategori;
    if (agenda.waktu !== undefined) payload.waktu = agenda.waktu.trim();
    if (agenda.lokasi !== undefined) payload.lokasi = agenda.lokasi.trim();
    if (agenda.deskripsi !== undefined) payload.deskripsi = agenda.deskripsi.trim();

    const { data, error } = await supabase
      .from("agenda_kalender")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Gagal update agenda di Supabase:", error);
      return null;
    }

    return {
      id: String(data.id),
      tanggal_mulai: data.tanggal_mulai,
      tanggal_selesai: data.tanggal_selesai || null,
      judul: data.judul,
      kategori: data.kategori,
      waktu: data.waktu,
      lokasi: data.lokasi,
      deskripsi: data.deskripsi || "",
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  } catch (err) {
    console.error("Exception updateAgenda:", err);
    return null;
  }
}

/**
 * Menghapus agenda dari Supabase.
 */
export async function deleteAgenda(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("agenda_kalender")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Gagal menghapus agenda dari Supabase:", error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("Exception deleteAgenda:", err);
    return false;
  }
}

