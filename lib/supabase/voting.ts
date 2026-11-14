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
// DATA STORAGE & EMPTY INITIALIZERS (Pure Database Mode - No Mock Fixtures)
// ============================================================================

export const INITIAL_MOCK_SESI: VotingSesi[] = [];
export const INITIAL_MOCK_KANDIDAT: VotingKandidat[] = [];
export const INITIAL_MOCK_DPT: VotingDPT[] = [];

// Persistent local storage cache keys for preview environment
const STORAGE_PREFIX = "himasi_evoting_";

function getLocalStore<T>(key: string, initialData: T): T {
  if (typeof window === "undefined") return initialData;
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
    if (!raw) return initialData;
    const parsed = JSON.parse(raw);
    // Otomatis bersihkan sesi tiruan lama (sesi-2026-utama / sesi-2025-arsip) dari cache klien
    if (Array.isArray(parsed)) {
      const filtered = parsed.filter(
        (item: { id?: string; sesi_id?: string }) =>
          item?.id !== "sesi-2026-utama" &&
          item?.id !== "sesi-2025-arsip" &&
          item?.sesi_id !== "sesi-2026-utama" &&
          item?.sesi_id !== "sesi-2025-arsip"
      );
      if (filtered.length !== parsed.length) {
        localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(filtered));
      }
      return filtered as T;
    }
    return parsed;
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
// DATA ACCESS LAYER (Supabase with Local Cache Fallback)
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

      if (!error && Array.isArray(data)) {
        if (data.length > 0) {
          // Cloud Supabase has live sessions: update localStore cache
          setLocalStore("sessions", data);
          return data as VotingSesi[];
        }

        // Supabase has 0 rows: check if there are local sessions from prior input
        const local = getLocalStore<VotingSesi[]>("sessions", []);
        if (local.length > 0) {
          return local;
        }

        return [];
      }

      if (error) {
        console.warn("[Voting] Supabase fetchVotingSessions query error:", error.message);
      }
    }
  } catch (err) {
    console.warn("[Voting] Exception in fetchVotingSessions:", err);
  }

  return getLocalStore<VotingSesi[]>("sessions", []);
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

  let savedToSupabase = false;

  try {
    if (supabase) {
      const { data, error } = await supabase
        .from("voting_sesi")
        .insert({
          id: newSesi.id,
          judul: newSesi.judul,
          tahun_periode: newSesi.tahun_periode,
          deskripsi: newSesi.deskripsi,
          status: newSesi.status,
          is_results_unlocked: false,
        })
        .select()
        .single();

      if (!error && data) {
        savedToSupabase = true;
        // Merge with existing localStore cache
        const existing = getLocalStore<VotingSesi[]>("sessions", []);
        const filtered = existing.filter((s) => s.id !== data.id && s.id !== "sesi-2026-utama");
        setLocalStore("sessions", [data as VotingSesi, ...filtered]);
        return data as VotingSesi;
      }

      if (error) {
        console.error("[Voting] Gagal insert voting_sesi ke Supabase:", error);
      }
    }
  } catch (err) {
    console.error("[Voting] Exception insert voting_sesi:", err);
  }

  // Fallback to localStore if Supabase is offline or RLS is pending
  const existing = getLocalStore<VotingSesi[]>("sessions", []);
  const updated = [newSesi, ...existing.filter((s) => s.id !== newSesi.id)];
  setLocalStore("sessions", updated);
  return newSesi;
}

/**
 * Delete voting session and its cascading data
 */
export async function deleteVotingSession(sesiId: string): Promise<boolean> {
  try {
    if (supabase && isValidUuid(sesiId)) {
      const { error } = await supabase.from("voting_sesi").delete().eq("id", sesiId);
      if (error) {
        console.error("[Voting] Gagal menghapus sesi dari Supabase:", error);
      }
    }
  } catch (err) {
    console.error("[Voting] Exception delete voting_sesi:", err);
  }

  // Clean from localStore
  const sessions = getLocalStore<VotingSesi[]>("sessions", []);
  setLocalStore("sessions", sessions.filter((s) => s.id !== sesiId));

  const cand = getLocalStore<VotingKandidat[]>("candidates", []);
  setLocalStore("candidates", cand.filter((c) => c.sesi_id !== sesiId));

  const dpt = getLocalStore<VotingDPT[]>("dpt", []);
  setLocalStore("dpt", dpt.filter((d) => d.sesi_id !== sesiId));

  return true;
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

  const sessions = getLocalStore<VotingSesi[]>("sessions", []);
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

  const sessions = getLocalStore<VotingSesi[]>("sessions", []);
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

      if (!error && Array.isArray(data)) {
        if (data.length > 0) {
          return data as VotingKandidat[];
        }
        // If 0 candidates found in Supabase for this session, check localStore
        const all = getLocalStore<VotingKandidat[]>("candidates", []);
        return all.filter((c) => c.sesi_id === sesiId);
      }

      if (error) {
        console.warn("[Voting] Supabase fetchCandidates query error:", error.message);
      }
    }
  } catch (err) {
    console.warn("[Voting] Exception in fetchCandidates:", err);
  }

  const all = getLocalStore<VotingKandidat[]>("candidates", []);
  return all.filter((c) => c.sesi_id === sesiId);
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

    const all = getLocalStore<VotingKandidat[]>("candidates", []);
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

  const all = getLocalStore<VotingKandidat[]>("candidates", []);
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

  const all = getLocalStore<VotingKandidat[]>("candidates", []);
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
      if (!error && Array.isArray(data)) {
        if (data.length > 0) {
          return data as VotingDPT[];
        }
        // If 0 DPT in Supabase for this session, check localStore
        const all = getLocalStore<VotingDPT[]>("dpt", []);
        list = all.filter((d) => d.sesi_id === sesiId);

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

      if (error) {
        console.warn("[Voting] Supabase fetchDPT query error:", error.message);
      }
    }
  } catch (err) {
    console.warn("[Voting] Exception in fetchDPT:", err);
  }

  const all = getLocalStore<VotingDPT[]>("dpt", []);
  list = all.filter((d) => d.sesi_id === sesiId);

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

  const all = getLocalStore<VotingDPT[]>("dpt", []);
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

  const all = getLocalStore<VotingDPT[]>("dpt", []);
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

    const all = getLocalStore<VotingDPT[]>("dpt", []);
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
// DIAGNOSTICS & CLOUD SYNCHRONIZATION HELPERS
// ============================================================================

/**
 * Diagnostic check to verify whether Supabase E-Voting tables permit live inserts
 * or if they are blocked by Row Level Security (RLS error 42501).
 */
export async function checkVotingRLSStatus(): Promise<{
  isReady: boolean;
  needsMigration: boolean;
  message: string;
}> {
  try {
    if (!supabase) {
      return {
        isReady: false,
        needsMigration: false,
        message: "Supabase client tidak terkonfigurasi.",
      };
    }

    // Attempt a probe insert to verify RLS permissions
    const probeId = generateUuid();
    const { error: insertErr } = await supabase.from("voting_sesi").insert({
      id: probeId,
      judul: "__PROBE_HEALTHCHECK__",
      tahun_periode: "PROBE",
      status: "draft",
    });

    if (insertErr) {
      if (insertErr.code === "42501") {
        return {
          isReady: false,
          needsMigration: true,
          message:
            "Tabel voting_sesi memerlukan pembaruan izin akses (RLS Policy). Jalankan skrip SQL di Supabase SQL Editor.",
        };
      }
      return {
        isReady: false,
        needsMigration: false,
        message: insertErr.message || "Gagal menghubungi tabel voting_sesi Supabase.",
      };
    }

    // Clean up probe row immediately
    await supabase.from("voting_sesi").delete().eq("id", probeId);

    return {
      isReady: true,
      needsMigration: false,
      message: "Database Supabase terhubung dan siap menyimpan data e-voting secara permanen.",
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      isReady: false,
      needsMigration: false,
      message: msg,
    };
  }
}

/**
 * Synchronize any locally created voting sessions, candidates, and DPT voters
 * to Supabase cloud database once RLS permissions are active.
 */
export async function syncLocalSessionsToSupabase(): Promise<{
  success: boolean;
  syncedSessions: number;
  syncedCandidates: number;
  syncedDPT: number;
  error?: string;
}> {
  if (!supabase) {
    return {
      success: false,
      syncedSessions: 0,
      syncedCandidates: 0,
      syncedDPT: 0,
      error: "Supabase client tidak tersedia.",
    };
  }

  let syncedSessions = 0;
  let syncedCandidates = 0;
  let syncedDPT = 0;

  try {
    const localSessions = getLocalStore<VotingSesi[]>("sessions", []);
    const { data: dbSessions, error: sessErr } = await supabase
      .from("voting_sesi")
      .select("id");

    if (sessErr) {
      return {
        success: false,
        syncedSessions: 0,
        syncedCandidates: 0,
        syncedDPT: 0,
        error: sessErr.message,
      };
    }

    const dbSessionIds = new Set((dbSessions || []).map((s: { id: string }) => s.id));

    // 1. Sync custom sessions (ignore hardcoded mock IDs)
    for (const s of localSessions) {
      if (!dbSessionIds.has(s.id) && isValidUuid(s.id)) {
        const { error } = await supabase.from("voting_sesi").insert({
          id: s.id,
          judul: s.judul,
          tahun_periode: s.tahun_periode,
          deskripsi: s.deskripsi,
          status: s.status,
          is_results_unlocked: s.is_results_unlocked,
          opened_at: s.opened_at,
          closed_at: s.closed_at,
          unlocked_at: s.unlocked_at,
          created_at: s.created_at,
          updated_at: s.updated_at,
        });
        if (!error) {
          syncedSessions++;
          dbSessionIds.add(s.id);
        }
      }
    }

    // 2. Sync candidates for known sessions
    const localCandidates = getLocalStore<VotingKandidat[]>("candidates", []);
    const { data: dbCand } = await supabase.from("voting_kandidat").select("id");
    const dbCandIds = new Set((dbCand || []).map((c: { id: string }) => c.id));

    for (const c of localCandidates) {
      if (!dbCandIds.has(c.id) && isValidUuid(c.id) && dbSessionIds.has(c.sesi_id)) {
        const { error } = await supabase.from("voting_kandidat").insert({
          id: c.id,
          sesi_id: c.sesi_id,
          nomor_urut: c.nomor_urut,
          nama_calon: c.nama_calon,
          foto_url: c.foto_url,
          visi: c.visi,
          misi: c.misi,
          program_kerja: c.program_kerja,
          created_at: c.created_at,
        });
        if (!error) syncedCandidates++;
      }
    }

    // 3. Sync DPT voters for known sessions
    const localDPT = getLocalStore<VotingDPT[]>("dpt", []);
    const { data: dbDpt } = await supabase.from("voting_dpt").select("id");
    const dbDptIds = new Set((dbDpt || []).map((d: { id: string }) => d.id));

    for (const d of localDPT) {
      if (!dbDptIds.has(d.id) && isValidUuid(d.id) && dbSessionIds.has(d.sesi_id)) {
        const { error } = await supabase.from("voting_dpt").insert({
          id: d.id,
          sesi_id: d.sesi_id,
          nim: d.nim,
          nama_lengkap: d.nama_lengkap,
          tanggal_lahir: d.tanggal_lahir,
          sudah_memilih: d.sudah_memilih,
          voted_at: d.voted_at,
          created_at: d.created_at,
        });
        if (!error) syncedDPT++;
      }
    }

    return {
      success: true,
      syncedSessions,
      syncedCandidates,
      syncedDPT,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      syncedSessions,
      syncedCandidates,
      syncedDPT,
      error: msg,
    };
  }
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

  // Fallback to active local store session
  const sessions = getLocalStore<VotingSesi[]>("sessions", []);
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
    console.warn("[VotingClient] Supabase DPT check failed, falling back to local:", err);
  }

  // Fallback to local DPT store if not found in Supabase or if Supabase query failed
  const allDPT = getLocalStore<VotingDPT[]>("dpt", []);
  const sessionDPT = allDPT.filter((v) => v.sesi_id === sesiId);
  return validateDPTVoterCredentials(sessionDPT, cleanNIM, normalizedDate);
}

/**
 * Atomic ballot casting: records anonymous vote and locks voter's DPT status
 */
export async function castStudentVote(
  sesiId: string,
  dptId: string,
  kandidatId: string,
  voterNim?: string,
  voterDob?: string
): Promise<{ success: boolean; receiptId?: string; error?: string }> {
  const now = new Date().toISOString();
  const receiptId = generateReceiptCode();

  // 1. Jalur Utama: Jika RPC cast_student_vote tersedia di Supabase, jalankan secara atomik di sisi server
  if (isValidUuid(sesiId) && isValidUuid(kandidatId) && voterNim && voterDob) {
    try {
      const { data: rpcRes, error: rpcErr } = await supabase.rpc("cast_student_vote", {
        p_sesi_id: sesiId,
        p_nim: voterNim,
        p_tanggal_lahir: voterDob,
        p_kandidat_id: kandidatId,
      });

      if (!rpcErr && rpcRes && typeof rpcRes === "object") {
        const parsed = rpcRes as { success: boolean; receiptId?: string; error?: string };
        if (parsed.success) {
          return { success: true, receiptId: parsed.receiptId || receiptId };
        } else if (parsed.error) {
          return { success: false, error: parsed.error };
        }
      }
    } catch {
      // Fallback ke optimistic locking langsung di bawah jika RPC belum dideploy di Supabase
    }
  }

  // 2. Jalur Sekunder: Optimistic locking langsung di tabel Supabase
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
  const allDPT = getLocalStore<VotingDPT[]>("dpt", []);
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

