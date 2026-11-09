import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/navbar";
import BackToTop from "@/components/back-to-top";
import LoadingScreen from "@/components/loading-screen";
import ScrollToTopOnNav from "@/components/scroll-to-top-on-nav";
import { PhosphorIconProvider } from "@/components/providers/phosphor-icon-provider";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "HIMASI - Himpunan Mahasiswa Sistem Informasi",
  description:
    "Portal resmi Himpunan Mahasiswa Sistem Informasi (HIMASI). Pusat informasi akademik, program kerja, aspirasi mahasiswa, kalender kegiatan semester, dan pusat prestasi.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning className={`${poppins.variable} min-h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans bg-white dark:bg-[#001740] text-[#091e42] dark:text-slate-100 selection:bg-[#0094E0]/20 selection:text-[#00296E]">
        <PhosphorIconProvider>
          <ScrollToTopOnNav />
          <LoadingScreen>
            <Navbar />
            <main className="flex-1 w-full overflow-x-clip max-w-full">{children}</main>
            <BackToTop />
          </LoadingScreen>
        </PhosphorIconProvider>
      </body>
    </html>
  );
}
