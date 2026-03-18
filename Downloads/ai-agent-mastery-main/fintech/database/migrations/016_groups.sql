-- Migration 016: Groups, Group Members, Split Requests, and Group Transactions
-- Location: backend/migrations/016_groups.sql
-- Purpose: Complete group management system for savings circles, split bills, and collective payments
-- Date: 2026-03-16

-- ============================================================================
-- GROUPS TABLE
-- ============================================================================
-- Stores group information (savings circles, split groups, etc.)
CREATE TABLE IF NOT EXISTS groups (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                  VARCHAR(100) NOT NULL,
  description           TEXT,
  wallet_id             UUID REFERENCES wallets(id) ON DELETE CASCADE,
  created_by            UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  member_count          INTEGER NOT NULL DEFAULT 1,
  status                VARCHAR(20) NOT NULL DEFAULT 'active',
  
  -- Group settings
  settings              JSONB DEFAULT '{}',
  
  -- Metadata
  metadata              JSONB DEFAULT '{}',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_groups_created_by ON groups(created_by);
CREATE INDEX idx_groups_status ON groups(status);
CREATE INDEX idx_groups_wallet_id ON groups(wallet_id);
CREATE INDEX idx_groups_created_at ON groups(created_at DESC);

-- ============================================================================
-- GROUP MEMBERS TABLE
-- ============================================================================
-- Tracks membership in groups with roles and status
CREATE TABLE IF NOT EXISTS group_members (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id              UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id               UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role                  VARCHAR(20) NOT NULL DEFAULT 'member',
  status                VARCHAR(20) NOT NULL DEFAULT 'active',
  
  -- Invitation tracking
  invited_by            UUID REFERENCES users(id) ON DELETE SET NULL,
  invited_at            TIMESTAMPTZ,
  joined_at             TIMESTAMPTZ DEFAULT NOW(),
  
  -- Metadata
  metadata              JSONB DEFAULT '{}',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Unique constraint: user can only be member once per group
  UNIQUE(group_id, user_id)
);

CREATE INDEX idx_group_members_group ON group_members(group_id, status);
CREATE INDEX idx_group_members_user ON group_members(user_id, status);
CREATE INDEX idx_group_members_role ON group_members(role);
CREATE INDEX idx_group_members_invited_by ON group_members(invited_by);

-- ============================================================================
-- SPLIT REQUESTS TABLE
-- ============================================================================
-- Tracks bill splitting requests within groups
CREATE TABLE IF NOT EXISTS split_requests (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id              UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  created_by            UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Split details
  title                 VARCHAR(200) NOT NULL,
  description           TEXT,
  total_amount          NUMERIC(14,2) NOT NULL CHECK (total_amount > 0),
  currency              CHAR(3) NOT NULL DEFAULT 'NAD',
  
  -- Split configuration
  split_type            VARCHAR(20) NOT NULL DEFAULT 'equal',
  
  -- Status tracking
  status                VARCHAR(20) NOT NULL DEFAULT 'pending',
  completed_at          TIMESTAMPTZ,
  cancelled_at          TIMESTAMPTZ,
  
  -- Metadata
  metadata              JSONB DEFAULT '{}',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_split_requests_group ON split_requests(group_id, status);
CREATE INDEX idx_split_requests_created_by ON split_requests(created_by);
CREATE INDEX idx_split_requests_status ON split_requests(status);
CREATE INDEX idx_split_requests_created_at ON split_requests(created_at DESC);

-- ============================================================================
-- SPLIT SHARES TABLE
-- ============================================================================
-- Individual shares for each member in a split request
CREATE TABLE IF NOT EXISTS split_shares (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  split_request_id      UUID NOT NULL REFERENCES split_requests(id) ON DELETE CASCADE,
  user_id               UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Share details
  share_amount          NUMERIC(14,2) NOT NULL CHECK (share_amount >= 0),
  currency              CHAR(3) NOT NULL DEFAULT 'NAD',
  
  -- Payment tracking
  status                VARCHAR(20) NOT NULL DEFAULT 'pending',
  paid_at               TIMESTAMPTZ,
  transaction_id        UUID REFERENCES transactions(id) ON DELETE SET NULL,
  
  -- Metadata
  metadata              JSONB DEFAULT '{}',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Unique constraint: one share per user per split
  UNIQUE(split_request_id, user_id)
);

CREATE INDEX idx_split_shares_split_request ON split_shares(split_request_id, status);
CREATE INDEX idx_split_shares_user ON split_shares(user_id, status);
CREATE INDEX idx_split_shares_status ON split_shares(status);
CREATE INDEX idx_split_shares_transaction ON split_shares(transaction_id) WHERE transaction_id IS NOT NULL;

-- ============================================================================
-- GROUP TRANSACTIONS TABLE
-- ============================================================================
-- Records all financial activities within groups
CREATE TABLE IF NOT EXISTS group_transactions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id              UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  transaction_id        UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  
  -- Transaction classification
  transaction_type      VARCHAR(50) NOT NULL,
  
  -- Actors
  performed_by          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  affected_user         UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Amounts
  amount                NUMERIC(14,2) NOT NULL,
  currency              CHAR(3) NOT NULL DEFAULT 'NAD',
  
  -- Description and metadata
  description           TEXT,
  metadata              JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_group_transactions_group ON group_transactions(group_id, created_at DESC);
CREATE INDEX idx_group_transactions_transaction ON group_transactions(transaction_id);
CREATE INDEX idx_group_transactions_performed_by ON group_transactions(performed_by);
CREATE INDEX idx_group_transactions_type ON group_transactions(transaction_type);

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================

-- Trigger for groups table
CREATE TRIGGER update_groups_updated_at
  BEFORE UPDATE ON groups
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for group_members table
CREATE TRIGGER update_group_members_updated_at
  BEFORE UPDATE ON group_members
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for split_requests table
CREATE TRIGGER update_split_requests_updated_at
  BEFORE UPDATE ON split_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for split_shares table
CREATE TRIGGER update_split_shares_updated_at
  BEFORE UPDATE ON split_shares
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- UTILITY FUNCTIONS
-- ============================================================================

-- Function to update group member count
CREATE OR REPLACE FUNCTION update_group_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'active' THEN
    UPDATE groups 
    SET member_count = member_count + 1 
    WHERE id = NEW.group_id;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status = 'active' AND NEW.status != 'active' THEN
      UPDATE groups 
      SET member_count = member_count - 1 
      WHERE id = NEW.group_id;
    ELSIF OLD.status != 'active' AND NEW.status = 'active' THEN
      UPDATE groups 
      SET member_count = member_count + 1 
      WHERE id = NEW.group_id;
    END IF;
  ELSIF TG_OP = 'DELETE' AND OLD.status = 'active' THEN
    UPDATE groups 
    SET member_count = member_count - 1 
    WHERE id = OLD.group_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically maintain group member count
CREATE TRIGGER maintain_group_member_count
  AFTER INSERT OR UPDATE OR DELETE ON group_members
  FOR EACH ROW
  EXECUTE FUNCTION update_group_member_count();

-- Migration complete
