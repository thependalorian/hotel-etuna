#!/usr/bin/env node
/**
 * Append missing keys to .env.local from .env.example and .env.vercel.
 * Never overwrites a non-empty, non-placeholder value.
 * Run: node scripts/sync-env-local.mjs
 */

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const localPath = path.join(root, '.env.local');
const examplePath = path.join(root, '.env.example');
const vercelPath = path.join(root, '.env.vercel');

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const out = {};
  for (const line of fs.readFileSync(filePath, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const m = t.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (m) out[m[1]] = m[2];
  }
  return out;
}

const PLACEHOLDER =
  /^(your-|change-me|sk_test_|pk_test_|whsec_|xxx|placeholder|todo|etuna-tenant-uuid|etuna-property-uuid)/i;

function isUsable(val) {
  if (val == null) return false;
  const v = String(val).replace(/^["']|["']$/g, '').trim();
  if (!v) return false;
  if (PLACEHOLDER.test(v)) return false;
  if (v.includes('username:password@ep-example')) return false;
  return true;
}

if (!fs.existsSync(localPath)) {
  fs.copyFileSync(examplePath, localPath);
  console.log('Created .env.local from .env.example');
}

let content = fs.readFileSync(localPath, 'utf8');
const local = parseEnvFile(localPath);
const example = parseEnvFile(examplePath);
const vercel = parseEnvFile(vercelPath);

const additions = [];

function setKey(key, value, comment) {
  if (isUsable(local[key])) return;
  const v = isUsable(value) ? value : null;
  if (!v) return;
  additions.push({ key, value: v, comment });
  local[key] = v;
}

// Aliases from existing local keys
if (!isUsable(local.EMAIL_SMTP_USER)) {
  const user =
    local.NAMECHEAP_EMAIL || local.EMAIL_USERNAME || local.EMAIL_ADDRESS;
  if (user) setKey('EMAIL_SMTP_USER', user, 'alias from NAMECHEAP_EMAIL / EMAIL_USERNAME');
}
if (!isUsable(local.EMAIL_SMTP_PASS)) {
  const pass = local.NAMECHEAP_EMAIL_PASSWORD || local.EMAIL_PASSWORD;
  if (pass) setKey('EMAIL_SMTP_PASS', pass, 'alias from NAMECHEAP_EMAIL_PASSWORD');
}
if (!isUsable(local.EMAIL_SMTP_HOST)) {
  const host = local.NAMECHEAP_SMTP_HOST || local.EMAIL_SMTP_HOST;
  if (host) setKey('EMAIL_SMTP_HOST', host, 'alias from NAMECHEAP_SMTP_HOST');
}
if (!isUsable(local.EMAIL_SMTP_PORT)) {
  const port = local.NAMECHEAP_SMTP_PORT || local.EMAIL_SMTP_PORT;
  if (port) setKey('EMAIL_SMTP_PORT', port, 'alias from NAMECHEAP_SMTP_PORT');
}
if (!isUsable(local.NEXT_PUBLIC_POSTHOG_KEY) && local.POSTHOG_PROJECT_API_KEY) {
  setKey('NEXT_PUBLIC_POSTHOG_KEY', local.POSTHOG_PROJECT_API_KEY, 'alias from POSTHOG_PROJECT_API_KEY');
}
if (!isUsable(local.NEXT_PUBLIC_POSTHOG_HOST) && local.POSTHOG_HOST) {
  setKey('NEXT_PUBLIC_POSTHOG_HOST', local.POSTHOG_HOST, 'alias from POSTHOG_HOST');
}

const siteUrl =
  local.NEXTAUTH_URL?.replace(/^["']|["']$/g, '') || 'http://localhost:3000';
setKey('NEXT_PUBLIC_APP_URL', siteUrl, 'from NEXTAUTH_URL');
setKey('NEXT_PUBLIC_SITE_URL', siteUrl, 'guest email links');

if (!isUsable(local.CRON_SECRET)) {
  setKey('CRON_SECRET', crypto.randomBytes(32).toString('hex'), 'generated for local cron routes');
}

if (!isUsable(local.ENCRYPTION_KEY)) {
  setKey('ENCRYPTION_KEY', crypto.randomBytes(32).toString('hex'), 'generated AES-256 key (local only)');
}

if (!isUsable(local.NAMQR_SIGNING_SECRET) && isUsable(local.NEXTAUTH_SECRET)) {
  setKey('NAMQR_SIGNING_SECRET', local.NEXTAUTH_SECRET, 'falls back to NEXTAUTH_SECRET in code');
}

// Merge from example / vercel (example staging Adumo, tax, feature flags)
const mergeOrder = [example, vercel];
for (const source of mergeOrder) {
  for (const [key, value] of Object.entries(source)) {
    if (!isUsable(local[key])) {
      setKey(key, value, `from ${source === example ? '.env.example' : '.env.vercel'}`);
    }
  }
}

if (!additions.length) {
  console.log('✅ .env.local already has all mergeable keys (no changes).');
  process.exit(0);
}

const block = [
  '',
  '# ============================================================================',
  `# Appended by scripts/sync-env-local.mjs — ${new Date().toISOString().slice(0, 10)}`,
  '# ============================================================================',
  ...additions.flatMap(({ key, value, comment }) => [
    comment ? `# ${comment}` : '',
    `${key}=${value}`,
  ]),
  '',
].join('\n');

fs.writeFileSync(localPath, content.trimEnd() + block);
console.log(`✅ Added ${additions.length} keys to .env.local:`);
for (const { key, comment } of additions) {
  console.log(`   + ${key}${comment ? ` (${comment})` : ''}`);
}
console.log('\nRun: npm run env:check');
