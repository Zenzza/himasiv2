"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  MessageSquare,
  Newspaper,
  Calendar,
  Users,
  Database,
  LogOut,
  Sparkles,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Trash2,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  FileCode,
  Copy,
  Check,
  Menu,
  X,
  XCircle,
  Plus,
  ShieldAlert,
  ShieldCheck,
  User,
  ArrowUpRight,
  QrCode,
  ScanLine,
  IdCard,
  UserCheck,
  Download,
  Printer,
  ChevronDown,
  FileSpreadsheet,
  FileText,
  Eye,
  Table as TableIcon,
  Edit3,
  UserPlus,
  Image as ImageIcon,
  Upload,
  Camera,
  FolderCheck,
  FolderOpen,
  Monitor,
  Smartphone,
  MapPin,
  CalendarDays,
  Shirt,
  Trophy,
  Award,
  Lock,
  Unlock,
} from "lucide-react";
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
import ApresiasiManager from "@/components/dashboard/apresiasi-manager";
import UserManager from "@/components/dashboard/user-manager";
import {
  type UserRole,
  type ContentStatus,
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
  const [activeTab, setActiveTab] = useState<
    "overview" | "absensi" | "rekap-absensi" | "kartu-qr" | "dokumen" | "aspirasi" | "berita" | "kalender" | "database" | "banner" | "apresiasi" | "users"
  >("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>("humas_biskraf");

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

  // Sub-tab Home Page di Dashboard: "banner" | "fitur"
  const [homeSubTab, setHomeSubTab] = useState<"banner" | "fitur">("banner");

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
        showToast(
          isApprover
            ? "Berhasil memperbarui artikel berita!"
            : "Warta diperbarui dan diajukan ulang untuk ditinjau Medkominfo."
        );
      } else {
        await createBerita(payload);
        showToast(
          isApprover
            ? "Berhasil menerbitkan artikel berita baru!"
            : "Warta berhasil disimpan & dikirim ke antrean review Medkominfo."
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
      showToast(`Warta "${item.title}" disetujui & langsung diterbitkan!`);
    } catch (err: any) {
      console.error("Approve berita error:", err);
      showToast("Gagal menyetujui warta: " + (err.message || "Terjadi kesalahan"));
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
      showToast("Warta dikembalikan dengan catatan revisi untuk kontributor.");
      setRejectingBeritaItem(null);
      setCatatanRevisiBerita("");
    } catch (err: any) {
      console.error("Reject berita error:", err);
      showToast("Gagal menolak warta.");
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
      showToast(newStatus ? "Status diubah ke Terbit." : "Status diubah ke Draft.");
    } catch (err) {
      console.error("Toggle status error:", err);
      showToast("Gagal mengubah status publikasi.");
    }
  };

  const handleConfirmDeleteBerita = async () => {
    if (!beritaToDelete) return;
    if ((beritaToDelete.is_published || beritaToDelete.status === "published") && !canEditPublishedContent(currentUserRole)) {
      showToast("Wewenang terbatas: Warta yang sudah terbit hanya dapat dihapus oleh Medkominfo / Super Admin.");
      setBeritaToDelete(null);
      return;
    }
    setDeletingBerita(true);
    try {
      await deleteBerita(beritaToDelete.id);
      setBeritaList((prev) => prev.filter((b) => String(b.id) !== String(beritaToDelete.id)));
      showToast(`Artikel "${beritaToDelete.title}" berhasil dihapus.`);
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
    showToast("Berhasil menyimpan konfigurasi Hero Banner Desktop & Mobile!");
  };

  const handleResetBanner = () => {
    const def = resetHeroBannerConfig();
    setBannerConfig(def);
    setFormDesktopImage(def.desktopImage);
    setFormMobileImage(def.mobileImage);
    setFormDesktopPos(def.desktopPosition || "object-[center_65%]");
    setFormMobilePos(def.mobilePosition || "object-center");
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
    showToast("Pengaturan Fitur Utama berhasil disimpan & tersinkronisasi!");
    setSavingFitur(false);
  };

  const handleResetFitur = () => {
    const def = resetFiturUtamaConfig();
    setFiturConfig(def);
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
          }
        } else {
          setUser(null);
          setCurrentUserRole("humas_biskraf");
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
        }
      } else {
        setUser(null);
        setCurrentUserRole("humas_biskraf");
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

  // View Guard: Jika tab yang dipilih tidak diizinkan untuk role saat ini, redirect ke overview
  useEffect(() => {
    if (!authLoading && user && !canAccessTab(currentUserRole, activeTab)) {
      setActiveTab("overview");
      showToast("Akses dibatasi sesuai peran wewenang Anda. Dialihkan ke Ringkasan.");
    }
  }, [activeTab, currentUserRole, authLoading, user]);

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

-- 11. REFRESH SCHEMA CACHE & REALTIME PUBLICATION
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.kegiatan_absensi, public.absensi_log, public.aspirasi, public.pengurus, public.dokumen_organisasi, public.agenda_kalender, public.apresiasi_showcase, public.apresiasi_submisi;
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
          <RefreshCw className="w-4 h-4 animate-spin text-sky-400" />
          <span>Memeriksa hak akses pengurus...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      
      {/* Main App Layout */}
      <div className="flex flex-1 relative overflow-hidden">
        
        {/* Sidebar Navigasi Dashboard (Disebut no-print agar tidak muncul di cetak PDF) */}
        <aside
          className={`no-print fixed inset-y-0 left-0 z-40 w-64 bg-white text-slate-800 border-r border-slate-200/80 flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {/* Header Sidebar: Brand HIMASI */}
          <div>
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
              <Link href="/" className="flex items-center gap-2.5 group">
                <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 p-1 flex items-center justify-center shadow-xs">
                  <img
                    src="/logo-himasi.png"
                    alt="Logo HIMASI"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <h2 className="font-bold text-sm text-[#00296E] tracking-tight leading-none">
                    HIMASI Admin
                  </h2>
                  <span className="text-[10px] text-slate-400 font-medium">
                    Kabinet REKSABUDAYA
                  </span>
                </div>
              </Link>

              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Menu Navigasi Terkategori Berdasarkan Halaman & Operasional */}
            <nav className="p-3 space-y-4 overflow-y-auto max-h-[calc(100vh-160px)]">
              {/* Seksi 1: Ringkasan Utama */}
              <div>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("overview");
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    activeTab === "overview"
                      ? "bg-slate-100 text-[#00296E] font-bold shadow-xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <LayoutDashboard className={`w-4 h-4 ${activeTab === "overview" ? "text-[#00296E]" : "text-slate-400"}`} />
                    <span>Ringkasan Dashboard</span>
                  </div>
                </button>
              </div>

              {/* Seksi 2: Kontrol Halaman Front-End */}
              <div className="space-y-1">
                <div className="px-3 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Kontrol Halaman
                </div>

                {/* Home Page (Hero Banner Mobile & Desktop + Fitur Utama) */}
                {canAccessTab(currentUserRole, "banner") && (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("banner");
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      activeTab === "banner"
                        ? "bg-slate-100 text-[#00296E] font-bold shadow-xs"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <ImageIcon className={`w-4 h-4 ${activeTab === "banner" ? "text-[#00296E]" : "text-slate-400"}`} />
                      <span>Home Page (Banner &amp; Fitur)</span>
                    </div>
                  </button>
                )}

                {/* Berita Page */}
                {canAccessTab(currentUserRole, "berita") && (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("berita");
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      activeTab === "berita"
                        ? "bg-slate-100 text-[#00296E] font-bold shadow-xs"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Newspaper className={`w-4 h-4 ${activeTab === "berita" ? "text-[#00296E]" : "text-slate-400"}`} />
                      <span>Berita Page (Warta)</span>
                    </div>
                  </button>
                )}

                {/* Kabinet & Profil */}
                {canAccessTab(currentUserRole, "kartu-qr") && (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("kartu-qr");
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      activeTab === "kartu-qr"
                        ? "bg-slate-100 text-[#00296E] font-bold shadow-xs"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Users className={`w-4 h-4 ${activeTab === "kartu-qr" ? "text-[#00296E]" : "text-slate-400"}`} />
                      <span>Kabinet &amp; Profil</span>
                    </div>
                  </button>
                )}

                {/* Dokumen Organisasi */}
                {canAccessTab(currentUserRole, "dokumen") && (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("dokumen");
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      activeTab === "dokumen"
                        ? "bg-slate-100 text-[#00296E] font-bold shadow-xs"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <FileText className={`w-4 h-4 ${activeTab === "dokumen" ? "text-[#00296E]" : "text-slate-400"}`} />
                      <span>Dokumen Organisasi</span>
                    </div>
                  </button>
                )}

                {/* Kalender Page */}
                {canAccessTab(currentUserRole, "kalender") && (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("kalender");
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      activeTab === "kalender"
                        ? "bg-slate-100 text-[#00296E] font-bold shadow-xs"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Calendar className={`w-4 h-4 ${activeTab === "kalender" ? "text-[#00296E]" : "text-slate-400"}`} />
                      <span>Kalender Page</span>
                    </div>
                  </button>
                )}

                {/* Aspirasi Masuk */}
                {canAccessTab(currentUserRole, "aspirasi") && (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("aspirasi");
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      activeTab === "aspirasi"
                        ? "bg-slate-100 text-[#00296E] font-bold shadow-xs"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <MessageSquare className={`w-4 h-4 ${activeTab === "aspirasi" ? "text-[#00296E]" : "text-slate-400"}`} />
                      <span>Aspirasi Mahasiswa</span>
                    </div>
                  </button>
                )}

                {/* Apresia-SI (Prestasi & Karya) */}
                {canAccessTab(currentUserRole, "apresiasi") && (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("apresiasi");
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      activeTab === "apresiasi"
                        ? "bg-slate-100 text-[#00296E] font-bold shadow-xs"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Trophy className={`w-4 h-4 ${activeTab === "apresiasi" ? "text-amber-500" : "text-slate-400"}`} />
                      <span>Apresia-SI (Prestasi &amp; Karya)</span>
                    </div>
                  </button>
                )}
              </div>

              {/* Seksi 3: Operasional Absensi */}
              {(canAccessTab(currentUserRole, "absensi") || canAccessTab(currentUserRole, "rekap-absensi")) && (
                <div className="space-y-1">
                  <div className="px-3 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Operasional Absensi
                  </div>

                  {/* Scan Absensi QR */}
                  {canAccessTab(currentUserRole, "absensi") && (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab("absensi");
                        setSidebarOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                        activeTab === "absensi"
                          ? "bg-slate-100 text-[#00296E] font-bold shadow-xs"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <ScanLine className={`w-4 h-4 ${activeTab === "absensi" ? "text-[#00296E]" : "text-slate-400"}`} />
                        <span>Scan Absensi QR</span>
                      </div>
                    </button>
                  )}

                  {/* Rekapitulasi PDF */}
                  {canAccessTab(currentUserRole, "rekap-absensi") && (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab("rekap-absensi");
                        setSidebarOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                        activeTab === "rekap-absensi"
                          ? "bg-slate-100 text-[#00296E] font-bold shadow-xs"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <FileSpreadsheet className={`w-4 h-4 ${activeTab === "rekap-absensi" ? "text-[#00296E]" : "text-slate-400"}`} />
                        <span>Rekapitulasi PDF</span>
                      </div>
                    </button>
                  )}
                </div>
              )}

              {/* Seksi 4: Sistem & Pengguna */}
              {(canAccessTab(currentUserRole, "users") || canAccessTab(currentUserRole, "database")) && (
                <div className="space-y-1">
                  <div className="px-3 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Sistem &amp; Pengguna
                  </div>

                  {/* Manajemen Pengguna (Khusus Super Admin) */}
                  {canAccessTab(currentUserRole, "users") && (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab("users");
                        setSidebarOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                        activeTab === "users"
                          ? "bg-slate-100 text-[#00296E] font-bold shadow-xs"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <ShieldCheck className={`w-4 h-4 ${activeTab === "users" ? "text-purple-600" : "text-slate-400"}`} />
                        <span>Manajemen Pengguna</span>
                      </div>
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                    </button>
                  )}

                  {/* Database Supabase (Khusus Super Admin) */}
                  {canAccessTab(currentUserRole, "database") && (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab("database");
                        setSidebarOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                        activeTab === "database"
                          ? "bg-slate-100 text-[#00296E] font-bold shadow-xs"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Database className={`w-4 h-4 ${activeTab === "database" ? "text-[#00296E]" : "text-slate-400"}`} />
                        <span>Database Supabase</span>
                      </div>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    </button>
                  )}
                </div>
              )}
            </nav>
          </div>

          {/* Footer Sidebar: User & Links */}
          <div className="p-3 border-t border-slate-100 space-y-1.5">
            <Link
              href="/"
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-[#00296E] hover:bg-slate-50 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              <span>Lihat Website Front-End</span>
            </Link>

            {user ? (
              <div className="space-y-1">
                <div className="px-2.5 py-1 flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-800 truncate">
                    {user.full_name?.split(" ")[0] || "Admin"}
                  </span>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${ROLE_BADGE_STYLES[currentUserRole] || "bg-slate-100 text-slate-700"}`}>
                    {ROLE_LABELS[currentUserRole]?.split(" ")[0]}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-500" />
                  <span>Keluar Akun</span>
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#0094E0] hover:bg-sky-50 transition-colors"
              >
                <User className="w-3.5 h-3.5 text-[#0094E0]" />
                <span>Masuk Akun Pengurus</span>
              </Link>
            )}
          </div>
        </aside>

        {/* Mobile Backdrop */}
        {sidebarOpen && (
          <div
            className="no-print fixed inset-0 bg-black/60 backdrop-blur-xs z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Area Konten Utama */}
        <main className="flex-1 flex flex-col min-w-0 overflow-y-auto max-h-screen bg-[#F8FAFC]">
          
          {/* Topbar Dashboard - Clean Minimal */}
          <header className="no-print bg-white border-b border-slate-200/80 px-4 sm:px-6 py-3 flex items-center justify-between sticky top-0 z-20">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 cursor-pointer"
                aria-label="Buka Menu"
              >
                <Menu className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2 text-xs">
                <span className="font-semibold text-slate-400">Dashboard</span>
                <span className="text-slate-300">/</span>
                <span className="font-bold text-[#00296E]">
                  {activeTab === "overview" && "Ringkasan"}
                  {activeTab === "banner" && (homeSubTab === "banner" ? "Home Page (Hero Banner)" : "Home Page (Fitur Utama)")}
                  {activeTab === "berita" && "Berita Page (Warta)"}
                  {activeTab === "kartu-qr" && "Kabinet & Profil"}
                  {activeTab === "dokumen" && "Dokumen Organisasi"}
                  {activeTab === "kalender" && "Kalender Page"}
                  {activeTab === "aspirasi" && "Aspirasi Mahasiswa"}
                  {activeTab === "apresiasi" && "Apresia-SI (Karya & Prestasi)"}
                  {activeTab === "absensi" && "Scan Absensi QR"}
                  {activeTab === "rekap-absensi" && "Rekapitulasi PDF"}
                  {activeTab === "database" && "Database Supabase"}
                  {activeTab === "users" && "Manajemen Pengguna & Hak Akses"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              {/* Badge Role Aktif di Header */}
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border shadow-2xs ${ROLE_BADGE_STYLES[currentUserRole] || "bg-slate-100 text-slate-700"}`}>
                {ROLE_LABELS[currentUserRole] || currentUserRole}
              </span>

              <div className="h-3.5 w-px bg-slate-200" />

              <button
                type="button"
                onClick={fetchAspirasi}
                disabled={loadingAspirasi}
                title="Muat Ulang Data"
                className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-[#00296E] hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${loadingAspirasi ? "animate-spin text-[#0094E0]" : ""}`}
                />
              </button>

              <div className="h-3.5 w-px bg-slate-200" />

              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span className="hidden sm:inline">Online</span>
              </div>
            </div>
          </header>

          {/* Body Konten Sesuai Tab Terpilih */}
          <div className="p-4 sm:p-6 lg:p-8 space-y-5">

            {/* TAB 1: OVERVIEW / RINGKASAN */}
            {activeTab === "overview" && (
              <div className="space-y-5 animate-in fade-in duration-200">
                
                {/* Header Ringkasan Bersih (Tanpa Gradien Tebal) */}
                <div className="bg-white border border-slate-200/80 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-[#00296E] tracking-tight">
                      Ringkasan Operasional &amp; Kontrol Front-End
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Pusat pengelolaan konten halaman website dan rekapitulasi kehadiran pengurus kabinet.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href="/"
                      target="_blank"
                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:text-[#00296E] hover:border-slate-300 text-xs font-semibold transition-all bg-white shadow-2xs flex items-center gap-1.5"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                      <span>Lihat Web</span>
                    </Link>
                    <button
                      type="button"
                      onClick={() => setIsTambahKegiatanModalOpen(true)}
                      className="px-3.5 py-1.5 rounded-lg bg-[#00296E] hover:bg-[#001f54] text-white text-xs font-semibold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Kegiatan Baru</span>
                    </button>
                  </div>
                </div>

                {/* 3 Kartu Metrik Ringkas & Bersih */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div
                    onClick={() => setActiveTab("absensi")}
                    className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs cursor-pointer hover:border-slate-300 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-500">Kehadiran Hari Ini</span>
                      <ScanLine className="w-4 h-4 text-slate-400" />
                    </div>
                    <div className="text-2xl font-bold text-[#00296E] mt-1.5">
                      {currentLogs.length} <span className="text-xs font-normal text-slate-400">/ {studentPengurusList.length} Pengurus</span>
                    </div>
                    <div className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span>{totalHadir} hadir tercatat</span>
                    </div>
                  </div>

                  <div
                    onClick={() => setActiveTab("aspirasi")}
                    className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs cursor-pointer hover:border-slate-300 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-500">Aspirasi Mahasiswa</span>
                      <MessageSquare className="w-4 h-4 text-slate-400" />
                    </div>
                    <div className="text-2xl font-bold text-[#00296E] mt-1.5">
                      {aspirasiList.length} <span className="text-xs font-normal text-slate-400">Pesan</span>
                    </div>
                    <div className="text-[11px] text-sky-600 font-medium mt-1 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                      <span>{countBaru} pesan baru</span>
                    </div>
                  </div>

                  <div
                    onClick={() => setActiveTab("banner")}
                    className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs cursor-pointer hover:border-slate-300 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-500">Hero Banner Beranda</span>
                      <ImageIcon className="w-4 h-4 text-slate-400" />
                    </div>
                    <div className="text-2xl font-bold text-[#00296E] mt-1.5">
                      Aktif
                    </div>
                    <div className="text-[11px] text-slate-500 font-medium mt-1 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                      <span>Dual Desktop &amp; Mobile</span>
                    </div>
                  </div>
                </div>

                {/* Akses Cepat Kontrol Front-End & Absensi */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                  {/* Kolom Kiri: Akses Cepat Halaman Front-End */}
                  <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-slate-100">
                        <h3 className="font-bold text-xs sm:text-sm text-[#00296E]">Kontrol Cepat Halaman Front-End</h3>
                        <span className="text-[10px] text-slate-400">Klik untuk mengedit</span>
                      </div>

                      <div className="space-y-2">
                        <div
                          onClick={() => setActiveTab("banner")}
                          className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50/70 hover:bg-slate-100/80 border border-slate-100 transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5">
                            <ImageIcon className="w-4 h-4 text-slate-500" />
                            <div>
                              <p className="text-xs font-semibold text-slate-800">Home Page &mdash; Hero Banner</p>
                              <p className="text-[10px] text-slate-400">Ganti background mobile &amp; desktop</p>
                            </div>
                          </div>
                          <span className="text-[10px] font-semibold text-[#00296E] hover:underline">Kelola &rarr;</span>
                        </div>

                        <div
                          onClick={() => setActiveTab("berita")}
                          className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50/70 hover:bg-slate-100/80 border border-slate-100 transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5">
                            <Newspaper className="w-4 h-4 text-slate-500" />
                            <div>
                              <p className="text-xs font-semibold text-slate-800">Berita Page &mdash; Warta Himpunan</p>
                              <p className="text-[10px] text-slate-400">Publikasi artikel &amp; kegiatan</p>
                            </div>
                          </div>
                          <span className="text-[10px] font-semibold text-[#00296E] hover:underline">Kelola &rarr;</span>
                        </div>

                        <div
                          onClick={() => setActiveTab("kartu-qr")}
                          className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50/70 hover:bg-slate-100/80 border border-slate-100 transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5">
                            <Users className="w-4 h-4 text-slate-500" />
                            <div>
                              <p className="text-xs font-semibold text-slate-800">Kabinet &amp; Profil &mdash; Anggota</p>
                              <p className="text-[10px] text-slate-400">{pengurusList.length} anggota pengurus aktif</p>
                            </div>
                          </div>
                          <span className="text-[10px] font-semibold text-[#00296E] hover:underline">Kelola &rarr;</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Kolom Kanan: Status Absensi & Cetak PDF */}
                  <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-slate-100">
                        <h3 className="font-bold text-xs sm:text-sm text-[#00296E]">Operasional Absensi</h3>
                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                          {activeKegiatan ? "Aktif" : "Siap"}
                        </span>
                      </div>

                      <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                        {activeKegiatan ? (
                          <div>
                            <p className="font-bold text-slate-800 truncate">{activeKegiatan.nama}</p>
                            <p className="text-[11px] text-slate-500 mt-0.5">{formatTanggalIndo(activeKegiatan.tanggal)} &bull; {activeKegiatan.jam}</p>
                          </div>
                        ) : (
                          <div>
                            <p className="font-bold text-slate-800">Belum Ada Kegiatan Dipilih</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">Pilih kegiatan di tabel untuk scan atau cetak</p>
                          </div>
                        )}
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setActiveTab("absensi")}
                          className="py-2 px-3 rounded-lg bg-[#00296E] hover:bg-[#001f54] text-white text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <ScanLine className="w-3.5 h-3.5" />
                          <span>Scan QR</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setActiveTab("rekap-absensi")}
                          className="py-2 px-3 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
                          <span>Cetak PDF</span>
                        </button>
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                      <span>Total kegiatan tersimpan:</span>
                      <span className="font-bold text-slate-700">{kegiatanList.length} Kegiatan</span>
                    </div>
                  </div>
                </div>

                {/* TABEL AGENDA KEGIATAN */}
                <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-2xs">
                  <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                        <Calendar className="w-4 h-4 text-slate-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-[#00296E]">
                          Daftar Agenda Kegiatan ({kegiatanList.length})
                        </h3>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Kelola agenda acara, status kehadiran, dan cetak lembar rekap presensi.
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Cari kegiatan..."
                          value={searchKegiatanOverview}
                          onChange={(e) => setSearchKegiatanOverview(e.target.value)}
                          className="w-40 sm:w-56 pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 hover:bg-white focus:outline-none focus:ring-2 focus:ring-[#00296E]"
                        />
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      </div>

                      <button
                        type="button"
                        onClick={() => setIsTambahKegiatanModalOpen(true)}
                        className="px-3.5 py-1.5 rounded-xl bg-[#00296E] hover:bg-[#001f54] text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95"
                      >
                        <Plus className="w-3.5 h-3.5 text-sky-300" />
                        <span>+ Tambah</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveTab("rekap-absensi")}
                        className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                      >
                        Rekap PDF
                      </button>
                    </div>
                  </div>

                  {/* TABEL FORMAT (DESKTOP & TABLET) */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                          <th className="py-3 px-4 w-12 text-center">No</th>
                          <th className="py-3 px-4 min-w-[200px]">Nama Agenda Kegiatan</th>
                          <th className="py-3 px-4 min-w-[150px]">Tanggal Pelaksanaan</th>
                          <th className="py-3 px-4 min-w-[110px]">Waktu / Jam</th>
                          <th className="py-3 px-4 text-center min-w-[140px]">Presensi Terdata</th>
                          <th className="py-3 px-4 text-center min-w-[110px]">Status</th>
                          <th className="py-3 px-4 text-right min-w-[160px]">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        {filteredKegiatanOverview.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="py-10 text-center text-slate-400">
                              <Calendar className="w-7 h-7 text-slate-300 mx-auto mb-1.5" />
                              <p className="font-semibold text-slate-600">Belum ada agenda kegiatan yang cocok.</p>
                              <p className="text-[11px] text-slate-400 mt-0.5">Klik "+ Tambah" di atas untuk membuat agenda kegiatan baru.</p>
                            </td>
                          </tr>
                        ) : (
                          filteredKegiatanOverview.map((k, index) => {
                            const isActive = activeKegiatan?.id === k.id;
                            const logCount = absensiLogs.filter(
                              (l) => l.kegiatan.trim().toLowerCase() === k.nama.trim().toLowerCase()
                            ).length;

                            return (
                              <tr
                                key={k.id}
                                className={`transition-colors hover:bg-slate-50/80 ${
                                  isActive ? "bg-sky-50/50" : ""
                                }`}
                              >
                                <td className="py-3 px-4 text-center font-mono text-slate-400 font-medium">
                                  {index + 1}
                                </td>
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-lg bg-sky-100 text-[#00296E] flex items-center justify-center shrink-0">
                                      <Calendar className="w-3.5 h-3.5 text-[#0094E0]" />
                                    </div>
                                    <span className="font-extrabold text-slate-900">{k.nama}</span>
                                  </div>
                                </td>
                                <td className="py-3 px-4 font-semibold text-slate-700">
                                  {formatTanggalIndo(k.tanggal)}
                                </td>
                                <td className="py-3 px-4 font-mono text-slate-600 font-medium">
                                  {k.jam}
                                </td>
                                <td className="py-3 px-4 text-center">
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                    {logCount} / {studentPengurusList.length} Hadir
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-center">
                                  <span
                                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                      isActive
                                        ? "bg-sky-100 text-[#00296E] border border-sky-200 font-black"
                                        : "bg-slate-100 text-slate-600"
                                    }`}
                                  >
                                    {isActive ? "Sedang Dipindai" : "Tersimpan"}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setActiveKegiatan(k);
                                        setActiveTab("rekap-absensi");
                                      }}
                                      className="px-2.5 py-1 rounded-lg bg-[#00296E] text-white hover:bg-[#001f54] text-[11px] font-bold transition-all shadow-2xs flex items-center gap-1 cursor-pointer active:scale-95"
                                      title="Buka Rekap PDF untuk kegiatan ini"
                                    >
                                      <span>Buka Rekap</span>
                                    </button>

                                    {!isActive && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setActiveKegiatan(k);
                                          setActiveTab("absensi");
                                        }}
                                        className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-[11px] font-bold border border-emerald-200 transition-colors cursor-pointer"
                                        title="Pindai QR untuk kegiatan ini"
                                      >
                                        Scan QR
                                      </button>
                                    )}

                                    <button
                                      type="button"
                                      onClick={() => setKegiatanToDelete(k)}
                                      className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                                      title={`Hapus agenda "${k.nama}"`}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* TABEL FORMAT KARTU (RESPONSIF MOBILE / SMARTPHONE) */}
                  <div className="md:hidden p-4 space-y-3 divide-y divide-slate-100">
                    {filteredKegiatanOverview.length === 0 ? (
                      <div className="py-6 text-center text-xs text-slate-400">
                        Belum ada kegiatan ditemukan.
                      </div>
                    ) : (
                      filteredKegiatanOverview.map((k) => {
                        const isActive = activeKegiatan?.id === k.id;
                        const logCount = absensiLogs.filter(
                          (l) => l.kegiatan.trim().toLowerCase() === k.nama.trim().toLowerCase()
                        ).length;

                        return (
                          <div
                            key={k.id}
                            className={`pt-3 first:pt-0 rounded-2xl p-4 border transition-all ${
                              isActive
                                ? "bg-sky-50/70 border-sky-200 shadow-2xs"
                                : "bg-white border-slate-200 hover:border-slate-300"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="overflow-hidden">
                                <h4 className="text-xs font-bold text-slate-900 truncate">
                                  {k.nama}
                                </h4>
                                <p className="text-[11px] text-slate-500 mt-0.5">
                                  {formatTanggalIndo(k.tanggal)} • {k.jam}
                                </p>
                              </div>
                              {isActive ? (
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-[#00296E] text-white uppercase shrink-0">
                                  Aktif
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-slate-100 text-slate-600 shrink-0">
                                  Tersimpan
                                </span>
                              )}
                            </div>

                            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                {logCount} / {studentPengurusList.length} Hadir
                              </span>

                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveKegiatan(k);
                                    setActiveTab("rekap-absensi");
                                  }}
                                  className="px-2.5 py-1.5 rounded-lg bg-[#00296E] text-white text-[11px] font-bold active:scale-95 shadow-2xs cursor-pointer"
                                >
                                  Rekap
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveKegiatan(k);
                                    setActiveTab("absensi");
                                  }}
                                  className="px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold cursor-pointer"
                                >
                                  Scan
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setKegiatanToDelete(k)}
                                  className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 cursor-pointer"
                                  title={`Hapus ${k.nama}`}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

              </div>
            )}

            {/* TAB 2: FITUR UTAMA - SCAN ABSENSI QR */}
            {activeTab === "absensi" && (
              <div className="space-y-5 animate-in fade-in duration-200">
                {/* Header Pemilihan Kegiatan & Tombol Tambah Kegiatan */}
                <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-[#00296E]">
                      Scan QR Code Absensi Pengurus
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
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
                          className="pl-3 pr-8 py-2 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#00296E]"
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
                      className="px-3.5 py-2 rounded-lg bg-[#00296E] hover:bg-[#001f54] text-white text-xs font-semibold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer active:scale-95 whitespace-nowrap shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Tambah Kegiatan</span>
                    </button>

                    {/* Tombol Hapus Kegiatan Terpilih */}
                    {activeKegiatan && (
                      <button
                        type="button"
                        onClick={() => handleRequestDeleteKegiatan(activeKegiatan.id)}
                        className="px-3 py-2 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-medium transition-all flex items-center gap-1 cursor-pointer active:scale-95 whitespace-nowrap shrink-0"
                        title={`Hapus kegiatan "${activeKegiatan.nama}"`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Hapus</span>
                      </button>
                    )}
                  </div>
                </div>

                {!activeKegiatan || kegiatanList.length === 0 ? (
                  <div className="bg-white rounded-xl border border-slate-200/80 p-8 sm:p-12 text-center max-w-xl mx-auto shadow-2xs">
                    <div className="w-12 h-12 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center mx-auto mb-3">
                      <ScanLine className="w-6 h-6" />
                    </div>
                    <h3 className="text-base font-bold text-[#00296E]">Belum Ada Kegiatan Absensi Aktif</h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                      Buat agenda kegiatan baru untuk memulai pemindaian QR absensi pengurus.
                    </p>
                    <button
                      type="button"
                      onClick={() => setIsTambahKegiatanModalOpen(true)}
                      className="mt-4 px-4 py-2 rounded-lg bg-[#00296E] hover:bg-[#001f54] text-white text-xs font-semibold transition-all shadow-2xs inline-flex items-center gap-1.5 cursor-pointer active:scale-95"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Tambah Kegiatan Baru</span>
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Banner Rincian Kegiatan Aktif */}
                    <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs shadow-2xs">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 text-[#00296E] flex items-center justify-center shrink-0">
                          <Calendar className="w-4 h-4 text-slate-600" />
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                            Kegiatan Dipindai:
                          </span>
                          <h4 className="font-bold text-xs text-[#00296E]">
                            {activeKegiatan.nama}
                          </h4>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-slate-600 text-xs">
                        <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          <span>{formatTanggalIndo(activeKegiatan.tanggal)}</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
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
                    />
                  </>
                )}

                {/* Banner Akses Cepat ke Menu Rekap Absensi */}
                <div className="bg-white border border-slate-200/80 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shadow-2xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                      <FileSpreadsheet className="w-4 h-4 text-slate-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-[#00296E]">
                        Presensi Terdata: {currentLogs.length} Kehadiran
                      </h4>
                      <p className="text-slate-400 text-[11px] mt-0.5">
                        Tabel rekapitulasi kehadiran lengkap dan tombol cetak PDF resmi format kop surat dapat dibuka di Rekap Absensi.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveTab("rekap-absensi")}
                    className="px-3.5 py-2 rounded-lg bg-[#00296E] hover:bg-[#001f54] text-white font-semibold text-xs shrink-0 transition-all shadow-2xs flex items-center gap-1 cursor-pointer"
                  >
                    <span>Buka Rekap Absensi</span>
                    <ChevronRight className="w-3.5 h-3.5" />
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
                <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-[#00296E]">
                      Kartu Identitas Digital &amp; QR Code Anggota
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Kelola identitas digital dan kode QR presensi untuk seluruh anggota pengurus.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold text-slate-600 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200">
                      Total: <strong className="text-slate-800">{pengurusList.length} Anggota</strong>
                    </span>

                    <button
                      type="button"
                      onClick={() => fetchPengurus()}
                      disabled={loadingPengurus}
                      className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer disabled:opacity-50 transition-colors"
                      title="Segarkan Data Pengurus dari Database"
                    >
                      <RefreshCw
                        className={`w-4 h-4 text-slate-500 ${
                          loadingPengurus ? "animate-spin text-slate-800" : ""
                        }`}
                      />
                    </button>

                    <button
                      type="button"
                      onClick={handleOpenTambahPengurus}
                      className="px-3.5 py-2 rounded-lg bg-[#00296E] hover:bg-[#001f54] text-white text-xs font-semibold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer active:scale-95"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>+ Tambah Anggota</span>
                    </button>
                  </div>
                </div>

                {/* Filter Divisi & Pencarian Pengurus */}
                <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="Cari berdasarkan nama, NIM, atau jabatan pengurus..."
                      value={searchPengurus}
                      onChange={(e) => setSearchPengurus(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00296E]"
                    />
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>

                  <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
                    {["SEMUA", ...DAFTAR_DIVISI].map((divisi) => (
                      <button
                        key={divisi}
                        type="button"
                        onClick={() => setDivisiFilterCard(divisi)}
                        className={`px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                          divisiFilterCard === divisi
                            ? "bg-[#00296E] text-white shadow-2xs"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        {divisi}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Grid Kartu Pengurus */}
                {filteredPengurusCards.length === 0 ? (
                  <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center">
                    <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <h4 className="text-sm font-bold text-slate-700">Tidak Ada Anggota Ditemukan</h4>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                      Tidak ada peserta yang cocok dengan kata kunci atau filter divisi saat ini.
                    </p>
                    <button
                      type="button"
                      onClick={handleOpenTambahPengurus}
                      className="mt-3 px-3.5 py-2 rounded-lg bg-[#00296E] text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Tambah Anggota</span>
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredPengurusCards.map((member) => (
                      <div
                        key={member.id}
                        className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs hover:shadow-sm hover:border-slate-300 transition-all flex flex-col justify-between group"
                      >
                        <div>
                          {/* Member Thumbnail & Info */}
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
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
                              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                                {member.divisi}
                              </span>
                              <h4 className="text-xs font-bold text-slate-900 truncate mt-1">
                                {member.nama}
                              </h4>
                              <p className="text-[11px] text-slate-400 truncate">{member.jabatan}</p>
                            </div>
                          </div>

                          {/* Token & NIM Tag */}
                          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                            <span className="text-slate-400">NIM:</span>
                            <span className="font-mono font-medium text-slate-700">{member.nim}</span>
                          </div>
                        </div>

                        {/* Action Buttons: Lihat Card, Edit, Hapus */}
                        <div className="mt-3 space-y-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedPengurusCard(member)}
                            className="w-full py-1.5 rounded-lg bg-[#00296E] hover:bg-[#001f54] text-white text-xs font-semibold transition-all shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                            <span>Lihat ID Card &amp; QR</span>
                          </button>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEditPengurus(member)}
                              className="flex-1 py-1.5 px-2 rounded-md bg-slate-50 hover:bg-slate-100 text-slate-600 text-[11px] font-medium transition-colors flex items-center justify-center gap-1 cursor-pointer border border-slate-200"
                              title="Edit Data Anggota"
                            >
                              <Edit3 className="w-3 h-3 text-slate-500" />
                              <span>Edit</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleRequestDeletePengurus(member)}
                              className="py-1.5 px-2 rounded-md bg-slate-50 hover:bg-rose-50 text-slate-500 hover:text-rose-600 text-[11px] font-medium transition-colors flex items-center justify-center gap-1 cursor-pointer border border-slate-200"
                              title="Hapus Anggota"
                            >
                              <Trash2 className="w-3 h-3" />
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
              <div className="space-y-5 animate-in fade-in duration-200">
                {/* Header Dokumen */}
                <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-[#00296E]">
                      Dokumen Organisasi (AD/ART &amp; SK)
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Kelola berkas dokumen resmi HIMASI yang dapat diunduh oleh publik di Halaman Profil.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold text-slate-600 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200">
                      Total: <strong className="text-slate-800">{dokumenList.length} Dokumen</strong>
                    </span>

                    <button
                      type="button"
                      onClick={() => fetchDokumenList()}
                      disabled={loadingDokumen}
                      className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer disabled:opacity-50 transition-colors"
                      title="Segarkan Data Dokumen"
                    >
                      <RefreshCw
                        className={`w-4 h-4 text-slate-500 ${
                          loadingDokumen ? "animate-spin text-slate-800" : ""
                        }`}
                      />
                    </button>

                    <button
                      type="button"
                      onClick={handleOpenTambahDokumen}
                      className="px-3.5 py-2 rounded-lg bg-[#00296E] hover:bg-[#001f54] text-white text-xs font-semibold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer active:scale-95"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Tambah Dokumen</span>
                    </button>
                  </div>
                </div>

                {/* Grid Dokumen Organisasi */}
                {loadingDokumen ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[1, 2, 3].map((n) => (
                      <div
                        key={n}
                        className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs animate-pulse space-y-3"
                      >
                        <div className="h-5 w-1/3 bg-slate-200 rounded" />
                        <div className="h-4 w-3/4 bg-slate-100 rounded" />
                        <div className="h-9 w-full bg-slate-100 rounded-lg mt-4" />
                      </div>
                    ))}
                  </div>
                ) : dokumenList.length === 0 ? (
                  <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center">
                    <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <h4 className="text-sm font-bold text-slate-700">Belum Ada Dokumen Organisasi</h4>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                      Unggah dokumen resmi seperti AD/ART atau SK Kepengurusan agar dapat diunduh di website.
                    </p>
                    <button
                      type="button"
                      onClick={handleOpenTambahDokumen}
                      className="mt-3 px-3.5 py-2 rounded-lg bg-[#00296E] text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Tambah Dokumen</span>
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {dokumenList.map((doc) => (
                      <div
                        key={doc.id}
                        className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs hover:shadow-sm hover:border-slate-300 transition-all flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-100 uppercase tracking-wide">
                              Urutan #{doc.urutan || 0}
                            </span>
                            {doc.file_size && (
                              <span className="text-[10px] text-slate-400 font-mono">
                                {doc.file_size}
                              </span>
                            )}
                          </div>

                          <h3 className="text-base font-bold text-[#00296E]">
                            {doc.judul}
                          </h3>
                          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                            {doc.deskripsi}
                          </p>

                          <div className="mt-3 p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center gap-2 text-[11px] text-slate-600 truncate">
                            <FileText className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                            <span className="truncate font-mono">{doc.file_name}</span>
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                          <a
                            href={doc.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            download={doc.file_name}
                            className="w-full py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Unduh / Lihat PDF</span>
                          </a>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleOpenEditDokumen(doc)}
                              className="flex-1 py-1.5 px-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-medium transition-colors flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <Edit3 className="w-3 h-3 text-slate-500" />
                              <span>Edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setDokumenToDelete(doc)}
                              className="py-1.5 px-2.5 rounded-lg border border-slate-200 hover:bg-rose-50 text-slate-500 hover:text-rose-600 text-xs font-medium transition-colors flex items-center justify-center gap-1 cursor-pointer"
                              title="Hapus Dokumen"
                            >
                              <Trash2 className="w-3 h-3" />
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

            {/* TAB 5: ASPIRASI MAHASISWA */}
            {activeTab === "aspirasi" && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-[#00296E]">
                      Aspirasi Mahasiswa
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Pesan dan masukan mahasiswa melalui form aspirasi beranda.
                    </p>
                  </div>
                </div>

                {/* Filter & Pencarian Bar */}
                <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="Cari berdasarkan email, angkatan, atau pesan aspirasi..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00296E]"
                    />
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>

                  <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
                    {["semua", "baru", "diproses", "selesai"].map((status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => setStatusFilter(status)}
                        className={`px-3 py-1.5 rounded-md text-xs font-semibold capitalize transition-all cursor-pointer whitespace-nowrap ${
                          statusFilter === status
                            ? "bg-[#00296E] text-white shadow-2xs"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        {status} {status === "baru" && `(${countBaru})`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Grid Aspirasi */}
                {loadingAspirasi ? (
                  <div className="p-12 text-center bg-white rounded-xl border border-slate-200/80">
                    <RefreshCw className="w-6 h-6 text-slate-400 animate-spin mx-auto mb-2" />
                    <p className="text-xs text-slate-400">Memuat data dari database...</p>
                  </div>
                ) : filteredAspirasi.length === 0 ? (
                  <div className="p-12 text-center bg-white rounded-xl border border-slate-200/80">
                    <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <h3 className="text-xs font-semibold text-slate-600">Tidak ada aspirasi ditemukan</h3>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredAspirasi.map((item) => (
                      <div
                        key={item.id}
                        className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs flex flex-col justify-between hover:border-slate-300 transition-colors relative group"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                              Angkatan {item.angkatan}
                            </span>
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${
                                item.status === "baru"
                                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                                  : item.status === "diproses"
                                  ? "bg-sky-50 text-sky-700 border border-sky-200"
                                  : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              }`}
                            >
                              {item.status}
                            </span>
                          </div>

                          <p className="text-xs font-bold text-[#00296E] truncate mb-2">
                            {item.email}
                          </p>

                          <p className="text-xs text-slate-600 line-clamp-4 leading-relaxed font-normal bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                            &quot;{item.pesan}&quot;
                          </p>

                          {item.catatan_pengurus && (
                            <div className="mt-2 p-2 rounded-md bg-emerald-50 border border-emerald-100 text-[11px] text-emerald-800">
                              <strong>Catatan:</strong> {item.catatan_pengurus}
                            </div>
                          )}
                        </div>

                        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                          <span className="text-[10px] text-slate-400">
                            {new Date(item.created_at).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>

                          <div className="flex items-center gap-1">
                            {item.status !== "diproses" && (
                              <button
                                type="button"
                                onClick={() => handleUpdateStatus(item.id, "diproses")}
                                className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 hover:bg-slate-200 text-[10px] font-medium transition-colors cursor-pointer"
                              >
                                Proses
                              </button>
                            )}

                            {item.status !== "selesai" && (
                              <button
                                type="button"
                                onClick={() => handleUpdateStatus(item.id, "selesai")}
                                className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-[10px] font-medium transition-colors cursor-pointer"
                              >
                                Selesai
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handleDeleteAspirasi(item.id)}
                              className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Hapus Aspirasi"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB APRESIA-SI (KARYA, PRESTASI & SUBMISI MAHASISWA) */}
            {activeTab === "apresiasi" && (
              <ApresiasiManager currentUserRole={currentUserRole} />
            )}

            {/* TAB 6: BERITA CRUD MANAGEMENT */}
            {activeTab === "berita" && (
              <div className="space-y-5 animate-in fade-in duration-200">
                {/* Header Info & Actions */}
                <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-[#00296E]">
                      Manajemen Berita &amp; Publikasi Warta
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Kelola rilis berita, artikel ilmiah, dan dokumentasi kegiatan HIMASI Atma Luhur.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fetchBerita()}
                      disabled={loadingBerita}
                      className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer disabled:opacity-50 transition-colors"
                      title="Segarkan data dari database"
                    >
                      <RefreshCw className={`w-4 h-4 text-slate-500 ${loadingBerita ? "animate-spin text-slate-800" : ""}`} />
                    </button>

                    <Link
                      href="/berita"
                      target="_blank"
                      className="px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                      <span>Lihat Halaman Publik</span>
                    </Link>

                    <button
                      type="button"
                      onClick={handleOpenTambahBerita}
                      className="px-3.5 py-2 rounded-lg bg-[#00296E] hover:bg-[#001f54] text-white text-xs font-semibold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer active:scale-95"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Tulis Berita Baru</span>
                    </button>
                  </div>
                </div>

                {/* 3 Metric Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Total Berita</p>
                      <p className="text-lg font-bold text-slate-800 mt-0.5">
                        {loadingBerita ? (
                          <span className="inline-block w-14 h-5 bg-slate-200 rounded animate-pulse" />
                        ) : (
                          `${beritaList.length} Artikel`
                        )}
                      </p>
                    </div>
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
                      <Newspaper className="w-4 h-4" />
                    </div>
                  </div>

                  <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Berita Terbit</p>
                      <p className="text-lg font-bold text-emerald-700 mt-0.5">
                        {loadingBerita ? (
                          <span className="inline-block w-14 h-5 bg-emerald-100 rounded animate-pulse" />
                        ) : (
                          `${beritaList.filter((b) => b.is_published).length} Publik`
                        )}
                      </p>
                    </div>
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  </div>

                  <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Draf Tersimpan</p>
                      <p className="text-lg font-bold text-amber-700 mt-0.5">
                        {loadingBerita ? (
                          <span className="inline-block w-14 h-5 bg-amber-100 rounded animate-pulse" />
                        ) : (
                          `${beritaList.filter((b) => !b.is_published).length} Draf`
                        )}
                      </p>
                    </div>
                    <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                      <Clock className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                {/* Filter & Search Bar */}
                <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="Cari berdasarkan judul, penulis, atau isi berita..."
                      value={searchBerita}
                      onChange={(e) => setSearchBerita(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00296E]"
                    />
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {/* Category Filter */}
                    <div className="flex items-center gap-1 overflow-x-auto">
                      <button
                        type="button"
                        onClick={() => setKategoriFilterBerita("semua")}
                        className={`px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                          kategoriFilterBerita === "semua"
                            ? "bg-[#00296E] text-white shadow-2xs"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        Semua Kategori
                      </button>
                      {KATEGORI_BERITA.map((k) => (
                        <button
                          key={k.key}
                          type="button"
                          onClick={() => setKategoriFilterBerita(k.key)}
                          className={`px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                            kategoriFilterBerita === k.key
                              ? "bg-[#00296E] text-white shadow-2xs"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          }`}
                        >
                          {k.label}
                        </button>
                      ))}
                    </div>

                    {/* Status Filter */}
                    <div className="h-5 w-px bg-slate-200 hidden sm:block mx-1" />

                    <div className="flex items-center gap-1">
                      {["semua", "terbit", "draft"].map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => setStatusFilterBerita(st)}
                          className={`px-2.5 py-1.5 rounded-md text-xs font-semibold capitalize transition-all cursor-pointer ${
                            statusFilterBerita === st
                              ? "bg-slate-800 text-white shadow-2xs"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Table Data (Desktop & Tablet) */}
                <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-2xs">
                  {loadingBerita ? (
                    <div className="p-12 text-center">
                      <RefreshCw className="w-6 h-6 text-slate-400 animate-spin mx-auto mb-2" />
                      <p className="text-xs text-slate-400">Memuat data berita...</p>
                    </div>
                  ) : filteredBeritaList.length === 0 ? (
                    <div className="p-12 text-center">
                      <Newspaper className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <h3 className="text-xs font-semibold text-slate-600">Tidak ada artikel berita ditemukan</h3>
                      <p className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">
                        Coba sesuaikan kata kunci pencarian atau klik "+ Tulis Berita Baru" untuk menerbitkan warta.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                              <th className="py-2.5 px-3 w-12 text-center">No</th>
                              <th className="py-2.5 px-4 min-w-[280px]">Artikel &amp; Slug</th>
                              <th className="py-2.5 px-3 min-w-[130px]">Kategori</th>
                              <th className="py-2.5 px-3 min-w-[130px]">Penulis</th>
                              <th className="py-2.5 px-3 text-center min-w-[110px]">Status</th>
                              <th className="py-2.5 px-3 min-w-[110px]">Tanggal</th>
                              <th className="py-2.5 px-4 text-right min-w-[130px]">Aksi</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {filteredBeritaList.map((item, idx) => (
                              <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                                <td className="py-3 px-3 text-center text-slate-400 font-mono text-[11px]">
                                  {idx + 1}
                                </td>
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-12 h-10 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
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
                                        className="font-bold text-slate-800 hover:text-[#00296E] hover:underline line-clamp-1 block text-xs"
                                        title={item.title}
                                      >
                                        {item.title}
                                      </Link>
                                      <p className="text-[10px] font-mono text-slate-400 mt-0.5 truncate">
                                        /berita/{item.slug}
                                      </p>
                                      {item.status === "rejected" && item.catatan_revisi && (
                                        <div className="mt-1 px-2 py-0.5 rounded bg-rose-50 border border-rose-200 text-[10px] text-rose-700 leading-tight">
                                          <strong>Catatan Revisi:</strong> {item.catatan_revisi}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </td>
                                <td className="py-3 px-3">
                                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 whitespace-nowrap">
                                    {item.category_label}
                                  </span>
                                </td>
                                <td className="py-3 px-3 text-slate-600 font-medium">
                                  <span className="truncate block max-w-[120px]">{item.author}</span>
                                </td>
                                <td className="py-3 px-3 text-center">
                                  {item.status === "pending_review" ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                      <Clock className="w-3 h-3 text-amber-500" />
                                      Menunggu ACC
                                    </span>
                                  ) : item.status === "rejected" ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                      <XCircle className="w-3 h-3 text-rose-500" />
                                      Perlu Revisi
                                    </span>
                                  ) : (
                                    <button
                                      type="button"
                                      disabled={!canPublishContent(currentUserRole)}
                                      onClick={() => handleQuickToggleBeritaStatus(item)}
                                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold transition-all ${
                                        canPublishContent(currentUserRole) ? "cursor-pointer" : "cursor-default opacity-90"
                                      } ${
                                        item.is_published
                                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                                          : "bg-slate-100 text-slate-500 hover:bg-slate-200 border border-slate-200"
                                      }`}
                                      title={canPublishContent(currentUserRole) ? "Klik untuk mengubah status Terbit / Draft" : "Status publikasi dikelola Medkominfo"}
                                    >
                                      {item.is_published ? "● Terbit" : "○ Draft"}
                                    </button>
                                  )}
                                </td>
                                <td className="py-3 px-3 text-slate-400 text-[11px] whitespace-nowrap">
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
                                          className="px-2 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold transition-colors cursor-pointer shadow-2xs flex items-center gap-1"
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
                                          className="px-2 py-1 rounded-md border border-rose-200 hover:bg-rose-50 text-rose-600 text-[10px] font-bold transition-colors cursor-pointer"
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
                                      className="p-1.5 rounded-md text-slate-500 hover:text-[#00296E] hover:bg-slate-100 transition-colors cursor-pointer"
                                      title="Buka halaman baca publik"
                                    >
                                      <ExternalLink className="w-3.5 h-3.5" />
                                    </Link>
                                    {(canEditPublishedContent(currentUserRole) || (!item.is_published && item.status !== "published")) ? (
                                      <button
                                        type="button"
                                        onClick={() => handleOpenEditBerita(item)}
                                        className="p-1.5 rounded-md text-slate-600 hover:text-[#00296E] hover:bg-slate-100 transition-colors cursor-pointer"
                                        title="Edit Berita"
                                      >
                                        <Edit3 className="w-3.5 h-3.5" />
                                      </button>
                                    ) : null}
                                    {(canEditPublishedContent(currentUserRole) || (!item.is_published && item.status !== "published")) ? (
                                      <button
                                        type="button"
                                        onClick={() => setBeritaToDelete(item)}
                                        className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                        title="Hapus Berita"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    ) : (
                                      <span className="text-[10px] text-slate-400 font-medium px-2 py-0.5 rounded bg-slate-100">
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
                                <ExternalLink className="w-3 h-3" />
                                <span>Lihat</span>
                              </Link>
                              {(canEditPublishedContent(currentUserRole) || (!item.is_published && item.status !== "published")) && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditBerita(item)}
                                    className="px-2.5 py-1 rounded bg-slate-100 text-slate-700 text-[10px] font-semibold flex items-center gap-1"
                                  >
                                    <Edit3 className="w-3 h-3" />
                                    <span>Edit</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setBeritaToDelete(item)}
                                    className="p-1 rounded text-rose-500 hover:bg-rose-50"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
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
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-sky-50 text-[#00296E] flex items-center justify-center border border-sky-100 shrink-0">
                      <Calendar className="w-5 h-5 text-[#0094E0]" />
                    </div>
                    <div>
                      <h2 className="text-base sm:text-lg font-bold text-[#00296E] flex items-center gap-2">
                        <span>Kalender Agenda Organisasi & Kampus</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-[#00296E] border border-sky-100">
                          {agendaList.length} Agenda
                        </span>
                      </h2>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Kelola jadwal kegiatan HIMASI, agenda akademik kampus, dan hari libur nasional secara terpusat.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full md:w-auto">
                    <button
                      type="button"
                      onClick={() => fetchAgendaList()}
                      disabled={loadingAgenda}
                      className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer disabled:opacity-50 transition-colors shadow-2xs"
                      title="Segarkan Data Kalender"
                    >
                      <RefreshCw className={`w-4 h-4 ${loadingAgenda ? "animate-spin text-[#0094E0]" : ""}`} />
                    </button>
                    <Link
                      href="/kalender"
                      target="_blank"
                      className="px-3.5 py-2.5 rounded-xl border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-[#0094E0]" />
                      <span>Halaman Publik</span>
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleOpenTambahAgenda()}
                      className="flex-1 md:flex-none px-4 py-2.5 rounded-xl bg-[#00296E] hover:bg-[#001f54] text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Tambah Acara</span>
                    </button>
                  </div>
                </div>

                {/* DUAL-PANE CONTAINER: KALENDER VISUAL (KIRI) & PANEL DETAIL HARI TERPILIH (KANAN) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  {/* SISI KIRI: KALENDER BULANAN INTERAKTIF (7 KOLOM) */}
                  <div className="lg:col-span-7 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-2xs">
                    {/* Header Navigasi Bulan */}
                    <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                      <div>
                        <h3 className="text-lg font-black text-[#00296E] tracking-tight">
                          {NAMA_BULAN_ID[adminCalMonth]} {adminCalYear}
                        </h3>
                        <p className="text-[11px] text-slate-400 font-medium">
                          Klik tanggal untuk melihat atau menambahkan agenda
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={handleAdminToday}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-[11px] font-bold transition-colors cursor-pointer"
                        >
                          Hari Ini
                        </button>
                        <button
                          type="button"
                          onClick={handleAdminPrevMonth}
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer transition-colors"
                          title="Bulan Sebelumnya"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={handleAdminNextMonth}
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer transition-colors"
                          title="Bulan Selanjutnya"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Legend / Keterangan Kategori */}
                    <div className="flex items-center gap-4 py-2 px-3 mb-3 rounded-xl bg-slate-50 border border-slate-100 text-[11px] font-medium text-slate-600 flex-wrap">
                      <span className="text-slate-400 font-bold">Kategori:</span>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#1E88E5]" />
                        <span>HIMASI</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#F2B705]" />
                        <span>Akademik</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#8E24AA]" />
                        <span>Libur</span>
                      </div>
                    </div>

                    {/* Hari Singkat (Sen - Min) */}
                    <div className="grid grid-cols-7 gap-1 text-center font-bold text-xs text-slate-400 mb-2">
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
                            className={`min-h-[72px] sm:min-h-[82px] p-2 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                              isSelected
                                ? "bg-sky-50/80 border-[#0094E0] ring-2 ring-[#0094E0]/20 shadow-xs"
                                : cell.isToday
                                ? "bg-amber-50/40 border-amber-300 hover:border-[#0094E0]/60"
                                : isDiffMonth
                                ? "bg-slate-50/40 border-slate-100 opacity-40 hover:opacity-80"
                                : "bg-white border-slate-200/80 hover:border-[#0094E0]/50 hover:bg-slate-50/50"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span
                                className={`text-xs font-bold leading-none ${
                                  isSelected
                                    ? "text-[#00296E] font-black"
                                    : cell.isToday
                                    ? "text-amber-700 font-black"
                                    : "text-slate-700"
                                }`}
                              >
                                {cell.dayNumber}
                              </span>
                              {cell.isToday && (
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" title="Hari Ini" />
                              )}
                            </div>

                            {/* Dots Indikator Agenda */}
                            <div className="flex items-center gap-1 flex-wrap mt-1">
                              {cell.events.slice(0, 3).map((e) => {
                                const meta = getCategoryMeta(e.kategori);
                                return (
                                  <span
                                    key={e.id}
                                    className={`w-2 h-2 rounded-full ${meta.dot}`}
                                    title={`${e.judul} (${meta.label})`}
                                  />
                                );
                              })}
                              {cell.events.length > 3 && (
                                <span className="text-[9px] font-bold text-slate-400 leading-none">
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
                  <div className="lg:col-span-5 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
                    {/* Header Panel Tanggal */}
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-sky-50 text-[#00296E] flex items-center justify-center shrink-0 border border-sky-100">
                          <CalendarDays className="w-4 h-4 text-[#0094E0]" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-400">Agenda Tanggal:</h4>
                          <p className="text-sm font-black text-[#00296E]">
                            {formatTanggalIndoFull(adminSelectedDate)}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleOpenTambahAgenda(adminSelectedDate)}
                        className="px-3 py-1.5 rounded-xl bg-[#00296E] hover:bg-[#001f54] text-white text-[11px] font-bold transition-all shadow-2xs flex items-center gap-1 cursor-pointer active:scale-95"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Tambah</span>
                      </button>
                    </div>

                    {/* Daftar Acara pada Hari Terpilih */}
                    {selectedDateEvents.length === 0 ? (
                      <div className="py-12 px-4 rounded-2xl bg-slate-50/70 border border-dashed border-slate-200 text-center flex flex-col items-center justify-center">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
                          <Calendar className="w-6 h-6 text-slate-400" />
                        </div>
                        <h5 className="text-xs font-bold text-slate-700">
                          Tidak ada agenda di tanggal ini
                        </h5>
                        <p className="text-[11px] text-slate-400 max-w-xs mt-1">
                          Belum ada kegiatan organisasi HIMASI, agenda akademik kampus, maupun libur nasional yang dijadwalkan.
                        </p>
                        <button
                          type="button"
                          onClick={() => handleOpenTambahAgenda(adminSelectedDate)}
                          className="mt-4 px-4 py-2 rounded-xl bg-[#00296E] hover:bg-[#001f54] text-white text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
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
                              className={`p-4 rounded-2xl border ${meta.border} bg-white shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-3`}
                            >
                              <div>
                                <div className="flex items-center justify-between gap-2 mb-1.5">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span
                                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${meta.bgBadge} ${meta.textBadge}`}
                                    >
                                      {meta.label}
                                    </span>
                                    {event.status === "pending_review" && (
                                      <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                        Menunggu ACC
                                      </span>
                                    )}
                                    {event.status === "rejected" && (
                                      <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                                        Ditolak
                                      </span>
                                    )}
                                  </div>

                                  {isMultiDay && (
                                    <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                                      Rentang Hari
                                    </span>
                                  )}
                                </div>

                                <h5 className="text-xs sm:text-sm font-black text-slate-900 leading-snug">
                                  {event.judul}
                                </h5>

                                <div className="mt-2 space-y-1 text-[11px] text-slate-500 font-medium">
                                  {isMultiDay && (
                                    <div className="flex items-center gap-1.5 text-indigo-600">
                                      <Calendar className="w-3.5 h-3.5 shrink-0" />
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
                                  <p className="mt-2 text-[11px] text-slate-500 leading-relaxed bg-slate-50 p-2 rounded-xl border border-slate-100">
                                    {event.deskripsi}
                                  </p>
                                )}
                              </div>

                              <div className="pt-2.5 border-t border-slate-100 flex items-center justify-end gap-1.5">
                                {canPublishContent(currentUserRole) && event.status === "pending_review" && (
                                  <button
                                    type="button"
                                    onClick={() => handleApproveAgenda(event)}
                                    className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition-colors flex items-center gap-1 cursor-pointer"
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
                                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-[11px] font-bold transition-colors flex items-center gap-1 cursor-pointer"
                                    >
                                      <Edit3 className="w-3 h-3 text-[#0094E0]" />
                                      <span>Edit</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setAgendaToDelete(event)}
                                      className="px-2.5 py-1.5 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-600 text-[11px] font-bold transition-colors flex items-center gap-1 cursor-pointer"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                      <span>Hapus</span>
                                    </button>
                                  </>
                                ) : (
                                  <span className="text-[10px] text-slate-400 font-medium px-2 py-1 bg-slate-50 rounded border border-slate-100">
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
                <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                      <Database className="w-4 h-4 text-slate-600" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-[#00296E] flex items-center gap-2">
                        <span>Database PostgreSQL Supabase</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Terkoneksi
                        </span>
                      </h2>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Proyek: <code className="font-mono text-slate-700 bg-slate-50 px-1 py-0.5 rounded border border-slate-200">{supabaseProjectId}</code> &bull; Region: Southeast Asia
                      </p>
                    </div>
                  </div>

                  <a
                    href={`https://supabase.com/dashboard/project/${supabaseProjectId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#00296E] hover:bg-[#001f54] text-white text-xs font-semibold transition-all shadow-2xs cursor-pointer"
                  >
                    <span>Buka Supabase Dashboard</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200/80 shadow-2xs space-y-3">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-xs text-[#00296E] flex items-center gap-2">
                        <FileCode className="w-3.5 h-3.5 text-slate-600" />
                        <span>Skrip SQL Schema Database (schema.sql)</span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Jalankan skrip ini di SQL Editor Supabase untuk membuat atau memperbarui tabel database.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleCopySQL}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      {copiedSQL ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
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

                  <pre className="p-3.5 rounded-lg bg-slate-900 text-slate-100 font-mono text-[11px] leading-relaxed overflow-x-auto border border-slate-800 max-h-72">
                    <code>{sqlScriptContent}</code>
                  </pre>
                </div>
              </div>
            )}

            {/* TAB 10: MANAJEMEN PENGGUNA & HAK AKSES (KHUSUS SUPER ADMIN) */}
            {activeTab === "users" && canAccessTab(currentUserRole, "users") && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <UserManager currentUserEmail={user?.email} />
              </div>
            )}

            {/* TAB 9: HERO BANNER & FITUR UTAMA BERANDA */}
            {activeTab === "banner" && (
              <div className="space-y-5 animate-in fade-in duration-200">
                {/* Segmented Sub-Tab Switch: Hero Banner vs Fitur Utama */}
                <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-100 rounded-xl w-fit">
                  <button
                    type="button"
                    onClick={() => setHomeSubTab("banner")}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      homeSubTab === "banner"
                        ? "bg-white text-[#00296E] shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <ImageIcon className="w-4 h-4" />
                    <span>Hero Banner (Desktop &amp; Mobile)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setHomeSubTab("fitur")}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      homeSubTab === "fitur"
                        ? "bg-white text-[#00296E] shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <Award className="w-4 h-4 text-emerald-600" />
                    <span>Daftar Fitur Utama (Toggle Buka / Tutup)</span>
                    <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800">
                      Open / Closed
                    </span>
                  </button>
                </div>

                {homeSubTab === "banner" && (
                  <div className="space-y-5">
                {/* Header Info Card */}
                <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                      <ImageIcon className="w-4 h-4 text-slate-600" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-[#00296E] flex items-center gap-2">
                        <span>Hero Banner Beranda (Mobile &amp; Desktop)</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                          Dual-Source
                        </span>
                      </h2>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Atur gambar latar belakang responsif terpisah untuk Desktop (Landscape) dan Mobile (Portrait).
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href="/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 hover:text-[#00296E] hover:border-slate-300 text-xs font-semibold transition-all shadow-2xs cursor-pointer"
                    >
                      <span>Lihat Beranda</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>

                    <button
                      type="button"
                      onClick={() => handleResetBanner()}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Reset Default</span>
                    </button>
                  </div>
                </div>

                {/* Live Device Previews */}
                <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200/80 shadow-2xs space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div>
                      <h3 className="font-bold text-xs text-[#00296E] flex items-center gap-2">
                        <Sparkles className="w-3.5 h-3.5 text-slate-600" />
                        <span>Pratinjau Multi-Perangkat (Live Preview)</span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Simulasi langsung tampilan hero banner di berbagai orientasi layar.
                      </p>
                    </div>

                    <div className="inline-flex items-center p-1 bg-slate-100 rounded-xl gap-1 text-xs font-semibold">
                      <button
                        type="button"
                        onClick={() => setPreviewDevice("split")}
                        className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                          previewDevice === "split"
                            ? "bg-white text-[#00296E] shadow-xs font-bold"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        Bandingan (Split)
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewDevice("desktop")}
                        className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                          previewDevice === "desktop"
                            ? "bg-white text-[#00296E] shadow-xs font-bold"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        <Monitor className="w-3.5 h-3.5" />
                        <span>Desktop</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewDevice("mobile")}
                        className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                          previewDevice === "mobile"
                            ? "bg-white text-[#00296E] shadow-xs font-bold"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        <Smartphone className="w-3.5 h-3.5" />
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
                            <Monitor className="w-4 h-4 text-sky-600" />
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
                            <Smartphone className="w-4 h-4 text-pink-600" />
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
                    <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200/80 shadow-2xs space-y-3.5">
                      <div className="flex items-center gap-2.5 pb-2.5 border-b border-slate-100">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                          <Monitor className="w-4 h-4 text-slate-600" />
                        </div>
                        <div>
                          <h4 className="font-bold text-xs text-[#00296E]">Background Banner Desktop</h4>
                          <p className="text-[11px] text-slate-400">Aktif pada layar komputer, laptop, &amp; tablet lebar (&ge; 768px)</p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            URL / Jalur File Gambar Desktop:
                          </label>
                          <input
                            type="text"
                            value={formDesktopImage}
                            onChange={(e) => setFormDesktopImage(e.target.value)}
                            placeholder="/hero-banner.png atau link https://..."
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#00296E]"
                            required
                          />
                        </div>

                        {/* Presets Desktop */}
                        <div>
                          <span className="block text-[11px] font-semibold text-slate-500 mb-1">Preset Rekomendasi:</span>
                          <div className="flex flex-wrap gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setFormDesktopImage("/hero-banner.png");
                                setFormDesktopPos("object-[center_65%]");
                              }}
                              className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium transition-colors cursor-pointer"
                            >
                              /hero-banner.png (Resmi 5933x3219)
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setFormDesktopImage("/hero-nature.jpg");
                                setFormDesktopPos("object-center");
                              }}
                              className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium transition-colors cursor-pointer"
                            >
                              /hero-nature.jpg (Alam)
                            </button>
                          </div>
                        </div>

                        {/* Posisi Fokus Desktop */}
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Posisi Fokus Gambar (CSS Object-Position):
                          </label>
                          <select
                            value={formDesktopPos}
                            onChange={(e) => setFormDesktopPos(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#00296E] bg-white cursor-pointer"
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
                    <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200/80 shadow-2xs space-y-3.5">
                      <div className="flex items-center gap-2.5 pb-2.5 border-b border-slate-100">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                          <Smartphone className="w-4 h-4 text-slate-600" />
                        </div>
                        <div>
                          <h4 className="font-bold text-xs text-[#00296E]">Background Banner Mobile</h4>
                          <p className="text-[11px] text-slate-400">Aktif pada perangkat smartphone / vertikal (&lt; 768px)</p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            URL / Jalur File Gambar Mobile:
                          </label>
                          <input
                            type="text"
                            value={formMobileImage}
                            onChange={(e) => setFormMobileImage(e.target.value)}
                            placeholder="/hero-banner-mobile.png atau link https://..."
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#00296E]"
                            required
                          />
                        </div>

                        {/* Presets Mobile */}
                        <div>
                          <span className="block text-[11px] font-semibold text-slate-500 mb-1">Preset Rekomendasi:</span>
                          <div className="flex flex-wrap gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setFormMobileImage("/hero-banner-mobile.png");
                                setFormMobilePos("object-center");
                              }}
                              className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium transition-colors cursor-pointer"
                            >
                              /hero-banner-mobile.png (Portrait 1811x3219)
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setFormMobileImage("/hero-banner.png");
                                setFormMobilePos("object-center");
                              }}
                              className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium transition-colors cursor-pointer"
                            >
                              /hero-banner.png (Gunakan Versi Desktop)
                            </button>
                          </div>
                        </div>

                        {/* Posisi Fokus Mobile */}
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Posisi Fokus Gambar (CSS Object-Position):
                          </label>
                          <select
                            value={formMobilePos}
                            onChange={(e) => setFormMobilePos(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#00296E] bg-white cursor-pointer"
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
                  <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
                    <p className="text-xs text-slate-400 text-center sm:text-left">
                      Konfigurasi tersimpan otomatis dan langsung diterapkan pada pengunjung beranda.
                    </p>

                    <button
                      type="submit"
                      className="w-full sm:w-auto px-5 py-2 rounded-lg bg-[#00296E] hover:bg-[#001f54] text-white text-xs font-semibold transition-all shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
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
                <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                      <Award className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-[#00296E] flex items-center gap-2">
                        <span>Pengaturan Status Fitur Utama Beranda</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                          Toggle Open / Closed
                        </span>
                      </h2>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Aktifkan atau nonaktifkan fitur utama pada halaman beranda dengan status Buka (Open) atau Ditutup (Closed / Coming Soon).
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Master Switch Tampilkan Section di Homepage */}
                    <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 cursor-pointer select-none transition-colors">
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
                        className="w-4 h-4 text-[#00296E] rounded accent-[#00296E] cursor-pointer"
                      />
                      <span>Tampilkan Section di Beranda</span>
                    </label>

                    <a
                      href="/#fitur-utama"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 hover:text-[#00296E] hover:border-slate-300 text-xs font-semibold transition-all shadow-2xs cursor-pointer"
                    >
                      <span>Lihat Beranda</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>

                    <button
                      type="button"
                      onClick={() => handleResetFitur()}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all cursor-pointer"
                      title="Kembalikan semua ke default"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
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
                        className={`bg-white rounded-2xl border transition-all duration-200 p-4 sm:p-5 flex flex-col justify-between shadow-2xs ${
                          isOpen
                            ? "border-emerald-300/80 ring-1 ring-emerald-500/15"
                            : "border-slate-200/90"
                        }`}
                      >
                        <div>
                          {/* Top Bar Card */}
                          <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-[#00296E] text-white flex items-center justify-center shrink-0 shadow-xs">
                                {item.iconName === "UserPlus" && <UserPlus className="w-5 h-5 stroke-[2.2]" />}
                                {item.iconName === "Shirt" && <Shirt className="w-5 h-5 stroke-[2.2]" />}
                                {item.iconName === "Trophy" && <Trophy className="w-5 h-5 stroke-[2.2]" />}
                                {item.iconName === "Award" && <Award className="w-5 h-5 stroke-[2.2]" />}
                              </div>
                              <div>
                                <h3 className="font-bold text-sm text-[#00296E] leading-snug">
                                  {item.title}
                                </h3>
                                <span className="text-[11px] font-mono text-slate-400">
                                  Tautan: {item.href}
                                </span>
                              </div>
                            </div>

                            {/* Status Indicator Pill */}
                            <span
                              className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider flex items-center gap-1.5 ${
                                isOpen
                                  ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                  : "bg-rose-100 text-rose-800 border border-rose-200"
                              }`}
                            >
                              <span className={`w-2 h-2 rounded-full ${isOpen ? "bg-emerald-600 animate-pulse" : "bg-rose-600"}`} />
                              {isOpen ? "Open" : "Closed"}
                            </span>
                          </div>

                          {/* Big Segmented Toggle Switch (OPEN vs CLOSED) */}
                          <div className="mb-4">
                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                              Status Fitur di Beranda
                            </label>
                            <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-100 rounded-xl">
                              <button
                                type="button"
                                onClick={() => {
                                  if (!isOpen) handleToggleFiturItem(item.id);
                                }}
                                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                                  isOpen
                                    ? "bg-emerald-600 text-white shadow-xs"
                                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                                }`}
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>OPEN (Dibuka)</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  if (isOpen) handleToggleFiturItem(item.id);
                                }}
                                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                                  !isOpen
                                    ? "bg-rose-600 text-white shadow-xs"
                                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
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
                              <label className="text-[11px] font-medium text-slate-600 block mb-1">
                                Label saat <strong className="text-emerald-700">Open</strong>
                              </label>
                              <input
                                type="text"
                                value={item.statusOpenText}
                                onChange={(e) => handleUpdateFiturItemField(item.id, "statusOpenText", e.target.value)}
                                placeholder="Lihat Selengkapnya"
                                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#00296E]"
                              />
                            </div>

                            <div>
                              <label className="text-[11px] font-medium text-slate-600 block mb-1">
                                Label saat <strong className="text-rose-700">Closed</strong>
                              </label>
                              <input
                                type="text"
                                value={item.statusClosedText}
                                onChange={(e) => handleUpdateFiturItemField(item.id, "statusClosedText", e.target.value)}
                                placeholder="Coming Soon"
                                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#00296E]"
                              />
                            </div>
                          </div>

                          {/* Opsi Kunci Akses saat Closed */}
                          <div className="mb-4 pt-2 border-t border-slate-100">
                            <label className="flex items-start gap-2 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={item.lockWhenClosed !== false}
                                onChange={(e) => handleUpdateFiturItemField(item.id, "lockWhenClosed", e.target.checked)}
                                className="mt-0.5 w-3.5 h-3.5 text-[#00296E] rounded accent-[#00296E] cursor-pointer"
                              />
                              <span className="text-[11px] text-slate-600 leading-tight">
                                Kunci klik saat <strong>Closed</strong> (menampilkan pemberitahuan bahwa fitur sedang ditutup dan mencegah pembukaan form)
                              </span>
                            </label>
                          </div>
                        </div>

                        {/* Live Visual Preview Kartu Sesuai Tampilan Homepage */}
                        <div className="pt-3 border-t border-slate-100">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                            Pratinjau Tampilan di Beranda:
                          </span>
                          <div
                            className="rounded-2xl p-5 flex flex-col justify-between min-h-[140px] select-none text-white shadow-xs transition-transform hover:-translate-y-0.5"
                            style={{ background: "#00296E" }}
                          >
                            <div className="flex items-center gap-3">
                              {item.iconName === "UserPlus" && <UserPlus className="w-7 h-7 text-white stroke-[2.2] shrink-0" />}
                              {item.iconName === "Shirt" && <Shirt className="w-7 h-7 text-white stroke-[2.2] shrink-0" />}
                              {item.iconName === "Trophy" && <Trophy className="w-7 h-7 text-white stroke-[2.2] shrink-0" />}
                              {item.iconName === "Award" && <Award className="w-7 h-7 text-white stroke-[2.2] shrink-0" />}
                              <h4 className="font-bold text-base text-white leading-snug">
                                {item.title}
                              </h4>
                            </div>
                            <div className="mt-4 flex items-center justify-between">
                              <span className={`text-xs font-semibold tracking-wide ${isOpen ? "text-[#22c55e]" : "text-[#eb5f5f]"}`}>
                                {previewLabel}
                              </span>
                              {!isOpen && (
                                <span className="text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-400/30">
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
                <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold text-[#00296E]">
                      Simpan &amp; Sinkronisasi Seluruh Perubahan
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Perubahan status Open/Closed dan label teks akan langsung aktif untuk seluruh pengunjung website.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleSaveAllFitur}
                    disabled={savingFitur}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-[#00296E] hover:bg-[#001f54] text-white text-xs font-semibold transition-all shadow-2xs flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" />
                    <span>Simpan Pengaturan Fitur</span>
                  </button>
                </div>
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
            className="relative w-full max-w-sm rounded-[28px] overflow-hidden bg-white p-4 sm:p-6 shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelectedPengurusCard(null)}
              className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/40 hover:bg-black/60 text-white transition-colors cursor-pointer"
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
            className="relative w-full max-w-lg rounded-3xl bg-white p-6 sm:p-7 shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-100 my-8 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-sky-100 text-[#00296E] flex items-center justify-center shrink-0">
                  {editingPengurus ? (
                    <Edit3 className="w-5 h-5 text-[#0094E0]" />
                  ) : (
                    <UserPlus className="w-5 h-5 text-[#0094E0]" />
                  )}
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#00296E]">
                    {editingPengurus ? "Edit Data Peserta" : "Tambah Peserta Baru"}
                  </h3>
                  <p className="text-xs text-slate-400">
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
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePengurus} className="mt-5 space-y-4">
              {/* Field 1: Nama Lengkap */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
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
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00296E] focus:border-transparent transition-all uppercase font-semibold"
                />
              </div>

              {/* Grid 2 kolom: NIM & Divisi */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
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
                    className="w-full px-3.5 py-2.5 text-xs font-mono font-bold rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00296E] focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Divisi Organisasi <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formPengurusDivisi}
                    onChange={(e) => setFormPengurusDivisi(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00296E] focus:border-transparent transition-all bg-white cursor-pointer"
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
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Jabatan / Peran <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: KETUA UMUM HIMASI"
                    value={formPengurusJabatan}
                    onChange={(e) => setFormPengurusJabatan(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00296E] focus:border-transparent transition-all font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Urutan Tampil (Hierarki)
                  </label>
                  <input
                    type="number"
                    min={0}
                    placeholder="0 = Otomatis hierarki"
                    value={formPengurusUrutan || ""}
                    onChange={(e) => setFormPengurusUrutan(Number(e.target.value) || 0)}
                    className="w-full px-3.5 py-2.5 text-xs font-mono font-bold rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00296E] focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Field Email */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Email (Opsional)
                </label>
                <input
                  type="email"
                  placeholder="nama@atmaluhur.ac.id"
                  value={formPengurusEmail}
                  onChange={(e) => setFormPengurusEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00296E] focus:border-transparent transition-all"
                />
              </div>

              {/* Field Avatar & Upload Foto */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">
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
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    {/* Live Preview Avatar */}
                    <div className="relative group shrink-0">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-slate-200 border-2 border-sky-400 shadow-sm flex items-center justify-center">
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
                        <div className="absolute inset-0 bg-black/60 rounded-2xl flex items-center justify-center">
                          <RefreshCw className="w-5 h-5 text-white animate-spin" />
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
                          className="px-4 py-2.5 rounded-xl bg-[#00296E] hover:bg-[#001f54] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95"
                        >
                          <Upload className="w-4 h-4 text-sky-300" />
                          <span>{uploadingImage ? "Mengunggah..." : "Unggah Foto dari Perangkat"}</span>
                        </button>

                        {formPengurusImage && formPengurusImage !== "/DSC01203.png" && (
                          <button
                            type="button"
                            onClick={() => setFormPengurusImage("/DSC01203.png")}
                            className="px-3 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-600 text-xs font-semibold border border-slate-200 transition-colors cursor-pointer"
                          >
                            Reset Default
                          </button>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Pilih foto peserta dari perangkat Anda (mendukung JPG, PNG, atau WebP). Berkas akan otomatis dikompres dan disimpan.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Field QR Token */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <QrCode className="w-3.5 h-3.5 text-[#0094E0]" />
                    <span>QR Code Token</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setFormPengurusToken(generateQrToken(formPengurusNim, formPengurusNama))}
                    className="text-[10px] font-bold text-sky-600 hover:text-sky-800 transition-colors cursor-pointer"
                  >
                    Generate Ulang
                  </button>
                </div>
                <input
                  type="text"
                  value={formPengurusToken}
                  onChange={(e) => setFormPengurusToken(e.target.value)}
                  placeholder="Auto-generated dari NIM dan Nama"
                  className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#00296E]"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Token unik ini di-encode ke dalam QR Code kartu identitas untuk dipindai oleh admin saat absensi.
                </p>
              </div>

              {/* Tombol Aksi */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  disabled={savingPengurus}
                  onClick={() => setIsPengurusModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingPengurus || uploadingImage}
                  className="px-5 py-2.5 rounded-xl bg-[#00296E] hover:bg-[#001f54] text-white text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95"
                >
                  {savingPengurus ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
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
            className="relative w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-100 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4 shadow-2xs">
              <Trash2 className="w-7 h-7" />
            </div>

            <h3 className="text-base font-extrabold text-slate-900">
              Hapus Data Peserta?
            </h3>

            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Anda akan menghapus peserta berikut dari daftar pengurus HIMASI:
            </p>

            {/* Preview Peserta yang akan dihapus */}
            <div className="mt-4 p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center gap-3 text-left">
              <div className="w-11 h-11 rounded-xl overflow-hidden bg-slate-200 shrink-0">
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
                <h4 className="text-xs font-black text-slate-900 truncate">
                  {pengurusToDelete.nama}
                </h4>
                <p className="text-[11px] text-slate-500 font-mono">
                  {pengurusToDelete.nim} • {pengurusToDelete.divisi}
                </p>
                <p className="text-[10px] text-slate-400 truncate">
                  {pengurusToDelete.jabatan}
                </p>
              </div>
            </div>

            <div className="mt-4 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-medium text-left">
              Kartu identitas dan QR Code untuk peserta ini tidak akan bisa dipindai lagi pada agenda absensi mendatang.
            </div>

            <div className="mt-6 flex items-center gap-2.5">
              <button
                type="button"
                disabled={deletingPengurus}
                onClick={() => setPengurusToDelete(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={deletingPengurus}
                onClick={handleConfirmDeletePengurus}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95"
              >
                {deletingPengurus ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Menghapus...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
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
            className="relative w-full max-w-lg rounded-3xl bg-white p-6 sm:p-7 shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-100 my-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-sky-50 text-[#00296E] flex items-center justify-center border border-sky-100">
                  <FileText className="w-5 h-5 text-[#0094E0]" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#00296E]">
                    {editingDokumen ? "Edit Dokumen Organisasi" : "Tambah Dokumen Organisasi"}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Berkas resmi yang dapat diunduh publik di halaman Profil HIMASI
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={savingDokumen}
                onClick={() => setIsDokumenModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveDokumen} className="mt-5 space-y-4">
              {/* Judul Dokumen */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Judul Dokumen <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formDokumenJudul}
                  onChange={(e) => setFormDokumenJudul(e.target.value)}
                  placeholder="Contoh: AD HIMASI, ART HIMASI, SK Kepengurusan"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-[#0094E0] focus:ring-2 focus:ring-[#0094E0]/20 transition-all placeholder:text-slate-400 text-slate-800"
                />
              </div>

              {/* Deskripsi Dokumen */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Deskripsi Singkat <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  value={formDokumenDeskripsi}
                  onChange={(e) => setFormDokumenDeskripsi(e.target.value)}
                  placeholder="Contoh: Anggaran Dasar HIMASI ISB Atma Luhur Periode 2024/2025"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-normal focus:outline-none focus:border-[#0094E0] focus:ring-2 focus:ring-[#0094E0]/20 transition-all placeholder:text-slate-400 text-slate-800 resize-none"
                />
              </div>

              {/* Urutan Tampilan */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Nomor Urut Tampilan
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={1}
                    value={formDokumenUrutan}
                    onChange={(e) => setFormDokumenUrutan(parseInt(e.target.value) || 1)}
                    className="w-24 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold focus:outline-none focus:border-[#0094E0] focus:ring-2 focus:ring-[#0094E0]/20 transition-all text-slate-800"
                  />
                  <span className="text-[11px] text-slate-400">
                    Dokumen dengan nomor urut lebih kecil muncul lebih awal (1 = kartu paling kiri).
                  </span>
                </div>
              </div>

              {/* File Upload PDF */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
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
                  <div className="p-3.5 rounded-2xl bg-sky-50/60 border border-sky-100 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0 shadow-2xs font-black text-xs">
                        PDF
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">
                          {formDokumenFileName || "Dokumen.pdf"}
                        </p>
                        <p className="text-[10px] text-slate-400 font-medium">
                          {formDokumenFileSize || "PDF Siap Diunduh"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <a
                        href={formDokumenFileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-slate-300 text-[11px] font-bold text-slate-700 transition-colors flex items-center gap-1 shadow-2xs"
                      >
                        <ExternalLink className="w-3 h-3 text-[#0094E0]" />
                        <span>Pratinjau</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => pdfFileInputRef.current?.click()}
                        disabled={uploadingPdf}
                        className="px-2.5 py-1.5 rounded-lg bg-[#00296E] hover:bg-[#001f54] text-[11px] font-bold text-white transition-colors cursor-pointer"
                      >
                        Ganti PDF
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => !uploadingPdf && pdfFileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer ${
                      uploadingPdf
                        ? "border-[#0094E0] bg-sky-50/40"
                        : "border-slate-200 hover:border-[#0094E0] hover:bg-slate-50/60"
                    }`}
                  >
                    {uploadingPdf ? (
                      <div className="flex flex-col items-center justify-center py-2">
                        <RefreshCw className="w-8 h-8 text-[#0094E0] animate-spin mb-2" />
                        <p className="text-xs font-bold text-slate-700">Mengunggah Berkas PDF...</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Menyiapkan penyimpanan berkas dokumen</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-1">
                        <div className="w-12 h-12 rounded-2xl bg-sky-50 text-[#0094E0] flex items-center justify-center mb-2 shadow-2xs">
                          <Upload className="w-6 h-6" />
                        </div>
                        <p className="text-xs font-bold text-slate-800">
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
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  disabled={savingDokumen || uploadingPdf}
                  onClick={() => setIsDokumenModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingDokumen || uploadingPdf || !formDokumenFileUrl}
                  className="px-5 py-2.5 rounded-xl bg-[#00296E] hover:bg-[#001f54] text-white text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95"
                >
                  {savingDokumen ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
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
            className="relative w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-100 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4 shadow-2xs">
              <Trash2 className="w-7 h-7" />
            </div>

            <h3 className="text-base font-extrabold text-slate-900">
              Hapus Dokumen Organisasi?
            </h3>

            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Anda akan menghapus dokumen berikut dari daftar publik:
            </p>

            {/* Preview Dokumen yang akan dihapus */}
            <div className="mt-4 p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center gap-3 text-left">
              <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0 font-black text-xs">
                PDF
              </div>
              <div className="overflow-hidden flex-1">
                <h4 className="text-xs font-black text-slate-900 truncate">
                  {dokumenToDelete.judul}
                </h4>
                <p className="text-[11px] text-slate-500 truncate">
                  {dokumenToDelete.deskripsi}
                </p>
                <p className="text-[10px] text-slate-400 font-mono truncate">
                  {dokumenToDelete.file_name} • {dokumenToDelete.file_size || "PDF"}
                </p>
              </div>
            </div>

            <div className="mt-4 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-medium text-left">
              Dokumen ini tidak akan bisa diunduh lagi oleh pengunjung di halaman Profil HIMASI.
            </div>

            <div className="mt-6 flex items-center gap-2.5">
              <button
                type="button"
                disabled={deletingDokumen}
                onClick={() => setDokumenToDelete(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={deletingDokumen}
                onClick={handleConfirmDeleteDokumen}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95"
              >
                {deletingDokumen ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Menghapus...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
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
            className="relative w-full max-w-lg rounded-3xl bg-white p-6 sm:p-7 shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-100 my-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Modal */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-sky-50 text-[#00296E] flex items-center justify-center border border-sky-100">
                  <Calendar className="w-5 h-5 text-[#0094E0]" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#00296E]">
                    {editingAgenda ? "Edit Agenda Acara" : "Tambah Agenda Baru"}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Jadwalkan kegiatan organisasi, agenda akademik, atau libur nasional
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={savingAgenda}
                onClick={() => setIsAgendaModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Agenda */}
            <form onSubmit={handleSaveAgenda} className="mt-5 space-y-4">
              {/* Judul Agenda */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Judul Agenda / Acara <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formAgendaJudul}
                  onChange={(e) => setFormAgendaJudul(e.target.value)}
                  placeholder="Contoh: Malam Keakraban (MAKRAB) HIMASI 2026"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-[#0094E0] focus:ring-2 focus:ring-[#0094E0]/20 transition-all placeholder:text-slate-400 text-slate-800"
                />
              </div>

              {/* Kategori Agenda */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
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
                        className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                          isSelected
                            ? `${meta.border} ${meta.bgBadge} ${meta.textBadge} ring-2 ring-[#0094E0]/20 shadow-2xs`
                            : "border-slate-200 text-slate-600 hover:bg-slate-50"
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
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formAgendaIsMultiDay}
                    onChange={(e) => setFormAgendaIsMultiDay(e.target.checked)}
                    className="w-4 h-4 rounded text-[#0094E0] focus:ring-[#0094E0] border-slate-300"
                  />
                  <span className="text-xs font-bold text-slate-700">
                    Acara berlangsung beberapa hari (Rentang Tanggal)
                  </span>
                </label>
                <p className="text-[11px] text-slate-400 ml-6 mt-0.5">
                  Centang jika acara memakan waktu lebih dari 1 hari (contoh: UTS, Sidang Gelombang I).
                </p>
              </div>

              {/* Input Tanggal */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
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
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-[#0094E0] focus:ring-2 focus:ring-[#0094E0]/20 transition-all text-slate-800"
                  />
                </div>

                {formAgendaIsMultiDay && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Tanggal Selesai <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      min={formAgendaTanggalMulai}
                      value={formAgendaTanggalSelesai}
                      onChange={(e) => setFormAgendaTanggalSelesai(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-[#0094E0] focus:ring-2 focus:ring-[#0094E0]/20 transition-all text-slate-800"
                    />
                  </div>
                )}
              </div>

              {/* Waktu & Lokasi */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Waktu / Jam Pelaksanaan
                  </label>
                  <input
                    type="text"
                    value={formAgendaWaktu}
                    onChange={(e) => setFormAgendaWaktu(e.target.value)}
                    placeholder="Contoh: 08.30 - 15.00 WIB atau Sepanjang Hari"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-[#0094E0] focus:ring-2 focus:ring-[#0094E0]/20 transition-all placeholder:text-slate-400 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Lokasi Pelaksanaan
                  </label>
                  <input
                    type="text"
                    value={formAgendaLokasi}
                    onChange={(e) => setFormAgendaLokasi(e.target.value)}
                    placeholder="Contoh: Auditorium Utama / Online (Zoom)"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-[#0094E0] focus:ring-2 focus:ring-[#0094E0]/20 transition-all placeholder:text-slate-400 text-slate-800"
                  />
                </div>
              </div>

              {/* Deskripsi */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Keterangan / Deskripsi Acara
                </label>
                <textarea
                  rows={2}
                  value={formAgendaDeskripsi}
                  onChange={(e) => setFormAgendaDeskripsi(e.target.value)}
                  placeholder="Keterangan singkat mengenai agenda atau sasaran kegiatan..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-normal focus:outline-none focus:border-[#0094E0] focus:ring-2 focus:ring-[#0094E0]/20 transition-all placeholder:text-slate-400 text-slate-800 resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  disabled={savingAgenda}
                  onClick={() => setIsAgendaModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingAgenda}
                  className="px-5 py-2.5 rounded-xl bg-[#00296E] hover:bg-[#001f54] text-white text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95"
                >
                  {savingAgenda ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
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
            className="relative w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-100 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4 shadow-2xs">
              <Trash2 className="w-7 h-7" />
            </div>

            <h3 className="text-base font-extrabold text-slate-900">
              Hapus Agenda Kalender?
            </h3>

            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Anda akan menghapus agenda berikut dari kalender organisasi:
            </p>

            {/* Preview Agenda yang akan dihapus */}
            <div className="mt-4 p-3 bg-slate-50 rounded-2xl border border-slate-200 text-left">
              <span
                className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold mb-1 ${
                  getCategoryMeta(agendaToDelete.kategori).bgBadge
                } ${getCategoryMeta(agendaToDelete.kategori).textBadge}`}
              >
                {getCategoryMeta(agendaToDelete.kategori).label}
              </span>
              <h4 className="text-xs font-black text-slate-900 leading-snug">
                {agendaToDelete.judul}
              </h4>
              <p className="text-[11px] text-slate-500 mt-1">
                {agendaToDelete.tanggal_mulai}
                {agendaToDelete.tanggal_selesai && ` s/d ${agendaToDelete.tanggal_selesai}`} &bull; {agendaToDelete.waktu}
              </p>
            </div>

            <div className="mt-4 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-medium text-left">
              Agenda ini tidak akan tampil lagi di kalender publik HIMASI.
            </div>

            <div className="mt-6 flex items-center gap-2.5">
              <button
                type="button"
                disabled={deletingAgenda}
                onClick={() => setAgendaToDelete(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={deletingAgenda}
                onClick={handleConfirmDeleteAgenda}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95"
              >
                {deletingAgenda ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Menghapus...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
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
            className="relative w-full max-w-md rounded-3xl bg-white p-6 sm:p-7 shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-sky-100 text-[#00296E] flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-[#0094E0]" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#00296E]">
                    Tambah Kegiatan Baru
                  </h3>
                  <p className="text-xs text-slate-400">
                    Masukkan nama kegiatan, tanggal, dan jam
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsTambahKegiatanModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSimpanKegiatan} className="mt-5 space-y-4">
              {/* Field 1: Nama Kegiatan */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Nama Kegiatan / Rapat / Acara <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Rapat Pleno Kabinet / Workshop UI/UX"
                  value={formNamaKegiatan}
                  onChange={(e) => setFormNamaKegiatan(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#00296E] placeholder:text-slate-400"
                />
              </div>

              {/* Field 2: Tanggal Pelaksanaan */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Tanggal Pelaksanaan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={formTanggalKegiatan}
                  onChange={(e) => setFormTanggalKegiatan(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#00296E]"
                />
              </div>

              {/* Field 3: Waktu / Jam */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Waktu / Jam Pelaksanaan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: 08:30 WIB atau 09:00 - 12:00 WIB"
                  value={formJamKegiatan}
                  onChange={(e) => setFormJamKegiatan(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#00296E] placeholder:text-slate-400"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Format waktu akan otomatis dicetak pada lembar rekap PDF ber-kop surat.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsTambahKegiatanModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#00296E] hover:bg-[#001f54] text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <Check className="w-4 h-4 text-sky-300" />
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
            className="relative w-full max-w-md rounded-3xl bg-white p-6 sm:p-7 shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3.5 pb-4 border-b border-slate-100">
              <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100 shadow-2xs">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Hapus Agenda Kegiatan?
                </h3>
                <p className="text-xs text-slate-500">
                  Tindakan ini permanen dan tidak dapat dibatalkan
                </p>
              </div>
            </div>

            <div className="mt-4 p-4 rounded-2xl bg-rose-50/70 border border-rose-200/80 text-xs space-y-1.5">
              <p className="text-slate-600 font-medium">
                Anda akan menghapus kegiatan:
              </p>
              <p className="text-sm font-black text-rose-800">
                {kegiatanToDelete.nama}
              </p>
              <p className="text-[11px] text-slate-500 font-semibold">
                {formatTanggalIndo(kegiatanToDelete.tanggal)} • {kegiatanToDelete.jam}
              </p>
              <p className="text-[11px] text-rose-700 pt-1.5 font-medium border-t border-rose-200/60 mt-2">
                Seluruh catatan presensi scan QR pengurus untuk kegiatan ini juga akan dihapus dari sistem.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-4 mt-2">
              <button
                type="button"
                disabled={deletingKegiatan}
                onClick={() => setKegiatanToDelete(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={deletingKegiatan}
                onClick={handleConfirmDeleteKegiatan}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {deletingKegiatan ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>Menghapus...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 text-rose-200" />
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
            className="relative w-full max-w-md rounded-3xl bg-white p-6 sm:p-7 shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3.5 pb-4 border-b border-slate-100">
              <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100 shadow-2xs">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Hapus Catatan Aspirasi?
                </h3>
                <p className="text-xs text-slate-500">
                  Data aspirasi akan dihapus permanen dari sistem
                </p>
              </div>
            </div>

            <div className="mt-4 p-4 rounded-2xl bg-rose-50/70 border border-rose-200/80 text-xs space-y-1.5">
              <p className="text-slate-600 font-medium">
                Pengirim: <strong className="text-slate-900">{aspirasiToDelete.email}</strong> (Angkatan {aspirasiToDelete.angkatan})
              </p>
              <p className="text-slate-700 italic border-l-2 border-rose-400 pl-2.5 py-1 text-[11px] line-clamp-3">
                &ldquo;{aspirasiToDelete.pesan}&rdquo;
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-4 mt-2">
              <button
                type="button"
                disabled={deletingAspirasi}
                onClick={() => setAspirasiToDelete(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={deletingAspirasi}
                onClick={handleConfirmDeleteAspirasi}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {deletingAspirasi ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>Menghapus...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 text-rose-200" />
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
            className="relative w-full max-w-2xl rounded-2xl bg-white p-5 sm:p-6 shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-100 my-8 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-slate-100 text-[#00296E] flex items-center justify-center shrink-0">
                  {editingBerita ? (
                    <Edit3 className="w-4 h-4 text-slate-700" />
                  ) : (
                    <Newspaper className="w-4 h-4 text-slate-700" />
                  )}
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-[#00296E]">
                    {editingBerita ? "Edit Artikel Berita" : "Tulis Artikel Berita Baru"}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {editingBerita
                      ? `Perbarui rincian artikel: ${editingBerita.title}`
                      : "Publikasikan warta, kegiatan, atau pengumuman resmi himpunan."}
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={savingBerita}
                onClick={() => setIsBeritaModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveBerita} className="mt-4 space-y-4">
              {/* Field 1: Judul Berita */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Judul Berita <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Pelantikan Pengurus Kabinet REKSABUDAYA 2026"
                  value={formBeritaTitle}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00296E] font-semibold text-slate-900 placeholder:text-slate-400"
                />
              </div>

              {/* Field 2 & 3: Slug URL & Kategori */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                    <span>Slug URL Khusus:</span>
                    <span className="text-[10px] text-slate-400 font-normal">Otomatis dari judul</span>
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
                      className="w-full pl-16 pr-3 py-2 text-xs font-mono rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00296E] text-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
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
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00296E] bg-white cursor-pointer font-medium text-slate-800"
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Penulis / Departemen:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Departemen Medkominfo"
                    value={formBeritaAuthor}
                    onChange={(e) => setFormBeritaAuthor(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00296E] text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Estimasi Waktu Baca:
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: 5 min read"
                    value={formBeritaReadTime}
                    onChange={(e) => setFormBeritaReadTime(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00296E] text-slate-800"
                  />
                </div>
              </div>

              {/* Field 6: Sistem Unggah Foto Sampul Berita */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-[#0094E0]" />
                    <span>Foto Sampul Berita (Cover Image):</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">
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
                  <div className="relative rounded-2xl border border-slate-200 overflow-hidden bg-slate-100 group shadow-xs">
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
                      <div className="absolute top-3 left-3 bg-[#00296E]/90 backdrop-blur-xs text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-sm flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Foto Sampul Terpasang</span>
                      </div>

                      {/* Overlay Tombol Aksi Desktop */}
                      <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-4">
                        <button
                          type="button"
                          disabled={uploadingBeritaImage}
                          onClick={() => beritaFileInputRef.current?.click()}
                          className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-800 text-xs font-bold shadow-md flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 active:scale-95"
                        >
                          <Upload className="w-3.5 h-3.5 text-[#0094E0]" />
                          <span>Ganti Foto</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormBeritaImage("")}
                          className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Hapus</span>
                        </button>
                      </div>
                    </div>

                    {/* Tombol Aksi Mobile / Sentuh */}
                    <div className="flex sm:hidden items-center justify-between p-2.5 bg-white border-t border-slate-200">
                      <button
                        type="button"
                        onClick={() => beritaFileInputRef.current?.click()}
                        className="text-xs font-bold text-[#0094E0] flex items-center gap-1 py-1 px-2 cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Ganti Foto</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormBeritaImage("")}
                        className="text-xs font-bold text-red-600 flex items-center gap-1 py-1 px-2 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Hapus Foto</span>
                      </button>
                    </div>

                    {/* Indikator Loading saat Unggah Ulang */}
                    {uploadingBeritaImage && (
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center text-white text-xs font-bold gap-2">
                        <RefreshCw className="w-6 h-6 animate-spin text-sky-300" />
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
                    className={`relative rounded-2xl border-2 border-dashed p-6 sm:p-8 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-2.5 ${
                      isDraggingOverBerita
                        ? "border-[#0094E0] bg-sky-50/80 scale-[0.99]"
                        : "border-slate-300 hover:border-[#00296E] hover:bg-slate-50/80 bg-white"
                    }`}
                  >
                    <div className="w-12 h-12 rounded-2xl bg-sky-50 text-[#00296E] flex items-center justify-center shadow-xs">
                      <Upload className="w-6 h-6 text-[#0094E0]" />
                    </div>

                    <div>
                      <p className="text-xs sm:text-sm font-bold text-slate-800">
                        {uploadingBeritaImage
                          ? "Sedang memproses foto..."
                          : "Klik atau seret (drag & drop) berkas foto ke sini"}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1">
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
                      className="mt-1 px-4 py-2 rounded-xl bg-[#00296E] hover:bg-[#001f54] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95"
                    >
                      <Upload className="w-3.5 h-3.5 text-sky-300" />
                      <span>{uploadingBeritaImage ? "Memproses..." : "Pilih Foto dari Perangkat"}</span>
                    </button>

                    {/* Loading Overlay */}
                    {uploadingBeritaImage && (
                      <div className="absolute inset-0 bg-white/80 rounded-2xl flex flex-col items-center justify-center gap-2">
                        <RefreshCw className="w-6 h-6 animate-spin text-[#00296E]" />
                        <span className="text-xs font-bold text-slate-800">Mengompresi & mengunggah gambar...</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Field 7: Ringkasan / Excerpt */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Ringkasan Singkat (Excerpt):</span>
                  <span className="text-[10px] text-slate-400 font-normal">Tampil pada kartu beranda/katalog</span>
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Ringkasan 1-2 kalimat pengantar isi berita..."
                  value={formBeritaExcerpt}
                  onChange={(e) => setFormBeritaExcerpt(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00296E] text-slate-800 leading-relaxed placeholder:text-slate-400 resize-none"
                />
              </div>

              {/* Field 8: Konten Berita Lengkap */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Isi Konten Artikel Lengkap:</span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {formBeritaContent.split(/\s+/).filter(Boolean).length} kata &bull; {formBeritaReadTime}
                  </span>
                </label>
                <textarea
                  rows={7}
                  required
                  placeholder="Tuliskan berita lengkap di sini. Gunakan baris baru antar paragraf..."
                  value={formBeritaContent}
                  onChange={(e) => handleContentChange(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00296E] text-slate-800 leading-relaxed placeholder:text-slate-400 font-normal"
                />
              </div>

              {/* Checkbox Status Terbit */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200/80">
                <label htmlFor="formBeritaIsPublished" className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    id="formBeritaIsPublished"
                    checked={formBeritaIsPublished}
                    onChange={(e) => setFormBeritaIsPublished(e.target.checked)}
                    className="w-4 h-4 rounded text-[#00296E] focus:ring-[#00296E] cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800">
                      Publikasikan Sekarang (Status Terbit)
                    </span>
                    <p className="text-[10px] text-slate-400">
                      Jika dinonaktifkan, berita disimpan sebagai Draf dan tidak muncul di halaman publik.
                    </p>
                  </div>
                </label>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    formBeritaIsPublished
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {formBeritaIsPublished ? "Terbit" : "Draft"}
                </span>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  disabled={savingBerita}
                  onClick={() => setIsBeritaModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingBerita}
                  className="px-5 py-2 rounded-lg bg-[#00296E] hover:bg-[#001f54] active:scale-95 text-white text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {savingBerita ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
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
            className="relative w-full max-w-md rounded-2xl bg-white p-5 sm:p-6 shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  Hapus Artikel Berita?
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Tindakan ini tidak dapat dibatalkan.
                </p>
              </div>
            </div>

            <div className="mt-3.5 p-3 rounded-lg bg-rose-50/70 border border-rose-200/80 text-xs">
              <p className="text-slate-700 font-bold line-clamp-2">
                &ldquo;{beritaToDelete.title}&rdquo;
              </p>
              <p className="text-[11px] text-slate-500 mt-1 font-mono">
                /berita/{beritaToDelete.slug}
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 mt-2">
              <button
                type="button"
                disabled={deletingBerita}
                onClick={() => setBeritaToDelete(null)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={deletingBerita}
                onClick={handleConfirmDeleteBerita}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95"
              >
                {deletingBerita ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                    <span>Menghapus...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5 text-rose-200" />
                    <span>Ya, Hapus Artikel</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP MODAL: TOLAK WARTA DENGAN CATATAN REVISI */}
      {rejectingBeritaItem && (
        <div
          className="no-print fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => setRejectingBeritaItem(null)}
        >
          <div
            className="relative w-full max-w-md rounded-2xl bg-white p-5 sm:p-6 shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  Kembalikan Warta untuk Revisi
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Berikan catatan perbaikan kepada kontributor warta.
                </p>
              </div>
            </div>

            <div className="mt-3.5 p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs">
              <p className="text-slate-700 font-bold line-clamp-1">
                &ldquo;{rejectingBeritaItem.title}&rdquo;
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Penulis: {rejectingBeritaItem.author} &bull; /berita/{rejectingBeritaItem.slug}
              </p>
            </div>

            <div className="mt-3">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Catatan Revisi / Alasan Penolakan: <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                required
                value={catatanRevisiBerita}
                onChange={(e) => setCatatanRevisiBerita(e.target.value)}
                placeholder="Contoh: Tolong perbaiki resolusi foto sampul dan lengkapi rincian narasumber..."
                className="w-full p-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00296E] leading-relaxed resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 mt-2">
              <button
                type="button"
                onClick={() => {
                  setRejectingBeritaItem(null);
                  setCatatanRevisiBerita("");
                }}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={!catatanRevisiBerita.trim()}
                onClick={handleConfirmRejectBerita}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95"
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
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
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
