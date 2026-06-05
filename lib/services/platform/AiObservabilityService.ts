/**
 * AI observability aggregates — Sofia conversations, token usage, eval heuristics.
 * Location: lib/services/platform/AiObservabilityService.ts
 */

import { db, aiConversations, aiMessages, eq, and, gte, desc, inArray } from '@/lib/db';

export type AiObservabilitySummary = {
  periodDays: number;
  totalConversations: number;
  totalAssistantMessages: number;
  avgConfidence: number;
  totalTokens: number;
  tokensByProvider: Record<string, number>;
  lowConfidenceCount: number;
  degradedProviderCount: number;
  evalSamples: Array<{
    conversationId: string;
    channel: string;
    confidence: number | null;
    intent: string | null;
    createdAt: string;
    preview: string;
  }>;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null;
}

export class AiObservabilityService {
  async getSummary(periodDays = 30): Promise<AiObservabilitySummary> {
    const since = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000);

    const convs = await db
      .select({
        id: aiConversations.id,
        channel: aiConversations.channel,
        createdAt: aiConversations.createdAt,
      })
      .from(aiConversations)
      .where(gte(aiConversations.createdAt, since))
      .orderBy(desc(aiConversations.createdAt))
      .limit(500);

    const convIds = convs.map((c) => c.id);
    if (convIds.length === 0) {
      return {
        periodDays,
        totalConversations: 0,
        totalAssistantMessages: 0,
        avgConfidence: 0,
        totalTokens: 0,
        tokensByProvider: {},
        lowConfidenceCount: 0,
        degradedProviderCount: 0,
        evalSamples: [],
      };
    }

    const assistantRows = await db
      .select({
        conversationId: aiMessages.conversationId,
        content: aiMessages.content,
        metadata: aiMessages.metadata,
        createdAt: aiMessages.createdAt,
      })
      .from(aiMessages)
      .where(and(eq(aiMessages.senderType, 'ASSISTANT'), inArray(aiMessages.conversationId, convIds)));

    let totalConfidence = 0;
    let confidenceCount = 0;
    let lowConfidenceCount = 0;
    let degradedProviderCount = 0;
    let totalTokens = 0;
    const tokensByProvider: Record<string, number> = {};
    const evalSamples: AiObservabilitySummary['evalSamples'] = [];

    for (const row of assistantRows) {
      const meta = asRecord(row.metadata);
      const confidence = typeof meta?.confidence === 'number' ? meta.confidence : null;
      if (confidence !== null) {
        totalConfidence += confidence;
        confidenceCount += 1;
        if (confidence < 0.7) lowConfidenceCount += 1;
      }
      const entities = asRecord(meta?.entities);
      if (entities?.aiProviderFallback === true) degradedProviderCount += 1;

      const usage = asRecord(meta?.token_usage) ?? asRecord(entities?.tokenUsage);
      const total =
        typeof usage?.totalTokens === 'number'
          ? usage.totalTokens
          : typeof usage?.total_tokens === 'number'
            ? usage.total_tokens
            : 0;
      if (total > 0) {
        totalTokens += total;
        const provider =
          typeof entities?.aiProvider === 'string' ? entities.aiProvider : 'unknown';
        tokensByProvider[provider] = (tokensByProvider[provider] ?? 0) + total;
      }

      if (evalSamples.length < 20 && row.conversationId) {
        const conv = convs.find((c) => c.id === row.conversationId);
        evalSamples.push({
          conversationId: row.conversationId,
          channel: conv?.channel ?? 'unknown',
          confidence,
          intent: typeof meta?.intent === 'string' ? meta.intent : null,
          createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : '',
          preview: row.content.slice(0, 160),
        });
      }
    }

    return {
      periodDays,
      totalConversations: convIds.length,
      totalAssistantMessages: assistantRows.length,
      avgConfidence: confidenceCount > 0 ? totalConfidence / confidenceCount : 0,
      totalTokens,
      tokensByProvider,
      lowConfidenceCount,
      degradedProviderCount,
      evalSamples,
    };
  }
}
