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
// PURE SUPABASE MODE — LEGACY LOCALSTORAGE CACHE PURGE
// ============================================================================

export const INITIAL_MOCK_SESI: VotingSesi[] = [];
export const INITIAL_MOCK_KANDIDAT: VotingKandidat[] = [];
export const INITIAL_MOCK_DPT: VotingDPT[] = [];

const LEGACY_VOTING_STORAGE_KEYS = [
  "himasi_evoting_sessions",
  "himasi_evoting_candidates",
  "himasi_evoting_dpt",
  "himasi_evoting_suara",
] as const;

/**
 * Purges any legacy himasi_evoting_* keys from browser localStorage so that
 * devices that previously cached an open session can never resurrect stale data.
 */
export function clearLegacyVotingLocalCache(): void {
  if (typeof window === "undefined") return;
  try {
    for (const key of LEGACY_VOTING_STORAGE_KEYS) {
      localStorage.removeItem(key);
    }
  } catch {
    // Ignore storage access errors in restricted environments
  }
}

// ============================================================================
// DATA ACCESS LAYER (100% Pure Supabase Database — Single Source of Truth)
// ============================================================================

/**
 * Fetch all voting sessions strictly from Supabase
 */
export async function fetchVotingSessions(): Promise<VotingSesi[]> {
  try {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from("voting_sesi")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && Array.isArray(data)) {
      return data as VotingSesi[];
    }

    if (error) {
      console.warn("[Voting] Supabase fetchVotingSessions query error:", error.message);
    }
  } catch (err) {
    console.warn("[Voting] Exception in fetchVotingSessions:", err);
  }

  return [];
}

/**
 * Create a new voting session in Supabase
 */
export async function createVotingSession(
  payload: Pick<VotingSesi, "judul" | "tahun_periode" | "deskripsi">
): Promise<VotingSesi> {
  const newId = generateUuid();
  const now = new Date().toISOString();

  if (!supabase) {
    throw new Error("Koneksi Supabase tidak tersedia.");
  }

  const { data, error } = await supabase
    .from("voting_sesi")
    .insert({
      id: newId,
      judul: payload.judul,
      tahun_periode: payload.tahun_periode,
      deskripsi: payload.deskripsi || null,
      status: "draft",
      is_results_unlocked: false,
    })
    .select()
    .single();

  if (error || !data) {
    console.error("[Voting] Gagal insert voting_sesi ke Supabase:", error);
    throw new Error(error?.message || "Gagal membuat sesi pemilihan di database Supabase.");
  }

  return (data as VotingSesi) || {
    id: newId,
    judul: payload.judul,
    tahun_periode: payload.tahun_periode,
    deskripsi: payload.deskripsi || null,
    status: "draft",
    is_results_unlocked: false,
    opened_at: null,
    closed_at: null,
    unlocked_at: null,
    created_at: now,
    updated_at: now,
  };
}

/**
 * Delete voting session and its cascading data from Supabase
 */
export async function deleteVotingSession(sesiId: string): Promise<boolean> {
  clearLegacyVotingLocalCache();

  try {
    if (supabase && isValidUuid(sesiId)) {
      const { error } = await supabase.from("voting_sesi").delete().eq("id", sesiId);
      if (error) {
        console.error("[Voting] Gagal menghapus sesi dari Supabase:", error);
        return false;
      }
      return true;
    }
  } catch (err) {
    console.error("[Voting] Exception delete voting_sesi:", err);
  }

  return false;
}

/**
 * Update voting session status in Supabase
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
      if (error) {
        console.error("[Voting] Gagal memperbarui status voting_sesi:", error);
      }
    }
  } catch (err) {
    console.error("[Voting] Exception updateVotingSessionStatus:", err);
  }

  return null;
}

/**
 * Unlock session results (Blind Vote Reveal) in Supabase
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
      console.error("[Voting] Gagal membuka segel hasil voting_sesi:", error);
    }
  } catch (err) {
    console.error("[Voting] Exception unlockSessionResults:", err);
  }

  return false;
}

/**
 * Fetch candidates for a session strictly from Supabase
 */
export async function fetchCandidates(sesiId: string): Promise<VotingKandidat[]> {
  try {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from("voting_kandidat")
      .select("*")
      .eq("sesi_id", sesiId)
      .order("nomor_urut", { ascending: true });

    if (!error && Array.isArray(data)) {
      return data as VotingKandidat[];
    }

    if (error) {
      console.warn("[Voting] Supabase fetchCandidates query error:", error.message);
    }
  } catch (err) {
    console.warn("[Voting] Exception in fetchCandidates:", err);
  }

  return [];
}

/**
 * Save candidate (create or edit) in Supabase
 */
export async function saveCandidate(
  candidate: Partial<VotingKandidat> & { sesi_id: string; nama_calon: string; nomor_urut: number }
): Promise<VotingKandidat> {
  if (!supabase) {
    throw new Error("Koneksi Supabase tidak tersedia.");
  }

  if (candidate.id) {
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

    if (error || !data) {
      throw new Error(error?.message || "Gagal memperbarui data kandidat di Supabase.");
    }
    return data as VotingKandidat;
  }

  const newItem: VotingKandidat = {
    id: generateUuid(),
    sesi_id: candidate.sesi_id,
    nomor_urut: candidate.nomor_urut,
    nama_calon: candidate.nama_calon,
    foto_url: candidate.foto_url || null,
    visi: candidate.visi || null,
    misi: candidate.misi || null,
    program_kerja: candidate.program_kerja || null,
    created_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("voting_kandidat")
    .insert(newItem)
    .select()
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Gagal menambahkan kandidat ke Supabase.");
  }

  return data as VotingKandidat;
}

/**
 * Delete candidate from Supabase
 */
export async function deleteCandidate(candidateId: string): Promise<boolean> {
  try {
    if (supabase) {
      const { error } = await supabase.from("voting_kandidat").delete().eq("id", candidateId);
      if (!error) return true;
      console.error("[Voting] Gagal menghapus kandidat:", error);
    }
  } catch (err) {
    console.error("[Voting] Exception deleteCandidate:", err);
  }

  return false;
}

/**
 * Fetch DPT for a session strictly from Supabase with optional filter and search
 */
export async function fetchDPT(
  sesiId: string,
  options?: {
    search?: string;
    status?: "all" | "voted" | "not_voted";
  }
): Promise<VotingDPT[]> {
  try {
    if (!supabase) return [];
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
      return data as VotingDPT[];
    }

    if (error) {
      console.warn("[Voting] Supabase fetchDPT query error:", error.message);
    }
  } catch (err) {
    console.warn("[Voting] Exception in fetchDPT:", err);
  }

  return [];
}

/**
 * Add a single voter to DPT in Supabase
 */
export async function addDPTVoter(
  voter: Pick<VotingDPT, "sesi_id" | "nim" | "nama_lengkap" | "tanggal_lahir">
): Promise<{ success: boolean; data?: VotingDPT; error?: string }> {
  const normalizedDate = normalizeBirthDate(voter.tanggal_lahir);
  if (!normalizedDate) {
    return { success: false, error: "Format tanggal lahir tidak valid." };
  }

  if (!supabase) {
    return { success: false, error: "Koneksi Supabase tidak tersedia." };
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
    return {
      success: false,
      error: error?.message || "Gagal menambahkan pemilih ke database Supabase.",
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Terjadi kesalahan jaringan.";
    return { success: false, error: msg };
  }
}

/**
 * Delete a voter from DPT in Supabase (Only if voter has NOT voted yet)
 */
export async function deleteDPTVoter(voterId: string): Promise<boolean> {
  try {
    if (supabase) {
      const { error } = await supabase
        .from("voting_dpt")
        .delete()
        .eq("id", voterId)
        .eq("sudah_memilih", false);

      if (!error) return true;
      console.error("[Voting] Gagal menghapus DPT:", error);
    }
  } catch (err) {
    console.error("[Voting] Exception deleteDPTVoter:", err);
  }

  return false;
}

/**
 * Import batch DPT from parsed items directly into Supabase
 */
export async function importBatchDPT(
  sesiId: string,
  items: Array<{ nim: string; nama_lengkap: string; tanggal_lahir: string }>
): Promise<{ inserted: number; skipped: number }> {
  let inserted = 0;
  let skipped = 0;

  if (!supabase) {
    return { inserted: 0, skipped: items.length };
  }

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
    const { error } = await supabase.from("voting_dpt").insert(toInsert);
    if (error) {
      console.error("[Voting] Gagal import batch DPT ke Supabase:", error);
      return { inserted: 0, skipped: items.length };
    }
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
  } catch (err) {
    console.warn("[Voting] Exception in fetchVotingResults:", err);
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
// DIAGNOSTICS & CLOUD HEALTH HELPERS
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
 * Legacy compatibility helper: purges any leftover localStorage keys without
 * resurrecting stale client-side sessions into Supabase.
 */
export async function syncLocalSessionsToSupabase(): Promise<{
  success: boolean;
  syncedSessions: number;
  syncedCandidates: number;
  syncedDPT: number;
  error?: string;
}> {
  clearLegacyVotingLocalCache();
  return {
    success: true,
    syncedSessions: 0,
    syncedCandidates: 0,
    syncedDPT: 0,
  };
}

// ============================================================================
// PUBLIC E-VOTING BOOTH CLIENT-SAFE DATA ACCESSORS (100% Pure Supabase)
// ============================================================================

export type ActiveVotingSessionStatus =
  | { ok: true; session: VotingSesi | null }
  | { ok: false; error: string };

/**
 * Fetches the currently active / open voting session strictly from Supabase,
 * distinguishing authoritative "no open session" (`ok: true, session: null`)
 * from transient network/query errors (`ok: false`).
 */
export async function fetchActiveVotingSessionStatus(): Promise<ActiveVotingSessionStatus> {
  try {
    if (!supabase) {
      return { ok: false, error: "Supabase client tidak tersedia." };
    }
    const { data, error } = await supabase
      .from("voting_sesi")
      .select("*")
      .eq("status", "open")
      .order("opened_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.warn("[VotingClient] Supabase active session lookup error:", error.message);
      return { ok: false, error: error.message };
    }

    return { ok: true, session: (data as VotingSesi) || null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn("[VotingClient] Supabase active session lookup exception:", err);
    return { ok: false, error: msg };
  }
}

/**
 * Fetches the currently active / open voting session strictly from Supabase.
 * Never falls back to browser localStorage so closed or deleted sessions
 * immediately stop appearing on all devices.
 */
export async function fetchActiveVotingSession(): Promise<VotingSesi | null> {
  const res = await fetchActiveVotingSessionStatus();
  return res.ok ? res.session : null;
}

/**
 * Defense-in-depth guard: verifies directly against Supabase that the target
 * voting session still exists and has status === "open".
 */
async function ensureSessionOpen(
  sesiId: string
): Promise<{ open: true } | { open: false; error: string }> {
  if (!supabase) {
    return { open: false, error: "Koneksi ke server pemilihan tidak tersedia." };
  }

  const { data: sesiRow, error: sesiErr } = await supabase
    .from("voting_sesi")
    .select("id, status")
    .eq("id", sesiId)
    .maybeSingle();

  if (sesiErr) {
    return {
      open: false,
      error: "Terjadi gangguan saat memeriksa status sesi pemilihan. Silakan coba kembali.",
    };
  }

  if (!sesiRow || sesiRow.status !== "open") {
    return {
      open: false,
      error: "Sesi pemilihan telah ditutup atau tidak lagi tersedia.",
    };
  }

  return { open: true };
}

/**
 * 2FA student identity verification via NIM + Tanggal Lahir against live Supabase DPT table.
 * Also confirms that the target voting session is still strictly "open" in Supabase.
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

  if (!supabase) {
    return {
      success: false,
      error: "Koneksi ke server verifikasi tidak tersedia.",
    };
  }

  try {
    // 1. Pastikan sesi pemilihan masih benar-benar berstatus 'open' di Supabase
    const sessionCheck = await ensureSessionOpen(sesiId);
    if (!sessionCheck.open) {
      return { success: false, error: sessionCheck.error };
    }

    // 2. Verifikasi data DPT langsung terhadap Supabase
    const { data, error } = await supabase
      .from("voting_dpt")
      .select("*")
      .eq("sesi_id", sesiId)
      .ilike("nim", cleanNIM)
      .maybeSingle();

    if (error) {
      console.warn("[VotingClient] Supabase DPT check error:", error.message);
      return {
        success: false,
        error: "Terjadi kesalahan saat memverifikasi data DPT. Silakan coba lagi.",
      };
    }

    if (!data) {
      return {
        success: false,
        error: "NIM Anda tidak terdaftar dalam Daftar Pemilih Tetap (DPT) sesi ini.",
      };
    }

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
  } catch (err) {
    console.warn("[VotingClient] Supabase DPT check exception:", err);
    return {
      success: false,
      error: "Terjadi gangguan jaringan saat menghubungi server verifikasi.",
    };
  }
}

/**
 * Atomic ballot casting: records anonymous vote and locks voter's DPT status in Supabase.
 * Strictly verifies that the voting session is open and never falls back to localStorage.
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

  if (!supabase) {
    return {
      success: false,
      error: "Koneksi ke kotak suara server tidak tersedia.",
    };
  }

  // Defense-in-depth: pastikan sesi masih berstatus 'open' sebelum RPC maupun jalur sekunder
  try {
    const sessionCheck = await ensureSessionOpen(sesiId);
    if (!sessionCheck.open) {
      return { success: false, error: sessionCheck.error };
    }
  } catch (err) {
    console.warn("[VotingClient] Session open check exception:", err);
    return {
      success: false,
      error: "Terjadi gangguan jaringan saat memeriksa status sesi pemilihan.",
    };
  }

  // 1. Jalur Utama: RPC cast_student_vote atomik di sisi server (memvalidasi sesi.status = 'open')
  if (isValidUuid(sesiId) && isValidUuid(kandidatId) && voterNim && voterDob) {
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
      }
      return {
        success: false,
        error: parsed.error || "Gagal memasukkan surat suara. Silakan coba kembali.",
      };
    }

    // Hanya fallback ke jalur sekunder jika RPC memang belum dideploy di Supabase
    const isRpcMissing =
      rpcErr?.code === "42883" ||
      rpcErr?.code === "PGRST202" ||
      rpcErr?.message?.includes("Could not find the function");

    if (rpcErr && !isRpcMissing) {
      console.warn("[VotingClient] RPC cast_student_vote error:", rpcErr);
      return {
        success: false,
        error: "Gagal memproses surat suara di server. Silakan coba kembali.",
      };
    }
  }

  // 2. Jalur Sekunder: Optimistic locking langsung di tabel Supabase (hanya bila RPC belum dideploy)
  if (isValidUuid(sesiId) && isValidUuid(dptId)) {
    try {
      const { data: lockedVoter, error: updateErr } = await supabase
        .from("voting_dpt")
        .update({
          sudah_memilih: true,
          voted_at: now,
        })
        .eq("id", dptId)
        .eq("sesi_id", sesiId)
        .eq("sudah_memilih", false)
        .select("id")
        .maybeSingle();

      if (!updateErr && lockedVoter) {
        const { error: voteErr } = await supabase.from("voting_suara").insert({
          sesi_id: sesiId,
          kandidat_id: kandidatId,
          created_at: now,
        });

        if (voteErr) {
          await supabase
            .from("voting_dpt")
            .update({ sudah_memilih: false, voted_at: null })
            .eq("id", dptId)
            .eq("sesi_id", sesiId);
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
        return {
          success: false,
          error: "Gagal memperbarui status hak suara. Silakan coba kembali.",
        };
      }

      const { data: existingVoter } = await supabase
        .from("voting_dpt")
        .select("id, sudah_memilih")
        .eq("id", dptId)
        .eq("sesi_id", sesiId)
        .maybeSingle();

      if (existingVoter?.sudah_memilih) {
        return {
          success: false,
          error: "Hak suara untuk pemilih ini telah digunakan sebelumnya.",
        };
      }
    } catch (err) {
      console.warn("[VotingClient] Supabase vote submission exception:", err);
      return {
        success: false,
        error: "Terjadi gangguan jaringan saat memasukkan surat suara.",
      };
    }
  }

  return {
    success: false,
    error: "Data pemilih tidak ditemukan atau sesi pemilihan telah berakhir.",
  };
}
