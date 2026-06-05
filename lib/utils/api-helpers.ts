/**
 * API Helper Utilities
 * 
 * Purpose: Common utilities for API routes following system design principles
 * Location: /lib/utils/api-helpers.ts
 * 
 * Implements:
 * - Tenant context extraction
 * - User authentication helpers
 * - Error response formatting
 * - Request validation
 * 
 * Following System Design Principles:
 * - API Design Best Practices
 * - Security Architecture
 * - Multi-Tenancy Strategy
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { getTenantContext as getTenantContextFromValidation } from './tenant-validation';
import { checkRateLimit, shouldRateLimit } from './rate-limit';
import { logUnauthorizedAccess, logRateLimitExceeded } from './security-logger';
import { runWithTenantContext } from '@/lib/auth/tenant-context';
import { stackServerApp } from '@/stack';
import { isStackAuthServerConfigured } from '@/lib/auth/stack-env';
import { db, users, tenants } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { jwtVerify } from 'jose';
import { jwks } from '@/lib/auth/jwks';
import { z } from 'zod';
import { isGuestConsumerRole } from '@/lib/auth/roles';
import { isPlatformAdmin } from '@/lib/auth/platform-admin';
import { AppError } from '@/lib/utils/errors';
import { securityLogger } from '@/lib/utils/security-logger';

type StackJwtPayload = {
  sub?: string;
  email?: string;
  name?: string;
  email_verified?: boolean;
  code?: string;
  message?: string;
};

type StackAuthUser = {
  id: string;
  primaryEmail: string | null;
  displayName?: string | null;
  primaryEmailVerified?: boolean;
};

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown error';
}

function getErrorStack(error: unknown): string | undefined {
  return error instanceof Error ? error.stack : undefined;
}

const PRODUCTION_STRIPPED_DETAIL_KEYS = new Set([
  'stack',
  'meta',
  'cause',
  'trace',
  'sql',
  'query',
  'connectionString',
  'DATABASE_URL',
]);

/** Strip internal fields from API error payloads in production (Gap 5). */
export function sanitizeErrorDetails(details: unknown): unknown | undefined {
  if (details === undefined || details === null) {
    return undefined;
  }
  if (process.env.NODE_ENV !== 'production') {
    return details;
  }
  if (Array.isArray(details)) {
    return details;
  }
  if (typeof details !== 'object') {
    return undefined;
  }
  const record = details as Record<string, unknown>;
  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(record)) {
    if (PRODUCTION_STRIPPED_DETAIL_KEYS.has(key)) {
      continue;
    }
    if (key === 'fieldErrors' || key === 'formErrors') {
      cleaned[key] = value;
      continue;
    }
    if (typeof value === 'string' && value.length > 500) {
      continue;
    }
    cleaned[key] = value;
  }
  return Object.keys(cleaned).length > 0 ? cleaned : undefined;
}

/**
 * Get authenticated user from session
 * Checks Stack Auth first, then falls back to NextAuth
 */
export async function getAuthenticatedUser(req?: NextRequest) {
  // Check Stack Auth first (if configured)
  const stackAuthConfigured = Boolean(stackServerApp && isStackAuthServerConfigured());
  
  if (stackAuthConfigured && stackServerApp && req) {
    try {
      // First, try to get user from Stack Auth session cookies (from handler)
      const sessionStackUser = await stackServerApp.getUser({ tokenStore: req });
      let stackUser: StackAuthUser | null = sessionStackUser
        ? {
            id: sessionStackUser.id,
            primaryEmail: sessionStackUser.primaryEmail,
            displayName: sessionStackUser.displayName ?? null,
            primaryEmailVerified: sessionStackUser.primaryEmailVerified ?? false,
          }
        : null;
      
      // If no session cookie, check for access token in Authorization header or cookies
      if (!stackUser) {
        const authHeader = req.headers.get('authorization');
        const cookies = req.headers.get('cookie') || '';
        
        let accessToken: string | null = null;
        
        // Check for Stack Auth access token in Authorization header
        if (authHeader && authHeader.startsWith('Bearer ')) {
          accessToken = authHeader.replace('Bearer ', '').trim();
        }
        
        // Check for stack-access-token cookie (from REST API)
        if (!accessToken && cookies) {
          // Match: stack-access-token=<token> (handle URL encoding, spaces, etc.)
          const accessTokenMatch = cookies.match(/stack-access-token=([^;\s]+)/);
          if (accessTokenMatch && accessTokenMatch[1]) {
            accessToken = decodeURIComponent(accessTokenMatch[1].trim());
          }
        }
        
        // If we have an access token, verify it using JWT verification with JWKS
        // This is faster and works in Edge Runtime (unlike REST API calls)
        if (accessToken) {
          try {
            // Stack Auth JWT issuer format: https://api.stack-auth.com/api/v1/projects/{PROJECT_ID}
            const projectId = process.env.NEXT_PUBLIC_STACK_PROJECT_ID!;
            const expectedIssuer = `https://api.stack-auth.com/api/v1/projects/${projectId}`;
            
            // Verify JWT using JWKS with correct issuer
            let payload: StackJwtPayload;
            try {
              const result = await jwtVerify(accessToken, jwks, {
                issuer: expectedIssuer,
                audience: projectId, // Stack Auth uses project ID as audience
              });
              payload = result.payload as StackJwtPayload;
              securityLogger.info('[API Helpers] JWT verified successfully with issuer validation', { userId: payload.sub, email: payload.email });
            } catch {
              // If issuer/audience validation fails, try without validation (still verify signature)
              // This handles cases where issuer format might vary
              try {
                const result = await jwtVerify(accessToken, jwks);
                payload = result.payload as StackJwtPayload;
                securityLogger.info('[API Helpers] JWT verified successfully (without issuer check)', { userId: payload.sub, email: payload.email });
              } catch (verifyError: unknown) {
                throw verifyError;
              }
            }
            
            // Extract user info from JWT payload
            // Stack Auth JWTs contain: sub (user ID), email, name, etc.
            if (payload && payload.sub) {
              securityLogger.debug('[API Helpers] JWT payload extracted', {
                sub: payload.sub,
                email: payload.email,
                name: payload.name,
              });
              
              // Use JWT payload directly (faster than calling stackServerApp.getUser)
              // The JWT already contains all necessary user info
              stackUser = {
                id: payload.sub,
                primaryEmail: payload.email as string || payload.sub,
                displayName: payload.name as string || payload.email as string || payload.sub,
                primaryEmailVerified: payload.email_verified as boolean || false,
              } satisfies StackAuthUser;
              
              securityLogger.info('[API Helpers] Stack Auth user created from JWT payload', { userId: stackUser.id, email: stackUser.primaryEmail });
            }
          } catch (jwtError: unknown) {
            // JWT verification failed - try REST API as fallback
            // Log error for debugging
            securityLogger.error('[API Helpers] Stack Auth JWT verification failed:', {
              code: jwtError instanceof Error && 'code' in jwtError ? jwtError.code : undefined,
              message: getErrorMessage(jwtError),
              tokenLength: accessToken.length,
              tokenPrefix: accessToken.substring(0, 20),
            });
            
            // Fallback: Try REST API verification if JWT verification fails
            try {
              const projectId = process.env.NEXT_PUBLIC_STACK_PROJECT_ID!;
              const secretServerKey = process.env.STACK_SECRET_SERVER_KEY!;
              
              const userResponse = await fetch(`https://api.stack-auth.com/api/v1/users/me`, {
                method: 'GET',
                headers: {
                  'X-Stack-Access-Type': 'server',
                  'X-Stack-Project-Id': projectId,
                  'X-Stack-Secret-Server-Key': secretServerKey,
                  'X-Stack-Access-Token': accessToken,
                },
              });
              
              if (userResponse.ok) {
                const userData = await userResponse.json() as StackAuthUser;
                stackUser = {
                  id: userData.id,
                  primaryEmail: userData.primaryEmail,
                  displayName: userData.displayName ?? null,
                  primaryEmailVerified: userData.primaryEmailVerified ?? false,
                };
                securityLogger.info('[API Helpers] Stack Auth user verified via REST API fallback', { userId: stackUser.id, email: stackUser.primaryEmail });
              } else {
                // REST API verification failed - this is expected if STACK_SECRET_SERVER_KEY is not set
                // JWT verification is the primary method and works correctly
                // Only log if it's not the expected INVALID_SECRET_SERVER_KEY error
                try {
                  const errorText = await userResponse.text().catch(() => 'Unable to read error');
                  try {
                    const errorData = JSON.parse(errorText);
                    if (errorData.code !== 'INVALID_SECRET_SERVER_KEY') {
                      securityLogger.error(`[API Helpers] REST API fallback also failed: ${userResponse.status} ${errorText.substring(0, 200)}`);
                    }
                    // Silently continue - JWT verification is the primary method
                  } catch {
                    // Not JSON, check if it contains the expected error code
                    if (!errorText.includes('INVALID_SECRET_SERVER_KEY')) {
                      securityLogger.error(`[API Helpers] REST API fallback also failed: ${userResponse.status} ${errorText.substring(0, 200)}`);
                    }
                  }
                } catch {
                  // Failed to read error text - silently continue
                }
              }
            } catch (restApiError: unknown) {
              // Both JWT and REST API failed - will fall back to NextAuth
              securityLogger.error('[API Helpers] REST API fallback error:', getErrorMessage(restApiError));
            }
          }
        }
      }
      
      if (stackUser) {
        try {
          const email = stackUser.primaryEmail || undefined;
          if (!email) return null;
          const rows = await db
            .select({ user: users, tenant: tenants })
            .from(users)
            .leftJoin(tenants, eq(users.tenantId, tenants.id))
            .where(eq(users.email, email))
            .limit(1);
          const row = rows[0];
          const dbUser = row?.user;
          const tenant = row?.tenant;
          const guestOrPlatform =
            isGuestConsumerRole(dbUser?.role) || (dbUser && isPlatformAdmin(dbUser));
          if (dbUser && (tenant || guestOrPlatform)) {
            return {
              id: dbUser.id,
              email: dbUser.email,
              primaryEmail: dbUser.email,
              role: dbUser.role ?? undefined,
              tenantId: dbUser.tenantId ?? undefined,
              propertyId: undefined,
            };
          }
          securityLogger.warn(`[API Helpers] Stack Auth user ${stackUser.primaryEmail} not found in database`);
        } catch (dbError: unknown) {
          securityLogger.error('[API Helpers] Database error fetching Stack Auth user:', (dbError as Error).message);
        }
      }
    } catch (stackError: unknown) {
      // Stack Auth check failed - log and continue to NextAuth fallback
      // This is expected if user is not authenticated with Stack Auth
      const message = getErrorMessage(stackError);
      if (message && !message.includes('No user found')) {
        securityLogger.error('[API Helpers] Stack Auth error:', message);
      }
    }
  }
  
  // Fall back to NextAuth
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return null;
    }
    
    return {
      id: session.user.id,
      email: session.user.email,
      primaryEmail: session.user.email, // Alias for compatibility
      role: session.user.role,
      tenantId: session.user.tenantId,
      propertyId: session.user.propertyId,
    };
  } catch (nextAuthError: unknown) {
    // NextAuth also failed - return null
    securityLogger.error('[API Helpers] NextAuth error:', getErrorMessage(nextAuthError));
    return null;
  }
}

/**
 * Require authentication - throws error if not authenticated
 * Note: This function needs a request object to check Stack Auth sessions
 * Use withApiAuth wrapper which provides the request automatically
 */
export async function requireAuth(req?: NextRequest) {
  const user = await getAuthenticatedUser(req);
  
  if (!user) {
    throw new Error('Unauthorized');
  }
  
  return user;
}

/**
 * Require authenticated user with tenant (and user id). Throws AppError 401.
 * Prefer over per-route getSessionUser copies in tenant-scoped API handlers.
 */
export async function requireTenantSessionUser(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user?.id || !user.tenantId) {
    throw new AppError(401, 'Unauthorized');
  }
  return {
    ...user,
    id: user.id,
    tenantId: user.tenantId,
    role: user.role ?? 'user',
  };
}

/**
 * Require specific role - throws error if user doesn't have role
 */
export async function requireRole(allowedRoles: string[], req?: NextRequest) {
  const user = await requireAuth(req);
  
  if (!user.role || !allowedRoles.includes(user.role)) {
    throw new Error('Forbidden');
  }
  
  return user;
}

/**
 * Get tenant context from request (header, session, or subdomain).
 * For API routes that use db but do NOT use withApiAuth: call this, then
 * run your handler inside runWithTenantContext(ctx.tenantId, () => handler(req)).
 */
export async function getRequestTenantContext(req: NextRequest) {
  // Check header (set by middleware)
  const tenantId = req.headers.get('x-tenant-id');
  if (tenantId) {
    return { tenantId };
  }
  
  // Get from user session
  const user = await getAuthenticatedUser();
  if (user?.tenantId) {
    return { tenantId: user.tenantId };
  }
  
  // Try subdomain resolution
  return await getTenantContextFromValidation(req);
}

/**
 * Standardized error response
 */
export function errorResponse(
  message: string,
  status: number = 400,
  code?: string,
  details?: unknown
): NextResponse {
  const safeDetails = sanitizeErrorDetails(details);
  const safeMessage =
    process.env.NODE_ENV === 'production' && status >= 500
      ? 'Internal server error'
      : message;

  return NextResponse.json(
    {
      success: false,
      error: {
        message: safeMessage,
        code,
        ...(safeDetails !== undefined ? { details: safeDetails } : {}),
      },
    },
    { status }
  );
}

export function rateLimitResponse(result: {
  remaining: number;
  resetAt: number;
}): NextResponse {
  const retryAfter = Math.max(0, Math.ceil((result.resetAt - Date.now()) / 1000));

  return NextResponse.json(
    {
      error: {
        message: 'Too many requests',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter,
      },
    },
    {
      status: 429,
      headers: {
        'Retry-After': retryAfter.toString(),
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': result.resetAt.toString(),
      },
    }
  );
}

/**
 * Standardized success response
 */
export function successResponse(data: unknown, status: number = 200): NextResponse {
  return NextResponse.json({ success: true, data }, { status });
}

/**
 * Paginated response
 */
export function paginatedResponse(
  data: unknown[],
  page: number,
  limit: number,
  total: number
): NextResponse {
  return NextResponse.json({
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total,
    },
  });
}

export async function readJsonBody<T = unknown>(req: NextRequest): Promise<T> {
  try {
    return await req.json() as T;
  } catch {
    throw new Error('Invalid JSON request body');
  }
}

export async function validateJsonBody<TSchema extends z.ZodType>(
  req: NextRequest,
  schema: TSchema
): Promise<z.infer<TSchema>> {
  const body = await readJsonBody(req);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const error = new Error('Invalid request body');
    Object.assign(error, {
      statusCode: 400,
      code: 'VALIDATION_ERROR',
      details: parsed.error.flatten().fieldErrors,
    });
    throw error;
  }

  return parsed.data;
}

/**
 * API route wrapper with authentication and rate limiting
 */
export async function withApiAuth(
  req: NextRequest,
  handler: (req: NextRequest, user: Awaited<ReturnType<typeof requireAuth>>) => Promise<NextResponse>,
  options?: {
    requireRole?: string[];
    rateLimit?: boolean;
  }
): Promise<NextResponse> {
  try {
    // Rate limiting
    if (options?.rateLimit !== false && !shouldRateLimit(req.nextUrl.pathname)) {
      const user = await getAuthenticatedUser(req);
      const rateLimitResult = await checkRateLimit(req, user?.id);
      
      if (!rateLimitResult.allowed) {
        await logRateLimitExceeded(req, user?.id, user?.tenantId);
        return rateLimitResponse(rateLimitResult);
      }
    }
    
    // Authentication
    const user = options?.requireRole
      ? await requireRole(options.requireRole, req)
      : await requireAuth(req);

    const tenantType: 'hub' | 'partner' = String(user.role ?? '').toLowerCase().startsWith('partner')
      ? 'partner'
      : 'hub';

    // Set RLS tenant context so DB queries are tenant-scoped (then clear in finally)
    return await runWithTenantContext(user.tenantId ?? undefined, tenantType, () =>
      handler(req, user)
    );
  } catch (error: unknown) {
    const message = getErrorMessage(error);
    securityLogger.error('withApiAuth error:', {
      message,
      stack: getErrorStack(error),
      path: req.nextUrl.pathname,
    });
    
    if (message === 'Unauthorized') {
      await logUnauthorizedAccess(req, 'Missing authentication');
      return errorResponse('Unauthorized', 401, 'UNAUTHORIZED');
    }
    
    if (message === 'Forbidden') {
      await logUnauthorizedAccess(req, 'Insufficient permissions');
      return errorResponse('Forbidden', 403, 'FORBIDDEN');
    }

    if (error && typeof error === 'object' && 'statusCode' in error) {
      const typedError = error as {
        statusCode?: number;
        code?: string;
        details?: unknown;
      };
      return errorResponse(
        message,
        typedError.statusCode ?? 400,
        typedError.code,
        typedError.details
      );
    }
    
    securityLogger.error('API error:', error);
    return errorResponse('Internal server error', 500, 'INTERNAL_ERROR');
  }
}

/**
 * Verify tenant access
 */
export async function verifyTenantAccess(
  req: NextRequest,
  resourceTenantId: string
): Promise<boolean> {
  const user = await getAuthenticatedUser(req);
  
  if (!user) {
    return false;
  }
  
  // Admin can access all tenants
  if (user.role === 'admin') {
    return true;
  }
  
  // User must belong to the tenant
  return user.tenantId === resourceTenantId;
}
