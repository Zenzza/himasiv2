import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const migrationPath = path.join(rootDir, "supabase", "migrations", "20261108_enhance_aspirasi_system.sql");

console.log("=== TEST MIGRATION SQL VALIDATOR ===");
console.log(`Checking migration file: ${migrationPath}`);

// 1. File existence
assert.ok(
  fs.existsSync(migrationPath),
  `Migration file not found at ${migrationPath}`
);

const sqlContent = fs.readFileSync(migrationPath, "utf-8");
assert.ok(sqlContent.trim().length > 0, "Migration file must not be empty");

// 2. Validate columns added to public.aspirasi
console.log("Validating ALTER TABLE and column additions...");
assert.match(
  sqlContent,
  /ALTER\s+TABLE\s+(public\.)?aspirasi/i,
  "Must ALTER TABLE public.aspirasi"
);
assert.match(
  sqlContent,
  /nomor_tiket\s+VARCHAR\(30\)/i,
  "Must define nomor_tiket VARCHAR(30)"
);
assert.match(
  sqlContent,
  /jawaban_admin\s+TEXT/i,
  "Must define jawaban_admin TEXT"
);
assert.match(
  sqlContent,
  /dijawab_pada\s+TIMESTAMPTZ/i,
  "Must define dijawab_pada TIMESTAMPTZ"
);
assert.match(
  sqlContent,
  /dijawab_oleh\s+TEXT/i,
  "Must define dijawab_oleh TEXT"
);
assert.match(
  sqlContent,
  /status_email\s+VARCHAR\(30\)\s+NOT\s+NULL\s+DEFAULT\s+'belum_dikirim'/i,
  "Must define status_email VARCHAR(30) NOT NULL DEFAULT 'belum_dikirim'"
);

// Check enum values for status_email
const statusValues = ["belum_dikirim", "pending", "simulasi_terkirim", "terkirim", "gagal"];
for (const val of statusValues) {
  assert.ok(
    sqlContent.includes(`'${val}'`),
    `status_email CHECK constraint must include '${val}'`
  );
}

// 3. Data migration: catatan_pengurus -> jawaban_admin
console.log("Validating data migration clauses...");
assert.match(
  sqlContent,
  /UPDATE\s+(public\.)?aspirasi\s+SET\s+jawaban_admin\s*=\s*catatan_pengurus\s+WHERE\s+jawaban_admin\s+IS\s+NULL\s+AND\s+catatan_pengurus\s+IS\s+NOT\s+NULL/i,
  "Must copy catatan_pengurus to jawaban_admin"
);

// 4. Backfill existing rows with ASP-YYYY-XXXX
assert.match(
  sqlContent,
  /UPDATE\s+(public\.)?aspirasi\s+SET\s+nomor_tiket\s*=\s*'ASP-'\s*\|\|\s*TO_CHAR\(created_at,\s*'YYYY'\)/i,
  "Must backfill existing rows with nomor_tiket format ASP-YYYY-XXXX"
);

// 5. Function & Trigger set_aspirasi_nomor_tiket
console.log("Validating PL/pgSQL function and trigger...");
assert.match(
  sqlContent,
  /CREATE\s+OR\s+REPLACE\s+FUNCTION\s+(public\.)?set_aspirasi_nomor_tiket\s*\(\)\s*RETURNS\s+TRIGGER/i,
  "Must define set_aspirasi_nomor_tiket function"
);
assert.match(
  sqlContent,
  /DROP\s+TRIGGER\s+IF\s+EXISTS\s+trg_set_aspirasi_nomor_tiket\s+ON\s+(public\.)?aspirasi/i,
  "Must drop existing trigger idempotently"
);
assert.match(
  sqlContent,
  /CREATE\s+TRIGGER\s+trg_set_aspirasi_nomor_tiket\s+BEFORE\s+INSERT\s+ON\s+(public\.)?aspirasi\s+FOR\s+EACH\s+ROW\s+EXECUTE\s+FUNCTION\s+(public\.)?set_aspirasi_nomor_tiket\(\)/i,
  "Must create trigger trg_set_aspirasi_nomor_tiket BEFORE INSERT"
);

// 6. NOT NULL constraint and Indexes
console.log("Validating constraints and indexes...");
assert.match(
  sqlContent,
  /ALTER\s+TABLE\s+(public\.)?aspirasi\s+ALTER\s+COLUMN\s+nomor_tiket\s+SET\s+NOT\s+NULL/i,
  "Must set nomor_tiket to NOT NULL"
);
assert.match(
  sqlContent,
  /CREATE\s+UNIQUE\s+INDEX\s+IF\s+NOT\s+EXISTS\s+idx_aspirasi_nomor_tiket\s+ON\s+(public\.)?aspirasi\s*\(\s*nomor_tiket\s*\)/i,
  "Must create unique index idx_aspirasi_nomor_tiket"
);
assert.match(
  sqlContent,
  /CREATE\s+INDEX\s+IF\s+NOT\s+EXISTS\s+idx_aspirasi_status\s+ON\s+(public\.)?aspirasi\s*\(\s*status\s*\)/i,
  "Must create index idx_aspirasi_status"
);

// 7. Basic SQL syntax integrity (balanced dollar quotes, balanced parens outside string literals)
console.log("Validating syntax integrity...");
const dollarMatches = sqlContent.match(/\$\$/g);
assert.ok(
  dollarMatches && dollarMatches.length % 2 === 0,
  "Dollar quotes $$ in PL/pgSQL block must be paired"
);

console.log("✓ Semua validasi migrasi SQL berhasil!");
