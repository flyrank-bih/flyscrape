import { encoding_for_model, type Tiktoken, type TiktokenModel } from "@dqbd/tiktoken";
import { LRUCache } from "lru-cache";

/**
 * Configuration options for the Tokenizer.
 */
export interface TokenizerConfig {
  /**
   * The default model to use for tokenization if none is specified.
   * @default "gpt-4o-mini"
   */
  defaultModel?: TiktokenModel;
  
  /**
   * Whether to enable caching of token counts.
   * @default true
   */
  enableCache?: boolean;
  
  /**
   * Maximum size of the cache (number of items).
   * @default 1000
   */
  cacheSize?: number;
}

/**
 * Interface for tokenization operations.
 */
export interface ITokenizer {
  /**
   * Counts the number of tokens in the given text.
   * @param text The text to tokenize.
   * @param model Optional model to use for encoding.
   * @returns The number of tokens.
   */
  count(text: string, model?: TiktokenModel): number;

  /**
   * Truncates the text to the specified number of tokens.
   * @param text The text to truncate.
   * @param limit The maximum number of tokens.
   * @param model Optional model to use for encoding.
   * @returns The truncated text.
   */
  truncate(text: string, limit: number, model?: TiktokenModel): string;

  /**
   * Encodes text into tokens.
   * @param text The text to encode.
   * @param model Optional model to use for encoding.
   * @returns Array of token integers.
   */
  encode(text: string, model?: TiktokenModel): Uint32Array;

  /**
   * Decodes tokens back into text.
   * @param tokens The tokens to decode.
   * @param model Optional model to use for decoding.
   * @returns The decoded text.
   */
  decode(tokens: Uint32Array | number[], model?: TiktokenModel): string;
  
  /**
   * Frees up resources used by the tokenizer instances.
   */
  dispose(): void;
}

/**
 * A utility class for tokenization using @dqbd/tiktoken.
 * Supports caching and model-specific encoding.
 */
export class Tokenizer implements ITokenizer {
  private encoders: Map<string, Tiktoken> = new Map();
  private cache: LRUCache<string, number> | null = null;
  private defaultModel: TiktokenModel;

  constructor(config: TokenizerConfig = {}) {
    this.defaultModel = config.defaultModel || "gpt-4o-mini";
    
    if (config.enableCache !== false) {
      this.cache = new LRUCache({
        max: config.cacheSize || 1000,
      });
    }
  }

  /**
   * Gets or creates an encoder for the specified model.
   * @param model The model name.
   * @returns The Tiktoken encoder instance.
   */
  private getEncoder(model: TiktokenModel): Tiktoken {
    if (!this.encoders.has(model)) {
      try {
        const encoder = encoding_for_model(model);
        this.encoders.set(model, encoder);
      } catch (error) {
        // Fallback or rethrow with better message
        throw new Error(`Failed to load tokenizer for model '${model}': ${(error as Error).message}`);
      }
    }
    return this.encoders.get(model)!;
  }

  /**
   * Generates a cache key for the text and model.
   * @param text The text.
   * @param model The model.
   * @returns The cache key.
   */
  private getCacheKey(text: string, model: string): string {
    // Use a hash or just concatenation if text is not too long.
    // For very long text, this key generation might be expensive itself, 
    // but simpler than hashing for now.
    // Truncate text in key if too long to avoid massive keys?
    // Let's stick to simple concatenation for correctness, assuming typical usage.
    return `${model}:${text}`;
  }

  public count(text: string, model: TiktokenModel = this.defaultModel): number {
    if (!text) return 0;

    if (this.cache) {
      const key = this.getCacheKey(text, model);
      const cached = this.cache.get(key);
      if (cached !== undefined) {
        return cached;
      }
    }

    try {
      const encoder = this.getEncoder(model);
      const tokens = encoder.encode(text);
      const count = tokens.length;
      
      if (this.cache) {
        this.cache.set(this.getCacheKey(text, model), count);
      }
      
      return count;
    } catch (error) {
      console.error("Token counting error:", error);
      return 0; // Fail safe? Or throw?
    }
  }

  public encode(text: string, model: TiktokenModel = this.defaultModel): Uint32Array {
    if (!text) return new Uint32Array(0);
    const encoder = this.getEncoder(model);
    return encoder.encode(text);
  }

  public decode(tokens: Uint32Array | number[], model: TiktokenModel = this.defaultModel): string {
    if (!tokens || tokens.length === 0) return "";
    const encoder = this.getEncoder(model);
    // tiktoken expects Uint32Array usually
    const typedTokens = tokens instanceof Uint32Array ? tokens : new Uint32Array(tokens);
    const decoded = encoder.decode(typedTokens);
    // tiktoken returns Uint8Array bytes which need to be decoded to string?
    // The type definition says `decode(tokens: Uint32Array): string` usually.
    // Let's verify types. @dqbd/tiktoken `decode` returns string (it handles utf8).
    return new TextDecoder().decode(decoded);
  }

  public truncate(text: string, limit: number, model: TiktokenModel = this.defaultModel): string {
    if (!text) return "";
    
    // First check if truncation is needed
    const count = this.count(text, model);
    if (count <= limit) return text;

    // Encode, slice, decode
    const encoder = this.getEncoder(model);
    const tokens = encoder.encode(text);
    const truncatedTokens = tokens.slice(0, limit);
    const decodedBytes = encoder.decode(truncatedTokens);
    return new TextDecoder().decode(decodedBytes);
  }

  public dispose(): void {
    this.encoders.forEach((encoder) => {
      encoder.free();
    });
    this.encoders.clear();
    if (this.cache) {
      this.cache.clear();
    }
  }
}

// Singleton instance for convenience
export const tokenCounter = new Tokenizer();
