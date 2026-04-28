/**
 * Application Constants
 * 
 * Purpose: Centralized constants to avoid magic numbers and ensure consistency
 * Location: lib/config/constants.ts
 * 
 * Following DRY principle: Single source of truth for all thresholds and limits
 * 
 * @version 1.0.0
 * @since April 21, 2026
 */

// ============================================================================
// FRAUD DETECTION THRESHOLDS
// ============================================================================

export const FRAUD_DETECTION = {
  /** Risk score threshold for flagging transactions (0-100 scale) */
  SCORE_THRESHOLD: 75,
  
  /** High risk threshold requiring additional verification */
  HIGH_RISK_THRESHOLD: 90,
  
  /** Automatic block threshold */
  BLOCKED_THRESHOLD: 95,
  
  /** Maximum allowed failed attempts before account lock */
  MAX_FAILED_ATTEMPTS: 5,
  
  /** Velocity check: Max transactions per hour */
  MAX_TRANSACTIONS_PER_HOUR: 20,
  
  /** Velocity check: Max transactions per day */
  MAX_TRANSACTIONS_PER_DAY: 100,
} as const;

// ============================================================================
// PAYMENT LIMITS (Bank of Namibia Regulations)
// ============================================================================

export const PAYMENT_LIMITS = {
  /** Maximum single transaction amount in NAD */
  MAX_TRANSACTION_NAD: 1_000_000,
  
  /** Maximum daily transaction total in NAD */
  MAX_DAILY_AMOUNT_NAD: 5_000_000,
  
  /** Maximum monthly transaction total in NAD */
  MAX_MONTHLY_AMOUNT_NAD: 10_000_000,
  
  /** Maximum number of transactions per day */
  MAX_DAILY_TRANSACTIONS: 100,
  
  /** Minimum transaction amount in NAD */
  MIN_TRANSACTION_NAD: 1.00,
} as const;

// ============================================================================
// PSD-12: CYBERSECURITY STANDARDS
// ============================================================================

export const PSD12_COMPLIANCE = {
  /** Required system uptime (99.9%) */
  UPTIME_THRESHOLD: 0.999,
  
  /** Recovery Time Objective in seconds (2 hours) */
  RTO_SECONDS: 7200,
  
  /** Recovery Point Objective in seconds (5 minutes) */
  RPO_SECONDS: 300,
  
  /** Incident reporting deadline in hours (24 hours to BoN) */
  INCIDENT_REPORT_DEADLINE_HOURS: 24,
  
  /** Impact assessment deadline in days (30 days to BoN) */
  IMPACT_ASSESSMENT_DEADLINE_DAYS: 30,
  
  /** Uptime check interval in milliseconds */
  UPTIME_CHECK_INTERVAL_MS: 30_000, // 30 seconds
  
  /** Security audit log retention in days */
  AUDIT_LOG_RETENTION_DAYS: 2555, // 7 years
  
  /** Session timeout in minutes (PSD-12 Section 12.4) */
  SESSION_TIMEOUT_MINUTES: 15,
  
  /** Password minimum length */
  PASSWORD_MIN_LENGTH: 12,
  
  /** Required 2FA for transactions above this amount (NAD) */
  TWO_FA_REQUIRED_ABOVE_NAD: 1000,
} as const;

// ============================================================================
// PSD-4: CARD TRANSACTION STANDARDS
// ============================================================================

export const PSD4_COMPLIANCE = {
  /** CVV verification required */
  CVV_REQUIRED: true,
  
  /** 3D Secure mandatory for all card transactions */
  THREE_DS_MANDATORY: true,
  
  /** Card tokenization required (never store actual cards) */
  CARD_TOKENIZATION_REQUIRED: true,
  
  /** Device fingerprinting required */
  DEVICE_FINGERPRINTING_REQUIRED: true,
  
  /** Maximum card storage days (0 = tokenize immediately) */
  MAX_CARD_STORAGE_DAYS: 0,
} as const;

// ============================================================================
// PSD-7: PAYMENT EFFICIENCY STANDARDS
// ============================================================================

export const PSD7_COMPLIANCE = {
  /** Target payment processing time in milliseconds (3 seconds) */
  TARGET_PROCESSING_TIME_MS: 3000,
  
  /** Maximum acceptable processing time in milliseconds (5 seconds) */
  MAX_PROCESSING_TIME_MS: 5000,
  
  /** Target success rate percentage */
  TARGET_SUCCESS_RATE: 95.0,
  
  /** Minimum acceptable success rate percentage */
  MIN_SUCCESS_RATE: 90.0,
} as const;

// ============================================================================
// ETA 2019: ELECTRONIC TRANSACTIONS ACT
// ============================================================================

export const ETA_COMPLIANCE = {
  /** Transaction record retention in years */
  TRANSACTION_RETENTION_YEARS: 7,
  
  /** Communication record retention in years */
  COMMUNICATION_RETENTION_YEARS: 3,
  
  /** Contract record retention in years */
  CONTRACT_RETENTION_YEARS: 7,
  
  /** Audit log retention in years */
  AUDIT_LOG_RETENTION_YEARS: 7,
  
  /** Cooling-off period in days (consumer protection) */
  COOLING_OFF_PERIOD_DAYS: 7,
  
  /** Refund processing deadline in days */
  REFUND_PROCESSING_DAYS: 14,
} as const;

// ============================================================================
// OAUTH & AUTHENTICATION
// ============================================================================

export const OAUTH = {
  /** Token refresh buffer in milliseconds (refresh 1 min before expiry) */
  TOKEN_REFRESH_BUFFER_MS: 60_000,
  
  /** Token expiry check interval in milliseconds */
  TOKEN_CHECK_INTERVAL_MS: 30_000,
  
  /** Maximum token retry attempts */
  MAX_TOKEN_RETRY_ATTEMPTS: 3,
} as const;

// ============================================================================
// RATE LIMITING
// ============================================================================

export const RATE_LIMITS = {
  /** General API rate limit (requests per window) */
  DEFAULT_MAX_REQUESTS: 100,
  
  /** Rate limit window in milliseconds */
  DEFAULT_WINDOW_MS: 60_000, // 1 minute
  
  /** Payment endpoint rate limit (stricter) */
  PAYMENT_MAX_REQUESTS: 20,
  
  /** Auth endpoint rate limit */
  AUTH_MAX_REQUESTS: 10,
  
  /** Auth rate limit window (shorter for brute force protection) */
  AUTH_WINDOW_MS: 300_000, // 5 minutes
} as const;

// ============================================================================
// TIMEOUTS
// ============================================================================

export const TIMEOUTS = {
  /** API request timeout in milliseconds */
  API_REQUEST_TIMEOUT_MS: 30_000,
  
  /** Database query timeout in milliseconds */
  DB_QUERY_TIMEOUT_MS: 10_000,
  
  /** External service timeout in milliseconds */
  EXTERNAL_SERVICE_TIMEOUT_MS: 15_000,
  
  /** 3DS authentication timeout in milliseconds (Adumo spec: 5 minutes) */
  THREE_DS_TIMEOUT_MS: 300_000,
} as const;

// ============================================================================
// HTTP STATUS CODES (for consistency)
// ============================================================================

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  PAYMENT_REQUIRED: 402,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
} as const;

// ============================================================================
// PAYMENT STATUSES (eliminate string literals)
// ============================================================================

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  AWAITING_3DS = 'awaiting_3ds',
  AUTHORISED = 'authorised',
  PAID = 'paid',
  FAILED = 'failed',
  REVERSED = 'reversed',
  REFUNDED = 'refunded',
  CANCELLED = 'cancelled',
}

export enum BookingPaymentStatus {
  UNPAID = 'unpaid',
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

export enum TransactionType {
  TRANSFER = 'transfer',
  PAYMENT = 'payment',
  WITHDRAWAL = 'withdrawal',
  REFUND = 'refund',
}

// ============================================================================
// KYC LIMITS (Bank of Namibia)
// ============================================================================

export const KYC_LIMITS = {
  LITE: {
    MAX_TRANSACTION_NAD: 5000,
    MAX_BALANCE_NAD: 25000,
    MAX_MONTHLY_AMOUNT_NAD: 100000,
  },
  FULL: {
    MAX_TRANSACTION_NAD: 1_000_000,
    MAX_BALANCE_NAD: 10_000_000,
    MAX_MONTHLY_AMOUNT_NAD: 50_000_000,
  },
} as const;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if amount requires 2FA (PSD-12 compliance)
 */
export function requires2FA(amountNAD: number): boolean {
  return amountNAD >= PSD12_COMPLIANCE.TWO_FA_REQUIRED_ABOVE_NAD;
}

/**
 * Check if uptime meets PSD-12 threshold
 */
export function meetsUptimeThreshold(uptimePercent: number): boolean {
  return uptimePercent >= PSD12_COMPLIANCE.UPTIME_THRESHOLD;
}

/**
 * Check if processing time meets PSD-7 efficiency target
 */
export function meetsEfficiencyTarget(processingTimeMs: number): boolean {
  return processingTimeMs < PSD7_COMPLIANCE.TARGET_PROCESSING_TIME_MS;
}

/**
 * Check if fraud score requires manual review
 */
export function requiresFraudReview(score: number): boolean {
  return score >= FRAUD_DETECTION.SCORE_THRESHOLD && score < FRAUD_DETECTION.BLOCKED_THRESHOLD;
}

/**
 * Check if fraud score should block transaction
 */
export function shouldBlockFraud(score: number): boolean {
  return score >= FRAUD_DETECTION.BLOCKED_THRESHOLD;
}
