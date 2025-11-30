import { LRUCache } from "lru-cache";
import type { CrawlResult } from "../core/types";
import { normalizeUrl } from "../utils/url";

/**
 * Simple in-memory cache for crawl results using LRU strategy.
 * Can be extended to support persistent storage (Redis, FS) in the future.
 */
export class CacheManager {
  private cache: LRUCache<string, CrawlResult>;

  constructor(size: number = 1000) {
    this.cache = new LRUCache({
      max: size,
      // Optional: TTL (Time To Live)
      ttl: 1000 * 60 * 60, // 1 hour default
    });
  }

  /**
   * Retrieves a cached result by URL.
   */
  get(url: string): CrawlResult | undefined {
    const normalizedKey = normalizeUrl(url);
    return this.cache.get(normalizedKey);
  }

  /**
   * Stores a crawl result.
   */
  set(url: string, result: CrawlResult): void {
    const normalizedKey = normalizeUrl(url);
    this.cache.set(normalizedKey, result);
  }

  /**
   * Checks if a URL is in the cache.
   */
  has(url: string): boolean {
    const normalizedKey = normalizeUrl(url);
    return this.cache.has(normalizedKey);
  }

  /**
   * Clears the cache.
   */
  clear(): void {
    this.cache.clear();
  }
}
