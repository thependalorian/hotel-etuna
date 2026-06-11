-- Hotel Etuna Guest Service & Maintenance Requests (Phase 8 — Guest Command Centre)
-- Migration: 0054_guest_service_requests
-- Purpose: Let an in-stay guest raise housekeeping/amenity requests or report a
--          maintenance issue from /guest; housekeeping/maintenance requests spawn a
--          linked housekeeping_tasks row so they surface on the staff board immediately.
-- Reference: PRD §1.1 Goal 1, §3.4a; PLANNING § Agentic CRM & Intelligent OS roadmap.

-- Request type (what the guest is asking for)
DO $$ BEGIN
  CREATE TYPE "public"."guest_service_request_type" AS ENUM(
    'housekeeping',
    'maintenance',
    'amenity',
    'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Lifecycle status (staff-driven after the guest opens it)
DO $$ BEGIN
  CREATE TYPE "public"."guest_service_request_status" AS ENUM(
    'open',
    'acknowledged',
    'in_progress',
    'resolved',
    'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Reuses existing housekeeping_task_priority enum (low/normal/high/urgent) from 0021.

CREATE TABLE IF NOT EXISTS "guest_service_requests" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "property_id" uuid NOT NULL REFERENCES "properties"("id") ON DELETE CASCADE,
  "booking_id" uuid NOT NULL REFERENCES "bookings"("id") ON DELETE CASCADE,
  "room_id" uuid REFERENCES "rooms"("id") ON DELETE SET NULL,
  "guest_id" uuid REFERENCES "guests"("id") ON DELETE SET NULL,
  "request_type" guest_service_request_type NOT NULL,
  "category" varchar(80),
  "description" text,
  "photos" text[] DEFAULT '{}',
  "status" guest_service_request_status DEFAULT 'open' NOT NULL,
  "priority" housekeeping_task_priority DEFAULT 'normal' NOT NULL,
  "housekeeping_task_id" uuid REFERENCES "housekeeping_tasks"("id") ON DELETE SET NULL,
  "resolved_at" timestamp with time zone,
  "resolved_by" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "created_by" uuid REFERENCES "users"("id") ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS "idx_guest_service_requests_tenant_id" ON "guest_service_requests" ("tenant_id");
CREATE INDEX IF NOT EXISTS "idx_guest_service_requests_property_id" ON "guest_service_requests" ("property_id");
CREATE INDEX IF NOT EXISTS "idx_guest_service_requests_booking_id" ON "guest_service_requests" ("booking_id");
CREATE INDEX IF NOT EXISTS "idx_guest_service_requests_status" ON "guest_service_requests" ("status");
CREATE INDEX IF NOT EXISTS "idx_guest_service_requests_created_at" ON "guest_service_requests" ("created_at");

-- RLS — app tenant context (set by withApiAuth via set_config), not auth.uid().
-- Mirrors housekeeping_tasks (migration 0021): tenant reads its own rows; hub writes.
ALTER TABLE "guest_service_requests" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "guest_service_requests_tenant_select" ON "guest_service_requests"
  FOR SELECT
  USING (
    tenant_id::text = current_setting('app.tenant_id', true)
  );

-- Hub-tenant sessions (guests live on the hub tenant; staff are hub) may insert.
-- API layer additionally enforces stay access (guest email match) + guest role.
CREATE POLICY "guest_service_requests_hub_insert" ON "guest_service_requests"
  FOR INSERT
  WITH CHECK (
    current_setting('app.tenant_type', true) = 'hub'
    AND tenant_id::text = current_setting('app.tenant_id', true)
  );

CREATE POLICY "guest_service_requests_hub_update" ON "guest_service_requests"
  FOR UPDATE
  USING (
    current_setting('app.tenant_type', true) = 'hub'
    AND tenant_id::text = current_setting('app.tenant_id', true)
  );

CREATE POLICY "guest_service_requests_hub_delete" ON "guest_service_requests"
  FOR DELETE
  USING (
    current_setting('app.tenant_type', true) = 'hub'
    AND tenant_id::text = current_setting('app.tenant_id', true)
  );

-- Keep updated_at fresh
CREATE OR REPLACE FUNCTION update_guest_service_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_guest_service_requests_updated_at ON "guest_service_requests";
CREATE TRIGGER trigger_update_guest_service_requests_updated_at
  BEFORE UPDATE ON "guest_service_requests"
  FOR EACH ROW
  EXECUTE FUNCTION update_guest_service_requests_updated_at();
