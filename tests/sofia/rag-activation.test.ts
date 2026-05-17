/**
 * RAG retrieval smoke — mocks Qdrant inference so CI does not need live keys.
 *
 * Location: tests/sofia/rag-activation.test.ts
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { RAGSearchService } from '@/lib/services/documents/RAGSearchService';

vi.mock('@/lib/integrations/qdrant-inference', () => ({
  isQdrantInferenceEnabled: vi.fn(() => true),
  qdrantInferenceQuery: vi.fn(async () => [
    {
      id: 'pt-1',
      score: 0.92,
      payload: {
        tenant_id: 'tenant-xyz',
        text: 'Breakfast is served daily from 07:00 to 10:00 in the dining room.',
        source: 'breakfast-policy.md',
      },
    },
  ]),
}));

vi.mock('@/lib/integrations/embeddings-rag', () => ({
  isRagEmbeddingConfigured: vi.fn(() => true),
}));

vi.mock('@/lib/integrations/qdrant', () => ({
  isQdrantConfigured: vi.fn(() => true),
}));

describe('RAG activation (mocked infra)', () => {
  beforeEach(() => {
    vi.stubEnv('RAG_ENABLED', 'true');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns tenant-matching chunks when RAG is enabled', async () => {
    const tenantId = 'tenant-xyz';
    const svc = new RAGSearchService();
    const chunks = await svc.search('What time is breakfast?', tenantId, { limit: 4 });
    expect(chunks.length).toBe(1);
    expect(chunks[0].text).toContain('07:00');
    expect(chunks[0].source).toBe('breakfast-policy.md');
  });

  it('filters out chunks for other tenants', async () => {
    const { qdrantInferenceQuery } = await import('@/lib/integrations/qdrant-inference');
    vi.mocked(qdrantInferenceQuery).mockResolvedValueOnce([
      {
        id: 'x',
        score: 0.9,
        payload: {
          tenant_id: 'other-tenant',
          text: 'Secret',
        },
      },
    ] as never);
    const svc = new RAGSearchService();
    const chunks = await svc.search('breakfast', 'tenant-xyz');
    expect(chunks).toHaveLength(0);
  });
});
