-- 0052: Sofia agent pipeline run telemetry (Hotel Etuna agentic CRM)
-- Purpose: Persist multi-stage pipeline + tool-graph execution metadata (best-effort observability)

CREATE TABLE IF NOT EXISTS sofia_pipeline_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(255) NOT NULL,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  stages JSONB NOT NULL DEFAULT '{}'::jsonb,
  total_ms BIGINT NOT NULL DEFAULT 0,
  status VARCHAR(50) NOT NULL DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sofia_pipeline_runs_session_id
  ON sofia_pipeline_runs(session_id);

CREATE INDEX IF NOT EXISTS idx_sofia_pipeline_runs_tenant_id
  ON sofia_pipeline_runs(tenant_id);

CREATE INDEX IF NOT EXISTS idx_sofia_pipeline_runs_created_at
  ON sofia_pipeline_runs(created_at DESC);
