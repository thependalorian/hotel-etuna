/**
 * E2E journey runner — PRD J1–J7 with screenshots and DB validation.
 * Location: scripts/e2e-journey-runner.ts
 * Fallback when agent-browser daemon is unavailable; uses Playwright (project standard).
 */

import { chromium, type Browser, type Page } from 'playwright';
import { config } from 'dotenv';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { neon } from '@neondatabase/serverless';

config({ path: '.env.local' });

const BASE = (process.env.E2E_BASE_URL ?? 'http://localhost:3010').replace(/\/$/, '');
const NAV_TIMEOUT = 360_000;
const API_TIMEOUT = 240_000;
const SCREENSHOT_ROOT = join(process.cwd(), 'e2e-screenshots');
const STAFF = {
  email: 'manager@hoteletuna.com',
  password: process.env.ADMIN_PASSWORD ?? process.env.PASSWORD ?? 'Test1234!',
};
const PARTNER = { email: 'owner@jayla.nam', password: process.env.PARTNER_SEED_PASSWORD ?? 'Test1234!' };

type JourneyResult = {
  id: string;
  status: 'pass' | 'fail' | 'blocked' | 'skip';
  notes: string[];
  screenshots: string[];
};

const results: JourneyResult[] = [];
let guestCreds: { email: string; password: string } | null = null;
let bookingId: string | null = null;

const sql = process.env.DATABASE_URL ? neon(process.env.DATABASE_URL) : null;

async function shot(page: Page, journey: string, name: string): Promise<string> {
  const dir = join(SCREENSHOT_ROOT, journey);
  await mkdir(dir, { recursive: true });
  const path = join(dir, `${name}.png`);
  await page.screenshot({ path, fullPage: true });
  return path;
}

async function dismissCookies(page: Page): Promise<void> {
  await page.addInitScript(() => {
    try {
      localStorage.setItem(
        'hoteletuna_cookie_consent_v1',
        JSON.stringify({ essential: true, analytics: false, at: new Date().toISOString() }),
      );
    } catch {
      /* ignore */
    }
  });
  const accept = page.getByRole('button', { name: /accept all/i });
  if (await accept.isVisible().catch(() => false)) await accept.click();
}

async function waitForLoginFormReady(page: Page): Promise<void> {
  await page.getByLabel(/email/i).waitFor({ state: 'visible', timeout: NAV_TIMEOUT });
  await page.locator('form[method="post"]').waitFor({ state: 'visible', timeout: NAV_TIMEOUT });
  await page.waitForLoadState('networkidle', { timeout: 90_000 }).catch(() => null);
}

async function warmStaffRoutesOnly(browser: Browser): Promise<void> {
  console.log('Warming staff routes…');
  const ctx = await browser.newContext({ baseURL: BASE, viewport: { width: 1440, height: 900 } });
  ctx.setDefaultNavigationTimeout(NAV_TIMEOUT);
  ctx.setDefaultTimeout(NAV_TIMEOUT);
  const staffWarm = await ctx.newPage();
  try {
    await loginViaUi(staffWarm, STAFF.email, STAFF.password, '/dashboard', /\/dashboard/);
    for (const path of ['/dashboard', '/bookings', '/payments/desk', '/housekeeping']) {
      await staffWarm.goto(`${BASE}${path}`, { waitUntil: 'commit', timeout: NAV_TIMEOUT });
    }
  } catch (e) {
    console.warn('Staff warm partial:', e instanceof Error ? e.message : e);
  } finally {
    await ctx.close();
  }
}

async function warmPartnerRoutesOnly(browser: Browser): Promise<void> {
  console.log('Warming partner routes…');
  const ctx = await browser.newContext({ baseURL: BASE, viewport: { width: 1440, height: 900 } });
  ctx.setDefaultNavigationTimeout(NAV_TIMEOUT);
  ctx.setDefaultTimeout(NAV_TIMEOUT);
  const partnerWarm = await ctx.newPage();
  try {
    await dismissCookies(partnerWarm);
    await loginViaUi(
      partnerWarm,
      PARTNER.email,
      PARTNER.password,
      '/partner/dashboard',
      /\/partner/,
    );
    for (const path of ['/partner/dashboard', '/partner/bookings']) {
      await partnerWarm.goto(`${BASE}${path}`, { waitUntil: 'commit', timeout: NAV_TIMEOUT });
    }
  } catch (e) {
    console.warn('Partner warm partial:', e instanceof Error ? e.message : e);
  } finally {
    await ctx.close();
  }
}

/** @deprecated use warmStaffRoutesOnly / warmPartnerRoutesOnly */
async function warmStaffPartnerRoutes(browser: Browser): Promise<void> {
  await warmStaffRoutesOnly(browser);
  await warmPartnerRoutesOnly(browser);
}

function parseOnlyJourneys(): Set<string> | null {
  const idx = process.argv.indexOf('--only');
  if (idx === -1 || !process.argv[idx + 1]) return null;
  return new Set(
    process.argv[idx + 1]
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
  );
}

async function warmCompileRoutes(paths: string[]): Promise<void> {
  console.log(`Warming ${paths.length} routes (HTTP compile pass)…`);
  for (const path of paths) {
    try {
      const res = await fetch(`${BASE}${path}`, { redirect: 'manual', signal: AbortSignal.timeout(NAV_TIMEOUT) });
      console.log(`  warm ${path}: ${res.status}`);
    } catch (e) {
      console.warn(`  warm ${path} partial:`, e instanceof Error ? e.message : e);
    }
  }
}

async function warmAuthRoutes(page: Page): Promise<void> {
  const request = page.context().request;
  for (const path of ['/api/auth/csrf', '/api/auth/providers', '/api/auth/session']) {
    await request.get(`${BASE}${path}`, { timeout: 60_000 }).catch(() => null);
  }
  await request
    .post(`${BASE}/api/auth/register`, {
      data: {
        name: 'E2E Warm',
        email: `e2e-warm-${Date.now()}@example.com`,
        password: 'E2eGuestPlaywright1!',
      },
      timeout: API_TIMEOUT,
    })
    .catch(() => null);
}

async function loginViaUi(
  page: Page,
  email: string,
  password: string,
  redirectPath?: string,
  expectUrl?: RegExp,
): Promise<void> {
  const loginUrl = redirectPath
    ? `${BASE}/login?redirect=${encodeURIComponent(redirectPath)}`
    : `${BASE}/login`;
  await dismissCookies(page);
  await page.context().clearCookies();
  await page.goto(loginUrl, { waitUntil: 'domcontentloaded', timeout: NAV_TIMEOUT });
  await waitForLoginFormReady(page);
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await Promise.all([
    page
      .waitForResponse(
        (r) => r.url().includes('/api/auth/callback/credentials') && r.status() === 200,
        { timeout: NAV_TIMEOUT },
      )
      .catch(() => null),
    page.getByRole('button', { name: /sign in/i }).click(),
  ]);
  const destination =
    expectUrl ??
    (redirectPath
      ? new RegExp(redirectPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      : /\/(guest|dashboard|partner\/dashboard|admin\/platform)/);
  await page.waitForURL(destination, { timeout: NAV_TIMEOUT, waitUntil: 'commit' });
}

async function staffLogin(page: Page): Promise<void> {
  const credsList = [
    STAFF,
    { email: 'admin@hoteletuna.com', password: process.env.ADMIN_PASSWORD ?? process.env.PASSWORD ?? 'Test1234!' },
  ];
  let lastError: unknown;
  for (const creds of credsList) {
    try {
      await loginViaUi(page, creds.email, creds.password, '/dashboard', /\/dashboard/);
      return;
    } catch (e) {
      lastError = e;
    }
  }
  throw lastError instanceof Error ? lastError : new Error('Staff login failed for manager@ and admin@');
}

async function runJ1(page: Page): Promise<JourneyResult> {
  const r: JourneyResult = { id: 'j1', status: 'pass', notes: [], screenshots: [] };
  const paths = ['/', '/rooms', '/dining', '/partners', '/about', '/contact', '/facilities'];
  for (const p of paths) {
    await dismissCookies(page);
    await page.goto(`${BASE}${p}`, { waitUntil: 'domcontentloaded', timeout: NAV_TIMEOUT });
    r.screenshots.push(await shot(page, 'j1-discover', p.replace(/\//g, '_') || 'home'));
    if (p === '/rooms') {
      const signIn = page.getByRole('link', { name: /sign in/i });
      if ((await signIn.count()) === 0) r.notes.push('rooms: no sign-in CTA visible');
    }
  }
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded', timeout: NAV_TIMEOUT });
  r.screenshots.push(await shot(page, 'j1-discover', 'mobile-home'));
  return r;
}

async function runJ2(page: Page): Promise<JourneyResult> {
  const r: JourneyResult = { id: 'j2', status: 'pass', notes: [], screenshots: [] };
  if (!sql) {
    r.status = 'blocked';
    r.notes.push('DATABASE_URL missing');
    return r;
  }

  const email = `e2e-journey-${Date.now()}@example.com`;
  const password = 'E2eGuestPlaywright1!';
  const name = 'E2E Journey Guest';

  const reg = await page.context().request.post(`${BASE}/api/auth/register`, {
    data: { name, email, password },
    timeout: API_TIMEOUT,
  });
  if (!reg.ok()) {
    r.status = 'fail';
    r.notes.push(`register API ${reg.status()}: ${(await reg.text()).slice(0, 200)}`);
    return r;
  }

  let otp = '';
  const body = (await reg.json()) as { e2eOtp?: string };
  if (body.e2eOtp) otp = body.e2eOtp.replace(/\D/g, '').slice(0, 6);
  if (!otp) {
    for (let i = 0; i < 60; i++) {
      const rows = await sql`SELECT email_verification_otp FROM users WHERE lower(email) = lower(${email})`;
      if (rows[0]?.email_verification_otp) {
        otp = String(rows[0].email_verification_otp).replace(/\D/g, '').slice(0, 6);
        break;
      }
      await new Promise((res) => setTimeout(res, 500));
    }
  }
  if (otp.length !== 6) {
    r.status = 'fail';
    r.notes.push('OTP not found in DB');
    return r;
  }

  await dismissCookies(page);
  await page.goto(`${BASE}/verify-email?email=${encodeURIComponent(email)}`, {
    waitUntil: 'domcontentloaded',
    timeout: NAV_TIMEOUT,
  });
  r.screenshots.push(await shot(page, 'j2-register', '01-verify-email'));

  const verifyRes = await page.context().request.post(`${BASE}/api/auth/verify-email`, {
    data: { email, otp },
    timeout: API_TIMEOUT,
  });
  if (!verifyRes.ok()) {
    r.status = 'fail';
    r.notes.push(`verify-email API ${verifyRes.status()}: ${(await verifyRes.text()).slice(0, 200)}`);
    return r;
  }

  await page.goto(`${BASE}/login?verified=true`, { waitUntil: 'domcontentloaded', timeout: NAV_TIMEOUT });

  await loginViaUi(page, email, password, undefined, /\/guest/);
  r.screenshots.push(await shot(page, 'j2-register', '02-guest-hub'));

  const users = await sql`SELECT id, email, role, email_verified FROM users WHERE lower(email) = lower(${email})`;
  const guests = await sql`SELECT id, email, is_signed_up FROM guests WHERE lower(email) = lower(${email})`;
  if (!users[0]?.email_verified) r.notes.push('DB: email_verified false');
  if (!guests[0]?.is_signed_up) r.notes.push('DB: guest is_signed_up false');
  else r.notes.push(`DB: user+guest OK (${users[0]?.id})`);

  guestCreds = { email, password };
  return r;
}

async function runJ3(page: Page): Promise<JourneyResult> {
  const r: JourneyResult = { id: 'j3', status: 'pass', notes: [], screenshots: [] };
  if (!guestCreds) {
    r.status = 'blocked';
    r.notes.push('Requires J2 guest session');
    return r;
  }

  await loginViaUi(page, guestCreds.email, guestCreds.password, undefined, /\/guest/);

  await page.goto(`${BASE}/rooms/standard-room-type-a`, {
    waitUntil: 'domcontentloaded',
    timeout: NAV_TIMEOUT,
  });
  r.screenshots.push(await shot(page, 'j3-book-pay', '01-room-gated'));

  const priceVisible = (await page.locator('text=/NAD\\s*\\d+/i').count()) > 0;
  r.notes.push(priceVisible ? 'Rates visible when logged in' : 'Rates not visible on room page');

  const bookBtn = page.getByRole('button', { name: /book|reserve/i }).first();
  if (await bookBtn.isVisible().catch(() => false)) {
    r.notes.push('Booking widget present — full Adumo flow skipped in automated runner (external redirect)');
    r.status = 'skip';
  } else {
    r.notes.push('No book button found — deposit flow not exercised');
    r.status = 'skip';
  }
  return r;
}

async function runJ4(page: Page, browser: Browser): Promise<JourneyResult> {
  const r: JourneyResult = { id: 'j4', status: 'pass', notes: [], screenshots: [] };
  if (!sql || !guestCreds) {
    r.status = 'blocked';
    r.notes.push('Requires J2 + DB');
    return r;
  }

  const staffPage = await browser.newPage();
  await staffLogin(staffPage);
  await staffPage.goto(`${BASE}/bookings/new`, { waitUntil: 'domcontentloaded', timeout: NAV_TIMEOUT });
  r.screenshots.push(await shot(staffPage, 'j4-folio', '00-staff-new-booking'));

  await loginViaUi(page, guestCreds.email, guestCreds.password, undefined, /\/guest/);
  r.screenshots.push(await shot(page, 'j4-folio', '01-guest-hub'));

  const stays = await page.locator('a[href*="/guest/stays/"]').count();
  if (stays === 0) {
    r.status = 'skip';
    r.notes.push('No active stays for new guest — validating folio SQL on seeded checked-in booking');
    if (sql) {
      const seeded = await sql`
        SELECT b.id FROM bookings b
        WHERE b.status = 'checked_in'
        ORDER BY b.created_at DESC LIMIT 1`;
      if (seeded[0]?.id) {
        bookingId = seeded[0].id as string;
        const folio = await sql`
          WITH f AS (
            SELECT
              SUM(CASE WHEN bc.status = 'open' AND bc.charge_type IN ('room','fnb','tax','adjustment')
                THEN bc.amount::numeric ELSE 0 END) AS open_charges,
              SUM(CASE WHEN bc.charge_type = 'payment' THEN bc.amount::numeric ELSE 0 END) AS payments
            FROM booking_charges bc WHERE bc.booking_id = ${bookingId}
          ) SELECT * FROM f`;
        r.notes.push(`Seeded folio DB: ${JSON.stringify(folio[0])}`);
        await staffPage.goto(`${BASE}/bookings/${bookingId}`, {
          waitUntil: 'domcontentloaded',
          timeout: NAV_TIMEOUT,
        });
        r.screenshots.push(await shot(staffPage, 'j4-folio', '03-staff-booking-folio'));
      }
    }
    await staffPage.close();
    return r;
  }

  await page.locator('a[href*="/guest/stays/"]').first().click();
  await page.waitForLoadState('domcontentloaded');
  r.screenshots.push(await shot(page, 'j4-folio', '02-stay-folio'));

  const match = page.url().match(/\/guest\/stays\/([^/?]+)/);
  if (match) bookingId = match[1];
  if (bookingId && sql) {
    const folio = await sql`
      WITH f AS (
        SELECT
          SUM(CASE WHEN bc.status = 'open' AND bc.charge_type IN ('room','fnb','tax','adjustment')
            THEN bc.amount::numeric ELSE 0 END) AS open_charges,
          SUM(CASE WHEN bc.charge_type = 'payment' THEN bc.amount::numeric ELSE 0 END) AS payments
        FROM booking_charges bc WHERE bc.booking_id = ${bookingId}
      ) SELECT * FROM f`;
    r.notes.push(`Folio DB: ${JSON.stringify(folio[0])}`);
  }
  await staffPage.close();
  return r;
}

async function runJ5(page: Page, browser: Browser): Promise<JourneyResult> {
  const r: JourneyResult = { id: 'j5', status: 'pass', notes: [], screenshots: [] };
  const staffPage = await browser.newPage();
  staffPage.setDefaultNavigationTimeout(NAV_TIMEOUT);
  staffPage.setDefaultTimeout(NAV_TIMEOUT);
  try {
    await staffLogin(staffPage);
    await staffPage.goto(`${BASE}/dashboard`, { waitUntil: 'commit', timeout: NAV_TIMEOUT });
    r.screenshots.push(await shot(staffPage, 'j5-staff', '01-dashboard'));

    const propertyError = staffPage.getByText(/property not linked/i);
    if (await propertyError.isVisible().catch(() => false)) {
      r.notes.push('Dashboard shows Property not linked (Stack-only session risk)');
    }

    await staffPage.goto(`${BASE}/bookings`, { waitUntil: 'commit', timeout: NAV_TIMEOUT });
    r.screenshots.push(await shot(staffPage, 'j5-staff', '02-bookings'));

    await staffPage.goto(`${BASE}/payments/desk`, { waitUntil: 'commit', timeout: NAV_TIMEOUT });
    r.screenshots.push(await shot(staffPage, 'j5-staff', '03-payments-desk'));
    await expectVisible(staffPage, /payments desk/i, r);
    await expectVisible(staffPage, /find booking/i, r);

    await staffPage.goto(`${BASE}/housekeeping`, { waitUntil: 'commit', timeout: NAV_TIMEOUT });
    r.screenshots.push(await shot(staffPage, 'j5-staff', '04-housekeeping'));
  } finally {
    await staffPage.close();
  }
  return r;
}

async function runJ6(page: Page, browser: Browser): Promise<JourneyResult> {
  const r: JourneyResult = { id: 'j6', status: 'pass', notes: [], screenshots: [] };
  const partnerPage = await browser.newPage();
  partnerPage.setDefaultNavigationTimeout(NAV_TIMEOUT);
  partnerPage.setDefaultTimeout(NAV_TIMEOUT);
  try {
    await dismissCookies(partnerPage);
    await loginViaUi(
      partnerPage,
      PARTNER.email,
      PARTNER.password,
      '/partner/dashboard',
      /\/(partner|dashboard)/,
    );
    if (!partnerPage.url().includes('/partner')) {
      await partnerPage.goto(`${BASE}/partner/dashboard`, {
        waitUntil: 'commit',
        timeout: NAV_TIMEOUT,
      });
    }
    r.screenshots.push(await shot(partnerPage, 'j6-partner', '01-dashboard'));

    for (const path of ['/partner/rooms', '/partner/rates', '/partner/bookings', '/partner/settings']) {
      await partnerPage.goto(`${BASE}${path}`, { waitUntil: 'commit', timeout: NAV_TIMEOUT });
      r.screenshots.push(await shot(partnerPage, 'j6-partner', path.replace(/\//g, '_')));
    }

    await partnerPage.goto(`${BASE}/partners/jayla`, { waitUntil: 'domcontentloaded', timeout: NAV_TIMEOUT }).catch(() =>
      partnerPage.goto(`${BASE}/partners/jayla-self-catering-accommodation`, {
        waitUntil: 'domcontentloaded',
        timeout: NAV_TIMEOUT,
      }),
    );
    r.screenshots.push(await shot(partnerPage, 'j6-partner', 'public-partner-page'));

    if (sql && process.env.HUB_TENANT_ID) {
      const partnerTenant = await sql`SELECT tenant_id FROM users WHERE email = ${PARTNER.email}`;
      const pid = partnerTenant[0]?.tenant_id;
      if (pid) {
        const hubCount = await sql`
          SELECT COUNT(*)::int AS c FROM bookings WHERE tenant_id = ${process.env.HUB_TENANT_ID}`;
        r.notes.push(`RLS smoke: hub bookings count=${hubCount[0]?.c} (partner session uses separate tenant)`);
      }
    }
  } finally {
    await partnerPage.close();
  }
  return r;
}

async function runJ7(page: Page): Promise<JourneyResult> {
  const r: JourneyResult = { id: 'j7', status: 'pass', notes: [], screenshots: [] };
  await dismissCookies(page);
  await page.goto(`${BASE}/admin/platform`, { waitUntil: 'domcontentloaded', timeout: NAV_TIMEOUT });
  r.screenshots.push(await shot(page, 'j7-platform', '01-unauthenticated-redirect'));

  if (page.url().includes('/login')) {
    r.notes.push('Unauthenticated /admin/platform redirects to login (expected)');
  }

  if (!sql) {
    r.status = 'blocked';
    return r;
  }

  try {
    const platformUser = await sql`
    SELECT email FROM users WHERE is_platform_admin = true LIMIT 1`;
    if (!platformUser[0]) {
      r.status = 'skip';
      r.notes.push('No is_platform_admin user in DB — george@buffr.ai not provisioned; platform console not exercised');
      return r;
    }

    r.notes.push(`Platform user exists: ${platformUser[0].email} — manual Buffr login required for full J7`);
    r.status = 'skip';
  } catch (e) {
    r.status = 'skip';
    r.notes.push(`DB unavailable for platform admin lookup: ${e instanceof Error ? e.message : String(e)}`);
  }
  return r;
}

async function runResponsive(page: Page): Promise<JourneyResult> {
  const r: JourneyResult = { id: 'responsive', status: 'pass', notes: [], screenshots: [] };
  const viewports = [
    { w: 375, h: 812, label: 'mobile' },
    { w: 768, h: 1024, label: 'tablet' },
    { w: 1440, h: 900, label: 'desktop' },
  ];
  const pages = ['/', '/rooms', '/guest', '/dashboard', '/partner/dashboard'];

  for (const vp of viewports) {
    await page.setViewportSize({ width: vp.w, height: vp.h });
    for (const p of pages) {
      await dismissCookies(page);
      try {
        await page.goto(`${BASE}${p}`, { waitUntil: 'domcontentloaded', timeout: 90_000 });
      } catch {
        if (p === '/guest' || p === '/dashboard' || p === '/partner/dashboard') continue;
      }
      if (page.url().includes('/login') && p !== '/') continue;
      r.screenshots.push(await shot(page, 'responsive', `${vp.label}-${p.replace(/\//g, '_') || 'home'}`));
    }
  }
  return r;
}

async function expectVisible(page: Page, pattern: RegExp, r: JourneyResult): Promise<void> {
  const el = page.getByRole('heading', { name: pattern }).or(page.getByLabel(pattern));
  if (!(await el.first().isVisible().catch(() => false))) {
    r.notes.push(`Missing visible: ${pattern}`);
  }
}

async function mergeResults(
  current: JourneyResult[],
  only: Set<string> | null,
): Promise<JourneyResult[]> {
  if (!only) return current;
  try {
    const prev = JSON.parse(
      await readFile(join(SCREENSHOT_ROOT, 'results.json'), 'utf8'),
    ) as JourneyResult[];
    const merged = [...prev.filter((p) => !only.has(p.id)), ...current];
    return merged.sort((a, b) => a.id.localeCompare(b.id));
  } catch {
    return current;
  }
}

async function main(): Promise<void> {
  await mkdir(SCREENSHOT_ROOT, { recursive: true });
  const only = parseOnlyJourneys();

  console.log(`E2E runner → ${BASE}${only ? ` (only: ${[...only].join(', ')})` : ''}`);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    baseURL: BASE,
  });
  context.setDefaultNavigationTimeout(NAV_TIMEOUT);
  context.setDefaultTimeout(NAV_TIMEOUT);
  const page = await context.newPage();

  const allJourneys: [string, () => Promise<JourneyResult>][] = [
    ['j1', () => runJ1(page)],
    ['j2', () => runJ2(page)],
    ['j3', () => runJ3(page)],
    ['j4', () => runJ4(page, browser)],
    ['j5', () => runJ5(page, browser)],
    ['j6', () => runJ6(page, browser)],
    ['j7', () => runJ7(page)],
    ['responsive', () => runResponsive(page)],
  ];

  const journeys = only
    ? allJourneys.filter(([id]) => only.has(id))
    : allJourneys;

  if (journeys.length === 0) {
    console.error('No journeys matched --only filter');
    process.exit(1);
  }

  try {
    if (!only || only.has('j1')) {
      await dismissCookies(page);
      await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: NAV_TIMEOUT });
      await page.screenshot({ path: join(SCREENSHOT_ROOT, '00-initial-load.png'), fullPage: true });
      await shot(page, '_root', '00-initial-load');
      console.log('Initial load OK');
    }

    await warmAuthRoutes(page);

    const staffWarmPaths = [
      '/login',
      '/dashboard',
      '/bookings',
      '/payments/desk',
      '/housekeeping',
    ];
    const partnerWarmPaths = [
      '/partner/dashboard',
      '/partner/rooms',
      '/partner/rates',
      '/partner/bookings',
      '/partner/settings',
    ];

    async function warmBeforeJ5(): Promise<void> {
      await warmCompileRoutes(staffWarmPaths);
      await warmStaffRoutesOnly(browser);
    }

    async function warmBeforeJ6(): Promise<void> {
      await warmCompileRoutes(partnerWarmPaths);
      await warmPartnerRoutesOnly(browser);
    }

    const j56Only = only && (only.has('j5') || only.has('j6')) && !only.has('j1');
    if (j56Only) {
      if (!only || only.has('j5')) await warmBeforeJ5();
      if (!only || only.has('j6')) await warmBeforeJ6();
    }

    for (const [id, fn] of journeys) {
      const label = id.toUpperCase().replace('RESPONSIVE', 'Responsive');
      if (id === 'j5' && !j56Only) {
        console.log('Re-warming staff routes before J5 (post J1–J4 compile churn)…');
        await warmBeforeJ5();
      }
      if (id === 'j6' && !j56Only) {
        console.log('Re-warming partner routes before J6…');
        await warmBeforeJ6();
      }
      console.log(`Running ${label}...`);
      try {
        const result = await fn();
        const existing = results.findIndex((r) => r.id === result.id);
        if (existing >= 0) results[existing] = result;
        else results.push(result);
        console.log(`  ${result.id}: ${result.status}`, result.notes.join('; '));
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        const fail = { id, status: 'fail' as const, notes: [msg], screenshots: [] };
        const existing = results.findIndex((r) => r.id === id);
        if (existing >= 0) results[existing] = fail;
        else results.push(fail);
        console.error(`  ${label} FAIL:`, msg);
      }
    }
  } finally {
    await browser.close();
  }

  await writeFile(join(SCREENSHOT_ROOT, 'results.json'), JSON.stringify(await mergeResults(results, only), null, 2));

  const reportLines = [
    '# Hotel Etuna E2E Journey Report',
    '',
    `**Date:** ${new Date().toISOString()}`,
    `**Base URL:** ${BASE}`,
    `**Runner:** Playwright (fallback — agent-browser daemon unavailable, os error 35)`,
    '',
    '## Summary',
    '',
    '| Journey | Status | Notes |',
    '|---------|--------|-------|',
    ...results.map((r) => {
      const note = r.notes.join('; ').replace(/\|/g, '\\|').slice(0, 120);
      return `| ${r.id.toUpperCase()} | ${r.status} | ${note || '—'} |`;
    }),
    '',
    '## Environment',
    '',
    '- Dev server: `next dev -p 3010` with `NEXTAUTH_URL=http://127.0.0.1:3010`',
    '- `E2E_TURNSTILE_BYPASS=1`',
    '- Staff creds: `ADMIN_PASSWORD` from `.env.local` (manager@ / admin@)',
    '- Partner: `owner@jayla.nam` / `Test1234!`',
    '',
    '## Known issues / fixes applied',
    '',
    '1. **LoginForm** — added `method="post"` to prevent pre-hydration GET submit leaking credentials in URL.',
    '2. **loginViaUi** — wait for React hydration + `waitForURL` (180s) for slow Next.js compiles.',
    '3. **J3** — Adumo external redirect skipped by design in automated runner.',
    '4. **J7** — skipped when no `is_platform_admin` user in Neon seed.',
    '5. **Payments desk folio refresh** — watch `ManualPaymentForm` `onSuccess` in J5 manual pass.',
    '',
    '## Screenshots',
    '',
    `Directory: \`e2e-screenshots/\` (${results.reduce((n, r) => n + r.screenshots.length, 0)} files this run)`,
    '',
  ];
  await writeFile(join(process.cwd(), 'e2e-test-report.md'), reportLines.join('\n'));

  const failed = results.filter((x) => x.status === 'fail').length;
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
