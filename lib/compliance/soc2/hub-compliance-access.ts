/**
 * Hub-only gate for SOC 2 compliance APIs (Buffr operates PMS; partners excluded).
 * Location: lib/compliance/soc2/hub-compliance-access.ts
 */

import { errorResponse } from '@/lib/utils/api-helpers';
import type { NextResponse } from 'next/server';

export const SOC2_HUB_ROLES = ['owner', 'manager', 'admin', 'super-admin'] as const;

export function assertHubComplianceAccess(user: {
  tenantId?: string | null;
}): NextResponse | null {
  const hubTenantId = process.env.HUB_TENANT_ID?.trim();
  if (!hubTenantId) {
    return errorResponse(
      'Hub tenant is not configured',
      503,
      'MISSING_HUB_TENANT'
    );
  }
  if (!user.tenantId || user.tenantId !== hubTenantId) {
    return errorResponse(
      'SOC 2 compliance reports are hub-only',
      403,
      'FORBIDDEN'
    );
  }
  return null;
}

export function defaultSoc2Period(): { from: Date; to: Date } {
  const to = new Date();
  const from = new Date(to);
  from.setDate(from.getDate() - 90);
  return { from, to };
}

export function parseSoc2DateParam(value: string | null, fallback: Date): Date {
  if (!value) return fallback;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? fallback : d;
}

/** Shared period resolver for hub + platform SOC 2 routes (C8 DRY). */
export function resolveSoc2PeriodFromSearchParams(
  searchParams: URLSearchParams
): { from: Date; to: Date } | { error: string } {
  const defaults = defaultSoc2Period();
  const from = parseSoc2DateParam(searchParams.get('from'), defaults.from);
  const to = parseSoc2DateParam(searchParams.get('to'), defaults.to);
  if (from > to) {
    return { error: 'from must be before to' };
  }
  return { from, to };
}
