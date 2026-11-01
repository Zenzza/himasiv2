"use client";

import { useEffect } from "react";
import ErrorLayout from "@/components/ui/error-layout";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled runtime error captured by error.tsx:", error);
  }, [error]);

  return <ErrorLayout code="500" error={error} reset={reset} />;
}

