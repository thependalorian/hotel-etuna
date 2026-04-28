/**
 * Security Logger Utility
 *
 * Purpose: Log security events for monitoring and audit trails
 * Location: /lib/utils/security-logger.ts
 *
 * Implements:
 * - Security event logging
 * - Audit trail creation
 * - Error tracking
 *
 * Following System Design Principles:
 * - Monitoring & Observability
 * - Security Architecture
 */

import { db } from '@/lib/db';
import { systemLogs, auditTrail } from '@/lib/db/schema';
import { NextRequest } from 'next/server';

export type SecurityEventType =
  | 'unauthorized_access'
  | 'rate_limit_exceeded'
  | 'invalid_credentials'
  | 'session_expired'
  | 'tenant_access_denied'
  | 'role_access_denied'
  | 'api_error'
  | 'suspicious_activity';

interface SecurityEvent {
  type: SecurityEventType;
  pathname: string;
  method: string;
  ip?: string;
  userAgent?: string;
  userId?: string;
  tenantId?: string;
  details?: Record<string, unknown>;
}

/**
 * Log security event to database
 */
export async function logSecurityEvent(event: SecurityEvent): Promise<void> {
  try {
    if (event.tenantId) {
      await db.insert(systemLogs).values({
        tenantId: event.tenantId,
        userId: event.userId,
        level: 'warn',
        category: 'security',
        message: `Security event: ${event.type}`,
        metadata: {
          type: event.type,
          pathname: event.pathname,
          method: event.method,
          ip: event.ip,
          userAgent: event.userAgent,
          ...event.details,
        } as Record<string, unknown>,
        ipAddress: event.ip,
        userAgent: event.userAgent,
      });
    }

    if (event.userId && event.tenantId) {
      await db.insert(auditTrail).values({
        tenantId: event.tenantId,
        userId: event.userId,
        action: event.type,
        resourceType: 'security',
        resourceId: event.pathname,
        oldValues: {
          method: event.method,
          ...(event.details &&
          typeof event.details === 'object' &&
          !Array.isArray(event.details)
            ? event.details
            : {}),
        } as Record<string, unknown>,
        ipAddress: event.ip,
        userAgent: event.userAgent,
      });
    }
  } catch (error) {
    console.error('Security logging error:', error);
    console.warn('Security event:', event);
  }
}

/**
 * Log unauthorized access attempt
 */
export async function logUnauthorizedAccess(
  req: NextRequest,
  reason: string,
  userId?: string,
  tenantId?: string
): Promise<void> {
  await logSecurityEvent({
    type: 'unauthorized_access',
    pathname: req.nextUrl.pathname,
    method: req.method,
    ip:
      req.headers.get('x-forwarded-for')?.split(',')[0] ||
      req.headers.get('x-real-ip') ||
      'unknown',
    userAgent: req.headers.get('user-agent') || undefined,
    userId,
    tenantId,
    details: { reason },
  });
}

/**
 * Log rate limit exceeded
 */
export async function logRateLimitExceeded(
  req: NextRequest,
  userId?: string,
  tenantId?: string
): Promise<void> {
  await logSecurityEvent({
    type: 'rate_limit_exceeded',
    pathname: req.nextUrl.pathname,
    method: req.method,
    ip:
      req.headers.get('x-forwarded-for')?.split(',')[0] ||
      req.headers.get('x-real-ip') ||
      'unknown',
    userAgent: req.headers.get('user-agent') || undefined,
    userId,
    tenantId,
  });
}

/**
 * Log invalid credentials attempt
 */
export async function logInvalidCredentials(
  req: NextRequest,
  email?: string
): Promise<void> {
  await logSecurityEvent({
    type: 'invalid_credentials',
    pathname: req.nextUrl.pathname,
    method: req.method,
    ip:
      req.headers.get('x-forwarded-for')?.split(',')[0] ||
      req.headers.get('x-real-ip') ||
      'unknown',
    userAgent: req.headers.get('user-agent') || undefined,
    details: { email: email ? email.substring(0, 3) + '***' : undefined },
  });
}

/**
 * Log tenant access denied
 */
export async function logTenantAccessDenied(
  req: NextRequest,
  userId: string,
  attemptedTenantId: string
): Promise<void> {
  await logSecurityEvent({
    type: 'tenant_access_denied',
    pathname: req.nextUrl.pathname,
    method: req.method,
    ip:
      req.headers.get('x-forwarded-for')?.split(',')[0] ||
      req.headers.get('x-real-ip') ||
      'unknown',
    userAgent: req.headers.get('user-agent') || undefined,
    userId,
    details: { attemptedTenantId },
  });
}
