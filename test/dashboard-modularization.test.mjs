import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

describe("Dashboard Modularization & Dynamic Splitting (Priority #2)", () => {
  const pagePath = "app/dashboard/page.tsx";
  const beritaPath = "components/dashboard/berita-manager.tsx";
  const kalenderPath = "components/dashboard/kalender-manager.tsx";

  it("berita-manager.tsx exists and encapsulates news CRUD management", () => {
    assert.ok(fs.existsSync(beritaPath), "BeritaManager component must exist");
    const content = fs.readFileSync(beritaPath, "utf8");
    assert.ok(content.includes("export default function BeritaManager"), "Must export default BeritaManager");
    assert.ok(content.includes("getAllBeritaAdmin"), "Must use getAllBeritaAdmin");
    assert.ok(content.includes("processAndUploadBeritaPhoto"), "Must include photo compression/upload");
    assert.ok(content.includes("DashboardPageHeader"), "Must use DashboardPageHeader");
  });

  it("kalender-manager.tsx exists and encapsulates calendar agenda management", () => {
    assert.ok(fs.existsSync(kalenderPath), "KalenderManager component must exist");
    const content = fs.readFileSync(kalenderPath, "utf8");
    assert.ok(content.includes("export default function KalenderManager"), "Must export default KalenderManager");
    assert.ok(content.includes("getAgendaKalender"), "Must use getAgendaKalender");
    assert.ok(content.includes("adminCalendarCells"), "Must calculate calendar month matrix");
    assert.ok(content.includes("handleSaveAgenda"), "Must handle agenda creation/update");
  });

  it("app/dashboard/page.tsx dynamically imports BeritaManager and KalenderManager", () => {
    const content = fs.readFileSync(pagePath, "utf8");
    assert.ok(content.includes('import("@/components/dashboard/berita-manager")'), "Must dynamically import BeritaManager");
    assert.ok(content.includes('import("@/components/dashboard/kalender-manager")'), "Must dynamically import KalenderManager");
    assert.ok(content.includes('<BeritaManager'), "Must render BeritaManager component");
    assert.ok(content.includes('<KalenderManager'), "Must render KalenderManager component");
  });

  it("app/dashboard/page.tsx line count is substantially reduced through modularization", () => {
    const content = fs.readFileSync(pagePath, "utf8");
    const lineCount = content.split("\n").length;
    // Originally >7400 lines, now reduced under 5200 lines
    assert.ok(lineCount < 5500, `Line count should be under 5500, currently ${lineCount}`);
  });
});
