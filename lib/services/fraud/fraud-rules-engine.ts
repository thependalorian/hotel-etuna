/**
 * Fraud Rules Engine
 *
 * Purpose: Rule application, scoring aggregation, and decisioning for the fraud
 * detection pipeline. Extracted from FraudDetectionService.ts to keep each
 * module under 500 lines.
 *
 * Logic is unchanged from the original service; each function receives the
 * tenantId explicitly instead of reading it from instance state.
 *
 * Location: lib/services/fraud/fraud-rules-engine.ts
 *
 * @implements Rule 2: Modular design with separate concerns
 * @implements Rule 13: TypeScript with proper types
 * @implements Rule 15: Comprehensive error checks and logging
 */

import { db } from '@/lib/db/connection';
import { fraudDetectionRules, type FraudDetectionRule } from '@/lib/db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { securityLogger } from '@/lib/utils/security-logger';
import {
  evaluateTenantFraudRule,
  type TenantRuleEvaluationContext,
} from '@/lib/services/fraud/tenant-fraud-rules';
import type { FraudScore, TransactionContext } from '@/lib/services/fraud/fraud-types';

/** Result of evaluating a single fraud rule against a transaction. */
export interface RuleEvaluationOutcome {
  rule: FraudDetectionRule;
  matched: boolean;
}

/** The decision portion of a {@link FraudScore}. */
export type FraudDecision = Pick<
  FraudScore,
  'decision' | 'requires3ds' | 'requiresOtp' | 'requiresManualReview' | 'triggeredRules' | 'decisionReason'
>;

/**
 * Apply fraud detection rules and return triggered rules.
 * @param tenantId - Tenant identifier for scoping queries.
 * @param context - The transaction context being analyzed.
 * @param scores - The per-vector risk scores.
 * @returns The per-rule evaluation outcomes.
 */
export async function applyFraudRules(
  tenantId: string,
  context: TransactionContext,
  scores: FraudScore['scores']
): Promise<RuleEvaluationOutcome[]> {
  try {
    // Get active rules for tenant, ordered by priority
    const rules = await db
      .select()
      .from(fraudDetectionRules)
      .where(
        and(
          eq(fraudDetectionRules.tenantId, tenantId),
          eq(fraudDetectionRules.isActive, true)
        )
      )
      .orderBy(desc(fraudDetectionRules.priority));

    const results: RuleEvaluationOutcome[] = [];

    for (const rule of rules) {
      const matched = await evaluateRule(tenantId, rule, context, scores);
      results.push({ rule, matched });

      if (matched) {
        // Update rule trigger count
        await db
          .update(fraudDetectionRules)
          .set({
            triggerCount: sql`${fraudDetectionRules.triggerCount} + 1`,
          })
          .where(eq(fraudDetectionRules.id, rule.id));
      }
    }

    return results;
  } catch (error) {
    securityLogger.error('[FraudDetectionService] Error applying fraud rules:', error);
    return [];
  }
}

/**
 * Evaluate a single fraud detection rule.
 * @param tenantId - Tenant identifier for scoping queries.
 * @param rule - The fraud detection rule to evaluate.
 * @param context - The transaction context being analyzed.
 * @param scores - The per-vector risk scores.
 * @returns Whether the rule matched.
 */
export async function evaluateRule(
  tenantId: string,
  rule: FraudDetectionRule,
  context: TransactionContext,
  scores: FraudScore['scores']
): Promise<boolean> {
  try {
    const ctx: TenantRuleEvaluationContext = {
      tenantId: tenantId,
      userId: context.guestId,
      amount: context.amount,
      currency: context.currency,
      billingCountry: context.location?.country,
      propertyCountry:
        typeof context.metadata?.propertyCountry === 'string'
          ? context.metadata.propertyCountry
          : 'NA',
    };
    const matched = await evaluateTenantFraudRule(rule, ctx);
    if (matched) return true;

    const ruleType = (rule.ruleType || '').toLowerCase();
    if (ruleType === 'velocity') {
      return scores.velocity >= (Number(rule.thresholdValue) || 50);
    }
    if (ruleType === 'geographic' || ruleType === 'geo') {
      return scores.geographic >= (Number(rule.thresholdValue) || 50);
    }
    if (ruleType === 'device') {
      return scores.device >= (Number(rule.thresholdValue) || 50);
    }
    if (ruleType === 'amount') {
      if (rule.thresholdOperator === 'gte') {
        return context.amount >= (Number(rule.thresholdValue) || 0);
      }
      return scores.amount >= (Number(rule.thresholdValue) || 50);
    }
    if (ruleType === 'behavioral' || ruleType === 'behavior') {
      return scores.behavioral >= (Number(rule.thresholdValue) || 50);
    }
    return false;
  } catch (error) {
    securityLogger.error('[FraudDetectionService] Error evaluating rule:', error);
    return false;
  }
}

/**
 * Calculate overall risk score from individual scores and rule impacts.
 * @param scores - The per-vector risk scores.
 * @param ruleResults - The per-rule evaluation outcomes.
 * @returns The aggregated risk score, rounded to 2 decimal places.
 */
export function calculateOverallRiskScore(
  scores: FraudScore['scores'],
  ruleResults: RuleEvaluationOutcome[]
): number {
  // Base score: weighted average of individual scores
  const baseScore =
    scores.velocity * 0.25 +
    scores.geographic * 0.2 +
    scores.device * 0.2 +
    scores.behavioral * 0.15 +
    scores.amount * 0.2;

  // Add rule impacts
  const ruleImpact = ruleResults
    .filter((r) => r.matched)
    .reduce((sum, r) => sum + Number(r.rule.riskScoreImpact || 0), 0);

  const totalScore = Math.min(100, baseScore + ruleImpact);

  return Math.round(totalScore * 100) / 100; // Round to 2 decimal places
}

/**
 * Determine risk level from risk score.
 * @param riskScore - The aggregated risk score.
 * @returns The categorical risk level.
 */
export function determineRiskLevel(riskScore: number): FraudScore['riskLevel'] {
  if (riskScore >= 75) return 'critical';
  if (riskScore >= 50) return 'high';
  if (riskScore >= 25) return 'medium';
  return 'low';
}

/**
 * Make decision based on risk score and triggered rules.
 * @param riskScore - The aggregated risk score.
 * @param riskLevel - The categorical risk level.
 * @param ruleResults - The per-rule evaluation outcomes.
 * @returns The decision and verification requirements.
 */
export async function makeDecision(
  riskScore: number,
  riskLevel: FraudScore['riskLevel'],
  ruleResults: RuleEvaluationOutcome[]
): Promise<FraudDecision> {
  const triggeredRules = ruleResults.filter((r) => r.matched).map((r) => r.rule.ruleName);

  let decision: FraudScore['decision'] = 'approved';
  let requires3ds = false;
  let requiresOtp = false;
  let requiresManualReview = false;
  let decisionReason = '';

  const hasBlockRule = ruleResults.some(
    (r) =>
      r.matched &&
      ['decline', 'block'].includes((r.rule.action || '').toLowerCase()),
  );

  if (hasBlockRule || riskLevel === 'critical') {
    decision = 'declined';
    decisionReason = 'High fraud risk detected - transaction declined';
  } else if (riskLevel === 'high') {
    decision = 'review';
    requiresManualReview = true;
    decisionReason = 'Elevated fraud risk - manual review required';
  } else if (riskLevel === 'medium') {
    decision = 'flagged';
    requires3ds = true;
    requiresOtp = true;
    decisionReason = 'Moderate fraud risk - additional verification required';
  } else {
    decision = 'approved';
    decisionReason = 'Low fraud risk - transaction approved';
  }

  // Override with specific rule actions
  for (const result of ruleResults) {
    if (!result.matched) continue;

    if (result.rule.action === 'require_3ds') {
      requires3ds = true;
    }
    if (result.rule.action === 'require_otp') {
      requiresOtp = true;
    }
    if (result.rule.action === 'review') {
      requiresManualReview = true;
    }
  }

  return {
    decision,
    requires3ds,
    requiresOtp,
    requiresManualReview,
    triggeredRules,
    decisionReason,
  };
}
