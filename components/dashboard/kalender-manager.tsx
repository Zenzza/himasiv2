"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  CalendarBlank,
  ArrowsClockwise,
  ArrowSquareOut,
  Plus,
  CaretLeft,
  CaretRight,
  NotePencil,
  Trash,
  Check,
  X,
  Sparkle,
} from "@phosphor-icons/react";
import {
  type AgendaKalender,
  type EventCategory,
  DEFAULT_AGENDA_EVENTS,
  isDateInEventRange,
  getCategoryMeta,
} from "@/lib/types/kalender";
import {
  type UserRole,
  type ContentStatus,
  canPublishContent,
  canEditPublishedContent,
} from "@/lib/types/auth";
import {
  getAgendaKalender,
  createAgenda,
  updateAgenda,
  deleteAgenda,
  updateAgendaStatus,
} from "@/lib/supabase/kalender";
import { recordAuditLog } from "@/lib/supabase/audit-log";

interface KalenderManagerProps {
  currentUserRole?: UserRole;
  currentUserName?: string;
  showToast?: (msg: string) => void;
}

const NAMA_BULAN_ID = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

const HARI_SINGKAT = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

export default function KalenderManager({
  currentUserRole = "humas_biskraf",
  currentUserName = "Pengurus HIMASI",
  showToast = (msg: string) => console.log(msg),
}: KalenderManagerProps) {
  // State Data Agenda
  const [agendaList, setAgendaList] = useState<AgendaKalender[]>(DEFAULT_AGENDA_EVENTS);
  const [loadingAgenda, setLoadingAgenda] = useState(true);

  // Navigasi Tanggal & Bulan Kalender
  const [adminCalYear, setAdminCalYear] = useState(() => new Date().getFullYear());
  const [adminCalMonth, setAdminCalMonth] = useState(() => new Date().getMonth());
  const [adminSelectedDate, setAdminSelectedDate] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  });

  // Modal State
  const [isAgendaModalOpen, setIsAgendaModalOpen] = useState(false);
  const [editingAgenda, setEditingAgenda] = useState<AgendaKalender | null>(null);
  const [agendaToDelete, setAgendaToDelete] = useState<AgendaKalender | null>(null);
  const [deletingAgenda, setDeletingAgenda] = useState(false);
  const [savingAgenda, setSavingAgenda] = useState(false);

  // Form State
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

  // Ambil Data Agenda dari Supabase
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

  useEffect(() => {
    fetchAgendaList();
  }, [fetchAgendaList]);

  // Handler Navigasi Bulan
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

  // Kalkulasi Grid Sel Kalender Bulanan (7 Kolom: Sen-Min)
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

    const todayStr = (() => {
      const now = new Date();
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    })();

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

  // Daftar Acara pada Hari Terpilih
  const selectedDateEvents = useMemo(() => {
    if (!adminSelectedDate) return [];
    return agendaList.filter((e) => isDateInEventRange(adminSelectedDate, e));
  }, [agendaList, adminSelectedDate]);

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

  // Handler Buka Modal Tambah
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

  // Handler Buka Modal Edit
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

  // Simpan Agenda (Tambah / Edit)
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
        showToast("Peringatan: Gagal sinkron ke database Supabase! Pastikan tabel 'agenda_kalender' telah dibuat.");
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

  // Setujui & Terbitkan Agenda
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

  // Hapus Agenda
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

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Kalender Dashboard */}
      <div className="bg-white dark:bg-[#001438] p-4 sm:p-5 border border-[#00296E]/15 dark:border-white/10 shadow-none flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-none bg-[#00296E]/5 dark:bg-white/5 text-[#00296E] dark:text-[#38BDF8] flex items-center justify-center border border-[#00296E]/15 dark:border-white/10 shrink-0">
            <CalendarBlank className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-[#00296E] dark:text-white uppercase tracking-wider flex items-center gap-2">
              <span>Kalender Agenda Organisasi &amp; Kampus</span>
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
              <p className="text-[11px] font-mono text-slate-400 dark:text-slate-500 mt-0.5">
                Pilih tanggal pada grid untuk meninjau jadwal &amp; agenda harian
              </p>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleAdminToday}
                className="px-2.5 py-1 text-[11px] font-mono uppercase font-semibold border border-[#00296E]/20 dark:border-white/20 bg-[#00296E]/5 dark:bg-white/5 text-[#00296E] dark:text-[#38BDF8] hover:bg-[#00296E]/10 transition-colors cursor-pointer"
              >
                Hari Ini
              </button>
              <button
                type="button"
                onClick={handleAdminPrevMonth}
                className="p-1.5 border border-[#00296E]/20 dark:border-white/20 bg-white dark:bg-[#001740] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
                aria-label="Bulan Sebelumnya"
              >
                <CaretLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleAdminNextMonth}
                className="p-1.5 border border-[#00296E]/20 dark:border-white/20 bg-white dark:bg-[#001740] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
                aria-label="Bulan Berikutnya"
              >
                <CaretRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Label Hari (Sen - Min) */}
          <div className="grid grid-cols-7 gap-1 text-center font-mono text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider py-2 border-b border-[#00296E]/10 dark:border-white/10 mb-2">
            {HARI_SINGKAT.map((h, idx) => (
              <span key={h} className={idx === 6 ? "text-rose-500" : ""}>
                {h}
              </span>
            ))}
          </div>

          {/* Grid Sel Kalender */}
          <div className="grid grid-cols-7 gap-1">
            {adminCalendarCells.map((cell) => {
              const isOtherMonth = cell.monthOffset !== 0;

              return (
                <div
                  key={cell.fullDate}
                  onClick={() => setAdminSelectedDate(cell.fullDate)}
                  className={`min-h-[64px] sm:min-h-[74px] p-1.5 sm:p-2 border transition-all cursor-pointer flex flex-col justify-between select-none ${
                    cell.isSelected
                      ? "border-[#00296E] dark:border-[#38BDF8] bg-[#00296E]/10 dark:bg-sky-950/40 font-bold"
                      : isOtherMonth
                      ? "border-transparent bg-slate-50/50 dark:bg-white/[0.01] text-slate-300 dark:text-slate-600 hover:border-slate-300"
                      : "border-slate-100 dark:border-white/5 bg-white dark:bg-[#001740] hover:border-[#00296E]/40"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-mono ${
                        cell.isSelected
                          ? "text-[#00296E] dark:text-[#38BDF8] font-bold"
                          : isOtherMonth
                          ? "text-slate-300 dark:text-slate-600"
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

          {/* Keterangan Kategori (Legend) */}
          <div className="pt-4 mt-4 border-t border-[#00296E]/10 dark:border-white/10 flex items-center justify-between flex-wrap gap-2 text-[11px] font-mono">
            <span className="text-slate-400 uppercase tracking-wider">Kategori:</span>
            <div className="flex items-center gap-3">
              {(["HIMASI", "Akademik", "Libur"] as EventCategory[]).map((cat) => {
                const meta = getCategoryMeta(cat);
                return (
                  <div key={cat} className="flex items-center gap-1.5">
                    <span className={`w-2.5 h-2.5 ${meta.dot}`} />
                    <span className="text-slate-600 dark:text-slate-400">{meta.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* SISI KANAN: DETAIL AGENDA HARI TERPILIH (5 KOLOM) */}
        <div className="lg:col-span-5 bg-white dark:bg-[#001438] p-5 sm:p-6 border border-[#00296E]/15 dark:border-white/10 shadow-none">
          <div className="flex items-center justify-between pb-4 border-b border-[#00296E]/10 dark:border-white/10 mb-4">
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
                          <span
                            className={`px-2 py-0.5 rounded-none text-[10px] font-mono uppercase tracking-wider border ${
                              event.status === "published"
                                ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40"
                                : "bg-sky-50 dark:bg-sky-950/40 text-[#0094E0] dark:text-sky-300 border-sky-200 dark:border-sky-800/40"
                            }`}
                          >
                            {event.status === "published" ? "Terbit" : "Review"}
                          </span>
                        </div>
                        {isMultiDay && (
                          <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                            Multi-hari
                          </span>
                        )}
                      </div>

                      <h5 className="text-sm font-semibold text-slate-900 dark:text-white leading-snug">
                        {event.judul}
                      </h5>

                      <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 space-y-0.5 font-mono">
                        <p>
                          <strong>Waktu:</strong> {event.waktu || "Sepanjang Hari"}
                        </p>
                        <p>
                          <strong>Lokasi:</strong> {event.lokasi || "ISB Atma Luhur"}
                        </p>
                        {isMultiDay && (
                          <p>
                            <strong>Rentang:</strong> {event.tanggal_mulai} s.d {event.tanggal_selesai}
                          </p>
                        )}
                      </div>

                      {event.deskripsi && (
                        <p className="mt-2.5 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-white/5 p-2 rounded-none border border-slate-100 dark:border-white/5 leading-relaxed">
                          {event.deskripsi}
                        </p>
                      )}
                    </div>

                    {/* Tombol Aksi Agenda */}
                    <div className="pt-3 border-t border-[#00296E]/10 dark:border-white/10 flex items-center justify-end gap-1.5">
                      {event.status === "pending_review" && canPublishContent(currentUserRole) && (
                        <button
                          type="button"
                          onClick={() => handleApproveAgenda(event)}
                          className="px-2.5 py-1.5 rounded-none bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold uppercase tracking-wider transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
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
    </div>
  );
}
