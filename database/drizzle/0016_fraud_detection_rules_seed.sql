-- Default fraud detection rules per tenant (idempotent — smoke + PSD-12 baseline)
-- Run after 0000 baseline: psql $DATABASE_URL -v ON_ERROR_STOP=1 -f database/drizzle/0016_fraud_detection_rules_seed.sql

INSERT INTO fraud_detection_rules (
  tenant_id,
  rule_name,
  rule_type,
  description,
  conditions,
  action,
  risk_score_impact,
  is_active,
  priority
)
SELECT
  t.id,
  v.rule_name,
  v.rule_type,
  v.description,
  v.conditions::jsonb,
  v.action,
  v.risk_score_impact,
  true,
  v.priority
FROM tenants t
CROSS JOIN (
  VALUES
    (
      'Payment velocity (1h)',
      'velocity',
      'Flag more than 5 card attempts per guest per hour',
      '{"window_minutes":60,"max_attempts":5}'::jsonb,
      'review',
      15.00,
      1
    ),
    (
      'High amount NAD',
      'amount',
      'Single payment above NAD 50,000 requires review',
      '{"currency":"NAD","max_amount":50000}'::jsonb,
      'block',
      25.00,
      2
    ),
    (
      'Geo mismatch',
      'geo',
      'Billing country differs from property country',
      '{"check":"billing_vs_property_country"}'::jsonb,
      'review',
      10.00,
      3
    )
) AS v(rule_name, rule_type, description, conditions, action, risk_score_impact, priority)
WHERE NOT EXISTS (
  SELECT 1 FROM fraud_detection_rules f WHERE f.tenant_id = t.id
);
