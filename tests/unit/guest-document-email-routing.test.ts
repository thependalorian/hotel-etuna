/**
 * Guest document email routing heuristics.
 * Location: tests/unit/guest-document-email-routing.test.ts
 */

import { describe, it, expect } from 'vitest';
import { isFinancialDocumentEmailRequest } from '@/lib/services/documents/guestDocumentEmailRouting';

describe('guestDocumentEmailRouting', () => {
  it('detects receipt resend requests', () => {
    expect(isFinancialDocumentEmailRequest('Please resend my receipt for my stay')).toBe(true);
  });

  it('detects invoice copy requests', () => {
    expect(isFinancialDocumentEmailRequest('Can you email me a copy of my tax invoice?')).toBe(true);
  });

  it('ignores unrelated concierge messages', () => {
    expect(isFinancialDocumentEmailRequest('What time is breakfast?')).toBe(false);
  });
});
