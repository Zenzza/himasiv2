"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  Trophy,
  Code2,
  Briefcase,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  ExternalLink,
  Plus,
  Trash2,
  Edit3,
  Star,
  Users,
  GraduationCap,
  Building2,
  Link2,
  FileText,
  Eye,
  RefreshCw,
  Loader2,
  Share2,
  ArrowUpRight,
  X,
  Check,
  Send,
  Phone,
  Sparkles,
} from "lucide-react";
import {
  type ApresiasiItem,
  type ApresiasiSubmisiItem,
  type ApresiasiCategory,
} from "@/lib/types/apresiasi";
import {
  type UserRole,
  canPublishContent,
  canEditPublishedContent,
} from "@/lib/types/auth";
import {
  getAllApresiasiSubmisi,
  updateApresiasiSubmisiStatus,
  deleteApresiasiSubmisi,
  getAllApresiasiShowcaseAdmin,
  createApresiasiShowcase,
  updateApresiasiShowcase,
  deleteApresiasiShowcase,
  approveAndPublishSubmisi,
} from "@/lib/supabase/apresiasi";

interface ApresiasiManagerProps {
  currentUserRole?: UserRole;
}

export default function ApresiasiManager({
  currentUserRole = "humas_biskraf",
}: ApresiasiManagerProps) {
  const canPublish = canPublishContent(currentUserRole);
  const canEdit = canEditPublishedContent(currentUserRole);

  const [activeSubTab, setActiveSubTab] = useState<"submisi" | "showcase">("submisi");

  // State Submisi
  const [submisiList, setSubmisiList] = useState<ApresiasiSubmisiItem[]>([]);
  const [loadingSubmisi, setLoadingSubmisi] = useState(true);
  const [submisiSearch, setSubmisiSearch] = useState("");
  const [submisiStatusFilter, setSubmisiStatusFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [submisiCategoryFilter, setSubmisiCategoryFilter] = useState<"all" | ApresiasiCategory>("all");
  const [selectedSubmisi, setSelectedSubmisi] = useState<ApresiasiSubmisiItem | null>(null);

  // State Showcase
  const [showcaseList, setShowcaseList] = useState<ApresiasiItem[]>([]);
  const [loadingShowcase, setLoadingShowcase] = useState(true);
  const [showcaseSearch, setShowcaseSearch] = useState("");
  const [showcaseCategoryFilter, setShowcaseCategoryFilter] = useState<"all" | ApresiasiCategory>("all");
  const [editingShowcase, setEditingShowcase] = useState<ApresiasiItem | null>(null);
  const [isAddShowcaseOpen, setIsAddShowcaseOpen] = useState(false);

  // Modal Approve & Publish
  const [approveModalSubmisi, setApproveModalSubmisi] = useState<ApresiasiSubmisiItem | null>(null);
  const [approveCustomBadge, setApproveCustomBadge] = useState("");
  const [approveCustomImage, setApproveCustomImage] = useState("");

  // Modals Konfirmasi Hapus & Tolak
  const [showcaseToDelete, setShowcaseToDelete] = useState<ApresiasiItem | null>(null);
  const [submisiToReject, setSubmisiToReject] = useState<ApresiasiSubmisiItem | null>(null);
  const [submisiToDelete, setSubmisiToDelete] = useState<ApresiasiSubmisiItem | null>(null);

  // Toast / Feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }, []);

  // 1. Muat data Submisi
  const fetchSubmisi = useCallback(async () => {
    setLoadingSubmisi(true);
    try {
      const res = await getAllApresiasiSubmisi();
      setSubmisiList(res.data);
    } catch (err) {
      console.error("Gagal memuat submisi:", err);
    } finally {
      setLoadingSubmisi(false);
    }
  }, []);

  // 2. Muat data Showcase
  const fetchShowcase = useCallback(async () => {
    setLoadingShowcase(true);
    try {
      const res = await getAllApresiasiShowcaseAdmin();
      setShowcaseList(res.data);
    } catch (err) {
      console.error("Gagal memuat showcase:", err);
    } finally {
      setLoadingShowcase(false);
    }
  }, []);

  useEffect(() => {
    fetchSubmisi();
    fetchShowcase();
  }, [fetchSubmisi, fetchShowcase]);

  // Hitung jumlah pending
  const pendingCount = useMemo(() => {
    return submisiList.filter((s) => s.status === "pending").length;
  }, [submisiList]);

  // Filter Submisi
  const filteredSubmisi = useMemo(() => {
    return submisiList.filter((item) => {
      const matchStatus = submisiStatusFilter === "all" ? true : item.status === submisiStatusFilter;
      const matchCat = submisiCategoryFilter === "all" ? true : item.category === submisiCategoryFilter;
      const q = submisiSearch.toLowerCase().trim();
      const matchSearch =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.studentName.toLowerCase().includes(q) ||
        item.nim.toLowerCase().includes(q) ||
        item.organizerOrCompany.toLowerCase().includes(q);
      return matchStatus && matchCat && matchSearch;
    });
  }, [submisiList, submisiStatusFilter, submisiCategoryFilter, submisiSearch]);

  // Filter Showcase
  const filteredShowcase = useMemo(() => {
    return showcaseList.filter((item) => {
      const matchCat = showcaseCategoryFilter === "all" ? true : item.category === showcaseCategoryFilter;
      const q = showcaseSearch.toLowerCase().trim();
      const matchSearch =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.studentName.toLowerCase().includes(q) ||
        item.badge.toLowerCase().includes(q) ||
        item.organizerOrCompany.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [showcaseList, showcaseCategoryFilter, showcaseSearch]);

  // Aksi Konfirmasi Submisi: Tolak
  const handleConfirmRejectSubmisi = async () => {
    if (!submisiToReject) return;
    setIsProcessing(true);
    try {
      const res = await updateApresiasiSubmisiStatus(submisiToReject.id, "rejected");
      showToast(res.message);
      setSubmisiToReject(null);
      setSelectedSubmisi(null);
      fetchSubmisi();
    } catch (err) {
      showToast("Gagal menolak pengajuan.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Aksi Konfirmasi Submisi: Hapus
  const handleConfirmDeleteSubmisi = async () => {
    if (!submisiToDelete) return;
    setIsProcessing(true);
    try {
      const res = await deleteApresiasiSubmisi(submisiToDelete.id);
      showToast(res.message);
      setSubmisiToDelete(null);
      setSelectedSubmisi(null);
      fetchSubmisi();
    } catch (err) {
      showToast("Gagal menghapus pengajuan.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Buka Modal Approve & Publish
  const openApproveModal = (submisi: ApresiasiSubmisiItem) => {
    setApproveModalSubmisi(submisi);
    setApproveCustomBadge(
      submisi.category === "lomba"
        ? `Juara (${submisi.level || "Nasional"})`
        : submisi.category === "magang"
        ? "Magang & MSIB"
        : "Inovasi Mahasiswa"
    );
    setApproveCustomImage(
      submisi.category === "lomba"
        ? "https://images.unsplash.com/photo-1531403009284-440f080d1e12?q=80&w=800&auto=format&fit=crop"
        : submisi.category === "magang"
        ? "https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=800&auto=format&fit=crop"
        : "https://images.unsplash.com/photo-1581092160607-ee22621dd758?q=80&w=800&auto=format&fit=crop"
    );
  };

  // Jalankan Approve & Publish
  const handleConfirmApproveAndPublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!approveModalSubmisi) return;

    setIsProcessing(true);
    try {
      const res = await approveAndPublishSubmisi(approveModalSubmisi, {
        badge: approveCustomBadge.trim(),
        image: approveCustomImage.trim(),
      });
      showToast(res.message);
      setApproveModalSubmisi(null);
      setSelectedSubmisi(null);
      fetchSubmisi();
      fetchShowcase();
    } catch (err) {
      showToast("Terjadi kendala saat menyetujui pengajuan.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Aksi Konfirmasi Showcase: Hapus
  const handleConfirmDeleteShowcase = async () => {
    if (!showcaseToDelete) return;
    setIsProcessing(true);
    try {
      const res = await deleteApresiasiShowcase(showcaseToDelete.id);
      showToast(res.message);
      setShowcaseToDelete(null);
      fetchShowcase();
    } catch (err) {
      showToast("Gagal menghapus item showcase.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Aksi Showcase: Toggle Featured
  const handleToggleFeatured = async (item: ApresiasiItem) => {
    setIsProcessing(true);
    try {
      const res = await updateApresiasiShowcase(item.id, { featured: !item.featured });
      showToast(res.message);
      fetchShowcase();
    } catch (err) {
      showToast("Gagal mengubah status featured.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Toast Notifikasi */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 px-4 py-3 rounded-xl bg-slate-900 text-white text-xs font-semibold shadow-xl border border-slate-700 flex items-center gap-2 animate-in slide-in-from-bottom-2 duration-150">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Utama Manajemen Apresia-SI */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold uppercase tracking-wider mb-1.5">
            <Trophy className="w-3.5 h-3.5 text-amber-600" />
            <span>Panggung Prestasi Mahasiswa SI</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[#00296E] tracking-tight">
            Manajemen Apresia-SI
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Kurasi formulir pengajuan mandiri mahasiswa, setujui prestasi, dan kelola galeri karya yang tampil di halaman publik.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => {
              fetchSubmisi();
              fetchShowcase();
            }}
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
            title="Muat Ulang Data"
          >
            <RefreshCw className={`w-4 h-4 ${loadingSubmisi || loadingShowcase ? "animate-spin" : ""}`} />
          </button>

          <Link
            href="/apresiasi"
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-[#00296E] text-xs font-bold transition-colors cursor-pointer shadow-2xs"
          >
            <Eye className="w-4 h-4 text-[#0094E0]" />
            <span>Lihat Halaman Publik</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
          </Link>

          {canPublish && (
            <button
              type="button"
              onClick={() => {
                setActiveSubTab("showcase");
                setIsAddShowcaseOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#00296E] hover:bg-[#001f52] text-white text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-[#0094E0]" />
              <span>+ Tambah Prestasi Baru</span>
            </button>
          )}
        </div>
      </div>

      {/* Navigasi Sub-Tab: "Submisi Mahasiswa" & "Galeri Showcase" */}
      <div className="flex border-b border-slate-200 gap-6 text-xs sm:text-sm font-bold">
        <button
          type="button"
          onClick={() => setActiveSubTab("submisi")}
          className={`pb-3 flex items-center gap-2 transition-all cursor-pointer relative ${
            activeSubTab === "submisi"
              ? "text-[#00296E] border-b-2 border-[#00296E]"
              : "text-slate-400 hover:text-slate-600"
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Submisi Mahasiswa</span>
          {pendingCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500 text-white shadow-xs">
              {pendingCount} Menunggu
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab("showcase")}
          className={`pb-3 flex items-center gap-2 transition-all cursor-pointer relative ${
            activeSubTab === "showcase"
              ? "text-[#00296E] border-b-2 border-[#00296E]"
              : "text-slate-400 hover:text-slate-600"
          }`}
        >
          <Trophy className="w-4 h-4 text-amber-500" />
          <span>Galeri Showcase Publik</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-600">
            {showcaseList.length} Item
          </span>
        </button>
      </div>

      {/* =================================================================== */}
      {/* KONTEN SUB-TAB 1: SUBMISI MAHASISWA */}
      {/* =================================================================== */}
      {activeSubTab === "submisi" && (
        <div className="space-y-4">
          {/* Controls: Filter Status, Kategori & Search */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Filter Status Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
              {(
                [
                  { id: "all", label: "Semua" },
                  { id: "pending", label: "Menunggu" },
                  { id: "approved", label: "Disetujui" },
                  { id: "rejected", label: "Ditolak" },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSubmisiStatusFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 cursor-pointer ${
                    submisiStatusFilter === tab.id
                      ? "bg-[#00296E] text-white"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                  }`}
                >
                  {tab.label}
                </button>
              ))}

              <div className="h-4 w-px bg-slate-200 mx-1" />

              {(
                [
                  { id: "all", label: "Semua Kategori" },
                  { id: "lomba", label: "Lomba" },
                  { id: "karya", label: "Karya" },
                  { id: "magang", label: "Magang" },
                ] as const
              ).map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSubmisiCategoryFilter(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 cursor-pointer ${
                    submisiCategoryFilter === cat.id
                      ? "bg-sky-100 text-[#00296E] border border-sky-200 font-bold"
                      : "bg-slate-50 hover:bg-slate-100 text-slate-500"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-64 shrink-0">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={submisiSearch}
                onChange={(e) => setSubmisiSearch(e.target.value)}
                placeholder="Cari pengaju, NIM, judul..."
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0094E0]/40 focus:border-[#0094E0]"
              />
            </div>
          </div>

          {/* Daftar Tabel Submisi */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
            {loadingSubmisi ? (
              <div className="py-12 text-center text-xs text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#0094E0] mb-2" />
                <span>Memuat data pengajuan mahasiswa...</span>
              </div>
            ) : filteredSubmisi.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                <FileText className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                <p className="font-semibold text-slate-600">Tidak ada data submisi yang sesuai.</p>
                <p className="text-[11px] text-slate-400 mt-1">Coba ubah kata kunci atau filter status di atas.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 border-b border-slate-200/70 text-slate-500 uppercase tracking-wider font-semibold text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Status & Kategori</th>
                      <th className="py-3 px-4">Mahasiswa & Kontak</th>
                      <th className="py-3 px-4">Judul Prestasi / Karya</th>
                      <th className="py-3 px-4">Penyelenggara / Mitra</th>
                      <th className="py-3 px-4">Bukti / Link</th>
                      <th className="py-3 px-4 text-right">Aksi Tindak Lanjut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredSubmisi.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                        {/* Status & Kategori */}
                        <td className="py-3.5 px-4 align-top whitespace-nowrap">
                          <div className="space-y-1">
                            {item.status === "pending" && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                <Clock className="w-3 h-3 text-amber-500" />
                                <span>Menunggu</span>
                              </span>
                            )}
                            {item.status === "approved" && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                <span>Disetujui</span>
                              </span>
                            )}
                            {item.status === "rejected" && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                <XCircle className="w-3 h-3 text-rose-500" />
                                <span>Ditolak</span>
                              </span>
                            )}
                            <div className="text-[11px] font-semibold text-slate-700 flex items-center gap-1 mt-1">
                              {item.category === "lomba" ? (
                                <Trophy className="w-3 h-3 text-amber-500" />
                              ) : item.category === "karya" ? (
                                <Code2 className="w-3 h-3 text-cyan-500" />
                              ) : (
                                <Briefcase className="w-3 h-3 text-emerald-500" />
                              )}
                              <span className="capitalize">{item.category}</span>
                            </div>
                          </div>
                        </td>

                        {/* Mahasiswa & Kontak */}
                        <td className="py-3.5 px-4 align-top">
                          <div className="font-bold text-slate-800 text-xs">
                            {item.studentName}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            NIM: <span className="font-mono">{item.nim}</span> &bull; Angk. {item.batch}
                          </div>
                          {item.teamMembers && (
                            <div className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[180px]">
                              Tim: {item.teamMembers}
                            </div>
                          )}
                          <div className="text-[11px] text-[#0094E0] font-medium mt-1 flex items-center gap-1">
                            <Phone className="w-3 h-3 shrink-0" />
                            <a
                              href={`https://wa.me/${item.contact.replace(/\D/g, "")}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:underline"
                            >
                              {item.contact}
                            </a>
                          </div>
                        </td>

                        {/* Judul Prestasi / Karya */}
                        <td className="py-3.5 px-4 align-top max-w-xs">
                          <div className="font-bold text-[#00296E] leading-snug">
                            {item.title}
                          </div>
                          <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">
                            {item.description}
                          </p>
                        </td>

                        {/* Penyelenggara / Mitra */}
                        <td className="py-3.5 px-4 align-top">
                          <div className="font-semibold text-slate-700">
                            {item.organizerOrCompany}
                          </div>
                          {item.level && (
                            <span className="text-[10px] text-slate-400 block mt-0.5">
                              Tingkat: {item.level}
                            </span>
                          )}
                        </td>

                        {/* Bukti & Tautan */}
                        <td className="py-3.5 px-4 align-top whitespace-nowrap space-y-1">
                          {item.proofUrl && (
                            <a
                              href={item.proofUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:underline block"
                            >
                              <ExternalLink className="w-3 h-3" />
                              <span>Sertifikat / Bukti</span>
                            </a>
                          )}
                          {item.linkDemoOrRepo && (
                            <a
                              href={item.linkDemoOrRepo}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] text-slate-600 hover:underline block"
                            >
                              <Link2 className="w-3 h-3" />
                              <span>Live / Repo</span>
                            </a>
                          )}
                          {!item.proofUrl && !item.linkDemoOrRepo && (
                            <span className="text-[11px] text-slate-400">-</span>
                          )}
                        </td>

                        {/* Aksi */}
                        <td className="py-3.5 px-4 align-top text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Tombol Detail */}
                            <button
                              type="button"
                              onClick={() => setSelectedSubmisi(item)}
                              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
                              title="Tinjau Detail Pengajuan"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {/* Tombol Setujui & Publikasikan (Khusus Medkominfo / Super Admin) */}
                            {canPublish && item.status !== "approved" && (
                              <button
                                type="button"
                                onClick={() => openApproveModal(item)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shadow-xs transition-colors cursor-pointer"
                                title="Setujui dan terbitkan ke Galeri Showcase"
                              >
                                <Check className="w-3 h-3 stroke-[3]" />
                                <span>Setujui</span>
                              </button>
                            )}

                            {/* Tombol Tolak (Khusus Medkominfo / Super Admin) */}
                            {canPublish && item.status === "pending" && (
                              <button
                                type="button"
                                onClick={() => setSubmisiToReject(item)}
                                className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                title="Tolak Pengajuan"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* Tombol Hapus */}
                            <button
                              type="button"
                              onClick={() => setSubmisiToDelete(item)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Hapus Pengajuan"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
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
        </div>
      )}

      {/* =================================================================== */}
      {/* KONTEN SUB-TAB 2: GALERI SHOWCASE PUBLIK */}
      {/* =================================================================== */}
      {activeSubTab === "showcase" && (
        <div className="space-y-4">
          {/* Controls: Filter Kategori & Search */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
              {(
                [
                  { id: "all", label: "Semua Kategori" },
                  { id: "lomba", label: "🏆 Pemenang Lomba" },
                  { id: "karya", label: "💻 Karya & Inovasi" },
                  { id: "magang", label: "💼 Magang & MSIB" },
                ] as const
              ).map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setShowcaseCategoryFilter(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 cursor-pointer ${
                    showcaseCategoryFilter === cat.id
                      ? "bg-[#00296E] text-white"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="relative w-full md:w-64 shrink-0">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={showcaseSearch}
                onChange={(e) => setShowcaseSearch(e.target.value)}
                placeholder="Cari prestasi di showcase..."
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0094E0]/40 focus:border-[#0094E0]"
              />
            </div>
          </div>

          {!canPublish && (
            <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl flex items-center gap-2.5 text-xs text-blue-800">
              <Sparkles className="w-4 h-4 text-[#0094E0] shrink-0" />
              <span>
                <strong>Mode Kontributor:</strong> Anda dapat meninjau galeri karya yang telah dipublikasikan. Untuk mengajukan karya baru, silakan ajukan melalui tab <em>Submisi Mahasiswa</em> untuk disetujui oleh tim Medkominfo.
              </span>
            </div>
          )}

          {/* Grid Kartu Showcase */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {loadingShowcase ? (
              <div className="col-span-full py-12 text-center text-xs text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#0094E0] mb-2" />
                <span>Memuat data galeri showcase...</span>
              </div>
            ) : filteredShowcase.length === 0 ? (
              <div className="col-span-full py-12 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
                <Trophy className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                <p className="font-semibold text-slate-600">Tidak ada karya yang sesuai filter.</p>
              </div>
            ) : (
              filteredShowcase.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden flex flex-col justify-between hover:border-[#0094E0]/50 transition-all"
                >
                  {/* Foto Thumbnail */}
                  <div className="relative aspect-[16/9] w-full bg-slate-100 overflow-hidden">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "https://images.unsplash.com/photo-1531403009284-440f080d1e12?q=80&w=800&auto=format&fit=crop";
                      }}
                    />
                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider text-white shadow-xs ${
                          item.category === "lomba"
                            ? "bg-amber-500"
                            : item.category === "karya"
                            ? "bg-[#0094E0]"
                            : "bg-emerald-600"
                        }`}
                      >
                        {item.categoryLabel}
                      </span>
                    </div>

                    <div className="absolute top-2.5 right-2.5 flex items-center gap-1">
                      {/* Featured Star Toggle */}
                      <button
                        type="button"
                        onClick={() => handleToggleFeatured(item)}
                        className={`p-1.5 rounded-full backdrop-blur-md shadow-xs transition-colors cursor-pointer ${
                          item.featured
                            ? "bg-amber-400 text-amber-950"
                            : "bg-black/30 hover:bg-black/50 text-white"
                        }`}
                        title={item.featured ? "Hapus dari Unggulan" : "Tandai sebagai Unggulan"}
                      >
                        <Star className={`w-3.5 h-3.5 ${item.featured ? "fill-amber-950" : ""}`} />
                      </button>
                    </div>

                    <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between text-[10px] text-white font-semibold drop-shadow-sm">
                      <span className="bg-black/40 px-2 py-0.5 rounded-full backdrop-blur-xs">
                        {item.badge}
                      </span>
                      {item.level && (
                        <span className="bg-black/40 px-2 py-0.5 rounded-full backdrop-blur-xs">
                          {item.level}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Info Konten */}
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="text-[11px] text-slate-500 mb-1 flex items-center gap-1">
                        <Users className="w-3 h-3 text-[#0094E0]" />
                        <span className="font-semibold text-slate-700">{item.studentName}</span>
                        <span>&bull;</span>
                        <span>Angk. {item.batch}</span>
                      </div>

                      <h4 className="text-xs sm:text-sm font-bold text-[#00296E] line-clamp-2 leading-snug">
                        {item.title}
                      </h4>

                      <div className="mt-1 text-[11px] text-[#0094E0] font-medium flex items-center gap-1">
                        <Building2 className="w-3 h-3 shrink-0" />
                        <span className="truncate">{item.organizerOrCompany}</span>
                      </div>

                      <p className="mt-2 text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                    </div>

                    {/* Footer Kartu & Aksi Edit / Hapus */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-[11px] text-slate-400">
                        ❤️ {item.likes} apresiasi
                      </span>

                      {canEdit ? (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setEditingShowcase(item)}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                            title="Edit Karya/Prestasi"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowcaseToDelete(item)}
                            className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Hapus dari Showcase"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-medium px-2 py-0.5 rounded bg-slate-100">
                          Terkurasi Medkominfo
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 1: DETAIL SUBMISI MAHASISWA */}
      {/* =================================================================== */}
      {selectedSubmisi && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setSelectedSubmisi(null)}
        >
          <div
            className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl p-6 space-y-4 my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b pb-3 border-slate-100">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#0094E0] block">
                  Detail Pengajuan Mahasiswa
                </span>
                <h3 className="text-base font-bold text-[#00296E] mt-0.5">
                  {selectedSubmisi.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSubmisi(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl">
                <div>
                  <span className="text-slate-400 block text-[10px]">Nama Pengaju:</span>
                  <span className="font-bold text-slate-800">{selectedSubmisi.studentName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">NIM & Angkatan:</span>
                  <span className="font-bold text-slate-800">{selectedSubmisi.nim} ({selectedSubmisi.batch})</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Kontak WhatsApp/Email:</span>
                  <span className="font-bold text-[#00296E]">{selectedSubmisi.contact}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Kategori & Tingkat:</span>
                  <span className="font-bold capitalize text-slate-800">
                    {selectedSubmisi.category} &bull; {selectedSubmisi.level || "Nasional"}
                  </span>
                </div>
                {selectedSubmisi.teamMembers && (
                  <div className="col-span-2">
                    <span className="text-slate-400 block text-[10px]">Anggota Tim:</span>
                    <span className="font-medium text-slate-700">{selectedSubmisi.teamMembers}</span>
                  </div>
                )}
              </div>

              <div>
                <span className="text-slate-400 block text-[10px] font-bold uppercase">
                  Penyelenggara / Mitra Perusahaan:
                </span>
                <p className="font-semibold text-slate-800 mt-0.5">{selectedSubmisi.organizerOrCompany}</p>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px] font-bold uppercase">
                  Deskripsi Inovasi / Capaian:
                </span>
                <p className="text-slate-600 leading-relaxed mt-0.5 whitespace-pre-line bg-slate-50 p-3 rounded-xl border border-slate-100">
                  {selectedSubmisi.description}
                </p>
              </div>

              <div className="space-y-1.5 pt-2">
                <span className="text-slate-400 block text-[10px] font-bold uppercase">
                  Tautan Bukti & Demo:
                </span>
                <div className="flex flex-wrap gap-2">
                  {selectedSubmisi.proofUrl && (
                    <a
                      href={selectedSubmisi.proofUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 font-semibold text-xs hover:bg-blue-100"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Buka Bukti Sertifikat / Dokumen</span>
                    </a>
                  )}
                  {selectedSubmisi.linkDemoOrRepo && (
                    <a
                      href={selectedSubmisi.linkDemoOrRepo}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 font-semibold text-xs hover:bg-slate-200"
                    >
                      <Link2 className="w-3.5 h-3.5" />
                      <span>Buka Tautan Demo / Repository</span>
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Tombol Aksi Modal */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setSelectedSubmisi(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition-colors"
              >
                Tutup
              </button>

              <div className="flex items-center gap-2">
                {canPublish && selectedSubmisi.status === "pending" && (
                  <button
                    type="button"
                    onClick={() => {
                      const item = selectedSubmisi;
                      setSelectedSubmisi(null);
                      setSubmisiToReject(item);
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 font-bold transition-all cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                    <span>Tolak Pengajuan</span>
                  </button>
                )}
                {canPublish && selectedSubmisi.status !== "approved" && (
                  <button
                    type="button"
                    onClick={() => {
                      const item = selectedSubmisi;
                      setSelectedSubmisi(null);
                      openApproveModal(item);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all shadow-xs cursor-pointer"
                  >
                    <Check className="w-4 h-4 stroke-[2.5]" />
                    <span>Setujui & Terbitkan</span>
                  </button>
                )}
                {!canPublish && (
                  <span className="text-xs text-slate-400 italic">
                    Kurasi & persetujuan dilakukan oleh Medkominfo.
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 2: KONFIRMASI SETUJUI & TERBITKAN KE SHOWCASE */}
      {/* =================================================================== */}
      {approveModalSubmisi && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setApproveModalSubmisi(null)}
        >
          <div
            className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl p-6 space-y-4 my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b pb-3 border-slate-100">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block">
                  Konfirmasi Publikasi Showcase
                </span>
                <h3 className="text-base font-bold text-[#00296E] mt-0.5">
                  Setujui & Terbitkan ke Apresia-SI
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setApproveModalSubmisi(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmApproveAndPublish} className="space-y-4 text-xs">
              <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl space-y-1">
                <span className="font-bold text-emerald-900 block">Karya yang Disetujui:</span>
                <p className="text-emerald-800 font-semibold">{approveModalSubmisi.title}</p>
                <p className="text-emerald-700 text-[11px]">
                  Oleh: {approveModalSubmisi.studentName} ({approveModalSubmisi.nim}) &bull; Angk. {approveModalSubmisi.batch}
                </p>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Label Badge Tampilan di Kartu <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={approveCustomBadge}
                  onChange={(e) => setApproveCustomBadge(e.target.value)}
                  placeholder="Contoh: Juara 1 Nasional / MSIB Batch 6"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0094E0]/40 text-xs"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Badge ini akan langsung tampil di pojok kanan atas foto kartu galeri.
                </span>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  URL Foto Banner / Dokumentasi <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  required
                  value={approveCustomImage}
                  onChange={(e) => setApproveCustomImage(e.target.value)}
                  placeholder="https://images.unsplash.com/... atau URL foto"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0094E0]/40 text-xs"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setApproveModalSubmisi(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isProcessing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4 stroke-[3]" />
                  )}
                  <span>Terbitkan Sekarang</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 3: TAMBAH ATAU EDIT KARYA DI GALERI SHOWCASE */}
      {/* =================================================================== */}
      {(isAddShowcaseOpen || editingShowcase) && (
        <ShowcaseFormModal
          initialItem={editingShowcase}
          onClose={() => {
            setIsAddShowcaseOpen(false);
            setEditingShowcase(null);
          }}
          onSuccess={(msg) => {
            showToast(msg);
            setIsAddShowcaseOpen(false);
            setEditingShowcase(null);
            fetchShowcase();
          }}
        />
      )}

      {/* =================================================================== */}
      {/* MODAL 4: KONFIRMASI HAPUS SHOWCASE */}
      {/* =================================================================== */}
      {showcaseToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => !isProcessing && setShowcaseToDelete(null)}
        >
          <div
            className="relative w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-100 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4 shadow-2xs">
              <Trash2 className="w-7 h-7" />
            </div>

            <h3 className="text-base font-extrabold text-slate-900">
              Hapus Prestasi dari Showcase?
            </h3>

            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Anda akan menghapus karya berikut dari galeri publik Apresia-SI:
            </p>

            <div className="mt-4 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 inline-block">
                {showcaseToDelete.badge}
              </span>
              <h4 className="text-xs font-bold text-slate-900 leading-snug">
                {showcaseToDelete.title}
              </h4>
              <p className="text-[11px] text-slate-500">
                Oleh: <strong className="text-slate-700">{showcaseToDelete.studentName}</strong> (Angk. {showcaseToDelete.batch})
              </p>
            </div>

            <div className="mt-3.5 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-medium text-left">
              Item ini tidak akan tampil lagi di halaman publik /apresiasi.
            </div>

            <div className="mt-6 flex items-center gap-2.5">
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => setShowcaseToDelete(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleConfirmDeleteShowcase}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
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

      {/* =================================================================== */}
      {/* MODAL 5: KONFIRMASI TOLAK SUBMISI */}
      {/* =================================================================== */}
      {submisiToReject && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => !isProcessing && setSubmisiToReject(null)}
        >
          <div
            className="relative w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-100 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-4 shadow-2xs">
              <XCircle className="w-7 h-7" />
            </div>

            <h3 className="text-base font-extrabold text-slate-900">
              Tolak Pengajuan Prestasi?
            </h3>

            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Pengajuan ini tidak akan diterbitkan ke showcase dan statusnya akan diubah menjadi &quot;Ditolak&quot;:
            </p>

            <div className="mt-4 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 capitalize">
                Kategori: {submisiToReject.category}
              </div>
              <h4 className="text-xs font-bold text-slate-900 leading-snug">
                {submisiToReject.title}
              </h4>
              <p className="text-[11px] text-slate-500">
                Pengaju: <strong className="text-slate-700">{submisiToReject.studentName}</strong> ({submisiToReject.nim})
              </p>
            </div>

            <div className="mt-6 flex items-center gap-2.5">
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => setSubmisiToReject(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleConfirmRejectSubmisi}
                className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Menolak...</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Tolak Pengajuan</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 6: KONFIRMASI HAPUS SUBMISI */}
      {/* =================================================================== */}
      {submisiToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => !isProcessing && setSubmisiToDelete(null)}
        >
          <div
            className="relative w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-100 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4 shadow-2xs">
              <Trash2 className="w-7 h-7" />
            </div>

            <h3 className="text-base font-extrabold text-slate-900">
              Hapus Data Pengajuan?
            </h3>

            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Data submisi berikut akan dihapus secara permanen dari sistem database:
            </p>

            <div className="mt-4 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-1">
              <h4 className="text-xs font-bold text-slate-900 leading-snug">
                {submisiToDelete.title}
              </h4>
              <p className="text-[11px] text-slate-500">
                Oleh: <strong className="text-slate-700">{submisiToDelete.studentName}</strong> ({submisiToDelete.nim})
              </p>
            </div>

            <div className="mt-6 flex items-center gap-2.5">
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => setSubmisiToDelete(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleConfirmDeleteSubmisi}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Menghapus...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus Permanen</span>
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

// Sub-komponen Modal Form Tambah/Edit Showcase
function ShowcaseFormModal({
  initialItem,
  onClose,
  onSuccess,
}: {
  initialItem: ApresiasiItem | null;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}) {
  const isEditing = Boolean(initialItem);
  const [category, setCategory] = useState<ApresiasiCategory>(initialItem?.category || "lomba");
  const [title, setTitle] = useState(initialItem?.title || "");
  const [badge, setBadge] = useState(initialItem?.badge || "Juara 1 Nasional");
  const [studentName, setStudentName] = useState(initialItem?.studentName || "");
  const [teamMembers, setTeamMembers] = useState(initialItem?.teamMembers || "");
  const [nim, setNim] = useState(initialItem?.nim || "");
  const [batch, setBatch] = useState(initialItem?.batch || "2024");
  const [organizerOrCompany, setOrganizerOrCompany] = useState(initialItem?.organizerOrCompany || "");
  const [level, setLevel] = useState<"Kampus" | "Regional" | "Nasional" | "Internasional">(
    (initialItem?.level as any) || "Nasional"
  );
  const [description, setDescription] = useState(initialItem?.description || "");
  const [fullStory, setFullStory] = useState(initialItem?.fullStory || "");
  const [mentorOrLecturer, setMentorOrLecturer] = useState(initialItem?.mentorOrLecturer || "");
  const [image, setImage] = useState(
    initialItem?.image ||
      "https://images.unsplash.com/photo-1531403009284-440f080d1e12?q=80&w=800&auto=format&fit=crop"
  );
  const [liveUrl, setLiveUrl] = useState(initialItem?.liveUrl || "");
  const [githubUrl, setGithubUrl] = useState(initialItem?.githubUrl || "");
  const [proofUrl, setProofUrl] = useState(initialItem?.proofUrl || "");
  const [featured, setFeatured] = useState(initialItem?.featured ?? false);

  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (isEditing && initialItem) {
        const res = await updateApresiasiShowcase(initialItem.id, {
          category,
          title: title.trim(),
          badge: badge.trim(),
          studentName: studentName.trim(),
          teamMembers: teamMembers.trim() || undefined,
          nim: nim.trim() || undefined,
          batch,
          organizerOrCompany: organizerOrCompany.trim(),
          level,
          description: description.trim(),
          fullStory: fullStory.trim() || undefined,
          mentorOrLecturer: mentorOrLecturer.trim() || undefined,
          image: image.trim(),
          liveUrl: liveUrl.trim() || undefined,
          githubUrl: githubUrl.trim() || undefined,
          proofUrl: proofUrl.trim() || undefined,
          featured,
        });
        onSuccess(res.message);
      } else {
        const res = await createApresiasiShowcase({
          category,
          title: title.trim(),
          badge: badge.trim(),
          studentName: studentName.trim(),
          teamMembers: teamMembers.trim() || undefined,
          nim: nim.trim() || undefined,
          batch,
          organizerOrCompany: organizerOrCompany.trim(),
          level,
          description: description.trim(),
          fullStory: fullStory.trim() || undefined,
          mentorOrLecturer: mentorOrLecturer.trim() || undefined,
          image: image.trim(),
          liveUrl: liveUrl.trim() || undefined,
          githubUrl: githubUrl.trim() || undefined,
          proofUrl: proofUrl.trim() || undefined,
          featured,
          categoryLabel:
            category === "lomba"
              ? "Juara Lomba"
              : category === "magang"
              ? "Magang & MSIB"
              : "Karya Aplikasi",
        });
        onSuccess(res.message);
      }
    } catch (err) {
      console.error("Gagal simpan item showcase:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl p-6 space-y-4 my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b pb-3 border-slate-100">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#0094E0] block">
              {isEditing ? "Perbarui Prestasi" : "Tambah Karya / Prestasi Baru"}
            </span>
            <h3 className="text-base font-bold text-[#00296E] mt-0.5">
              {isEditing ? initialItem?.title : "Formulir Showcase Apresia-SI"}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs max-h-[70vh] overflow-y-auto pr-1">
          {/* Kategori */}
          <div>
            <label className="block text-slate-700 font-bold mb-1.5">
              Kategori Showcase <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setCategory("lomba")}
                className={`py-2 px-3 rounded-xl border text-center font-bold cursor-pointer transition-colors ${
                  category === "lomba"
                    ? "bg-[#00296E] text-white border-[#00296E]"
                    : "bg-slate-50 text-slate-600 border-slate-200"
                }`}
              >
                🏆 Pemenang Lomba
              </button>
              <button
                type="button"
                onClick={() => setCategory("karya")}
                className={`py-2 px-3 rounded-xl border text-center font-bold cursor-pointer transition-colors ${
                  category === "karya"
                    ? "bg-[#00296E] text-white border-[#00296E]"
                    : "bg-slate-50 text-slate-600 border-slate-200"
                }`}
              >
                💻 Karya & Inovasi
              </button>
              <button
                type="button"
                onClick={() => setCategory("magang")}
                className={`py-2 px-3 rounded-xl border text-center font-bold cursor-pointer transition-colors ${
                  category === "magang"
                    ? "bg-[#00296E] text-white border-[#00296E]"
                    : "bg-slate-50 text-slate-600 border-slate-200"
                }`}
              >
                💼 Magang & MSIB
              </button>
            </div>
          </div>

          {/* Judul & Badge */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Judul Capaian / Karya <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: Juara 1 UI/UX Hackathon"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Badge / Teks Label <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={badge}
                onChange={(e) => setBadge(e.target.value)}
                placeholder="Contoh: Juara 1 Nasional / MSIB Batch 6"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs"
              />
            </div>
          </div>

          {/* Nama Mahasiswa / Tim & NIM */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-slate-700 font-bold mb-1">
                Nama Mahasiswa / Ketua <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="Contoh: Muhammad Fadhil"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">NIM (Opsional)</label>
              <input
                type="text"
                value={nim}
                onChange={(e) => setNim(e.target.value)}
                placeholder="231150002"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs"
              />
            </div>
          </div>

          {/* Angkatan & Anggota Tim */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Angkatan</label>
              <select
                value={batch}
                onChange={(e) => setBatch(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs"
              >
                <option value="2026">2026</option>
                <option value="2025">2025</option>
                <option value="2024">2024</option>
                <option value="2023">2023</option>
                <option value="2022">2022</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-slate-700 font-bold mb-1">Anggota Tim (Opsional)</label>
              <input
                type="text"
                value={teamMembers}
                onChange={(e) => setTeamMembers(e.target.value)}
                placeholder="Anindya Putri, Zahra Salsabila"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs"
              />
            </div>
          </div>

          {/* Penyelenggara / Mitra & Tingkat */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Penyelenggara / Tempat Magang <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={organizerOrCompany}
                onChange={(e) => setOrganizerOrCompany(e.target.value)}
                placeholder="Contoh: Kemendikbudristek / Bank Mandiri"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">Tingkat Prestasi</label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs"
              >
                <option value="Kampus">Kampus</option>
                <option value="Regional">Regional</option>
                <option value="Nasional">Nasional</option>
                <option value="Internasional">Internasional</option>
              </select>
            </div>
          </div>

          {/* Gambar Banner */}
          <div>
            <label className="block text-slate-700 font-bold mb-1">
              URL Foto Dokumentasi / Banner <span className="text-red-500">*</span>
            </label>
            <input
              type="url"
              required
              value={image}
              onChange={(e) => setImage(e.target.value)}
              placeholder="https://images.unsplash.com/... atau tautan gambar"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs"
            />
          </div>

          {/* Deskripsi Singkat */}
          <div>
            <label className="block text-slate-700 font-bold mb-1">
              Deskripsi Singkat (Tampil di Kartu) <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ringkasan prestasi atau karya dalam 1-2 kalimat..."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs resize-none"
            />
          </div>

          {/* Cerita Lengkap & Dosen Pembina */}
          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Cerita Lengkap / Kisah Inovasi (Tampil di Modal Detail)
              </label>
              <textarea
                rows={3}
                value={fullStory}
                onChange={(e) => setFullStory(e.target.value)}
                placeholder="Latar belakang inovasi, teknologi yang digunakan, serta dampak pencapaian..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs resize-none"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">Dosen Pembimbing / Lab (Opsional)</label>
              <input
                type="text"
                value={mentorOrLecturer}
                onChange={(e) => setMentorOrLecturer(e.target.value)}
                placeholder="Contoh: Dosen Pembina HIMASI / Laboratorium Komputasi"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs"
              />
            </div>
          </div>

          {/* Tautan Live, GitHub & Bukti */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Live Demo URL</label>
              <input
                type="url"
                value={liveUrl}
                onChange={(e) => setLiveUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">GitHub Repo URL</label>
              <input
                type="url"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                placeholder="https://github.com/..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">Bukti / Sertifikat URL</label>
              <input
                type="text"
                value={proofUrl}
                onChange={(e) => setProofUrl(e.target.value)}
                placeholder="Link Drive / dokumen"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs"
              />
            </div>
          </div>

          {/* Toggle Featured */}
          <div className="pt-2 flex items-center gap-2">
            <input
              type="checkbox"
              id="featured-check"
              checked={featured}
              onChange={(e) => setFeatured(e.target.checked)}
              className="rounded text-[#00296E] focus:ring-[#0094E0]"
            />
            <label htmlFor="featured-check" className="font-bold text-slate-700 cursor-pointer">
              Tandai sebagai Karya Unggulan (Featured) di Galeri
            </label>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#00296E] hover:bg-[#001f52] text-white font-bold shadow-xs transition-all disabled:opacity-50 cursor-pointer"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                <Check className="w-4 h-4 text-[#0094E0]" />
              )}
              <span>{isEditing ? "Simpan Perubahan" : "Terbitkan ke Galeri"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

