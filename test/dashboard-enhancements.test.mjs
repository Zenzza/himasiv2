import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

describe("Dashboard Enhancements Verification (Tahap 1, 2, 3)", () => {
  const layoutPath = "app/dashboard/layout.tsx";
  const errorBoundaryPath = "components/dashboard/dashboard-error-boundary.tsx";
  const offlineBannerPath = "components/dashboard/offline-banner.tsx";
  const pagePath = "app/dashboard/page.tsx";

  it("Tahap 1: layout.tsx defines security metadata (robots noindex/nofollow)", () => {
    assert.ok(fs.existsSync(layoutPath), "app/dashboard/layout.tsx must exist");
    const content = fs.readFileSync(layoutPath, "utf8");
    assert.ok(content.includes("Admin Dashboard"), "Title must include Admin Dashboard");
    assert.ok(content.includes("index: false"), "Must have index: false");
    assert.ok(content.includes("follow: false"), "Must have follow: false");
    assert.ok(content.includes("nocache: true"), "Must have nocache: true");
  });

  it("Tahap 2: components/dashboard/dashboard-error-boundary.tsx exists and implements retry UI", () => {
    assert.ok(fs.existsSync(errorBoundaryPath), "dashboard-error-boundary.tsx must exist");
    const content = fs.readFileSync(errorBoundaryPath, "utf8");
    assert.ok(content.includes("componentDidCatch"), "Must implement componentDidCatch");
    assert.ok(content.includes("getDerivedStateFromError"), "Must implement getDerivedStateFromError");
    assert.ok(content.includes("Coba Muat Ulang Modul"), "Must offer retry action");
  });

  it("Tahap 2: components/dashboard/offline-banner.tsx exists and listens to online/offline events", () => {
    assert.ok(fs.existsSync(offlineBannerPath), "offline-banner.tsx must exist");
    const content = fs.readFileSync(offlineBannerPath, "utf8");
    assert.ok(content.includes("navigator.onLine"), "Must check navigator.onLine");
    assert.ok(content.includes("online"), "Must listen to online event");
    assert.ok(content.includes("offline"), "Must listen to offline event");
  });

  it("Tahap 2: page.tsx renders OfflineBanner and wraps tabs with DashboardTabErrorBoundary", () => {
    const pageContent = fs.readFileSync(pagePath, "utf8");
    assert.ok(pageContent.includes("<OfflineBanner />"), "Must render <OfflineBanner />");
    assert.ok(pageContent.includes("<DashboardTabErrorBoundary"), "Must wrap tabs with <DashboardTabErrorBoundary");
  });

  it("Tahap 3: page.tsx synchronizes activeTab with URL (?tab=...) and popstate", () => {
    const pageContent = fs.readFileSync(pagePath, "utf8");
    assert.ok(pageContent.includes("url.searchParams.set(\"tab\", tab)"), "Must set tab query param on tab change");
    assert.ok(pageContent.includes("window.history.replaceState"), "Must use replaceState to avoid full reloads");
    assert.ok(pageContent.includes("popstate"), "Must listen to popstate event for browser Back/Forward navigation");
  });
});
