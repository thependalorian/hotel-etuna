/**
 * Unit tests: journal void and reversal (OSS W4 dubbl port).
 * Location: tests/unit/journal-entry-void.test.ts
 */

import { describe, it, expect } from 'vitest';
import { JournalEntryService } from '@/lib/services/accounting/JournalEntryService';
import type { JournalLine } from '@/lib/domain/accounting/types';

const journalService = new JournalEntryService();

describe('JournalEntryService - void and reversal', () => {
  describe('createReversalLines', () => {
    it('should reverse journal lines (swap debit ↔ credit)', () => {
      const originalLines: JournalLine[] = [
        {
          date: '2026-06-01',
          accountCode: '1100',
          accountName: 'Accounts Receivable',
          debit: 100.0,
          credit: 0,
          memo: 'Room charge',
          sourceType: 'booking_charge',
          sourceId: 'charge-1',
          currency: 'NAD',
        },
        {
          date: '2026-06-01',
          accountCode: '4100',
          accountName: 'Room Revenue',
          debit: 0,
          credit: 87.0,
          memo: 'Revenue recognition',
          sourceType: 'booking_charge',
          sourceId: 'charge-1',
          currency: 'NAD',
        },
        {
          date: '2026-06-01',
          accountCode: '2100',
          accountName: 'VAT Output Payable',
          debit: 0,
          credit: 13.0,
          memo: 'VAT output',
          sourceType: 'booking_charge',
          sourceId: 'charge-1',
          currency: 'NAD',
        },
      ];

      const reversalDate = new Date('2026-06-05');
      const reversalLines = journalService.createReversalLines(
        originalLines,
        reversalDate,
        'Correct erroneous charge'
      );

      expect(reversalLines.length).toBe(3);

      const arReversal = reversalLines.find((l) => l.accountCode === '1100');
      expect(arReversal?.debit).toBe(0);
      expect(arReversal?.credit).toBe(100.0);
      expect(arReversal?.memo).toContain('reversal of');

      const revenueReversal = reversalLines.find((l) => l.accountCode === '4100');
      expect(revenueReversal?.debit).toBe(87.0);
      expect(revenueReversal?.credit).toBe(0);

      const vatReversal = reversalLines.find((l) => l.accountCode === '2100');
      expect(vatReversal?.debit).toBe(13.0);
      expect(vatReversal?.credit).toBe(0);

      const totalDebits = reversalLines.reduce((sum, l) => sum + l.debit, 0);
      const totalCredits = reversalLines.reduce((sum, l) => sum + l.credit, 0);
      expect(Math.abs(totalDebits - totalCredits)).toBeLessThan(0.01);
    });

    it('should preserve source type and append -reversal to source ID', () => {
      const originalLines: JournalLine[] = [
        {
          date: '2026-06-01',
          accountCode: '1010',
          accountName: 'Cash',
          debit: 500.0,
          credit: 0,
          memo: 'Payment',
          sourceType: 'guest_payment',
          sourceId: 'payment-123',
          currency: 'NAD',
        },
        {
          date: '2026-06-01',
          accountCode: '1100',
          accountName: 'Accounts Receivable',
          debit: 0,
          credit: 500.0,
          memo: 'Clear receivable',
          sourceType: 'guest_payment',
          sourceId: 'payment-123',
          currency: 'NAD',
        },
      ];

      const reversalDate = new Date('2026-06-10');
      const reversalLines = journalService.createReversalLines(
        originalLines,
        reversalDate,
        'Void payment'
      );

      expect(reversalLines[0].sourceType).toBe('guest_payment');
      expect(reversalLines[0].sourceId).toBe('payment-123-reversal');
      expect(reversalLines[1].sourceId).toBe('payment-123-reversal');
    });

    it('should update date to reversal date', () => {
      const originalLines: JournalLine[] = [
        {
          date: '2026-06-01T00:00:00.000Z',
          accountCode: '5100',
          accountName: 'Platform Fees',
          debit: 10.0,
          credit: 0,
          memo: 'Fee',
          sourceType: 'platform_fee_accrual',
          sourceId: 'fee-1',
          currency: 'NAD',
        },
        {
          date: '2026-06-01T00:00:00.000Z',
          accountCode: '2300',
          accountName: 'Platform Fees Payable',
          debit: 0,
          credit: 10.0,
          memo: 'Liability',
          sourceType: 'platform_fee_accrual',
          sourceId: 'fee-1',
          currency: 'NAD',
        },
      ];

      const reversalDate = new Date('2026-06-15T12:00:00.000Z');
      const reversalLines = journalService.createReversalLines(
        originalLines,
        reversalDate,
        'Void fee'
      );

      expect(reversalLines[0].date).toBe(reversalDate.toISOString());
      expect(reversalLines[1].date).toBe(reversalDate.toISOString());
    });

    it('should handle empty journal lines gracefully', () => {
      const reversalLines = journalService.createReversalLines(
        [],
        new Date('2026-06-01'),
        'Empty reversal'
      );

      expect(reversalLines).toEqual([]);
    });

    it('should preserve all memo details in reversal', () => {
      const originalLines: JournalLine[] = [
        {
          date: '2026-06-01',
          accountCode: '1100',
          accountName: 'Accounts Receivable',
          debit: 250.0,
          credit: 0,
          memo: 'Guest folio #12345 - Presidential Suite - 3 nights',
          sourceType: 'booking_charge',
          sourceId: 'charge-999',
          currency: 'NAD',
        },
        {
          date: '2026-06-01',
          accountCode: '4100',
          accountName: 'Room Revenue',
          debit: 0,
          credit: 250.0,
          memo: 'Revenue recognition',
          sourceType: 'booking_charge',
          sourceId: 'charge-999',
          currency: 'NAD',
        },
      ];

      const reversalLines = journalService.createReversalLines(
        originalLines,
        new Date('2026-06-02'),
        'Guest dispute - rate correction'
      );

      expect(reversalLines[0].memo).toContain('Guest folio #12345');
      expect(reversalLines[0].memo).toContain('reversal of');
      expect(reversalLines[0].memo).toContain('Guest dispute - rate correction');
    });
  });
});
