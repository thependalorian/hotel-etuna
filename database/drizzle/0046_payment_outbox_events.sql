-- 0046: Transactional outbox for payment side effects (receipt email, notifications)
-- Hotel Etuna single-property OS. Applies idempotently.
-- Run: psql $DATABASE_URL -f database/drizzle/0046_payment_outbox_events.sql

BEGIN;

CREATE TABLE IF NOT EXISTS payment_outbox_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  idempotency_key VARCHAR(255) NOT NULL,
  aggregate_type VARCHAR(50) NOT NULL DEFAULT 'payment_session',
  aggregate_id UUID NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 10,
  last_error TEXT,
  next_attempt_at TIMESTAMPTZ,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT payment_outbox_events_idempotency_key_unique UNIQUE (idempotency_key),
  CONSTRAINT payment_outbox_events_status_check CHECK (
    status IN ('pending', 'processing', 'completed', 'failed')
  )
);

CREATE INDEX IF NOT EXISTS idx_payment_outbox_pending_dispatch
  ON payment_outbox_events (status, next_attempt_at, created_at)
  WHERE status IN ('pending', 'processing');

CREATE INDEX IF NOT EXISTS idx_payment_outbox_aggregate
  ON payment_outbox_events (aggregate_type, aggregate_id);

CREATE INDEX IF NOT EXISTS idx_payment_outbox_tenant
  ON payment_outbox_events (tenant_id);

COMMIT;
