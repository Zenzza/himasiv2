"use client";

import { useState, useEffect, useRef } from "react";
import QRCode from "qrcode";
import { Download, QrCode as QrIcon, Check, Copy, Sparkles, UserCheck, Edit3, Trash2 } from "lucide-react";
import type { PengurusMember } from "@/lib/data/pengurus";

interface PengurusQrCardProps {
  member: PengurusMember;
  onClose?: () => void;
  onEdit?: (member: PengurusMember) => void;
  onDelete?: (member: PengurusMember) => void;
}

export default function PengurusQrCard({ member, onClose, onEdit, onDelete }: PengurusQrCardProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Generate QR Code dari token unik pengurus
  useEffect(() => {
    const generateQr = async () => {
      try {
        const qrPayload = JSON.stringify({
          nim: member.nim,
          nama: member.nama,
          divisi: member.divisi,
          jabatan: member.jabatan,
          token: member.qrToken,
        });

        const url = await QRCode.toDataURL(qrPayload, {
          width: 320,
          margin: 1.5,
          color: {
            dark: "#00296E",
            light: "#FFFFFF",
          },
        });
        setQrDataUrl(url);
      } catch (err) {
        console.error("Gagal generate QR Code:", err);
      }
    };

    generateQr();
  }, [member]);

  // Download QR Code PNG
  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const link = document.createElement("a");
    link.download = `QR_${member.nama.replace(/\s+/g, "_")}_${member.nim}.png`;
    link.href = qrDataUrl;
    link.click();
  };

  const handleCopyToken = () => {
    navigator.clipboard.writeText(member.qrToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col items-center max-w-sm w-full mx-auto select-none">
      
      {/* KARTU IDENTITAS DIGITAL PENGURUS (ID CARD) */}
      <div
        ref={cardRef}
        className="w-full rounded-[24px] bg-gradient-to-b from-[#00173d] via-[#00296E] to-[#00173d] text-white p-6 shadow-2xl border border-sky-400/30 relative overflow-hidden"
      >
        {/* Glow ambient */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-[#0094E0]/25 rounded-full blur-3xl pointer-events-none -mr-12 -mt-12" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-600/20 rounded-full blur-3xl pointer-events-none -ml-12 -mb-12" />

        {/* Card Header: Brand Logo & Title */}
        <div className="relative z-10 flex items-center justify-between pb-4 border-b border-white/15">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-white p-1 shadow-sm flex items-center justify-center">
              <img
                src="/logo-himasi.png"
                alt="Logo HIMASI"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h3 className="text-xs font-black tracking-tight text-white leading-none">
                HIMASI ATMA LUHUR
              </h3>
              <p className="text-[10px] text-sky-300 font-semibold mt-0.5">
                KABINET REKSABUDAYA
              </p>
            </div>
          </div>

          <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-sky-400/20 text-sky-200 border border-sky-300/30">
            ID PENGURUS
          </span>
        </div>

        {/* Profil Singkat: Foto & Biodata */}
        <div className="relative z-10 my-5 flex items-center gap-3.5">
          <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl overflow-hidden border-2 border-white/40 shadow-md shrink-0 bg-slate-800">
            <img
              src={member.image}
              alt={member.nama}
              className="w-full h-full object-cover object-top"
            />
          </div>
          <div className="overflow-hidden flex-1">
            <h4 className="text-sm font-extrabold text-white truncate leading-tight">
              {member.nama}
            </h4>
            <p className="text-xs font-semibold text-sky-300 truncate mt-0.5">
              {member.jabatan}
            </p>
            <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-300">
              <span className="font-mono bg-white/10 px-1.5 py-0.5 rounded border border-white/10">
                {member.nim}
              </span>
              <span>•</span>
              <span className="font-bold text-sky-200">{member.divisi}</span>
            </div>
          </div>
        </div>

        {/* Kotak QR Code Pemindai Absensi */}
        <div className="relative z-10 bg-white p-3.5 rounded-2xl shadow-inner flex flex-col items-center justify-center text-slate-800">
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt={`QR Code ${member.nama}`}
              className="w-48 h-48 object-contain rounded-xl"
            />
          ) : (
            <div className="w-48 h-48 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-[#00296E] border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          <div className="mt-2 text-center">
            <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
              SCAN UNTUK ABSENSI RESMI
            </p>
            <p className="text-[11px] font-mono font-bold text-[#00296E]">
              {member.qrToken}
            </p>
          </div>
        </div>

        {/* Footer Kartu */}
        <div className="relative z-10 mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-300">
          <span>Periode 2026/2027</span>
          <span className="flex items-center gap-1 text-emerald-300 font-semibold">
            <UserCheck className="w-3 h-3" />
            <span>Terverifikasi Aktif</span>
          </span>
        </div>

      </div>

      {/* Action Buttons */}
      <div className="w-full mt-4 space-y-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDownloadQr}
            className="flex-1 py-2.5 px-3 rounded-xl bg-[#00296E] hover:bg-[#001f54] text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <Download className="w-4 h-4 text-sky-300" />
            <span>Unduh QR Code</span>
          </button>

          <button
            type="button"
            onClick={handleCopyToken}
            className="py-2.5 px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all border border-slate-200 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
            title="Salin Token QR"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Tersalin!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Token</span>
              </>
            )}
          </button>
        </div>

        {(onEdit || onDelete) && (
          <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
            {onEdit && (
              <button
                type="button"
                onClick={() => onEdit(member)}
                className="flex-1 py-2 px-3 rounded-xl bg-sky-50 hover:bg-sky-100 text-[#00296E] text-xs font-bold transition-all border border-sky-200 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Edit3 className="w-3.5 h-3.5 text-[#0094E0]" />
                <span>Edit Data</span>
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={() => onDelete(member)}
                className="py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold transition-all border border-rose-200 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                title="Hapus Peserta"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus</span>
              </button>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
