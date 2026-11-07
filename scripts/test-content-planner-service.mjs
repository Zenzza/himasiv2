import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

// Auto re-spawn with TypeScript type-stripping if run via plain `node scripts/...`
if (!process.execArgv.includes("--experimental-strip-types")) {
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

console.log("=== STARTING SERVICE LAYER TESTS: CONTENT PLANNER SERVICE & REALTIME ===");

// --------------------------------------------------------------------------
// TEST 1: Migration SQL Script Verification
// --------------------------------------------------------------------------
console.log("\n[TEST 1] Verifikasi Skrip Migrasi SQL (20261107_create_content_plans.sql)...");

const migrationFilePath = path.join(
  process.cwd(),
  "supabase",
  "migrations",
  "20261107_create_content_plans.sql"
);

assert(
  fs.existsSync(migrationFilePath),
  "File migrasi supabase/migrations/20261107_create_content_plans.sql harus ada"
);

const migrationSql = fs.readFileSync(migrationFilePath, "utf8");
assert(migrationSql.length > 200, "File migrasi SQL tidak boleh kosong");

// Verifikasi elemen skema tabel
assert(
  migrationSql.includes("CREATE TABLE IF NOT EXISTS public.content_plans"),
  "SQL harus memuat CREATE TABLE IF NOT EXISTS public.content_plans"
);
assert(migrationSql.includes("id UUID"), "Tabel harus memiliki kolom id UUID");
assert(migrationSql.includes("tanggal DATE"), "Tabel harus memiliki kolom tanggal DATE");
assert(
  migrationSql.includes("calendar_week INTEGER"),
  "Tabel harus memiliki kolom calendar_week INTEGER"
);
assert(
  migrationSql.includes("day_of_week VARCHAR"),
  "Tabel harus memiliki kolom day_of_week VARCHAR"
);
assert(migrationSql.includes("platform VARCHAR"), "Tabel harus memiliki kolom platform VARCHAR");
assert(
  migrationSql.includes("tipe_konten VARCHAR"),
  "Tabel harus memiliki kolom tipe_konten VARCHAR"
);
assert(migrationSql.includes("topik TEXT"), "Tabel harus memiliki kolom topik TEXT");
assert(migrationSql.includes("konsep VARCHAR"), "Tabel harus memiliki kolom konsep VARCHAR");
assert(migrationSql.includes("objektif VARCHAR"), "Tabel harus memiliki kolom objektif VARCHAR");
assert(migrationSql.includes("status VARCHAR"), "Tabel harus memiliki kolom status VARCHAR");
assert(
  migrationSql.includes("referensi_url TEXT"),
  "Tabel harus memiliki kolom referensi_url TEXT"
);
assert(migrationSql.includes("progress INTEGER"), "Tabel harus memiliki kolom progress INTEGER");
assert(migrationSql.includes("is_done BOOLEAN"), "Tabel harus memiliki kolom is_done BOOLEAN");
assert(migrationSql.includes("catatan TEXT"), "Tabel harus memiliki kolom catatan TEXT");
assert(
  migrationSql.includes("auth.users"),
  "Tabel harus memiliki relasi created_by ke auth.users"
);

// Verifikasi CHECK constraints
assert(
  migrationSql.includes("TikTok") && migrationSql.includes("Instagram"),
  "SQL harus memuat CHECK constraint untuk platform"
);
assert(
  migrationSql.includes("Ideate") && migrationSql.includes("Published"),
  "SQL harus memuat CHECK constraint untuk status"
);
assert(
  migrationSql.includes("progress >= 0") && migrationSql.includes("progress <= 100"),
  "SQL harus memuat CHECK constraint progress 0-100"
);

// Verifikasi Indeks Performa
assert(
  migrationSql.includes("idx_content_plans_platform_date"),
  "SQL harus memuat indeks platform + tanggal"
);
assert(
  migrationSql.includes("idx_content_plans_cw"),
  "SQL harus memuat indeks calendar_week + tanggal"
);
assert(
  migrationSql.includes("idx_content_plans_status"),
  "SQL harus memuat indeks status"
);

// Verifikasi Trigger updated_at
assert(
  migrationSql.includes("trg_content_plans_updated_at") ||
    migrationSql.includes("handle_content_plans_updated_at"),
  "SQL harus memuat trigger otomatisasi updated_at"
);

// Verifikasi RLS & Grants
assert(
  migrationSql.includes("ENABLE ROW LEVEL SECURITY"),
  "SQL harus mengaktifkan ROW LEVEL SECURITY"
);
assert(
  migrationSql.includes("CREATE POLICY"),
  "SQL harus mendefinisikan kebijakan RLS"
);

// Verifikasi Publikasi Supabase Realtime
assert(
  migrationSql.includes("ALTER PUBLICATION supabase_realtime ADD TABLE public.content_plans"),
  "SQL harus mendaftarkan public.content_plans ke supabase_realtime"
);

// Verifikasi Seed Data 14 entri
assert(
  migrationSql.includes("INSERT INTO public.content_plans"),
  "SQL harus memuat perintah INSERT seed data"
);
assert(
  migrationSql.includes("5 Tips Belajar Ngoding"),
  "SQL harus memuat entri seed CW 22"
);
assert(
  migrationSql.includes("Parodi Mahasiswa IT"),
  "SQL harus memuat entri seed CW 23"
);

console.log("  ✓ Skrip migrasi SQL lengkap dan memenuhi seluruh spesifikasi skema.");

// --------------------------------------------------------------------------
// TEST 2: Service Layer Module & Fallback Initial Data
// --------------------------------------------------------------------------
console.log("\n[TEST 2] Import & Verifikasi Fallback Initial Data Service Layer...");

const {
  STORAGE_KEY_CONTENT_PLANS,
  getLocalContentPlans,
  saveLocalContentPlans,
  resetContentPlansStorageToDefault,
  getContentPlans,
  createContentPlan,
  updateContentPlan,
  toggleContentPlanDone,
  deleteContentPlan,
  subscribeToContentPlans,
} = await import("../lib/supabase/content-planner.ts");

assert.equal(
  STORAGE_KEY_CONTENT_PLANS,
  "himasiv2_content_plans",
  "STORAGE_KEY_CONTENT_PLANS harus bernilai 'himasiv2_content_plans'"
);

// Reset storage ke kondisi default mockup
resetContentPlansStorageToDefault();

const initialPlans = await getContentPlans();
assert(Array.isArray(initialPlans), "getContentPlans harus mengembalikan array");
assert.equal(
  initialPlans.length,
  14,
  "Seed bawaan harus memiliki tepat 14 rencana konten (7 CW 22 + 7 CW 23)"
);

// Verifikasi pengelompokan CW
const cw22Plans = initialPlans.filter((p) => p.calendar_week === 22);
const cw23Plans = initialPlans.filter((p) => p.calendar_week === 23);
assert.equal(cw22Plans.length, 7, "CW 22 harus memiliki 7 rencana konten");
assert.equal(cw23Plans.length, 7, "CW 23 harus memiliki 7 rencana konten");

// Verifikasi filter platform
const tikTokPlans = await getContentPlans({ platform: "TikTok" });
assert.equal(tikTokPlans.length, 14, "Seluruh 14 seed konten awal berada di platform TikTok");

const igPlans = await getContentPlans({ platform: "Instagram" });
assert.equal(igPlans.length, 0, "Platform Instagram awalnya harus kosong (0 item)");

console.log("  ✓ Fallback initial data (14 items CW 22 & CW 23 TikTok) terverifikasi.");

// --------------------------------------------------------------------------
// TEST 3: Create Content Plan (createContentPlan)
// --------------------------------------------------------------------------
console.log("\n[TEST 3] Pengujian Tambah Rencana Konten (createContentPlan)...");

const newPlanInput = {
  tanggal: "2024-06-09",
  calendar_week: 24,
  day_of_week: "Sunday",
  platform: "Instagram",
  tipe_konten: "Edukasi",
  topik: "5 Prinsip Swiss Minimalist Design untuk UI Web Mahasiswa",
  konsep: "Infografis Carousel",
  objektif: "Engagement",
  status: "Ideate",
  referensi_url: "https://instagram.com/p/test-ref",
  progress: 10,
  is_done: false,
  catatan: "Desain aset di Figma menggunakan kanvas gelap #001740",
};

const createdPlan = await createContentPlan(newPlanInput);

assert(createdPlan, "createContentPlan harus mengembalikan objek rencana konten baru");
assert(createdPlan.id, "Rencana konten baru harus memiliki ID yang ter-generate");
assert.equal(createdPlan.topik, newPlanInput.topik);
assert.equal(createdPlan.platform, "Instagram");
assert.equal(createdPlan.calendar_week, 24);
assert.equal(createdPlan.progress, 10);
assert.equal(createdPlan.is_done, false);
assert(createdPlan.created_at, "Harus memiliki timestamp created_at");
assert(createdPlan.updated_at, "Harus memiliki timestamp updated_at");

// Pastikan item baru tersimpan di storage
const plansAfterCreate = await getContentPlans();
assert.equal(plansAfterCreate.length, 15, "Jumlah item sekarang harus 15");

const igAfterCreate = await getContentPlans({ platform: "Instagram" });
assert.equal(igAfterCreate.length, 1, "Filter Instagram sekarang harus menghasilkan 1 item");
assert.equal(igAfterCreate[0].id, createdPlan.id);

console.log(`  ✓ Item baru berhasil dibuat: [ID: ${createdPlan.id}] "${createdPlan.topik}"`);

// --------------------------------------------------------------------------
// TEST 4: Update Content Plan (updateContentPlan)
// --------------------------------------------------------------------------
console.log("\n[TEST 4] Pengujian Perubahan Konten (updateContentPlan)...");

const updatedPlan = await updateContentPlan(createdPlan.id, {
  topik: "5 Prinsip Swiss Minimalist Design untuk UI Web Mahasiswa (Revisi Judul)",
  progress: 50,
  status: "Editorial",
  catatan: "Draft visual sudah selesai di review oleh tim Medkom",
});

assert.equal(updatedPlan.id, createdPlan.id);
assert.equal(
  updatedPlan.topik,
  "5 Prinsip Swiss Minimalist Design untuk UI Web Mahasiswa (Revisi Judul)"
);
assert.equal(updatedPlan.progress, 50);
assert.equal(updatedPlan.status, "Editorial");
assert.equal(
  updatedPlan.catatan,
  "Draft visual sudah selesai di review oleh tim Medkom"
);

console.log("  ✓ Item berhasil diperbarui (Progress: 50%, Status: Editorial).");

// --------------------------------------------------------------------------
// TEST 5: Toggle Done (toggleContentPlanDone)
// --------------------------------------------------------------------------
console.log("\n[TEST 5] Pengujian Toggle Done Satu Klik (toggleContentPlanDone)...");

// Tandai Selesai (isDone = true) -> Progress otomatis 100% dan Status 'Published'
const planDone = await toggleContentPlanDone(createdPlan.id, true);
assert.equal(planDone.is_done, true, "is_done harus bernilai true");
assert.equal(planDone.progress, 100, "Progress otomatis 100% saat is_done = true");
assert.equal(planDone.status, "Published", "Status otomatis 'Published' saat is_done = true");

// Batalkan Selesai (isDone = false)
const planUndone = await toggleContentPlanDone(createdPlan.id, false);
assert.equal(planUndone.is_done, false, "is_done harus kembali false");

console.log("  ✓ Logika toggle Done otomatis menyesuaikan progress 100% dan Published.");

// --------------------------------------------------------------------------
// TEST 6: Delete Content Plan (deleteContentPlan)
// --------------------------------------------------------------------------
console.log("\n[TEST 6] Pengujian Hapus Konten (deleteContentPlan)...");

const deleteSuccess = await deleteContentPlan(createdPlan.id);
assert.equal(deleteSuccess, true, "deleteContentPlan harus mengembalikan true saat berhasil");

const plansAfterDelete = await getContentPlans();
assert.equal(plansAfterDelete.length, 14, "Jumlah item harus kembali 14 setelah dihapus");

const checkDeleted = plansAfterDelete.find((p) => p.id === createdPlan.id);
assert.equal(checkDeleted, undefined, "Item yang dihapus tidak boleh ada di list");

console.log("  ✓ Item berhasil dihapus dan storage kembali sinkron.");

// --------------------------------------------------------------------------
// TEST 7: Realtime Subscription Helper (subscribeToContentPlans)
// --------------------------------------------------------------------------
console.log("\n[TEST 7] Pengujian Realtime Subscription Helper...");

assert(
  typeof subscribeToContentPlans === "function",
  "subscribeToContentPlans harus diekspor sebagai fungsi"
);

// Pasang subscription dummy
let listenerCalled = false;
const unsubscribe = subscribeToContentPlans((payload) => {
  listenerCalled = true;
  console.log("    [Event Callback Received]", payload.eventType);
});

assert(
  typeof unsubscribe === "function",
  "subscribeToContentPlans harus mengembalikan fungsi unsubscribe pembatalan"
);

// Jalankan unsubscribe untuk memastikan pembersihan tidak melempar error
assert.doesNotThrow(() => {
  unsubscribe();
}, "Pembersihan subscription (unsubscribe) harus berjalan tanpa error");

console.log("  ✓ Realtime subscription helper dan fungsi unsubscribe terverifikasi.");

console.log("\n======================================================================");
console.log("🎉 ALL TESTS PASSED: CONTENT PLANNER SERVICE & REALTIME LAYER IS READY!");
console.log("======================================================================\n");

process.exit(0);
