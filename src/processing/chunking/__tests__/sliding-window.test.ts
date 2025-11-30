import { describe, expect, it } from 'vitest';
import { tokenCounter } from '../../../utils/token';
import { slidingWindowChunk } from '../sliding-window';

describe('Sliding Window Chunking', () => {
  it('should chunk text larger than window', () => {
    const text = 'word '.repeat(20);
    const windowSize = 5;
    const chunks = slidingWindowChunk(text, { windowSize, step: 5 });

    expect(chunks.length).toBeGreaterThan(1);
    const chunk0Tokens = tokenCounter.count(chunks[0]);
    expect(chunk0Tokens).toBeLessThanOrEqual(windowSize);
  });

  it('should handle overlap correctly', () => {
    const text = '1 2 3 4 5 6 7 8 9 10';
    const chunks = slidingWindowChunk(text, { windowSize: 5, overlap: 2 });
    expect(chunks.length).toBeGreaterThan(1);
  });

  it('should return single chunk if text fits in window', () => {
    const text = 'Short text';
    const chunks = slidingWindowChunk(text, { windowSize: 100 });
    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toBe(text);
  });

  it('should throw error for invalid window size', () => {
    expect(() => slidingWindowChunk('text', { windowSize: 0 })).toThrow();
  });

  it('should calculate step from overlap', () => {
    const text = 'a '.repeat(20);
    const chunks = slidingWindowChunk(text, { windowSize: 10, overlap: 2 });
    expect(chunks.length).toBeGreaterThanOrEqual(2);
  });

  it('should throw if step is not positive', () => {
    // window 5, overlap 5 => step 0 => error
    expect(() =>
      slidingWindowChunk('text', { windowSize: 5, overlap: 5 }),
    ).toThrow();
  });
});
