/**
 * @fileoverview API route //api/admin/email-config-check
 * Location: /app/api/admin/email-config-check/route.ts
 */

/**
 * Email Configuration Check API Endpoint
 *
 * Purpose: Check if email SMTP configuration is properly set up
 * Location: /app/api/admin/email-config-check/route.ts
 */

import { NextRequest } from 'next/server';
import {
  withPlatformApiAuth,
  errorResponse,
  successResponse,
} from '@/lib/utils/api-helpers';
import { securityLogger } from '@/lib/utils/security-logger';

export async function GET(request: NextRequest) {
  return withPlatformApiAuth(
    request,
    async (_req, user) => {
      try {
        if (!user.tenantId) {
          return errorResponse('Unauthorized', 401, 'UNAUTHORIZED');
        }

        const config = {
          EMAIL_SMTP_HOST: {
            configured: !!process.env.EMAIL_SMTP_HOST,
            value: process.env.EMAIL_SMTP_HOST || 'Not set (defaults to mail.privateemail.com)',
          },
          EMAIL_SMTP_PORT: {
            configured: !!process.env.EMAIL_SMTP_PORT,
            value: process.env.EMAIL_SMTP_PORT || 'Not set (defaults to 465)',
          },
          EMAIL_SMTP_USER: {
            configured: !!(
              process.env.EMAIL_SMTP_USER &&
              process.env.EMAIL_SMTP_USER !== 'your_mailtrap_username'
            ),
            value: process.env.EMAIL_SMTP_USER ? '***configured***' : 'Not set',
          },
          EMAIL_SMTP_PASS: {
            configured: !!(
              process.env.EMAIL_SMTP_PASS &&
              process.env.EMAIL_SMTP_PASS !== 'your_mailtrap_password'
            ),
            value: process.env.EMAIL_SMTP_PASS ? '***configured***' : 'Not set',
          },
          EMAIL_SENDER_EMAIL: {
            configured: !!process.env.EMAIL_SENDER_EMAIL,
            value:
              process.env.EMAIL_SENDER_EMAIL || 'Not set (defaults to frontdesk@hoteletuna.com)',
          },
          EMAIL_SENDER_NAME: {
            configured: !!process.env.EMAIL_SENDER_NAME,
            value: process.env.EMAIL_SENDER_NAME || 'Not set (defaults to Sofia Concierge)',
          },
        };

        const allConfigured = Object.values(config).every((c) => c.configured);
        const criticalConfigured =
          config.EMAIL_SMTP_USER.configured && config.EMAIL_SMTP_PASS.configured;

        return successResponse({
          configured: allConfigured,
          criticalConfigured,
          config,
          message: allConfigured
            ? 'Email configuration is complete'
            : criticalConfigured
              ? 'Critical email settings are configured, but some optional settings are missing'
              : 'Email SMTP credentials are not configured. Emails will not be sent.',
        });
      } catch (error: unknown) {
        securityLogger.error('Error checking email configuration:', error);
        return errorResponse('Failed to check email configuration', 500, 'INTERNAL_ERROR');
      }
    },
    { rateLimit: true, requireRole: ['admin', 'owner', 'manager'] }
  );
}
