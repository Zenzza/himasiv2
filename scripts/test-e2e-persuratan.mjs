import assert from "node:assert/strict";
import {
  DEFAULT_SURAT_LIST,
  DEFAULT_SURAT_MASUK_LIST,
  KODE_JENIS_SURAT_MAP,
} from "@/lib/types/persuratan";
import {
  angkaKeRomawi,
  generateNomorSurat,
  parseNomorUrut,
  parseBulanTahun,
  formatTanggalSurat,
} from "@/lib/utils/romawi";
import {
  resetSuratStorageToDefault,
  getDaftarSurat,
  getNextNomorUrut,
  createSurat,
  updateSurat,
  updateStatusSurat,
  revertSuratToDraft,
  deleteSurat,
} from "@/lib/supabase/persuratan";

console.log("=== STARTING END-TO-END VERIFICATION OF PERSURATAN MODULE ===");

// --------------------------------------------------------------------------
// TEST 1: Initial Seed List Verification
// --------------------------------------------------------------------------
console.log("\n[TEST 1] Verifikasi Seed List Bawaan...");
assert.equal(DEFAULT_SURAT_LIST.length, 5, "Seed list surat keluar harus berisi tepat 5 item sesuai mockup");

const seed014 = DEFAULT_SURAT_LIST.find((s) => s.nomor_urut === 14);
assert(seed014, "Harus terdapat surat nomor 014");
assert.equal(seed014.nomor_surat, "014/UND/HIMASI/XI/2026");
assert.equal(seed014.status, "menunggu_ttd");

const seed013 = DEFAULT_SURAT_LIST.find((s) => s.nomor_urut === 13);
assert(seed013, "Harus terdapat surat nomor 013");
assert.equal(seed013.nomor_surat, "013/PRM/HIMASI/X/2026");
assert.equal(seed013.status, "menunggu_ttd");

const seed012 = DEFAULT_SURAT_LIST.find((s) => s.nomor_urut === 12);
assert(seed012, "Harus terdapat surat nomor 012");
assert.equal(seed012.nomor_surat, "012/PDN/HIMASI/X/2026");
assert.equal(seed012.status, "menunggu_ttd");

const seed011 = DEFAULT_SURAT_LIST.find((s) => s.nomor_urut === 11);
assert(seed011, "Harus terdapat surat nomor 011");
assert.equal(seed011.nomor_surat, "011/DSP/HIMASI/X/2026");
assert.equal(seed011.status, "terkirim");

const seedDraft = DEFAULT_SURAT_LIST.find((s) => s.status === "draft");
assert(seedDraft, "Harus terdapat 1 surat draft");
assert.equal(seedDraft.nomor_urut, null, "Surat draft harus memiliki nomor_urut null");
assert.equal(seedDraft.nomor_surat, "—", "Surat draft harus memiliki nomor_surat '—'");

console.log("  ✓ Seed list 5 item valid (014, 013, 012, 011, dan draft '—')");

// --------------------------------------------------------------------------
// TEST 2: Initial Next Number Calculation starts at 015
// --------------------------------------------------------------------------
console.log("\n[TEST 2] Verifikasi Next Number Calculation Awal...");
resetSuratStorageToDefault();
const nextInitial = await getNextNomorUrut("UND", "2026-11-06");
assert.equal(nextInitial.nomor_urut, 15, "Nomor urut berikutnya awal harus 15");
assert.equal(
  nextInitial.nomor_surat,
  "015/UND/HIMASI/XI/2026",
  "Nomor surat awal harus 015/UND/HIMASI/XI/2026"
);
console.log(`  ✓ Next number awal terverifikasi: ${nextInitial.nomor_surat} (Urut: ${nextInitial.nomor_urut})`);

// --------------------------------------------------------------------------
// TEST 3: Allocating Number on Submit Assigns 015
// --------------------------------------------------------------------------
console.log("\n[TEST 3] Alokasi Nomor Resmi saat Pengajuan...");
const newSubmittedSurat = await createSurat({
  jenis_surat: "keluar",
  kode_jenis: "UND",
  kategori_label: "Undangan",
  perihal: "Undangan Pembukaan Dies Natalis ISB Atma Luhur",
  tujuan_pengirim: "Rektorat ISB Atma Luhur",
  tanggal_surat: "2026-11-06",
  status: "menunggu_ttd", // Diajukan ke BPH
});

assert.equal(newSubmittedSurat.nomor_urut, 15, "Surat yang diajukan harus dialokasikan nomor 15");
assert.equal(newSubmittedSurat.nomor_surat, "015/UND/HIMASI/XI/2026");
assert.equal(newSubmittedSurat.status, "menunggu_ttd");

const nextAfterSubmit = await getNextNomorUrut("UND", "2026-11-06");
assert.equal(nextAfterSubmit.nomor_urut, 16, "Nomor urut setelah alokasi harus bergeser ke 16");
assert.equal(nextAfterSubmit.nomor_surat, "016/UND/HIMASI/XI/2026");
console.log(`  ✓ Alokasi nomor berhasil: ${newSubmittedSurat.nomor_surat}`);
console.log(`  ✓ Counter bergeser ke: ${nextAfterSubmit.nomor_surat}`);

// --------------------------------------------------------------------------
// TEST 4: Number Recycling (Revert to Draft returns null & '—', frees 015)
// --------------------------------------------------------------------------
console.log("\n[TEST 4] Mekanisme Number Recycling (Tolak / Tarik ke Draf)...");
const revertedSurat = await revertSuratToDraft(newSubmittedSurat.id);
assert(revertedSurat, "revertSuratToDraft harus mengembalikan surat yang diupdate");
assert.equal(revertedSurat.status, "draft", "Status surat harus kembali ke 'draft'");
assert.equal(revertedSurat.nomor_urut, null, "nomor_urut harus diset null saat recycle");
assert.equal(revertedSurat.nomor_surat, "—", "nomor_surat harus diset '—' saat recycle");

const nextAfterRecycle = await getNextNomorUrut("UND", "2026-11-06");
assert.equal(
  nextAfterRecycle.nomor_urut,
  15,
  "Nomor urut berikutnya harus kembali ke 15 (didaur ulang tanpa gap)"
);
assert.equal(
  nextAfterRecycle.nomor_surat,
  "015/UND/HIMASI/XI/2026",
  "Nomor 015 harus tersedia kembali untuk pengajuan berikutnya"
);
console.log("  ✓ Number Recycling sukses: nomor_urut=null, nomor_surat='—'");
console.log(`  ✓ Nomor ${nextAfterRecycle.nomor_surat} langsung tersedia kembali tanpa celah/gaps!`);

// Alokasikan kembali nomor 015 untuk surat berikutnya untuk membuktikan ketiadaan gap
const reallocatedSurat = await createSurat({
  jenis_surat: "keluar",
  kode_jenis: "PRM",
  kategori_label: "Peminjaman Ruang",
  perihal: "Peminjaman Lab Komputer untuk Workshop Cloud Computing",
  tujuan_pengirim: "Kepala Lab Sistem Informasi",
  tanggal_surat: "2026-11-06",
  status: "menunggu_ttd",
});
assert.equal(reallocatedSurat.nomor_urut, 15);
assert.equal(reallocatedSurat.nomor_surat, "015/PRM/HIMASI/XI/2026");
console.log(`  ✓ Alokasi ulang berhasil memakai 015: ${reallocatedSurat.nomor_surat}`);

// --------------------------------------------------------------------------
// TEST 5: Surat Masuk Does Not Increment/Affect HIMASI Sequence Counter
// --------------------------------------------------------------------------
console.log("\n[TEST 5] Surat Masuk Tidak Mempengaruhi Counter Urutan HIMASI...");
const nextBeforeSuratMasuk = await getNextNomorUrut("UND", "2026-11-06");
assert.equal(nextBeforeSuratMasuk.nomor_urut, 16);

const suratMasukItem = await createSurat({
  jenis_surat: "masuk",
  kode_jenis: "UND",
  kategori_label: "Undangan",
  nomor_surat: "999/BEM-FTI/UND/XI/2026", // Nomor eksternal besar
  perihal: "Undangan Seminar Teknologi Informasi Eksternal",
  tujuan_pengirim: "Fakultas Teknologi Informasi Universitas Mitra",
  tanggal_surat: "2026-11-06",
  tanggal_diterima: "2026-11-06",
  status: "belum_disposisi",
});

assert.equal(suratMasukItem.jenis_surat, "masuk");
assert.equal(suratMasukItem.nomor_urut, null, "Surat masuk tidak boleh memiliki nomor_urut HIMASI");
assert.equal(suratMasukItem.nomor_surat, "999/BEM-FTI/UND/XI/2026");

const nextAfterSuratMasuk = await getNextNomorUrut("UND", "2026-11-06");
assert.equal(
  nextAfterSuratMasuk.nomor_urut,
  16,
  "Nomor urut HIMASI harus tetap 16 dan tidak terpengaruh nomor surat masuk 999"
);
console.log(`  ✓ Surat masuk dengan nomor '${suratMasukItem.nomor_surat}' disimpan tanpa nomor_urut internal.`);
console.log(`  ✓ Sequence counter HIMASI tetap terjaga di urut ${nextAfterSuratMasuk.nomor_urut}`);

// --------------------------------------------------------------------------
// TEST 6: CSV Export Generation, UTF-8 BOM, & Formula Injection Sanitization
// --------------------------------------------------------------------------
console.log("\n[TEST 6] Validasi Ekspor CSV, UTF-8 BOM, & Sanitasi Formula Injection...");

// Helper escape CSV persis seperti di components/dashboard/persuratan-manager.tsx
function escapeCsv(str) {
  if (str === null || str === undefined) return '""';
  let s = String(str).replace(/"/g, '""');
  // Mitigasi CSV Formula Injection (CWE-1236) jika karakter awalan berbahaya
  if (/^[=+\-@\t\r]/.test(s)) {
    s = `'${s}`;
  }
  return `"${s}"`;
}

function generateCsvString(items) {
  let csvContent = "";
  csvContent += ["Nomor Urut", "Nomor Surat", "Perihal", "Kategori", "Tujuan", "Tanggal Surat", "Status", "Nama Berkas"].join(",") + "\n";
  items.forEach((item) => {
    csvContent +=
      [
        escapeCsv(item.nomor_urut || "—"),
        escapeCsv(item.nomor_surat),
        escapeCsv(item.perihal),
        escapeCsv(item.kategori_label),
        escapeCsv(item.tujuan_pengirim),
        escapeCsv(item.tanggal_surat),
        escapeCsv(item.status),
        escapeCsv(item.file_name || "—"),
      ].join(",") + "\n";
  });
  return "\uFEFF" + csvContent;
}

// Uji kasus mitigasi CWE-1236 Formula Injection
const injectionCases = [
  { input: "=1+1", expected: "\"'=1+1\"" },
  { input: "+12345", expected: "\"'+12345\"" },
  { input: "-cmd|' /C calc'!A0", expected: "\"'-cmd|' /C calc'!A0\"" },
  { input: "@SUM(A1:A10)", expected: "\"'@SUM(A1:A10)\"" },
  { input: "\tTAB_INJECT", expected: "\"'\tTAB_INJECT\"" },
  { input: "\rCR_INJECT", expected: "\"'\rCR_INJECT\"" },
  { input: 'Normal "Quoted" Text', expected: '"Normal ""Quoted"" Text"' },
  { input: "—", expected: '"—"' },
];

for (const c of injectionCases) {
  const sanitized = escapeCsv(c.input);
  assert.equal(sanitized, c.expected, `Sanitasi gagal untuk input: ${c.input}`);
}
console.log("  ✓ Sanitasi 8 variasi CWE-1236 Formula Injection lulus");

const sampleItems = [
  {
    nomor_urut: 14,
    nomor_surat: "014/HIMASI/UND/ISB-AL/XI/2026",
    perihal: 'Undangan "Rapat Pleno" & Koordinasi',
    kategori_label: "Undangan",
    tujuan_pengirim: "BPH & Anggota",
    tanggal_surat: "2026-11-04",
    status: "menunggu_ttd",
    file_name: "surat.pdf",
  },
  {
    nomor_urut: null,
    nomor_surat: "—",
    perihal: "=cmd|' /C calc'!A0",
    kategori_label: "@Formula",
    tujuan_pengirim: "-Tujuan Malicious",
    tanggal_surat: "2026-11-06",
    status: "draft",
    file_name: null,
  },
];

const fullCsv = generateCsvString(sampleItems);
assert(fullCsv.startsWith("\uFEFF"), "CSV output harus diawali dengan UTF-8 BOM (\\uFEFF)");
assert(fullCsv.includes("\"'=cmd|' /C calc'!A0\""), "Perihal berbahaya harus diprefiks petik tunggal");
assert(fullCsv.includes("\"'@Formula\""), "Kategori berawalan @ harus diprefiks petik tunggal");
assert(fullCsv.includes("\"'-Tujuan Malicious\""), "Tujuan berawalan - harus diprefiks petik tunggal");
assert(fullCsv.includes('"Undangan ""Rapat Pleno"" & Koordinasi"'), "Tanda kutip ganda harus diescape secara valid");

console.log("  ✓ UTF-8 BOM (\\uFEFF) terverifikasi di header file CSV");
console.log("  ✓ Mitigasi formula injection berhasil melindungi spreadsheet dari eksekusi kode berbahaya");

// --------------------------------------------------------------------------
// TEST 7: Roman Numerals & Number Formatter Functions
// --------------------------------------------------------------------------
console.log("\n[TEST 7] Verifikasi Penomoran Romawi & Utilitas Tanggal...");
assert.equal(angkaKeRomawi(1), "I");
assert.equal(angkaKeRomawi(4), "IV");
assert.equal(angkaKeRomawi(9), "IX");
assert.equal(angkaKeRomawi(10), "X");
assert.equal(angkaKeRomawi(11), "XI");
assert.equal(angkaKeRomawi(12), "XII");
assert.equal(angkaKeRomawi(99), "I", "Fallback aman untuk angka di luar 1-12");

const testFormat = generateNomorSurat(7, "PDN", "2026-05-18");
assert.equal(testFormat, "007/PDN/HIMASI/V/2026");

assert.equal(parseNomorUrut("014/UND/HIMASI/XI/2026"), 14);
assert.equal(parseNomorUrut("001/DSP/HIMASI/I/2026"), 1);
assert.equal(parseNomorUrut("014/HIMASI/UND/ISB-AL/XI/2026"), 14, "Mendukung format lama untuk backward compatibility");
assert.equal(parseNomorUrut("045/BEM-ISBAL/E/X/2026"), null, "Surat luar tidak boleh dianggap nomor HIMASI");
assert.equal(parseNomorUrut("—"), null);
assert.equal(parseNomorUrut("draft"), null);

assert.equal(formatTanggalSurat("2026-11-04"), "04 Nov 2026");
assert.equal(formatTanggalSurat("2026-01-01"), "01 Jan 2026");

console.log("  ✓ Konversi Romawi, generator nomor urut, parser, dan formatter tanggal lulus semua");

console.log("\n========================================================");
console.log("🎉 ALL END-TO-END LOGIC & DATA INTEGRITY TESTS PASSED! 🎉");
console.log("========================================================");
