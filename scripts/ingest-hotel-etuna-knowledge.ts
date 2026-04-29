/**
 * Hotel Etuna Knowledge Base Ingestion Script
 *
 * Loads markdown documents from data/hotel-etuna-knowledge/, chunks them semantically,
 * generates embeddings via Voyage AI, and upserts to Qdrant with tenant isolation.
 *
 * Usage:
 *   npx tsx scripts/ingest-hotel-etuna-knowledge.ts          # Full ingestion
 *   npx tsx scripts/ingest-hotel-etuna-knowledge.ts --dry    # Dry run (no API calls)
 *
 * Requirements:
 *   - QDRANT_URL and QDRANT_API_KEY in .env.local
 *   - VOYAGE_API_KEY in .env.local (embeddings; align EMBEDDING_MODEL with collection vector size)
 *   - HUB_TENANT_ID in .env.local
 *   - Optional: RAG_QDRANT_COLLECTION (default buffr_rag — must match RAGSearchService / Sofia)
 */

import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { createHash } from 'crypto';
import * as dotenv from 'dotenv';
import {
  ensureQdrantCollection,
  qdrantUpsert,
  qdrantDeleteByFilter,
  type QdrantPoint,
} from '../lib/integrations/qdrant';
import { 
  getEmbedding, 
  isVoyageConfigured,
  getEmbeddingDimension,
  getModelName
} from '../lib/integrations/embeddings-voyage';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Configuration
const KNOWLEDGE_DIR = join(process.cwd(), 'data', 'hotel-etuna-knowledge');
/** Must match `RAGSearchService` / env `RAG_QDRANT_COLLECTION` (default buffr_rag). */
const COLLECTION_NAME = process.env.RAG_QDRANT_COLLECTION?.trim() || 'buffr_rag';
const CHUNK_MAX_CHARS = 800;
const CHUNK_OVERLAP = 100;
const BATCH_SIZE = 3; // Smaller bursts to ease Voyage free-tier limits
const RETRY_ATTEMPTS = 8;
const BASE_RETRY_DELAY_MS = 3500;
const RATE_LIMIT_EXTRA_MS = 45000; // Added on HTTP 429
const BETWEEN_CHUNK_MS = 450; // Pace requests inside a nominal “batch”
const BATCH_DELAY_MS = 5500;

interface DocumentChunk {
  documentTitle: string;
  source: string;
  chunkIndex: number;
  content: string;
  metadata: Record<string, unknown>;
}

/**
 * Generates a deterministic UUID based on tenant ID, document title, and chunk index.
 */
function generateDeterministicUuid(tenantId: string, documentTitle: string, chunkIndex: number): string {
  const input = `${tenantId}:${documentTitle}:${chunkIndex}`;
  const hash = createHash('sha256').update(input).digest('hex');
  // Format as UUID v4
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-${hash.slice(16, 20)}-${hash.slice(20, 32)}`;
}

/**
 * Semantic-aware markdown chunking.
 * Prefers splitting at markdown headings and paragraphs, with overlap for context.
 */
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
    // Keep overlap from the end of current chunk
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
    const lineLength = line.length + 1; // +1 for newline

    // Check if this is a markdown heading (semantic boundary)
    const isHeading = /^#{1,6}\s/.test(line);

    // If adding this line exceeds max and we have content, flush
    if (currentSize + lineLength > maxChars && currentChunk.length > 0) {
      flushChunk();
    }

    // If this is a heading and we have content, prefer splitting here
    if (isHeading && currentChunk.length > 0) {
      flushChunk();
    }

    currentChunk += (currentChunk ? '\n' : '') + line;
    currentSize += lineLength;

    // If we've exceeded max even after flushing, force flush
    if (currentSize > maxChars * 1.2) {
      flushChunk();
    }
  }

  // Flush remaining
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  // Ensure no chunk exceeds hard limit (fallback to character splitting)
  const finalChunks: string[] = [];
  for (const chunk of chunks) {
    if (chunk.length <= maxChars) {
      finalChunks.push(chunk);
    } else {
      /** Fixed‑stride slicing so overlap cannot advance byte‑by‑byte (that produced 100+ micro‑chunks per paragraph). */
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

/**
 * Loads and chunks all markdown documents from the knowledge directory.
 */
function loadAndChunkDocuments(): DocumentChunk[] {
  console.log(`📂 Loading documents from ${KNOWLEDGE_DIR}...`);

  const files = readdirSync(KNOWLEDGE_DIR).filter((f) => f.endsWith('.md'));
  if (files.length === 0) {
    throw new Error(`No .md files found in ${KNOWLEDGE_DIR}`);
  }

  console.log(`   Found ${files.length} markdown files`);

  const allChunks: DocumentChunk[] = [];

  for (const file of files) {
    const filePath = join(KNOWLEDGE_DIR, file);
    const content = readFileSync(filePath, 'utf-8');
    const documentTitle = file.replace('.md', '');

    console.log(`   📄 Processing ${file} (${content.length} chars)...`);

    const chunks = chunkMarkdownDocument(content, CHUNK_MAX_CHARS, CHUNK_OVERLAP);
    console.log(`      → Generated ${chunks.length} chunks`);

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

  console.log(`✅ Total chunks: ${allChunks.length}\n`);
  return allChunks;
}

/**
 * Generates embeddings for chunks with batch processing and retry logic.
 */
async function generateEmbeddings(
  chunks: DocumentChunk[], 
  dryRun: boolean,
  embeddingDimension: number
): Promise<Map<DocumentChunk, number[]>> {
  console.log(`🔮 Generating embeddings for ${chunks.length} chunks...`);

  const embeddings = new Map<DocumentChunk, number[]>();
  const batches: DocumentChunk[][] = [];

  // Split into batches
  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    batches.push(chunks.slice(i, i + BATCH_SIZE));
  }

  console.log(`   Processing ${batches.length} batches (batch size: ${BATCH_SIZE})`);

  for (let batchIdx = 0; batchIdx < batches.length; batchIdx++) {
    const batch = batches[batchIdx];
    console.log(`   Batch ${batchIdx + 1}/${batches.length}...`);

    for (const chunk of batch) {
      if (dryRun) {
        // Mock embedding for dry run
        embeddings.set(chunk, new Array(embeddingDimension).fill(0));
        continue;
      }

      let attempt = 0;
      let success = false;
      let embedding: number[] | null = null;

      while (attempt < RETRY_ATTEMPTS && !success) {
        try {
          embedding = await getEmbedding(chunk.content);
          if (embedding && embedding.length === embeddingDimension) {
            embeddings.set(chunk, embedding);
            success = true;
          } else {
            throw new Error(`Invalid embedding: expected ${embeddingDimension}d, got ${embedding ? `${embedding.length}d` : 'null'}`);
          }
        } catch (error: unknown) {
          attempt++;
          const status =
            typeof error === 'object' && error && 'status' in error ? (error as { status?: number }).status : undefined;
          const code429 = status === 429;
          if (attempt < RETRY_ATTEMPTS) {
            let delayMs = BASE_RETRY_DELAY_MS * Math.pow(2, attempt - 1);
            if (code429) {
              delayMs += RATE_LIMIT_EXTRA_MS;
              console.log(`      ⚠️  Rate limited (429) — waiting extra ${RATE_LIMIT_EXTRA_MS / 1000}s before retry...`);
            }
            console.log(`      ⚠️  Retry ${attempt}/${RETRY_ATTEMPTS} after ${delayMs}ms...`);
            await new Promise((resolve) => setTimeout(resolve, delayMs));
          } else {
            console.error(`      ❌ Failed after ${RETRY_ATTEMPTS} attempts:`, error);
            throw new Error(`Failed to generate embedding for chunk: ${chunk.documentTitle}[${chunk.chunkIndex}]`);
          }
        }
      }
      
      if (!dryRun) {
        await new Promise((resolve) => setTimeout(resolve, BETWEEN_CHUNK_MS));
      }
    }

    // Delay between batches to avoid rate limiting
    if (batchIdx < batches.length - 1 && !dryRun) {
      console.log(`   ⏱️  Waiting ${BATCH_DELAY_MS}ms before next batch...`);
      await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY_MS));
    }
  }

  console.log(`✅ Generated ${embeddings.size} embeddings\n`);
  return embeddings;
}

/**
 * Upserts chunks to Qdrant with deterministic UUIDs.
 */
async function upsertToQdrant(
  tenantId: string,
  embeddings: Map<DocumentChunk, number[]>,
  dryRun: boolean,
  embeddingDimension: number
): Promise<void> {
  console.log(`🚀 Upserting to Qdrant collection "${COLLECTION_NAME}"...`);

  if (dryRun) {
    console.log(`   [DRY RUN] Would upsert ${embeddings.size} points`);
    const entries = Array.from(embeddings.entries());
    for (const [chunk, _] of entries) {
      const id = generateDeterministicUuid(tenantId, chunk.documentTitle, chunk.chunkIndex);
      console.log(`   [DRY RUN] Point ID: ${id}`);
      console.log(
        `              Payload: tenant_id=${tenantId}, text=…, source=${chunk.source}, doc=${chunk.documentTitle}, chunk=${chunk.chunkIndex}`
      );
    }
    console.log(`✅ Dry run complete\n`);
    return;
  }

  // Ensure collection exists
  console.log(`   Ensuring collection exists (dimension: ${embeddingDimension})...`);
  await ensureQdrantCollection(COLLECTION_NAME, embeddingDimension);

  // Clear existing points for this tenant (idempotency)
  console.log(`   Clearing existing points for tenant ${tenantId}...`);
  await qdrantDeleteByFilter(COLLECTION_NAME, { tenant_id: tenantId });

  // Prepare points
  const points: QdrantPoint[] = [];
  const entries = Array.from(embeddings.entries());
  for (const [chunk, vector] of entries) {
    const id = generateDeterministicUuid(tenantId, chunk.documentTitle, chunk.chunkIndex);
    points.push({
      id,
      vector,
      payload: {
        tenant_id: tenantId,
        text: chunk.content,
        source: chunk.source,
        document_title: chunk.documentTitle,
        chunk_index: chunk.chunkIndex,
        chunk_length: chunk.content.length,
      },
    });
  }

  // Upsert in batches (Qdrant handles large batches well, but we'll split for safety)
  const upsertBatchSize = 100;
  for (let i = 0; i < points.length; i += upsertBatchSize) {
    const batch = points.slice(i, i + upsertBatchSize);
    console.log(`   Upserting batch ${Math.floor(i / upsertBatchSize) + 1}/${Math.ceil(points.length / upsertBatchSize)} (${batch.length} points)...`);
    await qdrantUpsert(COLLECTION_NAME, batch);
  }

  console.log(`✅ Upserted ${points.length} points to Qdrant\n`);
}

/**
 * Main ingestion pipeline.
 */
async function main() {
  const isDryRun = process.argv.includes('--dry');

  console.log('═══════════════════════════════════════════════════════════');
  console.log('🏨 Hotel Etuna Knowledge Base Ingestion');
  console.log('═══════════════════════════════════════════════════════════\n');

  if (isDryRun) {
    console.log('⚠️  DRY RUN MODE - No API calls will be made\n');
  }

  // Validate environment
  const QDRANT_URL = process.env.QDRANT_URL;
  const QDRANT_API_KEY = process.env.QDRANT_API_KEY;
  const HUB_TENANT_ID = process.env.HUB_TENANT_ID;
  const hasVoyage = isVoyageConfigured();
  const embeddingModel = getModelName();
  const EMBEDDING_DIMENSION = getEmbeddingDimension();

  if (!QDRANT_URL) {
    throw new Error('QDRANT_URL not set in .env.local');
  }
  if (!QDRANT_API_KEY && !isDryRun) {
    console.warn('⚠️  QDRANT_API_KEY not set (may be required for Qdrant Cloud)');
  }
  if (!hasVoyage && !isDryRun) {
    throw new Error('Voyage AI not configured. Set VOYAGE_API_KEY in .env.local');
  }
  if (!HUB_TENANT_ID) {
    throw new Error('HUB_TENANT_ID not set in .env.local');
  }

  console.log('📋 Configuration:');
  console.log(`   Qdrant URL: ${QDRANT_URL}`);
  console.log(`   Qdrant API Key: ${QDRANT_API_KEY ? '✓ Set' : '✗ Not set'}`);
  console.log(`   Embedding Provider: Voyage AI`);
  console.log(`   Embedding Model: ${embeddingModel}`);
  console.log(`   Voyage API Key: ${hasVoyage ? '✓ Configured' : '✗ Not configured'}`);
  console.log(`   Hub Tenant ID: ${HUB_TENANT_ID}`);
  console.log(`   Collection: ${COLLECTION_NAME}`);
  console.log(`   Chunk size: ${CHUNK_MAX_CHARS} chars (overlap: ${CHUNK_OVERLAP})`);
  console.log(`   Embedding dimension: ${EMBEDDING_DIMENSION}d\n`);

  // Step 1: Load and chunk documents
  const chunks = loadAndChunkDocuments();

  // Step 2: Generate embeddings
  const embeddings = await generateEmbeddings(chunks, isDryRun, EMBEDDING_DIMENSION);

  // Step 3: Upsert to Qdrant
  await upsertToQdrant(HUB_TENANT_ID, embeddings, isDryRun, EMBEDDING_DIMENSION);

  // Summary
  const totalTokensEstimate = chunks.reduce((sum, c) => sum + Math.ceil(c.content.length / 4), 0);
  console.log('═══════════════════════════════════════════════════════════');
  console.log('✅ Ingestion Complete!');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`   Documents processed: ${new Set(chunks.map((c) => c.documentTitle)).size}`);
  console.log(`   Total chunks: ${chunks.length}`);
  console.log(`   Total embeddings: ${embeddings.size}`);
  console.log(`   Estimated tokens: ~${totalTokensEstimate.toLocaleString()}`);
  console.log(`   Collection: ${COLLECTION_NAME}`);
  console.log(`   Tenant: ${HUB_TENANT_ID}\n`);

  if (!isDryRun) {
    console.log(`🤖 Sofia AI can now answer questions about Hotel Etuna!`);
    console.log(`   Embedding provider: Voyage AI (${embeddingModel})`);
    console.log('   Test with: "What does Etuna mean?" or "Tell me about the rooms"');
  }

  console.log('\n');
}

// Run the script
main().catch((error) => {
  console.error('\n❌ Error:', error.message);
  console.error(error);
  process.exit(1);
});
