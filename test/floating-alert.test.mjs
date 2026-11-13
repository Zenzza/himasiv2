import { describe, it } from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";

describe("FloatingAlert Component Design & Structure", () => {
  const filePath = path.resolve("components/ui/floating-alert.tsx");

  it("file exists and is readable", () => {
    assert.strictEqual(fs.existsSync(filePath), true);
  });

  it("implements all 4 types (info, success, warning, error) with Phosphor icons", () => {
    const content = fs.readFileSync(filePath, "utf-8");
    assert.match(content, /export type FloatingAlertType = "info" \| "success" \| "warning" \| "error"/);
    assert.match(content, /Info,/);
    assert.match(content, /CheckCircle,/);
    assert.match(content, /Warning,/);
    assert.match(content, /XCircle,/);
    assert.match(content, /@phosphor-icons\/react/);
  });

  it("includes top-right fixed positioning and modern glass card design", () => {
    const content = fs.readFileSync(filePath, "utf-8");
    assert.match(content, /top-20 sm:top-24 right-4 sm:right-6/);
    assert.match(content, /backdrop-blur-md/);
    assert.match(content, /rounded-2xl/);
    assert.match(content, /font-poppins/);
  });

  it("implements auto-dismiss countdown with hover pause feature", () => {
    const content = fs.readFileSync(filePath, "utf-8");
    assert.match(content, /onMouseEnter/);
    assert.match(content, /onMouseLeave/);
    assert.match(content, /isHovered/);
    assert.match(content, /progress/);
  });
});

