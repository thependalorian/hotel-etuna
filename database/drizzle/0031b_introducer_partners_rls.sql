-- RLS policies for introducer partners

-- Enable RLS on introducers table
ALTER TABLE introducers ENABLE ROW LEVEL SECURITY;

-- Staff can manage introducers within their tenant
CREATE POLICY introducers_tenant_isolation
  ON introducers
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- Public read for active introducers in directory (for /partners page)
CREATE POLICY introducers_public_directory_read
  ON introducers
  FOR SELECT
  USING (
    is_active = true
    AND show_in_public_directory = true
    AND tenant_id = current_setting('app.current_tenant_id', true)::uuid
  );

-- Introducers can view their own stats (if they have a user account linked)
-- This is optional and can be extended later if introducers get portal access
CREATE POLICY introducers_self_view
  ON introducers
  FOR SELECT
  USING (
    email = current_setting('app.current_user_email', true)
  );
