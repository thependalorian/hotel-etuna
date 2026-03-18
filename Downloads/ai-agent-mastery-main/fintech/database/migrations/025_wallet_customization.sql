-- Migration 025: Wallet Customization
-- Adds support for custom wallet names, types, icons, colors, and descriptions
-- Required for Agentic Copilot wallet management features
-- Date: 2026-03-16

-- Add new columns to wallets table
ALTER TABLE wallets 
  ADD COLUMN IF NOT EXISTS name VARCHAR(50),
  ADD COLUMN IF NOT EXISTS wallet_type VARCHAR(20) DEFAULT 'main',
  ADD COLUMN IF NOT EXISTS icon VARCHAR(50) DEFAULT 'wallet-outline',
  ADD COLUMN IF NOT EXISTS color VARCHAR(7) DEFAULT '#2563eb',
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';

-- Create index for faster wallet queries
CREATE INDEX IF NOT EXISTS idx_wallets_user_status ON wallets(user_id, status);
CREATE INDEX IF NOT EXISTS idx_wallets_type ON wallets(wallet_type);

-- Add check constraint for wallet_type
ALTER TABLE wallets 
  ADD CONSTRAINT chk_wallet_type 
  CHECK (wallet_type IN ('main', 'savings', 'bills', 'emergency', 'travel', 'shopping', 'custom'));

-- Add check constraint for status
ALTER TABLE wallets 
  ADD CONSTRAINT chk_wallet_status 
  CHECK (status IN ('active', 'frozen', 'archived'));

-- Add check constraint for color format (must be hex color)
ALTER TABLE wallets 
  ADD CONSTRAINT chk_wallet_color 
  CHECK (color ~ '^#[0-9A-Fa-f]{6}$');

-- Update existing wallets with default values
UPDATE wallets 
SET 
  name = CASE 
    WHEN currency = 'NAD' THEN 'Main Wallet'
    ELSE currency || ' Wallet'
  END,
  wallet_type = 'main',
  icon = 'wallet-outline',
  color = '#2563eb',
  status = CASE 
    WHEN frozen THEN 'frozen'
    ELSE 'active'
  END
WHERE name IS NULL;

-- Add comment to table
COMMENT ON COLUMN wallets.name IS 'User-defined wallet name (2-50 characters)';
COMMENT ON COLUMN wallets.wallet_type IS 'Wallet category: main, savings, bills, emergency, travel, shopping, custom';
COMMENT ON COLUMN wallets.icon IS 'Ionicon name for wallet display';
COMMENT ON COLUMN wallets.color IS 'Hex color code for wallet theme';
COMMENT ON COLUMN wallets.description IS 'Optional wallet description (max 200 characters)';
COMMENT ON COLUMN wallets.status IS 'Wallet status: active, frozen (proof-of-life), archived (soft delete)';
