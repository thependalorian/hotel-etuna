-- Hotel Etuna CMS Pages & Blocks
-- Migration: 0029
-- Created: June 1, 2026
-- Purpose: Add cms_pages and cms_blocks tables for block editor

CREATE TABLE IF NOT EXISTS cms_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(255) NOT NULL UNIQUE,
  title VARCHAR(500) NOT NULL,
  meta_description TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'draft',
  published_at TIMESTAMP WITH TIME ZONE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS cms_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID NOT NULL REFERENCES cms_pages(id) ON DELETE CASCADE,
  block_type VARCHAR(100) NOT NULL,
  block_order INTEGER NOT NULL DEFAULT 0,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX idx_cms_pages_tenant_id ON cms_pages(tenant_id);
CREATE INDEX idx_cms_pages_slug ON cms_pages(slug);
CREATE INDEX idx_cms_pages_status ON cms_pages(status);
CREATE INDEX idx_cms_blocks_page_id ON cms_blocks(page_id);
CREATE INDEX idx_cms_blocks_order ON cms_blocks(page_id, block_order);

-- Updated_at trigger for cms_pages
CREATE OR REPLACE FUNCTION update_cms_pages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_cms_pages_updated_at
  BEFORE UPDATE ON cms_pages
  FOR EACH ROW
  EXECUTE FUNCTION update_cms_pages_updated_at();

-- Updated_at trigger for cms_blocks
CREATE OR REPLACE FUNCTION update_cms_blocks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_cms_blocks_updated_at
  BEFORE UPDATE ON cms_blocks
  FOR EACH ROW
  EXECUTE FUNCTION update_cms_blocks_updated_at();
