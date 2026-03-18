-- Migration: 040_penalty_tracking.sql
-- Purpose: PSD-8 §4.1 - Enhanced penalty lifecycle tracking (issuance, appeal, payment, resolution)
-- Priority: MEDIUM
-- Date: 2026-03-17

-- ============================================================================
-- PENALTY TRACKING TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS penalty_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Link to violation
  violation_id UUID NOT NULL REFERENCES compliance_violations(id) ON DELETE RESTRICT,
  
  -- Penalty identification
  penalty_reference VARCHAR(50) NOT NULL UNIQUE,
  bon_penalty_notice VARCHAR(50),
  
  -- Penalty details
  penalty_type VARCHAR(30) NOT NULL CHECK (penalty_type IN (
    'financial',           -- Monetary fine
    'warning',             -- Formal warning
    'license_suspension',  -- Temporary license suspension
    'license_revocation',  -- Permanent license revocation
    'operational_restriction',  -- Operating restrictions
    'public_censure'       -- Public disclosure of violation
  )),
  penalty_amount NUMERIC(15,2) CHECK (penalty_amount >= 0),
  penalty_currency CHAR(3) DEFAULT 'NAD',
  
  -- Status lifecycle
  status VARCHAR(30) NOT NULL DEFAULT 'issued' CHECK (status IN (
    'issued',              -- Penalty notice issued by BoN
    'acknowledged',        -- Smartpay acknowledged receipt
    'appealed',            -- Smartpay filed appeal
    'appeal_pending',      -- Appeal under review
    'appeal_accepted',     -- Appeal accepted, penalty reduced/waived
    'appeal_rejected',     -- Appeal rejected, penalty stands
    'payment_scheduled',   -- Payment plan arranged
    'partially_paid',      -- Partial payment made
    'fully_paid',          -- Penalty paid in full
    'waived',              -- Penalty waived by BoN
    'overdue',             -- Payment overdue
    'escalated'            -- Escalated for enforcement
  )),
  
  -- Important dates
  issued_date DATE NOT NULL,
  acknowledged_date DATE,
  due_date DATE NOT NULL,
  paid_date DATE,
  
  -- Payment tracking
  total_amount_due NUMERIC(15,2) NOT NULL,
  amount_paid NUMERIC(15,2) DEFAULT 0 CHECK (amount_paid >= 0),
  amount_outstanding NUMERIC(15,2) GENERATED ALWAYS AS (total_amount_due - amount_paid) STORED,
  
  -- Payment plan
  payment_plan_approved BOOLEAN DEFAULT false,
  installment_count INTEGER,
  next_installment_due DATE,
  next_installment_amount NUMERIC(15,2),
  
  -- Appeal details
  appeal_filed_date DATE,
  appeal_reason TEXT,
  appeal_supporting_documents TEXT[],
  appeal_hearing_date DATE,
  appeal_decision_date DATE,
  appeal_outcome TEXT,
  original_penalty_amount NUMERIC(15,2),
  reduced_penalty_amount NUMERIC(15,2),
  
  -- BoN communication
  bon_contact_person VARCHAR(100),
  bon_contact_email VARCHAR(255),
  bon_case_officer VARCHAR(100),
  
  -- Internal tracking
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  
  -- Compliance impact
  impacts_license BOOLEAN NOT NULL DEFAULT false,
  impacts_operations BOOLEAN NOT NULL DEFAULT false,
  public_disclosure_required BOOLEAN NOT NULL DEFAULT false,
  disclosure_date DATE,
  
  -- Metadata
  notes TEXT,
  internal_comments TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_penalty_violation ON penalty_tracking(violation_id);
CREATE INDEX idx_penalty_status ON penalty_tracking(status, due_date);
CREATE INDEX idx_penalty_overdue ON penalty_tracking(due_date, status) 
  WHERE status IN ('issued', 'acknowledged', 'payment_scheduled', 'partially_paid') AND due_date < CURRENT_DATE;
CREATE INDEX idx_penalty_assigned ON penalty_tracking(assigned_to, status);

-- ============================================================================
-- PENALTY PAYMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS penalty_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  penalty_id UUID NOT NULL REFERENCES penalty_tracking(id) ON DELETE CASCADE,
  
  -- Payment details
  payment_amount NUMERIC(15,2) NOT NULL CHECK (payment_amount > 0),
  payment_currency CHAR(3) DEFAULT 'NAD',
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Payment method
  payment_method VARCHAR(30) CHECK (payment_method IN (
    'bank_transfer',
    'cheque',
    'debit_order',
    'cash',
    'offset'  -- Offset against refund or credit
  )),
  payment_reference VARCHAR(100),
  
  -- Bank details
  bank_name VARCHAR(100),
  account_number VARCHAR(34),
  transaction_reference VARCHAR(100),
  
  -- Status
  payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN (
    'pending',
    'clearing',
    'confirmed',
    'failed',
    'reversed'
  )),
  confirmed_by_bon BOOLEAN DEFAULT false,
  confirmed_date DATE,
  
  -- Metadata
  notes TEXT,
  recorded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_penalty_payments_penalty ON penalty_payments(penalty_id, payment_date DESC);
CREATE INDEX idx_penalty_payments_status ON penalty_payments(payment_status, payment_date DESC);

-- ============================================================================
-- PENALTY STATUS HISTORY TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS penalty_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  penalty_id UUID NOT NULL REFERENCES penalty_tracking(id) ON DELETE CASCADE,
  
  -- Status change
  previous_status VARCHAR(30),
  new_status VARCHAR(30) NOT NULL,
  
  -- Change details
  changed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  change_reason TEXT,
  notes TEXT,
  
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_penalty_history_penalty ON penalty_status_history(penalty_id, changed_at DESC);

-- ============================================================================
-- VIEWS
-- ============================================================================

-- Outstanding penalties requiring action
CREATE OR REPLACE VIEW vw_outstanding_penalties AS
SELECT
  p.id,
  p.penalty_reference,
  v.violation_type,
  v.psd_reference,
  p.penalty_amount,
  p.total_amount_due,
  p.amount_paid,
  p.amount_outstanding,
  p.status,
  p.due_date,
  CURRENT_DATE - p.due_date AS days_overdue,
  p.priority,
  p.assigned_to,
  p.impacts_license,
  p.impacts_operations
FROM penalty_tracking p
JOIN compliance_violations v ON p.violation_id = v.id
WHERE p.status IN ('issued', 'acknowledged', 'payment_scheduled', 'partially_paid', 'overdue')
  AND p.amount_outstanding > 0
ORDER BY p.due_date ASC, p.priority DESC;

-- Penalty summary by status
CREATE OR REPLACE VIEW vw_penalty_summary AS
SELECT
  status,
  COUNT(*) AS penalty_count,
  SUM(total_amount_due) AS total_amount_due,
  SUM(amount_paid) AS total_amount_paid,
  SUM(amount_outstanding) AS total_outstanding,
  COUNT(CASE WHEN due_date < CURRENT_DATE AND amount_outstanding > 0 THEN 1 END) AS overdue_count
FROM penalty_tracking
GROUP BY status
ORDER BY 
  CASE status
    WHEN 'overdue' THEN 1
    WHEN 'issued' THEN 2
    WHEN 'partially_paid' THEN 3
    ELSE 4
  END;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE TRIGGER update_penalty_tracking_updated_at
  BEFORE UPDATE ON penalty_tracking
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Auto-update status when fully paid
CREATE OR REPLACE FUNCTION auto_update_penalty_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Mark as fully paid when amount paid equals total due
  IF NEW.amount_paid >= NEW.total_amount_due AND OLD.status != 'fully_paid' THEN
    NEW.status := 'fully_paid';
    NEW.paid_date := CURRENT_DATE;
  -- Mark as overdue if past due date
  ELSIF NEW.due_date < CURRENT_DATE AND NEW.amount_outstanding > 0 AND NEW.status NOT IN ('fully_paid', 'waived') THEN
    NEW.status := 'overdue';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_update_penalty_status
  BEFORE UPDATE ON penalty_tracking
  FOR EACH ROW
  EXECUTE FUNCTION auto_update_penalty_status();

-- Track status changes
CREATE OR REPLACE FUNCTION log_penalty_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status != NEW.status THEN
    INSERT INTO penalty_status_history (penalty_id, previous_status, new_status, changed_by)
    VALUES (NEW.id, OLD.status, NEW.status, NEW.assigned_to);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_penalty_status_change
  AFTER UPDATE ON penalty_tracking
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION log_penalty_status_change();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE penalty_tracking IS 'PSD-8 §4.1: Comprehensive penalty lifecycle tracking (issuance, appeal, payment, resolution)';
COMMENT ON TABLE penalty_payments IS 'Individual payment records for penalties (supports installment payments)';
COMMENT ON TABLE penalty_status_history IS 'Audit trail of penalty status changes';
COMMENT ON VIEW vw_outstanding_penalties IS 'Active penalties requiring payment or action';
COMMENT ON VIEW vw_penalty_summary IS 'Summary of penalties by status for management dashboard';

-- Migration complete
