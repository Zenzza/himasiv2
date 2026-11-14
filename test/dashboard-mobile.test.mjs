import { test, describe } from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";

describe("Admin Dashboard Mobile Header Optimization Verification", () => {
  const dashboardPath = path.resolve("app/dashboard/page.tsx");

  test("app/dashboard/page.tsx exists and is readable", () => {
    assert.strictEqual(fs.existsSync(dashboardPath), true, "app/dashboard/page.tsx must exist");
  });

  test("header is hidden on mobile screens (hidden lg:flex)", () => {
    const code = fs.readFileSync(dashboardPath, "utf-8");

    assert.ok(
      code.includes("hidden lg:flex") && code.includes("GAYA 1: SWISS MINIMALIST GRID"),
      "Header must be hidden on mobile devices (< lg) using hidden lg:flex"
    );
  });

  test("provides mobile sidebar button in top mobile navigation bar instead of redundant bottom button", () => {
    const code = fs.readFileSync(dashboardPath, "utf-8");

    assert.ok(
      code.includes('aria-label="Buka Navigasi Sidebar"') &&
      code.includes("setSidebarOpen(true)"),
      "Must provide mobile sidebar trigger button in top navigation bar"
    );
    assert.ok(
      !code.includes("fixed bottom-5 left-5"),
      "Must not have redundant floating button at bottom-5 left-5"
    );
  });

  test("sidebar mobile drawer header includes quick controls (refresh, theme toggle, and close)", () => {
    const code = fs.readFileSync(dashboardPath, "utf-8");

    assert.ok(
      code.includes("toggleTheme") &&
      code.includes("fetchAspirasi") &&
      code.includes("setSidebarOpen(false)"),
      "Sidebar mobile header must provide theme toggle, refresh, and close controls"
    );
  });

  test("main layout scales to full screen on mobile without 56px offset", () => {
    const code = fs.readFileSync(dashboardPath, "utf-8");

    assert.ok(
      code.includes("min-h-screen lg:min-h-[calc(100vh-56px)]"),
      "Main layout must use full height min-h-screen on mobile"
    );
    assert.ok(
      code.includes("max-h-screen lg:max-h-[calc(100vh-56px)]"),
      "Main content scrollable container must use max-h-screen on mobile"
    );
  });
});
