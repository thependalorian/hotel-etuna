/**
 * OpenAI embeddings via REST — optional dependency for RAG (no `openai` npm package)
 *
 * Purpose: Query vectors for Qdrant search when OPENAI_API_KEY is set.
 * Location: lib/integrations/embeddings-openai.ts
 */

const DEFAULT_MODEL = 'text-embedding-3-small';

export function isOpenAiEmbeddingConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

/** Returns null if not configured or API error */
export async function embedTextOpenAI(text: string): Promise<number[] | null> {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key || !text.trim()) return null;

  const model = process.env.OPENAI_EMBEDDING_MODEL?.trim() || DEFAULT_MODEL;

  try {
    const res = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        input: text.slice(0, 8000),
      }),
    });
    if (!res.ok) {
      const t = await res.text().catch(() => '');
      console.warn('[embeddings-openai]', res.status, t);
      return null;
    }
    const data = (await res.json()) as {
      data?: { embedding?: number[] }[];
    };
    const vec = data.data?.[0]?.embedding;
    return Array.isArray(vec) ? vec : null;
  } catch (e) {
    console.warn('[embeddings-openai]', e);
    return null;
  }
}
