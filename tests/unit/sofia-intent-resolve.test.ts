/**
 * Deterministic Sofia intent resolution (no LLM).
 * Location: tests/unit/sofia-intent-resolve.test.ts
 */

import { describe, it, expect } from 'vitest';
import { SofiaConciergeService } from '@/lib/services/ai/SofiaConciergeService';

type IntentProbe = {
  extractIntent: (text: string) => string;
  resolveIntent: (userMessage: string, assistantResponse: string) => string;
};

function intentProbe(): IntentProbe {
  const svc = new SofiaConciergeService() as SofiaConciergeService & IntentProbe;
  return {
    extractIntent: (text) => svc.extractIntent(text),
    resolveIntent: (user, assistant) => svc.resolveIntent(user, assistant),
  };
}

describe('Sofia intent resolution', () => {
  const { extractIntent, resolveIntent } = intentProbe();

  it('detects pricing from guest message with rates', () => {
    expect(extractIntent('What are your room rates for next week?')).toBe('pricing_inquiry');
    expect(
      resolveIntent(
        'What are your room rates for next week?',
        'I can help you book a room for those dates.',
      ),
    ).toBe('pricing_inquiry');
  });

  it('keeps general_inquiry when guest is vague but assistant mentions rates', () => {
    expect(
      resolveIntent(
        'What can you tell me about this place?',
        'Our room rates start from N$1200 per night.',
      ),
    ).toBe('general_inquiry');
  });

  it('detects restaurant booking from reserve + table phrasing', () => {
    expect(extractIntent('Reserve a table for dinner at 7pm')).toBe('booking_restaurant');
  });
});
