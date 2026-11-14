import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Dashboard | HIMASI ISB Atma Luhur",
  description: "Pusat Kendali Administrasi & Sistem Informasi Himpunan Mahasiswa Sistem Informasi Atma Luhur",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="admin-dashboard-mode contents" data-admin-dashboard="true">
      {children}
    </div>
  );
}
