/**
 * Smoke test: public pages, registration, email verification, NextAuth session, and authenticated API.
 *
 * Usage (dev server must be running):
 *   npx tsx scripts/smoke-user-journeys.ts [BASE_URL]
 *   SMOKE_BASE_URL=http://127.0.0.1:3010 npx tsx scripts/smoke-user-journeys.ts
 *
 * Loads DATABASE_URL from .env.local / .env (same pattern as verify-db) to read OTP for verification.
 */

import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function loadEnvFiles(): void {
  const root = resolve(process.cwd());
  for (const file of ['.env.local', '.env']) {
    const p = resolve(root, file);
    if (!existsSync(p)) continue;
    for (const line of readFileSync(p, 'utf8').split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq <= 0) continue;
      const key = trimmed.slice(0, eq).trim();
      const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
      if (!(key in process.env)) process.env[key] = value;
    }
  }
}

class CookieJar {
  private readonly cookies = new Map<string, string>();

  addFrom(response: Response): void {
    const headers = response.headers as unknown as { getSetCookie?: () => string[] };
    const list = typeof headers.getSetCookie === 'function' ? headers.getSetCookie() : [];
    if (list.length > 0) {
      for (const line of list) {
        const pair = line.split(';')[0];
        const i = pair.indexOf('=');
        if (i > 0) this.cookies.set(pair.slice(0, i).trim(), pair.slice(i + 1).trim());
      }
      return;
    }
    const single = response.headers.get('set-cookie');
    if (!single) return;
    for (const part of single.split(/,(?=[^;]+?=)/)) {
      const pair = part.trim().split(';')[0];
      const i = pair.indexOf('=');
      if (i > 0) this.cookies.set(pair.slice(0, i).trim(), pair.slice(i + 1).trim());
    }
  }

  header(): string {
    return [...this.cookies.entries()].map(([k, v]) => `${k}=${v}`).join('; ');
  }
}

async function fetchWithJar(
  base: string,
  jar: CookieJar,
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const url = path.startsWith('http') ? path : `${base.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`;
  const headers = new Headers(init.headers);
  const c = jar.header();
  if (c) headers.set('Cookie', c);
  const res = await fetch(url, { ...init, headers });
  jar.addFrom(res);
  return res;
}

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

async function main(): Promise<void> {
  loadEnvFiles();
  const base = (process.argv[2] || process.env.SMOKE_BASE_URL || 'http://127.0.0.1:3010').replace(/\/$/, '');
  const jar = new CookieJar();

  console.log(`Smoke user journeys → ${base}\n`);

  const pages = ['/', '/register', '/login', '/verify-email?email=smoke%40example.com'];
  for (const p of pages) {
    const r = await fetchWithJar(base, jar, p, { redirect: 'manual' });
    assert(r.status === 200 || r.status === 307, `${p} expected 200 or redirect, got ${r.status}`);
    console.log(`PASS  GET ${p} → ${r.status}`);
  }

  const home = await fetchWithJar(base, jar, '/', {});
  const homeText = await home.text();
  assert(
    homeText.includes('href="/register"') || homeText.includes("href='/register'"),
    'Landing HTML should link to /register',
  );
  console.log('PASS  Landing contains /register link');

  const email = `smoke-journey-${Date.now()}@example.com`;
  const password = 'SmokeJourney1!Pass';
  const name = 'Smoke Journey';

  const reg = await fetchWithJar(base, jar, '/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });
  const regJson = (await reg.json()) as { message?: string; requiresVerification?: boolean };
  assert(reg.status === 201, `Register expected 201, got ${reg.status}: ${JSON.stringify(regJson)}`);
  assert(regJson.requiresVerification === true, 'Register should require verification');
  console.log('PASS  POST /api/auth/register → 201');

  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL not set (needed to read OTP). Copy from .env.local.');
  }
  const { db, users } = await import('../lib/db');
  const { eq } = await import('drizzle-orm');
  const [row] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  assert(row?.emailVerificationOtp, 'OTP should exist on user row');
  const otp = row.emailVerificationOtp!;
  console.log('PASS  OTP loaded from database');

  const verify = await fetchWithJar(base, jar, '/api/auth/verify-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otp }),
  });
  const verifyJson = (await verify.json()) as { verified?: boolean };
  assert(verify.ok && verifyJson.verified === true, `Verify failed: ${verify.status} ${JSON.stringify(verifyJson)}`);
  console.log('PASS  POST /api/auth/verify-email → verified');

  const csrfRes = await fetchWithJar(base, jar, '/api/auth/csrf', { method: 'GET' });
  const csrfJson = (await csrfRes.json()) as { csrfToken?: string };
  assert(csrfJson.csrfToken, 'CSRF token missing');
  const csrfToken = csrfJson.csrfToken;

  const signIn = await fetchWithJar(base, jar, '/api/auth/callback/credentials', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: new URLSearchParams({
      csrfToken,
      email,
      password,
      redirect: 'false',
      callbackUrl: `${base}/properties`,
      json: 'true',
    }).toString(),
    redirect: 'manual',
  });
  const signJson = (await signIn.json()) as { error?: string; url?: string };
  assert(!signJson.error, `Sign-in error: ${signJson.error}`);
  console.log('PASS  POST /api/auth/callback/credentials → session');

  const session = await fetchWithJar(base, jar, '/api/auth/session', { method: 'GET' });
  const sessionJson = (await session.json()) as { user?: { email?: string } };
  assert(sessionJson.user?.email === email, `Session should include user email, got ${JSON.stringify(sessionJson)}`);
  console.log('PASS  GET /api/auth/session → authenticated');

  const props = await fetchWithJar(base, jar, '/api/v1/properties', { method: 'GET' });
  assert(props.ok, `GET /api/v1/properties expected OK, got ${props.status}`);
  const propsJson = (await props.json()) as { data?: unknown };
  assert(Array.isArray(propsJson.data), 'Properties response should have data array');
  console.log('PASS  GET /api/v1/properties → list (authenticated)');

  const dashPaths = ['/properties', '/dashboard', '/settings'];
  for (const p of dashPaths) {
    const r = await fetchWithJar(base, jar, p, { redirect: 'manual' });
    assert(
      r.status === 200 || r.status === 302 || r.status === 307,
      `${p} unexpected status ${r.status}`,
    );
    console.log(`PASS  GET ${p} → ${r.status}`);
  }

  console.log('\nAll smoke journey checks passed.');
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
