/**
 * API Response Contract Tests
 *
 * Purpose: Verify that successResponse and errorResponse helpers produce
 * consistent shapes that clients and tests can rely on. Guards against
 * regressions where success/error fields get removed or renamed.
 *
 * Location: tests/unit/api-response-contract.test.ts
 */

import { describe, it, expect, vi } from 'vitest';
import { NextRequest } from 'next/server';

// Mock NextResponse for Node environment
vi.mock('next/server', async (importOriginal) => {
  const actual = await importOriginal<typeof import('next/server')>();
  return actual;
});

describe('successResponse contract', () => {
  it('includes success: true', async () => {
    const { successResponse } = await import('@/lib/utils/api-helpers');
    const res = successResponse({ bookingId: 'abc' });
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  it('wraps data in data field', async () => {
    const { successResponse } = await import('@/lib/utils/api-helpers');
    const res = successResponse({ bookingId: 'abc', amount: 100 });
    const body = await res.json();
    expect(body.data).toMatchObject({ bookingId: 'abc', amount: 100 });
  });

  it('defaults to HTTP 200', async () => {
    const { successResponse } = await import('@/lib/utils/api-helpers');
    const res = successResponse({});
    expect(res.status).toBe(200);
  });

  it('accepts custom status code', async () => {
    const { successResponse } = await import('@/lib/utils/api-helpers');
    const res = successResponse({}, 201);
    expect(res.status).toBe(201);
  });
});

describe('errorResponse contract', () => {
  it('includes success: false', async () => {
    const { errorResponse } = await import('@/lib/utils/api-helpers');
    const res = errorResponse('Something went wrong', 400, 'BAD_INPUT');
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  it('wraps error in error.message and error.code', async () => {
    const { errorResponse } = await import('@/lib/utils/api-helpers');
    const res = errorResponse('Invalid booking ID', 400, 'INVALID_ID');
    const body = await res.json();
    expect(body.error.code).toBe('INVALID_ID');
    expect(typeof body.error.message).toBe('string');
  });

  it('returns the specified HTTP status', async () => {
    const { errorResponse } = await import('@/lib/utils/api-helpers');
    expect(errorResponse('Unauthorized', 401, 'UNAUTHORIZED').status).toBe(401);
    expect(errorResponse('Not found', 404, 'NOT_FOUND').status).toBe(404);
    expect(errorResponse('Rate limited', 429, 'RATE_LIMITED').status).toBe(429);
    expect(errorResponse('Internal error', 500, 'INTERNAL').status).toBe(500);
  });

  it('sanitizes error messages in production for 5xx', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    const { errorResponse } = await import('@/lib/utils/api-helpers');
    const res = errorResponse('Detailed internal DB error message', 500, 'DB_ERROR');
    const body = await res.json();
    // In production, 5xx messages are sanitized to generic message
    expect(body.error.message).toBe('Internal server error');
    vi.unstubAllEnvs();
  });

  it('does NOT sanitize error message in development', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    const { errorResponse } = await import('@/lib/utils/api-helpers');
    const res = errorResponse('Specific dev-mode error', 500, 'DEV_ERR');
    const body = await res.json();
    expect(body.error.message).toBe('Specific dev-mode error');
    vi.unstubAllEnvs();
  });

  it('includes details when provided', async () => {
    const { errorResponse } = await import('@/lib/utils/api-helpers');
    const details = [{ field: 'email', message: 'Invalid format' }];
    const res = errorResponse('Validation failed', 400, 'VALIDATION_ERROR', details);
    const body = await res.json();
    expect(body.error.details).toBeDefined();
  });
});

describe('Response shape consistency across endpoints', () => {
  it('both success and error responses have a top-level success boolean', async () => {
    const { successResponse, errorResponse } = await import('@/lib/utils/api-helpers');
    const successBody = await successResponse({ x: 1 }).json();
    const errorBody = await errorResponse('err', 400, 'E').json();

    expect(typeof successBody.success).toBe('boolean');
    expect(typeof errorBody.success).toBe('boolean');
    expect(successBody.success).toBe(true);
    expect(errorBody.success).toBe(false);
  });
});

describe('rateLimitResponse contract', () => {
  it('returns HTTP 429 with Retry-After header', async () => {
    const { rateLimitResponse } = await import('@/lib/utils/api-helpers');
    const resetAt = Date.now() + 60000;
    const res = rateLimitResponse({ remaining: 0, resetAt });
    expect(res.status).toBe(429);
    const retryAfter = res.headers.get('Retry-After');
    expect(retryAfter).toBeDefined();
    expect(parseInt(retryAfter!)).toBeGreaterThanOrEqual(0);
  });
});
