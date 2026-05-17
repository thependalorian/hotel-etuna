/**
 * RAG embedding configuration — Qdrant Cloud Inference only (384d e5-small).
 * Location: lib/integrations/embeddings-rag.ts
 *
 * Chat LLMs (DeepSeek, etc.) are separate from embeddings; vectors are computed
 * inside Qdrant at upsert/query time via @qdrant/js-client-rest.
 */

export {
  isQdrantInferenceEnabled as isRagEmbeddingConfigured,
  qdrantInferenceModel as getRagEmbeddingModelName,
  qdrantInferenceVectorSize as getRagEmbeddingDimension,
} from '@/lib/integrations/qdrant-inference';
