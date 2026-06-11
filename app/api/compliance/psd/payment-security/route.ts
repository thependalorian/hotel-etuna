/**
 * Payment Security Validation API
 * 
 * Purpose: Comprehensive security checks before payment processing
 * Compliance: PSD-12 (2FA), PSD-4 (CNP fraud), PSD-7 (efficiency)
 * Location: app/api/compliance/psd/payment-security/route.ts
 * 
 * PSD-12 Section 12.2:
 * "Two-factor authentication must be required for every payment."
 * 
 * PSD-4:
 * Card-not-present fraud detection with device fingerprinting, velocity checks.
 * 
 * PSD-7:
 * Fast payment processing (target: <3 seconds).
 */

import { NextRequest, NextResponse } from 'next/server';
import { withTenantApiAuth } from '@/lib/utils/api-helpers';
import { PaymentSecurityService } from '@/lib/services/payment/PaymentSecurityService';
import { entityId, entityIdOptional } from '@/lib/validation/entity-ids';
import { z } from 'zod';
import { securityLogger } from '@/lib/utils/security-logger';

// Request validation schema
const paymentSecuritySchema = z.object({
  userId: entityId('Invalid user ID'),
  tenantId: entityId('Invalid tenant ID'),
  bookingId: entityIdOptional('Invalid booking ID'),
  amount: z.number().positive('Amount must be positive'),
  currency: z.enum(['NAD', 'USD', 'EUR', 'GBP', 'ZAR']).default('NAD'),
  
  // Two-factor authentication (PSD-12 mandatory)
  twoFaCode: z.string().min(4, '2FA code required'),
  twoFaMethod: z.enum(['2fa_totp', '2fa_sms', '2fa_biometric', '2fa_backup_code']),
  
  // Device & network info (PSD-4 CNP fraud detection)
  deviceFingerprint: z.string().optional(),
  ipAddress: z.string().optional(), // IP validation removed - not in Zod core
  userAgent: z.string().optional(),
  geoCountry: z.string().length(2).optional(), // ISO 3166-1 alpha-2
  geoCity: z.string().optional(),
  
  // Card validation (PSD-4)
  cvvProvided: z.boolean().optional(),
  avsProvided: z.boolean().optional(),
  threeDSecureProvided: z.boolean().optional(),
});

/**
 * POST /api/compliance/psd/payment-security
 * 
 * Validate payment security before processing
 * 
 * Returns:
 * - securityPassed: boolean (allow payment or not)
 * - psd12Compliant: boolean (2FA verified)
 * - psd4Compliant: boolean (fraud checks passed)
 * - fraudScore: 0-100 (risk assessment)
 * - riskLevel: low, medium, high, critical
 */
export async function POST(req: NextRequest) {
  return withTenantApiAuth(req, async (request, user) => {
    const startTime = Date.now();
    
    try {
      // Parse and validate request
      const body = await request.json();
      const validatedData = paymentSecuritySchema.parse(body);
      
      securityLogger.info('[API:PaymentSecurity] Validating payment security', {
        userId: validatedData.userId,
        amount: validatedData.amount,
        currency: validatedData.currency,
        twoFaMethod: validatedData.twoFaMethod,
        tenantId: user.tenantId,
      });
      
      // Initialize service
      const securityService = new PaymentSecurityService();
      
      // Run comprehensive security validation
      const result = await securityService.validatePaymentSecurity({
        userId: validatedData.userId,
        tenantId: user.tenantId,
        bookingId: validatedData.bookingId,
        amount: validatedData.amount,
        currency: validatedData.currency,
        twoFaCode: validatedData.twoFaCode,
        twoFaMethod: validatedData.twoFaMethod,
        deviceFingerprint: validatedData.deviceFingerprint,
        ipAddress: validatedData.ipAddress || request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
        userAgent: validatedData.userAgent || request.headers.get('user-agent') || undefined,
        geoCountry: validatedData.geoCountry,
        geoCity: validatedData.geoCity,
      });
      
      const processingTime = Date.now() - startTime;
      
      securityLogger.info('[API:PaymentSecurity] Validation complete', {
        securityPassed: result.securityPassed,
        fraudScore: result.fraudScore,
        riskLevel: result.riskLevel,
        processingTimeMs: processingTime,
        psd7Efficient: processingTime < 3000, // PSD-7 target
        tenantId: user.tenantId,
      });
      
      // Return security assessment
      return NextResponse.json(
        {
          success: result.securityPassed,
          data: {
            securityPassed: result.securityPassed,
            paymentAllowed: result.paymentAllowed,
            
            // Individual checks
            twoFaVerified: result.twoFaVerified,
            fraudChecksPassed: result.fraudChecksPassed,
            velocityOk: result.velocityOk,
            geoOk: result.geoOk,
            deviceOk: result.deviceOk,
            
            // Risk assessment
            fraudScore: result.fraudScore,
            riskLevel: result.riskLevel,
            riskFactors: result.riskFactors,
            
            // Compliance status
            psd12Compliant: result.psd12Compliant,
            psd4Compliant: result.psd4Compliant,
            psd7Efficient: processingTime < 3000, // <3s target
            
            // Audit
            auditId: result.auditId,
            processingTimeMs: processingTime,
          },
          message: result.securityPassed 
            ? 'Payment security validated successfully'
            : result.blockReason || 'Payment blocked due to security concerns',
        },
        { status: result.securityPassed ? 200 : 403 }
      );
      
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          {
            success: false,
            error: 'Validation error',
            details: error.issues,
          },
          { status: 400 }
        );
      }
      
      securityLogger.error('[API:PaymentSecurity] Error:', error);
      
      return NextResponse.json(
        {
          success: false,
          error: 'Payment security validation failed',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      );
    }
  });
}

/**
 * GET /api/compliance/psd/payment-security/statistics
 * 
 * Get payment security statistics for dashboard
 */
export async function GET(req: NextRequest) {
  return withTenantApiAuth(req, async (request, user) => {
    try {
      const days = Number(request.nextUrl.searchParams.get('days') || '30');
      const securityService = new PaymentSecurityService();

      const stats = await securityService.getSecurityStatistics(user.tenantId, days);
      const complianceRate = await securityService.checkPSD12ComplianceRate(user.tenantId);
      const highRiskTxns = await securityService.getHighRiskTransactions(user.tenantId, 20);

      return NextResponse.json({
        success: true,
        data: {
          statistics: stats,
          complianceRate,
          highRiskTransactions: highRiskTxns,
          period: {
            days,
            start: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
            end: new Date(),
          },
        },
      });
    } catch (error) {
      securityLogger.error('[API:PaymentSecurity:Stats] Error:', error);

      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch payment security statistics',
        },
        { status: 500 }
      );
    }
  });
}
