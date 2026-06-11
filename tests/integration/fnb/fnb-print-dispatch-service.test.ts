/**
 * F&B print dispatch service integration tests
 *
 * Purpose: Verify print job queue, status transitions, and mock adapter dispatch.
 * Location: tests/integration/fnb/fnb-print-dispatch-service.test.ts
 */

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { db, fnbPrintJobs } from '@/lib/db';
import { runWithTenantContext } from '@/lib/auth/tenant-context';
import { MockNetworkPrintAdapter } from '@/lib/adapters/print/network-print-adapter';
import { FnbPrintDispatchService } from '@/lib/services/fnb/fnb-print-dispatch-service';
import {
  cleanupTestData,
  createTestProperty,
  createTestTenant,
  createTestUser,
} from '../../utils/test-helpers';

describe('FnbPrintDispatchService', () => {
  let tenantId: string;
  let propertyId: string;
  let service: FnbPrintDispatchService;

  beforeAll(async () => {
    const tenant = await createTestTenant('F&B Print Dispatch Tenant');
    const user = await createTestUser(tenant.id);
    const property = await createTestProperty(tenant.id, user.id, 'Print Test Restaurant', 'restaurant');

    tenantId = tenant.id;
    propertyId = property.id;
    service = new FnbPrintDispatchService(new MockNetworkPrintAdapter());
  });

  afterAll(async () => {
    await cleanupTestData(tenantId);
  });

  it('creates a pending job and processes it to printed', async () => {
    const job = await runWithTenantContext(tenantId, () =>
      service.createJob({
        propertyId,
        station: 'kitchen',
        ticketData: {
          orderNumber: 'ORD-TEST-1',
          items: [{ name: 'Burger', quantity: 1 }],
        },
      })
    );

    expect(job.status).toBe('pending');
    expect(job.station).toBe('kitchen');

    const processed = await runWithTenantContext(tenantId, () =>
      service.processPendingForStation(propertyId, 'kitchen', 5)
    );

    expect(processed.some((row) => row.id === job.id && row.status === 'printed')).toBe(true);

    const [stored] = await runWithTenantContext(tenantId, () =>
      db.select().from(fnbPrintJobs).where(eq(fnbPrintJobs.id, job.id)).limit(1)
    );
    expect(stored?.status).toBe('printed');
    expect(stored?.printedAt).toBeTruthy();
  });

  it('marks job failed when mock adapter simulates printer offline', async () => {
    const failingService = new FnbPrintDispatchService(new MockNetworkPrintAdapter());

    const job = await runWithTenantContext(tenantId, () =>
      failingService.createJob({
        propertyId,
        station: 'bar',
        ticketData: {
          orderNumber: 'ORD-FAIL-1',
          simulateFailure: true,
          items: [{ name: 'Coffee', quantity: 2 }],
        },
      })
    );

    const processed = await runWithTenantContext(tenantId, () =>
      failingService.processPendingForStation(propertyId, 'bar', 5)
    );

    const failed = processed.find((row) => row.id === job.id);
    expect(failed?.status).toBe('failed');
    expect(failed?.errorMessage).toContain('Mock printer offline');
  });

  it('enforces valid status transitions', async () => {
    const job = await runWithTenantContext(tenantId, () =>
      service.createJob({
        propertyId,
        station: 'kitchen',
        ticketData: { orderNumber: 'ORD-BAD-TRANSITION' },
      })
    );

    await expect(
      runWithTenantContext(tenantId, () =>
        service.updateStatus(job.id, propertyId, 'printed')
      )
    ).rejects.toThrow(/Invalid print job transition/);
  });
});
