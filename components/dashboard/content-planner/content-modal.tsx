"use client";

import { useState, useEffect } from "react";
import {
  X,
  Calendar,
  Sparkles,
  Link2,
  CheckCircle2,
  Sliders,
  FileText,
  Layers,
  Send,
  Save,
  Info,
} from "lucide-react";
import {
  type ContentPlanItem,
  type ContentPlanInput,
  type PlatformKonten,
  type JenisKonten,
  type FormatKonten,
  type StatusKonten,
  PLATFORM_OPTIONS,
  JENIS_KONTEN_OPTIONS,
  FORMAT_KONTEN_OPTIONS,
  STATUS_OPTIONS,
  getProgressForStatus,
  getStatusForProgress,
} from "@/lib/types/content-planner";
import {
  getCalendarWeekNumber,
  formatDayOfWeek,
  formatDateToYYYYMMDD,
} from "@/lib/utils/calendar-week";
import { type UserRole } from "@/lib/types/auth";

export interface ContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ContentPlanInput, id?: string) => Promise<void> | void;
  initialData?: ContentPlanItem | null;
  defaultDate?: string;
  defaultPlatform?: PlatformKonten;
  currentUserRole?: UserRole;
  isSubmitting?: boolean;
}

export function ContentModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  defaultDate,
  defaultPlatform,
  currentUserRole = "medkominfo",
  isSubmitting = false,
}: ContentModalProps) {
  // Wewenang role: Seluruh pengurus aktif dapat mengelola dan merancang jadwal konten secara kolaboratif
  const canManage =
    currentUserRole === "super_admin" ||
    currentUserRole === "bph" ||
    currentUserRole === "medkominfo" ||
    currentUserRole === "humas_biskraf" ||
    true;

  // State Form
  const [platform, setPlatform] = useState<PlatformKonten>("Instagram");
  const [tanggal, setTanggal] = useState<string>("");
  const [calendarWeek, setCalendarWeek] = useState<number>(1);
  const [dayOfWeek, setDayOfWeek] = useState<string>("Sunday");
  const [tipeKonten, setTipeKonten] = useState<JenisKonten>("Edukasi");
  const [topik, setTopik] = useState<string>("");
  const [konsep, setKonsep] = useState<FormatKonten>("Feeds");
  const [status, setStatus] = useState<StatusKonten>("Planning");
  const [referensiUrl, setReferensiUrl] = useState<string>("");
  const [progress, setProgress] = useState<number>(0);
  const [isDone, setIsDone] = useState<boolean>(false);
  const [catatan, setCatatan] = useState<string>("");
  const [errorValidation, setErrorValidation] = useState<string | null>(null);

  // Inisialisasi formulir saat modal dibuka atau saat initialData berganti
  useEffect(() => {
    if (!isOpen) return;

    if (initialData) {
      setPlatform(initialData.platform);
      setTanggal(initialData.tanggal);
      setCalendarWeek(initialData.calendar_week);
      setDayOfWeek(initialData.day_of_week);
      setTipeKonten(initialData.tipe_konten);
      setTopik(initialData.topik);
      setKonsep(initialData.konsep);
      setStatus(canManage ? initialData.status : "Planning");
      setReferensiUrl(initialData.referensi_url || "");
      setProgress(canManage ? initialData.progress : 0);
      setIsDone(canManage ? initialData.is_done : false);
      setCatatan(initialData.catatan || "");
    } else {
      const initialDateStr = defaultDate || formatDateToYYYYMMDD(new Date());
      setTanggal(initialDateStr);
      const cw = getCalendarWeekNumber(initialDateStr);
      const dayInfo = formatDayOfWeek(initialDateStr);
      setCalendarWeek(cw);
      setDayOfWeek(dayInfo.dayName);

      setPlatform(defaultPlatform && defaultPlatform !== ("All" as any) ? defaultPlatform : "Instagram");
      setTipeKonten("Edukasi");
      setTopik("");
      setKonsep("Feeds");
      setStatus("Planning");
      setReferensiUrl("");
      setProgress(0);
      setIsDone(false);
      setCatatan("");
    }
    setErrorValidation(null);
  }, [isOpen, initialData, defaultDate, defaultPlatform, canManage]);

  // Handle perubahan tanggal secara otomatis menghitung CW dan Day of Week
  const handleDateChange = (val: string) => {
    setTanggal(val);
    if (!val) return;
    try {
      const cw = getCalendarWeekNumber(val);
      const dayInfo = formatDayOfWeek(val);
      setCalendarWeek(cw);
      setDayOfWeek(dayInfo.dayName);
    } catch (err) {
      console.warn("Gagal menghitung CW:", err);
    }
  };

  // Handle perubahan status yang langsung memperbarui progress bar secara realtime
  const handleStatusChange = (newStatus: StatusKonten) => {
    if (!canManage) return;
    setStatus(newStatus);
    const newProg = getProgressForStatus(newStatus);
    setProgress(newProg);
    setIsDone(newStatus === "Publish");
  };

  // Handle perubahan slider progress yang langsung memperbarui status secara realtime
  const handleProgressChange = (val: number) => {
    if (!canManage) return;
    setProgress(val);
    const newStatus = getStatusForProgress(val);
    setStatus(newStatus);
    setIsDone(val === 100);
  };

  // Handle toggle Done satu klik
  const handleToggleDone = (checked: boolean) => {
    if (!canManage) return;
    setIsDone(checked);
    if (checked) {
      setProgress(100);
      setStatus("Publish");
    } else {
      setProgress(75);
      setStatus("Review");
    }
  };

  // Warna progress slider visual
  const getProgressColor = (val: number) => {
    if (val <= 25) return "bg-red-500";
    if (val <= 50) return "bg-orange-500";
    if (val <= 75) return "bg-amber-400";
    return "bg-emerald-500";
  };

  // Submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topik.trim()) {
      setErrorValidation("Topik / Ide konten wajib diisi.");
      return;
    }
    if (!tanggal) {
      setErrorValidation("Tanggal tayang konten wajib ditentukan.");
      return;
    }

    const payload: ContentPlanInput = {
      tanggal,
      calendar_week: calendarWeek,
      day_of_week: dayOfWeek,
      platform,
      tipe_konten: tipeKonten,
      topik: topik.trim(),
      konsep,
      status: canManage ? status : "Planning",
      referensi_url: referensiUrl.trim() ? referensiUrl.trim() : null,
      progress: canManage ? progress : 0,
      is_done: canManage ? isDone : false,
      catatan: catatan.trim() ? catatan.trim() : null,
    };

    await onSave(payload, initialData?.id);
  };

  // Keyboard shortcut ESC untuk menutup modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-[#001438] border border-slate-200 dark:border-[#00296E]/40 text-slate-800 dark:text-slate-100 rounded-none shadow-2xl max-w-2xl w-full my-auto flex flex-col max-h-[92vh] transition-colors">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-[#00296E]/30 flex items-start justify-between gap-4 bg-slate-50 dark:bg-[#001740]/60 shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 bg-sky-50 dark:bg-[#00296E]/30 text-[#00296E] dark:text-[#38BDF8] border border-sky-200 dark:border-[#00296E]/50 font-semibold">
                {canManage ? "Editorial Modul" : "Pengajuan Ide Anggota"}
              </span>
              <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                CW {calendarWeek} • {dayOfWeek}
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              {initialData ? (
                <>
                  <FileText className="w-5 h-5 text-[#00296E] dark:text-[#38BDF8]" />
                  <span>Edit Rencana Konten</span>
                </>
              ) : canManage ? (
                <>
                  <Calendar className="w-5 h-5 text-[#00296E] dark:text-[#38BDF8]" />
                  <span>Tambah Jadwal Konten Baru</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 text-amber-500 dark:text-amber-400" />
                  <span>Ajukan Gagasan / Ide Konten Baru</span>
                </>
              )}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {canManage
                ? "Atur detail strategi, alur editorial, format, dan progress produksi konten."
                : "Ide yang Anda ajukan akan masuk ke status 'Planning' untuk dikurasi oleh tim Medkominfo."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-[#00296E]/30 rounded-none transition-colors cursor-pointer"
            title="Tutup dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 overflow-y-auto space-y-4 sm:space-y-5 text-xs">
          {errorValidation && (
            <div className="p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-300 flex items-center gap-2">
              <Info className="w-4 h-4 shrink-0 text-red-500 dark:text-red-400" />
              <span>{errorValidation}</span>
            </div>
          )}

          {/* Baris 1: Platform & Tanggal Tayang */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5 font-semibold">
                Platform Media Sosial <span className="text-red-500 dark:text-red-400">*</span>
              </label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value as PlatformKonten)}
                className="w-full bg-white dark:bg-[#001740] border-2 border-slate-300 dark:border-[#38BDF8]/60 text-slate-900 dark:text-white px-3 py-2 text-xs font-semibold rounded-none focus:outline-none focus:border-[#00296E] dark:focus:border-[#38BDF8] transition-colors cursor-pointer shadow-sm"
              >
                {PLATFORM_OPTIONS.map((p) => (
                  <option key={p} value={p} className="bg-white text-slate-900 dark:bg-[#001740] dark:text-white">
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5 font-semibold">
                Tanggal Tayang (YYYY-MM-DD) <span className="text-red-500 dark:text-red-400">*</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={tanggal}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="flex-1 bg-white dark:bg-[#001740] border border-slate-300 dark:border-[#00296E]/40 text-slate-900 dark:text-white px-3 py-2 text-xs rounded-none focus:outline-none focus:border-[#00296E] dark:focus:border-[#38BDF8] transition-colors"
                />
                <div className="px-2.5 py-2 bg-slate-50 dark:bg-[#001740] border border-slate-300 dark:border-[#00296E]/40 text-slate-700 dark:text-slate-300 text-[11px] font-mono whitespace-nowrap font-medium">
                  CW {calendarWeek}
                </div>
              </div>
            </div>
          </div>

          {/* Baris 2: Topik Utama */}
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5 font-semibold">
              Judul / Topik Utama Konten <span className="text-red-500 dark:text-red-400">*</span>
            </label>
            <textarea
              rows={2}
              value={topik}
              onChange={(e) => setTopik(e.target.value)}
              placeholder="Contoh: Roadmap Belajar UI/UX & Web Development untuk Mahasiswa Baru Sistem Informasi..."
              className="w-full bg-white dark:bg-[#001740] border border-slate-300 dark:border-[#00296E]/40 text-slate-900 dark:text-white px-3 py-2 text-xs rounded-none focus:outline-none focus:border-[#00296E] dark:focus:border-[#38BDF8] placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-colors"
            />
          </div>

          {/* Baris 3: Jenis Konten & Tipe Konten (Format) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5 flex items-center gap-1.5 font-semibold">
                <Layers className="w-3.5 h-3.5 text-[#00296E] dark:text-[#38BDF8]" />
                Jenis Konten <span className="text-red-500 dark:text-red-400">*</span>
              </label>
              <select
                value={tipeKonten}
                onChange={(e) => setTipeKonten(e.target.value as JenisKonten)}
                className="w-full bg-white dark:bg-[#001740] border-2 border-slate-300 dark:border-[#38BDF8]/60 text-slate-900 dark:text-white px-3 py-2 text-xs font-semibold rounded-none focus:outline-none focus:border-[#00296E] dark:focus:border-[#38BDF8] transition-colors cursor-pointer shadow-sm"
              >
                {JENIS_KONTEN_OPTIONS.map((t) => (
                  <option key={t} value={t} className="bg-white text-slate-900 dark:bg-[#001740] dark:text-white">
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5 flex items-center gap-1.5 font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                Tipe Konten (Format) <span className="text-red-500 dark:text-red-400">*</span>
              </label>
              <select
                value={konsep}
                onChange={(e) => setKonsep(e.target.value as FormatKonten)}
                className="w-full bg-white dark:bg-[#001740] border-2 border-slate-300 dark:border-[#38BDF8]/60 text-slate-900 dark:text-white px-3 py-2 text-xs font-semibold rounded-none focus:outline-none focus:border-[#00296E] dark:focus:border-[#38BDF8] transition-colors cursor-pointer shadow-sm"
              >
                {FORMAT_KONTEN_OPTIONS.map((k) => (
                  <option key={k} value={k} className="bg-white text-slate-900 dark:bg-[#001740] dark:text-white">
                    {k}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Baris 4: Status Alur & Tautan Referensi */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5 font-semibold">
                Status Editorial
              </label>
              {canManage ? (
                <select
                  value={status}
                  onChange={(e) => handleStatusChange(e.target.value as StatusKonten)}
                  className="w-full bg-white dark:bg-[#001740] border-2 border-slate-300 dark:border-[#38BDF8]/60 text-slate-900 dark:text-white px-3 py-2 text-xs font-semibold rounded-none focus:outline-none focus:border-[#00296E] dark:focus:border-[#38BDF8] transition-colors cursor-pointer shadow-sm"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s} className="bg-white text-slate-900 dark:bg-[#001740] dark:text-white">
                      {s} ({getProgressForStatus(s)}%)
                    </option>
                  ))}
                </select>
              ) : (
                <div className="w-full bg-slate-50 dark:bg-[#001740] border border-slate-300 dark:border-[#00296E]/40 px-3 py-2 text-xs text-slate-600 dark:text-slate-400 flex items-center justify-between">
                  <span>Planning (Terkunci untuk pengusul)</span>
                  <span className="w-2 h-2 rounded-full bg-slate-400 dark:bg-zinc-400" />
                </div>
              )}
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5 flex items-center gap-1.5 font-semibold">
                <Link2 className="w-3.5 h-3.5 text-[#00296E] dark:text-[#38BDF8]" />
                Tautan Referensi / Drive
              </label>
              <input
                type="url"
                value={referensiUrl}
                onChange={(e) => setReferensiUrl(e.target.value)}
                placeholder="https://drive.google.com/... atau https://instagram.com/p/..."
                className="w-full bg-white dark:bg-[#001740] border border-slate-300 dark:border-[#00296E]/40 text-slate-900 dark:text-white px-3 py-2 text-xs rounded-none focus:outline-none focus:border-[#00296E] dark:focus:border-[#38BDF8] placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-colors"
              />
            </div>
          </div>

          {/* Baris 5: Progress Bar & Checkbox Done */}
          <div className="p-3.5 bg-slate-50 dark:bg-[#001740]/80 border border-slate-200 dark:border-[#00296E]/40 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-mono uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5 font-semibold">
                <Sliders className="w-3.5 h-3.5 text-[#00296E] dark:text-[#38BDF8]" />
                Progress Produksi (Realtime Sync)
              </label>
              <span className="text-xs font-mono font-bold px-2 py-0.5 bg-white dark:bg-[#001438] border border-slate-300 dark:border-[#00296E]/40 text-[#00296E] dark:text-white">
                {progress}%
              </span>
            </div>

            {/* Slider visual */}
            <div className="space-y-1.5">
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                disabled={!canManage}
                value={progress}
                onChange={(e) => handleProgressChange(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-none appearance-none cursor-pointer accent-[#00296E] dark:accent-[#38BDF8] disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <div className="w-full h-1 bg-slate-200 dark:bg-[#001438] overflow-hidden">
                <div
                  className={`h-full transition-all duration-200 ${getProgressColor(progress)}`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Done Checkbox */}
            <div className="pt-1 flex items-center justify-between border-t border-slate-200 dark:border-[#00296E]/30">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  disabled={!canManage}
                  checked={isDone}
                  onChange={(e) => handleToggleDone(e.target.checked)}
                  className="w-4 h-4 rounded-none accent-emerald-600 dark:accent-[#22C55E] bg-white dark:bg-[#001740] border-slate-300 dark:border-[#00296E] disabled:cursor-not-allowed"
                />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                  Tandai Selesai (Publish 100%)
                </span>
              </label>
              {isDone && (
                <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Siap / Sudah Terbit (Publish)
                </span>
              )}
            </div>
          </div>

          {/* Baris 6: Catatan Tambahan */}
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5 font-semibold">
              Catatan Produksi / Talent / Audio (Opsional)
            </label>
            <textarea
              rows={2}
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Catatan naskah, talent, hashtag trending, format cover..."
              className="w-full bg-white dark:bg-[#001740] border border-slate-300 dark:border-[#00296E]/40 text-slate-900 dark:text-white px-3 py-2 text-xs rounded-none focus:outline-none focus:border-[#00296E] dark:focus:border-[#38BDF8] placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-colors"
            />
          </div>

          {/* Modal Footer */}
          <div className="pt-3 border-t border-slate-200 dark:border-[#00296E]/30 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 border border-slate-300 dark:border-[#00296E]/40 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#00296E]/30 text-xs font-mono rounded-none transition-colors cursor-pointer"
            >
              Batal
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-[#00296E] hover:bg-[#00296E]/90 text-white dark:bg-[#38BDF8] dark:hover:bg-[#38BDF8]/90 dark:text-[#001740] font-bold text-xs font-mono uppercase tracking-wider rounded-none transition-colors flex items-center gap-2 shadow-none disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <span>Menyimpan...</span>
              ) : canManage ? (
                <>
                  <Save className="w-4 h-4" />
                  <span>{initialData ? "Simpan Perubahan" : "Simpan Jadwal"}</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Ajukan Ide Konten</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
