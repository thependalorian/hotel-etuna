/**
 * Qdrant Cloud Inference — embed text at upsert/query time inside Qdrant.
 * Location: lib/integrations/qdrant-inference.ts
 *
 * Requires cluster with Inference enabled (Qdrant Cloud Console → Inference tab).
 * Model example: intfloat/multilingual-e5-small (384d)
 */

import { QdrantClient } from '@qdrant/js-client-rest';
import { qdrantDeleteByFilter, isQdrantConfigured } from '@/lib/integrations/qdrant';

export type QdrantInferencePoint = {
  id: string;
  text: string;
  payload?: Record<string, unknown>;
};

export type QdrantInferenceHit = {
  id: string | number;
  score: number;
  payload: Record<string, unknown>;
};

export function isQdrantInferenceEnabled(): boolean {
  return (
    process.env.RAG_USE_QDRANT_INFERENCE === 'true' &&
    isQdrantConfigured() &&
    Boolean(process.env.QDRANT_API_KEY?.trim())
  );
}

export function qdrantInferenceModel(): string {
  return process.env.QDRANT_INFERENCE_MODEL?.trim() || 'intfloat/multilingual-e5-small';
}

/** Default vector size for intfloat/multilingual-e5-small — override via QDRANT_INFERENCE_DIMENSIONS. */
export function qdrantInferenceVectorSize(): number {
  const explicit = process.env.QDRANT_INFERENCE_DIMENSIONS?.trim();
  if (explicit && /^\d+$/.test(explicit)) {
    return parseInt(explicit, 10);
  }
  return 384;
}

function normalizeQdrantUrl(raw: string): string {
  let u = raw.replace(/\/$/, '');
  if (/\.cloud\.qdrant\.io$/i.test(u) && !/:\d+$/.test(u)) {
    return `${u}:6333`;
  }
  return u;
}

let cachedClient: QdrantClient | null = null;

export function getQdrantClient(): QdrantClient {
  if (!cachedClient) {
    const url = process.env.QDRANT_URL?.trim();
    const apiKey = process.env.QDRANT_API_KEY?.trim();
    if (!url || !apiKey) {
      throw new Error('QDRANT_URL and QDRANT_API_KEY are required for Qdrant inference');
    }
    cachedClient = new QdrantClient({
      url: normalizeQdrantUrl(url),
      apiKey,
    });
  }
  return cachedClient;
}

export async function ensureQdrantInferenceCollection(collection: string): Promise<void> {
  const client = getQdrantClient();
  const expectedSize = qdrantInferenceVectorSize();
  const model = qdrantInferenceModel();

  let info: Awaited<ReturnType<QdrantClient['getCollection']>> | null = null;
  try {
    info = await client.getCollection(collection);
  } catch {
    info = null;
  }

  if (!info) {
    await client.createCollection(collection, {
      vectors: { size: expectedSize, distance: 'Cosine' },
    });
  } else {
    const vectors = info.config?.params?.vectors;
    const size =
      vectors && typeof vectors === 'object' && 'size' in vectors
        ? Number((vectors as { size?: number }).size)
        : undefined;
    if (size !== undefined && size !== expectedSize) {
      throw new Error(
        `Collection "${collection}" has vector size ${size} but ${model} expects ${expectedSize}. ` +
          'Delete the collection or use a new RAG_QDRANT_COLLECTION name.'
      );
    }
  }

  const indexUrl = `${normalizeQdrantUrl(process.env.QDRANT_URL!.trim())}/collections/${encodeURIComponent(collection)}/index`;
  const apiKey = process.env.QDRANT_API_KEY!.trim();
  await fetch(indexUrl, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'api-key': apiKey },
    body: JSON.stringify({ field_name: 'tenant_id', field_schema: 'keyword' }),
  }).catch(() => {
    /* 409 if index exists */
  });
}

export async function qdrantInferenceUpsert(
  collection: string,
  points: QdrantInferencePoint[]
): Promise<void> {
  if (points.length === 0) return;

  const client = getQdrantClient();
  const model = qdrantInferenceModel();

  await client.upsert(collection, {
    wait: true,
    points: points.map((p) => ({
      id: p.id,
      vector: { text: p.text, model },
      payload: p.payload ?? {},
    })),
  });
}

export async function qdrantInferenceQuery(
  collection: string,
  queryText: string,
  tenantId: string,
  limit: number
): Promise<QdrantInferenceHit[]> {
  const client = getQdrantClient();
  const model = qdrantInferenceModel();

  const response = await client.query(collection, {
    query: { text: queryText, model },
    filter: {
      must: [{ key: 'tenant_id', match: { value: tenantId } }],
    },
    limit: Math.min(limit * 3, 64),
    with_payload: true,
  });

  const points = response.points ?? [];
  return points.map((p) => ({
    id: p.id ?? '',
    score: p.score ?? 0,
    payload: (p.payload as Record<string, unknown>) ?? {},
  }));
}

export async function qdrantInferenceDeleteTenant(
  collection: string,
  tenantId: string
): Promise<void> {
  await qdrantDeleteByFilter(collection, { tenant_id: tenantId });
}

/** Connectivity smoke test (lists collections). */
export async function verifyQdrantInferenceConnection(): Promise<{
  ok: boolean;
  collections?: string[];
  error?: string;
}> {
  try {
    const client = getQdrantClient();
    const collections = await client.getCollections();
    return {
      ok: true,
      collections: (collections.collections ?? []).map((c) => c.name),
    };
  } catch (err: unknown) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
