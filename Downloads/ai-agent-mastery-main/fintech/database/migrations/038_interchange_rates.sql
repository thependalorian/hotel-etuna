-- Migration: 038_interchange_rates.sql
-- Purpose: PSD-11 §3.1 - Interchange rate caps (0.25% debit, 0.50% credit)
-- Priority: MEDIUM
-- Date: 2026-03-17

-- ============================================================================
-- INTERCHANGE RATES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS interchange_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Card type
  card_type VARCHAR(20) NOT NULL CHECK (card_type IN ('debit', 'credit', 'prepaid')),
  card_scheme VARCHAR(20) NOT NULL CHECK (card_scheme IN ('visa', 'mastercard', 'namqr', 'other')),
  
  -- Transaction type
  transaction_type VARCHAR(30) NOT NULL CHECK (transaction_type IN (
    'pos_domestic',
    'pos_international',
    'atm_domestic',
    'atm_international',
    'online_domestic',
    'online_international',
    'contactless',
    'qr_code'
  )),
  
  -- Interchange rate (PSD-11 caps: debit 0.25%, credit 0.50%)
  rate_percentage NUMERIC(5,4) NOT NULL CHECK (rate_percentage >= 0),
  rate_fixed_amount NUMERIC(10,2) DEFAULT 0,
  rate_currency CHAR(3) DEFAULT 'NAD',
  
  -- Regulatory cap compliance
  regulatory_cap_percentage NUMERIC(5,4) NOT NULL,
  is_compliant BOOLEAN GENERATED ALWAYS AS (rate_percentage <= regulatory_cap_percentage) STORED,
  
  -- Effective dates
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  effective_to DATE,
  
  -- Issuer/Acquirer
  issuer_bank VARCHAR(100),
  acquirer_bank VARCHAR(100),
  
  -- Metadata
  notes TEXT,
  bon_approval_reference VARCHAR(50),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_interchange_card_type ON interchange_rates(card_type, card_scheme);
CREATE INDEX idx_interchange_effective ON interchange_rates(effective_from, effective_to);
CREATE INDEX idx_interchange_compliant ON interchange_rates(is_compliant) WHERE is_compliant = false;

-- ============================================================================
-- INITIAL INTERCHANGE RATES (PSD-11 COMPLIANT)
-- ============================================================================
INSERT INTO interchange_rates (
  card_type,
  card_scheme,
  transaction_type,
  rate_percentage,
  rate_fixed_amount,
  regulatory_cap_percentage,
  effective_from,
  notes
) VALUES
-- Debit cards (0.25% cap per PSD-11 §3.1)
('debit', 'visa', 'pos_domestic', 0.25, 0, 0.25, CURRENT_DATE, 'PSD-11 compliant: debit card domestic POS'),
('debit', 'mastercard', 'pos_domestic', 0.25, 0, 0.25, CURRENT_DATE, 'PSD-11 compliant: debit card domestic POS'),
('debit', 'visa', 'atm_domestic', 0.20, 2.50, 0.25, CURRENT_DATE, 'Debit ATM: 0.20% + NAD 2.50 fixed'),
('debit', 'mastercard', 'atm_domestic', 0.20, 2.50, 0.25, CURRENT_DATE, 'Debit ATM: 0.20% + NAD 2.50 fixed'),
('debit', 'visa', 'online_domestic', 0.25, 0, 0.25, CURRENT_DATE, 'Debit online: capped at 0.25%'),
('debit', 'mastercard', 'online_domestic', 0.25, 0, 0.25, CURRENT_DATE, 'Debit online: capped at 0.25%'),

-- Credit cards (0.50% cap per PSD-11 §3.1)
('credit', 'visa', 'pos_domestic', 0.50, 0, 0.50, CURRENT_DATE, 'PSD-11 compliant: credit card domestic POS'),
('credit', 'mastercard', 'pos_domestic', 0.50, 0, 0.50, CURRENT_DATE, 'PSD-11 compliant: credit card domestic POS'),
('credit', 'visa', 'online_domestic', 0.50, 0, 0.50, CURRENT_DATE, 'Credit online: capped at 0.50%'),
('credit', 'mastercard', 'online_domestic', 0.50, 0, 0.50, CURRENT_DATE, 'Credit online: capped at 0.50%'),

-- Prepaid cards (treated as debit per PSD-11)
('prepaid', 'visa', 'pos_domestic', 0.25, 0, 0.25, CURRENT_DATE, 'Prepaid treated as debit: 0.25% cap'),
('prepaid', 'mastercard', 'pos_domestic', 0.25, 0, 0.25, CURRENT_DATE, 'Prepaid treated as debit: 0.25% cap'),

-- NamQR (domestic payment standard)
('debit', 'namqr', 'qr_code', 0.20, 0, 0.25, CURRENT_DATE, 'NamQR QR code payments: reduced rate'),
('credit', 'namqr', 'qr_code', 0.40, 0, 0.50, CURRENT_DATE, 'NamQR QR code payments: reduced rate'),

-- Contactless
('debit', 'visa', 'contactless', 0.25, 0, 0.25, CURRENT_DATE, 'Contactless debit: same as regular POS'),
('credit', 'visa', 'contactless', 0.50, 0, 0.50, CURRENT_DATE, 'Contactless credit: same as regular POS')

ON CONFLICT DO NOTHING;

-- ============================================================================
-- INTERCHANGE FEE CALCULATION FUNCTION
-- ============================================================================
CREATE OR REPLACE FUNCTION calculate_interchange_fee(
  p_card_type VARCHAR,
  p_card_scheme VARCHAR,
  p_transaction_type VARCHAR,
  p_amount NUMERIC
) RETURNS NUMERIC(15,2) AS $$
DECLARE
  v_rate RECORD;
  v_fee NUMERIC(15,2);
BEGIN
  -- Get applicable interchange rate
  SELECT rate_percentage, rate_fixed_amount
  INTO v_rate
  FROM interchange_rates
  WHERE card_type = p_card_type
    AND card_scheme = p_card_scheme
    AND transaction_type = p_transaction_type
    AND effective_from <= CURRENT_DATE
    AND (effective_to IS NULL OR effective_to >= CURRENT_DATE)
  ORDER BY effective_from DESC
  LIMIT 1;
  
  IF NOT FOUND THEN
    -- Default to maximum allowed rate if no specific rate configured
    IF p_card_type = 'credit' THEN
      v_rate.rate_percentage := 0.50;
    ELSE
      v_rate.rate_percentage := 0.25;
    END IF;
    v_rate.rate_fixed_amount := 0;
  END IF;
  
  -- Calculate total fee
  v_fee := (p_amount * v_rate.rate_percentage / 100) + v_rate.rate_fixed_amount;
  
  RETURN ROUND(v_fee, 2);
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE TRIGGER update_interchange_rates_updated_at
  BEFORE UPDATE ON interchange_rates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE interchange_rates IS 'PSD-11 §3.1: Interchange rate lookup table with regulatory caps (debit 0.25%, credit 0.50%)';
COMMENT ON FUNCTION calculate_interchange_fee IS 'Calculate interchange fee for a transaction based on card type and transaction type';

-- Migration complete
