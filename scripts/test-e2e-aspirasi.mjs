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

console.log("================================================================================");
console.log("🚀 STARTING COMPREHENSIVE END-TO-END (E2E) TEST SUITE: ASPIRASI MAHASISWA/ALUMNI");
console.log("   HIMASI ISB ATMA LUHUR - FULL SYSTEM VERIFICATION");
console.log("================================================================================\n");

// Dynamic imports to execute safely after re-spawn with ESM loader
const {
  STORAGE_KEY_ASPIRASI,
  isSupabaseConfigured,
  getLocalAspirasi,
  saveLocalAspirasi,
  resetAspirasiStorageToDefault,
  getAspirasiList,
  getAspirasiById,
  updateAspirasiStatus,
  selesaikanAspirasi,
  deleteAspirasi,
  createAspirasi,
  subscribeToAspirasi,
  generateNomorTiket,
  mapRowToItem,
} = await import("../lib/supabase/aspirasi.ts");

const { DEFAULT_ASPIRASI_LIST } = await import("../lib/types/aspirasi.ts");
const { maskEmail } = await import("../lib/utils/mask-email.ts");
const { POST } = await import("../app/api/aspirasi/selesai/route.ts");

// Helper to create mock HTTP Request for API Route Handler
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

let totalAssertions = 0;
function pass(msg) {
  totalAssertions++;
  console.log(`  ✓ ${msg}`);
}

// ==============================================================================
// SCENARIO 1: Database Migration & Trigger Specification
// ==============================================================================
console.log("--------------------------------------------------------------------------------");
console.log("▶ SCENARIO 1: Database Migration & Trigger Specification");
console.log("--------------------------------------------------------------------------------");

const migrationFile = path.resolve(
  process.cwd(),
  "supabase/migrations/20261108_enhance_aspirasi_system.sql"
);

assert.ok(fs.existsSync(migrationFile), `Migration file must exist at ${migrationFile}`);
pass("Migration file exists: supabase/migrations/20261108_enhance_aspirasi_system.sql");

const sql = fs.readFileSync(migrationFile, "utf-8");
assert.ok(sql.trim().length > 0, "Migration SQL file must not be empty");
pass("Migration SQL content is readable and non-empty");

// 1.1 Column additions on public.aspirasi
assert.match(sql, /ALTER\s+TABLE\s+(public\.)?aspirasi/i, "Must alter table aspirasi");
assert.match(sql, /nomor_tiket\s+VARCHAR\(30\)/i, "Must declare nomor_tiket VARCHAR(30)");
assert.match(sql, /jawaban_admin\s+TEXT/i, "Must declare jawaban_admin TEXT");
assert.match(sql, /dijawab_pada\s+TIMESTAMPTZ/i, "Must declare dijawab_pada TIMESTAMPTZ");
assert.match(sql, /dijawab_oleh\s+TEXT/i, "Must declare dijawab_oleh TEXT");
assert.match(
  sql,
  /status_email\s+VARCHAR\(30\)\s+NOT\s+NULL\s+DEFAULT\s+'belum_dikirim'/i,
  "Must declare status_email VARCHAR(30) NOT NULL DEFAULT 'belum_dikirim'"
);
pass("All 5 enhanced columns declared with correct types & default values");

// 1.2 CHECK constraint on status_email enum values
const expectedStatuses = ["belum_dikirim", "pending", "simulasi_terkirim", "terkirim", "gagal"];
for (const st of expectedStatuses) {
  assert.ok(
    sql.includes(`'${st}'`),
    `status_email CHECK constraint must include enum value '${st}'`
  );
}
pass("CHECK constraint on status_email includes all 5 states (belum_dikirim, pending, simulasi_terkirim, terkirim, gagal)");

// 1.3 Data Migration & Backfill
assert.match(
  sql,
  /UPDATE\s+(public\.)?aspirasi\s+SET\s+jawaban_admin\s*=\s*catatan_pengurus\s+WHERE\s+jawaban_admin\s+IS\s+NULL\s+AND\s+catatan_pengurus\s+IS\s+NOT\s+NULL/i,
  "Must migrate catatan_pengurus to jawaban_admin"
);
assert.match(
  sql,
  /UPDATE\s+(public\.)?aspirasi\s+SET\s+nomor_tiket\s*=\s*'ASP-'\s*\|\|\s*TO_CHAR\(created_at,\s*'YYYY'\)/i,
  "Must backfill existing rows with ASP-YYYY-XXXX ticket numbers"
);
pass("Data migration & backfill clauses correctly copy legacy notes and assign tickets");

// 1.4 Function & Trigger Specification
assert.match(
  sql,
  /CREATE\s+OR\s+REPLACE\s+FUNCTION\s+(public\.)?set_aspirasi_nomor_tiket\s*\(\)\s*RETURNS\s+TRIGGER/i,
  "Must define trigger function set_aspirasi_nomor_tiket()"
);
assert.match(
  sql,
  /CREATE\s+TRIGGER\s+trg_set_aspirasi_nomor_tiket\s+BEFORE\s+INSERT\s+ON\s+(public\.)?aspirasi\s+FOR\s+EACH\s+ROW\s+EXECUTE\s+FUNCTION\s+(public\.)?set_aspirasi_nomor_tiket\(\)/i,
  "Must create BEFORE INSERT trigger trg_set_aspirasi_nomor_tiket"
);
pass("Trigger function set_aspirasi_nomor_tiket() and BEFORE INSERT trigger fully specified");

// 1.5 Constraints and Indexes
assert.match(
  sql,
  /ALTER\s+TABLE\s+(public\.)?aspirasi\s+ALTER\s+COLUMN\s+nomor_tiket\s+SET\s+NOT\s+NULL/i,
  "Must set nomor_tiket NOT NULL"
);
assert.match(
  sql,
  /CREATE\s+UNIQUE\s+INDEX\s+IF\s+NOT\s+EXISTS\s+idx_aspirasi_nomor_tiket\s+ON\s+(public\.)?aspirasi\s*\(\s*nomor_tiket\s*\)/i,
  "Must create unique index on nomor_tiket"
);
assert.match(
  sql,
  /CREATE\s+INDEX\s+IF\s+NOT\s+EXISTS\s+idx_aspirasi_status\s+ON\s+(public\.)?aspirasi\s*\(\s*status\s*\)/i,
  "Must create index on status"
);
pass("Unique index idx_aspirasi_nomor_tiket and status index idx_aspirasi_status defined");

// 1.6 Syntax integrity
const dollarPairs = sql.match(/\$\$/g);
assert.ok(dollarPairs && dollarPairs.length % 2 === 0, "PL/pgSQL $$ quotes must be balanced");
pass("SQL syntax integrity verified (balanced dollar-quotes in PL/pgSQL)");


// ==============================================================================
// SCENARIO 2: Email Masking Privacy Precision
// ==============================================================================
console.log("\n--------------------------------------------------------------------------------");
console.log("▶ SCENARIO 2: Email Masking Privacy Precision");
console.log("--------------------------------------------------------------------------------");

// 2.1 Standard usernames (>2 chars)
assert.equal(maskEmail("budi.pratama@atmaluhur.ac.id"), "b***a@atmaluhur.ac.id");
assert.equal(maskEmail("alumni@gmail.com"), "a***i@gmail.com");
assert.equal(maskEmail("abc@domain.com"), "a***c@domain.com");
assert.equal(maskEmail("john.doe@example.org"), "j***e@example.org");
assert.equal(maskEmail("admin.himasi@atmaluhur.ac.id"), "a***i@atmaluhur.ac.id");
pass("Standard usernames (>2 characters) correctly masked: first + *** + last");

// 2.2 Short usernames (1 or 2 chars)
assert.equal(maskEmail("ab@domain.com"), "a***@domain.com");
assert.equal(maskEmail("si@atmaluhur.ac.id"), "s***@atmaluhur.ac.id");
assert.equal(maskEmail("a@domain.com"), "a***@domain.com");
assert.equal(maskEmail("x@univ.ac.id"), "x***@univ.ac.id");
pass("Short usernames (1 or 2 characters) masked safely: first + *** (no duplicate char)");

// 2.3 Domain preservation
const testDomains = [
  ["user@sub.domain.org", "u***r@sub.domain.org"],
  ["alumni2020@alumni.atmaluhur.ac.id", "a***0@alumni.atmaluhur.ac.id"],
];
for (const [input, expected] of testDomains) {
  assert.equal(maskEmail(input), expected);
}
pass("Complex multi-level domain names preserved verbatim");

// 2.4 Invalid / Malformed inputs & Edge cases
assert.equal(maskEmail("not-an-email"), "not-an-email");
assert.equal(maskEmail(""), "");
assert.equal(maskEmail("@domain.com"), "@domain.com");
assert.equal(maskEmail("user@"), "user@");
assert.equal(maskEmail("user@domain@another.com"), "user@domain@another.com");
// @ts-ignore
assert.equal(maskEmail(null), null);
// @ts-ignore
assert.equal(maskEmail(undefined), undefined);
pass("Malformed inputs and non-string types safely returned without crashing");


// ==============================================================================
// SCENARIO 3: Complete Lifecycle State Workflow
// ==============================================================================
console.log("\n--------------------------------------------------------------------------------");
console.log("▶ SCENARIO 3: Complete Lifecycle State Workflow");
console.log("--------------------------------------------------------------------------------");

// Reset storage to deterministic seed state
resetAspirasiStorageToDefault();
pass("In-memory storage initialized to default state");

// Step 3.1: Submit new aspirasi via createAspirasi
const submitted = await createAspirasi({
  email: "mahasiswa.baru@atmaluhur.ac.id",
  angkatan: "2025",
  pesan: "Pengajuan fasilitas dispenser air minum di koridor ruang kelas lantai 3.",
});

assert.ok(submitted, "Submitted aspirasi must return an object");
assert.ok(submitted.id, "Must assign unique id");
assert.match(
  submitted.nomor_tiket,
  /^ASP-\d{4}-\d{4}$/,
  `nomor_tiket must match format ASP-YYYY-XXXX, got ${submitted.nomor_tiket}`
);
assert.equal(submitted.email, "mahasiswa.baru@atmaluhur.ac.id");
assert.equal(submitted.angkatan, "2025");
assert.equal(submitted.pesan, "Pengajuan fasilitas dispenser air minum di koridor ruang kelas lantai 3.");
assert.equal(submitted.status, "baru");
assert.equal(submitted.status_email, "belum_dikirim");
assert.ok(submitted.created_at, "Must have valid created_at timestamp");
pass(`Step 3.1: New aspirasi created -> Ticket: ${submitted.nomor_tiket}, Status: 'baru'`);

// Step 3.2: Admin transitions status to 'diproses'
const inProgressItem = await updateAspirasiStatus(submitted.id, "diproses");
assert.equal(inProgressItem.id, submitted.id);
assert.equal(inProgressItem.status, "diproses");

// Verify in-memory persistence
const fetchedAfterProgress = await getAspirasiById(submitted.id);
assert.ok(fetchedAfterProgress, "Item must be fetchable by ID");
assert.equal(fetchedAfterProgress.status, "diproses");

const diprosesList = await getAspirasiList({ status: "diproses" });
assert.ok(
  diprosesList.some((item) => item.id === submitted.id),
  "Item must be present in filtered 'diproses' list"
);
pass(`Step 3.2: Status transition 'baru' -> 'diproses' verified and persisted`);

// Step 3.3: Admin submits resolution via Route Handler POST /api/aspirasi/selesai
const resolutionText = "Usulan dispenser air telah disetujui BPH dan diteruskan ke Sarpras kampus.";
const responderName = "Ketua Umum HIMASI";

// Capture console.log to verify email simulation output
const capturedLogs = [];
const originalLog = console.log;
console.log = (...args) => {
  capturedLogs.push(args.map(String).join(" "));
  originalLog(...args);
};

let res;
try {
  const req = createMockRequest({
    id: submitted.id,
    jawaban_admin: resolutionText,
    dijawab_oleh: responderName,
  });
  res = await POST(req);
} finally {
  console.log = originalLog;
}

assert.equal(res.status, 200, "POST /api/aspirasi/selesai must return HTTP 200 OK");
const resJson = await res.json();
assert.equal(resJson.success, true, "Response json success must be true");

const completedItem = resJson.data;
assert.equal(completedItem.id, submitted.id);
assert.equal(completedItem.nomor_tiket, submitted.nomor_tiket);
assert.equal(completedItem.status, "selesai");
assert.equal(completedItem.jawaban_admin, resolutionText);
assert.equal(completedItem.catatan_pengurus, resolutionText, "catatan_pengurus backward-compat alias must match");
assert.equal(completedItem.dijawab_oleh, responderName);
assert.ok(completedItem.dijawab_pada, "dijawab_pada must be filled with ISO timestamp");
assert.equal(completedItem.status_email, "simulasi_terkirim");
pass("Step 3.3a: Route Handler completed resolution -> status: 'selesai', status_email: 'simulasi_terkirim'");

// Verify email simulation log
const emailLogLine = capturedLogs.find((l) => l.includes("[EMAIL SIMULATION]"));
assert.ok(emailLogLine, "Console output must include [EMAIL SIMULATION] tag");
assert.ok(
  emailLogLine.includes(`Tiket: ${submitted.nomor_tiket}`),
  `Email simulation log must contain ticket ${submitted.nomor_tiket}`
);
assert.ok(
  emailLogLine.includes("To: m***u@atmaluhur.ac.id"),
  `Email simulation log must mask recipient email: m***u@atmaluhur.ac.id`
);
assert.ok(
  emailLogLine.includes(`Jawaban: ${resolutionText}`),
  "Email simulation log must include resolution text"
);
pass("Step 3.3b: Email simulation logged with masked email and ticket number");


// ==============================================================================
// SCENARIO 4: Strict Permanent Immutability Post-Resolution
// ==============================================================================
console.log("\n--------------------------------------------------------------------------------");
console.log("▶ SCENARIO 4: Strict Permanent Immutability Post-Resolution");
console.log("--------------------------------------------------------------------------------");

// 4.1 Attempt to rollback status to 'baru'
await assert.rejects(
  async () => {
    await updateAspirasiStatus(completedItem.id, "baru");
  },
  {
    name: "Error",
    message: "Aspirasi berstatus selesai telah dikunci permanen dan tidak dapat diubah",
  },
  "Cannot rollback completed item to 'baru'"
);
pass("Direct updateAspirasiStatus(id, 'baru') rejected with permanent lock error");

// 4.2 Attempt to rollback status to 'diproses'
await assert.rejects(
  async () => {
    await updateAspirasiStatus(completedItem.id, "diproses");
  },
  {
    name: "Error",
    message: "Aspirasi berstatus selesai telah dikunci permanen dan tidak dapat diubah",
  },
  "Cannot rollback completed item to 'diproses'"
);
pass("Direct updateAspirasiStatus(id, 'diproses') rejected with permanent lock error");

// 4.3 Attempt to call selesaikanAspirasi again via service
await assert.rejects(
  async () => {
    await selesaikanAspirasi(completedItem.id, {
      jawaban_admin: "Mencoba menimpa jawaban",
    });
  },
  {
    name: "Error",
    message: "Aspirasi ini sudah selesai dan tidak dapat diubah kembali",
  },
  "Cannot call selesaikanAspirasi on already completed item"
);
pass("Service layer selesaikanAspirasi rejected on completed item");

// 4.4 Attempt to overwrite via API Route POST /api/aspirasi/selesai -> HTTP 409 Conflict
{
  const conflictReq = createMockRequest({
    id: completedItem.id,
    jawaban_admin: "Upaya modifikasi ilegal via API endpoint.",
  });
  const conflictRes = await POST(conflictReq);
  assert.equal(conflictRes.status, 409, "Must return HTTP 409 Conflict");
  const conflictData = await conflictRes.json();
  assert.equal(conflictData.success, false);
  assert.equal(
    conflictData.error,
    "Aspirasi ini sudah berstatus selesai dan telah dikunci permanen"
  );
  pass("API Route POST /api/aspirasi/selesai on completed item returns HTTP 409 Conflict");
}

// 4.5 Attempt to overwrite initial seed that was already 'selesai' (asp-demo-03)
{
  const seedReq = createMockRequest({
    id: "asp-demo-03",
    jawaban_admin: "Mencoba ubah seed asp-demo-03.",
  });
  const seedRes = await POST(seedReq);
  assert.equal(seedRes.status, 409, "Initial completed seed must return HTTP 409 Conflict");
  pass("Initial pre-existing completed seed (asp-demo-03) protected by HTTP 409");
}

// 4.6 Verify data integrity remained unmutated
const itemAfterAttacks = await getAspirasiById(completedItem.id);
assert.ok(itemAfterAttacks);
assert.equal(itemAfterAttacks.status, "selesai");
assert.equal(itemAfterAttacks.jawaban_admin, resolutionText);
assert.equal(itemAfterAttacks.dijawab_oleh, responderName);
pass("Database & storage integrity fully preserved: item remains locked and uncorrupted");


// ==============================================================================
// SCENARIO 5: Form Synchronization & Dashboard Integration
// ==============================================================================
console.log("\n--------------------------------------------------------------------------------");
console.log("▶ SCENARIO 5: Form Synchronization & Dashboard Integration");
console.log("--------------------------------------------------------------------------------");

// 5.1 Verification of components/form-aspirasi.tsx
const formPath = path.resolve(process.cwd(), "components/form-aspirasi.tsx");
assert.ok(fs.existsSync(formPath), "components/form-aspirasi.tsx must exist");
const formSrc = fs.readFileSync(formPath, "utf-8");

assert.match(
  formSrc,
  /import\s+\{[^}]*createAspirasi[^}]*\}\s+from\s+["']@\/lib\/supabase\/aspirasi["']/,
  "form-aspirasi.tsx must import createAspirasi from '@/lib/supabase/aspirasi'"
);
assert.match(
  formSrc,
  /await\s+createAspirasi\s*\(/,
  "form-aspirasi.tsx must call createAspirasi on submit"
);
assert.match(
  formSrc,
  /setTicketId\s*\(\s*(?:res|item|result|data)\.?nomor_tiket\s*\)/,
  "form-aspirasi.tsx must set ticketId state from response nomor_tiket"
);
assert.ok(
  !/const\s+randomTicket\s*=/.test(formSrc),
  "form-aspirasi.tsx must NOT have client-side randomTicket generation"
);
assert.match(
  formSrc,
  /navigator\.clipboard\.writeText\s*\(\s*ticketId\s*\)/,
  "form-aspirasi.tsx must feature copy ticket button"
);
pass("components/form-aspirasi.tsx: Synchronized with backend service & official ticket state");

// 5.2 Verification of components/dashboard/aspirasi-manager.tsx
const managerPath = path.resolve(process.cwd(), "components/dashboard/aspirasi-manager.tsx");
assert.ok(fs.existsSync(managerPath), "components/dashboard/aspirasi-manager.tsx must exist");
const managerSrc = fs.readFileSync(managerPath, "utf-8");

assert.match(
  managerSrc,
  /export\s+default\s+function\s+AspirasiManager/,
  "Must export AspirasiManager as default component"
);
assert.match(
  managerSrc,
  /currentUserRole/,
  "Must handle currentUserRole prop"
);
assert.match(
  managerSrc,
  /import\s+\{[^}]*maskEmail[^}]*\}\s+from\s+["']@\/lib\/utils\/mask-email["']/,
  "Must import maskEmail from '@/lib/utils/mask-email'"
);
assert.match(
  managerSrc,
  /import\s+\{[^}]*getAspirasiList[^}]*\}\s+from\s+["']@\/lib\/supabase\/aspirasi["']/,
  "Must import getAspirasiList from '@/lib/supabase/aspirasi'"
);
assert.match(
  managerSrc,
  /import\s+\{[^}]*subscribeToAspirasi[^}]*\}\s+from\s+["']@\/lib\/supabase\/aspirasi["']/,
  "Must import subscribeToAspirasi from '@/lib/supabase/aspirasi'"
);
assert.ok(
  managerSrc.includes("/api/aspirasi/selesai"),
  "Must call /api/aspirasi/selesai API endpoint"
);
assert.ok(
  /dikunci\s+permanen/i.test(managerSrc),
  "Must display permanent lock warning in resolution modal"
);
assert.ok(
  /maskEmail\s*\(/.test(managerSrc),
  "Must mask emails in table view"
);
assert.ok(
  /clipboard\.writeText/.test(managerSrc),
  "Must support copying email and ticket"
);
assert.ok(
  managerSrc.includes("font-mono") && managerSrc.includes("rounded-none"),
  "Must apply Swiss Minimalist styling (font-mono and rounded-none)"
);
assert.ok(
  /Telah Ditanggapi/i.test(managerSrc),
  "Must display 'Telah Ditanggapi' status indicator for completed items"
);
pass("components/dashboard/aspirasi-manager.tsx: Architecture, Swiss design, and privacy verified");

// 5.3 Verification of app/dashboard/page.tsx
const dashboardPagePath = path.resolve(process.cwd(), "app/dashboard/page.tsx");
assert.ok(fs.existsSync(dashboardPagePath), "app/dashboard/page.tsx must exist");
const dashboardSrc = fs.readFileSync(dashboardPagePath, "utf-8");

assert.match(
  dashboardSrc,
  /(?:import\s+AspirasiManager\s+from\s+["']@\/components\/dashboard\/aspirasi-manager["']|import\(["']@\/components\/dashboard\/aspirasi-manager["']\))/,
  "app/dashboard/page.tsx must import AspirasiManager"
);
assert.ok(
  dashboardSrc.includes("<AspirasiManager currentUserRole={currentUserRole}"),
  "app/dashboard/page.tsx must mount <AspirasiManager currentUserRole={currentUserRole} ... />"
);
assert.ok(
  !dashboardSrc.includes("Pesan dan masukan mahasiswa melalui form aspirasi beranda."),
  "Legacy static aspirasi grid must be completely removed from app/dashboard/page.tsx"
);
pass("app/dashboard/page.tsx: Cleanly integrates AspirasiManager in aspirasi tab");


// ==============================================================================
// SCENARIO 6: Dual-path Resilience (Offline & Error Handling)
// ==============================================================================
console.log("\n--------------------------------------------------------------------------------");
console.log("▶ SCENARIO 6: Dual-path Resilience (Offline & Error Handling)");
console.log("--------------------------------------------------------------------------------");

// 6.1 Supabase Configuration helper safe execution
const configStatus = isSupabaseConfigured();
assert.equal(typeof configStatus, "boolean", "isSupabaseConfigured must return boolean");
pass(`isSupabaseConfigured() executed safely (currently configured: ${configStatus})`);

// 6.2 Offline In-Memory Fallback CRUD operations
resetAspirasiStorageToDefault();
const listAll = await getAspirasiList();
assert.equal(listAll.length, DEFAULT_ASPIRASI_LIST.length, "Should return all seed items");

// Filter tests
const listBaru = await getAspirasiList({ status: "baru" });
assert.ok(listBaru.length > 0 && listBaru.every((a) => a.status === "baru"));

const listDiproses = await getAspirasiList({ status: "diproses" });
assert.ok(listDiproses.length > 0 && listDiproses.every((a) => a.status === "diproses"));

const listSelesai = await getAspirasiList({ status: "selesai" });
assert.ok(listSelesai.length > 0 && listSelesai.every((a) => a.status === "selesai"));

const listAllExplicit = await getAspirasiList({ status: "semua" });
assert.equal(listAllExplicit.length, listAll.length);
pass("Offline filter operations (baru, diproses, selesai, semua) work deterministically");

// Search tests across various fields
const searchPesan = await getAspirasiList({ search: "stopkontak" });
assert.ok(searchPesan.length > 0 && searchPesan.some((a) => a.id === "asp-demo-01"));

const searchEmail = await getAspirasiList({ search: "alumni@atmaluhur" });
assert.ok(searchEmail.length > 0 && searchEmail.some((a) => a.id === "asp-demo-02"));

const searchTiket = await getAspirasiList({ search: "ASP-2026-1003" });
assert.ok(searchTiket.length === 1 && searchTiket[0].id === "asp-demo-03");

const searchAngkatan = await getAspirasiList({ search: "2025" });
assert.ok(searchAngkatan.length > 0 && searchAngkatan.some((a) => a.id === "asp-demo-04"));

const searchNone = await getAspirasiList({ search: "xyz-non-existent-keyword-999" });
assert.equal(searchNone.length, 0, "Non-matching search must return empty list without error");
pass("Offline search across pesan, email, nomor_tiket, and angkatan performs accurately");

// 6.3 Deletion and Realtime Subscription
const itemToDelete = await createAspirasi({
  email: "temp.delete@atmaluhur.ac.id",
  angkatan: "2024",
  pesan: "Aspirasi sementara yang akan dihapus.",
});
const countBefore = (await getAspirasiList()).length;
const delSuccess = await deleteAspirasi(itemToDelete.id);
assert.equal(delSuccess, true);
const countAfter = (await getAspirasiList()).length;
assert.equal(countAfter, countBefore - 1);
const checkDeleted = await getAspirasiById(itemToDelete.id);
assert.equal(checkDeleted, null, "Deleted item must no longer exist");
pass("deleteAspirasi safely removes record and updates store");

// Subscription cleanup
let subTriggered = false;
const unsub = subscribeToAspirasi(() => {
  subTriggered = true;
});
assert.equal(typeof unsub, "function");
assert.doesNotThrow(() => {
  unsub();
});
pass("subscribeToAspirasi registers and unsubscribes safely");

// 6.4 Route Handler Error Resilience
// Bad request: Empty body
{
  const resBad = await POST(createMockRequest(""));
  assert.equal(resBad.status, 400);
  const data = await resBad.json();
  assert.equal(data.error, "ID aspirasi wajib diisi");
}

// Bad request: Missing id
{
  const resBad = await POST(createMockRequest({ jawaban_admin: "Tanggapan valid" }));
  assert.equal(resBad.status, 400);
  const data = await resBad.json();
  assert.equal(data.error, "ID aspirasi wajib diisi");
}

// Bad request: Whitespace id
{
  const resBad = await POST(createMockRequest({ id: "   ", jawaban_admin: "Tanggapan valid" }));
  assert.equal(resBad.status, 400);
  const data = await resBad.json();
  assert.equal(data.error, "ID aspirasi wajib diisi");
}

// Bad request: Missing jawaban_admin
{
  const resBad = await POST(createMockRequest({ id: "asp-demo-01" }));
  assert.equal(resBad.status, 400);
  const data = await resBad.json();
  assert.equal(data.error, "Jawaban admin wajib diisi untuk menyelesaikan aspirasi");
}

// Bad request: Whitespace jawaban_admin
{
  const resBad = await POST(createMockRequest({ id: "asp-demo-01", jawaban_admin: " \n\t " }));
  assert.equal(resBad.status, 400);
  const data = await resBad.json();
  assert.equal(data.error, "Jawaban admin wajib diisi untuk menyelesaikan aspirasi");
}

// Not found: Non-existent ID -> HTTP 404
{
  const resNotFound = await POST(
    createMockRequest({
      id: "non-existent-uuid-9999",
      jawaban_admin: "Tanggapan untuk item fiktif",
    })
  );
  assert.equal(resNotFound.status, 404);
  const data = await resNotFound.json();
  assert.equal(data.error, "Aspirasi tidak ditemukan");
}
pass("Route Handler input validation & error responses (HTTP 400, HTTP 404) fully hardened");


// ==============================================================================
// FINAL SUMMARY
// ==============================================================================
console.log("\n================================================================================");
console.log(`🎉 ALL END-TO-END (E2E) TESTS PASSED SUCCESSFULLY! (${totalAssertions} assertions verified)`);
console.log("   - Scenario 1: Database Migration & Trigger Specification (PASSED)");
console.log("   - Scenario 2: Email Masking Privacy Precision (PASSED)");
console.log("   - Scenario 3: Complete Lifecycle State Workflow (PASSED)");
console.log("   - Scenario 4: Strict Permanent Immutability Post-Resolution (PASSED)");
console.log("   - Scenario 5: Form Synchronization & Dashboard Integration (PASSED)");
console.log("   - Scenario 6: Dual-path Resilience & Error Handling (PASSED)");
console.log("================================================================================\n");

process.exit(0);
