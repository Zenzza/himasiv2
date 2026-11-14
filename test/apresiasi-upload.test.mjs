import { test, describe } from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";

describe("Apresiasi Photo Upload Feature Verification", () => {
  const apresiasiManagerPath = path.resolve("components/dashboard/apresiasi-manager.tsx");

  test("components/dashboard/apresiasi-manager.tsx exists and is readable", () => {
    assert.strictEqual(fs.existsSync(apresiasiManagerPath), true, "apresiasi-manager.tsx must exist");
  });

  test("defines ApresiasiImageUpload component with client compression and storage upload", () => {
    const code = fs.readFileSync(apresiasiManagerPath, "utf-8");

    assert.ok(
      code.includes("function ApresiasiImageUpload("),
      "Must define ApresiasiImageUpload sub-component"
    );
    assert.ok(
      code.includes("supabase.storage"),
      "Must include Supabase Storage upload functionality"
    );
    assert.ok(
      code.includes("foto-berita") && code.includes("foto-pengurus"),
      "Must include primary storage bucket and fallback bucket"
    );
    assert.ok(
      code.includes("document.createElement(\"canvas\")"),
      "Must implement client-side canvas compression"
    );
    assert.ok(
      code.includes("5 * 1024 * 1024"),
      "Must validate max file size limit (5MB)"
    );
    assert.ok(
      code.includes("image/jpeg,image/png,image/webp"),
      "Must restrict file acceptance to standard image formats"
    );
  });

  test("ShowcaseFormModal utilizes ApresiasiImageUpload in Edit/Add showcase form", () => {
    const code = fs.readFileSync(apresiasiManagerPath, "utf-8");

    assert.ok(
      code.includes("<ApresiasiImageUpload") &&
      code.includes("slugHint={title || studentName || \"karya\"}"),
      "ShowcaseFormModal must use ApresiasiImageUpload with dynamic slug hint"
    );
    assert.ok(
      code.includes("Foto dokumentasi / banner wajib diunggah atau diisi"),
      "Must validate required image before submitting form"
    );
  });

  test("approveModalSubmisi utilizes ApresiasiImageUpload in submission approval modal", () => {
    const code = fs.readFileSync(apresiasiManagerPath, "utf-8");

    assert.ok(
      code.includes("Foto Banner / Dokumentasi Showcase") &&
      code.includes("slugHint={approveModalSubmisi.title}"),
      "approveModalSubmisi must use ApresiasiImageUpload"
    );
  });

  test("provides both drag-drop upload and manual URL toggle for administrative flexibility", () => {
    const code = fs.readFileSync(apresiasiManagerPath, "utf-8");

    assert.ok(
      code.includes("onDragOver") && code.includes("onDrop"),
      "Must implement drag & drop event handlers"
    );
    assert.ok(
      code.includes("Input URL Manual") && code.includes("showUrlField"),
      "Must provide manual URL input fallback"
    );
  });
});
