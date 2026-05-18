/**
 * Provision or update a Buffr platform admin (NextAuth credentials user).
 * Location: scripts/provision-platform-admin.ts
 *
 * Usage:
 *   EMAIL=george@buffr.ai PASSWORD='your-secret' npx tsx scripts/provision-platform-admin.ts
 *   npx tsx scripts/provision-platform-admin.ts --email george@buffr.ai --link-hub
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { neon } from '@neondatabase/serverless';

config({ path: resolve(process.cwd(), '.env.local') });

const sql = neon(process.env.DATABASE_URL!);

function parseArgs(): { email: string; linkHub: boolean; dryRun: boolean } {
  const argv = process.argv.slice(2);
  let email = process.env.EMAIL?.trim().toLowerCase() ?? 'george@buffr.ai';
  let linkHub = true;
  let dryRun = false;

  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--email' && argv[i + 1]) {
      email = argv[++i].trim().toLowerCase();
    } else if (argv[i] === '--link-hub') {
      linkHub = true;
    } else if (argv[i] === '--no-link-hub') {
      linkHub = false;
    } else if (argv[i] === '--dry') {
      dryRun = true;
    }
  }

  if (!email.endsWith('@buffr.ai')) {
    console.error('Platform admin email must use @buffr.ai');
    process.exit(1);
  }

  return { email, linkHub, dryRun };
}

async function getHubTenantId(): Promise<string | null> {
  const rows = await sql`
    SELECT id FROM tenants WHERE type = 'hub'::tenant_type ORDER BY created_at ASC LIMIT 1
  `;
  return (rows[0]?.id as string) ?? null;
}

async function main() {
  const { email, linkHub, dryRun } = parseArgs();
  const password = process.env.PASSWORD || process.env.ADMIN_PASSWORD;
if (!password) {
  console.error('❌ PASSWORD or ADMIN_PASSWORD not found in environment. Please set one before running the script.');
  process.exit(1);
}
  const passwordHash = bcrypt.hashSync(password, 10);

  const hubTenantId = linkHub ? await getHubTenantId() : null;

  const existing = await sql`
    SELECT id, email, role, tenant_id, is_platform_admin
    FROM users WHERE LOWER(email) = LOWER(${email})
    LIMIT 1
  `;

  console.log('Buffr platform admin provision');
  console.log('─'.repeat(50));
  console.log(`Email:      ${email}`);
  console.log(`Link hub:   ${linkHub ? (hubTenantId ?? 'none found') : 'no'}`);
  console.log(`Dry run:    ${dryRun}`);

  if (dryRun) {
    console.log('\nDry run — no database changes.');
    return;
  }

  if (existing.length > 0) {
    const row = existing[0];
    await sql`
      UPDATE users SET
        role = 'super-admin',
        is_platform_admin = true,
        email_verified = true,
        password_hash = ${passwordHash},
        first_name = COALESCE(first_name, 'George'),
        last_name = COALESCE(last_name, 'Nekwaya'),
        tenant_id = ${linkHub && hubTenantId ? hubTenantId : row.tenant_id},
        updated_at = NOW()
      WHERE id = ${row.id}
    `;
    console.log(`\nUpdated existing user ${row.id}`);
  } else {
    const id = randomUUID();
    await sql`
      INSERT INTO users (
        id, email, password_hash, first_name, last_name,
        role, is_platform_admin, email_verified, tenant_id, status
      ) VALUES (
        ${id},
        ${email},
        ${passwordHash},
        'George',
        'Nekwaya',
        'super-admin',
        true,
        true,
        ${linkHub ? hubTenantId : null},
        'active'
      )
    `;
    console.log(`\nCreated user ${id}`);
  }

  const verify = await sql`
    SELECT email, role, tenant_id, is_platform_admin, email_verified
    FROM users WHERE LOWER(email) = LOWER(${email})
  `;
  console.log('\nVerified row:', verify[0]);
  console.log('\nSign in at /login?redirect=/dashboard with the email and PASSWORD you set.');
  console.log('Platform console: /admin/platform');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
