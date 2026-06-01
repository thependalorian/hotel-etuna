-- Hotel Etuna CMS Pages & Blocks RLS Policies
-- Migration: 0029b
-- Created: June 1, 2026
-- Purpose: Row-level security for cms_pages and cms_blocks

-- Enable RLS
ALTER TABLE cms_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_blocks ENABLE ROW LEVEL SECURITY;

-- Staff can create, read, update, delete pages in their tenant
CREATE POLICY cms_pages_staff_full_access ON cms_pages
  FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id FROM users WHERE id = current_setting('app.current_user_id', true)::uuid
    )
  );

-- Public can read published pages
CREATE POLICY cms_pages_public_read ON cms_pages
  FOR SELECT
  USING (status = 'published');

-- Staff can manage blocks for pages they can access
CREATE POLICY cms_blocks_staff_full_access ON cms_blocks
  FOR ALL
  USING (
    page_id IN (
      SELECT id FROM cms_pages WHERE tenant_id IN (
        SELECT tenant_id FROM users WHERE id = current_setting('app.current_user_id', true)::uuid
      )
    )
  );

-- Public can read blocks for published pages
CREATE POLICY cms_blocks_public_read ON cms_blocks
  FOR SELECT
  USING (
    page_id IN (
      SELECT id FROM cms_pages WHERE status = 'published'
    )
  );
