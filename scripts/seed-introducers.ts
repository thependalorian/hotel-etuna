/**
 * Seed sample introducers for CRM + public /introducers-directory.
 * Location: scripts/seed-introducers.ts
 *
 * Introducers are referral partners in CRM — not lodging partner tenant logins.
 *
 * Usage: npx tsx scripts/seed-introducers.ts [--dry] [--force]
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { randomUUID } from 'crypto';
import { neon } from '@neondatabase/serverless';
import { securityLogger } from '@/lib/utils/security-logger';

config({ path: resolve(process.cwd(), '.env.local') });

const sql = neon(process.env.DATABASE_URL!);
const isDryRun = process.argv.includes('--dry');
const isForce = process.argv.includes('--force');

const SAMPLE_INTRODUCERS = [
  {
    code: 'WINDHOEK-TRAVEL',
    name: 'Windhoek Travel Desk',
    email: 'bookings@windhoektravel.example',
    commissionRate: '8.00',
    showInPublicDirectory: true,
    bio: 'Corporate and leisure bookings in the Windhoek area.',
  },
  {
    code: 'ONGWEDIVA-EVENTS',
    name: 'Ongwediva Events Network',
    email: 'events@ongwediva.example',
    commissionRate: '10.00',
    showInPublicDirectory: true,
    bio: 'Trade fair and conference accommodation referrals.',
  },
] as const;

async function main() {
  if (!process.env.DATABASE_URL) {
    securityLogger.error('DATABASE_URL is required');
    process.exit(1);
  }

  const hub = await sql`
    SELECT t.id AS tenant_id, p.id AS property_id
    FROM tenants t
    LEFT JOIN properties p ON p.tenant_id = t.id AND p.slug = 'hotel-etuna'
    WHERE t.type = 'hub'::tenant_type
    ORDER BY t.created_at ASC
    LIMIT 1
  `;

  if (!hub[0]?.tenant_id) {
    throw new Error('Hub tenant not found');
  }

  const tenantId = hub[0].tenant_id as string;
  const propertyId = (hub[0].property_id as string) ?? null;

  securityLogger.info(`Seeding introducers for hub ${tenantId}`);

  for (const row of SAMPLE_INTRODUCERS) {
    if (isDryRun) {
      securityLogger.info(`[DRY] ${row.code} — ${row.name}`);
      continue;
    }

    const existing = await sql`SELECT id FROM introducers WHERE code = ${row.code} LIMIT 1`;
    if (existing.length > 0 && !isForce) {
      securityLogger.info(`✓ ${row.code} already exists`);
      continue;
    }

    await sql`
      INSERT INTO introducers (
        id, tenant_id, property_id, name, code, email,
        commission_rate, is_active, show_in_public_directory, bio,
        created_at, updated_at
      ) VALUES (
        ${randomUUID()}, ${tenantId}, ${propertyId}, ${row.name}, ${row.code}, ${row.email},
        ${row.commissionRate}, true, ${row.showInPublicDirectory}, ${row.bio},
        NOW(), NOW()
      )
      ON CONFLICT (code) DO UPDATE SET
        name = EXCLUDED.name,
        show_in_public_directory = EXCLUDED.show_in_public_directory,
        updated_at = NOW()
    `;
    securityLogger.info(`✓ ${row.code}`);
  }
}

main().catch((err) => {
  securityLogger.error(err);
  process.exit(1);
});
