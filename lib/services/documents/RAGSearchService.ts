/**
 * RAGSearchService
 *
 * Purpose: Tenant-scoped document retrieval for Sofia via Qdrant Cloud Inference.
 * Location: /lib/services/documents/RAGSearchService.ts
 *
 * Requires: RAG_ENABLED=true, QDRANT_URL, QDRANT_API_KEY, RAG_USE_QDRANT_INFERENCE=true
 * Model default: intfloat/multilingual-e5-small (384 dimensions)
 */

import { isQdrantConfigured } from '@/lib/integrations/qdrant';
import {
  isQdrantInferenceEnabled,
  qdrantInferenceQuery,
} from '@/lib/integrations/qdrant-inference';
import { isRagEmbeddingConfigured } from '@/lib/integrations/embeddings-rag';
import { securityLogger } from '@/lib/utils/security-logger';

export type RagSearchChunk = {
  id: string;
  text: string;
  score: number;
  source?: string;
};

export type RagSearchOptions = {
  limit?: number;
  propertyId?: string;
};

function collectionName(): string {
  return process.env.RAG_QDRANT_COLLECTION?.trim() || 'buffr_rag';
}

export class RAGSearchService {
  private enabled(): boolean {
    return process.env.RAG_ENABLED === 'true';
  }

  async search(
    query: string,
    tenantId: string,
    options: RagSearchOptions = {}
  ): Promise<RagSearchChunk[]> {
    if (!this.enabled()) {
      return [];
    }
    if (!isQdrantConfigured()) {
      securityLogger.warn('[RAGSearchService] RAG_ENABLED=true but QDRANT_URL is not set.');
      return [];
    }
    if (!isRagEmbeddingConfigured()) {
      securityLogger.warn(
        '[RAGSearchService] RAG_ENABLED=true but Qdrant inference is not configured (RAG_USE_QDRANT_INFERENCE=true + QDRANT_API_KEY).'
      );
      return [];
    }

    const q = query.trim();
    if (!q) return [];

    const limit = Math.min(options.limit ?? 8, 24);
    const collection = collectionName();

    try {
      const raw = await qdrantInferenceQuery(collection, q, tenantId, limit);

      const chunks: RagSearchChunk[] = [];
      for (const hit of raw) {
        const p = hit.payload;
        if (!p || typeof p !== 'object') continue;
        const tid = p.tenant_id;
        if (typeof tid === 'string' && tid !== tenantId) continue;
        if (options.propertyId) {
          const pid = p.property_id;
          if (typeof pid === 'string' && pid !== options.propertyId) continue;
        }
        const text = typeof p.text === 'string' ? p.text : '';
        if (!text) continue;
        const source = typeof p.source === 'string' ? p.source : undefined;
        chunks.push({
          id: String(hit.id),
          text,
          score: hit.score,
          source,
        });
        if (chunks.length >= limit) break;
      }
      return chunks;
    } catch (e) {
      securityLogger.warn('[RAGSearchService] search error', e);
      return [];
    }
  }
}
