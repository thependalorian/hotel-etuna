import { describe, expect, it } from 'vitest';
import { extractFactsHeuristic, factsAreSimilar } from '@/lib/services/crm/SofiaGuestFactExtractor';
import {
  computeDepositCents,
  generateBookingCode,
  hashOtp,
  generateOtp,
} from '@/lib/services/sofia/RestaurantReservationFlowService';

describe('SofiaGuestFactExtractor', () => {
  it('extracts dietary heuristics', () => {
    const facts = extractFactsHeuristic("We're vegan and prefer a quiet table");
    expect(facts.some((f) => f.factText.toLowerCase().includes('vegan'))).toBe(true);
  });

  it('detects similar facts', () => {
    expect(factsAreSimilar('Guest prefers quiet tables', 'Prefers quiet tables')).toBe(true);
    expect(factsAreSimilar('Loves Star Wars', 'Works as engineer')).toBe(false);
  });
});

describe('RestaurantReservationFlowService', () => {
  it('computes base and per-guest deposit', () => {
    expect(computeDepositCents(2)).toBe(5000);
    expect(computeDepositCents(4)).toBe(10000);
  });

  it('generates booking code and hashes OTP', () => {
    expect(generateBookingCode()).toMatch(/^[A-F0-9]{6}$/);
    const otp = generateOtp();
    expect(otp).toMatch(/^\d{6}$/);
    expect(hashOtp(otp)).toHaveLength(64);
  });
});
