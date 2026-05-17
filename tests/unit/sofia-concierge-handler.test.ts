/**
 * Unit tests for shared Sofia concierge handler (role mapping, pricing gate).
 */

import { describe, expect, it } from 'vitest';
import {
  mapSessionRoleToSofiaUserRole,
  shouldApplySofiaPricingGate,
  sofiaPricingGateResponse,
  buildSofiaAiRequest,
} from '@/lib/services/ai/sofia-concierge-handler';

describe('sofia-concierge-handler', () => {
  it('maps staff and platform roles to admin', () => {
    expect(mapSessionRoleToSofiaUserRole('owner')).toBe('admin');
    expect(mapSessionRoleToSofiaUserRole('manager')).toBe('admin');
    expect(mapSessionRoleToSofiaUserRole('super-admin')).toBe('admin');
  });

  it('maps guest consumer roles to guest', () => {
    expect(mapSessionRoleToSofiaUserRole('guest')).toBe('guest');
    expect(mapSessionRoleToSofiaUserRole('user')).toBe('guest');
  });

  it('maps unknown roles to public', () => {
    expect(mapSessionRoleToSofiaUserRole(null)).toBe('public');
    expect(mapSessionRoleToSofiaUserRole('partner')).toBe('public');
  });

  it('applies pricing gate only for public role', () => {
    expect(shouldApplySofiaPricingGate('What are your rates?', 'public')).toBe(true);
    expect(shouldApplySofiaPricingGate('What are your rates?', 'guest')).toBe(false);
    expect(shouldApplySofiaPricingGate('Hello', 'public')).toBe(false);
  });

  it('pricing gate response matches AIResponse shape', () => {
    const res = sofiaPricingGateResponse();
    expect(res.intent).toBe('auth_required_for_pricing');
    expect(res.response).toContain('sign up');
    expect(res.suggestions?.length).toBeGreaterThan(0);
  });

  it('buildSofiaAiRequest aligns context with ConversationContext', () => {
    const req = buildSofiaAiRequest({
      message: 'Hi',
      sessionId: 'sess_1',
      tenantId: '00000000-0000-0000-0000-000000000001',
      propertyId: '00000000-0000-0000-0000-000000000002',
      channel: 'WHATSAPP',
    });
    expect(req.context.sessionId).toBe('sess_1');
    expect(req.context.tenantId).toBe('00000000-0000-0000-0000-000000000001');
    expect(req.channel).toBe('WHATSAPP');
  });
});
