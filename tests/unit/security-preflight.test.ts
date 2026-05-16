import { describe, it, expect } from 'vitest';
import { runSecurityPreflightChecks } from '@/lib/compliance/security-pack/preflight-checks';

describe('Security Prompt Pack pre-flight', () => {
  it('runs static checks and returns a scored report', () => {
    const report = runSecurityPreflightChecks();
    expect(report.framework).toContain('Security Prompt Pack');
    expect(report.checks.length).toBeGreaterThanOrEqual(10);
    expect(report.summary.pass + report.summary.warn + report.summary.fail).toBe(
      report.checks.length
    );

    const ids = report.checks.map((c) => c.id);
    expect(ids).toContain('PF-01');
    expect(ids).toContain('PF-10');
    expect(ids).toContain('PF-06-sanitize-util');
  });

  it('expects CMS upload validation and sanitize utility to pass', () => {
    const report = runSecurityPreflightChecks();
    const upload = report.checks.find((c) => c.id === 'PF-11-upload');
    const sanitize = report.checks.find((c) => c.id === 'PF-06-sanitize-util');
    expect(upload?.status).toBe('pass');
    expect(sanitize?.status).toBe('pass');
  });
});
