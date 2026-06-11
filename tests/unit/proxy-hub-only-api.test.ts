/**
 * proxy.ts hub-only API prefixes — partners must not reach Sofia/CRM/AI routes.
 * Location: tests/unit/proxy-hub-only-api.test.ts
 * Policy: AI_USAGE_POLICY.md, ACCESS_CONTROL_POLICY.md
 */

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('Hub-only API route configuration', () => {
  const proxySource = readFileSync(join(process.cwd(), 'proxy.ts'), 'utf8');

  it('declares hub-only prefixes for Sofia, CRM, and AI', () => {
    expect(proxySource).toContain("'/api/sofia'");
    expect(proxySource).toContain("'/api/crm'");
    expect(proxySource).toContain("'/api/ai'");
  });

  it('includes HUB_ONLY_API_PREFIXES guard', () => {
    expect(proxySource).toMatch(/HUB_ONLY_API_PREFIXES/);
  });
});
