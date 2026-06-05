/**
 * RAG knowledge ingest — chunk, embed, upsert to Qdrant (tenant-scoped)
 *
 * Purpose: Operational path to load property/tenant KB text into the same collection RAGSearchService reads.
 * POST body (JSON): validated by `ragIngestBodySchema`.
 * Response: `{ data: { upserted: number, collection: string } }` on success.
 * Location: app/api/crm/rag/ingest/route.ts
 *
 * Requires server env: QDRANT_URL, QDRANT_API_KEY, RAG_USE_QDRANT_INFERENCE=true. RAG_ENABLED=true for retrieval.
 */

import { NextRequest } from 'next/server';
import { withApiAuth, errorResponse, successResponse } from '@/lib/utils/api-helpers';
import { ragIngestBodySchema } from '@/lib/utils/validation';
import { RagIngestService } from '@/lib/services/documents/RagIngestService';
import { PropertyService } from '@/lib/services/property/PropertyService';
import { isQdrantConfigured } from '@/lib/integrations/qdrant';
import { isRagEmbeddingConfigured } from '@/lib/integrations/embeddings-rag';
import { securityLogger } from '@/lib/utils/security-logger.client';

const ingestService = new RagIngestService();
const propertyService = new PropertyService();

export async function POST(request: NextRequest) {
  return withApiAuth(
    request,
    async (req, user) => {
      if (!user.tenantId) {
        return errorResponse('Tenant ID is required', 400, 'MISSING_TENANT_ID');
      }

      if (!isQdrantConfigured()) {
        return errorResponse(
          'Qdrant is not configured (QDRANT_URL)',
          503,
          'RAG_BACKEND_UNAVAILABLE'
        );
      }
      if (!isRagEmbeddingConfigured()) {
        return errorResponse(
          'RAG embeddings not configured (set RAG_USE_QDRANT_INFERENCE=true with QDRANT_URL and QDRANT_API_KEY)',
          503,
          'RAG_EMBEDDINGS_UNAVAILABLE'
        );
      }

      let body: unknown;
      try {
        body = await req.json();
      } catch {
        return errorResponse('Invalid JSON body', 400, 'INVALID_JSON');
      }

      const parsed = ragIngestBodySchema.safeParse(body);
      if (!parsed.success) {
        return errorResponse('Invalid request body', 400, 'VALIDATION_ERROR', parsed.error.flatten());
      }

      const { source, propertyId, text, chunks, chunkMaxChars, chunkOverlap } = parsed.data;

      if (propertyId) {
        const prop = await propertyService.getPropertyById(propertyId, user.tenantId);
        if (!prop) {
          return errorResponse('Property not found', 404, 'PROPERTY_NOT_FOUND');
        }
      }

      try {
        const result = await ingestService.ingest({
          tenantId: user.tenantId,
          propertyId: propertyId ?? null,
          source,
          text: text?.trim() || undefined,
          chunks,
          chunkMaxChars,
          chunkOverlap,
        });
        /** @example `{ data: { upserted: 4, collection: "buffr_rag" } }` */
        return successResponse(result);
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Ingest failed';
        securityLogger.error('[api/crm/rag/ingest]', e);
        return errorResponse(msg, 500, 'RAG_INGEST_FAILED');
      }
    },
    { requireRole: ['owner', 'manager', 'admin'], rateLimit: true }
  );
}
