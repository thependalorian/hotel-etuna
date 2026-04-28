import { describe, it, expect } from 'vitest';
import { runGuestMarketingSegmentWorkflow } from '@/lib/workflows/hospitalityMarketingWorkflows';

describe('runGuestMarketingSegmentWorkflow', () => {
  it('returns no promotional channels when marketing consent is false', async () => {
    const r = await runGuestMarketingSegmentWorkflow({
      tenantId: '00000000-0000-4000-8000-000000000001',
      guestId: '00000000-0000-4000-8000-000000000002',
      totalBookings: 5,
      lifetimeValueNad: 10000,
      lastStayDaysAgo: 10,
      marketingConsent: false,
    });
    expect(r.recommendedChannels).toEqual([]);
    expect(r.notes).toMatch(/not send promotional/i);
  });

  it('includes email in recommended channels when consent is true', async () => {
    const r = await runGuestMarketingSegmentWorkflow({
      tenantId: '00000000-0000-4000-8000-000000000001',
      guestId: '00000000-0000-4000-8000-000000000002',
      totalBookings: 1,
      lifetimeValueNad: 100,
      lastStayDaysAgo: 5,
      marketingConsent: true,
    });
    expect(r.recommendedChannels).toContain('email');
  });
});
