import assert from "node:assert/strict";
import { maskEmail } from "../lib/utils/mask-email.ts";

console.log("=== UNIT TEST: MASK EMAIL (PRIVACY MASKING) ===");

// 1. Standard emails (>2 chars username)
assert.equal(maskEmail("budi.pratama@atmaluhur.ac.id"), "b***a@atmaluhur.ac.id");
assert.equal(maskEmail("alumni@gmail.com"), "a***i@gmail.com");
assert.equal(maskEmail("abc@domain.com"), "a***c@domain.com");
assert.equal(maskEmail("john.doe@example.org"), "j***e@example.org");

// 2. Short usernames (<= 2 chars)
assert.equal(maskEmail("ab@domain.com"), "a***@domain.com");
assert.equal(maskEmail("a@domain.com"), "a***@domain.com");

// 3. Invalid or malformed inputs
assert.equal(maskEmail("invalid-email"), "invalid-email");
assert.equal(maskEmail(""), "");
assert.equal(maskEmail("@domain.com"), "@domain.com");
assert.equal(maskEmail("user@"), "user@");
assert.equal(maskEmail("user@domain@another.com"), "user@domain@another.com");

// 4. Safe handling of non-string / falsy edge cases
// @ts-ignore
assert.equal(maskEmail(null), null);
// @ts-ignore
assert.equal(maskEmail(undefined), undefined);

console.log("✓ Semua pengujian maskEmail berhasil!");
