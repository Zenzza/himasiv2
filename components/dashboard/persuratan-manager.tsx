"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  FileText,
  PaperPlaneTilt,
  Tray,
  Clock,
  CheckCircle,
  WarningCircle,
  Plus,
  DownloadSimple,
  Eye,
  Trash,
  Copy,
  Check,
  MagnifyingGlass,
  ArrowsClockwise,
  X,
  FileCode,
  FileXls,
  UploadSimple,
  ArrowCounterClockwise,
  ShieldCheck,
  Buildings,
  CalendarBlank,
  ArrowSquareOut,
  CaretRight,
  Info,
} from "@phosphor-icons/react";
import {
  type SuratArsipItem,
  type JenisSurat,
  type KodeJenisSurat,
  type StatusSuratKeluar,
  type StatusSuratMasuk,
  type StatusSurat,
  KODE_JENIS_SURAT_MAP,
  KLASIFIKASI_SURAT_LIST,
} from "@/lib/types/persuratan";
import {
  generateNomorSurat,
  parseNomorUrut,
  formatTanggalSurat,
  angkaKeRomawi,
  parseBulanTahun,
} from "@/lib/utils/romawi";
import {
  getDaftarSurat,
  getNextNomorUrut,
  createSurat,
  updateSurat,
  updateStatusSurat,
  revertSuratToDraft,
  deleteSurat,
  uploadBerkasSurat,
} from "@/lib/supabase/persuratan";
import { recordAuditLog } from "@/lib/supabase/audit-log";
import { type UserRole, ROLE_LABELS } from "@/lib/types/auth";
import DashboardPageHeader from "@/components/dashboard/ui/dashboard-page-header";
import DashboardMetricStrip from "@/components/dashboard/ui/dashboard-metric-strip";

export interface PersuratanManagerProps {
  currentUserRole?: UserRole;
  currentUserName?: string;
}

export default function PersuratanManager({
  currentUserRole = "bph",
  currentUserName = "Pengurus HIMASI",
}: PersuratanManagerProps) {
  const isBphOrAdmin = currentUserRole === "bph" || currentUserRole === "super_admin";
  const actorName = currentUserName || (currentUserRole === "super_admin" ? "Super Admin" : "Sekretaris HIMASI");

  // Data utama persuratan
  const [suratList, setSuratList] = useState<SuratArsipItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [nextNomorData, setNextNomorData] = useState<{ nomor_urut: number; nomor_surat: string }>({
    nomor_urut: 15,
    nomor_surat: "015/UND/HIMASI/XI/2026",
  });

  // Tab & Filter
  const [activeTab, setActiveTab] = useState<"keluar" | "masuk">("keluar");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterKeluar, setFilterKeluar] = useState<"semua" | StatusSuratKeluar>("semua");
  const [filterMasuk, setFilterMasuk] = useState<"semua" | StatusSuratMasuk>("semua");

  // Modals state
  const [isModalKeluarOpen, setIsModalKeluarOpen] = useState(false);
  const [isModalMasukOpen, setIsModalMasukOpen] = useState(false);
  const [selectedSurat, setSelectedSurat] = useState<SuratArsipItem | null>(null);
  const [suratToDelete, setSuratToDelete] = useState<SuratArsipItem | null>(null);

  // Form State: Buat Surat Keluar
  const [keluarKodeJenis, setKeluarKodeJenis] = useState<KodeJenisSurat>("UND");
  const [keluarPerihal, setKeluarPerihal] = useState("");
  const [keluarTujuan, setKeluarTujuan] = useState("");
  const [keluarTanggal, setKeluarTanggal] = useState(new Date().toISOString().slice(0, 10));
  const [keluarFile, setKeluarFile] = useState<File | null>(null);
  const [isSubmittingKeluar, setIsSubmittingKeluar] = useState(false);

  // Form State: Catat Surat Masuk
  const [masukPengirim, setMasukPengirim] = useState("");
  const [masukNomorAsal, setMasukNomorAsal] = useState("");
  const [masukPerihal, setMasukPerihal] = useState("");
  const [masukKodeJenis, setMasukKodeJenis] = useState<KodeJenisSurat>("UND");
  const [masukTanggalSurat, setMasukTanggalSurat] = useState(new Date().toISOString().slice(0, 10));
  const [masukTanggalDiterima, setMasukTanggalDiterima] = useState(new Date().toISOString().slice(0, 10));
  const [masukStatus, setMasukStatus] = useState<StatusSuratMasuk>("belum_disposisi");
  const [masukCatatan, setMasukCatatan] = useState("");
  const [masukFile, setMasukFile] = useState<File | null>(null);
  const [isSubmittingMasuk, setIsSubmittingMasuk] = useState(false);

  // State Disposisi & File di Modal Detail
  const [editDisposisiNotes, setEditDisposisiNotes] = useState("");
  const [editDisposisiStatus, setEditDisposisiStatus] = useState<StatusSuratMasuk>("belum_disposisi");
  const [isUpdatingDisposisi, setIsUpdatingDisposisi] = useState(false);
  const [detailFileToUpload, setDetailFileToUpload] = useState<File | null>(null);
  const [isUploadingDetailFile, setIsUploadingDetailFile] = useState(false);

  // Feedback State
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = useCallback((msg: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastMessage(msg);
    toastTimerRef.current = setTimeout(() => {
      setToastMessage(null);
      toastTimerRef.current = null;
    }, 3500);
  }, []);

  // 1. Ambil data surat & nomor urut berikutnya secara stabil tanpa re-fetch berkedip saat modal input berubah
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const items = await getDaftarSurat();
      setSuratList(items);

      const next = await getNextNomorUrut("UND", new Date().toISOString());
      setNextNomorData(next);
    } catch (err) {
      console.error("[persuratan] Gagal memuat data persuratan:", err);
      showToast("Gagal menyinkronkan data persuratan.");
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    let isMounted = true;
    void Promise.resolve().then(async () => {
      if (isMounted) {
        await loadData();
      }
    });
    return () => {
      isMounted = false;
    };
  }, [loadData]);

  // Sinkronisasi estimasi nomor berikutnya saat kode jenis atau tanggal surat keluar berubah
  useEffect(() => {
    let isCancelled = false;
    async function updateNextNumberPreview() {
      try {
        const next = await getNextNomorUrut(keluarKodeJenis, keluarTanggal);
        if (!isCancelled) {
          setNextNomorData(next);
        }
      } catch (e) {
        console.warn("Gagal menghitung nomor berikutnya:", e);
      }
    }
    updateNextNumberPreview();
    return () => {
      isCancelled = true;
    };
  }, [keluarKodeJenis, keluarTanggal]);

  // Sinkronkan form disposisi saat modal detail dibuka
  useEffect(() => {
    let isMounted = true;
    void Promise.resolve().then(() => {
      if (!isMounted) return;
      if (selectedSurat && selectedSurat.jenis_surat === "masuk") {
        setEditDisposisiNotes(selectedSurat.catatan_disposisi || "");
        setEditDisposisiStatus(
          (selectedSurat.status as StatusSuratMasuk) || "belum_disposisi"
        );
      }
      setDetailFileToUpload(null);
    });
    return () => {
      isMounted = false;
    };
  }, [selectedSurat]);

  // 2. Metrik Kartu Stat (Swiss Grid)
  const totalKeluar = useMemo(() => {
    return suratList.filter((s) => s.jenis_surat === "keluar").length;
  }, [suratList]);

  const totalMasuk = useMemo(() => {
    return suratList.filter((s) => s.jenis_surat === "masuk").length;
  }, [suratList]);

  const menungguTtdCount = useMemo(() => {
    return suratList.filter(
      (s) => s.jenis_surat === "keluar" && s.status === "menunggu_ttd"
    ).length;
  }, [suratList]);

  const belumDisposisiCount = useMemo(() => {
    return suratList.filter(
      (s) => s.jenis_surat === "masuk" && s.status === "belum_disposisi"
    ).length;
  }, [suratList]);

  const nextUrutPadded = useMemo(() => {
    return String(nextNomorData.nomor_urut || 1).padStart(3, "0");
  }, [nextNomorData.nomor_urut]);

  // 3. Filter data tabel
  const filteredKeluar = useMemo(() => {
    return suratList.filter((item) => {
      if (item.jenis_surat !== "keluar") return false;
      if (filterKeluar !== "semua" && item.status !== filterKeluar) return false;
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      return (
        item.nomor_surat.toLowerCase().includes(q) ||
        item.perihal.toLowerCase().includes(q) ||
        item.tujuan_pengirim.toLowerCase().includes(q) ||
        item.kategori_label.toLowerCase().includes(q)
      );
    });
  }, [suratList, filterKeluar, searchQuery]);

  const filteredMasuk = useMemo(() => {
    return suratList.filter((item) => {
      if (item.jenis_surat !== "masuk") return false;
      if (filterMasuk !== "semua" && item.status !== filterMasuk) return false;
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      return (
        item.nomor_surat.toLowerCase().includes(q) ||
        item.perihal.toLowerCase().includes(q) ||
        item.tujuan_pengirim.toLowerCase().includes(q) ||
        item.kategori_label.toLowerCase().includes(q) ||
        (item.catatan_disposisi && item.catatan_disposisi.toLowerCase().includes(q))
      );
    });
  }, [suratList, filterMasuk, searchQuery]);

  // 4. Salin Nomor Surat ke Clipboard
  const handleCopyNomor = useCallback(
    (nomor: string, id: string) => {
      if (!nomor || nomor === "—") return;
      navigator.clipboard.writeText(nomor);
      setCopiedId(id);
      showToast(`Nomor surat disalin: ${nomor}`);
      setTimeout(() => setCopiedId(null), 2000);
    },
    [showToast]
  );

  // 5. Ekspor Rekapitulasi CSV
  const handleExportCSV = useCallback(() => {
    const isKeluar = activeTab === "keluar";
    const dataToExport = isKeluar ? filteredKeluar : filteredMasuk;

    if (dataToExport.length === 0) {
      showToast("Tidak ada data untuk diekspor pada filter ini.");
      return;
    }

    let csvContent = "";
    const escapeCsv = (str: string | number | null | undefined) => {
      if (str === null || str === undefined) return '""';
      let s = String(str).replace(/"/g, '""');
      // Mitigasi CSV Formula Injection (CWE-1236) jika karakter awalan berbahaya
      if (/^[=+\-@\t\r]/.test(s)) {
        s = `'${s}`;
      }
      return `"${s}"`;
    };

    if (isKeluar) {
      csvContent += ["Nomor Urut", "Nomor Surat", "Perihal", "Kategori", "Tujuan", "Tanggal Surat", "Status", "Nama Berkas"].join(",") + "\n";
      dataToExport.forEach((item) => {
        csvContent +=
          [
            escapeCsv(item.nomor_urut || "—"),
            escapeCsv(item.nomor_surat),
            escapeCsv(item.perihal),
            escapeCsv(item.kategori_label),
            escapeCsv(item.tujuan_pengirim),
            escapeCsv(item.tanggal_surat),
            escapeCsv(item.status),
            escapeCsv(item.file_name || "—"),
          ].join(",") + "\n";
      });
    } else {
      csvContent += ["Nomor Surat Asal", "Perihal", "Kategori", "Instansi Pengirim", "Tanggal Surat", "Tanggal Diterima", "Status Disposisi", "Catatan Disposisi", "Nama Berkas"].join(",") + "\n";
      dataToExport.forEach((item) => {
        csvContent +=
          [
            escapeCsv(item.nomor_surat),
            escapeCsv(item.perihal),
            escapeCsv(item.kategori_label),
            escapeCsv(item.tujuan_pengirim),
            escapeCsv(item.tanggal_surat),
            escapeCsv(item.tanggal_diterima || "—"),
            escapeCsv(item.status),
            escapeCsv(item.catatan_disposisi || "—"),
            escapeCsv(item.file_name || "—"),
          ].join(",") + "\n";
      });
    }

    // Menambahkan UTF-8 BOM (\uFEFF) agar Microsoft Excel di Windows menampilkan em-dash dan simbol dengan benar
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const todayStr = new Date().toISOString().slice(0, 10);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `rekap-persuratan-${isKeluar ? "keluar" : "masuk"}-${todayStr}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast(`Rekapitulasi ${isKeluar ? "surat keluar" : "surat masuk"} berhasil diekspor.`);
  }, [activeTab, filteredKeluar, filteredMasuk, showToast]);

  // 6. Buat Surat Keluar (Draf vs Ajukan ke BPH)
  const handleSubmitSuratKeluar = async (asDraft: boolean) => {
    if (!keluarPerihal.trim()) {
      showToast("Perihal surat wajib diisi.");
      return;
    }
    if (!keluarTujuan.trim()) {
      showToast("Pihak tujuan surat wajib diisi.");
      return;
    }

    setIsSubmittingKeluar(true);
    try {
      let fileData: { url: string; fileName: string; fileSize?: string } | null = null;
      if (keluarFile) {
        fileData = await uploadBerkasSurat(keluarFile);
      }

      const kategoriLabel = KODE_JENIS_SURAT_MAP[keluarKodeJenis]?.label || "Lainnya";

      const created = await createSurat({
        jenis_surat: "keluar",
        kode_jenis: keluarKodeJenis,
        kategori_label: kategoriLabel,
        perihal: keluarPerihal.trim(),
        tujuan_pengirim: keluarTujuan.trim(),
        tanggal_surat: keluarTanggal,
        status: asDraft ? "draft" : "menunggu_ttd",
        file_url: fileData?.url || null,
        file_name: fileData?.fileName || null,
        file_size: fileData?.fileSize || null,
      });

      recordAuditLog({
        pengurus_nama: actorName,
        pengurus_role: currentUserRole,
        modul: "persuratan",
        aksi: asDraft
          ? `Membuat surat draf keluar: ${created.perihal}`
          : `Membuat surat keluar resmi No. ${created.nomor_surat}`,
        status: "berhasil",
        detail: `Perihal: ${created.perihal}, Tujuan: ${created.tujuan_pengirim}`,
      }).catch((err) => console.warn("[PersuratanManager] Gagal mencatat audit log surat keluar:", err));

      showToast(
        asDraft
          ? "Draf surat keluar tersimpan (tanpa memakan nomor urut)."
          : `Surat diajukan ke BPH dengan nomor resmi ${created.nomor_surat}.`
      );

      // Reset form & tutup modal
      setKeluarPerihal("");
      setKeluarTujuan("");
      setKeluarFile(null);
      setIsModalKeluarOpen(false);

      await loadData();
    } catch (err) {
      console.error("Gagal membuat surat keluar:", err);
      showToast("Terjadi kesalahan saat menyimpan surat.");
    } finally {
      setIsSubmittingKeluar(false);
    }
  };

  // 7. Catat Surat Masuk
  const handleSubmitSuratMasuk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!masukPengirim.trim()) {
      showToast("Instansi pengirim wajib diisi.");
      return;
    }
    if (!masukPerihal.trim()) {
      showToast("Perihal surat masuk wajib diisi.");
      return;
    }

    setIsSubmittingMasuk(true);
    try {
      let fileData: { url: string; fileName: string; fileSize?: string } | null = null;
      if (masukFile) {
        fileData = await uploadBerkasSurat(masukFile);
      }

      const kategoriLabel = KODE_JENIS_SURAT_MAP[masukKodeJenis]?.label || "Lainnya";

      const createdMasuk = await createSurat({
        jenis_surat: "masuk",
        kode_jenis: masukKodeJenis,
        kategori_label: kategoriLabel,
        nomor_surat: masukNomorAsal.trim() || "—",
        perihal: masukPerihal.trim(),
        tujuan_pengirim: masukPengirim.trim(),
        tanggal_surat: masukTanggalSurat,
        tanggal_diterima: masukTanggalDiterima,
        status: masukStatus,
        catatan_disposisi: masukCatatan.trim() || null,
        file_url: fileData?.url || null,
        file_name: fileData?.fileName || null,
        file_size: fileData?.fileSize || null,
      });

      recordAuditLog({
        pengurus_nama: actorName,
        pengurus_role: currentUserRole,
        modul: "persuratan",
        aksi: `Membuat surat masuk / mencatat agenda dari ${masukPengirim.trim()}`,
        status: "berhasil",
        detail: `No. Surat: ${masukNomorAsal.trim() || "—"}, Perihal: ${masukPerihal.trim()}`,
      }).catch((err) => console.warn("[PersuratanManager] Gagal mencatat audit log surat masuk:", err));

      showToast("Surat masuk berhasil dicatat ke dalam buku agenda.");

      // Reset form
      setMasukPengirim("");
      setMasukNomorAsal("");
      setMasukPerihal("");
      setMasukCatatan("");
      setMasukFile(null);
      setIsModalMasukOpen(false);

      await loadData();
    } catch (err) {
      console.error("Gagal mencatat surat masuk:", err);
      showToast("Terjadi kesalahan saat mencatat surat masuk.");
    } finally {
      setIsSubmittingMasuk(false);
    }
  };

  // 8. Workflow Aksi BPH: Setujui TTD
  const handleApproveTtd = async (item: SuratArsipItem) => {
    setIsProcessingAction(true);
    try {
      const updated = await updateStatusSurat(item.id, "terkirim");
      if (updated) {
        setSelectedSurat(updated);
        recordAuditLog({
          pengurus_nama: actorName,
          pengurus_role: currentUserRole,
          modul: "persuratan",
          aksi: `Menyetujui tanda tangan surat keluar: ${updated.nomor_surat}`,
          status: "berhasil",
          detail: `Status berubah menjadi terkirim. Perihal: ${updated.perihal}`,
        }).catch((err) => console.warn("[PersuratanManager] Gagal mencatat audit log approve ttd:", err));
        showToast(`Tanda tangan disetujui. Status surat kini Terkirim (${updated.nomor_surat}).`);
      }
      await loadData();
    } catch (err) {
      console.error("Gagal menyetujui TTD:", err);
      showToast("Gagal menyetujui tanda tangan.");
    } finally {
      setIsProcessingAction(false);
    }
  };

  // 9. Workflow Aksi BPH: Number Recycling (Tolak / Tarik kembali ke Draf)
  const handleRevertToDraft = async (item: SuratArsipItem) => {
    setIsProcessingAction(true);
    try {
      const reverted = await revertSuratToDraft(item.id);
      if (reverted) {
        setSelectedSurat(reverted);
        recordAuditLog({
          pengurus_nama: actorName,
          pengurus_role: currentUserRole,
          modul: "persuratan",
          aksi: `Mengembalikan status surat ${reverted.nomor_surat || reverted.id} ke draf`,
          status: "berhasil",
          detail: `Nomor surat ditarik kembali (recycling). Perihal: ${reverted.perihal}`,
        }).catch((err) => console.warn("[PersuratanManager] Gagal mencatat audit log revert draft:", err));
        showToast(
          "Nomor surat berhasil ditarik kembali ke antrean (Number Recycling aktif) & surat kembali ke status Draf."
        );
      }
      await loadData();
    } catch (err) {
      console.error("Gagal menarik nomor surat:", err);
      showToast("Gagal mengembalikan surat ke draf.");
    } finally {
      setIsProcessingAction(false);
    }
  };

  // 10. Pengajuan dari Draf ke Menunggu TTD (Alokasi Nomor Baru)
  const handlePromoteDraftToMenungguTtd = async (item: SuratArsipItem) => {
    setIsProcessingAction(true);
    try {
      const updated = await updateStatusSurat(item.id, "menunggu_ttd");
      if (updated) {
        setSelectedSurat(updated);
        recordAuditLog({
          pengurus_nama: currentUserRole === "super_admin" ? "Super Admin" : "Sekretaris HIMASI",
          pengurus_role: currentUserRole,
          modul: "persuratan",
          aksi: `Mengajukan status draf surat ke menunggu tanda tangan: ${updated.nomor_surat}`,
          status: "berhasil",
          detail: `Perihal: ${updated.perihal}`,
        }).catch((err) => console.warn("[PersuratanManager] Gagal mencatat audit log promote draft:", err));
        showToast(`Nomor resmi diterbitkan: ${updated.nomor_surat}. Menunggu TTD Ketua.`);
      }
      await loadData();
    } catch (err) {
      console.error("Gagal mengajukan draf:", err);
      showToast("Gagal mengajukan draf surat.");
    } finally {
      setIsProcessingAction(false);
    }
  };

  // 11. Simpan Perubahan Disposisi Surat Masuk
  const handleSaveDisposisi = async () => {
    if (!selectedSurat) return;
    setIsUpdatingDisposisi(true);
    try {
      const updated = await updateSurat(selectedSurat.id, {
        status: editDisposisiStatus,
        catatan_disposisi: editDisposisiNotes.trim() || null,
      });
      if (updated) {
        setSelectedSurat(updated);
        recordAuditLog({
          pengurus_nama: actorName,
          pengurus_role: currentUserRole,
          modul: "persuratan",
          aksi: `Memperbarui status disposisi surat masuk: ${selectedSurat.nomor_surat}`,
          status: "berhasil",
          detail: `Status baru: ${editDisposisiStatus}, Catatan: ${editDisposisiNotes.trim() || "-"}`,
        }).catch((err) => console.warn("[PersuratanManager] Gagal mencatat audit log disposisi:", err));
        showToast("Catatan disposisi & status surat masuk berhasil diperbarui.");
      }
      await loadData();
    } catch (err) {
      console.error("Gagal memperbarui disposisi:", err);
      showToast("Gagal memperbarui disposisi.");
    } finally {
      setIsUpdatingDisposisi(false);
    }
  };

  // 12. Upload Lampiran Berkas di Modal Detail
  const handleUploadDetailFile = async () => {
    if (!selectedSurat || !detailFileToUpload) return;
    setIsUploadingDetailFile(true);
    try {
      const fileData = await uploadBerkasSurat(detailFileToUpload);
      if (fileData) {
        const updated = await updateSurat(selectedSurat.id, {
          file_url: fileData.url,
          file_name: fileData.fileName,
          file_size: fileData.fileSize,
        });
        if (updated) {
          setSelectedSurat(updated);
          setDetailFileToUpload(null);
          showToast(`Berkas ${fileData.fileName} berhasil dilampirkan.`);
        }
      }
      await loadData();
    } catch (err) {
      console.error("Gagal mengunggah berkas lampiran:", err);
      showToast("Gagal melampirkan berkas PDF.");
    } finally {
      setIsUploadingDetailFile(false);
    }
  };

  // 13. Hapus Surat
  const handleConfirmDelete = async () => {
    if (!suratToDelete) return;
    setIsProcessingAction(true);
    try {
      await deleteSurat(suratToDelete.id);
      recordAuditLog({
        pengurus_nama: actorName,
        pengurus_role: currentUserRole,
        modul: "persuratan",
        aksi: `Menghapus arsip surat ${suratToDelete.nomor_surat || suratToDelete.id}`,
        status: "berhasil",
        detail: `Jenis: ${suratToDelete.jenis_surat}, Perihal: ${suratToDelete.perihal}`,
      }).catch((err) => console.warn("[PersuratanManager] Gagal mencatat audit log delete surat:", err));

      showToast("Arsip surat berhasil dihapus dari sistem.");
      if (selectedSurat?.id === suratToDelete.id) {
        setSelectedSurat(null);
      }
      setSuratToDelete(null);
      await loadData();
    } catch (err) {
      console.error("Gagal menghapus surat:", err);
      showToast("Gagal menghapus arsip surat.");
    } finally {
      setIsProcessingAction(false);
    }
  };

  // Estimasi Live Nomor Surat Keluar di Form
  const livePreviewNomor = useMemo(() => {
    return generateNomorSurat(
      nextNomorData.nomor_urut,
      keluarKodeJenis,
      keluarTanggal
    );
  }, [nextNomorData.nomor_urut, keluarKodeJenis, keluarTanggal]);

  return (
    <div className="space-y-6">
      {/* 1. HEADER MODUL & AKSI UTAMA */}
      <DashboardPageHeader
        title="Manajemen Persuratan & Penomoran Resmi"
        subtitle="Penomoran otomatis, template surat, dan arsip digital surat masuk & keluar HIMASI."
        onRefresh={loadData}
        refreshLoading={isLoading}
        secondaryAction={{
          label: "Ekspor Rekap",
          onClick: handleExportCSV,
          icon: <FileXls className="w-4 h-4 text-[#0094E0] dark:text-[#38BDF8]" />,
        }}
        primaryAction={{
          label: activeTab === "masuk" ? "+ Catat Surat Masuk" : "+ Buat Surat",
          onClick: () => {
            if (activeTab === "masuk") {
              setIsModalMasukOpen(true);
            } else {
              setIsModalKeluarOpen(true);
            }
          },
        }}
      />

      {/* 2. EMPAT KARTU METRIK OPERASIONAL (SWISS HAIRLINE STRIP) */}
      <DashboardMetricStrip
        columns={4}
        metrics={[
          {
            order: "01.",
            label: "SURAT KELUAR",
            value: totalKeluar,
            sublabel: "Diterbitkan",
            variant: "info",
            icon: <PaperPlaneTilt className="w-4 h-4" />,
            loading: isLoading,
          },
          {
            order: "02.",
            label: "SURAT MASUK",
            value: totalMasuk,
            sublabel: `${belumDisposisiCount} belum disposisi`,
            variant: "default",
            icon: <Tray className="w-4 h-4" />,
            loading: isLoading,
          },
          {
            order: "03.",
            label: "MENUNGGU TTD",
            value: menungguTtdCount,
            sublabel: "Tindakan Ketua",
            variant: menungguTtdCount > 0 ? "warning" : "default",
            icon: <Clock className="w-4 h-4" />,
            loading: isLoading,
          },
          {
            order: "04.",
            label: "NOMOR BERIKUTNYA",
            value: isLoading ? "—" : nextUrutPadded,
            sublabel: "Format HIMASI",
            variant: "success",
            icon: <CheckCircle className="w-4 h-4" />,
            loading: isLoading,
          },
        ]}
      />

      {/* =================================================================== */}
      {/* 3. TAB NAVIGASI UTAMA (Surat Keluar, Surat Masuk, Buat Surat Baru) */}
      {/* =================================================================== */}
      <div className="flex border-b border-[#00296E]/20 dark:border-white/10 gap-6 text-xs sm:text-sm font-bold">
        <button
          type="button"
          onClick={() => setActiveTab("keluar")}
          className={`pb-3 flex items-center gap-2 transition-all cursor-pointer relative uppercase tracking-wider ${
            activeTab === "keluar"
              ? "text-[#00296E] dark:text-[#38BDF8] border-b-2 border-[#00296E] dark:border-[#38BDF8]"
              : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
          }`}
        >
          <PaperPlaneTilt className="w-4 h-4" weight={activeTab === "keluar" ? "fill" : "regular"} />
          <span>Surat Keluar</span>
          <span className="px-2 py-0.5 rounded-none text-[10px] font-extrabold bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 font-mono">
            {totalKeluar}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("masuk")}
          className={`pb-3 flex items-center gap-2 transition-all cursor-pointer relative uppercase tracking-wider ${
            activeTab === "masuk"
              ? "text-[#00296E] dark:text-[#38BDF8] border-b-2 border-[#00296E] dark:border-[#38BDF8]"
              : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
          }`}
        >
          <Tray className="w-4 h-4" weight={activeTab === "masuk" ? "fill" : "regular"} />
          <span>Surat Masuk</span>
          {belumDisposisiCount > 0 ? (
            <span className="px-2 py-0.5 rounded-none text-[10px] font-extrabold bg-amber-500 text-white font-mono">
              {belumDisposisiCount} Pending
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-none text-[10px] font-extrabold bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 font-mono">
              {totalMasuk}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setIsModalKeluarOpen(true)}
          className="pb-3 flex items-center gap-1.5 text-slate-400 dark:text-slate-500 hover:text-[#00296E] dark:hover:text-[#38BDF8] transition-colors cursor-pointer uppercase tracking-wider ml-auto font-mono text-xs"
        >
          <Plus className="w-3.5 h-3.5 text-[#0094E0]" />
          <span>Buat Surat Baru</span>
        </button>
      </div>

      {/* =================================================================== */}
      {/* 4. FILTER BAR DINAMIS & SEARCH */}
      {/* =================================================================== */}
      <div className="bg-white dark:bg-[#001438] p-4 rounded-none border border-[#00296E]/20 dark:border-white/10 shadow-none flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Dynamic Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {activeTab === "keluar" ? (
            (
              [
                { id: "semua", label: "Semua" },
                { id: "draft", label: "Draft" },
                { id: "menunggu_ttd", label: "Menunggu TTD" },
                { id: "terkirim", label: "Terkirim" },
              ] as const
            ).map((pill) => (
              <button
                key={pill.id}
                type="button"
                onClick={() => setFilterKeluar(pill.id)}
                className={`px-3 py-1.5 rounded-none text-xs font-semibold transition-colors shrink-0 cursor-pointer uppercase tracking-wider font-mono ${
                  filterKeluar === pill.id
                    ? "bg-[#00296E] dark:bg-[#38BDF8] text-white dark:text-[#001740]"
                    : "bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10"
                }`}
              >
                {pill.label}
              </button>
            ))
          ) : (
            (
              [
                { id: "semua", label: "Semua" },
                { id: "belum_disposisi", label: "Belum Disposisi" },
                { id: "didisposisi", label: "Didisposisi" },
                { id: "selesai", label: "Selesai" },
              ] as const
            ).map((pill) => (
              <button
                key={pill.id}
                type="button"
                onClick={() => setFilterMasuk(pill.id)}
                className={`px-3 py-1.5 rounded-none text-xs font-semibold transition-colors shrink-0 cursor-pointer uppercase tracking-wider font-mono ${
                  filterMasuk === pill.id
                    ? "bg-[#00296E] dark:bg-[#38BDF8] text-white dark:text-[#001740]"
                    : "bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10"
                }`}
              >
                {pill.label}
              </button>
            ))
          )}
        </div>

        {/* Search Bar Input */}
        <div className="relative min-w-[260px] md:w-80">
          <MagnifyingGlass className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nomor, perihal, atau tujuan..."
            className="w-full pl-9 pr-8 py-1.5 text-xs rounded-none border border-[#00296E]/20 dark:border-white/10 bg-slate-50 dark:bg-[#001740] text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-[#00296E] dark:focus:border-[#38BDF8]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* =================================================================== */}
      {/* 5. TABEL DATA SWISS GRID */}
      {/* =================================================================== */}
      <div className="bg-white dark:bg-[#001438] border border-[#00296E]/20 dark:border-white/10 rounded-none shadow-none overflow-hidden">
        <div className="overflow-x-auto">
          {activeTab === "keluar" ? (
            /* TABEL SURAT KELUAR */
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-[#001740] border-b border-[#00296E]/20 dark:border-white/10 font-mono text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="py-3 px-4 font-bold">NOMOR SURAT</th>
                  <th className="py-3 px-4 font-bold">PERIHAL</th>
                  <th className="py-3 px-4 font-bold">TUJUAN</th>
                  <th className="py-3 px-4 font-bold">TANGGAL</th>
                  <th className="py-3 px-4 font-bold text-center">STATUS</th>
                  <th className="py-3 px-4 font-bold text-right">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#00296E]/10 dark:divide-white/5">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 font-mono">
                      <ArrowsClockwise className="w-5 h-5 animate-spin mx-auto mb-2 text-[#0094E0]" />
                      Memuat buku agenda surat keluar...
                    </td>
                  </tr>
                ) : filteredKeluar.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 font-mono">
                      Tidak ada arsip surat keluar yang sesuai kriteria pencarian.
                    </td>
                  </tr>
                ) : (
                  filteredKeluar.map((item) => {
                    const isDraft = item.status === "draft";
                    const isMenungguTtd = item.status === "menunggu_ttd";
                    const isTerkirim = item.status === "terkirim";

                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition-colors"
                      >
                        {/* NOMOR SURAT */}
                        <td className="py-3 px-4 font-mono whitespace-nowrap">
                          {isDraft ? (
                            <span className="text-slate-400 font-bold">—</span>
                          ) : (
                            <div className="flex items-center gap-1.5 group">
                              <span className="font-bold text-[#00296E] dark:text-[#38BDF8]">
                                {item.nomor_surat}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopyNomor(item.nomor_surat, item.id)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-[#00296E] dark:hover:text-[#38BDF8]"
                                title="Salin Nomor Surat"
                              >
                                {copiedId === item.id ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          )}
                        </td>

                        {/* PERIHAL */}
                        <td className="py-3 px-4 max-w-xs">
                          <p className="font-bold text-slate-900 dark:text-white line-clamp-1">
                            {item.perihal}
                          </p>
                          <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 dark:text-slate-400">
                            {item.kategori_label || "Umum"}
                          </span>
                        </td>

                        {/* TUJUAN */}
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-300 max-w-xs truncate">
                          {item.tujuan_pengirim}
                        </td>

                        {/* TANGGAL */}
                        <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300 whitespace-nowrap">
                          {formatTanggalSurat(item.tanggal_surat)}
                        </td>

                        {/* STATUS */}
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          {isDraft && (
                            <span className="px-2.5 py-0.5 rounded-none text-[10px] font-mono font-bold uppercase tracking-wider bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-white/20">
                              Draft
                            </span>
                          )}
                          {isMenungguTtd && (
                            <span className="px-2.5 py-0.5 rounded-none text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                              Menunggu TTD
                            </span>
                          )}
                          {isTerkirim && (
                            <span className="px-2.5 py-0.5 rounded-none text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                              Terkirim
                            </span>
                          )}
                        </td>

                        {/* AKSI */}
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setSelectedSurat(item)}
                              className="p-1.5 rounded-none border border-[#00296E]/20 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 transition-colors"
                              title="Lihat Detail & Tindakan"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {item.file_url ? (
                              <a
                                href={item.file_url}
                                target="_blank"
                                rel="noreferrer"
                                download={item.file_name || undefined}
                                className="p-1.5 rounded-none border border-[#00296E]/20 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 text-[#00296E] dark:text-[#38BDF8] transition-colors"
                                title={`Unduh Berkas: ${item.file_name || "Surat"}`}
                              >
                                <DownloadSimple className="w-3.5 h-3.5" />
                              </a>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setSelectedSurat(item)}
                                className="p-1.5 rounded-none border border-dashed border-slate-300 dark:border-white/20 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                                title="Lampirkan Dokumen PDF"
                              >
                                <UploadSimple className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {isBphOrAdmin && (
                              <button
                                type="button"
                                onClick={() => setSuratToDelete(item)}
                                className="p-1.5 rounded-none border border-red-500/20 hover:bg-red-500/10 text-red-500 transition-colors"
                                title="Hapus Arsip Surat"
                              >
                                <Trash className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          ) : (
            /* TABEL SURAT MASUK */
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-[#001740] border-b border-[#00296E]/20 dark:border-white/10 font-mono text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="py-3 px-4 font-bold">NOMOR SURAT ASAL</th>
                  <th className="py-3 px-4 font-bold">PERIHAL</th>
                  <th className="py-3 px-4 font-bold">INSTANSI PENGIRIM</th>
                  <th className="py-3 px-4 font-bold">TANGGAL DITERIMA</th>
                  <th className="py-3 px-4 font-bold text-center">STATUS DISPOSISI</th>
                  <th className="py-3 px-4 font-bold text-right">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#00296E]/10 dark:divide-white/5">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 font-mono">
                      <ArrowsClockwise className="w-5 h-5 animate-spin mx-auto mb-2 text-[#0094E0]" />
                      Memuat buku agenda surat masuk...
                    </td>
                  </tr>
                ) : filteredMasuk.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 font-mono">
                      Tidak ada arsip surat masuk yang sesuai kriteria pencarian.
                    </td>
                  </tr>
                ) : (
                  filteredMasuk.map((item) => {
                    const isBelumDisposisi = item.status === "belum_disposisi";
                    const isDidisposisi = item.status === "didisposisi";
                    const isSelesai = item.status === "selesai";

                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition-colors"
                      >
                        {/* NOMOR SURAT ASAL */}
                        <td className="py-3 px-4 font-mono whitespace-nowrap">
                          <div className="flex items-center gap-1.5 group">
                            <span className="font-bold text-slate-800 dark:text-slate-200">
                              {item.nomor_surat}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopyNomor(item.nomor_surat, item.id)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-[#00296E] dark:hover:text-[#38BDF8]"
                              title="Salin Nomor Asal"
                            >
                              {copiedId === item.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-500" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </td>

                        {/* PERIHAL */}
                        <td className="py-3 px-4 max-w-xs">
                          <p className="font-bold text-slate-900 dark:text-white line-clamp-1">
                            {item.perihal}
                          </p>
                          <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 dark:text-slate-400">
                            {item.kategori_label || "Surat Masuk"}
                          </span>
                        </td>

                        {/* INSTANSI PENGIRIM */}
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-300 max-w-xs truncate">
                          {item.tujuan_pengirim}
                        </td>

                        {/* TANGGAL DITERIMA */}
                        <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300 whitespace-nowrap">
                          {formatTanggalSurat(item.tanggal_diterima || item.tanggal_surat)}
                        </td>

                        {/* STATUS DISPOSISI */}
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          {isBelumDisposisi && (
                            <span className="px-2.5 py-0.5 rounded-none text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                              Belum Disposisi
                            </span>
                          )}
                          {isDidisposisi && (
                            <span className="px-2.5 py-0.5 rounded-none text-[10px] font-mono font-bold uppercase tracking-wider bg-sky-500/10 dark:bg-sky-500/20 text-[#0094E0] dark:text-[#38BDF8] border border-sky-500/30">
                              Didisposisi
                            </span>
                          )}
                          {isSelesai && (
                            <span className="px-2.5 py-0.5 rounded-none text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                              Selesai
                            </span>
                          )}
                        </td>

                        {/* AKSI */}
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setSelectedSurat(item)}
                              className="p-1.5 rounded-none border border-[#00296E]/20 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 transition-colors"
                              title="Lihat Detail & Disposisi"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {item.file_url && (
                              <a
                                href={item.file_url}
                                target="_blank"
                                rel="noreferrer"
                                download={item.file_name || undefined}
                                className="p-1.5 rounded-none border border-[#00296E]/20 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 text-[#00296E] dark:text-[#38BDF8] transition-colors"
                                title={`Unduh Berkas: ${item.file_name || "Surat"}`}
                              >
                                <DownloadSimple className="w-3.5 h-3.5" />
                              </a>
                            )}

                            {isBphOrAdmin && (
                              <button
                                type="button"
                                onClick={() => setSuratToDelete(item)}
                                className="p-1.5 rounded-none border border-red-500/20 hover:bg-red-500/10 text-red-500 transition-colors"
                                title="Hapus Arsip Surat"
                              >
                                <Trash className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer Info & Formula Penomoran Baku */}
        <div className="p-3 bg-slate-50 dark:bg-[#001740] border-t border-[#00296E]/20 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
          <div className="flex items-center gap-2">
            <Info className="w-3.5 h-3.5 text-[#0094E0]" />
            <span>
              Format penomoran:{" "}
              <strong className="text-slate-700 dark:text-slate-300">
                [nomor]/[jenis]/HIMASI/[bulan romawi]/[tahun]
              </strong>
            </span>
          </div>
          <div>
            Menampilkan{" "}
            {activeTab === "keluar" ? filteredKeluar.length : filteredMasuk.length}{" "}
            dari {activeTab === "keluar" ? totalKeluar : totalMasuk} dokumen
          </div>
        </div>
      </div>

      {/* =================================================================== */}
      {/* 6. MODAL 1: FORMULIR BUAT SURAT KELUAR */}
      {/* =================================================================== */}
      {isModalKeluarOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#001438] border border-[#00296E]/20 dark:border-white/10 rounded-none shadow-none w-full max-w-xl max-h-[90vh] overflow-y-auto">
            {/* Header Modal */}
            <div className="p-4 border-b border-[#00296E]/20 dark:border-white/10 flex items-center justify-between bg-slate-50 dark:bg-[#001740]">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-widest text-slate-400">
                  Formulir Penerbitan
                </p>
                <h3 className="text-base font-extrabold text-[#00296E] dark:text-white uppercase tracking-wider">
                  Buat Surat Keluar Baru
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalKeluarOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Estimasi Nomor Live Banner */}
            <div className="p-4 bg-sky-50 dark:bg-sky-950/40 border-b border-[#0094E0]/20 flex items-center gap-3">
              <FileCode className="w-5 h-5 text-[#0094E0] shrink-0" />
              <div>
                <p className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold">
                  Estimasi Nomor Resmi Bila Diajukan:
                </p>
                <p className="text-xs sm:text-sm font-mono font-extrabold text-[#00296E] dark:text-[#38BDF8]">
                  {livePreviewNomor}
                </p>
              </div>
            </div>

            {/* Form Body */}
            <div className="p-5 space-y-4 text-xs">
              {/* Klasifikasi Jenis Surat */}
              <div>
                <label className="block font-bold uppercase tracking-wider font-mono text-slate-700 dark:text-slate-300 mb-1">
                  Klasifikasi / Kode Jenis Surat *
                </label>
                <select
                  value={keluarKodeJenis}
                  onChange={(e) => setKeluarKodeJenis(e.target.value as KodeJenisSurat)}
                  className="w-full px-3 py-2 rounded-none border border-[#00296E]/20 dark:border-white/10 bg-slate-50 dark:bg-[#001740] text-slate-800 dark:text-slate-100 font-mono text-xs focus:outline-none focus:border-[#00296E]"
                >
                  {KLASIFIKASI_SURAT_LIST.map((k) => (
                    <option key={k.kode} value={k.kode}>
                      [{k.kode}] {k.label} — {k.deskripsi}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tanggal Surat */}
              <div>
                <label className="block font-bold uppercase tracking-wider font-mono text-slate-700 dark:text-slate-300 mb-1">
                  Tanggal Surat *
                </label>
                <input
                  type="date"
                  value={keluarTanggal}
                  onChange={(e) => setKeluarTanggal(e.target.value)}
                  className="w-full px-3 py-2 rounded-none border border-[#00296E]/20 dark:border-white/10 bg-slate-50 dark:bg-[#001740] text-slate-800 dark:text-slate-100 font-mono text-xs focus:outline-none focus:border-[#00296E]"
                />
              </div>

              {/* Perihal */}
              <div>
                <label className="block font-bold uppercase tracking-wider font-mono text-slate-700 dark:text-slate-300 mb-1">
                  Perihal Pokok Surat *
                </label>
                <input
                  type="text"
                  value={keluarPerihal}
                  onChange={(e) => setKeluarPerihal(e.target.value)}
                  placeholder="Contoh: Undangan Rapat Pleno Evaluasi Program Kerja"
                  className="w-full px-3 py-2 rounded-none border border-[#00296E]/20 dark:border-white/10 bg-slate-50 dark:bg-[#001740] text-slate-800 dark:text-slate-100 text-xs focus:outline-none focus:border-[#00296E]"
                />
              </div>

              {/* Tujuan Surat */}
              <div>
                <label className="block font-bold uppercase tracking-wider font-mono text-slate-700 dark:text-slate-300 mb-1">
                  Pihak / Instansi Tujuan *
                </label>
                <input
                  type="text"
                  value={keluarTujuan}
                  onChange={(e) => setKeluarTujuan(e.target.value)}
                  placeholder="Contoh: Wakil Rektor III Bidang Kemahasiswaan & Kerjasama"
                  className="w-full px-3 py-2 rounded-none border border-[#00296E]/20 dark:border-white/10 bg-slate-50 dark:bg-[#001740] text-slate-800 dark:text-slate-100 text-xs focus:outline-none focus:border-[#00296E]"
                />
              </div>

              {/* Lampiran Berkas PDF */}
              <div>
                <label className="block font-bold uppercase tracking-wider font-mono text-slate-700 dark:text-slate-300 mb-1">
                  Unggah Berkas PDF Dokumen Resmi (Opsional saat Draf)
                </label>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setKeluarFile(e.target.files?.[0] || null)}
                  className="w-full px-3 py-2 rounded-none border border-dashed border-[#00296E]/30 dark:border-white/20 bg-slate-50 dark:bg-[#001740] text-slate-600 dark:text-slate-300 font-mono text-xs file:mr-3 file:py-1 file:px-2 file:border-0 file:text-xs file:font-bold file:bg-[#00296E] file:text-white"
                />
                {keluarFile && (
                  <p className="mt-1 text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
                    Berkas terpilih: {keluarFile.name} ({(keluarFile.size / 1024).toFixed(0)} KB)
                  </p>
                )}
              </div>
            </div>

            {/* Footer Aksi Modal */}
            <div className="p-4 border-t border-[#00296E]/20 dark:border-white/10 bg-slate-50 dark:bg-[#001740] flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setIsModalKeluarOpen(false)}
                className="px-4 py-2 rounded-none border border-slate-300 dark:border-white/20 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider text-xs"
              >
                Batal
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isSubmittingKeluar}
                  onClick={() => handleSubmitSuratKeluar(true)}
                  className="px-4 py-2 rounded-none border border-[#00296E]/30 dark:border-white/20 bg-white dark:bg-[#001740] hover:bg-slate-100 dark:hover:bg-white/10 text-[#00296E] dark:text-white font-bold uppercase tracking-wider text-xs"
                >
                  {isSubmittingKeluar ? "Menyimpan..." : "Simpan Draf (Tanpa Nomor)"}
                </button>

                <button
                  type="button"
                  disabled={isSubmittingKeluar}
                  onClick={() => handleSubmitSuratKeluar(false)}
                  className="px-4 py-2 rounded-none bg-[#00296E] hover:bg-[#001f52] text-white font-bold uppercase tracking-wider text-xs flex items-center gap-1.5"
                >
                  {isSubmittingKeluar ? (
                    "Memproses..."
                  ) : (
                    <>
                      <PaperPlaneTilt className="w-3.5 h-3.5" />
                      <span>Ajukan ke BPH</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* 7. MODAL 2: FORMULIR CATAT SURAT MASUK */}
      {/* =================================================================== */}
      {isModalMasukOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#001438] border border-[#00296E]/20 dark:border-white/10 rounded-none shadow-none w-full max-w-xl max-h-[90vh] overflow-y-auto">
            {/* Header Modal */}
            <div className="p-4 border-b border-[#00296E]/20 dark:border-white/10 flex items-center justify-between bg-slate-50 dark:bg-[#001740]">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-widest text-slate-400">
                  Buku Agenda Masuk
                </p>
                <h3 className="text-base font-extrabold text-[#00296E] dark:text-white uppercase tracking-wider">
                  Catat Surat Masuk Baru
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalMasukOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitSuratMasuk}>
              <div className="p-5 space-y-4 text-xs">
                {/* Instansi Pengirim */}
                <div>
                  <label className="block font-bold uppercase tracking-wider font-mono text-slate-700 dark:text-slate-300 mb-1">
                    Instansi / Pihak Pengirim *
                  </label>
                  <input
                    type="text"
                    required
                    value={masukPengirim}
                    onChange={(e) => setMasukPengirim(e.target.value)}
                    placeholder="Contoh: Badan Eksekutif Mahasiswa (BEM) ISB Atma Luhur"
                    className="w-full px-3 py-2 rounded-none border border-[#00296E]/20 dark:border-white/10 bg-slate-50 dark:bg-[#001740] text-slate-800 dark:text-slate-100 text-xs focus:outline-none focus:border-[#00296E]"
                  />
                </div>

                {/* Nomor Asal Surat */}
                <div>
                  <label className="block font-bold uppercase tracking-wider font-mono text-slate-700 dark:text-slate-300 mb-1">
                    Nomor Surat Asal Dokumen *
                  </label>
                  <input
                    type="text"
                    required
                    value={masukNomorAsal}
                    onChange={(e) => setMasukNomorAsal(e.target.value)}
                    placeholder="Contoh: 045/BEM-ISBAL/E/X/2026"
                    className="w-full px-3 py-2 rounded-none border border-[#00296E]/20 dark:border-white/10 bg-slate-50 dark:bg-[#001740] text-slate-800 dark:text-slate-100 font-mono text-xs focus:outline-none focus:border-[#00296E]"
                  />
                </div>

                {/* Perihal */}
                <div>
                  <label className="block font-bold uppercase tracking-wider font-mono text-slate-700 dark:text-slate-300 mb-1">
                    Perihal Pokok Surat Masuk *
                  </label>
                  <input
                    type="text"
                    required
                    value={masukPerihal}
                    onChange={(e) => setMasukPerihal(e.target.value)}
                    placeholder="Contoh: Undangan Pembukaan Pekan Olahraga & Seni Mahasiswa"
                    className="w-full px-3 py-2 rounded-none border border-[#00296E]/20 dark:border-white/10 bg-slate-50 dark:bg-[#001740] text-slate-800 dark:text-slate-100 text-xs focus:outline-none focus:border-[#00296E]"
                  />
                </div>

                {/* Klasifikasi Kategori */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold uppercase tracking-wider font-mono text-slate-700 dark:text-slate-300 mb-1">
                      Kategori Surat
                    </label>
                    <select
                      value={masukKodeJenis}
                      onChange={(e) => setMasukKodeJenis(e.target.value as KodeJenisSurat)}
                      className="w-full px-3 py-2 rounded-none border border-[#00296E]/20 dark:border-white/10 bg-slate-50 dark:bg-[#001740] text-slate-800 dark:text-slate-100 font-mono text-xs focus:outline-none focus:border-[#00296E]"
                    >
                      {KLASIFIKASI_SURAT_LIST.map((k) => (
                        <option key={k.kode} value={k.kode}>
                          {k.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold uppercase tracking-wider font-mono text-slate-700 dark:text-slate-300 mb-1">
                      Status Disposisi Awal
                    </label>
                    <select
                      value={masukStatus}
                      onChange={(e) => setMasukStatus(e.target.value as StatusSuratMasuk)}
                      className="w-full px-3 py-2 rounded-none border border-[#00296E]/20 dark:border-white/10 bg-slate-50 dark:bg-[#001740] text-slate-800 dark:text-slate-100 font-mono text-xs focus:outline-none focus:border-[#00296E]"
                    >
                      <option value="belum_disposisi">Belum Disposisi</option>
                      <option value="didisposisi">Didisposisi</option>
                      <option value="selesai">Selesai</option>
                    </select>
                  </div>
                </div>

                {/* Tanggal Surat & Tanggal Diterima */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold uppercase tracking-wider font-mono text-slate-700 dark:text-slate-300 mb-1">
                      Tanggal Surat Asal
                    </label>
                    <input
                      type="date"
                      value={masukTanggalSurat}
                      onChange={(e) => setMasukTanggalSurat(e.target.value)}
                      className="w-full px-3 py-2 rounded-none border border-[#00296E]/20 dark:border-white/10 bg-slate-50 dark:bg-[#001740] text-slate-800 dark:text-slate-100 font-mono text-xs focus:outline-none focus:border-[#00296E]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold uppercase tracking-wider font-mono text-slate-700 dark:text-slate-300 mb-1">
                      Tanggal Diterima Fisik/Email
                    </label>
                    <input
                      type="date"
                      value={masukTanggalDiterima}
                      onChange={(e) => setMasukTanggalDiterima(e.target.value)}
                      className="w-full px-3 py-2 rounded-none border border-[#00296E]/20 dark:border-white/10 bg-slate-50 dark:bg-[#001740] text-slate-800 dark:text-slate-100 font-mono text-xs focus:outline-none focus:border-[#00296E]"
                    />
                  </div>
                </div>

                {/* Catatan Disposisi Awal */}
                <div>
                  <label className="block font-bold uppercase tracking-wider font-mono text-slate-700 dark:text-slate-300 mb-1">
                    Instruksi / Catatan Disposisi (Opsional)
                  </label>
                  <textarea
                    rows={2}
                    value={masukCatatan}
                    onChange={(e) => setMasukCatatan(e.target.value)}
                    placeholder="Contoh: Diteruskan ke Departemen Humas untuk koordinasi delegasi..."
                    className="w-full px-3 py-2 rounded-none border border-[#00296E]/20 dark:border-white/10 bg-slate-50 dark:bg-[#001740] text-slate-800 dark:text-slate-100 text-xs focus:outline-none focus:border-[#00296E]"
                  />
                </div>

                {/* Berkas PDF */}
                <div>
                  <label className="block font-bold uppercase tracking-wider font-mono text-slate-700 dark:text-slate-300 mb-1">
                    Unggah Berkas Pindaian / PDF Surat Masuk
                  </label>
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => setMasukFile(e.target.files?.[0] || null)}
                    className="w-full px-3 py-2 rounded-none border border-dashed border-[#00296E]/30 dark:border-white/20 bg-slate-50 dark:bg-[#001740] text-slate-600 dark:text-slate-300 font-mono text-xs file:mr-3 file:py-1 file:px-2 file:border-0 file:text-xs file:font-bold file:bg-[#00296E] file:text-white"
                  />
                  {masukFile && (
                    <p className="mt-1 text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
                      Berkas: {masukFile.name} ({(masukFile.size / 1024).toFixed(0)} KB)
                    </p>
                  )}
                </div>
              </div>

              {/* Footer Aksi */}
              <div className="p-4 border-t border-[#00296E]/20 dark:border-white/10 bg-slate-50 dark:bg-[#001740] flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalMasukOpen(false)}
                  className="px-4 py-2 rounded-none border border-slate-300 dark:border-white/20 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider text-xs"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={isSubmittingMasuk}
                  className="px-5 py-2 rounded-none bg-[#00296E] hover:bg-[#001f52] text-white font-bold uppercase tracking-wider text-xs flex items-center gap-1.5"
                >
                  <Tray className="w-3.5 h-3.5 text-[#0094E0]" />
                  <span>{isSubmittingMasuk ? "Menyimpan..." : "Simpan Surat Masuk"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* 8. MODAL 3: DETAIL LENGKAP & WORKFLOW NUMBER RECYCLING */}
      {/* =================================================================== */}
      {selectedSurat && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#001438] border border-[#00296E]/20 dark:border-white/10 rounded-none shadow-none w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="p-4 border-b border-[#00296E]/20 dark:border-white/10 flex items-center justify-between bg-slate-50 dark:bg-[#001740]">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-widest text-slate-400">
                  {selectedSurat.jenis_surat === "keluar"
                    ? "Arsip Surat Keluar HIMASI"
                    : "Arsip Surat Masuk Eksternal"}
                </p>
                <h3 className="text-base font-extrabold text-[#00296E] dark:text-white uppercase tracking-wider">
                  Rincian Dokumen Persuratan
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSurat(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-5 text-xs">
              {/* Box Nomor Surat & Tombol Salin */}
              <div className="p-4 bg-slate-50 dark:bg-[#001740] border border-[#00296E]/20 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 font-bold block">
                    {selectedSurat.jenis_surat === "keluar" ? "NOMOR RESMI ORGANISASI" : "NOMOR ASAL SURAT"}
                  </span>
                  <p className="text-sm sm:text-base font-mono font-extrabold text-[#00296E] dark:text-[#38BDF8]">
                    {selectedSurat.nomor_surat}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {selectedSurat.nomor_surat !== "—" && (
                    <button
                      type="button"
                      onClick={() => handleCopyNomor(selectedSurat.nomor_surat, selectedSurat.id)}
                      className="px-3 py-1.5 rounded-none border border-[#00296E]/20 dark:border-white/20 bg-white dark:bg-[#001438] hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 font-mono font-bold flex items-center gap-1.5"
                    >
                      {copiedId === selectedSurat.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Tersalin!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-[#0094E0]" />
                          <span>Salin Nomor</span>
                        </>
                      )}
                    </button>
                  )}

                  {/* Badge Status */}
                  <span
                    className={`px-3 py-1.5 rounded-none font-mono font-bold uppercase tracking-wider text-[11px] ${
                      selectedSurat.status === "terkirim" || selectedSurat.status === "selesai"
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                        : selectedSurat.status === "menunggu_ttd" || selectedSurat.status === "belum_disposisi"
                        ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                        : "bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {selectedSurat.status.replace("_", " ")}
                  </span>
                </div>
              </div>

              {/* Grid Metadata */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 font-bold block">
                    PERIHAL
                  </span>
                  <p className="font-bold text-slate-900 dark:text-white mt-0.5">
                    {selectedSurat.perihal}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 font-bold block">
                    KLASIFIKASI KATEGORI
                  </span>
                  <p className="font-mono text-slate-700 dark:text-slate-200 mt-0.5">
                    [{selectedSurat.kode_jenis}] {selectedSurat.kategori_label}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 font-bold block">
                    {selectedSurat.jenis_surat === "keluar" ? "PIHAK TUJUAN" : "INSTANSI PENGIRIM"}
                  </span>
                  <p className="text-slate-700 dark:text-slate-200 mt-0.5">
                    {selectedSurat.tujuan_pengirim}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 font-bold block">
                    TANGGAL SURAT
                  </span>
                  <p className="font-mono text-slate-700 dark:text-slate-200 mt-0.5">
                    {formatTanggalSurat(selectedSurat.tanggal_surat)}
                    {selectedSurat.tanggal_diterima && (
                      <span className="text-slate-400 text-[11px] block">
                        Diterima: {formatTanggalSurat(selectedSurat.tanggal_diterima)}
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* Dokumen Lampiran Berkas */}
              <div className="p-3.5 bg-slate-50 dark:bg-[#001740] border border-[#00296E]/20 dark:border-white/10">
                <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 font-bold block mb-2">
                  BERKAS LAMPIRAN DOKUMEN
                </span>

                {selectedSurat.file_url ? (
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-[#0094E0]" />
                      <div>
                        <p className="font-bold text-slate-800 dark:text-slate-200">
                          {selectedSurat.file_name || "Dokumen-Resmi.pdf"}
                        </p>
                        <p className="text-[10px] font-mono text-slate-400">
                          {selectedSurat.file_size || "Tersimpan di Cloud"}
                        </p>
                      </div>
                    </div>

                    <a
                      href={selectedSurat.file_url}
                      target="_blank"
                      rel="noreferrer"
                      download={selectedSurat.file_name || undefined}
                      className="px-3 py-1.5 rounded-none bg-[#00296E] hover:bg-[#001f52] text-white font-mono text-xs font-bold flex items-center gap-1.5"
                    >
                      <DownloadSimple className="w-3.5 h-3.5" />
                      <span>Unduh Dokumen</span>
                    </a>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-slate-500 italic">Belum ada berkas PDF yang dilampirkan.</p>
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        accept="application/pdf"
                        onChange={(e) => setDetailFileToUpload(e.target.files?.[0] || null)}
                        className="text-xs file:mr-2 file:py-1 file:px-2 file:border-0 file:bg-slate-200 dark:file:bg-white/10 file:font-mono file:text-xs"
                      />
                      {detailFileToUpload && (
                        <button
                          type="button"
                          disabled={isUploadingDetailFile}
                          onClick={handleUploadDetailFile}
                          className="px-3 py-1 rounded-none bg-[#00296E] text-white font-mono text-xs font-bold"
                        >
                          {isUploadingDetailFile ? "Mengunggah..." : "Unggah"}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Bagian Disposisi (Khusus Surat Masuk) */}
              {selectedSurat.jenis_surat === "masuk" && (
                <div className="p-4 bg-slate-50 dark:bg-[#001740] border border-[#00296E]/20 dark:border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 font-bold block">
                      LEMBAR DISPOSISI BPH
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      Status: {editDisposisiStatus}
                    </span>
                  </div>

                  {isBphOrAdmin ? (
                    <div className="space-y-2">
                      <textarea
                        rows={3}
                        value={editDisposisiNotes}
                        onChange={(e) => setEditDisposisiNotes(e.target.value)}
                        placeholder="Instruksi tindak lanjut disposisi (misal: Disposisi ke Divisi Sarpras)..."
                        className="w-full p-2.5 rounded-none border border-[#00296E]/20 dark:border-white/10 bg-white dark:bg-[#001438] text-slate-800 dark:text-slate-100 text-xs focus:outline-none focus:border-[#00296E]"
                      />
                      <div className="flex items-center justify-between gap-3">
                        <select
                          value={editDisposisiStatus}
                          onChange={(e) => setEditDisposisiStatus(e.target.value as StatusSuratMasuk)}
                          className="px-3 py-1.5 rounded-none border border-[#00296E]/20 dark:border-white/10 bg-white dark:bg-[#001438] text-xs font-mono"
                        >
                          <option value="belum_disposisi">Belum Disposisi</option>
                          <option value="didisposisi">Didisposisi</option>
                          <option value="selesai">Selesai</option>
                        </select>

                        <button
                          type="button"
                          disabled={isUpdatingDisposisi}
                          onClick={handleSaveDisposisi}
                          className="px-4 py-1.5 rounded-none bg-[#00296E] hover:bg-[#001f52] text-white font-mono font-bold text-xs"
                        >
                          {isUpdatingDisposisi ? "Menyimpan..." : "Perbarui Disposisi"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-slate-700 dark:text-slate-300">
                      {selectedSurat.catatan_disposisi || "Belum ada instruksi disposisi dari BPH."}
                    </p>
                  )}
                </div>
              )}

              {/* Workflow Actions BPH & Pengurus (Surat Keluar) */}
              {selectedSurat.jenis_surat === "keluar" && (
                <>
                  {/* Status Draf: Bisa diajukan oleh pembuat surat / pengurus untuk dialokasikan nomor resmi */}
                  {selectedSurat.status === "draft" && (
                    <div className="p-4 bg-blue-500/10 border border-blue-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <p className="text-[11px] text-slate-600 dark:text-slate-300">
                        Surat berstatus Draf. Ajukan sekarang untuk mengalokasikan nomor urut resmi berikutnya ({nextUrutPadded}).
                      </p>
                      <button
                        type="button"
                        disabled={isProcessingAction}
                        onClick={() => handlePromoteDraftToMenungguTtd(selectedSurat)}
                        className="px-4 py-2 rounded-none bg-[#00296E] hover:bg-[#001f52] text-white font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
                      >
                        <PaperPlaneTilt className="w-3.5 h-3.5 text-[#0094E0]" />
                        <span>Ajukan untuk TTD</span>
                      </button>
                    </div>
                  )}

                  {/* Wewenang BPH: Menyetujui TTD atau Menolak & Menarik kembali nomor ke antrean */}
                  {isBphOrAdmin && selectedSurat.status === "menunggu_ttd" && (
                    <div className="p-4 bg-amber-500/10 border border-amber-500/30 space-y-3">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-amber-500" />
                        <span className="text-[11px] font-mono font-extrabold uppercase tracking-wider text-amber-700 dark:text-amber-300">
                          Wewenang BPH / Pimpinan Organisasi
                        </span>
                      </div>
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-1">
                        <button
                          type="button"
                          disabled={isProcessingAction}
                          onClick={() => handleRevertToDraft(selectedSurat)}
                          className="px-3.5 py-2 rounded-none border border-red-500/30 hover:bg-red-500/10 text-red-600 dark:text-red-400 font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                          title="Tarik kembali nomor urut ke antrean tanpa nomor bolong"
                        >
                          <ArrowCounterClockwise className="w-3.5 h-3.5" />
                          <span>Tolak &amp; Tarik ke Draf (Recycle)</span>
                        </button>

                        <button
                          type="button"
                          disabled={isProcessingAction}
                          onClick={() => handleApproveTtd(selectedSurat)}
                          className="px-4 py-2 rounded-none bg-emerald-600 hover:bg-emerald-700 text-white font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Setujui &amp; Tandai Terkirim</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {isBphOrAdmin && selectedSurat.status === "terkirim" && (
                    <div className="p-4 bg-slate-500/10 border border-slate-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <p className="text-[11px] text-slate-600 dark:text-slate-300">
                        Surat telah terbit resmi. Jika dibatalkan, nomor akan didaur ulang kembali ke antrean.
                      </p>
                      <button
                        type="button"
                        disabled={isProcessingAction}
                        onClick={() => handleRevertToDraft(selectedSurat)}
                        className="px-3 py-1.5 rounded-none border border-slate-300 dark:border-white/10 hover:bg-red-500/10 hover:text-red-600 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider text-[11px] flex items-center justify-center gap-1 shrink-0 cursor-pointer"
                      >
                        <ArrowCounterClockwise className="w-3 h-3" />
                        <span>Batalkan &amp; Recycle Nomor</span>
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[#00296E]/20 dark:border-white/10 bg-slate-50 dark:bg-[#001740] flex items-center justify-between">
              {isBphOrAdmin ? (
                <button
                  type="button"
                  onClick={() => {
                    const toDel = selectedSurat;
                    setSelectedSurat(null);
                    setSuratToDelete(toDel);
                  }}
                  className="text-red-500 hover:text-red-600 font-bold uppercase tracking-wider text-xs flex items-center gap-1"
                >
                  <Trash className="w-3.5 h-3.5" />
                  <span>Hapus Arsip</span>
                </button>
              ) : (
                <div />
              )}

              <button
                type="button"
                onClick={() => setSelectedSurat(null)}
                className="px-4 py-2 rounded-none bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-200 font-bold uppercase tracking-wider text-xs"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* 9. MODAL 4: KONFIRMASI HAPUS ARSIP */}
      {/* =================================================================== */}
      {suratToDelete && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#001438] border border-red-500/30 rounded-none shadow-none w-full max-w-md p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500/10 text-red-500">
                <WarningCircle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-extrabold text-slate-900 dark:text-white uppercase tracking-wider text-sm">
                  Konfirmasi Hapus Arsip Surat
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                  {suratToDelete.nomor_surat !== "—" ? suratToDelete.nomor_surat : "Dokumen Draf"}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              Apakah Anda yakin ingin menghapus arsip &quot;<strong>{suratToDelete.perihal}</strong>&quot;? Tindakan ini bersifat permanen dan tidak dapat dibatalkan.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#00296E]/20 dark:border-white/10">
              <button
                type="button"
                onClick={() => setSuratToDelete(null)}
                className="px-4 py-2 rounded-none border border-slate-300 dark:border-white/20 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider text-xs"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isProcessingAction}
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-none bg-red-600 hover:bg-red-700 text-white font-bold uppercase tracking-wider text-xs"
              >
                {isProcessingAction ? "Menghapus..." : "Hapus Permanen"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* 10. TOAST NOTIFICATION (SWISS FLOATING) */}
      {/* =================================================================== */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#001740] text-white border border-[#38BDF8]/40 px-4 py-3 rounded-none shadow-none flex items-center gap-3 font-mono text-xs max-w-md animate-in fade-in slide-in-from-bottom-2">
          <Info className="w-4 h-4 text-[#38BDF8] shrink-0" />
          <span>{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white ml-auto"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

export { PersuratanManager };
