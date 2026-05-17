import { describe, expect, it } from 'vitest';
import {
  isStackAuthClientConfigured,
  isStackAuthServerConfigured,
  isStackEnvPlaceholder,
} from '@/lib/auth/stack-env';

describe('stack-env', () => {
  it('detects angle-bracket placeholders', () => {
    expect(isStackEnvPlaceholder('<YOUR_PUBLISHABLE_CLIENT_KEY>')).toBe(true);
    expect(isStackEnvPlaceholder('"your-stack-publishable-client-key"')).toBe(true);
  });

  it('rejects client config when publishable key is a placeholder', () => {
    expect(
      isStackAuthClientConfigured({
        projectId: '8935f921-3c67-4e2e-b40f-76c9af7bf79d',
        publishableClientKey: '<YOUR_PUBLISHABLE_CLIENT_KEY>',
        secretServerKey: '',
      }),
    ).toBe(false);
  });

  it('accepts client config with real-looking keys', () => {
    expect(
      isStackAuthClientConfigured({
        projectId: '8935f921-3c67-4e2e-b40f-76c9af7bf79d',
        publishableClientKey: 'pk_test_' + 'a'.repeat(24),
        secretServerKey: '',
      }),
    ).toBe(true);
  });

  it('requires secret key for server config', () => {
    expect(
      isStackAuthServerConfigured({
        projectId: '8935f921-3c67-4e2e-b40f-76c9af7bf79d',
        publishableClientKey: 'pk_test_' + 'a'.repeat(24),
        secretServerKey: '<YOUR_SECRET_SERVER_KEY>',
      }),
    ).toBe(false);
  });
});
