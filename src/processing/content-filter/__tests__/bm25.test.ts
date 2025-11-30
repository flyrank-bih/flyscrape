import { describe, it, expect } from 'vitest';
import { BM25 } from '../bm25';

describe('BM25', () => {
  const corpus = [
    'The quick brown fox jumps over the lazy dog',
    'The quick brown fox',
    'The lazy dog',
    'Hello world',
  ];

  it('should initialize with default options', () => {
    const bm25 = new BM25(corpus);
    expect(bm25).toBeDefined();
  });

  it('should score documents based on relevance', () => {
    const bm25 = new BM25(corpus);
    const scores = bm25.score('fox');
    
    // "fox" appears in doc 0 and 1. Doc 1 is shorter, so it should score higher (length normalization).
    expect(scores[1]).toBeGreaterThan(scores[0]);
    expect(scores[0]).toBeGreaterThan(0);
    expect(scores[2]).toBe(0);
    expect(scores[3]).toBe(0);
  });

  it('should handle empty queries', () => {
    const bm25 = new BM25(corpus);
    const scores = bm25.score('');
    expect(scores).toEqual([0, 0, 0, 0]);
  });

  it('should handle non-matching queries', () => {
    const bm25 = new BM25(corpus);
    const scores = bm25.score('zebra');
    expect(scores).toEqual([0, 0, 0, 0]);
  });

  it('should be case insensitive', () => {
    const bm25 = new BM25(corpus);
    const scores1 = bm25.score('FOX');
    const scores2 = bm25.score('fox');
    expect(scores1).toEqual(scores2);
  });

  it('should handle special characters', () => {
    const specialCorpus = [
      'Node.js is awesome!',
      'Do you like C++?',
      'Python_language'
    ];
    const bm25 = new BM25(specialCorpus);
    
    // Depending on tokenizer implementation, "node.js" might become "node js" or "node", "js"
    // Our simple tokenizer splits by non-alphanumeric, so "node.js" -> "node", "js"
    
    const scores = bm25.score('node');
    expect(scores[0]).toBeGreaterThan(0);
  });

  it('should respect custom options', () => {
    // With b=0, length normalization is disabled.
    // "fox" in doc 0 and 1 should have same score if length norm is off? 
    // Wait, doc 0 has "fox" once, doc 1 has "fox" once.
    // Term frequency is same (1).
    // If b=0, length doesn't matter.
    
    const bm25 = new BM25(corpus, { b: 0 });
    const scores = bm25.score('fox');
    
    // Since TF is 1 in both, and b=0 removes length penalty, scores should be equal.
    expect(scores[0]).toBeCloseTo(scores[1]);
  });
});
