/**
 * API Auth Gate Tests
 *
 * Purpose: Verify all 12 routes fixed in the 2026-06-03 security pass
 * return non-200 for unauthenticated requests (OWASP A01:2021 guard).
 *
 * Location: tests/unit/api-auth-gates.test.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { AppError } from '@/lib/utils/errors';

vi.mock('@/lib/utils/api-helpers', async (importOriginal) => {
  const mod = await importOriginal();
  const { AppError: AE } = await import('@/lib/utils/errors');
  return { ...mod, requireTenantSessionUser: vi.fn().mockRejectedValue(new AE(401, 'Unauthorized')) };
});

vi.mock('@/lib/services/fraud/FraudDetectionService', () => ({
  FraudDetectionService: vi.fn().mockImplementation(() => ({ getStatistics: vi.fn(), getAlerts: vi.fn(), updateAlert: vi.fn(), analyzeTransaction: vi.fn() })),
}));
vi.mock('@/lib/services/compliance/AMLMonitoringService', () => ({
  AMLMonitoringService: { monitorTransaction: vi.fn(), getPendingAlerts: vi.fn().mockResolvedValue([]) },
}));
vi.mock('@/lib/services/compliance/STRGenerationService', () => ({
  STRGenerationService: { createSTR: vi.fn(), getSTRs: vi.fn().mockResolvedValue([]), submitSTR: vi.fn(), getApproachingDeadlines: vi.fn().mockResolvedValue([]), getOverdueSTRs: vi.fn().mockResolvedValue([]), getSTRStatistics: vi.fn().mockResolvedValue({}) },
}));
vi.mock('@/lib/services/compliance/BonIncidentReportingService', () => ({
  BonIncidentReportingService: vi.fn().mockImplementation(() => ({})),
}));
vi.mock('@/lib/services/payment/PaymentSecurityService', () => ({
  PaymentSecurityService: { validatePaymentSecurity: vi.fn() },
}));
vi.mock('@/lib/services/documents/ElectronicSignatureService', () => ({
  ElectronicSignatureService: { captureSignature: vi.fn() },
}));
vi.mock('@/lib/services/compliance/TransactionValidator', () => ({
  transactionValidator: { validateTransaction: vi.fn() },
}));
vi.mock('@/lib/compliance/record-audit', () => ({ recordAuditTrail: vi.fn().mockResolvedValue(undefined) }));
vi.mock('@neondatabase/serverless', () => ({ neon: vi.fn(() => vi.fn().mockResolvedValue([])) }));

function req(url: string, method: 'GET' | 'POST' | 'PATCH' = 'GET', body?: unknown): NextRequest {
  return new NextRequest(`http://localhost:3000${url}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}

async function notOk(handler: (r: NextRequest) => Promise<Response>, r: NextRequest) {
  const res = await handler(r);
  expect(res.status).not.toBe(200);
  const body = await res.json().catch(() => ({}));
  expect(body?.success).not.toBe(true);
}

describe('Auth Gates — 12 fixed routes return non-200 without auth', () => {
  beforeEach(() => vi.clearAllMocks());

  it('GET /fraud/statistics', async () => { const { GET } = await import('@/app/api/fraud/statistics/route'); await notOk(GET, req('/api/fraud/statistics')); });
  it('GET /fraud/alerts', async () => { const { GET } = await import('@/app/api/fraud/alerts/route'); await notOk(GET, req('/api/fraud/alerts')); });
  it('PATCH /fraud/alerts', async () => { const { PATCH } = await import('@/app/api/fraud/alerts/route'); await notOk(PATCH as (r: NextRequest) => Promise<Response>, req('/api/fraud/alerts', 'PATCH', {})); });
  it('POST /fraud/analyze', async () => { const { POST } = await import('@/app/api/fraud/analyze/route'); await notOk(POST, req('/api/fraud/analyze', 'POST', {})); });
  it('POST /compliance/aml/monitor', async () => { const { POST } = await import('@/app/api/compliance/aml/monitor/route'); await notOk(POST, req('/api/compliance/aml/monitor', 'POST', {})); });
  it('GET /compliance/aml/monitor', async () => { const { GET } = await import('@/app/api/compliance/aml/monitor/route'); await notOk(GET, req('/api/compliance/aml/monitor')); });
  it('POST /compliance/aml/str/create', async () => { const { POST } = await import('@/app/api/compliance/aml/str/create/route'); await notOk(POST, req('/api/compliance/aml/str/create', 'POST', {})); });
  it('GET /compliance/aml/str/create', async () => { const { GET } = await import('@/app/api/compliance/aml/str/create/route'); await notOk(GET, req('/api/compliance/aml/str/create')); });
  it('POST /compliance/aml/str/submit', async () => { const { POST } = await import('@/app/api/compliance/aml/str/submit/route'); await notOk(POST, req('/api/compliance/aml/str/submit', 'POST', {})); });
  it('GET /compliance/aml/reports/dashboard', async () => { const { GET } = await import('@/app/api/compliance/aml/reports/dashboard/route'); await notOk(GET, req('/api/compliance/aml/reports/dashboard')); });
  it('POST /compliance/psd/bon-incident', async () => { const { POST } = await import('@/app/api/compliance/psd/bon-incident/route'); await notOk(POST, req('/api/compliance/psd/bon-incident', 'POST', {})); });
  it('POST /compliance/psd/payment-security', async () => { const { POST } = await import('@/app/api/compliance/psd/payment-security/route'); await notOk(POST, req('/api/compliance/psd/payment-security', 'POST', {})); });
  it('POST /compliance/kyc/verify', async () => { const { POST } = await import('@/app/api/compliance/kyc/verify/route'); await notOk(POST, req('/api/compliance/kyc/verify', 'POST', {})); });
  it('POST /documents/sign', async () => { const { POST } = await import('@/app/api/documents/sign/route'); await notOk(POST, req('/api/documents/sign', 'POST', {})); });
});
