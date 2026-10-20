"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Html5Qrcode } from "html5-qrcode";
import {
  Camera,
  CameraOff,
  CheckCircle2,
  AlertCircle,
  Volume2,
  VolumeX,
  Upload,
  Calendar,
  Clock,
  X
} from "lucide-react";
import { DAFTAR_PENGURUS_HIMASI, type PengurusMember } from "@/lib/data/pengurus";
import { supabase } from "@/lib/supabase/client";

interface AdminQrScannerProps {
  kegiatanAktif: string;
  kegiatanTanggal?: string;
  kegiatanJam?: string;
  onAttendanceSuccess?: (log: AbsensiRecord) => void;
}

export interface AbsensiRecord {
  id: string;
  pengurusId: string;
  nama: string;
  nim: string;
  divisi: string;
  jabatan: string;
  image: string;
  kegiatan: string;
  waktu: string;
  status: "Hadir" | "Terlambat" | "Izin" | "Sakit";
  catatan?: string;
}

export default function AdminQrScanner({
  kegiatanAktif,
  kegiatanTanggal,
  kegiatanJam,
  onAttendanceSuccess,
}: AdminQrScannerProps) {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [lastScannedResult, setLastScannedResult] = useState<AbsensiRecord | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [statusMode, setStatusMode] = useState<"Hadir" | "Terlambat">("Hadir");

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannedHistory = useRef<Set<string>>(new Set());

  // Web Audio Beep Feedback
  const playBeep = useCallback(
    (type: "success" | "warning" = "success") => {
      if (!soundEnabled) return;
      try {
        const audioCtx = new (window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);

        if (type === "success") {
          osc.type = "sine";
          osc.frequency.setValueAtTime(880, audioCtx.currentTime); // Note A5
          osc.frequency.setValueAtTime(1320, audioCtx.currentTime + 0.08); // Note E6
          gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.25);
          osc.start();
          osc.stop(audioCtx.currentTime + 0.25);
        } else {
          osc.type = "sawtooth";
          osc.frequency.setValueAtTime(320, audioCtx.currentTime);
          gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
          osc.start();
          osc.stop(audioCtx.currentTime + 0.3);
        }
      } catch (err) {
        // Browser policy fallback
      }
    },
    [soundEnabled]
  );

  // Proses Data QR Code yang Berhasil Di-scan
  const handleProcessScan = useCallback(
    async (decodedText: string) => {
      setCameraError(null);
      setDuplicateWarning(null);

      let foundMember: PengurusMember | undefined;

      // 1. Coba parse JSON payload QR
      try {
        const parsed = JSON.parse(decodedText);
        if (parsed.nim || parsed.token) {
          foundMember = DAFTAR_PENGURUS_HIMASI.find(
            (p) =>
              p.nim === parsed.nim ||
              p.qrToken === parsed.token ||
              p.nama.toLowerCase() === parsed.nama?.toLowerCase()
          );
        }
      } catch (e) {
        // Bukan JSON, cek string token / NIM langsung
        foundMember = DAFTAR_PENGURUS_HIMASI.find(
          (p) =>
            p.qrToken === decodedText.trim() ||
            p.nim === decodedText.trim() ||
            p.nama.toLowerCase().includes(decodedText.toLowerCase().trim())
        );
      }

      if (!foundMember) {
        playBeep("warning");
        setCameraError(
          "QR Code tidak dikenali sebagai anggota resmi HIMASI Kabinet REKSABUDAYA."
        );
        return;
      }

      // 2. Cek apakah sudah pernah absen di sesi ini
      const sessionKey = `${foundMember.id}-${kegiatanAktif}`;
      if (scannedHistory.current.has(sessionKey)) {
        playBeep("warning");
        setDuplicateWarning(
          `Pengurus "${foundMember.nama}" sudah tercatat hadir untuk kegiatan "${kegiatanAktif}"!`
        );
        return;
      }

      scannedHistory.current.add(sessionKey);
      playBeep("success");

      const now = new Date();
      const waktuFormat = now.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });

      const newRecord: AbsensiRecord = {
        id: `scan-${Date.now()}`,
        pengurusId: foundMember.id,
        nama: foundMember.nama,
        nim: foundMember.nim,
        divisi: foundMember.divisi,
        jabatan: foundMember.jabatan,
        image: foundMember.image,
        kegiatan: kegiatanAktif,
        waktu: waktuFormat,
        status: statusMode,
      };

      setLastScannedResult(newRecord);

      // Simpan ke database Supabase
      try {
        await supabase.from("absensi_log").insert([
          {
            nama_pengurus: foundMember.nama,
            nim: foundMember.nim,
            divisi: foundMember.divisi,
            nama_kegiatan: kegiatanAktif,
            status: statusMode,
            waktu_scan: now.toISOString(),
          },
        ]);
      } catch (err) {
        console.warn("Catatan: Menyimpan log absensi ke Supabase:", err);
      }

      if (onAttendanceSuccess) {
        onAttendanceSuccess(newRecord);
      }
    },
    [kegiatanAktif, statusMode, playBeep, onAttendanceSuccess]
  );

  // Jalankan Scanner Kamera
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode("qr-camera-element");
      }

      const qrConfig = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      };

      await scannerRef.current.start(
        { facingMode: "environment" },
        qrConfig,
        (decodedText) => {
          handleProcessScan(decodedText);
        },
        () => {
          // Sedang memindai frame
        }
      );

      setIsCameraActive(true);
    } catch (err: unknown) {
      console.error("Gagal memulai kamera:", err);
      const msg =
        err instanceof Error ? err.message : "Tidak dapat mengakses kamera perangkat.";
      setCameraError(
        `${msg}. Pastikan Anda telah memberikan izin kamera pada browser Anda.`
      );
      setIsCameraActive(false);
    }
  };

  // Matikan Scanner Kamera
  const stopCamera = async () => {
    try {
      if (scannerRef.current && isCameraActive) {
        await scannerRef.current.stop();
        setIsCameraActive(false);
      }
    } catch (err) {
      console.warn("Gagal stop kamera:", err);
    }
  };

  // Bersihkan saat unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current
          .stop()
          .catch(() => {})
          .finally(() => {
            scannerRef.current?.clear();
          });
      }
    };
  }, []);

  // Upload Gambar QR Code
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode("qr-camera-element");
      }
      const result = await scannerRef.current.scanFile(file, true);
      handleProcessScan(result);
    } catch (err) {
      playBeep("warning");
      setCameraError("Tidak dapat membaca QR code dari gambar yang diunggah.");
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-7 shadow-sm space-y-6 max-w-3xl mx-auto">
      
      {/* Header Scanner & Kontrol Kegiatan */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h3 className="text-base sm:text-lg font-black text-[#00296E]">
              Pemindai Kamera QR Code Absensi
            </h3>
          </div>
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-500 mt-0.5">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-sky-600" />
              <span>Kegiatan Aktif: <strong className="text-slate-800">{kegiatanAktif}</strong></span>
            </span>
            {kegiatanTanggal && (
              <span className="text-slate-400">• {kegiatanTanggal}</span>
            )}
            {kegiatanJam && (
              <span className="flex items-center gap-1 text-[#00296E] font-bold bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200">
                <Clock className="w-3 h-3 text-sky-600" />
                <span>{kegiatanJam}</span>
              </span>
            )}
          </div>
        </div>

        {/* Status Mode (Hadir / Terlambat) + Sound Toggle */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => setStatusMode("Hadir")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusMode === "Hadir"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Hadir Tepat Waktu
            </button>
            <button
              type="button"
              onClick={() => setStatusMode("Terlambat")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusMode === "Terlambat"
                  ? "bg-amber-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Terlambat
            </button>
          </div>

          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
            title={soundEnabled ? "Nonaktifkan Suara Beep" : "Aktifkan Suara Beep"}
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-400" />
            )}
          </button>
        </div>
      </div>

      {/* Area Kamera Viewfinder Terfokus */}
      <div className="flex flex-col items-center">
        
        <div className="w-full relative aspect-video max-h-[380px] rounded-2xl overflow-hidden bg-slate-950 border-2 border-slate-800 flex flex-col items-center justify-center text-white shadow-md">
          
          {/* Target element untuk html5-qrcode */}
          <div
            id="qr-camera-element"
            className={`w-full h-full ${isCameraActive ? "block" : "hidden"}`}
          />

          {!isCameraActive && (
            <div className="p-6 text-center space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-white/10 mx-auto flex items-center justify-center text-sky-400">
                <Camera className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Kamera Belum Aktif</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Klik tombol di bawah untuk mengaktifkan kamera laptop / HP admin guna memindai QR code pengurus secara langsung.
                </p>
              </div>
            </div>
          )}

          {/* Viewfinder Reticle Overlay saat kamera aktif */}
          {isCameraActive && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-52 h-52 border-2 border-[#0094E0] rounded-2xl relative shadow-[0_0_0_9999px_rgba(0,0,0,0.55)]">
                <div className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-[#0094E0] to-transparent animate-bounce shadow-[0_0_12px_#0094E0]" />
                <div className="absolute top-1 left-2 text-[10px] font-bold text-sky-400 uppercase tracking-widest bg-black/60 px-2 py-0.5 rounded">
                  Arahkan QR Code Pengurus
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Kontrol Kamera & Upload File */}
        <div className="w-full mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {!isCameraActive ? (
              <button
                type="button"
                onClick={startCamera}
                className="px-5 py-2.5 rounded-xl bg-[#00296E] hover:bg-[#001f54] text-white text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <Camera className="w-4 h-4 text-sky-300" />
                <span>Aktifkan Kamera Pemindai</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={stopCamera}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <CameraOff className="w-4 h-4" />
                <span>Matikan Kamera</span>
              </button>
            )}

            {/* Upload Foto QR Code */}
            <label className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer">
              <Upload className="w-4 h-4 text-[#0094E0]" />
              <span>Pindai dari File Gambar</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          <span className="text-[11px] text-slate-400">
            Arahkan kamera ke layar HP / kartu cetak pengurus
          </span>
        </div>

        {/* Notifikasi Popover Berhasil Absen */}
        {lastScannedResult && (
          <div className="w-full mt-4 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 border border-emerald-300 shrink-0">
                <img
                  src={lastScannedResult.image}
                  alt={lastScannedResult.nama}
                  className="w-full h-full object-cover object-top"
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Presensi Berhasil</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {lastScannedResult.waktu} WIB
                  </span>
                </div>
                <h4 className="text-sm font-extrabold text-[#00296E] mt-0.5">
                  {lastScannedResult.nama} ({lastScannedResult.nim})
                </h4>
                <p className="text-xs text-slate-600 font-medium">
                  {lastScannedResult.jabatan} • <span className="font-bold text-[#0094E0]">{lastScannedResult.divisi}</span>
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setLastScannedResult(null)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-emerald-100"
              aria-label="Tutup"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Feedback Peringatan Error / Ganda */}
        {cameraError && (
          <div className="w-full mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{cameraError}</span>
          </div>
        )}

        {duplicateWarning && (
          <div className="w-full mt-3 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{duplicateWarning}</span>
          </div>
        )}

      </div>

    </div>
  );
}
