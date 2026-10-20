"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
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
  ChevronRight,
  TrendingUp,
  FileCode,
  Copy,
  Check,
  Menu,
  X,
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
  ListFilter,
  Eye,
  Table as TableIcon
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { DAFTAR_PENGURUS_HIMASI, type PengurusMember } from "@/lib/data/pengurus";
import AdminQrScanner, { type AbsensiRecord } from "@/components/absensi/admin-qr-scanner";
import PengurusQrCard from "@/components/absensi/pengurus-qr-card";
import RekapAbsensiView, {
  type KegiatanItem,
  formatTanggalIndo,
} from "@/components/absensi/rekap-absensi-view";

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
    "overview" | "absensi" | "rekap-absensi" | "kartu-qr" | "aspirasi" | "berita" | "kalender" | "database"
  >("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  // Modal Konfirmasi Hapus Kegiatan & Kelola Kegiatan
  const [kegiatanToDelete, setKegiatanToDelete] = useState<KegiatanItem | null>(null);
  const [isKelolaKegiatanModalOpen, setIsKelolaKegiatanModalOpen] = useState(false);
  const [deletingKegiatan, setDeletingKegiatan] = useState(false);
  const [searchKegiatanOverview, setSearchKegiatanOverview] = useState("");
  const [searchKegiatanModal, setSearchKegiatanModal] = useState("");

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

  // Filter Kegiatan untuk Modal Kelola Kegiatan
  const filteredKegiatanModal = useMemo(() => {
    if (!searchKegiatanModal.trim()) return kegiatanList;
    const q = searchKegiatanModal.toLowerCase();
    return kegiatanList.filter(
      (k) =>
        k.nama.toLowerCase().includes(q) ||
        k.tanggal.includes(q) ||
        k.jam.toLowerCase().includes(q)
    );
  }, [kegiatanList, searchKegiatanModal]);

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

  // Kartu QR Modal / Detail State
  const [selectedPengurusCard, setSelectedPengurusCard] = useState<PengurusMember | null>(null);
  const [divisiFilterCard, setDivisiFilterCard] = useState<string>("SEMUA");
  const [searchPengurus, setSearchPengurus] = useState("");

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
          setUser({
            email: session.user.email,
            id: session.user.id,
            full_name:
              session.user.user_metadata?.full_name ||
              session.user.email?.split("@")[0] ||
              "Pengurus HIMASI",
          });
        } else {
          setUser(null);
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
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          email: session.user.email,
          id: session.user.id,
          full_name:
            session.user.user_metadata?.full_name ||
            session.user.email?.split("@")[0] ||
            "Pengurus HIMASI",
        });
      } else {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

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

  // 3. Ambil Kegiatan Absensi dari Supabase Cloud (dengan sinkronisasi Realtime & Fallback)
  const fetchKegiatan = useCallback(async () => {
    setLoadingKegiatan(true);
    let loaded: KegiatanItem[] = [];
    let isDbSuccess = false;

    try {
      const { data, error } = await supabase
        .from("kegiatan_absensi")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data) {
        isDbSuccess = true;
        loaded = data.map((row) => ({
          id: row.id,
          nama: row.nama_kegiatan,
          tanggal: row.tanggal,
          jam: row.jam || row.keterangan || "09:00 WIB",
        }));
      }
    } catch (err) {
      console.warn("Koneksi Supabase kegiatan_absensi:", err);
    }

    // Jika di Supabase belum ada agenda tapi di localStorage ada data sebelumnya,
    // kita migrasikan otomatis ke Supabase agar tersimpan ke cloud!
    if (isDbSuccess && loaded.length === 0 && typeof window !== "undefined") {
      const saved = localStorage.getItem("himasi_kegiatan_list");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const rowsToInsert = parsed.map((k) => ({
              nama_kegiatan: k.nama,
              tanggal: k.tanggal,
              jam: k.jam,
              keterangan: k.jam,
            }));
            const { data: migratedData, error: migError } = await supabase
              .from("kegiatan_absensi")
              .insert(rowsToInsert)
              .select();

            if (!migError && migratedData && migratedData.length > 0) {
              loaded = migratedData.map((row) => ({
                id: row.id,
                nama: row.nama_kegiatan,
                tanggal: row.tanggal,
                jam: row.jam || row.keterangan || "09:00 WIB",
              }));
              showToast("Data kegiatan lokal berhasil disinkronkan ke Supabase Cloud!");
            }
          }
        } catch (e) {
          console.warn("Gagal migrasi kegiatan ke DB:", e);
        }
      }
    } else if (!isDbSuccess && typeof window !== "undefined") {
      // Fallback cadangan hanya jika koneksi Supabase terputus
      const saved = localStorage.getItem("himasi_kegiatan_list");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            loaded = parsed;
          }
        } catch (e) {
          console.warn("Gagal parse cache kegiatan:", e);
        }
      }
    }

    setKegiatanList(loaded);
    if (typeof window !== "undefined" && isDbSuccess) {
      localStorage.setItem("himasi_kegiatan_list", JSON.stringify(loaded));
    }

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

  // 4. Ambil Log Absensi dari Supabase Cloud (dengan sinkronisasi Realtime & Fallback)
  const fetchAbsensiLogs = useCallback(async () => {
    let logs: AbsensiRecord[] = [];
    let isDbSuccess = false;

    try {
      const { data, error } = await supabase
        .from("absensi_log")
        .select("*")
        .order("waktu_scan", { ascending: false });

      if (!error && data) {
        isDbSuccess = true;
        logs = data.map((row) => {
          const pengurus = DAFTAR_PENGURUS_HIMASI.find(
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

    if (isDbSuccess && logs.length === 0 && typeof window !== "undefined") {
      const saved = localStorage.getItem("himasi_absensi_logs");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const rowsToInsert = parsed.map((l) => ({
              nama_pengurus: l.nama,
              nim: l.nim,
              divisi: l.divisi,
              nama_kegiatan: l.kegiatan,
              status: l.status,
              waktu_scan: new Date().toISOString(),
            }));
            const { data: migratedLogs, error: migError } = await supabase
              .from("absensi_log")
              .insert(rowsToInsert)
              .select();

            if (!migError && migratedLogs && migratedLogs.length > 0) {
              logs = migratedLogs.map((row) => ({
                id: row.id,
                pengurusId: `pengurus-${row.nim}`,
                nama: row.nama_pengurus,
                nim: row.nim,
                divisi: row.divisi,
                jabatan: "Pengurus HIMASI",
                image: "/DSC01203.png",
                kegiatan: row.nama_kegiatan,
                waktu: new Date(row.waktu_scan).toLocaleTimeString("id-ID", {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                }),
                status: (row.status as AbsensiRecord["status"]) || "Hadir",
              }));
            }
          }
        } catch (e) {
          console.warn("Gagal migrasi absensi log:", e);
        }
      }
    } else if (!isDbSuccess && typeof window !== "undefined") {
      const saved = localStorage.getItem("himasi_absensi_logs");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            logs = parsed;
          }
        } catch (e) {
          console.warn("Gagal parse cache absensi:", e);
        }
      }
    }

    setAbsensiLogs(logs);
    if (typeof window !== "undefined" && isDbSuccess) {
      localStorage.setItem("himasi_absensi_logs", JSON.stringify(logs));
    }
  }, []);

  // Realtime Subscription Supabase (Multi-Device Auto-Sync)
  useEffect(() => {
    fetchKegiatan();
    fetchAbsensiLogs();

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
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchKegiatan, fetchAbsensiLogs, fetchAspirasi]);

  // 5. Handler saat scan absensi berhasil
  const handleAttendanceSuccess = (record: AbsensiRecord) => {
    setAbsensiLogs((prev) => {
      const updated = [record, ...prev];
      if (typeof window !== "undefined") {
        localStorage.setItem("himasi_absensi_logs", JSON.stringify(updated));
      }
      return updated;
    });
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
      const updated = [newKegiatan, ...prev.filter((k) => k.id !== generatedId)];
      if (typeof window !== "undefined") {
        localStorage.setItem("himasi_kegiatan_list", JSON.stringify(updated));
      }
      return updated;
    });
    setActiveKegiatan(newKegiatan);

    setFormNamaKegiatan("");
    setFormTanggalKegiatan(new Date().toISOString().split("T")[0]);
    setFormJamKegiatan("09:00 WIB");
    setIsTambahKegiatanModalOpen(false);

    if (isDbSaved) {
      showToast(`Kegiatan "${namaTrim}" berhasil disimpan ke Database Cloud Supabase!`);
    } else {
      showToast(`Kegiatan "${namaTrim}" tersimpan di cache lokal.`);
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

    // 1. Update kegiatanList & localStorage secara sinkron
    const updatedList = kegiatanList.filter((k) => k.id !== targetId);
    setKegiatanList(updatedList);
    if (typeof window !== "undefined") {
      localStorage.setItem("himasi_kegiatan_list", JSON.stringify(updatedList));
    }

    // 2. Update absensiLogs & localStorage secara sinkron
    const updatedLogs = absensiLogs.filter(
      (l) => l.kegiatan.trim().toLowerCase() !== targetNamaLower
    );
    setAbsensiLogs(updatedLogs);
    if (typeof window !== "undefined") {
      localStorage.setItem("himasi_absensi_logs", JSON.stringify(updatedLogs));
    }

    // 3. Update activeKegiatan jika kegiatan yang dihapus sedang aktif
    if (activeKegiatan?.id === targetId) {
      setActiveKegiatan(updatedList.length > 0 ? updatedList[0] : null);
    }

    // Tutup modal kelola kegiatan jika daftar kegiatan sudah kosong
    if (updatedList.length === 0) {
      setIsKelolaKegiatanModalOpen(false);
    }

    // 4. Hapus dari Supabase jika tabel sudah dibuat
    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetId);
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
    if (typeof window !== "undefined") {
      localStorage.setItem("himasi_absensi_logs", JSON.stringify(updatedLogs));
    }

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
    if (typeof window !== "undefined") {
      localStorage.setItem("himasi_absensi_logs", JSON.stringify(updatedLogs));
    }

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

  // 7. Logout Pengurus
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.push("/login");
    } catch (err) {
      console.error("Gagal logout:", err);
    }
  };

  // 8. Copy SQL Script
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

-- 5. HAK AKSES API & IZIN PERANGKAT (GRANT & RLS)
GRANT ALL ON TABLE public.kegiatan_absensi TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.absensi_log TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.aspirasi TO anon, authenticated, service_role;

ALTER TABLE public.kegiatan_absensi DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.absensi_log DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.aspirasi DISABLE ROW LEVEL SECURITY;

-- 7. REFRESH SCHEMA CACHE & REALTIME PUBLICATION
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.kegiatan_absensi, public.absensi_log, public.aspirasi;
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

  // Filter Pengurus untuk Kartu QR
  const filteredPengurusCards = DAFTAR_PENGURUS_HIMASI.filter((p) => {
    const matchDivisi =
      divisiFilterCard === "SEMUA" || p.divisi === divisiFilterCard;
    const matchSearch =
      p.nama.toLowerCase().includes(searchPengurus.toLowerCase()) ||
      p.nim.includes(searchPengurus) ||
      p.jabatan.toLowerCase().includes(searchPengurus.toLowerCase());
    return matchDivisi && matchSearch;
  });

  // Metrik Statistik
  const countBaru = aspirasiList.filter((a) => a.status === "baru").length;
  const currentLogs = activeKegiatan
    ? absensiLogs.filter(
        (l) => l.kegiatan.trim().toLowerCase() === activeKegiatan.nama.trim().toLowerCase()
      )
    : [];
  const totalHadir = currentLogs.filter((l) => l.status === "Hadir").length;
  const totalTerlambat = currentLogs.filter((l) => l.status === "Terlambat").length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      
      {/* Top Banner jika belum login (Mode Tamu / Demo) */}
      {!authLoading && !user && (
        <div className="no-print bg-gradient-to-r from-amber-500 to-amber-600 text-white text-xs px-4 py-2 flex items-center justify-between sticky top-0 z-50 shadow-sm">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span className="font-medium">
              Anda sedang melihat <strong>Dashboard Mode Tamu (Pratinjau)</strong>. Masuk dengan akun pengurus Supabase untuk mengelola data nyata.
            </span>
          </div>
          <Link
            href="/login"
            className="px-3 py-1 rounded-md bg-white text-amber-800 font-bold hover:bg-amber-50 transition-colors shrink-0 text-xs shadow-xs"
          >
            Masuk Pengurus
          </Link>
        </div>
      )}

      {/* Main App Layout */}
      <div className="flex flex-1 relative overflow-hidden">
        
        {/* Sidebar Navigasi Dashboard (Disebut no-print agar tidak muncul di cetak PDF) */}
        <aside
          className={`no-print fixed inset-y-0 left-0 z-40 w-64 bg-[#00173d] text-white flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {/* Header Sidebar: Brand HIMASI */}
          <div>
            <div className="p-5 border-b border-white/10 flex items-center justify-between">
              <Link href="/" className="flex items-center gap-3 group">
                <div className="w-10 h-10 rounded-xl bg-white p-1 shadow-sm flex items-center justify-center">
                  <img
                    src="/logo-himasi.png"
                    alt="Logo HIMASI"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <h2 className="font-extrabold text-sm text-white tracking-tight leading-none">
                    HIMASI ISB
                  </h2>
                  <span className="text-[10px] text-sky-400 font-medium">
                    Kabinet REKSABUDAYA
                  </span>
                </div>
              </Link>

              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* User Profile Card */}
            <div className="p-4 mx-3 my-4 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-[#0094E0] to-blue-500 text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-sm">
                {user ? user.full_name?.charAt(0).toUpperCase() : "P"}
              </div>
              <div className="overflow-hidden flex-1">
                <p className="text-xs font-bold text-white truncate">
                  {user ? user.full_name : "Pengurus Tamu"}
                </p>
                <p className="text-[10px] text-slate-400 truncate">
                  {user ? user.email : "guest@himasi.internal"}
                </p>
              </div>
            </div>

            {/* Menu Navigasi */}
            <nav className="px-3 space-y-1">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("overview");
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === "overview"
                    ? "bg-[#00296E] text-white shadow-sm border border-sky-400/30 font-bold"
                    : "text-slate-300 hover:text-white hover:bg-white/5"
                }`}
              >
                <div className="flex items-center gap-3">
                  <LayoutDashboard className="w-4 h-4 text-sky-400" />
                  <span>Ringkasan Dashboard</span>
                </div>
              </button>

              {/* MENU 1: SCAN ABSENSI QR */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab("absensi");
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === "absensi"
                    ? "bg-[#00296E] text-white shadow-sm border border-emerald-400/50 font-bold"
                    : "text-slate-300 hover:text-white hover:bg-white/5"
                }`}
              >
                <div className="flex items-center gap-3">
                  <ScanLine className="w-4 h-4 text-emerald-400" />
                  <span>Scan Absensi QR</span>
                </div>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-emerald-500 text-white uppercase tracking-wider">
                  Kamera
                </span>
              </button>

              {/* MENU BARU 2: REKAP ABSENSI (KOP SURAT & CETAK PDF) */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab("rekap-absensi");
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === "rekap-absensi"
                    ? "bg-[#00296E] text-white shadow-sm border border-sky-400/50 font-bold"
                    : "text-slate-300 hover:text-white hover:bg-white/5"
                }`}
              >
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="w-4 h-4 text-sky-300" />
                  <span>Rekap Absensi (PDF)</span>
                </div>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-sky-500 text-white uppercase tracking-wider">
                  Cetak
                </span>
              </button>

              {/* MENU 3: KARTU QR PENGURUS */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab("kartu-qr");
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === "kartu-qr"
                    ? "bg-[#00296E] text-white shadow-sm border border-sky-400/30 font-bold"
                    : "text-slate-300 hover:text-white hover:bg-white/5"
                }`}
              >
                <div className="flex items-center gap-3">
                  <IdCard className="w-4 h-4 text-sky-400" />
                  <span>Kartu QR Pengurus</span>
                </div>
              </button>

              {/* MENU 4: ASPIRASI MAHASISWA */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab("aspirasi");
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === "aspirasi"
                    ? "bg-[#00296E] text-white shadow-sm border border-sky-400/30 font-bold"
                    : "text-slate-300 hover:text-white hover:bg-white/5"
                }`}
              >
                <div className="flex items-center gap-3">
                  <MessageSquare className="w-4 h-4 text-blue-400" />
                  <span>Aspirasi Mahasiswa</span>
                </div>
                {countBaru > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white">
                    {countBaru} Baru
                  </span>
                )}
              </button>

              {/* MENU 5: BERITA */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab("berita");
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === "berita"
                    ? "bg-[#00296E] text-white shadow-sm border border-sky-400/30 font-bold"
                    : "text-slate-300 hover:text-white hover:bg-white/5"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Newspaper className="w-4 h-4 text-indigo-400" />
                  <span>Kelola Berita / Warta</span>
                </div>
              </button>

              {/* MENU 6: KALENDER */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab("kalender");
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === "kalender"
                    ? "bg-[#00296E] text-white shadow-sm border border-sky-400/30 font-bold"
                    : "text-slate-300 hover:text-white hover:bg-white/5"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-purple-400" />
                  <span>Agenda & Kalender</span>
                </div>
              </button>

              {/* MENU 7: SUPABASE DATABASE HUB */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab("database");
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === "database"
                    ? "bg-[#00296E] text-white shadow-sm border border-sky-400/30 font-bold"
                    : "text-slate-300 hover:text-white hover:bg-white/5"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Database className="w-4 h-4 text-amber-400" />
                  <span>Supabase Database Hub</span>
                </div>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </button>
            </nav>
          </div>

          {/* Footer Sidebar */}
          <div className="p-4 border-t border-white/10 space-y-2">
            <Link
              href="/"
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
            >
              <ExternalLink className="w-4 h-4 text-sky-400" />
              <span>Lihat Website HIMASI</span>
            </Link>

            {user ? (
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-rose-300 hover:text-rose-100 hover:bg-rose-950/40 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Keluar (Logout)</span>
              </button>
            ) : (
              <Link
                href="/login"
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-bold text-white bg-[#00296E] hover:bg-[#001f54] transition-colors"
              >
                <User className="w-4 h-4" />
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
        <main className="flex-1 flex flex-col min-w-0 overflow-y-auto max-h-screen">
          
          {/* Topbar Dashboard */}
          <header className="no-print bg-white border-b border-slate-200 px-4 sm:px-6 py-3.5 flex items-center justify-between sticky top-0 z-20">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
                aria-label="Buka Menu"
              >
                <Menu className="w-5 h-5" />
              </button>

              <div>
                <h1 className="text-base sm:text-lg font-bold text-[#00296E] flex items-center gap-2">
                  <span>Portal Pengurus HIMASI</span>
                  <span className="hidden sm:inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-50 text-[#00296E] border border-sky-200">
                    Sistem Presensi & Rekap PDF
                  </span>
                </h1>
                <p className="text-[11px] text-slate-400 hidden sm:block">
                  Sistem Informasi Manajemen Terpadu Kabinet REKSABUDAYA
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={fetchAspirasi}
                disabled={loadingAspirasi}
                title="Muat Ulang Data"
                className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:text-[#00296E] hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <RefreshCw
                  className={`w-4 h-4 ${loadingAspirasi ? "animate-spin text-[#0094E0]" : ""}`}
                />
              </button>

              <div className="h-4 w-px bg-slate-200 hidden sm:block" />

              <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Supabase: Online</span>
              </div>
            </div>
          </header>

          {/* Body Konten Sesuai Tab Terpilih */}
          <div className="p-4 sm:p-6 lg:p-8 space-y-6">

            {/* TAB 1: OVERVIEW / RINGKASAN */}
            {activeTab === "overview" && (
              <div className="space-y-6 animate-in fade-in duration-200">
                
                {/* Greeting Banner */}
                <div className="p-6 sm:p-8 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-[#00296E] via-[#002257] to-[#00173d] text-white relative overflow-hidden shadow-sm">
                  <div className="absolute top-0 right-0 w-80 h-80 bg-[#0094E0]/20 rounded-full blur-3xl pointer-events-none -mr-10 -mt-10" />
                  <div className="relative z-10 max-w-2xl">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-white/10 text-sky-300 border border-white/15 mb-3">
                      <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                      Sistem Absensi QR Code & Rekapitulasi PDF
                    </span>
                    <h2 className="text-xl sm:text-3xl font-extrabold text-white tracking-tight">
                      Selamat Datang, {user ? user.full_name : "Pengurus HIMASI"}!
                    </h2>
                    <p className="mt-2 text-xs sm:text-sm text-slate-200 leading-relaxed font-normal">
                      Pindai QR Code kehadiran anggota pengurus kabinet secara cepat, buat rekapitulasi kehadiran resmi ber-kop surat HIMASI, dan cetak langsung ke format PDF.
                    </p>

                    <div className="mt-5 flex flex-wrap gap-2.5">
                      <button
                        type="button"
                        onClick={() => setActiveTab("absensi")}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                      >
                        <ScanLine className="w-3.5 h-3.5" />
                        <span>Mulai Scan Absensi QR</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveTab("rekap-absensi")}
                        className="px-4 py-2 rounded-xl bg-[#0094E0] hover:bg-[#0081c2] text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                        <span>Buka Rekap Absensi (PDF)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveTab("kartu-qr")}
                        className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all border border-white/20 flex items-center gap-1.5 cursor-pointer"
                      >
                        <IdCard className="w-3.5 h-3.5 text-sky-300" />
                        <span>Lihat Kartu QR Pengurus</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* 4 Kartu KPI Metrik */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* KPI 1: Absensi Pengurus Hari Ini */}
                  <div
                    onClick={() => setActiveTab("absensi")}
                    className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between cursor-pointer hover:border-emerald-300 hover:shadow-md transition-all"
                  >
                    <div>
                      <span className="text-xs font-medium text-slate-500">Kehadiran Hari Ini</span>
                      <h3 className="text-2xl font-black text-[#00296E] mt-1">
                        {currentLogs.length} Pengurus
                      </h3>
                      <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-semibold mt-1">
                        <UserCheck className="w-3 h-3" />
                        <span>{totalHadir} Hadir Tepat Waktu</span>
                      </div>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                      <ScanLine className="w-6 h-6" />
                    </div>
                  </div>

                  {/* KPI 2: Rekap PDF Dokumen */}
                  <div
                    onClick={() => setActiveTab("rekap-absensi")}
                    className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between cursor-pointer hover:border-sky-300 hover:shadow-md transition-all"
                  >
                    <div>
                      <span className="text-xs font-medium text-slate-500">Rekap Kegiatan</span>
                      <h3 className="text-2xl font-black text-[#00296E] mt-1">
                        {kegiatanList.length} Kegiatan
                      </h3>
                      <div className="flex items-center gap-1 text-[11px] text-sky-600 font-semibold mt-1">
                        <Printer className="w-3 h-3" />
                        <span>Cetak Kop Surat Resmi</span>
                      </div>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-sky-50 text-[#0094E0] flex items-center justify-center shrink-0">
                      <FileSpreadsheet className="w-6 h-6" />
                    </div>
                  </div>

                  {/* KPI 3: Kartu QR Pengurus */}
                  <div
                    onClick={() => setActiveTab("kartu-qr")}
                    className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between cursor-pointer hover:border-indigo-300 hover:shadow-md transition-all"
                  >
                    <div>
                      <span className="text-xs font-medium text-slate-500">Total Pengurus</span>
                      <h3 className="text-2xl font-black text-[#00296E] mt-1">
                        {DAFTAR_PENGURUS_HIMASI.length} Anggota
                      </h3>
                      <div className="flex items-center gap-1 text-[11px] text-indigo-600 font-semibold mt-1">
                        <QrCode className="w-3 h-3" />
                        <span>QR Code Masing-Masing</span>
                      </div>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                      <Users className="w-6 h-6" />
                    </div>
                  </div>

                  {/* KPI 4: Aspirasi Mahasiswa */}
                  <div
                    onClick={() => setActiveTab("aspirasi")}
                    className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between cursor-pointer hover:border-amber-300 hover:shadow-md transition-all"
                  >
                    <div>
                      <span className="text-xs font-medium text-slate-500">Total Aspirasi</span>
                      <h3 className="text-2xl font-black text-[#00296E] mt-1">
                        {aspirasiList.length}
                      </h3>
                      <div className="flex items-center gap-1 text-[11px] text-amber-600 font-semibold mt-1">
                        <Clock className="w-3 h-3" />
                        <span>{countBaru} Belum Diproses</span>
                      </div>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                      <MessageSquare className="w-6 h-6" />
                    </div>
                  </div>
                </div>

                {/* Akses Cepat Rekap dan Kartu */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-bold text-sm text-[#00296E]">Rekap Absensi Resmi (Format Kop Surat)</h3>
                        <span className="text-xs font-bold text-sky-600 bg-sky-50 px-2.5 py-0.5 rounded-full">
                          PDF Ready
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Cetak daftar hadir kegiatan Kabinet REKSABUDAYA dalam format dokumen resmi kampus lengkap dengan kop surat resmi HIMASI ISB Atma Luhur dan rincian kehadiran pengurus.
                      </p>

                      <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
                        {activeKegiatan ? (
                          <div>
                            <p className="font-bold text-slate-800">Kegiatan Aktif: {activeKegiatan.nama}</p>
                            <p className="text-[11px] text-slate-500">{formatTanggalIndo(activeKegiatan.tanggal)} • {activeKegiatan.jam}</p>
                          </div>
                        ) : (
                          <div>
                            <p className="font-bold text-slate-800">Belum Ada Kegiatan Aktif</p>
                            <p className="text-[11px] text-slate-500">Klik tombol untuk menambahkan kegiatan pertama</p>
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            if (activeKegiatan) {
                              setActiveTab("rekap-absensi");
                            } else {
                              setIsTambahKegiatanModalOpen(true);
                            }
                          }}
                          className="px-3 py-1.5 rounded-lg bg-[#00296E] hover:bg-[#001f54] text-white text-xs font-bold transition-all cursor-pointer"
                        >
                          {activeKegiatan ? "Lihat Rekap" : "+ Tambah Kegiatan"}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-bold text-sm text-[#00296E]">Kartu QR Pengurus</h3>
                        <span className="text-[11px] font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-full">
                          Digital ID
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Lihat dan unduh ID Card digital dengan QR Code masing-masing pengurus.
                      </p>

                      <div className="mt-4 grid grid-cols-2 gap-2">
                        {DAFTAR_PENGURUS_HIMASI.slice(0, 4).map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => {
                              setSelectedPengurusCard(p);
                              setActiveTab("kartu-qr");
                            }}
                            className="p-2.5 rounded-xl border border-slate-100 hover:border-sky-300 hover:bg-sky-50/50 text-left transition-all cursor-pointer flex items-center gap-2"
                          >
                            <QrCode className="w-4 h-4 text-[#00296E] shrink-0" />
                            <div className="overflow-hidden">
                              <p className="text-xs font-bold text-slate-800 truncate">{p.nama.split(" ")[0]}</p>
                              <p className="text-[10px] text-slate-400 truncate">{p.divisi}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setActiveTab("kartu-qr")}
                      className="mt-4 w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#00296E] font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <IdCard className="w-4 h-4 text-sky-600" />
                      <span>Lihat Semua Kartu Pengurus ({DAFTAR_PENGURUS_HIMASI.length})</span>
                    </button>
                  </div>
                </div>

                {/* TABEL AGENDA KEGIATAN MULTI-DEVICE (BISA DILIHAT DI HP, TABLET, PC) */}
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                  <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-sky-50 text-[#00296E] flex items-center justify-center border border-sky-100 shrink-0">
                        <Calendar className="w-5 h-5 text-[#0094E0]" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-extrabold text-sm sm:text-base text-[#00296E]">
                            Tabel Agenda & Rekap Kegiatan ({kegiatanList.length})
                          </h3>
                          <span className="hidden sm:inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Multi-Device Ready
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Tabel responsif yang dapat dipantau dari berbagai perangkat (PC desktop, laptop, tablet, hingga smartphone).
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
                                    {logCount} / {DAFTAR_PENGURUS_HIMASI.length} Hadir
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
                                {logCount} / {DAFTAR_PENGURUS_HIMASI.length} Hadir
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

            {/* TAB 2: FITUR UTAMA - SCAN ABSENSI QR (FOKUS KAMERA, TANPA GAMBAR 2) */}
            {activeTab === "absensi" && (
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* Header Pemilihan Kegiatan & Tombol Tambah Kegiatan */}
                <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 inline-block mb-1.5">
                      Portal Pemindai Kamera
                    </span>
                    <h2 className="text-lg sm:text-2xl font-extrabold text-[#00296E]">
                      Scan QR Code Absensi Pengurus
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Arahkan kamera ke QR Code pengurus untuk verifikasi dan pencatatan presensi real-time.
                    </p>
                  </div>

                  {/* Tombol Tambah Kegiatan & Selector */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    {/* Selector Kegiatan */}
                    {kegiatanList.length > 0 && activeKegiatan && (
                      <div className="relative">
                        <select
                          value={activeKegiatan.id}
                          onChange={(e) => {
                            const found = kegiatanList.find((k) => k.id === e.target.value);
                            if (found) setActiveKegiatan(found);
                          }}
                          className="pl-3 pr-8 py-2.5 text-xs font-bold text-[#00296E] bg-slate-100 hover:bg-slate-200 rounded-xl border border-slate-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#00296E]"
                        >
                          {kegiatanList.map((kegiatan) => (
                            <option key={kegiatan.id} value={kegiatan.id}>
                              {kegiatan.nama} ({kegiatan.jam})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Tombol Kelola Semua Kegiatan */}
                    {kegiatanList.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setIsKelolaKegiatanModalOpen(true)}
                        className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
                        title="Kelola semua daftar agenda kegiatan"
                      >
                        <ListFilter className="w-4 h-4 text-[#0094E0]" />
                        <span className="hidden sm:inline">Daftar Kegiatan ({kegiatanList.length})</span>
                      </button>
                    )}

                    {/* Tombol Tambah Kegiatan Baru */}
                    <button
                      type="button"
                      onClick={() => setIsTambahKegiatanModalOpen(true)}
                      className="px-4 py-2.5 rounded-xl bg-[#00296E] hover:bg-[#001f54] text-white text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer active:scale-95"
                    >
                      <Plus className="w-4 h-4 text-sky-300" />
                      <span>Tambah Kegiatan</span>
                    </button>

                    {/* Tombol Hapus Kegiatan Terpilih */}
                    {activeKegiatan && (
                      <button
                        type="button"
                        onClick={() => handleRequestDeleteKegiatan(activeKegiatan.id)}
                        className="px-3.5 py-2.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
                        title={`Hapus kegiatan "${activeKegiatan.nama}"`}
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="hidden sm:inline">Hapus Kegiatan</span>
                      </button>
                    )}
                  </div>
                </div>

                {!activeKegiatan || kegiatanList.length === 0 ? (
                  <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 text-center max-w-xl mx-auto shadow-xs">
                    <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4 border border-emerald-100 shadow-2xs">
                      <ScanLine className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-black text-[#00296E]">Belum Ada Kegiatan Absensi Aktif</h3>
                    <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                      Untuk memulai pemindaian QR absensi pengurus, admin perlu membuat agenda kegiatan terlebih dahulu. Data tersimpan dinamis di database.
                    </p>
                    <button
                      type="button"
                      onClick={() => setIsTambahKegiatanModalOpen(true)}
                      className="mt-6 px-5 py-2.5 rounded-xl bg-[#00296E] hover:bg-[#001f54] text-white text-xs font-bold transition-all shadow-md inline-flex items-center gap-2 cursor-pointer active:scale-95"
                    >
                      <Plus className="w-4 h-4 text-sky-300" />
                      <span>Tambah Kegiatan Baru</span>
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Banner Rincian Kegiatan Aktif */}
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-sky-100 text-[#00296E] flex items-center justify-center shrink-0">
                          <Calendar className="w-5 h-5 text-[#0094E0]" />
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                            Kegiatan Sedang Dipindai:
                          </span>
                          <h4 className="font-extrabold text-sm text-[#00296E]">
                            {activeKegiatan.nama}
                          </h4>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 font-semibold text-slate-700">
                        <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
                          <Calendar className="w-3.5 h-3.5 text-[#0094E0]" />
                          <span>{formatTanggalIndo(activeKegiatan.tanggal)}</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
                          <Clock className="w-3.5 h-3.5 text-amber-500" />
                          <span>{activeKegiatan.jam}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteKegiatan(activeKegiatan.id)}
                          className="flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 px-3 py-1.5 rounded-xl border border-rose-200 shadow-2xs transition-colors cursor-pointer active:scale-95 text-xs font-bold"
                          title={`Hapus kegiatan "${activeKegiatan.nama}"`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Hapus Kegiatan</span>
                        </button>
                      </div>
                    </div>

                    {/* Komponen Kamera Scanner */}
                    <AdminQrScanner
                      kegiatanAktif={activeKegiatan.nama}
                      kegiatanTanggal={formatTanggalIndo(activeKegiatan.tanggal)}
                      kegiatanJam={activeKegiatan.jam}
                      onAttendanceSuccess={handleAttendanceSuccess}
                    />
                  </>
                )}

                {/* Banner Akses Cepat ke Menu Rekap Absensi */}
                <div className="bg-gradient-to-r from-sky-50 to-blue-50 border border-sky-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#00296E] text-white flex items-center justify-center shrink-0 shadow-xs">
                      <FileSpreadsheet className="w-5 h-5 text-sky-300" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-[#00296E]">
                        Presensi Tersimpan Otomatis ({currentLogs.length} Tercatat)
                      </h4>
                      <p className="text-slate-600 text-[11px] mt-0.5">
                        Tabel rekapitulasi kehadiran lengkap dan tombol cetak PDF resmi ber-kop surat kini tersedia di menu <strong>Rekap Absensi</strong>.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveTab("rekap-absensi")}
                    className="px-4 py-2.5 rounded-xl bg-[#00296E] hover:bg-[#001f54] text-white font-bold text-xs shrink-0 transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Buka Menu Rekap Absensi</span>
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
                />
              </div>
            )}

            {/* TAB 4: KARTU QR CODE & IDENTITAS PENGURUS */}
            {activeTab === "kartu-qr" && (
              <div className="space-y-6 animate-in fade-in duration-200">
                
                {/* Header Kartu QR */}
                <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg sm:text-2xl font-extrabold text-[#00296E]">
                      Kartu Identitas Digital & QR Code Pengurus
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Setiap anggota memiliki QR code unik masing-masing untuk discan oleh Admin saat absensi rapat/kegiatan.
                    </p>
                  </div>

                  <div className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
                    Total: <strong className="text-[#00296E]">{DAFTAR_PENGURUS_HIMASI.length} Kartu Terbit</strong>
                  </div>
                </div>

                {/* Filter Divisi & Pencarian Pengurus */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="Cari berdasarkan nama, NIM, atau jabatan pengurus..."
                      value={searchPengurus}
                      onChange={(e) => setSearchPengurus(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00296E]"
                    />
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>

                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
                    {["SEMUA", "BPH", "MEDKOMINFO", "HUMAS", "BISNIS KREATIF", "PENASIHAT"].map(
                      (divisi) => (
                        <button
                          key={divisi}
                          type="button"
                          onClick={() => setDivisiFilterCard(divisi)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                            divisiFilterCard === divisi
                              ? "bg-[#00296E] text-white shadow-xs"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          }`}
                        >
                          {divisi}
                        </button>
                      )
                    )}
                  </div>
                </div>

                {/* Grid Kartu Pengurus */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredPengurusCards.map((member) => (
                    <div
                      key={member.id}
                      className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs hover:shadow-lg hover:border-sky-300 transition-all flex flex-col justify-between"
                    >
                      <div>
                        {/* Member Thumbnail & Info */}
                        <div className="flex items-center gap-3">
                          <div className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                            <img
                              src={member.image}
                              alt={member.nama}
                              className="w-full h-full object-cover object-top"
                            />
                          </div>
                          <div className="overflow-hidden flex-1">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-50 text-[#00296E] border border-sky-100">
                              {member.divisi}
                            </span>
                            <h4 className="text-xs font-extrabold text-slate-900 truncate mt-1">
                              {member.nama}
                            </h4>
                            <p className="text-[11px] text-slate-500 truncate">{member.jabatan}</p>
                          </div>
                        </div>

                        {/* Token Tag */}
                        <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                          <span className="text-slate-400">NIM:</span>
                          <span className="font-mono font-bold text-slate-700">{member.nim}</span>
                        </div>
                      </div>

                      {/* Tombol Buka Kartu ID & QR Code */}
                      <button
                        type="button"
                        onClick={() => setSelectedPengurusCard(member)}
                        className="mt-3 w-full py-2 rounded-xl bg-[#00296E] hover:bg-[#001f54] text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                      >
                        <QrCode className="w-3.5 h-3.5 text-sky-300" />
                        <span>Lihat QR Code & ID Card</span>
                      </button>
                    </div>
                  ))}
                </div>

              </div>
            )}

            {/* TAB 5: ASPIRASI MAHASISWA */}
            {activeTab === "aspirasi" && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg sm:text-xl font-extrabold text-[#00296E]">
                      Manajemen Aspirasi Mahasiswa
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Data tersinkronisasi langsung dengan PostgreSQL Supabase tabel <code className="bg-slate-100 px-1 py-0.5 rounded text-sky-700 font-mono text-[11px]">public.aspirasi</code>
                    </p>
                  </div>

                  {isUsingFallback && (
                    <div className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Mode Pratinjau Demo Aktif</span>
                    </div>
                  )}
                </div>

                {/* Filter & Pencarian Bar */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="Cari berdasarkan email, angkatan, atau pesan aspirasi..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00296E]"
                    />
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>

                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
                    {["semua", "baru", "diproses", "selesai"].map((status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => setStatusFilter(status)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer whitespace-nowrap ${
                          statusFilter === status
                            ? "bg-[#00296E] text-white shadow-xs"
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
                  <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
                    <RefreshCw className="w-8 h-8 text-[#0094E0] animate-spin mx-auto mb-2" />
                    <p className="text-xs text-slate-500">Memuat data dari database Supabase...</p>
                  </div>
                ) : filteredAspirasi.length === 0 ? (
                  <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
                    <MessageSquare className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <h3 className="text-sm font-bold text-slate-700">Tidak ada aspirasi ditemukan</h3>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredAspirasi.map((item) => (
                      <div
                        key={item.id}
                        className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow relative group"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-2.5">
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                              Angkatan {item.angkatan}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                                item.status === "baru"
                                  ? "bg-amber-100 text-amber-800"
                                  : item.status === "diproses"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-emerald-100 text-emerald-800"
                              }`}
                            >
                              {item.status}
                            </span>
                          </div>

                          <p className="text-xs font-extrabold text-[#00296E] truncate mb-2">
                            {item.email}
                          </p>

                          <p className="text-xs text-slate-600 line-clamp-4 leading-relaxed font-normal bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                            &quot;{item.pesan}&quot;
                          </p>

                          {item.catatan_pengurus && (
                            <div className="mt-2.5 p-2 rounded-lg bg-emerald-50/80 border border-emerald-100 text-[11px] text-emerald-800">
                              <strong>Catatan Pengurus:</strong> {item.catatan_pengurus}
                            </div>
                          )}
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                          <span className="text-[10px] text-slate-400">
                            {new Date(item.created_at).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>

                          <div className="flex items-center gap-1.5">
                            {item.status !== "diproses" && (
                              <button
                                type="button"
                                onClick={() => handleUpdateStatus(item.id, "diproses")}
                                className="px-2 py-1 rounded bg-blue-50 text-blue-600 hover:bg-blue-100 text-[10px] font-bold transition-colors cursor-pointer"
                              >
                                Proses
                              </button>
                            )}

                            {item.status !== "selesai" && (
                              <button
                                type="button"
                                onClick={() => handleUpdateStatus(item.id, "selesai")}
                                className="px-2 py-1 rounded bg-emerald-50 text-emerald-600 hover:bg-emerald-100 text-[10px] font-bold transition-colors cursor-pointer"
                              >
                                Selesai
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handleDeleteAspirasi(item.id)}
                              className="p-1 rounded text-rose-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
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

            {/* TAB 6: BERITA */}
            {activeTab === "berita" && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg sm:text-xl font-extrabold text-[#00296E]">
                      Manajemen Publikasi Warta HIMASI
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Kelola rilisan berita, dokumentasi kegiatan, dan pengumuman himpunan
                    </p>
                  </div>

                  <Link
                    href="/berita"
                    className="px-4 py-2 rounded-xl bg-[#00296E] hover:bg-[#001f54] text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Lihat Halaman Berita Publik</span>
                  </Link>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                          <th className="py-3 px-4">Judul Artikel</th>
                          <th className="py-3 px-4">Kategori</th>
                          <th className="py-3 px-4">Penulis</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        <tr className="hover:bg-slate-50/50">
                          <td className="py-3 px-4 font-bold text-slate-800">
                            Pelantikan Serentak Pengurus Kabinet REKSABUDAYA 2026
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded bg-blue-50 text-[#00296E] font-medium text-[11px]">
                              Kegiatan
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-500">HIMASI Media</td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px]">
                              Terbit
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <Link href="/berita" className="text-[#0094E0] hover:underline font-bold">
                              Lihat
                            </Link>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 7: KALENDER */}
            {activeTab === "kalender" && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg sm:text-xl font-extrabold text-[#00296E]">
                      Agenda & Kalender Program Kerja
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Rangkaian pelaksanaan program kerja HIMASI ISB Atma Luhur
                    </p>
                  </div>

                  <Link
                    href="/kalender"
                    className="px-4 py-2 rounded-xl bg-[#00296E] hover:bg-[#001f54] text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Halaman Kalender Publik</span>
                  </Link>
                </div>
              </div>
            )}

            {/* TAB 8: SUPABASE DATABASE HUB */}
            {activeTab === "database" && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                      <Database className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-base sm:text-lg font-bold text-[#00296E] flex items-center gap-2">
                        <span>PostgreSQL Supabase Hub</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          Terkoneksi
                        </span>
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Proyek: <code className="font-mono text-sky-700 bg-sky-50 px-1 py-0.5 rounded">rtbtgmtxyhljbltroyra</code> • Region: Southeast Asia
                      </p>
                    </div>
                  </div>

                  <a
                    href="https://supabase.com/dashboard/project/rtbtgmtxyhljbltroyra"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
                  >
                    <span>Buka Supabase Dashboard</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-sm text-[#00296E] flex items-center gap-2">
                        <FileCode className="w-4 h-4 text-sky-600" />
                        <span>Skrip SQL Schema Database (schema.sql)</span>
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Jalankan skrip ini di <strong>Supabase SQL Editor</strong> untuk membuat tabel <code className="text-slate-800 font-mono">pengurus</code>, <code className="text-slate-800 font-mono">absensi_log</code>, dan <code className="text-slate-800 font-mono">aspirasi</code>.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleCopySQL}
                      className="px-3.5 py-1.5 rounded-lg bg-[#00296E] hover:bg-[#001f54] text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                    >
                      {copiedSQL ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Tersalin!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Salin Skrip SQL</span>
                        </>
                      )}
                    </button>
                  </div>

                  <pre className="p-4 rounded-xl bg-slate-900 text-slate-100 font-mono text-[11px] leading-relaxed overflow-x-auto border border-slate-800 max-h-72">
                    <code>{sqlScriptContent}</code>
                  </pre>
                </div>
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

            <PengurusQrCard member={selectedPengurusCard} />
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

      {/* MODAL 4: KELOLA SEMUA KEGIATAN (TABEL MULTI-DEVICE RESPONSIF) */}
      {isKelolaKegiatanModalOpen && (
        <div
          className="no-print fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in duration-200"
          onClick={() => setIsKelolaKegiatanModalOpen(false)}
        >
          <div
            className="relative w-full max-w-3xl rounded-3xl bg-white p-5 sm:p-7 shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-100 max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-sky-50 text-[#00296E] flex items-center justify-center border border-sky-100">
                  <Calendar className="w-5 h-5 text-[#0094E0]" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#00296E]">
                    Tabel Kelola Seluruh Kegiatan ({kegiatanList.length})
                  </h3>
                  <p className="text-xs text-slate-400">
                    Pilih kegiatan aktif pemindaian, buka rekapitulasi, atau kelola agenda
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsKelolaKegiatanModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Toolbar Filter Pencarian */}
            <div className="py-3 shrink-0 flex items-center justify-between gap-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Cari kegiatan atau tanggal..."
                  value={searchKegiatanModal}
                  onChange={(e) => setSearchKegiatanModal(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 hover:bg-white focus:outline-none focus:ring-2 focus:ring-[#00296E]"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsKelolaKegiatanModalOpen(false);
                  setIsTambahKegiatanModalOpen(true);
                }}
                className="px-3.5 py-2 rounded-xl bg-[#00296E] hover:bg-[#001f54] text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5 text-sky-300" />
                <span>+ Tambah Baru</span>
              </button>
            </div>

            {/* TABEL KEGIATAN DESKTOP & TABLET */}
            <div className="hidden md:block overflow-y-auto flex-1 my-1 border border-slate-100 rounded-2xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500 z-10">
                  <tr>
                    <th className="py-2.5 px-3.5 w-10 text-center">No</th>
                    <th className="py-2.5 px-3.5">Nama Kegiatan</th>
                    <th className="py-2.5 px-3.5">Tanggal & Waktu</th>
                    <th className="py-2.5 px-3.5 text-center">Presensi Hadir</th>
                    <th className="py-2.5 px-3.5 text-center">Status</th>
                    <th className="py-2.5 px-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredKegiatanModal.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        Belum ada kegiatan yang cocok dengan pencarian.
                      </td>
                    </tr>
                  ) : (
                    filteredKegiatanModal.map((k, index) => {
                      const isActive = activeKegiatan?.id === k.id;
                      const logCount = absensiLogs.filter(
                        (l) => l.kegiatan.trim().toLowerCase() === k.nama.trim().toLowerCase()
                      ).length;

                      return (
                        <tr
                          key={k.id}
                          className={`transition-colors hover:bg-slate-50 ${
                            isActive ? "bg-sky-50/60" : ""
                          }`}
                        >
                          <td className="py-3 px-3.5 text-center font-mono text-slate-400">
                            {index + 1}
                          </td>
                          <td className="py-3 px-3.5">
                            <span className="font-extrabold text-slate-900 block">{k.nama}</span>
                          </td>
                          <td className="py-3 px-3.5 text-slate-600">
                            <span className="font-semibold block">{formatTanggalIndo(k.tanggal)}</span>
                            <span className="text-[11px] text-slate-400">{k.jam}</span>
                          </td>
                          <td className="py-3 px-3.5 text-center">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              {logCount} / {DAFTAR_PENGURUS_HIMASI.length}
                            </span>
                          </td>
                          <td className="py-3 px-3.5 text-center">
                            {isActive ? (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-[#00296E] text-white uppercase">
                                Aktif
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-slate-100 text-slate-600">
                                Tersimpan
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {!isActive ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveKegiatan(k);
                                    setIsKelolaKegiatanModalOpen(false);
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-[#00296E] hover:text-white text-slate-700 text-[11px] font-bold transition-all cursor-pointer"
                                >
                                  Pilih
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setIsKelolaKegiatanModalOpen(false);
                                    setActiveTab("rekap-absensi");
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-sky-100 hover:bg-sky-200 text-[#00296E] text-[11px] font-bold transition-colors cursor-pointer"
                                >
                                  Lihat Rekap
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => setKegiatanToDelete(k)}
                                className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
                                title={`Hapus ${k.nama}`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
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

            {/* TABEL FORMAT KARTU RESPONSIF (UNTUK HP / SMARTPHONE LAYAR KECIL) */}
            <div className="md:hidden overflow-y-auto flex-1 my-1 space-y-2.5 py-1">
              {filteredKegiatanModal.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  Belum ada agenda kegiatan yang cocok.
                </div>
              ) : (
                filteredKegiatanModal.map((k) => {
                  const isActive = activeKegiatan?.id === k.id;
                  const logCount = absensiLogs.filter(
                    (l) => l.kegiatan.trim().toLowerCase() === k.nama.trim().toLowerCase()
                  ).length;

                  return (
                    <div
                      key={k.id}
                      className={`p-3.5 rounded-2xl border transition-all ${
                        isActive
                          ? "bg-sky-50/70 border-sky-200 shadow-2xs"
                          : "bg-white border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="overflow-hidden">
                          <p className="text-xs font-bold text-slate-900 truncate">{k.nama}</p>
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

                      <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          {logCount} / {DAFTAR_PENGURUS_HIMASI.length} Hadir
                        </span>

                        <div className="flex items-center gap-1.5">
                          {!isActive ? (
                            <button
                              type="button"
                              onClick={() => {
                                setActiveKegiatan(k);
                                setIsKelolaKegiatanModalOpen(false);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-bold hover:bg-slate-200 cursor-pointer"
                            >
                              Pilih
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setIsKelolaKegiatanModalOpen(false);
                                setActiveTab("rekap-absensi");
                              }}
                              className="px-2.5 py-1 rounded-lg bg-[#00296E] text-white text-[11px] font-bold cursor-pointer"
                            >
                              Rekap
                            </button>
                          )}
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

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => {
                  setIsKelolaKegiatanModalOpen(false);
                  setActiveTab("rekap-absensi");
                }}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              >
                Buka Tab Rekap Absensi
              </button>
              <button
                type="button"
                onClick={() => setIsKelolaKegiatanModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Tutup
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
