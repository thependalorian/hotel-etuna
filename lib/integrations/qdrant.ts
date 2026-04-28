/**
 * Qdrant REST client (optional external vector store)
 *
 * Purpose: Mirrors Ava course pattern (QDRANT_URL + collections) for RAG outside pgvector.
 * Location: /lib/integrations/qdrant.ts
 *
 * Env: QDRANT_URL (e.g. http://localhost:6333 or https://xxx.cloud.qdrant.io:6333)
 * Env: QDRANT_API_KEY (optional for Qdrant Cloud)
 */

export type QdrantPoint = {
  id: string | number;
  vector: number[];
  payload?: Record<string, unknown>;
};

export function isQdrantConfigured(): boolean {
  return Boolean(process.env.QDRANT_URL?.trim());
}

function baseUrl(): string {
  const u = process.env.QDRANT_URL?.trim() || '';
  return u.replace(/\/$/, '');
}

function getHeaders(): HeadersInit {
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  const apiKey = process.env.QDRANT_API_KEY?.trim();
  if (apiKey) {
    headers['api-key'] = apiKey;
  }
  return headers;
}

export async function ensureQdrantCollection(collection: string, vectorSize: number): Promise<void> {
  if (!isQdrantConfigured()) return;

  const putUrl = `${baseUrl()}/collections/${encodeURIComponent(collection)}`;
  const res = await fetch(putUrl, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify({
      vectors: { size: vectorSize, distance: 'Cosine' },
    }),
  });
  if (!res.ok && res.status !== 409) {
    const t = await res.text();
    throw new Error(`Qdrant create collection failed: ${res.status} ${t}`);
  }

  // Create index on tenantId for filtering (idempotent operation)
  const indexUrl = `${baseUrl()}/collections/${encodeURIComponent(collection)}/index`;
  const indexRes = await fetch(indexUrl, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify({
      field_name: 'tenantId',
      field_schema: 'keyword',
    }),
  });
  
  // Index creation may return 200 (created) or 409 (already exists)
  if (!indexRes.ok && indexRes.status !== 409) {
    const t = await indexRes.text();
    throw new Error(`Qdrant create index failed: ${indexRes.status} ${t}`);
  }
}

export async function qdrantUpsert(collection: string, points: QdrantPoint[]): Promise<void> {
  if (!isQdrantConfigured() || points.length === 0) return;

  const res = await fetch(`${baseUrl()}/collections/${encodeURIComponent(collection)}/points?wait=true`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify({
      points: points.map((p) => ({
        id: p.id,
        vector: p.vector,
        payload: p.payload ?? {},
      })),
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Qdrant upsert failed: ${res.status} ${t}`);
  }
}

export async function qdrantSearch(
  collection: string,
  vector: number[],
  limit: number
): Promise<{ id: string | number; score: number; payload: Record<string, unknown> }[]> {
  if (!isQdrantConfigured()) return [];

  const res = await fetch(`${baseUrl()}/collections/${encodeURIComponent(collection)}/points/search`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ vector, limit, with_payload: true }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Qdrant search failed: ${res.status} ${t}`);
  }
  const json = (await res.json()) as {
    result?: { id: string | number; score: number; payload?: Record<string, unknown> }[];
  };
  return (json.result ?? []).map((r) => ({
    id: r.id,
    score: r.score,
    payload: r.payload ?? {},
  }));
}

/**
 * Delete all points matching a filter from a collection.
 * Useful for tenant-scoped deletion before re-ingesting knowledge.
 */
export async function qdrantDeleteByFilter(
  collection: string,
  filter: Record<string, unknown>
): Promise<void> {
  if (!isQdrantConfigured()) return;

  const res = await fetch(`${baseUrl()}/collections/${encodeURIComponent(collection)}/points/delete`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      filter: { must: [{ key: Object.keys(filter)[0], match: { value: Object.values(filter)[0] } }] },
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Qdrant delete failed: ${res.status} ${t}`);
  }
}
