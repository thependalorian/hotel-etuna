/**
 * Guest financial documents API — ownership and list behaviour (mocked DB layer).
 * Location: tests/integration/documents-guest-api.test.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const { listForBookingMock, assertStayAccessMock } = vi.hoisted(() => ({
  listForBookingMock: vi.fn().mockResolvedValue([
    {
      id: 'doc-1',
      documentType: 'quotation',
      referenceNumber: 'QUO-2026-0001',
      generatedAt: new Date().toISOString(),
    },
  ]),
  assertStayAccessMock: vi.fn(),
}));

vi.mock('@/lib/services/documents/DocumentGenerationService', () => ({
  documentGenerationService: {
    listForBooking: listForBookingMock,
    generateAndEmail: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('@/lib/services/folio/guestStayAccess', () => ({
  assertStayAccess: assertStayAccessMock,
}));

vi.mock('@/lib/db', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/db')>();
  return {
    ...actual,
    db: {
      select: () => ({
        from: () => ({
          where: () => ({
            limit: () => Promise.resolve([{ ownerId: 'owner-1' }]),
          }),
        }),
      }),
    },
  };
});

vi.mock('@/lib/utils/api-helpers', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/utils/api-helpers')>();
  const testUser = { id: 'guest-user-1', tenantId: 'tenant-1', role: 'guest' };
  return {
    ...actual,
    withApiAuth: async (
      _req: NextRequest,
      handler: (req: NextRequest, user: typeof testUser) => Promise<Response>
    ) => {
      try {
        return await handler(_req, testUser);
      } catch (error) {
        const { AppError } = await import('@/lib/utils/errors');
        if (error instanceof AppError) {
          return actual.errorResponse(error.message, error.statusCode, 'APP_ERROR');
        }
        throw error;
      }
    },
  };
});

import { GET } from '@/app/api/guest/stays/[bookingId]/financial-documents/route';

describe('guest financial documents API', () => {
  beforeEach(() => {
    listForBookingMock.mockClear();
    assertStayAccessMock.mockReset();
  });

  it('returns document list when stay access passes', async () => {
    assertStayAccessMock.mockResolvedValue(undefined);

    const req = new NextRequest('http://localhost/api/guest/stays/booking-1/financial-documents');
    const res = await GET(req, { params: Promise.resolve({ bookingId: 'booking-1' }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toHaveLength(1);
    expect(assertStayAccessMock).toHaveBeenCalledWith('booking-1', expect.any(Object));
  });

  it('returns error when stay access denied', async () => {
    const { AppError } = await import('@/lib/utils/errors');
    assertStayAccessMock.mockRejectedValue(new AppError(403, 'Forbidden'));

    const req = new NextRequest('http://localhost/api/guest/stays/booking-2/financial-documents');
    const res = await GET(req, { params: Promise.resolve({ bookingId: 'booking-2' }) });
    expect(res.status).toBe(403);
  });
});
