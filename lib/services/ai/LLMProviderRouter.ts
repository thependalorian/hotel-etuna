/**
 * LLM provider router
 *
 * Purpose: Cost-conscious, resilient provider failover for Sofia AI calls.
 * Location: /lib/services/ai/LLMProviderRouter.ts
 */

type ChatRole = 'system' | 'user' | 'assistant';

export type LlmChatMessage = {
  role: ChatRole;
  content: string;
};

type ProviderKind = 'openai-compatible' | 'anthropic';

export type LlmProviderConfig = {
  id: string;
  kind: ProviderKind;
  apiKey: string;
  baseUrl: string;
  model: string;
  priority: number;
  enabled?: boolean;
};

export type LlmTokenUsage = {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
};

export type LlmRouterResult = {
  content: string;
  providerId: string;
  model: string;
  degraded: boolean;
  attemptedProviders: string[];
  usage?: LlmTokenUsage;
};

export type LlmRouterOptions = {
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
  fallback?: () => string;
};

type FetchLike = typeof fetch;

function cleanEnv(value: string | undefined): string {
  return value?.trim() ?? '';
}

function providerOrder(): string[] {
  return (process.env.AI_PROVIDER_ORDER || 'deepseek,openai,anthropic,llm')
    .split(',')
    .map((provider) => provider.trim())
    .filter(Boolean);
}

function sortProviders(providers: LlmProviderConfig[]): LlmProviderConfig[] {
  const order = providerOrder();
  return [...providers].sort((a, b) => {
    const orderA = order.indexOf(a.id);
    const orderB = order.indexOf(b.id);
    const scoreA = orderA === -1 ? Number.MAX_SAFE_INTEGER : orderA;
    const scoreB = orderB === -1 ? Number.MAX_SAFE_INTEGER : orderB;
    return scoreA - scoreB || a.priority - b.priority;
  });
}

export function getConfiguredLlmProviders(): LlmProviderConfig[] {
  const providers: LlmProviderConfig[] = [
    {
      id: 'deepseek',
      kind: 'openai-compatible',
      apiKey: cleanEnv(process.env.DEEPSEEK_API_KEY),
      baseUrl: cleanEnv(process.env.DEEPSEEK_BASE_URL) || 'https://api.deepseek.com/v1',
      model: cleanEnv(process.env.DEEPSEEK_MODEL) || 'deepseek-chat',
      priority: 10,
    },
    {
      id: 'openai',
      kind: 'openai-compatible',
      apiKey: cleanEnv(process.env.OPENAI_API_KEY),
      baseUrl: cleanEnv(process.env.OPENAI_BASE_URL) || 'https://api.openai.com/v1',
      model: cleanEnv(process.env.OPENAI_CHAT_MODEL) || 'gpt-4o-mini',
      priority: 20,
    },
    {
      id: 'anthropic',
      kind: 'anthropic',
      apiKey: cleanEnv(process.env.ANTHROPIC_API_KEY),
      baseUrl: cleanEnv(process.env.ANTHROPIC_BASE_URL) || 'https://api.anthropic.com/v1',
      model: cleanEnv(process.env.ANTHROPIC_MODEL) || 'claude-3-5-haiku-latest',
      priority: 30,
    },
    {
      id: 'llm',
      kind: 'openai-compatible',
      apiKey: cleanEnv(process.env.LLM_API_KEY),
      baseUrl: cleanEnv(process.env.LLM_BASE_URL),
      model: cleanEnv(process.env.LLM_CHOICE) || cleanEnv(process.env.LLM_MODEL) || 'llama3.2:latest',
      priority: 40,
    },
  ];

  return sortProviders(
    providers.filter((provider) => provider.enabled !== false && provider.apiKey && provider.baseUrl)
  );
}

function extractOpenAiContent(payload: unknown): string | null {
  const choices = (payload as { choices?: Array<{ message?: { content?: unknown } }> }).choices;
  const content = choices?.[0]?.message?.content;
  return typeof content === 'string' && content.trim() ? content : null;
}

function extractOpenAiUsage(payload: unknown): LlmTokenUsage | undefined {
  const usage = (payload as { usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number } })
    .usage;
  if (!usage) return undefined;
  const promptTokens = usage.prompt_tokens ?? 0;
  const completionTokens = usage.completion_tokens ?? 0;
  const totalTokens = usage.total_tokens ?? promptTokens + completionTokens;
  if (totalTokens <= 0) return undefined;
  return { promptTokens, completionTokens, totalTokens };
}

function extractAnthropicUsage(payload: unknown): LlmTokenUsage | undefined {
  const usage = (payload as {
    usage?: { input_tokens?: number; output_tokens?: number };
  }).usage;
  if (!usage) return undefined;
  const promptTokens = usage.input_tokens ?? 0;
  const completionTokens = usage.output_tokens ?? 0;
  const totalTokens = promptTokens + completionTokens;
  if (totalTokens <= 0) return undefined;
  return { promptTokens, completionTokens, totalTokens };
}

function extractAnthropicContent(payload: unknown): string | null {
  const content = (payload as { content?: Array<{ type?: string; text?: unknown }> }).content;
  const text = content?.find((part) => part.type === 'text' && typeof part.text === 'string')?.text;
  return typeof text === 'string' && text.trim() ? text : null;
}

function toAnthropicPayload(messages: LlmChatMessage[], maxTokens: number, temperature: number) {
  const system = messages.find((message) => message.role === 'system')?.content;
  const conversation = messages
    .filter((message) => message.role !== 'system')
    .map((message) => ({
      role: message.role === 'assistant' ? 'assistant' : 'user',
      content: message.content,
    }));

  return {
    system,
    messages: conversation,
    max_tokens: maxTokens,
    temperature,
  };
}

export class LLMProviderRouter {
  constructor(
    private readonly providers: LlmProviderConfig[] = getConfiguredLlmProviders(),
    private readonly fetcher: FetchLike = fetch
  ) {}

  async chat(messages: LlmChatMessage[], options: LlmRouterOptions = {}): Promise<LlmRouterResult> {
    const enabledProviders = sortProviders(this.providers).filter((provider) => provider.enabled !== false);
    const attemptedProviders: string[] = [];
    const errors: string[] = [];

    for (const provider of enabledProviders) {
      attemptedProviders.push(provider.id);
      try {
        const { content, usage } = await this.callProvider(provider, messages, options);
        return {
          content,
          providerId: provider.id,
          model: provider.model,
          degraded: false,
          attemptedProviders,
          usage,
        };
      } catch (error) {
        errors.push(`${provider.id}: ${error instanceof Error ? error.message : 'unknown error'}`);
      }
    }

    const fallback = options.fallback?.();
    if (fallback) {
      return {
        content: fallback,
        providerId: 'local_fallback',
        model: 'rule_based',
        degraded: true,
        attemptedProviders,
      };
    }

    throw new Error(`All LLM providers failed: ${errors.join('; ') || 'none configured'}`);
  }

  private async callProvider(
    provider: LlmProviderConfig,
    messages: LlmChatMessage[],
    options: LlmRouterOptions
  ): Promise<{ content: string; usage?: LlmTokenUsage }> {
    const temperature = options.temperature ?? 0.7;
    const maxTokens = options.maxTokens ?? 500;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 15_000);

    try {
      if (provider.kind === 'anthropic') {
        return await this.callAnthropicProvider(provider, messages, maxTokens, temperature, controller.signal);
      }
      return await this.callOpenAiCompatibleProvider(provider, messages, maxTokens, temperature, controller.signal);
    } finally {
      clearTimeout(timeout);
    }
  }

  private async callOpenAiCompatibleProvider(
    provider: LlmProviderConfig,
    messages: LlmChatMessage[],
    maxTokens: number,
    temperature: number,
    signal: AbortSignal
  ): Promise<{ content: string; usage?: LlmTokenUsage }> {
    const response = await this.fetcher(`${provider.baseUrl.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${provider.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: provider.model,
        messages,
        max_tokens: maxTokens,
        temperature,
      }),
      signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const payload = await response.json();
    const content = extractOpenAiContent(payload);
    if (!content) {
      throw new Error('Provider returned no text content');
    }

    return { content, usage: extractOpenAiUsage(payload) };
  }

  private async callAnthropicProvider(
    provider: LlmProviderConfig,
    messages: LlmChatMessage[],
    maxTokens: number,
    temperature: number,
    signal: AbortSignal
  ): Promise<{ content: string; usage?: LlmTokenUsage }> {
    const response = await this.fetcher(`${provider.baseUrl.replace(/\/$/, '')}/messages`, {
      method: 'POST',
      headers: {
        'x-api-key': provider.apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: provider.model,
        ...toAnthropicPayload(messages, maxTokens, temperature),
      }),
      signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const payload = await response.json();
    const content = extractAnthropicContent(payload);
    if (!content) {
      throw new Error('Provider returned no text content');
    }

    return { content, usage: extractAnthropicUsage(payload) };
  }
}
