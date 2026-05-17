#!/usr/bin/env node
/**
 * Push .env.local values to the linked Vercel project (production + preview).
 *
 * - Skips placeholders and Vercel-managed runtime keys
 * - Applies production URL overrides for auth, Adumo redirects, and webhooks
 * - Namibia: Adumo Virtual only (no Stripe); includes Sofia CRM + dining deposit vars
 *
 * Prerequisites:
 *   npm i -g vercel && vercel link   (from hotel-etuna/)
 *   cp .env.example .env.local       (fill real values; never commit .env.local)
 *
 * Run:
 *   npm run env:push-vercel
 *   npm run env:push-vercel -- --dry-run
 *
 * Location: scripts/push-env-to-vercel.mjs
 */

import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const localPath = path.join(root, '.env.local');
const PROD_URL = process.env.VERCEL_PRODUCTION_URL || 'https://hoteletuna.com';
const DRY_RUN = process.argv.includes('--dry-run');

const ENV_TARGETS = ['production', 'preview'];

/** Applied when target === production (and some NEXT_PUBLIC_* on preview). */
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

/**
 * Optional keys with safe defaults if missing from .env.local (non-secret).
 * Secrets (ADUMO_JWT_SECRET, etc.) must still come from .env.local.
 */
const DEFAULTS_IF_MISSING = {
  RESTAURANT_DEPOSIT_BASE_CENTS: '5000',
  RESTAURANT_DEPOSIT_PER_GUEST_CENTS: '2500',
  ADUMO_CURRENCY_CODE: 'NAD',
  RAG_ENABLED: 'true',
};

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
for (const [key, defaultVal] of Object.entries(DEFAULTS_IF_MISSING)) {
  if (!local[key] || !String(local[key]).trim()) {
    local[key] = defaultVal;
  }
}

const entries = Object.entries(local).filter(([k, v]) => isUsable(k, v));

console.log(
  DRY_RUN
    ? `[dry-run] Would push ${entries.length} variables to Vercel (${ENV_TARGETS.join(', ')})…`
    : `Pushing ${entries.length} variables to Vercel (${ENV_TARGETS.join(', ')})…`
);
console.log(`Production URL overrides use: ${PROD_URL}`);
console.log(
  'Namibia rails: ADUMO_* required for card; RESTAURANT_DEPOSIT_* for Sofia dining; MEM0_API_KEY optional.\n'
);

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

    if (DRY_RUN) {
      const action = remote.has(key) ? 'update' : 'add';
      process.stdout.write(`  [dry-run] ${action} ${key}\n`);
      ok += 1;
      continue;
    }

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
if (!DRY_RUN) {
  console.log('\nRedeploy production for env changes: vercel --prod  (or push to main if CI deploys).');
}
