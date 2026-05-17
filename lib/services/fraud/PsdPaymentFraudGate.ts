/**
 * Fraud Detection Service (PSD-12 Compliance)
 * 
 * Purpose: Detect and prevent fraudulent transactions and activities
 * Location: /lib/services/fraud/PsdPaymentFraudGate.ts (PSD‑12 synchronous payment gate)
 * 
 * PSD-12 Requirements:
 * - Real-time fraud detection for all payment transactions
 * - Rate limiting and velocity checks
 * - Device fingerprinting and behavior analysis
 * - Automated alerts and incident logging
 * 
 * Implements:
 * - Velocity checks (transaction frequency, amount limits)
 * - Geolocation analysis (unusual location patterns)
 * - Device fingerprinting (detect suspicious devices)
 * - Behavior analysis (unusual activity patterns)
 * - Risk scoring (0-100 scale)
 * - Automated blocking for high-risk transactions
 * 
 * Following System Design Principles:
 * - Security Architecture (Fraud Prevention)
 * - Real-time Processing
 * - Error Handling & Logging
 * 
 * @version 1.0.0
 * @since 2026-04-21
 */

import { db, fraudRiskProfiles, fraudAlerts, fraudDeviceFingerprints, transactions } from '@/lib/db';
import { eq, and, gte, sql } from 'drizzle-orm';
import { applyTenantFraudRules } from '@/lib/services/fraud/tenant-fraud-rules';

// ============================================================================
// TYPES
// ============================================================================

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type FraudType = 'velocity' | 'geolocation' | 'device' | 'behavior' | 'amount' | 'unknown';

export interface FraudCheckRequest {
  userId: string;
  tenantId?: string;
  transactionAmount: number;
  transactionCurrency: string;
  transactionType: string; // 'payment', 'withdrawal', 'transfer', etc.
  ipAddress?: string;
  userAgent?: string;
  deviceId?: string;
  location?: {
    country?: string;
    city?: string;
    latitude?: number;
    longitude?: number;
  };
  metadata?: Record<string, unknown>;
}

export interface FraudCheckResult {
  allowed: boolean;
  riskScore: number; // 0-100 (0 = no risk, 100 = highest risk)
  riskLevel: RiskLevel;
  reasons: string[];
  alerts: FraudAlert[];
  blocked: boolean;
  requiresReview: boolean;
}

export interface FraudAlert {
  type: FraudType;
  severity: RiskLevel;
  message: string;
  details?: Record<string, unknown>;
}

export interface VelocityCheck {
  transactionCount24h: number;
  transactionAmount24h: number;
  transactionCount1h: number;
  transactionAmount1h: number;
  isExceeded: boolean;
  reason?: string;
}

// ============================================================================
// PSD PAYMENT FRAUD GATE
// ============================================================================

export class PsdFraudGate {
  // Risk thresholds
  private static readonly RISK_THRESHOLD_LOW = 30;
  private static readonly RISK_THRESHOLD_MEDIUM = 50;
  private static readonly RISK_THRESHOLD_HIGH = 70;
  private static readonly RISK_THRESHOLD_CRITICAL = 90;

  // Velocity limits
  private static readonly MAX_TRANSACTIONS_PER_HOUR = 10;
  private static readonly MAX_TRANSACTIONS_PER_DAY = 50;
  private static readonly MAX_AMOUNT_PER_HOUR = 50000; // N$50,000
  private static readonly MAX_AMOUNT_PER_DAY = 200000; // N$200,000

  // Amount thresholds (NAD)
  private static readonly LARGE_TRANSACTION_THRESHOLD = 10000; // N$10,000
  private static readonly SUSPICIOUS_TRANSACTION_THRESHOLD = 50000; // N$50,000

  // Device fingerprint expiry
  private static readonly DEVICE_TRUST_PERIOD_DAYS = 90;

  /**
   * Check transaction for fraud
   * PSD-12 REQUIREMENT: Real-time fraud detection
   */
  static async checkTransaction(request: FraudCheckRequest): Promise<FraudCheckResult> {
    try {
      const { userId, tenantId, transactionAmount, transactionCurrency } = request;

      const alerts: FraudAlert[] = [];
      let riskScore = 0;
      const reasons: string[] = [];

      // 1. Velocity Check (transaction frequency and amounts)
      const velocityCheck = await this.checkVelocity(userId, transactionAmount);
      if (velocityCheck.isExceeded) {
        riskScore += 30;
        reasons.push(velocityCheck.reason || 'Velocity limit exceeded');
        alerts.push({
          type: 'velocity',
          severity: 'high',
          message: velocityCheck.reason || 'Unusual transaction velocity detected',
          details: velocityCheck as unknown as Record<string, unknown>,
        });
      }

      // 2. Amount Check (unusually large transactions)
      if (transactionAmount >= this.SUSPICIOUS_TRANSACTION_THRESHOLD) {
        riskScore += 40;
        reasons.push('Suspicious transaction amount');
        alerts.push({
          type: 'amount',
          severity: 'critical',
          message: `Transaction amount (${transactionCurrency} ${transactionAmount.toLocaleString()}) exceeds suspicious threshold`,
          details: { amount: transactionAmount, threshold: this.SUSPICIOUS_TRANSACTION_THRESHOLD },
        });
      } else if (transactionAmount >= this.LARGE_TRANSACTION_THRESHOLD) {
        riskScore += 20;
        reasons.push('Large transaction amount');
        alerts.push({
          type: 'amount',
          severity: 'medium',
          message: `Large transaction amount (${transactionCurrency} ${transactionAmount.toLocaleString()})`,
          details: { amount: transactionAmount, threshold: this.LARGE_TRANSACTION_THRESHOLD },
        });
      }

      // 3. Device Fingerprint Check
      if (request.deviceId) {
        const deviceCheck = await this.checkDevice(userId, request.deviceId);
        if (!deviceCheck.trusted) {
          riskScore += deviceCheck.riskScore;
          reasons.push(deviceCheck.reason);
          alerts.push({
            type: 'device',
            severity: deviceCheck.severity,
            message: deviceCheck.reason,
            details: { deviceId: request.deviceId },
          });
        }
      }

      // 4. Geolocation Check
      if (request.location) {
        const locationCheck = await this.checkGeolocation(userId, request.location);
        if (locationCheck.suspicious) {
          riskScore += locationCheck.riskScore;
          reasons.push(locationCheck.reason);
          alerts.push({
            type: 'geolocation',
            severity: locationCheck.severity,
            message: locationCheck.reason,
            details: request.location,
          });
        }
      }

      // 5. IP Address Check
      if (request.ipAddress) {
        const ipCheck = await this.checkIPAddress(request.ipAddress);
        if (ipCheck.suspicious) {
          riskScore += ipCheck.riskScore;
          reasons.push(ipCheck.reason);
          alerts.push({
            type: 'behavior',
            severity: ipCheck.severity,
            message: ipCheck.reason,
            details: { ipAddress: request.ipAddress },
          });
        }
      }

      // 6. Behavioral Analysis
      const behaviorCheck = await this.analyzeBehavior(userId);
      if (behaviorCheck.anomalous) {
        riskScore += behaviorCheck.riskScore;
        reasons.push(behaviorCheck.reason);
        alerts.push({
          type: 'behavior',
          severity: behaviorCheck.severity,
          message: behaviorCheck.reason,
          details: behaviorCheck.details,
        });
      }

      let tenantRuleFlags = { blocked: false, requiresReview: false };
      if (tenantId) {
        const billingCountry =
          typeof request.metadata?.billingCountry === 'string'
            ? request.metadata.billingCountry
            : request.location?.country;
        const propertyCountry =
          typeof request.metadata?.propertyCountry === 'string'
            ? request.metadata.propertyCountry
            : 'NA';
        const tenantRules = await applyTenantFraudRules({
          tenantId,
          userId,
          amount: transactionAmount,
          currency: transactionCurrency,
          billingCountry,
          propertyCountry,
        });
        tenantRuleFlags = {
          blocked: tenantRules.blocked,
          requiresReview: tenantRules.requiresReview,
        };
        if (tenantRules.matchedRules.length > 0) {
          riskScore = Math.min(100, riskScore + tenantRules.riskScoreDelta);
          reasons.push(...tenantRules.reasons);
          for (const name of tenantRules.matchedRules) {
            alerts.push({
              type: 'amount',
              severity: tenantRules.blocked ? 'critical' : 'high',
              message: `Rule matched: ${name}`,
            });
          }
        }
      }

      // Normalize risk score (0-100)
      riskScore = Math.min(100, Math.max(0, riskScore));

      // Determine risk level
      const riskLevel = this.getRiskLevel(riskScore);

      // Determine if transaction should be blocked / reviewed
      let blocked =
        riskScore >= this.RISK_THRESHOLD_CRITICAL || tenantRuleFlags.blocked;
      let requiresReview =
        (riskScore >= this.RISK_THRESHOLD_HIGH && !blocked) ||
        (tenantRuleFlags.requiresReview && !blocked);

      // Log fraud alerts to database
      if (alerts.length > 0) {
        await this.logFraudAlerts(userId, tenantId, alerts, riskScore, riskLevel);
      }

      // Update user's fraud risk profile
      await this.updateRiskProfile(userId, tenantId, riskScore, riskLevel);

      return {
        allowed: !blocked,
        riskScore,
        riskLevel,
        reasons,
        alerts,
        blocked,
        requiresReview,
      };
    } catch (error: unknown) {
      console.error('[PsdFraudGate] Check transaction error:', error);

      const failClosed =
        process.env.NODE_ENV === 'production' ||
        process.env.FRAUD_GATE_FAIL_CLOSED === 'true';

      if (failClosed) {
        return {
          allowed: false,
          riskScore: 100,
          riskLevel: 'critical',
          reasons: ['Fraud detection unavailable — transaction blocked'],
          alerts: [],
          blocked: true,
          requiresReview: false,
        };
      }

      return {
        allowed: true,
        riskScore: 50,
        riskLevel: 'medium',
        reasons: ['Fraud detection service unavailable — manual review'],
        alerts: [],
        blocked: false,
        requiresReview: true,
      };
    }
  }

  /**
   * Check transaction velocity (frequency and amounts)
   */
  private static async checkVelocity(
    userId: string,
    amount: number
  ): Promise<VelocityCheck> {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Get recent transactions
    const recentTransactions = await db
      .select({
        count: sql<number>`count(*)`,
        total: sql<number>`sum(${transactions.amount})`,
        createdAt: transactions.createdAt,
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.guestId, userId),
          gte(transactions.createdAt, oneDayAgo)
        )
      )
      .groupBy(transactions.createdAt);

    // Calculate 1-hour window
    const transactions1h = recentTransactions.filter(
      (t) => Boolean(t.createdAt) && (t.createdAt as Date) >= oneHourAgo
    );
    const transactionCount1h = transactions1h.length;
    const transactionAmount1h = transactions1h.reduce(
      (sum, t) => sum + Number(t.total || 0),
      0
    );

    // Calculate 24-hour window
    const transactionCount24h = recentTransactions.length;
    const transactionAmount24h = recentTransactions.reduce(
      (sum, t) => sum + Number(t.total || 0),
      0
    );

    // Check limits
    const isExceeded =
      transactionCount1h >= this.MAX_TRANSACTIONS_PER_HOUR ||
      transactionAmount1h + amount >= this.MAX_AMOUNT_PER_HOUR ||
      transactionCount24h >= this.MAX_TRANSACTIONS_PER_DAY ||
      transactionAmount24h + amount >= this.MAX_AMOUNT_PER_DAY;

    let reason: string | undefined;
    if (transactionCount1h >= this.MAX_TRANSACTIONS_PER_HOUR) {
      reason = `Transaction limit exceeded (${transactionCount1h}/${this.MAX_TRANSACTIONS_PER_HOUR} per hour)`;
    } else if (transactionAmount1h + amount >= this.MAX_AMOUNT_PER_HOUR) {
      reason = `Amount limit exceeded (${(transactionAmount1h + amount).toLocaleString()}/${this.MAX_AMOUNT_PER_HOUR.toLocaleString()} per hour)`;
    } else if (transactionCount24h >= this.MAX_TRANSACTIONS_PER_DAY) {
      reason = `Transaction limit exceeded (${transactionCount24h}/${this.MAX_TRANSACTIONS_PER_DAY} per day)`;
    } else if (transactionAmount24h + amount >= this.MAX_AMOUNT_PER_DAY) {
      reason = `Amount limit exceeded (${(transactionAmount24h + amount).toLocaleString()}/${this.MAX_AMOUNT_PER_DAY.toLocaleString()} per day)`;
    }

    return {
      transactionCount24h,
      transactionAmount24h,
      transactionCount1h,
      transactionAmount1h,
      isExceeded,
      reason,
    };
  }

  /**
   * Check device fingerprint
   */
  private static async checkDevice(
    userId: string,
    deviceId: string
  ): Promise<{
    trusted: boolean;
    riskScore: number;
    severity: RiskLevel;
    reason: string;
  }> {
    // Check if device is registered
    const device = await db.query.fraudDeviceFingerprints.findFirst({
      where: and(
        eq(fraudDeviceFingerprints.guestId, userId),
        eq(fraudDeviceFingerprints.deviceId, deviceId)
      ),
    });

    if (!device) {
      // New device - moderate risk
      return {
        trusted: false,
        riskScore: 25,
        severity: 'medium',
        reason: 'New/unrecognized device',
      };
    }

    // Check if device is blocked
    // Check if device is trusted (used within trust period)
    const trustPeriodStart = new Date(
      Date.now() - this.DEVICE_TRUST_PERIOD_DAYS * 24 * 60 * 60 * 1000
    );

    if (device.lastSeenAt && device.lastSeenAt >= trustPeriodStart) {
      return {
        trusted: true,
        riskScore: 0,
        severity: 'low',
        reason: 'Trusted device',
      };
    }

    // Device not used recently - low risk
    return {
      trusted: false,
      riskScore: 10,
      severity: 'low',
      reason: 'Device not used recently',
    };
  }

  /**
   * Check geolocation for suspicious patterns
   */
  private static async checkGeolocation(
    userId: string,
    location: {
      country?: string;
      city?: string;
      latitude?: number;
      longitude?: number;
    }
  ): Promise<{
    suspicious: boolean;
    riskScore: number;
    severity: RiskLevel;
    reason: string;
  }> {
    // Get user's typical location from risk profile
    const profile = await db.query.fraudRiskProfiles.findFirst({
      where: eq(fraudRiskProfiles.guestId, userId),
    });

    if (!profile) {
      // No profile yet - no risk
      return {
        suspicious: false,
        riskScore: 0,
        severity: 'low',
        reason: 'No location history',
      };
    }

    // Check if location is from a different country
    const typicalCountry = profile.deviceFingerprint && typeof profile.deviceFingerprint === 'object'
      ? ((profile.deviceFingerprint as Record<string, unknown>).typicalCountry as string | undefined)
      : profile.guestId
        ? undefined
        : undefined;
    if (typicalCountry && location.country && location.country !== typicalCountry) {
      return {
        suspicious: true,
        riskScore: 35,
        severity: 'high',
        reason: `Unusual location: ${location.country} (typical: ${typicalCountry})`,
      };
    }

    return {
      suspicious: false,
      riskScore: 0,
      severity: 'low',
      reason: 'Location within expected range',
    };
  }

  /**
   * Check IP address for suspicious patterns
   */
  private static async checkIPAddress(
    ipAddress: string
  ): Promise<{
    suspicious: boolean;
    riskScore: number;
    severity: RiskLevel;
    reason: string;
  }> {
    // In production, integrate with IP intelligence services
    // For now, basic checks

    // Check for private IP addresses (should not be used in production)
    if (this.isPrivateIP(ipAddress)) {
      return {
        suspicious: true,
        riskScore: 15,
        severity: 'medium',
        reason: 'Private IP address detected',
      };
    }

    return {
      suspicious: false,
      riskScore: 0,
      severity: 'low',
      reason: 'IP address appears legitimate',
    };
  }

  /**
   * Analyze behavior patterns
   */
  private static async analyzeBehavior(
    userId: string
  ): Promise<{
    anomalous: boolean;
    riskScore: number;
    severity: RiskLevel;
    reason: string;
    details?: Record<string, unknown>;
  }> {
    // Get user's typical behavior from risk profile
    const profile = await db.query.fraudRiskProfiles.findFirst({
      where: eq(fraudRiskProfiles.guestId, userId),
    });

    if (!profile) {
      return {
        anomalous: false,
        riskScore: 0,
        severity: 'low',
        reason: 'No behavior history',
      };
    }

    // Check for unusual transaction time (outside typical hours)
    const hour = new Date().getHours();
    const typicalHours = profile.deviceFingerprint && typeof profile.deviceFingerprint === 'object'
      ? ((profile.deviceFingerprint as Record<string, unknown>).typicalTransactionHours as number[] | undefined) ?? []
      : [];

    if (typicalHours.length > 0 && !typicalHours.includes(hour)) {
      return {
        anomalous: true,
        riskScore: 20,
        severity: 'medium',
        reason: `Unusual transaction time (${hour}:00)`,
        details: { hour, typicalHours },
      };
    }

    return {
      anomalous: false,
      riskScore: 0,
      severity: 'low',
      reason: 'Behavior within expected patterns',
    };
  }

  /**
   * Log fraud alerts to database
   */
  private static async logFraudAlerts(
    userId: string,
    tenantId: string | undefined,
    alerts: FraudAlert[],
    riskScore: number,
    riskLevel: RiskLevel
  ): Promise<void> {
    try {
      for (const alert of alerts) {
        await db.insert(fraudAlerts).values({
          tenantId: tenantId || '00000000-0000-0000-0000-000000000000',
          guestId: userId || null,
          alertType: alert.type,
          severity: alert.severity,
          title: `Fraud alert: ${alert.type}`,
          description: alert.message,
          status: 'pending',
          priority: riskLevel === 'critical' ? 10 : riskLevel === 'high' ? 7 : 5,
        });
      }
    } catch (error) {
      console.error('[FraudDetectionService] Log fraud alerts error:', error);
    }
  }

  /**
   * Update user's fraud risk profile
   */
  private static async updateRiskProfile(
    userId: string,
    tenantId: string | undefined,
    riskScore: number,
    riskLevel: RiskLevel
  ): Promise<void> {
    try {
      const existing = await db.query.fraudRiskProfiles.findFirst({
        where: eq(fraudRiskProfiles.guestId, userId),
      });

      if (existing) {
        // Update existing profile
        await db
          .update(fraudRiskProfiles)
          .set({
            riskScore: riskScore.toString(),
            riskLevel,
            updatedAt: new Date(),
          })
          .where(eq(fraudRiskProfiles.id, existing.id));
      } else {
        // Create new profile
        await db.insert(fraudRiskProfiles).values({
          tenantId: tenantId || '00000000-0000-0000-0000-000000000000',
          guestId: userId,
          riskScore: riskScore.toString(),
          riskLevel,
          decision: 'pending',
          detectionRules: [],
          deviceFingerprint: {},
          detectedAt: new Date(),
          updatedAt: new Date(),
        });
      }
    } catch (error) {
      console.error('[FraudDetectionService] Update risk profile error:', error);
    }
  }

  /**
   * Get risk level from risk score
   */
  private static getRiskLevel(riskScore: number): RiskLevel {
    if (riskScore >= this.RISK_THRESHOLD_CRITICAL) return 'critical';
    if (riskScore >= this.RISK_THRESHOLD_HIGH) return 'high';
    if (riskScore >= this.RISK_THRESHOLD_MEDIUM) return 'medium';
    return 'low';
  }

  /**
   * Check if IP is private
   */
  private static isPrivateIP(ip: string): boolean {
    const privateRanges = [
      /^10\./,
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
      /^192\.168\./,
      /^127\./,
      /^localhost$/,
    ];

    return privateRanges.some((range) => range.test(ip));
  }

  /**
   * Register device fingerprint
   */
  static async registerDevice(
    userId: string,
    tenantId: string | undefined,
    deviceId: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    try {
      await db.insert(fraudDeviceFingerprints).values({
        tenantId: tenantId || '00000000-0000-0000-0000-000000000000',
        guestId: userId,
        deviceId,
        deviceHash: deviceId, // In production, generate actual fingerprint hash
        deviceType: metadata?.deviceType as string || null,
        browserName: metadata?.browser as string || null,
        osName: metadata?.os as string || null,
        trustScore: '0',
        firstSeenAt: new Date(),
        lastSeenAt: new Date(),
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error('[FraudDetectionService] Register device error:', error);
    }
  }

  /**
   * Block device
   */
  static async blockDevice(deviceId: string): Promise<void> {
    try {
      await db
        .update(fraudDeviceFingerprints)
        .set({
          isTrusted: false,
          updatedAt: new Date(),
        })
        .where(eq(fraudDeviceFingerprints.deviceId, deviceId));
    } catch (error) {
      console.error('[FraudDetectionService] Block device error:', error);
    }
  }
}

