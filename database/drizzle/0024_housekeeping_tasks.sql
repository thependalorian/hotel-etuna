/**
 * Migration 0024: Housekeeping Tasks & Photos
 * 
 * Purpose: Room cleaning task management with status tracking and photo uploads
 * Features:
 *   - Auto-generate tasks on checkout
 *   - Task lifecycle: pending → in_progress → inspection → completed
 *   - Photo documentation (max 5 per task)
 *   - Room status sync (dirty → clean)
 * 
 * Location: database/drizzle/0024_housekeeping_tasks.sql
 */

-- ============================================================================
-- ENUMS
-- ============================================================================

CREATE TYPE hk_task_type AS ENUM (
  'checkout_clean',
  'stayover',
  'deep_clean',
  'maintenance'
);

CREATE TYPE hk_task_status AS ENUM (
  'pending',
  'in_progress',
  'inspection',
  'completed',
  'cancelled'
);

CREATE TYPE hk_task_priority AS ENUM (
  'low',
  'normal',
  'high',
  'urgent'
);

-- ============================================================================
-- TABLES
-- ============================================================================

CREATE TABLE hk_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,

  task_type hk_task_type NOT NULL DEFAULT 'checkout_clean',
  status hk_task_status NOT NULL DEFAULT 'pending',
  priority hk_task_priority NOT NULL DEFAULT 'normal',

  notes TEXT,
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE hk_task_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES hk_tasks(id) ON DELETE CASCADE,
  
  photo_url TEXT NOT NULL,
  caption TEXT,
  uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_hk_tasks_tenant_status ON hk_tasks(tenant_id, status, created_at);
CREATE INDEX idx_hk_tasks_room ON hk_tasks(tenant_id, room_id);
CREATE INDEX idx_hk_tasks_assigned ON hk_tasks(tenant_id, assigned_to);
CREATE INDEX idx_hk_tasks_property ON hk_tasks(tenant_id, property_id);

CREATE INDEX idx_hk_task_photos_task ON hk_task_photos(task_id, uploaded_at);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE hk_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE hk_task_photos ENABLE ROW LEVEL SECURITY;

-- Housekeeping tasks: tenant isolation
CREATE POLICY hk_tasks_tenant_isolation ON hk_tasks
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY hk_tasks_insert_policy ON hk_tasks
  FOR INSERT
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- Housekeeping photos: tenant isolation
CREATE POLICY hk_task_photos_tenant_isolation ON hk_task_photos
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY hk_task_photos_insert_policy ON hk_task_photos
  FOR INSERT
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- ============================================================================
-- TRIGGER: Update updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION update_hk_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER hk_tasks_updated_at
  BEFORE UPDATE ON hk_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_hk_tasks_updated_at();

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('hk_tasks', 'hk_task_photos')
ORDER BY table_name;

-- Verify indexes
SELECT indexname 
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND tablename IN ('hk_tasks', 'hk_task_photos')
ORDER BY indexname;

-- Expected: 2 tables, 6 indexes
