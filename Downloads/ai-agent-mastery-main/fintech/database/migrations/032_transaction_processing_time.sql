-- Migration: 032_transaction_processing_time.sql
-- Purpose: PSD-7 §3.1 - Per-transaction processing time tracking
-- Priority: HIGH
-- Date: 2026-03-17

-- Add processing time column to transactions table
ALTER TABLE transactions 
  ADD COLUMN IF NOT EXISTS processing_time_ms INTEGER,
  ADD COLUMN IF NOT EXISTS processing_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS processing_completed_at TIMESTAMPTZ;

-- Create index for performance queries
CREATE INDEX IF NOT EXISTS idx_transactions_processing_time 
  ON transactions(processing_time_ms) 
  WHERE processing_time_ms IS NOT NULL;

-- Create index for slow transaction detection
CREATE INDEX IF NOT EXISTS idx_transactions_slow 
  ON transactions(processing_time_ms DESC, created_at DESC) 
  WHERE processing_time_ms > 2000;

-- View for transaction performance monitoring
CREATE OR REPLACE VIEW vw_transaction_performance AS
SELECT
  DATE(created_at) AS transaction_date,
  type AS transaction_type,
  status,
  COUNT(*) AS transaction_count,
  AVG(processing_time_ms) AS avg_processing_time_ms,
  MIN(processing_time_ms) AS min_processing_time_ms,
  MAX(processing_time_ms) AS max_processing_time_ms,
  PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY processing_time_ms) AS median_processing_time_ms,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY processing_time_ms) AS p95_processing_time_ms,
  PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY processing_time_ms) AS p99_processing_time_ms,
  COUNT(CASE WHEN processing_time_ms > 2000 THEN 1 END) AS slow_transaction_count,
  (COUNT(CASE WHEN processing_time_ms > 2000 THEN 1 END)::NUMERIC / COUNT(*)::NUMERIC * 100) AS slow_transaction_pct
FROM transactions
WHERE processing_time_ms IS NOT NULL
  AND created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(created_at), type, status
ORDER BY transaction_date DESC, transaction_type;

COMMENT ON COLUMN transactions.processing_time_ms IS 'PSD-7 §3.1: Transaction processing time in milliseconds (target: ≤2000ms)';
COMMENT ON VIEW vw_transaction_performance IS 'Daily transaction performance metrics for PSD-7 compliance and KRI calculation';

-- Migration complete
