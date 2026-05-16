import { describe, expect, it } from 'vitest';
import {
  seedControls,
  scoreControls,
  summarizeControls,
  HOTEL_ETUNA_SOC2_SCOPE,
} from '@/lib/compliance/soc2/control-matrix';
import type { Soc2ControlResult } from '@/lib/compliance/soc2/types';

describe('SOC 2 control matrix', () => {
  it('seeds controls with manual default status', () => {
    const controls = seedControls();
    expect(controls.length).toBeGreaterThan(10);
    expect(controls.every((c) => c.status === 'manual')).toBe(true);
    expect(controls.every((c) => c.evidence.length === 0)).toBe(true);
  });

  it('scores controls by status weights', () => {
    const base = seedControls().slice(0, 2) as Soc2ControlResult[];
    base[0] = { ...base[0], status: 'compliant' };
    base[1] = { ...base[1], status: 'gap' };
    expect(scoreControls(base)).toBe(50);
  });

  it('summarizes status counts', () => {
    const controls = seedControls().slice(0, 3) as Soc2ControlResult[];
    controls[0] = { ...controls[0], status: 'compliant' };
    controls[1] = { ...controls[1], status: 'partial' };
    controls[2] = { ...controls[2], status: 'gap' };
    const summary = summarizeControls(controls);
    expect(summary).toEqual({
      compliant: 1,
      partial: 1,
      gap: 1,
      manual: 0,
      inherited: 0,
    });
  });

  it('defines in-scope system boundaries', () => {
    expect(HOTEL_ETUNA_SOC2_SCOPE.system).toContain('Hotel Etuna');
    expect(HOTEL_ETUNA_SOC2_SCOPE.inScope).toEqual(
      expect.arrayContaining([expect.stringMatching(/Vercel/i)])
    );
  });
});
