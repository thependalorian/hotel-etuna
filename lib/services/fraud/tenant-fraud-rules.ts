/**
 * Tenant fraud_detection_rules evaluator (migration 0016 seed + admin rules).
 * Shared by PsdFraudGate (payment initiate) and FraudDetectionService (analyze API).
 * Location: lib/services/fraud/tenant-fraud-rules.ts
 */

import { db, fraudDetectionRules, transactions } from '@/lib/db';
import { and, asc, eq, gte, sql } from 'drizzle-orm';
import type { FraudDetectionRule } from '@/lib/db/schema';

export type TenantRuleAction = 'block' | 'review' | 'decline' | 'flag' | 'alert';

export interface TenantRuleEvaluationContext {
  tenantId: string;
  userId?: string;
  amount: number;
  currency: string;
  billingCountry?: string;
  propertyCountry?: string;
}

export interface TenantRuleEvaluationResult {
  matchedRules: string[];
  blocked: boolean;
  requiresReview: boolean;
  riskScoreDelta: number;
  reasons: string[];
}

type RuleConditions = Record<string, unknown>;

function asRecord(value: unknown): RuleConditions {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as RuleConditions)
    : {};
}

async function countAttemptsInWindow(
  tenantId: string,
  userId: string | undefined,
  windowMinutes: number,
): Promise<number> {
  const since = new Date(Date.now() - windowMinutes * 60 * 1000);
  const conditions = [
    eq(transactions.tenantId, tenantId),
    gte(transactions.createdAt, since),
  ];
  if (userId) {
    conditions.push(eq(transactions.guestId, userId));
  }
  const rows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(transactions)
    .where(and(...conditions));
  return Number(rows[0]?.count ?? 0);
}

export async function evaluateTenantFraudRule(
  rule: FraudDetectionRule,
  ctx: TenantRuleEvaluationContext,
): Promise<boolean> {
  const conditions = asRecord(rule.conditions);
  const ruleType = (rule.ruleType || '').toLowerCase();

  if (ruleType === 'velocity') {
    const windowMinutes = Number(conditions.window_minutes ?? 60);
    const maxAttempts = Number(conditions.max_attempts ?? 5);
    const count = await countAttemptsInWindow(ctx.tenantId, ctx.userId, windowMinutes);
    return count >= maxAttempts;
  }

  if (ruleType === 'amount') {
    const currency = String(conditions.currency ?? ctx.currency).toUpperCase();
    const maxAmount = Number(conditions.max_amount ?? rule.thresholdValue ?? 0);
    if (currency && ctx.currency.toUpperCase() !== currency) return false;
    return maxAmount > 0 && ctx.amount >= maxAmount;
  }

  if (ruleType === 'geo' || ruleType === 'geographic') {
    const check = String(conditions.check ?? '');
    if (check === 'billing_vs_property_country') {
      const billing = (ctx.billingCountry || '').trim().toUpperCase();
      const property = (ctx.propertyCountry || 'NA').trim().toUpperCase();
      if (!billing) return false;
      return billing !== property;
    }
  }

  if (ruleType === 'device' || ruleType === 'behavioral' || ruleType === 'behavior') {
    const threshold = Number(rule.thresholdValue ?? 50);
    return threshold > 0 && Number(rule.riskScoreImpact ?? 0) >= threshold;
  }

  return false;
}

function actionToFlags(action: string): { blocked: boolean; requiresReview: boolean } {
  const a = action.toLowerCase();
  if (a === 'block' || a === 'decline') {
    return { blocked: true, requiresReview: false };
  }
  if (a === 'review' || a === 'flag') {
    return { blocked: false, requiresReview: true };
  }
  return { blocked: false, requiresReview: false };
}

export async function applyTenantFraudRules(
  ctx: TenantRuleEvaluationContext,
): Promise<TenantRuleEvaluationResult> {
  const result: TenantRuleEvaluationResult = {
    matchedRules: [],
    blocked: false,
    requiresReview: false,
    riskScoreDelta: 0,
    reasons: [],
  };

  if (!ctx.tenantId) return result;

  const rules = await db
    .select()
    .from(fraudDetectionRules)
    .where(
      and(
        eq(fraudDetectionRules.tenantId, ctx.tenantId),
        eq(fraudDetectionRules.isActive, true),
      ),
    )
    .orderBy(asc(fraudDetectionRules.priority));

  for (const rule of rules) {
    const matched = await evaluateTenantFraudRule(rule, ctx);
    if (!matched) continue;

    result.matchedRules.push(rule.ruleName);
    result.riskScoreDelta += Number(rule.riskScoreImpact ?? 0);
    result.reasons.push(rule.description || rule.ruleName);

    const flags = actionToFlags(rule.action);
    if (flags.blocked) result.blocked = true;
    if (flags.requiresReview) result.requiresReview = true;

    await db
      .update(fraudDetectionRules)
      .set({ triggerCount: sql`${fraudDetectionRules.triggerCount} + 1` })
      .where(eq(fraudDetectionRules.id, rule.id));
  }

  return result;
}
