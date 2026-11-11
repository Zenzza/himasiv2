"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  LinkSimpleHorizontal,
  QrCode as QrIcon,
  Plus,
  MagnifyingGlass,
  Copy,
  Check,
  DownloadSimple,
  Trash,
  NotePencil,
  ArrowsClockwise,
  Funnel,
  TrendUp,
  Globe,
  X,
  FileCode,
  CheckCircle,
  XCircle,
  WarningCircle,
} from "@phosphor-icons/react";
import { type ShortLinkItem } from "@/lib/types/shortlink";
import {
  getAllShortLinks,
  createShortLink,
  updateShortLink,
  toggleShortLinkActive,
  deleteShortLink,
} from "@/lib/supabase/shortlink";
import {
  generateQrDataUrl,
  generateQrSvg,
  sanitizeSlug,
  validateShortLinkInput,
  HIMASI_BRAND_NAVY,
} from "@/lib/utils/qr-generator";
import { recordAuditLog } from "@/lib/supabase/audit-log";

interface ShortlinkManagerProps {
  currentUserName?: string;
  currentUserRole?: string;
}

const DIVISI_OPTIONS = ["BPH", "Medkominfo", "Litbang", "Biskraf", "Kaderisasi", "Humas"];

export default function ShortlinkManager({
  currentUserName = "Pengurus HIMASI",
  currentUserRole = "pengurus",
}: ShortlinkManagerProps) {
  const actorName = currentUserName || "Pengurus HIMASI";

  // Data State
  const [links, setLinks] = useState<ShortLinkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDivisi, setSelectedDivisi] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<"all" | "active" | "inactive">("all");

  // Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }, []);

  // Modal State
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ShortLinkItem | null>(null);
  const [saving, setSaving] = useState(false);

  // Form Fields
  const [formTitle, setFormTitle] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [formOriginalUrl, setFormOriginalUrl] = useState("");
  const [formDivisi, setFormDivisi] = useState("BPH");
  const [formDescription, setFormDescription] = useState("");
  const [formIsActive, setFormIsActive] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);

  // Live QR Preview in Form
  const [formQrPreview, setFormQrPreview] = useState<string>("");

  // QR Inspection Modal
  const [activeQrModalItem, setActiveQrModalItem] = useState<ShortLinkItem | null>(null);
  const [modalQrDataUrl, setModalQrDataUrl] = useState<string>("");
  const [modalQrColor, setModalQrColor] = useState<string>(HIMASI_BRAND_NAVY);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  // Delete Modal
  const [itemToDelete, setItemToDelete] = useState<ShortLinkItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Base host for full shortlink URL
  const [originUrl] = useState(() =>
    typeof window !== "undefined" ? window.location.origin : "https://himasi.atmaluhur.ac.id"
  );

  // 1. Muat Data Shortlink
  const loadLinks = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllShortLinks();
      setLinks(data);
    } catch (err) {
      console.error("[shortlink] Gagal memuat data:", err);
      showToast("Gagal memuat daftar tautan.");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    let isMounted = true;
    getAllShortLinks()
      .then((data) => {
        if (isMounted) {
          setLinks(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("[shortlink] Gagal memuat data:", err);
        if (isMounted) {
          showToast("Gagal memuat daftar tautan.");
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [showToast]);

  // 2. Real-time Live QR Preview di dalam Form Modal
  useEffect(() => {
    if (!isFormModalOpen) return;
    const cleanSlug = sanitizeSlug(formSlug);
    const targetUrl = `${originUrl}/s/${cleanSlug || "contoh"}`;

    let isMounted = true;
    generateQrDataUrl(targetUrl, { width: 300 })
      .then((url) => {
        if (isMounted) setFormQrPreview(url);
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [formSlug, isFormModalOpen, originUrl]);

  // 3. Generate QR Saat Modal QR Code Dibuka
  useEffect(() => {
    if (!activeQrModalItem) return;
    const fullUrl = `${originUrl}/s/${activeQrModalItem.slug}`;
    generateQrDataUrl(fullUrl, { width: 1000, darkColor: modalQrColor })
      .then((url) => setModalQrDataUrl(url))
      .catch((err) => console.error("Gagal generate QR modal:", err));
  }, [activeQrModalItem, modalQrColor, originUrl]);

  // 4. Buka Form Tambah Baru
  const handleOpenCreateModal = () => {
    setEditingItem(null);
    setFormTitle("");
    setFormSlug("");
    setFormOriginalUrl("");
    setFormDivisi(currentUserRole === "medkominfo" ? "Medkominfo" : "BPH");
    setFormDescription("");
    setFormIsActive(true);
    setFormError(null);
    setIsFormModalOpen(true);
  };

  // 5. Buka Form Edit
  const handleOpenEditModal = (item: ShortLinkItem) => {
    setEditingItem(item);
    setFormTitle(item.title);
    setFormSlug(item.slug);
    setFormOriginalUrl(item.original_url);
    setFormDivisi(item.divisi || "BPH");
    setFormDescription(item.description || "");
    setFormIsActive(item.is_active);
    setFormError(null);
    setIsFormModalOpen(true);
  };

  // 6. Simpan Form (Create / Update)
  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanSlug = sanitizeSlug(formSlug);
    const validation = validateShortLinkInput(formTitle, cleanSlug, formOriginalUrl);

    if (!validation.isValid) {
      setFormError(validation.error || "Form tidak valid.");
      return;
    }

    // Cek duplikasi slug jika membuat baru atau mengubah slug
    const duplicate = links.find(
      (l) => l.slug.toLowerCase() === cleanSlug.toLowerCase() && (!editingItem || l.id !== editingItem.id)
    );
    if (duplicate) {
      setFormError(`Slug "/s/${cleanSlug}" sudah digunakan oleh kegiatan "${duplicate.title}". Silakan gunakan slug lain.`);
      return;
    }

    setSaving(true);
    try {
      if (editingItem) {
        // Mode Edit
        const updated = await updateShortLink(editingItem.id, {
          title: formTitle,
          slug: cleanSlug,
          original_url: formOriginalUrl,
          divisi: formDivisi,
          description: formDescription,
          is_active: formIsActive,
          created_by: actorName,
        });

        if (updated) {
          setLinks((prev) => prev.map((l) => (l.id === editingItem.id ? updated : l)));
        }
        showToast(`Tautan "/s/${cleanSlug}" berhasil diperbarui!`);

        recordAuditLog({
          modul: "tautan",
          aksi: `Memperbarui tautan singkat: "/s/${cleanSlug}"`,
          pengurus_nama: actorName,
          pengurus_role: currentUserRole,
          status: "berhasil",
          detail: `Judul: ${formTitle}, Target: ${formOriginalUrl}, Divisi: ${formDivisi}`,
        }).catch((err) => console.warn("[shortlink] Gagal mencatat audit log:", err));
      } else {
        // Mode Tambah Baru
        const created = await createShortLink({
          title: formTitle,
          slug: cleanSlug,
          original_url: formOriginalUrl,
          divisi: formDivisi,
          description: formDescription,
          is_active: formIsActive,
          created_by: actorName,
        });

        setLinks((prev) => [created, ...prev]);
        showToast(`Tautan resmi "/s/${cleanSlug}" berhasil diterbitkan!`);

        recordAuditLog({
          modul: "tautan",
          aksi: `Membuat tautan singkat & QR baru: "/s/${cleanSlug}"`,
          pengurus_nama: actorName,
          pengurus_role: currentUserRole,
          status: "berhasil",
          detail: `Judul: ${formTitle}, Target: ${formOriginalUrl}, Divisi: ${formDivisi}`,
        }).catch((err) => console.warn("[shortlink] Gagal mencatat audit log:", err));
      }

      setIsFormModalOpen(false);
    } catch (err: unknown) {
      console.error("[shortlink] Gagal menyimpan form:", err);
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan saat menyimpan tautan.";
      setFormError(msg);
    } finally {
      setSaving(false);
    }
  };

  // 7. Toggle Status Aktif / Tutup
  const handleToggleStatus = async (item: ShortLinkItem) => {
    const nextStatus = !item.is_active;
    try {
      const updated = await toggleShortLinkActive(item.id, nextStatus);
      if (updated) {
        setLinks((prev) => prev.map((l) => (l.id === item.id ? { ...l, is_active: nextStatus } : l)));
      }
      showToast(nextStatus ? `Tautan "/s/${item.slug}" diaktifkan.` : `Tautan "/s/${item.slug}" ditutup.`);

      recordAuditLog({
        modul: "tautan",
        aksi: `${nextStatus ? "Mengaktifkan kembali" : "Menonaktifkan (menutup)"} tautan singkat: "/s/${item.slug}"`,
        pengurus_nama: actorName,
        pengurus_role: currentUserRole,
        status: "berhasil",
        detail: `Judul: ${item.title}`,
      }).catch((err) => console.warn("[shortlink] Gagal mencatat audit log:", err));
    } catch (err) {
      console.error("[shortlink] Gagal toggle status:", err);
      showToast("Gagal mengubah status tautan.");
    }
  };

  // 8. Konfirmasi Hapus Tautan
  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    setDeleting(true);
    const target = itemToDelete;

    try {
      await deleteShortLink(target.id);
      setLinks((prev) => prev.filter((l) => l.id !== target.id));
      showToast(`Tautan "/s/${target.slug}" berhasil dihapus.`);

      recordAuditLog({
        modul: "tautan",
        aksi: `Menghapus tautan singkat: "/s/${target.slug}"`,
        pengurus_nama: actorName,
        pengurus_role: currentUserRole,
        status: "berhasil",
        detail: `Judul: ${target.title}, ID: ${target.id}`,
      }).catch((err) => console.warn("[shortlink] Gagal mencatat audit log delete:", err));

      // Muat ulang daftar shortlink dari database agar sinkron
      await loadLinks();
    } catch (err) {
      console.error("[shortlink] Gagal menghapus:", err);
      showToast("Gagal menghapus tautan.");
    } finally {
      setDeleting(false);
      setItemToDelete(null);
    }
  };

  // 9. Salin Tautan ke Clipboard
  const handleCopyLink = (slug: string) => {
    const fullUrl = `${originUrl}/s/${slug}`;
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(fullUrl);
      setCopiedSlug(slug);
      setTimeout(() => setCopiedSlug(null), 2500);
      showToast(`Tautan ${fullUrl} disalin ke papan klip!`);
    }
  };

  // 10. Unduh QR PNG (Resolusi Tinggi 1000px)
  const handleDownloadPng = async (item: ShortLinkItem) => {
    try {
      const fullUrl = `${originUrl}/s/${item.slug}`;
      const dataUrl = await generateQrDataUrl(fullUrl, { width: 1000, darkColor: modalQrColor });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `QR_HIMASI_${item.slug.toUpperCase()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      showToast(`QR Code PNG "/s/${item.slug}" berhasil diunduh.`);
    } catch (err) {
      console.error("Gagal download PNG:", err);
      showToast("Gagal mengunduh gambar QR.");
    }
  };

  // 11. Unduh QR SVG Vektor
  const handleDownloadSvg = async (item: ShortLinkItem) => {
    try {
      const fullUrl = `${originUrl}/s/${item.slug}`;
      const svgString = await generateQrSvg(fullUrl, { darkColor: modalQrColor });
      const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `QR_HIMASI_${item.slug.toUpperCase()}.svg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
      showToast(`QR Code Vektor SVG "/s/${item.slug}" berhasil diunduh.`);
    } catch (err) {
      console.error("Gagal download SVG:", err);
      showToast("Gagal mengunduh berkas SVG.");
    }
  };

  // Filtered List
  const filteredLinks = useMemo(() => {
    return links.filter((item) => {
      const matchSearch =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.original_url.toLowerCase().includes(searchQuery.toLowerCase());

      const matchDivisi = selectedDivisi === "all" || item.divisi === selectedDivisi;

      const matchStatus =
        selectedStatus === "all" ||
        (selectedStatus === "active" && item.is_active) ||
        (selectedStatus === "inactive" && !item.is_active);

      return matchSearch && matchDivisi && matchStatus;
    });
  }, [links, searchQuery, selectedDivisi, selectedStatus]);

  // Summary Metrics
  const totalLinks = links.length;
  const activeLinks = links.filter((l) => l.is_active).length;
  const totalClicks = links.reduce((acc, curr) => acc + (curr.clicks_count || 0), 0);
  const topLink = useMemo(() => {
    if (links.length === 0) return null;
    return [...links].sort((a, b) => (b.clicks_count || 0) - (a.clicks_count || 0))[0];
  }, [links]);

  return (
    <div className="space-y-6 antialiased">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#00296E] text-white px-4 py-3 shadow-lg border border-white/10 flex items-center gap-2.5 text-xs animate-in slide-in-from-bottom-2 duration-150">
          <CheckCircle className="w-4 h-4 text-emerald-400" weight="regular" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono tracking-widest uppercase bg-[#00296E]/10 dark:bg-blue-900/30 text-[#00296E] dark:text-blue-400 px-2 py-0.5 font-bold">
              PORTAL UTILITAS ORGANISASI
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <LinkSimpleHorizontal className="w-6 h-6 text-[#00296E] dark:text-blue-400" weight="regular" />
            <span>Tautan Singkat & QR Hub</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Kelola tautan resmi ber-brand kampus <code className="text-[#00296E] dark:text-blue-400 font-mono">/s/[slug]</code> dan unduh QR Code resolusi tinggi (PNG/SVG) untuk pamflet, spanduk, serta media sosial.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={loadLinks}
            className="p-2.5 border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
            title="Refresh Data"
          >
            <ArrowsClockwise className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} weight="regular" />
          </button>
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#00296E] hover:bg-[#002156] text-white text-xs font-bold tracking-wide transition-colors cursor-pointer shadow-none"
          >
            <Plus className="w-4 h-4" weight="regular" />
            <span>Buat Tautan & QR Baru</span>
          </button>
        </div>
      </div>

      {/* Metric Cards (Swiss Minimalist Grid) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-1">
            Total Tautan
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white">{totalLinks}</span>
            <span className="text-xs text-slate-400 font-mono">link</span>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-1">
            Tautan Aktif
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">{activeLinks}</span>
            <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 font-mono">
              {totalLinks > 0 ? `${Math.round((activeLinks / totalLinks) * 100)}% aktif` : "0%"}
            </span>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-1">
            Total Kunjungan / Klik
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-[#00296E] dark:text-blue-400">
              {totalClicks.toLocaleString("id-ID")}
            </span>
            <TrendUp className="w-4 h-4 text-[#00296E] dark:text-blue-400" weight="regular" />
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-1">
            Tautan Terpopuler
          </span>
          {topLink ? (
            <div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate font-mono">
                /s/{topLink.slug}
              </p>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                {topLink.clicks_count.toLocaleString("id-ID")} kali diklik
              </span>
            </div>
          ) : (
            <span className="text-xs text-slate-400 italic">Belum ada tautan</span>
          )}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 flex flex-col md:flex-row items-center gap-3">
        {/* Search Input */}
        <div className="relative w-full md:flex-1">
          <MagnifyingGlass className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" weight="regular" />
          <input
            type="text"
            placeholder="Cari berdasarkan judul acara, slug /s/[slug], atau URL tujuan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#00296E] dark:focus:border-blue-400"
          />
        </div>

        {/* Divisi Filter */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Funnel className="w-4 h-4 text-slate-400 hidden sm:inline" weight="regular" />
          <select
            value={selectedDivisi}
            onChange={(e) => setSelectedDivisi(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-white/10 text-xs text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer w-full md:w-auto"
          >
            <option value="all">Semua Divisi</option>
            {DIVISI_OPTIONS.map((div) => (
              <option key={div} value={div}>
                Divisi {div}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as "all" | "active" | "inactive")}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-white/10 text-xs text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer w-full md:w-auto"
          >
            <option value="all">Semua Status</option>
            <option value="active">🟢 Aktif (Buka)</option>
            <option value="inactive">🔴 Ditutup</option>
          </select>
        </div>
      </div>

      {/* Table: Daftar Shortlink */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <ArrowsClockwise className="w-6 h-6 animate-spin mx-auto mb-2 text-[#00296E] dark:text-blue-400" weight="regular" />
            <p className="text-xs">Memuat daftar tautan singkat...</p>
          </div>
        ) : filteredLinks.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Globe className="w-8 h-8 mx-auto mb-2 opacity-50" weight="regular" />
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              Tidak ada tautan yang sesuai filter
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Klik &quot;Buat Tautan & QR Baru&quot; untuk menambahkan link promosi organisasi.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-white/10 text-slate-500 font-mono uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">Judul & Target Asli</th>
                  <th className="py-3 px-4">Shortlink Resmi</th>
                  <th className="py-3 px-4 text-center">QR Code</th>
                  <th className="py-3 px-4 text-center">Total Klik</th>
                  <th className="py-3 px-4">Divisi / Penanggung Jawab</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {filteredLinks.map((item) => {
                  const isCopied = copiedSlug === item.slug;
                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-white/[0.02] transition-colors"
                    >
                      {/* Judul & Original URL */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-semibold text-slate-900 dark:text-white truncate">
                          {item.title}
                        </div>
                        <a
                          href={item.original_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] font-mono text-slate-400 hover:text-[#00296E] dark:hover:text-blue-400 truncate block mt-0.5"
                          title={item.original_url}
                        >
                          {item.original_url}
                        </a>
                      </td>

                      {/* Shortlink Badge & Copy */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 border border-slate-200 dark:border-slate-700">
                          <code className="text-xs font-mono font-bold text-[#00296E] dark:text-blue-400">
                            /s/{item.slug}
                          </code>
                          <button
                            type="button"
                            onClick={() => handleCopyLink(item.slug)}
                            className="text-slate-400 hover:text-[#00296E] dark:hover:text-white p-0.5 cursor-pointer"
                            title="Salin Tautan Lengkap"
                          >
                            {isCopied ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" weight="regular" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" weight="regular" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* QR Preview & Modal Trigger */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setActiveQrModalItem(item)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-[#00296E] hover:text-white text-slate-700 dark:text-slate-300 text-[11px] font-medium border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                        >
                          <QrIcon className="w-3.5 h-3.5" weight="regular" />
                          <span>Lihat QR</span>
                        </button>
                      </td>

                      {/* Clicks Count */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span className="font-mono font-bold text-slate-900 dark:text-white">
                          {(item.clicks_count || 0).toLocaleString("id-ID")}
                        </span>
                        <span className="text-[10px] text-slate-400 block">kunjungan</span>
                      </td>

                      {/* Divisi & Creator */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-block px-2 py-0.5 text-[10px] font-mono font-semibold bg-blue-50 dark:bg-blue-950/40 text-[#00296E] dark:text-blue-300 border border-blue-200 dark:border-blue-800/40">
                          {item.divisi}
                        </span>
                        <span className="text-[11px] text-slate-400 block mt-0.5 truncate max-w-[140px]">
                          {item.created_by}
                        </span>
                      </td>

                      {/* Status Toggle Switch */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(item)}
                          className="inline-flex items-center gap-1 cursor-pointer focus:outline-none"
                          title={item.is_active ? "Klik untuk menutup pendaftaran" : "Klik untuk membuka pendaftaran"}
                        >
                          {item.is_active ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                              Aktif
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">
                              Ditutup
                            </span>
                          )}
                        </button>
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(item)}
                            className="p-1.5 text-slate-500 hover:text-[#00296E] dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer"
                            title="Edit Tautan"
                          >
                            <NotePencil className="w-4 h-4" weight="regular" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setItemToDelete(item)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer"
                            title="Hapus Tautan"
                          >
                            <Trash className="w-4 h-4" weight="regular" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: BUAT / EDIT SHORTLINK (DENGAN LIVE QR PREVIEW) */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 w-full max-w-2xl shadow-xl animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-200 dark:border-white/10 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#00296E] dark:text-blue-400 font-bold block mb-0.5">
                  {editingItem ? "EDIT TAUTAN & QR" : "BUAT TAUTAN RESMI BARU"}
                </span>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  {editingItem ? `Perbarui "/s/${editingItem.slug}"` : "Formulir Tautan Singkat & QR Hub"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsFormModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" weight="regular" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveForm} className="p-5 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/40 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                  <WarningCircle className="w-4 h-4 shrink-0" weight="regular" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Form Inputs (2/3) */}
                <div className="md:col-span-2 space-y-3.5">
                  {/* Judul Kegiatan */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Judul Kegiatan / Tautan <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Pendaftaran Makrab TI & SI 2026"
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#00296E]"
                    />
                  </div>

                  {/* Slug Kustom */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Kustom Slug Tautan <span className="text-rose-500">*</span>
                    </label>
                    <div className="flex items-center">
                      <span className="px-2.5 py-2 bg-slate-100 dark:bg-slate-800 border border-r-0 border-slate-200 dark:border-white/10 text-xs font-mono text-slate-500 select-none">
                        /s/
                      </span>
                      <input
                        type="text"
                        required
                        placeholder="makrab2026"
                        value={formSlug}
                        onChange={(e) => setFormSlug(sanitizeSlug(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-white/10 text-xs font-mono font-bold text-[#00296E] dark:text-blue-400 focus:outline-none focus:border-[#00296E]"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Hanya huruf kecil, angka, dan strip (-). Contoh: <code className="font-mono">makrab2026</code>
                    </p>
                  </div>

                  {/* URL Tujuan Asli */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      URL Tujuan Asli (Google Form / Drive / dll.) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="https://forms.gle/xyz atau https://docs.google.com/..."
                      value={formOriginalUrl}
                      onChange={(e) => setFormOriginalUrl(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-white/10 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-[#00296E]"
                    />
                  </div>

                  {/* Divisi & Status */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Divisi Penanggung Jawab
                      </label>
                      <select
                        value={formDivisi}
                        onChange={(e) => setFormDivisi(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none"
                      >
                        {DIVISI_OPTIONS.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Status Tautan
                      </label>
                      <button
                        type="button"
                        onClick={() => setFormIsActive(!formIsActive)}
                        className={`w-full py-2 px-3 border text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                          formIsActive
                            ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 text-emerald-700 dark:text-emerald-400"
                            : "bg-slate-100 dark:bg-slate-800 border-slate-300 text-slate-500"
                        }`}
                      >
                        {formIsActive ? (
                          <>
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" weight="regular" />
                            <span>🟢 Buka (Aktif)</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5 text-slate-400" weight="regular" />
                            <span>🔴 Ditutup</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Deskripsi / Catatan Tambahan */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Catatan Tambahan (Opsional)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Informasi internal atau pengumuman jika pendaftaran ditutup..."
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none"
                    ></textarea>
                  </div>
                </div>

                {/* Live QR Code Preview (1/3) */}
                <div className="flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 text-center">
                  <span className="text-[10px] font-mono uppercase text-slate-400 mb-2 font-bold tracking-wider">
                    PRATINJAU QR REAL-TIME
                  </span>

                  <div className="p-2 bg-white border border-slate-200 shadow-xs mb-2.5">
                    {formQrPreview ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={formQrPreview} alt="Live QR Preview" className="w-32 h-32 object-contain" />
                    ) : (
                      <div className="w-32 h-32 bg-slate-100 flex items-center justify-center text-slate-400 text-xs">
                        Loading...
                      </div>
                    )}
                  </div>

                  <p className="text-[11px] font-mono font-bold text-[#00296E] dark:text-blue-400 truncate max-w-full">
                    /s/{sanitizeSlug(formSlug) || "..."}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    QR Code otomatis terhubung ke URL tujuan asli saat disimpan.
                  </p>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-slate-200 dark:border-white/10 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  disabled={saving}
                  className="px-4 py-2 border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 text-xs font-semibold text-slate-600 dark:text-slate-300 cursor-pointer disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-[#00296E] hover:bg-[#002156] text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {saving && <ArrowsClockwise className="w-3.5 h-3.5 animate-spin" weight="regular" />}
                  <span>{editingItem ? "Simpan Perubahan" : "Terbitkan Tautan & QR"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: INSPEKSI & DOWNLOAD QR CODE BESAR */}
      {activeQrModalItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 w-full max-w-md shadow-2xl p-6 text-center animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-white/10">
              <span className="text-[10px] font-mono tracking-widest uppercase text-[#00296E] dark:text-blue-400 font-bold">
                QR CODE ENGINE
              </span>
              <button
                type="button"
                onClick={() => setActiveQrModalItem(null)}
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" weight="regular" />
              </button>
            </div>

            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              {activeQrModalItem.title}
            </h3>
            <div className="inline-flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-3 py-1 font-mono text-xs font-bold text-[#00296E] dark:text-blue-400 border border-slate-200 dark:border-slate-700 mb-4">
              <span>{originUrl}/s/{activeQrModalItem.slug}</span>
              <button
                type="button"
                onClick={() => handleCopyLink(activeQrModalItem.slug)}
                className="text-slate-400 hover:text-[#00296E] p-0.5 cursor-pointer"
                title="Salin Link"
              >
                {copiedSlug === activeQrModalItem.slug ? (
                  <Check className="w-3.5 h-3.5 text-emerald-500" weight="regular" />
                ) : (
                  <Copy className="w-3.5 h-3.5" weight="regular" />
                )}
              </button>
            </div>

            {/* QR Code Container */}
            <div className="p-4 bg-white border border-slate-200 mx-auto w-fit shadow-xs mb-4">
              {modalQrDataUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={modalQrDataUrl} alt="QR Code Besar" className="w-52 h-52 object-contain" />
              ) : (
                <div className="w-52 h-52 flex items-center justify-center text-slate-400 text-xs">
                  <ArrowsClockwise className="w-6 h-6 animate-spin" weight="regular" />
                </div>
              )}
            </div>

            {/* Color Switcher */}
            <div className="flex items-center justify-center gap-2 mb-5 text-[11px] text-slate-500">
              <span>Warna Tema QR:</span>
              <button
                type="button"
                onClick={() => setModalQrColor(HIMASI_BRAND_NAVY)}
                className={`px-2 py-0.5 border text-xs cursor-pointer font-semibold ${
                  modalQrColor === HIMASI_BRAND_NAVY
                    ? "bg-[#00296E] text-white border-[#00296E]"
                    : "bg-slate-100 text-slate-700 border-slate-300"
                }`}
              >
                Navy HIMASI
              </button>
              <button
                type="button"
                onClick={() => setModalQrColor("#000000")}
                className={`px-2 py-0.5 border text-xs cursor-pointer font-semibold ${
                  modalQrColor === "#000000"
                    ? "bg-black text-white border-black"
                    : "bg-slate-100 text-slate-700 border-slate-300"
                }`}
              >
                Hitam Pekat
              </button>
            </div>

            {/* Download Buttons */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleDownloadPng(activeQrModalItem)}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#00296E] hover:bg-[#002156] text-white text-xs font-bold transition-colors cursor-pointer"
              >
                <DownloadSimple className="w-4 h-4" weight="regular" />
                <span>Unduh PNG (1000px)</span>
              </button>

              <button
                type="button"
                onClick={() => handleDownloadSvg(activeQrModalItem)}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 border border-slate-300 dark:border-white/20 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors cursor-pointer"
              >
                <FileCode className="w-4 h-4" weight="regular" />
                <span>Unduh SVG (Vektor)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: KONFIRMASI HAPUS TAUTAN */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 w-full max-w-sm shadow-xl p-5 text-center animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 mx-auto flex items-center justify-center text-rose-600 mb-3">
              <Trash className="w-6 h-6" weight="regular" />
            </div>

            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
              Hapus Tautan Singkat?
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
              Tautan <strong className="text-slate-800 dark:text-slate-200 font-mono">/s/{itemToDelete.slug}</strong> (&ldquo;{itemToDelete.title}&rdquo;) akan dihapus permanen. Mahasiswa yang memindai QR code ini tidak lagi dapat dialihkan.
            </p>

            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setItemToDelete(null)}
                className="px-4 py-2 border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                {deleting && <ArrowsClockwise className="w-3.5 h-3.5 animate-spin" weight="regular" />}
                <span>Ya, Hapus Tautan</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

