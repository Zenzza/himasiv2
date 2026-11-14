import { describe, it } from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";

describe("SEO, Metadata, PWA, and Security Optimizations", () => {
  it("app/layout.tsx defines rich OpenGraph, Twitter Cards, and metadataBase", () => {
    const layoutPath = path.resolve("app/layout.tsx");
    const content = fs.readFileSync(layoutPath, "utf-8");
    assert.match(content, /metadataBase/);
    assert.match(content, /openGraph:/);
    assert.match(content, /twitter:/);
    assert.match(content, /summary_large_image/);
    assert.match(content, /\/hero-banner\.jpg/);
  });

  it("app/sitemap.ts is valid and maps core public routes", () => {
    const sitemapPath = path.resolve("app/sitemap.ts");
    assert.strictEqual(fs.existsSync(sitemapPath), true);
    const content = fs.readFileSync(sitemapPath, "utf-8");
    assert.match(content, /MetadataRoute\.Sitemap/);
    assert.match(content, /\/berita/);
    assert.match(content, /\/profil/);
    assert.match(content, /\/voting/);
  });

  it("app/robots.ts is valid and disallows dashboard and api", () => {
    const robotsPath = path.resolve("app/robots.ts");
    assert.strictEqual(fs.existsSync(robotsPath), true);
    const content = fs.readFileSync(robotsPath, "utf-8");
    assert.match(content, /MetadataRoute\.Robots/);
    assert.match(content, /\/dashboard\//);
    assert.match(content, /sitemap\.xml/);
  });

  it("app/manifest.ts defines PWA manifest with theme color and logo", () => {
    const manifestPath = path.resolve("app/manifest.ts");
    assert.strictEqual(fs.existsSync(manifestPath), true);
    const content = fs.readFileSync(manifestPath, "utf-8");
    assert.match(content, /MetadataRoute\.Manifest/);
    assert.match(content, /#00296E/);
    assert.match(content, /\/logo-himasi\.png/);
  });

  it("next.config.ts configures HTTP security headers and static asset Cache-Control", () => {
    const configPath = path.resolve("next.config.ts");
    const content = fs.readFileSync(configPath, "utf-8");
    assert.match(content, /X-Content-Type-Options/);
    assert.match(content, /X-Frame-Options/);
    assert.match(content, /SAMEORIGIN/);
    assert.match(content, /Cache-Control/);
    assert.match(content, /public,\s*max-age=31536000/);
  });
});

