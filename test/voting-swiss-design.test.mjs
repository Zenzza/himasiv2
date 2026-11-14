import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

describe("Voting Manager Swiss Minimalist Grid Design Verification", () => {
  const votingFiles = [
    "components/dashboard/voting-manager.tsx",
    "components/dashboard/voting/voting-session-tab.tsx",
    "components/dashboard/voting/voting-candidates-tab.tsx",
    "components/dashboard/voting/candidate-modal.tsx",
    "components/dashboard/voting/voting-dpt-tab.tsx",
    "components/dashboard/voting/dpt-add-modal.tsx",
    "components/dashboard/voting/dpt-import-modal.tsx",
    "components/dashboard/voting/voting-berita-acara-tab.tsx",
    "components/dashboard/voting/berita-acara-signatory-modal.tsx",
  ];

  it("all 9 voting manager files exist and are readable", () => {
    for (const file of votingFiles) {
      const fullPath = path.resolve(file);
      assert.ok(fs.existsSync(fullPath), `File ${file} should exist`);
      const content = fs.readFileSync(fullPath, "utf-8");
      assert.ok(content.length > 0, `File ${file} should not be empty`);
    }
  });

  it("no files contain legacy rounded corners (rounded-xl, 2xl, 3xl, lg, md, full, sm)", () => {
    const roundedRegex = /rounded-(xl|2xl|3xl|lg|md|full|sm)\b|rounded\s/g;
    for (const file of votingFiles) {
      const content = fs.readFileSync(path.resolve(file), "utf-8");
      const matches = content.match(roundedRegex);
      assert.equal(
        matches,
        null,
        `File ${file} should not contain legacy rounded classes, found: ${matches?.join(", ")}`
      );
    }
  });

  it("voting-manager.tsx integrates DashboardPageHeader and DashboardMetricStrip", () => {
    const content = fs.readFileSync(path.resolve("components/dashboard/voting-manager.tsx"), "utf-8");
    assert.ok(content.includes("<DashboardPageHeader"), "Should use DashboardPageHeader");
    assert.ok(content.includes("<DashboardMetricStrip"), "Should use DashboardMetricStrip");
    assert.ok(content.includes("E-VOTING ENGINE"), "Should contain E-VOTING ENGINE badge");
    assert.ok(content.includes("rounded-none"), "Should use rounded-none styling");
  });

  it("sub-tabs bar uses Swiss Minimalist Grid layout with border-r cells and border-b indicators", () => {
    const content = fs.readFileSync(path.resolve("components/dashboard/voting-manager.tsx"), "utf-8");
    assert.ok(content.includes("border-r border-[#00296E]/15"), "Subtabs should have border-r cells");
    assert.ok(content.includes("01. Sesi &amp; Quick Count"), "Tab 1 label present");
    assert.ok(content.includes("02. Data Kandidat"), "Tab 2 label present");
    assert.ok(content.includes("03. Daftar Pemilih Tetap"), "Tab 3 label present");
    assert.ok(content.includes("04. Berita Acara &amp; Cetak PDF"), "Tab 4 label present");
  });

  it("modals across all voting components follow Swiss Grid styling", () => {
    const modalFiles = [
      "components/dashboard/voting-manager.tsx",
      "components/dashboard/voting/candidate-modal.tsx",
      "components/dashboard/voting/dpt-add-modal.tsx",
      "components/dashboard/voting/dpt-import-modal.tsx",
      "components/dashboard/voting/berita-acara-signatory-modal.tsx",
    ];

    for (const file of modalFiles) {
      const content = fs.readFileSync(path.resolve(file), "utf-8");
      assert.ok(
        content.includes("rounded-none"),
        `File ${file} must include rounded-none for modals/inputs`
      );
    }
  });
});
