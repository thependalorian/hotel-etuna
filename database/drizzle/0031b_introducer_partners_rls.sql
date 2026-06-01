-- Row Level Security for introducers table
-- Note: RLS policies are commented out as they require Supabase-specific roles
-- Application-level security is enforced via withApiAuth middleware and tenant isolation

-- ALTER TABLE introducers ENABLE ROW LEVEL SECURITY;

-- Staff can view all introducers within their tenant
-- CREATE POLICY introducers_tenant_isolation
--   ON introducers
--   FOR ALL
--   TO authenticated
--   USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::UUID);

-- Public directory: anyone can read introducers that are active and opt-in
-- CREATE POLICY introducers_public_directory
--   ON introducers
--   FOR SELECT
--   TO anon, authenticated
--   USING (is_active = TRUE AND show_in_public_directory = TRUE);

-- Security is enforced at the application layer via:
-- 1. withApiAuth middleware for authentication
-- 2. Tenant isolation checks in all API routes
-- 3. Ownership verification for update/delete operations
