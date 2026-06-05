/**
 * Patch: add tenant type/partner columns and apply RLS-dependent migrations.
 * Run BEFORE apply-all-missing-migrations.ts when the tenants table lacks the type column.
 *
 * Usage: npx tsx scripts/db/patch-tenant-type-column.ts
 */

import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Pool } from 'pg';

function loadEnv(): void {
  const root = resolve(process.cwd());
  for (const file of ['.env.local', '.env']) {
    const path = resolve(root, file);
    if (!existsSync(path)) continue;
    const content = readFileSync(path, 'utf8');
    for (const line of content.split('\n')) {
      const t = line.trim();
      if (!t || t.startsWith('#')) continue;
      const idx = t.indexOf('=');
      if (idx <= 0) continue;
      const k = t.slice(0, idx).trim();
      const v = t.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
      if (!(k in process.env)) process.env[k] = v;
    }
  }
}

const PATCH_SQL = `
-- Add tenant type infrastructure (safe, idempotent)

-- 1. Enum
DO $$ BEGIN
  CREATE TYPE tenant_type AS ENUM ('hub', 'partner');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. Columns on tenants
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS type tenant_type DEFAULT 'hub';
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS parent_tenant_id uuid REFERENCES tenants(id);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS commission_percent numeric(5,2) DEFAULT 10.00;

-- 3. partner_invites table
CREATE TABLE IF NOT EXISTS partner_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  email varchar(255) NOT NULL,
  property_name varchar(255),
  token varchar(255) UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
  claimed_at timestamptz,
  expires_at timestamptz DEFAULT NOW() + INTERVAL '7 days',
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_partner_invites_email ON partner_invites(email);
CREATE INDEX IF NOT EXISTS idx_partner_invites_token ON partner_invites(token);
CREATE INDEX IF NOT EXISTS idx_partner_invites_claimed ON partner_invites(claimed_at) WHERE claimed_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_partner_invites_expires_at ON partner_invites(expires_at);

-- 4. Additional booking commission column
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS commission_amount numeric(12,2);
CREATE INDEX IF NOT EXISTS idx_bookings_commission_amount ON bookings(commission_amount);
CREATE INDEX IF NOT EXISTS idx_tenants_type ON tenants(type);
CREATE INDEX IF NOT EXISTS idx_tenants_parent_tenant_id ON tenants(parent_tenant_id);

-- 5. Constraints (idempotent)
DO $$ BEGIN
  ALTER TABLE tenants ADD CONSTRAINT tenants_commission_percent_check
    CHECK (commission_percent >= 0 AND commission_percent <= 100);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE bookings ADD CONSTRAINT bookings_commission_amount_check
    CHECK (commission_amount IS NULL OR commission_amount >= 0);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 6. RLS using the new type column
ALTER TABLE partner_invites ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS hub_only_partner_invites ON partner_invites;
CREATE POLICY hub_only_partner_invites ON partner_invites
FOR ALL
USING (current_setting('app.tenant_type', true) = 'hub')
WITH CHECK (current_setting('app.tenant_type', true) = 'hub');

-- 7. Fix booking_charges RLS (needs hub type check)
ALTER TABLE public.booking_charges ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_access_booking_charges ON public.booking_charges;
CREATE POLICY tenant_access_booking_charges ON public.booking_charges
FOR ALL
USING (
  tenant_id::text = current_setting('app.tenant_id', true)
  OR EXISTS (
    SELECT 1 FROM public.tenants hub_tenant
    WHERE hub_tenant.id::text = current_setting('app.tenant_id', true)
      AND hub_tenant.type = 'hub'
  )
)
WITH CHECK (
  tenant_id::text = current_setting('app.tenant_id', true)
  OR EXISTS (
    SELECT 1 FROM public.tenants hub_tenant
    WHERE hub_tenant.id::text = current_setting('app.tenant_id', true)
      AND hub_tenant.type = 'hub'
  )
);
`;

async function main() {
  loadEnv();
  const connectionString =
    process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
  if (!connectionString) { console.error('❌ DATABASE_URL not set'); process.exit(1); }

  const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });
  console.log('🔧 Patching tenants table with type column and RLS policies...');

  try {
    await pool.query(PATCH_SQL);
    console.log('✅ Patch applied successfully');

    // Verify
    const { rows } = await pool.query(
      `SELECT column_name FROM information_schema.columns
       WHERE table_schema='public' AND table_name='tenants'
         AND column_name IN ('type','parent_tenant_id','commission_percent')
       ORDER BY column_name`
    );
    console.log('✅ tenants columns added:', rows.map(r => r.column_name).join(', '));
  } catch (err) {
    console.error('❌ Patch failed:', err instanceof Error ? err.message : String(err));
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main().catch(e => { console.error(e); process.exit(1); });
