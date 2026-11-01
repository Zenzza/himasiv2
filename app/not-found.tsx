import type { Metadata } from "next";
import ErrorLayout from "@/components/ui/error-layout";

export const metadata: Metadata = {
  title: "Halaman Tidak Ditemukan - HIMASI",
  description: "Maaf, halaman yang Anda tuju tidak tersedia atau tautan keliru.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function NotFound() {
  return <ErrorLayout code="404" />;
}


