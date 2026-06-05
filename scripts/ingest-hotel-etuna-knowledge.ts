/**
 * Hotel Etuna Knowledge Base Ingestion Script
 *
 * Loads markdown from data/hotel-etuna-knowledge/, chunks semantically, upserts to Qdrant
 * via Cloud Inference (intfloat/multilingual-e5-small, 384d).
 *
 * Usage:
 *   npm run rag:seed
 *   npm run rag:seed:dry
 *   npm run rag:seed -- --upsert-batch=4
 */

import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { createHash } from 'crypto';
import * as dotenv from 'dotenv';
import {
  ensureQdrantInferenceCollection,
  isQdrantInferenceEnabled,
  qdrantInferenceDeleteTenant,
  qdrantInferenceModel,
  qdrantInferenceUpsert,
  qdrantInferenceVectorSize,
  verifyQdrantInferenceConnection,
  type QdrantInferencePoint,
} from '../lib/integrations/qdrant-inference';
import { isRagEmbeddingConfigured } from '../lib/integrations/embeddings-rag';
import { securityLogger } from '@/lib/utils/security-logger';

dotenv.config({ path: '.env.local' });

const KNOWLEDGE_DIR = join(process.cwd(), 'data', 'hotel-etuna-knowledge');
const COLLECTION_NAME = process.env.RAG_QDRANT_COLLECTION?.trim() || 'buffr_rag';
const CHUNK_MAX_CHARS = 800;
const CHUNK_OVERLAP = 100;

function parseCliInt(flag: string, fallback: number): number {
  const arg = process.argv.find((a) => a.startsWith(`--${flag}=`));
  if (!arg) return fallback;
  const n = parseInt(arg.split('=')[1] ?? '', 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

const INFERENCE_UPSERT_BATCH = parseCliInt('upsert-batch', 8);
const INFERENCE_BATCH_DELAY_MS = 1500;

interface DocumentChunk {
  documentTitle: string;
  source: string;
  chunkIndex: number;
  content: string;
  metadata: Record<string, unknown>;
}

function generateDeterministicUuid(tenantId: string, documentTitle: string, chunkIndex: number): string {
  const input = `${tenantId}:${documentTitle}:${chunkIndex}`;
  const hash = createHash('sha256').update(input).digest('hex');
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-${hash.slice(16, 20)}-${hash.slice(20, 32)}`;
}

function chunkMarkdownDocument(markdown: string, maxChars: number, overlap: number): string[] {
  const normalized = markdown.replace(/\r\n/g, '\n').trim();
  if (!normalized) return [];

  const chunks: string[] = [];
  const lines = normalized.split('\n');
  let currentChunk = '';
  let currentSize = 0;

  const flushChunk = () => {
    const trimmed = currentChunk.trim();
    if (trimmed) {
      chunks.push(trimmed);
    }
    if (overlap > 0 && trimmed.length > overlap) {
      const overlapText = trimmed.slice(-overlap);
      currentChunk = overlapText;
      currentSize = overlapText.length;
    } else {
      currentChunk = '';
      currentSize = 0;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineLength = line.length + 1;
    const isHeading = /^#{1,6}\s/.test(line);

    if (currentSize + lineLength > maxChars && currentChunk.length > 0) {
      flushChunk();
    }
    if (isHeading && currentChunk.length > 0) {
      flushChunk();
    }

    currentChunk += (currentChunk ? '\n' : '') + line;
    currentSize += lineLength;

    if (currentSize > maxChars * 1.2) {
      flushChunk();
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  const finalChunks: string[] = [];
  for (const chunk of chunks) {
    if (chunk.length <= maxChars) {
      finalChunks.push(chunk);
    } else {
      let offset = 0;
      while (offset < chunk.length) {
        const raw = chunk.slice(offset, Math.min(offset + maxChars, chunk.length));
        if (offset + maxChars < chunk.length) {
          const boundary = raw.lastIndexOf(' ');
          if (boundary > maxChars * 0.55) {
            const piece = chunk.slice(offset, offset + boundary).trim();
            if (piece) finalChunks.push(piece);
            offset += boundary;
            continue;
          }
        }
        const trimmed = raw.trim();
        if (trimmed) finalChunks.push(trimmed);
        const stride = Math.max(1, maxChars - overlap);
        offset += Math.min(raw.length, stride);
      }
    }
  }

  return finalChunks.filter(Boolean);
}

function loadAndChunkDocuments(): DocumentChunk[] {
  securityLogger.info(`📂 Loading documents from ${KNOWLEDGE_DIR}...`);

  const files = readdirSync(KNOWLEDGE_DIR).filter((f) => f.endsWith('.md'));
  if (files.length === 0) {
    throw new Error(`No .md files found in ${KNOWLEDGE_DIR}`);
  }

  securityLogger.info(`   Found ${files.length} markdown files`);

  const allChunks: DocumentChunk[] = [];

  for (const file of files) {
    const filePath = join(KNOWLEDGE_DIR, file);
    const content = readFileSync(filePath, 'utf-8');
    const documentTitle = file.replace('.md', '');

    securityLogger.info(`   📄 Processing ${file} (${content.length} chars)...`);

    const chunks = chunkMarkdownDocument(content, CHUNK_MAX_CHARS, CHUNK_OVERLAP);
    securityLogger.info(`      → Generated ${chunks.length} chunks`);

    chunks.forEach((chunkContent, idx) => {
      allChunks.push({
        documentTitle,
        source: file,
        chunkIndex: idx,
        content: chunkContent,
        metadata: {
          documentTitle,
          source: file,
          chunkIndex: idx,
          chunkLength: chunkContent.length,
        },
      });
    });
  }

  securityLogger.info(`✅ Total chunks: ${allChunks.length}\n`);
  return allChunks;
}

async function upsertToQdrantInference(
  tenantId: string,
  chunks: DocumentChunk[],
  dryRun: boolean
): Promise<void> {
  const model = qdrantInferenceModel();
  const dims = qdrantInferenceVectorSize();
  securityLogger.info(`🚀 Upserting to Qdrant inference (model: ${model}, ${dims}d)...`);

  if (dryRun) {
    securityLogger.info(`   [DRY RUN] Would upsert ${chunks.length} points to "${COLLECTION_NAME}"`);
    return;
  }

  const ping = await verifyQdrantInferenceConnection();
  if (!ping.ok) {
    throw new Error(`Qdrant unreachable: ${ping.error}`);
  }

  await ensureQdrantInferenceCollection(COLLECTION_NAME);
  await qdrantInferenceDeleteTenant(COLLECTION_NAME, tenantId);

  const points: QdrantInferencePoint[] = chunks.map((chunk) => ({
    id: generateDeterministicUuid(tenantId, chunk.documentTitle, chunk.chunkIndex),
    text: chunk.content,
    payload: {
      tenant_id: tenantId,
      text: chunk.content,
      source: chunk.source,
      document_title: chunk.documentTitle,
      chunk_index: chunk.chunkIndex,
      chunk_length: chunk.content.length,
    },
  }));

  for (let i = 0; i < points.length; i += INFERENCE_UPSERT_BATCH) {
    const batch = points.slice(i, i + INFERENCE_UPSERT_BATCH);
    const batchNum = Math.floor(i / INFERENCE_UPSERT_BATCH) + 1;
    const totalBatches = Math.ceil(points.length / INFERENCE_UPSERT_BATCH);
    securityLogger.info(`   Upsert batch ${batchNum}/${totalBatches} (${batch.length} points)...`);
    await qdrantInferenceUpsert(COLLECTION_NAME, batch);
    if (i + INFERENCE_UPSERT_BATCH < points.length) {
      await new Promise((resolve) => setTimeout(resolve, INFERENCE_BATCH_DELAY_MS));
    }
  }

  securityLogger.info(`✅ Upserted ${points.length} points via Qdrant Cloud Inference\n`);
}

async function main() {
  const isDryRun = process.argv.includes('--dry');

  securityLogger.info('═══════════════════════════════════════════════════════════');
  securityLogger.info('🏨 Hotel Etuna Knowledge Base Ingestion');
  securityLogger.info('═══════════════════════════════════════════════════════════\n');

  if (isDryRun) {
    securityLogger.info('⚠️  DRY RUN MODE - No API calls will be made\n');
  }

  const QDRANT_URL = process.env.QDRANT_URL;
  const QDRANT_API_KEY = process.env.QDRANT_API_KEY;
  const HUB_TENANT_ID = process.env.HUB_TENANT_ID;

  if (!QDRANT_URL) {
    throw new Error('QDRANT_URL not set in .env.local');
  }
  if (!QDRANT_API_KEY && !isDryRun) {
    securityLogger.warn('⚠️  QDRANT_API_KEY not set (required for Qdrant Cloud)');
  }
  if (!isQdrantInferenceEnabled() && !isDryRun) {
    throw new Error('Set RAG_USE_QDRANT_INFERENCE=true with QDRANT_URL + QDRANT_API_KEY');
  }
  if (!isRagEmbeddingConfigured() && !isDryRun) {
    throw new Error('RAG embedding config invalid — check Qdrant inference env vars');
  }
  if (!HUB_TENANT_ID) {
    throw new Error('HUB_TENANT_ID not set in .env.local');
  }

  securityLogger.info('📋 Configuration:');
  securityLogger.info(`   Qdrant URL: ${QDRANT_URL}`);
  securityLogger.info(`   Qdrant API Key: ${QDRANT_API_KEY ? '✓ Set' : '✗ Not set'}`);
  securityLogger.info(`   Inference model: ${qdrantInferenceModel()}`);
  securityLogger.info(`   Vector size: ${qdrantInferenceVectorSize()}d`);
  securityLogger.info(`   Upsert batch: ${INFERENCE_UPSERT_BATCH}`);
  securityLogger.info(`   Hub Tenant ID: ${HUB_TENANT_ID}`);
  securityLogger.info(`   Collection: ${COLLECTION_NAME}`);
  securityLogger.info(`   Chunk size: ${CHUNK_MAX_CHARS} chars (overlap: ${CHUNK_OVERLAP})\n`);

  const chunks = loadAndChunkDocuments();
  await upsertToQdrantInference(HUB_TENANT_ID, chunks, isDryRun);

  const totalTokensEstimate = chunks.reduce((sum, c) => sum + Math.ceil(c.content.length / 4), 0);
  securityLogger.info('═══════════════════════════════════════════════════════════');
  securityLogger.info('✅ Ingestion Complete!');
  securityLogger.info('═══════════════════════════════════════════════════════════');
  securityLogger.info(`   Documents processed: ${new Set(chunks.map((c) => c.documentTitle)).size}`);
  securityLogger.info(`   Total chunks: ${chunks.length}`);
  securityLogger.info(`   Estimated tokens: ~${totalTokensEstimate.toLocaleString()}`);
  securityLogger.info(`   Collection: ${COLLECTION_NAME}`);
  securityLogger.info(`   Tenant: ${HUB_TENANT_ID}\n`);

  if (!isDryRun) {
    securityLogger.info('🤖 Sofia AI can now answer questions about Hotel Etuna!');
    securityLogger.info(`   Embeddings: Qdrant Cloud (${qdrantInferenceModel()}, ${qdrantInferenceVectorSize()}d)`);
    securityLogger.info('   Test with: "What does Etuna mean?" or "Tell me about the rooms"');
  }

  securityLogger.info('\n');
}

main().catch((error) => {
  securityLogger.error('\n❌ Error:', error.message);
  securityLogger.error(error);
  process.exit(1);
});
