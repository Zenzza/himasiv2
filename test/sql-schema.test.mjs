import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('SQL schema contains all 4 required tables and constraints', () => {
  const sql = fs.readFileSync('supabase/migrations/20261112_create_voting_tables.sql', 'utf8');
  assert.match(sql, /CREATE TABLE IF NOT EXISTS public\.voting_sesi/);
  assert.match(sql, /CREATE TABLE IF NOT EXISTS public\.voting_kandidat/);
  assert.match(sql, /CREATE TABLE IF NOT EXISTS public\.voting_dpt/);
  assert.match(sql, /CREATE TABLE IF NOT EXISTS public\.voting_suara/);
  assert.match(sql, /UNIQUE\s*\(\s*sesi_id\s*,\s*nim\s*\)/i);
  assert.doesNotMatch(sql, /CREATE TABLE IF NOT EXISTS public\.voting_suara[^;]*\bnim\b/i, 'voting_suara must not contain nim');
});

