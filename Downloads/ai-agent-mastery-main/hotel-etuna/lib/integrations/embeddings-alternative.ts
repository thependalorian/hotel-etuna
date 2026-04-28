/**
 * Alternative Embeddings (DeepSeek, Groq, or Local fallback)
 *
 * Purpose: Generate embeddings using OpenAI-compatible embedding endpoints
 * when OpenAI is unavailable.
 * Location: lib/integrations/embeddings-alternative.ts
 */

const DEEPSEEK_BASE_URL_DEFAULT = 'https://api.deepseek.com/v1';
const GROQ_BASE_URL = 'https://api.groq.com/openai/v1';
const VOYAGE_BASE_URL = 'https://api.voyageai.com/v1';
const OPENAI_COMPAT_FALLBACK_MODEL = 'text-embedding-3-small';
const VOYAGE_MODEL_DEFAULT = 'voyage-3-large';
const VOYAGE_MODEL_CANDIDATES = ['voyage-3-large', 'voyage-3'];
const DEEPSEEK_MODEL_CANDIDATES = ['deepseek-embedding', 'text-embedding-3-small', 'text-embedding-ada-002'];
const GROQ_MODEL_CANDIDATES = ['text-embedding-3-small', 'text-embedding-ada-002'];
let voyageEmbeddingUnsupported = false;
let deepseekEmbeddingUnsupported = false;
let groqEmbeddingUnsupported = false;

export function isVoyageConfigured(): boolean {
  return Boolean(process.env.VOYAGE_API_KEY?.trim());
}

export function isDeepSeekConfigured(): boolean {
  return Boolean(process.env.DEEPSEEK_API_KEY?.trim());
}

export function isGroqConfigured(): boolean {
  return Boolean(process.env.GROQ_API_KEY?.trim());
}

export function getProviderName(): string {
  if (isVoyageConfigured() && !voyageEmbeddingUnsupported) {
    return 'Voyage AI (OpenAI-compatible embeddings)';
  }
  if (isDeepSeekConfigured() && !deepseekEmbeddingUnsupported) {
    return 'DeepSeek (OpenAI-compatible embeddings)';
  }
  if (isGroqConfigured() && !groqEmbeddingUnsupported) {
    return 'Groq (OpenAI-compatible embeddings)';
  }
  return 'Fallback (deterministic text-to-vector)';
}

/**
 * Simple text-to-vector conversion using character-based hashing
 * This is a fallback when no embedding provider is available.
 * Note: This is NOT semantic embeddings, but provides consistent vector representation.
 */
function simpleTextToVector(text: string, dimension: number = 1536): number[] {
  const normalized = text.toLowerCase().trim();
  const vector: number[] = new Array(dimension).fill(0);
  
  // Create a deterministic vector based on text content
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized.charCodeAt(i);
    const idx = (char * (i + 1)) % dimension;
    vector[idx] += Math.sin(char * 0.01) * Math.cos(i * 0.01);
  }
  
  // Normalize the vector
  const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  if (magnitude > 0) {
    for (let i = 0; i < vector.length; i++) {
      vector[i] /= magnitude;
    }
  }
  
  return vector;
}

type OpenAIEmbeddingsResponse = {
  data?: { embedding?: number[] }[];
  error?: { message?: string };
};

async function embedViaOpenAiCompatible(
  providerLabel: string,
  baseUrl: string,
  apiKey: string,
  models: string[],
  text: string
): Promise<number[] | null> {
  const candidates = models.filter(Boolean);
  let sawModelUnsupported = false;
  for (const model of candidates) {
    try {
      const res = await fetch(`${baseUrl.replace(/\/+$/, '')}/embeddings`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          input: text.slice(0, 8000),
        }),
      });

      const raw = await res.text().catch(() => '');
      const parsed = raw
        ? (JSON.parse(raw) as OpenAIEmbeddingsResponse)
        : ({} as OpenAIEmbeddingsResponse);

      if (!res.ok) {
        if (res.status === 400 || res.status === 404) {
          sawModelUnsupported = true;
        }
        console.warn(`[embeddings-${providerLabel}] model=${model} status=${res.status}`, parsed.error?.message ?? raw);
        continue;
      }

      const vector = parsed.data?.[0]?.embedding;
      if (Array.isArray(vector) && vector.length > 0) {
        return vector;
      }
      console.warn(`[embeddings-${providerLabel}] model=${model} returned empty embedding payload`);
    } catch (error) {
      console.warn(`[embeddings-${providerLabel}] model=${model}`, error);
    }
  }

  if (sawModelUnsupported) {
    if (providerLabel === 'voyage') voyageEmbeddingUnsupported = true;
    if (providerLabel === 'deepseek') deepseekEmbeddingUnsupported = true;
    if (providerLabel === 'groq') groqEmbeddingUnsupported = true;
  }

  return null;
}

export async function embedTextVoyage(text: string): Promise<number[] | null> {
  const apiKey = process.env.VOYAGE_API_KEY?.trim();
  if (!apiKey || !text.trim() || voyageEmbeddingUnsupported) return null;

  const preferredModel =
    process.env.VOYAGE_EMBEDDING_MODEL?.trim() || process.env.EMBEDDING_MODEL?.trim() || VOYAGE_MODEL_DEFAULT;
  const models = [preferredModel, ...VOYAGE_MODEL_CANDIDATES];
  return embedViaOpenAiCompatible('voyage', VOYAGE_BASE_URL, apiKey, models, text);
}

export async function embedTextDeepSeek(text: string): Promise<number[] | null> {
  const apiKey = process.env.DEEPSEEK_API_KEY?.trim();
  const baseUrl = process.env.DEEPSEEK_BASE_URL?.trim() || DEEPSEEK_BASE_URL_DEFAULT;
  if (!apiKey || !text.trim() || deepseekEmbeddingUnsupported) return null;

  const preferredModel =
    process.env.DEEPSEEK_EMBEDDING_MODEL?.trim() || process.env.EMBEDDING_MODEL?.trim() || OPENAI_COMPAT_FALLBACK_MODEL;
  const models = [preferredModel, ...DEEPSEEK_MODEL_CANDIDATES];
  return embedViaOpenAiCompatible('deepseek', baseUrl, apiKey, models, text);
}

export async function embedTextGroq(text: string): Promise<number[] | null> {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey || !text.trim() || groqEmbeddingUnsupported) return null;

  const preferredModel =
    process.env.GROQ_EMBEDDING_MODEL?.trim() || process.env.EMBEDDING_MODEL?.trim() || OPENAI_COMPAT_FALLBACK_MODEL;
  const models = [preferredModel, ...GROQ_MODEL_CANDIDATES];
  return embedViaOpenAiCompatible('groq', GROQ_BASE_URL, apiKey, models, text);
}

/**
 * Fallback: simple text-to-vector without any API
 * This provides consistent but non-semantic vectors
 */
export async function embedTextFallback(text: string): Promise<number[] | null> {
  if (!text.trim()) return null;
  return simpleTextToVector(text, 1536);
}

/**
 * Unified embedding function that tries providers in order:
 * 1. Voyage OpenAI-compatible embeddings endpoint
 * 2. DeepSeek OpenAI-compatible embeddings endpoint
 * 3. Groq OpenAI-compatible embeddings endpoint
 * 4. Fallback deterministic hashing (last resort)
 */
export async function embedText(text: string): Promise<number[] | null> {
  if (!text.trim()) return null;

  // Try Voyage first
  if (isVoyageConfigured()) {
    console.log('[embeddings] Using Voyage OpenAI-compatible embeddings');
    const result = await embedTextVoyage(text);
    if (result) return result;
  }
  
  // Try DeepSeek first
  if (isDeepSeekConfigured()) {
    console.log('[embeddings] Using DeepSeek OpenAI-compatible embeddings');
    const result = await embedTextDeepSeek(text);
    if (result) return result;
  }
  
  // Try Groq second
  if (isGroqConfigured()) {
    console.log('[embeddings] Using Groq OpenAI-compatible embeddings');
    const result = await embedTextGroq(text);
    if (result) return result;
  }
  
  // Use fallback
  console.log('[embeddings] Using fallback text-to-vector conversion');
  return embedTextFallback(text);
}
