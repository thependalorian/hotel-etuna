/**
 * SOC 2 control matrix and orchestrator smoke tests (no DB).
 */

import { describe, expect, it } from 'vitest';
import { seedControls, scoreControls, summarizeControls } from '@/lib/compliance/soc2/control-matrix';

describe('SOC 2 control matrix', () => {
  it('seeds controls for all three trust categories', () => {
    const controls = seedControls();
    expect(controls.length).toBeGreaterThanOrEqual(10);
    const categories = new Set(controls.map((c) => c.category));
    expect(categories.has('security')).toBe(true);
    expect(categories.has('availability')).toBe(true);
    expect(categories.has('confidentiality')).toBe(true);
  });

  it('scores compliant higher than gap', () => {
    const base = seedControls();
    const compliant = base.map((c) => ({ ...c, status: 'compliant' as const }));
    const gap = base.map((c) => ({ ...c, status: 'gap' as const }));
    expect(scoreControls(compliant)).toBeGreaterThan(scoreControls(gap));
  });

  it('summarizes status counts', () => {
    const summary = summarizeControls(
      seedControls().map((c, i) => ({
        ...c,
        status: i % 2 === 0 ? 'compliant' : 'gap',
      }))
    );
    expect(summary.compliant).toBeGreaterThan(0);
    expect(summary.gap).toBeGreaterThan(0);
  });
});
