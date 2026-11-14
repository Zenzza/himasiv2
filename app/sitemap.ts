import type { MetadataRoute } from "next";
import { getPublishedBerita } from "@/lib/supabase/berita";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://himasi.atmaluhur.ac.id";

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/berita`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/profil`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/tentang`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/kalender`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/voting`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/apresiasi`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
  ];

  try {
    const articles = await getPublishedBerita();
    if (articles && articles.length > 0) {
      const articleRoutes: MetadataRoute.Sitemap = articles.map((article) => ({
        url: `${baseUrl}/berita/${article.slug}`,
        lastModified: new Date(article.published_at || article.created_at || Date.now()),
        changeFrequency: "weekly",
        priority: 0.7,
      }));
      return [...staticRoutes, ...articleRoutes];
    }
  } catch {
    // Gunakan staticRoutes jika query gagal saat build
  }

  return staticRoutes;
}

