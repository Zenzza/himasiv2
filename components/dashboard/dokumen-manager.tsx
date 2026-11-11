"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  FileText,
  Trash,
  NotePencil,
  DownloadSimple,
  ArrowSquareOut,
  ArrowsClockwise,
  MagnifyingGlass,
  CheckCircle,
  X,
  Check,
} from "@phosphor-icons/react";
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
import { recordAuditLog } from "@/lib/supabase/audit-log";
import DashboardPageHeader from "@/components/dashboard/ui/dashboard-page-header";
import DashboardMetricStrip from "@/components/dashboard/ui/dashboard-metric-strip";

interface DokumenManagerProps {
  currentUserName?: string;
  currentUserRole?: string;
}

export default function DokumenManager({
  currentUserName = "Pengurus HIMASI",
  currentUserRole = "pengurus",
}: DokumenManagerProps) {
  const [dokumenList, setDokumenList] = useState<DokumenOrganisasi[]>(DEFAULT_DOKUMEN_ORGANISASI);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDokumen, setEditingDokumen] = useState<DokumenOrganisasi | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [dokumenToDelete, setDokumenToDelete] = useState<DokumenOrganisasi | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Form State
  const [formJudul, setFormJudul] = useState("");
  const [formDeskripsi, setFormDeskripsi] = useState("");
  const [formFileUrl, setFormFileUrl] = useState("");
  const [formFileName, setFormFileName] = useState("");
  const [formFileSize, setFormFileSize] = useState("");
  const [formUrutan, setFormUrutan] = useState(1);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  }, []);

  const loadDokumen = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getDokumenOrganisasi();
      if (Array.isArray(data)) {
        setDokumenList(data);
      }
    } catch (err) {
      console.warn("[DokumenManager] Gagal memuat dokumen:", err);
      showToast("Gagal memuat dokumen dari database.");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    let isMounted = true;
    getDokumenOrganisasi()
      .then((data) => {
        if (isMounted && Array.isArray(data)) {
          setDokumenList(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.warn("[DokumenManager] Gagal memuat dokumen:", err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Filtered List
  const filteredList = useMemo(() => {
    if (!searchQuery.trim()) return dokumenList;
    const q = searchQuery.toLowerCase();
    return dokumenList.filter(
      (doc) =>
        doc.judul.toLowerCase().includes(q) ||
        doc.deskripsi.toLowerCase().includes(q) ||
        doc.file_name.toLowerCase().includes(q)
    );
  }, [dokumenList, searchQuery]);

  // Handlers
  const handleOpenTambah = () => {
    setEditingDokumen(null);
    setFormJudul("");
    setFormDeskripsi("");
    setFormFileUrl("");
    setFormFileName("");
    setFormFileSize("");
    setFormUrutan((dokumenList.length || 0) + 1);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (doc: DokumenOrganisasi) => {
    setEditingDokumen(doc);
    setFormJudul(doc.judul);
    setFormDeskripsi(doc.deskripsi);
    setFormFileUrl(doc.file_url);
    setFormFileName(doc.file_name);
    setFormFileSize(doc.file_size || "");
    setFormUrutan(doc.urutan || 1);
    setIsModalOpen(true);
  };

  const handleProcessPdf = async (file: File) => {
    setUploadingPdf(true);
    try {
      if (!file.name.toLowerCase().endsWith(".pdf") && file.type !== "application/pdf") {
        showToast("Berkas harus berupa dokumen PDF (.pdf)");
        return;
      }
      if (file.size > 26214400) {
        showToast("Ukuran berkas melebihi batas maksimal 25 MB");
        return;
      }

      const res = await uploadDokumenPdf(file);
      if (res) {
        setFormFileUrl(res.url);
        setFormFileName(res.fileName);
        setFormFileSize(res.fileSize);
        showToast(`Berkas PDF "${file.name}" siap disimpan!`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Gagal mengunggah berkas PDF.";
      console.error("[DokumenManager] Gagal unggah PDF:", err);
      showToast(msg);
    } finally {
      setUploadingPdf(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formJudul.trim() || !formDeskripsi.trim()) {
      showToast("Judul dan deskripsi dokumen wajib diisi!");
      return;
    }
    if (!formFileUrl) {
      showToast("Silakan pilih berkas PDF dokumen terlebih dahulu!");
      return;
    }

    setSaving(true);
    try {
      if (editingDokumen) {
        const updated = await updateDokumen(editingDokumen.id, {
          judul: formJudul.trim(),
          deskripsi: formDeskripsi.trim(),
          file_url: formFileUrl,
          file_name: formFileName,
          file_size: formFileSize,
          urutan: formUrutan,
        });

        if (updated) {
          showToast(`Dokumen "${formJudul}" berhasil diperbarui!`);
        } else {
          showToast("Peringatan: Gagal sinkron ke database Supabase.");
        }

        recordAuditLog({
          modul: "dokumen",
          aksi: `Memperbarui dokumen organisasi: "${formJudul}"`,
          pengurus_nama: currentUserName,
          pengurus_role: currentUserRole,
          status: "berhasil",
          detail: `Berkas: ${formFileName || "-"}, Ukuran: ${formFileSize || "-"}`,
        }).catch((err) => console.warn("[DokumenManager] Gagal audit log:", err));

        setDokumenList((prev) =>
          prev
            .map((d) =>
              d.id === editingDokumen.id
                ? {
                    ...d,
                    judul: formJudul.trim(),
                    deskripsi: formDeskripsi.trim(),
                    file_url: formFileUrl,
                    file_name: formFileName,
                    file_size: formFileSize,
                    urutan: formUrutan,
                  }
                : d
            )
            .sort((a, b) => (a.urutan || 0) - (b.urutan || 0))
        );
      } else {
        const created = await createDokumen({
          judul: formJudul.trim(),
          deskripsi: formDeskripsi.trim(),
          file_url: formFileUrl,
          file_name: formFileName,
          file_size: formFileSize,
          urutan: formUrutan,
        });

        if (created) {
          setDokumenList((prev) =>
            [...prev, created].sort((a, b) => (a.urutan || 0) - (b.urutan || 0))
          );
          showToast(`Dokumen "${formJudul}" berhasil diterbitkan!`);
        } else {
          const localDoc: DokumenOrganisasi = {
            id: `doc-${Date.now()}`,
            judul: formJudul.trim(),
            deskripsi: formDeskripsi.trim(),
            file_url: formFileUrl,
            file_name: formFileName,
            file_size: formFileSize,
            urutan: formUrutan,
          };
          setDokumenList((prev) =>
            [...prev, localDoc].sort((a, b) => (a.urutan || 0) - (b.urutan || 0))
          );
          showToast("Peringatan: Tersimpan lokal di browser.");
        }

        recordAuditLog({
          modul: "dokumen",
          aksi: `Menerbitkan dokumen organisasi: "${formJudul}"`,
          pengurus_nama: currentUserName,
          pengurus_role: currentUserRole,
          status: "berhasil",
          detail: `Berkas: ${formFileName || "-"}, Ukuran: ${formFileSize || "-"}`,
        }).catch((err) => console.warn("[DokumenManager] Gagal audit log:", err));
      }

      setIsModalOpen(false);
    } catch (err) {
      console.error("[DokumenManager] Gagal menyimpan:", err);
      showToast("Terjadi kesalahan saat menyimpan dokumen.");
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!dokumenToDelete) return;
    setDeleting(true);
    const targetId = dokumenToDelete.id;
    const targetJudul = dokumenToDelete.judul;

    try {
      await deleteDokumen(targetId);
      showToast(`Dokumen "${targetJudul}" berhasil dihapus.`);

      recordAuditLog({
        modul: "dokumen",
        aksi: `Menghapus dokumen organisasi: "${targetJudul}"`,
        pengurus_nama: currentUserName,
        pengurus_role: currentUserRole,
        status: "berhasil",
        detail: `ID: ${targetId}`,
      }).catch((err) => console.warn("[DokumenManager] Gagal audit log:", err));

      setDokumenList((prev) => prev.filter((d) => d.id !== targetId));
    } catch (err) {
      console.error("[DokumenManager] Gagal hapus:", err);
      showToast("Gagal menghapus dokumen.");
    } finally {
      setDeleting(false);
      setDokumenToDelete(null);
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#00296E] dark:bg-[#38BDF8] text-white dark:text-[#001740] px-4 py-2.5 rounded-none shadow-lg text-xs font-semibold uppercase tracking-wider flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <CheckCircle size={16} weight="regular" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Info & Actions */}
      <DashboardPageHeader
        title="Dokumen Organisasi (AD/ART & SK)"
        subtitle="Kelola berkas dokumen resmi HIMASI yang dapat diunduh publik di Halaman Profil Organisasi."
        publicUrl="/profil#dokumen"
        publicLabel="Lihat Halaman Publik"
        onRefresh={loadDokumen}
        refreshLoading={loading}
        primaryAction={{
          label: "+ Tambah Dokumen",
          onClick: handleOpenTambah,
        }}
      />

      {/* 3 Metric Summary Cards */}
      <DashboardMetricStrip
        metrics={[
          {
            order: "01.",
            label: "TOTAL BERKAS",
            value: dokumenList.length,
            sublabel: "Dokumen",
            icon: <FileText className="w-4 h-4" weight="regular" />,
            loading,
          },
          {
            order: "02.",
            label: "FORMAT RESMI (PDF)",
            value: dokumenList.filter((d) => d.file_name?.toLowerCase().endsWith(".pdf") || d.file_url).length,
            sublabel: "Berkas PDF",
            variant: "success",
            icon: <CheckCircle className="w-4 h-4" weight="regular" />,
            loading,
          },
          {
            order: "03.",
            label: "DOKUMEN TERBIT",
            value: dokumenList.length,
            sublabel: "Publik",
            variant: "info",
            icon: <ArrowSquareOut className="w-4 h-4" weight="regular" />,
            loading,
          },
        ]}
      />

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-[#001438] p-3.5 border border-[#00296E]/15 dark:border-white/10 shadow-none flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Cari berdasarkan judul, berkas, atau deskripsi dokumen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-none border border-[#00296E]/20 dark:border-white/20 bg-white dark:bg-[#001740] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#00296E] dark:focus:border-[#38BDF8]"
          />
          <MagnifyingGlass className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>

        <div className="text-xs font-mono text-slate-500 dark:text-slate-400 flex items-center gap-1.5 self-end md:self-center">
          <span>Menampilkan</span>
          <strong className="text-[#00296E] dark:text-white font-bold">{filteredList.length}</strong>
          <span>dari {dokumenList.length} dokumen</span>
        </div>
      </div>

      {/* Swiss DataTable */}
      <div className="bg-white dark:bg-[#001438] border border-[#00296E]/15 dark:border-white/10 overflow-hidden shadow-none">
        {loading ? (
          <div className="p-12 text-center">
            <ArrowsClockwise className="w-6 h-6 text-slate-400 animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-400 font-mono">Memuat daftar dokumen resmi...</p>
          </div>
        ) : filteredList.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              Tidak ada dokumen ditemukan
            </h3>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 max-w-sm mx-auto">
              Coba sesuaikan kata kunci pencarian atau klik &quot;+ Tambah Dokumen&quot; untuk mengunggah berkas resmi baru.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#FAFBFC] dark:bg-[#00102B] border-b border-[#00296E]/15 dark:border-white/10 text-[10px] font-bold uppercase tracking-widest text-[#00296E] dark:text-slate-300">
                  <th className="py-2.5 px-3 w-12 text-center">No</th>
                  <th className="py-2.5 px-4 min-w-[260px]">Judul &amp; Deskripsi</th>
                  <th className="py-2.5 px-4 min-w-[200px]">Berkas PDF &amp; Ukuran</th>
                  <th className="py-2.5 px-3 min-w-[120px] text-center">Urutan Prioritas</th>
                  <th className="py-2.5 px-4 text-right min-w-[150px]">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#00296E]/10 dark:divide-white/10">
                {filteredList.map((doc, idx) => (
                  <tr
                    key={doc.id}
                    className="hover:bg-[#00296E]/[0.02] dark:hover:bg-white/[0.03] transition-colors"
                  >
                    <td className="py-3 px-3 text-center text-slate-400 dark:text-slate-500 font-mono text-[11px]">
                      {idx + 1}
                    </td>

                    <td className="py-3 px-4">
                      <div>
                        <h4 className="font-semibold text-slate-900 dark:text-white text-xs">
                          {doc.judul}
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2 max-w-md">
                          {doc.deskripsi}
                        </p>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-none bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 flex items-center justify-center font-bold text-[10px] shrink-0 font-mono">
                          PDF
                        </div>
                        <div className="min-w-0">
                          <p className="font-mono text-[11px] text-slate-800 dark:text-slate-200 truncate max-w-[220px]">
                            {doc.file_name}
                          </p>
                          {doc.file_size && (
                            <span className="text-[10px] font-mono text-slate-400 block">
                              {doc.file_size}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3 text-center">
                      <span className="px-2 py-0.5 text-[10px] font-mono font-bold border border-[#00296E]/20 dark:border-[#38BDF8]/30 bg-[#00296E]/5 dark:bg-sky-500/10 text-[#00296E] dark:text-[#38BDF8] uppercase tracking-wider">
                        Urutan #{doc.urutan || 0}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <a
                          href={doc.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          download={doc.file_name}
                          className="p-1.5 rounded-none border border-[#00296E]/20 dark:border-white/20 bg-white dark:bg-[#001740] hover:bg-slate-50 dark:hover:bg-white/5 text-slate-700 dark:text-slate-200 transition-colors"
                          title="Unduh Berkas PDF"
                        >
                          <DownloadSimple className="w-3.5 h-3.5" />
                        </a>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(doc)}
                          className="p-1.5 rounded-none border border-[#00296E]/20 dark:border-white/20 bg-white dark:bg-[#001740] hover:bg-slate-50 dark:hover:bg-white/5 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                          title="Edit Dokumen"
                        >
                          <NotePencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDokumenToDelete(doc)}
                          className="p-1.5 rounded-none border border-rose-500/20 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 transition-colors cursor-pointer"
                          title="Hapus Dokumen"
                        >
                          <Trash className="w-3.5 h-3.5" />
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

      {/* POPUP MODAL: TAMBAH / EDIT DOKUMEN */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200"
          onClick={() => !saving && setIsModalOpen(false)}
        >
          <div
            className="relative w-full max-w-lg rounded-none bg-white dark:bg-[#001438] p-6 shadow-none border border-[#00296E]/20 dark:border-white/10 text-slate-900 dark:text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-[#00296E]/15 dark:border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-none bg-sky-50 dark:bg-sky-950/40 text-[#00296E] dark:text-[#38BDF8] flex items-center justify-center border border-sky-100 dark:border-sky-800/40">
                  <FileText className="w-5 h-5 text-[#0094E0] dark:text-[#38BDF8]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#00296E] dark:text-white">
                    {editingDokumen ? "Edit Dokumen Organisasi" : "Tambah Dokumen Organisasi"}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Berkas resmi yang dapat diunduh publik di halaman Profil HIMASI
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={saving}
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                  Judul Dokumen <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formJudul}
                  onChange={(e) => setFormJudul(e.target.value)}
                  placeholder="Contoh: AD HIMASI, ART HIMASI, SK Kepengurusan"
                  className="w-full px-3.5 py-2.5 rounded-none border border-[#00296E]/20 dark:border-white/15 bg-slate-50 dark:bg-[#001740] text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#00296E] dark:focus:ring-[#38BDF8]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                  Deskripsi Singkat <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  value={formDeskripsi}
                  onChange={(e) => setFormDeskripsi(e.target.value)}
                  placeholder="Contoh: Anggaran Dasar HIMASI ISB Atma Luhur Periode 2026/2027"
                  className="w-full px-3.5 py-2.5 rounded-none border border-[#00296E]/20 dark:border-white/15 bg-slate-50 dark:bg-[#001740] text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-[#00296E] dark:focus:ring-[#38BDF8] resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                  Nomor Urut Tampilan
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={1}
                    value={formUrutan}
                    onChange={(e) => setFormUrutan(parseInt(e.target.value) || 1)}
                    className="w-24 px-3.5 py-2.5 rounded-none border border-[#00296E]/20 dark:border-white/15 bg-slate-50 dark:bg-[#001740] text-slate-900 dark:text-white text-xs font-bold font-mono focus:outline-none focus:ring-1 focus:ring-[#00296E] dark:focus:ring-[#38BDF8]"
                  />
                  <span className="text-[11px] text-slate-400">
                    Dokumen dengan urutan lebih kecil muncul lebih awal (1 = posisi paling atas).
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                  Berkas Fisik PDF <span className="text-rose-500">*</span>
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleProcessPdf(file);
                  }}
                />

                {formFileUrl ? (
                  <div className="p-3.5 rounded-none bg-sky-50/60 dark:bg-white/5 border border-sky-100 dark:border-white/10 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-none bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/40 flex items-center justify-center shrink-0 font-bold text-xs font-mono">
                        PDF
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                          {formFileName || "Dokumen.pdf"}
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono">
                          {formFileSize || "PDF Siap Diunduh"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <a
                        href={formFileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1.5 rounded-none bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 hover:border-slate-300 text-[11px] font-bold text-slate-700 dark:text-slate-200 transition-colors flex items-center gap-1"
                      >
                        <ArrowSquareOut className="w-3 h-3 text-[#0094E0] dark:text-[#38BDF8]" />
                        <span>Pratinjau</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingPdf}
                        className="px-2.5 py-1.5 rounded-none bg-[#00296E] hover:bg-[#001f54] text-[11px] font-bold text-white transition-colors cursor-pointer"
                      >
                        Ganti PDF
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => !uploadingPdf && fileInputRef.current?.click()}
                    className={`border border-dashed rounded-none p-6 text-center transition-all cursor-pointer ${
                      uploadingPdf
                        ? "bg-slate-50 dark:bg-white/5 border-slate-300"
                        : "border-[#00296E]/30 dark:border-white/20 hover:border-[#00296E] dark:hover:border-[#38BDF8] hover:bg-slate-50 dark:hover:bg-white/5"
                    }`}
                  >
                    {uploadingPdf ? (
                      <div className="flex flex-col items-center justify-center gap-2">
                        <ArrowsClockwise className="w-6 h-6 text-[#00296E] dark:text-[#38BDF8] animate-spin" />
                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 font-mono">
                          Mengunggah berkas PDF ke penyimpanan...
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-1.5">
                        <FileText className="w-8 h-8 text-[#00296E] dark:text-[#38BDF8]" />
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                          Klik untuk memilih berkas PDF (.pdf)
                        </p>
                        <span className="text-[10px] text-slate-400 font-mono">
                          Maksimal ukuran berkas 25 MB
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#00296E]/15 dark:border-white/10">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-none border border-slate-300 dark:border-white/20 text-slate-700 dark:text-slate-200 text-xs font-semibold uppercase tracking-wider hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving || uploadingPdf}
                  className="px-5 py-2 rounded-none bg-[#00296E] hover:bg-[#001f54] text-white text-xs font-semibold uppercase tracking-wider transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <ArrowsClockwise className="w-3.5 h-3.5 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5 text-sky-300" />
                      <span>{editingDokumen ? "Simpan Perubahan" : "Terbitkan Dokumen"}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POPUP MODAL: KONFIRMASI HAPUS */}
      {dokumenToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => !deleting && setDokumenToDelete(null)}
        >
          <div
            className="relative w-full max-w-sm rounded-none bg-white dark:bg-[#001438] p-6 shadow-none border border-[#00296E]/20 dark:border-white/10 text-center text-slate-900 dark:text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-none bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 flex items-center justify-center mx-auto mb-4">
              <Trash className="w-6 h-6" />
            </div>

            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Hapus Dokumen Organisasi?
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
              Anda akan menghapus dokumen berikut dari daftar publik:
            </p>

            <div className="mt-4 p-3 bg-slate-50 dark:bg-white/5 rounded-none border border-[#00296E]/15 dark:border-white/10 flex items-center gap-3 text-left">
              <div className="w-10 h-10 rounded-none bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50 flex items-center justify-center shrink-0 font-bold text-xs font-mono">
                PDF
              </div>
              <div className="overflow-hidden flex-1">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {dokumenToDelete.judul}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {dokumenToDelete.deskripsi}
                </p>
                <p className="text-[10px] text-slate-400 font-mono truncate">
                  {dokumenToDelete.file_name}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 mt-6">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setDokumenToDelete(null)}
                className="flex-1 py-2 rounded-none border border-slate-300 dark:border-white/20 text-slate-700 dark:text-slate-200 text-xs font-semibold uppercase tracking-wider hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleConfirmDelete}
                className="flex-1 py-2 rounded-none bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {deleting ? (
                  <>
                    <ArrowsClockwise className="w-3.5 h-3.5 animate-spin" />
                    <span>Menghapus...</span>
                  </>
                ) : (
                  <>
                    <Trash className="w-3.5 h-3.5" />
                    <span>Hapus</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
