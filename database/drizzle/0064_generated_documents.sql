-- Hotel Etuna — Guest financial document generation audit log
-- Migration: 0064_generated_documents

DO $$ BEGIN
  CREATE TYPE "public"."document_type_enum" AS ENUM(
    'quotation',
    'invoice',
    'receipt',
    'payment_notification'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "generated_documents" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "booking_id" uuid NOT NULL REFERENCES "bookings"("id") ON DELETE CASCADE,
  "document_type" document_type_enum NOT NULL,
  "reference_number" text NOT NULL,
  "generated_by" uuid NOT NULL REFERENCES "users"("id"),
  "generated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "file_url" text,
  "checksum" text NOT NULL,
  CONSTRAINT "generated_documents_reference_number_unique" UNIQUE("reference_number")
);

CREATE INDEX IF NOT EXISTS "idx_generated_documents_booking" ON "generated_documents" ("booking_id");
CREATE INDEX IF NOT EXISTS "idx_generated_documents_tenant" ON "generated_documents" ("tenant_id");
CREATE INDEX IF NOT EXISTS "idx_generated_documents_type" ON "generated_documents" ("document_type");
CREATE INDEX IF NOT EXISTS "idx_generated_documents_reference" ON "generated_documents" ("reference_number");
CREATE INDEX IF NOT EXISTS "idx_generated_documents_generated_at" ON "generated_documents" ("generated_at");

ALTER TABLE "generated_documents" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "generated_documents_tenant_select" ON "generated_documents"
  FOR SELECT
  USING (tenant_id::text = current_setting('app.tenant_id', true));

CREATE POLICY "generated_documents_hub_insert" ON "generated_documents"
  FOR INSERT
  WITH CHECK (
    current_setting('app.tenant_type', true) = 'hub'
    AND tenant_id::text = current_setting('app.tenant_id', true)
  );
