/**
 * Verify tenant RLS isolation behavior against Neon Postgres.
 *
 * Purpose: prove partner isolation for Hotel Etuna hub/partner model.
 * Location: /scripts/db/verify-tenant-rls.ts
 *
 * Run:
 *   npx tsx scripts/db/verify-tenant-rls.ts
 */

import { randomUUID } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Pool } from 'pg';
import { securityLogger } from '@/lib/utils/security-logger';

function loadEnv(): void {
  const root = resolve(process.cwd());
  for (const file of ['.env.local', '.env']) {
    const path = resolve(root, file);
    if (!existsSync(path)) continue;
    const content = readFileSync(path, 'utf8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx <= 0) continue;
      const key = trimmed.slice(0, idx).trim();
      const value = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
      if (!(key in process.env)) process.env[key] = value;
    }
  }
}

function pass(message: string): void {
  securityLogger.info(`✅ ${message}`);
}

function fail(message: string): never {
  throw new Error(`❌ ${message}`);
}

async function main() {
  loadEnv();

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    fail('DATABASE_URL is not set in .env.local or .env');
  }

  const admin = new Pool({ connectionString: databaseUrl });

  const runId = randomUUID().slice(0, 8);
  const hubTenantId = randomUUID();
  const partnerTenantId = randomUUID();
  const partnerPropertyId = randomUUID();
  const partnerGuestId = randomUUID();
  const hubBookingId = randomUUID();
  const partnerBookingId = randomUUID();
  const roleName = `rls_verify_${runId}`;
  const rolePassword = `Rls!${randomUUID()}Aa1`;
  const bookingRefHub = `RLS-HUB-${runId}`;
  const bookingRefPartner = `RLS-PARTNER-${runId}`;
  const bookingRefWrongTenant = `RLS-WRONG-${runId}`;

  const quoteIdent = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const quoteLiteral = (v: string) => `'${v.replace(/'/g, "''")}'`;

  let verifier: Pool | null = null;

  try {
    await admin.query(
      `
      INSERT INTO tenants (id, name, status, type, parent_tenant_id, created_at, updated_at)
      VALUES
        ($1, $2, 'active', 'hub', NULL, NOW(), NOW()),
        ($3, $4, 'active', 'partner', $1, NOW(), NOW());
      `,
      [hubTenantId, `RLS Hub ${runId}`, partnerTenantId, `RLS Partner ${runId}`],
    );

    await admin.query(
      `
      INSERT INTO properties (id, tenant_id, name, slug, type, created_at, updated_at)
      VALUES ($1, $2, $3, $4, 'hotel', NOW(), NOW());
      `,
      [partnerPropertyId, partnerTenantId, `RLS Property ${runId}`, `rls-property-${runId}`],
    );

    await admin.query(
      `
      INSERT INTO guests (id, tenant_id, email, first_name, last_name, created_at, updated_at)
      VALUES ($1, $2, $3, 'RLS', 'Guest', NOW(), NOW());
      `,
      [partnerGuestId, partnerTenantId, `rls-guest-${runId}@example.com`],
    );

    await admin.query(
      `
      INSERT INTO bookings (
        id, tenant_id, property_id, guest_id, booking_reference, status,
        check_in_date, check_out_date, total_amount, created_at, updated_at
      )
      VALUES
        ($1, $2, NULL, NULL, $3, 'confirmed', CURRENT_DATE + INTERVAL '1 day', CURRENT_DATE + INTERVAL '2 day', 1500.00, NOW(), NOW()),
        ($4, $5, $6, $7, $8, 'confirmed', CURRENT_DATE + INTERVAL '1 day', CURRENT_DATE + INTERVAL '3 day', 2200.00, NOW(), NOW());
      `,
      [
        hubBookingId,
        hubTenantId,
        bookingRefHub,
        partnerBookingId,
        partnerTenantId,
        partnerPropertyId,
        partnerGuestId,
        bookingRefPartner,
      ],
    );
    pass('Created hub + partner fixture data');

    await admin.query(`DROP ROLE IF EXISTS ${quoteIdent(roleName)};`);
    await admin.query(
      `CREATE ROLE ${quoteIdent(roleName)} LOGIN PASSWORD ${quoteLiteral(rolePassword)} NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT;`,
    );
    await admin.query(`GRANT USAGE ON SCHEMA public TO ${quoteIdent(roleName)};`);
    await admin.query(
      `GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.tenants, public.properties, public.guests, public.bookings TO ${quoteIdent(roleName)};`,
    );
    pass('Created dedicated non-owner verifier role');

    const verifierUrl = new URL(databaseUrl);
    verifierUrl.username = roleName;
    verifierUrl.password = rolePassword;
    verifier = new Pool({ connectionString: verifierUrl.toString() });
    {
      const meta = await verifier.query(
        `SELECT current_user as user_name, current_setting('app.tenant_id', true) AS tenant_setting`,
      );
      const connectedUser = meta.rows[0]?.user_name as string | undefined;
      if (connectedUser !== roleName) {
        fail(`Verifier connected as ${connectedUser ?? 'unknown'} instead of ${roleName}`);
      }
      pass(`Verifier connected as ${connectedUser}`);
    }

    {
      const client = await verifier.connect();
      try {
        await client.query('BEGIN');
        await client.query(`SELECT set_config('app.tenant_id', $1, true)`, [partnerTenantId]);
        await client.query(`SELECT set_config('app.tenant_type', 'partner', true)`);

        const blocked = await client.query(
          `SELECT id FROM bookings WHERE tenant_id = $1`,
          [hubTenantId],
        );
        if (blocked.rowCount !== 0) {
          fail(`Partner context can see hub bookings (${blocked.rowCount})`);
        }
        pass('Partner context cannot read hub bookings');
      } finally {
        await client.query('ROLLBACK');
        client.release();
      }
    }

    {
      const client = await verifier.connect();
      try {
        await client.query('BEGIN');
        await client.query(`SELECT set_config('app.tenant_id', $1, true)`, [partnerTenantId]);
        await client.query(`SELECT set_config('app.tenant_type', 'partner', true)`);

        const own = await client.query(
          `SELECT id FROM bookings WHERE tenant_id = $1`,
          [partnerTenantId],
        );
        if (!own.rowCount || own.rowCount < 1) {
          fail('Partner context cannot read own bookings');
        }
        pass('Partner context can read own bookings');
      } finally {
        await client.query('ROLLBACK');
        client.release();
      }
    }

    {
      const client = await verifier.connect();
      let denied = false;
      try {
        await client.query('BEGIN');
        await client.query(`SELECT set_config('app.tenant_id', $1, true)`, [partnerTenantId]);
        await client.query(`SELECT set_config('app.tenant_type', 'partner', true)`);

        await client.query(
          `
          INSERT INTO bookings (
            id, tenant_id, property_id, guest_id, booking_reference, status,
            check_in_date, check_out_date, total_amount, created_at, updated_at
          )
          VALUES ($1, $2, $3, $4, $5, 'confirmed', CURRENT_DATE + INTERVAL '4 day', CURRENT_DATE + INTERVAL '5 day', 1000.00, NOW(), NOW());
          `,
          [randomUUID(), hubTenantId, partnerPropertyId, partnerGuestId, bookingRefWrongTenant],
        );
      } catch {
        denied = true;
      } finally {
        await client.query('ROLLBACK');
        client.release();
      }

      if (!denied) {
        fail('Partner context inserted booking for a different tenant');
      }
      pass('Partner context cannot insert booking with wrong tenant_id');
    }

    pass('All RLS isolation checks passed');
  } finally {
    try {
      if (verifier) await verifier.end();
    } catch {}
    try {
      await admin.query(`DROP ROLE IF EXISTS ${quoteIdent(roleName)};`);
    } catch {}
    try {
      await admin.query(
        `DELETE FROM bookings WHERE booking_reference IN ($1, $2, $3);`,
        [bookingRefHub, bookingRefPartner, bookingRefWrongTenant],
      );
      await admin.query(`DELETE FROM guests WHERE id = $1`, [partnerGuestId]);
      await admin.query(`DELETE FROM properties WHERE id = $1`, [partnerPropertyId]);
      await admin.query(`DELETE FROM tenants WHERE id IN ($1, $2)`, [partnerTenantId, hubTenantId]);
    } catch {}
    await admin.end();
  }
}

main().catch((error) => {
  securityLogger.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
