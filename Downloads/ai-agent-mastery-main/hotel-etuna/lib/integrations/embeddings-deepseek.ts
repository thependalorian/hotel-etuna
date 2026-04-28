/**
 * Multi-provider embeddings (Voyage, DeepSeek, Groq)
 *
 * Purpose: Generate embeddings via OpenAI-compatible APIs with provider fallback.
 * Location: lib/integrations/embeddings-deepseek.ts
 */

import OpenAI from 'openai';

const VOYAGE_BASE_URL = 'https://api.voyageai.com/v1';
const DEEPSEEK_BASE_URL_DEFAULT = 'https://api.deepseek.com/v1';
const GROQ_BASE_URL = 'https://api.groq.com/openai/v1';

const VOYAGE_MODEL_DEFAULT = 'voyage-3-large';
const DEEPSEEK_MODEL_DEFAULT = 'deepseek-embedding';
const GROQ_MODEL_DEFAULT = 'text-embedding-3-small';

const VOYAGE_MODEL_CANDIDATES = ['voyage-3-large', 'voyage-3'];
const OPENAI_COMPAT_MODELS = ['text-embedding-3-small', 'text-embedding-ada-002'];

let voyageUnsupported = false;
let deepseekUnsupported = false;
let groqUnsupported = false;

type Provider = 'voyage' | 'deepseek' | 'groq';

export function isVoyageConfigured(): boolean {
  return Boolean(process.env.VOYAGE_API_KEY?.trim());
}

export function isDeepSeekConfigured(): boolean {
  return Boolean(process.env.DEEPSEEK_API_KEY?.trim());
}

export function isGroqConfigured(): boolean {
  return Boolean(process.env.GROQ_API_KEY?.trim());
}

function getClient(apiKey: string | undefined, baseURL: string): OpenAI | null {
  if (!apiKey?.trim()) return null;
  return new OpenAI({ apiKey, baseURL });
}

function textToVector(text: string, dimension: number): number[] {
  const normalized = text.toLowerCase().trim();
  const vector: number[] = new Array(dimension).fill(0);

  for (let pass = 0; pass < 3; pass++) {
    for (let i = 0; i < normalized.length; i++) {
      const char = normalized.charCodeAt(i);
      const idx = (char * (i + 1) * (pass + 1)) % dimension;
      vector[idx] += Math.sin(char * 0.01 * (pass + 1)) * Math.cos(i * 0.01);
    }
  }

  const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  if (magnitude > 0) {
    for (let i = 0; i < vector.length; i++) {
      vector[i] /= magnitude;
    }
  }

  return vector;
}

async function embedOpenAiCompatible(
  provider: Provider,
  client: OpenAI | null,
  models: string[],
  text: string
): Promise<number[] | null> {
  if (!client || !text.trim()) return null;

  for (const model of models) {
    try {
      const response = await client.embeddings.create({
        model,
        input: text.slice(0, 8000),
      });
      const vector = response.data?.[0]?.embedding;
      if (Array.isArray(vector) && vector.length > 0) {
        return vector;
      }
      console.warn(`[embeddings-${provider}] model=${model} returned empty embedding`);
    } catch (error: any) {
      const status = error?.status;
      const message = error?.message || String(error);
      if (status === 400 || status === 404) {
        if (provider === 'voyage') voyageUnsupported = true;
        if (provider === 'deepseek') deepseekUnsupported = true;
        if (provider === 'groq') groqUnsupported = true;
      }
      console.warn(`[embeddings-${provider}] model=${model} status=${status ?? 'unknown'} ${message}`);
    }
  }

  return null;
}

export async function embedTextVoyage(text: string): Promise<number[] | null> {
  if (!isVoyageConfigured() || voyageUnsupported || !text.trim()) return null;
  const client = getClient(process.env.VOYAGE_API_KEY?.trim(), VOYAGE_BASE_URL);
  const model = process.env.VOYAGE_EMBEDDING_MODEL?.trim() || process.env.EMBEDDING_MODEL?.trim() || VOYAGE_MODEL_DEFAULT;
  return embedOpenAiCompatible('voyage', client, [model, ...VOYAGE_MODEL_CANDIDATES], text);
}

export async function embedTextDeepSeek(text: string): Promise<number[] | null> {
  if (!isDeepSeekConfigured() || deepseekUnsupported || !text.trim()) return null;
  const client = getClient(
    process.env.DEEPSEEK_API_KEY?.trim(),
    process.env.DEEPSEEK_BASE_URL?.trim() || DEEPSEEK_BASE_URL_DEFAULT
  );
  const model = process.env.DEEPSEEK_EMBEDDING_MODEL?.trim() || process.env.EMBEDDING_MODEL?.trim() || DEEPSEEK_MODEL_DEFAULT;
  return embedOpenAiCompatible('deepseek', client, [model, ...OPENAI_COMPAT_MODELS], text);
}

export async function embedTextGroq(text: string): Promise<number[] | null> {
  if (!isGroqConfigured() || groqUnsupported || !text.trim()) return null;
  const client = getClient(process.env.GROQ_API_KEY?.trim(), GROQ_BASE_URL);
  const model = process.env.GROQ_EMBEDDING_MODEL?.trim() || process.env.EMBEDDING_MODEL?.trim() || GROQ_MODEL_DEFAULT;
  return embedOpenAiCompatible('groq', client, [model, ...OPENAI_COMPAT_MODELS], text);
}

export async function embedTextFallback(text: string): Promise<number[] | null> {
  if (!text.trim()) return null;
  return textToVector(text, getEmbeddingDimension());
}

export async function getEmbedding(text: string): Promise<number[] | null> {
  if (!text.trim()) return null;

  if (isVoyageConfigured()) {
    const embedding = await embedTextVoyage(text);
    if (embedding) return embedding;
  }

  if (isDeepSeekConfigured()) {
    const embedding = await embedTextDeepSeek(text);
    if (embedding) return embedding;
  }

  if (isGroqConfigured()) {
    const embedding = await embedTextGroq(text);
    if (embedding) return embedding;
  }

  return embedTextFallback(text);
}

export function getEmbeddingDimension(): number {
  const envDim = Number(process.env.EMBEDDING_DIMENSION?.trim() || '');
  if (Number.isFinite(envDim) && envDim > 0) return envDim;

  const voyageModel = process.env.VOYAGE_EMBEDDING_MODEL?.trim() || process.env.EMBEDDING_MODEL?.trim() || VOYAGE_MODEL_DEFAULT;
  if (voyageModel === 'voyage-3') return 1024;

  return 1536;
}

export function getProviderName(): string {
  if (isVoyageConfigured() && !voyageUnsupported) return 'Voyage AI';
  if (isDeepSeekConfigured() && !deepseekUnsupported) return 'DeepSeek';
  if (isGroqConfigured() && !groqUnsupported) return 'Groq';
  return 'Deterministic fallback';
}
