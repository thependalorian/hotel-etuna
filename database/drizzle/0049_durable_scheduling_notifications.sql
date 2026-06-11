-- 0049: Durable scheduling & notification infrastructure (Hotel Etuna)
-- Purpose: Cron job durability + notification routing with user preferences

-- Scheduler jobs table (for durable cron execution)
CREATE TABLE IF NOT EXISTS scheduler_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id VARCHAR(255) NOT NULL,
  job_type VARCHAR(100) NOT NULL,
  idempotency_key VARCHAR(255) NOT NULL UNIQUE,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 10,
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  next_attempt_at TIMESTAMP WITH TIME ZONE,
  last_error TEXT,
  completed_at TIMESTAMP WITH TIME ZONE,
  execution_time_ms BIGINT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scheduler_jobs_status_scheduled ON scheduler_jobs(status, scheduled_for)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_scheduler_jobs_tenant_job_type ON scheduler_jobs(tenant_id, job_type);

CREATE INDEX IF NOT EXISTS idx_scheduler_jobs_next_attempt ON scheduler_jobs(next_attempt_at)
  WHERE status = 'pending' AND next_attempt_at IS NOT NULL;

-- Notification history table
CREATE TABLE IF NOT EXISTS notification_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id VARCHAR(255) NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  notification_type VARCHAR(100) NOT NULL,
  channel VARCHAR(50) NOT NULL,
  recipient VARCHAR(255) NOT NULL,
  subject VARCHAR(500),
  content TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  sent_at TIMESTAMP WITH TIME ZONE,
  failed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notification_history_user ON notification_history(tenant_id, user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_history_type_status ON notification_history(notification_type, status);
