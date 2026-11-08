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

const { generateAuthEmailHtml, sendAuthEmail } = await import("../lib/email/auth-mailer.ts");
const { POST: handleSendEmailHook } = await import("../app/api/auth/send-email/route.ts");

console.log("================================================================================");
console.log("🚀 TESTING AUTH EMAIL MAILER & SUPABASE SEND-EMAIL HOOK HANDLER");
console.log("================================================================================");

// -----------------------------------------------------------------------------
// 1. Verifikasi Template HTML untuk Undangan Pengurus Baru (invite)
// -----------------------------------------------------------------------------
console.log("\n[TEST 1] Verifikasi Template Email Undangan Pengurus (invite)...");
const invitePayload = {
  to: "calon.pengurus@atmaluhur.ac.id",
  actionType: "invite",
  actionLink: "https://himasi-isb.org/login#access_token=test_token&type=invite",
  fullName: "Budi Santoso",
  role: "medkominfo",
};

const inviteHtml = generateAuthEmailHtml(invitePayload);
assert.ok(inviteHtml.includes("calon.pengurus@atmaluhur.ac.id"), "Harus memuat email penerima");
assert.ok(inviteHtml.includes("Budi Santoso"), "Harus menyapa nama lengkap pengurus");
assert.ok(inviteHtml.includes("UNDANGAN PENGURUS BARU"), "Harus memuat badge undangan pengurus");
assert.ok(inviteHtml.includes("Aktivasi Akun & Buat Kata Sandi"), "Harus memuat tombol CTA aktivasi");
assert.ok(inviteHtml.includes("Kabinet REKSABUDAYA"), "Harus memuat nama kabinet resmi");
assert.ok(inviteHtml.includes(invitePayload.actionLink), "Harus memuat tautan aktivasi");
console.log("  ✓ Template email undangan (invite) valid, responsif, dan lengkap!");

// -----------------------------------------------------------------------------
// 2. Verifikasi Template HTML untuk Reset Password (recovery)
// -----------------------------------------------------------------------------
console.log("\n[TEST 2] Verifikasi Template Email Reset Password (recovery)...");
const recoveryPayload = {
  to: "admin.himasi@atmaluhur.ac.id",
  actionType: "recovery",
  actionLink: "https://himasi-isb.org/login#access_token=recovery_token&type=recovery",
  fullName: "Siti Rahma",
};

const recoveryHtml = generateAuthEmailHtml(recoveryPayload);
assert.ok(recoveryHtml.includes("admin.himasi@atmaluhur.ac.id"), "Harus memuat email admin");
assert.ok(recoveryHtml.includes("Siti Rahma"), "Harus menyapa nama lengkap admin");
assert.ok(recoveryHtml.includes("KEAMANAN & PEMULIHAN AKUN"), "Harus memuat badge recovery");
assert.ok(recoveryHtml.includes("Atur Ulang Kata Sandi Sekarang"), "Harus memuat tombol CTA reset");
assert.ok(recoveryHtml.includes("24 jam"), "Harus memuat keterangan batas waktu kedaluwarsa");
console.log("  ✓ Template email reset kata sandi (recovery) valid dan lengkap!");

// -----------------------------------------------------------------------------
// 3. Verifikasi Error Handling Jika Webhook / Token Belum Disetel
// -----------------------------------------------------------------------------
console.log("\n[TEST 3] Verifikasi Penanganan Aman Saat Webhook Belum Dikonfigurasi...");
const origUrl = process.env.HIMASI_EMAIL_WEBHOOK_URL;
delete process.env.HIMASI_EMAIL_WEBHOOK_URL;

const noWebhookResult = await sendAuthEmail(invitePayload);
assert.equal(noWebhookResult.success, false, "Harus gagal jika webhook url tidak diatur");
assert.ok(noWebhookResult.error?.includes("Konfigurasi email webhook belum lengkap"));
process.env.HIMASI_EMAIL_WEBHOOK_URL = origUrl;

const invalidEmailResult = await sendAuthEmail({ ...invitePayload, to: "invalid-email" });
assert.equal(invalidEmailResult.success, false, "Harus menolak alamat email tanpa @");
console.log("  ✓ Validasi prasyarat konfigurasi dan email aman!");

// -----------------------------------------------------------------------------
// 4. Verifikasi Endpoint POST /api/auth/send-email (Hook Handler)
// -----------------------------------------------------------------------------
console.log("\n[TEST 4] Verifikasi Endpoint POST /api/auth/send-email...");

// 4a. Penolakan Body Kosong / Tidak Valid (HTTP 400)
const reqEmpty = new Request("http://localhost/api/auth/send-email", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: "bukan json",
});
const resEmpty = await handleSendEmailHook(reqEmpty);
assert.equal(resEmpty.status, 400, "Harus mengembalikan HTTP 400 jika JSON rusak");

// 4b. Penolakan Payload Tanpa Email (HTTP 400)
const reqNoEmail = new Request("http://localhost/api/auth/send-email", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ user: {} }),
});
const resNoEmail = await handleSendEmailHook(reqNoEmail);
assert.equal(resNoEmail.status, 400, "Harus mengembalikan HTTP 400 jika tidak ada email");

// 4c. Proteksi Secret Hook Jika Dikonfigurasi (HTTP 401)
process.env.SUPABASE_AUTH_HOOK_SECRET = "v1,whsec_MfKQ9r8U0fO8Z5x+1A3k4j5l6m7n8o9p0q1r2s3t4u5=";

const reqUnauthorized = new Request("http://localhost/api/auth/send-email", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: "Bearer wrong_token",
  },
  body: JSON.stringify({
    user: { email: "test@atmaluhur.ac.id" },
    email_data: { token_hash: "tok123", email_action_type: "invite" },
  }),
});
const resUnauthorized = await handleSendEmailHook(reqUnauthorized);
assert.equal(resUnauthorized.status, 401, "Harus mengembalikan HTTP 401 jika secret tidak cocok");

// 4d. Verifikasi Sukses dengan Standard Webhooks HMAC Signature
import crypto from "node:crypto";
const testSecret = "v1,whsec_MfKQ9r8U0fO8Z5x+1A3k4j5l6m7n8o9p0q1r2s3t4u5=";
const cleanSecret = testSecret.slice(9);
const key = Buffer.from(cleanSecret, "base64");
const testMsgId = "msg_test_001";
const testTimestamp = Math.floor(Date.now() / 1000).toString();
const testPayload = JSON.stringify({
  user: { email: "calon.admin@atmaluhur.ac.id" },
  email_data: { token_hash: "tok456", email_action_type: "invite" },
});
const testSignature = crypto
  .createHmac("sha256", key)
  .update(`${testMsgId}.${testTimestamp}.${testPayload}`)
  .digest("base64");

// Without webhook url, it will fail safely with HTTP 502/error but MUST PASS auth check (not 401)
delete process.env.HIMASI_EMAIL_WEBHOOK_URL;
const reqSigned = new Request("http://localhost/api/auth/send-email", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "webhook-id": testMsgId,
    "webhook-timestamp": testTimestamp,
    "webhook-signature": `v1,${testSignature}`,
  },
  body: testPayload,
});
const resSigned = await handleSendEmailHook(reqSigned);
assert.notEqual(resSigned.status, 401, "Request dengan Standard Webhooks signature valid TIDAK BOLEH ditolak 401");
process.env.HIMASI_EMAIL_WEBHOOK_URL = origUrl;

delete process.env.SUPABASE_AUTH_HOOK_SECRET;
console.log("  ✓ Validasi keamanan, Standard Webhook HMAC signature, dan input route handler lolos 100%!");

console.log("\n================================================================================");
console.log("🎉 SEMUA PENGUJIAN AUTH EMAIL & HOOK SUKSES 100%!");
console.log("================================================================================");
