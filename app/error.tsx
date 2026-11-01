"use client";

import { useEffect } from "react";
import ErrorLayout from "@/components/ui/error-layout";

export default function RootError({
  error,
  reset,
  retry,
}: {
  error: Error & { digest?: string };
  reset?: () => void;
  retry?: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled runtime error captured by error.tsx:", error);
  }, [error]);

  const handleReset = reset || retry;
  return <ErrorLayout code="500" error={error} reset={handleReset} />;
}

