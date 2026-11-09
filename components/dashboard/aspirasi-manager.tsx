"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  ChatTeardropText,
  MagnifyingGlass,
  ArrowsClockwise,
  CheckCircle,
  Clock,
  WarningCircle,
  Warning,
  Trash,
  Copy,
  Check,
  Eye,
  EyeSlash,
  Lock,
  PaperPlaneTilt,
  X,
  ShieldCheck,
  Funnel,
  Sparkle,
  EnvelopeSimple,
  ArrowClockwise,
  Spinner,
} from "@phosphor-icons/react";
import {
  type AspirasiItem,
  type AspirasiStatus,
} from "@/lib/types/aspirasi";
import {
  getAspirasiList,
  updateAspirasiStatus,
  selesaikanAspirasi,
  deleteAspirasi,
  subscribeToAspirasi,
} from "@/lib/supabase/aspirasi";
import { maskEmail } from "@/lib/utils/mask-email";
import { type UserRole } from "@/lib/types/auth";

export interface AspirasiManagerProps {
  currentUserRole?: UserRole | string;
  currentUserName?: string;
}

export default function AspirasiManager({
  currentUserRole = "medkominfo",
  currentUserName = "Pengurus HIMASI",
}: AspirasiManagerProps) {
  // Otoritas pimpinan / admin untuk aksi destruktif (hapus)
  const canDelete =
    !currentUserRole ||
    currentUserRole === "super_admin" ||
    currentUserRole === "bph" ||
    currentUserRole === "admin";

  // Data utama & Loading state
  const [aspirasiList, setAspirasiList] = useState<AspirasiItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubscribing, setIsSubscribing] = useState<boolean>(false);

  // Filter & Search state
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("semua");

  // Privacy & Interactive state
  const [revealedEmails, setRevealedEmails] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modal Selesaikan Aspirasi state
  const [resolvingItem, setResolvingItem] = useState<AspirasiItem | null>(null);
  const [jawabanAdmin, setJawabanAdmin] = useState<string>("");
  const [dijawabOleh, setDijawabOleh] = useState<string>(currentUserName || "Pengurus HIMASI");
  const [isSubmittingResolution, setIsSubmittingResolution] = useState<boolean>(false);
  const [resolutionError, setResolutionError] = useState<string | null>(null);

  // Email retry state
  const [retryingEmailId, setRetryingEmailId] = useState<string | null>(null);

  // Modal Konfirmasi Hapus state
  const [deleteCandidate, setDeleteCandidate] = useState<AspirasiItem | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Toast notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  const showToast = useCallback((msg: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastMessage(msg);
    toastTimerRef.current = setTimeout(() => {
      setToastMessage(null);
      toastTimerRef.current = null;
    }, 3500);
  }, []);

  // 1. Membaca data dari Service Supabase / Fallback Offline
  const loadAspirasi = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getAspirasiList();
      setAspirasiList(data);
    } catch (err) {
      console.error("[AspirasiManager] Gagal memuat aspirasi:", err);
      showToast("Gagal memuat aspirasi dari database.");
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  // 2. Inisialisasi awal dan sinkronisasi Real-time WebSocket
  useEffect(() => {
    loadAspirasi();

    const unsubscribe = subscribeToAspirasi((payload) => {
      setIsSubscribing(true);
      if (payload.eventType === "INSERT" && payload.new) {
        const newItem = payload.new;
        setAspirasiList((prev) => {
          if (prev.some((item) => item.id === newItem.id)) return prev;
          return [newItem, ...prev];
        });
      } else if (payload.eventType === "UPDATE" && payload.new) {
        const updatedItem = payload.new;
        setAspirasiList((prev) =>
          prev.map((item) => (item.id === updatedItem.id ? updatedItem : item))
        );
      } else if (payload.eventType === "DELETE" && payload.old) {
        const deletedId = payload.old.id;
        setAspirasiList((prev) => prev.filter((item) => item.id !== deletedId));
      }
    });

    return () => {
      unsubscribe();
    };
  }, [loadAspirasi]);

  // 3. Statistik Metrik
  const metrics = useMemo(() => {
    const total = aspirasiList.length;
    const baru = aspirasiList.filter((a) => a.status === "baru").length;
    const diproses = aspirasiList.filter((a) => a.status === "diproses").length;
    const selesai = aspirasiList.filter((a) => a.status === "selesai").length;
    return { total, baru, diproses, selesai };
  }, [aspirasiList]);

  // 4. Data Terfilter
  const filteredList = useMemo(() => {
    return aspirasiList.filter((item) => {
      const matchStatus =
        statusFilter === "semua" || item.status.toLowerCase() === statusFilter.toLowerCase();
      if (!matchStatus) return false;

      if (!searchQuery.trim()) return true;
      const term = searchQuery.toLowerCase().trim();
      const matchPesan = item.pesan.toLowerCase().includes(term);
      const matchEmail = item.email.toLowerCase().includes(term);
      const matchTiket = item.nomor_tiket?.toLowerCase().includes(term);
      const matchAngkatan = item.angkatan?.toLowerCase().includes(term);
      return matchPesan || matchEmail || matchTiket || matchAngkatan;
    });
  }, [aspirasiList, statusFilter, searchQuery]);

  // Handler: Proses Aspirasi (status: baru -> diproses)
  const handleProses = async (id: string) => {
    try {
      const updated = await updateAspirasiStatus(id, "diproses", currentUserName, currentUserRole);
      setAspirasiList((prev) => prev.map((item) => (item.id === id ? updated : item)));
      showToast(`Tiket ${updated.nomor_tiket} sedang diproses.`);
    } catch (err: any) {
      showToast(err.message || "Gagal mengubah status aspirasi.");
    }
  };

  // Handler: Buka Modal Tanggapi & Selesaikan
  const handleOpenResolveModal = (item: AspirasiItem) => {
    if (item.status === "selesai") {
      showToast("Aspirasi berstatus selesai telah dikunci permanen.");
      return;
    }
    setResolvingItem(item);
    setJawabanAdmin("");
    setResolutionError(null);
  };

  // Handler: Submit Penyelesaian via POST /api/aspirasi/selesai
  const handleSubmitResolution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingItem) return;

    const trimmedJawaban = jawabanAdmin.trim();
    if (!trimmedJawaban) {
      setResolutionError("Jawaban resmi admin wajib diisi.");
      return;
    }

    setIsSubmittingResolution(true);
    setResolutionError(null);

    try {
      // Panggil server route POST /api/aspirasi/selesai
      const response = await fetch("/api/aspirasi/selesai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: resolvingItem.id,
          jawaban_admin: trimmedJawaban,
          dijawab_oleh: dijawabOleh.trim() || "Pengurus HIMASI",
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Gagal menyelesaikan aspirasi.");
      }

      const updatedItem: AspirasiItem = result.data;
      setAspirasiList((prev) =>
        prev.map((item) => (item.id === updatedItem.id ? updatedItem : item))
      );

      showToast(`Tiket ${updatedItem.nomor_tiket} berhasil diselesaikan dan tanggapan dikunci permanen.`);
      setResolvingItem(null);
      setJawabanAdmin("");
    } catch (err: any) {
      console.warn("[AspirasiManager] API error, fallback ke service layer:", err);
      // Fallback service layer jika fetch gagal (misal server offline)
      try {
        const updated = await selesaikanAspirasi(resolvingItem.id, {
          jawaban_admin: trimmedJawaban,
          dijawab_oleh: dijawabOleh.trim() || "Pengurus HIMASI",
        });
        setAspirasiList((prev) =>
          prev.map((item) => (item.id === updated.id ? updated : item))
        );
        showToast(`Tiket ${updated.nomor_tiket} berhasil diselesaikan (fallback offline).`);
        setResolvingItem(null);
        setJawabanAdmin("");
      } catch (fallbackErr: any) {
        setResolutionError(fallbackErr.message || err.message || "Gagal menyimpan tanggapan.");
      }
    } finally {
      setIsSubmittingResolution(false);
    }
  };

  // Handler: Konfirmasi & Hapus Aspirasi
  const handleConfirmDelete = async () => {
    if (!deleteCandidate) return;
    setIsDeleting(true);
    try {
      await deleteAspirasi(deleteCandidate.id, currentUserName, currentUserRole);
      setAspirasiList((prev) => prev.filter((item) => item.id !== deleteCandidate.id));
      showToast(`Aspirasi ${deleteCandidate.nomor_tiket} berhasil dihapus.`);
      setDeleteCandidate(null);
    } catch (err: any) {
      showToast(err.message || "Gagal menghapus catatan aspirasi.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Handler: Kirim Ulang Email Tanggapan
  const handleRetryEmail = async (id: string) => {
    setRetryingEmailId(id);
    try {
      const res = await fetch("/api/aspirasi/retry-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message || "Email resmi berhasil dikirim ulang!");
        setAspirasiList((prev) =>
          prev.map((item) =>
            item.id === id ? { ...item, status_email: "terkirim" } : item
          )
        );
      } else {
        showToast(`Gagal mengirim ulang email: ${data.error || "Terjadi kesalahan"}`);
      }
    } catch {
      showToast("Gagal menghubungi server untuk mengirim ulang email.");
    } finally {
      setRetryingEmailId(null);
    }
  };

  // Handler: Salin Email ke Clipboard
  const handleCopyEmail = async (id: string, rawEmail: string) => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(rawEmail);
      }
      setCopiedId(id);
      showToast("Alamat email berhasil disalin ke clipboard.");
      setTimeout(() => {
        setCopiedId((current) => (current === id ? null : current));
      }, 2000);
    } catch {
      showToast("Gagal menyalin email ke clipboard.");
    }
  };

  // Handler: Toggle Peek (Lihat / Sensor Email)
  const handleTogglePeek = (id: string) => {
    setRevealedEmails((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Header Swiss Minimalist & Actions */}
      <div className="bg-white dark:bg-[#001438] p-4 sm:p-5 border border-[#00296E]/15 dark:border-white/10 rounded-none shadow-none flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-[10px] uppercase tracking-widest text-[#00296E] dark:text-[#38BDF8] px-1.5 py-0.5 border border-[#00296E]/20 dark:border-[#38BDF8]/20 bg-[#00296E]/5 dark:bg-[#38BDF8]/5 rounded-none font-bold">
              SYS-ASPIRASI
            </span>
            <span className="text-slate-400 dark:text-slate-500 text-xs font-mono">/</span>
            <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              MAHASISWA &amp; ALUMNI
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-[#00296E] dark:text-white uppercase tracking-wider font-mono">
            Kotak Aspirasi Mahasiswa
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Pusat penanganan aspirasi, kritik, dan saran konstruktif dari sivitas akademika HIMASI ISB Atma Luhur.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={loadAspirasi}
            disabled={isLoading}
            className="flex-1 sm:flex-none px-3.5 py-2 rounded-none border border-[#00296E]/15 dark:border-white/10 bg-white dark:bg-[#001740] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 text-xs font-mono uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <ArrowsClockwise className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-[#00296E] dark:text-[#38BDF8]" : ""}`} />
            <span>Segarkan</span>
          </button>
        </div>
      </div>

      {/* 2. Grid Statistik Metrik */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Aspirasi */}
        <div className="bg-white dark:bg-[#001438] p-4 border border-[#00296E]/15 dark:border-white/10 rounded-none shadow-none flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-mono uppercase tracking-wider font-medium">Total Aspirasi</span>
            <ChatTeardropText className="w-4 h-4 text-[#00296E] dark:text-[#38BDF8]" />
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 dark:text-white">
              {metrics.total}
            </span>
            <span className="text-[10px] font-mono text-slate-400 block mt-0.5">tiket terekam</span>
          </div>
        </div>

        {/* Status Baru (High Contrast Alert) */}
        <div
          className={`p-4 border rounded-none shadow-none flex flex-col justify-between transition-colors ${
            metrics.baru > 0
              ? "bg-amber-500/10 dark:bg-amber-500/15 border-amber-500/40 text-amber-900 dark:text-amber-200"
              : "bg-white dark:bg-[#001438] border-[#00296E]/15 dark:border-white/10 text-slate-900 dark:text-white"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider font-bold">Baru Masuk</span>
            {metrics.baru > 0 ? (
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
              </span>
            ) : (
              <Clock className="w-4 h-4 text-slate-400" />
            )}
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-bold font-mono">
              {metrics.baru}
            </span>
            <span className="text-[10px] font-mono block mt-0.5 font-medium opacity-80">
              {metrics.baru > 0 ? "memerlukan respon" : "tidak ada tiket baru"}
            </span>
          </div>
        </div>

        {/* Status Diproses */}
        <div className="bg-white dark:bg-[#001438] p-4 border border-[#00296E]/15 dark:border-white/10 rounded-none shadow-none flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-mono uppercase tracking-wider font-medium">Sedang Diproses</span>
            <Clock className="w-4 h-4 text-sky-500" />
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 dark:text-white">
              {metrics.diproses}
            </span>
            <span className="text-[10px] font-mono text-slate-400 block mt-0.5">dalam pembahasan divisi</span>
          </div>
        </div>

        {/* Status Selesai */}
        <div className="bg-white dark:bg-[#001438] p-4 border border-[#00296E]/15 dark:border-white/10 rounded-none shadow-none flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-mono uppercase tracking-wider font-medium">Telah Selesai</span>
            <CheckCircle className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 dark:text-white">
              {metrics.selesai}
            </span>
            <span className="text-[10px] font-mono text-slate-400 block mt-0.5">terkunci &amp; terjawab</span>
          </div>
        </div>
      </div>

      {/* 3. Toolbar Pencarian & Filter Tabs */}
      <div className="bg-white dark:bg-[#001438] p-3.5 border border-[#00296E]/15 dark:border-white/10 rounded-none shadow-none flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Cari berdasarkan no tiket, email, angkatan, atau kutipan pesan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-xs rounded-none border border-[#00296E]/20 dark:border-white/20 bg-white dark:bg-[#001740] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#00296E] dark:focus:border-[#38BDF8] font-mono"
          />
          <MagnifyingGlass className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
          {(["semua", "baru", "diproses", "selesai"] as const).map((status) => {
            const count =
              status === "semua"
                ? metrics.total
                : status === "baru"
                ? metrics.baru
                : status === "diproses"
                ? metrics.diproses
                : metrics.selesai;

            const isSelected = statusFilter === status;
            return (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-none text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-[#00296E] dark:bg-[#38BDF8] text-white dark:text-[#001740] font-bold"
                    : "border border-[#00296E]/15 dark:border-white/10 bg-white dark:bg-[#001740] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 font-medium"
                }`}
              >
                <span>{status}</span>
                <span
                  className={`text-[10px] px-1 py-0.2 rounded-none font-bold ${
                    isSelected
                      ? "bg-white/20 dark:bg-black/20 text-white dark:text-[#001740]"
                      : "bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Grid Kartu Aspirasi (Swiss Minimalist Grid) */}
      {isLoading ? (
        <div className="p-16 text-center bg-white dark:bg-[#001438] border border-[#00296E]/15 dark:border-white/10 rounded-none shadow-none">
          <ArrowsClockwise className="w-6 h-6 text-[#00296E] dark:text-[#38BDF8] animate-spin mx-auto mb-3" />
          <p className="text-xs font-mono text-slate-500 uppercase tracking-wider">
            Memuat data aspirasi dari Supabase...
          </p>
        </div>
      ) : filteredList.length === 0 ? (
        <div className="p-16 text-center bg-white dark:bg-[#001438] border border-[#00296E]/15 dark:border-white/10 rounded-none shadow-none">
          <ChatTeardropText className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 font-mono">
            Tidak ada aspirasi yang cocok
          </h3>
          <p className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto font-mono">
            {searchQuery
              ? "Coba ganti kata kunci pencarian atau sesuaikan tab filter."
              : "Belum ada tiket aspirasi yang tercatat dalam kategori ini."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredList.map((item) => {
            const isRevealed = !!revealedEmails[item.id];
            const displayEmail = isRevealed ? item.email : maskEmail(item.email);
            const isSelesai = item.status === "selesai";
            const isDiproses = item.status === "diproses";
            const isBaru = item.status === "baru";

            return (
              <div
                key={item.id}
                className={`bg-white dark:bg-[#001438] border p-4 sm:p-5 rounded-none shadow-none flex flex-col justify-between transition-colors relative group ${
                  isSelesai
                    ? "border-emerald-500/30 dark:border-emerald-500/20"
                    : isBaru
                    ? "border-amber-500/30 dark:border-amber-500/20 hover:border-amber-500"
                    : "border-[#00296E]/15 dark:border-white/10 hover:border-[#00296E] dark:hover:border-[#38BDF8]"
                }`}
              >
                <div>
                  {/* Baris Atas: Monospace Ticket Badge & Angkatan */}
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs font-bold text-[#00296E] dark:text-[#38BDF8] tracking-wider px-1.5 py-0.5 bg-[#00296E]/5 dark:bg-white/5 border border-[#00296E]/15 dark:border-white/10 rounded-none">
                        {item.nomor_tiket || "ASP-PENDING"}
                      </span>
                      <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded-none border border-[#00296E]/15 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-slate-300">
                        Angkatan {item.angkatan}
                      </span>
                    </div>

                    {/* Status Solid Badge */}
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-none uppercase tracking-wider font-bold ${
                        isBaru
                          ? "bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30"
                          : isDiproses
                          ? "bg-sky-500/15 text-sky-800 dark:text-sky-300 border border-sky-500/30"
                          : "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 flex items-center gap-1"
                      }`}
                    >
                      {isSelesai && <Lock className="w-2.5 h-2.5 inline" />}
                      {item.status}
                    </span>
                  </div>

                  {/* Info Pengirim dengan Privacy Masking, Copy, & Peek */}
                  <div className="flex items-center justify-between gap-2 py-1.5 px-2 bg-slate-50 dark:bg-[#001740] border border-[#00296E]/10 dark:border-white/10 rounded-none mb-3">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="text-[11px] font-mono font-medium text-slate-700 dark:text-slate-200 truncate">
                        {displayEmail}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      {/* Tombol Peek (Intip / Sembunyikan Email) */}
                      <button
                        type="button"
                        onClick={() => handleTogglePeek(item.id)}
                        className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-white/10 rounded-none transition-colors cursor-pointer"
                        title={isRevealed ? "Sensor Alamat Email" : "Tampilkan Alamat Email Lengkap"}
                      >
                        {isRevealed ? <EyeSlash className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>

                      {/* Tombol Salin Email */}
                      <button
                        type="button"
                        onClick={() => handleCopyEmail(item.id, item.email)}
                        className="p-1 text-slate-400 hover:text-[#00296E] dark:hover:text-[#38BDF8] hover:bg-slate-200/50 dark:hover:bg-white/10 rounded-none transition-colors cursor-pointer"
                        title="Salin Email Asli"
                      >
                        {copiedId === item.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Pesan Aspirasi: Blockquote Swiss Minimalist */}
                  <div className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-normal bg-slate-50/70 dark:bg-[#001740]/40 p-3 border-l-2 border-[#00296E] dark:border-[#38BDF8] rounded-none mb-3">
                    <p className="line-clamp-5 whitespace-pre-wrap italic">
                      &ldquo;{item.pesan}&rdquo;
                    </p>
                  </div>

                  {/* Kotak Jawaban Resmi Admin (Jika Sudah Selesai) */}
                  {isSelesai && (
                    <div className="p-3 bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/25 rounded-none space-y-2 mb-3">
                      <div className="flex items-center justify-between gap-1 text-[10px] font-mono text-emerald-800 dark:text-emerald-300 font-bold uppercase tracking-wider">
                        <span className="flex items-center gap-1">
                          <CheckCircle className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                          Telah Ditanggapi
                        </span>
                        <span className="text-slate-400 dark:text-slate-400 font-normal">
                          {item.dijawab_oleh || "Pengurus HIMASI"}
                        </span>
                      </div>
                      <p className="text-xs text-emerald-950 dark:text-emerald-100 font-normal leading-relaxed whitespace-pre-wrap">
                        {item.jawaban_admin || item.catatan_pengurus || "Aspirasi telah ditindaklanjuti."}
                      </p>
                      {/* Status Pengiriman Email & Timestamp */}
                      <div className="pt-2 border-t border-emerald-500/20 flex flex-wrap items-center justify-between gap-1 text-[10px] font-mono">
                        {item.status_email === "terkirim" && (
                          <span className="inline-flex items-center gap-1 text-emerald-800 dark:text-emerald-300 font-semibold">
                            <CheckCircle className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                            Email Terkirim
                          </span>
                        )}
                        {item.status_email === "pending" && (
                          <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-400 font-semibold">
                            <Spinner className="w-3 h-3 animate-spin" />
                            Mengirim Email...
                          </span>
                        )}
                        {item.status_email === "simulasi_terkirim" && (
                          <span className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-400 font-normal">
                            <EnvelopeSimple className="w-3 h-3" />
                            Simulasi Email
                          </span>
                        )}
                        {item.status_email === "gagal" && (
                          <div className="flex items-center gap-1.5">
                            <span className="inline-flex items-center gap-1 text-rose-700 dark:text-rose-400 font-semibold">
                              <WarningCircle className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                              Email Gagal
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRetryEmail(item.id)}
                              disabled={retryingEmailId === item.id}
                              className="px-2 py-0.5 rounded-none border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-300 text-[9px] font-mono uppercase tracking-wider font-bold transition-colors cursor-pointer flex items-center gap-1"
                              title="Kirim ulang email notifikasi resmi ke pengirim"
                            >
                              {retryingEmailId === item.id ? (
                                <>
                                  <Spinner className="w-2.5 h-2.5 animate-spin" />
                                  <span>Mengirim...</span>
                                </>
                              ) : (
                                <>
                                  <ArrowClockwise className="w-2.5 h-2.5" />
                                  <span>Kirim Ulang</span>
                                </>
                              )}
                            </button>
                          </div>
                        )}

                        {item.dijawab_pada && (
                          <span className="text-emerald-700/80 dark:text-emerald-400/80 text-[10px]">
                            {new Date(item.dijawab_pada).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Baris Bawah: Timestamp & Aksi */}
                <div className="mt-2 pt-3 border-t border-[#00296E]/10 dark:border-white/10 flex items-center justify-between gap-2">
                  <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                    {item.created_at
                      ? new Date(item.created_at).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : "Baru saja"}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {/* Aksi 1: Status Baru -> Tombol Proses */}
                    {isBaru && (
                      <button
                        type="button"
                        onClick={() => handleProses(item.id)}
                        className="px-2.5 py-1 rounded-none border border-[#00296E]/20 dark:border-white/15 bg-[#00296E]/5 dark:bg-white/5 text-[#00296E] dark:text-[#38BDF8] hover:bg-[#00296E]/10 dark:hover:bg-white/10 text-[10px] font-mono uppercase tracking-wider font-bold transition-colors cursor-pointer"
                      >
                        Proses
                      </button>
                    )}

                    {/* Aksi 2: Status Diproses -> Tombol Tanggapi & Selesaikan */}
                    {isDiproses && (
                      <button
                        type="button"
                        onClick={() => handleOpenResolveModal(item)}
                        className="px-2.5 py-1 rounded-none border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 text-[10px] font-mono uppercase tracking-wider font-bold transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <span>Tanggapi &amp; Selesaikan</span>
                      </button>
                    )}

                    {/* Aksi 3: Status Selesai -> Permanent Immutability Lock (No edit/status change buttons) */}
                    {isSelesai && (
                      <span className="px-2 py-0.5 rounded-none border border-emerald-500/20 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 text-[10px] font-mono uppercase tracking-wider font-bold flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5" />
                        Terkunci Permanen
                      </span>
                    )}

                    {/* Aksi 4: Tombol Hapus (Khusus Admin / Pimpinan) */}
                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => setDeleteCandidate(item)}
                        className="p-1 rounded-none text-slate-400 hover:text-rose-600 hover:bg-rose-500/10 transition-colors cursor-pointer ml-1"
                        title="Hapus Tiket Aspirasi"
                      >
                        <Trash className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. MODAL RESOLUSI: Tanggapi & Selesaikan Aspirasi */}
      {resolvingItem && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div className="bg-white dark:bg-[#001438] border border-[#00296E]/20 dark:border-white/15 w-full max-w-lg p-5 sm:p-6 rounded-none shadow-2xl relative space-y-4">
            {/* Header Modal */}
            <div className="flex items-start justify-between gap-3 border-b border-[#00296E]/10 dark:border-white/10 pb-3">
              <div>
                <span className="font-mono text-[10px] uppercase tracking-widest text-emerald-600 dark:text-emerald-400 font-bold">
                  PENYELESAIAN TIKET RESMI
                </span>
                <h3 className="text-base sm:text-lg font-bold text-[#00296E] dark:text-white uppercase font-mono tracking-wider mt-0.5">
                  Tanggapi &amp; Selesaikan Aspirasi
                </h3>
              </div>
              <button
                type="button"
                onClick={() => !isSubmittingResolution && setResolvingItem(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Ringkasan Tiket */}
            <div className="p-3 bg-slate-50 dark:bg-[#001740] border border-[#00296E]/10 dark:border-white/10 rounded-none space-y-1.5 text-xs font-mono">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span>Tiket: <strong className="text-[#00296E] dark:text-[#38BDF8]">{resolvingItem.nomor_tiket}</strong></span>
                <span>Angkatan: <strong>{resolvingItem.angkatan}</strong></span>
              </div>
              <div className="text-slate-600 dark:text-slate-300">
                Pengirim: <span>{maskEmail(resolvingItem.email)}</span>
              </div>
              <div className="pt-2 border-t border-[#00296E]/10 dark:border-white/10 text-slate-700 dark:text-slate-200 italic line-clamp-3">
                &ldquo;{resolvingItem.pesan}&rdquo;
              </div>
            </div>

            {/* Banner Peringatan Penguncian Permanen (Immutability Lock) */}
            <div className="p-3 bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 rounded-none flex items-start gap-2.5">
              <Warning className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-[11px] font-mono text-amber-900 dark:text-amber-200 leading-relaxed">
                Setelah ditandai selesai, tanggapan ini akan dikunci permanen dan tidak dapat disunting kembali. Mahasiswa akan menerima notifikasi status penyelesaian.
              </p>
            </div>

            {/* Form Input Jawaban Admin */}
            <form onSubmit={handleSubmitResolution} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Nama / Perwakilan Penjawab
                </label>
                <input
                  type="text"
                  value={dijawabOleh}
                  onChange={(e) => setDijawabOleh(e.target.value)}
                  placeholder="Contoh: Pengurus HIMASI / Divisi Humas"
                  className="w-full px-3 py-2 text-xs rounded-none border border-[#00296E]/20 dark:border-white/20 bg-white dark:bg-[#001740] text-slate-900 dark:text-white font-mono focus:outline-none focus:border-[#00296E] dark:focus:border-[#38BDF8]"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Jawaban Resmi Pengurus <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={jawabanAdmin}
                  onChange={(e) => setJawabanAdmin(e.target.value)}
                  placeholder="Tuliskan jawaban komprehensif, solusi teknis, atau tindak lanjut yang telah diambil oleh pengurus..."
                  className="w-full px-3 py-2 text-xs rounded-none border border-[#00296E]/20 dark:border-white/20 bg-white dark:bg-[#001740] text-slate-900 dark:text-white font-normal focus:outline-none focus:border-[#00296E] dark:focus:border-[#38BDF8]"
                />
              </div>

              {resolutionError && (
                <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs font-mono">
                  {resolutionError}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#00296E]/10 dark:border-white/10">
                <button
                  type="button"
                  disabled={isSubmittingResolution}
                  onClick={() => setResolvingItem(null)}
                  className="px-4 py-2 rounded-none border border-[#00296E]/15 dark:border-white/10 bg-white dark:bg-[#001740] text-slate-700 dark:text-slate-300 text-xs font-mono uppercase tracking-wider hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingResolution || !jawabanAdmin.trim()}
                  className="px-4 py-2 rounded-none bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-mono uppercase tracking-wider font-bold cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSubmittingResolution ? (
                    <>
                      <ArrowsClockwise className="w-3.5 h-3.5 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <PaperPlaneTilt className="w-3.5 h-3.5" />
                      <span>Kirim Jawaban &amp; Tandai Selesai</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. MODAL KONFIRMASI HAPUS ASPIRASI */}
      {deleteCandidate && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div className="bg-white dark:bg-[#001438] border border-rose-500/30 dark:border-rose-500/20 w-full max-w-md p-5 sm:p-6 rounded-none shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <div className="p-2 bg-rose-500/10 border border-rose-500/20 rounded-none">
                <Trash className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white font-mono uppercase">
                  Hapus Tiket Aspirasi?
                </h3>
                <p className="text-[11px] font-mono text-slate-400">
                  Tindakan ini permanen dan tidak dapat dibatalkan.
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-[#001740] border border-[#00296E]/10 dark:border-white/10 rounded-none text-xs font-mono space-y-1">
              <div>Tiket: <strong className="text-[#00296E] dark:text-[#38BDF8]">{deleteCandidate.nomor_tiket}</strong></div>
              <div>Pengirim: <span>{maskEmail(deleteCandidate.email)}</span> (Angkatan {deleteCandidate.angkatan})</div>
              <div className="pt-1.5 text-slate-600 dark:text-slate-300 italic line-clamp-2">
                &ldquo;{deleteCandidate.pesan}&rdquo;
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#00296E]/10 dark:border-white/10">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteCandidate(null)}
                className="px-4 py-2 rounded-none border border-[#00296E]/15 dark:border-white/10 bg-white dark:bg-[#001740] text-slate-700 dark:text-slate-300 text-xs font-mono uppercase tracking-wider hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-none bg-rose-600 hover:bg-rose-700 text-white text-xs font-mono uppercase tracking-wider font-bold cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                {isDeleting ? (
                  <>
                    <ArrowsClockwise className="w-3.5 h-3.5 animate-spin" />
                    <span>Menghapus...</span>
                  </>
                ) : (
                  <>
                    <Trash className="w-3.5 h-3.5" />
                    <span>Ya, Hapus Permanen</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[100] max-w-md bg-[#001438] text-white border border-[#38BDF8]/40 px-4 py-3 rounded-none shadow-2xl animate-in slide-in-from-bottom-2 duration-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkle className="w-4 h-4 text-[#38BDF8] flex-shrink-0" />
            <p className="text-xs font-mono tracking-wide">{toastMessage}</p>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white p-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
