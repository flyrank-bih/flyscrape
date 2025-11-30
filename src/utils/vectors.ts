/**
 * Utility functions for vector operations, primarily for cosine similarity.
 * Useful for semantic search and relevance scoring in RAG pipelines.
 */

/**
 * Calculates the cosine similarity between two vectors.
 * @param vecA The first vector.
 * @param vecB The second vector.
 * @returns The cosine similarity (between -1 and 1). Returns 0 if vectors are empty or zero-magnitude.
 * @throws Error if vectors have different dimensions.
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) {
    throw new Error(
      `Vectors must have the same dimensions. Got ${vecA.length} and ${vecB.length}.`,
    );
  }

  if (vecA.length === 0) {
    return 0;
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  // Prevent division by zero
  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Calculates the magnitude (Euclidean norm) of a vector.
 * @param vec The vector.
 * @returns The magnitude.
 */
export function vectorMagnitude(vec: number[]): number {
  let sumSq = 0;
  for (const val of vec) {
    sumSq += val * val;
  }
  return Math.sqrt(sumSq);
}

/**
 * Normalizes a vector to unit length.
 * @param vec The vector to normalize.
 * @returns A new vector with unit length.
 */
export function normalizeVector(vec: number[]): number[] {
  const magnitude = vectorMagnitude(vec);
  if (magnitude === 0) {
    return new Array(vec.length).fill(0);
  }
  return vec.map((val) => val / magnitude);
}

/**
 * Calculates the dot product of two vectors.
 * @param vecA The first vector.
 * @param vecB The second vector.
 * @returns The dot product.
 * @throws Error if vectors have different dimensions.
 */
export function dotProduct(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) {
    throw new Error(
      `Vectors must have the same dimensions. Got ${vecA.length} and ${vecB.length}.`,
    );
  }

  let product = 0;
  for (let i = 0; i < vecA.length; i++) {
    product += vecA[i] * vecB[i];
  }
  return product;
}
