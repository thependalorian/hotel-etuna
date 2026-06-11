/**
 * Platform operator console labels — Buffr staff (@buffr.ai) only; guest brand stays Hotel Etuna.
 * Location: lib/config/platform-console.ts
 */

import { brand } from '@/lib/copy/brand';
import { getPublicAppUrl } from '@/lib/utils/public-app-url';

export const platformConsole = {
  navLabel: 'Platform console',
  digestRecipientName: brand.name,
  digestSubjectPrefix: brand.name,
  digestCtaText: 'Open platform console',
  digestOperatorFallback: 'Hotel Etuna operator',
} as const;

/** Default founder digest recipients when FOUNDER_DIGEST_EMAIL is unset. */
export function defaultFounderDigestRecipients(): string[] {
  return [brand.emailFounder];
}

/** Public hostname for tenant display (single-property OS: hoteletuna.com). */
export function tenantPublicSiteLabel(tenant: {
  domain?: string | null;
  subdomain?: string | null;
}): string {
  if (tenant.domain?.trim()) return tenant.domain.trim();
  const host = getPublicAppUrl().replace(/^https?:\/\//, '');
  if (tenant.subdomain?.trim()) {
    return `${host} · ${tenant.subdomain}`;
  }
  return host;
}
