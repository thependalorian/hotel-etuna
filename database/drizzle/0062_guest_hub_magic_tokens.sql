-- Hotel Etuna — Pre-arrival magic link tokens (Phase 8)
-- Migration: 0062_guest_hub_magic_tokens

CREATE TABLE IF NOT EXISTS "guest_hub_magic_tokens" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "booking_id" uuid NOT NULL REFERENCES "bookings"("id") ON DELETE CASCADE,
  "token_hash" varchar(64) NOT NULL,
  "expires_at" timestamp with time zone NOT NULL,
  "used_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "guest_hub_magic_tokens_token_hash_unique" UNIQUE ("token_hash")
);

CREATE INDEX IF NOT EXISTS "idx_guest_hub_magic_tokens_booking_id"
  ON "guest_hub_magic_tokens" ("booking_id");
CREATE INDEX IF NOT EXISTS "idx_guest_hub_magic_tokens_tenant_id"
  ON "guest_hub_magic_tokens" ("tenant_id");
CREATE INDEX IF NOT EXISTS "idx_guest_hub_magic_tokens_expires_at"
  ON "guest_hub_magic_tokens" ("expires_at");

ALTER TABLE "guest_hub_magic_tokens" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "guest_hub_magic_tokens_tenant_select" ON "guest_hub_magic_tokens"
  FOR SELECT
  USING (tenant_id::text = current_setting('app.tenant_id', true));

CREATE POLICY "guest_hub_magic_tokens_hub_insert" ON "guest_hub_magic_tokens"
  FOR INSERT
  WITH CHECK (
    current_setting('app.tenant_type', true) = 'hub'
    AND tenant_id::text = current_setting('app.tenant_id', true)
  );

CREATE POLICY "guest_hub_magic_tokens_hub_update" ON "guest_hub_magic_tokens"
  FOR UPDATE
  USING (
    current_setting('app.tenant_type', true) = 'hub'
    AND tenant_id::text = current_setting('app.tenant_id', true)
  );
