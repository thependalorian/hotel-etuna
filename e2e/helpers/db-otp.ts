import pg from 'pg';
import { loadEnvFiles } from './load-env';

/**
 * Read email verification OTP via Postgres (avoids loading Drizzle/TS modules in Playwright workers).
 */
export async function getVerificationOtpForEmail(email: string): Promise<string> {
  loadEnvFiles();
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error('DATABASE_URL required for OTP lookup');

  const client = new pg.Client({ connectionString: databaseUrl });
  await client.connect();
  try {
    const res = await client.query<{ email_verification_otp: string | null }>(
      `SELECT email_verification_otp FROM users WHERE email = $1 LIMIT 1`,
      [email],
    );
    const otp = res.rows[0]?.email_verification_otp;
    if (!otp) throw new Error(`No email_verification_otp for ${email}`);
    return otp;
  } finally {
    await client.end();
  }
}
