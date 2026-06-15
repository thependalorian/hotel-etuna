/**
 * Fraud Detection Types & Interfaces
 *
 * Purpose: Shared type definitions for the fraud detection pipeline.
 * Extracted from FraudDetectionService.ts to keep each module under 500 lines.
 *
 * Location: lib/services/fraud/fraud-types.ts
 *
 * @implements Rule 2: Modular design with separate concerns
 * @implements Rule 13: TypeScript with proper types
 */

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
