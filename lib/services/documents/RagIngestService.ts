/**
 * RagIngestService
 *
 * Purpose: Chunk, embed, and upsert tenant-scoped knowledge into Qdrant (pairs with RAGSearchService).
 * Location: /lib/services/documents/RagIngestService.ts
 *
 * Payload shape per point: { tenant_id, text, source, property_id? }
 */

import { randomUUID } from 'crypto';
import {
  ensureQdrantCollection,
  isQdrantConfigured,
  qdrantUpsert,
  type QdrantPoint,
} from '@/lib/integrations/qdrant';
import { embedTextOpenAI, isOpenAiEmbeddingConfigured } from '@/lib/integrations/embeddings-openai';
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
  /**
   * Requires QDRANT_URL and OPENAI_API_KEY (same as search). Does not require RAG_ENABLED.
   */
  async ingest(input: RagIngestInput): Promise<RagIngestResult> {
    if (!isQdrantConfigured()) {
      throw new Error('RAG ingest requires QDRANT_URL');
    }
    if (!isOpenAiEmbeddingConfigured()) {
      throw new Error('RAG ingest requires OPENAI_API_KEY');
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

    const embedded: { text: string; vector: number[] }[] = [];
    for (const text of pieces) {
      const vector = await embedTextOpenAI(text);
      if (!vector?.length) {
        console.warn('[RagIngestService] skipping chunk: embedding failed');
        continue;
      }
      embedded.push({ text, vector });
    }

    if (!embedded.length) {
      return { upserted: 0, collection };
    }

    const dim = embedded[0].vector.length;
    await ensureQdrantCollection(collection, dim);

    const points: QdrantPoint[] = embedded.map(({ text, vector }) => {
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
        vector,
        payload,
      };
    });

    await qdrantUpsert(collection, points);
    return { upserted: points.length, collection };
  }
}
