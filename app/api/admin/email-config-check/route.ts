/**
 * Email Configuration Check API Endpoint
 * 
 * Purpose: Check if email SMTP configuration is properly set up
 * Location: /app/api/admin/email-config-check/route.ts
 * 
 * This endpoint checks if required email environment variables are configured.
 */

import { NextResponse, NextRequest } from 'next/server';
import { getAuthenticatedUser } from '@/lib/utils/api-helpers';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const user = await getAuthenticatedUser(request);
    if (!user || !user.tenantId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Check environment variables (don't expose actual values)
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
        configured: !!(process.env.EMAIL_SMTP_USER && 
                       process.env.EMAIL_SMTP_USER !== 'your_mailtrap_username'),
        value: process.env.EMAIL_SMTP_USER ? '***configured***' : 'Not set',
      },
      EMAIL_SMTP_PASS: {
        configured: !!(process.env.EMAIL_SMTP_PASS && 
                       process.env.EMAIL_SMTP_PASS !== 'your_mailtrap_password'),
        value: process.env.EMAIL_SMTP_PASS ? '***configured***' : 'Not set',
      },
      EMAIL_SENDER_EMAIL: {
        configured: !!process.env.EMAIL_SENDER_EMAIL,
        value: process.env.EMAIL_SENDER_EMAIL || 'Not set (defaults to concierge@buffr.ai)',
      },
      EMAIL_SENDER_NAME: {
        configured: !!process.env.EMAIL_SENDER_NAME,
        value: process.env.EMAIL_SENDER_NAME || 'Not set (defaults to Sofia Concierge)',
      },
    };

    const allConfigured = Object.values(config).every(c => c.configured);
    const criticalConfigured = config.EMAIL_SMTP_USER.configured && config.EMAIL_SMTP_PASS.configured;

    return NextResponse.json({
      configured: allConfigured,
      criticalConfigured, // At minimum, SMTP user/pass must be set
      config,
      message: allConfigured 
        ? 'Email configuration is complete'
        : criticalConfigured
        ? 'Critical email settings are configured, but some optional settings are missing'
        : 'Email SMTP credentials are not configured. Emails will not be sent.',
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error checking email configuration:', error);
    return NextResponse.json({
      message: 'Failed to check email configuration',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    }, { status: 500 });
  }
}
