import type { TiktokenModel } from 'js-tiktoken';
import { tokenCounter } from '../../utils/token';

export interface SlidingWindowOptions {
  /**
   * The size of each chunk in tokens.
   */
  windowSize: number;

  /**
   * The number of tokens to step forward for the next chunk.
   * If not provided, it is calculated as windowSize - overlap.
   * If overlap is also not provided, defaults to windowSize (no overlap).
   */
  step?: number;

  /**
   * The number of tokens to overlap between chunks.
   * Ignored if step is provided.
   */
  overlap?: number;

  /**
   * The model to use for tokenization.
   * @default "gpt-4o-mini"
   */
  model?: TiktokenModel;
}

/**
 * Chunks text using a sliding window of tokens.
 * Ensures that chunks respect token limits, suitable for LLM context windows.
 *
 * @param text The text to chunk.
 * @param options Configuration options.
 * @returns Array of text chunks.
 */
export function slidingWindowChunk(
  text: string,
  options: SlidingWindowOptions,
): string[] {
  if (!text) return [];
  if (options.windowSize <= 0) throw new Error('windowSize must be positive');

  const { windowSize, model } = options;

  // Calculate step: explicit step > calculated from overlap > windowSize (no overlap)
  let step = options.step;
  if (step === undefined) {
    if (options.overlap !== undefined) {
      step = windowSize - options.overlap;
    } else {
      step = windowSize;
    }
  }

  if (step <= 0)
    throw new Error(
      'Step size must be positive. Check windowSize and overlap.',
    );

  const tokens = tokenCounter.encode(text, model);
  const chunks: string[] = [];

  // Handle case where text is smaller than window
  if (tokens.length <= windowSize) {
    return [text];
  }

  for (let i = 0; i < tokens.length; i += step) {
    // slice handles out of bounds gracefully (caps at length)
    const chunkTokens = tokens.slice(i, i + windowSize);

    // If we are at the end and the chunk is too small?
    // Usually we just return what we have.
    if (chunkTokens.length > 0) {
      const chunkText = tokenCounter.decode(chunkTokens, model);
      chunks.push(chunkText);
    }

    // If the current window covers the rest of the tokens, we can stop.
    // However, the loop increment (i += step) ensures we advance.
    // We just need to make sure we don't produce a tiny redundant chunk if logic is off.
    // With standard loop `i < tokens.length`, it works fine.
  }

  return chunks;
}
