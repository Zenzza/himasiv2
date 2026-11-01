const assert = require('node:assert');
const test = require('node:test');
const { getMaintenanceFallback, parseMaintenancePayload } = require('../lib/supabase/system-settings');

test('System Settings: parseMaintenancePayload returns safe defaults on null/empty', () => {
  const result = parseMaintenancePayload(null);
  assert.strictEqual(result.enabled, false);
  assert.strictEqual(result.estimatedEnd, '~15-30 Menit');
});

test('System Settings: parseMaintenancePayload parses valid JSON string or object', () => {
  const result = parseMaintenancePayload({ enabled: true, estimatedEnd: '1 Jam' });
  assert.strictEqual(result.enabled, true);
  assert.strictEqual(result.estimatedEnd, '1 Jam');
});

test('System Settings: getMaintenanceFallback returns default disabled status', () => {
  const fallback = getMaintenanceFallback();
  assert.strictEqual(fallback.enabled, false);
  assert.ok(fallback.message);
});

