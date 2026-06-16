/**
 * Proxy - System Design Implementation
 *
 * Purpose: Authentication, authorization, and security at the network boundary (Next.js 16+ proxy).
 * Location: /proxy.ts
 * 
 * Implements:
 * - Role-Based Access Control (RBAC)
 * - Multi-tenant isolation
 * - Rate limiting
 * - Security headers
 * - Public/private route handling
 * - Subdomain routing
 * 
 * Following System Design Principles:
 * - Security Architecture (JWT, RLS, RBAC)
 * - API Security (Rate Limiting, Input Validation)
 * - Multi-Tenancy Strategy
 */

import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { checkRateLimit, shouldRateLimit } from '@/lib/utils/rate-limit';
import { normalizePathnameForRateLimit } from '@/lib/utils/api-url';
import { extractSubdomain, validateTenant } from '@/lib/utils/tenant-validation';
import { logUnauthorizedAccess, logRateLimitExceeded } from '@/lib/utils/security-logger';
import { devLog, devError } from '@/lib/utils/dev-log';
import { serverLogger } from '@/lib/utils/server-logger';
import { stackServerApp } from '@/stack';
import { isStackAuthServerConfigured } from '@/lib/auth/stack-env';
import { sanitizeRedirectPath } from '@/lib/auth/roles';
import { applySecurityHeaders as addSecurityHeaders } from '@/lib/security/security-headers';
import { hubTeamCanAccessRoute } from '@/lib/auth/hub-team';

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  '/',                    // Landing page
  '/login',              // Login page
  '/register',           // Registration page
  '/forgot-password',    // Password reset
  '/reset-password',     // Password reset confirmation
  '/verify-email',       // Email verification
  '/unauthorized',        // Unauthorized access page (must be public to prevent redirect loops)
  '/rooms',              // Rooms listing and details
  '/facilities',         // Conference hall + campsite booking pages
  '/dining',             // Restaurant information
  '/about',              // About Hotel Etuna
  '/contact',            // Contact page
  '/partners',           // Partner directory and details
  '/introducers-directory', // Public introducer opt-in directory (PRD §3)
  '/payment',            // Adumo Virtual return URLs
  '/legal',              // Legal pages (all legal routes)
  '/privacy',            // Privacy policy (legacy route, redirects to /legal/privacy)
  '/terms',              // Terms of service (legacy route, redirects to /legal/terms)
  '/public-properties',  // Public property pages (legacy)
];

// Public API endpoints
const PUBLIC_API_ROUTES = [
  '/api/auth',           // Authentication endpoints
  '/api/public',         // Public API endpoints
  '/api/health',         // Health check
  '/api/public/properties', // Public property listings
  '/api/public/restaurant', // Public restaurant endpoints
  '/api/partners',         // Public partner directory/detail endpoints
  '/api/webhooks',       // Meta WhatsApp / external webhooks (verified via signature)
];

// Guest-facing routes (require guest session but not full authentication)
const GUEST_ROUTES = ['/guest'];

/** Staff cannot access FinTech compliance surfaces — platform console only. */
const HOSPITALITY_STAFF_BLOCKED_PREFIXES = ['/compliance', '/fraud'];

// Property owner routes (require property owner authentication)
const PROPERTY_OWNER_ROUTES = [
  '/dashboard',
  '/properties',
  '/bookings',
  '/housekeeping',
  '/payments',
  '/reports',
  '/analytics',
  '/crm',
  '/cms',
  '/staff',
  '/payroll',
  '/settings',
  '/profile',
  '/menu',
  '/rooms',
  '/restaurant',
  '/sofia',
  '/ai',
  '/admin',
];

const HUB_ONLY_API_PREFIXES = ['/api/sofia', '/api/crm', '/api/ai', '/api/guest/stays', '/api/guest/loyalty'];
const PAYMENT_2FA_ENDPOINTS = ['/api/payments/initiate'];

type MiddlewareToken = {
  id?: string;
  email?: string;
  tenantId?: string;
  propertyId?: string;
  role?: string;
};

type StackAuthUser = {
  id: string;
  primaryEmail?: string | null;
  displayName?: string | null;
  primaryEmailVerified?: boolean;
};

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown error';
}

function getErrorStack(error: unknown): string | undefined {
  return error instanceof Error ? error.stack : undefined;
}

// Helper functions
function isStaticFile(pathname: string): boolean {
  // Static file extensions
  const staticExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.ico', '.woff', '.woff2', '.ttf', '.eot', '.css', '.js', '.json', '.xml', '.pdf'];
  
  // Check if path has static file extension
  if (staticExtensions.some(ext => pathname.toLowerCase().endsWith(ext))) {
    return true;
  }
  
  // Check for static directories
  const staticPaths = ['/images/', '/fonts/', '/assets/', '/_next/static/', '/_next/image/', '/favicon.ico', '/sitemap.xml', '/robots.txt'];
  if (staticPaths.some(path => pathname.startsWith(path))) {
    return true;
  }
  
  return false;
}

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(route => pathname === route || pathname.startsWith(`${route}/`));
}

function isPublicApiRoute(pathname: string): boolean {
  const normalized = normalizePathnameForRateLimit(pathname);
  return PUBLIC_API_ROUTES.some((route) => normalized.startsWith(route));
}

function hasRouteAccess(pathname: string, role: string, email?: string | null): boolean {
  // Normalize role to lowercase for comparison
  const normalizedRole = role?.toLowerCase() || '';
  
  // Platform operators have access to everything (hub + platform console while building)
  if (normalizedRole === 'admin' || normalizedRole === 'super-admin') {
    return true;
  }
  
  // Property owner routes
  if (normalizedRole === 'owner' || normalizedRole === 'manager') {
    if (HOSPITALITY_STAFF_BLOCKED_PREFIXES.some((p) => pathname.startsWith(p))) {
      return false;
    }
    if (pathname.startsWith('/admin/platform')) {
      return false;
    }
    if (PROPERTY_OWNER_ROUTES.some(route => pathname.startsWith(route))) {
      return true;
    }
    if (GUEST_ROUTES.some(route => pathname.startsWith(route))) {
      return true;
    }
  }
  
  // Guest consumer routes (traveller accounts)
  if (normalizedRole === 'guest' || normalizedRole === 'user') {
    if (GUEST_ROUTES.some(route => pathname.startsWith(route))) {
      return true;
    }
    if (pathname === '/profile' || pathname.startsWith('/profile/')) {
      return true;
    }
  }

  // Hub team staff — scoped by @hoteletuna.com inbox (frontdesk, marketing, support)
  if (normalizedRole === 'staff') {
    if (HOSPITALITY_STAFF_BLOCKED_PREFIXES.some((p) => pathname.startsWith(p))) {
      return false;
    }
    if (pathname.startsWith('/admin/platform')) {
      return false;
    }
    if (hubTeamCanAccessRoute(email, normalizedRole, pathname)) {
      return true;
    }
    return false;
  }

  // Partner self-service scope only
  if (normalizedRole.startsWith('partner')) {
    if (pathname.startsWith('/partner') && normalizedRole !== 'partner_admin') {
      return false;
    }
    return (
      pathname.startsWith('/partner') ||
      pathname.startsWith('/dashboard') ||
      pathname.startsWith('/bookings') ||
      pathname.startsWith('/rooms') ||
      pathname.startsWith('/settings') ||
      pathname.startsWith('/profile') ||
      pathname.startsWith('/properties')
    );
  }
  
  return false;
}

async function handleApiRoutes(req: NextRequest, token: MiddlewareToken | null, pathname: string): Promise<NextResponse> {
  req.headers.delete('x-2fa-verified');

  const role = (token?.role ?? '').toLowerCase();

  if (pathname.startsWith('/api/guest') && !token?.id && !req.headers.get('x-user-id')) {
    return NextResponse.json(
      { error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } },
      { status: 401 },
    );
  }

  if (role.startsWith('partner') && HUB_ONLY_API_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.json({ error: 'Forbidden: hub-only endpoint' }, { status: 403 });
  }

  if (PAYMENT_2FA_ENDPOINTS.some((prefix) => pathname.startsWith(prefix))) {
    const twoFaVerifiedHeader = req.headers.get('x-2fa-verified');
    if (twoFaVerifiedHeader !== 'true') {
      return NextResponse.json({ error: 'Two-factor authentication required' }, { status: 403 });
    }
  }

  // Check for Stack Auth session for API routes
  let stackAuthUser: StackAuthUser | null = null;
  const stackAuthConfigured = Boolean(stackServerApp && isStackAuthServerConfigured());
  
  if (stackAuthConfigured && stackServerApp) {
    try {
      stackAuthUser = await stackServerApp.getUser({ tokenStore: req });
      if (stackAuthUser) {
        // Stack Auth user authenticated - add user context
        req.headers.set('x-user-id', stackAuthUser.id);
        // Note: Stack Auth doesn't provide tenant/property info directly
        // You may need to fetch from database using stackAuthUser.id
      }
    } catch {
      // Stack Auth check failed - continue to NextAuth check
    }
  }
  
  // Rate limiting for API endpoints
  if (shouldRateLimit(pathname)) {
    try {
      const userId = stackAuthUser?.id || token?.id;
      const rateLimitResult = await checkRateLimit(req, userId);
      
      if (!rateLimitResult.allowed) {
        // Log rate limit exceeded (non-blocking)
        logRateLimitExceeded(req, userId, token?.tenantId).catch(() => {
          // Silently fail logging - don't block request
        });
        return NextResponse.json(
          {
            error: {
              message: 'Too many requests',
              code: 'RATE_LIMIT_EXCEEDED',
              retryAfter: Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000),
            },
          },
          {
            status: 429,
            headers: {
              'Retry-After': Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000).toString(),
              'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
              'X-RateLimit-Reset': rateLimitResult.resetAt.toString(),
            },
          }
        );
      }
    } catch (rateLimitError) {
      serverLogger.error('[Middleware] Rate limiting error', { error: rateLimitError });
      if (process.env.NODE_ENV === 'production' || process.env.RATE_LIMIT_REDIS_REQUIRED === 'true') {
        return NextResponse.json(
          {
            error: {
              message: 'Service temporarily unavailable',
              code: 'RATE_LIMIT_UNAVAILABLE',
            },
          },
          { status: 503 },
        );
      }
    }
  }
  
  // Add tenant context to API requests (from NextAuth token)
  if (token && token.tenantId) {
    req.headers.set('x-tenant-id', token.tenantId);
  }
  
  // Add user context to API requests (from NextAuth token if Stack Auth not available)
  if (!stackAuthUser && token && token.id) {
    req.headers.set('x-user-id', token.id);
  }
  
  // Add property context if available
  if (token && token.propertyId) {
    req.headers.set('x-property-id', token.propertyId);
  }
  
  const response = NextResponse.next();
  addSecurityHeaders(response);
  
  return response;
}

function handleTenantContext(req: NextRequest, token: MiddlewareToken): NextResponse {
  const response = NextResponse.next();
  
  // Add tenant context for property owners
  if (token.tenantId) {
    response.headers.set('x-tenant-id', token.tenantId);
  }
  
  // Add property context if available
  if (token.propertyId) {
    response.headers.set('x-property-id', token.propertyId);
  }
  
  return response;
}

function redirectToLogin(req: NextRequest): NextResponse {
  const url = new URL('/login', req.url);
  const pathWithQuery = `${req.nextUrl.pathname}${req.nextUrl.search}`;
  const safe = sanitizeRedirectPath(pathWithQuery) ?? '/guest';
  url.searchParams.set('redirect', safe);
  return NextResponse.redirect(url);
}

function resolveRoleForEmail(email: string | null | undefined): string {
  if (!email) return '';
  const normalized = email.trim().toLowerCase();

  // Keep proxy runtime edge-safe: avoid DB access in middleware.
  if (normalized.endsWith('@buffr.ai')) {
    return 'admin';
  }
  if (normalized.endsWith('@hoteletuna.com')) {
    return 'staff';
  }
  return 'guest';
}

function redirectToUnauthorized(req: NextRequest): NextResponse {
  return NextResponse.redirect(new URL('/unauthorized', req.url));
}

// Main proxy - checks public routes FIRST, then Stack Auth, then NextAuth
export default withAuth(
  async function proxy(req) {
    try {
      const { pathname } = req.nextUrl;
      const token = (req as NextRequest & { nextauth?: { token?: MiddlewareToken } }).nextauth?.token ?? null;
      
      // Skip static files and images (early return for performance)
      if (isStaticFile(pathname)) {
        return NextResponse.next();
      }

      if (pathname === '/dashboard/rooms' || pathname.startsWith('/dashboard/rooms/')) {
        return NextResponse.redirect(new URL('/properties', req.url));
      }
      
      // CRITICAL: Handle public routes FIRST, before any auth logic
      // This ensures the home page is always accessible
      if (isPublicRoute(pathname)) {
        const response = NextResponse.next();
        addSecurityHeaders(response);
        // Hotfix: prevent stale app-shell/runtime cache mismatches on public pages.
        response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
        response.headers.set('Pragma', 'no-cache');
        response.headers.set('Expires', '0');
        return response;
      }
      
      // Allow Stack Auth handler routes to pass through (sign-in, sign-up, etc.)
      if (pathname.startsWith('/handler/')) {
        return NextResponse.next();
      }
    
    // Check for Stack Auth session first (if Stack Auth is configured)
    let stackAuthUser = null;
    const stackAuthConfigured = Boolean(stackServerApp && isStackAuthServerConfigured());
    
    if (stackAuthConfigured && stackServerApp) {
      try {
        // First, try to get user from Stack Auth session cookies (from handler)
        stackAuthUser = await stackServerApp.getUser({ tokenStore: req });
        
        // If no session cookie, check for access token in Authorization header or cookies
        if (!stackAuthUser) {
          const authHeader = req.headers.get('authorization');
          const cookies = req.headers.get('cookie') || '';
          
          let accessToken: string | null = null;
          
          // Check for Stack Auth access token in Authorization header
          if (authHeader && authHeader.startsWith('Bearer ')) {
            accessToken = authHeader.replace('Bearer ', '');
          }
          
          // Check for stack-access-token cookie (from REST API)
          if (!accessToken) {
            const accessTokenMatch = cookies.match(/stack-access-token=([^;]+)/);
            if (accessTokenMatch) {
              accessToken = accessTokenMatch[1];
            }
          }
          
          // If we have an access token, verify it via Stack Auth REST API
          if (accessToken) {
            try {
              const projectId = process.env.NEXT_PUBLIC_STACK_PROJECT_ID!;
              const secretServerKey = process.env.STACK_SECRET_SERVER_KEY!;
              
              if (!projectId || !secretServerKey) {
                // Missing required environment variables - skip REST API verification
                // JWT verification will be used instead
                throw new Error('Stack Auth environment variables not configured');
              }
              
              // Call Stack Auth REST API to verify token and get user
              // Add timeout to prevent hanging requests
              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
              
              try {
                const userResponse = await fetch(`https://api.stack-auth.com/api/v1/users/me`, {
                  method: 'GET',
                  headers: {
                    'X-Stack-Access-Type': 'server',
                    'X-Stack-Project-Id': projectId,
                    'X-Stack-Secret-Server-Key': secretServerKey,
                    'X-Stack-Access-Token': accessToken,
                  },
                  signal: controller.signal,
                });
              
                if (userResponse.ok) {
                  const userData = await userResponse.json() as StackAuthUser;
                  // Create a minimal user object from REST API response
                  stackAuthUser = {
                    id: userData.id,
                    primaryEmail: userData.primaryEmail,
                    displayName: userData.displayName ?? null,
                    primaryEmailVerified: userData.primaryEmailVerified ?? false,
                  };
                  if (process.env.NODE_ENV === 'development') {
                    devLog('[Middleware] Stack Auth user verified via REST API', { email: userData.primaryEmail });
                  }
                } else {
                  // REST API verification failed - this is expected if STACK_SECRET_SERVER_KEY is not set
                  // JWT verification is the primary method and works correctly
                  // Only log if it's not the expected INVALID_SECRET_SERVER_KEY error
                  const errorText = await userResponse.text();
                  try {
                    const errorData = JSON.parse(errorText);
                    if (errorData.code !== 'INVALID_SECRET_SERVER_KEY' && process.env.NODE_ENV === 'development') {
                      devLog('[Middleware] Stack Auth REST API verification failed', {
                        status: userResponse.status,
                        body: errorText.substring(0, 200),
                      });
                    }
                    // Silently continue - JWT verification is the primary method
                  } catch {
                    // Not JSON, check if it contains the expected error code
                    if (!errorText.includes('INVALID_SECRET_SERVER_KEY') && process.env.NODE_ENV === 'development') {
                      devLog('[Middleware] Stack Auth REST API verification failed', {
                        status: userResponse.status,
                        body: errorText.substring(0, 200),
                      });
                    }
                  }
                }
              } finally {
                clearTimeout(timeoutId);
              }
            } catch (tokenError: unknown) {
              // Token verification failed - continue to NextAuth check
              // Don't log timeout errors in production
              const message = getErrorMessage(tokenError);
              if (process.env.NODE_ENV === 'development' || !message.includes('aborted')) {
                devError('[Middleware] Stack Auth token verification error', { message });
              }
            }
          }
        }
        
        if (stackAuthUser) {
          const stackRole = resolveRoleForEmail(stackAuthUser.primaryEmail);
          if (!hasRouteAccess(pathname, stackRole, stackAuthUser.primaryEmail)) {
            return redirectToUnauthorized(req);
          }
          const response = NextResponse.next();
          addSecurityHeaders(response);
          return response;
        }
      } catch {
        // Stack Auth check failed - continue to NextAuth check
        // This is expected if user is not authenticated with Stack Auth
      }
    }
    
    // Extract tenant from subdomain or path
    const hostname = req.headers.get('host') || '';
    const subdomain = extractSubdomain(hostname);
    
    // Handle subdomain-based tenant routing
    if (subdomain) {
      try {
        const validation = await validateTenant(subdomain);
        if (validation.valid && validation.tenantId) {
          req.headers.set('x-tenant-subdomain', subdomain);
          req.headers.set('x-tenant-id', validation.tenantId);
        }
      } catch (error) {
        // Silently fail - tenant validation will happen in API routes
        // Don't log in production to avoid noise
        if (process.env.NODE_ENV === 'development') {
          devError('[Middleware] Tenant validation error', { error });
        }
      }
    }
    
    // Handle API routes
    if (pathname.startsWith('/api')) {
      return await handleApiRoutes(req, token, pathname);
    }
    
    // Check if user is authenticated (NextAuth fallback)
    if (!token) {
      return redirectToLogin(req);
    }

    // Enforce NextAuth token expiry for protected routes
    const tokenExp = (token as MiddlewareToken & { exp?: number }).exp;
    if (typeof tokenExp === 'number' && Date.now() >= tokenExp * 1000) {
      const url = new URL('/login', req.url);
      url.searchParams.set('reason', 'expired');
      return NextResponse.redirect(url);
    }
    
    // Check user role and route access
    const userRole = (token.role as string)?.toLowerCase() || '';
    const userEmail = (token.email as string) ?? null;
    
    // Debug logging in development only
    if (process.env.NODE_ENV === 'development') {
      devLog('[Middleware] Route access check', {
        pathname,
        userRole,
        hasAccess: hasRouteAccess(pathname, userRole, userEmail),
        tokenId: token.id,
      });
    }
    
    // Handle role-based access control
    if (!hasRouteAccess(pathname, userRole, userEmail)) {
      // Log unauthorized access attempt (non-blocking)
      if (process.env.NODE_ENV === 'development') {
        devLog('[Middleware] Access denied', {
          pathname,
          userRole,
          tokenId: token.id,
        });
      }
      logUnauthorizedAccess(req, `Role ${userRole} denied access to ${pathname}`, token.id as string, token.tenantId as string).catch(() => {
        // Silently fail logging - don't block request
      });
      return redirectToUnauthorized(req);
    }
    
    // Handle tenant context for property owners
    if (userRole === 'owner' || userRole === 'manager') {
      return handleTenantContext(req, token);
    }
    
    // Add security headers for all authenticated users
    const response = NextResponse.next();
    addSecurityHeaders(response);
    // Hotfix: disable browser/proxy caching on protected app routes as well.
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    return response;
    } catch (error: unknown) {
      serverLogger.error('[Middleware] Unhandled error', {
        message: getErrorMessage(error),
        pathname: req.nextUrl.pathname,
        stack: getErrorStack(error)?.substring(0, 200),
      });
      
      // For API routes, return JSON error
      if (req.nextUrl.pathname.startsWith('/api')) {
        return NextResponse.json(
          {
            error: {
              message: 'Internal server error',
              code: 'MIDDLEWARE_ERROR',
            },
          },
          { status: 500 }
        );
      }
      
      // For page routes, redirect to login or show error page
      // Don't redirect public routes
      if (isPublicRoute(req.nextUrl.pathname)) {
        const response = NextResponse.next();
        addSecurityHeaders(response);
        return response;
      }
      
      // Redirect to login for protected routes
      return redirectToLogin(req);
    }
  },
  {
    callbacks: {
      authorized: async ({ token, req }) => {
        const { pathname } = req.nextUrl;
        
        // CRITICAL: Public routes (including home page) don't require authentication
        // Return true to allow access without checking token
        // This prevents NextAuth from redirecting to login for public routes
        if (isPublicRoute(pathname)) {
          return true;
        }
        
        // Allow Stack Auth handler routes
        if (pathname.startsWith('/handler/')) {
          return true;
        }
        
        // Public API routes don't require authentication
        if (pathname.startsWith('/api') && isPublicApiRoute(pathname)) {
          return true;
        }
        
        // For API routes, allow Stack Auth access tokens to pass through
        // The main middleware will verify the token
        if (pathname.startsWith('/api')) {
          const stackAuthConfigured = Boolean(stackServerApp && isStackAuthServerConfigured());
          
          if (stackAuthConfigured && stackServerApp) {
            // Check if we have Stack Auth session or access token
            try {
              const stackAuthUser = await stackServerApp.getUser({ tokenStore: req });
              if (stackAuthUser) {
                return true;
              }
            } catch {
              // Continue to check for access token
            }
            
            // Check for access token in headers (don't verify here, let main middleware do it)
            const authHeader = req.headers.get('authorization');
            const cookies = req.headers.get('cookie') || '';
            
            if (authHeader && authHeader.startsWith('Bearer ')) {
              // Access token present - allow through (main middleware will verify)
              return true;
            }
            
            if (cookies.includes('stack-access-token=')) {
              // Access token cookie present - allow through (main middleware will verify)
              return true;
            }
          }
        }
        
        // Check Stack Auth session if configured (for non-API routes)
        const stackAuthConfigured = Boolean(stackServerApp && isStackAuthServerConfigured());
        
        if (stackAuthConfigured && stackServerApp) {
          try {
            const stackAuthUser = await stackServerApp.getUser({ tokenStore: req });
            if (stackAuthUser) {
              // Stack Auth user is authenticated
              return true;
            }
          } catch {
            // Stack Auth check failed - continue to NextAuth check
          }
        }
        
        // Protected API routes: pass through so handlers return JSON 401/403 (not HTML login redirect).
        if (pathname.startsWith('/api') && !isPublicApiRoute(pathname)) {
          return true;
        }

        // Fall back to NextAuth token check for page routes
        if (token) {
          return true;
        }

        return false;
      },
    },
    pages: {
      signIn: '/login',
      error: '/login',
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images/ (public images folder)
     * - fonts/ (public fonts folder)
     * - assets/ (public assets folder)
     * - Static file extensions (.jpg, .png, .css, .js, etc.)
     * - sitemap.xml
     * - robots.txt
     */
    '/((?!_next/static|_next/image|favicon.ico|images|fonts|assets|sitemap.xml|robots.txt|.*\\.(?:jpg|jpeg|png|gif|webp|svg|ico|woff|woff2|ttf|eot|css|js|json|xml|pdf)).*)',
  ]
};
