import { BM25 } from "./bm25";
import type { PruningOptions, ScoredChunk } from "./interfaces";

/**
 * Prunes content chunks based on relevance to a query using BM25.
 *
 * @param chunks Array of text chunks to prune.
 * @param options Pruning configuration options.
 * @returns Array of scored chunks that meet the criteria, sorted by score (descending).
 */
export function pruneContent(
  chunks: string[],
  options: PruningOptions
): ScoredChunk[] {
  if (!chunks || chunks.length === 0) {
    return [];
  }

  if (!options.query || options.query.trim() === "") {
    return [];
  }

  // Initialize BM25 and score chunks
  const bm25 = new BM25(chunks, options.bm25);
  const scores = bm25.score(options.query);

  // Map to ScoredChunk objects
  let scoredChunks: ScoredChunk[] = chunks.map((content, index) => ({
    index,
    score: scores[index],
    content,
  }));

  // Filter by threshold if provided
  if (options.threshold !== undefined) {
    scoredChunks = scoredChunks.filter(
      (chunk) => chunk.score >= (options.threshold as number)
    );
  }

  // Sort by score descending
  scoredChunks.sort((a, b) => b.score - a.score);

  // Limit to topK if provided
  if (options.topK !== undefined && options.topK > 0) {
    scoredChunks = scoredChunks.slice(0, options.topK);
  }

  return scoredChunks;
}
