/**
 * Configuration options for the BM25 algorithm.
 */
export interface BM25Options {
  /**
   * Term frequency saturation parameter.
   * Controls how much term frequency contributes to the score.
   * @default 1.2
   */
  k1?: number;

  /**
   * Length normalization parameter.
   * Controls how much document length affects the score.
   * @default 0.75
   */
  b?: number;
}

/**
 * Represents a scored chunk of content.
 */
export interface ScoredChunk {
  /**
   * The index of the chunk in the original array.
   */
  index: number;

  /**
   * The relevance score assigned by the algorithm.
   */
  score: number;

  /**
   * The content of the chunk.
   */
  content: string;
}

/**
 * Configuration options for content pruning.
 */
export interface PruningOptions {
  /**
   * The query string to filter content against.
   */
  query: string;

  /**
   * Minimum score required to keep a chunk.
   * If not provided, no minimum score threshold is applied.
   */
  threshold?: number;

  /**
   * Maximum number of chunks to return (Top-K).
   * If not provided, all chunks meeting the threshold are returned.
   */
  topK?: number;

  /**
   * Options for the BM25 algorithm.
   */
  bm25?: BM25Options;
}
