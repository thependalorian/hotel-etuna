import { expect, type APIRequestContext, type Page } from '@playwright/test';
import { dismissCookies } from './dismiss-cookie-consent';
import { loadEnvFiles } from './load-env';
import { getVerificationOtpForEmail } from './db-otp';

export type LoginCredentials = {
  email: string;
  password: string;
};

const DEFAULT_STAFF: LoginCredentials = {
  email: 'manager@hoteletuna.com',
  password: 'Test1234!',
};

function normalizeOtp(value: string): string {
  return value.replace(/\D/g, '').slice(0, 6);
}

function resolveE2eOrigin(page: Page): string {
  const fromEnv = process.env.PLAYWRIGHT_BASE_URL?.replace(/\/$/, '');
  if (fromEnv) return fromEnv;

  try {
    const origin = new URL(page.url()).origin;
    if (origin && origin !== 'null' && origin.startsWith('http')) {
      return origin.replace(/\/$/, '');
    }
  } catch {
    // about:blank or other non-navigable URLs
  }

  return 'http://127.0.0.1:3010';
}

/** Poll Neon until `email_verification_otp` is persisted after API register. */
export async function waitForVerificationOtp(email: string): Promise<string> {
  const deadline = Date.now() + 60_000;
  let lastError: unknown;
  while (Date.now() < deadline) {
    try {
      return await getVerificationOtpForEmail(email);
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }
  throw lastError instanceof Error ? lastError : new Error(`OTP not ready for ${email}`);
}

/**
 * Register guest via API (avoids Turnstile widget in UI during E2E).
 */
export async function registerGuestViaApi(
  request: APIRequestContext,
  baseURL: string,
  creds: LoginCredentials & { name: string },
): Promise<string> {
  loadEnvFiles();
  const res = await request.post(`${baseURL}/api/auth/register`, {
    data: {
      name: creds.name,
      email: creds.email,
      password: creds.password,
    },
  });
  const bodyText = await res.text();
  if (!res.ok()) {
    throw new Error(`Guest register failed (${res.status()}): ${bodyText.slice(0, 300)}`);
  }
  try {
    const parsed = JSON.parse(bodyText) as { e2eOtp?: string };
    if (parsed.e2eOtp) return normalizeOtp(parsed.e2eOtp);
  } catch {
    // non-JSON body
  }

  return normalizeOtp(await waitForVerificationOtp(creds.email));
}

/** Fill OTP on verify-email and wait for redirect to login. */
export async function completeVerifyEmailUi(
  page: Page,
  otp: string,
  email?: string,
): Promise<void> {
  const code = normalizeOtp(otp);
  if (code.length !== 6) {
    throw new Error(`Expected 6-digit OTP, got "${otp}"`);
  }

  await page.getByRole('heading', { name: /verify your email/i }).waitFor({ state: 'visible' });

  const otpInput = page.getByRole('textbox', { name: /verification code/i });
  await otpInput.click();
  await otpInput.fill('');
  // Controlled React input: keyboard events update state; fill() alone leaves the button disabled.
  await otpInput.pressSequentially(code, { delay: 25 });

  const verifyButton = page.getByRole('button', { name: /verify email/i });
  try {
    await expect(verifyButton).toBeEnabled({ timeout: 10_000 });
    await verifyButton.click();
    await page.waitForURL(/\/login/, { timeout: 30_000 });
  } catch (uiError) {
    if (!email) throw uiError;

    const baseURL = resolveE2eOrigin(page);
    const res = await page.context().request.post(`${baseURL}/api/auth/verify-email`, {
      data: { email, otp: code },
    });
    const body = await res.text();
    if (!res.ok()) {
      throw new Error(
        `Verify UI and API fallback failed (${res.status()}): ${body.slice(0, 300)}`,
        { cause: uiError },
      );
    }
    await page.goto('/login?verified=true', { waitUntil: 'domcontentloaded' });
  }
}

/**
 * Sign in with staff credentials (hub / property shell).
 */
export async function loginAsStaff(page: Page, creds: LoginCredentials = DEFAULT_STAFF): Promise<void> {
  await dismissCookies(page);
  await page.goto('/login', { waitUntil: 'domcontentloaded' });
  await page.getByLabel(/email/i).fill(creds.email);
  await page.getByLabel(/password/i).fill(creds.password);
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL((url) => !url.pathname.endsWith('/login'), { timeout: 60_000 });
}

/**
 * Register → verify OTP → login as guest consumer (PRD §3.3.3 guest hub).
 * Requires DATABASE_URL for OTP lookup.
 */
export async function loginAsGuest(
  page: Page,
  options?: Partial<LoginCredentials & { name: string }>,
): Promise<LoginCredentials> {
  loadEnvFiles();
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL required for loginAsGuest');
  }

  const email = options?.email ?? `e2e-guest-${Date.now()}@example.com`;
  const password = options?.password ?? 'E2eGuestPlaywright1!';
  const name = options?.name ?? 'E2E Guest';
  const baseURL = resolveE2eOrigin(page);

  await dismissCookies(page);
  const otp = await registerGuestViaApi(page.context().request, baseURL, { name, email, password });

  await page.goto(`/verify-email?email=${encodeURIComponent(email)}`, {
    waitUntil: 'domcontentloaded',
  });

  await completeVerifyEmailUi(page, otp, email);

  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL(/\/guest/, { timeout: 90_000 });

  return { email, password };
}
