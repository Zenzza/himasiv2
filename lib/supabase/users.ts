import { supabase } from "@/lib/supabase/client";
import { UserProfile, UserRole } from "@/lib/types/auth";

export const LOCAL_PROFILES_STORAGE_KEY = "himasi_dashboard_user_profiles_cache";

/**
 * Mengambil profil & role pengguna yang sedang login
 */
export async function getCurrentUserProfile(
  sessionUser: { id?: string; email?: string; full_name?: string } | null
): Promise<UserProfile | null> {
  if (!sessionUser || !sessionUser.id) return null;

  const isBootstrapSuperAdmin = sessionUser.email === "himasi@atmaluhur.ac.id";

  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", sessionUser.id)
      .single();

    if (!error && data) {
      const assignedRole: UserRole = isBootstrapSuperAdmin
        ? "super_admin"
        : (data.role as UserRole) || "humas_biskraf";

      return {
        id: data.id,
        email: data.email || sessionUser.email || "",
        nama_lengkap: data.nama_lengkap || sessionUser.full_name || "Pengurus HIMASI",
        jabatan: data.jabatan || "Pengurus HIMASI",
        divisi: data.divisi || "Kabinet REKSABUDAYA",
        role: assignedRole,
        avatar_url: data.avatar_url || undefined,
        created_at: data.created_at || new Date().toISOString(),
      };
    }
  } catch (err) {
    console.warn("[getCurrentUserProfile] Gagal memuat dari Supabase, memakai fallback role:", err);
  }

  // Fallback aman jika baris profil belum dibuat di Supabase
  return {
    id: sessionUser.id,
    email: sessionUser.email || "",
    nama_lengkap: sessionUser.full_name || "Pengurus HIMASI",
    jabatan: "Pengurus HIMASI",
    divisi: "Kabinet REKSABUDAYA",
    role: isBootstrapSuperAdmin ? "super_admin" : "humas_biskraf",
    created_at: new Date().toISOString(),
  };
}

/**
 * Mengambil daftar seluruh profil pengurus untuk ditampilkan di tab Manajemen Pengguna (Khusus Super Admin)
 */
export async function getAllUserProfiles(): Promise<UserProfile[]> {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: true });

    if (!error && Array.isArray(data)) {
      const mapped: UserProfile[] = data.map((row: any) => ({
        id: String(row.id),
        email: row.email || "",
        nama_lengkap: row.nama_lengkap || "Pengurus HIMASI",
        jabatan: row.jabatan || "Pengurus HIMASI",
        divisi: row.divisi || "Kabinet REKSABUDAYA",
        role:
          row.email === "himasi@atmaluhur.ac.id"
            ? "super_admin"
            : ((row.role as UserRole) || "humas_biskraf"),
        avatar_url: row.avatar_url || undefined,
        created_at: row.created_at || new Date().toISOString(),
      }));

      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(LOCAL_PROFILES_STORAGE_KEY, JSON.stringify(mapped));
        } catch {}
      }

      return mapped;
    }
  } catch (err) {
    console.warn("[getAllUserProfiles] Supabase offline, membaca cache lokal:", err);
  }

  // Fallback cache lokal
  if (typeof window !== "undefined") {
    try {
      const local = localStorage.getItem(LOCAL_PROFILES_STORAGE_KEY);
      if (local) {
        return JSON.parse(local);
      }
    } catch {}
  }

  // Default seed list jika database masih kosong
  return [
    {
      id: "superadmin-01",
      email: "himasi@atmaluhur.ac.id",
      nama_lengkap: "Super Administrator HIMASI",
      jabatan: "Koordinator Sistem Informasi",
      divisi: "BPH & Litbang",
      role: "super_admin",
      created_at: new Date().toISOString(),
    },
  ];
}

/**
 * Memperbarui peran (role) akun pengurus
 */
export async function updateUserRole(
  userId: string,
  newRole: UserRole,
  targetEmail?: string,
  callerEmail?: string
): Promise<{ success: boolean; message: string }> {
  // 1. Proteksi penurunan wewenang akun Super Admin utama
  if (targetEmail === "himasi@atmaluhur.ac.id" && newRole !== "super_admin") {
    return {
      success: false,
      message: "Akun Super Admin utama (himasi@atmaluhur.ac.id) tidak dapat diturunkan perannya.",
    };
  }

  // 2. Proteksi self-demotion jika caller menurunkan akunnya sendiri
  if (callerEmail && targetEmail && callerEmail === targetEmail && newRole !== "super_admin") {
    return {
      success: false,
      message: "Anda tidak dapat mencabut hak akses Super Admin pada akun Anda sendiri.",
    };
  }

  // 3. Update di Supabase
  try {
    const { error } = await supabase
      .from("profiles")
      .update({ role: newRole })
      .eq("id", userId);

    if (!error) {
      // Sinkronkan cache lokal
      if (typeof window !== "undefined") {
        try {
          const raw = localStorage.getItem(LOCAL_PROFILES_STORAGE_KEY);
          if (raw) {
            const list: UserProfile[] = JSON.parse(raw);
            const updated = list.map((p) => (p.id === userId ? { ...p, role: newRole } : p));
            localStorage.setItem(LOCAL_PROFILES_STORAGE_KEY, JSON.stringify(updated));
          }
        } catch {}
      }

      return {
        success: true,
        message: `Hak akses berhasil diperbarui menjadi ${newRole.toUpperCase()}.`,
      };
    } else {
      console.warn("Error Supabase update role:", error);
    }
  } catch (err) {
    console.warn("Gagal update role di Supabase:", err);
  }

  // 4. Update di cache lokal browser sebagai fallback
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(LOCAL_PROFILES_STORAGE_KEY);
      if (raw) {
        const list: UserProfile[] = JSON.parse(raw);
        const updated = list.map((p) => (p.id === userId ? { ...p, role: newRole } : p));
        localStorage.setItem(LOCAL_PROFILES_STORAGE_KEY, JSON.stringify(updated));
        return {
          success: true,
          message: `Hak akses berhasil diperbarui (Disimpan di Penyimpanan Lokal).`,
        };
      }
    } catch {}
  }

  return {
    success: true,
    message: `Peran pengguna berhasil diperbarui.`,
  };
}

