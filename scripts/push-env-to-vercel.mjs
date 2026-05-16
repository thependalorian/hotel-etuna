#!/usr/bin/env node
/**
 * Push .env.local values to linked Vercel project (production + preview).
 * Skips placeholders; applies production URL overrides for auth/payments.
 * Run: node scripts/push-env-to-vercel.mjs
 * Location: scripts/push-env-to-vercel.mjs
 */

import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const localPath = path.join(root, '.env.local');
const PROD_URL = process.env.VERCEL_PRODUCTION_URL || 'https://hoteletuna.com';

const ENV_TARGETS = ['production', 'preview'];

const PROD_OVERRIDES = {
  NEXTAUTH_URL: PROD_URL,
  NEXT_PUBLIC_SITE_URL: PROD_URL,
  NEXT_PUBLIC_APP_URL: PROD_URL,
  ADUMO_REDIRECT_SUCCESS_URL: `${PROD_URL}/payment/success`,
  ADUMO_REDIRECT_FAIL_URL: `${PROD_URL}/payment/failed`,
  ADUMO_WEBHOOK_URL: `${PROD_URL}/api/webhooks/adumo`,
  NEXT_PUBLIC_ENVIRONMENT: 'production',
};

/** Keys managed by Vercel runtime — do not push from local. */
const SKIP_KEYS = new Set(['VERCEL', 'VERCEL_ENV', 'VERCEL_URL', 'VERCEL_REGION']);

const PLACEHOLDER =
  /^(your-|change-me|sk_test_|pk_test_|whsec_|xxx|placeholder|todo|<REPLACE|<YOUR_)/i;

function parseEnvFile(filePath) {
  const out = {};
  if (!fs.existsSync(filePath)) return out;
  for (const line of fs.readFileSync(filePath, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const m = t.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!m) continue;
    let v = m[2].trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    out[m[1]] = v;
  }
  return out;
}

function isUsable(key, val) {
  if (SKIP_KEYS.has(key)) return false;
  if (val == null) return false;
  const v = String(val).trim();
  if (!v) return false;
  if (PLACEHOLDER.test(v)) return false;
  if (v.includes('username:password@ep-example')) return false;
  if (key === 'NODE_ENV' && v === 'development') return false;
  return true;
}

function listRemoteKeys(target) {
  const r = spawnSync('vercel', ['env', 'ls', target], {
    cwd: root,
    encoding: 'utf8',
  });
  if (r.status !== 0) return new Set();
  const keys = new Set();
  for (const line of r.stdout.split('\n')) {
    const m = line.match(/^\s+([A-Za-z_][A-Za-z0-9_]*)\s+/);
    if (m) keys.add(m[1]);
  }
  return keys;
}

function setRemote(key, value, target, exists) {
  const cmd = exists ? 'update' : 'add';
  const args = ['env', cmd, key, target, '-y', '--sensitive'];
  const r = spawnSync('vercel', args, {
    cwd: root,
    input: value,
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  if (r.status !== 0) {
    const err = (r.stderr || r.stdout || '').trim();
    throw new Error(`${cmd} ${key} (${target}): ${err}`);
  }
  return cmd;
}

if (!fs.existsSync(localPath)) {
  console.error('Missing .env.local — copy from .env.example first.');
  process.exit(1);
}

const local = parseEnvFile(localPath);
const entries = Object.entries(local).filter(([k, v]) => isUsable(k, v));

console.log(`Pushing ${entries.length} variables to Vercel (${ENV_TARGETS.join(', ')})…`);
console.log(`Production URL overrides use: ${PROD_URL}\n`);

let ok = 0;
let fail = 0;

for (const target of ENV_TARGETS) {
  const remote = listRemoteKeys(target);
  console.log(`\n— ${target} (${remote.size} existing) —`);

  for (const [key, raw] of entries) {
    const value =
      target === 'production' && PROD_OVERRIDES[key] != null
        ? PROD_OVERRIDES[key]
        : target === 'preview' && key.startsWith('NEXT_PUBLIC_') && PROD_OVERRIDES[key]
          ? PROD_OVERRIDES[key]
          : raw;

    try {
      const action = setRemote(key, value, target, remote.has(key));
      if (!remote.has(key)) remote.add(key);
      ok += 1;
      process.stdout.write(`  ${action} ${key}\n`);
    } catch (e) {
      fail += 1;
      console.error(`  FAIL ${key}: ${e.message}`);
    }
  }
}

console.log(`\nDone: ${ok} ok, ${fail} failed.`);
if (fail > 0) process.exit(1);
