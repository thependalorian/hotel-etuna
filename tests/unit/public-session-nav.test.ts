import { describe, expect, it } from 'vitest';
import {
  getSignedInAccountHref,
  getSignedInAccountLabel,
  isDisposableTestEmail,
} from '@/lib/auth/public-session-nav';

describe('public-session-nav', () => {
  it('routes platform operators to platform console', () => {
    expect(getSignedInAccountHref('super-admin')).toBe('/admin/platform');
    expect(getSignedInAccountLabel('admin')).toBe('Platform');
  });

  it('routes hotel staff to dashboard', () => {
    expect(getSignedInAccountHref('owner')).toBe('/dashboard');
    expect(getSignedInAccountLabel('manager')).toBe('Dashboard');
  });

  it('routes guests to guest hub', () => {
    expect(getSignedInAccountHref('user')).toBe('/guest');
    expect(getSignedInAccountLabel('guest')).toBe('My stay');
  });

  it('flags disposable test emails', () => {
    expect(isDisposableTestEmail('george.test.20260427@example.com')).toBe(true);
    expect(isDisposableTestEmail('george@buffr.ai')).toBe(false);
  });
});
