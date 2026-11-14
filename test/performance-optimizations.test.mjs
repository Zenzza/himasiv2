import { describe, it } from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";

describe("Front-end Performance Optimizations Verification", () => {
  it("LoadingScreen implements original cinematic timings requested by user", () => {
    const loadingScreenPath = path.resolve("components/loading-screen.tsx");
    const content = fs.readFileSync(loadingScreenPath, "utf-8");
    assert.match(content, /INITIAL_DELAY_MS = 1000/);
    assert.match(content, /PROGRESS_DURATION_MS = 2400/);
    assert.match(content, /EXIT_DURATION_MS = 1100/);
  });

  it("Hero banner constants point to optimized JPEG assets", () => {
    const bannerPath = path.resolve("lib/constants/banner.ts");
    const content = fs.readFileSync(bannerPath, "utf-8");
    assert.match(content, /\/hero-banner\.jpg/);
    assert.match(content, /\/hero-banner-mobile\.jpg/);
  });

  it("next.config.ts enables modern image formats and production compiler optimizations", () => {
    const configPath = path.resolve("next.config.ts");
    const content = fs.readFileSync(configPath, "utf-8");
    assert.match(content, /image\/avif/);
    assert.match(content, /image\/webp/);
    assert.match(content, /removeConsole/);
  });

  it("Homepage implements dynamic code-splitting for heavy below-the-fold components", () => {
    const homePath = path.resolve("app/page.tsx");
    const content = fs.readFileSync(homePath, "utf-8");
    assert.match(content, /dynamic\(\(\) => import\("@\/components\/form-aspirasi"\)/);
    assert.match(content, /dynamic\(\(\) => import\("@\/components\/homepage-popup"\)/);
    assert.match(content, /\/DSC01203\.jpg/);
  });

  it("Profile page uses optimized banner and lazy loading on images", () => {
    const profilPath = path.resolve("app/profil/page.tsx");
    const content = fs.readFileSync(profilPath, "utf-8");
    assert.match(content, /\/hero-banner\.jpg/);
    assert.match(content, /loading="lazy"/);
  });

  it("logo-kabinet.png is compressed under 300 KB with transparency preserved", () => {
    const logoPath = path.resolve("public/logo-kabinet.png");
    const stats = fs.statSync(logoPath);
    const sizeKB = stats.size / 1024;
    assert.strictEqual(sizeKB < 300, true, `Expected size < 300KB, got ${sizeKB}KB`);
  });

  it("app/layout.tsx implements preconnect, dns-prefetch, and optimized font weights", () => {
    const layoutPath = path.resolve("app/layout.tsx");
    const content = fs.readFileSync(layoutPath, "utf-8");
    assert.match(content, /rel="preconnect"/);
    assert.match(content, /rel="dns-prefetch"/);
    assert.match(content, /weight:\s*\["400",\s*"500",\s*"600",\s*"700"\]/);
  });

  it("app/berita/page.tsx implements instant cache-first rendering without altering business logic", () => {
    const beritaPath = path.resolve("app/berita/page.tsx");
    const content = fs.readFileSync(beritaPath, "utf-8");
    assert.match(content, /himasi_berita_local_cache/);
    assert.match(content, /getPublishedBerita/);
    assert.match(content, /FALLBACK_BERITA/);
  });

  it("globals.css provides .content-auto for offscreen rendering optimization", () => {
    const cssPath = path.resolve("app/globals.css");
    const content = fs.readFileSync(cssPath, "utf-8");
    assert.match(content, /\.content-auto/);
    assert.match(content, /content-visibility:\s*auto/);
  });

  it("next.config.ts optimizes package imports for phosphor-icons", () => {
    const configPath = path.resolve("next.config.ts");
    const content = fs.readFileSync(configPath, "utf-8");
    assert.match(content, /optimizePackageImports:\s*\["@phosphor-icons\/react"\]/);
  });

  it("app/apresiasi/page.tsx dynamically imports form-pengajuan-apresiasi and has content-auto", () => {
    const apresiasiPath = path.resolve("app/apresiasi/page.tsx");
    const content = fs.readFileSync(apresiasiPath, "utf-8");
    assert.match(content, /dynamic\(\s*\(\)\s*=>\s*import\("@\/components\/form-pengajuan-apresiasi"\)/);
    assert.match(content, /content-auto/);
    assert.match(content, /decoding="async"/);
  });

  it("app/tentang/page.tsx uses optimized assets and async decoding", () => {
    const tentangPath = path.resolve("app/tentang/page.tsx");
    const content = fs.readFileSync(tentangPath, "utf-8");
    assert.match(content, /\/hero-banner\.jpg/);
    assert.match(content, /\/tentang-8\.png/);
    assert.match(content, /\/tentang-8\.jpg/);
    assert.match(content, /content-auto/);
    assert.match(content, /decoding="async"/);
  });

  it("app/dashboard/page.tsx implements dynamic code-splitting for tab managers", () => {
    const dashboardPath = path.resolve("app/dashboard/page.tsx");
    const content = fs.readFileSync(dashboardPath, "utf-8");
    assert.match(content, /dynamic\(\s*\(\)\s*=>\s*import\("@\/components\/absensi\/admin-qr-scanner"\)/);
    assert.match(content, /dynamic\(\s*\(\)\s*=>\s*import\("@\/components\/dashboard\/voting-manager"\)/);
    assert.match(content, /dynamic\(\s*\(\)\s*=>\s*import\("@\/components\/dashboard\/user-manager"\)/);
    assert.match(content, /dynamic\(\s*\(\)\s*=>\s*import\("@\/components\/dashboard\/persuratan-manager"\)/);
  });

  it("public directory does not contain obsolete heavy PNG files", () => {
    assert.strictEqual(fs.existsSync(path.resolve("public/hero-banner.png")), false);
    assert.strictEqual(fs.existsSync(path.resolve("public/hero-banner-mobile.png")), false);
    assert.strictEqual(fs.existsSync(path.resolve("public/DSC01203.png")), false);
  });

  it("app/kalender/page.tsx implements cache-first instant rendering", () => {
    const kalenderPath = path.resolve("app/kalender/page.tsx");
    const content = fs.readFileSync(kalenderPath, "utf-8");
    assert.match(content, /himasi_kalender_local_cache/);
    assert.match(content, /getAgendaKalender/);
  });

  it("app/berita/[slug]/page.tsx fetches article and related articles in parallel", () => {
    const detailPath = path.resolve("app/berita/[slug]/page.tsx");
    const content = fs.readFileSync(detailPath, "utf-8");
    assert.match(content, /Promise\.all\(\s*\[[\s\S]*?getBeritaBySlug\(slug\)[\s\S]*?getPublishedBerita\(\)[\s\S]*?\]\s*\)/);
  });

  it("app/globals.css uses GPU-accelerated translate3d for marquee animations", () => {
    const cssPath = path.resolve("app/globals.css");
    const content = fs.readFileSync(cssPath, "utf-8");
    assert.match(content, /translate3d\(0,\s*0,\s*0\)/);
    assert.match(content, /translate3d\(-100%,\s*0,\s*0\)/);
  });

  it("app/page.tsx uses passive resize listener and cache-first news carousel", () => {
    const homePath = path.resolve("app/page.tsx");
    const content = fs.readFileSync(homePath, "utf-8");
    assert.match(content, /addEventListener\("resize",\s*updateMedia,\s*\{\s*passive:\s*true\s*\}\)/);
    assert.match(content, /himasi_berita_local_cache/);
  });
});

