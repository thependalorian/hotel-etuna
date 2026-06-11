/**
 * Document reference number sequencing.
 * Location: tests/unit/document-reference-generator.test.ts
 */

import { describe, it, expect } from 'vitest';
import {
  formatReferenceNumber,
  parseReferenceSequence,
} from '@/lib/services/documents/document-reference-generator';

describe('document reference generator', () => {
  it('formats padded sequence', () => {
    expect(formatReferenceNumber('quotation', 2026, 7)).toBe('QUO-2026-0007');
    expect(formatReferenceNumber('invoice', 2026, 120)).toBe('INV-2026-0120');
  });

  it('parses trailing sequence', () => {
    expect(parseReferenceSequence('REC-2026-0042')).toBe(42);
    expect(parseReferenceSequence('PN-2025-0001')).toBe(1);
    expect(parseReferenceSequence('bad')).toBeNull();
  });

  it('year rollover uses new prefix year', () => {
    expect(formatReferenceNumber('receipt', 2027, 1)).toBe('REC-2027-0001');
  });
});
