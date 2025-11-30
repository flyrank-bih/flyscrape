import { describe, expect, it } from 'vitest';
import { filterBySemanticSimilarity } from '../semantic';

describe('filterBySemanticSimilarity', () => {
  it('should filter and sort chunks by cosine similarity', () => {
    // Simple 2D vectors for testing
    // Query: [1, 0] (X-axis)
    const queryEmbedding = [1, 0];

    const chunks = [
      { content: 'Parallel', embedding: [1, 0] }, // Score 1.0
      { content: 'Perpendicular', embedding: [0, 1] }, // Score 0.0
      { content: 'Opposite', embedding: [-1, 0] }, // Score -1.0
      { content: 'Diagonal', embedding: [Math.SQRT1_2, Math.SQRT1_2] }, // Score ~0.707
    ];

    const results = filterBySemanticSimilarity(chunks, queryEmbedding, 0.5);

    expect(results.length).toBe(2);
    expect(results[0].content).toBe('Parallel');
    expect(results[0].score).toBeCloseTo(1.0);
    expect(results[1].content).toBe('Diagonal');
    expect(results[1].score).toBeCloseTo(Math.SQRT1_2);
  });

  it('should handle empty inputs', () => {
    expect(filterBySemanticSimilarity([], [1, 0])).toEqual([]);
  });
});
