-- Hotel Etuna Partner Network Migration
-- Adds hub-and-spoke multi-tenancy with partner support
-- Date: 2026-04-28

-- ============================================================================
-- STEP 1: Create tenant_type enum
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE "tenant_type" AS ENUM ('operator', 'hub', 'partner');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- STEP 2: Add new columns to tenants table
-- ============================================================================

-- Add type column (operator/hub vs partner)
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "type" "tenant_type" NOT NULL DEFAULT 'operator';

-- Add parent_tenant_id for partner -> hub relationship
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "parent_tenant_id" uuid;

-- Add commission percentage for partners (default 10%)
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "commission_percent" numeric(5,2) DEFAULT 10.00;

-- ============================================================================
-- STEP 3: Add commission_amount to bookings table
-- ============================================================================

-- Track commission amount for partner bookings
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "commission_amount" numeric(12,2);

-- ============================================================================
-- STEP 4: Create partner_invites table
-- ============================================================================

CREATE TABLE IF NOT EXISTS "partner_invites" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "email" varchar(255) NOT NULL,
  "token" varchar(255) UNIQUE NOT NULL,
  "property_name" varchar(255) NOT NULL,
  "claimed" boolean DEFAULT false NOT NULL,
  "claimed_at" timestamp with time zone,
  "claimed_by_user_id" uuid,
  "expires_at" timestamp with time zone NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "created_by_user_id" uuid,
  "metadata" jsonb DEFAULT '{}'::jsonb
);

-- ============================================================================
-- STEP 5: Add foreign key constraints
-- ============================================================================

-- Parent tenant foreign key
DO $$ BEGIN
  ALTER TABLE "tenants" ADD CONSTRAINT "tenants_parent_tenant_id_tenants_id_fk" 
    FOREIGN KEY ("parent_tenant_id") REFERENCES "public"."tenants"("id") 
    ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Partner invites -> users (created by)
DO $$ BEGIN
  ALTER TABLE "partner_invites" ADD CONSTRAINT "partner_invites_created_by_user_id_users_id_fk" 
    FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") 
    ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Partner invites -> users (claimed by)
DO $$ BEGIN
  ALTER TABLE "partner_invites" ADD CONSTRAINT "partner_invites_claimed_by_user_id_users_id_fk" 
    FOREIGN KEY ("claimed_by_user_id") REFERENCES "public"."users"("id") 
    ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- STEP 6: Create indexes for performance
-- ============================================================================

-- Index on tenant type for filtering
CREATE INDEX IF NOT EXISTS "idx_tenants_type" ON "tenants" USING btree ("type");

-- Index on parent_tenant_id for partner lookups
CREATE INDEX IF NOT EXISTS "idx_tenants_parent_tenant_id" ON "tenants" USING btree ("parent_tenant_id");

-- Index on commission_amount for reporting
CREATE INDEX IF NOT EXISTS "idx_bookings_commission_amount" ON "bookings" USING btree ("commission_amount") WHERE "commission_amount" IS NOT NULL;

-- Indexes on partner_invites
CREATE INDEX IF NOT EXISTS "idx_partner_invites_email" ON "partner_invites" USING btree ("email");
CREATE INDEX IF NOT EXISTS "idx_partner_invites_token" ON "partner_invites" USING btree ("token");
CREATE INDEX IF NOT EXISTS "idx_partner_invites_claimed" ON "partner_invites" USING btree ("claimed");
CREATE INDEX IF NOT EXISTS "idx_partner_invites_expires_at" ON "partner_invites" USING btree ("expires_at");

-- ============================================================================
-- STEP 7: Add check constraints
-- ============================================================================

-- Ensure commission_percent is between 0 and 100
DO $$ BEGIN
  ALTER TABLE "tenants" ADD CONSTRAINT "tenants_commission_percent_check" 
    CHECK ("commission_percent" >= 0 AND "commission_percent" <= 100);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Ensure commission_amount is non-negative
DO $$ BEGIN
  ALTER TABLE "bookings" ADD CONSTRAINT "bookings_commission_amount_check" 
    CHECK ("commission_amount" IS NULL OR "commission_amount" >= 0);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Operator/Hub tenants cannot have a parent
DO $$ BEGIN
  ALTER TABLE "tenants" ADD CONSTRAINT "tenants_hub_no_parent_check" 
    CHECK (("type" IN ('operator', 'hub') AND "parent_tenant_id" IS NULL) OR "type" = 'partner');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Partner tenants must have a parent
DO $$ BEGIN
  ALTER TABLE "tenants" ADD CONSTRAINT "tenants_partner_has_parent_check" 
    CHECK (("type" = 'partner' AND "parent_tenant_id" IS NOT NULL) OR "type" IN ('operator', 'hub'));
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- STEP 8: Add comments for documentation
-- ============================================================================

COMMENT ON COLUMN "tenants"."type" IS 'Tenant type: operator (Hotel Etuna main), hub (deprecated), or partner (referral properties)';
COMMENT ON COLUMN "tenants"."parent_tenant_id" IS 'For partners: references the hub tenant (Hotel Etuna)';
COMMENT ON COLUMN "tenants"."commission_percent" IS 'Commission percentage for partner bookings (0-100)';
COMMENT ON COLUMN "bookings"."commission_amount" IS 'Commission amount retained by hub for partner bookings';
COMMENT ON TABLE "partner_invites" IS 'Invite tokens for onboarding referral partners';

-- ============================================================================
-- Migration complete
-- ============================================================================
