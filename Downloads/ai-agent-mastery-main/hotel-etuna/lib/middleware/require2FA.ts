/**
 * 2FA Middleware for Payment Endpoints (PSD-12 Compliance)
 * 
 * Purpose: Enforce two-factor authentication for ALL payment initiations
 * Location: /lib/middleware/require2FA.ts
 * 
 * PSD-12 Requirement:
 * "Two-factor authentication REQUIRED for EVERY payment initiation"
 * 
 * Usage:
 * ```typescript
 * import { require2FA } from '@/lib/middleware/require2FA';
 * 
 * export async function POST(req: NextRequest) {
 *   const auth2FA = await require2FA(req);
 *   if (!auth2FA.verified) {
 *     return auth2FA.response;
 *   }
 *   // Proceed with payment...
 * }
 * ```
 * 
 * Following System Design Principles:
 * - Security Architecture (2FA Enforcement)
 * - API Security (Input Validation)
 * - Error Handling & Logging
 * 
 * @version 1.0.0
 * @since 2026-04-21
 */

import { NextRequest, NextResponse } from 'next/server';
import { TwoFactorAuthService, type TwoFactorMethod } from '@/lib/services/security/TwoFactorAuthService';
import { recordAuditTrail } from '@/lib/compliance/record-audit';

// ============================================================================
// TYPES
// ============================================================================

export interface TwoFactorVerificationResult {
  verified: boolean;
  userId?: string;
  response?: NextResponse;
  error?: string;
}

export interface TwoFactorHeaders {
  'X-2FA-Method': TwoFactorMethod;
  'X-2FA-Code': string;
  'X-User-Id': string;
}

// ============================================================================
// 2FA MIDDLEWARE
// ============================================================================

/**
 * Require 2FA verification for payment endpoints
 * PSD-12 COMPLIANCE: This must be called before EVERY payment initiation
 */
export async function require2FA(
  req: NextRequest,
  options?: {
    context?: string;
    metadata?: Record<string, unknown>;
  }
): Promise<TwoFactorVerificationResult> {
  try {
    // Extract 2FA headers
    const method = req.headers.get('X-2FA-Method') as TwoFactorMethod;
    const code = req.headers.get('X-2FA-Code');
    const userId = req.headers.get('X-User-Id');

    // Validate required headers
    if (!method || !code || !userId) {
      const error = getMissingHeadersError(method, code, userId);
      return {
        verified: false,
        response: NextResponse.json(
          {
            error: {
              code: '2FA_HEADERS_MISSING',
              message: error,
              details: {
                required: ['X-2FA-Method', 'X-2FA-Code', 'X-User-Id'],
                missing: [
                  !method && 'X-2FA-Method',
                  !code && 'X-2FA-Code',
                  !userId && 'X-User-Id',
                ].filter(Boolean),
              },
            },
          },
          { status: 400 }
        ),
        error,
      };
    }

    // Validate 2FA method
    if (!isValidTwoFactorMethod(method)) {
      const error = `Invalid 2FA method: ${method}`;
      return {
        verified: false,
        response: NextResponse.json(
          {
            error: {
              code: '2FA_METHOD_INVALID',
              message: error,
              details: {
                provided: method,
                allowed: ['totp', 'sms', 'biometric', 'backup_code'],
              },
            },
          },
          { status: 400 }
        ),
        error,
      };
    }

    // Verify 2FA code
    const verification = await TwoFactorAuthService.verify2FA({
      userId,
      method,
      code,
      context: options?.context || 'payment',
      metadata: {
        pathname: req.nextUrl.pathname,
        method: req.method,
        ip: getClientIP(req),
        userAgent: req.headers.get('user-agent') || undefined,
        ...options?.metadata,
      },
    });

    // Handle verification failure
    if (!verification.verified) {
      // Log failed attempt (non-blocking)
      recordAuditTrail({
        tenantId: null,
        userId,
        action: '2fa_payment_verification_failed',
        resourceType: 'payment_security',
        resourceId: req.nextUrl.pathname,
        oldValues: {
          method,
          reason: verification.error,
          remainingAttempts: verification.remainingAttempts,
        },
        request: req,
      }).catch((err) => {
        console.error('[require2FA] Audit logging failed:', err);
      });

      return {
        verified: false,
        userId,
        response: NextResponse.json(
          {
            error: {
              code: '2FA_VERIFICATION_FAILED',
              message: verification.error || 'Two-factor authentication failed',
              details: {
                method,
                remainingAttempts: verification.remainingAttempts,
              },
            },
          },
          { status: 401 }
        ),
        error: verification.error,
      };
    }

    // Log successful verification (non-blocking)
    recordAuditTrail({
      tenantId: null,
      userId,
      action: '2fa_payment_verification_success',
      resourceType: 'payment_security',
      resourceId: req.nextUrl.pathname,
      newValues: {
        method,
        context: options?.context || 'payment',
        timestamp: new Date().toISOString(),
      },
      request: req,
    }).catch((err) => {
      console.error('[require2FA] Audit logging failed:', err);
    });

    // Return success
    return {
      verified: true,
      userId,
    };
  } catch (error: any) {
    console.error('[require2FA] Unexpected error:', error);

    return {
      verified: false,
      response: NextResponse.json(
        {
          error: {
            code: '2FA_INTERNAL_ERROR',
            message: 'Two-factor authentication system error',
            details: {
              message: error.message,
            },
          },
        },
        { status: 500 }
      ),
      error: error.message,
    };
  }
}

/**
 * Require 2FA for payment initiation (specific wrapper)
 */
export async function require2FAForPayment(
  req: NextRequest,
  paymentData?: Record<string, unknown>
): Promise<TwoFactorVerificationResult> {
  return require2FA(req, {
    context: 'payment_initiation',
    metadata: {
      paymentAmount: paymentData?.amount,
      paymentCurrency: paymentData?.currency,
      paymentType: paymentData?.type,
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Require 2FA for high-value transactions (>= N$10,000)
 */
export async function require2FAForHighValueTransaction(
  req: NextRequest,
  amount: number,
  currency: string = 'NAD'
): Promise<TwoFactorVerificationResult> {
  const threshold = 10000; // N$10,000

  if (amount >= threshold) {
    return require2FA(req, {
      context: 'high_value_transaction',
      metadata: {
        amount,
        currency,
        threshold,
        timestamp: new Date().toISOString(),
      },
    });
  }

  // For transactions below threshold, still require 2FA (PSD-12 requirement)
  return require2FA(req, {
    context: 'standard_transaction',
    metadata: {
      amount,
      currency,
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Check if user has 2FA enabled
 */
export async function check2FAEnabled(userId: string): Promise<boolean> {
  try {
    const { db, twoFactorAuth, eq } = await import('@/lib/db');

    const configs = await db
      .select()
      .from(twoFactorAuth)
      .where(eq(twoFactorAuth.userId, userId))
      .limit(1);

    return configs.length > 0 && Boolean(configs[0].isEnabled);
  } catch (error) {
    console.error('[check2FAEnabled] Error:', error);
    return false;
  }
}

/**
 * Get user's enabled 2FA methods
 */
export async function getEnabled2FAMethods(userId: string): Promise<TwoFactorMethod[]> {
  try {
    const { db, twoFactorAuth, eq, and } = await import('@/lib/db');

    const configs = await db
      .select()
      .from(twoFactorAuth)
      .where(
        and(
          eq(twoFactorAuth.userId, userId),
          eq(twoFactorAuth.isEnabled, true)
        )
      );

    return configs.map((config) => config.method as TwoFactorMethod);
  } catch (error) {
    console.error('[getEnabled2FAMethods] Error:', error);
    return [];
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if 2FA method is valid
 */
function isValidTwoFactorMethod(method: string): method is TwoFactorMethod {
  return ['totp', 'sms', 'biometric', 'backup_code'].includes(method);
}

/**
 * Get missing headers error message
 */
function getMissingHeadersError(method: string | null, code: string | null, userId: string | null): string {
  const missing: string[] = [];
  if (!method) missing.push('X-2FA-Method');
  if (!code) missing.push('X-2FA-Code');
  if (!userId) missing.push('X-User-Id');

  return `Missing required 2FA headers: ${missing.join(', ')}. All payment requests must include two-factor authentication (PSD-12 requirement).`;
}

/**
 * Get client IP address
 */
function getClientIP(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0] ||
    req.headers.get('x-real-ip') ||
    'unknown'
  );
}

// ============================================================================
// RESPONSE HELPERS
// ============================================================================

/**
 * Create 2FA required response
 */
export function create2FARequiredResponse(
  message: string = 'Two-factor authentication required for this operation'
): NextResponse {
  return NextResponse.json(
    {
      error: {
        code: '2FA_REQUIRED',
        message,
        details: {
          required: true,
          headers: ['X-2FA-Method', 'X-2FA-Code', 'X-User-Id'],
          methods: ['totp', 'sms', 'biometric', 'backup_code'],
        },
      },
    },
    { status: 403 }
  );
}

/**
 * Create 2FA not enabled response
 */
export function create2FANotEnabledResponse(): NextResponse {
  return NextResponse.json(
    {
      error: {
        code: '2FA_NOT_ENABLED',
        message: 'Two-factor authentication must be enabled before making payments',
        details: {
          setup: '/api/security/2fa/enable',
          methods: ['totp', 'sms', 'biometric'],
        },
      },
    },
    { status: 403 }
  );
}
