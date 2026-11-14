import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

describe("Security Hardening: API Route Auth & E-Voting RPC Verification", () => {
  it("lib/supabase/auth-guard.ts exists and implements verifyServerAdminAuth", () => {
    const authGuardPath = path.resolve("lib/supabase/auth-guard.ts");
    assert.strictEqual(fs.existsSync(authGuardPath), true);
    const content = fs.readFileSync(authGuardPath, "utf-8");
    assert.match(content, /export\s+async\s+function\s+verifyServerAdminAuth/);
    assert.match(content, /supabase\.auth\.getUser/);
    assert.match(content, /HIMASI_EMAIL_SECRET_TOKEN/);
    assert.match(content, /isSupabaseConfigured/);
  });

  it("POST /api/aspirasi/selesai integrates verifyServerAdminAuth guard", () => {
    const filePath = path.resolve("app/api/aspirasi/selesai/route.ts");
    assert.strictEqual(fs.existsSync(filePath), true);
    const content = fs.readFileSync(filePath, "utf-8");
    assert.match(content, /verifyServerAdminAuth/);
    assert.match(content, /authCheck\.authorized/);
    assert.match(content, /status:\s*401/);
  });

  it("POST /api/aspirasi/retry-email integrates verifyServerAdminAuth guard", () => {
    const filePath = path.resolve("app/api/aspirasi/retry-email/route.ts");
    assert.strictEqual(fs.existsSync(filePath), true);
    const content = fs.readFileSync(filePath, "utf-8");
    assert.match(content, /verifyServerAdminAuth/);
    assert.match(content, /authCheck\.authorized/);
    assert.match(content, /status:\s*401/);
  });

  it("components/dashboard/aspirasi-manager.tsx attaches session Authorization header", () => {
    const filePath = path.resolve("components/dashboard/aspirasi-manager.tsx");
    assert.strictEqual(fs.existsSync(filePath), true);
    const content = fs.readFileSync(filePath, "utf-8");
    assert.match(content, /Authorization/);
    assert.match(content, /session\?\.access_token/);
    assert.match(content, /supabase\.auth\.getSession\(\)/);
  });

  it("app/api/auth/send-email/route.ts logs security warning when secret is absent in production", () => {
    const routePath = path.resolve("app/api/auth/send-email/route.ts");
    assert.strictEqual(fs.existsSync(routePath), true);
    const content = fs.readFileSync(routePath, "utf-8");
    assert.match(content, /verifyWebhookSignature/);
    assert.match(content, /SUPABASE_AUTH_HOOK_SECRET/);
    assert.match(content, /PERINGATAN KEAMANAN/);
  });

  it(".env.example documents SUPABASE_AUTH_HOOK_SECRET instructions", () => {
    const envExamplePath = path.resolve(".env.example");
    assert.strictEqual(fs.existsSync(envExamplePath), true);
    const content = fs.readFileSync(envExamplePath, "utf-8");
    assert.match(content, /SUPABASE_AUTH_HOOK_SECRET/);
    assert.match(content, /Send Email Hook/);
  });

  it("supabase/migrations/20261114_harden_evoting_security.sql defines RLS and cast_student_vote RPC", () => {
    const migrationPath = path.resolve("supabase/migrations/20261114_harden_evoting_security.sql");
    assert.strictEqual(fs.existsSync(migrationPath), true);
    const content = fs.readFileSync(migrationPath, "utf-8");

    // RLS activation
    assert.match(content, /ALTER TABLE public\.voting_sesi ENABLE ROW LEVEL SECURITY/);
    assert.match(content, /ALTER TABLE public\.voting_kandidat ENABLE ROW LEVEL SECURITY/);
    assert.match(content, /ALTER TABLE public\.voting_dpt ENABLE ROW LEVEL SECURITY/);
    assert.match(content, /ALTER TABLE public\.voting_suara ENABLE ROW LEVEL SECURITY/);

    // Stored procedure definition
    assert.match(content, /CREATE OR REPLACE FUNCTION public\.cast_student_vote/);
    assert.match(content, /SECURITY DEFINER/);
    assert.match(content, /FOR UPDATE/);
    assert.match(content, /GRANT EXECUTE ON FUNCTION public\.cast_student_vote/);
  });

  it("lib/supabase/voting.ts castStudentVote attempts RPC first with voter credentials", () => {
    const votingPath = path.resolve("lib/supabase/voting.ts");
    assert.strictEqual(fs.existsSync(votingPath), true);
    const content = fs.readFileSync(votingPath, "utf-8");
    assert.match(content, /supabase\.rpc\(\s*["']cast_student_vote["']/);
    assert.match(content, /voterNim/);
    assert.match(content, /voterDob/);
  });

  it("components/voting/step-confirmation.tsx forwards voter credentials to castStudentVote", () => {
    const stepConfPath = path.resolve("components/voting/step-confirmation.tsx");
    assert.strictEqual(fs.existsSync(stepConfPath), true);
    const content = fs.readFileSync(stepConfPath, "utf-8");
    assert.match(content, /castStudentVote\s*\(/);
    assert.match(content, /voter\.nim/);
    assert.match(content, /voter\.tanggal_lahir/);
  });
});
