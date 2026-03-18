-- OBS 2025 §10.3: Dispute resolution
CREATE TABLE IF NOT EXISTS obs_disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  consent_id UUID REFERENCES obs_consents(id),
  dispute_type TEXT NOT NULL CHECK (dispute_type IN (
    'unauthorized_transaction', 'incorrect_data', 'consent_not_revoked',
    'service_unavailable', 'fee_dispute', 'other'
  )),
  priority TEXT NOT NULL DEFAULT 'standard' CHECK (priority IN ('low', 'standard', 'high', 'critical')),
  description TEXT NOT NULL,
  evidence JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'escalated', 'closed')),
  response_deadline TIMESTAMPTZ NOT NULL,
  data_provider_notified_at TIMESTAMPTZ,
  scheme_manager_notified_at TIMESTAMPTZ,
  resolution TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
