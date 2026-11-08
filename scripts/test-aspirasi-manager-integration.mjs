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

console.log("=== TEST INTEGRASI KOMPONEN ASPIRASIMANAGER & DASHBOARD ===");

// 1. Verifikasi Keberadaan dan Struktur components/dashboard/aspirasi-manager.tsx
console.log("\n[TEST 1] Verifikasi Komponen components/dashboard/aspirasi-manager.tsx...");
const managerPath = path.resolve(process.cwd(), "components/dashboard/aspirasi-manager.tsx");
assert.ok(
  fs.existsSync(managerPath),
  "File components/dashboard/aspirasi-manager.tsx harus sudah dibuat"
);

const managerSource = fs.readFileSync(managerPath, "utf-8");

// 1.1 Ekspor Default
assert.ok(
  /export\s+default\s+function\s+AspirasiManager/.test(managerSource),
  "AspirasiManager harus diekspor sebagai default function"
);

// 1.2 Menerima prop currentUserRole
assert.ok(
  /currentUserRole/.test(managerSource),
  "AspirasiManager harus menerima dan mengolah prop currentUserRole"
);

// 1.3 Impor utilitas maskEmail
assert.ok(
  /import\s+\{[^}]*maskEmail[^}]*\}\s+from\s+["']@\/lib\/utils\/mask-email["']/.test(managerSource),
  "AspirasiManager harus mengimpor maskEmail dari '@/lib/utils/mask-email'"
);

// 1.4 Impor service aspirasi Supabase
assert.ok(
  /import\s+\{[^}]*getAspirasiList[^}]*\}\s+from\s+["']@\/lib\/supabase\/aspirasi["']/.test(managerSource),
  "AspirasiManager harus mengimpor getAspirasiList dari '@/lib/supabase/aspirasi'"
);
assert.ok(
  /import\s+\{[^}]*subscribeToAspirasi[^}]*\}\s+from\s+["']@\/lib\/supabase\/aspirasi["']/.test(managerSource),
  "AspirasiManager harus mengimpor subscribeToAspirasi dari '@/lib/supabase/aspirasi'"
);

// 1.5 Penggunaan endpoint POST /api/aspirasi/selesai
assert.ok(
  managerSource.includes("/api/aspirasi/selesai"),
  "AspirasiManager harus memanggil API route /api/aspirasi/selesai untuk penyelesaian tiket"
);

// 1.6 Banner peringatan penguncian permanen pada modal penyelesaian
assert.ok(
  managerSource.includes("Setelah ditandai selesai, tanggapan ini akan dikunci permanen") ||
    /dikunci\s+permanen/i.test(managerSource),
  "Modal penyelesaian harus memuat peringatan penguncian permanen"
);

// 1.7 Fitur privacy email masking, copy email, dan toggle intip (peek)
assert.ok(
  /maskEmail\s*\(/.test(managerSource),
  "AspirasiManager harus memanggil maskEmail untuk memproteksi email pengirim"
);
assert.ok(
  /clipboard\.writeText/.test(managerSource),
  "AspirasiManager harus menyediakan tombol salin email ke clipboard"
);

// 1.8 Desain Swiss Minimalist & badge tiket monospaced
assert.ok(
  managerSource.includes("font-mono") && managerSource.includes("rounded-none"),
  "AspirasiManager harus menerapkan styling Swiss Minimalist (font-mono dan rounded-none)"
);

// 1.9 Badge Telah Ditanggapi & Immutability Lock pada status 'selesai'
assert.ok(
  /Telah Ditanggapi/i.test(managerSource),
  "AspirasiManager harus menampilkan badge 'Telah Ditanggapi' untuk tiket yang sudah selesai"
);

console.log("✓ Verifikasi sintaks dan fitur components/dashboard/aspirasi-manager.tsx lolos!");

// 2. Verifikasi Integrasi Shell app/dashboard/page.tsx
console.log("\n[TEST 2] Verifikasi Integrasi di app/dashboard/page.tsx...");
const dashboardPath = path.resolve(process.cwd(), "app/dashboard/page.tsx");
assert.ok(fs.existsSync(dashboardPath), "File app/dashboard/page.tsx harus ada");

const dashboardSource = fs.readFileSync(dashboardPath, "utf-8");

// 2.1 Impor AspirasiManager
assert.ok(
  /import\s+AspirasiManager\s+from\s+["']@\/components\/dashboard\/aspirasi-manager["']/.test(
    dashboardSource
  ),
  "app/dashboard/page.tsx harus mengimpor AspirasiManager dari '@/components/dashboard/aspirasi-manager'"
);

// 2.2 Mount AspirasiManager pada tab aspirasi
assert.ok(
  /activeTab\s*===\s*["']aspirasi["']\s*&&\s*\(\s*<AspirasiManager\s+currentUserRole=\{currentUserRole\}\s*\/>\s*\)/.test(
    dashboardSource
  ) ||
    dashboardSource.includes("<AspirasiManager currentUserRole={currentUserRole} />"),
  "app/dashboard/page.tsx harus me-render <AspirasiManager currentUserRole={currentUserRole} /> pada tab aspirasi"
);

// 2.3 Memastikan blok inline grid aspirasi lama telah digantikan
assert.ok(
  !dashboardSource.includes("Pesan dan masukan mahasiswa melalui form aspirasi beranda."),
  "app/dashboard/page.tsx tidak boleh lagi memiliki blok UI inline aspirasi lama"
);

console.log("✓ Verifikasi integrasi app/dashboard/page.tsx lolos!");
console.log("\n🎉 SELURUH PENGUJIAN INTEGRASI ASPIRASIMANAGER BERHASIL (100% PASSED)!");
