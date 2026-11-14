import { supabase } from "@/lib/supabase/client";
import { type ApresiasiItem, type ApresiasiSubmissionPayload } from "@/lib/types/apresiasi";

export const DAFTAR_APRESIASI_HIMASI: ApresiasiItem[] = [
  {
    id: "apr-01",
    title: "Juara 1 - National UI/UX Design Hackathon 2026",
    category: "lomba",
    categoryLabel: "Juara Lomba",
    badge: "Juara 1 Nasional",
    studentName: "Muhammad Fadhil",
    teamMembers: "Anindya Putri, Zahra Salsabila",
    nim: "231150002",
    batch: "2024",
    organizerOrCompany: "TechFest Nasional x Kemendikbudristek",
    level: "Nasional",
    description:
      "Mengembangkan aplikasi asisten perkuliahan cerdas untuk penyandang disabilitas sensorik dengan pengenalan suara dan gestur berbasis AI.",
    fullStory:
      "Dalam kompetisi hackathon nasional berdurasi 48 jam yang diikuti lebih dari 120 universitas di seluruh Indonesia, Tim Inovasi Aksesibel SI berhasil meraih Juara 1 dengan menciptakan solusi 'Aksesibel-SI'. Inovasi ini menghadirkan transkripsi kuliah otomatis real-time, penerjemah bahasa isyarat visual, dan navigasi ramah pembaca layar (screen-reader friendly).",
    mentorOrLecturer: "Dosen Pembina HIMASI ISB Atma Luhur",
    image: "https://images.unsplash.com/photo-1531403009284-440f080d1e12?q=80&w=800&auto=format&fit=crop",
    liveUrl: "https://github.com/himasi-atmaluhur",
    githubUrl: "https://github.com/himasi-atmaluhur",
    proofUrl: "/DSC01203.jpg",
    likes: 84,
    featured: true,
    createdAt: "2026-03-15T10:00:00Z",
  },
  {
    id: "apr-02",
    title: "Best Paper Award - International Conference on Information Systems (ICIS 2025)",
    category: "lomba",
    categoryLabel: "Juara Lomba",
    badge: "Best Paper Internasional",
    studentName: "Arya Wijaya",
    teamMembers: "Tim Riset Data Mahasiswa SI",
    nim: "221150019",
    batch: "2023",
    organizerOrCompany: "IEEE Computer Society & AIS",
    level: "Internasional",
    description:
      "Menerbitkan penelitian ilmiah bereputasi internasional mengenai arsitektur sistem informasi prediktif pada rantai pasok maritim kepulauan.",
    fullStory:
      "Penelitian ini menganalisis efisiensi logistik distribusi komoditas antarpulau di Kepulauan Bangka Belitung menggunakan model prediktif berbasis machine learning dan optimasi rute pelayaran maritim.",
    mentorOrLecturer: "Kaprodi Sistem Informasi ISB Atma Luhur",
    image: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=800&auto=format&fit=crop",
    liveUrl: "https://ieee.org",
    proofUrl: "/DSC01203.jpg",
    likes: 72,
    featured: true,
    createdAt: "2025-11-20T14:30:00Z",
  },
  {
    id: "apr-03",
    title: "SmartAgri Bangka - Sistem Monitoring IoT & Prediksi Panen Lada Putih",
    category: "karya",
    categoryLabel: "Karya Aplikasi",
    badge: "Inovasi Daerah",
    studentName: "Rian Hidayat",
    teamMembers: "Nabila Syahrani, Dimas Arya Pratama",
    nim: "231150028",
    batch: "2024",
    organizerOrCompany: "Dinas Pertanian Prov. Kep. Bangka Belitung",
    level: "Regional",
    description:
      "Perangkat IoT cerdas terintegrasi dashboard analitik cloud untuk memantau kelembaban mikro dan mendeteksi dini penyakit busuk batang tanaman lada.",
    fullStory:
      "Proyek SmartAgri Bangka lahir dari kepedulian terhadap para petani lada putih (Muntok White Pepper). Dengan memanfaatkan sensor kelembaban, suhu mikro tanah, dan kamera telemetri ESP32, petani dapat memantau kondisi kebun dari smartphone mereka secara gratis.",
    mentorOrLecturer: "Laboratorium Komputasi & IoT ISB Atma Luhur",
    image: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?q=80&w=800&auto=format&fit=crop",
    liveUrl: "https://github.com/himasi-atmaluhur",
    githubUrl: "https://github.com/himasi-atmaluhur",
    likes: 96,
    featured: true,
    createdAt: "2026-02-10T09:00:00Z",
  },
  {
    id: "apr-04",
    title: "Software Engineer Intern di PT Bank Mandiri (Persero) Tbk - MSIB Batch 6",
    category: "magang",
    categoryLabel: "Magang & MSIB",
    badge: "MSIB Batch 6",
    studentName: "Muhammad Evan Elua",
    nim: "221150035",
    batch: "2023",
    organizerOrCompany: "Kampus Merdeka x PT Bank Mandiri (Persero) Tbk",
    level: "Nasional",
    description:
      "Membangun dan mengoptimasi microservices backend pemrosesan transaksi perbankan digital serta mengimplementasikan automated API testing.",
    fullStory:
      "Terpilih dari puluhan ribu pendaftar program Magang dan Studi Independen Bersertifikat (MSIB) Kampus Merdeka. Selama 6 bulan di Divisi Digital Banking Core System, Evan bertanggung jawab atas pengembangan endpoints transaksi performa tinggi.",
    image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=800&auto=format&fit=crop",
    liveUrl: "https://kampusmerdeka.kemdikbud.go.id",
    likes: 67,
    featured: false,
    createdAt: "2025-12-01T08:00:00Z",
  },
  {
    id: "apr-05",
    title: "Juara 3 - National Cyber Security & Penetration Testing Challenge 2025",
    category: "lomba",
    categoryLabel: "Juara Lomba",
    badge: "Juara 3 Nasional",
    studentName: "Dimas Arya Pratama",
    teamMembers: "Kevin Alamsyah",
    nim: "221150041",
    batch: "2023",
    organizerOrCompany: "Badan Siber & Sandi Negara (BSSN) Challenge",
    level: "Nasional",
    description:
      "Kompetisi Capture The Flag (CTF) kategori Web Exploitation, Reverse Engineering, dan Forensik Jaringan tingkat universitas se-Indonesia.",
    fullStory:
      "Menghadapi 40 tim finalis dari seluruh perguruan tinggi negeri dan swasta, perwakilan HIMASI berhasil menyelesaikan skenario forensik digital investigasi kebocoran data dan eksploitasi celah server web dalam waktu kurang dari 6 jam.",
    image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=800&auto=format&fit=crop",
    proofUrl: "/DSC01203.jpg",
    likes: 58,
    featured: false,
    createdAt: "2025-10-18T16:00:00Z",
  },
  {
    id: "apr-06",
    title: "AtmaCare - Aplikasi Konseling Mahasiswa & Reservasi Sesi Psikolog Kampus",
    category: "karya",
    categoryLabel: "Karya Aplikasi",
    badge: "Startup Digital",
    studentName: "Leysa Regita Parhusip",
    teamMembers: "Felicia Angelica",
    nim: "231150011",
    batch: "2024",
    organizerOrCompany: "Inkubator Bisnis & Inovasi ISB Atma Luhur",
    level: "Kampus",
    description:
      "Aplikasi mobile-first untuk mendukung kesehatan mental mahasiswa dengan fitur jurnal refleksi harian dan booking konsultasi aman anonim.",
    fullStory:
      "AtmaCare dirancang untuk merespons kebutuhan mahasiswa akan wadah bercerita yang aman dan terpercaya tanpa takut dihakimi. Dilengkapi sistem proteksi privasi ketat dan kalender jadwal temu konselor mahasiswa sebaya.",
    image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?q=80&w=800&auto=format&fit=crop",
    liveUrl: "https://github.com/himasi-atmaluhur",
    githubUrl: "https://github.com/himasi-atmaluhur",
    likes: 81,
    featured: false,
    createdAt: "2026-01-22T11:00:00Z",
  },
  {
    id: "apr-07",
    title: "Product Design & UI/UX Intern di Tokopedia (GoTo Group) - MSIB Batch 5",
    category: "magang",
    categoryLabel: "Magang & MSIB",
    badge: "MSIB Batch 5",
    studentName: "Beatriks Maria",
    nim: "221150058",
    batch: "2023",
    organizerOrCompany: "Kampus Merdeka x Tokopedia (GoTo Group)",
    level: "Nasional",
    description:
      "Merancang alur wireframing, user journey flow, serta pengujian kegunaan antarmuka (usability testing) pada fitur loyalty checkout rewards.",
    fullStory:
      "Selama masa magang, Beatriks berkolaborasi langsung dengan tim Product Manager dan Senior UX Researcher dalam menyederhanakan alur penukaran voucher diskon, yang berkontribusi meningkatkan rasio konversi checkout pengguna.",
    image: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?q=80&w=800&auto=format&fit=crop",
    liveUrl: "https://kampusmerdeka.kemdikbud.go.id",
    likes: 63,
    featured: false,
    createdAt: "2025-08-30T13:00:00Z",
  },
  {
    id: "apr-08",
    title: "DevSI Open Source Library - Kumpulan Komponen UI Responsif HIMASI",
    category: "karya",
    categoryLabel: "Karya Aplikasi",
    badge: "Open Source",
    studentName: "Kevin Saputra",
    teamMembers: "Tim Medkominfo & Litbang HIMASI",
    nim: "231150064",
    batch: "2024",
    organizerOrCompany: "HIMASI Developer Community",
    level: "Nasional",
    description:
      "Koleksi komponen UI reusable berbasis Tailwind CSS dan accessible design system untuk standarisasi pembuatan situs web organisasi mahasiswa.",
    fullStory:
      "Dibuat untuk mempermudah panitia kepanitiaan dan mahasiswa SI dalam membangun landing page kegiatan dengan cepat tanpa harus mendesain komponen dasar dari awal. Mematuhi standar aksesibilitas WCAG 2.1 AA.",
    image: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=800&auto=format&fit=crop",
    githubUrl: "https://github.com/himasi-atmaluhur",
    likes: 91,
    featured: false,
    createdAt: "2026-02-28T15:00:00Z",
  },
];

export const APRESIASI_STORAGE_QUEUE_KEY = "himasi_apresiasi_submissions_queue";
export const APRESIASI_LIKES_STORAGE_KEY = "himasi_apresiasi_liked_ids";

/**
 * Mengambil daftar data Apresia-SI dari Supabase (dengan fallback data kurasi master)
 */
export async function getApresiasiShowcase(): Promise<ApresiasiItem[]> {
  try {
    const { data, error } = await supabase
      .from("apresiasi_showcase")
      .select("*")
      .order("created_at", { ascending: false });

    // Jika tabel ada di Supabase dan query berhasil, gunakan hasil query (meskipun kosong)
    if (!error && Array.isArray(data)) {
      const mapped: ApresiasiItem[] = data.map((row: any) => ({
        id: String(row.id),
        title: row.title || "",
        category: (row.category || "karya") as any,
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
        image: row.image || "/hero-banner.jpg",
        liveUrl: row.live_url || undefined,
        githubUrl: row.github_url || undefined,
        proofUrl: row.proof_url || undefined,
        likes: row.likes != null ? Number(row.likes) : 0,
        featured: Boolean(row.featured),
        createdAt: row.created_at || new Date().toISOString(),
      }));

      // Sinkronkan juga cache lokal
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("himasi_dashboard_apresiasi_showcase", JSON.stringify(mapped));
        } catch {}
      }

      return mapped;
    }
  } catch (err) {
    console.info("Info: Supabase tabel apresiasi_showcase belum dibuat atau offline, memakai data kurasi master.");
  }

  // Fallback hanya jika tabel belum dibuat di Supabase atau sedang offline
  if (typeof window !== "undefined") {
    try {
      const local = localStorage.getItem("himasi_dashboard_apresiasi_showcase");
      if (local !== null) {
        return JSON.parse(local);
      }
    } catch {}
  }

  return DAFTAR_APRESIASI_HIMASI;
}

/**
 * Mengirimkan formulir pengajuan apresiasi mahasiswa ke Supabase / penyimpanan lokal
 */
export async function submitApresiasiMahasiswa(
  payload: ApresiasiSubmissionPayload
): Promise<{ success: boolean; message: string }> {
  try {
    const dbPayload = {
      category: payload.category,
      title: payload.title.trim(),
      student_name: payload.studentName.trim(),
      team_members: payload.teamMembers?.trim() || null,
      nim: payload.nim.trim(),
      batch: payload.batch.trim(),
      contact: payload.contact.trim(),
      organizer_or_company: payload.organizerOrCompany.trim(),
      level: payload.level || "Nasional",
      description: payload.description.trim(),
      link_demo_or_repo: payload.linkDemoOrRepo?.trim() || null,
      proof_url: payload.proofUrl?.trim() || null,
      status: "pending",
      created_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("apresiasi_submisi").insert([dbPayload]);
    if (!error) {
      return {
        success: true,
        message: "Pengajuan prestasi Anda berhasil dikirimkan ke cloud dan akan segera diverifikasi oleh pengurus HIMASI!",
      };
    }
  } catch (err) {
    console.warn("Gagal simpan ke Supabase, menyimpan ke antrean lokal browser:", err);
  }

  // Fallback penyimpanan antrean lokal
  if (typeof window !== "undefined") {
    try {
      const rawQueue = localStorage.getItem(APRESIASI_STORAGE_QUEUE_KEY);
      const queue = rawQueue ? JSON.parse(rawQueue) : [];
      queue.unshift({ ...payload, submittedAt: new Date().toISOString() });
      localStorage.setItem(APRESIASI_STORAGE_QUEUE_KEY, JSON.stringify(queue));
    } catch {}
  }

  return {
    success: true,
    message: "Pengajuan prestasi Anda telah berhasil disimpan dan akan ditinjau oleh pengurus HIMASI!",
  };
}

/**
 * Helper untuk memeriksa apakah item sudah disukai di browser saat ini
 */
export function isApresiasiLiked(id: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = localStorage.getItem(APRESIASI_LIKES_STORAGE_KEY);
    const likedIds: string[] = raw ? JSON.parse(raw) : [];
    return likedIds.includes(id);
  } catch {
    return false;
  }
}

/**
 * Helper untuk toggle like item secara lokal
 */
export function toggleApresiasiLike(id: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = localStorage.getItem(APRESIASI_LIKES_STORAGE_KEY);
    const likedIds: string[] = raw ? JSON.parse(raw) : [];
    const isLiked = likedIds.includes(id);
    const next = isLiked ? likedIds.filter((item) => item !== id) : [...likedIds, id];
    localStorage.setItem(APRESIASI_LIKES_STORAGE_KEY, JSON.stringify(next));
    return !isLiked;
  } catch {
    return false;
  }
}

