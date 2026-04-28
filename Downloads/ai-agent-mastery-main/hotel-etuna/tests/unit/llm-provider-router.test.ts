/**
 * LLM provider router unit tests
 *
 * Purpose: Verify Sofia AI provider failover without real external API calls.
 * Location: tests/unit/llm-provider-router.test.ts
 */

import { describe, expect, it, vi } from 'vitest';
import { LLMProviderRouter, type LlmProviderConfig } from '@/lib/services/ai/LLMProviderRouter';

const messages = [
  { role: 'system' as const, content: 'You are Sofia.' },
  { role: 'user' as const, content: 'Hello' },
];

function openAiProvider(id: string, priority: number): LlmProviderConfig {
  return {
    id,
    kind: 'openai-compatible',
    apiKey: `${id}-key`,
    baseUrl: `https://${id}.example.test/v1`,
    model: `${id}-model`,
    priority,
  };
}

describe('LLMProviderRouter', () => {
  it('falls through to the next provider when the primary provider fails', async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(JSON.stringify({ error: 'rate limited' }), { status: 429 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            choices: [{ message: { content: 'Fallback provider response' } }],
          }),
          { status: 200 }
        )
      );

    const router = new LLMProviderRouter([openAiProvider('deepseek', 10), openAiProvider('openai', 20)], fetcher);
    const result = await router.chat(messages);

    expect(result.content).toBe('Fallback provider response');
    expect(result.providerId).toBe('openai');
    expect(result.degraded).toBe(false);
    expect(result.attemptedProviders).toEqual(['deepseek', 'openai']);
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it('returns local fallback when no providers are configured', async () => {
    const fetcher = vi.fn<typeof fetch>();
    const router = new LLMProviderRouter([], fetcher);

    const result = await router.chat(messages, {
      fallback: () => 'Local Sofia response',
    });

    expect(result.content).toBe('Local Sofia response');
    expect(result.providerId).toBe('local_fallback');
    expect(result.model).toBe('rule_based');
    expect(result.degraded).toBe(true);
    expect(result.attemptedProviders).toEqual([]);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('supports Anthropic response extraction', async () => {
    const provider: LlmProviderConfig = {
      id: 'anthropic',
      kind: 'anthropic',
      apiKey: 'anthropic-key',
      baseUrl: 'https://anthropic.example.test/v1',
      model: 'claude-haiku',
      priority: 10,
    };
    const fetcher = vi.fn<typeof fetch>().mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          content: [{ type: 'text', text: 'Anthropic response' }],
        }),
        { status: 200 }
      )
    );

    const router = new LLMProviderRouter([provider], fetcher);
    const result = await router.chat(messages);

    expect(result.content).toBe('Anthropic response');
    expect(result.providerId).toBe('anthropic');
    const [, init] = fetcher.mock.calls[0];
    expect(String(init?.body)).toContain('"max_tokens"');
  });
});
