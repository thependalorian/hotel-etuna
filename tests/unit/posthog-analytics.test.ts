/**
 * PostHog analytics smoke tests
 *
 * Purpose: Verify client + server PostHog wiring without real network calls.
 * Location: /tests/unit/posthog-analytics.test.ts
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

const posthogJsMock = {
  init: vi.fn(),
  capture: vi.fn(),
  identify: vi.fn(),
  reset: vi.fn(),
  isFeatureEnabled: vi.fn(() => true),
  getFeatureFlag: vi.fn(() => 'enabled'),
  people: { set: vi.fn() },
  group: vi.fn(),
};

const flushMock = vi.fn(async () => undefined);
const captureMock = vi.fn();
const captureExceptionMock = vi.fn();
const PostHogCtorMock = vi.fn();
class MockPostHog {
  constructor(...args: unknown[]) {
    PostHogCtorMock(...args);
  }

  capture = captureMock;
  flush = flushMock;
  captureException = captureExceptionMock;
}

vi.mock('posthog-js', () => ({ default: posthogJsMock }));
vi.mock('posthog-node', () => ({ PostHog: MockPostHog }));
vi.mock('server-only', () => ({}));

describe('PostHog client analytics', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('initializes client PostHog when API key exists', async () => {
    vi.stubEnv('NEXT_PUBLIC_POSTHOG_KEY', 'ph_test_key');
    vi.stubEnv('NEXT_PUBLIC_POSTHOG_HOST', 'https://us.i.posthog.com');
    vi.stubGlobal('window', {
      location: { origin: 'https://www.hoteletuna.com', href: 'https://www.hoteletuna.com/' },
    } as unknown as Window);

    const { initPostHog, trackEvent, identifyUser, trackPageView } = await import('../../lib/posthog');

    const initialized = initPostHog();
    expect(initialized).toBeTruthy();
    expect(posthogJsMock.init).toHaveBeenCalledWith(
      'ph_test_key',
      expect.objectContaining({
        api_host: 'https://us.i.posthog.com',
        defaults: '2026-01-30',
        person_profiles: 'identified_only',
      }),
    );

    trackEvent('booking_started', { channel: 'web' });
    identifyUser('user-123', { email: 'guest@example.com' });
    trackPageView('Home');

    expect(posthogJsMock.capture).toHaveBeenCalledWith('booking_started', { channel: 'web' });
    expect(posthogJsMock.identify).toHaveBeenCalledWith('user-123', { email: 'guest@example.com' });
    expect(posthogJsMock.capture).toHaveBeenCalledWith(
      '$pageview',
      expect.objectContaining({ page_name: 'Home' }),
    );
  });

  it('returns null and avoids init when API key is missing', async () => {
    vi.stubEnv('NEXT_PUBLIC_POSTHOG_KEY', '');
    vi.stubEnv('POSTHOG_PROJECT_API_KEY', '');
    vi.stubGlobal('window', { location: { origin: 'https://www.hoteletuna.com' } } as unknown as Window);
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    const { initPostHog } = await import('../../lib/posthog');
    const initialized = initPostHog();

    expect(initialized).toBeNull();
    expect(posthogJsMock.init).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledWith('PostHog API key not configured. Analytics disabled.');
  });
});

describe('PostHog server analytics', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('captures server exceptions and flushes', async () => {
    vi.stubEnv('POSTHOG_PROJECT_API_KEY', 'ph_server_key');
    vi.stubEnv('POSTHOG_HOST', 'https://us.i.posthog.com');

    const { captureServerException } = await import('../../lib/monitoring/posthog-server');
    await captureServerException(new Error('boom'), 'guest-001', { route: '/api/test' });

    expect(PostHogCtorMock).toHaveBeenCalledWith(
      'ph_server_key',
      expect.objectContaining({ host: 'https://us.i.posthog.com' }),
    );
    expect(captureExceptionMock).toHaveBeenCalled();
    expect(flushMock).toHaveBeenCalled();
  });

  it('no-ops when server key is missing', async () => {
    vi.stubEnv('POSTHOG_PROJECT_API_KEY', '');
    vi.stubEnv('NEXT_PUBLIC_POSTHOG_KEY', '');
    const { getPostHogServer, captureServerException } = await import('../../lib/monitoring/posthog-server');

    expect(getPostHogServer()).toBeNull();
    await captureServerException(new Error('no key'), 'guest-002');

    expect(PostHogCtorMock).not.toHaveBeenCalled();
    expect(flushMock).not.toHaveBeenCalled();
  });
});
