/**
 * Route Matcher Utility for HIMASI Portal
 * 
 * Digunakan untuk mengidentifikasi rute-rute publik valid vs rute yang tidak dikenal (404),
 * serta menentukan apakah LoadingScreen preloader dan Navbar harus dikecualikan.
 */

export const VALID_ROUTE_PREFIXES = [
  "/apresiasi",
  "/berita",
  "/dashboard",
  "/error",
  "/informasi",
  "/kalender",
  "/login",
  "/oprec",
  "/order-baju",
  "/prestasi",
  "/profil",
  "/s",
  "/tentang",
  "/voting",
  "/api",
] as const;

/**
 * Normalizes a pathname by stripping query strings, hashes, and redundant trailing slashes.
 */
export function normalizePath(pathname?: string | null): string {
  if (!pathname) return "";
  const clean = pathname.split("?")[0].split("#")[0];
  if (clean.length > 1 && clean.endsWith("/")) {
    return clean.slice(0, -1);
  }
  return clean;
}

/**
 * Memeriksa apakah pathname adalah rute aplikasi publik yang valid dan terdaftar.
 * Mengembalikan false jika path tidak terdaftar (sehingga berstatus 404 Not Found),
 * atau merupakan internal error handler seperti /_not-found.
 */
export function isKnownRoute(pathname?: string | null): boolean {
  if (!pathname) return false;
  
  const path = normalizePath(pathname);
  
  if (path === "/") {
    return true;
  }

  // /_not-found adalah internal error handler, bukan rute publik reguler
  if (path === "/_not-found") {
    return false;
  }

  return VALID_ROUTE_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(prefix + "/")
  );
}

/**
 * Menentukan apakah sebuah rute harus mengecualikan LoadingScreen / preloader.
 * Menghilangkan preloader pada dashboard, login, error pages, dan seluruh rute 404 (tidak dikenal).
 */
export function isExcludedFromLoadingScreen(pathname?: string | null): boolean {
  if (!pathname) return false;

  const path = normalizePath(pathname);

  return (
    path.startsWith("/dashboard") ||
    path === "/login" ||
    path.startsWith("/error") ||
    path === "/_not-found" ||
    !isKnownRoute(path)
  );
}
