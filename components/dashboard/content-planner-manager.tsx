"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  Table,
  Calendar,
  Plus,
  RefreshCw,
  Search,
  Filter,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Info,
  X,
  RotateCcw,
  Radio,
  FileSpreadsheet,
  CalendarDays,
  Flame,
} from "lucide-react";
import {
  type ContentPlanItem,
  type ContentPlanInput,
  type PlatformKonten,
  PLATFORM_OPTIONS,
  getProgressForStatus,
  getStatusForProgress,
} from "@/lib/types/content-planner";
import {
  getContentPlans,
  createContentPlan,
  updateContentPlan,
  deleteContentPlan,
  toggleContentPlanDone,
  subscribeToContentPlans,
  isSupabaseConfigured,
  resetContentPlansStorageToDefault,
} from "@/lib/supabase/content-planner";
import {
  getCalendarWeekNumber,
  getCalendarWeekDetailsForMonth,
} from "@/lib/utils/calendar-week";
import { type UserRole } from "@/lib/types/auth";
import { CwTableView } from "@/components/dashboard/content-planner/cw-table-view";
import { CalendarGridView } from "@/components/dashboard/content-planner/calendar-grid-view";
import { ContentModal } from "@/components/dashboard/content-planner/content-modal";

export interface ContentPlannerManagerProps {
  currentUserRole?: UserRole;
}

export default function ContentPlannerManager({
  currentUserRole = "medkominfo",
}: ContentPlannerManagerProps) {
  // Wewenang role: Seluruh pengurus aktif di dashboard memiliki akses kolaborasi penuh secara realtime
  const canManage =
    currentUserRole === "super_admin" ||
    currentUserRole === "bph" ||
    currentUserRole === "medkominfo" ||
    currentUserRole === "humas_biskraf" ||
    true;

  // Data utama & Loading State
  const [plans, setPlans] = useState<ContentPlanItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRealtimeActive, setIsRealtimeActive] = useState<boolean>(false);

  // Filter State
  const [selectedPlatform, setSelectedPlatform] = useState<string>("All");
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedMonth, setSelectedMonth] = useState<number>(() => new Date().getMonth() + 1);
  const [selectedCw, setSelectedCw] = useState<number>(() => getCalendarWeekNumber(new Date()));
  const [activeView, setActiveView] = useState<"cw-table" | "calendar-grid">("cw-table");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Rincian minggu dalam bulan terpilih
  const monthWeeks = useMemo(() => {
    return getCalendarWeekDetailsForMonth(selectedYear, selectedMonth - 1);
  }, [selectedYear, selectedMonth]);

  // Sinkronisasi otomatis: jika CW terpilih berada di luar bulan baru, pindah ke minggu pertama bulan tersebut
  useEffect(() => {
    if (monthWeeks.length > 0 && !monthWeeks.some((w) => w.cw === selectedCw)) {
      setSelectedCw(monthWeeks[0].cw);
    }
  }, [monthWeeks, selectedCw]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<ContentPlanItem | null>(null);
  const [modalDefaultDate, setModalDefaultDate] = useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Dialog Konfirmasi Hapus
  const [deleteCandidate, setDeleteCandidate] = useState<ContentPlanItem | null>(null);

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = useCallback((msg: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastMessage(msg);
    toastTimerRef.current = setTimeout(() => {
      setToastMessage(null);
      toastTimerRef.current = null;
    }, 3500);
  }, []);

  // 1. Membaca Rencana Konten dari Service Supabase / Fallback Offline
  const loadPlans = useCallback(async () => {
    setIsLoading(true);
    try {
      // Ambil seluruh jadwal untuk tahun terpilih agar batas Calendar Week (CW)
      // yang melintasi pergantian bulan tetap lengkap 7 hari tanpa terpotong
      const data = await getContentPlans({
        platform: selectedPlatform === "All" ? undefined : selectedPlatform,
        year: selectedYear,
      });
      setPlans(data);
    } catch (err) {
      console.error("[content-planner] Gagal memuat data:", err);
      showToast("Gagal memuat daftar rencana konten.");
    } finally {
      setIsLoading(false);
    }
  }, [selectedPlatform, selectedYear, showToast]);

  // Load awal saat parameter filter berubah
  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  // 2. Berlangganan Realtime WebSocket Supabase
  useEffect(() => {
    const configured = isSupabaseConfigured();
    setIsRealtimeActive(configured);

    const unsubscribe = subscribeToContentPlans((payload) => {
      if (payload.eventType === "INSERT" && payload.new) {
        setPlans((prev) => {
          if (prev.some((p) => p.id === payload.new!.id)) return prev;
          return [...prev, payload.new!].sort((a, b) => a.tanggal.localeCompare(b.tanggal));
        });
        showToast(`Konten baru disinkronkan: ${payload.new.topik.slice(0, 35)}...`);
      } else if (payload.eventType === "UPDATE" && payload.new) {
        setPlans((prev) =>
          prev.map((p) => (p.id === payload.new!.id ? payload.new! : p))
        );
      } else if (payload.eventType === "DELETE" && payload.old) {
        setPlans((prev) => prev.filter((p) => p.id !== payload.old!.id));
        showToast("Rencana konten diperbarui (dihapus oleh pengurus lain).");
      }
    });

    return () => {
      unsubscribe();
    };
  }, [showToast]);

  // 3. Filter Search Client-Side untuk pencarian cepat topik
  const filteredPlans = useMemo(() => {
    if (!searchQuery.trim()) return plans;
    const query = searchQuery.toLowerCase();
    return plans.filter(
      (p) =>
        p.topik.toLowerCase().includes(query) ||
        p.tipe_konten.toLowerCase().includes(query) ||
        p.konsep.toLowerCase().includes(query) ||
        p.status.toLowerCase().includes(query) ||
        p.day_of_week.toLowerCase().includes(query)
    );
  }, [plans, searchQuery]);

  // 4. CRUD Handlers: Simpan (Create / Update)
  const handleSaveModal = async (input: ContentPlanInput, id?: string) => {
    setIsSubmitting(true);
    try {
      if (id) {
        const updated = await updateContentPlan(id, input);
        setPlans((prev) => prev.map((p) => (p.id === id ? updated : p)));
        showToast("Rencana konten berhasil diperbarui.");
      } else {
        const created = await createContentPlan(input);
        setPlans((prev) =>
          [...prev.filter((p) => p.id !== created.id), created].sort((a, b) =>
            a.tanggal.localeCompare(b.tanggal)
          )
        );
        showToast(
          canManage
            ? "Jadwal konten baru berhasil ditambahkan."
            : "Ide konten berhasil diajukan ke tim Medkominfo."
        );
      }
      setIsModalOpen(false);
      setEditingItem(null);
      setModalDefaultDate(undefined);
    } catch (err) {
      console.error("[content-planner] Gagal menyimpan:", err);
      showToast("Terjadi kesalahan saat menyimpan rencana konten.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 5. Quick Update (Inline Edit Topic, Dropdown Type, Concept, Status, Progress, dsb.)
  const handleQuickUpdate = async (id: string, updates: Partial<ContentPlanInput>) => {
    const finalUpdates: Partial<ContentPlanInput> = { ...updates };

    // Keterhubungan dua arah secara realtime antara Status <-> Progress Bar
    if (finalUpdates.status && finalUpdates.progress === undefined) {
      finalUpdates.progress = getProgressForStatus(finalUpdates.status);
      finalUpdates.is_done = finalUpdates.status === "Publish";
    } else if (finalUpdates.progress !== undefined && !finalUpdates.status) {
      finalUpdates.status = getStatusForProgress(finalUpdates.progress);
      finalUpdates.is_done = finalUpdates.progress === 100;
    }

    // Optimistic Local State Update (Langsung merefleksikan progress bar secara instan tanpa jeda)
    setPlans((prev) => prev.map((p) => (p.id === id ? { ...p, ...finalUpdates } : p)));

    try {
      const updated = await updateContentPlan(id, finalUpdates);
      setPlans((prev) => prev.map((p) => (p.id === id ? updated : p)));
      showToast("Data konten berhasil diperbarui.");
    } catch (err) {
      console.error("[content-planner] Quick update error:", err);
      showToast("Gagal memperbarui data.");
    }
  };

  // 6. Toggle Selesai (Done / Published)
  const handleToggleDone = async (id: string, isDone: boolean) => {
    const updates: Partial<ContentPlanInput> = {
      is_done: isDone,
      progress: isDone ? 100 : 75,
      status: isDone ? "Publish" : "Review",
    };

    // Optimistic local update
    setPlans((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));

    try {
      const updated = await toggleContentPlanDone(id, isDone);
      setPlans((prev) => prev.map((p) => (p.id === id ? updated : p)));
      showToast(
        isDone
          ? "Konten ditandai Selesai (100% Publish)."
          : "Status selesai konten dibatalkan (Kembali ke Review 75%)."
      );
    } catch (err) {
      console.error("[content-planner] Toggle done error:", err);
      showToast("Gagal mengubah status selesai.");
    }
  };

  // 7. Hapus Konten
  const confirmDelete = async (id: string) => {
    try {
      await deleteContentPlan(id);
      setPlans((prev) => prev.filter((p) => p.id !== id));
      showToast("Rencana konten berhasil dihapus.");
      setDeleteCandidate(null);
    } catch (err) {
      console.error("[content-planner] Delete error:", err);
      showToast("Gagal menghapus rencana konten.");
    }
  };

  // 8. Buka Modal untuk Tanggal Spesifik (klik baris putus-putus atau tombol "+" di kalender)
  const handleAddForDate = (dateStr: string) => {
    setEditingItem(null);
    setModalDefaultDate(dateStr);
    setIsModalOpen(true);
  };

  // 9. Reset Mock Data untuk kemudahan demo & pengujian
  const handleResetSeed = () => {
    const defaultData = resetContentPlansStorageToDefault();
    setPlans(defaultData);
    setSelectedPlatform("All");
    setSelectedYear(2026);
    setSelectedMonth(new Date().getMonth() + 1);
    setSelectedCw(getCalendarWeekNumber(new Date()));
    showToast("Data rencana konten direset ke acuan operasional tahun 2026.");
  };

  // Daftar Bulan
  const BULAN_OPTIONS = [
    { value: 1, label: "01. Januari" },
    { value: 2, label: "02. Februari" },
    { value: 3, label: "03. Maret" },
    { value: 4, label: "04. April" },
    { value: 5, label: "05. Mei" },
    { value: 6, label: "06. Juni" },
    { value: 7, label: "07. Juli" },
    { value: 8, label: "08. Agustus" },
    { value: 9, label: "09. September" },
    { value: 10, label: "10. Oktober" },
    { value: 11, label: "11. November" },
    { value: 12, label: "12. Desember" },
  ];

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* HEADER CONTROL BAR (SWISS MINIMALIST EDITORIAL)                            */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-[#001438] border border-[#00296E]/20 dark:border-[#00296E]/40 p-5 rounded-none shadow-none space-y-4 transition-colors">
        {/* Baris Atas: Breadcrumb & Realtime Sync Indicator */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#00296E]/15 dark:border-[#00296E]/30 pb-4">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">
              <span>02. ORGANISASI & ARSIP</span>
              <span>/</span>
              <span className="text-[#00296E] dark:text-[#38BDF8] font-bold">PERENCANAAN KONTEN & STRATEGI</span>
            </div>
            <h1 className="text-lg sm:text-xl font-black tracking-tight text-[#00296E] dark:text-white uppercase font-mono flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-[#0094E0] dark:text-[#38BDF8]" />
              <span>CONTENT PLANNING & EDITORIAL MATRIX</span>
            </h1>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              Papan kalender editorial Divisi Medkominfo tersinkronisasi real-time multi-pengurus.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Indikator Realtime WebSocket */}
            {isRealtimeActive ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30 text-[10px] font-mono tracking-wider">
                <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
                LIVE REALTIME SYNC
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30 text-[10px] font-mono tracking-wider">
                <span className="w-2 h-2 rounded-full bg-amber-500 dark:bg-amber-400" />
                OFFLINE LOCAL MODE
              </span>
            )}

            {/* Tombol Reset Default Seed Data */}
            <button
              type="button"
              onClick={handleResetSeed}
              className="p-1.5 border border-[#00296E]/20 dark:border-[#00296E]/40 text-slate-600 dark:text-slate-400 hover:text-[#00296E] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#00296E]/30 text-xs font-mono rounded-none transition-colors"
              title="Reset data ke acuan operasional (CW 22 & CW 23)"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Baris Tengah: Filter Platform Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
            <button
              type="button"
              onClick={() => setSelectedPlatform("All")}
              className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider rounded-none border transition-all ${
                selectedPlatform === "All"
                  ? "bg-[#00296E] text-white dark:bg-[#38BDF8] dark:text-[#001740] font-bold border-[#00296E] dark:border-[#38BDF8]"
                  : "bg-slate-100 dark:bg-[#001740] text-slate-600 dark:text-slate-400 hover:text-[#00296E] dark:hover:text-white hover:bg-slate-200 dark:hover:bg-[#00296E]/40 border-slate-200 dark:border-[#00296E]/40"
              }`}
            >
              Semua Platform
            </button>
            {PLATFORM_OPTIONS.map((plat) => (
              <button
                key={plat}
                type="button"
                onClick={() => setSelectedPlatform(plat)}
                className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider rounded-none border transition-all ${
                  selectedPlatform === plat
                    ? "bg-[#00296E] text-white dark:bg-[#38BDF8] dark:text-[#001740] font-bold border-[#00296E] dark:border-[#38BDF8]"
                    : "bg-slate-100 dark:bg-[#001740] text-slate-600 dark:text-slate-400 hover:text-[#00296E] dark:hover:text-white hover:bg-slate-200 dark:hover:bg-[#00296E]/40 border-slate-200 dark:border-[#00296E]/40"
                }`}
              >
                {plat}
              </button>
            ))}
          </div>

          {/* Tombol Aksi Tambah Jadwal Konten / Ajukan Ide */}
          <button
            type="button"
            onClick={() => {
              setEditingItem(null);
              setModalDefaultDate(undefined);
              setIsModalOpen(true);
            }}
            className="px-4 py-2 bg-[#00296E] hover:bg-[#00296E]/90 text-white dark:bg-[#38BDF8] dark:hover:bg-[#38BDF8]/90 dark:text-[#001740] font-bold text-xs font-mono uppercase tracking-wider rounded-none transition-colors flex items-center gap-2 shadow-none cursor-pointer"
          >
            {canManage ? (
              <>
                <Plus className="w-4 h-4" />
                <span>+ Tambah Jadwal Konten</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-300 dark:text-[#001740]" />
                <span>+ Ajukan Ide Konten</span>
              </>
            )}
          </button>
        </div>

        {/* Baris Bawah: Navigasi Periode (Tahun & Bulan), View Switcher, & Pencarian */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#00296E]/15 dark:border-[#00296E]/20">
          <div className="flex flex-wrap items-center gap-3">
            {/* Pemilih Tahun */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 uppercase font-semibold">Tahun:</span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="bg-white dark:bg-[#001740] border-2 border-[#00296E]/30 dark:border-[#38BDF8]/60 text-slate-900 dark:text-white px-2.5 py-1 text-xs font-mono font-semibold rounded-none focus:outline-none focus:border-[#00296E] dark:focus:border-[#38BDF8] transition-colors cursor-pointer shadow-sm"
              >
                <option value={2026} className="bg-white text-slate-900 dark:bg-[#001740] dark:text-white">2026</option>
                <option value={2027} className="bg-white text-slate-900 dark:bg-[#001740] dark:text-white">2027</option>
              </select>
            </div>

            {/* Pemilih Bulan */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 uppercase font-semibold">Bulan:</span>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="bg-white dark:bg-[#001740] border-2 border-[#00296E]/30 dark:border-[#38BDF8]/60 text-slate-900 dark:text-white px-2.5 py-1 text-xs font-mono font-semibold rounded-none focus:outline-none focus:border-[#00296E] dark:focus:border-[#38BDF8] transition-colors cursor-pointer shadow-sm"
              >
                {BULAN_OPTIONS.map((b) => (
                  <option key={b.value} value={b.value} className="bg-white text-slate-900 dark:bg-[#001740] dark:text-white">
                    {b.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Input Pencarian Cepat */}
            <div className="relative">
              <input
                type="text"
                placeholder="Cari topik / konsep..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-44 sm:w-56 bg-white dark:bg-[#001740] border border-[#00296E]/20 dark:border-[#00296E]/40 text-slate-800 dark:text-white pl-8 pr-3 py-1 text-xs font-mono rounded-none placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-[#00296E] dark:focus:border-[#38BDF8] transition-colors"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-2 text-slate-400 hover:text-slate-700 dark:hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* View Switcher: Matriks Mingguan (CW Table) vs Kalender Bulanan (Calendar Grid) */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#001740] p-1 border border-[#00296E]/20 dark:border-[#00296E]/40">
            <button
              type="button"
              onClick={() => setActiveView("cw-table")}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-mono uppercase tracking-wider rounded-none transition-colors cursor-pointer ${
                activeView === "cw-table"
                  ? "bg-[#00296E] text-white dark:bg-[#38BDF8] dark:text-[#001740] font-bold"
                  : "text-slate-600 dark:text-slate-400 hover:text-[#00296E] dark:hover:text-white"
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>Matriks CW</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveView("calendar-grid")}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-mono uppercase tracking-wider rounded-none transition-colors cursor-pointer ${
                activeView === "calendar-grid"
                  ? "bg-[#00296E] text-white dark:bg-[#38BDF8] dark:text-[#001740] font-bold"
                  : "text-slate-600 dark:text-slate-400 hover:text-[#00296E] dark:hover:text-white"
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Kalender Bulanan</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAMPILAN UTAMA (DUAL VIEW: CW TABLE ATAU CALENDAR GRID)                   */}
      {/* ========================================================================= */}
      {isLoading ? (
        <div className="p-12 text-center bg-white dark:bg-[#001438] border border-[#00296E]/20 dark:border-[#00296E]/40 rounded-none shadow-none transition-colors">
          <RefreshCw className="w-6 h-6 animate-spin text-[#0094E0] dark:text-[#38BDF8] mx-auto mb-3" />
          <p className="text-xs font-mono text-slate-600 dark:text-slate-400">
            Menyinkronkan lembar kerja perencanaan konten...
          </p>
        </div>
      ) : activeView === "cw-table" ? (
        <CwTableView
          plans={filteredPlans}
          selectedYear={selectedYear}
          selectedMonth={selectedMonth}
          selectedCw={selectedCw}
          onSelectCw={setSelectedCw}
          currentUserRole={currentUserRole}
          onEdit={(item) => {
            setEditingItem(item);
            setIsModalOpen(true);
          }}
          onDelete={(id) => {
            const candidate = plans.find((p) => p.id === id);
            if (candidate) setDeleteCandidate(candidate);
          }}
          onToggleDone={handleToggleDone}
          onQuickUpdate={handleQuickUpdate}
          onAddForDate={handleAddForDate}
        />
      ) : (
        <CalendarGridView
          plans={filteredPlans}
          selectedYear={selectedYear}
          selectedMonth={selectedMonth}
          currentUserRole={currentUserRole}
          onSelectContent={(item) => {
            setEditingItem(item);
            setIsModalOpen(true);
          }}
          onAddForDate={handleAddForDate}
        />
      )}

      {/* ========================================================================= */}
      {/* MODAL FORMULIR KONTEN (TAMBAH / EDIT / AJUKAN IDE)                         */}
      {/* ========================================================================= */}
      <ContentModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null);
          setModalDefaultDate(undefined);
        }}
        onSave={handleSaveModal}
        initialData={editingItem}
        defaultDate={modalDefaultDate}
        defaultPlatform={selectedPlatform === "All" ? "TikTok" : (selectedPlatform as PlatformKonten)}
        currentUserRole={currentUserRole}
        isSubmitting={isSubmitting}
      />

      {/* ========================================================================= */}
      {/* DIALOG KONFIRMASI HAPUS                                                   */}
      {/* ========================================================================= */}
      {deleteCandidate && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-[#001438] border border-red-500/40 p-5 max-w-md w-full space-y-4 rounded-none shadow-2xl text-slate-800 dark:text-slate-100 transition-colors">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-bold text-sm uppercase tracking-wider font-mono">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>Konfirmasi Hapus Rencana Konten</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Apakah Anda yakin ingin menghapus slot konten berikut dari kalender editorial?
              <span className="block mt-2 p-2 bg-slate-50 dark:bg-[#001740] border border-[#00296E]/20 dark:border-[#00296E]/40 font-mono text-slate-800 dark:text-white text-[11px]">
                {deleteCandidate.platform} • CW {deleteCandidate.calendar_week} ({deleteCandidate.tanggal})
                <br />
                <span className="font-bold text-slate-900 dark:text-slate-100 mt-1 block">
                  "{deleteCandidate.topik}"
                </span>
              </span>
            </p>
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#00296E]/15 dark:border-[#00296E]/30">
              <button
                type="button"
                onClick={() => setDeleteCandidate(null)}
                className="px-3.5 py-1.5 border border-slate-300 dark:border-[#00296E]/40 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:text-white text-xs font-mono rounded-none transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => confirmDelete(deleteCandidate.id)}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs font-mono rounded-none transition-colors cursor-pointer shadow-none"
              >
                Hapus Permanen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TOAST NOTIFICATION (SWISS FLOATING)                                       */}
      {/* ========================================================================= */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-white dark:bg-[#001740] text-slate-900 dark:text-white border border-[#00296E]/30 dark:border-[#38BDF8]/40 px-4 py-3 rounded-none shadow-2xl flex items-center gap-3 font-mono text-xs max-w-md animate-in fade-in slide-in-from-bottom-2 transition-colors">
          <Info className="w-4 h-4 text-[#0094E0] dark:text-[#38BDF8] shrink-0" />
          <span>{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-white ml-auto"
            title="Tutup pemberitahuan"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
