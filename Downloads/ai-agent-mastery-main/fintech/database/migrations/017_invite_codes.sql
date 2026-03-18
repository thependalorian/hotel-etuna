-- Migration 017: User Invite Codes System
-- Location: backend/migrations/017_invite_codes.sql
-- Purpose: Add invite code functionality for user referrals and deep linking
-- Date: 2026-03-16

-- ============================================================================
-- ADD INVITE CODE COLUMN TO USERS TABLE
-- ============================================================================

-- Add invite_code column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS invite_code VARCHAR(10) UNIQUE;

-- Create index for fast invite code lookups
CREATE INDEX IF NOT EXISTS idx_users_invite_code ON users(invite_code) WHERE invite_code IS NOT NULL;

-- Add invited_by column to track who invited the user
ALTER TABLE users ADD COLUMN IF NOT EXISTS invited_by UUID REFERENCES users(id) ON DELETE SET NULL;

-- Create index for invited_by lookups
CREATE INDEX IF NOT EXISTS idx_users_invited_by ON users(invited_by) WHERE invited_by IS NOT NULL;

-- ============================================================================
-- FUNCTION TO GENERATE UNIQUE INVITE CODE
-- ============================================================================

-- Function to generate a random 8-character alphanumeric code
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS VARCHAR(10) AS $$
DECLARE
  code VARCHAR(10);
  code_exists BOOLEAN;
  max_attempts INTEGER := 100;
  attempt INTEGER := 0;
BEGIN
  LOOP
    -- Generate random 8-character code (uppercase letters and numbers)
    code := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 8));
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM users WHERE invite_code = code) INTO code_exists;
    
    -- Exit loop if code is unique
    EXIT WHEN NOT code_exists;
    
    -- Prevent infinite loop
    attempt := attempt + 1;
    IF attempt >= max_attempts THEN
      RAISE EXCEPTION 'Failed to generate unique invite code after % attempts', max_attempts;
    END IF;
  END LOOP;
  
  RETURN code;
END;
$$ LANGUAGE plpgsql VOLATILE;

-- ============================================================================
-- FUNCTION TO AUTO-GENERATE INVITE CODE ON USER CREATION
-- ============================================================================

CREATE OR REPLACE FUNCTION auto_generate_invite_code()
RETURNS TRIGGER AS $$
BEGIN
  -- Only generate invite code if not already set
  IF NEW.invite_code IS NULL THEN
    NEW.invite_code := generate_invite_code();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate invite code when user is created
DROP TRIGGER IF EXISTS trigger_auto_generate_invite_code ON users;
CREATE TRIGGER trigger_auto_generate_invite_code
  BEFORE INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_invite_code();

-- ============================================================================
-- BACKFILL INVITE CODES FOR EXISTING USERS
-- ============================================================================

-- Generate invite codes for existing users who don't have one
UPDATE users 
SET invite_code = generate_invite_code()
WHERE invite_code IS NULL;

-- Migration complete
