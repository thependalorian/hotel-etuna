/**
 * Fraud statistics aggregation.
 *
 * Location: lib/services/fraud/fraud-statistics.ts
 *
 * Reason: Extracted from FraudDetectionService to keep that file under the
 * 500-line modularity limit. Pure reporting/aggregation over fraud risk
 * profiles for a tenant and reporting period (DRY, single responsibility).
 */

import { db } from '@/lib/db/connection';
import { fraudRiskProfiles } from '@/lib/db/schema';
import { eq, and, gte } from 'drizzle-orm';
import { securityLogger } from '@/lib/utils/security-logger';

/** Aggregated fraud statistics for a reporting period. */
export interface FraudStatistics {
  totalTransactions: number;
  flaggedTransactions: number;
  declinedTransactions: number;
  fraudRate: number;
  averageRiskScore: number;
  topFraudTypes: { type: string; count: number }[];
}

/**
 * Compute fraud statistics for a tenant over a reporting period.
 *
 * @param tenantId - Tenant whose fraud risk profiles to aggregate.
 * @param periodType - Reporting window: daily (24h), weekly (7d), or monthly (30d).
 * @returns Aggregated counts, fraud rate, average risk score, and top fraud types.
 */
export async function getFraudStatistics(
  tenantId: string,
  periodType: 'daily' | 'weekly' | 'monthly' = 'daily'
): Promise<FraudStatistics> {
  try {
    // Calculate period dates
    const now = new Date();
    let periodStart: Date;

    switch (periodType) {
      case 'weekly':
        periodStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'monthly':
        periodStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        periodStart = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    // Get profile statistics
    const profiles = await db
      .select()
      .from(fraudRiskProfiles)
      .where(
        and(
          eq(fraudRiskProfiles.tenantId, tenantId),
          gte(fraudRiskProfiles.createdAt, periodStart)
        )
      );

    const totalTransactions = profiles.length;
    const flaggedTransactions = profiles.filter((p) => p.decision === 'flagged').length;
    const declinedTransactions = profiles.filter((p) => p.decision === 'declined').length;
    const fraudRate = totalTransactions > 0
      ? (declinedTransactions / totalTransactions) * 100
      : 0;

    const averageRiskScore =
      profiles.reduce((sum, p) => sum + Number(p.riskScore), 0) / (totalTransactions || 1);

    // Count fraud types
    const fraudTypeCounts = profiles
      .filter((p) => p.fraudType)
      .reduce((acc, p) => {
        const type = p.fraudType!;
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    const topFraudTypes = Object.entries(fraudTypeCounts)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalTransactions,
      flaggedTransactions,
      declinedTransactions,
      fraudRate: Math.round(fraudRate * 100) / 100,
      averageRiskScore: Math.round(averageRiskScore * 100) / 100,
      topFraudTypes,
    };
  } catch (error) {
    securityLogger.error('[FraudStatistics] Error getting statistics:', error);
    throw error;
  }
}
