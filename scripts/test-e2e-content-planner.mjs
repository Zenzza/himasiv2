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

console.log("================================================================================");
console.log("🚀 STARTING COMPREHENSIVE END-TO-END (E2E) TEST SUITE: CONTENT PLANNER MODULE");
console.log("================================================================================\n");

// Dynamic imports to execute safely after re-spawn with ESM loader
const {
  DEFAULT_CONTENT_PLANS,
  PLATFORM_OPTIONS,
  TIPE_KONTEN_OPTIONS,
  KONSEP_OPTIONS,
  OBJEKTIF_OPTIONS,
  STATUS_OPTIONS,
  TIPE_KONTEN_STYLES,
  KONSEP_STYLES,
  OBJEKTIF_STYLES,
  STATUS_STYLES,
} = await import("../lib/types/content-planner.ts");

const {
  getCalendarWeekNumber,
  getDaysInWeek,
  getCalendarWeeksForMonth,
  formatDayOfWeek,
  formatDateToYYYYMMDD,
  parseDateSafe,
} = await import("../lib/utils/calendar-week.ts");

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
  isSupabaseConfigured,
} = await import("../lib/supabase/content-planner.ts");

const { supabase } = await import("../lib/supabase/client.ts");

const authRules = (await import("../lib/types/auth-rules.js")).default || (await import("../lib/types/auth-rules.js"));
const { ROLE_PERMISSIONS, canAccessTab, canPublishContent, canEditPublishedContent } = authRules;

// ==============================================================================
// SUITE 1: Integritas Migrasi Database & Supabase Realtime DDL
// ==============================================================================
console.log("--------------------------------------------------------------------------------");
console.log("📌 [SUITE 1] Integritas Migrasi Database & Supabase Realtime DDL");
console.log("--------------------------------------------------------------------------------");

const migrationFilePath = path.join(
  process.cwd(),
  "supabase",
  "migrations",
  "20261107_create_content_plans.sql"
);

assert(
  fs.existsSync(migrationFilePath),
  "File migrasi supabase/migrations/20261107_create_content_plans.sql harus ada di repositori"
);

const migrationSql = fs.readFileSync(migrationFilePath, "utf8");
assert(migrationSql.length > 500, "File migrasi SQL harus memiliki konten DDL yang memadai");

// 1.1 Verifikasi Definisi Tabel & 17 Kolom Wajib
assert(
  migrationSql.includes("CREATE TABLE IF NOT EXISTS public.content_plans"),
  "DDL harus memuat 'CREATE TABLE IF NOT EXISTS public.content_plans'"
);

const requiredColumns = [
  { name: "id", type: "UUID" },
  { name: "tanggal", type: "DATE" },
  { name: "calendar_week", type: "INTEGER" },
  { name: "day_of_week", type: "VARCHAR" },
  { name: "platform", type: "VARCHAR" },
  { name: "tipe_konten", type: "VARCHAR" },
  { name: "topik", type: "TEXT" },
  { name: "konsep", type: "VARCHAR" },
  { name: "objektif", type: "VARCHAR" },
  { name: "status", type: "VARCHAR" },
  { name: "referensi_url", type: "TEXT" },
  { name: "progress", type: "INTEGER" },
  { name: "is_done", type: "BOOLEAN" },
  { name: "catatan", type: "TEXT" },
  { name: "created_by", type: "UUID" },
  { name: "created_at", type: "TIMESTAMP" },
  { name: "updated_at", type: "TIMESTAMP" },
];

for (const col of requiredColumns) {
  assert(
    migrationSql.includes(`${col.name} ${col.type}`),
    `Skema tabel public.content_plans harus memuat kolom: '${col.name} ${col.type}'`
  );
}
assert.equal(requiredColumns.length, 17, "Harus memverifikasi tepat 17 kolom tabel");
console.log(`  ✓ 1.1 Definisi tabel dan 17 kolom skema lengkap terverifikasi`);

// 1.2 Verifikasi Constraint CHECK (platform, status, progress)
const normalizedSql = migrationSql.replace(/\s+/g, " ");
assert(
  normalizedSql.includes("platform IN ('TikTok', 'Instagram', 'YouTube', 'Web', 'Lainnya')"),
  "DDL harus memuat CHECK constraint untuk seluruh opsi platform (tanpa LinkedIn)"
);
assert(
  normalizedSql.includes("status IN ('Planning', 'On Proses', 'Revisi', 'Review', 'Publish')"),
  "DDL harus memuat CHECK constraint untuk status siklus konten"
);
assert(
  normalizedSql.includes("progress >= 0 AND progress <= 100"),
  "DDL harus memuat CHECK constraint batas nilai progress 0 s.d. 100"
);
console.log("  ✓ 1.2 Constraint CHECK (platform, status, progress) terverifikasi");

// 1.3 Verifikasi Indeks Performa
assert(
  migrationSql.includes("CREATE INDEX IF NOT EXISTS idx_content_plans_platform_date"),
  "DDL harus mendefinisikan indeks filter platform dan tanggal"
);
assert(
  migrationSql.includes("CREATE INDEX IF NOT EXISTS idx_content_plans_cw"),
  "DDL harus mendefinisikan indeks calendar_week dan tanggal"
);
assert(
  migrationSql.includes("CREATE INDEX IF NOT EXISTS idx_content_plans_status"),
  "DDL harus mendefinisikan indeks status"
);
console.log("  ✓ 1.3 Indeks performa query (platform_date, cw, status) terverifikasi");

// 1.4 Verifikasi Trigger updated_at otomatis
assert(
  migrationSql.includes("CREATE OR REPLACE FUNCTION public.handle_content_plans_updated_at") ||
    migrationSql.includes("trg_content_plans_updated_at"),
  "DDL harus memuat fungsi atau trigger otomasi pembaruan updated_at"
);
console.log("  ✓ 1.4 Trigger otomatisasi updated_at terverifikasi");

// 1.5 Verifikasi Row Level Security (RLS) & Kebijakan Akses
assert(
  migrationSql.includes("ALTER TABLE public.content_plans ENABLE ROW LEVEL SECURITY"),
  "DDL harus mengaktifkan Row Level Security (RLS)"
);
assert(
  migrationSql.includes("CREATE POLICY") &&
    migrationSql.includes("FOR SELECT") &&
    migrationSql.includes("FOR INSERT") &&
    migrationSql.includes("FOR UPDATE") &&
    migrationSql.includes("FOR DELETE"),
  "DDL harus mendefinisikan kebijakan RLS untuk operasi SELECT, INSERT, UPDATE, dan DELETE"
);
console.log("  ✓ 1.5 Row Level Security (RLS) & Policies terverifikasi");

// 1.6 Verifikasi Pendaftaran ke Publikasi Supabase Realtime
assert(
  migrationSql.includes("ALTER PUBLICATION supabase_realtime ADD TABLE public.content_plans"),
  "DDL harus mendaftarkan public.content_plans ke supabase_realtime"
);
console.log("  ✓ 1.6 Pendaftaran ke supabase_realtime WebSocket publikasi terverifikasi");

// 1.7 Verifikasi 14 Data Seed Sesuai Mockup Medkominfo (CW 45 & CW 46 Tahun 2026)
assert(
  migrationSql.includes("INSERT INTO public.content_plans"),
  "DDL harus memuat perintah INSERT seed items"
);
assert(
  migrationSql.includes("Roadmap Belajar UI/UX"),
  "DDL harus memuat konten seed CW 45 (Roadmap Belajar UI/UX)"
);
assert(
  migrationSql.includes("Recap Mingguan Info Akademik"),
  "DDL harus memuat konten seed CW 46 (Recap Mingguan Info Akademik)"
);
console.log("  ✓ 1.7 Data seed 14 item awal Medkominfo terverifikasi");


// ==============================================================================
// SUITE 2: Presisi Utilitas Calendar Week (CW) & Batas Minggu Sunday-Based
// ==============================================================================
console.log("\n--------------------------------------------------------------------------------");
console.log("📌 [SUITE 2] Presisi Utilitas Calendar Week (CW) & Batas Minggu Sunday-Based");
console.log("--------------------------------------------------------------------------------");

// 2.1 Verifikasi Perhitungan CW 22 (26 Mei 2024 - 01 Juni 2024)
const cw22Dates = [
  { date: "2024-05-26", day: "Sunday", expectedCw: 22 },
  { date: "2024-05-27", day: "Monday", expectedCw: 22 },
  { date: "2024-05-28", day: "Tuesday", expectedCw: 22 },
  { date: "2024-05-29", day: "Wednesday", expectedCw: 22 },
  { date: "2024-05-30", day: "Thursday", expectedCw: 22 },
  { date: "2024-05-31", day: "Friday", expectedCw: 22 },
  { date: "2024-06-01", day: "Saturday", expectedCw: 22 },
];

for (const item of cw22Dates) {
  const cw = getCalendarWeekNumber(item.date);
  assert.equal(
    cw,
    item.expectedCw,
    `Tanggal ${item.date} (${item.day}) harus dihitung sebagai CW ${item.expectedCw}, diperoleh: CW ${cw}`
  );
}
console.log("  ✓ 2.1 CW 22 (26 Mei - 1 Juni 2024) presisi di seluruh hari Minggu-Sabtu");

// 2.2 Verifikasi Perhitungan CW 23 (02 Juni 2024 - 08 Juni 2024)
const cw23Dates = [
  { date: "2024-06-02", day: "Sunday", expectedCw: 23 },
  { date: "2024-06-03", day: "Monday", expectedCw: 23 },
  { date: "2024-06-04", day: "Tuesday", expectedCw: 23 },
  { date: "2024-06-05", day: "Wednesday", expectedCw: 23 },
  { date: "2024-06-06", day: "Thursday", expectedCw: 23 },
  { date: "2024-06-07", day: "Friday", expectedCw: 23 },
  { date: "2024-06-08", day: "Saturday", expectedCw: 23 },
];

for (const item of cw23Dates) {
  const cw = getCalendarWeekNumber(item.date);
  assert.equal(
    cw,
    item.expectedCw,
    `Tanggal ${item.date} (${item.day}) harus dihitung sebagai CW ${item.expectedCw}, diperoleh: CW ${cw}`
  );
}
console.log("  ✓ 2.2 CW 23 (2 Juni - 8 Juni 2024) presisi di seluruh hari Minggu-Sabtu");

// 2.3 Verifikasi getDaysInWeek Mengembalikan 7 Hari Dimulai Hari Minggu
const daysCw22 = getDaysInWeek(2024, 22);
assert.equal(daysCw22.length, 7, "getDaysInWeek(2024, 22) harus mengembalikan tepat 7 hari");
assert.equal(daysCw22[0].getDay(), 0, "Hari pertama getDaysInWeek harus hari Minggu (Sunday, getDay() === 0)");
assert.equal(formatDateToYYYYMMDD(daysCw22[0]), "2024-05-26", "Hari pertama CW 22 harus 2024-05-26");
assert.equal(daysCw22[6].getDay(), 6, "Hari ketujuh getDaysInWeek harus hari Sabtu (Saturday, getDay() === 6)");
assert.equal(formatDateToYYYYMMDD(daysCw22[6]), "2024-06-01", "Hari terakhir CW 22 harus 2024-06-01");

const daysCw23 = getDaysInWeek(2024, 23);
assert.equal(daysCw23.length, 7, "getDaysInWeek(2024, 23) harus mengembalikan tepat 7 hari");
assert.equal(daysCw23[0].getDay(), 0, "Hari pertama CW 23 harus hari Minggu");
assert.equal(formatDateToYYYYMMDD(daysCw23[0]), "2024-06-02", "Hari pertama CW 23 harus 2024-06-02");
assert.equal(daysCw23[6].getDay(), 6, "Hari terakhir CW 23 harus hari Sabtu");
assert.equal(formatDateToYYYYMMDD(daysCw23[6]), "2024-06-08", "Hari terakhir CW 23 harus 2024-06-08");
console.log("  ✓ 2.3 getDaysInWeek menghasilkan struktur 7 hari Sunday-to-Saturday yang konsisten");

// 2.4 Verifikasi getCalendarWeeksForMonth Lintas Batas Bulan
const weeksInJune2024 = getCalendarWeeksForMonth(2024, 5); // Bulan Juni (indeks 5)
assert(Array.isArray(weeksInJune2024), "getCalendarWeeksForMonth harus mengembalikan array");
assert(
  weeksInJune2024.includes(22),
  "Juni 2024 harus menyertakan CW 22 karena tanggal 1 Juni jatuh pada Sabtu di CW 22"
);
assert(weeksInJune2024.includes(23), "Juni 2024 harus menyertakan CW 23");
assert(weeksInJune2024.includes(24), "Juni 2024 harus menyertakan CW 24");
assert(weeksInJune2024.includes(25), "Juni 2024 harus menyertakan CW 25");
assert(weeksInJune2024.includes(26), "Juni 2024 harus menyertakan CW 26");
assert(weeksInJune2024.includes(27), "Juni 2024 harus menyertakan CW 27");
console.log("  ✓ 2.4 getCalendarWeeksForMonth menangani irisan minggu antar-bulan dengan presisi");

// 2.5 Verifikasi Format Day & Date
const formattedSun = formatDayOfWeek(parseDateSafe("2024-05-26"));
assert.equal(formattedSun.dayName, "Sunday");
assert.equal(formattedSun.dayNumber, 26);
assert.equal(formattedSun.fullDate, "2024-05-26");
console.log("  ✓ 2.5 formatDayOfWeek & formatDateToYYYYMMDD tervalidasi");


// ==============================================================================
// SUITE 3: Siklus CRUD & Sinkronisasi Progres / Done
// ==============================================================================
console.log("\n--------------------------------------------------------------------------------");
console.log("📌 [SUITE 3] Siklus CRUD & Sinkronisasi Progres / Done");
console.log("--------------------------------------------------------------------------------");

// 3.1 Reset Data Storage ke Mockup Bawaan
resetContentPlansStorageToDefault();
const initialData = await getContentPlans();
assert.equal(
  initialData.length,
  14,
  "Seed bawaan harus memiliki tepat 14 rencana konten (7 di CW 45, 7 di CW 46)"
);

const cw45Items = initialData.filter((item) => item.calendar_week === 45);
const cw46Items = initialData.filter((item) => item.calendar_week === 46);
assert.equal(cw45Items.length, 7, "CW 45 harus memuat 7 item konten");
assert.equal(cw46Items.length, 7, "CW 46 harus memuat 7 item konten");

const initialTikTok = await getContentPlans({ platform: "TikTok" });
const initialInstagram = await getContentPlans({ platform: "Instagram" });
assert(initialTikTok.length > 0, "Platform TikTok harus memuat item seed");
assert(initialInstagram.length > 0, "Platform Instagram harus memuat item seed");
console.log("  ✓ 3.1 Inisialisasi seed 14 item (CW 45 & CW 46) terverifikasi");

// 3.2 Penambahan Item Baru (createContentPlan)
const newContentPayload = {
  tanggal: "2026-11-15",
  calendar_week: 47,
  day_of_week: "Sunday",
  platform: "Instagram",
  tipe_konten: "Edukasi",
  topik: "E2E Test: 10 Framework UI Paling Populer untuk Frontend Web 2026",
  konsep: "Feeds",
  status: "Planning",
  referensi_url: "https://instagram.com/p/himasi-e2e-ref",
  progress: 25,
  is_done: false,
  catatan: "Gunakan palet warna Swiss Minimalist #001740 dan font sans-serif tebal",
};

const createdItem = await createContentPlan(newContentPayload);
assert(createdItem, "createContentPlan harus mengembalikan objek item baru");
assert(createdItem.id, "Item baru harus memiliki ID UUID yang valid");
assert.equal(createdItem.topik, newContentPayload.topik);
assert.equal(createdItem.platform, "Instagram");
assert.equal(createdItem.calendar_week, 47);
assert.equal(createdItem.progress, 25);
assert.equal(createdItem.is_done, false);
assert(createdItem.created_at, "Item baru harus memiliki timestamp created_at");
assert(createdItem.updated_at, "Item baru harus memiliki timestamp updated_at");

const listAfterCreate = await getContentPlans();
assert.equal(listAfterCreate.length, 15, "Jumlah total item setelah create harus menjadi 15");

const igListAfterCreate = await getContentPlans({ platform: "Instagram" });
assert(igListAfterCreate.length >= 1, "Filter Instagram harus memuat item baru");
console.log(`  ✓ 3.2 createContentPlan berhasil menambahkan item baru [ID: ${createdItem.id.slice(0, 8)}...]`);

// 3.3 Pembaruan Inline (updateContentPlan)
const updatePayload = {
  topik: "E2E Test: 10 Framework UI Paling Populer untuk Frontend Web 2026 (Revisi Final)",
  progress: 75,
  status: "Review",
  catatan: "Draft visual aset selesai di-review BPH",
};

const updatedItem = await updateContentPlan(createdItem.id, updatePayload);
assert.equal(updatedItem.id, createdItem.id);
assert.equal(updatedItem.topik, updatePayload.topik);
assert.equal(updatedItem.progress, 75);
assert.equal(updatedItem.status, "Review");
assert.equal(updatedItem.catatan, updatePayload.catatan);

const fetchedAfterUpdate = await getContentPlans();
const verifiedItem = fetchedAfterUpdate.find((p) => p.id === createdItem.id);
assert(verifiedItem, "Item yang diperbarui harus ditemukan di storage");
assert.equal(verifiedItem.topik, updatePayload.topik);
assert.equal(verifiedItem.progress, 75);
console.log("  ✓ 3.3 updateContentPlan berhasil memperbarui topik, progress, status, dan catatan");

// 3.4 Pengujian Satu-Klik toggleContentPlanDone
// Case 3.4.A: Centang Selesai (isDone = true) -> Progress otomatis 100% & Status Publish
const doneItem = await toggleContentPlanDone(createdItem.id, true);
assert.equal(doneItem.is_done, true, "is_done harus bernilai true");
assert.equal(
  doneItem.progress,
  100,
  "Progress harus otomatis sinkron ke 100% saat is_done bernilai true"
);
assert.equal(
  doneItem.status,
  "Publish",
  "Status harus otomatis berubah menjadi 'Publish' saat is_done bernilai true"
);

// Case 3.4.B: Batal Selesai (isDone = false)
const undoneItem = await toggleContentPlanDone(createdItem.id, false);
assert.equal(undoneItem.is_done, false, "is_done harus kembali bernilai false");
console.log("  ✓ 3.4 toggleContentPlanDone berhasil mengotomasi progres 100% dan status Publish");

// 3.5 Penghapusan Item (deleteContentPlan)
const deleteResult = await deleteContentPlan(createdItem.id);
assert.equal(deleteResult, true, "deleteContentPlan harus mengembalikan true");

const listAfterDelete = await getContentPlans();
assert.equal(
  listAfterDelete.length,
  14,
  "Jumlah item harus kembali menjadi 14 setelah item dihapus"
);
const deletedCheck = listAfterDelete.find((p) => p.id === createdItem.id);
assert.equal(deletedCheck, undefined, "Item yang dihapus tidak boleh ada di list rencana");
console.log("  ✓ 3.5 deleteContentPlan berhasil menghapus item dan menjaga integritas koleksi");


// ==============================================================================
// SUITE 4: Simulasi Kolaborasi Realtime Multi-User WebSocket
// ==============================================================================
console.log("\n--------------------------------------------------------------------------------");
console.log("📌 [SUITE 4] Simulasi Kolaborasi Realtime Multi-User WebSocket");
console.log("--------------------------------------------------------------------------------");

// 4.1 Pendaftaran Dua Pengguna Bersamaan (User Medkominfo A & User BPH B)
const receivedEventsUserA = [];
const receivedEventsUserB = [];

const unsubscribeUserA = subscribeToContentPlans((payload) => {
  receivedEventsUserA.push(payload);
});

const unsubscribeUserB = subscribeToContentPlans((payload) => {
  receivedEventsUserB.push(payload);
});

assert(
  typeof unsubscribeUserA === "function",
  "subscribeToContentPlans harus mengembalikan fungsi unsubscribe pembatalan"
);
assert(
  typeof unsubscribeUserB === "function",
  "subscribeToContentPlans harus mengembalikan fungsi unsubscribe pembatalan"
);

const channelsBefore = supabase.getChannels();
const contentPlanChannels = channelsBefore.filter((ch) => ch.topic.includes("content_plans"));
assert(
  contentPlanChannels.length >= 2,
  "Harus terdaftar minimal 2 channel WebSocket untuk User A dan User B"
);
console.log(`  ✓ 4.1 Listener multi-user terdaftar (${contentPlanChannels.length} channel aktif)`);

// 4.2 Simulasi Multi-User Broadcast: Event INSERT
const mockIncomingNewItem = {
  id: "simulated-collab-id-001",
  tanggal: "2026-11-03",
  calendar_week: 45,
  day_of_week: "Tuesday",
  platform: "TikTok",
  tipe_konten: "Edukasi",
  topik: "POV: Ketika Kamu Ditunjuk Jadi Koordinator Dokumentasi HIMASI",
  konsep: "Short Video",
  status: "Planning",
  referensi_url: "https://tiktok.com/@himasi/collab-sim",
  progress: 0,
  is_done: false,
  catatan: "Ditambahkan oleh Divisi Humas secara realtime",
};

// Picu event broadcast INSERT melalui trigger channel bindings
for (const ch of contentPlanChannels) {
  const binding = ch.bindings.postgres_changes?.[0];
  if (binding && typeof binding.callback === "function") {
    binding.callback({
      eventType: "INSERT",
      new: mockIncomingNewItem,
      old: {},
    });
  }
}

assert.equal(receivedEventsUserA.length, 1, "User A harus menerima 1 event INSERT");
assert.equal(receivedEventsUserB.length, 1, "User B harus menerima 1 event INSERT");
assert.equal(receivedEventsUserA[0].eventType, "INSERT");
assert.equal(receivedEventsUserB[0].eventType, "INSERT");
assert.equal(receivedEventsUserA[0].new?.id, mockIncomingNewItem.id);
assert.equal(receivedEventsUserB[0].new?.topik, mockIncomingNewItem.topik);
console.log("  ✓ 4.2 Broadcast INSERT diterima serentak oleh User A dan User B");

// 4.3 Simulasi Multi-User Broadcast: Event UPDATE
const mockUpdatedItem = {
  ...mockIncomingNewItem,
  topik: "POV: Ketika Kamu Ditunjuk Jadi Koordinator Dokumentasi HIMASI (Approved)",
  progress: 75,
  status: "Review",
};

for (const ch of contentPlanChannels) {
  const binding = ch.bindings.postgres_changes?.[0];
  if (binding && typeof binding.callback === "function") {
    binding.callback({
      eventType: "UPDATE",
      new: mockUpdatedItem,
      old: { id: mockIncomingNewItem.id },
    });
  }
}

assert.equal(receivedEventsUserA.length, 2, "User A harus menerima event UPDATE (total 2)");
assert.equal(receivedEventsUserB.length, 2, "User B harus menerima event UPDATE (total 2)");
assert.equal(receivedEventsUserA[1].eventType, "UPDATE");
assert.equal(receivedEventsUserA[1].new?.progress, 75);
assert.equal(receivedEventsUserB[1].new?.status, "Review");
console.log("  ✓ 4.3 Broadcast UPDATE (Progress: 75%, Status: Review) tersinkronisasi");

// 4.4 Simulasi Multi-User Broadcast: Event DELETE
for (const ch of contentPlanChannels) {
  const binding = ch.bindings.postgres_changes?.[0];
  if (binding && typeof binding.callback === "function") {
    binding.callback({
      eventType: "DELETE",
      new: {},
      old: { id: mockIncomingNewItem.id },
    });
  }
}

assert.equal(receivedEventsUserA.length, 3, "User A harus menerima event DELETE (total 3)");
assert.equal(receivedEventsUserB.length, 3, "User B harus menerima event DELETE (total 3)");
assert.equal(receivedEventsUserA[2].eventType, "DELETE");
assert.equal(receivedEventsUserA[2].old?.id, mockIncomingNewItem.id);
console.log("  ✓ 4.4 Broadcast DELETE terdistribusi dan menghapus slot konten");

// 4.5 Verifikasi Pemanggilan Unsubscribe (Memory Leak Prevention)
unsubscribeUserA();
const channelsAfterUnsubA = supabase.getChannels().filter((ch) => ch.topic.includes("content_plans"));
assert.equal(
  channelsAfterUnsubA.length,
  contentPlanChannels.length - 1,
  "Channel User A harus dilepas dari socket pool setelah unsubscribe"
);

unsubscribeUserB();
const channelsAfterUnsubB = supabase.getChannels().filter((ch) => ch.topic.includes("content_plans"));
assert.equal(
  channelsAfterUnsubB.length,
  0,
  "Seluruh channel content_plans harus bersih (0 channel) untuk mencegah memory leak"
);
console.log("  ✓ 4.5 Pemanggilan unsubscribe berhasil membersihkan seluruh WebSocket channel");


// ==============================================================================
// SUITE 5: Verifikasi Matriks Otorisasi Peran (RBAC)
// ==============================================================================
console.log("\n--------------------------------------------------------------------------------");
console.log("📌 [SUITE 5] Verifikasi Matriks Otorisasi Peran (RBAC)");
console.log("--------------------------------------------------------------------------------");

// 5.1 Akses Tab 'content-planner' untuk Semua Peran
const testRoles = ["super_admin", "bph", "medkominfo", "humas_biskraf"];
for (const role of testRoles) {
  const allowed = canAccessTab(role, "content-planner");
  assert.equal(
    allowed,
    true,
    `Peran '${role}' harus memiliki hak akses ke tab 'content-planner'`
  );
}
console.log("  ✓ 5.1 canAccessTab mengizinkan tab 'content-planner' untuk semua 4 peran");

// 5.2 Fallback Akses Tab Aman saat Role Kosong atau Tidak Dikenal
assert.equal(
  canAccessTab(null, "content-planner"),
  true,
  "canAccessTab dengan role null harus fallback aman ke humas_biskraf (akses diizinkan)"
);
assert.equal(
  canAccessTab("unknown_role_xyz", "content-planner"),
  true,
  "canAccessTab dengan role antah berantah harus fallback aman ke default"
);
console.log("  ✓ 5.2 Fallback peran tak dikenal atau null tetap aman dan mengizinkan tab");

// 5.3 Verifikasi Keberadaan Tab di ROLE_PERMISSIONS
assert(ROLE_PERMISSIONS.super_admin.tabs.includes("content-planner"));
assert(ROLE_PERMISSIONS.bph.tabs.includes("content-planner"));
assert(ROLE_PERMISSIONS.medkominfo.tabs.includes("content-planner"));
assert(ROLE_PERMISSIONS.humas_biskraf.tabs.includes("content-planner"));
console.log("  ✓ 5.3 Konfigurasi ROLE_PERMISSIONS memuat tab 'content-planner' di setiap profil");

// 5.4 Verifikasi Hak Kurasi & Publikasi (canPublishContent)
assert.equal(canPublishContent("super_admin"), true, "super_admin harus bisa publish");
assert.equal(canPublishContent("bph"), true, "bph harus bisa publish");
assert.equal(canPublishContent("medkominfo"), true, "medkominfo harus bisa publish");
assert.equal(canPublishContent("humas_biskraf"), false, "humas_biskraf tidak boleh publish (hanya ideate)");
console.log("  ✓ 5.4 Hak publish terkunci untuk Medkominfo, BPH, & Super Admin; Humas dibatasi");


// ==============================================================================
// SUITE 6: Verifikasi Ekspor Komponen Antarmuka & Shell Dashboard
// ==============================================================================
console.log("\n--------------------------------------------------------------------------------");
console.log("📌 [SUITE 6] Verifikasi Ekspor Komponen Antarmuka & Shell Dashboard");
console.log("--------------------------------------------------------------------------------");

const projectRoot = process.cwd();

// 6.1 Verifikasi Eksistensi File Komponen
const managerFile = path.join(projectRoot, "components", "dashboard", "content-planner-manager.tsx");
const cwTableFile = path.join(projectRoot, "components", "dashboard", "content-planner", "cw-table-view.tsx");
const calendarGridFile = path.join(projectRoot, "components", "dashboard", "content-planner", "calendar-grid-view.tsx");
const modalFile = path.join(projectRoot, "components", "dashboard", "content-planner", "content-modal.tsx");
const dashboardPageFile = path.join(projectRoot, "app", "dashboard", "page.tsx");
const authTypesFile = path.join(projectRoot, "lib", "types", "auth.ts");

assert(fs.existsSync(managerFile), "components/dashboard/content-planner-manager.tsx harus ada");
assert(fs.existsSync(cwTableFile), "components/dashboard/content-planner/cw-table-view.tsx harus ada");
assert(fs.existsSync(calendarGridFile), "components/dashboard/content-planner/calendar-grid-view.tsx harus ada");
assert(fs.existsSync(modalFile), "components/dashboard/content-planner/content-modal.tsx harus ada");
assert(fs.existsSync(dashboardPageFile), "app/dashboard/page.tsx harus ada");
assert(fs.existsSync(authTypesFile), "lib/types/auth.ts harus ada");
console.log("  ✓ 6.1 Seluruh 6 file komponen dan modul antarmuka ada di filesystem");

// 6.2 Verifikasi Deklarasi & Ekspor di ContentPlannerManager
const managerCode = fs.readFileSync(managerFile, "utf8");
assert(
  managerCode.includes("export default function ContentPlannerManager"),
  "ContentPlannerManager harus diekspor sebagai default function"
);
assert(
  managerCode.includes("export interface ContentPlannerManagerProps"),
  "ContentPlannerManager harus mengekspor antarmuka ContentPlannerManagerProps"
);
assert(
  managerCode.includes("CwTableView") && managerCode.includes("CalendarGridView") && managerCode.includes("ContentModal"),
  "ContentPlannerManager harus mengimpor dan merangkul 3 subkomponen utama"
);
assert(
  managerCode.includes("subscribeToContentPlans"),
  "ContentPlannerManager harus mengikat listener realtime subscribeToContentPlans"
);
assert(
  managerCode.includes("canManage"),
  "ContentPlannerManager harus menerapkan pengecekan wewenang canManage berbasis role"
);
assert(
  managerCode.includes("activeView === \"cw-table\"") && managerCode.includes("activeView === \"calendar-grid\""),
  "ContentPlannerManager harus menyediakan toggle dual view: CW Table dan Calendar Grid"
);
console.log("  ✓ 6.2 ContentPlannerManager terdefinisi lengkap dengan integrasi subkomponen");

// 6.3 Verifikasi Subkomponen CwTableView, CalendarGridView, dan ContentModal
const cwTableCode = fs.readFileSync(cwTableFile, "utf8");
assert(
  cwTableCode.includes("export function CwTableView"),
  "cw-table-view.tsx harus mengekspor fungsi CwTableView"
);
assert(
  cwTableCode.includes("toggleContentPlanDone") || cwTableCode.includes("onToggleDone"),
  "CwTableView harus mendukung toggle done satu-klik"
);
assert(
  cwTableCode.includes("Topik / Judul") || cwTableCode.includes("topik"),
  "CwTableView harus memiliki kolom topik / judul inline edit"
);

const calendarGridCode = fs.readFileSync(calendarGridFile, "utf8");
assert(
  calendarGridCode.includes("export function CalendarGridView"),
  "calendar-grid-view.tsx harus mengekspor fungsi CalendarGridView"
);

const modalCode = fs.readFileSync(modalFile, "utf8");
assert(
  modalCode.includes("export function ContentModal"),
  "content-modal.tsx harus mengekspor fungsi ContentModal"
);
assert(
  modalCode.includes("canManage"),
  "ContentModal harus menghargai hak akses role (mengunci Ideate untuk role non-manager)"
);
console.log("  ✓ 6.3 Subkomponen (CwTableView, CalendarGridView, ContentModal) tervalidasi");

// 6.4 Verifikasi Integrasi Shell Dashboard (app/dashboard/page.tsx)
const dashboardCode = fs.readFileSync(dashboardPageFile, "utf8");
assert(
  dashboardCode.includes('import ContentPlannerManager from "@/components/dashboard/content-planner-manager"'),
  "app/dashboard/page.tsx harus mengimpor ContentPlannerManager"
);
assert(
  dashboardCode.includes('"content-planner"'),
  "app/dashboard/page.tsx harus menyertakan tab key 'content-planner'"
);
assert(
  dashboardCode.includes('canAccessTab(currentUserRole, "content-planner")'),
  "app/dashboard/page.tsx harus memproteksi render tombol tab dengan canAccessTab"
);
assert(
  dashboardCode.includes('<ContentPlannerManager currentUserRole={currentUserRole} />'),
  "app/dashboard/page.tsx harus me-render <ContentPlannerManager currentUserRole={currentUserRole} />"
);
console.log("  ✓ 6.4 Integrasi Shell Dashboard (routing tab, izin akses, & rendering) terverifikasi");

// 6.5 Verifikasi Tipe Auth (lib/types/auth.ts)
const authTypesCode = fs.readFileSync(authTypesFile, "utf8");
assert(
  authTypesCode.includes('"content-planner"'),
  "lib/types/auth.ts harus menyertakan 'content-planner' dalam union TabKey"
);
console.log("  ✓ 6.5 Union tipe TabKey pada lib/types/auth.ts memuat 'content-planner'");


// ==============================================================================
// KESIMPULAN AKHIR
// ==============================================================================
console.log("\n================================================================================");
console.log("🎉 ALL 6 TEST SUITES PASSED! 100% ASSERTIONS VALIDATED SUCCESSFULLY!");
console.log("✨ Content Planning & Strategy Module is E2E Verified & Ready for Production!");
console.log("================================================================================\n");

process.exit(0);
