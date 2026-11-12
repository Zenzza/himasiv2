"use client";

import React from "react";
import Link from "next/link";
import { ArrowsClockwise, ArrowSquareOut } from "@phosphor-icons/react";

export interface DashboardPageHeaderAction {
  label: string;
  onClick?: () => void;
  icon?: React.ReactNode;
  href?: string;
  disabled?: boolean;
}

export interface DashboardPageHeaderProps {
  title: string;
  subtitle: string;
  badge?: React.ReactNode;
  onRefresh?: () => void;
  refreshLoading?: boolean;
  publicUrl?: string;
  publicLabel?: string;
  primaryAction?: DashboardPageHeaderAction;
  secondaryAction?: DashboardPageHeaderAction;
  children?: React.ReactNode;
}

export default function DashboardPageHeader({
  title,
  subtitle,
  badge,
  onRefresh,
  refreshLoading = false,
  publicUrl,
  publicLabel = "Lihat Halaman Publik",
  primaryAction,
  secondaryAction,
  children,
}: DashboardPageHeaderProps) {
  return (
    <div className="bg-white dark:bg-[#001438] p-4 sm:p-5 border border-[#00296E]/15 dark:border-white/10 shadow-none flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div className="min-w-0 flex-1">
        <h2 className="text-base sm:text-lg font-semibold text-[#00296E] dark:text-white uppercase tracking-wider flex flex-wrap items-center gap-2.5">
          <span>{title}</span>
          {badge}
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          {subtitle}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 shrink-0">
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshLoading}
            className="p-2 rounded-none border border-[#00296E]/20 dark:border-white/20 bg-white dark:bg-[#001740] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer disabled:opacity-50 transition-colors"
            title="Segarkan data dari database"
          >
            <ArrowsClockwise
              className={`w-4 h-4 text-slate-500 dark:text-slate-400 ${
                refreshLoading ? "animate-spin text-slate-800 dark:text-white" : ""
              }`}
            />
          </button>
        )}

        {publicUrl && (
          <Link
            href={publicUrl}
            target="_blank"
            className="px-3 py-2 rounded-none border border-[#00296E]/20 dark:border-white/20 bg-white dark:bg-[#001740] hover:bg-slate-50 dark:hover:bg-white/5 text-slate-700 dark:text-slate-200 text-xs font-semibold uppercase tracking-wider transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowSquareOut className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span>{publicLabel}</span>
          </Link>
        )}

        {secondaryAction && (
          secondaryAction.href ? (
            <Link
              href={secondaryAction.href}
              className="px-3 py-2 rounded-none border border-[#00296E]/20 dark:border-white/20 bg-white dark:bg-[#001740] hover:bg-slate-50 dark:hover:bg-white/5 text-slate-700 dark:text-slate-200 text-xs font-semibold uppercase tracking-wider transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              {secondaryAction.icon}
              <span>{secondaryAction.label}</span>
            </Link>
          ) : (
            <button
              type="button"
              onClick={secondaryAction.onClick}
              disabled={secondaryAction.disabled}
              className="px-3 py-2 rounded-none border border-[#00296E]/20 dark:border-white/20 bg-white dark:bg-[#001740] hover:bg-slate-50 dark:hover:bg-white/5 text-slate-700 dark:text-slate-200 text-xs font-semibold uppercase tracking-wider transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {secondaryAction.icon}
              <span>{secondaryAction.label}</span>
            </button>
          )
        )}

        {primaryAction && (
          primaryAction.href ? (
            <Link
              href={primaryAction.href}
              className="px-3.5 py-2 rounded-none bg-[#00296E] hover:bg-[#001f54] text-white text-xs font-semibold uppercase tracking-wider transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              {primaryAction.icon}
              <span>{primaryAction.label}</span>
            </Link>
          ) : (
            <button
              type="button"
              onClick={primaryAction.onClick}
              disabled={primaryAction.disabled}
              className="px-3.5 py-2 rounded-none bg-[#00296E] hover:bg-[#001f54] text-white text-xs font-semibold uppercase tracking-wider transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {primaryAction.icon}
              <span>{primaryAction.label}</span>
            </button>
          )
        )}

        {children}
      </div>
    </div>
  );
}

