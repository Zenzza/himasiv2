"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Link from "next/link";
import {
  Newspaper,
  CheckCircle,
  Clock,
  MagnifyingGlass,
  Trash,
  NotePencil,
  ArrowsClockwise,
  Check,
  X,
  UploadSimple,
  Image as ImageIcon,
  WarningCircle,
  Eye,
  ArrowSquareOut,
  Plus,
} from "@phosphor-icons/react";
import {
  type BeritaItem,
  KATEGORI_BERITA,
} from "@/lib/types/berita";
import {
  type UserRole,
  type ContentStatus,
  canPublishContent,
  canEditPublishedContent,
} from "@/lib/types/auth";
import {
  getAllBeritaAdmin,
  createBerita,
  updateBerita,
  updateBeritaStatus,
  deleteBerita,
  togglePublishedBerita,
} from "@/lib/supabase/berita";
import { supabase } from "@/lib/supabase/client";
import { recordAuditLog } from "@/lib/supabase/audit-log";
import { slugify, estimateReadTime } from "@/lib/utils/slug";
import DashboardPageHeader from "@/components/dashboard/ui/dashboard-page-header";
import DashboardMetricStrip from "@/components/dashboard/ui/dashboard-metric-strip";

interface BeritaManagerProps {
  currentUserRole?: UserRole;
  currentUserName?: string;
  showToast?: (msg: string) => void;
  beritaList?: BeritaItem[];
  onBeritaUpdated?: (items: BeritaItem[]) => void;
}

export default function BeritaManager({
  currentUserRole = "humas_biskraf",
  currentUserName = "Pengurus HIMASI",
  showToast = (msg: string) => console.log(msg),
  beritaList: externalBeritaList,
  onBeritaUpdated,
}: BeritaManagerProps) {
  // State data berita
  const [internalBeritaList, setInternalBeritaList] = useState<BeritaItem[]>([]);
  const [loadingBerita, setLoadingBerita] = useState(false);

  const beritaList = externalBeritaList ?? internalBeritaList;

  // Filter & Search
  const [searchBerita, setSearchBerita] = useState("");
  const [kategoriFilterBerita, setKategoriFilterBerita] = useState("semua");
  const [statusFilterBerita, setStatusFilterBerita] = useState<"semua" | "terbit" | "draft" | "pending_review">("semua");

  // Modal CRUD Berita
  const [isBeritaModalOpen, setIsBeritaModalOpen] = useState(false);
  const [editingBerita, setEditingBerita] = useState<BeritaItem | null>(null);
  const [beritaToDelete, setBeritaToDelete] = useState<BeritaItem | null>(null);
  const [deletingBerita, setDeletingBerita] = useState(false);
  const [savingBerita, setSavingBerita] = useState(false);
  const [rejectingBeritaItem, setRejectingBeritaItem] = useState<BeritaItem | null>(null);
  const [catatanRevisiBerita, setCatatanRevisiBerita] = useState("");

  // Form State
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

  // Ambil Data Berita dari Database
  const fetchBerita = useCallback(async () => {
    setLoadingBerita(true);
    try {
      const data = await getAllBeritaAdmin();
      setInternalBeritaList(data);
      onBeritaUpdated?.(data);
    } catch (err) {
      console.error("Fetch berita error:", err);
    } finally {
      setLoadingBerita(false);
    }
  }, [onBeritaUpdated]);

  useEffect(() => {
    if (!externalBeritaList || externalBeritaList.length === 0) {
      fetchBerita();
    }
  }, [externalBeritaList, fetchBerita]);

  // Handler Buka Modal Tambah
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

  // Handler Buka Modal Edit
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

      // Pratinjau instan
      setFormBeritaImage(base64Url);

      // Unggah ke Supabase Storage
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

  // Simpan Berita
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

  // Setujui & Terbitkan Berita
  const handleApproveBerita = async (item: BeritaItem) => {
    try {
      await updateBeritaStatus(item.id, "published");
      const updated = beritaList.map((b) =>
        String(b.id) === String(item.id)
          ? { ...b, status: "published" as ContentStatus, is_published: true, catatan_revisi: undefined }
          : b
      );
      setInternalBeritaList(updated);
      onBeritaUpdated?.(updated);
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

  // Konfirmasi Tolak Berita dengan Catatan Revisi
  const handleConfirmRejectBerita = async () => {
    if (!rejectingBeritaItem) return;
    if (!catatanRevisiBerita.trim()) {
      showToast("Catatan revisi wajib diisi agar penulis memahami bagian yang perlu diperbaiki.");
      return;
    }

    try {
      await updateBeritaStatus(rejectingBeritaItem.id, "rejected", catatanRevisiBerita.trim());
      const updated = beritaList.map((b) =>
        String(b.id) === String(rejectingBeritaItem.id)
          ? { ...b, status: "rejected" as ContentStatus, is_published: false, catatan_revisi: catatanRevisiBerita.trim() }
          : b
      );
      setInternalBeritaList(updated);
      onBeritaUpdated?.(updated);
      recordAuditLog({
        modul: "berita",
        aksi: `Mengembalikan Berita "${rejectingBeritaItem.title}" untuk revisi`,
        pengurus_nama: currentUserName,
        pengurus_role: currentUserRole,
        status: "berhasil",
        detail: `Catatan: ${catatanRevisiBerita.trim()}`,
      }).catch((err) => console.warn("[dashboard] Gagal mencatat audit log reject berita:", err));
      showToast(`Berita "${rejectingBeritaItem.title}" dikembalikan dengan catatan revisi.`);
      setRejectingBeritaItem(null);
      setCatatanRevisiBerita("");
    } catch (err: any) {
      console.error("Reject berita error:", err);
      showToast("Gagal mengembalikan Berita: " + (err.message || "Terjadi kesalahan"));
    }
  };

  // Toggle Terbitkan / Draf Berita
  const handleTogglePublished = async (item: BeritaItem) => {
    try {
      const nextStatus = !item.is_published;
      await togglePublishedBerita(item.id, nextStatus);
      const updated = beritaList.map((b) =>
        String(b.id) === String(item.id)
          ? {
              ...b,
              is_published: nextStatus,
              status: (nextStatus ? "published" : "draft") as ContentStatus,
            }
          : b
      );
      setInternalBeritaList(updated);
      onBeritaUpdated?.(updated);
      recordAuditLog({
        modul: "berita",
        aksi: `Mengubah status publikasi berita: "${item.title}" -> ${nextStatus ? "Terbit" : "Draf"}`,
        pengurus_nama: currentUserName,
        pengurus_role: currentUserRole,
        status: "berhasil",
      }).catch((err) => console.warn("[dashboard] Gagal mencatat audit log toggle berita:", err));
      showToast(nextStatus ? "Artikel sekarang berstatus TERBIT!" : "Artikel dialihkan ke status DRAF.");
    } catch (err: any) {
      console.error("Toggle publish error:", err);
      showToast("Gagal mengubah status: " + (err.message || "Terjadi kesalahan"));
    }
  };

  // Konfirmasi Hapus Berita
  const handleConfirmDeleteBerita = async () => {
    if (!beritaToDelete) return;

    setDeletingBerita(true);
    try {
      await deleteBerita(beritaToDelete.id);
      recordAuditLog({
        modul: "berita",
        aksi: `Menghapus artikel Berita/berita: "${beritaToDelete.title}"`,
        pengurus_nama: currentUserName,
        pengurus_role: currentUserRole,
        status: "berhasil",
        detail: `ID: ${beritaToDelete.id}, Slug: ${beritaToDelete.slug}`,
      }).catch((err) => console.warn("[dashboard] Gagal mencatat audit log delete berita:", err));
      showToast(`Artikel "${beritaToDelete.title}" berhasil dihapus.`);
      setBeritaToDelete(null);
      await fetchBerita();
    } catch (err: any) {
      console.error("Delete berita error:", err);
      showToast("Gagal menghapus berita: " + (err.message || "Terjadi kesalahan"));
    } finally {
      setDeletingBerita(false);
    }
  };

  // Filter List Berita
  const filteredBerita = useMemo(() => {
    return beritaList.filter((b) => {
      const matchKategori = kategoriFilterBerita === "semua" || b.category_key === kategoriFilterBerita;
      const matchStatus =
        statusFilterBerita === "semua"
          ? true
          : statusFilterBerita === "terbit"
          ? b.is_published
          : statusFilterBerita === "draft"
          ? !b.is_published && b.status !== "pending_review"
          : b.status === "pending_review";
      const q = searchBerita.toLowerCase();
      const matchSearch =
        !searchBerita ||
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        b.excerpt.toLowerCase().includes(q);
      return matchKategori && matchStatus && matchSearch;
    });
  }, [beritaList, kategoriFilterBerita, statusFilterBerita, searchBerita]);

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Header Halaman */}
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

      {/* Metric Strip */}
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
          <div className="flex items-center gap-1 border-l border-[#00296E]/15 dark:border-white/10 pl-2">
            {(["semua", "terbit", "draft", "pending_review"] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilterBerita(st)}
                className={`px-2.5 py-1.5 rounded-none text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer whitespace-nowrap ${
                  statusFilterBerita === st
                    ? "bg-[#00296E] dark:bg-[#38BDF8] text-white dark:text-[#001740] font-bold"
                    : "border border-[#00296E]/15 dark:border-white/10 bg-white dark:bg-[#001740] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5"
                }`}
              >
                {st === "semua"
                  ? "Semua Status"
                  : st === "terbit"
                  ? "Terbit"
                  : st === "draft"
                  ? "Draf"
                  : "Menunggu ACC"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tabel & Daftar Berita */}
      <div className="bg-white dark:bg-[#001438] border border-[#00296E]/15 dark:border-white/10 shadow-none overflow-hidden">
        {loadingBerita ? (
          <div className="p-8 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
            <ArrowsClockwise className="w-5 h-5 animate-spin text-[#00296E] dark:text-[#38BDF8]" />
            <span className="text-xs font-mono">Memuat database Berita...</span>
          </div>
        ) : filteredBerita.length === 0 ? (
          <div className="p-8 text-center text-slate-500 dark:text-slate-400">
            <Newspaper className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Tidak ada berita ditemukan
            </p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
              Ubah kueri pencarian atau buat artikel baru untuk memulai publikasi.
            </p>
          </div>
        ) : (
          <>
            {/* Tampilan Tabel Desktop */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#00296E]/15 dark:border-white/10 bg-[#00296E]/5 dark:bg-white/5 text-[11px] font-mono uppercase text-[#00296E] dark:text-[#38BDF8]">
                    <th className="py-3 px-4 font-bold">Judul &amp; Slug</th>
                    <th className="py-3 px-4 font-bold">Kategori</th>
                    <th className="py-3 px-4 font-bold">Penulis</th>
                    <th className="py-3 px-4 font-bold text-center">Status</th>
                    <th className="py-3 px-4 font-bold">Tanggal</th>
                    <th className="py-3 px-4 font-bold text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#00296E]/10 dark:divide-white/5">
                  {filteredBerita.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-[#00296E]/[0.02] dark:hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-start gap-3">
                          <img
                            src={item.image_url || "/DSC01203.jpg"}
                            alt={item.title}
                            className="w-12 h-9 object-cover rounded-none shrink-0 border border-slate-200 dark:border-white/10"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = "/DSC01203.jpg";
                            }}
                          />
                          <div className="min-w-0">
                            <span className="font-bold text-slate-800 dark:text-slate-200 line-clamp-1 block">
                              {item.title}
                            </span>
                            <span className="text-[11px] font-mono text-slate-400 dark:text-slate-400 block truncate">
                              /berita/{item.slug}
                            </span>
                            {item.catatan_revisi && (
                              <div className="mt-1 text-[11px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 border border-amber-200 dark:border-amber-900/50">
                                <strong>Catatan Revisi:</strong> {item.catatan_revisi}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px]">
                        <span className="px-2 py-0.5 rounded-none bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10">
                          {item.category_label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                        {item.author}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleTogglePublished(item)}
                            className={`px-2 py-0.5 rounded-none text-[10px] font-mono font-bold tracking-wider uppercase cursor-pointer border ${
                              item.is_published
                                ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40"
                                : item.status === "pending_review"
                                ? "bg-sky-50 dark:bg-sky-950/40 text-[#0094E0] dark:text-sky-300 border-sky-200 dark:border-sky-800/40"
                                : "bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-white/10"
                            }`}
                          >
                            {item.is_published
                              ? "Terbit"
                              : item.status === "pending_review"
                              ? "Review"
                              : "Draf"}
                          </button>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 font-mono text-[11px] whitespace-nowrap">
                        {new Date(item.published_at).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {item.status === "pending_review" && canPublishContent(currentUserRole) && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleApproveBerita(item)}
                                className="px-2 py-1 rounded-none bg-emerald-600 text-white text-[10px] font-bold hover:bg-emerald-700 transition-colors flex items-center gap-1 cursor-pointer"
                                title="Setujui dan langsung terbitkan Berita"
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
                                className="px-2 py-1 rounded-none bg-amber-500 text-white text-[10px] font-bold hover:bg-amber-600 transition-colors flex items-center gap-1 cursor-pointer"
                                title="Kembalikan Berita dengan catatan revisi"
                              >
                                <span>Revisi</span>
                              </button>
                            </>
                          )}
                          <Link
                            href={`/berita/${item.slug}`}
                            target="_blank"
                            className="p-1.5 rounded-none text-slate-400 hover:text-[#00296E] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                            title="Pratinjau Halaman Berita"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          {(canEditPublishedContent(currentUserRole) || !item.is_published) && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleOpenEditBerita(item)}
                                className="p-1.5 rounded-none text-slate-400 hover:text-[#00296E] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                                title="Edit Artikel"
                              >
                                <NotePencil className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setBeritaToDelete(item)}
                                className="p-1.5 rounded-none text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                                title="Hapus Artikel"
                              >
                                <Trash className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Tampilan Kartu Mobile */}
            <div className="lg:hidden divide-y divide-[#00296E]/10 dark:divide-white/5">
              {filteredBerita.map((item) => (
                <div key={item.id} className="p-3.5 space-y-2">
                  <div className="flex items-start gap-3">
                    <img
                      src={item.image_url || "/DSC01203.jpg"}
                      alt={item.title}
                      className="w-16 h-12 object-cover rounded-none shrink-0 border border-slate-200 dark:border-white/10"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = "/DSC01203.jpg";
                      }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-1.5 py-0.5 rounded-none text-[9px] font-mono bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300">
                          {item.category_label}
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded-none text-[9px] font-mono font-bold uppercase ${
                            item.is_published
                              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300"
                              : "bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400"
                          }`}
                        >
                          {item.is_published ? "Terbit" : "Draf"}
                        </span>
                      </div>
                      <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200 line-clamp-2 mt-1">
                        {item.title}
                      </h4>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-1">
                    <span>{item.author}</span>
                    <span>
                      {new Date(item.published_at).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-white/5">
                    <Link
                      href={`/berita/${item.slug}`}
                      target="_blank"
                      className="text-xs text-[#0094E0] dark:text-[#38BDF8] font-semibold flex items-center gap-1 py-1 px-2"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Lihat</span>
                    </Link>
                    {(canEditPublishedContent(currentUserRole) || !item.is_published) && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleOpenEditBerita(item)}
                          className="text-xs text-slate-600 dark:text-slate-300 font-semibold flex items-center gap-1 py-1 px-2"
                        >
                          <NotePencil className="w-3.5 h-3.5" />
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
                  <div className="relative rounded-none border border-[#00296E]/20 dark:border-white/10 overflow-hidden bg-slate-100 dark:bg-black/30 group shadow-none">
                    <div className="relative w-full aspect-[16/8] sm:aspect-[16/7] overflow-hidden">
                      <img
                        src={formBeritaImage}
                        alt="Preview Sampul Berita"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = "/DSC01203.jpg";
                        }}
                      />

                      <div className="absolute top-3 left-3 bg-[#00296E]/90 dark:bg-[#001438]/90 backdrop-blur-xs text-white text-[11px] font-bold px-3 py-1 rounded-none border border-white/20 shadow-none flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Foto Sampul Terpasang</span>
                      </div>

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

                    {uploadingBeritaImage && (
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center text-white text-xs font-bold gap-2">
                        <ArrowsClockwise className="w-6 h-6 animate-spin text-sky-300" />
                        <span>Sedang mengompresi & mengunggah foto...</span>
                      </div>
                    )}
                  </div>
                ) : (
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

      {/* POPUP MODAL: TOLAK BERITA DENGAN CATATAN REVISI */}
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
    </div>
  );
}
