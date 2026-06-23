/**
 * Unit tests for occupancy-band rate recommendation math + rationale templates.
 * Pure functions only — no DB. Covers happy path, edge cases, and degenerate input.
 */
import { describe, it, expect } from 'vitest';
import { demandBand, recommendRate } from '@/lib/services/intelligence/rate-pricing';
import {
  rateRationaleTemplate,
  reorderRationaleTemplate,
} from '@/lib/services/intelligence/recommendation-rationale';

describe('demandBand', () => {
  it('maps high occupancy to peak (+15%)', () => {
    expect(demandBand(0.9)).toEqual({ band: 'peak', adjustmentPct: 0.15 });
    expect(demandBand(0.85)).toEqual({ band: 'peak', adjustmentPct: 0.15 });
  });

  it('maps mid bands correctly', () => {
    expect(demandBand(0.75)).toEqual({ band: 'high', adjustmentPct: 0.08 });
    expect(demandBand(0.6)).toEqual({ band: 'steady', adjustmentPct: 0 });
    expect(demandBand(0.4)).toEqual({ band: 'soft', adjustmentPct: -0.05 });
  });

  it('maps very low occupancy to low (-10%) and tolerates bad input', () => {
    expect(demandBand(0.1)).toEqual({ band: 'low', adjustmentPct: -0.1 });
    expect(demandBand(Number.NaN)).toEqual({ band: 'low', adjustmentPct: -0.1 });
  });
});

describe('recommendRate', () => {
  it('raises rate and rounds to nearest N$10 in peak demand', () => {
    // 800 × 1.15 = 920 → rounds to 920
    expect(recommendRate(800, 0.9).recommendedRate).toBe(920);
  });

  it('holds rate in steady demand', () => {
    expect(recommendRate(1000, 0.6).recommendedRate).toBe(1000);
  });

  it('clamps swings to ±25% and handles zero/invalid base', () => {
    // Even at -10% band, never below 75% of base; result rounded to nearest 10.
    const low = recommendRate(2000, 0.05);
    expect(low.recommendedRate).toBe(1800); // 2000 × 0.90 = 1800 (within clamp)
    expect(recommendRate(0, 0.9).recommendedRate).toBe(0);
    expect(recommendRate(Number.NaN, 0.9).recommendedRate).toBe(0);
  });
});

describe('rationale templates', () => {
  it('rate template keeps the exact numbers and asks for approval', () => {
    const text = rateRationaleTemplate({
      roomType: 'Executive Room',
      band: 'peak',
      forecastOccupancy: 0.9,
      currentRate: 1000,
      recommendedRate: 1150,
      adjustmentPct: 0.15,
      horizonDays: 30,
    });
    expect(text).toContain('Executive Room');
    expect(text).toContain('N$1000');
    expect(text).toContain('N$1150');
    expect(text).toContain('+15%');
    expect(text.toLowerCase()).toContain('approval');
  });

  it('reorder template reflects out-of-stock state', () => {
    const text = reorderRationaleTemplate({
      name: 'Tonic Water',
      unit: 'bottle',
      quantityOnHand: 0,
      reorderPoint: 12,
      recommendedQuantity: 24,
    });
    expect(text).toContain('Tonic Water');
    expect(text).toContain('out of stock');
    expect(text).toContain('24 bottle');
    expect(text.toLowerCase()).toContain('approval');
  });
});
