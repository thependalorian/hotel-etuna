/**
 * RAGSearchService
 *
 * Purpose: Tenant-scoped document retrieval for Sofia via Qdrant + Voyage AI embeddings.
 * Location: /lib/services/documents/RAGSearchService.ts
 *
 * Requires when RAG_ENABLED=true:
 * - QDRANT_URL
 * - VOYAGE_API_KEY (see lib/integrations/embeddings-voyage.ts)
 *
 * Points should be upserted with payload: { tenant_id, property_id?, text, source }
 * Collection: RAG_QDRANT_COLLECTION (default buffr_rag); vector size must match
 * embedTextForRag / ingestion (typically 1024 for voyage-3 or 1536 for voyage-3-large).
 */

import { isQdrantConfigured, qdrantSearch } from '@/lib/integrations/qdrant';
import { embedTextForRag, isRagEmbeddingConfigured } from '@/lib/integrations/embeddings-voyage';

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

  /**
   * Returns relevant chunks. No-op when disabled, Qdrant missing, or embeddings unavailable.
   */
  async search(
    query: string,
    tenantId: string,
    options: RagSearchOptions = {}
  ): Promise<RagSearchChunk[]> {
    if (!this.enabled()) {
      return [];
    }
    if (!isQdrantConfigured()) {
      console.warn('[RAGSearchService] RAG_ENABLED=true but QDRANT_URL is not set.');
      return [];
    }
    if (!isRagEmbeddingConfigured()) {
      console.warn('[RAGSearchService] RAG_ENABLED=true but VOYAGE_API_KEY is not set (embeddings required).');
      return [];
    }

    const q = query.trim();
    if (!q) return [];

    const vector = await embedTextForRag(q);
    if (!vector?.length) {
      return [];
    }

    const limit = Math.min(options.limit ?? 8, 24);
    const collection = collectionName();

    try {
      const raw = await qdrantSearch(collection, vector, limit * 3);
      const chunks: RagSearchChunk[] = [];
      for (const hit of raw) {
        const p = hit.payload;
        if (!p || typeof p !== 'object') continue;
        const tid = p.tenant_id;
        if (typeof tid !== 'string' || tid !== tenantId) continue;
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
      console.warn('[RAGSearchService] search error', e);
      return [];
    }
  }
}
