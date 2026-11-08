import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

// Auto re-spawn with TypeScript loader if run via plain `node scripts/...`
if (!process.execArgv.includes("--loader")) {
  const result = spawnSync(
    process.execPath,
    [
      "--no-warnings",
      "--experimental-strip-types",
      "--loader",
      "./scripts/loader.mjs",
      fileURLToPath(import.meta.url),
      ...process.argv.slice(2),
    ],
    { stdio: "inherit" }
  );
  process.exit(result.status ?? 0);
}

console.log("=== UNIT TEST: SINKRONISASI FORM ASPIRASI PUBLIK ===");

// 1. Static Analysis: components/form-aspirasi.tsx
console.log("\n[TEST 1] Verifikasi Kode Komponen form-aspirasi.tsx...");
const componentPath = path.resolve(process.cwd(), "components/form-aspirasi.tsx");
assert.ok(fs.existsSync(componentPath), "File components/form-aspirasi.tsx harus ada");

const componentSource = fs.readFileSync(componentPath, "utf-8");

// 1.1 Check import of createAspirasi
const hasCreateAspirasiImport = /import\s+\{[^}]*createAspirasi[^}]*\}\s+from\s+["']@\/lib\/supabase\/aspirasi["']/.test(
  componentSource
);
assert.ok(
  hasCreateAspirasiImport,
  "components/form-aspirasi.tsx harus mengimpor createAspirasi dari '@/lib/supabase/aspirasi'"
);

// 1.2 Check usage of createAspirasi in handleSubmit
const usesCreateAspirasi = /await\s+createAspirasi\s*\(/.test(componentSource);
assert.ok(
  usesCreateAspirasi,
  "components/form-aspirasi.tsx harus memanggil createAspirasi saat pengiriman formulir"
);

// 1.3 Check that ticketId is updated with response nomor_tiket (not client-side random math)
const setsRealTicket = /setTicketId\s*\(\s*(?:res|item|result|data)\.?nomor_tiket\s*\)/.test(componentSource);
assert.ok(
  setsRealTicket,
  "components/form-aspirasi.tsx harus menyetel ticketId dari nomor_tiket hasil respons service/database"
);

// 1.4 Check that old hardcoded client randomTicket is removed
const hasOldRandomTicket = /const\s+randomTicket\s*=/.test(componentSource);
assert.ok(
  !hasOldRandomTicket,
  "components/form-aspirasi.tsx tidak boleh lagi menggunakan konstanta randomTicket buatan klien secara independen"
);

// 1.5 Check Copy ticket button feature
const hasCopyButton = /navigator\.clipboard\.writeText\s*\(\s*ticketId\s*\)/.test(componentSource);
assert.ok(
  hasCopyButton,
  "components/form-aspirasi.tsx harus menyediakan tombol interaksi salin nomor tiket ke clipboard"
);

console.log("✓ Verifikasi sintaks dan integrasi komponen form-aspirasi.tsx valid!");

// 2. Functional Test: createAspirasi returns standard ticket format
console.log("\n[TEST 2] Verifikasi Format Nomor Tiket dan Data createAspirasi...");
const { createAspirasi } = await import("../lib/supabase/aspirasi.ts");

const testInput = {
  email: "mahasiswa.test@atmaluhur.ac.id",
  angkatan: "2024",
  pesan: "Mohon penambahan stopkontak di laboratorium komputer gedung B.",
};

const result = await createAspirasi(testInput);

assert.ok(result, "createAspirasi harus mengembalikan objek aspirasi");
assert.ok(result.id, "Hasil createAspirasi harus memiliki id");
assert.ok(result.nomor_tiket, "Hasil createAspirasi harus memiliki nomor_tiket");

const ticketRegex = /^ASP-\d{4}-\d{4}$/;
assert.match(
  result.nomor_tiket,
  ticketRegex,
  `nomor_tiket (${result.nomor_tiket}) harus sesuai dengan format standar ASP-YYYY-XXXX`
);

assert.equal(result.email, testInput.email, "Email harus sesuai dengan input");
assert.equal(result.angkatan, testInput.angkatan, "Angkatan harus sesuai dengan input");
assert.equal(result.pesan, testInput.pesan, "Pesan harus sesuai dengan input");
assert.equal(result.status, "baru", "Status awal aspirasi baru harus 'baru'");
assert.ok(result.created_at, "Harus memiliki timestamp created_at");

console.log(`✓ Nomor tiket berhasil di-generate secara valid: ${result.nomor_tiket}`);
console.log("\n✓ SEMUA PENGUJIAN SINKRONISASI FORM ASPIRASI BERHASIL!");
