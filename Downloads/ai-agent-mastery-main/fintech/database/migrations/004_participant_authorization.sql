-- PSD-6: Clearing & settlement participant authorization
CREATE TABLE IF NOT EXISTS nps_participant_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id TEXT NOT NULL UNIQUE,
  participant_name TEXT NOT NULL,
  participant_type TEXT NOT NULL CHECK (participant_type IN ('bank', 'nbfi', 'emoney', 'tpp', 'aisp', 'pisp')),
  authorization_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (authorization_status IN ('pending', 'authorized', 'suspended', 'revoked')),
  authorized_services TEXT[] NOT NULL DEFAULT '{}',
  authorized_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  bon_reference TEXT,
  namfisa_reference TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO nps_participant_status
  (participant_id, participant_name, participant_type, authorization_status, authorized_services)
VALUES
  ('SMARTPAY-001', 'Smartpay (Ketchup Software Solutions)', 'emoney', 'pending', ARRAY['emoney', 'pis', 'ais'])
ON CONFLICT (participant_id) DO NOTHING;
