/**
 * F&B print jobs API integration tests
 *
 * Purpose: Verify authenticated list/create/status routes for kitchen tickets.
 * Location: tests/integration/fnb/print-jobs-api.test.ts
 */

import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { runWithTenantContext } from '@/lib/auth/tenant-context';
import { FnbPrintDispatchService } from '@/lib/services/fnb/fnb-print-dispatch-service';
import { MockNetworkPrintAdapter } from '@/lib/adapters/print/network-print-adapter';
import {
  cleanupTestData,
  createTestProperty,
  createTestTenant,
  createTestUser,
} from '../../utils/test-helpers';
import { GET, POST } from '@/app/api/fnb/print-jobs/route';
import { PATCH } from '@/app/api/fnb/print-jobs/[id]/status/route';

const { mockGetAuthenticatedUser } = vi.hoisted(() => ({
  mockGetAuthenticatedUser: vi.fn(),
}));

vi.mock('@/lib/utils/api-helpers', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/utils/api-helpers')>();
  const { runWithTenantContext: withTenant } = await import('@/lib/auth/tenant-context');
  return {
    ...actual,
    getAuthenticatedUser: (...args: unknown[]) => mockGetAuthenticatedUser(...args),
    // withApiAuth closes over requireRole internally — replace the wrapper for route tests.
    withApiAuth: async (
      req: NextRequest,
      handler: (req: NextRequest, user: Awaited<ReturnType<typeof mockGetAuthenticatedUser>>) => Promise<Response>,
      options?: { requireRole?: string[]; rateLimit?: boolean }
    ) => {
      try {
        const user = await mockGetAuthenticatedUser(req);
        if (!user) {
          return actual.errorResponse('Unauthorized', 401, 'UNAUTHORIZED');
        }
        if (options?.requireRole && (!user.role || !options.requireRole.includes(user.role))) {
          return actual.errorResponse('Forbidden', 403, 'FORBIDDEN');
        }
        return await withTenant(user.tenantId ?? undefined, 'hub', () => handler(req, user));
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        if (message === 'Unauthorized') {
          return actual.errorResponse('Unauthorized', 401, 'UNAUTHORIZED');
        }
        if (message === 'Forbidden') {
          return actual.errorResponse('Forbidden', 403, 'FORBIDDEN');
        }
        return actual.errorResponse('Internal server error', 500, 'INTERNAL_ERROR');
      }
    },
  };
});

describe('F&B print jobs API', { timeout: 120_000 }, () => {
  let tenantId: string;
  let userId: string;
  let propertyId: string;
  let jobId: string;

  beforeAll(async () => {
    const tenant = await createTestTenant('Print Jobs API Tenant');
    const user = await createTestUser(tenant.id);
    const property = await createTestProperty(tenant.id, user.id, 'API Kitchen Property', 'restaurant');

    tenantId = tenant.id;
    userId = user.id;
    propertyId = property.id;

    const service = new FnbPrintDispatchService(new MockNetworkPrintAdapter());
    const job = await runWithTenantContext(tenantId, () =>
      service.createJob({
        propertyId,
        station: 'kitchen',
        ticketData: { orderNumber: 'ORD-API-1', items: [{ name: 'Salad', quantity: 1 }] },
        createdBy: userId,
      })
    );
    jobId = job.id;
  });

  afterAll(async () => {
    await cleanupTestData(tenantId);
  });

  it('GET /api/fnb/print-jobs returns jobs for tenant property', async () => {
    mockGetAuthenticatedUser.mockResolvedValue({
      id: userId,
      email: 'kitchen@example.com',
      role: 'manager',
      tenantId,
    });

    const response = await GET(
      new NextRequest(`http://localhost:3000/api/fnb/print-jobs?propertyId=${propertyId}&station=kitchen`)
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.some((row: { id: string }) => row.id === jobId)).toBe(true);
  });

  it('POST /api/fnb/print-jobs creates a pending job', async () => {
    mockGetAuthenticatedUser.mockResolvedValue({
      id: userId,
      email: 'kitchen@example.com',
      role: 'manager',
      tenantId,
    });

    const response = await POST(
      new NextRequest('http://localhost:3000/api/fnb/print-jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId,
          station: 'kitchen',
          ticketData: { orderNumber: 'ORD-POST-1', items: [{ name: 'Soup', quantity: 1 }] },
        }),
      })
    );

    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.status).toBe('pending');
    expect(body.data.station).toBe('kitchen');
  });

  it('PATCH /api/fnb/print-jobs/[id]/status updates ticket status', async () => {
    mockGetAuthenticatedUser.mockResolvedValue({
      id: userId,
      email: 'kitchen@example.com',
      role: 'manager',
      tenantId,
    });

    const response = await PATCH(
      new NextRequest(`http://localhost:3000/api/fnb/print-jobs/${jobId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId,
          status: 'printing',
        }),
      }),
      { params: Promise.resolve({ id: jobId }) }
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.status).toBe('printing');
  });
});
