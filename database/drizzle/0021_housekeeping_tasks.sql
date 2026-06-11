-- Hotel Etuna Housekeeping Task Management
-- Migration: 0021_housekeeping_tasks
-- Purpose: Housekeeping task board, room status tracking, checkout automation

-- Create housekeeping task status enum
CREATE TYPE "public"."housekeeping_task_status" AS ENUM(
  'dirty',
  'cleaning',
  'inspecting',
  'clean'
);

-- Create housekeeping task priority enum
CREATE TYPE "public"."housekeeping_task_priority" AS ENUM(
  'low',
  'normal',
  'high',
  'urgent'
);

-- Create housekeeping tasks table
CREATE TABLE IF NOT EXISTS "housekeeping_tasks" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "property_id" uuid NOT NULL REFERENCES "properties"("id") ON DELETE CASCADE,
  "room_id" uuid NOT NULL REFERENCES "rooms"("id") ON DELETE CASCADE,
  "booking_id" uuid REFERENCES "bookings"("id") ON DELETE SET NULL,
  "assigned_to" uuid REFERENCES "staff"("id") ON DELETE SET NULL,
  "status" housekeeping_task_status DEFAULT 'dirty' NOT NULL,
  "priority" housekeeping_task_priority DEFAULT 'normal' NOT NULL,
  "task_type" varchar(100) DEFAULT 'checkout_cleaning',
  "notes" text,
  "started_at" timestamp with time zone,
  "completed_at" timestamp with time zone,
  "inspection_notes" text,
  "photos" text[] DEFAULT '{}',
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "created_by" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "updated_by" uuid REFERENCES "users"("id") ON DELETE SET NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "idx_housekeeping_tasks_property_id" ON "housekeeping_tasks" ("property_id");
CREATE INDEX IF NOT EXISTS "idx_housekeeping_tasks_room_id" ON "housekeeping_tasks" ("room_id");
CREATE INDEX IF NOT EXISTS "idx_housekeeping_tasks_assigned_to" ON "housekeeping_tasks" ("assigned_to");
CREATE INDEX IF NOT EXISTS "idx_housekeeping_tasks_status" ON "housekeeping_tasks" ("status");
CREATE INDEX IF NOT EXISTS "idx_housekeeping_tasks_booking_id" ON "housekeeping_tasks" ("booking_id");
CREATE INDEX IF NOT EXISTS "idx_housekeeping_tasks_created_at" ON "housekeeping_tasks" ("created_at");

-- Enable RLS (enforced at application layer via nextauth session context)
ALTER TABLE "housekeeping_tasks" ENABLE ROW LEVEL SECURITY;

-- RLS uses app tenant context (set by proxy.ts middleware), NOT auth.uid()
-- This is compatible with Hotel Etuna's NextAuth + Stack Auth dual-auth setup.

-- Policy: Tenant can see all housekeeping tasks for their property
CREATE POLICY "housekeeping_tasks_tenant_select" ON "housekeeping_tasks"
  FOR SELECT
  USING (
    property_id IN (
      SELECT p.id FROM properties p
      WHERE p.tenant_id::text = current_setting('app.tenant_id', true)
    )
  );

-- Policy: Staff can update tasks they're assigned to
CREATE POLICY "housekeeping_tasks_staff_update" ON "housekeeping_tasks"
  FOR UPDATE
  USING (
    assigned_to = current_setting('app.user_id', true)::uuid
    OR current_setting('app.tenant_type', true) = 'hub'
  );

-- Policy: Hub staff can insert tasks
CREATE POLICY "housekeeping_tasks_hub_insert" ON "housekeeping_tasks"
  FOR INSERT
  WITH CHECK (
    current_setting('app.tenant_type', true) = 'hub'
  );

-- Policy: Hub staff can delete tasks
CREATE POLICY "housekeeping_tasks_hub_delete" ON "housekeeping_tasks"
  FOR DELETE
  USING (
    current_setting('app.tenant_type', true) = 'hub'
  );

-- Create trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_housekeeping_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_housekeeping_tasks_updated_at
  BEFORE UPDATE ON "housekeeping_tasks"
  FOR EACH ROW
  EXECUTE FUNCTION update_housekeeping_tasks_updated_at();

-- Create trigger to auto-create housekeeping task on checkout
CREATE OR REPLACE FUNCTION create_housekeeping_task_on_checkout()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Resolve user from session context (set by proxy.ts middleware)
  BEGIN
    v_user_id := current_setting('app.user_id', true)::uuid;
  EXCEPTION WHEN OTHERS THEN
    v_user_id := NULL;
  END;

  -- When booking status changes to 'checked_out', create housekeeping tasks
  IF NEW.status = 'checked_out' AND OLD.status != 'checked_out' THEN
    -- Create a task for each room in the booking
    INSERT INTO housekeeping_tasks (
      property_id,
      room_id,
      booking_id,
      status,
      priority,
      task_type,
      notes,
      created_by
    )
    SELECT 
      NEW.property_id,
      br.room_id,
      NEW.id,
      'dirty'::housekeeping_task_status,
      CASE 
        WHEN NEW.actual_check_out_date > NEW.check_out_date THEN 'high'::housekeeping_task_priority
        ELSE 'normal'::housekeeping_task_priority
      END,
      'checkout_cleaning',
      'Auto-generated after checkout of booking ' || NEW.booking_reference,
      v_user_id
    FROM booking_rooms br
    WHERE br.booking_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_create_housekeeping_task_on_checkout
  AFTER UPDATE ON "bookings"
  FOR EACH ROW
  WHEN (NEW.status = 'checked_out')
  EXECUTE FUNCTION create_housekeeping_task_on_checkout();
