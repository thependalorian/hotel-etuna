-- Migration: 041_bon_reporting_queue.sql
-- Purpose: PSD-8 §5.1 - Automated BoN regulatory reporting queue
-- Priority: HIGH
-- Date: 2026-03-17

-- ============================================================================
-- BON REPORTING QUEUE TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS bon_reporting_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Report identification
  report_type VARCHAR(50) NOT NULL CHECK (report_type IN (
    'monthly_kri',                      -- Monthly Key Risk Indicators
    'monthly_sla',                      -- Monthly SLA compliance
    'monthly_uptime',                   -- System uptime report
    'monthly_emoney_float',             -- E-money float reconciliation
    'monthly_obs_usage',                -- OBS API usage statistics
    'monthly_transaction_volume',       -- Transaction volume and value
    'quarterly_compliance',             -- Quarterly compliance summary
    'incident_notification',            -- Critical security incident (immediate)
    'violation_notification',           -- Compliance violation notification
    'penalty_status',                   -- Penalty payment status update
    'trust_account_variance',           -- Material trust account variance (immediate)
    'license_renewal',                  -- Annual license renewal application
    'annual_audit',                     -- Annual financial audit report
    'ad_hoc_request'                    -- Ad-hoc regulatory request
  )),
  
  -- Report details
  report_title VARCHAR(200) NOT NULL,
  reporting_period_start DATE,
  reporting_period_end DATE,
  reporting_month VARCHAR(7),  -- Format: YYYY-MM
  
  -- Status
  status VARCHAR(30) NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',              -- Queued for generation
    'generating',           -- Report being generated
    'review_required',      -- Awaiting internal review
    'approved',             -- Approved for submission
    'submitting',           -- Being submitted to BoN
    'submitted',            -- Successfully submitted
    'acknowledged',         -- BoN acknowledged receipt
    'failed',               -- Submission failed
    'cancelled'             -- Report cancelled
  )),
  
  -- Priority and deadlines
  priority VARCHAR(20) NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'critical')),
  due_date DATE NOT NULL,
  is_overdue BOOLEAN GENERATED ALWAYS AS (due_date < CURRENT_DATE AND status NOT IN ('submitted', 'acknowledged', 'cancelled')) STORED,
  
  -- Report content
  report_data JSONB NOT NULL DEFAULT '{}',
  report_summary TEXT,
  attachments TEXT[],
  
  -- BoN submission
  bon_submission_method VARCHAR(30) CHECK (bon_submission_method IN ('email', 'portal', 'api', 'courier', 'hand_delivery')),
  bon_submission_reference VARCHAR(100),
  bon_acknowledgement_reference VARCHAR(100),
  bon_contact_person VARCHAR(100),
  
  -- Review and approval
  generated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  generated_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  submitted_by UUID REFERENCES users(id) ON DELETE SET NULL,
  submitted_at TIMESTAMPTZ,
  acknowledged_at TIMESTAMPTZ,
  
  -- Failure handling
  failure_reason TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  last_retry_at TIMESTAMPTZ,
  next_retry_at TIMESTAMPTZ,
  
  -- Related entities
  related_incident_ids UUID[],
  related_violation_ids UUID[],
  related_penalty_ids UUID[],
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_bon_queue_status ON bon_reporting_queue(status, due_date);
CREATE INDEX idx_bon_queue_type ON bon_reporting_queue(report_type, reporting_month DESC);
CREATE INDEX idx_bon_queue_overdue ON bon_reporting_queue(is_overdue, due_date) WHERE is_overdue = true;
CREATE INDEX idx_bon_queue_pending ON bon_reporting_queue(priority DESC, due_date ASC) 
  WHERE status IN ('pending', 'generating', 'review_required', 'approved');

-- ============================================================================
-- REPORT GENERATION HISTORY TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS bon_report_generation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES bon_reporting_queue(id) ON DELETE CASCADE,
  
  -- Generation attempt
  generation_attempt INTEGER NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  
  -- Status
  generation_status VARCHAR(20) CHECK (generation_status IN ('started', 'completed', 'failed')),
  
  -- Performance
  duration_seconds INTEGER,
  data_points_processed INTEGER,
  
  -- Errors
  error_message TEXT,
  error_stack TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_bon_gen_history_report ON bon_report_generation_history(report_id, started_at DESC);

-- ============================================================================
-- VIEWS
-- ============================================================================

-- Pending reports requiring action
CREATE OR REPLACE VIEW vw_bon_reports_pending AS
SELECT
  id,
  report_type,
  report_title,
  reporting_month,
  status,
  priority,
  due_date,
  CURRENT_DATE - due_date AS days_overdue,
  generated_by,
  generated_at
FROM bon_reporting_queue
WHERE status IN ('pending', 'generating', 'review_required', 'approved', 'submitting')
ORDER BY
  CASE priority
    WHEN 'critical' THEN 1
    WHEN 'high' THEN 2
    WHEN 'normal' THEN 3
    ELSE 4
  END,
  due_date ASC;

-- Monthly reporting schedule
CREATE OR REPLACE VIEW vw_bon_monthly_reporting_schedule AS
SELECT
  reporting_month,
  report_type,
  COUNT(*) AS report_count,
  MIN(due_date) AS earliest_due_date,
  MAX(due_date) AS latest_due_date,
  COUNT(CASE WHEN status = 'submitted' THEN 1 END) AS submitted_count,
  COUNT(CASE WHEN status IN ('pending', 'generating') THEN 1 END) AS pending_count,
  COUNT(CASE WHEN is_overdue THEN 1 END) AS overdue_count
FROM bon_reporting_queue
WHERE reporting_month >= TO_CHAR(CURRENT_DATE - INTERVAL '6 months', 'YYYY-MM')
GROUP BY reporting_month, report_type
ORDER BY reporting_month DESC, report_type;

-- ============================================================================
-- FUNCTION: Auto-schedule recurring reports
-- ============================================================================

CREATE OR REPLACE FUNCTION schedule_monthly_bon_reports(p_month VARCHAR(7) DEFAULT NULL)
RETURNS INTEGER AS $$
DECLARE
  v_month VARCHAR(7);
  v_month_start DATE;
  v_month_end DATE;
  v_reports_created INTEGER := 0;
BEGIN
  -- Default to next month if not specified
  v_month := COALESCE(p_month, TO_CHAR(CURRENT_DATE + INTERVAL '1 month', 'YYYY-MM'));
  v_month_start := (v_month || '-01')::DATE;
  v_month_end := (v_month_start + INTERVAL '1 month' - INTERVAL '1 day')::DATE;
  
  -- Monthly KRI report (due 5th of following month)
  INSERT INTO bon_reporting_queue (report_type, report_title, reporting_period_start, reporting_period_end, reporting_month, due_date, priority)
  VALUES (
    'monthly_kri',
    'Monthly Key Risk Indicators Report - ' || v_month,
    v_month_start,
    v_month_end,
    v_month,
    (v_month_start + INTERVAL '1 month' + INTERVAL '5 days')::DATE,
    'high'
  )
  ON CONFLICT DO NOTHING;
  v_reports_created := v_reports_created + 1;
  
  -- Monthly SLA report (due 7th of following month)
  INSERT INTO bon_reporting_queue (report_type, report_title, reporting_period_start, reporting_period_end, reporting_month, due_date, priority)
  VALUES (
    'monthly_sla',
    'Monthly SLA Compliance Report - ' || v_month,
    v_month_start,
    v_month_end,
    v_month,
    (v_month_start + INTERVAL '1 month' + INTERVAL '7 days')::DATE,
    'high'
  )
  ON CONFLICT DO NOTHING;
  v_reports_created := v_reports_created + 1;
  
  -- Monthly e-money float reconciliation (due 3rd of following month)
  INSERT INTO bon_reporting_queue (report_type, report_title, reporting_period_start, reporting_period_end, reporting_month, due_date, priority)
  VALUES (
    'monthly_emoney_float',
    'E-Money Float Reconciliation - ' || v_month,
    v_month_start,
    v_month_end,
    v_month,
    (v_month_start + INTERVAL '1 month' + INTERVAL '3 days')::DATE,
    'critical'
  )
  ON CONFLICT DO NOTHING;
  v_reports_created := v_reports_created + 1;
  
  -- Monthly OBS usage report (due 10th of following month)
  INSERT INTO bon_reporting_queue (report_type, report_title, reporting_period_start, reporting_period_end, reporting_month, due_date, priority)
  VALUES (
    'monthly_obs_usage',
    'Open Banking API Usage Report - ' || v_month,
    v_month_start,
    v_month_end,
    v_month,
    (v_month_start + INTERVAL '1 month' + INTERVAL '10 days')::DATE,
    'normal'
  )
  ON CONFLICT DO NOTHING;
  v_reports_created := v_reports_created + 1;
  
  -- Monthly transaction volume (due 5th of following month)
  INSERT INTO bon_reporting_queue (report_type, report_title, reporting_period_start, reporting_period_end, reporting_month, due_date, priority)
  VALUES (
    'monthly_transaction_volume',
    'Transaction Volume and Value Report - ' || v_month,
    v_month_start,
    v_month_end,
    v_month,
    (v_month_start + INTERVAL '1 month' + INTERVAL '5 days')::DATE,
    'normal'
  )
  ON CONFLICT DO NOTHING;
  v_reports_created := v_reports_created + 1;
  
  RETURN v_reports_created;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE TRIGGER update_bon_queue_updated_at
  BEFORE UPDATE ON bon_reporting_queue
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- INITIAL SETUP: Schedule reports for current month
-- ============================================================================

SELECT schedule_monthly_bon_reports(TO_CHAR(CURRENT_DATE, 'YYYY-MM'));

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE bon_reporting_queue IS 'PSD-8 §5.1: Automated BoN regulatory reporting queue with retry logic and audit trail';
COMMENT ON TABLE bon_report_generation_history IS 'History of report generation attempts for troubleshooting';
COMMENT ON VIEW vw_bon_reports_pending IS 'Pending reports requiring generation, review, or submission';
COMMENT ON VIEW vw_bon_monthly_reporting_schedule IS 'Monthly reporting schedule with submission status';
COMMENT ON FUNCTION schedule_monthly_bon_reports IS 'Auto-schedule recurring monthly BoN reports (run at end of each month)';

-- Migration complete
