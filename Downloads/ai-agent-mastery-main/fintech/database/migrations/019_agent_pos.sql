-- NamPost RFP: Agent/kiosk POS integration
CREATE TABLE IF NOT EXISTS agent_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_code TEXT NOT NULL UNIQUE,
  agent_name TEXT NOT NULL,
  agent_type TEXT NOT NULL CHECK (agent_type IN ('nampost', 'bank_branch', 'retail', 'atm', 'mobile_agent')),
  latitude NUMERIC(10, 7),
  longitude NUMERIC(10, 7),
  address TEXT,
  region TEXT,
  ussd_code TEXT,
  supports_cashout BOOLEAN NOT NULL DEFAULT true,
  supports_voucher_redeem BOOLEAN NOT NULL DEFAULT true,
  supports_ewallet BOOLEAN NOT NULL DEFAULT false,
  supports_namqr BOOLEAN NOT NULL DEFAULT false,
  pos_terminal_id TEXT,
  api_endpoint TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  operating_hours JSONB DEFAULT '{"mon-fri": "08:00-17:00", "sat": "08:00-13:00"}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_location_geo ON agent_locations(latitude, longitude) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_agent_type ON agent_locations(agent_type, is_active);
