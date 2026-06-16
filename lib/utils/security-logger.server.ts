/**
 * Security Logger (server)
 *
 * Purpose: Persist security events and structured server-side security logging.
 * Location: /lib/utils/security-logger.server.ts
 */

import { serverLogger } from '@/lib/utils/server-logger';
import type { SecurityEventType } from '@/lib/utils/security-logger';

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

export const securityLogger = serverLogger;

/**
 * Log security event to database
 */
export async function logSecurityEvent(event: SecurityEvent): Promise<void> {
  if (typeof window !== 'undefined') {
    return;
  }

  try {
    const { db } = await import('@/lib/db');
    const { systemLogs, auditTrail } = await import('@/lib/db/schema');

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
        resourceId: null,
        oldValues: {
          pathname: event.pathname,
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
    serverLogger.error('Failed to log security event', { error, eventType: event.type, pathname: event.pathname });
  }
}

type RequestLike = {
  nextUrl: { pathname: string };
  method: string;
  headers: { get: (name: string) => string | null };
};

function requestMeta(req: RequestLike) {
  return {
    pathname: req.nextUrl.pathname,
    method: req.method,
    ip:
      req.headers.get('x-forwarded-for')?.split(',')[0] ||
      req.headers.get('x-real-ip') ||
      'unknown',
    userAgent: req.headers.get('user-agent') || undefined,
  };
}

export async function logUnauthorizedAccess(
  req: RequestLike,
  reason: string,
  userId?: string,
  tenantId?: string,
): Promise<void> {
  await logSecurityEvent({
    type: 'unauthorized_access',
    ...requestMeta(req),
    userId,
    tenantId,
    details: { reason },
  });
}

export async function logRateLimitExceeded(
  req: RequestLike,
  userId?: string,
  tenantId?: string,
): Promise<void> {
  await logSecurityEvent({
    type: 'rate_limit_exceeded',
    ...requestMeta(req),
    userId,
    tenantId,
  });
}

export async function logInvalidCredentials(req: RequestLike, email?: string): Promise<void> {
  await logSecurityEvent({
    type: 'invalid_credentials',
    ...requestMeta(req),
    details: { email: email ? `${email.substring(0, 3)}***` : undefined },
  });
}

export async function logTenantAccessDenied(
  req: RequestLike,
  userId: string,
  attemptedTenantId: string,
): Promise<void> {
  await logSecurityEvent({
    type: 'tenant_access_denied',
    ...requestMeta(req),
    userId,
    details: { attemptedTenantId },
  });
}
