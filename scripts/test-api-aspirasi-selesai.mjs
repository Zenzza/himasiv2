import assert from "node:assert/strict";
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

console.log("=== STARTING API TESTS: POST /api/aspirasi/selesai ===");

// Import reset function from service to guarantee deterministic test state
const { resetAspirasiStorageToDefault } = await import("../lib/supabase/aspirasi.ts");
const { POST } = await import("../app/api/aspirasi/selesai/route.ts");

// Helper to create Request object
function createMockRequest(body) {
  if (body === undefined) {
    return new Request("http://localhost:3000/api/aspirasi/selesai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
  }
  return new Request("http://localhost:3000/api/aspirasi/selesai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

// Reset storage to default seeds
resetAspirasiStorageToDefault();

// --------------------------------------------------------------------------
// TEST 1: Reject request with empty body or missing/empty ID -> HTTP 400
// --------------------------------------------------------------------------
console.log("\n[TEST 1] Penolakan Request dengan Body Kosong atau ID Hilang (HTTP 400)...");

// Subcase 1a: Body kosong / invalid JSON
{
  const req = createMockRequest("");
  const res = await POST(req);
  assert.equal(res.status, 400, "Body kosong harus menghasilkan HTTP 400");
  const data = await res.json();
  assert.equal(data.success, false, "success harus false");
  assert.equal(data.error, "ID aspirasi wajib diisi", "Pesan error ID wajib diisi");
}

// Subcase 1b: Missing id field
{
  const req = createMockRequest({
    jawaban_admin: "Webinar sudah dijadwalkan.",
  });
  const res = await POST(req);
  assert.equal(res.status, 400, "Missing ID harus menghasilkan HTTP 400");
  const data = await res.json();
  assert.equal(data.success, false);
  assert.equal(data.error, "ID aspirasi wajib diisi");
}

// Subcase 1c: ID hanya whitespace
{
  const req = createMockRequest({
    id: "   ",
    jawaban_admin: "Webinar sudah dijadwalkan.",
  });
  const res = await POST(req);
  assert.equal(res.status, 400, "ID whitespace harus menghasilkan HTTP 400");
  const data = await res.json();
  assert.equal(data.success, false);
  assert.equal(data.error, "ID aspirasi wajib diisi");
}
console.log("  ✓ Penolakan request tanpa ID valid terverifikasi (HTTP 400).");

// --------------------------------------------------------------------------
// TEST 2: Reject request with missing/whitespace jawaban_admin -> HTTP 400
// --------------------------------------------------------------------------
console.log("\n[TEST 2] Penolakan Request dengan Jawaban Admin Kosong / Whitespace (HTTP 400)...");

// Subcase 2a: Missing jawaban_admin
{
  const req = createMockRequest({
    id: "asp-demo-02",
  });
  const res = await POST(req);
  assert.equal(res.status, 400, "Missing jawaban_admin harus menghasilkan HTTP 400");
  const data = await res.json();
  assert.equal(data.success, false);
  assert.equal(data.error, "Jawaban admin wajib diisi untuk menyelesaikan aspirasi");
}

// Subcase 2b: Whitespace jawaban_admin
{
  const req = createMockRequest({
    id: "asp-demo-02",
    jawaban_admin: "    \n\t   ",
  });
  const res = await POST(req);
  assert.equal(res.status, 400, "Whitespace jawaban_admin harus menghasilkan HTTP 400");
  const data = await res.json();
  assert.equal(data.success, false);
  assert.equal(data.error, "Jawaban admin wajib diisi untuk menyelesaikan aspirasi");
}
console.log("  ✓ Penolakan request tanpa jawaban admin bermakna terverifikasi (HTTP 400).");

// --------------------------------------------------------------------------
// TEST 3: Reject non-existent aspirasi ID -> HTTP 404
// --------------------------------------------------------------------------
console.log("\n[TEST 3] Penolakan ID Aspirasi Tidak Ditemukan (HTTP 404)...");
{
  const req = createMockRequest({
    id: "asp-non-existent-9999",
    jawaban_admin: "Tanggapan untuk aspirasi antah berantah.",
  });
  const res = await POST(req);
  assert.equal(res.status, 404, "Aspirasi tidak ditemukan harus menghasilkan HTTP 404");
  const data = await res.json();
  assert.equal(data.success, false);
  assert.equal(data.error, "Aspirasi tidak ditemukan");
  console.log("  ✓ Penanganan ID tidak ditemukan terverifikasi (HTTP 404).");
}

// --------------------------------------------------------------------------
// TEST 4: Complete a valid aspirasi -> HTTP 200, success true, console simulation
// --------------------------------------------------------------------------
console.log("\n[TEST 4] Penyelesaian Aspirasi Valid & Simulasi Notifikasi Email (HTTP 200)...");
{
  // Intercept console.log to verify mock email dispatcher output
  const originalConsoleLog = console.log;
  const loggedLines = [];
  console.log = (...args) => {
    loggedLines.push(args.join(" "));
    originalConsoleLog(...args);
  };

  const req = createMockRequest({
    id: "asp-demo-02",
    jawaban_admin: "Terima kasih, kegiatan webinar sharing alumni telah kami jadwalkan.",
    dijawab_oleh: "Pengurus HIMASI",
  });

  let res;
  try {
    res = await POST(req);
  } finally {
    console.log = originalConsoleLog;
  }

  assert.equal(res.status, 200, "Penyelesaian aspirasi valid harus HTTP 200");
  const resJson = await res.json();
  assert.equal(resJson.success, true, "Response harus success: true");
  assert.equal(
    resJson.message,
    "Aspirasi berhasil diselesaikan dan simulasi email tanggapan berhasil dikirim"
  );

  const item = resJson.data;
  assert.equal(item.id, "asp-demo-02");
  assert.equal(item.nomor_tiket, "ASP-2026-1002");
  assert.equal(item.status, "selesai", "Status harus selesai");
  assert.equal(
    item.jawaban_admin,
    "Terima kasih, kegiatan webinar sharing alumni telah kami jadwalkan."
  );
  assert.equal(
    item.catatan_pengurus,
    "Terima kasih, kegiatan webinar sharing alumni telah kami jadwalkan."
  );
  assert.equal(item.dijawab_oleh, "Pengurus HIMASI");
  assert.equal(item.status_email, "simulasi_terkirim");
  assert(item.dijawab_pada, "dijawab_pada harus terisi ISO timestamp");

  // Verify email simulation console log
  const emailSimulationLog = loggedLines.find((line) =>
    line.includes("[EMAIL SIMULATION]")
  );
  assert(
    emailSimulationLog,
    "Harus ada console log simulasi email dengan tag [EMAIL SIMULATION]"
  );
  assert(
    emailSimulationLog.includes("Tiket: ASP-2026-1002"),
    `Log simulasi harus memuat nomor tiket, didapat: ${emailSimulationLog}`
  );
  assert(
    emailSimulationLog.includes("To: s***i@atmaluhur.ac.id"),
    `Log simulasi harus memuat email tersensor s***i@atmaluhur.ac.id, didapat: ${emailSimulationLog}`
  );
  assert(
    emailSimulationLog.includes("Jawaban: Terima kasih, kegiatan webinar sharing alumni telah kami jadwalkan."),
    `Log simulasi harus memuat jawaban admin, didapat: ${emailSimulationLog}`
  );
  console.log("  ✓ Penyelesaian valid dan log simulasi email terverifikasi (HTTP 200).");
}

// --------------------------------------------------------------------------
// TEST 5: Attempt to re-complete the same aspirasi -> HTTP 409 Permanently Locked
// --------------------------------------------------------------------------
console.log("\n[TEST 5] Upaya Penyelesaian Ulang Aspirasi yang Sudah Selesai (HTTP 409 Immutability)...");
{
  const req = createMockRequest({
    id: "asp-demo-02",
    jawaban_admin: "Mencoba menimpa jawaban yang sudah selesai dan terkunci.",
  });
  const res = await POST(req);
  assert.equal(res.status, 409, "Aspirasi sudah selesai harus menghasilkan HTTP 409 Conflict");
  const data = await res.json();
  assert.equal(data.success, false);
  assert.equal(
    data.error,
    "Aspirasi ini sudah berstatus selesai dan telah dikunci permanen"
  );
  console.log("  ✓ Penguncian permanen immutability terverifikasi (HTTP 409).");
}

// Also test another aspirasi that was seeded with status 'selesai' (asp-demo-03)
{
  const req = createMockRequest({
    id: "asp-demo-03",
    jawaban_admin: "Mencoba menimpa jawaban seed asp-demo-03.",
  });
  const res = await POST(req);
  assert.equal(res.status, 409, "Aspirasi seed selesai harus menghasilkan HTTP 409");
  const data = await res.json();
  assert.equal(data.success, false);
  assert.equal(
    data.error,
    "Aspirasi ini sudah berstatus selesai dan telah dikunci permanen"
  );
  console.log("  ✓ Immutability seed awal terverifikasi (HTTP 409).");
}

console.log("\n=======================================================");
console.log("✓ SEMUA PENGUJIAN API ROUTE ASPIRASI SELESAI BERHASIL 100%");
console.log("=======================================================");
