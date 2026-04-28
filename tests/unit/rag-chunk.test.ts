import { describe, expect, it } from 'vitest';
import { splitTextIntoRagChunks } from '@/lib/services/documents/rag-chunk';

describe('splitTextIntoRagChunks', () => {
  it('returns single chunk for short text', () => {
    expect(splitTextIntoRagChunks('Hello world.', 1000, 50)).toEqual(['Hello world.']);
  });

  it('merges small paragraphs under max', () => {
    const t = 'A.\n\nB.\n\nC.';
    const out = splitTextIntoRagChunks(t, 20, 5);
    expect(out.length).toBe(1);
    expect(out[0]).toContain('A.');
    expect(out[0]).toContain('C.');
  });

  it('splits oversized paragraph', () => {
    const word = 'abcdefghij ';
    const long = word.repeat(30);
    const out = splitTextIntoRagChunks(long, 40, 8);
    expect(out.length).toBeGreaterThan(1);
    expect(out.every((c) => c.length <= 40 || c.length <= 45)).toBe(true);
  });

  it('trims and drops empty', () => {
    expect(splitTextIntoRagChunks('   \n\n  ', 100, 10)).toEqual([]);
  });
});
