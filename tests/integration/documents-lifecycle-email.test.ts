/**
 * Document lifecycle email hooks — mocked generateAndEmail on quotation path.
 * Location: tests/integration/documents-lifecycle-email.test.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

const { generateAndEmailMock } = vi.hoisted(() => ({
  generateAndEmailMock: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/services/documents/DocumentGenerationService', () => ({
  documentGenerationService: {
    generateAndEmail: generateAndEmailMock,
  },
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

import { scheduleQuotationPdfEmail } from '@/lib/services/documents/documentLifecycleHooks';

describe('document lifecycle email', () => {
  beforeEach(() => {
    generateAndEmailMock.mockClear();
  });

  it('scheduleQuotationPdfEmail calls generateAndEmail when payment pending', async () => {
    scheduleQuotationPdfEmail({
      tenantId: 'tenant-1',
      bookingId: 'booking-1',
      guestId: 'guest-1',
      propertyId: 'prop-1',
      paymentStatus: 'pending',
      totalAmount: 500,
    });
    await new Promise((r) => setTimeout(r, 50));
    expect(generateAndEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 'tenant-1',
        bookingId: 'booking-1',
        documentType: 'quotation',
      })
    );
  });

  it('skips quotation when payment not pending', async () => {
    scheduleQuotationPdfEmail({
      tenantId: 'tenant-1',
      bookingId: 'booking-1',
      guestId: 'guest-1',
      propertyId: 'prop-1',
      paymentStatus: 'paid',
      totalAmount: 500,
    });
    await new Promise((r) => setTimeout(r, 50));
    expect(generateAndEmailMock).not.toHaveBeenCalled();
  });
});
