-- PSD-12: Agentic-layer cybersecurity (copilot security events)
CREATE TABLE IF NOT EXISTS copilot_security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  session_id TEXT,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'prompt_injection_attempt', 'tool_abuse', 'rate_limit_exceeded',
    'suspicious_tool_chain', 'pii_in_prompt', 'anomalous_amount', 'repeated_failure'
  )),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  tool_name TEXT,
  prompt_snippet TEXT,
  details JSONB DEFAULT '{}',
  auto_blocked BOOLEAN NOT NULL DEFAULT false,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_copilot_security_user ON copilot_security_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_copilot_security_type ON copilot_security_events(event_type);
