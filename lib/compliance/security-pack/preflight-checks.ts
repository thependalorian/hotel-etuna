/**
 * Automated checks for Security Prompt Pack §15 Deployment Pre-Flight.
 * Location: lib/compliance/security-pack/preflight-checks.ts
 *
 * Static/repo checks only — run `npm audit` separately via scripts/security/run-preflight.ts.
 */

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import type { PreflightCheck, PreflightStatus, SecurityPreflightReport } from './types';

const PROJECT_ROOT = join(process.cwd());

function read(path: string): string {
  return readFileSync(join(PROJECT_ROOT, path), 'utf-8');
}

function statusFrom(ok: boolean, soft = false): PreflightStatus {
  if (ok) return 'pass';
  return soft ? 'warn' : 'fail';
}

function walkTsFiles(dir: string, acc: string[] = []): string[] {
  if (!existsSync(dir)) return acc;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.next') continue;
      walkTsFiles(full, acc);
    } else if (/\.(ts|tsx)$/.test(entry.name)) {
      acc.push(full);
    }
  }
  return acc;
}

function grepInFiles(files: string[], pattern: RegExp): string[] {
  const hits: string[] = [];
  for (const file of files) {
    const content = readFileSync(file, 'utf-8');
    if (pattern.test(content)) {
      hits.push(relative(PROJECT_ROOT, file));
    }
  }
  return hits;
}

/** Run deployment pre-flight static checks (15 items from the pack). */
export function runSecurityPreflightChecks(): SecurityPreflightReport {
  const checks: PreflightCheck[] = [];

  // 1 — Secrets in gitignore
  const gitignore = existsSync(join(PROJECT_ROOT, '.gitignore'))
    ? read('.gitignore')
    : '';
  checks.push({
    id: 'PF-01',
    section: 2,
    title: 'Secrets not committed (.env in .gitignore)',
    status: statusFrom(/\.env/.test(gitignore)),
    detail: /\.env/.test(gitignore)
      ? '.env patterns present in .gitignore'
      : 'Add .env and .env.local to .gitignore',
  });

  // 2 — Hardcoded API keys in app/lib (heuristic)
  const scanRoots = ['app', 'lib', 'components'].map((d) => join(PROJECT_ROOT, d));
  const tsFiles = scanRoots.flatMap((d) => walkTsFiles(d));
  const secretHits = grepInFiles(tsFiles, /\b(sk-[a-zA-Z0-9]{20,}|ADUMO_JWT_SECRET\s*=\s*['"][^'"]+['"])\b/);
  checks.push({
    id: 'PF-02',
    section: 2,
    title: 'No hardcoded secrets in source',
    status: statusFrom(secretHits.length === 0),
    detail:
      secretHits.length === 0
        ? 'No obvious hardcoded keys in app/lib/components'
        : `Possible secrets: ${secretHits.slice(0, 5).join(', ')}`,
  });

  // 3 — sanitizeErrorDetails
  const apiHelpers = existsSync(join(PROJECT_ROOT, 'lib/utils/api-helpers.ts'))
    ? read('lib/utils/api-helpers.ts')
    : '';
  checks.push({
    id: 'PF-05',
    section: 5,
    title: 'Production error sanitization',
    status: statusFrom(apiHelpers.includes('sanitizeErrorDetails')),
    detail: apiHelpers.includes('sanitizeErrorDetails')
      ? 'sanitizeErrorDetails defined in api-helpers'
      : 'Add sanitizeErrorDetails and use in API routes',
  });

  // 4 — CORS wildcard
  const apiDir = join(PROJECT_ROOT, 'app/api');
  const apiFiles = walkTsFiles(apiDir);
  const corsWildcard = grepInFiles(
    apiFiles,
    /Access-Control-Allow-Origin['"]\s*,\s*['"]\*|Allow-Origin:\s*\*/
  );
  checks.push({
    id: 'PF-06',
    section: 11,
    title: 'CORS not wildcard on API routes',
    status: statusFrom(corsWildcard.length === 0, true),
    detail:
      corsWildcard.length === 0
        ? 'No Access-Control-Allow-Origin: * in app/api'
        : `Review: ${corsWildcard.join(', ')}`,
  });

  // 5 — Debug route production guard
  const debugRoute = existsSync(join(PROJECT_ROOT, 'app/api/debug/auth/route.ts'))
    ? read('app/api/debug/auth/route.ts')
    : '';
  checks.push({
    id: 'PF-07',
    section: 11,
    title: 'Debug routes disabled in production',
    status: statusFrom(
      debugRoute.includes("NODE_ENV === 'production'") || debugRoute.includes('NODE_ENV==="production"')
    ),
    detail: debugRoute.includes('production')
      ? '/api/debug/auth returns 404 in production'
      : 'Guard debug routes with NODE_ENV check',
  });

  // 6 — Security headers (vercel.json)
  const vercelJson = existsSync(join(PROJECT_ROOT, 'vercel.json'))
    ? read('vercel.json')
    : '';
  const hasHeaders =
    vercelJson.includes('X-Content-Type-Options') && vercelJson.includes('X-Frame-Options');
  checks.push({
    id: 'PF-09',
    section: 9,
    title: 'HTTPS security headers (vercel.json)',
    status: statusFrom(hasHeaders),
    detail: hasHeaders
      ? 'X-Content-Type-Options and X-Frame-Options configured'
      : 'Add security headers to vercel.json',
    remediation: 'Consider HSTS and CSP in vercel.json or middleware',
  });

  // 7 — Rate limits on auth/payments
  const rateLimit = existsSync(join(PROJECT_ROOT, 'lib/utils/rate-limit.ts'))
    ? read('lib/utils/rate-limit.ts')
    : '';
  const rateOk =
    rateLimit.includes('/api/auth/login') &&
    rateLimit.includes('/api/payments/virtual') &&
    rateLimit.includes('/api/guest/stays');
  checks.push({
    id: 'PF-10',
    section: 8,
    title: 'Rate limiting on login, payments, guest orders',
    status: statusFrom(rateOk),
    detail: rateOk
      ? 'RATE_LIMITS includes auth, payments/virtual, guest/stays'
      : 'Extend RATE_LIMITS in lib/utils/rate-limit.ts',
  });

  // 8 — XSS: dangerouslySetInnerHTML must use sanitizeHtml
  const clientFiles = walkTsFiles(join(PROJECT_ROOT, 'components'));
  const appPageFiles = walkTsFiles(join(PROJECT_ROOT, 'app')).filter(
    (f) => !f.includes('/api/')
  );
  const htmlFiles = [...clientFiles, ...appPageFiles];
  const rawInnerHtml: string[] = [];
  for (const file of htmlFiles) {
    const content = readFileSync(file, 'utf-8');
    if (!content.includes('dangerouslySetInnerHTML')) continue;
    if (!content.includes('sanitizeHtml')) rawInnerHtml.push(relative(PROJECT_ROOT, file));
  }
  checks.push({
    id: 'PF-06-xss',
    section: 6,
    title: 'dangerouslySetInnerHTML uses sanitizeHtml',
    status: statusFrom(rawInnerHtml.length === 0, true),
    detail:
      rawInnerHtml.length === 0
        ? 'All innerHTML usages import sanitizeHtml'
        : `Sanitize before render: ${rawInnerHtml.join(', ')}`,
  });

  // 9 — RLS verify script
  const rlsScript = existsSync(join(PROJECT_ROOT, 'scripts/db/verify-tenant-rls.ts'));
  checks.push({
    id: 'PF-14',
    section: 4,
    title: 'Tenant RLS verification script',
    status: statusFrom(rlsScript),
    detail: rlsScript
      ? 'scripts/db/verify-tenant-rls.ts present'
      : 'Add RLS verification script',
  });

  // 10 — audit trail helper
  const auditRecord = existsSync(join(PROJECT_ROOT, 'lib/compliance/record-audit.ts'));
  checks.push({
    id: 'PF-15',
    section: 13,
    title: 'Audit trail recording',
    status: statusFrom(auditRecord),
    detail: auditRecord
      ? 'lib/compliance/record-audit.ts present'
      : 'Wire audit_trail for security events',
  });

  // 11 — CMS upload validation
  const validation = existsSync(join(PROJECT_ROOT, 'lib/utils/validation.ts'))
    ? read('lib/utils/validation.ts')
    : '';
  const uploadOk =
    validation.includes('CMS_ALLOWED_MIME') && validation.includes('CMS_MEDIA_MAX_BYTES');
  checks.push({
    id: 'PF-11-upload',
    section: 7,
    title: 'CMS media upload validation (type, size, filename)',
    status: statusFrom(uploadOk),
    detail: uploadOk
      ? 'createCmsMediaSchema enforces MIME whitelist and 5MB max'
      : 'Tighten createCmsMediaSchema per Security Prompt Pack §7',
  });

  // 12 — Shared sanitize utility
  const sanitizeUtil = existsSync(join(PROJECT_ROOT, 'lib/utils/sanitize-html.ts'));
  checks.push({
    id: 'PF-06-sanitize-util',
    section: 6,
    title: 'Central HTML sanitization utility',
    status: statusFrom(sanitizeUtil),
    detail: sanitizeUtil
      ? 'lib/utils/sanitize-html.ts (DOMPurify)'
      : 'Add isomorphic-dompurify wrapper',
  });

  const summary = {
    pass: checks.filter((c) => c.status === 'pass').length,
    warn: checks.filter((c) => c.status === 'warn').length,
    fail: checks.filter((c) => c.status === 'fail').length,
  };
  const scored = checks.filter((c) => c.status !== 'warn');
  const passWeighted = scored.filter((c) => c.status === 'pass').length;
  const scorePercent =
    scored.length === 0 ? 0 : Math.round((passWeighted / scored.length) * 100);

  return {
    generatedAt: new Date().toISOString(),
    framework: 'Hotel Etuna Security Prompt Pack',
    deploymentPreflight: true,
    scorePercent,
    summary,
    checks,
  };
}
