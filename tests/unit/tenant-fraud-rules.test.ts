/**
 * Tenant fraud_detection_rules evaluator (0016 conditions JSON).
 * Location: tests/unit/tenant-fraud-rules.test.ts
 */

import { describe, expect, it } from 'vitest';
import { evaluateTenantFraudRule } from '@/lib/services/fraud/tenant-fraud-rules';
import type { FraudDetectionRule } from '@/lib/db/schema';

function rule(partial: Partial<FraudDetectionRule>): FraudDetectionRule {
  return {
    id: '00000000-0000-0000-0000-000000000001',
    tenantId: '00000000-0000-0000-0000-000000000099',
    ruleName: 'test',
    ruleType: 'amount',
    description: null,
    conditions: {},
    thresholdValue: null,
    thresholdOperator: null,
    action: 'review',
    riskScoreImpact: '10',
    isActive: true,
    priority: 1,
    triggerCount: 0,
    truePositiveCount: 0,
    falsePositiveCount: 0,
    accuracyRate: null,
    createdBy: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...partial,
  } as FraudDetectionRule;
}

describe('evaluateTenantFraudRule', () => {
  it('matches amount rule when amount exceeds max_amount', async () => {
    const matched = await evaluateTenantFraudRule(
      rule({
        ruleType: 'amount',
        conditions: { currency: 'NAD', max_amount: 50000 },
        action: 'block',
      }),
      { tenantId: 't', amount: 50001, currency: 'NAD' },
    );
    expect(matched).toBe(true);
  });

  it('does not match amount rule below threshold', async () => {
    const matched = await evaluateTenantFraudRule(
      rule({
        ruleType: 'amount',
        conditions: { currency: 'NAD', max_amount: 50000 },
      }),
      { tenantId: 't', amount: 1000, currency: 'NAD' },
    );
    expect(matched).toBe(false);
  });

  it('matches geo rule when billing country differs from property', async () => {
    const matched = await evaluateTenantFraudRule(
      rule({
        ruleType: 'geo',
        conditions: { check: 'billing_vs_property_country' },
      }),
      {
        tenantId: 't',
        amount: 100,
        currency: 'NAD',
        billingCountry: 'ZA',
        propertyCountry: 'NA',
      },
    );
    expect(matched).toBe(true);
  });

  it('treats geographic alias like geo', async () => {
    const matched = await evaluateTenantFraudRule(
      rule({
        ruleType: 'geographic',
        conditions: { check: 'billing_vs_property_country' },
      }),
      {
        tenantId: 't',
        amount: 100,
        currency: 'NAD',
        billingCountry: 'US',
        propertyCountry: 'NA',
      },
    );
    expect(matched).toBe(true);
  });
});
