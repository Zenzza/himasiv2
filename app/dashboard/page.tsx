"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  SquaresFour,
  ChatTeardropText,
  Newspaper,
  CalendarBlank,
  Users,
  Database,
  SignOut,
  Sparkle,
  MagnifyingGlass,
  Funnel,
  CheckCircle,
  Clock,
  WarningCircle,
  ArrowSquareOut,
  ArrowsClockwise,
  Trash,
  CaretLeft,
  CaretRight,
  TrendUp,
  FileCode,
  Copy,
  Check,
  List,
  X,
  XCircle,
  Plus,
  ShieldWarning,
  ShieldCheck,
  User,
  ArrowUpRight,
  QrCode,
  Scan,
  IdentificationCard,
  UserCheck,
  DownloadSimple,
  Printer,
  CaretDown,
  FileXls,
  FileText,
  Eye,
  Table as TableIcon,
  NotePencil,
  UserPlus,
  Image as ImageIcon,
  UploadSimple,
  Camera,
  FolderSimple,
  FolderOpen,
  Desktop,
  DeviceMobile,
  MapPin,
  TShirt,
  Trophy,
  Medal,
  Lock,
  LockOpen,
  Sun,
  Moon,
  MegaphoneSimple,
} from "@phosphor-icons/react";
import {
  DEFAULT_HERO_BANNER,
  getHeroBannerConfig,
  saveHeroBannerConfig,
  resetHeroBannerConfig,
  type HeroBannerConfig,
} from "@/lib/constants/banner";
import {
  type FiturUtamaSectionConfig,
  type FiturItemConfig,
  DEFAULT_FITUR_UTAMA,
  getFiturUtamaConfig,
  saveFiturUtamaConfig,
  resetFiturUtamaConfig,
  fetchFiturUtamaFromSupabase,
  FITUR_UTAMA_UPDATE_EVENT,
} from "@/lib/constants/fitur-utama";
import { supabase } from "@/lib/supabase/client";
import {
  DAFTAR_PENGURUS_HIMASI,
  DAFTAR_DIVISI,
  generateQrToken,
  sortPengurusMembers,
  type PengurusMember,
} from "@/lib/data/pengurus";
import AdminQrScanner, { type AbsensiRecord } from "@/components/absensi/admin-qr-scanner";
import PengurusQrCard from "@/components/absensi/pengurus-qr-card";
import AspirasiManager from "@/components/dashboard/aspirasi-manager";
import ApresiasiManager from "@/components/dashboard/apresiasi-manager";
import UserManager from "@/components/dashboard/user-manager";
import PersuratanManager from "@/components/dashboard/persuratan-manager";
import ContentPlannerManager from "@/components/dashboard/content-planner-manager";
import AuditLogManager from "@/components/dashboard/audit-log-manager";
import ShortlinkManager from "@/components/dashboard/shortlink-manager";
import PopupManager from "@/components/dashboard/popup-manager";
import DokumenManager from "@/components/dashboard/dokumen-manager";
import OverviewManager from "@/components/dashboard/overview-manager";
import DashboardPageHeader from "@/components/dashboard/ui/dashboard-page-header";
import DashboardMetricStrip from "@/components/dashboard/ui/dashboard-metric-strip";
import { getAuditLogs, recordAuditLog } from "@/lib/supabase/audit-log";
import type { AuditLogItem } from "@/lib/types/audit-log";
import {
  type UserRole,
  type ContentStatus,
  type DashboardTabKey,
  canAccessTab,
  canPublishContent,
  canEditPublishedContent,
  ROLE_LABELS,
  ROLE_BADGE_STYLES,
} from "@/lib/types/auth";
import { getCurrentUserProfile } from "@/lib/supabase/users";
import RekapAbsensiView, {
  type KegiatanItem,
  formatTanggalIndo,
} from "@/components/absensi/rekap-absensi-view";
import {
  type BeritaItem,
  KATEGORI_BERITA,
} from "@/lib/types/berita";
import {
  getAllBeritaAdmin,
  createBerita,
  updateBerita,
  deleteBerita,
  togglePublishedBerita,
  updateBeritaStatus,
} from "@/lib/supabase/berita";
import { slugify, estimateReadTime } from "@/lib/utils/slug";
import {
  type DokumenOrganisasi,
  DEFAULT_DOKUMEN_ORGANISASI,
} from "@/lib/types/dokumen";
import {
  getDokumenOrganisasi,
  uploadDokumenPdf,
  createDokumen,
  updateDokumen,
  deleteDokumen,
} from "@/lib/supabase/dokumen";
import {
  type AgendaKalender,
  type EventCategory,
  DEFAULT_AGENDA_EVENTS,
  isDateInEventRange,
  getCategoryMeta,
} from "@/lib/types/kalender";
import {
  getAgendaKalender,
  createAgenda,
  updateAgenda,
  deleteAgenda,
  updateAgendaStatus,
} from "@/lib/supabase/kalender";

// Tipe Data Aspirasi Supabase
interface AspirasiItem {
  id: string;
  email: string;
  angkatan: string;
  pesan: string;
  status: "baru" | "diproses" | "selesai" | string;
  catatan_pengurus?: string | null;
  created_at: string;
}

// Data Dummy Cadangan Jika Tabel Belum Dibuat di Supabase
const fallbackAspirasi: AspirasiItem[] = [
  {
    id: "demo-1",
    email: "mahasiswa.2024@atmaluhur.ac.id",
    angkatan: "2024",
    pesan: "Mohon penambahan stopkontak dan perbaikan AC di laboratorium komputer lantai 2 gedung utama agar praktikum pemrograman lebih nyaman.",
    status: "baru",
    created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
  },
  {
    id: "demo-2",
    email: "si.alumni@atmaluhur.ac.id",
    angkatan: "2022",
    pesan: "Apakah bisa diadakan webinar sharing alumni mengenai persiapan karir Product Management dan UI/UX Designer di industri?",
    status: "diproses",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
  },
  {
    id: "demo-3",
    email: "teguh.2023@atmaluhur.ac.id",
    angkatan: "2023",
    pesan: "Jadwal tentir UTS untuk mata kuliah Basis Data Lanjut apakah bisa diumumkan H-7 sebelum ujian?",
    status: "selesai",
    catatan_pengurus: "Sudah dikoordinasikan dengan Divisi Litbang untuk tentir online via Zoom.",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 28).toISOString(),
  },
];

export default function DashboardPage() {
  const router = useRouter();

  // Tab State
  const [activeTab, setActiveTab] = useState<DashboardTabKey>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>("humas_biskraf");

  // Swiss Minimalist Dual-Theme State (Light / Dark)
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem("himasi-admin-theme") as "light" | "dark" | null;
      let initialTheme: "light" | "dark" = "light";
      if (savedTheme === "dark" || savedTheme === "light") {
        initialTheme = savedTheme;
      } else if (typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
        initialTheme = "dark";
      }

      setTheme(initialTheme);
      if (initialTheme === "dark") {
        document.documentElement.classList.add("dark");
        document.body.classList.add("dark");
        document.documentElement.setAttribute("data-theme", "dark");
      } else {
        document.documentElement.classList.remove("dark");
        document.body.classList.remove("dark");
        document.documentElement.removeAttribute("data-theme");
      }
    } catch {
      // Fallback safe for SSR
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    try {
      localStorage.setItem("himasi-admin-theme", nextTheme);
      if (nextTheme === "dark") {
        document.documentElement.classList.add("dark");
        document.body.classList.add("dark");
        document.documentElement.setAttribute("data-theme", "dark");
      } else {
        document.documentElement.classList.remove("dark");
        document.body.classList.remove("dark");
        document.documentElement.removeAttribute("data-theme");
      }
    } catch {
      // Safe fallback
    }
  };

  // Hero Banner State (Pengaturan Background Mobile & Desktop)
  const [bannerConfig, setBannerConfig] = useState<HeroBannerConfig>(DEFAULT_HERO_BANNER);
  const [formDesktopImage, setFormDesktopImage] = useState(DEFAULT_HERO_BANNER.desktopImage);
  const [formMobileImage, setFormMobileImage] = useState(DEFAULT_HERO_BANNER.mobileImage);
  const [formDesktopPos, setFormDesktopPos] = useState(DEFAULT_HERO_BANNER.desktopPosition || "object-[center_65%]");
  const [formMobilePos, setFormMobilePos] = useState(DEFAULT_HERO_BANNER.mobilePosition || "object-center");
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile" | "split">("split");

  const supabaseProjectId = useMemo(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    return url ? url.replace(/^https?:\/\//, "").split(".")[0] : "supabase-project";
  }, []);

  useEffect(() => {
    const loaded = getHeroBannerConfig();
    setBannerConfig(loaded);
    setFormDesktopImage(loaded.desktopImage);
    setFormMobileImage(loaded.mobileImage);
    setFormDesktopPos(loaded.desktopPosition || "object-[center_65%]");
    setFormMobilePos(loaded.mobilePosition || "object-center");
  }, []);

  // Sub-tab Home Page di Dashboard: "banner" | "fitur" | "popup"
  const [homeSubTab, setHomeSubTab] = useState<"banner" | "fitur" | "popup">("banner");

  const mainContentRef = useRef<HTMLElement | null>(null);

  const forceScrollTop = useCallback(() => {
    // 1. Reset container scroll utama (<main>)
    if (mainContentRef.current) {
      mainContentRef.current.scrollTop = 0;
      try {
        mainContentRef.current.scrollTo({ top: 0, left: 0, behavior: "instant" });
      } catch {
        // Fallback
      }
    }

    // 2. Fallback querySelector & document roots
    if (typeof document !== "undefined") {
      const mainEl = document.querySelector("main");
      if (mainEl) {
        mainEl.scrollTop = 0;
      }
      if (document.documentElement) {
        document.documentElement.scrollTop = 0;
      }
      if (document.body) {
        document.body.scrollTop = 0;
      }
    }

    // 3. Reset window scroll
    if (typeof window !== "undefined") {
      try {
        window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      } catch {
        window.scrollTo(0, 0);
      }
    }
  }, []);

  // Handler pergantian tab yang secara proaktif langsung me-reset posisi scroll
  const handleTabChange = useCallback((tab: DashboardTabKey) => {
    setActiveTab(tab);
    setSidebarOpen(false);
    forceScrollTop();
    requestAnimationFrame(forceScrollTop);
    setTimeout(forceScrollTop, 50);
    setTimeout(forceScrollTop, 150);
  }, [forceScrollTop]);

  // Auto-scroll ke posisi paling atas setiap perpindahan tab / sub-halaman admin
  useEffect(() => {
    forceScrollTop();
    const rafId = requestAnimationFrame(forceScrollTop);
    const rafId2 = requestAnimationFrame(() => requestAnimationFrame(forceScrollTop));
    const timer1 = setTimeout(forceScrollTop, 50);
    const timer2 = setTimeout(forceScrollTop, 150);

    return () => {
      cancelAnimationFrame(rafId);
      cancelAnimationFrame(rafId2);
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [activeTab, homeSubTab, forceScrollTop]);

  // State Pengaturan Fitur Utama Beranda (Open / Closed Toggle)
  const [fiturConfig, setFiturConfig] = useState<FiturUtamaSectionConfig>(DEFAULT_FITUR_UTAMA);
  const [savingFitur, setSavingFitur] = useState(false);

  useEffect(() => {
    const loadedFitur = getFiturUtamaConfig();
    setFiturConfig(loadedFitur);

    fetchFiturUtamaFromSupabase().then((data) => {
      if (data) setFiturConfig(data);
    });

    const handleFiturUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<FiturUtamaSectionConfig>;
      if (customEvent.detail) {
        setFiturConfig(customEvent.detail);
      }
    };

    window.addEventListener(FITUR_UTAMA_UPDATE_EVENT, handleFiturUpdate);
    return () => window.removeEventListener(FITUR_UTAMA_UPDATE_EVENT, handleFiturUpdate);
  }, []);

  // Folder Menu State: Absensi (otomatis terbuka jika submenu aktif)
  const [isAbsensiFolderOpen, setIsAbsensiFolderOpen] = useState(true);
  const isAbsensiActive =
    activeTab === "absensi" ||
    activeTab === "rekap-absensi" ||
    activeTab === "kartu-qr";

  useEffect(() => {
    if (isAbsensiActive) {
      setIsAbsensiFolderOpen(true);
    }
  }, [isAbsensiActive]);

  // Auth User State
  const [user, setUser] = useState<{ email?: string; id?: string; full_name?: string } | null>(
    null
  );
  const [authLoading, setAuthLoading] = useState(true);
  const [currentUserName, setCurrentUserName] = useState<string>("Pengurus HIMASI");

  // Aspirasi State
  const [aspirasiList, setAspirasiList] = useState<AspirasiItem[]>([]);
  const [loadingAspirasi, setLoadingAspirasi] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("semua");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAspirasi, setSelectedAspirasi] = useState<AspirasiItem | null>(null);
  const [isUsingFallback, setIsUsingFallback] = useState(false);

  // Absensi State (Data Kegiatan Dinamis diinput manual oleh Admin & tersimpan di DB)
  const [kegiatanList, setKegiatanList] = useState<KegiatanItem[]>([]);
  const [activeKegiatan, setActiveKegiatan] = useState<KegiatanItem | null>(null);
  const [loadingKegiatan, setLoadingKegiatan] = useState(true);
  const [isTambahKegiatanModalOpen, setIsTambahKegiatanModalOpen] = useState(false);
  const [formNamaKegiatan, setFormNamaKegiatan] = useState("");
  const [formTanggalKegiatan, setFormTanggalKegiatan] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [formJamKegiatan, setFormJamKegiatan] = useState("09:00 WIB");
  const [absensiLogs, setAbsensiLogs] = useState<AbsensiRecord[]>([]);

  // Modal Konfirmasi Hapus Kegiatan
  const [kegiatanToDelete, setKegiatanToDelete] = useState<KegiatanItem | null>(null);
  const [deletingKegiatan, setDeletingKegiatan] = useState(false);
  const [searchKegiatanOverview, setSearchKegiatanOverview] = useState("");

  // Filter Kegiatan untuk Overview Dashboard
  const filteredKegiatanOverview = useMemo(() => {
    if (!searchKegiatanOverview.trim()) return kegiatanList;
    const q = searchKegiatanOverview.toLowerCase();
    return kegiatanList.filter(
      (k) =>
        k.nama.toLowerCase().includes(q) ||
        k.tanggal.includes(q) ||
        k.jam.toLowerCase().includes(q)
    );
  }, [kegiatanList, searchKegiatanOverview]);

  // Audit Log Overview State (Limit 4)
  const [overviewAuditLogs, setOverviewAuditLogs] = useState<AuditLogItem[]>([]);
  const [loadingOverviewAuditLogs, setLoadingOverviewAuditLogs] = useState(false);

  // Modal Konfirmasi Hapus Aspirasi & Feedback Toast
  const [aspirasiToDelete, setAspirasiToDelete] = useState<AspirasiItem | null>(null);
  const [deletingAspirasi, setDeletingAspirasi] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage((cur) => (cur === message ? null : cur));
    }, 3500);
  };

  // Berita State (CRUD Admin)
  const [beritaList, setBeritaList] = useState<BeritaItem[]>([]);
  const [loadingBerita, setLoadingBerita] = useState(true);
  const [searchBerita, setSearchBerita] = useState("");
  const [kategoriFilterBerita, setKategoriFilterBerita] = useState("semua");
  const [statusFilterBerita, setStatusFilterBerita] = useState("semua");

  // Modal CRUD Berita
  const [isBeritaModalOpen, setIsBeritaModalOpen] = useState(false);
  const [editingBerita, setEditingBerita] = useState<BeritaItem | null>(null);
  const [beritaToDelete, setBeritaToDelete] = useState<BeritaItem | null>(null);
  const [deletingBerita, setDeletingBerita] = useState(false);
  const [savingBerita, setSavingBerita] = useState(false);
  const [rejectingBeritaItem, setRejectingBeritaItem] = useState<BeritaItem | null>(null);
  const [catatanRevisiBerita, setCatatanRevisiBerita] = useState("");

  // Form Berita
  const [formBeritaTitle, setFormBeritaTitle] = useState("");
  const [formBeritaSlug, setFormBeritaSlug] = useState("");
  const [formBeritaCategoryKey, setFormBeritaCategoryKey] = useState("event");
  const [formBeritaCategoryLabel, setFormBeritaCategoryLabel] = useState("Kegiatan Himpunan");
  const [formBeritaAuthor, setFormBeritaAuthor] = useState("HIMASI Media");
  const [formBeritaReadTime, setFormBeritaReadTime] = useState("5 min read");
  const [formBeritaImage, setFormBeritaImage] = useState("");
  const [formBeritaExcerpt, setFormBeritaExcerpt] = useState("");
  const [formBeritaContent, setFormBeritaContent] = useState("");
  const [formBeritaIsPublished, setFormBeritaIsPublished] = useState(true);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [uploadingBeritaImage, setUploadingBeritaImage] = useState(false);
  const [isDraggingOverBerita, setIsDraggingOverBerita] = useState(false);
  const beritaFileInputRef = useRef<HTMLInputElement | null>(null);

  const fetchBerita = useCallback(async () => {
    setLoadingBerita(true);
    try {
      const data = await getAllBeritaAdmin();
      setBeritaList(data);
    } catch (err) {
      console.error("Fetch berita error:", err);
    } finally {
      setLoadingBerita(false);
    }
  }, []);

  useEffect(() => {
    fetchBerita();
  }, [fetchBerita]);

  const handleOpenTambahBerita = () => {
    setEditingBerita(null);
    setFormBeritaTitle("");
    setFormBeritaSlug("");
    setFormBeritaCategoryKey("event");
    setFormBeritaCategoryLabel("Kegiatan Himpunan");
    setFormBeritaAuthor("HIMASI Media");
    setFormBeritaReadTime("5 min read");
    setFormBeritaImage("");
    setFormBeritaExcerpt("");
    setFormBeritaContent("");
    setFormBeritaIsPublished(true);
    setSlugManuallyEdited(false);
    setIsBeritaModalOpen(true);
  };

  const handleOpenEditBerita = (item: BeritaItem) => {
    setEditingBerita(item);
    setFormBeritaTitle(item.title);
    setFormBeritaSlug(item.slug);
    setFormBeritaCategoryKey(item.category_key);
    setFormBeritaCategoryLabel(item.category_label);
    setFormBeritaAuthor(item.author);
    setFormBeritaReadTime(item.read_time);
    setFormBeritaImage(item.image_url);
    setFormBeritaExcerpt(item.excerpt);
    setFormBeritaContent(item.content);
    setFormBeritaIsPublished(item.is_published);
    setSlugManuallyEdited(true);
    setIsBeritaModalOpen(true);
  };

  const handleTitleChange = (val: string) => {
    setFormBeritaTitle(val);
    if (!slugManuallyEdited) {
      setFormBeritaSlug(slugify(val));
    }
  };

  const handleContentChange = (val: string) => {
    setFormBeritaContent(val);
    setFormBeritaReadTime(estimateReadTime(val));
    if (!formBeritaExcerpt.trim() && val.trim()) {
      const firstSentence = val.trim().split(/\n+/)[0].slice(0, 160);
      setFormBeritaExcerpt(firstSentence);
    }
  };

  // Helper Kompresi & Upload Foto Sampul Berita
  const processAndUploadBeritaPhoto = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      showToast("File yang dipilih harus berupa gambar (JPG, PNG, atau WebP)");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      showToast("Ukuran berkas terlalu besar (Maksimal 10MB)");
      return;
    }

    setUploadingBeritaImage(true);
    try {
      // Kompresi gambar via HTML Canvas (max 1200x800 px, kualitas 85%)
      const { optimizedBlob, base64Url } = await new Promise<{
        optimizedBlob: Blob;
        base64Url: string;
      }>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = document.createElement("img");
          img.onload = () => {
            const maxW = 1200;
            const maxH = 800;
            let width = img.width;
            let height = img.height;

            if (width > maxW) {
              height = Math.round((height * maxW) / width);
              width = maxW;
            }
            if (height > maxH) {
              width = Math.round((width * maxH) / height);
              height = maxH;
            }

            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            if (!ctx) {
              resolve({
                optimizedBlob: file,
                base64Url: e.target?.result as string,
              });
              return;
            }

            ctx.drawImage(img, 0, 0, width, height);
            const b64 = canvas.toDataURL("image/jpeg", 0.85);
            canvas.toBlob(
              (blob) => {
                resolve({
                  optimizedBlob: blob || file,
                  base64Url: b64,
                });
              },
              "image/jpeg",
              0.85
            );
          };
          img.onerror = reject;
          img.src = e.target?.result as string;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Tampilkan preview instan
      setFormBeritaImage(base64Url);

      // Coba unggah ke Supabase Storage (bucket: 'foto-berita' atau 'foto-pengurus')
      const cleanSlug = slugify(formBeritaTitle) || "berita";
      const filePath = `cover_${cleanSlug}_${Date.now()}.jpg`;

      let uploadedUrl = "";
      try {
        const { data, error } = await supabase.storage
          .from("foto-berita")
          .upload(filePath, optimizedBlob, {
            contentType: "image/jpeg",
            cacheControl: "3600",
            upsert: true,
          });

        if (!error && data) {
          const { data: pubData } = supabase.storage
            .from("foto-berita")
            .getPublicUrl(filePath);
          uploadedUrl = pubData?.publicUrl || "";
        } else {
          // Coba fallback ke bucket 'foto-pengurus' yang sudah aktif
          const { data: pData, error: pError } = await supabase.storage
            .from("foto-pengurus")
            .upload(`berita_${filePath}`, optimizedBlob, {
              contentType: "image/jpeg",
              cacheControl: "3600",
              upsert: true,
            });
          if (!pError && pData) {
            const { data: pubData } = supabase.storage
              .from("foto-pengurus")
              .getPublicUrl(`berita_${filePath}`);
            uploadedUrl = pubData?.publicUrl || "";
          }
        }
      } catch (storageErr) {
        console.warn("Catatan upload storage berita:", storageErr);
      }

      if (uploadedUrl) {
        setFormBeritaImage(uploadedUrl);
        showToast("Foto sampul berhasil diunggah ke Supabase Storage!");
      } else {
        showToast("Foto berhasil dimuat & siap disimpan!");
      }
    } catch (err) {
      console.error("Gagal memproses upload foto berita:", err);
      showToast("Gagal memproses file foto.");
    } finally {
      setUploadingBeritaImage(false);
      setIsDraggingOverBerita(false);
    }
  };

  const handleSaveBerita = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formBeritaTitle.trim()) {
      showToast("Judul berita wajib diisi.");
      return;
    }

    setSavingBerita(true);
    try {
      const isApprover = canPublishContent(currentUserRole);
      const targetStatus: ContentStatus = isApprover
        ? formBeritaIsPublished ? "published" : "draft"
        : "pending_review";

      const payload = {
        title: formBeritaTitle.trim(),
        slug: formBeritaSlug.trim() || slugify(formBeritaTitle),
        category_key: formBeritaCategoryKey,
        category_label: formBeritaCategoryLabel,
        author: formBeritaAuthor.trim() || "HIMASI Media",
        read_time: formBeritaReadTime || "5 min read",
        image_url: formBeritaImage.trim() || "https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=800&auto=format&fit=crop",
        excerpt: formBeritaExcerpt.trim() || formBeritaTitle.trim(),
        content: formBeritaContent.trim() || formBeritaExcerpt.trim(),
        is_published: isApprover ? formBeritaIsPublished : false,
        status: targetStatus,
        catatan_revisi: isApprover ? undefined : editingBerita?.catatan_revisi,
        published_at: editingBerita?.published_at || new Date().toISOString(),
      };

      if (editingBerita) {
        await updateBerita(editingBerita.id, payload);
        recordAuditLog({
          modul: "berita",
          aksi: `Memperbarui artikel Berita/berita: "${payload.title}"`,
          pengurus_nama: currentUserName,
          pengurus_role: currentUserRole,
          status: "berhasil",
          detail: `Kategori: ${payload.category_label}, Status: ${payload.status}`,
        }).catch((err) => console.warn("[dashboard] Gagal mencatat audit log update berita:", err));
        showToast(
          isApprover
            ? "Berhasil memperbarui artikel berita!"
            : "Berita diperbarui dan diajukan ulang untuk ditinjau Medkominfo."
        );
      } else {
        await createBerita(payload);
        recordAuditLog({
          modul: "berita",
          aksi: `Membuat Berita/berita baru: "${payload.title}"`,
          pengurus_nama: currentUserName,
          pengurus_role: currentUserRole,
          status: "berhasil",
          detail: `Kategori: ${payload.category_label}, Status: ${payload.status}`,
        }).catch((err) => console.warn("[dashboard] Gagal mencatat audit log create berita:", err));
        showToast(
          isApprover
            ? "Berhasil menerbitkan artikel berita baru!"
            : "Berita berhasil disimpan & dikirim ke antrean review Medkominfo."
        );
      }

      setIsBeritaModalOpen(false);
      await fetchBerita();
    } catch (err: any) {
      console.error("Save berita error:", err);
      showToast("Gagal menyimpan berita: " + (err.message || "Terjadi kesalahan"));
    } finally {
      setSavingBerita(false);
    }
  };

  const handleApproveBerita = async (item: BeritaItem) => {
    try {
      await updateBeritaStatus(item.id, "published");
      setBeritaList((prev) =>
        prev.map((b) =>
          String(b.id) === String(item.id)
            ? { ...b, status: "published", is_published: true, catatan_revisi: undefined }
            : b
        )
      );
      recordAuditLog({
        modul: "berita",
        aksi: `Menyetujui & menerbitkan artikel Berita: "${item.title}"`,
        pengurus_nama: currentUserName,
        pengurus_role: currentUserRole,
        status: "berhasil",
      }).catch((err) => console.warn("[dashboard] Gagal mencatat audit log approve berita:", err));
      showToast(`Berita "${item.title}" disetujui & langsung diterbitkan!`);
    } catch (err: any) {
      console.error("Approve berita error:", err);
      showToast("Gagal menyetujui Berita: " + (err.message || "Terjadi kesalahan"));
    }
  };

  const handleConfirmRejectBerita = async () => {
    if (!rejectingBeritaItem) return;
    try {
      await updateBeritaStatus(rejectingBeritaItem.id, "rejected", catatanRevisiBerita.trim());
      setBeritaList((prev) =>
        prev.map((b) =>
          String(b.id) === String(rejectingBeritaItem.id)
            ? { ...b, status: "rejected", is_published: false, catatan_revisi: catatanRevisiBerita.trim() }
            : b
        )
      );
      recordAuditLog({
        modul: "berita",
        aksi: `Mengembalikan Berita dengan catatan revisi: "${rejectingBeritaItem.title}"`,
        pengurus_nama: currentUserName,
        pengurus_role: currentUserRole,
        status: "peringatan",
        detail: `Catatan: ${catatanRevisiBerita.trim() || "-"}`,
      }).catch((err) => console.warn("[dashboard] Gagal mencatat audit log reject berita:", err));
      showToast("Berita dikembalikan dengan catatan revisi untuk kontributor.");
      setRejectingBeritaItem(null);
      setCatatanRevisiBerita("");
    } catch (err: any) {
      console.error("Reject berita error:", err);
      showToast("Gagal menolak Berita.");
    }
  };

  const handleQuickToggleBeritaStatus = async (item: BeritaItem) => {
    if (!canPublishContent(currentUserRole)) {
      showToast("Wewenang terbatas: Hanya Medkominfo atau Super Admin yang dapat mengubah status publikasi.");
      return;
    }
    try {
      const newStatus = await togglePublishedBerita(item.id, item.is_published);
      setBeritaList((prev) =>
        prev.map((b) => (String(b.id) === String(item.id) ? { ...b, is_published: newStatus, status: newStatus ? "published" : "draft" } : b))
      );
      recordAuditLog({
        modul: "berita",
        aksi: `Mengubah status publikasi berita "${item.title}" ke ${newStatus ? "Terbit" : "Draft"}`,
        pengurus_nama: currentUserName,
        pengurus_role: currentUserRole,
        status: "berhasil",
      }).catch((err) => console.warn("[dashboard] Gagal mencatat audit log toggle berita:", err));
      showToast(newStatus ? "Status diubah ke Terbit." : "Status diubah ke Draft.");
    } catch (err) {
      console.error("Toggle status error:", err);
      showToast("Gagal mengubah status publikasi.");
    }
  };

  const handleConfirmDeleteBerita = async () => {
    if (!beritaToDelete) return;
    if ((beritaToDelete.is_published || beritaToDelete.status === "published") && !canEditPublishedContent(currentUserRole)) {
      showToast("Wewenang terbatas: Berita yang sudah terbit hanya dapat dihapus oleh Medkominfo / Super Admin.");
      setBeritaToDelete(null);
      return;
    }
    setDeletingBerita(true);
    const targetTitle = beritaToDelete.title;
    const targetId = beritaToDelete.id;
    try {
      await deleteBerita(targetId);
      setBeritaList((prev) => prev.filter((b) => String(b.id) !== String(targetId)));
      recordAuditLog({
        modul: "berita",
        aksi: `Menghapus artikel Berita/berita: "${targetTitle}"`,
        pengurus_nama: currentUserName,
        pengurus_role: currentUserRole,
        status: "berhasil",
        detail: `ID: ${targetId}`,
      }).catch((err) => console.warn("[dashboard] Gagal mencatat audit log delete berita:", err));
      showToast(`Artikel "${targetTitle}" berhasil dihapus.`);
      setBeritaToDelete(null);
    } catch (err) {
      console.error("Delete berita error:", err);
      showToast("Gagal menghapus artikel berita.");
    } finally {
      setDeletingBerita(false);
    }
  };

  const filteredBeritaList = useMemo(() => {
    return beritaList.filter((b) => {
      const matchCategory =
        kategoriFilterBerita === "semua" || b.category_key === kategoriFilterBerita;
      const matchStatus =
        statusFilterBerita === "semua" ||
        (statusFilterBerita === "terbit" && b.is_published) ||
        (statusFilterBerita === "draft" && !b.is_published);
      const matchSearch =
        !searchBerita.trim() ||
        b.title.toLowerCase().includes(searchBerita.toLowerCase()) ||
        b.author.toLowerCase().includes(searchBerita.toLowerCase()) ||
        b.excerpt.toLowerCase().includes(searchBerita.toLowerCase());
      return matchCategory && matchStatus && matchSearch;
    });
  }, [beritaList, kategoriFilterBerita, statusFilterBerita, searchBerita]);

  const handleSaveBanner = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const updated = saveHeroBannerConfig({
      desktopImage: formDesktopImage.trim() || DEFAULT_HERO_BANNER.desktopImage,
      mobileImage: formMobileImage.trim() || DEFAULT_HERO_BANNER.mobileImage,
      desktopPosition: formDesktopPos,
      mobilePosition: formMobilePos,
    });
    setBannerConfig(updated);
    recordAuditLog({
      modul: "banner",
      aksi: "Menyimpan konfigurasi Hero Banner beranda",
      pengurus_nama: currentUserName,
      pengurus_role: currentUserRole,
      status: "berhasil",
    }).catch((err) => console.warn("[dashboard] Gagal mencatat audit log save banner:", err));
    showToast("Berhasil menyimpan konfigurasi Hero Banner Desktop & Mobile!");
  };

  const handleResetBanner = () => {
    const def = resetHeroBannerConfig();
    setBannerConfig(def);
    setFormDesktopImage(def.desktopImage);
    setFormMobileImage(def.mobileImage);
    setFormDesktopPos(def.desktopPosition || "object-[center_65%]");
    setFormMobilePos(def.mobilePosition || "object-center");
    recordAuditLog({
      modul: "banner",
      aksi: "Mereset konfigurasi Hero Banner ke bawaan",
      pengurus_nama: currentUserName,
      pengurus_role: currentUserRole,
      status: "peringatan",
    }).catch((err) => console.warn("[dashboard] Gagal mencatat audit log reset banner:", err));
    showToast("Hero Banner berhasil di-reset ke konfigurasi bawaan.");
  };

  // Handlers untuk Pengaturan Fitur Utama (Open / Closed Toggle)
  const handleToggleFiturItem = (id: string) => {
    setFiturConfig((prev) => {
      const updatedItems = prev.items.map((item) => {
        if (item.id === id) {
          return {
            ...item,
            isOpen: !item.isOpen,
          };
        }
        return item;
      });
      const nextConfig = { ...prev, items: updatedItems };
      saveFiturUtamaConfig(nextConfig);
      return nextConfig;
    });
    showToast("Status fitur berhasil diperbarui & disinkronkan ke beranda!");
  };

  const handleUpdateFiturItemField = (id: string, field: keyof FiturItemConfig, value: any) => {
    setFiturConfig((prev) => {
      const updatedItems = prev.items.map((item) => {
        if (item.id === id) {
          return {
            ...item,
            [field]: value,
          };
        }
        return item;
      });
      return { ...prev, items: updatedItems };
    });
  };

  const handleSaveAllFitur = async () => {
    setSavingFitur(true);
    saveFiturUtamaConfig(fiturConfig);
    recordAuditLog({
      modul: "banner",
      aksi: "Menyimpan & menyinkronkan seluruh pengaturan Fitur Utama beranda",
      pengurus_nama: currentUserName,
      pengurus_role: currentUserRole,
      status: "berhasil",
    }).catch((err) => console.warn("[dashboard] Gagal mencatat audit log save fitur:", err));
    showToast("Pengaturan Fitur Utama berhasil disimpan & tersinkronisasi!");
    setSavingFitur(false);
  };

  const handleResetFitur = () => {
    const def = resetFiturUtamaConfig();
    setFiturConfig(def);
    recordAuditLog({
      modul: "banner",
      aksi: "Mereset pengaturan Fitur Utama ke pengaturan bawaan",
      pengurus_nama: currentUserName,
      pengurus_role: currentUserRole,
      status: "peringatan",
    }).catch((err) => console.warn("[dashboard] Gagal mencatat audit log reset fitur:", err));
    showToast("Fitur Utama berhasil di-reset ke pengaturan bawaan.");
  };

  // Kartu QR Modal / Detail State
  const [selectedPengurusCard, setSelectedPengurusCard] = useState<PengurusMember | null>(null);
  const [divisiFilterCard, setDivisiFilterCard] = useState<string>("SEMUA");
  const [searchPengurus, setSearchPengurus] = useState("");

  // Data Peserta / Pengurus State (Dynamic CRUD dengan Supabase)
  const [pengurusList, setPengurusList] = useState<PengurusMember[]>(DAFTAR_PENGURUS_HIMASI);
  const [loadingPengurus, setLoadingPengurus] = useState(false);
  const pengurusListRef = useRef<PengurusMember[]>(pengurusList);

  useEffect(() => {
    pengurusListRef.current = pengurusList;
  }, [pengurusList]);

  // Bersihkan cache lokal usang (kegiatan, logs, & pengurus) agar tidak ada data zombie / desinkronisasi
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("himasi_kegiatan_list");
        localStorage.removeItem("himasi_absensi_logs");
        localStorage.removeItem("himasi_pengurus_list");
      } catch (e) {
        console.warn("Purge cache warning:", e);
      }
    }
  }, []);

  // Modal Tambah / Edit Peserta Pengurus
  const [isPengurusModalOpen, setIsPengurusModalOpen] = useState(false);
  const [editingPengurus, setEditingPengurus] = useState<PengurusMember | null>(null);
  const [formPengurusNama, setFormPengurusNama] = useState("");
  const [formPengurusNim, setFormPengurusNim] = useState("");
  const [formPengurusDivisi, setFormPengurusDivisi] = useState<string>("BPH");
  const [formPengurusJabatan, setFormPengurusJabatan] = useState("");
  const [formPengurusEmail, setFormPengurusEmail] = useState("");
  const [formPengurusImage, setFormPengurusImage] = useState<string>("/DSC01203.png");
  const [formPengurusToken, setFormPengurusToken] = useState("");
  const [formPengurusUrutan, setFormPengurusUrutan] = useState<number>(0);
  const [savingPengurus, setSavingPengurus] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Modal Konfirmasi Hapus Peserta Pengurus
  const [pengurusToDelete, setPengurusToDelete] = useState<PengurusMember | null>(null);
  const [deletingPengurus, setDeletingPengurus] = useState(false);

  // Dokumen Organisasi State (CRUD Admin)
  const [dokumenList, setDokumenList] = useState<DokumenOrganisasi[]>(DEFAULT_DOKUMEN_ORGANISASI);
  const [loadingDokumen, setLoadingDokumen] = useState(false);
  const [isDokumenModalOpen, setIsDokumenModalOpen] = useState(false);
  const [editingDokumen, setEditingDokumen] = useState<DokumenOrganisasi | null>(null);
  const [dokumenToDelete, setDokumenToDelete] = useState<DokumenOrganisasi | null>(null);
  const [deletingDokumen, setDeletingDokumen] = useState(false);
  const [savingDokumen, setSavingDokumen] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);

  // Form Dokumen
  const [formDokumenJudul, setFormDokumenJudul] = useState("");
  const [formDokumenDeskripsi, setFormDokumenDeskripsi] = useState("");
  const [formDokumenFileUrl, setFormDokumenFileUrl] = useState("");
  const [formDokumenFileName, setFormDokumenFileName] = useState("");
  const [formDokumenFileSize, setFormDokumenFileSize] = useState("");
  const [formDokumenUrutan, setFormDokumenUrutan] = useState<number>(1);
  const pdfFileInputRef = useRef<HTMLInputElement | null>(null);

  // Kalender Agenda State (Dinamis sesuai tanggal & bulan yang sedang berjalan)
  const [agendaList, setAgendaList] = useState<AgendaKalender[]>(DEFAULT_AGENDA_EVENTS);
  const [loadingAgenda, setLoadingAgenda] = useState(true);
  const [adminCalYear, setAdminCalYear] = useState(() => new Date().getFullYear());
  const [adminCalMonth, setAdminCalMonth] = useState(() => new Date().getMonth());
  const [adminSelectedDate, setAdminSelectedDate] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  });
  const [isAgendaModalOpen, setIsAgendaModalOpen] = useState(false);
  const [editingAgenda, setEditingAgenda] = useState<AgendaKalender | null>(null);
  const [agendaToDelete, setAgendaToDelete] = useState<AgendaKalender | null>(null);
  const [deletingAgenda, setDeletingAgenda] = useState(false);
  const [savingAgenda, setSavingAgenda] = useState(false);

  // Form Agenda State
  const [formAgendaJudul, setFormAgendaJudul] = useState("");
  const [formAgendaKategori, setFormAgendaKategori] = useState<EventCategory>("HIMASI");
  const [formAgendaTanggalMulai, setFormAgendaTanggalMulai] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  });
  const [formAgendaTanggalSelesai, setFormAgendaTanggalSelesai] = useState("");
  const [formAgendaIsMultiDay, setFormAgendaIsMultiDay] = useState(false);
  const [formAgendaWaktu, setFormAgendaWaktu] = useState("Sepanjang Hari");
  const [formAgendaLokasi, setFormAgendaLokasi] = useState("Kampus ISB Atma Luhur");
  const [formAgendaDeskripsi, setFormAgendaDeskripsi] = useState("");

  // SQL Copy Feedback
  const [copiedSQL, setCopiedSQL] = useState(false);

  // 1. Cek Sesi Pengurus via Supabase Auth
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          const basicUser = {
            email: session.user.email,
            id: session.user.id,
            full_name:
              session.user.user_metadata?.full_name ||
              session.user.email?.split("@")[0] ||
              "Pengurus HIMASI",
          };
          setUser(basicUser);

          const profile = await getCurrentUserProfile(basicUser);
          if (profile) {
            setCurrentUserRole(profile.role);
            if (profile.nama_lengkap) {
              setCurrentUserName(profile.nama_lengkap);
            } else {
              setCurrentUserName(basicUser.full_name);
            }
          } else {
            setCurrentUserName(basicUser.full_name);
          }
        } else {
          setUser(null);
          setCurrentUserRole("humas_biskraf");
          setCurrentUserName("Pengurus HIMASI");
        }
      } catch (err) {
        console.warn("Gagal mengambil sesi:", err);
      } finally {
        setAuthLoading(false);
      }
    };

    fetchUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const basicUser = {
          email: session.user.email,
          id: session.user.id,
          full_name:
            session.user.user_metadata?.full_name ||
            session.user.email?.split("@")[0] ||
            "Pengurus HIMASI",
        };
        setUser(basicUser);

        const profile = await getCurrentUserProfile(basicUser);
        if (profile) {
          setCurrentUserRole(profile.role);
          if (profile.nama_lengkap) {
            setCurrentUserName(profile.nama_lengkap);
          } else {
            setCurrentUserName(basicUser.full_name);
          }
        } else {
          setCurrentUserName(basicUser.full_name);
        }
      } else {
        setUser(null);
        setCurrentUserRole("humas_biskraf");
        setCurrentUserName("Pengurus HIMASI");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Auth Guard: Jika sesi selesai diperiksa dan pengguna belum login, alihkan langsung ke /login
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [authLoading, user, router]);

  // View Guard: Jika tab yang dipilih tidak diizinkan untuk role saat ini, arahkan ke /error/403
  useEffect(() => {
    if (!authLoading && user && !canAccessTab(currentUserRole, activeTab)) {
      router.push("/error/403");
    }
  }, [activeTab, currentUserRole, authLoading, user, router]);

  // 2. Fetch Aspirasi dari Supabase Table 'public.aspirasi'
  const fetchAspirasi = useCallback(async () => {
    setLoadingAspirasi(true);
    try {
      const { data, error } = await supabase
        .from("aspirasi")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.warn("Supabase fetch error, memakai fallback data:", error.message);
        setAspirasiList(fallbackAspirasi);
        setIsUsingFallback(true);
      } else if (data && data.length > 0) {
        setAspirasiList(data);
        setIsUsingFallback(false);
      } else {
        setAspirasiList(fallbackAspirasi);
        setIsUsingFallback(true);
      }
    } catch (err) {
      console.warn("Gagal koneksi tabel Supabase:", err);
      setAspirasiList(fallbackAspirasi);
      setIsUsingFallback(true);
    } finally {
      setLoadingAspirasi(false);
    }
  }, []);

  useEffect(() => {
    fetchAspirasi();
  }, [fetchAspirasi]);

  // Fetch Audit Log untuk Widget Overview (Limit 4 entri terkini)
  const fetchOverviewAuditLogs = useCallback(async () => {
    setLoadingOverviewAuditLogs(true);
    try {
      const logs = await getAuditLogs({ limit: 4 });
      setOverviewAuditLogs(logs);
    } catch (err) {
      console.warn("Gagal mengambil audit log overview:", err);
    } finally {
      setLoadingOverviewAuditLogs(false);
    }
  }, []);

  useEffect(() => {
    fetchOverviewAuditLogs();
  }, [fetchOverviewAuditLogs]);

  useEffect(() => {
    if (activeTab === "overview") {
      fetchOverviewAuditLogs();
    }
  }, [activeTab, fetchOverviewAuditLogs]);

  // 3. Ambil Kegiatan Absensi dari Supabase Cloud (dengan sinkronisasi Realtime & Deduplikasi)
  const fetchKegiatan = useCallback(async () => {
    setLoadingKegiatan(true);
    let loaded: KegiatanItem[] = [];

    try {
      const { data, error } = await supabase
        .from("kegiatan_absensi")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data) {
        // Deduplikasi item berdasarkan nama dan tanggal agar tampilan bersih dan akurat
        const seen = new Set<string>();
        const uniqueItems: KegiatanItem[] = [];

        for (const row of data) {
          const key = `${(row.nama_kegiatan || "").trim().toLowerCase()}_${row.tanggal}`;
          if (!seen.has(key)) {
            seen.add(key);
            uniqueItems.push({
              id: row.id,
              nama: row.nama_kegiatan,
              tanggal: row.tanggal,
              jam: row.jam || row.keterangan || "09:00 WIB",
            });
          }
        }
        loaded = uniqueItems;
      }
    } catch (err) {
      console.warn("Koneksi Supabase kegiatan_absensi:", err);
    }

    setKegiatanList(loaded);

    if (loaded.length > 0) {
      setActiveKegiatan((prev) => {
        if (prev && loaded.some((k) => k.id === prev.id)) return prev;
        return loaded[0];
      });
    } else {
      setActiveKegiatan(null);
    }
    setLoadingKegiatan(false);
  }, []);

  // 4. Ambil Log Absensi dari Supabase Cloud (dengan sinkronisasi Realtime)
  const fetchAbsensiLogs = useCallback(async () => {
    let logs: AbsensiRecord[] = [];

    try {
      const { data, error } = await supabase
        .from("absensi_log")
        .select("*")
        .order("waktu_scan", { ascending: false });

      if (!error && data) {
        const currentPengurus =
          pengurusListRef.current && pengurusListRef.current.length > 0
            ? pengurusListRef.current
            : DAFTAR_PENGURUS_HIMASI;

        logs = data.map((row) => {
          const pengurus =
            currentPengurus.find(
              (p) =>
                p.nim === row.nim ||
                p.nama.toLowerCase() === row.nama_pengurus.toLowerCase()
            ) ||
            DAFTAR_PENGURUS_HIMASI.find(
              (p) =>
                p.nim === row.nim ||
                p.nama.toLowerCase() === row.nama_pengurus.toLowerCase()
            );
          const scanTime = new Date(row.waktu_scan);
          const waktuFormat = isNaN(scanTime.getTime())
            ? "-"
            : scanTime.toLocaleTimeString("id-ID", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              });

          return {
            id: row.id,
            pengurusId: pengurus?.id || `pengurus-${row.nim}`,
            nama: row.nama_pengurus,
            nim: row.nim,
            divisi: row.divisi || pengurus?.divisi || "HIMASI",
            jabatan: pengurus?.jabatan || "Pengurus HIMASI",
            image: pengurus?.image || "/DSC01203.png",
            kegiatan: row.nama_kegiatan,
            waktu: waktuFormat,
            status: (row.status as AbsensiRecord["status"]) || "Hadir",
            catatan: row.catatan || undefined,
          };
        });
      }
    } catch (err) {
      console.warn("Koneksi Supabase absensi_log:", err);
    }

    setAbsensiLogs(logs);
  }, []);

  // 4B. Ambil Data Peserta / Pengurus dari Supabase Cloud (Single Source of Truth)
  const fetchPengurus = useCallback(async () => {
    setLoadingPengurus(true);
    let loaded: PengurusMember[] = [];

    try {
      const { data, error } = await supabase
        .from("pengurus")
        .select("*")
        .order("created_at", { ascending: true });

      if (!error && data && data.length > 0) {
        loaded = data.map((row) => ({
          id: row.id,
          nim: row.nim,
          nama: row.nama,
          jabatan: row.jabatan,
          divisi: (row.divisi || "").trim().toUpperCase(),
          qrToken: row.qr_token || row.qrToken || generateQrToken(row.nim, row.nama),
          image: row.foto_url || row.image || "/DSC01203.png",
          email: row.email || `${row.nim}@atmaluhur.ac.id`,
          urutan: row.urutan != null ? Number(row.urutan) : undefined,
        }));
      } else if (!error && (!data || data.length === 0)) {
        // Otomatis lakukan SEEDING data pengurus master ke Supabase jika tabel masih kosong
        console.info("Tabel pengurus kosong, melakukan seeding otomatis dari master data...");
        const seedPayload = DAFTAR_PENGURUS_HIMASI.map((p) => ({
          nim: p.nim,
          nama: p.nama,
          jabatan: p.jabatan,
          divisi: p.divisi,
          qr_token: p.qrToken,
          foto_url: p.image,
          email: p.email,
          urutan: p.urutan || 0,
        }));

        const { data: seeded, error: seedError } = await supabase
          .from("pengurus")
          .upsert(seedPayload, { onConflict: "nim" })
          .select();

        if (!seedError && seeded && seeded.length > 0) {
          loaded = seeded.map((row) => ({
            id: row.id,
            nim: row.nim,
            nama: row.nama,
            jabatan: row.jabatan,
            divisi: (row.divisi || "").trim().toUpperCase(),
            qrToken: row.qr_token || generateQrToken(row.nim, row.nama),
            image: row.foto_url || "/DSC01203.png",
            email: row.email || `${row.nim}@atmaluhur.ac.id`,
            urutan: row.urutan != null ? Number(row.urutan) : undefined,
          }));
        } else {
          loaded = DAFTAR_PENGURUS_HIMASI;
        }
      }
    } catch (err) {
      console.warn("Koneksi Supabase pengurus:", err);
      loaded = DAFTAR_PENGURUS_HIMASI;
    }

    if (loaded.length > 0) {
      setPengurusList(sortPengurusMembers(loaded));
    }
    setLoadingPengurus(false);
  }, []);

  // 4C. Ambil Data Dokumen Organisasi dari Supabase
  const fetchDokumenList = useCallback(async () => {
    setLoadingDokumen(true);
    try {
      const data = await getDokumenOrganisasi();
      setDokumenList(data);
    } catch (err) {
      console.warn("fetchDokumenList error:", err);
      setDokumenList(DEFAULT_DOKUMEN_ORGANISASI);
    } finally {
      setLoadingDokumen(false);
    }
  }, []);

  // 4D. Ambil Data Agenda Kalender dari Supabase
  const fetchAgendaList = useCallback(async () => {
    setLoadingAgenda(true);
    try {
      const data = await getAgendaKalender(true);
      setAgendaList(data);
    } catch (err) {
      console.warn("fetchAgendaList error:", err);
      setAgendaList(DEFAULT_AGENDA_EVENTS);
    } finally {
      setLoadingAgenda(false);
    }
  }, []);

  // Realtime Subscription Supabase (Multi-Device Auto-Sync)
  useEffect(() => {
    fetchKegiatan();
    fetchAbsensiLogs();
    fetchPengurus();
    fetchDokumenList();
    fetchAgendaList();

    const channel = supabase
      .channel("himasi_realtime_dashboard")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "kegiatan_absensi" },
        () => {
          fetchKegiatan();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "absensi_log" },
        () => {
          fetchAbsensiLogs();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "aspirasi" },
        () => {
          fetchAspirasi();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "pengurus" },
        () => {
          fetchPengurus();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "dokumen_organisasi" },
        () => {
          fetchDokumenList();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "agenda_kalender" },
        () => {
          fetchAgendaList();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchKegiatan, fetchAbsensiLogs, fetchAspirasi, fetchPengurus, fetchDokumenList, fetchAgendaList]);

  // 5. Handler saat scan absensi berhasil
  const handleAttendanceSuccess = (record: AbsensiRecord) => {
    setAbsensiLogs((prev) => [record, ...prev]);
    showToast(`Presensi ${record.nama} (${record.status}) berhasil disimpan ke Supabase!`);
  };

  // 6. Tambah Kegiatan Baru dari Popup Modal (Disimpan ke DB Supabase Cloud)
  const handleSimpanKegiatan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNamaKegiatan.trim()) return;

    const namaTrim = formNamaKegiatan.trim();
    const tglVal = formTanggalKegiatan || new Date().toISOString().split("T")[0];
    const jamVal = formJamKegiatan.trim() || "09:00 WIB";

    let generatedId = `keg-${Date.now()}`;
    let isDbSaved = false;

    try {
      const { data, error } = await supabase
        .from("kegiatan_absensi")
        .insert([
          {
            nama_kegiatan: namaTrim,
            tanggal: tglVal,
            jam: jamVal,
            keterangan: jamVal,
          },
        ])
        .select();

      if (!error && data && data.length > 0 && data[0].id) {
        generatedId = data[0].id;
        isDbSaved = true;
      } else if (error) {
        console.warn("Catatan simpan kegiatan ke Supabase:", error.message);
      }
    } catch (err) {
      console.warn("Catatan simpan kegiatan ke Supabase:", err);
    }

    const newKegiatan: KegiatanItem = {
      id: generatedId,
      nama: namaTrim,
      tanggal: tglVal,
      jam: jamVal,
    };

    setKegiatanList((prev) => {
      const filtered = prev.filter(
        (k) =>
          k.id !== generatedId &&
          !(k.nama.trim().toLowerCase() === namaTrim.toLowerCase() && k.tanggal === tglVal)
      );
      return [newKegiatan, ...filtered];
    });
    setActiveKegiatan(newKegiatan);

    setFormNamaKegiatan("");
    setFormTanggalKegiatan(new Date().toISOString().split("T")[0]);
    setFormJamKegiatan("09:00 WIB");
    setIsTambahKegiatanModalOpen(false);

    if (isDbSaved) {
      showToast(`Kegiatan "${namaTrim}" berhasil disimpan ke Database Cloud Supabase!`);
    } else {
      showToast(`Kegiatan "${namaTrim}" berhasil dibuat.`);
    }

    recordAuditLog({
      modul: "absensi",
      aksi: `Membuat kegiatan presensi baru: "${namaTrim}"`,
      pengurus_nama: currentUserName,
      pengurus_role: currentUserRole,
      status: "berhasil",
      detail: `Tanggal: ${tglVal}, Jam: ${jamVal}, DB: ${isDbSaved ? "Cloud" : "Lokal"}`,
    }).catch((err) => console.warn("[dashboard] Gagal mencatat audit log buat kegiatan:", err));
  };

  // 7. Request & Konfirmasi Hapus Kegiatan (Modal Interaktif Tanpa window.confirm)
  const handleRequestDeleteKegiatan = (id: string) => {
    const target =
      kegiatanList.find((k) => k.id === id) ||
      (activeKegiatan?.id === id ? activeKegiatan : null);
    if (target) {
      setKegiatanToDelete(target);
    }
  };

  const handleDeleteKegiatan = (id: string) => {
    handleRequestDeleteKegiatan(id);
  };

  const handleConfirmDeleteKegiatan = async () => {
    if (!kegiatanToDelete) return;
    setDeletingKegiatan(true);

    const targetId = kegiatanToDelete.id;
    const targetNama = kegiatanToDelete.nama.trim();
    const targetNamaLower = targetNama.toLowerCase();

    // 1. Bersihkan kegiatan dari state secara instan
    setKegiatanList((prev) =>
      prev.filter(
        (k) => k.id !== targetId && k.nama.trim().toLowerCase() !== targetNamaLower
      )
    );

    // 2. Bersihkan absensiLogs dari state secara instan
    setAbsensiLogs((prev) =>
      prev.filter((l) => l.kegiatan.trim().toLowerCase() !== targetNamaLower)
    );

    // 3. Pastikan storage lokal bersih dari cache usang
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("himasi_kegiatan_list");
        localStorage.removeItem("himasi_absensi_logs");
      } catch {}
    }

    // 4. Update activeKegiatan jika kegiatan yang dihapus sedang aktif
    setActiveKegiatan((prev) => {
      if (!prev) return null;
      if (prev.id === targetId || prev.nama.trim().toLowerCase() === targetNamaLower) {
        const remaining = kegiatanList.filter(
          (k) => k.id !== targetId && k.nama.trim().toLowerCase() !== targetNamaLower
        );
        return remaining.length > 0 ? remaining[0] : null;
      }
      return prev;
    });

    // 4. Hapus dari Supabase jika tabel sudah dibuat
    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetId);
      if (isUuid) {
        await supabase.from("kegiatan_absensi").delete().eq("id", targetId);
      }
      if (targetNama) {
        await supabase.from("kegiatan_absensi").delete().ilike("nama_kegiatan", targetNama);
        await supabase.from("absensi_log").delete().ilike("nama_kegiatan", targetNama);
      }
    } catch (err) {
      console.warn("Catatan hapus kegiatan dari Supabase:", err);
    } finally {
      setDeletingKegiatan(false);
      setKegiatanToDelete(null);
      showToast(`Kegiatan "${targetNama}" berhasil dihapus.`);
    }

    recordAuditLog({
      modul: "absensi",
      aksi: `Menghapus kegiatan presensi: "${targetNama}"`,
      pengurus_nama: currentUserName,
      pengurus_role: currentUserRole,
      status: "berhasil",
      detail: `ID: ${targetId}`,
    }).catch((err) => console.warn("[dashboard] Gagal mencatat audit log hapus kegiatan:", err));
  };

  // 8. Hapus / Reset Presensi Log Tertentu atau Seluruh Presensi Kegiatan
  const handleDeleteSingleAbsensiLog = async (nim: string, namaKegiatan: string) => {
    const updatedLogs = absensiLogs.filter(
      (l) =>
        !(
          l.nim === nim &&
          l.kegiatan.trim().toLowerCase() === namaKegiatan.trim().toLowerCase()
        )
    );
    setAbsensiLogs(updatedLogs);

    try {
      await supabase
        .from("absensi_log")
        .delete()
        .eq("nim", nim)
        .ilike("nama_kegiatan", namaKegiatan.trim());
    } catch (err) {
      console.warn("Gagal hapus log dari Supabase:", err);
    }

    recordAuditLog({
      modul: "absensi",
      aksi: `Mereset riwayat presensi pengurus NIM ${nim}`,
      pengurus_nama: currentUserName,
      pengurus_role: currentUserRole,
      status: "berhasil",
      detail: `Kegiatan: ${namaKegiatan}`,
    }).catch((err) => console.warn("[dashboard] Gagal mencatat audit log reset presensi pengurus:", err));

    showToast(`Presensi pengurus NIM ${nim} berhasil direset.`);
  };

  const handleResetAllAbsensiLogs = async (namaKegiatan: string) => {
    const updatedLogs = absensiLogs.filter(
      (l) => l.kegiatan.trim().toLowerCase() !== namaKegiatan.trim().toLowerCase()
    );
    setAbsensiLogs(updatedLogs);

    try {
      await supabase
        .from("absensi_log")
        .delete()
        .ilike("nama_kegiatan", namaKegiatan.trim());
    } catch (err) {
      console.warn("Gagal reset log dari Supabase:", err);
    }

    recordAuditLog({
      modul: "absensi",
      aksi: `Mereset seluruh data presensi untuk kegiatan "${namaKegiatan}"`,
      pengurus_nama: currentUserName,
      pengurus_role: currentUserRole,
      status: "berhasil",
    }).catch((err) => console.warn("[dashboard] Gagal mencatat audit log reset all presensi:", err));

    showToast(`Seluruh presensi kegiatan "${namaKegiatan}" berhasil dikosongkan.`);
  };

  // 9. Update Status Aspirasi
  const handleUpdateStatus = async (
    id: string,
    newStatus: "baru" | "diproses" | "selesai"
  ) => {
    try {
      if (!isUsingFallback) {
        const { error } = await supabase
          .from("aspirasi")
          .update({ status: newStatus })
          .eq("id", id);

        if (error) throw error;
      }

      setAspirasiList((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
      );
      if (selectedAspirasi && selectedAspirasi.id === id) {
        setSelectedAspirasi((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
      showToast(`Status aspirasi berhasil diubah ke ${newStatus}.`);

      recordAuditLog({
        modul: "aspirasi",
        aksi: `Memperbarui status aspirasi mahasiswa menjadi "${newStatus}"`,
        pengurus_nama: currentUserName,
        pengurus_role: currentUserRole,
        status: "berhasil",
        detail: `ID: ${id}`,
      }).catch((err) => console.warn("[dashboard] Gagal mencatat audit log update status aspirasi:", err));
    } catch (err) {
      showToast("Gagal memperbarui status: " + (err as Error).message);
    }
  };

  // 10. Hapus Aspirasi (Interaktif Tanpa window.confirm)
  const handleDeleteAspirasi = (id: string) => {
    const target = aspirasiList.find((item) => item.id === id);
    if (target) {
      setAspirasiToDelete(target);
    }
  };

  const handleConfirmDeleteAspirasi = async () => {
    if (!aspirasiToDelete) return;
    setDeletingAspirasi(true);
    const id = aspirasiToDelete.id;
    try {
      if (!isUsingFallback) {
        const { error } = await supabase.from("aspirasi").delete().eq("id", id);
        if (error) throw error;
      }
      setAspirasiList((prev) => prev.filter((item) => item.id !== id));
      if (selectedAspirasi?.id === id) {
        setSelectedAspirasi(null);
      }
      showToast("Catatan aspirasi mahasiswa berhasil dihapus.");

      recordAuditLog({
        modul: "aspirasi",
        aksi: `Menghapus aspirasi mahasiswa (ID: ${id})`,
        pengurus_nama: currentUserName,
        pengurus_role: currentUserRole,
        status: "berhasil",
        detail: `Pengirim: ${aspirasiToDelete.email || "Anonim"} (Angkatan ${aspirasiToDelete.angkatan || "-"})`,
      }).catch((err) => console.warn("[dashboard] Gagal mencatat audit log hapus aspirasi:", err));
    } catch (err) {
      showToast("Gagal menghapus aspirasi: " + (err as Error).message);
    } finally {
      setDeletingAspirasi(false);
      setAspirasiToDelete(null);
    }
  };

  // 11. Handler CRUD Peserta / Pengurus HIMASI
  const handleOpenTambahPengurus = () => {
    setEditingPengurus(null);
    setFormPengurusNama("");
    setFormPengurusNim("");
    setFormPengurusDivisi(DAFTAR_DIVISI[0] || "PEMBINA");
    setFormPengurusJabatan("");
    setFormPengurusEmail("");
    setFormPengurusImage("/DSC01203.png");
    setFormPengurusToken("");
    setFormPengurusUrutan(0);
    setIsPengurusModalOpen(true);
  };

  const handleOpenEditPengurus = (member: PengurusMember) => {
    setEditingPengurus(member);
    setFormPengurusNama(member.nama);
    setFormPengurusNim(member.nim);
    setFormPengurusDivisi(member.divisi);
    setFormPengurusJabatan(member.jabatan);
    setFormPengurusEmail(member.email || `${member.nim}@atmaluhur.ac.id`);
    setFormPengurusImage(member.image || "/DSC01203.png");
    setFormPengurusToken(member.qrToken || generateQrToken(member.nim, member.nama));
    setFormPengurusUrutan(member.urutan != null ? member.urutan : 0);
    setIsPengurusModalOpen(true);
  };

  // Helper Upload & Kompresi Foto Profil Peserta
  const processAndUploadImage = async (file: File) => {
    setUploadingImage(true);
    try {
      if (!file.type.startsWith("image/")) {
        showToast("File yang dipilih harus berupa gambar (JPG, PNG, atau WebP)");
        return;
      }

      // Kompresi gambar via HTML Canvas (max 600x600 px, kualitas 82%)
      const { optimizedBlob, base64Url } = await new Promise<{
        optimizedBlob: Blob;
        base64Url: string;
      }>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = document.createElement("img");
          img.onload = () => {
            const maxDim = 600;
            let width = img.width;
            let height = img.height;
            if (width > height) {
              if (width > maxDim) {
                height = Math.round((height * maxDim) / width);
                width = maxDim;
              }
            } else {
              if (height > maxDim) {
                width = Math.round((width * maxDim) / height);
                height = maxDim;
              }
            }

            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            if (!ctx) {
              resolve({
                optimizedBlob: file,
                base64Url: e.target?.result as string,
              });
              return;
            }
            ctx.drawImage(img, 0, 0, width, height);
            const b64 = canvas.toDataURL("image/jpeg", 0.82);
            canvas.toBlob(
              (blob) => {
                resolve({
                  optimizedBlob: blob || file,
                  base64Url: b64,
                });
              },
              "image/jpeg",
              0.82
            );
          };
          img.onerror = reject;
          img.src = e.target?.result as string;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Tampilkan preview instan
      setFormPengurusImage(base64Url);

      // Coba upload ke Supabase Storage (bucket: 'foto-pengurus')
      const cleanNim = formPengurusNim.trim() || "pengurus";
      const filePath = `foto_${cleanNim}_${Date.now()}.jpg`;

      const { data, error } = await supabase.storage
        .from("foto-pengurus")
        .upload(filePath, optimizedBlob, {
          contentType: "image/jpeg",
          cacheControl: "3600",
          upsert: true,
        });

      if (!error && data) {
        const { data: publicUrlData } = supabase.storage
          .from("foto-pengurus")
          .getPublicUrl(filePath);

        if (publicUrlData?.publicUrl) {
          setFormPengurusImage(publicUrlData.publicUrl);
          showToast("Foto berhasil diunggah ke Supabase Storage!");
        }
      } else {
        // Fallback Base64 (jika storage bucket Supabase belum dibuat di project)
        console.warn("Storage upload note (fallback to base64):", error?.message);
        showToast("Foto berhasil dimuat & siap disimpan!");
      }
    } catch (err) {
      console.error("Gagal memproses upload foto:", err);
      showToast("Gagal memproses file foto.");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSavePengurus = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanDivisi = formPengurusDivisi || "BPH";
    let cleanNim = formPengurusNim.trim();
    if (!cleanNim && cleanDivisi === "PEMBINA") {
      cleanNim = `PEMBINA-${Date.now().toString().slice(-6)}`;
    }

    if (!formPengurusNama.trim() || !cleanNim) {
      showToast("Nama lengkap dan NIM wajib diisi!");
      return;
    }

    const cleanNama = formPengurusNama.trim().toUpperCase();
    const cleanJabatan = formPengurusJabatan.trim() || `Pengurus ${cleanDivisi}`;
    const cleanEmail = formPengurusEmail.trim() || `${cleanNim}@atmaluhur.ac.id`;
    const cleanImage = formPengurusImage.trim() || "/DSC01203.png";
    const cleanToken = formPengurusToken.trim() || generateQrToken(cleanNim, cleanNama);
    const cleanUrutan = formPengurusUrutan > 0 ? formPengurusUrutan : undefined;

    // Cek duplikasi NIM
    const duplicate = pengurusList.some(
      (p) =>
        p.nim.toLowerCase() === cleanNim.toLowerCase() &&
        (!editingPengurus || p.id !== editingPengurus.id)
    );
    if (duplicate) {
      showToast(`Error: NIM "${cleanNim}" sudah terdaftar untuk anggota lain!`);
      return;
    }

    setSavingPengurus(true);

    if (editingPengurus) {
      // Mode Edit
      const updatedMember: PengurusMember = {
        ...editingPengurus,
        nama: cleanNama,
        nim: cleanNim,
        divisi: cleanDivisi,
        jabatan: cleanJabatan,
        email: cleanEmail,
        image: cleanImage,
        qrToken: cleanToken,
        urutan: cleanUrutan,
      };

      const updatedList = sortPengurusMembers(
        pengurusList.map((p) => (p.id === editingPengurus.id ? updatedMember : p))
      );
      setPengurusList(updatedList);

      if (selectedPengurusCard?.id === editingPengurus.id) {
        setSelectedPengurusCard(updatedMember);
      }

      // Sync update ke Supabase tabel pengurus
      try {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(editingPengurus.id);
        const updatePayload: Record<string, any> = {
          nama: cleanNama,
          nim: cleanNim,
          divisi: cleanDivisi,
          jabatan: cleanJabatan,
          email: cleanEmail,
          foto_url: cleanImage,
          qr_token: cleanToken,
          updated_at: new Date().toISOString(),
        };
        if (cleanUrutan !== undefined) {
          updatePayload.urutan = cleanUrutan;
        }

        const query = isUuid
          ? supabase.from("pengurus").update(updatePayload).eq("id", editingPengurus.id)
          : supabase.from("pengurus").update(updatePayload).eq("nim", editingPengurus.nim);

        let { error: updErr } = await query;
        if (updErr && updErr.message?.includes("urutan")) {
          delete updatePayload.urutan;
          const retryQuery = isUuid
            ? supabase.from("pengurus").update(updatePayload).eq("id", editingPengurus.id)
            : supabase.from("pengurus").update(updatePayload).eq("nim", editingPengurus.nim);
          const res = await retryQuery;
          updErr = res.error;
        }

        if (updErr) {
          console.warn("Supabase update pengurus error:", updErr);
          showToast(`Peringatan: Gagal sinkron ke database: ${updErr.message}`);
        } else {
          showToast(`Data pengurus "${cleanNama}" berhasil diperbarui!`);
        }
        recordAuditLog({
          modul: "kartu-qr",
          aksi: `Memperbarui profil & QR token anggota: ${cleanNama} (${cleanNim})`,
          pengurus_nama: currentUserName,
          pengurus_role: currentUserRole,
          status: "berhasil",
          detail: `Jabatan: ${cleanJabatan}, Divisi: ${cleanDivisi}, Email: ${cleanEmail}`,
        }).catch((err) => console.warn("[dashboard] Gagal mencatat audit log update pengurus:", err));
      } catch (err) {
        console.warn("Supabase update pengurus error:", err);
        showToast(`Data pengurus "${cleanNama}" berhasil diperbarui!`);
      }
    } else {
      // Mode Tambah Baru
      let generatedId = `pengurus-${Date.now()}`;
      let isDbSaved = false;

      try {
        const insertPayload: Record<string, any> = {
          nama: cleanNama,
          nim: cleanNim,
          divisi: cleanDivisi,
          jabatan: cleanJabatan,
          email: cleanEmail,
          foto_url: cleanImage,
          qr_token: cleanToken,
        };
        if (cleanUrutan !== undefined) {
          insertPayload.urutan = cleanUrutan;
        }

        let { data, error } = await supabase
          .from("pengurus")
          .insert([insertPayload])
          .select();

        if (error && error.message?.includes("urutan")) {
          delete insertPayload.urutan;
          const retry = await supabase
            .from("pengurus")
            .insert([insertPayload])
            .select();
          data = retry.data;
          error = retry.error;
        }

        if (!error && data && data.length > 0 && data[0].id) {
          generatedId = data[0].id;
          isDbSaved = true;
        } else if (error) {
          console.warn("Supabase insert pengurus error:", error);
          showToast(`Error database: ${error.message}`);
        }
      } catch (err) {
        console.warn("Supabase insert pengurus error:", err);
      }

      const newMember: PengurusMember = {
        id: generatedId,
        nama: cleanNama,
        nim: cleanNim,
        divisi: cleanDivisi,
        jabatan: cleanJabatan,
        email: cleanEmail,
        image: cleanImage,
        qrToken: cleanToken,
        urutan: cleanUrutan,
      };

      setPengurusList(sortPengurusMembers([newMember, ...pengurusList]));

      recordAuditLog({
        modul: "kartu-qr",
        aksi: `Menambahkan anggota pengurus & menerbitkan kartu QR: ${cleanNama} (${cleanNim})`,
        pengurus_nama: currentUserName,
        pengurus_role: currentUserRole,
        status: "berhasil",
        detail: `Jabatan: ${cleanJabatan}, Divisi: ${cleanDivisi}, Email: ${cleanEmail}`,
      }).catch((err) => console.warn("[dashboard] Gagal mencatat audit log create pengurus:", err));

      if (isDbSaved) {
        showToast(`Anggota "${cleanNama}" berhasil ditambahkan & tersimpan ke Cloud!`);
      } else {
        showToast(`Anggota "${cleanNama}" berhasil ditambahkan!`);
      }
    }

    setSavingPengurus(false);
    setIsPengurusModalOpen(false);
  };

  const handleRequestDeletePengurus = (member: PengurusMember) => {
    setSelectedPengurusCard(null);
    setPengurusToDelete(member);
  };

  const handleConfirmDeletePengurus = async () => {
    if (!pengurusToDelete) return;
    setDeletingPengurus(true);

    const targetId = pengurusToDelete.id;
    const targetNim = pengurusToDelete.nim;
    const targetNama = pengurusToDelete.nama;

    setPengurusList((prev) => prev.filter((p) => p.id !== targetId));

    recordAuditLog({
      modul: "kartu-qr",
      aksi: `Menghapus data anggota pengurus: ${targetNama} (${targetNim})`,
      pengurus_nama: currentUserName,
      pengurus_role: currentUserRole,
      status: "berhasil",
      detail: `ID: ${targetId}, NIM: ${targetNim}`,
    }).catch((err) => console.warn("[dashboard] Gagal mencatat audit log delete pengurus:", err));

    if (selectedPengurusCard?.id === targetId) {
      setSelectedPengurusCard(null);
    }

    // Hapus dari Supabase tabel pengurus
    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetId);
      if (isUuid) {
        await supabase.from("pengurus").delete().eq("id", targetId);
      } else {
        await supabase.from("pengurus").delete().eq("nim", targetNim);
      }
    } catch (err) {
      console.warn("Supabase delete pengurus error:", err);
    }

    setDeletingPengurus(false);
    setPengurusToDelete(null);
    showToast(`Peserta "${targetNama}" berhasil dihapus dari database.`);
  };

  // 11B. Handler CRUD Dokumen Organisasi
  const handleOpenTambahDokumen = () => {
    setEditingDokumen(null);
    setFormDokumenJudul("");
    setFormDokumenDeskripsi("");
    setFormDokumenFileUrl("");
    setFormDokumenFileName("");
    setFormDokumenFileSize("");
    setFormDokumenUrutan((dokumenList.length || 0) + 1);
    setIsDokumenModalOpen(true);
  };

  const handleOpenEditDokumen = (doc: DokumenOrganisasi) => {
    setEditingDokumen(doc);
    setFormDokumenJudul(doc.judul);
    setFormDokumenDeskripsi(doc.deskripsi);
    setFormDokumenFileUrl(doc.file_url);
    setFormDokumenFileName(doc.file_name);
    setFormDokumenFileSize(doc.file_size || "");
    setFormDokumenUrutan(doc.urutan || 1);
    setIsDokumenModalOpen(true);
  };

  const handleProcessPdfFile = async (file: File) => {
    setUploadingPdf(true);
    try {
      if (!file.name.toLowerCase().endsWith(".pdf") && file.type !== "application/pdf") {
        showToast("Berkas yang dipilih harus berupa dokumen PDF (.pdf)");
        return;
      }

      if (file.size > 26214400) {
        showToast("Ukuran berkas melebihi batas maksimal 25 MB");
        return;
      }

      const res = await uploadDokumenPdf(file);
      if (res) {
        setFormDokumenFileUrl(res.url);
        setFormDokumenFileName(res.fileName);
        setFormDokumenFileSize(res.fileSize);
        showToast(`Berkas PDF "${file.name}" siap disimpan!`);
      }
    } catch (err: any) {
      console.error("Gagal mengunggah PDF:", err);
      showToast(err?.message || "Gagal mengunggah berkas PDF.");
    } finally {
      setUploadingPdf(false);
    }
  };

  const handleSaveDokumen = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formDokumenJudul.trim() || !formDokumenDeskripsi.trim()) {
      showToast("Judul dan deskripsi dokumen wajib diisi!");
      return;
    }

    if (!formDokumenFileUrl) {
      showToast("Silakan pilih berkas PDF dokumen terlebih dahulu!");
      return;
    }

    setSavingDokumen(true);

    if (editingDokumen) {
      const updated = await updateDokumen(editingDokumen.id, {
        judul: formDokumenJudul,
        deskripsi: formDokumenDeskripsi,
        file_url: formDokumenFileUrl,
        file_name: formDokumenFileName,
        file_size: formDokumenFileSize,
        urutan: formDokumenUrutan,
      });

      if (!updated) {
        showToast("Peringatan: Gagal sinkron ke database Supabase! Pastikan tabel telah dibuat di SQL Editor.");
      } else {
        showToast(`Dokumen "${formDokumenJudul}" berhasil diperbarui di Supabase!`);
      }

      recordAuditLog({
        modul: "dokumen",
        aksi: `Memperbarui dokumen organisasi: "${formDokumenJudul}"`,
        pengurus_nama: currentUserName,
        pengurus_role: currentUserRole,
        status: "berhasil",
        detail: `Berkas: ${formDokumenFileName || "-"}, Ukuran: ${formDokumenFileSize || "-"}`,
      }).catch((err) => console.warn("[dashboard] Gagal mencatat audit log update dokumen:", err));

      setDokumenList((prev) =>
        prev
          .map((d) =>
            d.id === editingDokumen.id
              ? {
                  ...d,
                  judul: formDokumenJudul,
                  deskripsi: formDokumenDeskripsi,
                  file_url: formDokumenFileUrl,
                  file_name: formDokumenFileName,
                  file_size: formDokumenFileSize,
                  urutan: formDokumenUrutan,
                }
              : d
          )
          .sort((a, b) => (a.urutan || 0) - (b.urutan || 0))
      );
    } else {
      const created = await createDokumen({
        judul: formDokumenJudul,
        deskripsi: formDokumenDeskripsi,
        file_url: formDokumenFileUrl,
        file_name: formDokumenFileName,
        file_size: formDokumenFileSize,
        urutan: formDokumenUrutan,
      });

      if (created) {
        setDokumenList((prev) =>
          [...prev, created].sort((a, b) => (a.urutan || 0) - (b.urutan || 0))
        );
        showToast(`Dokumen "${formDokumenJudul}" berhasil disimpan ke database Supabase!`);
      } else {
        const localDoc: DokumenOrganisasi = {
          id: `doc-${Date.now()}`,
          judul: formDokumenJudul,
          deskripsi: formDokumenDeskripsi,
          file_url: formDokumenFileUrl,
          file_name: formDokumenFileName,
          file_size: formDokumenFileSize,
          urutan: formDokumenUrutan,
        };
        setDokumenList((prev) =>
          [...prev, localDoc].sort((a, b) => (a.urutan || 0) - (b.urutan || 0))
        );
        showToast("Peringatan: Tersimpan lokal di browser. Tabel 'dokumen_organisasi' belum dibuat di Supabase!");
      }

      recordAuditLog({
        modul: "dokumen",
        aksi: `Mengunggah & menerbitkan dokumen organisasi: "${formDokumenJudul}"`,
        pengurus_nama: currentUserName,
        pengurus_role: currentUserRole,
        status: "berhasil",
        detail: `Berkas: ${formDokumenFileName || "-"}, Ukuran: ${formDokumenFileSize || "-"}`,
      }).catch((err) => console.warn("[dashboard] Gagal mencatat audit log create dokumen:", err));
    }

    setSavingDokumen(false);
    setIsDokumenModalOpen(false);
  };

  const handleConfirmDeleteDokumen = async () => {
    if (!dokumenToDelete) return;
    setDeletingDokumen(true);
    const targetId = dokumenToDelete.id;
    const targetJudul = dokumenToDelete.judul;

    const deleted = await deleteDokumen(targetId);
    if (!deleted) {
      showToast("Peringatan: Gagal menghapus dari Supabase! Pastikan tabel telah dibuat di SQL Editor.");
    } else {
      showToast(`Dokumen "${targetJudul}" berhasil dihapus dari Supabase.`);
    }

    recordAuditLog({
      modul: "dokumen",
      aksi: `Menghapus dokumen organisasi: "${targetJudul}"`,
      pengurus_nama: currentUserName,
      pengurus_role: currentUserRole,
      status: "berhasil",
      detail: `ID: ${targetId}`,
    }).catch((err) => console.warn("[dashboard] Gagal mencatat audit log delete dokumen:", err));

    setDokumenList((prev) => prev.filter((d) => d.id !== targetId));
    setDeletingDokumen(false);
    setDokumenToDelete(null);
  };

  // 11C. Handler & Helper Kalender Agenda
  const NAMA_BULAN_ID = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];
  const HARI_SINGKAT = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

  const handleAdminPrevMonth = () => {
    let newYear = adminCalYear;
    let newMonth = adminCalMonth - 1;
    if (adminCalMonth === 0) {
      newMonth = 11;
      newYear = adminCalYear - 1;
    }
    setAdminCalMonth(newMonth);
    setAdminCalYear(newYear);
    setAdminSelectedDate(`${newYear}-${String(newMonth + 1).padStart(2, "0")}-01`);
  };

  const handleAdminNextMonth = () => {
    let newYear = adminCalYear;
    let newMonth = adminCalMonth + 1;
    if (adminCalMonth === 11) {
      newMonth = 0;
      newYear = adminCalYear + 1;
    }
    setAdminCalMonth(newMonth);
    setAdminCalYear(newYear);
    setAdminSelectedDate(`${newYear}-${String(newMonth + 1).padStart(2, "0")}-01`);
  };

  const handleAdminToday = () => {
    const today = new Date();
    setAdminCalYear(today.getFullYear());
    setAdminCalMonth(today.getMonth());
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    setAdminSelectedDate(dateStr);
  };

  const adminCalendarCells = useMemo(() => {
    const firstDay = new Date(adminCalYear, adminCalMonth, 1);
    const startDayOfWeek = (firstDay.getDay() + 6) % 7;
    const daysInMonth = new Date(adminCalYear, adminCalMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(adminCalYear, adminCalMonth, 0).getDate();

    const cells: {
      dayNumber: number;
      monthOffset: -1 | 0 | 1;
      fullDate: string;
      isToday: boolean;
      isSelected: boolean;
      events: AgendaKalender[];
    }[] = [];

    const todayStr = new Date().toISOString().split("T")[0];

    // Bulan sebelumnya
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const prevDate = new Date(adminCalYear, adminCalMonth - 1, d);
      const dateStr = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const evts = agendaList.filter((e) => isDateInEventRange(dateStr, e));
      cells.push({
        dayNumber: d,
        monthOffset: -1,
        fullDate: dateStr,
        isToday: dateStr === todayStr,
        isSelected: dateStr === adminSelectedDate,
        events: evts,
      });
    }

    // Bulan sekarang
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${adminCalYear}-${String(adminCalMonth + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
      const evts = agendaList.filter((e) => isDateInEventRange(dateStr, e));
      cells.push({
        dayNumber: i,
        monthOffset: 0,
        fullDate: dateStr,
        isToday: dateStr === todayStr,
        isSelected: dateStr === adminSelectedDate,
        events: evts,
      });
    }

    // Bulan selanjutnya
    const totalCells = cells.length <= 35 ? 35 : 42;
    const remaining = totalCells - cells.length;
    for (let i = 1; i <= remaining; i++) {
      const nextDate = new Date(adminCalYear, adminCalMonth + 1, i);
      const dateStr = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
      const evts = agendaList.filter((e) => isDateInEventRange(dateStr, e));
      cells.push({
        dayNumber: i,
        monthOffset: 1,
        fullDate: dateStr,
        isToday: dateStr === todayStr,
        isSelected: dateStr === adminSelectedDate,
        events: evts,
      });
    }

    return cells;
  }, [adminCalYear, adminCalMonth, adminSelectedDate, agendaList]);

  const selectedDateEvents = useMemo(() => {
    if (!adminSelectedDate) return [];
    return agendaList.filter((e) => isDateInEventRange(adminSelectedDate, e));
  }, [agendaList, adminSelectedDate]);

  const handleOpenTambahAgenda = (prefillDate?: string) => {
    setEditingAgenda(null);
    const targetDate = prefillDate || adminSelectedDate || `${adminCalYear}-${String(adminCalMonth + 1).padStart(2, "0")}-01`;
    setFormAgendaTanggalMulai(targetDate);
    setFormAgendaTanggalSelesai("");
    setFormAgendaIsMultiDay(false);
    setFormAgendaJudul("");
    setFormAgendaKategori("HIMASI");
    setFormAgendaWaktu("Sepanjang Hari");
    setFormAgendaLokasi("Kampus ISB Atma Luhur");
    setFormAgendaDeskripsi("");
    setIsAgendaModalOpen(true);
  };

  const handleOpenEditAgenda = (agenda: AgendaKalender) => {
    setEditingAgenda(agenda);
    setFormAgendaTanggalMulai(agenda.tanggal_mulai);
    setFormAgendaTanggalSelesai(agenda.tanggal_selesai || "");
    setFormAgendaIsMultiDay(Boolean(agenda.tanggal_selesai && agenda.tanggal_selesai !== agenda.tanggal_mulai));
    setFormAgendaJudul(agenda.judul);
    setFormAgendaKategori(agenda.kategori);
    setFormAgendaWaktu(agenda.waktu || "Sepanjang Hari");
    setFormAgendaLokasi(agenda.lokasi || "Kampus ISB Atma Luhur");
    setFormAgendaDeskripsi(agenda.deskripsi || "");
    setIsAgendaModalOpen(true);
  };

  const handleSaveAgenda = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formAgendaJudul.trim() || !formAgendaTanggalMulai) {
      showToast("Judul dan tanggal mulai agenda wajib diisi!");
      return;
    }

    if (formAgendaIsMultiDay && formAgendaTanggalSelesai && formAgendaTanggalSelesai < formAgendaTanggalMulai) {
      showToast("Tanggal selesai tidak boleh lebih awal dari tanggal mulai!");
      return;
    }

    setSavingAgenda(true);
    const finalTanggalSelesai = formAgendaIsMultiDay && formAgendaTanggalSelesai ? formAgendaTanggalSelesai : null;
    const isApprover = canPublishContent(currentUserRole);
    const targetStatus: ContentStatus = isApprover ? "published" : "pending_review";

    if (editingAgenda) {
      if (editingAgenda.status === "published" && !canEditPublishedContent(currentUserRole)) {
        showToast("Wewenang terbatas: Agenda terbit hanya dapat diubah oleh Medkominfo.");
        setSavingAgenda(false);
        return;
      }

      const updated = await updateAgenda(editingAgenda.id, {
        tanggal_mulai: formAgendaTanggalMulai,
        tanggal_selesai: finalTanggalSelesai,
        judul: formAgendaJudul,
        kategori: formAgendaKategori,
        waktu: formAgendaWaktu,
        lokasi: formAgendaLokasi,
        deskripsi: formAgendaDeskripsi,
        status: isApprover ? editingAgenda.status : "pending_review",
      });

      if (updated) {
        setAgendaList((prev) =>
          prev.map((a) => (a.id === editingAgenda.id ? updated : a))
        );
        showToast(
          isApprover
            ? `Agenda "${formAgendaJudul}" berhasil diperbarui di Supabase!`
            : `Agenda "${formAgendaJudul}" diperbarui dan diajukan ulang ke Medkominfo!`
        );
      } else {
        setAgendaList((prev) =>
          prev.map((a) =>
            a.id === editingAgenda.id
              ? {
                  ...a,
                  tanggal_mulai: formAgendaTanggalMulai,
                  tanggal_selesai: finalTanggalSelesai,
                  judul: formAgendaJudul,
                  kategori: formAgendaKategori,
                  waktu: formAgendaWaktu,
                  lokasi: formAgendaLokasi,
                  deskripsi: formAgendaDeskripsi,
                }
              : a
          )
        );
        showToast("Peringatan: Gagal sinkron ke database Supabase! Pastikan tabel 'agenda_kalender' telah dibuat di SQL Editor.");
      }

      recordAuditLog({
        modul: "kalender",
        aksi: `Memperbarui agenda kegiatan: "${formAgendaJudul}"`,
        pengurus_nama: currentUserName,
        pengurus_role: currentUserRole,
        status: updated ? "berhasil" : "gagal",
        detail: `Tanggal: ${formAgendaTanggalMulai}${finalTanggalSelesai ? ` s.d ${finalTanggalSelesai}` : ""}, Kategori: ${formAgendaKategori}`,
      }).catch((err) => console.warn("[dashboard] Gagal mencatat audit log update agenda:", err));
    } else {
      const created = await createAgenda({
        tanggal_mulai: formAgendaTanggalMulai,
        tanggal_selesai: finalTanggalSelesai,
        judul: formAgendaJudul,
        kategori: formAgendaKategori,
        waktu: formAgendaWaktu,
        lokasi: formAgendaLokasi,
        deskripsi: formAgendaDeskripsi,
        status: targetStatus,
      });

      if (created) {
        setAgendaList((prev) => [...prev, created]);
        showToast(
          isApprover
            ? `Agenda "${formAgendaJudul}" berhasil disimpan ke database Supabase!`
            : `Agenda "${formAgendaJudul}" diajukan & menunggu kurasi Medkominfo!`
        );
      } else {
        const localItem: AgendaKalender = {
          id: `evt-${Date.now()}`,
          tanggal_mulai: formAgendaTanggalMulai,
          tanggal_selesai: finalTanggalSelesai,
          judul: formAgendaJudul,
          kategori: formAgendaKategori,
          waktu: formAgendaWaktu,
          lokasi: formAgendaLokasi,
          deskripsi: formAgendaDeskripsi,
          status: targetStatus,
        };
        setAgendaList((prev) => [...prev, localItem]);
        showToast("Peringatan: Tersimpan lokal di browser. Tabel 'agenda_kalender' belum dibuat di Supabase!");
      }

      recordAuditLog({
        modul: "kalender",
        aksi: `Menambahkan agenda kegiatan: "${formAgendaJudul}"`,
        pengurus_nama: currentUserName,
        pengurus_role: currentUserRole,
        status: created ? "berhasil" : "gagal",
        detail: `Tanggal: ${formAgendaTanggalMulai}, Kategori: ${formAgendaKategori}, Status: ${targetStatus}`,
      }).catch((err) => console.warn("[dashboard] Gagal mencatat audit log create agenda:", err));
    }

    setSavingAgenda(false);
    setIsAgendaModalOpen(false);
  };

  const handleApproveAgenda = async (agenda: AgendaKalender) => {
    try {
      const updated = await updateAgendaStatus(agenda.id, "published");
      if (updated) {
        setAgendaList((prev) =>
          prev.map((a) => (a.id === agenda.id ? { ...a, status: "published" } : a))
        );
        showToast(`Agenda "${agenda.judul}" disetujui & dipublikasikan ke kalender publik!`);

        recordAuditLog({
          modul: "kalender",
          aksi: `Menyetujui & mempublikasikan agenda kegiatan: "${agenda.judul}"`,
          pengurus_nama: currentUserName,
          pengurus_role: currentUserRole,
          status: "berhasil",
          detail: `ID: ${agenda.id}, Tanggal: ${agenda.tanggal_mulai}`,
        }).catch((err) => console.warn("[dashboard] Gagal mencatat audit log approve agenda:", err));
      }
    } catch (err) {
      console.error("Approve agenda error:", err);
      showToast("Gagal menyetujui agenda.");
    }
  };

  const handleConfirmDeleteAgenda = async () => {
    if (!agendaToDelete) return;
    if (agendaToDelete.status === "published" && !canEditPublishedContent(currentUserRole)) {
      showToast("Wewenang terbatas: Agenda publik hanya dapat dihapus oleh Medkominfo.");
      setAgendaToDelete(null);
      return;
    }
    setDeletingAgenda(true);

    const deleted = await deleteAgenda(agendaToDelete.id);
    if (!deleted) {
      showToast("Peringatan: Gagal menghapus dari Supabase! Pastikan tabel telah dibuat di SQL Editor.");
    } else {
      showToast(`Agenda "${agendaToDelete.judul}" berhasil dihapus dari Supabase.`);
    }

    recordAuditLog({
      modul: "kalender",
      aksi: `Menghapus agenda kegiatan: "${agendaToDelete.judul}"`,
      pengurus_nama: currentUserName,
      pengurus_role: currentUserRole,
      status: deleted ? "berhasil" : "gagal",
      detail: `ID: ${agendaToDelete.id}, Tanggal: ${agendaToDelete.tanggal_mulai}`,
    }).catch((err) => console.warn("[dashboard] Gagal mencatat audit log delete agenda:", err));

    setAgendaList((prev) => prev.filter((a) => a.id !== agendaToDelete.id));
    setDeletingAgenda(false);
    setAgendaToDelete(null);
  };

  const formatTanggalIndoFull = (dateStr: string) => {
    const parts = dateStr.split("-");
    if (parts.length !== 3) return dateStr;
    const year = parts[0];
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const d = new Date(parseInt(year), month, day);
    const hari = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"][d.getDay()];
    return `${hari}, ${day} ${NAMA_BULAN_ID[month]} ${year}`;
  };

  // 12. Logout Pengurus
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.push("/login");
    } catch (err) {
      console.error("Gagal logout:", err);
    }
  };

  // 13. Copy SQL Script
  const sqlScriptContent = `-- ====================================================================
-- SKEMA LENGKAP DATABASE SUPABASE HIMASI ISB ATMA LUHUR
-- Kabinet REKSABUDAYA - Sistem Absensi QR, Rekap Kegiatan, & Portal Pengurus
-- ====================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. TABEL: kegiatan_absensi (Master Data Agenda Kegiatan)
CREATE TABLE IF NOT EXISTS public.kegiatan_absensi (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nama_kegiatan TEXT NOT NULL,
    tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
    jam TEXT NOT NULL DEFAULT '09:00 WIB',
    keterangan TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_kegiatan_absensi_tanggal ON public.kegiatan_absensi(tanggal DESC);
CREATE INDEX IF NOT EXISTS idx_kegiatan_absensi_nama ON public.kegiatan_absensi(nama_kegiatan);

-- 3. TABEL: absensi_log (Riwayat Presensi Pengurus saat Scan QR)
CREATE TABLE IF NOT EXISTS public.absensi_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nama_pengurus TEXT NOT NULL,
    nim TEXT NOT NULL,
    divisi TEXT NOT NULL,
    nama_kegiatan TEXT NOT NULL,
    waktu_scan TIMESTAMPTZ NOT NULL DEFAULT now(),
    status TEXT NOT NULL DEFAULT 'Hadir' CHECK (status IN ('Hadir', 'Terlambat')),
    catatan TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_absensi_log_kegiatan ON public.absensi_log(nama_kegiatan);
CREATE INDEX IF NOT EXISTS idx_absensi_log_nim ON public.absensi_log(nim);
CREATE INDEX IF NOT EXISTS idx_absensi_log_waktu ON public.absensi_log(waktu_scan DESC);

-- 4. TABEL: aspirasi (Kotak Aspirasi Mahasiswa)
CREATE TABLE IF NOT EXISTS public.aspirasi (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    angkatan TEXT NOT NULL,
    pesan TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'baru' CHECK (status IN ('baru', 'diproses', 'selesai')),
    catatan_pengurus TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_aspirasi_status ON public.aspirasi(status);
CREATE INDEX IF NOT EXISTS idx_aspirasi_created ON public.aspirasi(created_at DESC);

-- 5. TABEL: pengurus (Master Data Peserta / Anggota HIMASI & QR Token)
CREATE TABLE IF NOT EXISTS public.pengurus (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nim TEXT UNIQUE NOT NULL,
    nama TEXT NOT NULL,
    jabatan TEXT NOT NULL,
    divisi TEXT NOT NULL,
    qr_token TEXT UNIQUE NOT NULL,
    foto_url TEXT,
    urutan INT DEFAULT 0,
    email TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.pengurus ADD COLUMN IF NOT EXISTS urutan INT DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_pengurus_nim ON public.pengurus(nim);
CREATE INDEX IF NOT EXISTS idx_pengurus_divisi ON public.pengurus(divisi);

-- 6. HAK AKSES API & IZIN PERANGKAT (GRANT & RLS)
GRANT ALL ON TABLE public.kegiatan_absensi TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.absensi_log TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.aspirasi TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.pengurus TO anon, authenticated, service_role;

ALTER TABLE public.kegiatan_absensi DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.absensi_log DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.aspirasi DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.pengurus DISABLE ROW LEVEL SECURITY;

-- 7. SUPABASE STORAGE BUCKET: foto-pengurus & foto-berita (Penyimpanan Berkas)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES 
    ('foto-pengurus', 'foto-pengurus', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
    ('foto-berita', 'foto-berita', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET 
    public = true;

-- Hapus kebijakan lama jika ada untuk pembaruan
DROP POLICY IF EXISTS "Public Access Foto Pengurus" ON storage.objects;
DROP POLICY IF EXISTS "Upload Foto Pengurus" ON storage.objects;
DROP POLICY IF EXISTS "Update Foto Pengurus" ON storage.objects;
DROP POLICY IF EXISTS "Delete Foto Pengurus" ON storage.objects;
DROP POLICY IF EXISTS "Public Read Foto Pengurus" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload Foto Pengurus" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Update Foto Pengurus" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Delete Foto Pengurus" ON storage.objects;
DROP POLICY IF EXISTS "Public Read Storage Objects" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload Storage Objects" ON storage.objects;

-- Kebijakan Hak Akses Aman (Hardened Security):
-- a. Semua orang (Public) HANYA BISA MELIHAT foto profil & berita (Read-Only)
CREATE POLICY "Public Read Storage Objects" 
ON storage.objects FOR SELECT 
TO public
USING (bucket_id IN ('foto-pengurus', 'foto-berita'));

-- b. HANYA PENGURUS TERAUTENTIKASI (Login) yang dapat mengunggah berkas foto
CREATE POLICY "Authenticated Upload Storage Objects" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (
    bucket_id IN ('foto-pengurus', 'foto-berita') AND 
    auth.role() = 'authenticated'
);

-- c. HANYA PENGURUS TERAUTENTIKASI yang dapat memperbarui berkas foto
CREATE POLICY "Authenticated Update Foto Pengurus" 
ON storage.objects FOR UPDATE 
TO authenticated 
USING (
    bucket_id = 'foto-pengurus' AND 
    auth.role() = 'authenticated'
);

-- d. HANYA PENGURUS TERAUTENTIKASI yang dapat menghapus berkas foto
CREATE POLICY "Authenticated Delete Foto Pengurus" 
ON storage.objects FOR DELETE 
TO authenticated 
USING (
    bucket_id = 'foto-pengurus' AND 
    auth.role() = 'authenticated'
);

-- 8. TABEL DOKUMEN ORGANISASI & STORAGE BUCKET
CREATE TABLE IF NOT EXISTS public.dokumen_organisasi (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  judul TEXT NOT NULL,
  deskripsi TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size TEXT,
  urutan INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

GRANT ALL ON TABLE public.dokumen_organisasi TO anon, authenticated, service_role;
ALTER TABLE public.dokumen_organisasi DISABLE ROW LEVEL SECURITY;

INSERT INTO public.dokumen_organisasi (id, judul, deskripsi, file_url, file_name, file_size, urutan)
VALUES
  ('doc-1', 'AD HIMASI', 'Anggaran Dasar HIMASI ISB Atma Luhur', '/documents/AD-ART-HIMASI-AtmaLuhur.pdf', 'AD-ART-HIMASI-AtmaLuhur.pdf', '1.2 MB', 1),
  ('doc-2', 'ART HIMASI', 'Anggaran Rumah Tangga HIMASI ISB Atma Luhur', '/documents/BPPK-Pedoman-Pengurus-HIMASI.pdf', 'BPPK-Pedoman-Pengurus-HIMASI.pdf', '1.8 MB', 2),
  ('doc-3', 'SK Kepengurusan', 'SK Kepengurusan HIMASI ISB Atma Luhur', '/documents/SK-Kepengurusan-HIMASI-AtmaLuhur.pdf', 'SK-Kepengurusan-HIMASI-AtmaLuhur.pdf', '850 KB', 3)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('dokumen-organisasi', 'dokumen-organisasi', true, 26214400, ARRAY['application/pdf'])
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Public Read Dokumen Organisasi" ON storage.objects;
DROP POLICY IF EXISTS "Public Upload Dokumen Organisasi" ON storage.objects;
DROP POLICY IF EXISTS "Public Update Dokumen Organisasi" ON storage.objects;
DROP POLICY IF EXISTS "Public Delete Dokumen Organisasi" ON storage.objects;

CREATE POLICY "Public Read Dokumen Organisasi" 
ON storage.objects FOR SELECT 
TO public
USING (bucket_id = 'dokumen-organisasi');

CREATE POLICY "Public Upload Dokumen Organisasi" 
ON storage.objects FOR INSERT 
TO public
WITH CHECK (bucket_id = 'dokumen-organisasi');

CREATE POLICY "Public Update Dokumen Organisasi" 
ON storage.objects FOR UPDATE 
TO public
USING (bucket_id = 'dokumen-organisasi');

CREATE POLICY "Public Delete Dokumen Organisasi" 
ON storage.objects FOR DELETE 
TO public
USING (bucket_id = 'dokumen-organisasi');

-- 9. TABEL AGENDA KALENDER & SEED DATA
CREATE TABLE IF NOT EXISTS public.agenda_kalender (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tanggal_mulai DATE NOT NULL,
  tanggal_selesai DATE,
  judul TEXT NOT NULL,
  kategori TEXT NOT NULL DEFAULT 'HIMASI',
  waktu TEXT NOT NULL DEFAULT 'Sepanjang Hari',
  lokasi TEXT NOT NULL DEFAULT 'Kampus ISB Atma Luhur',
  deskripsi TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

GRANT ALL ON TABLE public.agenda_kalender TO anon, authenticated, service_role;
ALTER TABLE public.agenda_kalender DISABLE ROW LEVEL SECURITY;

INSERT INTO public.agenda_kalender (id, tanggal_mulai, tanggal_selesai, judul, kategori, waktu, lokasi, deskripsi)
VALUES
  ('evt-sep-09', '2026-09-09', '2026-09-10', 'Ujian Sidang Skripsi & Tugas Akhir Gelombang I', 'Akademik', '08.30 - 16.00 WIB', 'Ruang Sidang Utama Lt. 2 ISB Atma Luhur', 'Pelaksanaan ujian sidang skripsi dan tugas akhir tahap 1 bagi mahasiswa tingkat akhir prodi Sistem Informasi.'),
  ('evt-sep-14', '2026-09-14', NULL, 'Awal Perkuliahan Efektif Semester Ganjil 2026/2027', 'Akademik', '07.30 - 17.00 WIB', 'Seluruh Ruang Kelas Sistem Informasi ISB Atma Luhur', 'Dimulainya perkuliahan tatap muka minggu ke-1 seluruh mata kuliah prodi Sistem Informasi.'),
  ('evt-sep-25', '2026-09-25', NULL, 'Malam Keakraban (MAKRAB) & Inaugurasi HIMASI 2026', 'HIMASI', '16.00 - 22.00 WIB', 'Auditorium & Lapangan Utama ISB Atma Luhur', 'Temu akrab mahasiswa baru bersama BPH & seluruh divisi HIMASI untuk menjalin sinergi.'),
  ('evt-sep-29', '2026-09-29', NULL, 'HIMASI Tech Talk: Road to Cloud Engineer & AI Frontier', 'HIMASI', '13.30 - 16.30 WIB', 'Lab Komputer Cloud & Live Streaming YouTube HIMASI', 'Seminar teknologi komputasi awan dan rekayasa AI bersama alumni praktisi industri.'),
  ('evt-aug-17', '2026-08-17', NULL, 'Upacara Peringatan HUT Kemerdekaan RI ke-81', 'Libur', '07.30 - 10.00 WIB', 'Lapangan Upacara ISB Atma Luhur', 'Upacara bendera peringatan kemerdekaan Republik Indonesia dan festival lomba kampus.'),
  ('evt-aug-24', '2026-08-24', NULL, 'Masa Pengisian & Revisi KRS Online Semester Ganjil', 'Akademik', '09.00 - 23.59 WIB', 'Portal SIAKAD Online Atma Luhur', 'Konsultasi dosen pembimbing akademik (PA) dan penguncian jadwal rencana studi.'),
  ('evt-oct-05', '2026-10-05', NULL, 'HIMASI Coding Clinic: Algoritma & Basis Data Relasional', 'HIMASI', '15.30 - 17.30 WIB', 'Lab Pemrograman Web Lt. 3', 'Sesi tutorial intensif dan bimbingan praktikum koding bersama tutor sebaya berprestasi HIMASI.'),
  ('evt-oct-15', '2026-10-15', NULL, 'Batas Akhir Verifikasi Dispensasi Kuliah & Delegasi Lomba', 'Akademik', '16.00 WIB', 'Sekretariat Prodi Sistem Informasi', 'Batas akhir penyerahan berkas verifikasi dispensasi lomba akademik dan program magang bersertifikat MBKM.'),
  ('evt-oct-26', '2026-10-26', '2026-10-31', 'Ujian Tengah Semester (UTS) Ganjil 2026/2027', 'Akademik', '08.00 - 16.00 WIB', 'Ruang Ujian Terpadu Kampus Atma Luhur', 'Pekan evaluasi tengah semester untuk seluruh mata kuliah teori dan praktikum sistem informasi.')
ON CONFLICT (id) DO NOTHING;

-- 10. TABEL APRESIA-SI (SHOWCASE & SUBMISI MAHASISWA)
CREATE TABLE IF NOT EXISTS public.apresiasi_showcase (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'karya',
  category_label TEXT,
  badge TEXT,
  student_name TEXT NOT NULL,
  team_members TEXT,
  nim TEXT,
  batch TEXT DEFAULT '2024',
  organizer_or_company TEXT,
  level TEXT DEFAULT 'Nasional',
  description TEXT NOT NULL,
  full_story TEXT,
  mentor_or_lecturer TEXT,
  image TEXT DEFAULT 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?q=80&w=800&auto=format&fit=crop',
  live_url TEXT,
  github_url TEXT,
  proof_url TEXT,
  likes INT DEFAULT 0,
  featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.apresiasi_showcase ENABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE public.apresiasi_showcase TO anon, authenticated, service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

DROP POLICY IF EXISTS "Publik dapat melihat showcase apresiasi" ON public.apresiasi_showcase;
CREATE POLICY "Publik dapat melihat showcase apresiasi" ON public.apresiasi_showcase FOR SELECT USING (true);
DROP POLICY IF EXISTS "Pengurus dapat mengelola showcase apresiasi" ON public.apresiasi_showcase;
CREATE POLICY "Pengurus dapat mengelola showcase apresiasi" ON public.apresiasi_showcase FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.apresiasi_submisi (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  student_name TEXT NOT NULL,
  team_members TEXT,
  nim TEXT NOT NULL,
  batch TEXT NOT NULL,
  contact TEXT NOT NULL,
  organizer_or_company TEXT NOT NULL,
  level TEXT DEFAULT 'Nasional',
  description TEXT NOT NULL,
  link_demo_or_repo TEXT,
  proof_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.apresiasi_submisi ENABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE public.apresiasi_submisi TO anon, authenticated, service_role;

DROP POLICY IF EXISTS "Mahasiswa dapat mengajukan apresiasi" ON public.apresiasi_submisi;
CREATE POLICY "Mahasiswa dapat mengajukan apresiasi" ON public.apresiasi_submisi FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Pengurus dapat mengelola submisi apresiasi" ON public.apresiasi_submisi;
CREATE POLICY "Pengurus dapat mengelola submisi apresiasi" ON public.apresiasi_submisi FOR ALL USING (true) WITH CHECK (true);

-- 11. TABEL SHORT LINKS & QR GENERATOR
CREATE TABLE IF NOT EXISTS public.short_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    title TEXT NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    original_url TEXT NOT NULL,
    clicks_count INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    divisi TEXT NOT NULL DEFAULT 'BPH',
    created_by TEXT NOT NULL DEFAULT 'Pengurus HIMASI',
    description TEXT
);

CREATE INDEX IF NOT EXISTS idx_short_links_slug ON public.short_links(slug);
CREATE INDEX IF NOT EXISTS idx_short_links_created_at ON public.short_links(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_short_links_is_active ON public.short_links(is_active);

ALTER TABLE public.short_links ENABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE public.short_links TO anon, authenticated, service_role;

DROP POLICY IF EXISTS "short_links_select_all" ON public.short_links;
CREATE POLICY "short_links_select_all" ON public.short_links FOR SELECT USING (true);
DROP POLICY IF EXISTS "short_links_insert_all" ON public.short_links;
CREATE POLICY "short_links_insert_all" ON public.short_links FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "short_links_update_all" ON public.short_links;
CREATE POLICY "short_links_update_all" ON public.short_links FOR UPDATE USING (true);
DROP POLICY IF EXISTS "short_links_delete_all" ON public.short_links;
CREATE POLICY "short_links_delete_all" ON public.short_links FOR DELETE USING (true);

CREATE OR REPLACE FUNCTION increment_short_link_clicks(link_slug TEXT)
RETURNS void AS $$
BEGIN
    UPDATE public.short_links
    SET clicks_count = clicks_count + 1,
        updated_at = NOW()
    WHERE slug = link_slug;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. TABEL: homepage_popups (Popup Pengumuman Beranda HIMASI)
CREATE TABLE IF NOT EXISTS public.homepage_popups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    title TEXT NOT NULL,
    tag TEXT NOT NULL DEFAULT 'PENGUMUMAN',
    content TEXT NOT NULL,
    image_url TEXT,
    cta_text TEXT,
    cta_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT false,
    created_by TEXT NOT NULL DEFAULT 'Pengurus HIMASI'
);

CREATE INDEX IF NOT EXISTS idx_homepage_popups_is_active ON public.homepage_popups(is_active);
CREATE INDEX IF NOT EXISTS idx_homepage_popups_updated_at ON public.homepage_popups(updated_at DESC);

ALTER TABLE public.homepage_popups ENABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE public.homepage_popups TO anon, authenticated, service_role;

DROP POLICY IF EXISTS "homepage_popups_select_all" ON public.homepage_popups;
CREATE POLICY "homepage_popups_select_all" ON public.homepage_popups FOR SELECT USING (true);
DROP POLICY IF EXISTS "homepage_popups_insert_all" ON public.homepage_popups;
CREATE POLICY "homepage_popups_insert_all" ON public.homepage_popups FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "homepage_popups_update_all" ON public.homepage_popups;
CREATE POLICY "homepage_popups_update_all" ON public.homepage_popups FOR UPDATE USING (true);
DROP POLICY IF EXISTS "homepage_popups_delete_all" ON public.homepage_popups;
CREATE POLICY "homepage_popups_delete_all" ON public.homepage_popups FOR DELETE USING (true);

CREATE OR REPLACE FUNCTION set_active_homepage_popup(target_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE public.homepage_popups
    SET is_active = false
    WHERE id <> target_id;

    UPDATE public.homepage_popups
    SET is_active = true,
        updated_at = NOW()
    WHERE id = target_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 13. REFRESH SCHEMA CACHE & REALTIME PUBLICATION
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.kegiatan_absensi, public.absensi_log, public.aspirasi, public.pengurus, public.dokumen_organisasi, public.agenda_kalender, public.apresiasi_showcase, public.apresiasi_submisi, public.short_links, public.homepage_popups;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
END $$;

NOTIFY pgrst, 'reload schema';`;

  const handleCopySQL = () => {
    navigator.clipboard.writeText(sqlScriptContent);
    setCopiedSQL(true);
    setTimeout(() => setCopiedSQL(false), 2000);
  };

  // Filter Aspirasi List
  const filteredAspirasi = aspirasiList.filter((item) => {
    const matchStatus = statusFilter === "semua" || item.status === statusFilter;
    const matchSearch =
      item.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.pesan.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.angkatan.includes(searchQuery);
    return matchStatus && matchSearch;
  });

  // Filter Mahasiswa untuk Scanner Absensi & Rekap PDF (Mengecualikan Dosen Pembina)
  const studentPengurusList = useMemo(
    () => pengurusList.filter((p) => p.divisi !== "PEMBINA"),
    [pengurusList]
  );

  // Filter Pengurus untuk Kartu QR & Tampilan Kabinet (Diurutkan Berdasarkan Hierarki)
  const filteredPengurusCards = useMemo(() => {
    return sortPengurusMembers(
      pengurusList.filter((p) => {
        const matchDivisi =
          divisiFilterCard === "SEMUA" || p.divisi === divisiFilterCard;
        const matchSearch =
          p.nama.toLowerCase().includes(searchPengurus.toLowerCase()) ||
          p.nim.includes(searchPengurus) ||
          p.jabatan.toLowerCase().includes(searchPengurus.toLowerCase());
        return matchDivisi && matchSearch;
      })
    );
  }, [pengurusList, divisiFilterCard, searchPengurus]);

  // Metrik Statistik
  const countBaru = aspirasiList.filter((a) => a.status === "baru").length;
  const currentLogs = activeKegiatan
    ? absensiLogs.filter(
        (l) => l.kegiatan.trim().toLowerCase() === activeKegiatan.nama.trim().toLowerCase()
      )
    : [];
  const totalHadir = currentLogs.filter((l) => l.status === "Hadir").length;
  const totalTerlambat = currentLogs.filter((l) => l.status === "Terlambat").length;

  // Guard: Tampilkan layar pemuatan dan cegah tampilan dashboard jika pengguna belum login
  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#00173d] via-[#00296E] to-[#00173d] flex flex-col items-center justify-center p-4 text-white">
        <div className="w-16 h-16 rounded-2xl bg-white/10 p-2.5 flex items-center justify-center mb-4 shadow-2xl border border-white/20 backdrop-blur-md animate-pulse">
          <img
            src="/logo-himasi.png"
            alt="Logo HIMASI"
            className="w-full h-full object-contain"
          />
        </div>
        <div className="flex items-center gap-2.5 text-sky-200 text-xs font-semibold">
          <ArrowsClockwise className="w-4 h-4 animate-spin text-sky-400" />
          <span>Memeriksa hak akses pengurus...</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen ${theme === "dark" ? "dark bg-[#001740] text-slate-100" : "bg-white text-slate-900"} flex flex-col font-poppins selection:bg-[#00296E] selection:text-white dark:selection:bg-[#38BDF8] dark:selection:text-[#001740] transition-colors duration-150`}
      data-theme={theme}
    >
      {/* ========================================================================= */}
      {/* GAYA 1: SWISS MINIMALIST GRID - TOP NAVBAR (FULL WIDTH)                   */}
      {/* ========================================================================= */}
      <header className="no-print w-full h-14 bg-white dark:bg-[#001438] border-b border-[#00296E]/20 dark:border-white/10 sticky top-0 z-50 flex items-stretch select-none">
        {/* Kolom Brand: HIMASI/ADMIN (Lebar w-64 sejajar lurus dengan Sidebar) */}
        <div className="w-64 min-w-[16rem] shrink-0 border-r border-[#00296E]/20 dark:border-white/10 px-5 flex items-center justify-between bg-white dark:bg-[#001438]">
          <button
            type="button"
            onClick={() => handleTabChange("overview")}
            className="flex items-center gap-2 group cursor-pointer text-left"
          >
            <span className="font-extrabold text-sm sm:text-base tracking-tight text-[#00296E] dark:text-white uppercase font-poppins">
              HIMASI/ADMIN
            </span>
          </button>
          <button
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-1 text-[#00296E] dark:text-white hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer"
            aria-label="Toggle Sidebar"
          >
            <List className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigasi Horizontal Swiss Grid Sesuai Subbagian (Tanpa Dropdown, Langsung ke Modul Pertama) */}
        <div className="flex items-stretch overflow-x-auto no-scrollbar flex-1">
          {/* 01. Ringkasan / Overview */}
          <button
            type="button"
            onClick={() => handleTabChange("overview")}
            className={`px-3.5 xl:px-5 2xl:px-6 h-full flex items-center text-xs tracking-tight border-r border-[#00296E]/20 dark:border-white/10 transition-colors whitespace-nowrap cursor-pointer select-none shrink-0 ${
              activeTab === "overview"
                ? "font-extrabold text-[#00296E] dark:text-white border-b-2 border-b-[#00296E] dark:border-b-[#38BDF8] bg-white dark:bg-[#001438]"
                : "font-semibold text-slate-600 dark:text-slate-400 hover:text-[#00296E] dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/[0.02]"
            }`}
          >
            01. Ringkasan
          </button>

          {/* 02. Berita & Aspirasi -> Menuju ke Berita & Berita */}
          <button
            type="button"
            onClick={() => handleTabChange("berita")}
            className={`px-3.5 xl:px-5 2xl:px-6 h-full flex items-center text-xs tracking-tight border-r border-[#00296E]/20 dark:border-white/10 transition-colors whitespace-nowrap cursor-pointer select-none shrink-0 ${
              ["berita", "apresiasi", "aspirasi"].includes(activeTab)
                ? "font-extrabold text-[#00296E] dark:text-white border-b-2 border-b-[#00296E] dark:border-b-[#38BDF8] bg-white dark:bg-[#001438]"
                : "font-semibold text-slate-600 dark:text-slate-400 hover:text-[#00296E] dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/[0.02]"
            }`}
          >
            02. Berita &amp; Aspirasi
          </button>

          {/* 03. Organisasi & Arsip -> Menuju ke Kartu QR & Profil */}
          <button
            type="button"
            onClick={() => handleTabChange("kartu-qr")}
            className={`px-3.5 xl:px-5 2xl:px-6 h-full flex items-center text-xs tracking-tight border-r border-[#00296E]/20 dark:border-white/10 transition-colors whitespace-nowrap cursor-pointer select-none shrink-0 ${
              ["kartu-qr", "kalender", "dokumen", "persuratan", "content-planner", "shortlink"].includes(activeTab)
                ? "font-extrabold text-[#00296E] dark:text-white border-b-2 border-b-[#00296E] dark:border-b-[#38BDF8] bg-white dark:bg-[#001438]"
                : "font-semibold text-slate-600 dark:text-slate-400 hover:text-[#00296E] dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/[0.02]"
            }`}
          >
            03. Organisasi &amp; Arsip
          </button>

          {/* 04. Operasional Presensi -> Menuju ke Absensi Kegiatan QR */}
          <button
            type="button"
            onClick={() => handleTabChange("absensi")}
            className={`px-3.5 xl:px-5 2xl:px-6 h-full flex items-center text-xs tracking-tight border-r border-[#00296E]/20 dark:border-white/10 transition-colors whitespace-nowrap cursor-pointer select-none shrink-0 ${
              ["absensi", "rekap-absensi"].includes(activeTab)
                ? "font-extrabold text-[#00296E] dark:text-white border-b-2 border-b-[#00296E] dark:border-b-[#38BDF8] bg-white dark:bg-[#001438]"
                : "font-semibold text-slate-600 dark:text-slate-400 hover:text-[#00296E] dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/[0.02]"
            }`}
          >
            04. Operasional Presensi
          </button>

          {/* 05. Sistem & Keamanan -> Menuju ke Pengaturan & Mode */}
          <button
            type="button"
            onClick={() => handleTabChange("banner")}
            className={`px-3.5 xl:px-5 2xl:px-6 h-full flex items-center text-xs tracking-tight border-r border-[#00296E]/20 dark:border-white/10 transition-colors whitespace-nowrap cursor-pointer select-none shrink-0 ${
              ["banner", "database", "users", "audit-log"].includes(activeTab)
                ? "font-extrabold text-[#00296E] dark:text-white border-b-2 border-b-[#00296E] dark:border-b-[#38BDF8] bg-white dark:bg-[#001438]"
                : "font-semibold text-slate-600 dark:text-slate-400 hover:text-[#00296E] dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/[0.02]"
            }`}
          >
            05. Sistem &amp; Keamanan
          </button>
        </div>

        {/* Kolom Kanan: Refresh, Theme Toggle Switch & SUPER ADMIN */}
        <div className="flex items-stretch shrink-0">
          {/* Refresh Data Button */}
          <button
            type="button"
            onClick={fetchAspirasi}
            disabled={loadingAspirasi}
            title="Muat Ulang Data"
            className="h-full px-3.5 border-l border-[#00296E]/20 dark:border-white/10 hover:bg-[#00296E]/5 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400 hover:text-[#00296E] dark:hover:text-white transition-colors cursor-pointer flex items-center justify-center"
          >
            <ArrowsClockwise className={`w-3.5 h-3.5 ${loadingAspirasi ? "animate-spin text-[#00296E] dark:text-[#38BDF8]" : ""}`} />
          </button>

          {/* SAKLAR TEMA DUAL-MODE (LIGHT / DARK) */}
          <button
            type="button"
            onClick={toggleTheme}
            title={theme === "light" ? "Ganti ke Mode Gelap (Midnight Swiss)" : "Ganti ke Mode Terang (Pure White)"}
            className="h-full px-4 border-l border-[#00296E]/20 dark:border-white/10 hover:bg-[#00296E]/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer flex items-center gap-2 text-xs font-mono font-bold"
            aria-label="Toggle Theme"
          >
            {theme === "light" ? (
              <>
                <Moon className="w-3.5 h-3.5 text-[#00296E]" />
                <span className="hidden sm:inline">MODE GELAP</span>
              </>
            ) : (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-300" />
                <span className="hidden sm:inline text-amber-300">MODE TERANG</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main App Layout (Below Top Navbar) */}
      <div className="flex flex-1 min-h-[calc(100vh-56px)] relative overflow-hidden">
        
        {/* Sidebar Navigasi Dashboard Swiss Minimalist */}
        <aside
          className={`no-print fixed inset-y-0 left-0 z-40 w-64 min-w-[16rem] shrink-0 bg-white dark:bg-[#001438] text-slate-800 dark:text-slate-200 border-r border-[#00296E]/20 dark:border-white/10 flex flex-col justify-between transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {/* Header Mobile Drawer Sidebar (Hanya tampil saat mode mobile) */}
          <div className="lg:hidden p-4 border-b border-[#00296E]/20 dark:border-white/10 flex items-center justify-between bg-white dark:bg-[#001233]">
            <span className="font-extrabold text-xs text-[#00296E] dark:text-white tracking-tight uppercase">
              HIMASI/ADMIN
            </span>
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="p-1.5 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Menu Navigasi Terkategori Berdasarkan Subbagian Instruksi User */}
          <div className="flex-1 overflow-y-auto pb-4">
            {/* OVERVIEW / RINGKASAN DI PALING ATAS */}
            <div className="px-5 pt-4 pb-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest font-poppins">
              NAVIGASI UTAMA
            </div>
            <nav className="space-y-0.5 px-3">
              <button
                type="button"
                onClick={() => handleTabChange("overview")}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs transition-colors cursor-pointer rounded-none ${
                  activeTab === "overview"
                    ? "bg-[#00296E]/5 dark:bg-white/10 text-[#00296E] dark:text-[#38BDF8] font-bold border-l-[3px] border-[#00296E] dark:border-[#38BDF8]"
                    : "text-slate-600 dark:text-slate-400 hover:text-[#00296E] dark:hover:text-white hover:bg-[#00296E]/[0.02] dark:hover:bg-white/5 border-l-[3px] border-transparent font-medium"
                }`}
              >
                <span>Overview</span>
                {activeTab === "overview" && <span className="font-mono text-sm leading-none">&rarr;</span>}
              </button>
            </nav>

            {/* SUBBAGIAN 1: Berita & Berita, Apresia-SI Mahasiswa, Kotak Aspirasi */}
            <div className="px-5 pt-5 pb-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest font-poppins">
              01. BERITA &amp; ASPIRASI
            </div>
            <nav className="space-y-0.5 px-3">
              {/* Berita & Berita */}
              {canAccessTab(currentUserRole, "berita") && (
                <button
                  type="button"
                  onClick={() => handleTabChange("berita")}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs transition-colors cursor-pointer rounded-none ${
                    activeTab === "berita"
                      ? "bg-[#00296E]/5 dark:bg-white/10 text-[#00296E] dark:text-[#38BDF8] font-bold border-l-[3px] border-[#00296E] dark:border-[#38BDF8]"
                      : "text-slate-600 dark:text-slate-400 hover:text-[#00296E] dark:hover:text-white hover:bg-[#00296E]/[0.02] dark:hover:bg-white/5 border-l-[3px] border-transparent font-medium"
                  }`}
                >
                  <span>Berita</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                      {beritaList.length > 0 ? beritaList.length : 24}
                    </span>
                    {activeTab === "berita" && <span className="font-mono text-sm leading-none">&rarr;</span>}
                  </div>
                </button>
              )}

              {/* Apresia-SI Mahasiswa */}
              {canAccessTab(currentUserRole, "apresiasi") && (
                <button
                  type="button"
                  onClick={() => handleTabChange("apresiasi")}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs transition-colors cursor-pointer rounded-none ${
                    activeTab === "apresiasi"
                      ? "bg-[#00296E]/5 dark:bg-white/10 text-[#00296E] dark:text-[#38BDF8] font-bold border-l-[3px] border-[#00296E] dark:border-[#38BDF8]"
                      : "text-slate-600 dark:text-slate-400 hover:text-[#00296E] dark:hover:text-white hover:bg-[#00296E]/[0.02] dark:hover:bg-white/5 border-l-[3px] border-transparent font-medium"
                  }`}
                >
                  <span>Apresia-SI Mahasiswa</span>
                  {activeTab === "apresiasi" && <span className="font-mono text-sm leading-none">&rarr;</span>}
                </button>
              )}

              {/* Kotak Aspirasi */}
              {canAccessTab(currentUserRole, "aspirasi") && (
                <button
                  type="button"
                  onClick={() => handleTabChange("aspirasi")}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs transition-colors cursor-pointer rounded-none ${
                    activeTab === "aspirasi"
                      ? "bg-[#00296E]/5 dark:bg-white/10 text-[#00296E] dark:text-[#38BDF8] font-bold border-l-[3px] border-[#00296E] dark:border-[#38BDF8]"
                      : "text-slate-600 dark:text-slate-400 hover:text-[#00296E] dark:hover:text-white hover:bg-[#00296E]/[0.02] dark:hover:bg-white/5 border-l-[3px] border-transparent font-medium"
                  }`}
                >
                  <span>Kotak Aspirasi</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                      {aspirasiList.length > 0 ? aspirasiList.length : 12}
                    </span>
                    {activeTab === "aspirasi" && <span className="font-mono text-sm leading-none">&rarr;</span>}
                  </div>
                </button>
              )}
            </nav>

            {/* SUBBAGIAN 2: Kartu QR & Profil, Kalender Agenda, Dokumen Organisasi */}
            <div className="px-5 pt-5 pb-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest font-poppins">
              02. ORGANISASI &amp; ARSIP
            </div>
            <nav className="space-y-0.5 px-3">
              {/* Kartu Identitas & QR */}
              {canAccessTab(currentUserRole, "kartu-qr") && (
                <button
                  type="button"
                  onClick={() => handleTabChange("kartu-qr")}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs transition-colors cursor-pointer rounded-none ${
                    activeTab === "kartu-qr"
                      ? "bg-[#00296E]/5 dark:bg-white/10 text-[#00296E] dark:text-[#38BDF8] font-bold border-l-[3px] border-[#00296E] dark:border-[#38BDF8]"
                      : "text-slate-600 dark:text-slate-400 hover:text-[#00296E] dark:hover:text-white hover:bg-[#00296E]/[0.02] dark:hover:bg-white/5 border-l-[3px] border-transparent font-medium"
                  }`}
                >
                  <span>Kartu QR &amp; Profil</span>
                  {activeTab === "kartu-qr" && <span className="font-mono text-sm leading-none">&rarr;</span>}
                </button>
              )}

              {/* Kalender Agenda */}
              {canAccessTab(currentUserRole, "kalender") && (
                <button
                  type="button"
                  onClick={() => handleTabChange("kalender")}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs transition-colors cursor-pointer rounded-none ${
                    activeTab === "kalender"
                      ? "bg-[#00296E]/5 dark:bg-white/10 text-[#00296E] dark:text-[#38BDF8] font-bold border-l-[3px] border-[#00296E] dark:border-[#38BDF8]"
                      : "text-slate-600 dark:text-slate-400 hover:text-[#00296E] dark:hover:text-white hover:bg-[#00296E]/[0.02] dark:hover:bg-white/5 border-l-[3px] border-transparent font-medium"
                  }`}
                >
                  <span>Kalender Agenda</span>
                  {activeTab === "kalender" && <span className="font-mono text-sm leading-none">&rarr;</span>}
                </button>
              )}

              {/* Dokumen Organisasi */}
              {canAccessTab(currentUserRole, "dokumen") && (
                <button
                  type="button"
                  onClick={() => handleTabChange("dokumen")}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs transition-colors cursor-pointer rounded-none ${
                    activeTab === "dokumen"
                      ? "bg-[#00296E]/5 dark:bg-white/10 text-[#00296E] dark:text-[#38BDF8] font-bold border-l-[3px] border-[#00296E] dark:border-[#38BDF8]"
                      : "text-slate-600 dark:text-slate-400 hover:text-[#00296E] dark:hover:text-white hover:bg-[#00296E]/[0.02] dark:hover:bg-white/5 border-l-[3px] border-transparent font-medium"
                  }`}
                >
                  <span>Dokumen Organisasi</span>
                  {activeTab === "dokumen" && <span className="font-mono text-sm leading-none">&rarr;</span>}
                </button>
              )}

              {/* Persuratan & Penomoran Otomatis */}
              {canAccessTab(currentUserRole, "persuratan") && (
                <button
                  type="button"
                  onClick={() => handleTabChange("persuratan")}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs transition-colors cursor-pointer rounded-none ${
                    activeTab === "persuratan"
                      ? "bg-[#00296E]/5 dark:bg-white/10 text-[#00296E] dark:text-[#38BDF8] font-bold border-l-[3px] border-[#00296E] dark:border-[#38BDF8]"
                      : "text-slate-600 dark:text-slate-400 hover:text-[#00296E] dark:hover:text-white hover:bg-[#00296E]/[0.02] dark:hover:bg-white/5 border-l-[3px] border-transparent font-medium"
                  }`}
                >
                  <span>Persuratan</span>
                  {activeTab === "persuratan" && <span className="font-mono text-sm leading-none">&rarr;</span>}
                </button>
              )}

              {/* Content Planner */}
              {canAccessTab(currentUserRole, "content-planner") && (
                <button
                  type="button"
                  onClick={() => handleTabChange("content-planner")}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs transition-colors cursor-pointer rounded-none ${
                    activeTab === "content-planner"
                      ? "bg-[#00296E]/5 dark:bg-white/10 text-[#00296E] dark:text-[#38BDF8] font-bold border-l-[3px] border-[#00296E] dark:border-[#38BDF8]"
                      : "text-slate-600 dark:text-slate-400 hover:text-[#00296E] dark:hover:text-white hover:bg-[#00296E]/[0.02] dark:hover:bg-white/5 border-l-[3px] border-transparent font-medium"
                  }`}
                >
                  <span>Content Planner</span>
                  {activeTab === "content-planner" && <span className="font-mono text-sm leading-none">&rarr;</span>}
                </button>
              )}

              {/* Tautan Singkat & QR Hub */}
              {canAccessTab(currentUserRole, "shortlink") && (
                <button
                  type="button"
                  onClick={() => handleTabChange("shortlink")}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs transition-colors cursor-pointer rounded-none ${
                    activeTab === "shortlink"
                      ? "bg-[#00296E]/5 dark:bg-white/10 text-[#00296E] dark:text-[#38BDF8] font-bold border-l-[3px] border-[#00296E] dark:border-[#38BDF8]"
                      : "text-slate-600 dark:text-slate-400 hover:text-[#00296E] dark:hover:text-white hover:bg-[#00296E]/[0.02] dark:hover:bg-white/5 border-l-[3px] border-transparent font-medium"
                  }`}
                >
                  <span>Tautan &amp; QR</span>
                  {activeTab === "shortlink" && <span className="font-mono text-sm leading-none">&rarr;</span>}
                </button>
              )}
            </nav>

            {/* SUBBAGIAN 3: Absensi Kegiatan QR, Rekapitulasi Presensi */}
            <div className="px-5 pt-5 pb-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest font-poppins">
              03. OPERASIONAL PRESENSI
            </div>
            <nav className="space-y-0.5 px-3">
              {/* Absensi Kegiatan QR */}
              {canAccessTab(currentUserRole, "absensi") && (
                <button
                  type="button"
                  onClick={() => handleTabChange("absensi")}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs transition-colors cursor-pointer rounded-none ${
                    activeTab === "absensi"
                      ? "bg-[#00296E]/5 dark:bg-white/10 text-[#00296E] dark:text-[#38BDF8] font-bold border-l-[3px] border-[#00296E] dark:border-[#38BDF8]"
                      : "text-slate-600 dark:text-slate-400 hover:text-[#00296E] dark:hover:text-white hover:bg-[#00296E]/[0.02] dark:hover:bg-white/5 border-l-[3px] border-transparent font-medium"
                  }`}
                >
                  <span>Absensi Kegiatan QR</span>
                  {activeTab === "absensi" && <span className="font-mono text-sm leading-none">&rarr;</span>}
                </button>
              )}

              {/* Rekapitulasi Presensi */}
              {canAccessTab(currentUserRole, "rekap-absensi") && (
                <button
                  type="button"
                  onClick={() => handleTabChange("rekap-absensi")}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs transition-colors cursor-pointer rounded-none ${
                    activeTab === "rekap-absensi"
                      ? "bg-[#00296E]/5 dark:bg-white/10 text-[#00296E] dark:text-[#38BDF8] font-bold border-l-[3px] border-[#00296E] dark:border-[#38BDF8]"
                      : "text-slate-600 dark:text-slate-400 hover:text-[#00296E] dark:hover:text-white hover:bg-[#00296E]/[0.02] dark:hover:bg-white/5 border-l-[3px] border-transparent font-medium"
                  }`}
                >
                  <span>Rekapitulasi Presensi</span>
                  {activeTab === "rekap-absensi" && <span className="font-mono text-sm leading-none">&rarr;</span>}
                </button>
              )}
            </nav>

            {/* SUBBAGIAN 4: Pengaturan & Mode, Supabase Database, Manajemen Pengguna, Audit Log Aktivitas */}
            <div className="px-5 pt-5 pb-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest font-poppins">
              04. SISTEM &amp; KEAMANAN
            </div>
            <nav className="space-y-0.5 px-3">
              {/* Pengaturan & Mode */}
              {canAccessTab(currentUserRole, "banner") && (
                <button
                  type="button"
                  onClick={() => handleTabChange("banner")}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs transition-colors cursor-pointer rounded-none ${
                    activeTab === "banner"
                      ? "bg-[#00296E]/5 dark:bg-white/10 text-[#00296E] dark:text-[#38BDF8] font-bold border-l-[3px] border-[#00296E] dark:border-[#38BDF8]"
                      : "text-slate-600 dark:text-slate-400 hover:text-[#00296E] dark:hover:text-white hover:bg-[#00296E]/[0.02] dark:hover:bg-white/5 border-l-[3px] border-transparent font-medium"
                  }`}
                >
                  <span>Pengaturan &amp; Mode</span>
                  {activeTab === "banner" && <span className="font-mono text-sm leading-none">&rarr;</span>}
                </button>
              )}

              {/* Supabase Database */}
              {canAccessTab(currentUserRole, "database") && (
                <button
                  type="button"
                  onClick={() => handleTabChange("database")}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs transition-colors cursor-pointer rounded-none ${
                    activeTab === "database"
                      ? "bg-[#00296E]/5 dark:bg-white/10 text-[#00296E] dark:text-[#38BDF8] font-bold border-l-[3px] border-[#00296E] dark:border-[#38BDF8]"
                      : "text-slate-600 dark:text-slate-400 hover:text-[#00296E] dark:hover:text-white hover:bg-[#00296E]/[0.02] dark:hover:bg-white/5 border-l-[3px] border-transparent font-medium"
                  }`}
                >
                  <span>Supabase Database</span>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                    {activeTab === "database" && <span className="font-mono text-sm leading-none">&rarr;</span>}
                  </div>
                </button>
              )}

              {/* Manajemen Pengguna */}
              {canAccessTab(currentUserRole, "users") && (
                <button
                  type="button"
                  onClick={() => handleTabChange("users")}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs transition-colors cursor-pointer rounded-none ${
                    activeTab === "users"
                      ? "bg-[#00296E]/5 dark:bg-white/10 text-[#00296E] dark:text-[#38BDF8] font-bold border-l-[3px] border-[#00296E] dark:border-[#38BDF8]"
                      : "text-slate-600 dark:text-slate-400 hover:text-[#00296E] dark:hover:text-white hover:bg-[#00296E]/[0.02] dark:hover:bg-white/5 border-l-[3px] border-transparent font-medium"
                  }`}
                >
                  <span>Manajemen Pengguna</span>
                  {activeTab === "users" && <span className="font-mono text-sm leading-none">&rarr;</span>}
                </button>
              )}

              {/* Audit Log Aktivitas */}
              {(currentUserRole === "super_admin" || currentUserRole === "bph") && canAccessTab(currentUserRole, "audit-log") && (
                <button
                  type="button"
                  onClick={() => handleTabChange("audit-log")}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs transition-colors cursor-pointer rounded-none ${
                    activeTab === "audit-log"
                      ? "bg-[#00296E]/5 dark:bg-white/10 text-[#00296E] dark:text-[#38BDF8] font-bold border-l-[3px] border-[#00296E] dark:border-[#38BDF8]"
                      : "text-slate-600 dark:text-slate-400 hover:text-[#00296E] dark:hover:text-white hover:bg-[#00296E]/[0.02] dark:hover:bg-white/5 border-l-[3px] border-transparent font-medium"
                  }`}
                >
                  <span>Audit Log Aktivitas</span>
                  {activeTab === "audit-log" && <span className="font-mono text-sm leading-none">&rarr;</span>}
                </button>
              )}
            </nav>
          </div>

          {/* Footer Sidebar: User & Links (Swiss Border-T) */}
          <div className="p-3 border-t border-[#00296E]/20 dark:border-white/10 space-y-1.5 bg-white dark:bg-[#001233]">
            <Link
              href="/"
              target="_blank"
              className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-[#00296E] dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5 transition-colors border border-transparent hover:border-[#00296E]/15 dark:hover:border-white/10"
            >
              <div className="flex items-center gap-2">
                <ArrowSquareOut className="w-3.5 h-3.5 text-slate-400" />
                <span>Web Utama</span>
              </div>
              <span className="font-mono text-[9px] text-slate-400"></span>
            </Link>

            {user ? (
              <div className="space-y-1 pt-1 border-t border-slate-100 dark:border-white/5">
                <div className="px-2 py-1 flex items-center justify-between">
                  <div className="min-w-0 pr-1">
                    <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate block">
                      {user.full_name?.split(" ")[0] || "Admin"}
                    </span>
                    <span className="text-[9px] font-mono text-slate-400 dark:text-slate-500 block truncate">
                      {user.email || ""}
                    </span>
                  </div>
                  <span className={`text-[9px] font-bold px-2 py-0.5 border ${ROLE_BADGE_STYLES[currentUserRole] || "bg-slate-100 text-slate-700"}`}>
                    {ROLE_LABELS[currentUserRole]?.split(" ")[0]}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-2.5 py-1 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                >
                  <SignOut className="w-3.5 h-3.5 text-rose-500" />
                  <span>Keluar Akun</span>
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-semibold text-[#00296E] dark:text-[#38BDF8] hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
              >
                <User className="w-3.5 h-3.5" />
                <span>Masuk Akun Pengurus</span>
              </Link>
            )}
          </div>
        </aside>

        {/* Mobile Backdrop */}
        {sidebarOpen && (
          <div
            className="no-print fixed inset-0 bg-black/60 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Area Konten Utama */}
        <main
          ref={mainContentRef}
          className="flex-1 flex flex-col min-w-0 overflow-y-auto max-h-[calc(100vh-56px)] bg-[#FAFBFC] dark:bg-[#001740] transition-colors duration-150 scroll-auto"
        >
          
          {/* Body Konten Sesuai Tab Terpilih */}
          <div key={activeTab} className="p-4 sm:p-5 xl:p-8 space-y-5 xl:space-y-6 w-full max-w-[1600px] 2xl:max-w-[1720px] mx-auto min-w-0">

            {/* TAB 1: OVERVIEW / RINGKASAN */}
            {activeTab === "overview" && (
              <OverviewManager
                beritaList={beritaList}
                aspirasiList={aspirasiList}
                kegiatanList={kegiatanList}
                absensiLogs={absensiLogs}
                studentPengurusList={studentPengurusList}
                activeKegiatan={activeKegiatan}
                setActiveKegiatan={setActiveKegiatan}
                onNavigateTab={handleTabChange}
                onOpenTambahKegiatan={() => setIsTambahKegiatanModalOpen(true)}
                onRequestDeleteKegiatan={setKegiatanToDelete}
                overviewAuditLogs={overviewAuditLogs}
                loadingOverviewAuditLogs={loadingOverviewAuditLogs}
                currentUserRole={currentUserRole}
                formatTanggalIndo={formatTanggalIndo}
                onRefresh={fetchOverviewAuditLogs}
              />
            )}

            {/* TAB 2: FITUR UTAMA - SCAN ABSENSI QR */}
            {activeTab === "absensi" && (
              <div className="space-y-5 animate-in fade-in duration-200">
                {/* Header Pemilihan Kegiatan & Tombol Tambah Kegiatan */}
                <div className="bg-white dark:bg-[#001438] p-4 sm:p-5 border border-[#00296E]/15 dark:border-white/10 shadow-none flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-base sm:text-lg font-semibold text-[#00296E] dark:text-white uppercase tracking-wider">
                      Scan QR Code Absensi Pengurus
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Pindai QR Code pengurus untuk verifikasi dan pencatatan presensi real-time.
                    </p>
                  </div>

                  {/* Tombol Tambah Kegiatan & Selector */}
                  <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0">
                    {/* Selector Kegiatan */}
                    {kegiatanList.length > 0 && activeKegiatan && (
                      <div className="relative">
                        <select
                          value={activeKegiatan.id}
                          onChange={(e) => {
                            const found = kegiatanList.find((k) => k.id === e.target.value);
                            if (found) setActiveKegiatan(found);
                          }}
                          className="pl-3 pr-8 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100 bg-white dark:bg-[#001740] rounded-none border border-[#00296E]/20 dark:border-white/20 cursor-pointer focus:outline-none focus:border-[#00296E] dark:focus:border-[#38BDF8]"
                        >
                          {kegiatanList.map((kegiatan) => (
                            <option key={kegiatan.id} value={kegiatan.id}>
                              {kegiatan.nama} ({kegiatan.jam})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Tombol Tambah Kegiatan Baru */}
                    <button
                      type="button"
                      onClick={() => setIsTambahKegiatanModalOpen(true)}
                      className="px-3.5 py-2 rounded-none bg-[#00296E] hover:bg-[#001f54] text-white text-xs font-semibold uppercase tracking-wider transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5 text-sky-300" />
                      <span>Tambah Kegiatan</span>
                    </button>

                    {/* Tombol Hapus Kegiatan Terpilih */}
                    {activeKegiatan && (
                      <button
                        type="button"
                        onClick={() => handleRequestDeleteKegiatan(activeKegiatan.id)}
                        className="px-3 py-2 rounded-none border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold uppercase tracking-wider transition-colors flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
                        title={`Hapus kegiatan "${activeKegiatan.nama}"`}
                      >
                        <Trash className="w-3.5 h-3.5" />
                        <span>Hapus</span>
                      </button>
                    )}
                  </div>
                </div>

                {!activeKegiatan || kegiatanList.length === 0 ? (
                  <div className="bg-white dark:bg-[#001438] border border-[#00296E]/15 dark:border-white/10 p-8 sm:p-12 text-center max-w-xl mx-auto shadow-none">
                    <div className="w-12 h-12 rounded-none border border-[#00296E]/15 dark:border-white/10 bg-[#00296E]/5 dark:bg-white/5 text-[#00296E] dark:text-[#38BDF8] flex items-center justify-center mx-auto mb-3">
                      <Scan className="w-6 h-6" />
                    </div>
                    <h3 className="text-base font-semibold text-[#00296E] dark:text-white uppercase tracking-wider">Belum Ada Kegiatan Absensi Aktif</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                      Buat agenda kegiatan baru untuk memulai pemindaian QR absensi pengurus.
                    </p>
                    <button
                      type="button"
                      onClick={() => setIsTambahKegiatanModalOpen(true)}
                      className="mt-4 px-4 py-2 rounded-none bg-[#00296E] hover:bg-[#001f54] text-white text-xs font-semibold uppercase tracking-wider transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 text-sky-300" />
                      <span>Tambah Kegiatan Baru</span>
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Banner Rincian Kegiatan Aktif */}
                    <div className="bg-white dark:bg-[#001438] border border-[#00296E]/15 dark:border-white/10 p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs shadow-none">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-none border border-[#00296E]/15 dark:border-white/10 bg-[#00296E]/5 dark:bg-white/5 text-[#00296E] dark:text-[#38BDF8] flex items-center justify-center shrink-0">
                          <CalendarBlank className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">
                            Kegiatan Dipindai:
                          </span>
                          <h4 className="font-semibold text-xs text-[#00296E] dark:text-white">
                            {activeKegiatan.nama}
                          </h4>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-slate-600 text-xs">
                        <div className="flex items-center gap-1.5 bg-[#00296E]/5 dark:bg-white/5 px-2.5 py-1 border border-[#00296E]/15 dark:border-white/10 text-slate-700 dark:text-slate-300 font-mono text-xs">
                          <CalendarBlank className="w-3.5 h-3.5 text-[#00296E] dark:text-[#38BDF8]" />
                          <span>{formatTanggalIndo(activeKegiatan.tanggal)}</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-[#00296E]/5 dark:bg-white/5 px-2.5 py-1 border border-[#00296E]/15 dark:border-white/10 text-slate-700 dark:text-slate-300 font-mono text-xs">
                          <Clock className="w-3.5 h-3.5 text-[#00296E] dark:text-[#38BDF8]" />
                          <span>{activeKegiatan.jam}</span>
                        </div>
                      </div>
                    </div>

                    {/* Komponen Kamera Scanner */}
                    <AdminQrScanner
                      kegiatanAktif={activeKegiatan.nama}
                      kegiatanTanggal={formatTanggalIndo(activeKegiatan.tanggal)}
                      kegiatanJam={activeKegiatan.jam}
                      onAttendanceSuccess={handleAttendanceSuccess}
                      pengurusList={studentPengurusList}
                      currentUserName={currentUserName}
                      currentUserRole={currentUserRole}
                    />
                  </>
                )}

                {/* Banner Akses Cepat ke Menu Rekap Absensi */}
                <div className="bg-white dark:bg-[#001438] border border-[#00296E]/15 dark:border-white/10 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shadow-none">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-none border border-[#00296E]/15 dark:border-white/10 bg-[#00296E]/5 dark:bg-white/5 text-[#00296E] dark:text-[#38BDF8] flex items-center justify-center shrink-0">
                      <FileXls className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-xs text-[#00296E] dark:text-white uppercase tracking-wider">
                        Presensi Terdata: <span className="font-mono text-emerald-600 dark:text-emerald-400">{currentLogs.length} Kehadiran</span>
                      </h4>
                      <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                        Tabel rekapitulasi kehadiran lengkap dan tombol cetak PDF resmi format kop surat dapat dibuka di Rekap Absensi.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleTabChange("rekap-absensi")}
                    className="px-3.5 py-2 rounded-none bg-[#00296E] hover:bg-[#001f54] text-white font-semibold text-xs uppercase tracking-wider shrink-0 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <span>Buka Rekap Absensi</span>
                    <CaretRight className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>
            )}

            {/* TAB BARU 3: REKAP ABSENSI (KOP SURAT & CETAK PDF) */}
            {activeTab === "rekap-absensi" && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <RekapAbsensiView
                  logs={absensiLogs}
                  kegiatanList={kegiatanList}
                  activeKegiatan={activeKegiatan}
                  onSelectKegiatan={setActiveKegiatan}
                  onOpenTambahModal={() => setIsTambahKegiatanModalOpen(true)}
                  onDeleteKegiatan={handleDeleteKegiatan}
                  onDeleteAbsensiLog={handleDeleteSingleAbsensiLog}
                  onResetAllAbsensiLogs={handleResetAllAbsensiLogs}
                  pengurusList={studentPengurusList}
                />
              </div>
            )}

            {/* TAB 4: KARTU QR CODE & IDENTITAS PENGURUS */}
            {activeTab === "kartu-qr" && (
              <div className="space-y-5 animate-in fade-in duration-200">
                
                {/* Header Kartu QR */}
                <div className="bg-white dark:bg-[#001438] p-4 sm:p-5 border border-[#00296E]/15 dark:border-white/10 shadow-none flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-base sm:text-lg font-semibold text-[#00296E] dark:text-white uppercase tracking-wider">
                      Kartu Identitas Digital &amp; QR Code Anggota
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Kelola identitas digital dan kode QR presensi untuk seluruh anggota pengurus.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-mono text-slate-700 dark:text-slate-300 bg-[#00296E]/5 dark:bg-white/5 px-2.5 py-1.5 border border-[#00296E]/15 dark:border-white/10">
                      TOTAL: <strong className="text-[#00296E] dark:text-white">{pengurusList.length} ANGGOTA</strong>
                    </span>

                    <button
                      type="button"
                      onClick={() => fetchPengurus()}
                      disabled={loadingPengurus}
                      className="p-2 rounded-none border border-[#00296E]/20 dark:border-white/20 bg-white dark:bg-[#001740] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer disabled:opacity-50 transition-colors"
                      title="Segarkan Data Pengurus dari Database"
                    >
                      <ArrowsClockwise
                        className={`w-4 h-4 text-slate-500 dark:text-slate-400 ${
                          loadingPengurus ? "animate-spin text-slate-800 dark:text-white" : ""
                        }`}
                      />
                    </button>

                    <button
                      type="button"
                      onClick={handleOpenTambahPengurus}
                      className="px-3.5 py-2 rounded-none bg-[#00296E] hover:bg-[#001f54] text-white text-xs font-semibold uppercase tracking-wider transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <UserPlus className="w-3.5 h-3.5 text-sky-300" />
                      <span>+ Tambah Anggota</span>
                    </button>
                  </div>
                </div>

                {/* Filter Divisi & Pencarian Pengurus */}
                <div className="bg-white dark:bg-[#001438] p-3.5 border border-[#00296E]/15 dark:border-white/10 shadow-none flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="Cari berdasarkan nama, NIM, atau jabatan pengurus..."
                      value={searchPengurus}
                      onChange={(e) => setSearchPengurus(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 text-xs rounded-none border border-[#00296E]/20 dark:border-white/20 bg-white dark:bg-[#001740] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#00296E] dark:focus:border-[#38BDF8]"
                    />
                    <MagnifyingGlass className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>

                  <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
                    {["SEMUA", ...DAFTAR_DIVISI].map((divisi) => (
                      <button
                        key={divisi}
                        type="button"
                        onClick={() => setDivisiFilterCard(divisi)}
                        className={`px-2.5 py-1.5 rounded-none text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer whitespace-nowrap ${
                          divisiFilterCard === divisi
                            ? "bg-[#00296E] dark:bg-[#38BDF8] text-white dark:text-[#001740] font-bold"
                            : "border border-[#00296E]/15 dark:border-white/10 bg-white dark:bg-[#001740] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5"
                        }`}
                      >
                        {divisi}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Grid Kartu Pengurus */}
                {filteredPengurusCards.length === 0 ? (
                  <div className="bg-white dark:bg-[#001438] border border-dashed border-[#00296E]/20 dark:border-white/20 p-12 text-center shadow-none">
                    <Users className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                    <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-200">Tidak Ada Anggota Ditemukan</h4>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-sm mx-auto">
                      Tidak ada peserta yang cocok dengan kata kunci atau filter divisi saat ini.
                    </p>
                    <button
                      type="button"
                      onClick={handleOpenTambahPengurus}
                      className="mt-3 px-3.5 py-2 rounded-none bg-[#00296E] hover:bg-[#001f54] text-white text-xs font-semibold uppercase tracking-wider inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <UserPlus className="w-3.5 h-3.5 text-sky-300" />
                      <span>Tambah Anggota</span>
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredPengurusCards.map((member) => (
                      <div
                        key={member.id}
                        className="bg-white dark:bg-[#001438] border border-[#00296E]/15 dark:border-white/10 p-4 shadow-none hover:border-[#00296E] dark:hover:border-[#38BDF8] transition-all flex flex-col justify-between group rounded-none"
                      >
                        <div>
                          {/* Member Thumbnail & Info */}
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-none overflow-hidden bg-slate-100 dark:bg-white/5 border border-[#00296E]/15 dark:border-white/10 shrink-0">
                              <img
                                src={member.image}
                                alt={member.nama}
                                className="w-full h-full object-cover object-top"
                                onError={(e) => {
                                  (e.currentTarget as HTMLImageElement).src = "/DSC01203.png";
                                }}
                              />
                            </div>
                            <div className="overflow-hidden flex-1">
                              <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded-none border border-[#00296E]/15 dark:border-white/10 bg-[#00296E]/5 dark:bg-white/5 text-[#00296E] dark:text-[#38BDF8]">
                                {member.divisi}
                              </span>
                              <h4 className="text-xs font-semibold text-slate-900 dark:text-white truncate mt-1">
                                {member.nama}
                              </h4>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{member.jabatan}</p>
                            </div>
                          </div>

                          {/* Token & NIM Tag */}
                          <div className="mt-3 pt-2 border-t border-[#00296E]/10 dark:border-white/10 flex items-center justify-between text-[11px] font-mono">
                            <span className="text-slate-400 dark:text-slate-500">NIM:</span>
                            <span className="font-medium text-slate-700 dark:text-slate-300">{member.nim}</span>
                          </div>
                        </div>

                        {/* Action Buttons: Lihat Card, Edit, Hapus */}
                        <div className="mt-3 space-y-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedPengurusCard(member)}
                            className="w-full py-1.5 rounded-none bg-[#00296E] hover:bg-[#001f54] text-white text-xs font-semibold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <QrCode className="w-3.5 h-3.5 text-sky-300" />
                            <span>Lihat ID Card &amp; QR</span>
                          </button>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEditPengurus(member)}
                              className="flex-1 py-1.5 px-2 rounded-none bg-white dark:bg-[#001740] hover:bg-slate-50 dark:hover:bg-white/5 text-slate-700 dark:text-slate-200 text-[11px] font-semibold uppercase tracking-wider transition-colors flex items-center justify-center gap-1 cursor-pointer border border-[#00296E]/20 dark:border-white/20"
                              title="Edit Data Anggota"
                            >
                              <NotePencil className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                              <span>Edit</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleRequestDeletePengurus(member)}
                              className="py-1.5 px-2 rounded-none bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-[11px] font-semibold uppercase tracking-wider transition-colors flex items-center justify-center gap-1 cursor-pointer border border-rose-500/20"
                              title="Hapus Anggota"
                            >
                              <Trash className="w-3 h-3" />
                              <span>Hapus</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

              </div>
            )}

            {/* TAB DOKUMEN ORGANISASI */}
            {activeTab === "dokumen" && (
              <DokumenManager currentUserRole={currentUserRole} currentUserName={currentUserName} />
            )}

            {/* TAB PERSURATAN & PENOMORAN OTOMATIS */}
            {activeTab === "persuratan" && (
              <PersuratanManager currentUserRole={currentUserRole} currentUserName={currentUserName} />
            )}

            {/* TAB CONTENT PLANNER */}
            {activeTab === "content-planner" && (
              <ContentPlannerManager currentUserRole={currentUserRole} currentUserName={currentUserName} />
            )}

            {/* TAB 5: ASPIRASI MAHASISWA */}
            {activeTab === "aspirasi" && (
              <AspirasiManager currentUserRole={currentUserRole} currentUserName={currentUserName} />
            )}

            {/* TAB APRESIA-SI (KARYA, PRESTASI & SUBMISI MAHASISWA) */}
            {activeTab === "apresiasi" && (
              <ApresiasiManager currentUserRole={currentUserRole} currentUserName={currentUserName} />
            )}

            {/* TAB 6: BERITA CRUD MANAGEMENT */}
            {activeTab === "berita" && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <DashboardPageHeader
                  title="Manajemen Berita"
                  subtitle="Kelola rilis berita, artikel ilmiah, dan dokumentasi kegiatan HIMASI Atma Luhur."
                  onRefresh={() => fetchBerita()}
                  refreshLoading={loadingBerita}
                  publicUrl="/berita"
                  publicLabel="Lihat Halaman Publik"
                  primaryAction={{
                    label: "+ Tulis Berita Baru",
                    onClick: handleOpenTambahBerita,
                  }}
                />

                <DashboardMetricStrip
                  metrics={[
                    {
                      order: "01.",
                      label: "TOTAL BERITA",
                      value: beritaList.length,
                      sublabel: "Artikel",
                      icon: <Newspaper className="w-4 h-4" />,
                      loading: loadingBerita,
                    },
                    {
                      order: "02.",
                      label: "BERITA TERBIT",
                      value: beritaList.filter((b) => b.is_published).length,
                      sublabel: "Publik",
                      variant: "success",
                      icon: <CheckCircle className="w-4 h-4" />,
                      loading: loadingBerita,
                    },
                    {
                      order: "03.",
                      label: "DRAF TERSIMPAN",
                      value: beritaList.filter((b) => !b.is_published).length,
                      sublabel: "Draf",
                      variant: "warning",
                      icon: <Clock className="w-4 h-4" />,
                      loading: loadingBerita,
                    },
                  ]}
                />

                {/* Filter & Search Bar */}
                <div className="bg-white dark:bg-[#001438] p-3.5 border border-[#00296E]/15 dark:border-white/10 shadow-none flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="Cari berdasarkan judul, penulis, atau isi berita..."
                      value={searchBerita}
                      onChange={(e) => setSearchBerita(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 text-xs rounded-none border border-[#00296E]/20 dark:border-white/20 bg-white dark:bg-[#001740] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#00296E] dark:focus:border-[#38BDF8]"
                    />
                    <MagnifyingGlass className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {/* Category Filter */}
                    <div className="flex items-center gap-1 overflow-x-auto">
                      <button
                        type="button"
                        onClick={() => setKategoriFilterBerita("semua")}
                        className={`px-2.5 py-1.5 rounded-none text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer whitespace-nowrap ${
                          kategoriFilterBerita === "semua"
                            ? "bg-[#00296E] dark:bg-[#38BDF8] text-white dark:text-[#001740] font-bold"
                            : "border border-[#00296E]/15 dark:border-white/10 bg-white dark:bg-[#001740] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5"
                        }`}
                      >
                        Semua Kategori
                      </button>
                      {KATEGORI_BERITA.map((k) => (
                        <button
                          key={k.key}
                          type="button"
                          onClick={() => setKategoriFilterBerita(k.key)}
                          className={`px-2.5 py-1.5 rounded-none text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer whitespace-nowrap ${
                            kategoriFilterBerita === k.key
                              ? "bg-[#00296E] dark:bg-[#38BDF8] text-white dark:text-[#001740] font-bold"
                              : "border border-[#00296E]/15 dark:border-white/10 bg-white dark:bg-[#001740] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5"
                          }`}
                        >
                          {k.label}
                        </button>
                      ))}
                    </div>

                    {/* Status Filter */}
                    <div className="h-5 w-px bg-[#00296E]/15 dark:bg-white/10 hidden sm:block mx-1" />

                    <div className="flex items-center gap-1">
                      {["semua", "terbit", "draft"].map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => setStatusFilterBerita(st)}
                          className={`px-2.5 py-1.5 rounded-none text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer ${
                            statusFilterBerita === st
                              ? "bg-slate-800 dark:bg-white text-white dark:text-[#001740] font-bold"
                              : "border border-[#00296E]/15 dark:border-white/10 bg-white dark:bg-[#001740] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5"
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Table Data (Desktop & Tablet) */}
                <div className="bg-white dark:bg-[#001438] border border-[#00296E]/15 dark:border-white/10 overflow-hidden shadow-none">
                  {loadingBerita ? (
                    <div className="p-12 text-center">
                      <ArrowsClockwise className="w-6 h-6 text-slate-400 animate-spin mx-auto mb-2" />
                      <p className="text-xs text-slate-400">Memuat data berita...</p>
                    </div>
                  ) : filteredBeritaList.length === 0 ? (
                    <div className="p-12 text-center">
                      <Newspaper className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">Tidak ada artikel berita ditemukan</h3>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 max-w-sm mx-auto">
                        Coba sesuaikan kata kunci pencarian atau klik &quot;+ Tulis Berita Baru&quot; untuk menerbitkan Berita.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-[#FAFBFC] dark:bg-[#00102B] border-b border-[#00296E]/15 dark:border-white/10 text-[10px] font-bold uppercase tracking-widest text-[#00296E] dark:text-slate-300">
                              <th className="py-2.5 px-3 w-12 text-center">No</th>
                              <th className="py-2.5 px-4 min-w-[280px]">Artikel &amp; Slug</th>
                              <th className="py-2.5 px-3 min-w-[130px]">Kategori</th>
                              <th className="py-2.5 px-3 min-w-[130px]">Penulis</th>
                              <th className="py-2.5 px-3 text-center min-w-[110px]">Status</th>
                              <th className="py-2.5 px-3 min-w-[110px]">Tanggal</th>
                              <th className="py-2.5 px-4 text-right min-w-[130px]">Aksi</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#00296E]/10 dark:divide-white/10">
                            {filteredBeritaList.map((item, idx) => (
                              <tr key={item.id} className="hover:bg-[#00296E]/[0.02] dark:hover:bg-white/[0.03] transition-colors">
                                <td className="py-3 px-3 text-center text-slate-400 dark:text-slate-500 font-mono text-[11px]">
                                  {idx + 1}
                                </td>
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-12 h-10 rounded-none overflow-hidden bg-slate-100 dark:bg-white/5 border border-[#00296E]/15 dark:border-white/10 shrink-0">
                                      <img
                                        src={item.image_url}
                                        alt={item.title}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                          (e.currentTarget as HTMLImageElement).src = "/DSC01203.png";
                                        }}
                                      />
                                    </div>
                                    <div className="overflow-hidden">
                                      <Link
                                        href={`/berita/${item.slug}`}
                                        target="_blank"
                                        className="font-semibold text-slate-900 dark:text-white hover:text-[#00296E] dark:hover:text-[#38BDF8] hover:underline line-clamp-1 block text-xs"
                                        title={item.title}
                                      >
                                        {item.title}
                                      </Link>
                                      <p className="text-[10px] font-mono text-slate-400 dark:text-slate-500 mt-0.5 truncate">
                                        /berita/{item.slug}
                                      </p>
                                      {item.status === "rejected" && item.catatan_revisi && (
                                        <div className="mt-1 px-2 py-0.5 rounded-none bg-rose-500/10 border border-rose-500/20 text-[10px] text-rose-700 dark:text-rose-400 leading-tight font-mono">
                                          <strong>Catatan Revisi:</strong> {item.catatan_revisi}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </td>
                                <td className="py-3 px-3">
                                  <span className="px-2 py-0.5 rounded-none text-[10px] font-mono uppercase bg-[#00296E]/5 dark:bg-white/5 border border-[#00296E]/15 dark:border-white/10 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                                    {item.category_label}
                                  </span>
                                </td>
                                <td className="py-3 px-3 text-slate-700 dark:text-slate-300 font-medium">
                                  <span className="truncate block max-w-[120px]">{item.author}</span>
                                </td>
                                <td className="py-3 px-3 text-center">
                                  {item.status === "pending_review" ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-none text-[10px] font-mono uppercase border border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400">
                                      <Clock className="w-3 h-3 text-amber-500" />
                                      Menunggu ACC
                                    </span>
                                  ) : item.status === "rejected" ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-none text-[10px] font-mono uppercase border border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-400">
                                      <XCircle className="w-3 h-3 text-rose-500" />
                                      Perlu Revisi
                                    </span>
                                  ) : (
                                    <button
                                      type="button"
                                      disabled={!canPublishContent(currentUserRole)}
                                      onClick={() => handleQuickToggleBeritaStatus(item)}
                                      className={`px-2 py-0.5 rounded-none text-[10px] font-mono uppercase transition-colors ${
                                        canPublishContent(currentUserRole) ? "cursor-pointer" : "cursor-default opacity-90"
                                      } ${
                                        item.is_published
                                          ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20"
                                          : "bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 hover:bg-slate-200 border border-slate-200 dark:border-white/10"
                                      }`}
                                      title={canPublishContent(currentUserRole) ? "Klik untuk mengubah status Terbit / Draft" : "Status publikasi dikelola Medkominfo"}
                                    >
                                      {item.is_published ? "● Terbit" : "○ Draft"}
                                    </button>
                                  )}
                                </td>
                                <td className="py-3 px-3 text-slate-500 dark:text-slate-400 font-mono text-[11px] whitespace-nowrap">
                                  {new Date(item.published_at).toLocaleDateString("id-ID", {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                  })}
                                </td>
                                <td className="py-3 px-4 text-right">
                                  <div className="flex items-center justify-end gap-1">
                                    {/* Tombol Approval Cepat Medkominfo & Super Admin */}
                                    {canPublishContent(currentUserRole) && item.status === "pending_review" && (
                                      <>
                                        <button
                                          type="button"
                                          onClick={() => handleApproveBerita(item)}
                                          className="px-2 py-1 rounded-none bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-semibold uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1"
                                          title="Setujui dan Terbitkan Sekarang"
                                        >
                                          <Check className="w-3 h-3 stroke-[3]" />
                                          <span>Setujui</span>
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setRejectingBeritaItem(item);
                                            setCatatanRevisiBerita(item.catatan_revisi || "");
                                          }}
                                          className="px-2 py-1 rounded-none border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-[10px] font-semibold uppercase tracking-wider transition-colors cursor-pointer"
                                          title="Tolak dengan Catatan Revisi"
                                        >
                                          <X className="w-3 h-3" />
                                          <span>Tolak</span>
                                        </button>
                                      </>
                                    )}

                                    <Link
                                      href={`/berita/${item.slug}`}
                                      target="_blank"
                                      className="p-1.5 rounded-none text-slate-500 hover:text-[#00296E] dark:hover:text-[#38BDF8] hover:bg-[#00296E]/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                                      title="Buka halaman baca publik"
                                    >
                                      <ArrowSquareOut className="w-3.5 h-3.5" />
                                    </Link>
                                    {(canEditPublishedContent(currentUserRole) || (!item.is_published && item.status !== "published")) ? (
                                      <button
                                        type="button"
                                        onClick={() => handleOpenEditBerita(item)}
                                        className="p-1.5 rounded-none text-slate-600 dark:text-slate-300 hover:text-[#00296E] dark:hover:text-[#38BDF8] hover:bg-[#00296E]/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                                        title="Edit Berita"
                                      >
                                        <NotePencil className="w-3.5 h-3.5" />
                                      </button>
                                    ) : null}
                                    {(canEditPublishedContent(currentUserRole) || (!item.is_published && item.status !== "published")) ? (
                                      <button
                                        type="button"
                                        onClick={() => setBeritaToDelete(item)}
                                        className="p-1.5 rounded-none text-slate-400 hover:text-rose-600 hover:bg-rose-500/10 transition-colors cursor-pointer"
                                        title="Hapus Berita"
                                      >
                                        <Trash className="w-3.5 h-3.5" />
                                      </button>
                                    ) : (
                                      <span className="text-[10px] font-mono text-slate-400 px-2 py-0.5 rounded-none bg-slate-100 dark:bg-white/5 uppercase">
                                        Terkurasi
                                      </span>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Responsive Card Format for Mobile */}
                      <div className="md:hidden p-3 divide-y divide-slate-100 space-y-3">
                        {filteredBeritaList.map((item) => (
                          <div key={item.id} className="pt-3 first:pt-0">
                            <div className="flex items-start gap-2.5">
                              <div className="w-16 h-14 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                                <img
                                  src={item.image_url}
                                  alt={item.title}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (e.currentTarget as HTMLImageElement).src = "/DSC01203.png";
                                  }}
                                />
                              </div>
                              <div className="flex-1 overflow-hidden">
                                <div className="flex items-center justify-between gap-1 mb-1">
                                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                                    {item.category_label}
                                  </span>
                                  {item.status === "pending_review" ? (
                                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700">
                                      Menunggu ACC
                                    </span>
                                  ) : item.status === "rejected" ? (
                                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-rose-50 text-rose-700">
                                      Perlu Revisi
                                    </span>
                                  ) : (
                                    <button
                                      type="button"
                                      disabled={!canPublishContent(currentUserRole)}
                                      onClick={() => handleQuickToggleBeritaStatus(item)}
                                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                                        item.is_published
                                          ? "bg-emerald-50 text-emerald-700"
                                          : "bg-slate-100 text-slate-500"
                                      }`}
                                    >
                                      {item.is_published ? "Terbit" : "Draft"}
                                    </button>
                                  )}
                                </div>
                                <h4 className="text-xs font-bold text-slate-900 line-clamp-2">
                                  {item.title}
                                </h4>
                                {item.status === "rejected" && item.catatan_revisi && (
                                  <p className="text-[10px] text-rose-600 mt-0.5 font-medium">
                                    Revisi: {item.catatan_revisi}
                                  </p>
                                )}
                                <p className="text-[10px] text-slate-400 mt-0.5">
                                  {item.author} &bull; {new Date(item.published_at).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                                </p>
                              </div>
                            </div>

                            <div className="mt-2.5 pt-2 border-t border-slate-50 flex items-center justify-end gap-1.5">
                              {canPublishContent(currentUserRole) && item.status === "pending_review" && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleApproveBerita(item)}
                                    className="px-2 py-1 rounded bg-emerald-600 text-white text-[10px] font-bold flex items-center gap-1"
                                  >
                                    <Check className="w-3 h-3 stroke-[3]" />
                                    <span>Setujui</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setRejectingBeritaItem(item);
                                      setCatatanRevisiBerita(item.catatan_revisi || "");
                                    }}
                                    className="px-2 py-1 rounded border border-rose-200 text-rose-600 text-[10px] font-bold"
                                  >
                                    Tolak
                                  </button>
                                </>
                              )}
                              <Link
                                href={`/berita/${item.slug}`}
                                target="_blank"
                                className="px-2.5 py-1 rounded bg-slate-100 text-slate-700 text-[10px] font-semibold flex items-center gap-1"
                              >
                                <ArrowSquareOut className="w-3 h-3" />
                                <span>Lihat</span>
                              </Link>
                              {(canEditPublishedContent(currentUserRole) || (!item.is_published && item.status !== "published")) && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditBerita(item)}
                                    className="px-2.5 py-1 rounded bg-slate-100 text-slate-700 text-[10px] font-semibold flex items-center gap-1"
                                  >
                                    <NotePencil className="w-3 h-3" />
                                    <span>Edit</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setBeritaToDelete(item)}
                                    className="p-1 rounded text-rose-500 hover:bg-rose-50"
                                  >
                                    <Trash className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* TAB 7: KALENDER AGENDA TERPADU (DUAL-PANE MASTER-DETAIL) */}
            {activeTab === "kalender" && (
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* Header Kalender Dashboard */}
                <div className="bg-white dark:bg-[#001438] p-4 sm:p-5 border border-[#00296E]/15 dark:border-white/10 shadow-none flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-none bg-[#00296E]/5 dark:bg-white/5 text-[#00296E] dark:text-[#38BDF8] flex items-center justify-center border border-[#00296E]/15 dark:border-white/10 shrink-0">
                      <CalendarBlank className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base sm:text-lg font-semibold text-[#00296E] dark:text-white uppercase tracking-wider flex items-center gap-2">
                        <span>Kalender Agenda Organisasi & Kampus</span>
                        <span className="px-2 py-0.5 rounded-none text-[10px] font-mono border border-[#00296E]/20 dark:border-sky-400/30 bg-[#00296E]/5 dark:bg-sky-500/10 text-[#00296E] dark:text-[#38BDF8]">
                          {agendaList.length} AGENDAS
                        </span>
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Kelola jadwal kegiatan HIMASI, agenda akademik kampus, dan hari libur nasional secara terpusat.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full md:w-auto">
                    <button
                      type="button"
                      onClick={() => fetchAgendaList()}
                      disabled={loadingAgenda}
                      className="p-2.5 rounded-none border border-[#00296E]/20 dark:border-white/20 bg-white dark:bg-[#001740] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer disabled:opacity-50 transition-colors shadow-none"
                      title="Segarkan Data Kalender"
                    >
                      <ArrowsClockwise className={`w-4 h-4 ${loadingAgenda ? "animate-spin text-[#00296E] dark:text-[#38BDF8]" : ""}`} />
                    </button>
                    <Link
                      href="/kalender"
                      target="_blank"
                      className="px-3.5 py-2.5 rounded-none border border-[#00296E]/20 dark:border-white/20 bg-white dark:bg-[#001740] hover:bg-slate-50 dark:hover:bg-white/5 text-slate-700 dark:text-slate-200 text-xs font-semibold uppercase tracking-wider transition-colors shadow-none flex items-center gap-1.5"
                    >
                      <ArrowSquareOut className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                      <span>Halaman Publik</span>
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleOpenTambahAgenda()}
                      className="flex-1 md:flex-none px-4 py-2.5 rounded-none bg-[#00296E] hover:bg-[#001f54] text-white text-xs font-semibold uppercase tracking-wider transition-colors shadow-none flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-4 h-4 text-sky-300" />
                      <span>+ Tambah Acara</span>
                    </button>
                  </div>
                </div>

                {/* DUAL-PANE CONTAINER: KALENDER VISUAL (KIRI) & PANEL DETAIL HARI TERPILIH (KANAN) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  {/* SISI KIRI: KALENDER BULANAN INTERAKTIF (7 KOLOM) */}
                  <div className="lg:col-span-7 bg-white dark:bg-[#001438] p-5 sm:p-6 border border-[#00296E]/15 dark:border-white/10 shadow-none">
                    {/* Header Navigasi Bulan */}
                    <div className="flex items-center justify-between pb-4 border-b border-[#00296E]/10 dark:border-white/10 mb-4">
                      <div>
                        <h3 className="text-base sm:text-lg font-semibold text-[#00296E] dark:text-white uppercase tracking-wider">
                          {NAMA_BULAN_ID[adminCalMonth]} {adminCalYear}
                        </h3>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 font-mono mt-0.5">
                          Klik tanggal untuk melihat atau menambahkan agenda
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={handleAdminToday}
                          className="px-2.5 py-1.5 rounded-none border border-[#00296E]/20 dark:border-white/20 bg-white dark:bg-[#001740] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 text-[11px] font-mono uppercase tracking-wider transition-colors cursor-pointer"
                        >
                          Hari Ini
                        </button>
                        <button
                          type="button"
                          onClick={handleAdminPrevMonth}
                          className="p-1.5 rounded-none border border-[#00296E]/20 dark:border-white/20 bg-white dark:bg-[#001740] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer transition-colors"
                          title="Bulan Sebelumnya"
                        >
                          <CaretLeft className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={handleAdminNextMonth}
                          className="p-1.5 rounded-none border border-[#00296E]/20 dark:border-white/20 bg-white dark:bg-[#001740] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer transition-colors"
                          title="Bulan Selanjutnya"
                        >
                          <CaretRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Legend / Keterangan Kategori */}
                    <div className="flex items-center gap-4 py-2 px-3 mb-3 bg-[#00296E]/5 dark:bg-white/5 border border-[#00296E]/10 dark:border-white/10 text-[11px] font-mono text-slate-600 dark:text-slate-300 flex-wrap">
                      <span className="text-slate-400 font-bold uppercase">Kategori:</span>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 bg-[#1E88E5]" />
                        <span>HIMASI</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 bg-[#F2B705]" />
                        <span>Akademik</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 bg-[#8E24AA]" />
                        <span>Libur</span>
                      </div>
                    </div>

                    {/* Hari Singkat (Sen - Min) */}
                    <div className="grid grid-cols-7 gap-1 text-center font-mono uppercase text-xs text-slate-400 dark:text-slate-500 mb-2">
                      {HARI_SINGKAT.map((h) => (
                        <div key={h} className="py-1">
                          {h}
                        </div>
                      ))}
                    </div>

                    {/* Grid Sel Kalender */}
                    <div className="grid grid-cols-7 gap-1.5">
                      {adminCalendarCells.map((cell, idx) => {
                        const isDiffMonth = cell.monthOffset !== 0;
                        const isSelected = cell.fullDate === adminSelectedDate;

                        return (
                          <div
                            key={idx}
                            onClick={() => {
                              if (cell.monthOffset === -1) handleAdminPrevMonth();
                              if (cell.monthOffset === 1) handleAdminNextMonth();
                              setAdminSelectedDate(cell.fullDate);
                            }}
                            className={`min-h-[72px] sm:min-h-[82px] p-2 border transition-colors cursor-pointer flex flex-col justify-between ${
                              isSelected
                                ? "bg-[#00296E]/10 dark:bg-white/10 border-2 border-[#00296E] dark:border-[#38BDF8]"
                                : cell.isToday
                                ? "bg-amber-500/10 border-amber-400 dark:border-amber-500/50"
                                : isDiffMonth
                                ? "bg-slate-50/40 dark:bg-white/[0.02] border-[#00296E]/5 dark:border-white/5 opacity-30 hover:opacity-70"
                                : "bg-white dark:bg-[#001438] border-[#00296E]/15 dark:border-white/10 hover:border-[#00296E] dark:hover:border-[#38BDF8]"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span
                                className={`text-xs font-mono leading-none ${
                                  isSelected
                                    ? "text-[#00296E] dark:text-[#38BDF8] font-bold"
                                    : cell.isToday
                                    ? "text-amber-700 dark:text-amber-400 font-bold"
                                    : "text-slate-700 dark:text-slate-300 font-medium"
                                }`}
                              >
                                {cell.dayNumber}
                              </span>
                              {cell.isToday && (
                                <span className="w-1.5 h-1.5 bg-amber-500" title="Hari Ini" />
                              )}
                            </div>

                            {/* Dots Indikator Agenda */}
                            <div className="flex items-center gap-1 flex-wrap mt-1">
                              {cell.events.slice(0, 3).map((e) => {
                                const meta = getCategoryMeta(e.kategori);
                                return (
                                  <span
                                    key={e.id}
                                    className={`w-2 h-2 ${meta.dot}`}
                                    title={`${e.judul} (${meta.label})`}
                                  />
                                );
                              })}
                              {cell.events.length > 3 && (
                                <span className="text-[9px] font-mono text-slate-400 leading-none">
                                  +{cell.events.length - 3}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* SISI KANAN: PANEL DETAIL HARI TERPILIH (5 KOLOM) */}
                  <div className="lg:col-span-5 bg-white dark:bg-[#001438] p-5 sm:p-6 border border-[#00296E]/15 dark:border-white/10 shadow-none space-y-4">
                    {/* Header Panel Tanggal */}
                    <div className="flex items-center justify-between pb-3 border-b border-[#00296E]/10 dark:border-white/10">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-none bg-[#00296E]/5 dark:bg-white/5 text-[#00296E] dark:text-[#38BDF8] flex items-center justify-center shrink-0 border border-[#00296E]/15 dark:border-white/10">
                          <CalendarBlank className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-[10px] font-mono uppercase tracking-wider text-slate-400 dark:text-slate-500">Agenda Tanggal:</h4>
                          <p className="text-sm font-semibold text-[#00296E] dark:text-white">
                            {formatTanggalIndoFull(adminSelectedDate)}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleOpenTambahAgenda(adminSelectedDate)}
                        className="px-3 py-1.5 rounded-none bg-[#00296E] hover:bg-[#001f54] text-white text-[11px] font-semibold uppercase tracking-wider transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5 text-sky-300" />
                        <span>Tambah</span>
                      </button>
                    </div>

                    {/* Daftar Acara pada Hari Terpilih */}
                    {selectedDateEvents.length === 0 ? (
                      <div className="py-12 px-4 bg-[#00296E]/5 dark:bg-white/5 border border-dashed border-[#00296E]/15 dark:border-white/10 text-center flex flex-col items-center justify-center">
                        <div className="w-12 h-12 rounded-none bg-white dark:bg-[#001740] border border-[#00296E]/15 dark:border-white/10 text-slate-400 dark:text-slate-500 flex items-center justify-center mb-3">
                          <CalendarBlank className="w-6 h-6" />
                        </div>
                        <h5 className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                          Tidak ada agenda di tanggal ini
                        </h5>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 max-w-xs mt-1">
                          Belum ada kegiatan organisasi HIMASI, agenda akademik kampus, maupun libur nasional yang dijadwalkan.
                        </p>
                        <button
                          type="button"
                          onClick={() => handleOpenTambahAgenda(adminSelectedDate)}
                          className="mt-4 px-4 py-2 rounded-none bg-[#00296E] hover:bg-[#001f54] text-white text-xs font-semibold uppercase tracking-wider transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5 text-sky-300" />
                          <span>Buat Acara di Hari Ini</span>
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-[560px] overflow-y-auto pr-1">
                        {selectedDateEvents.map((event) => {
                          const meta = getCategoryMeta(event.kategori);
                          const isMultiDay = Boolean(
                            event.tanggal_selesai && event.tanggal_selesai !== event.tanggal_mulai
                          );

                          return (
                            <div
                              key={event.id}
                              className={`p-4 border ${meta.border} bg-white dark:bg-[#001740] shadow-none transition-colors flex flex-col justify-between gap-3`}
                            >
                              <div>
                                <div className="flex items-center justify-between gap-2 mb-1.5">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span
                                      className={`px-2 py-0.5 rounded-none text-[10px] font-mono uppercase tracking-wider ${meta.bgBadge} ${meta.textBadge}`}
                                    >
                                      {meta.label}
                                    </span>
                                    {event.status === "pending_review" && (
                                      <span className="text-[10px] font-mono uppercase text-amber-700 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 border border-amber-500/20">
                                        Menunggu ACC
                                      </span>
                                    )}
                                    {event.status === "rejected" && (
                                      <span className="text-[10px] font-mono uppercase text-rose-700 dark:text-rose-400 bg-rose-500/10 px-2 py-0.5 border border-rose-500/20">
                                        Ditolak
                                      </span>
                                    )}
                                  </div>

                                  {isMultiDay && (
                                    <span className="text-[10px] font-mono uppercase text-indigo-700 dark:text-indigo-400 bg-indigo-500/10 px-2 py-0.5 border border-indigo-500/20">
                                      Rentang Hari
                                    </span>
                                  )}
                                </div>

                                <h5 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white leading-snug">
                                  {event.judul}
                                </h5>

                                <div className="mt-2 space-y-1 text-[11px] font-mono text-slate-500 dark:text-slate-400">
                                  {isMultiDay && (
                                    <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
                                      <CalendarBlank className="w-3.5 h-3.5 shrink-0" />
                                      <span>
                                        {event.tanggal_mulai} s/d {event.tanggal_selesai}
                                      </span>
                                    </div>
                                  )}
                                  <div className="flex items-center gap-1.5">
                                    <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                    <span>{event.waktu}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                    <span className="truncate">{event.lokasi}</span>
                                  </div>
                                </div>

                                {event.deskripsi && (
                                  <p className="mt-2 text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed bg-[#00296E]/5 dark:bg-white/5 p-2 border border-[#00296E]/10 dark:border-white/10">
                                    {event.deskripsi}
                                  </p>
                                )}
                              </div>

                              <div className="pt-2.5 border-t border-[#00296E]/10 dark:border-white/10 flex items-center justify-end gap-1.5">
                                {canPublishContent(currentUserRole) && event.status === "pending_review" && (
                                  <button
                                    type="button"
                                    onClick={() => handleApproveAgenda(event)}
                                    className="px-2.5 py-1.5 rounded-none bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold uppercase tracking-wider transition-colors flex items-center gap-1 cursor-pointer"
                                  >
                                    <Check className="w-3 h-3 stroke-[3]" />
                                    <span>Setujui Agenda</span>
                                  </button>
                                )}
                                {(canEditPublishedContent(currentUserRole) || event.status !== "published") ? (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => handleOpenEditAgenda(event)}
                                      className="px-2.5 py-1.5 rounded-none border border-[#00296E]/20 dark:border-white/20 bg-white dark:bg-[#001740] hover:bg-slate-50 dark:hover:bg-white/5 text-slate-700 dark:text-slate-200 text-[11px] font-semibold uppercase tracking-wider transition-colors flex items-center gap-1 cursor-pointer"
                                    >
                                      <NotePencil className="w-3 h-3 text-[#00296E] dark:text-[#38BDF8]" />
                                      <span>Edit</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setAgendaToDelete(event)}
                                      className="px-2.5 py-1.5 rounded-none border border-rose-500/20 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-[11px] font-semibold uppercase tracking-wider transition-colors flex items-center gap-1 cursor-pointer"
                                    >
                                      <Trash className="w-3 h-3" />
                                      <span>Hapus</span>
                                    </button>
                                  </>
                                ) : (
                                  <span className="text-[10px] font-mono text-slate-400 px-2 py-1 bg-[#00296E]/5 dark:bg-white/5 border border-[#00296E]/10 dark:border-white/10 uppercase">
                                    Terkurasi Medkominfo
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 8: SUPABASE DATABASE HUB */}
            {activeTab === "database" && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div className="bg-white dark:bg-[#001438] p-4 sm:p-5 border border-[#00296E]/15 dark:border-white/10 shadow-none flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-none bg-[#00296E]/5 dark:bg-white/5 text-[#00296E] dark:text-[#38BDF8] flex items-center justify-center shrink-0 border border-[#00296E]/15 dark:border-white/10">
                      <Database className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-base font-semibold text-[#00296E] dark:text-white uppercase tracking-wider flex items-center gap-2">
                        <span>Database PostgreSQL Supabase</span>
                        <span className="px-2 py-0.5 rounded-none text-[10px] font-mono border border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                          TERKONEKSI
                        </span>
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Proyek: <code className="font-mono text-slate-800 dark:text-slate-200 bg-[#00296E]/5 dark:bg-white/5 px-1.5 py-0.5 border border-[#00296E]/15 dark:border-white/10">{supabaseProjectId}</code> &bull; Region: Southeast Asia
                      </p>
                    </div>
                  </div>

                  <a
                    href={`https://supabase.com/dashboard/project/${supabaseProjectId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-none bg-[#00296E] hover:bg-[#001f54] text-white text-xs font-semibold uppercase tracking-wider transition-colors shadow-none cursor-pointer"
                  >
                    <span>Buka Supabase Dashboard</span>
                    <ArrowSquareOut className="w-3.5 h-3.5" />
                  </a>
                </div>

                <div className="bg-white dark:bg-[#001438] p-4 sm:p-5 border border-[#00296E]/15 dark:border-white/10 shadow-none space-y-3">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-xs text-[#00296E] dark:text-white uppercase tracking-wider flex items-center gap-2">
                        <FileCode className="w-3.5 h-3.5 text-[#00296E] dark:text-[#38BDF8]" />
                        <span>Skrip SQL Schema Database (schema.sql)</span>
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Jalankan skrip ini di SQL Editor Supabase untuk membuat atau memperbarui tabel database.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleCopySQL}
                      className="px-3 py-1.5 rounded-none border border-[#00296E]/20 dark:border-white/20 bg-white dark:bg-[#001740] hover:bg-slate-50 dark:hover:bg-white/5 text-slate-700 dark:text-slate-200 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      {copiedSQL ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>Tersalin!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-slate-500" />
                          <span>Salin Skrip SQL</span>
                        </>
                      )}
                    </button>
                  </div>

                  <pre className="p-3.5 rounded-none bg-[#00102B] text-slate-100 font-mono text-[11px] leading-relaxed overflow-x-auto border border-[#00296E]/20 dark:border-white/10 max-h-72">
                    <code>{sqlScriptContent}</code>
                  </pre>
                </div>
              </div>
            )}

            {/* TAB 10: MANAJEMEN PENGGUNA & HAK AKSES (KHUSUS SUPER ADMIN) */}
            {activeTab === "users" && canAccessTab(currentUserRole, "users") && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <UserManager currentUserEmail={user?.email} currentUserName={currentUserName} />
              </div>
            )}

            {/* TAB 11: AUDIT LOG AKTIVITAS (KHUSUS SUPER ADMIN & BPH) */}
            {activeTab === "audit-log" && (currentUserRole === "super_admin" || currentUserRole === "bph") && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <AuditLogManager currentUserRole={currentUserRole} />
              </div>
            )}

            {/* TAB 12: TAUTAN SINGKAT & QR HUB */}
            {activeTab === "shortlink" && canAccessTab(currentUserRole, "shortlink") && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <ShortlinkManager currentUserName={currentUserName} currentUserRole={currentUserRole} />
              </div>
            )}

            {/* TAB 9: HERO BANNER & FITUR UTAMA BERANDA */}
            {activeTab === "banner" && (
              <div className="space-y-5 animate-in fade-in duration-200">
                {/* Segmented Sub-Tab Switch: Hero Banner vs Fitur Utama */}
                <div className="flex flex-wrap items-center gap-1 p-1 bg-[#FAFBFC] dark:bg-[#001233] border border-[#00296E]/15 dark:border-white/10 w-fit">
                  <button
                    type="button"
                    onClick={() => setHomeSubTab("banner")}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-none text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer ${
                      homeSubTab === "banner"
                        ? "bg-[#00296E] dark:bg-[#38BDF8] text-white dark:text-[#001740] font-bold"
                        : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
                    }`}
                  >
                    <ImageIcon className="w-4 h-4" />
                    <span>Hero Banner (Desktop &amp; Mobile)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setHomeSubTab("fitur")}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-none text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer ${
                      homeSubTab === "fitur"
                        ? "bg-[#00296E] dark:bg-[#38BDF8] text-white dark:text-[#001740] font-bold"
                        : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
                    }`}
                  >
                    <Medal className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Daftar Fitur Utama</span>
                    <span className="px-1.5 py-0.5 text-[10px] font-mono border border-emerald-500/20 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300">
                      Open / Closed
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setHomeSubTab("popup")}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-none text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer ${
                      homeSubTab === "popup"
                        ? "bg-[#00296E] dark:bg-[#38BDF8] text-white dark:text-[#001740] font-bold"
                        : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
                    }`}
                  >
                    <MegaphoneSimple className="w-4 h-4 text-amber-500" />
                    <span>Popup Pengumuman</span>
                  </button>
                </div>

                {homeSubTab === "banner" && (
                  <div className="space-y-5">
                {/* Header Info Card */}
                <div className="bg-white dark:bg-[#001438] p-4 sm:p-5 border border-[#00296E]/15 dark:border-white/10 shadow-none flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-none bg-[#00296E]/5 dark:bg-white/5 text-[#00296E] dark:text-[#38BDF8] flex items-center justify-center shrink-0 border border-[#00296E]/15 dark:border-white/10">
                      <ImageIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-base font-semibold text-[#00296E] dark:text-white uppercase tracking-wider flex items-center gap-2">
                        <span>Hero Banner Beranda (Mobile &amp; Desktop)</span>
                        <span className="px-2 py-0.5 rounded-none text-[10px] font-mono uppercase bg-[#00296E]/5 dark:bg-white/5 border border-[#00296E]/15 dark:border-white/10 text-slate-700 dark:text-slate-300">
                          Dual-Source
                        </span>
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Atur gambar latar belakang responsif terpisah untuk Desktop (Landscape) dan Mobile (Portrait).
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href="/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-none bg-white dark:bg-[#001740] border border-[#00296E]/20 dark:border-white/20 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 text-xs font-semibold uppercase tracking-wider transition-colors shadow-none cursor-pointer"
                    >
                      <span>Lihat Beranda</span>
                      <ArrowSquareOut className="w-3.5 h-3.5" />
                    </a>

                    <button
                      type="button"
                      onClick={() => handleResetBanner()}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-none border border-[#00296E]/20 dark:border-white/20 bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 text-slate-700 dark:text-slate-200 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      <ArrowsClockwise className="w-3.5 h-3.5" />
                      <span>Reset Default</span>
                    </button>
                  </div>
                </div>

                {/* Live Device Previews */}
                <div className="bg-white dark:bg-[#001438] p-4 sm:p-5 border border-[#00296E]/15 dark:border-white/10 shadow-none space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-[#00296E]/10 dark:border-white/10">
                    <div>
                      <h3 className="font-semibold text-xs text-[#00296E] dark:text-white uppercase tracking-wider flex items-center gap-2">
                        <Sparkle className="w-3.5 h-3.5 text-[#00296E] dark:text-[#38BDF8]" />
                        <span>Pratinjau Multi-Perangkat (Live Preview)</span>
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Simulasi langsung tampilan hero banner di berbagai orientasi layar.
                      </p>
                    </div>

                    <div className="inline-flex items-center p-1 bg-[#FAFBFC] dark:bg-[#001233] border border-[#00296E]/15 dark:border-white/10 gap-1 text-xs font-semibold">
                      <button
                        type="button"
                        onClick={() => setPreviewDevice("split")}
                        className={`px-3 py-1.5 rounded-none font-mono uppercase tracking-wider transition-colors cursor-pointer ${
                          previewDevice === "split"
                            ? "bg-[#00296E] dark:bg-[#38BDF8] text-white dark:text-[#001740] font-bold"
                            : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
                        }`}
                      >
                        Bandingan (Split)
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewDevice("desktop")}
                        className={`px-3 py-1.5 rounded-none flex items-center gap-1.5 font-mono uppercase tracking-wider transition-colors cursor-pointer ${
                          previewDevice === "desktop"
                            ? "bg-[#00296E] dark:bg-[#38BDF8] text-white dark:text-[#001740] font-bold"
                            : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
                        }`}
                      >
                        <Desktop className="w-3.5 h-3.5" />
                        <span>Desktop</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewDevice("mobile")}
                        className={`px-3 py-1.5 rounded-none flex items-center gap-1.5 font-mono uppercase tracking-wider transition-colors cursor-pointer ${
                          previewDevice === "mobile"
                            ? "bg-[#00296E] dark:bg-[#38BDF8] text-white dark:text-[#001740] font-bold"
                            : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
                        }`}
                      >
                        <DeviceMobile className="w-3.5 h-3.5" />
                        <span>Mobile</span>
                      </button>
                    </div>
                  </div>

                  {/* Device Preview Canvases */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                    
                    {/* 1. Desktop Preview Mockup */}
                    {(previewDevice === "desktop" || previewDevice === "split") && (
                      <div className={`${previewDevice === "split" ? "lg:col-span-8" : "lg:col-span-12"} space-y-2`}>
                        <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                          <span className="flex items-center gap-1.5 text-slate-700 font-bold">
                            <Desktop className="w-4 h-4 text-sky-600" />
                            <span>Tampilan Layar Desktop (&ge; 768px)</span>
                          </span>
                          <span className="font-mono text-[11px] bg-sky-50 text-sky-700 px-2 py-0.5 rounded border border-sky-100">
                            {formDesktopImage}
                          </span>
                        </div>

                        {/* Simulated Desktop Window */}
                        <div className="rounded-2xl overflow-hidden border border-slate-300 shadow-md bg-slate-900">
                          {/* Browser Top Bar */}
                          <div className="bg-slate-800 px-3 py-2 flex items-center gap-2 border-b border-slate-700/60">
                            <div className="flex items-center gap-1.5">
                              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                            </div>
                            <div className="flex-1 max-w-sm mx-auto bg-slate-900/80 text-slate-400 text-[10px] font-mono px-3 py-0.5 rounded-md text-center truncate border border-slate-700">
                              https://himasi.atmaluhur.ac.id
                            </div>
                          </div>

                          {/* Desktop Banner Display */}
                          <div className="relative aspect-video sm:aspect-[21/9] w-full overflow-hidden bg-slate-950">
                            <img
                              src={formDesktopImage || DEFAULT_HERO_BANNER.desktopImage}
                              alt="Pratinjau Desktop"
                              className={`w-full h-full object-cover ${formDesktopPos}`}
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src = DEFAULT_HERO_BANNER.desktopImage;
                              }}
                            />
                            {/* Overlay Gradient Simulating Real Homepage */}
                            <div
                              className="absolute inset-0 pointer-events-none"
                              style={{
                                background:
                                  "linear-gradient(180deg, #00296E 0%, rgba(0, 41, 110, 0.72) 10%, rgba(0, 41, 110, 0.22) 20%, transparent 35%, transparent 85%, rgba(255, 255, 255, 0.8) 98%, #FFFFFF 100%)",
                              }}
                            />
                            {/* Simulated Watermark Text Marquee */}
                            <div className="absolute bottom-4 inset-x-0 text-center pointer-events-none">
                              <span className="font-black text-xl sm:text-2xl text-white/30 uppercase tracking-widest">
                                HIMASI ATMALUHUR KABINET REKSABUDAYA
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 2. Mobile Smartphone Mockup */}
                    {(previewDevice === "mobile" || previewDevice === "split") && (
                      <div className={`${previewDevice === "split" ? "lg:col-span-4" : "lg:col-span-12 max-w-xs mx-auto"} space-y-2`}>
                        <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                          <span className="flex items-center gap-1.5 text-slate-700 font-bold">
                            <DeviceMobile className="w-4 h-4 text-pink-600" />
                            <span>Tampilan Layar Mobile (&lt; 768px)</span>
                          </span>
                          <span className="font-mono text-[11px] bg-pink-50 text-pink-700 px-2 py-0.5 rounded border border-pink-100">
                            Portrait
                          </span>
                        </div>

                        {/* Simulated Smartphone Frame */}
                        <div className="rounded-[32px] overflow-hidden border-4 border-slate-800 shadow-xl bg-slate-950 relative max-w-[260px] mx-auto">
                          {/* Phone Speaker Notch */}
                          <div className="absolute top-2 inset-x-0 z-20 flex justify-center pointer-events-none">
                            <div className="w-16 h-3 bg-slate-800 rounded-full" />
                          </div>

                          {/* Mobile Banner Display */}
                          <div className="relative aspect-[9/18] w-full overflow-hidden bg-slate-950">
                            <img
                              src={formMobileImage || DEFAULT_HERO_BANNER.mobileImage}
                              alt="Pratinjau Mobile"
                              className={`w-full h-full object-cover ${formMobilePos}`}
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src = DEFAULT_HERO_BANNER.mobileImage;
                              }}
                            />
                            {/* Overlay Gradient Simulating Real Mobile Homepage */}
                            <div
                              className="absolute inset-0 pointer-events-none"
                              style={{
                                background:
                                  "linear-gradient(180deg, #00296E 0%, rgba(0, 41, 110, 0.72) 12%, rgba(0, 41, 110, 0.22) 22%, transparent 35%, transparent 88%, rgba(255, 255, 255, 0.8) 98%, #FFFFFF 100%)",
                              }}
                            />
                            {/* Simulated Mobile Marquee Text */}
                            <div className="absolute bottom-6 inset-x-0 text-center pointer-events-none px-2">
                              <span className="font-extrabold text-[10px] text-white/40 uppercase tracking-wider block">
                                KABINET REKSABUDAYA
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                  </div>
                </div>

                {/* Form Controls: Setting URLs & Alignment */}
                <form onSubmit={handleSaveBanner} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    
                    {/* Setting 1: Desktop Banner */}
                    <div className="bg-white dark:bg-[#001438] p-4 sm:p-5 border border-[#00296E]/15 dark:border-white/10 shadow-none space-y-3.5">
                      <div className="flex items-center gap-2.5 pb-2.5 border-b border-[#00296E]/10 dark:border-white/10">
                        <div className="w-8 h-8 rounded-none bg-[#00296E]/5 dark:bg-white/5 text-[#00296E] dark:text-[#38BDF8] flex items-center justify-center shrink-0 border border-[#00296E]/15 dark:border-white/10">
                          <Desktop className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-xs text-[#00296E] dark:text-white uppercase tracking-wider">Background Banner Desktop</h4>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">Aktif pada layar komputer, laptop, &amp; tablet lebar (&ge; 768px)</p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                            URL / Jalur File Gambar Desktop:
                          </label>
                          <input
                            type="text"
                            value={formDesktopImage}
                            onChange={(e) => setFormDesktopImage(e.target.value)}
                            placeholder="/hero-banner.png atau link https://..."
                            className="w-full px-3 py-2 rounded-none border border-[#00296E]/20 dark:border-white/20 bg-white dark:bg-[#001740] text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-[#00296E] dark:focus:border-[#38BDF8]"
                            required
                          />
                        </div>

                        {/* Presets Desktop */}
                        <div>
                          <span className="block text-[11px] font-mono uppercase text-slate-500 dark:text-slate-400 mb-1">Preset Rekomendasi:</span>
                          <div className="flex flex-wrap gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setFormDesktopImage("/hero-banner.png");
                                setFormDesktopPos("object-[center_65%]");
                              }}
                              className="px-2.5 py-1 rounded-none border border-[#00296E]/15 dark:border-white/10 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 text-[11px] font-mono transition-colors cursor-pointer"
                            >
                              /hero-banner.png (Resmi 5933x3219)
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setFormDesktopImage("/hero-nature.jpg");
                                setFormDesktopPos("object-center");
                              }}
                              className="px-2.5 py-1 rounded-none border border-[#00296E]/15 dark:border-white/10 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 text-[11px] font-mono transition-colors cursor-pointer"
                            >
                              /hero-nature.jpg (Alam)
                            </button>
                          </div>
                        </div>

                        {/* Posisi Fokus Desktop */}
                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                            Posisi Fokus Gambar (CSS Object-Position):
                          </label>
                          <select
                            value={formDesktopPos}
                            onChange={(e) => setFormDesktopPos(e.target.value)}
                            className="w-full px-3 py-2 rounded-none border border-[#00296E]/20 dark:border-white/20 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-[#00296E] dark:focus:border-[#38BDF8] bg-white dark:bg-[#001740] cursor-pointer"
                          >
                            <option value="object-[center_65%]">object-[center_65%] (Fokus Anggota Kabinet &amp; Gedung)</option>
                            <option value="object-center">object-center (Tengah Sempurna)</option>
                            <option value="object-top">object-top (Fokus Langit &amp; Plang Atas)</option>
                            <option value="object-bottom">object-bottom (Fokus Rumput &amp; Jalan)</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Setting 2: Mobile Banner */}
                    <div className="bg-white dark:bg-[#001438] p-4 sm:p-5 border border-[#00296E]/15 dark:border-white/10 shadow-none space-y-3.5">
                      <div className="flex items-center gap-2.5 pb-2.5 border-b border-[#00296E]/10 dark:border-white/10">
                        <div className="w-8 h-8 rounded-none bg-[#00296E]/5 dark:bg-white/5 text-[#00296E] dark:text-[#38BDF8] flex items-center justify-center shrink-0 border border-[#00296E]/15 dark:border-white/10">
                          <DeviceMobile className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-xs text-[#00296E] dark:text-white uppercase tracking-wider">Background Banner Mobile</h4>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">Aktif pada perangkat smartphone / vertikal (&lt; 768px)</p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                            URL / Jalur File Gambar Mobile:
                          </label>
                          <input
                            type="text"
                            value={formMobileImage}
                            onChange={(e) => setFormMobileImage(e.target.value)}
                            placeholder="/hero-banner-mobile.png atau link https://..."
                            className="w-full px-3 py-2 rounded-none border border-[#00296E]/20 dark:border-white/20 bg-white dark:bg-[#001740] text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-[#00296E] dark:focus:border-[#38BDF8]"
                            required
                          />
                        </div>

                        {/* Presets Mobile */}
                        <div>
                          <span className="block text-[11px] font-mono uppercase text-slate-500 dark:text-slate-400 mb-1">Preset Rekomendasi:</span>
                          <div className="flex flex-wrap gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setFormMobileImage("/hero-banner-mobile.png");
                                setFormMobilePos("object-center");
                              }}
                              className="px-2.5 py-1 rounded-none border border-[#00296E]/15 dark:border-white/10 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 text-[11px] font-mono transition-colors cursor-pointer"
                            >
                              /hero-banner-mobile.png (Portrait 1811x3219)
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setFormMobileImage("/hero-banner.png");
                                setFormMobilePos("object-center");
                              }}
                              className="px-2.5 py-1 rounded-none border border-[#00296E]/15 dark:border-white/10 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 text-[11px] font-mono transition-colors cursor-pointer"
                            >
                              /hero-banner.png (Gunakan Versi Desktop)
                            </button>
                          </div>
                        </div>

                        {/* Posisi Fokus Mobile */}
                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                            Posisi Fokus Gambar (CSS Object-Position):
                          </label>
                          <select
                            value={formMobilePos}
                            onChange={(e) => setFormMobilePos(e.target.value)}
                            className="w-full px-3 py-2 rounded-none border border-[#00296E]/20 dark:border-white/20 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-[#00296E] dark:focus:border-[#38BDF8] bg-white dark:bg-[#001740] cursor-pointer"
                          >
                            <option value="object-center">object-center (Tengah Sempurna - Rekomendasi)</option>
                            <option value="object-top">object-top (Fokus Atas)</option>
                            <option value="object-bottom">object-bottom (Fokus Bawah)</option>
                          </select>
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Submit Button Bar */}
                  <div className="bg-white dark:bg-[#001438] p-3.5 sm:p-4 border border-[#00296E]/15 dark:border-white/10 shadow-none flex flex-col sm:flex-row items-center justify-between gap-3">
                    <p className="text-xs text-slate-500 dark:text-slate-400 text-center sm:text-left">
                      Konfigurasi tersimpan otomatis dan langsung diterapkan pada pengunjung beranda.
                    </p>

                    <button
                      type="submit"
                      className="w-full sm:w-auto px-5 py-2 rounded-none bg-[#00296E] hover:bg-[#001f54] text-white text-xs font-semibold uppercase tracking-wider transition-colors shadow-none flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Simpan Konfigurasi Banner</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* PANEL SUB-TAB: PENGATURAN STATUS FITUR UTAMA (OPEN / CLOSED TOGGLE) */}
            {homeSubTab === "fitur" && (
              <div className="space-y-5 animate-in fade-in duration-200">
                {/* Header Info Card */}
                <div className="bg-white dark:bg-[#001438] p-4 sm:p-5 border border-[#00296E]/15 dark:border-white/10 shadow-none flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-none bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
                      <Medal className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-base font-semibold text-[#00296E] dark:text-white uppercase tracking-wider flex items-center gap-2">
                        <span>Pengaturan Status Fitur Utama Beranda</span>
                        <span className="px-2 py-0.5 rounded-none text-[10px] font-mono border border-emerald-500/20 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300">
                          OPEN / CLOSED
                        </span>
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Aktifkan atau nonaktifkan fitur utama pada halaman beranda dengan status Buka (Open) atau Ditutup (Closed / Coming Soon).
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Master Switch Tampilkan Section di Homepage */}
                    <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-none border border-[#00296E]/20 dark:border-white/20 bg-white dark:bg-[#001740] text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-200 cursor-pointer select-none transition-colors">
                      <input
                        type="checkbox"
                        checked={fiturConfig.showSection}
                        onChange={(e) => {
                          const next = { ...fiturConfig, showSection: e.target.checked };
                          setFiturConfig(next);
                          saveFiturUtamaConfig(next);
                          showToast(
                            e.target.checked
                              ? "Section Fitur Utama kini AKTIF di halaman beranda!"
                              : "Section Fitur Utama DISEMBUNYIKAN dari beranda."
                          );
                        }}
                        className="w-4 h-4 text-[#00296E] rounded-none accent-[#00296E] cursor-pointer"
                      />
                      <span>Tampilkan Section di Beranda</span>
                    </label>

                    <a
                      href="/#fitur-utama"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-none bg-white dark:bg-[#001740] border border-[#00296E]/20 dark:border-white/20 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 text-xs font-semibold uppercase tracking-wider transition-colors shadow-none cursor-pointer"
                    >
                      <span>Lihat Beranda</span>
                      <ArrowSquareOut className="w-3.5 h-3.5" />
                    </a>

                    <button
                      type="button"
                      onClick={() => handleResetFitur()}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-none border border-[#00296E]/20 dark:border-white/20 bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 text-slate-700 dark:text-slate-200 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
                      title="Kembalikan semua ke default"
                    >
                      <ArrowsClockwise className="w-3.5 h-3.5" />
                      <span>Reset</span>
                    </button>
                  </div>
                </div>

                {/* 4 Cards Grid Editor */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                  {fiturConfig.items.map((item) => {
                    const isOpen = item.isOpen;
                    const previewLabel = isOpen
                      ? (item.statusOpenText || "Lihat Selengkapnya")
                      : (item.statusClosedText || "Coming Soon");

                    return (
                      <div
                        key={item.id}
                        className={`bg-white dark:bg-[#001438] rounded-none border transition-colors p-4 sm:p-5 flex flex-col justify-between shadow-none ${
                          isOpen
                            ? "border-emerald-500/40"
                            : "border-[#00296E]/15 dark:border-white/10"
                        }`}
                      >
                        <div>
                          {/* Top Bar Card */}
                          <div className="flex items-center justify-between pb-3.5 border-b border-[#00296E]/10 dark:border-white/10 mb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-none bg-[#00296E] dark:bg-white/10 text-white flex items-center justify-center shrink-0 border border-[#00296E]/20 dark:border-white/10">
                                {item.iconName === "UserPlus" && <UserPlus className="w-5 h-5 stroke-[2.2]" />}
                                {item.iconName === "Shirt" && <TShirt className="w-5 h-5 stroke-[2.2]" />}
                                {item.iconName === "Trophy" && <Trophy className="w-5 h-5 stroke-[2.2]" />}
                                {item.iconName === "Award" && <Medal className="w-5 h-5 stroke-[2.2]" />}
                              </div>
                              <div>
                                <h3 className="font-semibold text-sm text-[#00296E] dark:text-white leading-snug">
                                  {item.title}
                                </h3>
                                <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500">
                                  Tautan: {item.href}
                                </span>
                              </div>
                            </div>

                            {/* Status Indicator Pill */}
                            <span
                              className={`px-2.5 py-1 rounded-none text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                                isOpen
                                  ? "bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20"
                                  : "bg-rose-500/10 text-rose-800 dark:text-rose-300 border border-rose-500/20"
                              }`}
                            >
                              <span className={`w-2 h-2 ${isOpen ? "bg-emerald-600 dark:bg-emerald-400" : "bg-rose-600 dark:bg-rose-400"}`} />
                              {isOpen ? "Open" : "Closed"}
                            </span>
                          </div>

                          {/* Big Segmented Toggle Switch (OPEN vs CLOSED) */}
                          <div className="mb-4">
                            <label className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1.5">
                              Status Fitur di Beranda
                            </label>
                            <div className="grid grid-cols-2 gap-2 p-1.5 bg-[#FAFBFC] dark:bg-[#00102B] border border-[#00296E]/15 dark:border-white/10">
                              <button
                                type="button"
                                onClick={() => {
                                  if (!isOpen) handleToggleFiturItem(item.id);
                                }}
                                className={`py-2 px-3 rounded-none text-xs font-semibold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                                  isOpen
                                    ? "bg-emerald-600 text-white font-bold"
                                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                                }`}
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                                <span>OPEN (Dibuka)</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  if (isOpen) handleToggleFiturItem(item.id);
                                }}
                                className={`py-2 px-3 rounded-none text-xs font-semibold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                                  !isOpen
                                    ? "bg-rose-600 text-white font-bold"
                                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                                }`}
                              >
                                <Lock className="w-3.5 h-3.5" />
                                <span>CLOSED (Ditutup)</span>
                              </button>
                            </div>
                          </div>

                          {/* Setting Label Input Fields */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                            <div>
                              <label className="text-[11px] font-mono uppercase text-slate-600 dark:text-slate-400 block mb-1">
                                Label saat <strong className="text-emerald-700 dark:text-emerald-400">Open</strong>
                              </label>
                              <input
                                type="text"
                                value={item.statusOpenText}
                                onChange={(e) => handleUpdateFiturItemField(item.id, "statusOpenText", e.target.value)}
                                placeholder="Lihat Selengkapnya"
                                className="w-full px-3 py-1.5 rounded-none border border-[#00296E]/20 dark:border-white/20 bg-white dark:bg-[#001740] text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#00296E] dark:focus:border-[#38BDF8]"
                              />
                            </div>

                            <div>
                              <label className="text-[11px] font-mono uppercase text-slate-600 dark:text-slate-400 block mb-1">
                                Label saat <strong className="text-rose-700 dark:text-rose-400">Closed</strong>
                              </label>
                              <input
                                type="text"
                                value={item.statusClosedText}
                                onChange={(e) => handleUpdateFiturItemField(item.id, "statusClosedText", e.target.value)}
                                placeholder="Coming Soon"
                                className="w-full px-3 py-1.5 rounded-none border border-[#00296E]/20 dark:border-white/20 bg-white dark:bg-[#001740] text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#00296E] dark:focus:border-[#38BDF8]"
                              />
                            </div>
                          </div>

                          {/* Opsi Kunci Akses saat Closed */}
                          <div className="mb-4 pt-2 border-t border-[#00296E]/10 dark:border-white/10">
                            <label className="flex items-start gap-2 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={item.lockWhenClosed !== false}
                                onChange={(e) => handleUpdateFiturItemField(item.id, "lockWhenClosed", e.target.checked)}
                                className="mt-0.5 w-3.5 h-3.5 text-[#00296E] rounded-none accent-[#00296E] cursor-pointer"
                              />
                              <span className="text-[11px] text-slate-600 dark:text-slate-300 leading-tight">
                                Kunci klik saat <strong>Closed</strong> (menampilkan pemberitahuan bahwa fitur sedang ditutup dan mencegah pembukaan form)
                              </span>
                            </label>
                          </div>
                        </div>

                        {/* Live Visual Preview Kartu Sesuai Tampilan Homepage */}
                        <div className="pt-3 border-t border-[#00296E]/10 dark:border-white/10">
                          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-2">
                            Pratinjau Tampilan di Beranda:
                          </span>
                          <div
                            className="rounded-none p-5 flex flex-col justify-between min-h-[140px] select-none text-white shadow-none border border-[#00296E]/20 bg-[#00296E]"
                          >
                            <div className="flex items-center gap-3">
                              {item.iconName === "UserPlus" && <UserPlus className="w-7 h-7 text-white stroke-[2.2] shrink-0" />}
                              {item.iconName === "Shirt" && <TShirt className="w-7 h-7 text-white stroke-[2.2] shrink-0" />}
                              {item.iconName === "Trophy" && <Trophy className="w-7 h-7 text-white stroke-[2.2] shrink-0" />}
                              {item.iconName === "Award" && <Medal className="w-7 h-7 text-white stroke-[2.2] shrink-0" />}
                              <h4 className="font-semibold text-base text-white leading-snug">
                                {item.title}
                              </h4>
                            </div>
                            <div className="mt-4 flex items-center justify-between">
                              <span className={`text-xs font-mono font-semibold tracking-wide ${isOpen ? "text-[#22c55e]" : "text-[#eb5f5f]"}`}>
                                {previewLabel}
                              </span>
                              {!isOpen && (
                                <span className="text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 border border-rose-400/30 bg-rose-500/20 text-rose-300">
                                  Closed
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Bottom Bar: Simpan Perubahan Fitur */}
                <div className="bg-white dark:bg-[#001438] p-4 sm:p-5 border border-[#00296E]/15 dark:border-white/10 shadow-none flex flex-col sm:flex-row items-center justify-between gap-3 rounded-none">
                  <div>
                    <p className="text-xs font-semibold text-[#00296E] dark:text-white uppercase tracking-wider">
                      Simpan &amp; Sinkronisasi Seluruh Perubahan
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Perubahan status Open/Closed dan label teks akan langsung aktif untuk seluruh pengunjung website.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleSaveAllFitur}
                    disabled={savingFitur}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-none bg-[#00296E] hover:bg-[#001f54] text-white text-xs font-semibold uppercase tracking-wider transition-colors shadow-none flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" />
                    <span>Simpan Pengaturan Fitur</span>
                  </button>
                </div>
              </div>
            )}

            {/* PANEL SUB-TAB: MANAJEMEN POPUP PENGUMUMAN BERANDA */}
            {homeSubTab === "popup" && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <PopupManager
                  currentUserName={currentUserName}
                  currentUserRole={currentUserRole}
                />
              </div>
            )}
              </div>
            )}

          </div>
        </main>

      </div>

      {/* MODAL 1: LIHAT KARTU QR PENGURUS */}
      {selectedPengurusCard && (
        <div
          className="no-print fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedPengurusCard(null)}
        >
          <div
            className="relative w-full max-w-sm rounded-none overflow-hidden bg-white dark:bg-[#001438] p-4 sm:p-6 shadow-none border border-[#00296E]/20 dark:border-white/10 animate-in zoom-in-95 duration-200 text-slate-900 dark:text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelectedPengurusCard(null)}
              className="absolute top-4 right-4 z-20 p-2 rounded-none bg-black/40 hover:bg-black/60 text-white transition-colors cursor-pointer"
              aria-label="Tutup"
            >
              <X className="w-4 h-4" />
            </button>

            <PengurusQrCard
              member={selectedPengurusCard}
              onClose={() => setSelectedPengurusCard(null)}
              onEdit={(m) => handleOpenEditPengurus(m)}
              onDelete={(m) => handleRequestDeletePengurus(m)}
            />
          </div>
        </div>
      )}

      {/* POPUP MODAL: TAMBAH / EDIT PESERTA PENGURUS */}
      {isPengurusModalOpen && (
        <div
          className="no-print fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200"
          onClick={() => !savingPengurus && setIsPengurusModalOpen(false)}
        >
          <div
            className="relative w-full max-w-lg rounded-none bg-white dark:bg-[#001438] p-6 sm:p-7 shadow-none animate-in zoom-in-95 duration-200 border border-[#00296E]/20 dark:border-white/10 my-8 max-h-[90vh] overflow-y-auto text-slate-900 dark:text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-[#00296E]/15 dark:border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-none bg-sky-100 dark:bg-sky-950/40 text-[#00296E] dark:text-[#38BDF8] flex items-center justify-center shrink-0 border border-sky-200 dark:border-sky-800/40">
                  {editingPengurus ? (
                    <NotePencil className="w-5 h-5 text-[#0094E0] dark:text-[#38BDF8]" />
                  ) : (
                    <UserPlus className="w-5 h-5 text-[#0094E0] dark:text-[#38BDF8]" />
                  )}
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#00296E] dark:text-white">
                    {editingPengurus ? "Edit Data Peserta" : "Tambah Peserta Baru"}
                  </h3>
                  <p className="text-xs text-slate-400 dark:text-slate-400">
                    {editingPengurus
                      ? `Perbarui identitas & profil ${editingPengurus.nama}`
                      : "Daftarkan anggota baru untuk menerbitkan kartu identitas dan QR Code"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={savingPengurus}
                onClick={() => setIsPengurusModalOpen(false)}
                className="p-1.5 rounded-none text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePengurus} className="mt-5 space-y-4">
              {/* Field 1: Nama Lengkap */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Nama Lengkap Peserta <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: AHMAD FAUZI"
                  value={formPengurusNama}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormPengurusNama(val);
                    if (!editingPengurus) {
                      setFormPengurusToken(generateQrToken(formPengurusNim, val));
                    }
                  }}
                  className="w-full px-3.5 py-2.5 text-xs rounded-none border border-[#00296E]/20 dark:border-white/15 bg-slate-50 dark:bg-[#001740] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-[#001740] focus:outline-none focus:ring-1 focus:ring-[#00296E] dark:focus:ring-[#38BDF8] uppercase font-semibold"
                />
              </div>

              {/* Grid 2 kolom: NIM & Divisi */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    {formPengurusDivisi === "PEMBINA" ? "NIM / NIDN (Opsional)" : "NIM Mahasiswa"}{" "}
                    {formPengurusDivisi !== "PEMBINA" && <span className="text-rose-500">*</span>}
                  </label>
                  <input
                    type="text"
                    required={formPengurusDivisi !== "PEMBINA"}
                    placeholder={formPengurusDivisi === "PEMBINA" ? "NIDN / Dikosongkan" : "Contoh: 231150020"}
                    value={formPengurusNim}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormPengurusNim(val);
                      if (!editingPengurus) {
                        setFormPengurusToken(generateQrToken(val, formPengurusNama));
                      }
                    }}
                    className="w-full px-3.5 py-2.5 text-xs font-mono font-bold rounded-none border border-[#00296E]/20 dark:border-white/15 bg-slate-50 dark:bg-[#001740] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-[#001740] focus:outline-none focus:ring-1 focus:ring-[#00296E] dark:focus:ring-[#38BDF8]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Divisi Organisasi <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formPengurusDivisi}
                    onChange={(e) => setFormPengurusDivisi(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-none border border-[#00296E]/20 dark:border-white/15 bg-slate-50 dark:bg-[#001740] text-slate-900 dark:text-white focus:bg-white dark:focus:bg-[#001740] focus:outline-none focus:ring-1 focus:ring-[#00296E] dark:focus:ring-[#38BDF8] cursor-pointer"
                  >
                    {DAFTAR_DIVISI.map((div) => (
                      <option key={div} value={div}>
                        {div}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Grid 2 kolom: Jabatan & Urutan Tampil */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Jabatan / Peran <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: KETUA UMUM HIMASI"
                    value={formPengurusJabatan}
                    onChange={(e) => setFormPengurusJabatan(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-none border border-[#00296E]/20 dark:border-white/15 bg-slate-50 dark:bg-[#001740] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-[#001740] focus:outline-none focus:ring-1 focus:ring-[#00296E] dark:focus:ring-[#38BDF8] font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Urutan Tampil (Hierarki)
                  </label>
                  <input
                    type="number"
                    min={0}
                    placeholder="0 = Otomatis hierarki"
                    value={formPengurusUrutan || ""}
                    onChange={(e) => setFormPengurusUrutan(Number(e.target.value) || 0)}
                    className="w-full px-3.5 py-2.5 text-xs font-mono font-bold rounded-none border border-[#00296E]/20 dark:border-white/15 bg-slate-50 dark:bg-[#001740] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-[#001740] focus:outline-none focus:ring-1 focus:ring-[#00296E] dark:focus:ring-[#38BDF8]"
                  />
                </div>
              </div>

              {/* Field Email */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Email (Opsional)
                </label>
                <input
                  type="email"
                  placeholder="nama@atmaluhur.ac.id"
                  value={formPengurusEmail}
                  onChange={(e) => setFormPengurusEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-none border border-[#00296E]/20 dark:border-white/15 bg-slate-50 dark:bg-[#001740] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-[#001740] focus:outline-none focus:ring-1 focus:ring-[#00296E] dark:focus:ring-[#38BDF8]"
                />
              </div>

              {/* Field Avatar & Upload Foto */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Foto Profil Peserta
                </label>

                {/* Hidden File Input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/png, image/jpeg, image/jpg, image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      processAndUploadImage(file);
                    }
                  }}
                />

                {/* Main Upload Box */}
                <div className="p-4 rounded-none bg-slate-50 dark:bg-white/5 border border-[#00296E]/15 dark:border-white/10">
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    {/* Live Preview Avatar */}
                    <div className="relative group shrink-0">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-none overflow-hidden bg-slate-200 dark:bg-slate-800 border border-sky-400 shadow-none flex items-center justify-center">
                        {formPengurusImage ? (
                          <img
                            src={formPengurusImage}
                            alt="Preview"
                            className="w-full h-full object-cover object-top"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = "/DSC01203.png";
                            }}
                          />
                        ) : (
                          <Camera className="w-8 h-8 text-slate-400" />
                        )}
                      </div>
                      {uploadingImage && (
                        <div className="absolute inset-0 bg-black/60 rounded-none flex items-center justify-center">
                          <ArrowsClockwise className="w-5 h-5 text-white animate-spin" />
                        </div>
                      )}
                    </div>

                    {/* Action Upload & Info */}
                    <div className="flex-1 text-center sm:text-left space-y-2">
                      <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                        <button
                          type="button"
                          disabled={uploadingImage}
                          onClick={() => fileInputRef.current?.click()}
                          className="px-4 py-2.5 rounded-none bg-[#00296E] hover:bg-[#001f54] text-white text-xs font-bold transition-all shadow-none flex items-center gap-2 cursor-pointer disabled:opacity-50"
                        >
                          <UploadSimple className="w-4 h-4 text-sky-300" />
                          <span>{uploadingImage ? "Mengunggah..." : "Unggah Foto dari Perangkat"}</span>
                        </button>

                        {formPengurusImage && formPengurusImage !== "/DSC01203.png" && (
                          <button
                            type="button"
                            onClick={() => setFormPengurusImage("/DSC01203.png")}
                            className="px-3 py-2.5 rounded-none bg-white dark:bg-white/10 hover:bg-slate-100 dark:hover:bg-white/15 text-slate-600 dark:text-slate-300 text-xs font-semibold border border-slate-200 dark:border-white/10 transition-colors cursor-pointer"
                          >
                            Reset Default
                          </button>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 dark:text-slate-400 leading-relaxed">
                        Pilih foto peserta dari perangkat Anda (mendukung JPG, PNG, atau WebP). Berkas akan otomatis dikompres dan disimpan.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Field QR Token */}
              <div className="bg-slate-50 dark:bg-white/5 p-3.5 rounded-none border border-[#00296E]/15 dark:border-white/10">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <QrCode className="w-3.5 h-3.5 text-[#0094E0] dark:text-[#38BDF8]" />
                    <span>QR Code Token</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setFormPengurusToken(generateQrToken(formPengurusNim, formPengurusNama))}
                    className="text-[10px] font-bold text-sky-600 dark:text-[#38BDF8] hover:underline cursor-pointer"
                  >
                    Generate Ulang
                  </button>
                </div>
                <input
                  type="text"
                  value={formPengurusToken}
                  onChange={(e) => setFormPengurusToken(e.target.value)}
                  placeholder="Auto-generated dari NIM dan Nama"
                  className="w-full px-3 py-2 text-xs font-mono font-bold rounded-none border border-[#00296E]/20 dark:border-white/15 bg-white dark:bg-[#001740] text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#00296E] dark:focus:ring-[#38BDF8]"
                />
                <p className="text-[10px] text-slate-400 dark:text-slate-400 mt-1">
                  Token unik ini di-encode ke dalam QR Code kartu identitas untuk dipindai oleh admin saat absensi.
                </p>
              </div>

              {/* Tombol Aksi */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#00296E]/15 dark:border-white/10">
                <button
                  type="button"
                  disabled={savingPengurus}
                  onClick={() => setIsPengurusModalOpen(false)}
                  className="px-4 py-2.5 rounded-none border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 transition-colors cursor-pointer disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingPengurus || uploadingImage}
                  className="px-5 py-2.5 rounded-none bg-[#00296E] dark:bg-[#38BDF8] hover:bg-[#001f54] dark:hover:bg-[#0284C7] text-white dark:text-[#001740] text-xs font-bold transition-all shadow-none flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {savingPengurus ? (
                    <>
                      <ArrowsClockwise className="w-3.5 h-3.5 animate-spin text-white dark:text-[#001740]" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#38BDF8] dark:text-[#001740]" />
                      <span>{editingPengurus ? "Simpan Perubahan" : "Terbitkan Kartu & Simpan"}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POPUP MODAL: KONFIRMASI HAPUS PESERTA PENGURUS */}
      {pengurusToDelete && (
        <div
          className="no-print fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => !deletingPengurus && setPengurusToDelete(null)}
        >
          <div
            className="relative w-full max-w-sm rounded-none bg-white dark:bg-[#001438] p-6 shadow-none animate-in zoom-in-95 duration-200 border border-[#00296E]/20 dark:border-white/10 text-center text-slate-900 dark:text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-none bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 flex items-center justify-center mx-auto mb-4">
              <Trash className="w-6 h-6" />
            </div>

            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              Hapus Data Peserta?
            </h3>

            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
              Anda akan menghapus peserta berikut dari daftar pengurus HIMASI:
            </p>

            {/* Preview Peserta yang akan dihapus */}
            <div className="mt-4 p-3 bg-slate-50 dark:bg-white/5 rounded-none border border-[#00296E]/15 dark:border-white/10 flex items-center gap-3 text-left">
              <div className="w-11 h-11 rounded-none overflow-hidden bg-slate-200 dark:bg-slate-800 shrink-0">
                <img
                  src={pengurusToDelete.image}
                  alt={pengurusToDelete.nama}
                  className="w-full h-full object-cover object-top"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = "/DSC01203.png";
                  }}
                />
              </div>
              <div className="overflow-hidden flex-1">
                <h4 className="text-xs font-black text-slate-900 dark:text-white truncate">
                  {pengurusToDelete.nama}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                  {pengurusToDelete.nim} • {pengurusToDelete.divisi}
                </p>
                <p className="text-[10px] text-slate-400 dark:text-slate-400 truncate">
                  {pengurusToDelete.jabatan}
                </p>
              </div>
            </div>

            <div className="mt-4 p-2.5 rounded-none bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-[11px] font-medium text-left">
              Kartu identitas dan QR Code untuk peserta ini tidak akan bisa dipindai lagi pada agenda absensi mendatang.
            </div>

            <div className="mt-6 flex items-center gap-2.5">
              <button
                type="button"
                disabled={deletingPengurus}
                onClick={() => setPengurusToDelete(null)}
                className="flex-1 py-2.5 rounded-none border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 transition-colors cursor-pointer disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={deletingPengurus}
                onClick={handleConfirmDeletePengurus}
                className="flex-1 py-2.5 rounded-none bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-none flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {deletingPengurus ? (
                  <>
                    <ArrowsClockwise className="w-3.5 h-3.5 animate-spin" />
                    <span>Menghapus...</span>
                  </>
                ) : (
                  <>
                    <Trash className="w-3.5 h-3.5" />
                    <span>Ya, Hapus</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP MODAL: TAMBAH / EDIT DOKUMEN ORGANISASI */}
      {isDokumenModalOpen && (
        <div
          className="no-print fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200"
          onClick={() => !savingDokumen && setIsDokumenModalOpen(false)}
        >
          <div
            className="relative w-full max-w-lg rounded-none bg-white dark:bg-[#001438] p-6 sm:p-7 shadow-none animate-in zoom-in-95 duration-200 border border-[#00296E]/20 dark:border-white/10 my-8 text-slate-900 dark:text-white"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#00296E]/15 dark:border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-none bg-sky-50 dark:bg-sky-950/40 text-[#00296E] dark:text-[#38BDF8] flex items-center justify-center border border-sky-100 dark:border-sky-800/40">
                  <FileText className="w-5 h-5 text-[#0094E0] dark:text-[#38BDF8]" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#00296E] dark:text-white">
                    {editingDokumen ? "Edit Dokumen Organisasi" : "Tambah Dokumen Organisasi"}
                  </h3>
                  <p className="text-xs text-slate-400 dark:text-slate-400">
                    Berkas resmi yang dapat diunduh publik di halaman Profil HIMASI
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={savingDokumen}
                onClick={() => setIsDokumenModalOpen(false)}
                className="p-1.5 rounded-none text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveDokumen} className="mt-5 space-y-4">
              {/* Judul Dokumen */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Judul Dokumen <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formDokumenJudul}
                  onChange={(e) => setFormDokumenJudul(e.target.value)}
                  placeholder="Contoh: AD HIMASI, ART HIMASI, SK Kepengurusan"
                  className="w-full px-3.5 py-2.5 rounded-none border border-[#00296E]/20 dark:border-white/15 bg-slate-50 dark:bg-[#001740] text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#00296E] dark:focus:ring-[#38BDF8] transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
              </div>

              {/* Deskripsi Dokumen */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Deskripsi Singkat <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  value={formDokumenDeskripsi}
                  onChange={(e) => setFormDokumenDeskripsi(e.target.value)}
                  placeholder="Contoh: Anggaran Dasar HIMASI ISB Atma Luhur Periode 2024/2025"
                  className="w-full px-3.5 py-2.5 rounded-none border border-[#00296E]/20 dark:border-white/15 bg-slate-50 dark:bg-[#001740] text-slate-900 dark:text-white text-xs font-normal focus:outline-none focus:ring-1 focus:ring-[#00296E] dark:focus:ring-[#38BDF8] transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 resize-none"
                />
              </div>

              {/* Urutan Tampilan */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Nomor Urut Tampilan
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={1}
                    value={formDokumenUrutan}
                    onChange={(e) => setFormDokumenUrutan(parseInt(e.target.value) || 1)}
                    className="w-24 px-3.5 py-2.5 rounded-none border border-[#00296E]/20 dark:border-white/15 bg-slate-50 dark:bg-[#001740] text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:ring-1 focus:ring-[#00296E] dark:focus:ring-[#38BDF8]"
                  />
                  <span className="text-[11px] text-slate-400 dark:text-slate-400">
                    Dokumen dengan nomor urut lebih kecil muncul lebih awal (1 = kartu paling kiri).
                  </span>
                </div>
              </div>

              {/* File Upload PDF */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Berkas Fisik PDF <span className="text-rose-500">*</span>
                </label>

                <input
                  ref={pdfFileInputRef}
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleProcessPdfFile(file);
                    }
                  }}
                />

                {formDokumenFileUrl ? (
                  <div className="p-3.5 rounded-none bg-sky-50/60 dark:bg-white/5 border border-sky-100 dark:border-white/10 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-none bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/40 flex items-center justify-center shrink-0 font-black text-xs">
                        PDF
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                          {formDokumenFileName || "Dokumen.pdf"}
                        </p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-400 font-medium">
                          {formDokumenFileSize || "PDF Siap Diunduh"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <a
                        href={formDokumenFileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1.5 rounded-none bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 text-[11px] font-bold text-slate-700 dark:text-slate-200 transition-colors flex items-center gap-1"
                      >
                        <ArrowSquareOut className="w-3 h-3 text-[#0094E0] dark:text-[#38BDF8]" />
                        <span>Pratinjau</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => pdfFileInputRef.current?.click()}
                        disabled={uploadingPdf}
                        className="px-2.5 py-1.5 rounded-none bg-[#00296E] hover:bg-[#001f54] text-[11px] font-bold text-white transition-colors cursor-pointer"
                      >
                        Ganti PDF
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => !uploadingPdf && pdfFileInputRef.current?.click()}
                    className={`border border-dashed rounded-none p-6 text-center transition-all cursor-pointer ${
                      uploadingPdf
                        ? "border-[#0094E0] bg-sky-50/40 dark:bg-white/10"
                        : "border-[#00296E]/20 dark:border-white/15 hover:border-[#0094E0] bg-slate-50 dark:bg-white/5"
                    }`}
                  >
                    {uploadingPdf ? (
                      <div className="flex flex-col items-center justify-center py-2">
                        <ArrowsClockwise className="w-8 h-8 text-[#0094E0] dark:text-[#38BDF8] animate-spin mb-2" />
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Mengunggah Berkas PDF...</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Menyiapkan penyimpanan berkas dokumen</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-1">
                        <div className="w-12 h-12 rounded-none bg-sky-50 dark:bg-white/10 text-[#00296E] dark:text-[#38BDF8] flex items-center justify-center mb-2">
                          <UploadSimple className="w-6 h-6" />
                        </div>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          Klik untuk unggah berkas PDF dari perangkat
                        </p>
                        <p className="text-[11px] text-slate-400 mt-1">
                          Format dokumen PDF • Ukuran berkas maksimal 25 MB
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-[#00296E]/15 dark:border-white/10 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  disabled={savingDokumen || uploadingPdf}
                  onClick={() => setIsDokumenModalOpen(false)}
                  className="px-4 py-2.5 rounded-none border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 transition-colors cursor-pointer disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingDokumen || uploadingPdf || !formDokumenFileUrl}
                  className="px-5 py-2.5 rounded-none bg-[#00296E] dark:bg-[#38BDF8] hover:bg-[#001f54] dark:hover:bg-[#0284C7] text-white dark:text-[#001740] text-xs font-bold transition-all shadow-none flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {savingDokumen ? (
                    <>
                      <ArrowsClockwise className="w-3.5 h-3.5 animate-spin text-white dark:text-[#001740]" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#38BDF8] dark:text-[#001740]" />
                      <span>{editingDokumen ? "Simpan Perubahan" : "Terbitkan Dokumen"}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POPUP MODAL: KONFIRMASI HAPUS DOKUMEN ORGANISASI */}
      {dokumenToDelete && (
        <div
          className="no-print fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => !deletingDokumen && setDokumenToDelete(null)}
        >
          <div
            className="relative w-full max-w-sm rounded-none bg-white dark:bg-[#001438] p-6 shadow-none animate-in zoom-in-95 duration-200 border border-[#00296E]/20 dark:border-white/10 text-center text-slate-900 dark:text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-none bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 flex items-center justify-center mx-auto mb-4">
              <Trash className="w-6 h-6" />
            </div>

            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              Hapus Dokumen Organisasi?
            </h3>

            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
              Anda akan menghapus dokumen berikut dari daftar publik:
            </p>

            {/* Preview Dokumen yang akan dihapus */}
            <div className="mt-4 p-3 bg-slate-50 dark:bg-white/5 rounded-none border border-[#00296E]/15 dark:border-white/10 flex items-center gap-3 text-left">
              <div className="w-10 h-10 rounded-none bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50 flex items-center justify-center shrink-0 font-black text-xs">
                PDF
              </div>
              <div className="overflow-hidden flex-1">
                <h4 className="text-xs font-black text-slate-900 dark:text-white truncate">
                  {dokumenToDelete.judul}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {dokumenToDelete.deskripsi}
                </p>
                <p className="text-[10px] text-slate-400 dark:text-slate-400 font-mono truncate">
                  {dokumenToDelete.file_name} • {dokumenToDelete.file_size || "PDF"}
                </p>
              </div>
            </div>

            <div className="mt-4 p-2.5 rounded-none bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-[11px] font-medium text-left">
              Dokumen ini tidak akan bisa diunduh lagi oleh pengunjung di halaman Profil HIMASI.
            </div>

            <div className="mt-6 flex items-center gap-2.5">
              <button
                type="button"
                disabled={deletingDokumen}
                onClick={() => setDokumenToDelete(null)}
                className="flex-1 py-2.5 rounded-none border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 transition-colors cursor-pointer disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={deletingDokumen}
                onClick={handleConfirmDeleteDokumen}
                className="flex-1 py-2.5 rounded-none bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-none flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {deletingDokumen ? (
                  <>
                    <ArrowsClockwise className="w-3.5 h-3.5 animate-spin" />
                    <span>Menghapus...</span>
                  </>
                ) : (
                  <>
                    <Trash className="w-3.5 h-3.5" />
                    <span>Ya, Hapus</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP MODAL: TAMBAH / EDIT AGENDA KALENDER */}
      {isAgendaModalOpen && (
        <div
          className="no-print fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200"
          onClick={() => !savingAgenda && setIsAgendaModalOpen(false)}
        >
          <div
            className="relative w-full max-w-lg rounded-none bg-white dark:bg-[#001438] p-6 sm:p-7 shadow-none animate-in zoom-in-95 duration-200 border border-[#00296E]/20 dark:border-white/10 my-8 text-slate-900 dark:text-white"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Modal */}
            <div className="flex items-center justify-between pb-4 border-b border-[#00296E]/15 dark:border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-none bg-sky-50 dark:bg-sky-950/40 text-[#00296E] dark:text-[#38BDF8] flex items-center justify-center border border-sky-100 dark:border-sky-800/40">
                  <CalendarBlank className="w-5 h-5 text-[#0094E0] dark:text-[#38BDF8]" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#00296E] dark:text-white">
                    {editingAgenda ? "Edit Agenda Acara" : "Tambah Agenda Baru"}
                  </h3>
                  <p className="text-xs text-slate-400 dark:text-slate-400">
                    Jadwalkan kegiatan organisasi, agenda akademik, atau libur nasional
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={savingAgenda}
                onClick={() => setIsAgendaModalOpen(false)}
                className="p-1.5 rounded-none text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Agenda */}
            <form onSubmit={handleSaveAgenda} className="mt-5 space-y-4">
              {/* Judul Agenda */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Judul Agenda / Acara <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formAgendaJudul}
                  onChange={(e) => setFormAgendaJudul(e.target.value)}
                  placeholder="Contoh: Malam Keakraban (MAKRAB) HIMASI 2026"
                  className="w-full px-3.5 py-2.5 rounded-none border border-[#00296E]/20 dark:border-white/15 bg-slate-50 dark:bg-[#001740] text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#00296E] dark:focus:ring-[#38BDF8] transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
              </div>

              {/* Kategori Agenda */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Kategori Agenda <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["HIMASI", "Akademik", "Libur"] as EventCategory[]).map((cat) => {
                    const isSelected = formAgendaKategori === cat;
                    const meta = getCategoryMeta(cat);
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setFormAgendaKategori(cat)}
                        className={`p-2.5 rounded-none border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                          isSelected
                            ? `${meta.border} ${meta.bgBadge} ${meta.textBadge} ring-1 ring-[#0094E0]/40 shadow-none`
                            : "border-slate-200 dark:border-white/15 text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10"
                        }`}
                      >
                        <span className={`w-2.5 h-2.5 rounded-full ${meta.dot}`} />
                        <span>{meta.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Checkbox Rentang Tanggal */}
              <div className="p-3 rounded-none bg-slate-50 dark:bg-white/5 border border-[#00296E]/15 dark:border-white/10">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formAgendaIsMultiDay}
                    onChange={(e) => setFormAgendaIsMultiDay(e.target.checked)}
                    className="w-4 h-4 rounded-none text-[#0094E0] focus:ring-[#0094E0] border-slate-300 dark:border-white/20"
                  />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Acara berlangsung beberapa hari (Rentang Tanggal)
                  </span>
                </label>
                <p className="text-[11px] text-slate-400 dark:text-slate-400 ml-6 mt-0.5">
                  Centang jika acara memakan waktu lebih dari 1 hari (contoh: UTS, Sidang Gelombang I).
                </p>
              </div>

              {/* Input Tanggal */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    {formAgendaIsMultiDay ? "Tanggal Mulai" : "Tanggal Pelaksanaan"}{" "}
                    <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formAgendaTanggalMulai}
                    onChange={(e) => {
                      setFormAgendaTanggalMulai(e.target.value);
                      if (!formAgendaTanggalSelesai || formAgendaTanggalSelesai < e.target.value) {
                        setFormAgendaTanggalSelesai(e.target.value);
                      }
                    }}
                    className="w-full px-3.5 py-2.5 rounded-none border border-[#00296E]/20 dark:border-white/15 bg-slate-50 dark:bg-[#001740] text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#00296E] dark:focus:ring-[#38BDF8] transition-all"
                  />
                </div>

                {formAgendaIsMultiDay && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Tanggal Selesai <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      min={formAgendaTanggalMulai}
                      value={formAgendaTanggalSelesai}
                      onChange={(e) => setFormAgendaTanggalSelesai(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-none border border-[#00296E]/20 dark:border-white/15 bg-slate-50 dark:bg-[#001740] text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#00296E] dark:focus:ring-[#38BDF8] transition-all"
                    />
                  </div>
                )}
              </div>

              {/* Waktu & Lokasi */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Waktu / Jam Pelaksanaan
                  </label>
                  <input
                    type="text"
                    value={formAgendaWaktu}
                    onChange={(e) => setFormAgendaWaktu(e.target.value)}
                    placeholder="Contoh: 08.30 - 15.00 WIB atau Sepanjang Hari"
                    className="w-full px-3.5 py-2.5 rounded-none border border-[#00296E]/20 dark:border-white/15 bg-slate-50 dark:bg-[#001740] text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#00296E] dark:focus:ring-[#38BDF8] transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Lokasi Pelaksanaan
                  </label>
                  <input
                    type="text"
                    value={formAgendaLokasi}
                    onChange={(e) => setFormAgendaLokasi(e.target.value)}
                    placeholder="Contoh: Auditorium Utama / Online (Zoom)"
                    className="w-full px-3.5 py-2.5 rounded-none border border-[#00296E]/20 dark:border-white/15 bg-slate-50 dark:bg-[#001740] text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#00296E] dark:focus:ring-[#38BDF8] transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />
                </div>
              </div>

              {/* Deskripsi */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Keterangan / Deskripsi Acara
                </label>
                <textarea
                  rows={2}
                  value={formAgendaDeskripsi}
                  onChange={(e) => setFormAgendaDeskripsi(e.target.value)}
                  placeholder="Keterangan singkat mengenai agenda atau sasaran kegiatan..."
                  className="w-full px-3.5 py-2.5 rounded-none border border-[#00296E]/20 dark:border-white/15 bg-slate-50 dark:bg-[#001740] text-slate-900 dark:text-white text-xs font-normal focus:outline-none focus:ring-1 focus:ring-[#00296E] dark:focus:ring-[#38BDF8] transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-[#00296E]/15 dark:border-white/10 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  disabled={savingAgenda}
                  onClick={() => setIsAgendaModalOpen(false)}
                  className="px-4 py-2.5 rounded-none border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 transition-colors cursor-pointer disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingAgenda}
                  className="px-5 py-2.5 rounded-none bg-[#00296E] dark:bg-[#38BDF8] hover:bg-[#001f54] dark:hover:bg-[#0284C7] text-white dark:text-[#001740] text-xs font-bold transition-all shadow-none flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {savingAgenda ? (
                    <>
                      <ArrowsClockwise className="w-3.5 h-3.5 animate-spin text-white dark:text-[#001740]" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#38BDF8] dark:text-[#001740]" />
                      <span>{editingAgenda ? "Simpan Perubahan" : "Terbitkan Agenda"}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POPUP MODAL: KONFIRMASI HAPUS AGENDA KALENDER */}
      {agendaToDelete && (
        <div
          className="no-print fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => !deletingAgenda && setAgendaToDelete(null)}
        >
          <div
            className="relative w-full max-w-sm rounded-none bg-white dark:bg-[#001438] p-6 shadow-none animate-in zoom-in-95 duration-200 border border-[#00296E]/20 dark:border-white/10 text-center text-slate-900 dark:text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-none bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 flex items-center justify-center mx-auto mb-4">
              <Trash className="w-6 h-6" />
            </div>

            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              Hapus Agenda Kalender?
            </h3>

            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
              Anda akan menghapus agenda berikut dari kalender organisasi:
            </p>

            {/* Preview Agenda yang akan dihapus */}
            <div className="mt-4 p-3 bg-slate-50 dark:bg-white/5 rounded-none border border-[#00296E]/15 dark:border-white/10 text-left">
              <span
                className={`inline-block px-2 py-0.5 rounded-none text-[9px] font-bold mb-1 ${
                  getCategoryMeta(agendaToDelete.kategori).bgBadge
                } ${getCategoryMeta(agendaToDelete.kategori).textBadge}`}
              >
                {getCategoryMeta(agendaToDelete.kategori).label}
              </span>
              <h4 className="text-xs font-black text-slate-900 dark:text-white leading-snug">
                {agendaToDelete.judul}
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                {agendaToDelete.tanggal_mulai}
                {agendaToDelete.tanggal_selesai && ` s/d ${agendaToDelete.tanggal_selesai}`} &bull; {agendaToDelete.waktu}
              </p>
            </div>

            <div className="mt-4 p-2.5 rounded-none bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-[11px] font-medium text-left">
              Agenda ini tidak akan tampil lagi di kalender publik HIMASI.
            </div>

            <div className="mt-6 flex items-center gap-2.5">
              <button
                type="button"
                disabled={deletingAgenda}
                onClick={() => setAgendaToDelete(null)}
                className="flex-1 py-2.5 rounded-none border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 transition-colors cursor-pointer disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={deletingAgenda}
                onClick={handleConfirmDeleteAgenda}
                className="flex-1 py-2.5 rounded-none bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-none flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {deletingAgenda ? (
                  <>
                    <ArrowsClockwise className="w-3.5 h-3.5 animate-spin" />
                    <span>Menghapus...</span>
                  </>
                ) : (
                  <>
                    <Trash className="w-3.5 h-3.5" />
                    <span>Ya, Hapus</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}



      {/* POPUP MODAL: TAMBAH KEGIATAN BARU */}
      {isTambahKegiatanModalOpen && (
        <div
          className="no-print fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => setIsTambahKegiatanModalOpen(false)}
        >
          <div
            className="relative w-full max-w-md rounded-none bg-white dark:bg-[#001438] p-6 sm:p-7 shadow-none animate-in zoom-in-95 duration-200 border border-[#00296E]/20 dark:border-white/10 text-slate-900 dark:text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-[#00296E]/15 dark:border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-none bg-sky-100 dark:bg-sky-950/40 text-[#00296E] dark:text-[#38BDF8] flex items-center justify-center border border-sky-200 dark:border-sky-800/40">
                  <CalendarBlank className="w-5 h-5 text-[#0094E0] dark:text-[#38BDF8]" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#00296E] dark:text-white">
                    Tambah Kegiatan Baru
                  </h3>
                  <p className="text-xs text-slate-400 dark:text-slate-400">
                    Masukkan nama kegiatan, tanggal, dan jam
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsTambahKegiatanModalOpen(false)}
                className="p-1.5 rounded-none text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSimpanKegiatan} className="mt-5 space-y-4">
              {/* Field 1: Nama Kegiatan */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Nama Kegiatan / Rapat / Acara <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Rapat Pleno Kabinet / Workshop UI/UX"
                  value={formNamaKegiatan}
                  onChange={(e) => setFormNamaKegiatan(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-none border border-[#00296E]/20 dark:border-white/15 bg-slate-50 dark:bg-[#001740] text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#00296E] dark:focus:ring-[#38BDF8] placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
              </div>

              {/* Field 2: Tanggal Pelaksanaan */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Tanggal Pelaksanaan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={formTanggalKegiatan}
                  onChange={(e) => setFormTanggalKegiatan(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-none border border-[#00296E]/20 dark:border-white/15 bg-slate-50 dark:bg-[#001740] text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#00296E] dark:focus:ring-[#38BDF8]"
                />
              </div>

              {/* Field 3: Waktu / Jam */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Waktu / Jam Pelaksanaan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: 08:30 WIB atau 09:00 - 12:00 WIB"
                  value={formJamKegiatan}
                  onChange={(e) => setFormJamKegiatan(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-none border border-[#00296E]/20 dark:border-white/15 bg-slate-50 dark:bg-[#001740] text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#00296E] dark:focus:ring-[#38BDF8] placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
                <p className="text-[11px] text-slate-400 dark:text-slate-400 mt-1">
                  Format waktu akan otomatis dicetak pada lembar rekap PDF ber-kop surat.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#00296E]/15 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setIsTambahKegiatanModalOpen(false)}
                  className="px-4 py-2.5 rounded-none text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 border border-slate-200 dark:border-white/10 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-none bg-[#00296E] dark:bg-[#38BDF8] hover:bg-[#001f54] dark:hover:bg-[#0284C7] text-white dark:text-[#001740] text-xs font-bold transition-all shadow-none flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4 text-[#38BDF8] dark:text-[#001740]" />
                  <span>Simpan & Pilih Kegiatan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: KONFIRMASI HAPUS KEGIATAN (Z-[100] SELALU DI ATAS) */}
      {kegiatanToDelete && (
        <div
          className="no-print fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => !deletingKegiatan && setKegiatanToDelete(null)}
        >
          <div
            className="relative w-full max-w-md rounded-none bg-white dark:bg-[#001438] p-6 sm:p-7 shadow-none animate-in zoom-in-95 duration-200 border border-[#00296E]/20 dark:border-white/10 text-slate-900 dark:text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3.5 pb-4 border-b border-[#00296E]/15 dark:border-white/10">
              <div className="w-11 h-11 rounded-none bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-100 dark:border-rose-900/40">
                <Trash className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Hapus Agenda Kegiatan?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Tindakan ini permanen dan tidak dapat dibatalkan
                </p>
              </div>
            </div>

            <div className="mt-4 p-4 rounded-none bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-900/50 text-xs space-y-1.5">
              <p className="text-slate-600 dark:text-slate-300 font-medium">
                Anda akan menghapus kegiatan:
              </p>
              <p className="text-sm font-black text-rose-800 dark:text-rose-300">
                {kegiatanToDelete.nama}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
                {formatTanggalIndo(kegiatanToDelete.tanggal)} • {kegiatanToDelete.jam}
              </p>
              <p className="text-[11px] text-rose-700 dark:text-rose-300 pt-1.5 font-medium border-t border-rose-200/60 dark:border-rose-900/40 mt-2">
                Seluruh catatan presensi scan QR pengurus untuk kegiatan ini juga akan dihapus dari sistem.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-4 mt-2">
              <button
                type="button"
                disabled={deletingKegiatan}
                onClick={() => setKegiatanToDelete(null)}
                className="px-4 py-2.5 rounded-none text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 border border-slate-200 dark:border-white/10 transition-colors cursor-pointer disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={deletingKegiatan}
                onClick={handleConfirmDeleteKegiatan}
                className="px-5 py-2.5 rounded-none bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-none flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {deletingKegiatan ? (
                  <>
                    <ArrowsClockwise className="w-4 h-4 animate-spin text-white" />
                    <span>Menghapus...</span>
                  </>
                ) : (
                  <>
                    <Trash className="w-4 h-4 text-rose-200" />
                    <span>Ya, Hapus Kegiatan</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3B: KONFIRMASI HAPUS ASPIRASI (Z-[100]) */}
      {aspirasiToDelete && (
        <div
          className="no-print fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => !deletingAspirasi && setAspirasiToDelete(null)}
        >
          <div
            className="relative w-full max-w-md rounded-none bg-white dark:bg-[#001438] p-6 sm:p-7 shadow-none animate-in zoom-in-95 duration-200 border border-[#00296E]/20 dark:border-white/10 text-slate-900 dark:text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3.5 pb-4 border-b border-[#00296E]/15 dark:border-white/10">
              <div className="w-11 h-11 rounded-none bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-100 dark:border-rose-900/40">
                <Trash className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Hapus Catatan Aspirasi?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Data aspirasi akan dihapus permanen dari sistem
                </p>
              </div>
            </div>

            <div className="mt-4 p-4 rounded-none bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-900/50 text-xs space-y-1.5">
              <p className="text-slate-600 dark:text-slate-300 font-medium">
                Pengirim: <strong className="text-slate-900 dark:text-white">{aspirasiToDelete.email}</strong> (Angkatan {aspirasiToDelete.angkatan})
              </p>
              <p className="text-slate-700 dark:text-slate-200 italic border-l-2 border-rose-400 pl-2.5 py-1 text-[11px] line-clamp-3">
                &ldquo;{aspirasiToDelete.pesan}&rdquo;
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-4 mt-2">
              <button
                type="button"
                disabled={deletingAspirasi}
                onClick={() => setAspirasiToDelete(null)}
                className="px-4 py-2.5 rounded-none text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 border border-slate-200 dark:border-white/10 transition-colors cursor-pointer disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={deletingAspirasi}
                onClick={handleConfirmDeleteAspirasi}
                className="px-5 py-2.5 rounded-none bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-none flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {deletingAspirasi ? (
                  <>
                    <ArrowsClockwise className="w-4 h-4 animate-spin text-white" />
                    <span>Menghapus...</span>
                  </>
                ) : (
                  <>
                    <Trash className="w-4 h-4 text-rose-200" />
                    <span>Ya, Hapus Aspirasi</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP MODAL: TAMBAH / EDIT BERITA */}
      {isBeritaModalOpen && (
        <div
          className="no-print fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200"
          onClick={() => !savingBerita && setIsBeritaModalOpen(false)}
        >
          <div
            className="relative w-full max-w-2xl rounded-none bg-white dark:bg-[#001438] p-5 sm:p-6 shadow-none animate-in zoom-in-95 duration-200 border border-[#00296E]/20 dark:border-white/10 my-8 max-h-[90vh] overflow-y-auto text-slate-900 dark:text-white"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-[#00296E]/15 dark:border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-none bg-slate-100 dark:bg-white/10 text-[#00296E] dark:text-[#38BDF8] flex items-center justify-center shrink-0 border border-slate-200 dark:border-white/10">
                  {editingBerita ? (
                    <NotePencil className="w-4 h-4 text-slate-700 dark:text-[#38BDF8]" />
                  ) : (
                    <Newspaper className="w-4 h-4 text-slate-700 dark:text-[#38BDF8]" />
                  )}
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-[#00296E] dark:text-white">
                    {editingBerita ? "Edit Artikel Berita" : "Tulis Artikel Berita Baru"}
                  </h3>
                  <p className="text-xs text-slate-400 dark:text-slate-400 mt-0.5">
                    {editingBerita
                      ? `Perbarui rincian artikel: ${editingBerita.title}`
                      : "Publikasikan Berita, kegiatan, atau pengumuman resmi himpunan."}
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={savingBerita}
                onClick={() => setIsBeritaModalOpen(false)}
                className="p-1.5 rounded-none text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveBerita} className="mt-4 space-y-4">
              {/* Field 1: Judul Berita */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Judul Berita <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Pelantikan Pengurus Kabinet REKSABUDAYA 2026"
                  value={formBeritaTitle}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-none border border-[#00296E]/20 dark:border-white/15 bg-slate-50 dark:bg-[#001740] focus:bg-white dark:focus:bg-[#001740] focus:outline-none focus:ring-1 focus:ring-[#00296E] dark:focus:ring-[#38BDF8] font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
              </div>

              {/* Field 2 & 3: Slug URL & Kategori */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                    <span>Slug URL Khusus:</span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-400 font-normal">Otomatis dari judul</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] font-mono text-slate-400 select-none">
                      /berita/
                    </span>
                    <input
                      type="text"
                      required
                      placeholder="pelantikan-pengurus-2026"
                      value={formBeritaSlug}
                      onChange={(e) => {
                        setFormBeritaSlug(e.target.value);
                        setSlugManuallyEdited(true);
                      }}
                      className="w-full pl-16 pr-3 py-2 text-xs font-mono rounded-none border border-[#00296E]/20 dark:border-white/15 bg-slate-50 dark:bg-[#001740] focus:bg-white dark:focus:bg-[#001740] focus:outline-none focus:ring-1 focus:ring-[#00296E] dark:focus:ring-[#38BDF8] text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Kategori Berita:
                  </label>
                  <select
                    value={formBeritaCategoryKey}
                    onChange={(e) => {
                      const selected = KATEGORI_BERITA.find((k) => k.key === e.target.value);
                      if (selected) {
                        setFormBeritaCategoryKey(selected.key);
                        setFormBeritaCategoryLabel(selected.label);
                      }
                    }}
                    className="w-full px-3 py-2 text-xs rounded-none border border-[#00296E]/20 dark:border-white/15 focus:outline-none focus:ring-1 focus:ring-[#00296E] dark:focus:ring-[#38BDF8] bg-slate-50 dark:bg-[#001740] cursor-pointer font-medium text-slate-900 dark:text-white"
                  >
                    {KATEGORI_BERITA.map((k) => (
                      <option key={k.key} value={k.key}>
                        {k.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Field 4 & 5: Penulis & Waktu Baca */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Penulis / Departemen:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Departemen Medkominfo"
                    value={formBeritaAuthor}
                    onChange={(e) => setFormBeritaAuthor(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-none border border-[#00296E]/20 dark:border-white/15 bg-slate-50 dark:bg-[#001740] focus:bg-white dark:focus:bg-[#001740] focus:outline-none focus:ring-1 focus:ring-[#00296E] dark:focus:ring-[#38BDF8] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Estimasi Waktu Baca:
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: 5 min read"
                    value={formBeritaReadTime}
                    onChange={(e) => setFormBeritaReadTime(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-none border border-[#00296E]/20 dark:border-white/15 bg-slate-50 dark:bg-[#001740] focus:bg-white dark:focus:bg-[#001740] focus:outline-none focus:ring-1 focus:ring-[#00296E] dark:focus:ring-[#38BDF8] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />
                </div>
              </div>

              {/* Field 6: Sistem Unggah Foto Sampul Berita */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-[#0094E0] dark:text-[#38BDF8]" />
                    <span>Foto Sampul Berita (Cover Image):</span>
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-400 font-normal">
                    Format: JPG, PNG, WebP (Rasio ideal 16:9)
                  </span>
                </label>

                {/* Input File Tersembunyi */}
                <input
                  type="file"
                  ref={beritaFileInputRef}
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      processAndUploadBeritaPhoto(file);
                    }
                    e.target.value = "";
                  }}
                />

                {formBeritaImage ? (
                  /* Kartu Pratinjau Foto Sampul Terpasang */
                  <div className="relative rounded-none border border-[#00296E]/20 dark:border-white/10 overflow-hidden bg-slate-100 dark:bg-black/30 group shadow-none">
                    <div className="relative w-full aspect-[16/8] sm:aspect-[16/7] overflow-hidden">
                      <img
                        src={formBeritaImage}
                        alt="Preview Sampul Berita"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = "/DSC01203.png";
                        }}
                      />

                      {/* Badge Status Terpasang */}
                      <div className="absolute top-3 left-3 bg-[#00296E]/90 dark:bg-[#001438]/90 backdrop-blur-xs text-white text-[11px] font-bold px-3 py-1 rounded-none border border-white/20 shadow-none flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Foto Sampul Terpasang</span>
                      </div>

                      {/* Overlay Tombol Aksi Desktop */}
                      <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-4">
                        <button
                          type="button"
                          disabled={uploadingBeritaImage}
                          onClick={() => beritaFileInputRef.current?.click()}
                          className="px-4 py-2 rounded-none bg-white dark:bg-white/10 hover:bg-slate-100 dark:hover:bg-white/15 text-slate-800 dark:text-white text-xs font-bold shadow-none flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 border border-slate-200 dark:border-white/10"
                        >
                          <UploadSimple className="w-3.5 h-3.5 text-[#0094E0]" />
                          <span>Ganti Foto</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormBeritaImage("")}
                          className="px-4 py-2 rounded-none bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-none flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <Trash className="w-3.5 h-3.5" />
                          <span>Hapus</span>
                        </button>
                      </div>
                    </div>

                    {/* Tombol Aksi Mobile / Sentuh */}
                    <div className="flex sm:hidden items-center justify-between p-2.5 bg-white dark:bg-[#001438] border-t border-[#00296E]/15 dark:border-white/10">
                      <button
                        type="button"
                        onClick={() => beritaFileInputRef.current?.click()}
                        className="text-xs font-bold text-[#0094E0] dark:text-[#38BDF8] flex items-center gap-1 py-1 px-2 cursor-pointer"
                      >
                        <UploadSimple className="w-3.5 h-3.5" />
                        <span>Ganti Foto</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormBeritaImage("")}
                        className="text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1 py-1 px-2 cursor-pointer"
                      >
                        <Trash className="w-3.5 h-3.5" />
                        <span>Hapus Foto</span>
                      </button>
                    </div>

                    {/* Indikator Loading saat Unggah Ulang */}
                    {uploadingBeritaImage && (
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center text-white text-xs font-bold gap-2">
                        <ArrowsClockwise className="w-6 h-6 animate-spin text-sky-300" />
                        <span>Sedang mengompresi & mengunggah foto...</span>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Area Dropzone Unggah Berkas */
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDraggingOverBerita(true);
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      setIsDraggingOverBerita(false);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDraggingOverBerita(false);
                      const file = e.dataTransfer.files?.[0];
                      if (file) {
                        processAndUploadBeritaPhoto(file);
                      }
                    }}
                    onClick={() => beritaFileInputRef.current?.click()}
                    className={`relative rounded-none border border-dashed p-6 sm:p-8 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-2.5 ${
                      isDraggingOverBerita
                        ? "border-[#0094E0] bg-sky-50/80 dark:bg-sky-950/30"
                        : "border-[#00296E]/20 dark:border-white/15 hover:border-[#0094E0] bg-slate-50 dark:bg-white/5"
                    }`}
                  >
                    <div className="w-12 h-12 rounded-none bg-sky-50 dark:bg-white/10 text-[#00296E] dark:text-[#38BDF8] flex items-center justify-center shadow-none">
                      <UploadSimple className="w-6 h-6 text-[#0094E0] dark:text-[#38BDF8]" />
                    </div>

                    <div>
                      <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                        {uploadingBeritaImage
                          ? "Sedang memproses foto..."
                          : "Klik atau seret (drag & drop) berkas foto ke sini"}
                      </p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-400 mt-1">
                        Format: PNG, JPG, JPEG, atau WebP (otomatis dikompresi)
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={uploadingBeritaImage}
                      onClick={(e) => {
                        e.stopPropagation();
                        beritaFileInputRef.current?.click();
                      }}
                      className="mt-1 px-4 py-2 rounded-none bg-[#00296E] dark:bg-[#38BDF8] hover:bg-[#001f54] dark:hover:bg-[#0284C7] text-white dark:text-[#001740] text-xs font-bold transition-all shadow-none flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <UploadSimple className="w-3.5 h-3.5 text-sky-300 dark:text-[#001740]" />
                      <span>{uploadingBeritaImage ? "Memproses..." : "Pilih Foto dari Perangkat"}</span>
                    </button>

                    {/* Loading Overlay */}
                    {uploadingBeritaImage && (
                      <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 rounded-none flex flex-col items-center justify-center gap-2">
                        <ArrowsClockwise className="w-6 h-6 animate-spin text-[#00296E] dark:text-[#38BDF8]" />
                        <span className="text-xs font-bold text-slate-800 dark:text-white">Mengompresi & mengunggah gambar...</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Field 7: Ringkasan / Excerpt */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                  <span>Ringkasan Singkat (Excerpt):</span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-400 font-normal">Tampil pada kartu beranda/katalog</span>
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Ringkasan 1-2 kalimat pengantar isi berita..."
                  value={formBeritaExcerpt}
                  onChange={(e) => setFormBeritaExcerpt(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-none border border-[#00296E]/20 dark:border-white/15 bg-slate-50 dark:bg-[#001740] focus:bg-white dark:focus:bg-[#001740] focus:outline-none focus:ring-1 focus:ring-[#00296E] dark:focus:ring-[#38BDF8] text-slate-900 dark:text-white leading-relaxed placeholder:text-slate-400 dark:placeholder:text-slate-500 resize-none"
                />
              </div>

              {/* Field 8: Konten Berita Lengkap */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                  <span>Isi Konten Artikel Lengkap:</span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-400 font-mono">
                    {formBeritaContent.split(/\s+/).filter(Boolean).length} kata &bull; {formBeritaReadTime}
                  </span>
                </label>
                <textarea
                  rows={7}
                  required
                  placeholder="Tuliskan berita lengkap di sini. Gunakan baris baru antar paragraf..."
                  value={formBeritaContent}
                  onChange={(e) => handleContentChange(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs rounded-none border border-[#00296E]/20 dark:border-white/15 bg-slate-50 dark:bg-[#001740] focus:bg-white dark:focus:bg-[#001740] focus:outline-none focus:ring-1 focus:ring-[#00296E] dark:focus:ring-[#38BDF8] text-slate-900 dark:text-white leading-relaxed placeholder:text-slate-400 dark:placeholder:text-slate-500 font-normal"
                />
              </div>

              {/* Checkbox Status Terbit */}
              <div className="flex items-center justify-between p-3 rounded-none bg-slate-50 dark:bg-white/5 border border-[#00296E]/15 dark:border-white/10">
                <label htmlFor="formBeritaIsPublished" className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    id="formBeritaIsPublished"
                    checked={formBeritaIsPublished}
                    onChange={(e) => setFormBeritaIsPublished(e.target.checked)}
                    className="w-4 h-4 rounded-none text-[#00296E] focus:ring-[#00296E] cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Publikasikan Sekarang (Status Terbit)
                    </span>
                    <p className="text-[10px] text-slate-400 dark:text-slate-400">
                      Jika dinonaktifkan, berita disimpan sebagai Draf dan tidak muncul di halaman publik.
                    </p>
                  </div>
                </label>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-none ${
                    formBeritaIsPublished
                      ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40"
                      : "bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  {formBeritaIsPublished ? "Terbit" : "Draft"}
                </span>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#00296E]/15 dark:border-white/10">
                <button
                  type="button"
                  disabled={savingBerita}
                  onClick={() => setIsBeritaModalOpen(false)}
                  className="px-4 py-2 rounded-none text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 border border-slate-200 dark:border-white/10 transition-colors cursor-pointer disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingBerita}
                  className="px-5 py-2 rounded-none bg-[#00296E] dark:bg-[#38BDF8] hover:bg-[#001f54] dark:hover:bg-[#0284C7] text-white dark:text-[#001740] text-xs font-bold transition-all shadow-none flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {savingBerita ? (
                    <>
                      <ArrowsClockwise className="w-3.5 h-3.5 animate-spin text-white dark:text-[#001740]" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#38BDF8] dark:text-[#001740]" />
                      <span>{editingBerita ? "Perbarui Berita" : "Terbitkan Berita"}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POPUP MODAL: KONFIRMASI HAPUS BERITA */}
      {beritaToDelete && (
        <div
          className="no-print fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => !deletingBerita && setBeritaToDelete(null)}
        >
          <div
            className="relative w-full max-w-md rounded-none bg-white dark:bg-[#001438] p-5 sm:p-6 shadow-none animate-in zoom-in-95 duration-200 border border-[#00296E]/20 dark:border-white/10 text-slate-900 dark:text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 pb-3 border-b border-[#00296E]/15 dark:border-white/10">
              <div className="w-10 h-10 rounded-none bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 flex items-center justify-center shrink-0">
                <Trash className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  Hapus Artikel Berita?
                </h3>
                <p className="text-xs text-slate-400 dark:text-slate-400 mt-0.5">
                  Tindakan ini tidak dapat dibatalkan.
                </p>
              </div>
            </div>

            <div className="mt-3.5 p-3 rounded-none bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-900/50 text-xs">
              <p className="text-slate-700 dark:text-slate-300 font-bold line-clamp-2">
                &ldquo;{beritaToDelete.title}&rdquo;
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-mono">
                /berita/{beritaToDelete.slug}
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 mt-2">
              <button
                type="button"
                disabled={deletingBerita}
                onClick={() => setBeritaToDelete(null)}
                className="px-4 py-2 rounded-none text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 border border-slate-200 dark:border-white/10 transition-colors cursor-pointer disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={deletingBerita}
                onClick={handleConfirmDeleteBerita}
                className="px-4 py-2 rounded-none bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-none flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {deletingBerita ? (
                  <>
                    <ArrowsClockwise className="w-3.5 h-3.5 animate-spin text-white" />
                    <span>Menghapus...</span>
                  </>
                ) : (
                  <>
                    <Trash className="w-3.5 h-3.5 text-rose-200" />
                    <span>Ya, Hapus Artikel</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP MODAL: TOLAK Berita DENGAN CATATAN REVISI */}
      {rejectingBeritaItem && (
        <div
          className="no-print fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => setRejectingBeritaItem(null)}
        >
          <div
            className="relative w-full max-w-md rounded-none bg-white dark:bg-[#001438] p-5 sm:p-6 shadow-none animate-in zoom-in-95 duration-200 border border-[#00296E]/20 dark:border-white/10 text-slate-900 dark:text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 pb-3 border-b border-[#00296E]/15 dark:border-white/10">
              <div className="w-10 h-10 rounded-none bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50 flex items-center justify-center shrink-0">
                <WarningCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  Kembalikan Berita untuk Revisi
                </h3>
                <p className="text-xs text-slate-400 dark:text-slate-400 mt-0.5">
                  Berikan catatan perbaikan kepada kontributor Berita.
                </p>
              </div>
            </div>

            <div className="mt-3.5 p-3 rounded-none bg-slate-50 dark:bg-white/5 border border-[#00296E]/15 dark:border-white/10 text-xs">
              <p className="text-slate-700 dark:text-slate-300 font-bold line-clamp-1">
                &ldquo;{rejectingBeritaItem.title}&rdquo;
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Penulis: {rejectingBeritaItem.author} &bull; /berita/{rejectingBeritaItem.slug}
              </p>
            </div>

            <div className="mt-3">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Catatan Revisi / Alasan Penolakan: <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                required
                value={catatanRevisiBerita}
                onChange={(e) => setCatatanRevisiBerita(e.target.value)}
                placeholder="Contoh: Tolong perbaiki resolusi foto sampul dan lengkapi rincian narasumber..."
                className="w-full p-2.5 text-xs rounded-none border border-[#00296E]/20 dark:border-white/15 bg-slate-50 dark:bg-[#001740] focus:bg-white dark:focus:bg-[#001740] focus:outline-none focus:ring-1 focus:ring-[#00296E] dark:focus:ring-[#38BDF8] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 leading-relaxed resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 mt-2">
              <button
                type="button"
                onClick={() => {
                  setRejectingBeritaItem(null);
                  setCatatanRevisiBerita("");
                }}
                className="px-4 py-2 rounded-none text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 border border-slate-200 dark:border-white/10 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={!catatanRevisiBerita.trim()}
                onClick={handleConfirmRejectBerita}
                className="px-4 py-2 rounded-none bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-none flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <span>Kirim Catatan &amp; Tolak</span>
              </button>
            </div>
          </div>
        </div>
      )}



      {/* FLOATING TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="no-print fixed bottom-6 right-6 z-[110] max-w-md animate-in slide-in-from-bottom-5 duration-300">
          <div className="bg-[#00296E] text-white px-4 py-3 rounded-2xl shadow-2xl border border-sky-400/30 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="text-xs font-semibold">{toastMessage}</span>
            <button
              type="button"
              onClick={() => setToastMessage(null)}
              className="ml-auto text-sky-200 hover:text-white text-xs font-bold p-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
