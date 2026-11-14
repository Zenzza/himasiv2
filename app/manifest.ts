import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "HIMASI ISB Atma Luhur",
    short_name: "HIMASI",
    description: "Portal resmi Himpunan Mahasiswa Sistem Informasi ISB Atma Luhur Pangkalpinang",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#00296E",
    icons: [
      {
        src: "/logo-himasi.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/logo-himasi.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}

