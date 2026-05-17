/**
 * RagIngestService
 *
 * Purpose: Chunk and upsert tenant-scoped knowledge into Qdrant (pairs with RAGSearchService).
 * Location: /lib/services/documents/RagIngestService.ts
 *
 * Embeddings: Qdrant Cloud Inference only (384d, intfloat/multilingual-e5-small by default).
 */

import { randomUUID } from 'crypto';
import { isQdrantConfigured } from '@/lib/integrations/qdrant';
import {
  ensureQdrantInferenceCollection,
  isQdrantInferenceEnabled,
  qdrantInferenceUpsert,
  type QdrantInferencePoint,
} from '@/lib/integrations/qdrant-inference';
import { isRagEmbeddingConfigured } from '@/lib/integrations/embeddings-rag';
import { splitTextIntoRagChunks } from '@/lib/services/documents/rag-chunk';

export type RagIngestInput = {
  tenantId: string;
  propertyId?: string | null;
  source: string;
  text?: string;
  chunks?: string[];
  chunkMaxChars?: number;
  chunkOverlap?: number;
};

export type RagIngestResult = {
  upserted: number;
  collection: string;
};

function collectionName(): string {
  return process.env.RAG_QDRANT_COLLECTION?.trim() || 'buffr_rag';
}

export class RagIngestService {
  async ingest(input: RagIngestInput): Promise<RagIngestResult> {
    if (!isQdrantConfigured()) {
      throw new Error('RAG ingest requires QDRANT_URL');
    }
    if (!isRagEmbeddingConfigured()) {
      throw new Error(
        'RAG ingest requires RAG_USE_QDRANT_INFERENCE=true with QDRANT_URL and QDRANT_API_KEY'
      );
    }
    if (!isQdrantInferenceEnabled()) {
      throw new Error('RAG_USE_QDRANT_INFERENCE must be true (Qdrant Cloud Inference only)');
    }

    const maxChars = input.chunkMaxChars ?? 1200;
    const overlap = input.chunkOverlap ?? 150;

    let pieces: string[] = [];
    if (input.chunks?.length) {
      pieces = input.chunks.map((c) => c.trim()).filter(Boolean);
    } else if (input.text?.trim()) {
      pieces = splitTextIntoRagChunks(input.text, maxChars, overlap);
    } else {
      throw new Error('Provide text or non-empty chunks');
    }

    const collection = collectionName();
    if (!pieces.length) {
      return { upserted: 0, collection };
    }

    await ensureQdrantInferenceCollection(collection);
    const points: QdrantInferencePoint[] = pieces.map((text) => {
      const payload: Record<string, unknown> = {
        tenant_id: input.tenantId,
        text,
        source: input.source,
      };
      if (input.propertyId) {
        payload.property_id = input.propertyId;
      }
      return {
        id: randomUUID(),
        text,
        payload,
      };
    });
    await qdrantInferenceUpsert(collection, points);
    return { upserted: points.length, collection };
  }
}
