"use client";

import React from "react";

export type MetricVariant = "default" | "success" | "warning" | "danger" | "info";

export interface MetricItem {
  order: string; // e.g. "01."
  label: string; // e.g. "TOTAL BERITA"
  value: number | string;
  sublabel?: string; // e.g. "Artikel"
  variant?: MetricVariant;
  icon: React.ReactNode;
  loading?: boolean;
  onClick?: () => void;
}

export interface DashboardMetricStripProps {
  metrics: MetricItem[];
  columns?: 3 | 4;
}

const VARIANT_STYLES: Record<
  MetricVariant,
  {
    label: string;
    value: string;
    sublabel: string;
    iconBox: string;
    pulse: string;
  }
> = {
  default: {
    label: "text-slate-400 dark:text-slate-500",
    value: "text-slate-900 dark:text-white",
    sublabel: "text-slate-400 font-sans",
    iconBox: "border-[#00296E]/15 dark:border-white/10 bg-[#00296E]/5 dark:bg-white/5 text-[#00296E] dark:text-[#38BDF8]",
    pulse: "bg-slate-200 dark:bg-white/10",
  },
  success: {
    label: "text-emerald-600 dark:text-emerald-400",
    value: "text-emerald-600 dark:text-emerald-400",
    sublabel: "text-emerald-500 font-sans",
    iconBox: "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    pulse: "bg-emerald-100 dark:bg-emerald-950/40",
  },
  warning: {
    label: "text-amber-600 dark:text-amber-400",
    value: "text-amber-600 dark:text-amber-400",
    sublabel: "text-amber-500 font-sans",
    iconBox: "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400",
    pulse: "bg-amber-100 dark:bg-amber-950/40",
  },
  danger: {
    label: "text-rose-600 dark:text-rose-400",
    value: "text-rose-600 dark:text-rose-400",
    sublabel: "text-rose-500 font-sans",
    iconBox: "border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400",
    pulse: "bg-rose-100 dark:bg-rose-950/40",
  },
  info: {
    label: "text-sky-600 dark:text-sky-400",
    value: "text-sky-600 dark:text-sky-400",
    sublabel: "text-sky-500 font-sans",
    iconBox: "border-sky-500/20 bg-sky-500/10 text-sky-600 dark:text-sky-400",
    pulse: "bg-sky-100 dark:bg-sky-950/40",
  },
};

export default function DashboardMetricStrip({
  metrics,
  columns,
}: DashboardMetricStripProps) {
  const actualCols = columns || (metrics.length >= 4 ? 4 : 3);

  const colClass =
    actualCols === 4
      ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
      : "grid-cols-1 sm:grid-cols-3";

  return (
    <div
      className={`grid ${colClass} divide-y sm:divide-y-0 sm:divide-x divide-[#00296E]/15 dark:divide-white/10 border border-[#00296E]/15 dark:border-white/10 bg-white dark:bg-[#001438]`}
    >
      {metrics.map((item, index) => {
        const variant = item.variant || "default";
        const styles = VARIANT_STYLES[variant];

        return (
          <div
            key={index}
            onClick={item.onClick}
            className={`p-4 flex items-center justify-between gap-3 ${
              item.onClick
                ? "cursor-pointer hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors"
                : ""
            }`}
          >
            <div className="min-w-0">
              <p
                className={`text-[10px] font-mono uppercase tracking-widest ${styles.label}`}
              >
                {item.order} {item.label}
              </p>
              <div className={`text-2xl font-light mt-1 ${styles.value}`}>
                {item.loading ? (
                  <span
                    className={`inline-block w-14 h-5 animate-pulse ${styles.pulse}`}
                  />
                ) : (
                  <span className="font-mono">
                    {item.value}{" "}
                    {item.sublabel && (
                      <span className={`text-xs ml-1 ${styles.sublabel}`}>
                        {item.sublabel}
                      </span>
                    )}
                  </span>
                )}
              </div>
            </div>

            <div
              className={`w-8 h-8 rounded-none border shrink-0 flex items-center justify-center ${styles.iconBox}`}
            >
              {item.icon}
            </div>
          </div>
        );
      })}
    </div>
  );
}

