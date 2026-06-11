import { describe, expect, it } from 'vitest';
import {
  getDefaultPostLoginPath,
  getPostLoginRedirect,
  isGuestConsumerRole,
  isStaffRole,
  sanitizeRedirectPath,
} from '@/lib/auth/roles';

describe('auth roles', () => {
  it('identifies guest consumer roles', () => {
    expect(isGuestConsumerRole('guest')).toBe(true);
    expect(isGuestConsumerRole('user')).toBe(true);
    expect(isGuestConsumerRole('owner')).toBe(false);
  });

  it('routes staff and guests to correct defaults', () => {
    expect(getDefaultPostLoginPath('owner')).toBe('/dashboard');
    expect(getDefaultPostLoginPath('guest')).toBe('/guest');
    expect(getDefaultPostLoginPath('super-admin')).toBe('/admin/platform');
    expect(getDefaultPostLoginPath('partner_admin')).toBe('/partner/dashboard');
    expect(getDefaultPostLoginPath('desk')).toBe('/dashboard');
  });

  it('honors safe redirect paths', () => {
    expect(getPostLoginRedirect('guest', '/guest/stays/abc')).toBe('/guest/stays/abc');
    expect(getPostLoginRedirect('guest', '//evil.com')).toBe('/guest');
    expect(sanitizeRedirectPath('/api/secret')).toBeUndefined();
    expect(sanitizeRedirectPath('/\\evil')).toBeUndefined();
    expect(sanitizeRedirectPath('/@evil')).toBeUndefined();
    expect(sanitizeRedirectPath('/guest#booking')).toBe('/guest#booking');
  });

  it('staff role is distinct from guest', () => {
    expect(isStaffRole('staff')).toBe(true);
    expect(isGuestConsumerRole('staff')).toBe(false);
  });
});
