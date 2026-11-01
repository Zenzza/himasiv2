"use client";

import { useEffect } from "react";
import ErrorLayout from "@/components/ui/error-layout";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled global root layout error:", error);
  }, [error]);

  return (
    <html lang="id">
      <head>
        <title>Terjadi Gangguan Server - HIMASI</title>
        <meta
          name="description"
          content="Sistem mengalami kendala tak terduga saat memproses permintaan Anda. Tim IT HIMASI sedang menangani kendala ini."
        />
        <meta name="robots" content="noindex, nofollow" />
      </head>
      <body className="bg-white text-[#091e42]">
        <ErrorLayout code="500" error={error} reset={reset} />
      </body>
    </html>
  );
}
