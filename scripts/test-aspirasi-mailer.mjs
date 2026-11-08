import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

// Auto re-spawn with TypeScript loader if run via plain node
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

const { generateAspirasiEmailHtml, sendAspirasiEmail } = await import("../lib/email/aspirasi-mailer.ts");
const { POST: handleRetryEmail } = await import("../app/api/aspirasi/retry-email/route.ts");

console.log("================================================================================");
console.log("🚀 TESTING ASPIRASI EMAIL DISPATCHER & GOOGLE APPS SCRIPT RELAY");
console.log("================================================================================");

// 1. Verifikasi Template HTML
console.log("\n[TEST 1] Verifikasi Template Email HTML...");
const mockPayload = {
  to: "mahasiswa.2024@atmaluhur.ac.id",
  nomorTiket: "ASP-2026-9999",
  angkatan: "2024",
  pesan: "Mohon penambahan buku referensi sistem informasi di perpustakaan.",
  jawabanAdmin: "Usulan telah kami koordinasikan dengan pihak perpustakaan kampus.",
  dijawabOleh: "BPH HIMASI",
  dijawabPada: new Date().toISOString(),
};

const html = generateAspirasiEmailHtml(mockPayload);
assert.ok(html.includes("ASP-2026-9999"), "Template harus memuat nomor tiket");
assert.ok(html.includes("HIMASI ISB ATMA LUHUR"), "Template harus memuat kop HIMASI");
assert.ok(html.includes("2024"), "Template harus memuat angkatan");
assert.ok(html.includes("Mohon penambahan buku referensi"), "Template harus memuat pesan asli");
assert.ok(html.includes("Usulan telah kami koordinasikan"), "Template harus memuat jawaban admin");
assert.ok(html.includes("BPH HIMASI"), "Template harus memuat nama pengurus yang menjawab");
console.log("  ✓ Template email HTML responsif bermerek resmi HIMASI valid dan lengkap!");

// 2. Verifikasi Penanganan Error Jika Webhook URL Belum Ada
console.log("\n[TEST 2] Verifikasi Penanganan Kondisi Tanpa Webhook...");
const origUrl = process.env.HIMASI_EMAIL_WEBHOOK_URL;
delete process.env.HIMASI_EMAIL_WEBHOOK_URL;

const noWebhookResult = await sendAspirasiEmail(mockPayload);
assert.equal(noWebhookResult.success, false, "Harus gagal jika webhook url tidak diatur");
assert.ok(noWebhookResult.error?.includes("Konfigurasi email webhook belum lengkap"));
process.env.HIMASI_EMAIL_WEBHOOK_URL = origUrl;
console.log("  ✓ Penanganan aman saat webhook belum disetel terverifikasi!");

// 3. Verifikasi Endpoint POST /api/aspirasi/retry-email
console.log("\n[TEST 3] Verifikasi Endpoint POST /api/aspirasi/retry-email...");

// 3a. Penolakan ID Kosong (HTTP 400)
const reqEmpty = new Request("http://localhost/api/aspirasi/retry-email", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({}),
});
const resEmpty = await handleRetryEmail(reqEmpty);
assert.equal(resEmpty.status, 400, "Harus mengembalikan HTTP 400 jika ID kosong");

// 3b. Penolakan ID Tidak Ditemukan (HTTP 404)
const reqNotFound = new Request("http://localhost/api/aspirasi/retry-email", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ id: "non-existent-id" }),
});
const resNotFound = await handleRetryEmail(reqNotFound);
assert.equal(resNotFound.status, 404, "Harus mengembalikan HTTP 404 jika ID tidak ada");

// 3c. Penolakan Aspirasi yang Belum Selesai (HTTP 400)
const reqNotFinished = new Request("http://localhost/api/aspirasi/retry-email", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ id: "asp-demo-01" }), // status: baru
});
const resNotFinished = await handleRetryEmail(reqNotFinished);
assert.equal(resNotFinished.status, 400, "Harus mengembalikan HTTP 400 jika tiket belum berstatus selesai");

console.log("  ✓ Validasi input dan prasyarat retry-email terverifikasi!");

console.log("\n================================================================================");
console.log("🎉 SEMUA PENGUJIAN EMAIL DISPATCHER BERHASIL 100%!");
console.log("================================================================================");
