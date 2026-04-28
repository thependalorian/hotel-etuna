/**
 * RAG text chunking helpers
 *
 * Purpose: Split long policy / KB text into overlapping segments for embedding + Qdrant upsert.
 * Location: /lib/services/documents/rag-chunk.ts
 */

/**
 * Paragraph-aware chunking with character cap and overlap for oversized paragraphs.
 */
export function splitTextIntoRagChunks(
  fullText: string,
  maxChars: number,
  overlap: number
): string[] {
  const normalized = fullText.replace(/\r\n/g, '\n').trim();
  if (!normalized) return [];

  const parts = normalized
    .split(/\n{2,}/)
    .map((s) => s.trim())
    .filter(Boolean);
  const chunks: string[] = [];
  let current = '';

  const flush = () => {
    const t = current.trim();
    if (t) chunks.push(t);
    current = '';
  };

  const pushOversized = (s: string) => {
    let i = 0;
    while (i < s.length) {
      const end = Math.min(i + maxChars, s.length);
      let piece = s.slice(i, end);
      if (end < s.length) {
        const space = piece.lastIndexOf(' ');
        if (space > maxChars * 0.4) piece = piece.slice(0, space);
      }
      const trimmed = piece.trim();
      if (trimmed) chunks.push(trimmed);
      const step = Math.max(1, piece.length - overlap);
      i += step;
    }
  };

  for (const p of parts) {
    if (p.length > maxChars) {
      flush();
      pushOversized(p);
      continue;
    }
    if (current.length + p.length + 2 <= maxChars) {
      current = current ? `${current}\n\n${p}` : p;
    } else {
      flush();
      current = p;
    }
  }
  flush();
  return chunks;
}
