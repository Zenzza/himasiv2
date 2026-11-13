import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeBirthDate,
  parseDPTBatchCSV,
  calculateTurnout,
  canUnlockResults,
  canReopenSession,
  generateUuid,
  isValidUuid,
  formatDateInput,
} from '../lib/utils/voting-helpers.ts';

test('normalizeBirthDate parses and standardizes multiple date formats', () => {
  assert.equal(normalizeBirthDate('2004-05-17'), '2004-05-17');
  assert.equal(normalizeBirthDate('17/05/2004'), '2004-05-17');
  assert.equal(normalizeBirthDate('17-05-2004'), '2004-05-17');
  assert.equal(normalizeBirthDate('1/2/2003'), '2003-02-01');
  assert.equal(normalizeBirthDate('invalid-date'), null);
  assert.equal(normalizeBirthDate(''), null);
});

test('calculateTurnout computes percentage and handles zero DPT safely', () => {
  const normal = calculateTurnout(200, 150);
  assert.equal(normal.count, 150);
  assert.equal(normal.percentage, 75);

  const rounded = calculateTurnout(3, 1);
  assert.equal(rounded.percentage, 33.3);

  const zero = calculateTurnout(0, 0);
  assert.equal(zero.count, 0);
  assert.equal(zero.percentage, 0);
});

test('parseDPTBatchCSV parses CSV lines and categorizes valid vs invalid items', () => {
  const csv = `nim,nama_lengkap,tanggal_lahir
2211500001,Ahmad Pratama,17/08/2004
2211500002,Siti Nurhaliza,2003-12-05
,Tanpa NIM,15/01/2004
2211500004,Budi Tanggal Rusak,invalid`;

  const result = parseDPTBatchCSV(csv);
  assert.equal(result.valid.length, 2);
  assert.equal(result.valid[0].nim, '2211500001');
  assert.equal(result.valid[0].tanggal_lahir, '2004-08-17');
  assert.equal(result.valid[1].tanggal_lahir, '2003-12-05');
  assert.equal(result.invalid.length, 2);
});

test('canUnlockResults enforces blind voting rules', () => {
  // Only closed sessions with unlocked = false can be unlocked
  assert.equal(canUnlockResults('draft', false), false);
  assert.equal(canUnlockResults('open', false), false);
  assert.equal(canUnlockResults('closed', false), true);
  assert.equal(canUnlockResults('closed', true), false);
  assert.equal(canUnlockResults('archived', true), false);
});

test('canReopenSession allows reopening closed sessions ONLY IF results are not unlocked yet', () => {
  assert.equal(canReopenSession('closed', false), true);
  assert.equal(canReopenSession('closed', true), false, 'Must not reopen if results are unlocked');
  assert.equal(canReopenSession('open', false), false);
});

test('generateUuid generates RFC-compliant UUID v4 and isValidUuid validates accurately', () => {
  const uuid = generateUuid();
  assert.equal(isValidUuid(uuid), true);
  assert.equal(isValidUuid('dpt-1'), false);
  assert.equal(isValidUuid('dpt-1731456789'), false);
  assert.equal(isValidUuid('cand-01'), false);
  assert.equal(isValidUuid(''), false);
  assert.equal(isValidUuid('550e8400-e29b-41d4-a716-446655440000'), true);
});

test('formatDateInput automatically inserts slashes and handles forward typing, backspacing, and ISO pasting', () => {
  // Forward typing
  assert.equal(formatDateInput('1'), '1');
  assert.equal(formatDateInput('17'), '17');
  assert.equal(formatDateInput('170'), '17/0');
  assert.equal(formatDateInput('1708'), '17/08');
  assert.equal(formatDateInput('17082'), '17/08/2');
  assert.equal(formatDateInput('17082004'), '17/08/2004');

  // Manual slash typing
  assert.equal(formatDateInput('17/', '17'), '17/');
  assert.equal(formatDateInput('17/08/', '17/08'), '17/08/');

  // Backspacing
  assert.equal(formatDateInput('17/', '17/0'), '17');
  assert.equal(formatDateInput('17/08/', '17/08/2'), '17/08');
  assert.equal(formatDateInput('17/0', '17/08'), '17/0');

  // Pasting ISO date
  assert.equal(formatDateInput('2004-08-17'), '17/08/2004');
  assert.equal(formatDateInput('2004/08/17'), '17/08/2004');

  // Max 8 digits
  assert.equal(formatDateInput('170820049999'), '17/08/2004');
});
