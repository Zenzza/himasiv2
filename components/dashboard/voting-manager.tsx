"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  ChartBar,
  Users,
  CheckCircle,
  Plus,
  CaretDown,
  LockOpen,
  Lock,
  ArrowClockwise,
  FileText,
  IdentificationCard,
  X,
  Check,
  Copy,
  WarningCircle,
  ArrowSquareOut,
  ArrowsClockwise,
  Trash,
} from "@phosphor-icons/react";
import DashboardMetricStrip, { type MetricItem } from "@/components/dashboard/ui/dashboard-metric-strip";
import DashboardPageHeader from "@/components/dashboard/ui/dashboard-page-header";
import type {
  VotingSesi,
  VotingKandidat,
  VotingDPT,
  VotingSuaraResult,
  VotingSummaryMetrics,
  SignatoryConfig,
} from "@/lib/types/voting";
import {
  fetchVotingSessions,
  createVotingSession,
  deleteVotingSession,
  updateVotingSessionStatus,
  unlockSessionResults,
  fetchCandidates,
  saveCandidate,
  deleteCandidate,
  fetchDPT,
  addDPTVoter,
  deleteDPTVoter,
  importBatchDPT,
  fetchVotingResults,
  getVotingSummaryMetrics,
  checkVotingRLSStatus,
  syncLocalSessionsToSupabase,
  DEFAULT_SIGNATORIES,
} from "@/lib/supabase/voting";
import { recordAuditLog } from "@/lib/supabase/audit-log";
import VotingSessionTab from "./voting/voting-session-tab";
import VotingCandidatesTab from "./voting/voting-candidates-tab";
import VotingDPTTab from "./voting/voting-dpt-tab";
import VotingBeritaAcaraTab from "./voting/voting-berita-acara-tab";

type SubTabKey = "session" | "candidates" | "dpt" | "berita_acara";

interface VotingManagerProps {
  currentUserRole?: string;
  currentUserName?: string;
}

export default function VotingManager({
  currentUserRole = "super_admin",
  currentUserName = "Administrator",
}: VotingManagerProps) {
  const [activeSubTab, setActiveSubTab] = useState<SubTabKey>("session");
  const [sessions, setSessions] = useState<VotingSesi[]>([]);
  const [selectedSesi, setSelectedSesi] = useState<VotingSesi | null>(null);
  const [candidates, setCandidates] = useState<VotingKandidat[]>([]);
  const [dptList, setDptList] = useState<VotingDPT[]>([]);
  const [results, setResults] = useState<VotingSuaraResult[]>([]);
  const [metrics, setMetrics] = useState<VotingSummaryMetrics>({
    status_label: "MEMUAT...",
    status: "draft",
    total_dpt: 0,
    suara_masuk: 0,
    belum_memilih: 0,
    persentase_partisipasi: 0,
    is_results_unlocked: false,
  });
  const [signatories, setSignatories] = useState<SignatoryConfig>(DEFAULT_SIGNATORIES);
  const [loading, setLoading] = useState(true);

  // New session modal state
  const [showNewSesiModal, setShowNewSesiModal] = useState(false);
  const [newJudul, setNewJudul] = useState("");
  const [newPeriode, setNewPeriode] = useState("2026/2027");
  const [newDeskripsi, setNewDeskripsi] = useState("");
  const [isCreatingSesi, setIsCreatingSesi] = useState(false);

  // Cloud database status & sync state
  const [dbStatus, setDbStatus] = useState<{
    checked: boolean;
    isReady: boolean;
    needsMigration: boolean;
    message: string;
  }>({
    checked: false,
    isReady: true,
    needsMigration: false,
    message: "",
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState<string | null>(null);
  const [copiedMigrationSQL, setCopiedMigrationSQL] = useState(false);

  const MIGRATION_SQL_SNIPPET = `-- Skrip Izin Akses Tabel E-Voting Supabase (Jalankan di SQL Editor Supabase)
GRANT ALL ON TABLE public.voting_sesi TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.voting_kandidat TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.voting_dpt TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.voting_suara TO anon, authenticated, service_role;

ALTER TABLE public.voting_sesi DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.voting_kandidat DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.voting_dpt DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.voting_suara DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "voting_sesi_all" ON public.voting_sesi;
CREATE POLICY "voting_sesi_all" ON public.voting_sesi FOR ALL TO anon, authenticated, service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "voting_kandidat_all" ON public.voting_kandidat;
CREATE POLICY "voting_kandidat_all" ON public.voting_kandidat FOR ALL TO anon, authenticated, service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "voting_dpt_all" ON public.voting_dpt;
CREATE POLICY "voting_dpt_all" ON public.voting_dpt FOR ALL TO anon, authenticated, service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "voting_suara_all" ON public.voting_suara;
CREATE POLICY "voting_suara_all" ON public.voting_suara FOR ALL TO anon, authenticated, service_role USING (true) WITH CHECK (true);

NOTIFY pgrst, 'reload schema';`;

  const verifyDbHealth = useCallback(async () => {
    try {
      const status = await checkVotingRLSStatus();
      setDbStatus({
        checked: true,
        isReady: status.isReady,
        needsMigration: status.needsMigration,
        message: status.message,
      });
      return status;
    } catch {
      return { isReady: false, needsMigration: false, message: "" };
    }
  }, []);

  const handleCopyMigrationSQL = () => {
    navigator.clipboard.writeText(MIGRATION_SQL_SNIPPET);
    setCopiedMigrationSQL(true);
    setTimeout(() => setCopiedMigrationSQL(false), 2500);
  };

  const handleSyncToCloud = async () => {
    setIsSyncing(true);
    setSyncSuccessMsg(null);
    try {
      const res = await syncLocalSessionsToSupabase();
      if (res.success) {
        setSyncSuccessMsg(
          `Sinkronisasi berhasil! ${res.syncedSessions} sesi, ${res.syncedCandidates} kandidat, dan ${res.syncedDPT} DPT telah diunggah ke cloud Supabase.`
        );
        const all = await fetchVotingSessions();
        setSessions(all);
        if (all.length > 0) {
          const active = all[0];
          setSelectedSesi(active);
          await loadSessionData(active);
        }
        await verifyDbHealth();
      } else {
        alert(
          `Gagal sinkronisasi: ${
            res.error || "Pastikan skrip SQL sudah dijalankan di SQL Editor Supabase."
          }`
        );
      }
    } finally {
      setIsSyncing(false);
    }
  };

  // 1. Load active session data
  const loadSessionData = useCallback(async (sesi: VotingSesi) => {
    setLoading(true);
    try {
      const [candData, dptData, summary] = await Promise.all([
        fetchCandidates(sesi.id),
        fetchDPT(sesi.id),
        getVotingSummaryMetrics(sesi),
      ]);

      setCandidates(candData);
      setDptList(dptData);
      setMetrics(summary);

      // Results
      const resData = await fetchVotingResults(sesi.id, candData);
      setResults(resData);
    } catch (err) {
      console.error("[VotingManager] Gagal memuat detail sesi:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    async function init() {
      try {
        const allSessions = await fetchVotingSessions();
        if (!isMounted) return;
        setSessions(allSessions);
        if (allSessions.length > 0) {
          const active = allSessions.find((s) => s.status === "open") || allSessions[0];
          setSelectedSesi(active);
          await loadSessionData(active);
        } else {
          setLoading(false);
        }
        await verifyDbHealth();
      } catch (err) {
        console.error("[VotingManager] Gagal inisialisasi sesi:", err);
        if (isMounted) setLoading(false);
      }
    }
    init();
    return () => {
      isMounted = false;
    };
  }, [loadSessionData, verifyDbHealth]);

  // Switch session
  const handleSelectSesi = async (sesiId: string) => {
    const target = sessions.find((s) => s.id === sesiId);
    if (target) {
      setSelectedSesi(target);
      await loadSessionData(target);
    }
  };

  // Delete current session
  const handleDeleteCurrentSesi = async () => {
    if (!selectedSesi) return;
    if (
      !confirm(
        `Apakah Anda yakin ingin menghapus sesi "${selectedSesi.judul}" (${selectedSesi.tahun_periode}) beserta seluruh kandidat dan DPT-nya? Tindakan ini permanen.`
      )
    ) {
      return;
    }

    try {
      await deleteVotingSession(selectedSesi.id);
      await recordAuditLog({
        pengurus_nama: currentUserName,
        pengurus_role: currentUserRole,
        modul: "voting",
        aksi: `Menghapus sesi pemilihan: "${selectedSesi.judul}"`,
        status: "berhasil",
      }).catch(() => {});

      const all = await fetchVotingSessions();
      setSessions(all);
      if (all.length > 0) {
        setSelectedSesi(all[0]);
        await loadSessionData(all[0]);
      } else {
        setSelectedSesi(null);
        setCandidates([]);
        setDptList([]);
        setResults([]);
      }
    } catch (err) {
      console.error("[VotingManager] Gagal menghapus sesi:", err);
    }
  };

  // Create new session
  const handleCreateSesi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newJudul.trim() || !newPeriode.trim()) return;

    setIsCreatingSesi(true);
    try {
      const created = await createVotingSession({
        judul: newJudul.trim(),
        tahun_periode: newPeriode.trim(),
        deskripsi: newDeskripsi.trim() || null,
      });

      await recordAuditLog({
        pengurus_nama: currentUserName,
        pengurus_role: currentUserRole,
        modul: "voting",
        aksi: `Membuat sesi pemilihan baru: "${created.judul}" (${created.tahun_periode})`,
        status: "berhasil",
      }).catch(() => {});

      setShowNewSesiModal(false);
      setNewJudul("");
      setNewDeskripsi("");

      // Refresh sessions and activate new
      const all = await fetchVotingSessions();
      setSessions(all);
      setSelectedSesi(created);
      await loadSessionData(created);
      await verifyDbHealth();
    } catch (err) {
      console.error("[VotingManager] Gagal membuat sesi baru:", err);
    } finally {
      setIsCreatingSesi(false);
    }
  };

  // Status transition handler
  const handleUpdateStatus = async (newStatus: VotingSesi["status"]) => {
    if (!selectedSesi) return;
    try {
      const updated = await updateVotingSessionStatus(selectedSesi.id, newStatus);
      if (updated) {
        setSelectedSesi(updated);

        await recordAuditLog({
          pengurus_nama: currentUserName,
          pengurus_role: currentUserRole,
          modul: "voting",
          aksi: `Mengubah status bilik suara sesi "${updated.judul}" menjadi [${newStatus.toUpperCase()}]`,
          status: "berhasil",
        }).catch(() => {});

        // Refresh sessions list
        const all = await fetchVotingSessions();
        setSessions(all);
        await loadSessionData(updated);
      }
    } catch (err) {
      console.error("[VotingManager] Gagal mengubah status sesi:", err);
    }
  };

  // Unlock results (Blind count reveal)
  const handleUnlockResults = async () => {
    if (!selectedSesi) return;
    try {
      const success = await unlockSessionResults(selectedSesi.id);
      if (success) {
        const updatedSesi = { ...selectedSesi, is_results_unlocked: true };
        setSelectedSesi(updatedSesi);

        await recordAuditLog({
          pengurus_nama: currentUserName,
          pengurus_role: currentUserRole,
          modul: "voting",
          aksi: `Membuka kunci kotak suara & mengungkap hasil rekapitulasi sesi "${selectedSesi.judul}"`,
          status: "berhasil",
        }).catch(() => {});

        // Refresh metrics and reload
        await loadSessionData(updatedSesi);
      }
    } catch (err) {
      console.error("[VotingManager] Gagal membuka hasil pemilihan:", err);
    }
  };

  // Candidate mutations
  const handleSaveCandidate = async (
    candidate: Partial<VotingKandidat> & { sesi_id: string; nama_calon: string; nomor_urut: number }
  ) => {
    try {
      await saveCandidate(candidate);
      if (selectedSesi) {
        await recordAuditLog({
          pengurus_nama: currentUserName,
          pengurus_role: currentUserRole,
          modul: "voting",
          aksi: `Menyimpan data calon no. urut ${candidate.nomor_urut}: "${candidate.nama_calon}"`,
          status: "berhasil",
        }).catch(() => {});

        await loadSessionData(selectedSesi);
      }
    } catch (err) {
      console.error("[VotingManager] Gagal menyimpan kandidat:", err);
    }
  };

  const handleDeleteCandidate = async (candidateId: string) => {
    try {
      await deleteCandidate(candidateId);
      if (selectedSesi) {
        await recordAuditLog({
          pengurus_nama: currentUserName,
          pengurus_role: currentUserRole,
          modul: "voting",
          aksi: `Menghapus data kandidat dari sesi pemilihan`,
          status: "berhasil",
        }).catch(() => {});

        await loadSessionData(selectedSesi);
      }
    } catch (err) {
      console.error("[VotingManager] Gagal menghapus kandidat:", err);
    }
  };

  // DPT mutations
  const handleAddVoter = async (voter: {
    sesi_id: string;
    nim: string;
    nama_lengkap: string;
    tanggal_lahir: string;
  }) => {
    const res = await addDPTVoter(voter);
    if (res.success && selectedSesi) {
      await recordAuditLog({
        pengurus_nama: currentUserName,
        pengurus_role: currentUserRole,
        modul: "voting",
        aksi: `Menambahkan mahasiswa NIM ${voter.nim} (${voter.nama_lengkap}) ke DPT`,
        status: "berhasil",
      }).catch(() => {});

      await loadSessionData(selectedSesi);
    }
    return res;
  };

  const handleDeleteVoter = async (voterId: string) => {
    const success = await deleteDPTVoter(voterId);
    if (success && selectedSesi) {
      await recordAuditLog({
        pengurus_nama: currentUserName,
        pengurus_role: currentUserRole,
        modul: "voting",
        aksi: `Menghapus pemilih dari daftar DPT`,
        status: "berhasil",
      }).catch(() => {});

      await loadSessionData(selectedSesi);
    }
    return success;
  };

  const handleImportBatch = async (
    items: Array<{ nim: string; nama_lengkap: string; tanggal_lahir: string }>
  ) => {
    if (!selectedSesi) return { inserted: 0, skipped: 0 };
    const res = await importBatchDPT(selectedSesi.id, items);

    await recordAuditLog({
      pengurus_nama: currentUserName,
      pengurus_role: currentUserRole,
      modul: "voting",
      aksi: `Import batch DPT: ${res.inserted} data baru ditambahkan (${res.skipped} dilewati/duplikat)`,
      status: "berhasil",
    }).catch(() => {});

    await loadSessionData(selectedSesi);
    return res;
  };

  // Metric strip items
  const metricItems: MetricItem[] = [
    {
      order: "01.",
      label: "STATUS BILIK SUARA",
      value: loading ? "MEMUAT..." : metrics.status_label,
      sublabel:
        selectedSesi?.status === "open"
          ? "Aktif Menerima Suara"
          : selectedSesi?.status === "closed"
            ? "Pemilihan Ditutup"
            : "Persiapan Pemilihan",
      variant: selectedSesi?.status === "open" ? "success" : "info",
      loading,
      icon:
        selectedSesi?.status === "open" ? (
          <LockOpen className="w-4 h-4" />
        ) : (
          <Lock className="w-4 h-4" />
        ),
    },
    {
      order: "02.",
      label: "TOTAL DPT",
      value: metrics.total_dpt,
      sublabel: "Mahasiswa Terdaftar",
      variant: "default",
      loading,
      icon: <Users className="w-4 h-4" />,
    },
    {
      order: "03.",
      label: "SUARA SAH MASUK",
      value: metrics.suara_masuk,
      sublabel: `${metrics.belum_memilih} Belum Memilih`,
      variant: "success",
      loading,
      icon: <CheckCircle className="w-4 h-4" />,
    },
    {
      order: "04.",
      label: "TINGKAT PARTISIPASI",
      value: `${metrics.persentase_partisipasi}%`,
      sublabel:
        metrics.persentase_partisipasi >= 50
          ? "Kuorum Terpenuhi (>=50%)"
          : "Di Bawah Target Kuorum",
      variant: metrics.persentase_partisipasi >= 50 ? "success" : "warning",
      loading,
      icon: <ChartBar className="w-4 h-4" />,
    },
  ];

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* 1. Header Standar Swiss Grid & Sesi Switcher */}
      <DashboardPageHeader
        title="Pusat Kendali E-Voting Pemilihan Ketua Himpunan"
        subtitle="Manajemen sesi pemilihan, profil calon ketua himpunan, verifikasi DPT berbasis NIM & tanggal lahir, dan pencetakan Berita Acara resmi ber-kop surat."
        badge={
          <span className="text-[10px] font-mono uppercase tracking-wider font-extrabold px-2 py-0.5 border border-[#00296E]/20 dark:border-white/20 text-[#00296E] dark:text-[#38BDF8] bg-[#00296E]/5 dark:bg-[#38BDF8]/10 rounded-none">
            E-VOTING ENGINE
          </span>
        }
        publicUrl="/voting"
        publicLabel="Bilik Suara Publik"
        onRefresh={async () => {
          setLoading(true);
          try {
            const all = await fetchVotingSessions();
            setSessions(all);
            if (selectedSesi) {
              const current = all.find((s) => s.id === selectedSesi.id) || all[0];
              setSelectedSesi(current || null);
              if (current) await loadSessionData(current);
            } else if (all.length > 0) {
              setSelectedSesi(all[0]);
              await loadSessionData(all[0]);
            }
          } finally {
            setLoading(false);
          }
        }}
        refreshLoading={loading}
      >
        {/* Sesi Switcher Dropdown */}
        <div className="relative">
          <select
            value={selectedSesi?.id || ""}
            onChange={(e) => handleSelectSesi(e.target.value)}
            className="appearance-none pl-3 pr-8 py-2 text-xs font-mono font-bold bg-white dark:bg-[#001740] border border-[#00296E]/20 dark:border-white/20 rounded-none focus:outline-none focus:border-[#00296E] text-slate-800 dark:text-slate-200 cursor-pointer"
          >
            {sessions.length === 0 ? (
              <option value="">(Belum Ada Sesi Pemilihan)</option>
            ) : (
              sessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.tahun_periode} — {s.judul.slice(0, 32)}... [{s.status.toUpperCase()}]
                </option>
              ))
            )}
          </select>
          <CaretDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-3 pointer-events-none" />
        </div>

        {/* Button Sesi Baru */}
        <button
          type="button"
          onClick={() => setShowNewSesiModal(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold uppercase tracking-wider text-white bg-[#00296E] hover:bg-[#001f54] rounded-none transition cursor-pointer"
          title="Buat Sesi Pemilihan Periode Baru"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Sesi Baru</span>
        </button>

        {/* Button Hapus Sesi */}
        {selectedSesi && (
          <button
            type="button"
            onClick={handleDeleteCurrentSesi}
            className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-rose-500/30 rounded-none transition cursor-pointer"
            title="Hapus Sesi Ini"
          >
            <Trash className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Hapus</span>
          </button>
        )}
      </DashboardPageHeader>

      {/* Cloud Database Alert Banner if RLS needs update */}
      {dbStatus.needsMigration && (
        <div className="bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 p-4 rounded-none flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs shadow-none print:hidden">
          <div className="flex items-start gap-2.5">
            <WarningCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Perhatian: Izin Akses Tabel Supabase Terbatas (RLS Error 42501)</p>
              <p className="text-[11px] text-amber-800 dark:text-amber-300 mt-0.5">
                Data sesi pemilihan saat ini disimpan di browser lokal. Agar data tersimpan permanen di cloud Supabase dan sinkron di semua perangkat, jalankan skrip SQL izin akses di SQL Editor Supabase.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 w-full md:w-auto">
            <button
              type="button"
              onClick={handleCopyMigrationSQL}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold uppercase tracking-wider rounded-none transition text-xs flex items-center gap-1.5 cursor-pointer shadow-none"
            >
              {copiedMigrationSQL ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedMigrationSQL ? "Tersalin!" : "Salin Skrip SQL"}</span>
            </button>
            <a
              href="https://supabase.com/dashboard/project/rtbtgmtxyhljbltroyra/sql"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-white dark:bg-[#001438] border border-amber-500/30 text-amber-900 dark:text-amber-200 font-semibold uppercase tracking-wider rounded-none hover:bg-amber-50 dark:hover:bg-white/5 transition text-xs flex items-center gap-1"
            >
              <span>Buka SQL Editor</span>
              <ArrowSquareOut className="w-3.5 h-3.5" />
            </a>
            <button
              type="button"
              onClick={handleSyncToCloud}
              disabled={isSyncing}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold uppercase tracking-wider rounded-none transition text-xs flex items-center gap-1.5 cursor-pointer shadow-none"
            >
              {isSyncing ? (
                <ArrowClockwise className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <ArrowsClockwise className="w-3.5 h-3.5" />
              )}
              <span>Cek &amp; Sinkronkan</span>
            </button>
          </div>
        </div>
      )}

      {/* Sync Success Message */}
      {syncSuccessMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 p-3.5 rounded-none flex items-center justify-between text-xs print:hidden">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{syncSuccessMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setSyncSuccessMsg(null)}
            className="p-1 hover:bg-emerald-500/20 rounded-none cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. Standard Metric Strip (4 Columns) */}
      <div className="print:hidden">
        <DashboardMetricStrip metrics={metricItems} columns={4} />
      </div>

      {/* 3. Segmented Sub-tab Navigation (Swiss Minimalist Grid) */}
      <div className="bg-white dark:bg-[#001438] border border-[#00296E]/15 dark:border-white/10 flex items-stretch overflow-x-auto no-scrollbar print:hidden">
        <button
          type="button"
          onClick={() => setActiveSubTab("session")}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-mono uppercase tracking-wider border-r border-[#00296E]/15 dark:border-white/10 transition-colors whitespace-nowrap cursor-pointer select-none ${
            activeSubTab === "session"
              ? "font-extrabold bg-slate-50 dark:bg-white/5 text-[#00296E] dark:text-[#38BDF8] border-b-2 border-b-[#00296E] dark:border-b-[#38BDF8]"
              : "font-semibold text-slate-600 dark:text-slate-400 hover:text-[#00296E] dark:hover:text-white hover:bg-slate-50/50 dark:hover:bg-white/[0.02]"
          }`}
        >
          <ChartBar className="w-4 h-4" />
          <span>01. Sesi &amp; Quick Count</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab("candidates")}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-mono uppercase tracking-wider border-r border-[#00296E]/15 dark:border-white/10 transition-colors whitespace-nowrap cursor-pointer select-none ${
            activeSubTab === "candidates"
              ? "font-extrabold bg-slate-50 dark:bg-white/5 text-[#00296E] dark:text-[#38BDF8] border-b-2 border-b-[#00296E] dark:border-b-[#38BDF8]"
              : "font-semibold text-slate-600 dark:text-slate-400 hover:text-[#00296E] dark:hover:text-white hover:bg-slate-50/50 dark:hover:bg-white/[0.02]"
          }`}
        >
          <IdentificationCard className="w-4 h-4" />
          <span>02. Data Kandidat ({candidates.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab("dpt")}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-mono uppercase tracking-wider border-r border-[#00296E]/15 dark:border-white/10 transition-colors whitespace-nowrap cursor-pointer select-none ${
            activeSubTab === "dpt"
              ? "font-extrabold bg-slate-50 dark:bg-white/5 text-[#00296E] dark:text-[#38BDF8] border-b-2 border-b-[#00296E] dark:border-b-[#38BDF8]"
              : "font-semibold text-slate-600 dark:text-slate-400 hover:text-[#00296E] dark:hover:text-white hover:bg-slate-50/50 dark:hover:bg-white/[0.02]"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>03. Daftar Pemilih Tetap ({dptList.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab("berita_acara")}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-mono uppercase tracking-wider border-r border-[#00296E]/15 dark:border-white/10 transition-colors whitespace-nowrap cursor-pointer select-none ${
            activeSubTab === "berita_acara"
              ? "font-extrabold bg-slate-50 dark:bg-white/5 text-[#00296E] dark:text-[#38BDF8] border-b-2 border-b-[#00296E] dark:border-b-[#38BDF8]"
              : "font-semibold text-slate-600 dark:text-slate-400 hover:text-[#00296E] dark:hover:text-white hover:bg-slate-50/50 dark:hover:bg-white/[0.02]"
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>04. Berita Acara &amp; Cetak PDF</span>
        </button>
      </div>

      {/* 4. Sub-Tab Active View */}
      {selectedSesi ? (
        <div>
          {activeSubTab === "session" && (
            <VotingSessionTab
              sesi={selectedSesi}
              metrics={metrics}
              candidates={candidates}
              results={results}
              loading={loading}
              onRefresh={() => loadSessionData(selectedSesi)}
              onUpdateStatus={handleUpdateStatus}
              onUnlockResults={handleUnlockResults}
            />
          )}

          {activeSubTab === "candidates" && (
            <VotingCandidatesTab
              sesi={selectedSesi}
              candidates={candidates}
              onSaveCandidate={handleSaveCandidate}
              onDeleteCandidate={handleDeleteCandidate}
            />
          )}

          {activeSubTab === "dpt" && (
            <VotingDPTTab
              sesi={selectedSesi}
              dptList={dptList}
              onAddVoter={handleAddVoter}
              onDeleteVoter={handleDeleteVoter}
              onImportBatch={handleImportBatch}
            />
          )}

          {activeSubTab === "berita_acara" && (
            <VotingBeritaAcaraTab
              sesi={selectedSesi}
              metrics={metrics}
              results={results}
              signatories={signatories}
              onUpdateSignatories={setSignatories}
            />
          )}
        </div>
      ) : !loading ? (
        <div className="bg-white dark:bg-[#001438] border border-[#00296E]/15 dark:border-white/10 rounded-none p-12 text-center space-y-4 shadow-none">
          <div className="w-12 h-12 mx-auto rounded-none bg-[#00296E]/5 dark:bg-white/5 text-[#00296E] dark:text-[#38BDF8] flex items-center justify-center border border-[#00296E]/20 dark:border-white/15">
            <ChartBar className="w-6 h-6" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-base font-bold text-slate-900 dark:text-white uppercase tracking-wider font-poppins">
              Belum Ada Sesi Pemilihan Terdaftar
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Saat ini belum ada data sesi pemilihan e-voting di database. Klik tombol di bawah untuk membuat sesi pemilihan baru bagi himpunan.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowNewSesiModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#00296E] hover:bg-[#001f54] text-white text-xs font-semibold uppercase tracking-wider rounded-none transition cursor-pointer mx-auto shadow-none"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Sesi Pemilihan Baru</span>
          </button>
        </div>
      ) : null}

      {/* Modal Buat Sesi Baru (Swiss Minimalist Grid) */}
      {showNewSesiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#001438] border border-[#00296E]/20 dark:border-white/15 rounded-none max-w-md w-full shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#00296E]/15 dark:border-white/10">
              <h3 className="text-sm font-bold text-[#00296E] dark:text-white font-mono uppercase tracking-wider">
                Buat Sesi Pemilihan Baru
              </h3>
              <button
                type="button"
                onClick={() => setShowNewSesiModal(false)}
                className="p-1 rounded-none text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSesi} className="space-y-4">
              <div>
                <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Judul Sesi Pemilihan
                </label>
                <input
                  type="text"
                  placeholder="misal: Pemilihan Ketua HIMASI Periode 2026/2027"
                  value={newJudul}
                  onChange={(e) => setNewJudul(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-white/5 border border-[#00296E]/20 dark:border-white/20 rounded-none focus:outline-none focus:border-[#00296E] dark:focus:border-[#38BDF8] text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Tahun Periode
                </label>
                <input
                  type="text"
                  placeholder="misal: 2026/2027"
                  value={newPeriode}
                  onChange={(e) => setNewPeriode(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-white/5 border border-[#00296E]/20 dark:border-white/20 rounded-none focus:outline-none focus:border-[#00296E] dark:focus:border-[#38BDF8] text-slate-900 dark:text-white font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Deskripsi / Keterangan (Opsional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Keterangan singkat seputar pelaksanaan pemilihan..."
                  value={newDeskripsi}
                  onChange={(e) => setNewDeskripsi(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-white/5 border border-[#00296E]/20 dark:border-white/20 rounded-none focus:outline-none focus:border-[#00296E] dark:focus:border-[#38BDF8] text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-[#00296E]/15 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setShowNewSesiModal(false)}
                  disabled={isCreatingSesi}
                  className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 border border-[#00296E]/20 dark:border-white/20 rounded-none transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isCreatingSesi}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white bg-[#00296E] hover:bg-[#001f54] rounded-none transition cursor-pointer disabled:opacity-50"
                >
                  {isCreatingSesi ? (
                    <ArrowClockwise className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  Buat Sesi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
