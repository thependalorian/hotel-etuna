/**
 * SOC 2 audit agents — static control catalog and terminology.
 */

import { describe, expect, it } from 'vitest';
import { HOTEL_ETUNA_SOC2_CONTROLS, SOC2_AUDITOR_INTERVIEW_PROMPTS } from '@/lib/compliance/soc2/nayaone-tsc-framework';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

describe('SOC 2 control catalog', () => {
  it('includes security, availability, and confidentiality controls', () => {
    const categories = new Set(HOTEL_ETUNA_SOC2_CONTROLS.map((c) => c.category));
    expect(categories.has('security')).toBe(true);
    expect(categories.has('availability')).toBe(true);
    expect(categories.has('confidentiality')).toBe(true);
  });

  it('maps mandatory access and monitoring controls', () => {
    const ids = HOTEL_ETUNA_SOC2_CONTROLS.map((c) => c.controlId);
    expect(ids).toContain('CC6.1');
    expect(ids).toContain('CC6.2');
    expect(ids).toContain('CC7.2');
  });

  it('provides auditor interview prompts', () => {
    expect(SOC2_AUDITOR_INTERVIEW_PROMPTS.access).toMatch(/2FA|RBAC/i);
  });
});

describe('SOC 2 artifact presence (Hotel Etuna)', () => {
  it('has core security modules on disk', () => {
    expect(fs.existsSync(path.join(ROOT, 'proxy.ts'))).toBe(true);
    expect(fs.existsSync(path.join(ROOT, 'lib/middleware/require2FA.ts'))).toBe(true);
    expect(fs.existsSync(path.join(ROOT, 'lib/compliance/record-audit.ts'))).toBe(true);
  });
});
