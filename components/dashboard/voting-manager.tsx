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
} from "@phosphor-icons/react";
import DashboardMetricStrip, { type MetricItem } from "@/components/dashboard/ui/dashboard-metric-strip";
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
      } catch (err) {
        console.error("[VotingManager] Gagal inisialisasi sesi:", err);
        if (isMounted) setLoading(false);
      }
    }
    init();
    return () => {
      isMounted = false;
    };
  }, [loadSessionData]);

  // Switch session
  const handleSelectSesi = async (sesiId: string) => {
    const target = sessions.find((s) => s.id === sesiId);
    if (target) {
      setSelectedSesi(target);
      await loadSessionData(target);
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
      value: metrics.status_label,
      sublabel:
        selectedSesi?.status === "open"
          ? "Aktif Menerima Suara"
          : selectedSesi?.status === "closed"
            ? "Pemilihan Ditutup"
            : "Persiapan Pemilihan",
      variant: selectedSesi?.status === "open" ? "success" : "info",
      icon:
        selectedSesi?.status === "open" ? (
          <LockOpen className="w-5 h-5" />
        ) : (
          <Lock className="w-5 h-5" />
        ),
    },
    {
      order: "02.",
      label: "TOTAL DPT",
      value: metrics.total_dpt,
      sublabel: "Mahasiswa Terdaftar",
      variant: "default",
      icon: <Users className="w-5 h-5" />,
    },
    {
      order: "03.",
      label: "SUARA SAH MASUK",
      value: metrics.suara_masuk,
      sublabel: `${metrics.belum_memilih} Belum Memilih`,
      variant: "success",
      icon: <CheckCircle className="w-5 h-5" />,
    },
    {
      order: "04.",
      label: "PARTISIPASI",
      value: `${metrics.persentase_partisipasi}%`,
      sublabel:
        metrics.persentase_partisipasi >= 50
          ? "Kuorum Terpenuhi (>=50%)"
          : "Di Bawah Target Kuorum",
      variant: metrics.persentase_partisipasi >= 50 ? "success" : "warning",
      icon: <ChartBar className="w-5 h-5" />,
    },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Header Standard & Sesi Switcher */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs print:hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] font-mono uppercase tracking-wider font-bold px-2 py-0.5 rounded bg-[#00296E]/10 text-[#00296E] dark:bg-blue-500/10 dark:text-blue-400 border border-[#00296E]/20">
                E-VOTING ENGINE
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                Sistem Pemungutan Suara Berintegritas
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              PUSAT KENDALI E-VOTING PEMILIHAN KETUA HIMPUNAN
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Manajemen sesi pemilihan, profil calon ketua himpunan, verifikasi DPT berbasis NIM &amp;
              tanggal lahir, dan pencetakan Berita Acara resmi ber-kop surat.
            </p>
          </div>

          {/* Sesi Switcher Dropdown & Add Button */}
          <div className="flex items-center gap-2 self-start lg:self-auto">
            <div className="relative">
              <select
                value={selectedSesi?.id || ""}
                onChange={(e) => handleSelectSesi(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2 text-xs font-mono font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#00296E] text-slate-800 dark:text-slate-200 cursor-pointer shadow-xs"
              >
                {sessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.tahun_periode} — {s.judul.slice(0, 32)}... [{s.status.toUpperCase()}]
                  </option>
                ))}
              </select>
              <CaretDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-3 pointer-events-none" />
            </div>

            <button
              onClick={() => setShowNewSesiModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-[#00296E] hover:bg-[#002055] rounded-xl shadow-xs transition cursor-pointer"
              title="Buat Sesi Pemilihan Periode Baru"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sesi Baru</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Standard Metric Strip (4 Columns) */}
      <div className="print:hidden">
        <DashboardMetricStrip metrics={metricItems} columns={4} />
      </div>

      {/* 3. Segmented Sub-tab Navigation */}
      <div className="border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 overflow-x-auto no-scrollbar print:hidden">
        <button
          onClick={() => setActiveSubTab("session")}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-mono font-bold uppercase tracking-wider border-b-2 transition -mb-px whitespace-nowrap cursor-pointer ${
            activeSubTab === "session"
              ? "border-[#00296E] text-[#00296E] dark:border-blue-400 dark:text-blue-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
          }`}
        >
          <ChartBar className="w-4 h-4" />
          <span>01. Sesi &amp; Quick Count</span>
        </button>

        <button
          onClick={() => setActiveSubTab("candidates")}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-mono font-bold uppercase tracking-wider border-b-2 transition -mb-px whitespace-nowrap cursor-pointer ${
            activeSubTab === "candidates"
              ? "border-[#00296E] text-[#00296E] dark:border-blue-400 dark:text-blue-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
          }`}
        >
          <IdentificationCard className="w-4 h-4" />
          <span>02. Data Kandidat ({candidates.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab("dpt")}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-mono font-bold uppercase tracking-wider border-b-2 transition -mb-px whitespace-nowrap cursor-pointer ${
            activeSubTab === "dpt"
              ? "border-[#00296E] text-[#00296E] dark:border-blue-400 dark:text-blue-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>03. Daftar Pemilih Tetap ({dptList.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab("berita_acara")}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-mono font-bold uppercase tracking-wider border-b-2 transition -mb-px whitespace-nowrap cursor-pointer ${
            activeSubTab === "berita_acara"
              ? "border-[#00296E] text-[#00296E] dark:border-blue-400 dark:text-blue-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>04. Berita Acara &amp; Cetak PDF</span>
        </button>
      </div>

      {/* 4. Sub-Tab Active View */}
      {selectedSesi && (
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
      )}

      {/* Modal Buat Sesi Baru */}
      {showNewSesiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white font-mono uppercase tracking-wider">
                Buat Sesi Pemilihan Baru
              </h3>
              <button
                onClick={() => setShowNewSesiModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
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
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#00296E]"
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
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#00296E] font-mono"
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
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#00296E]"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowNewSesiModal(false)}
                  disabled={isCreatingSesi}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isCreatingSesi}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#00296E] hover:bg-[#002055] rounded-lg shadow-sm transition"
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
