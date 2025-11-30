import { cosineSimilarity } from '../../utils/vectors';
import type { ScoredChunk } from './interfaces';

/**
 * Filters content chunks based on semantic similarity (cosine similarity) of embeddings.
 *
 * @param chunks Array of objects containing content and its vector embedding.
 * @param queryEmbedding The vector embedding of the query.
 * @param threshold Minimum similarity score (0 to 1). Default 0.7.
 * @returns Array of scored chunks sorted by similarity.
 */
export function filterBySemanticSimilarity(
  chunks: { content: string; embedding: number[] }[],
  queryEmbedding: number[],
  threshold: number = 0.7,
): ScoredChunk[] {
  if (!chunks || chunks.length === 0 || !queryEmbedding) {
    return [];
  }

  const scored = chunks.map((chunk, index) => {
    const score = cosineSimilarity(queryEmbedding, chunk.embedding);
    return {
      index,
      score,
      content: chunk.content,
    };
  });

  // Filter and sort
  return scored
    .filter((chunk) => chunk.score >= threshold)
    .sort((a, b) => b.score - a.score);
}
