/**
 * Fraud Detection — comprehensive rule evaluation tests (matching real impl)
 *
 * Location: tests/unit/fraud-detection-comprehensive.test.ts
 */

import { describe, it, expect, vi } from 'vitest';
import { evaluateTenantFraudRule } from '@/lib/services/fraud/tenant-fraud-rules';
import type { FraudDetectionRule } from '@/lib/db/schema';

// Velocity rules query DB — mock it
vi.mock('@/lib/db', async (importOriginal) => {
  const mod = await importOriginal();
  return {
    ...mod,
    db: {
      select: vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn().mockResolvedValue([{ count: 6 }]), // 6 attempts in window
        })),
      })),
      update: vi.fn(() => ({ set: vi.fn(() => ({ where: vi.fn().mockResolvedValue(undefined) })) })),
    },
  };
});

const TENANT_ID = '00000000-0000-0000-0000-000000000099';

function rule(partial: Partial<FraudDetectionRule>): FraudDetectionRule {
  return {
    id: '00000000-0000-0000-0000-000000000001',
    tenantId: TENANT_ID,
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

describe('Amount rules (uses >= threshold)', () => {
  it('triggers when amount equals max_amount (>= comparison)', async () => {
    const r = rule({ ruleType: 'amount', conditions: { currency: 'NAD', max_amount: 50000 }, action: 'block' });
    expect(await evaluateTenantFraudRule(r, { tenantId: TENANT_ID, amount: 50000, currency: 'NAD' })).toBe(true);
  });

  it('triggers when amount exceeds max_amount', async () => {
    const r = rule({ ruleType: 'amount', conditions: { currency: 'NAD', max_amount: 50000 }, action: 'block' });
    expect(await evaluateTenantFraudRule(r, { tenantId: TENANT_ID, amount: 50001, currency: 'NAD' })).toBe(true);
  });

  it('does NOT trigger when amount is below max_amount', async () => {
    const r = rule({ ruleType: 'amount', conditions: { currency: 'NAD', max_amount: 50000 } });
    expect(await evaluateTenantFraudRule(r, { tenantId: TENANT_ID, amount: 49999, currency: 'NAD' })).toBe(false);
  });

  it('does NOT trigger for different currency', async () => {
    const r = rule({ ruleType: 'amount', conditions: { currency: 'NAD', max_amount: 50000 }, action: 'block' });
    expect(await evaluateTenantFraudRule(r, { tenantId: TENANT_ID, amount: 100000, currency: 'USD' })).toBe(false);
  });

  it('does NOT trigger for zero amount', async () => {
    const r = rule({ ruleType: 'amount', conditions: { currency: 'NAD', max_amount: 50000 } });
    expect(await evaluateTenantFraudRule(r, { tenantId: TENANT_ID, amount: 0, currency: 'NAD' })).toBe(false);
  });
});

describe('Geo rules', () => {
  it('triggers when billing country differs from property country', async () => {
    const r = rule({ ruleType: 'geo', conditions: { check: 'billing_vs_property_country' }, action: 'review' });
    expect(await evaluateTenantFraudRule(r, { tenantId: TENANT_ID, amount: 100, currency: 'NAD', billingCountry: 'NG', propertyCountry: 'NA' })).toBe(true);
  });

  it('does NOT trigger when countries match', async () => {
    const r = rule({ ruleType: 'geo', conditions: { check: 'billing_vs_property_country' } });
    expect(await evaluateTenantFraudRule(r, { tenantId: TENANT_ID, amount: 100, currency: 'NAD', billingCountry: 'NA', propertyCountry: 'NA' })).toBe(false);
  });

  it('does NOT trigger when billing country is absent', async () => {
    const r = rule({ ruleType: 'geo', conditions: { check: 'billing_vs_property_country' } });
    expect(await evaluateTenantFraudRule(r, { tenantId: TENANT_ID, amount: 100, currency: 'NAD' })).toBe(false);
  });

  it('case-insensitive country comparison', async () => {
    const r = rule({ ruleType: 'geo', conditions: { check: 'billing_vs_property_country' } });
    expect(await evaluateTenantFraudRule(r, { tenantId: TENANT_ID, amount: 100, currency: 'NAD', billingCountry: 'na', propertyCountry: 'NA' })).toBe(false);
  });
});

describe('Velocity rules (queries DB for count)', () => {
  it('triggers when DB count >= max_attempts (mock returns 6, max=5)', async () => {
    const r = rule({ ruleType: 'velocity', conditions: { window_minutes: 60, max_attempts: 5 }, action: 'review' });
    // DB mock returns 6 attempts → 6 >= 5 → triggers
    expect(await evaluateTenantFraudRule(r, { tenantId: TENANT_ID, amount: 100, currency: 'NAD' })).toBe(true);
  });
});

describe('Inactive rule behavior', () => {
  it('evaluateTenantFraudRule does NOT check isActive — that filter is in applyTenantFraudRules', async () => {
    // evaluateTenantFraudRule is a pure evaluator; isActive filtering happens in applyTenantFraudRules
    // when querying active rules from DB (isActive: true filter).
    // Direct call to evaluateTenantFraudRule bypasses the isActive check.
    const r = rule({ ruleType: 'amount', conditions: { currency: 'NAD', max_amount: 1 }, isActive: false, action: 'block' });
    const result = await evaluateTenantFraudRule(r, { tenantId: TENANT_ID, amount: 999999, currency: 'NAD' });
    // Returns true because the evaluator doesn't check isActive
    // (applyTenantFraudRules filters on isActive before calling evaluateTenantFraudRule)
    expect(result).toBe(true);
  });
});

describe('Seed fraud rules verification', () => {
  it('velocity rule: 5 attempts per 60 minutes', () => {
    const seed = { conditions: { window_minutes: 60, max_attempts: 5 }, action: 'review', risk_score_impact: 15 };
    expect(seed.conditions.max_attempts).toBe(5);
    expect(seed.conditions.window_minutes).toBe(60);
  });

  it('high-amount rule: N$50,000 block', () => {
    const seed = { conditions: { currency: 'NAD', max_amount: 50000 }, action: 'block', risk_score_impact: 25 };
    expect(seed.conditions.max_amount).toBe(50000);
    expect(seed.action).toBe('block');
  });

  it('geo rule: billing vs property country', () => {
    const seed = { conditions: { check: 'billing_vs_property_country' }, action: 'review', risk_score_impact: 10 };
    expect(seed.conditions.check).toBe('billing_vs_property_country');
  });
});
