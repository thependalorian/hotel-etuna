import { describe, expect, it } from 'vitest';
import { passwordSchema } from '@/lib/validation/password';

describe('passwordSchema', () => {
  it('accepts a strong password', () => {
    const result = passwordSchema.safeParse('HotelEtuna2026!');
    expect(result.success).toBe(true);
  });

  it('rejects short passwords', () => {
    const result = passwordSchema.safeParse('Short1a');
    expect(result.success).toBe(false);
  });

  it('requires mixed case and number', () => {
    expect(passwordSchema.safeParse('alllowercase12').success).toBe(false);
    expect(passwordSchema.safeParse('ALLUPPERCASE12').success).toBe(false);
    expect(passwordSchema.safeParse('NoNumbersHere!').success).toBe(false);
  });
});
