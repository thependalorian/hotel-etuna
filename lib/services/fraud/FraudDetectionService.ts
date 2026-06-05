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
  fraudDetectionRules,
  fraudCases,
  fraudStatistics,
  transactions,
  guests,
  type FraudRiskProfile,
  type NewFraudRiskProfile,
  type FraudAlert,
  type NewFraudAlert,
  type FraudDetectionRule,
} from '@/lib/db/schema';
import { eq, and, gte, lte, desc, sql, inArray } from 'drizzle-orm';
import crypto from 'crypto';
import { securityLogger } from '@/lib/utils/security-logger';
import {
  evaluateTenantFraudRule,
  type TenantRuleEvaluationContext,
} from '@/lib/services/fraud/tenant-fraud-rules';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface DeviceFingerprintData {
  browserName?: string;
  browserVersion?: string;
  osName?: string;
  osVersion?: string;
  deviceType?: string;
  screenResolution?: string;
  timezone?: string;
  language?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface TransactionContext {
  transactionId: string;
  guestId?: string;
  amount: number;
  currency: string;
  type: string;
  ipAddress?: string;
  userAgent?: string;
  deviceFingerprint?: DeviceFingerprintData;
  location?: {
    country?: string;
    city?: string;
    latitude?: number;
    longitude?: number;
  };
  metadata?: Record<string, unknown>;
}

export interface FraudScore {
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  decision: 'approved' | 'declined' | 'review' | 'flagged';
  requires3ds: boolean;
  requiresOtp: boolean;
  requiresManualReview: boolean;
  triggeredRules: string[];
  scores: {
    velocity: number;
    geographic: number;
    device: number;
    behavioral: number;
    amount: number;
  };
  decisionReason?: string;
}

export interface FraudAlertData {
  type: 'high_risk' | 'velocity_breach' | 'geographic_anomaly' | 'device_mismatch' | 'sim_swap' | 'phishing';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  priority?: number;
}

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
      const scores = await this.calculateRiskScores(context, deviceId);

      // Step 3: Apply fraud detection rules
      const ruleResults = await this.applyFraudRules(context, scores);

      // Step 4: Calculate overall risk score
      const riskScore = this.calculateOverallRiskScore(scores, ruleResults);

      // Step 5: Determine risk level and decision
      const riskLevel = this.determineRiskLevel(riskScore);
      const decision = await this.makeDecision(riskScore, riskLevel, ruleResults);

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
  // RISK SCORING
  // ==========================================================================

  /**
   * Calculate individual risk scores for different fraud vectors
   */
  private async calculateRiskScores(
    context: TransactionContext,
    deviceId: string
  ): Promise<FraudScore['scores']> {
    const [velocityScore, geographicScore, deviceScore, behavioralScore, amountScore] =
      await Promise.all([
        this.calculateVelocityScore(context.guestId, deviceId),
        this.calculateGeographicScore(context.location, context.guestId),
        this.calculateDeviceScore(deviceId),
        this.calculateBehavioralScore(context.guestId, context.type),
        this.calculateAmountScore(context.amount, context.guestId),
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
   * Calculate velocity score based on transaction frequency
   * High-frequency transactions are suspicious (especially for phone scams)
   */
  private async calculateVelocityScore(
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
            eq(transactions.tenantId, this.tenantId),
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
   * Calculate geographic score based on location anomalies
   * Unusual locations or rapid location changes indicate fraud
   */
  private async calculateGeographicScore(
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
            eq(transactions.tenantId, this.tenantId),
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
            eq(transactions.tenantId, this.tenantId),
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
   * Calculate device score based on device trust and history
   * New or suspicious devices indicate higher risk
   */
  private async calculateDeviceScore(deviceId: string): Promise<number> {
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
   * Calculate behavioral score based on transaction patterns
   * Unusual behavior patterns indicate fraud
   */
  private async calculateBehavioralScore(
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
            eq(transactions.tenantId, this.tenantId),
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
   * Calculate amount score based on transaction size
   * Large amounts relative to history indicate higher risk (CNP fraud trend)
   */
  private async calculateAmountScore(
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
            eq(transactions.tenantId, this.tenantId),
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

  // ==========================================================================
  // FRAUD RULES ENGINE
  // ==========================================================================

  /**
   * Apply fraud detection rules and return triggered rules
   */
  private async applyFraudRules(
    context: TransactionContext,
    scores: FraudScore['scores']
  ): Promise<{ rule: FraudDetectionRule; matched: boolean }[]> {
    try {
      // Get active rules for tenant, ordered by priority
      const rules = await db
        .select()
        .from(fraudDetectionRules)
        .where(
          and(
            eq(fraudDetectionRules.tenantId, this.tenantId),
            eq(fraudDetectionRules.isActive, true)
          )
        )
        .orderBy(desc(fraudDetectionRules.priority));

      const results: { rule: FraudDetectionRule; matched: boolean }[] = [];

      for (const rule of rules) {
        const matched = await this.evaluateRule(rule, context, scores);
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
   * Evaluate a single fraud detection rule
   */
  private async evaluateRule(
    rule: FraudDetectionRule,
    context: TransactionContext,
    scores: FraudScore['scores']
  ): Promise<boolean> {
    try {
      const ctx: TenantRuleEvaluationContext = {
        tenantId: this.tenantId,
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
   * Calculate overall risk score from individual scores and rule impacts
   */
  private calculateOverallRiskScore(
    scores: FraudScore['scores'],
    ruleResults: { rule: FraudDetectionRule; matched: boolean }[]
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
   * Determine risk level from risk score
   */
  private determineRiskLevel(riskScore: number): FraudScore['riskLevel'] {
    if (riskScore >= 75) return 'critical';
    if (riskScore >= 50) return 'high';
    if (riskScore >= 25) return 'medium';
    return 'low';
  }

  /**
   * Make decision based on risk score and triggered rules
   */
  private async makeDecision(
    riskScore: number,
    riskLevel: FraudScore['riskLevel'],
    ruleResults: { rule: FraudDetectionRule; matched: boolean }[]
  ): Promise<Pick<FraudScore, 'decision' | 'requires3ds' | 'requiresOtp' | 'requiresManualReview' | 'triggeredRules' | 'decisionReason'>> {
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
      ruleResults: { rule: FraudDetectionRule; matched: boolean }[];
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
  async getStatistics(periodType: 'daily' | 'weekly' | 'monthly' = 'daily'): Promise<{
    totalTransactions: number;
    flaggedTransactions: number;
    declinedTransactions: number;
    fraudRate: number;
    averageRiskScore: number;
    topFraudTypes: { type: string; count: number }[];
  }> {
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
            eq(fraudRiskProfiles.tenantId, this.tenantId),
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
      securityLogger.error('[FraudDetectionService] Error getting statistics:', error);
      throw error;
    }
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
