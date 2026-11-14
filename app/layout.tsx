import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/navbar";
import BackToTop from "@/components/back-to-top";
import LoadingScreen from "@/components/loading-screen";
import ScrollToTopOnNav from "@/components/scroll-to-top-on-nav";
import { PhosphorIconProvider } from "@/components/providers/phosphor-icon-provider";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

export const viewport: Viewport = {
  themeColor: "#00296E",
  width: "device-width",
  initialScale: 1,
};

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://himasi.atmaluhur.ac.id"
  ),
  title: {
    default: "HIMASI - Himpunan Mahasiswa Sistem Informasi ISB Atma Luhur",
    template: "%s | HIMASI Atma Luhur",
  },
  description:
    "Portal resmi Himpunan Mahasiswa Sistem Informasi (HIMASI) ISB Atma Luhur. Pusat warta organisasi, kalender akademik semester, aspirasi mahasiswa, e-voting, dan apresiasi prestasi.",
  keywords: [
    "HIMASI",
    "Sistem Informasi",
    "ISB Atma Luhur",
    "Himpunan Mahasiswa",
    "Atma Luhur Pangkalpinang",
    "Mahasiswa SI",
  ],
  authors: [{ name: "HIMASI ISB Atma Luhur" }],
  creator: "HIMASI ISB Atma Luhur",
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: "https://himasi.atmaluhur.ac.id",
    title: "HIMASI - Himpunan Mahasiswa Sistem Informasi ISB Atma Luhur",
    description:
      "Portal resmi Himpunan Mahasiswa Sistem Informasi (HIMASI) ISB Atma Luhur Pangkalpinang.",
    siteName: "HIMASI ISB Atma Luhur",
    images: [
      {
        url: "/hero-banner.jpg",
        width: 1200,
        height: 630,
        alt: "HIMASI ISB Atma Luhur",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "HIMASI - Himpunan Mahasiswa Sistem Informasi",
    description: "Portal resmi HIMASI ISB Atma Luhur Pangkalpinang.",
    images: ["/hero-banner.jpg"],
  },
  icons: {
    icon: "/logo-himasi.png",
    apple: "/logo-himasi.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning className={`${poppins.variable} min-h-full antialiased`}>
      <head>
        <link rel="preconnect" href="https://images.unsplash.com" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
        <link rel="preconnect" href="https://rtbtgmtxyhljbltroyra.supabase.co" crossOrigin="" />
        <link rel="dns-prefetch" href="https://rtbtgmtxyhljbltroyra.supabase.co" />
      </head>
      <body className="min-h-full flex flex-col font-sans bg-white dark:bg-[#001740] text-[#091e42] dark:text-slate-100 selection:bg-[#0094E0]/20 selection:text-[#00296E]">
        <PhosphorIconProvider>
          <ScrollToTopOnNav />
          <LoadingScreen>
            <Navbar />
            <main className="flex-1 w-full overflow-x-clip max-w-full">{children}</main>
            <BackToTop />
          </LoadingScreen>
        </PhosphorIconProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
