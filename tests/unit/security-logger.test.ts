import { describe, it, expect, vi, beforeEach } from 'vitest';

const insertMock = vi.fn().mockResolvedValue(undefined);

vi.mock('@/lib/db', () => ({
  db: { insert: () => ({ values: insertMock }) },
}));

vi.mock('@/lib/db/schema', () => ({
  systemLogs: { _: 'systemLogs' },
  auditTrail: { _: 'auditTrail' },
}));

describe('logSecurityEvent', () => {
  beforeEach(() => {
    insertMock.mockClear();
  });

  it('stores pathname in oldValues and leaves resourceId null for audit_trail', async () => {
    const { logSecurityEvent } = await import('@/lib/utils/security-logger.server');

    await logSecurityEvent({
      type: 'unauthorized_access',
      pathname: '/properties',
      method: 'GET',
      userId: 'user-1',
      tenantId: 'tenant-1',
      details: { reason: 'Role guest denied access' },
    });

    expect(insertMock).toHaveBeenCalled();
    const auditPayload = insertMock.mock.calls.find(
      (call) => call[0]?.resourceType === 'security',
    )?.[0];

    expect(auditPayload).toMatchObject({
      resourceId: null,
      resourceType: 'security',
      oldValues: expect.objectContaining({
        pathname: '/properties',
        method: 'GET',
        reason: 'Role guest denied access',
      }),
    });
  });
});
