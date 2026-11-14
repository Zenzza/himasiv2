"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  MagnifyingGlass,
  ArrowRight,
  Newspaper,
  CalendarBlank,
  QrCode,
  FileText,
  ChatCircleDots,
  Users,
  ShieldCheck,
  Link as LinkIcon,
  GearSix,
  Moon,
  Sun,
  ArrowsClockwise,
  ArrowSquareOut,
  Sparkle,
  Checks,
  CheckCircle,
  Database,
  CalendarCheck,
  TrendUp,
  X,
  Compass,
} from "@phosphor-icons/react";
import {
  type DashboardTabKey,
  type UserRole,
  canAccessTab,
} from "@/lib/types/auth";

export interface CommandPaletteAction {
  id: string;
  title: string;
  subtitle?: string;
  category: "Navigasi Modul" | "Tindakan Cepat" | "Tautan Publik";
  icon: React.ReactNode;
  keywords?: string[];
  tabKey?: DashboardTabKey;
  onExecute: () => void;
  requiredRole?: UserRole[];
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: DashboardTabKey) => void;
  currentUserRole?: UserRole;
  onToggleTheme: () => void;
  isDarkMode: boolean;
  onRefreshData?: () => void;
  showToast?: (msg: string) => void;
}

export default function CommandPalette({
  isOpen,
  onClose,
  onNavigateTab,
  currentUserRole = "humas_biskraf",
  onToggleTheme,
  isDarkMode,
  onRefreshData,
  showToast,
}: CommandPaletteProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  // Focus input saat terbuka
  useEffect(() => {
    if (isOpen) {
      setSearchQuery("");
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Daftar Semua Perintah Command Palette
  const allActions = useMemo<CommandPaletteAction[]>(() => {
    const actions: CommandPaletteAction[] = [
      // NAVIGASI MODUL
      {
        id: "nav-overview",
        title: "Dasbor Ringkasan (Overview)",
        subtitle: "Monitoring KPI, aktivitas terkini, dan triage operasional",
        category: "Navigasi Modul",
        icon: <TrendUp className="w-4 h-4 text-[#0094E0] dark:text-[#38BDF8]" />,
        tabKey: "overview",
        keywords: ["dashboard", "home", "ringkasan", "kpi", "beranda", "metrik"],
        onExecute: () => onNavigateTab("overview"),
      },
      {
        id: "nav-berita",
        title: "Manajemen Berita & Artikel",
        subtitle: "Kelola rilis pers, artikel kegiatan, dan publikasi warta",
        category: "Navigasi Modul",
        icon: <Newspaper className="w-4 h-4 text-sky-500" />,
        tabKey: "berita",
        keywords: ["berita", "artikel", "warta", "post", "news", "publikasi"],
        onExecute: () => onNavigateTab("berita"),
      },
      {
        id: "nav-kalender",
        title: "Kalender Agenda Kegiatan",
        subtitle: "Jadwal program kerja, rapat rutin, dan kalender akademik",
        category: "Navigasi Modul",
        icon: <CalendarBlank className="w-4 h-4 text-indigo-500" />,
        tabKey: "kalender",
        keywords: ["agenda", "kalender", "jadwal", "event", "rapat", "acara"],
        onExecute: () => onNavigateTab("kalender"),
      },
      {
        id: "nav-voting",
        title: "CMS E-Voting / Pemilu Raya",
        subtitle: "Pusat kendali sesi voting, verifikasi DPT, dan bilik suara",
        category: "Navigasi Modul",
        icon: <Checks className="w-4 h-4 text-emerald-500" />,
        tabKey: "voting",
        keywords: ["voting", "evote", "pemira", "pemilu", "ketua", "dpt", "kandidat"],
        onExecute: () => onNavigateTab("voting"),
      },
      {
        id: "nav-apresiasi",
        title: "Manajemen Apresia-SI Mahasiswa",
        subtitle: "Kurasi karya, portofolio, dan prestasi civitas akademika",
        category: "Navigasi Modul",
        icon: <Sparkle className="w-4 h-4 text-amber-500" />,
        tabKey: "apresiasi",
        keywords: ["apresiasi", "karya", "prestasi", "showcase", "mahasiswa", "submisi"],
        onExecute: () => onNavigateTab("apresiasi"),
      },
      {
        id: "nav-aspirasi",
        title: "Kotak Aspirasi Mahasiswa",
        subtitle: "Dengar keluhan, saran konstruktif, dan suara mahasiswa SI",
        category: "Navigasi Modul",
        icon: <ChatCircleDots className="w-4 h-4 text-rose-500" />,
        tabKey: "aspirasi",
        keywords: ["aspirasi", "kritik", "saran", "pesan", "suara"],
        onExecute: () => onNavigateTab("aspirasi"),
      },
      {
        id: "nav-absensi",
        title: "Scan Presensi QR Kegiatan",
        subtitle: "Bilik pemindaian kamera QR code kehadiran pengurus & peserta",
        category: "Navigasi Modul",
        icon: <QrCode className="w-4 h-4 text-blue-500" />,
        tabKey: "absensi",
        keywords: ["absensi", "presensi", "scan", "qr", "kamera", "hadir"],
        onExecute: () => onNavigateTab("absensi"),
      },
      {
        id: "nav-rekap-absensi",
        title: "Rekap & Riwayat Presensi",
        subtitle: "Laporan statistik persentase kehadiran dan ekspor data",
        category: "Navigasi Modul",
        icon: <CalendarCheck className="w-4 h-4 text-teal-500" />,
        tabKey: "rekap-absensi",
        keywords: ["rekap", "riwayat", "laporan", "kehadiran", "ekspor"],
        onExecute: () => onNavigateTab("rekap-absensi"),
      },
      {
        id: "nav-kartu-qr",
        title: "Kartu QR Pengurus",
        subtitle: "ID digital resmi dan kode QR identitas per pengurus",
        category: "Navigasi Modul",
        icon: <QrCode className="w-4 h-4 text-purple-500" />,
        tabKey: "kartu-qr",
        keywords: ["kartu", "id", "badge", "pengurus", "qr"],
        onExecute: () => onNavigateTab("kartu-qr"),
      },
      {
        id: "nav-dokumen",
        title: "Dokumen Organisasi (AD/ART & SK)",
        subtitle: "Arsip berkas legal, peraturan organisasi, dan surat keputusan",
        category: "Navigasi Modul",
        icon: <FileText className="w-4 h-4 text-blue-600" />,
        tabKey: "dokumen",
        keywords: ["dokumen", "adart", "sk", "arsip", "legal", "peraturan", "pdf"],
        onExecute: () => onNavigateTab("dokumen"),
      },
      {
        id: "nav-persuratan",
        title: "Tata Kelola Persuratan",
        subtitle: "Pengarsipan nomor surat keluar dan template surat dinas",
        category: "Navigasi Modul",
        icon: <FileText className="w-4 h-4 text-indigo-600" />,
        tabKey: "persuratan",
        keywords: ["surat", "persuratan", "nomor", "sekretaris", "disposisi"],
        onExecute: () => onNavigateTab("persuratan"),
      },
      {
        id: "nav-content-planner",
        title: "Content Planner Medkominfo",
        subtitle: "Perencanaan jadwal konten feed Instagram, TikTok, dan rilis",
        category: "Navigasi Modul",
        icon: <Compass className="w-4 h-4 text-pink-500" />,
        tabKey: "content-planner",
        keywords: ["planner", "konten", "instagram", "tiktok", "medkominfo", "jadwal"],
        onExecute: () => onNavigateTab("content-planner"),
      },
      {
        id: "nav-shortlink",
        title: "Manajemen Shortlink (himasi.link)",
        subtitle: "Tautan pendek kustom dan analitik klik",
        category: "Navigasi Modul",
        icon: <LinkIcon className="w-4 h-4 text-emerald-600" />,
        tabKey: "shortlink",
        keywords: ["shortlink", "link", "url", "tautan", "redirect"],
        onExecute: () => onNavigateTab("shortlink"),
      },
      {
        id: "nav-banner",
        title: "Konfigurasi Hero Banner Beranda",
        subtitle: "Kustomisasi gambar banner utama web publik",
        category: "Navigasi Modul",
        icon: <GearSix className="w-4 h-4 text-orange-500" />,
        tabKey: "banner",
        keywords: ["banner", "hero", "beranda", "gambar", "kustomisasi"],
        onExecute: () => onNavigateTab("banner"),
      },
      {
        id: "nav-database",
        title: "Basis Data & Skema Supabase",
        subtitle: "Inspeksi tabel, status RLS, dan instruksi sinkronisasi DB",
        category: "Navigasi Modul",
        icon: <Database className="w-4 h-4 text-sky-600" />,
        tabKey: "database",
        keywords: ["database", "supabase", "sql", "skema", "tabel", "rls"],
        onExecute: () => onNavigateTab("database"),
      },
      {
        id: "nav-users",
        title: "Manajemen Pengguna & Hak Akses",
        subtitle: "Pengaturan akun pengurus, email, dan wewenang peran",
        category: "Navigasi Modul",
        icon: <Users className="w-4 h-4 text-amber-600" />,
        tabKey: "users",
        keywords: ["users", "pengguna", "akses", "role", "akun", "wewenang"],
        onExecute: () => onNavigateTab("users"),
      },
      {
        id: "nav-audit-log",
        title: "Audit Log & Rekam Aktivitas",
        subtitle: "Jejak audit keamanan dari setiap tindakan administratif",
        category: "Navigasi Modul",
        icon: <ShieldCheck className="w-4 h-4 text-rose-600" />,
        tabKey: "audit-log",
        keywords: ["audit", "log", "keamanan", "aktivitas", "riwayat", "jejak"],
        onExecute: () => onNavigateTab("audit-log"),
      },

      // TINDAKAN CEPAT
      {
        id: "act-toggle-theme",
        title: isDarkMode ? "Ganti ke Mode Terang (Light Mode)" : "Ganti ke Mode Gelap (Dark Mode)",
        subtitle: "Sesuaikan tema tampilan antarmuka dasbor",
        category: "Tindakan Cepat",
        icon: isDarkMode ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-[#00296E]" />,
        keywords: ["tema", "mode", "dark", "light", "gelap", "terang", "warna"],
        onExecute: () => {
          onToggleTheme();
          showToast?.(isDarkMode ? "Beralih ke Mode Terang." : "Beralih ke Mode Gelap.");
        },
      },
      {
        id: "act-refresh",
        title: "Segarkan Semua Data Realtime",
        subtitle: "Tarik ulang data absensi, aspirasi, berita, dan kegiatan",
        category: "Tindakan Cepat",
        icon: <ArrowsClockwise className="w-4 h-4 text-sky-400" />,
        keywords: ["refresh", "reload", "muat ulang", "segarkan", "sinkron"],
        onExecute: () => {
          onRefreshData?.();
          showToast?.("Memuat ulang data terbaru dari Supabase...");
        },
      },

      // TAUTAN PUBLIK
      {
        id: "link-public-home",
        title: "Buka Beranda Web Publik HIMASI",
        subtitle: "Tampilan beranda resmi yang dilihat oleh umum",
        category: "Tautan Publik",
        icon: <ArrowSquareOut className="w-4 h-4 text-slate-400" />,
        keywords: ["web", "publik", "beranda", "portal", "home"],
        onExecute: () => {
          if (typeof window !== "undefined") window.open("/", "_blank");
        },
      },
      {
        id: "link-public-berita",
        title: "Buka Halaman Warta & Berita Publik",
        subtitle: "Katalog berita dan artikel terbit di /berita",
        category: "Tautan Publik",
        icon: <ArrowSquareOut className="w-4 h-4 text-slate-400" />,
        keywords: ["warta", "berita publik", "katalog"],
        onExecute: () => {
          if (typeof window !== "undefined") window.open("/berita", "_blank");
        },
      },
      {
        id: "link-public-voting",
        title: "Buka Bilik Suara E-Voting Mahasiswa",
        subtitle: "Portal pemungutan suara resmi di /pemira",
        category: "Tautan Publik",
        icon: <ArrowSquareOut className="w-4 h-4 text-slate-400" />,
        keywords: ["pemira", "bilik suara", "e-voting publik"],
        onExecute: () => {
          if (typeof window !== "undefined") window.open("/pemira", "_blank");
        },
      },
      {
        id: "link-public-kalender",
        title: "Buka Kalender Publik Kegiatan",
        subtitle: "Agenda proker HIMASI di /kalender",
        category: "Tautan Publik",
        icon: <ArrowSquareOut className="w-4 h-4 text-slate-400" />,
        keywords: ["kalender publik", "agenda publik"],
        onExecute: () => {
          if (typeof window !== "undefined") window.open("/kalender", "_blank");
        },
      },
    ];

    // Filter berdasarkan hak akses role
    return actions.filter((act) => {
      if (act.tabKey) {
        return canAccessTab(currentUserRole, act.tabKey);
      }
      return true;
    });
  }, [currentUserRole, isDarkMode, onNavigateTab, onToggleTheme, onRefreshData, showToast]);

  // Filter tindakan sesuai input pencarian
  const filteredActions = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return allActions;
    return allActions.filter((act) => {
      const matchTitle = act.title.toLowerCase().includes(q);
      const matchSubtitle = act.subtitle?.toLowerCase().includes(q);
      const matchCategory = act.category.toLowerCase().includes(q);
      const matchKeyword = act.keywords?.some((k) => k.toLowerCase().includes(q));
      return matchTitle || matchSubtitle || matchCategory || matchKeyword;
    });
  }, [allActions, searchQuery]);

  // Reset index saat filter berubah
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredActions.length]);

  // Eksekusi pilihan
  const executeSelected = (action: CommandPaletteAction) => {
    action.onExecute();
    onClose();
  };

  // Navigasi Keyboard
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1 < filteredActions.length ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : filteredActions.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredActions[selectedIndex]) {
        executeSelected(filteredActions[selectedIndex]);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  // Scroll otomatis ke item terpilih
  useEffect(() => {
    if (listRef.current) {
      const selectedEl = listRef.current.querySelector(`[data-index="${selectedIndex}"]`);
      if (selectedEl) {
        selectedEl.scrollIntoView({ block: "nearest" });
      }
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <div
      className="no-print fixed inset-0 z-[120] flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white dark:bg-[#001438] border border-[#00296E]/20 dark:border-white/15 rounded-none shadow-2xl overflow-hidden flex flex-col text-slate-900 dark:text-white animate-in zoom-in-95 duration-150 select-none"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Header Bar */}
        <div className="relative flex items-center px-4 py-3 border-b border-[#00296E]/15 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02]">
          <MagnifyingGlass className="w-5 h-5 text-slate-400 shrink-0 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Ketik nama modul, perintah, atau aksi cepat... (e.g. berita, voting, tema)"
            className="w-full bg-transparent text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer mr-2"
              title="Bersihkan input"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-white dark:bg-[#001740] border border-slate-200 dark:border-white/10 rounded-none shrink-0">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div
          ref={listRef}
          className="max-h-[360px] overflow-y-auto divide-y divide-slate-100 dark:divide-white/5 py-1"
        >
          {filteredActions.length === 0 ? (
            <div className="py-12 px-4 text-center">
              <Compass className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                Tidak ada modul atau perintah yang cocok dengan &ldquo;{searchQuery}&rdquo;
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Coba kata kunci lain seperti: berita, kalender, dpt, tema, atau web publik.
              </p>
            </div>
          ) : (
            filteredActions.map((action, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={action.id}
                  data-index={idx}
                  onClick={() => executeSelected(action)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`px-4 py-2.5 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-[#00296E]/10 dark:bg-white/10 border-l-4 border-[#00296E] dark:border-[#38BDF8]"
                      : "border-l-4 border-transparent hover:bg-slate-50 dark:hover:bg-white/[0.02]"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-none flex items-center justify-center shrink-0 border ${
                        isSelected
                          ? "bg-white dark:bg-[#001740] border-[#00296E]/20 dark:border-white/20"
                          : "bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10"
                      }`}
                    >
                      {action.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {action.title}
                        </span>
                        <span className="px-1.5 py-0.2 rounded-none text-[9px] font-mono uppercase tracking-wider text-slate-400 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 shrink-0">
                          {action.category}
                        </span>
                      </div>
                      {action.subtitle && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          {action.subtitle}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {isSelected && (
                      <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono text-[#00296E] dark:text-[#38BDF8] font-bold">
                        <span>Pilih</span>
                        <ArrowRight className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Keyboard Navigation Shortcuts Hint */}
        <div className="px-4 py-2 border-t border-[#00296E]/15 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] flex items-center justify-between text-[11px] font-mono text-slate-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1 bg-white dark:bg-[#001740] border border-slate-200 dark:border-white/10">↑</kbd>
              <kbd className="px-1 bg-white dark:bg-[#001740] border border-slate-200 dark:border-white/10">↓</kbd>
              <span className="hidden sm:inline">Navigasi</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 bg-white dark:bg-[#001740] border border-slate-200 dark:border-white/10">↵</kbd>
              <span className="hidden sm:inline">Buka Modul</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 bg-white dark:bg-[#001740] border border-slate-200 dark:border-white/10">ESC</kbd>
              <span className="hidden sm:inline">Tutup</span>
            </span>
          </div>

          <span className="text-[10px] uppercase tracking-wider text-slate-400">
            HIMASI Swiss Command
          </span>
        </div>
      </div>
    </div>
  );
}
