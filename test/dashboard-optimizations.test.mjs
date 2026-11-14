import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

describe("Admin Dashboard Optimizations (Priorities #1, #2, #3)", () => {
  const pagePath = "app/dashboard/page.tsx";
  const cmdPalettePath = "components/dashboard/command-palette.tsx";
  const beritaPath = "components/dashboard/berita-manager.tsx";
  const kalenderPath = "components/dashboard/kalender-manager.tsx";

  describe("Priority #2: Performance & Code-Splitting Modularization", () => {
    it("modularizes BeritaManager into a standalone component with dynamic imports", () => {
      assert.ok(fs.existsSync(beritaPath), "berita-manager.tsx must exist");
      const pageCode = fs.readFileSync(pagePath, "utf8");
      assert.ok(pageCode.includes('import("@/components/dashboard/berita-manager")'), "Must use next/dynamic for BeritaManager");
      assert.ok(pageCode.includes("<BeritaManager"), "Must render <BeritaManager");
    });

    it("modularizes KalenderManager into a standalone component with dynamic imports", () => {
      assert.ok(fs.existsSync(kalenderPath), "kalender-manager.tsx must exist");
      const pageCode = fs.readFileSync(pagePath, "utf8");
      assert.ok(pageCode.includes('import("@/components/dashboard/kalender-manager")'), "Must use next/dynamic for KalenderManager");
      assert.ok(pageCode.includes("<KalenderManager"), "Must render <KalenderManager");
    });

    it("keeps main page clean and under 5400 lines", () => {
      const pageCode = fs.readFileSync(pagePath, "utf8");
      const lines = pageCode.split("\n").length;
      assert.ok(lines < 5400, `Page line count should be <5400, got ${lines}`);
    });
  });

  describe("Priority #1: Mobile UI & Navigation Enhancements", () => {
    it("hides desktop header on mobile screens (hidden lg:flex)", () => {
      const pageCode = fs.readFileSync(pagePath, "utf8");
      assert.ok(pageCode.includes("hidden lg:flex w-full h-14"), "Desktop header must have hidden lg:flex");
    });

    it("implements dedicated mobile breadcrumb and top navigation strip (lg:hidden)", () => {
      const pageCode = fs.readFileSync(pagePath, "utf8");
      assert.ok(pageCode.includes("TAB_TITLES"), "Must define TAB_TITLES for breadcrumbs");
      assert.ok(pageCode.includes("lg:hidden no-print sticky top-0 z-30"), "Must have sticky mobile topbar");
      assert.ok(pageCode.includes("TAB_TITLES[activeTab]?.label"), "Must display active tab label dynamically");
    });

    it("implements touch swipe gestures for mobile sidebar drawer (open & close)", () => {
      const pageCode = fs.readFileSync(pagePath, "utf8");
      assert.ok(pageCode.includes("touchStartXRef"), "Must track touchStartXRef");
      assert.ok(pageCode.includes("touchStartYRef"), "Must track touchStartYRef");
      assert.ok(pageCode.includes("touchstart"), "Must attach touchstart event listener");
      assert.ok(pageCode.includes("touchend"), "Must attach touchend event listener");
      assert.ok(pageCode.includes("setSidebarOpen(false)"), "Must close sidebar on left swipe");
      assert.ok(pageCode.includes("setSidebarOpen(true)"), "Must open sidebar on right edge swipe");
    });
  });

  describe("Priority #3: Command Palette (Ctrl + K / Cmd + K)", () => {
    it("command-palette.tsx exists and provides comprehensive search & actions", () => {
      assert.ok(fs.existsSync(cmdPalettePath), "command-palette.tsx must exist");
      const cmdCode = fs.readFileSync(cmdPalettePath, "utf8");
      assert.ok(cmdCode.includes("export default function CommandPalette"), "Must export default CommandPalette");
      assert.ok(cmdCode.includes("allActions"), "Must define actions list");
      assert.ok(cmdCode.includes("Navigasi Modul"), "Must have Navigasi Modul category");
      assert.ok(cmdCode.includes("Tindakan Cepat"), "Must have Tindakan Cepat category");
      assert.ok(cmdCode.includes("Tautan Publik"), "Must have Tautan Publik category");
      assert.ok(cmdCode.includes("canAccessTab"), "Must filter actions by UserRole permission");
    });

    it("wires Ctrl+K and Cmd+K global shortcuts and triggers in dashboard", () => {
      const pageCode = fs.readFileSync(pagePath, "utf8");
      assert.ok(pageCode.includes("isCommandPaletteOpen"), "Must have isCommandPaletteOpen state");
      assert.ok(pageCode.includes("e.key.toLowerCase() === \"k\""), "Must listen for K key with ctrl/cmd");
      assert.ok(pageCode.includes("<CommandPalette"), "Must render <CommandPalette in page");
      assert.ok(pageCode.includes("Ctrl K"), "Must provide Ctrl+K button in desktop header");
    });
  });
});
