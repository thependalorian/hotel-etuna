-- Hotel Etuna — Guest document vault (Phase 8)
-- Migration: 0063_guest_document_vault

DO $$ BEGIN
  CREATE TYPE "public"."guest_document_type" AS ENUM('national_id', 'passport', 'visa', 'other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "guest_documents" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "booking_id" uuid NOT NULL REFERENCES "bookings"("id") ON DELETE CASCADE,
  "guest_id" uuid REFERENCES "guests"("id") ON DELETE SET NULL,
  "doc_type" guest_document_type NOT NULL DEFAULT 'national_id',
  "file_name" varchar(255) NOT NULL,
  "mime_type" varchar(128) NOT NULL,
  "encrypted_payload" text NOT NULL,
  "encryption_iv" varchar(64) NOT NULL,
  "encryption_auth_tag" varchar(64) NOT NULL,
  "retention_until" date,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_guest_documents_booking_id" ON "guest_documents" ("booking_id");
CREATE INDEX IF NOT EXISTS "idx_guest_documents_tenant_id" ON "guest_documents" ("tenant_id");
CREATE INDEX IF NOT EXISTS "idx_guest_documents_guest_id" ON "guest_documents" ("guest_id");

ALTER TABLE "guest_documents" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "guest_documents_tenant_select" ON "guest_documents"
  FOR SELECT
  USING (tenant_id::text = current_setting('app.tenant_id', true));

CREATE POLICY "guest_documents_hub_insert" ON "guest_documents"
  FOR INSERT
  WITH CHECK (
    current_setting('app.tenant_type', true) = 'hub'
    AND tenant_id::text = current_setting('app.tenant_id', true)
  );

CREATE POLICY "guest_documents_hub_delete" ON "guest_documents"
  FOR DELETE
  USING (
    current_setting('app.tenant_type', true) = 'hub'
    AND tenant_id::text = current_setting('app.tenant_id', true)
  );
