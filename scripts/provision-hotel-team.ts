/**
 * Provision Hotel Etuna hub team login accounts (founder, admin, frontdesk, marketing, support).
 * Location: scripts/provision-hotel-team.ts
 *
 * Usage:
 *   PASSWORD='your-secret' npx tsx scripts/provision-hotel-team.ts
 *   npx tsx scripts/provision-hotel-team.ts --dry
 *   npx tsx scripts/provision-hotel-team.ts --force
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { neon } from '@neondatabase/serverless';
import {
  HUB_TEAM_PROVISION_ACCOUNTS,
  HUB_TEAM_INBOX_TO_ROLE,
} from '@/lib/auth/hub-team';
import { securityLogger } from '@/lib/utils/security-logger';

config({ path: resolve(process.cwd(), '.env.local') });

const sql = neon(process.env.DATABASE_URL!);

const args = process.argv.slice(2);
const isDryRun = args.includes('--dry');
const isForce = args.includes('--force');

async function getHubTenantId(): Promise<string> {
  const rows = await sql`
    SELECT id FROM tenants WHERE type = 'hub'::tenant_type ORDER BY created_at ASC LIMIT 1
  `;
  if (!rows[0]?.id) {
    throw new Error('No hub tenant found — run scripts/seed-hotel-etuna.ts first');
  }
  return rows[0].id as string;
}

async function main() {
  if (!process.env.DATABASE_URL) {
    securityLogger.error('DATABASE_URL is required');
    process.exit(1);
  }

  const password = process.env.PASSWORD || process.env.ADMIN_PASSWORD || 'Test1234!';
  const passwordHash = bcrypt.hashSync(password, 10);
  const hubTenantId = await getHubTenantId();

  securityLogger.info('Hotel Etuna hub team provision');
  securityLogger.info('─'.repeat(50));
  securityLogger.info(`Hub tenant: ${hubTenantId}`);
  securityLogger.info(`Dry run:    ${isDryRun}`);
  securityLogger.info(`Accounts:   ${HUB_TEAM_PROVISION_ACCOUNTS.length}`);

  for (const account of HUB_TEAM_PROVISION_ACCOUNTS) {
    const role = HUB_TEAM_INBOX_TO_ROLE[account.inbox];
    securityLogger.info(`\n→ ${account.email} (${account.inbox} → role ${role})`);

    if (isDryRun) continue;

    const existing = await sql`
      SELECT id, role FROM users WHERE LOWER(email) = LOWER(${account.email}) LIMIT 1
    `;

    if (existing.length > 0 && !isForce) {
      await sql`
        UPDATE users SET
          role = ${role},
          tenant_id = ${hubTenantId},
          email_verified = true,
          updated_at = NOW()
        WHERE id = ${existing[0].id}
      `;
      securityLogger.info('   ✓ Updated role/tenant (existing user)');
      continue;
    }

    const id = existing[0]?.id ?? randomUUID();
    await sql`
      INSERT INTO users (
        id, tenant_id, email, password_hash, first_name, last_name,
        phone, role, email_verified, status, created_at, updated_at
      ) VALUES (
        ${id}, ${hubTenantId}, ${account.email}, ${passwordHash},
        ${account.firstName}, ${account.lastName}, ${account.phone},
        ${role}, true, 'active', NOW(), NOW()
      )
      ON CONFLICT (email) DO UPDATE SET
        tenant_id = EXCLUDED.tenant_id,
        password_hash = EXCLUDED.password_hash,
        role = EXCLUDED.role,
        email_verified = true,
        updated_at = NOW()
    `;
    securityLogger.info('   ✓ Provisioned');
  }

  if (!isDryRun) {
    securityLogger.info('\n🔐 Sign in at /login?redirect=/dashboard');
    securityLogger.info('   Use each @hoteletuna.com inbox email with PASSWORD / ADMIN_PASSWORD.');
  }
}

main().catch((err) => {
  securityLogger.error(err);
  process.exit(1);
});
