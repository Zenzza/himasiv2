"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Html5Qrcode, type CameraDevice } from "html5-qrcode";
import {
  Camera,
  CameraSlash,
  CheckCircle,
  WarningCircle,
  SpeakerHigh,
  SpeakerSlash,
  UploadSimple,
  CalendarBlank,
  Clock,
  X,
  CameraRotate,
  Spinner,
} from "@phosphor-icons/react";
import { DAFTAR_PENGURUS_HIMASI, type PengurusMember } from "@/lib/data/pengurus";
import { supabase } from "@/lib/supabase/client";
import { recordAuditLog } from "@/lib/supabase/audit-log";

interface AdminQrScannerProps {
  kegiatanAktif: string;
  kegiatanTanggal?: string;
  kegiatanJam?: string;
  onAttendanceSuccess?: (log: AbsensiRecord) => void;
  pengurusList?: PengurusMember[];
  currentUserName?: string;
  currentUserRole?: string;
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
  pengurusList,
  currentUserName,
  currentUserRole = "bph",
}: AdminQrScannerProps) {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isStartingCamera, setIsStartingCamera] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [lastScannedResult, setLastScannedResult] = useState<AbsensiRecord | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [statusMode, setStatusMode] = useState<"Hadir" | "Terlambat">("Hadir");
  const [availableCameras, setAvailableCameras] = useState<CameraDevice[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>("");

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannedHistory = useRef<Set<string>>(new Set());
  const isProcessingRef = useRef(false);
  const lastScannedTextRef = useRef<string>("");
  const lastScannedTimeRef = useRef<number>(0);

  // Web Audio Beep Feedback
  const playBeep = useCallback(
    (type: "success" | "warning" = "success") => {
      if (!soundEnabled) return;
      try {
        const AudioContextClass =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!AudioContextClass) return;

        const audioCtx = new AudioContextClass();
        if (audioCtx.state === "suspended") {
          audioCtx.resume();
        }

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
      } catch {
        // Browser policy fallback
      }
    },
    [soundEnabled]
  );

  // Proses Data QR Code yang Berhasil Di-scan
  const handleProcessScan = useCallback(
    async (decodedText: string) => {
      if (!decodedText || isProcessingRef.current) return;

      const trimmedText = decodedText.trim();
      const now = Date.now();

      // Debounce: cegah scan berulang untuk kode yang sama dalam 2.5 detik
      if (
        trimmedText === lastScannedTextRef.current &&
        now - lastScannedTimeRef.current < 2500
      ) {
        return;
      }

      isProcessingRef.current = true;
      lastScannedTextRef.current = trimmedText;
      lastScannedTimeRef.current = now;

      setCameraError(null);
      setDuplicateWarning(null);

      try {
        const activeList =
          pengurusList && pengurusList.length > 0
            ? pengurusList
            : DAFTAR_PENGURUS_HIMASI;
        let foundMember: PengurusMember | undefined;

        // 1. Coba parse JSON payload QR
        try {
          const parsed = JSON.parse(trimmedText);
          const parsedNim = parsed.nim ? String(parsed.nim).trim() : "";
          const parsedToken = parsed.token ? String(parsed.token).trim() : "";
          const parsedNama = parsed.nama
            ? String(parsed.nama).trim().toLowerCase()
            : "";

          foundMember = activeList.find((p) => {
            const matchNim = parsedNim && String(p.nim).trim() === parsedNim;
            const matchToken =
              parsedToken &&
              p.qrToken &&
              p.qrToken.trim().toLowerCase() === parsedToken.toLowerCase();
            const matchNama =
              parsedNama && p.nama.trim().toLowerCase() === parsedNama;
            return matchNim || matchToken || matchNama;
          });
        } catch {
          // Bukan format JSON, parsing sebagai teks biasa
        }

        // 2. Jika belum ditemukan, cek string token / NIM / Nama secara langsung
        if (!foundMember) {
          const lowerText = trimmedText.toLowerCase();
          foundMember = activeList.find((p) => {
            const pNim = String(p.nim).trim();
            const pToken = (p.qrToken || "").trim().toLowerCase();
            const pNama = p.nama.trim().toLowerCase();

            return (
              pNim === trimmedText ||
              (pToken && pToken === lowerText) ||
              (pToken && lowerText.includes(pToken)) ||
              pNama === lowerText ||
              (pNama.length > 4 && lowerText.includes(pNama))
            );
          });
        }

        if (!foundMember) {
          playBeep("warning");
          setCameraError(
            `QR Code tidak dikenali (${trimmedText.slice(0, 30)}...). Pastikan menggunakan QR Code resmi pengurus HIMASI.`
          );
          return;
        }

        // 3. Cek apakah sudah pernah absen di kegiatan ini (sesi ini)
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

        const currentDate = new Date();
        const waktuFormat = currentDate.toLocaleTimeString("id-ID", {
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

        // Catat entri ke Audit Log
        recordAuditLog({
          pengurus_nama: currentUserName || "Admin Presensi",
          pengurus_role: currentUserRole || "bph",
          modul: "absensi",
          aksi: `Mencatat kehadiran QR: ${foundMember.nama} (${foundMember.nim})`,
          status: "berhasil",
          detail: `Peserta: ${foundMember.nama} (${foundMember.nim}), Jabatan: ${foundMember.jabatan}, Kegiatan: ${kegiatanAktif}, Status: ${statusMode}, Waktu: ${waktuFormat}`,
        }).catch((err) => console.warn("[AdminQrScanner] Gagal mencatat audit log absensi:", err));

        // Simpan ke database Supabase
        try {
          await supabase.from("absensi_log").insert([
            {
              nama_pengurus: foundMember.nama,
              nim: foundMember.nim,
              divisi: foundMember.divisi,
              nama_kegiatan: kegiatanAktif,
              status: statusMode,
              waktu_scan: currentDate.toISOString(),
            },
          ]);
        } catch (err) {
          console.warn("Catatan: Menyimpan log absensi ke Supabase:", err);
        }

        if (onAttendanceSuccess) {
          onAttendanceSuccess(newRecord);
        }
      } finally {
        setTimeout(() => {
          isProcessingRef.current = false;
        }, 800);
      }
    },
    [kegiatanAktif, statusMode, playBeep, onAttendanceSuccess, pengurusList]
  );

  // Ambil daftar kamera yang tersedia di perangkat
  const getCameras = useCallback(async () => {
    try {
      const devices = await Html5Qrcode.getCameras();
      if (devices && devices.length > 0) {
        setAvailableCameras(devices);
        return devices;
      }
    } catch (e) {
      console.warn("Tidak dapat mengambil daftar kamera:", e);
    }
    return [];
  }, []);

  // Jalankan Scanner Kamera
  const startCamera = async (targetCameraId?: string) => {
    setCameraError(null);
    setIsStartingCamera(true);

    try {
      // Inisialisasi scanner jika belum ada
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode("qr-camera-element", {
          verbose: false,
        });
      }

      // Jika scanner sedang aktif, matikan terlebih dahulu
      if (scannerRef.current.isScanning) {
        await scannerRef.current.stop();
      }

      // Deteksi kamera jika belum ada pilihan
      let camId = targetCameraId || selectedCameraId;
      if (!camId) {
        const devices = await getCameras();
        if (devices.length > 0) {
          // Prioritaskan kamera belakang / environment untuk mobile
          const backCam = devices.find((d) =>
            /back|rear|environment|belakang/i.test(d.label)
          );
          camId = backCam ? backCam.id : devices[0].id;
          setSelectedCameraId(camId);
        }
      }

      const qrConfig = {
        fps: 15,
        qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
          const edge = Math.min(viewfinderWidth, viewfinderHeight);
          const boxSize = Math.floor(edge * 0.72);
          return {
            width: Math.max(boxSize, 180),
            height: Math.max(boxSize, 180),
          };
        },
      };

      // Konfigurasi target kamera (ID kamera atau constraint)
      const cameraConfig: string | MediaTrackConstraints = camId
        ? camId
        : { facingMode: "environment" };

      try {
        await scannerRef.current.start(
          cameraConfig,
          qrConfig,
          (decodedText) => {
            handleProcessScan(decodedText);
          },
          () => {
            // Frame tick scanning loop
          }
        );
        setIsCameraActive(true);
      } catch (firstErr) {
        // Fallback untuk webcam laptop / PC jika facingMode environment ditolak
        console.warn("Kamera utama gagal dimulai, mencoba fallback user-facing:", firstErr);
        await scannerRef.current.start(
          { facingMode: "user" },
          qrConfig,
          (decodedText) => {
            handleProcessScan(decodedText);
          },
          () => {}
        );
        setIsCameraActive(true);
      }
    } catch (err: unknown) {
      console.error("Gagal memulai kamera:", err);
      const msg =
        err instanceof Error ? err.message : "Tidak dapat mengakses kamera perangkat.";
      setCameraError(
        `${msg}. Pastikan Anda telah memberikan izin (allow permission) akses kamera pada browser Anda.`
      );
      setIsCameraActive(false);
    } finally {
      setIsStartingCamera(false);
    }
  };

  // Matikan Scanner Kamera
  const stopCamera = async () => {
    try {
      if (scannerRef.current && scannerRef.current.isScanning) {
        await scannerRef.current.stop();
      }
    } catch (err) {
      console.warn("Gagal menghentikan kamera:", err);
    } finally {
      setIsCameraActive(false);
    }
  };

  // Ganti ke kamera lain jika ada beberapa perangkat kamera
  const handleSwitchCamera = async () => {
    if (availableCameras.length <= 1) return;
    const currentIndex = availableCameras.findIndex(
      (c) => c.id === selectedCameraId
    );
    const nextIndex = (currentIndex + 1) % availableCameras.length;
    const nextCamera = availableCameras[nextIndex];
    setSelectedCameraId(nextCamera.id);

    if (isCameraActive) {
      await startCamera(nextCamera.id);
    }
  };

  // Bersihkan saat unmount
  useEffect(() => {
    // Muat daftar kamera saat pertama kali mount
    getCameras();

    return () => {
      if (scannerRef.current) {
        if (scannerRef.current.isScanning) {
          scannerRef.current
            .stop()
            .catch(() => {})
            .finally(() => {
              try {
                scannerRef.current?.clear();
              } catch {
                // ignore
              }
            });
        } else {
          try {
            scannerRef.current.clear();
          } catch {
            // ignore
          }
        }
      }
    };
  }, [getCameras]);

  // Upload Gambar QR Code
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Jika kamera aktif, hentikan sejenak agar scanFile tidak bentrok
      if (scannerRef.current && scannerRef.current.isScanning) {
        await scannerRef.current.stop();
        setIsCameraActive(false);
      }

      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode("qr-camera-element", {
          verbose: false,
        });
      }

      const result = await scannerRef.current.scanFile(file, true);
      handleProcessScan(result);
    } catch (err) {
      console.warn("Gagal memindai file QR code:", err);
      playBeep("warning");
      setCameraError(
        "Tidak dapat membaca QR code dari gambar yang diunggah. Pastikan QR code terlihat jelas dan tidak terpotong."
      );
    } finally {
      e.target.value = "";
    }
  };

  return (
    <div className="bg-white dark:bg-[#001438] rounded-none border border-[#00296E]/20 dark:border-white/10 p-5 sm:p-7 shadow-none space-y-6 max-w-3xl mx-auto">
      {/* Header Scanner & Kontrol Kegiatan */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#00296E]/15 dark:border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isCameraActive ? "bg-emerald-500 animate-pulse" : "bg-slate-300 dark:bg-slate-600"
              }`}
            />
            <h3 className="text-base sm:text-lg font-extrabold text-[#00296E] dark:text-white uppercase tracking-tight">
              Pemindai Kamera QR Code Absensi
            </h3>
          </div>
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-500 dark:text-slate-400 mt-1">
            <span className="flex items-center gap-1.5">
              <CalendarBlank className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
              <span>
                Kegiatan Aktif:{" "}
                <strong className="text-slate-800 dark:text-slate-200">{kegiatanAktif}</strong>
              </span>
            </span>
            {kegiatanTanggal && (
              <span className="text-slate-400 dark:text-slate-500">• {kegiatanTanggal}</span>
            )}
            {kegiatanJam && (
              <span className="flex items-center gap-1 text-[#00296E] dark:text-sky-300 font-bold bg-sky-50 dark:bg-white/10 px-2 py-0.5 rounded-none border border-sky-200 dark:border-white/10">
                <Clock className="w-3 h-3 text-sky-600 dark:text-sky-400" />
                <span>{kegiatanJam}</span>
              </span>
            )}
          </div>
        </div>

        {/* Status Mode (Hadir / Terlambat) + Sound Toggle */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center p-1 bg-slate-100 dark:bg-white/10 rounded-none border border-slate-200 dark:border-white/10">
            <button
              type="button"
              onClick={() => setStatusMode("Hadir")}
              className={`px-3 py-1.5 rounded-none text-xs font-bold transition-all cursor-pointer ${
                statusMode === "Hadir"
                  ? "bg-emerald-600 text-white shadow-none"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Hadir Tepat Waktu
            </button>
            <button
              type="button"
              onClick={() => setStatusMode("Terlambat")}
              className={`px-3 py-1.5 rounded-none text-xs font-bold transition-all cursor-pointer ${
                statusMode === "Terlambat"
                  ? "bg-amber-600 text-white shadow-none"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Terlambat
            </button>
          </div>

          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 rounded-none border border-slate-200 dark:border-white/15 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/10 cursor-pointer"
            title={soundEnabled ? "Nonaktifkan Suara Beep" : "Aktifkan Suara Beep"}
          >
            {soundEnabled ? (
              <SpeakerHigh className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <SpeakerSlash className="w-4 h-4 text-slate-400" />
            )}
          </button>
        </div>
      </div>

      {/* Area Kamera Viewfinder */}
      <div className="flex flex-col items-center">
        <div className="w-full relative aspect-video min-h-[300px] max-h-[400px] rounded-none overflow-hidden bg-slate-950 border border-slate-800 dark:border-white/10 flex items-center justify-center text-white shadow-none">
          {/* Target element untuk html5-qrcode (WAJIB selalu ter-render dengan dimensi nyata) */}
          <div
            id="qr-camera-element"
            className="w-full h-full flex items-center justify-center overflow-hidden"
          />

          {/* Placeholder saat kamera belum aktif */}
          {!isCameraActive && (
            <div className="absolute inset-0 z-10 bg-slate-950/95 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center space-y-3">
              <div className="w-16 h-16 rounded-none bg-white/10 mx-auto flex items-center justify-center text-sky-400 border border-white/15">
                <Camera className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white uppercase tracking-wider">Kamera Belum Aktif</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Klik tombol di bawah untuk mengaktifkan kamera laptop / HP admin guna memindai QR code pengurus secara langsung.
                </p>
              </div>
            </div>
          )}

          {/* Viewfinder Reticle Overlay saat kamera aktif */}
          {isCameraActive && (
            <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center">
              <div className="w-56 h-56 sm:w-64 sm:h-64 border-2 border-[#0094E0] rounded-none relative shadow-[0_0_0_9999px_rgba(0,0,0,0.52)]">
                {/* Laser scan line animation */}
                <div className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-[#0094E0] to-transparent animate-bounce shadow-[0_0_12px_#0094E0]" />

                {/* Corner highlights */}
                <div className="absolute -top-1 -left-1 w-4 h-4 border-t-3 border-l-3 border-sky-300" />
                <div className="absolute -top-1 -right-1 w-4 h-4 border-t-3 border-r-3 border-sky-300" />
                <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-3 border-l-3 border-sky-300" />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-3 border-r-3 border-sky-300" />

                <div className="absolute -top-7 left-1/2 -translate-x-1/2 text-[10px] font-bold text-sky-300 uppercase tracking-widest bg-black/75 px-2.5 py-1 rounded-none border border-sky-500/30 whitespace-nowrap">
                  Arahkan QR Code ke Sini
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Kontrol Kamera & Upload File */}
        <div className="w-full mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {!isCameraActive ? (
              <button
                type="button"
                onClick={() => startCamera()}
                disabled={isStartingCamera}
                className="px-5 py-2.5 rounded-none bg-[#00296E] hover:bg-[#001f54] text-white text-xs font-bold transition-all shadow-none flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50 uppercase tracking-wider"
              >
                {isStartingCamera ? (
                  <>
                    <Spinner className="w-4 h-4 animate-spin text-sky-300" />
                    <span>Mempersiapkan Kamera...</span>
                  </>
                ) : (
                  <>
                    <Camera className="w-4 h-4 text-sky-300" />
                    <span>Aktifkan Kamera Pemindai</span>
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={stopCamera}
                className="px-5 py-2.5 rounded-none bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-none flex items-center gap-2 cursor-pointer active:scale-95 uppercase tracking-wider"
              >
                <CameraSlash className="w-4 h-4" />
                <span>Matikan Kamera</span>
              </button>
            )}

            {/* Tombol Ganti Kamera jika ada lebih dari 1 kamera */}
            {availableCameras.length > 1 && (
              <button
                type="button"
                onClick={handleSwitchCamera}
                className="px-3.5 py-2.5 rounded-none border border-[#00296E]/20 dark:border-white/20 hover:bg-slate-50 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Ganti Kamera (Depan / Belakang)"
              >
                <CameraRotate className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                <span>Ganti Kamera</span>
              </button>
            )}

            {/* Upload Foto QR Code */}
            <label className="px-4 py-2.5 rounded-none border border-[#00296E]/20 dark:border-white/20 hover:bg-slate-50 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer">
              <UploadSimple className="w-4 h-4 text-[#0094E0] dark:text-[#38BDF8]" />
              <span>Pindai dari File Gambar</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          <span className="text-[11px] text-slate-400 dark:text-slate-500">
            Arahkan kamera ke layar HP / ID card pengurus
          </span>
        </div>

        {/* Notifikasi Popover Berhasil Absen */}
        {lastScannedResult && (
          <div className="w-full mt-4 p-4 rounded-none bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/30 shadow-none animate-in fade-in slide-in-from-top-2 duration-200 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-none overflow-hidden bg-slate-100 dark:bg-slate-800 border border-emerald-300 dark:border-emerald-500/40 shrink-0">
                <img
                  src={lastScannedResult.image}
                  alt={lastScannedResult.nama}
                  className="w-full h-full object-cover object-top"
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/50 px-2 py-0.5 rounded-none">
                    <CheckCircle className="w-3 h-3" />
                    <span>Presensi Berhasil</span>
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                    {lastScannedResult.waktu} WIB
                  </span>
                </div>
                <h4 className="text-sm font-extrabold text-[#00296E] dark:text-white mt-0.5">
                  {lastScannedResult.nama} ({lastScannedResult.nim})
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                  {lastScannedResult.jabatan} •{" "}
                  <span className="font-bold text-[#0094E0] dark:text-[#38BDF8]">
                    {lastScannedResult.divisi}
                  </span>
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setLastScannedResult(null)}
              className="p-1.5 rounded-none text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-emerald-100 dark:hover:bg-emerald-900/50 cursor-pointer"
              aria-label="Tutup"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Feedback Peringatan Error / Ganda */}
        {cameraError && (
          <div className="w-full mt-3 p-3 rounded-none bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-500/30 text-rose-800 dark:text-rose-200 text-xs flex items-center gap-2">
            <WarningCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            <span>{cameraError}</span>
          </div>
        )}

        {duplicateWarning && (
          <div className="w-full mt-3 p-3 rounded-none bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-500/30 text-amber-800 dark:text-amber-200 text-xs flex items-center gap-2">
            <WarningCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>{duplicateWarning}</span>
          </div>
        )}
      </div>
    </div>
  );
}
