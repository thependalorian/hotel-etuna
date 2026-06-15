/**
 * Fraud Detection Service
 * 
 * Purpose: Real-time fraud detection and prevention based on Namibian fraud trends
 * Functionality: 
 * - Card-Not-Present (CNP) fraud detection (N$31.6M trend)
 * - Phone scam detection (N$27.1M trend)
 * - Phishing detection (N$11.1M trend)
 * - SIM swap attack detection
 * - Real-time fraud scoring and risk assessment
 * - Device fingerprinting and trust scoring
 * - Transaction velocity monitoring
 * - Geographic anomaly detection
 * 
 * Location: lib/services/fraud/FraudDetectionService.ts
 * 
 * Based on: Bank of Namibia Payment System Fraud Trends (2013-2022)
 * 
 * @implements Rule 1: DaisyUI not applicable (backend service)
 * @implements Rule 2: Modular design with separate concerns
 * @implements Rule 3: Documented purpose and functionality
 * @implements Rule 12: Complete error handling and validation
 * @implements Rule 13: TypeScript with proper types
 * @implements Rule 14: Secure and scalable implementation
 * @implements Rule 15: Comprehensive error checks and logging
 */

import { db } from '@/lib/db/connection';
import {
  fraudRiskProfiles,
  fraudDeviceFingerprints,
  fraudAlerts,
  type FraudRiskProfile,
  type FraudAlert,
} from '@/lib/db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import crypto from 'crypto';
import { securityLogger } from '@/lib/utils/security-logger';
import { calculateRiskScores } from '@/lib/services/fraud/fraud-risk-scoring';
import {
  applyFraudRules,
  calculateOverallRiskScore,
  determineRiskLevel,
  makeDecision,
  type RuleEvaluationOutcome,
} from '@/lib/services/fraud/fraud-rules-engine';
import type {
  DeviceFingerprintData,
  TransactionContext,
  FraudScore,
  FraudAlertData,
} from '@/lib/services/fraud/fraud-types';
import { getFraudStatistics, type FraudStatistics } from '@/lib/services/fraud/fraud-statistics';

// Reason: Re-export the fraud types so existing importers of
// '@/lib/services/fraud/FraudDetectionService' (e.g. fraud/analyze/route.ts)
// keep their import paths and names unchanged after the module split.
export type {
  DeviceFingerprintData,
  TransactionContext,
  FraudScore,
  FraudAlertData,
} from '@/lib/services/fraud/fraud-types';

// ============================================================================
// FRAUD DETECTION SERVICE
// ============================================================================

export class FraudDetectionService {
  private tenantId: string;

  constructor(tenantId: string) {
    this.tenantId = tenantId;
  }

  // ==========================================================================
  // MAIN FRAUD DETECTION FLOW
  // ==========================================================================

  /**
   * Analyze transaction for fraud and return risk assessment
   * This is the main entry point for fraud detection
   */
  async analyzeTransaction(context: TransactionContext): Promise<FraudScore> {
    try {
      securityLogger.info('[FraudDetectionService] Starting fraud analysis', {
        transactionId: context.transactionId,
        amount: context.amount,
        tenantId: this.tenantId,
        guestId: context.guestId,
      });

      // Step 1: Get or create device fingerprint
      const deviceId = await this.processDeviceFingerprint(
        context.guestId,
        context.deviceFingerprint,
        context.ipAddress
      );

      // Step 2: Calculate individual risk scores
      const scores = await calculateRiskScores(this.tenantId, context, deviceId);

      // Step 3: Apply fraud detection rules
      const ruleResults = await applyFraudRules(this.tenantId, context, scores);

      // Step 4: Calculate overall risk score
      const riskScore = calculateOverallRiskScore(scores, ruleResults);

      // Step 5: Determine risk level and decision
      const riskLevel = determineRiskLevel(riskScore);
      const decision = await makeDecision(riskScore, riskLevel, ruleResults);

      // Step 6: Create fraud risk profile
      const profile = await this.createRiskProfile(context, {
        riskScore,
        riskLevel,
        decision,
        scores,
        ruleResults,
      });

      // Step 7: Generate alerts if needed
      if (riskLevel === 'high' || riskLevel === 'critical') {
        await this.generateAlert(profile.id, context, riskLevel, decision.decisionReason || '');
      }

      securityLogger.info('[FraudDetectionService] Fraud analysis complete', {
        transactionId: context.transactionId,
        riskScore,
        riskLevel,
        decision: decision.decision,
        tenantId: this.tenantId,
        guestId: context.guestId,
      });

      return {
        riskScore,
        riskLevel,
        ...decision,
        scores,
      };
    } catch (error) {
      securityLogger.error('[FraudDetectionService] Error in fraud analysis:', error);
      
      // Fail-safe: On error, flag for manual review
      return {
        riskScore: 50,
        riskLevel: 'medium',
        decision: 'review',
        requires3ds: true,
        requiresOtp: true,
        requiresManualReview: true,
        triggeredRules: [],
        scores: {
          velocity: 0,
          geographic: 0,
          device: 0,
          behavioral: 0,
          amount: 0,
        },
        decisionReason: 'Error during fraud analysis - flagged for manual review',
      };
    }
  }

  // ==========================================================================
  // DEVICE FINGERPRINTING
  // ==========================================================================

  /**
   * Process device fingerprint and return device ID
   * Tracks device trust and usage patterns
   */
  private async processDeviceFingerprint(
    guestId: string | undefined,
    fingerprintData: DeviceFingerprintData | undefined,
    ipAddress: string | undefined
  ): Promise<string> {
    if (!fingerprintData) {
      return 'unknown';
    }

    // Generate unique device ID from fingerprint components
    const deviceId = this.generateDeviceId(fingerprintData);
    const deviceHash = crypto.createHash('sha256').update(deviceId).digest('hex');

    try {
      // Check if device exists
      const [existingDevice] = await db
        .select()
        .from(fraudDeviceFingerprints)
        .where(eq(fraudDeviceFingerprints.deviceId, deviceId))
        .limit(1);

      if (existingDevice) {
        // Update existing device
        await db
          .update(fraudDeviceFingerprints)
          .set({
            lastSeenAt: new Date(),
            transactionCount: sql`${fraudDeviceFingerprints.transactionCount} + 1`,
            ipAddresses: ipAddress
              ? sql`array_append(DISTINCT ${fraudDeviceFingerprints.ipAddresses}, ${ipAddress})`
              : existingDevice.ipAddresses,
            updatedAt: new Date(),
          })
          .where(eq(fraudDeviceFingerprints.id, existingDevice.id));

        return deviceId;
      }

      // Create new device fingerprint
      await db.insert(fraudDeviceFingerprints).values({
        tenantId: this.tenantId,
        guestId: guestId,
        deviceId,
        deviceHash,
        browserName: fingerprintData.browserName,
        browserVersion: fingerprintData.browserVersion,
        osName: fingerprintData.osName,
        osVersion: fingerprintData.osVersion,
        deviceType: fingerprintData.deviceType,
        screenResolution: fingerprintData.screenResolution,
        timezone: fingerprintData.timezone,
        language: fingerprintData.language,
        ipAddresses: ipAddress ? [ipAddress] : [],
        transactionCount: 1,
      });

      return deviceId;
    } catch (error) {
      securityLogger.error('[FraudDetectionService] Error processing device fingerprint:', error);
      return deviceId;
    }
  }

  /**
   * Generate unique device ID from fingerprint components
   */
  private generateDeviceId(fingerprint: DeviceFingerprintData): string {
    const components = [
      fingerprint.browserName,
      fingerprint.browserVersion,
      fingerprint.osName,
      fingerprint.osVersion,
      fingerprint.screenResolution,
      fingerprint.timezone,
      fingerprint.language,
    ]
      .filter(Boolean)
      .join('|');

    return crypto.createHash('md5').update(components).digest('hex');
  }

  // ==========================================================================
  // RISK PROFILE MANAGEMENT
  // ==========================================================================

  /**
   * Create fraud risk profile in database
   */
  private async createRiskProfile(
    context: TransactionContext,
    assessment: {
      riskScore: number;
      riskLevel: FraudScore['riskLevel'];
      decision: {
        decision: FraudScore['decision'];
        requires3ds: boolean;
        requiresOtp: boolean;
        requiresManualReview: boolean;
        triggeredRules: string[];
        decisionReason?: string;
      };
      scores: FraudScore['scores'];
      ruleResults: RuleEvaluationOutcome[];
    }
  ): Promise<FraudRiskProfile> {
    const [profile] = await db
      .insert(fraudRiskProfiles)
      .values({
        tenantId: this.tenantId,
        transactionId: context.transactionId,
        guestId: context.guestId,
        riskScore: assessment.riskScore.toString(),
        riskLevel: assessment.riskLevel,
        decision: assessment.decision.decision,
        decisionReason: assessment.decision.decisionReason,
        velocityScore: assessment.scores.velocity.toString(),
        geographicScore: assessment.scores.geographic.toString(),
        deviceScore: assessment.scores.device.toString(),
        behavioralScore: assessment.scores.behavioral.toString(),
        amountScore: assessment.scores.amount.toString(),
        requires3ds: assessment.decision.requires3ds,
        requiresOtp: assessment.decision.requiresOtp,
        requiresManualReview: assessment.decision.requiresManualReview,
        detectionRules: assessment.decision.triggeredRules,
        deviceFingerprint: context.deviceFingerprint || {},
        ipAddress: context.ipAddress || null,
        userAgent: context.userAgent || null,
      })
      .returning();

    return profile;
  }

  // ==========================================================================
  // ALERT GENERATION
  // ==========================================================================

  /**
   * Generate fraud alert for high-risk transactions
   */
  private async generateAlert(
    riskProfileId: string,
    context: TransactionContext,
    riskLevel: FraudScore['riskLevel'],
    reason: string
  ): Promise<FraudAlert> {
    const alertData = this.createAlertData(riskLevel, context, reason);

    const [alert] = await db
      .insert(fraudAlerts)
      .values({
        tenantId: this.tenantId,
        riskProfileId,
        transactionId: context.transactionId,
        guestId: context.guestId,
        alertType: alertData.type,
        severity: alertData.severity,
        title: alertData.title,
        description: alertData.description,
        priority: alertData.priority || 5,
      })
      .returning();

    securityLogger.info('[FraudDetectionService] Alert generated', {
      alertId: alert.id,
      type: alertData.type,
      severity: alertData.severity,
      tenantId: this.tenantId,
      guestId: context.guestId,
      transactionId: context.transactionId,
    });

    return alert;
  }

  /**
   * Create alert data based on risk level and context
   */
  private createAlertData(
    riskLevel: FraudScore['riskLevel'],
    context: TransactionContext,
    reason: string
  ): FraudAlertData {
    if (riskLevel === 'critical') {
      return {
        type: 'high_risk',
        severity: 'critical',
        title: 'Critical Fraud Risk Detected',
        description: `Transaction ${context.transactionId} flagged as critical risk. Amount: ${context.currency} ${context.amount}. ${reason}`,
        priority: 10,
      };
    }

    if (riskLevel === 'high') {
      return {
        type: 'high_risk',
        severity: 'warning',
        title: 'High Fraud Risk Detected',
        description: `Transaction ${context.transactionId} requires review. Amount: ${context.currency} ${context.amount}. ${reason}`,
        priority: 7,
      };
    }

    return {
      type: 'high_risk',
      severity: 'info',
      title: 'Elevated Fraud Risk',
      description: `Transaction ${context.transactionId} flagged for monitoring. Amount: ${context.currency} ${context.amount}. ${reason}`,
      priority: 5,
    };
  }

  // ==========================================================================
  // ALERT MANAGEMENT
  // ==========================================================================

  /**
   * Get fraud alerts for tenant
   */
  async getAlerts(options?: {
    status?: string;
    severity?: string;
    limit?: number;
  }): Promise<FraudAlert[]> {
    try {
      const filters = [eq(fraudAlerts.tenantId, this.tenantId)];
      if (options?.status) {
        filters.push(eq(fraudAlerts.status, options.status));
      }
      if (options?.severity) {
        filters.push(eq(fraudAlerts.severity, options.severity));
      }

      const baseQuery = db
        .select()
        .from(fraudAlerts)
        .where(and(...filters))
        .orderBy(desc(fraudAlerts.createdAt));

      const alerts = options?.limit ? await baseQuery.limit(options.limit) : await baseQuery;
      return alerts;
    } catch (error) {
      securityLogger.error('[FraudDetectionService] Error fetching alerts:', error);
      throw error;
    }
  }

  /**
   * Update alert status
   */
  async updateAlert(
    alertId: string,
    update: {
      status?: string;
      resolutionNotes?: string;
      resolvedBy?: string;
      isFalsePositive?: boolean;
    }
  ): Promise<FraudAlert> {
    try {
      const [alert] = await db
        .update(fraudAlerts)
        .set({
          ...update,
          resolvedAt: update.status === 'resolved' ? new Date() : undefined,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(fraudAlerts.id, alertId),
            eq(fraudAlerts.tenantId, this.tenantId)
          )
        )
        .returning();

      return alert;
    } catch (error) {
      securityLogger.error('[FraudDetectionService] Error updating alert:', error);
      throw error;
    }
  }

  // ==========================================================================
  // STATISTICS & REPORTING
  // ==========================================================================

  /**
   * Get fraud statistics for reporting
   */
  async getStatistics(periodType: 'daily' | 'weekly' | 'monthly' = 'daily'): Promise<FraudStatistics> {
    // Reason: Aggregation logic lives in fraud-statistics.ts to keep this file
    // under the 500-line modularity limit; the method preserves the public API.
    return getFraudStatistics(this.tenantId, periodType);
  }
}

/** PSD‑12 synchronous payment initiation gate (velocity, amounts, devices). */
export {
  PsdFraudGate,
  type FraudCheckRequest,
  type FraudCheckResult,
  type FraudAlert,
  type VelocityCheck,
  type FraudType,
  type RiskLevel,
} from './PsdPaymentFraudGate';
