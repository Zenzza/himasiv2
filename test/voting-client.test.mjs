import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateDPTVoterCredentials,
  generateReceiptCode,
} from '../lib/utils/voting-helpers.ts';

const mockDPT = [
  {
    id: 'dpt-1',
    sesi_id: 'sesi-2026-utama',
    nim: '2211500001',
    nama_lengkap: 'Aditya Kurniawan',
    tanggal_lahir: '2004-03-15',
    sudah_memilih: true,
  },
  {
    id: 'dpt-2',
    sesi_id: 'sesi-2026-utama',
    nim: '2211500002',
    nama_lengkap: 'Bella Safitri',
    tanggal_lahir: '2004-07-20',
    sudah_memilih: false,
  },
];

test('validateDPTVoterCredentials rejects non-existent NIM', () => {
  const res = validateDPTVoterCredentials(mockDPT, '9999999999', '2004-03-15');
  assert.equal(res.success, false);
  assert.match(res.error, /tidak terdaftar di DPT/i);
});

test('validateDPTVoterCredentials rejects voters who already voted', () => {
  const res = validateDPTVoterCredentials(mockDPT, '2211500001', '2004-03-15');
  assert.equal(res.success, false);
  assert.match(res.error, /telah digunakan|sudah memilih/i);
});

test('validateDPTVoterCredentials rejects mismatched birth date', () => {
  const res = validateDPTVoterCredentials(mockDPT, '2211500002', '2004-01-01');
  assert.equal(res.success, false);
  assert.match(res.error, /tanggal lahir tidak sesuai/i);
});

test('validateDPTVoterCredentials succeeds with valid 2FA input and multiple date formats', () => {
  // ISO format
  const resIso = validateDPTVoterCredentials(mockDPT, '2211500002', '2004-07-20');
  assert.equal(resIso.success, true);
  assert.equal(resIso.voter?.nim, '2211500002');

  // Indonesian DD/MM/YYYY format
  const resId = validateDPTVoterCredentials(mockDPT, '2211500002', '20/07/2004');
  assert.equal(resId.success, true);
  assert.equal(resId.voter?.nim, '2211500002');
});

test('generateReceiptCode generates standard official code with prefix', () => {
  const code = generateReceiptCode(2026);
  assert.match(code, /^HIMASI-EVOTE-2026-[A-Z0-9]{4,6}$/);
});

test('validateDPTVoterCredentials prevents double voting in state transitions', () => {
  const dynamicDPT = [
    {
      id: 'dpt-99',
      sesi_id: 'sesi-test',
      nim: '2211500099',
      nama_lengkap: 'Test Voter',
      tanggal_lahir: '2004-05-10',
      sudah_memilih: false,
    },
  ];

  // 1st attempt: eligible
  const first = validateDPTVoterCredentials(dynamicDPT, '2211500099', '10/05/2004');
  assert.equal(first.success, true);

  // Simulate vote cast: mark sudah_memilih
  dynamicDPT[0].sudah_memilih = true;

  // 2nd attempt: blocked
  const second = validateDPTVoterCredentials(dynamicDPT, '2211500099', '10/05/2004');
  assert.equal(second.success, false);
  assert.match(second.error, /telah digunakan|sudah memilih/i);
});

