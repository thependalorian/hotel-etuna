-- PSD-8: Administrative penalty monitoring
CREATE TABLE IF NOT EXISTS compliance_violations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  violation_type TEXT NOT NULL,
  psd_reference TEXT NOT NULL,
  description TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('minor', 'moderate', 'serious', 'critical')),
  detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reporting_deadline TIMESTAMPTZ,
  reported_to_bon BOOLEAN NOT NULL DEFAULT false,
  reported_at TIMESTAMPTZ,
  penalty_amount NUMERIC(15,2),
  penalty_paid BOOLEAN DEFAULT false,
  remediation_action TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
