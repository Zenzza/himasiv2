"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  getErrorConfig,
  sanitizeRedirectUrl,
} from "@/lib/constants/error-configs";
import {
  House,
  SquaresFour,
  SignIn,
  ArrowsClockwise,
} from "@phosphor-icons/react";

interface ErrorLayoutProps {
  code: string;
  error?: Error & { digest?: string };
  reset?: () => void;
}

function ErrorLayoutContent({ code, error, reset }: ErrorLayoutProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const config = getErrorConfig(code);

  const [countdown, setCountdown] = useState<number>(config.countdownSeconds || 60);

  // Read optional redirect target for 401 session expiration
  const redirectTarget = searchParams?.get("redirect") || searchParams?.get("from") || "";
  const safeRedirect = sanitizeRedirectUrl(redirectTarget);

  const pageTitle = `${config.title} - HIMASI`;

  // Set document title and dismiss any global preloader/loading screen immediately upon error page mount
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.title = pageTitle;
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    }
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("himasi:dismiss-preloader"));
    }
  }, [pageTitle]);

  // Countdown timer logic for rate limiting (429)
  useEffect(() => {
    if (!config.showCountdown) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [config.showCountdown]);

  const handleActionClick = () => {
    const actionType = config.primaryAction.actionType;
    if (actionType === "reload") {
      window.location.reload();
    } else if (actionType === "reset") {
      if (reset) {
        reset();
      } else {
        window.location.reload();
      }
    } else if (config.primaryAction.href) {
      router.push(config.primaryAction.href);
    }
  };

  // Compute contextual primary href
  const primaryHref =
    config.code === "401" && safeRedirect
      ? `/login?redirect=${encodeURIComponent(safeRedirect)}`
      : config.primaryAction.href;

  return (
    <>
      <title>{pageTitle}</title>
      <meta name="description" content={config.description} />
      <meta name="robots" content="noindex, nofollow" />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={config.description} />
      <div
        id="himasi-error-view"
        className="fixed inset-0 z-[100] bg-white text-[#091e42] flex flex-col items-center justify-center p-6 text-center select-none overflow-y-auto min-h-screen"
      >
      {/* Subtle HIMASI Light Ambient Glow on White Canvas */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] sm:w-[550px] h-[350px] bg-[#0094E0]/[0.05] blur-[120px] rounded-full pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-10 left-1/2 -translate-x-1/2 w-[300px] sm:w-[450px] h-[250px] bg-[#00296E]/[0.03] blur-[100px] rounded-full pointer-events-none"
        aria-hidden="true"
      />

      {/* Main Content Container */}
      <div className="relative z-10 flex flex-col items-center max-w-xl mx-auto my-auto py-8">
        {/* Massive Jumbo Status Code (Footer Watermark Style with Downward Fade) */}
        <div className="relative mb-2 flex items-center justify-center">
          <h1
            className="text-8xl sm:text-9xl md:text-[14rem] font-black tracking-tighter leading-none select-none bg-gradient-to-b from-[#00296E]/30 via-[#00296E]/15 to-transparent bg-clip-text text-transparent"
            style={{
              WebkitMaskImage:
                "linear-gradient(to bottom, black 25%, rgba(0, 0, 0, 0.15) 80%, transparent 100%)",
              maskImage:
                "linear-gradient(to bottom, black 25%, rgba(0, 0, 0, 0.15) 80%, transparent 100%)",
              fontFamily: "inherit",
            }}
          >
            {config.code}
          </h1>
        </div>

        {/* Error Headline */}
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#00296E] tracking-tight mb-3">
          {config.title}
        </h2>

        {/* Error Contextual Description */}
        <p className="text-slate-500 text-sm sm:text-base max-w-md mx-auto mb-8 leading-relaxed font-normal">
          {config.description}
        </p>

        {/* Single Contextual Action Button (Tailored to each error code) */}
        <div className="flex items-center justify-center w-full">
          {primaryHref && config.primaryAction.actionType === "link" ? (
            <Link
              href={primaryHref}
              className="rounded-full px-8 py-3.5 bg-[#00296E] hover:bg-[#001f54] text-white text-sm font-semibold shadow-md hover:shadow-lg transition-all duration-200 active:scale-95 inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              {config.code === "404" ? (
                <House className="w-4 h-4 text-sky-300" />
              ) : config.code === "403" ? (
                <SquaresFour className="w-4 h-4 text-sky-300" />
              ) : config.code === "401" ? (
                <SignIn className="w-4 h-4 text-sky-300" />
              ) : (
                <House className="w-4 h-4 text-sky-300" />
              )}
              <span>{config.primaryAction.label}</span>
            </Link>
          ) : (
            <button
              onClick={handleActionClick}
              disabled={config.showCountdown && countdown > 0}
              className={`rounded-full px-8 py-3.5 text-sm font-semibold transition-all duration-200 active:scale-95 inline-flex items-center justify-center gap-2 cursor-pointer shadow-md ${
                config.showCountdown && countdown > 0
                  ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                  : "bg-[#00296E] hover:bg-[#001f54] text-white hover:shadow-lg"
              }`}
            >
              <ArrowsClockwise
                className={`w-4 h-4 text-sky-300 ${
                  config.showCountdown && countdown > 0 ? "animate-spin" : ""
                }`}
              />
              <span>
                {config.showCountdown && countdown > 0
                  ? `Tunggu (${countdown}s)`
                  : config.primaryAction.label}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  </>
);
}

export default function ErrorLayout(props: ErrorLayoutProps) {
  return (
    <Suspense fallback={<div className="fixed inset-0 z-[100] bg-white" />}>
      <ErrorLayoutContent {...props} />
    </Suspense>
  );
}
