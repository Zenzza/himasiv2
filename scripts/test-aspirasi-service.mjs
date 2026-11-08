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

console.log("=== STARTING UNIT TESTS: ASPIRASI SERVICE & IMMUTABILITY ===");

// 1. Verify Imports from types & supabase service
const {
  STORAGE_KEY_ASPIRASI,
  isSupabaseConfigured,
  getLocalAspirasi,
  saveLocalAspirasi,
  resetAspirasiStorageToDefault,
  getAspirasiList,
  updateAspirasiStatus,
  selesaikanAspirasi,
  deleteAspirasi,
  subscribeToAspirasi,
} = await import("../lib/supabase/aspirasi.ts");

const { DEFAULT_ASPIRASI_LIST } = await import("../lib/types/aspirasi.ts");

console.log("\n[TEST 1] Verifikasi Tipe Data & Fallback Initial Seed...");
assert(Array.isArray(DEFAULT_ASPIRASI_LIST), "DEFAULT_ASPIRASI_LIST harus berupa array");
assert(DEFAULT_ASPIRASI_LIST.length >= 3, "DEFAULT_ASPIRASI_LIST minimal memiliki 3 entri seed");
assert.equal(typeof isSupabaseConfigured, "function", "isSupabaseConfigured harus berupa fungsi");
assert.equal(typeof isSupabaseConfigured(), "boolean", "isSupabaseConfigured mengembalikan boolean");

// Reset storage ke default mock
resetAspirasiStorageToDefault();
const initialList = await getAspirasiList();
assert(Array.isArray(initialList), "getAspirasiList harus mengembalikan array");
assert.equal(initialList.length, DEFAULT_ASPIRASI_LIST.length, "Jumlah item awal harus sama dengan seed");

// Pastikan setiap entri memiliki nomor tiket valid dan email
for (const item of initialList) {
  assert(item.id, "Setiap item harus memiliki id");
  assert(item.nomor_tiket, "Setiap item harus memiliki nomor_tiket");
  assert(/^ASP-\d{4}-\d{4}$/.test(item.nomor_tiket), `Format nomor_tiket tidak valid: ${item.nomor_tiket}`);
  assert(item.email, "Setiap item harus memiliki email");
  assert(item.angkatan, "Setiap item harus memiliki angkatan");
  assert(item.pesan, "Setiap item harus memiliki pesan");
  assert(["baru", "diproses", "selesai"].includes(item.status), `Status tidak dikenal: ${item.status}`);
}
console.log("  ✓ Initial seeds valid dan memuat nomor_tiket berformat ASP-YYYY-XXXX.");

// --------------------------------------------------------------------------
// TEST 2: Filter status & search
// --------------------------------------------------------------------------
console.log("\n[TEST 2] Verifikasi Filter Status & Pencarian...");
const baruItems = await getAspirasiList({ status: "baru" });
assert(baruItems.length > 0, "Harus ada minimal 1 item berstatus baru");
assert(baruItems.every((a) => a.status === "baru"), "Semua item yang difilter 'baru' harus berstatus baru");

const diprosesItems = await getAspirasiList({ status: "diproses" });
assert(diprosesItems.length > 0, "Harus ada minimal 1 item berstatus diproses");
assert(diprosesItems.every((a) => a.status === "diproses"), "Semua item yang difilter 'diproses' harus berstatus diproses");

const selesaiItems = await getAspirasiList({ status: "selesai" });
assert(selesaiItems.length > 0, "Harus ada minimal 1 item berstatus selesai");
assert(selesaiItems.every((a) => a.status === "selesai"), "Semua item yang difilter 'selesai' harus berstatus selesai");

// Test search filter
const sampleItem = baruItems[0];
const searchPesanTerm = sampleItem.pesan.slice(0, 10).toLowerCase();
const searchedByPesan = await getAspirasiList({ search: searchPesanTerm });
assert(searchedByPesan.some((a) => a.id === sampleItem.id), "Pencarian berdasarkan potongan pesan harus menemukan item");

const searchTiket = await getAspirasiList({ search: sampleItem.nomor_tiket });
assert(searchTiket.some((a) => a.id === sampleItem.id), "Pencarian berdasarkan nomor_tiket harus menemukan item");
console.log("  ✓ Filter status dan search term berfungsi dengan akurat.");

// --------------------------------------------------------------------------
// TEST 3: Update Status ke 'diproses'
// --------------------------------------------------------------------------
console.log("\n[TEST 3] Verifikasi Update Status ke 'diproses'...");
const targetBaru = baruItems[0];
const updatedDiproses = await updateAspirasiStatus(targetBaru.id, "diproses");
assert.equal(updatedDiproses.status, "diproses", "Status harus diperbarui menjadi 'diproses'");

// Verifikasi persistensi
const currentList = await getAspirasiList();
const persistedItem = currentList.find((a) => a.id === targetBaru.id);
assert(persistedItem, "Item harus ditemukan pada list terkini");
assert.equal(persistedItem.status, "diproses", "Status persisted harus 'diproses'");
console.log("  ✓ Update status ke 'diproses' berhasil dan terpersistensi.");

// --------------------------------------------------------------------------
// TEST 4: Validasi selesaikanAspirasi Menolak Jawaban Kosong / Whitespace
// --------------------------------------------------------------------------
console.log("\n[TEST 4] Verifikasi Validasi Penolakan Jawaban Admin Kosong...");
await assert.rejects(
  async () => {
    await selesaikanAspirasi(targetBaru.id, { jawaban_admin: "" });
  },
  {
    name: "Error",
    message: "Jawaban admin wajib diisi untuk menyelesaikan aspirasi",
  },
  "Harus menolak jawaban kosong"
);

await assert.rejects(
  async () => {
    await selesaikanAspirasi(targetBaru.id, { jawaban_admin: "   \n\t  " });
  },
  {
    name: "Error",
    message: "Jawaban admin wajib diisi untuk menyelesaikan aspirasi",
  },
  "Harus menolak jawaban hanya berupa whitespace"
);
console.log("  ✓ Validasi jawaban admin kosong/whitespace berhasil ditegakkan.");

// --------------------------------------------------------------------------
// TEST 5: Sukses selesaikanAspirasi dengan Jawaban Valid
// --------------------------------------------------------------------------
console.log("\n[TEST 5] Verifikasi Penyelesaian Aspirasi dengan Jawaban Valid...");
const validJawaban = "Terima kasih atas aspirasinya. Fasilitas telah kami perbaiki dan dapat digunakan dengan nyaman.";
const completedItem = await selesaikanAspirasi(targetBaru.id, {
  jawaban_admin: validJawaban,
  dijawab_oleh: "BPH HIMASI Periode 2026/2027",
});

assert.equal(completedItem.status, "selesai", "Status harus menjadi 'selesai'");
assert.equal(completedItem.jawaban_admin, validJawaban, "jawaban_admin harus tersimpan rapi");
assert.equal(completedItem.catatan_pengurus, validJawaban, "catatan_pengurus alias harus tersinkronisasi");
assert.equal(completedItem.dijawab_oleh, "BPH HIMASI Periode 2026/2027", "dijawab_oleh harus tersimpan");
assert.equal(completedItem.status_email, "simulasi_terkirim", "status_email harus 'simulasi_terkirim'");
assert(completedItem.dijawab_pada, "dijawab_pada harus terisi ISO timestamp");
console.log("  ✓ Penyelesaian aspirasi sukses dengan timestamp dan status_email simulasi_terkirim.");

// --------------------------------------------------------------------------
// TEST 6: Immutability Pasca-Selesai (Kunci Permanen)
// --------------------------------------------------------------------------
console.log("\n[TEST 6] Verifikasi Immutability (Aspirasi Selesai Terkunci Permanen)...");
// 1. Mencoba rollback status ke 'baru' atau 'diproses'
await assert.rejects(
  async () => {
    await updateAspirasiStatus(completedItem.id, "baru");
  },
  {
    name: "Error",
    message: "Aspirasi berstatus selesai telah dikunci permanen dan tidak dapat diubah",
  },
  "Tidak boleh mengubah status item yang sudah selesai ke 'baru'"
);

await assert.rejects(
  async () => {
    await updateAspirasiStatus(completedItem.id, "diproses");
  },
  {
    name: "Error",
    message: "Aspirasi berstatus selesai telah dikunci permanen dan tidak dapat diubah",
  },
  "Tidak boleh mengubah status item yang sudah selesai ke 'diproses'"
);

// 2. Mencoba selesaikanAspirasi lagi pada item yang sudah selesai
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
  "Tidak boleh menimpa jawaban pada aspirasi yang sudah selesai"
);
console.log("  ✓ Aturan immutability terbukti: aspirasi selesai terkunci permanen.");

// --------------------------------------------------------------------------
// TEST 7: Penghapusan Aspirasi (deleteAspirasi)
// --------------------------------------------------------------------------
console.log("\n[TEST 7] Verifikasi Penghapusan Aspirasi...");
const listBeforeDelete = await getAspirasiList();
const deleteResult = await deleteAspirasi(completedItem.id);
assert.equal(deleteResult, true, "deleteAspirasi harus mengembalikan boolean true");

const listAfterDelete = await getAspirasiList();
assert.equal(
  listAfterDelete.length,
  listBeforeDelete.length - 1,
  "Jumlah item harus berkurang 1 setelah penghapusan"
);
assert(
  !listAfterDelete.some((a) => a.id === completedItem.id),
  "Item yang dihapus tidak boleh muncul lagi di getAspirasiList"
);
console.log("  ✓ deleteAspirasi berhasil menghapus entri dari database/storage.");

// --------------------------------------------------------------------------
// TEST 8: Realtime Subscription Handler
// --------------------------------------------------------------------------
console.log("\n[TEST 8] Verifikasi Realtime Subscription Handler...");
let callbackCalled = false;
const unsubscribe = subscribeToAspirasi((payload) => {
  callbackCalled = true;
});
assert.equal(typeof unsubscribe, "function", "subscribeToAspirasi harus mengembalikan fungsi unsubscribe");
assert.doesNotThrow(() => {
  unsubscribe();
}, "Unsubscribe tidak boleh melempar error");
console.log("  ✓ Realtime subscription & unsubscription handler valid.");

console.log("\n=======================================================");
console.log("✓ SEMUA PENGUJIAN SERVICE LAYER ASPIRASI BERHASIL 100%");
console.log("=======================================================");

process.exit(0);
