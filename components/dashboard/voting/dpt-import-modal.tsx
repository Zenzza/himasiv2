"use client";

import React, { useState } from "react";
import {
  X,
  Check,
  ArrowClockwise,
  UploadSimple,
  FileText,
  CheckCircle,
} from "@phosphor-icons/react";
import { parseDPTBatchCSV } from "@/lib/utils/voting-helpers";
import type { DPTImportPreviewItem } from "@/lib/types/voting";

interface DPTImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (
    items: Array<{ nim: string; nama_lengkap: string; tanggal_lahir: string }>
  ) => Promise<{ inserted: number; skipped: number }>;
}

export default function DPTImportModal({
  isOpen,
  onClose,
  onImport,
}: DPTImportModalProps) {
  const [rawText, setRawText] = useState("");
  const [parsedValid, setParsedValid] = useState<
    Array<{ nim: string; nama_lengkap: string; tanggal_lahir: string }>
  >([]);
  const [parsedInvalid, setParsedInvalid] = useState<DPTImportPreviewItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importSummary, setImportSummary] = useState<{
    inserted: number;
    skipped: number;
  } | null>(null);

  const handleClose = () => {
    setRawText("");
    setParsedValid([]);
    setParsedInvalid([]);
    setImportSummary(null);
    onClose();
  };

  if (!isOpen) return null;

  const handleParse = (text: string) => {
    setRawText(text);
    setImportSummary(null);
    if (!text.trim()) {
      setParsedValid([]);
      setParsedInvalid([]);
      return;
    }
    const { valid, invalid } = parseDPTBatchCSV(text);
    setParsedValid(valid);
    setParsedInvalid(invalid);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        handleParse(content);
      }
    };
    reader.readAsText(file);
  };

  const handleCommitImport = async () => {
    if (parsedValid.length === 0) return;
    setIsProcessing(true);
    try {
      const res = await onImport(parsedValid);
      setImportSummary(res);
      setRawText("");
      setParsedValid([]);
      setParsedInvalid([]);
    } catch {
      // handle error
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-[#001438] border border-[#00296E]/20 dark:border-white/15 rounded-none max-w-2xl w-full shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#00296E]/15 dark:border-white/10">
          <div className="flex items-center gap-2">
            <UploadSimple className="w-5 h-5 text-[#00296E] dark:text-[#38BDF8]" />
            <div>
              <h3 className="text-sm font-bold text-[#00296E] dark:text-white font-mono uppercase tracking-wider">
                Import Batch Data DPT Mahasiswa
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Mendukung paste teks CSV/Excel atau upload file .csv
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded-none text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {importSummary ? (
            <div className="p-5 rounded-none bg-emerald-500/10 border border-emerald-500/30 text-center space-y-2">
              <div className="w-10 h-10 rounded-none bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30">
                <CheckCircle className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-slate-900 dark:text-white text-sm font-mono uppercase tracking-wider">
                Proses Import Batch Berhasil Selesai!
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-mono">
                {importSummary.inserted} data berhasil ditambahkan • {importSummary.skipped} data duplikat/dilewati.
              </p>
              <button
                type="button"
                onClick={handleClose}
                className="mt-3 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-white bg-emerald-600 hover:bg-emerald-700 rounded-none shadow-none cursor-pointer"
              >
                Tutup Jendela
              </button>
            </div>
          ) : (
            <>
              {/* Petunjuk Format */}
              <div className="p-3.5 rounded-none bg-blue-50/60 dark:bg-white/5 border border-[#00296E]/20 dark:border-white/15 text-xs text-slate-600 dark:text-slate-300 space-y-1">
                <span className="font-mono font-bold text-[#00296E] dark:text-[#38BDF8] block uppercase tracking-wider">
                  Format Header / Kolom yang Diterima:
                </span>
                <code className="bg-white dark:bg-[#001740] px-2 py-0.5 rounded-none border border-[#00296E]/15 dark:border-white/10 font-mono text-[11px] block text-[#00296E] dark:text-[#38BDF8]">
                  nim,nama_lengkap,tanggal_lahir
                </code>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Tanggal lahir mendukung format <strong className="text-slate-700 dark:text-slate-300">DD/MM/YYYY</strong>,{" "}
                  <strong className="text-slate-700 dark:text-slate-300">DD-MM-YYYY</strong>, maupun ISO{" "}
                  <strong className="text-slate-700 dark:text-slate-300">YYYY-MM-DD</strong>. Pemisah koma, titik koma (;), atau tab dari Excel otomatis terbaca.
                </p>
              </div>

              {/* Upload File & Textarea */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-mono font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Paste Teks CSV / Salinan Spreadsheet:
                  </label>
                  <label className="inline-flex items-center gap-1 text-[11px] font-mono text-[#00296E] dark:text-[#38BDF8] hover:underline cursor-pointer">
                    <FileText className="w-3.5 h-3.5" />
                    <span>Upload File CSV</span>
                    <input
                      type="file"
                      accept=".csv,.txt"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                  </label>
                </div>
                <textarea
                  rows={4}
                  value={rawText}
                  onChange={(e) => handleParse(e.target.value)}
                  placeholder="2211500001,Ahmad Pratama,17/08/2004&#10;2211500002,Siti Nurhaliza,2003-12-05"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-white/5 border border-[#00296E]/20 dark:border-white/20 rounded-none focus:outline-none focus:border-[#00296E] dark:focus:border-[#38BDF8] font-mono text-slate-900 dark:text-white"
                />
              </div>

              {/* Preview Ringkasan */}
              {(parsedValid.length > 0 || parsedInvalid.length > 0) && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Pratinjau Hasil Parsing ({parsedValid.length + parsedInvalid.length} Baris Terdeteksi):
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                        ✔ {parsedValid.length} Valid
                      </span>
                      {parsedInvalid.length > 0 && (
                        <span className="text-rose-600 dark:text-rose-400 font-semibold">
                          ✖ {parsedInvalid.length} Tidak Valid
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="max-h-48 overflow-y-auto border border-[#00296E]/15 dark:border-white/10 rounded-none">
                    <table className="w-full text-left text-xs font-mono border-collapse">
                      <thead className="bg-slate-50 dark:bg-[#001740] text-[10px] text-slate-600 dark:text-slate-400 uppercase tracking-wider sticky top-0 border-b border-[#00296E]/15 dark:border-white/10">
                        <tr>
                          <th className="p-2 border-r border-[#00296E]/15 dark:border-white/10">NIM</th>
                          <th className="p-2 border-r border-[#00296E]/15 dark:border-white/10">Nama</th>
                          <th className="p-2 border-r border-[#00296E]/15 dark:border-white/10">Tgl Lahir Normalisasi</th>
                          <th className="p-2">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#00296E]/10 dark:divide-white/10">
                        {parsedValid.slice(0, 10).map((v, i) => (
                          <tr key={`v-${i}`} className="hover:bg-slate-50/70 dark:hover:bg-white/[0.03]">
                            <td className="p-2 font-bold text-[#00296E] dark:text-[#38BDF8] border-r border-[#00296E]/10 dark:border-white/5">{v.nim}</td>
                            <td className="p-2 text-slate-900 dark:text-white border-r border-[#00296E]/10 dark:border-white/5">{v.nama_lengkap}</td>
                            <td className="p-2 text-slate-500 dark:text-slate-400 border-r border-[#00296E]/10 dark:border-white/5">{v.tanggal_lahir}</td>
                            <td className="p-2 text-emerald-600 dark:text-emerald-400 font-bold uppercase text-[10px] tracking-wider">Siap Import</td>
                          </tr>
                        ))}
                        {parsedInvalid.map((inv, i) => (
                          <tr key={`inv-${i}`} className="bg-rose-50/40 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400">
                            <td className="p-2 font-bold border-r border-rose-500/20">{inv.nim || "(kosong)"}</td>
                            <td className="p-2 border-r border-rose-500/20">{inv.nama_lengkap}</td>
                            <td className="p-2 border-r border-rose-500/20">{inv.raw_tanggal_lahir}</td>
                            <td className="p-2 text-[10px] uppercase tracking-wider">{inv.error_message}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {parsedValid.length > 10 && (
                    <p className="text-[10px] text-slate-400 font-mono text-center">
                      ... dan {parsedValid.length - 10} data valid lainnya.
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        {!importSummary && (
          <div className="px-6 py-4 flex items-center justify-end gap-2 border-t border-[#00296E]/15 dark:border-white/10 bg-slate-50 dark:bg-[#001740]">
            <button
              type="button"
              onClick={handleClose}
              disabled={isProcessing}
              className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 border border-[#00296E]/20 dark:border-white/20 rounded-none transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleCommitImport}
              disabled={isProcessing || parsedValid.length === 0}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white bg-[#00296E] hover:bg-[#001f54] disabled:opacity-50 rounded-none shadow-none transition cursor-pointer"
            >
              {isProcessing ? (
                <ArrowClockwise className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Check className="w-3.5 h-3.5" />
              )}
              Import {parsedValid.length} Data Valid
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
