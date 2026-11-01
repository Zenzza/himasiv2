const assert = require('node:assert');
const test = require('node:test');

test('RBAC: permission matrix allows super_admin everywhere', () => {
  const { canAccessTab, canPublishContent, canEditPublishedContent } = require('../lib/types/auth-rules');
  assert.strictEqual(canAccessTab('super_admin', 'database'), true);
  assert.strictEqual(canAccessTab('super_admin', 'users'), true);
  assert.strictEqual(canAccessTab('super_admin', 'absensi'), true);
  assert.strictEqual(canAccessTab('super_admin', 'rekap-absensi'), true);
  assert.strictEqual(canAccessTab('super_admin', 'berita'), true);
  assert.strictEqual(canPublishContent('super_admin'), true);
  assert.strictEqual(canEditPublishedContent('super_admin'), true);
});

test('RBAC: bph has overview, organization, absensi, but no database or users tab', () => {
  const { canAccessTab, canPublishContent } = require('../lib/types/auth-rules');
  assert.strictEqual(canAccessTab('bph', 'database'), false);
  assert.strictEqual(canAccessTab('bph', 'users'), false);
  assert.strictEqual(canAccessTab('bph', 'absensi'), true);
  assert.strictEqual(canAccessTab('bph', 'rekap-absensi'), true);
  assert.strictEqual(canAccessTab('bph', 'aspirasi'), true);
  assert.strictEqual(canAccessTab('bph', 'dokumen'), true);
});

test('RBAC: medkominfo can publish content but cannot access absensi, rekap, or database', () => {
  const { canAccessTab, canPublishContent, canEditPublishedContent } = require('../lib/types/auth-rules');
  assert.strictEqual(canAccessTab('medkominfo', 'database'), false);
  assert.strictEqual(canAccessTab('medkominfo', 'users'), false);
  assert.strictEqual(canAccessTab('medkominfo', 'absensi'), false);
  assert.strictEqual(canAccessTab('medkominfo', 'rekap-absensi'), false);
  assert.strictEqual(canPublishContent('medkominfo'), true);
  assert.strictEqual(canEditPublishedContent('medkominfo'), true);
  assert.strictEqual(canAccessTab('medkominfo', 'berita'), true);
  assert.strictEqual(canAccessTab('medkominfo', 'kalender'), true);
  assert.strictEqual(canAccessTab('medkominfo', 'banner'), true);
});

test('RBAC: humas_biskraf is restricted contributor', () => {
  const { canAccessTab, canPublishContent, canEditPublishedContent } = require('../lib/types/auth-rules');
  assert.strictEqual(canAccessTab('humas_biskraf', 'database'), false);
  assert.strictEqual(canAccessTab('humas_biskraf', 'users'), false);
  assert.strictEqual(canAccessTab('humas_biskraf', 'absensi'), false);
  assert.strictEqual(canAccessTab('humas_biskraf', 'rekap-absensi'), false);
  assert.strictEqual(canAccessTab('humas_biskraf', 'banner'), false);
  assert.strictEqual(canAccessTab('humas_biskraf', 'berita'), true);
  assert.strictEqual(canAccessTab('humas_biskraf', 'kalender'), true);
  assert.strictEqual(canAccessTab('humas_biskraf', 'apresiasi'), true);
  assert.strictEqual(canPublishContent('humas_biskraf'), false);
  assert.strictEqual(canEditPublishedContent('humas_biskraf'), false);
});

