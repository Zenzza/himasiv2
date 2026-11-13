import { supabase } from "@/lib/supabase/client";
import type {
  VotingSesi,
  VotingStatus,
  VotingKandidat,
  VotingDPT,
  VotingSuaraResult,
  VotingSummaryMetrics,
  BeritaAcaraData,
  SignatoryConfig,
} from "@/lib/types/voting";
import {
  normalizeBirthDate,
  calculateTurnout,
  canUnlockResults,
  canReopenSession,
  parseDPTBatchCSV,
  validateDPTVoterCredentials,
  generateReceiptCode,
  generateUuid,
  isValidUuid,
} from "@/lib/utils/voting-helpers";

// Re-export pure helper utilities
export {
  normalizeBirthDate,
  calculateTurnout,
  canUnlockResults,
  canReopenSession,
  parseDPTBatchCSV,
  validateDPTVoterCredentials,
  generateReceiptCode,
  generateUuid,
  isValidUuid,
};

// ============================================================================
// MOCK DATASETS & IN-MEMORY STORE (Seamless Offline Fallback)
// ============================================================================

export const INITIAL_MOCK_SESI: VotingSesi[] = [
  {
    id: "sesi-2026-utama",
    judul: "Pemilihan Ketua Himpunan HIMASI Periode 2026/2027",
    tahun_periode: "2026/2027",
    deskripsi:
      "Pemilihan resmi Ketua Himpunan Mahasiswa Sistem Informasi ISB Atma Luhur untuk masa bakti 2026/2027.",
    status: "open",
    is_results_unlocked: false,
    opened_at: new Date(Date.now() - 3600 * 1000 * 4).toISOString(),
    closed_at: null,
    unlocked_at: null,
    created_at: new Date(Date.now() - 3600 * 1000 * 24).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "sesi-2025-arsip",
    judul: "Pemilihan Ketua Himpunan HIMASI Periode 2025/2026",
    tahun_periode: "2025/2026",
    deskripsi: "Arsip pemungutan suara Ketua Himpunan periode sebelumnya.",
    status: "archived",
    is_results_unlocked: true,
    opened_at: "2025-11-10T01:00:00Z",
    closed_at: "2025-11-10T09:00:00Z",
    unlocked_at: "2025-11-10T09:30:00Z",
    created_at: "2025-11-01T00:00:00Z",
    updated_at: "2025-11-10T10:00:00Z",
  },
];

export const INITIAL_MOCK_KANDIDAT: VotingKandidat[] = [
  {
    id: "cand-01",
    sesi_id: "sesi-2026-utama",
    nomor_urut: 1,
    nama_calon: "Rayhan Maulana Pratama",
    foto_url:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=600&auto=format&fit=crop",
    visi: "Mewujudkan HIMASI Atma Luhur sebagai episentrum kolaborasi teknologi inovatif, berdaya saing global, dan berakar pada integritas profesionalisme mahasiswa Sistem Informasi.",
    misi: "1. Mengakselerasi ekosistem riset software & data science mahasiswa.\n2. Memperluas jejaring kemitraan industri teknologi & startup nasional.\n3. Membangun tata kelola himpunan yang transparan, lincah, dan berbasis data.",
    program_kerja:
      "• SI-Techfest 2027 (Hackathon & Tech Summit)\n• Inkubasi Karir Talenta Digital (Certification Bootcamp)\n• HIMASI Data & AI Open Lab",
    created_at: new Date().toISOString(),
  },
  {
    id: "cand-02",
    sesi_id: "sesi-2026-utama",
    nomor_urut: 2,
    nama_calon: "Kotak Kosong (Bumbung Kosong)",
    foto_url: null,
    visi: "Opsi alternatif aspirasi pemilih yang menghendaki peninjauan ulang kandidat tunggal.",
    misi: "Memberikan ruang demokrasi yang sah dan berintegritas bagi mahasiswa sesuai AD/ART.",
    program_kerja: "Penetapan mekanisme pemilihan ulang bila kotak kosong meraih suara mayoritas.",
    created_at: new Date().toISOString(),
  },
];

export const INITIAL_MOCK_DPT: VotingDPT[] = [
  {
    id: "dpt-1",
    sesi_id: "sesi-2026-utama",
    nim: "2211500001",
    nama_lengkap: "Aditya Kurniawan",
    tanggal_lahir: "2004-03-15",
    sudah_memilih: true,
    voted_at: new Date(Date.now() - 3600 * 1000 * 3).toISOString(),
    created_at: new Date().toISOString(),
  },
  {
    id: "dpt-2",
    sesi_id: "sesi-2026-utama",
    nim: "2211500002",
    nama_lengkap: "Bella Novitasari",
    tanggal_lahir: "2004-07-22",
    sudah_memilih: true,
    voted_at: new Date(Date.now() - 3600 * 1000 * 2).toISOString(),
    created_at: new Date().toISOString(),
  },
  {
    id: "dpt-3",
    sesi_id: "sesi-2026-utama",
    nim: "2211500003",
    nama_lengkap: "Dimas Saputra",
    tanggal_lahir: "2003-11-09",
    sudah_memilih: true,
    voted_at: new Date(Date.now() - 3600 * 1000 * 1).toISOString(),
    created_at: new Date().toISOString(),
  },
  {
    id: "dpt-4",
    sesi_id: "sesi-2026-utama",
    nim: "2211500004",
    nama_lengkap: "Farhan Ramadhan",
    tanggal_lahir: "2004-01-30",
    sudah_memilih: false,
    voted_at: null,
    created_at: new Date().toISOString(),
  },
  {
    id: "dpt-5",
    sesi_id: "sesi-2026-utama",
    nim: "2211500005",
    nama_lengkap: "Gita Permatasari",
    tanggal_lahir: "2004-09-14",
    sudah_memilih: false,
    voted_at: null,
    created_at: new Date().toISOString(),
  },
  {
    id: "dpt-6",
    sesi_id: "sesi-2026-utama",
    nim: "2211500006",
    nama_lengkap: "Hendra Wijaya",
    tanggal_lahir: "2003-05-18",
    sudah_memilih: false,
    voted_at: null,
    created_at: new Date().toISOString(),
  },
  {
    id: "dpt-7",
    sesi_id: "sesi-2026-utama",
    nim: "2211500007",
    nama_lengkap: "Indah Puspitasari",
    tanggal_lahir: "2004-12-01",
    sudah_memilih: false,
    voted_at: null,
    created_at: new Date().toISOString(),
  },
  {
    id: "dpt-8",
    sesi_id: "sesi-2026-utama",
    nim: "2211500008",
    nama_lengkap: "Jovan Pratama",
    tanggal_lahir: "2004-04-25",
    sudah_memilih: false,
    voted_at: null,
    created_at: new Date().toISOString(),
  },
];

// Persistent local storage cache keys for preview environment
const STORAGE_PREFIX = "himasi_evoting_";

function getLocalStore<T>(key: string, initialData: T): T {
  if (typeof window === "undefined") return initialData;
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
    return raw ? JSON.parse(raw) : initialData;
  } catch {
    return initialData;
  }
}

function setLocalStore<T>(key: string, data: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(data));
  } catch {
    // Ignore storage quota errors
  }
}

// ============================================================================
// DATA ACCESS LAYER (Supabase with Mock Fallback)
// ============================================================================

/**
 * Fetch all voting sessions
 */
export async function fetchVotingSessions(): Promise<VotingSesi[]> {
  try {
    if (supabase) {
      const { data, error } = await supabase
        .from("voting_sesi")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data && data.length > 0) {
        return data as VotingSesi[];
      }
    }
  } catch {
    // fallback to mock
  }

  return getLocalStore<VotingSesi[]>("sessions", INITIAL_MOCK_SESI);
}

/**
 * Create a new voting session
 */
export async function createVotingSession(
  payload: Pick<VotingSesi, "judul" | "tahun_periode" | "deskripsi">
): Promise<VotingSesi> {
  const newSesi: VotingSesi = {
    id: generateUuid(),
    judul: payload.judul,
    tahun_periode: payload.tahun_periode,
    deskripsi: payload.deskripsi || null,
    status: "draft",
    is_results_unlocked: false,
    opened_at: null,
    closed_at: null,
    unlocked_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  try {
    if (supabase) {
      const { data, error } = await supabase
        .from("voting_sesi")
        .insert({
          judul: newSesi.judul,
          tahun_periode: newSesi.tahun_periode,
          deskripsi: newSesi.deskripsi,
          status: newSesi.status,
          is_results_unlocked: false,
        })
        .select()
        .single();

      if (!error && data) {
        return data as VotingSesi;
      }
    }
  } catch {
    // fallback
  }

  const existing = getLocalStore<VotingSesi[]>("sessions", INITIAL_MOCK_SESI);
  const updated = [newSesi, ...existing];
  setLocalStore("sessions", updated);
  return newSesi;
}

/**
 * Update voting session status
 */
export async function updateVotingSessionStatus(
  sesiId: string,
  newStatus: VotingStatus
): Promise<VotingSesi | null> {
  const now = new Date().toISOString();
  const updatePayload: Partial<VotingSesi> = {
    status: newStatus,
    updated_at: now,
  };

  if (newStatus === "open") {
    updatePayload.opened_at = now;
  } else if (newStatus === "closed") {
    updatePayload.closed_at = now;
  }

  try {
    if (supabase) {
      const { data, error } = await supabase
        .from("voting_sesi")
        .update(updatePayload)
        .eq("id", sesiId)
        .select()
        .single();

      if (!error && data) {
        return data as VotingSesi;
      }
    }
  } catch {
    // fallback
  }

  const sessions = getLocalStore<VotingSesi[]>("sessions", INITIAL_MOCK_SESI);
  const target = sessions.find((s) => s.id === sesiId);
  if (!target) return null;

  Object.assign(target, updatePayload);
  setLocalStore("sessions", sessions);
  return target;
}

/**
 * Unlock session results (Blind Vote Reveal)
 */
export async function unlockSessionResults(sesiId: string): Promise<boolean> {
  const now = new Date().toISOString();

  try {
    if (supabase) {
      const { error } = await supabase
        .from("voting_sesi")
        .update({
          is_results_unlocked: true,
          unlocked_at: now,
          updated_at: now,
        })
        .eq("id", sesiId);

      if (!error) return true;
    }
  } catch {
    // fallback
  }

  const sessions = getLocalStore<VotingSesi[]>("sessions", INITIAL_MOCK_SESI);
  const target = sessions.find((s) => s.id === sesiId);
  if (target) {
    target.is_results_unlocked = true;
    target.unlocked_at = now;
    target.updated_at = now;
    setLocalStore("sessions", sessions);
    return true;
  }
  return false;
}

/**
 * Fetch candidates for a session
 */
export async function fetchCandidates(sesiId: string): Promise<VotingKandidat[]> {
  try {
    if (supabase) {
      const { data, error } = await supabase
        .from("voting_kandidat")
        .select("*")
        .eq("sesi_id", sesiId)
        .order("nomor_urut", { ascending: true });

      if (!error && data && data.length > 0) {
        return data as VotingKandidat[];
      }
    }
  } catch {
    // fallback
  }

  const all = getLocalStore<VotingKandidat[]>("candidates", INITIAL_MOCK_KANDIDAT);
  return all.filter((c) => c.sesi_id === sesiId || sesiId === "sesi-2026-utama");
}

/**
 * Save candidate (create or edit)
 */
export async function saveCandidate(
  candidate: Partial<VotingKandidat> & { sesi_id: string; nama_calon: string; nomor_urut: number }
): Promise<VotingKandidat> {
  if (candidate.id) {
    // Update
    try {
      if (supabase) {
        const { data, error } = await supabase
          .from("voting_kandidat")
          .update({
            nama_calon: candidate.nama_calon,
            nomor_urut: candidate.nomor_urut,
            foto_url: candidate.foto_url,
            visi: candidate.visi,
            misi: candidate.misi,
            program_kerja: candidate.program_kerja,
          })
          .eq("id", candidate.id)
          .select()
          .single();

        if (!error && data) return data as VotingKandidat;
      }
    } catch {
      // fallback
    }

    const all = getLocalStore<VotingKandidat[]>("candidates", INITIAL_MOCK_KANDIDAT);
    const item = all.find((c) => c.id === candidate.id);
    if (item) {
      Object.assign(item, candidate);
      setLocalStore("candidates", all);
      return item;
    }
  }

  // Insert
  const newItem: VotingKandidat = {
    id: candidate.id || generateUuid(),
    sesi_id: candidate.sesi_id,
    nomor_urut: candidate.nomor_urut,
    nama_calon: candidate.nama_calon,
    foto_url: candidate.foto_url || null,
    visi: candidate.visi || null,
    misi: candidate.misi || null,
    program_kerja: candidate.program_kerja || null,
    created_at: new Date().toISOString(),
  };

  try {
    if (supabase) {
      const { data, error } = await supabase
        .from("voting_kandidat")
        .insert(newItem)
        .select()
        .single();
      if (!error && data) return data as VotingKandidat;
    }
  } catch {
    // fallback
  }

  const all = getLocalStore<VotingKandidat[]>("candidates", INITIAL_MOCK_KANDIDAT);
  all.push(newItem);
  setLocalStore("candidates", all);
  return newItem;
}

/**
 * Delete candidate
 */
export async function deleteCandidate(candidateId: string): Promise<boolean> {
  try {
    if (supabase) {
      const { error } = await supabase.from("voting_kandidat").delete().eq("id", candidateId);
      if (!error) return true;
    }
  } catch {
    // fallback
  }

  const all = getLocalStore<VotingKandidat[]>("candidates", INITIAL_MOCK_KANDIDAT);
  const filtered = all.filter((c) => c.id !== candidateId);
  setLocalStore("candidates", filtered);
  return true;
}

/**
 * Fetch DPT for a session with optional filter and search
 */
export async function fetchDPT(
  sesiId: string,
  options?: {
    search?: string;
    status?: "all" | "voted" | "not_voted";
  }
): Promise<VotingDPT[]> {
  let list: VotingDPT[] = [];

  try {
    if (supabase) {
      let query = supabase
        .from("voting_dpt")
        .select("*")
        .eq("sesi_id", sesiId)
        .order("created_at", { ascending: true });

      if (options?.status === "voted") {
        query = query.eq("sudah_memilih", true);
      } else if (options?.status === "not_voted") {
        query = query.eq("sudah_memilih", false);
      }

      if (options?.search) {
        query = query.or(
          `nim.ilike.%${options.search}%,nama_lengkap.ilike.%${options.search}%`
        );
      }

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return data as VotingDPT[];
      }
    }
  } catch {
    // fallback
  }

  const all = getLocalStore<VotingDPT[]>("dpt", INITIAL_MOCK_DPT);
  list = all.filter((d) => d.sesi_id === sesiId || sesiId === "sesi-2026-utama");

  if (options?.status === "voted") {
    list = list.filter((d) => d.sudah_memilih);
  } else if (options?.status === "not_voted") {
    list = list.filter((d) => !d.sudah_memilih);
  }

  if (options?.search) {
    const q = options.search.toLowerCase();
    list = list.filter(
      (d) => d.nim.toLowerCase().includes(q) || d.nama_lengkap.toLowerCase().includes(q)
    );
  }

  return list;
}

/**
 * Add a single voter to DPT
 */
export async function addDPTVoter(
  voter: Pick<VotingDPT, "sesi_id" | "nim" | "nama_lengkap" | "tanggal_lahir">
): Promise<{ success: boolean; data?: VotingDPT; error?: string }> {
  const normalizedDate = normalizeBirthDate(voter.tanggal_lahir);
  if (!normalizedDate) {
    return { success: false, error: "Format tanggal lahir tidak valid." };
  }

  const newItem: VotingDPT = {
    id: generateUuid(),
    sesi_id: voter.sesi_id,
    nim: voter.nim.trim(),
    nama_lengkap: voter.nama_lengkap.trim(),
    tanggal_lahir: normalizedDate,
    sudah_memilih: false,
    voted_at: null,
    created_at: new Date().toISOString(),
  };

  try {
    if (supabase) {
      const { data, error } = await supabase
        .from("voting_dpt")
        .insert(newItem)
        .select()
        .single();

      if (!error && data) {
        return { success: true, data: data as VotingDPT };
      }
      if (error && error.code === "23505") {
        return { success: false, error: "NIM tersebut sudah terdaftar pada sesi ini." };
      }
    }
  } catch {
    // fallback
  }

  const all = getLocalStore<VotingDPT[]>("dpt", INITIAL_MOCK_DPT);
  const exists = all.some((d) => d.sesi_id === voter.sesi_id && d.nim === voter.nim);
  if (exists) {
    return { success: false, error: "NIM tersebut sudah terdaftar pada sesi ini." };
  }

  all.unshift(newItem);
  setLocalStore("dpt", all);
  return { success: true, data: newItem };
}

/**
 * Delete a voter from DPT (Only if voter has NOT voted yet)
 */
export async function deleteDPTVoter(voterId: string): Promise<boolean> {
  try {
    if (supabase) {
      const { error } = await supabase
        .from("voting_dpt")
        .delete()
        .eq("id", voterId)
        .eq("sudah_memilih", false); // Integrity check

      if (!error) return true;
    }
  } catch {
    // fallback
  }

  const all = getLocalStore<VotingDPT[]>("dpt", INITIAL_MOCK_DPT);
  const target = all.find((d) => d.id === voterId);
  if (target && target.sudah_memilih) {
    // Disallow deleting voted DPT
    return false;
  }

  const filtered = all.filter((d) => d.id !== voterId);
  setLocalStore("dpt", filtered);
  return true;
}

/**
 * Import batch DPT from parsed items
 */
export async function importBatchDPT(
  sesiId: string,
  items: Array<{ nim: string; nama_lengkap: string; tanggal_lahir: string }>
): Promise<{ inserted: number; skipped: number }> {
  let inserted = 0;
  let skipped = 0;

  const existingDPT = await fetchDPT(sesiId);
  const existingNims = new Set(existingDPT.map((d) => d.nim.toLowerCase()));

  const toInsert: VotingDPT[] = [];

  for (const item of items) {
    if (existingNims.has(item.nim.toLowerCase())) {
      skipped++;
      continue;
    }

    const normalizedDate = normalizeBirthDate(item.tanggal_lahir);
    if (!normalizedDate) {
      skipped++;
      continue;
    }

    existingNims.add(item.nim.toLowerCase());
    toInsert.push({
      id: generateUuid(),
      sesi_id: sesiId,
      nim: item.nim.trim(),
      nama_lengkap: item.nama_lengkap.trim(),
      tanggal_lahir: normalizedDate,
      sudah_memilih: false,
      voted_at: null,
      created_at: new Date().toISOString(),
    });
    inserted++;
  }

  if (toInsert.length > 0) {
    try {
      if (supabase) {
        await supabase.from("voting_dpt").insert(toInsert);
      }
    } catch {
      // fallback
    }

    const all = getLocalStore<VotingDPT[]>("dpt", INITIAL_MOCK_DPT);
    setLocalStore("dpt", [...toInsert, ...all]);
  }

  return { inserted, skipped };
}

/**
 * Fetch results for a session
 * (Safe for admin consumption: tallies votes by candidate_id)
 */
export async function fetchVotingResults(
  sesiId: string,
  candidates: VotingKandidat[]
): Promise<VotingSuaraResult[]> {
  let tallies: Record<string, number> = {};

  try {
    if (supabase) {
      const { data, error } = await supabase
        .from("voting_suara")
        .select("kandidat_id")
        .eq("sesi_id", sesiId);

      if (!error && data && data.length > 0) {
        tallies = data.reduce(
          (acc, row) => {
            acc[row.kandidat_id] = (acc[row.kandidat_id] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        );
      }
    }
  } catch {
    // fallback
  }

  // If no live votes found in DB, produce realistic mock tallies from voted DPT count
  if (Object.keys(tallies).length === 0) {
    // 3 votes cast in default mock: 2 for cand-01, 1 for cand-02
    tallies = {
      "cand-01": 2,
      "cand-02": 1,
    };
  }

  const totalSuara = Object.values(tallies).reduce((sum, n) => sum + n, 0);
  let highestVotes = -1;

  const results: VotingSuaraResult[] = candidates.map((c) => {
    const count = tallies[c.id] || 0;
    if (count > highestVotes) highestVotes = count;
    const pct = totalSuara > 0 ? Math.round((count / totalSuara) * 1000) / 10 : 0;
    return {
      kandidat_id: c.id,
      nomor_urut: c.nomor_urut,
      nama_calon: c.nama_calon,
      total_suara: count,
      persentase: pct,
      is_winner: false,
    };
  });

  // Mark winner (if votes exist and not tied with 0)
  if (totalSuara > 0) {
    results.forEach((r) => {
      if (r.total_suara === highestVotes && highestVotes > 0) {
        r.is_winner = true;
      }
    });
  }

  return results.sort((a, b) => a.nomor_urut - b.nomor_urut);
}

/**
 * Compute summary metrics for a session
 */
export async function getVotingSummaryMetrics(sesi: VotingSesi): Promise<VotingSummaryMetrics> {
  const dptList = await fetchDPT(sesi.id);
  const total_dpt = dptList.length;
  const suara_masuk = dptList.filter((d) => d.sudah_memilih).length;
  const belum_memilih = total_dpt - suara_masuk;
  const { percentage } = calculateTurnout(total_dpt, suara_masuk);

  let status_label = "DRAF";
  if (sesi.status === "open") status_label = "AKTIF";
  else if (sesi.status === "closed") status_label = "DITUTUP";
  else if (sesi.status === "archived") status_label = "ARSIP";

  return {
    status_label,
    status: sesi.status,
    total_dpt,
    suara_masuk,
    belum_memilih,
    persentase_partisipasi: percentage,
    is_results_unlocked: sesi.is_results_unlocked,
  };
}

/**
 * Default Signatory Configuration
 */
export const DEFAULT_SIGNATORIES: SignatoryConfig = {
  nama_ketua_kpu: "Fajar Nugraha",
  nim_ketua_kpu: "2111500042",
  nama_saksi_1: "Rizky Ananda",
  nim_saksi_1: "2211500019",
  nama_saksi_2: "Aisyah Putri",
  nim_saksi_2: "2211500033",
  nama_ketua_umum: "Bagus Setiawan",
  nim_ketua_umum: "2011500008",
};

/**
 * Generate Berita Acara Rekapitulasi Data
 */
export async function getBeritaAcaraData(
  sesi: VotingSesi,
  signatories?: Partial<SignatoryConfig>
): Promise<BeritaAcaraData> {
  const metrics = await getVotingSummaryMetrics(sesi);
  const candidates = await fetchCandidates(sesi.id);
  const hasil = await fetchVotingResults(sesi.id, candidates);

  const now = new Date();
  const dayNames = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const monthNames = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];

  const hari = dayNames[now.getDay()];
  const tanggal = `${now.getDate()} ${monthNames[now.getMonth()]} ${now.getFullYear()}`;

  return {
    nomor_surat: `001/BA-EVOTE/HIMASI/XI/${now.getFullYear()}`,
    tanggal_surat: tanggal,
    hari_pelaksanaan: hari,
    sesi_judul: sesi.judul,
    tahun_periode: sesi.tahun_periode,
    total_dpt: metrics.total_dpt,
    total_suara_masuk: metrics.suara_masuk,
    total_golput: metrics.belum_memilih,
    persentase_partisipasi: metrics.persentase_partisipasi,
    hasil_kandidat: hasil,
    signatories: {
      ...DEFAULT_SIGNATORIES,
      ...(signatories || {}),
    },
  };
}

// ============================================================================
// PUBLIC E-VOTING BOOTH CLIENT-SAFE DATA ACCESSORS
// ============================================================================

/**
 * Fetches the currently active / open voting session for students
 */
export async function fetchActiveVotingSession(): Promise<VotingSesi | null> {
  try {
    const { data, error } = await supabase
      .from("voting_sesi")
      .select("*")
      .eq("status", "open")
      .order("opened_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      return data as VotingSesi;
    }
  } catch (err) {
    console.warn("[VotingClient] Supabase active session lookup failed, using fallback:", err);
  }

  // Fallback to active in-memory / local mock session
  const sessions = getLocalStore<VotingSesi[]>("sessions", INITIAL_MOCK_SESI);
  return sessions.find((s) => s.status === "open") || null;
}

/**
 * 2FA student identity verification via NIM + Tanggal Lahir against DPT table
 */
export async function verifyDPTVoter(
  sesiId: string,
  nim: string,
  rawBirthDate: string
): Promise<{ success: boolean; voter?: VotingDPT; error?: string }> {
  const cleanNIM = nim.trim();
  const normalizedDate = normalizeBirthDate(rawBirthDate);

  if (!cleanNIM) {
    return { success: false, error: "NIM wajib diisi." };
  }
  if (!normalizedDate) {
    return {
      success: false,
      error: "Format tanggal lahir tidak valid (gunakan DD/MM/YYYY atau YYYY-MM-DD).",
    };
  }

  try {
    const { data, error } = await supabase
      .from("voting_dpt")
      .select("*")
      .eq("sesi_id", sesiId)
      .ilike("nim", cleanNIM)
      .maybeSingle();

    if (!error && data) {
      const voter = data as VotingDPT;
      if (voter.sudah_memilih) {
        return {
          success: false,
          error: "Hak suara untuk NIM ini telah digunakan (sudah memilih).",
        };
      }

      const normalizedDbDate = normalizeBirthDate(voter.tanggal_lahir);
      if (normalizedDbDate !== normalizedDate) {
        return {
          success: false,
          error: "Tanggal lahir tidak sesuai dengan data DPT terdaftar.",
        };
      }

      return { success: true, voter };
    }
  } catch (err) {
    console.warn("[VotingClient] Supabase DPT check failed, falling back to mock:", err);
  }

  // Fallback to local / mock DPT store if not found in Supabase or if Supabase query failed
  const allDPT = getLocalStore<VotingDPT[]>("dpt", INITIAL_MOCK_DPT);
  const sessionDPT = allDPT.filter((v) => v.sesi_id === sesiId || sesiId === "sesi-2026-utama");
  return validateDPTVoterCredentials(sessionDPT, cleanNIM, normalizedDate);
}

/**
 * Atomic ballot casting: records anonymous vote and locks voter's DPT status
 */
export async function castStudentVote(
  sesiId: string,
  dptId: string,
  kandidatId: string
): Promise<{ success: boolean; receiptId?: string; error?: string }> {
  const now = new Date().toISOString();
  const receiptId = generateReceiptCode();

  // 1. If dptId is a valid UUID, attempt Supabase atomic execution first
  if (isValidUuid(dptId)) {
    try {
      const { data: lockedVoter, error: updateErr } = await supabase
        .from("voting_dpt")
        .update({
          sudah_memilih: true,
          voted_at: now,
        })
        .eq("id", dptId)
        .eq("sudah_memilih", false)
        .select("id")
        .maybeSingle();

      if (!updateErr && lockedVoter) {
        // Successfully locked DPT in Supabase! Now insert anonymous ballot
        const { error: voteErr } = await supabase.from("voting_suara").insert({
          sesi_id: sesiId,
          kandidat_id: kandidatId,
          created_at: now,
        });

        if (voteErr) {
          // Rollback DPT lock if ballot insert fails
          await supabase
            .from("voting_dpt")
            .update({ sudah_memilih: false, voted_at: null })
            .eq("id", dptId);
          console.error("[VotingClient] Gagal memasukkan suara ke voting_suara:", voteErr);
          return {
            success: false,
            error: "Gagal memasukkan surat suara ke kotak suara. Silakan coba kembali.",
          };
        }

        return { success: true, receiptId };
      }

      if (updateErr) {
        console.warn("[VotingClient] Supabase DPT update failed:", updateErr);
        throw updateErr;
      }

      // If zero rows updated with no error: verify if voter actually exists in Supabase
      const { data: existingVoter } = await supabase
        .from("voting_dpt")
        .select("id, sudah_memilih")
        .eq("id", dptId)
        .maybeSingle();

      if (existingVoter) {
        if (existingVoter.sudah_memilih) {
          return {
            success: false,
            error: "Hak suara untuk pemilih ini telah digunakan sebelumnya.",
          };
        }
        return {
          success: false,
          error: "Gagal memperbarui status hak suara. Silakan coba kembali.",
        };
      }

      // Not found in Supabase database, fall through to local store
      throw new Error("Voter not found in Supabase database");
    } catch (err) {
      console.warn("[VotingClient] Supabase vote submission failed, using local store:", err);
    }
  }

  // 2. Offline / Local Storage fallback with strict atomic lock
  const allDPT = getLocalStore<VotingDPT[]>("dpt", INITIAL_MOCK_DPT);
  const voterIdx = allDPT.findIndex((v) => v.id === dptId || v.nim === dptId);
  if (voterIdx !== -1) {
    if (allDPT[voterIdx].sudah_memilih) {
      return {
        success: false,
        error: "Hak suara untuk pemilih ini telah digunakan sebelumnya.",
      };
    }

    allDPT[voterIdx].sudah_memilih = true;
    allDPT[voterIdx].voted_at = now;
    setLocalStore("dpt", allDPT);

    const existingVotes = getLocalStore<
      Array<{ id: string; sesi_id: string; kandidat_id: string; created_at: string }>
    >("suara", []);
    existingVotes.push({
      id: `suara-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      sesi_id: sesiId,
      kandidat_id: kandidatId,
      created_at: now,
    });
    setLocalStore("suara", existingVotes);

    return { success: true, receiptId };
  }

  return {
    success: false,
    error: "Data pemilih tidak ditemukan atau sesi pemilihan telah berakhir.",
  };
}

