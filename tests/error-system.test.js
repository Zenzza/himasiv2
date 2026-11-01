const assert = require('node:assert');
const test = require('node:test');
const { getErrorConfig, generateIncidentId, ERROR_CONFIGS } = require('../lib/constants/error-configs');

test('Error Config: contains all 6 required status codes', () => {
  const requiredCodes = ['404', '403', '500', '503', '401', '429'];
  for (const code of requiredCodes) {
    assert.ok(ERROR_CONFIGS[code], `Missing config for code ${code}`);
    assert.ok(ERROR_CONFIGS[code].title, `Missing title for code ${code}`);
    assert.ok(ERROR_CONFIGS[code].description, `Missing description for code ${code}`);
    assert.ok(ERROR_CONFIGS[code].primaryAction, `Missing primaryAction for code ${code}`);
  }
});

test('Error Config: getErrorConfig falls back to 404 on unknown code', () => {
  const fallback = getErrorConfig('999');
  assert.strictEqual(fallback.code, '404');
  assert.strictEqual(fallback.title, 'Halaman Tidak Ditemukan');
});

test('Error Titles: verified proper document titles for all error scenarios', () => {
  const expectedTitles = {
    '404': 'Halaman Tidak Ditemukan',
    '403': 'Akses Tidak Diizinkan',
    '500': 'Terjadi Gangguan Server',
    '503': 'Sistem Sedang Dalam Pemeliharaan',
    '401': 'Sesi Anda Telah Berakhir',
    '429': 'Terlalu Banyak Permintaan',
  };
  for (const [code, expectedTitle] of Object.entries(expectedTitles)) {
    const config = getErrorConfig(code);
    assert.strictEqual(config.title, expectedTitle, `Wrong title for code ${code}`);
    const fullMetaTitle = `${config.title} - HIMASI`;
    assert.ok(fullMetaTitle.startsWith(expectedTitle));
  }
});

test('Error Config: generateIncidentId returns ERR- format with 6 chars', () => {
  const id = generateIncidentId();
  assert.match(id, /^ERR-[A-Z0-9]{6}$/);
});


test('Error System: sanitizeRedirectUrl only allows safe internal relative paths', () => {
  const { sanitizeRedirectUrl } = require('../lib/constants/error-configs');
  assert.strictEqual(sanitizeRedirectUrl('/dashboard/berita'), '/dashboard/berita');
  assert.strictEqual(sanitizeRedirectUrl('https://evil.com'), null);
  assert.strictEqual(sanitizeRedirectUrl('//evil.com'), null);
  assert.strictEqual(sanitizeRedirectUrl('javascript:alert(1)'), null);
  assert.strictEqual(sanitizeRedirectUrl(''), null);
});
