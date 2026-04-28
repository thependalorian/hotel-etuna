/**
 * AML Monitoring Service
 * 
 * Purpose: Real-time Anti-Money Laundering transaction monitoring
 * Location: lib/services/compliance/AMLMonitoringService.ts
 * 
 * Features:
 * - Real-time transaction pattern analysis
 * - High-value transaction alerts (≥N$100,000)
 * - Velocity monitoring (>10 transactions/hour)
 * - Geographic pattern detection
 * - Structuring detection (multiple transactions below threshold)
 * - PEP transaction monitoring
 * - Automatic alert generation and escalation
 * 
 * Compliance: Namibian Financial Intelligence Act (FIA)
 */

import { db } from '@/lib/db';
import { eq, and, gte, lte, desc, sql, inArray } from 'drizzle-orm';
import {
  transactions,
  amlTransactionAlerts,
  amlMonitoringRules,
  amlGuestPepFlags,
  amlTransactionVelocity,
  amlGeographicPatterns,
  guests,
  type NewAmlTransactionAlert,
  type NewAmlTransactionVelocity,
  type NewAmlGeographicPattern,
} from '@/lib/db/schema';

export interface TransactionContext {
  transactionId: string;
  tenantId: string;
  guestId: string;
  amount: number;
  currency: string;
  transactionReference: string;
  ipAddress?: string;
  location?: {
    countryCode?: string;
    city?: string;
    latitude?: number;
    longitude?: number;
  };
  timestamp: Date;
}

export interface MonitoringResult {
  alerts: Array<{
    alertType: string;
    riskLevel: string;
    riskScore: number;
    message: string;
    requiresStr?: boolean;
  }>;
  velocityCheck: {
    transactionCount: number;
    timeWindowHours: number;
    isSuspicious: boolean;
  };
  pepCheck: {
    isPep: boolean;
    pepCategory?: string;
  };
  riskScore: number;
  shouldBlock: boolean;
}

export class AMLMonitoringService {
  /**
   * Main entry point: Monitor a transaction for AML/CFT compliance
   */
  static async monitorTransaction(
    context: TransactionContext
  ): Promise<MonitoringResult> {
    const alerts: MonitoringResult['alerts'] = [];
    let totalRiskScore = 0;

    try {
      // 1. Check if guest is PEP
      const pepCheck = await this.checkPEPStatus(context.guestId, context.tenantId);
      
      if (pepCheck.isPep) {
        alerts.push({
          alertType: 'pep_transaction',
          riskLevel: 'high',
          riskScore: 75,
          message: `Transaction by PEP: ${pepCheck.pepCategory}`,
        });
        totalRiskScore += 75;
      }

      // 2. High-value transaction check (≥N$100,000)
      if (context.amount >= 100000 && context.currency === 'NAD') {
        const highValueAlert = await this.createHighValueAlert(context);
        alerts.push({
          alertType: 'high_value',
          riskLevel: 'high',
          riskScore: 80,
          message: `High-value transaction: N$${context.amount.toLocaleString()}`,
          requiresStr: context.amount >= 500000, // STR required for ≥N$500K
        });
        totalRiskScore += 80;
      }

      // 3. Velocity check (>10 transactions/hour)
      const velocityCheck = await this.checkTransactionVelocity(
        context.guestId,
        context.tenantId,
        context.timestamp
      );

      if (velocityCheck.isSuspicious) {
        alerts.push({
          alertType: 'velocity',
          riskLevel: velocityCheck.transactionCount > 50 ? 'critical' : 'high',
          riskScore: Math.min(velocityCheck.transactionCount * 2, 100),
          message: `High velocity: ${velocityCheck.transactionCount} transactions in ${velocityCheck.timeWindowHours} hour(s)`,
        });
        totalRiskScore += Math.min(velocityCheck.transactionCount * 2, 100);
      }

      // 4. Structuring detection
      const structuringCheck = await this.detectStructuring(
        context.guestId,
        context.tenantId,
        context.amount,
        context.timestamp
      );

      if (structuringCheck.isSuspicious) {
        alerts.push({
          alertType: 'structuring',
          riskLevel: 'critical',
          riskScore: 95,
          message: structuringCheck.message,
          requiresStr: true,
        });
        totalRiskScore += 95;
      }

      // 5. Geographic anomaly detection
      if (context.location) {
        const geoCheck = await this.checkGeographicPattern(context);
        
        if (geoCheck.isHighRisk) {
          alerts.push({
            alertType: 'geographic_anomaly',
            riskLevel: 'medium',
            riskScore: 60,
            message: geoCheck.message,
          });
          totalRiskScore += 60;
        }
      }

      // 6. Calculate final risk score (average of all triggered alerts)
      const finalRiskScore = alerts.length > 0 
        ? Math.round(totalRiskScore / alerts.length) 
        : 0;

      // 7. Persist alerts to database
      if (alerts.length > 0) {
        await this.persistAlerts(context, alerts);
      }

      // 8. Determine if transaction should be blocked (critical risk)
      const shouldBlock = finalRiskScore >= 90 || 
        alerts.some(a => a.alertType === 'structuring');

      return {
        alerts,
        velocityCheck,
        pepCheck,
        riskScore: finalRiskScore,
        shouldBlock,
      };
    } catch (error) {
      console.error('[AMLMonitoringService] Error monitoring transaction:', error);
      throw error;
    }
  }

  /**
   * Check if guest is a Politically Exposed Person (PEP)
   */
  private static async checkPEPStatus(
    guestId: string,
    tenantId: string
  ): Promise<{ isPep: boolean; pepCategory?: string }> {
    const pepFlags = await db
      .select()
      .from(amlGuestPepFlags)
      .where(
        and(
          eq(amlGuestPepFlags.guestId, guestId),
          eq(amlGuestPepFlags.tenantId, tenantId),
          eq(amlGuestPepFlags.isActive, true)
        )
      )
      .limit(1);

    if (pepFlags.length > 0) {
      return {
        isPep: true,
        pepCategory: pepFlags[0].flagType,
      };
    }

    return { isPep: false };
  }

  /**
   * Create high-value transaction alert
   */
  private static async createHighValueAlert(
    context: TransactionContext
  ): Promise<void> {
    const alert: NewAmlTransactionAlert = {
      tenantId: context.tenantId,
      transactionId: context.transactionId,
      transactionReference: context.transactionReference,
      guestId: context.guestId,
      alertType: 'high_value',
      alertCategory: 'suspicious',
      riskLevel: 'high',
      riskScore: '80',
      amount: context.amount.toString(),
      currency: context.currency,
      detectionTimestamp: new Date(),
      status: 'pending',
      requiresStr: context.amount >= 500000,
      metadata: {},
    };

    await db.insert(amlTransactionAlerts).values(alert);
  }

  /**
   * Check transaction velocity (>10 transactions/hour triggers alert)
   */
  private static async checkTransactionVelocity(
    guestId: string,
    tenantId: string,
    currentTimestamp: Date
  ): Promise<{ transactionCount: number; timeWindowHours: number; isSuspicious: boolean }> {
    const oneHourAgo = new Date(currentTimestamp.getTime() - 60 * 60 * 1000);
    const twentyFourHoursAgo = new Date(currentTimestamp.getTime() - 24 * 60 * 60 * 1000);

    // Check 1-hour window
    const oneHourTransactions = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(transactions)
      .where(
        and(
          eq(transactions.tenantId, tenantId),
          eq(transactions.guestId, guestId),
          gte(transactions.createdAt, oneHourAgo)
        )
      );

    const oneHourCount = oneHourTransactions[0]?.count || 0;

    // Check 24-hour window
    const twentyFourHourTransactions = await db
      .select({ 
        count: sql<number>`count(*)::int`,
        totalAmount: sql<string>`sum(amount)::text`,
        avgAmount: sql<string>`avg(amount)::text`,
        maxAmount: sql<string>`max(amount)::text`,
        minAmount: sql<string>`min(amount)::text`,
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.tenantId, tenantId),
          eq(transactions.guestId, guestId),
          gte(transactions.createdAt, twentyFourHoursAgo)
        )
      );

    const twentyFourHourCount = twentyFourHourTransactions[0]?.count || 0;
    const isSuspicious = oneHourCount > 10 || twentyFourHourCount > 50;

    // Persist velocity tracking
    if (isSuspicious) {
      const velocityRecord: NewAmlTransactionVelocity = {
        tenantId,
        guestId,
        windowStart: oneHourCount > 10 ? oneHourAgo : twentyFourHoursAgo,
        windowEnd: currentTimestamp,
        windowHours: oneHourCount > 10 ? 1 : 24,
        transactionCount: oneHourCount > 10 ? oneHourCount : twentyFourHourCount,
        totalAmount: twentyFourHourTransactions[0]?.totalAmount || '0',
        averageAmount: twentyFourHourTransactions[0]?.avgAmount || '0',
        maxAmount: twentyFourHourTransactions[0]?.maxAmount || '0',
        minAmount: twentyFourHourTransactions[0]?.minAmount || '0',
        isSuspicious: true,
        suspicionReason: oneHourCount > 10 
          ? `Exceeded 10 transactions/hour threshold (${oneHourCount} transactions)`
          : `Exceeded 50 transactions/day threshold (${twentyFourHourCount} transactions)`,
        riskScore: oneHourCount > 10 ? '85' : '70',
      };

      await db.insert(amlTransactionVelocity).values(velocityRecord);
    }

    return {
      transactionCount: oneHourCount > 10 ? oneHourCount : twentyFourHourCount,
      timeWindowHours: oneHourCount > 10 ? 1 : 24,
      isSuspicious,
    };
  }

  /**
   * Detect structuring: Multiple transactions just below N$100K threshold
   */
  private static async detectStructuring(
    guestId: string,
    tenantId: string,
    currentAmount: number,
    currentTimestamp: Date
  ): Promise<{ isSuspicious: boolean; message: string }> {
    // Look for 3+ transactions between N$90K-N$99K in 24 hours
    const twentyFourHoursAgo = new Date(currentTimestamp.getTime() - 24 * 60 * 60 * 1000);

    const structuringTransactions = await db
      .select({ 
        count: sql<number>`count(*)::int`,
        totalAmount: sql<string>`sum(amount)::text`,
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.tenantId, tenantId),
          eq(transactions.guestId, guestId),
          gte(transactions.createdAt, twentyFourHoursAgo),
          gte(transactions.amount, '90000'),
          lte(transactions.amount, '99999'),
          eq(transactions.currency, 'NAD')
        )
      );

    const count = structuringTransactions[0]?.count || 0;
    const totalAmount = parseFloat(structuringTransactions[0]?.totalAmount || '0');

    const isSuspicious = count >= 3;

    return {
      isSuspicious,
      message: isSuspicious
        ? `Possible structuring: ${count} transactions between N$90K-N$99K totaling N$${totalAmount.toLocaleString()} in 24 hours`
        : '',
    };
  }

  /**
   * Check geographic patterns and high-risk jurisdictions
   */
  private static async checkGeographicPattern(
    context: TransactionContext
  ): Promise<{ isHighRisk: boolean; message: string }> {
    if (!context.location?.countryCode) {
      return { isHighRisk: false, message: '' };
    }

    // FATF high-risk jurisdictions (as of 2026)
    const highRiskCountries = ['IR', 'KP', 'MM', 'SY', 'YE'];
    const isHighRiskJurisdiction = highRiskCountries.includes(
      context.location.countryCode
    );

    // Check if location is unusual for this guest
    const recentTransactions = await db
      .select()
      .from(amlGeographicPatterns)
      .where(
        and(
          eq(amlGeographicPatterns.guestId, context.guestId),
          eq(amlGeographicPatterns.tenantId, context.tenantId)
        )
      )
      .orderBy(desc(amlGeographicPatterns.createdAt))
      .limit(10);

    const usualCountries = new Set(
      recentTransactions.map(t => t.countryCode).filter(Boolean)
    );
    const isUnusualLocation = 
      recentTransactions.length > 0 && 
      !usualCountries.has(context.location.countryCode);

    // Persist geographic pattern
    const geoPattern: NewAmlGeographicPattern = {
      tenantId: context.tenantId,
      guestId: context.guestId,
      transactionId: context.transactionId,
      ipAddress: context.ipAddress,
      countryCode: context.location.countryCode,
      city: context.location.city,
      latitude: context.location.latitude?.toString(),
      longitude: context.location.longitude?.toString(),
      isHighRiskJurisdiction,
      isUnusualLocation,
      riskLevel: isHighRiskJurisdiction ? 'high' : isUnusualLocation ? 'medium' : 'low',
      transactionTimestamp: context.timestamp,
    };

    await db.insert(amlGeographicPatterns).values(geoPattern);

    return {
      isHighRisk: isHighRiskJurisdiction || isUnusualLocation,
      message: isHighRiskJurisdiction
        ? `Transaction from FATF high-risk jurisdiction: ${context.location.countryCode}`
        : isUnusualLocation
        ? `Unusual transaction location: ${context.location.countryCode}`
        : '',
    };
  }

  /**
   * Persist all alerts to database
   */
  private static async persistAlerts(
    context: TransactionContext,
    alerts: MonitoringResult['alerts']
  ): Promise<void> {
    const alertRecords: NewAmlTransactionAlert[] = alerts.map(alert => ({
      tenantId: context.tenantId,
      transactionId: context.transactionId,
      transactionReference: context.transactionReference,
      guestId: context.guestId,
      alertType: alert.alertType,
      alertCategory: alert.riskLevel === 'critical' ? 'suspicious' : 'unusual',
      riskLevel: alert.riskLevel,
      riskScore: alert.riskScore.toString(),
      amount: context.amount.toString(),
      currency: context.currency,
      detectionTimestamp: new Date(),
      status: 'pending',
      requiresStr: alert.requiresStr || false,
      patternDetails: { message: alert.message },
      metadata: {},
    }));

    await db.insert(amlTransactionAlerts).values(alertRecords);
  }

  /**
   * Get active monitoring rules for a tenant
   */
  static async getActiveRules(tenantId: string) {
    return await db
      .select()
      .from(amlMonitoringRules)
      .where(
        and(
          eq(amlMonitoringRules.tenantId, tenantId),
          eq(amlMonitoringRules.isActive, true)
        )
      );
  }

  /**
   * Get pending alerts for review
   */
  static async getPendingAlerts(tenantId: string, limit = 50) {
    return await db
      .select()
      .from(amlTransactionAlerts)
      .where(
        and(
          eq(amlTransactionAlerts.tenantId, tenantId),
          eq(amlTransactionAlerts.status, 'pending')
        )
      )
      .orderBy(desc(amlTransactionAlerts.createdAt))
      .limit(limit);
  }

  /**
   * Update alert status
   */
  static async updateAlertStatus(
    alertId: string,
    status: 'investigating' | 'cleared' | 'escalated' | 'reported',
    userId: string,
    notes?: string
  ) {
    return await db
      .update(amlTransactionAlerts)
      .set({
        status,
        assignedTo: userId,
        assignedAt: new Date(),
        investigationNotes: notes,
        updatedAt: new Date(),
      })
      .where(eq(amlTransactionAlerts.id, alertId));
  }
}
