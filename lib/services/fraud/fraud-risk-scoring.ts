/**
 * Fraud Risk Scoring
 *
 * Purpose: Pure-ish risk-vector scoring functions used by the fraud detection
 * pipeline (velocity, geographic, device, behavioral, amount). Extracted from
 * FraudDetectionService.ts to keep each module under 500 lines.
 *
 * Scoring logic is unchanged from the original service; each function receives
 * the tenantId explicitly instead of reading it from instance state.
 *
 * Location: lib/services/fraud/fraud-risk-scoring.ts
 *
 * Based on: Bank of Namibia Payment System Fraud Trends (2013-2022)
 *
 * @implements Rule 2: Modular design with separate concerns
 * @implements Rule 13: TypeScript with proper types
 * @implements Rule 15: Comprehensive error checks and logging
 */

import { db } from '@/lib/db/connection';
import { fraudDeviceFingerprints, transactions } from '@/lib/db/schema';
import { eq, and, gte, desc, sql } from 'drizzle-orm';
import { securityLogger } from '@/lib/utils/security-logger';
import type { FraudScore, TransactionContext } from '@/lib/services/fraud/fraud-types';

/**
 * Calculate individual risk scores for different fraud vectors.
 * @param tenantId - Tenant identifier for scoping queries.
 * @param context - The transaction context being analyzed.
 * @param deviceId - The resolved device fingerprint identifier.
 * @returns The per-vector risk scores.
 */
export async function calculateRiskScores(
  tenantId: string,
  context: TransactionContext,
  deviceId: string
): Promise<FraudScore['scores']> {
  const [velocityScore, geographicScore, deviceScore, behavioralScore, amountScore] =
    await Promise.all([
      calculateVelocityScore(tenantId, context.guestId, deviceId),
      calculateGeographicScore(tenantId, context.location, context.guestId),
      calculateDeviceScore(deviceId),
      calculateBehavioralScore(tenantId, context.guestId, context.type),
      calculateAmountScore(tenantId, context.amount, context.guestId),
    ]);

  return {
    velocity: velocityScore,
    geographic: geographicScore,
    device: deviceScore,
    behavioral: behavioralScore,
    amount: amountScore,
  };
}

/**
 * Calculate velocity score based on transaction frequency.
 * High-frequency transactions are suspicious (especially for phone scams).
 * @param tenantId - Tenant identifier for scoping queries.
 * @param guestId - The guest identifier, if known.
 * @param deviceId - The resolved device fingerprint identifier.
 * @returns A velocity risk score between 0 and 100.
 */
export async function calculateVelocityScore(
  tenantId: string,
  guestId: string | undefined,
  deviceId: string
): Promise<number> {
  if (!guestId) return 30; // Unknown user = moderate risk

  try {
    // Count transactions in last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    const recentTransactions = await db
      .select({ count: sql<number>`count(*)` })
      .from(transactions)
      .where(
        and(
          eq(transactions.tenantId, tenantId),
          eq(transactions.guestId, guestId),
          gte(transactions.createdAt, fiveMinutesAgo)
        )
      );

    const count = Number(recentTransactions[0]?.count || 0);

    // Scoring logic based on Namibian fraud trends
    if (count >= 5) return 90; // Critical: Likely automated attack
    if (count >= 3) return 70; // High: Suspicious velocity
    if (count >= 2) return 40; // Medium: Elevated activity
    return 10; // Low: Normal velocity
  } catch (error) {
    securityLogger.error('[FraudDetectionService] Error calculating velocity score:', error);
    return 50; // Default to medium risk on error
  }
}

/**
 * Calculate geographic score based on location anomalies.
 * Unusual locations or rapid location changes indicate fraud.
 * @param tenantId - Tenant identifier for scoping queries.
 * @param location - The transaction location, if provided.
 * @param guestId - The guest identifier, if known.
 * @returns A geographic risk score between 0 and 100.
 */
export async function calculateGeographicScore(
  tenantId: string,
  location: TransactionContext['location'] | undefined,
  guestId: string | undefined
): Promise<number> {
  if (!location?.country || !guestId) return 20; // Missing data = low-medium risk

  try {
    // Get guest's usual countries
    const guestHistory = await db
      .select({ country: sql<string>`metadata->>'country'` })
      .from(transactions)
      .where(
        and(
          eq(transactions.tenantId, tenantId),
          eq(transactions.guestId, guestId)
        )
      )
      .limit(20);

    const usualCountries = new Set(
      guestHistory.map((t) => t.country).filter(Boolean)
    );

    // Check if current country is unusual
    if (usualCountries.size > 0 && !usualCountries.has(location.country)) {
      // New country for this user
      if (location.country !== 'NA' && location.country !== 'ZA') {
        // Not Namibia or South Africa (common for Namibian users)
        return 60; // High risk for international anomaly
      }
      return 35; // Medium risk for new regional location
    }

    // Check for impossible travel (transactions from different countries within short time)
    const recentTransaction = await db
      .select({
        country: sql<string>`metadata->>'country'`,
        createdAt: transactions.createdAt
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.tenantId, tenantId),
          eq(transactions.guestId, guestId)
        )
      )
      .orderBy(desc(transactions.createdAt))
      .limit(1);

    if (recentTransaction.length > 0 && recentTransaction[0].createdAt) {
      const timeDiff = Date.now() - new Date(recentTransaction[0].createdAt).getTime();
      const hoursSinceLastTx = timeDiff / (1000 * 60 * 60);

      if (
        recentTransaction[0].country &&
        recentTransaction[0].country !== location.country &&
        hoursSinceLastTx < 2
      ) {
        return 80; // Critical: Impossible travel detected
      }
    }

    return 5; // Low risk: Normal geographic pattern
  } catch (error) {
    securityLogger.error('[FraudDetectionService] Error calculating geographic score:', error);
    return 30;
  }
}

/**
 * Calculate device score based on device trust and history.
 * New or suspicious devices indicate higher risk.
 * @param deviceId - The resolved device fingerprint identifier.
 * @returns A device risk score between 0 and 100.
 */
export async function calculateDeviceScore(deviceId: string): Promise<number> {
  if (deviceId === 'unknown') return 40; // Unknown device = medium risk

  try {
    const [device] = await db
      .select()
      .from(fraudDeviceFingerprints)
      .where(eq(fraudDeviceFingerprints.deviceId, deviceId))
      .limit(1);

    if (!device) return 35; // New device = medium-low risk

    // Check device risk indicators
    let riskScore = 0;

    if (device.isVpn) riskScore += 20;
    if (device.isProxy) riskScore += 25;
    if (device.isTor) riskScore += 40; // Tor usage is high risk
    if (device.isEmulator) riskScore += 30;

    // Factor in fraud history
    if ((device.fraudCount ?? 0) > 0) {
      riskScore += Math.min((device.fraudCount ?? 0) * 15, 50);
    }

    // Factor in trust score
    if (device.isTrusted) {
      riskScore = Math.max(0, riskScore - 30);
    }

    // Factor in transaction history (more transactions = more trust)
    if ((device.transactionCount ?? 0) > 50) {
      riskScore = Math.max(0, riskScore - 20);
    } else if ((device.transactionCount ?? 0) > 10) {
      riskScore = Math.max(0, riskScore - 10);
    }

    return Math.min(100, riskScore);
  } catch (error) {
    securityLogger.error('[FraudDetectionService] Error calculating device score:', error);
    return 40;
  }
}

/**
 * Calculate behavioral score based on transaction patterns.
 * Unusual behavior patterns indicate fraud.
 * @param tenantId - Tenant identifier for scoping queries.
 * @param guestId - The guest identifier, if known.
 * @param transactionType - The type of the current transaction.
 * @returns A behavioral risk score between 0 and 100.
 */
export async function calculateBehavioralScore(
  tenantId: string,
  guestId: string | undefined,
  transactionType: string
): Promise<number> {
  if (!guestId) return 25; // Unknown user = low-medium risk

  try {
    // Get guest's transaction history
    const history = await db
      .select({
        type: transactions.type,
        amount: transactions.amount,
        createdAt: transactions.createdAt,
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.tenantId, tenantId),
          eq(transactions.guestId, guestId)
        )
      )
      .orderBy(desc(transactions.createdAt))
      .limit(50);

    if (history.length < 3) return 30; // New user = medium risk

    // Check for unusual transaction type
    const typeFrequency = history.filter((t) => t.type === transactionType).length;
    const typeRatio = typeFrequency / history.length;

    if (typeRatio < 0.1) {
      return 40; // Unusual transaction type
    }

    // Check for time-of-day anomalies
    const currentHour = new Date().getHours();
    const typicalHours = history
      .filter((t) => t.createdAt)
      .map((t) => new Date(t.createdAt as Date).getHours());
    const hourFrequency = typicalHours.filter((h) => Math.abs(h - currentHour) <= 2).length;
    const hourRatio = hourFrequency / history.length;

    if (hourRatio < 0.1 && (currentHour < 6 || currentHour > 23)) {
      return 35; // Unusual time (late night/early morning)
    }

    return 10; // Normal behavioral pattern
  } catch (error) {
    securityLogger.error('[FraudDetectionService] Error calculating behavioral score:', error);
    return 30;
  }
}

/**
 * Calculate amount score based on transaction size.
 * Large amounts relative to history indicate higher risk (CNP fraud trend).
 * @param tenantId - Tenant identifier for scoping queries.
 * @param amount - The transaction amount.
 * @param guestId - The guest identifier, if known.
 * @returns An amount risk score between 0 and 100.
 */
export async function calculateAmountScore(
  tenantId: string,
  amount: number,
  guestId: string | undefined
): Promise<number> {
  if (!guestId) {
    // No history available, use absolute thresholds
    if (amount >= 50000) return 80; // N$50k+ = very high risk
    if (amount >= 20000) return 60; // N$20k+ = high risk
    if (amount >= 10000) return 40; // N$10k+ = medium risk
    if (amount >= 5000) return 25; // N$5k+ = low-medium risk
    return 10;
  }

  try {
    // Get guest's transaction history
    const history = await db
      .select({ amount: transactions.amount })
      .from(transactions)
      .where(
        and(
          eq(transactions.tenantId, tenantId),
          eq(transactions.guestId, guestId),
          eq(transactions.status, 'completed')
        )
      )
      .orderBy(desc(transactions.createdAt))
      .limit(20);

    if (history.length < 3) {
      // Limited history, use absolute thresholds
      if (amount >= 20000) return 70;
      if (amount >= 10000) return 50;
      if (amount >= 5000) return 30;
      return 15;
    }

    // Calculate average and standard deviation
    const amounts = history.map((t) => Number(t.amount));
    const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const maxAmount = Math.max(...amounts);

    // Score based on deviation from history
    if (amount > maxAmount * 3) return 90; // 3x max = critical
    if (amount > maxAmount * 2) return 70; // 2x max = high
    if (amount > avgAmount * 5) return 60; // 5x average = high
    if (amount > avgAmount * 3) return 40; // 3x average = medium
    if (amount > avgAmount * 2) return 25; // 2x average = low-medium

    return 5; // Normal amount
  } catch (error) {
    securityLogger.error('[FraudDetectionService] Error calculating amount score:', error);
    return 30;
  }
}
