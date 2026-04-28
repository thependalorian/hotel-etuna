/**
 * RAG retrieval smoke — mocks Voyage + Qdrant so CI does not need live keys.
 *
 * Location: tests/sofia/rag-activation.test.ts
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { RAGSearchService } from '@/lib/services/documents/RAGSearchService';

vi.mock('@/lib/integrations/embeddings-voyage', () => ({
  embedTextForRag: vi.fn(async () => new Array(1024).fill(0.01)),
  isRagEmbeddingConfigured: vi.fn(() => true),
}));

vi.mock('@/lib/integrations/qdrant', () => ({
  isQdrantConfigured: vi.fn(() => true),
  qdrantSearch: vi.fn(async () => [
    {
      id: 'pt-1',
      score: 0.92,
      payload: {
        tenant_id: 'tenant-xyz',
        text: 'Breakfast is served daily from 06:30 to 10:00 in the dining room.',
        source: 'breakfast-policy.md',
      },
    },
  ]),
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
    expect(chunks[0].text).toContain('06:30');
    expect(chunks[0].source).toBe('breakfast-policy.md');
  });

  it('filters out chunks for other tenants', async () => {
    const { qdrantSearch } = await import('@/lib/integrations/qdrant');
    vi.mocked(qdrantSearch).mockResolvedValueOnce([
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
