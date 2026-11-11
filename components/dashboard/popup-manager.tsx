"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  MegaphoneSimple,
  Plus,
  PencilSimple,
  Trash,
  ArrowSquareOut,
  CheckCircle,
  XCircle,
  X,
  Sparkle,
  Eye,
  Info,
  ArrowsClockwise,
  Check,
  ToggleLeft,
  ToggleRight,
  MagnifyingGlass,
  Funnel,
  Image as ImageIcon,
} from "@phosphor-icons/react";
import {
  type PopupItem,
  type CreatePopupPayload,
  type UpdatePopupPayload,
} from "@/lib/types/popup";
import {
  getAllPopups,
  createPopup,
  updatePopup,
  setActivePopup,
  deletePopup,
} from "@/lib/supabase/popup";
import { recordAuditLog } from "@/lib/supabase/audit-log";

interface PopupManagerProps {
  currentUserName?: string;
  currentUserRole?: string;
}

export default function PopupManager({
  currentUserName = "Pengurus HIMASI",
  currentUserRole = "admin",
}: PopupManagerProps) {
  const [popups, setPopups] = useState<PopupItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [filterActive, setFilterActive] = useState<"all" | "active" | "inactive">("all");

  // Modal Create / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PopupItem | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formTag, setFormTag] = useState("PENGUMUMAN");
  const [formContent, setFormContent] = useState("");
  const [formImageUrl, setFormImageUrl] = useState("");
  const [formCtaText, setFormCtaText] = useState("");
  const [formCtaUrl, setFormCtaUrl] = useState("");
  const [formIsActive, setFormIsActive] = useState(false);

  // Modal Delete Confirmation
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<PopupItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllPopups();
      setPopups(data);
    } catch (err: any) {
      console.warn("[PopupManager] Gagal memuat data popup:", err);
      showToast("Gagal memuat data pengumuman popup");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Cari popup yang sedang aktif saat ini
  const activePopup = useMemo(() => {
    return popups.find((p) => p.is_active) || null;
  }, [popups]);

  // Filter list
  const filteredPopups = useMemo(() => {
    return popups.filter((item) => {
      const matchQuery =
        !searchQuery ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tag.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.content.toLowerCase().includes(searchQuery.toLowerCase());

      const matchActive =
        filterActive === "all"
          ? true
          : filterActive === "active"
          ? item.is_active
          : !item.is_active;

      return matchQuery && matchActive;
    });
  }, [popups, searchQuery, filterActive]);

  const handleOpenCreateModal = () => {
    setEditingItem(null);
    setFormTitle("");
    setFormTag("PENGUMUMAN");
    setFormContent("");
    setFormImageUrl("");
    setFormCtaText("");
    setFormCtaUrl("");
    // Jika belum ada popup aktif sama sekali, defaultkan aktif
    setFormIsActive(popups.every((p) => !p.is_active));
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: PopupItem) => {
    setEditingItem(item);
    setFormTitle(item.title);
    setFormTag(item.tag);
    setFormContent(item.content);
    setFormImageUrl(item.image_url || "");
    setFormCtaText(item.cta_text || "");
    setFormCtaUrl(item.cta_url || "");
    setFormIsActive(item.is_active);
    setIsModalOpen(true);
  };

  const handleSavePopup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formContent.trim()) {
      showToast("Judul dan Konten pengumuman wajib diisi.");
      return;
    }

    setSaving(true);
    try {
      if (editingItem) {
        // Mode Edit
        const payload: UpdatePopupPayload = {
          title: formTitle.trim(),
          tag: formTag.trim().toUpperCase() || "PENGUMUMAN",
          content: formContent.trim(),
          image_url: formImageUrl.trim() || null,
          cta_text: formCtaText.trim() || null,
          cta_url: formCtaUrl.trim() || null,
          is_active: formIsActive,
        };

        const updated = await updatePopup(editingItem.id, payload);
        if (updated) {
          showToast("Pengumuman popup berhasil diperbarui.");
          // Non-blocking audit log
          recordAuditLog({
            modul: "banner",
            aksi: `Memperbarui popup pengumuman: "${payload.title}"`,
            pengurus_nama: currentUserName,
            pengurus_role: currentUserRole,
            status: "berhasil",
            detail: `Status Aktif: ${formIsActive ? "Ya" : "Tidak"}, Tag: ${payload.tag}`,
          }).catch((err) => console.warn("[AuditLog] Gagal mencatat:", err));
        }
      } else {
        // Mode Tambah Baru
        const payload: CreatePopupPayload = {
          title: formTitle.trim(),
          tag: formTag.trim().toUpperCase() || "PENGUMUMAN",
          content: formContent.trim(),
          image_url: formImageUrl.trim() || null,
          cta_text: formCtaText.trim() || null,
          cta_url: formCtaUrl.trim() || null,
          is_active: formIsActive,
          created_by: currentUserName,
        };

        const created = await createPopup(payload);
        if (created) {
          showToast("Pengumuman popup baru berhasil diterbitkan.");
          // Non-blocking audit log
          recordAuditLog({
            modul: "banner",
            aksi: `Menambahkan popup pengumuman baru: "${payload.title}"`,
            pengurus_nama: currentUserName,
            pengurus_role: currentUserRole,
            status: "berhasil",
            detail: `Status Aktif: ${formIsActive ? "Ya" : "Tidak"}, Tag: ${payload.tag}`,
          }).catch((err) => console.warn("[AuditLog] Gagal mencatat:", err));
        }
      }

      await loadData();
      setIsModalOpen(false);
    } catch (err: any) {
      console.error("[PopupManager] Gagal menyimpan:", err);
      showToast("Gagal menyimpan pengumuman popup");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (item: PopupItem) => {
    const nextState = !item.is_active;

    try {
      if (nextState) {
        // Aktifkan popup ini (otomatis menonaktifkan yang lain)
        await setActivePopup(item.id);
        showToast(`Pengumuman "${item.title}" sekarang aktif di beranda.`);
        recordAuditLog({
          modul: "banner",
          aksi: `Mengaktifkan popup pengumuman: "${item.title}"`,
          pengurus_nama: currentUserName,
          pengurus_role: currentUserRole,
          status: "berhasil",
          detail: `ID: ${item.id}`,
        }).catch((err) => console.warn("[AuditLog] Gagal mencatat:", err));
      } else {
        // Nonaktifkan popup ini
        await updatePopup(item.id, { is_active: false });
        showToast(`Pengumuman "${item.title}" dinonaktifkan.`);
        recordAuditLog({
          modul: "banner",
          aksi: `Menonaktifkan popup pengumuman: "${item.title}"`,
          pengurus_nama: currentUserName,
          pengurus_role: currentUserRole,
          status: "berhasil",
          detail: `ID: ${item.id}`,
        }).catch((err) => console.warn("[AuditLog] Gagal mencatat:", err));
      }
      await loadData();
    } catch (err: any) {
      console.error("[PopupManager] Gagal mengubah status aktif:", err);
      showToast("Gagal mengubah status aktif popup");
    }
  };

  const handleRequestDelete = (item: PopupItem) => {
    setItemToDelete(item);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    setDeleting(true);
    try {
      await deletePopup(itemToDelete.id);
      showToast(`Pengumuman "${itemToDelete.title}" berhasil dihapus.`);
      recordAuditLog({
        modul: "banner",
        aksi: `Menghapus popup pengumuman: "${itemToDelete.title}"`,
        pengurus_nama: currentUserName,
        pengurus_role: currentUserRole,
        status: "berhasil",
        detail: `ID: ${itemToDelete.id}`,
      }).catch((err) => console.warn("[AuditLog] Gagal mencatat:", err));
      await loadData();
      setDeleteModalOpen(false);
      setItemToDelete(null);
    } catch (err: any) {
      console.error("[PopupManager] Gagal menghapus:", err);
      showToast("Gagal menghapus popup");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#00296E] dark:bg-[#38BDF8] text-white dark:text-[#001740] px-4 py-2.5 rounded-none shadow-lg text-xs font-semibold uppercase tracking-wider flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <Info size={16} weight="regular" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Info & Action Card */}
      <div className="bg-white dark:bg-[#001438] p-5 border border-[#00296E]/15 dark:border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20">
            <MegaphoneSimple size={22} weight="regular" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#00296E] dark:text-white uppercase tracking-wider flex items-center gap-2">
              <span>Manajemen Popup Pengumuman Beranda</span>
              <span className="px-2 py-0.5 text-[10px] font-mono border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300">
                1 Popup Aktif
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Kelola flyer poster &amp; pengumuman khusus yang tampil pertama kali saat pengunjung membuka web HIMASI.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="p-2 border border-[#00296E]/20 dark:border-white/20 text-slate-600 dark:text-slate-300 hover:text-slate-900 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
            title="Muat Ulang Data"
          >
            <ArrowsClockwise size={16} weight="regular" className={loading ? "animate-spin" : ""} />
          </button>
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-[#00296E] hover:bg-[#001f54] text-white text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
          >
            <Plus size={16} weight="regular" />
            <span>Buat Pengumuman Baru</span>
          </button>
        </div>
      </div>

      {/* HIGHLIGHT: PENGUMUMAN AKTIF SAAT INI */}
      <div className="bg-slate-50 dark:bg-[#001740] p-5 border border-[#00296E]/15 dark:border-white/10 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkle size={16} weight="regular" className="text-amber-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#00296E] dark:text-white">
              Status Pengumuman Aktif di Beranda
            </h3>
          </div>
          {activePopup ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
              <CheckCircle size={14} weight="regular" />
              SEDANG TAYANG DI HOMEPAGE
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono font-semibold uppercase tracking-wider bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-white/10">
              <XCircle size={14} weight="regular" />
              TIDAK ADA POPUP AKTIF
            </span>
          )}
        </div>

        {activePopup ? (
          <div className="bg-white dark:bg-[#001438] p-4 border border-[#00296E]/10 dark:border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              {activePopup.image_url ? (
                <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-200 dark:border-white/10 overflow-hidden">
                  <img
                    src={activePopup.image_url}
                    alt={activePopup.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-20 h-20 bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0 border border-amber-500/20">
                  <MegaphoneSimple size={28} weight="regular" />
                </div>
              )}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-[#00296E]/10 dark:bg-[#38BDF8]/10 text-[#00296E] dark:text-[#38BDF8]">
                    {activePopup.tag}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    ID: {activePopup.id.slice(0, 12)}...
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                  {activePopup.title}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 max-w-2xl">
                  {activePopup.content}
                </p>
                {activePopup.cta_text && activePopup.cta_url && (
                  <div className="pt-1 flex items-center gap-2 text-xs text-[#00296E] dark:text-[#38BDF8]">
                    <span className="font-semibold">Tombol CTA:</span>
                    <span className="underline">{activePopup.cta_text}</span>
                    <span className="text-slate-400 font-mono">({activePopup.cta_url})</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 self-end md:self-center shrink-0">
              <button
                type="button"
                onClick={() => handleOpenEditModal(activePopup)}
                className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider border border-[#00296E]/20 dark:border-white/20 text-[#00296E] dark:text-white hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <PencilSimple size={14} weight="regular" />
                <span>Edit</span>
              </button>
              <button
                type="button"
                onClick={() => handleToggleActive(activePopup)}
                className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider border border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <XCircle size={14} weight="regular" />
                <span>Nonaktifkan</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-white dark:bg-[#001438] border border-dashed border-slate-300 dark:border-white/10 text-center py-6">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Saat ini tidak ada popup yang sedang aktif. Pengunjung beranda tidak akan melihat pengumuman pembuka.
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Klik sakelar status "Aktifkan" pada salah satu daftar pengumuman di bawah untuk menayangkannya.
            </p>
          </div>
        )}
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-[#001438] p-3 border border-[#00296E]/15 dark:border-white/10">
        <div className="relative w-full sm:w-72">
          <MagnifyingGlass
            size={16}
            weight="regular"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari judul, tag, atau isi..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-[#00296E]/20 dark:border-white/20 bg-transparent text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#00296E] dark:focus:border-[#38BDF8]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-1 text-xs">
            <span className="text-slate-400 text-[11px] font-mono mr-1">Filter:</span>
            <button
              type="button"
              onClick={() => setFilterActive("all")}
              className={`px-2.5 py-1 text-xs uppercase tracking-wider font-semibold transition-colors cursor-pointer ${
                filterActive === "all"
                  ? "bg-[#00296E] text-white"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
              }`}
            >
              Semua ({popups.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterActive("active")}
              className={`px-2.5 py-1 text-xs uppercase tracking-wider font-semibold transition-colors cursor-pointer ${
                filterActive === "active"
                  ? "bg-[#00296E] text-white"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
              }`}
            >
              Aktif ({popups.filter((p) => p.is_active).length})
            </button>
            <button
              type="button"
              onClick={() => setFilterActive("inactive")}
              className={`px-2.5 py-1 text-xs uppercase tracking-wider font-semibold transition-colors cursor-pointer ${
                filterActive === "inactive"
                  ? "bg-[#00296E] text-white"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
              }`}
            >
              Nonaktif ({popups.filter((p) => !p.is_active).length})
            </button>
          </div>
        </div>
      </div>

      {/* DAFTAR POPUP TABLE / LIST */}
      <div className="bg-white dark:bg-[#001438] border border-[#00296E]/15 dark:border-white/10 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
            <ArrowsClockwise size={18} weight="regular" className="animate-spin text-[#00296E] dark:text-[#38BDF8]" />
            <span>Memuat daftar popup pengumuman...</span>
          </div>
        ) : filteredPopups.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <MegaphoneSimple size={36} weight="regular" className="mx-auto text-slate-300 dark:text-slate-600" />
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              Tidak ada data pengumuman popup yang cocok.
            </p>
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="inline-flex items-center gap-1.5 text-xs text-[#00296E] dark:text-[#38BDF8] font-bold uppercase tracking-wider underline mt-2"
            >
              <Plus size={14} weight="regular" />
              <span>Buat Pengumuman Pertama</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#00296E]/15 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-slate-400 font-mono text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-4">Status &amp; Poster</th>
                  <th className="py-3 px-4">Judul &amp; Konten</th>
                  <th className="py-3 px-4">Tag Kategori</th>
                  <th className="py-3 px-4">Call To Action</th>
                  <th className="py-3 px-4">Dibuat Oleh</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#00296E]/10 dark:divide-white/5">
                {filteredPopups.map((item) => (
                  <tr
                    key={item.id}
                    className={`hover:bg-slate-50/80 dark:hover:bg-white/5 transition-colors ${
                      item.is_active ? "bg-amber-500/5 dark:bg-amber-500/10" : ""
                    }`}
                  >
                    {/* Status & Poster */}
                    <td className="py-3 px-4 align-top w-36">
                      <div className="space-y-2">
                        {item.image_url ? (
                          <div className="w-20 h-14 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 overflow-hidden">
                            <img
                              src={item.image_url}
                              alt={item.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-20 h-14 bg-slate-100 dark:bg-white/5 text-slate-400 flex items-center justify-center border border-slate-200 dark:border-white/10">
                            <ImageIcon size={20} weight="regular" />
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => handleToggleActive(item)}
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider border cursor-pointer transition-colors ${
                            item.is_active
                              ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
                              : "bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-white/10 hover:border-[#00296E]"
                          }`}
                          title="Klik untuk mengubah status aktif"
                        >
                          {item.is_active ? (
                            <>
                              <ToggleRight size={14} weight="regular" className="text-emerald-600" />
                              <span>AKTIF</span>
                            </>
                          ) : (
                            <>
                              <ToggleLeft size={14} weight="regular" />
                              <span>NONAKTIF</span>
                            </>
                          )}
                        </button>
                      </div>
                    </td>

                    {/* Judul & Konten */}
                    <td className="py-3 px-4 align-top max-w-sm">
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                          {item.title}
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                          {item.content}
                        </p>
                      </div>
                    </td>

                    {/* Tag */}
                    <td className="py-3 px-4 align-top whitespace-nowrap">
                      <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-[#00296E]/10 dark:bg-[#38BDF8]/10 text-[#00296E] dark:text-[#38BDF8]">
                        {item.tag}
                      </span>
                    </td>

                    {/* CTA */}
                    <td className="py-3 px-4 align-top max-w-[180px]">
                      {item.cta_text && item.cta_url ? (
                        <a
                          href={item.cta_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-[#00296E] dark:text-[#38BDF8] hover:underline"
                        >
                          <span className="font-semibold truncate max-w-[130px]">{item.cta_text}</span>
                          <ArrowSquareOut size={12} weight="regular" className="shrink-0" />
                        </a>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">Tanpa Tombol</span>
                      )}
                    </td>

                    {/* Dibuat Oleh */}
                    <td className="py-3 px-4 align-top whitespace-nowrap text-slate-500 dark:text-slate-400 text-[11px]">
                      <div>{item.created_by}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {item.updated_at ? new Date(item.updated_at).toLocaleDateString("id-ID") : "-"}
                      </div>
                    </td>

                    {/* Aksi */}
                    <td className="py-3 px-4 align-top text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(item)}
                          className="p-1.5 border border-[#00296E]/20 dark:border-white/20 text-[#00296E] dark:text-[#38BDF8] hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
                          title="Edit Pengumuman"
                        >
                          <PencilSimple size={14} weight="regular" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRequestDelete(item)}
                          className="p-1.5 border border-rose-500/20 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors cursor-pointer"
                          title="Hapus Pengumuman"
                        >
                          <Trash size={14} weight="regular" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL FORM: BUAT / EDIT POPUP (DENGAN LIVE PREVIEW MOCKUP) */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200"
          onClick={() => !saving && setIsModalOpen(false)}
        >
          <div
            className="relative w-full max-w-4xl bg-white dark:bg-[#001438] border border-[#00296E]/20 dark:border-white/10 shadow-2xl overflow-hidden my-6 max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-[#00296E]/15 dark:border-white/10 flex items-center justify-between bg-slate-50 dark:bg-white/5">
              <div className="flex items-center gap-2.5">
                <MegaphoneSimple size={20} weight="regular" className="text-amber-500" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#00296E] dark:text-white">
                  {editingItem ? "Edit Pengumuman Popup Beranda" : "Buat Pengumuman Popup Baru"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                disabled={saving}
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white transition cursor-pointer"
                aria-label="Tutup Modal"
              >
                <X size={18} weight="regular" />
              </button>
            </div>

            {/* Modal Body: 2 Kolom (Kiri: Form Input, Kanan: Live Preview Mockup) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 overflow-y-auto flex-1 divide-y lg:divide-y-0 lg:divide-x divide-[#00296E]/15 dark:divide-white/10">
              {/* Kolom Kiri: Form Input */}
              <form onSubmit={handleSavePopup} className="lg:col-span-7 p-5 space-y-4">
                {/* Judul Pengumuman */}
                <div>
                  <label className="block text-[11px] font-mono uppercase text-slate-600 dark:text-slate-400 mb-1">
                    Judul Pengumuman <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="Contoh: Open Recruitment Pengurus HIMASI 2026"
                    className="w-full px-3 py-2 text-xs border border-[#00296E]/20 dark:border-white/20 bg-transparent text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#00296E] dark:focus:border-[#38BDF8]"
                  />
                </div>

                {/* Tag Kategori & Sakelar Status */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono uppercase text-slate-600 dark:text-slate-400 mb-1">
                      Tag Kategori
                    </label>
                    <input
                      type="text"
                      value={formTag}
                      onChange={(e) => setFormTag(e.target.value)}
                      placeholder="PENGUMUMAN / OPREC / AGENDA"
                      className="w-full px-3 py-2 text-xs border border-[#00296E]/20 dark:border-white/20 bg-transparent text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#00296E] dark:focus:border-[#38BDF8]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono uppercase text-slate-600 dark:text-slate-400 mb-1">
                      Status Tayang
                    </label>
                    <label className="flex items-center gap-2 p-2 border border-[#00296E]/20 dark:border-white/20 bg-slate-50 dark:bg-white/5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formIsActive}
                        onChange={(e) => setFormIsActive(e.target.checked)}
                        className="rounded-none w-4 h-4 text-[#00296E] accent-[#00296E] cursor-pointer"
                      />
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {formIsActive ? "Tayangkan Langsung" : "Simpan Draf (Nonaktif)"}
                      </span>
                    </label>
                  </div>
                </div>

                {/* URL Gambar Poster / Flyer */}
                <div>
                  <label className="block text-[11px] font-mono uppercase text-slate-600 dark:text-slate-400 mb-1">
                    URL Poster Flyer (Opsional)
                  </label>
                  <input
                    type="url"
                    value={formImageUrl}
                    onChange={(e) => setFormImageUrl(e.target.value)}
                    placeholder="https://... atau biarkan kosong jika hanya teks"
                    className="w-full px-3 py-2 text-xs border border-[#00296E]/20 dark:border-white/20 bg-transparent text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#00296E] dark:focus:border-[#38BDF8]"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Gunakan rasio 16:9 atau 4:3 untuk hasil pratinjau terbaik.
                  </span>
                </div>

                {/* Konten / Isi Lengkap Pengumuman */}
                <div>
                  <label className="block text-[11px] font-mono uppercase text-slate-600 dark:text-slate-400 mb-1">
                    Isi Pengumuman <span className="text-rose-600">*</span>
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={formContent}
                    onChange={(e) => setFormContent(e.target.value)}
                    placeholder="Tuliskan detail pengumuman yang jelas untuk pengunjung..."
                    className="w-full px-3 py-2 text-xs border border-[#00296E]/20 dark:border-white/20 bg-transparent text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#00296E] dark:focus:border-[#38BDF8]"
                  />
                </div>

                {/* Tombol Call to Action (CTA) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-mono uppercase text-slate-600 dark:text-slate-400 mb-1">
                      Teks Tombol CTA (Opsional)
                    </label>
                    <input
                      type="text"
                      value={formCtaText}
                      onChange={(e) => setFormCtaText(e.target.value)}
                      placeholder="Contoh: Daftar Sekarang"
                      className="w-full px-3 py-2 text-xs border border-[#00296E]/20 dark:border-white/20 bg-transparent text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#00296E] dark:focus:border-[#38BDF8]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono uppercase text-slate-600 dark:text-slate-400 mb-1">
                      Link Tujuan CTA (Opsional)
                    </label>
                    <input
                      type="text"
                      value={formCtaUrl}
                      onChange={(e) => setFormCtaUrl(e.target.value)}
                      placeholder="/s/oprec atau https://..."
                      className="w-full px-3 py-2 text-xs border border-[#00296E]/20 dark:border-white/20 bg-transparent text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#00296E] dark:focus:border-[#38BDF8]"
                    />
                  </div>
                </div>

                {/* Submit Buttons */}
                <div className="pt-4 border-t border-[#00296E]/15 dark:border-white/10 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    disabled={saving}
                    className="px-4 py-2 border border-slate-300 dark:border-white/20 text-slate-600 dark:text-slate-300 hover:text-slate-900 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2 bg-[#00296E] hover:bg-[#001f54] text-white text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Check size={16} weight="regular" />
                    <span>{saving ? "Menyimpan..." : "Simpan Pengumuman"}</span>
                  </button>
                </div>
              </form>

              {/* Kolom Kanan: Pratinjau / Live Preview Mockup Modal Homepage */}
              <div className="lg:col-span-5 p-5 bg-slate-100/70 dark:bg-black/30 flex flex-col justify-start">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Eye size={16} weight="regular" className="text-[#00296E] dark:text-[#38BDF8]" />
                    <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                      Live Preview Mockup Beranda
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">
                    Tampilan Pengunjung
                  </span>
                </div>

                {/* Mockup Card Beranda */}
                <div className="relative w-full bg-white dark:bg-neutral-900 rounded-2xl shadow-xl border border-slate-200 dark:border-neutral-800 overflow-hidden">
                  {/* Close button mock */}
                  <div className="absolute top-2.5 right-2.5 z-10 w-6 h-6 rounded-full bg-black/40 text-white flex items-center justify-center">
                    <X size={12} weight="regular" />
                  </div>

                  {/* Image Poster */}
                  {formImageUrl ? (
                    <div className="w-full aspect-[16/9] bg-slate-200 overflow-hidden">
                      <img
                        src={formImageUrl}
                        alt="Poster Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = "none";
                        }}
                      />
                    </div>
                  ) : (
                    <div className="w-full h-20 bg-slate-100 dark:bg-neutral-800 flex items-center justify-center text-slate-400 text-xs">
                      <span className="italic">Tanpa Gambar Poster</span>
                    </div>
                  )}

                  {/* Content Preview */}
                  <div className="p-4 space-y-2.5">
                    <span className="inline-block px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20 rounded-full">
                      {formTag.toUpperCase() || "PENGUMUMAN"}
                    </span>

                    <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-snug">
                      {formTitle || "Judul Pengumuman Akan Muncul Di Sini"}
                    </h4>

                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed whitespace-pre-line line-clamp-4">
                      {formContent || "Rincian isi pengumuman akan ditampilkan pada bagian ini secara rapi dan mudah dibaca oleh pengunjung..."}
                    </p>

                    {formCtaText && (
                      <div className="pt-1">
                        <div className="w-full py-1.5 px-3 rounded-lg bg-[#00296E] text-white text-[11px] font-semibold flex items-center justify-center gap-1.5 shadow-sm">
                          <span>{formCtaText}</span>
                          <ArrowSquareOut size={12} weight="regular" />
                        </div>
                      </div>
                    )}

                    <div className="pt-2 border-t border-slate-100 dark:border-neutral-800 flex items-center justify-between text-[10px] text-slate-400">
                      <label className="flex items-center gap-1">
                        <input type="checkbox" readOnly checked disabled className="rounded w-3 h-3" />
                        <span>Jangan tampilkan lagi</span>
                      </label>
                      <span className="underline">Tutup</span>
                    </div>
                  </div>
                </div>

                <p className="text-[10px] text-slate-400 mt-3 text-center">
                  * Pratinjau di atas menyesuaikan tema dan dimensi modal popup sesungguhnya di halaman beranda.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL KONFIRMASI HAPUS */}
      {deleteModalOpen && itemToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => !deleting && setDeleteModalOpen(false)}
        >
          <div
            className="w-full max-w-md bg-white dark:bg-[#001438] border border-rose-500/30 p-5 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <div className="w-10 h-10 bg-rose-500/10 flex items-center justify-center shrink-0 border border-rose-500/20">
                <Trash size={20} weight="regular" />
              </div>
              <div>
                <h4 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  Hapus Pengumuman Popup?
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Tindakan ini permanen dan tidak dapat dibatalkan.
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs space-y-1">
              <div className="font-semibold text-slate-900 dark:text-white">{itemToDelete.title}</div>
              <div className="text-slate-400 text-[11px] font-mono">Tag: {itemToDelete.tag}</div>
              {itemToDelete.is_active && (
                <div className="text-rose-600 dark:text-rose-400 font-semibold text-[11px]">
                  ⚠️ Perhatian: Popup ini sedang aktif di beranda!
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                disabled={deleting}
                className="px-4 py-2 border border-slate-300 dark:border-white/20 text-slate-600 dark:text-slate-300 text-xs font-semibold uppercase tracking-wider cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50"
              >
                {deleting ? "Menghapus..." : "Ya, Hapus Permanen"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
