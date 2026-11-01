// Data Master Pengurus HIMASI ISB Atma Luhur Kabinet REKSABUDAYA
export interface PengurusMember {
  id: string;
  nim: string;
  nama: string;
  jabatan: string;
  divisi: string;
  qrToken: string;
  image: string;
  email: string;
  urutan?: number;
}

export const DAFTAR_DIVISI: string[] = [
  "PEMBINA",
  "BPH",
  "MEDKOMINFO",
  "HUMAS",
  "BISNIS KREATIF",
  "PENASIHAT",
];

export const DIVISI_DESCRIPTIONS: Record<string, { title: string; subtitle: string }> = {
  PEMBINA: {
    title: "Pembina HIMASI",
    subtitle:
      "Dosen penasihat dan pengarah kebijakan kemahasiswaan Program Studi Sistem Informasi ISB Atma Luhur.",
  },
  BPH: {
    title: "Badan Pengurus Harian (BPH)",
    subtitle:
      "Pusat kepemimpinan eksekutif, koordinasi internal, tata kelola administrasi, dan perbendaharaan organisasi.",
  },
  MEDKOMINFO: {
    title: "Divisi Medkominfo",
    subtitle:
      "Media Komunikasi & Informasi: publikasi visual, konten kreatif, pengelolaan web, dan aftermovie kegiatan.",
  },
  HUMAS: {
    title: "Divisi Humas",
    subtitle:
      "Hubungan Masyarakat: menjalin kemitraan institusi, komunikasi eksternal, jejaring ormawa, dan hubungan alumni.",
  },
  "BISNIS KREATIF": {
    title: "Divisi Bisnis Kreatif",
    subtitle:
      "Pengembangan kewirausahaan mandiri, penyediaan merchandise resmi HIMASI, dan kemitraan pendanaan kreatif.",
  },
  PENASIHAT: {
    title: "Penasihat Organisasi",
    subtitle:
      "Dewan Penasihat Organisasi dan Demisioner yang mengawal kesinambungan nilai serta tradisi luhur HIMASI.",
  },
};

export const DAFTAR_PENGURUS_HIMASI: PengurusMember[] = [
  // PEMBINA
  {
    id: "pengurus-101",
    nim: "PEMBINA-01",
    nama: "DOSEN PEMBINA I",
    jabatan: "PEMBINA UTAMA HIMASI",
    divisi: "PEMBINA",
    qrToken: "HIMASI-QR-PEMBINA01-DP",
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=800&auto=format&fit=crop",
    email: "pembina@atmaluhur.ac.id",
    urutan: 1,
  },
  {
    id: "pengurus-102",
    nim: "PEMBINA-02",
    nama: "DOSEN PEMBINA II",
    jabatan: "KAPRODI SISTEM INFORMASI",
    divisi: "PEMBINA",
    qrToken: "HIMASI-QR-PEMBINA02-KP",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800&auto=format&fit=crop",
    email: "kaprodi.si@atmaluhur.ac.id",
    urutan: 2,
  },

  // BPH
  {
    id: "pengurus-201",
    nim: "231150001",
    nama: "JORDI VENZEN",
    jabatan: "Ketua Umum HIMASI",
    divisi: "BPH",
    qrToken: "HIMASI-QR-231150001-JV",
    image: "/DSC01203.png",
    email: "jordi.venzen@atmaluhur.ac.id",
    urutan: 1,
  },
  {
    id: "pengurus-202",
    nim: "231150002",
    nama: "MUHAMMAD FADHIL",
    jabatan: "Wakil Ketua Umum",
    divisi: "BPH",
    qrToken: "HIMASI-QR-231150002-MF",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=800&auto=format&fit=crop",
    email: "fadhil@atmaluhur.ac.id",
    urutan: 2,
  },
  {
    id: "pengurus-203",
    nim: "231150003",
    nama: "ANINDYA PUTRI",
    jabatan: "Sekretaris Umum",
    divisi: "BPH",
    qrToken: "HIMASI-QR-231150003-AP",
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=800&auto=format&fit=crop",
    email: "anindya@atmaluhur.ac.id",
    urutan: 3,
  },
  {
    id: "pengurus-204",
    nim: "231150004",
    nama: "ZAHRA SALSABILA",
    jabatan: "Bendahara Umum",
    divisi: "BPH",
    qrToken: "HIMASI-QR-231150004-ZS",
    image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=800&auto=format&fit=crop",
    email: "zahra@atmaluhur.ac.id",
    urutan: 4,
  },

  // MEDKOMINFO
  {
    id: "pengurus-301",
    nim: "231150011",
    nama: "LEYSA REGITA PARHUSIP",
    jabatan: "Kord. Divisi Medkominfo",
    divisi: "MEDKOMINFO",
    qrToken: "HIMASI-QR-231150011-LR",
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=800&auto=format&fit=crop",
    email: "leysa@atmaluhur.ac.id",
    urutan: 1,
  },
  {
    id: "pengurus-302",
    nim: "231150012",
    nama: "MUHAMMAD EVAN ELUA",
    jabatan: "Anggota Medkominfo",
    divisi: "MEDKOMINFO",
    qrToken: "HIMASI-QR-231150012-ME",
    image: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=800&auto=format&fit=crop",
    email: "evan@atmaluhur.ac.id",
    urutan: 2,
  },
  {
    id: "pengurus-303",
    nim: "231150013",
    nama: "BEATRIKS MARIA",
    jabatan: "Anggota Medkominfo",
    divisi: "MEDKOMINFO",
    qrToken: "HIMASI-QR-231150013-BM",
    image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=800&auto=format&fit=crop",
    email: "beatriks@atmaluhur.ac.id",
    urutan: 3,
  },
  {
    id: "pengurus-304",
    nim: "231150014",
    nama: "DHIFA ARYA PRATAMA",
    jabatan: "Anggota Medkominfo",
    divisi: "MEDKOMINFO",
    qrToken: "HIMASI-QR-231150014-DA",
    image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=800&auto=format&fit=crop",
    email: "dhifa@atmaluhur.ac.id",
    urutan: 4,
  },

  // HUMAS
  {
    id: "pengurus-401",
    nim: "231150021",
    nama: "NABILA SYAHRANI",
    jabatan: "Kord. Divisi Humas",
    divisi: "HUMAS",
    qrToken: "HIMASI-QR-231150021-NS",
    image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=800&auto=format&fit=crop",
    email: "nabila@atmaluhur.ac.id",
    urutan: 1,
  },
  {
    id: "pengurus-402",
    nim: "231150022",
    nama: "RIAN PRATAMA",
    jabatan: "Anggota Humas",
    divisi: "HUMAS",
    qrToken: "HIMASI-QR-231150022-RP",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800&auto=format&fit=crop",
    email: "rian@atmaluhur.ac.id",
    urutan: 2,
  },

  // BISNIS KREATIF
  {
    id: "pengurus-501",
    nim: "231150031",
    nama: "FELICIA ANGELICA",
    jabatan: "Kord. Bisnis Kreatif",
    divisi: "BISNIS KREATIF",
    qrToken: "HIMASI-QR-231150031-FA",
    image: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=800&auto=format&fit=crop",
    email: "felicia@atmaluhur.ac.id",
    urutan: 1,
  },
  {
    id: "pengurus-502",
    nim: "231150032",
    nama: "KEVIN SAPUTRA",
    jabatan: "Anggota Bisnis Kreatif",
    divisi: "BISNIS KREATIF",
    qrToken: "HIMASI-QR-231150032-KS",
    image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=800&auto=format&fit=crop",
    email: "kevin@atmaluhur.ac.id",
    urutan: 2,
  },

  // PENASIHAT
  {
    id: "pengurus-601",
    nim: "221150001",
    nama: "DIMAS WAHYU",
    jabatan: "Ketua Dewan Penasihat",
    divisi: "PENASIHAT",
    qrToken: "HIMASI-QR-221150001-DW",
    image: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?q=80&w=800&auto=format&fit=crop",
    email: "dimas@atmaluhur.ac.id",
    urutan: 1,
  },
];

export const PRESET_AVATAR_LIST: string[] = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?q=80&w=800&auto=format&fit=crop",
];

export function generateQrToken(nim: string, nama: string): string {
  const initials = nama
    .trim()
    .split(/\s+/)
    .map((w) => w[0]?.toUpperCase() || "")
    .join("")
    .slice(0, 3);
  const cleanNim = nim.trim() || "00000";
  return `HIMASI-QR-${cleanNim}-${initials || "MB"}`;
}

/**
 * Mendapatkan bobot hierarki jabatan untuk pengurutan otomatis jika nomor urutan belum diset
 */
function getRolePriority(jabatan: string): number {
  const j = (jabatan || "").toUpperCase();

  // Pembina
  if (j.includes("PEMBINA UTAMA") || j.includes("PEMBINA I")) return 1;
  if (j.includes("KAPRODI") || j.includes("PEMBINA II")) return 2;
  if (j.includes("PEMBINA")) return 3;

  // BPH
  if (j.includes("KETUA UMUM") && !j.includes("WAKIL")) return 10;
  if (j.includes("WAKIL KETUA UMUM") || j.includes("WAKIL KETUA")) return 11;
  if (j.includes("SEKRETARIS UMUM") || j.includes("SEKRETARIS 1") || j.includes("SEKRETARIS I")) return 12;
  if (j.includes("BENDAHARA UMUM") || j.includes("BENDAHARA 1") || j.includes("BENDAHARA I")) return 13;
  if (j.includes("SEKRETARIS")) return 14;
  if (j.includes("BENDAHARA")) return 15;

  // Divisi / Penasihat
  if (j.includes("KETUA DEWAN") || j.includes("DEWAN PENASIHAT")) return 20;
  if (j.includes("KOORDINATOR") || j.includes("KORD") || j.includes("KADIV") || j.includes("KETUA")) return 21;
  if (j.includes("WAKIL")) return 22;
  if (j.includes("STAFF AHLI") || j.includes("SENIOR")) return 23;
  if (j.includes("ANGGOTA")) return 24;

  return 50;
}

/**
 * Mengurutkan pengurus: pertama berdasarkan kolom `urutan` (jika > 0),
 * lalu fallback ke bobot hierarki jabatan, dan terakhir nama abjad.
 */
export function sortPengurusMembers(members: PengurusMember[]): PengurusMember[] {
  return [...members].sort((a, b) => {
    const orderA = a.urutan != null && a.urutan > 0 ? a.urutan : 9999;
    const orderB = b.urutan != null && b.urutan > 0 ? b.urutan : 9999;

    if (orderA !== orderB) {
      return orderA - orderB;
    }

    const priorityA = getRolePriority(a.jabatan);
    const priorityB = getRolePriority(b.jabatan);

    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }

    return (a.nama || "").localeCompare(b.nama || "");
  });
}

export const DIVISI_KABINET_ORDER: Record<string, number> = {
  BPH: 1,
  MEDKOMINFO: 2,
  HUMAS: 3,
  "BISNIS KREATIF": 4,
  PENASIHAT: 5,
  PEMBINA: 6,
};

/**
 * Mengurutkan pengurus untuk showcase/marquee Kabinet di Homepage:
 * 1. Prioritas hierarki divisi (BPH -> Medkominfo -> Humas -> Bisnis Kreatif -> Penasihat -> Pembina)
 * 2. Nomor urutan di dalam divisi (urutan 1 = pimpinan/koordinator)
 * 3. Bobot hierarki jabatan (Ketua, Wakil, Sekretaris, Bendahara, dll.)
 * 4. Nama abjad
 */
export function sortKabinetHomepage(members: PengurusMember[]): PengurusMember[] {
  return [...members].sort((a, b) => {
    const divA = DIVISI_KABINET_ORDER[(a.divisi || "").trim().toUpperCase()] || 5;
    const divB = DIVISI_KABINET_ORDER[(b.divisi || "").trim().toUpperCase()] || 5;
    if (divA !== divB) {
      return divA - divB;
    }

    const orderA = a.urutan != null && a.urutan > 0 ? a.urutan : 9999;
    const orderB = b.urutan != null && b.urutan > 0 ? b.urutan : 9999;
    if (orderA !== orderB) {
      return orderA - orderB;
    }

    const priorityA = getRolePriority(a.jabatan);
    const priorityB = getRolePriority(b.jabatan);
    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }

    return (a.nama || "").localeCompare(b.nama || "");
  });
}
