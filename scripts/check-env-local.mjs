#!/usr/bin/env node
/**
 * Audit .env.local against .env.example tiers (never prints secret values).
 * Run: node scripts/check-env-local.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return { keys: new Set(), values: {} };
  const values = {};
  const keys = new Set();
  for (const line of fs.readFileSync(filePath, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const m = t.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (m) {
      keys.add(m[1]);
      values[m[1]] = m[2];
    }
  }
  return { keys, values };
}

const PLACEHOLDER =
  /^(your-|change-me|sk_test_|pk_test_|whsec_|xxx|placeholder|todo|etuna-tenant-uuid|etuna-property-uuid)/i;

function isSet(key, { keys, values }) {
  if (!keys.has(key)) return false;
  const raw = values[key] ?? '';
  const val = raw.replace(/^["']|["']$/g, '').trim();
  if (!val) return false;
  if (PLACEHOLDER.test(val)) return false;
  if (val.includes('username:password@ep-example')) return false;
  return true;
}

const localPath = path.join(root, '.env.local');
const examplePath = path.join(root, '.env.example');
const local = parseEnvFile(localPath);
const example = parseEnvFile(examplePath);

const tier1 = [
  'DATABASE_URL',
  'NEXTAUTH_URL',
  'NEXTAUTH_SECRET',
  'HUB_TENANT_ID',
  'DEFAULT_PROPERTY_ID',
  'NEXT_PUBLIC_APP_URL',
  'NEXT_PUBLIC_STACK_PROJECT_ID',
  'NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY',
  'STACK_SECRET_SERVER_KEY',
];

const groups = {
  email_smtp: [
    'EMAIL_SMTP_USER',
    'EMAIL_SMTP_PASS',
    'SMTP_USER',
    'SMTP_PASS',
    'NAMECHEAP_EMAIL',
    'EMAIL_USERNAME',
  ],
  email_sender: ['EMAIL_SENDER_EMAIL', 'EMAIL_SENDER_NAME'],
  adumo_virtual: ['ADUMO_MERCHANT_UID', 'ADUMO_APPLICATION_UID', 'ADUMO_JWT_SECRET'],
  restaurant_deposit: ['RESTAURANT_DEPOSIT_BASE_CENTS', 'RESTAURANT_DEPOSIT_PER_GUEST_CENTS'],
  ai_chat: ['DEEPSEEK_API_KEY', 'OPENAI_API_KEY', 'ANTHROPIC_API_KEY', 'GROQ_API_KEY', 'LLM_API_KEY'],
  cron_jobs: ['CRON_SECRET'],
  sofia_rag: ['QDRANT_URL', 'QDRANT_API_KEY', 'RAG_USE_QDRANT_INFERENCE'],
};

const recommended = [
  'CRON_SECRET',
  'NEXT_PUBLIC_SITE_URL',
  'ADUMO_WEBHOOK_HMAC_SECRET',
  'ADUMO_BASE_URL',
  'ADUMO_WEBHOOK_URL',
  'NAMQR_SIGNING_SECRET',
  'ENCRYPTION_KEY',
  'RAG_ENABLED',
  'EMAIL_SENDER_NAME',
  'HOTEL_ETUNA_VAT_NUMBER',
  'HOTEL_ETUNA_LEGAL_NAME',
];

function groupOk(name, keys) {
  return keys.some((k) => isSet(k, local));
}

let exitCode = 0;

console.log('=== Hotel Etuna — .env.local audit ===\n');
if (!fs.existsSync(localPath)) {
  console.error('❌ .env.local not found. Copy .env.example → .env.local first.');
  process.exit(1);
}

console.log(`Keys in .env.local: ${local.keys.size}`);
console.log(`Keys in .env.example: ${example.keys.size}\n`);

const miss1 = tier1.filter((k) => !isSet(k, local));
console.log('--- Tier 1 (core local dev) ---');
if (miss1.length) {
  console.log('❌ Missing or placeholder:', miss1.join(', '));
  exitCode = 1;
} else {
  console.log('✅ OK');
}

console.log('\n--- Feature groups ---');
for (const [name, keys] of Object.entries(groups)) {
  const ok = groupOk(name, keys);
  console.log(`${ok ? '✅' : '❌'} ${name}`);
  if (!ok) exitCode = 1;
}

console.log('\n--- Recommended (production parity) ---');
for (const k of recommended) {
  const status = isSet(k, local) ? '✅' : local.keys.has(k) ? '⚠️ empty' : '❌ missing';
  console.log(`  ${status.padEnd(12)} ${k}`);
  if (!isSet(k, local) && ['CRON_SECRET', 'ENCRYPTION_KEY', 'ADUMO_MERCHANT_UID'].includes(k)) {
    exitCode = 1;
  }
}

const inExampleNotLocal = [...example.keys].filter((k) => !local.keys.has(k));
console.log(`\n--- Keys in .env.example but not in .env.local: ${inExampleNotLocal.length} ---`);
console.log('Run: npm run env:sync — to append missing keys (without overwriting set values)\n');

console.log('--- Brand / guest email surfaces ---');
const sender = (local.values.EMAIL_SENDER_EMAIL ?? '').replace(/^["']|["']$/g, '').trim().toLowerCase();
const smtpUser = [
  local.values.EMAIL_SMTP_USER,
  local.values.NAMECHEAP_EMAIL,
  local.values.EMAIL_USERNAME,
  local.values.EMAIL_ADDRESS,
]
  .map((v) => (v ?? '').replace(/^["']|["']$/g, '').trim().toLowerCase())
  .find(Boolean);
if (sender.endsWith('@buffr.ai') || smtpUser?.endsWith('@buffr.ai')) {
  console.log('❌ Guest email must use @hoteletuna.com (not @buffr.ai). Set EMAIL_SENDER_EMAIL=frontdesk@hoteletuna.com');
  exitCode = 1;
} else {
  console.log('✅ Sender/SMTP not using @buffr.ai');
}

process.exit(exitCode);
