"use client";

import React, { Component, type ReactNode } from "react";
import { WarningCircle, ArrowsClockwise } from "@phosphor-icons/react";

interface Props {
  children: ReactNode;
  moduleName?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class DashboardTabErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`[DashboardErrorBoundary] Terjadi kesalahan pada modul "${this.props.moduleName || "Dashboard"}":`, error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 sm:p-8 bg-white dark:bg-[#001438] border border-rose-500/30 dark:border-rose-500/20 rounded-none shadow-none text-slate-900 dark:text-white my-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-none bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 flex items-center justify-center shrink-0">
              <WarningCircle className="w-6 h-6" />
            </div>

            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-mono uppercase tracking-widest text-rose-600 dark:text-rose-400 font-bold">
                Gangguan Komponen Modul
              </span>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5">
                Gagal Memuat Modul {this.props.moduleName || "Dashboard"}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                Terjadi kendala saat memuat atau merender komponen modul ini. Hal ini dapat disebabkan oleh fluktuasi koneksi internet saat mengunduh berkas dinamis atau respon server yang terputus.
              </p>

              {this.state.error && (
                <div className="mt-3 p-3 bg-slate-50 dark:bg-[#001740] border border-slate-200 dark:border-white/10 text-[11px] font-mono text-slate-600 dark:text-slate-400 break-all select-all">
                  {this.state.error.message || String(this.state.error)}
                </div>
              )}

              <div className="mt-4 flex items-center gap-3">
                <button
                  type="button"
                  onClick={this.handleRetry}
                  className="px-4 py-2 rounded-none bg-[#00296E] hover:bg-[#001f54] text-white text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-2 cursor-pointer shadow-none active:scale-95"
                >
                  <ArrowsClockwise className="w-3.5 h-3.5 text-sky-300" />
                  <span>Coba Muat Ulang Modul</span>
                </button>

                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 rounded-none bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 text-xs font-semibold uppercase tracking-wider transition-colors border border-slate-200 dark:border-white/10 cursor-pointer"
                >
                  Refresh Halaman
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
