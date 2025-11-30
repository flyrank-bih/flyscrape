/**
 * Splits text based on regex patterns.
 * Useful for coarse segmentation (e.g., by paragraphs, sentences).
 *
 * @param text The text to chunk.
 * @param patterns Array of regex patterns to split by. Defaults to double newline (paragraphs).
 * @returns Array of text chunks.
 */
export function regexChunk(
  text: string,
  patterns: RegExp[] = [/\n\n/],
): string[] {
  if (!text) return [];

  let chunks = [text];

  for (const pattern of patterns) {
    const newChunks: string[] = [];
    for (const chunk of chunks) {
      // Split by pattern and filter out empty strings
      const parts = chunk
        .split(pattern)
        .filter((part) => part.trim().length > 0);
      newChunks.push(...parts);
    }
    chunks = newChunks;
  }

  return chunks;
}
