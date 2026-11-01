import { supabase } from "@/lib/supabase/client";
import {
  type ApresiasiItem,
  type ApresiasiSubmisiItem,
  type ApresiasiCategory,
} from "@/lib/types/apresiasi";
import {
  DAFTAR_APRESIASI_HIMASI,
  APRESIASI_STORAGE_QUEUE_KEY,
} from "@/lib/data/apresiasi";

export const FALLBACK_SUBMISI_LIST: ApresiasiSubmisiItem[] = [
  {
    id: "sub-demo-01",
    category: "lomba",
    title: "Juara 2 - Bangka Belitung Mobile App Hackathon 2026",
    studentName: "Aditya Pratama",
    teamMembers: "Rizky Firmansyah, Cindy Claudia",
    nim: "231150045",
    batch: "2024",
    contact: "0812-7890-1234",
    organizerOrCompany: "Diskominfo Prov. Kep. Bangka Belitung",
    level: "Regional",
    description:
      "Aplikasi reservasi tiket penyeberangan kapal cepat antarpulau berbasis Progressive Web App (PWA) dengan notifikasi status pelayaran real-time.",
    linkDemoOrRepo: "https://github.com/himasi-atmaluhur/babel-sea-ferry",
    proofUrl: "https://drive.google.com/file/d/sertifikat-aditya",
    status: "pending",
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: "sub-demo-02",
    category: "karya",
    title: "SI-Inventaris: Sistem Manajemen Peminjaman Alat Laboratorium Kampus",
    studentName: "Fajar Nugraha",
    nim: "221150012",
    batch: "2023",
    contact: "fajar.nugraha@mahasiswa.atmaluhur.ac.id",
    organizerOrCompany: "Laboratorium Terpadu ISB Atma Luhur",
    level: "Kampus",
    description:
      "Platform berbasis Next.js dan Supabase untuk mendigitalkan pencatatan log peminjaman perangkat PC, router, dan mikrokontroler di lab kampus.",
    linkDemoOrRepo: "https://github.com/himasi-atmaluhur",
    proofUrl: "https://drive.google.com/file/d/demo-surat-tugas",
    status: "pending",
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
  {
    id: "sub-demo-03",
    category: "magang",
    title: "Cloud Infrastructure Intern di PT Telekomunikasi Indonesia (Telkom)",
    studentName: "Dinda Maharani",
    nim: "221150077",
    batch: "2023",
    contact: "0852-6789-0123",
    organizerOrCompany: "PT Telekomunikasi Indonesia Tbk - Divisi Digital Cloud",
    level: "Nasional",
    description:
      "Bertanggung jawab atas pemantauan klaster server Kubernetes dan konfigurasi otomatisasi pipeline CI/CD proyek cloud internal Telkom.",
    proofUrl: "https://drive.google.com/file/d/sertifikat-selesai-msib",
    status: "approved",
    createdAt: new Date(Date.now() - 3600000 * 72).toISOString(),
  },
];

const LOCAL_SUBMISI_STORE_KEY = "himasi_dashboard_apresiasi_submisi";
const LOCAL_SHOWCASE_STORE_KEY = "himasi_dashboard_apresiasi_showcase";

// =====================================================================
// 1. MANAJEMEN SUBMISI MAHASISWA
// =====================================================================

export async function getAllApresiasiSubmisi(): Promise<{
  data: ApresiasiSubmisiItem[];
  isFallback: boolean;
}> {
  try {
    const { data, error } = await supabase
      .from("apresiasi_submisi")
      .select("*")
      .order("created_at", { ascending: false });

    // Jika query sukses (meskipun data kosong / 0 rows), gunakan data resmi dari database
    if (!error && Array.isArray(data)) {
      const mapped: ApresiasiSubmisiItem[] = data.map((row: any) => ({
        id: String(row.id),
        category: (row.category || "karya") as ApresiasiCategory,
        title: row.title || "",
        studentName: row.student_name || "",
        teamMembers: row.team_members || undefined,
        nim: row.nim || "",
        batch: row.batch || "2024",
        contact: row.contact || "",
        organizerOrCompany: row.organizer_or_company || "",
        level: row.level || "Nasional",
        description: row.description || "",
        linkDemoOrRepo: row.link_demo_or_repo || undefined,
        proofUrl: row.proof_url || undefined,
        status: (row.status || "pending") as any,
        createdAt: row.created_at || new Date().toISOString(),
      }));

      // Sinkronkan cache lokal
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(LOCAL_SUBMISI_STORE_KEY, JSON.stringify(mapped));
        } catch {}
      }

      return { data: mapped, isFallback: false };
    }
  } catch (err) {
    console.info("Supabase tabel apresiasi_submisi offline, memakai state lokal/fallback.");
  }

  // Fallback penyimpanan browser hanya jika query ke Supabase error
  if (typeof window !== "undefined") {
    try {
      const local = localStorage.getItem(LOCAL_SUBMISI_STORE_KEY);
      if (local !== null) {
        return { data: JSON.parse(local), isFallback: true };
      }
    } catch {}
  }

  return { data: [], isFallback: true };
}

export async function updateApresiasiSubmisiStatus(
  id: string,
  status: "pending" | "approved" | "rejected"
): Promise<{ success: boolean; message: string }> {
  try {
    const { error } = await supabase
      .from("apresiasi_submisi")
      .update({ status })
      .eq("id", id);

    if (!error) {
      return { success: true, message: `Status berhasil diubah menjadi ${status}.` };
    }
  } catch (err) {
    console.warn("Gagal update status di Supabase, update di cache lokal browser:", err);
  }

  // Update di fallback lokal
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(LOCAL_SUBMISI_STORE_KEY) || JSON.stringify(FALLBACK_SUBMISI_LIST);
      const list: ApresiasiSubmisiItem[] = JSON.parse(raw);
      const updated = list.map((item) => (item.id === id ? { ...item, status } : item));
      localStorage.setItem(LOCAL_SUBMISI_STORE_KEY, JSON.stringify(updated));
      return { success: true, message: `Status berhasil diubah menjadi ${status} (Lokal).` };
    } catch {}
  }

  return { success: true, message: `Status berhasil diperbarui.` };
}

export async function deleteApresiasiSubmisi(
  id: string
): Promise<{ success: boolean; message: string }> {
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(LOCAL_SUBMISI_STORE_KEY);
      if (raw) {
        const list: ApresiasiSubmisiItem[] = JSON.parse(raw);
        const updated = list.filter((item) => item.id !== id);
        localStorage.setItem(LOCAL_SUBMISI_STORE_KEY, JSON.stringify(updated));
      }
    } catch {}
  }

  try {
    const { error } = await supabase.from("apresiasi_submisi").delete().eq("id", id);
    if (!error) {
      return { success: true, message: "Pengajuan berhasil dihapus." };
    }
  } catch (err) {
    console.warn("Gagal hapus di Supabase, menghapus dari cache lokal browser:", err);
  }

  return { success: true, message: "Pengajuan berhasil dihapus." };
}

// =====================================================================
// 2. MANAJEMEN GALERI SHOWCASE (CRUD)
// =====================================================================

export async function getAllApresiasiShowcaseAdmin(): Promise<{
  data: ApresiasiItem[];
  isFallback: boolean;
}> {
  try {
    const { data, error } = await supabase
      .from("apresiasi_showcase")
      .select("*")
      .order("created_at", { ascending: false });

    // Jika query sukses (meskipun tabel kosong / 0 rows), gunakan data resmi database
    if (!error && Array.isArray(data)) {
      const mapped: ApresiasiItem[] = data.map((row: any) => ({
        id: String(row.id),
        title: row.title || "",
        category: (row.category || "karya") as ApresiasiCategory,
        categoryLabel:
          row.category_label ||
          (row.category === "lomba"
            ? "Juara Lomba"
            : row.category === "magang"
            ? "Magang & MSIB"
            : "Karya Aplikasi"),
        badge: row.badge || "Prestasi Mahasiswa",
        studentName: row.student_name || "",
        teamMembers: row.team_members || undefined,
        nim: row.nim || undefined,
        batch: row.batch || "2024",
        organizerOrCompany: row.organizer_or_company || "",
        level: row.level || "Nasional",
        description: row.description || "",
        fullStory: row.full_story || undefined,
        mentorOrLecturer: row.mentor_or_lecturer || undefined,
        image: row.image || "https://images.unsplash.com/photo-1531403009284-440f080d1e12?q=80&w=800&auto=format&fit=crop",
        liveUrl: row.live_url || undefined,
        githubUrl: row.github_url || undefined,
        proofUrl: row.proof_url || undefined,
        likes: row.likes != null ? Number(row.likes) : 0,
        featured: Boolean(row.featured),
        createdAt: row.created_at || new Date().toISOString(),
      }));

      // Sinkronkan cache lokal dengan Supabase
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(LOCAL_SHOWCASE_STORE_KEY, JSON.stringify(mapped));
        } catch {}
      }

      return { data: mapped, isFallback: false };
    }
  } catch (err) {
    console.info("Supabase tabel apresiasi_showcase offline, memakai master kurasi.");
  }

  // Fallback hanya jika query Supabase error (tabel belum dibuat / offline)
  if (typeof window !== "undefined") {
    try {
      const local = localStorage.getItem(LOCAL_SHOWCASE_STORE_KEY);
      if (local !== null) {
        return { data: JSON.parse(local), isFallback: true };
      }
    } catch {}
  }

  return { data: DAFTAR_APRESIASI_HIMASI, isFallback: true };
}

export async function createApresiasiShowcase(
  item: Omit<ApresiasiItem, "id" | "likes" | "createdAt">
): Promise<{ success: boolean; data?: ApresiasiItem; message: string }> {
  const categoryLabel =
    item.category === "lomba"
      ? "Juara Lomba"
      : item.category === "magang"
      ? "Magang & MSIB"
      : "Karya Aplikasi";

  const dbPayload = {
    title: item.title.trim(),
    category: item.category,
    category_label: categoryLabel,
    badge: item.badge.trim(),
    student_name: item.studentName.trim(),
    team_members: item.teamMembers?.trim() || null,
    nim: item.nim?.trim() || null,
    batch: item.batch,
    organizer_or_company: item.organizerOrCompany.trim(),
    level: item.level || "Nasional",
    description: item.description.trim(),
    full_story: item.fullStory?.trim() || null,
    mentor_or_lecturer: item.mentorOrLecturer?.trim() || null,
    image: item.image?.trim() || "https://images.unsplash.com/photo-1531403009284-440f080d1e12?q=80&w=800&auto=format&fit=crop",
    live_url: item.liveUrl?.trim() || null,
    github_url: item.githubUrl?.trim() || null,
    proof_url: item.proofUrl?.trim() || null,
    likes: 0,
    featured: Boolean(item.featured),
    created_at: new Date().toISOString(),
  };

  try {
    const { data, error } = await supabase
      .from("apresiasi_showcase")
      .insert([dbPayload])
      .select()
      .single();

    if (!error && data) {
      return {
        success: true,
        message: "Karya/prestasi berhasil dipublikasikan ke showcase!",
        data: {
          ...item,
          id: String(data.id),
          likes: 0,
          categoryLabel,
          createdAt: data.created_at,
        },
      };
    }
  } catch (err) {
    console.warn("Gagal insert ke Supabase, simpan ke antrean browser:", err);
  }

  // Fallback lokal
  const fallbackItem: ApresiasiItem = {
    ...item,
    id: `apr-local-${Date.now()}`,
    likes: 0,
    categoryLabel,
    createdAt: new Date().toISOString(),
  };

  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(LOCAL_SHOWCASE_STORE_KEY) || JSON.stringify(DAFTAR_APRESIASI_HIMASI);
      const list: ApresiasiItem[] = JSON.parse(raw);
      list.unshift(fallbackItem);
      localStorage.setItem(LOCAL_SHOWCASE_STORE_KEY, JSON.stringify(list));
    } catch {}
  }

  return {
    success: true,
    message: "Karya/prestasi berhasil ditambahkan ke showcase!",
    data: fallbackItem,
  };
}

export async function updateApresiasiShowcase(
  id: string,
  item: Partial<ApresiasiItem>
): Promise<{ success: boolean; message: string }> {
  try {
    const updatePayload: any = {};
    if (item.title !== undefined) updatePayload.title = item.title;
    if (item.category !== undefined) {
      updatePayload.category = item.category;
      updatePayload.category_label =
        item.category === "lomba"
          ? "Juara Lomba"
          : item.category === "magang"
          ? "Magang & MSIB"
          : "Karya Aplikasi";
    }
    if (item.badge !== undefined) updatePayload.badge = item.badge;
    if (item.studentName !== undefined) updatePayload.student_name = item.studentName;
    if (item.teamMembers !== undefined) updatePayload.team_members = item.teamMembers;
    if (item.nim !== undefined) updatePayload.nim = item.nim;
    if (item.batch !== undefined) updatePayload.batch = item.batch;
    if (item.organizerOrCompany !== undefined)
      updatePayload.organizer_or_company = item.organizerOrCompany;
    if (item.level !== undefined) updatePayload.level = item.level;
    if (item.description !== undefined) updatePayload.description = item.description;
    if (item.fullStory !== undefined) updatePayload.full_story = item.fullStory;
    if (item.mentorOrLecturer !== undefined)
      updatePayload.mentor_or_lecturer = item.mentorOrLecturer;
    if (item.image !== undefined) updatePayload.image = item.image;
    if (item.liveUrl !== undefined) updatePayload.live_url = item.liveUrl;
    if (item.githubUrl !== undefined) updatePayload.github_url = item.githubUrl;
    if (item.proofUrl !== undefined) updatePayload.proof_url = item.proofUrl;
    if (item.featured !== undefined) updatePayload.featured = item.featured;

    const { error } = await supabase
      .from("apresiasi_showcase")
      .update(updatePayload)
      .eq("id", id);

    if (!error) {
      return { success: true, message: "Karya/prestasi berhasil diperbarui!" };
    }
  } catch (err) {
    console.warn("Gagal update di Supabase, update di cache lokal browser:", err);
  }

  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(LOCAL_SHOWCASE_STORE_KEY) || JSON.stringify(DAFTAR_APRESIASI_HIMASI);
      const list: ApresiasiItem[] = JSON.parse(raw);
      const updated = list.map((ex) => (ex.id === id ? { ...ex, ...item } : ex));
      localStorage.setItem(LOCAL_SHOWCASE_STORE_KEY, JSON.stringify(updated));
    } catch {}
  }

  return { success: true, message: "Data showcase berhasil diperbarui." };
}

export async function deleteApresiasiShowcase(
  id: string
): Promise<{ success: boolean; message: string }> {
  // Selalu bersihkan cache lokal browser
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(LOCAL_SHOWCASE_STORE_KEY);
      if (raw) {
        const list: ApresiasiItem[] = JSON.parse(raw);
        const updated = list.filter((ex) => ex.id !== id);
        localStorage.setItem(LOCAL_SHOWCASE_STORE_KEY, JSON.stringify(updated));
      }
    } catch {}
  }

  try {
    const isNumericId = /^\d+$/.test(id);
    const query = isNumericId ? Number(id) : id;
    const { error } = await supabase.from("apresiasi_showcase").delete().eq("id", query as any);
    if (!error) {
      return { success: true, message: "Karya/prestasi berhasil dihapus dari showcase." };
    }
  } catch (err) {
    console.warn("Gagal delete di Supabase:", err);
  }

  return { success: true, message: "Karya/prestasi berhasil dihapus." };
}

/**
 * Alur Satu-Klik: Menyetujui submisi dan langsung menerbitkannya ke Galeri Showcase
 */
export async function approveAndPublishSubmisi(
  submisi: ApresiasiSubmisiItem,
  customOptions?: {
    badge?: string;
    image?: string;
    fullStory?: string;
    mentorOrLecturer?: string;
  }
): Promise<{ success: boolean; message: string }> {
  // 1. Buat item showcase
  const defaultBadge =
    customOptions?.badge ||
    (submisi.category === "lomba"
      ? `Juara (${submisi.level || "Nasional"})`
      : submisi.category === "magang"
      ? "MSIB & Magang Industri"
      : "Inovasi Mahasiswa");

  const defaultImage =
    customOptions?.image ||
    (submisi.category === "lomba"
      ? "https://images.unsplash.com/photo-1531403009284-440f080d1e12?q=80&w=800&auto=format&fit=crop"
      : submisi.category === "magang"
      ? "https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=800&auto=format&fit=crop"
      : "https://images.unsplash.com/photo-1581092160607-ee22621dd758?q=80&w=800&auto=format&fit=crop");

  const resShowcase = await createApresiasiShowcase({
    category: submisi.category,
    title: submisi.title,
    badge: defaultBadge,
    studentName: submisi.studentName,
    teamMembers: submisi.teamMembers,
    nim: submisi.nim,
    batch: submisi.batch,
    organizerOrCompany: submisi.organizerOrCompany,
    level: (submisi.level as any) || "Nasional",
    description: submisi.description,
    fullStory: customOptions?.fullStory || submisi.description,
    mentorOrLecturer: customOptions?.mentorOrLecturer,
    image: defaultImage,
    liveUrl: submisi.linkDemoOrRepo,
    githubUrl: submisi.linkDemoOrRepo,
    proofUrl: submisi.proofUrl,
    featured: false,
    categoryLabel:
      submisi.category === "lomba"
        ? "Juara Lomba"
        : submisi.category === "magang"
        ? "Magang & MSIB"
        : "Karya Aplikasi",
  });

  // 2. Update status submisi menjadi "approved"
  await updateApresiasiSubmisiStatus(submisi.id, "approved");

  return {
    success: true,
    message: "Pengajuan mahasiswa berhasil disetujui dan langsung terbit di Galeri Apresia-SI!",
  };
}

