/**
 * Voyage AI Embeddings (OpenAI-Compatible)
 *
 * Purpose: Generate embeddings using Voyage AI's API (Anthropic's recommended partner)
 * Location: lib/integrations/embeddings-voyage.ts
 *
 * Voyage AI provides:
 * - 200M tokens free tier (no credit card required)
 * - OpenAI-compatible API (same SDK, different baseURL)
 * - High-quality embeddings recommended by Anthropic
 * - Production-ready, works on Vercel serverless
 *
 * Models:
 * - voyage-3: 1024 dimensions, excellent quality
 * - voyage-3-large: 1536 dimensions (same as OpenAI)
 *
 * Get your free API key at: https://dash.voyageai.com
 */

import OpenAI from 'openai';

export function isVoyageConfigured(): boolean {
  return Boolean(process.env.VOYAGE_API_KEY?.trim());
}

/**
 * Create Voyage AI client for embeddings
 */
function getVoyageClient(): OpenAI | null {
  const apiKey = process.env.VOYAGE_API_KEY?.trim();
  const baseURL = process.env.VOYAGE_BASE_URL?.trim() || 'https://api.voyageai.com/v1';
  
  if (!apiKey) return null;
  
  return new OpenAI({
    apiKey,
    baseURL,
  });
}

/**
 * Generate embedding using Voyage AI
 * 
 * @param text - Text to embed (max ~8000 chars)
 * @returns 1024 or 1536 dimensional vector (depending on model)
 */
export async function getEmbedding(text: string): Promise<number[] | null> {
  const client = getVoyageClient();
  if (!client || !text.trim()) return null;
  
  const model = process.env.EMBEDDING_MODEL?.trim() || 'voyage-3';
  
  try {
    const response = await client.embeddings.create({
      model,
      input: text.slice(0, 8000), // Limit text length for safety
    });
    
    return response.data[0].embedding;
  } catch (error: any) {
    console.error('[embeddings-voyage] Error:', error?.message || error);
    throw error;
  }
}

/**
 * Get the embedding dimension for the configured model
 * 
 * Note: Voyage AI models return 1024 dimensions by default.
 * For 1536-dim vectors, use voyage-large-2 or voyage-large-2-instruct.
 * 
 * Models:
 * - voyage-3, voyage-3-lite: 1024 dimensions
 * - voyage-large-2, voyage-large-2-instruct: 1536 dimensions
 * - voyage-2: 1024 dimensions
 */
export function getEmbeddingDimension(): number {
  const model = process.env.EMBEDDING_MODEL?.trim() || 'voyage-3';
  
  // Models with 1536 dimensions
  if (model.includes('large-2')) {
    return 1536;
  }
  
  // All other models default to 1024
  return 1024;
}

/**
 * Get the configured model name
 */
export function getModelName(): string {
  return process.env.EMBEDDING_MODEL?.trim() || 'voyage-3';
}
